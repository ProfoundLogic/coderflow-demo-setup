---
name: EJS Screen Designer
description: Reference for creating and editing ProfoundUI EJS screen files (Rich Display JSON source, EJS templates, CSS) for RPG Open Access programs.
---

# EJS Screen Designer

This skill is a reference for creating and editing ProfoundUI EJS-based Rich Display File screens for RPG Open Access (OA) programs. Use your innate file tools (Read, Write, Edit) to create and modify files following the conventions below.

An EJS screen consists of these artifact types:

1. **Rich Display JSON source** (`.json`) — compiled by `codermake` into a DDS display file
2. **EJS template** (`.ejs`) — client-side HTML template rendered by ProfoundUI
3. **CSS file** (`.css`) — screen-specific styles
4. **JS file** (`.js`, optional) — screen-specific JavaScript, loaded after the template is rendered

## File Locations

EJS templates and CSS are served from within the ProfoundUI htdocs tree. The standard convention is:

```
htdocs/profoundui/userdata/ui/<display>/<format>.ejs
htdocs/profoundui/userdata/ui/<display>/<format>.css
```

The `<display>` directory is typically the display file name (e.g., `wrkcuste`). The `<format>` filename matches the record format name (e.g., `custlist`, `detail`).

The JSON source file is typically placed alongside other source members (e.g., in a `src/` directory), but this varies by project.

**Check the existing project structure** before creating files — follow whatever conventions the repository already uses for source and htdocs paths.

## Rich Display JSON Source Format

The JSON source file defines the display file that `codermake` compiles into DDS. Structure:

```json
{
  "type": "ejs",
  "formats": {
    "<format-name>": {
      "description": "Human-readable description",
      "template": "/profoundui/userdata/ui/<display>/<format>.ejs",
      "css": ["/profoundui/userdata/ui/<display>/<format>.css"],
      "js": ["/profoundui/userdata/ui/<display>/<format>.js"],
      "fields": {
        "<fieldname>": { "type": "<rpg-type>", "length": <n> },
        "<fieldname>": { "type": "<rpg-type>", "length": <n>, "decimals": <d> }
      },
      "subfiles": {
        "<sflname>": {
          "description": "Subfile description",
          "clear": "<indicator-field>",
          "fields": {
            "<fieldname>": { "type": "<rpg-type>", "length": <n> }
          }
        }
      }
    }
  }
}
```

### Key Rules

- `"type": "ejs"` is required at the top level.
- Field names must be **lowercase**. Names up to 10 characters map directly to DDS field names. Longer names (up to 50 characters) are supported — the compiler generates a short DDS name automatically and adds an `ALIAS` keyword so RPG programs can reference the field by its long name.
- Field types: `char`, `zoned`, `packed`, `binary`. Numeric types need `length`; `packed`/`zoned` with decimals need `decimals`.
- Template, CSS, and JS paths are **absolute from the htdocs root** (start with `/profoundui/...`).
- `"css"` and `"js"` are arrays; `"js"` is optional. JS files are loaded sequentially after the HTML is injected into the DOM.
- A common pattern is to include an `action` field (`char`, length 10) for routing button/F-key presses to RPG logic, but this is not required — RPG programs can use any mechanism to determine what action was taken.
- Subfile `clear` names an indicator field that the RPG program sets before re-loading the subfile.
- A single JSON source file can contain **multiple formats**. Each format gets its own template and CSS.
- If the display has multiple formats, they typically share the same `<display>` directory but have separate `<format>.ejs` and `<format>.css` files.

## EJS Template Conventions

### Data Available in Templates

The ProfoundUI runtime provides these variables to EJS templates:

| Variable | Description |
|----------|-------------|
| `fieldname` | Lowercase field value (e.g., `custname`) |
| `FIELDNAME` | Uppercase field value (e.g., `CUSTNAME`) |
| `flags` | Array of indicator values; `flags[3]` returns `"1"` or `"0"` |
| `sflname` | Subfile data as top-level array (e.g., `custsfl`). Each element is a row object with field values as properties and a `_rrn` property (1-based record number) used in subfile input names to identify which record was modified on submit. |

