import { useMemo, useState } from 'react';
import { Tex } from '../components/Tex';
import { NumInput, num } from '../components/NumInput';
import { NUCLIDES, REF_MASS_U, findNuclide } from '../../data/nuclides';
import { elementSymbol, elementName, elementZ } from '../../data/elements';
import { CONST } from '../../data/constants';
import { formatSig } from '../../engine/numbers';
import { useApp } from '../state';

const u = CONST.u.value, c = CONST.c.value, e = CONST.e.value;
const MeV = 1e6 * e;
const L = (x: number, n = 4) => formatSig(x, n).latex;
const T = (x: number, n = 4) => formatSig(x, n).text;
const nucLatex = (Z: number, A: number, sym?: string) => `{}^{${A}}_{${Z}}\\mathrm{${sym ?? elementSymbol(Z)}}`;

/* ---------------- Binding energy ---------------- */
export function BindingTool() {
  const [pick, setPick] = useState('2-4');
  const [Zs, setZs] = useState('2');
  const [As, setAs] = useState('4');
  const [massS, setMassS] = useState('4.001506');
  const [massType, setMassType] = useState<'nuclear' | 'atomic'>('nuclear');
  const [src, setSrc] = useState<'sheet' | 'ref' | 'custom'>('ref');
  const [mpS, setMpS] = useState('1.007276');
  const [mnS, setMnS] = useState('1.008665');
  const app = useApp();

  const choose = (v: string) => {
    setPick(v);
    if (v === 'custom') return;
    const [Z, A] = v.split('-').map(Number);
    const n = findNuclide(Z, A);
    setZs(String(Z)); setAs(String(A));
    if (n) { setMassS(String(n.mass)); setMassType('atomic'); }
  };

  const r = useMemo(() => {
    const Z = num(Zs), A = num(As), m = num(massS);
    if (!(Z >= 1 && A >= Z && m > 0)) return null;
    const N = A - Z;
    const meU = CONST.me.value / u;
    const mp = src === 'sheet' ? CONST.mp.value / u : src === 'ref' ? REF_MASS_U.proton : num(mpS);
    const mn = src === 'sheet' ? CONST.mn.value / u : src === 'ref' ? REF_MASS_U.neutron : num(mnS);
    const mNuc = massType === 'atomic' ? m - Z * meU : m;
    const dmU = Z * mp + N * mn - mNuc;
    const dmKg = dmU * u;
    const EJ = dmKg * c * c;
    const EMeVc2 = EJ / MeV;
    const EMeV931 = dmU * 931.5;
    return { Z, A, N, m, mp, mn, meU, mNuc, dmU, dmKg, EJ, EMeVc2, EMeV931, per: EMeV931 / A };
  }, [Zs, As, massS, massType, src, mpS, mnS]);

  const show = () => {
    if (!r) return;
    app.showCustom('Binding energy', (
      <div className="sol">
        <h2>Binding energy of <Tex math={nucLatex(r.Z, r.A)} /></h2>
        <div className="sec"><div className="sec-t">Given</div>
          <Tex block math={`Z = ${r.Z},\\ N = A - Z = ${r.A} - ${r.Z} = ${r.N}`} />
          <Tex block math={`m_{\\text{${massType}}} = ${r.m}\\ \\mathrm{u}`} />
          <div className="small">Nucleon masses ({src === 'sheet' ? 'NESA data sheet, converted to u' : src === 'ref' ? 'reference values in u (not on the data sheet)' : 'values from the question'}): <Tex math={`m_p = ${L(r.mp, 7)}\\ \\mathrm{u},\\ m_n = ${L(r.mn, 7)}\\ \\mathrm{u}`} /></div>
        </div>
        {massType === 'atomic' && <div className="sec"><div className="sec-t">Atomic → nuclear mass</div><Tex block math={`m_{\\text{nucleus}} = m_{\\text{atom}} - Zm_e = ${r.m} - ${r.Z}(${L(r.meU, 4)}) = ${L(r.mNuc, 7)}\\ \\mathrm{u}`} /></div>}
        <div className="sec"><div className="sec-t">Step 1: mass defect</div>
          <Tex block math={`\\Delta m = Zm_p + Nm_n - m_{\\text{nucleus}}`} />
          <Tex block math={`= ${r.Z}(${L(r.mp, 7)}) + ${r.N}(${L(r.mn, 7)}) - ${L(r.mNuc, 7)} = ${L(r.dmU, 5)}\\ \\mathrm{u}`} />
          <Tex block math={`= ${L(r.dmU, 5)} \\times 1.661\\times10^{-27} = ${L(r.dmKg, 4)}\\ \\mathrm{kg}`} />
        </div>
        <div className="sec"><div className="sec-t">Step 2: binding energy</div>
          <div className="small">Method A (E = Δmc²):</div>
          <Tex block math={`E_B = \\Delta m c^2 = (${L(r.dmKg, 4)})(3.00\\times10^{8})^2 = ${L(r.EJ, 4)}\\ \\mathrm{J} = ${L(r.EMeVc2, 4)}\\ \\mathrm{MeV}`} />
          <div className="small">Method B (data sheet 1 u = 931.5 MeV/c²):</div>
          <Tex block math={`E_B = ${L(r.dmU, 5)}\\ \\mathrm{u} \\times 931.5\\ \\mathrm{MeV\\,u^{-1}} = ${L(r.EMeV931, 4)}\\ \\mathrm{MeV}`} />
        </div>
        <div className="sec"><div className="sec-t">Step 3: per nucleon</div>
          <Tex block math={`\\frac{E_B}{A} = \\frac{${L(r.EMeV931, 4)}}{${r.A}} = ${L(r.per, 4)}\\ \\mathrm{MeV\\ per\\ nucleon}`} />
        </div>
        <div className="answer"><div className="lab">Answer</div><div className="big"><Tex math={`E_B = ${L(r.EMeV931, 3)}\\ \\mathrm{MeV}\\ (${L(r.EJ, 3)}\\ \\mathrm{J})`} /></div><div className="small">{T(r.per, 3)} MeV per nucleon</div></div>
        {src === 'sheet' && <div className="msg warn">Data-sheet nucleon masses have only 4 significant figures. Because the mass defect is a small difference of large numbers, this can change E_B noticeably — use masses given in the question where available.</div>}
      </div>
    ));
  };

  return (
    <div className="card">
      <div className="card-h"><h3>Binding energy calculator</h3><span className="badge">nuclear</span></div>
      <div className="row">
        <div><label className="lbl">Nuclide (reference atomic masses)</label>
          <select className="inp" value={pick} onChange={(ev) => choose(ev.target.value)}>
            <option value="custom">custom…</option>
            {NUCLIDES.filter((n) => n.Z > 0).map((n) => <option key={`${n.Z}-${n.A}`} value={`${n.Z}-${n.A}`}>{elementName(n.Z)}-{n.A}</option>)}
          </select>
        </div>
        <NumInput label="Z" value={Zs} onChange={(v) => { setZs(v); setPick('custom'); }} width={60} />
        <NumInput label="A" value={As} onChange={(v) => { setAs(v); setPick('custom'); }} width={60} />
        <NumInput label="mass" unit="u" value={massS} onChange={(v) => { setMassS(v); setPick('custom'); }} width={130} />
        <div><label className="lbl">mass is</label><div className="seg"><button className={massType === 'nuclear' ? 'on' : ''} onClick={() => setMassType('nuclear')}>nuclear</button><button className={massType === 'atomic' ? 'on' : ''} onClick={() => setMassType('atomic')}>atomic</button></div></div>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <div><label className="lbl">Proton / neutron masses</label><div className="seg">
          <button className={src === 'ref' ? 'on' : ''} onClick={() => setSrc('ref')}>reference (u)</button>
          <button className={src === 'sheet' ? 'on' : ''} onClick={() => setSrc('sheet')}>data sheet (kg)</button>
          <button className={src === 'custom' ? 'on' : ''} onClick={() => setSrc('custom')}>from question</button>
        </div></div>
        {src === 'custom' && <><NumInput label="mₚ" unit="u" value={mpS} onChange={setMpS} /><NumInput label="mₙ" unit="u" value={mnS} onChange={setMnS} /></>}
      </div>
      {r ? (
        <div className="row" style={{ marginTop: 10, justifyContent: 'space-between' }}>
          <div className="small"><Tex math={`\\Delta m = ${L(r.dmU, 5)}\\ \\mathrm{u};\\ E_B = ${L(r.EMeV931, 4)}\\ \\mathrm{MeV}\\ (931.5\\text{ method}),\\ ${L(r.EMeVc2, 4)}\\ \\mathrm{MeV}\\ (\\Delta mc^2);\\ E_B/A = ${L(r.per, 4)}\\ \\mathrm{MeV}`} /></div>
          <button className="btn small primary" onClick={show}>Show working</button>
        </div>
      ) : <div className="msg err">Enter Z ≥ 1, A ≥ Z and a positive mass.</div>}
      <div className="tiny faint" style={{ marginTop: 6 }}>Reference atomic masses: AME2020 (rounded). Not on the NESA data sheet — HSC questions give the masses to use.</div>
    </div>
  );
}

