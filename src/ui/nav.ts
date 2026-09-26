import type { ModuleId, TopicId } from '../engine/types';

export type ToolId =
  | 'projectileTool' | 'forcesTool' | 'beamTool' | 'directionTool' | 'lenzTool' | 'nuclearTool' | 'reactionTool' | 'decayEquationTool'
  | 'decayGraph' | 'photoelectricTool' | 'standardModelTool' | 'blackbodyGraph' | 'gammaGraph' | 'gravityGraph' | 'orbitGraph'
  | 'spectrumTool' | 'hydrogenLevels' | 'fieldGraph' | 'deflectionGraph' | 'fringeTool' | 'circularGraph';

export interface TopicDef {
  id: TopicId;
  module: ModuleId;
  label: string;
  inquiry: string;
  scenarios: string[];
  tools: ToolId[];
  summary: string;
}

export const MODULE_NAMES: Record<ModuleId, string> = {
  5: 'Advanced Mechanics',
  6: 'Electromagnetism',
  7: 'The Nature of Light',
  8: 'From the Universe to the Atom',
};

export const TOPICS: TopicDef[] = [
  // Module 5
  { id: 'projectile', module: 5, label: 'Projectile Motion', inquiry: 'How can models that are used to explain projectile motion be used to analyse and make predictions?', scenarios: ['projectile', 'projectile_level'], tools: ['projectileTool'], summary: 'Resolve the launch velocity, treat horizontal (aₓ = 0) and vertical (a_y = −g) motion independently, then recombine.' },
  { id: 'circular', module: 5, label: 'Circular Motion', inquiry: 'Why do objects move in circles?', scenarios: ['circular', 'banked', 'vertical_circle'], tools: ['circularGraph'], summary: 'aᶜ = v²/r, F꜀ = mv²/r, v = 2πr/T, ω = Δθ/t — the net force points to the centre.' },
  { id: 'gravitation', module: 5, label: 'Gravitation', inquiry: 'How does the force of gravity determine the motion of planets and satellites?', scenarios: ['gravitation'], tools: ['gravityGraph'], summary: 'F = GMm/r², g = GM/r², U = −GMm/r, escape velocity. r is measured from the centre.' },
  { id: 'orbital', module: 5, label: 'Orbital Motion', inquiry: 'How does the force of gravity determine the motion of planets and satellites?', scenarios: ['orbit', 'orbit_change', 'kepler_compare'], tools: ['orbitGraph'], summary: 'GMm/r² = mv²/r ⇒ v = √(GM/r); Kepler’s third law r³/T² = GM/4π²; E = −GMm/2r.' },
  { id: 'forces', module: 5, label: 'Forces', inquiry: 'Vectors in two dimensions — applied throughout Advanced Mechanics.', scenarios: ['vectors', 'incline', 'dynamics'], tools: ['forcesTool'], summary: 'Resolve forces into components, add components, recombine: F = √(Fₓ² + F_y²), θ = tan⁻¹(F_y/Fₓ).' },
  { id: 'torque', module: 5, label: 'Torque', inquiry: 'Why do objects move in circles? — rotation of mechanical systems and applied torque.', scenarios: ['torque'], tools: ['beamTool'], summary: 'τ = r⊥F = rF sin θ. Equilibrium: Σ clockwise moments = Σ anticlockwise moments.' },
  // Module 6
  { id: 'efields', module: 6, label: 'Electric Fields', inquiry: 'What happens to stationary and moving charged particles when they interact with an electric or magnetic field?', scenarios: ['plates', 'coulomb'], tools: ['fieldGraph', 'directionTool'], summary: 'E = V/d, F = qE, W = qV = qEd. Positive charges move along E, negative charges against it.' },
  { id: 'particles', module: 6, label: 'Charged Particles', inquiry: 'What happens to stationary and moving charged particles when they interact with an electric or magnetic field?', scenarios: ['deflection', 'plates'], tools: ['deflectionGraph'], summary: 'In a uniform E field a charge moves like a projectile: a = qE/m across the field, constant velocity along it.' },
  { id: 'bfields', module: 6, label: 'Magnetic Fields', inquiry: 'What happens to stationary and moving charged particles when they interact with an electric or magnetic field?', scenarios: ['magnetic_particle', 'velocity_selector', 'wire_field'], tools: ['directionTool'], summary: 'F = qvB sin θ ⟂ v and B; circular motion with r = mv/qB. Negative charges curve the opposite way.' },
  { id: 'motor', module: 6, label: 'Motor Effect', inquiry: 'Under what circumstances is a force produced on a current-carrying conductor in a magnetic field?', scenarios: ['motor_force', 'parallel_wires', 'dc_motor'], tools: ['directionTool'], summary: 'F = lIB sin θ; F/l = μ₀I₁I₂/2πr; τ = nIAB sin θ; back emf in DC motors.' },
  { id: 'induction', module: 6, label: 'Electromagnetic Induction', inquiry: 'How are electric and magnetic fields related?', scenarios: ['flux', 'faraday', 'rod', 'generator'], tools: ['lenzTool'], summary: 'Φ = BA cos θ; ε = −NΔΦ/Δt. The minus sign is Lenz’s law — the induced current opposes the change.' },
  { id: 'transformers', module: 6, label: 'Transformers', inquiry: 'How has knowledge about electromagnetic induction been applied?', scenarios: ['transformer', 'transformer_real', 'transmission'], tools: [], summary: 'Vp/Vs = Np/Ns, VpIp = VsIs (ideal), η = Pout/Pin, line losses P = I²R.' },
  // Module 7
  { id: 'waves', module: 7, label: 'Waves', inquiry: 'What is light? (wave behaviour, refraction)', scenarios: ['waves', 'refraction', 'medium', 'critical'], tools: [], summary: 'v = fλ, n = c/v, n₁ sin θ₁ = n₂ sin θ₂, sin θc = n₂/n₁.' },
  { id: 'interference', module: 7, label: 'Interference', inquiry: 'What evidence supports the classical wave model of light and what predictions can be made using this model?', scenarios: ['interference', 'interference_dark'], tools: ['fringeTool'], summary: 'd sin θ = mλ for bright fringes; grating spacing d = 1/N; small-angle fringe spacing Δy = λL/d.' },
  { id: 'emr', module: 7, label: 'EM Radiation', inquiry: 'What is light? — electromagnetic spectrum, black-body radiation and polarisation.', scenarios: ['em_spectrum', 'wien', 'polarisation', 'intensity'], tools: ['spectrumTool', 'blackbodyGraph'], summary: 'c = fλ, λmax = b/T, I = Imax cos²θ.' },
  { id: 'quantumlight', module: 7, label: 'Quantum Light', inquiry: 'What evidence supports the particle model of light?', scenarios: ['photon'], tools: ['spectrumTool'], summary: 'E = hf = hc/λ; photons per second n = P/E.' },
  { id: 'photoelectric', module: 7, label: 'Photoelectric Effect', inquiry: 'What evidence supports the particle model of light?', scenarios: ['photoelectric'], tools: ['photoelectricTool'], summary: 'K_max = hf − φ, φ = hf₀, K_max = qV_s. Below f₀ no electrons are emitted.' },
  { id: 'relativity', module: 7, label: 'Special Relativity', inquiry: 'How does the behaviour of light affect concepts of time, space and matter?', scenarios: ['relativity', 'mass_energy'], tools: ['gammaGraph'], summary: 't = t₀/√(1 − v²/c²), l = l₀√(1 − v²/c²), p = m₀v/√(1 − v²/c²), E = mc².' },
  // Module 8
  { id: 'stars', module: 8, label: 'Stars & Spectra', inquiry: 'What evidence is there for the origins of the elements?', scenarios: ['star_temp', 'star_energy', 'hubble'], tools: ['blackbodyGraph'], summary: 'Wien’s law for stellar temperature; E = mc² for mass converted in stars.' },
  { id: 'atomic', module: 8, label: 'Atomic Models', inquiry: 'How is it known that atoms are made up of protons, neutrons and electrons? / How is it known that classical physics cannot explain the properties of the atom?', scenarios: ['hydrogen', 'energy_levels', 'millikan', 'thomson', 'chadwick'], tools: ['hydrogenLevels'], summary: 'Rydberg equation, energy-level transitions, Thomson’s q/m, Millikan’s oil drop, Chadwick’s collisions.' },
  { id: 'quantum', module: 8, label: 'Quantum Physics', inquiry: 'How is it known that classical physics cannot explain the properties of the atom?', scenarios: ['debroglie', 'bohr_orbit'], tools: [], summary: 'λ = h/mv; 2πr = nλ; mvr = nh/2π.' },
  { id: 'nuclear', module: 8, label: 'Nuclear Physics', inquiry: 'How can the energy of the atomic nucleus be harnessed?', scenarios: ['binding', 'reaction'], tools: ['nuclearTool', 'reactionTool', 'decayEquationTool'], summary: 'Mass defect, binding energy (per nucleon), energy released in fission/fusion, balancing nuclear equations.' },
  { id: 'radioactivity', module: 8, label: 'Radioactivity', inquiry: 'How can the energy of the atomic nucleus be harnessed?', scenarios: ['decay'], tools: ['decayGraph', 'decayEquationTool'], summary: 'Nₜ = N₀e^(−λt), λ = ln2/t½, A = λN.' },
  { id: 'standardmodel', module: 8, label: 'Standard Model', inquiry: 'How is it known that the atom is made up of smaller particles? (Deep inside the atom)', scenarios: [], tools: ['standardModelTool'], summary: 'Mostly conceptual. Numerical work: charges of hadrons from quarks and conservation checks in particle interactions.' },
];

export const TOPIC_BY_ID: Record<string, TopicDef> = Object.fromEntries(TOPICS.map((t) => [t.id, t]));

export const PAGES: Array<{ id: string; label: string }> = [
  { id: 'library', label: 'Formula Library' },
  { id: 'detect', label: 'Smart Formula Detection' },
  { id: 'units', label: 'Unit Converter' },
  { id: 'constants', label: 'Constants' },
  { id: 'direction', label: 'Direction Tools' },
  { id: 'coverage', label: 'HSC Coverage Matrix' },
  { id: 'about', label: 'Sources & Method' },
];
