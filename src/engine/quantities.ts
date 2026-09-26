import { Dim, dim, DIMLESS } from './dimensions';

/**
 * Quantity kinds. Every variable in the formula database has a kind, which fixes
 * its dimension, its coherent SI unit and the alternative units offered to students.
 */
export type QuantityKind =
  | 'length' | 'area' | 'volume' | 'time' | 'mass' | 'speed' | 'acceleration' | 'force'
  | 'energy' | 'power' | 'frequency' | 'angularVelocity' | 'charge' | 'current' | 'voltage'
  | 'efield' | 'bfield' | 'flux' | 'resistance' | 'angle' | 'dimensionless' | 'count'
  | 'momentum' | 'torque' | 'temperature' | 'decayConstant' | 'activity' | 'intensity'
  | 'gravConst' | 'planck' | 'permittivity' | 'permeability' | 'wienConst' | 'inverseLength'
  | 'massPerTime' | 'energyPerNucleon' | 'hubble' | 'lineDensity' | 'percent' | 'forcePerLength'
  | 'gm' | 'kepler' | 'chargeToMass' | 'density' | 'stefanConst' | 'coulombConst' | 'hcConst' | 'perMole' | 'specificHeat' | 'amount';

export interface QuantityInfo {
  kind: QuantityKind;
  label: string;
  dim: Dim;
  /** Coherent SI unit symbol (key into the unit table). */
  si: string;
  /** Units a student may enter (keys in unit table). First is default input unit. */
  input: string[];
  /** Units shown as "useful equivalents" in answers. */
  equivalents: string[];
}

const Q = (
  kind: QuantityKind,
  label: string,
  d: Dim,
  si: string,
  input: string[],
  equivalents: string[] = [],
): QuantityInfo => ({ kind, label, dim: d, si, input, equivalents });

