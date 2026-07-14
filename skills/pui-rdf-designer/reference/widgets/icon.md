# Widget: `icon`

Use `"field type": "icon"` on an item to render this widget.

Properties below are **specific to `icon`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **4** · Combined with universal: **94**
## Identification

### `response`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator`, `char`, `zoned` · **Read-only field name:** yes

Specifies a response indicator to be returned to your program when the element is clicked.

## Field Settings

### `icon`

**Type:** `icon` · **Default:** `theme`

Identifies the icon to display in the position specified by the 'icon position' property. Setting this property overrides the 'image source' property.

### `shortcut key`

**Default:** `blank`

**Choices:** `Enter`, `Escape`, `PageUp`, `PageDown`, `PrtScn`, `Pause/Break`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `F10`, `F11`, `F12`, `F13`, `F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F20`, `F21`, `F22`, `F23`, `F24`, `Alt-F1`, `Alt-F2`, `Alt-F3`, `Alt-F4`, `Alt-F5`, `Alt-F6`, `Alt-F7`, `Alt-F8`, `Alt-F9`, `Alt-F10`, `Alt-F11`, `Alt-F12`, `Alt-F13`, `Alt-F14`, `Alt-F15`, `Alt-F16`, `Alt-F17`, `Alt-F18`, `Alt-F19`, `Alt-F20`, `Alt-F21`, `Alt-F22`, `Alt-F23`, `Alt-F24`, `Ctrl-F1`, `Ctrl-F2`, `Ctrl-F3`, `Ctrl-F4`, `Ctrl-F5`, `Ctrl-F6`, `Ctrl-F7`, `Ctrl-F8`, `Ctrl-F9`, `Ctrl-F10`, `Ctrl-F11`, `Ctrl-F12`, `Ctrl-F13`, `Ctrl-F14`, `Ctrl-F15`, `Ctrl-F16`, `Ctrl-F17`, `Ctrl-F18`, `Ctrl-F19`, `Ctrl-F20`, `Ctrl-F21`, `Ctrl-F22`, `Ctrl-F23`, `Ctrl-F24`

Specifies a keyboard shortcut that can be used to trigger this element.

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

