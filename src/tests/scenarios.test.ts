import { describe, it, expect } from 'vitest';
import { RESOLVED, getScenario } from '../data/scenarios/index';
import { solveWithAssumptions } from '../engine/solver';
import { QUANTITIES } from '../engine/quantities';

describe('scenario integrity', () => {
  for (const s of RESOLVED) {
    it(`${s.id} resolves with valid variables`, () => {
      expect(s.varOrder.length).toBeGreaterThan(1);
      for (const k of s.varOrder) expect(QUANTITIES[s.vars[k].q], `${s.id}.${k} quantity`).toBeDefined();
      for (const t of s.targets ?? []) expect(s.vars[t], `${s.id} target ${t}`).toBeDefined();
    });
  }
});

const e = 1.602e-19;
const D = Math.PI / 180;
const solve = (id: string, knowns: Record<string, number>, target: string) =>
  solveWithAssumptions(getScenario(id), Object.fromEntries(Object.entries(knowns).map(([k, v]) => [k, { value: v, sigFigs: 3 }])), { target });

describe('multi-step chains', () => {
  it('magnetic force on proton then acceleration (a = qvB/m)', () => {
    const r = solve('magnetic_particle', { q: e, m: 1.673e-27, v: 1200, B: 3.0, theta: 90 * D }, 'a');
    expect(r.ok).toBe(true);
    expect(r.values.F).toBeCloseTo(e * 1200 * 3, 25);
    expect(r.values.a).toBeCloseTo((e * 1200 * 3) / 1.673e-27, -5);
    expect(r.steps.map((s) => s.unknown)).toEqual(['F', 'a']);
  });
  it('assumes perpendicular when angle missing and reports it', () => {
    const r = solve('magnetic_particle', { q: e, v: 1200, B: 3.0 }, 'F');
    expect(r.ok).toBe(true);
    expect(r.assumptions.map((a) => a.key)).toEqual(['theta']);
  });
  it('photon energy from 500 nm', () => {
    const r = solve('photon', { lambda: 500e-9 }, 'E');
    expect(r.ok).toBe(true);
    expect(r.values.f).toBeCloseTo(6.0e14, -10);
    expect(r.values.E).toBeCloseTo(6.626e-34 * 6e14, 25);
    expect(r.steps.map((s) => s.unknown)).toEqual(['f', 'E']);
  });
  it('gamma at 0.80c', () => {
    const r = solve('relativity', { v: 0.8 * 3e8 }, 'gamma');
    expect(r.values.gamma).toBeCloseTo(1 / 0.6, 10);
  });
  it('time dilation muon', () => {
    const r = solve('relativity', { v: 0.98 * 3e8, t0: 2.2e-6 }, 't');
    expect(r.values.t).toBeCloseTo(2.2e-6 / Math.sqrt(1 - 0.98 ** 2), 12);
  });
  it('orbital velocity from altitude using NESA Earth data', () => {
    const r = solve('orbit', { M: 6.0e24, R: 6.371e6, h: 4.0e5 }, 'v');
    expect(r.ok).toBe(true);
    expect(r.values.r).toBeCloseTo(6.771e6, 0);
    expect(r.values.v).toBeCloseTo(Math.sqrt((6.67e-11 * 6.0e24) / 6.771e6), 6);
  });
  it('half-life 120 g, 30 y, 90 y → 15 g', () => {
    const r = solveWithAssumptions(getScenario('decay'), { N0: { value: 120, sigFigs: 3, unit: 'g' }, thalf: { value: 30 * 3.15576e7, sigFigs: 2 }, t: { value: 90 * 3.15576e7, sigFigs: 2 } }, { target: 'Nt' });
    expect(r.ok).toBe(true);
    expect(r.values.Nt).toBeCloseTo(15, 10);
    expect(r.values.n).toBeCloseTo(3, 12);
  });
  it('projectile off a cliff', () => {
    const r = solve('projectile', { u: 12, theta: 0, sy: -45 }, 'sx');
    expect(r.ok).toBe(true);
    expect(r.values.t).toBeCloseTo(Math.sqrt(90 / 9.8), 10);
    expect(r.values.sx).toBeCloseTo(12 * Math.sqrt(90 / 9.8), 10);
  });
  it('angled projectile on level ground: range, max height, final velocity', () => {
    const r = solve('projectile', { u: 20, theta: 30 * D, sy: 0 }, 'sx');
    expect(r.values.sx).toBeCloseTo((400 * Math.sin(60 * D)) / 9.8, 8);
    const h = solve('projectile', { u: 20, theta: 30 * D }, 'H');
    expect(h.values.H).toBeCloseTo(100 / (2 * 9.8), 10);
    const v = solve('projectile', { u: 20, theta: 30 * D, sy: 0 }, 'vy');
    expect(v.values.vy).toBeCloseTo(-10, 8);
  });
  it('photoelectric chain to stopping voltage', () => {
    const r = solve('photoelectric', { lambda: 400e-9, phi: 2.3 * e }, 'Vs');
    const K = (6.626e-34 * 3e8) / 400e-9 - 2.3 * e;
    expect(r.values.Vs).toBeCloseTo(K / e, 8);
  });
  it('photoelectric: below threshold gives an error', () => {
    const r = solve('photoelectric', { lambda: 700e-9, phi: 2.3 * e }, 'K');
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/LESS than the work function/);
  });
  it('transformer', () => {
    const r = solve('transformer', { Vp: 240, Np: 1000, Ns: 50 }, 'Vs');
    expect(r.values.Vs).toBeCloseTo(12, 10);
  });
  it('missing information is reported', () => {
    const r = solve('transformer', { Vp: 240 }, 'Vs');
    expect(r.ok).toBe(false);
    expect(r.missing.length).toBeGreaterThan(0);
  });
  it('Faraday emf magnitude', () => {
    const r = solve('faraday', { N: 200, B1: 0.5, B2: 0, A: 0.01, dt: 0.1 }, 'emf');
    expect(r.ok).toBe(true);
    expect(Math.abs(r.values.emf)).toBeCloseTo(200 * 0.005 / 0.1, 10);
  });
  it('Rydberg Balmer H-alpha', () => {
    const r = solve('hydrogen', { ni: 3, nf: 2 }, 'lambda');
    expect(r.values.lambda * 1e9).toBeCloseTo(1e9 / (1.097e7 * (1 / 4 - 1 / 9)), 6);
  });
  it('binding energy of He-4 nucleus', () => {
    const r = solve('binding', { Z: 2, N: 2, mnuc: 4.001506 * 1.661e-27 }, 'EB');
    expect(r.ok).toBe(true);
    const dm = 2 * 1.673e-27 + 2 * 1.675e-27 - 4.001506 * 1.661e-27;
    expect(r.values.EB).toBeCloseTo(dm * 9e16, 20);
  });
  it('velocity > c rejected', () => {
    const r = solve('relativity', { v: 3.1e8 }, 'gamma');
    expect(r.ok).toBe(false);
  });
});
