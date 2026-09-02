#!/usr/bin/env node
/* Bootstrap a brand.json from a company website.
 *
 *   node scripts/brand-init.js --url https://example.com --prefix ex --out brand.json
 *
 * Strategy, in order of trustworthiness:
 *   1. CSS custom properties in a :root block (--bs-primary, --color-*, --brand-*).
 *      Design systems declare their real palette here. This is the good stuff.
 *   2. Declared font-family on body / :root, plus any Google Fonts link.
 *   3. Frequency analysis of hex literals across the stylesheets as a fallback.
 *
 * Always prints what it found and where, because a scraped palette is a
 * starting point for a human decision, not an answer.
 */
'use strict';

const https = require('https');
const http = require('http');
const fs = require('fs');
const { URL } = require('url');
const { mergeBrand, luminance, contrast } = require('./lib/brand');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

function fetch(target, redirects) {
  const depth = redirects == null ? 5 : redirects;
  return new Promise((resolve, reject) => {
    const u = new URL(target);
    const mod = u.protocol === 'http:' ? http : https;
    const req = mod.get(
      target,
      {
        timeout: 20000,
        headers: {
          /* Some sites serve a stub to unknown agents; ask for plain text. */
          'User-Agent': 'Mozilla/5.0 (compatible; brand-init/1.0)',
          'Accept-Encoding': 'identity',
          Accept: 'text/html,text/css,*/*',
        },
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && depth > 0) {
          res.resume();
          return resolve(fetch(new URL(res.headers.location, target).href, depth - 1));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error(`HTTP ${res.statusCode} for ${target}`));
        }
        let body = '';
        res.setEncoding('utf8');
        res.on('data', (d) => { body += d; });
        res.on('end', () => resolve({ body, url: target }));
      }
    );
    req.on('timeout', () => { req.destroy(new Error('timeout')); });
    req.on('error', reject);
  });
}

const NAMED_SKIP = new Set(['#ffffff', '#fff', '#000000', '#000']);

function normHex(h) {
  let s = String(h).toLowerCase();
  if (s.length === 4) s = '#' + s.slice(1).split('').map((c) => c + c).join('');
  return s;
}

/* Pull `--name: #hex;` pairs out of every :root-ish block. */
function extractVars(css) {
  const vars = {};
  const re = /--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*[;}]/g;
  let m;
  while ((m = re.exec(css)) !== null) vars[m[1].toLowerCase()] = normHex(m[2].slice(0, 7));
  return vars;
}

const ACCENT_KEYS = [
  'bs-primary', 'color-primary', 'primary', 'brand-primary', 'brand', 'accent',
  'color-accent', 'theme-primary', 'main-color', 'color-brand', 'c-primary',
  'color-kit-primary', 'primary-color',
];
const DARK_KEYS = [
  'bs-dark', 'color-dark', 'dark', 'brand-dark', 'text-color', 'color-text',
  'bs-gray-900', 'gray-900', 'neutral-900', 'color-kit-secondary',
];

function pickVar(vars, keys) {
  for (const k of keys) if (vars[k] && !NAMED_SKIP.has(vars[k])) return { value: vars[k], key: k };
  return null;
}

/* Fallback: most common non-greyscale hex in the stylesheets. */
function frequentColors(css) {
  const counts = new Map();
  const re = /#([0-9a-fA-F]{6})\b/g;
  let m;
  while ((m = re.exec(css)) !== null) {
    const hex = normHex('#' + m[1]);
    if (NAMED_SKIP.has(hex)) continue;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (sat < 40) continue;                       /* greyscale, not a brand hue */
    counts.set(hex, (counts.get(hex) || 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex, n]) => ({ hex, n }));
}

function extractFonts(html, css) {
  const out = { import: null, display: null, body: null, googleFamilies: [] };

  const linkRe = /<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com\/css2?[^"']+)["']/gi;
  let m;
  while ((m = linkRe.exec(html)) !== null) {
    const href = m[1].replace(/&amp;/g, '&');
    if (!out.import) out.import = href;
    const fams = [...href.matchAll(/family=([^&:]+)/g)].map((x) => decodeURIComponent(x[1]).replace(/\+/g, ' '));
    out.googleFamilies.push(...fams);
  }

  const bodyFont = /(?:^|[\s{,])body\s*\{[^}]*font-family\s*:\s*([^;}]+)/i.exec(css)
    || /:root\s*\{[^}]*--(?:font|font-family|bs-body-font-family)[\w-]*\s*:\s*([^;}]+)/i.exec(css);
  if (bodyFont) out.body = bodyFont[1].trim().replace(/\s+/g, ' ');

  const headFont = /(?:^|[\s{,])h1\s*(?:,[^{]*)?\{[^}]*font-family\s*:\s*([^;}]+)/i.exec(css);
  if (headFont) out.display = headFont[1].trim().replace(/\s+/g, ' ');

  return out;
}

function extractLogos(html, base) {
  const out = [];
  const re = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    const src = m[1];
    if (/logo|brand|wordmark/i.test(src) || /logo|brand/i.test(m[0])) {
      try { out.push(new URL(src, base).href); } catch (e) { /* skip malformed */ }
    }
  }
  const icon = /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]+href=["']([^"']+)["']/i.exec(html);
  if (icon) { try { out.push(new URL(icon[1], base).href); } catch (e) { /* skip */ } }
  return [...new Set(out)];
}

