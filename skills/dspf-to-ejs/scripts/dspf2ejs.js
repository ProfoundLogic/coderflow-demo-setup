#!/usr/bin/env node
/* Convert a 5250 display file into a Profound UI EJS Rich Display screen set.
 *
 *   node scripts/dspf2ejs.js --dspf qddssrc/wrkcustd.dspf \
 *                            --brand brand.json \
 *                            --app-dir wrkcustx \
 *                            --out-json cfdemo/qddssrc/wrkcustx.json \
 *                            --out-assets htdocs/profoundui/userdata/html/wrkcustx
 *
 * Writes:
 *   <out-json>                Rich Display JSON source for codermake
 *   <out-assets>/<format>.ejs template per screen format
 *   <out-assets>/<format>.css screen-specific overrides
 *   <out-assets>/<format>.js  table sort/row-click, when the screen has a subfile
 *   <out-assets>/MIGRATION.md what the RPG program must change
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { parseDspf } = require('./lib/dds-parse');
const { planScreen, humanize } = require('./lib/layout');
const { buildJson, generateTemplate, generateScreenCss, generateScreenJs } = require('./lib/generate');
const { mergeBrand } = require('./lib/brand');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const has = (name) => process.argv.includes('--' + name);

const dspfPath = arg('dspf');
if (!dspfPath) {
  console.error('usage: dspf2ejs.js --dspf <file.dspf> --brand <brand.json> --app-dir <name>');
  console.error('                   --out-json <file.json> --out-assets <dir> [--version N] [--dry-run]');
  process.exit(2);
}

const brandPath = arg('brand');
const brand = mergeBrand(brandPath && fs.existsSync(brandPath)
  ? JSON.parse(fs.readFileSync(brandPath, 'utf8'))
  : {});

const appDir = arg('app-dir', path.basename(dspfPath, path.extname(dspfPath)));
const urlBase = arg('url-base', '/profoundui/userdata/html');
const outAssets = arg('out-assets', path.join('htdocs/profoundui/userdata/html', appDir));
const outJson = arg('out-json', path.join('qddssrc', appDir + '.json'));
const version = arg('version', '1');
const dryRun = has('dry-run');

const source = fs.readFileSync(dspfPath, 'utf8');
const model = parseDspf(source);
const plan = planScreen(model);

const b = {
  ...brand,
  assetUrl: `${urlBase}/${appDir}`,
  version,
  subtitle: arg('subtitle', brand.subtitle || ''),
};

const opts = {
  urlBase,
  appDir,
  version,
  clearField: arg('clear-field', 'sflclear'),
  dropLegend: true,
  title: arg('title', null),
};

const json = buildJson(model, plan, opts);

/* ------------------------------------------------------------ emit + report */

