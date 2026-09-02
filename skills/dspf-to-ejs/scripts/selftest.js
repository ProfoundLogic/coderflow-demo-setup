#!/usr/bin/env node
/* Self-test for the dspf-to-ejs toolchain.
 *
 *   node scripts/selftest.js --corpus <dir-of-dspf-files> [--keep]
 *
 * Runs the whole pipeline over a corpus of real display files and asserts the
 * things that actually break in production:
 *
 *   - the DDS parser recovers formats, types, continuation lines and F-keys
 *   - the layout analyser matches subfile headings to the right columns,
 *     including right-aligned numeric columns
 *   - generated JSON declares every identifier the template uses
 *   - identifier audit, render, overflow and padding-collapse checks pass
 *   - the padding-collapse guard actually FAILS when the bug is reintroduced
 *     (a check that never fails is not a check)
 *
 * Exit 0 = all green.
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const { parseDspf } = require('./lib/dds-parse');
const { planScreen } = require('./lib/layout');
const { renderTheme, auditBrand, mergeBrand, contrast, darken, lighten } = require('./lib/brand');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const HERE = __dirname;
const ROOT = path.join(HERE, '..');
const corpus = arg('corpus', path.join(ROOT, 'examples', 'dspf'));
const keep = process.argv.includes('--keep');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'dspf2ejs-selftest-'));

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    pass++;
    console.log(`  ok    ${name}`);
  } else {
    fail++;
    failures.push(`${name}${detail ? ' — ' + detail : ''}`);
    console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
  }
}

function eq(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  check(name, a === e, a === e ? '' : `got ${a}, want ${e}`);
}

function node(script, args) {
  return execFileSync(process.execPath, [path.join(HERE, script), ...args], {
    encoding: 'utf8',
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function nodeStatus(script, args) {
  try {
    execFileSync(process.execPath, [path.join(HERE, script), ...args], {
      encoding: 'utf8', env: process.env, stdio: ['ignore', 'pipe', 'pipe'],
    });
    return 0;
  } catch (e) {
    return e.status == null ? -1 : e.status;
  }
}

const file = (n) => path.join(corpus, n);
const exists = (n) => fs.existsSync(file(n));

/* ==================================================== 1. colour utilities */
console.log('\n[1] brand colour maths');
{
  eq('darken(#d60000, 0.5) is half-way to black', darken('#d60000', 0.5), '#6b0000');
  eq('lighten(#000000, 0.5) is mid grey', lighten('#000000', 0.5), '#808080');
  check('white-on-white contrast is 1', Math.abs(contrast('#ffffff', '#ffffff') - 1) < 0.001);
  check('black-on-white contrast is 21', Math.abs(contrast('#000000', '#ffffff') - 21) < 0.01);
  check('3-digit hex expands', darken('#fff', 0) === '#ffffff', darken('#fff', 0));

  const problems = auditBrand({ colors: { accent: '#ffe600' } });
  check('contrast audit flags white text on yellow',
    problems.some((p) => /white text on accent/.test(p)));
  const clean = auditBrand(JSON.parse(
    fs.readFileSync(path.join(ROOT, 'examples', 'brand.taylor.json'), 'utf8')));
  check('example brand passes contrast audit', clean.length === 0, clean.join(' | '));
}

/* ============================================================ 2. theme render */
console.log('\n[2] theme rendering');
{
  const tpl = fs.readFileSync(path.join(ROOT, 'assets', 'theme.css'), 'utf8');
  const brand = mergeBrand(JSON.parse(
    fs.readFileSync(path.join(ROOT, 'examples', 'brand.taylor.json'), 'utf8')));
  const css = renderTheme(tpl, brand);

  check('no unreplaced {{tokens}} remain', !/\{\{\w+\}\}/.test(css),
    (css.match(/\{\{\w+\}\}/g) || []).join(','));
  check('accent reached the stylesheet', css.includes('#d60000'));
  check('prefix applied to component classes', css.includes('.tg-card'));
  check('padding reset is scoped to unclassed divs',
    css.includes('div:not([class]) { padding: 0; }'));
  check('blanket padding reset is absent',
    !/\.tg-screen div \{[^}]*padding: 0/.test(css));

  let threw = false;
  try { renderTheme('a { b: {{doesNotExist}} }', brand); } catch (e) { threw = true; }
  check('unknown token throws rather than emitting literal braces', threw);
}

