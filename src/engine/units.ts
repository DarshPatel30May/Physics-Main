import { Dim, dim, dimMul, dimPow, DIMLESS, dimEq } from './dimensions';
import { CONST } from '../data/constants';
import type { QuantityKind } from './quantities';

/**
 * Universal unit engine.
 * Every unit converts to coherent SI via  SI = value × factor + offset.
 * Offsets only exist for °C (temperature); compound units with offsets are rejected.
 */
export interface UnitDef {
  factor: number;
  dim: Dim;
  latex: string;
  offset?: number;
}

interface BaseUnit {
  sym: string;
  factor: number;
  dim: Dim;
  latex: string;
  prefixes?: string; // allowed prefix letters
  offset?: number;
}

const PREFIX: Record<string, { f: number; latex: string }> = {
  f: { f: 1e-15, latex: 'f' },
  p: { f: 1e-12, latex: 'p' },
  n: { f: 1e-9, latex: 'n' },
  μ: { f: 1e-6, latex: '\\mu ' },
  u: { f: 1e-6, latex: '\\mu ' },
  m: { f: 1e-3, latex: 'm' },
  c: { f: 1e-2, latex: 'c' },
  k: { f: 1e3, latex: 'k' },
  M: { f: 1e6, latex: 'M' },
  G: { f: 1e9, latex: 'G' },
  T: { f: 1e12, latex: 'T' },
};

const e = CONST.e.value;
const c = CONST.c.value;

const BASES: BaseUnit[] = [
  { sym: 'm', factor: 1, dim: dim(0, 1), latex: 'm', prefixes: 'fpnμumck' },
  { sym: 'g', factor: 1e-3, dim: dim(1), latex: 'g', prefixes: 'μumk' },
  { sym: 't', factor: 1e3, dim: dim(1), latex: 't' },
  { sym: 'u', factor: CONST.u.value, dim: dim(1), latex: 'u' },
  { sym: 's', factor: 1, dim: dim(0, 0, 1), latex: 's', prefixes: 'pnμum' },
  { sym: 'min', factor: 60, dim: dim(0, 0, 1), latex: 'min' },
  { sym: 'h', factor: 3600, dim: dim(0, 0, 1), latex: 'h' },
  { sym: 'hr', factor: 3600, dim: dim(0, 0, 1), latex: 'h' },
  { sym: 'day', factor: 86400, dim: dim(0, 0, 1), latex: 'day' },
  { sym: 'yr', factor: 365.25 * 86400, dim: dim(0, 0, 1), latex: 'y', prefixes: 'kMG' },
  { sym: 'A', factor: 1, dim: dim(0, 0, 0, 1), latex: 'A', prefixes: 'μumk' },
  { sym: 'K', factor: 1, dim: dim(0, 0, 0, 0, 1), latex: 'K' },
  { sym: '°C', factor: 1, dim: dim(0, 0, 0, 0, 1), latex: '^{\\circ}C', offset: 273.15 },
  { sym: 'mol', factor: 1, dim: dim(0, 0, 0, 0, 0, 1), latex: 'mol' },
  { sym: 'N', factor: 1, dim: dim(1, 1, -2), latex: 'N', prefixes: 'μumkM' },
  { sym: 'J', factor: 1, dim: dim(1, 2, -2), latex: 'J', prefixes: 'μumkMGT' },
  { sym: 'eV', factor: e, dim: dim(1, 2, -2), latex: 'eV', prefixes: 'mkMGT' },
  { sym: 'W', factor: 1, dim: dim(1, 2, -3), latex: 'W', prefixes: 'μumkMGT' },
  { sym: 'Hz', factor: 1, dim: dim(0, 0, -1), latex: 'Hz', prefixes: 'kMGT' },
  { sym: 'Bq', factor: 1, dim: dim(0, 0, -1), latex: 'Bq', prefixes: 'kMGT' },
  { sym: 'Ci', factor: 3.7e10, dim: dim(0, 0, -1), latex: 'Ci', prefixes: 'μum' },
  { sym: 'C', factor: 1, dim: dim(0, 0, 1, 1), latex: 'C', prefixes: 'pnμum' },
  { sym: 'V', factor: 1, dim: dim(1, 2, -3, -1), latex: 'V', prefixes: 'μumkM' },
  { sym: 'T', factor: 1, dim: dim(1, 0, -2, -1), latex: 'T', prefixes: 'pnμum' },
  { sym: 'Wb', factor: 1, dim: dim(1, 2, -2, -1), latex: 'Wb', prefixes: 'μum' },
  { sym: 'Ω', factor: 1, dim: dim(1, 2, -3, -2), latex: '\\Omega', prefixes: 'mkM' },
  { sym: 'ohm', factor: 1, dim: dim(1, 2, -3, -2), latex: '\\Omega', prefixes: 'mkM' },
  { sym: 'F', factor: 1, dim: dim(-1, -2, 4, 2), latex: 'F', prefixes: 'pnμum' },
  { sym: 'Pa', factor: 1, dim: dim(1, -1, -2), latex: 'Pa', prefixes: 'kMG' },
  { sym: 'L', factor: 1e-3, dim: dim(0, 3), latex: 'L', prefixes: 'm' },
  { sym: 'rad', factor: 1, dim: DIMLESS, latex: 'rad', prefixes: 'm' },
  { sym: '°', factor: Math.PI / 180, dim: DIMLESS, latex: '^{\\circ}' },
  { sym: 'deg', factor: Math.PI / 180, dim: DIMLESS, latex: '^{\\circ}' },
  { sym: 'rev', factor: 2 * Math.PI, dim: DIMLESS, latex: 'rev' },
  { sym: 'rpm', factor: (2 * Math.PI) / 60, dim: dim(0, 0, -1), latex: 'rpm' },
  { sym: 'c', factor: c, dim: dim(0, 1, -1), latex: 'c' },
  { sym: 'e', factor: e, dim: dim(0, 0, 1, 1), latex: 'e' },
  { sym: 'AU', factor: CONST.AU.value, dim: dim(0, 1), latex: 'AU' },
  { sym: 'ly', factor: CONST.ly.value, dim: dim(0, 1), latex: 'ly' },
  { sym: 'pc', factor: CONST.pc.value, dim: dim(0, 1), latex: 'pc', prefixes: 'kMG' },
  { sym: '%', factor: 0.01, dim: DIMLESS, latex: '\\%' },
  { sym: 'lines', factor: 1, dim: DIMLESS, latex: 'lines' },
  { sym: 'line', factor: 1, dim: DIMLESS, latex: 'lines' },
  { sym: 'slits', factor: 1, dim: DIMLESS, latex: 'slits' },
  { sym: 'turns', factor: 1, dim: DIMLESS, latex: 'turns' },
  { sym: 'nuclei', factor: 1, dim: DIMLESS, latex: 'nuclei' },
  { sym: 'photons', factor: 1, dim: DIMLESS, latex: 'photons' },
  { sym: '1', factor: 1, dim: DIMLESS, latex: '' },
];

