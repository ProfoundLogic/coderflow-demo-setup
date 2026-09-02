/* Generate Rich Display JSON + EJS + CSS + JS from a parsed/planned DSPF. */
'use strict';

const { humanize } = require('./layout');

const esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/* Indent every line of a block. */
function ind(text, n) {
  const pad = ' '.repeat(n);
  return String(text).split('\n').map((l) => (l.trim() ? pad + l : l)).join('\n');
}

/* ------------------------------------------------------- Rich Display JSON */

function jsonField(f) {
  const o = { type: f.jsonType };
  if (f.jsonType === 'char') o.length = f.length || 1;
  else { o.length = f.length || 1; if (f.decimals) o.decimals = f.decimals; }
  return o;
}

function buildJson(model, plan, opts) {
  const o = opts;
  const formats = {};

  for (const p of plan.plans) {
    if (p.role === 'messages' || p.role === 'footer' || p.role === 'fragment') continue;
    const fmt = p.format;
    const key = fmt.name.toLowerCase();
    const base = `${o.urlBase}/${o.appDir}`;
    const v = o.version ? `?v=${o.version}` : '';

    const fields = {};
    /* Every generated screen routes button presses through `action`. */
    fields.action = { type: 'char', length: 10 };

    for (const f of fmt.fields) {
      if (f.role === 'sflmsgkey' || f.role === 'sflpgmq') continue;
      if (o.dropLegend && (p.analysis && p.analysis.legendFields.includes(f.name))) continue;
      fields[f.name] = jsonField(f);
    }

    /* Every template renders `msg`. Declaring it here keeps the template and
       the display file in step — a template identifier with no matching field
       renders blank at best and aborts the whole screen at worst. */
    if (!fields.msg) fields.msg = { type: 'char', length: o.msgLength || 78 };

    const screenTitle = (p.analysis && p.analysis.title) || humanize(fmt.name);
    const entry = {
      description: `${o.title || screenTitle} — ${fmt.name}`,
      template: `${base}/${key}.ejs${v}`,
      css: [`${base}/theme.css${v}`, `${base}/${key}.css${v}`],
      fields,
    };
    if (p.table) entry.js = [`${base}/${key}.js${v}`];

    if (p.table) {
      const sfl = fmt.subfile;
      const sflFields = {};
      for (const c of p.table.columns) sflFields[c.field.name] = jsonField(c.field);
      entry.subfiles = {
        [sfl.name.toLowerCase()]: {
          description: `${humanize(sfl.name)}`,
          clear: o.clearField || 'sflclear',
          fields: sflFields,
        },
      };
      /* The clear indicator needs a field the RPG can set. */
      entry.fields[o.clearField || 'sflclear'] = { type: 'char', length: 1 };
    }

    formats[key] = entry;
  }

  return { type: 'ejs', formats };
}

/* ------------------------------------------------------------- EJS pieces */

function topbar(b) {
  const logo = b.logoOnDark || b.logo;
  const logoTag = logo
    ? `<img src="${b.assetUrl}/${logo}${b.version ? `?v=${b.version}` : ''}" alt="${esc(b.name)}" class="${b.prefix}-logo">`
    : `<!-- no logo in brand.json; add logo/logoOnDark to show a wordmark -->`;
  const unit = b.unit
    ? `<span class="${b.prefix}-unit-name">${esc(b.unit)}</span>\n        ` : '';
  return `<header class="${b.prefix}-topbar">
    <div class="${b.prefix}-topbar-inner">
      <div class="${b.prefix}-brand">
        ${logoTag}
        <div class="${b.prefix}-brand-text">
          <div class="${b.prefix}-brand-name">${esc(b.name)}</div>
          ${b.tagline ? `<div class="${b.prefix}-brand-tag">${esc(b.tagline)}</div>` : ''}
        </div>
      </div>
      <div class="${b.prefix}-topbar-right">
        ${unit}<span class="${b.prefix}-app-name">${esc(b.appName)}</span>
      </div>
    </div>
    <div class="${b.prefix}-stripe"></div>
  </header>`;
}

