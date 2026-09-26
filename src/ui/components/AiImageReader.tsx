import { useRef, useState } from 'react';
import type { ImageReading } from '../../nlp/vision';

function load(): string {
  try { return localStorage.getItem('hsc.ai.key') ?? ''; } catch { return ''; }
}

/** Optional: read a question screenshot (including diagram labels) with the student's own API key. */
export function AiImageReader({ onUse }: { onUse: (text: string) => void }) {
  const [key, setKey] = useState(load);
  const [remember, setRemember] = useState(() => load() !== '');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [reading, setReading] = useState<ImageReading | null>(null);
  const [keep, setKeep] = useState<boolean[]>([]);
  const [keepDir, setKeepDir] = useState<boolean[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = async (f: File) => {
    setErr(''); setReading(null); setBusy(true);
    try {
      try { if (remember) localStorage.setItem('hsc.ai.key', key); else localStorage.removeItem('hsc.ai.key'); } catch { /* ignore */ }
      const { readQuestionImage } = await import('../../nlp/vision');
      const r = await readQuestionImage(f, key.trim());
      setReading(r);
      setKeep(r.diagram_values.map((v) => v.confidence !== 'low'));
      setKeepDir(r.diagram_directions.map((d) => d.confidence !== 'low'));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const use = async () => {
    if (!reading) return;
    const { diagramSentences } = await import('../../nlp/vision');
    const extra = diagramSentences(reading.diagram_values.filter((_, i) => keep[i]), reading.diagram_directions.filter((_, i) => keepDir[i]));
    onUse(`${reading.question_text}${extra ? `\n${extra}` : ''}`);
  };

  return (
    <details className="more">
      <summary>Read a screenshot with its diagram using AI (optional, uses your own Anthropic API key)</summary>
      <div className="small muted" style={{ marginBottom: 6 }}>
        The AI only transcribes the question and labelled diagram values — every number is still calculated by the deterministic engine. You confirm each diagram value before it is used; uncertain readings are flagged and unticked. Your key is sent only to the Anthropic API, and is stored in this browser only if you tick “remember”.
      </div>
      <div className="row">
        <input className="inp mono" type="password" style={{ flex: '1 1 240px' }} placeholder="sk-ant-…" value={key} onChange={(e) => setKey(e.target.value)} aria-label="Anthropic API key" autoComplete="off" />
        <label className="small"><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> remember on this device</label>
        <button className="btn" disabled={!key.trim() || busy} onClick={() => fileRef.current?.click()}>{busy ? 'Reading…' : 'Choose image…'}</button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void run(f); e.target.value = ''; }} />
      </div>
      {err && <div className="msg err">{err}</div>}
      {reading && (
        <div style={{ marginTop: 8 }}>
          <div className="small"><strong>Transcribed question</strong></div>
          <div className="small" style={{ whiteSpace: 'pre-wrap', border: '1px solid var(--line)', borderRadius: 6, padding: 6 }}>{reading.question_text || '(no text found)'}</div>
          {reading.diagram_values.length > 0 && (
            <>
              <div className="small" style={{ marginTop: 6 }}><strong>Values read from the diagram</strong> — untick anything that is wrong</div>
              {reading.diagram_values.map((v, i) => (
                <label key={i} className="small" style={{ display: 'block' }}>
                  <input type="checkbox" checked={!!keep[i]} onChange={(e) => setKeep((k) => k.map((x, j) => (j === i ? e.target.checked : x)))} />{' '}
                  {v.label} = {v.value} {v.unit} — {v.meaning} <span className={v.confidence === 'low' ? 'pill-bad' : 'faint'}>({v.confidence} confidence)</span>
                </label>
              ))}
            </>
          )}
          {reading.diagram_directions.length > 0 && (
            <>
              <div className="small" style={{ marginTop: 6 }}><strong>Directions shown in the diagram</strong></div>
              {reading.diagram_directions.map((d, i) => (
                <label key={i} className="small" style={{ display: 'block' }}>
                  <input type="checkbox" checked={!!keepDir[i]} onChange={(e) => setKeepDir((k) => k.map((x, j) => (j === i ? e.target.checked : x)))} />{' '}
                  {d.quantity}: {d.direction} <span className={d.confidence === 'low' ? 'pill-bad' : 'faint'}>({d.confidence} confidence)</span>
                </label>
              ))}
            </>
          )}
          {reading.uncertainties.map((u, i) => <div key={i} className="msg warn">Uncertain: {u}</div>)}
          <button className="btn primary small" style={{ marginTop: 6 }} onClick={() => void use()}>Use this text (then press Solve)</button>
        </div>
      )}
    </details>
  );
}
