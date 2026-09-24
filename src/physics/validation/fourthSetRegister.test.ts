import { describe, expect, it } from 'vitest';
import { FOURTH_SET_CANDIDATES } from './fourthSetRegister.js';
import { DEV_CASES } from './fragmentationDevTable.js';
import { THIRD_SET_EVENTS } from './levelBThirdSetRules.js';
import { THIRD_SET_BODIES } from './thirdSetSources.js';
import {
  LEVEL_B_CRATER_EVENTS,
  LEVEL_B_ENTRY_EVENTS,
  LEVEL_B_SEEN_EVENTS,
} from './levelBSources.js';
import { LEVEL_B2_ENTRY_EVENTS, LEVEL_B2_ROWS } from './levelB2Sources.js';
import { FIREBALL_EVENTS } from './fireballSetData.js';
import { FCM_DEV_RUN } from './fcmRound1Rules.js';

describe('rule 1158: the fourth set’s register holds no event already read', () => {
  const read = new Set<string>([
    ...DEV_CASES.map((c) => c.case),
    ...Object.keys(THIRD_SET_EVENTS),
    ...THIRD_SET_BODIES.map((b) => b.event),
    ...[
      ...LEVEL_B_ENTRY_EVENTS,
      ...LEVEL_B_SEEN_EVENTS,
      ...LEVEL_B_CRATER_EVENTS,
      ...LEVEL_B2_ENTRY_EVENTS,
    ].map((e) => e.event),
    ...LEVEL_B2_ROWS.map((r) => r.event),
    ...Object.keys(FCM_DEV_RUN.w18Cases),
    // Borovička et al. 2020's falls, as rule 941 (d) names them.
    'Jesenice',
    'Renchen',
    'Hradec Králové',
    'Stubenberg',
    'Žďár nad Sázavou',
    'Maribo',
    'Križevci',
    'Morávka',
    'Ejby',
  ]);

  it('names no event any earlier set, round or case read', () => {
    for (const c of FOURTH_SET_CANDIDATES) expect(read.has(c.event)).toBe(false);
  });

  it('keeps any candidate whose date meets a CNEOS row already read «to check»', () => {
    const dates = new Set(FIREBALL_EVENTS.map((e) => e.date.slice(0, 10)));
    for (const c of FOURTH_SET_CANDIDATES) if (dates.has(c.date)) expect(c.status).toBe('to check');
  });

  it('never stores a value: exposures are kinds, not numbers', () => {
    for (const c of FOURTH_SET_CANDIDATES) {
      expect(new Set(c.exposed).size).toBe(c.exposed.length);
      expect(c.sources.length).toBeGreaterThan(0);
    }
  });
});
