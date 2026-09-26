import { useMemo, useState } from 'react';
import { Tex } from '../components/Tex';
import { formatSig } from '../../engine/numbers';
import { num } from '../components/NumInput';
import { useApp } from '../state';

const D = Math.PI / 180;
const f = (x: number, n = 3) => formatSig(Math.abs(x) < 1e-12 ? 0 : x, n).latex;

interface F { label: string; mag: string; ang: string }

export function ForcesTool() {
  const [forces, setForces] = useState<F[]>([
    { label: 'F₁', mag: '30', ang: '0' },
    { label: 'F₂', mag: '40', ang: '90' },
  ]);
  const app = useApp();
  const calc = useMemo(() => {
    const rows = forces.map((x) => {
      const m = num(x.mag), a = num(x.ang);
      return { ...x, m, a, fx: m * Math.cos(a * D), fy: m * Math.sin(a * D), ok: Number.isFinite(m) && Number.isFinite(a) };
    });
    const valid = rows.filter((r) => r.ok);
    const sx = valid.reduce((s, r) => s + r.fx, 0);
    const sy = valid.reduce((s, r) => s + r.fy, 0);
    const R = Math.hypot(sx, sy);
    const dir = (Math.atan2(sy, sx) / D + 360) % 360;
    return { rows, sx, sy, R, dir };
  }, [forces]);
  const upd = (i: number, p: Partial<F>) => setForces((fs) => fs.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const show = () => {
    app.showCustom('Resultant of several forces', (
      <div className="sol">
        <h2>Resultant of coplanar forces</h2>
        <div className="sec"><div className="sec-t">Method</div><div className="small">Angles are measured anticlockwise from the +x axis (east). Resolve each force, add the components, then recombine.</div></div>
        <div className="sec"><div className="sec-t">Components</div>
          {calc.rows.filter((r) => r.ok).map((r, i) => (
            <div key={i} className="eq-line"><Tex math={`${r.label.replace(/[₁₂₃₄₅₆₇₈₉]/g, (d) => '_' + ('₁₂₃₄₅₆₇₈₉'.indexOf(d) + 1))}:\\ F_x = ${f(r.m)}\\cos ${f(r.a)}^{\\circ} = ${f(r.fx, 4)}\\,\\mathrm{N},\\quad F_y = ${f(r.m)}\\sin ${f(r.a)}^{\\circ} = ${f(r.fy, 4)}\\,\\mathrm{N}`} /></div>
          ))}
        </div>
        <div className="sec"><div className="sec-t">Sum</div>
          <Tex block math={`\\Sigma F_x = ${f(calc.sx, 4)}\\ \\mathrm{N},\\qquad \\Sigma F_y = ${f(calc.sy, 4)}\\ \\mathrm{N}`} />
          <Tex block math={`F_R = \\sqrt{(\\Sigma F_x)^2 + (\\Sigma F_y)^2} = \\sqrt{(${f(calc.sx, 4)})^2 + (${f(calc.sy, 4)})^2} = ${f(calc.R)}\\ \\mathrm{N}`} />
          <Tex block math={`\\theta = \\tan^{-1}\\left(\\frac{${f(calc.sy, 4)}}{${f(calc.sx, 4)}}\\right) \\to ${f(calc.dir)}^{\\circ}\\ \\text{(anticlockwise from +x, quadrant from signs)}`} />
        </div>
        <div className="answer"><div className="lab">Resultant</div><div className="big"><Tex math={`F_R = ${f(calc.R)}\\ \\mathrm{N}\\ \\text{at}\\ ${f(calc.dir)}^{\\circ}`} /></div>
          <div className="small">Equilibrant (force needed for equilibrium): <Tex math={`${f(calc.R)}\\ \\mathrm{N}\\ \\text{at}\\ ${f((calc.dir + 180) % 360)}^{\\circ}`} /></div></div>
      </div>
    ));
  };

  const W = 220, c = W / 2;
  const maxM = Math.max(1e-9, calc.R, ...calc.rows.filter((r) => r.ok).map((r) => Math.abs(r.m)));
  const sc = (W * 0.42) / maxM;
  const arrow = (fx: number, fy: number, col: string, key: string, w = 2.2) => {
    const x2 = c + fx * sc, y2 = c - fy * sc;
    const ang = Math.atan2(y2 - c, x2 - c);
    const hl = 8;
    return (
      <g key={key} stroke={col} fill={col} strokeWidth={w}>
        <line x1={c} y1={c} x2={x2} y2={y2} />
        <polygon points={`${x2},${y2} ${x2 - hl * Math.cos(ang - 0.4)},${y2 - hl * Math.sin(ang - 0.4)} ${x2 - hl * Math.cos(ang + 0.4)},${y2 - hl * Math.sin(ang + 0.4)}`} />
      </g>
    );
  };

  return (
    <div className="card">
      <div className="card-h"><h3>Resultant of several forces (2D)</h3><span className="badge">vectors</span></div>
      <p className="small muted">Enter each force’s magnitude and direction (angle anticlockwise from the +x axis / east: 0° = east, 90° = north, 180° = west, 270° = south).</p>
      <div className="grid2">
        <div>
          {forces.map((x, i) => (
            <div key={i} className="row" style={{ marginBottom: 6 }}>
              <input className="inp" style={{ width: 60 }} value={x.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="label" />
              <input className="inp mono" style={{ width: 90 }} value={x.mag} onChange={(e) => upd(i, { mag: e.target.value })} aria-label="magnitude N" placeholder="N" />
              <span className="small muted">N at</span>
              <input className="inp mono" style={{ width: 70 }} value={x.ang} onChange={(e) => upd(i, { ang: e.target.value })} aria-label="angle" placeholder="°" />
              <span className="small muted">°</span>
              <button className="btn small ghost" onClick={() => setForces((fs) => fs.filter((_, j) => j !== i))} aria-label="remove">✕</button>
            </div>
          ))}
          <div className="row">
            <button className="btn small" onClick={() => setForces((fs) => [...fs, { label: `F${'₁₂₃₄₅₆₇₈₉'[fs.length] ?? fs.length + 1}`, mag: '', ang: '' }])}>+ Add force</button>
            <button className="btn small primary" onClick={show}>Show working</button>
          </div>
          <div className="kv" style={{ marginTop: 10 }}>
            <Tex math="\Sigma F_x" /><Tex math={`${f(calc.sx, 4)}\\ \\mathrm{N}`} />
            <Tex math="\Sigma F_y" /><Tex math={`${f(calc.sy, 4)}\\ \\mathrm{N}`} />
            <Tex math="F_R" /><Tex math={`${f(calc.R)}\\ \\mathrm{N}\\ \\text{at } ${f(calc.dir)}^{\\circ}`} />
          </div>
        </div>
        <svg viewBox={`0 0 ${W} ${W}`} style={{ maxWidth: 260 }} role="img" aria-label="force diagram">
          <line x1={0} x2={W} y1={c} y2={c} stroke="var(--line-2)" />
          <line y1={0} y2={W} x1={c} x2={c} stroke="var(--line-2)" />
          {calc.rows.filter((r) => r.ok).map((r, i) => arrow(r.fx, r.fy, 'var(--accent-2)', `f${i}`))}
          {calc.R > 1e-9 && arrow(calc.sx, calc.sy, 'var(--answer)', 'R', 3)}
          <text x={W - 20} y={c - 4} fontSize={10} fill="var(--muted)">+x</text>
          <text x={c + 4} y={12} fontSize={10} fill="var(--muted)">+y</text>
        </svg>
      </div>
    </div>
  );
}
