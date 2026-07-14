# Styling: CSS, Themes, and Inline Styles

This reference covers visual styling for Rich Display Files: CSS classes on widgets, the Theme system that controls DDS-to-RDF conversion defaults, best practices for building a maintainable Theme, external stylesheet linkage, and inline style overrides. The Profound UI runtime resolves widget appearance in this precedence order (low to high): theme defaults → external CSS rules → widget `css class` property → widget `inline style` property → properties exposed directly on the widget (width, height, position). Themes drive bulk DDS-to-RDF conversion and contain dozens of properties; the pages below give the full Theme property reference, Theme authoring best practices, and the per-widget styling properties available in the Visual Designer.

## CSS Class

*Source: Confluence page 1596853160*

### Description
Defines a custom Cascading Style Sheet (CSS) class to assign to the element. To specify multiple classes, right-click the property and select **Add Another CSS Class**.

To define the class in a style sheet, add a file to the custom CSS folder in your Profound UI installation.

#### Example
Assuming the name of your instance is PROFOUNDUI, you could place the file in the following directory: ***/www/PROFOUNDUI/htdocs/profoundui/userdata/custom/css***.

### Additional Details
- **Promptable?** NO

- **Possible Values:** Any valid CSS class.

- **Bindable?** YES

- **Product:** Profound UI, Genie

---

## Themes

*Source: Confluence page 1596559024*

### Description
A Theme is a collection of DDS conversion rules. The theme is selected by its name from a dropdown list, on the DDS Conversion Dialog:

While Profound UI is shipped with several prebuilt themes, it is often necessary to create a custom theme, in order to modify the rules used by the conversion process.

Theme definitions are stored in the following IFS directory: `/www/profoundui/htdocs/profoundui/userdata/custom/themes`. Each theme is defined in its own `.js` file, containing a list of properties in JSON (JavaScript Object Notation) format. To create a custom theme, copy an existing theme file to a new file name, and then modify the JSON properties inside the file. Make sure to modify the "**name**" property to reflect the new theme name.

### Properties
The following properties are available:

- **name** - The name of the theme. This should generally be the same as the file name in which the theme is defined.

- **input css class** - The class applied to input elements (DDS field types "**B**" and "**I**") created by the DDS conversion.

- **alt input css class** - *Optional* CSS class width, for 132 wide screens.

- **input css class 2** - The second class applied to input elements (DDS field types "**B**" and "**I**") created by the DDS conversion.

- **constant css class** - The class applied to elements created from DDS constants.

- **altconstantcss class** - *Optional* CSS class width, for 132 wide screens.

- **output field css class** - The class applied to output fields (DDS field type "**O**"), and also to fields with **DATE**, **TIME**, **USER**, and **SYSTEM** keywords.

- **alt output field css class** - *Optional* CSS class width, for 132 wide screens.

- **always set width** - By default, output fields are not given a width so that the browser will automatically resize them to the size of the content within them. If you set this option to *true*, a fixed width will be set on output fields during DDS conversion.

- **css class prefix** - The DDS conversion automatically maps DDS display attributes, and colors, to CSS classes with equivalent names (e.g., "HI" for High Intensity, or "BLU" for Blue). This property allows you to prepend a prefix to each of the generated class names.

- **top line color** - *Optional* property that specifies a color to assign to all header elements, or elements that appear on row 1 of a screen.

- **top line css class** - *Optional* property that specifies a CSS class to assign to all header elements, or elements that appear on row 1 of a screen.

- **default font family** - *Optional* font family to use on elements during the conversion. If not specified, the font family is picked up from the CSS.

- **default font size** - *Optional* font size to use on elements during the conversion. If not specified, the font size is picked up from the CSS.

- **default locale** - Sets the locale for date, time, or timestamp fields. Also used in Edit Code processing to assign appropriate formatting on field binding.

- **left offset** - Offset from the left side of the screen in pixels for all converted elements. This allows you to create an area for a left sidebar with function key buttons.

- **alt left offset** - *Optional* left offset width, for 132 wide screens.

- **top offset** - Offset from the top side of the screen in pixels for all converted elements.

- **column width** - Determines how wide the space equivalent to a green-screen column should be in pixels.

- **alt column width** - *Optional* column width, for 132 wide screens.

