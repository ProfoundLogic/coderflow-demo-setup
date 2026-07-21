# Genie Event Lifecycle & Global Events

Source: Confluence PUI space "Global Events" page and its full set of child pages (one per event), plus corroboration against real `custom.js` files.

## Order of events on every screen load

1. **`beforeLoad()`** — in `custom.js`.
2. 5250 data is rendered.
3. **`customize()`** — in `custom.js`.
4. **`pui.genie.afterInit`** — in `custom.js`.
5. Screen customizations made with the Designer are applied.
6. **`afterLoad()`** — in `custom.js`.
7. **`pui.genie.onalarm`** — in `custom.js` (only fires if the screen sent the 5250 `ALARM` keyword).

All of these are plain functions/assignments defined at the top level of `custom.js`. Define only the ones you need; skins are free to omit any of them.

---

## `beforeLoad()`

Fires **before** a Genie screen is rendered. Useful for adjusting X/Y multipliers based on display size before anything paints.

```js
function beforeLoad() {
  if (pui.genie.displaySize == 132) {
    pui.multX = 6;
    pui.multY = 20;
  }
  else {
    pui.multX = 8;
    pui.multY = 23;
  }
}
```

No parameters.

## `customize()`

Runs after every screen renders, but **before** any Designer enhancements are applied. This is where the vast majority of skin logic lives — special-casing specific screens (most commonly the sign-on screen) via `detectScreen(...)`, hiding/relabeling/repositioning fields, building side menus from function keys, setting loading-animation config, handling 132-wide vs normal-width layout.

No parameters. See `patterns.md` for the canonical sign-on-screen rewrite used (with minor variants) across nearly every real skin reviewed.

## `pui.genie.afterInit`

Fires **after** Genie has finished its own automatic customizations (e.g. turning function keys into buttons) but **before** Designer enhancements. Good for injecting structural DOM (headers, logo containers, side panels) that needs to exist before the Designer runs on top of it.

```js
pui.genie.afterInit = function() {
  var toolbarDiv = getObj("genieToolbar");
  if (toolbarDiv) {
    var myBtn = document.createElement("button");
    myBtn.innerText = "My Action";
    myBtn.onclick = function() { alert("My Action clicked!"); };
    toolbarDiv.appendChild(myBtn);
  }
};
```

Because this is a single global function assignment (not additive), and `customize()` runs on *every* screen, real skins guard the assignment so it only happens once:

```js
if (pui.genie.afterInit == null) {
  pui.genie.afterInit = function() {
    // one-time header/logo/side-menu construction
  };
}
```

No parameters.

## `afterLoad()`

Fires after everything — including Designer enhancements — has been applied, for every screen. Good for final visual polish and for behavior conditioned on whether the Designer touched the screen (`pui.genie.isCustomized` flag).

```js
function afterLoad() {
  if (pui.genie.isCustomized && (new Date()).getHours() > 13 && getObj("TabPanel1") != null) {
    applyProperty("TabPanel1", "tab panel style", "Bright");
    applyProperty("TabPanel1", "field type", "tab panel");
  }
}
```

No parameters.

## `pui.genie.onalarm` *(requires Profound UI v6 Fix Pack 2.0+)*

Fires after Genie finishes loading/displaying a screen that specified the 5250 `ALARM` keyword. Use it to play a sound or show a visual alert.

```js
pui.genie.onalarm = function() {
  var soundFile = new Audio("/profoundui/userdata/sounds/ding.mp3");
  soundFile.play();
};
```

or a visual fallback for loud environments / hard-of-hearing users:

```js
pui.genie.onalarm = function() {
  alert("alarm sounded");
};
```

No parameters. (HTML5 audio format support varies by browser.)

## `pui.onload` at the very bottom of `custom.js` (page-level, one-shot)

Distinct from the *per-record-format* `pui.onload(config)` documented below (which does **not** fire for Genie at all). In real Genie skins, assigning `pui.onload = function() {...}` at the bottom of `custom.js` and using `setTimeout(fn, 0)` inside it is used as a page-load-time hook to strip leftover DOM (e.g. an unused `HeadingPanel`) and do first-paint layout work (logo, user display, side menu) once per page load — see the Hybrid skin in `patterns.md`.

---

## Broader `pui.*` global events (apply across Genie / Rich Display Files — noted per event)

These are assigned as functions on the global `pui` object, typically from `custom.js` or a shared JS file loaded alongside it.

### `pui.beforeRender(obj)` — **does NOT fire for Genie screens** (Rich Display Files only)
Fires before Rich Display Record Formats render. Receives the full server response object (layers, formats, widget metadata, screen data) — can mutate it or return a new one.

### `pui.beforeRespond(postData)`
Fires before a response is POSTed from browser to server. Receives the POST data object; can mutate/return it. Useful for injecting custom-widget values into the outgoing payload without an `onsubmit` handler on every screen.

