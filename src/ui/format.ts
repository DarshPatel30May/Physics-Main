import type { ResolvedScenario, ResolvedVar } from '../engine/scenario';
import type { FullSolveResult, KnownInput } from '../engine/solver';
import { QUANTITIES } from '../engine/quantities';
import { fromSI, parseUnit, unitLatex, isTightUnit } from '../engine/units';
import { formatSig, formatTrim, resolveSigFigs, SigFigMode, prettyUnit } from '../engine/numbers';
import { dimEq } from '../engine/dimensions';
import { CONST } from '../data/constants';

export interface QtyDisplay {
  latex: string;
  text: string;
}

function unitPart(unit: string): { latex: string; text: string; tight: boolean } {
  if (!unit || unit === '1') return { latex: '', text: '', tight: true };
  if (unit === '°') return { latex: '^{\\circ}', text: '°', tight: true };
  if (unit === '%') return { latex: '\\%', text: '%', tight: true };
  if (unit === 'c') return { latex: 'c', text: 'c', tight: true };
  if (unit === '°C') return { latex: '\\,^{\\circ}\\mathrm{C}', text: ' °C', tight: true };
  return { latex: unitLatex(unit), text: unit, tight: isTightUnit(unit) };
}

export function isAgnostic(v: ResolvedVar): boolean {
  return v.q === 'amount';
}

/** Convert an SI value of a variable into the given display unit. */
export function toDisplay(v: ResolvedVar, si: number, unit: string): number {
  if (v.q === 'angle') return unit === 'rad' ? si : (si * 180) / Math.PI;
  if (v.q === 'percent') return unit === '%' ? si * 100 : si;
  if (v.q === 'count' || v.q === 'dimensionless') return si;
  if (!unit || unit === '1') return si;
  try { return fromSI(si, unit, v.q); } catch { return si; }
}

export function formatQty(v: ResolvedVar, si: number, unit: string, sig: number | 'full'): QtyDisplay {
  const val = toDisplay(v, si, unit);
  let f = v.q === 'angle' && sig !== 'full' ? formatTrim(val, Math.max(sig, 3)) : formatSig(val, sig);
  if ((v.q === 'count' || v.integer) && Math.abs(val - Math.round(val)) < 1e-9 && Math.abs(val) < 1e6) f = { ...f, latex: String(Math.round(val)), text: String(Math.round(val)) };
  const u = unitPart(unit);
  return {
    latex: `${f.latex}${u.latex ? (u.tight ? '' : '\\ ') + u.latex : ''}`,
    text: `${f.text}${u.text ? (u.tight ? '' : ' ') + prettyUnit(u.text) : ''}`,
  };
}

export function siUnitOf(v: ResolvedVar): string {
  if (v.q === 'angle') return '°';
  if (v.q === 'percent') return '%';
  const q = QUANTITIES[v.q];
  return q.si === '1' ? '' : q.si;
}

/** Choose the unit to present the answer in. */
export function chooseDisplayUnit(scn: ResolvedScenario, key: string, result: FullSolveResult, unitHint?: string): string {
  const v = scn.vars[key];
  if (unitHint) return unitHint;
  if (isAgnostic(v)) {
    const ref = ['N0', 'Nt', 'N'].map((k) => result.inputs[k]).find((i) => i?.unit);
    return ref?.unit ?? '';
  }
  // Same kind of quantity given by the student in a non-SI unit → answer in that unit too (plus SI).
  const siU = siUnitOf(v);
  const given = Object.entries(result.inputs).filter(([k, inp]) => inp.origin === 'given' && inp.unit && scn.vars[k]?.q === v.q);
  const u = given.map(([, i]) => i.unit!).find((uu) => uu && uu !== siU && uu !== 'c' && compatible(uu, v));
  if (u && v.q !== 'speed') return u;
  if (v.q === 'energy' && (scn.module === 7 || scn.module === 8) && Math.abs(result.values[key] ?? 0) < 1e-10) return 'eV';
  if (v.q === 'energy' && scn.module === 8 && Math.abs(result.values[key] ?? 0) >= 1e-10 && Math.abs(result.values[key] ?? 0) < 1e-6) return 'MeV';
  if (v.q === 'energyPerNucleon') return 'MeV';
  if (v.q === 'length' && ['interference', 'em_spectrum', 'photon', 'hydrogen', 'wien', 'star_temp', 'photoelectric', 'energy_levels'].includes(scn.id) && Math.abs(result.values[key] ?? 0) < 1e-5) return 'nm';
  return siU;
}

