---
name: codermake
description: Build IBM i objects from source code.
updatedAt: 2026-10-21T20:52:28.465Z
updatedBy: rbetancourt
updatedById: user_1767620468211_32t18oh94
updatedByName: Roger Betancourt
---

# codermake

codermake is a Make-based build tool for IBM i projects. It compiles RPG, COBOL, CL, DDS, and SQL source into IBM i objects (programs, modules, service programs, files, menus, message files, binding directories) either locally on IBM i or remotely via SSH.

## Key constraints

- **Never modify Makefiles.** codermake auto-generates Makefiles from `Rules.mk` files. Only edit `Rules.mk`.
- **Never modify environment variables or `.env` files** unless the user explicitly asks. Build configuration belongs to the user.
- **Source names and target names do not need to match.** The preprocessor infers the correct recipe from file extensions alone.

## Building

Run codermake from the project root:

```bash
# Build everything
codermake

# Build a single target
codermake <target>          # e.g. codermake mylib/mypgm.pgm (or the bare mypgm.pgm)

# Dry run (show the commands, without running them)
codermake -n

# List the objects a build would create or replace (no compile, no connection;
# remote builds only)
codermake --list-targets

# Clean all build artifacts
codermake clean

# Show the generated Makefile rules (useful for debugging)
codermake --print-rules
```

Build output for each target is logged to `tmp/logs/<target>.log`.

## Checking what a change affects

`codermake --list-targets` answers "what will my edit rebuild, and in what
order" without compiling anything or contacting the IBM i. It is available when
building remotely from Linux or macOS; running codermake locally on IBM i it is
refused, because there are no build markers to compare against. Each line reports one
object with its type, target library, source, and why it is affected:

- `changed` — one of the object's **own** sources changed: what it is compiled
  from, a `/COPY` member or copybook it includes, its export list
- `dependent` — it only needs building because **another object in the build**
  changed: a module it is bound from, a file it compiles against, or a file whose
  DDS it references for field definitions
- `missing` — the object does not exist yet

The `changed` rows are the objects that were edited and the `dependent` rows their
reach, so editing one field reference physical file's DDS reports that file as
`changed` and every file built over it as `dependent`. A shared source that no rule
builds into an object — a `/COPY` member — has no object to attribute the change
to, so every program that lists it is `changed`. Every listed object needs
rebuilding whatever its reason.

Use it to confirm that an edit reaches the objects intended before running a
build, and to see the blast radius of a change to shared source such as a `/COPY`
member. Add `=tsv` or `=json` for machine-readable output. Listing changes
nothing, so it is always safe to run.

After a successful build the list is empty, which makes it a quick check that
everything intended was actually built.

## Project layout

Every top-level directory of the project is an IBM i library directory. It holds one directory per source physical file, with one file per member (`mylib/qrpglesrc/mypgm.rpgle`), and can hold source files directly (`mylib/app.bnddir`). A library that receives objects has a `Rules.mk` declaring them — `mylib/Rules.mk`, or a `Rules.mk` inside one of its source-file directories (`mylib/qrpglesrc/Rules.mk`). Source can live in one library and its objects in another: a source-only library has no `Rules.mk`, and an object library's `Rules.mk` names its source with cross-library paths (`srclib/qrpglesrc/mypgm.rpgle`). A `Rules.mk` at the project root is an error.

## Rules.mk syntax

A `Rules.mk` declares build targets and their prerequisites. Names are resolved against the library the `Rules.mk` belongs to; codermake adds the output prefixes (`build/`, `/qsys.lib/...`) itself:

| Written as | Means |
|---|---|
| `mypgm.rpgle` | A source file in the Rules.mk's own directory |
| `qrpglesrc/mypgm.rpgle` | A source file in this library |
| `srclib/qrpglesrc/mypgm.rpgle` | A source file in another library directory |
| `myscreen.file` | An object in this library |
| `dtalib/custp.file` | An object in another library directory |

The examples below are written for a library-level `Rules.mk` (`mylib/Rules.mk`).

### Basic rules

```makefile
# program from RPG source
mypgm.pgm: qrpglesrc/mypgm.rpgle

# program from RPG source, depends on a display file
mypgm.pgm: qrpglesrc/mypgm.rpgle myscreen.file

# display file from DDS
myscreen.file: qddssrc/myscreen.dspf

# physical file from DDS
custdata.file: qddssrc/custdata.pf

# ILE CL program
setup.pgm: qclsrc/setup.clle
```

