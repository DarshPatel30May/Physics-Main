import type { Scenario, ResolvedScenario } from '../../engine/scenario';
import { resolveScenario } from '../../engine/scenario';
import { M5_SCENARIOS } from './m5';
import { M6_SCENARIOS } from './m6';
import { M7_SCENARIOS } from './m7';
import { M8_SCENARIOS } from './m8';

export const SCENARIOS: Scenario[] = [...M5_SCENARIOS, ...M6_SCENARIOS, ...M7_SCENARIOS, ...M8_SCENARIOS];

export const SCENARIO_BY_ID: Record<string, Scenario> = {};
for (const s of SCENARIOS) {
  if (SCENARIO_BY_ID[s.id]) throw new Error(`Duplicate scenario id ${s.id}`);
  SCENARIO_BY_ID[s.id] = s;
}

export function getScenario(id: string): ResolvedScenario {
  const s = SCENARIO_BY_ID[id];
  if (!s) throw new Error(`Unknown scenario ${id}`);
  return resolveScenario(s);
}

export const RESOLVED: ResolvedScenario[] = SCENARIOS.map(resolveScenario);