/* ============================================================ 3. DDS parser */
console.log('\n[3] DDS parser');
if (exists('wrkcustd.dspf')) {
  const m = parseDspf(fs.readFileSync(file('wrkcustd.dspf'), 'utf8'));
  eq('format names', m.formats.map((f) => f.name),
    ['CUSTSFL', 'CUSTCTL', 'CUSTFOOT', 'CUSTNONE', 'CUSTMSGSFL', 'CUSTMSGCTL']);
  const ctl = m.formats.find((f) => f.name === 'CUSTCTL');
  eq('SFLCTL binds its subfile', ctl.subfileOf, 'CUSTSFL');
  eq('SFLPAG parsed', ctl.sflpag, 7);
  eq('CA03 label parsed', ctl.fkeys.map((k) => [k.key, k.label, k.indicator]), [['F3', 'Exit', 3]]);
  const msgctl = m.formats.find((f) => f.name === 'CUSTMSGCTL');
  check('message subfile detected', msgctl.isMessageCtl === true);
}
if (exists('wrkcust1d.dspf')) {
  const m = parseDspf(fs.readFileSync(file('wrkcust1d.dspf'), 'utf8'));
  const d = m.formats[0];
  const byName = Object.fromEntries(d.fields.map((f) => [f.name, f]));
  eq('packed/zoned decimals', [byName.slimit.jsonType, byName.slimit.length, byName.slimit.decimals],
    ['zoned', 11, 2]);
  eq('usage B means input', byName.sname.input, true);
  eq('usage O means output', byName.sbalance.input, false);
  check('conditioned DSPATR(PR) recovered', !!byName.sname.readonlyWhen);
  check('CHECK(LC) recovered', byName.sname.allowsLower === true);
  const cont = d.constants.find((c) => /Suspended/.test(c.text));
  eq('continued constant joined', cont && cont.text, '(A=Active, I=Inactive, S=Suspended)');
  const win = m.formats.find((f) => f.name === 'ERRORWIN');
  check('WINDOW keyword captured', !!win.window);
  check('usage P field marked hidden', win.fields.find((f) => f.name === 'serrattr').hidden === true);
}

/* ========================================================= 4. layout analysis */
console.log('\n[4] layout analysis');
if (exists('wrkcustd.dspf')) {
  const plan = planScreen(parseDspf(fs.readFileSync(file('wrkcustd.dspf'), 'utf8')));
  const ctl = plan.plans.find((p) => p.format.name === 'CUSTCTL');
  eq('list role', ctl.role, 'list');
  eq('subfile headings matched', ctl.table.columns.map((c) => c.heading),
    ['Opt', 'Cust #', 'Name', 'Primary Email', 'Phone', 'Address']);
  eq('option column identified', ctl.table.optionColumn.field.name, 'sopt');
  eq('screen title recovered', ctl.analysis.title, 'Work with Customers');
  check('column headings did not leak into sections',
    !ctl.analysis.sections.some((s) => s.heading === 'Phone'),
    JSON.stringify(ctl.analysis.sections.map((s) => s.heading)));
  const foot = plan.plans.find((p) => p.format.name === 'CUSTFOOT');
  check('F-key legend record is not rendered', ['fragment', 'footer'].includes(foot.role), foot.role);
}
if (exists('inq01d.dspf')) {
  const plan = planScreen(parseDspf(fs.readFileSync(file('inq01d.dspf'), 'utf8')));
  const ctl = plan.plans.find((p) => p.format.name === 'PRODCTL');
  /* Price and Qty headings sit to the RIGHT of their right-aligned numeric
     columns; a left-only match assigns them to the wrong field. */
  eq('right-aligned numeric headings matched', ctl.table.columns.map((c) => c.heading),
    ['Opt', 'Product', 'Product Name', 'Price', 'Qty']);
  eq('option legend lifted out of the sections', ctl.analysis.optionLegends,
    ['1=Select to view details']);
  const win = plan.plans.find((p) => p.format.name === 'FEATWIN');
  check('window F-key legend not taken as a title', win.analysis.title !== 'F12=Cancel',
    String(win.analysis.title));
}
if (exists('wrkcust1d.dspf')) {
  const plan = planScreen(parseDspf(fs.readFileSync(file('wrkcust1d.dspf'), 'utf8')));
  const d = plan.plans.find((p) => p.format.name === 'CUSTDETAIL');
  eq('form role', d.role, 'form');
  eq('sections split on the heading constant',
    d.analysis.sections.map((s) => s.heading), [null, 'Primary Contact']);
  const addr2 = d.analysis.sections[1].pairs.find((p) => p.field.name === 'saddr2');
  check('unlabelled address line 2 marked as a continuation', addr2 && addr2.continuesPrevious === true);
  const win = plan.plans.find((p) => p.format.name === 'ERRORWIN');
  eq('window becomes a dialog', win.role, 'dialog');
}

/* ============================================== 5. generation + preflight */
console.log('\n[5] generation and preflight');
const brandFile = path.join(ROOT, 'examples', 'brand.taylor.json');
const generated = [];

