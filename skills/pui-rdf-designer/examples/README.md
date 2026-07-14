# Examples

Hand-crafted minimal RDFs showing common patterns. Read these alongside [`../reference/rdf-shape.md`](../reference/rdf-shape.md) to anchor your authoring against real shapes.

## `minimal.json`

The simplest valid RDF: one format, one output field, no bindings, no keywords. The skeleton every RDF starts from.

## `multi-format.json`

Two overlaid record formats — a customer-name input screen plus an F3 footer. Demonstrates:

- **Multiple formats** with overlay ranges (`1-20` and `23-23`)
- **Layout containment** — fields are inside a `panel` via `layout` + `container`
- **Bound character field** on the textbox `value` property
- **Indicator-controlled visibility** — `errorMsg` appears only when *IN50 is on (via `visibility` bound to an `expression` indicator)
- **Response indicator** — the `Exit` button sets *IN03 when clicked
- **dspf record layout** — buffer positions for the indicator and the bound field
- **`INDARA` keyword** — required when binding indicators

## `subfile.json`

A grid (subfile) with two bound columns. Demonstrates:

- **`field type: "grid"`** with subfile control indicators (`display subfile`, `display control record`, `clear subfile`, `subfile end`)
- **Negated indicator binding** — `subfile end` uses `fieldName: "N70"` to invert *IN70
- **Grid containment** — child items use `grid` + `column` (zero-based) to be columns of the row template
- **Two record-format buffer maps** in `dspf record layout` — one for the control format (`subctl`) holding the indicator buffer slots, one for the subfile record format (`sfl`) holding the per-row field positions
