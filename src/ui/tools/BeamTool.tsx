import { useMemo, useState } from 'react';
import { Tex } from '../components/Tex';
import { formatSig } from '../../engine/numbers';
import { num } from '../components/NumInput';
import { useApp } from '../state';

const D = Math.PI / 180;
const f = (x: number, n = 3) => formatSig(Math.abs(x) < 1e-12 ? 0 : x, n).latex;

interface Row { label: string; F: string; x: string; dir: string }

/**
 * Rotational equilibrium of a beam about a pivot. Positions are measured along the beam
 * from the pivot (right = +). Directions are angles anticlockwise from the +x axis
 * (down = 270°, up = 90°). Torque (anticlockwise +) τ = x F sin φ.
 */
export function BeamTool() {
  const [rows, setRows] = useState<Row[]>([
    { label: 'child A', F: '300', x: '-2.0', dir: '270' },
    { label: 'child B', F: '?', x: '1.5', dir: '270' },
  ]);
  const app = useApp();
  const res = useMemo(() => {
    const unknowns = rows.flatMap((r, i) => [r.F.trim() === '?' ? { i, what: 'F' as const } : null, r.x.trim() === '?' ? { i, what: 'x' as const } : null]).filter(Boolean) as Array<{ i: number; what: 'F' | 'x' }>;
    let known = 0;
    let coef = 0;
    const parts: Array<{ label: string; tau: number | null; F: number; x: number; phi: number }> = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const F = r.F.trim() === '?' ? NaN : num(r.F);
      const x = r.x.trim() === '?' ? NaN : num(r.x);
      const phi = num(r.dir) * D;
      const s = Math.sin(phi);
      if (r.F.trim() === '?') coef += x * s;
      else if (r.x.trim() === '?') coef += F * s;
      else known += x * F * s;
      parts.push({ label: r.label, tau: Number.isFinite(F) && Number.isFinite(x) ? x * F * s : null, F, x, phi });
    }
    let solved: number | null = null;
    let error: string | null = null;
    if (unknowns.length > 1) error = 'Only one unknown (marked “?”) can be found from the torque balance.';
    else if (unknowns.length === 1) {
      if (Math.abs(coef) < 1e-12) error = 'The unknown has no turning effect (its line of action passes through the pivot) — it cannot be found from moments.';
      else solved = -known / coef;
      if (solved !== null && unknowns[0].what === 'F' && solved < 0) error = `The balancing force would have to act in the OPPOSITE direction (magnitude ${formatSig(-solved, 3).text} N).`;
    }
    const net = unknowns.length === 0 ? known : 0;
    return { unknowns, known, coef, solved, error, parts, net };
  }, [rows]);
  const upd = (i: number, p: Partial<Row>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, ...p } : x)));

  const show = () => {
    const u = res.unknowns[0];
    app.showCustom('Rotational equilibrium (moments)', (
      <div className="sol">
        <h2>Rotational equilibrium about the pivot</h2>
        <div className="sec"><div className="sec-t">Principle</div>
          <div className="small">For equilibrium the net torque is zero: Σ clockwise moments = Σ anticlockwise moments. Each torque is <Tex math="\tau = r_\perp F = rF\sin\theta" />, where θ is the angle between the beam (r) and the force.</div>
        </div>
        <div className="sec"><div className="sec-t">Torques (anticlockwise positive)</div>
          {res.parts.map((p, i) => (
            <div key={i} className="eq-line small">
              {p.tau !== null
                ? <Tex math={`\\tau_{\\text{${p.label}}} = (${f(p.x)})(${f(p.F)})\\sin ${f(p.phi / D)}^{\\circ} = ${f(p.tau, 4)}\\ \\mathrm{N\\,m}\\ (${Math.abs(p.tau) < 1e-12 ? '\\text{none}' : p.tau > 0 ? '\\text{anticlockwise}' : '\\text{clockwise}'})`} />
                : <Tex math={`\\tau_{\\text{${p.label}}} = \\text{unknown}`} />}
            </div>
          ))}
        </div>
        {u && res.solved !== null && (
          <div className="sec"><div className="sec-t">Solve Στ = 0</div>
            <Tex block math={`${f(res.known, 4)} + (${f(res.coef, 4)})\\,${u.what === 'F' ? 'F' : 'x'} = 0`} />
            <Tex block math={`${u.what === 'F' ? 'F' : 'x'} = \\frac{-(${f(res.known, 4)})}{${f(res.coef, 4)}} = ${f(res.solved)}\\ ${u.what === 'F' ? '\\mathrm{N}' : '\\mathrm{m}'}`} />
          </div>
        )}
        {res.error && <div className="msg err">{res.error}</div>}
        {!u && <div className="msg info">Net torque = <Tex math={`${f(res.net, 4)}\\ \\mathrm{N\\,m}`} /> — {Math.abs(res.net) < 1e-9 ? 'the system is in rotational equilibrium.' : res.net > 0 ? 'unbalanced: the beam rotates ANTICLOCKWISE.' : 'unbalanced: the beam rotates CLOCKWISE.'}</div>}
        {u && res.solved !== null && !res.error && (
          <div className="answer"><div className="lab">Answer</div><div className="big"><Tex math={`${u.what === 'F' ? 'F' : 'x'}_{\\text{${rows[u.i].label}}} = ${f(Math.abs(res.solved))}\\ ${u.what === 'F' ? '\\mathrm{N}' : '\\mathrm{m}'}`} /></div>
            {u.what === 'x' && <div className="small">{res.solved >= 0 ? 'to the RIGHT of the pivot' : 'to the LEFT of the pivot'}</div>}</div>
        )}
      </div>
    ));
  };

  return (
    <div className="card">
      <div className="card-h"><h3>Moments / beam equilibrium</h3><span className="badge">torque</span></div>
      <p className="small muted">Positions along the beam measured from the pivot (right +, left −). Direction: 270° = down (weights), 90° = up, or any angle anticlockwise from the beam’s +x direction. Put “?” in ONE box to solve for it.</p>
      {rows.map((r, i) => (
        <div key={i} className="row" style={{ marginBottom: 6 }}>
          <input className="inp" style={{ width: 100 }} value={r.label} onChange={(e) => upd(i, { label: e.target.value })} aria-label="label" />
          <span className="small muted">F</span><input className="inp mono" style={{ width: 80 }} value={r.F} onChange={(e) => upd(i, { F: e.target.value })} aria-label="force" />
          <span className="small muted">N at x</span><input className="inp mono" style={{ width: 70 }} value={r.x} onChange={(e) => upd(i, { x: e.target.value })} aria-label="position" />
          <span className="small muted">m, dir</span>
          <select className="inp" style={{ width: 110 }} value={['270', '90'].includes(r.dir) ? r.dir : 'custom'} onChange={(e) => upd(i, { dir: e.target.value === 'custom' ? '240' : e.target.value })}>
            <option value="270">down ↓</option><option value="90">up ↑</option><option value="custom">angle…</option>
          </select>
          {!['270', '90'].includes(r.dir) && <input className="inp mono" style={{ width: 60 }} value={r.dir} onChange={(e) => upd(i, { dir: e.target.value })} aria-label="angle" />}
          <button className="btn small ghost" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))} aria-label="remove">✕</button>
        </div>
      ))}
      <div className="row">
        <button className="btn small" onClick={() => setRows((rs) => [...rs, { label: `force ${rs.length + 1}`, F: '', x: '', dir: '270' }])}>+ Add force</button>
        <button className="btn small primary" onClick={show}>Solve / show working</button>
        {res.error && <span className="small pill-bad">{res.error}</span>}
        {res.solved !== null && !res.error && <span className="small">Result: <Tex math={`${f(Math.abs(res.solved))}\\ ${res.unknowns[0].what === 'F' ? '\\mathrm{N}' : '\\mathrm{m}'}`} /></span>}
      </div>
    </div>
  );
}
