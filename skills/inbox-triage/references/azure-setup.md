# Azure setup for Inbox Triage

One-time setup granting a script read-only access to a single Microsoft 365
mailbox. Roughly 15 minutes, plus up to 2 hours for permissions to propagate.

You need: an account that can create app registrations and **grant admin
consent** in the Entra tenant, and Exchange administrator rights for the
mailbox-scoping step.

## Why not IMAP

Worth stating plainly, because it is the obvious first instinct:

- **Basic authentication for IMAP and POP is permanently removed** from
  Exchange Online. Microsoft's wording is that "no one (you or Microsoft
  support) can re-enable Basic authentication in your tenant."
- **App passwords do not work.** They are a username-and-password pair
  presented over Basic auth, and that code path no longer exists. They are
  also unavailable to accounts required to use modern authentication.
- **OAuth over IMAP does work**, but needs the same app registration and admin
  consent as Graph, *plus* an Exchange service principal, *plus*
  `FullAccess` on the mailbox — far broader than `Mail.Read`. As of July 2026
  it also requires TLS 1.2+.

Microsoft Graph is less work and less privilege. Use Graph.

## Step 1 — register the application

Entra admin center → **Microsoft Entra ID** → **App registrations** → **New
registration**.

- **Name**: `Inbox Triage (read-only)` — pick something whose purpose is
  obvious to whoever audits it in two years.
- **Supported account types**: *Accounts in this organizational directory only*
- **Redirect URI**: leave blank. This is a daemon app; there is no sign-in.

Click Register, then copy from the Overview page:

| Overview field | Secret to create |
|---|---|
| Directory (tenant) ID | `M365_TENANT_ID` |
| Application (client) ID | `M365_CLIENT_ID` |

## Step 2 — create a client secret

**Certificates & secrets** → **Client secrets** → **New client secret**.

Set an expiry you will actually track — 24 months is the practical maximum.
**Copy the Value immediately**; it is shown only once, and a missed copy means
deleting it and starting this step again. Store it as `M365_CLIENT_SECRET`.

> Put a calendar reminder on the expiry date now. A silently expired secret
> is the single most likely way this automation dies, and the symptom is a
> `401` with no notifications — indistinguishable from a quiet inbox.

## Step 3 — add the permission and grant consent

**API permissions** → **Add a permission** → **Microsoft Graph** →
**Application permissions** (*not* Delegated — there is no signed-in user).

Select **`Mail.Read`**, add it, then click **Grant admin consent for
&lt;tenant&gt;**. Confirm the Status column shows a green tick.

Then **remove `User.Read`** if present — it is added by default and unused.

### Do not add anything else

`Mail.Read` cannot change read state. `isRead` is writable only through
`PATCH`, which requires `Mail.ReadWrite`. Withholding that permission is what
makes "leaves emails unread" a structural guarantee rather than a promise, so
adding `Mail.ReadWrite` or `Mail.Send` to solve some future problem would
quietly remove the safety property this design depends on.

### What you have just granted

Be clear-eyed about this: **app-only `Mail.Read` grants read access to every
mailbox in the tenant.** Step 4 narrows it. Do not skip step 4.

## Step 4 — restrict the app to one mailbox

Two options. Option A is one command and is what most people should use.
Option B is Microsoft's forward-looking replacement.

Both need the Exchange Online PowerShell module:

```powershell
Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser
Import-Module ExchangeOnlineManagement
Connect-ExchangeOnline -UserPrincipalName admin@hawthorncs.com
```

### Option A — Application Access Policy (simple)

```powershell
New-ApplicationAccessPolicy `
  -AccessRight RestrictAccess `
  -AppId "<M365_CLIENT_ID>" `
  -PolicyScopeGroupId "gary.jones@hawthorncs.com" `
  -Description "Inbox triage automation - Gary only"
```

Verify — and note that `Test-` bypasses the permission cache, so it answers
immediately rather than in two hours:

```powershell
Test-ApplicationAccessPolicy -Identity gary.jones@hawthorncs.com -AppId <M365_CLIENT_ID>
# expect: AccessCheckResult : Granted

Test-ApplicationAccessPolicy -Identity someone.else@hawthorncs.com -AppId <M365_CLIENT_ID>
# expect: AccessCheckResult : Denied
```

