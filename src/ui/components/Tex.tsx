import { memo, useMemo } from 'react';
import katex from 'katex';

export const Tex = memo(function Tex({ math, block = false, className }: { math: string; block?: boolean; className?: string }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, { displayMode: block, throwOnError: false, strict: 'ignore', output: 'html' });
    } catch {
      return math;
    }
  }, [math, block]);
  return <span className={`tex ${block ? 'tex-block' : ''} ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />;
});

/** Plain text where "K_max", "a_y", "V_s" become proper subscripts. */
function Subs({ text }: { text: string }) {
  const parts = text.split(/([A-Za-zλφεθΦΔμ][₀-₉]?_(?:\{[^}]+\}|[A-Za-z0-9]+))/g);
  return (
    <>
      {parts.map((p, i) => {
        const m = /^(.+?)_(?:\{([^}]+)\}|([A-Za-z0-9]+))$/.exec(p);
        return m ? <span key={i}>{m[1]}<sub>{m[2] ?? m[3]}</sub></span> : <span key={i}>{p}</span>;
      })}
    </>
  );
}

/** Plain text with inline $…$ LaTeX segments and simple x_y subscripts. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <Tex key={i} math={p.slice(1, -1)} /> : <Subs key={i} text={p} />))}
    </>
  );
}
