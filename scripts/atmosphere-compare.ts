/**
 * Rule 914 of src/physics/validation/entryAtmosphereRules.ts, run once: the
 * three metrics on I2's fireballs for the legacy branch, the integrated
 * exponential and the integrated U.S. Standard Atmosphere, the comparative
 * criterion between the first and the last, and what rule 915 reports beside
 * them. Writes benchmark/results/atmosphere-compare-2026-09-23.json.
 *
 *   pnpm tsx scripts/atmosphere-compare.ts
 */
import { writeFileSync } from 'node:fs';
import { DEFAULT_STRENGTH_LAW } from '../src/physics/effects/atmosphericEntry.js';
import {
  compareAtmospheres,
  readAtmosphere,
} from '../src/physics/validation/entryAtmosphereCompare.js';
import type { EntryAtmosphere } from '../src/physics/validation/entryAtmosphereRules.js';
import { FIREBALL_BODIES } from '../src/physics/validation/fireballRules.js';
import { fireballRow } from '../src/physics/validation/fireballRun.js';
import { FIREBALL_EVENTS } from '../src/physics/validation/fireballSetData.js';

const branches: EntryAtmosphere[] = ['closed', 'integratedExponential', 'integratedUssa'];
const readings = Object.fromEntries(branches.map((b) => [b, readAtmosphere(b)]));
const legacy = readings.closed;
const candidate = readings.integratedUssa;
if (legacy === undefined || candidate === undefined) throw new Error('no reading');
const verdict = compareAtmospheres(legacy, candidate);

// Rule 915: (i) and (ii) on the fireballs that burst under every branch.
const body = FIREBALL_BODIES[0];
const rows = Object.fromEntries(
  branches.map((b) => [
    b,
    FIREBALL_EVENTS.map((e) => fireballRow(e, body, DEFAULT_STRENGTH_LAW, { atmosphere: b })),
  ])
);
const common = FIREBALL_EVENTS.map((_, i) => i).filter((i) =>
  branches.every((b) => rows[b]?.[i]?.burstKm !== null)
);
const median = (xs: number[]): number => {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 === 1 ? (s[m] ?? 0) : ((s[m - 1] ?? 0) + (s[m] ?? 0)) / 2;
};
const onCommon = Object.fromEntries(
  branches.map((b) => {
    const errors = common.map((i) => {
      const r = rows[b]?.[i];
      return (r?.burstKm ?? 0) - (r?.observedKm ?? 0);
    });
    return [
      b,
      {
        rows: errors.length,
        medianAbsoluteErrorKm: median(errors.map(Math.abs)),
        meanErrorKm: errors.reduce((a, x) => a + x, 0) / errors.length,
        withinFiveKm: errors.filter((e) => Math.abs(e) <= 5).length,
      },
    ];
  })
);

const out = {
  rules: '908 to 918',
  run: 'rule 914, once',
  readings,
  verdict,
  onCommonRows: onCommon,
};
writeFileSync(
  new URL('../benchmark/results/atmosphere-compare-2026-09-23.json', import.meta.url),
  `${JSON.stringify(out, null, 2)}\n`
);
console.log(JSON.stringify(out, null, 2));
