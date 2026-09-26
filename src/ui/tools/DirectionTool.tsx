import { useState } from 'react';
import { DirWord, magneticForceOnCharge, motorForce, electricForce, lenz, wiresForce, DIR_LABEL, DirectionResult } from '../../engine/direction';
import { DirGlyph } from '../components/DirectionView';

type Mode = 'charge' | 'motor' | 'electric' | 'lenz' | 'wires';
const DIRS: DirWord[] = ['right', 'left', 'up', 'down', 'out', 'in'];

function DirPicker({ label, value, onChange }: { label: string; value: DirWord; onChange: (d: DirWord) => void }) {
  return (
    <div>
      <label className="lbl">{label}</label>
      <div className="row" style={{ gap: 4 }}>
        {DIRS.map((d) => (
          <button key={d} className={`btn small ${value === d ? 'primary' : ''}`} onClick={() => onChange(d)} title={DIR_LABEL[d]} aria-label={DIR_LABEL[d]} style={{ padding: 2 }}>
            <DirGlyph d={d} size={26} color={value === d ? 'currentColor' : 'var(--muted)'} />
          </button>
        ))}
      </div>
    </div>
  );
}

function Result({ r, glyphs }: { r: DirectionResult; glyphs: Array<{ d: DirWord; label: string; color: string }> }) {
  return (
    <div className="grid2" style={{ marginTop: 10 }}>
      <div>
        {r.steps.map((s, i) => <div key={i} className="small">• {s}</div>)}
        {r.label && <div style={{ marginTop: 6 }}><strong>Answer:</strong> {r.label}</div>}
        {r.warning && <div className="msg warn">{r.warning}</div>}
      </div>
      <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
        {glyphs.map((g, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <DirGlyph d={g.d} size={54} color={g.color} />
            <div className="tiny muted">{g.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DirectionTool({ initial = 'charge' }: { initial?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const [v, setV] = useState<DirWord>('right');
  const [B, setB] = useState<DirWord>('in');
  const [E, setE] = useState<DirWord>('down');
  const [sign, setSign] = useState<1 | -1>(1);
  const [field, setField] = useState<'in' | 'out'>('in');
  const [change, setChange] = useState<'increasing' | 'decreasing'>('increasing');
  const [same, setSame] = useState(true);

  let body: JSX.Element | null = null;
  if (mode === 'charge') {
    const r = magneticForceOnCharge(v, B, sign);
    body = (
      <>
        <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <DirPicker label="Velocity v" value={v} onChange={setV} />
          <DirPicker label="Magnetic field B" value={B} onChange={setB} />
          <div><label className="lbl">Charge</label><div className="seg"><button className={sign > 0 ? 'on' : ''} onClick={() => setSign(1)}>positive (p⁺, α)</button><button className={sign < 0 ? 'on' : ''} onClick={() => setSign(-1)}>negative (e⁻)</button></div></div>
        </div>
        <Result r={r} glyphs={[{ d: v, label: 'v', color: 'var(--accent-2)' }, { d: B, label: 'B', color: 'var(--accent)' }, ...(r.direction ? [{ d: r.direction, label: 'F', color: 'var(--answer)' }] : [])]} />
      </>
    );
  } else if (mode === 'motor') {
    const r = motorForce(v, B);
    body = (
      <>
        <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <DirPicker label="Conventional current I" value={v} onChange={setV} />
          <DirPicker label="Magnetic field B" value={B} onChange={setB} />
        </div>
        <Result r={r} glyphs={[{ d: v, label: 'I', color: 'var(--accent-2)' }, { d: B, label: 'B', color: 'var(--accent)' }, ...(r.direction ? [{ d: r.direction, label: 'F', color: 'var(--answer)' }] : [])]} />
      </>
    );
  } else if (mode === 'electric') {
    const r = electricForce(E, sign);
    body = (
      <>
        <div className="row" style={{ alignItems: 'flex-end', gap: 16 }}>
          <DirPicker label="Electric field E (+ plate → − plate)" value={E} onChange={setE} />
          <div><label className="lbl">Charge</label><div className="seg"><button className={sign > 0 ? 'on' : ''} onClick={() => setSign(1)}>positive</button><button className={sign < 0 ? 'on' : ''} onClick={() => setSign(-1)}>negative</button></div></div>
        </div>
        <Result r={r} glyphs={[{ d: E, label: 'E', color: 'var(--accent)' }, ...(r.direction ? [{ d: r.direction, label: 'F', color: 'var(--answer)' }] : [])]} />
      </>
    );
  } else if (mode === 'lenz') {
    const r = lenz(field, change);
    body = (
      <>
        <div className="row" style={{ gap: 16 }}>
          <div><label className="lbl">External field through the loop</label><div className="seg"><button className={field === 'in' ? 'on' : ''} onClick={() => setField('in')}>into page ⊗</button><button className={field === 'out' ? 'on' : ''} onClick={() => setField('out')}>out of page ⊙</button></div></div>
          <div><label className="lbl">Flux is</label><div className="seg"><button className={change === 'increasing' ? 'on' : ''} onClick={() => setChange('increasing')}>increasing</button><button className={change === 'decreasing' ? 'on' : ''} onClick={() => setChange('decreasing')}>decreasing</button></div></div>
        </div>
        <div className="grid2" style={{ marginTop: 10 }}>
          <div>{r.steps.map((s, i) => <div key={i} className="small">• {s}</div>)}<div style={{ marginTop: 6 }}><strong>Induced current:</strong> {r.label}</div></div>
          <svg viewBox="0 0 160 160" style={{ maxWidth: 170 }} role="img" aria-label={`induced current ${r.label}`}>
            <circle cx="80" cy="80" r="55" fill="none" stroke="var(--accent-2)" strokeWidth="3" />
            {r.label?.startsWith('clockwise')
              ? <polygon points="135,80 127,66 143,66" fill="var(--answer)" />
              : <polygon points="135,80 127,94 143,94" fill="var(--answer)" />}
            <g opacity="0.8">
              {[-25, 0, 25].map((dx) => [-25, 0, 25].map((dy) => (
                field === 'in'
                  ? <g key={`${dx}${dy}`} stroke="var(--accent)" strokeWidth="1.6"><line x1={80 + dx - 5} y1={80 + dy - 5} x2={80 + dx + 5} y2={80 + dy + 5} /><line x1={80 + dx - 5} y1={80 + dy + 5} x2={80 + dx + 5} y2={80 + dy - 5} /></g>
                  : <circle key={`${dx}${dy}`} cx={80 + dx} cy={80 + dy} r="2.5" fill="var(--accent)" />
              )))}
            </g>
            <text x="80" y="155" textAnchor="middle" fontSize="10" fill="var(--muted)">B {field === 'in' ? 'into' : 'out of'} page, {change}</text>
          </svg>
        </div>
      </>
    );
  } else {
    const r = wiresForce(same);
    body = (
      <>
        <div className="seg"><button className={same ? 'on' : ''} onClick={() => setSame(true)}>currents in same direction</button><button className={!same ? 'on' : ''} onClick={() => setSame(false)}>opposite directions</button></div>
        <div style={{ marginTop: 10 }}>{r.steps.map((s, i) => <div key={i} className="small">• {s}</div>)}<div style={{ marginTop: 6 }}><strong>Force:</strong> {r.label}</div></div>
      </>
    );
  }

  return (
    <div className="card dir-viz">
      <div className="card-h"><h3>Direction engine</h3><span className="badge">vectors</span></div>
      <p className="small muted">Page convention: right = +x, up the page = +y, ⊙ = out of the page, ⊗ = into the page. Negative charges experience forces opposite to those on positive charges.</p>
      <div className="tabs">
        {([['charge', 'Charge in B field'], ['motor', 'Current in B field'], ['electric', 'Charge in E field'], ['lenz', "Lenz's law"], ['wires', 'Parallel wires']] as Array<[Mode, string]>).map(([m, l]) => (
          <button key={m} className={`tab ${mode === m ? 'on' : ''}`} onClick={() => setMode(m)}>{l}</button>
        ))}
      </div>
      {body}
    </div>
  );
}
