---
name: EJS Screen Designer
description: Reference for creating and editing Profound UI EJS screen files (Rich Display JSON source, EJS templates, CSS) for RPG Open Access programs.
createdAt: 2026-07-22T13:42:34.458Z
createdBy: alex
createdById: user_1767330741764_x72j25doe
createdByName: Alex Roytman
updatedAt: 2026-07-22T13:42:34.458Z
updatedBy: alex
updatedById: user_1767330741764_x72j25doe
updatedByName: Alex Roytman
---

# EJS Screen Designer

This skill is a reference for creating and editing Profound UI EJS-based Rich Display File screens for RPG Open Access (OA) programs. Use your innate file tools (Read, Write, Edit) to create and modify files following the conventions below.

An EJS screen consists of these artifact types:

1. **Rich Display JSON source** (`.json`) — compiled by `codermake` into a DDS display file
2. **EJS template** (`.ejs`) — client-side HTML template rendered by Profound UI
3. **CSS file** (`.css`) — screen-specific styles
4. **JS file** (`.js`, optional) — screen-specific JavaScript, loaded after the template is rendered

## File Locations

EJS templates and CSS are served from within the Profound UI htdocs tree. The standard convention is:

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

The Profound UI runtime provides these variables to EJS templates:

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
- The Profound UI runtime only sends **changed** field values to RPG (change tracking).

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

## Genie Layout and Full-Bleed Rendering

EJS screens render full-bleed automatically inside Genie. The Profound UI runtime handles the layout escape: on each EJS screen mount it strips inline styles from Genie's layout containers (`.mainDiv`, `.middleDiv`, `.insideDiv`), injects an `!important` stylesheet that forces full-width/auto-height, and installs a MutationObserver that keeps Genie from re-applying its centered styles. On screen exit (navigating to a different EJS screen, a classic DDS display, or a 5250 green screen), the runtime tears all of this down.

**Do not manipulate Genie layout containers from screen JS.** Do not walk ancestors of your screen container to strip or modify their styles. Do not add MutationObservers fighting `.mainDiv` / `.middleDiv` / `.insideDiv`. Do not wrap `pui.submit` to restore Genie layout on submit. All of that is handled centrally.

If a specific screen needs Genie's centered layout rather than full-bleed, opt out in the JSON source:

```json
{
  "type": "ejs",
  "formats": {
    "myformat": {
      "ejs full bleed": false,
      "template": "...",
      ...
    }
  }
}
```

## Screen JS Re-execution Safety

Screen JS files re-execute on every render — this includes subfile reloads within the same screen, and revisiting the same screen after navigating away. Any code that runs at the top level of your IIFE must be safe to run repeatedly:

- **Don't wrap `pui.submit` without an idempotency guard.** Wrapping on every render stacks wrappers. If you must wrap, store a marker like `pui.submit.__mywrapped = true` and bail if already set. Prefer not wrapping at all — handle actions via button `onclick` or the `action` field instead.
- **Don't attach listeners to `document` or `window` without cleanup.** Listeners on elements inside your screen container are cleaned up automatically when the container is wiped, but listeners on `document` / `window` persist and stack across renders. If you must, use `{ once: true }` or store a reference and remove it before re-adding.
- **Attach listeners to elements inside the screen container**, not to `document` / `window`, whenever possible. The container is wiped on re-render so these listeners are garbage-collected without any explicit cleanup.
- **`localStorage` / `sessionStorage` state** is fine — it's external to the DOM and intentionally persistent.

## Editing Workflow: Files Hot-Reload on Revisit

When CoderFlow is serving EJS Rich Display assets (`.ejs`, `.js`, `.css` under `/profoundui/userdata/ui/`), it sets `Cache-Control: no-cache` + `ETag` so the browser revalidates on every request. Combined with the client-side teardown on screen exit, this means: **after editing an EJS, JS, or CSS file, the next time the user navigates back to that screen in Genie, they will see the updated version automatically** — no hard browser refresh, no exit and re-enter, no restart. Unchanged files return 304, so revalidation is cheap.

Subfile reloads within the same screen continue to use the cached template (no network round-trip), so this hot-reload is only triggered on actual screen transitions.

## Important Notes

- Field names are always lowercase in templates and JSON source. The Profound UI runtime provides both lowercase and uppercase versions as template variables.
- The `action` hidden field is the standard pattern for routing button presses. RPG reads `ACTION` to decide what to do.
- Every screen should have at minimum an Exit button bound to F3.
- Subfile option fields (e.g., `sopt`) are typically 2-char fields where the user types an option code.
- Do not use `subfiles.xxx` to access subfile data — it is a top-level variable.
- Templates render client-side via the EJS library. Syntax errors show in the browser but are invisible to autonomous agents. Use `aitool ejs-validate` to pre-flight test templates before deploying — it renders the template with sample data and reports any errors.
- Check the project's existing directory structure before placing files. The paths shown here are standard conventions but the actual project layout may differ.
