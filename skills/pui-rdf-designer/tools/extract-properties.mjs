#!/usr/bin/env node
/**
 * extract-properties.mjs
 *
 * Extracts the canonical property catalog from Profound UI's runtime
 * `properties.js`, the layout widget's properties.js, the grid widget's
 * Grid.js, and per-template properties exposed by pui.layout.getProperties.
 * Emits the merged catalog as JSON to ../reference/properties.json.
 *
 * Approach: stub-load (primary) + static brace-balanced extraction (fallback).
 *   1. Build a minimal `pui` namespace (sandbox) sufficient for properties.js
 *      to evaluate without a real browser.
 *   2. Load Widgets.js into the sandbox to install pui.widgets + helpers
 *      (getButtonStyles, getPanelStyles, getChartTypes, getTabStyles,
 *       getWidgetList).
 *   3. Statically extract the literal style/type tables defined at module
 *      load of widget files (panel.js, styled_button.js, tab_panel.js,
 *      chart.js) and attach them to pui.widgets so the lookup helpers can
 *      enumerate them.
 *   4. Manually register every widget name (scraped from widget files) into
 *      pui.widgets._widgetArray so pui.widgets.getWidgetList(false) — which
 *      properties.js calls at descriptor construction time — returns the
 *      real widget list.
 *   5. Load runtime properties.js, call getPropertiesModel() to get the base
 *      descriptor array.
 *   6. Load widgets/layout/{namespace,templates,processHTML,properties}.js
 *      into the same sandbox so pui.layout.getPropertiesModel and
 *      pui.layout.getProperties(template) become callable.  Use them to
 *      harvest layout-base descriptors and per-template descriptors.
 *   7. Statically extract pui.BaseGrid.getPropertiesModel out of the 11k-line
 *      Grid.js (brace-balanced parse) and evaluate just that function in the
 *      sandbox.  Call it to obtain the grid descriptors.
 *   8. Merge: dedupe by property name.  First source wins for descriptor
 *      content; appliesTo is the union across sources.  Template-contributed
 *      properties carry an extra `template` field naming their origin.
 *   9. Drop genie-only descriptors, attach the most-recently-seen category
 *      to each property, and emit JSON.
 *
 * Why not load every widget JS file?  Many widget files reach for
 * pui.BasicWidget, pui.BaseClass, browser DOM, jQuery, etc. at module
 * evaluation time; loading them all into a Node VM would be a constant
 * battle.  We only need the data they declare, which we lift out by
 * static parsing (see extractWidgetDataDeclarations).  Grid.js is the
 * canonical example — 11k lines, instantiates DOM at module load — so we
 * lift out only its `getPropertiesModel` assignment and evaluate that.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REPO_ROOT = path.resolve(__dirname, "../..");
const CLIENT_ROOT = path.join(REPO_ROOT, "profoundui-client");
const RUNTIME_DIR = path.join(
  CLIENT_ROOT,
  "htdocs/profoundui/proddata/js/runtime",
);
const WIDGETS_DIR = path.join(
  CLIENT_ROOT,
  "htdocs/profoundui/proddata/js/widgets",
);
const PROPERTIES_JS = path.join(RUNTIME_DIR, "properties.js");
const WIDGETS_JS = path.join(RUNTIME_DIR, "Widgets.js");
const LAYOUT_DIR = path.join(WIDGETS_DIR, "layout");
const LAYOUT_NAMESPACE_JS = path.join(LAYOUT_DIR, "namespace.js");
const LAYOUT_TEMPLATES_JS = path.join(LAYOUT_DIR, "templates.js");
const LAYOUT_PROCESS_HTML_JS = path.join(LAYOUT_DIR, "processHTML.js");
const LAYOUT_PROPERTIES_JS = path.join(LAYOUT_DIR, "properties.js");
const GRID_JS = path.join(WIDGETS_DIR, "grid", "Grid.js");
const OUT_PATH = path.resolve(__dirname, "../reference/properties.json");
const SOURCE_REL = path.relative(REPO_ROOT, PROPERTIES_JS);

// Standard layout templates whose properties live in pui.layout.getProperties.
// Each maps to a switch case that hard-codes its `templateProperties`. We call
// the function with each and merge the result. ("simple container", "table",
// and "mobile device" are HTML-templated; processHTML.js (loaded into sandbox)
// handles them.)
const LAYOUT_TEMPLATES = [
  "css panel",
  "accordion",
  "responsive layout",
  "tab panel",
  "fieldset",
  "simple container",
  "table",
  "mobile device",
];

// ---------------------------------------------------------------------------
// 1. Statically lift literal data declarations from widget JS files.

/**
 * Read a JS file and `eval` a single named top-level assignment of the form
 *   pui.widgets.<key> = { ...object literal... };
 * (or `= [...array literal...]`) using a fresh VM context.  Throws if the
 * declaration cannot be located or parsed.
 */
