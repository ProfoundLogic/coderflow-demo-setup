# Common Real-World Skin Patterns

Distilled from ~30 production Genie skins (Hybrid, Hybrid Gray, PLDemo, Skyline, Gradient, Tablet, Classic, blueline, celina, grayline, podemo, ecwa_skin, hcl_skin, and others in the Archive folder).

## 1. Sign-on screen rebuild

Nearly every custom skin rewrites the default 5250 sign-on screen inside `customize()`, following the same shape (only field ids and image paths vary — field ids shift when the screen's password field spans 128 chars, see below):

```js
function customize() {
  if (detectScreen(
    "D_1_23", "             Sign On",
    "D_2_48", "System  . . . . . :",
    "D_3_48", "Subsystem . . . . :",
    "D_4_48", "Display . . . . . :"
  )) {
    // 1. Strip the stock sign-on chrome (system/subsystem/display labels, extra unused fields)
    hideElements("D_1_23", "D_2_48", "D_3_48", "D_4_48", "D_2_70", "D_3_70", "D_4_70",
      "I_11_53", "I_12_53", "D_11_17", "D_12_17", "D_8_17", "D_9_17", "D_10_17",
      "I_8_53", "I_9_53", "I_10_53", "D_24_40");

    // 2. Relabel/restyle the User/Password labels and reposition them
    changeElementValue("D_6_17", "&nbsp;&nbsp;&nbsp;&nbsp;User:");
    changeElementClass("D_6_17", "BigText");
    changeElementValue("D_7_17", "Password:");
    changeElementClass("D_7_17", "BigText");
    setDOMAttribute("D_7_17", "transparent", true);
    setDOMAttribute("D_6_17", "transparent", true);
    moveElement("D_6_17", 8.9, 15);
    moveElement("D_7_17", 10.9, 15);
    moveElement("I_6_53", 8.9, 49);
    moveElement("I_7_53", 10.9, 49);

    // 3. Add a real Login button that just presses Enter, and relabel Quit -> Exit
    var loginButton = newElement(12.7, 49, "button", "Login", "login_button");
    loginButton.onclick = function() { pressKey("Enter"); };
    moveElement("quit_button", 12.7, 57);
    changeElementValue("quit_button", "Exit");

    // 4. Drop in a backdrop/branding image behind the form
    var backdrop = newElement(5, 15, "img", "/profoundui/userdata/genie skins/<Skin>/login.gif", "backdrop_image");
    backdrop.style.zIndex = 5;

    // 5. Handle 128-character password mode (adds continuation fields I_8_1/I_9_1)
    if (getObj("I_7_53") != null && getObj("I_8_1") != null && getObj("I_9_1") != null) {
      var pwlength = getObj("I_7_53").fieldInfo.size + getObj("I_8_1").fieldInfo.size + getObj("I_9_1").fieldInfo.size;
      if (pwlength == 128) {
        // reposition the label/input stack to make room for 3 password lines
      }
    }

    // 6. Surface the CPF sign-on error message via pui.genie.alertMsg instead of raw text
    var msg = get("D_24_1");
    if (msg != "" && pui.genie.alertMsg == "") {
      pui.genie.alertMsg = msg;
      if (pui.genie.alertMsg.substr(0, 3) == "CPF") pui.genie.alertMsg = pui.genie.alertMsg.substr(8);
      if (pui.genie.alertMsg.substr(0, 1) == "-") pui.genie.alertMsg = pui.genie.alertMsg.substr(1);
    }
    hideElement("D_24_1");
  }
  ...
}
```

**Field ids are not portable.** The exact `D_row_col`/`I_row_col` ids (and the row/col numbers passed to `moveElement`) depend on the display's column width and exact field layout — a skin built for an 80-col signon screen and one built for a 132-col signon screen need *separate* blocks with different ids (compare `Gradient/custom.js` field ids like `D_1_23`/`I_6_53` against `Gradient/adjusted columns custom.js`'s `D_1_22`/`I_6_52` — every id is shifted by one column). When adapting this pattern to a new skin/screen, get the real field ids from the actual screen (ask the user for a screen capture or field dump) rather than reusing another skin's ids verbatim.

## 2. Function-key → side menu / action panel

Several skins (Hybrid family) replace the row of function-key buttons with a styled vertical side panel, built dynamically from whatever function keys the *current* screen actually has:

```js
hybridSkin.createSideMenu = function() {
  var inputs = document.getElementById("5250").getElementsByTagName("input");
  var buttons = [], dups = {}, gotEnter = false;
  for (var i = 0; i < inputs.length; i++) {
    var input = inputs[i];
    if (input.type != "button" || input.fkey == null) continue;
    if (input.className.indexOf("hide") >= 0) continue;          // skip hidden buttons
    if (input.id.indexOf("W") != -1) {                            // buttons inside windows: style in place, don't move to the side panel
      changeElementClass(input.id, "hybrid-button");
      continue;
    }
    input.style.visibility = "hidden";                            // hide the original button; we render our own
    if (dups[input.value] == true) continue;                      // de-dupe identical labels
    buttons.push({ fkey: input.fkey, text: input.value });
    dups[input.value] = true;
    if (input.fkey.toLowerCase() == "enter") gotEnter = true;
  }
  if (!gotEnter) buttons.unshift({ fkey: "Enter", text: "Continue" });
  buttons.sort(function(a, b) { return a.fkey < b.fkey ? -1 : a.fkey == b.fkey ? 0 : 1; });

  var panel = newElement("div", "", "side");
  panel.className = "hybrid-actions";
  // ...size/position panel based on buttons.length, then for each button:
  //   create a div/button styled as a link, fkeyLink.onclick = function() { pressKey(buttons[i].fkey); }
};
```

