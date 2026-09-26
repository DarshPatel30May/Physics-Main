import { compile, evaluate, freeVars, toLatex, dimOf, Node } from './expr';
import { QUANTITIES } from './quantities';
import { dimEq, dimToUnitLatex, Dim, DIMLESS } from './dimensions';
import { normSolution, Solution } from './types';
import type { ResolvedScenario, ResolvedRelation, ResolvedVar } from './scenario';
import { CONST } from '../data/constants';
import { formatSig, formatTrim } from './numbers';
import { unitLatex } from './units';

export type Origin = 'given' | 'constant' | 'assumed' | 'derived';

export interface KnownInput {
  value: number; // SI
  sigFigs?: number;
  unit?: string; // unit the student used
  raw?: string; // original text
  origin?: Origin;
  note?: string;
}

export interface UnitCheck {
  latex: string; // units substituted
  resultLatex: string;
  expectedLatex: string;
  ok: boolean;
  issues: string[];
}

export interface Step {
  relation: ResolvedRelation;
  unknown: string;
  inputs: string[];
  /** Formula as printed (formula-local symbols). */
  equationLatex: string;
  /** Rearranged in scenario symbols: "a = \frac{F}{m}" */
  rearrangedLatex: string;
  /** Substituted numbers: "= \frac{(5.77\times10^{-16})}{(1.673\times10^{-27})}" */
  substitutionLatex: string;
  value: number;
  roots?: number[];
  notes: string[];
  isRearranged: boolean;
  unitCheck: UnitCheck;
  ambiguousSign: boolean;
  mapNote?: string;
}

export interface SolveResult {
  ok: boolean;
  target: string | null;
  values: Record<string, number>;
  origins: Record<string, Origin>;
  inputs: Record<string, KnownInput>;
  steps: Step[]; // pruned, in dependency order
  allSteps: Step[];
  errors: string[];
  warnings: string[];
  /** Alternative sets of extra variables that would make the target solvable. */
  missing: string[][];
  constantsUsed: string[];
  /** Sig figs of given data feeding the answer. */
  dataSigFigs: number[];
}

const VAL_EPS = 1e-12;

function dimOfVar(v: ResolvedVar): Dim {
  return QUANTITIES[v.q]?.dim ?? DIMLESS;
}

export function siUnitLatex(v: ResolvedVar): string {
  const q = QUANTITIES[v.q];
  if (v.q === 'amount') return '\\text{(same unit as } N_0\\text{)}';
  if (v.q === 'angle') return '^{\\circ}';
  if (!q || q.si === '1' || q.si === '') return '';
  return unitLatex(q.si);
}

/** Format a value for substitution into working (SI, sensible precision). */
export function valueLatex(v: ResolvedVar, value: number, sig = 4): string {
  if (v.q === 'angle') {
    const deg = (value * 180) / Math.PI;
    return `${formatTrim(deg, Math.max(3, sig)).latex}^{\\circ}`;
  }
  if ((v.q === 'count' || v.integer) && Math.abs(value - Math.round(value)) < 1e-9) return String(Math.round(value));
  return formatSig(value, sig).latex;
}

function chooseRoots(sol: Solution, roots: number[], v: ResolvedVar): { value: number | null; others: number[]; note?: string } {
  const finite = roots.filter((r) => Number.isFinite(r));
  if (finite.length === 0) return { value: null, others: [] };
  const valid = finite.filter((r) => v.signed || r >= -VAL_EPS * Math.max(1, Math.abs(r)));
  const policy = sol.root ?? (sol.exprs.length > 1 ? 'first' : 'first');
  const pos = finite.filter((r) => r > 1e-12);
  switch (policy) {
    case 'largestPositive': {
      if (pos.length === 0) return { value: null, others: [] };
      const val = Math.max(...pos);
      return { value: val, others: finite.filter((r) => r !== val) };
    }
    case 'smallestPositive': {
      if (pos.length === 0) return { value: null, others: [] };
      const val = Math.min(...pos);
      return { value: val, others: finite.filter((r) => r !== val) };
    }
    case 'positive': {
      if (pos.length === 0) return { value: null, others: [] };
      return { value: pos[0], others: finite.filter((r) => r !== pos[0]) };
    }
    case 'all': {
      const uniq = valid.filter((r, i) => valid.findIndex((x) => Math.abs(x - r) <= 1e-9 * Math.max(1, Math.abs(r))) === i);
      if (uniq.length === 0) return { value: null, others: [] };
      return { value: uniq[0], others: uniq.slice(1) };
    }
    default: {
      if (valid.length === 0) return { value: finite[0], others: [] };
      return { value: valid[0], others: valid.slice(1) };
    }
  }
}

