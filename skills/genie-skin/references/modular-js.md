# Building Reusable, Modular Custom JavaScript

`custom.js` is just *a* script referenced by `start.html` — nothing about Genie requires all custom behavior to live in that one file. You can (and for anything reusable, should) split logic into additional JS files loaded via their own `<script>` tags, so the same module can be dropped into multiple skins.

## Wiring it in — the one rule that's easy to miss

A JS file only runs if `start.html` actually has a `<script src="...">` tag pointing at it. This sounds obvious, but real skins get it wrong: `Archive/ecwa_skin/` ships a second file, `ecwa_custom.js` (a `setPromptButtons()` helper that scans output fields for known label text and attaches a prompt/lookup button next to the matching input), but **`start.html` never references it** and the one call site in `custom.js` is commented out (`// setPromptButtons();`). The function is dead code — present in the folder, invisible at runtime. Always verify a module is wired up by checking the actual `<script>` tags in `start.html`, not just that the file exists in the folder.

Load order in `start.html`:

```html
<link href="/profoundui/proddata/css/profoundui.css" rel="stylesheet" type="text/css" />
<link href="/profoundui/userdata/genie skins/Skin_Name/Skin_Name.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="/profoundui/proddata/js/genie.js"></script>

<!-- shared/reusable modules go here, between genie.js and custom.js -->
<script type="text/javascript" src="/profoundui/userdata/js/shared/side-menu.js"></script>
<script type="text/javascript" src="/profoundui/userdata/js/shared/responsive-center.js"></script>

<script type="text/javascript" src="/profoundui/userdata/genie skins/Skin_Name/custom.js"></script>
```

This ordering means each module can define/attach functions and defaults, and `custom.js` (loaded last) can call into them, override a default, or pass skin-specific config — the same relationship `custom.js` already has with `genie.js` itself. `pui.onsubmit`/`pui.onuseractivity`/`pui.ontimeout`-style global event handlers are shown in the official docs living in exactly this kind of separate file (e.g. `/profoundui/userdata/js/trainex.js`), so this is an established, supported pattern, not a workaround.

## Namespace everything

Real skins already do this organically and it's the right instinct to formalize: `hybridSkin = {}` in the Hybrid family, `Tab = {}` in the Tablet skin. Hang every function and every piece of state off one object per module; never leave bare global functions/vars, which is how two unrelated skins/modules silently clobber each other's `count`, `top`, `prevButton`, etc. (this actually happens across the real skins reviewed — several redeclare loop-scoped variables like `var top`/`var position` twice in the same function due to copy-paste history).

```js
// side-menu.js — reusable across any skin that wants a function-key side panel
var SkinSideMenu = SkinSideMenu || {};

SkinSideMenu.build = function(options) {
  options = options || {};
  var panelClass = options.panelClass || "skin-actions";
  var linkClass = options.linkClass || "skin-fkey-link";
  // ...build panel from document.getElementById("5250") inputs, using options.* for styling hooks
};
```

## Don't hardcode the skin name into a shared module

Every real skin's `custom.js` hardcodes its own folder name into asset paths:

```js
// Hybrid/custom.js — NOT portable as-is to another skin
var logoElement = newElement("img", "/profoundui/userdata/genie skins/Hybrid/" + logo);
```

That's fine *inside* a skin's own `custom.js` (it's supposed to be skin-specific), but it's exactly what to avoid inside a shared module meant to be reused across skins. Instead, derive the base path, or accept it as a parameter/config value set by each skin's own `custom.js` before the module runs:

```js
// shared/branding.js
var SkinBranding = SkinBranding || {};

SkinBranding.showLogo = function(imagePath, opts) {
  opts = opts || {};
  var logoElement = newElement("img", imagePath);
  logoElement.style.top = opts.top || "-72px";
  logoElement.style.left = opts.left || "-170px";
  return logoElement;
};
```

```js
// Skin_Name/custom.js — the one place the skin name is allowed to be hardcoded
SkinBranding.showLogo("/profoundui/userdata/genie skins/Skin_Name/logo.png");
```

This mirrors how the module-vs-skin split already works for `genie.js` (generic runtime) vs. `custom.js` (skin-specific config of that runtime) — the shared module is the generic part, the skin's own `custom.js` is the thin per-skin configuration layer on top.

## Suggested shared-module candidates, based on duplication actually observed across skins

These are implemented near-identically (copy-pasted with minor drift) in multiple real skins reviewed — strong candidates to extract into one shared, parameterized module instead of maintaining N divergent copies:

- **Sign-on screen rebuild** (`patterns.md` §1) — nearly identical across Classic/Hybrid/Hybrid Gray/PLDemo/ecwa_skin/hcl_skin, differing only in field ids (which do need to stay per-skin/per-screen-size) and image paths (parameterize).
- **Function-key side menu / action panel** (`patterns.md` §2) — near-identical `createSideMenu` in every Hybrid-family skin, with drifting bugfixes/tweaks between copies (a strong sign this should be one maintained module, not five independent copies silently diverging).
- **132-column responsive centering** (`patterns.md` §3) — same `resizeArea` logic repeated with slightly different hardcoded pixel widths per skin; parameterize the widths, share the function.
- **Break-message polling/formatting** (`patterns.md` §7) — identical `pui.breakMessageFormat` in every skin that has it at all.

## Minimal template for a new shared module

```js
// /profoundui/userdata/js/shared/<module-name>.js
var <ModuleName> = <ModuleName> || {};

// Called once by a skin's custom.js to configure this module for that skin.
<ModuleName>.init = function(config) {
  <ModuleName>.config = Object.assign({
    // sensible defaults here
  }, config || {});
};

<ModuleName>.someBehavior = function() {
  // use <ModuleName>.config.* instead of hardcoded per-skin values
};
```

```js
// Skin_Name/custom.js
<ModuleName>.init({ basePath: "/profoundui/userdata/genie skins/Skin_Name/" });

function customize() {
  <ModuleName>.someBehavior();
  // ...rest of skin-specific customize() logic
}
```