- **row height** - Determines how tall the space equivalent to a green-screen row should be in pixels.

- **alt row height** - *Optional* row height, for 132 wide screens.

- **extra textbox width** - The width of textboxes, generated by the conversion process, is determined by multiplying the "**column width**" property by the character width of the green-screen field. This property allows you to add a few extra pixels to the textbox width. 

- **auto arrange** - Specified the "**auto arrange**" property of a function key button. The default is *true*.

- **button type** - The type of button to use for function key buttons, and for GUI DDS elements, such as those created from the **PSHBTNFLD** keyword. Valid values are "**button**", "**graphic button**", "**styled button**", "**css button**", or "**hyperlink**".

- **button style** - If a styled button is used for the "**button type**" property, this specifies the button style to use. 

- **button theme** - If a CSS button is used, this specifies the button theme to use.

- **button straight edge** - If a CSS button is used, this specifies a value for the "**straight edge**" property.

- **button width** - The standard width of a function key button.

- **button height** - The standard height of a function key button.

- **button css class** - *Optional* CSS class of a function key button.

- **button tab index** - *Optional* tab index of a function key button.

- **button left offset** - *Optional* left offset, in pixels, for function key buttons.

- **alt button left offset** - *Optional* left offset, in pixels, for function key buttons, when the screen is a 132x27 screen.

- **button top** - *Optional* top position, in pixels, of the first generated function key button.

- **horizontal button spacing** - The horizontal space between each button, when buttons are arranged horizontally.

- **vertical button spacing** - The vertical space between each button, when buttons are arranged vertically, or when buttons wrap from one row to the next.

- **buttons per row** - Number of buttons to arrange horizontally before a new row of buttons is created.

- **add submit button** - Boolean (*true* or *false*) value indicating whether a **Submit** button should be added to the screen. Clicking the **Submit** button is similar to hitting the **Enter** key.

- **help button** - Boolean (*true* or *false*) value indicating whether the a **Help** button should be added to the screen, and associated with the **DDS HELP** keywords. The default is *true*.

- **submit button text** - *Optional* value to override the text that will appear on the **Submit** button. If not specified, the word "Submit" will be used.

- **buttons start at the top** - Determines if buttons are placed at the top of a screen going down, or if they begin at the bottom of a screen.

- **show fkey name** - Determines if the name of the function key (i.e. F1, F2, F3, etc.) shows on the button, or hyperlink.

- **show fkey name as tool tip** - Determines if the name of the function key (i.e. F1, F2, F3, etc.) should appear as a tool tip when the user hovers over the button, or hyperlink.

- **show fkey text** - Determines if the function key text shows on the button. The text is retrieved from the keyword that defined the function key, or a constant function key label that appears in the converted Display File.

- **page down text** - Default text for the **Page Down** button.

- **page up text** - Default text for the **Page Up** button.

- **remove option labels** - Boolean (*true* or *false*) value indicating whether to automatically remove option labels, such as **2=Change** or **5=Display**.

- **remove fkey labels** - Boolean (*true* or *false*) value indicating whether to automatically remove function key labels, such as **F3=Exit** or **F5=Refresh**.

- **use aliases** - Boolean (*true* or *false*) value. If *true*: If an ALIAS keyword is found, LONGNAMEALIASES will be enabled, and the parameter of the alias keyword will be used as the field name. Defaults to *true*.

- **use fkey labels** - Boolean (*true* or *false*) value indicating whether constant function key labels (e.g., **F3=Exit** or **F5=Refresh**) are used to determine the text to display on the buttons, or hyperlinks, created for function keys. Defaults to *true*.

- **use fkey label indicators** - Boolean (*true* or *false*) value indicating whether conditioning indicators on labels (e.g., **F3=Exit** or **F5=Refresh**) should be applied to the buttons, or hyperlinks, created for function keys. Defaults to *false*. 

- **fkey suffix char** - *Optional* character to consider when looking for function key labels. For example, if "x" is specified, F3x=Exit is a valid function key label.

- **allow field exit** - Determines if the field exit key should be allowed on input elements generated by the conversion. This can later be changed by modifying the "**allow field exit**" property on the widget.

- **onload** - *Optional* *onload* event, specified as a string, that will be applied to every converted screen.