/* ---------------- Reaction energy ---------------- */
interface Item { key: string; count: string; mass: string }
const PARTICLES: Record<string, { label: string; Z: number; A: number; mass: number; latex: string }> = {
  n: { label: 'neutron', Z: 0, A: 1, mass: 1.008665, latex: '{}^{1}_{0}\\mathrm{n}' },
  p: { label: 'proton', Z: 1, A: 1, mass: 1.007276, latex: '{}^{1}_{1}\\mathrm{p}' },
  alpha: { label: 'alpha (He-4 nucleus)', Z: 2, A: 4, mass: 4.001506, latex: '{}^{4}_{2}\\alpha' },
  em: { label: 'electron / β⁻', Z: -1, A: 0, mass: 0.000549, latex: '{}^{0}_{-1}\\mathrm{e}' },
  ep: { label: 'positron / β⁺', Z: 1, A: 0, mass: 0.000549, latex: '{}^{0}_{+1}\\mathrm{e}' },
  gamma: { label: 'gamma photon', Z: 0, A: 0, mass: 0, latex: '\\gamma' },
};
const itemInfo = (key: string) => {
  if (PARTICLES[key]) return PARTICLES[key];
  const [Z, A] = key.split('-').map(Number);
  const n = findNuclide(Z, A);
  return { label: `${elementName(Z)}-${A} (atom)`, Z, A, mass: n?.mass ?? NaN, latex: nucLatex(Z, A) };
};

