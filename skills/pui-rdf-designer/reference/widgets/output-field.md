# Widget: `output field`

Use `"field type": "output field"` on an item to render this widget.

Properties below are **specific to `output field`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **23** · Combined with universal: **113**
## Field Settings

### `default value`

**Default:** `blank` · **Bindable:** no

Specifies a default value for a field. The specified value is displayed on the first output operation. On subsequent output operations, the program value appears.

### `default value condition`

**Type:** `boolean` · **Default:** `bind` · **Format:** `true / false` · **Bind data types:** `indicator`, `expression` · **Read-only field name:** yes

Determines if the default value is applied.

### `blank value`

**Default:** `blank` · **Bindable:** no · **Multi-occurrence:** yes

Use this property to map blank field data to a different value during input and output operations. This property is typically used with elements whose value is bound to a date, time, or timestamp field. To specify multiple blank values, right-click the property and select Add Another Blank Value.

### `override data`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property together with the 'put override' property to override existing data contents already on the display. It represents the OVRDTA keyword.

### `override attribute`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property together with the 'put override' property to override existing attributes already on the display. It represents the OVRATR keyword.

### `put retain`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

You use this property with the 'overlay' property to prevent the handler from deleting data that is already on the display when the application displays the record again. It represents the PUTRETAIN keyword.

### `cursor row`

**Default:** `blank` · **Format:** `number`

Identifies the cursor row number associated with this widget.

### `cursor column`

**Default:** `blank` · **Format:** `number`

Identifies the cursor column number associated with this widget.

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

### `label for`

**Default:** `blank`

Specifies the ID of the element that this is a label for. This property will cause a <label> tag to be generated for this element with the 'for' attribute set to the ID specified.

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

