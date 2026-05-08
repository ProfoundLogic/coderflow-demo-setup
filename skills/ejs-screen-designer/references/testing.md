# Testing the converted application

The skill bakes a verification step. The user reviews the output afterward and may run additional tests; this step gives them a known-good starting state.

## What this verifies

| Layer | Verifiable via genie? |
|---|---|
| RPG behavior (loop, flow, drilldown call) | YES |
| Field types and JSON manifest correctness | YES |
| Action string contract (OK/EXIT/SEARCH) | YES |
| Subfile selection via SOPT override | YES |
| Bad-data hardening (date BIFs etc.) | YES (drive a bad-data record) |
| EJS HTML/CSS/JS rendering | NO — needs a real browser |
| Click events, JS handlers | NO — needs a real browser |
| Visual layout, animations, responsive | NO — needs a real browser |

State this scope explicitly in the task summary. The user runs the browser-side check separately.

## The recipe

Use the `ibmi-interactive-session` skill.

### 1. Start the session

```bash
./genie_start.sh <SessionName>
```

### 2. Bypass any "Display Program Messages" screen

```bash
./genie_get.sh <SessionName> | jq -r '.["5250"].buffer[0]'
# If "Display Program Messages" appears:
./genie_put.sh <SessionName> "crow=1&ccol=1&aid=241"
```

### 3. Navigate to the menu option

Find the menu option that calls the EJS-converted program. Drive the menu via 5250 input until you reach it.

### 4. Confirm the data stream

```bash
./genie_get.sh <SessionName> | jq 'if .["5250"] then "5250" else "RDF" end'
```

Should be `"RDF"`. If it's `"5250"`, the Profound UI handler isn't engaged — check that:
- The F-spec on the converted RPG has `handler('PROFOUNDUI(HANDLER)')`.
- The `<base>eo.file` was rebuilt.
- The library list resolves `*LIBL/<BASE>EO` to the freshly built copy.

### 5. Drive the screen through its primary path

For the converted `wrkcuste` family example, the primary path is:

| Step | POST |
|---|---|
| Search by name | `CUSTCTL.ACTION=SEARCH&CUSTCTL.SFNDCUSTNO=0&CUSTCTL.SFILTER=acme&CUSTCTL.SFLCLEAR=0&aid=241&row=1&column=1&toprrn.1=1` |
| Select row 1 | `CUSTCTL.ACTION=OK&CUSTSFL.SOPT.1=5&CUSTSFL.rrn=1&aid=241&row=1&column=1&toprrn.1=1` |
| Exit detail | `CUSTDETAIL.ACTION=EXIT&aid=241&row=1&column=1` |
| Exit list | `CUSTCTL.ACTION=EXIT&aid=241&row=1&column=1&toprrn.1=1` |

After each POST, confirm the active format and its data:

```bash
./genie_get.sh <SessionName> | jq '.layers[0].formats[] | select(.active) | {name, data, count: (.subfiles?.<SFLNAME>?.data | length)}'
```

### 6. Drive a bad-data path (if applicable)

If the program has dates or numerics on display, check that a record with `0` or empty input doesn't halt. Find such a record via SQL:

```bash
aitool sql --input '{connection:"dev",sql:"select <key>, <suspect-fields> from <table> where <field> = 0",format:"table"}'
```

Drill into that record and confirm the detail screen renders without halting. The risky fields should appear blank or zero — not absent.

### 7. Sign off

```bash
./genie_put.sh <SessionName> "crow=1&ccol=1&aid=51"   # F3 to back out
# ...continue F3 until at the menu, then sign off via menu option
./genie_put.sh <SessionName> "0=90&crow=22&ccol=7&aid=241"
./genie_end.sh <SessionName>
```

The `IBM i interactive session` skill's CLAUDE.md guidance says to **always** sign off cleanly. Do not skip.

## Capturing renderings

For the task summary, capture HTML renderings of key screens:

```bash
./genie_html.sh <SessionName> screen-NNN.json
```

Embed the resulting `<iframe>` tags at the **root** of `summary.md` (per project CLAUDE.md). One per significant screen state, with a one-line caption explaining what state it captures.

## Failure modes during testing

| Symptom | Likely cause |
|---|---|
| Data stream is 5250, not RDF | Handler keyword missing or `*eo.file` not rebuilt |
| Subfile selection has no effect | Override map missing OR hidden input missing in EJS |
| `select` returns no records | Filter clause in `cust_list` (or equivalent) wasn't extended |
| Drill-down halts on certain records | Bad-data BIF not guarded — check for `%date()`, `%dec()`, etc. |
| Build succeeds but program "ends in error" | Library list ordering — `*LIBL` may resolve to an older copy. Verify with `WRKLIBLE` or by checking the `library` field in `genie_get` output |

## What "good" looks like

A passing test produces:

- Active format flips correctly on each step.
- Subfile data matches expectations.
- No "Display Program Messages" halt screens during the primary path.
- Sign-off is clean (no leftover sessions).
- HTML renderings embedded in `summary.md` for the user's review.

If any of these fail, fix and re-test. Do not mark the task complete with known regressions.