/** Written unit words → symbols (used by parser and free-text solver). */
export const UNIT_WORDS: Record<string, string> = {
  metre: 'm', metres: 'm', meter: 'm', meters: 'm',
  kilometre: 'km', kilometres: 'km', kilometer: 'km', kilometers: 'km',
  centimetre: 'cm', centimetres: 'cm', centimeter: 'cm', centimeters: 'cm',
  millimetre: 'mm', millimetres: 'mm', millimeter: 'mm', millimeters: 'mm',
  micrometre: 'μm', micrometres: 'μm', micrometer: 'μm', micrometers: 'μm', micron: 'μm', microns: 'μm',
  nanometre: 'nm', nanometres: 'nm', nanometer: 'nm', nanometers: 'nm',
  picometre: 'pm', picometres: 'pm', picometer: 'pm', picometers: 'pm',
  femtometre: 'fm', femtometres: 'fm',
  second: 's', seconds: 's', sec: 's', secs: 's',
  millisecond: 'ms', milliseconds: 'ms', microsecond: 'μs', microseconds: 'μs', nanosecond: 'ns', nanoseconds: 'ns',
  minute: 'min', minutes: 'min', mins: 'min', hour: 'h', hours: 'h', hrs: 'h',
  days: 'day', year: 'yr', years: 'yr', yrs: 'yr',
  kilogram: 'kg', kilograms: 'kg', gram: 'g', grams: 'g', milligram: 'mg', milligrams: 'mg', tonne: 't', tonnes: 't',
  newton: 'N', newtons: 'N', kilonewton: 'kN', kilonewtons: 'kN',
  joule: 'J', joules: 'J', kilojoule: 'kJ', kilojoules: 'kJ', megajoule: 'MJ', megajoules: 'MJ',
  electronvolt: 'eV', electronvolts: 'eV', 'electron-volt': 'eV', 'electron-volts': 'eV',
  watt: 'W', watts: 'W', kilowatt: 'kW', kilowatts: 'kW', megawatt: 'MW', megawatts: 'MW', gigawatt: 'GW', gigawatts: 'GW',
  hertz: 'Hz', kilohertz: 'kHz', megahertz: 'MHz', gigahertz: 'GHz', terahertz: 'THz',
  coulomb: 'C', coulombs: 'C', microcoulomb: 'μC', microcoulombs: 'μC', nanocoulomb: 'nC', nanocoulombs: 'nC',
  ampere: 'A', amperes: 'A', amp: 'A', amps: 'A', milliampere: 'mA', milliamperes: 'mA', milliamps: 'mA',
  volt: 'V', volts: 'V', kilovolt: 'kV', kilovolts: 'kV', millivolt: 'mV', millivolts: 'mV', megavolt: 'MV', megavolts: 'MV',
  tesla: 'T', teslas: 'T', millitesla: 'mT', milliteslas: 'mT', microtesla: 'μT', microteslas: 'μT',
  weber: 'Wb', webers: 'Wb',
  ohm: 'Ω', ohms: 'Ω', kilohm: 'kΩ', kilohms: 'kΩ', megohm: 'MΩ', megohms: 'MΩ',
  kelvin: 'K', degree: '°', degrees: '°', radian: 'rad', radians: 'rad',
  becquerel: 'Bq', becquerels: 'Bq', pascal: 'Pa', pascals: 'Pa',
  percent: '%', 'per cent': '%',
};

