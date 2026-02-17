# SQL Skill — Troubleshooting

Error diagnosis and common solutions. See [SKILL.md](./SKILL.md) for quick start and basic usage.

---

## Connection Error (Exit Code 3)

**Problem**: Cannot connect to database server

**Solutions**:
1. Verify host is reachable: `ping your-host.com`
2. Check port is correct:
   - IBM i: Port 8240 (RAS), not 446 or 8470
   - **SQL Server: Port 1433 (default), or named instance**
   - PostgreSQL: Port 5432 (default)
   - MySQL: Port 3306 (default)
3. Verify firewall allows connections on the port
4. For IBM i: Check RAS service is running

---

## Authentication Error (Exit Code 5)

**Problem**: Invalid credentials or permission denied

**Solutions**:
1. Verify username and password in config file
2. Check user account exists and is not locked
3. Verify user has appropriate database permissions
4. Check password doesn't contain special characters that need escaping

---

## SQL Execution Error (Exit Code 4)

**Problem**: SQL syntax error or object not found

**Solutions**:
1. Verify SQL syntax is correct for your database
2. Check table/view exists and spelling is correct
3. Verify user has SELECT permission on the table
4. For IBM i: Use fully qualified names `LIBRARY.TABLE`
5. Check parameter count matches `?` markers

**Example Error**:
```json
{
  "success": false,
  "error": {
    "code": "SQL_ERROR",
    "message": "Table MYTABLE not found",
    "sqlState": "42S02"
  }
}
```

---

## Parameter Count Mismatch

**Problem**: Number of `?` markers doesn't match params array length

**Solution**:
```bash
# Wrong - 2 markers, 1 param
aitool sql --input '{sql:"SELECT * FROM t WHERE a=? AND b=?",params:[1]}'

# Correct - 2 markers, 2 params
aitool sql --input '{sql:"SELECT * FROM t WHERE a=? AND b=?",params:[1,2]}'
```

---

## Timeout Error (Exit Code 124)

**Problem**: Query execution exceeded timeout

**Solutions**:
1. Increase timeout: `{"sql":"...","timeout":60000}` (60 seconds)
2. Optimize query with indexes
3. Reduce result set size with WHERE clause or LIMIT
4. Check for table locks or long-running transactions

---

## Configuration Errors (Exit Code 2)

**Problem**: Invalid or missing configuration

**Common Issues**:
- Config file not found: Create `~/.aitool/config.json`
- Invalid JSON syntax: Use JSON validator
- Missing `provider` field: Add `"provider":"ibmi"` (or other)
- Invalid `ibmiSystem` reference: Check name matches `ibmiSystems` section
- Both `ibmiSystem` and direct connection specified: Use only one

---

## Exit Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 0 | Success | Query completed successfully |
| 2 | Input/Config Error | Invalid input JSON, missing required fields, configuration errors |
| 3 | Connection Error | Cannot connect to database server, network issues |
| 4 | Execution Error | SQL syntax error, table not found, permission denied |
| 5 | Authentication Error | Invalid credentials, authentication failed |
| 124 | Timeout | Query execution exceeded timeout limit |

Exit codes are designed for programmatic error handling by AI agents.
