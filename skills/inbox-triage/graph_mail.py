#!/usr/bin/env python3
"""Read-only Microsoft Graph mail fetcher for inbox triage.

Every request this script makes against Microsoft Graph is an HTTP GET, so
message read state is never altered. That is belt-and-braces: the Azure app
registration is expected to hold only Mail.Read (application), and `isRead`
is writable exclusively via PATCH, which requires Mail.ReadWrite. Without
that permission the mailbox physically cannot be marked read by this tool.

Commands:
  check          Validate configuration and connectivity.
  list           List candidate messages as JSON, newest first.
  state-show     Print the persisted watermark / notified-id state.
  commit         Advance the watermark and record notified message ids.
  state-reset    Clear persisted state.

Environment (configure as CoderFlow environment secrets):
  M365_TENANT_ID      Directory (tenant) ID, or a verified domain.
  M365_CLIENT_ID      Application (client) ID of the app registration.
  M365_CLIENT_SECRET  Client secret value.
  M365_MAILBOX        Mailbox to read, e.g. gary.jones@hawthorncs.com
"""

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone

GRAPH = "https://graph.microsoft.com/v1.0"
LOGIN = "https://login.microsoftonline.com"
SKILL_ID = "inbox-triage"
STATE_FILENAME = "state.json"
LOCAL_STATE = os.path.expanduser("~/.cache/inbox-triage/state.json")

# Keep well under Graph's per-mailbox cap of 4 concurrent requests by staying
# sequential; these bound how much work a single run will do.
MAX_ATTEMPTS = 5
SEEN_HISTORY = 400
WATERMARK_OVERLAP_MIN = 2

# Fields worth pulling for triage. Deliberately excludes `body` -- requesting
# full bodies for a whole page is a documented cause of HTTP 504 from Graph.
LIST_SELECT = [
    "id",
    "receivedDateTime",
    "subject",
    "from",
    "sender",
    "replyTo",
    "toRecipients",
    "ccRecipients",
    "bodyPreview",
    "isRead",
    "isDraft",
    "hasAttachments",
    "importance",
    "flag",
    "conversationId",
    "internetMessageId",
    "webLink",
]

BULK_LOCALPART = re.compile(
    r"(^|[.\-_])(no[.\-_]?reply|donotreply|do[.\-_]?not[.\-_]?reply|notifications?|"
    r"noreply|mailer|mailer[.\-_]?daemon|bounce[sd]?|postmaster|automated|autoreply|"
    r"newsletter|news|marketing|info|updates?|alerts?|support[.\-_]?bot|billing|invoice)"
    r"([.\-_]|$)",
    re.I,
)


class GraphError(RuntimeError):
    """A Graph or identity-platform call failed in a non-retryable way."""


# ---------------------------------------------------------------------------
# configuration


def env(name, required=True):
    value = os.environ.get(name, "").strip()
    if required and not value:
        raise GraphError(
            f"Environment variable {name} is not set. Configure it as a "
            f"CoderFlow environment secret."
        )
    return value


def mailbox():
    return env("M365_MAILBOX")


# ---------------------------------------------------------------------------
# auth


def get_token():
    """Acquire an app-only access token via the client credentials flow.

    This flow never returns a refresh token by design; tokens last ~60 minutes
    and we simply request a new one each run.
    """
    body = urllib.parse.urlencode(
        {
            "client_id": env("M365_CLIENT_ID"),
            "client_secret": env("M365_CLIENT_SECRET"),
            "scope": "https://graph.microsoft.com/.default",
            "grant_type": "client_credentials",
        }
    ).encode()

    url = f"{LOGIN}/{urllib.parse.quote(env('M365_TENANT_ID'))}/oauth2/v2.0/token"
    req = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    try:
        with urllib.request.urlopen(req, timeout=45) as resp:
            payload = json.load(resp)
    except urllib.error.HTTPError as exc:
        # Surface the AADSTS code, which is what actually identifies the
        # misconfiguration, but never echo the request body back.
        detail = _aad_error(exc)
        raise GraphError(f"Token request failed ({exc.code}): {detail}") from None
    except urllib.error.URLError as exc:
        raise GraphError(f"Cannot reach {LOGIN}: {exc.reason}") from None

    token = payload.get("access_token")
    if not token:
        raise GraphError("Token response contained no access_token.")
    return token


def _aad_error(exc):
    try:
        data = json.loads(exc.read().decode())
    except Exception:
        return exc.reason or "unknown error"
    desc = data.get("error_description") or data.get("error") or ""
    # error_description is multi-line and noisy; the first line has the code.
    first = desc.strip().splitlines()[0] if desc else ""
    return first or data.get("error", "unknown error")