**The first normal prerequisite is the source** that creates the object, and it is what selects the compile command. Normal prerequisites after it are dependencies: they force a rebuild when they change but never change the command.

### Order-only prerequisites

Use `|` for objects that must exist before building the target but should not trigger a rebuild when they change. This is typical for binding directories and database files.

```makefile
mypgm.pgm: qrpglesrc/mypgm.rpgle mysrvpgm.srvpgm | mybnddir.bnddir mytable.file
```

### File objects that depend on other files

IBM i `*FILE` objects often depend on other files, and often on more than one: a logical file is based on one or more physical files, and a file of any type can take its field definitions from a field reference physical file (DDS `REF`/`REFFLD`). List the dependency's **source** as a normal prerequisite (so a change to it rebuilds the dependent file), and the dependency's **file object** as an order-only prerequisite (so it exists on IBM i at compile time):

```makefile
# Field reference physical file
fldref.file: qddssrc/fldref.pf

# Physical files whose fields come from the field reference file (REF)
custp.file: qddssrc/custp.pf qddssrc/fldref.pf | fldref.file
ordp.file: qddssrc/ordp.pf qddssrc/fldref.pf | fldref.file

# Logical file over one physical file
custl.file: qddssrc/custl.lf qddssrc/custp.pf | custp.file

# Join logical file over two physical files
custjoin.file: qddssrc/custjoin.lf qddssrc/custp.pf qddssrc/ordp.pf | custp.file ordp.file

# Display file with field references to two physical files (REF and REFFLD)
custd.file: qddssrc/custd.dspf qddssrc/fldref.pf qddssrc/ordp.pf | fldref.file ordp.file

# SQL view over a DDS physical file
custvw.file: qsqlsrc/custvw.view.sql qddssrc/custp.pf | custp.file
```

Keep the creating source first: `custl.file` compiles with `CRTLF` because `custl.lf` is the first prerequisite, not because of where `.pf` appears. This works for every source type that can create a `*FILE` (`.dspf`, `.pf`, `.lf`, `.prtf`, their System/38 `*38` variants, `.json`, and `.table.sql`/`.index.sql`/`.view.sql`).

`CRTPF`/`CRTLF`/`CRTDSPF`/`CRTPRTF` have no `REPLACE` parameter, so rebuilding a file whose object already exists fails with `CPF5813` — delete the object or run `codermake clean` first.

### Cross-library references

A path with a separator is relative to the Rules.mk's library directory, unless its first segment names a library directory — then it is a path into that library:

```makefile
# In LIBA/Rules.mk -- source in LIBA and in another library, LIBB
mysrvpgm.srvpgm: mymod.module qsrvsrc/api.exports
crosspgm.pgm: qrpglesrc/crosspgm.rpgle LIBB/qcpysrc/shared.rpgle
```

A two-segment name whose first segment is a library directory and whose second segment is an object filename (output extension) is a **cross-library object qualifier**:

```makefile
# In LIBA/Rules.mk -- depend on a srvpgm in LIBB
crossbnd.pgm: qrpglesrc/crossbnd.rpgle | LIBB/utils.srvpgm

# Library-qualified target: source in LIBA, output lands in LIBB
LIBB/installer.pgm: qrpglesrc/installer.rpgle
```

A library qualifier whose first segment is not a library directory is an error — codermake will tell you which token failed validation.

### Message files and binding directories (dual-purpose pattern)

The `.msgf` and `.bnddir` extensions serve double duty -- as source when they are the first prerequisite of a matching target type, and as built objects everywhere else:

```makefile
# Build a message file (source file mylib/appmsg.msgf -> object)
appmsg.msgf: appmsg.msgf

# Build a binding directory (source file mylib/mybnddir.bnddir -> object)
mybnddir.bnddir: mybnddir.bnddir

# Use them as dependencies (treated as built objects)
mymenu.menu: mymenu.file appmsg.msgf
setup.pgm: qrpglesrc/setup.rpgle | mybnddir.bnddir
```

The `.msgf` source file contains CL commands (`CRTMSGF`, `ADDMSGD`, etc.). The `.bnddir` source file contains CL commands (`CRTBNDDIR`, `ADDBNDDIRE`, etc.).

