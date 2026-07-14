# Widget: `radio button`

Use `"field type": "radio button"` on an item to render this widget.

Properties below are **specific to `radio button`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **5** · Combined with universal: **95**
## Identification

### `radio button group`

**Default:** `bind` · **Read-only field name:** yes

Specifies a response field to be returned to your program that allows you to associate multiple radio buttons together. The field name should be unique.

## Field Settings

### `label`

**Default:** `widget`

Specifies the caption text associated with a checkbox or a radio button.

### `read only`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression` · **HTML attribute:** `readOnly`

**Choices:** `true`, `false`

Defines whether the current element is read only or not. A read only element prevents the user from changing its value; however, the user can still interact with the element.

### `set focus`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the focus will be set to this field when the screen loads.

## Validation

### `set as modified`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Marks an input field as modified when it is first displayed.

