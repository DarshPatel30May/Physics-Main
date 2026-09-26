import type { FVar } from '../../engine/types';
import type { QuantityKind } from '../../engine/quantities';

export const V = (symbol: string, name: string, q: QuantityKind, extra: Partial<FVar> = {}): FVar => ({ symbol, name, q, ...extra });

export const DEG = Math.PI / 180;
/** Angle sample range 5°–85° (radians). */
export const ANG: [number, number] = [5 * DEG, 85 * DEG];
export const SIGNED: Partial<FVar> = { signed: true, sample: [-20, 20] };

// Frequently used constant-bound variables
export const Gc = V('G', 'universal gravitational constant', 'gravConst', { constant: 'G' });
export const cc = V('c', 'speed of light', 'speed', { constant: 'c' });
export const hc = V('h', 'Planck constant', 'planck', { constant: 'h' });
export const gc = V('g', 'gravitational acceleration', 'acceleration', { constant: 'g' });
export const eps0 = V('\\varepsilon_0', 'electric permittivity constant', 'permittivity', { constant: 'eps0' });
export const mu0 = V('\\mu_0', 'magnetic permeability constant', 'permeability', { constant: 'mu0' });
