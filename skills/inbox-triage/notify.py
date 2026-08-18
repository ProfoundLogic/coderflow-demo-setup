#!/usr/bin/env python3
"""Send a triage notification through whichever channel works unattended.

Channel notes, because this is the part that quietly breaks:

  slack  DM via chat.postMessage with a bot token. Preferred: bot tokens do
         not expire, delivery is confirmed by `ok` in the response body, and
         the message can carry a tap-through link to each email.

  push   POST to the CoderFlow server's /api/push. Needs CODERFLOW_API_KEY
         and its request contract is unconfirmed.

  email  SMTP via the existing `email` skill. Always available as a backstop.

  agent  The harness PushNotification tool. NOT implemented here on purpose:
         it reaches the phone only while Remote Control is actively paired,
         and otherwise reports a success-shaped "not sent" while delivering
         nothing. Unusable for unattended runs.

Input is either a one-line --message, or a JSON payload (--payload) so that
richer channels can render something actionable:

  {
    "summary": "2 emails need a reply",
    "items": [
      {"from_name": "Sarah Webb", "from_org": "acmecorp.com",
       "subject": "Re: contract renewal - can you confirm pricing?",
       "why": "wants confirmation by Friday",
       "web_link": "https://outlook.office365.com/..."}
    ]
  }
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

EMAIL_SEND = os.path.expanduser("~/.claude/skills/email/email_send.py")
SLACK_API = "https://slack.com/api"
DEFAULT_TITLE = "Email needs your attention"

# Slack hard-caps section text at 3000 chars; stay well under it.
SECTION_LIMIT = 2800
FALLBACK_LIMIT = 250
# Slack rejects a message with more than 50 blocks. One block per email plus a
# header means a busy morning could otherwise blow the cap and deliver nothing.
MAX_ITEMS = 20
# Errors worth retrying. Slack documents BOTH spellings of the rate-limit
# error -- `ratelimited` platform-wide and `rate_limited` on chat.postMessage
# -- so match both rather than guessing which one arrives.
RETRYABLE = {
    "ratelimited",
    "rate_limited",
    "internal_error",
    "fatal_error",
    "service_unavailable",
}


class NotifyError(RuntimeError):
    pass


# ---------------------------------------------------------------------------
# payload handling


def load_payload(args):
    if args.payload:
        raw = sys.stdin.read() if args.payload == "-" else open(args.payload).read()
        data = json.loads(raw)
        if not data.get("summary"):
            raise NotifyError("payload needs a 'summary'")
        return data
    if args.message:
        return {"summary": args.message, "items": []}
    raise NotifyError("provide --message or --payload")


def flatten(payload, limit=FALLBACK_LIMIT):
    """Render the payload as one line, for channels without rich formatting.

    Also used as Slack's top-level `text`, which is what the phone lockscreen
    and notification centre display when blocks are present.
    """
    summary = payload["summary"]
    bits = []
    for item in payload.get("items") or []:
        who = item.get("from_name") or item.get("from_address") or "unknown"
        subj = (item.get("subject") or "").strip()
        bits.append(f"{who} re {subj}" if subj else who)

    line = summary if not bits else f"{summary}: " + "; ".join(bits)
    if len(line) > limit:
        line = line[: limit - 1].rstrip() + "…"
    return line


def _mrkdwn_escape(text):
    # Slack mrkdwn only needs these three escaped; doing more mangles subjects.
    return (
        (text or "")
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
    )


def build_blocks(payload, use_buttons=True):
    """Build Block Kit blocks: a header line, then one section per email.

    `use_buttons` renders each email's link as an Open button. Whether a
    url-only button requires the app to have Interactivity enabled is not
    documented either way, so a caller that gets `invalid_blocks` back can
    retry with use_buttons=False to fall back to inline mrkdwn links, which
    need no interactivity at all.
    """
    blocks = [
        {
            "type": "section",
            "text": {"type": "mrkdwn", "text": f"*{_mrkdwn_escape(payload['summary'])}*"},
        }
    ]

    items = payload.get("items") or []
    shown, overflow = items[:MAX_ITEMS], max(0, len(items) - MAX_ITEMS)

    for item in shown:
        who = _mrkdwn_escape(item.get("from_name") or item.get("from_address") or "Unknown")
        org = _mrkdwn_escape(item.get("from_org") or "")
        subject = _mrkdwn_escape(item.get("subject") or "(no subject)")
        why = _mrkdwn_escape(item.get("why") or "")
        link = item.get("web_link")

        heading = f"*{who}*" + (f"  ·  _{org}_" if org else "")
        # Slack mrkdwn uses <url|label>, not markdown's [label](url).
        subject_line = (
            f"<{link}|{subject}>" if link and not use_buttons else subject
        )
        body = f"{heading}\n{subject_line}"
        if why:
            body += f"\n_{why}_"

        section = {
            "type": "section",
            "text": {"type": "mrkdwn", "text": body[:SECTION_LIMIT]},
        }
        if link and use_buttons:
            section["accessory"] = {
                "type": "button",
                "text": {"type": "plain_text", "text": "Open"},
                "url": link,
            }
        blocks.append(section)

    if overflow:
        blocks.append(
            {
                "type": "context",
                "elements": [
                    {"type": "mrkdwn", "text": f"_+{overflow} more not shown_"}
                ],
            }
        )

    return blocks


# ---------------------------------------------------------------------------
# Slack


def slack_available():
    return bool(os.environ.get("SLACK_BOT_TOKEN", "").strip()) and bool(
        os.environ.get("SLACK_DM_TARGET", "").strip()
    )


def _slack_call(method, token, payload=None, params=None, http_method="POST"):
    """Call a Slack Web API method, retrying only what is safe to retry."""
    url = f"{SLACK_API}/{method}"
    delay = 2.0

    for attempt in range(1, 5):
        headers = {"Authorization": f"Bearer {token}"}
        target, data = url, None
        if http_method == "GET":
            target = url + "?" + urllib.parse.urlencode(params or {})
        else:
            headers["Content-Type"] = "application/json; charset=utf-8"
            data = json.dumps(payload or {}).encode()

        req = urllib.request.Request(target, data=data, method=http_method, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                body = json.load(resp)
        except urllib.error.HTTPError as exc:
            if exc.code == 429:
                wait = _retry_after(exc, delay)
                print(f"  Slack rate limited; waiting {wait:.0f}s", file=sys.stderr)
                time.sleep(wait)
                delay = min(delay * 2, 60)
                continue
            raise NotifyError(f"{method}: HTTP {exc.code}") from None
        except urllib.error.URLError as exc:
            raise NotifyError(f"{method}: cannot reach Slack ({exc.reason})") from None

        # Slack returns HTTP 200 even for application errors, so `ok` is the
        # only real success signal -- never branch on the status code alone.
        if body.get("ok"):
            return body

        error = body.get("error", "unknown")
        if error in RETRYABLE and attempt < 4:
            print(f"  Slack: {error}; retrying in {delay:.0f}s", file=sys.stderr)
            time.sleep(delay)
            delay = min(delay * 2, 60)
            continue
        raise NotifyError(f"{method}: {_slack_hint(error, body)}")

    raise NotifyError(f"{method}: exhausted retries")


def _retry_after(exc, fallback):
    raw = exc.headers.get("Retry-After") if exc.headers else None
    if raw:
        try:
            return max(1.0, float(raw))
        except ValueError:
            pass
    return fallback


def _slack_hint(error, body=None):
    hints = {
        "invalid_auth": "token rejected -- check SLACK_BOT_TOKEN",
        "not_authed": "no token was sent",
        "token_revoked": "token revoked -- the app was uninstalled; reinstall it",
        "token_expired": "token expired -- token rotation is enabled on this app",
        "account_inactive": (
            "the bot's token belongs to a deleted user or workspace. This also "
            "happens when the person who installed the app is deactivated"
        ),
        "channel_not_found": (
            "SLACK_DM_TARGET is not a valid target, or the app lacks permission "
            "to DM them. Use a member id (U... or W...), copied from the user's "
            "Slack profile via More > Copy member ID"
        ),
        "messages_tab_disabled": (
            "the app's App Home Messages tab is off, so it cannot receive DMs. "
            "Enable it in app settings (manifest: messages_tab_enabled: true)"
        ),
        "users_not_found": "no Slack user has that email address",
        "missing_scope": "the app lacks a required OAuth scope",
        "invalid_blocks": "Slack rejected the blocks",
        "msg_blocks_too_long": "the blocks payload is too large",
        "no_permission": "the token lacks permission for this action",
        "restricted_action": "a workspace preference blocks posting",
        "app_access_restricted": "an admin has restricted this app",
        "ekm_access_denied": "admins have disabled messages to this conversation",
        "org_login_required": "the workspace is mid enterprise-migration; retry later",
    }
    text = f"{error} -- {hints[error]}" if error in hints else error
    # missing_scope returns these as siblings of `error`, and they say exactly
    # what to add, so surfacing them turns a vague failure into a fix.
    if body and error == "missing_scope":
        need, have = body.get("needed"), body.get("provided")
        if need:
            text += f" (needed: {need}; provided: {have})"
    return text


def resolve_target(token, target):
    """Turn SLACK_DM_TARGET into something chat.postMessage accepts.

    A member id is passed straight through -- Slack opens the DM itself when
    given one as `channel`, so no conversations.open call (and no im:write
    scope) is needed. Member ids start with U or W; W appears on Enterprise
    Grid, so do not validate on U alone.

    An email address is resolved via users.lookupByEmail, which needs both
    users:read.email and users:read. Prefer configuring the member id
    directly: it keeps the app down to a single scope, which matters when a
    workspace admin has to approve the install.
    """
    target = target.strip()
    if "@" in target:
        body = _slack_call(
            "users.lookupByEmail", token, params={"email": target}, http_method="GET"
        )
        return body["user"]["id"]
    return target


def send_slack(payload, dry_run=False):
    token = os.environ.get("SLACK_BOT_TOKEN", "").strip()
    target = os.environ.get("SLACK_DM_TARGET", "").strip()
    if not token or not target:
        raise NotifyError("SLACK_BOT_TOKEN and SLACK_DM_TARGET are required.")

    # Mobile push previews are built EXCLUSIVELY from the top-level `text`
    # field -- block content is never used on a phone. So this string has to
    # stand alone and front-load what matters. It is parsed as mrkdwn, so a
    # subject containing <...> must be escaped or Slack reads it as a link.
    #
    # Deliberately no username/icon_url/icon_emoji: sending those switches the
    # message to a legacy identity path where a U... channel is routed to the
    # user's DM with Slack itself rather than with this app.
    text = _mrkdwn_escape(flatten(payload))

    if dry_run:
        print(f"[dry-run] POST {SLACK_API}/chat.postMessage")
        print(
            "[dry-run] "
            + json.dumps(
                {"channel": target, "text": text, "blocks": build_blocks(payload)},
                indent=2,
            )
        )
        return "dry-run"

    channel = resolve_target(token, target)

    # Try buttons first, then degrade to inline links rather than lose the
    # notification entirely if the workspace rejects the button blocks.
    for use_buttons in (True, False):
        try:
            body = _slack_call(
                "chat.postMessage",
                token,
                {
                    "channel": channel,
                    "text": text,
                    "blocks": build_blocks(payload, use_buttons=use_buttons),
                },
            )
            suffix = "" if use_buttons else ", inline links"
            return f"slack (channel {body.get('channel')}, ts {body.get('ts')}{suffix})"
        except NotifyError as exc:
            recoverable = "invalid_blocks" in str(exc) or "msg_blocks_too_long" in str(exc)
            if use_buttons and recoverable:
                print(f"  {exc}; retrying without buttons", file=sys.stderr)
                continue
            raise

    raise NotifyError("chat.postMessage: could not render an acceptable message")


def verify_slack():
    """Confirm the token works, using a method that needs no scopes."""
    token = os.environ.get("SLACK_BOT_TOKEN", "").strip()
    if not token:
        raise NotifyError("SLACK_BOT_TOKEN is not set.")
    body = _slack_call("auth.test", token)
    return {
        "team": body.get("team"),
        "bot_user": body.get("user"),
        "user_id": body.get("user_id"),
        "bot_id": body.get("bot_id"),
    }


# ---------------------------------------------------------------------------
# CoderFlow push


def push_available():
    return bool(os.environ.get("CODERFLOW_API_KEY", "").strip()) and bool(
        os.environ.get("CODERFLOW_SERVER_URL", "").strip()
    )


def send_push(payload, dry_run=False):
    base = os.environ.get("CODERFLOW_SERVER_URL", "").rstrip("/")
    key = os.environ.get("CODERFLOW_API_KEY", "").strip()
    if not base or not key:
        raise NotifyError("CODERFLOW_SERVER_URL and CODERFLOW_API_KEY are required.")

    url = f"{base}/api/push"
    line = flatten(payload, 200)
    body = {"title": DEFAULT_TITLE, "message": line, "body": line}

    if dry_run:
        print(f"[dry-run] POST {url}")
        print(f"[dry-run] {json.dumps(body)}")
        return "dry-run"

    # The server documents "logged in or a valid API key" without naming the
    # header, and both conventions are common. Try each with the user's key.
    errors = []
    for header, value in (("Authorization", f"Bearer {key}"), ("X-API-Key", key)):
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode(),
            method="POST",
            headers={"Content-Type": "application/json", header: value},
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                return f"push ({header}, HTTP {resp.status})"
        except urllib.error.HTTPError as exc:
            detail = ""
            try:
                detail = exc.read().decode()[:160]
            except Exception:
                pass
            errors.append(f"{header}: {exc.code} {detail}")
            if exc.code not in (401, 403):
                break
        except urllib.error.URLError as exc:
            raise NotifyError(f"cannot reach {base}: {exc.reason}") from None

    raise NotifyError("push rejected -- " + "; ".join(errors))


# ---------------------------------------------------------------------------
# email backstop


def email_available():
    return os.path.exists(EMAIL_SEND) and bool(os.environ.get("EMAIL_SERVER", "").strip())


def send_email(payload, to, dry_run=False):
    if not to:
        raise NotifyError("no recipient: set TRIAGE_NOTIFY_EMAIL or pass --to")
    if not os.path.exists(EMAIL_SEND):
        raise NotifyError(f"email helper not found at {EMAIL_SEND}")

    rows = []
    for item in payload.get("items") or []:
        who = _html(item.get("from_name") or item.get("from_address") or "Unknown")
        subj = _html(item.get("subject") or "(no subject)")
        why = _html(item.get("why") or "")
        link = item.get("web_link")
        subj_html = f'<a href="{_html(link)}">{subj}</a>' if link else subj
        rows.append(
            f"<li><strong>{who}</strong><br>{subj_html}"
            + (f"<br><em>{why}</em>" if why else "")
            + "</li>"
        )

    body = f"<p><strong>{_html(payload['summary'])}</strong></p>"
    if rows:
        body += "<ul>" + "".join(rows) + "</ul>"

    msg = {"to": to, "subject": f"{DEFAULT_TITLE}: {payload['summary']}", "body": body}
    if dry_run:
        print(f"[dry-run] {EMAIL_SEND} <- {json.dumps(msg)[:400]}")
        return "dry-run"

    proc = subprocess.run(
        ["python3", EMAIL_SEND, json.dumps(msg)],
        capture_output=True,
        text=True,
        timeout=90,
    )
    if proc.returncode != 0:
        raise NotifyError(f"email_send.py failed: {proc.stderr.strip()[:300]}")
    try:
        result = json.loads(proc.stdout)
    except ValueError:
        raise NotifyError(f"unexpected email output: {proc.stdout[:200]}") from None
    if not result.get("success"):
        raise NotifyError(f"email not sent: {result.get('error')}")
    return "email"


def _html(text):
    return (
        (text or "").replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    )


# ---------------------------------------------------------------------------


def main():
    ap = argparse.ArgumentParser(description="Send a triage notification.")
    ap.add_argument("--message", help="one-line summary (simple form)")
    ap.add_argument("--payload", help="JSON file with summary+items, or - for stdin")
    ap.add_argument(
        "--channel",
        default="auto",
        choices=["auto", "slack", "push", "email"],
        help="auto tries slack, then push, then email",
    )
    ap.add_argument("--to", default=os.environ.get("TRIAGE_NOTIFY_EMAIL", ""))
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--verify",
        action="store_true",
        help="check the Slack token with auth.test and exit",
    )
    args = ap.parse_args()

    if args.verify:
        try:
            print(json.dumps(verify_slack(), indent=2))
            return 0
        except NotifyError as exc:
            print(f"ERROR: {exc}", file=sys.stderr)
            return 1

    try:
        payload = load_payload(args)
    except (NotifyError, ValueError, OSError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 2

    order = {
        "slack": ["slack"],
        "push": ["push"],
        "email": ["email"],
        "auto": ["slack", "push", "email"],
    }[args.channel]

    checks = {"slack": slack_available, "push": push_available, "email": email_available}
    unset = {
        "slack": "SLACK_BOT_TOKEN / SLACK_DM_TARGET not set",
        "push": "CODERFLOW_API_KEY not set",
        "email": "EMAIL_* secrets not configured",
    }

    problems = []
    for channel in order:
        if not checks[channel]():
            problems.append(f"{channel}: {unset[channel]}")
            continue
        try:
            if channel == "slack":
                via = send_slack(payload, args.dry_run)
            elif channel == "push":
                via = send_push(payload, args.dry_run)
            else:
                via = send_email(payload, args.to, args.dry_run)
            print(json.dumps({"sent": True, "via": via}))
            return 0
        except NotifyError as exc:
            problems.append(f"{channel}: {exc}")

    print(json.dumps({"sent": False, "problems": problems}, indent=2), file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
