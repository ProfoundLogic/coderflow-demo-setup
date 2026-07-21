# 5250 Attribute Bytes → CSS Classes

Source: Confluence "Technical Details" page, corroborated against `Classic.css` (canonical/unmapped) and `Hybrid.css` (remapped example).

## How it works

The 5250 data stream changes color/attribute by emitting an attribute byte (e.g. hex `x'20'` = green text, `x'34'` = turquoise/underscore). Genie detects these bytes and assigns the affected text to a CSS class named after the attribute code — e.g. class `A20` = green, class `A34` = turquoise/underscore. Full byte chart: see IBM's DSM1F API docs (linked from the Confluence page) and the `attributebyte.png` image attached to that page.

Genie distinguishes **output** (`DIV.Axx`) from **input** (`INPUT.Axx`) fields, so each attribute class can (and in most real skins, does) map to a *different* actual color depending on whether it's a label/output field or an editable input field. These classes are entirely controlled by the skin's CSS — remapping them is the mechanism by which a skin gives 5250 green/white/red text a modern palette instead of literal terminal colors.

## Full class table (from `Classic.css`, which keeps the literal terminal colors — i.e. this is the "no remapping" baseline)

| Class | Meaning | Literal color |
|---|---|---|
| `A20` | Green | `lime` |
| `A21` | Reverse Green | bg `lime`, text `black` |
| `A22` | White | `white` |
| `A23` | Reverse White | bg `white`, text `black` |
| `A24` | Green Underscore | `lime` + underline |
| `A25` | Green Underscore Reverse | bg `lime`, text `black` + underline |
| `A26` | White Underscore | `white` + underline |
| `A27` | Nondisplay (input: `color:white;bg:black`; output: `visibility:hidden`) | — |
| `A28` | Red | `red` |
| `A29` | Reverse Red | bg `red`, text `black` |
| `A2A` | Red Blink | `red` |
| `A2B` | Red reverse image blink | bg `red` |
| `A2C` | Red Underscore | `red` + underline |
| `A2D` | Red Underscore Reverse | bg `red`, text `black` |
| `A2E` | Red Underscore Blink | `red` + underline |
| `A2F` | Nondisplay | `visibility:hidden` |
| `A30` | Turquoise (column separators) | `aqua` + dashed underline |
| `A31` | Turquoise Reverse (column separators) | bg `aqua`, text `black` + dashed underline |
| `A32` | Yellow (column separators) | `yellow` + dashed underline |
| `A33` | Yellow Reverse (column separators) | bg `yellow`, text `black` + dashed underline |
| `A34` | Turquoise Underscore | `aqua` + solid underline |
| `A35` | Turquoise Underscore Reverse | bg `aqua`, text `black` + underline |
| `A36` | Yellow Underscore | `yellow` + underline |
| `A37` | Nondisplay | text `black`, bg `black` |
| `A38` | Pink | `fuchsia` |
| `A39` | Pink Reverse | bg `fuchsia`, text `black` |
| `A3A` | Blue | `#8080FF` |
| `A3B` | Blue Reverse | bg `#8080FF`, text `black` |
| `A3C` | Pink Underscore | `fuchsia` + underline |
| `A3D` | Pink Underscore Reverse | bg `fuchsia`, text `black` + underline |
| `A3E` | Blue Underscore | `blue` + underline `#8080FF` |

Also present in every skin's CSS: `.hide { visibility: hidden; }`, `.upper { text-transform: uppercase; }`, plus autocomplete-popup styling (`.autocomplete-item`, `.autocomplete-selected`, `.autocomplete-col`) and link style variants (`.link1 A` through `.link6 A`, each with its own hover treatment) that skins assign to hyperlink-rendered function keys.

## Example of a modernized remapping (Hybrid skin)

Hybrid remaps `A20` (green) differently for output vs. input:

```css
DIV.A20 {
  color: #333333;   /* dark grey — output/label text */
  font-weight: bold;
}
INPUT.A20 {
  color: #003399;   /* dark blue — editable input text */
  font-weight: bold;
}
```

This choice was arbitrary — chosen purely to look more modern than literal green-on-black. Hyperlink-rendered fields (`DIV.A20 A`) additionally get their own font treatment (`sans-serif`, bold, sized) with a `:hover` underline state layered on top of the base class.

## Guidance for remapping colors

- If the application uses color to encode meaning (e.g. yellow = inactive record, red = overdue), **preserve that semantic distinction** — remap to a different-but-still-distinguishable hue rather than collapsing multiple attribute classes to the same final color.
- If a color (e.g. white) has *no* special meaning in the app, it's safe to remap freely for aesthetics.
- Determine hex values with a color picker (Photoshop, browser devtools) or a site like color-hex.com when translating a client's brand palette into these classes.
- Never delete an attribute class outright — some screen somewhere is very likely relying on it; even the "nondisplay" classes (`A27`, `A2F`, `A37`) are load-bearing (password fields, etc.).
- When asked to "modernize" a skin, prefer reducing saturation/intensity of retained meaningful colors over completely reinventing the palette from scratch — this keeps the app recognizable to its existing users while looking less like a raw terminal.
