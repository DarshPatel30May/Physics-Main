import { describe, it, expect } from 'vitest';
import { diagramSentences } from '../nlp/vision';
import { smartSolve } from '../nlp/smart';

describe('AI-read diagram values feed the deterministic solver', () => {
  it('builds sentences from confirmed values and directions', () => {
    const s = diagramSentences([{ label: 'h', value: '45', unit: 'm', meaning: 'height of the cliff', confidence: 'high' }], [{ quantity: 'magnetic field', direction: 'into the page', confidence: 'high' }]);
    expect(s).toBe('From the diagram, the height of the cliff is 45 m. The magnetic field is directed into the page.');
  });
  it('projectile question with the height only in the diagram', () => {
    const text = 'A ball is thrown horizontally at 12 m/s from the top of a cliff. How far from the base of the cliff does the ball land?\n' +
      diagramSentences([{ label: 'h', value: '45', unit: 'm', meaning: 'height of the cliff', confidence: 'high' }], []);
    const r = smartSolve(text);
    expect(r.parts[0].target).toBe('sx');
    expect(r.parts[0].result?.values.sx).toBeCloseTo(12 * Math.sqrt(90 / 9.8), 6);
  });
  it('magnetic force direction from diagram directions', () => {
    const text = 'A proton moving to the right at 2.0 × 10^5 m/s enters a magnetic field of 0.50 T. Calculate the magnitude of the magnetic force on the proton.\n' +
      diagramSentences([], [{ quantity: 'magnetic field', direction: 'into the page', confidence: 'high' }]);
    const r = smartSolve(text);
    expect(r.parts[0].result?.ok).toBe(true);
    const d = r.directions.find((x) => x.result.direction);
    expect(d?.result.direction).toBe('up');
  });
});
