/* DDS display-file parser.
 *
 * Turns a .dspf source member into a structured model:
 *
 *   { dspsiz, formats: [ { name, kind, keywords, fkeys, window,
 *                          fields: [...], constants: [...], subfile } ] }
 *
 * DDS is a fixed-column format. The columns that matter (1-based):
 *
 *   6      A         spec type
 *   7      *         comment
 *   8-16   N31 30    conditioning indicators
 *   17     R         record-format identifier
 *   19-28  NAME      field / format name
 *   29-34  LEN       length
 *   35     TYPE      A S Y P F L date/time...
 *   36-37  DEC       decimal positions
 *   38     USAGE     B O I H P M
 *   39-41  ROW
 *   42-44  COL
 *   45-80  KEYWORDS  or 'constant text'
 *
 * A trailing "-" or "+" at the end of the keyword area continues onto the next
 * line. Quoted constants may span lines that way.
 */
'use strict';

const FIELD_TYPES = {
  A: 'char', S: 'zoned', Y: 'zoned', P: 'packed', B: 'binary', F: 'float',
  L: 'date', T: 'time', Z: 'timestamp', G: 'graphic', N: 'char', J: 'char', E: 'char',
};

function isCommentOrBlank(line) {
  if (!line.trim()) return true;
  const specChar = line.charAt(5);
  if (line.charAt(6) === '*') return true;
  /* Sequence-numbered members sometimes carry the A in a shifted column. */
  return specChar !== 'A' && specChar !== 'a';
}

/* Join physical lines into logical ones, honouring DDS continuation. */
function logicalLines(text) {
  const raw = text.split(/\r?\n/);
  const out = [];
  let pending = null;

  for (const line of raw) {
    if (isCommentOrBlank(line)) {
      if (!line.trim()) continue;
      if (line.charAt(6) === '*') continue;
      continue;
    }
    const kw = line.slice(44).replace(/\s+$/, '');

    if (pending) {
      /* Continuation: append the keyword area, dropping leading blanks. */
      pending.kw = pending.kw.slice(0, -1) + kw.replace(/^\s+/, '');
      if (/[-+]$/.test(pending.kw)) continue;
      out.push(pending);
      pending = null;
      continue;
    }

    const rec = {
      cond: line.slice(7, 16),
      isFormat: line.charAt(16) === 'R' || line.charAt(16) === 'r',
      name: line.slice(18, 28).trim(),
      len: line.slice(28, 34).trim(),
      type: line.charAt(34).trim(),
      dec: line.slice(35, 37).trim(),
      usage: line.charAt(37).trim(),
      row: line.slice(38, 41).trim(),
      col: line.slice(41, 44).trim(),
      kw,
    };

    if (/[-+]$/.test(kw)) { pending = rec; continue; }
    out.push(rec);
  }
  if (pending) out.push(pending);
  return out;
}

/* Split a keyword area into individual KEYWORD(args) tokens plus any
   leading quoted constant. */
function parseKeywordArea(kw) {
  const result = { constant: null, keywords: [] };
  let s = kw.trim();
  if (!s) return result;

  if (s.startsWith("'")) {
    /* Quoted constant; '' is an escaped quote inside DDS. */
    let i = 1, buf = '';
    while (i < s.length) {
      if (s[i] === "'") {
        if (s[i + 1] === "'") { buf += "'"; i += 2; continue; }
        i += 1; break;
      }
      buf += s[i]; i += 1;
    }
    result.constant = buf;
    s = s.slice(i).trim();
  }

  const re = /([A-Z0-9]+)(\(([^()]*(?:\([^()]*\)[^()]*)*)\))?/gi;
  let m;
  while ((m = re.exec(s)) !== null) {
    result.keywords.push({ name: m[1].toUpperCase(), args: m[3] === undefined ? null : m[3] });
  }
  return result;
}

function parseIndicators(cond) {
  /* Positions 8-16 hold up to three indicators, each optionally negated. */
  const out = [];
  const s = cond.padEnd(9, ' ');
  for (let i = 0; i < 9; i += 3) {
    const chunk = s.slice(i, i + 3);
    const neg = chunk.charAt(0).toUpperCase() === 'N';
    const num = chunk.slice(1).trim();
    if (/^\d{1,2}$/.test(num)) out.push({ indicator: Number(num), negate: neg });
  }
  return out;
}

const FKEY_RE = /^C[AF](\d{2})$/;

