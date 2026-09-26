/** Element symbols and names by atomic number (from the periodic table on the NESA data sheet). */
export const ELEMENTS: Array<[string, string]> = [
  ['n', 'neutron'],
  ['H', 'hydrogen'], ['He', 'helium'], ['Li', 'lithium'], ['Be', 'beryllium'], ['B', 'boron'], ['C', 'carbon'], ['N', 'nitrogen'], ['O', 'oxygen'], ['F', 'fluorine'], ['Ne', 'neon'],
  ['Na', 'sodium'], ['Mg', 'magnesium'], ['Al', 'aluminium'], ['Si', 'silicon'], ['P', 'phosphorus'], ['S', 'sulfur'], ['Cl', 'chlorine'], ['Ar', 'argon'], ['K', 'potassium'], ['Ca', 'calcium'],
  ['Sc', 'scandium'], ['Ti', 'titanium'], ['V', 'vanadium'], ['Cr', 'chromium'], ['Mn', 'manganese'], ['Fe', 'iron'], ['Co', 'cobalt'], ['Ni', 'nickel'], ['Cu', 'copper'], ['Zn', 'zinc'],
  ['Ga', 'gallium'], ['Ge', 'germanium'], ['As', 'arsenic'], ['Se', 'selenium'], ['Br', 'bromine'], ['Kr', 'krypton'], ['Rb', 'rubidium'], ['Sr', 'strontium'], ['Y', 'yttrium'], ['Zr', 'zirconium'],
  ['Nb', 'niobium'], ['Mo', 'molybdenum'], ['Tc', 'technetium'], ['Ru', 'ruthenium'], ['Rh', 'rhodium'], ['Pd', 'palladium'], ['Ag', 'silver'], ['Cd', 'cadmium'], ['In', 'indium'], ['Sn', 'tin'],
  ['Sb', 'antimony'], ['Te', 'tellurium'], ['I', 'iodine'], ['Xe', 'xenon'], ['Cs', 'caesium'], ['Ba', 'barium'], ['La', 'lanthanum'], ['Ce', 'cerium'], ['Pr', 'praseodymium'], ['Nd', 'neodymium'],
  ['Pm', 'promethium'], ['Sm', 'samarium'], ['Eu', 'europium'], ['Gd', 'gadolinium'], ['Tb', 'terbium'], ['Dy', 'dysprosium'], ['Ho', 'holmium'], ['Er', 'erbium'], ['Tm', 'thulium'], ['Yb', 'ytterbium'],
  ['Lu', 'lutetium'], ['Hf', 'hafnium'], ['Ta', 'tantalum'], ['W', 'tungsten'], ['Re', 'rhenium'], ['Os', 'osmium'], ['Ir', 'iridium'], ['Pt', 'platinum'], ['Au', 'gold'], ['Hg', 'mercury'],
  ['Tl', 'thallium'], ['Pb', 'lead'], ['Bi', 'bismuth'], ['Po', 'polonium'], ['At', 'astatine'], ['Rn', 'radon'], ['Fr', 'francium'], ['Ra', 'radium'], ['Ac', 'actinium'], ['Th', 'thorium'],
  ['Pa', 'protactinium'], ['U', 'uranium'], ['Np', 'neptunium'], ['Pu', 'plutonium'], ['Am', 'americium'], ['Cm', 'curium'], ['Bk', 'berkelium'], ['Cf', 'californium'], ['Es', 'einsteinium'], ['Fm', 'fermium'],
  ['Md', 'mendelevium'], ['No', 'nobelium'], ['Lr', 'lawrencium'], ['Rf', 'rutherfordium'], ['Db', 'dubnium'], ['Sg', 'seaborgium'], ['Bh', 'bohrium'], ['Hs', 'hassium'], ['Mt', 'meitnerium'], ['Ds', 'darmstadtium'],
  ['Rg', 'roentgenium'], ['Cn', 'copernicium'], ['Nh', 'nihonium'], ['Fl', 'flerovium'], ['Mc', 'moscovium'], ['Lv', 'livermorium'], ['Ts', 'tennessine'], ['Og', 'oganesson'],
];

export function elementZ(symOrName: string): number | null {
  const s = symOrName.trim();
  const low = s.toLowerCase();
  const alias: Record<string, string> = { aluminum: 'aluminium', cesium: 'caesium', sulphur: 'sulfur' };
  const name = alias[low] ?? low;
  for (let z = 1; z < ELEMENTS.length; z++) {
    if (ELEMENTS[z][0] === s || ELEMENTS[z][1] === name) return z;
  }
  return null;
}

export function elementSymbol(z: number): string {
  return ELEMENTS[z]?.[0] ?? '?';
}
export function elementName(z: number): string {
  return ELEMENTS[z]?.[1] ?? '?';
}

/** Find nuclide references such as "helium-4", "U-235", "carbon 14", "²³⁵U"-style "235U". */
export function findNuclides(text: string): Array<{ Z: number; A: number; label: string; index: number }> {
  const out: Array<{ Z: number; A: number; label: string; index: number }> = [];
  const re = /\b([A-Z][a-z]?|[a-z]{3,13})[\s-](\d{1,3})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const z = elementZ(m[1]);
    const A = Number(m[2]);
    if (z && A >= z && A <= 300 && (m[1].length > 2 || /[A-Z]/.test(m[1][0]))) {
      if (m[1].length <= 2 && text[m.index + m[1].length] === ' ') continue; // "N 3" etc.
      out.push({ Z: z, A, label: `${elementName(z)}-${A}`, index: m.index });
    }
  }
  return out;
}
