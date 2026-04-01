---
name: Confluence Page Manager
description: Create, read, update, delete, and search Confluence pages. Requires CONFLUENCE_EMAIL and CONFLUENCE_API_TOKEN environment secrets per user.
allowed-tools:
  - Bash
  - Read
  - Write
argument-hint: <describe what you want to do, e.g. create a page in CPP space or search for pages about deployments>
---

# Confluence Page Manager

Create, read, update, delete, and search Confluence pages in the Profound Logic Atlassian instance.

## Authentication

This skill uses per-user Confluence credentials stored as **CoderFlow environment secrets**:

- **`CONFLUENCE_EMAIL`** — The user's Atlassian email address (e.g. `gjones@profoundlogic.com`)
- **`CONFLUENCE_API_TOKEN`** — The user's Confluence Cloud API token

Each CoderFlow user must configure their own values for these secrets. If either variable is missing, inform the user and stop.

Build the auth header for every API call:

```bash
AUTH=$(echo -n "${CONFLUENCE_EMAIL}:${CONFLUENCE_API_TOKEN}" | base64)
```

## Base URL

`https://profoundlogicsupport.atlassian.net`

All REST endpoints use the prefix: `https://profoundlogicsupport.atlassian.net/wiki/rest/api`

## Interaction Rules

1. **Never assume a default space.** Always ask the user which space and/or page to operate on.
2. **Before updating a page**, always fetch it first to get the current version number.
3. **For destructive operations** (delete), confirm with the user before proceeding.
4. **For large content changes**, show the user a preview before pushing.
5. **When creating pages**, ask whether it should be a child of an existing page or at the space root.
6. **Use search** to help users find pages when they don't have an exact page ID.
7. **Handle errors** — check HTTP status codes and surface meaningful messages.

## Operations

### 1. List Spaces

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/space?limit=50&expand=description.plain"
```

### 2. Search Pages (CQL)

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/search?cql=space%3D%22SPACEKEY%22+AND+type%3Dpage+AND+title~%22SEARCH_TERM%22&expand=version,space,ancestors"
```

Replace `SPACEKEY` and `SEARCH_TERM`. URL-encode the CQL query properly.

### 3. Get Page by ID

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}?expand=body.storage,version,space,ancestors"
```

### 4. Get Page by Space Key and Title

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content?spaceKey=SPACEKEY&title=PAGE_TITLE&expand=body.storage,version,space,ancestors"
```

### 5. Create Page

```bash
curl -s -X POST \
  -H "Authorization: Basic ${AUTH}" \
  -H "Content-Type: application/json" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content" \
  -d '{
    "type": "page",
    "title": "Page Title",
    "space": {"key": "SPACEKEY"},
    "ancestors": [{"id": "PARENT_PAGE_ID"}],
    "body": {
      "storage": {
        "value": "<p>Page content in storage format</p>",
        "representation": "storage"
      }
    }
  }'
```

- Omit `ancestors` to create at the space root.
- Include `ancestors` with the parent page ID to nest under an existing page.

### 6. Update Page

Step 1 — Fetch current version:
```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}?expand=version"
```

Step 2 — PUT with incremented version number:
```bash
curl -s -X PUT \
  -H "Authorization: Basic ${AUTH}" \
  -H "Content-Type: application/json" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}" \
  -d '{
    "type": "page",
    "title": "Page Title",
    "version": {"number": NEW_VERSION},
    "body": {
      "storage": {
        "value": "<p>Updated content</p>",
        "representation": "storage"
      }
    }
  }'
```

### 7. Delete Page

```bash
curl -s -X DELETE \
  -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}"
```

### 8. List Child Pages

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{parentPageId}/child/page?expand=version,space"
```

### 9. Add Labels

```bash
curl -s -X POST \
  -H "Authorization: Basic ${AUTH}" \
  -H "Content-Type: application/json" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}/label" \
  -d '[{"prefix":"global","name":"label-name"}]'
```

### 10. Get Labels

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}/label"
```

### 11. Get Page History / Versions

```bash
curl -s -H "Authorization: Basic ${AUTH}" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content/{pageId}/version"
```

### 12. Add Comment to Page

```bash
curl -s -X POST \
  -H "Authorization: Basic ${AUTH}" \
  -H "Content-Type: application/json" \
  "https://profoundlogicsupport.atlassian.net/wiki/rest/api/content" \
  -d '{
    "type": "comment",
    "container": {"id": "PAGE_ID", "type": "page"},
    "body": {
      "storage": {
        "value": "<p>Comment text</p>",
        "representation": "storage"
      }
    }
  }'
```

## Content Formatting (Confluence Storage Format)

Confluence uses XHTML-based "storage format":

| Element | Syntax |
|---------|--------|
| Paragraph | `<p>text</p>` |
| Headings | `<h1>` through `<h6>` |
| Bold | `<strong>text</strong>` |
| Italic | `<em>text</em>` |
| Unordered list | `<ul><li>item</li></ul>` |
| Ordered list | `<ol><li>item</li></ol>` |
| Table | `<table><tbody><tr><th>Header</th></tr><tr><td>Cell</td></tr></tbody></table>` |
| Link | `<a href="url">text</a>` |
| Code block | `<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[code here]]></ac:plain-text-body></ac:structured-macro>` |
| Info panel | `<ac:structured-macro ac:name="info"><ac:rich-text-body><p>text</p></ac:rich-text-body></ac:structured-macro>` |
| Status | `<ac:structured-macro ac:name="status"><ac:parameter ac:name="colour">Green</ac:parameter><ac:parameter ac:name="title">DONE</ac:parameter></ac:structured-macro>` |
| Horizontal rule | `<hr />` |
| Image (attached) | `<ac:image><ri:attachment ri:filename="image.png" /></ac:image>` |

## Known Spaces (Reference Only)

These spaces have been mentioned by users. **Do not default to any of them** — always ask:

- `~gjones` — Gary Jones' personal space
- `CPP` — Commercial team space (contains Pre-Sales Team page, ID: `1116831748`)

## Troubleshooting

- **401 Unauthorized**: API token or email is wrong. Ask user to verify their `CONFLUENCE_EMAIL` and `CONFLUENCE_API_TOKEN` secrets.
- **404 Not Found**: Page ID or space key doesn't exist. Use search to find the correct one.
- **409 Conflict**: Version conflict on update. Re-fetch the page to get the latest version and retry.
- **403 Forbidden**: User lacks permission for that space/page. Suggest they check Confluence permissions.
