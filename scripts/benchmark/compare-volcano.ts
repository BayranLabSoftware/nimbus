import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ashfallMassLoading } from '../../src/physics/events/volcano/ashfall.js';
import { plumeHeight } from '../../src/physics/events/volcano/plumeHeight.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track VOL of the benchmark protocol: Nimbus's tephra loading against
 * Tephra2 (Bonadonna et al. 2005; Connor & Connor 2006), run locally on
 * the plume height, erupted mass and wind Nimbus uses for each eruption
 * of benchmark/matrices/volcano.json (benchmark/nimbus/agent-inputs.json).
 *
 *   pnpm exec tsx scripts/benchmark/compare-volcano.ts <tephra2 reference.json> [<pairs.json>]
 *
 * The 1 mm isopach's downwind reach is read on the seven downwind points
 * of both sides alike, log-linearly between the points that bracket
 * 1 kg/m² (1 mm at Nimbus's deposit density of 1 000 kg/m³).
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface VolcanoCase {
  id: string;
  source: string;
  volumeEruptionRate: number;
  totalEjectaVolume: number;
  windSpeed: number;
}

interface TephraCase {
  id: string;
  points: { xKm: number; yKm: number; massLoadingKgM2: number }[];
  notes?: string;
}

const ONE_MM_KG_M2 = 1;

/** Downwind reach of a loading threshold on sampled points, log-linear between brackets. */
export function reachOf(
  points: readonly { x: number; load: number }[],
  threshold: number
): number | 'beyond' | 'short' {
  const sorted = [...points].sort((a, b) => a.x - b.x);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (first === undefined || last === undefined) return 'short';
  if (first.load < threshold) return 'short';
  if (last.load >= threshold) return 'beyond';
  for (let i = 0; i + 1 < sorted.length; i++) {
    const a = sorted[i] as { x: number; load: number };
    const b = sorted[i + 1] as { x: number; load: number };
    if (a.load >= threshold && b.load < threshold) {
      if (b.load <= 0) return a.x;
      const t = Math.log(a.load / threshold) / Math.log(a.load / b.load);
      return Math.exp(Math.log(a.x) + t * Math.log(b.x / a.x));
    }
  }
  return 'short';
}

export function comparePairs(referencePath: string): Pair[] {
  const cases = new Map(
    (
      JSON.parse(
        readFileSync(join(ROOT, 'benchmark', 'matrices', 'volcano.json'), 'utf8')
      ) as VolcanoCase[]
    ).map((c) => [c.id, c])
  );
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as { cases: TephraCase[] };
  const pairs: Pair[] = [];
  for (const t of reference.cases) {
    const c = cases.get(t.id);
    if (c === undefined) continue;
    const H = plumeHeight({ volumeEruptionRate: c.volumeEruptionRate });
    const base = {
      track: 'VOL',
      caseId: c.id,
      source: c.source === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('volcano', c.totalEjectaVolume),
      cls: 'C' as const,
    };
    const nimbusAt = (xKm: number, yKm: number): number =>
      ashfallMassLoading({
        plumeHeight: H,
        totalEjectaVolume: c.totalEjectaVolume,
        downwindDistance: xKm * 1_000,
        crosswindDistance: yKm * 1_000,
        windSpeed: c.windSpeed,
      });
    const downwind: { x: number; nimbus: number; ref: number }[] = [];
    for (const p of t.points) {
      const nimbus = nimbusAt(p.xKm, p.yKm);
      const axis = p.yKm === 0;
      if (axis) downwind.push({ x: p.xKm, nimbus, ref: p.massLoadingKgM2 });
      pairs.push({
        ...base,
        quantity: axis ? 'massLoadingDownwind' : 'massLoadingCrosswind',
        detail: `${p.xKm.toString()} km downwind, ${p.yKm.toString()} km across`,
        bin: axis ? `${p.xKm.toString()} km` : `${Math.abs(p.yKm).toString()} km across`,
        nimbus,
        reference: p.massLoadingKgM2,
      });
    }
    const nimbusReach = reachOf(
      downwind.map((d) => ({ x: d.x, load: d.nimbus })),
      ONE_MM_KG_M2
    );
    const refReach = reachOf(
      downwind.map((d) => ({ x: d.x, load: d.ref })),
      ONE_MM_KG_M2
    );
    const numeric = (r: number | 'beyond' | 'short'): number | null =>
      typeof r === 'number' ? r : null;
    const note =
      typeof nimbusReach === 'number' && typeof refReach === 'number'
        ? undefined
        : `outside the sampled 5–500 km (Nimbus ${typeof nimbusReach === 'number' ? 'inside' : nimbusReach}, Tephra2 ${typeof refReach === 'number' ? 'inside' : refReach})`;
    pairs.push({
      ...base,
      quantity: 'isopach1mmReach',
      detail: '',
      nimbus: numeric(nimbusReach),
      reference: numeric(refReach),
      ...(note === undefined ? {} : { note }),
    });
  }
  return pairs;
}

const referencePath = process.argv[2];
if (referencePath !== undefined) {
  const pairs = comparePairs(referencePath);
  const stats = summarise(pairs);
  mkdirSync(join(ROOT, 'benchmark', 'results'), { recursive: true });
  writeFileSync(
    join(ROOT, 'benchmark', 'results', 'volcano.json'),
    `${JSON.stringify({ track: 'VOL', reference: 'Tephra2 2.0 (commit ff621c6), run locally', stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
