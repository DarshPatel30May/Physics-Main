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

/** Plain text with inline $…$ LaTeX segments. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g);
  return (
    <>
      {parts.map((p, i) => (p.startsWith('$') && p.endsWith('$') && p.length > 2 ? <Tex key={i} math={p.slice(1, -1)} /> : <span key={i}>{p}</span>))}
    </>
  );
}
