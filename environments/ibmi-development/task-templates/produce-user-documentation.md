# Produce End-User Documentation for ${source_file}

**This is a DOCUMENTATION-ONLY task. Do not change, refactor, or "improve" any source. Do not create or alter Rules.mk. Do not rebuild objects unless a build is required to reach a screen you must photograph.**

**This template produces ONE deliverable: a state-of-the-art, step-by-step USER GUIDE.**
Do **not** produce technical/developer documentation. No call graphs, no file/field
cross-references, no activation groups, no RPG opcodes, no SQL, no source excerpts, no
"Technical Notes" appendix. If a fact only matters to a programmer, it does not belong in
this document.

---

## 1. Deliverables

Create everything in **`/task-output/documentation/`** (note: `/task-output` is at the
**system root**, NOT inside `/workspace`).

| File | Required | Purpose |
|------|----------|---------|
| `<PROGRAM>_User_Guide.pdf` | Yes, unless output format says Markdown only | The primary deliverable — a finished, printable guide |
| `<PROGRAM>_User_Guide.md` | Yes, unless output format says PDF only | Same content in Markdown, for wikis/Confluence |
| `screenshots/*.png` | Yes | Every screen image used in the guide, kept as separate files |
| `render5250.py`, `build_userguide.py` | Yes | The helper scripts you wrote, so the next task can reuse them |

Requested output format: **${output_format}**

---

## 2. Inputs and Context

