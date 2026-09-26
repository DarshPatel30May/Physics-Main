import { describe, it, expect } from 'vitest';
import { getScenario } from '../data/scenarios/index';
import { solveWithAssumptions, KnownInput } from '../engine/solver';
import { formatAnswer } from '../ui/format';
import { toSI } from '../engine/units';

const k = (o: Record<string, number>, sf = 3): Record<string, KnownInput> => Object.fromEntries(Object.entries(o).map(([a, v]) => [a, { value: v, sigFigs: sf, origin: 'given' as const }]));
const solve = (id: string, known: Record<string, number>, target: string, sf = 3) => solveWithAssumptions(getScenario(id), k(known, sf), { target });
const D = Math.PI / 180;

describe('user-specified reference calculations', () => {
  it('magnetic force: q = 1.602e-19 C, v = 1200 m/s, B = 3.00 T, θ = 90° → F = 5.77e-16 N', () => {
    const r = solve('magnetic_particle', { q: 1.602e-19, v: 1200, B: 3.0, theta: 90 * D }, 'F');
    expect(r.values.F).toBeCloseTo(5.7672e-16, 19);
    expect(formatAnswer(getScenario('magnetic_particle'), 'F', r, 'auto').main.text).toBe('5.77 × 10⁻¹⁶ N');
  });
  it('photon: λ = 500 nm → metres → f = c/λ → E = hf', () => {
    const lam = toSI(500, 'nm');
    expect(lam).toBeCloseTo(5e-7, 20);
    const r = solve('photon', { lambda: lam }, 'E');
    expect(r.steps.map((s) => s.unknown)).toEqual(['f', 'E']);
    expect(r.values.f).toBeCloseTo(6.0e14, 0);
    expect(r.values.E).toBeCloseTo(3.9756e-19, 22);
  });
  it('relativity: v = 0.80c → γ = 1.667', () => {
    const r = solve('relativity', { v: toSI(0.8, 'c') }, 'gamma');
    expect(r.values.gamma).toBeCloseTo(5 / 3, 12);
  });
  it('orbital velocity with NESA constants (r = 7.0e6 m around Earth)', () => {
    const r = solve('orbit', { M: 6.0e24, r: 7.0e6 }, 'v');
    expect(r.values.v).toBeCloseTo(Math.sqrt((6.67e-11 * 6.0e24) / 7.0e6), 6);
  });
  it('half-life: 120 g, 30 y, 90 y → 3 half-lives → 15 g', () => {
    const r = solveWithAssumptions(getScenario('decay'), { N0: { value: toSI(120, 'g'), unit: 'g', sigFigs: 3, origin: 'given' }, thalf: { value: toSI(30, 'yr'), sigFigs: 2, origin: 'given' }, t: { value: toSI(90, 'yr'), sigFigs: 2, origin: 'given' } }, { target: 'Nt' });
    expect(r.values.n).toBeCloseTo(3, 12);
    const a = formatAnswer(getScenario('decay'), 'Nt', r, 'auto');
    expect(a.main.text).toBe('15 g');
  });
});

describe('physical validation rejects impossible data', () => {
  it('negative mass', () => { expect(solve('circular', { m: -2, v: 3, r: 1 }, 'Fc').ok).toBe(false); });
  it('zero radius', () => { const r = solve('circular', { m: 2, v: 3, r: 0 }, 'Fc'); expect(r.ok).toBe(false); });
  it('negative frequency', () => { expect(solve('waves', { f: -5, lambda: 2 }, 'v').ok).toBe(false); });
  it('non-positive wavelength', () => { expect(solve('em_spectrum', { lambda: 0 }, 'f').ok).toBe(false); });
  it('speed ≥ c', () => { expect(solve('relativity', { v: 3.0e8 }, 'gamma').ok).toBe(false); expect(solve('relativity', { v: 4e8 }, 'gamma').ok).toBe(false); });
  it('efficiency > 100%', () => { const r = solve('transformer_real', { Pin: 100, Pout: 120 }, 'eta'); expect(r.ok).toBe(false); expect(r.errors.join()).toMatch(/100%/); });
  it('sin θ > 1 in a grating (order does not exist)', () => {
    const r = solve('interference', { lambda: 600e-9, d: 1e-6, m: 2 }, 'theta');
    expect(r.ok).toBe(false);
    expect(r.errors.join()).toMatch(/sine|exceed 1/);
  });
  it('total internal reflection: no refracted ray', () => {
    const r = solve('refraction', { n1: 1.5, th1: 60 * D, n2: 1.0 }, 'th2');
    expect(r.ok).toBe(false);
  });
  it('projectile cannot reach a target higher than its maximum height', () => {
    const r = solve('projectile', { u: 10, theta: 30 * D, sy: 10 }, 't');
    expect(r.ok).toBe(false);
  });
  it('negative absolute temperature', () => { expect(solve('wien', { T: -10 }, 'lmax').ok).toBe(false); });
  it('non-integer quantum number warning', () => {
    const r = solve('hydrogen', { lambda: 500e-9, nf: 2 }, 'ni');
    expect(r.warnings.join()).toMatch(/whole number/);
  });
  it('decay: remaining more than initial', () => { const r = solve('decay', { N0: 10, Nt: 20, thalf: 5 }, 't'); expect(r.ok).toBe(false); });
  it('photon energy below work function', () => { const r = solve('photoelectric', { f: 3e14, phi: 2 * 1.602e-19 }, 'K'); expect(r.ok).toBe(false); });
  it('neutral input for charge magnitude must be positive', () => { expect(solve('magnetic_particle', { q: -1.6e-19, v: 1, B: 1, theta: 1 }, 'F').ok).toBe(false); });
  it('over-specified inconsistent data produces a warning', () => {
    const r = solve('circular', { m: 2, v: 3, r: 1, Fc: 50 }, 'ac');
    expect(r.warnings.join()).toMatch(/over-specified/);
  });
});

describe('significant figures', () => {
  const scn = getScenario('circular');
  const r = solve('circular', { m: 1200, v: 20, r: 50 }, 'Fc', 2);
  it('auto uses least precise data (2 s.f.)', () => { expect(formatAnswer(scn, 'Fc', r, 'auto').main.text).toBe('9.6 × 10³ N'); });
  it('2/3/4 s.f. and full precision', () => {
    expect(formatAnswer(scn, 'Fc', r, 2).main.text).toBe('9.6 × 10³ N');
    expect(formatAnswer(scn, 'Fc', r, 3).main.text).toBe('9.60 × 10³ N');
    expect(formatAnswer(scn, 'Fc', r, 4).main.text).toBe('9600 N');
    expect(formatAnswer(scn, 'Fc', r, 'full').main.text).toBe('9600 N');
  });
  it('intermediate values are not rounded', () => {
    const r2 = solve('magnetic_particle', { q: 1.602e-19, m: 1.673e-27, v: 1234.567, B: 0.123456, theta: 90 * D }, 'a', 7);
    expect(r2.values.a).toBe((1.602e-19 * 1234.567 * 0.123456 * Math.sin(90 * D)) / 1.673e-27);
  });
});
