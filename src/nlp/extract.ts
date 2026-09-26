import { parseUnit, UnitDef, normaliseSuperscripts } from '../engine/units';
import { countSigFigs } from '../engine/numbers';
import { QUANTITIES, QuantityKind } from '../engine/quantities';
import { dimEq, isDimless } from '../engine/dimensions';

export interface Extracted {
  id: number;
  value: number; // as written (not SI)
  raw: string;
  unit: string; // canonical unit string ('' when none)
  unitDef: UnitDef;
  sigFigs: number;
  start: number;
  end: number;
  before: string; // context before (lower case)
  beforeStart: number; // absolute index where `before` starts
  after: string; // context after (lower case)
  /** Explicit symbol written before '=' (e.g. "B = 0.50 T"). */
  symbol?: string;
  kinds: QuantityKind[];
}

/** Normalise a pasted question into a canonical plain-text form. */
export function normaliseQuestion(text: string): string {
  let s = text
    .replace(/\r/g, '')
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/µ/g, 'μ')
    .replace(/Ω/g, 'Ω')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/ /g, ' ');
  s = normaliseSuperscripts(s);
  // scientific notation variants: 3.00 × 10^8, 3.00 x 10^-19, 3.00 X 10 -19, 3.00*10^8
  s = s.replace(/(\d(?:[\d.]*\d)?)\s*[×xX✕*·]\s*10\s*\^\s*\(?\s*([-+]?\s*\d+)(?:\s*\))?/g, (_m, a, b) => `${a}e${String(b).replace(/\s+/g, '')}`);
  s = s.replace(/(\d(?:[\d.]*\d)?)\s*[×xX✕]\s*10\s*(-\s*\d+)/g, (_m, a, b) => `${a}e${String(b).replace(/\s+/g, '')}`);
  s = s.replace(/(^|[^\d.e])10\s*\^\s*\(?\s*([-+]?\d+)(?:\s*\))?/g, (_m, pre, b) => `${pre}1e${b}`);
  s = s.replace(/\(\s*\d+\s*marks?\s*\)/gi, ' ').replace(/\bquestion\s+\d+\b/gi, ' ');
  s = s.replace(/(\d),(\d{3})(?![\d])/g, '$1$2');
  s = s.replace(/electron[\s-]?volts?/gi, 'eV');
  s = s.replace(/light[\s-]?years?/gi, 'ly');
  s = s.replace(/(\d)\s*degrees?\b/gi, '$1°');
  s = s.replace(/(\d)\s*deg\b/gi, '$1°');
  s = s.replace(/(\d)\s*o\s*C\b/g, '$1 °C');
  s = s.replace(/metres per second|meters per second/gi, 'm/s');
  s = s.replace(/(\d)\s*(?:revolutions|rotations|revs|turns|cycles)\s+(?:per|each|every)\s+second\b/gi, '$1 Hz');
  s = s.replace(/(\d)\s*(?:revolutions|rotations|revs|turns|cycles)\s+(?:per|each|every)\s+minute\b/gi, '$1 rpm');
  s = s.replace(/(\d)\s*r\.p\.m\./gi, '$1 rpm');
  s = s.replace(/kilometres per hour|kilometers per hour/gi, 'km/h');
  s = s.replace(/(\d)\s*(?:lines|slits)\s+per\s+(millimetre|millimeter|mm)\b/gi, '$1 lines/mm');
  s = s.replace(/(\d)\s*(?:lines|slits)\s+per\s+(centimetre|centimeter|cm)\b/gi, '$1 lines/cm');
  s = s.replace(/(\d)\s*(?:lines|slits)\s+per\s+(metre|meter|m)\b/gi, '$1 lines/m');
  return s;
}

const NUM = String.raw`[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?`;
const SYMBOL = String.raw`([A-Za-zλθΦφεγτωμρΔαβσ][A-Za-z0-9_₀-₉]*(?:\s?\/\s?[A-Za-z])?)`;

const STOP_WORDS = new Set(['a', 'an', 'and', 'at', 'in', 'is', 'of', 'on', 'to', 'the', 'by', 'as', 'or', 'if', 'it', 'be', 'from', 'for', 'with', 'that', 'this', 'into']);

function unitKinds(u: UnitDef, unit: string): QuantityKind[] {
  const kinds: QuantityKind[] = [];
  if (unit === '°' || unit === 'rad' || unit === 'deg') return ['angle'];
  if (unit === '%') return ['percent', 'amount'];
  if (unit === 'turns' || unit === 'lines' || unit === 'slits' || unit === 'nuclei' || unit === 'photons') return ['count', 'amount', 'dimensionless'];
  for (const q of Object.values(QUANTITIES)) {
    if (q.kind === 'angle' || q.kind === 'percent') continue;
    if (dimEq(q.dim, u.dim)) kinds.push(q.kind);
  }
  if (isDimless(u.dim) && unit === '') return ['dimensionless', 'count', 'amount'];
  if (kinds.includes('mass') || kinds.includes('activity')) kinds.push('amount');
  return kinds;
}