# ---------------------------------------------------------------------------
# graph GET


def graph_get(url, token, prefer=None):
    """GET a Graph URL with throttling-aware retries.

    Only GET is implemented on purpose -- there is no code path in this script
    that can mutate the mailbox.
    """
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
        # Default message ids change when a message is moved between folders,
        # which would break id-based dedup the moment a rule files something.
        "Prefer": 'IdType="ImmutableId"',
    }
    if prefer:
        headers["Prefer"] = headers["Prefer"] + ", " + prefer

    delay = 2.0
    for attempt in range(1, MAX_ATTEMPTS + 1):
        req = urllib.request.Request(url, method="GET", headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.load(resp)
        except urllib.error.HTTPError as exc:
            retryable = exc.code == 429 or 500 <= exc.code < 600
            if not retryable or attempt == MAX_ATTEMPTS:
                raise GraphError(_graph_error(exc)) from None
            wait = _retry_after(exc, delay)
            print(
                f"  Graph returned {exc.code}; retrying in {wait:.0f}s "
                f"(attempt {attempt}/{MAX_ATTEMPTS})",
                file=sys.stderr,
            )
            time.sleep(wait)
            delay = min(delay * 2, 60)
        except urllib.error.URLError as exc:
            if attempt == MAX_ATTEMPTS:
                raise GraphError(f"Cannot reach Graph: {exc.reason}") from None
            time.sleep(delay)
            delay = min(delay * 2, 60)

    raise GraphError("Exhausted retries against Graph.")


def _retry_after(exc, fallback):
    raw = exc.headers.get("Retry-After") if exc.headers else None
    if raw:
        try:
            return max(1.0, float(raw))
        except ValueError:
            pass
    return fallback


def _graph_error(exc):
    try:
        data = json.loads(exc.read().decode())
        err = data.get("error", {})
        code = err.get("code", "")
        msg = err.get("message", "")
    except Exception:
        code, msg = "", exc.reason or ""

    hint = ""
    if exc.code == 403:
        hint = (
            " -- the app registration is missing admin-consented Mail.Read "
            "(Application), or an Application Access Policy / RBAC scope "
            "excludes this mailbox. Permission changes take 30 min to 2 h to "
            "take effect; use Test-ApplicationAccessPolicy to check without "
            "waiting."
        )
    elif exc.code == 401:
        hint = " -- token rejected; check tenant, client id and secret."
    elif code == "InefficientFilter":
        hint = (
            " -- $orderby properties must also appear in $filter, in the same "
            "order, before any non-ordered property."
        )
    elif code == "MailboxNotEnabledForRESTAPI":
        hint = " -- the target has no licensed Exchange Online mailbox."
    return f"{exc.code} {code}: {msg}{hint}"


# ---------------------------------------------------------------------------
# state


def _remote_state_url():
    base = os.environ.get("CODERFLOW_SERVER_URL", "").rstrip("/")
    task = os.environ.get("TASK_ID", "")
    if not base or not task:
        return None, None
    url = f"{base}/api/skill-management/skills/{SKILL_ID}/files/{STATE_FILENAME}"
    return url, task


def _remote_request(method, payload=None):
    url, task = _remote_state_url()
    if not url:
        return None
    data = json.dumps(payload).encode() if payload is not None else None
    headers = {"X-Task-Id": task}
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, method=method, headers=headers)
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode()
    return json.loads(raw) if raw.strip() else {}


def load_state():
    """Read persisted state, preferring host-backed storage.

    The local filesystem does not survive between automation runs, so the
    watermark lives as a supporting file of this skill on the CoderFlow host.
    A local file is used as a fallback so the script still works standalone.
    """
    try:
        body = _remote_request("GET")
        if body is not None:
            content = body.get("content", body) if isinstance(body, dict) else body
            if isinstance(content, str) and content.strip():
                return json.loads(content), "remote"
            if isinstance(content, dict):
                return content, "remote"
    except urllib.error.HTTPError as exc:
        if exc.code not in (403, 404):
            print(f"  Remote state unreadable ({exc.code}); using local.", file=sys.stderr)
    except Exception:
        pass

    try:
        with open(LOCAL_STATE) as fh:
            return json.load(fh), "local"
    except FileNotFoundError:
        return {}, "empty"
    except (OSError, ValueError):
        return {}, "empty"


