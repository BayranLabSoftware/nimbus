import { atmosphericEntry } from '../../src/physics/effects/atmosphericEntry.js';
import { groundImpactOverpressure } from '../../src/physics/effects/airburstBlast.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';

/**
 * Draws the bodies of rule 143 of src/physics/validation/entryProgramRules.ts,
 * none of which anybody has asked the program about: eight slow, dense bodies
 * that reach the ground, where the program's entry departs from the paper's
 * most; four drawn as rule 139 drew its; and four airbursts. Run once, before
 * the program was asked; its output is pasted into the rules file.
 *
 *   pnpm exec tsx scripts/benchmark/entry-program-bodies.ts
 */

const SEED = 1_410_916;

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
const logUniform = (lo: number, hi: number): number =>
  10 ** (Math.log10(lo) + random() * (Math.log10(hi) - Math.log10(lo)));

interface Draw {
  kind: 'slow' | 'general' | 'airburst';
  diameter: [number, number];
  density: [number, number];
  speed: [number, number];
  angle: [number, number];
  ranges: number;
  rangeKm: [number, number];
  wanted: number;
}

const DRAWS: readonly Draw[] = [
  {
    kind: 'slow',
    diameter: [20, 300],
    density: [4_000, 8_000],
    speed: [11.2, 25],
    angle: [20, 90],
    ranges: 5,
    rangeKm: [0.5, 500],
    wanted: 8,
  },
  {
    kind: 'general',
    diameter: [5, 5_000],
    density: [1_000, 8_000],
    speed: [11.2, 72],
    angle: [10, 90],
    ranges: 5,
    rangeKm: [0.5, 500],
    wanted: 4,
  },
  {
    kind: 'airburst',
    diameter: [5, 200],
    density: [1_000, 8_000],
    speed: [11.2, 72],
    angle: [10, 90],
    ranges: 2,
    rangeKm: [1, 300],
    wanted: 4,
  },
];

for (const d of DRAWS) {
  const kept: string[] = [];
  let drawn = 0;
  while (kept.length < d.wanted) {
    drawn++;
    const diameterM = round(logUniform(d.diameter[0], d.diameter[1]), 3);
    const densityKgM3 = round(d.density[0] + random() * (d.density[1] - d.density[0]), 1);
    const velocityKmS = round(d.speed[0] + random() * (d.speed[1] - d.speed[0]), 3);
    const angleDeg = round(d.angle[0] + random() * (d.angle[1] - d.angle[0]), 2);
    const target = random() < 0.5 ? 'sedimentary' : 'crystalline';
    const rangesKm = Array.from({ length: d.ranges }, () =>
      round(logUniform(d.rangeKm[0], d.rangeKm[1]), 3)
    );
    const v0 = velocityKmS * 1_000;
    const energy = 0.5 * (Math.PI / 6) * diameterM ** 3 * densityKgM3 * v0 * v0;
    const e = atmosphericEntry(
      m(diameterM),
      mps(v0),
      undefined,
      kgPerM3(densityKgM3),
      J(energy),
      degreesToRadians(deg(angleDeg)),
      'program'
    );
    if (d.kind === 'airburst') {
      if (e.regime !== 'COMPLETE_AIRBURST') continue;
    } else {
      if (e.regime !== 'PARTIAL_AIRBURST') continue;
      const gf = e.energyFractionToGround;
      const probe = groundImpactOverpressure({
        groundRange: m(1_000),
        virtualBurstAltitude: e.virtualBurstAltitude,
        blastYield: J(energy * Math.max(gf, 1 - gf)),
      }) as number;
      if (!(probe > 0)) continue;
    }
    kept.push(
      `  { kind: '${d.kind}', diameterM: ${diameterM.toString()}, densityKgM3: ${densityKgM3.toString()}, velocityKmS: ${velocityKmS.toString()}, angleDeg: ${angleDeg.toString()}, target: '${target}', rangesKm: [${rangesKm.join(', ')}] },`
    );
  }
  console.log(`  // ${d.kind}: ${drawn.toString()} drawn, ${d.wanted.toString()} kept`);
  console.log(kept.join('\n'));
}
