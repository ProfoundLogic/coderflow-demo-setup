# Genie Skin Architecture

Source: Confluence PUI space, "Skins" page and children (Technical Details, Editing Skin Files from the Genie Administrator, Change the logo for a Genie Skin, Mapping a Network Drive, Copying Genie Skin Screen Modifications).

## What a Genie skin is

A Genie skin is a collection of HTML, JavaScript, and CSS files that control how *all* 5250 screens are displayed under that skin. Each skin is comprised of:

- Template HTML file — `start.html`
- Cascading Style Sheet — `<Skin Name>.css` (e.g. `gradient.css`, `Hybrid.css`)
- Customization script — `custom.js`

These live on the IFS at:

```
/www/<instance_name>/htdocs/profoundui/userdata/genie skins/<skin_name>/
```

(In this dev environment they arrive instead as a folder tree, one directory per skin, mirroring that same layout — treat the top-level folder name as `<skin_name>`.)

The skin's HTML file is a static file used to design the page header/footer for all screens (company logo, text, links, color scheme). The CSS file styles every component on the page (color, size, location, alignment, font) and determines how each 5250 display attribute is rendered by Genie.

## Customizing skins — copy first

To customize an existing skin, **copy it first**, then edit the copy. Do **not** modify the shipped skins (Classic, Hybrid, Gradient, Tablet, Skyline, Plain, etc.) directly — they can be silently overwritten by a Profound UI product update. A copy becomes your "official" skin. Changes to a skin affect *every* screen running under it.

When copying:
- Copy the whole folder to a new name.
- Update `start.html`'s `<link>`/`<script>` `src`/`href` paths to point at the new folder name (they hardcode the old skin folder name, e.g. `/profoundui/userdata/genie skins/Gradient/Gradient.css`).
- Update any hardcoded skin-folder-name string literals inside `custom.js` (logo paths, backdrop image paths — these are hardcoded per-skin in every real skin reviewed).

## Required markup in `start.html`

The file can be customized freely as long as it contains a `<div>` with id `"5250"`:

```html
<div id="5250"> </div>
```

Some skins add a class for styling purposes:

```html
<div class="insideDiv" id="5250"> </div>
```

This is the div where all 5250 content is rendered — Genie replaces/populates its contents at runtime. It can be nested inside other divs/tables along with any other page chrome (headers, footers, logos, nav).

The template must also link the two stylesheets and two scripts, **in this order**:

```html
<link href="/profoundui/proddata/css/profoundui.css" rel="stylesheet" type="text/css" />
<link href="/profoundui/userdata/genie skins/Skin_Name/Skin_Name.css" rel="stylesheet" type="text/css" />
<script type="text/javascript" src="/profoundui/proddata/js/genie.js"></script>
<script type="text/javascript" src="/profoundui/userdata/genie skins/Skin_Name/custom.js"></script>
```

Order matters:
- `profoundui.css` must be **above** `Skin_Name.css` (so the skin's rules can override the base Profound UI rules).
- `genie.js` must be **above** `custom.js` (so the skin's hooks can reference the runtime).

Any additional shared/reusable JS module script tags go **between** `genie.js` and `custom.js` (see `modular-js.md`) so `custom.js` can call into them.

Note the literal space in the `genie skins` folder name in every URL — some code paths URL-encode it as `genie%20skins`; both work, but be consistent with what the rest of the skin already uses.

## The two stylesheets

Two CSS files are in play for every Genie page:

- `/www/profoundui/htdocs/profoundui/proddata/css/profoundui.css` — shared base, included so Profound UI Rich Display File programs can integrate within Genie.
- `/www/profoundui/htdocs/profoundui/userdata/genie skins/Skin_Name/Skin_Name.css` — the skin's own stylesheet, and the one you'll be editing almost all the time.

`Skin_Name.css` is mostly the 5250 attribute-byte color classes (see `attribute-colors.md`), plus normal page styling: background color, default font family, alignment of the 5250 container div, and everything else you'd expect in a stylesheet.

## The two JavaScript files

- `genie.js` — the main product runtime. Obfuscated, shipped/updated with Profound UI itself. Never edit it.
- `custom.js` — the skin's own file. Contains the lifecycle hook functions (see `event-lifecycle.md`) plus any custom global helper functions for the skin. This is the file you edit for behavior.

## `config.js`

Every skin folder also has a `config.js`, a flat JSON object, e.g.:

```json
{"enableDesigner":true,"adjustColumns":false,"connectionType":"V","workStnFieldId":"D_4_70",
 "detectSubfile":true,"detectSubfilePatterns":true,"findOptionColumn":true,
 "outlineSubfile":false,"hideSubfileOpt":true,"stripedSubfile":true,"evenRowColor":"#FFFFFF",
 "enlargeHeadings":false,"functionKeyButtons":true,"hideFKeyNames":true,"useFixedFont":false}
```

This is Genie Administrator-managed configuration (subfile auto-detection, Designer enablement, connection type, striping, function-key-to-button behavior). It is normally edited through the Genie Administrator UI, not hand-edited as part of visual/behavioral skin customization. Leave it alone unless the task specifically concerns one of these settings.

## Screen-level customizations (`.scn` files) — separate mechanism

Genie also supports per-screen customizations made through the Designer, stored one file per screen in a `Screens` subfolder of the skin (`<skin>/Screens/<screen_name>.scn`), tracked by a `screens.lst` index file. This is a *different* customization layer from skin-wide `custom.js`/CSS changes — it's Designer-driven, per-screen, and generally out of scope for "edit the skin" requests unless the user is specifically asking about per-screen Designer customizations or copying them between skins/instances. If you do need to copy `.scn` files manually between IFS instances, the list file must be rebuilt with:

```
CALL PGM(PUI0002103) PARM('/www/<INSTANCE>/htdocs/profoundui/userdata/genie skins/<SKIN>/Screens')
```

## Launching a skin

Default skin: `http://system-name:port/profoundui/Genie`. The default is set in the Genie Administrator under Global options → Default Skin.

A specific skin: `http://system-name:port/profoundui/Genie?skin=<SkinName>`.