- **process field** - *Optional* JavaScript function that allows you to add custom processing to the fields in the conversion. The function will receive four parameters:

  - **field** - Field object with the following properties:

    - **name** - Name of the field.

    - **formatName** - The name of the DDS record format to which the field belongs.

    - **memberName** - The name of the DDS source member being converted.

    - **const** - Constant text, if the field is a constant.

    - **field type** - DDS field type, such as "B" for both, "I" of input, "H" for hidden, or "O" for output.

    - **data type** - DDS data type.

    - **length** - Field length.

    - **decimal** - Decimal position, if the field is numeric.

    - **row** - Original DDS row position of the field.

    - **col** - Original DDS column position of the field.

    - **keywords** - Array of DDS keywords, each array entry having the following properties:

      - **name** - Keyword name.

      - **parms** - Array of keyword parameters.

      - **line** - Original DDS line number.

  - **item** - Item object being created by the conversion. The properties of the item are identical to those found in the Visual Designer. Your JavaScript code can set the properties on the item, as desired.

  - **subfile flag** - Boolean (*true* or *false*) value indicating whether the field belongs to a subfile.

  - **window flag** - Boolean (*true* or *false*) value indicating whether the field belongs to a window.

- **process fkey** - *Optional* JavaScript function that allows you to add custom processing for function key buttons, or links, created by the conversion. The function will receive four parameters:

  - **keyword** - Object representing the DDS keyword for the function. The object will contain the following properties:

    - **name** - Keyword name.

    - **parms** - Array of keyword parameters.

  - **item** - Item object for the link, or button, being created by the conversion. The properties of the item are identical to those found in the Visual Designer. Your JavaScript code can set the properties on the item, as desired.

  - **format** - Object representing the Rich Display record format being created. It will contain the following properties:

    - **screen** - Screen-level properties, such as "**record format name**", assigned by the conversion. The screen-level properties are identical to those found in the Visual Designer.

    - **items** - Array of all item objects created by the conversion. The properties of the items are identical to those found in the Visual Designer.

  - **member** - The DDS source member name that is being converted.

- **fkey sort** - *Optional* custom JavaScript function allowing you to specify the sort order of function keys. If not specified, the sort order is by key name (i.e., F1, then F2, then F3, etc.). The custom function will be called repeatedly, and will receive two Fkey keyword parameters to compare. It must return “-1” if the first keyword should come before the second keyword, or “1” if the first keyword should come after the second keyword. Each keyword will have the following properties:

  - **name** - Keyword name.

  - **parms** - Array of keyword parameters.

  - **line** - Original DDS line number.

- **add enhancements** - *Optional* JavaScript function that allows you to add custom enhancements to the screen after each format is converted. The function receives the following parameters:

  - **format** - Representation of the new Rich Display record format. Contains the following properties:

    - **screen** - Screen level name/value pairs for record format properties. The properties are identical to those found in the Visual Designer. Your JavaScript code can modify, or set new properties as, desired.

    - **items** - Array of items created by the conversion. Each item contains a list of properties that are identical to those found in the Visual Designer. Your JavaScript code can set the properties on the items, as desired, or add new items to the array.

  - **subfile flag** - Boolean (*true* or *false*) value indicating whether the record format is a subfile.

  - **window flag** - Boolean (*true* or *false*) value indicating whether the record format is a window.

  - **member** - The DDS source member name that is being converted.

  - **formatDDS** - A representation of the DDS keywords, and fields, in the format. Contains the following properties:

    - **keywords** - An array of format level keywords. Each keywords will contain the following properties:

      - **name** - Keyword name.

      - **parms** - Array of keyword parameters.

      - **line** - Original DDS line number.

    - **fields** - An array of fields in the format. Each field will contain the following properties:

      - **name** - Name of the field.

      - **formatName** - The name of the DDS record format to which the field belongs.

      - **memberName** - The name of the DDS source member being converted.

      - **const** - Constant text, if the field is a constant.

      - **field type** - DDS field type, such as "B" for both, "I" of input, "H" for hidden, or "O" for output.

      - **data type** - DDS data type.

      - **length** - Field length.

      - **decimal** - Decimal position, if the field is numeric.

      - **row** - Original DDS row position of the field.

      - **col** - Original DDS column position of the field.

      - **keywords** - Array of DDS keywords. Each array entry will have the following properties:

        - **name** - Keyword name.

        - **parms** - Array of keyword parameters.

        - **line** - Original DDS line number.

