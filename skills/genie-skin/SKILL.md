---
name: Genie Skin Editor
description: Edit and create Profound Logic Genie skins (start.html, custom.js,
  <Skin>.css) — customize 5250 screen look and feel, sign-on screens, colors,
  headers/logos, responsive behavior, and build reusable modular JS. Use when
  the user uploads a Genie skin folder or asks to restyle/fix/modernize one.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
createdAt: 2026-07-21T15:33:51.456Z
createdBy: gjones
createdByName: Gary Jones
createdById: user_1767620328397_iectw4bix
updatedAt: 2026-07-21T15:33:56.295Z
updatedBy: gjones
updatedByName: Gary Jones
updatedById: user_1767620328397_iectw4bix
---

This skill is for editing and creating **Profound Logic Genie skins** — the HTML/CSS/JavaScript bundles that control how every 5250 (green-screen) display file looks and behaves when rendered through Genie (Profound UI's browser-based 5250 emulator).

Use this skill whenever the user uploads or points to a Genie skin folder and asks to change its look, fix a rendering issue, add a widget, restyle a screen, or "make it pop." It applies equally to a brand-new skin and to one copied from an existing skin.

## The three files (plus one you don't touch)

Every skin lives in its own folder, e.g. `genie skins/<SkinName>/`, and is built from:

1. **`start.html`** — static template. Defines the page shell (header/footer/logo/layout) that wraps the 5250 content, and pulls in the CSS/JS via `<link>`/`<script>` tags.
2. **`custom.js`** — the skin's JavaScript. Implements lifecycle hook functions (`beforeLoad`, `customize`, `afterLoad`, etc. — see `references/event-lifecycle.md`) that run on every screen, plus any skin-specific helper code (sign-on screen rebuild, side menus, resize handling...).
3. **`<SkinName>.css`** — the skin's stylesheet. Maps every 5250 color/attribute byte to a CSS class (see `references/attribute-colors.md`), and styles everything else (layout, logo, buttons, animations, fonts).

A 4th file, **`config.js`**, is also present in every skin folder (JSON: `enableDesigner`, `adjustColumns`, `connectionType`, `detectSubfile`, `stripedSubfile`, `hideFKeyNames`, etc.). This is Genie Administrator-managed configuration, not something skins hand-edit as part of look-and-feel work — leave it alone unless the user specifically asks about subfile detection, the Designer, or connection settings.

Read `references/architecture.md` before making structural changes (IFS paths, the required `<div id="5250">`, script/link ordering, how skins get copied/launched).

## Workflow for any skin-editing task

1. **Identify the skin folder.** If given a zip/multiple skins, ls the top-level folder — real customer skins sit in the root; a folder named `Archive` holds retired/experimental skins (some are broken, some have dead unwired files — treat `Archive` as reference material, not a pattern to copy uncritically).
2. **Read all three files first**, plus `config.js` for context, before changing anything. Skins are copy-pasted lineages (Hybrid → Hybrid Gray → PLDemo → ecwa_skin → hcl_skin, etc. are all the same base code with drift) — check whether the skin already has helper functions (a namespaced object like `hybridSkin` or `Tab`) you should extend rather than duplicate.
3. **Never edit a shipped/default skin in place.** If the user is customizing a stock skin (Hybrid, Gradient, Classic, Tablet, Skyline, Plain...), confirm it's already a copy, or make the copy yourself (new folder + updated skin name references in `start.html`'s `<link>`/`<script>` `src` paths) before changing anything. Product updates overwrite the stock skins.
4. **Make the change in the right file:**
   - Static layout, header/footer markup, logo `<img>` anchored to the page, extra `<script>`/`<link>` tags → `start.html`.
   - Anything conditional on screen content, dynamic DOM manipulation, JS-driven logo/overlay, button/menu generation, resize/responsive logic, timers, break-message handling → `custom.js`, inside the correct lifecycle hook (see below).
   - Color, spacing, fonts, animations, responsive breakpoints, hover states → `<SkinName>.css`.
5. **Pick the right lifecycle hook** in `custom.js` (full detail + examples in `references/event-lifecycle.md`):
   - `beforeLoad()` — before the screen renders; adjust `pui.multX`/`pui.multY`, toggle body classes for display size.
   - `customize()` — runs after every screen renders, before Designer enhancements. This is where 99% of skin logic lives: `detectScreen(...)` to special-case a screen (classically the sign-on screen), hide/reposition/relabel fields, build side menus from function keys, set `pui["loading animation"]`, etc.
   - `pui.genie.afterInit` — after Genie's own automatic customizations (fkey buttons etc.), before Designer enhancements. Good for injecting one-time DOM structure (headers, logos) that must exist before Designer runs. Guard with `if (pui.genie.afterInit == null) { pui.genie.afterInit = function() {...}; }` since it's a single global, not additive.
   - `afterLoad()` — after everything (including Designer) has rendered. Good for final visual polish, reading `pui.genie.isCustomized`.
   - `pui.genie.onalarm` — fires when the 5250 ALARM keyword was sent on the screen; play a sound or flash something.
   - `pui.onload = function() {...}` at the bottom of `custom.js` (distinct from the per-format `pui.onload(config)` documented for Rich Display Files, which does **not** fire for Genie) is used by real skins as a one-time-per-page-load hook via `setTimeout(fn, 0)` — see the Hybrid skin pattern.
