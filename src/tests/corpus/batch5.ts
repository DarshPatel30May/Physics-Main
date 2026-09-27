/* Fifth audit batch: distractor data, question-supplied constants, requested units, "show that". */
import type { Case } from './types';

const G = 6.67e-11, ME = 6.0e24, RE = 6.371e6, c = 3.0e8, h = 6.626e-34, e = 1.602e-19, me = 9.109e-31, D = Math.PI / 180;

export const CASES: Case[] = [
  { q: 'A stone of mass 0.20 kg is thrown horizontally at 8.0 m/s from a bridge 30 m above a river. Take g = 10 m s^-2. Calculate the time taken for the stone to reach the water.', target: 't', value: Math.sqrt(60 / 10) },
  { q: 'A 70 kg cyclist rides a 10 kg bicycle around a flat circular track of radius 25 m at a constant speed of 10 m/s. Calculate the centripetal acceleration of the cyclist.', target: 'ac', value: 4 },
  { q: 'Show that the orbital speed of a satellite at an altitude of 300 km above the Earth is about 7.7 km/s.', target: 'v', value: Math.sqrt((G * ME) / (RE + 3e5)) },
  { q: 'Calculate the orbital period, in minutes, of a satellite orbiting 400 km above the Earth.', target: 'T', value: 2 * Math.PI * Math.sqrt((RE + 4e5) ** 3 / (G * ME)) },
  { q: 'Calculate the wavelength, in nm, of a photon with an energy of 2.5 eV.', target: 'lambda', value: (h * c) / (2.5 * e) },
  { q: 'An electron is accelerated from rest by a potential difference of 5.0 kV. Calculate the final speed of the electron.', target: 'v', value: Math.sqrt((2 * e * 5000) / me) },
  { q: 'A transformer steps down 240 V to 12 V and delivers 60 W to a lamp. Assuming the transformer is ideal, calculate the current in the primary coil.', target: 'Ip', value: 60 / 240 },
  { q: 'A 0.15 kg cricket ball is hit at 25 m/s at 35° above the horizontal from ground level. How long is the ball in the air?', target: 't', value: (2 * 25 * Math.sin(35 * D)) / 9.8 },
  { q: 'Light of frequency 6.0 × 10^14 Hz travels from air into glass of refractive index 1.5. Calculate the speed of the light in the glass.', target: 'v2', value: c / 1.5 },
  { q: 'A spaceship travels at 2.4 × 10^8 m/s relative to Earth. An astronaut on the spaceship measures her pulse as 70 beats per minute, taking 60 s. How long does this 60 s interval last according to an observer on Earth?', target: 't', value: 60 / 0.6 },
  { q: 'Calculate the half-life of an isotope whose activity decreases from 1200 Bq to 150 Bq in 45 days.', target: 'thalf', value: 15 * 86400 },
  { q: 'A current of 5.0 A flows in a wire of length 20 cm placed at 30° to a magnetic field of 0.80 T. Calculate the force on the wire.', target: 'F', value: 5 * 0.2 * 0.8 * 0.5 },
  { q: 'Two parallel wires 10 cm apart each carry a current of 20 A in opposite directions. Calculate the force per unit length on each wire.', target: 'Fl', value: (2e-7 * 400) / 0.1 },
  { q: 'Determine the energy, in MeV, released when the mass of the products of a reaction is 0.0030 u less than the mass of the reactants.', target: 'E', value: 0.003 * 1.661e-27 * c * c, tol: 0.01 },
  { q: 'A ball is thrown at 20 m/s at 30° below the horizontal from the top of a 50 m cliff. Calculate the time taken to reach the ground.', target: 't', value: (-10 + Math.sqrt(100 + 2 * 9.8 * 50)) / 9.8 },
];
