import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { SigFigMode } from '../engine/numbers';
import type { ResolvedScenario } from '../engine/scenario';
import type { FullSolveResult } from '../engine/solver';
import type { DirectionResult } from '../engine/direction';

export type WorkingMode = 'quick' | 'full';
export type Theme = 'dark' | 'light';

export interface SolutionPayload {
  id: number;
  title: string;
  scenario: ResolvedScenario;
  result: FullSolveResult;
  target: string | null;
  unitHint?: string;
  source?: string; // e.g. "Smart Solver" / scenario title
  question?: string;
  directions?: Array<{ title: string; result: DirectionResult }>;
  extraNotes?: string[];
  autoNotes?: string[];
}

export interface CustomPanel {
  id: number;
  title: string;
  node: ReactNode;
}

interface Ctx {
  sig: SigFigMode;
  setSig: (s: SigFigMode) => void;
  mode: WorkingMode;
  setMode: (m: WorkingMode) => void;
  theme: Theme;
  setTheme: (t: Theme) => void;
  solution: SolutionPayload | CustomPanel | null;
  show: (p: Omit<SolutionPayload, 'id'>) => void;
  showCustom: (title: string, node: ReactNode) => void;
  clear: () => void;
}

const C = createContext<Ctx | null>(null);

function load<T>(k: string, d: T): T {
  try {
    const v = localStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : d;
  } catch {
    return d;
  }
}
function save(k: string, v: unknown) {
  try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignore */ }
}

let counter = 1;

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [sig, setSigS] = useState<SigFigMode>(() => load('hsc.sig', 'auto' as SigFigMode));
  const [mode, setModeS] = useState<WorkingMode>(() => load('hsc.mode', 'full' as WorkingMode));
  const [theme, setThemeS] = useState<Theme>(() => load('hsc.theme', 'dark' as Theme));
  const [solution, setSolution] = useState<SolutionPayload | CustomPanel | null>(null);
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const value: Ctx = {
    sig, mode, theme, solution,
    setSig: (s) => { setSigS(s); save('hsc.sig', s); },
    setMode: (m) => { setModeS(m); save('hsc.mode', m); },
    setTheme: (t) => { setThemeS(t); save('hsc.theme', t); },
    show: (p) => setSolution({ ...p, id: counter++ }),
    showCustom: (title, node) => setSolution({ id: counter++, title, node }),
    clear: () => setSolution(null),
  };
  return <C.Provider value={value}>{children}</C.Provider>;
}

export function useApp(): Ctx {
  const c = useContext(C);
  if (!c) throw new Error('AppState missing');
  return c;
}

export function isCustom(p: SolutionPayload | CustomPanel | null): p is CustomPanel {
  return !!p && 'node' in p;
}
