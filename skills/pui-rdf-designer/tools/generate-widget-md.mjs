#!/usr/bin/env node
// Generate per-widget Markdown cheatsheets from the structured property catalog.
//
// Reads:   ../reference/properties.json
// Writes:  ../reference/widgets/_index.md
//          ../reference/widgets/_universal.md
//          ../reference/widgets/<widget-slug>.md   (one per widget)
//
// The "universal" file lists the 90 properties that apply to every widget
// (positioning, borders, padding, font/text, events, validation, etc.). Each
// per-widget file lists only the properties unique to that widget. Agents
// authoring a widget should load both: _universal.md plus the widget's file.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = path.resolve(__dirname, "..", "reference", "properties.json");
const OUT_DIR = path.resolve(__dirname, "..", "reference", "widgets");

const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf8"));

function slugify(name) {
  return name.replace(/\s+/g, "-").toLowerCase();
}

const HTML_ENTITIES = {
  "&lt;": "<", "&gt;": ">", "&amp;": "&", "&quot;": '"', "&#39;": "'",
  "&nbsp;": " ", "&apos;": "'",
};

function cleanHelp(html) {
  if (!html) return "";
  let s = html;
  // light-touch tag mappings
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/?\s*(b|strong)\s*>/gi, "**");
  s = s.replace(/<\s*\/?\s*(i|em)\s*>/gi, "*");
  s = s.replace(/<\s*\/?\s*p\s*>/gi, "\n");
  s = s.replace(/<\s*\/?\s*li\s*>/gi, "\n- ");
  s = s.replace(/<a [^>]*href="([^"]+)"[^>]*>([^<]*)<\/a>/gi, "[$2]($1)");
  // strip everything else
  s = s.replace(/<[^>]+>/g, "");
  // decode common entities
  for (const [ent, ch] of Object.entries(HTML_ENTITIES)) {
    s = s.split(ent).join(ch);
  }
  s = s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n));
  // collapse whitespace runs but preserve paragraph breaks
  s = s.replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").trim();
  return s;
}

function fmtList(arr) {
  if (!arr || !arr.length) return "";
  return arr.map((x) => `\`${x}\``).join(", ");
}

function renderProperty(name, def) {
  const lines = [];
  lines.push(`### \`${name}\``);
  lines.push("");

  const meta = [];
  if (def.type) meta.push(`**Type:** \`${def.type}\``);
  if (def.default != null && def.default !== "") meta.push(`**Default:** \`${def.default}\``);
  if (def.format) meta.push(`**Format:** \`${def.format}\``);
  if (def.bindable === false) meta.push(`**Bindable:** no`);
  if (def.validDataTypes && def.validDataTypes.length) {
    meta.push(`**Bind data types:** ${def.validDataTypes.map((t) => `\`${t}\``).join(", ")}`);
  }
  if (def.readOnly) meta.push(`**Read-only field name:** yes`);
  if (def.multOccur) meta.push(`**Multi-occurrence:** yes`);
  if (def.maxLength) meta.push(`**Max length:** ${def.maxLength}`);
  if (def.attribute) meta.push(`**HTML attribute:** \`${def.attribute}\``);
  if (def.stylename) meta.push(`**CSS style:** \`${def.stylename}\``);
  if (meta.length) {
    lines.push(meta.join(" · "));
    lines.push("");
  }

  if (def.choices && def.choices.length) {
    lines.push(`**Choices:** ${fmtList(def.choices)}`);
    lines.push("");
  }

  const help = cleanHelp(def.help);
  if (help) {
    lines.push(help);
    lines.push("");
  }
  return lines.join("\n");
}