- **grid enhancements** - *Optional* JavaScript function that allows you to perform custom subfile enhancements for each converted subfile. The function receives the following parameters:

  - **control record** - Representation of the new Rich Display control record format. Contains the following properties:

    - **screen** - Screen level name/value pairs for record format properties. The properties are identical to those found in the Visual Designer. Your JavaScript code can modify, or set new properties, as desired.

    - **items** - Array of items created by the conversion. Each item contains a list of properties that are identical to those found in the Visual Designer. Your JavaScript code can set the properties on the items, as desired, or add new items to the array.

  - **grid item** - Name/value pairs for the grid item. The properties are identical to those found in the Visual Designer. Your JavaScript code can modify, or set new properties, as desired.

  - **options** - Array of subfile options, such as **2=Change** or **5=Display**, that have been found by the conversion process on the screen. Each option is an object consisting of the following properties:

    - **option** - Represents the option number, such as 2, or 5.

    - **text** - Represents the option text, such as "Change", or "Display".

  - **member** - The DDS source member name that is being converted.

- **last enhancements** - *Optional* JavaScript function that allows you to perform custom enhancements at the end of the conversion process. The function does not receive any parameter.

- **grid** - Object that determines how subfiles and grids are handled during the DDS conversion. The following options are available:

  - **properties** - List of miscellaneous properties that should be assigned to the Grid widget. The properties are identical to those found in the Visual Designer.

  - **top offset** - Offset, specified in pixels, to add to the top position of each element within the grid.

  - **left offset** - Offset, specified in pixels, to add to the left position of each element within the grid.

  - **extra width** - Extra width, specified in pixels, to add to the grid width that is automatically calculated, based on subfile columns.

  - **header rows** - This value determines the height of the grid header in the rows.

    - The value can be specified as the number of rows (e.g., 0, 1, or 2).

    - The value can also be set to "**auto**" to allow the DDS conversion to automatically determine the number of header rows, based on constant fields present in the control record format, or in the format returned by the function specified in the “**getHeaderFormat**” property.

    - The value can also be specified as a custom function that receives control record and the subfile record as two separate parameters, and returns the number of header rows.

  - **merge headings** - This *true* or *false* value determines if heading fields are merged into the grid component itself, using the grid's "**column headings**" property. Merging the headings may provide a nicer look, and may be easier to maintain. However, the positioning of the headings may not be accurate, at first.

  - **set heading font** - When set to *true*, the font properties, or the "**css class**" property on heading output fields, is set to match the standard grid headings. This is only done on heading output fields that were not merged, or could not be merged, into the grid heading.

  - **header field class** - The CSS class to use on heading fields.

  - **message subfile class** - The CSS class assigned to the grid, when the grid represents a message subfile.

  - **show options as dropdown** -  When set to *true*, the DDS conversion will look for option labels (e.g., 2=Change or 5=Display), and create a dropdown out of these options in the first column of the grid, instead of using the standard textbox option field.

  - **show options as combo** -  When set to *true*, the DDS conversion will look for option labels (e.g., 2=Change or 5=Display), and create a combo box out of these options in the first column of the grid, instead of using the standard textbox option field.

  - **show options as context menu** - When set to *true*, the DDS conversion will look for option labels (e.g., 2=Change or 5=Display), and create a context menu. You cannot have context menus and dropdowns, or combo boxes, as these options are mutually exclusive.

    - **context menu css class** - *Required*. This option assigns a CSS class to the created menu widget, and you will need to set up a CSS class to handle it. 

    - **context menu hover image** - *Optional* property used to populate the “**option hover image**” property of the menus.

    - **context menu option indent** - *Optional* property used to populate the “**menu option indent**” property of the menus.
  - **single row zoom** - If set to **true**, the DDS conversion will enable the single row zoom feature on folding subfiles. Single row zoom allows users to expand collapsed rows one at a time, using a zoom icon.

  - **sortable** - *Optional true* or *false* property. Enables the "**sortable columns**" feature on load-all subfiles. If omitted, *true* is assumed.

  - **find** - *Optional true* or *false* property. Enables the "**find option**" feature on load-all subfiles. If omitted, *true* is assumed.

  - **filter** - *Optional true* or *false* property. Enables the "**filter option**" feature on load-all subfiles. If omitted, *true* is assumed.

  - **expander icon** - *Optional true* or *false* value that determines if an expander icon should be added, for grids with fold/unfold capabilities. If omitted, *true* is assumed.

  - **expander z index** - Expander icon z index value that is created for folding subfiles.

  - **fold button** - *Optional true* or *false* value that determines whether a standard function key button, or hyperlink, should be added for folding and unfolding grid data. If omitted, *false* is assumed.

  - **csv export** - *Optional true* or *false* property. Enables the "**csv export**" feature on load-all subfiles. If omitted, *false* is assumed.

  - **xlsx export** - *Optional true* or *false* property. Enables the "**xlsx export**" feature on subfiles. If omitted, *false* is assumed.

  - **export with headings** - *Optional true* or *false* property used together with "**csv export**" or "**xlsx export**". Sets the "**export with headings**" property on load-all subfiles. If omitted, *false* is assumed.

  - **getHeaderFormat** - *Optional* function that receives a subfile control record format name, and returns the name of another record format that contains the headings for the subfile. Intended for DDS code that stores subfile headings outside of the control record. Ideally, there would be a predictable naming convention for such record formats.

