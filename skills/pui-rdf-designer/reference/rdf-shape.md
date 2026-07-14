# Rich Display File (RDF) JSON — On-Disk Shape

This document describes the canonical structure of a Profound UI Rich Display File saved as `.json`. It is the file format the PUI designer produces and the PUI runtime (`profoundui/proddata/js/runtime/dspf/render.js`) reads. When authoring an RDF programmatically, follow this shape exactly — agents are not free to invent keys.

## Quick orientation

An RDF defines one display file. A display file contains one or more **record formats** (screens), and each record format contains a flat list of UI **items** (widgets) plus metadata describing how its fields map to the IBM i buffer.

```
RDF file (.json)
├── text                    # description
├── formats[]               # one or more record formats
│   ├── screen              # format-level metadata
│   ├── items[]             # widgets on this format
│   └── dspf record layout  # buffer position map
├── keywords[]              # file-level DDS keywords
└── long name aliases       # boolean
```

## Top-level keys

| Key | Type | Required | Notes |
|---|---|---|---|
| `text` | string | yes | Human-readable description (designer "screen text") |
| `formats` | array of format objects | yes | At least one |
| `keywords` | array of strings | optional | File-level DDS keywords, e.g. `"INDARA"`. May be `[]` |
| `long name aliases` | boolean | optional | Usually `true` — keep enabled unless you know why not |

## Format object

Each entry in `formats` represents one DDS record format.

```json
{
  "screen": {
    "record format name": "mainscreen",
    "overlay": "true",
    "overlay range": "1-20",
    "onload": "// optional JS run when format displays"
  },
  "items": [ ... ],
  "dspf record layout": {
    "<record-format-name>": [
      { "name": "fieldname", "inBufPos": 1, "outBufPos": 1 }
    ]
  }
}
```

### `screen` sub-object

| Key | Type | Notes |
|---|---|---|
| `record format name` | string | DDS record format name. Lowercase by convention |
| `overlay` | `"true"` / `"false"` | DDS OVERLAY keyword |
| `overlay range` | `"<startRow>-<endRow>"` | DDS row range the format occupies (e.g. `"1-20"`) |
| `onload` | string | JavaScript executed when the format is rendered (any valid JS) |

Note: boolean-like values are encoded as `"true"` / `"false"` **strings**, not real JSON booleans. The runtime parses them as strings throughout the property bag. The only literal JSON booleans are at the top level (`long name aliases`).

### `dspf record layout`

Maps field positions in the input/output buffer the IBM i program reads and writes. Keyed by record format name (typically matches `screen["record format name"]`, but a single format can declare layouts for multiple buffer formats — see grids below).

Each entry:

```json
{ "name": "fieldname", "inBufPos": <1-based int>, "outBufPos": <1-based int> }
```

- `inBufPos` only → input-only field
- `outBufPos` only → output-only field
- Both → input/output (modifiable) field
- `name` may be `"*in03"` for legacy indicator-style binding or any field name. Order matters for buffer layout.

When a format contains a **grid** (subfile), the `dspf record layout` typically declares an extra key for the grid's record format with its subfield positions:

```json
"dspf record layout": {
  "mainscreen": [ ...subfile-control fields... ],
  "grid":       [ ...one entry per subfile field... ]
}
```

## Items array — the widgets

Each item is a flat object: an `id`, a `field type`, and a bag of property keys whose names contain spaces. **Property keys are the human-readable names from the designer's property panel.**

```json
{
  "id": "btnSubmit",
  "field type": "graphic button",
  "value": "Continue",
  "shortcut key": "Enter",
  "left": "140px",
  "top": "40px",
  "width": "140px",
  "css class": "pls--button"
}
```

| Key | Required | Notes |
|---|---|---|
| `id` | yes | Unique within the file. Used for DOM id and JS lookup |
| `field type` | yes | The widget type — see `reference/widgets/` for the list and per-widget property reference |
| (other properties) | varies | All other keys are property-bag entries. Reference the widget's MD file for valid keys and value formats |

Common positioning properties present on most widgets:

| Key | Type | Notes |
|---|---|---|
| `left`, `top` | CSS length string | e.g. `"140px"`, `"50%"`, `"calc(50% - 70px)"` |
| `width`, `height` | CSS length string | Same |
| `z index` | string number | Stacking order |
| `cursor row`, `cursor column` | string number | DDS legacy positioning (1-based row/column) — used in addition to CSS positioning for cursor placement |

### Containment: layouts and grids

Items are not nested in JSON — they're flat in the `items` array — but they reference parent containers by id:

**Inside a layout** (panel, simple container, etc.):
```json
{
  "id": "fldUser",
  "field type": "textbox",
  "layout": "mainscreen_screenlayout",
  "container": "1"
}
```

The `layout` value is the `id` of the parent layout item; `container` is the 1-based index of the slot/region inside that layout.

**Inside a grid** (subfile row template):
```json
{
  "id": "s1empname",
  "field type": "output field",
  "grid": "subfile",
  "column": "0"
}
```

`column` is 0-based.

A typical layout you'll see in real-world files:

1. A hidden `simple container` layout at top of items (id ends in `_layout_hidden_fields`) holding action buttons that aren't shown on the rendered panel
2. A visible `css panel` layout (id ends in `_screenlayout`) that contains the form fields
3. Optional grid widget for subfile data
4. Items belonging to a layout or grid follow the parent in the array, each carrying `layout`/`container` or `grid`/`column`

## Property values