function extractTopLevelAssignment(file, namespacePath) {
  const src = readFileSync(file, "utf8");
  const escaped = namespacePath.replace(/[.[\]]/g, "\\$&");
  // Locate the start, then scan brace-balanced to find the end — a non-greedy
  // ";\n"-terminated regex would over- or under-match when objects/arrays contain
  // semicolons inside strings or nested structures.
  const startRe = new RegExp("^\\s*" + escaped + "\\s*=\\s*", "m");
  const startMatch = startRe.exec(src);
  if (!startMatch) {
    throw new Error(`Could not locate assignment '${namespacePath}' in ${path.basename(file)}`);
  }
  const startIdx = startMatch.index + startMatch[0].length;
  const open = src[startIdx];
  if (open !== "{" && open !== "[") {
    throw new Error(
      `Expected '{' or '[' at start of '${namespacePath}' value in ${path.basename(file)}, got '${open}'`,
    );
  }
  const close = open === "{" ? "}" : "]";
  // Scan with string/comment awareness.
  let depth = 0;
  let i = startIdx;
  let inStr = null;
  let endIdx = -1;
  while (i < src.length) {
    const c = src[i];
    const c2 = src[i] + (src[i + 1] || "");
    if (inStr) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === inStr) inStr = null;
      i += 1;
      continue;
    }
    if (c2 === "//") {
      const nl = src.indexOf("\n", i);
      i = nl < 0 ? src.length : nl + 1;
      continue;
    }
    if (c2 === "/*") {
      const cl = src.indexOf("*/", i + 2);
      i = cl < 0 ? src.length : cl + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      i += 1;
      continue;
    }
    if (c === open) depth += 1;
    else if (c === close) {
      depth -= 1;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
    i += 1;
  }
  if (endIdx < 0) {
    throw new Error(`Unterminated literal for '${namespacePath}' in ${path.basename(file)}`);
  }
  const literal = src.slice(startIdx, endIdx);
  // Evaluate in an empty context.
  // eslint-disable-next-line no-new-func
  return vm.runInNewContext("(" + literal + ")", {});
}

/**
 * Statically extract a named function-expression assignment of the form
 *   <namespacePath> = function(...) { ... };
 * from a JS file using brace-balanced scanning.  Returns the source text of
 * the function expression (including the leading `function` keyword and the
 * closing brace).  Throws if the assignment cannot be located.
 *
 * Used for things like `pui.BaseGrid.getPropertiesModel = function() {...}`
 * inside a huge file whose other top-level code would crash in a Node VM.
 */
function extractFunctionAssignment(file, namespacePath) {
  const src = readFileSync(file, "utf8");
  const escaped = namespacePath.replace(/[.[\]]/g, "\\$&");
  const startRe = new RegExp("^\\s*" + escaped + "\\s*=\\s*function\\b", "m");
  const startMatch = startRe.exec(src);
  if (!startMatch) {
    throw new Error(
      `Could not locate function assignment '${namespacePath}' in ${path.basename(file)}`,
    );
  }
  // Find the "function" keyword start, then advance to the opening brace, then
  // brace-balance to the matching closing brace.
  const fnStart = startMatch.index + startMatch[0].length - "function".length;
  // Find the first '{' after the parameter list.
  let i = fnStart;
  while (i < src.length && src[i] !== "{") i += 1;
  if (i >= src.length) throw new Error(`No opening brace for '${namespacePath}'`);
  const openIdx = i;
  let depth = 0;
  let inStr = null;
  let endIdx = -1;
  while (i < src.length) {
    const c = src[i];
    const c2 = src[i] + (src[i + 1] || "");
    if (inStr) {
      if (c === "\\") {
        i += 2;
        continue;
      }
      if (c === inStr) inStr = null;
      i += 1;
      continue;
    }
    if (c2 === "//") {
      const nl = src.indexOf("\n", i);
      i = nl < 0 ? src.length : nl + 1;
      continue;
    }
    if (c2 === "/*") {
      const cl = src.indexOf("*/", i + 2);
      i = cl < 0 ? src.length : cl + 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      i += 1;
      continue;
    }
    if (c === "{") depth += 1;
    else if (c === "}") {
      depth -= 1;
      if (depth === 0) {
        endIdx = i + 1;
        break;
      }
    }
    i += 1;
  }
  if (endIdx < 0) {
    throw new Error(`Unterminated function for '${namespacePath}' in ${path.basename(file)}`);
  }
  void openIdx;
  return src.slice(fnStart, endIdx);
}

