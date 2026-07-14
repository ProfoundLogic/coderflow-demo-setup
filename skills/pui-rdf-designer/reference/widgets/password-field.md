# Widget: `password field`

Use `"field type": "password field"` on an item to render this widget.

Properties below are **specific to `password field`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **31** · Combined with universal: **121**
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

### `read only`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression` · **HTML attribute:** `readOnly`

**Choices:** `true`, `false`

Defines whether the current element is read only or not. A read only element prevents the user from changing its value; however, the user can still interact with the element.

### `input only`

**Type:** `boolean` · **Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

Defines whether the current element is input only or not. An input only element is always initialized when the screen appears.

### `placeholder`

**Default:** `blank` · **HTML attribute:** `placeholder`

Uses the HTML5 placeholder attribute to specify a short hint that describes the expected value of an input field. Older browsers may not support this feature.

### `float placeholder`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the placeholder becomes a floating label on top of the input field once there is data in the input box or while focus is on the element.

### `browser auto complete`

**Default:** `off`

**Choices:** `on`, `off`, `Other...`

Specifies the value of the HTML textbox "autocomplete" attribute, which controls the browser's autocomplete/autofill feature. Browser autocomplete/autofill is disabled ("off") by default. Specify "on" to enable browser autocomplete/autofill or for further control, specify an autofill field name. See [here](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill-field) for details on autofill field names.

### `set focus`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the focus will be set to this field when the screen loads.

### `auto advance`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property to indicate that the user does not need to press Enter or otherwise manually submit the screen. Whenever the user keys a character (including a blank) into the last position of the field, the screen contents are submitted to the server as if the Enter key had been pressed.

### `prevent auto tab`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This proprty prevents automatic tabbing on this element even when the pui['auto tab'] flag is set to true.

### `cursor row`

**Default:** `blank` · **Format:** `number`

Identifies the cursor row number associated with this widget.

### `cursor column`

**Default:** `blank` · **Format:** `number`

Identifies the cursor column number associated with this widget.

### `changed`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a response indicator that is set on if the data within the input element is modified.

### `is blank`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a response indicator that is set on if the data within the input element is blank. The property allows you to distinguish between a blank and a zero within a numeric field.

### `show visibility eye`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Enables the visibility eye for the password field so that that password toggling is enabled.

## Validation

### `mandatory entry`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the user must modify the field by typing at least one character into the input box. A blank is a valid character.

### `mandatory fill`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the user must type characters in all positions of the input box.

### `required`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the element cannot be empty.

### `valid values`

**Type:** `list` · **Default:** `blank`

Specifies a list of values that are valid for the user to type into the input box. The values should be comma separated.

### `comparison operator`

**Default:** `blank`

**Choices:** `Equal`, `Not Equal`, `Greater Than`, `Greater Than or Equal`, `Less Than`, `Less Than or Equal`

Identifies the relational operator used to compare data in the input box with the specified comparison value.

### `comparison value`

**Default:** `blank`

Specifies the value used for comparing against data in the input box. This property is used in combination with the comparison operator property.

### `range low`

**Default:** `blank`

Specifies the minimum value for range validity checking. The data in the input box must be greater than or equal to this value.

### `range high`

**Default:** `blank`

Specifies the maximum value for range validity checking. The data in the input box must be less than or equal to this value.

### `allow blanks`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, blank input will satisfy validity checking should any other associated validity check fail.

### `set as modified`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Marks an input field as modified when it is first displayed.

## Classes

### `focus class`

**Default:** `blank`

Defines a custom cascading style sheet class for when the element receives focus.

## Events

### `oninput`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script immediately after any input is entered into the element without waiting for the element to lose focus.

