import { useMemo, useState } from 'react';
import { Graph, sample, COLORS } from '../components/Graph';
import { NumInput, num } from '../components/NumInput';
import { Tex } from '../components/Tex';
import { formatSig } from '../../engine/numbers';
import { CONST } from '../../data/constants';
import { useApp } from '../state';

const c = CONST.c.value, h = CONST.h.value, e = CONST.e.value, R = CONST.R.value;
const L = (x: number, n = 3) => formatSig(x, n).latex;
const T = (x: number, n = 3) => formatSig(x, n).text;

/* ---------------- Photoelectric ---------------- */
export function PhotoelectricTool() {
  const [phis, setPhis] = useState('2.28, 4.3');
  const [data, setData] = useState('6.0e14, 0.20\n7.0e14, 0.62\n8.0e14, 1.03\n9.0e14, 1.44');
  const [yKind, setYKind] = useState<'K' | 'Vs'>('Vs');
  const app = useApp();
  const pv = phis.split(/[,\s]+/).map(Number).filter((x) => x > 0).slice(0, 4);
  const fit = useMemo(() => {
    const pts = data.split('\n').map((l) => l.split(/[,\s\t]+/).map((x) => num(x))).filter((p) => p.length >= 2 && p.every(Number.isFinite)) as number[][];
    if (pts.length < 2) return null;
    const n = pts.length;
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => (yKind === 'Vs' ? p[1] * e : p[1] * e)); // both entered in V or eV → J
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const sxx = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
    const sxy = xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0);
    if (sxx === 0) return null;
    const slope = sxy / sxx;
    const icpt = my - slope * mx;
    const f0 = -icpt / slope;
    return { pts, xs, ys, slope, icpt, f0, phi: -icpt };
  }, [data, yKind]);
  const fmax = 1.6e15;
  const showFit = () => {
    if (!fit) return;
    app.showCustom('Photoelectric data: finding h and φ', (
      <div className="sol">
        <h2>Photoelectric effect from experimental data</h2>
        <div className="sec"><div className="sec-t">Model</div>
          <Tex block math="K_{\max} = hf - \phi \quad (y = mx + c)" />
          <div className="small">Plot K_max (= qV_s) against f. Gradient = h, vertical intercept = −φ, horizontal intercept = f₀.</div></div>
        <div className="sec"><div className="sec-t">Least-squares line of best fit ({fit.pts.length} points)</div>
          <Tex block math={`\\text{gradient} = ${L(fit.slope, 4)}\\ \\mathrm{J\\,s} \\;\\Rightarrow\\; h \\approx ${L(fit.slope, 3)}\\ \\mathrm{J\\,s}`} />
          <Tex block math={`y\\text{-intercept} = ${L(fit.icpt, 4)}\\ \\mathrm{J} \\;\\Rightarrow\\; \\phi = ${L(fit.phi, 3)}\\ \\mathrm{J} = ${L(fit.phi / e, 3)}\\ \\mathrm{eV}`} />
          <Tex block math={`f_0 = \\frac{\\phi}{h} = ${L(fit.f0, 3)}\\ \\mathrm{Hz}`} />
          <div className="small muted">Accepted h = 6.626 × 10⁻³⁴ J s (data sheet): percentage difference {T(Math.abs(fit.slope - h) / h * 100, 2)}%.</div>
        </div>
      </div>
    ));
  };
  return (
    <div className="card">
      <div className="card-h"><h3>K_max against frequency</h3><span className="badge">graph + data</span></div>
      <p className="small muted">Every metal gives a straight line of gradient h; the intercepts give the threshold frequency f₀ and −φ. Below f₀ no electrons are emitted.</p>
      <div className="row"><div style={{ flex: 1 }}><label className="lbl">Work functions to plot (eV, comma separated)</label><input className="inp mono" value={phis} onChange={(ev) => setPhis(ev.target.value)} /></div></div>
      <Graph xLabel="frequency f (× 10¹⁴ Hz)" yLabel="K_max (eV)" xMin={0} xMax={fmax / 1e14}
        series={[
          ...pv.map((p, i) => ({ label: `φ = ${p} eV (f₀ = ${T((p * e) / h / 1e14)} × 10¹⁴ Hz)`, color: COLORS[i], points: sample((f) => (h * f * 1e14 - p * e) / e, (p * e) / h / 1e14, fmax / 1e14, 60) })),
          ...(fit ? [{ label: 'your data (best fit)', color: COLORS[4], dashed: true, points: sample((f) => (fit.slope * f * 1e14 + fit.icpt) / e, Math.max(0, fit.f0 / 1e14), fmax / 1e14, 40) }] : []),
        ]}
        markers={fit ? fit.pts.map((p) => ({ x: p[0] / 1e14, y: p[1], color: COLORS[4] })) : []}
        yMin={0}
      />
      <div className="hr" />
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 260px' }}>
          <label className="lbl">Experimental data: f (Hz), {yKind === 'Vs' ? 'stopping voltage V_s (V)' : 'K_max (eV)'} — one pair per line</label>
          <textarea className="inp mono" rows={5} value={data} onChange={(ev) => setData(ev.target.value)} />
        </div>
        <div>
          <label className="lbl">Second column is</label>
          <div className="seg"><button className={yKind === 'Vs' ? 'on' : ''} onClick={() => setYKind('Vs')}>V_s (V)</button><button className={yKind === 'K' ? 'on' : ''} onClick={() => setYKind('K')}>K_max (eV)</button></div>
          {fit && <div className="small" style={{ marginTop: 8 }}>h ≈ {T(fit.slope)} J s<br />φ ≈ {T(fit.phi / e)} eV<br />f₀ ≈ {T(fit.f0)} Hz</div>}
          <button className="btn small primary" style={{ marginTop: 8 }} onClick={showFit} disabled={!fit}>Show working</button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- EM spectrum classifier ---------------- */
const BANDS: Array<[string, number, number]> = [
  ['gamma rays', 0, 1e-11], ['X-rays', 1e-11, 1e-8], ['ultraviolet', 1e-8, 4e-7], ['visible light', 4e-7, 7e-7], ['infrared', 7e-7, 1e-3], ['microwaves', 1e-3, 0.3], ['radio waves', 0.3, Infinity],
];
function visibleColour(nm: number): string {
  if (nm < 450) return 'violet';
  if (nm < 495) return 'blue';
  if (nm < 570) return 'green';
  if (nm < 590) return 'yellow';
  if (nm < 620) return 'orange';
  return 'red';
}

export function SpectrumTool() {
  const [val, setVal] = useState('500');
  const [kind, setKind] = useState<'nm' | 'Hz' | 'eV'>('nm');
  const x = num(val);
  const lam = !(x > 0) ? NaN : kind === 'nm' ? x * 1e-9 : kind === 'Hz' ? c / x : (h * c) / (x * e);
  const ok = lam > 0 && Number.isFinite(lam);
  const f = c / lam, E = (h * c) / lam;
  const band = ok ? BANDS.find(([, a, b2]) => lam >= a && lam < b2) : null;
  return (
    <div className="card">
      <div className="card-h"><h3>Electromagnetic spectrum: λ ↔ f ↔ E</h3><span className="badge">converter</span></div>
      <div className="row">
        <NumInput label="value" value={val} onChange={setVal} width={140} />
        <div><label className="lbl">given as</label><div className="seg">{(['nm', 'Hz', 'eV'] as const).map((k) => <button key={k} className={kind === k ? 'on' : ''} onClick={() => setKind(k)}>{k === 'nm' ? 'wavelength (nm)' : k === 'Hz' ? 'frequency (Hz)' : 'photon energy (eV)'}</button>)}</div></div>
      </div>
      {ok && (
        <div className="kv" style={{ marginTop: 10 }}>
          <span className="muted small">wavelength</span><Tex math={`\\lambda = ${L(lam)}\\ \\mathrm{m} = ${L(lam * 1e9)}\\ \\mathrm{nm}`} />
          <span className="muted small">frequency</span><Tex math={`f = c/\\lambda = ${L(f)}\\ \\mathrm{Hz}`} />
          <span className="muted small">photon energy</span><Tex math={`E = hf = ${L(E)}\\ \\mathrm{J} = ${L(E / e)}\\ \\mathrm{eV}`} />
          <span className="muted small">region</span><strong>{band?.[0]}{band?.[0] === 'visible light' ? ` (${visibleColour(lam * 1e9)})` : ''}</strong>
        </div>
      )}
      {!ok && <div className="msg err">Enter a positive value.</div>}
      <svg viewBox="0 0 600 34" style={{ width: '100%', marginTop: 10 }} role="img" aria-label="electromagnetic spectrum">
        {BANDS.map(([name], i) => (
          <g key={name}>
            <rect x={i * (600 / 7)} y={0} width={600 / 7 - 2} height={20} rx={3} fill={band?.[0] === name ? 'var(--answer)' : 'var(--panel-2)'} stroke="var(--line-2)" />
            <text x={i * (600 / 7) + 600 / 14} y={14} textAnchor="middle" fontSize="9.5" fill={band?.[0] === name ? '#111' : 'var(--muted)'}>{name}</text>
          </g>
        ))}
        <text x={0} y={32} fontSize="9" fill="var(--faint)">short λ, high f, high E</text>
        <text x={600} y={32} fontSize="9" fill="var(--faint)" textAnchor="end">long λ, low f, low E</text>
      </svg>
    </div>
  );
}

/* ---------------- Hydrogen energy levels ---------------- */
export function HydrogenLevels() {
  const [ni, setNi] = useState(3);
  const [nf, setNf] = useState(2);
  const levels = [1, 2, 3, 4, 5, 6];
  const E = (n: number) => -13.6 / (n * n);
  const valid = ni !== nf;
  const hi = Math.max(ni, nf), lo = Math.min(ni, nf);
  const lam = valid ? 1 / (R * (1 / lo ** 2 - 1 / hi ** 2)) : NaN;
  const Eph = valid ? (h * c) / lam : NaN;
  const y = (n: number) => 20 + (E(n) / -13.6) * 240;
  const series = lo === 1 ? 'Lyman (UV)' : lo === 2 ? 'Balmer (visible/near-UV)' : lo === 3 ? 'Paschen (IR)' : lo === 4 ? 'Brackett (IR)' : 'Pfund (IR)';
  return (
    <div className="card">
      <div className="card-h"><h3>Hydrogen energy levels &amp; transitions</h3><span className="badge">Bohr / Rydberg</span></div>
      <p className="small muted">Levels <Tex math="E_n = -13.6/n^2\ \mathrm{eV}" />; wavelength from the Rydberg equation (data sheet R = 1.097 × 10⁷ m⁻¹). Click levels to choose a transition.</p>
      <div className="grid2">
        <svg viewBox="0 0 300 280" style={{ maxWidth: 320 }} role="img" aria-label="hydrogen energy levels">
          {levels.map((n) => (
            <g key={n} style={{ cursor: 'pointer' }} onClick={() => (n > nf ? setNi(n) : setNf(n))}>
              <line x1={40} x2={240} y1={y(n)} y2={y(n)} stroke={n === ni || n === nf ? 'var(--accent)' : 'var(--line-2)'} strokeWidth={n === ni || n === nf ? 2.5 : 1.5} />
              <text x={30} y={y(n) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">n={n}</text>
              <text x={248} y={y(n) + 4} fontSize="10" fill="var(--muted)">{E(n).toFixed(2)} eV</text>
            </g>
          ))}
          <line x1={40} x2={240} y1={y(100)} y2={y(100)} stroke="var(--line-2)" strokeDasharray="4 4" />
          <text x={248} y={y(100) + 4} fontSize="10" fill="var(--muted)">0 eV (ionised)</text>
          {valid && <g stroke="var(--answer)" fill="var(--answer)" strokeWidth={2.5}><line x1={140} x2={140} y1={y(ni)} y2={y(nf) + (ni > nf ? -8 : 8)} /><polygon points={`140,${y(nf)} 134,${y(nf) + (ni > nf ? -10 : 10)} 146,${y(nf) + (ni > nf ? -10 : 10)}`} /></g>}
        </svg>
        <div>
          <div className="row">
            <div><label className="lbl">from nᵢ</label><select className="inp" value={ni} onChange={(ev) => setNi(Number(ev.target.value))}>{[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n}>{n}</option>)}</select></div>
            <div><label className="lbl">to n_f</label><select className="inp" value={nf} onChange={(ev) => setNf(Number(ev.target.value))}>{[1, 2, 3, 4, 5, 6, 7].map((n) => <option key={n}>{n}</option>)}</select></div>
          </div>
          {valid ? (
            <div style={{ marginTop: 8 }}>
              <div className="small">{ni > nf ? 'Emission' : 'Absorption'} — {series} series</div>
              <Tex block math={`\\frac{1}{\\lambda} = R\\left(\\frac{1}{${lo}^2} - \\frac{1}{${hi}^2}\\right) \\Rightarrow \\lambda = ${L(lam * 1e9, 4)}\\ \\mathrm{nm}`} />
              <Tex block math={`E = \\frac{hc}{\\lambda} = ${L(Eph, 4)}\\ \\mathrm{J} = ${L(Eph / e, 4)}\\ \\mathrm{eV}`} />
              <Tex block math={`f = \\frac{c}{\\lambda} = ${L(c / lam, 4)}\\ \\mathrm{Hz}`} />
              <div className="tiny muted">Bohr-level check: |E_{hi} − E_{lo}| = {(E(hi) - E(lo)).toFixed(3)} eV (13.6 eV model; small differences come from rounded constants).</div>
            </div>
          ) : <div className="msg warn">Choose two different levels.</div>}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Fringes / grating orders ---------------- */
export function FringeTool() {
  const [lam, setLam] = useState('550');
  const [N, setN] = useState('600');
  const [Ld, setLd] = useState('1.0');
  const [mode, setMode] = useState<'grating' | 'slits'>('grating');
  const [dmm, setDmm] = useState('0.25');
  const l = num(lam) * 1e-9;
  const d = mode === 'grating' ? 1e-3 / num(N) : num(dmm) * 1e-3;
  const Lv = num(Ld);
  const ok = l > 0 && d > 0 && Lv > 0;
  const mmax = ok ? Math.floor(d / l + 1e-12) : 0;
  const rows = ok ? Array.from({ length: Math.min(mmax, 8) + 1 }, (_, m) => {
    const s = (m * l) / d;
    const th = Math.asin(Math.min(1, s));
    return { m, th: (th * 180) / Math.PI, y: Lv * Math.tan(th), ysmall: (m * l * Lv) / d };
  }) : [];
  return (
    <div className="card">
      <div className="card-h"><h3>Orders, angles and fringe positions</h3><span className="badge">interference</span></div>
      <div className="row">
        <div><label className="lbl">Source</label><div className="seg"><button className={mode === 'grating' ? 'on' : ''} onClick={() => setMode('grating')}>grating</button><button className={mode === 'slits' ? 'on' : ''} onClick={() => setMode('slits')}>double slit</button></div></div>
        <NumInput label="λ" unit="nm" value={lam} onChange={setLam} />
        {mode === 'grating' ? <NumInput label="lines per mm" value={N} onChange={setN} /> : <NumInput label="slit separation d" unit="mm" value={dmm} onChange={setDmm} />}
        <NumInput label="screen distance L" unit="m" value={Ld} onChange={setLd} />
      </div>
      {ok && (
        <>
          <div className="small" style={{ margin: '8px 0' }}><Tex math={`d = ${L(d)}\\ \\mathrm{m},\\quad m_{\\max} = \\lfloor d/\\lambda \\rfloor = ${mmax}`} /></div>
          <div className="tbl-wrap"><table className="tbl">
            <thead><tr><th>order m</th><th>θ (exact)</th><th>y = L tan θ</th><th>small-angle y = mλL/d</th><th>error</th></tr></thead>
            <tbody>{rows.map((r) => {
              const err = r.y > 0 ? Math.abs(r.ysmall - r.y) / r.y : 0;
              return <tr key={r.m}><td>{r.m}</td><td>{r.th.toFixed(2)}°</td><td>{T(r.y)} m</td><td>{T(r.ysmall)} m</td><td className={err > 0.02 ? 'pill-bad' : 'pill-ok'}>{(err * 100).toFixed(1)}%</td></tr>;
            })}</tbody>
          </table></div>
          <div className="tiny muted">The small-angle formula is only acceptable when the error column is small (θ ≲ 10°). Gratings usually need the exact form.</div>
        </>
      )}
    </div>
  );
}