interface Candidate {
  rel: ResolvedRelation;
  fk: string; // formula var solved for
  sk: string; // scenario var
  sol: Solution;
  exprs: string[];
  caseNote?: string;
  inputs: string[]; // scenario keys
}

function activeExprs(sol: Solution, scope: Record<string, number> | null): { exprs: string[]; note?: string } {
  if (sol.cases && scope) {
    for (const c of sol.cases) {
      try { if (c.when(scope)) return { exprs: c.exprs, note: c.note }; } catch { /* ignore */ }
    }
  }
  return { exprs: sol.exprs };
}

function candidateInputs(rel: ResolvedRelation, exprs: string[]): string[] {
  const s = new Set<string>();
  for (const e of exprs) for (const fv of freeVars(compile(e))) s.add(rel.map[fv] ?? fv);
  return [...s];
}

/** Fallback candidates are only used when nothing better can make progress. */
function isDeferred(c: Candidate): boolean {
  return !!c.sol.ambiguousSign || c.rel.priority < 0;
}

/** Enumerate candidate (relation, unknown) pairs whose inputs are all known. */
function candidates(scn: ResolvedScenario, known: Set<string>): Candidate[] {
  const out: Candidate[] = [];
  for (const rel of scn.relations) {
    for (const [fk, raw] of Object.entries(rel.formula.solve)) {
      const sk = rel.map[fk];
      if (known.has(sk)) continue;
      const sol = normSolution(raw);
      const allExprs = [...sol.exprs, ...(sol.cases?.flatMap((c) => c.exprs) ?? [])];
      const inputs = candidateInputs(rel, sol.exprs);
      const caseInputs = candidateInputs(rel, allExprs);
      if (inputs.every((k) => known.has(k))) out.push({ rel, fk, sk, sol, exprs: sol.exprs, inputs });
      else if (caseInputs.every((k) => known.has(k))) out.push({ rel, fk, sk, sol, exprs: sol.exprs, inputs: caseInputs });
    }
  }
  out.sort((a, b) => {
    const amb = Number(isDeferred(a)) - Number(isDeferred(b));
    if (amb) return amb;
    const multi = Number(a.sol.root === 'all') - Number(b.sol.root === 'all');
    if (multi) return multi;
    if (b.rel.priority !== a.rel.priority) return b.rel.priority - a.rel.priority;
    return a.rel.index - b.rel.index;
  });
  return out;
}

/** Structural closure (ignores numeric domain problems) — used for missing-information analysis. */
export function structuralClosure(scn: ResolvedScenario, knownKeys: Iterable<string>): Set<string> {
  const known = new Set(knownKeys);
  let progress = true;
  while (progress) {
    progress = false;
    for (const c of candidates(scn, known)) {
      if (!known.has(c.sk)) { known.add(c.sk); progress = true; }
    }
  }
  return known;
}

