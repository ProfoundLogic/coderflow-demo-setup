# The design system

Every generated screen loads `theme.css` first and its own `<format>.css`
second. That ordering is what makes a converted application look like one
product. Screen CSS is for genuine per-screen deviations only — if you find
yourself repeating a rule across screens, it belongs in the brand or the theme.

## Brand tokens (`brand.json`)

```jsonc
{
  "prefix": "tg",                    // CSS class prefix; keep it 2-4 chars
  "name": "The Taylor Group, Inc.",  // top-bar wordmark text
  "tagline": "Since 1927",           // small caps under the name
  "unit": "Taylor Machine Works",    // outlined chip, e.g. a division
  "appName": "Customer Portal",      // solid accent chip
  "footerLeft":  "© ... · City, ST",
  "footerRight": "Tagline · In · Caps",
  "logo":       "logo.png",          // used for the card watermark
  "logoOnDark": "logo_white.png",    // used in the dark top bar
  "texture": "diamond",              // diamond | grid | dots | none
  "watermark": true,                 // faded logo in the corner of each card
  "maxWidth": "1400px",
  "labelWidth": "118px",             // label column in form rows
  "colors": { "accent": "#d60000", "ink": "#212832", ... },
  "fonts":  { "display": "...", "body": "...", "import": "https://fonts..." }
}
```

Only `accent` and `ink` really matter. Everything else has a working default,
and the derived shades (`accentDark`, `accentSoft`, `accentRing`, `accentGlow`,
`okDark`, `badText`) are computed — never hand-pick them.

### Getting the palette right

Run `brand-init.js` against the company's site. It reads CSS custom properties
from `:root` first, because that is where a design system declares its real
palette. Frequency analysis is only a fallback and is easily fooled — a
Bootstrap-based site is full of `#0061f2` that has nothing to do with the brand.

Always sanity-check the result against the company's actual site, and set
`logo`, `logoOnDark`, `tagline`, `unit`, `appName` and the footers by hand.

`build-theme.js` runs a contrast audit on every build. Warnings are readability
risks, not build failures — fix the palette or accept them deliberately.

### Logo on a dark top bar

Most sites ship only a dark logo. Derive a white one by mapping luminance to
alpha rather than inverting, which preserves transparency:

```python
from PIL import Image
im = Image.open('logo.webp').convert('RGBA')
px = im.load(); w, h = im.size
out = Image.new('RGBA', (w, h)); op = out.load()
for y in range(h):
    for x in range(w):
        r, g, b, a = px[x, y]
        lum = (r*299 + g*587 + b*114) // 1000
        op[x, y] = (255, 255, 255, int(a * (255 - lum) / 255))
out.save('logo_white.png')
```

Copy both files into the asset directory — the generator references them by
name, it does not fetch them.

## Component vocabulary

| Class | Use |
|---|---|
| `-screen` | Outermost wrapper. Every rule is scoped under this. |
| `-topbar` / `-brand` / `-app-name` / `-stripe` | Branded header |
| `-main` | Centred content column, `max-width` from the brand |
| `-titlebar` / `-key-badge` | Screen title, plus the record key on detail screens |
| `-toolbar` / `-field` | Search and filter controls above a list |
| `-tablewrap` / `-table` / `-sort` / `-col-opt` / `-col-key` | Subfile as a data table |
| `-grid` / `-card` / `-card-head` / `-fields` / `-row` | Form layout |
| `-label` / `-value` / `-input` / `-hint-inline` | Field-level pieces |
| `-tag` / `-status` | Coded values rendered as pills |
| `-message` / `-hint` | Program messages and option legends |
| `-backdrop` / `-dialog` | DDS `WINDOW()` formats |
| `-actions` / `-btn` | Function keys as real buttons |
| `-botbar` | Footer |

## Layout rules that matter

- **Scope every rule under the wrapper class.** No bare `html`, `body`, `div`
  or `*` rules — they leak into the Genie skin around the screen.
- **Never blanket-reset a property you also set on components.**
  `.x-screen div { padding: 0 }` scores (0,1,1) and beats every `.x-card`
  rule (0,1,0). The theme resets padding only on `div:not([class])` for this
  reason, and `preflight.js` fails the build if it ever regresses.
- **No `position: fixed`, no `100vh`.** The screen is embedded, not a page.
- **Use `minmax(0, 1fr)`, not `1fr`,** in grid templates, or long values refuse
  to wrap and push the layout wide.
- **Numeric columns** get `class="num"` — right-aligned, tabular figures,
  `white-space: nowrap`.

## Extending a screen beyond the DDS

The generator gives you a faithful, well-structured starting point. The parts
that made the reference screens land — KPI strips, financial visualisations,
an AI summary, status pills derived from coded fields — are *additions* you
make afterwards, in the screen's own `.ejs` and `.css`.

Two rules when you do:

1. **Derive from real fields.** A metric computed from a customer number rather
   than from the balance will eventually contradict the data next to it. In the
   reference build, aging buckets keyed off the customer number showed a
   customer with a $0.00 balance as 19% overdue at 90+ days.
2. **Re-run `preflight.js`.** It catches undeclared identifiers, JS errors,
   overflow and collapsed padding, all of which are invisible until a user hits
   the screen.
