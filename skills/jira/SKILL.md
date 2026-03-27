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
| `JIRA_BASE_URL` | Your Atlassian instance URL | `https://plogic.atlassian.net` |
| `JIRA_EMAIL` | Atlassian account email | `user@company.com` |
| `JIRA_API_TOKEN` | Atlassian API token (generate at id.atlassian.com) | `ATATT3x...` |

These are injected automatically when the environment is configured correctly. No local configuration is needed.

## Helper Script

All operations use the helper script at: `~/.claude/skills/jira/jira.sh`

Run it with: `bash ~/.claude/skills/jira/jira.sh <action> [args...]`

## Operations

### Get an Issue
```bash
bash ~/.claude/skills/jira/jira.sh get GJA-123
```

### Create an Issue
```bash
bash ~/.claude/skills/jira/jira.sh create '{
  "fields": {
    "project": {"key": "GJA"},
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
bash ~/.claude/skills/jira/jira.sh update GJA-123 '{
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
bash ~/.claude/skills/jira/jira.sh comment GJA-123 "This is my comment text"
```

### Transition an Issue (Change Status)
First, list available transitions:
```bash
bash ~/.claude/skills/jira/jira.sh transitions GJA-123
```

Then transition by name or ID:
```bash
bash ~/.claude/skills/jira/jira.sh transition GJA-123 "In Progress"
bash ~/.claude/skills/jira/jira.sh transition GJA-123 31
```

### Assign an Issue
By email:
```bash
bash ~/.claude/skills/jira/jira.sh assign GJA-123 user@example.com
```

By account ID:
```bash
bash ~/.claude/skills/jira/jira.sh assign GJA-123 615afb5dd9820f0070a0864e
```

### Search with JQL
```bash
bash ~/.claude/skills/jira/jira.sh search "project = GJA AND status = 'To Do' ORDER BY created DESC"
```

### List Projects
```bash
bash ~/.claude/skills/jira/jira.sh projects
```

### Get Project Details & Statuses
```bash
bash ~/.claude/skills/jira/jira.sh project GJA
bash ~/.claude/skills/jira/jira.sh statuses GJA
```

### Search for Users
```bash
bash ~/.claude/skills/jira/jira.sh user-search "gary"
```

### Get Current User
```bash
bash ~/.claude/skills/jira/jira.sh myself
```

## Tips

- The JIRA v3 API uses **Atlassian Document Format (ADF)** for description and comment bodies. The helper script handles ADF for comments automatically. For create/update, use the ADF format shown in the examples above.
- Transition names are case-insensitive when using the helper script.
- When assigning by email, the script automatically resolves the email to an account ID.
- JQL queries should be single-quoted to avoid shell interpretation.
- Use `statuses <project-key>` to discover valid status names for a project before transitioning.