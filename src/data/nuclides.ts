/**
 * Reference ATOMIC masses (neutral atom, in u) from the Atomic Mass Evaluation 2020 (AME2020),
 * rounded to 6 decimal places. These are NOT on the NESA data sheet — HSC questions supply the
 * masses they want you to use. Provided only as a convenience for exploring binding energies.
 */
export interface Nuclide { Z: number; A: number; sym: string; mass: number }

export const NUCLIDES: Nuclide[] = [
  { Z: 0, A: 1, sym: 'n', mass: 1.008665 },
  { Z: 1, A: 1, sym: 'H', mass: 1.007825 },
  { Z: 1, A: 2, sym: 'H', mass: 2.014102 },
  { Z: 1, A: 3, sym: 'H', mass: 3.016049 },
  { Z: 2, A: 3, sym: 'He', mass: 3.016029 },
  { Z: 2, A: 4, sym: 'He', mass: 4.002603 },
  { Z: 3, A: 6, sym: 'Li', mass: 6.015123 },
  { Z: 3, A: 7, sym: 'Li', mass: 7.016003 },
  { Z: 4, A: 9, sym: 'Be', mass: 9.012183 },
  { Z: 5, A: 10, sym: 'B', mass: 10.012937 },
  { Z: 5, A: 11, sym: 'B', mass: 11.009305 },
  { Z: 6, A: 12, sym: 'C', mass: 12.0 },
  { Z: 6, A: 13, sym: 'C', mass: 13.003355 },
  { Z: 6, A: 14, sym: 'C', mass: 14.003242 },
  { Z: 7, A: 14, sym: 'N', mass: 14.003074 },
  { Z: 7, A: 15, sym: 'N', mass: 15.000109 },
  { Z: 8, A: 16, sym: 'O', mass: 15.994915 },
  { Z: 8, A: 17, sym: 'O', mass: 16.999132 },
  { Z: 9, A: 19, sym: 'F', mass: 18.998403 },
  { Z: 11, A: 23, sym: 'Na', mass: 22.98977 },
  { Z: 13, A: 27, sym: 'Al', mass: 26.981538 },
  { Z: 26, A: 56, sym: 'Fe', mass: 55.934936 },
  { Z: 27, A: 60, sym: 'Co', mass: 59.933816 },
  { Z: 28, A: 60, sym: 'Ni', mass: 59.930786 },
  { Z: 36, A: 92, sym: 'Kr', mass: 91.926173 },
  { Z: 38, A: 90, sym: 'Sr', mass: 89.907728 },
  { Z: 39, A: 90, sym: 'Y', mass: 89.907144 },
  { Z: 53, A: 131, sym: 'I', mass: 130.906126 },
  { Z: 55, A: 137, sym: 'Cs', mass: 136.907089 },
  { Z: 56, A: 141, sym: 'Ba', mass: 140.914403 },
  { Z: 82, A: 206, sym: 'Pb', mass: 205.974465 },
  { Z: 82, A: 208, sym: 'Pb', mass: 207.976652 },
  { Z: 83, A: 209, sym: 'Bi', mass: 208.980399 },
  { Z: 84, A: 210, sym: 'Po', mass: 209.982874 },
  { Z: 86, A: 222, sym: 'Rn', mass: 222.017578 },
  { Z: 88, A: 226, sym: 'Ra', mass: 226.02541 },
  { Z: 90, A: 234, sym: 'Th', mass: 234.043601 },
  { Z: 92, A: 234, sym: 'U', mass: 234.040952 },
  { Z: 92, A: 235, sym: 'U', mass: 235.04393 },
  { Z: 92, A: 238, sym: 'U', mass: 238.050788 },
  { Z: 94, A: 239, sym: 'Pu', mass: 239.052164 },
  { Z: 95, A: 241, sym: 'Am', mass: 241.056829 },
];

/** Reference particle masses in u (CODATA 2018), for comparison with the data-sheet values. */
export const REF_MASS_U = { proton: 1.007276, neutron: 1.008665, electron: 0.000549 };

export function findNuclide(Z: number, A: number): Nuclide | undefined {
  return NUCLIDES.find((n) => n.Z === Z && n.A === A);
}
