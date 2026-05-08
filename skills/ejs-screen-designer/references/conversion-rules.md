# Conversion Rules

The full transformation contract from a 5250 RPG/DSPF program to a Profound UI EJS-handler program. This document is the source of truth for what the skill produces; SKILL.md is the workflow that applies it.

## Family discovery

Given a primary RPG path, walk the family:

1. Open the primary RPG.
2. Find every:
   - `dcl-pr <name> extpgm;` declaration where the called program is in the same source tree.
   - Inline `<name>(...)` call to a program declared via `extpgm`.
3. For each found target program:
   - Locate its `<name>.rpgle` source.
   - Find its workstation file via `dcl-f <fname> workstn`.
   - Locate the matching `<fname>.dspf`.
   - Add `(rpg, dspf, json?)` to the family list.
4. Recurse **one level**. Do not auto-walk grandchildren without explicit user permission.
5. Present the discovered family to the user. Confirm scope before generating anything.

If the user explicitly asks for the entire reachable family, recurse fully but stop at any program already converted (`<base>eo.rpgle` exists).

## RPG transformation

### F-spec

```rpgle
// Before
dcl-f wrkcustd workstn sfile(custsfl : rrn) sfile(custmsgsfl : msgrrn);

// After
dcl-f wrkcusteo workstn sfile(custsfl : rrn) handler('PROFOUNDUI(HANDLER)');
```

Rules:
- Rename file from `<base>d` to `<base>eo`.
- Add `handler('PROFOUNDUI(HANDLER)')`.
- Drop the message-subfile `sfile()` clause (replaced by the `MSG` field in the new manifest).
- Keep the data-subfile `sfile()` if present.

### Main loop

Replace indicator-driven F-key loops with string-action loops.

```rpgle
// Before
dow not *in03;
  ...
enddo;

// After
dow action <> 'EXIT';
  ...
enddo;
```

The `action` variable is a 10-character field declared in the JSON manifest and the new RPG's screen format definition. It is submitted by the EJS layer via `pui.submit({action: 'EXIT'})` (or `'OK'`, `'SEARCH'`, etc.).

### Indicator → field replacements

| Indicator pattern | Replacement |
|---|---|
| `*in03 = *off; *inlr = *on` | `action = 'EXIT'` (loop condition exits) |
| `*in31 = *on; write custctl; *in31 = *off` (SFLCLR) | `sflclear='1'; write custctl; sflclear='0';` |
| `*in40`, `*in41` (message subfile display/clear) | `msg = '<text>';` for display; nothing for clear |
| `*in30` (SFLDSP) | Remove. EJS handles empty-state via the template. |
| `*in50`, `*in51` (DSPATR(RI/PC) reverse-image / PC) | Remove. EJS handles styling. |

### Message subfile machinery

Remove entirely. Replace each `writeMSGSFL(<text>)` call with `msg = <text>;`. Drop:

- The `dcl-pr QMHSNDPM extpgm` prototype.
- The `dcl-proc writeMSGSFL` definition.
- The PSDS for `programName`.
- Any `clearMSGSFL` subroutine.
- Writes to the message subfile control record.

### Subfile clear

```rpgle
// Before
begsr clearSFL;
  rrn = 0;
  *in31 = *on;
  write custctl;
  *in31 = *off;
endsr;

// After
begsr clearSFL;
  rrn = 0;
  sflclear = '1';
  write custctl;
  sflclear = '0';
endsr;
```

### Subfile load (mostly preserved)

```rpgle
// Before & after — same shape, but remove indicator manipulation
begsr loadSFL;
  exsr clearSFL;
  for i = 1 to numCustomers;
    sopt = '';
    scustno = customers(i).custno;
    ...
    rrn += 1;
    write custsfl;
  endfor;
endsr;
```

Drop any `*in50/*in51` toggling — that was for visual highlighting, now done in CSS.

### Read-changed subfile loop

Preserve the read-changed loop, but simplify:

```rpgle
readc custsfl;
dow not %eof(<filename>);
  if sopt <> '' and selrrn = 0;
    selrrn = rrn;
  endif;
  update custsfl;
  readc custsfl;
enddo;
if selrrn <> 0;
  chain selrrn custsfl;
  select;
    when %trim(sopt) = '5';
      <drilldown-program>(scustno);
  endsl;
endif;
```

The `update custsfl` is still needed so the SOPT field clears on next render.

### Drilldown calls

Rename target from `<base>r` to `<base>eo`. Update prototype:

```rpgle
// Before
dcl-pr wrkcust1r extpgm;
  custno like(cust_rec.custno) const;
end-pr;

// After
dcl-pr wrkcust1eo extpgm;
  custno like(cust_rec.custno) const;
end-pr;
```

### Bad-data hardening

Wrap every unguarded BIF that converts external data in `MONITOR`/`ON-ERROR`. See `bad-data-hardening.md` for the full list and substitution defaults.

### Style conformance

The output RPG must follow the project's `rpg-coderflow` style:

- `**free` directive at top.
- `ctl-opt dftactgrp(*no) actgrp(*new); ctl-opt bnddir('<bnddir>');` for interactive programs.
- Header comment block.
- Standard ordering: control options → file decls → /copy → DS → prototypes → vars → main → subroutines → procedures.
- camelCase for variables, qualified data structures, descriptive subroutine names.

Re-read `rpg-coderflow` SKILL.md after generating each `<base>eo.rpgle` and tighten anything that drifts.

## DSPF → JSON manifest transformation

