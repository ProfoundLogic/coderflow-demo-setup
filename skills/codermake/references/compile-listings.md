# Compile Listings Reference

Guide to finding and interpreting IBM i compile listings produced by codermake builds.

## Where to find logs

Every build target produces a log file at:

```
tmp/logs/<target>.log
```

For example, building `mypgm.pgm` writes to `tmp/logs/mypgm.pgm.log`.

## RPG listings (.rpgle)

RPG compile listings from `CRTBNDRPG` or `CRTRPGMOD` follow a standard structure:

1. **Header** -- compiler version, source file path, compile options
2. **Source listing** -- numbered source lines (may include copy members)
3. **Additional diagnostics** -- cross-reference tables, data structure layouts
4. **Message summary** -- all diagnostic messages grouped by severity

### Reading the message summary

The message summary appears near the end of the listing. Each entry shows:

```
MSG ID    SEV  LINE  TEXT
RNF7031   00   12    The name or indicator is not referenced.
RNF7066   00   45    A semicolon is expected ...
RNF5377   30   78    The type of expression does not match ...
```

**Severity levels:**

| Severity | Meaning | Action |
|---|---|---|
| 00 | Informational | Safe to ignore |
| 10 | Warning | Review but usually benign |
| 20 | Error (recoverable) | Compiler attempted to continue; fix recommended |
| 30 | Severe error | Compilation failed; must fix |
| 40+ | Unrecoverable | Compilation failed; must fix |

Search for severity 30+ messages to find the root cause of a build failure. The `LINE` column tells you which source line triggered the error.

### Common RPG message IDs

| ID prefix | Area |
|---|---|
| `RNF` | RPG compiler messages |
| `RNS` | RPG compiler (structured) |
| `SQL` | Embedded SQL messages (in SQLRPGLE) |

## SQL RPG listings (.sqlrpgle)

SQL RPG compilation is a two-phase process:

1. **SQL precompile** (`CRTSQLRPGI`) -- translates embedded SQL into RPG call statements
2. **RPG compile** -- compiles the resulting RPG source

The log contains output from both phases. When debugging:

- **SQL errors** appear in the first phase. Look for `SQL` message IDs.
- **RPG errors** appear in the second phase. Look for `RNF`/`RNS` message IDs.
- If the SQL precompile fails, the RPG compile does not run.

### SQL precompile messages

```
SQL0104   30   Position 45  Token "SELEC" was not valid. Valid tokens: ...
SQL0204   20   Table "MYLIB/NOTABLE" not found.
```

The position or line number tells you where in the embedded SQL the error occurred.

## CL listings (.clle, .clp, .cl)

CL compile errors appear as `CPD` or `CPF` messages:

```
CPD0727   30   The character value specified is not a valid name.
CPF0001   40   Error found on CALL command.
```

For ILE CL (`CRTBNDCL`, `CRTCLMOD`), the listing structure is similar to RPG -- source listing followed by a message summary.

For OPM CL (`CRTCLPGM`), the output is typically shorter and errors reference source sequence numbers.

## DDS listings (.dspf, .pf, .lf, .prtf)

DDS compilation errors from `CRTDSPF`, `CRTPF`, `CRTLF`, or `CRTPRTF` produce `CPD` messages:

```
CPD7302   30   Record format SCREEN1 not found in file referenced.
CPD7344   30   Keyword REF not valid for this type of file.
```

DDS errors typically reference a specific record format and line within the source.

## SQL DDL listings (.table.sql, .index.sql, .proc.sql)

SQL DDL statements executed via `RUNSQLSTM` produce SQL messages:

```
SQL0104   30   Token "CREAT" was not valid.
SQL0601   20   Table EMPLOYEE in MYLIB already exists.
SQL7905   10   Module *N in *N not found.
```

- Severity 30+ means the statement failed.
- Severity 20 warnings (like "already exists") may or may not be a problem depending on context.

## Message files and binding directories (.msgf, .bnddir)

These execute CL commands from a source file. Errors appear as `CPF` or `CPD` messages from the individual CL commands:

```
CPF2112   40   Object APPMSG type *MSGF already exists in library MYLIB.
CPF2105   30   Object MYSRVPGM in MYLIB type *SRVPGM not found.
```

## Practical example

A build of `mypgm.pgm` fails. Here is how to diagnose it:

```bash
# 1. Check the log
cat tmp/logs/mypgm.pgm.log

# 2. Search for high-severity messages
grep -E 'RNF.{4}\s+[34]0|SQL.{4}\s+[34]0|CPD.{4}\s+[34]0|CPF.{4}\s+[34]0' tmp/logs/mypgm.pgm.log
```

Example output:

```
RNF5377   30   42    The type of expression does not match the type expected.
```

This tells you line 42 of the RPG source has a type mismatch. Open the source file, go to line 42, and fix the expression type.
