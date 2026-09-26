import { useEffect, useMemo, useState } from 'react';
import { getScenario } from '../../data/scenarios/index';
import type { ResolvedVar } from '../../engine/scenario';
import { QUANTITIES } from '../../engine/quantities';
import { parseNumber, normaliseNumberText, prettyUnit } from '../../engine/numbers';
import { toSI, parseUnit } from '../../engine/units';
import { dimEq } from '../../engine/dimensions';
import { solveWithAssumptions, KnownInput } from '../../engine/solver';
import { CONST } from '../../data/constants';
import { Tex, Rich } from './Tex';
import { useApp } from '../state';
import { formatQty, siUnitOf } from '../format';

interface Field { text: string; unit: string }

export function unitOptions(v: ResolvedVar): string[] {
  if (v.q === 'angle') return ['°', 'rad'];
  if (v.q === 'count' || v.q === 'dimensionless') return [''];
  if (v.q === 'percent') return ['%', ''];
  return QUANTITIES[v.q].input.length ? QUANTITIES[v.q].input : [QUANTITIES[v.q].si];
}

export function defaultUnit(v: ResolvedVar): string {
  if (v.defaultUnit) return v.defaultUnit;
  const opts = unitOptions(v);
  if (v.q === 'length' && /wavelength|λ/.test(v.name + v.symbol) && opts.includes('nm')) return 'nm';
  if (v.q === 'energy' && /work function|photon|K_{\\max}|kinetic energy of photo|level/.test(v.name + v.symbol)) return 'eV';
  return opts[0] ?? '';
}

