/** Second batch of HSC-style worded questions used for the coverage audit. */
import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';
import { CASES } from './corpus/batch2';


describe('HSC-style questions — batch 2', () => {
  for (const c0 of CASES) {
    it(`${c0.q.slice(0, 90)}… → ${c0.target}`, () => {
      let cse = c0;
      const r = smartSolve(cse.q);
      if (cse.alt && r.parts[0]?.target === cse.alt) cse = { ...cse, target: cse.alt };
      const part = r.parts.find((p) => p.target === cse.target) ?? r.parts[0];
      expect(part?.target, `scenario ${r.scenario?.id}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}; auto ${r.autoFilled.map((a) => a.key).join(',')}; unused ${r.unused.map((x) => x.raw).join(',')}`).toBe(cse.target);
      expect(part.result?.ok, `${r.scenario?.id}: ${JSON.stringify(part.result?.errors)} missing ${JSON.stringify(part.result?.missing)}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}`).toBe(true);
      const got = part.result!.values[cse.target];
      expect(Math.abs(got - cse.value) / Math.abs(cse.value), `got ${got} expected ${cse.value} (scenario ${r.scenario?.id}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')})`).toBeLessThan(cse.tol ?? 0.005);
    });
  }
});