### Modules and service programs

```makefile
# Compile source to a module
mymod.module: qrpglesrc/mymod.rpgle

# Link modules into a program
mypgm.pgm: mod1.module mod2.module

# Link with automatic BNDSRVPGM parameter
calc.pgm: calc.module utils.srvpgm

# Link with automatic BNDDIR parameter
calcd.pgm: calcd.module | app.bnddir

# Create a service program from modules + export list
mysrvpgm.srvpgm: mymod.module qsrvsrc/mymod.exports

# Create a service program without export list (exports all procedures)
mysrvpgm.srvpgm: mymod.module
```

When `.srvpgm` or `.bnddir` appear as prerequisites (normal or order-only) on `.pgm` or `.srvpgm` targets built via CRTPGM/CRTSRVPGM, the corresponding `BNDSRVPGM()` and `BNDDIR()` parameters are automatically added to the command. This only applies to module-based targets — for source-based programs (e.g., CRTBNDRPG), `.srvpgm` and `.bnddir` prerequisites are build-ordering dependencies only.

The `.exports` (or `.bnd`) file is a text file listing exported procedure symbols:

```
STRPGMEXP PGMLVL(*CURRENT) SIGNATURE(*GEN)
  EXPORT SYMBOL("myProcedure")
  EXPORT SYMBOL("anotherProc")
ENDPGMEXP
```

## Quick reference: source-to-object mapping

| Source extension | Target extension | IBM i object | CL command |
|---|---|---|---|
| `.rpgle` | `.pgm` | Program (*PGM) | `CRTBNDRPG` |
| `.rpgle` | `.module` | Module (*MODULE) | `CRTRPGMOD` |
| `.sqlrpgle` | `.pgm` | Program (*PGM) | `CRTSQLRPGI OBJTYPE(*PGM)` |
| `.sqlrpgle` | `.module` | Module (*MODULE) | `CRTSQLRPGI OBJTYPE(*MODULE)` |
| `.cblle` | `.pgm` | Program (*PGM) | `CRTBNDCBL` |
| `.cblle` | `.module` | Module (*MODULE) | `CRTCBLMOD` |
| `.sqlcblle` | `.pgm` | Program (*PGM) | `CRTSQLCBLI OBJTYPE(*PGM)` |
| `.sqlcblle` | `.module` | Module (*MODULE) | `CRTSQLCBLI OBJTYPE(*MODULE)` |
| `.cbl` | `.pgm` | Program (*PGM) | `CRTCBLPGM ... REPLACE(*YES)` (OPM COBOL, QCBLSRC member) |
| `.cbl38` | `.pgm` | Program (*PGM) | `QSYS38/CRTCBLPGM` (System/38 COBOL, delete-then-create) |
| `.sqlcbl` | `.pgm` | Program (*PGM) | `CRTSQLCBL ... REPLACE(*YES)` (OPM COBOL + SQL, QLBLSRC member) |
| `.clle` | `.pgm` | Program (*PGM) | `CRTBNDCL` |
| `.clle` | `.module` | Module (*MODULE) | `CRTCLMOD` |
| `.clp` / `.cl` | `.pgm` | Program (*PGM) | `CRTCLPGM` |
| `.clp38` | `.pgm` | Program (*PGM) | `QSYS38/CRTCLPGM` (System/38, delete-then-create) |
| `.rpg` | `.pgm` | Program (*PGM) | `CRTRPGPGM ... REPLACE(*YES)` (RPG/400) |
| `.rpg38` | `.pgm` | Program (*PGM) | `QSYS38/CRTRPGPGM` (System/38 RPG III, delete-then-create) |
| `.proc.sql` | `.pgm` | SQL Procedure (*PGM) | `RUNSQLSTM` |
| `.proc.sql` | `.srvpgm` | SQL Procedure (*SRVPGM, `PROGRAM TYPE SUB`) | `RUNSQLSTM` |
| `.udf.sql` | `.srvpgm` | SQL Function (*SRVPGM, `LANGUAGE SQL`) | `RUNSQLSTM` |
| `.trg.sql` | `.pgm` | SQL Trigger Program (*PGM) | `RUNSQLSTM` |
| `.module` (1+) | `.pgm` | Program (*PGM) | `CRTPGM` |
| `.module` + `.exports` or `.bnd` | `.srvpgm` | Service Program (*SRVPGM) | `CRTSRVPGM EXPORT(*SRCFILE)` |
| `.module` (no exports) | `.srvpgm` | Service Program (*SRVPGM) | `CRTSRVPGM EXPORT(*ALL)` |
| `.dspf` | `.file` | Display File (*FILE) | `CRTDSPF` |
| `.json` (RDF) | `.file` | Display File (*FILE) | `CRTDSPF` |
| `.pf` | `.file` | Physical File (*FILE) | `CRTPF` |
| `.lf` | `.file` | Logical File (*FILE) | `CRTLF` |
| `.prtf` | `.file` | Printer File (*FILE) | `CRTPRTF` |
| `.dspf38` | `.file` | Display File (*FILE) | `QSYS38/CRTDSPF` (System/38, `DSPF38` member) |
| `.pf38` | `.file` | Physical File (*FILE) | `QSYS38/CRTPF` (System/38, `PF38` member) |
| `.lf38` | `.file` | Logical File (*FILE) | `QSYS38/CRTLF` (System/38, `LF38` member) |
| `.prtf38` | `.file` | Printer File (*FILE) | `QSYS38/CRTPRTF` (System/38, `PRTF38` member) |
| `.table.sql` | `.file` | SQL Table (*FILE) | `RUNSQLSTM` |
| `.index.sql` | `.file` | SQL Index (*FILE) | `RUNSQLSTM` |
| `.view.sql` | `.file` | SQL View (*FILE) | `RUNSQLSTM` |
| `.file` + `.msgf` | `.menu` | Menu (*MENU) | `CRTMNU` |
| `.msgf` (CL src) | `.msgf` | Message File (*MSGF) | `CRTMSGF` / `ADDMSGD` |
| `.bnddir` (CL src) | `.bnddir` | Binding Dir (*BNDDIR) | `CRTBNDDIR` / `ADDBNDDIRE` |