function extractTitle(html) {
  const og = /<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']+)["']/i.exec(html);
  if (og) return og[1].trim();
  const t = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  if (t) return t[1].split(/[|–—-]/)[0].trim();
  return null;
}

async function main() {
  const url = arg('url');
  const outPath = arg('out', 'brand.json');
  const prefix = arg('prefix', 'app');
  if (!url) {
    console.error('usage: brand-init.js --url <site> [--prefix ab] [--out brand.json]');
    process.exit(2);
  }

  console.log(`fetching ${url}`);
  const page = await fetch(url);
  const html = page.body;

  /* Collect every same-origin stylesheet the page links. */
  const cssHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .concat([...html.matchAll(/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*rel=["']stylesheet["']/gi)].map((m) => m[1]));

  let css = '';
  const inline = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]).join('\n');
  css += inline;

  const fetched = [];
  for (const href of [...new Set(cssHrefs)].slice(0, 8)) {
    let abs;
    try { abs = new URL(href, page.url).href; } catch (e) { continue; }
    if (/fonts\.googleapis|fonts\.gstatic/.test(abs)) continue;
    try {
      const r = await fetch(abs);
      css += '\n' + r.body;
      fetched.push(`${abs} (${r.body.length} bytes)`);
    } catch (e) {
      console.log(`  ! could not fetch ${abs}: ${e.message}`);
    }
  }

  console.log(`stylesheets read: ${fetched.length}`);
  for (const f of fetched) console.log('  - ' + f);

  const vars = extractVars(css);
  const varCount = Object.keys(vars).length;
  console.log(`css custom properties with colour values: ${varCount}`);

  const accentPick = pickVar(vars, ACCENT_KEYS);
  const darkPick = pickVar(vars, DARK_KEYS);
  const freq = frequentColors(css);

  let accent = accentPick ? accentPick.value : (freq[0] ? freq[0].hex : null);
  const accentSource = accentPick
    ? `--${accentPick.key}`
    : (freq[0] ? `frequency analysis (${freq[0].n} uses)` : 'default');

  const ink = darkPick ? darkPick.value : '#212832';
  const inkSource = darkPick ? `--${darkPick.key}` : 'default';

  const fonts = extractFonts(html, css);
  const logos = extractLogos(html, page.url);
  const title = extractTitle(html);

  console.log('\n--- findings ---');
  console.log(`company     : ${title || '(not found)'}`);
  console.log(`accent      : ${accent || '(none)'}   [${accentSource}]`);
  console.log(`ink         : ${ink}   [${inkSource}]`);
  console.log(`google font : ${fonts.googleFamilies.join(', ') || '(none)'}`);
  console.log(`body font   : ${fonts.body || '(not declared)'}`);
  console.log(`logo urls   :`);
  for (const l of logos.slice(0, 8)) console.log('               ' + l);
  if (freq.length) {
    console.log(`top hues    : ${freq.slice(0, 6).map((f) => `${f.hex}(${f.n})`).join('  ')}`);
  }

  const brand = mergeBrand({
    prefix,
    name: title || undefined,
    colors: {
      accent: accent || undefined,
      ink,
      inkDeep: vars['bs-black'] || '#121212',
      slate: vars['bs-gray-800'] || vars['gray-800'] || undefined,
      slate2: vars['bs-gray-700'] || vars['gray-700'] || undefined,
      muted: vars['bs-gray-500'] || vars['gray-500'] || undefined,
      lineStrong: vars['bs-gray-300'] || vars['gray-300'] || undefined,
      line: vars['bs-gray-200'] || vars['gray-200'] || undefined,
      surfaceAlt: vars['bs-gray-100'] || vars['gray-100'] || undefined,
      ok: vars['bs-success'] || vars['success'] || undefined,
      warn: vars['bs-warning'] || vars['warning'] || undefined,
      bad: vars['bs-danger'] || vars['danger'] || undefined,
    },
    fonts: {
      import: fonts.import || undefined,
      display: fonts.display || (fonts.googleFamilies[0]
        ? `"${fonts.googleFamilies[0]}", "Arial Narrow", "Segoe UI", Arial, sans-serif` : undefined),
      body: fonts.body || undefined,
    },
  });

  /* Strip undefined so the file stays small and readable. */
  const clean = JSON.parse(JSON.stringify(brand));
  clean._provenance = {
    source: page.url,
    accent: accentSource,
    ink: inkSource,
    logoCandidates: logos.slice(0, 8),
    note: 'Scraped starting point. Verify against the real brand guide, and set logo/logoOnDark, tagline, unit, appName and footers by hand.',
  };

  fs.writeFileSync(outPath, JSON.stringify(clean, null, 2) + '\n');
  console.log(`\nwrote ${outPath}`);

  if (accent) {
    const onWhite = contrast(accent, '#ffffff');
    const whiteOn = contrast('#ffffff', accent);
    console.log(`accent contrast: on white ${onWhite.toFixed(2)}:1, white on it ${whiteOn.toFixed(2)}:1`);
    if (whiteOn < 3) {
      console.log('  ! White text on this accent is hard to read. Consider a darker');
      console.log('    accent for buttons, or dark text on accent chips.');
    }
    if (luminance(accent) > 0.75) {
      console.log('  ! Very light accent; the key column and links may wash out on white.');
    }
  }
  console.log('\nNext: fill in logo/logoOnDark/tagline/unit/appName/footers, then');
  console.log('      node scripts/build-theme.js --brand ' + outPath + ' --out <asset-dir>');
}

main().catch((e) => { console.error('brand-init failed: ' + e.message); process.exit(1); });
