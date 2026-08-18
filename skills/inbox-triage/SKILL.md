---
name: Inbox Triage
description: Check a Microsoft 365 inbox for email that needs a personal reply
  and push a phone notification. Leaves all mail unread. Built for unattended
  recurring automation.
allowed-tools:
  - Bash
  - Read
  - PushNotification
argument-hint: check | run [--since-minutes N] | dry-run [--since-minutes N] | state
createdAt: 2026-07-28T11:38:18.279Z
createdBy: gjones
createdByName: Gary Jones
createdById: user_1767620328397_iectw4bix
updatedAt: 2026-07-28T22:27:04.749Z
updatedBy: gjones
updatedByName: Gary Jones
updatedById: user_1767620328397_iectw4bix
---
# Inbox Triage Skill

Poll a Microsoft 365 mailbox, decide which messages genuinely need a human
reply, and send one push notification. Designed to run unattended on a
schedule, where nobody is watching the output.

**The mailbox is never modified.** Every Graph call is a GET, and the app
registration holds only `Mail.Read` (Application). Read state is writable
only via `PATCH`, which requires `Mail.ReadWrite` — a permission this app
must not be granted. Leaving mail unread is therefore structural, not a
convention that can be accidentally broken.

## Prerequisites

Configure these as **environment secrets** in CoderFlow settings:

| Variable | Description |
|----------|-------------|
| `M365_TENANT_ID` | Directory (tenant) ID, or a verified domain such as `hawthorncs.com` |
| `M365_CLIENT_ID` | Application (client) ID of the Azure app registration |
| `M365_CLIENT_SECRET` | Client secret value |
| `M365_MAILBOX` | Mailbox to read, e.g. `gary.jones@hawthorncs.com` |

First-time Azure setup — app registration, admin consent, and restricting the
app to a single mailbox — is in `references/azure-setup.md`. Read it before
assuming a permission problem is a bug.

For notifications, configure Slack — the primary channel:

| Variable | Description |
|----------|-------------|
| `SLACK_BOT_TOKEN` | Bot token (`xoxb-…`) for the Slack app |
| `SLACK_DM_TARGET` | Who to DM: a member id (`U…`, or `W…` on Enterprise Grid) — preferred — or an email address, which costs two extra scopes |

Setup is in `references/slack-setup.md`. Optional additional channels, tried
in order if Slack is unavailable:

| Variable | Description |
|----------|-------------|
| `CODERFLOW_API_KEY` | CoderFlow API key, for push via `/api/push` |
| `TRIAGE_NOTIFY_EMAIL` | Address for the email backstop |

## Commands

### `check`

Validate configuration end to end. Confirms the secrets are present, acquires
a token, reads the inbox folder, and verifies that a write **is refused**.

```bash
python3 ~/.claude/skills/inbox-triage/graph_mail.py check
```

Run this first whenever something looks wrong. A `403` on the write probe is
the desired outcome and is reported as such.

### `run` — the main flow

This is what the scheduled automation invokes. Work through it in order.

**Step 1 — fetch.**

```bash
python3 ~/.claude/skills/inbox-triage/graph_mail.py list --with-headers
```

Add `--since-minutes N` to override the lookback used when no watermark
exists yet. Add `--include-body` if previews are too thin to judge intent;
prefer not to, as it costs one extra Graph call per message.

The script handles windowing itself: it resumes from a stored watermark,
overlaps slightly so nothing slips through, and drops anything already
triaged in an earlier run. Messages in the output are new since last time.

**Step 2 — triage.** Apply the rubric below to each message. Decide NOTIFY or
IGNORE. Do not notify per message; collect the NOTIFY set.

**Step 3 — notify.** If the NOTIFY set is empty, **send nothing at all** and
say so in your output. Silence is the correct result for most runs and is what
keeps the notifications worth reading.

Otherwise send **exactly one** notification for the whole run — a single DM
listing everything, never one per email.

Write a payload file and pass it to `notify.py`:

