---
name: EJS Screen Designer
description: Convert IBM i 5250 RPG/DSPF program families to Profound UI EJS handler mode. Walks from a primary program through its drilldowns and produces, per program, a Profound-handler RPG (.rpgle) and a JSON RDF manifest (.json), plus a brand-neutral EJS/CSS/JS asset bundle under /profoundui/userdata/ui/<bundle>/. Triggers include convert this 5250 program to EJS, EJS-ify, agentic display file, Profound UI handler, browser-render this program, modernize this RPG screen.
allowed-tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
---

# EJS Screen Designer

Convert IBM i 5250 RPG/DSPF programs to Profound UI EJS handler mode at the **family** level — primary program plus its drilldowns — producing a working browser-rendered application.

## When to use

The user wants to take a 5250 RPG program (e.g. `wrkcustr.rpgle` + `wrkcustd.dspf`) and make it render in a browser via Profound UI's EJS template handler. Typical triggers:

- "Convert this to Profound EJS"
- "EJS-ify this program"
- "Modernize this 5250 screen"
- "Make this run in the browser via the Profound handler"
- "Build an agentic display file from this RPG"
- "Wrap this program in EJS"

Do NOT use this skill if:

- The user only wants RPGOA (different handler, separate path).
- The user wants to author an EJS bundle for a program already converted (use the existing bundle's CSS/EJS instead).
- The user wants the data-layer (`*.pf`, service procedures) refactored. Out of scope.

## What you produce

For **each member** of the program family:

| File | Purpose |
|---|---|
| `src/<base>eo.rpgle` | New RPG with Profound UI handler keyword, string-action loop, monitor-guarded BIFs |
| `src/<base>eo.json` | RDF manifest: format definitions, field types, asset paths with cache-busting `?v=N` |
| `htdocs/profoundui/userdata/ui/<bundle>/<screen>.ejs` | Brand-neutral HTML template |
| `htdocs/profoundui/userdata/ui/<bundle>/<screen>.css` | Brand-neutral structural CSS (no brand colors) |
| `htdocs/profoundui/userdata/ui/<bundle>/<screen>.js` | Action wiring, F3 shortcut, row-click drilldown |

Plus a `Rules.mk` update so the new programs build via `codermake`.

## What you do NOT do

- Emit `<base>eo.dspf`. The build resolves `*eo.file` from JSON, not from DSPF. Emitting DSPF creates drift risk.
- Touch the data layer (`*.pf`, service procedures, copy members) unless a bug is discovered during testing.
- Apply a specific brand. Output is structurally complete and brand-neutral. The user re-skins after, optionally with a brand-standards markdown doc.
- Replace existing `*eo.*` files without the user's consent. If they exist, ask whether to overwrite, augment, or run alongside.

## Inputs

**Required:**
- A primary RPG source path (e.g. `src/wrkcustr.rpgle`).
- The repo root (so you can resolve `/copy` includes and walk `extpgm` calls).

**Optional:**
- **Bundle name override**. Default: derive from the family prefix and append `e` (e.g. `wrkcust` family → `wrkcuste` bundle). Suggest, then ask before committing.
- **Brand-standards markdown** (e.g. `ecwa-ux-standards.md`). If provided, apply after the brand-neutral baseline ships. If absent, leave the baseline as-is.
- **Whether to keep the originals in place** (default: yes; the new files have `eo` suffix and don't conflict).

## Workflow

The procedure below is the contract. Follow it in order.

### Step 1 — Discover the family

Read the primary RPG. Find every `extpgm` prototype and inline call to other `<base>r` (or similar) programs within the same source tree. Recurse one level. Build a list of `(rpg, dspf, json?)` triples to convert. **Confirm the list with the user before proceeding.**

See `references/conversion-rules.md` § "Family discovery" for the algorithm and stopping rules.

### Step 2 — Per program: parse the originals

For each family member:

- Parse the DSPF: record formats; per-format fields (name/type/length/decimals/usage); subfile/SFLCTL pairings; windows (`WINDOW(...)`); conditioning indicators; function keys (`CAxx`/`CFxx`).
- Parse the RPG: F-spec (workstation file + sfile clauses); indicator usage; F-key handling; message-subfile machinery (`QMHSNDPM`, `writeMSGSFL`); subfile load/clear/read patterns; drilldown program calls.

### Step 3 — Plan the action vocabulary

From the parsed F-keys plus the starter set (`OK`, `EXIT`, `SEARCH`, `CANCEL`, `REFRESH`, `PROMPT`, `HELP`, `PAGEDOWN`, `PAGEUP`, `SUBMIT`, `DELETE`, `CREATE`, `UPDATE`), produce a per-screen action map. Show the user; allow rename. Action strings are uppercase, named-by-intent (not by F-key).

### Step 4 — Emit the new RPG (`<base>eo.rpgle`)

Apply the full transformation in `references/conversion-rules.md` § "RPG transformation". Highlights:

- F-spec gets `handler('PROFOUNDUI(HANDLER)')`. Drop the message-subfile `sfile()` clause.
- Replace main loop indicator-driven `dow not *in03` with string-action `dow action <> 'EXIT'`.
- Replace `clearSFL` body with `sflclear='1'; write <ctlrec>; sflclear='0';`.
- Replace `writeMSGSFL(...)` calls with `msg = <text>;`.
- Drop the `QMHSNDPM` prototype, the PSDS, and the message-subfile machinery.
- Drop writes to footer, "no data", and message-control records.
- Wrap **every unguarded** `%date()`, `%time()`, `%timestamp()`, `%dec()`, `%int()`, `%float()` against external data in `MONITOR` / `ON-ERROR` (substitute empty string or zero on failure). See `references/bad-data-hardening.md`.
- Drilldown calls: rename target from `<base>r` to `<base>eo`. Update the prototype.
- Conform the result to project RPG style — use the `rpg-coderflow` skill's standards (`**free`, `ctl-opt dftactgrp(*no) actgrp(*new)`, qualified DS, camelCase variable names, ordered structure).

### Step 5 — Emit the JSON manifest (`<base>eo.json`)

Use `templates/json-manifest-plain.json.template` for plain record formats and `templates/json-manifest-with-subfile.json.template` for SFLCTL formats.

```json
{
  "type": "ejs",
  "formats": {
    "<recname>": {
      "description": "…",
      "template": "/profoundui/userdata/ui/<bundle>/<screen>.ejs",
      "css": ["/profoundui/userdata/ui/<bundle>/<screen>.css?v=1"],
      "js":  ["/profoundui/userdata/ui/<bundle>/<screen>.js?v=1"],
      "modal": true,
      "fields": { "<name>": { "type": "char|zoned|packed", "length": "N", "decimals": "D" } },
      "subfiles": {
        "<sflname>": {
          "description": "…",
          "clear": "sflclear",
          "fields": { }
        }
      }
    }
  }
}
```

DDS → JSON type map in `references/conversion-rules.md` § "Type map". The `?v=1` cache-busting suffix is mandatory; see `references/cache-busting.md`.

### Step 6 — Emit the EJS bundle

For each surviving record format, generate three files in `htdocs/profoundui/userdata/ui/<bundle>/`:

- `<screen>.ejs` from `templates/ejs-screen-plain.ejs.template` or `templates/ejs-screen-with-subfile.ejs.template` (or `templates/ejs-modal.ejs.template` for windowed formats).
- `<screen>.css` from `templates/neutral-screen.css.template` — structural classes only, no brand colors. The user re-skins after.
- `<screen>.js` from `templates/neutral-screen.js.template` — action button wiring, F3 → `EXIT`, optional row-click drilldown for subfile screens.

The EJS uses Profound UI's `pui.submit()` contract correctly per `references/pui-submit-contract.md` — including the **subfile cell override + hidden input dual requirement**.

### Step 7 — Update Rules.mk

Add build rules for the new files. Match the pattern already in the project:

```makefile
# EJS Rich Display Files
<base>eo.file: <base>eo.json

# EJS Programs
<base>eo.pgm: <base>eo.rpgle <copy-includes> <base>eo.file <srvpgm-deps> | <bnddir>
```

### Step 8 — Build

```bash
codermake <base>eo.pgm <base1>eo.pgm <base2>eo.pgm
```

If a build fails, read the log under `tmp/logs/<target>.log` and fix. Common failures:

- `RNF` errors: type mismatch in `MONITOR`/`ON-ERROR` substitutions. Verify `slastord = '';` matches the field's character type.
- `CPF` errors: missing service program export, or the JSON manifest references a field name not declared in `fields`.

### Step 9 — Test

Run the genie verification recipe in `references/testing.md`. Drive the screen through its primary path (search, drill, return, exit) using the RDF POST format. Confirm the active format and its data match expectations at each step. Sign off cleanly.

This **does not** verify the browser-side render — that requires a live IFS sync and a real browser. State this explicitly in your summary.

### Step 10 — Optional brand-standards pass

If the user provided a brand-standards markdown doc:

1. Read it end-to-end.
2. Apply its tokens, typography, and component patterns to the generated CSS/EJS.
3. Re-build only if the changes also touch the JSON manifest (cache-busting bump if so).

If no standards doc: skip. The neutral baseline is the deliverable.

### Step 11 — Output

Per the project CLAUDE.md, write:

- `/task-output/summary.md` — what you did, why, files touched, build/test results, exploratory verification renderings (if applicable), recommendations.
- `/task-output/commit-message.txt` — concise message covering all uncommitted changes (use `git diff --stat` to confirm scope).

Include the IBM i task library name from `$IBMI_BUILD_LIBRARY` in the summary.

## Things to ask the user up front (before Step 1)

- Confirm the primary RPG source path.
- Confirm bundle name (suggest the default).
- Confirm whether to convert dependent programs in the same run (default: yes).
- Confirm whether a brand-standards markdown doc applies (default: no).

## Companion skills

- **`rpg-coderflow`** — RPG style guide. The new RPG you emit must conform. Re-read it after writing each `<base>eo.rpgle`.
- **`codermake`** — invoked at Step 8 to build.
- **`ibmi-interactive-session`** — invoked at Step 9 to verify. Must sign off cleanly.

## Reference files

| File | Purpose |
|---|---|
| `references/conversion-rules.md` | The full DSPF→JSON and RPG→handler-driven transformation rules |
| `references/pui-submit-contract.md` | The subfile-cell override + hidden input rule |
| `references/bad-data-hardening.md` | `MONITOR`/`ON-ERROR` rules for unguarded BIFs |
| `references/cache-busting.md` | The `?v=N` versioning + `codermake` rebuild rule |
| `references/testing.md` | The genie RDF verification recipe |
| `references/known-gaps.md` | Caveats and known limitations |

## Templates

| File | Purpose |
|---|---|
| `templates/json-manifest-plain.json.template` | RDF manifest for plain (non-SFL) record formats |
| `templates/json-manifest-with-subfile.json.template` | RDF manifest for SFLCTL formats |
| `templates/ejs-screen-plain.ejs.template` | EJS template for plain record formats |
| `templates/ejs-screen-with-subfile.ejs.template` | EJS template for SFLCTL record formats |
| `templates/ejs-modal.ejs.template` | EJS template for windowed/modal formats |
| `templates/neutral-screen.css.template` | Brand-neutral structural CSS |
| `templates/neutral-screen.js.template` | Brand-neutral JS (action wiring, F3, row-click) |