export function ReactionTool() {
  const [lhs, setLhs] = useState<Item[]>([{ key: '92-235', count: '1', mass: '235.043930' }, { key: 'n', count: '1', mass: '1.008665' }]);
  const [rhs, setRhs] = useState<Item[]>([{ key: '56-141', count: '1', mass: '140.914403' }, { key: '36-92', count: '1', mass: '91.926173' }, { key: 'n', count: '3', mass: '1.008665' }]);
  const app = useApp();
  const options = [...Object.keys(PARTICLES), ...NUCLIDES.filter((n) => n.Z > 0).map((n) => `${n.Z}-${n.A}`)];
  const sum = (items: Item[]) => items.reduce((acc, it) => {
    const inf = itemInfo(it.key);
    const k = num(it.count, 1);
    return { m: acc.m + k * num(it.mass), A: acc.A + k * inf.A, Z: acc.Z + k * inf.Z };
  }, { m: 0, A: 0, Z: 0 });
  const L0 = sum(lhs), R0 = sum(rhs);
  const dmU = L0.m - R0.m;
  const E931 = dmU * 931.5;
  const EJ = dmU * u * c * c;
  const eq = (items: Item[]) => items.map((it) => `${num(it.count, 1) !== 1 ? num(it.count, 1) : ''}${itemInfo(it.key).latex}`).join(' + ');
  const ok = Number.isFinite(dmU);
  const edit = (side: 'l' | 'r', i: number, p: Partial<Item>) => (side === 'l' ? setLhs : setRhs)((xs) => xs.map((x, j) => {
    if (j !== i) return x;
    const nx = { ...x, ...p };
    if (p.key) nx.mass = String(itemInfo(p.key).mass);
    return nx;
  }));
  const show = () => app.showCustom('Nuclear reaction energy', (
    <div className="sol">
      <h2>Energy released in a nuclear reaction</h2>
      <Tex block math={`${eq(lhs)} \\to ${eq(rhs)}`} />
      <div className="sec"><div className="sec-t">Conservation check</div>
        <div className="small">Mass number: {L0.A} → {R0.A} {L0.A === R0.A ? '✓' : '✗ NOT balanced'}; charge (Z): {L0.Z} → {R0.Z} {L0.Z === R0.Z ? '✓' : '✗ NOT balanced'}</div></div>
      <div className="sec"><div className="sec-t">Mass defect</div>
        <Tex block math={`\\Delta m = m_{\\text{reactants}} - m_{\\text{products}} = ${L(L0.m, 8)} - ${L(R0.m, 8)} = ${L(dmU, 5)}\\ \\mathrm{u}`} /></div>
      <div className="sec"><div className="sec-t">Energy</div>
        <Tex block math={`E = ${L(dmU, 5)}\\ \\mathrm{u} \\times 931.5\\ \\mathrm{MeV\\,u^{-1}} = ${L(E931, 4)}\\ \\mathrm{MeV}`} />
        <Tex block math={`E = \\Delta m c^2 = (${L(dmU * u, 4)}\\ \\mathrm{kg})(3.00\\times10^8)^2 = ${L(EJ, 4)}\\ \\mathrm{J}`} /></div>
      <div className="answer"><div className="lab">Answer</div><div className="big"><Tex math={`E = ${L(E931, 3)}\\ \\mathrm{MeV}`} /></div><div className="small">{dmU > 0 ? 'Energy is RELEASED (products lighter than reactants).' : 'Energy must be SUPPLIED (products heavier).'}</div></div>
      <div className="tiny muted">Using atomic masses for all nuclei means the electron masses cancel when charge (Z) balances; for β⁺ decay two electron masses must be accounted for.</div>
    </div>
  ));
  const side = (items: Item[], s: 'l' | 'r') => (
    <div style={{ flex: '1 1 300px' }}>
      <div className="small muted" style={{ marginBottom: 4 }}>{s === 'l' ? 'Reactants' : 'Products'}</div>
      {items.map((it, i) => (
        <div key={i} className="row" style={{ marginBottom: 5 }}>
          <input className="inp mono" style={{ width: 44 }} value={it.count} onChange={(ev) => edit(s, i, { count: ev.target.value })} aria-label="count" />
          <span className="small muted">×</span>
          <select className="inp" style={{ width: 170 }} value={it.key} onChange={(ev) => edit(s, i, { key: ev.target.value })}>{options.map((o) => <option key={o} value={o}>{itemInfo(o).label}</option>)}</select>
          <input className="inp mono" style={{ width: 110 }} value={it.mass} onChange={(ev) => edit(s, i, { mass: ev.target.value })} aria-label="mass in u" />
          <span className="small muted">u</span>
          <button className="btn small ghost" onClick={() => (s === 'l' ? setLhs : setRhs)((xs) => xs.filter((_, j) => j !== i))}>✕</button>
        </div>
      ))}
      <button className="btn small" onClick={() => (s === 'l' ? setLhs : setRhs)((xs) => [...xs, { key: 'n', count: '1', mass: '1.008665' }])}>+ add</button>
    </div>
  );
  return (
    <div className="card">
      <div className="card-h"><h3>Reaction energy (fission, fusion, decay)</h3><span className="badge">E = Δmc²</span></div>
      <p className="small muted">Pick particles/nuclides (reference masses auto-fill) or type the masses given in the question.</p>
      <div className="row" style={{ alignItems: 'flex-start' }}>{side(lhs, 'l')}{side(rhs, 'r')}</div>
      <div style={{ marginTop: 8 }}><Tex block math={`${eq(lhs)} \\to ${eq(rhs)}`} /></div>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <div className="small">A: {L0.A} → {R0.A} {L0.A === R0.A ? '✓' : '✗'} · Z: {L0.Z} → {R0.Z} {L0.Z === R0.Z ? '✓' : '✗'} {ok && <> · Δm = {T(dmU, 5)} u → <strong>{T(E931, 4)} MeV</strong></>}</div>
        <button className="btn small primary" onClick={show} disabled={!ok}>Show working</button>
      </div>
    </div>
  );
}