```bash
cat > /tmp/triage.json <<'JSON'
{
  "summary": "2 emails need a reply",
  "items": [
    {"from_name": "Sarah Webb", "from_org": "Acme Corp",
     "subject": "Re: contract renewal - can you confirm pricing?",
     "why": "wants confirmation by Friday",
     "web_link": "<web_link from the fetch output>"}
  ]
}
JSON
python3 ~/.claude/skills/inbox-triage/notify.py --payload /tmp/triage.json
```

Field notes:

- **`summary`** becomes the bold header *and* the phone lockscreen preview.
  Make it count: `2 emails need a reply`, not `Triage complete`.
- **`why`** is the one thing that makes this worth reading — the specific ask
  and any deadline. `wants confirmation by Friday` earns a glance;
  `needs attention` does not.
- **`web_link`** comes straight from the fetch output and renders as an *Open*
  button that jumps to the email. Always include it; tapping through is the
  whole point.
- **`from_org`** should be a readable company name where you can tell
  (`Acme Corp`), or `internal` for colleagues.

Prefer this payload form over `--message`, which exists only for simple cases
and loses the links.

`notify.py` tries Slack, then CoderFlow push, then email, and exits non-zero
having reported every channel's failure. **Check its exit status** — a failed
notification with a successful commit means that email is never mentioned
again.

> **Never use the `PushNotification` tool as the automation's channel.** It
> reaches the phone only while Remote Control is actively paired with a live
> session. In a scheduled run it returns "Mobile push not sent (Remote Control
> inactive)" — a *success-shaped* result that delivers nothing, so the failure
> stays invisible until someone notices the alerts stopped. Use it only as an
> extra when a human is demonstrably at the terminal.

**Step 4 — commit.** Pass `suggested_watermark` from the step 1 output and the
ids of **every** message you triaged, not just the notified ones — otherwise
the ignored mail gets re-evaluated on every future run.

```bash
python3 ~/.claude/skills/inbox-triage/graph_mail.py commit \
  --watermark "<suggested_watermark>" --seen <id1> <id2> <id3>
```

Commit when nothing was notified, too — those messages were still judged.

**But do not commit a message you failed to notify about.** If `notify.py`
exited non-zero, commit only the ids you decided to IGNORE, and leave the
NOTIFY ids out of `--seen` so the next run picks them up again. Committing
after a failed send is the one mistake that loses an email permanently:
marked seen, never delivered, never mentioned again. If the send failed,
say so prominently in your output.

**Step 5 — report.** Briefly list what you notified and what you ignored,
with the reason for each ignore. In an unattended run this is the only audit
trail of a decision to stay silent.

### `dry-run`

Steps 1, 2 and 5 only. No notification, no commit — so state is untouched and
the run is repeatable. Use this to tune the rubric against a real inbox.

### `state`

```bash
python3 ~/.claude/skills/inbox-triage/graph_mail.py state-show
python3 ~/.claude/skills/inbox-triage/graph_mail.py state-reset
```

`state-reset` clears the watermark and the seen set; the next `run` falls back
to `--since-minutes`. Resetting can cause one round of repeat notifications.

## Triage rubric

The question is not "is this email important?" — it is **"is this waiting on
Gary to write back?"** An email can matter a great deal and still need no
notification, because there is nothing to do about it right now.

### NOTIFY when a real person is waiting on a response

Signals that point to NOTIFY:

- **A customer or external contact wrote personally.** Questions, quotes,
  contracts, complaints, scheduling, anything where silence reads as rude.
- **A colleague asked directly** for a decision, review, approval, sign-off,
  or information.
- **There is an explicit ask or deadline** — a question mark aimed at Gary,
  "can you", "please confirm", "by Friday", "let me know", "waiting on you".
- **A thread Gary is part of has moved** and the latest message puts the ball
  in his court.
- **`importance: high` from a human**, or an escalation, outage, or complaint.
- **A meeting invitation or change that needs an accept/decline or a reply.**

### IGNORE — informational, bulk, or automated

Signals that point to IGNORE, most reliable first:

- **`has_list_unsubscribe` or `has_list_id`, or `is_bulk_precedence`** —
  newsletters, marketing, mailing lists, product announcements. These are the
  strongest signals available; trust them.
