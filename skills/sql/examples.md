# SQL Skill — More Examples

Additional usage examples beyond the basics in [SKILL.md](./SKILL.md).

---

### Query from File
```bash
# Create query.json
echo '{sql:"SELECT COUNT(*) as total FROM customers"}' > query.json

# Execute
aitool sql --input @query.json
```

### Query from Stdin
```bash
echo '{sql:"SELECT * FROM products"}' | aitool sql --input -
```

### Query with Timeout
```bash
aitool sql --input '{
  sql:"SELECT * FROM large_table",
  timeout:60000
}'
```

### Quiet Mode (No Progress Messages)
```bash
aitool sql --input '{sql:"SELECT * FROM data",quiet:true}' > output.json
```

### JSON5 with Comments
Great for complex queries:
```bash
aitool sql --input '{
  sql: `
    SELECT
      c.id,
      c.name,
      COUNT(o.id) as order_count
    FROM customers c
    LEFT JOIN orders o ON c.id = o.customer_id
    WHERE c.status = ?
    GROUP BY c.id, c.name
  `,  // Multi-line strings supported
  params: ["active"],
  format: "table"  // Trailing comma OK
}'
```

### Heredoc for Complex Queries
```bash
aitool sql --input - << 'EOF'
{
  sql: "SELECT * FROM orders WHERE date > ? AND status = ?",
  params: ["2024-01-01", "shipped"],
  format: "table"
}
EOF
```