For full details on every type, see [references/file-types.md](references/file-types.md).

## Adding a new target

Follow this procedure when adding a new object to the build:

1. **Create the source file** in the appropriate library and source-file directory (e.g., `mylib/qrpglesrc/newpgm.rpgle`).
2. **Add a rule to the `Rules.mk`** of the library the object belongs in (e.g., `mylib/Rules.mk`):
   ```makefile
   newpgm.pgm: qrpglesrc/newpgm.rpgle
   ```
3. **Declare dependencies** on any objects that must exist first:
   ```makefile
   newpgm.pgm: qrpglesrc/newpgm.rpgle myscreen.file mysrvpgm.srvpgm | mybnddir.bnddir
   ```
4. **Build and verify:**
   ```bash
   codermake mylib/newpgm.pgm
   ```
5. **Check logs on failure:** `tmp/logs/newpgm.pgm.log`

If the target is a module destined for a service program or multi-module program, also add the downstream rule:

```makefile
newmod.module: qrpglesrc/newmod.rpgle
existing.srvpgm: existing_mod.module newmod.module qsrvsrc/existing.exports
```

## Troubleshooting

Build logs are in `tmp/logs/<target>.log`. In multi-library output mode (when `CODERMAKE_LIBRARY_MAP` is set) logs are nested under the IBM i library: `tmp/logs/<libraryName>/<target>.log`. When a build fails:

1. Open the log file for the failing target.
2. Search for error message IDs (e.g., `RNF`, `SQL`, `CPF`, `CPD`).
3. For RPG/SQL RPG, look at the message summary near the end of the listing -- severity 30+ messages are errors.
4. For DDS/CL, look for `CPF` or `CPD` message IDs in the output.
5. Use `codermake --print-rules` to verify the generated Makefile if the target is not being built at all.

Common errors:

- **`Invalid library qualifier '<lib>/<obj>.<ext>': '<lib>' is not a known library directory.`** — the first segment of a two-segment qualifier doesn't match any top-level library directory. Either fix the typo or add the missing library directory.
- **`Rules.mk at the project root is not supported.`** — rules belong to a library. Move them into the `Rules.mk` of the library the objects belong to, writing source paths relative to that library directory.
- **`Source member not found: <member> in <lib>/<file>/ ...`** (RPG) or **`Copy member not found: ...`** (COBOL) — a member-style `/COPY` or `COPY` names a member no library directory holds. The message lists the libraries searched; check the member's file name and source-file directory.
- **`<envvar> and CODERMAKE_LIBRARY_MAP are mutually exclusive.`** — only one output-mode variable can be set. Pick `BUILD_LIBRARY`/`IBMI_BUILD_LIBRARY` (single library) **or** `CODERMAKE_LIBRARY_MAP` (per-library output).
- **`CODERMAKE_LIBRARY_MAP is missing entries for: <dir1>, <dir2>`** — every library directory with a `Rules.mk` must appear in an explicit map (source-only library directories are not required). Add the missing entries, or switch to `CODERMAKE_LIBRARY_MAP=auto` for natural mapping.

