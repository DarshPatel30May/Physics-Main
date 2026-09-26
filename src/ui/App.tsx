import { Component, ReactNode, useEffect, useState } from 'react';
import { AppStateProvider, useApp, isCustom } from './state';
import { useRoute } from './router';
import { TOPICS, MODULE_NAMES, PAGES } from './nav';
import { SmartSolverPage } from './pages/SmartSolverPage';
import { TopicPage } from './pages/TopicPage';
import { LibraryPage } from './pages/LibraryPage';
import { UnitConverterPage, ConstantsPage, DetectPage, CoveragePage, DirectionPage, AboutPage } from './pages/MiscPages';
import { SolutionView } from './components/SolutionView';
import type { SigFigMode } from '../engine/numbers';
import type { ModuleId } from '../engine/types';

function Logo() {
  return (
    <svg className="logo" viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="var(--panel)" stroke="var(--line-2)" />
      <ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#5eead4" strokeWidth="1.5" />
      <ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#7aa2ff" strokeWidth="1.5" transform="rotate(60 16 16)" />
      <ellipse cx="16" cy="16" rx="11" ry="4.5" fill="none" stroke="#f0abfc" strokeWidth="1.5" transform="rotate(120 16 16)" />
      <circle cx="16" cy="16" r="2.3" fill="#fbbf24" />
    </svg>
  );
}

function TopBar({ onMenu }: { onMenu: () => void }) {
  const { sig, setSig, mode, setMode, theme, setTheme } = useApp();
  return (
    <header className="topbar">
      <button className="btn small ghost menu-btn" onClick={onMenu} aria-label="Open navigation">☰</button>
      <div className="brand"><Logo /> <span className="brand-name">HSC Physics Solver</span> <small>Modules 5–8</small></div>
      <div className="spacer" />
      <div className="controls">
        <label className="small muted hide-sm" htmlFor="sigsel">Sig. figs</label>
        <select id="sigsel" className="inp" style={{ width: 'auto', padding: '3px 6px' }} value={String(sig)} onChange={(e) => { const v = e.target.value; setSig((v === 'auto' || v === 'full' ? v : Number(v)) as SigFigMode); }}>
          <option value="auto">Auto</option><option value="2">2 s.f.</option><option value="3">3 s.f.</option><option value="4">4 s.f.</option><option value="full">Full precision</option>
        </select>
        <div className="seg hide-sm" role="group" aria-label="Working detail">
          <button className={mode === 'quick' ? 'on' : ''} onClick={() => setMode('quick')}>Quick</button>
          <button className={mode === 'full' ? 'on' : ''} onClick={() => setMode('full')}>Full HSC</button>
        </div>
        <button className="btn small" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label="Toggle light/dark theme">{theme === 'dark' ? '☀' : '☾'}<span className="hide-sm">{theme === 'dark' ? ' Light' : ' Dark'}</span></button>
      </div>
    </header>
  );
}

function Sidebar({ route, go, open }: { route: string; go: (r: string) => void; open: boolean }) {
  const base = route.split('?')[0];
  return (
    <nav className={`sidebar ${open ? 'open' : ''}`} aria-label="Main navigation">
      <button className={`nav-item primary ${base === 'solver' ? 'active' : ''}`} onClick={() => go('solver')}><span className="dot" />Smart Solver</button>
      {([5, 6, 7, 8] as ModuleId[]).map((m) => (
        <div key={m} className="nav-group">
          <div className="nav-title"><span>Module {m}</span></div>
          <div className="tiny faint" style={{ padding: '0 10px 2px' }}>{MODULE_NAMES[m]}</div>
          {TOPICS.filter((t) => t.module === m).map((t) => (
            <button key={t.id} className={`nav-item ${base === `topic/${t.id}` ? 'active' : ''}`} onClick={() => go(`topic/${t.id}`)}><span className="dot" />{t.label}</button>
          ))}
        </div>
      ))}
      <div className="nav-group">
        <div className="nav-title"><span>Reference</span></div>
        {PAGES.map((p) => (
          <button key={p.id} className={`nav-item ${base === p.id ? 'active' : ''}`} onClick={() => go(p.id)}><span className="dot" />{p.label}</button>
        ))}
      </div>
    </nav>
  );
}

function Panel() {
  const { solution } = useApp();
  if (!solution) {
    return (
      <div className="empty-panel">
        <h3>Solution panel</h3>
        <p className="small">Solve a question in the Smart Solver or any calculator. The working appears here:</p>
        <ol className="small">
          <li>Given (with constants and their sources)</li>
          <li>Unit conversions to SI</li>
          <li>Formula(s) and rearrangement</li>
          <li>Substitution and each calculation step</li>
          <li>Unit / dimensional check</li>
          <li>Final answer with significant figures and equivalent units</li>
          <li>Direction reasoning (where relevant)</li>
        </ol>
        <p className="small">Switch between <strong>Quick</strong> and <strong>Full HSC</strong> working at the top.</p>
      </div>
    );
  }
  if (isCustom(solution)) return <div key={solution.id}>{solution.node}</div>;
  return <SolutionView key={solution.id} p={solution} />;
}

class Boundary extends Component<{ children: ReactNode; resetKey: string }, { err: Error | null }> {
  state = { err: null as Error | null };
  static getDerivedStateFromError(err: Error) { return { err }; }
  componentDidUpdate(prev: { resetKey: string }) { if (prev.resetKey !== this.props.resetKey && this.state.err) this.setState({ err: null }); }
  render() {
    if (this.state.err) return <div className="msg err">Something went wrong displaying this view: {this.state.err.message}. Please report the inputs that caused it.</div>;
    return this.props.children;
  }
}

function Shell() {
  const [route, go] = useRoute();
  const [open, setOpen] = useState(false);
  const [base, qs] = route.split('?');
  const query = new URLSearchParams(qs ?? '');
  useEffect(() => { setOpen(false); const el = document.querySelector('.main') as HTMLElement | null; if (el && typeof el.scrollTo === 'function') el.scrollTo({ top: 0 }); }, [route]);
  let page: JSX.Element;
  if (base === 'solver') page = <SmartSolverPage />;
  else if (base.startsWith('topic/')) page = <TopicPage key={base} topicId={base.slice(6)} go={go} />;
  else if (base === 'library') page = <LibraryPage key={route} query={query} />;
  else if (base === 'units') page = <UnitConverterPage />;
  else if (base === 'constants') page = <ConstantsPage />;
  else if (base === 'detect') page = <DetectPage />;
  else if (base === 'coverage') page = <CoveragePage />;
  else if (base === 'direction') page = <DirectionPage />;
  else if (base === 'about') page = <AboutPage />;
  else page = <div className="msg err">Page not found. <button className="btn small" onClick={() => go('solver')}>Go to the Smart Solver</button></div>;
  return (
    <div className="app">
      <TopBar onMenu={() => setOpen((o) => !o)} />
      <Sidebar route={route} go={go} open={open} />
      <main className="main"><Boundary resetKey={route}>{page}</Boundary></main>
      <aside className="panel-col" aria-label="Solution"><Boundary resetKey={route}><Panel /></Boundary></aside>
    </div>
  );
}

export function App() {
  return (
    <AppStateProvider>
      <Shell />
    </AppStateProvider>
  );
}
