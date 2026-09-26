import { useMemo, useState } from 'react';
import { Graph, sample, COLORS } from '../components/Graph';
import { NumInput, num } from '../components/NumInput';
import { Tex } from '../components/Tex';
import { formatSig } from '../../engine/numbers';
import { CONST } from '../../data/constants';

const c = CONST.c.value, h = CONST.h.value, G = CONST.G.value, ME = CONST.ME.value, RE = CONST.RE.value, b = CONST.b.value, e = CONST.e.value;
const kB = 1.381e-23; // Boltzmann constant — used ONLY to draw the shape of Planck curves (not HSC content)
const fs = (x: number, n = 3) => formatSig(x, n).text;

export function GammaGraph() {
  const [beta, setBeta] = useState('0.8');
  const bv = num(beta);
  const ok = Number.isFinite(bv) && bv >= 0 && bv < 1;
  const gam = ok ? 1 / Math.sqrt(1 - bv * bv) : NaN;
  return (
    <div className="card">
      <div className="card-h"><h3>Lorentz factor γ against v/c</h3><span className="badge">graph</span></div>
      <p className="small muted"><Tex math="\gamma = 1/\sqrt{1 - v^2/c^2}" /> — close to 1 at everyday speeds, rising without limit as v → c.</p>
      <div className="row"><NumInput label="v/c" value={beta} onChange={setBeta} width={120} />{ok ? <span>γ = <strong>{fs(gam, 4)}</strong>, so moving clocks run {fs(gam, 3)}× slow and lengths contract to {fs(100 / gam, 3)}%.</span> : <span className="pill-bad small">v/c must be between 0 and 1 (v &lt; c for massive objects).</span>}</div>
      <Graph xLabel="v / c" yLabel="γ" xMin={0} xMax={1} yMin={1} yMax={8} series={[{ label: 'γ', color: COLORS[0], points: sample((x) => 1 / Math.sqrt(1 - x * x), 0, 0.995, 300) }]} markers={ok && gam < 8 ? [{ x: bv, y: gam, label: `γ = ${fs(gam)}` }] : []} />
    </div>
  );
}

function planck(lambda: number, T: number) {
  return (2 * h * c * c) / lambda ** 5 / (Math.exp((h * c) / (lambda * kB * T)) - 1);
}

export function BlackbodyGraph() {
  const [temps, setTemps] = useState('3000, 4500, 6000');
  const Ts = temps.split(/[,\s]+/).map(Number).filter((t) => Number.isFinite(t) && t > 0).slice(0, 5);
  const series = Ts.map((T, i) => ({ label: `${T} K`, color: COLORS[i % COLORS.length], points: sample((nm) => planck(nm * 1e-9, T) / 1e12, 50, 3000, 300) }));
  const markers = Ts.map((T, i) => ({ x: (b / T) * 1e9, y: planck(b / T, T) / 1e12, label: `λmax = ${fs((b / T) * 1e9)} nm`, color: COLORS[i % COLORS.length] }));
  return (
    <div className="card">
      <div className="card-h"><h3>Black-body radiation curves</h3><span className="badge">graph</span></div>
      <p className="small muted">Peaks follow Wien’s law <Tex math="\lambda_{\max} = b/T" /> (b = 2.898 × 10⁻³ m K). Hotter bodies peak at shorter wavelengths and emit more at every wavelength. The curve shapes are drawn from Planck’s radiation law — the formula itself is NOT required for the HSC, only Wien’s law.</p>
      <div className="row"><div style={{ flex: 1 }}><label className="lbl">Temperatures (K, comma separated)</label><input className="inp mono" value={temps} onChange={(e) => setTemps(e.target.value)} /></div></div>
      <div style={{ position: 'relative' }}>
        <Graph xLabel="wavelength λ (nm)" yLabel="spectral radiance (relative)" series={series} markers={markers} xMin={0} xMax={3000} />
      </div>
      <div className="tiny faint">Visible band ≈ 400–700 nm.</div>
    </div>
  );
}

export function GravityGraph() {
  const [M, setM] = useState('6.0e24');
  const [R, setR] = useState('6.371e6');
  const Mv = num(M), Rv = num(R);
  const ok = Mv > 0 && Rv > 0;
  return (
    <div className="card">
      <div className="card-h"><h3>Gravitational field strength against distance</h3><span className="badge">graph</span></div>
      <p className="small muted"><Tex math="g = GM/r^2" /> for r ≥ planet radius (inverse-square). Defaults are the NESA Earth values.</p>
      <div className="row"><NumInput label="Mass M" unit="kg" value={M} onChange={setM} /><NumInput label="Radius R" unit="m" value={R} onChange={setR} /></div>
      {ok && <Graph xLabel="distance from centre r (× planet radius)" yLabel="g (m s⁻²)" xMin={1} xMax={8} series={[{ label: 'g', color: COLORS[0], points: sample((x) => (G * Mv) / (x * Rv) ** 2, 1, 8, 200) }]} markers={[{ x: 1, y: (G * Mv) / Rv ** 2, label: `surface: ${fs((G * Mv) / Rv ** 2)} m/s²` }, { x: 2, y: (G * Mv) / (2 * Rv) ** 2, label: 'r = 2R → g/4' }]} />}
    </div>
  );
}

