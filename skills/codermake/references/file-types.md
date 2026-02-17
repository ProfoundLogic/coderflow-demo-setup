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

### SQL procedure from .proc.sql

Runs a SQL DDL script that creates a stored procedure. The resulting object appears as a program.

```makefile
getcount.pgm: getcount.proc.sql
```

**CL command:** `RUNSQLSTM SRCSTMF('src/getcount.proc.sql') COMMIT(*NONE) DFTRDBCOL(LIB)`

### Program from modules

Links one or more compiled modules into a program. All prerequisites must be `.module` targets.

```makefile
mypgm.pgm: mod1.module mod2.module
```

**CL command:** `CRTPGM PGM(LIB/MYPGM) MODULE(LIB/MOD1 LIB/MOD2)`

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

### ILE CL module from .clle

```makefile
mymod.module: mymod.clle
```

**CL command:** `CRTCLMOD MODULE(LIB/MYMOD) SRCSTMF('src/mymod.clle')`

## Service programs (.srvpgm)

A service program is created from one or more modules plus an export list (`.exports` file). The export list defines which procedures are visible to callers.

```makefile
mymod.module: mymod.rpgle
mysrvpgm.srvpgm: mymod.module mysrvpgm.exports
```

**CL command:** `CRTSRVPGM SRVPGM(LIB/MYSRVPGM) MODULE(LIB/MYMOD) EXPORT(*SRCFILE) SRCSTMF('src/mysrvpgm.exports')`

### .exports file format

The exports file is a plain text file with the following structure:

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
