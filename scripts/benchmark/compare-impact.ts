import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { thermalHorizonRadius } from '../../src/physics/casualties.js';
import { IMPACT_BLAST_COUPLING, IMPACT_LUMINOUS_EFFICIENCY } from '../../src/physics/constants.js';
import { impactFireballRadius } from '../../src/physics/effects/blastWave.js';
import { ejectaBlanketOuterEdge } from '../../src/physics/effects/ejecta.js';
import { peakOverpressure } from '../../src/physics/events/explosion/overpressure.js';
import { thirdDegreeBurnRadius } from '../../src/physics/events/explosion/thermal.js';
import { distanceForOverpressure } from '../../src/physics/events/impact/damageRings.js';
import { wunnemannFarField } from '../../src/physics/events/tsunami/wunnemann.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps, Pa } from '../../src/physics/units.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printedResolution, printStats, summarise, type Pair } from './stats.js';

/**
 * Track IMP of the benchmark protocol: the impact pipeline against the
 * Earth Impact Effects Program, on every case of benchmark/matrices/impact.json
 * that scripts/benchmark/eiep_bench.py read.
 *
 *   pnpm exec tsx scripts/benchmark/compare-impact.ts <eiep.jsonl> [<pairs.json>]
 *
 * Nimbus runs with the program's target densities (Collins et al. 2005:
 * sedimentary 2 500, crystalline 2 750 kg/m³; a water target over
 * crystalline rock, at sea).
 *
 * Where the program draws a ring at a threshold Nimbus does not draw, the
 * Nimbus model is evaluated at the program's threshold, the way Nimbus
 * builds its own rings:
 *
 * - air blast: the larger of the ground-coupled shock (Kinney & Graham on
 *   half the energy that reaches the ground) and the entry shock (half the
 *   energy left in the air, its reach lifted by the burst-altitude factor),
 *   as `simulate.ts` combines them;
 * - thermal: the program's clothing-ignition fluence, 1 MJ/m² times the
 *   impact energy in megatons to the 1/6 (Collins et al. 2005, Table 3,
 *   read back from the program's own radii), through Nimbus's burn-radius
 *   inversion with the impact luminous efficiency.
 *
 * The program's /map page lists the air-blast radii of an airburst as 20,
 * 5 and 1 kPa, smallest first, as its impact.js labels them. For an impact
 * that reaches the ground it lists four radii, and the same labels read
 * them one threshold off: their third and fourth radii fall at the scaled
 * distances of the airburst's 20 and 5 kPa radii (to within the rounding
 * of the printed energy). They are compared as 20 and 5 kPa; the reading
 * by the labels is kept as a sensitivity row, `airblastRadiusGroundAsLabelled`.
 * A radius the program replaces with a smaller one past a quarter of the
 * Earth's circumference is recorded as the program's cap and left out.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface ImpactCase {
  id: string;
  source: 'preset' | 'grid' | 'lhs';
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  target: 'sedimentary' | 'crystalline' | 'water';
  waterDepthM?: number;
}

interface EiepLine {
  id: string;
  distanceKm: number;
  error: string | null;
  energyJ?: number | null;
  breakupAltitudeM?: number | null;
  burstAltitudeM?: number | null;
  impactVelocityKmS?: number | null;
  impactEnergyJ?: number | null;
  airburstEnergyJ?: number | null;
  transientDiameterM?: number | null;
  finalDiameterM?: number | null;
  finalDepthM?: number | null;
  overpressurePa?: [number, number] | null;
  fireballRadiiM?: number[] | null;
  ejectaRadiiM?: [number, number][] | null;
  airblastRadiiM?: number[] | null;
  tsunamiRadiiM?: [number, number][] | null;
  waterCraterDiameterM?: number | null;
}

const TARGET_DENSITY = { sedimentary: 2_500, crystalline: 2_750, water: 2_750 } as const;
const JOULES_PER_MEGATON = 4.184e15;
const CLOTHING_IGNITION_1MT = 1e6;

/** The radii of a list that should shrink as the threshold rises, with the program's cap removed. */
function uncapped(radii: readonly number[]): (number | 'cap')[] {
  // radii[i] belongs to a threshold that rises with i.
  return radii.map((r, i) => (radii.slice(i + 1).some((next) => r > 0 && next > r) ? 'cap' : r));
}