function botbar(b) {
  if (!b.footerLeft && !b.footerRight) return '';
  return `
  <footer class="${b.prefix}-botbar">
    <span>${esc(b.footerLeft)}</span>
    <span class="${b.prefix}-botbar-accent">${esc(b.footerRight)}</span>
  </footer>`;
}

/* Edit codes that insert thousands separators. Z and the blank-on-zero codes
   do not group, so an account or order number keeps its digits: a customer
   number must render 100001, never 100,001. */
const GROUPING_EDTCDE = /^[1-4JKLMNOPQ]$/;

function groups(f) {
  const code = (f.editCode || '').trim().toUpperCase().charAt(0);
  if (!code) return false;
  return GROUPING_EDTCDE.test(code);
}

/* A numeric value formatted for display. */
function numberExpr(name, f) {
  const useGrouping = groups(f) || f.decimals > 0;
  const opts = [];
  if (f.decimals) {
    opts.push(`minimumFractionDigits: ${f.decimals}`, `maximumFractionDigits: ${f.decimals}`);
  }
  if (!useGrouping) opts.push('useGrouping: false');
  return `Number(${name} || 0).toLocaleString('en-US'${opts.length ? `, { ${opts.join(', ')} }` : ''})`;
}

function renderValue(b, f) {
  const n = f.name;
  if (f.jsonType !== 'char') {
    return `<span class="${b.prefix}-value ${b.prefix}-value-num"><%= ${numberExpr(n, f)} %></span>`;
  }
  return `<span class="${b.prefix}-value"><%= ${n} %></span>`;
}

function renderInput(b, f) {
  const cls = [`${b.prefix}-input`];
  if (f.jsonType !== 'char') cls.push(`${b.prefix}-input-num`);
  if ((f.length || 0) <= 3) cls.push(`${b.prefix}-input-code`);

  const attrs = [
    `type="text"`,
    `name="${f.name}"`,
    `id="${f.name}"`,
    `value="<%= ${f.name} %>"`,
    `class="${cls.join(' ')}"`,
  ];
  if (f.length) attrs.push(`maxlength="${f.length + (f.decimals ? 1 : 0)}"`);
  if (!f.allowsLower && f.jsonType === 'char') attrs.push(`style="text-transform: uppercase"`);

  /* DSPATR(PR) conditioned on an indicator: read-only while that state holds. */
  if (f.readonlyWhen && f.readonlyWhen.length) {
    const i = f.readonlyWhen[0];
    const test = i.negate ? `flags[${i.indicator}] !== '1'` : `flags[${i.indicator}] === '1'`;
    attrs.push(`<% if (${test}) { %>readonly<% } %>`);
  }
  return `<input ${attrs.join('\n               ')}>`;
}

function renderPair(b, pair) {
  const f = pair.field;
  const control = f.input ? renderInput(b, f) : renderValue(b, f);
  const hint = pair.hint
    ? `\n      <span class="${b.prefix}-hint-inline">${esc(pair.hint)}</span>` : '';

  if (pair.continuesPrevious) {
    return `<div class="${b.prefix}-row ${b.prefix}-row-cont">
      <span></span>
      <span class="${b.prefix}-value">${control}</span>
    </div>`;
  }
  return `<div class="${b.prefix}-row">
    <span class="${b.prefix}-label">${esc(pair.label)}</span>
    <span class="${b.prefix}-value">
      ${control}${hint}
    </span>
  </div>`;
}

function renderSection(b, section, index) {
  const heading = section.heading || (index === 0 ? 'Details' : humanize('section ' + (index + 1)));
  const rows = section.pairs.map((p) => ind(renderPair(b, p), 6)).join('\n');
  const notes = section.notes && section.notes.length
    ? `\n        <span class="${b.prefix}-card-note">${esc(section.notes.join(' · '))}</span>` : '';
  return `<section class="${b.prefix}-card${index === 0 ? ` ${b.prefix}-card-primary` : ''}">
      <div class="${b.prefix}-card-head">
        <span class="${b.prefix}-card-dot"></span>
        <h2>${esc(heading)}</h2>${notes}
      </div>
      <div class="${b.prefix}-fields">
${rows}
      </div>
    </section>`;
}

