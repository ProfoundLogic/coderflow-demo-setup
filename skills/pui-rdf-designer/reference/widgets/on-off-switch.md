# Widget: `on off switch`

Use `"field type": "on off switch"` on an item to render this widget.

Properties below are **specific to `on off switch`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **7** · Combined with universal: **97**
## Field Settings

### `on value`

**Default:** `blank` · **Bindable:** no

Specifies the value to send to the application when the on/off switch is on.

### `off value`

**Default:** `blank` · **Bindable:** no

Specifies the value to send to the application when the on/off switch is off.

### `on text`

**Default:** `ON`

Specifies the text to to display for the 'on' state of an on/off switch.

### `off text`

**Default:** `OFF`

Specifies the text to to display for the 'off' state of an on/off switch.

### `wide handle`

**Type:** `boolean` · **Default:** `true` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Specifies whether the on/off switch should display a wide handle for switching state. If false is selected, a narrow handle will be used.

### `read only`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression` · **HTML attribute:** `readOnly`

**Choices:** `true`, `false`

Defines whether the current element is read only or not. A read only element prevents the user from changing its value; however, the user can still interact with the element.

### `changed`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a response indicator that is set on if the data within the input element is modified.