def save_state(state):
    content = json.dumps(state, indent=2)
    where = []

    try:
        if _remote_request("PUT", {"content": content}) is not None:
            where.append("remote")
    except Exception as exc:
        print(f"  Could not persist remote state: {exc}", file=sys.stderr)

    try:
        os.makedirs(os.path.dirname(LOCAL_STATE), exist_ok=True)
        tmp = LOCAL_STATE + ".tmp"
        with open(tmp, "w") as fh:
            fh.write(content)
        os.replace(tmp, LOCAL_STATE)
        where.append("local")
    except OSError as exc:
        print(f"  Could not persist local state: {exc}", file=sys.stderr)

    return where


# ---------------------------------------------------------------------------
# message shaping


def _addr(entry):
    if not entry:
        return "", ""
    ea = entry.get("emailAddress") or {}
    return (ea.get("address") or "").lower(), ea.get("name") or ""


def _addrs(entries):
    return [_addr(e)[0] for e in (entries or []) if _addr(e)[0]]


def signals(msg, me):
    """Derive the cheap, mechanical hints that make triage reliable.

    Judgement stays with the caller; this only surfaces facts that are
    tedious or error-prone to eyeball from raw JSON.
    """
    from_addr, from_name = _addr(msg.get("from") or msg.get("sender"))
    to = _addrs(msg.get("toRecipients"))
    cc = _addrs(msg.get("ccRecipients"))
    me = me.lower()
    my_domain = me.split("@")[-1]
    sender_domain = from_addr.split("@")[-1] if "@" in from_addr else ""
    local = from_addr.split("@")[0] if "@" in from_addr else ""

    headers = {k.lower(): v for k, v in (msg.get("_headers") or {}).items()}
    auto_submitted = headers.get("auto-submitted", "").strip().lower()
    precedence = headers.get("precedence", "").strip().lower()

    return {
        "from_address": from_addr,
        "from_name": from_name,
        "sender_domain": sender_domain,
        "internal": bool(sender_domain) and sender_domain == my_domain,
        "addressed_directly": me in to,
        "cc_only": me in cc and me not in to,
        "recipient_count": len(to) + len(cc),
        "bulk_localpart": bool(local and BULK_LOCALPART.search(local)),
        "has_list_unsubscribe": "list-unsubscribe" in headers,
        "has_list_id": "list-id" in headers,
        "auto_submitted": auto_submitted or None,
        "is_auto_submitted": bool(auto_submitted and auto_submitted != "no"),
        "precedence": precedence or None,
        "is_bulk_precedence": precedence in ("bulk", "list", "junk"),
        "headers_available": bool(msg.get("_headers") is not None),
    }


def shape(msg, me):
    flag = (msg.get("flag") or {}).get("flagStatus")
    out = {
        "id": msg.get("id"),
        "received": msg.get("receivedDateTime"),
        "subject": msg.get("subject") or "(no subject)",
        "preview": (msg.get("bodyPreview") or "").strip(),
        "is_read": msg.get("isRead"),
        "has_attachments": msg.get("hasAttachments"),
        "importance": msg.get("importance"),
        "flag_status": flag,
        "conversation_id": msg.get("conversationId"),
        "internet_message_id": msg.get("internetMessageId"),
        "web_link": msg.get("webLink"),
        "to": _addrs(msg.get("toRecipients")),
        "cc": _addrs(msg.get("ccRecipients")),
        "reply_to": _addrs(msg.get("replyTo")),
        "signals": signals(msg, me),
    }
    if msg.get("_body") is not None:
        out["body_text"] = msg["_body"]
    return out


# ---------------------------------------------------------------------------
# fetching


def list_messages(token, since_iso, unread_only, top, max_messages):
    """List inbox messages received at/after since_iso, newest first.

    Clause order in $filter is load-bearing: Graph requires every $orderby
    property to appear in $filter before any property that is not ordered on,
    otherwise it fails with InefficientFilter.
    """
    filters = [f"receivedDateTime ge {since_iso}"]
    if unread_only:
        filters.append("isRead eq false")

    params = {
        "$filter": " and ".join(filters),
        "$orderby": "receivedDateTime desc",
        "$select": ",".join(LIST_SELECT),
        "$top": str(min(top, 1000)),
    }
    url = (
        f"{GRAPH}/users/{urllib.parse.quote(mailbox())}/mailFolders/inbox/messages?"
        + urllib.parse.urlencode(params, quote_via=urllib.parse.quote)
    )

    collected = []
    pages = 0
    while url and len(collected) < max_messages:
        body = graph_get(url, token)
        collected.extend(body.get("value", []))
        pages += 1
        # Graph returns the whole next-page URL; it must be used verbatim.
        url = body.get("@odata.nextLink")
        if pages >= 20:
            print("  Stopping after 20 pages.", file=sys.stderr)
            break

    return collected[:max_messages]