function renderMessage(b) {
  return `<% if (typeof msg !== 'undefined' && msg && msg.trim()) { %>
      <div class="${b.prefix}-message"><%= msg %></div>
    <% } %>`;
}

function renderFkeys(b, fkeys, extraNote) {
  if (!fkeys.length) {
    return `<div class="${b.prefix}-actions">
      <button onclick="pui.submit({action: 'EXIT'})" data-fkey="F3" class="${b.prefix}-btn ${b.prefix}-btn-secondary">Exit (F3)</button>
    </div>`;
  }
  const buttons = fkeys.map((k, i) => {
    const label = k.label || `F${k.num}`;
    const action = (k.label || `F${k.num}`).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10) || `F${k.num}`;
    const style = i === 0 && /exit|cancel|back|close/i.test(label)
      ? `${b.prefix}-btn-secondary` : `${b.prefix}-btn-ghost`;
    return `<button onclick="pui.submit({action: '${action}'})" data-fkey="${k.key}" class="${b.prefix}-btn ${style}">${esc(label)} (${k.key})</button>`;
  }).join('\n      ');
  const note = extraNote ? `\n      <span class="${b.prefix}-actions-note">${esc(extraNote)}</span>` : '';
  return `<div class="${b.prefix}-actions">
      ${buttons}${note}
    </div>`;
}

function renderTable(b, table, fmt) {
  const sfl = table.subfileName.toLowerCase();
  const clickable = !!table.optionColumn;

  const headCells = table.columns.map((c) => {
    if (c.isOption) return `<th class="${b.prefix}-col-opt">${esc(c.heading)}</th>`;
    const numCls = c.numeric ? ' class="num"' : '';
    const key = c.field.name;
    return `<th${numCls}>
              <button type="button" class="${b.prefix}-sort"
                      onclick="${b.prefix}Sort(this, '${key}', '${c.numeric ? 'number' : 'text'}')">
                ${esc(c.heading)}<span class="${b.prefix}-sort-indicator" aria-hidden="true"></span>
              </button>
            </th>`;
  }).join('\n            ');

  const sortAttrs = table.columns
    .filter((c) => !c.isOption)
    .map((c) => `data-sort-${c.field.name}="<%= row.${c.field.name} %>"`)
    .join('\n                  ');

  const bodyCells = table.columns.map((c) => {
    const f = c.field;
    if (c.isOption) {
      return `<td class="${b.prefix}-col-opt">
                  <input name="${sfl}.${f.name}.<%= row._rrn %>"
                         value="<%= row.${f.name} %>" size="2" maxlength="${f.length || 2}"
                         class="${b.prefix}-input ${b.prefix}-input-opt">
                </td>`;
    }
    const isKey = c === table.columns.find((x) => !x.isOption);
    const cls = [
      c.numeric ? 'num' : null,
      isKey ? `${b.prefix}-col-key` : null,
      c.numeric || isKey ? `${b.prefix}-mono` : null,
    ].filter(Boolean).join(' ');
    const val = c.numeric
      ? `<%= row.${f.name} === '' || row.${f.name} == null ? '' : ${numberExpr('row.' + f.name, f)} %>`
      : `<%= row.${f.name} %>`;
    return `<td${cls ? ` class="${cls}"` : ''}>${val}</td>`;
  }).join('\n                ');

  const rowAttrs = clickable
    ? `onclick="${b.prefix}RowClick(event, this)"\n                  ` : '';

  return `<div class="${b.prefix}-tablewrap">
      <table class="${b.prefix}-table${clickable ? ' is-clickable' : ''}" data-sortable-table>
        <thead>
          <tr>
            ${headCells}
          </tr>
        </thead>
        <tbody>
          <% if (typeof ${sfl} !== 'undefined' && ${sfl} && ${sfl}.length > 0) { %>
            <% ${sfl}.forEach(function (row) { %>
              <tr ${rowAttrs}${sortAttrs}>
                ${bodyCells}
              </tr>
            <% }); %>
          <% } else { %>
            <tr><td colspan="${table.columns.length}" class="${b.prefix}-empty">No records to display</td></tr>
          <% } %>
        </tbody>
      </table>
    </div>`;
}

