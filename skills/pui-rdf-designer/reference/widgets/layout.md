# Widget: `layout`

Use `"field type": "layout"` on an item to render this widget.

Properties below are **specific to `layout`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **37** · Combined with universal: **127**
## Identification

### `tab response`

**Default:** `bind` · **Format:** `number` · **Bind data types:** `zoned` · **Read-only field name:** yes

Specifies a numeric response field to be returned to your program when a tab is selected containing the index of the selected tab. Each of the Tab Panel's tabs are identified by a sequential index, starting from 0. For example, 0 refers to the first tab, 1 refers to the second tab, etc.

## Field Settings

### `has header`

**Default:** `theme`

**Choices:** `true`, `false`

Determines whether the panel has a header.

### `header height`

**Default:** `theme` · **Format:** `number`

Specifies the height of the panel header.

### `header theme`

**Default:** `theme`

**Choices:** `A - Black`, `B - Blue`, `C - Gray`, `D - Light Gray`, `E - Yellow`, `F - Green`, `G - Red`, `Other...`

Specifies the jQuery Mobile theme to use for the panel header. The theme is associated with a set of cascading style sheet rules.

### `body theme`

**Default:** `theme`

**Choices:** `A - Black`, `B - Blue`, `C - Gray`, `D - Light Gray`, `E - Yellow`, `F - Green`, `G - Red`, `Other...`

Specifies the jQuery Mobile theme to use for the panel body. The theme is associated with a set of cascading style sheet rules.

### `straight edge`

**Default:** `theme`

**Choices:** `all`, `left`, `right`, `top`, `bottom`

Determines which parts of the element will have a straight edge instead of rounded corners.

### `response AID`

**Default:** `Enter`

**Choices:** `AutoEnter`, `Clear`, `Enter`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `F10`, `F11`, `F12`, `F13`, `F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F20`, `F21`, `F22`, `F23`, `F24`, `Help`, `PageDown`, `PageUp`, `Print`, `RecordBackspace`

When screen is submitted for 'tab response' property, the AID code corresponding to the key specified here will be used. If not specified, the AID code for the Enter key will be used.

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

## Menu Options

### `border color`

**Type:** `color` · **Default:** `css`

The color of the border used for menu options.

## Tabs

### `tab names`

**Type:** `list` · **Default:** `Tab 1,Tab 2,Tab 3`

This property identifies a comma separated list of tab names for a Tab Panel.

### `active tab`

**Default:** `0` · **Format:** `number` · **Bind data types:** `zoned`

This property specifies the initial active tab on a Tab Panel. Each tab within a Tab Panel is identified by a sequential index, starting with 0 for the first tab, 1 for the second tab, and so on.

### `ontabclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when a tab is clicked. The tab index is passed to the event as a parameter named 'tab'. If the client-side script evaluates to false, the tab will not be switched.

## Template Settings

### `template`

**Default:** `widget` · **Bindable:** no

**Choices:** `simple container`, `table`, `mobile device`, `css panel`, `accordion`, `responsive layout`, `tab panel`, `fieldset`

Specifies the name of the template used to render the layout.

### `header text`

**Default:** `placeholder`

Specifies the text that will appear in the panel header.

### `section names`

**Type:** `list` · **Default:** `placeholder`

Specifies a comma separate list of section names for the accordion.

### `active section`

**Default:** `0` · **Format:** `number`

This property specifies the initial active section on an Accordion Layout. Each section within an Accordion is identified by a sequential index, starting with 0 for the first section, 1 for the second section, and so on. When this property is bound to a field, the currently-active section will be included in the response when the screen is submitted to the server-side program.

### `small sections`

**Default:** `false`

**Choices:** `true`, `false`

This property uses CSS to provide a smaller, more compact version of the header sections.

### `allow collapse`

**Default:** `true`

**Choices:** `true`, `false`

Determines if the accordion can be fully collapsed.

### `onsectionclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when an accordion section is expanded. The section index is passed to the event as a parameter named "section". If the client-side script evaluates to false, the section will not be expanded.

### `lazy load`

**Default:** `false`

**Choices:** `true`, `false`

When true, render contents of a tab or section after the user activates it instead of rendering everything immediately (which can be slower).

### `onlazyload`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script after a container is rendered lazily. (See lazy load property.)

### `layout items`

**Default:** `5`

**Choices:** `1`, `2`, `3`, `4`, `5`, `6`, `Other...`

The number of containers for this layout.

### `style rules`

**Type:** `responsive` · **Default:** `blank`

String of CSS stylesheet rules, used to define positions and dimensions of containers. Leave empty when styles are expected to be defined in an external stylesheet. See [Responsive Layout](http://www.profoundlogic.com/docs/display/PUI/Responsive+Layout) for more information.

### `use viewport`

**Default:** `true`

**Choices:** `true`, `false`

Determines how @media rules in "style rules" are interpreted. When "use viewport" is true, the page size determines which @media rules to apply. When false, the layout's height and width determine which @media rules to apply. 

See [Responsive Layout](http://www.profoundlogic.com/docs/display/PUI/Responsive+Layout) for more information.

### `container names`

**Type:** `list` · **Default:** `blank`

List of container names to aid in designing screens. Names appear only in Responsive Dialog preview and Designer canvas.

### `movable tabs`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows the user to rearrange tabs at runtime.

### `legend`

**Default:** `Field Set`

Text to display in the field set's legend.

### `legend align`

**Default:** `left`

**Choices:** `left`, `center`, `right`

The alignment of the legend text.

### `legend style`

**Type:** `long`

Styling for the legend text.

### `border style`

**Default:** `css`

**Choices:** `none`, `dotted`, `dashed`, `solid`, `double`, `groove`, `ridge`, `inset`, `outset`

The style of the element's border.

### `rows`

**Default:** `2` · **Bindable:** no

Specifies the number of table rows for this layout.

### `columns`

**Default:** `2` · **Bindable:** no

Specifies the number of table columns for this layout.

### `top bar`

**Default:** `true` · **Bindable:** no

**Choices:** `true`, `false`

Determines whether the mobile layout should have a top bar.

### `bottom bar`

**Default:** `true` · **Bindable:** no

**Choices:** `true`, `false`

Determines whether the mobile layout should have a bottom bar.

## Position

### `center horizontally`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Centers the layout horizontally within its parent container.

### `center vertically`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Centers the layout vertically within its parent container.

## Borders

### `border width`

**Default:** `css` · **Format:** `px`

**Choices:** `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the grid's outer borders and inner separators.

