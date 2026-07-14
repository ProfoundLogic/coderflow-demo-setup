\# Analysis Process

Do all of this before writing either document. The quality of the output is capped by how carefully the sources are read.

\## Step 1 — Locate and read sources in dependency order

Read in this order so shared definitions are known before the code that uses them:

1\. Main source: \`\*.rpgle\`, \`\*.sqlrpgle\`, \`\*.clle\`, \`\*.clp\`, \`\*.cblle\`.

2\. Copy members it pulls in: \`/COPY\`, \`/INCLUDE\`, COBOL copybooks. \*\*Read these before concluding what data structures and prototypes exist\*\* — most real logic and interface definitions live in shared prototypes, not the main member.

3\. Display sources (\`\*.dspf\`) and printer sources (\`\*.prtf\`).

4\. File definitions: \`\*.pf\`, \`\*.lf\`, and DDL (\`CREATE TABLE\`/\`VIEW\`/\`INDEX\`).

\## Step 2 — Detect the dialect precisely

The reader needs to know exactly what they're maintaining:

\- \*\*RPG\*\*: fully free-format (\`\*\*FREE\` on line 1), free-format \`/FREE … /END-FREE\` blocks inside fixed-format, or classic fixed-format H/F/D/C specs. Read control options from \`CTL-OPT\` (free) or the H-spec (fixed).

\- \*\*COBOL\*\*: fixed vs free source format; ILE (\`CBLLE\`) vs OPM.

\- \*\*SQL\*\*: embedded SQL (\`EXEC SQL\`) present → the object compiles with \`CRTSQLRPGI\`/\`CRTSQLCBLI\`, not the plain compiler. Note this — it affects the build section.

\## Step 3 — Extract technical facts from the source

Pull and record:

\- \*\*Control options\*\* — \`DFTACTGRP\`, \`ACTGRP\`, \`BNDDIR\`, \`OPTION\`, \`THREAD\`, \`TGTRLS\`.

\- \*\*File declarations\*\* — \`DCL-F\` / F-specs, with usage (\`\*INPUT\` / \`\*OUTPUT\` / \`\*UPDATE\` / \`\*ADD\`) and keyed vs sequential access.

\- \*\*Entry parameters\*\* — \`DCL-PI \*ENTRY\` / \`\*ENTRY PLIST\` / procedure prototypes, with each parameter's direction (input / output / both). Direction is the single most useful fact for a caller.

\- \*\*External calls\*\* — bound calls (\`CALLP\`, direct procedure calls, \`%PADDR\`) vs dynamic \`CALL\`. Distinguish them; they document differently.

\- \*\*Embedded SQL\*\* — every statement, cursor, and whether commitment control is in play.

\- \*\*Data structures\*\* — including PSDS (Program Status Data Structure) and INFDS (File Information Data Structure).

\- \*\*Message handling\*\* — \`SNDPGMMSG\` / \`QMHSNDPM\`, and whether escape / status / diagnostic / completion messages are sent or monitored.

\## Step 4 — Trace dependencies recursively

For every object referenced, document the direct dependency, then open \*\*its\*\* source and repeat until the tree is complete. A service program often pulls in several more; the full map is the point of this skill.

If a source is unavailable, record the object as a dependency and mark it \`(source not available — documented from reference only)\`. Never invent the internals of an object you couldn't read.

\## Step 5 — Analyze display and printer files

From DSPF: record formats; every field with attributes (input / output / both, length, type); subfile definitions (\`SFL\` / \`SFLCTL\`, page vs roll, \`SFLDROP\`); function-key assignments (\`CFxx\` / \`CAxx\`); conditioning indicators; and field-level validation / edit codes.

From PRTF: page layout, headings, detail and total lines, level breaks, and overflow handling.

\## Step 6 — Document database access (DB2 for i)

List every table/file read or written, with usage. For each: field layout; key fields and access path; and — where they exist — referential constraints (with delete/update rules), triggers (before/after, insert/update/delete, trigger program), journaling (which files, before/after images), and the program's commitment-control boundaries (\`COMMIT\` / \`ROLLBACK\`, isolation level). Distinguish native record-level access from set-based SQL.

\## Step 7 — Write the document

Write the technical document following \`technical-template.md\`, then save and present it.