const BASE_BY_SYM = new Map<string, BaseUnit>(BASES.map((b) => [b.sym, b]));

interface Atom {
  factor: number;
  dim: Dim;
  latex: string;
  offset?: number;
}

function lookupAtom(tok: string): Atom | null {
  if (UNIT_WORDS[tok]) tok = UNIT_WORDS[tok];
  if (UNIT_WORDS[tok.toLowerCase()] && tok.length > 3) tok = UNIT_WORDS[tok.toLowerCase()];
  const direct = BASE_BY_SYM.get(tok);
  if (direct) return { factor: direct.factor, dim: direct.dim, latex: direct.latex, offset: direct.offset };
  // prefix + base (longest base first)
  for (let i = 1; i < tok.length; i++) {
    const p = tok.slice(0, i);
    const b = BASE_BY_SYM.get(tok.slice(i));
    const pre = PREFIX[p];
    if (b && pre && b.prefixes && b.prefixes.includes(p)) {
      return { factor: pre.f * b.factor, dim: b.dim, latex: pre.latex + b.latex };
    }
  }
  return null;
}

const SUPERSCRIPT: Record<string, string> = {
  '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '+',
};

export function normaliseSuperscripts(s: string): string {
  return s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + m.split('').map((ch) => SUPERSCRIPT[ch]).join(''));
}

/**
 * Parse a (possibly compound) unit string, e.g. "m/s", "m s^-1", "N m² kg⁻²", "km/s/Mpc",
 * "J/(kg K)", "kg m s-2", "lines/mm". Returns null if any part is unrecognised.
 */
