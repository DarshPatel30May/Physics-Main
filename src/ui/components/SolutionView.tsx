import { Tex, Rich } from './Tex';
import { SourceBadge } from './SourceBadge';
import { useApp, SolutionPayload } from '../state';
import { formatAnswer, givenLines, constantLines, formatQty, siUnitOf } from '../format';
import type { Step } from '../../engine/solver';
import { DirectionView } from './DirectionView';
import { CONST } from '../../data/constants';

function StepView({ step, n, full }: { step: Step & { valueLatex: string }; n: number; full: boolean }) {
  const f = step.relation.formula;
  const scnSym = step.rearrangedLatex;
  const lhs = scnSym.split(' = ')[0];
  return (
    <div className="step">
      <div className="step-t">
        <span>Step {n}:</span> <span>{f.name}</span> <SourceBadge source={f.source} />
      </div>
      {step.relation.why && full && <div className="why"><Rich text={step.relation.why} /></div>}
      <div className="eqs">
        <Tex block math={f.equation} />
        {full && f.derivation && f.source !== 'NESA_FORMULA_SHEET' && (
          <details className="small">
            <summary className="muted">Where does this come from?</summary>
            {f.derivation.map((d, i) => <Tex key={i} block math={d} />)}
          </details>
        )}
        {(step.isRearranged || step.mapNote) && <Tex block math={step.rearrangedLatex} />}
        <Tex block math={`${lhs} = ${step.substitutionLatex}`} />
        <Tex block math={`${lhs} = ${step.valueLatex}`} />
      </div>
      {full && step.mapNote && <div className="tiny faint">Symbols: <Tex math={step.mapNote} /></div>}
      {step.notes.map((nt, i) => <div key={i} className="small muted">• <Rich text={nt} /></div>)}
      {full && (
        <details className="unit-check">
          <summary>
            Unit check {step.unitCheck.ok ? <span className="ok">✓</span> : <span className="bad">✗</span>}
          </summary>
          <div className="eq-line"><Tex math={`${lhs}:\\ ${step.unitCheck.latex} \\;\\to\\; ${step.unitCheck.resultLatex}`} /></div>
          <div className="tiny muted">Expected unit of <Tex math={lhs} />: <Tex math={step.unitCheck.expectedLatex} /> {step.unitCheck.ok ? '— consistent.' : '— MISMATCH.'}</div>
          {step.unitCheck.issues.map((x, i) => <div key={i} className="tiny pill-bad">{x}</div>)}
        </details>
      )}
    </div>
  );
}

