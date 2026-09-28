import { useEffect, useMemo, useRef, useState } from 'react';
import { smartSolve, SmartResult, SmartPart } from '../../nlp/smart';
import { stripLatex, joinBrokenLines } from '../../nlp/extract';
import { useApp } from '../state';
import { Tex } from '../components/Tex';
import { formatAnswer, formatQty, siUnitOf } from '../format';
import { MODULE_NAMES, TOPIC_BY_ID } from '../nav';
import { formatSig } from '../../engine/numbers';
import { toSI } from '../../engine/units';
import { AiImageReader } from '../components/AiImageReader';

const EXAMPLES: Array<[string, string]> = [
  ['Proton in B field', 'A proton enters a uniform magnetic field of 3.00 T perpendicular to the field with a velocity of 1200 m/s. Calculate the acceleration of the proton.'],
  ['Cliff projectile', 'A ball is thrown horizontally at 12 m s-1 from a cliff 45 m high. Calculate how far from the base of the cliff the ball lands and its speed just before impact.'],
  ['Angled projectile', 'A projectile is launched at 25 m/s at 40° above the horizontal from level ground. Calculate its maximum height and its range.'],
  ['Satellite', 'A satellite orbits the Earth at an altitude of 400 km. Calculate its orbital velocity and its period.'],
  ['Photoelectric', 'Light of wavelength 450 nm is incident on a metal with a work function of 2.3 eV. Calculate the maximum kinetic energy of the emitted photoelectrons and the stopping voltage.'],
  ['Time dilation', 'Muons have a half-life of 2.2 μs when at rest. Muons travelling at 0.98c are produced in the upper atmosphere. Calculate the half-life of the muons as measured by an observer on Earth.'],
  ['Transformer', 'A transformer has 500 turns on the primary coil and 25 turns on the secondary coil. The primary is connected to a 240 V supply. Calculate the output voltage.'],
  ['Faraday', 'A coil of 200 turns and area 0.050 m² is placed in a magnetic field of 0.40 T directed into the page. The field is reduced to zero in 0.10 s. Calculate the average induced emf.'],
  ['Half-life', 'A radioactive sample has a mass of 120 g. The half-life of the isotope is 30 years. How much of the sample remains after 90 years?'],
  ['Hydrogen', 'Calculate the wavelength of the photon emitted when an electron in a hydrogen atom falls from n = 4 to n = 2.'],
  ['Binding energy', 'The mass of a proton is 1.007276 u, the mass of a neutron is 1.008665 u and the mass of a helium-4 nucleus is 4.001506 u. Calculate the binding energy of the helium-4 nucleus in MeV.'],
  ['Grating', 'A diffraction grating with 600 lines per mm is illuminated with light of wavelength 550 nm. Calculate the angle of the first-order maximum.'],
];

function Highlighted({ r }: { r: SmartResult }) {
  const text = r.normalized;
  const marks = [
    ...r.assignments.map((a) => ({ s: a.q.start, e: a.q.end, cls: 'hl-q', title: `${r.scenario?.vars[a.key]?.name} (${a.reason})` })),
    ...r.unused.map((q) => ({ s: q.start, e: q.end, cls: 'hl-q unused', title: 'not used in this calculation' })),
  ].sort((a, b) => a.s - b.s);
  const out: JSX.Element[] = [];
  let pos = 0;
  marks.forEach((m, i) => {
    if (m.s < pos) return;
    out.push(<span key={`t${i}`}>{text.slice(pos, m.s)}</span>);
    out.push(<span key={`m${i}`} className={m.cls} title={m.title}>{text.slice(m.s, m.e)}</span>);
    pos = m.e;
  });
  out.push(<span key="end">{text.slice(pos)}</span>);
  return <div className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{out}</div>;
}

