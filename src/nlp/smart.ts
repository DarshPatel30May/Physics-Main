import { normaliseQuestion, extractQuantities, Extracted } from './extract';
import { RESOLVED } from '../data/scenarios/index';
import type { ResolvedScenario, ResolvedVar } from '../engine/scenario';
import { solveWithAssumptions, FullSolveResult, KnownInput } from '../engine/solver';
import { QUANTITIES, QuantityKind } from '../engine/quantities';
import { toSI, parseUnit } from '../engine/units';
import { dimEq, isDimless } from '../engine/dimensions';
import { CONST } from '../data/constants';
import { findNuclides } from '../data/elements';
import { parseDirWord, magneticForceOnCharge, motorForce, electricForce, lenz, wiresForce, DirectionResult, DirWord } from '../engine/direction';

export interface Assignment {
  q: Extracted;
  key: string;
  score: number;
  reason: string;
}

export interface AutoFill {
  key: string;
  value: number; // SI
  note: string;
  origin: 'given' | 'constant' | 'assumed';
  sigFigs?: number;
}

export interface SmartPart {
  phrase: string;
  target: string | null;
  unitHint?: string;
  result: FullSolveResult | null;
  claimed?: { value: number; unit: string } | null;
}

export interface Particle {
  name: string;
  massId: string;
  chargeMultiple: number; // in units of e (signed)
}

export interface SmartResult {
  input: string;
  normalized: string;
  quantities: Extracted[];
  scenario: ResolvedScenario | null;
  ranking: Array<{ id: string; title: string; score: number; solved: boolean }>;
  assignments: Assignment[];
  autoFilled: AutoFill[];
  unused: Extracted[];
  parts: SmartPart[];
  particle: Particle | null;
  directions: Array<{ title: string; result: DirectionResult }>;
  notes: string[];
  knowns: Record<string, KnownInput>;
}

/* ------------------------------------------------------------------ */

const PARTICLES: Array<{ re: RegExp; p: Particle }> = [
  { re: /\balpha[\s-]?particles?\b|\bhelium nucle(us|i)\b|\bα[\s-]?particle/i, p: { name: 'alpha particle', massId: 'mAlpha', chargeMultiple: 2 } },
  { re: /\bpositrons?\b/i, p: { name: 'positron', massId: 'me', chargeMultiple: 1 } },
  { re: /\bprotons?\b|\bhydrogen (ion|nucleus)\b/i, p: { name: 'proton', massId: 'mp', chargeMultiple: 1 } },
  { re: /\belectrons?\b|\bbeta[\s-]?(minus )?particles?\b|\bcathode rays?\b/i, p: { name: 'electron', massId: 'me', chargeMultiple: -1 } },
  { re: /\bneutrons?\b/i, p: { name: 'neutron', massId: 'mn', chargeMultiple: 0 } },
];

export function detectParticle(text: string): Particle | null {
  // earliest-mentioned particle wins
  let best: { idx: number; p: Particle } | null = null;
  for (const { re, p } of PARTICLES) {
    const m = re.exec(text);
    if (m && (!best || m.index < best.idx)) best = { idx: m.index, p };
  }
  return best?.p ?? null;
}

const GREEK: Record<string, string> = {
  '\\lambda': 'λ', '\\theta': 'θ', '\\phi': 'φ', '\\Phi': 'Φ', '\\varepsilon': 'ε', '\\epsilon': 'ε', '\\gamma': 'γ', '\\tau': 'τ',
  '\\omega': 'ω', '\\mu': 'μ', '\\Delta': 'Δ', '\\alpha': 'α', '\\sigma': 'σ', '\\rho': 'ρ', '\\eta': 'η',
};

export function plainSymbol(latex: string): string {
  let s = latex;
  for (const [k, v] of Object.entries(GREEK)) s = s.split(k).join(v);
  s = s.replace(/\\text\{([^}]*)\}/g, '$1').replace(/\\(max|min)/g, '$1').replace(/[{}_\\\s]/g, '');
  return s;
}

const SYMBOL_ALIASES: Record<string, string[]> = {
  lambda: ['λ', 'lambda', 'wavelength'], theta: ['θ', 'theta', 'angle'], phi: ['φ', 'phi', 'W0', 'workfunction'], K: ['K', 'KE', 'Ek', 'Kmax', 'KEmax', 'Ekmax'],
  f: ['f', 'freq'], v: ['v'], u: ['u', 'v0', 'vi'], t: ['t', 'Δt'], gamma: ['γ', 'gamma'], thalf: ['t½', 't1/2', 'thalf', 'T½', 'T1/2', 'halflife'],
  lam: ['λ', 'lambda', 'k'], emf: ['ε', 'emf', 'EMF', 'E'], Phi: ['Φ', 'phi', 'flux'], tau: ['τ', 'tau'], dt: ['Δt', 'dt', 't'], omega: ['ω', 'omega'],
  eta: ['η', 'eta', 'efficiency'], h: ['h'], g: ['g'], c: ['c'], lmax: ['λmax', 'lambdamax'], m0: ['m0', 'm', 'mo'], t0: ['t0', 'to'], l0: ['l0', 'L0', 'lo'], l: ['l', 'L'],
};

