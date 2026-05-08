# Known gaps

Things this skill does not yet cover, or covers based on a single example. Be honest about these in the task summary so the user knows where to put extra eyes.

## Reverse-engineered DSPF wire format

The skill emits JSON manifests, not DSPF. The original DSPFs in the example codebase contained two `HTML(...)` keywords:

- `'QPUIREC0    '` — a 12-char marker for plain (non-SFL) record formats.
- `'QPUICTL1    <SFLNAME>5    R...F...C...'` — an encoded SFLCTL keyword string.

We reverse-engineered the SFLCTL string from a single example. If a future program needs a DSPF (rather than the JSON-only path the skill takes), or if the build pipeline starts requiring DSPF emission, the SFLCTL template may need extension to handle SFLEND, SFLDROP, SFLNXTCHG, or other SFLCTL keywords routed through the handler.

For now, the skill's JSON-only output sidesteps this entirely. Profound UI's `CRTDSPF` from JSON handles the wire format internally.

## Type-ahead cold start

The recommended customer-search type-ahead pattern reads suggestions from the rendered subfile rows in the DOM and merges them into `sessionStorage`. This works once the user has visited the unfiltered list at least once. On a cold start with a pre-applied filter (e.g., a deep-link), the cache is empty until the user clears the filter.

The proper fix is a small `pui.ajaxJSON` lookup endpoint backed by the equivalent of `cust_list`. The skill does not generate this; it's a follow-on enhancement.

## Brand styling

The skill produces a **brand-neutral** baseline. A separate pass applies a brand standard (typography, palette, components). The skill takes a brand-standards markdown doc as optional input.

If the user wants the brand applied at conversion time without a separate pass, that's a workflow extension we haven't implemented.

## Modal record formats

The skill marks `WINDOW(...)` formats with `"modal": true` in the JSON manifest and emits an `ejs-modal.ejs.template` for them. We have not exercised this path against a real program with windowed formats. The first time it's used, expect to iterate on:

- Modal positioning and focus trap.
- Backdrop styling.
- Escape-key handling (default action assignment).
- Stacking with the action bar.

## Function key catalogue

The starter set (`OK`, `EXIT`, `CANCEL`, `REFRESH`, `PROMPT`, `HELP`, `PAGEDOWN`, `PAGEUP`, `SUBMIT`, `DELETE`, `CREATE`, `UPDATE`) was validated for `OK`, `EXIT`, `SEARCH` in real builds. The rest are conventional but unproven. When new domain actions emerge (`APPROVE`, `REJECT`, etc.), document them per-screen.

## DDS keywords not yet seen

The skill handles `WINDOW`, `OVERLAY`, `SFLDSP`, `SFLDSPCTL`, `SFLCLR`, `SFLPAG`, `SFLSIZ`, `SFLDROP`, `SFLEND`, `CA03/CA12/CFxx`, `CHECK(LC)`, `EDTCDE`, `COLOR`, `DSPATR`, `INDARA`. It does NOT explicitly handle:

- `PROTECT`
- `MSGCON`
- `CHGINPDFT`
- `*DTAARA`-bound fields
- `RTNCSRLOC`
- `WRDWRAP`
- `SFLRCDNBR`
- Keys for the F-key indicator that go beyond CFxx/CAxx (e.g. CSRINPONLY, MOUBTN)

If any of these appear in a source DSPF, the skill should flag them and ask the user how to handle, rather than silently dropping.

## Genie verification scope

The verification step exercises the data path through the RDF interface. It does NOT verify:

- HTML/CSS/JS rendering.
- Click handlers and JS events.
- Visual layout, animations, responsive breakpoints.
- Browser-specific rendering bugs.
- Profound UI version compatibility on the user's deployment.

These need a real browser pointed at a deployed instance. State this clearly in the summary.

## Overwrite protection

If `<base>eo.*` files already exist when the skill runs, the skill asks the user whether to overwrite. We have not yet implemented:

- An "augment / merge" mode that preserves user hand-tuning while applying new conversion rules.
- A diff display before overwrite.
- A backup mechanism (e.g., `.bak` files).

Default behavior: ask. If the user says overwrite, overwrite outright. If they say keep, abort and report.

## Bundle name conflicts

If the proposed bundle name matches an existing directory under `htdocs/profoundui/userdata/ui/`, the skill should detect it and ask. We've only validated the happy path where the bundle is fresh.

## Build dependency drift

When the skill appends to `Rules.mk`, it needs to know about the project's binding directory and service program dependencies. Currently this is hardcoded to the `wrkcuste` example's pattern (`custr.srvpgm | cust.bnddir`). For other families, the skill should infer or ask for the correct dependency list.

## RPG style edge cases

`rpg-coderflow` covers most style needs, but the skill output may not perfectly handle:

- Programs using `nomain` modules that are themselves files declared with `workstn`.
- Programs that share state via `dtaara` or external indicators.
- Programs with embedded SQL that interacts with display-file processing.

Keep `rpg-coderflow` open while reviewing the generated RPG and tighten anything that drifts.

## Things to watch in the first few real conversions

- Whether the `?v=N` cache busting actually invalidates the user's browser cache. Some Profound UI versions or proxies may strip query strings. If so, fall back to versioned filenames.
- Whether `pui.submit` override-map syntax for subfile cells is honored. We've validated `subfile.field.rrn` syntax; older Profound UI versions may need a different format.
- Whether the JSON manifest's `"modal": true` flag actually produces a modal in the user's Profound UI version. May need supplemental EJS hooks.
