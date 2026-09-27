/** Third audit batch of HSC-style questions. */
import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';
import { CASES } from './corpus/batch3';


describe('HSC-style questions — batch 3', () => {
  for (const cse of CASES) {
    it(`${cse.q.slice(0, 90)}… → ${cse.target}`, () => {
      const r = smartSolve(cse.q);
      const part = r.parts.find((p) => p.target === cse.target) ?? r.parts[0];
      const dbg = `scenario ${r.scenario?.id}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}; auto ${r.autoFilled.map((a) => a.key).join(',')}; unused ${r.unused.map((x) => x.raw).join(',')}`;
      expect(part?.target, dbg).toBe(cse.target);
      expect(part.result?.ok, `${dbg} ${JSON.stringify(part.result?.errors)} missing ${JSON.stringify(part.result?.missing)}`).toBe(true);
      const got = part.result!.values[cse.target];
      expect(Math.abs(Math.abs(got) - Math.abs(cse.value)) / Math.abs(cse.value), `got ${got} expected ${cse.value}; ${dbg}`).toBeLessThan(cse.tol ?? 0.005);
    });
  }
});