/* Toolbar: the input fields that sit above a subfile are search/filter controls. */
function renderToolbar(b, sections) {
  const pairs = sections.flatMap((s) => s.pairs);
  if (!pairs.length) return '';
  const controls = pairs.map((p) => {
    const f = p.field;
    if (!f.input) {
      return `<div class="${b.prefix}-field">
        <label>${esc(p.label)}</label>
        ${renderValue(b, f)}
      </div>`;
    }
    const grow = f.jsonType === 'char' && (f.length || 0) > 20 ? ` ${b.prefix}-field-grow` : '';
    return `<div class="${b.prefix}-field${grow}">
        <label for="${f.name}">${esc(p.label)}</label>
        ${renderInput(b, f)}
      </div>`;
  }).join('\n      ');

  return `<section class="${b.prefix}-toolbar">
      ${controls}
      <button onclick="pui.submit({action: 'SEARCH'})" class="${b.prefix}-btn ${b.prefix}-btn-primary">
        <svg class="${b.prefix}-btn-icon" viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path fill="currentColor" d="M10 2a8 8 0 105.3 14l5.4 5.4 1.4-1.4-5.4-5.4A8 8 0 0010 2zm0 2a6 6 0 110 12 6 6 0 010-12z"/>
        </svg>
        Search
      </button>
    </section>`;
}

function titlebar(b, analysis, keyField) {
  const title = analysis.title || b.appName;
  const badge = keyField
    ? `
      <div class="${b.prefix}-key-badge">
        <span class="${b.prefix}-key-label">${esc(humanize(keyField.name))}</span>
        <span class="${b.prefix}-key-value"><%= ${keyField.name} %></span>
      </div>` : '';
  return `<div class="${b.prefix}-titlebar">
      <div>
        <h1>${esc(title)}</h1>
        ${b.subtitle ? `<span class="${b.prefix}-title-sub">${esc(b.subtitle)}</span>` : ''}
      </div>${badge}
    </div>`;
}

/* --------------------------------------------------------------- templates */

