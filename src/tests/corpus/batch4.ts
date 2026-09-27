/* Fourth audit batch: phrasings found in real papers and student pastes. */
import type { Case } from './types';

const G = 6.67e-11, ME = 6.0e24, RE = 6.371e6, g = 9.8, c = 3.0e8, h = 6.626e-34, e = 1.602e-19;
const me = 9.109e-31, mn = 1.675e-27, mp = 1.673e-27, R = 1.097e7, D = Math.PI / 180, yr = 365.25 * 86400;
const mAlpha = 4.001506 * 1.661e-27;
const PE = 'A metal surface has a work function of \\(2.20\\text{ eV}\\).\nLight of wavelength \\(380\\text{ nm}\\) is incident on the surface.\n(a) Calculate the energy of one incident photon in electronvolts.\n(b) Calculate the maximum kinetic energy of the emitted photoelectrons.\n(c) Calculate the stopping voltage.';

export const CASES: Case[] = [
  { q: PE, target: 'Eph', value: (h * c) / 380e-9 },
  { q: PE, target: 'K', value: (h * c) / 380e-9 - 2.2 * e },
  { q: PE, target: 'Vs', value: ((h * c) / 380e-9 - 2.2 * e) / e },
  { q: 'Light with a frequency of 7.5 × 10^14 Hz shines on a metal with a work function of 2.3 eV. What is the maximum speed of the ejected electrons?', target: 'vmax', value: Math.sqrt((2 * (h * 7.5e14 - 2.3 * e)) / me) },
  { q: 'Determine the de Broglie wavelength of a neutron moving at 2.0 km/s.', target: 'lambda', value: h / (mn * 2000) },
  { q: 'A ball is launched vertically upwards at 15 m/s. What maximum height does it reach?', target: 'H', value: 225 / (2 * g) },
  { q: 'A 2.0 kg ball is dropped from a height of 20 m. Calculate its speed just before it hits the ground.', target: 'v', value: Math.sqrt(2 * g * 20) },
  { q: 'Calculate the period of a satellite orbiting 500 km above the surface of Mars (mass of Mars 6.42 × 10^23 kg, radius of Mars 3.39 × 10^6 m).', target: 'T', value: 2 * Math.PI * Math.sqrt((3.39e6 + 5e5) ** 3 / (G * 6.42e23)) },
  { q: 'A wire 0.50 m long carries a current of 3.0 A. The wire experiences a force of 0.60 N when it is perpendicular to a uniform magnetic field. Calculate the magnetic field strength.', target: 'B', value: 0.6 / (0.5 * 3) },
  { q: 'A step-up transformer has a turns ratio of 1:20. If the input voltage is 240 V, what is the output voltage?', target: 'Vs', value: 4800 },
  { q: 'An electron is fired at 3.0 × 10^7 m/s at right angles to a magnetic field of 1.5 × 10^-3 T. What is the radius of its path?', target: 'r', value: (me * 3e7) / (e * 1.5e-3) },
  { q: 'Calculate the energy released when 2.0 kg of mass is converted completely into energy.', target: 'E', value: 2 * c * c },
  { q: 'A muon has a mean lifetime of 2.2 μs in its rest frame. It travels at 0.995c. How far does it travel during one mean lifetime as measured by an observer on Earth?', target: 'd', value: 0.995 * c * (2.2e-6 / Math.sqrt(1 - 0.995 ** 2)) },
  { q: 'Calculate the wavelength of the photon emitted when the electron in a hydrogen atom moves from the third energy level to the ground state.', target: 'lambda', value: 1 / (R * (1 - 1 / 9)) },
  { q: 'A radioactive isotope has a half-life of 6.0 hours. What fraction of the original sample remains after 1 day?', target: 'Nt', value: 1 / 16 },
  { q: 'Radium-226 has a half-life of 1600 years. Calculate its decay constant.', target: 'lam', value: Math.LN2 / (1600 * yr) },
  { q: 'A 60 kg person stands on the surface of the Earth. Calculate the gravitational force between the person and the Earth.', target: 'F', value: (G * ME * 60) / RE ** 2 },
  { q: 'Calculate the momentum of an electron with a de Broglie wavelength of 0.15 nm.', target: 'p', value: h / 0.15e-9 },
  { q: 'Light of wavelength 500 nm is incident on a diffraction grating with 300 lines/mm. Calculate the angle at which the second-order maximum occurs.', target: 'theta', value: Math.asin((2 * 500e-9) / (1e-3 / 300)) },
  { q: 'Two slits separated by 0.25 mm are illuminated by light of wavelength 633 nm. Calculate the angle to the first dark fringe.', target: 'theta', value: Math.asin((0.5 * 633e-9) / 0.25e-3) },
  { q: 'A projectile is launched at 30.0 m s^-1 at an angle of 60.0° to the horizontal. Calculate the horizontal component of its velocity.', target: 'ux', value: 15 },
  { q: 'What is the speed of a satellite in a circular orbit of radius 7.0 × 10^6 m around the Earth?', target: 'v', value: Math.sqrt((G * ME) / 7e6) },
  { q: 'Calculate the magnetic flux through a circular loop of radius 5.0 cm in a magnetic field of 0.30 T that is perpendicular to the plane of the loop.', target: 'Phi', value: 0.3 * Math.PI * 0.05 ** 2 },
  { q: 'A 0.25 kg ball on the end of a 0.80 m string is swung in a horizontal circle at 4.0 m/s. Calculate the tension in the string.', target: 'Fc', value: (0.25 * 16) / 0.8 },
  { q: 'A rod has a rest length of 1.0 m. Calculate its length as measured by a stationary observer when it moves at 0.60c along its length.', target: 'l', value: 0.8 },
  { q: 'A proton ($m_p = 1.673\\times10^{-27}$ kg) moves at $v = 2.0\\times10^{6}\\,\\text{m s}^{-1}$ perpendicular to a magnetic field of $B = 0.40\\,\\text{T}$. Calculate the magnetic force on the proton.', target: 'F', value: e * 2e6 * 0.4 },
  { q: 'Calculate the kinetic energy, in MeV, of an alpha particle travelling at 1.5 × 10^7 m/s.', target: 'K', value: 0.5 * mAlpha * 1.5e7 ** 2 },
  { q: 'What is the energy, in eV, of a photon of frequency 5.0 × 10^14 Hz?', target: 'E', value: h * 5e14 },
  { q: 'A car travels around a banked curve of radius 120 m at its design speed of 25 m/s. Calculate the angle at which the curve is banked.', target: 'theta', value: Math.atan(625 / (120 * g)) },
  { q: 'A charge of 4.0 μC experiences a force of 0.020 N in a uniform electric field. Calculate the electric field strength.', target: 'E', value: 0.02 / 4e-6 },
  { q: 'An electron in a hydrogen atom is in the first excited state. Calculate the wavelength of the photon emitted when it returns to the ground state.', target: 'lambda', value: 1 / (R * (1 - 1 / 4)) },
  { q: 'A 1500 kg satellite orbits the Earth at an altitude of 2.0 × 10^6 m. Calculate its kinetic energy.', target: 'K', value: (G * ME * 1500) / (2 * (RE + 2e6)) },
  { q: 'Calculate the speed of an electron with a kinetic energy of 100 eV.', target: 'v', value: Math.sqrt((2 * 100 * e) / me) },
  { q: 'A proton travels at 2.5 × 10^7 m/s. Calculate its de Broglie wavelength.', target: 'lambda', value: h / (mp * 2.5e7) },
  { q: 'A 250 g mass is attached to a string and whirled in a horizontal circle of radius 1.2 m. It completes 30 revolutions in 20 s. Calculate the centripetal force.', target: 'Fc', value: 0.25 * 4 * Math.PI ** 2 * 1.2 * 1.5 ** 2 },
];
void D;
