# Migrate Feature: ${feature\_name}

## Objective

Build **${feature\_name}** end-to-end — Express API route backed by Db2 on IBM i, Angular 21 frontend page, based on original .NET SQL Server functionality.

## Research

Start by exploring the codebase to understand what you're building:

1.  **Original .NET app** — Find the relevant controller, model, and views in `original-app/MyPortalClient/MyPortalClient/` for this feature. Understand the queries, filters, columns, and business logic.
2.  **Database docs** — Read `docs/project/database-db2.md` and `docs/project/database-mssql.md` to find the relevant tables and schemas.
3.  **Original UI** — Check `docs/project/website.md` and the screenshots in `docs/project/images/media/` to understand the layout and interactions.
4.  **Existing patterns** — Look at already-implemented features (routes beyond `health.js`, pages not using `PlaceholderPage`) and follow their patterns exactly.
5.  **Shared utilities** — Check `client/src/app/shared/` for reusable types and utilities. If the new feature shares data structures or logic with an existing feature, extract shared code into a shared module rather than duplicating it.

## Backend

Build an Express route in `server/routes/` that queries the Db2 table via `getPool()` from `config/db.js`. Register it in `server/index.js`. Follow existing conventions in the server code.

### Db2 Driver Row Limit

**Critical**: The `@profoundlogic/ras-js` driver defaults to returning only **500 rows** per `pool.query()` call. Do NOT rely on fetching all rows and filtering in JavaScript. Instead:

-   Push all filters (date ranges, status, etc.) into the SQL `WHERE` clause so Db2 returns only matching rows.
-   Use SQL `ORDER BY` for sorting, mapping JS field names to Db2 column expressions.
-   Use SQL `OFFSET n ROWS FETCH FIRST n ROWS ONLY` for pagination.
-   Only pass `{ rows: N }` as a third argument to `pool.query()` for "show all records" mode where no SQL pagination clause is used. Keep this safety limit modest (e.g., 5000).

### SQL Paging Pattern

For paginated list endpoints, use **parallel SQL queries** that each return only what's needed:

1.  **Page data** — `SELECT columns WHERE (all filters) ORDER BY ... OFFSET ? FETCH FIRST ? ROWS ONLY`
2.  **Total count** — `SELECT COUNT(*) WHERE (all filters)` for pagination metadata
3.  **Dropdown options** — `SELECT DISTINCT column WHERE (all filters except that column's filter)` for each dynamic dropdown
4.  **Column visibility** — `SELECT MAX(CASE WHEN col <> '' THEN 1 ELSE 0 END) ... WHERE (all filters)` to determine which columns have data

Run all queries in parallel via `Promise.all()`. Use an `includeOptions` query parameter so the frontend can skip queries 3-4 on page/sort changes (when dropdown options and column visibility haven't changed), reducing from ~5 queries to ~2.

### Date Column Handling

Db2 date columns in the GNP tables are stored as `MM/DD/YYYY` char(10) strings (not SQL DATE types). To filter or sort by date in SQL, convert to `YYYY-MM-DD` for lexicographic comparison:

SUBSTR(TRIM(D1CDATE),7,4)||'-'||SUBSTR(TRIM(D1CDATE),1,2)||'-'||SUBSTR(TRIM(D1CDATE),4,2)

Also guard against empty/malformed values with `LENGTH(TRIM(column)) = 10`.

### Local-Date-Safe Defaults

When computing default date ranges on the server (e.g., "last 30 days"), use `getFullYear()`/`getMonth()`/`getDate()` instead of `toISOString().slice(0,10)`. The latter uses UTC and causes off-by-one-day errors in US time zones.

## Data Validation

Use the `/sql` skill to validate correctness:

1.  Query SQL Server for sample data matching this feature
2.  Query Db2 for the same data
3.  Compare row counts, column mappings, and values
4.  Investigate and document any discrepancies

This validation ensures the new Db2-backed route returns the same data the original SQL Server-backed app delivered.

## Frontend

Replace the placeholder component in `client/src/app/pages/` with a working Angular 21 page. Use signals for reactive state, Angular Material for UI components, and Tailwind CSS for layout. Match the original app's functionality.

### Outdated Notes to Exclude

Do **not** carry over the "Important Note: Website only reflects data from 1/1/2011 through the end of the previous business day" message from the original .NET views. The data is now real-time, so this note is no longer accurate and should not appear in the Angular frontend.

### Frontend Caching for Pagination

When the backend supports `includeOptions`, the frontend should:

-   Pass `includeOptions=true` on filter changes (initial load, dropdown selections, date changes, etc.) to get fresh dropdown options and column visibility.
-   Pass `includeOptions=false` on page, sort, and records-per-page changes — reuse cached dropdown options and column visibility from the last filter change.
-   In the response handler, only update options/columnHasData signals when the response includes them (non-null).

### Totals and Excel Export

The original .NET app calculates totals for the **current page only** (not the full filtered dataset). Excel export also exports only the current page. Match this behavior unless explicitly asked otherwise.

## Testing Locally

The server runs locally in the dev container. **Do not deploy to test** — test everything locally first:

\# Start the backend (port 3000, auth disabled for dev) cd /workspace/myscoular/server DISABLE\_AUTH=1 node index.js &

# Start the frontend (port 4200, proxies /api to localhost:3000)

cd /workspace/myscoular/client API\_TARGET=[http://localhost:3000](http://localhost:3000) npx ng serve --host 0.0.0.0 --port 4200 --proxy-config proxy.conf.json

Test API routes directly with curl before testing in the browser:

curl -s "[http://localhost:3000/api/](http://localhost:3000/api/)?param=value" | node -e "const d=JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')); console.log(JSON.stringify(d, null, 2))"

Restart the server after every backend change (`kill` the old process, re-run `node index.js`).

## Verify

Both must pass with zero errors:

cd /workspace/myscoular/client && npx tsc --noEmit cd /workspace/myscoular/client && npx ng build