function buildStep(scn: ResolvedScenario, c: Candidate, exprUsed: string, values: Record<string, number>, value: number, roots: number[], notes: string[], sigShown: Record<string, number>): Step {
  const f = c.rel.formula;
  const node: Node = compile(exprUsed);
  const symbols: Record<string, string> = {};
  const subs: Record<string, string> = {};
  const unitSubs: Record<string, string> = {};
  const dims: Record<string, Dim> = {};
  for (const [fk, sk] of Object.entries(c.rel.map)) {
    const sv = scn.vars[sk];
    symbols[fk] = sv.symbol;
    if (values[sk] !== undefined) subs[fk] = valueLatex(sv, values[sk], sigShown[sk] ?? 4);
    dims[fk] = dimOfVar(sv);
    const ul = siUnitLatex(sv);
    unitSubs[fk] = sv.q === 'angle' || sv.q === 'count' || sv.q === 'dimensionless' || sv.q === 'percent' || sv.q === 'amount' || !ul ? sv.symbol : `[${ul}]`;
  }
  const target = scn.vars[c.sk];
  const rhs = toLatex(node, { symbols });
  const rearrangedLatex = `${target.symbol} = ${rhs}`;
  const substitutionLatex = toLatex(node, { symbols, values: subs });
  const dr = dimOf(node, dims);
  const expected = dimOfVar(target);
  const unitCheck: UnitCheck = {
    latex: toLatex(node, { symbols, values: unitSubs }),
    resultLatex: dimToUnitLatex(dr.dim),
    expectedLatex: siUnitLatex(target) || '\\text{(no unit)}',
    ok: dimEq(dr.dim, expected) && dr.issues.length === 0,
    issues: dr.issues,
  };
  const subject = Object.keys(f.solve)[0];
  const isRearranged = c.fk !== subject || f.solve[subject] === undefined;
  // mapping note when formula symbol differs from scenario symbol
  const diffs: string[] = [];
  for (const [fk, sk] of Object.entries(c.rel.map)) {
    const fsym = f.vars[fk].symbol;
    const ssym = scn.vars[sk].symbol;
    if (fsym !== ssym) diffs.push(`${fsym} \\to ${ssym}`);
  }
  return {
    relation: c.rel,
    unknown: c.sk,
    inputs: [...freeVars(node)].map((fv) => c.rel.map[fv] ?? fv),
    equationLatex: f.equation,
    rearrangedLatex,
    substitutionLatex,
    value,
    roots: roots.length > 1 ? roots : undefined,
    notes,
    isRearranged,
    unitCheck,
    ambiguousSign: !!c.sol.ambiguousSign,
    mapNote: diffs.length ? diffs.join(',\\; ') : undefined,
  };
}

export interface SolveOptions {
  target?: string | null;
  mode?: 'target' | 'all';
  /** Constant ids the question overrides are handled by passing the var as a known. */
  maxRounds?: number;
}