### `pui.inputfilter(value, fieldInfo, context)`
Fires for each field modified on a Genie/5250 **or** Rich Display File screen, before submission. Can return a replacement string (any other return value/no return = original value used). `context` is `"genie"` or `"dspf"`. Good for stripping smart-quotes/tabs pasted from Office apps:

```js
pui.inputfilter = function(value, fieldInfo, context) {
  return value.replace(/\t/g, " ")
              .replace(/“/g, "\"").replace(/”/g, "\"")
              .replace(/‘/g, "'").replace(/’/g, "'");
};
```

### `pui.onbeforetimeout()`
Fires before a client-side session timeout completes. Return `false` to cancel the timeout (e.g. after confirming the user is still active):

```js
pui.onbeforetimeout = function() {
  if (window.confirm("Your session is about to timeout. Click OK to extend it.")) return false;
  return true;
};
```

### `pui.onload(config)` — **does NOT fire for Genie screens** (Rich Display Files only)
Fires after each RDF record format renders, right before the screen's own `onload`. For Genie, use `customize()`/`afterLoad()` instead. Receives `{file, library, name, metaData, data, ref, container}`.

### `pui.onoffline()`
Fires when Profound UI can't reach the server. Use to show an alternate offline flow (e.g. `pui.show({meta: preloadedDspf, handler: function(response) {...}})`). If undefined, a default "connection lost" alert shows.

### `pui.onPCCommand(command, pause)`
Alternate handler for `runPCCommand()` / Genie `STRPCCMD`. Return `true` if you handled the command, `false` to let the PC Command Listener/Launcher handle it. (Pre-FP7 behavior: return value ignored, undefined return = "handled".) `pause` param (FP8+) is `true` if `pause(*YES)` was specified.

### `pui.onshutdown(param)`
Fires when a Genie session ends. Receives `{exception, msg}`, e.g. `{"exception":"CPF87D7","msg":"..."}`.

```js
pui.onshutdown = function(param) {
  if (param.exception == "CPF87D7") { /* cannot select device */ }
  else if (param.exception == "PUI0034") { /* macro processing error */ }
};
```

### `pui.onsubmit()`
Fires before a response is submitted (fkey press, button/link click), for Genie or Rich Display File screens. Return `false` to cancel submission. Commonly used to mask the screen during the round trip:

```js
pui.onsubmit = function() {
  pui.maskScreen();
};
```
Typically placed in a separate shared JS file (e.g. `/profoundui/userdata/js/trainex.js`) referenced from `start.html` between `genie.js` and `custom.js` — see `modular-js.md`.

### `pui.ontimeout()`
Fires after a client-side session timeout has already occurred (session over, info screen showing). Use to redirect, close the window, etc.:

```js
pui.ontimeout = function() {
  location.href = "/my_timeout_page.html";
};
```

### `pui.onuseractivity()`
Fires on every mouse move / keypress. Use for custom client-side inactivity tracking.

### `pui.overrideSubmitUrl(url)`
Override the URL page responses submit to. Receives and must return a URL string.

```js
pui.overrideSubmitUrl = function(url) {
  var user = pui["appJob"]["user"];
  return url + "&u=" + user;
};
```

### `pui.validate(obj)` — Rich Display File field validation
Fires for each modified field on a Rich Display File screen before submission. Receives `{value, fieldName, dataType, dataLength, formatting}`. Return a modified `value` on the object plus `null` to "bubble up" to normal formatting, or return `{msg: "..."}` to reject with a validation message.

```js
pui.validate = function(obj) {
  if (obj.dataType == "char") {
    obj.value = obj.value.replace(/\t/g, " ");
    if (/[^\x20-\x7E]/.test(obj.value)) return { msg: "The field contains invalid characters." };
  }
  return null;
};
```

---

## Key global state referenced from these hooks

- `pui.genie.displaySize` — `132` for wide/27-row mode, otherwise normal (80x24-family).
- `pui.genie.middleDiv` — DOM reference to the middle container div wrapping the `#5250` div.
- `pui.genie.alertMsg` — string; sign-on screens copy the CPF error message here so `start.html`/CSS can surface it as a styled alert instead of a raw 5250 output line.
- `pui.genie.config.useAjax` — whether Ajax connection mode is active (affects whether manual absolute positioning of `#5250` for 132-mode is even meaningful).
- `pui.genie.isCustomized` — true if the current screen has Designer customizations applied.
- `pui.multX` / `pui.multY` — pixel-per-column / pixel-per-row multipliers used by `moveElement`/`newElement` row,col coordinates.
- `pui["appJob"]["user"]` — current signed-on user.
- `pui["loading animation"]["css"]` / `["left"]` — which CSS animation class (and its left offset) drives the loading spinner; must match a real `@keyframes`-based class in the skin's CSS (see `patterns.md`).
- `pui["brkmsg enable"]`, `pui["brkmsg poll interval"]`, `pui["brkmsg max messages"]`, `pui.breakMessageFormat(message, stringwrap)` — break-message (`*MSGQ`) polling and formatting.
- `pui["vertical button spacing"]`, `pui["close browser text"]` — misc per-skin display tuning.
