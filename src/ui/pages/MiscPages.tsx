import { useMemo, useState } from 'react';
import { QUANTITIES, QuantityKind } from '../../engine/quantities';
import { toSI, fromSI, parseUnit } from '../../engine/units';
import { parseNumber, formatSig, prettyUnit } from '../../engine/numbers';
import { CONSTANTS, SOURCE_LABEL } from '../../data/constants';
import { Tex } from '../components/Tex';
import { detectCalculations } from '../../nlp/smart';
import { solveWithAssumptions } from '../../engine/solver';
import { useApp } from '../state';
import { formatQty, siUnitOf } from '../format';
import { FORMULAS } from '../../data/formulas/index';
import { SCENARIOS } from '../../data/scenarios/index';
import { SourceBadge } from '../components/SourceBadge';
import { TOPIC_BY_ID, MODULE_NAMES } from '../nav';
import { normSolution } from '../../engine/types';
import { unitLatex } from '../../engine/units';
import { DirectionTool } from '../tools/DirectionTool';

/* ---------------- Unit converter ---------------- */
const KINDS: QuantityKind[] = ['length', 'area', 'time', 'mass', 'speed', 'acceleration', 'force', 'energy', 'power', 'frequency', 'charge', 'current', 'voltage', 'efield', 'bfield', 'flux', 'resistance', 'momentum', 'temperature', 'activity', 'angle', 'lineDensity', 'hubble', 'decayConstant'];

export function UnitConverterPage() {
  const [kind, setKind] = useState<QuantityKind>('length');
  const q = QUANTITIES[kind];
  const units = Array.from(new Set([q.si, ...q.input, ...q.equivalents].filter((u) => u && u !== '1')));
  const [val, setVal] = useState('450');
  const [from, setFrom] = useState('nm');
  const p = parseNumber(val);
  const fromU = units.includes(from) ? from : units[0];
  let si = NaN;
  try { si = p ? (kind === 'angle' ? (fromU === 'rad' ? p.value : (p.value * Math.PI) / 180) : toSI(p.value, fromU, kind)) : NaN; } catch { si = NaN; }
  const sig = p ? Math.max(p.sigFigs, 3) : 3;
  return (
    <div>
      <div className="page-h"><div className="kicker">Unit Converter</div><h1>SI conversions with prefixes</h1><p>Every calculator converts to coherent SI units internally. Scientific notation such as <span className="kbd">3.00 × 10^8</span>, <span className="kbd">3.00e8</span> or <span className="kbd">6.63 × 10⁻³⁴</span> is accepted everywhere.</p></div>
      <div className="card">
        <div className="row">
          <div style={{ flex: '1 1 160px' }}><label className="lbl">Quantity</label><select className="inp" value={kind} onChange={(e) => { const k = e.target.value as QuantityKind; setKind(k); setFrom(QUANTITIES[k].input[0] ?? QUANTITIES[k].si); }}>{KINDS.map((k) => <option key={k} value={k}>{QUANTITIES[k].label}</option>)}</select></div>
          <div style={{ flex: '1 1 160px' }}><label className="lbl">Value</label><input className={`inp mono ${val && !p ? 'bad' : ''}`} value={val} onChange={(e) => setVal(e.target.value)} /></div>
          <div style={{ flex: '1 1 120px' }}><label className="lbl">Unit</label><select className="inp" value={fromU} onChange={(e) => setFrom(e.target.value)}>{units.map((u) => <option key={u} value={u}>{prettyUnit(u)}</option>)}</select></div>
        </div>
        {Number.isFinite(si) && (
          <div className="tbl-wrap" style={{ marginTop: 12 }}>
            <table className="tbl"><thead><tr><th>Unit</th><th>Value</th></tr></thead><tbody>
              {units.map((u) => {
                let v = NaN;
                try { v = kind === 'angle' ? (u === 'rad' ? si : (si * 180) / Math.PI) : fromSI(si, u, kind); } catch { /* skip */ }
                return <tr key={u} style={u === q.si ? { fontWeight: 650 } : undefined}><td>{prettyUnit(u)}{u === q.si ? ' (SI)' : ''}</td><td><Tex math={formatSig(v, sig).latex} /></td></tr>;
              })}
            </tbody></table>
          </div>
        )}
        {kind === 'temperature' && <div className="tiny muted">Kelvin = °C + 273.15. Absolute temperatures (K) must be used in Wien’s law.</div>}
        {kind === 'energy' && <div className="tiny muted">1 eV = 1.602 × 10⁻¹⁹ J (NESA data sheet).</div>}
        {kind === 'lineDensity' && <div className="tiny muted">Grating spacing d = 1/(lines per metre): e.g. 600 lines/mm → 6.00 × 10⁵ lines/m → d = 1.67 × 10⁻⁶ m.</div>}
      </div>
      <FreeConvert />
    </div>
  );
}

