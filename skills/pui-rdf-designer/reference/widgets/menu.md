# Widget: `menu`

Use `"field type": "menu"` on an item to render this widget.

Properties below are **specific to `menu`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **17** · Combined with universal: **107**
## Identification

### `menu response`

**Default:** `bind` · **Read-only field name:** yes

Specifies a response field to be returned to your program containing the value of the selected menu option. The menu option values are set with the 'choice values' property.

## Field Settings

### `orientation`

**Default:** `theme`

**Choices:** `horizontal`, `vertical`

Specifies the orientation of a slider or a menu element.

### `shortcut key`

**Default:** `blank`

**Choices:** `Enter`, `Escape`, `PageUp`, `PageDown`, `PrtScn`, `Pause/Break`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `F10`, `F11`, `F12`, `F13`, `F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F20`, `F21`, `F22`, `F23`, `F24`, `Alt-F1`, `Alt-F2`, `Alt-F3`, `Alt-F4`, `Alt-F5`, `Alt-F6`, `Alt-F7`, `Alt-F8`, `Alt-F9`, `Alt-F10`, `Alt-F11`, `Alt-F12`, `Alt-F13`, `Alt-F14`, `Alt-F15`, `Alt-F16`, `Alt-F17`, `Alt-F18`, `Alt-F19`, `Alt-F20`, `Alt-F21`, `Alt-F22`, `Alt-F23`, `Alt-F24`, `Ctrl-F1`, `Ctrl-F2`, `Ctrl-F3`, `Ctrl-F4`, `Ctrl-F5`, `Ctrl-F6`, `Ctrl-F7`, `Ctrl-F8`, `Ctrl-F9`, `Ctrl-F10`, `Ctrl-F11`, `Ctrl-F12`, `Ctrl-F13`, `Ctrl-F14`, `Ctrl-F15`, `Ctrl-F16`, `Ctrl-F17`, `Ctrl-F18`, `Ctrl-F19`, `Ctrl-F20`, `Ctrl-F21`, `Ctrl-F22`, `Ctrl-F23`, `Ctrl-F24`

Specifies a keyboard shortcut that can be used to trigger this element.

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

## Menu Options

### `choices`

**Type:** `list` · **Default:** `Option 1, Option 2, Option 3...`

Specifies the options for a select box (dropdown or list box), text field with autocomplete, combo box, or menu. The options should be comma separated. To specify submenus for a menu, indent the choices using a dash or a series of dashes.

### `choice values`

**Type:** `list` · **Default:** `css`

Specifies alternate option values to send to the application for a select box (dropdown or list box), text field with auto complete, combo box, or menu. The values should be comma separated.

### `hover background color`

**Type:** `color` · **Default:** `css`

Defines the background color of a menu option when the user hovers the mouse over it.

### `hover text color`

**Type:** `color` · **Default:** `css`

Defines the text color of a menu option when the user hovers the mouse over it.

### `animate`

**Default:** `true`

**Choices:** `true`, `false`

Determines if hovering over menu options is animated.

### `highlight choice`

**Default:** `false`

**Choices:** `true`, `false`

Adds a "selected" value in css class for active choice.

### `border color`

**Type:** `color` · **Default:** `css`

The color of the border used for menu options.

### `menu option padding`

**Default:** `css` · **Format:** `px`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the edge of the menu option and the menu option text.

### `menu option indent`

**Default:** `css` · **Format:** `px`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the left edge of the menu option and the menu option text.

### `option image`

**Type:** `image` · **Default:** `css`

Defines the background image displayed under each menu option. You can specify one image or a comma separated list of images corresponding to each menu option.

### `option hover image`

**Type:** `image` · **Default:** `css`

Defines the background image displayed when the user hovers over a menu option.

### `onoptionclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when a menu option is clicked. The choice value is passed to the event as a parameter named 'value'. The choice text is passed to the event as a parameter named 'text'.

## Events

### `onoptiondisplay`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script before options are displayed. The script can change the options if needed. The options are passed to the event as a parameter named 'options'. The values are passed to the event as a parameter named 'values'. The combo box widget will run this event any time the options are displayed. The menu widget will only run this event before displaying options if it is used as the context menu of a grid.