6. **Use the existing helper API** rather than raw DOM code where one exists — `references/helper-functions.md` catalogs every helper (`detectScreen`, `hideElement(s)`, `changeElementValue/Class`, `moveElement`, `newElement`, `getObj`, `get`, `getRight`, `pressKey`, `applyProperty`, `getOutputFields`, `pui.set`, ...) with real signatures pulled from working skins.
7. **Build/verify:** these are static web assets (no compiler). "Testing" means: confirm the JS is syntactically valid, confirm `start.html`'s `<script>`/`<link>` ordering rule is intact (`profoundui.css` before `Skin.css`; `genie.js` before `custom.js`), and reason through the `detectScreen(...)` conditions against the actual field IDs/labels on the screen(s) in question. If the user can give you a live Genie session or screen capture, use it to sanity-check field IDs (`D_row_col` for display fields, `I_row_col` for input fields) — these are position-dependent and will NOT match between screens of different sizes/layouts, which is why 132-wide vs 80-wide sign-on customizations in real skins duplicate the whole block with shifted IDs (see `Gradient/adjusted columns custom.js` vs `Gradient/custom.js`).

## Making a skin "pop" — modernization checklist

When asked generically to modernize/improve a skin visually, work through `<SkinName>.css` and `custom.js` together:

- Replace flat colors with subtle gradients/shadows on header bars, buttons, and panels (CSS `linear-gradient`, `box-shadow`).
- Add `transition` on interactive elements (buttons, `.fkey-link`/`.hybrid-button` menu items, links) for hover/focus states — most stock skins have zero transitions.
- Round corners (`border-radius`) on panels, buttons, and the loading-animation spinner container.
- Confirm the loading-animation CSS class referenced by `pui["loading animation"]["css"]` in `customize()` actually has a matching `@keyframes` block in the CSS (copy the `pui-*-animation` pattern from `references/patterns.md`).
- Modernize typography: real skins are full of `font-family: sans-serif` fallback stacks with no system-font stack (`-apple-system, "Segoe UI", Roboto...`) and hardcoded small pixel sizes — improving this is usually the single highest-impact "pop" change.
- Check responsiveness: does the skin hardcode `pui.genie.middleDiv.style.width`/positions based on a fixed `screen.width`/`windowWidth` calculation (very common — see `hybridSkin.resizeArea`)? Prefer CSS flexbox/`max-width`/`clamp()` for new work, but when extending an existing skin, match its existing centering approach rather than introducing a second, conflicting one.
- Don't touch the 5250 attribute-class color mappings (`A20`–`A3E` etc.) unless asked — the ones in place are usually load-bearing against real application meaning (e.g. yellow = inactive, red = overdue). See `references/attribute-colors.md` before ever remapping a color.

## Building reusable/modular custom JavaScript

The user wants extra JS to be organized as separate, reusable files rather than all crammed into one skin's `custom.js` — `custom.js` itself is loaded at runtime by `start.html`, but nothing stops you from adding more `<script>` tags. Full guidance, a namespacing template, and a worked example are in `references/modular-js.md`. Key points:

- A script must be referenced by a `<script src="...">` tag in `start.html` to run at all — several real skins in the wild (e.g. `ecwa_skin`) contain an orphaned second JS file (`ecwa_custom.js`) that was never wired into `start.html` and therefore never executes. Always check the actual `<script>` tags, don't assume a file is loaded just because it sits in the folder.
- Load order matters: `genie.js` → any shared/reusable module(s) → skin's own `custom.js`, so `custom.js` can call into the shared module and override/configure it per-skin.
- Give each reusable module a distinct namespace object (pattern already used organically in the wild: `hybridSkin`, `Tab`) and hang all its functions/state off that object — never leak bare globals.
- Don't hardcode the skin's own name into a shared module's asset paths (real skins do this for logos/images, e.g. `"/profoundui/userdata/genie skins/Hybrid/" + logo`, which breaks the instant you copy the module to another skin) — parameterize the skin folder name/base path so the same module file can be dropped into multiple skins unchanged.

## Reference files

- `references/architecture.md` — IFS paths, required markup, file relationships, launch URLs, copy-before-customize rule.
- `references/event-lifecycle.md` — full event order and every documented global event (`beforeLoad`, `customize`, `pui.genie.afterInit`, `afterLoad`, `pui.genie.onalarm`, plus the broader `pui.*` event set: `inputfilter`, `onbeforetimeout`, `onoffline`, `onPCCommand`, `onshutdown`, `onsubmit`, `ontimeout`, `onuseractivity`, `overrideSubmitUrl`, `validate`, `beforeRender`/`beforeRespond`/`onload` — noting which do **not** fire for Genie screens) with parameters and real examples.
- `references/helper-functions.md` — catalog of the `genie.js` runtime helper API actually used across ~30 real skins, with signatures and usage examples.
- `references/attribute-colors.md` — the 5250 attribute-byte → CSS class table (`A20`–`A3E`, DIV vs INPUT variants) and how/why skins remap them.
- `references/patterns.md` — worked patterns pulled from real skins: sign-on screen rebuild, function-key → side-menu/action-panel generation, responsive/tablet touch keypad, dynamic vs static logo placement, break-message (`pui["brkmsg..."]`) setup, loading-animation CSS.
- `references/modular-js.md` — how to structure additional, reusable custom JS files across skins.
