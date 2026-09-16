import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../../src/physics/units.js';

/**
 * Draws the bodies of rule 130 of src/physics/validation/machBlendRules.ts:
 * twelve airbursts none of whose overpressures anybody has read, each with six
 * fractions that place its ranges across the blend. Run once, before the
 * program was asked; its output is pasted into the rules file, so a later
 * change to the entry cannot change the draw.
 *
 *   pnpm exec tsx scripts/benchmark/mach-blend-bodies.ts
 */

const SEED = 1_290_916;
const BODIES = 12;
const FRACTIONS = 6;

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
const KILOTON = 4.184e12;
const round = (x: number, digits: number): number => Number(x.toFixed(digits));
const bodies: string[] = [];
let drawn = 0;
while (bodies.length < BODIES) {
  drawn++;
  const diameterM = round(10 ** (Math.log10(5) + random() * Math.log10(100)), 3);
  const densityKgM3 = round(1_000 + random() * 7_000, 1);
  const velocityKmS = round(11.2 + random() * (72 - 11.2), 3);
  const angleDeg = round(10 + random() * 80, 2);
  const fractions = Array.from({ length: FRACTIONS }, () => round(random(), 4));
  const r = simulateImpact({
    impactorDiameter: m(diameterM),
    impactVelocity: mps(velocityKmS * 1_000),
    impactorDensity: kgPerM3(densityKgM3),
    targetDensity: kgPerM3(2_500),
    impactAngle: degreesToRadians(deg(angleDeg)),
  });
  if (r.entry.regime !== 'COMPLETE_AIRBURST') continue;
  const scale = Math.cbrt((r.entry.blastYieldMegatons * 4.184e15) / KILOTON);
  const z1 = (r.entry.burstAltitude as number) / scale;
  if (!(z1 >= 50 && z1 <= 540)) continue;
  bodies.push(
    `  { diameterM: ${diameterM.toString()}, densityKgM3: ${densityKgM3.toString()}, velocityKmS: ${velocityKmS.toString()}, angleDeg: ${angleDeg.toString()}, fractions: [${fractions.join(', ')}] }, // z₁ ${z1.toFixed(0)} m on the entry here`
  );
}
console.log(`// ${drawn.toString()} drawn, ${BODIES.toString()} kept`);
console.log(bodies.join('\n'));
