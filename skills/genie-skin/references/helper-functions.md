# genie.js Helper Function Catalog

These are global helper functions provided by the (obfuscated, unmodifiable) `genie.js` runtime and used from `custom.js`. Signatures below are inferred from consistent real usage across ~30 production skins, not from the obfuscated source — treat argument order/behavior as "observed," and verify against actual on-screen behavior when precision matters.

## Screen/field identification

### `detectScreen(id1, text1, id2, text2, ...)`
Returns `true` if every `(id, text)` pair matches — i.e. the DOM element with that id currently displays that exact text. Used to special-case a specific screen inside `customize()` (almost always the sign-on screen). Match on multiple stable label fields, not just one, to avoid false positives on unrelated screens that happen to share a field id.

```js
if (detectScreen(
  "D_1_23", "             Sign On",
  "D_2_48", "System  . . . . . :",
  "D_3_48", "Subsystem . . . . :",
  "D_4_48", "Display . . . . . :"
)) {
  // this is the sign-on screen
}
```

### `get(id)`
Returns the current text/value of a field by id.

```js
var msg = get("D_24_1");
```

### `getObj(id)`
Returns the actual DOM element for a given field id (like `document.getElementById`, aware of Genie's element ids). Always null-check before using — fields don't always exist on every screen/mode.

```js
if (getObj("I_7_53") != null) getObj("I_7_53").style.width = "90px";
```

### `getRight(fieldObj)`
Given a field's DOM/field object, returns the field object immediately to its right on the same row (spatial lookup). Used e.g. to find the input field next to a matched label, in order to attach a prompt button to it.

### `getOutputFields()`
Returns an array of all output-field objects on the current screen. Iterate and check `typeof field.fieldInfo !== "undefined"` to filter to real 5250 fields.

### Field id convention
5250 field ids follow `D_<row>_<col>` (display/output field) or `I_<row>_<col>` (input field), 0- or 1-based row/col depending on display size — **these ids are screen/layout-specific and will differ between an 80x24 screen and its 132x27 counterpart, or with a differently-numbered password field (128-char password support adds `I_8_x`/`I_9_x` continuation fields).** Never assume an id copied from one screen/skin transfers to another without checking. Window-format fields get an id suffix containing `"W"` (e.g. used to distinguish "is this button inside a window" in side-menu-building code).

## DOM manipulation

### `hideElement(id)` / `hideElements(id1, id2, id3, ...)`
Hide one or many fields by id (sets them non-visible without removing them — used constantly to strip default sign-on-screen chrome before rebuilding it).

### `changeElementValue(id, newHtml)`
Replace the displayed content of a field (accepts HTML, e.g. `"&nbsp;&nbsp;&nbsp;&nbsp;User:"`).

### `changeElementClass(id, className)`
Swap/set the CSS class on a field element — used to reskin default labels (`"BigText"`, `"hybrid-button"`, etc.) without touching layout.

### `setDOMAttribute(id, attrName, value)`
Set an arbitrary DOM/Genie attribute on a field, e.g. `setDOMAttribute("D_7_17", "transparent", true)` to make a label's background transparent so it can sit over a backdrop image.

### `moveElement(id, row, col)`
Reposition an existing field to a new row/col (in the 5250 grid's row/col units, translated through `pui.multX`/`pui.multY`).

```js
moveElement("D_6_17", 8.9, 15);
```

### `newElement(...)` — several call shapes seen in real code, dispatch on argument count/types:
- `newElement(row, col, type, value, id)` — create+position a new element, e.g. a button:
  ```js
  var loginButton = newElement(12.7, 49, "button", "Login", "login_button");
  loginButton.onclick = function() { pressKey("Enter"); };
  ```
- `newElement(row, col, "img", src, id)` — a positioned image (e.g. sign-on backdrop):
  ```js
  var backdrop = newElement(5, 15, "img", "/profoundui/userdata/genie skins/Hybrid/login.gif", "backdrop_image");
  backdrop.style.zIndex = 5;
  ```
- `newElement("img", src)` — an image anchored to the `#5250` div's top-left, styled manually afterward (used for logos):
  ```js
  var logoElement = newElement("img", "/profoundui/userdata/genie skins/Hybrid/logo.png");
  logoElement.style.top = "-72px";
  logoElement.style.left = "-170px";
  ```
- `newElement("div", content, id)` — a plain positioned div (side-menu arrows/links, headers):
  ```js
  var arrow = newElement("div", "", "arrow" + i);
  arrow.className = "fkey-arrow";
  arrow.innerHTML = "&gt;";
  ```

All returned elements are real DOM nodes — set `.style.*`, `.className`, `.onclick`, etc. directly afterward.

### `applyProperty(obj, propertyName, value)`
Sets a Designer-style *field property* (not a raw CSS style) on a dynamically-created widget and returns the (possibly wrapped/replaced) object — used when building widgets that need to behave like Designer-configured ones (graphic buttons with an `onclick` script string, tab panel style, field type):

```js
var newButton = newElement("button", "");
newButton = applyProperty(newButton, "id", "button_" + promptField.id);
newButton = applyProperty(newButton, "field type", "graphic button");
newButton = applyProperty(newButton, "image source", "/profoundui/proddata/images/icons/view.png");
newButton = applyProperty(newButton, "onclick", 'setCursor("' + promptField.id + '"); pui.set("' + promptField.id + '", "? "); pressKey("F4");');
```
Also used post-hoc on existing widgets, e.g. `applyProperty("TabPanel1", "tab panel style", "Bright")`.

## Interaction

### `pressKey(fkeyName)`
Simulates a function key press / Enter, submitting the screen — e.g. `pressKey("Enter")`, `pressKey("F3")`. This is how custom buttons/links wire back into normal 5250 processing.

### `setCursor(id)`
Move the 5250 cursor focus to a given field id (used before `pressKey("F4")` prompt simulation, so the prompt targets the right field).

### `pui.set(id, value)`
Programmatically set an input field's value (as if the user typed it) — e.g. setting a subfile option column value for every selected row before pressing Enter:

```js
function processMenuOption(value, substart, col) {
  var subfile = getObj("subfile");
  var sel = subfile.grid.getSelectedRows();
  var count = 0;
  for (var i = 0; i < sel.length; i++) {
    var field = "I_" + String(substart + sel[i] - 1) + "_" + col;
    pui.set(field, value);
    count++;
  }
  if (count > 0) pressKey("Enter");
}
```

### `getTarget(e)`
Cross-browser helper to get the actual event target from a click/DOM event (older skins use this instead of `e.target` directly for older-browser compatibility; new code can just use `e.target`).

## Sizing

- `pui.getWindowSize()` → `{width, height}` of the browser viewport.
- `pui.multX`, `pui.multY` — pixels-per-column / pixels-per-row; set in `beforeLoad()` based on `pui.genie.displaySize`, and used implicitly by `moveElement`/row-col-based `newElement` calls, and explicitly in resize math.