Call this once per screen from `customize()` (or from the one-time `pui.genie.afterInit`/`pui.onload` hook if the panel container itself is part of the static header built once). Key ideas worth reusing:
- Read function keys straight off the rendered `<input type="button">` elements' `.fkey`/`.value`, don't hardcode a button list.
- Always add a synthetic "Enter → Continue" button if the screen has no explicit Enter key, so the panel is never dead-ended.
- Distinguish window-format buttons (id contains `"W"`) from main-screen buttons — windows keep their own inline buttons; only main-screen keys get promoted to the side panel.

## 3. Responsive / fixed-width centering for 132-column mode

```js
hybridSkin.resizeArea = function() {
  if (pui.genie.middleDiv != null) {
    var div5250 = getObj("5250");
    if (div5250 != null && div5250.style.width != "100%") {
      var windowWidth = pui.getWindowSize().width;
      if (pui.genie.displaySize == 132) {
        pui.genie.middleDiv.style.height = "640px";
        div5250.style.position = "absolute";
        var position = (windowWidth - 950) / 2;
        if (position < 180) position = 180;
        div5250.style.left = position + "px";
      }
      else {
        pui.genie.middleDiv.style.height = "560px";
        div5250.style.position = "absolute";
        var position = (windowWidth - 620) / 2;
        if (position < 180) position = 180;
        div5250.style.left = position + "px";
      }
    }
  }
};
window.onresize = function() { hybridSkin.resizeArea(); };
```

This hardcodes pixel widths per display size and manually centers via absolute positioning. It works, but it's brittle — for new skins prefer CSS (`max-width`, flexbox centering, `clamp()`) over recreating this pattern; when *extending* an existing skin that already uses this approach, keep using it rather than mixing in a second, conflicting centering mechanism.

## 4. Tablet/touch keypad (Tablet skin)

For touch devices, `start.html` renders a permanently-visible small button row (Enter/PageUp/PageDown/Keypad) plus a hidden full F-key keypad `<div>` toggled by the Keypad button, all wired through a shared namespace:

```js
var Tab = {};
Tab.autoHideKeypad = true;
Tab.pressKey = function(key, e) {
  if (key == "Help" && pui["5250"]["state"] == "P") key = "ErrorHelp";
  pressKey(key);
  if (Tab.autoHideKeypad) Tab.hideKeypad(e);
};
function beforeLoad() {
  document.getElementById("5250").style.visibility = "hidden";  // hide until rendered
  document.getElementById("main").style.display = "block";       // reveal shell on first load
  Tab.sizeDisplay();                                              // pick lowres-/highres- + normal/wide body class
}
```
`start.html` wires the buttons directly with inline `onclick="Tab.pressKey('F1', event);"` — a rare case where interaction logic lives in the HTML rather than `custom.js`, appropriate here because the buttons are static chrome, not screen-dependent.

## 5. Logo placement — two supported approaches

**Static (in `start.html`)** — loads immediately, anchored top-left, simplest:
```html
<img src="/profoundui/userdata/genie skins/Gradient/logo.png" />
```

**Dynamic (in `custom.js`)** — loads after other page elements and overlays them; lets you position relative to other dynamically-computed layout:
```js
var logoElement = newElement("img", "/profoundui/userdata/genie skins/Gradient/logo.png");
logoElement.style.left = "0px";
logoElement.style.top = "0px";
```
The image is anchored to the `#5250` div — experiment with `top`/`left` to place it. In the Hybrid skin's `customize()`, this is done via a helper (`hybridSkin.displayLogo(dspf)`) that positions differently depending on whether it's rendering for the Genie 5250 stream vs. a Rich Display File (`dspf` flag) context.

Changing the logo image itself: drop the new file into the skin's folder (name it `logo.png`/`logo.jpg`/`logo.gif` to match whichever extension the existing reference uses, or update the reference to the new filename) — then clear the browser cache to see it.

## 6. Loading-animation CSS

`customize()` sets which CSS class drives the spinner: `pui["loading animation"]["css"] = "pui-<skin>-animation";`. The class must exist in the skin's CSS with a real `@keyframes` rotation, e.g.:

```css
.pui-classic-animation {
  position: absolute; display: block; top: 0; left: 0; width: 50px; height: 50px; z-index: 1001;
}
.pui-classic-animation:before {
  content: ''; position: absolute; top: 5px; left: 5px; right: 5px; bottom: 5px;
  border-radius: 50%; border: 2.5px solid transparent; border-top-color: #FFFFFF;
  animation: pui-spin 1s linear infinite;
}
@keyframes pui-spin {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```
If a skin references a `pui["loading animation"]["css"]` class that doesn't exist in the CSS (or has no `@keyframes`), the loading indicator will render as a static, non-animated box — check for this when copying/renaming a skin.

## 7. Break message (`*MSGQ`) polling

```js
pui["brkmsg enable"] = true;
pui["brkmsg poll interval"] = 5;   // seconds
pui["brkmsg max messages"] = 10;
pui.breakMessageFormat = function(message, stringwrap) {
  stringwrap.title = "PUIBRKMSG: " + message.date + " " + message.time;
  stringwrap.body = "MESSAGE:<p>" + message.msg + "</p><p><b>From:</b> "
    + "<br> Job Name: " + message.jobName
    + "<br> Job User Name: " + message.jobUserName
    + "<br> Job Number: " + message.jobNum
    + "<br> Job Current Profile Name: " + message.jobCurProfName;
};
```
Set at the top level of `custom.js` (not inside a lifecycle function) since it's global config, not per-screen behavior.