/** Parse a user-entered value (number, optionally followed by a unit). */
export function parseField(v: ResolvedVar, f: Field): { si: number; sigFigs: number; unit: string; raw: string } | { error: string } | null {
  const text = f.text.trim();
  if (!text) return null;
  let unit = f.unit;
  let numText = text;
  const pn = parseNumber(text);
  if (!pn) {
    // try "500 nm" / "0.8c"
    const norm = normaliseNumberText(text);
    const m = /^([-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?)\s*(.+)$/i.exec(norm);
    if (!m) return { error: 'Not a number' };
    const u = parseUnit(m[2]);
    if (!u) return { error: `Unknown unit “${m[2]}”` };
    if (v.q !== 'angle' && !(v.q === 'amount') && !dimEq(u.dim, QUANTITIES[v.q].dim)) return { error: `“${m[2]}” is not a unit of ${QUANTITIES[v.q].label}` };
    unit = m[2];
    numText = m[1];
  }
  const p = parseNumber(numText);
  if (!p) return { error: 'Not a number' };
  try {
    let si: number;
    if (v.q === 'angle') si = unit === 'rad' ? p.value : (p.value * Math.PI) / 180;
    else if (v.q === 'count' || v.q === 'dimensionless') si = p.value;
    else if (v.q === 'percent') si = unit === '%' ? p.value / 100 : p.value;
    else if (v.q === 'amount') si = unit ? toSI(p.value, unit) : p.value;
    else si = toSI(p.value, unit, v.q);
    return { si, sigFigs: p.sigFigs, unit, raw: `${numText} ${unit}`.trim() };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

const PARTICLES = [
  { id: 'proton', label: 'proton', mass: 'mp', charge: 1 },
  { id: 'electron', label: 'electron', mass: 'me', charge: -1 },
  { id: 'alpha', label: 'alpha particle', mass: 'mAlpha', charge: 2 },
  { id: 'positron', label: 'positron', mass: 'me', charge: 1 },
  { id: 'neutron', label: 'neutron', mass: 'mn', charge: 0 },
];

function storageKey(id: string) {
  return `hsc.calc.${id}`;
}

export function ScenarioCalculator({ scenarioId, compact = false }: { scenarioId: string; compact?: boolean }) {
  const scn = useMemo(() => getScenario(scenarioId), [scenarioId]);
  const app = useApp();
  const targets = scn.targets ?? scn.varOrder.filter((k) => !scn.vars[k].constant);
  const [fields, setFields] = useState<Record<string, Field>>(() => {
    const init: Record<string, Field> = {};
    for (const k of scn.varOrder) init[k] = { text: '', unit: defaultUnit(scn.vars[k]) };
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(scenarioId)) ?? 'null');
      if (saved && saved.fields) for (const k of Object.keys(saved.fields)) if (init[k]) init[k] = saved.fields[k];
    } catch { /* ignore */ }
    return init;
  });
  const [target, setTarget] = useState<string>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey(scenarioId)) ?? 'null');
      if (saved?.target && scn.vars[saved.target]) return saved.target;
    } catch { /* ignore */ }
    return scn.defaultTarget ?? targets[0];
  });
  const [particleNote, setParticleNote] = useState<string>('');
  useEffect(() => {
    try { localStorage.setItem(storageKey(scenarioId), JSON.stringify({ fields, target })); } catch { /* ignore */ }
  }, [fields, target, scenarioId]);

  const set = (k: string, patch: Partial<Field>) => setFields((f) => ({ ...f, [k]: { ...f[k], ...patch } }));
  const parsed = useMemo(() => {
    const out: Record<string, ReturnType<typeof parseField>> = {};
    for (const k of scn.varOrder) out[k] = parseField(scn.vars[k], fields[k]);
    return out;
  }, [fields, scn]);

  const hasParticle = !!(scn.vars.q && scn.vars.q.q === 'charge' && !scn.vars.q.constant && (scn.vars.m || scn.vars.m0));
  const massKey = scn.vars.m0 ? 'm0' : 'm';
  const hasBody = !!scn.vars.M && (scn.topic === 'gravitation' || scn.topic === 'orbital');

  const applyParticle = (id: string) => {
    const p = PARTICLES.find((x) => x.id === id);
    if (!p) return;
    const m = CONST[p.mass];
    set(massKey, { text: m.value.toExponential(3).replace('e', 'e'), unit: 'kg' });
    if (scn.vars.q && p.charge !== 0) set('q', { text: (Math.abs(p.charge) * CONST.e.value).toExponential(3), unit: 'C' });
    setParticleNote(`${p.label}: m = ${m.printed}${m.source !== 'NESA_DATA_SHEET' ? ' (not on data sheet)' : ' (data sheet)'}${p.charge !== 0 ? `, |q| = ${Math.abs(p.charge) === 2 ? '2e = 3.204 × 10⁻¹⁹ C' : '1.602 × 10⁻¹⁹ C'} (${p.charge > 0 ? 'positive' : 'negative'})` : ', uncharged'}`);
  };
  const applyEarth = () => {
    set('M', { text: '6.0e24', unit: 'kg' });
    if (scn.vars.R) set('R', { text: '6.371e6', unit: 'm' });
  };

  const buildKnowns = (): { knowns: Record<string, KnownInput>; errors: string[] } => {
    const knowns: Record<string, KnownInput> = {};
    const errors: string[] = [];
    for (const k of scn.varOrder) {
      const p = parsed[k];
      if (!p) continue;
      if ('error' in p) { errors.push(`${scn.vars[k].name}: ${p.error}`); continue; }
      if (k === target) continue;
      knowns[k] = { value: p.si, sigFigs: p.sigFigs, unit: p.unit, raw: p.raw, origin: 'given' };
    }
    return { knowns, errors };
  };

  const solve = () => {
    const { knowns, errors } = buildKnowns();
    const result = solveWithAssumptions(scn, knowns, { target });
    if (errors.length) result.errors.unshift(...errors);
    app.show({ title: `${scn.title}: find ${scn.vars[target].name}`, scenario: scn, result, target, source: `Module ${scn.module} calculator`, extraNotes: particleNote ? [particleNote] : undefined });
  };

  const solveAll = () => {
    const { knowns } = buildKnowns();
    const r = solveWithAssumptions(scn, knowns, { mode: 'all' });
    const derived = r.allSteps.map((s) => s.unknown);
    app.showCustom(`${scn.title}: everything that follows from the data`, (
      <div className="sol">
        <h2 style={{ marginBottom: 8 }}>Quantities that follow from your data</h2>
        {derived.length === 0 && <div className="msg info">Nothing further can be calculated from the values entered. Enter more quantities.</div>}
        {r.errors.map((e, i) => <div key={i} className="msg err">{e}</div>)}
        <table className="tbl"><tbody>
          {derived.map((k) => {
            const v = scn.vars[k];
            return (
              <tr key={k}>
                <td><Tex math={v.symbol} /></td>
                <td className="small">{v.name}</td>
                <td><Tex math={formatQty(v, r.values[k], v.q === 'angle' ? '°' : siUnitOf(v), 4).latex} /></td>
                <td><button className="btn small" onClick={() => { setTarget(k); const { knowns: kk } = buildKnowns(); delete kk[k]; const res = solveWithAssumptions(scn, kk, { target: k }); app.show({ title: `${scn.title}: find ${v.name}`, scenario: scn, result: res, target: k, source: `Module ${scn.module} calculator` }); }}>Working</button></td>
              </tr>
            );
          })}
        </tbody></table>
      </div>
    ));
  };

  const clear = () => {
    const init: Record<string, Field> = {};
    for (const k of scn.varOrder) init[k] = { text: '', unit: defaultUnit(scn.vars[k]) };
    setFields(init);
    setParticleNote('');
  };

  const primary = scn.varOrder.filter((k) => !scn.vars[k].advanced && !scn.vars[k].constant);
  const advanced = scn.varOrder.filter((k) => scn.vars[k].advanced || scn.vars[k].constant);

  const renderVar = (k: string) => {
    const v = scn.vars[k];
    const f = fields[k];
    const p = parsed[k];
    const isT = k === target;
    const constVal = v.constant ? CONST[v.constant] : null;
    const opts = unitOptions(v);
    return (
      <div key={k} className={`var ${isT ? 'target' : ''} ${constVal ? 'const' : ''}`}>
        <div className="head">
          <span className="sym"><Tex math={v.symbol} /></span>
          <span>{v.name}</span>
        </div>
        <div className="row" style={opts.length === 1 && !opts[0] ? { gridTemplateColumns: '1fr' } : undefined}>
          <input
            className={`inp mono ${p && 'error' in p ? 'bad' : ''}`}
            value={isT ? '' : f.text}
            disabled={isT}
            placeholder={isT ? 'to be calculated' : constVal ? constVal.printed : v.signed ? '± value' : 'value'}
            onChange={(e) => set(k, { text: e.target.value })}
            aria-label={v.name}
            inputMode="decimal"
          />
          {!(opts.length === 1 && !opts[0]) && (
            <select className="inp" value={f.unit} onChange={(e) => set(k, { unit: e.target.value })} aria-label={`${v.name} unit`}>
              {opts.map((u) => <option key={u} value={u}>{u ? prettyUnit(u) : '—'}</option>)}
            </select>
          )}
        </div>
        {p && 'error' in p && <div className="tiny pill-bad">{p.error}</div>}
        {v.signed && !isT && !compact && <div className="tiny faint">signed value — use − for the negative direction</div>}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-h">
        <div>
          <h3>{scn.title}</h3>
          {!compact && <p className="small muted"><Rich text={scn.blurb} /></p>}
        </div>
        <span className="badge mod">M{scn.module}</span>
      </div>
      {(hasParticle || hasBody || scn.id === 'projectile') && (
        <div className="presets">
          {hasParticle && (
            <>
              <span className="muted">Particle:</span>
              {PARTICLES.map((p) => <button key={p.id} className="chip" onClick={() => applyParticle(p.id)}>{p.label}</button>)}
            </>
          )}
          {hasBody && (<><span className="muted">Central body:</span><button className="chip" onClick={applyEarth}>Earth (data sheet)</button></>)}
          {scn.id === 'projectile' && (<><span className="muted">Launch:</span><button className="chip" onClick={() => set('theta', { text: '0', unit: '°' })}>horizontal (θ = 0°)</button><button className="chip" onClick={() => set('sy', { text: '0', unit: 'm' })}>lands at launch height (Δy = 0)</button></>)}
          {particleNote && <span className="tiny muted">{particleNote}</span>}
        </div>
      )}
      <div className="vars">{primary.map(renderVar)}</div>
      {advanced.length > 0 && (
        <details className="more">
          <summary>More quantities and constants ({advanced.length})</summary>
          <div className="vars">{advanced.map(renderVar)}</div>
        </details>
      )}
      <div className="calc-actions">
        <div className="find">
          <span className="small muted">Find</span>
          <select className="inp" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Unknown to find">
            {targets.map((k) => <option key={k} value={k}>{scn.vars[k].name}</option>)}
            {scn.varOrder.filter((k) => !targets.includes(k) && !scn.vars[k].constant).map((k) => <option key={k} value={k}>{scn.vars[k].name}</option>)}
          </select>
        </div>
        <button className="btn primary" onClick={solve}>Solve</button>
        <button className="btn" onClick={solveAll} title="Show every quantity that follows from the values entered">Find everything</button>
        <button className="btn ghost" onClick={clear}>Clear</button>
      </div>
    </div>
  );
}