export function comparePairs(eiepPath: string): Pair[] {
  const cases = new Map(
    (
      JSON.parse(
        readFileSync(join(ROOT, 'benchmark', 'matrices', 'impact.json'), 'utf8')
      ) as ImpactCase[]
    ).map((c) => [c.id, c])
  );
  const lines = readFileSync(eiepPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => JSON.parse(l) as EiepLine);
  const pairs: Pair[] = [];
  const seenCase = new Set<string>();
  const failedCase = new Set<string>();
  for (const line of lines) {
    const c = cases.get(line.id);
    if (c === undefined) continue;
    const r = simulateImpact({
      impactorDiameter: m(c.diameterM),
      impactVelocity: mps(c.velocityKmS * 1_000),
      impactorDensity: kgPerM3(c.densityKgM3),
      targetDensity: kgPerM3(TARGET_DENSITY[c.target]),
      impactAngle: degreesToRadians(deg(c.angleDeg)),
      ...(c.target === 'water' ? { waterDepth: m(c.waterDepthM ?? 0) } : {}),
    });
    const ke = r.impactor.kineticEnergy as number;
    const base = {
      track: 'IMP',
      caseId: c.id,
      source: c.source === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('impact', ke),
    };
    const push = (
      quantity: string,
      cls: Pair['cls'],
      detail: string,
      nimbus: number | null,
      reference: number | null | undefined,
      extra: Partial<Pair> = {}
    ): void => {
      pairs.push({
        ...base,
        quantity,
        cls,
        detail,
        nimbus,
        reference: reference ?? null,
        ...extra,
      });
    };
    if (line.error !== null) {
      if (!failedCase.has(c.id)) {
        failedCase.add(c.id);
        push('referenceAnswered', 'A', line.error, 0, 1, { categorical: true });
      }
      continue;
    }

    const gf = Math.max(r.entry.energyFractionToGround, 0);
    const groundEnergy = ke * gf;
    const atmosphericEnergy = r.entry.atmosphericYieldMegatons * JOULES_PER_MEGATON;
    const lift = r.entry.airburstAmplificationFactor;
    const nimbusAirburst = r.entry.regime === 'COMPLETE_AIRBURST';
    const eiepAirburst = line.burstAltitudeM !== null && line.burstAltitudeM !== undefined;
    const water = c.target === 'water';
    const surfaceBlast = groundEnergy * IMPACT_BLAST_COUPLING;
    const entryBlast = atmosphericEnergy * IMPACT_BLAST_COUPLING;
    const nimbusOverpressure = (distance: number): number =>
      Math.max(
        surfaceBlast > 0
          ? peakOverpressure({ distance: m(distance), yieldEnergy: J(surfaceBlast) })
          : 0,
        entryBlast > 0
          ? peakOverpressure({
              distance: m(distance / lift),
              yieldEnergy: J(entryBlast),
            })
          : 0
      );
    const inverted = (energy: number, pressure: number): number => {
      if (energy <= 0) return 0;
      try {
        return distanceForOverpressure(J(energy), Pa(pressure));
      } catch {
        return 0;
      }
    };
    const nimbusBlastRadius = (pressure: number): number =>
      Math.max(inverted(surfaceBlast, pressure), lift * inverted(entryBlast, pressure));

    if (line.overpressurePa !== null && line.overpressurePa !== undefined) {
      push(
        eiepAirburst ? 'overpressureAtDistanceAirburst' : 'overpressureAtDistanceGround',
        'B',
        `${line.distanceKm.toString()} km`,
        nimbusOverpressure(line.distanceKm * 1_000),
        line.overpressurePa[0],
        { bin: `${line.distanceKm.toString()} km` }
      );
    }

    if (seenCase.has(c.id)) continue;
    seenCase.add(c.id);
    push('referenceAnswered', 'A', '', 1, 1, { categorical: true });
    const printed = (
      quantity: string,
      nimbus: number | null,
      reference: number | null | undefined,
      cls: Pair['cls'] = 'A'
    ): void => {
      push(quantity, cls, '', nimbus, reference, { resolution: printedResolution(reference) });
    };
    printed('energy', ke, line.energyJ);
    printed('breakupAltitude', r.entry.breakupAltitude, line.breakupAltitudeM ?? 0);
    push(
      'airburstOutcome',
      'A',
      eiepAirburst ? 'reference: airburst' : 'reference: reaches the ground',
      nimbusAirburst ? 1 : 0,
      eiepAirburst ? 1 : 0,
      { categorical: true }
    );
    if (eiepAirburst && nimbusAirburst) {
      printed('burstAltitude', r.entry.burstAltitude, line.burstAltitudeM);
    }
    if (!eiepAirburst && !nimbusAirburst) {
      printed('groundVelocity', (r.entry.endVelocity as number) / 1_000, line.impactVelocityKmS);
      printed('groundEnergy', groundEnergy, line.impactEnergyJ);
      const crater = water ? 'Seafloor' : '';
      const craterClass = water ? 'C' : 'A';
      printed(
        `transientDiameter${crater}`,
        r.crater.transientDiameter,
        line.transientDiameterM,
        craterClass
      );
      printed(`finalDiameter${crater}`, r.crater.finalDiameter, line.finalDiameterM, craterClass);
      printed(`finalDepth${crater}`, r.crater.depth, line.finalDepthM, craterClass);
    }

    // Fireball and thermal exposure, for an impact the program sees reach the ground.
    const fireballs = line.fireballRadiiM ?? [];
    if (!eiepAirburst && fireballs.length === 3) {
      const fireball = impactFireballRadius(J(groundEnergy)) as number;
      push('fireballRadius', 'A', '', fireball, fireballs[0]);
      push('fireballVisibleRadius', 'A', '', thermalHorizonRadius(m(fireball)), fireballs[2]);
      const threshold =
        CLOTHING_IGNITION_1MT *
        ((line.impactEnergyJ ?? groundEnergy) / JOULES_PER_MEGATON) ** (1 / 6);
      const burn = (energy: number): number =>
        energy > 0
          ? thirdDegreeBurnRadius({
              yieldEnergy: J(energy),
              thermalPartition: IMPACT_LUMINOUS_EFFICIENCY,
              fluenceThreshold: threshold,
            })
          : 0;
      push(
        'clothingIgnitionRadius',
        'B',
        '',
        Math.max(burn(groundEnergy), burn(atmosphericEnergy)),
        fireballs[1]
      );
    }

    // Air-blast rings.
    const blast = line.airblastRadiiM ?? [];
    const ringPairs = (
      quantity: string,
      kPa: readonly number[],
      radii: readonly number[],
      detail: string
    ): void => {
      // Thresholds rise with the index of `kPa`.
      const clean = uncapped(radii);
      kPa.forEach((p, i) => {
        const radius = clean[i];
        if (radius === undefined) return;
        push(
          quantity,
          'B',
          `${p.toString()} kPa ${detail}`,
          nimbusBlastRadius(p * 1_000),
          radius === 'cap' ? null : radius,
          radius === 'cap'
            ? {
                note: "the reference's cap past a quarter of the Earth",
                bin: `${p.toString()} kPa`,
              }
            : { bin: `${p.toString()} kPa` }
        );
      });
    };
    if (blast.length === 3) {
      // Airburst: 20, 5, 1 kPa, smallest radius first → thresholds rising: 1, 5, 20.
      ringPairs(
        'airblastRadiusAirburst',
        [1, 5, 20],
        [blast[2] ?? 0, blast[1] ?? 0, blast[0] ?? 0],
        '(airburst)'
      );
    } else if (blast.length === 4) {
      ringPairs('airblastRadiusGround', [5, 20], [blast[3] ?? 0, blast[2] ?? 0], '(ground)');
      ringPairs(
        'airblastRadiusGroundAsLabelled',
        [1, 5, 20],
        [blast[3] ?? 0, blast[2] ?? 0, blast[1] ?? 0],
        '(ground, as labelled)'
      );
    }

    // Ejecta: thickness rising with the index.
    if (!eiepAirburst && !nimbusAirburst && !water) {
      const ejecta = line.ejectaRadiiM ?? [];
      const clean = uncapped(ejecta.map(([, radius]) => radius));
      ejecta.forEach(([thickness], i) => {
        const radius = clean[i];
        push(
          'ejectaEdge',
          'A',
          `${thickness.toString()} m`,
          ejectaBlanketOuterEdge(
            r.crater.transientDiameter,
            m((r.crater.finalDiameter as number) / 2),
            m(thickness)
          ),
          radius === 'cap' ? null : radius,
          radius === 'cap' ? { note: "the reference's cap past a quarter of the Earth" } : {}
        );
      });
    }

    // Impact tsunami: amplitude rising with the index.
    if (water) {
      const t = r.tsunami;
      const waves = line.tsunamiRadiiM ?? [];
      const clean = uncapped(waves.map(([, radius]) => radius));
      if (line.waterCraterDiameterM !== null && line.waterCraterDiameterM !== undefined) {
        push(
          'waterCavityDiameter',
          'C',
          '',
          t === undefined ? null : 2 * (t.cavityRadius as number),
          line.waterCraterDiameterM,
          t === undefined ? { note: 'Nimbus: no tsunami source' } : {}
        );
      }
      waves.forEach(([amplitude], i) => {
        const radius = clean[i];
        if (radius === 0) return;
        const nimbus =
          t === undefined || radius === 'cap' || radius === undefined
            ? null
            : (wunnemannFarField({
                cavityRadius: t.cavityRadius,
                waterDepth: m(c.waterDepthM ?? 0),
                impactorDiameter: m(c.diameterM),
                distance: m(radius),
              }).rimWave as number);
        push(
          'tsunamiAmplitudeAtRadius',
          'C',
          `${amplitude.toString()} m`,
          nimbus,
          radius === 'cap' ? null : amplitude,
          radius === 'cap'
            ? { note: "the reference's cap past a quarter of the Earth" }
            : t === undefined
              ? { note: 'Nimbus: no tsunami source' }
              : {}
        );
      });
    }
  }
  return pairs;
}

const eiepPath = process.argv[2];
if (eiepPath !== undefined) {
  const pairs = comparePairs(eiepPath);
  const stats = summarise(pairs);
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'impact.json'),
    `${JSON.stringify({ track: 'IMP', reference: 'Earth Impact Effects Program, impact.ese.ic.ac.uk/map', stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
