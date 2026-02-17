# SQL Skill — Advanced Usage

Advanced features and output format details. See [SKILL.md](./SKILL.md) for quick start and basic usage.

---

## Parameter Binding

Use `?` markers as placeholders for parameters. The tool safely binds values to prevent SQL injection:

```bash
aitool sql --input '{
  sql:"INSERT INTO logs (timestamp, message, level) VALUES (?, ?, ?)",
  params:["2025-01-20T10:30:00Z", "User logged in", "INFO"]
}'
```

**Rules**:
- One `?` per parameter
- Parameters substituted left-to-right
- Number of `?` must match number of params
- Supports strings, numbers, booleans, null
- Dates should use ISO 8601 format

---

## Output Formats

**JSON Format** (default):
```json
{
  "success": true,
  "data": {
    "rows": [
      {"CUSNUM": 123, "LSTNAM": "Doe", "CITY": "Dallas"}
    ],
    "rowCount": 1,
    "fields": [
      {"name": "CUSNUM", "type": "DECIMAL", "length": 6, "scale": 0}
    ]
  },
  "metadata": {
    "executionTime": 145,
    "provider": "ibmi",
    "timestamp": "2025-01-20T10:30:00Z"
  }
}
```

**Table Format**:
```
┌────────┬─────────┬────────────────┐
│ CUSNUM │ LSTNAM  │ CITY           │
├────────┼─────────┼────────────────┤
│    123 │ Doe     │ Dallas         │
└────────┴─────────┴────────────────┘

Rows: 1 | Execution time: 145ms
```
