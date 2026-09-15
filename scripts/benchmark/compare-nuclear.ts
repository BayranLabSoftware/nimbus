import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nuclearFireballRadius } from '../../src/physics/effects/blastWave.js';
import { peakOverpressure } from '../../src/physics/events/explosion/overpressure.js';
import { peakWindAtRange } from '../../src/physics/events/explosion/peakWind.js';
import { simulateExplosion } from '../../src/physics/events/explosion/simulate.js';
import {
  thermalPartitionForHeight,
  thirdDegreeBurnRadius,
} from '../../src/physics/events/explosion/thermal.js';
import { distanceForOverpressure } from '../../src/physics/events/impact/damageRings.js';
import { J, m, Pa } from '../../src/physics/units.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track NUC of the benchmark protocol: the nuclear effects against
 * NUKEMAP 2.76 (Wellerstein; the rings its page draws, casualty service
 * unused) and the Nuclear Bomb Effects Computer (Fourmilab's online
 * edition of the 1962 slide rule), on every case of
 * benchmark/matrices/nuclear.json.
 *
 *   pnpm exec tsx scripts/benchmark/compare-nuclear.ts <nuclear reference.json> [<pairs.json>]
 *
 * NUKEMAP. The rings Nimbus draws are compared with NUKEMAP's nearest
 * rings — 5 and 1 psi; third-, second- and first-degree burns (Nimbus 8, 5
 * and 2 cal/cm², NUKEMAP 100 % third-degree and 50 % second- and
 * first-degree at its own yield-dependent fluences); LD50 (≈ 4.5 Gy)
 * against 500 rem, LD100 (≈ 8 Gy) against 1 000 rem and the 1 Gy acute
 * threshold against 100 rem — and, where NUKEMAP draws a threshold Nimbus
 * does not, Nimbus's model is evaluated at NUKEMAP's: 20 psi through the
 * same inversion and height-of-burst factor as its rings, and each burn
 * ring at NUKEMAP's fluence through the same attenuated inversion.
 *
 * Fourmilab. The rule has no height of burst: its surface-burst scales
 * are compared with Nimbus's surface bursts, and its optimum-height scales
 * with Nimbus at the case's height, as a separate quantity. Its readings
 * carry ±3 % from reading the rule's image.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PSI = 6_894.757;
const CAL_CM2 = 41_840;
const MPH = 0.44704;

interface Ring {
  radiusM?: number;
  thresholdCalCm2?: number;
}

interface NuclearReference {
  id: string;
  yieldKt: number;
  heightOfBurstM: number;
  nukemap?: {
    fireballRadiusM: number | null;
    overpressureRadiiM: Record<string, number | null>;
    thermalRadiusM: number | null;
    thermalThresholdCalCm2: number | null;
    radiationRadiusM: number | null;
    otherRings: Record<string, Ring | undefined>;
  };
  fourmilab?: {
    ranges: {
      rangeKm: number;
      overpressureSurfaceBurstPsi: number | null;
      overpressureOptimumBurstHeightPsi: number | null;
      windSurfaceBurstMph: number | null;
      windOptimumBurstHeightMph: number | null;
    }[];
  };
}

interface NuclearCase {
  id: string;
  source: string;
}