function symbolMatches(v: ResolvedVar, sym: string): boolean {
  const s = sym.replace(/[₀₁₂₃₄₅₆₇₈₉]/g, (d) => String('₀₁₂₃₄₅₆₇₈₉'.indexOf(d))).replace(/_/g, '');
  if (plainSymbol(v.symbol) === s) return true;
  if (v.key === s) return true;
  const al = SYMBOL_ALIASES[v.key];
  if (al && al.includes(s)) return true;
  return false;
}

function kindCompatible(v: ResolvedVar, q: Extracted): boolean {
  if (v.q === 'amount') return q.kinds.some((k) => k === 'amount' || k === 'mass' || k === 'activity' || k === 'count' || k === 'percent');
  if (v.q === 'angle') return q.kinds.includes('angle') || (q.unit === '' && !!q.symbol);
  if (v.q === 'count') return q.unit === '' || ['turns', 'lines', 'slits', 'nuclei', 'photons'].includes(q.unit);
  if (v.q === 'dimensionless') return q.unit === '' || q.kinds.includes('dimensionless');
  if (v.q === 'percent') return q.unit === '%' || (q.unit === '' && q.value <= 1);
  if (v.q === 'temperature') return q.kinds.includes('temperature');
  const qd = QUANTITIES[v.q].dim;
  const ud = q.unitDef.dim;
  if (q.unit === '') return false;
  return dimEq(qd, ud) && !isDimless(ud);
}

function cueScore(v: ResolvedVar, q: Extracted, spans: Array<[number, number]> = []): { score: number; cue: string } {
  let best = 0;
  let bestCue = '';
  const cues = [...v.cues, v.name.toLowerCase()];
  const inSpan = (abs: number) => spans.find(([a, b]) => abs >= a && abs <= b);
  for (const cue of cues) {
    if (!cue) continue;
    const c = cue.toLowerCase();
    const w = 4 + Math.min(c.length, 24) / 3;
    const i = c.length <= 3 ? lastWordIndex(q.before, c) : q.before.lastIndexOf(c);
    if (i >= 0) {
      const dist = q.before.length - (i + c.length);
      let s = w - dist * 0.06;
      // A cue that is part of the question being asked ("calculate the fringe spacing on a screen 2.0 m away")
      // describes the unknown, not this value.
      if (inSpan(q.beforeStart + i) && dist > 3) s *= 0.35;
      if (s > best) { best = s; bestCue = cue; }
    }
    const j = c.length <= 3 ? firstWordIndex(q.after, c) : q.after.indexOf(c);
    if (j >= 0) {
      const s = w * 0.85 - j * 0.1;
      if (s > best) { best = s; bestCue = cue; }
    }
  }
  return { score: best, cue: bestCue };
}