export function solveScenario(scn: ResolvedScenario, knownsIn: Record<string, KnownInput>, opts: SolveOptions = {}): SolveResult {
  const target = opts.target ?? null;
  const mode = opts.mode ?? (target ? 'target' : 'all');
  const values: Record<string, number> = {};
  const origins: Record<string, Origin> = {};
  const inputs: Record<string, KnownInput> = {};
  const errors: string[] = [];
  const warnings: string[] = [];
  const sigShown: Record<string, number> = {};
  const constantsUsed: string[] = [];

  for (const [k, kin] of Object.entries(knownsIn)) {
    if (!scn.vars[k]) continue;
    if (!Number.isFinite(kin.value)) { errors.push(`The value supplied for ${scn.vars[k].name} is not a valid number.`); continue; }
    values[k] = kin.value;
    origins[k] = kin.origin ?? 'given';
    inputs[k] = kin;
    sigShown[k] = Math.max(kin.sigFigs ?? 3, 2);
  }
  // Physical validation of inputs
  for (const [k, v] of Object.entries(values)) {
    const sv = scn.vars[k];
    if (!sv.signed && v < 0 && sv.q !== 'angle') errors.push(`${sv.name} ($${sv.symbol}$) cannot be negative for this calculation — enter its magnitude${sv.q === 'charge' ? ' (the sign of a charge only affects direction)' : ''}.`);
    if ((sv.q === 'mass' || sv.q === 'temperature' || sv.q === 'frequency' || sv.q === 'length' || sv.q === 'time') && !sv.signed && !sv.nonNegative && v === 0) {
      errors.push(`${sv.name} must be greater than zero.`);
    }
    if (sv.q === 'temperature' && v < 0) errors.push('Absolute temperature cannot be negative (T in kelvin must be > 0).');
    if (sv.q === 'speed' && !sv.signed && k !== 'c' && v >= CONST.c.value && scn.vars.c) errors.push(`A massive object cannot travel at or faster than c (v = ${formatSig(v / CONST.c.value, 3).text}c).`);
    if (sv.integer && Math.abs(v - Math.round(v)) > 1e-6 && (sv.q === 'count')) warnings.push(`${sv.name} should be a whole number (got ${v}).`);
  }
  // constants
  for (const sv of Object.values(scn.vars)) {
    if (sv.constant && values[sv.key] === undefined) {
      const c = CONST[sv.constant];
      if (c) {
        values[sv.key] = c.value;
        origins[sv.key] = 'constant';
        sigShown[sv.key] = Math.min(Math.max(c.sigFigs, 3), 4);
      }
    }
  }
  if (errors.length) {
    return { ok: false, target, values, origins, inputs, steps: [], allSteps: [], errors, warnings, missing: [], constantsUsed, dataSigFigs: [] };
  }

  const known = new Set(Object.keys(values));
  const allSteps: Step[] = [];
  const producedBy: Record<string, number> = {};
  const failures: string[] = [];
  const maxRounds = opts.maxRounds ?? 40;
  let rounds = 0;
  const tried = new Set<string>();

  while (rounds++ < maxRounds) {
    if (mode === 'target' && target && known.has(target)) break;
    const cands = candidates(scn, known).filter((c) => !tried.has(`${c.rel.index}:${c.fk}`));
    if (cands.length === 0) break;
    const firm = cands.filter((c) => !isDeferred(c));
    const batch = firm.length ? firm : [cands[0]];
    let progressed = false;
    const doneThisRound = new Set<string>();
    for (const c of batch) {
      if (known.has(c.sk) || doneThisRound.has(c.sk)) continue;
      tried.add(`${c.rel.index}:${c.fk}`);
      const scope: Record<string, number> = {};
      for (const [fk, sk] of Object.entries(c.rel.map)) if (values[sk] !== undefined) scope[fk] = values[sk];
      const { exprs, note: caseNote } = activeExprs(c.sol, scope);
      let roots: number[] = [];
      try {
        roots = exprs.map((e) => evaluate(compile(e), scope));
      } catch {
        continue;
      }
      const sv = scn.vars[c.sk];
      const chosen = chooseRoots(c.sol, roots, sv);
      if (chosen.value === null || !Number.isFinite(chosen.value)) {
        failures.push(describeFailure(scn, c, roots));
        continue;
      }
      let value = chosen.value;
      if (Math.abs(value) < 1e-300) value = 0;
      if (!sv.signed && value < -1e-12 * Math.max(1, Math.abs(value)) && sv.q !== 'angle') {
        failures.push(`Using ${c.rel.formula.name} gives a negative ${sv.name} (${formatSig(value, 3).text}), which is not physical — check the data and signs.`);
        continue;
      }
      const notes: string[] = [];
      if (caseNote) notes.push(caseNote);
      if (c.sol.note) notes.push(c.sol.note);
      if (c.sol.condition) notes.push(`Condition: ${c.sol.condition}`);
      if (chosen.others.length) {
        const shown = chosen.others.filter((r) => Number.isFinite(r)).map((r) => valueLatex(sv, r, 4));
        if (shown.length) notes.push(`Other root(s) of the equation: ${shown.map((s) => `$${s}$`).join(', ')}${c.sol.root === 'all' ? ' — also a valid solution.' : ' — rejected (not physically meaningful here).'}`);
      }
      if (c.sol.ambiguousSign) notes.push('Square root gives the magnitude; direction/sign is taken from the physical situation.');
      const exprUsed = exprs[roots.indexOf(chosen.value)] ?? exprs[0];
      values[c.sk] = value;
      origins[c.sk] = 'derived';
      known.add(c.sk);
      doneThisRound.add(c.sk);
      const step = buildStep(scn, c, exprUsed, values, value, roots.filter((r) => Number.isFinite(r)), notes, sigShown);
      producedBy[c.sk] = allSteps.length;
      allSteps.push(step);
      sigShown[c.sk] = 4;
      progressed = true;
      if (sv.integer && sv.q === 'count' && Math.abs(value - Math.round(value)) > 0.02) {
        warnings.push(`${sv.name} came out as ${formatSig(value, 4).text}, which is not a whole number — check the data (for quantum numbers this means no such transition exists).`);
      }
    }
    if (!progressed && firm.length === 0) break;
  }

  const ok = target ? known.has(target) : allSteps.length > 0;
  // prune
  const needed: number[] = [];
  const visit = (k: string, seen = new Set<string>()) => {
    if (seen.has(k)) return;
    seen.add(k);
    const idx = producedBy[k];
    if (idx === undefined) return;
    for (const inp of allSteps[idx].inputs) visit(inp, seen);
    if (!needed.includes(idx)) needed.push(idx);
  };
  if (target && ok) visit(target);
  const steps = target && ok ? needed.map((i) => allSteps[i]) : allSteps;

  // constants used & data sig figs
  const ancestors = new Set<string>();
  const collect = (k: string) => {
    if (ancestors.has(k)) return;
    ancestors.add(k);
    const idx = producedBy[k];
    if (idx !== undefined) allSteps[idx].inputs.forEach(collect);
  };
  if (target && ok) collect(target);
  else Object.keys(producedBy).forEach(collect);
  for (const k of ancestors) if (origins[k] === 'constant') constantsUsed.push(k);
  const dataSigFigs: number[] = [];
  for (const k of ancestors) {
    if (origins[k] === 'given' && inputs[k]?.sigFigs && scn.vars[k].q !== 'count' && scn.vars[k].q !== 'angle') dataSigFigs.push(inputs[k].sigFigs!);
    if (origins[k] === 'given' && scn.vars[k].q === 'angle' && inputs[k]?.sigFigs && inputs[k].sigFigs! >= 2) dataSigFigs.push(inputs[k].sigFigs!);
  }

  // consistency check on over-specified relations
  if (ok) {
    for (const rel of scn.relations) {
      const keys = Object.values(rel.map);
      if (!keys.every((k) => values[k] !== undefined)) continue;
      if (!keys.some((k) => origins[k] === 'given')) continue;
      const subjFk = Object.keys(rel.formula.solve)[0];
      const sk = rel.map[subjFk];
      const usedHere = allSteps.some((s) => s.relation.index === rel.index);
      if (usedHere && origins[sk] === 'derived' && allSteps[producedBy[sk]]?.relation.index === rel.index) continue;
      const sol = normSolution(rel.formula.solve[subjFk]);
      const scope: Record<string, number> = {};
      for (const [fk, k] of Object.entries(rel.map)) scope[fk] = values[k];
      const { exprs } = activeExprs(sol, scope);
      let rs: number[] = [];
      try { rs = exprs.map((e) => evaluate(compile(e), scope)).filter(Number.isFinite); } catch { continue; }
      if (!rs.length) continue;
      const actual = values[sk];
      const tolSf = Math.min(...keys.map((k) => (origins[k] === 'given' ? inputs[k]?.sigFigs ?? 3 : 4)));
      const tol = tolSf <= 2 ? 0.08 : tolSf === 3 ? 0.025 : 0.01;
      const match = rs.some((r) => {
        const a = sol.ambiguousSign ? Math.abs(actual) : actual;
        const denom = Math.max(Math.abs(a), Math.abs(r), 1e-300);
        return Math.abs(a - r) / denom <= tol || (Math.abs(a) < 1e-12 && Math.abs(r) < 1e-12);
      });
      if (!match) {
        warnings.push(`The data are over-specified and not fully consistent with ${rel.formula.name} ($${scn.vars[sk].symbol}$ from this relation would be ${formatSig(rs[0], 3).text} rather than ${formatSig(actual, 3).text}). Check the question values.`);
      }
    }
  }

  // missing information
  let missing: string[][] = [];
  if (target && !ok) {
    if (failures.length) errors.push(...dedupe(failures));
    const base = new Set(Object.keys(values));
    const reach = structuralClosure(scn, base);
    if (!reach.has(target)) {
      const pool = scn.varOrder.filter((k) => !base.has(k) && k !== target && !scn.vars[k].constant && !scn.vars[k].intermediate);
      const singles = pool.filter((k) => structuralClosure(scn, [...base, k]).has(target));
      if (singles.length) missing = singles.map((k) => [k]);
      else {
        const pairs: string[][] = [];
        for (let i = 0; i < pool.length && pairs.length < 8; i++) {
          for (let j = i + 1; j < pool.length && pairs.length < 8; j++) {
            if (structuralClosure(scn, [...base, pool[i], pool[j]]).has(target)) pairs.push([pool[i], pool[j]]);
          }
        }
        missing = pairs;
      }
      if (!failures.length) errors.push(`Not enough information to find ${scn.vars[target].name}.`);
    }
  } else if (failures.length && !ok) {
    errors.push(...dedupe(failures));
  }
  // Scenario-level physical checks
  if (scn.checks && ok) {
    for (const iss of scn.checks(values)) {
      if (iss.level === 'error') errors.push(iss.msg);
      else warnings.push(iss.msg);
    }
  }
  return { ok: ok && !errors.length, target, values, origins, inputs, steps, allSteps, errors, warnings, missing, constantsUsed, dataSigFigs };
}

