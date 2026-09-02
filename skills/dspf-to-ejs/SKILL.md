---
name: DSPF to EJS
description: Convert a 5250 DSPF display file into a branded Profound UI EJS
  Rich Display screen set (Rich Display JSON, EJS templates, shared
  design-system theme, screen JS). Use when asked to convert a green screen to a
  web UI, make an EJS version of a DSPF, rebrand converted screens for a
  company, or give screens the same look and feel as another converted app.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - WebFetch
createdAt: 2026-08-27T21:11:02.010Z
createdBy: gjones
createdByName: Gary Jones
createdById: user_1767620328397_iectw4bix
updatedAt: 2026-08-27T21:11:09.892Z
updatedBy: gjones
updatedByName: Gary Jones
updatedById: user_1767620328397_iectw4bix
---

# DSPF to EJS

Convert a 5250 display file into a branded Profound UI EJS Rich Display screen
set — Rich Display JSON, EJS templates, a shared design-system stylesheet, and
screen JS — so that every screen you convert comes out looking like part of the
same product.

The generator is faithful, not clever: it recovers the *structure* the DDS
implies (cards, label/value pairs, data tables, dialogs) and renders it in a
tokenised design system. Domain flourishes — KPI strips, charts, AI summaries —
are additions you make afterwards, on a foundation that already looks right.

## When to use

- "Convert this green screen to a web UI"
- "Make an EJS version of this DSPF"
- "Give these screens the same look as <the other converted app>"
- "Rebrand the converted screens for <company>"

## Setup

Scripts need `ejs`, and `playwright-core` for the browser checks:

```bash
cd <skill-dir> && npm install ejs playwright-core
```

If Chromium is not on the default path, point at it:

```bash
export CHROMIUM_PATH=$HOME/.cache/ms-playwright/chromium-*/chrome-linux64/chrome
```

Without `playwright-core` the pre-flight still runs its static checks and says
so; do not treat that as a full pass.

## Workflow

### 1. Establish the brand — once per application

```bash
node scripts/brand-init.js --url https://company.com --prefix ab --out brand.json
```

It reads CSS custom properties from the site's own `:root` (where a design
system declares its real palette), plus fonts and logo candidates, and prints
where every value came from. Then **edit `brand.json` by hand**: set `logo`,
`logoOnDark`, `tagline`, `unit`, `appName` and the footers, and check the
palette against the real brand.

Download the logo into the asset directory and make a white variant for the
dark top bar — see `references/design-system.md`.

Reuse the same `brand.json` and `prefix` for every screen in the application.
That single decision is what produces a consistent look and feel.

### 2. Convert the display file

```bash
node scripts/dspf2ejs.js \
  --dspf   cfdemo/qddssrc/wrkcustd.dspf \
  --brand  brand.json \
  --app-dir wrkcustab \
  --out-json   cfdemo/qddssrc/wrkcustab.json \
  --out-assets htdocs/profoundui/userdata/html/wrkcustab \
  --version 1
```

Add `--dry-run` to see what it would write. It reports each format's role and
which ones it skipped, and writes a `MIGRATION.md` describing every change the
RPG program needs.

### 3. Build the theme into the same asset directory

```bash
node scripts/build-theme.js --brand brand.json \
     --out htdocs/profoundui/userdata/html/wrkcustab
```

Runs a contrast audit. Warnings are readability risks, not failures.

### 4. Pre-flight before it goes near IBM i

```bash
node scripts/preflight.js \
  --json   cfdemo/qddssrc/wrkcustab.json \
  --assets htdocs/profoundui/userdata/html/wrkcustab \
  --out    /tmp/preflight
```

Four checks, each catching a class the others miss:

1. **Identifier audit** — every identifier the template uses is declared in the
   display file. A miss renders the *entire screen* blank with nothing in any
   joblog.
2. **Render** — real-shaped sample data, filled to each field's declared width;
   fails on any uncaught JS error.
3. **Overflow** — fails if the screen spills sideways at 1440px or 900px.
4. **Padding collapse** — fails if a CSS reset out-specifies a component rule
   and silently flattens the layout.

Non-zero exit means do not deploy. Look at the screenshots in `--out`.

### 5. Update the RPG

Follow the generated `MIGRATION.md`. The two substantive changes are the
`handler('PROFOUNDUI(HANDLER)')` keyword on the `dcl-f`, and replacing
function-key indicator tests with `action` string tests.

### 6. Build and deploy

```bash
# Rules.mk
wrkcustab.file: qddssrc/wrkcustab.json
wrkcustab.pgm:  qrpglesrc/wrkcustab.rpgle qddssrc/wrkcustab.json | wrkcustab.file

codermake wrkcustab.file wrkcustab.pgm
```

`codermake` does **not** deploy `htdocs/`. Copy the asset directory to the
Profound UI document root and verify every file returns 200:

```bash
scp -q <assets>/* dev:<docroot>/profoundui/userdata/html/wrkcustab/
for f in theme.css custctl.ejs custctl.css custctl.js; do
  curl -sk -o /dev/null -w "%{http_code} $f\n" "$PUI/profoundui/userdata/html/wrkcustab/$f?v=1"
done
```

**Any later asset edit needs the version bumped in the JSON and the display
file rebuilt** — the `?v=N` is compiled in.

### 7. Verify on the real screen

Pre-flight proves the screen renders. It cannot prove the RPG feeds it the
right data. Drive it in a session and confirm the RDF stream carries the real
template URLs and populated fields — see `references/gotchas.md` §11.

## Refining beyond the conversion

The output is a faithful, well-structured starting point, not a finished
design. Typical next steps, all in the screen's own `.ejs`/`.css`:

- Render coded fields as status pills (`-tag`, `-status`) instead of raw letters
- Promote the record key into the `-key-badge`
- Add derived metrics, charts or summaries **computed from real fields**
- Merge related cards; split overloaded ones

Re-run `preflight.js` after every change.

## Scripts

| Script | Purpose |
|---|---|
| `brand-init.js` | Scrape a site into a starter `brand.json` |
| `build-theme.js` | `brand.json` → `theme.css`, with a contrast audit |
| `dspf2ejs.js` | DSPF → Rich Display JSON + EJS + CSS + JS + `MIGRATION.md` |
| `preflight.js` | Identifier audit, render, overflow and padding checks |
| `selftest.js` | Regression suite for the toolchain itself |

Run the self-test after changing any script:

```bash
node scripts/selftest.js --corpus examples/dspf
```

85 assertions over five real display files, including two negative tests that
prove the guards actually fire.

## References

- `references/design-system.md` — brand tokens, component vocabulary, layout rules
- `references/dds-mapping.md` — every DDS construct and what it becomes
- `references/gotchas.md` — the runtime traps, all of which compile clean

## Limits

- Reads DDS source. It does not read a compiled `*FILE` from a library.
- Subfile paging is not reproduced; the table renders the rows RPG loads.
  Add server-side paging or load a full page per read.
- Message subfiles are dropped in favour of a single `msg` field.
- `SFLDROP`/fold-unfold has no HTML equivalent; the table shows all columns.
- Window position and size are not honoured — a `WINDOW()` format becomes a
  centred modal.
