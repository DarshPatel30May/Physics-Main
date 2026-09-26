import type { QuantityKind } from './quantities';
import type { ModuleId, TopicId, Formula } from './types';
import { getFormula } from '../data/formulas/index';

export interface ScenarioVarSpec {
  key: string;
  symbol?: string;
  name?: string;
  q?: QuantityKind;
  constant?: string;
  /** Phrases that identify this variable in a worded question (lower case). */
  cues?: string[];
  defaultUnit?: string;
  signed?: boolean;
  nonNegative?: boolean;
  integer?: boolean;
  /** Show in the "more inputs" section of the calculator. */
  advanced?: boolean;
  /** The final answer is reported as a magnitude with a direction note. */
  magnitude?: boolean;
  hint?: string;
  /** Excluded from missing-information suggestions (e.g. purely intermediate). */
  intermediate?: boolean;
  /** Value assumed (and clearly reported) only if the problem cannot be solved without it. SI units. */
  assume?: { value: number; note: string };
}

export interface RelationSpec {
  f: string;
  /** formula-variable → scenario-variable (identity when omitted). */
  map?: Record<string, string>;
  /** Physics justification shown in the working, e.g. "The magnetic force provides the centripetal force". */
  why?: string;
  /** Higher = preferred when several relations can produce the same unknown. */
  priority?: number;
}

export type DirectionKind = 'magneticCharge' | 'motor' | 'electricCharge' | 'lenz' | 'projectile' | 'gravity' | 'wires' | 'none';

export interface ScenarioIssue {
  level: 'error' | 'warning' | 'info';
  msg: string;
}

export interface Scenario {
  id: string;
  topic: TopicId;
  module: ModuleId;
  title: string;
  blurb: string;
  vars: ScenarioVarSpec[];
  relations: RelationSpec[];
  /** Keyword weights for the free-text classifier. */
  keywords: Array<[string, number]>;
  /** Unknowns offered in the calculator dropdown (defaults to all non-constant vars). */
  targets?: string[];
  defaultTarget?: string;
  direction?: DirectionKind;
  checks?: (v: Record<string, number>) => ScenarioIssue[];
  assumptions?: string[];
  /** Sign convention statement shown in working. */
  convention?: string;
  /** Extra explanatory notes computed from the final values (e.g. alternative method). */
  postNotes?: (v: Record<string, number>, target: string | null) => string[];
}

export interface ResolvedVar {
  key: string;
  symbol: string;
  name: string;
  q: QuantityKind;
  constant?: string;
  cues: string[];
  defaultUnit?: string;
  signed: boolean;
  nonNegative: boolean;
  integer: boolean;
  advanced: boolean;
  magnitude: boolean;
  hint?: string;
  intermediate: boolean;
  assume?: { value: number; note: string };
}

export interface ResolvedRelation {
  formula: Formula;
  map: Record<string, string>; // formula var → scenario var
  why?: string;
  priority: number;
  index: number;
}

export interface ResolvedScenario extends Omit<Scenario, 'vars' | 'relations'> {
  vars: Record<string, ResolvedVar>;
  varOrder: string[];
  relations: ResolvedRelation[];
}

const resolvedCache = new Map<string, ResolvedScenario>();

export function resolveScenario(s: Scenario): ResolvedScenario {
  const hit = resolvedCache.get(s.id);
  if (hit) return hit;
  const vars: Record<string, ResolvedVar> = {};
  const order: string[] = [];
  const specs = new Map(s.vars.map((v) => [v.key, v]));
  const ensure = (key: string, fv?: Formula['vars'][string]) => {
    const spec = specs.get(key);
    const existing = vars[key];
    if (existing) {
      return;
    }
    if (!spec && !fv) throw new Error(`Scenario ${s.id}: variable ${key} has no definition`);
    vars[key] = {
      key,
      symbol: spec?.symbol ?? fv!.symbol,
      name: spec?.name ?? fv!.name,
      q: spec?.q ?? fv!.q,
      constant: spec?.constant ?? fv?.constant,
      cues: spec?.cues ?? [],
      defaultUnit: spec?.defaultUnit,
      signed: spec?.signed ?? fv?.signed ?? false,
      nonNegative: spec?.nonNegative ?? fv?.nonNegative ?? false,
      integer: spec?.integer ?? fv?.integer ?? false,
      advanced: spec?.advanced ?? false,
      magnitude: spec?.magnitude ?? false,
      hint: spec?.hint,
      intermediate: spec?.intermediate ?? false,
      assume: spec?.assume,
    };
    order.push(key);
  };
  // declared vars first, in declared order (for form layout)
  const relations: ResolvedRelation[] = s.relations.map((r, index) => {
    const formula = getFormula(r.f);
    const map: Record<string, string> = {};
    for (const fk of Object.keys(formula.vars)) map[fk] = r.map?.[fk] ?? fk;
    return { formula, map, why: r.why, priority: r.priority ?? 0, index };
  });
  for (const spec of s.vars) {
    // find a formula var to fill gaps
    let fv: Formula['vars'][string] | undefined;
    for (const r of relations) {
      const fk = Object.keys(r.map).find((k) => r.map[k] === spec.key);
      if (fk) { fv = r.formula.vars[fk]; break; }
    }
    ensure(spec.key, fv);
  }
  for (const r of relations) {
    for (const [fk, sk] of Object.entries(r.map)) ensure(sk, r.formula.vars[fk]);
  }
  const res: ResolvedScenario = { ...s, vars, varOrder: order, relations };
  resolvedCache.set(s.id, res);
  return res;
}