function dedupe(a: string[]): string[] {
  return [...new Set(a)];
}

function describeFailure(scn: ResolvedScenario, c: Candidate, roots: number[]): string {
  const sv = scn.vars[c.sk];
  const exprs = c.exprs.join(' ');
  if (roots.every((r) => Number.isNaN(r))) {
    if (/asin|acos/.test(exprs)) return `No real angle satisfies ${c.rel.formula.name}: the sine/cosine would have to exceed 1. The data are inconsistent (e.g. order too high, or total internal reflection).`;
    if (/sqrt/.test(exprs)) return `No real solution for ${sv.name} from ${c.rel.formula.name}: the quantity under the square root is negative (e.g. the projectile never reaches that height, or v ≥ c).`;
    if (/ln|log/.test(exprs)) return `Cannot take the logarithm of a non-positive number when finding ${sv.name} — check that the remaining amount is less than the initial amount and both are positive.`;
    return `${c.rel.formula.name} cannot be solved for ${sv.name} with these values (division by zero or undefined result).`;
  }
  if (roots.some((r) => !Number.isFinite(r))) return `Division by zero while finding ${sv.name} from ${c.rel.formula.name}.`;
  return `No physically meaningful (positive) value of ${sv.name} from ${c.rel.formula.name}.`;
}

