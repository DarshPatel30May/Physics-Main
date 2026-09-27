import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';
import { CASES as C4 } from './corpus/batch4';
import { CASES as C5 } from './corpus/batch5';
const CASES = [...C4, ...C5];

describe('HSC-style questions — batches 4 and 5', () => {
  for (const cse of CASES) {
    it(`${cse.q.slice(0, 90).replace(/\n/g, ' ')}… → ${cse.target}`, () => {
      const r = smartSolve(cse.q);
      const targets = [cse.target, cse.alt].filter(Boolean) as string[];
      const part = r.parts.find((p) => p.target && targets.includes(p.target)) ?? r.parts[0];
      const dbg = `scenario ${r.scenario?.id}; parts ${JSON.stringify(r.parts.map((p) => p.target))}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}; auto ${r.autoFilled.map((a) => a.key).join(',')}; unused ${r.unused.map((x) => x.raw).join(',')}`;
      expect(part?.target, dbg).toBe(cse.target);
      expect(part.result?.ok, `${dbg} ${JSON.stringify(part.result?.errors)} missing ${JSON.stringify(part.result?.missing)}`).toBe(true);
      const got = part.result!.values[cse.target];
      expect(Math.abs(Math.abs(got) - Math.abs(cse.value)) / Math.abs(cse.value), `got ${got} expected ${cse.value}; ${dbg}`).toBeLessThan(cse.tol ?? 0.005);
    });
  }
});