A property value is one of:

### 1. Plain string

```json
"left": "140px",
"value": "Press Enter to continue",
"css class": "pls--button"
```

### 2. JS expression — `"js: <expr>"`

Evaluated at runtime as JavaScript. Use for dynamic values.

```json
"image source": "js: pui.normalizeURL(\"/profoundui/userdata/images/logo.svg\")",
"value": "js: currentDate()"
```

### 3. Script expression — `"Script: <expr>"`

Used for runtime-translatable / scripted text (commonly `pui.getLanguageText` calls).

```json
"placeholder": "Script: pui.getLanguageText(\"runtimeText\",\"user\")",
"header text": "Script: pui.getLanguageText(\"runtimeText\",\"pjs sign on\")"
```

### 4. Bound field object (data binding)

A property whose value comes from / writes back to an IBM i program field is an object. Shape depends on the data type. The runtime substitutes the field's current value at render time; `designValue` (often `"[fieldname]"`) is what the designer shows in preview.

**Character:**
```json
"value": {
  "fieldName": "username",
  "dataLength": "10",
  "trimLeading": "false",
  "trimTrailing": "true",
  "blankFill": "false",
  "rjZeroFill": "false",
  "dataType": "char",
  "formatting": "Text",
  "textTransform": "none",
  "designValue": "[username]"
}
```

**Numeric (zoned/packed):**
```json
"value": {
  "fieldName": "nbrdays",
  "dataLength": "3",
  "decPos": "0",
  "numSep": "false",
  "zeroBalance": "false",
  "numBlankFill": "false",
  "zeroFill": "false",
  "noExtraSpaces": "false",
  "curSym": "",
  "dataType": "zoned",
  "formatting": "Number",
  "negNum": "-999.00",
  "units": "",
  "designValue": "[nbrdays]"
}
```

**Date:**
```json
"value": {
  "fieldName": "today",
  "dataType": "date",
  "formatting": "Date",
  "dateFormat": "",
  "locale": "en_US",
  "designValue": "[today]"
}
```

**Indicator (response, visibility, etc.):**
```json
"response": {
  "fieldName": "*in03",
  "dataType": "indicator",
  "formatting": "Indicator",
  "indFormat": "1 / 0"
}
```

- `fieldName` accepts `"*inNN"` (legacy DDS) or `"NN"` (number alone).
- `dataType` is `"indicator"` for true indicators, `"expression"` for indicator-style booleans backed by an expression field.
- `indFormat` is one of `"1 / 0"`, `"true / false"`, `"Custom Values"` (with `customTrue` / `customFalse` siblings).
- Prefix the `fieldName` with `N` to negate: `"fieldName": "N70"` means "when *IN70 is off".

### 5. Conditional value (indicator-controlled)

Almost any property accepting a string can also accept an indicator-conditional object using `"indFormat": "Custom Values"`:

```json
"css class 2": {
  "fieldName": "12",
  "customTrue": "RI",
  "customFalse": "",
  "dataType": "expression",
  "formatting": "Indicator",
  "indFormat": "Custom Values"
}
```

This applies `"RI"` to the property when *IN12 is on, empty otherwise. Use this pattern when a property's value needs to flip with program logic.

## Multiple formats and overlay

DDS display files commonly overlay multiple record formats on the same screen. In an RDF, list each as a separate entry in `formats`. The `overlay` and `overlay range` on each format tell the runtime which rows the format occupies and whether it draws on top of others.

For function-key footers, sign-on overlays, message subfiles, etc., expect a small format with `"overlay": "true"` and a narrow `overlay range`.

## File-level keywords

```json
"keywords": ["INDARA"]
```

The `keywords` array carries file-level DDS keywords. The most common is `INDARA` — indicators stored in a separate indicator buffer. May be `[]`.

## Minimum valid RDF

```json
{
  "text": "Hello world",
  "formats": [
    {
      "screen": {
        "record format name": "fm01"
      },
      "items": [
        {
          "id": "constant1",
          "field type": "output field",
          "value": "Hello, world!",
          "left": "20px",
          "top": "20px"
        }
      ],
      "dspf record layout": {
        "fm01": []
      }
    }
  ],
  "keywords": [],
  "long name aliases": true
}
```

## Recurring conventions to follow

1. **Booleans inside the property bag are strings** — `"true"` / `"false"`. Real JSON booleans are reserved for `long name aliases` at top level.
2. **Numbers inside the property bag are strings** — `"15"` not `15`. (Counts, sizes, positions, etc.)
3. **Property keys have spaces** — `"field type"`, `"css class"`, `"record format name"`, `"shortcut key"`. Do not camelCase them.
4. **`id` values are stable** — the designer auto-generates ids like `constant1`, `constant2`, but for authored content choose semantic ids. Keep them unique.
5. **Order of items in the array matters** — z-stacking ties break by order, and the designer relies on order for layout reordering. Parents come before their children.
6. **Field name references** in `dspf record layout` should be lowercase by IBM i convention.
7. **Action buttons typically live in a hidden layout** named `<format>_layout_hidden_fields` so they're available for shortcut keys even when the visible panel doesn't show them.

## What's NOT in the on-disk file

- No top-level schema URL / `$schema`
- No version / format-revision indicator
- No widget catalog / property catalog references (the property names are loose against the runtime's known set — invalid keys are silently ignored at render time, so validate carefully)

This last point is why the skill ships a structured property catalog and validator: the runtime is permissive, so agents need external rigor.
