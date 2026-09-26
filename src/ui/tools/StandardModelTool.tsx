import { useState } from 'react';
import { Tex } from '../components/Tex';

interface Quark { id: string; latex: string; q: number; B: number; S: number; name: string }
const QUARKS: Quark[] = [
  { id: 'u', latex: 'u', q: 2 / 3, B: 1 / 3, S: 0, name: 'up' },
  { id: 'd', latex: 'd', q: -1 / 3, B: 1 / 3, S: 0, name: 'down' },
  { id: 's', latex: 's', q: -1 / 3, B: 1 / 3, S: -1, name: 'strange' },
  { id: 'c', latex: 'c', q: 2 / 3, B: 1 / 3, S: 0, name: 'charm' },
  { id: 'b', latex: 'b', q: -1 / 3, B: 1 / 3, S: 0, name: 'bottom' },
  { id: 't', latex: 't', q: 2 / 3, B: 1 / 3, S: 0, name: 'top' },
];
const ALL: Quark[] = [...QUARKS, ...QUARKS.map((x) => ({ ...x, id: x.id + 'bar', latex: `\\bar{${x.latex}}`, q: -x.q, B: -x.B, S: -x.S, name: `anti-${x.name}` }))];

const KNOWN: Record<string, string> = {
  'd,u,u': 'proton (p)', 'd,d,u': 'neutron (n)', 'd,s,u': 'lambda (Λ⁰) or sigma (Σ⁰)', 's,u,u': 'sigma plus (Σ⁺)', 'd,d,s': 'sigma minus (Σ⁻)', 's,s,u': 'xi zero (Ξ⁰)', 'd,s,s': 'xi minus (Ξ⁻)', 's,s,s': 'omega minus (Ω⁻)', 'u,u,u': 'delta plus-plus (Δ⁺⁺)', 'd,d,d': 'delta minus (Δ⁻)',
  'dbar,u': 'pion plus (π⁺)', 'd,ubar': 'pion minus (π⁻)', 'u,ubar': 'neutral pion (π⁰, mixture)', 'd,dbar': 'neutral pion (π⁰, mixture)', 'sbar,u': 'kaon plus (K⁺)', 's,ubar': 'kaon minus (K⁻)', 'd,sbar': 'neutral kaon (K⁰)',
  'dbar,ubar,ubar': 'antiproton (p̄)', 'dbar,dbar,ubar': 'antineutron (n̄)',
};

interface Particle { id: string; latex: string; Q: number; B: number; Le: number; Lmu: number; Ltau: number }
const P = (id: string, latex: string, Q: number, B: number, Le = 0, Lmu = 0, Ltau = 0): Particle => ({ id, latex, Q, B, Le, Lmu, Ltau });
const PARTICLES: Particle[] = [
  P('p', 'p', 1, 1), P('n', 'n', 0, 1), P('p̄', '\\bar{p}', -1, -1), P('n̄', '\\bar{n}', 0, -1),
  P('e⁻', 'e^-', -1, 0, 1), P('e⁺', 'e^+', 1, 0, -1), P('νₑ', '\\nu_e', 0, 0, 1), P('ν̄ₑ', '\\bar{\\nu}_e', 0, 0, -1),
  P('μ⁻', '\\mu^-', -1, 0, 0, 1), P('μ⁺', '\\mu^+', 1, 0, 0, -1), P('ν_μ', '\\nu_\\mu', 0, 0, 0, 1), P('ν̄_μ', '\\bar{\\nu}_\\mu', 0, 0, 0, -1),
  P('τ⁻', '\\tau^-', -1, 0, 0, 0, 1), P('τ⁺', '\\tau^+', 1, 0, 0, 0, -1),
  P('π⁺', '\\pi^+', 1, 0), P('π⁻', '\\pi^-', -1, 0), P('π⁰', '\\pi^0', 0, 0), P('K⁺', 'K^+', 1, 0), P('K⁻', 'K^-', -1, 0), P('K⁰', 'K^0', 0, 0),
  P('Λ⁰', '\\Lambda^0', 0, 1), P('Σ⁺', '\\Sigma^+', 1, 1), P('γ', '\\gamma', 0, 0), P('W⁺', 'W^+', 1, 0), P('W⁻', 'W^-', -1, 0), P('Z⁰', 'Z^0', 0, 0),
];
const PBY = Object.fromEntries(PARTICLES.map((p) => [p.id, p]));

function frac(x: number): string {
  const n = Math.round(x * 3);
  if (n % 3 === 0) return String(n / 3);
  return `${n < 0 ? '-' : ''}\\tfrac{${Math.abs(n)}}{3}`;
}