export interface FullSolveResult extends SolveResult {
  assumptions: Array<{ key: string; note: string }>;
  postNotes: string[];
}

/**
 * Solve, first strictly from the supplied data; if the target is unreachable, retry
 * using the scenario's documented assumptions (e.g. θ = 90° "perpendicular"), and
 * report exactly which assumptions were actually used.
 */
export function solveWithAssumptions(scn: ResolvedScenario, knowns: Record<string, KnownInput>, opts: SolveOptions = {}): FullSolveResult {
  const first = solveScenario(scn, knowns, opts);
  const finish = (r: SolveResult, assumptions: Array<{ key: string; note: string }>): FullSolveResult => ({
    ...r,
    assumptions,
    postNotes: r.ok && scn.postNotes ? scn.postNotes(r.values, r.target) : [],
  });
  const assumable = Object.values(scn.vars).filter((v) => v.assume && knowns[v.key] === undefined && v.key !== opts.target);
  if (first.ok || !assumable.length) return finish(first, []);
  const k2: Record<string, KnownInput> = { ...knowns };
  for (const v of assumable) k2[v.key] = { value: v.assume!.value, origin: 'assumed', note: v.assume!.note, sigFigs: 0 };
  const second = solveScenario(scn, k2, opts);
  if (!second.ok) return finish(first, []);
  // Which assumptions were used (ancestors of target / used by steps)?
  const used = new Set<string>();
  for (const s of second.steps) for (const i of s.inputs) if (second.origins[i] === 'assumed') used.add(i);
  if (opts.target && second.origins[opts.target] === 'assumed') used.add(opts.target);
  // Remove unused assumed values from the result
  for (const v of assumable) {
    if (!used.has(v.key)) {
      delete second.values[v.key];
      delete second.origins[v.key];
      delete second.inputs[v.key];
    }
  }
  return finish(second, [...used].map((k) => ({ key: k, note: scn.vars[k].assume!.note })));
}