/** Try to read a unit starting at position `pos`, preferring the longest valid match (≤ 4 tokens). */
function readUnit(text: string, pos: number): { unit: string; def: UnitDef; len: number } | null {
  const rest = text.slice(pos);
  const lead = /^[ \t]{0,2}/.exec(rest)![0];
  const tokRe = /(\s*)([^\s,;:?!()]+)/y;
  const toks: Array<{ ws: string; tok: string; endOff: number }> = [];
  let off = lead.length;
  tokRe.lastIndex = off;
  for (let i = 0; i < 4; i++) {
    if (i > 0) tokRe.lastIndex = off;
    const m = tokRe.exec(rest);
    if (!m || (i === 0 && m[1].length > 0)) break;
    if (i > 0 && /\n/.test(m[1])) break;
    off = tokRe.lastIndex;
    toks.push({ ws: m[1], tok: m[2], endOff: off });
  }
  for (let k = toks.length; k >= 1; k--) {
    const parts = toks.slice(0, k).map((t) => t.tok);
    let cand = parts.join(' ');
    const trimmed = cand.replace(/[.,;:?!)]+$/, '');
    const cut = cand.length - trimmed.length;
    cand = trimmed;
    if (!cand) continue;
    const low = cand.toLowerCase();
    if (k === 1 && STOP_WORDS.has(cand)) return null;
    if (k > 1 && parts.slice(1).some((t) => STOP_WORDS.has(t.replace(/[.,;:?!]+$/, '')))) continue;
    void low;
    if (k > 1 && !/per|\/|\^|[-⁻]?\d$/.test(cand) && !/^(?:[a-zA-ZμΩ°]{1,4})(?: [a-zA-ZμΩ°]{1,4}(?:\^?-?\d)?)+$/.test(cand)) continue;
    const def = parseUnit(cand);
    if (!def) continue;
    if (/^[a-zA-Z]$/.test(cand) && !['m', 's', 'g', 'N', 'J', 'W', 'V', 'A', 'T', 'C', 'K', 'h', 'c', 'u'].includes(cand)) continue;
    if (cand === 't' || cand === 'e') continue;
    return { unit: cand, def, len: toks[k - 1].endOff - cut };
  }
  return null;
}

/** Extract every number + unit from normalised text, with local context. */
export function extractQuantities(text: string): Extracted[] {
  const out: Extracted[] = [];
  const re = new RegExp(`(?<![\\w.])(${NUM})`, 'g');
  let m: RegExpExecArray | null;
  let id = 0;
  while ((m = re.exec(text))) {
    const rawNum = m[1];
    const start = m.index;
    let end = start + rawNum.length;
    // Skip nuclide notation such as U-235 / carbon-14 (the number is a mass number, not a measurement)
    if (/[A-Za-z]-$/.test(text.slice(Math.max(0, start - 2), start)) && !/e-$/.test(text.slice(Math.max(0, start - 2), start))) { re.lastIndex = end; continue; }
    // Skip list labels like "(a)" / question numbers "1." at the start of a line
    if (/^\d+\.$/.test(text.slice(start, end + 1)) && (start === 0 || text[start - 1] === '\n')) continue;
    const mant = rawNum.replace(/e[-+]?\d+$/i, '');
    let unitStr = '';
    let def: UnitDef = { factor: 1, dim: [0, 0, 0, 0, 0, 0], latex: '' };
    const ru = readUnit(text, end);
    if (ru) {
      unitStr = ru.unit;
      def = ru.def;
      end += ru.len;
    }
    // symbol "X = number"
    const beforeFull = text.slice(Math.max(0, start - 40), start);
    const sm = new RegExp(`${SYMBOL}\\s*=\\s*$`).exec(beforeFull);
    const symbol = sm ? sm[1].replace(/\s/g, '') : undefined;
    out.push({
      id: id++,
      value: Number(rawNum),
      raw: text.slice(start, end),
      unit: canonicalUnit(unitStr),
      unitDef: def,
      sigFigs: countSigFigs(mant),
      start,
      end,
      before: '',
      beforeStart: start,
      after: '',
      symbol,
      kinds: unitKinds(def, canonicalUnit(unitStr)),
    });
    re.lastIndex = end;
  }
  // Contexts bounded by neighbouring quantities and sentence ends. The gap between two
  // quantities is split at the first conjunction: words before it describe the previous
  // value ("500 turns on the primary coil"), words after it describe the next value.
  const CONJ = /(\band\b|,|;|\bwhile\b|\bwhereas\b|\bbut\b|\bwith\b)/i;
  for (let i = 0; i < out.length; i++) {
    const q = out[i];
    const prevEnd = i > 0 ? out[i - 1].end : 0;
    const nextStart = i < out.length - 1 ? out[i + 1].start : text.length;
    let before = text.slice(Math.max(prevEnd, q.start - 90), q.start);
    const sentBreak = Math.max(before.lastIndexOf('. '), before.lastIndexOf('? '), before.lastIndexOf('\n'));
    if (sentBreak >= 0) before = before.slice(sentBreak + 1);
    else if (i > 0 && prevEnd >= q.start - 90) {
      const cm = CONJ.exec(before);
      if (cm && cm.index > 0) before = before.slice(cm.index);
    }
    let after = text.slice(q.end, Math.min(nextStart, q.end + 50));
    const sb = after.search(/[.?!](\s|$)|\n/);
    if (sb >= 0) after = after.slice(0, sb);
    else if (nextStart <= q.end + 50) {
      const cm = CONJ.exec(after);
      if (cm && cm.index > 0) after = after.slice(0, cm.index);
    }
    q.before = before.toLowerCase();
    q.beforeStart = q.start - before.length;
    q.after = after.toLowerCase();
  }
  return out;
}

function canonicalUnit(u: string): string {
  const t = u.trim();
  const map: Record<string, string> = { degrees: '°', degree: '°', deg: '°', 'ohms': 'Ω', ohm: 'Ω' };
  return map[t.toLowerCase()] ?? t;
}