export function SolutionView({ p }: { p: SolutionPayload }) {
  const { sig, mode, setMode } = useApp();
  const full = mode === 'full';
  const { scenario: scn, result, target } = p;
  const tv = target ? scn.vars[target] : null;
  const answer = target && result.ok ? formatAnswer(scn, target, result, sig, p.unitHint) : null;
  const givens = givenLines(scn, result);
  const consts = constantLines(scn, result);
  const stepsWithValue = result.steps.map((s) => ({ ...s, valueLatex: formatQty(scn.vars[s.unknown], s.value, scn.vars[s.unknown].q === 'angle' ? '°' : siUnitOf(scn.vars[s.unknown]), 4).latex }));

  return (
    <div className="sol">
      <div className="sol-h">
        <div>
          <div className="tiny faint">{p.source ?? `Module ${scn.module}`}</div>
          <h2>{p.title}</h2>
        </div>
        <div className="seg" role="group" aria-label="Working detail">
          <button className={!full ? 'on' : ''} onClick={() => setMode('quick')}>Quick</button>
          <button className={full ? 'on' : ''} onClick={() => setMode('full')}>Full HSC</button>
        </div>
      </div>

      {p.question && full && (
        <div className="sec">
          <div className="sec-t">Question</div>
          <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{p.question}</div>
        </div>
      )}

      {full && (
        <div className="sec">
          <div className="sec-t">Given</div>
          {givens.filter((g) => g.origin === 'given').map((g) => (
            <div key={g.key} className="given-row">
              <Tex math={`${g.symbolLatex} = ${g.valueLatex}`} /> <span className="nm">{g.name}</span>
              {g.note && <span className="tiny muted">({g.note})</span>}
            </div>
          ))}
          {givens.filter((g) => g.origin === 'constant').map((g) => (
            <div key={g.key} className="given-row">
              <Tex math={`${g.symbolLatex} = ${g.valueLatex}`} /> <span className="nm">{g.note ?? g.name}</span>
            </div>
          ))}
          {consts.length > 0 && (
            <>
              <div className="tiny faint" style={{ marginTop: 6 }}>Constants used</div>
              {consts.map((c, i) => (
                <div key={i} className="given-row">
                  <Tex math={`${c.symbolLatex} = ${c.valueLatex}`} />
                  <span className={`nm ${c.flagged ? 'pill-bad' : ''}`}>{c.source}</span>
                </div>
              ))}
            </>
          )}
          {result.assumptions.map((a) => (
            <div key={a.key} className="msg warn">Assumption: {a.note}</div>
          ))}
        </div>
      )}

      {full && tv && (
        <div className="sec">
          <div className="sec-t">Find</div>
          <div><Tex math={`${tv.symbol} = \\;?`} /> <span className="muted small">— {tv.name}</span></div>
        </div>
      )}

      {full && givens.some((g) => g.conversion) && (
        <div className="sec">
          <div className="sec-t">Unit conversions (to SI)</div>
          {givens.filter((g) => g.conversion).map((g) => (
            <div key={g.key} className="eq-line"><Tex math={`${g.symbolLatex} = ${g.conversion}`} /></div>
          ))}
        </div>
      )}

      {full && (scn.convention || (scn.assumptions && scn.assumptions.length > 0)) && result.ok && (
        <div className="sec">
          <div className="sec-t">Model & sign convention</div>
          {scn.convention && <div className="small"><Rich text={scn.convention} /></div>}
          {scn.assumptions?.map((a, i) => <div key={i} className="small muted">• <Rich text={a} /></div>)}
        </div>
      )}

      {result.errors.map((e, i) => <div key={i} className="msg err"><Rich text={e} /></div>)}
      {result.missing.length > 0 && tv && (
        <div className="msg info">
          To find <Tex math={tv.symbol} /> you also need {result.missing.length > 1 ? 'ONE of these' : ''}:
          <ul style={{ margin: '4px 0 0', paddingLeft: 18 }}>
            {result.missing.map((set, i) => (
              <li key={i}>{set.map((k, j) => <span key={k}>{j > 0 ? ' and ' : ''}<Tex math={scn.vars[k].symbol} /> ({scn.vars[k].name})</span>)}</li>
            ))}
          </ul>
        </div>
      )}

      {result.ok && stepsWithValue.length > 0 && (
        <div className="sec">
          <div className="sec-t">{full ? 'Working' : 'Formula → substitution → answer'}</div>
          {stepsWithValue.length > 1 && full && <div className="small muted">This is a {stepsWithValue.length}-step problem: each step produces a quantity used in the next. Values are carried at full precision; only the final answer is rounded.</div>}
          {stepsWithValue.map((s, i) => <StepView key={i} step={s as Step & { valueLatex: string }} n={i + 1} full={full} />)}
        </div>
      )}
      {result.ok && stepsWithValue.length === 0 && target && (
        <div className="msg info">The requested quantity was supplied directly (no calculation needed).</div>
      )}

      {result.warnings.map((w, i) => <div key={i} className="msg warn"><Rich text={w} /></div>)}

      {answer && tv && (
        <div className="answer">
          <div className="lab">Final answer</div>
          <div className="big"><Tex math={`${tv.symbol} = ${answer.main.latex}`} /></div>
          {answer.si && <div className="small">= <Tex math={answer.si.latex} /> (SI)</div>}
          {answer.equivalents.length > 0 && (
            <div className="eqv"><span>Also:</span>{answer.equivalents.map((e, i) => <Tex key={i} math={e.latex} />)}</div>
          )}
          {answer.magnitudeNote && <div className="small muted">{answer.magnitudeNote}</div>}
          <div className="tiny muted" style={{ marginTop: 4 }}>Significant figures: {answer.sigRule}</div>
        </div>
      )}

      {(p.directions?.length ?? 0) > 0 && (
        <div className="sec">
          <div className="sec-t">Direction (separate from magnitude)</div>
          {p.directions!.map((d, i) => <DirectionView key={i} title={d.title} r={d.result} />)}
        </div>
      )}

      {(result.postNotes.length > 0 || (p.extraNotes?.length ?? 0) > 0) && (
        <div className="sec">
          <div className="sec-t">Notes</div>
          {result.postNotes.map((n, i) => <div key={i} className="small">• <Rich text={n} /></div>)}
          {p.extraNotes?.map((n, i) => <div key={`x${i}`} className="small">• <Rich text={n} /></div>)}
        </div>
      )}

      {full && result.ok && result.steps.length > 0 && (
        <div className="sec">
          <div className="sec-t">Summary</div>
          <div className="small muted">
            {result.steps.map((s) => s.relation.formula.name).join(' → ')}. {tv && answer ? `Therefore ${tv.name} = ${answer.main.text}.` : ''}
          </div>
          {result.constantsUsed.some((k) => scn.vars[k].constant && CONST[scn.vars[k].constant!]?.source === 'REFERENCE_NOT_ON_SHEET') && (
            <div className="msg warn">A value that is NOT on the NESA data sheet was used — check whether the question supplies its own value.</div>
          )}
        </div>
      )}
    </div>
  );
}
