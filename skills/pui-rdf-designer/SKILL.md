---
name: PUI Rich Display File Designer
description: Reference for creating and editing traditional Profound UI Rich Display Files (RDFs) — `.json` source for the PUI runtime. Use this skill when authoring or modifying RDF JSON for RPG/Open Access programs (the format the PUI Visual Designer produces). For EJS-based screens, use the `ejs-screen-designer` skill instead.
---

# PUI Rich Display File Designer

This skill is a reference for authoring **traditional Profound UI Rich Display Files** as JSON. RDFs are read by the PUI runtime (`profoundui/proddata/js/runtime/dspf/render.js`) and rendered as interactive screens for RPG programs. You'll typically be creating or modifying these `.json` files directly using your file tools (Read, Write, Edit).

**Not this skill:** EJS-based Rich Displays (paired with `.ejs` templates and `codermake`-compiled DDS). Those use a different JSON shape — see `ejs-screen-designer`.

## When to use

- Creating a new `.json` RDF for an RPG program
- Modifying an existing RDF (adding widgets, changing properties, wiring indicators, adjusting layout)
- Generating an RDF from a design description ("a customer maintenance screen with a name field, address fields, and a save button")
- Reviewing an RDF for correctness (run the validator)

## Authoring workflow

1. **Understand the file shape first.** Read [`reference/rdf-shape.md`](reference/rdf-shape.md) before authoring. It covers top-level structure, format records, items, property-bag conventions, bound-field shapes per data type, conditional-indicator bindings, layout/grid containment, and `dspf record layout` (the buffer position map IBM i programs use).

2. **For each widget you place:** load **both** of:
   - [`reference/widgets/_universal.md`](reference/widgets/_universal.md) — the 90 properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.)
   - [`reference/widgets/<widget-slug>.md`](reference/widgets/_index.md) — properties specific to that widget. The slug is the `field type` value with spaces replaced by dashes (e.g. `graphic button` → `graphic-button.md`). See [`_index.md`](reference/widgets/_index.md) for the full list.

3. **For patterns the catalog can't express by itself**, consult the prose references:
   - [`reference/binding.md`](reference/binding.md) — how field binding works (the bound-field object shape, data types, response indicators, controlling widget properties via binding)
   - [`reference/events.md`](reference/events.md) — event handlers, widget/screen/global events
   - [`reference/grids.md`](reference/grids.md) — grids and subfiles, including SFLDSP/SFLDSPCTL/SFLCLR/SFLEND/SFLSIZ/SFLRCDNBR semantics
   - [`reference/styling.md`](reference/styling.md) — CSS classes, themes, inline styles

4. **Look up before you write.** Do not invent property names. The PUI runtime silently ignores unknown properties — so typos or guesses won't error, they'll just be inert. Verify property names against the widget MD before adding them.

5. **Validate before saving.** Run the validator (`tools/validate-rdf.mjs`) against your file. It checks both structural shape (against `reference/rdf-schema.json`) and property names/values (against `reference/properties.json`). The runtime is permissive — the validator is strict for a reason.

6. **Look at the examples** in [`examples/`](examples/) for the canonical shape of common patterns (minimal screen, multi-format screen with indicator conditioning, subfile/grid).

## Critical conventions

These bite agents who haven't read the shape doc — internalize them:

- **Booleans in the property bag are strings** — `"true"` / `"false"`, not real JSON booleans. The only real boolean is `long name aliases` at the top level.
- **Numbers in the property bag are strings** — `"15"`, `"140px"`, `"calc(50% - 70px)"`. Even pure integers like grid column counts: `"number of columns": "3"`.
- **Property keys contain spaces** — `"field type"`, `"css class"`, `"shortcut key"`, `"record format name"`. Never camelCase.
- **Items are flat in the array**, not nested. Children of a layout carry `"layout": "<parent-id>"` + `"container": "1"`. Children of a grid carry `"grid": "<parent-id>"` + `"column": "0"`.
- **Bound-field values are objects, not strings.** A property tied to an IBM i field looks like `{ fieldName, dataType, formatting, designValue, ... }` — the exact shape varies by data type. See `rdf-shape.md` §4.
- **Conditional values use indicator-bound objects.** Any property can be made conditional on an indicator via `{ fieldName: "12", customTrue: "RI", customFalse: "", dataType: "expression", formatting: "Indicator", indFormat: "Custom Values" }`.
- **Action buttons typically live in a hidden layout** named `<format>_layout_hidden_fields` so shortcut keys (F3, F12, Enter) work even when the visible panel doesn't show them.

## Reference tree

```
reference/
  rdf-shape.md             # File structure + property-bag conventions
  rdf-schema.json          # JSON Schema (Draft 2020-12) for structural validation
  properties.json          # Machine-readable catalog (421 properties, 33 widgets)
  catalog-extensions.json  # Manual additions for widgets not in the runtime source
  binding.md               # Field binding (data binding to RPG fields)
  events.md                # Event handlers and event types
  grids.md                 # Grid/subfile authoring (SFLDSP, SFLCLR, SFLEND, etc.)
  styling.md               # CSS classes, themes, inline styles
  widgets/
    _index.md              # Widget list + per-widget links
    _universal.md          # 90 properties that apply to every widget
    <widget-slug>.md       # Per-widget properties (one file per widget type)
examples/
  minimal.json             # Simplest valid RDF
  multi-format.json        # Two formats overlaid with indicator conditioning
  subfile.json             # Grid/subfile with bound columns
tools/
  extract-properties.mjs   # Regenerate properties.json from the PUI runtime
  generate-widget-md.mjs   # Regenerate widget MD files from properties.json
  validate-rdf.mjs         # Validate an RDF file (shape + properties)
```

## Source of truth

The property catalog (`reference/properties.json`) is generated from the PUI client runtime sources (`runtime/properties.js`, `widgets/layout/properties.js`, `widgets/grid/Grid.js`, plus layout templates) and is the single source of truth — when the PUI runtime updates, re-run `tools/extract-properties.mjs` followed by `tools/generate-widget-md.mjs` to refresh.

For widgets that exist in real RDFs but aren't in the open-source runtime (e.g. Profound Logic's custom widget kits like `option buttons`), add minimal entries to `reference/catalog-extensions.json`. The validator merges extensions on top of the autogenerated catalog without disturbing the regeneration flow.
