---
name: email
description: Send rich HTML emails with attachments, CC/BCC, and reply-to support via SMTP
allowed-tools:
  - Bash
  - Read
argument-hint: send | send with attachment | send to multiple recipients
---

# Email Skill

Send emails via SMTP with support for HTML bodies, multiple recipients, CC/BCC, reply-to, and file attachments (local or URL).

## Prerequisites

The following environment variables must be available at runtime. They should be configured as **environment secrets** in the Coderflow environment settings:

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `EMAIL_SERVER` | Yes | SMTP server hostname | `smtp.ionos.com` |
| `EMAIL_PORT` | Yes | SMTP port (587 for STARTTLS) | `587` |
| `EMAIL_USER` | Yes | SMTP username / sender email | `donotreply@hawthorncs.com` |
| `EMAIL_PASS` | Yes | SMTP password | *(secret)* |
| `EMAIL_FROM_NAME` | No | Display name for From field | `Hawthorn CS` |

## Helper Script

All operations use: `python3 ~/.claude/skills/email/email_send.py '<json>'`

Input can also be passed via file (`@path`) or stdin (`-`).

## Sending Emails

### Simple Email (HTML)
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "Hello from Claude Code",
  "body": "<h1>Hello!</h1><p>This is a <strong>rich HTML</strong> email.</p>"
}'
```

### Plain Text Email
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "Plain text email",
  "body": "This is a plain text email with no HTML.",
  "html": false
}'
```

### Multiple Recipients with CC and BCC
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": ["alice@example.com", "bob@example.com"],
  "cc": ["manager@example.com"],
  "bcc": ["audit@example.com"],
  "subject": "Team Update",
  "body": "<p>Here is the weekly update.</p>"
}'
```

Recipients can be a single string or an array. Comma-separated strings also work: `"to": "alice@example.com, bob@example.com"`.

### Email with Reply-To
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "customer@example.com",
  "subject": "Your request has been received",
  "body": "<p>We received your request and will respond shortly.</p>",
  "reply_to": "support@hawthorncs.com"
}'
```

### Email with Local File Attachments
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "Monthly Report",
  "body": "<p>Please find the monthly report attached.</p>",
  "attachments": [
    "/tmp/report.pdf",
    "/tmp/data.xlsx"
  ]
}'
```

### Email with URL Attachments
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "Document for Review",
  "body": "<p>Attached is the document from our shared drive.</p>",
  "attachments": [
    "https://example.com/files/document.pdf"
  ]
}'
```

### Mixed Attachments (Local + URL)
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "Files for Review",
  "body": "<p>See attached files.</p>",
  "attachments": [
    "/tmp/local-report.xlsx",
    "https://example.com/remote-doc.pdf"
  ]
}'
```

### Custom From Name (per-email override)
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": "recipient@example.com",
  "subject": "From a specific sender",
  "body": "<p>This email has a custom from name.</p>",
  "from_name": "Project Notifications"
}'
```

### Using a JSON File as Input
```bash
python3 ~/.claude/skills/email/email_send.py @/tmp/email.json
```

### Full Featured Example
```bash
python3 ~/.claude/skills/email/email_send.py '{
  "to": ["alice@example.com", "bob@example.com"],
  "cc": "manager@example.com",
  "bcc": "compliance@example.com",
  "subject": "Q1 Financial Summary",
  "body": "<h2>Q1 Financial Summary</h2><p>Please review the attached report and spreadsheet.</p><ul><li>Revenue: up 12%</li><li>Costs: down 3%</li></ul><p>Let me know if you have questions.</p>",
  "reply_to": "finance@hawthorncs.com",
  "from_name": "Finance Department",
  "attachments": [
    "/tmp/q1-summary.pdf",
    "/tmp/q1-data.xlsx"
  ]
}'
```

## JSON Input Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `to` | string or array | **Yes** | - | Recipient(s) |
| `cc` | string or array | No | - | CC recipient(s) |
| `bcc` | string or array | No | - | BCC recipient(s) (hidden from headers) |
| `subject` | string | **Yes** | - | Email subject line |
| `body` | string | **Yes** | - | Email body (HTML or plain text) |
| `html` | boolean | No | `true` | Whether body is HTML |
| `reply_to` | string | No | - | Reply-to address |
| `from_name` | string | No | `EMAIL_FROM_NAME` | Display name override |
| `attachments` | array of strings | No | - | File paths or URLs to attach |

## Output

On success:
```json
{
  "success": true,
  "message": "Email sent successfully",
  "details": {
    "from": "Hawthorn CS <donotreply@hawthorncs.com>",
    "to": ["recipient@example.com"],
    "subject": "Hello",
    "attachments": ["report.pdf"]
  }
}
```

On failure:
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

## Tips

- **HTML is the default.** Set `"html": false` for plain text emails.
- **Attachments** support common formats: PDF, XLSX, XLS, DOCX, CSV, PNG, JPG, ZIP, and any other file type (sent as `application/octet-stream` if type can't be detected).
- **URL attachments** are downloaded to a temp file, attached, then cleaned up automatically.
- **BCC** recipients are sent the email but are NOT visible in the email headers.
- **From address** always uses `EMAIL_USER` — `from_name` only changes the display name.
- For large HTML emails, write the body to a JSON file and use `@/tmp/email.json` input.