import { useMemo, useState } from 'react';
import { FORMULAS, FORMULA_BY_ID } from '../../data/formulas/index';
import { Tex } from '../components/Tex';
import { SourceBadge } from '../components/SourceBadge';
import { compile, toLatex } from '../../engine/expr';
import { normSolution, Formula, SOURCE_LABELS, FormulaSource } from '../../engine/types';
import { QUANTITIES } from '../../engine/quantities';
import { unitLatex } from '../../engine/units';
import { TOPIC_BY_ID, MODULE_NAMES } from '../nav';
import { CONST } from '../../data/constants';

function haystack(f: Formula): string {
  return [f.name, f.id, f.equation, f.keywords.join(' '), f.syllabus, TOPIC_BY_ID[f.topic]?.label, Object.values(f.vars).map((v) => v.name).join(' '), f.whenToUse ?? '', MODULE_NAMES[f.module]].join(' ').toLowerCase();
}

export function FormulaCard({ f, onRelated }: { f: Formula; onRelated?: (id: string) => void }) {
  const symbols = Object.fromEntries(Object.entries(f.vars).map(([k, v]) => [k, v.symbol]));
  return (
    <div className="card formula-card" id={`f-${f.id}`}>
      <div className="card-h">
        <div>
          <h3>{f.name}</h3>
          <div className="row" style={{ gap: 6, marginTop: 4 }}>
            <span className="badge mod">Module {f.module}</span>
            <span className="badge">{TOPIC_BY_ID[f.topic]?.label ?? f.topic}</span>
            <SourceBadge source={f.source} />
            {f.onSheet && <span className="badge sheet">on formulae sheet</span>}
          </div>
        </div>
      </div>
      <div className="eq"><Tex block math={f.equation} /></div>
      <dl>
        <dt>Variables</dt>
        <dd>
          {Object.entries(f.vars).map(([k, v]) => {
            const q = QUANTITIES[v.q];
            const si = v.q === 'angle' ? '^{\\circ}\\ \\text{or rad}' : q.si && q.si !== '1' ? unitLatex(q.si) : '\\text{(no unit)}';
            return (
              <div key={k} className="small">
                <Tex math={v.symbol} /> — {v.name} [<Tex math={si} />]
                {v.constant && <span className="faint"> · constant: {CONST[v.constant]?.printed}</span>}
                {q.input.length > 1 && v.q !== 'angle' && !v.constant && <span className="faint"> · also {q.input.filter((u) => u !== q.si).slice(0, 5).join(', ')}</span>}
              </div>
            );
          })}
        </dd>
        <dt>Rearrangements</dt>
        <dd>
          {Object.entries(f.solve).map(([k, raw]) => {
            const sol = normSolution(raw);
            return (
              <div key={k} className="eq-line">
                <Tex math={`${f.vars[k].symbol} = ${sol.exprs.map((e) => toLatex(compile(e), { symbols })).join(sol.root === 'all' ? '\\ \\text{or}\\ ' : '\\ \\text{or}\\ ')}`} />
                {sol.exprs.length > 1 && sol.root !== 'all' && <span className="tiny faint"> (take the physically meaningful root)</span>}
                {sol.ambiguousSign && <span className="tiny faint"> (magnitude; sign from context)</span>}
              </div>
            );
          })}
        </dd>
        {f.derivation && (<><dt>Derivation</dt><dd>{f.derivation.map((d, i) => <Tex key={i} block math={d} />)}</dd></>)}
        {f.assumptions && (<><dt>Assumptions</dt><dd className="small">{f.assumptions.join(' ')}</dd></>)}
        {f.restrictions && (<><dt>Restrictions</dt><dd className="small">{f.restrictions.join(' ')}</dd></>)}
        {f.signNote && (<><dt>Direction / sign</dt><dd className="small">{f.signNote}</dd></>)}
        {f.whenToUse && (<><dt>When to use</dt><dd className="small">{f.whenToUse}</dd></>)}
        {f.whenNotToUse && (<><dt>When NOT to use</dt><dd className="small">{f.whenNotToUse}</dd></>)}
        {f.example && (<><dt>Example</dt><dd className="small">{f.example.q}<br /><strong>{f.example.a}</strong></dd></>)}
        {f.related && (<><dt>Related</dt><dd className="row" style={{ gap: 4 }}>{f.related.filter((r) => FORMULA_BY_ID[r]).map((r) => <button key={r} className="chip" onClick={() => onRelated?.(r)}>{FORMULA_BY_ID[r].name}</button>)}</dd></>)}
        <dt>Syllabus</dt><dd className="small muted">{f.syllabus}</dd>
        <dt>Source</dt><dd className="small">{SOURCE_LABELS[f.source]}</dd>
      </dl>
    </div>
  );
}

export function LibraryPage({ query }: { query: URLSearchParams }) {
  const [q, setQ] = useState('');
  const [mod, setMod] = useState<string>('');
  const [topic, setTopic] = useState<string>(query.get('topic') ?? '');
  const [src, setSrc] = useState<string>('');
  const list = useMemo(() => {
    const toks = q.toLowerCase().split(/\s+/).filter(Boolean);
    return FORMULAS.filter((f) => {
      if (mod && String(f.module) !== mod) return false;
      if (topic && f.topic !== topic) return false;
      if (src && f.source !== src) return false;
      if (!toks.length) return true;
      const h = haystack(f);
      return toks.every((t) => h.includes(t));
    });
  }, [q, mod, topic, src]);
  const jump = (id: string) => {
    setQ(''); setMod(''); setTopic(''); setSrc('');
    setTimeout(() => document.getElementById(`f-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 30);
  };
  return (
    <div>
      <div className="page-h">
        <div className="kicker">Formula Library</div>
        <h1>{FORMULAS.length} relationships for Modules 5–8</h1>
        <p>Every relationship shows its variables, SI units, all rearrangements, assumptions and a source classification. Try “centripetal force”, “Faraday”, “magnetic particle”, “photoelectric”, “Lorentz factor”, “half-life” or “binding energy”.</p>
      </div>
      <div className="card">
        <div className="row">
          <div className="search" style={{ flex: '2 1 240px' }}><input className="inp" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search formulas…" aria-label="Search formulas" /></div>
          <select className="inp" style={{ flex: '1 1 120px', width: 'auto' }} value={mod} onChange={(e) => setMod(e.target.value)}><option value="">All modules</option>{[5, 6, 7, 8].map((m) => <option key={m} value={m}>Module {m}</option>)}</select>
          <select className="inp" style={{ flex: '1 1 150px', width: 'auto' }} value={topic} onChange={(e) => setTopic(e.target.value)}><option value="">All topics</option>{Object.values(TOPIC_BY_ID).map((t) => <option key={t.id} value={t.id}>M{t.module} · {t.label}</option>)}</select>
          <select className="inp" style={{ flex: '1 1 150px', width: 'auto' }} value={src} onChange={(e) => setSrc(e.target.value)}><option value="">All sources</option>{(Object.keys(SOURCE_LABELS) as FormulaSource[]).map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}</select>
        </div>
        <div className="tiny faint" style={{ marginTop: 6 }}>{list.length} shown</div>
      </div>
      {list.map((f) => <FormulaCard key={f.id} f={f} onRelated={jump} />)}
      {list.length === 0 && <div className="msg info">No formulas match. Try fewer words.</div>}
    </div>
  );
}
