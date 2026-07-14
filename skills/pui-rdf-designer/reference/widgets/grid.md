# Widget: `grid`

Use `"field type": "grid"` on an item to render this widget.

Properties below are **specific to `grid`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **139** · Combined with universal: **229**
## Field Settings

### `has header`

**Default:** `theme`

**Choices:** `true`, `false`

Determines whether the panel has a header.

### `header height`

**Default:** `theme` · **Format:** `number`

Specifies the height of the panel header.

## Menu Options

### `border color`

**Type:** `color` · **Default:** `css`

The color of the border used for menu options.

## Database-Driven Image Data

### `remote system name`

**Default:** `Local`

Name of database where file is located. Used only if data to be retrieved is stored on a remote server.

### `database connection`

**Type:** `database_connection` · **Default:** `[default connection]` · **Bind data types:** `string`

**Choices:** `Other...`

Name of the database connection to use. If not specified, the default connection is used. This property is ignored if the applcation is called from a Profound UI / Genie session. In that case, the *LOCAL IBM i database is used.

See [here](https://docs.profoundlogic.com/x/sgDrAw) for instructions on configuring database connections.

### `database file`

**Type:** `file` · **Default:** `blank` · **Multi-occurrence:** yes

Database table to use for the chart's data source.

### `database join`

**Type:** `join` · **Default:** `blank` · **Bindable:** no

The Database Join specifications between multiple tables to be used for a dynamic, database-driven chart.

### `selection criteria`

**Type:** `long` · **Default:** `blank`

Optional expression identifying which records should be retrieved from the database table.

### `parameter value`

**Type:** `long` · **Default:** `blank` · **Multi-occurrence:** yes

Value for parameter marker in 'selection criteria' or 'custom sql' properties. Parameter markers are specified using a question mark. Profound UI will accept values from the client for any parameter marker values which are not bound to program fields. Parameter markers are numbered in order of occurrence, from left to right. To specify multiple parameter marker values, right-click the property and select Add Another Parameter Value.

### `custom sql`

**Type:** `long` · **Default:** `blank`

Specifies an SQL statement to use to retrieve the records for a database-driven chart. The last column is used as the chart values. Earlier columns are concatenated into the chart labels.

### `order by`

**Type:** `field` · **Default:** `blank`

Optional expression identifying which fields determine the order of the items. For a database-driven chart, this property is ignored when *'summary option'* is used. In this case, the items will sort on the *'name field'*.
When sorting by columns other than the first choice column, add those columns to the 'choice options field' property.

## Drag and Drop

### `allow drag`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines if the element can be drag and dropped.

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

## Events

### `ondbload`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when database data is loaded for a database-driven widget. An object named **response** will be defined that contains:
- **success** - boolean true/false
- 
- **id** - the widget id
- 
- **error** - an object with 'id', 'text' and 'text2' fields containing the error.
-

### `onfilterchange`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the filter has changed.

### `onrowclick`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when a row within the grid is clicked. The script can determine the row number using the **row** variable.

### `onrowdblclick`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when a row within the grid is double-clicked. The script can determine the row number using the **row** variable.

### `onrowmouseover`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the mouse is moved over a row within the grid. The script can determine the row number using the **row** variable.

### `onrowmouseout`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the mouse is moved off of a row within the grid. The script can determine the row number using the **row** variable.

### `onpagedown`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the user pages down using the grid's scrollbar or the grid's paging bar. To prevent the grid's default paging action, the script must evaluate to *false*.

### `onpageup`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the user pages up using the grid's scrollbar or the grid's paging bar. To prevent the grid's default paging action, the script must evaluate to *false*.

### `onscroll`

**Type:** `js` · **Default:** `blank` · **Bindable:** no

Initiates a client-side script when the user scrolls using the grid's scrollbar. The **row** variable in the script provides the top row of the grid.

## Identification

### `record format name`

**Default:** `blank` · **Bindable:** no · **Max length:** 10

Specifies the name that is used to access this grid from server code.

## Subfile Settings

### `display subfile`

**Default:** `true` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property tells the system when to display grid records. It represents the SFLDSP keyword.

### `display control record`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property tells the system when to display the subfile control record. It represents the SFLDSPCTL keyword.

### `initialize subfile`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property tells the system to initialize all records within the subfile. It represents the SFLINZ keyword.

### `subfile records not active`

**Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

This property can be used together with the "initialize subfile" property to initialize a subfile with no active records. It represents the SFLRNA keyword.

### `delete subfile`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property tells the system when to delete the subfile area. It represents the SFLDLT keyword.

### `clear subfile`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property tells the system when to clear all records from the subfile. It represents the SFLCLR keyword.

### `subfile size`

**Default:** `blank` · **Format:** `number` · **Bind data types:** `zoned`

This property represents the SFLSIZ keyword, which specifies the number of records that can be placed into the subfile. However, if your program places a record with a relative record number larger than the SFLSIZ value into the subfile, the subfile is automatically extended to contain it (up to a maximum of 9999 records). If this property is not specified, the subfile page value plus one is used. The subfile page value is determined from the "number of rows" property minus the header row if it is present.

### `subfile record number`

**Default:** `blank` · **Format:** `number` · **Bind data types:** `zoned`, `reference`

This property identifies the scrollbar position when the subfile is first displayed. It represents the SFLRCDNBR keyword.

### `position at top`

**Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

When this property is set to true, the subfile record identified by the "subfile record number" property will display in the top row of the grid. This property is equivalent to the SFLRCDNBR(*TOP) keyword.

### `place cursor`

**Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

When this property is set to true, the cursor is placed in the subfile record identified by the contents of the "subfile record number" property. The cursor is positioned at the first input-capable field in the subfile record. This property is equivalent to the SFLRCDNBR(CURSOR) keyword.

### `subfile end`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property is used to indicate that a subfile with a paging bar has loaded all of its records. It represents the SFLEND keyword.

### `subfile next changed`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property represents the SFLNXTCHG keyword, which forces the user to correct program-detected typing errors in subfile records. The program can cause a record to be changed so that a get-next-changed operation must read the record again.

### `cursor record number`

**Default:** `bind` · **Format:** `number` · **Bind data types:** `zoned` · **Read-only field name:** yes

This property can be bound to a numeric field, which will return the relative record number of the record on which the cursor is located. It represents the SFLCSRRRN keyword.

### `cursor progression`

**Default:** `left to right`

**Choices:** `left to right`, `top to bottom`

This property determines the tab order for input elements within the subfile. It represents the SFLCSRPRG keyword.

### `subfile return rrn`

**Default:** `bind` · **Format:** `number` · **Bind data types:** `zoned`, `reference` · **Read-only field name:** yes

This property can be bound to a numeric field, which will return the relative record number of the top visible record within a grid. It represents the SFLSCROLL keyword.

### `subfile changed`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a response indicator that is set on if the input data within the subfile is modified.

## Message Subfile Settings

### `subfile message key`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

This property specifies a field that is used to select messages from a program message queue for display. Your program places a message reference key in this field. The property represents the SFLMSGKEY keyword on a subfile record format.

### `subfile program message queue`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

This property specifies a field that contains the name of the program message queue used to build a message subfile. It represents the SFLPGMQ keyword on a subfile record format.

### `subfile control program message queue`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

This property specifies a field that contains the name of the program message queue used to build a message subfile when used in conjunction with the *subfile initialize* property. It represents the SFLPGMQ keyword on a subfile control record format.

## Header

### `header font family`

**Default:** `css`

**Choices:** `Arial`, `Consolas`, `Courier New`, `Fantasy`, `Georgia`, `Monospace`, `Tahoma`, `Times New Roman`, `Sans-Serif`, `Serif`, `Trebuchet MS`, `Verdana`, `Other...`

The font face for the text inside the grid header row. To define a different font for each grid column, select *Other...* and specify a comma separated list of fonts.

### `header font size`

**Default:** `css` · **Format:** `px`

**Choices:** `8px`, `9px`, `10px`, `11px`, `12px`, `13px`, `14px`, `15px`, `16px`, `17px`, `18px`, `19px`, `20px`, `21px`, `22px`, `23px`, `24px`, `25px`, `26px`, `27px`, `28px`, `29px`, `30px`, `Other...`

The size of the text inside the grid header row. To specify a different font size for each grid column, select *Other...* and specify a comma separated list of font sizes.

### `header font style`

**Default:** `css` · **Format:** `bold / normal`

**Choices:** `normal`, `italic`, `oblique`, `Other...`

Specifies the style of the font inside the grid header row. To specify a different font style for each grid column, select *Other...* and specify a comma separated list of font styles.

### `header font weight`

**Default:** `css` · **Format:** `italic / normal`

**Choices:** `normal`, `bolder`, `bold`, `lighter`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`, `Other...`

Specifies the weight of the font inside the grid header row. To specify a different font weight for each grid column, select *Other...* and specify a comma separated list of font weights.

### `header text align`

**Default:** `css`

**Choices:** `left`, `right`, `center`, `justify`, `Other...`

Alignment of text inside the cells of the grid header row. To specify a different alignment option for each cell, select *Other...* and specify a comma separated list of values.

### `header font color`

**Type:** `color` · **Default:** `css`

Defines the color of the text inside the header row. To define a different color for each grid cell in the header row, specify a comma separated list of color values.

### `header background`

**Type:** `color` · **Default:** `css`

Defines the background color of the header row. To define a different color for each grid cell in the header row, specify a comma separated list of color values.

### `header image`

**Type:** `image` · **Default:** `css`

Defines a repeating background image for the header row.

### `column headings`

**Type:** `list` · **Default:** `placeholder`

Specifies a comma separated list of heading text for each column of the grid.

## Colors

### `odd row font color`

**Type:** `color` · **Default:** `css`

Defines the color of text inside the odd rows of the grid. To define a different color for each grid column, specify a comma separated list of color values.

### `odd row background`

**Type:** `color` · **Default:** `css`

Defines the background color of the odd rows in the grid. To define a different color for each grid column, specify a comma separated list of color values.

### `even row font color`

**Type:** `color` · **Default:** `css`

Defines the color of text inside the even rows of the grid. To define a different color for each grid column, specify a comma separated list of color values.

### `even row background`

**Type:** `color` · **Default:** `css`

Defines the background color of the even rows in the grid. To define a different color for each grid column, specify a comma separated list of color values.

### `row font color`

**Type:** `color` · **Default:** `css`

Defines the color of text in an individual row. You can define a dynamic color for each record by binding this property to a field.

### `row background`

**Type:** `color` · **Default:** `css`

Defines the background color of an individual row. To define a different color for each grid column, specify a comma separated list of color values. You can define a dynamic background color for each record by binding this property to a field.

### `hover font color`

**Type:** `color` · **Default:** `css`

Defines the color of text when the user hovers the mouse cursor over a grid row. To define a different color for each grid column, specify a comma separated list of color values.

### `hover background`

**Type:** `color` · **Default:** `css`

Defines the background color of a grid row when the user hovers the mouse cursor over it. To define a different color for each grid column, specify a comma separated list of color values.

### `selection font color`

**Type:** `color` · **Default:** `css`

Defines the color of text when the user selects a grid row.

### `selection background`

**Type:** `color` · **Default:** `css`

Defines the background color of a grid row when the user selects it.

## Grid Settings

### `number of rows`

**Default:** `theme` · **Bindable:** no

Specifies the number of rows in the grid, including the header row. When the "expand to layout" grid property is true, this is set automatically.

### `number of columns`

**Default:** `theme` · **Bindable:** no

Specifies the number of columns in the grid.

### `row height`

**Default:** `theme` · **Bindable:** no

Specifies the height that will be applied to each row, not including the header row. This can also be controlled by resizing the grid with the mouse. Changing "height" causes this to change automatically.

### `hover effect`

**Type:** `boolean` · **Default:** `theme` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Determines whether the grid rows will be highlighted when the user hovers the mouse over them.

### `hover image`

**Type:** `image` · **Default:** `theme`

Defines a repeating cell background image for the hover effect.

### `row selection`

**Default:** `none`

**Choices:** `none`, `single`, `multiple (simple)`, `multiple (extended)`

Determines if rows within the grid can be selected by the user with a click of the mouse. 

Possible values are: 

**none** - rows cannot be selected 

**single** - only one row can be selected 

**multiple (simple)** - multiple rows can be selected by simply clicking on the rows 

**multiple (extended)** - multiple rows can be selected with the use of the Shift and Ctrl keys

### `selection field`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `char`, `indicator` · **Read-only field name:** yes

This property must be bound to an indicator or a character field, which will be used to both set and return the selected state on each record. If a character field is specified, the selection value property will be used to populate the field when a row is selected.

### `selection value`

**Default:** `blank` · **Bindable:** no

Specifies the value used to populate the selection field when a grid row is selected.

### `selection image`

**Type:** `image` · **Default:** `theme`

Defines a repeating cell background image for row selection.

### `row is hidden field`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

This property must be bound to an indicator field, which will be used to return whether a row has been hidden.

### `column widths`

**Type:** `list` · **Default:** `theme` · **Bindable:** no

Specifies a comma separated list of column widths for this grid.

### `scrollbar`

**Default:** `sliding`

**Choices:** `none`, `sliding`, `paging`

Determines the type of vertical scrollbar used to scroll through records within the grid. A sliding scrollbar scrolls freely, while a paging scrollbar scrolls one page of records at a time only.

### `scroll tool tip`

**Default:** `true`

**Choices:** `none`, `row number`, `row range`

Determines if the row number or the row number range should be displayed in a tool tip when the user scrolls through the data in the grid.

### `propagate scroll events`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When this property is false (which is the default) the grid handles any scroll wheel or swipe events sent to it so that they scroll the grid, but not the window that the grid is placed inside. If you enable this property, these events will be propagated, which allows mouse wheel and swipe events to scroll the grid's parent window.

### `sortable columns`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Enables column sorting. If set to true, the user will be able to click on the column headings to resort the data.

### `default sort order`

**Default:** `Descending`

**Choices:** `Ascending`, `Descending`, `Other...`

Specifies the default order for sortable columns. When the user clicks a column, the default sort order is used initially. To provide a different sort order for each grid column, select *Other...* and specify a comma separated list. Entries in the list can be abbreviated using the letter A for Ascending and D for Descending.

### `initial sort column`

**Default:** `blank` · **Format:** `number`

This property specifies the column used to for initial sorting. Each grid column is identified by a sequential index, starting with 0 for the first column, 1 for the second column, and so on. If this property and the "initial sort field" property are omitted or set to blanks, sorting is not initiated when the grid is first rendered.
The value may be a comma-separated list of column numbers, with the first entry being the primary sort, 2nd the 2nd, etc.

### `initial sort field`

**Default:** `blank` · **Bind data types:** `char`, `varchar`

This property specifies the field name used to identify the column for initial sorting. If this property and the "initial sort column" property are omitted or set to blanks, sorting is not initiated when the grid is first rendered.
The value may be a comma-separated list of field names, with the first entry being the primary sort, 2nd the 2nd, etc.

### `column sort response`

**Default:** `bind` · **Format:** `number` · **Bind data types:** `zoned`, `char` · **Read-only field name:** yes

Specifies a response variable to receive a column number for server-side sorting. If omitted, client-side sorting is used. The response is a numeric value that represents a column in the grid. Each grid column is identified by a sequential index, starting with 0 for the first column, 1 for the second column, and so on. It is the responsibility of the program to keep track of the sort direction, and to display an up or down arrow in the appropriate column using the "initial sort column" and "default sort order" properties.

### `field name sort response`

**Default:** `bind` · **Bind data types:** `char`, `varchar` · **Read-only field name:** yes

Specifies a response variable to receive a field name used for server-side sorting. If omitted, client-side sorting is used. The response represents the name of the field bound to the first widget in a column of the grid. It is the responsibility of the program to keep track of the sort direction, and to display an up or down arrow in the appropriate column using the "initial sort field" and "default sort order" properties.

### `return sort order`

**Default:** `bind` · **Bind data types:** `char` · **Read-only field name:** yes

Specifies a response variable to receive the selected sort order when the user clicks on one of the sort options in the grid's built-in header context menu. The response variable will be populated with 'A' for ascending, or 'D' for descending. This property is ignored if the grid does not allow column sorting, or if client-side sorting is used.

### `sort function`

**Type:** `js` · **Default:** `blank`

Specifies a custom sort function that will be called. If not specified the grid will sort using built in sorting. The following variables are passed:
**value1** first field value to compare 
**value2** second field value to compare 
**fieldName** name fo the field 
**isDescending** true if sorting in descending sequence, false otherwise 
**fieldDateFormat** date format of the field, if the field is not a date field the value is null 
**fieldInfo** formatting information of the field that the grid is sorted by; if the field does not contain any formatting information, a blank object will be passed instead

### `resizable columns`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows the user to resize grid columns at run time.

### `movable columns`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows the user to rearrange grid columns at run time.

### `persist state`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `session only`, `program only`

Specifies whether the grid state should be saved when the user sorts, moves, or resizes columns. When set to true, the state is saved to browser local storage with each user action, and automatically restored the next time the grid is displayed. When set to session only the state is saved to session storage, so the state exists only within the current tab, until it is closed. When set to program only, the grid's state is cleared whenever a program is called for the first time; however, the state is retained through multiple renders while the program is active.

### `find option`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Presents an option to search grid data when the grid heading is right-clicked.

### `filter option`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Presents an option to filter grid data when the grid heading is right-clicked.

### `hide columns option`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Presents an option to hide and show columns for this grid when the grid heading is right-clicked. Defaults to false.

### `row clicked`

**Default:** `bind` · **Format:** `number` · **Read-only field name:** yes

Specifies row value clicked in a grid.

### `column clicked`

**Default:** `bind` · **Format:** `number` · **Read-only field name:** yes

Specifies column value clicked in a grid.

### `reset option`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Presents an option to reset the persistent state for this grid when the grid heading is right-clicked.

### `export option`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Presents options to export grid data to Excel using the CSV and XLSX formats when the grid heading is right-clicked.

### `export only visible columns`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

When the 'hide columns option' is set to true, this option determines whether to export only the visible columns or all of the columns. Defaults to false.

### `context menu id`

**Default:** `blank` · **Bind data types:** `char`, `varchar`

Specifies the id of a Menu widget used to display a context menu when the user right-clicks a grid row.

### `filter response`

**Default:** `bind` · **Bind data types:** `char`

Specifies a response data structure to be received by your program for server-side filtering. Use only for page-at-a-time grids, not for database-driven grids nor load-all grids. 
See [Filter Response Documentation](https://docs.profoundlogic.com/x/AIF-Ag)
The data structure should be defined as follows:Dcl-Ds filterinfo qualified;
colnum zoned(3:0) dim(c);
fltrtext char(s) dim(c);
End-Ds;Where **c** is the value of the 'filter response column max' property, and **s** is the value of 'filter response text max'. The length should be c(3 + s); e.g. default length of 20 char with 3 column max filters is 69.

### `filter response text max`

**Default:** `20` · **Format:** `number` · **Bind data types:** `zoned`

The maximum number of characters to use from a filter expression when server-side filtering is setup by the 'filter response' property. The length of the 'fltrtext' array field in the filter response data structure should be this property's value.

### `filter response column max`

**Default:** `3` · **Format:** `number` · **Bind data types:** `zoned`

This is the maximum number of columns filtered at once when server-side filtering is setup by the 'filter response' property. This must be between 1 and than the 'number of columns' value, inclusive. Determines the size of the 'filter response' data structure.

### `show quick filters`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Above each column show a text-box for filtering row data. Enabling this causes a header row to display with the grid. To hide column headings and show quick filters, set "column headings" blank.

## Paging Bar

### `show paging controls`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Displays links for navigating to the previous page and the next page of records.

### `show page number`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines whether the page number should display within the paging bar.

### `initial page number`

**Default:** `1` · **Format:** `number` · **Bind data types:** `zoned`

Specifies the initial page number to use when the page number is displayed within the paging bar. If not specified, page number 1 is used.

### `show record number range`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

This property determines whether the record number range should display within the paging bar.

### `show bar`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Displays a bar at the bottom of the grid even if no paging bar elements are selected to be displayed. This can be used to show miscellaneous information such as column totals.

### `page down condition`

**Type:** `boolean` · **Default:** `bind` · **Format:** `true / false` · **Bind data types:** `indicator`, `expression` · **Read-only field name:** yes

Determines if the next page link is enabled.

### `page down response`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a boolean response indicator that is returned to your program when the next page link is clicked.

### `page up condition`

**Type:** `boolean` · **Default:** `bind` · **Format:** `true / false` · **Bind data types:** `indicator`, `expression` · **Read-only field name:** yes

Determines if the previous page link is enabled.

### `page up response`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `indicator` · **Read-only field name:** yes

Specifies a boolean response indicator that is returned to your program when the previous page link is clicked.

### `csv export`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Displays a link allowing the user to export grid data to Excel using the CSV format.

### `xlsx export`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Displays a link allowing the user to export grid data to Excel using the XLSX format.

### `xlsx export pics`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Include pictures in the XLSX Export. This option only works for Load-All subfiles.

### `export file name`

**Default:** `blank`

Defines the name of the download file used to export grid data to CSV or XLSX formats. The .xlsx or .csv extension is automatically appended to the name. If omitted, the grid name is used.

### `export with headings`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Specifies whether subfile headings should be exported as the first row of the CSV file.

## Row Folding

### `fold multiple`

**Default:** `blank` · **Bindable:** no

**Choices:** `2`, `3`, `4`, `Other...`

The property determines the height of a collapsed row, which is calculated at by taking the row height property and dividing it by the fold multiple. The multiple represents the number of collapsed rows that can fit into one expanded row.

### `expanded`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Determines if the rows are first displayed in expanded (also known as folded) mode. This property is similar to the SFLFOLD keyword.

### `collapsed`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Determines if the rows are first displayed in collapsed (also known as truncated) mode. This property is similar to the SFLDROP keyword.

### `return mode`

**Default:** `bind` · **Format:** `1 / 0` · **Bind data types:** `char`, `indicator` · **Read-only field name:** yes

This property can be bound to a field that will provide an indication of whether the grid rows were in expanded (also known as folded) mode or in collapsed (also known as truncated) mode on input. It represents the SFLMODE keyword. The bound field will contain a value of 0 if the grid rows are in expanded mode and a value of 1 if the grid rows are in collapsed mode.

### `single row zoom`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Determines if a zoom icon is shown on collapsed rows. Once the user clicks the icon, the row is expanded. All other rows remain collapsed.

### `tree level field`

**Default:** `blank` · **Bind data types:** `zoned`

This property must be bound to a numeric field which contains the tree level of each grid record. Each higher level record that has lower level records below it would be collapsible.

### `tree level column`

**Default:** `blank` · **Format:** `number` · **Bind data types:** `zoned`

This property specifies the column used to expand and collapse the tree levels, if property "tree level field" is specified. The default is column 0. Each grid column is identified by a sequential index, starting with 0 for the first column, 1 for the second column, and so on. Note that if this property is specified, then property "tree level field" must also be specified.

### `tree level collapsed`

**Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Determines if the rows in a grid tree are first displayed in collapsed mode.

## Grid Data

### `database fields`

**Type:** `field` · **Default:** `blank`

A set of database field names to use to retrieve the data for a database-driven grid. The field names should be comma separated.

### `allow any select statement`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows any valid SELECT SQL statement.
If this is **false** (default), a row count is retrieved by running SELECT COUNT(*) FROM (***your-custom-sql-property***), so your "custom sql" property must work with that syntax. This prevents the use of common table expressions, the optimize clause, and a few other things.

If set to **true**, the row count will be determined by running your statment as-is and looping through all rows to count them.

**Note:** False performs better, but true allows a wider variety of SQL statements.

### `load fields into widgets`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows fields from database-driven grids to be bound to widgets instead of loaded directly onto the grid

### `load all rows`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Can only be used when "load fields into widgets" property is true. Loads all data at once, instead of page-by-page.

### `data url`

**Type:** `long` · **Default:** `blank`

Sets the url to a Web service that returns JSON data for a database-driven grid.

### `data transform function`

**Type:** `long` · **Default:** `blank`

The name of a JavaScript function to be called to process the results of the "data url" program. This can be used to transform data from the program into the format expected by the grid widget.

## Grid Data from Screen

### `starting row`

**Default:** `blank`

Specifies the starting subfile row for retrieving data from the screen.

### `ending row`

**Default:** `blank`

Specifies the ending subfile row for retrieving data from the screen.

### `data columns`

**Type:** `list` · **Default:** `blank`

Specifies a comma separated list of column numbers for retrieving data from the screen.

## Translations

### `grid row translation placeholders`

**Type:** `translationplaceholders` · **Default:** `bind` · **Bindable:** no · **Read-only field name:** yes

Define replacement values for the placeholders in translations.

### `grid row translation placeholder key`

**Bindable:** no · **Multi-occurrence:** yes

### `grid row translation placeholder value`

**Multi-occurrence:** yes

## Position

### `expand to layout`

**Default:** `false` · **Bindable:** no

**Choices:** `true`, `false`

If set to true, the grid will automatically expand to the full size of a layout container.

## Borders

### `border width`

**Default:** `css` · **Format:** `px`

**Choices:** `0px`, `1px`, `2px`, `3px`, `4px`, `5px`, `Other...`

The thickness of the grid's outer borders and inner separators.

