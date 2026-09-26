import { describe, it, expect } from 'vitest';
import { FORMULAS } from '../data/formulas/index';
import { compile, evaluate, dimOf, freeVars } from '../engine/expr';
import { QUANTITIES } from '../engine/quantities';
import { dimEq, dimToUnitText } from '../engine/dimensions';
import { normSolution, FVar } from '../engine/types';
import { CONST } from '../data/constants';

// deterministic PRNG
let seed = 12345;
const rand = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

function sampleVar(v: FVar): number {
  if (v.constant) return CONST[v.constant].value;
  let [lo, hi] = v.sample ?? (v.q === 'angle' ? [0.1, 1.4] : v.signed ? [-10, 10] : [0.5, 10]);
  if (v.integer) { lo = Math.ceil(lo); hi = Math.floor(hi); return Math.floor(lo + rand() * (hi - lo + 1)); }
  if (lo > 0 && hi / lo > 100) return Math.exp(Math.log(lo) + rand() * (Math.log(hi) - Math.log(lo)));
  let x = lo + rand() * (hi - lo);
  if (v.signed && Math.abs(x) < 0.05 * Math.max(Math.abs(lo), Math.abs(hi))) x += 0.1 * (hi - lo);
  return x;
}

describe('formula database integrity', () => {
  it('has a healthy number of formulas', () => { expect(FORMULAS.length).toBeGreaterThan(100); });
  for (const f of FORMULAS) {
    it(`${f.id}: metadata`, () => {
      expect(f.name).toBeTruthy();
      expect(f.equation).toBeTruthy();
      expect(f.keywords.length).toBeGreaterThan(0);
      for (const [k, raw] of Object.entries(f.solve)) {
        expect(f.vars[k], `solve key ${k} declared`).toBeDefined();
        const sol = normSolution(raw);
        for (const e of [...sol.exprs, ...(sol.cases?.flatMap((c) => c.exprs) ?? [])]) {
          for (const fv of freeVars(compile(e))) expect(f.vars[fv], `${f.id}.${k}: var ${fv} declared`).toBeDefined();
          expect(freeVars(compile(e)).has(k), `${f.id}.${k} rearrangement must not contain itself`).toBe(false);
        }
      }
    });
    it(`${f.id}: dimensional consistency of every rearrangement`, () => {
      const dims = Object.fromEntries(Object.entries(f.vars).map(([k, v]) => [k, QUANTITIES[v.q].dim]));
      for (const [k, raw] of Object.entries(f.solve)) {
        const sol = normSolution(raw);
        for (const e of sol.exprs) {
          const r = dimOf(compile(e), dims);
          expect(r.issues, `${f.id}.${k}: ${e}`).toEqual([]);
          expect(dimEq(r.dim, dims[k]), `${f.id}.${k} = ${e}: got ${dimToUnitText(r.dim)} expected ${dimToUnitText(dims[k])}`).toBe(true);
        }
      }
    });
    it(`${f.id}: round-trip every rearrangement (10 random cases)`, () => {
      const keys = Object.keys(f.solve);
      const subject = keys[0];
      let tested = 0;
      for (let trial = 0; trial < 200 && tested < 10; trial++) {
        const vals: Record<string, number> = {};
        for (const [k, v] of Object.entries(f.vars)) if (k !== subject) vals[k] = sampleVar(v);
        const sSol = normSolution(f.solve[subject]);
        const subjVals = sSol.exprs.map((e) => evaluate(compile(e), vals)).filter((x) => Number.isFinite(x));
        if (!subjVals.length) continue;
        const sv = f.vars[subject];
        const subjVal = subjVals.find((x) => sv.signed || x > 0);
        if (subjVal === undefined) continue;
        vals[subject] = subjVal;
        tested++;
        for (const k of keys.slice(1)) {
          const sol = normSolution(f.solve[k]);
          if (sol.multiValued) continue;
          const { [k]: orig, ...scope } = vals;
          let exprs = sol.exprs;
          if (sol.cases) for (const c of sol.cases) if (c.when(scope)) { exprs = c.exprs; break; }
          const roots = exprs.map((e) => evaluate(compile(e), scope));
          const ok = roots.some((r) => {
            const a = sol.ambiguousSign ? Math.abs(orig) : orig;
            return Math.abs(r - a) <= 1e-6 * Math.max(Math.abs(a), 1e-300) + 1e-300;
          });
          expect(ok, `${f.id}: solving for ${k} gave ${roots} expected ${orig} (scope ${JSON.stringify(scope)})`).toBe(true);
        }
      }
      expect(tested, `${f.id}: could not generate valid samples`).toBeGreaterThan(0);
    });
  }
});
