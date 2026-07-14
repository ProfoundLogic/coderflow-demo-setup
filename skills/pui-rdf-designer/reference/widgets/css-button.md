# Widget: `css button`

Use `"field type": "css button"` on an item to render this widget.

Properties below are **specific to `css button`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **32** · Combined with universal: **122**
## Identification

### `response`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator`, `char`, `zoned` · **Read-only field name:** yes

Specifies a response indicator to be returned to your program when the element is clicked.

## Alternate Destination

### `destination url`

**Default:** `blank` · **Bind data types:** `char`, `varchar`, `string`

Specifies an alternate destination URL for the control. The screen will either be submitted to this URL or the browser will navigate to it, depending on the 'redirect to destination' property value.

### `destination parameters`

**Type:** `destinationparams` · **Default:** `blank` · **Bindable:** no · **Read-only field name:** yes

Identifies parameter names and the corresponding bound fields for use with 'destination url'.

### `destination parameter name`

**Bindable:** no · **Multi-occurrence:** yes

### `destination parameter value`

**Multi-occurrence:** yes

### `bookmarkable`

**Type:** `boolean` · **Default:** `true` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

By default, 'destination parameters' are added to the URL to facilitate bookmarking. If this property is set to 'false', then the parameters will only appear in the POST data.

### `redirect to destination`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

If set to 'true' the browser will navigate to the 'destination url', passing the 'destination parameters'. Otherwise, the screen will submit by Ajax call.

## Field Settings

### `theme`

**Default:** `theme`

**Choices:** `A - Black`, `B - Blue`, `C - Gray`, `D - Light Gray`, `E - Yellow`, `F - Green`, `G - Red`, `Other...`

Specifies the jQuery Mobile theme to use for the button. The theme is associated with a set of cascading style sheet rules.

### `icon position`

**Default:** `theme`

**Choices:** `left`, `right`

Specifies the position of the icon. If a position is not provided, icons other than image icons will not be displayed.

### `icon`

**Type:** `icon` · **Default:** `theme`

Identifies the icon to display in the position specified by the 'icon position' property. Setting this property overrides the 'image source' property.

### `small button`

**Default:** `theme`

**Choices:** `true`, `false`

This property uses CSS to provide a smaller, more compact version of the button that is useful in toolbars and tight spaces.

### `straight edge`

**Default:** `theme`

**Choices:** `all`, `left`, `right`, `top`, `bottom`

Determines which parts of the element will have a straight edge instead of rounded corners.

### `hyperlink reference`

**Default:** `browser`

This property specifies an href attribute for the hyperlink. It is used as an alternative to the response property or the onclick event property.

### `target`

**Default:** `_self`

**Choices:** `_parent`, `_blank`, `_top`, `_self`

This property specifies where to open the hyperlink reference.

### `download file`

**Default:** `blank` · **HTML attribute:** `download`

Specifies the name of the file to download when clicking on the link (instead of navigating to the link/file).

### `shortcut key`

**Default:** `blank`

**Choices:** `Enter`, `Escape`, `PageUp`, `PageDown`, `PrtScn`, `Pause/Break`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `F10`, `F11`, `F12`, `F13`, `F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F20`, `F21`, `F22`, `F23`, `F24`, `Alt-F1`, `Alt-F2`, `Alt-F3`, `Alt-F4`, `Alt-F5`, `Alt-F6`, `Alt-F7`, `Alt-F8`, `Alt-F9`, `Alt-F10`, `Alt-F11`, `Alt-F12`, `Alt-F13`, `Alt-F14`, `Alt-F15`, `Alt-F16`, `Alt-F17`, `Alt-F18`, `Alt-F19`, `Alt-F20`, `Alt-F21`, `Alt-F22`, `Alt-F23`, `Alt-F24`, `Ctrl-F1`, `Ctrl-F2`, `Ctrl-F3`, `Ctrl-F4`, `Ctrl-F5`, `Ctrl-F6`, `Ctrl-F7`, `Ctrl-F8`, `Ctrl-F9`, `Ctrl-F10`, `Ctrl-F11`, `Ctrl-F12`, `Ctrl-F13`, `Ctrl-F14`, `Ctrl-F15`, `Ctrl-F16`, `Ctrl-F17`, `Ctrl-F18`, `Ctrl-F19`, `Ctrl-F20`, `Ctrl-F21`, `Ctrl-F22`, `Ctrl-F23`, `Ctrl-F24`

Specifies a keyboard shortcut that can be used to trigger this element.

### `messages`

**Type:** `messages` · **Default:** `blank` · **Bindable:** no · **Read-only field name:** yes

Identifies messages used to populate this element.

### `clear message`

**Bindable:** no · **Multi-occurrence:** yes

### `message id prefix`

**Multi-occurrence:** yes · **Max length:** 3

### `message id`

**Multi-occurrence:** yes · **Max length:** 7

### `message file`

**Multi-occurrence:** yes · **Max length:** 10

### `message library`

**Multi-occurrence:** yes · **Max length:** 10

### `message condition`

**Type:** `boolean` · **Format:** `1 / 0` · **Bind data types:** `indicator`, `expression` · **Read-only field name:** yes · **Multi-occurrence:** yes

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

## Position

### `auto arrange`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property is used to automatically position action buttons or links in order to accommodate for converted overlay screens.

## Drag and Drop

### `allow drag`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the element can be drag and dropped.

### `use proxy`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if a drag and drop proxy is created. If set to true, instead of dragging the element around, a proxy element is created and moved instead.

### `ondragstart`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the user first starts to drag the element. Information about the drag and drop operation is provided using the global pui.dragDropInfo object.

### `drop targets`

**Type:** `list` · **Default:** `blank`

Specifies a list of target element id's, which identify where this element can be dropped.

### `ondragenter`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the user drags an element over a valid drop target. Information about the drag and drop operation is provided using the global pui.dragDropInfo object.

### `ondragleave`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the user moves an element out of a valid drop target during a drag operation. Information about the drag and drop operation is provided using the global pui.dragDropInfo object.

### `ondrop`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse is released during a drag and drop operation. Information about the drag and drop operation is provided using the global pui.dragDropInfo object.