function FreeConvert() {
  const [txt, setTxt] = useState('0.80 c → km/s');
  const out = useMemo(() => {
    const m = /^\s*(.+?)\s*(?:→|->|to|in)\s*(.+)\s*$/.exec(txt);
    if (!m) return 'Write e.g. “450 nm → m” or “2.3 eV to J”.';
    const lhs = m[1].trim();
    const nm = /^([-+]?[\d.]+(?:\s*(?:e|×\s*10\^?|x\s*10\^?)\s*[-+−]?\d+)?)\s*(.*)$/i.exec(lhs);
    if (!nm) return 'Could not read the value.';
    const p = parseNumber(nm[1]);
    const u1 = parseUnit(nm[2] || '1');
    const u2 = parseUnit(m[2]);
    if (!p || !u1 || !u2) return 'Unrecognised number or unit.';
    if (u1.dim.some((x, i) => Math.abs(x - u2.dim[i]) > 1e-9)) return 'Those units measure different quantities.';
    const si = p.value * u1.factor + (u1.offset ?? 0);
    const v = (si - (u2.offset ?? 0)) / u2.factor;
    return `${formatSig(v, Math.max(p.sigFigs, 3)).text} ${m[2].trim()}`;
  }, [txt]);
  return (
    <div className="card">
      <div className="card-h"><h3>Quick conversion</h3></div>
      <input className="inp mono" value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="conversion" />
      <div style={{ marginTop: 8 }}><strong>{out}</strong></div>
    </div>
  );
}