export function parseUnit(raw: string): UnitDef | null {
  let s = normaliseSuperscripts(raw.trim())
    .replace(/µ/g, 'μ')
    .replace(/Ω|Ω/g, 'Ω')
    .replace(/\s*per\s+/gi, '/')
    .replace(/[·⋅×*]/g, ' ')
    .replace(/−/g, '-')
    .replace(/\s+/g, ' ');
  if (s === '' || s === '1') return { factor: 1, dim: DIMLESS, latex: '' };
  if (/^(degrees?|°)$/i.test(s)) s = '°';
  // tokenise into atoms, '/', '(', ')'
  const tokens: string[] = [];
  const re = /\s*([()/]|[^\s()/^]+(?:\^\s*[-+]?\d+(?:\.\d+)?)?)/gy;
  let m: RegExpExecArray | null;
  let pos = 0;
  while (pos < s.length) {
    re.lastIndex = pos;
    m = re.exec(s);
    if (!m) return null;
    tokens.push(m[1]);
    pos = re.lastIndex;
    while (s[pos] === ' ') pos++;
  }
  let factor = 1;
  let d: Dim = DIMLESS;
  let offset: number | undefined;
  const num: string[] = [];
  const den: string[] = [];
  let atomCount = 0;
  let i = 0;
  const applyAtom = (tok: string, sign: number): boolean => {
    const em = tok.match(/^(.*?)(?:\^\s*([-+]?\d+(?:\.\d+)?)|([-+]?\d+))$/);
    let base = tok;
    let exp = 1;
    if (em && em[1] !== '' && (em[2] !== undefined || em[3] !== undefined)) {
      base = em[1];
      exp = Number(em[2] ?? em[3]);
    }
    const a = lookupAtom(base);
    if (!a) return false;
    atomCount++;
    if (a.offset !== undefined) offset = a.offset;
    const e2 = exp * sign;
    factor *= Math.pow(a.factor, e2);
    d = dimMul(d, dimPow(a.dim, e2));
    if (a.latex) {
      const target = e2 > 0 ? num : den;
      const ae = Math.abs(e2);
      target.push(ae === 1 ? a.latex : `${a.latex}^{${ae}}`);
    }
    return true;
  };
  while (i < tokens.length) {
    const t = tokens[i];
    if (t === '/') {
      const nx = tokens[i + 1];
      if (nx === '(') {
        let j = i + 2;
        while (j < tokens.length && tokens[j] !== ')') {
          if (!applyAtom(tokens[j], -1)) return null;
          j++;
        }
        if (tokens[j] !== ')') return null;
        i = j + 1;
      } else {
        if (!nx || !applyAtom(nx, -1)) return null;
        i += 2;
      }
    } else if (t === '(' || t === ')') {
      i++;
    } else {
      if (!applyAtom(t, 1)) return null;
      i++;
    }
  }
  if (offset !== undefined && atomCount > 1) return null;
  const latexParts = [...num.map((x) => x), ...den.map((x) => (x.includes('^{') ? x.replace(/\^\{(\d+)\}$/, '^{-$1}') : `${x}^{-1}`))];
  const latex = latexParts.length ? `\\mathrm{${latexParts.join('\\,')}}` : '';
  return { factor, dim: d, latex, offset };
}

/** Per-quantity overrides where the same symbol means different things (e.g. rpm as a frequency). */
const KIND_OVERRIDE: Partial<Record<QuantityKind, Record<string, number>>> = {
  frequency: { rpm: 1 / 60, 'rev/s': 1, 'rev/min': 1 / 60 },
};

export function toSI(value: number, unit: string, kind?: QuantityKind): number {
  if (kind && KIND_OVERRIDE[kind]?.[unit] !== undefined) return value * KIND_OVERRIDE[kind]![unit];
  const u = parseUnit(unit);
  if (!u) throw new Error(`Unrecognised unit "${unit}"`);
  return value * u.factor + (u.offset ?? 0);
}

export function fromSI(si: number, unit: string, kind?: QuantityKind): number {
  if (kind && KIND_OVERRIDE[kind]?.[unit] !== undefined) return si / KIND_OVERRIDE[kind]![unit];
  const u = parseUnit(unit);
  if (!u) throw new Error(`Unrecognised unit "${unit}"`);
  return (si - (u.offset ?? 0)) / u.factor;
}

export function unitDim(unit: string): Dim | null {
  const u = parseUnit(unit);
  return u ? u.dim : null;
}

export function unitsCompatible(a: string, b: string): boolean {
  const ua = parseUnit(a);
  const ub = parseUnit(b);
  return !!ua && !!ub && dimEq(ua.dim, ub.dim);
}

export function unitLatex(unit: string): string {
  if (unit === '1' || unit === '') return '';
  const u = parseUnit(unit);
  return u ? u.latex : `\\text{${unit}}`;
}

/** Special pseudo-units whose display should not be space-separated from the number. */
export function isTightUnit(unit: string): boolean {
  return unit === '°' || unit === '%' || unit === 'c';
}
