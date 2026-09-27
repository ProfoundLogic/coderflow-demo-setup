# File Types Reference

Complete reference for all source and object types supported by codermake. Each entry shows the Rules.mk syntax and the IBM i CL command used to compile it.

## Programs (.pgm)

### RPG program from .rpgle

Compiles an ILE RPG source file into a bound program.

```makefile
mypgm.pgm: mypgm.rpgle
```

**CL command:** `CRTBNDRPG PGM(LIB/MYPGM) SRCSTMF('src/mypgm.rpgle')`

### SQL RPG program from .sqlrpgle

Compiles an RPG source file with embedded SQL into a bound program. Two-phase compilation: SQL precompile, then RPG compile.

```makefile
mypgm.pgm: mypgm.sqlrpgle
```

**CL command:** `CRTSQLRPGI OBJ(LIB/MYPGM) OBJTYPE(*PGM) SRCSTMF('src/mypgm.sqlrpgle')`

### ILE COBOL program from .cblle

Compiles an ILE COBOL source file into a bound program.

```makefile
mypgm.pgm: mypgm.cblle
```

**CL command:** `CRTBNDCBL PGM(LIB/MYPGM) SRCSTMF('src/mypgm.cblle')`

COBOL `COPY` statements are resolved at compile time — see
[COBOL copy sources](#cobol-copy-sources) below.

### SQL ILE COBOL program from .sqlcblle

Compiles an ILE COBOL source file with embedded SQL into a bound program. Two-phase compilation: SQL precompile, then COBOL compile (whose parameters are passed through `COMPILEOPT`).

```makefile
mypgm.pgm: mypgm.sqlcblle
```

**CL command:** `CRTSQLCBLI OBJ(LIB/MYPGM) OBJTYPE(*PGM) SRCSTMF('src/mypgm.sqlcblle')`

The SQL precompiler does not expand `COPY` statements, so host variables must be declared in the program itself (or pulled in with `EXEC SQL INCLUDE`).

### OPM COBOL program from .cbl

OPM COBOL cannot compile from stream files, so the source is staged as a member in
`QCBLSRC` first, then compiled with `CRTCBLPGM`. `COPY` statements reference source
members; list each copybook as a prerequisite so codermake creates it as a source
member too (in the source file named by the prereq's parent directory, in the
program's library — or, in multi-library output mode, the library mapped from the
prereq's leading library-directory segment).

```makefile
mypgm.pgm: mypgm.cbl
mycpy.pgm: mycpy.cbl qcpysrc/cpybook.cpy    # COPY CPYBOOK OF QCPYSRC staged as QCPYSRC/CPYBOOK
```

**CL command:** `CRTCBLPGM PGM(LIB/MYPGM) SRCFILE(LIB/QCBLSRC) SRCMBR(MYPGM) OPTION(*SOURCE) REPLACE(*YES)`

### System/38 COBOL program from .cbl38

Like `.cbl`, but compiled with `QSYS38/CRTCBLPGM` and the staged member is tagged
`CBL38`. `QSYS38/CRTCBLPGM` has no `REPLACE` parameter, so the recipe deletes any
existing program object first. `COPY` members are handled the same way as `.cbl`.
The System/38 compiler is ANSI 74 COBOL, so its reserved word list differs from
ILE COBOL's.

```makefile
mypgm.pgm: mypgm.cbl38
```

**CL command:** `QSYS38/CRTCBLPGM PGM(LIB/MYPGM) SRCFILE(LIB/QCBLSRC) SRCMBR(MYPGM) OPTION(*SOURCE)`

### OPM COBOL program with embedded SQL from .sqlcbl

`CRTSQLCBL` has no `SRCSTMF` parameter either, so the source is staged as a member
in `QLBLSRC` (the command's own default source file), with `COPY` prerequisites
staged as members.

```makefile
mypgm.pgm: mypgm.sqlcbl
```

**CL command:** `CRTSQLCBL PGM(LIB/MYPGM) SRCFILE(LIB/QLBLSRC) SRCMBR(MYPGM) OPTION(*SOURCE) REPLACE(*YES)`

### ILE CL program from .clle

Compiles an ILE CL source file into a bound program.

```makefile
mypgm.pgm: mypgm.clle
```

**CL command:** `CRTBNDCL PGM(LIB/MYPGM) SRCSTMF('src/mypgm.clle')`

### OPM CL program from .clp or .cl

Compiles an OPM CL source file into a program. Uses source members (not stream files). OPM CL cannot be compiled to modules.

```makefile
mypgm.pgm: mypgm.clp
```

**CL command:** `CRTCLPGM PGM(LIB/MYPGM) SRCFILE(LIB/QCLSRC)`

### System/38 OPM CL program from .clp38

System/38 compatible OPM CL. Like `.clp`, it compiles from a source member (`QCLSRC`).
`QSYS38/CRTCLPGM` has no `REPLACE` parameter, so the recipe deletes any existing
program object first.

```makefile
mycl38.pgm: mycl38.clp38
```

**CL command:** `QSYS38/CRTCLPGM PGM(LIB/MYCL38) SRCFILE(LIB/QCLSRC) SRCMBR(MYCL38) OPTION(*SOURCE)`

### RPG/400 (RPG III) program from .rpg

RPG III cannot compile from stream files, so the source is staged as a member in
`QRPGSRC` first, then compiled with `CRTRPGPGM`. `/COPY` directives always
reference source members; list each `/COPY` target as a prerequisite so codermake
creates it as a source member too (in the source file named by the prereq's parent
directory, in the program's library — or, in multi-library output mode, the library
mapped from the prereq's leading library-directory segment). RPG III has no
`/INCLUDE` directive and defaults the source file to `QRPGSRC` when unqualified.

```makefile
myrpg.pgm: myrpg.rpg
mycpy.pgm: mycpy.rpg qcpysrc/shared.rpg    # /COPY QCPYSRC,SHARED staged as QCPYSRC/SHARED
```

**CL command:** `CRTRPGPGM PGM(LIB/MYRPG) SRCFILE(LIB/QRPGSRC) SRCMBR(MYRPG) OPTION(*SOURCE) REPLACE(*YES)`

### System/38 RPG III program from .rpg38

Like `.rpg`, but compiled with `QSYS38/CRTRPGPGM` and the staged member is tagged
`RPG38`. `QSYS38/CRTRPGPGM` has no `REPLACE` parameter, so the recipe deletes any
existing program object first. `/COPY` members are handled the same way as `.rpg`.

```makefile
myrpg38.pgm: myrpg38.rpg38
```

**CL command:** `QSYS38/CRTRPGPGM PGM(LIB/MYRPG38) SRCFILE(LIB/QRPGSRC) SRCMBR(MYRPG38) OPTION(*SOURCE)`

### SQL procedure from .proc.sql

Runs a SQL DDL script that creates a stored procedure. With the default `PROGRAM TYPE MAIN`, the resulting object is a program (`*PGM`).

```makefile
getcount.pgm: getcount.proc.sql
```

**CL command:** `RUNSQLSTM SRCSTMF('src/getcount.proc.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

A `.proc.sql` whose routine uses `PROGRAM TYPE SUB`, and a `.udf.sql` SQL function, are backed by `*SRVPGM` objects instead — see [SQL service programs](#sql-service-programs-from-procsql--udfsql) under Service programs.

### SQL trigger program from .trg.sql

Runs a SQL DDL script that creates a trigger. IBM i creates the generated trigger program object (`*PGM`) when `CREATE TRIGGER` runs.

```makefile
emptrg.pgm: emptrg.trg.sql employee.file empaudit.file
```

**CL command:** `RUNSQLSTM SRCSTMF('src/emptrg.trg.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

Use the trigger name or `PROGRAM NAME` in the source so the generated program object matches the `.pgm` build target.

### Program from modules

Links one or more compiled modules into a program. Prerequisites include `.module` targets, and optionally `.srvpgm` and `.bnddir` (normal or order-only) for automatic binding.

```makefile
mypgm.pgm: mod1.module mod2.module
calc.pgm: calc.module utils.srvpgm
calcd.pgm: calcd.module | app.bnddir
```

**CL command:** `CRTPGM PGM(LIB/MYPGM) MODULE(LIB/MOD1 LIB/MOD2)`

When `.srvpgm` prerequisites are present, `BNDSRVPGM(name ...)` is appended. When `.bnddir` prerequisites are present (normal or order-only), `BNDDIR(name ...)` is appended.

## Modules (.module)

Modules are intermediate compile units that are linked into programs or service programs.

### RPG module from .rpgle

```makefile
mymod.module: mymod.rpgle
```

**CL command:** `CRTRPGMOD MODULE(LIB/MYMOD) SRCSTMF('src/mymod.rpgle')`

### SQL RPG module from .sqlrpgle

```makefile
mymod.module: mymod.sqlrpgle
```

**CL command:** `CRTSQLRPGI OBJ(LIB/MYMOD) OBJTYPE(*MODULE) SRCSTMF('src/mymod.sqlrpgle')`

### ILE COBOL module from .cblle

```makefile
mymod.module: mymod.cblle
```

**CL command:** `CRTCBLMOD MODULE(LIB/MYMOD) SRCSTMF('src/mymod.cblle')`

### SQL ILE COBOL module from .sqlcblle

```makefile
mymod.module: mymod.sqlcblle
```

**CL command:** `CRTSQLCBLI OBJ(LIB/MYMOD) OBJTYPE(*MODULE) SRCSTMF('src/mymod.sqlcblle')`

### ILE CL module from .clle

```makefile
mymod.module: mymod.clle
```

**CL command:** `CRTCLMOD MODULE(LIB/MYMOD) SRCSTMF('src/mymod.clle')`

## Service programs (.srvpgm)

A service program is created from one or more modules, optionally with an export list (`.exports` or `.bnd` file). The export list defines which procedures are visible to callers.

### With export list

```makefile
mymod.module: mymod.rpgle
mysrvpgm.srvpgm: mymod.module mysrvpgm.exports
```

**CL command:** `CRTSRVPGM SRVPGM(LIB/MYSRVPGM) MODULE(LIB/MYMOD) EXPORT(*SRCFILE) SRCSTMF('src/mysrvpgm.exports')`

### Without export list (export all)

When no `.exports` or `.bnd` file is listed, all procedures are exported:

```makefile
mymod.module: mymod.rpgle
mysrvpgm.srvpgm: mymod.module
```

**CL command:** `CRTSRVPGM SRVPGM(LIB/MYSRVPGM) MODULE(LIB/MYMOD) EXPORT(*ALL)`

### Binding dependencies

Service programs can also depend on other service programs or binding directories for automatic binding:

```makefile
mysrvpgm.srvpgm: mymod.module mysrvpgm.exports dep.srvpgm
```

This appends `BNDSRVPGM(DEP)` to the CRTSRVPGM command. `.bnddir` prerequisites (normal or order-only) append `BNDDIR(name)`.

### SQL service programs from .proc.sql / .udf.sql

A service program can also be created from SQL source via `RUNSQLSTM`, with no modules or export list:

- **`.proc.sql` → `.srvpgm`** — `CREATE PROCEDURE ... LANGUAGE SQL PROGRAM TYPE SUB` is backed by a `*SRVPGM`.
- **`.udf.sql` → `.srvpgm`** — `CREATE FUNCTION ... LANGUAGE SQL` (SQL UDF) is backed by a `*SRVPGM`.

```makefile
getcounts.srvpgm: getcounts.proc.sql employee.file   # PROGRAM TYPE SUB
getname.srvpgm: getname.udf.sql employee.file         # SQL UDF
```

**CL command:** `RUNSQLSTM SRCSTMF('src/getcounts.proc.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

codermake only runs the SQL statement; IBM i creates the `*SRVPGM` and derives its object name from the SQL routine. Name the routine (and its `SPECIFIC` name where applicable) to match the build target so the generated object name lines up with the rule.

### .exports / .bnd file format

The exports file (using either `.exports` or `.bnd` extension) is a plain text file with the following structure:

```
STRPGMEXP PGMLVL(*CURRENT) SIGNATURE(*GEN)
  EXPORT SYMBOL("procedureName")
  EXPORT SYMBOL("anotherProc")
ENDPGMEXP
```

List every procedure that callers should be able to invoke. Procedure names are case-sensitive and must match the RPG prototype names exactly.

## Files (.file)

The `.file` target extension covers several distinct IBM i object types, differentiated by the source extension.

### Display file from .dspf

Creates a display file from DDS source.

```makefile
myscreen.file: myscreen.dspf
```

**CL command:** `CRTDSPF FILE(LIB/MYSCREEN) SRCFILE(LIB/QDDSSRC)`

### Rich Display File from .json

Creates a display file from Profound UI Rich Display File JSON. The JSON is converted to DDS before compilation.

```makefile
myscreen.file: myscreen.json
```

**CL command:** `CRTDSPF FILE(LIB/MYSCREEN) SRCFILE(LIB/QDDSSRC) ENHDSP(*YES)`

### Physical file from .pf

Creates a physical file from DDS source.

```makefile
custdata.file: custdata.pf
```

**CL command:** `CRTPF FILE(LIB/CUSTDATA) SRCFILE(LIB/QDDSSRC)`

### Logical file from .lf

Creates a logical file (view/index over a physical file) from DDS source. Typically depends on the physical file it references.

```makefile
custview.file: custview.lf custdata.file
```

**CL command:** `CRTLF FILE(LIB/CUSTVIEW) SRCFILE(LIB/QDDSSRC)`

### Printer file from .prtf

Creates a printer file from DDS source.

```makefile
report.file: report.prtf
```

**CL command:** `CRTPRTF FILE(LIB/REPORT) SRCFILE(LIB/QDDSSRC)`

### System/38 compatible DDS (.pf38, .lf38, .dspf38, .prtf38)

System/38 compatible versions of `.pf`, `.lf`, `.dspf`, and `.prtf`. They build
through dedicated recipes that qualify the compile command from `QSYS38`. The
parameters currently match the base DDS recipes, but the commands are
`QSYS38/CRTPF`, `QSYS38/CRTLF`, `QSYS38/CRTDSPF`, and `QSYS38/CRTPRTF`. The
temporary source member's source type is derived from the file extension:
`.pf38` → `PF38`, `.lf38` → `LF38`, `.dspf38` → `DSPF38`, `.prtf38` → `PRTF38`.
Use these when a source member must retain its System/38 source type.

```makefile
custp38.file: custp38.pf38                 # QSYS38/CRTPF,   PF38 member
custl38.file: custl38.lf38 custp38.file    # QSYS38/CRTLF,   LF38 member
hello38.file: hello38.dspf38               # QSYS38/CRTDSPF, DSPF38 member
rpt38.file: rpt38.prtf38                   # QSYS38/CRTPRTF, PRTF38 member
```

**CL commands:** `QSYS38/CRTPF` / `QSYS38/CRTLF` / `QSYS38/CRTDSPF` / `QSYS38/CRTPRTF`

### SQL table from .table.sql

Creates a SQL table by running a DDL script.

```makefile
employee.file: employee.table.sql
```

**CL command:** `RUNSQLSTM SRCSTMF('src/employee.table.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

### SQL index from .index.sql

Creates a SQL index by running a DDL script. Typically depends on the table it indexes.

```makefile
empname.file: empname.index.sql employee.file
```

**CL command:** `RUNSQLSTM SRCSTMF('src/empname.index.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

### SQL view from .view.sql

Creates a SQL view by running a DDL script. Typically depends on the tables it references.

```makefile
empview.file: empview.view.sql employee.file
```

**CL command:** `RUNSQLSTM SRCSTMF('src/empview.view.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

## Menus (.menu)

A menu object requires both a display file and a message file.

```makefile
mymenu.menu: mymenu.file mymenu.msgf
```

**CL command:** `CRTMNU MENU(LIB/MYMENU) TYPE(*DSPF) DSPF(LIB/MYMENU) MSGF(LIB/MYMENU)`

## Message files (.msgf)

Message files use the dual-purpose pattern: the `.msgf` extension is both the source and the target. The source file contains CL commands that create and populate the message file.

```makefile
# Build the message file
appmsg.msgf: appmsg.msgf

# Use as a dependency (treated as a built object)
mymenu.menu: mymenu.file appmsg.msgf
```

**Typical source content (src/appmsg.msgf):**

```cl
CRTMSGF MSGF($LIBRARY/$NAME)
ADDMSGD MSGID(MSG0001) MSGF($LIBRARY/$NAME) MSG('First message') SECLVL('Detail text')
```

The `$LIBRARY` and `$NAME` variables are set automatically by codermake at build time.

## Binding directories (.bnddir)

Binding directories also use the dual-purpose pattern. The source file contains CL commands that create the binding directory and add entries to it.

```makefile
# Build the binding directory (order-only dep ensures srvpgm exists first)
mybnddir.bnddir: mybnddir.bnddir | mysrvpgm.srvpgm

# Use as order-only dependency
mypgm.pgm: mypgm.rpgle mysrvpgm.srvpgm | mybnddir.bnddir
```

**Typical source content (src/mybnddir.bnddir):**

```cl
CRTBNDDIR BNDDIR($LIBRARY/$NAME)
ADDBNDDIRE BNDDIR($LIBRARY/$NAME) OBJ(($LIBRARY/MYSRVPGM *SRVPGM))
```

Binding directories are almost always used as order-only prerequisites (`|`) because they must exist at compile time but should not trigger rebuilds when their content changes.

## COBOL copy sources

COBOL copybooks (`.cpy`, or any COBOL source extension) are resolved differently
by the two compiler families, but the rule you write is the same: **list the
copybook as a prerequisite**. That is what ships it to IBM i for a remote build
and what makes a change to it rebuild the program.

**ILE COBOL** (`.cblle`, `.sqlcblle`) compiles from a stream file and resolves
`COPY` against the compile-time include path:

```makefile
# COPY 'qcpysrc/cpybook.cpy'.   <- IFS style, used as written
# COPY CPYBOOK OF QCPYSRC.      <- source member style, rewritten to the path above
mypgm.pgm: mypgm.cblle qcpysrc/cpybook.cpy
```

**OPM COBOL** (`.cbl`, `.cbl38`, `.sqlcbl`) compiles from a source member, so the
`COPY` statement is left exactly as written and codermake creates the member it
names (`QCPYSRC/CPYBOOK` for the example below) before compiling:

```makefile
# COPY CPYBOOK OF QCPYSRC.
mypgm.pgm: mypgm.cbl qcpysrc/cpybook.cpy
```

A bare `COPY NAME.` is never rewritten: ILE COBOL resolves it against the include
path on its own. Use the `OF`/`IN` form when the copybook lives in a source file
directory.
