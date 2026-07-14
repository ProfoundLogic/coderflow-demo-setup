# Universal Properties

These 90 properties apply to **every** widget type. The per-widget files in this directory list only widget-specific properties — for any widget, this universal set is also available.

Generated from `reference/properties.json` (sourced from `profoundui-client/htdocs/profoundui/proddata/js/runtime/properties.js`).

## Authoring notes

- All boolean property values are encoded as the **strings** `"true"` / `"false"`, not as JSON booleans.
- Numbers are encoded as **strings** too (`"15"`, `"140px"`, etc.).
- Property keys are spelled exactly as shown (with spaces), e.g. `"css class"`, `"font size"`.
- Any property with bindable data types listed can take a [bound-field object](../rdf-shape.md#4-bound-field-object-data-binding) instead of a literal value.
- Event properties (`onclick`, `onchange`, etc.) take JavaScript strings — see `events` category below.

## Identification

### `id`

**Default:** `id` · **Bindable:** no · **Max length:** 75 · **HTML attribute:** `id`

Specifies the ID of the current element. ID's are used to access the element using CSS (#element-id { ... }) and JavaScript code (getObj("element-id");).

### `field type`

**Default:** `widget` · **Bindable:** no

**Choices:** `ajax container`, `button`, `chart`, `checkbox`, `combo box`, `css button`, `css panel`, `date field`, `field set panel`, `file upload`, `file upload dnd`, `graphic button`, `html container`, `hyperlink`, `icon`, `iframe`, `image`, `menu`, `on off switch`, `output field`, `panel`, `password field`, `radio button`, `select box`, `signature pad`, `slider`, `spinner`, `styled button`, `tab panel`, `text area`, `textbox`

Specifies the type of control that is used to render the element.

### `description`

**Default:** `blank` · **Bindable:** no

This property is used to provide a text description or comment for the element.

### `value`

**Default:** `theme`

Sets the initial value of the current element.

## Font and Text

### `color`

**Type:** `color` · **Default:** `css` · **CSS style:** `color`

Specifies the color of the text inside the current element.

### `font family`

**Default:** `css` · **CSS style:** `fontFamily`

**Choices:** `Arial`, `Consolas`, `Courier New`, `Georgia`, `Monospace`, `Tahoma`, `Times New Roman`, `Sans-Serif`, `Serif`, `Trebuchet MS`, `Verdana`, `Other...`

Specifies the font face for the text of the current element.

### `font size`

**Default:** `css` · **Format:** `px` · **CSS style:** `fontSize`

**Choices:** `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `19px`, `20px`, `21px`, `22px`, `23px`, `24px`, `25px`, `26px`, `27px`, `28px`, `29px`, `30px`, `0.75em`, `1.00em`, `1.25em`, `1.50em`, `1.75em`, `2.00em`, `Other...`

Specifies the size of the text for the current element.
**Examples:** 12px 2em 1vh 12pt 70%

### `font style`

**Default:** `css` · **Format:** `italic / normal` · **CSS style:** `fontStyle`

**Choices:** `normal`, `italic`, `oblique`

Specifies the style of the font inside the current element. 
**Examples:**Normal Text
Italic Text
Oblique Text

### `font variant`

**Default:** `css` · **CSS style:** `fontVariant`

**Choices:** `normal`, `small-caps`

Specifies the font variant of the text inside the current element. 'small caps' displays the text as capital letters with the same height of a lower case letter.

### `font weight`

**Default:** `css` · **Format:** `bold / normal` · **CSS style:** `fontWeight`

**Choices:** `normal`, `bolder`, `bold`, `lighter`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`

Specifies the weight of the text inside the current element. 
**Examples:**Font Weight: Normal
Font Weight: Bolder
Font Weight: Bold
Font Weight: Lighter
Font Weight 100
Font Weight 200
Font Weight 300
Font Weight 400
Font Weight 500
Font Weight 600
Font Weight 700
Font Weight 800
Font Weight 900

### `letter spacing`

**Default:** `css` · **Format:** `px` · **CSS style:** `letterSpacing`

**Choices:** `normal`, `-3px`, `-2px`, `-1px`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `19px`, `20px`, `Other...`

Specifies the spacing between each letter of a word inside the current element. **Examples:** 4px: Positive values increase the distance between letters.
-1px: Negative values decrease the distance between letters.

### `text align`

**Default:** `css` · **CSS style:** `textAlign`

**Choices:** `left`, `right`, `center`, `justify`

Specifies the alignment of the text inside the current element.
**Examples:** This text is aligned left.This text is aligned right.This text is aligned center.This text has justified alignment.

### `text decoration`

**Default:** `none` · **Format:** `underline / none` · **CSS style:** `textDecoration`

**Choices:** `none`, `underline`, `overline`, `line-through`

Specifies the decoration on the text inside the current element. 
**Examples:**
None, Underline, Overline, Line-through.

### `text transform`

**Default:** `none` · **CSS style:** `textTransform`

**Choices:** `capitalize`, `uppercase`, `lowercase`, `none`

Specifies the transformation used as the default formatting of the text inside the current element. 
**Examples:** 

capitalize: Changes The First Character Of Each Word To Uppercase

uppercase: CHANGES ALL CHARACTERS OF EACH WORD TO UPPERCASE

lowercase: changes all characters of each word to lowercase

### `word spacing`

**Default:** `css` · **Format:** `px` · **CSS style:** `wordSpacing`

**Choices:** `normal`, `-3px`, `-2px`, `-1px`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `19px`, `20px`, `21px`, `22px`, `23px`, `24px`, `25px`, `Other...`

Specifies the spacing between each word inside the current element. **Examples:**-2px: Negative values decrease the spacing between words.
2px: Positive values increase the spacing between words..

## Field Settings

### `disabled`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression` · **HTML attribute:** `disabled`

**Choices:** `true`, `false`

Determines whether the element is disabled or not. The user cannot use a disabled field in any way.

## Translations

### `translation placeholders`

**Type:** `translationplaceholders` · **Default:** `bind` · **Bindable:** no · **Read-only field name:** yes

Define replacement values for the placeholders in translations.

### `translation placeholder key`

**Bindable:** no · **Multi-occurrence:** yes

### `translation placeholder value`

**Multi-occurrence:** yes

## Validation

### `error message location`

**Default:** `right` · **Bind data types:** `char`, `varchar`, `string`, `indicator`, `expression`

**Choices:** `left`, `right`, `top`, `bottom`, `alert`

Controls the position and orientation of validation and error tool tips. When 'alert' is selected, an alert box will be used instead of a tool tip.

### `error message attach`

**Default:** `window` · **Bind data types:** `char`, `varchar`, `string`, `indicator`, `expression`

**Choices:** `window`, `parent`

Controls what the tool tip is attached to. 'window' means the tip is always visible, even if the widget is not visible inside layouts. 'parent' means the tip is visible when the widget is; only use 'parent' if the widget is in an overflowed layout and the tip should scroll with the widget.

### `error message css class`

**Default:** `pui-tip-error`

Specifies a css class name to apply to the top-level error tip element. This allows error tips to be styled individually. If not specified, css class 'pui-tip-error' is used, which gives error message styling. Try 'pui-tip-info' for an informational message.

### `error messages`

**Type:** `errmessages` · **Default:** `blank` · **Bindable:** no · **Read-only field name:** yes

Identifies error messages to be displayed in association with this element.

### `error message`

**Multi-occurrence:** yes

### `error message id`

**Multi-occurrence:** yes · **Max length:** 7

### `error message file`

**Multi-occurrence:** yes · **Max length:** 10

### `error message library`

**Multi-occurrence:** yes · **Max length:** 10

### `replacement data`

**Bind data types:** `char` · **Read-only field name:** yes · **Multi-occurrence:** yes

### `error condition`

**Type:** `boolean` · **Format:** `1 / 0` · **Bind data types:** `indicator`, `expression` · **Read-only field name:** yes · **Multi-occurrence:** yes

### `error response`

**Type:** `boolean` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes · **Multi-occurrence:** yes

### `error enhanced mode`

**Bindable:** no · **Multi-occurrence:** yes

If checked, allows error messages to display without ERRMSG/ERRMSGID-type restrictions. Errors can display regardless of whether format is already on the screen, and output data is also sent.

## Background

### `background color`

**Type:** `color` · **Default:** `css` · **CSS style:** `backgroundColor`

Defines the background color of the given element.

### `background image`

**Type:** `image` · **Default:** `css` · **CSS style:** `backgroundImage`

Defines the background image of the current element.

### `background position`

**Default:** `css` · **CSS style:** `backgroundPosition`

**Choices:** `top`, `center`, `bottom`, `left`

Position of the background within the current element.

### `background repeat`

**Default:** `css` · **CSS style:** `backgroundRepeat`

**Choices:** `repeat-x`, `repeat-y`, `no-repeat`, `repeat`

Defines how to repeat the background, repeat-x: repeats horizontally, repeat-y: repeats vertically, no-repeat: doesn't repeat at all, repeat: repeats horizontally and vertically.

## Position

### `left`

**Default:** `position` · **Format:** `px` · **CSS style:** `left`

Represents the x-coordinate of the current element. Specify in pixels or as a percentage.

### `top`

**Default:** `position` · **Format:** `px` · **CSS style:** `top`

Represents the y-coordinate of the current element. Specify in pixels or as a percentage.

### `right`

**Default:** `blank` · **Format:** `px` · **CSS style:** `right`

Position of the element from the right of the screen or layout container. Specify in pixels or as a percentage.

### `bottom`

**Default:** `blank` · **Format:** `px` · **CSS style:** `bottom`

Position of the element from the bottom of the screen or layout container. Specify in pixels or as a percentage.

### `height`

**Default:** `widget` · **Format:** `px` · **CSS style:** `height`

Height of the current element. Specify in pixels or as a percentage.

### `width`

**Default:** `widget` · **Format:** `px` · **CSS style:** `width`

Width of the current element. Specify in pixels or as a percentage.

### `min height`

**Default:** `css` · **Format:** `px` · **CSS style:** `minHeight`

Minimum height of the current element.

### `min width`

**Default:** `css` · **Format:** `px` · **CSS style:** `minWidth`

Minimum width of the current element.

### `max height`

**Default:** `css` · **Format:** `px` · **CSS style:** `maxHeight`

Maximum height of the current element.

### `max width`

**Default:** `css` · **Format:** `px` · **CSS style:** `maxWidth`

Maximum width of the current element.

### `z index`

**Default:** `css` · **Format:** `number` · **CSS style:** `zIndex`

The stacking order of the current element, expressed as an integer value. The element with the higher z index will overlay lesser elements.

### `locked in place`

**Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

If set to true, the element cannot be moved or sized.

## Tabs

### `parent tab panel`

**Default:** `position` · **Bindable:** no

This property specifies the id of the Tab Panel to which this element belongs. The property is set automatically when you drag and drop the element onto a Tab Panel.

### `parent tab`

**Default:** `position` · **Bindable:** no

This property specifies the tab index of the specific tab to which this element belongs. Each tab within a Tab Panel is identified by a sequential index, starting with 0 for the first tab, 1 for the second tab, and so on. The property is set automatically when you drag and drop the element onto a Tab Panel.

### `parent field set`

**Default:** `position` · **Bindable:** no

This property specifies the id of the Field Set Panel to which this element belongs. The property is set automatically when you drag and drop the element onto a Field Set Panel.

## Borders

### `border radius`

**Default:** `css` · **Format:** `px` · **CSS style:** `borderRadius`

**Choices:** `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `19px`, `20px`, `Other...`

This property allow you to create rounded corners by specifying a border radius.

### `border bottom color`

**Type:** `color` · **Default:** `css` · **CSS style:** `borderBottomColor`

The color of the element's bottom side of the border.

### `border bottom style`

**Default:** `css` · **CSS style:** `borderBottomStyle`

**Choices:** `none`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

The style of the element's bottom side of the border.

### `border bottom width`

**Default:** `css` · **Format:** `px` · **CSS style:** `borderBottomWidth`

**Choices:** `thin`, `medium`, `thick`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the element's bottom side of the border.

### `border left color`

**Type:** `color` · **Default:** `css` · **CSS style:** `borderLeftColor`

The color of the element's left side of the border.

### `border left style`

**Default:** `css` · **CSS style:** `borderLeftStyle`

**Choices:** `none`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

The style of the element's left side of the border.

### `border left width`

**Default:** `css` · **Format:** `px` · **CSS style:** `borderLeftWidth`

**Choices:** `thin`, `medium`, `thick`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the element's left side of the border.

### `border right color`

**Type:** `color` · **Default:** `css` · **CSS style:** `borderRightColor`

The color of the element's right bottom side of the border.

### `border right style`

**Default:** `css` · **CSS style:** `borderRightStyle`

**Choices:** `none`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

The style of the element's right side of the border.

### `border right width`

**Default:** `css` · **Format:** `px` · **CSS style:** `borderRightWidth`

**Choices:** `thin`, `medium`, `thick`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the element's right side of the border.

### `border top color`

**Type:** `color` · **Default:** `css` · **CSS style:** `borderTopColor`

The color of the element's top side of the border.

### `border top style`

**Default:** `css` · **CSS style:** `borderTopStyle`

**Choices:** `none`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

The style of the element's top side of the border.

### `border top width`

**Default:** `css` · **Format:** `px` · **CSS style:** `borderTopWidth`

**Choices:** `thin`, `medium`, `thick`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the element's top side of the border.

## Padding

### `padding bottom`

**Default:** `css` · **Format:** `px` · **CSS style:** `paddingBottom`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the bottom edge of the current element and the element's content.

### `padding left`

**Default:** `css` · **Format:** `px` · **CSS style:** `paddingLeft`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the left edge of the current element and the element's content.

### `padding right`

**Default:** `css` · **Format:** `px` · **CSS style:** `paddingRight`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the right edge of the current element and the element's content.

### `padding top`

**Default:** `css` · **Format:** `px` · **CSS style:** `paddingTop`

**Choices:** `auto`, `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `6px`, `7px`, `8px`, `9px`, `Other...`

Sets the distance between the top edge of the current element and the element's content.

## Classes

### `css class`

**Type:** `cssClass` · **Default:** `widget` · **Multi-occurrence:** yes

Defines a custom cascading style sheet class to assign to the element. To specify multiple classes, right-click the property and select Add Another CSS Class.

### `display attribute field`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

This property identifies a field containing a display attribute hex value. It represents the DSPATR keyword with a program to system field parameter. The hex value is translated to the appropriate css class at run time.

## Misc

### `cursor`

**Default:** `css` · **CSS style:** `cursor`

**Choices:** `auto`, `default`, `crosshair`, `pointer`, `move`, `e-resize`, `ne-resize`, `nw-resize`, `n-resize`, `se-resize`, `sw-resize`, `s-resize`, `w-resize`, `text`, `wait`, `help`, `Other...`

Determines how the mouse cursor should look when hovering over the element. 

Valid options: default, crosshair, pointer, move, e-resize, ne-resize, nw-resize, n-resize, se-resize, sw-resize, s-resize, w-resize, text, wait, help.

Hover over the options above to see the cursor.

### `overflow x`

**Default:** `css` · **CSS style:** `overflowX`

**Choices:** `visible`, `hidden`, `scroll`, `auto`

Determines whether a horizontal scrollbar should be displayed for this element.

### `overflow y`

**Default:** `css` · **CSS style:** `overflowY`

**Choices:** `visible`, `hidden`, `scroll`, `auto`

Determines whether a vertical scrollbar should be displayed for this element.

### `tab index`

**Default:** `blank` · **Format:** `number` · **HTML attribute:** `tabIndex`

Determines the tab order for input elements on the screen.

### `tool tip`

**Type:** `long` · **Default:** `blank` · **HTML attribute:** `title`

Defines the text to appear in a tool tip when the user hovers the mouse over this element.

### `user defined data`

**Default:** `blank` · **Multi-occurrence:** yes

Specifies user-defined general purpose data associated with the widget. To provide multiple user defined data values, right-click the property and select Add Another User Defined Value.

### `visibility`

**Default:** `blank` · **Format:** `visible / hidden` · **CSS style:** `visibility`

**Choices:** `hidden`, `visible`

Determines whether the element is visible or hidden. Hidden elements appear dimmed out in design mode, and invisible at runtime. If not defined, the CSS will determine the visibility, it will inherit its parent's visibility, or it will be visible.

### `inline style`

**Type:** `long` · **Default:** `blank` · **HTML attribute:** `style`

This property lets you define CSS properties that will be applied to the widget. These properties are applied inline, and therefore take precedence over those defined in a CSS class. Multiple properties may be provided, separated by a semi-colon. You can learn more about CSS properties at the following link: http://www.w3schools.com/cssref/. If you define CSS properties that are defined by other widget properties, the widget properties overrule the CSS inline properties. These CSS properties are ignored and should be set using the widget properties: 'position', 'visibility', 'display', 'left', 'right', 'top', 'bottom', 'width', 'height'

## Events

### `onblur`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the element loses focus.

### `onchange`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the element value is changed.

### `onclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the element is clicked.

### `ondblclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the element is double-clicked.

### `onfocus`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the element receives focus.

### `onkeydown`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when a keyboard key is being pressed down on this element.

### `onkeypress`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the user presses and releases a keyboard key on this element.

### `onkeyup`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the user releases a keyboard key on this element.

### `onmousedown`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse is pressed down on this element.

### `onmousemove`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse is moving within this element.

### `onmouseout`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse is moved off this element.

### `onmouseover`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse is moved over this element.

### `onmouseup`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when the mouse button is released off this element.

