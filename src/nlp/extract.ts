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
  wideBefore: string; // whole sentence before the value (lower case)
  prevStart: number; // absolute start of the previous value (-1 if none)
  beforeStart: number; // absolute index where `before` starts
  after: string; // context after (lower case)
  /** Explicit symbol written before '=' (e.g. "B = 0.50 T"). */
  symbol?: string;
  kinds: QuantityKind[];
}

/** Normalise a pasted question into a canonical plain-text form. */
const LATEX_SYMBOLS: Record<string, string> = {
  lambda: 'λ', theta: 'θ', phi: 'φ', varphi: 'φ', Phi: 'Φ', mu: 'μ', Omega: 'Ω', omega: 'ω', Delta: 'Δ', delta: 'δ', gamma: 'γ',
  epsilon: 'ε', varepsilon: 'ε', tau: 'τ', alpha: 'α', beta: 'β', pi: 'π', sigma: 'σ', rho: 'ρ', nu: 'ν', eta: 'η',
  times: '×', cdot: '·', circ: '°', degree: '°', approx: '≈', le: '≤', ge: '≥', leq: '≤', geq: '≥', to: '→', rightarrow: '→',
};

/** Convert LaTeX / Markdown maths (as pasted from typeset questions) into plain text. */
/** A line that starts a new question part: "(a)", "b)", "(ii)", "Part c". */
const PART_START = /^\s*(\(?[a-h]\)|\(?(i|ii|iii|iv|v|vi)\)|part\b|question\b|q\d)/i;

/** Words that begin a new instruction/sentence even when the line above has no full stop. */
const NEW_SENTENCE = /^\s*(calculate|determine|find|what|how|show|explain|estimate|assum|use|take|given|ignore|neglect|hence|then|evaluate|state|justify|compare|sketch|draw|describe|identify|if|[-•*]\s)/i;

/**
 * Join lines broken in the middle of a sentence (PDF copy-paste, typeset maths on its own line).
 * A single line break is kept only where a sentence ends, a new part starts ("(b)") or a new
 * instruction starts ("Calculate …"); blank lines are always kept.
 */
export function joinBrokenLines(s: string): string {
  return s.replace(/([^\n])[ \t]*\n[ \t]*(?=[^\s])/g, (m: string, prev: string, off: number, str: string) => {
    const after = str.slice(off + m.length);
    if (/[.?!:;]/.test(prev) || PART_START.test(after)) return m;
    if (NEW_SENTENCE.test(after) && !/\b(the|a|an|of|from|to|at|is|are|was|were|and|by|with|in|on|for|as|that|its|has|have|than|into|onto|between)$/i.test(str.slice(Math.max(0, off - 12), off + 1))) return m;
    return prev + ' ';
  });
}

