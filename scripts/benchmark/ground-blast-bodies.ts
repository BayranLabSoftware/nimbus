import { groundImpactOverpressure } from '../../src/physics/effects/airburstBlast.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';

/**
 * Draws the bodies of rule 139 of src/physics/validation/groundBlastRules.ts:
 * twelve impacts whose swarm reaches the ground, none of whose overpressures
 * anybody has read, each with five ranges drawn with it. Run once, before the
 * program was asked; its output is pasted into the rules file, so a later
 * change to the entry cannot change the draw.
 *
 *   pnpm exec tsx scripts/benchmark/ground-blast-bodies.ts
 */

const SEED = 1_380_916;
const BODIES = 12;
const RANGES = 5;

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
const bodies: string[] = [];
let drawn = 0;
while (bodies.length < BODIES) {
  drawn++;
  const diameterM = round(logUniform(5, 5_000), 3);
  const densityKgM3 = round(1_000 + random() * 7_000, 1);
  const velocityKmS = round(11.2 + random() * (72 - 11.2), 3);
  const angleDeg = round(10 + random() * 80, 2);
  const target = random() < 0.5 ? 'sedimentary' : 'crystalline';
  const rangesKm = Array.from({ length: RANGES }, () => round(logUniform(0.5, 500), 3));
  const r = simulateImpact({
    impactorDiameter: m(diameterM),
    impactVelocity: mps(velocityKmS * 1_000),
    impactorDensity: kgPerM3(densityKgM3),
    targetDensity: kgPerM3(target === 'sedimentary' ? 2_500 : 2_750),
    impactAngle: degreesToRadians(deg(angleDeg)),
  });
  if (r.entry.regime !== 'PARTIAL_AIRBURST') continue;
  const gf = r.entry.energyFractionToGround;
  const energy = J((r.impactor.kineticEnergy as number) * Math.max(gf, 1 - gf));
  const probe = groundImpactOverpressure({
    groundRange: m(1_000),
    virtualBurstAltitude: r.entry.virtualBurstAltitude,
    blastYield: energy,
  }) as number;
  // Where the crossover is not positive the program answers with an error.
  if (!(probe > 0)) continue;
  bodies.push(
    `  { diameterM: ${diameterM.toString()}, densityKgM3: ${densityKgM3.toString()}, velocityKmS: ${velocityKmS.toString()}, angleDeg: ${angleDeg.toString()}, target: '${target}', rangesKm: [${rangesKm.join(', ')}] },`
  );
}
console.log(`// ${drawn.toString()} drawn, ${BODIES.toString()} kept`);
console.log(bodies.join('\n'));
