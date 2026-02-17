---
name: sql
description: Execute SQL statements against database systems
---

## Quick Start

Execute a SQL query in 30 seconds:

```bash
# 1. Ensure ~/.aitool/config.json is configured with a connection
# 2. Execute a query:
aitool sql --input '{sql:"SELECT * FROM QIWS.QCUSTCDT LIMIT 5"}'
```

The tool uses the default connection from your config file and returns results as JSON.

---

## Parameters

All parameters are passed as a single JSON/JSON5 document via `--input`:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `sql` | string | **Yes** | - | SQL query to execute |
| `connection` | string | No | (default) | Named connection from config file |
| `format` | "json" \| "table" | No | "json" | Output format |
| `params` | array | No | [] | Values for `?` parameter markers |
| `quiet` | boolean | No | false | Suppress progress messages |
| `timeout` | number | No | 30000 | Query timeout in milliseconds |

**Input Formats Supported**:
- Strict JSON: `{"sql":"SELECT * FROM table"}`
- JSON5 (relaxed): `{sql:"SELECT * FROM table"}` (unquoted keys, single quotes, trailing commas, comments)
- File: `--input @query.json`
- Stdin: `--input -`

---

## Examples

### Basic Query
```bash
aitool sql --input '{sql:"SELECT * FROM QIWS.QCUSTCDT"}'
```

### Query with Specific Connection
```bash
aitool sql --input '{connection:"prod",sql:"SELECT * FROM customers"}'
```

### Parameterized Query (SQL Injection Prevention)
```bash
aitool sql --input '{
  sql:"SELECT * FROM customers WHERE id = ? AND status = ?",
  params:[123, "active"]
}'
```

### Table Format Output
```bash
aitool sql --input '{
  sql:"SELECT cusnum, lstnam, city FROM QIWS.QCUSTCDT",
  format:"table"
}'
```

---

## More Information

| Topic | Document | Description |
|-------|----------|-------------|
| More Examples | [examples.md](./examples.md) | File input, stdin, timeout, quiet mode, heredocs |
| Providers | [providers.md](./providers.md) | IBM i DB2 and MSSQL connection config, field types |
| Advanced Usage | [advanced-usage.md](./advanced-usage.md) | Parameter binding rules, input modes, output format details |
| Troubleshooting | [troubleshooting.md](./troubleshooting.md) | Error diagnosis by exit code, common solutions |
| Input Schema | [sql-input.schema.json](./sql-input.schema.json) | JSON Schema for tool input |
| Output Schema | [sql-output.schema.json](./sql-output.schema.json) | JSON Schema for tool output |

### CLI Help

```bash
aitool sql --help           # Brief help
aitool sql --help-full      # Comprehensive help
```
