import { describe, it, expect } from 'vitest';
import { parseUnit, toSI, fromSI } from '../engine/units';
import { parseNumber, formatSig, countSigFigs, resolveSigFigs } from '../engine/numbers';
import { compile, evaluate, toLatex, dimOf } from '../engine/expr';
import { dim, dimEq } from '../engine/dimensions';

describe('unit engine', () => {
  const cases: Array<[string, number, number]> = [
    ['nm', 500, 500e-9], ['μm', 2, 2e-6], ['µm', 2, 2e-6], ['um', 2, 2e-6], ['mm', 3, 3e-3], ['cm', 4, 0.04], ['km', 1, 1000], ['pm', 1, 1e-12],
    ['mm^2', 1, 1e-6], ['cm²', 1, 1e-4], ['ns', 1, 1e-9], ['μs', 2.2, 2.2e-6], ['ms', 5, 5e-3], ['min', 2, 120], ['h', 1, 3600], ['day', 1, 86400], ['yr', 1, 365.25 * 86400],
    ['g', 120, 0.12], ['kg', 1, 1], ['km/h', 90, 25], ['km/s', 1, 1000], ['m/s', 3, 3], ['m s^-1', 3, 3], ['m s-1', 3, 3], ['m s⁻¹', 3, 3],
    ['kN', 2, 2000], ['eV', 1, 1.602e-19], ['keV', 1, 1.602e-16], ['MeV', 1, 1.602e-13], ['GeV', 1, 1.602e-10], ['kJ', 1, 1000],
    ['kW', 1, 1000], ['MW', 1, 1e6], ['MHz', 1, 1e6], ['GHz', 1, 1e9], ['THz', 1, 1e12], ['mC', 1, 1e-3], ['μC', 1, 1e-6], ['nC', 1, 1e-9],
    ['mA', 1, 1e-3], ['μA', 1, 1e-6], ['mV', 1, 1e-3], ['kV', 1, 1e3], ['N/C', 1, 1], ['V/m', 1, 1], ['mT', 1, 1e-3], ['μT', 1, 1e-6],
    ['Wb', 1, 1], ['Ω', 1, 1], ['kΩ', 1, 1e3], ['MΩ', 1, 1e6], ['kPa', 1, 1e3], ['MPa', 1, 1e6], ['Pa', 1, 1], ['c', 0.8, 2.4e8], ['°', 180, Math.PI],
    ['u', 1, 1.661e-27], ['lines/mm', 600, 6e5], ['lines per mm', 600, 6e5], ['km/s/Mpc', 70, 70e3 / 3.086e22], ['MeV/c^2', 1, 1.602e-13 / 9e16], ['%', 85, 0.85],
  ];
  for (const [u, v, si] of cases) {
    it(`${v} ${u} → SI`, () => { expect(toSI(v, u)).toBeCloseTo(si, 12 - Math.floor(Math.log10(Math.abs(si)))); expect(fromSI(toSI(v, u), u)).toBeCloseTo(v, 9); });
  }
  it('°C offset', () => { expect(toSI(27, '°C')).toBeCloseTo(300.15); expect(fromSI(373.15, '°C')).toBeCloseTo(100); });
  it('rejects garbage', () => { expect(parseUnit('blarg')).toBeNull(); });
  it('dimension of N m^2 kg^-2', () => { expect(dimEq(parseUnit('N m^2 kg^-2')!.dim, dim(-1, 3, -2))).toBe(true); });
  it('rpm as frequency', () => { expect(toSI(60, 'rpm', 'frequency')).toBeCloseTo(1); expect(toSI(60, 'rpm', 'angularVelocity')).toBeCloseTo(2 * Math.PI); });
});

describe('number parsing', () => {
  const cases: Array<[string, number, number]> = [
    ['3.00 × 10^8', 3e8, 3], ['3.00e8', 3e8, 3], ['3.00 × 10⁸', 3e8, 3], ['6.63 × 10⁻³⁴', 6.63e-34, 3], ['1.602x10^-19', 1.602e-19, 4],
    ['1.602 x 10-19', 1.602e-19, 4], ['-1.602E-19', -1.602e-19, 4], ['0.00340', 0.0034, 3], ['1200', 1200, 4], ['12', 12, 2], ['0.5', 0.5, 1], ['1,200', 1200, 4], ['6.0 × 10²⁴', 6e24, 2],
  ];
  for (const [s, v, sf] of cases) it(s, () => { const p = parseNumber(s)!; expect(p.value).toBeCloseTo(v, 30); expect(p.value / v).toBeCloseTo(1, 12); expect(p.sigFigs).toBe(sf); });
  it('sig fig counting', () => { expect(countSigFigs('0.0200')).toBe(3); expect(countSigFigs('100.')).toBe(3); });
  it('format', () => {
    expect(formatSig(1.9224e-16, 3).latex).toBe('1.92 \\times 10^{-16}');
    expect(formatSig(15, 2).text).toBe('15');
    expect(formatSig(0.05, 2).text).toBe('0.050');
    expect(formatSig(9999.6, 3).text).toBe('1.00 × 10⁴');
    expect(formatSig(1.6667, 3).text).toBe('1.67');
    expect(formatSig(123.456, 2).text).toBe('120');
  });
  it('auto sig figs', () => { expect(resolveSigFigs('auto', [3, 4])).toBe(3); expect(resolveSigFigs('auto', [1])).toBe(2); expect(resolveSigFigs('auto', [])).toBe(3); });
});

describe('expression engine', () => {
  it('evaluates', () => { expect(evaluate(compile('q*v*B*sin(theta)'), { q: 2, v: 3, B: 4, theta: Math.PI / 2 })).toBeCloseTo(24); });
  it('latex', () => {
    expect(toLatex(compile('m*v/(q*B)'), { symbols: { m: 'm', v: 'v', q: 'q', B: 'B' } })).toBe('\\frac{m v}{q B}');
    expect(toLatex(compile('sqrt(G*M/r)'), { symbols: { G: 'G', M: 'M', r: 'r' } })).toBe('\\sqrt{\\frac{G M}{r}}');
  });
  it('dimensions of qvB = N', () => {
    const r = dimOf(compile('q*v*B*sin(theta)'), { q: dim(0, 0, 1, 1), v: dim(0, 1, -1), B: dim(1, 0, -2, -1), theta: dim() });
    expect(dimEq(r.dim, dim(1, 1, -2))).toBe(true);
    expect(r.issues).toHaveLength(0);
  });
  it('flags adding unlike', () => { expect(dimOf(compile('a+b'), { a: dim(1), b: dim(0, 1) }).issues.length).toBe(1); });
});