For detailed guidance on reading compile listings, see [references/compile-listings.md](references/compile-listings.md).

## Environment variables

codermake reads its configuration from environment variables (typically set in a `.env` file at the project root).

### Remote builds (from Linux/macOS to IBM i via SSH)

| Variable | Description |
|---|---|
| `IBMI_BUILD_LIBRARY` | Target IBM i library for compiled objects (single-library output mode) |
| `IBMI_HOST` | IBM i hostname or IP address |
| `IBMI_USER` | SSH username on the IBM i |
| `IBMI_KEY` | Path to SSH private key (optional) |

### Local builds (on IBM i PASE)

| Variable | Description |
|---|---|
| `BUILD_LIBRARY` | Target IBM i library for compiled objects (single-library output mode) |

### Multi-library output (alternative to BUILD_LIBRARY / IBMI_BUILD_LIBRARY)

`CODERMAKE_LIBRARY_MAP` enables per-library output — each library directory with a `Rules.mk` builds into its own IBM i library. Mutually exclusive with `BUILD_LIBRARY` / `IBMI_BUILD_LIBRARY`.

| Variable | Description |
|---|---|
| `CODERMAKE_LIBRARY_MAP` | Either `auto` (natural mapping: dir name → library name) or explicit `LIBA=APPLIBA LIBB=APPLIBB` pairs. Mutually exclusive with `BUILD_LIBRARY` / `IBMI_BUILD_LIBRARY`. |
| `CODERMAKE_LIBRARY_LIST` | Optional. Space-separated, ordered IBM i library list. Replaces the user portion of the build job's library list. Also valid in single-library output mode, where the build library stays at the front, ahead of the list. |

Refer to objects in another library with the qualifier syntax `<libraryDir>/<bareobj>.<ext>` (see *Cross-library references* above); it works in both output modes.

### Copy member search

| Variable | Description |
|---|---|
| `CODERMAKE_INCLUDE_PATH` | Optional. Space-separated, ordered library directories searched for unqualified member-style RPG `/COPY`/`/INCLUDE` and COBOL `COPY ... OF` references. Without it, every library directory is searched. |

## Compile options

To change the parameters passed to IBM i compile commands (e.g. target
release, debug view), edit `.codermake/config.json` in the project root — **do
not edit the Makefiles**. The file is optional; when absent, codermake uses its
built-in parameters.

```json
{
  "targetRelease": "V7R4M0",
  "compileOptions": {
    "crtbndrpg":  { "dbgview": "*all" },
    "crtrpgpgm":  { "option": ["*srcdbg"] },
    "runsqlstm":  { "commit": "*chg" },
    "crtsqlrpgi": { "dbgview": "*source", "compileopt": { "optimize": "*full" } }
  }
}
```

- **`targetRelease`** sets `TGTRLS`, applied to each compile command that
  accepts it — do not add `tgtrls` under `compileOptions`.
- **`compileOptions`** is keyed by lowercase CL command name (`crtbndrpg`,
  `crtsqlrpgi`, `qsys38/crtclpgm`, ...). Each keyword is added to that command;
  values may be a string or an array (`["*a", "*b"]` → `KEYWORD(*A *B)`).
- **Reserved** parameters that codermake owns (`pgm`, `srcstmf`,
  `output(*print)`, `tgtccsid`, and similar) cannot be overridden — attempting
  to set one is a hard error.
- `option` and `compileopt` are **augmentable**: your values merge with the
  parts codermake requires (`OPTION` always keeps `*SOURCE`; `COMPILEOPT` keeps
  its `incdir`/`tgtccsid`/`output`).

Preview the effect without building: `codermake --print-makefile` shows the
resolved parameters, and `codermake -n <target>` prints the expanded compile
command.