The DSPF source becomes a JSON manifest. We do **not** emit a new DSPF file — the build resolves `*eo.file` from JSON, and emitting a DSPF that isn't compiled creates drift risk.

### Per record format

For each record format the program writes (or reads), produce a JSON entry:

```json
{
  "type": "ejs",
  "formats": {
    "<recname>": {
      "description": "...",
      "template": "/profoundui/userdata/ui/<bundle>/<screen>.ejs",
      "css": ["/profoundui/userdata/ui/<bundle>/<screen>.css?v=1"],
      "js":  ["/profoundui/userdata/ui/<bundle>/<screen>.js?v=1"],
      "modal": true,
      "fields": { },
      "subfiles": { }
    }
  }
}
```

Rules:

- `description`: short human-readable label (e.g. "Customer List Control").
- `template`/`css`/`js`: paths under `/profoundui/userdata/ui/<bundle>/`. **Always** include the `?v=1` cache-busting suffix on `css` and `js`. Bump on every asset change.
- `modal`: `true` only for record formats with `WINDOW(...)` in the source DSPF.
- `fields`: include every input/output field on the format. Plus the new plumbing fields:
  - `action` — `{ "type": "char", "length": 10 }` — required on every primary record format.
  - `msg` — `{ "type": "char", "length": 78 }` — required on every primary record format (replaces message subfile).
  - `sflclear` — `{ "type": "char", "length": 1 }` — required on SFLCTL formats (replaces SFLCLR indicator).
- `subfiles`: per SFL, declare the `<sflname>` with `description`, `clear: "sflclear"`, and `fields` (the SFL's data fields, all using their original DDS-derived types).

### Records to drop entirely

- Footer record (e.g. `CUSTFOOT`) — function-key labels move into the EJS.
- "No data" record (e.g. `CUSTNONE`) — empty state moves into the EJS template.
- Message subfile record (`CUSTMSGSFL`).
- Message subfile control record (`CUSTMSGCTL`).

### Records to convert into modal record formats

`WINDOW(...)` records become a record format with `"modal": true`. The RPG keeps `exfmt errorwin`; only the visual treatment changes. Decision rule: multi-field or multi-action windows → modal record format with EJS template. Single-error one-shot terminal → fold into `msg` + `action='EXIT'` instead.

## Type map (DDS → JSON)

| DDS form | JSON `type` | Notes |
|---|---|---|
| `nA` | `char` | `length: n` |
| `nS 0` | `zoned` | `length: n` |
| `nS d` (d > 0) | `zoned` | `length: n`, `decimals: d` |
| `nP d` | `packed` | `length: n`, `decimals: d` |
| `nY d` | `zoned` | `length: n`, `decimals: d`. Source `EDTCDE` formatting moves to EJS. |
| `L` | `char` | ISO date string expected from RPG |
| `T` | `char` | ISO time string |
| `Z` | `char` | ISO timestamp |

Field length in the JSON should reflect the underlying data field's full width — not the 5250 visible width. The 5250 was truncating; the EJS has space.

## Action string vocabulary

Starter set, uppercase, named-by-intent:

| Action | Replaces (typical) | RPG behavior |
|---|---|---|
| `OK` | Enter | RPG continues loop; field-change detection runs |
| `EXIT` | F3 | Loop exit |
| `CANCEL` | F12 | Convention: return without saving |
| `REFRESH` | F5 | Convention: reload current view |
| `PROMPT` | F4 | Field-level lookup |
| `HELP` | F1 | Help |
| `SEARCH` | Enter on toolbar | Same as OK functionally; semantic intent |
| `PAGEDOWN` / `PAGEUP` | Roll keys | Subfile paging |
| `SUBMIT` | Enter on detail | When OK alone is ambiguous |
| `DELETE`, `CREATE`, `UPDATE` | Domain actions | Named, not key-coded |

Per-row subfile selection stays in the `SOPT` cell field; the EJS row-click handler sets it. Don't put per-row clicks into the `ACTION` field.

The RPG only branches on what it cares about (typically `EXIT`); everything else falls through to the find/filter change-detection path.

## Bundle scoping

A "family" of programs (parent + drilldowns) shares one asset bundle. Bundle name convention: drop trailing program-distinction letters from the family prefix and append `e`. Examples:

- `wrkcust` family (wrkcustr, wrkcust1r) → bundle `wrkcuste`.
- `ordhdr` family (ordhdrr, ordhdr1r) → bundle `ordhdre`.

Suggest the default; let the user override.

## Output file paths

| Artifact | Location |
|---|---|
| Converted RPG | `src/<base>eo.rpgle` |
| JSON manifest | `src/<base>eo.json` |
| EJS template | `htdocs/profoundui/userdata/ui/<bundle>/<screen>.ejs` |
| CSS | `htdocs/profoundui/userdata/ui/<bundle>/<screen>.css` |
| JS | `htdocs/profoundui/userdata/ui/<bundle>/<screen>.js` |
| Build rules | append to existing `src/Rules.mk` |

`<screen>` is a short name describing the EJS template's purpose (e.g. `custlist`, `detail`, `editor`). One per record format that survives conversion. The user can rename; default to the format's purpose, not its DDS name.

## Originals

Leave the original `<base>r.rpgle`, `<base>d.dspf`, etc. **in place**. The new `<base>eo.*` files coexist. The user can delete the originals later if they want.

If `<base>eo.*` files already exist (already converted at some point), ASK before overwriting:

- Overwrite with current rules (loses any hand-tuning).
- Augment (merge changes; risky, best avoided).
- Use a different bundle name to run alongside.