export function SmartSolverPage() {
  const app = useApp();
  const [text, setText] = useState<string>(() => { try { return localStorage.getItem('hsc.smart.q') ?? ''; } catch { return ''; } });
  const [res, setRes] = useState<SmartResult | null>(null);
  const [forced, setForced] = useState<string>('');
  const [ocr, setOcr] = useState<{ busy: boolean; msg: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { try { localStorage.setItem('hsc.smart.q', text); } catch { /* ignore */ } }, [text]);

  const showPart = (r: SmartResult, p: SmartPart) => {
    if (!r.scenario || !p.result || !p.target) return;
    const notes: string[] = [...r.notes];
    if (p.claimed) {
      const tv = r.scenario.vars[p.target];
      let claimedSI = p.claimed.value;
      try { claimedSI = p.claimed.unit ? toSI(p.claimed.value, p.claimed.unit, tv.q) : p.claimed.value; } catch { /* keep */ }
      const got = p.result.values[p.target];
      if (got !== undefined) notes.push(`“Show that” check: the question states ${p.claimed.value} ${p.claimed.unit}; the calculated value is ${formatSig(got, 3).text} (SI) — ${Math.abs(got - claimedSI) / Math.abs(claimedSI) < 0.03 ? 'consistent ✓' : 'these differ — re-check the data'}.`);
    }
    app.show({
      title: `Find ${r.scenario.vars[p.target].name}`,
      scenario: r.scenario,
      result: p.result,
      target: p.target,
      unitHint: p.unitHint,
      source: `Smart Solver · Module ${r.scenario.module} · ${TOPIC_BY_ID[r.scenario.topic]?.label ?? ''}`,
      question: joinBrokenLines(stripLatex(r.input)),
      directions: r.directions,
      extraNotes: notes,
      autoNotes: r.autoFilled.map((a) => a.note),
    });
  };

  const run = (q = text, scenarioId = forced) => {
    if (!q.trim()) return;
    const r = smartSolve(q, scenarioId ? { scenarioId } : {});
    setRes(r);
    const first = r.parts.find((p) => p.result?.ok) ?? r.parts[0];
    if (first && first.result) showPart(r, first);
    else app.clear();
  };

  const onFile = async (f: File) => {
    setOcr({ busy: true, msg: 'Reading text from the image (first use downloads the OCR language data)…' });
    try {
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng');
      const url = URL.createObjectURL(f);
      const out = await worker.recognize(url);
      await worker.terminate();
      URL.revokeObjectURL(url);
      const t = out.data.text.replace(/\n(?!\n)/g, ' ').replace(/\s{2,}/g, ' ').trim();
      setText(t);
      setOcr({ busy: false, msg: 'Text extracted. CHECK IT CAREFULLY: OCR can misread exponents, subscripts and symbols, and values that appear only in the diagram (labels, arrows, angles) are NOT read — type them into the question before solving.' });
    } catch (e) {
      setOcr({ busy: false, msg: `Could not read the image (${(e as Error).message}). OCR needs an internet connection the first time to download its language data. You can still type the question.` });
    }
  };

  const ranking = res?.ranking.slice(0, 6) ?? [];
  const summary = useMemo(() => {
    if (!res?.scenario) return null;
    const s = res.scenario;
    return { module: s.module, topic: TOPIC_BY_ID[s.topic]?.label ?? s.topic, title: s.title };
  }, [res]);

  return (
    <div>
      <div className="page-h">
        <div className="kicker">Smart Solver</div>
        <h1>Paste your HSC Physics question</h1>
        <p>The question is parsed deterministically: quantities and units are extracted, the Module 5–8 calculation type is identified, each value is matched to a variable, and the numbers are computed by the formula engine (not by AI). Anything missing is reported rather than invented.</p>
      </div>
      <div className="card smart-box">
        <textarea className="inp" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. A proton enters a uniform magnetic field of 3.00 T perpendicular to the field with a velocity of 1200 m/s. Calculate the acceleration of the proton." aria-label="Question text"
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) run(); }} />
        <div className="calc-actions">
          <button className="btn primary" onClick={() => run()}>Solve</button>
          <button className="btn" onClick={() => fileRef.current?.click()} disabled={ocr?.busy}>Upload screenshot…</button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void onFile(f); e.target.value = ''; }} />
          <button className="btn ghost" onClick={() => { setText(''); setRes(null); setForced(''); app.clear(); }}>Clear</button>
          <span className="tiny faint hide-sm">Ctrl + Enter to solve</span>
        </div>
        {ocr && <div className={`msg ${ocr.busy ? 'info' : 'warn'}`}>{ocr.msg}</div>}
        <AiImageReader onUse={(t) => { setText(t); setForced(''); }} />
        <div className="examples">
          {EXAMPLES.map(([label, q]) => <button key={label} className="chip" onClick={() => { setText(q); setForced(''); run(q, ''); }}>{label}</button>)}
        </div>
      </div>

      {res && (
        <>
          <div className="card">
            <div className="card-h">
              <h3>Interpretation</h3>
              {summary && <span className="badge mod">Module {summary.module} · {MODULE_NAMES[summary.module as 5 | 6 | 7 | 8]}</span>}
            </div>
            {summary ? (
              <div className="small"><strong>Topic:</strong> {summary.topic} — <strong>calculation type:</strong> {summary.title}</div>
            ) : <div className="msg err">No HSC calculation type could be identified. Try the topic calculators or rephrase.</div>}
            {res.particle && <div className="small"><strong>Particle:</strong> {res.particle.name} ({res.particle.chargeMultiple > 0 ? 'positive' : res.particle.chargeMultiple < 0 ? 'negative' : 'neutral'})</div>}
            <div className="hr" />
            <Highlighted r={res} />
            <div className="tiny faint" style={{ marginTop: 4 }}>Blue: values used · amber: values not used by this calculation (hover for details)</div>
            {res.scenario && (
              <div className="tbl-wrap" style={{ marginTop: 10 }}>
                <table className="tbl">
                  <thead><tr><th>In the question</th><th>Variable</th><th>SI value</th><th>Why</th></tr></thead>
                  <tbody>
                    {res.assignments.map((a) => {
                      const v = res.scenario!.vars[a.key];
                      const si = res.knowns[a.key]?.value;
                      return (
                        <tr key={a.q.id}>
                          <td className="mono">{a.q.raw}</td>
                          <td><Tex math={v.symbol} /> <span className="small muted">{v.name}</span></td>
                          <td>{si !== undefined ? <Tex math={formatQty(v, si, v.q === 'angle' ? '°' : siUnitOf(v) || (res.knowns[a.key]?.unit ?? ''), 4).latex} /> : '—'}</td>
                          <td className="small muted">{a.reason}</td>
                        </tr>
                      );
                    })}
                    {res.autoFilled.map((a) => {
                      const v = res.scenario!.vars[a.key];
                      return (
                        <tr key={`auto-${a.key}`}>
                          <td className="small muted">(from context)</td>
                          <td><Tex math={v.symbol} /> <span className="small muted">{v.name}</span></td>
                          <td><Tex math={formatQty(v, a.value, v.q === 'angle' ? '°' : siUnitOf(v), 4).latex} /></td>
                          <td className="small muted">{a.note}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {res.unused.length > 0 && <div className="msg warn">Not used: {res.unused.map((u) => u.raw).join(', ')}. If one of these is needed, the calculation type may be wrong — choose another below, or use a topic calculator.</div>}
            {res.notes.map((n, i) => <div key={i} className="small">• {n}</div>)}
            {ranking.length > 1 && (
              <div className="row" style={{ marginTop: 8 }}>
                <span className="small muted">Calculation type:</span>
                <select className="inp" style={{ width: 'auto' }} value={forced || res.scenario?.id || ''} onChange={(e) => { setForced(e.target.value); run(text, e.target.value); }}>
                  {!forced && res.scenario && <option value={res.scenario.id}>{res.scenario.title} (auto)</option>}
                  {res.ranking.map((x) => <option key={x.id} value={x.id}>{x.title}{x.solved ? '' : ' (not solvable with detected data)'}</option>)}
                </select>
                {forced && <button className="btn small ghost" onClick={() => { setForced(''); run(text, ''); }}>auto</button>}
              </div>
            )}
          </div>

          {res.scenario && (
            <div className="card">
              <div className="card-h"><h3>Answers</h3><span className="small muted">{res.parts.length} part{res.parts.length === 1 ? '' : 's'} detected</span></div>
              {res.parts.map((p, i) => {
                const tv = p.target ? res.scenario!.vars[p.target] : null;
                const ok = p.result?.ok && p.target;
                const ans = ok ? formatAnswer(res.scenario!, p.target!, p.result!, app.sig, p.unitHint) : null;
                return (
                  <div key={i} className="row" style={{ justifyContent: 'space-between', borderBottom: '1px solid var(--line)', padding: '8px 0' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="small muted">{p.phrase ? `“${p.phrase}”` : 'Most likely unknown'}</div>
                      {tv && ans && <div><Tex math={`${tv.symbol} = ${ans.main.latex}`} /></div>}
                      {tv && !ok && <div className="small pill-bad">Cannot find {tv.name}: {p.result?.errors[0]}</div>}
                      {!tv && <div className="small pill-bad">Could not tell which quantity this part asks for.</div>}
                    </div>
                    {p.result && p.target && <button className="btn small" onClick={() => showPart(res, p)}>Working →</button>}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
