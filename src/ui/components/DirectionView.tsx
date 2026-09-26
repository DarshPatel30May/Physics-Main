import type { DirectionResult, DirWord } from '../../engine/direction';

export function DirGlyph({ d, color = 'var(--answer)', size = 46, label }: { d: DirWord; color?: string; size?: number; label?: string }) {
  const c = size / 2;
  const r = size * 0.36;
  const arrow = (dx: number, dy: number) => (
    <g stroke={color} strokeWidth={3} fill={color}>
      <line x1={c - dx * r} y1={c - dy * r} x2={c + dx * r * 0.7} y2={c + dy * r * 0.7} />
      <polygon points={`${c + dx * r},${c + dy * r} ${c + dx * r * 0.55 - dy * r * 0.3},${c + dy * r * 0.55 + dx * r * 0.3} ${c + dx * r * 0.55 + dy * r * 0.3},${c + dy * r * 0.55 - dx * r * 0.3}`} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label ?? d}>
      {d === 'right' && arrow(1, 0)}
      {d === 'left' && arrow(-1, 0)}
      {d === 'up' && arrow(0, -1)}
      {d === 'down' && arrow(0, 1)}
      {(d === 'out' || d === 'in') && <circle cx={c} cy={c} r={r} fill="none" stroke={color} strokeWidth={2.5} />}
      {d === 'out' && <circle cx={c} cy={c} r={r * 0.22} fill={color} />}
      {d === 'in' && (
        <g stroke={color} strokeWidth={2.5}>
          <line x1={c - r * 0.6} y1={c - r * 0.6} x2={c + r * 0.6} y2={c + r * 0.6} />
          <line x1={c - r * 0.6} y1={c + r * 0.6} x2={c + r * 0.6} y2={c - r * 0.6} />
        </g>
      )}
    </svg>
  );
}

export function DirectionView({ title, r }: { title: string; r: DirectionResult }) {
  return (
    <div className="card" style={{ padding: '10px 12px' }}>
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <strong className="small">{title}</strong>
        {r.direction && <DirGlyph d={r.direction} size={38} />}
      </div>
      {r.steps.map((s, i) => <div key={i} className="small">• {s}</div>)}
      {r.label && <div className="small" style={{ marginTop: 4 }}><strong>Direction:</strong> {r.label}</div>}
      {r.warning && <div className="msg warn">{r.warning}</div>}
    </div>
  );
}
