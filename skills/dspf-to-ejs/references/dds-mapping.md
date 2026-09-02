# How DDS maps to the generated screen

## Column layout the parser reads

| Cols | Meaning |
|---|---|
| 6 | `A` spec type (`*` in col 7 is a comment) |
| 8-16 | Conditioning indicators, up to three, `N` prefix negates |
| 17 | `R` marks a record format |
| 19-28 | Field or format name |
| 29-34 | Length |
| 35 | Data type |
| 36-37 | Decimal positions |
| 38 | Usage |
| 39-41 / 42-44 | Row / column |
| 45-80 | Keywords, or a quoted constant |

A trailing `-` or `+` continues onto the next line; quoted constants are
rejoined before anything else looks at them.

## Types and usage

| DDS type | Rich Display `type` |
|---|---|
| `A` | `char` |
| `S`, `Y` | `zoned` |
| `P` | `packed` |
| `B` | `binary` |
| `L`, `T`, `Z` | `date` / `time` / `timestamp` (rendered as text) |

| Usage | Meaning | Rendering |
|---|---|---|
| `O` | output | `<span class="-value">` |
| `B`, `I` | input | `<input class="-input">` |
| `H`, `P` | hidden / program-to-system | declared, not rendered |

`Y` is a numeric-edit type. It carries decimals like zoned and is mapped to
`zoned`; if the RPG declares the matching field as packed, change the one line
in the generated JSON.

## Keywords

| Keyword | Effect |
|---|---|
| `SFL` / `SFLCTL(x)` | Subfile pair → one data table on the control record's screen |
| `SFLPAG` / `SFLSIZ` | Reported; the table renders whatever rows RPG loads |
| `SFLCLR` | Indicator becomes a `sflclear` **character field** |
| `SFLMSGKEY` / `SFLPGMQ` | Message subfile — dropped, use the `msg` field |
| `CAnn(ii 'Label')` / `CFnn` | Real button, `data-fkey`, `action='LABEL'` |
| `WINDOW(...)` | Modal dialog (`-backdrop` + `-dialog`) |
| `COLOR(WHT)` / `DSPATR(HI)` | Marks a constant as a heading, not a label |
| `DSPATR(PR)` conditioned | `readonly` guarded on the indicator |
| `CHECK(LC)` | Field accepts lower case; without it the input is uppercased |
| `EDTCDE(x)` | Controls number formatting — see below |
| `OVERLAY`, `SFLDSP`, `SFLEND`, `SFLDROP` | Green-screen mechanics, no HTML equivalent |

### EDTCDE and thousands separators

This one bites. Edit codes `1-4` and `J-Q` insert thousands separators; `Z` and
the blank-on-zero codes do not. So a 6-digit customer number declared
`6S 0O ... EDTCDE(Z)` must render `100001`, never `100,001`. The generator
emits `useGrouping: false` unless the edit code or a decimal position calls for
grouping.

Note also that blank-on-zero codes (`Z`, `2`, `4`, `B`, `D`, `K`, `M`) hide a
zero on a green screen. On the web a zero is usually more informative than a
blank, so the generator renders it. Change the template if you want the old
behaviour.

## Layout recovery

DDS is a bag of things at (row, col). The analyser recovers intent:

- **Title** — a non-label constant on row 1-2.
- **Label/value pair** — the nearest constant to a field's left on the same
  row, especially one ending in `:` or `. . . :`.
- **Hint** — a parenthesised constant to the field's right,
  e.g. `(B=Business, R=Residential)`, rendered under the input.
- **Section** — a heading constant (`COLOR(WHT)` / `DSPATR(HI)`) alone on its
  row starts a new card.
- **Continuation** — an unlabelled field directly below a labelled one at the
  same column is a second line, not a new field needing an invented name.
- **Option legend** — a constant like `1=Select to view details` becomes the
  hint above the table, not a section heading.
- **F-key legend** — constants matching `F3=Exit` and the 77-char `SFKEYS`-style
  output field are dropped; real buttons replace them.

### Subfile column headings

Headings are the constants on the nearest control-record row above the
subfile's first data row, matched to fields by **span overlap**. This matters
because a heading may sit to the *left* of a text column but to the *right* of
a right-aligned numeric one:

```
     A                                 11 56'Price'      <- heading at col 56
     A            PRPRICE        7Y 2O 12 53EDTCDE(3)    <- field at col 53
```

A left-only match assigns `Price` to the wrong field and shifts every heading
after it. Overlap matching handles both alignments.

## Format roles

| Role | Trigger | Output |
|---|---|---|
| `list` | has a subfile | toolbar + sortable table |
| `form` | fields, no subfile | title + cards |
| `dialog` | `WINDOW()` | modal |
| `notice` | constants only, no fields | centred empty-state text |
| `messages` | message subfile | **skipped** — use the `msg` field |
| `footer` | only F-keys | **skipped** — buttons live on each screen |
| `fragment` | nothing displayable | **skipped** |

Skipped formats are listed in the generated `MIGRATION.md` so nothing
disappears silently.
