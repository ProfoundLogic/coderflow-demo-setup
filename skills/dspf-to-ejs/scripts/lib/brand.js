/* Brand model: defaults, colour maths, and theme rendering.
 *
 * A brand.json is small on purpose — an accent, an ink, a font and a logo are
 * enough to derive a coherent theme. Everything else has a sensible default so
 * a half-filled brand file still produces a finished-looking screen.
 */
'use strict';

const DEFAULTS = {
  prefix: 'app',
  name: 'Acme Corporation',
  tagline: '',
  unit: '',
  appName: 'Portal',
  footerLeft: '',
  footerRight: '',
  logo: null,
  logoOnDark: null,
  maxWidth: '1400px',
  labelWidth: '118px',
  texture: 'diamond',
  watermark: false,
  colors: {
    accent: '#0061f2',
    ink: '#212832',
    inkDeep: '#121212',
    slate: '#363d47',
    slate2: '#4a515b',
    muted: '#a7aeb8',
    lineStrong: '#d4dae3',
    line: '#e0e5ec',
    surfaceAlt: '#f2f6fc',
    ok: '#00ac69',
    warn: '#f4a100',
    bad: '#e81500',
  },
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", "Segoe UI", Arial, sans-serif',
    body: '"Barlow", "Segoe UI", Roboto, Arial, Helvetica, sans-serif',
    import: 'https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@400;500;600;700&display=swap',
  },
};

/* ------------------------------------------------------------ colour maths */

function hexToRgb(hex) {
  let h = String(hex || '').trim().replace(/^#/, '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return null;
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

function mix(hex, target, amount) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  if (!a || !b) return hex;
  return rgbToHex({
    r: a.r + (b.r - a.r) * amount,
    g: a.g + (b.g - a.g) * amount,
    b: a.b + (b.b - a.b) * amount,
  });
}

const darken = (hex, amt) => mix(hex, '#000000', amt);
const lighten = (hex, amt) => mix(hex, '#ffffff', amt);

function rgba(hex, alpha) {
  const c = hexToRgb(hex);
  if (!c) return `rgba(0,0,0,${alpha})`;
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

/* Relative luminance, for deciding readable text on a given background. */
function luminance(hex) {
  const c = hexToRgb(hex);
  if (!c) return 0;
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/* ------------------------------------------------------------- merge/load */

function mergeBrand(user) {
  const u = user || {};
  return {
    ...DEFAULTS,
    ...u,
    colors: { ...DEFAULTS.colors, ...(u.colors || {}) },
    fonts: { ...DEFAULTS.fonts, ...(u.fonts || {}) },
  };
}

const TEXTURES = {
  diamond:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><path d='M0 13 L13 0 L26 13 L13 26 Z' fill='none' stroke='%23ffffff' stroke-opacity='0.055' stroke-width='1'/><circle cx='13' cy='13' r='1' fill='%23ffffff' fill-opacity='0.07'/></svg>\")",
  grid:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><path d='M26 0 L0 0 0 26' fill='none' stroke='%23ffffff' stroke-opacity='0.05' stroke-width='1'/></svg>\")",
  dots:
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 26 26'><circle cx='13' cy='13' r='1.2' fill='%23ffffff' fill-opacity='0.08'/></svg>\")",
  none: 'none',
};

/* --------------------------------------------------------------- rendering */

function themeVars(brand) {
  const b = mergeBrand(brand);
  const c = b.colors;
  const accent = c.accent;

  const watermark = b.watermark && b.logo
    ? `.${b.prefix}-card::after {
  content: "";
  position: absolute;
  right: -18px;
  bottom: -22px;
  width: 220px;
  height: 74px;
  background-image: url("${b.watermark === true ? fileOf(b.logo) : b.watermark}");
  background-repeat: no-repeat;
  background-size: contain;
  background-position: right bottom;
  opacity: 0.05;
  transform: rotate(-6deg);
  pointer-events: none;
}`
    : `/* watermark disabled in brand.json */`;

  return {
    brandName: b.name,
    prefix: b.prefix,
    fontImport: b.fonts.import ? `@import url("${b.fonts.import}");` : '',
    displayFont: b.fonts.display,
    bodyFont: b.fonts.body,
    accent,
    accentDark: darken(accent, 0.22),
    accentSoft: lighten(accent, 0.9),
    accentBorder: lighten(accent, 0.62),
    accentRing: rgba(accent, 0.16),
    accentGlow: rgba(accent, 0.42),
    ink: c.ink,
    inkDeep: c.inkDeep,
    slate: c.slate,
    slate2: c.slate2,
    muted: c.muted,
    lineStrong: c.lineStrong,
    line: c.line,
    surfaceAlt: c.surfaceAlt,
    ok: c.ok,
    okDark: darken(c.ok, 0.28),
    okSoft: lighten(c.ok, 0.88),
    warn: c.warn,
    warnDark: darken(c.warn, 0.35),
    bad: c.bad,
    badText: darken(c.bad, 0.45),
    texture: TEXTURES[b.texture] || TEXTURES.diamond,
    watermark,
    maxWidth: b.maxWidth,
    labelWidth: b.labelWidth,
  };
}

function fileOf(p) {
  return String(p || '').split('/').pop();
}

function renderTheme(templateText, brand) {
  const vars = themeVars(brand);
  return templateText.replace(/\{\{(\w+)\}\}/g, (all, key) => {
    if (!(key in vars)) throw new Error(`theme template references unknown token {{${key}}}`);
    return vars[key];
  });
}

/* Report contrast problems rather than silently shipping unreadable text. */
function auditBrand(brand) {
  const b = mergeBrand(brand);
  const c = b.colors;
  const problems = [];

  const check = (fg, bg, label, min) => {
    const ratio = contrast(fg, bg);
    if (ratio < min) {
      problems.push(`${label}: contrast ${ratio.toFixed(2)}:1 (want >= ${min}:1)  ${fg} on ${bg}`);
    }
  };

  check('#ffffff', c.accent, 'white text on accent (buttons, app-name chip)', 3.0);
  check('#ffffff', c.ink, 'white text on ink (table header, buttons)', 4.5);
  check(c.ink, c.surfaceAlt, 'body text on alt surface', 4.5);
  check(c.slate2, '#ffffff', 'muted text on white', 4.5);
  check(c.accent, '#ffffff', 'accent text on white (key column, links)', 3.0);

  return problems;
}

module.exports = {
  DEFAULTS, mergeBrand, renderTheme, themeVars, auditBrand,
  hexToRgb, rgbToHex, mix, darken, lighten, rgba, luminance, contrast, TEXTURES,
};