**Run the second check.** A `RestrictAccess` policy that silently failed to
apply looks identical to a working one from the first check alone.

Notes:

- A single user mailbox works directly as `-PolicyScopeGroupId`; no group
  needed. Valid types are `UserMailbox`, `MailUser`, and
  `MailUniversalSecurityGroup`.
- **Shared mailboxes, Microsoft 365 Groups, distribution groups, and
  room/equipment mailboxes are not valid** — wrap those in a mail-enabled
  security group.
- `New-ApplicationAccessPolicy` is **deprecated**. It still functions, and
  Microsoft's guidance is not to create *new* policies because they will
  eventually need migrating to RBAC. For a single mailbox this is a reasonable
  trade for the simplicity; if you would rather not take on that migration,
  use Option B.

### Option B — RBAC for Applications (forward-looking)

Get the **Object ID from Enterprise applications → your app → Overview**, not
from App registrations. Using the App registrations object id fails
authentication in a way the error message does not explain.

```powershell
New-ServicePrincipal -AppId <M365_CLIENT_ID> `
  -ObjectId <ENTERPRISE_APP_OBJECT_ID> -DisplayName "InboxTriage"

New-ManagementScope -Name "GaryJonesOnly" `
  -RecipientRestrictionFilter "PrimarySmtpAddress -eq 'gary.jones@hawthorncs.com'"

New-ManagementRoleAssignment -App <ENTERPRISE_APP_OBJECT_ID> `
  -Role "Application Mail.Read" -CustomResourceScope "GaryJonesOnly"

Test-ServicePrincipalAuthorization -Identity "InboxTriage" `
  -Resource gary.jones@hawthorncs.com | Format-Table
```

> **The trap that silently defeats Option B.** Entra grants and Exchange RBAC
> grants are a **union**, not an intersection. If you leave the tenant-wide
> Entra `Mail.Read` consent from step 3 in place *and* add an RBAC scope, the
> unscoped Entra grant wins and **the scope does nothing at all** — while
> every verification command still reports success.
>
> - Option A: **keep** the Entra grant. The access policy constrains it.
> - Option B: **remove** the Entra `Mail.Read` consent entirely.
>
> Pick one path and follow it through. Half of each leaves the app with
> tenant-wide mailbox read access.

## Step 5 — store the secrets in CoderFlow

Add all four as **environment secrets** (not plain variables, and never
committed to a repo):

| Secret | Value |
|---|---|
| `M365_TENANT_ID` | Directory (tenant) ID |
| `M365_CLIENT_ID` | Application (client) ID |
| `M365_CLIENT_SECRET` | The secret Value from step 2 |
| `M365_MAILBOX` | `gary.jones@hawthorncs.com` |

## Step 6 — verify

```bash
python3 ~/.claude/skills/inbox-triage/graph_mail.py check
```

Expected: all four secrets `set`, a token acquired, the inbox item and unread
counts printed, and **`403 on PATCH -- good: this app cannot mark mail as
read.`**

If the write probe reports anything other than 403, the app holds
`Mail.ReadWrite`. Remove it before going further.

## Troubleshooting

| Symptom | Cause |
|---|---|
| `401` / `AADSTS7000215` | Wrong or expired client secret |
| `401` / `AADSTS900023` | Tenant id wrong |
| `403 ErrorAccessDenied` | Admin consent not granted, or the access policy excludes this mailbox. Check with `Test-ApplicationAccessPolicy` |
| `403` immediately after a permission change | Cache. 30 min for an idle app, up to 2 h for an active one. `Test-` cmdlets bypass it |
| `MailboxNotEnabledForRESTAPI` | Target has no licensed Exchange Online mailbox |
| `InefficientFilter` | `$orderby` properties must also appear in `$filter`, in the same order, before any non-ordered property. The script builds a compliant query; only relevant if you hand-edit it |
| Empty results, no error | Genuinely no new mail in the window, or the watermark has advanced past it. Check `state-show` |
| `429` | Throttled. Handled automatically via `Retry-After`; if persistent, something is polling in parallel |

## Renewal

The client secret is the only thing that expires. When it does, create a new
one (step 2), update `M365_CLIENT_SECRET`, and re-run `check`. Delete the old
secret afterwards. Nothing else needs touching — the client credentials flow
issues no refresh tokens, so there is no long-lived token state to maintain
and no coupling to Gary's own password.
