import { Dim, DIMLESS, dimMul, dimDiv, dimPow, dimEq, isDimless, dimToUnitText } from './dimensions';

/**
 * A tiny, deterministic expression language used for every formula rearrangement.
 * One source string gives us: numerical evaluation, LaTeX rendering, substituted
 * working, and automatic dimensional analysis.
 *
 * Grammar: + - * / ^ (right-assoc), unary minus, parentheses, function calls,
 * identifiers [A-Za-z_][A-Za-z0-9_]*, numbers (with e-notation), constant `pi`.
 */
export type Node =
  | { t: 'num'; v: number; raw: string }
  | { t: 'var'; name: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Node; b: Node }
  | { t: 'neg'; a: Node }
  | { t: 'call'; fn: string; args: Node[] };

const FUNCS = new Set(['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sqrt', 'ln', 'log10', 'exp', 'abs', 'floor', 'cbrt']);

type Tok = { k: 'num'; v: number; raw: string } | { k: 'id'; v: string } | { k: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (/\s/.test(ch)) { i++; continue; }
    const num = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(src.slice(i));
    if (num) { out.push({ k: 'num', v: Number(num[0]), raw: num[0] }); i += num[0].length; continue; }
    const id = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i));
    if (id) { out.push({ k: 'id', v: id[0] }); i += id[0].length; continue; }
    if ('+-*/^(),'.includes(ch)) { out.push({ k: 'op', v: ch }); i++; continue; }
    throw new Error(`Unexpected character '${ch}' in expression "${src}"`);
  }
  return out;
}

export function parseExpr(src: string): Node {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v !== undefined && !(t.k === 'op' && t.v === v))) throw new Error(`Parse error in "${src}" near token ${p}`);
    p++;
    return t;
  };
  const isOp = (v: string) => { const t = peek(); return !!t && t.k === 'op' && t.v === v; };

  function expr(): Node {
    let n = term();
    while (isOp('+') || isOp('-')) {
      const op = (eat() as { v: string }).v as '+' | '-';
      n = { t: 'bin', op, a: n, b: term() };
    }
    return n;
  }
  function term(): Node {
    let n = unary();
    while (isOp('*') || isOp('/')) {
      const op = (eat() as { v: string }).v as '*' | '/';
      n = { t: 'bin', op, a: n, b: unary() };
    }
    return n;
  }
  function unary(): Node {
    if (isOp('-')) { eat(); return { t: 'neg', a: unary() }; }
    if (isOp('+')) { eat(); return unary(); }
    return power();
  }
  function power(): Node {
    const base = atom();
    if (isOp('^')) { eat(); return { t: 'bin', op: '^', a: base, b: unary() }; }
    return base;
  }
  function atom(): Node {
    const t = peek();
    if (!t) throw new Error(`Unexpected end of "${src}"`);
    if (t.k === 'num') { p++; return { t: 'num', v: t.v, raw: t.raw }; }
    if (t.k === 'id') {
      p++;
      if (isOp('(') && FUNCS.has(t.v)) {
        eat('(');
        const args: Node[] = [expr()];
        while (isOp(',')) { eat(','); args.push(expr()); }
        eat(')');
        return { t: 'call', fn: t.v, args };
      }
      return { t: 'var', name: t.v };
    }
    if (t.k === 'op' && t.v === '(') { eat('('); const n = expr(); eat(')'); return n; }
    throw new Error(`Unexpected token in "${src}"`);
  }
  const n = expr();
  if (p !== toks.length) throw new Error(`Trailing tokens in "${src}"`);
  return n;
}

const cache = new Map<string, Node>();
export function compile(src: string): Node {
  let n = cache.get(src);
  if (!n) { n = parseExpr(src); cache.set(src, n); }
  return n;
}

export function freeVars(n: Node, acc = new Set<string>()): Set<string> {
  switch (n.t) {
    case 'var': if (n.name !== 'pi') acc.add(n.name); break;
    case 'bin': freeVars(n.a, acc); freeVars(n.b, acc); break;
    case 'neg': freeVars(n.a, acc); break;
    case 'call': n.args.forEach((a) => freeVars(a, acc)); break;
  }
  return acc;
}

