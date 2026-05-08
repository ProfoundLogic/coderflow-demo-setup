# Bad-data hardening

In green-screen mode, an unhandled `%date()` failure produces a system halt with a "Display Program Messages" prompt — annoying but recoverable. In Profound UI's EJS mode the same failure surfaces as a browser-side error popup that looks like the application is broken. This bites prospect demos hard.

The skill must scan for and guard every BIF that converts external data.

## BIFs to scan for

| BIF | Risk | Default substitution on failure |
|---|---|---|
| `%date(numeric : *iso)` | YYYYMMDD = 0 or invalid digits → halt | `''` (for char target) or `*loval` (for date target) |
| `%date(char : *iso)` | Empty string or non-ISO → halt | as above |
| `%time(...)` | Invalid time digits → halt | `''` |
| `%timestamp(...)` | Invalid → halt | `''` |
| `%dec(char : digits : decimals)` | Non-numeric input → halt | `0` |
| `%int(char)` | Non-numeric input → halt | `0` |
| `%float(char)` | Non-numeric input → halt | `0` |
| `%char(%date(...) : *usa)` | Inner `%date` is the risk | wrap the inner |

## Wrap pattern

```rpgle
monitor;
  slastord = %char(%date(customer.clastord) : *usa);
on-error;
  slastord = '';
endmon;
```

For numeric targets:

```rpgle
monitor;
  totalQty = %int(qtyChar);
on-error;
  totalQty = 0;
endmon;
```

For multiple BIFs that share an error category, group them in one monitor:

```rpgle
monitor;
  slastord = %char(%date(customer.clastord) : *usa);
  screated = %char(%date(customer.ccreated) : *usa);
on-error;
  // both fields stay at their last known good value or default
endmon;
```

But: if you want different fallback values per field, use separate `monitor` blocks so one bad value doesn't suppress the next conversion.

## When to NOT guard

- Conversions of values your code has just produced and validated. Adding a monitor block here is noise.
- Internal type coercions (e.g. `%char()` of an int field).
- Conversions where a halt is the desired behavior — but be deliberate. In EJS mode, halting always looks broken.

## Scanning algorithm

Per RPG file, before converting:

1. Grep for `%date\(`, `%time\(`, `%timestamp\(`, `%dec\(`, `%int\(`, `%float\(`.
2. For each hit, decide: is the input internal (safe) or external (risky)?
   - From a `chain`, `read`, embedded SQL `into` → external, guard.
   - From a parameter passed by another program → external, guard.
   - From a literal or computed-from-validated → internal, leave.
3. If the hit isn't already inside a `monitor` block, wrap it.

If unsure, guard. The cost of an extra monitor block is two indented lines; the cost of a halt is a broken demo.

## Real-world example

The `wrkcust1r.rpgle` / `wrkcust1eo.rpgle` programs converted from a 5250 customer-detail program would crash on customer 999999 because that record has `CLASTORD = 0` (no orders yet). The original 5250 program would halt with `Date, Time or Timestamp value is not valid (C G D F)` and the user could press Enter to dismiss. The EJS version showed an error popup. Wrapping both `%date()` calls in `MONITOR`/`ON-ERROR` made `slastord` show as blank for that customer — graceful degradation.

This bug was preventable at conversion time. The skill must not ship without these guards.

## Combining with style guide

The wrapped block conforms to `rpg-coderflow` indentation conventions: 2 spaces inside the monitor, label the on-error if there are multiple branches:

```rpgle
monitor;
  ...
on-error 1211;  // file already open — specific case
  ...
on-error;       // catch-all
  ...
endmon;
```

Most BIF guards just need the catch-all `on-error`.
