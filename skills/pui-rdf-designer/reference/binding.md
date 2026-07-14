# Field Binding

This reference covers how Rich Display File (RDF) properties are bound to RPG program fields — the data binding model that ties UI widget state to host program variables. When authoring an RDF JSON file, replacing a literal property value with a binding object (`{ "fieldName": ..., "dataType": ..., "dataLength": ..., "decPos": ..., "refField": ... }`) declares a program field of that name, type, and length that the runtime reads (for output) or writes (for input) on every screen exchange. Most item-level properties are bindable; the pages below describe the binding object shape, the supported data types, how response indicators flow back to the program, and how non-data properties (visibility, position, focus, tooltips, etc.) can be controlled dynamically via binding.

## Field Binding

*Source: Confluence page 1596863718*

### Overview
Field binding is used to create a field in the Rich Display File to allow a value, or response, to be tied to an RPG program field. With field binding, a new field is created in the Visual Designer with the name, data type, and length that is associated with the bound field when the Rich Display File is compiled. The newly-created field is then able to be used in the RPG program in either of the following ways:

1.  To have a value, or response, set from the program itself.

2.  Or to receive a value, or response, from the application.

If a field is able to be bound, the **Field Binding Dialog** button will be available in the property:
Clicking this button will open the **Field Binding Dialog**, as shown in the image below:

### Formatting the Bound Field
There are many different types of formatting that can be applied to a bound field. This allows the data that is loaded into the field to be displayed in a certain, specified format.

#### Text
This field formatting option is used for text / character fields. The options that are available under the Text type are as follows:

- **Trim Leading Spaces** - This will make sure that leading spaces will be trimmed from the text.

- **Trim Trailing Spaces** - This will make sure that trailing spaces will be trimmed from the text.

- **Right Justify and Blank Fill** - This will allow for the text to be right-justified and have blanks fill the field.

- **Right Justify and Zero Fill** - This will allow for the text to be right-justified and have zero fill the field.

#### Number
This field formatting option is used to format number fields. The options that are available under the Number type are as follows:

- The “**Use 1000 (Thousands) Separator**” option allows for the use of a thousand’s separator.

- The “**Show Zero Balance**” option allows for showing if the field has a current value of zero (0).

- The “**Blank Fill**” and “**Zero Fill**” field formatting option also allows zero and/or blank fill for the field.

- The “**No extra spaces**” option causes an input field to behave as it would with **keyboard Shift + Y**. The number of characters that can be keyed into the field is equal to the length of the field. When no extra spaces option is unchecked, extra characters can be typed for the sign, decimal, and thousands separators. 

##### Number Example:
In the example below, the differences between all of the options are displayed. The length of data is **10** and **2** decimals.

- **Use 1000 Separator** - The source data, “**1200000.00**”, would appear as “**1,200,000.00**” in the output.

- **Show Zero Balance** - This option has source data, “**00**”, that would appear as “**.00**” in the output. 

- **Blank Fill** - The source data, “**12.34  **“, would appear as “**12.34**” in the output.

- **Zero Fill** - The source data, “**12345.60**”, would appear as “**00012345.60**” in the output.

- **No Extra Spaces** - The source data, “ **12345671.89**”, would appear as “**12345671.89**” in the output.
- **Edit Word** - This option is used to format a numeric field with an editing pattern that is specified. In the example above, the source data, “**000000123**”, would appear as “**\*\*\*\*123.00**” in the output (*see images below*).
- **Edit Mask** - This option is used to block off certain characters so they cannot be changed in the input field. In the example below, the edit mask, used in conjunction with the edit word property, allows the “**/**” characters to *not* be removed when the Backspace or Delete key are used (*see the images below*).
- **Currency Symbol** - This option is used to place a character or string representing currency to precede the data.

  - **For Example:** “\$”, “€”, or “Dollars: “ (s*ee the image below)*.
- **Units** - The Units dropdown can preset the value of the field with a suffix from the following list:

#### Indicator
This field formatting option is used to format indicator fields. Indicators have various formats that can be used depending on what the indicator is used for.

For example: Typically, buttons use an indicator format of `1 / 0` (`1` = `*on`; `0` = `*off`).

#### Date
This field formatting option is used to format the value of the field to display as a date.

#### Time
This field format option sets the value to display as a time. This can be set for 12 hour or 24 hour display.

#### Time Stamp
This field formatting option formats the field with a date and time stamp, in the selected format.

#### Special
This field formatting option includes preset formats designed for different scenarios (e.g., zip code, social security number, or phone number formats).

#### Custom
This field formatting option can be used to specify your own formatting that may not be included in the “Special” preset format selections. You can set the selection with custom JavaScript or a custom date/time pattern.

##### Custom JavaScript Function Example:
This example will demonstrate how to use the custom JavaScript function. This is used to produce custom formatting, along with JavaScript code from a separate JavaScript file placed in the following directory on the IFS: ***/www/InstanceName/htdocs/profoundui/userdata/custom/js***

