import { useMemo, useState } from 'react';
import { Graph, sample, COLORS } from '../components/Graph';
import { NumInput, num } from '../components/NumInput';
import { Tex } from '../components/Tex';
import { formatSig } from '../../engine/numbers';
import { getScenario } from '../../data/scenarios/index';
import { solveWithAssumptions } from '../../engine/solver';
import { useApp } from '../state';

const D = Math.PI / 180;
const f3 = (x: number) => formatSig(x, 3).latex;

export function ProjectileTool() {
  const [u, setU] = useState('20');
  const [th, setTh] = useState('35');
  const [h0, setH0] = useState('0');
  const [g, setG] = useState('9.8');
  const [tq, setTq] = useState('');
  const app = useApp();
  const m = useMemo(() => {
    const U = num(u), T = num(th) * D, H0 = num(h0), G = num(g);
    if (![U, T, H0, G].every(Number.isFinite) || U < 0 || G <= 0 || H0 < 0) return null;
    const ux = U * Math.cos(T), uy = U * Math.sin(T);
    const tf = (uy + Math.sqrt(uy * uy + 2 * G * H0)) / G;
    const range = ux * tf;
    const Hlaunch = uy > 0 ? (uy * uy) / (2 * G) : 0;
    const vy = uy - G * tf;
    const v = Math.hypot(ux, vy);
    const alpha = Math.atan2(vy, ux) / D;
    const tp = uy > 0 ? uy / G : 0;
    return { U, T, H0, G, ux, uy, tf, range, Hlaunch, vy, v, alpha, tp };
  }, [u, th, h0, g]);
  const tAt = num(tq);
  const pos = m && Number.isFinite(tAt) && tAt >= 0 && tAt <= m.tf ? { x: m.ux * tAt, y: m.H0 + m.uy * tAt - 0.5 * m.G * tAt * tAt, vy: m.uy - m.G * tAt } : null;

  const working = () => {
    const scn = getScenario('projectile');
    const knowns = {
      u: { value: num(u), sigFigs: 3, unit: 'm/s', raw: `${u} m/s`, origin: 'given' as const },
      theta: { value: num(th) * D, sigFigs: 3, unit: '°', raw: `${th}°`, origin: 'given' as const },
      sy: { value: -num(h0), sigFigs: 3, unit: 'm', raw: `${-num(h0)} m`, origin: 'given' as const },
      g: { value: num(g), sigFigs: 3, unit: 'm/s^2', raw: `${g} m/s^2`, origin: 'given' as const },
    };
    const r = solveWithAssumptions(scn, knowns, { target: 'sx' });
    app.show({ title: 'Projectile: horizontal range', scenario: scn, result: r, target: 'sx', source: 'Projectile analyser' });
  };

  return (
    <div className="card">
      <div className="card-h"><h3>Projectile analyser &amp; trajectory</h3><span className="badge">graph</span></div>
      <p className="small muted">Launch from height h above the landing level (h = 0 for level ground). Up is positive; a_y = −g.</p>
      <div className="row">
        <NumInput label="Launch speed u" unit="m/s" value={u} onChange={setU} />
        <NumInput label="Angle θ above horizontal" unit="°" value={th} onChange={setTh} />
        <NumInput label="Launch height h" unit="m" value={h0} onChange={setH0} />
        <NumInput label="g" unit="m/s²" value={g} onChange={setG} />
      </div>
      {!m && <div className="msg err">Enter valid values (u ≥ 0, h ≥ 0, g &gt; 0).</div>}
      {m && (
        <>
          <div className="grid2" style={{ marginTop: 10 }}>
            <div className="kv">
              <Tex math="u_x = u\cos\theta" /><Tex math={`${f3(m.ux)}\\ \\mathrm{m\\,s^{-1}}`} />
              <Tex math="u_y = u\sin\theta" /><Tex math={`${f3(m.uy)}\\ \\mathrm{m\\,s^{-1}}`} />
              <Tex math="t_{\text{flight}}" /><Tex math={`${f3(m.tf)}\\ \\mathrm{s}`} />
              <Tex math="\Delta x\ (\text{range})" /><Tex math={`${f3(m.range)}\\ \\mathrm{m}`} />
            </div>
            <div className="kv">
              <Tex math="H\ (\text{above launch})" /><Tex math={`${f3(m.Hlaunch)}\\ \\mathrm{m}`} />
              <Tex math="H\ (\text{above ground})" /><Tex math={`${f3(m.Hlaunch + m.H0)}\\ \\mathrm{m}`} />
              <Tex math="t_{\text{peak}}" /><Tex math={`${f3(m.tp)}\\ \\mathrm{s}`} />
              <Tex math="v_{\text{impact}}" /><Tex math={`${f3(m.v)}\\ \\mathrm{m\\,s^{-1}}\\ \\text{at } ${f3(Math.abs(m.alpha))}^{\\circ}\\text{ below horizontal}`} />
            </div>
          </div>
          <Graph
            xLabel="horizontal displacement x (m)" yLabel="height y (m)"
            series={[{ label: 'trajectory', color: COLORS[0], points: sample((t) => t, 0, m.tf, 160).map(([t]) => [m.ux * t, m.H0 + m.uy * t - 0.5 * m.G * t * t]) }]}
            markers={[
              ...(m.uy > 0 ? [{ x: m.ux * m.tp, y: m.H0 + m.Hlaunch, label: `max height ${formatSig(m.H0 + m.Hlaunch, 3).text} m` }] : []),
              { x: m.range, y: 0, label: `range ${formatSig(m.range, 3).text} m`, color: COLORS[1] },
              ...(pos ? [{ x: pos.x, y: pos.y, label: `t = ${tq} s`, color: COLORS[2] }] : []),
            ]}
            yMin={0}
          />
          <div className="row" style={{ marginTop: 8 }}>
            <NumInput label="Position at time t" unit="s" value={tq} onChange={setTq} width={150} />
            {pos && <div className="small"><Tex math={`x = ${f3(pos.x)}\\,\\mathrm{m},\\ y = ${f3(pos.y)}\\,\\mathrm{m},\\ v_y = ${f3(pos.vy)}\\,\\mathrm{m\\,s^{-1}}\\ (${pos.vy >= 0 ? '\\text{rising}' : '\\text{falling}'})`} /></div>}
            {Number.isFinite(tAt) && m && tAt > m.tf && <div className="small pill-bad">The projectile has landed at t = {formatSig(m.tf, 3).text} s.</div>}
            <button className="btn" onClick={working}>Show HSC working for the range</button>
          </div>
        </>
      )}
    </div>
  );
}