- **subfile option pattern** - Use a regular expression to match subfile options, instead of the default mode, which looks for patterns like "someNum=some text".

  - Example: /(\[A-Z0-9\]{1,2}) ?(=) ?(\S+ \*)/

- **subfile option pattern greedy** - Set to *false* to prevent "**subfile option pattern**" from capturing text between matches. By default, the "**subfile option pattern**" algorithm looks for text between each match on a field, and up to the end of a field. Any found are added to the option text.

  - For example, a field including the text, "**9=Work with Print Status**", would only get the text "**Work**" if "**subfile option pattern greedy**" is *false*, and the option text would get the entire "**Work with Print Status**" if this option is omitted, or not *false*.

- **items** - Array of widgets (e.g., background panels) to add to each screen. Each widget is an object of Visual Designer properties. You should at least specify the "**id**", "**field type**", "**left**", "**top**", "**height**", and "**width**" property. Special properties, "**alt_width**" and "**alt_height**", can specify the height and width for elements to be created, on a screen that was originally a 132x27 character screen.

- **windows** - Object that determines how windows are handled during the DDS conversion. The following options are available:   

  - **css class** - Sets the "**css class**" property on the generated panel widget.

  - **panel type** - Green-screen windows are converted to formats that utilize a panel, or a dialog. This option specifies the "**field type**" of the panel widget.

    - At this time, only "**css panel**" and "**panel**" are valid values for this option. If the option is omitted, the panel type defaults to "**panel**".

    - **Note**: If a panel type is required that is not supported here, the type can be set to "**panel**", and then, in the add enhancements function, the panel will appear in the *format.items* array, and the properties can be changed, as required.

  - **panel style** - Specifies the panel style for the dialog, or panel, when the panel type is "**panel**".

  - **header theme** - *Optional* header theme of a "**css panel**" dialog. If not specified, the default theme of "**B - Blue**" is used.

  - **body theme** - *Optional* body theme of a "**css panel**" dialog. If not specified, the default theme of "**C - Gray**" is used.

  - **has header** - *Optional* "has header" property of a "**css panel**". Valid values are *true* or *false*. If omitted, the “**css panel**” will, by default, have a header.

  - **header height** - *Optional* value to specify the height of a "**css panel**" header. If omitted, a default header height is used.

  - **straight edge** - *Optionally* specifies which part of the"**css panel**" will have a straight edge, instead of rounded corners. Valid values are as follows: "**all**", "**left**", "**right**", "**top**", or "**bottom**".

  - **title text align** - The default text alignment for the dialog title.

  - **top offset** - Offset from the top side of the screen, in pixels, for all converted elements within the window.

  - **bottom offset** - Additional height, in pixels, to add to the created window dialog.

  - **left offset** - Offset from the left side of the screen, in pixels, for all converted elements within the window.

  - **right offset** - Additional width, in pixels, to add to the created window dialog.

  - **add submit button** - *Optional true* or *false* value indicating whether a **Submit** button should be added to the screen. Clicking the **Submit** button is similar to hitting the **Enter** key. If omitted, the value is inherited from the top level "**add submit button**" property.

  - **button type** - *Optional*. The type of button to use for function key buttons, and for GUI DDS elements, such as those created from the **PSHBTNFLD** keyword. Valid values are as follows: "**button**", "**graphic button**", "**styled button**", or "**hyperlink**". If omitted, the value is inherited from the top level "**button type**" property.

  - **button css class** - *Optional* CSS class of a function key button within the window. If omitted, the value is inherited from the top level "**button css class**" property.

  - **button tab index** - *Optional* tab index of a function key button within the window. If omitted, the value is inherited from the top level "**button tab index**" property.

  - **button left offset** - *Optional* left offset, in pixels, for function key buttons within the window.

  - **alt button left offset** - *Optional* left offset, in pixels, for function key buttons within the window, when the screen is a 132x27 screen. 

  - **button offset** - Top position offset from the bottom of the window, in pixels, for function key buttons created within the window.

  - **button width** - The standard width of a function key button in the window.

  - **horizontal button spacing** - The horizontal space between each button within the window.

  - **vertical button spacing** - The vertical space between buttons, when buttons have to wrap to the next row within the window.

  - **buttons per row** - Number of buttons to arrange horizontally, before a new row of buttons is created within the window. Can be specified as "**auto**", in which case, the value is automatically determined, based on the width of the window.

  - **items** - Array of widgets to add to each window. Each widget is an object of Visual Designer properties. You should, at least, specify the following properties: "**id**", "**field type**", "**left**", "**top**", "**height**", and "**width**".