export function OrbitGraph() {
  const [M, setM] = useState('6.0e24');
  const [R, setR] = useState('6.371e6');
  const Mv = num(M), Rv = num(R);
  const ok = Mv > 0 && Rv > 0;
  const hs = sample((x) => x, 0, 40000, 200);
  return (
    <div className="card">
      <div className="card-h"><h3>Orbital speed and period against altitude</h3><span className="badge">graph</span></div>
      <p className="small muted"><Tex math="v = \sqrt{GM/r}" /> and <Tex math="T = 2\pi\sqrt{r^3/GM}" /> with r = R + h. Higher orbits are slower and have longer periods.</p>
      <div className="row"><NumInput label="Mass M" unit="kg" value={M} onChange={setM} /><NumInput label="Radius R" unit="m" value={R} onChange={setR} /></div>
      {ok && (
        <div className="grid2">
          <Graph height={220} xLabel="altitude h (km)" yLabel="v (km/s)" series={[{ label: 'v', color: COLORS[0], points: hs.map(([hk]) => [hk, Math.sqrt((G * Mv) / (Rv + hk * 1e3)) / 1e3]) }]} />
          <Graph height={220} xLabel="altitude h (km)" yLabel="T (hours)" series={[{ label: 'T', color: COLORS[1], points: hs.map(([hk]) => [hk, (2 * Math.PI * Math.sqrt((Rv + hk * 1e3) ** 3 / (G * Mv))) / 3600]) }]} markers={Math.abs(Mv - ME) / ME < 0.05 && Math.abs(Rv - RE) / RE < 0.05 ? [{ x: (Math.cbrt((G * Mv * 86400 ** 2) / (4 * Math.PI ** 2)) - Rv) / 1e3, y: 24, label: 'geostationary (24 h)' }] : []} />
        </div>
      )}
    </div>
  );
}

export function DecayGraph() {
  const [N0, setN0] = useState('120');
  const [th, setTh] = useState('30');
  const [tmax, setTmax] = useState('');
  const n0 = num(N0), t = num(th);
  const ok = n0 > 0 && t > 0;
  const T = num(tmax, 5 * t);
  return (
    <div className="card">
      <div className="card-h"><h3>Radioactive decay curve</h3><span className="badge">graph</span></div>
      <p className="small muted"><Tex math="N_t = N_0 e^{-\lambda t},\; \lambda = \ln 2 / t_{1/2}" />. Units of N and t can be anything, as long as they are consistent.</p>
      <div className="row"><NumInput label="N₀ (any unit)" value={N0} onChange={setN0} /><NumInput label="half-life" value={th} onChange={setTh} /><NumInput label="plot up to time" value={tmax} onChange={setTmax} /></div>
      {ok && (
        <>
          <Graph xLabel="time (same unit as half-life)" yLabel="amount remaining" xMin={0} xMax={T > 0 ? T : 5 * t} yMin={0}
            series={[{ label: 'N', color: COLORS[0], points: sample((x) => n0 * Math.pow(0.5, x / t), 0, T > 0 ? T : 5 * t, 200) }]}
            markers={[1, 2, 3, 4].filter((k) => k * t <= (T > 0 ? T : 5 * t)).map((k) => ({ x: k * t, y: n0 / 2 ** k, label: `${k}t½: ${fs(n0 / 2 ** k)}` }))} />
          <div className="tbl-wrap"><table className="tbl"><thead><tr><th>half-lives</th>{[0, 1, 2, 3, 4, 5].map((k) => <th key={k}>{k}</th>)}</tr></thead><tbody>
            <tr><td>time</td>{[0, 1, 2, 3, 4, 5].map((k) => <td key={k}>{fs(k * t)}</td>)}</tr>
            <tr><td>remaining</td>{[0, 1, 2, 3, 4, 5].map((k) => <td key={k}>{fs(n0 / 2 ** k)}</td>)}</tr>
            <tr><td>fraction</td>{[0, 1, 2, 3, 4, 5].map((k) => <td key={k}>1/{2 ** k}</td>)}</tr>
          </tbody></table></div>
        </>
      )}
    </div>
  );
}

