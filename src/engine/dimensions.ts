/**
 * Dimensional analysis.
 *
 * A dimension is a vector of exponents over the SI base dimensions
 * [mass, length, time, current, temperature, amount].
 * Angles and counts are treated as dimensionless (radians are a ratio).
 */
export type Dim = readonly [number, number, number, number, number, number];

export const DIMLESS: Dim = [0, 0, 0, 0, 0, 0];

export const dim = (M = 0, L = 0, T = 0, I = 0, K = 0, N = 0): Dim => [M, L, T, I, K, N];

const EPS = 1e-9;

export function dimMul(a: Dim, b: Dim): Dim {
  return a.map((x, i) => x + b[i]) as unknown as Dim;
}
export function dimDiv(a: Dim, b: Dim): Dim {
  return a.map((x, i) => x - b[i]) as unknown as Dim;
}
export function dimPow(a: Dim, p: number): Dim {
  return a.map((x) => x * p) as unknown as Dim;
}
export function dimEq(a: Dim, b: Dim): boolean {
  return a.every((x, i) => Math.abs(x - b[i]) < EPS);
}
export function isDimless(a: Dim): boolean {
  return dimEq(a, DIMLESS);
}

/** Named SI coherent units, used to present a dimension nicely (most specific first). */
const NAMED: Array<{ sym: string; latex: string; d: Dim }> = [
  { sym: 'N', latex: '\\text{N}', d: dim(1, 1, -2) },
  { sym: 'J', latex: '\\text{J}', d: dim(1, 2, -2) },
  { sym: 'W', latex: '\\text{W}', d: dim(1, 2, -3) },
  { sym: 'Pa', latex: '\\text{Pa}', d: dim(1, -1, -2) },
  { sym: 'C', latex: '\\text{C}', d: dim(0, 0, 1, 1) },
  { sym: 'V', latex: '\\text{V}', d: dim(1, 2, -3, -1) },
  { sym: 'Ω', latex: '\\Omega', d: dim(1, 2, -3, -2) },
  { sym: 'T', latex: '\\text{T}', d: dim(1, 0, -2, -1) },
  { sym: 'Wb', latex: '\\text{Wb}', d: dim(1, 2, -2, -1) },
  { sym: 'J s', latex: '\\text{J s}', d: dim(1, 2, -1) },
  { sym: 'N/C', latex: '\\text{N C}^{-1}', d: dim(1, 1, -3, -1) },
];

const BASE = ['kg', 'm', 's', 'A', 'K', 'mol'];

function fmtExp(e: number): string {
  const r = Math.round(e * 1000) / 1000;
  return Number.isInteger(r) ? String(r) : String(r);
}

/** Express a dimension in SI base units, e.g. "kg m s^-2". */
export function dimToBaseString(d: Dim, latex = false): string {
  const parts: string[] = [];
  d.forEach((e, i) => {
    if (Math.abs(e) < EPS) return;
    const u = BASE[i];
    if (Math.abs(e - 1) < EPS) parts.push(latex ? `\\text{${u}}` : u);
    else parts.push(latex ? `\\text{${u}}^{${fmtExp(e)}}` : `${u}^${fmtExp(e)}`);
  });
  if (parts.length === 0) return latex ? '1' : '(dimensionless)';
  return parts.join(latex ? '\\,' : ' ');
}

/** Best human name for a dimension, preferring named derived units. */
export function dimToUnitLatex(d: Dim): string {
  if (isDimless(d)) return '\\text{(no unit)}';
  const named = NAMED.find((n) => dimEq(n.d, d));
  if (named) return named.latex;
  return dimToBaseString(d, true);
}

export function dimToUnitText(d: Dim): string {
  if (isDimless(d)) return '(no unit)';
  const named = NAMED.find((n) => dimEq(n.d, d));
  if (named) return named.sym;
  return dimToBaseString(d, false);
}