function generateTemplate(b, p) {
  const fmt = p.format;
  const a = p.analysis;

  if (p.role === 'list') {
    const hint = a.optionLegends.length
      ? `<div class="${b.prefix}-hint">Options: <strong>${esc(a.optionLegends.join(' · '))}</strong></div>\n    `
      : (fmt.fields.some((f) => /optdesc/i.test(f.name))
        ? `<% if (typeof ${fmt.fields.find((f) => /optdesc/i.test(f.name)).name} !== 'undefined' && ${fmt.fields.find((f) => /optdesc/i.test(f.name)).name}.trim()) { %>
      <div class="${b.prefix}-hint">Options: <strong><%= ${fmt.fields.find((f) => /optdesc/i.test(f.name)).name} %></strong></div>
    <% } %>\n    ` : '');

    /* Fields already shown in the toolbar or the hint must not repeat. */
    const optDesc = fmt.fields.find((f) => /optdesc/i.test(f.name));
    const sections = a.sections.map((s) => ({
      ...s,
      pairs: s.pairs.filter((pr) => !optDesc || pr.field.name !== optDesc.name),
    }));

    const note = p.table.optionColumn
      ? `Click a row (or type an option in ${p.table.optionColumn.heading}) to continue.` : null;

    return `<div class="${b.prefix}-screen ${b.prefix}-${fmt.name.toLowerCase()}">
  ${topbar(b)}

  <main class="${b.prefix}-main">
    ${titlebar(b, a, null)}

    ${renderToolbar(b, sections)}

    ${renderMessage(b)}

    ${hint}${renderTable(b, p.table, fmt)}

    <input type="hidden" name="action" value="">

    ${renderFkeys(b, p.fkeys, note)}
  </main>
${botbar(b)}
</div>
`;
  }

  if (p.role === 'dialog') {
    const body = a.sections.map((s, i) => ind(renderSection(b, s, i), 6)).join('\n');
    return `<div class="${b.prefix}-screen ${b.prefix}-${fmt.name.toLowerCase()}">
  <div class="${b.prefix}-backdrop">
    <div class="${b.prefix}-dialog" role="dialog" aria-modal="true">
      <div class="${b.prefix}-dialog-head">${esc(a.title || humanize(fmt.name))}</div>
      <div class="${b.prefix}-dialog-body">
        ${renderMessage(b)}
${body}
      </div>
      <div class="${b.prefix}-dialog-foot">
        <input type="hidden" name="action" value="">
        ${renderFkeys(b, p.fkeys, null)}
      </div>
    </div>
  </div>
</div>
`;
  }

  if (p.role === 'notice') {
    const text = a.sections.map((s) => s.heading).filter(Boolean).join(' ');
    return `<div class="${b.prefix}-screen ${b.prefix}-${fmt.name.toLowerCase()}">
  <div class="${b.prefix}-empty">${esc(text.replace(/^\*+\s*|\s*\*+$/g, ''))}</div>
</div>
`;
  }

  /* form */
  const keyCandidates = fmt.fields.filter(
    (f) => !f.input && !f.hidden && f.row != null && f.row <= 4 && f.jsonType !== 'char'
  );
  const keyField = keyCandidates[0] || null;
  const sections = a.sections.map((s) => ({
    ...s,
    pairs: s.pairs.filter((pr) => !keyField || pr.field.name !== keyField.name),
  })).filter((s) => s.pairs.length || s.heading);

  const cards = sections.map((s, i) => ind(renderSection(b, s, i), 4)).join('\n');

  return `<div class="${b.prefix}-screen ${b.prefix}-${fmt.name.toLowerCase()}">
  ${topbar(b)}

  <main class="${b.prefix}-main">
    ${titlebar(b, a, keyField)}

    ${renderMessage(b)}

    <div class="${b.prefix}-grid">
${cards}
    </div>

    <input type="hidden" name="action" value="">

    ${renderFkeys(b, p.fkeys, null)}
  </main>
${botbar(b)}
</div>
`;
}

/* -------------------------------------------------------------- screen CSS */

function generateScreenCss(b, p) {
  const name = p.format.name.toLowerCase();
  const lines = [
    `/* ${p.format.name} — screen-specific overrides.`,
    ` * theme.css carries the shared design system and is listed first in the`,
    ` * display file's css array; put ONLY per-screen deviations here.`,
    ` */`,
    '',
  ];

  if (p.role === 'list' && p.table) {
    const key = p.table.columns.find((c) => !c.isOption);
    if (key) {
      lines.push(`/* Keep the key column tight so the descriptive columns get the room. */`);
      lines.push(`.${b.prefix}-${name} .${b.prefix}-col-key { width: 96px; }`);
      lines.push('');
    }
    const wide = p.table.columns.filter((c) => c.field.jsonType === 'char' && (c.field.length || 0) >= 40);
    if (wide.length) {
      lines.push(`/* Long text columns wrap rather than forcing a horizontal scrollbar. */`);
      for (const c of wide) {
        lines.push(`.${b.prefix}-${name} .${b.prefix}-table td:nth-child(${p.table.columns.indexOf(c) + 1}) { min-width: 220px; }`);
      }
      lines.push('');
    }
  }

  if (p.role === 'form') {
    lines.push(`/* Two columns on wide screens, one on narrow — handled by the theme grid. */`);
    lines.push(`/* Add overrides below as the screen is refined. */`);
    lines.push('');
  }

  return lines.join('\n');
}

/* --------------------------------------------------------------- screen JS */