export function evaluate(n: Node, scope: Record<string, number>): number {
  switch (n.t) {
    case 'num': return n.v;
    case 'var': {
      if (n.name === 'pi') return Math.PI;
      const v = scope[n.name];
      if (v === undefined) throw new Error(`Missing value for ${n.name}`);
      return v;
    }
    case 'neg': return -evaluate(n.a, scope);
    case 'bin': {
      const a = evaluate(n.a, scope);
      const b = evaluate(n.b, scope);
      switch (n.op) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return b === 0 ? NaN : a / b;
        case '^': return Math.pow(a, b);
      }
      break;
    }
    case 'call': {
      const v = n.args.map((a) => evaluate(a, scope));
      switch (n.fn) {
        case 'sin': return Math.sin(v[0]);
        case 'cos': return Math.cos(v[0]);
        case 'tan': return Math.tan(v[0]);
        case 'asin': return v[0] > 1 + 1e-12 || v[0] < -1 - 1e-12 ? NaN : Math.asin(Math.max(-1, Math.min(1, v[0])));
        case 'acos': return v[0] > 1 + 1e-12 || v[0] < -1 - 1e-12 ? NaN : Math.acos(Math.max(-1, Math.min(1, v[0])));
        case 'atan': return Math.atan(v[0]);
        case 'atan2': return Math.atan2(v[0], v[1]);
        case 'sqrt': return v[0] < 0 ? (v[0] > -1e-15 * Math.max(1, Math.abs(v[0])) ? 0 : NaN) : Math.sqrt(v[0]);
        case 'cbrt': return Math.cbrt(v[0]);
        case 'ln': return v[0] <= 0 ? NaN : Math.log(v[0]);
        case 'log10': return v[0] <= 0 ? NaN : Math.log10(v[0]);
        case 'exp': return Math.exp(v[0]);
        case 'abs': return Math.abs(v[0]);
        case 'floor': return Math.floor(v[0] + 1e-9);
      }
    }
  }
  throw new Error('Bad node');
}

/* ------------------------------------------------------------------ */
/* LaTeX rendering                                                      */
/* ------------------------------------------------------------------ */

const PREC: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2, neg: 3, '^': 4 };

function prec(n: Node): number {
  if (n.t === 'bin') return PREC[n.op];
  if (n.t === 'neg') return PREC.neg;
  return 10;
}

export interface LatexOptions {
  symbols: Record<string, string>;
  /** When provided, variables are replaced with these LaTeX strings (substitution mode). */
  values?: Record<string, string>;
}

const FN_LATEX: Record<string, string> = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan', asin: '\\sin^{-1}', acos: '\\cos^{-1}', atan: '\\tan^{-1}',
  ln: '\\ln', log10: '\\log_{10}',
};

function isSimple(n: Node): boolean {
  return n.t === 'var' || (n.t === 'num' && n.v >= 0);
}