/** Scrape every widget name registered via pui.widgets.add({ name: "..." }). */
function extractWidgetNames() {
  const dirs = [
    WIDGETS_DIR,
    path.join(WIDGETS_DIR, "grid"),
    path.join(WIDGETS_DIR, "layout"),
  ];
  const names = new Set();
  // Use find to walk recursively rather than fs.readdirSync of subtrees we
  // don't know.
  const out = execSync(
    `grep -hER 'pui\\.widgets\\.add\\(' ${dirs.map((d) => `'${d}'`).join(" ")} -A 2 || true`,
    { encoding: "utf8" },
  );
  const nameRe = /name:\s*"([^"]+)"/g;
  let m;
  while ((m = nameRe.exec(out)) !== null) {
    names.add(m[1]);
  }
  return [...names].sort();
}

// ---------------------------------------------------------------------------
// 2. Build the sandbox and load Widgets.js + properties.js.

function buildSandbox() {
  const win = {};
  const sandbox = {
    console,
    window: win,
    document: {
      compatMode: "CSS1Compat",
      createElement: () => ({ style: {}, setAttribute() {}, appendChild() {} }),
    },
    navigator: { userAgent: "node-extract-properties" },
    location: { href: "" },
    setTimeout: () => 0,
    clearTimeout: () => {},
    setInterval: () => 0,
    clearInterval: () => {},
  };
  sandbox.global = sandbox;
  sandbox.globalThis = sandbox;
  // pui is what the runtime mostly leans on.  We pre-seed minimal shape so
  // properties.js and Widgets.js have something to anchor to.
  sandbox.pui = {
    codeBased: false,
    nodedesigner: false,
    nodejs: false,
    viewdesigner: false,
    usingGenieHandler: false,
    propertyAlias: {},
    suppressPropertyScriptingErrors: false,
    // The functions properties.js references via pui.<x>
    getDatabaseConnections: () => [],
    // Widgets.js does `pui.BasicWidget.prototype = Object.create(pui.BaseClass.prototype)`
    // at the bottom of the file.  Stub the chain so that doesn't throw.
    BaseClass: function BaseClass() {},
    widgetsToCleanup: [],
    widgetsToPostRender: [],
    normalizeURL: (u) => u,
  };
  sandbox.pui.BaseClass.prototype = {};
  // properties.js uses `context` as a bare identifier (declared with `var` in
  // dspf/context.js).  Inject as a top-level global.
  sandbox.context = "dspf";
  // properties.js also references `inDesignMode` (only inside non-top-level
  // code paths, but we still stub).
  sandbox.inDesignMode = () => false;
  sandbox.getObj = () => null;
  sandbox.trim = (s) => String(s).trim();
  vm.createContext(sandbox);
  return sandbox;
}

function runFileIn(sandbox, file) {
  const src = readFileSync(file, "utf8");
  vm.runInContext(src, sandbox, { filename: path.relative(REPO_ROOT, file) });
}

// ---------------------------------------------------------------------------
// 3. Resolve and normalise the property model.

/**
 * Turn a raw descriptor from properties.js into a normalised catalog entry.
 *
 * `defaultAppliesTo` is used when `controls` is absent.  For runtime
 * properties.js the runtime treats "no controls" as universal ("*").  For
 * layout / grid / template sources, the property only applies to that
 * source's widget(s), so the caller passes e.g. ["layout"] or ["grid"].
 */