export function FieldGraph() {
  const [q, setQ] = useState('1.0e-6');
  const qv = num(q);
  const k = 1 / (4 * Math.PI * CONST.eps0.value);
  return (
    <div className="card">
      <div className="card-h"><h3>Electric field strength against distance</h3><span className="badge">graph</span></div>
      <p className="small muted">Point charge (Year 11): <Tex math="E = \frac{1}{4\pi\varepsilon_0}\frac{q}{r^2}" /> falls off as 1/r². Between parallel plates the field is uniform: <Tex math="E = V/d" /> (constant).</p>
      <div className="row"><NumInput label="Point charge q" unit="C" value={q} onChange={setQ} /></div>
      {qv > 0 && <Graph xLabel="distance r (m)" yLabel="E (N/C)" xMin={0.05} xMax={1} series={[{ label: 'point charge', color: COLORS[0], points: sample((r) => (k * qv) / (r * r), 0.05, 1, 200) }]} />}
    </div>
  );
}

export function DeflectionGraph() {
  const [v, setV] = useState('2.0e7');
  const [V, setVV] = useState('200');
  const [d, setD] = useState('0.020');
  const [L, setL] = useState('0.050');
  const [particle, setParticle] = useState<'e' | 'p'>('e');
  const m = particle === 'e' ? CONST.me.value : CONST.mp.value;
  const res = useMemo(() => {
    const vx = num(v), Vv = num(V), dv = num(d), Lv = num(L);
    if (!(vx > 0 && Vv >= 0 && dv > 0 && Lv > 0)) return null;
    const E = Vv / dv, a = (e * E) / m, t = Lv / vx, y = 0.5 * a * t * t;
    return { vx, E, a, t, y, Lv, dv, hits: y > dv / 2 };
  }, [v, V, d, L, m]);
  return (
    <div className="card">
      <div className="card-h"><h3>Charged particle path between plates</h3><span className="badge">graph</span></div>
      <p className="small muted">Enters midway between the plates, parallel to them. Parabolic path: <Tex math="y = \tfrac{1}{2}\frac{qE}{m}\left(\frac{x}{v_x}\right)^2" />.</p>
      <div className="row">
        <div><label className="lbl">Particle</label><div className="seg"><button className={particle === 'e' ? 'on' : ''} onClick={() => setParticle('e')}>electron</button><button className={particle === 'p' ? 'on' : ''} onClick={() => setParticle('p')}>proton</button></div></div>
        <NumInput label="entry speed vₓ" unit="m/s" value={v} onChange={setV} /><NumInput label="V" unit="V" value={V} onChange={setVV} /><NumInput label="d" unit="m" value={d} onChange={setD} /><NumInput label="plate length L" unit="m" value={L} onChange={setL} />
      </div>
      {res && (
        <>
          <div className="small"><Tex math={`E = ${formatSig(res.E, 3).latex}\\,\\mathrm{V\\,m^{-1}},\\ a = ${formatSig(res.a, 3).latex}\\,\\mathrm{m\\,s^{-2}},\\ t = ${formatSig(res.t, 3).latex}\\,\\mathrm{s},\\ y = ${formatSig(res.y, 3).latex}\\,\\mathrm{m}`} /></div>
          {res.hits && <div className="msg warn">The deflection exceeds half the plate separation — the particle strikes the plate before leaving the field.</div>}
          <Graph xLabel="x along plates (m)" yLabel={`deflection (m, towards ${particle === 'e' ? '+ plate' : '− plate'})`} xMin={0} xMax={res.Lv} yMin={0} yMax={res.dv / 2} series={[{ label: 'path', color: COLORS[0], points: sample((x) => 0.5 * res.a * (x / res.vx) ** 2, 0, res.Lv, 200) }]} />
        </>
      )}
    </div>
  );
}

export function CircularGraph() {
  const [m, setM] = useState('1200');
  const [v, setV] = useState('20');
  const mv = num(m), vv = num(v);
  return (
    <div className="card">
      <div className="card-h"><h3>Centripetal force against radius and speed</h3><span className="badge">graph</span></div>
      <p className="small muted"><Tex math="F_c = mv^2/r" />: halving r doubles F꜀; doubling v quadruples it.</p>
      <div className="row"><NumInput label="mass m" unit="kg" value={m} onChange={setM} /><NumInput label="speed v" unit="m/s" value={v} onChange={setV} /></div>
      {mv > 0 && vv > 0 && (
        <div className="grid2">
          <Graph height={210} xLabel="radius r (m)" yLabel="F꜀ (N)" xMin={5} xMax={200} series={[{ label: 'F vs r', color: COLORS[0], points: sample((r) => (mv * vv * vv) / r, 5, 200, 200) }]} />
          <Graph height={210} xLabel="speed v (m/s) at r = 50 m" yLabel="F꜀ (N)" xMin={0} xMax={2 * vv} series={[{ label: 'F vs v', color: COLORS[1], points: sample((s) => (mv * s * s) / 50, 0, 2 * vv, 200) }]} />
        </div>
      )}
    </div>
  );
}