**CRITICAL:** Subfile data is a **top-level** variable (e.g., `custsfl`), NOT nested under a `subfiles` object.

### EJS Tags

```
<%= expr %>   — Output HTML-escaped value
<%- expr %>   — Output raw/unescaped HTML
<% code %>    — Execute JavaScript (no output)
```

### Input Fields

Input fields need a `name` attribute matching the field name (lowercase). The value should be pre-populated from the template variable:

```html
<input type="text" name="search" value="<%= search %>">
```

### Output-Only Fields

Display fields have no `name` attribute — they are not sent back to RPG:

```html
<span><%= custname %></span>
```

### Hidden Fields

Used for server-side routing (e.g., action):

```html
<input type="hidden" name="action" value="">
```

### Guarding Optional Fields

Always guard fields that may not be defined in every context:

```html
<% if (typeof msg !== 'undefined' && msg && msg.trim()) { %>
  <div class="message"><%= msg %></div>
<% } %>
```

### Subfile Rendering

```html
<% if (typeof custsfl !== 'undefined' && custsfl && custsfl.length > 0) { %>
  <% custsfl.forEach(function(row) { %>
    <tr>
      <td>
        <input name="custsfl.sopt.<%= row._rrn %>"
               value="<%= row.sopt %>" size="2" maxlength="2">
      </td>
      <td><%= row.scustno %></td>
    </tr>
  <% }); %>
<% } %>
```

**Subfile input name format:** `subfilename.fieldname.rrn` (all lowercase). The client uppercases before POSTing.

### Form Submission

Use `pui.submit()` with an object argument to set field values (typically `action`):

```html
<button onclick="pui.submit({action: 'SAVE'})" class="btn">Save</button>
<button onclick="pui.submit({action: 'EXIT'})" data-fkey="F3" class="btn btn-secondary">Exit (F3)</button>
```

- The object keys are field names (lowercase); values override the form data.
- `data-fkey="F3"` binds the keyboard F3 key to trigger this button's click.
- Supported fkeys: `F1` through `F24`, `Enter`, `PageUp`, `PageDown`.
- The ProfoundUI runtime only sends **changed** field values to RPG (change tracking).

### Formatting Values

Use JavaScript expressions for display formatting:

```html
$<%= Number(balance).toLocaleString('en-US', {minimumFractionDigits: 2}) %>
<%= status === 'A' ? 'Active' : status === 'I' ? 'Inactive' : status %>
```

## CSS Conventions

- Scope all styles under a screen-specific class (e.g., `.custlist-screen`).
- Use modern system font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`.
- Use flexbox for layouts.
- Keep the design clean, professional, and responsive.
- Input focus states should use a visible ring/border change.
- Use a consistent color scheme (blues for primary actions, grays for secondary).

## Complete Examples

See the `examples/` directory alongside this skill for complete working examples:

- `examples/list-source.json` — JSON source with subfile
- `examples/list-template.ejs` — List screen with subfile, search, F-keys
- `examples/list-styles.css` — List screen CSS
- `examples/detail-source.json` — JSON source for detail/edit screen
- `examples/detail-template.ejs` — Detail screen with card layout
- `examples/detail-styles.css` — Detail screen CSS

**Read the examples before generating files** to match established patterns.

## Important Notes

- Field names are always lowercase in templates and JSON source. The ProfoundUI runtime provides both lowercase and uppercase versions as template variables.
- The `action` hidden field is the standard pattern for routing button presses. RPG reads `ACTION` to decide what to do.
- Every screen should have at minimum an Exit button bound to F3.
- Subfile option fields (e.g., `sopt`) are typically 2-char fields where the user types an option code.
- Do not use `subfiles.xxx` to access subfile data — it is a top-level variable.
- Templates render client-side via the EJS library. Syntax errors show in the browser but are invisible to autonomous agents. Use `aitool ejs-validate` to pre-flight test templates before deploying — it renders the template with sample data and reports any errors.
- Check the project's existing directory structure before placing files. The paths shown here are standard conventions but the actual project layout may differ.