- **`is_auto_submitted`** — generated by a machine, not typed by a person.
- **`bulk_localpart`** (`noreply@`, `notifications@`, `mailer@`, `billing@`)
  with no personal ask.
- **System and service mail** — CI builds, monitoring, backups, cron output,
  password expiry, licence renewals, cloud billing.
- **Transactional receipts** — orders, shipping, invoices, payment
  confirmations, calendar reminders, statements. Note that a *human* chasing
  an unpaid invoice is a NOTIFY; the automated statement is not.
- **Social and platform notifications** — LinkedIn, GitHub, Jira, Confluence,
  Slack digests. Even when a person's name is attached, these are activity
  feeds, and Gary sees them in the tool itself.
- **`cc_only` with a high `recipient_count` and no direct ask** — an FYI
  blast. Being on Cc is usually a hint that a reply is not expected.
- **Out-of-office auto-replies, read receipts, delivery reports.**
- **Spam, cold sales outreach, recruiter spam.** Nobody is owed a reply.

### Judgement calls

- **`is_read: true` means Gary has already opened it** in Outlook, so he knows
  it exists — do not notify. By default the fetch only returns unread mail, so
  this only arises with `--include-read`.
- **Trust headers over tone.** Marketing copy is written to read like a
  personal note. `List-Unsubscribe` is not. When the prose says "quick
  question for you, Gary" but the headers say bulk mailing list, it is bulk.
- **A named human at a real company beats a generic sender**, but check the
  reply-to and recipient count — a mail merge to 400 people is not personal.
- **When genuinely torn**, ask what happens if it waits until Gary next opens
  Outlook. If the answer is "nothing much", ignore it.

### Which way to err

The two failure modes are not symmetrical, and they are not the same in both
directions:

- **A real person addressed Gary directly and you cannot tell whether they
  need a reply → NOTIFY.** A missed customer email is the failure this whole
  automation exists to prevent.
- **The sender is bulk or automated and you are unsure → IGNORE.** No amount
  of uncertainty makes a newsletter worth a phone buzz.

Notifications only work while they are trusted. A few false positives are
survivable; a steady trickle of pointless buzzing gets the whole thing muted,
which is a total failure. Bias toward silence for bulk mail and toward
speaking up for humans.

## Operational notes

- **Throttling.** Graph allows 10,000 requests per 10 minutes and **4
  concurrent requests** per app-and-mailbox pair. Polling uses a handful of
  requests, so the only real risk is parallelism — keep fetches sequential.
  The script honours `Retry-After` on 429 and backs off on 5xx.
- **Permission changes take 30 minutes to 2 hours** to take effect. After
  editing consent or scoping, do not debug for two hours — use
  `Test-ApplicationAccessPolicy` or `Test-ServicePrincipalAuthorization`,
  which bypass the cache.
- **Message ids** are requested as immutable ids, so they survive the message
  being moved between folders and stay valid for dedup.
- **Never add `Mail.ReadWrite` or `Mail.Send`** to this app registration to
  make something easier. Read-only is the guarantee the skill rests on.
- **If authentication fails, stop and report it.** Do not fall back to IMAP,
  another credential, or a different mailbox. Basic auth for IMAP/POP is
  permanently removed from Exchange Online and app passwords do not work —
  a failure here is a configuration problem to fix, not to work around.
- **Slack delivery.** `notify.py --verify` checks the bot token via
  `auth.test`, which needs no scopes, so it separates "is the token valid" from
  "does the app have permission". Slack returns HTTP 200 with `ok: false` for
  logical failures, so the script checks `ok` rather than the status code.
- **If Slack pushes feel late, it is a client setting, not a bug.** By default
  Slack holds mobile notifications until roughly a minute after the desktop
  screen locks, or ten minutes after cursor activity stops. See
  `references/slack-setup.md`. Do Not Disturb suppresses them entirely and
  cannot be overridden through the API.
- **Do not paste tokens, secrets, or full message bodies** into notifications,
  summaries, or logs. Sender, subject, and the gist are enough.
