/**
 * HSC-style worded questions (written in the style of NESA HSC Physics examination items,
 * covering the calculation types that recur in the 2019–2024 papers). Expected answers are
 * computed independently here with NESA data-sheet constants.
 */
import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';
import { CASES } from './corpus/batch1';


describe('HSC-style worded questions (smart solver)', () => {
  for (const cse of CASES) {
    it(`${cse.q.slice(0, 90)}… → ${cse.target}`, () => {
      const r = smartSolve(cse.q);
      if (cse.scenario) expect(r.scenario?.id).toBe(cse.scenario);
      const part = r.parts.find((p) => p.target === cse.target) ?? r.parts[cse.part ?? 0];
      expect(part, `parts: ${JSON.stringify(r.parts.map((p) => p.target))} scenario ${r.scenario?.id}`).toBeDefined();
      expect(part.target, `scenario ${r.scenario?.id}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}`).toBe(cse.target);
      expect(part.result?.ok, JSON.stringify(part.result?.errors)).toBe(true);
      const got = part.result!.values[cse.target];
      const tol = cse.tol ?? 0.005;
      expect(Math.abs(got - cse.value) / Math.abs(cse.value), `got ${got} expected ${cse.value}`).toBeLessThan(tol);
    });
  }
});

describe('missing or ambiguous information is reported, not invented', () => {
  it('orbit around Mars without its mass', () => {
    const r = smartSolve('A satellite orbits Mars at an altitude of 500 km. Calculate its orbital speed.');
    expect(r.parts[0].result?.ok).toBe(false);
    expect(r.notes.join(' ')).toMatch(/mars/i);
  });
  it('transformer without turns', () => {
    const r = smartSolve('A transformer is connected to a 240 V supply. Calculate the secondary voltage.');
    expect(r.parts[0].result?.ok).toBe(false);
    expect(r.parts[0].result?.missing.length).toBeGreaterThan(0);
  });
  it('below-threshold photoelectric light', () => {
    const r = smartSolve('Light of wavelength 700 nm shines on a metal with a work function of 2.5 eV. Calculate the maximum kinetic energy of the photoelectrons.');
    expect(r.parts[0].result?.ok).toBe(false);
    expect(r.parts[0].result?.errors.join(' ')).toMatch(/work function/i);
  });
  it('faster than light is rejected', () => {
    const r = smartSolve('A spaceship travels at 1.2c. Calculate the Lorentz factor.');
    expect(r.parts[0].result?.ok).toBe(false);
  });
});