function renderPropertyGroup(props) {
  // group preserving insertion order
  const groups = new Map();
  for (const [name, def] of props) {
    const cat = def.category || "Other";
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push([name, def]);
  }
  const out = [];
  for (const [cat, entries] of groups) {
    out.push(`## ${cat}`);
    out.push("");
    for (const [name, def] of entries) {
      out.push(renderProperty(name, def));
    }
  }
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Universal file

function buildUniversalDoc() {
  const universal = Object.entries(catalog.properties).filter(
    ([, def]) => def.appliesTo === "*",
  );
  const head = [
    "# Universal Properties",
    "",
    "These 90 properties apply to **every** widget type. The per-widget files in this directory list only widget-specific properties — for any widget, this universal set is also available.",
    "",
    `Generated from \`reference/properties.json\` (sourced from \`${catalog.sourceFile}\`).`,
    "",
    "## Authoring notes",
    "",
    "- All boolean property values are encoded as the **strings** `\"true\"` / `\"false\"`, not as JSON booleans.",
    "- Numbers are encoded as **strings** too (`\"15\"`, `\"140px\"`, etc.).",
    "- Property keys are spelled exactly as shown (with spaces), e.g. `\"css class\"`, `\"font size\"`.",
    "- Any property with bindable data types listed can take a [bound-field object](../rdf-shape.md#4-bound-field-object-data-binding) instead of a literal value.",
    "- Event properties (`onclick`, `onchange`, etc.) take JavaScript strings — see `events` category below.",
    "",
  ];
  return head.join("\n") + "\n" + renderPropertyGroup(universal);
}

// ---------------------------------------------------------------------------
// Per-widget file

function buildWidgetDoc(widget) {
  const widgetSpecific = Object.entries(catalog.properties).filter(
    ([, def]) => Array.isArray(def.appliesTo) && def.appliesTo.includes(widget),
  );

  const head = [
    `# Widget: \`${widget}\``,
    "",
    `Use \`"field type": "${widget}"\` on an item to render this widget.`,
    "",
    `Properties below are **specific to \`${widget}\`** (plus any other widgets they also apply to). For properties that apply to every widget (id, position, font, borders, padding, events, validation, etc.) see [_universal.md](_universal.md).`,
    "",
    `Specific property count: **${widgetSpecific.length}** · Combined with universal: **${widgetSpecific.length + 90}**`,
    "",
  ];
  if (widgetSpecific.length === 0) {
    head.push(`*This widget has no widget-specific properties beyond the universal set — author it using only universal properties.*`);
    head.push("");
    return head.join("\n");
  }
  return head.join("\n") + renderPropertyGroup(widgetSpecific);
}

// ---------------------------------------------------------------------------
// Index file

function buildIndex() {
  const lines = [
    "# Widget Index",
    "",
    "Each widget has a property reference at `<widget-slug>.md`. The slug is the widget name with spaces replaced by dashes.",
    "",
    "Authoring a widget? Load **both** [`_universal.md`](_universal.md) (the 90 properties that apply to every widget) **and** the file for the specific widget.",
    "",
    "## Widget types",
    "",
    "| `field type` value | Reference | Specific props |",
    "|---|---|---|",
  ];
  const rows = [];
  for (const w of catalog.widgets) {
    const slug = slugify(w);
    const count = Object.values(catalog.properties).filter(
      (def) => Array.isArray(def.appliesTo) && def.appliesTo.includes(w),
    ).length;
    rows.push(`| \`${w}\` | [${slug}.md](${slug}.md) | ${count} |`);
  }
  rows.sort();
  lines.push(...rows);
  lines.push("");
  lines.push("## Notes on `field type` choices");
  lines.push("");
  const fieldTypeChoices = catalog.properties["field type"]?.choices || [];
  lines.push(`The catalog defines ${catalog.widgets.length} widget types, but the \`field type\` property's choice list only exposes ${fieldTypeChoices.length} of them — \`layout\` and \`grid\` are omitted from the designer's widget picker (handled via special designer flows). All ${catalog.widgets.length} are valid \`field type\` values in the RDF JSON.`);
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Write everything

mkdirSync(OUT_DIR, { recursive: true });
// clean previously generated widget files (preserve nothing — these are fully derived)
for (const f of readdirSync(OUT_DIR)) {
  if (f.endsWith(".md")) rmSync(path.join(OUT_DIR, f));
}

writeFileSync(path.join(OUT_DIR, "_universal.md"), buildUniversalDoc() + "\n");
writeFileSync(path.join(OUT_DIR, "_index.md"), buildIndex() + "\n");

let total = 0;
for (const w of catalog.widgets) {
  const slug = slugify(w);
  writeFileSync(path.join(OUT_DIR, `${slug}.md`), buildWidgetDoc(w) + "\n");
  total += 1;
}

console.log(`Wrote ${OUT_DIR}`);
console.log(`  _universal.md (90 properties)`);
console.log(`  _index.md`);
console.log(`  ${total} widget files`);
