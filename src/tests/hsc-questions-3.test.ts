/** Third audit batch of HSC-style questions. */
import { describe, it, expect } from 'vitest';
import { smartSolve } from '../nlp/smart';

const G = 6.67e-11, ME = 6.0e24, RE = 6.371e6, g = 9.8, c = 3.0e8, h = 6.626e-34, e = 1.602e-19;
const me = 9.109e-31, mp = 1.673e-27, mn = 1.675e-27, u = 1.661e-27, R = 1.097e7;

interface Case { q: string; target: string; value: number; tol?: number }
const CASES: Case[] = [
  { q: 'A 2.0 kg mass is whirled in a vertical circle of radius 0.80 m. At the top of the circle its speed is 4.0 m/s. Calculate the tension in the string at the top.', target: 'Ftop', value: (2 * 16) / 0.8 - 2 * g },
  { q: 'Calculate the minimum speed a roller coaster car needs at the top of a vertical loop of radius 5.0 m.', target: 'vmin', value: Math.sqrt(g * 5) },
  { q: 'A satellite orbits the Earth with a period of 90 minutes. Calculate its altitude.', target: 'h', value: Math.cbrt((G * ME * 5400 ** 2) / (4 * Math.PI ** 2)) - RE },
  { q: 'Calculate the change in gravitational potential energy when a 500 kg satellite is moved from the Earth’s surface to an altitude of 1000 km.', target: 'dU', value: G * ME * 500 * (1 / RE - 1 / (RE + 1e6)) },
  { q: 'A 60 N force is applied perpendicular to a door 0.40 m from the hinge. Calculate the torque.', target: 'tau', value: 24 },
  { q: 'Two forces of 30 N east and 40 N north act on an object. Calculate the magnitude of the resultant force.', target: 'F', value: 50 },
  { q: 'An electron moves at 5.0 × 10^6 m/s perpendicular to a magnetic field of 2.0 mT. Calculate the period of its circular motion.', target: 'T', value: (2 * Math.PI * me) / (e * 2e-3) },
  { q: 'A long straight wire carries a current of 12 A. Calculate the magnetic field strength 3.0 cm from the wire.', target: 'B', value: (4e-7 * Math.PI * 12) / (2 * Math.PI * 0.03) },
  { q: 'An ideal transformer steps 11 kV down to 415 V. The primary coil has 5300 turns. How many turns are on the secondary coil?', target: 'Ns', value: (5300 * 415) / 11000 },
  { q: 'Two slits are 0.50 mm apart. The bright fringes on a screen 3.0 m away are 3.6 mm apart. Calculate the wavelength of the light.', target: 'lambda', value: (3.6e-3 * 0.5e-3) / 3 },
  { q: 'A star has a surface temperature of 3500 K. Calculate the wavelength at which it emits maximum intensity.', target: 'lmax', value: 2.898e-3 / 3500 },
  { q: 'Calculate the momentum of a photon of wavelength 500 nm.', target: 'p', value: h / 500e-9 },
  { q: 'Calculate the threshold wavelength for a metal with a work function of 3.0 eV.', target: 'l0', value: (h * c) / (3 * e) },
  { q: 'The stopping voltage for photoelectrons emitted from a metal is 1.2 V. Calculate the maximum speed of the photoelectrons.', target: 'vmax', value: Math.sqrt((2 * e * 1.2) / me) },
  { q: 'A particle has a Lorentz factor of 2.5. Calculate its speed.', target: 'v', value: c * Math.sqrt(1 - 1 / 6.25) },
  { q: 'Calculate the rest energy of an electron.', target: 'E', value: me * c * c },
  { q: 'Calculate the kinetic energy of an electron that has a de Broglie wavelength of 1.0 × 10^-10 m.', target: 'K', value: (h / 1e-10) ** 2 / (2 * me) },
  { q: 'The half-life of radon-222 is 3.8 days. Calculate the activity of a sample containing 2.0 × 10^10 radon nuclei.', target: 'A', value: (Math.LN2 / (3.8 * 86400)) * 2e10 },
  { q: 'An oil drop carries a charge of 4.8 × 10^-19 C. How many excess electrons are on the drop?', target: 'n', value: 4.8e-19 / e },
  { q: 'Calculate the energy of the photon emitted when an electron in a hydrogen atom falls from n = 3 to n = 1.', target: 'Eph', value: (h * c * R * (1 - 1 / 9)) },
  { q: 'The nuclear mass of iron-56 is 55.92067 u. Calculate the binding energy per nucleon of iron-56.', target: 'EBA', value: ((26 * mp + 30 * mn - 55.92067 * u) * c * c) / 56 },
  { q: 'A spacecraft moving at 0.60c passes the Earth. The spacecraft is 80 m long according to its crew. How long is the spacecraft according to an observer on Earth?', target: 'l', value: 80 * 0.8 },
  { q: 'The International Space Station orbits at an altitude of 420 km above the Earth. Calculate its orbital speed.', target: 'v', value: Math.sqrt((G * ME) / (RE + 4.2e5)) },
  { q: 'A proton is accelerated from rest through a potential difference of 2.0 kV. Calculate its final speed.', target: 'v', value: Math.sqrt((2 * e * 2000) / mp) },
  { q: 'Calculate the frequency of a photon with an energy of 3.2 × 10^-19 J.', target: 'f', value: 3.2e-19 / h },
  // NESA 2025 HSC Physics Question 28 (answer 15.6 m/s in the marking guidelines)
  { q: 'A bicycle rider jumps from one ramp to a second ramp separated by 16 m as shown. The ramps are inclined at 20° and are 2 m high. What minimum speed is required for the rider to land on the second ramp', target: 'u', value: Math.sqrt((16 * g) / Math.sin(40 * Math.PI / 180)) },
  { q: 'A motorbike leaves a ramp inclined at 30° to the horizontal and must clear a gap of 25 m to land on an identical ramp at the same height. Calculate the minimum take-off speed.', target: 'u', value: Math.sqrt((25 * g) / Math.sin(60 * Math.PI / 180)) },
  { q: 'A skier leaves a jump at 20 m/s at 25° above the horizontal and lands at the same height. How far does the skier travel horizontally?', target: 'sx', value: (400 * Math.sin(50 * Math.PI / 180)) / g },
  { q: 'Calculate the force between two point charges of 2.0 μC and 5.0 μC separated by 0.30 m.', target: 'F', value: (2e-6 * 5e-6) / (4 * Math.PI * 8.854e-12 * 0.09) },
];

describe('HSC-style questions — batch 3', () => {
  for (const cse of CASES) {
    it(`${cse.q.slice(0, 90)}… → ${cse.target}`, () => {
      const r = smartSolve(cse.q);
      const part = r.parts.find((p) => p.target === cse.target) ?? r.parts[0];
      const dbg = `scenario ${r.scenario?.id}; assigned ${r.assignments.map((a) => a.key + '=' + a.q.raw).join(', ')}; auto ${r.autoFilled.map((a) => a.key).join(',')}; unused ${r.unused.map((x) => x.raw).join(',')}`;
      expect(part?.target, dbg).toBe(cse.target);
      expect(part.result?.ok, `${dbg} ${JSON.stringify(part.result?.errors)} missing ${JSON.stringify(part.result?.missing)}`).toBe(true);
      const got = part.result!.values[cse.target];
      expect(Math.abs(Math.abs(got) - Math.abs(cse.value)) / Math.abs(cse.value), `got ${got} expected ${cse.value}; ${dbg}`).toBeLessThan(cse.tol ?? 0.005);
    });
  }
});