def enrich(token, messages, want_headers, want_body, body_chars):
    """Fetch headers and/or a plain-text body per message.

    Done one message at a time. The list endpoint is documented to return
    bodies in HTML regardless of the Prefer header, and asking for headers
    across a whole page bloats the payload, so both are per-message GETs.
    """
    select = []
    if want_headers:
        select.append("internetMessageHeaders")
    if want_body:
        select.append("body")
    if not select:
        return

    prefer = 'outlook.body-content-type="text"' if want_body else None
    for msg in messages:
        mid = urllib.parse.quote(msg.get("id", ""), safe="")
        url = (
            f"{GRAPH}/users/{urllib.parse.quote(mailbox())}/messages/{mid}"
            f"?$select={','.join(select)}"
        )
        try:
            body = graph_get(url, token, prefer=prefer)
        except GraphError as exc:
            print(f"  Could not enrich {msg.get('subject','?')!r}: {exc}", file=sys.stderr)
            continue

        if want_headers:
            msg["_headers"] = {
                h.get("name", ""): h.get("value", "")
                for h in (body.get("internetMessageHeaders") or [])
            }
        if want_body:
            content = ((body.get("body") or {}).get("content") or "").strip()
            if (body.get("body") or {}).get("contentType") == "html":
                content = re.sub(r"<[^>]+>", " ", content)
                content = re.sub(r"\s+", " ", content).strip()
            msg["_body"] = content[:body_chars]


# ---------------------------------------------------------------------------
# commands


def cmd_check(args):
    print("Configuration")
    missing = []
    for name in ("M365_TENANT_ID", "M365_CLIENT_ID", "M365_CLIENT_SECRET", "M365_MAILBOX"):
        present = bool(os.environ.get(name, "").strip())
        print(f"  {name:20} {'set' if present else 'MISSING'}")
        if not present:
            missing.append(name)
    if missing:
        print(f"\nFAIL: set {', '.join(missing)} as CoderFlow environment secrets.")
        return 1

    print(f"  mailbox              {mailbox()}")

    print("\nToken")
    token = get_token()
    print("  acquired app-only access token")

    print("\nMailbox read")
    url = (
        f"{GRAPH}/users/{urllib.parse.quote(mailbox())}/mailFolders/inbox"
        "?$select=displayName,totalItemCount,unreadItemCount"
    )
    folder = graph_get(url, token)
    print(
        f"  inbox '{folder.get('displayName')}': "
        f"{folder.get('totalItemCount')} items, "
        f"{folder.get('unreadItemCount')} unread"
    )

    print("\nWrite permission (want this to FAIL)")
    probe = (
        f"{GRAPH}/users/{urllib.parse.quote(mailbox())}/mailFolders/inbox/messages"
        "?$top=1&$select=id,isRead"
    )
    sample = graph_get(probe, token).get("value") or []
    if not sample:
        print("  inbox empty; cannot probe. Confirm the app lacks Mail.ReadWrite in Entra.")
    else:
        code = _probe_write(token, sample[0]["id"], sample[0].get("isRead", False))
        if code == 403:
            print("  403 on PATCH -- good: this app cannot mark mail as read.")
        elif code is None:
            print("  PATCH probe inconclusive (network error).")
        else:
            print(
                f"  WARNING: PATCH returned {code}, not 403. The app appears to hold "
                "Mail.ReadWrite. Remove it so read state cannot be altered."
            )

    state, origin = load_state()
    print(f"\nState ({origin})")
    print(f"  watermark      {state.get('watermark') or '(none)'}")
    print(f"  seen ids       {len(state.get('seen_ids') or [])}")

    print("\nOK")
    return 0