/* ---------------- Decay equations ---------------- */
export function DecayEquationTool() {
  const [parent, setParent] = useState('uranium');
  const [As, setAs] = useState('238');
  const [type, setType] = useState<'alpha' | 'beta-' | 'beta+' | 'gamma'>('alpha');
  const Z = elementZ(parent) ?? (Number.isFinite(num(parent)) ? num(parent) : null);
  const A = num(As);
  const valid = Z !== null && Z >= 1 && Z <= 118 && A >= Z;
  let eq = '', dZ = 0, dA = 0, note = '';
  if (valid) {
    const P = nucLatex(Z!, A);
    if (type === 'alpha') { dZ = Z! - 2; dA = A - 4; eq = `${P} \\to ${nucLatex(dZ, dA)} + {}^{4}_{2}\\mathrm{He}`; note = 'Alpha decay: A decreases by 4, Z decreases by 2.'; }
    if (type === 'beta-') { dZ = Z! + 1; dA = A; eq = `${P} \\to ${nucLatex(dZ, dA)} + {}^{0}_{-1}\\mathrm{e} + \\bar{\\nu}_e`; note = 'β⁻ decay: a neutron becomes a proton (n → p + e⁻ + ν̄ₑ); Z increases by 1, A unchanged.'; }
    if (type === 'beta+') { dZ = Z! - 1; dA = A; eq = `${P} \\to ${nucLatex(dZ, dA)} + {}^{0}_{+1}\\mathrm{e} + \\nu_e`; note = 'β⁺ decay: a proton becomes a neutron (p → n + e⁺ + νₑ); Z decreases by 1, A unchanged.'; }
    if (type === 'gamma') { dZ = Z!; dA = A; eq = `{}^{${A}}_{${Z}}\\mathrm{${elementSymbol(Z!)}}^{*} \\to ${nucLatex(dZ, dA)} + \\gamma`; note = 'Gamma emission: the nucleus drops from an excited state; A and Z unchanged.'; }
  }
  const mP = valid ? findNuclide(Z!, A)?.mass : undefined;
  const mD = valid ? findNuclide(dZ, dA)?.mass : undefined;
  let Q: number | null = null;
  if (mP !== undefined && mD !== undefined) {
    if (type === 'alpha') Q = (mP - mD - 4.002603) * 931.5;
    if (type === 'beta-') Q = (mP - mD) * 931.5;
    if (type === 'beta+') Q = (mP - mD - 2 * 0.000549) * 931.5;
  }
  return (
    <div className="card">
      <div className="card-h"><h3>Balancing nuclear decay equations</h3><span className="badge">A &amp; Z conservation</span></div>
      <div className="row">
        <div><label className="lbl">Parent (element name, symbol or Z)</label><input className="inp" value={parent} onChange={(ev) => setParent(ev.target.value)} style={{ width: 160 }} /></div>
        <NumInput label="Mass number A" value={As} onChange={setAs} width={90} />
        <div><label className="lbl">Decay</label><div className="seg">{(['alpha', 'beta-', 'beta+', 'gamma'] as const).map((t) => <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>{t === 'alpha' ? 'α' : t === 'beta-' ? 'β⁻' : t === 'beta+' ? 'β⁺' : 'γ'}</button>)}</div></div>
      </div>
      {valid ? (
        <div style={{ marginTop: 10 }}>
          <Tex block math={eq} />
          <div className="small">{note} Daughter: <strong>{elementName(dZ)}-{dA}</strong>.</div>
          <div className="small muted">Check: top numbers {type === 'alpha' ? `${A} = ${dA} + 4` : `${A} = ${dA} + 0`} ✓; bottom numbers {type === 'alpha' ? `${Z} = ${dZ} + 2` : type === 'beta-' ? `${Z} = ${dZ} + (−1)` : type === 'beta+' ? `${Z} = ${dZ} + 1` : `${Z} = ${dZ}`} ✓</div>
          {Q !== null && <div className="small">Energy released (reference atomic masses): Q ≈ <strong>{T(Q, 3)} MeV</strong>{Q < 0 ? ' — negative: this decay is not energetically possible.' : ''}</div>}
        </div>
      ) : <div className="msg err">Unknown element or invalid mass number.</div>}
    </div>
  );
}
