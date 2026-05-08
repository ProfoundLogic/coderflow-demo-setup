# Cache busting

Profound UI's runtime renders EJS templates with `<link rel="stylesheet">` and `<script>` tags pointing at the asset URLs declared in the JSON manifest. Browsers cache CSS and JS aggressively. Without a cache-busting query string, your CSS or JS edit is invisible to users until they hard-refresh — and prospect demos rarely do.

## The rule

**Every CSS or JS path in the JSON manifest carries a `?v=N` query string.** Bump `N` on every asset change. Then rebuild the display file with `codermake <base>eo.file`.

```json
{
  "type": "ejs",
  "formats": {
    "custdetail": {
      "template": "/profoundui/userdata/ui/wrkcuste/detail.ejs",
      "css": ["/profoundui/userdata/ui/wrkcuste/detail.css?v=3"],
      "js":  ["/profoundui/userdata/ui/wrkcuste/detail.js?v=3"]
    }
  }
}
```

## Workflow

After **any** edit to a `.ejs`, `.css`, or `.js` file in the asset bundle:

1. Bump `?v=` on the `css` and `js` arrays in the JSON manifest. Both, every time. Doesn't matter which file you edited — bump both.
2. Rebuild the file: `codermake <base>eo.file` (this re-bakes the JSON manifest into the IBM i `*FILE` object).
3. The next page render fetches the assets at the new URLs, bypassing the browser cache.

EJS templates themselves don't need a version suffix — Profound UI fetches them server-side, not browser-side.

## Initial value

Start at `?v=1` for a fresh skill output. The user will bump as they iterate.

## Why both `css` and `js` together

Sometimes a CSS edit needs a matching JS change (e.g., a new class name the JS targets). If only one is bumped, the page mixes new and old assets and breaks subtly. Always bump both — it's free.

## Why not content-hash filenames

Content-hash filenames (`detail.abc123.css`) are the gold standard for cache busting in modern web frameworks, but Profound UI's directory layout doesn't support that without tooling. The query-string approach works, is supported by every HTTP server, and the browser treats `detail.css?v=2` as a different URL from `detail.css?v=1`.

## Common failure modes

| Symptom | Cause |
|---|---|
| User says "I don't see my CSS change" | Forgot to bump `?v=` |
| User says "I don't see my CSS change after hard refresh" | Forgot to `codermake <base>eo.file` after editing the JSON |
| Mixed-version assets (some new, some old) | Bumped only one of `css` / `js` |
| Edit looks right in Playwright but not in browser | Same — Playwright doesn't share the user's cache, so it sees fresh assets |

## When debugging "my change isn't visible"

Check, in order:

1. Did I bump `?v=` in the JSON?
2. Did I `codermake <base>eo.file` after?
3. Did I edit the right file? (Search for the class name in the actual `htdocs/` path declared in the JSON.)
4. Is the user's browser actually fetching the new URL? (Browser devtools → Network tab → look for `detail.css?v=N` request.)

If all four are yes and the change still isn't visible, the problem isn't caching — look at CSS specificity or layout instead.
