import { normaliseSuperscripts } from './units';

export interface ParsedNumber {
  value: number;
  sigFigs: number;
  raw: string;
}

/** Normalise the many ways students write scientific notation. */
export function normaliseNumberText(s: string): string {
  return normaliseSuperscripts(s)
    .replace(/[−–—]/g, '-')
    .replace(/\s*[×✕✖⋅·]\s*10\s*\^?\s*\(?\s*([-+]?\d+)\s*\)?/g, 'e$1')
    .replace(/\s*[xX*]\s*10\s*\^\s*\(?\s*([-+]?\d+)\s*\)?/g, 'e$1')
    .replace(/\s*[xX]\s*10\s*(-\d+)/g, 'e$1')
    .replace(/(\d),(\d{3})(?!\d)/g, '$1$2');
}

/** Count significant figures of a decimal mantissa string such as "0.00340" or "1200". */
export function countSigFigs(mantissa: string): number {
  let s = mantissa.replace(/^[-+]/, '');
  if (!/\d/.test(s)) return 0;
  const hasPoint = s.includes('.');
  s = s.replace('.', '');
  s = s.replace(/^0+/, '');
  if (s.length === 0) return 1; // "0" or "0.0"
  if (!hasPoint) {
    // Trailing zeros in an integer are ambiguous; HSC convention treats them as significant
    // unless the context says otherwise. We keep them (min 1).
    return s.length;
  }
  return s.length;
}

const NUM_RE = /^([-+]?(?:\d+\.?\d*|\.\d+))(?:[eE]([-+]?\d+))?$/;

export function parseNumber(input: string): ParsedNumber | null {
  const s = normaliseNumberText(input.trim()).replace(/\s+/g, '');
  if (s === '') return null;
  const m = NUM_RE.exec(s);
  if (!m) return null;
  const value = Number(m[1]) * (m[2] ? Math.pow(10, Number(m[2])) : 1);
  if (!Number.isFinite(value)) return null;
  // Guard float error in Number(m1)*10^k by re-parsing canonical string
  const v2 = Number(`${m[1]}e${m[2] ?? '0'}`);
  return { value: Number.isFinite(v2) ? v2 : value, sigFigs: countSigFigs(m[1]), raw: input.trim() };
}

/* ------------------------------------------------------------------ */
/* Formatting                                                           */
/* ------------------------------------------------------------------ */

export type SigFigMode = 'auto' | 2 | 3 | 4 | 'full';

export interface Formatted {
  text: string;
  latex: string;
  mantissa: string;
  exponent: number;
}

/** Round to n significant figures, returning mantissa/exponent strings (no float noise). */
export function toSig(value: number, n: number): { mantissa: string; exponent: number } {
  if (value === 0) return { mantissa: n > 1 ? '0.' + '0'.repeat(n - 1) : '0', exponent: 0 };
  const s = value.toExponential(Math.max(0, n - 1)); // e.g. "1.92e-16"
  const [m, e] = s.split('e');
  return { mantissa: m, exponent: Number(e) };
}

function fixedFromSig(value: number, n: number): string {
  // Represent value with n significant figures in positional notation.
  if (value === 0) return n > 1 ? '0.' + '0'.repeat(n - 1) : '0';
  const exp = Math.floor(Math.log10(Math.abs(value)));
  const decimals = Math.max(0, n - 1 - exp);
  const rounded = Number(value.toPrecision(n));
  const exp2 = Math.floor(Math.log10(Math.abs(rounded)));
  const dec2 = Math.max(0, n - 1 - exp2);
  return rounded.toFixed(Math.min(20, exp2 === exp ? decimals : dec2));
}

/**
 * Format a number to n significant figures. Uses scientific notation when
 * |x| ≥ 10^4 or |x| < 10^-2 (HSC style), positional otherwise.
 */
export function formatSig(value: number, n: number | 'full'): Formatted {
  if (!Number.isFinite(value)) return { text: String(value), latex: '\\text{undefined}', mantissa: String(value), exponent: 0 };
  const nn = n === 'full' ? 10 : Math.max(1, Math.min(15, n));
  const abs = Math.abs(value);
  // Scientific notation for large/small numbers, and whenever positional form would show
  // non-significant trailing zeros (e.g. 9600 to 2 s.f. → 9.6 × 10³).
  const exp10 = abs === 0 ? 0 : Math.floor(Math.log10(Number(abs.toPrecision(nn))));
  const useSci = abs !== 0 && (abs >= 1e4 || abs < 1e-2 || (n !== 'full' && exp10 >= nn));
  if (!useSci) {
    let text = fixedFromSig(value, nn);
    if (n === 'full') text = trimZeros(text);
    // when rounding pushed us to ≥10^4, fall through to sci
    if (Math.abs(Number(text)) < 1e4) return { text, latex: text, mantissa: text, exponent: 0 };
  }
  let { mantissa, exponent } = toSig(value, nn);
  if (n === 'full') mantissa = trimZeros(mantissa);
  const sup = exponent.toString().replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
  return {
    text: `${mantissa} × 10${sup}`,
    latex: `${mantissa} \\times 10^{${exponent}}`,
    mantissa,
    exponent,
  };
}

function trimZeros(s: string): string {
  if (!s.includes('.')) return s;
  return s.replace(/0+$/, '').replace(/\.$/, '');
}

/** Choose the number of significant figures for the final answer. */
export function resolveSigFigs(mode: SigFigMode, dataSigFigs: number[]): number | 'full' {
  if (mode === 'full') return 'full';
  if (mode !== 'auto') return mode;
  const relevant = dataSigFigs.filter((n) => n > 0);
  if (relevant.length === 0) return 3;
  const min = Math.min(...relevant);
  // NESA sample answers normally quote 3 s.f. even when some data are given to 2 s.f.
  return Math.max(3, Math.min(4, min));
}

/** Plain-text scientific formatting for inputs/logs with 4 s.f. */
export function fmt(value: number, n: number | 'full' = 4): string {
  return formatSig(value, n).text;
}
export function fmtLatex(value: number, n: number | 'full' = 4): string {
  return formatSig(value, n).latex;
}

/** Format to n s.f. but drop trailing zeros after the decimal point (for angles and exact values). */
export function formatTrim(value: number, n: number): Formatted {
  const f = formatSig(value, n);
  const trim = (x: string) => (x.includes('.') ? x.replace(/0+$/, '').replace(/\.$/, '') : x);
  if (f.exponent === 0 && !f.text.includes('×')) {
    const t = trim(f.text);
    return { ...f, text: t, latex: t, mantissa: t };
  }
  return f;
}

/** Plain-text unit prettifier: "m/s^2" → "m s⁻²". */
export function prettyUnit(u: string): string {
  const sup = (x: string) => x.replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(d)]);
  let s = u.replace(/\^(-?\d+)/g, (_m, e) => sup(e));
  s = s.replace(/\/([A-Za-zμΩ]+)(⁻?[⁰¹²³⁴⁵⁶⁷⁸⁹]*)/g, (_m, b, e) => ` ${b}${e ? (e.startsWith('⁻') ? e.slice(1) : '⁻' + e) : '⁻¹'}`);
  return s;
}