/* ---------------- Constants ---------------- */
export function ConstantsPage() {
  return (
    <div>
      <div className="page-h"><div className="kicker">Constants</div><h1>Physical constants</h1><p>NESA data-sheet values are used by default in every calculation. If a question supplies its own value (e.g. g = 10 m s⁻²), enter it and it overrides the data-sheet value. Reference values not on the data sheet are clearly flagged and only used when you choose them.</p></div>
      {(['NESA_DATA_SHEET', 'DERIVED_FROM_DATA_SHEET', 'REFERENCE_NOT_ON_SHEET'] as const).map((s) => (
        <div key={s} className="card">
          <div className="card-h"><h3>{SOURCE_LABEL[s]}</h3></div>
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>Quantity</th><th>Symbol</th><th>Value</th><th>Notes</th></tr></thead><tbody>
            {CONSTANTS.filter((c) => c.source === s).map((c) => (
              <tr key={c.id}><td>{c.name}</td><td><Tex math={c.symbol} /></td><td className="mono">{c.printed}</td><td className="small muted">{c.note ?? ''}</td></tr>
            ))}
          </tbody></table></div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Smart formula detection ---------------- */
export function DetectPage() {
  const app = useApp();
  const [txt, setTxt] = useState('m = proton\nv = 1200 m/s\nB = 3.00 T\nθ = 90°');
  const res = useMemo(() => detectCalculations(txt), [txt]);
  return (
    <div>
      <div className="page-h"><div className="kicker">Smart Formula Detection</div><h1>What can I calculate from these values?</h1><p>Enter one quantity per line as <span className="kbd">symbol = value unit</span> (e.g. <span className="kbd">λ = 450 nm</span>, <span className="kbd">v = 0.8c</span>) or a particle (<span className="kbd">m = proton</span>). Only quantities that genuinely follow from your data are listed.</p></div>
      <div className="card">
        <textarea className="inp mono" rows={6} value={txt} onChange={(e) => setTxt(e.target.value)} aria-label="quantities" />
        <div className="examples">
          {[['λ only', 'λ = 450 nm'], ['proton in B', 'm = proton\nv = 1200 m/s\nB = 3.00 T\nθ = 90°'], ['relativity', 'v = 0.8c'], ['orbit', 'M = 6.0e24 kg\nr = 7.0e6 m'], ['photoelectric', 'λ = 400 nm\nφ = 2.3 eV']].map(([l, t]) => <button key={l} className="chip" onClick={() => setTxt(t)}>{l}</button>)}
        </div>
        {res.unmatched.length > 0 && <div className="msg warn">Could not read: {res.unmatched.join(' · ')}</div>}
        {res.particle && <div className="small muted">Particle: {res.particle.name}</div>}
      </div>
      {res.detections.length === 0 && <div className="msg info">No calculation follows from these values yet — add more quantities.</div>}
      {res.detections.map((d) => (
        <div key={d.scenario.id} className="card">
          <div className="card-h"><h3>{d.scenario.title}</h3><span className="badge mod">M{d.scenario.module} · {TOPIC_BY_ID[d.scenario.topic]?.label}</span></div>
          <div className="small muted">Uses: {d.used.map((k) => d.scenario.vars[k].name).join(', ')}</div>
          <table className="tbl"><tbody>
            {d.derived.map((x) => {
              const v = d.scenario.vars[x.key];
              return (
                <tr key={x.key}>
                  <td><Tex math={v.symbol} /></td><td className="small">{v.name}</td>
                  <td><Tex math={formatQty(v, v.magnitude ? Math.abs(x.value) : x.value, v.q === 'angle' ? '°' : siUnitOf(v), 4).latex} /></td>
                  <td><button className="btn small" onClick={() => {
                    const knowns = Object.fromEntries(Object.entries(d.result.inputs).filter(([k]) => k !== x.key));
                    const r = solveWithAssumptions(d.scenario, knowns, { target: x.key });
                    app.show({ title: `${d.scenario.title}: ${v.name}`, scenario: d.scenario, result: r, target: x.key, source: 'Smart formula detection' });
                  }}>Working</button></td>
                </tr>
              );
            })}
          </tbody></table>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Coverage matrix ---------------- */
export function CoveragePage() {
  const [mod, setMod] = useState('');
  const scnUse = useMemo(() => {
    const m: Record<string, string[]> = {};
    for (const s of SCENARIOS) for (const r of s.relations) (m[r.f] ??= []).push(s.title);
    return m;
  }, []);
  const rows = FORMULAS.filter((f) => !mod || String(f.module) === mod);
  const counts = [5, 6, 7, 8].map((m) => ({ m, n: FORMULAS.filter((f) => f.module === m).length, sheet: FORMULAS.filter((f) => f.module === m && f.onSheet).length }));
  return (
    <div>
      <div className="page-h"><div className="kicker">HSC coverage matrix</div><h1>Every relationship, variable, unit, constant and rearrangement</h1>
        <p>Generated directly from the formula database that powers the solver, so it can never drift out of date. “Unknowns” lists every variable the engine can solve for; multi-step chains come from combining these inside each calculation type.</p></div>
      <div className="card">
        <div className="row">{counts.map((c) => <span key={c.m} className="badge mod">Module {c.m}: {c.n} relationships ({c.sheet} on the formulae sheet)</span>)}<span className="badge">{SCENARIOS.length} linked calculation types</span></div>
        <div className="row" style={{ marginTop: 8 }}><select className="inp" style={{ width: 'auto' }} value={mod} onChange={(e) => setMod(e.target.value)}><option value="">All modules</option>{[5, 6, 7, 8].map((m) => <option key={m} value={m}>Module {m} — {MODULE_NAMES[m as 5]}</option>)}</select></div>
      </div>
      <div className="card"><div className="tbl-wrap" style={{ maxHeight: '75vh' }}>
        <table className="tbl">
          <thead><tr><th>Module / topic</th><th>Relationship</th><th>Variables (SI)</th><th>Constants</th><th>Unknowns solvable</th><th>Source</th><th>Used in</th></tr></thead>
          <tbody>
            {rows.map((f) => (
              <tr key={f.id}>
                <td className="small">M{f.module}<br /><span className="muted">{TOPIC_BY_ID[f.topic]?.label}</span></td>
                <td><div className="small" style={{ fontWeight: 600 }}>{f.name}</div><Tex math={f.equation} /></td>
                <td className="small">{Object.values(f.vars).filter((v) => !v.constant).map((v, i) => <div key={i}><Tex math={v.symbol} /> [<Tex math={v.q === 'angle' ? '^{\\circ}' : QUANTITIES[v.q].si && QUANTITIES[v.q].si !== '1' ? unitLatex(QUANTITIES[v.q].si) : '-'} />]</div>)}</td>
                <td className="small">{Object.values(f.vars).filter((v) => v.constant).map((v, i) => <div key={i}><Tex math={v.symbol} /></div>)}</td>
                <td className="small">{Object.keys(f.solve).map((k) => <span key={k} style={{ marginRight: 6 }}><Tex math={f.vars[k].symbol} />{normSolution(f.solve[k]).exprs.length > 1 ? '*' : ''}</span>)}</td>
                <td><SourceBadge source={f.source} />{f.onSheet ? <div className="tiny faint">on sheet</div> : null}</td>
                <td className="tiny muted">{(scnUse[f.id] ?? []).slice(0, 4).join('; ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div><div className="tiny faint">* several roots (e.g. quadratic in t, complementary angles) — the physically meaningful one is chosen and the others are reported.</div></div>
    </div>
  );
}

/* ---------------- Direction page ---------------- */
export function DirectionPage() {
  return (
    <div>
      <div className="page-h"><div className="kicker">Direction tools</div><h1>Vector and direction reasoning</h1><p>Magnitudes come from the formulas; directions come from vector rules. These tools apply the right-hand palm rule, F = qv × B, F = Il × B, F = qE, the right-hand grip rule and Lenz’s law — with negative charges handled explicitly.</p></div>
      <DirectionTool />
    </div>
  );
}

/* ---------------- About / sources ---------------- */
export function AboutPage() {
  const onSheet = FORMULAS.filter((f) => f.onSheet).length;
  return (
    <div>
      <div className="page-h"><div className="kicker">Sources &amp; method</div><h1>How this solver works</h1></div>
      <div className="card">
        <h3>Scope</h3>
        <p className="small">NSW Physics Stage 6 Syllabus (2017), Year 12 Modules 5–8: Advanced Mechanics, Electromagnetism, The Nature of Light, From the Universe to the Atom. Year 11 relationships that Year 12 questions rely on (e.g. V = IR, P = VI, K = ½mv², Coulomb’s law, Snell’s law) are included and labelled “Year 11”. Formulas that are useful but NOT required HSC content (e.g. Stefan–Boltzmann, Hubble’s law, relativistic kinetic energy, peak generator emf) are labelled “Extension” and are never presented as required.</p>
        <h3 style={{ marginTop: 10 }}>Source classification</h3>
        <ul className="small">
          <li><SourceBadge source="NESA_FORMULA_SHEET" /> printed on the NESA Physics formulae sheet used in HSC examinations from 2019 ({onSheet} relationships).</li>
          <li><SourceBadge source="SYLLABUS" /> named in the syllabus content but not printed on the sheet (e.g. E = −GMm/2r, W = qEd, φ = hf₀, A = λN).</li>
          <li><SourceBadge source="DERIVED" /> obtained by combining sheet/syllabus relationships — shown with the derivation (e.g. v = √(GM/r), r = mv/qB, v = E/B).</li>
          <li><SourceBadge source="HSC_EXAM_APPLICATION" /> combinations repeatedly required in HSC questions (banked tracks, stopping voltage, back emf, photons per second).</li>
          <li><SourceBadge source="YEAR11_PREREQUISITE" /> Year 11 content printed on the sheet and used in Year 12 problems.</li>
          <li><SourceBadge source="EXTENSION" /> not required.</li>
        </ul>
        <h3 style={{ marginTop: 10 }}>Official materials this is built around</h3>
        <ul className="small">
          <li>NESA Physics Stage 6 Syllabus (2017) — module content and inquiry questions.</li>
          <li>NESA Physics formulae sheet, data sheet and periodic table (HSC examinations from 2019) — every data-sheet constant is used at its printed precision.</li>
          <li>NESA HSC Physics examination papers and marking guidelines (2019 onwards), and NESA sample/additional sample questions — used to decide which combinations and conventions (e.g. 931.5 MeV/u vs Δmc², 24 h geostationary period, magnitudes for Faraday’s law) the solver must support.</li>
        </ul>
        <div className="msg warn small">Transparency note: the build environment could not download the NESA PDFs (network policy), so the formula and constant lists were compiled from the content of those official documents as known at build time. Verify against your printed data sheet — the values are displayed on the Constants page exactly as used.</div>
        <h3 style={{ marginTop: 10 }}>Deterministic engine</h3>
        <ul className="small">
          <li>Every formula is stored with explicit rearrangements for each variable. Each rearrangement is automatically checked by (1) dimensional analysis and (2) numerical round-trip tests in the automated test suite.</li>
          <li>Multi-step problems are solved by chaining relationships inside a “calculation type” (e.g. F = qvB → F = ma → a). Intermediate values keep full precision; only the final answer is rounded.</li>
          <li>The free-text solver is rule-based (no paid API): it extracts numbers and units, matches them to variables using the surrounding words, identifies what is asked, and reports anything missing instead of guessing.</li>
          <li>Physical validation rejects impossible inputs and results: v ≥ c, negative masses/temperatures, sin θ &gt; 1, photon energy below the work function, efficiencies above 100%, non-integer quantum numbers, amounts that grow during decay, and more.</li>
        </ul>
      </div>
    </div>
  );
}
