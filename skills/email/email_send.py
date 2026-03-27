#!/usr/bin/env python3
"""
Email sending helper for Claude Code email skill.

Uses environment variables:
  EMAIL_SERVER    - SMTP server hostname
  EMAIL_PORT      - SMTP port (typically 587 for STARTTLS)
  EMAIL_USER      - SMTP username / sender email
  EMAIL_PASS      - SMTP password
  EMAIL_FROM_NAME - (optional) Display name for From field

Input: JSON via first argument, file (@path), or stdin (-)

JSON schema:
{
  "to":          "addr" or ["addr1", "addr2"],
  "cc":          "addr" or ["addr1", "addr2"],
  "bcc":         "addr" or ["addr1", "addr2"],
  "subject":     "string",
  "body":        "string (plain text or HTML)",
  "html":        true/false (default: true),
  "reply_to":    "addr",
  "from_name":   "Display Name",
  "attachments": ["path1", "https://url", ...]
}
"""

import json
import mimetypes
import os
import smtplib
import ssl
import sys
import tempfile
import urllib.parse
import urllib.request
import urllib.error
from email import encoders
from email.mime.base import MIMEBase
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid


def load_input():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No input provided. Pass JSON as argument, @file, or -"}))
        sys.exit(1)
    raw = sys.argv[1]
    if raw == "-":
        raw = sys.stdin.read()
    elif raw.startswith("@"):
        with open(raw[1:], "r") as f:
            raw = f.read()
    return json.loads(raw)


def normalize_list(value):
    if value is None:
        return []
    if isinstance(value, str):
        return [v.strip() for v in value.split(",") if v.strip()]
    if isinstance(value, list):
        return [v.strip() for v in value if v.strip()]
    return []


def fetch_url_to_temp(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "EmailSkill/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            cd = resp.headers.get("Content-Disposition", "")
            if "filename=" in cd:
                filename = cd.split("filename=")[-1].strip("\"'")
            else:
                filename = os.path.basename(
                    urllib.request.url2pathname(urllib.parse.urlparse(url).path)
                ) or "attachment"
            tmp = tempfile.NamedTemporaryFile(delete=False, prefix="email_attach_")
            tmp.write(resp.read())
            tmp.close()
            return tmp.name, filename
    except Exception as e:
        raise RuntimeError(f"Failed to download attachment from {url}: {e}")


def attach_file(msg, filepath, filename=None):
    if not os.path.isfile(filepath):
        raise FileNotFoundError(f"Attachment not found: {filepath}")
    if filename is None:
        filename = os.path.basename(filepath)
    content_type, _ = mimetypes.guess_type(filepath)
    if content_type is None:
        content_type = "application/octet-stream"
    maintype, subtype = content_type.split("/", 1)
    with open(filepath, "rb") as f:
        part = MIMEBase(maintype, subtype)
        part.set_payload(f.read())
        encoders.encode_base64(part)
        part.add_header("Content-Disposition", "attachment", filename=filename)
        msg.attach(part)


def send_email(data):
    # Validate environment
    required_vars = ["EMAIL_SERVER", "EMAIL_PORT", "EMAIL_USER", "EMAIL_PASS"]
    missing = [v for v in required_vars if not os.environ.get(v)]
    if missing:
        return {"success": False, "error": f"Missing environment variables: {', '.join(missing)}"}

    server_host = os.environ["EMAIL_SERVER"]
    server_port = int(os.environ["EMAIL_PORT"])
    username = os.environ["EMAIL_USER"]
    password = os.environ["EMAIL_PASS"]
    default_from_name = os.environ.get("EMAIL_FROM_NAME", "")

    # Validate required fields
    for field in ("to", "subject", "body"):
        if not data.get(field):
            return {"success": False, "error": f"Missing required field: '{field}'"}

    # Parse recipients
    to_addrs = normalize_list(data["to"])
    cc_addrs = normalize_list(data.get("cc"))
    bcc_addrs = normalize_list(data.get("bcc"))
    all_recipients = to_addrs + cc_addrs + bcc_addrs

    if not all_recipients:
        return {"success": False, "error": "No valid recipients"}

    # Build message
    is_html = data.get("html", True)
    msg = MIMEMultipart("mixed")

    # From
    from_name = data.get("from_name", default_from_name)
    msg["From"] = formataddr((from_name, username)) if from_name else username

    # Recipients
    msg["To"] = ", ".join(to_addrs)
    if cc_addrs:
        msg["Cc"] = ", ".join(cc_addrs)
    # BCC intentionally NOT in headers

    msg["Subject"] = data["subject"]
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(
        domain=username.split("@")[-1] if "@" in username else "local"
    )

    if data.get("reply_to"):
        msg["Reply-To"] = data["reply_to"]

    # Body
    msg.attach(MIMEText(data["body"], "html" if is_html else "plain", "utf-8"))

    # Attachments
    temp_files = []
    attachment_names = []
    if data.get("attachments"):
        for att in data["attachments"]:
            try:
                if att.startswith("http://") or att.startswith("https://"):
                    tmp_path, filename = fetch_url_to_temp(att)
                    temp_files.append(tmp_path)
                    attach_file(msg, tmp_path, filename)
                    attachment_names.append(filename)
                else:
                    attach_file(msg, att)
                    attachment_names.append(os.path.basename(att))
            except Exception as e:
                for tf in temp_files:
                    try: os.unlink(tf)
                    except OSError: pass
                return {"success": False, "error": f"Attachment error: {e}"}

    # Send
    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(server_host, server_port, timeout=30) as smtp:
            smtp.ehlo()
            smtp.starttls(context=context)
            smtp.ehlo()
            smtp.login(username, password)
            smtp.sendmail(username, all_recipients, msg.as_string())

        result = {
            "success": True,
            "message": "Email sent successfully",
            "details": {
                "from": msg["From"],
                "to": to_addrs,
                "subject": data["subject"],
            }
        }
        if cc_addrs:
            result["details"]["cc"] = cc_addrs
        if bcc_addrs:
            result["details"]["bcc"] = bcc_addrs
        if attachment_names:
            result["details"]["attachments"] = attachment_names
        if data.get("reply_to"):
            result["details"]["reply_to"] = data["reply_to"]
        return result

    except smtplib.SMTPAuthenticationError as e:
        return {"success": False, "error": f"Authentication failed: {e}"}
    except smtplib.SMTPRecipientsRefused as e:
        return {"success": False, "error": f"Recipients refused: {e}"}
    except smtplib.SMTPException as e:
        return {"success": False, "error": f"SMTP error: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Unexpected error: {e}"}
    finally:
        for tf in temp_files:
            try: os.unlink(tf)
            except OSError: pass


def main():
    try:
        data = load_input()
    except json.JSONDecodeError as e:
        print(json.dumps({"success": False, "error": f"Invalid JSON input: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))
        sys.exit(1)

    result = send_email(data)
    print(json.dumps(result, indent=2))
    if not result.get("success"):
        sys.exit(1)


if __name__ == "__main__":
    main()