const written = [];
function write(file, content) {
  written.push({ file, bytes: Buffer.byteLength(content) });
  if (dryRun) return;
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

write(outJson, JSON.stringify(json, null, 2) + '\n');

const rendered = [];
for (const p of plan.plans) {
  if (p.role === 'messages' || p.role === 'footer' || p.role === 'fragment') continue;
  const name = p.format.name.toLowerCase();
  write(path.join(outAssets, name + '.ejs'), generateTemplate(b, p));
  write(path.join(outAssets, name + '.css'), generateScreenCss(b, p));
  const js = generateScreenJs(b, p);
  if (js) write(path.join(outAssets, name + '.js'), js);
  rendered.push(p);
}

/* ------------------------------------------------------------- migration */

function migrationDoc() {
  let step = 0;
  const h = (text) => `## ${++step}. ${text}`;

  const lines = [
    `# RPG migration notes — ${path.basename(dspfPath)}`,
    '',
    'The generated screens are **EJS Rich Display** formats. This is what the',
    'RPG program driving them has to change.',
    '',
    h('Declare the Open Access handler'),
    '',
    '```rpgle',
    `dcl-f ${appDir} workstn${plan.plans.some((p) => p.table) ? ' sfile(<subfile> : rrn)' : ''} handler('PROFOUNDUI(HANDLER)');`,
    '```',
    '',
    h('Replace function-key indicators with the `action` field'),
    '',
    'EJS formats do not carry DDS response indicators. Buttons post an `action`',
    'value instead, so indicator tests become string tests.',
    '',
    '| Format | Key | Old test | New test |',
    '|---|---|---|---|',
  ];

  for (const p of rendered) {
    for (const k of p.fkeys || []) {
      const action = (k.label || `F${k.num}`).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `F${k.num}`;
      const ind = k.indicator == null ? '??' : String(k.indicator).padStart(2, '0');
      lines.push(`| ${p.format.name} | ${k.key} | \`*in${ind}\` | \`action = '${action}'\` |`);
    }
  }

  lines.push('', '```rpgle', '// before', 'if *in03;', '  leave;', 'endif;', '',
    '// after', "if action = 'EXIT';", '  leave;', 'endif;', '```', '');

  const legendFields = [...new Set(rendered.flatMap((p) => (p.analysis ? p.analysis.legendFields : [])))];
  if (legendFields.length) {
    lines.push(h('Function-key legend fields are no longer needed'), '',
      `The generated screens render real buttons, so ${legendFields.map((f) => '`' + f + '`').join(', ')} `
      + 'is not part of the Rich Display source. Leave the RPG assignment in place '
      + '(harmless) or delete it.', '');
  }

  const tables = rendered.filter((p) => p.table);
  if (tables.length) {
    lines.push(h('Subfile clear indicator becomes a field'), '');
    for (const p of tables) {
      lines.push(`- **${p.format.name}**: DDS used indicator `
        + `\`*in${String(p.table.clearIndicator || 0).padStart(2, '0')}\` for SFLCLR. `
        + `The Rich Display source declares a \`${opts.clearField}\` character field instead — `
        + `set it to \`'1'\` before writing the control record to clear, \`'0'\` to load.`);
    }
    lines.push('');
    lines.push('```rpgle', 'begsr clearSFL;', '  rrn = 0;', `  ${opts.clearField} = '1';`,
      '  write <ctlformat>;', `  ${opts.clearField} = '0';`, 'endsr;', '```', '');
  }

  lines.push(h('Screens that were dropped'), '');
  const dropped = plan.plans.filter((p) => ['messages', 'footer', 'fragment'].includes(p.role));
  if (dropped.length) {
    for (const p of dropped) {
      const why = p.role === 'messages'
        ? 'message subfile — render messages through the `msg` field on each screen instead'
        : p.role === 'footer'
          ? 'function-key footer record — replaced by real buttons on each screen'
          : 'no displayable content';
      lines.push(`- \`${p.format.name}\` (${why})`);
    }
  } else {
    lines.push('_None._');
  }
  lines.push('');
  lines.push('If the program writes any of these records, remove those writes.');
  lines.push('');
  lines.push(h('The `msg` field'), '');
  lines.push('Every generated template renders `msg` when it is non-blank, and the');
  lines.push('Rich Display source declares it for you. Assign it in RPG wherever the');
  lines.push('old program sent a message to the message subfile.');
  return lines.join('\n') + '\n';
}

write(path.join(outAssets, 'MIGRATION.md'), migrationDoc());

/* ------------------------------------------------------------------ report */

console.log(`source : ${dspfPath}`);
console.log(`brand  : ${brandPath || '(defaults)'}  prefix "${brand.prefix}"`);
console.log(`formats:`);
for (const p of plan.plans) {
  const detail = p.role === 'list'
    ? `table ${p.table.subfileName} (${p.table.columns.length} cols)`
    : p.role === 'form'
      ? `${p.analysis.sections.length} section(s), ${p.analysis.inputCount} input(s)`
      : '';
  const mark = ['messages', 'footer', 'fragment'].includes(p.role) ? 'skip' : ' gen';
  console.log(`  [${mark}] ${p.format.name.padEnd(12)} ${p.role.padEnd(9)} ${detail}`);
}
console.log(`\n${dryRun ? 'would write' : 'wrote'}:`);
for (const w of written) console.log(`  ${String(w.bytes).padStart(6)}  ${w.file}`);
console.log(`\nNext:`);
console.log(`  1. node scripts/build-theme.js --brand ${brandPath || 'brand.json'} --out ${outAssets}`);
console.log(`  2. node scripts/preflight.js --assets ${outAssets} --json ${outJson}`);
console.log(`  3. review ${path.join(outAssets, 'MIGRATION.md')} and update the RPG`);
