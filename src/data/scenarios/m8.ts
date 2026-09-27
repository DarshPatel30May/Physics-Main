import type { Scenario } from '../../engine/scenario';

const eV = 1.602e-19;

export const M8_SCENARIOS: Scenario[] = [
  {
    id: 'star_energy', topic: 'stars', module: 8,
    title: 'Energy output of stars (E = mc²)',
    blurb: 'Mass converted to energy per second from a star’s luminosity, and total mass converted over a time.',
    vars: [
      { key: 'P', name: 'luminosity (power output)', cues: ['luminosity', 'power output', 'radiates', 'emits', 'output of', 'watt'] },
      { key: 'mdot', cues: ['mass lost per second', 'mass per second', 'each second', 'per second', 'rate'] },
      { key: 'E', name: 'energy emitted in time t', cues: ['energy', 'total energy'], advanced: true },
      { key: 't', cues: ['in one year', 'in one day', 'time', 'year', 'day'], advanced: true },
      { key: 'm', name: 'mass converted in time t', cues: ['mass converted', 'mass lost', 'total mass'], advanced: true },
    ],
    relations: [
      { f: 'mass_loss_rate', map: { P: 'P' } },
      { f: 'power_Et', map: {} },
      { f: 'mass_energy' },
    ],
    keywords: [['sun', 3], ['star', 3], ['luminosity', 4], ['mass lost', 3], ['mass per second', 4], ['fusion', 1], ['converted', 1]],
    targets: ['mdot', 'P', 'm', 'E'],
    defaultTarget: 'mdot',
  },
  {
    id: 'star_temp', topic: 'stars', module: 8,
    title: 'Stellar surface temperature (Wien)',
    blurb: 'Peak wavelength of a star’s spectrum ↔ surface temperature, λmax = b/T.',
    vars: [
      { key: 'lmax', cues: ['peak wavelength', 'peaks at', 'maximum intensity', 'wavelength', 'peak'] },
      { key: 'T', cues: ['surface temperature', 'temperature', 'kelvin'] },
    ],
    relations: [{ f: 'wien' }],
    keywords: [['star', 3], ['spectrum', 2], ['surface temperature', 4], ['peak', 2], ['wien', 5]],
    targets: ['T', 'lmax'],
    defaultTarget: 'T',
  },
  {
    id: 'hubble', topic: 'stars', module: 8,
    title: 'Hubble’s law and redshift (extension)',
    blurb: 'v = H₀D, z = Δλ/λ₀ ≈ v/c and age ≈ 1/H₀. Not on the NESA formulae sheet — shown for completeness only.',
    vars: [
      { key: 'v', cues: ['recession', 'receding', 'moving away', 'velocity', 'speed'] },
      { key: 'H0', cues: ['hubble constant', 'km/s/mpc'] },
      { key: 'D', cues: ['distance', 'mpc', 'away', 'light-years'] },
      { key: 'dl', cues: ['shift', 'shifted by', 'redshift of'] },
      { key: 'l0', cues: ['emitted', 'rest wavelength', 'laboratory', 'normally'] },
      { key: 'tH', symbol: 't_H', name: 'Hubble time', cues: ['age of the universe'], advanced: true },
    ],
    relations: [{ f: 'hubble' }, { f: 'redshift' }, { f: 'hubble_age', map: { t: 'tH' } }],
    keywords: [['hubble', 6], ['redshift', 5], ['receding', 4], ['galaxy', 3], ['expanding universe', 4], ['blueshift', 4]],
    targets: ['v', 'D', 'H0', 'tH'],
    defaultTarget: 'v',
  },
  {
    id: 'hydrogen', topic: 'atomic', module: 8,
    title: 'Hydrogen spectrum — Rydberg equation and energy levels',
    blurb: 'Wavelength, frequency and photon energy of transitions between levels nᵢ → n_f; energy levels Eₙ = −13.6/n² eV.',
    assumptions: ['Hydrogen (one-electron) atom.'],
    vars: [
      { key: 'ni', cues: ['from n =', 'n =', 'initial level', 'from the', 'excited state', 'upper level', 'falls from', 'drops from', 'transition from'] },
      { key: 'nf', cues: ['to n =', 'final level', 'to the', 'ground state', 'lower level', 'to level'] },
      { key: 'lambda', cues: ['wavelength', 'nm'] },
      { key: 'f', cues: ['frequency'] },
      { key: 'Eph', symbol: 'E_{\\text{photon}}', name: 'photon energy', cues: ['energy of the photon', 'photon energy', 'energy of the emitted', 'energy'] },
      { key: 'Ei', symbol: 'E_i', name: 'energy of initial level', cues: ['initial energy'], advanced: true },
      { key: 'Ef', symbol: 'E_f', name: 'energy of final level', cues: ['final energy'], advanced: true },
    ],
    relations: [
      { f: 'rydberg' },
      { f: 'em_wave' },
      { f: 'photon_E_lambda', map: { E: 'Eph' } },
      { f: 'photon_E', map: { E: 'Eph' }, priority: -1 },
      { f: 'bohr_level', map: { En: 'Ei', n: 'ni' }, priority: -1 },
      { f: 'bohr_level', map: { En: 'Ef', n: 'nf' }, priority: -1 },
      { f: 'transition', priority: -2 },
    ],
    keywords: [['hydrogen', 4], ['rydberg', 6], ['balmer', 5], ['lyman', 5], ['paschen', 5], ['energy level', 3], ['n =', 2], ['transition', 3], ['electron falls', 3], ['electron drops', 3], ['spectral line', 3]],
    targets: ['lambda', 'f', 'Eph', 'ni', 'nf', 'Ei'],
    defaultTarget: 'lambda',
    postNotes: (v, target) => {
      const out: string[] = [];
      if (v.lambda !== undefined && (target === 'lambda' || target === 'f' || target === 'Eph')) {
        const nm = v.lambda * 1e9;
        const region = nm < 10 ? 'X-ray' : nm < 400 ? 'ultraviolet' : nm <= 700 ? 'visible' : nm < 1e6 ? 'infrared' : 'microwave/radio';
        out.push(`λ = ${nm.toPrecision(3)} nm lies in the ${region} region of the spectrum${v.nf === 2 ? ' (Balmer series, n_f = 2)' : v.nf === 1 ? ' (Lyman series, n_f = 1)' : v.nf === 3 ? ' (Paschen series, n_f = 3)' : ''}.`);
      }
      return out;
    },
  },
  {
    id: 'energy_levels', topic: 'atomic', module: 8,
    title: 'Energy-level diagram transitions',
    blurb: 'Photon energy = difference between levels (values read from a diagram, usually in eV), then f and λ.',
    vars: [
      { key: 'Ei', cues: ['from', 'upper', 'initial', 'excited', 'drops from', 'falls from', 'from an energy level', 'from the energy level', 'from a level'], signed: true },
      { key: 'Ef', cues: ['to', 'lower', 'final', 'ground', 'to an energy level', 'to the energy level', 'to a level'], signed: true },
      { key: 'Eph', cues: ['photon energy', 'energy of the photon', 'energy'] },
      { key: 'f', cues: ['frequency'] },
      { key: 'lambda', cues: ['wavelength'] },
    ],
    relations: [{ f: 'transition' }, { f: 'photon_E', map: { E: 'Eph' } }, { f: 'em_wave' }],
    keywords: [['energy level diagram', 6], ['energy levels', 3], ['ev to', 2], ['level of', 2]],
    targets: ['Eph', 'lambda', 'f', 'Ef', 'Ei'],
    defaultTarget: 'lambda',
  },
  {
    id: 'millikan', topic: 'atomic', module: 8,
    title: 'Millikan’s oil-drop experiment',
    blurb: 'A stationary drop: qE = mg with E = V/d, and the number of excess electrons n = q/e.',
    assumptions: ['The drop is stationary (or moving at constant velocity) — electric and gravitational forces balance.'],
    vars: [
      { key: 'm', name: 'mass of drop', cues: ['mass', 'drop of mass', 'oil drop'] },
      { key: 'V', cues: ['potential difference', 'voltage', 'volt'] },
      { key: 'd', cues: ['apart', 'separation', 'separated by', 'plates'] },
      { key: 'E', cues: ['electric field', 'field strength'] },
      { key: 'q', name: 'charge on drop', cues: ['charge'] },
      { key: 'n', name: 'number of excess electrons', cues: ['number of electrons', 'excess electrons', 'how many electrons'] },
      { key: 'F', name: 'electric force (= weight)', cues: ['force'], advanced: true },
      { key: 'g', advanced: true },
    ],
    relations: [
      { f: 'efield_plates' },
      { f: 'millikan' },
      { f: 'electric_force' },
      { f: 'weight', map: { W: 'F' }, why: 'For a balanced drop the electric force equals the weight.' },
      { f: 'charge_quant' },
    ],
    keywords: [['millikan', 6], ['oil drop', 6], ['suspended', 3], ['stationary', 2], ['drop', 2], ['balanced', 2]],
    targets: ['q', 'n', 'm', 'V', 'E'],
    defaultTarget: 'q',
  },
  {
    id: 'thomson', topic: 'atomic', module: 8,
    title: 'Thomson’s charge-to-mass experiment',
    blurb: 'Crossed fields select v = E/B; the B field alone gives r = mv/qB ⇒ q/m = E/(B²r).',
    vars: [
      { key: 'E', cues: ['electric field'] },
      { key: 'V', cues: ['potential difference', 'voltage'] },
      { key: 'd', cues: ['apart', 'separation'] },
      { key: 'B', cues: ['magnetic field', 'tesla'] },
      { key: 'v', cues: ['speed', 'velocity'] },
      { key: 'r', cues: ['radius'] },
      { key: 'qm', cues: ['charge-to-mass', 'charge to mass', 'e/m', 'q/m'] },
    ],
    relations: [
      { f: 'vel_selector', why: 'Undeflected in crossed fields: qE = qvB.' },
      { f: 'efield_plates' },
      { f: 'thomson', why: 'In the magnetic field alone: qvB = mv²/r.' },
      { f: 'thomson_E', priority: -1 },
    ],
    keywords: [['thomson', 6], ['charge-to-mass', 6], ['charge to mass', 6], ['cathode ray', 4], ['e/m', 5]],
    targets: ['qm', 'v', 'r', 'B', 'E'],
    defaultTarget: 'qm',
  },
  {
    id: 'chadwick', topic: 'atomic', module: 8,
    title: 'Collisions — Chadwick’s neutron experiment',
    blurb: 'Conservation of momentum and head-on elastic collisions with a stationary target.',
    vars: [
      { key: 'm1', cues: ['neutron', 'incoming', 'mass of the neutron', 'first'] },
      { key: 'u1', cues: ['initial velocity', 'moving at', 'speed of', 'travelling at'] },
      { key: 'm2', cues: ['target', 'nucleus', 'proton', 'nitrogen', 'hydrogen'] },
      { key: 'u2', cues: ['initially at rest', 'stationary'], signed: true, assume: { value: 0, note: 'Target initially at rest.' } },
      { key: 'v1', name: 'final velocity of the incoming particle', cues: ['neutron after', 'rebounds', 'incoming particle after', 'bounces back'], signed: true },
      { key: 'v2', name: 'final velocity of the target', cues: ['recoil', 'recoils', 'knocked', 'ejected', 'nucleus after', 'of the nucleus', 'of the target', 'nitrogen', 'hydrogen nucleus', 'proton after', 'struck', 'target'], signed: true },
    ],
    relations: [
      { f: 'elastic_target', why: 'Head-on elastic collision with a stationary target.', priority: 1 },
      { f: 'momentum_cons' },
    ],
    keywords: [['chadwick', 6], ['collision', 3], ['recoil', 3], ['elastic', 3], ['momentum', 2], ['neutron', 1], ['paraffin', 3]],
    targets: ['v2', 'v1', 'm1', 'u1'],
    defaultTarget: 'v2',
  },
  {
    id: 'debroglie', topic: 'quantum', module: 8,
    title: 'de Broglie wavelength',
    blurb: 'λ = h/mv, from momentum, kinetic energy, or an accelerating voltage (λ = h/√(2mqV)).',
    assumptions: ['Non-relativistic (v ≪ c).'],
    vars: [
      { key: 'm', cues: ['mass', 'kg'] },
      { key: 'v', cues: ['speed', 'velocity', 'moving at', 'travelling at'] },
      { key: 'lambda', cues: ['wavelength', 'de broglie'] },
      { key: 'p', cues: ['momentum'] },
      { key: 'K', cues: ['kinetic energy', 'energy of'] },
      { key: 'V', name: 'accelerating voltage', cues: ['accelerated through', 'potential difference', 'voltage'] },
      { key: 'q', cues: ['charge'], advanced: true },
    ],
    relations: [
      { f: 'debroglie' },
      { f: 'debroglie_p' },
      { f: 'classical_p', why: 'Classical momentum p = mv.' },
      { f: 'kinetic' },
      { f: 'work_qV', map: { W: 'K' }, why: 'Accelerated from rest: kinetic energy gained = qV.' },
      { f: 'debroglie_V', priority: -1 },
    ],
    keywords: [['de broglie', 6], ['matter wave', 5], ['wavelength of the electron', 4], ['electron diffraction', 4], ['wavelength of a', 1], ['wave nature', 2], ['diffraction', 1]],
    targets: ['lambda', 'v', 'p', 'm', 'K', 'V'],
    defaultTarget: 'lambda',
    checks: (v) => (v.v !== undefined && v.v > 0.1 * 3e8 ? [{ level: 'warning', msg: 'v > 0.1c — the non-relativistic de Broglie calculation becomes inaccurate.' }] : []),
  },
  {
    id: 'bohr_orbit', topic: 'quantum', module: 8,
    title: 'Bohr orbits and electron standing waves',
    blurb: 'mvr = nh/2π and 2πr = nλ (a whole number of de Broglie wavelengths around the orbit).',
    vars: [
      { key: 'n', cues: ['n =', 'level', 'orbit number', 'state'] },
      { key: 'r', cues: ['radius'] },
      { key: 'v', cues: ['speed', 'velocity'] },
      { key: 'lambda', cues: ['wavelength'] },
      { key: 'm', advanced: true },
    ],
    relations: [{ f: 'bohr_quant' }, { f: 'debroglie_orbit' }, { f: 'debroglie' }],
    keywords: [['bohr', 3], ['standing wave', 5], ['angular momentum', 4], ['circumference', 3], ['orbit radius', 2]],
    targets: ['v', 'lambda', 'r', 'n'],
    defaultTarget: 'v',
  },
  {
    id: 'binding', topic: 'nuclear', module: 8,
    title: 'Mass defect and binding energy',
    blurb: 'Δm = Zmₚ + Nmₙ − m_nucleus, E_B = Δmc² (or × 931.5 MeV/u) and binding energy per nucleon.',
    vars: [
      { key: 'Z', cues: ['protons', 'atomic number', 'z ='] },
      { key: 'N', cues: ['neutrons', 'n ='] },
      { key: 'A', cues: ['nucleons', 'mass number', 'a ='] },
      { key: 'mnuc', cues: ['mass of the nucleus', 'nuclear mass', 'nucleus is', 'nucleus has', 'nucleus', 'mass of a', 'mass of', 'has a mass'] },
      { key: 'dm', cues: ['mass defect'] },
      { key: 'EB', cues: ['binding energy'] },
      { key: 'EBA', cues: ['per nucleon'] },
      { key: 'mp', advanced: true, cues: ['mass of a proton', 'mass of the proton', 'proton mass', 'proton is', 'protons'] },
      { key: 'mn', advanced: true, cues: ['mass of a neutron', 'mass of the neutron', 'neutron mass', 'neutron is', 'neutrons'] },
    ],
    relations: [
      { f: 'nucleons' },
      { f: 'mass_defect' },
      { f: 'binding_energy' },
      { f: 'be_per_nucleon' },
    ],
    keywords: [['binding energy', 6], ['mass defect', 6], ['per nucleon', 5], ['nucleus', 1], ['nucleons', 2]],
    targets: ['EB', 'EBA', 'dm', 'mnuc'],
    defaultTarget: 'EB',
    postNotes: (v) => {
      if (v.dm === undefined) return [];
      const u = 1.661e-27;
      const warn = Math.abs(v.mp - 1.673e-27) < 1e-35 || Math.abs(v.mn - 1.675e-27) < 1e-35
        ? ['Caution: the data-sheet proton and neutron masses (4 significant figures) were used. Mass defects are small differences of large numbers, so this can shift the binding energy by ~2%. If the question supplies nucleon masses (e.g. in u), enter those instead.']
        : [];
      const alt = (v.dm / u) * 931.5;
      return [...warn, `Alternative method (data sheet): Δm = ${(v.dm / u).toPrecision(5)} u × 931.5 MeV/u = ${alt.toPrecision(4)} MeV. Both methods are accepted; they differ slightly because the data-sheet constants are rounded.`];
    },
  },
  {
    id: 'reaction', topic: 'nuclear', module: 8,
    title: 'Energy released in a nuclear reaction',
    blurb: 'E = (m_reactants − m_products)c² for fission, fusion and decay; total energy from many reactions.',
    vars: [
      { key: 'mr', cues: ['reactants', 'total mass before', 'initial mass'] },
      { key: 'mprod', cues: ['products', 'total mass after', 'final mass'] },
      { key: 'dm', symbol: '\\Delta m', name: 'mass defect of reaction', q: 'mass', cues: ['mass defect', 'mass difference', 'mass lost', 'decrease in mass', 'less than', 'greater than', 'more than', 'lighter than', 'heavier than', 'difference in mass'] },
      { key: 'E', name: 'energy released per reaction', cues: ['energy released', 'energy', 'q value'], signed: true },
      { key: 'Nr', symbol: 'N', name: 'number of reactions', cues: ['reactions', 'fissions', 'nuclei'], advanced: true },
      { key: 'Etot', cues: ['total energy'], advanced: true },
      { key: 'P', name: 'power output', cues: ['power', 'produce', 'generates', 'mw', 'output'], advanced: true },
      { key: 'rate', symbol: 'n', name: 'reactions per second', cues: ['per second', 'fissions per second', 'reactions per second', 'each second'], advanced: true },
      { key: 't', name: 'time', cues: ['in', 'over', 'time'], advanced: true },
    ],
    relations: [
      { f: 'q_value' },
      { f: 'reaction_dm', map: {} },
      { f: 'mass_energy', map: { m: 'dm' }, why: 'Energy released equals the mass defect × c².' },
      { f: 'energy_total', map: { N: 'Nr' } },
      { f: 'photon_rate', map: { n: 'rate', E: 'E' }, why: 'Power = (reactions per second) × (energy per reaction).' },
      { f: 'power_Et', map: { E: 'Etot' } },
    ],
    keywords: [['fission', 5], ['fusion', 5], ['energy released', 5], ['reaction', 2], ['released', 1], ['nuclear reaction', 4], ['→', 1], ['decay', 1]],
    targets: ['E', 'dm', 'Etot', 'rate', 'Nr'],
    defaultTarget: 'E',
    postNotes: (v) => {
      if (v.E === undefined) return [];
      const MeV = v.E / (1e6 * eV);
      return [v.E >= 0 ? `Energy released = ${MeV.toPrecision(4)} MeV per reaction (products have less mass than reactants).` : `E < 0: the products are MORE massive — ${Math.abs(MeV).toPrecision(4)} MeV must be supplied for the reaction to occur.`];
    },
  },
  {
    id: 'decay', topic: 'radioactivity', module: 8,
    title: 'Radioactive decay and half-life',
    blurb: 'Nₜ = N₀e^(−λt), λ = ln2/t½, number of half-lives, activity A = λN. Works for nuclei, mass or activity.',
    vars: [
      { key: 'N0', name: 'initial amount', cues: ['initial', 'initially', 'originally', 'starts with', 'sample of', 'sample has', 'has a mass of', 'mass of', 'contains', 'begins with', 'initial activity', 'sample contains', 'from', 'falls from', 'drops from'] },
      { key: 'Nt', name: 'amount remaining', cues: ['remain', 'remaining', 'left', 'after', 'decreased to', 'falls to', 'drops to', 'to', 'of its original', 'of the original', 'of its initial', 'of the initial'] },
      { key: 'thalf', cues: ['half-life', 'half life', 'halflife'] },
      { key: 't', name: 'elapsed time', cues: ['after', 'time', 'elapsed', 'how long', 'years later', 'days later', 'in', 'over', 'period of', 'within', 'age', 'how old'] },
      { key: 'lam', cues: ['decay constant'] },
      { key: 'n', name: 'number of half-lives', cues: ['half-lives', 'number of half'] },
      { key: 'A', name: 'activity', cues: ['activity', 'becquerel', 'bq', 'decays per second'], advanced: true },
      { key: 'N', name: 'number of nuclei (for activity)', cues: ['nuclei', 'atoms'], advanced: true },
    ],
    relations: [
      { f: 'decay_const' },
      { f: 'half_lives', priority: 1 },
      { f: 'decay_halves', priority: 1, why: 'Each half-life halves the amount remaining.' },
      { f: 'decay' },
      { f: 'activity' },
    ],
    keywords: [['half-life', 6], ['half life', 6], ['decay constant', 5], ['radioactive', 4], ['decays', 3], ['activity', 3], ['remains', 2], ['isotope', 2], ['carbon-14', 3], ['becquerel', 3]],
    targets: ['Nt', 't', 'thalf', 'N0', 'lam', 'n', 'A'],
    defaultTarget: 'Nt',
    checks: (v) => {
      const out: Array<{ level: 'error' | 'warning'; msg: string }> = [];
      if (v.Nt !== undefined && v.N0 !== undefined && v.Nt > v.N0 * (1 + 1e-9)) out.push({ level: 'error', msg: 'The amount remaining cannot exceed the initial amount for radioactive decay.' });
      return out;
    },
    postNotes: (v, target) => {
      const n: string[] = [];
      if (v.n !== undefined && Math.abs(v.n - Math.round(v.n)) < 1e-6 && v.n > 0) n.push(`Exactly ${Math.round(v.n)} half-lives have elapsed: the amount has halved ${Math.round(v.n)} times (fraction remaining = 1/${2 ** Math.round(v.n)}).`);
      if (target === 'Nt' && v.lam !== undefined && v.t !== undefined && v.N0 !== undefined) n.push(`Check with Nₜ = N₀e^(−λt): λ = ${v.lam.toPrecision(4)} per unit time ⇒ Nₜ = ${(v.N0 * Math.exp(-v.lam * v.t)).toPrecision(4)} (same result).`);
      return n;
    },
  },
];
