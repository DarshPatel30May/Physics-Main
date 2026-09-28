/**
 * Robustness: every corpus question is re-solved in several rewritten forms that students
 * commonly paste — LaTeX-typeset (as copied from typeset papers), display maths on separate lines, hard-wrapped
 * PDF text, multi-line "(a)" layout,
 * and different command words. The answer must not change.
 */
import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';
import { CASES as B1 } from './corpus/batch1';
import { CASES as B2 } from './corpus/batch2';
import { CASES as B3 } from './corpus/batch3';
import { CASES as B4 } from './corpus/batch4';
import { CASES as B5 } from './corpus/batch5';
import { CASES as B6 } from './corpus/batch6';
import type { Case } from './corpus/types';

const UNITS = ['m/s²', 'm/s', 'm s-1', 'km/h', 'W/m²', 'lines per mm', 'nm', 'mm', 'cm', 'km', 'μm', 'μs', 'μC', 'mT', 'kV', 'keV', 'MeV', 'eV', 'kg', 'MW', 'mW', 'kW', 'Hz', 'Bq', 'Ω', 'm²', 'm', 's', 'g', 'N', 'J', 'V', 'T', 'A', 'W', 'C', 'u', 'K', 'days', 'day', 'years', 'hours', 'minutes', 'turns'];

function toLatex(q: string): string {
  let s = q;
  // scientific notation
  s = s.replace(/(\d+(?:\.\d+)?)\s*×\s*10\^(-?\d+)/g, (_m, a, e) => `${a}\\times10^{${e}}`);
  // number + unit → \(number\,\text{unit}\)
  const unitAlt = UNITS.map((u) => u.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')).join('|');
  s = s.replace(new RegExp(`(-?\\d+(?:\\.\\d+)?(?:\\\\times10\\^\\{-?\\d+\\})?)\\s*(${unitAlt})(?![A-Za-z])`, 'g'), (_m, n, u) => {
    const lu = u.replace('μ', '\\mu ').replace('Ω', '\\Omega').replace('²', '^{2}').replace('m s-1', 'm\\,s^{-1}');
    return `\\(${n}\\,\\text{${lu}}\\)`;
  });
  s = s.replace(/(\d+(?:\.\d+)?)°/g, '\\($1^\\circ\\)');
  s = s.replace(/(\d+(?:\.\d+)?)c\b/g, '\\($1c\\)');
  return s;
}

function toParts(q: string): string {
  // put the question sentence(s) on their own "(a)" line
  const m = /^(.*?[.?!])\s+((?:Calculate|Determine|Find|What|How|Show|At what|Estimate)[^]*)$/.exec(q);
  return m ? `${m[1]}\n(a) ${m[2]}` : `(a) ${q}`;
}

/** Every value typeset as display maths on its own line, as copied from a typeset paper. */
function toDisplay(q: string): string {
  return toLatex(q).replace(/\\\((.*?)\\\)/g, (_m, x) => `\n\\[\n${x}\n\\]\n`);
}

/** Lines hard-wrapped every six words, as copied out of a PDF. */
function wrapLines(q: string): string {
  return q.split(' ').map((w, i) => (i > 0 && i % 6 === 0 ? '\n' + w : (i > 0 ? ' ' : '') + w)).join('');
}

function swapVerb(q: string): string {
  return q.replace(/\bCalculate\b/, 'Determine');
}

const ALL: Array<[string, Case]> = [...B1.map((c) => ['b1', c] as [string, Case]), ...B2.map((c) => ['b2', c] as [string, Case]), ...B3.map((c) => ['b3', c] as [string, Case]), ...B4.map((c) => ['b4', c] as [string, Case]), ...B5.map((c) => ['b5', c] as [string, Case]), ...B6.map((c) => ['b6', c] as [string, Case])];
const VARIANTS: Array<[string, (q: string) => string]> = [['latex', toLatex], ['parts', toParts], ['verb', swapVerb], ['latex+parts', (q) => toParts(toLatex(q))], ['display', toDisplay], ['wrapped', wrapLines]];

function check(cse: Case, text: string) {
  const r = smartSolve(text);
  const targets = [cse.target, cse.alt].filter(Boolean) as string[];
  const part = r.parts.find((p) => p.target && targets.includes(p.target) && p.result?.ok);
  const dbg = `\n${text}\n→ scenario ${r.scenario?.id}; parts ${JSON.stringify(r.parts.map((p) => p.target))}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}; unused ${r.unused.map((x) => x.raw).join(',')}`;
  expect(part, dbg).toBeDefined();
  const got = part!.result!.values[part!.target!];
  expect(Math.abs(Math.abs(got) - Math.abs(cse.value)) / Math.abs(cse.value), `got ${got} expected ${cse.value}${dbg}`).toBeLessThan(cse.tol ?? 0.005);
}

describe('robustness to formatting and wording', () => {
  for (const [vname, fn] of VARIANTS) {
    for (const [b, cse] of ALL) {
      it(`[${vname}] ${b}: ${cse.q.slice(0, 70)}… → ${cse.target}`, () => check(cse, fn(cse.q)));
    }
  }
});