export function StandardModelTool() {
  const [qs, setQs] = useState<string[]>(['u', 'u', 'd']);
  const [lhs, setLhs] = useState<string[]>(['n']);
  const [rhs, setRhs] = useState<string[]>(['p', 'e⁻', 'ν̄ₑ']);
  const chosen = qs.map((id) => ALL.find((q) => q.id === id)!).filter(Boolean);
  const Q = chosen.reduce((a, q) => a + q.q, 0);
  const B = chosen.reduce((a, q) => a + q.B, 0);
  const key = [...qs].sort().join(',');
  const kind = chosen.length === 3 ? (Math.abs(Math.abs(B) - 1) < 1e-9 ? (B > 0 ? 'baryon' : 'antibaryon') : 'not a valid hadron (mix of quarks and antiquarks)') : chosen.length === 2 ? (Math.abs(B) < 1e-9 ? 'meson' : 'not a valid hadron (a meson is one quark + one antiquark)') : 'choose 2 or 3';
  const sum = (ids: string[], k: keyof Omit<Particle, 'id' | 'latex'>) => ids.reduce((a, id) => a + (PBY[id]?.[k] ?? 0), 0);
  const props: Array<[keyof Omit<Particle, 'id' | 'latex'>, string]> = [['Q', 'charge Q'], ['B', 'baryon number B'], ['Le', 'electron lepton number Lₑ'], ['Lmu', 'muon lepton number L_μ'], ['Ltau', 'tau lepton number L_τ']];
  const allOk = props.every(([k]) => Math.abs(sum(lhs, k) - sum(rhs, k)) < 1e-9);
  return (
    <>
      <div className="card">
        <div className="card-h"><h3>Hadron composition from quarks</h3><span className="badge">charge &amp; baryon number</span></div>
        <p className="small muted">Quark charges: u, c, t = +⅔e; d, s, b = −⅓e (antiquarks opposite). Baryons = 3 quarks (B = 1); mesons = quark + antiquark (B = 0).</p>
        <div className="row">
          {[0, 1, 2].map((i) => (
            <select key={i} className="inp" style={{ width: 130 }} value={qs[i] ?? ''} onChange={(ev) => setQs((x) => { const n = [...x]; if (ev.target.value) n[i] = ev.target.value; else n.splice(i, 1); return n.filter(Boolean); })}>
              <option value="">{i === 2 ? '(none)' : '—'}</option>
              {ALL.map((q) => <option key={q.id} value={q.id}>{q.id.replace('bar', '\u0304')} ({q.name})</option>)}
            </select>
          ))}
        </div>
        {chosen.length >= 2 && (
          <div style={{ marginTop: 8 }}>
            <Tex block math={`Q = ${chosen.map((q) => `(${frac(q.q)})`).join(' + ')} = ${frac(Q)}\\,e`} />
            <Tex block math={`B = ${chosen.map((q) => `(${frac(q.B)})`).join(' + ')} = ${frac(B)}`} />
            <div className="small">Type: <strong>{kind}</strong>{KNOWN[key] ? <> — this is the <strong>{KNOWN[key]}</strong></> : null}.</div>
          </div>
        )}
      </div>
      <div className="card">
        <div className="card-h"><h3>Conservation laws in an interaction</h3><span className="badge">checker</span></div>
        <p className="small muted">A process is allowed only if charge, baryon number and each lepton number are conserved.</p>
        <div className="grid2">
          {([['Before', lhs, setLhs], ['After', rhs, setRhs]] as Array<[string, string[], (f: (x: string[]) => string[]) => void]>).map(([lab, list, setList]) => (
            <div key={lab}>
              <div className="small muted">{lab}</div>
              <div className="row" style={{ gap: 4 }}>
                {list.map((id, i) => <button key={i} className="chip" onClick={() => setList((x) => x.filter((_, j) => j !== i))} title="remove"><Tex math={PBY[id].latex} /> ✕</button>)}
                <select className="inp" style={{ width: 110 }} value="" onChange={(ev) => ev.target.value && setList((x) => [...x, ev.target.value])}>
                  <option value="">+ add</option>{PARTICLES.map((p) => <option key={p.id} value={p.id}>{p.id}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>
        <Tex block math={`${lhs.map((id) => PBY[id].latex).join(' + ') || '\\varnothing'} \\to ${rhs.map((id) => PBY[id].latex).join(' + ') || '\\varnothing'}`} />
        <table className="tbl"><thead><tr><th>quantity</th><th>before</th><th>after</th><th></th></tr></thead><tbody>
          {props.map(([k, label]) => { const a = sum(lhs, k), b2 = sum(rhs, k); const ok = Math.abs(a - b2) < 1e-9; return <tr key={k}><td>{label}</td><td>{a}</td><td>{b2}</td><td className={ok ? 'pill-ok' : 'pill-bad'}>{ok ? 'conserved ✓' : 'VIOLATED ✗'}</td></tr>; })}
        </tbody></table>
        <div className={`msg ${allOk ? 'ok' : 'err'}`}>{allOk ? 'All checked quantities are conserved — the process is allowed by these laws.' : 'At least one conservation law is violated — this process cannot occur.'}</div>
      </div>
    </>
  );
}
