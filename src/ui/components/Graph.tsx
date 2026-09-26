import { useId, useMemo } from 'react';
import { formatSig } from '../../engine/numbers';

export interface Series {
  label: string;
  color: string;
  points: Array<[number, number]>;
  dashed?: boolean;
}

export interface Marker {
  x: number;
  y: number;
  label?: string;
  color?: string;
}

function niceStep(range: number, target: number): number {
  const raw = range / Math.max(1, target);
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const n = m < 1.5 ? 1 : m < 3 ? 2 : m < 7 ? 5 : 10;
  return n * p;
}

function ticks(min: number, max: number, count = 5): number[] {
  if (!(max > min)) return [min];
  const step = niceStep(max - min, count);
  const start = Math.ceil(min / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = start; v <= max + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

function fmtTick(v: number): string {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1e4 || a < 1e-2) return formatSig(v, 2).text;
  return String(Number(v.toPrecision(4)));
}

export function Graph({
  series, xLabel, yLabel, markers = [], height = 260, xMin, xMax, yMin, yMax, title,
}: {
  series: Series[]; xLabel: string; yLabel: string; markers?: Marker[]; height?: number;
  xMin?: number; xMax?: number; yMin?: number; yMax?: number; title?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const W = 640;
  const H = height;
  const pad = { l: 64, r: 16, t: 14, b: 42 };
  const bounds = useMemo(() => {
    const xs = series.flatMap((s) => s.points.map((p) => p[0])).concat(markers.map((m) => m.x)).filter(Number.isFinite);
    const ys = series.flatMap((s) => s.points.map((p) => p[1])).concat(markers.map((m) => m.y)).filter(Number.isFinite);
    let x0 = xMin ?? Math.min(...xs);
    let x1 = xMax ?? Math.max(...xs);
    let y0 = yMin ?? Math.min(0, ...ys);
    let y1 = yMax ?? Math.max(...ys);
    if (!(x1 > x0)) { x1 = x0 + 1; }
    if (!(y1 > y0)) { y1 = y0 + 1; }
    if (yMax === undefined) y1 += (y1 - y0) * 0.06;
    if (yMin === undefined && y0 < 0) y0 -= (y1 - y0) * 0.04;
    return { x0, x1, y0, y1 };
  }, [series, markers, xMin, xMax, yMin, yMax]);
  const sx = (x: number) => pad.l + ((x - bounds.x0) / (bounds.x1 - bounds.x0)) * (W - pad.l - pad.r);
  const sy = (y: number) => H - pad.b - ((y - bounds.y0) / (bounds.y1 - bounds.y0)) * (H - pad.t - pad.b);
  const xt = ticks(bounds.x0, bounds.x1, 6);
  const yt = ticks(bounds.y0, bounds.y1, 5);
  const path = (pts: Array<[number, number]>) => {
    let d = '';
    let pen = false;
    for (const [x, y] of pts) {
      if (!Number.isFinite(x) || !Number.isFinite(y) || y > bounds.y1 * 10 + 1e300 || y < bounds.y0 - Math.abs(bounds.y1 - bounds.y0) * 10) { pen = false; continue; }
      const yy = Math.max(pad.t - 2, Math.min(H - pad.b + 2, sy(y)));
      d += `${pen ? 'L' : 'M'}${sx(x).toFixed(1)},${yy.toFixed(1)}`;
      pen = true;
    }
    return d;
  };
  return (
    <div className="graph">
      {title && <div className="small muted" style={{ marginBottom: 4 }}>{title}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${yLabel} against ${xLabel}`}>
        <defs>
          <clipPath id={`clip${uid}`}><rect x={pad.l} y={pad.t} width={W - pad.l - pad.r} height={H - pad.t - pad.b} /></clipPath>
        </defs>
        {xt.map((t) => <line key={`gx${t}`} className="grid" x1={sx(t)} x2={sx(t)} y1={pad.t} y2={H - pad.b} />)}
        {yt.map((t) => <line key={`gy${t}`} className="grid" y1={sy(t)} y2={sy(t)} x1={pad.l} x2={W - pad.r} />)}
        <line className="axis" x1={pad.l} x2={W - pad.r} y1={sy(Math.max(bounds.y0, Math.min(0, bounds.y1)))} y2={sy(Math.max(bounds.y0, Math.min(0, bounds.y1)))} />
        <line className="axis" x1={pad.l} x2={pad.l} y1={pad.t} y2={H - pad.b} />
        {xt.map((t) => <text key={`tx${t}`} x={sx(t)} y={H - pad.b + 15} textAnchor="middle">{fmtTick(t)}</text>)}
        {yt.map((t) => <text key={`ty${t}`} x={pad.l - 6} y={sy(t) + 4} textAnchor="end">{fmtTick(t)}</text>)}
        <text className="lbl" x={(pad.l + W - pad.r) / 2} y={H - 6} textAnchor="middle">{xLabel}</text>
        <text className="lbl" transform={`translate(14 ${(pad.t + H - pad.b) / 2}) rotate(-90)`} textAnchor="middle">{yLabel}</text>
        <g clipPath={`url(#clip${uid})`}>
          {series.map((s, i) => <path key={i} d={path(s.points)} fill="none" stroke={s.color} strokeWidth={2.2} strokeDasharray={s.dashed ? '6 5' : undefined} />)}
        </g>
        {markers.map((m, i) => (
          <g key={i}>
            <circle cx={sx(m.x)} cy={sy(m.y)} r={4.5} fill={m.color ?? 'var(--answer)'} />
            {m.label && (sx(m.x) > W - 150
              ? <text x={sx(m.x) - 7} y={sy(m.y) - 7} textAnchor="end" style={{ fill: 'var(--text)' }}>{m.label}</text>
              : <text x={sx(m.x) + 7} y={sy(m.y) - 7} style={{ fill: 'var(--text)' }}>{m.label}</text>)}
          </g>
        ))}
      </svg>
      {series.length > 1 && (
        <div className="legend">{series.map((s, i) => <span key={i} style={{ ['--c' as string]: s.color }}>{s.label}</span>)}</div>
      )}
    </div>
  );
}

export function sample(f: (x: number) => number, x0: number, x1: number, n = 200): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    out.push([x, f(x)]);
  }
  return out;
}

export const COLORS = ['#5eead4', '#7aa2ff', '#f0abfc', '#fbbf24', '#f87171', '#4ade80'];
