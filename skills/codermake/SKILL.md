---
name: codermake
description: Build IBM i objects from source code.
---

# codermake

codermake is a Make-based build tool for IBM i projects. It compiles RPG, CL, DDS, and SQL source into IBM i objects (programs, modules, service programs, files, menus, message files, binding directories) either locally on IBM i or remotely via SSH.

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
codermake <target>          # e.g. codermake mypgm.pgm

# Dry run (show what would build, without building)
codermake -n

# Clean all build artifacts
codermake clean

# Show the generated Makefile rules (useful for debugging)
codermake --print-rules
```

Build output for each target is logged to `tmp/logs/<target>.log`.

## Rules.mk syntax

Each source directory contains a `Rules.mk` file that declares build targets and their prerequisites. codermake automatically adds path prefixes (`src/`, `build/`, etc.) based on file extensions -- you write only bare filenames.

### Basic rules

```makefile
# program from RPG source
mypgm.pgm: mypgm.rpgle

# program from RPG source, depends on a display file
mypgm.pgm: mypgm.rpgle myscreen.file

# display file from DDS
myscreen.file: myscreen.dspf

# physical file from DDS
custdata.file: custdata.pf

# ILE CL program
setup.pgm: setup.clle
```

### Order-only prerequisites

Use `|` for objects that must exist before building the target but should not trigger a rebuild when they change. This is typical for binding directories and database files.

```makefile
mypgm.pgm: mypgm.rpgle mysrvpgm.srvpgm | mybnddir.bnddir mytable.file
```

### Cross-directory references

Files with a path separator are treated as relative to the project root (not the Rules.mk directory):

```makefile
# In app/Rules.mk -- reference an exports file in the common/ directory
mysrvpgm.srvpgm: mymod.module common/api.exports
```

### Message files and binding directories (dual-purpose pattern)

The `.msgf` and `.bnddir` extensions serve double duty -- as source when they are the first prerequisite of a matching target type, and as built objects everywhere else:

```makefile
# Build a message file (source file -> object)
appmsg.msgf: appmsg.msgf

# Build a binding directory (source file -> object)
mybnddir.bnddir: mybnddir.bnddir

# Use them as dependencies (treated as built objects)
mymenu.menu: mymenu.file appmsg.msgf
setup.pgm: setup.rpgle | mybnddir.bnddir
```

The `.msgf` source file contains CL commands (`CRTMSGF`, `ADDMSGD`, etc.). The `.bnddir` source file contains CL commands (`CRTBNDDIR`, `ADDBNDDIRE`, etc.).

### Modules and service programs

```makefile
# Compile source to a module
mymod.module: mymod.rpgle

# Link modules into a program
mypgm.pgm: mod1.module mod2.module

# Create a service program from modules + export list
mysrvpgm.srvpgm: mymod.module mymod.exports
```

The `.exports` file is a text file listing exported procedure symbols:

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
| `.clle` | `.pgm` | Program (*PGM) | `CRTBNDCL` |
| `.clle` | `.module` | Module (*MODULE) | `CRTCLMOD` |
| `.clp` / `.cl` | `.pgm` | Program (*PGM) | `CRTCLPGM` |
| `.proc.sql` | `.pgm` | SQL Procedure (*PGM) | `RUNSQLSTM` |
| `.module` (1+) | `.pgm` | Program (*PGM) | `CRTPGM` |
| `.module` + `.exports` | `.srvpgm` | Service Program (*SRVPGM) | `CRTSRVPGM` |
| `.dspf` | `.file` | Display File (*FILE) | `CRTDSPF` |
| `.json` (RDF) | `.file` | Display File (*FILE) | `CRTDSPF` |
| `.pf` | `.file` | Physical File (*FILE) | `CRTPF` |
| `.lf` | `.file` | Logical File (*FILE) | `CRTLF` |
| `.prtf` | `.file` | Printer File (*FILE) | `CRTPRTF` |
| `.table.sql` | `.file` | SQL Table (*FILE) | `RUNSQLSTM` |
| `.index.sql` | `.file` | SQL Index (*FILE) | `RUNSQLSTM` |
| `.file` + `.msgf` | `.menu` | Menu (*MENU) | `CRTMNU` |
| `.msgf` (CL src) | `.msgf` | Message File (*MSGF) | `CRTMSGF` / `ADDMSGD` |
| `.bnddir` (CL src) | `.bnddir` | Binding Dir (*BNDDIR) | `CRTBNDDIR` / `ADDBNDDIRE` |

For full details on every type, see [references/file-types.md](references/file-types.md).

## Adding a new target

Follow this procedure when adding a new object to the build:

1. **Create the source file** in the appropriate source directory (e.g., `src/newpgm.rpgle`).
2. **Add a rule to `Rules.mk`** in that directory:
   ```makefile
   newpgm.pgm: newpgm.rpgle
   ```
3. **Declare dependencies** on any objects that must exist first:
   ```makefile
   newpgm.pgm: newpgm.rpgle myscreen.file mysrvpgm.srvpgm | mybnddir.bnddir
   ```
4. **Build and verify:**
   ```bash
   codermake newpgm.pgm
   ```
5. **Check logs on failure:** `tmp/logs/newpgm.pgm.log`

If the target is a module destined for a service program or multi-module program, also add the downstream rule:

```makefile
newmod.module: newmod.rpgle
existing.srvpgm: existing_mod.module newmod.module existing.exports
```

## Troubleshooting

Build logs are in `tmp/logs/<target>.log`. When a build fails:

1. Open the log file for the failing target.
2. Search for error message IDs (e.g., `RNF`, `SQL`, `CPF`, `CPD`).
3. For RPG/SQL RPG, look at the message summary near the end of the listing -- severity 30+ messages are errors.
4. For DDS/CL, look for `CPF` or `CPD` message IDs in the output.
5. Use `codermake --print-rules` to verify the generated Makefile if the target is not being built at all.

For detailed guidance on reading compile listings, see [references/compile-listings.md](references/compile-listings.md).

## Environment variables

codermake reads its configuration from environment variables (typically set in a `.env` file at the project root).

### Remote builds (from Linux/macOS to IBM i via SSH)

| Variable | Description |
|---|---|
| `IBMI_BUILD_LIBRARY` | Target IBM i library for compiled objects |
| `IBMI_HOST` | IBM i hostname or IP address |
| `IBMI_USER` | SSH username on the IBM i |
| `IBMI_KEY` | Path to SSH private key (optional) |

### Local builds (on IBM i PASE)

| Variable | Description |
|---|---|
| `BUILD_LIBRARY` | Target IBM i library for compiled objects |
