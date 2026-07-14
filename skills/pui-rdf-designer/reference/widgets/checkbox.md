# Widget: `checkbox`

Use `"field type": "checkbox"` on an item to render this widget.

Properties below are **specific to `checkbox`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **8** · Combined with universal: **98**
## Field Settings

### `checked value`

**Default:** `blank` · **Bindable:** no

For a checkbox field, specifies the value to send to the application when the checkbox is checked.

### `unchecked value`

**Default:** `blank` · **Bindable:** no

For a checkbox field, specifies the value to send to the application when the checkbox is not checked.

### `indeterminate value`

**Default:** `2` · **Bindable:** no

Specifies the value that renders a checkbox in an indeterminate state (neither checked nor unchecked).

### `label`

**Default:** `widget`

Specifies the caption text associated with a checkbox or a radio button.

### `read only`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression` · **HTML attribute:** `readOnly`

**Choices:** `true`, `false`

Defines whether the current element is read only or not. A read only element prevents the user from changing its value; however, the user can still interact with the element.

### `input only`

**Type:** `boolean` · **Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

Defines whether the current element is input only or not. An input only element is always initialized when the screen appears.

### `set focus`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the focus will be set to this field when the screen loads.

### `changed`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a response indicator that is set on if the data within the input element is modified.

