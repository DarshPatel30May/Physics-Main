import type { QuantityKind } from './quantities';

export type ModuleId = 5 | 6 | 7 | 8;

export type TopicId =
  | 'projectile' | 'circular' | 'gravitation' | 'orbital' | 'forces' | 'torque'
  | 'efields' | 'particles' | 'bfields' | 'motor' | 'induction' | 'transformers'
  | 'waves' | 'interference' | 'emr' | 'quantumlight' | 'photoelectric' | 'relativity'
  | 'stars' | 'atomic' | 'quantum' | 'nuclear' | 'radioactivity' | 'standardmodel';

/**
 * Source classification for every mathematical relationship.
 *  - NESA_FORMULA_SHEET: printed on the official HSC Physics formulae sheet.
 *  - SYLLABUS: named in the Physics Stage 6 Syllabus content but not printed on the sheet.
 *  - DERIVED: obtained by combining sheet/syllabus relationships (students must derive it).
 *  - HSC_EXAM_APPLICATION: a combination repeatedly required in HSC examination questions.
 *  - YEAR11_PREREQUISITE: Year 11 content (on the sheet) that Year 12 questions rely on.
 *  - EXTENSION: useful but NOT required HSC content; always labelled as such.
 */
export type FormulaSource =
  | 'NESA_FORMULA_SHEET'
  | 'SYLLABUS'
  | 'DERIVED'
  | 'HSC_EXAM_APPLICATION'
  | 'YEAR11_PREREQUISITE'
  | 'EXTENSION';

export const SOURCE_LABELS: Record<FormulaSource, string> = {
  NESA_FORMULA_SHEET: 'NESA formulae sheet',
  SYLLABUS: 'Physics Stage 6 Syllabus',
  DERIVED: 'Derived from syllabus relationships',
  HSC_EXAM_APPLICATION: 'Required in HSC exam applications',
  YEAR11_PREREQUISITE: 'Year 11 prerequisite (formulae sheet)',
  EXTENSION: 'Extension — not required HSC content',
};

export interface FVar {
  symbol: string; // LaTeX
  name: string;
  q: QuantityKind;
  /** Default binding to a constant id from the constants database. */
  constant?: string;
  /** Sample range (SI) for automated round-trip testing. */
  sample?: [number, number];
  /** May be negative (signed component, energy, emf …). Default: must be > 0 unless nonNegative. */
  signed?: boolean;
  nonNegative?: boolean;
  integer?: boolean;
}

export interface SolveCase {
  when: (v: Record<string, number>) => boolean;
  exprs: string[];
  note?: string;
}

export type RootPolicy = 'first' | 'largestPositive' | 'smallestPositive' | 'positive' | 'all' | 'nonNegativeLargest';

export interface Solution {
  /** One or more candidate expressions (e.g. ± roots of a quadratic). */
  exprs: string[];
  root?: RootPolicy;
  cases?: SolveCase[];
  note?: string;
  /** Sign/direction cannot be recovered from this rearrangement (e.g. v from v²). */
  ambiguousSign?: boolean;
  /** Only valid under a stated condition (displayed in working). */
  condition?: string;
  /** Skip this rearrangement in automatic round-trip tests (e.g. angle with 2 solutions). */
  multiValued?: boolean;
}

export interface Formula {
  id: string;
  name: string;
  module: ModuleId;
  topic: TopicId;
  /** Syllabus inquiry question / content reference. */
  syllabus: string;
  /** Display equation (LaTeX). */
  equation: string;
  vars: Record<string, FVar>;
  /** Rearrangement for each solvable variable. The first key is the "subject" of the formula. */
  solve: Record<string, Solution | string>;
  source: FormulaSource;
  onSheet: boolean;
  assumptions?: string[];
  restrictions?: string[];
  whenToUse?: string;
  whenNotToUse?: string;
  related?: string[];
  keywords: string[];
  example?: { q: string; a: string };
  /** LaTeX lines describing how a derived formula is obtained. */
  derivation?: string[];
  /** Explanation of sign / direction conventions. */
  signNote?: string;
}

export function normSolution(s: Solution | string): Solution {
  return typeof s === 'string' ? { exprs: [s] } : s;
}
