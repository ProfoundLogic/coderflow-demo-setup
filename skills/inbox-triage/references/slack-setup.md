# Slack setup for Inbox Triage

Creating a Slack app that DMs one person from an unattended script. About 5
minutes, assuming your workspace does not require admin approval for apps.

## Why a bot DM rather than a webhook

An incoming webhook looks simpler, but for this job it is not:

- **Its destination is fixed at install time and cannot be changed per
  message.** You cannot override the channel, username, or icon.
- **It is no more durable.** Neither a bot token nor a webhook URL expires on a
  clock, and both are revoked together when the app is uninstalled. A webhook
  is narrower in blast radius, not longer-lived.
- **Whether the install-time picker can even select a DM is barely
  documented.** Slack's webhook documentation is channel-centric throughout.

`chat.postMessage` with a bot token is the documented, first-class path, and it
needs exactly **one** scope. That single-scope footprint matters if an admin
has to approve the install.

If you would rather avoid installing an app at all, a reasonable alternative is
a webhook posting to a **private channel only you are in** — mobile push
behaves the same. You would lose per-message targeting, which this skill does
not need. Decide based on how much friction your Slack admin represents.

## Step 1 — create the app from a manifest

Go to <https://api.slack.com/apps> → **Create New App** → **From an app
manifest** → choose your workspace → paste this:

```yaml
_metadata:
  major_version: 2
  minor_version: 1

display_information:
  name: Inbox Triage
  description: Alerts me when an email needs a personal reply.
  background_color: "#2c2d30"

features:
  bot_user:
    display_name: Inbox Triage
    always_online: false
  app_home:
    home_tab_enabled: false
    # Required. Without this, chat.postMessage fails with
    # messages_tab_disabled. The default is not documented -- set it.
    messages_tab_enabled: true
    # One-way alerts; nothing reads replies.
    messages_tab_read_only_enabled: true

oauth_config:
  scopes:
    bot:
      # The only scope needed to DM a user by member id.
      - chat:write

settings:
  org_deploy_enabled: false
  socket_mode_enabled: false
  # Keep false. Rotation makes tokens expire every 12 hours, and it CANNOT
  # be switched off again once enabled.
  token_rotation_enabled: false
```

Note what is absent: no event subscriptions, no interactivity, no request URL.
An outbound-only notifier needs no public HTTPS endpoint.

## Step 2 — install and copy the token

**Install App** → **Install to Workspace** → **Allow**, then
**OAuth & Permissions** → copy the **Bot User OAuth Token** (`xoxb-…`).

Store it as the `SLACK_BOT_TOKEN` environment secret.

> If your workspace has *Require approved apps* enabled, installing raises a
> request an admin must approve, and approving an app means approving its
> scopes. This is why the manifest asks for only `chat:write`.

## Step 3 — get your member id

In Slack, click your own profile → **⋮ More** → **Copy member ID**. It looks
like `U01ABCDEFGH` (or `W…` on Enterprise Grid — both are valid).

Store it as `SLACK_DM_TARGET`.

You *can* instead set `SLACK_DM_TARGET` to an email address, and the script
will resolve it — but that needs two more scopes (`users:read.email` **and**
`users:read`, which Slack requires together). Hardcoding the id keeps the app
at one scope. Prefer the id.

## Step 4 — verify

```bash
python3 ~/.claude/skills/inbox-triage/notify.py --verify
```

`auth.test` needs no scopes, so this isolates "is the token valid" from "does
the app have permission". Expect the team name and bot user id.

Then a real DM:

```bash
python3 ~/.claude/skills/inbox-triage/notify.py --message "Inbox Triage test"
```

## Step 5 — fix your mobile notification timing

**Do this, or the automation will feel broken.** Slack's default is:

> you'll receive mobile notifications **one minute after locking your desktop
> screen or 10 minutes after Slack stops detecting cursor activity**

So while you are at your desk, a bot DM produces **no phone push, or one
delayed up to 10 minutes**. That is default behaviour, not a fault.

In Slack: **Preferences → Notifications → Notify me on mobile** → set to
**"As soon as I'm inactive"**.

Also worth knowing:

- **Do Not Disturb suppresses these notifications and cannot be overridden by
  the API.** There is no parameter to force a message through DND. The
  once-a-day "notify anyway" prompt is a human affordance only. Adding the app
  to your VIP list bypasses DND.
- **Muting the app's DM** kills the push while still showing a badge.

## What breaks a bot token

Neither the token nor a webhook URL expires on a timer — *"OAuth tokens do not
expire."* They die when:

| Cause | Notes |
|---|---|
| A workspace owner uninstalls the app | Also removes any associated webhooks |
| **The account of the person who installed the app is deactivated** | The sleeper risk — if whoever installs this leaves the company, the automation stops |
| *Revoke all tokens* in the app dashboard, or `auth.revoke` / `apps.uninstall` | Deliberate |
| The token leaks publicly | Slack actively searches for and revokes leaked secrets |

That second row is worth a moment's thought: **install the app with an account
that will outlast the automation.**

Detection is via the API response, not an event — the script reports
`invalid_auth`, `token_revoked`, or `account_inactive` and exits non-zero.

## Message format notes

Two facts drive how `notify.py` builds messages:

1. **Mobile push previews use the top-level `text` field exclusively.** Block
   content is never used on a phone. If you send `blocks` without `text`, the
   lockscreen preview has nothing useful in it. `notify.py` always sets `text`
   to a standalone, front-loaded summary.

   Slack's own accessibility guidance suggests the opposite — omit `text` and
   let Slack derive it from blocks. The two pages are never reconciled. For
   mobile push, always set `text`.

2. **Slack mrkdwn is not markdown.** Links are `<url|label>`, not
   `[label](url)`, and bold is `*single asterisk*`. Getting this wrong renders
   literal punctuation instead of a link.

Other limits respected by the script: 50 blocks per message (items are capped
at 20 with a "+N more" footer), 3000 characters per section, and 1 message per
second per conversation — bursts above that may be **silently dropped** rather
than rejected.

## Troubleshooting

| Error | Meaning |
|---|---|
| `invalid_auth` | Token wrong or malformed |
| `token_revoked` | App was uninstalled — reinstall and re-copy the token |
| `account_inactive` | Token belongs to a deleted user or workspace; often the installer was deactivated |
| `token_expired` | Token rotation is enabled on this app |
| `channel_not_found` | `SLACK_DM_TARGET` is not a valid member id, or the app cannot DM them |
| `messages_tab_disabled` | Turn on App Home → Messages tab |
| `missing_scope` | The response's `needed` field names the scope to add; reinstall after adding |
| `invalid_blocks` | `notify.py` automatically retries with inline links instead of buttons |
| `ratelimited` / `rate_limited` | Both spellings exist. Handled automatically via `Retry-After` |
| HTTP 200 but nothing arrives | Slack returns 200 with `ok: false` for logical failures. The script checks `ok`, never the status code |
