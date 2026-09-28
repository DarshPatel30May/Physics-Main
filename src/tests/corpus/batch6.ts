/* Sixth audit batch: questions pasted with display maths on separate lines, bare "n=4" symbols,
   and hard line breaks — the formats produced by copying from typeset papers and PDFs. */
import type { Case } from './types';

const h = 6.626e-34, c = 3.0e8, R = 1.097e7, e = 1.602e-19;
const line = (ni: number, nf: number) => R * Math.abs(1 / (nf * nf) - 1 / (ni * ni));
const Eline = (ni: number, nf: number) => h * c * line(ni, nf);

export const CASES: Case[] = [
  // The student's question, exactly as pasted.
  { q: 'An excited hydrogen atom undergoes a transition from\n\\[\nn=4\n\\]\nto\n\\[\nn=2.\n\\]\n(a) Calculate the energy of the emitted photon.', target: 'Eph', value: Eline(4, 2) },
  { q: 'An excited hydrogen atom undergoes a transition from \\(n=4\\) to \\(n=2\\). Calculate the energy of the emitted photon.', target: 'Eph', value: Eline(4, 2) },
  { q: 'An excited hydrogen atom undergoes a transition from $n=4$ to $n=2$. Calculate the wavelength of the emitted photon.', target: 'lambda', value: 1 / line(4, 2) },
  { q: 'An electron in a hydrogen atom falls from\nn = 3\nto\nn = 1.\nCalculate the frequency of the emitted photon.', target: 'f', value: c * line(3, 1) },
  { q: 'An electron in a hydrogen atom drops from n=5 to n=2. Calculate the wavelength of the light emitted.', target: 'lambda', value: 1 / line(5, 2) },
  { q: 'Calculate the wavelength of the photon emitted when an electron in a hydrogen atom moves from the n = 6 level to the n = 2 level.', target: 'lambda', value: 1 / line(6, 2) },
  { q: 'A hydrogen atom absorbs a photon and its electron moves from\n\\[ n_i = 2 \\]\nto\n\\[ n_f = 5. \\]\nCalculate the wavelength of the absorbed photon.', target: 'lambda', value: 1 / line(5, 2) },
  { q: 'An electron in a hydrogen atom transitions from the n = 3 energy level to the ground state. Calculate the energy of the emitted photon in eV.', target: 'Eph', value: Eline(3, 1) },
  { q: 'Calculate the energy, in joules, of the photon emitted when the electron in a hydrogen atom falls from n=3 to n=2.', target: 'Eph', value: Eline(3, 2) },
  // Display maths for data values
  { q: 'Light of wavelength\n\\[\n\\lambda = 500\\,\\text{nm}\n\\]\nis incident on a metal surface. Calculate the energy of each photon.', target: 'E', value: (h * c) / 500e-9 },
  { q: 'A proton moves at\n\\[\nv = 2.0 \\times 10^{6}\\ \\text{m s}^{-1}\n\\]\nperpendicular to a magnetic field of\n\\[\nB = 0.50\\ \\text{T}.\n\\]\nCalculate the magnitude of the force on the proton.', target: 'F', value: e * 2e6 * 0.5 },
  { q: 'A satellite orbits the Earth at an altitude of\n$$h = 500\\text{ km}.$$\nCalculate its orbital period.', target: 'T', value: 2 * Math.PI * Math.sqrt((6.371e6 + 5e5) ** 3 / (6.67e-11 * 6.0e24)) },
  // Hard line breaks, as copied from a PDF
  { q: 'A ball is launched from ground level at\n25 m/s at an angle of 40° to\nthe horizontal. Calculate the range\nof the ball.', target: 'sx', value: (25 * 25 * Math.sin(80 * Math.PI / 180)) / 9.8 },
  { q: 'A spaceship travels at 0.90c\nrelative to Earth. Its proper length\nis 120 m. Calculate the length\nmeasured by an observer on Earth.', target: 'l', value: 120 * Math.sqrt(1 - 0.81) },
  { q: 'Question 24 (3 marks)\nA sample of iodine-131 has a half-life of 8.0 days.\nThe initial activity is 400 Bq.\nCalculate the activity after 24 days.', target: 'Nt', value: 50 },
];
