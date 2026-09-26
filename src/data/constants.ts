import type { QuantityKind } from '../engine/quantities';

export type ConstantSource =
  | 'NESA_DATA_SHEET'
  | 'DERIVED_FROM_DATA_SHEET'
  | 'REFERENCE_NOT_ON_SHEET';

export interface PhysicalConstant {
  id: string;
  name: string;
  symbol: string; // LaTeX
  value: number; // SI
  unitLatex: string;
  quantity: QuantityKind;
  source: ConstantSource;
  /** Significant figures as printed on the source. */
  sigFigs: number;
  note?: string;
  /** Printed form as it appears on the sheet (for display). */
  printed: string;
}

/**
 * Values from the NESA Physics Stage 6 Data Sheet (HSC examinations from 2019).
 * NESA values take priority over CODATA values for HSC calculations.
 * If a question supplies its own value, the question's value must be used instead.
 */
export const CONSTANTS: PhysicalConstant[] = [
  { id: 'e', name: 'Elementary charge (magnitude of charge on electron/proton)', symbol: 'e', value: 1.602e-19, unitLatex: '\\text{C}', quantity: 'charge', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1.602 × 10⁻¹⁹ C', note: 'Data sheet lists the charge on the electron, qₑ = −1.602 × 10⁻¹⁹ C. The proton charge is +1.602 × 10⁻¹⁹ C.' },
  { id: 'me', name: 'Mass of electron', symbol: 'm_e', value: 9.109e-31, unitLatex: '\\text{kg}', quantity: 'mass', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '9.109 × 10⁻³¹ kg' },
  { id: 'mn', name: 'Mass of neutron', symbol: 'm_n', value: 1.675e-27, unitLatex: '\\text{kg}', quantity: 'mass', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1.675 × 10⁻²⁷ kg' },
  { id: 'mp', name: 'Mass of proton', symbol: 'm_p', value: 1.673e-27, unitLatex: '\\text{kg}', quantity: 'mass', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1.673 × 10⁻²⁷ kg' },
  { id: 'vsound', name: 'Speed of sound in air', symbol: 'v_{\\text{sound}}', value: 340, unitLatex: '\\text{m s}^{-1}', quantity: 'speed', source: 'NESA_DATA_SHEET', sigFigs: 2, printed: '340 m s⁻¹' },
  { id: 'g', name: "Earth's gravitational acceleration", symbol: 'g', value: 9.8, unitLatex: '\\text{m s}^{-2}', quantity: 'acceleration', source: 'NESA_DATA_SHEET', sigFigs: 2, printed: '9.8 m s⁻²' },
  { id: 'c', name: 'Speed of light', symbol: 'c', value: 3.0e8, unitLatex: '\\text{m s}^{-1}', quantity: 'speed', source: 'NESA_DATA_SHEET', sigFigs: 3, printed: '3.00 × 10⁸ m s⁻¹' },
  { id: 'eps0', name: 'Electric permittivity constant', symbol: '\\varepsilon_0', value: 8.854e-12, unitLatex: '\\text{A}^2\\,\\text{s}^4\\,\\text{kg}^{-1}\\,\\text{m}^{-3}', quantity: 'permittivity', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '8.854 × 10⁻¹² A² s⁴ kg⁻¹ m⁻³' },
  { id: 'mu0', name: 'Magnetic permeability constant', symbol: '\\mu_0', value: 4 * Math.PI * 1e-7, unitLatex: '\\text{N A}^{-2}', quantity: 'permeability', source: 'NESA_DATA_SHEET', sigFigs: 10, printed: '4π × 10⁻⁷ N A⁻²' },
  { id: 'G', name: 'Universal gravitational constant', symbol: 'G', value: 6.67e-11, unitLatex: '\\text{N m}^2\\,\\text{kg}^{-2}', quantity: 'gravConst', source: 'NESA_DATA_SHEET', sigFigs: 3, printed: '6.67 × 10⁻¹¹ N m² kg⁻²' },
  { id: 'ME', name: 'Mass of Earth', symbol: 'M_E', value: 6.0e24, unitLatex: '\\text{kg}', quantity: 'mass', source: 'NESA_DATA_SHEET', sigFigs: 2, printed: '6.0 × 10²⁴ kg' },
  { id: 'RE', name: 'Radius of Earth', symbol: 'r_E', value: 6.371e6, unitLatex: '\\text{m}', quantity: 'length', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '6.371 × 10⁶ m' },
  { id: 'h', name: 'Planck constant', symbol: 'h', value: 6.626e-34, unitLatex: '\\text{J s}', quantity: 'planck', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '6.626 × 10⁻³⁴ J s' },
  { id: 'R', name: 'Rydberg constant', symbol: 'R', value: 1.097e7, unitLatex: '\\text{m}^{-1}', quantity: 'inverseLength', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1.097 × 10⁷ m⁻¹' },
  { id: 'u', name: 'Unified atomic mass unit', symbol: 'u', value: 1.661e-27, unitLatex: '\\text{kg}', quantity: 'mass', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1.661 × 10⁻²⁷ kg = 931.5 MeV/c²' },
  { id: 'uMeV', name: 'Energy equivalent of 1 u', symbol: 'u c^2', value: 931.5 * 1e6 * 1.602e-19, unitLatex: '\\text{J}', quantity: 'energy', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '931.5 MeV/c²' },
  { id: 'eV', name: 'Electron volt', symbol: '1\\,\\text{eV}', value: 1.602e-19, unitLatex: '\\text{J}', quantity: 'energy', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '1 eV = 1.602 × 10⁻¹⁹ J' },
  { id: 'rhoWater', name: 'Density of water', symbol: '\\rho', value: 1.0e3, unitLatex: '\\text{kg m}^{-3}', quantity: 'density', source: 'NESA_DATA_SHEET', sigFigs: 3, printed: '1.00 × 10³ kg m⁻³' },
  { id: 'cWater', name: 'Specific heat capacity of water', symbol: 'c_{\\text{water}}', value: 4.18e3, unitLatex: '\\text{J kg}^{-1}\\,\\text{K}^{-1}', quantity: 'specificHeat', source: 'NESA_DATA_SHEET', sigFigs: 3, printed: '4.18 × 10³ J kg⁻¹ K⁻¹', note: 'Year 11 (Module 3) — not used in Modules 5–8.' },
  { id: 'b', name: "Wien's displacement constant", symbol: 'b', value: 2.898e-3, unitLatex: '\\text{m K}', quantity: 'wienConst', source: 'NESA_DATA_SHEET', sigFigs: 4, printed: '2.898 × 10⁻³ m K' },
  // Derived from data-sheet values
  { id: 'k', name: 'Coulomb constant k = 1/(4πε₀)', symbol: 'k', value: 1 / (4 * Math.PI * 8.854e-12), unitLatex: '\\text{N m}^2\\,\\text{C}^{-2}', quantity: 'coulombConst', source: 'DERIVED_FROM_DATA_SHEET', sigFigs: 4, printed: '8.988 × 10⁹ N m² C⁻² (= 1/4πε₀)' },
  { id: 'hc', name: 'hc (derived)', symbol: 'hc', value: 6.626e-34 * 3.0e8, unitLatex: '\\text{J m}', quantity: 'hcConst', source: 'DERIVED_FROM_DATA_SHEET', sigFigs: 4, printed: '1.988 × 10⁻²⁵ J m' },
  { id: 'E1H', name: 'Hydrogen ground-state energy (Bohr model)', symbol: 'E_1', value: -13.6 * 1.602e-19, unitLatex: '\\text{J}', quantity: 'energy', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 3, printed: '−13.6 eV', note: 'Not on the NESA data sheet. HSC questions normally supply energy-level values or use the Rydberg equation.' },
  // Reference values NOT on the NESA data sheet (only used when a question relies on them and does not supply them; the solver always flags them)
  { id: 'mAlpha', name: 'Mass of alpha particle (He-4 nucleus)', symbol: 'm_\\alpha', value: 4.001506 * 1.661e-27, unitLatex: '\\text{kg}', quantity: 'mass', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '6.646 × 10⁻²⁷ kg (4.001506 u)', note: 'Not on the NESA data sheet — use the value supplied in the question if one is given.' },
  { id: 'NA', name: 'Avogadro constant', symbol: 'N_A', value: 6.022e23, unitLatex: '\\text{mol}^{-1}', quantity: 'perMole', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '6.022 × 10²³ mol⁻¹', note: 'On the Chemistry data sheet, not the Physics data sheet.' },
  { id: 'sigmaSB', name: 'Stefan–Boltzmann constant', symbol: '\\sigma', value: 5.67e-8, unitLatex: '\\text{W m}^{-2}\\,\\text{K}^{-4}', quantity: 'stefanConst', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 3, printed: '5.67 × 10⁻⁸ W m⁻² K⁻⁴', note: 'Not in the HSC syllabus; only for the optional extension luminosity tool.' },
  { id: 'MSun', name: 'Mass of Sun', symbol: 'M_\\odot', value: 1.989e30, unitLatex: '\\text{kg}', quantity: 'mass', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '1.989 × 10³⁰ kg', note: 'Not on the NESA data sheet — HSC questions supply this if needed.' },
  { id: 'MMoon', name: 'Mass of Moon', symbol: 'M_{\\text{Moon}}', value: 7.35e22, unitLatex: '\\text{kg}', quantity: 'mass', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 3, printed: '7.35 × 10²² kg', note: 'Not on the NESA data sheet — HSC questions supply this if needed.' },
  { id: 'RMoon', name: 'Radius of Moon', symbol: 'r_{\\text{Moon}}', value: 1.737e6, unitLatex: '\\text{m}', quantity: 'length', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '1.737 × 10⁶ m', note: 'Not on the NESA data sheet.' },
  { id: 'MMars', name: 'Mass of Mars', symbol: 'M_{\\text{Mars}}', value: 6.42e23, unitLatex: '\\text{kg}', quantity: 'mass', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 3, printed: '6.42 × 10²³ kg', note: 'Not on the NESA data sheet.' },
  { id: 'RMars', name: 'Radius of Mars', symbol: 'r_{\\text{Mars}}', value: 3.39e6, unitLatex: '\\text{m}', quantity: 'length', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 3, printed: '3.39 × 10⁶ m', note: 'Not on the NESA data sheet.' },
  { id: 'AU', name: 'Astronomical unit', symbol: '\\text{AU}', value: 1.496e11, unitLatex: '\\text{m}', quantity: 'length', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '1.496 × 10¹¹ m' },
  { id: 'ly', name: 'Light-year', symbol: '\\text{ly}', value: 9.461e15, unitLatex: '\\text{m}', quantity: 'length', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '9.461 × 10¹⁵ m' },
  { id: 'pc', name: 'Parsec', symbol: '\\text{pc}', value: 3.086e16, unitLatex: '\\text{m}', quantity: 'length', source: 'REFERENCE_NOT_ON_SHEET', sigFigs: 4, printed: '3.086 × 10¹⁶ m' },
];

export const CONST: Record<string, PhysicalConstant> = Object.fromEntries(CONSTANTS.map((c) => [c.id, c]));

export function constValue(id: string): number {
  const c = CONST[id];
  if (!c) throw new Error(`Unknown constant ${id}`);
  return c.value;
}

export const SOURCE_LABEL: Record<ConstantSource, string> = {
  NESA_DATA_SHEET: 'NESA data sheet',
  DERIVED_FROM_DATA_SHEET: 'Derived from NESA data sheet values',
  REFERENCE_NOT_ON_SHEET: 'Reference value — NOT on NESA data sheet',
};
