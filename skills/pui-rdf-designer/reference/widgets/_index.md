# Widget Index

Each widget has a property reference at `<widget-slug>.md`. The slug is the widget name with spaces replaced by dashes.

Authoring a widget? Load **both** [`_universal.md`](_universal.md) (the 90 properties that apply to every widget) **and** the file for the specific widget.

## Widget types

| `field type` value | Reference | Specific props |
|---|---|---|
| `ajax container` | [ajax-container.md](ajax-container.md) | 8 |
| `button` | [button.md](button.md) | 24 |
| `chart` | [chart.md](chart.md) | 26 |
| `checkbox` | [checkbox.md](checkbox.md) | 8 |
| `combo box` | [combo-box.md](combo-box.md) | 53 |
| `css button` | [css-button.md](css-button.md) | 32 |
| `css panel` | [css-panel.md](css-panel.md) | 6 |
| `date field` | [date-field.md](date-field.md) | 38 |
| `field set panel` | [field-set-panel.md](field-set-panel.md) | 6 |
| `file upload dnd` | [file-upload-dnd.md](file-upload-dnd.md) | 11 |
| `file upload` | [file-upload.md](file-upload.md) | 10 |
| `graphic button` | [graphic-button.md](graphic-button.md) | 27 |
| `grid` | [grid.md](grid.md) | 139 |
| `html container` | [html-container.md](html-container.md) | 11 |
| `hyperlink` | [hyperlink.md](hyperlink.md) | 14 |
| `icon` | [icon.md](icon.md) | 4 |
| `iframe` | [iframe.md](iframe.md) | 2 |
| `image` | [image.md](image.md) | 26 |
| `layout` | [layout.md](layout.md) | 37 |
| `menu` | [menu.md](menu.md) | 17 |
| `on off switch` | [on-off-switch.md](on-off-switch.md) | 7 |
| `output field` | [output-field.md](output-field.md) | 23 |
| `panel` | [panel.md](panel.md) | 7 |
| `password field` | [password-field.md](password-field.md) | 31 |
| `radio button` | [radio-button.md](radio-button.md) | 5 |
| `select box` | [select-box.md](select-box.md) | 32 |
| `signature pad` | [signature-pad.md](signature-pad.md) | 1 |
| `slider` | [slider.md](slider.md) | 5 |
| `spinner` | [spinner.md](spinner.md) | 36 |
| `styled button` | [styled-button.md](styled-button.md) | 25 |
| `tab panel` | [tab-panel.md](tab-panel.md) | 10 |
| `text area` | [text-area.md](text-area.md) | 36 |
| `textbox` | [textbox.md](textbox.md) | 67 |

## Notes on `field type` choices

The catalog defines 33 widget types, but the `field type` property's choice list only exposes 31 of them — `layout` and `grid` are omitted from the designer's widget picker (handled via special designer flows). All 33 are valid `field type` values in the RDF JSON.