function lastWordIndex(hay: string, w: string): number {
  const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![a-z])`, 'g');
  let m: RegExpExecArray | null;
  let last = -1;
  while ((m = re.exec(hay))) last = m.index + m[1].length;
  return last;
}
function firstWordIndex(hay: string, w: string): number {
  const re = new RegExp(`(^|[^a-z])${w.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}(?![a-z])`);
  const m = re.exec(hay);
  return m ? m.index + m[1].length : -1;
}

/* ------------------------------------------------------------------ */
/* Targets                                                              */
/* ------------------------------------------------------------------ */

const TARGET_RE = /\b(calculate|determine|find|what (?:is|was|will|would|are|were)|how (?:far|long|fast|high|much|many|large|big|quickly)|estimate|evaluate|predict|deduce|compute|show that|quantify|obtain|work out)\b([^.?\n]*)/gi;

interface TargetPhrase {
  verb: string;
  phrase: string;
  start: number;
  end: number;
}

export function findTargetPhrases(text: string): TargetPhrase[] {
  const out: TargetPhrase[] = [];
  let m: RegExpExecArray | null;
  TARGET_RE.lastIndex = 0;
  while ((m = TARGET_RE.exec(text))) {
    const verb = m[1].toLowerCase();
    const body = m[2];
    // "calculate the maximum height and the range" → two targets
    const splittable = verb !== 'show that' && !/between|\d/.test(body);
    const pieces = !splittable ? [body] : body.split(/\s+and\s+(?:its |the |hence |also )?(?=[a-z])|,\s*(?:and\s+)?(?:its |the )/i);
    let offset = m.index + m[1].length;
    for (const piece of pieces) {
      const at = text.indexOf(piece, offset);
      const st = at >= 0 ? at : offset;
      out.push({ verb, phrase: (verb + ' ' + piece).toLowerCase(), start: pieces.length > 1 ? st : m.index, end: st + piece.length });
      offset = st + piece.length;
    }
  }
  return out;
}

function unitHintFrom(phrase: string, v: ResolvedVar): string | undefined {
  const m = /\bin (?:units of )?([a-zA-Zμ°%/^0-9\- ]{1,12}?)(?:\s*$|[,;)]| to | and |\s+correct)/.exec(phrase);
  if (!m) return undefined;
  const cand = m[1].trim();
  const u = parseUnit(cand);
  if (!u) return undefined;
  if (dimEq(u.dim, QUANTITIES[v.q].dim) && !isDimless(u.dim)) return cand;
  if (v.q === 'angle' && (cand === '°' || cand === 'degrees' || cand === 'rad')) return cand === 'degrees' ? '°' : cand;
  return undefined;
}

const NOUN_KINDS: Array<[RegExp, QuantityKind[]]> = [
  [/force per (unit )?(length|metre|meter)/, ['forcePerLength']],
  [/charge[- ]to[- ]mass|e\/m|q\/m/, ['chargeToMass']],
  [/decay constant/, ['decayConstant']],
  [/binding energy per nucleon/, ['energyPerNucleon']],
  [/wavelength/, ['length']],
  [/half-life|half life|lifetime|time interval|\btime\b|period|how long/, ['time']],
  [/kinetic energy|energy|work done|\bwork\b|work function/, ['energy', 'energyPerNucleon']],
  [/frequency/, ['frequency']],
  [/acceleration/, ['acceleration']],
  [/speed|velocity|how fast/, ['speed']],
  [/momentum/, ['momentum']],
  [/torque|moment/, ['torque']],
  [/force|tension|weight/, ['force', 'forcePerLength']],
  [/magnetic field|field strength|\bb\b/, ['bfield', 'efield', 'acceleration']],
  [/electric field/, ['efield']],
  [/flux/, ['flux']],
  [/emf|voltage|potential difference|stopping potential/, ['voltage']],
  [/current/, ['current']],
  [/resistance/, ['resistance']],
  [/power|luminosity/, ['power']],
  [/charge/, ['charge']],
  [/temperature/, ['temperature']],
  [/mass/, ['mass', 'amount', 'massPerTime']],
  [/angle/, ['angle']],
  [/radius|distance|length|height|range|displacement|separation|spacing|how far|how high|altitude|deflection|diameter/, ['length']],
  [/number of|how many/, ['count', 'dimensionless', 'frequency']],
  [/activity/, ['activity', 'amount']],
  [/efficiency|percentage|fraction/, ['percent', 'amount', 'dimensionless']],
  [/lorentz factor|gamma/, ['dimensionless']],
  [/refractive index/, ['dimensionless']],
  [/intensity/, ['intensity']],
];

function headKinds(phrase: string): QuantityKind[] | null {
  let best: { idx: number; kinds: QuantityKind[] } | null = null;
  for (const [re, kinds] of NOUN_KINDS) {
    const m = re.exec(phrase);
    if (m && (!best || m.index < best.idx)) best = { idx: m.index, kinds };
  }
  return best?.kinds ?? null;
}

function scoreTargetVar(v: ResolvedVar, tp: TargetPhrase): number {
  const p = tp.phrase;
  const hk = headKinds(p);
  const kindOk = !hk || hk.includes(v.q) || (v.q === 'amount');
  const factor = kindOk ? 1 : 0.25;
  const rate = /per second|each second|every second|per unit time|\brate\b/.test(p) && ['massPerTime', 'power', 'frequency', 'activity'].includes(v.q) ? 10 : 0;
  return factor * scoreTargetVarRaw(v, tp) + (hk && hk.includes(v.q) ? 0.5 : 0) + rate;
}

function scoreTargetVarRaw(v: ResolvedVar, tp: TargetPhrase): number {
  const p = tp.phrase;
  let best = 0;
  for (const cue of [...v.cues, v.name.toLowerCase()]) {
    const c = cue.toLowerCase();
    if (c.length < 3 && !/^[a-z]$/.test(c)) continue;
    const i = p.indexOf(c);
    if (i >= 0) best = Math.max(best, c.length * 1.5 + 10 - i * 0.05);
  }
  const verb = tp.verb;
  if (verb === 'how far' && v.q === 'length') best = Math.max(best, 8);
  if (verb === 'how long' && v.q === 'time') best = Math.max(best, 9);
  if ((verb === 'how fast' || verb === 'how quickly') && v.q === 'speed') best = Math.max(best, 9);
  if (verb === 'how high' && v.q === 'length') best = Math.max(best, 8);
  if (verb === 'how many' && (v.q === 'count' || v.q === 'dimensionless' || v.q === 'frequency')) best = Math.max(best, 7);
  if (verb === 'how much' && (v.q === 'energy' || v.q === 'amount' || v.q === 'mass')) best = Math.max(best, 5);
  return best;
}

/* ------------------------------------------------------------------ */
/* Scenario scoring                                                     */
/* ------------------------------------------------------------------ */

function keywordScore(s: ResolvedScenario, lower: string): number {
  let sc = 0;
  for (const [kw, w] of s.keywords) if (w > 0 && lower.includes(kw.toLowerCase())) sc += w;
  return sc;
}

const OTHER_BODIES = /\b(mars|moon|jupiter|venus|saturn|mercury|neptune|uranus|pluto|sun|star|planet x|exoplanet|titan|io|europa|ganymede)\b/i;

interface MapOutcome {
  assignments: Assignment[];
  autoFilled: AutoFill[];
  unused: Extracted[];
  notes: string[];
  knowns: Record<string, KnownInput>;
  claimedIds: Set<number>;
}

function siFor(v: ResolvedVar, q: Extracted): number {
  if (v.q === 'angle') return q.unit === 'rad' ? q.value : (q.value * Math.PI) / 180;
  if (v.q === 'count' || v.q === 'dimensionless') return q.value;
  if (v.q === 'percent') return q.unit === '%' ? q.value / 100 : q.value;
  if (v.q === 'amount') return q.unit ? toSI(q.value, q.unit) : q.value;
  return toSI(q.value, q.unit, v.q as QuantityKind);
}

function mapScenario(s: ResolvedScenario, qs: Extracted[], text: string, particle: Particle | null, targets: TargetPhrase[]): MapOutcome {
  const lower = text.toLowerCase();
  const assignments: Assignment[] = [];
  const autoFilled: AutoFill[] = [];
  const notes: string[] = [];
  const used = new Set<number>();
  const taken = new Set<string>();
  // Quantities inside "show that …" phrases are claims to verify, not data.
  const claimedIds = new Set<number>();
  for (const tp of targets) if (tp.verb === 'show that') for (const q of qs) if (q.start >= tp.start && q.start <= tp.end) claimedIds.add(q.id);

  const assign = (q: Extracted, key: string, score: number, reason: string) => {
    assignments.push({ q, key, score, reason });
    used.add(q.id);
    taken.add(key);
  };

  // 1. explicit symbols (e.g. "B = 0.50 T")
  for (const q of qs) {
    if (!q.symbol || claimedIds.has(q.id)) continue;
    const v = s.varOrder.map((k) => s.vars[k]).find((vv) => !taken.has(vv.key) && symbolMatches(vv, q.symbol!) && (kindCompatible(vv, q) || (q.unit === '' && (vv.q === 'count' || vv.q === 'dimensionless' || vv.q === 'angle'))));
    if (v) assign(q, v.key, 100, `written as ${q.symbol} = …`);
  }

  // 2. cue-based matching (global greedy on scores)
  // Only the HEAD of each question phrase ("calculate the fringe spacing") describes the unknown.
  const spans: Array<[number, number]> = targets.map((t) => {
    const body = text.slice(t.start, t.end).toLowerCase();
    const cut = body.search(/\s(on|between|at|when|if|from|in|after|before|that|which|by|with|for|to|as|using|given)\s/);
    return [t.start, t.start + (cut > 0 ? cut : body.length)];
  });
  const pairs: Array<{ q: Extracted; v: ResolvedVar; score: number; cue: string }> = [];
  for (const q of qs) {
    if (used.has(q.id) || claimedIds.has(q.id)) continue;
    for (const k of s.varOrder) {
      const v = s.vars[k];
      if (taken.has(k)) continue;
      if (!kindCompatible(v, q)) continue;
      const { score, cue } = cueScore(v, q, spans);
      let hint = 0;
      if (v.valueHint) { try { hint = v.valueHint(siFor(v, q)); } catch { hint = 0; } }
      pairs.push({ q, v, score: score + hint + (score > 0 ? (v.advanced ? 0 : 0.5) : 0) + (v.constant ? -2 : 0), cue: cue || (hint > 0 ? 'size of the value' : '') });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  for (const p of pairs) {
    if (p.score < 3) break;
    if (used.has(p.q.id) || taken.has(p.v.key)) continue;
    assign(p.q, p.v.key, p.score, `“${p.cue}” near the value`);
  }
  // 3. dimension-unique fallback
  for (const q of qs) {
    if (used.has(q.id) || claimedIds.has(q.id)) continue;
    const compatible = s.varOrder.map((k) => s.vars[k]).filter((v) => !taken.has(v.key) && kindCompatible(v, q) && !v.intermediate && !v.constant);
    const primary = compatible.filter((v) => !v.advanced);
    const pool = primary.length ? primary : compatible;
    const pref = pool.filter((v) => v.primary);
    if (pool.length === 1 && q.unit !== '') assign(q, pool[0].key, 2, 'only quantity of this type in the calculation');
    else if (pref.length === 1 && q.unit !== '') assign(q, pref[0].key, 1.5, 'main quantity of this type in this calculation');
  }

  const has = (k: string) => taken.has(k) || autoFilled.some((a) => a.key === k);
  // Variables the question asks for must never be auto-filled (e.g. "calculate the mass of the Earth").
  const reserved = new Set<string>();
  for (const tp of targets) {
    const k = pickTargetFrom(s, tp, (key) => taken.has(key));
    if (k) reserved.add(k);
  }
  const fill = (key: string, value: number, note: string, origin: AutoFill['origin'] = 'given', sigFigs?: number) => {
    if (!s.vars[key] || has(key) || reserved.has(key)) return;
    autoFilled.push({ key, value, note, origin, sigFigs });
  };

  // 4. scenario-specific language
  const sid = s.id;
  if (sid === 'projectile' || sid === 'projectile_level') {
    if (/\bhorizontally\b|rolls off|rolled off|slides off|runs off|driven off|drives off|flies horizontally/.test(lower) && !has('theta')) fill('theta', 0, 'Launched horizontally ⇒ θ = 0° (u_y = 0).', 'given', 4);
    const syA = assignments.find((a) => a.key === 'sy');
    if (syA && !syA.q.symbol && syA.q.value > 0) {
      const ctx = syA.q.before + ' ' + syA.q.after;
      const landsAbove = /(lands on|onto|reaches|hits).*(above|higher|roof|platform)|higher than the launch/.test(ctx) && !/cliff|tower|building|table|bench/.test(ctx);
      if (!landsAbove) notes.push(`Launch point is ${syA.q.value} ${syA.q.unit} ABOVE the landing point, so Δy = −${syA.q.value} ${syA.q.unit} (up positive).`);
      (syA as Assignment & { sign?: number }).sign = landsAbove ? 1 : -1;
    }
    if (!has('sy') && /(level ground|same (height|level)|ground level|from the ground|off the ground|on the ground|lands on the ground|returns to the ground|from ground|on flat ground|kicked from|hit from)/.test(lower) && !/cliff|building|tower|table|bench|high\b/.test(lower)) {
      fill('sy', 0, 'Lands at the same height it was launched from ⇒ Δy = 0.', 'given', 4);
    }
  }
  if (sid === 'magnetic_particle' || sid === 'motor_force' || sid === 'velocity_selector') {
    if (/perpendicular|right angles|at 90/.test(lower) && !has('theta') && s.vars.theta) fill('theta', Math.PI / 2, 'Perpendicular to the field ⇒ θ = 90°.', 'given', 4);
    if (/parallel to the (magnetic )?field/.test(lower) && !has('theta') && s.vars.theta) fill('theta', 0, 'Parallel to the field ⇒ θ = 0°.', 'given', 4);
  }
  if (sid === 'flux' || sid === 'faraday') {
    if (/plane of the (coil|loop)[^.]*perpendicular to the (magnetic )?field|field[^.]*perpendicular to the plane/.test(lower) && !has('theta') && !has('alpha')) fill('theta', 0, 'Field perpendicular to the plane of the coil ⇒ θ = 0° to the normal.', 'given', 4);
    if (/plane of the (coil|loop)[^.]*parallel to the (magnetic )?field|field[^.]*parallel to the plane/.test(lower) && !has('theta') && !has('alpha')) fill('theta', Math.PI / 2, 'Field parallel to the plane ⇒ θ = 90° to the normal (zero flux).', 'given', 4);
    if (/(reduced|drops|falls|decreases|switched off|removed)[^.]*\bto zero\b|\bto zero\b/.test(lower) && !has('B2') && s.vars.B2 && has('B1')) fill('B2', 0, 'Field falls to zero ⇒ B₂ = 0.', 'given', 4);
    if (/(removed|pulled out|moved out) (of|from) the field|switched off/.test(lower) && !has('B2') && s.vars.B2) fill('B2', 0, 'Coil removed from the field / field switched off ⇒ B₂ = 0.', 'given', 4);
    if (/(from zero|initially zero|switched on|placed into|moved into)/.test(lower) && !has('B1') && s.vars.B1) fill('B1', 0, 'Field starts at zero ⇒ B₁ = 0.', 'given', 4);
  }
  if (sid === 'transformer' && /step[- ]down/.test(lower)) notes.push('Step-down transformer: Vs < Vp.');
  if (sid === 'dc_motor') {
    if (/plane[^.]*parallel to the (magnetic )?field|parallel to the plane/.test(lower) && !has('theta') && !has('alpha')) fill('theta', Math.PI / 2, 'Plane of the coil parallel to B ⇒ θ = 90° between B and the normal (maximum torque).', 'given', 4);
    if (/plane[^.]*perpendicular to the (magnetic )?field/.test(lower) && !has('theta') && !has('alpha')) fill('theta', 0, 'Plane of the coil perpendicular to B ⇒ θ = 0° to the normal (zero torque).', 'given', 4);
  }
  if (sid === 'interference' || sid === 'interference_dark') {
    const ord = /\b(first|second|third|fourth|fifth|1st|2nd|3rd|4th|5th)[- ]order\b/.exec(lower) ?? /\b(first|second|third|fourth|fifth)\s+(bright|dark|maximum|minimum|fringe)/.exec(lower);
    if (ord && !has('m')) {
      const nmap: Record<string, number> = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5 };
      const mv = nmap[ord[1]];
      if (sid === 'interference_dark') fill('m', mv - 1, `The ${ord[1]} dark fringe corresponds to m = ${mv - 1} in d sin θ = (m + ½)λ.`, 'given', 4);
      else fill('m', mv, `${ord[1]}-order maximum ⇒ m = ${mv}.`, 'given', 4);
    }
    if (/central maximum/.test(lower) && /(first|next) (bright )?(fringe|maximum)/.test(lower) && !has('m')) fill('m', 1, 'Adjacent to the central maximum ⇒ m = 1.', 'given', 4);
  }
  if (sid === 'binding' || sid === 'reaction') {
    const nuc = findNuclides(text);
    if (nuc.length && sid === 'binding') {
      const n0 = nuc[0];
      if (!has('Z')) fill('Z', n0.Z, `${n0.label}: Z = ${n0.Z} protons (periodic table).`, 'given', 4);
      if (!has('A') && !has('N')) fill('A', n0.A, `${n0.label}: A = ${n0.A} nucleons.`, 'given', 4);
    }
  }
  if (sid === 'relativity' || sid === 'mass_energy') {
    const vA = assignments.find((a) => a.key === 'v');
    if (vA && vA.q.unit === 'c') notes.push(`Speed given as a fraction of c: v = ${vA.q.value}c = ${vA.q.value} × 3.00 × 10⁸ m s⁻¹.`);
  }
  if (sid === 'decay') {
    const a0 = assignments.find((a) => a.key === 'N0');
    const at = assignments.find((a) => a.key === 'Nt');
    if (!a0 && at && /(percent|%)/.test(at.q.raw)) fill('N0', 1, 'Percentages are relative to an initial 100%.', 'given', 4);
    if (!a0 && !at && !qs.some((q) => q.kinds.includes('amount') && q.unit !== '' && !used.has(q.id) ) && /(fraction|percentage|what percentage)/.test(lower)) fill('N0', 1, 'Working with fractions: N₀ = 1 (100%).', 'given', 4);
    if (/(one[- ]quarter|a quarter|1\/4)/.test(lower) && !has('Nt')) { fill('N0', 1, 'Fractions of the original sample: N₀ = 1.', 'given', 4); fill('Nt', 0.25, 'One quarter remains ⇒ Nₜ = 0.25 N₀.', 'given', 4); }
    if (/(one[- ]eighth|an eighth|1\/8)/.test(lower) && !has('Nt')) { fill('N0', 1, 'Fractions of the original sample: N₀ = 1.', 'given', 4); fill('Nt', 0.125, 'One eighth remains ⇒ Nₜ = 0.125 N₀.', 'given', 4); }
    if (/(one[- ]half|half of the|1\/2 of)/.test(lower) && !has('Nt') && !/half-life/.test(lower.replace(/half[- ]life|half[- ]lives/g, ''))) { /* ignore */ }
  }

  // 5. central body
  if (['gravitation', 'orbit', 'orbit_change'].includes(sid)) {
    const other = OTHER_BODIES.exec(lower);
    const earthCentral = /earth/.test(lower) && !(other && new RegExp(`(orbit\\w*|around|above|surface of|on) (the )?(planet )?${other[1]}`).test(lower));
    if (earthCentral) {
      if (!has('M')) fill('M', CONST.ME.value, 'Mass of Earth from the NESA data sheet (6.0 × 10²⁴ kg).', 'constant', 2);
      if (s.vars.R && !has('R')) fill('R', CONST.RE.value, 'Radius of Earth from the NESA data sheet (6.371 × 10⁶ m).', 'constant', 4);
    } else if (other && !has('M')) {
      notes.push(`The central body appears to be ${other[1]}; its mass is not on the NESA data sheet, so it must be supplied in the question.`);
    }
    if (/(on|at) (the )?(earth's |planet's |its )?surface|surface of the (earth|planet)/.test(lower) && s.vars.h && !has('h') && !has('r')) fill('h', 0, 'At the surface ⇒ altitude h = 0 (r = planet radius).', 'given', 4);
    if (/geostationary|geosynchronous/.test(lower) && s.vars.T && !has('T')) fill('T', 86400, 'Geostationary orbit ⇒ period T = 24 h = 86 400 s (same as Earth’s rotation).', 'given', 4);
  }

  // 6. particle properties
  if (particle) {
    const mass = CONST[particle.massId];
    const massKey = s.vars.m0 ? 'm0' : s.vars.m ? 'm' : null;
    if (massKey && s.vars[massKey].q === 'mass' && !has(massKey)) {
      fill(massKey, mass.value, `Mass of ${particle.name}: ${mass.printed} (${mass.source === 'NESA_DATA_SHEET' ? 'NESA data sheet' : 'reference value — not on the NESA data sheet'}).`, 'constant', 4);
    }
    if (s.vars.q && s.vars.q.q === 'charge' && !has('q') && !s.vars.q.constant) {
      if (particle.chargeMultiple === 0) notes.push('A neutron is uncharged: it experiences no electric or magnetic force.');
      else fill('q', Math.abs(particle.chargeMultiple) * CONST.e.value, `Charge of ${particle.name}: |q| = ${Math.abs(particle.chargeMultiple) === 1 ? '' : Math.abs(particle.chargeMultiple) + ' × '}1.602 × 10⁻¹⁹ C (magnitude used; sign ${particle.chargeMultiple > 0 ? 'positive' : 'negative'} affects direction only).`, 'constant', 4);
    }
    if (sid === 'chadwick' && particle.name === 'neutron' && !has('m1')) fill('m1', CONST.mn.value, 'Mass of neutron (NESA data sheet).', 'constant', 4);
  }

  const unused = qs.filter((q) => !used.has(q.id) && !claimedIds.has(q.id));

  // Build knowns
  const knowns: Record<string, KnownInput> = {};
  for (const a of assignments) {
    const v = s.vars[a.key];
    let si: number;
    try { si = siFor(v, a.q); } catch { continue; }
    const sign = (a as Assignment & { sign?: number }).sign;
    if (sign === -1) si = -Math.abs(si);
    knowns[a.key] = { value: si, sigFigs: a.q.sigFigs, unit: a.q.unit, raw: a.q.raw, origin: 'given' };
  }
  for (const f of autoFilled) knowns[f.key] = { value: f.value, sigFigs: f.sigFigs, origin: f.origin, note: f.note };
  // Question-supplied constants (e.g. "g = 10 m/s²") are already in knowns via symbols → they override data-sheet values.
  return { assignments, autoFilled, unused, notes, knowns, claimedIds };
}

function pickTarget(s: ResolvedScenario, tp: TargetPhrase, knowns: Record<string, KnownInput>): string | null {
  return pickTargetFrom(s, tp, (k) => !!knowns[k] && knowns[k].origin !== 'assumed');
}

function pickTargetFrom(s: ResolvedScenario, tp: TargetPhrase, isKnown: (k: string) => boolean): string | null {
  let best: { k: string; sc: number } | null = null;
  for (const k of s.varOrder) {
    const v = s.vars[k];
    if (isKnown(k) || (v.constant && !/constant|planck|mass of the earth|mass of earth|radius of the earth|radius of earth/.test(tp.phrase))) continue;
    const sc = scoreTargetVar(v, tp);
    if (sc > 0 && (!best || sc > best.sc)) best = { k, sc };
  }
  return best?.k ?? null;
}

/* ------------------------------------------------------------------ */
/* Directions                                                           */
/* ------------------------------------------------------------------ */

function findDir(lower: string, subject: RegExp): DirWord | null {
  const m = subject.exec(lower);
  if (!m) return null;
  const window = lower.slice(m.index, m.index + m[0].length + 60);
  return parseDirWord(window);
}

function directionReasoning(s: ResolvedScenario, lower: string, particle: Particle | null): Array<{ title: string; result: DirectionResult }> {
  const out: Array<{ title: string; result: DirectionResult }> = [];
  const B = findDir(lower, /(magnetic field|field)[^.]*?(directed|pointing|acts|is|points|into|out of|to the)/) ?? (/(field|b)[^.]{0,30}into the page|into the page[^.]{0,30}field/.test(lower) ? 'in' : /(field|b)[^.]{0,30}out of the page|out of the page[^.]{0,30}field/.test(lower) ? 'out' : null);
  if (s.direction === 'magneticCharge' && particle && particle.chargeMultiple !== 0) {
    const v = findDir(lower, /(moving|travelling|traveling|velocity|enters|moves|directed|projected|fired)/);
    if (v && B) out.push({ title: 'Direction of the magnetic force', result: magneticForceOnCharge(v, B, particle.chargeMultiple > 0 ? 1 : -1) });
    else out.push({ title: 'Direction of the magnetic force', result: { ok: false, steps: [`Direction cannot be determined: the question ${!v ? 'does not state the direction of the velocity' : ''}${!v && !B ? ' and ' : ''}${!B ? 'does not state the direction of the field' : ''}. Use the right-hand palm rule on the diagram (reverse it for negative charges).`] } });
  }
  if (s.direction === 'motor') {
    const I = findDir(lower, /current[^.]*?(flows|flowing|is|directed|travels)/);
    if (I && B) out.push({ title: 'Direction of the force on the conductor', result: motorForce(I, B) });
  }
  if (s.direction === 'electricCharge' && particle) {
    const E = findDir(lower, /(electric field|field)[^.]*?(directed|pointing|points|acts|is)/);
    if (E && particle.chargeMultiple !== 0) out.push({ title: 'Direction of the electric force', result: electricForce(E, particle.chargeMultiple > 0 ? 1 : -1) });
    else if (particle.chargeMultiple !== 0) out.push({ title: 'Direction of the electric force', result: { ok: true, steps: [particle.chargeMultiple > 0 ? `A ${particle.name} is positive: it is pushed from the positive plate towards the negative plate (along E).` : `An ${particle.name} is negative: it is pushed towards the POSITIVE plate (opposite to E).`] } });
  }
  if (s.direction === 'lenz') {
    const into = /into the page|into the paper/.test(lower);
    const outp = /out of the page|out of the paper/.test(lower);
    const inc = /(increas|moved into|pushed into|switched on|entering|enters|brought towards|approach)/.test(lower);
    const dec = /(decreas|reduced|falls|removed|pulled out|switched off|leaving|leaves|moved away|drops)/.test(lower);
    if ((into || outp) && (inc || dec) && !(inc && dec)) out.push({ title: "Direction of the induced current (Lenz's law)", result: lenz(into ? 'in' : 'out', inc ? 'increasing' : 'decreasing') });
    else out.push({ title: "Direction (Lenz's law)", result: { ok: true, steps: ['The induced current flows so that its magnetic field opposes the CHANGE in flux (Lenz’s law). The question does not give enough directional information (field direction and whether the flux increases or decreases) to state the current direction.'] } });
  }
  if (s.direction === 'wires') {
    const same = /same direction/.test(lower);
    const opp = /opposite direction/.test(lower);
    if (same || opp) out.push({ title: 'Nature of the force between the wires', result: wiresForce(same) });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Main entry                                                           */
/* ------------------------------------------------------------------ */

export function smartSolve(input: string, opts: { scenarioId?: string } = {}): SmartResult {
  const normalized = normaliseQuestion(input);
  const lower = normalized.toLowerCase();
  const quantities = extractQuantities(normalized);
  const particle = detectParticle(normalized);
  const targets = findTargetPhrases(normalized);

  const candidates = opts.scenarioId ? RESOLVED.filter((s) => s.id === opts.scenarioId) : RESOLVED;
  const kw = candidates.map((s) => ({ s, kw: keywordScore(s, lower) }));
  kw.sort((a, b) => b.kw - a.kw);
  const pool = kw.filter((x) => x.kw > 0).slice(0, 12);
  const evalSet = pool.length ? pool : kw;

  let best: { s: ResolvedScenario; score: number; map: MapOutcome; parts: SmartPart[]; solved: boolean } | null = null;
  const ranking: SmartResult['ranking'] = [];
  for (const { s, kw: k } of evalSet) {
    const map = mapScenario(s, quantities, normalized, particle, targets);
    const parts: SmartPart[] = [];
    const tps = targets.length ? targets : [{ verb: 'find', phrase: '', start: normalized.length, end: normalized.length }];
    let solvedCount = 0;
    let targetHits = 0;
    const seenTargets = new Set<string>();
    for (const tp of tps) {
      let target = tp.phrase ? pickTarget(s, tp, map.knowns) : null;
      if (target) targetHits++;
      if (!target && !targets.length && s.defaultTarget && !map.knowns[s.defaultTarget]) target = s.defaultTarget;
      if (target && seenTargets.has(target)) continue;
      if (target) seenTargets.add(target);
      const v = target ? s.vars[target] : null;
      let claimed: SmartPart['claimed'] = null;
      if (tp.verb === 'show that') {
        const cq = quantities.find((q) => map.claimedIds.has(q.id) && q.start >= tp.start && q.start <= tp.end);
        if (cq) claimed = { value: cq.value, unit: cq.unit };
      }
      const result = target ? solveWithAssumptions(s, map.knowns, { target }) : null;
      if (result?.ok) solvedCount++;
      parts.push({ phrase: tp.phrase, target, unitHint: v ? unitHintFrom(tp.phrase, v) : undefined, result, claimed });
    }
    const assignedScore = map.assignments.reduce((a, b) => a + Math.min(b.score, 20), 0);
    const score = solvedCount * 60 + targetHits * 12 + k * 4 + assignedScore * 0.6 + map.autoFilled.length * 2 - map.unused.length * 14;
    ranking.push({ id: s.id, title: s.title, score, solved: solvedCount > 0 });
    if (!best || score > best.score) best = { s, score, map, parts, solved: solvedCount > 0 };
  }
  ranking.sort((a, b) => b.score - a.score);

  if (!best) {
    return { input, normalized, quantities, scenario: null, ranking, assignments: [], autoFilled: [], unused: quantities, parts: [], particle, directions: [], notes: ['No matching HSC calculation type was recognised.'], knowns: {} };
  }
  const notes = [...best.map.notes];
  if (!targets.length) notes.push('No explicit “calculate / determine / find …” phrase was found — showing the most likely unknown.');
  return {
    input,
    normalized,
    quantities,
    scenario: best.s,
    ranking,
    assignments: best.map.assignments,
    autoFilled: best.map.autoFilled,
    unused: best.map.unused,
    parts: best.parts,
    particle,
    directions: directionReasoning(best.s, lower, particle),
    notes,
    knowns: best.map.knowns,
  };
}

/* ------------------------------------------------------------------ */
/* Smart formula detection from "symbol = value unit" lines             */
/* ------------------------------------------------------------------ */

export interface Detection {
  scenario: ResolvedScenario;
  used: string[];
  derived: Array<{ key: string; value: number }>;
  result: FullSolveResult;
}

export function detectCalculations(input: string): { detections: Detection[]; parsed: Array<{ symbol: string; raw: string }>; particle: Particle | null; unmatched: string[] } {
  const lines = input.split(/[\n;]+/).map((l) => l.trim()).filter(Boolean);
  const parsed: Array<{ symbol: string; raw: string }> = [];
  let particle: Particle | null = null;
  const qs: Extracted[] = [];
  const unmatched: string[] = [];
  let id = 0;
  for (const line of lines) {
    const m = /^([^=]+?)\s*=\s*(.+)$/.exec(line);
    if (!m) { unmatched.push(line); continue; }
    const sym = m[1].trim();
    const rhs = m[2].trim();
    const pp = detectParticle(rhs);
    if (pp && !/\d/.test(rhs)) { particle = pp; parsed.push({ symbol: sym, raw: rhs }); continue; }
    const norm = normaliseQuestion(`${sym} = ${rhs}`);
    const ex = extractQuantities(norm);
    if (!ex.length) { unmatched.push(line); continue; }
    const q = { ...ex[0], id: id++, symbol: sym.replace(/\s/g, '') };
    qs.push(q);
    parsed.push({ symbol: sym, raw: rhs });
  }
  const detections: Detection[] = [];
  for (const s of RESOLVED) {
    const known: Record<string, KnownInput> = {};
    const used: string[] = [];
    for (const q of qs) {
      const v = s.varOrder.map((k) => s.vars[k]).find((vv) => !known[vv.key] && symbolMatches(vv, q.symbol!) && (kindCompatible(vv, q) || (q.unit === '' && ['count', 'dimensionless', 'angle'].includes(vv.q))));
      if (!v) continue;
      try { known[v.key] = { value: siFor(v, q), sigFigs: q.sigFigs, unit: q.unit, raw: q.raw, origin: 'given' }; used.push(v.key); } catch { /* skip */ }
    }
    if (particle) {
      const mk = s.vars.m0 ? 'm0' : s.vars.m ? 'm' : null;
      if (mk && s.vars[mk].q === 'mass' && !known[mk]) { known[mk] = { value: CONST[particle.massId].value, origin: 'constant', sigFigs: 4, note: `mass of ${particle.name}` }; used.push(mk); }
      if (s.vars.q && s.vars.q.q === 'charge' && !known.q && particle.chargeMultiple !== 0) { known.q = { value: Math.abs(particle.chargeMultiple) * CONST.e.value, origin: 'constant', sigFigs: 4, note: `charge of ${particle.name}` }; used.push('q'); }
    }
    const givenCount = Object.values(known).filter((k) => k.origin === 'given').length;
    if (givenCount === 0 || givenCount < Math.min(qs.length, 2) && qs.length > 1) continue;
    const r = solveWithAssumptions(s, known, { mode: 'all' });
    const derived = r.allSteps.map((st) => ({ key: st.unknown, value: r.values[st.unknown] })).filter((d) => !s.vars[d.key].intermediate);
    if (derived.length) detections.push({ scenario: s, used, derived, result: r });
  }
  detections.sort((a, b) => b.used.length - a.used.length || b.derived.length - a.derived.length);
  return { detections, parsed, particle, unmatched };
}