function parseDspf(text) {
  const lines = logicalLines(text);
  const model = { dspsiz: null, formats: [] };
  let fmt = null;
  /* Keyword lines with no name attach to whatever was declared last. */
  let lastTarget = null;

  const newFormat = (name) => ({
    name,
    kind: 'record',
    keywords: [],
    fkeys: [],
    window: null,
    indicators: [],
    fields: [],
    constants: [],
    subfile: null,
    subfileOf: null,
  });

  for (const rec of lines) {
    const { constant, keywords } = parseKeywordArea(rec.kw);
    const inds = parseIndicators(rec.cond);

    if (rec.isFormat) {
      fmt = newFormat(rec.name);
      model.formats.push(fmt);
      lastTarget = fmt;
      applyFormatKeywords(fmt, keywords);
      continue;
    }

    /* File-level keywords appear before any R spec. */
    if (!fmt) {
      for (const k of keywords) if (k.name === 'DSPSIZ') model.dspsiz = k.args;
      continue;
    }

    if (rec.name) {
      const field = {
        name: rec.name.toLowerCase(),
        ddsName: rec.name,
        length: rec.len ? Number(rec.len) : null,
        ddsType: rec.type || 'A',
        decimals: rec.dec ? Number(rec.dec) : 0,
        usage: (rec.usage || 'O').toUpperCase(),
        row: rec.row ? Number(rec.row) : null,
        col: rec.col ? Number(rec.col) : null,
        keywords: keywords.slice(),
        indicators: inds,
        hidden: false,
        readonlyWhen: null,
      };

      /* Message-subfile plumbing fields are structural, not display. */
      for (const k of keywords) {
        if (k.name === 'SFLMSGKEY') { field.role = 'sflmsgkey'; field.hidden = true; }
        if (k.name === 'SFLPGMQ') { field.role = 'sflpgmq'; field.hidden = true; }
      }
      if (field.usage === 'H' || field.usage === 'P') field.hidden = true;

      fmt.fields.push(field);
      lastTarget = field;
      continue;
    }

    if (constant !== null) {
      const c = {
        text: constant,
        row: rec.row ? Number(rec.row) : null,
        col: rec.col ? Number(rec.col) : null,
        keywords: keywords.slice(),
        indicators: inds,
      };
      fmt.constants.push(c);
      lastTarget = c;
      continue;
    }

    /* Bare keyword line: belongs to the previous field/constant/format. */
    if (keywords.length) {
      if (lastTarget === fmt) {
        applyFormatKeywords(fmt, keywords, inds);
      } else if (lastTarget) {
        lastTarget.keywords.push(...keywords);
        if (inds.length && !lastTarget.condKeywords) lastTarget.condKeywords = [];
        if (inds.length) lastTarget.condKeywords.push({ indicators: inds, keywords });
      }
    }
  }

  postProcess(model);
  return model;
}

function applyFormatKeywords(fmt, keywords, inds) {
  for (const k of keywords) {
    fmt.keywords.push(k);
    if (k.name === 'SFL') fmt.kind = 'subfile';
    if (k.name === 'SFLCTL') { fmt.kind = 'sflctl'; fmt.subfileOf = (k.args || '').trim().toUpperCase(); }
    if (k.name === 'WINDOW') fmt.window = k.args;
    if (k.name === 'SFLSIZ') fmt.sflsiz = Number((k.args || '0').trim());
    if (k.name === 'SFLPAG') fmt.sflpag = Number((k.args || '0').trim());
    if (k.name === 'SFLCLR') fmt.sflclrIndicator = (inds && inds[0] && inds[0].indicator) || null;
    if (k.name === 'SFLMSGRCD') fmt.isMessageCtl = true;

    const fk = FKEY_RE.exec(k.name);
    if (fk) {
      /* CA03(03 'Exit') -> indicator 03, label Exit */
      const args = k.args || '';
      const lbl = /'([^']*)'/.exec(args);
      const ind = /^\s*(\d{1,2})/.exec(args);
      fmt.fkeys.push({
        key: 'F' + Number(fk[1]),
        num: Number(fk[1]),
        indicator: ind ? Number(ind[1]) : null,
        label: lbl ? lbl[1] : null,
        /* CA passes control without returning data; CF returns modified data. */
        passesData: k.name.startsWith('CF'),
      });
    }
  }
}

function postProcess(model) {
  const byName = {};
  for (const f of model.formats) byName[f.name.toUpperCase()] = f;

  for (const fmt of model.formats) {
    /* Attach subfile records to their controlling format. */
    if (fmt.kind === 'sflctl' && fmt.subfileOf && byName[fmt.subfileOf]) {
      const sfl = byName[fmt.subfileOf];
      sfl.attachedTo = fmt.name;
      fmt.subfile = sfl;
      if (sfl.fields.some((f) => f.role === 'sflmsgkey')) fmt.isMessageCtl = true;
    }

    /* DSPATR(PR) conditioned on an indicator means "read-only while N on". */
    for (const f of fmt.fields) {
      for (const ck of f.condKeywords || []) {
        if (ck.keywords.some((k) => k.name === 'DSPATR' && /\bPR\b/.test(k.args || ''))) {
          f.readonlyWhen = ck.indicators;
        }
      }
      f.jsonType = FIELD_TYPES[f.ddsType] || 'char';
      /* Y is a numeric-edit type; it carries decimals like zoned. */
      if (f.ddsType === 'Y' || f.ddsType === 'S') f.jsonType = 'zoned';
      f.input = f.usage === 'B' || f.usage === 'I';
      f.editCode = (f.keywords.find((k) => k.name === 'EDTCDE') || {}).args || null;
      f.allowsLower = f.keywords.some((k) => k.name === 'CHECK' && /LC/.test(k.args || ''));
      f.color = (f.keywords.find((k) => k.name === 'COLOR') || {}).args || null;
    }
    for (const c of fmt.constants) {
      c.color = (c.keywords.find((k) => k.name === 'COLOR') || {}).args || null;
      c.emphasis = c.keywords.some((k) => k.name === 'DSPATR' && /\b(HI|UL|RI)\b/.test(k.args || ''));
    }
  }
  /* Formats that are subfiles owned by a control record are not top-level. */
  model.topFormats = model.formats.filter((f) => !f.attachedTo);
}

module.exports = { parseDspf, logicalLines, parseKeywordArea, parseIndicators, FIELD_TYPES };
