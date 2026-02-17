# SQL Skill — Providers

Database provider configuration details. See [SKILL.md](./SKILL.md) for quick start and basic usage.

---

## IBM i DB2

**Status**: Implemented (v0.1.0)

**Connection Configuration**:
```javascript
// In ~/.aitool/config.json
{
  sql: {
    connections: {
      "my-ibmi": {
        provider: "ibmi",
        host: "ibmi.example.com",
        port: 8240,                    // RAS port (not DB2 native ports)
        user: "username",
        password: "password"
      }
    },
    defaultConnection: "my-ibmi"
  }
}
```

**Or using shared IBM i system**:
```javascript
{
  ibmiSystems: {
    production: {
      db: {
        host: "ibmi.example.com",
        port: 8240,
        user: "username",
        password: "password"
      }
    }
  },
  sql: {
    connections: {
      "prod": {
        provider: "ibmi",
        ibmiSystem: "production"       // References production.db above
      }
    },
    defaultConnection: "prod"
  }
}
```

**RAS Connection Options**:

IBM i connections support additional RAS options for fine-grained control:

```javascript
{
  sql: {
    connections: {
      "my-ibmi": {
        provider: "ibmi",
        host: "ibmi.example.com",
        port: 8240,
        user: "username",
        password: "password",
        naming: "sys",         // Naming convention: "sql" or "sys" (default: "sys")
        auto_commit: true,     // Enable auto-commit mode (default: true)
        commit: "cs",          // Commit isolation level
        date_format: "iso"     // Date format for results
      }
    }
  }
}
```

Available RAS options include naming conventions, commit control, date/time formats, SSL/TLS settings, and performance tuning. Refer to the aitool configuration schema documentation for the complete list of options and their descriptions.

**IBM i-Specific Details**:
- Uses `@profoundlogic/ras-js` client
- **Port 8240** is the RAS (Remote Access Service) default, NOT traditional DB2 ports (446, 8470)
- Requires RAS service running on IBM i
- Supports commitment control
- Future: Library list management, job settings

**Field Types**:
- CHAR, VARCHAR → string
- DECIMAL, NUMERIC, INTEGER, SMALLINT, BIGINT → number
- DATE, TIME, TIMESTAMP → string (ISO 8601)

---

## Microsoft SQL Server

**Connection Configuration**:
```javascript
// In ~/.aitool/config.json
{
  sql: {
    connections: {
      "my-mssql": {
        provider: "mssql",
        host: "sqlserver.example.com",
        port: 1433,                    // Default SQL Server port
        user: "username",
        password: "password",
        database: "mydb",
        encrypt: true,                 // Encrypt connection
        trustServerCertificate: false  // Trust self-signed certs
      }
    },
    defaultConnection: "my-mssql"
  }
}
```

**MSSQL-Specific Details**:
- Uses `mssql` npm package (tedious driver)
- **Port 1433** is the default SQL Server port
- Supports SQL Server 2012+, Azure SQL Database, Azure SQL Managed Instance
- Connection encryption enabled by default
- Supports Windows domain authentication and Azure AD

**Connection Options**:
MSSQL connections support additional options. Check the config schema for the complete list.

**Field Types**:
- `CHAR`, `VARCHAR`, `NCHAR`, `NVARCHAR` → string
- `INT`, `BIGINT`, `SMALLINT`, `TINYINT` → number
- `DECIMAL`, `NUMERIC`, `MONEY` → number
- `FLOAT`, `REAL` → number
- `DATE`, `DATETIME`, `DATETIME2` → string (ISO 8601)
- `TIME` → string (ISO 8601)
- `BIT` → boolean
- `UNIQUEIDENTIFIER` → string

---

## PostgreSQL

**Status**: Planned (not yet implemented)

Configuration will follow similar pattern with `provider: "postgres"`.

---

## MySQL

**Status**: Planned (not yet implemented)

Configuration will follow similar pattern with `provider: "mysql"`.
