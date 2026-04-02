---
name: PDF Generator
description: Generate PDF files from structured content including headings, text, tables, images, code blocks, and HTML
allowed-tools:
  - Bash
  - Read
argument-hint: generate | generate from template | generate report
---

# PDF Generation Skill

Generate PDF files from structured content with support for headings, text, tables, images, code blocks, and HTML.

## Prerequisites

The `fpdf2` Python package must be installed in the environment.

## Helper Script

All operations use: `python3 ~/.claude/skills/pdf/pdf_generate.py '<json>'`

Input can also be passed via file (`@path`) or stdin (`-`).

## Quick Start

```bash
python3 ~/.claude/skills/pdf/pdf_generate.py '{"output": "/tmp/report.pdf", "content": [{"type": "heading", "level": 1, "text": "My Report"}, {"type": "text", "text": "Hello world."}]}'
```

## Content Types

### Heading
```json
{"type": "heading", "level": 1, "text": "Section Title"}
```
Levels 1-4 supported with decreasing font sizes (20, 16, 13, 11pt).

### Text
```json
{"type": "text", "text": "Body paragraph.", "bold": false, "italic": false, "size": 11, "align": "left"}
```
Alignment options: `left`, `center`, `right`, `justify`.

### HTML
```json
{"type": "html", "html": "<h2>Heading</h2><p>Paragraph with <b>bold</b> and <i>italic</i>.</p>"}
```
Supports a subset of HTML: `<h1>`-`<h6>`, `<p>`, `<b>`, `<i>`, `<u>`, `<br>`, `<ul>`, `<ol>`, `<li>`, `<table>`, `<tr>`, `<td>`, `<th>`, `<img>`, `<a>`, `<font>`, `<center>`.

### Table
```json
{"type": "table", "headers": ["Name", "Value"], "rows": [["A", "1"], ["B", "2"]], "col_widths": [80, 40]}
```
Column widths in mm are optional (auto-calculated if omitted). Headers render with grey background.

### Image
```json
{"type": "image", "path": "/tmp/chart.png", "width": 150}
```
Supports `path` (local file) or `url` (auto-downloaded). Optional `width` and `height` in mm.

### Code Block
```json
{"type": "code", "text": "SELECT * FROM orders\\nWHERE status = 'active'"}
```
Renders in monospace font with light grey background.

### Page Break
```json
{"type": "page_break"}
```

### Spacer
```json
{"type": "spacer", "height": 10}
```
Adds vertical whitespace (height in mm).

## Full Example

```bash
python3 ~/.claude/skills/pdf/pdf_generate.py '
{
  "output": "/tmp/monthly-report.pdf",
  "title": "Monthly Report",
  "author": "Finance Team",
  "page_size": "letter",
  "orientation": "portrait",
  "margins": {"top": 15, "right": 15, "bottom": 15, "left": 15},
  "header": {"text": "ACME Corp", "logo": "/tmp/logo.png"},
  "footer": {"text": "Page {page_no} of {nb}", "show_page_numbers": true},
  "content": [
    {"type": "heading", "level": 1, "text": "Monthly Report - March 2026"},
    {"type": "text", "text": "Summary of key metrics for the reporting period."},
    {"type": "table", "headers": ["Metric", "Value", "Change"], "rows": [["Revenue", "$1.2M", "+12%"], ["Costs", "$890K", "-3%"]]},
    {"type": "heading", "level": 2, "text": "Details"},
    {"type": "html", "html": "<p>Revenue grew driven by <b>new customer acquisition</b> in the enterprise segment.</p>"},
    {"type": "image", "path": "/tmp/chart.png", "width": 150},
    {"type": "page_break"},
    {"type": "heading", "level": 2, "text": "Appendix"},
    {"type": "code", "text": "SELECT region, SUM(revenue)\\nFROM sales\\nGROUP BY region"}
  ]
}'
```

## Using a JSON File as Input

For complex documents, write the JSON to a file and reference it:
```bash
python3 ~/.claude/skills/pdf/pdf_generate.py @/tmp/pdf-spec.json
```

## JSON Input Schema

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `output` | string | **Yes** | — | Output PDF file path |
| `title` | string | No | — | PDF document title metadata |
| `author` | string | No | — | PDF author metadata |
| `page_size` | string | No | `letter` | `letter` or `a4` |
| `orientation` | string | No | `portrait` | `portrait` or `landscape` |
| `margins` | object | No | 15mm all | `top`, `right`, `bottom`, `left` in mm |
| `header` | object | No | — | `text` (string), `logo` (file path) |
| `footer` | object | No | — | `text` (string with `{page_no}` and `{nb}` placeholders), `show_page_numbers` (bool) |
| `content` | array | **Yes** | — | Ordered list of content blocks |

## Output

On success:
```json
{
  "success": true,
  "message": "PDF generated successfully",
  "details": {
    "output": "/tmp/report.pdf",
    "pages": 3,
    "size_bytes": 45210
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

- **For large documents**, write the JSON spec to a file and use `@/tmp/spec.json` input.
- **Pair with `/sql`** to query data and render results as PDF tables.
- **Pair with `/email`** to generate a PDF then send it as an attachment.
- **HTML block** supports a useful subset but not full CSS. Prefer structured content blocks for precise control.
- **Images** can be PNG, JPEG, or GIF. URL images are downloaded and cleaned up automatically.
- **Footer placeholders**: Use `{page_no}` for current page and `{nb}` for total pages.