- **Program(s) to document:** `${source_file}`
- **Application / product name for the cover page:** `${application_name}` (if blank, derive a
  sensible business name from the program's purpose — never leave the cover blank)
- **Intended reader:** `${audience_level}` — write to this reader's level throughout
- **Known entry path (menu/option/command), if supplied:** `${entry_path}`
- **Organisation name for the cover and support section:** `${brand_company}`
- **Document language:** `${doc_language}`

---

## 3. Phase 1 — Understand the program (read locally, silently)

Read the source in the workspace repository. **Never** download, browse, or search source on
the IBM i host — the repo is the source of truth.

Read, for the selected program and everything it displays through:

- the program source and any `/COPY` members it uses
- the **display file (DSPF)** — this is the single most important input: it tells you every
  screen, every field, every function key, every error condition and every conditioning
  indicator
- any called programs that put up their own screens (document those screens too — the user
  does not know or care that a different program drew them)
- message files (`*.msgf`) referenced for error text

From this, build a private working list (a scratch file in `/tmp` is fine — it is not a
deliverable):

1. **Screen inventory** — every record format the user can actually see, in the order they
   see it.
2. **User task inventory** — the real jobs a person comes to this program to do
   ("find a customer", "correct an address", "print a statement"). Tasks, not functions.
3. **Field inventory per screen** — label, whether the user types in it or just reads it,
   what is valid, what the codes mean, whether it is required.
4. **Function key inventory per screen** — key, label, what actually happens.
5. **Message inventory** — every error/warning/confirmation the program can raise, its exact
   wording, what causes it, and what the user should do about it.

**If the program has no user interface at all** (no DSPF, no interactive prompt — e.g. a batch
report or a pure CL driver): do not invent screens. Produce a user guide covering how the job
is requested/submitted, the parameters the user supplies, what output is produced and where it
goes (spool file / output queue / printer), how to tell it succeeded, and how to read the
report. Say plainly in Section 1 of the guide that this program has no interactive screens, and
skip the walkthrough/screenshot phases. State this clearly in your final summary.

---

## 4. Phase 2 — Capture the real screens (mandatory)

**Every screenshot in this guide must come from a live IBM i session.** Never hand-draw,
mock up, or ASCII-art a screen. Never reuse a screenshot from another document.

1. Confirm the program exists in the task library (`IBMI_BUILD_LIBRARY`) or on the library
   list. If it does not, build it with the **`codermake`** tool and its skill — never with a
   manual `CRT*` command.
2. Use the **`ibmi-interactive-session`** skill to start a session and drive the program.
3. Reach and save a screen-history file for **every** state a real user will meet, including
   the awkward ones:
   - the entry/selection screen as it first appears (empty)
   - the screen with data loaded, and a second page of a list if it scrolls
   - each detail / add / change / delete / confirm screen
   - at least one **realistic error state** per input screen (bad key, missing required field,
     invalid code) — drive the program into the error, do not describe it from the source
   - any confirmation or "are you sure" prompt
   - the "nothing found" / empty-result state
4. Keep notes correlating each `screen-NNN.json` to the step it illustrates. You will need this
   twice — once for the guide, once for the task summary.
5. **Sign off and end the session properly** when you are done.

If a screen genuinely cannot be reached, record it as **BLOCKED** with the reason in your
summary and omit it from the guide. Do not substitute a fabricated image and do not claim a
step is verified when it is not.

---

## 5. Phase 3 — Turn captured screens into images

`genie_html.sh` gives an `<iframe>`. That works in `summary.md` and **not** in a PDF, so
render the screen JSON to PNG yourself.

Write `/task-output/documentation/render5250.py` (Python + PIL). Rules that make the output
faithful:

- Take the **text** from `.["5250"].buffer[]` (24 lines, already composited and always
  correct). Do not try to rebuild text from the field list — you will get gaps.
- Take **colour/attributes** from `.["5250"].layers[*].fields[]` only. Each field has 1-based
  `row`/`col`, `data`, `size`, `type` (`O`/`I`) and `attr` (hex string). Span = `size` for
  input fields, `len(data)` for output fields.
- Decode the attribute byte (0x20–0x3F):
  - `0x01` = reverse image, `0x02` = high intensity, `0x04` = underline
  - `(a >> 3) & 0x07`: `4` → green (white when `0x02`), `5` → red,
    `6` → turquoise (yellow when `0x02`), `7` → pink (blue when `0x02`)
  - `(a & 0x07) == 0x07` → non-display
- **Drive the underline strictly from `attr & 0x04`.** Do NOT underline every `type == "I"`
  field: a protected field still reports `type: "I"` with `attr` `20`, and underlining it makes
  a read-only inquiry screen look editable — exactly the wrong message in a user guide.
- Render at roughly 12x22 px per cell with DejaVuSansMono 18pt on near-black (~968x536 px).

Then **annotate**. A state-of-the-art guide does not show a bare screen; it shows a screen with
the relevant part called out. For each walkthrough step, draw on the PNG:

- a coloured rectangle (2–3 px) around the field, option or key the step is about
- small numbered circles (1, 2, 3) where a step has an ordered sequence on one screen
- nothing else — no arrows across the whole screen, no drop shadows, no clutter

Save both the clean and the annotated version in `screenshots/`, with names that say what they
show (`02-customer-list-annotated.png`), not `screen-004.png`.

---

## 6. Phase 4 — Write the guide

Use exactly this structure. Every section is required unless marked otherwise.

**Cover page** — application name, program title in business language (not the object name),
organisation `${brand_company}`, document type "User Guide", version, date.

**Document control** — a small table: version, date, prepared by, intended reader, related
guides. One row is fine for v1.0.

**Contents** — a real table of contents with page numbers (PDF) or anchor links (Markdown).

1. **What this program is for** — two or three sentences in plain language. What business
   problem it solves and who uses it. No jargon, no object names.
2. **Before you begin** — what the reader needs first: sign-on, authority/permissions, data
   they should have to hand (e.g. the customer number), anything that must already exist.
3. **Getting to the screen** — numbered steps from sign-on to the program's first screen,
   with the exact menu options and any command. Use `${entry_path}` if it was supplied and you
   have confirmed it works. Finish with a screenshot of the screen they should now be looking
   at, so they can check they are in the right place.
4. **Quick start: your first task in 60 seconds** — the single most common job, start to
   finish, in five steps or fewer. Many readers will never go past this section; make it
   complete and correct on its own.
5. **Understanding the screen** — one subsection per screen. Lead with a clean screenshot,
   then explain the screen in reading zones (header / selection area / list / detail /
   message line / key line). Say which parts the user can type in and which are display-only.
6. **Step-by-step: how to do each task** — the heart of the document. One subsection per task
   from your task inventory. For each task:
   - a one-line statement of when you would do this
   - numbered steps, **one action per step**, written as "Do X" → "You will see Y"
   - an annotated screenshot for any step where the reader could reasonably hesitate
   - what "done" looks like: the exact confirmation message or screen they land on
   - how to back out safely part-way through
7. **Field reference** — a table per screen: *Field* | *What it is* | *Do you type here?* |
   *What is allowed* | *Required?*. Use the label the user sees on screen, never the DDS or
   database field name. Spell out every code in words (e.g. "A = Active, I = Inactive") — never
   leave a code unexplained.
8. **Function keys** — a table per screen: *Key* | *What it does* | *When you would use it*.
   Include Enter, Page Up/Page Down and the roll keys if they do anything.
9. **Messages and troubleshooting** — a table: *What you see* (the exact message text) |
   *What it means* (plain language) | *What to do next* (a concrete action). Cover every
   message from your inventory, and add the "it didn't do anything / my change didn't save"
   class of problem that users actually report.
10. **Tips and shortcuts** — genuine time-savers you can prove from the program's behaviour
    (partial-key search, generic search characters, a faster route between screens). No
    speculation.
11. **Frequently asked questions** — at least five, written as questions a real user would
    ask, answered in two or three sentences.
12. **Glossary** — every business term, code set and acronym used in the guide or on the
    screens.
13. **Quick reference card** *(recommended)* — a single self-contained page the reader can
    print and pin up: the task list in one line each, and the function-key table.
14. **Getting help** — closes the document. Always tell the reader to contact their
    **department lead or the IT department** for further assistance with the application,
    naming `${brand_company}` where appropriate.

### Callout icons

Use these four icons for callout boxes, consistently, throughout the guide:

- **Information:** https://cdn-icons-png.flaticon.com/128/9195/9195785.png
- **Warning:** https://cdn-icons-png.flaticon.com/128/3756/3756712.png
- **Error:** https://cdn-icons-png.flaticon.com/128/9068/9068699.png
- **Tip (lightbulb):** https://cdn-icons-png.flaticon.com/128/702/702797.png

Rules: *Information* = context worth knowing. *Warning* = something irreversible or
easy to get wrong. *Error* = what the reader sees when it has gone wrong, plus the fix.
*Tip* = a shortcut or trick. Put the icon on a tinted box with a short bold lead-in. Download
the icons once to `screenshots/icons/` and reference them locally so the build is repeatable.

### Writing rules (these are what make it state of the art)

- Second person, present tense, active voice: "Type the customer number and press Enter."
- One action per numbered step. If a step has an "and", it is probably two steps.
- Every step that changes what is on screen must say what the reader will see next.
- Plain language throughout. No object names, DDS field names, record formats, indicators,
  file names, or program internals anywhere in the body text.
- Expand every acronym on first use, then add it to the glossary.
- Use the reader's words for things, and use the *same* word every time — pick "customer
  number" or "account number" and never mix them.
- Bold for anything the reader types, presses or selects: **F3=Exit**, option **5=Display**.
- Never say "simply", "just", "obviously", or "easy".
- Never document a behaviour you have not either read in the source or seen on a live screen.
  If something is genuinely uncertain, leave it out and flag it in your summary instead.
- Match the reader level `${audience_level}`: a first-time user needs the sign-on path and
  the meaning of the key line; a power user needs the shortcuts and the edge cases. Both need
  correct steps.
- Write the document in **${doc_language}**.

---

## 7. Phase 5 — Build the PDF

Build the PDF with **fpdf2** driven directly from your own
`/task-output/documentation/build_userguide.py`. Do not fight the `/pdf` skill's core-font
HTML subset for a document with icon callouts and key-cap chips.

Container facts that will otherwise cost you time:

- `fpdf` is not installed and `pip install` into system Python is blocked (PEP 668). Use
  `python3 -m venv /tmp/pdfvenv && /tmp/pdfvenv/bin/pip install fpdf2`.
- **`DejaVuSans-Oblique.ttf` does not exist here.** Only Sans, Sans-Bold, SansMono,
  SansMono-Bold, Serif, Serif-Bold. Register `DejaVuSerif.ttf` for the italic style.
- `multi_cell` defaults to **justified** — pass `align="L"` on every body-text call.
- `multi_cell` leaves the cursor at the RIGHT of the cell. Reset `x` explicitly before every
  `multi_cell`, or a following block runs off the page edge.
- fpdf2 continues content from wherever `header()` leaves `y`. End `header()` with
  `set_xy(l_margin, t_margin)` or headings overprint the header rule.
- `footer()` still fires on the cover page — guard on `page_no() == 1`, not on a flag you flip
  after drawing the cover.
- Place 24x80 screenshots at **152 mm centred** (~83 mm tall), not full 170 mm width — the
  full-width version rarely fits in a part-used page and leaves 40%-empty pages.
- Give heading helpers a keep-with-next budget
  (`if p.get_y() + need > p.h - 22: p.add_page()`) so a heading is never orphaned from the
  screenshot below it.

The PDF must have: a cover page, a table of contents with real page numbers, running page
numbers, consistent heading styles, and no orphaned headings or half-empty pages.

---

## 8. Phase 6 — Verify before you claim it is done

Do all of these, and report the results:

1. **Look at the PDF.** Render it back to images with `pypdfium2` (or `pdftoppm`) and actually
   inspect **every** page. Layout bugs in fpdf2 all fail silently.
2. **Screenshot audit** — every image in the guide traces to a real `screen-NNN.json` from
   your live session. List the correlation in your summary.
3. **Step replay** — walk your own numbered steps against your session notes. If a step says
   "press F7" and no captured screen shows F7 doing that, fix the step.
4. **Coverage check** — every screen in your screen inventory appears in Section 5; every task
   in your task inventory has a walkthrough in Section 6; every message in your message
   inventory appears in Section 9.
5. **Jargon sweep** — grep the finished Markdown for object names, DDS field names, record
   format names, indicator numbers and file names. Any hit in body text is a defect.
6. **Broken-reference sweep** — every screenshot path resolves, every icon renders, every
   internal link/TOC entry points somewhere real.

---

## 9. Task Summary Requirements

In `/task-output/summary.md`, in addition to the standard requirements:

- State the IBM i task library name (from `IBMI_BUILD_LIBRARY`).
- List the deliverable files and their paths.
- Include the **Exploratory Verification Results** section required by this environment: one
  numbered test case per screen/task you drove, each with a short pass/fail narrative and the
  `genie_html.sh` HTML rendering (`<iframe>`) of the live screen, embedded **at the root of the
  Markdown document** — not inside a list or table. Anything you could not reach is recorded
  as **BLOCKED** with the reason and no rendering.
- Note anything you deliberately left out of the guide because you could not verify it.

Do not commit anything. Leave all changes uncommitted in the working tree.