export function comparePairs(referencePath: string): Pair[] {
  const sources = new Map(
    (
      JSON.parse(
        readFileSync(join(ROOT, 'benchmark', 'matrices', 'nuclear.json'), 'utf8')
      ) as NuclearCase[]
    ).map((c) => [c.id, c.source])
  );
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as {
    cases: NuclearReference[];
  };
  const pairs: Pair[] = [];
  for (const c of reference.cases) {
    const joules = c.yieldKt * 4.184e12;
    const hob = c.heightOfBurstM;
    const r = simulateExplosion({ yieldMegatons: c.yieldKt / 1_000, heightOfBurst: m(hob) });
    const base = {
      track: 'NUC',
      caseId: c.id,
      source: sources.get(c.id) === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('explosion', joules),
      cls: 'B' as const,
    };
    const push = (
      quantity: string,
      detail: string,
      nimbus: number | null,
      reference: number | null | undefined,
      extra: Partial<Pair> = {}
    ): void => {
      pairs.push({
        ...base,
        quantity,
        detail,
        bin: detail,
        nimbus,
        reference: reference ?? null,
        ...extra,
      });
    };
    const factor = r.blast.hobFactor;
    const blastRadiusAt = (psi: number): number => {
      try {
        return (distanceForOverpressure(J(joules), Pa(psi * PSI)) as number) * factor;
      } catch {
        return 0;
      }
    };
    const partition = thermalPartitionForHeight(hob, c.yieldKt);
    const burnAt = (calCm2: number): number =>
      thirdDegreeBurnRadius({
        yieldEnergy: J(joules),
        heightOfBurst: hob,
        thermalPartition: partition,
        fluenceThreshold: calCm2 * CAL_CM2,
      });

    const nk = c.nukemap;
    if (nk !== undefined) {
      const exo = r.blast.hobRegime === 'STRATOSPHERIC' || hob >= 30_000;
      push('fireballRadius', '', nuclearFireballRadius(c.yieldKt), nk.fireballRadiusM);
      push(
        'blastRingAsDrawn',
        '5 psi',
        r.blast.overpressure5psiRadiusHob,
        nk.overpressureRadiiM['5']
      );
      push(
        'blastRingAsDrawn',
        '1 psi',
        r.blast.overpressure1psiRadiusHob,
        nk.overpressureRadiiM['1']
      );
      push(
        'blastRadiusAtNukemapThreshold',
        '20 psi',
        exo ? 0 : blastRadiusAt(20),
        nk.overpressureRadiiM['20']
      );
      push('burnRingAsDrawn', '3rd degree', r.thermal.thirdDegreeBurnRadius, nk.thermalRadiusM);
      const second = nk.otherRings.thermal_2nd_degree_50pct;
      const first = nk.otherRings.thermal_1st_degree_50pct;
      push('burnRingAsDrawn', '2nd degree', r.thermal.secondDegreeBurnRadius, second?.radiusM);
      push('burnRingAsDrawn', '1st degree', r.thermal.firstDegreeBurnRadius, first?.radiusM);
      const atThreshold = (
        label: string,
        threshold: number | null | undefined,
        radius: number | null | undefined
      ): void => {
        if (threshold === null || threshold === undefined) {
          push('burnRadiusAtNukemapFluence', label, null, radius, {
            note: 'NUKEMAP gives no fluence',
          });
        } else if (threshold <= 0) {
          push('burnRadiusAtNukemapFluence', label, null, radius, {
            note: 'NUKEMAP fluence not positive',
          });
        } else {
          push('burnRadiusAtNukemapFluence', label, exo ? 0 : burnAt(threshold), radius);
        }
      };
      atThreshold('3rd degree', nk.thermalThresholdCalCm2, nk.thermalRadiusM);
      atThreshold('2nd degree', second?.thresholdCalCm2, second?.radiusM);
      atThreshold('1st degree', first?.thresholdCalCm2, first?.radiusM);
      push(
        'radiationRingNearestDose',
        'LD50 vs 500 rem',
        r.radiation.ld50Radius,
        nk.radiationRadiusM
      );
      push(
        'radiationRingNearestDose',
        'LD100 vs 1000 rem',
        r.radiation.ld100Radius,
        nk.otherRings.radiation_1000rem?.radiusM
      );
      push(
        'radiationRingNearestDose',
        '1 Gy vs 100 rem',
        r.radiation.arsThresholdRadius,
        nk.otherRings.radiation_100rem?.radiusM
      );
      if (hob === 0) {
        // Nimbus's apparent crater is measured at the original ground,
        // which lies between NUKEMAP's inside and lip radii: both are kept.
        const apparent = (r.crater.apparentDiameter as number) / 2;
        push(
          'craterRadiusVsInside',
          'surface burst',
          apparent,
          nk.otherRings.crater_inside_radius?.radiusM
        );
        push(
          'craterRadiusVsLip',
          'surface burst',
          apparent,
          nk.otherRings.crater_lip_radius?.radiusM
        );
      }
    }

    for (const p of c.fourmilab?.ranges ?? []) {
      const d = p.rangeKm * 1_000;
      const detail = `${p.rangeKm.toString()} km`;
      const fourmilab = { resolution: 0.03 };
      if (hob === 0) {
        if (p.overpressureSurfaceBurstPsi !== null)
          push(
            'fourmilabOverpressureSurface',
            detail,
            (peakOverpressure({ distance: m(d), yieldEnergy: J(joules) }) as number) / PSI,
            p.overpressureSurfaceBurstPsi,
            fourmilab
          );
        if (p.windSurfaceBurstMph !== null)
          push(
            'fourmilabWindSurface',
            detail,
            (peakWindAtRange({ distance: m(d), yieldEnergy: J(joules) }) as number) / MPH,
            p.windSurfaceBurstMph,
            fourmilab
          );
      } else {
        if (p.overpressureOptimumBurstHeightPsi !== null)
          push(
            'fourmilabOverpressureOptimumHeight',
            detail,
            (peakOverpressure({ distance: m(d / factor), yieldEnergy: J(joules) }) as number) / PSI,
            p.overpressureOptimumBurstHeightPsi,
            fourmilab
          );
        if (p.windOptimumBurstHeightMph !== null)
          push(
            'fourmilabWindOptimumHeight',
            detail,
            (peakWindAtRange({ distance: m(d / factor), yieldEnergy: J(joules) }) as number) / MPH,
            p.windOptimumBurstHeightMph,
            fourmilab
          );
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
    join(ROOT, 'benchmark', 'results', 'nuclear.json'),
    `${JSON.stringify({ track: 'NUC', reference: 'NUKEMAP 2.76 (rings drawn by the page) and the Fourmilab Nuclear Bomb Effects Computer (1962 slide rule, partial read)', stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