function normaliseDescriptor(raw, category, unresolved, defaultAppliesTo = "*") {
  const appliesTo = Array.isArray(raw.controls)
    ? [...raw.controls].sort()
    : defaultAppliesTo;

  let choices = raw.choices;
  if (typeof choices === "function") {
    try {
      // Many of these helpers take no args; the ones that do (getWidgetList)
      // are already called inline in the source, not passed as a reference.
      const result = choices();
      if (Array.isArray(result)) {
        choices = result;
      } else {
        unresolved.push({
          name: raw.name,
          reason: `function returned non-array: ${typeof result}`,
        });
        choices = `<unresolved: function returned ${typeof result}>`;
      }
    } catch (err) {
      unresolved.push({
        name: raw.name,
        reason: err.message,
      });
      choices = `<unresolved: ${err.message}>`;
    }
  } else if (choices === undefined) {
    choices = null;
  }

  // bind: false means "not bindable to a program field".  Default true.
  const bindable = raw.bind === false ? false : true;

  const entry = {
    category,
    type: raw.type ?? null,
    stylename: raw.stylename ?? null,
    attribute: raw.attribute ?? null,
    displayName: raw.displayName ?? null,
    default: raw.helpDefault ?? null,
    help: raw.help ?? null,
    helpNote: raw.helpNote ?? null,
    choices: choices === undefined ? null : choices,
    format: raw.format ?? null,
    validDataTypes: Array.isArray(raw.validDataTypes)
      ? raw.validDataTypes
      : null,
    bindable,
    canBeRemoved: raw.canBeRemoved !== false, // default true
    readOnly: raw.readOnly === true,
    hideFormatting: raw.hideFormatting === true,
    multOccur: raw.multOccur === true,
    translate: raw.translate === true,
    formattingProp: raw.formattingProp === true,
    blankChoice: raw.blankChoice === false ? false : null,
    maxLength: typeof raw.maxLength === "number" ? raw.maxLength : null,
    relatedProperties: Array.isArray(raw.relatedProperties)
      ? raw.relatedProperties
      : null,
    label: raw.label ?? null,
    hide: raw.hide === true,
    context: raw.context ?? null,
    appliesTo,
  };

  // Strip null/false/empty noise to keep JSON readable, but keep meaningful
  // defaults (bindable=false, canBeRemoved=false, readOnly=true, etc.).
  for (const [k, v] of Object.entries(entry)) {
    if (v === null) delete entry[k];
    else if (v === false &&
      ["readOnly", "hideFormatting", "multOccur", "translate",
        "formattingProp", "hide"].includes(k)) {
      delete entry[k];
    }
  }
  // canBeRemoved & bindable: default is true; only emit if explicitly false.
  if (entry.canBeRemoved === true) delete entry.canBeRemoved;
  if (entry.bindable === true) delete entry.bindable;

  return entry;
}

// ---------------------------------------------------------------------------
// 4. Merge helpers.

/**
 * Merge a normalised entry into the catalog.  First seen wins for the entry
 * content; appliesTo is unioned across sources.  Returns true if the entry
 * was newly added, false if it was merged into an existing entry.
 *
 * `templateName`: when non-null, this is a template-contributed property
 * (e.g. "css panel"); the entry gets a `template` field on first insert.
 * Subsequent template sources naming the same property only union their
 * widget into appliesTo and are recorded in `collisions` if their shape
 * differs from the first.
 */
function mergeEntry(properties, name, entry, templateName, collisions) {
  const existing = properties[name];
  if (!existing) {
    if (templateName) entry.template = templateName;
    properties[name] = entry;
    return true;
  }
  // Union appliesTo.
  if (existing.appliesTo === "*" || entry.appliesTo === "*") {
    existing.appliesTo = "*";
  } else {
    const set = new Set([
      ...(Array.isArray(existing.appliesTo) ? existing.appliesTo : []),
      ...(Array.isArray(entry.appliesTo) ? entry.appliesTo : []),
    ]);
    existing.appliesTo = [...set].sort();
  }
  // Detect shape mismatch for template-contributed properties.
  if (templateName) {
    const shapeKey = (e) => JSON.stringify({
      type: e.type, choices: e.choices, format: e.format, help: e.help,
    });
    if (shapeKey(existing) !== shapeKey(entry)) {
      collisions.push({
        property: name,
        template: templateName,
        note: "shape differs from first source; keeping first",
      });
    }
  }
  return false;
}

