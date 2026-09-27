/* eslint-disable */
import type { Case } from './types';

const G = 6.67e-11, ME = 6.0e24, RE = 6.371e6, g = 9.8, c = 3.0e8, h = 6.626e-34, e = 1.602e-19;
const me = 9.109e-31, mp = 1.673e-27, mn = 1.675e-27, u = 1.661e-27, R = 1.097e7, b = 2.898e-3, D = Math.PI / 180;
const yr = 365.25 * 86400;


export const CASES: Case[] = [
  // ---------------- Module 5 ----------------
  { q: 'A ball is thrown horizontally at 12 m s-1 from a cliff 45 m high. How far from the base of the cliff does it land?', scenario: 'projectile', target: 'sx', value: 12 * Math.sqrt(90 / g) },
  { q: 'A projectile is launched at 25 m/s at 40° above the horizontal from level ground. Calculate its maximum height and its range.', target: 'H', value: (25 * Math.sin(40 * D)) ** 2 / (2 * g) },
  { q: 'A projectile is launched at 25 m/s at 40° above the horizontal from level ground. Calculate its maximum height and its range.', target: 'sx', value: (625 * Math.sin(80 * D)) / g, part: 1 },
  { q: 'A golf ball is hit at 30.0 m/s at an angle of 35° above the horizontal and lands on level ground. Calculate the time of flight.', target: 't', value: (2 * 30 * Math.sin(35 * D)) / g },
  { q: 'A stone is thrown from the top of a building 20 m high at 15 m/s at 30° above the horizontal. Calculate the horizontal distance from the building where it lands.', target: 'sx', value: 15 * Math.cos(30 * D) * ((7.5 + Math.sqrt(56.25 + 2 * g * 20)) / g) },
  { q: 'A ball rolls off a table 1.2 m high with a speed of 3.0 m/s. Calculate the speed of the ball just before it hits the floor.', target: 'v', value: Math.sqrt(9 + 2 * g * 1.2) },
  { q: 'A 1200 kg car travels around a flat bend of radius 50 m at 20 m/s. Calculate the centripetal force acting on the car.', scenario: 'circular', target: 'Fc', value: (1200 * 400) / 50 },
  { q: 'A 0.50 kg mass on a string moves in a horizontal circle of radius 0.80 m, completing 2.0 revolutions per second. Calculate the centripetal force.', target: 'Fc', value: 0.5 * 4 * Math.PI ** 2 * 0.8 * 4 },
  { q: 'A curve of radius 80 m is banked so that cars travelling at 60 km/h need no friction. Calculate the angle of banking.', scenario: 'banked', target: 'theta', value: Math.atan((60 / 3.6) ** 2 / (80 * g)) },
  { q: 'Calculate the magnitude of the gravitational force between the Earth and a 500 kg satellite at an altitude of 300 km.', target: 'F', value: (G * ME * 500) / (RE + 3e5) ** 2 },
  { q: 'Mars has a mass of 6.42 × 10^23 kg and a radius of 3.39 × 10^6 m. Calculate the gravitational field strength on the surface of Mars.', target: 'g', value: (G * 6.42e23) / 3.39e6 ** 2 },
  { q: 'A geostationary satellite orbits the Earth. Calculate its orbital radius.', target: 'r', value: Math.cbrt((G * ME * 86400 ** 2) / (4 * Math.PI ** 2)) },
  { q: 'The Moon orbits the Earth with a period of 27.3 days at an orbital radius of 3.84 × 10^8 m. Calculate the mass of the Earth.', target: 'M', value: (4 * Math.PI ** 2 * 3.84e8 ** 3) / (G * (27.3 * 86400) ** 2) },
  { q: 'A satellite of mass 1500 kg is in a circular orbit 2.0 × 10^7 m from the centre of the Earth. Calculate its total energy.', target: 'E', value: -(G * ME * 1500) / (2 * 2e7) },
  { q: 'Calculate the escape velocity from the surface of the Earth.', target: 'vesc', value: Math.sqrt((2 * G * ME) / RE) },
  { q: 'A satellite orbits the Earth at an altitude of 400 km. Calculate its orbital velocity.', target: 'v', value: Math.sqrt((G * ME) / (RE + 4e5)) },
  { q: 'A satellite orbits the Earth at an altitude of 400 km. Calculate its orbital period.', target: 'T', value: 2 * Math.PI * Math.sqrt((RE + 4e5) ** 3 / (G * ME)) },
  { q: 'A force of 40 N is applied to a spanner 0.25 m from the nut at an angle of 60° to the spanner. Calculate the torque.', scenario: 'torque', target: 'tau', value: 0.25 * 40 * Math.sin(60 * D) },
  { q: 'Calculate the energy required to move a 1000 kg satellite from an orbit at an altitude of 400 km to a higher orbit at an altitude of 800 km above Earth.', target: 'dE', value: ((G * ME * 1000) / 2) * (1 / (RE + 4e5) - 1 / (RE + 8e5)) },
  // ---------------- Module 6 ----------------
  { q: 'Two parallel plates are 2.0 cm apart and connected to a 500 V supply. Calculate the electric field strength between the plates.', target: 'E', value: 500 / 0.02 },
  { q: 'An electron is placed between parallel plates 5.0 mm apart with a potential difference of 100 V between them. Calculate the acceleration of the electron.', target: 'a', value: (e * (100 / 0.005)) / me },
  { q: 'An alpha particle is accelerated from rest through a potential difference of 2000 V. Calculate the kinetic energy gained by the alpha particle.', target: 'W', value: 2 * e * 2000 },
  { q: 'An electron travelling at 2.0 × 10^6 m/s enters a uniform magnetic field of 5.0 mT at right angles to the field. Calculate the radius of its circular path.', target: 'r', value: (me * 2e6) / (e * 5e-3) },
  { q: 'A proton enters a uniform magnetic field of 3.00 T perpendicular to the field with a velocity of 1200 m/s. Calculate the acceleration of the proton.', scenario: 'magnetic_particle', target: 'a', value: (e * 1200 * 3) / mp },
  { q: 'A 0.30 m length of wire carrying a current of 4.0 A is placed at 90° to a magnetic field of 0.25 T. Calculate the force on the wire.', target: 'F', value: 0.3 * 4 * 0.25 },
  { q: 'Two long parallel wires are 5.0 cm apart and carry currents of 10 A and 15 A in the same direction. Calculate the force per metre between them.', target: 'Fl', value: (4e-7 * Math.PI * 150) / (2 * Math.PI * 0.05) },
  { q: 'A rectangular coil of 50 turns measures 0.10 m by 0.20 m and carries a current of 2.0 A. It is in a 0.40 T magnetic field with its plane parallel to the field. Calculate the torque on the coil.', target: 'tau', value: 50 * 2 * 0.02 * 0.4 },
  { q: 'A coil of 200 turns and area 0.050 m² is placed in a magnetic field of 0.40 T. The field is reduced to zero in 0.10 s. Calculate the average induced emf.', target: 'emf', value: -(200 * (0 - 0.4 * 0.05)) / 0.1 },
  { q: 'A step-down transformer converts 240 V to 12 V. The secondary current is 2.0 A. Calculate the primary current, assuming the transformer is ideal.', target: 'Ip', value: (12 * 2) / 240 },
  { q: 'A transformer has 500 turns on the primary coil and 25 turns on the secondary coil. The primary is connected to a 240 V supply. Calculate the output voltage.', target: 'Vs', value: 12 },
  { q: 'A power station transmits 50 MW of power at 500 kV through transmission lines of total resistance 8.0 Ω. Calculate the power loss in the lines.', target: 'Ploss', value: (50e6 / 500e3) ** 2 * 8 },
  { q: 'A metal rod of length 0.50 m moves along rails at 4.0 m/s perpendicular to a magnetic field of 0.20 T. Calculate the emf induced across the rod.', target: 'emf', value: 0.2 * 0.5 * 4 },
  { q: 'A DC motor with a coil resistance of 2.0 Ω operates from a 24 V supply. When running at full speed the current is 1.5 A. Calculate the back emf.', target: 'eb', value: 24 - 3 },
  // ---------------- Module 7 ----------------
  { q: 'Calculate the frequency of light with a wavelength of 500 nm.', target: 'f', value: c / 500e-9 },
  { q: 'Calculate the energy of a photon of wavelength 500 nm.', target: 'E', value: (h * c) / 500e-9 },
  { q: 'Light of wavelength 600 nm passes through two slits 0.20 mm apart. Calculate the fringe spacing on a screen 2.0 m away.', target: 'dy', value: (600e-9 * 2) / 0.2e-3 },
  { q: 'A diffraction grating with 600 lines per mm is illuminated with light of wavelength 550 nm. Calculate the angle of the first-order maximum.', target: 'theta', value: Math.asin(550e-9 / (1e-3 / 600)) },
  { q: 'The peak wavelength of a star’s spectrum is 480 nm. Calculate its surface temperature.', target: 'T', value: b / 480e-9 },
  { q: 'The work function of sodium is 2.28 eV. Calculate the threshold frequency for sodium.', target: 'f0', value: (2.28 * e) / h },
  { q: 'Ultraviolet light of frequency 1.5 × 10^15 Hz illuminates a metal with a work function of 4.2 eV. Calculate the stopping voltage.', target: 'Vs', value: (h * 1.5e15 - 4.2 * e) / e },
  { q: 'Light of wavelength 450 nm is incident on a metal with a work function of 2.3 eV. Calculate the maximum kinetic energy of the emitted photoelectrons.', target: 'K', value: (h * c) / 450e-9 - 2.3 * e },
  { q: 'A spacecraft of rest length 120 m travels at 0.95c relative to Earth. What is its length as measured by an observer on Earth?', target: 'l', value: 120 * Math.sqrt(1 - 0.95 ** 2) },
  { q: 'Muons have a half-life of 2.2 μs when at rest. Muons travelling at 0.98c are produced in the upper atmosphere. Calculate the half-life of the muons as measured by an observer on Earth.', target: 't', value: 2.2e-6 / Math.sqrt(1 - 0.98 ** 2) },
  { q: 'A spaceship travels at 0.80c relative to Earth. A clock on board the spaceship measures a time interval of 2.0 hours. What time interval is measured by an observer on Earth?', target: 't', value: 7200 / 0.6 },
  { q: 'Calculate the relativistic momentum of an electron travelling at 0.90c.', target: 'p', value: (me * 0.9 * c) / Math.sqrt(1 - 0.81) },
  { q: 'Calculate the energy equivalent of 1.0 g of matter.', target: 'E', value: 1e-3 * c * c },
  { q: 'Calculate the Lorentz factor for an object moving at 0.80c.', target: 'gamma', value: 1 / 0.6 },
  // ---------------- Module 8 ----------------
  { q: 'Calculate the wavelength of the photon emitted when an electron in a hydrogen atom falls from n = 4 to n = 2.', target: 'lambda', value: 1 / (R * (1 / 4 - 1 / 16)) },
  { q: 'Calculate the de Broglie wavelength of an electron travelling at 3.0 × 10^6 m/s.', target: 'lambda', value: h / (me * 3e6) },
  { q: 'An electron is accelerated from rest through a potential difference of 150 V. Calculate its de Broglie wavelength.', target: 'lambda', value: h / Math.sqrt(2 * me * e * 150) },
  { q: 'An oil drop of mass 3.2 × 10^-15 kg is held stationary between two horizontal plates 1.5 cm apart when the potential difference across them is 490 V. Calculate the charge on the drop.', target: 'q', value: (3.2e-15 * g * 0.015) / 490 },
  { q: 'The mass of a proton is 1.007276 u, the mass of a neutron is 1.008665 u and the mass of a helium-4 nucleus is 4.001506 u. Calculate the binding energy of the helium-4 nucleus.', target: 'EB', value: (2 * 1.007276 + 2 * 1.008665 - 4.001506) * u * c * c },
  { q: 'Iodine-131 has a half-life of 8.0 days. What fraction of a sample remains after 24 days?', target: 'Nt', value: 0.125 },
  { q: 'A radioactive sample has a mass of 120 g. The half-life of the isotope is 30 years. How much of the sample remains after 90 years?', target: 'Nt', value: 0.015 },
  { q: 'The activity of a sample falls from 800 Bq to 100 Bq in 36 hours. Calculate the half-life of the sample.', target: 'thalf', value: 12 * 3600 },
  { q: 'Calculate the decay constant of a radioisotope with a half-life of 5.27 years.', target: 'lam', value: Math.LN2 / (5.27 * yr) },
  { q: 'In a fusion reaction the total mass of the reactants is 5.03013 u and the total mass of the products is 5.01128 u. Calculate the energy released.', target: 'E', value: (5.03013 - 5.01128) * u * c * c },
  { q: 'In a Thomson-type experiment, electrons pass undeflected through crossed fields with E = 2.0 × 10^4 V/m and B = 2.5 × 10^-3 T. When the electric field is switched off, the electrons move in a circle of radius 4.5 cm. Calculate the charge-to-mass ratio of the electron.', target: 'qm', value: 2e4 / (2.5e-3 ** 2 * 0.045) },
  { q: 'The Sun has a luminosity of 3.8 × 10^26 W. Calculate the mass converted into energy by the Sun each second.', target: 'mdot', value: 3.8e26 / (c * c) },
  { q: 'A neutron travelling at 3.0 × 10^7 m/s collides head-on elastically with a stationary nitrogen nucleus of mass 2.3 × 10^-26 kg. Calculate the speed of the nitrogen nucleus after the collision.', target: 'v2', value: (2 * mn * 3e7) / (mn + 2.3e-26) },
];
