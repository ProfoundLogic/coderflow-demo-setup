#!/usr/bin/env node
/* Render brand.json -> <out>/theme.css, and report any contrast failures.
 *
 *   node scripts/build-theme.js --brand brand.json --out htdocs/.../myapp
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { renderTheme, auditBrand, mergeBrand } = require('./lib/brand');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const brandPath = arg('brand', 'brand.json');
const outDir = arg('out', '.');
const templatePath = arg('template', path.join(__dirname, '..', 'assets', 'theme.css'));

if (!fs.existsSync(brandPath)) {
  console.error(`brand file not found: ${brandPath}`);
  process.exit(2);
}

const brand = mergeBrand(JSON.parse(fs.readFileSync(brandPath, 'utf8')));
const template = fs.readFileSync(templatePath, 'utf8');

let css;
try {
  css = renderTheme(template, brand);
} catch (e) {
  console.error('theme render failed: ' + e.message);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'theme.css');
fs.writeFileSync(outFile, css);
console.log(`theme  -> ${outFile}  (${css.length} bytes, prefix "${brand.prefix}")`);

const problems = auditBrand(brand);
if (problems.length) {
  console.log('\ncontrast warnings:');
  for (const p of problems) console.log('  ! ' + p);
  console.log('\nThese are readability risks, not build failures. Adjust the');
  console.log('palette in brand.json, or accept them deliberately.');
} else {
  console.log('contrast: all checks pass');
}
