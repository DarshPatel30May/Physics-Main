/**
 * Direction engine for vector reasoning on a page diagram.
 * Coordinates: +x = right (east), +y = up the page (north), +z = OUT of the page.
 */
export type Vec3 = [number, number, number];

export type DirWord =
  | 'right' | 'left' | 'up' | 'down' | 'out' | 'in';

export const DIR_VEC: Record<DirWord, Vec3> = {
  right: [1, 0, 0], left: [-1, 0, 0], up: [0, 1, 0], down: [0, -1, 0], out: [0, 0, 1], in: [0, 0, -1],
};

export const DIR_LABEL: Record<DirWord, string> = {
  right: 'to the right (+x)', left: 'to the left (−x)', up: 'up the page (+y)', down: 'down the page (−y)', out: 'out of the page (⊙)', in: 'into the page (⊗)',
};

export function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

export function vecToDir(v: Vec3): DirWord | null {
  const eps = 1e-9;
  const nz = v.map((x) => Math.abs(x) > eps);
  if (nz.filter(Boolean).length !== 1) return null;
  if (nz[0]) return v[0] > 0 ? 'right' : 'left';
  if (nz[1]) return v[1] > 0 ? 'up' : 'down';
  return v[2] > 0 ? 'out' : 'in';
}

/** Parse a phrase such as "into the page", "to the left", "north", "upwards". */
export function parseDirWord(phrase: string): DirWord | null {
  const p = phrase.toLowerCase();
  if (/into (the )?(page|paper|screen)|⊗/.test(p)) return 'in';
  if (/out of (the )?(page|paper|screen)|⊙/.test(p)) return 'out';
  if (/\b(right|east|eastward|eastwards|\+x)\b/.test(p)) return 'right';
  if (/\b(left|west|westward|westwards|−x|-x)\b/.test(p)) return 'left';
  if (/\b(up|upward|upwards|north|northward|northwards|top of the page)\b/.test(p)) return 'up';
  if (/\b(down|downward|downwards|south|southward|southwards|bottom of the page)\b/.test(p)) return 'down';
  return null;
}

export interface DirectionResult {
  ok: boolean;
  direction?: DirWord;
  label?: string;
  steps: string[];
  warning?: string;
}

/** F = q v × B. sign = +1 for positive charges, −1 for negative. */
export function magneticForceOnCharge(v: DirWord, B: DirWord, sign: 1 | -1): DirectionResult {
  const f = cross(DIR_VEC[v], DIR_VEC[B]);
  const steps = [
    `Velocity: ${DIR_LABEL[v]}. Field: ${DIR_LABEL[B]}.`,
    'Right-hand palm rule (positive charge): fingers along B, thumb along v, palm pushes in the direction of F (equivalently F = qv × B).',
  ];
  const d0 = vecToDir(f);
  if (!d0) return { ok: false, steps: [...steps, 'v is parallel (or antiparallel) to B, so the magnetic force is ZERO.'], warning: 'No force: v ∥ B.' };
  const d = sign > 0 ? d0 : vecToDir(f.map((x) => -x) as Vec3)!;
  steps.push(`For a positive charge the force would be ${DIR_LABEL[d0]}.`);
  if (sign < 0) steps.push(`The charge is NEGATIVE, so the force is reversed: ${DIR_LABEL[d]}.`);
  steps.push('The force is perpendicular to the velocity, so the particle moves in a circular arc (speed unchanged).');
  return { ok: true, direction: d, label: DIR_LABEL[d], steps };
}

/** F = I l × B (conventional current). */
export function motorForce(I: DirWord, B: DirWord): DirectionResult {
  const f = cross(DIR_VEC[I], DIR_VEC[B]);
  const steps = [
    `Conventional current: ${DIR_LABEL[I]}. Field: ${DIR_LABEL[B]}.`,
    'Right-hand palm rule: fingers along B, thumb along conventional current I, palm gives F (F = Il × B).',
  ];
  const d = vecToDir(f);
  if (!d) return { ok: false, steps: [...steps, 'The wire is parallel to B: no force.'], warning: 'No force: current ∥ B.' };
  steps.push(`Force on the conductor: ${DIR_LABEL[d]}.`);
  return { ok: true, direction: d, label: DIR_LABEL[d], steps };
}

/** F = qE. */
export function electricForce(E: DirWord, sign: 1 | -1): DirectionResult {
  const d = sign > 0 ? E : vecToDir(DIR_VEC[E].map((x) => -x) as Vec3)!;
  return {
    ok: true, direction: d, label: DIR_LABEL[d],
    steps: [
      `Electric field: ${DIR_LABEL[E]} (from + plate to − plate).`,
      sign > 0 ? 'Positive charge: force ALONG the field.' : 'Negative charge (e.g. electron): force OPPOSITE to the field.',
      `Force: ${DIR_LABEL[d]}.`,
    ],
  };
}

/** Lenz's law for a flat loop in the plane of the page. */
export function lenz(fieldDir: 'in' | 'out', change: 'increasing' | 'decreasing'): DirectionResult {
  const opposeDir: 'in' | 'out' = change === 'increasing' ? (fieldDir === 'in' ? 'out' : 'in') : fieldDir;
  // Right-hand grip: anticlockwise current (viewed from the front) gives field OUT of the page.
  const sense = opposeDir === 'out' ? 'anticlockwise' : 'clockwise';
  return {
    ok: true,
    label: `${sense} (as viewed from the front of the page)`,
    steps: [
      `The flux through the loop is ${DIR_LABEL[fieldDir]} and ${change}.`,
      `Lenz's law: the induced current sets up a magnetic field that OPPOSES the change in flux, so the induced field inside the loop is ${DIR_LABEL[opposeDir]}.`,
      `Right-hand grip rule: to produce a field ${opposeDir === 'out' ? 'out of' : 'into'} the page inside the loop, the current must flow ${sense}.`,
    ],
  };
}

export function wiresForce(sameDirection: boolean): DirectionResult {
  return {
    ok: true,
    label: sameDirection ? 'attractive (wires pulled together)' : 'repulsive (wires pushed apart)',
    steps: [
      'Each wire sits in the magnetic field of the other (right-hand grip rule), and experiences a motor-effect force (right-hand palm rule).',
      sameDirection ? 'Currents in the SAME direction ⇒ the forces are ATTRACTIVE.' : 'Currents in OPPOSITE directions ⇒ the forces are REPULSIVE.',
      'By Newton’s third law the forces on the two wires are equal in magnitude and opposite in direction.',
    ],
  };
}