The order in which the optional JavaScript functions are called, is as follows:

- For each record format, **process field** is called for each field, followed by** add enhancements**.

- Then, **process fkey **is called for each function key on all record formats, including **btnSubmit**, if added.

- Next, **grid enhancements** is called.

- Finally, **last enhancements** is called.

---

## Theme Best Practices

*Source: Confluence page 1596559070*

### Description
Before undertaking a project to convert numerous green screen DDS members to Rich Display Files, some effort should be made to create a custom conversion theme. The **How to Guide** gives an overview of Theme creation, but there are some best practices that should be followed in order to make the Rich display files as extensible as possible, allowing for possible future style changes. This becomes especially important when you plan to convert a large number of display files.

- To give you an idea, when Profound Logic Software is contracted to perform a mass conversion service, consisting of hundreds or thousands of display files, we allow a number of weeks to create a custom conversion theme *before* any serious conversion run is attempted.

### If you are planning to use Genie with converted Screens
It is often the case that an ERP system will contain 5250 programs that cannot be converted. These could be:

- Non-display file menu panels.

- CL, or COBOL, programs with display files.

- Programs which have no source code.

- Interactive OS commands (i.e. **WRKSPLF**, **WRKMSG**).

To solve this problem, converted Rich Display Files program can be run within Genie. Genie is able to use web-facing to render any 5250 content, but when a Rich Display File program is called, Genie will render the native GUI. 

When creating a conversion theme for this situation, some thought should be given to make sure there is a cohesive look and feel between the Genie skin and the Rich Display Files. You may consider using the Genie **Hybrid skin**, and the **Hybrid** **conversion theme**, as a starting point. These already have the same look and feel, and the Hybrid skin moves all the function key labels to the left of the screen, so they appear similar to a Rich Display File.

