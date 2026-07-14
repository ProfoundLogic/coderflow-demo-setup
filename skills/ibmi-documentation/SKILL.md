---
name: Ibmi Documentation
description: Generate complete technical documentation for IBM i programs (ILE
  RPG,   SQLRPGLE, ILE COBOL, CL, DDS/DDL). Produces a deep technical reference
  as a   markdown file, with recursive dependency tracing, Mermaid diagrams, DB2
  for i   schema/access-path analysis, and ILE/activation-group detail. Use
  this   whenever the user asks to document, explain, analyze, map dependencies
  for, or   "write docs for" an IBM i / AS400 / iSeries / System i program or
  source   member — even if they only say "document this RPG program" or
  "explain what   this CL does." Trigger on any .rpgle, .sqlrpgle, .clle, .clp,
  .cbl/.cblle,   .dspf, .prtf, .pf, .lf, DDS, or ILE/service-program artifact.
  RPG,   SQLRPGLE, ILE COBOL, CL, DDS/DDL). Produces a deep technical reference
  as a   markdown file, with recursive dependency tracing, Mermaid diagrams, DB2
  for i   schema/access-path analysis, and ILE/activation-group detail. Use
  this   whenever the user asks to document, explain, analyze, map dependencies
  for, or   "write docs for" an IBM i / AS400 / iSeries / System i program or
  source   member — even if they only say "document this RPG program" or
  "explain what   this CL does." Trigger on any .rpgle, .sqlrpgle, .clle, .clp,
  .cbl/.cblle,   .dspf, .prtf, .pf, .lf, DDS, or ILE/service-program artifact.
createdAt: 2026-07-10T20:44:40.651Z
createdBy: rbetancourt
createdByName: Roger Betancourt
createdById: user_1767620468211_32t18oh94
updatedAt: 2026-07-10T20:48:35.559Z
updatedBy: rbetancourt
updatedByName: Roger Betancourt
updatedById: user_1767620468211_32t18oh94
---

# IBM i Program Documentation

Generate a **technical reference** for any IBM i program, aimed at developers, DBAs, and support staff. IBM i documentation lives or dies on platform-specific truth — activation groups, binding, access paths, journaling, PSDS-based error handling — so this skill pushes you to capture what a generic code documenter would miss.

## Output contract (never deviate)

Create one file:

- `<PROGRAM>_Technical_Documentation.md`

Replace `<PROGRAM>` with the real object name, e.g. `WRKCUST1R_Technical_Documentation.md`. Save it to the output directory and present it to the user. The document is worthless if it stops at "reads a file" without the access path, usage, and activation group — depth on the platform specifics is the whole point.

## Workflow

1. **Analyze the sources first.** Read `references/analysis-process.md` and follow it before writing anything — it covers source-reading order, RPG/COBOL dialect detection, fact extraction, and recursive dependency tracing. Getting this wrong makes every downstream section wrong.
2. **Write the technical document.** Follow the section spec and templates in `references/technical-template.md`. Use the diagram templates in `references/mermaid-examples.md` for anything visual — those are known-valid and render correctly.
3. **Save and present** the file, then run the checklist at the end of the template.

## Scale depth to the object — don't pad

Not every program needs every section. Fill sections that apply; for sections that don't, write a one-line "Not applicable" rather than inventing content. Use this as the floor (technical-doc section numbers are defined in `references/technical-template.md`):

| Object | Mandatory sections | Add when present |
|---|---|---|
| Simple CL/RPG utility | 1, 2, 4, 18 | 15 |
| Interactive program (DSPF) | 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 18 | 7, 12 |
| Batch program | 1, 2, 3, 4, 5, 7, 9, 11, 14, 18 | 8, 13 |
| Service program / API | 1, 2, 3, 4, 5, 6, 7, 11, 13, 15, 17, 18 | 12, 14 |
| Full application driver | all | — |

## Reference files

Read these as needed rather than all at once:

- `analysis-process.md` — how to read IBM i sources and extract facts (read first, every time).
- `technical-template.md` — the 18-section technical document spec with tables and templates.
- `mermaid-examples.md` — validated Mermaid templates for dependency, call-hierarchy, program-flow, and ER diagrams.