/**
 * Walk a raw descriptor array, splitting category markers from properties,
 * normalising each property, and merging them into `properties`.  Tracks
 * sections globally — categories from later sources extend the section list.
 *
 * `defaultAppliesTo` is passed through to normaliseDescriptor for properties
 * whose `controls` is absent.  `sourceLabel` is a short string used for
 * console logs.
 */
function ingestModel(model, sourceLabel, opts) {
  const {
    properties,
    sections,
    unresolved,
    collisions,
    defaultAppliesTo,
    templateName = null,
    skipGenie = true,
  } = opts;
  let added = 0;
  let merged = 0;
  let droppedGenie = 0;
  let currentCategory = null;
  for (const raw of model) {
    if (raw.category === true) {
      currentCategory = raw.name;
      // Don't duplicate sections that already exist (same name).
      if (!sections.some((s) => s.name === raw.name)) {
        sections.push({
          name: raw.name,
          context: raw.context ?? null,
          appliesTo: Array.isArray(raw.controls)
            ? [...raw.controls].sort()
            : defaultAppliesTo,
        });
      }
      continue;
    }
    if (skipGenie && raw.context === "genie") {
      droppedGenie += 1;
      continue;
    }
    const entry = normaliseDescriptor(
      raw,
      currentCategory,
      unresolved,
      defaultAppliesTo,
    );
    const isNew = mergeEntry(properties, raw.name, entry, templateName, collisions);
    if (isNew) added += 1;
    else merged += 1;
  }
  console.error(
    `  ${sourceLabel}: +${added} new, ${merged} merged (appliesTo unioned), ${droppedGenie} genie dropped`,
  );
  return { added, merged, droppedGenie };
}

// ---------------------------------------------------------------------------
// 5. Main.

