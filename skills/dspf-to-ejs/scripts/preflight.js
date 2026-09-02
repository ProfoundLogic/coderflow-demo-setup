#!/usr/bin/env node
/* Pre-flight every generated screen before it goes near IBM i.
 *
 *   node scripts/preflight.js --json wrkcustx.json --assets htdocs/.../wrkcustx
 *                             [--data sample.json] [--out /tmp/preflight] [--open]
 *
 * Three checks, because each catches a class the others miss:
 *
 *   1. IDENTIFIER AUDIT  Every bare identifier in the template must resolve to
 *      a field declared in the Rich Display JSON. A template referring to a
 *      field the display file does not declare throws at render time and takes
 *      the WHOLE screen down — a white page, with nothing in any joblog.
 *
 *   2. RENDER            Render with real-shaped sample data in headless
 *      Chromium and fail on any uncaught JS error.
 *
 *   3. LAYOUT            Fail on horizontal overflow at desktop and tablet
 *      widths, which is how translated screens spill off the right edge.
 */
'use strict';

const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const has = (n) => process.argv.includes('--' + n);

const jsonPath = arg('json');
const assetDir = arg('assets');
const outDir = arg('out', '/tmp/preflight');
const dataPath = arg('data');
const widths = arg('widths', '1440,900').split(',').map(Number);

if (!jsonPath || !assetDir) {
  console.error('usage: preflight.js --json <richdisplay.json> --assets <dir> [--data sample.json]');
  process.exit(2);
}

let ejs;
let chromium;
try {
  ejs = require('ejs');
} catch (e) {
  console.error('Missing dependency "ejs".  npm install ejs playwright-core');
  process.exit(3);
}
try {
  ({ chromium } = require('playwright-core'));
} catch (e) {
  chromium = null;
}

/* ------------------------------------------------------- identifier audit */

const KEYWORDS = new Set([
  'var', 'let', 'const', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'typeof', 'instanceof', 'new', 'true', 'false', 'null', 'undefined', 'this', 'in',
  'of', 'break', 'continue', 'switch', 'case', 'default', 'try', 'catch', 'finally',
  'throw', 'delete', 'void', 'Math', 'Number', 'String', 'Date', 'Array', 'Object',
  'JSON', 'RegExp', 'Boolean', 'Intl', 'encodeURIComponent', 'decodeURIComponent',
  'isNaN', 'parseInt', 'parseFloat', 'console',
]);

/* Strip literals and comments so only real identifiers remain.
   Order matters: strings first, because a URL like 'https://x' contains "//"
   and would otherwise be eaten by the line-comment rule, desyncing every
   quote after it. Block comments next, then line comments, then regexes —
   a "+/-" inside a block comment otherwise looks like a regex literal and
   swallows the comment terminator. */
function stripLiterals(src) {
  return src
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, ' ')
    .replace(/\/(?:[^/\\\n]|\\.)+\/[gimsuy]*/g, '/0/');
}