def _probe_write(token, message_id, current_is_read):
    """Deliberately attempt a no-op PATCH to prove it is rejected.

    Echoes isRead back with the value it already has, so that even in the
    unexpected case where the app does hold Mail.ReadWrite and the PATCH
    succeeds, the mailbox is left exactly as it was. Sending a hardcoded
    value here would risk flipping a read message to unread.
    """
    mid = urllib.parse.quote(message_id, safe="")
    url = f"{GRAPH}/users/{urllib.parse.quote(mailbox())}/messages/{mid}"
    req = urllib.request.Request(
        url,
        data=json.dumps({"isRead": bool(current_is_read)}).encode(),
        method="PATCH",
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.status
    except urllib.error.HTTPError as exc:
        return exc.code
    except urllib.error.URLError:
        return None


def resolve_since(args, state):
    if args.since:
        return args.since, "explicit"
    watermark = state.get("watermark")
    if watermark and not args.ignore_state:
        return watermark, "watermark"
    minutes = args.since_minutes
    stamp = datetime.now(timezone.utc) - timedelta(minutes=minutes)
    return stamp.strftime("%Y-%m-%dT%H:%M:%SZ"), f"last {minutes} min"


def cmd_list(args):
    state, origin = load_state()
    since, basis = resolve_since(args, state)
    token = get_token()

    raw = list_messages(
        token,
        since,
        unread_only=not args.include_read,
        top=args.top,
        max_messages=args.max,
    )

    already = set(state.get("seen_ids") or [])
    fresh = [m for m in raw if m.get("id") not in already]
    suppressed = len(raw) - len(fresh)

    enrich(token, fresh, args.with_headers, args.include_body, args.body_chars)
    shaped = [shape(m, mailbox()) for m in fresh]

    queried_at = datetime.now(timezone.utc)
    newest = max((m["received"] for m in shaped if m.get("received")), default=None)
    # Deliberately rewind the watermark by a small buffer. A message can be
    # delivered moments before the query without being indexed in time to
    # appear in it; the overlap means the next run still sees it, and the
    # seen_ids set keeps that overlap from causing a duplicate notification.
    suggested = (queried_at - timedelta(minutes=WATERMARK_OVERLAP_MIN)).strftime(
        "%Y-%m-%dT%H:%M:%SZ"
    )
    result = {
        "mailbox": mailbox(),
        "queried_at": queried_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "since": since,
        "since_basis": basis,
        "state_origin": origin,
        "unread_only": not args.include_read,
        "count": len(shaped),
        "suppressed_already_seen": suppressed,
        "newest_received": newest,
        "suggested_watermark": suggested,
        "messages": shaped,
    }
    json.dump(result, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


def cmd_commit(args):
    state, _ = load_state()
    seen = list(state.get("seen_ids") or [])
    seen.extend(i for i in (args.seen or []) if i not in seen)
    state["seen_ids"] = seen[-SEEN_HISTORY:]
    if args.watermark:
        state["watermark"] = args.watermark
    state["updated_at"] = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    where = save_state(state)
    print(
        json.dumps(
            {
                "persisted_to": where,
                "watermark": state.get("watermark"),
                "seen_ids": len(state["seen_ids"]),
            },
            indent=2,
        )
    )
    return 0 if where else 1


def cmd_state_show(args):
    state, origin = load_state()
    print(json.dumps({"origin": origin, "state": state}, indent=2))
    return 0


def cmd_state_reset(args):
    where = save_state({"watermark": None, "seen_ids": []})
    print(json.dumps({"reset": True, "persisted_to": where}, indent=2))
    return 0


def main():
    parser = argparse.ArgumentParser(
        description="Read-only Microsoft Graph inbox reader for triage."
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("check", help="validate config, auth and permissions")

    p = sub.add_parser("list", help="list candidate messages as JSON")
    p.add_argument("--since", help="ISO8601 UTC lower bound, e.g. 2026-07-28T09:00:00Z")
    p.add_argument(
        "--since-minutes",
        type=int,
        default=60,
        help="lookback window when no watermark exists (default 60)",
    )
    p.add_argument(
        "--ignore-state",
        action="store_true",
        help="ignore the stored watermark and use --since-minutes",
    )
    p.add_argument(
        "--include-read",
        action="store_true",
        help="also return messages already read in Outlook",
    )
    p.add_argument("--top", type=int, default=50, help="Graph page size (default 50)")
    p.add_argument("--max", type=int, default=100, help="max messages to return")
    p.add_argument(
        "--with-headers",
        action="store_true",
        help="fetch internet headers per message (List-Unsubscribe etc.)",
    )
    p.add_argument(
        "--include-body",
        action="store_true",
        help="fetch a plain-text body per message",
    )
    p.add_argument("--body-chars", type=int, default=2000, help="truncate bodies")

    p = sub.add_parser("commit", help="advance watermark / record evaluated ids")
    p.add_argument("--watermark", help="new ISO8601 watermark")
    p.add_argument(
        "--seen",
        nargs="*",
        help="ids of every message triaged this run, notified or not",
    )

    sub.add_parser("state-show", help="print persisted state")
    sub.add_parser("state-reset", help="clear persisted state")

    args = parser.parse_args()
    handlers = {
        "check": cmd_check,
        "list": cmd_list,
        "commit": cmd_commit,
        "state-show": cmd_state_show,
        "state-reset": cmd_state_reset,
    }
    try:
        return handlers[args.command](args)
    except GraphError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        return 130


if __name__ == "__main__":
    sys.exit(main())
