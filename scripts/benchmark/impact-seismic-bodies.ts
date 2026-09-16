import { atmosphericEntry } from '../../src/physics/effects/atmosphericEntry.js';
import { impactSeismicEnergy, seismicMagnitude } from '../../src/physics/events/impact/seismic.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';

/**
 * Draws the bodies of rule 156 of src/physics/validation/impactSeismicRules.ts:
 * sixteen impacts none of whose seismic rings anybody has read, the first eight
 * that burst in the air and the first eight that reach the ground, each with a
 * magnitude of at least 3.2 under the candidate, so that the program draws a
 * ring. Run once, before the program was asked; its output is pasted into the
 * rules file.
 *
 *   pnpm exec tsx scripts/benchmark/impact-seismic-bodies.ts
 */

const SEED = 1_540_916;
const PER_KIND = 8;
const MIN_MAGNITUDE = 3.2;

// mulberry32
function generator(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const random = generator(SEED);
const round = (x: number, digits: number): number => Number(x.toFixed(digits));
const kept = { air: [] as string[], ground: [] as string[] };
let drawn = 0;
while (kept.air.length < PER_KIND || kept.ground.length < PER_KIND) {
  drawn++;
  const diameterM = round(10 ** (1 + random() * 3), 3);
  const densityKgM3 = round(1_000 + random() * 7_000, 1);
  const velocityKmS = round(11.2 + random() * (72 - 11.2), 3);
  const angleDeg = round(10 + random() * 80, 2);
  const target = random() < 0.5 ? 'sedimentary' : 'crystalline';
  const v0 = velocityKmS * 1_000;
  const ke = 0.5 * densityKgM3 * (Math.PI / 6) * diameterM ** 3 * v0 * v0;
  const e = atmosphericEntry(
    m(diameterM),
    mps(v0),
    undefined,
    kgPerM3(densityKgM3),
    J(ke),
    degreesToRadians(deg(angleDeg)),
    'program',
    'program'
  );
  const airburst = e.regime === 'COMPLETE_AIRBURST';
  const magnitude = seismicMagnitude(
    impactSeismicEnergy(
      {
        kineticEnergy: J(ke),
        energyFractionToGround: e.energyFractionToGround,
        airburst,
        entryVelocity: v0,
        endVelocity: e.endVelocity,
      },
      'program'
    )
  );
  if (magnitude < MIN_MAGNITUDE) continue;
  const list = airburst ? kept.air : kept.ground;
  if (list.length >= PER_KIND) continue;
  list.push(
    `  { diameterM: ${diameterM.toString()}, densityKgM3: ${densityKgM3.toString()}, velocityKmS: ${velocityKmS.toString()}, angleDeg: ${angleDeg.toString()}, target: '${target}' },`
  );
}
console.log(`// ${drawn.toString()} drawn, ${(2 * PER_KIND).toString()} kept`);
console.log([...kept.air, ...kept.ground].join('\n'));