function compatible(unit: string, v: ResolvedVar): boolean {
  const u = parseUnit(unit);
  if (!u) return false;
  return dimEq(u.dim, QUANTITIES[v.q].dim);
}

export interface AnswerDisplay {
  main: QtyDisplay;
  si?: QtyDisplay;
  equivalents: QtyDisplay[];
  sig: number | 'full';
  sigRule: string;
  magnitudeNote?: string;
}

export function formatAnswer(scn: ResolvedScenario, key: string, result: FullSolveResult, mode: SigFigMode, unitHint?: string): AnswerDisplay {
  const v = scn.vars[key];
  let si = result.values[key];
  const sig = resolveSigFigs(mode, result.dataSigFigs);
  let magnitudeNote: string | undefined;
  if (v.magnitude && si < 0) {
    magnitudeNote = 'Magnitude shown — the negative sign in the formula indicates direction (Lenz’s law), not a negative size.';
    si = Math.abs(si);
  }
  const unit = chooseDisplayUnit(scn, key, result, unitHint);
  const main = formatQty(v, si, unit, sig);
  const siU = siUnitOf(v);
  const siDisp = unit !== siU && !isAgnostic(v) && v.q !== 'angle' ? formatQty(v, si, siU, sig) : undefined;
  const equivalents: QtyDisplay[] = [];
  const q = QUANTITIES[v.q];
  if (!isAgnostic(v) && v.q !== 'angle') {
    for (const eu of q.equivalents) {
      if (eu === unit || eu === siU) continue;
      const val = toDisplay(v, si, eu);
      const a = Math.abs(val);
      if (a === 0 || a < 1e-3 || a > 1e7) continue;
      if (eu === 'c' && a > 1) continue;
      equivalents.push(formatQty(v, si, eu, sig));
    }
  }
  if (v.q === 'angle') equivalents.push(formatQty(v, si, 'rad', sig));
  if (v.q === 'percent') equivalents.push({ latex: formatSig(si, sig).latex, text: formatSig(si, sig).text + ' (as a decimal)' });
  if (isAgnostic(v) && result.values.N0 !== undefined && key !== 'N0') {
    const frac = si / result.values.N0;
    equivalents.push({ latex: `${formatSig(frac * 100, sig).latex}\\%\\ \\text{of } N_0`, text: `${formatSig(frac * 100, sig).text}% of N₀` });
  }
  const minData = result.dataSigFigs.length ? Math.min(...result.dataSigFigs) : null;
  let sigRule: string;
  if (mode === 'auto') {
    if (minData === null) sigRule = 'No measured data precision available ⇒ 3 s.f.';
    else if (minData < 3) sigRule = `Least precise data: ${minData} s.f. Answer given to 3 s.f., as in NESA sample answers (to ${minData} s.f.: ${formatQty(v, si, unit, Math.max(1, minData)).text}).`;
    else sigRule = `Least precise data: ${minData} s.f. ⇒ answer to ${sig} s.f.${minData > 4 ? ' (capped at 4 s.f.)' : ''}`;
  } else sigRule = mode === 'full' ? 'Full calculator precision (no rounding).' : `Rounded to ${mode} s.f. (selected).`;
  return { main, si: siDisp, equivalents: equivalents.slice(0, 5), sig, sigRule, magnitudeNote };
}

/* ------------------------------------------------------------------ */

export interface GivenLine {
  key: string;
  symbolLatex: string;
  name: string;
  valueLatex: string; // as given
  siLatex?: string; // SI conversion if different
  conversion?: string; // LaTeX explanation of the conversion
  origin: KnownInput['origin'];
  note?: string;
}

