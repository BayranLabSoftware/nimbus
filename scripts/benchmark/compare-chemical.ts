import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TNT_SPECIFIC_ENERGY } from '../../src/physics/constants.js';
import { peakOverpressure } from '../../src/physics/events/explosion/overpressure.js';
import { simulateExplosion } from '../../src/physics/events/explosion/simulate.js';
import { J, m } from '../../src/physics/units.js';
import { sizeBandOf } from '../../src/physics/validation/scorecard.js';
import { printStats, summarise, type Pair } from './stats.js';

/**
 * Track CHEM of the benchmark protocol: the air blast of a chemical
 * surface charge against Kingery & Bulmash (1984) as Swisdak (1994)
 * simplified it, on every case of benchmark/matrices/chemical.json
 * (scripts/benchmark/kb_reference.py writes the reference).
 *
 *   pnpm exec tsx scripts/benchmark/compare-chemical.ts <kb reference.json> [<pairs.json>]
 *
 * Nimbus's side is `simulateExplosion` for a chemical charge on the
 * ground: its 5 psi, 1 psi and 0.5 psi rings, and the incident
 * overpressure at each range from the same surface-burst yield (twice
 * the charge, in Kinney & Graham's free-air fit) the rings are drawn
 * from.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface KbCase {
  id: string;
  chargeKgTnt: number;
  points: { scaledDistance: number; rangeM: number; incidentPressurePa: number }[];
  ringRadiiM: Record<'5 psi' | '1 psi' | '0.5 psi', number | null>;
}

interface ChemicalCase {
  id: string;
  source: string;
}

export function comparePairs(referencePath: string): Pair[] {
  const sources = new Map(
    (
      JSON.parse(
        readFileSync(join(ROOT, 'benchmark', 'matrices', 'chemical.json'), 'utf8')
      ) as ChemicalCase[]
    ).map((c) => [c.id, c.source])
  );
  const reference = JSON.parse(readFileSync(referencePath, 'utf8')) as { cases: KbCase[] };
  const pairs: Pair[] = [];
  for (const k of reference.cases) {
    const joules = k.chargeKgTnt * TNT_SPECIFIC_ENERGY;
    const r = simulateExplosion({
      yieldMegatons: joules / 4.184e15,
      chargeType: 'chemical',
      heightOfBurst: m(0),
    });
    const base = {
      track: 'CHEM',
      caseId: k.id,
      source: sources.get(k.id) === 'preset' ? ('preset' as const) : ('custom' as const),
      band: sizeBandOf('explosion', joules),
      cls: 'B' as const,
    };
    for (const p of k.points) {
      pairs.push({
        ...base,
        quantity: 'incidentOverpressure',
        detail: `Z = ${p.scaledDistance.toString()} m/kg^1/3`,
        bin: `Z = ${p.scaledDistance.toString()}`,
        nimbus: peakOverpressure({ distance: m(p.rangeM), yieldEnergy: J(2 * joules) }),
        reference: p.incidentPressurePa,
      });
    }
    const rings = [
      ['5 psi', r.blast.overpressure5psiRadiusHob],
      ['1 psi', r.blast.overpressure1psiRadiusHob],
      ['0.5 psi', r.blast.lightDamageRadiusHob],
    ] as const;
    for (const [label, radius] of rings) {
      const ref = k.ringRadiiM[label];
      pairs.push({
        ...base,
        quantity: 'ringRadius',
        detail: label,
        bin: label,
        nimbus: radius,
        reference: ref,
        ...(ref === null ? { note: 'outside the fit (0.2–40 m/kg^1/3)' } : {}),
      });
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
    join(ROOT, 'benchmark', 'results', 'chemical.json'),
    `${JSON.stringify({ track: 'CHEM', reference: 'Kingery–Bulmash surface burst, Swisdak 1994 simplified fits (kingery-bulmash package, commit 194c3c7)', stats }, null, 1)}\n`
  );
  const pairsOut = process.argv[3];
  if (pairsOut !== undefined) writeFileSync(pairsOut, JSON.stringify(pairs));
  printStats(stats);
}
