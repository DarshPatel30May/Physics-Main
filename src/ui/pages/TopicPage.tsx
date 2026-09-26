import { useState } from 'react';
import { TOPIC_BY_ID, MODULE_NAMES } from '../nav';
import { ScenarioCalculator } from '../components/ScenarioCalculator';
import { Tool } from '../tools/registry';
import { getScenario } from '../../data/scenarios/index';
import { FORMULAS } from '../../data/formulas/index';
import { Tex, Rich } from '../components/Tex';
import { SourceBadge } from '../components/SourceBadge';

export function TopicPage({ topicId, go }: { topicId: string; go: (r: string) => void }) {
  const t = TOPIC_BY_ID[topicId];
  const [active, setActive] = useState(0);
  if (!t) return <div className="msg err">Unknown topic.</div>;
  const scns = t.scenarios.map((id) => getScenario(id));
  const formulas = FORMULAS.filter((f) => f.topic === t.id);
  const idx = Math.min(active, Math.max(0, scns.length - 1));
  return (
    <div>
      <div className="page-h">
        <div className="kicker">Module {t.module} — {MODULE_NAMES[t.module]}</div>
        <h1>{t.label}</h1>
        <p className="small"><em>Inquiry question:</em> {t.inquiry}</p>
        <p><Rich text={t.summary} /></p>
      </div>
      {scns.length > 0 && (
        <>
          {scns.length > 1 && (
            <div className="tabs" role="tablist">
              {scns.map((s, i) => <button key={s.id} role="tab" aria-selected={i === idx} className={`tab ${i === idx ? 'on' : ''}`} onClick={() => setActive(i)}>{s.title}</button>)}
            </div>
          )}
          <ScenarioCalculator key={scns[idx].id} scenarioId={scns[idx].id} />
        </>
      )}
      {t.tools.map((tid) => <Tool key={tid} id={tid} topic={t.id} />)}
      {formulas.length > 0 && (
        <div className="card">
          <div className="card-h"><h3>Formulas for this topic</h3><button className="btn small" onClick={() => go(`library?topic=${t.id}`)}>Open in library</button></div>
          <div className="tbl-wrap"><table className="tbl"><tbody>
            {formulas.map((f) => (
              <tr key={f.id}><td style={{ minWidth: 160 }}><Tex math={f.equation} /></td><td className="small">{f.name}</td><td><SourceBadge source={f.source} /></td></tr>
            ))}
          </tbody></table></div>
        </div>
      )}
    </div>
  );
}