export function toLatex(n: Node, opt: LatexOptions): string {
  const sub = !!opt.values;
  const L = (m: Node): string => toLatex(m, opt);
  const wrap = (s: string) => `\\left(${s}\\right)`;
  switch (n.t) {
    case 'num': return n.raw.includes('e') ? n.v.toString() : n.raw;
    case 'var': {
      if (n.name === 'pi') return '\\pi';
      if (sub && opt.values![n.name] !== undefined) return opt.values![n.name];
      return opt.symbols[n.name] ?? n.name;
    }
    case 'neg': {
      const inner = L(n.a);
      return prec(n.a) <= PREC['-'] || (sub && n.a.t === 'var') ? `-${wrap(inner)}` : `-${inner}`;
    }
    case 'bin': {
      if (n.op === '/') return `\\frac{${L(n.a)}}{${L(n.b)}}`;
      if (n.op === '^') {
        // x^(1/2) as sqrt
        if (n.b.t === 'bin' && n.b.op === '/' && n.b.a.t === 'num' && n.b.a.v === 1 && n.b.b.t === 'num' && n.b.b.v === 2) {
          return `\\sqrt{${L(n.a)}}`;
        }
        let base = L(n.a);
        const needParen = prec(n.a) < 10 || n.a.t === 'call' || (sub && n.a.t === 'var');
        if (needParen) base = wrap(base);
        return `${base}^{${L(n.b)}}`;
      }
      if (n.op === '*') {
        const la = prec(n.a) < PREC['*'] ? wrap(L(n.a)) : L(n.a);
        let lb = prec(n.b) < PREC['*'] || n.b.t === 'neg' ? wrap(L(n.b)) : L(n.b);
        if (sub) {
          const subA = n.a.t === 'var' && n.a.name !== 'pi' ? wrap(L(n.a)) : la;
          const subB = n.b.t === 'var' && n.b.name !== 'pi' ? wrap(L(n.b)) : lb;
          const needTimes = /^[\d.]/.test(subB) || /\d$/.test(subA) && /^[\d]/.test(subB);
          return needTimes ? `${subA} \\times ${subB}` : `${subA}${subB}`;
        }
        const startsDigit = /^[\d.]/.test(lb);
        if (startsDigit) return `${la} \\times ${lb}`;
        if (n.b.t === 'call' || n.a.t === 'call') lb = ' ' + lb;
        return `${la}${/[a-zA-Z}]$/.test(la) && /^[a-zA-Z]/.test(lb) ? ' ' : ''}${lb}`;
      }
      // + and -
      const la = L(n.a);
      let lb = L(n.b);
      if (n.op === '-' && prec(n.b) <= PREC['-']) lb = wrap(lb);
      if (sub && lb.startsWith('-')) lb = wrap(lb);
      return `${la} ${n.op} ${lb}`;
    }
    case 'call': {
      const args = n.args.map(L);
      switch (n.fn) {
        case 'sqrt': return `\\sqrt{${args[0]}}`;
        case 'cbrt': return `\\sqrt[3]{${args[0]}}`;
        case 'abs': return `\\left|${args[0]}\\right|`;
        case 'exp': return `e^{${args[0]}}`;
        case 'floor': return `\\left\\lfloor ${args[0]} \\right\\rfloor`;
        case 'atan2': return `\\tan^{-1}\\left(\\frac{${args[0]}}{${args[1]}}\\right)`;
        default: {
          const f = FN_LATEX[n.fn] ?? `\\operatorname{${n.fn}}`;
          if (!sub && n.args[0] && isSimple(n.args[0])) return `${f} ${args[0]}`;
          return `${f}\\left(${args[0]}\\right)`;
        }
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Dimensional analysis                                                 */
/* ------------------------------------------------------------------ */

export interface DimResult {
  dim: Dim;
  issues: string[];
}

function constValueOf(n: Node): number | null {
  if (freeVars(n).size === 0) {
    try { return evaluate(n, {}); } catch { return null; }
  }
  return null;
}

export function dimOf(n: Node, dims: Record<string, Dim>): DimResult {
  const issues: string[] = [];
  const rec = (m: Node): Dim => {
    switch (m.t) {
      case 'num': return DIMLESS;
      case 'var': {
        if (m.name === 'pi') return DIMLESS;
        const d = dims[m.name];
        if (!d) { issues.push(`No dimension for ${m.name}`); return DIMLESS; }
        return d;
      }
      case 'neg': return rec(m.a);
      case 'bin': {
        const a = rec(m.a);
        if (m.op === '^') {
          const e = constValueOf(m.b);
          if (e === null) {
            const b = rec(m.b);
            if (!isDimless(a) || !isDimless(b)) issues.push('Non-constant exponent applied to a dimensional quantity');
            return DIMLESS;
          }
          return dimPow(a, e);
        }
        const b = rec(m.b);
        if (m.op === '*') return dimMul(a, b);
        if (m.op === '/') return dimDiv(a, b);
        if (!dimEq(a, b)) issues.push(`Adding/subtracting unlike quantities: ${dimToUnitText(a)} and ${dimToUnitText(b)}`);
        return a;
      }
      case 'call': {
        const ds = m.args.map(rec);
        switch (m.fn) {
          case 'sqrt': return dimPow(ds[0], 0.5);
          case 'cbrt': return dimPow(ds[0], 1 / 3);
          case 'abs': case 'floor': return ds[0];
          case 'atan2':
            if (!dimEq(ds[0], ds[1])) issues.push('atan2 arguments must have the same dimension');
            return DIMLESS;
          default:
            if (!isDimless(ds[0])) issues.push(`${m.fn}() applied to a quantity with units ${dimToUnitText(ds[0])}`);
            return DIMLESS;
        }
      }
    }
  };
  const d = rec(n);
  return { dim: d, issues };
}
