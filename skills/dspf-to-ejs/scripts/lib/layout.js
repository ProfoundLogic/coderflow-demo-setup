/* Layout analysis.
 *
 * A DDS record is a bag of things at (row, col). This module recovers the
 * *intent* behind those coordinates so the generated screen can be semantic
 * HTML (cards, label/value pairs, data tables) rather than absolutely
 * positioned boxes. Positioned output is what makes converted screens look
 * like a green screen wearing a costume; structure is what makes them look
 * designed.
 *
 * Recovered shapes:
 *   title     - the banner constant on row 1..2
 *   sections  - runs of label/value rows, split on heading constants
 *   pairs     - constant immediately left of a field on the same row
 *   table     - subfile columns, headings matched to fields by column position
 *   footer    - function keys, plus the F-key text field (row 22+) we suppress
 *   messages  - message subfile
 */
'use strict';

const LABEL_TRAIL = /[\s.:]*[:.]\s*$/;

function humanize(name) {
  const s = String(name || '').replace(/^s(?=[a-z])/i, '');
  return s
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

/* "Find customer by number . :" -> "Find customer by number" */
function cleanLabel(text) {
  return String(text || '').replace(LABEL_TRAIL, '').replace(/\s*\.(\s*\.)+\s*$/, '').trim();
}

function looksLikeLabel(text) {
  const t = String(text || '').trim();
  if (!t) return false;
  if (/[:.]\s*$/.test(t)) return true;
  return /\.\s*\./.test(t);
}

/* Constants that annotate a value rather than label it: "(B=Business, ...)" */
function looksLikeHint(text) {
  const t = String(text || '').trim();
  return /^\(.*\)$/.test(t);
}

function byRowCol(a, b) {
  if (a.row !== b.row) return (a.row || 0) - (b.row || 0);
  return (a.col || 0) - (b.col || 0);
}

/* ---------------------------------------------------------------- tables */

/* Rendered width of a field on the green screen, used for span matching. */
function displayWidth(f) {
  const len = f.length || 1;
  if (f.jsonType === 'char') return len;
  let w = len;
  if (f.decimals) w += 1;                                   /* decimal point */
  if (/[1-4JKLMNOPQ]/.test(f.editCode || '')) {
    w += Math.floor(Math.max(0, len - f.decimals - 1) / 3); /* thousands separators */
  }
  return w;
}

/* Headings may sit to the LEFT of a field (text columns) or to the RIGHT
   (right-aligned numeric columns, where the heading aligns to the value's
   last character). Match on span overlap so both work, and assign greedily
   best-first so one heading cannot be claimed by two fields. */
function matchHeadings(fields, headings) {
  const pairs = [];
  for (const f of fields) {
    const fStart = f.col;
    const fEnd = f.col + displayWidth(f);
    for (const h of headings) {
      const hStart = h.col;
      const hEnd = h.col + h.text.trim().length;
      const overlap = Math.min(fEnd, hEnd) - Math.max(fStart, hStart);
      const distance = overlap > 0 ? 0 : Math.min(
        Math.abs(hStart - fEnd), Math.abs(fStart - hEnd)
      );
      pairs.push({ f, h, score: overlap > 0 ? overlap : -distance });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const takenField = new Set();
  const takenHeading = new Set();
  const assigned = new Map();
  for (const p of pairs) {
    if (takenField.has(p.f) || takenHeading.has(p.h)) continue;
    /* A heading more than a few columns clear of the value is somebody else's. */
    if (p.score < -6) continue;
    assigned.set(p.f, p.h);
    takenField.add(p.f);
    takenHeading.add(p.h);
  }
  return { assigned, used: takenHeading };
}

/* Match subfile fields to heading constants living in the control record. */
function buildTable(sflFormat, ctlFormat) {
  const dataFields = sflFormat.fields.filter((f) => !f.hidden && f.row != null);
  if (!dataFields.length) return null;

  const rows = [...new Set(dataFields.map((f) => f.row))].sort((a, b) => a - b);
  const firstRow = rows[0];
  const firstRowFields = dataFields.filter((f) => f.row === firstRow);

  /* Headings live on the nearest control-record row above the subfile's first
     data row. Ignore F-key legends and instruction lines. */
  const ctlConstants = (ctlFormat ? ctlFormat.constants : [])
    .filter((c) => c.row != null && c.row < firstRow && !isLegend(c.text));
  const candidateRows = ctlConstants.map((c) => c.row);
  const headingRow = candidateRows.length ? Math.max(...candidateRows) : null;
  const headings = ctlConstants.filter((c) => c.row === headingRow);

  const { assigned, used } = matchHeadings(firstRowFields, headings);

  /* Constants inside the subfile record itself label continuation lines. */
  const inlineLabels = sflFormat.constants.filter((c) => c.row != null);
  const usedInline = new Set();

  const columns = dataFields.sort(byRowCol).map((f) => {
    let heading = null;
    if (f.row === firstRow) {
      const h = assigned.get(f);
      if (h) heading = h.text.trim();
    } else {
      const lbl = inlineLabels
        .filter((c) => c.row === f.row && c.col < f.col && !usedInline.has(c))
        .sort((a, b) => b.col - a.col)[0];
      if (lbl) { heading = cleanLabel(lbl.text); usedInline.add(lbl); }
    }
    return {
      field: f,
      heading: heading || humanize(f.name),
      numeric: f.jsonType !== 'char',
      isOption: isOptionField(f),
      continuation: f.row !== firstRow,
    };
  });

  return {
    subfileName: sflFormat.name,
    clearIndicator: ctlFormat ? ctlFormat.sflclrIndicator : null,
    pageSize: ctlFormat ? ctlFormat.sflpag : null,
    columns,
    optionColumn: columns.find((c) => c.isOption) || null,
    /* Constants the table consumed, so the form analyser skips them. */
    consumed: new Set([...used, ...usedInline]),
    headingRow,
  };
}

function isOptionField(f) {
  return /opt$|^opt/i.test(f.name) && f.input && (f.length || 0) <= 3;
}

/* "F3=Exit  F12=Cancel" style legends are replaced by real buttons. */
function isLegend(text) {
  const t = String(text || '').trim();
  return /^F\d{1,2}\s*=/.test(t) || /\bF\d{1,2}\s*=\s*\w+.*\bF\d{1,2}\s*=/.test(t);
}

/* --------------------------------------------------------------- sections */

function analyzeRecord(fmt, opts) {
  const options = opts || {};
  const screenRows = options.screenRows || 24;
  /* A window's coordinates are relative to the window, so its whole body is
     content — there is no 24-row screen footer to carve off. */
  const footerFrom = fmt.window ? Number.MAX_SAFE_INTEGER : screenRows - 2;
  const skip = options.consumed || new Set();

  const fields = fmt.fields.filter((f) => !f.hidden && f.row != null);
  const constants = fmt.constants.filter(
    (c) => c.row != null && !skip.has(c) && !isLegend(c.text)
  );

  /* The F-key legend field (e.g. SFKEYS at row 23) is replaced by real
     buttons, so it is not rendered as a value. */
  const legendFields = fields.filter(
    (f) => f.row >= footerFrom && !f.input && (f.length || 0) >= 40
  );
  const legendSet = new Set(legendFields.map((f) => f.name));

  const body = fields.filter((f) => !legendSet.has(f.name) && f.row < footerFrom);
  const bodyConstants = constants.filter((c) => c.row < footerFrom);

  /* Title: a constant on row 1-2 that is not a label. */
  let title = null;
  const topConstants = bodyConstants
    .filter((c) => c.row <= 2 && !looksLikeLabel(c.text))
    .sort((a, b) => (b.text.length - a.text.length));
  if (topConstants.length) title = topConstants[0];
  const titleSet = new Set(title ? [title] : []);

  /* Pair each field with the nearest label constant to its left on the row. */
  const usedConstants = new Set(titleSet);
  const pairs = [];
  for (const f of body.sort(byRowCol)) {
    const left = bodyConstants
      .filter((c) => c.row === f.row && c.col < f.col && !usedConstants.has(c))
      .sort((a, b) => b.col - a.col)[0];
    const right = bodyConstants
      .filter((c) => c.row === f.row && c.col > f.col && !usedConstants.has(c) && looksLikeHint(c.text))
      .sort((a, b) => a.col - b.col)[0];

    let label = null;
    if (left && looksLikeLabel(left.text)) { label = cleanLabel(left.text); usedConstants.add(left); }
    else if (left && left.col + left.text.length + 3 >= f.col) { label = cleanLabel(left.text); usedConstants.add(left); }

    let hint = null;
    if (right) { hint = right.text.trim(); usedConstants.add(right); }

    /* An unlabelled field directly under a labelled one at the same column is
       a continuation line (address line 2, wrapped text) rather than a new
       field needing an invented name. */
    let continues = false;
    if (!label) {
      const above = pairs[pairs.length - 1];
      if (above && above.field.col === f.col && above.row === f.row - 1) continues = true;
    }

    pairs.push({
      field: f,
      label: label || (continues ? null : humanize(f.name)),
      hint,
      row: f.row,
      continuesPrevious: continues,
    });
  }

  /* Anything left over that is not a label is a heading or standalone text. */
  const leftovers = bodyConstants.filter((c) => !usedConstants.has(c)).sort(byRowCol);

  /* "1=Select to view details" / "5=Display" is an option legend for the
     subfile, not a section heading — it belongs above the table as a hint. */
  const optionLegends = leftovers.filter((c) => /^\s*\d+\s*=/.test(c.text));
  optionLegends.forEach((c) => usedConstants.add(c));

  const headings = leftovers.filter(
    (c) => !optionLegends.includes(c) && (c.emphasis || c.color === 'WHT' || !looksLikeLabel(c.text))
  );

  /* Split the pairs into sections at heading rows. */
  const sections = [];
  let current = { heading: null, pairs: [], notes: [] };
  const headingRows = new Map(headings.map((h) => [h.row, h]));

  const allRows = [...new Set([...pairs.map((p) => p.row), ...headings.map((h) => h.row)])]
    .sort((a, b) => a - b);

  for (const row of allRows) {
    if (headingRows.has(row)) {
      const h = headingRows.get(row);
      const rowPairs = pairs.filter((p) => p.row === row);
      if (!rowPairs.length) {
        /* A heading on a row of its own starts a new section. */
        if (current.pairs.length || current.notes.length) sections.push(current);
        current = { heading: h.text.trim(), pairs: [], notes: [] };
        continue;
      }
      current.notes.push(h.text.trim());
    }
    for (const p of pairs.filter((p) => p.row === row)) current.pairs.push(p);
  }
  if (current.pairs.length || current.notes.length || current.heading) sections.push(current);

  return {
    title: title ? title.text.trim() : null,
    sections: sections.filter((s) => s.pairs.length || s.heading),
    optionLegends: optionLegends.map((c) => c.text.trim()),
    legendFields: legendFields.map((f) => f.name),
    inputCount: body.filter((f) => f.input).length,
  };
}

/* ------------------------------------------------------------------ screen */

/* Decide what each top-level format is for and produce a render plan. */
function planScreen(model, opts) {
  const options = opts || {};
  const screenRows = /27\s+132/.test(model.dspsiz || '') && options.wide ? 27 : 24;

  const plans = [];
  for (const fmt of model.formats) {
    if (fmt.attachedTo) continue;               /* rendered by its control record */
    if (fmt.isMessageCtl) {
      plans.push({ format: fmt, role: 'messages' });
      continue;
    }

    /* Build the table first: it tells the form analyser which constants are
       column headings and therefore must not become section headings. */
    const table = fmt.subfile ? buildTable(fmt.subfile, fmt) : null;
    const analysis = analyzeRecord(fmt, {
      screenRows,
      consumed: table ? table.consumed : null,
    });

    let role = 'form';
    if (table) role = 'list';
    else if (fmt.window) role = 'dialog';
    else if (!analysis.sections.length && !analysis.title) role = 'fragment';
    /* No fields at all, just standing text: an empty-state / notice record. */
    else if (!fmt.fields.filter((f) => !f.hidden).length && analysis.sections.length) role = 'notice';

    plans.push({ format: fmt, role, analysis, table, fkeys: fmt.fkeys, window: fmt.window });
  }

  /* Formats with no fields and only F-keys are footers, not screens. */
  for (const p of plans) {
    if (p.role === 'fragment' && p.format.fkeys.length) p.role = 'footer';
  }

  return { screenRows, plans };
}

module.exports = { planScreen, analyzeRecord, buildTable, humanize, cleanLabel, looksLikeLabel };
