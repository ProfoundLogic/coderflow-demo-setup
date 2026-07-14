# Widget: `tab panel`

Use `"field type": "tab panel"` on an item to render this widget.

Properties below are **specific to `tab panel`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **10** · Combined with universal: **100**
## Identification

### `tab response`

**Default:** `bind` · **Format:** `number` · **Bind data types:** `zoned` · **Read-only field name:** yes

Specifies a numeric response field to be returned to your program when a tab is selected containing the index of the selected tab. Each of the Tab Panel's tabs are identified by a sequential index, starting from 0. For example, 0 refers to the first tab, 1 refers to the second tab, etc.

## Field Settings

### `response AID`

**Default:** `Enter`

**Choices:** `AutoEnter`, `Clear`, `Enter`, `F1`, `F2`, `F3`, `F4`, `F5`, `F6`, `F7`, `F8`, `F9`, `F10`, `F11`, `F12`, `F13`, `F14`, `F15`, `F16`, `F17`, `F18`, `F19`, `F20`, `F21`, `F22`, `F23`, `F24`, `Help`, `PageDown`, `PageUp`, `Print`, `RecordBackspace`

When screen is submitted for 'tab response' property, the AID code corresponding to the key specified here will be used. If not specified, the AID code for the Enter key will be used.

## Validation

### `bypass validation`

**Type:** `boolean` · **Default:** `blank` · **Bind data types:** `char`, `indicator`, `expression`

**Choices:** `true`, `false`, `send data`

This property, typically used on Cancel or Undo buttons, specifies that the element will not trigger client-side validation and will automatically discard all data modified by the user on the screen. It represents the CAxx set of DDS keywords. You can select 'send data' to bypass all client-side validation except for field data type validation and still send all data modified by the user.

## Tabs

### `tab panel style`

**Default:** `theme`

**Choices:** `Simple`, `Classic`, `Glass`, `Angle`, `Glow`, `Smooth`, `Delicate`, `Concrete`, `Sky`, `Block`, `CSS`, `Other...`

Identifies the look and feel of the tab panel.

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

### `lazy load`

**Default:** `false`

**Choices:** `true`, `false`

When true, render contents of a tab or section after the user activates it instead of rendering everything immediately (which can be slower).

### `onlazyload`

**Type:** `js` · **Default:** `blank`

Initiates a client-side script after a container is rendered lazily. (See lazy load property.)

### `movable tabs`

**Type:** `boolean` · **Default:** `false` · **Bind data types:** `indicator`, `expression`

**Choices:** `true`, `false`

Allows the user to rearrange tabs at runtime.