function auditTemplate(tpl, allowed) {
  const scriptlets = [...tpl.matchAll(/<%[-=_]?([\s\S]*?)[-_]?%>/g)].map((m) => m[1]);
  const declared = new Set();
  const used = new Set();

  for (const raw of scriptlets) {
    const code = stripLiterals(raw);

    for (const m of code.matchAll(/\b(?:var|let|const)\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
    /* multi-declarator with no initialisers: var a, b, c; */
    for (const m of code.matchAll(
      /\b(?:var|let|const)\s+([A-Za-z_$][\w$]*(?:\s*,\s*[A-Za-z_$][\w$]*)+)\s*;/g
    )) m[1].split(',').forEach((p) => declared.add(p.trim()));
    for (const m of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) declared.add(m[1]);
    for (const m of code.matchAll(/\bfunction\s*[\w$]*\s*\(([^)]*)\)/g)) {
      m[1].split(',').map((s) => s.trim().split('=')[0].trim()).filter(Boolean)
        .forEach((p) => declared.add(p));
    }
    /* arrow params: (a, b) => and a => */
    for (const m of code.matchAll(/\(([^)]*)\)\s*=>/g)) {
      m[1].split(',').map((s) => s.trim().split('=')[0].trim()).filter(Boolean)
        .forEach((p) => declared.add(p));
    }
    for (const m of code.matchAll(/\b([A-Za-z_$][\w$]*)\s*=>/g)) declared.add(m[1]);

    const stripped = code
      .replace(/\.\s*[A-Za-z_$][\w$]*/g, '')
      .replace(/([{,]\s*)[A-Za-z_$][\w$]*\s*:/g, '$1');
    for (const m of stripped.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) used.add(m[1]);
  }

  return [...used]
    .filter((id) => !declared.has(id) && !KEYWORDS.has(id) && !allowed.has(id))
    .sort();
}

/* --------------------------------------------------------- sample records */

function sampleValue(name, def, i) {
  if (def.type === 'char') {
    const len = def.length || 10;
    if (/mail/i.test(name)) return `sample.person${i}@example.com`.slice(0, len);
    if (/phone|tel/i.test(name)) return '555-0100'.slice(0, len);
    if (/date/i.test(name)) return '01/15/2026'.slice(0, len);
    if (/state/i.test(name)) return 'TX'.slice(0, len);
    if (/zip|postal/i.test(name)) return '77003'.slice(0, len);
    if (len <= 2) return 'A'.slice(0, len);
    /* Fill to the declared width: a field that only breaks at full length is
       exactly the field that breaks in production. */
    const base = `${name.toUpperCase()} sample value ${i} `;
    return base.repeat(Math.ceil(len / base.length)).slice(0, len);
  }
  const whole = Math.max(1, (def.length || 6) - (def.decimals || 0));
  const n = Number(String(i + 1).repeat(Math.min(whole, 6)).slice(0, Math.min(whole, 6)));
  return def.decimals ? Number((n + 0.75).toFixed(def.decimals)) : n;
}

function buildContext(format, override) {
  const ctx = { flags: {} };
  for (let i = 0; i < 100; i++) ctx.flags[i] = '0';

  for (const [name, def] of Object.entries(format.fields || {})) {
    ctx[name] = sampleValue(name, def, 1);
  }
  /* Messages and the subfile-clear flag look better empty by default. */
  if ('msg' in ctx) ctx.msg = '';
  if ('sflclear' in ctx) ctx.sflclear = '0';
  if ('action' in ctx) ctx.action = '';

  for (const [sflName, sfl] of Object.entries(format.subfiles || {})) {
    const rows = [];
    for (let r = 1; r <= 6; r++) {
      const row = { _rrn: r };
      for (const [name, def] of Object.entries(sfl.fields || {})) {
        row[name] = /opt$|^opt/i.test(name) ? '' : sampleValue(name, def, r);
      }
      rows.push(row);
    }
    ctx[sflName] = rows;
  }

  /* Uppercase mirrors, as the Profound UI runtime provides. */
  for (const k of Object.keys(ctx)) {
    if (k !== 'flags' && typeof ctx[k] !== 'object') ctx[k.toUpperCase()] = ctx[k];
  }
  return Object.assign(ctx, override || {});
}

function allowedIdentifiers(format) {
  const s = new Set(['flags', 'row', '_rrn', 'locals', 'it']);
  for (const n of Object.keys(format.fields || {})) { s.add(n); s.add(n.toUpperCase()); }
  for (const [sflName, sfl] of Object.entries(format.subfiles || {})) {
    s.add(sflName); s.add(sflName.toUpperCase());
    if (sfl.clear) { s.add(sfl.clear); s.add(sfl.clear.toUpperCase()); }
    for (const n of Object.keys(sfl.fields || {})) { s.add(n); s.add(n.toUpperCase()); }
  }
  return s;
}

/* ------------------------------------------------------------------- main */

function localAsset(url) {
  return path.join(assetDir, path.basename(String(url).split('?')[0]));
}

async function main() {
  const src = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const override = dataPath ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : null;
  fs.mkdirSync(outDir, { recursive: true });

  let failures = 0;
  const results = [];

  for (const [fmtName, format] of Object.entries(src.formats || {})) {
    const tplFile = localAsset(format.template);
    if (!fs.existsSync(tplFile)) {
      console.log(`FAIL  ${fmtName}: template not found at ${tplFile}`);
      failures++;
      continue;
    }
    const tpl = fs.readFileSync(tplFile, 'utf8');

    /* 1. identifier audit */
    const allowed = allowedIdentifiers(format);
    const unknown = auditTemplate(tpl, allowed);
    if (unknown.length) {
      console.log(`FAIL  ${fmtName}: template uses identifiers the display file does not declare:`);
      console.log(`        ${unknown.join(', ')}`);
      console.log(`        Add them to "fields" in ${path.basename(jsonPath)}, or remove the reference.`);
      failures++;
    } else {
      console.log(`ok    ${fmtName}: identifier audit clean`);
    }

    /* 2. render */
    const ctx = buildContext(format, override && override[fmtName]);
    let html;
    try {
      html = ejs.render(tpl, ctx);
    } catch (e) {
      console.log(`FAIL  ${fmtName}: EJS render threw — ${e.message.split('\n')[0]}`);
      failures++;
      continue;
    }

    const cssFiles = (format.css || []).map(localAsset).filter((f) => fs.existsSync(f));
    const missingCss = (format.css || []).filter((u) => !fs.existsSync(localAsset(u)));
    for (const m of missingCss) {
      console.log(`WARN  ${fmtName}: stylesheet listed in JSON is missing on disk — ${m}`);
    }
    const jsFiles = (format.js || []).map(localAsset).filter((f) => fs.existsSync(f));

    const css = cssFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    const js = jsFiles.map((f) => fs.readFileSync(f, 'utf8')).join('\n');

    const page = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0}</style>
<style>${css}</style></head><body>
<script>window.pui = { submit: function () {} };</script>
${html}
${js ? `<script>${js}</script>` : ''}
</body></html>`;

    /* Collect single-class rules that declare a non-zero padding, so the
       browser pass can confirm each one survived the cascade. */
    const declaredPadding = [];
    const seenSel = new Set();
    for (const m of css.matchAll(/(^|\})\s*(\.[\w-]+)\s*\{([^}]*)\}/g)) {
      const selector = m[2];
      const body = m[3];
      const pad = /(?:^|;)\s*padding\s*:\s*([^;]+)/.exec(body);
      if (!pad) continue;
      if (/^\s*0(px)?(\s+0(px)?)*\s*$/.test(pad[1])) continue;
      if (seenSel.has(selector)) continue;
      seenSel.add(selector);
      declaredPadding.push([selector, pad[1].trim()]);
    }

    const htmlFile = path.join(outDir, `${fmtName}.html`);
    /* Rewrite served asset paths to the on-disk directory so images resolve. */
    const assetUrlBase = path.dirname(String(format.template).split('?')[0]);
    fs.writeFileSync(
      htmlFile,
      page.split(assetUrlBase + '/').join(path.resolve(assetDir) + '/')
    );
    results.push({ fmtName, htmlFile, declaredPadding });
  }

  /* 3. browser render + overflow */
  if (!chromium) {
    console.log('\nWARN  playwright-core not installed: skipped browser render and');
    console.log('      overflow checks. npm install playwright-core to enable them.');
    console.log(`\n${failures ? 'FAILURES: ' + failures : 'static checks passed'}`);
    process.exit(failures ? 1 : 0);
  }

  const exe = process.env.CHROMIUM_PATH;
  const browser = await chromium.launch({
    executablePath: exe || undefined,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  for (const r of results) {
    for (const width of widths) {
      const p = await browser.newPage({ viewport: { width, height: 900 } });
      const errors = [];
      p.on('pageerror', (e) => errors.push(String(e.message || e)));
      await p.goto('file://' + r.htmlFile);
      await p.waitForTimeout(700);

      const metrics = await p.evaluate((declaredPadding) => {
        /* A CSS reset can out-specify a component rule and silently flatten
           it — `.x-screen div {padding:0}` (0,1,1) beats `.x-card {padding:12px}`
           (0,1,0), collapsing the layout with no error anywhere. Compare what
           the stylesheet asks for against what the element actually got. */
        const collapsed = [];
        for (const [selector, want] of declaredPadding) {
          const el = document.querySelector(selector);
          if (!el) continue;
          const got = getComputedStyle(el).padding;
          if (/^0px( 0px)*$/.test(got) && want) collapsed.push(`${selector} wants ${want}, computed ${got}`);
        }
        return {
          scrollW: document.documentElement.scrollWidth,
          clientW: document.documentElement.clientWidth,
          painted: document.body.innerText.trim().length,
          collapsed,
        };
      }, r.declaredPadding);
      const shot = path.join(outDir, `${r.fmtName}-${width}.png`);
      await p.screenshot({ path: shot, fullPage: true });
      await p.close();

      const over = metrics.scrollW - metrics.clientW;
      const problems = [];
      if (errors.length) problems.push('JS: ' + errors.join(' | '));
      if (over > 2) problems.push(`overflows ${over}px to the right`);
      if (metrics.painted < 10) problems.push('rendered almost no text — screen is effectively blank');
      for (const c of metrics.collapsed) {
        problems.push(`padding collapsed by a more specific rule — ${c}`);
      }

      if (problems.length) {
        console.log(`FAIL  ${r.fmtName} @${width}: ${problems.join('; ')}`);
        failures++;
      } else {
        console.log(`ok    ${r.fmtName} @${width}: no JS errors, no overflow, ${metrics.painted} chars painted`);
      }
    }
  }
  await browser.close();

  console.log(`\nscreenshots: ${outDir}`);
  if (failures) {
    console.log(`FAILURES: ${failures}`);
    process.exit(1);
  }
  console.log('all checks passed');
}

main().catch((e) => { console.error(e); process.exit(1); });
