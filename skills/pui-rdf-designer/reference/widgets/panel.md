# Widget: `panel`

Use `"field type": "panel"` on an item to render this widget.

Properties below are **specific to `panel`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).

Specific property count: **7** · Combined with universal: **97**
## Identification

### `panel style`

**Default:** `theme`

**Choices:** `Simple`, `Evergreen`, `Ruby`, `Sapphire`, `Polished`, `Contemporary`, `Slate`, `Smoke`, `Pine`, `Ice Blue`, `Glass`, `Navy`, `Steel Blue`, `Harvest`, `Professional Dialog`, `Classic Dialog`, `Simple Dialog`, `Polished Dialog`, `Modern Dialog`, `Glass Dialog`, `Crimson Dialog`

Specifies the style to be used for the look and feel of the panel.

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

## Template Settings

### `header text`

**Default:** `placeholder`

Specifies the text that will appear in the panel header.

