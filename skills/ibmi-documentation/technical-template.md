\# Technical Documentation Template

Filename: \`\_Technical\_Documentation.md\`. Use this exact section order. Fill what applies; mark non-applicable sections with a one-line "Not applicable" instead of padding. See \`../mermaid-examples.md\` for all diagrams.

Start with a document-control block so the doc is versionable and auditable:

\`\`\`markdown

\# — Technical Documentation

| | |

|---|---|

| \*\*Program\*\* | |

| \*\*Type\*\* | \*PGM / \*SRVPGM / \*MODULE |

| \*\*Language\*\* | ILE RPG (\*\*FREE) / SQLRPGLE / ILE COBOL / CL |

| \*\*Source\*\* | LIBRARY/SRCFILE(MEMBER) or IFS path |

| \*\*IBM i target release\*\* | e.g. V7R5M0 (TGTRLS) |

| \*\*Version / Author / Date\*\* | 1.0 / / |

\### Revision History

| Version | Date | Author | Change | Ref |

|---|---|---|---|---|

| 1.0 | | | Initial documentation | |

\`\`\`

\## 1. Overview

Name, type, source path, purpose (2–4 sentences on what it does and its role). State how it is invoked: menu option, command, \`CALL\`, bound procedure, job scheduler, trigger, or exit point.

\## 2. Technical Specifications

\*\*Control Options\*\*

| Option | Value | Description |

|---|---|---|

| DFTACTGRP | \*NO | Runs in a named/\`\*CALLER\` activation group (ILE) |

| ACTGRP | value | Activation group strategy |

| BNDDIR | value | Binding directories bound at compile |

| OPTION | value | Compile options (e.g. \*SRCSTMT \*NODEBUGIO) |

| THREAD | value | Thread safety |

\*\*Input Parameters\*\* — direction is the most useful fact for a caller.

| Parameter | Data Type | Length | Direction (In/Out/Both) | Description |

|---|---|---|---|---|

\*\*Files Used\*\*

| File | Type | Usage | Access | Description |

|---|---|---|---|---|

| name | DISK/WORKSTN/PRINTER | Input/Output/Update/Add | Keyed/Sequential | purpose |

\*\*Service Programs / Procedures Called\*\*

| Service Program | Procedure | Bound/Dynamic | Description |

|---|---|---|---|

\## 3. ILE Structure & Invocation

\- \*\*Activation group\*\* — named / \`\*NEW\` / \`\*CALLER\`, and why it matters here (scoping of overrides, commitment definition, SQL cursors, RCLACTGRP behavior).

\- \*\*Binding\*\* — static (module/BNDDIR bound at compile) vs dynamic (\`CALL\`). For a \`\*SRVPGM\`, list exported procedures with signatures.

\- \*\*Call hierarchy\*\* — who calls this and what this calls (visualized in §5).

\## 4. Dependency Tree (text)

\`\`\`

PROGRAM.PGM

├── Source

│ ├── program.rpgle

│ └── copybook.rpgle (/COPY member)

├── Display Files

│ └── DSPFILE.FILE

├── Service Programs

│ └── SRVPGM.SRVPGM

├── Binding Directory

│ └── APPBND.BNDDIR

└── Database

    ├── CUSTPF.FILE (PF)

    └── CUSTLF1.FILE (LF, keyed on CUSTNO)

\`\`\`

\## 5. Dependency Diagram (Mermaid)

Layered top-down: UI → Display files → Service layer → Data layer. Use the template in \`../mermaid-examples.md\` (§ Dependency diagram).

\## 6. Complete Object Dependency List

One table per object type actually present: Programs (\`\*PGM\`), Service Programs (\`\*SRVPGM\`), Modules (\`\*MODULE\`), Display Files, Physical Files, Logical Files, Binding Directories, Data Areas / Data Queues, Message Files, Copy Members, Exported Procedures. Columns: Object, Type, Library, Source member, Description.

\## 7. Database Schema & Access (DB2 for i)

For each physical file:

| Field | Type | Length | Dec | Null | Description |

|---|---|---|---|---|---|

| name | Packed/Zoned/Char/Date/... | size | | Y/N | purpose |

Also document where present: \*\*keys & access paths\*\* (unique/non-unique; for LFs the select/omit and join specs); \*\*referential integrity\*\* (parent-child constraints, delete/update rules); \*\*triggers\*\* (before/after, insert/update/delete, trigger program); \*\*journaling\*\* (files and before/after images); \*\*commitment control\*\* (transaction boundaries, isolation level).

\## 8. Display File Layout

ASCII mock-up of the screen, then:

| Field | Length | Type (I/O/Both) | Description |

|---|---|---|---|

Add record-format descriptions and subfile behavior (page vs roll, SFLDROP).

\## 9. Program Flow (Mermaid) & Key Routines

A decision-aware flowchart (template in \`../mermaid-examples.md\`, § Program flow), followed by a short table of key subroutines/subprocedures and their purpose.

\## 10. Indicators Used

| Indicator | Purpose |

|---|---|

| \*INxx | description |

For free-format code that avoids numbered indicators, say so and document named indicators / condition fields instead.

\## 11. Error & Exception Handling

Explain the strategy, not just a list:

\- \*\*RPG\*\* — \`MONITOR\`/\`ON-ERROR\`, \`%ERROR\`/\`%STATUS\`, PSDS, INFDS, \`\*PSSR\`. (COBOL: \`DECLARATIVES\`, file status.)

\- \*\*Messages\*\* — program messages sent/received (escape, status, diagnostic, completion) and the message file/IDs used.

\- \*\*Conditions handled\*\*, the messages the user sees, and the recovery procedure for each.

\## 12. Security & Authority

Object ownership and public/private authority; authorization lists (\`\*AUTL\`); adopted authority (\`USRPRF \*OWNER\`) and why; sensitive-data handling (field procedures/encryption, masking, audit journal).

\## 13. Interfaces & Integration

For programs that talk to the outside: data queues / data areas used for hand-off, Integrated Web Services (REST/SOAP), FTP/SFTP/IFS exchange, exit programs/exit points, EDI/MQ. Give direction (inbound/outbound), format, and trigger for each.

\## 14. Batch / Job Flow

For batch objects: the CL driver, job-scheduler entry (times/frequency), job queue/subsystem, library-list setup, runtime overrides (\`OVRDBF\`/\`OVRPRTF\`), and restart/rerun procedure.

\## 15. Build & Compile

Actual create commands with the parameters that matter, plus build order:

\`\`\`

CRTRPGMOD MODULE(lib/PGM) SRCFILE(lib/QRPGLESRC) DBGVIEW(\*ALL)

CRTSRVPGM SRVPGM(lib/CUSTSVC) MODULE(...) EXPORT(\*SRCFILE) SRCFILE(lib/QSRVSRC)

CRTPGM PGM(lib/WRKCUST1R) MODULE(...) BNDDIR(lib/APPBND) ACTGRP(CUSTGRP)

\`\`\`

Then a build-dependency rule:

\`\`\`

wrkcust1r.pgm: wrkcust1r.rpgle custcpy.rpgle custd.dspf custsvc.srvpgm | appbnd.bnddir

\`\`\`

\## 16. Related Programs

| Program | Description | Relationship |

|---|---|---|

| name | purpose | caller / callee / alternate |

\## 17. Testing Notes

Test scenarios and expected results, test-data/setup needs, and any automated tests (e.g. RPGUnit). Optional for trivial objects.

\## 18. Version Information

| Attribute | Value |

|---|---|

| Source Format | Free-format (\*\*FREE) / /FREE blocks / Fixed-format |

| ILE Compatible | Yes/No |

| Activation Group | value |

| Uses Embedded SQL | Yes/No |

| Multi-threaded | Yes/No |

| Target Release (TGTRLS) | value |

\---

\## Technical checklist

\- \[ \] File named \`\_Technical\_Documentation.md\`

\- \[ \] Document-control block and revision history present

\- \[ \] Applicable sections completed; non-applicable ones marked, not padded

\- \[ \] Dependencies traced recursively; missing sources flagged

\- \[ \] ILE structure (activation group + binding) documented

\- \[ \] Database section covers keys/access paths and, where present, RI, triggers, journaling, commitment control

\- \[ \] Exception handling explains PSDS/INFDS/\`\*PSSR\`/\`MONITOR\`, not just a list

\- \[ \] Mermaid diagrams are syntactically valid and render

\- \[ \] Compile commands and build dependencies complete