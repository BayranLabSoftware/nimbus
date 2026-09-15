import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STANDARD_GRAVITY } from '../../src/physics/constants.js';
import { peakGroundAccelerationNGAWest2 } from '../../src/physics/events/earthquake/attenuation.js';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import type { FaultType } from '../../src/physics/events/earthquake/ruptureLength.js';
import { m } from '../../src/physics/units.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track EQ-GM of the benchmark protocol: the earthquake rings and the
 * acceleration with distance against the OpenQuake Engine's ground-motion
 * library (hazardlib 3.26.2), on every case of benchmark/matrices/earthquake.json.
 *
 *   pnpm exec tsx scripts/benchmark/compare-earthquake.ts <openquake reference.json> [<pairs.json>]
 *
 * - Class A, code verification: Nimbus's Boore et al. (2014) median PGA at
 *   each Joyner–Boore distance, and its MMI VII, VIII and IX rings, against
 *   OpenQuake's BooreEtAl2014 and the ranges where its median falls below
 *   the same Worden et al. (2012) accelerations. OpenQuake's crossings are
 *   read on a 0.5 km grid; that step is the tolerance's resolution.
 * - Class C, validation against other models: the same rings against
 *   Abrahamson et al. 2014, Campbell & Bozorgnia 2014, Chiou & Youngs 2014,
 *   their ensemble and Allen et al. 2012 for crustal events, and against
 *   Abrahamson et al. 2016 (AbrahamsonEtAl2015SInter) and Parker et al.
 *   2020 for the subduction-interface presets; and the acceleration
 *   Nimbus reports at 20 and 100 km (Joyner & Boore 1981) against the
 *   NGA-West2 ensemble.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface GsimRow {
  pgaG?: number[];
  mmi?: number[];
  crossingKm: Record<string, number | string>;
}

interface OqCase {
  id: string;
  inputs: {
    source: string;
    magnitude: number;
    faultType: FaultType;
    depthKm: number;
    vs30: number;
    subductionInterface: boolean;
  };
  distancesKm: number[];
  gsims: Record<string, GsimRow>;
}

const CRUSTAL_MODELS: readonly [string, string][] = [
  ['AbrahamsonEtAl2014', 'ringVsAbrahamson2014'],
  ['CampbellBozorgnia2014', 'ringVsCampbellBozorgnia2014'],
  ['ChiouYoungs2014', 'ringVsChiouYoungs2014'],
  ['NGAW2_ensemble', 'ringVsNgaWest2Ensemble'],
  ['AllenEtAl2012_finite', 'ringVsAllen2012Finite'],
  ['AllenEtAl2012Rhypo_point', 'ringVsAllen2012Point'],
];
const INTERFACE_MODELS: readonly [string, string][] = [
  ['AbrahamsonEtAl2015SInter', 'ringVsAbrahamson2016Interface'],
  ['ParkerEtAl2020SInter', 'ringVsParker2020Interface'],
];

export function comparePairs(referencePath: string): Pair[] {
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as { cases: OqCase[] };
  const pairs: Pair[] = [];
  for (const c of reference.cases) {
    const i = c.inputs;
    const r = simulateEarthquake({
      magnitude: i.magnitude,
      depth: m(i.depthKm * 1_000),
      faultType: i.faultType,
      vs30: i.vs30,
      subductionInterface: i.subductionInterface,
    });
    const base = {
      track: 'EQ-GM',
      caseId: c.id,
      source: i.source === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('earthquake', i.magnitude),
    };
    const rings: Record<string, number> = {
      '7': (r.shaking.mmi7Radius as number) / 1_000,
      '8': (r.shaking.mmi8Radius as number) / 1_000,
      '9': (r.shaking.mmi9Radius as number) / 1_000,
    };
    const ringPairs = (model: GsimRow | undefined, quantity: string, cls: 'A' | 'C'): void => {
      if (model === undefined) return;
      for (const mmi of ['7', '8', '9']) {
        const crossing = model.crossingKm[mmi];
        const beyond = typeof crossing === 'string';
        const ref = typeof crossing === 'number' ? crossing : null;
        pairs.push({
          ...base,
          quantity,
          cls,
          detail: `MMI ${mmi}`,
          bin: `MMI ${mmi}`,
          nimbus: rings[mmi] ?? null,
          reference: ref,
          ...(cls === 'A' && ref !== null && ref > 0 ? { resolution: 0.5 / ref } : {}),
          ...(beyond ? { note: 'the reference crosses beyond 500 km' } : {}),
        });
      }
    };

    // Class A: the same equations.
    const bssa = c.gsims.BooreEtAl2014;
    c.distancesKm.forEach((d, k) => {
      const ref = bssa?.pgaG?.[k];
      pairs.push({
        ...base,
        quantity: 'pgaBoore2014',
        cls: 'A',
        detail: `${d.toString()} km`,
        bin: `${d.toString()} km`,
        nimbus:
          (peakGroundAccelerationNGAWest2({
            magnitude: i.magnitude,
            distance: m(d * 1_000),
            faultType:
              i.faultType === 'strike-slip' || i.faultType === 'normal' || i.faultType === 'reverse'
                ? i.faultType
                : 'unspecified',
            vs30: i.vs30,
          }) as number) / STANDARD_GRAVITY,
        reference: ref ?? null,
        resolution: 5e-7,
      });
    });
    ringPairs(bssa, 'ringBoore2014', 'A');

    // Class C: other models.
    for (const [key, quantity] of i.subductionInterface ? INTERFACE_MODELS : CRUSTAL_MODELS) {
      ringPairs(c.gsims[key], quantity, 'C');
    }
    if (!i.subductionInterface) {
      const ensemble = c.gsims.NGAW2_ensemble;
      for (const [d, value] of [
        [20, r.shaking.pgaAt20km],
        [100, r.shaking.pgaAt100km],
      ] as const) {
        const k = c.distancesKm.indexOf(d);
        pairs.push({
          ...base,
          quantity: 'pgaReportedVsNgaWest2Ensemble',
          cls: 'C',
          detail: `${d.toString()} km`,
          bin: `${d.toString()} km`,
          nimbus: (value as number) / STANDARD_GRAVITY,
          reference: k >= 0 ? (ensemble?.pgaG?.[k] ?? null) : null,
        });
      }
    }
  }
  return pairs;
}

const referencePath = process.argv[2];
if (referencePath !== undefined) {
  const pairs = comparePairs(referencePath);
  const stats = summarise(pairs);
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'earthquake.json'),
    `${JSON.stringify({ track: 'EQ-GM', reference: 'OpenQuake Engine 3.26.2 hazardlib', stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