export function stripLatex(input: string): string {
  let s = input;
  if (!/[\\$]|\^\{|_\{/.test(s)) return s;
  // Math delimiters are inline: display maths (\[ n = 4 \]) sits on its own line but is part of the
  // sentence around it. Keep a line break only where the sentence really ends or a new part starts.
  s = s.replace(/\s*(?:\$\$|\\\[|\\\]|\\\(|\\\)|\$)\s*/g, (m: string, off: number, str: string) => {
    if (!m.includes('\n')) return ' ';
    const before = str.slice(0, off).trimEnd();
    const after = str.slice(off + m.length);
    return /[.?!:]$/.test(before) || PART_START.test(after) ? '\n' : ' ';
  });
  s = s.replace(/\\[,;:! ]/g, ' ').replace(/~/g, ' ');
  s = s.replace(/\\%/g, '%');
  s = s.replace(/\^\s*\{?\s*\\circ(?:\s*\})?/g, '°');
  // symbols first, so "\mu\text{s}" becomes "μ\text{s}" rather than "\mus"
  s = s.replace(/\\(left|right|displaystyle|quad|qquad)(?![A-Za-z])/g, ' ');
  s = s.replace(/\\([A-Za-z]+)/g, (m, name: string) => (LATEX_SYMBOLS[name] !== undefined ? LATEX_SYMBOLS[name] : m));
  // flatten exponents/subscripts, then unwrap \text{…} etc. (innermost braces first)
  for (let k = 0; k < 4; k++) {
    s = s.replace(/\^\s*\{([^{}]*)\}/g, '^$1');
    s = s.replace(/_\s*\{([^{}]*)\}/g, '_$1');
    s = s.replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '($1)/($2)');
    s = s.replace(/\\sqrt\s*\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\\(?:text|mathrm|textrm|mathit|mathbf|textbf|operatorname|mbox|rm)\s*\{([^{}]*)\}/g, '$1');
  }
  s = s.replace(/\\\\/g, '\n');
  s = s.replace(/\\([A-Za-z]+)/g, '$1');
  s = s.replace(/[{}]/g, '');
  s = s.replace(/\*\*/g, '');
  // "μ m" → "μm" after \mu m
  s = s.replace(/μ\s+(m|s|C|A|T|F|g|V|J|W|Wb)\b/g, 'μ$1');
  s = s.replace(/[ \t]{2,}/g, ' ');
  return s;
}

export function normaliseQuestion(text: string): string {
  let s = joinBrokenLines(stripLatex(text).replace(/\r/g, ''))
    .replace(/[‐‑‒–—−]/g, '-')
    .replace(/µ/g, 'μ')
    .replace(/Ω/g, 'Ω')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/ /g, ' ');
  s = normaliseSuperscripts(s);
  // "n=4" and "n = 4" read the same.
  s = s.replace(/([^\s=<>!])[ \t]*=[ \t]*(?=[^\s=])/g, '$1 = ');
  // A minus sign separated from its number (e.g. typeset "− 1.51 eV") belongs to the number.
  s = s.replace(/(^|[\s(=:])-\s+(?=\d)/g, '$1-');
  // scientific notation variants: 3.00 × 10^8, 3.00 x 10^-19, 3.00 X 10 -19, 3.00*10^8
  s = s.replace(/(\d(?:[\d.]*\d)?)\s*[×xX✕*·]\s*10\s*\^\s*\(?\s*([-+]?\s*\d+)(?:\s*\))?/g, (_m, a, b) => `${a}e${String(b).replace(/\s+/g, '')}`);
  s = s.replace(/(\d(?:[\d.]*\d)?)\s*[×xX✕]\s*10\s*(-\s*\d+)/g, (_m, a, b) => `${a}e${String(b).replace(/\s+/g, '')}`);
  s = s.replace(/(^|[^\d.e])10\s*\^\s*\(?\s*([-+]?\d+)(?:\s*\))?/g, (_m, pre, b) => `${pre}1e${b}`);
  s = s.replace(/\(\s*\d+\s*marks?\s*\)/gi, ' ').replace(/\bquestion\s+\d+\b/gi, ' ');
  s = s.replace(/(\d),(\d{3})(?![\d])/g, '$1$2');
  s = s.replace(/electron[\s-]?volts?/gi, 'eV');
  // "30 revolutions in 20 s" → a frequency (count ÷ time), keeping the data's precision
  s = s.replace(/(\d+(?:\.\d+)?)\s*(?:complete\s+)?(?:revolutions|rotations|revs|orbits|oscillations|cycles|turns|laps|circuits)\s+(?:in|every|each)\s+(\d+(?:\.\d+)?)\s*(s|sec|seconds?|min|minutes?|h|hours?)\b/gi, (m, n, t, u) => {
    const secs = Number(t) * (/^m/i.test(u) ? 60 : /^h/i.test(u) ? 3600 : 1);
    const f = Number(n) / secs;
    const sf = Math.max(2, Math.min(countSigFigs(n), countSigFigs(t)));
    void m;
    return `a frequency of ${Number(f.toPrecision(sf + 1))} Hz`;
  });
  // Energy-level words → principal quantum numbers, keeping the words as context
  const ORD: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7 };
  s = s.replace(/\b(first|second|third|fourth|fifth|sixth)\s+excited\s+state\b(?!\s*\(n)/gi, (m, w) => `${m} (n = ${ORD[w.toLowerCase()] + 1})`);
  s = s.replace(/\b(first|second|third|fourth|fifth|sixth|seventh)\s+(?:energy\s+)?(?:level|orbit|shell)\b(?!\s*\(n)/gi, (m, w) => `${m} (n = ${ORD[w.toLowerCase()]})`);
  s = s.replace(/\bground\s+state\b(?!\s*\(n)/gi, 'ground state (n = 1)');
  // Turns ratio "1:20" → primary and secondary turns
  s = s.replace(/turns\s+ratio\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/gi, (_m, a, b2) => `turns ratio with the primary coil having ${a} turns and the secondary coil having ${b2} turns`);
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
    if (/[A-Za-z]-$/.test(text.slice(Math.max(0, start - 2), start)) && !/[\d.][eE]-$/.test(text.slice(Math.max(0, start - 3), start))) { re.lastIndex = end; continue; }
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
      wideBefore: '',
      prevStart: -1,
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
    q.prevStart = i > 0 ? out[i - 1].start : -1;
    {
      const sent = text.slice(Math.max(0, q.start - 200), q.start);
      const sb2 = Math.max(sent.lastIndexOf('. '), sent.lastIndexOf('? '), sent.lastIndexOf('\n'));
      q.wideBefore = (sb2 >= 0 ? sent.slice(sb2 + 1) : sent).toLowerCase();
    }
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