for (const dspf of fs.readdirSync(corpus).filter((f) => f.endsWith('.dspf'))) {
  const app = path.basename(dspf, '.dspf');
  const assets = path.join(work, app);
  const jsonOut = path.join(work, app + '.json');

  try {
    node('dspf2ejs.js', [
      '--dspf', file(dspf), '--brand', brandFile, '--app-dir', app,
      '--out-json', jsonOut, '--out-assets', assets,
    ]);
    node('build-theme.js', ['--brand', brandFile, '--out', assets]);
    check(`${dspf}: generated`, fs.existsSync(jsonOut));
    generated.push({ dspf, app, assets, jsonOut });
  } catch (e) {
    check(`${dspf}: generated`, false, (e.stderr || e.message || '').split('\n')[0]);
  }
}

/* Every identifier a template uses must be declared in the display file. */
for (const g of generated) {
  const src = JSON.parse(fs.readFileSync(g.jsonOut, 'utf8'));
  for (const [name, fmt] of Object.entries(src.formats || {})) {
    check(`${g.app}/${name}: msg declared`, 'msg' in (fmt.fields || {}));
    check(`${g.app}/${name}: action declared`, 'action' in (fmt.fields || {}));
    check(`${g.app}/${name}: theme.css listed first`,
      (fmt.css || [])[0] && /theme\.css/.test(fmt.css[0]));
    if (fmt.subfiles) {
      const clear = Object.values(fmt.subfiles)[0].clear;
      check(`${g.app}/${name}: subfile clear field declared`, clear in (fmt.fields || {}));
    }
  }
}

/* Faithful numeric formatting: no thousands separators without an edit code. */
{
  const g = generated.find((x) => x.app === 'wrkcustd');
  if (g) {
    const tpl = fs.readFileSync(path.join(g.assets, 'custctl.ejs'), 'utf8');
    check('customer number renders without thousands separators',
      /row\.scustno[^\n]*useGrouping: false/.test(tpl));
  }
  const g1 = generated.find((x) => x.app === 'wrkcust1d');
  if (g1) {
    const tpl = fs.readFileSync(path.join(g1.assets, 'custdetail.ejs'), 'utf8');
    check('EDTCDE(P) money keeps 2 decimals',
      /sbalance[^\n]*minimumFractionDigits: 2/.test(tpl));
    check('conditioned read-only became a guarded attribute',
      /flags\[30\] !== '1'[^\n]*%> *readonly|readonly/.test(tpl) && tpl.includes("flags[30]"));
  }
}

/* Full browser preflight. */
for (const g of generated) {
  const status = nodeStatus('preflight.js', [
    '--json', g.jsonOut, '--assets', g.assets, '--out', path.join(work, 'pf-' + g.app),
  ]);
  check(`${g.app}: preflight passes`, status === 0, `exit ${status}`);
}

/* ================================ 6. negative test: the guard must fail loudly */
console.log('\n[6] negative test — reintroduce the padding-collapse bug');
{
  const g = generated.find((x) => x.app === 'wrkcust1d') || generated[0];
  if (g) {
    const themeFile = path.join(g.assets, 'theme.css');
    const good = fs.readFileSync(themeFile, 'utf8');
    fs.writeFileSync(themeFile,
      good.replace('div:not([class]) { padding: 0; }', 'div { padding: 0; }'));

    const status = nodeStatus('preflight.js', [
      '--json', g.jsonOut, '--assets', g.assets, '--out', path.join(work, 'pf-negative'),
    ]);
    check('preflight FAILS when a reset out-specifies component padding',
      status === 1, `exit ${status} (expected 1)`);

    fs.writeFileSync(themeFile, good);
    const back = nodeStatus('preflight.js', [
      '--json', g.jsonOut, '--assets', g.assets, '--out', path.join(work, 'pf-restored'),
    ]);
    check('preflight passes again once the reset is scoped', back === 0, `exit ${back}`);
  }
}

/* ======================= 7. negative test: undeclared identifier must fail */
console.log('\n[7] negative test — template referencing an undeclared field');
{
  const g = generated.find((x) => x.app === 'wrkcust1d') || generated[0];
  if (g) {
    const tplFile = path.join(g.assets, 'custdetail.ejs');
    const good = fs.readFileSync(tplFile, 'utf8');
    fs.writeFileSync(tplFile, good.replace('<main', '<span><%= fieldThatDoesNotExist %></span>\n  <main'));

    const status = nodeStatus('preflight.js', [
      '--json', g.jsonOut, '--assets', g.assets, '--out', path.join(work, 'pf-undeclared'),
    ]);
    check('preflight FAILS on an undeclared identifier', status === 1, `exit ${status} (expected 1)`);
    fs.writeFileSync(tplFile, good);
  }
}

/* ======================================================================= */
console.log('\n' + '='.repeat(64));
console.log(`passed ${pass}, failed ${fail}`);
if (failures.length) {
  console.log('\nfailures:');
  for (const f of failures) console.log('  - ' + f);
}
if (keep) console.log(`\nartifacts kept in ${work}`);
else fs.rmSync(work, { recursive: true, force: true });

process.exit(fail ? 1 : 0);
