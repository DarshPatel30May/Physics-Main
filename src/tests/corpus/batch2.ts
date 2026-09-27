/* eslint-disable */
import type { Case } from './types';

const G = 6.67e-11, ME = 6.0e24, RE = 6.371e6, g = 9.8, c = 3.0e8, h = 6.626e-34, e = 1.602e-19;
const me = 9.109e-31, mp = 1.673e-27, D = Math.PI / 180, yr = 365.25 * 86400, ly = 9.461e15;

export const CASES: Case[] = [
  { q: 'A ball is kicked from ground level at 18 m/s at 50° to the horizontal. Take g = 10 m/s². Calculate the maximum height reached.', target: 'H', value: (18 * Math.sin(50 * D)) ** 2 / 20 },
  { q: 'A projectile is launched on level ground with a speed of 30 m/s and lands 80 m away. Calculate the launch angle.', target: 'theta', value: Math.asin((80 * g) / 900) / 2 },
  { q: 'A ball is launched from ground level at 20 m/s at 60° above the horizontal and lands on a roof 5.0 m above the ground. Calculate the time of flight.', target: 't', value: (20 * Math.sin(60 * D) + Math.sqrt((20 * Math.sin(60 * D)) ** 2 - 2 * g * 5)) / g },
  { q: 'A 70 kg astronaut stands on the surface of Mars. Mars has a mass of 6.42 × 10^23 kg and a radius of 3.39 × 10^6 m. Calculate the weight of the astronaut on Mars.', target: 'F', value: (G * 6.42e23 * 70) / 3.39e6 ** 2 },
  { q: 'Moon A orbits a planet with a period of 2.0 days at an orbital radius of 4.0 × 10^8 m. Another moon, B, orbits the same planet at an orbital radius of 9.0 × 10^8 m. Calculate the orbital period of moon B.', target: 'T2', value: 2 * 86400 * Math.sqrt((9 / 4) ** 3) },
  { q: 'Calculate the gravitational field strength at an altitude of 2000 km above the Earth’s surface.', target: 'g', value: (G * ME) / (RE + 2e6) ** 2 },
  { q: 'A car of mass 1500 kg travels around a flat curve of radius 40 m. The maximum friction force between the tyres and road is 9000 N. Calculate the maximum speed at which the car can travel around the curve.', target: 'v', value: Math.sqrt((9000 * 40) / 1500) },
  { q: 'An electron is accelerated from rest between two parallel plates with a potential difference of 500 V. Calculate the speed of the electron when it reaches the positive plate.', target: 'v', value: Math.sqrt((2 * e * 500) / me) },
  { q: 'Calculate the work done in moving a charge of 3.0 μC through a potential difference of 12 V.', target: 'W', value: 3e-6 * 12 },
  { q: 'A velocity selector has an electric field of 3.0 × 10^4 V/m and a magnetic field of 0.15 T. Calculate the speed of the particles that pass through undeflected.', target: 'v', value: 3e4 / 0.15 },
  { q: 'Calculate the magnitude of the magnetic force on an alpha particle moving at 3.0 × 10^6 m/s at 30° to a magnetic field of 0.20 T.', target: 'F', value: 2 * e * 3e6 * 0.2 * 0.5 },
  { q: 'A transformer has an input power of 1200 W and an output power of 1080 W. Calculate its efficiency.', target: 'eta', value: 0.9 },
  { q: 'Unpolarised light of intensity 80 W/m² passes through two polarisers whose transmission axes are at 60° to each other. Calculate the intensity of the light emerging from the second polariser.', target: 'I', value: 40 * Math.cos(60 * D) ** 2 },
  { q: 'Light travelling in air strikes glass of refractive index 1.52 with an angle of incidence of 40°. Calculate the angle of refraction.', target: 'th2', value: Math.asin(Math.sin(40 * D) / 1.52) },
  { q: 'Calculate the critical angle for light travelling from glass of refractive index 1.50 into air.', target: 'thc', value: Math.asin(1 / 1.5) },
  { q: 'Calculate the speed of light in water, which has a refractive index of 1.33.', target: 'v', alt: 'v2', value: c / 1.33 },
  { q: 'A 5.0 mW laser emits light of wavelength 633 nm. Calculate the number of photons emitted per second.', target: 'n', value: 5e-3 / ((h * c) / 633e-9) },
  { q: 'A star is 4.2 light-years from Earth. A spacecraft travels to the star at 0.90c. Calculate the time taken for the journey as measured by an astronaut on the spacecraft.', target: 't0', value: ((4.2 * ly) / (0.9 * c)) * Math.sqrt(1 - 0.81) },
  { q: 'A spacecraft travels to a star 4.2 light-years from Earth at 0.90c. Calculate the distance to the star as measured by the astronaut.', target: 'l', value: 4.2 * ly * Math.sqrt(1 - 0.81) },
  { q: 'At what speed must a rod travel for its length to be contracted to 60% of its rest length?', target: 'v', value: c * Math.sqrt(1 - 0.36), tol: 0.01 },
  { q: 'Calculate the wavelength of the photon absorbed when an electron in a hydrogen atom moves from n = 2 to n = 5.', target: 'lambda', value: 1 / (1.097e7 * (1 / 4 - 1 / 25)) },
  { q: 'An electron in an atom drops from an energy level of −1.51 eV to an energy level of −3.40 eV. Calculate the wavelength of the photon emitted.', target: 'lambda', value: (h * c) / (1.89 * e) },
  { q: 'Calculate the de Broglie wavelength of a proton with a kinetic energy of 5.0 keV.', target: 'lambda', value: h / Math.sqrt(2 * mp * 5e3 * e) },
  { q: 'Each fission of uranium-235 releases 200 MeV. Calculate the number of fissions per second needed to produce a power of 500 MW.', target: 'rate', value: 500e6 / (200e6 * e) },
  { q: 'A sample of carbon-14 has 25% of its original activity. The half-life of carbon-14 is 5730 years. Calculate the age of the sample.', target: 't', value: 2 * 5730 * yr },
  { q: 'A radioisotope has a decay constant of 0.0231 per day. Calculate its half-life.', target: 'thalf', value: (Math.LN2 / 0.0231) * 86400 },
  { q: 'Calculate the mass defect when 3.6 × 10^-11 J of energy is released in a nuclear reaction.', target: 'dm', value: 3.6e-11 / (c * c) },
  { q: 'A coil of 150 turns and area 0.020 m² rotates in a magnetic field of 0.50 T from a position where its plane is perpendicular to the field to a position where its plane is parallel to the field in 0.025 s. Calculate the average emf induced.', target: 'eavg', value: (150 * 0.5 * 0.02) / 0.025 },
  { q: 'Calculate the torque on a single loop of area 0.010 m² carrying 5.0 A in a field of 0.30 T when the plane of the loop makes an angle of 30° with the field.', target: 'tau', value: 1 * 5 * 0.01 * 0.3 * Math.cos(30 * D) },
  { q: 'Calculate the magnetic flux through a square loop of side 0.10 m in a field of 0.25 T that is perpendicular to the plane of the loop.', target: 'Phi', value: 0.25 * 0.01 },
];
