---
name: jira
description: Create, view, update, comment on, transition, and assign JIRA issues
allowed-tools:
  - Bash
  - Read
argument-hint: create | get <key> | comment <key> | transition <key> | assign <key> | search <jql>
---



# JIRA Skill

Interact with JIRA issues using the Atlassian REST API v3.

## Prerequisites

The following environment variables must be available at runtime. They should be configured as **environment secrets** in the Coderflow environment settings (not hardcoded in files):

| Variable | Description | Example |
|----------|-------------|---------|
| `JIRA_BASE_URL` | Your Atlassian instance URL | `https://yourcompany.atlassian.net` |
| `JIRA_EMAIL` | Atlassian account email | `user@company.com` |
| `JIRA_API_TOKEN` | Atlassian API token (generate at id.atlassian.com) | `ATATT3x...` |

These are injected automatically when the environment is configured correctly. No local configuration is needed.

## Helper Script

All operations use the helper script at: `~/.claude/skills/jira/jira.sh`

Run it with: `bash ~/.claude/skills/jira/jira.sh <action> [args...]`

## Operations

### Get an Issue
```bash
bash ~/.claude/skills/jira/jira.sh get PROJ-123
```

### Create an Issue
```bash
bash ~/.claude/skills/jira/jira.sh create '{
  "fields": {
    "project": {"key": "PROJ"},
    "summary": "Issue title here",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [{
        "type": "paragraph",
        "content": [{"type": "text", "text": "Description text here"}]
      }]
    },
    "issuetype": {"name": "Task"}
  }
}'
```

**Common issue types:** Task, Bug, Story, Epic, Sub-task

### Update an Issue
```bash
bash ~/.claude/skills/jira/jira.sh update PROJ-123 '{
  "fields": {
    "summary": "Updated title",
    "description": {
      "type": "doc",
      "version": 1,
      "content": [{
        "type": "paragraph",
        "content": [{"type": "text", "text": "Updated description"}]
      }]
    }
  }
}'
```

### Add a Comment
```bash
bash ~/.claude/skills/jira/jira.sh comment PROJ-123 "This is my comment text"
```

### Transition an Issue (Change Status)
First, list available transitions:
```bash
bash ~/.claude/skills/jira/jira.sh transitions PROJ-123
```

Then transition by name or ID:
```bash
bash ~/.claude/skills/jira/jira.sh transition PROJ-123 "In Progress"
bash ~/.claude/skills/jira/jira.sh transition PROJ-123 31
```

### Assign an Issue
By email:
```bash
bash ~/.claude/skills/jira/jira.sh assign PROJ-123 user@example.com
```

By account ID:
```bash
bash ~/.claude/skills/jira/jira.sh assign PROJ-123 615afb5dd9820f0070a0864e
```

### Search with JQL
```bash
bash ~/.claude/skills/jira/jira.sh search "project = PROJ AND status = 'To Do' ORDER BY created DESC"
```

### List Projects
```bash
bash ~/.claude/skills/jira/jira.sh projects
```

### Get Project Details & Statuses
```bash
bash ~/.claude/skills/jira/jira.sh project PROJ
bash ~/.claude/skills/jira/jira.sh statuses PROJ
```

### Search for Users
```bash
bash ~/.claude/skills/jira/jira.sh user-search "gary"
```

### Get Current User
```bash
bash ~/.claude/skills/jira/jira.sh myself
```

### Link Issues (Dependencies)
```bash
bash ~/.claude/skills/jira/jira.sh link PROJ-100 blocks PROJ-101
```

This creates a "Blocks" link where PROJ-100 blocks PROJ-101 (PROJ-100 must be done first).

The word order matches natural language: `link A blocks B` means "A blocks B" — A must be completed before B can start. On the JIRA ticket, A will show "blocks PROJ-101" and B will show "is blocked by PROJ-100".

**JIRA API direction semantics (for reference):** The underlying JIRA REST API `issueLink` endpoint uses `inwardIssue` and `outwardIssue` fields whose meaning is counterintuitive. For the "Blocks" link type (outward="blocks", inward="is blocked by"):
- `inwardIssue` = the **blocker** (the ticket that must be completed first)
- `outwardIssue` = the **blocked ticket** (the one that waits)

The helper script handles this automatically — just use the natural word order: `link A blocks B`. Do **not** call the REST API directly for issue links; always use the helper script to avoid direction mistakes.

## Ticket Lifecycle Rules

When working on a Jira ticket, follow this lifecycle:

1. **Starting work:** Transition the ticket to **"In Progress"** when you begin coding.
2. **While working:** Add comments that describe progress, such as what changes were made, what was built, and what remains to be done (testing, code review, commit, etc.). Comments should reflect the current state honestly — do not say work is "completed" or "done" until the ticket is actually finished end-to-end.
3. **Completing work:** Only transition a ticket to **"Done"** after all of the following are true:
   - Code changes are committed
   - Tests have been run and passed
   - Any required verification (e.g., exploratory testing on IBM i) is complete
4. **Never skip ahead:** Do not transition a ticket to "Done" just because the source code edit and build succeeded. Testing and committing are required steps before a ticket is done.

## Tips

- The JIRA v3 API uses **Atlassian Document Format (ADF)** for description and comment bodies. The helper script handles ADF for comments automatically. For create/update, use the ADF format shown in the examples above.
- Transition names are case-insensitive when using the helper script.
- When assigning by email, the script automatically resolves the email to an account ID.
- JQL queries should be single-quoted to avoid shell interpretation.
- Use `statuses <project-key>` to discover valid status names for a project before transitioning.