export function givenLines(scn: ResolvedScenario, result: FullSolveResult): GivenLine[] {
  const out: GivenLine[] = [];
  for (const k of scn.varOrder) {
    const inp = result.inputs[k];
    if (!inp) continue;
    const v = scn.vars[k];
    const si = result.values[k];
    if (si === undefined) continue;
    const siU = siUnitOf(v);
    const unit = inp.unit ?? '';
    let valueLatex: string;
    let siLatex: string | undefined;
    let conversion: string | undefined;
    if (inp.origin === 'given' && inp.raw && unit) {
      const displayed = toDisplay(v, si, unit);
      valueLatex = formatQty(v, si, unit, inp.sigFigs ?? 'full').latex;
      if (inp.sigFigs) valueLatex = formatQty(v, si, unit, inp.sigFigs).latex;
      if (unit !== siU && !isAgnostic(v) && v.q !== 'angle' && v.q !== 'count') {
        siLatex = formatQty(v, si, siU, Math.max(inp.sigFigs ?? 3, 3)).latex;
        conversion = conversionLatex(v, unit, displayed, si, inp.sigFigs ?? 3);
      }
    } else {
      const u = v.q === 'angle' ? '°' : isAgnostic(v) ? unit : siU;
      valueLatex = formatQty(v, si, u, inp.sigFigs && inp.sigFigs > 0 ? inp.sigFigs : 4).latex;
    }
    out.push({ key: k, symbolLatex: v.symbol, name: v.name, valueLatex, siLatex, conversion, origin: inp.origin ?? 'given', note: inp.note });
  }
  return out;
}

function conversionLatex(v: ResolvedVar, unit: string, value: number, si: number, sf: number): string {
  const u = parseUnit(unit);
  const siU = siUnitOf(v);
  const siL = unitPart(siU).latex;
  const vL = formatSig(value, 'full').latex;
  if (unit === 'c') return `${vL}c = ${vL} \\times (3.00\\times10^{8}) = ${formatSig(si, Math.max(sf, 3)).latex}\\ ${siL}`;
  if (unit === '°C') return `T = ${vL} + 273.15 = ${formatSig(si, Math.max(sf, 3)).latex}\\ \\mathrm{K}`;
  if (unit === '%') return `${vL}\\% = ${formatSig(si, 'full').latex}`;
  if (!u) return '';
  if (/eV/.test(unit) && v.q !== 'mass') {
    const pre = unit.replace('eV', '');
    const mult = pre === 'k' ? '10^{3} \\times ' : pre === 'M' ? '10^{6} \\times ' : pre === 'G' ? '10^{9} \\times ' : '';
    return `${vL}\\ \\mathrm{${unit}} \\times ${mult}(1.602\\times10^{-19}\\ \\mathrm{J\\,eV^{-1}}) = ${formatSig(si, Math.max(sf, 3)).latex}\\ ${siL}`;
  }
  if (unit === 'u') return `${vL}\\ \\mathrm{u} \\times (1.661\\times10^{-27}\\ \\mathrm{kg\\,u^{-1}}) = ${formatSig(si, Math.max(sf, 3)).latex}\\ \\mathrm{kg}`;
  const f = u.factor;
  const fL = formatSig(f, 'full');
  const factorLatex = Math.abs(Math.log10(f) - Math.round(Math.log10(f))) < 1e-9 ? `10^{${Math.round(Math.log10(f))}}` : fL.latex;
  return `${vL}\\ ${unitPart(unit).latex} = ${vL} \\times ${factorLatex}\\ ${siL} = ${formatSig(si, Math.max(sf, 3)).latex}\\ ${siL}`;
}

export function constantLines(scn: ResolvedScenario, result: FullSolveResult): Array<{ symbolLatex: string; name: string; valueLatex: string; source: string; flagged: boolean; note?: string }> {
  return result.constantsUsed.filter((k) => scn.vars[k].constant && !result.inputs[k]).map((k) => {
    const v = scn.vars[k];
    const c = v.constant ? CONST[v.constant] : undefined;
    const printed = c ? c.printed : '';
    return {
      symbolLatex: v.symbol,
      name: c?.name ?? v.name,
      valueLatex: formatQty(v, result.values[k], v.q === 'angle' ? '°' : siUnitOf(v), c ? Math.min(Math.max(c.sigFigs, 2), 5) : 4).latex,
      source: c ? (c.source === 'NESA_DATA_SHEET' ? `NESA data sheet (${printed})` : c.source === 'DERIVED_FROM_DATA_SHEET' ? 'derived from data-sheet values' : 'reference value — NOT on the NESA data sheet') : '',
      flagged: c?.source === 'REFERENCE_NOT_ON_SHEET',
      note: c?.note,
    };
  });
}