function main() {
  console.error("Loading widget data...");

  // 5a. Static extraction of style/type tables.
  const widgetData = {};
  const styleSources = [
    ["buttonStyles", path.join(WIDGETS_DIR, "styled_button.js")],
    ["panelStyles", path.join(WIDGETS_DIR, "panel.js")],
    ["tabStyles", path.join(WIDGETS_DIR, "tab_panel.js")],
    ["chartTypes", path.join(WIDGETS_DIR, "chart.js")],
  ];
  for (const [key, file] of styleSources) {
    try {
      widgetData[key] = extractTopLevelAssignment(file, `pui.widgets.${key}`);
      console.error(`  pui.widgets.${key}: ${Array.isArray(widgetData[key])
        ? widgetData[key].length + " entries"
        : Object.keys(widgetData[key]).length + " keys"}`);
    } catch (err) {
      console.error(`  ! failed to extract pui.widgets.${key}: ${err.message}`);
      widgetData[key] = Array.isArray(widgetData[key]) ? [] : {};
    }
  }

  // 5b. Widget names.
  const widgetNames = extractWidgetNames();
  console.error(`Found ${widgetNames.length} widgets: ${widgetNames.join(", ")}`);

  // 5c. Build sandbox, load Widgets.js, seed data.
  const sandbox = buildSandbox();
  runFileIn(sandbox, WIDGETS_JS);

  // Now pui.widgets exists.  Seed it.
  for (const [key, value] of Object.entries(widgetData)) {
    sandbox.pui.widgets[key] = value;
  }
  // Register all known widgets so getWidgetList(false) returns the right
  // list.  getWidgetList filters out customSizing widgets and "layout"; the
  // grid widget declares customSizing: true, so we mirror that.
  for (const name of widgetNames) {
    const widget = { name };
    if (name === "grid") widget.customSizing = true;
    sandbox.pui.widgets._widgetArray.push(widget);
  }

  // 5d. Run runtime properties.js.
  console.error("Loading runtime/properties.js...");
  runFileIn(sandbox, PROPERTIES_JS);
  const runtimeModel = sandbox.pui.getPropertiesModel();
  if (!Array.isArray(runtimeModel)) {
    throw new Error(`getPropertiesModel() returned ${typeof runtimeModel}`);
  }
  console.error(`  raw descriptors: ${runtimeModel.length}`);

  // 5e. Load the layout namespace + templates + processHTML + properties.js.
  // These together define pui.layout.getPropertiesModel and
  // pui.layout.getProperties(template).
  console.error("Loading widgets/layout/{namespace,templates,processHTML,properties}.js...");
  // namespace.js does `pui.layout = {}` which would clobber anything seeded.
  // Run it first; nothing depends on pre-existing pui.layout in our sandbox.
  runFileIn(sandbox, LAYOUT_NAMESPACE_JS);
  // templates.js sets pui.layout["templates"] and getTemplateList. It does
  // NOT instantiate DOM at top level.
  runFileIn(sandbox, LAYOUT_TEMPLATES_JS);
  // processHTML.js installs pui.layout.template.processHTML — needed for
  // HTML-template fallbacks (simple container, table, mobile device).
  runFileIn(sandbox, LAYOUT_PROCESS_HTML_JS);
  // properties.js installs pui.layout.getPropertiesModel /
  // pui.layout.adoptNamedProperties / pui.layout.getProperties.
  runFileIn(sandbox, LAYOUT_PROPERTIES_JS);

  // 5f. Layout base properties (no template-specific extras).
  const layoutModel = sandbox.pui.layout.getPropertiesModel([]);
  if (!Array.isArray(layoutModel)) {
    throw new Error(`pui.layout.getPropertiesModel() returned ${typeof layoutModel}`);
  }
  console.error(`  layout base raw descriptors: ${layoutModel.length}`);

  // 5g. Per-template properties.  Each pui.layout.getProperties(template)
  // call returns a fresh array containing both the base layout props AND
  // the template-specific props.  We diff against the base layout model
  // (by descriptor identity / name) to isolate template additions.
  const layoutBaseNames = new Set(
    layoutModel.filter((d) => !d.category).map((d) => d.name),
  );
  const templateModels = []; // { template, descriptors: [...] }
  const skippedTemplates = [];
  for (const tpl of LAYOUT_TEMPLATES) {
    let full;
    try {
      full = sandbox.pui.layout.getProperties(tpl);
    } catch (err) {
      skippedTemplates.push({ template: tpl, reason: err.message });
      continue;
    }
    if (!Array.isArray(full)) {
      skippedTemplates.push({
        template: tpl,
        reason: `returned ${typeof full}`,
      });
      continue;
    }
    // Filter out the base layout descriptors — keep only properties unique
    // to this template.  Categories pass through (the "Template Settings"
    // section header is relevant); but we only emit a category if it
    // contains template-specific properties.
    const tplExtras = full.filter((d) => {
      if (d.category === true) return d.name === "Template Settings";
      return !layoutBaseNames.has(d.name);
    });
    templateModels.push({ template: tpl, descriptors: tplExtras });
    console.error(`  template '${tpl}': ${tplExtras.filter((d) => !d.category).length} template-specific descriptors`);
  }

  // 5h. Grid descriptors.  Grid.js is too large to evaluate as a whole;
  // statically extract the getPropertiesModel function expression and
  // evaluate just that in the sandbox.
  console.error("Statically extracting pui.BaseGrid.getPropertiesModel from Grid.js...");
  let gridModel;
  let gridUsedStatic = false;
  try {
    const gridFnSrc = extractFunctionAssignment(GRID_JS, "pui.BaseGrid.getPropertiesModel");
    // Evaluate as an expression to obtain the function value.  The function
    // body only reads pui.* flags and the global `context`; the sandbox
    // already has both.
    const gridFn = vm.runInContext(`(${gridFnSrc})`, sandbox, {
      filename: path.relative(REPO_ROOT, GRID_JS) + "#getPropertiesModel",
    });
    gridModel = gridFn();
    gridUsedStatic = true;
  } catch (err) {
    console.error(`  ! failed to extract grid model: ${err.message}`);
    gridModel = [];
  }
  console.error(`  grid raw descriptors: ${gridModel.length} (static=${gridUsedStatic})`);

  // 5i. Merge all sources.
  const unresolved = [];
  const collisions = [];
  const sections = [];
  const properties = {};

  // Order matters: runtime first (most authoritative, has widest controls).
  console.error("Merging sources...");
  ingestModel(runtimeModel, "runtime", {
    properties, sections, unresolved, collisions,
    defaultAppliesTo: "*",
  });
  ingestModel(layoutModel, "layout", {
    properties, sections, unresolved, collisions,
    defaultAppliesTo: ["layout"],
  });
  ingestModel(gridModel, "grid", {
    properties, sections, unresolved, collisions,
    defaultAppliesTo: ["grid"],
  });
  for (const { template, descriptors } of templateModels) {
    // Template-specific properties default to ["layout"] (templates are
    // layout-scoped) PLUS, for the "css panel" template specifically, also
    // the "panel" and "css panel" widgets, since real RDFs use
    // header-text/header-theme/etc. on widgets named `panel` or `css panel`
    // — and the runtime catalog already has its non-text companions
    // (`has header`, `header height`, etc.) on `["css panel", "layout"]`.
    let templateAppliesTo;
    if (template === "css panel") templateAppliesTo = ["css panel", "layout", "panel"];
    else if (template === "tab panel") templateAppliesTo = ["layout", "tab panel"];
    else if (template === "fieldset") templateAppliesTo = ["field set panel", "layout"];
    else if (template === "accordion") templateAppliesTo = ["layout"];
    else templateAppliesTo = ["layout"];
    ingestModel(descriptors, `template:${template}`, {
      properties, sections, unresolved, collisions,
      defaultAppliesTo: templateAppliesTo,
      templateName: template,
    });
  }

  // 5j. Stats.
  const propCount = Object.keys(properties).length;
  const universal = Object.values(properties).filter(
    (p) => p.appliesTo === "*",
  ).length;
  const widgetSpecific = propCount - universal;
  const layoutCount = Object.values(properties).filter(
    (p) => Array.isArray(p.appliesTo) && p.appliesTo.includes("layout"),
  ).length;
  const gridCount = Object.values(properties).filter(
    (p) => Array.isArray(p.appliesTo) && p.appliesTo.includes("grid"),
  ).length;
  const templateCount = Object.values(properties).filter(
    (p) => p.template,
  ).length;

  // 5k. Source SHA.
  let sourceCommit = null;
  try {
    sourceCommit = execSync(`git -C '${CLIENT_ROOT}' rev-parse HEAD`, {
      encoding: "utf8",
    }).trim();
  } catch {
    /* not a git repo / no git */
  }

  // 5l. Emit.
  const catalog = {
    generatedAt: new Date().toISOString(),
    sourceFile: SOURCE_REL,
    sourceFiles: [
      SOURCE_REL,
      path.relative(REPO_ROOT, LAYOUT_PROPERTIES_JS),
      path.relative(REPO_ROOT, GRID_JS),
    ],
    sourceCommit,
    description:
      "Profound UI Rich Display File (DSPF) property catalog. " +
      "Generated by skill/tools/extract-properties.mjs from runtime/properties.js " +
      "PLUS widgets/layout/properties.js (layout widget + template-specific props) " +
      "PLUS widgets/grid/Grid.js (grid widget). " +
      "Each property entry's `appliesTo` lists the widget types it applies to " +
      "(`*` = all widgets). `bindable: false` means the property cannot be " +
      "bound to a program field. `template` (if present) names the layout " +
      "template that originally introduced this property.",
    widgets: widgetNames,
    sections,
    properties,
  };
  writeFileSync(OUT_PATH, JSON.stringify(catalog, null, 2) + "\n");

  console.error("");
  console.error(`Wrote ${OUT_PATH}`);
  console.error(`  total properties:        ${propCount}`);
  console.error(`  universal (appliesTo=*): ${universal}`);
  console.error(`  widget-specific:         ${widgetSpecific}`);
  console.error(`  layout-related:          ${layoutCount}`);
  console.error(`  grid-related:            ${gridCount}`);
  console.error(`  template-contributed:    ${templateCount}`);
  console.error(`  unresolved choices:      ${unresolved.length}`);
  console.error(`  widget types:            ${widgetNames.length}`);
  if (skippedTemplates.length > 0) {
    console.error(`  skipped templates: ${skippedTemplates.length}`);
    for (const s of skippedTemplates) {
      console.error(`    - ${s.template}: ${s.reason}`);
    }
  }
  if (collisions.length > 0) {
    console.error(`  property-name collisions across templates: ${collisions.length}`);
    for (const c of collisions) {
      console.error(`    - ${c.property} (${c.template}): ${c.note}`);
    }
  }
  if (unresolved.length > 0) {
    console.error("Unresolved details:");
    for (const u of unresolved) {
      console.error(`  - ${u.name}: ${u.reason}`);
    }
  }
}

main();