function generateScreenJs(b, p) {
  if (!p.table) return null;
  const sfl = p.table.subfileName.toLowerCase();
  const opt = p.table.optionColumn;
  const optValue = (p.table.optionLegendValue || '5');
  const P = b.prefix;

  return `/* ${p.format.name} — table sort and row selection.
 *
 * Interactions are reached through inline handler attributes in the template
 * (onclick="${P}Sort(...)") rather than addEventListener. Screen JS can be
 * evaluated before Profound UI injects the rendered template into the DOM, so
 * a listener bound at load time silently binds to nothing.
 *
 * This file re-executes on every render, including subfile reloads, so nothing
 * here may accumulate state: no document/window listeners, no pui.submit wrapper.
 */
(function () {
  "use strict";

  function normText(v) { return String(v == null ? "" : v).trim().toLowerCase(); }
  function normNum(v) {
    var n = Number(String(v == null ? "" : v).replace(/,/g, ""));
    return isNaN(n) ? Number.NEGATIVE_INFINITY : n;
  }
  function dsKey(k) { return "sort" + k.charAt(0).toUpperCase() + k.slice(1); }

  function seedOrder(tbody) {
    var rows = tbody.querySelectorAll("tr");
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].dataset.rowOrder === undefined) rows[i].dataset.rowOrder = String(i);
    }
    return Array.prototype.slice.call(rows);
  }

  function paintSort(table, active, dir) {
    var b = table.querySelectorAll(".${P}-sort");
    for (var i = 0; i < b.length; i++) {
      var on = b[i] === active;
      b[i].classList.toggle("is-active", on);
      b[i].classList.toggle("asc", on && dir === "asc");
      b[i].classList.toggle("desc", on && dir === "desc");
      b[i].setAttribute("aria-sort", on ? (dir === "asc" ? "ascending" : "descending") : "none");
    }
  }

  window.${P}Sort = function (button, key, type) {
    var table = button.closest("table");
    if (!table) return;
    var tbody = table.querySelector("tbody");
    if (!tbody) return;
    var rows = seedOrder(tbody);
    if (rows.length < 2) return;

    var dir = button.classList.contains("is-active") && button.classList.contains("asc") ? "desc" : "asc";
    var factor = dir === "asc" ? 1 : -1;
    var field = dsKey(key);

    rows.sort(function (l, r) {
      var c = type === "number"
        ? normNum(l.dataset[field]) - normNum(r.dataset[field])
        : normText(l.dataset[field]).localeCompare(normText(r.dataset[field]));
      if (c === 0) return Number(l.dataset.rowOrder) - Number(r.dataset.rowOrder);
      return c * factor;
    });
    for (var i = 0; i < rows.length; i++) tbody.appendChild(rows[i]);
    paintSort(table, button, dir);
  };
${opt ? `
  /* Clicking a row is equivalent to typing "${optValue}" in ${opt.heading} and
     pressing Enter. The RPG reads changed records via readc(${sfl}). */
  window.${P}RowClick = function (event, row) {
    if (event && event.target && event.target.closest("input, button, a, select, textarea, label")) return;
    if (!row) return;
    var input = row.querySelector('input[name^="${sfl}.${opt.field.name}."]');
    if (!input) return;

    input.value = "${optValue}";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    setTimeout(function () {
      if (window.pui && typeof pui.submit === "function") pui.submit({});
      else if (input.form) input.form.submit();
    }, 0);
  };
` : ''}
  /* Zoned search fields arrive as "0" when unset; show that as empty. */
  function blankZeros(left) {
    var el = document.querySelectorAll(".${P}-screen input.${P}-input-num, .${P}-screen input.${P}-input-code");
    if (el.length) {
      for (var i = 0; i < el.length; i++) {
        if (/^0+$/.test(el[i].value.trim())) el[i].value = "";
      }
      return;
    }
    if (left > 0) setTimeout(function () { blankZeros(left - 1); }, 40);
  }
  blankZeros(15);
})();
`;
}

module.exports = { buildJson, generateTemplate, generateScreenCss, generateScreenJs };
