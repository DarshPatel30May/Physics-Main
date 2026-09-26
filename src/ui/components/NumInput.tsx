import { parseNumber } from '../../engine/numbers';

export function num(text: string, fallback = NaN): number {
  const p = parseNumber(text);
  return p ? p.value : fallback;
}

export function NumInput({ label, value, onChange, unit, width, title }: { label: React.ReactNode; value: string; onChange: (v: string) => void; unit?: string; width?: number; title?: string }) {
  const bad = value.trim() !== '' && !parseNumber(value);
  return (
    <div style={{ minWidth: width ?? 110, flex: `1 1 ${width ?? 110}px` }} title={title}>
      <label className="lbl">{label}{unit ? <span className="faint"> ({unit})</span> : null}</label>
      <input className={`inp mono ${bad ? 'bad' : ''}`} value={value} onChange={(e) => onChange(e.target.value)} inputMode="decimal" />
    </div>
  );
}
