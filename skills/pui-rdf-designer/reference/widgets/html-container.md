# Widget: `html container`

Use `"field type": "html container"` on an item to render this widget.

Properties below are **specific to `html container`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **11** · Combined with universal: **101**
## Font and Text

### `white space`

**Default:** `widget` · **CSS style:** `whiteSpace`

**Choices:** `normal`, `pre`, `nowrap`, `pre-wrap`, `pre-line`

Specifies how white space inside the current element is handled. The default is *nowrap* for most widgets. The prefix 'pre-' is short for 'preserve'.

## Field Settings

### `html`

**Type:** `long` · **Default:** `placeholder`

Used to define custom html in an html container.

### `cursor row`

**Default:** `blank` · **Format:** `number`

Identifies the cursor row number associated with this widget.

### `cursor column`

**Default:** `blank` · **Format:** `number`

Identifies the cursor column number associated with this widget.

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

