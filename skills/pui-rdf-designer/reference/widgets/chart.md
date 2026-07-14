# Widget: `chart`

Use `"field type": "chart"` on an item to render this widget.

Properties below are **specific to `chart`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **26** · Combined with universal: **116**
## Identification

### `chart response`

**Default:** `bind` · **Bind data types:** `char`, `varchar`, `string` · **Read-only field name:** yes

Specifies a response field to be returned to your program containing the name of the data point selected by the user.

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

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

### `name field`

**Type:** `field` · **Default:** `blank`

Database field that determines the names by which records would be represented in the chart.

### `value field`

**Type:** `field` · **Default:** `blank`

Database field that determines the numerical values from which the chart is to be built.

### `summary option`

**Default:** `blank`

**Choices:** `none`, `average`, `count`, `sum`, `maximum`, `minimum`

Determines how values are used when creating the chart.

### `selection criteria`

**Type:** `long` · **Default:** `blank`

Optional expression identifying which records should be retrieved from the database table.

### `parameter value`

**Type:** `long` · **Default:** `blank` · **Multi-occurrence:** yes

Value for parameter marker in 'selection criteria' or 'custom sql' properties. Parameter markers are specified using a question mark. Profound UI will accept values from the client for any parameter marker values which are not bound to program fields. Parameter markers are numbered in order of occurrence, from left to right. To specify multiple parameter marker values, right-click the property and select Add Another Parameter Value.

### `record limit`

**Default:** `blank` · **Format:** `number`

Sets a limit on how many records are to be used in the chart.

### `custom sql`

**Type:** `long` · **Default:** `blank`

Specifies an SQL statement to use to retrieve the records for a database-driven chart. The last column is used as the chart values. Earlier columns are concatenated into the chart labels.

### `order by`

**Type:** `field` · **Default:** `blank`

Optional expression identifying which fields determine the order of the items. For a database-driven chart, this property is ignored when *'summary option'* is used. In this case, the items will sort on the *'name field'*.
When sorting by columns other than the first choice column, add those columns to the 'choice options field' property.

## Chart Settings

### `chart type`

**Default:** `[selected chart]`

**Choices:** `Column3D`, `Column2D`, `Bar2D`, `Line`, `Area2D`, `Pie2D`, `Pie3D`, `Doughnut3D`, `Other...`

Identifies the type of chart to display. The chart type matches the JavaScript alias listed in the FusionCharts documentation. The available chart names are provided here: 

List of FusionCharts Charts files

HTML5 is used to render the chart.

### `map type`

**Default:** `world`

Identifies the type of map to display. The available map names are provided here: 

List of FusionCharts Maps files

Specifiy the 'JavaScript alias' name, with or without the 'maps/' prefix. If this property is specified, the 'chart type' property is ignored.

### `chart options`

**Type:** `long` · **Default:** `blank`

Specifies chart options as a set of XML attributes that are to be attached to the FusionCharts <chart> tag. The format of the attributes is described on the FusionCharts documentation site: Chart Attributes.

### `chart overlay`

**Default:** `false`

**Choices:** `true`, `false`

When set to true, the Chart panel will overlay any other content on the screen, regardless of z-index settings. When set to false, the Chart panel will behave according to normal layering rules, based on z-index.

### `onchartclick`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script when a chart section is clicked. The name of the chart section is passed to the event as a parameter named 'name'.

## Chart Data

### `names`

**Type:** `list` · **Default:** `blank`

Specifies a list of names representing the data points on the chart or a list of screen element id's from which the names could be retrieved. The list should be comma separated.

### `values`

**Type:** `list` · **Default:** `blank`

Specifies a list of numerical values used to build the chart or a list of screen element id's from which the values could be retrieved. The list should be comma separated.

## Dynamic Chart

### `chart url`

**Type:** `long` · **Default:** `blank`

Sets the url to a web service that returns the chart definition and data in XML format as specified in the FusionCharts Data Formats section of the FusionCharts documentation site: FusionCharts Documentation.

### `chart url json`

**Type:** `long` · **Default:** `blank`

Sets the url to a web service that returns the chart definition and data in JSON format as specified in the FusionCharts Data Formats section of the FusionCharts documentation site: FusionCharts Documentation.

### `chart xml`

**Type:** `long` · **Default:** `blank`

Sets the XML data for the chart as specified in the FusionCharts Data Formats section of the FusionCharts documentation site: FusionCharts Documentation.

### `chart json`

**Type:** `long` · **Default:** `blank`

Sets the JSON data for the chart as specified in the FusionCharts Data Formats section of the FusionCharts documentation site: FusionCharts Documentation. The data can be provided as a string or as a JavaScript object through the use of property scripting.

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

