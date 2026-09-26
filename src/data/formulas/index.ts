import type { Formula } from '../../engine/types';
import { M5_FORMULAS } from './m5';
import { M6_FORMULAS } from './m6';
import { M7_FORMULAS } from './m7';
import { M8_FORMULAS } from './m8';

export const FORMULAS: Formula[] = [...M5_FORMULAS, ...M6_FORMULAS, ...M7_FORMULAS, ...M8_FORMULAS];

export const FORMULA_BY_ID: Record<string, Formula> = {};
for (const f of FORMULAS) {
  if (FORMULA_BY_ID[f.id]) throw new Error(`Duplicate formula id ${f.id}`);
  FORMULA_BY_ID[f.id] = f;
}

export function getFormula(id: string): Formula {
  const f = FORMULA_BY_ID[id];
  if (!f) throw new Error(`Unknown formula ${id}`);
  return f;
}