In the following code for this example, the function determines if the value is greater than **50**, and, if so, it will append “**19**” to the front of the year. Otherwise, it will append “**20**” to the front of the year.

```js
function myFunction(num)
{
  if (num.value > 50)
  {
  return "19" + String(num.value);
  }
  else
  {
  return "20" + String(num.value);
  }
}
```
##### Custom Date/Time Pattern Example:
In this example, you can see the pattern, “**M - D - Y / g:i A**”, would return the following format:

---

## Binding Properties

*Source: Confluence page 1512015251*

### Overview
Binding is the process of connecting a "field" (a variable to be *supplied by* your program or *returned to* your program) with a property on a Profound UI widget. Most item-level properties may be "bound" by inserting a JSON object (with the fields shown below) in place of a direct property value.

### Binding Properties
- **Field Name ("fieldName") -** Required Field. Name of Program Field to Bind to.

- **Data Type** **("dataType") -** The data type of the Program field. The following types are available:

  - **Char** (**“char”**)

  - **Decimal** (**“zoned”**)

  - **Indicator** (**“indicator”**)

  - **Indicator Expression** (**“expression”**)

  - **Floating Point** (**“floating”**)

  - **Date** (**“date”**)

  - **Time** (**“time”**)

  - **Time Stamp**  (**“timestamp”**)

  - **Graphic** (**“graphic”**)

You can also select “Use Reference Field” as the Data Type and the type will match the data field type of an already defined program field (you can either specify the Reference Field value or have your Field Name match the reference field’s name).

- **Data Length** **("dataLength")** - The length of the data for the program field.

- **Decimals ("decPos") - **The number of decimal positions for a Data Type of Decimal.

- **Reference Field ("refField")** -  If your field name is different from the name of the Reference Field (if you are using the “Use Reference Field” Data Type), you will have to specify the name of the Reference Field here.

---

## Controlling Widget Properties with Binding

*Source: Confluence page 1596558220*

The example described on this page is also included in the Profound UI Samples Library (**PUISAMPLES**) that is automatically installed onto your system when you install Profound UI.

- **Display file source:** PUISAMPLES/QDDSSRC/**POSI001D**

- **RPGLE source:** PUISAMPLES/QRPGLESRC/**POSI001R**
### Description
Widgets may have lots of properties to determine their look and behavior. These properties can be bound to an RPG field and changed dynamically. You can use the concept of binding to do the following, and much more:

- Hide and display elements dynamically, with the “**visibility**” property.

- Dynamically change the position of an element, with the “**left**” and “**top**” properties.

- Create dynamic images with the “**image source**” property on an Image widget.

- Display custom tool tips with the “**tool tip**” property.

- Set focus on a field dynamically with the “**set focus**” property.

### Example
1.  For example, you can bind the top and left properties of an element to RPG variables, named “**TopBoxVal**” and “**LeftBoxVal**” respectively.

2.  Then, in the RPG code, assign the appropriate value to the variable, as follows:

```rpgle
 /Free
         OutputText = 'Move this element around with the controls';
         LeftBoxVal = 240;
         TopBoxVal = 189;
         DoU btnExit = *On;
           ExFmt CHPOSI;
         EndDo;
         *InLr = *On;
 /End-Free
```
3.  By changing the values in the drop down boxes, the “**LeftBoxVal**” and “**TopBoxVal**” values are updated, and the element is moved when the **Submit** button is pressed:

---

## Response

*Source: Confluence page 1596560668*

### Description
This Section handles properties for responses to various actions, such as button presses or data changes.

### Child Page List
- **Changed (Screen Level)**
- **Set Off**
- **Valid Command Key**
- **Back Button**

---

## Response Indicator

*Source: Confluence page 1596856649*

### Description
This specifies a response indicator that is returned to your program when the element is clicked.

### Additional Details
- **Promptable?** NO

- **Possible Values:** Must be bound.

- **Bindable?** YES

- **Products:** Profound UI

### Example
In this example, clicking on the ‘Submit’ button will send a response back to the program for the **submit** response indicator.
