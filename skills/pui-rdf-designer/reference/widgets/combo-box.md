# Widget: `combo box`

Use `"field type": "combo box"` on an item to render this widget.

Properties below are **specific to `combo box`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **53** · Combined with universal: **143**
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

### `empty text`

**Default:** `blank`

Specifies the default text to place into an empty field. When the field receives focus, the text is removed. This property is similar to the 'placeholder' property, but provides support for older browser that may not yet support the placeholder HTML5 attribute.

### `placeholder`

**Default:** `blank` · **HTML attribute:** `placeholder`

Uses the HTML5 placeholder attribute to specify a short hint that describes the expected value of an input field. Older browsers may not support this feature.

### `float placeholder`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, the placeholder becomes a floating label on top of the input field once there is data in the input box or while focus is on the element.

### `input type`

**Default:** `textbox`

**Choices:** `color`, `date`, `datetime`, `datetime-local`, `email`, `month`, `number`, `range`, `search`, `tel`, `time`, `url`, `week`

Specifies an HTML5 input type. Some types may not yet be supported by the user's browser or mobile device. If a type is not specified or if the selected type is not supported, a standard textbox element will be used.

### `browser auto complete`

**Default:** `off`

**Choices:** `on`, `off`, `Other...`

Specifies the value of the HTML textbox "autocomplete" attribute, which controls the browser's autocomplete/autofill feature. Browser autocomplete/autofill is disabled ("off") by default. Specify "on" to enable browser autocomplete/autofill or for further control, specify an autofill field name. See [here](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill-field) for details on autofill field names.

### `select box placement`

**Default:** `Calculated based on the position of the element and the viewing area just before being shown.`

**Choices:** `above`, `below`

If specified, explictly control where the choices will appears as a list box directly.

### `set focus`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the focus will be set to this field when the screen loads.

### `auto advance`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property to indicate that the user does not need to press Enter or otherwise manually submit the screen. Whenever the user keys a character (including a blank) into the last position of the field, the screen contents are submitted to the server as if the Enter key had been pressed.

### `allow field exit`

**Type:** `boolean` · **Default:** `true` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines whether the field exit key (Numeric Pad Plus Sign by default) can be used to progress to the next input element.

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

### `validate name`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property to specify that the data typed into the field must be a valid simple name. The first character must be $, #, @, or A through Z. The remaining characters must be alphanumeric ($, #, @, A through Z, 0 through 9, or underscore (_), and must not contain embedded blanks.

### `validate email`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Use this property to specify that the data typed into the field must be in the format of an email address.

### `allow blanks`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When set to true, blank input will satisfy validity checking should any other associated validity check fail.

### `set as modified`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Marks an input field as modified when it is first displayed.

## Menu Options

### `choices`

**Type:** `list` · **Default:** `Option 1, Option 2, Option 3...`

Specifies the options for a select box (dropdown or list box), text field with autocomplete, combo box, or menu. The options should be comma separated. To specify submenus for a menu, indent the choices using a dash or a series of dashes.

### `choice values`

**Type:** `list` · **Default:** `css`

Specifies alternate option values to send to the application for a select box (dropdown or list box), text field with auto complete, combo box, or menu. The values should be comma separated.

## Database-Driven Image Data

### `remote system name`

**Default:** `Local`

Name of database where file is located. Used only if data to be retrieved is stored on a remote server.

### `database connection`

**Type:** `database_connection` · **Default:** `[default connection]` · **Bind data types:** `string`

**Choices:** `Other...`

Name of the database connection to use. If not specified, the default connection is used. This property is ignored if the applcation is called from a Profound UI / Genie session. In that case, the *LOCAL IBM i database is used.

See [here](https://docs.profoundlogic.com/x/sgDrAw) for instructions on configuring database connections.

### `choices database file`

**Type:** `file` · **Default:** `blank` · **Multi-occurrence:** yes

Database table to be used for a dynamic database-driven dropdown box, list box, or text field with autocomplete.

### `choices database join`

**Type:** `join` · **Default:** `blank` · **Bindable:** no

The Database Join specifications between multiple tables to be used for a dynamic database-driven dropdown box, list box, or text field with autocomplete.

### `choice options field`

**Type:** `field` · **Default:** `blank`

Database field name used to retrieve the options for a dynamic dropdown box, list box, combo box, or text field with auto complete. Multiple fields can be specifed for a text field with auto complete. In this case, the field names should be comma separated.

### `choice values field`

**Type:** `field` · **Default:** `[choice options field]`

Database field name used to retrieve the values sent back to the application. If omitted, the choice options field is used. In the case of a text field with autocomplete that has multiple option fields, the first option field is used.

### `choices selection criteria`

**Type:** `long` · **Default:** `blank`

Optional expression identifying which records should be retrieved from the choices database table.

### `choices parameter value`

**Type:** `long` · **Default:** `blank` · **Multi-occurrence:** yes

Value for parameter marker in 'choices selection criteria' property. Parameter markers are specified using a question mark. Profound UI will accept values from the client for any parameter marker values which are not bound to program fields. Parameter markers are numbered in order of occurrence, from left to right. To specify multiple parameter marker values, right-click the property and select Add Another Choices Parameter Value.

### `blank option`

**Default:** `false`

**Choices:** `true`, `false`

When set to true, a database-driven dropdown box will display a blank option before the options from the database table are displayed.

### `blank option label`

**Default:** `blank`

By default, the blank option contains no text. Use this property to specify alternate text to be displayed in the blank option. The value sent to the server will still be blank.

### `order by`

**Type:** `field` · **Default:** `blank`

Optional expression identifying which fields determine the order of the items. For a database-driven chart, this property is ignored when *'summary option'* is used. In this case, the items will sort on the *'name field'*.
When sorting by columns other than the first choice column, add those columns to the 'choice options field' property.

### `max choices`

**Default:** `[500 or 10]` · **Format:** `number`

Optional maximum number of choices to provide for a dynamic dropdown box, list box, or text field with auto complete. If blank: defaults to 500 for dropdown, 10 for auto complete.

## Dynamic Selection

### `choices url`

**Type:** `long` · **Default:** `blank`

Sets the url to a Web service that returns the choice options and values in JSON format. If a choices url is used, the database file, choice options field, choice value field, and max choices properties are ignored.

## Classes

### `focus class`

**Default:** `blank`

Defines a custom cascading style sheet class for when the element receives focus.

## Events

### `oninput`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script immediately after any input is entered into the element without waiting for the element to lose focus.

### `ondbload`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when database data is loaded for a database-driven widget. An object named **response** will be defined that contains:
- **success** - boolean true/false
- 
- **id** - the widget id
- 
- **error** - an object with 'id', 'text' and 'text2' fields containing the error.
-

### `onoptiondisplay`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script before options are displayed. The script can change the options if needed. The options are passed to the event as a parameter named 'options'. The values are passed to the event as a parameter named 'values'. The combo box widget will run this event any time the options are displayed. The menu widget will only run this event before displaying options if it is used as the context menu of a grid.

### `onselect`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when a selection is made from the selection list of an auto-complete textbox or a combo box. In the case of an auto-complete textbox, the selected record is passed to the function as a JSON object that has properties named after the selected fields.

