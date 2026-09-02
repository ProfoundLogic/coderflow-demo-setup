# Runtime traps

These all compile clean, deploy clean, and then fail silently in front of a
user. Most were found the hard way.

## 1. An undeclared identifier takes down the whole screen

If a template references `<%= foo %>` and `foo` is not in the format's `fields`,
EJS throws and **the entire screen renders blank**. Not the field — the screen.
Nothing appears in any joblog.

`preflight.js` fails the build on this. Never skip it after hand-editing a
template, and be especially careful when cloning a template between formats.

## 2. Screen JS may run before the template is in the DOM

Profound UI can evaluate the files in the `js` array before the rendered
template is injected. `addEventListener` at load time then binds to nothing and
fails silently — no error, the button simply does nothing.

Use **inline handler attributes calling window globals**:

```html
<button onclick="tgSort(this, 'custno', 'number')">
```
```js
window.tgSort = function (button, key, type) { ... };
```

Generated screen JS already does this. Anything you add should too.

Corollary: the screen must render correctly with **no** JS. Never hide the
container and reveal it from script.

## 3. Screen JS re-executes on every render

Including subfile reloads and revisits. Nothing at the top level may accumulate
state: no `document`/`window` listeners, no wrapping of `pui.submit`. Attach to
elements inside the screen container, which is wiped on re-render.

## 4. Your own CSS reset can out-specify your components

Genie's stock skin ships `div { white-space: nowrap; z-index: 10; padding: 1px }`,
so a reset is genuinely needed. But:

```css
.tg-screen div { padding: 0 }   /* (0,1,1) */
.tg-card-head  { padding: 12px } /* (0,1,0) — loses */
```

The blanket reset silently flattens every card, toolbar and top bar. The theme
scopes it to `div:not([class])`, and `preflight.js` fails the build if any
single-class rule declaring non-zero padding computes to `0px`.

## 5. Field names are lowercase

Profound UI hands DDS field names to the template in lower case. `<%= CUSTNO %>`
renders blank where `<%= custno %>` works. Both are provided, but the generator
and every example use lower case — stay consistent.

## 6. Cache-busting is baked in at build time

The `?v=N` suffix lives in the Rich Display JSON, so it is compiled into the
display file. **Editing an asset without rebuilding the display file can serve
stale content.** After changing a template, CSS or JS:

```bash
# bump the version in the JSON, then
codermake <display>.file
codermake <display>.pgm     # avoids any level-check surprise
```

## 7. EJS formats have no response indicators

DDS `CA03(03 'Exit')` gives the RPG `*in03`. An EJS format does not carry
response indicators — buttons post an `action` value instead. The generated
`MIGRATION.md` tables every key with its old indicator and new test.

## 8. Recompiling a program does not affect a running invocation

Exit the screen and re-enter before retesting a fix, or a correct fix looks
broken.

## 9. Deploy is not part of the build

`codermake` builds IBM i objects. It does **not** copy `htdocs/` anywhere. Copy
the asset directory to the Profound UI document root yourself and verify with
`curl` that each file returns 200 — an asset that 404s produces a blank or
unstyled screen with no other symptom.

## 10. Emoji are not dependable

A `&#128269;` magnifier rendered as a missing-glyph box in testing. Use inline
SVG for icons; it also takes the brand colour and scales cleanly. The generated
search button already uses SVG.

## 11. Verify the screen with real data, not just sample data

`preflight.js` fills every field to its declared width, which catches
overflow. It cannot catch a value that is *wrong*. Drive the real screen — a
Genie session returns the RDF stream with the real field values and confirms
the display file carries the right template URLs:

```bash
./genie_get.sh S | jq -r '.layers[0].formats[] | select(.active) | .metaData.screen'
# -> { "ejs": true, "ejs template": ".../custctl.ejs?v=1", ... }
```

That proves the wiring. For appearance you still need the rendered HTML, which
is what `preflight.js` screenshots give you.