export const QUANTITIES: Record<QuantityKind, QuantityInfo> = {
  length: Q('length', 'length', dim(0, 1), 'm', ['m', 'km', 'cm', 'mm', 'μm', 'nm', 'pm', 'fm', 'AU', 'ly', 'pc', 'Mpc'], ['km', 'mm', 'μm', 'nm']),
  area: Q('area', 'area', dim(0, 2), 'm^2', ['m^2', 'cm^2', 'mm^2', 'km^2'], ['cm^2', 'mm^2']),
  volume: Q('volume', 'volume', dim(0, 3), 'm^3', ['m^3', 'cm^3', 'L', 'mL'], ['cm^3', 'L']),
  time: Q('time', 'time', dim(0, 0, 1), 's', ['s', 'ms', 'μs', 'ns', 'ps', 'min', 'h', 'day', 'yr'], ['ms', 'μs', 'ns', 'min', 'h', 'day', 'yr']),
  mass: Q('mass', 'mass', dim(1), 'kg', ['kg', 'g', 'mg', 't', 'u', 'MeV/c^2'], ['g', 'u', 'MeV/c^2']),
  speed: Q('speed', 'speed/velocity', dim(0, 1, -1), 'm/s', ['m/s', 'km/s', 'km/h', 'c'], ['km/s', 'km/h', 'c']),
  acceleration: Q('acceleration', 'acceleration', dim(0, 1, -2), 'm/s^2', ['m/s^2', 'km/s^2'], []),
  force: Q('force', 'force', dim(1, 1, -2), 'N', ['N', 'kN', 'MN', 'mN', 'μN'], ['kN', 'mN']),
  energy: Q('energy', 'energy', dim(1, 2, -2), 'J', ['J', 'kJ', 'MJ', 'GJ', 'eV', 'keV', 'MeV', 'GeV'], ['eV', 'keV', 'MeV', 'kJ', 'MJ']),
  power: Q('power', 'power', dim(1, 2, -3), 'W', ['W', 'kW', 'MW', 'GW', 'mW'], ['kW', 'MW', 'GW']),
  frequency: Q('frequency', 'frequency', dim(0, 0, -1), 'Hz', ['Hz', 'kHz', 'MHz', 'GHz', 'THz', 'rpm'], ['kHz', 'MHz', 'GHz', 'THz']),
  angularVelocity: Q('angularVelocity', 'angular velocity', dim(0, 0, -1), 'rad/s', ['rad/s', 'rpm', 'deg/s'], ['rpm', 'deg/s']),
  charge: Q('charge', 'charge', dim(0, 0, 1, 1), 'C', ['C', 'mC', 'μC', 'nC', 'pC', 'e'], ['μC', 'nC', 'e']),
  current: Q('current', 'current', dim(0, 0, 0, 1), 'A', ['A', 'mA', 'μA', 'kA'], ['mA', 'kA']),
  voltage: Q('voltage', 'potential difference / emf', dim(1, 2, -3, -1), 'V', ['V', 'mV', 'μV', 'kV', 'MV'], ['mV', 'kV']),
  efield: Q('efield', 'electric field strength', dim(1, 1, -3, -1), 'V/m', ['V/m', 'N/C', 'kV/m', 'V/cm', 'kV/cm', 'MV/m'], ['kV/m']),
  bfield: Q('bfield', 'magnetic field strength', dim(1, 0, -2, -1), 'T', ['T', 'mT', 'μT', 'nT', 'G'], ['mT', 'μT']),
  flux: Q('flux', 'magnetic flux', dim(1, 2, -2, -1), 'Wb', ['Wb', 'mWb', 'μWb', 'T m^2'], ['mWb', 'μWb']),
  resistance: Q('resistance', 'resistance', dim(1, 2, -3, -2), 'Ω', ['Ω', 'kΩ', 'MΩ', 'mΩ'], ['kΩ', 'MΩ']),
  angle: Q('angle', 'angle', DIMLESS, 'rad', ['°', 'rad'], ['°', 'rad']),
  dimensionless: Q('dimensionless', 'ratio', DIMLESS, '1', ['1'], []),
  count: Q('count', 'number', DIMLESS, '1', ['1'], []),
  percent: Q('percent', 'percentage', DIMLESS, '1', ['%', '1'], ['%']),
  momentum: Q('momentum', 'momentum', dim(1, 1, -1), 'kg m/s', ['kg m/s', 'N s', 'MeV/c'], ['MeV/c']),
  torque: Q('torque', 'torque', dim(1, 2, -2), 'N m', ['N m', 'mN m', 'kN m'], ['mN m']),
  temperature: Q('temperature', 'temperature', dim(0, 0, 0, 0, 1), 'K', ['K', '°C'], ['°C']),
  decayConstant: Q('decayConstant', 'decay constant', dim(0, 0, -1), '1/s', ['1/s', '1/min', '1/h', '1/day', '1/yr'], ['1/h', '1/day', '1/yr']),
  activity: Q('activity', 'activity', dim(0, 0, -1), 'Bq', ['Bq', 'kBq', 'MBq', 'GBq', 'Ci'], ['kBq', 'MBq']),
  intensity: Q('intensity', 'intensity', dim(1, 0, -3), 'W/m^2', ['W/m^2', 'mW/m^2', 'W/cm^2'], []),
  gravConst: Q('gravConst', 'gravitational constant', dim(-1, 3, -2), 'N m^2/kg^2', ['N m^2/kg^2'], []),
  planck: Q('planck', 'Planck constant', dim(1, 2, -1), 'J s', ['J s', 'eV s'], ['eV s']),
  permittivity: Q('permittivity', 'permittivity', dim(-1, -3, 4, 2), 'F/m', ['F/m', 'C^2/(N m^2)'], []),
  permeability: Q('permeability', 'permeability', dim(1, 1, -2, -2), 'N/A^2', ['N/A^2', 'T m/A'], []),
  wienConst: Q('wienConst', 'Wien constant', dim(0, 1, 0, 0, 1), 'm K', ['m K'], []),
  inverseLength: Q('inverseLength', 'per metre', dim(0, -1), '1/m', ['1/m', '1/nm'], []),
  massPerTime: Q('massPerTime', 'mass rate', dim(1, 0, -1), 'kg/s', ['kg/s', 't/s'], []),
  energyPerNucleon: Q('energyPerNucleon', 'energy per nucleon', dim(1, 2, -2), 'J', ['MeV', 'J', 'keV'], ['MeV']),
  hubble: Q('hubble', 'Hubble constant', dim(0, 0, -1), '1/s', ['km/s/Mpc', '1/s'], ['km/s/Mpc']),
  lineDensity: Q('lineDensity', 'lines per length', dim(0, -1), '1/m', ['lines/mm', 'lines/cm', 'lines/m'], ['lines/mm', 'lines/cm']),
  forcePerLength: Q('forcePerLength', 'force per unit length', dim(1, 0, -2), 'N/m', ['N/m', 'mN/m', 'μN/m'], ['μN/m']),
  gm: Q('gm', 'GM', dim(0, 3, -2), 'm^3/s^2', ['m^3/s^2'], []),
  kepler: Q('kepler', 'r³/T²', dim(0, 3, -2), 'm^3/s^2', ['m^3/s^2'], []),
  chargeToMass: Q('chargeToMass', 'charge-to-mass ratio', dim(-1, 0, 1, 1), 'C/kg', ['C/kg'], []),
  density: Q('density', 'density', dim(1, -3), 'kg/m^3', ['kg/m^3', 'g/cm^3'], []),
  amount: Q('amount', 'amount (nuclei, mass or activity — any consistent unit)', DIMLESS, '', ['nuclei', 'g', 'kg', 'mg', 'μg', 'Bq', 'kBq', 'MBq', '%', 'atoms', 'counts/min'], []),
  stefanConst: Q('stefanConst', 'Stefan–Boltzmann constant', dim(1, 0, -3, 0, -4), 'W/(m^2 K^4)', ['W/(m^2 K^4)'], []),
  coulombConst: Q('coulombConst', 'Coulomb constant', dim(1, 3, -4, -2), 'N m^2/C^2', ['N m^2/C^2'], []),
  hcConst: Q('hcConst', 'hc', dim(1, 3, -2), 'J m', ['J m'], []),
  perMole: Q('perMole', 'per mole', dim(0, 0, 0, 0, 0, -1), '1/mol', ['1/mol'], []),
  specificHeat: Q('specificHeat', 'specific heat capacity', dim(0, 2, -2, 0, -1), 'J/(kg K)', ['J/(kg K)'], []),
};

export function quantity(kind: QuantityKind): QuantityInfo {
  return QUANTITIES[kind];
}