Details regarding customizing a Genie skin can be found [here](https://profoundlogicsupport.atlassian.net/wiki/spaces/PUI/pages/1512180462/Skins).
### Use Custom Widgets
Apart from the usual input and output fields, the conversion theme adds a number of different widgets to the converted display file. These could include:

- The **Grid** widget for a subfile.

- **Button** or **Link** widgets for function keys.

- **Panel** widgets.

- The **Dialog** widget for popup window.

Some shipped widgets are constructed using images for background gradient color, or rounded corners, and these images are replaced with every product update. For this reason, you should ***never*** modify a shipped widget. Instead, you should create a **custom widget**.

Even if you find a shipped widget that suits your purpose, we recommend that you create a custom widget so that, down the track, you are able to re-theme your application with different colors simply, by changing these images and the style sheets, without the need to alter, or re-compile, any display files. If you are planning to convert a large number of display files, this becomes even more important.

See **Custom Widget Development** for details.
### Use CSS Classes
Where possible, use CSS classes to define styling of the widgets in your converted display files. If you follow the recommendation above and create custom widgets, you are also able to define a CSS class for each widget type.

There are also a number of properties that control **CSS classes in the theme** itself. These properties are:

- **input css class -** The class applied to input elements (DDS field types "B" and "I") created by the DDS conversion.

- **input css class 2 -** The second class applied to input elements (DDS field types "B" and "I") created by the DDS conversion.

- **constant css class -** The class applied to elements created from DDS constants.

- **output field css class -** The class applied to output fields (DDS field type "O"), and also to fields with DATE, TIME, USER, and SYSTEM keywords.

- **css class prefix -** The DDS conversion automatically maps DDS display attributes, and colors, to CSS classes with equivalent names (e.g., "HI" for High Intensity, or "BLU" for Blue). This property allows you to prepend a prefix to each of the generated class names.

These classes should  be used as much as possible. For example, if you decide to use a dark blue font color throughout your application, specify class names (e.g., **input**, **constant**, and **output**), and then specify the dark blue font in a style sheet, under those classes. This is a better approach than hard coding dark blue in each converted display file. If you later want to change the color scheme of your application, this would be a simple task, if you used class names. If the display files have hard-coded colors, a re-style could be a major undertaking.

### Screen Width
When converting display files, consider the width and height of the converted screen. The width should be set so the user with the lowest supported screen resolution can see the full width of the screen, without the need to scroll sideways. Users with a higher resolution screen would typically have the screen centered with blank sections on the left and right side of the page. Two properties, “**top offset**” and “**left offset**”, are used to define how far down from the top, and in from the left, of the screen the widgets will be placed during conversion.

Of more importance are two other properties, “**column width**” and “**row height**”. These define the number of pixels that will be used to space the row and column of the converted display file. These will have significant effects on the width and height of the screen, and should be used in conjunction with the choice of font family, and font size.

More information can be found **here**.
### Choosing a font
The font used for converted display files is an important choice. In many cases, a mono-space (sometimes called “fixed pitch”) font needs to be used. This is a font where each character has the same width, and is used on all 5250 screens. Often, a green screen display file has been built so that certain data will line up in columns. If a proportional font is used, these columns will no longer line up.

See the following for a visual example of the difference:

```
Monospace font - All characters have the same width. For example "WWWiii"
```
- Proportional font - Each character can have a different width. For example " WWWiii".

**Note:** The choice of font needs to be used in conjunction with the “**column width**” and “**row height**” properties, as explained in the **Screen Width** section above, and should be defined in the style sheets.

---

## External CSS

*Source: Confluence page 1596560259*

### Description
Identifies the **location** of an external Cascading Style Sheet file to apply to this screen. Either type the path, or click the option button ( ) to open a file navigator.

To specify multiple files, right-click the property, and select "**Add Another External CSS**".

### Additional Details
**Promptable?** YES
**Possible Values:** Any accessible path and CSS file name.
**Bindable?** YES

---

## Inline Style

*Source: Confluence page 1596853364*

### Description
This property lets you define CSS properties that will be applied to the widget. These properties are applied inline and therefore take precedence over those defined in a CSS class. Multiple properties may be provided separated by a semi-colon. You can learn more about CSS properties at the following link: [http://www.w3schools.com/cssref/](http://www.w3schools.com/cssref/). If you define CSS properties that are defined by other widget properties, the widget properties overrule the CSS inline properties.

The following CSS properties are ignored when put in "**inline style**" and should be set using the widget properties:

- “position”

- “visibility”

- “display”

- “left”

- “right”

- “top”

- “bottom”

- “width”

- “height”
### Additional Details
- **Promptable?** No

- **Possible Values:** Valid CSS rules separated by semi-colons.

- **Bindable?** Yes (UI only)

- **Product:** Profound UI, Genie

### Example
This example shows how to apply a CSS style that cannot be set using the Profound UI widget properties: **background gradient**.

1.  Start the Visual Designer or enter Design Mode in Genie.

2.  Select a label or add a label to the canvas.

3.  Look for the "**inline style**" property under the **Misc** category:
4.  Set "**inline style**" to the following:

```css
background: linear-gradient(#1370A1, #56C0EA) #1370A1;
```
5.  You should see the label's background change from the default clear to a blue gradient:
