# Grids and Subfiles

Grids are the Rich Display File equivalent of DDS subfiles — and they are the most intricate authoring pattern in RDF. A Grid widget defines columns, header rows, and visible page size; data is loaded into it from RPG (record-at-a-time `WRITE` to the subfile record format), from RPG one page at a time, from the database directly (database-driven), or from a JSON web service (Data URL). The RPG-style subfile control indicators (`SFLCLR`, `SFLINZ`, `SFLDSP`, `SFLDSPCTL`, `SFLEND`, `SFLSIZ`, `SFLRCDNBR`, …) all have equivalent grid properties, each of which is bindable to an RPG indicator. The pages below cover the overview, a worked load-all subfile example, the full set of subfile-control properties (display subfile, display control record, clear subfile, subfile end, etc.), the grid configuration properties, and how each data-loading method works.

## Grids

*Source: Confluence page 1596858642*

### Description
The Grid widget allows your application to display multiple lines of data and is the web equivalent of a subfile. If you are using Profound UI, you can interact with this grid in your RPG just as you would a subfile, due to the RPG OA Handler. Grids can contain database data, data from your server-side program, and even other widgets. This flexibility gives you the ability to make your application as user-friendly as possible. Because of this flexibility, the Grid widget has *far* more properties than other widgets.

Note that some of these grid properties are only available for Rich Display Files and not for Genie/5250 screens. If you do not see a grid property available in the Properties panel of a grid, that means it is not available for the grid.
### Related Videos
### Child Page List
- **Methods for Loading Data into Grids**
- **Grid Identification Properties**
- **Subfile Settings**
- **Message Subfile Settings**
- **Header Properties**
- **Colors**
- **Grid Settings**
- **Paging Bar**
- **Row Folding**
- **Grid Data**

---

## Creating a Subfile

*Source: Confluence page 1596558283*

The example described on this page is also included in the Profound UI Samples Library (**PUISAMPLES**) that is automatically installed onto your system when you install Profound UI.

- **Display file source:** PUISAMPLES/QDDSSRC/**GRID001D**

- **RPGLE source:** PUISAMPLES/QRPGLESRC/**GRID001R**
### Description
Subfiles are lists of items that are created using Grid widgets in Profound UI. To create a simple subfile, follow these steps:

1.  **Create the Grid:**

    1.  Drag/drop a new subfile **Grid** widget on the canvas:
2.  **Create the columns:**

    1.  You can add or remove columns by using the plus () and minus () icons on the right-side of the grid:

3.  **Size the columns:**

    1.  You can resize columns by dragging the column’s vertical border from side to side:

4.  **Set the headings:**

    1.  Double-click into each column’s heading to modify the heading text and formatting:

    2.  Alternatively, if the subfile in your application does not need headings, set the “**has header**” property to *false*.
5.  **Add the subfile fields:**

    1.  To add fields to the subfile, drag/drop other widgets into the first row of the subfile, and then bind them to RPG fields. 

    2.  For example, to output the Product Id, drag/drop the dynamic **Output Field** widget into the first row of the “**Product Id**” column:

c\. The column will be highlighted, right before you drop the element. Once the element is dropped, it will repeat to all rows within the subfile:

6.  Now, bind the “**value**” property to the appropriate RPG field. This can be done by double-clicking the widget.

**Note:** In addition to output fields, most other widgets can also be added in a subfile, including action elements (e.g., buttons and hyperlinks), and input elements (e.g., checkboxes and dropdowns).
7.  **Set up number of visible rows:**

    1.  You can add or remove visible rows by selecting the plus () and minus () icons at the bottom of the grid:
7.  **Control alignment:**

    1.  Field alignment can be controlled through the widget’s “**text align**” property, which can be accessed in the Properties Window once the widget is selected, or by using the Formatting section of the Edit toolbar in the Ribbon. 

    2.  For output fields, you must ensure that the element has a predefined width. This can be accomplished by resizing the element horizontally, or setting the “**width**” property manually in the Properties Window.

8.  **Setting the clear subfile indicator:**

    1.  The Grid component contains a number of properties, that allow you to control it through server-side RPG coding. 

    2.  One critical property is “**clear subfile**”, the equivalent of the **CLRSFL** keyword from traditional green-screen programming. It is conventional to clear the subfile before loading it with data. 

        1.  To accomplish this, bind the “**clear subfile**” property to an indicator field. 

        2.  Then, in your RPG code, set the indicator, and write the subfile control record to clear the subfile.

9.  **Setting record format names:**

    1.  Before utilizing the Grid in your RPG code, you must set record format names for the subfile, and for the screen that contains the subfile, which is referred to as the subfile control record.

        1.  To set the subfile record format, select the grid, and modify its “**record format name**” property.

        2.  To set the subfile control record format, click the canvas to select screen properties, and then set the “**record format name**” property.

        3.  These changes will be reflected in the Record Format List in the top right area of the Visual Designer.

10. **Writing the RPG code:**

    1.  The RPG code to load the subfile with data may look similar to the following:

        ```rpgle
                //     Program: GRID001R
                //        Type: RPGLE
                // Description: Simple Subfile Example.
                //
                // Copyright (c) Profound Logic Software, Inc.  All rights reserved.
             H DFTACTGRP(*NO)
             FGRID001D  CF   E             WORKSTN SFILE(GRIDSFL1: RRN)
             F                                     HANDLER('PROFOUNDUI(HANDLER)')
             FPRODUCTSP IF   E           K DISK
             D RRN             S              5S 0
              /Free
                 Dou btnExit = *On;
                   SetLL *LoVal PRODUCTS;
                   Read PRODUCTS;
                   Dow NOT %EOF;
                     RRN +=1;
                     If PSPEC <> 'Y' AND PSPEC <> 'y';
                       PSPEC = '';
                     EndIf;
                     Write GRIDSFL1;
                     Read PRODUCTS;
                   EndDo;
                   ExFmt GRIDCTL1;
                 EndDo;
                  *InLr = *On;
              /End-Free
        ```
    2.  Equivalent PHP code would look as follows:

    3.

        ```php
        <?php
        // initialize view
        $view = '/profoundui/userdata/dspf/prodinqd.json';

        // read product records
        $options = array('i5_lib' => 'PUISAMPLES', 'i5_naming' => DB2_I5_NAMING_ON);
        $conn = db2_connect('', '', '', $options);
        $query = "SELECT * FROM PRODUCTSP";
        $stmt = db2_prepare($conn, $query);
        $grid = array();
        if (db2_execute($stmt)) {
          while($row = db2_fetch_assoc($stmt)) {
            // the following statement populates the grid
            array_push($grid, array('PRODID' => $row['PRID'], 'PRODNAME' => $row['PNAME']));
            // Note: if grid fields were named identically to database fields, then a simpe statement like this can be used:
            // array_push($grid, $row);
          }
        }
        db2_close($conn);

        // Output the screen
        $data['PRODSFL'] = $grid;
        $output = array('data' => $data, 'view' => $view, 'screen' => 'PRODCTL');
        echo json_encode($output);
        ?>
        ```

---

## Subfile Settings

*Source: Confluence page 1596858755*

The properties below configure how a Grid widget behaves as an IBM i subfile. Each property is bindable to an RPG indicator (or numeric field for sizes/record numbers), and the RPG program toggles those indicators before writing the subfile control record. The "Equivalent DDS Keyword" column below maps each RDF property to its traditional DDS counterpart.

### Display Subfile

*Source: Confluence page 1596858785*

#### Description
This property tells the system *when* to display Grid records.

#### Additional Details
- **Promptable?** DROPDOWN

- **Possible Values:** True, False

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLDSP`

### Display Control Record

*Source: Confluence page 1596858816*

#### Description
This property tells the system when to display the subfile control record.

#### Additional Details
- **Promptable?** DROPDOWN

- **Possible Values:** True, false

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLDSPCTL`

### Initialize Subfile

*Source: Confluence page 1596858848*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
This property tells the system to initialize all records within the subfile.

#### Additional Details
- **Promptable?** DROPDOWN

- **Possible Values:** True, false

- **Bindable?** YES

- **Products:** ProfoundUI

- **Equivalent DDS Keyword:** `SFLINZ`

### Clear Subfile

*Source: Confluence page 1596858948*

#### Description
This property tells the system when to clear all records from the subfile.

#### Additional Details
- **Promptable?** DROPDOWN

- **Possible Values:** True, false

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLCLR`

### Subfile Size

*Source: Confluence page 1596858978*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
This property represents the **SFLSIZ** keyword, which specifies the number of records that can be placed into the subfile. However, if your program places a record with a relative record number larger than the **SFLSIZ** value into the subfile, the subfile is automatically extended to contain the relative record number (up to a maximum of **9999** records). If this property is not specified, the **subfile page value + 1** is used. The subfile page value is determined from the "**number of rows**" property, minus the header row, if it is present.

#### Additional Details
- **Promptable?** NO

- **Possible Values:** 1 - 9999

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLSIZ`

### Subfile Record Number

*Source: Confluence page 1596859011*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
This property identifies the scrollbar position when the subfile is first displayed.

#### Additional Details
- **Promptable?** NO

- **Possible Values:** 1 - 9999

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLRCDNBR`

### Subfile End

*Source: Confluence page 1596859111*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
This property is used to indicate that a subfile with a paging bar has loaded *all* of it's records.

#### Additional Details
- **Promptable?** DROPDOWN

- **Possible Values:** True, false

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLEND`

### Subfile Return RRN

*Source: Confluence page 1596859243*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
This property can be bound to a numeric field, which will return the relative record number of the top-most visible record within a Grid.

#### Additional Details
- **Promptable?** NO

- **Possible Values:** Must be bound.

- **Bindable?** YES

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLSCROLL`

### Subfile Changed

*Source: Confluence page 1596859277*

- This property is for backward compatibility with IBM i display files. Profound Logic does ***not*** recommend the use of this property in new applications. 

- This legacy property is *hidden* by default. See **here** for more information. 
#### Description
Specifies a response indicator that is set to “on” if the input data within the subfile is modified.

#### Additional Details
- **Promptable?** NO

- **Possible Values:** Must be bound.

- **Bindable?** YES

- **Products:** Profound UI

### Cursor Record Number

*Source: Confluence page 1596859178*

#### Description
This property can be bound to a numeric field, which will return the relative record number of the record on which the cursor is located.

#### Additional Details
- **Promptable?** NO

- **Possible Values:** Must be bound.

- **Bindable?** Yes

- **Products:** Profound UI

- **Equivalent DDS Keyword:** `SFLCSRRRN`

---

## Grid Settings

*Source: Confluence page 1596860172*

### Description
This section describes the various grid settings available for grid widgets.

### Child Page List
- **Number of Rows**
- **Number of Columns**
- **Row Height**
- **Hover Effect**
- **Hover Image**
- **Row Selection**
- **Selection Field**
- **Selection Value**
- **Selection Image**
- **Column Widths**
- **Scrollbar**
- **Scroll Tool Tip**
- **Propagate Scroll Events**
- **Sortable Columns**
- **Default Sort Order**
- **Initial Sort Column**
- **Initial Sort Field**
- **Column Sort Response**
- **Field Name Sort Response**
- **Resizable Columns**
- **Movable Columns**
  - **Moving Totals with Columns**
- **Persist State**
- **Find Option**
- **Filter Option**
  - **Filter by Value Feature**
- **Reset Option**
- **Export Option**
- **Context Menu Id**
- **Hide Columns Option**
- **Export Only Visible Columns**
- **Sort Function**
- **Filter Response**
- **Return Sort Order**
- **Load Fields Into Widgets**
- **Load All Rows**
- **Show Quick Filters**

---

## Methods for Loading Data into Grids

*Source: Confluence page 1596858679*

### Overview
There are multiple types of grids, which each involve different methods of loading data:

1.  Load-all grid;

2.  Page-at-a-time grid;

3.  Database-driven grid;

4.  Data URL grid;

This page will briefly discuss each type and the method required for loading data into each specific type.

### Load-all Grid
A ‘load-all’ style grid is a grid that involves data being loaded directly from the backend program (RPG or Node.js). The data is loaded directly into grid fields from the backend program all at one time. Because the data is loaded all at once, this style of grid does have a record limit of **9999**.

For an example of setting up a load-all style grid, see the following page: **Creating a Subfile**.

### Page-at-a-time Grid
A ‘page-at-a-time’ style grid also involves the data being loaded directly from the backend program (RPG or Node.js). However, unlike a load-all style grid, a page-at-a-time grid only loads the data into the grid widget one page at a time. The paging process of the grid, in this case, is handled completely by the backend program. Because these grids are loaded only one page at a time, there is no record limit for the grid.

An example of a page-at-a-time grid is provided with Profound UI via the PUISAMPLES library:

- **RPG Program** - PUISAMPLES/GRID008R

- **DSPF** - PUISAMPLES/GRID008D

### Database-driven Grid
A ‘database-driven’ style grid involves loading the data into the grid widget directly via the database-driven properties provided for the widget. This method of loading data into a grid does not rely on a backend program to serve the data. Instead, the database-driven properties of the grid widget handle the data and load it into the widget appropriately. There is no set record limit in this scenario, however there can be changes in performance if the data being loaded into the grid widget is very large.

For an example of setting up a database-driven style grid, see the following page: **Database-Driven Grids**.

### Data URL Grid
A ‘data url’ style grid involves loading the data into the grid widget via JSON data that is returned via web service.

For an example of setting up a data url style grid, see the following page: [Data URL](https://profoundlogicsupport.atlassian.net/wiki/x/8DAuXw).
