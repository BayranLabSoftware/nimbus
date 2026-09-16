import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, kgPerM3, m, mps } from '../../src/physics/units.js';

/**
 * Draws the bodies of rule 148 of src/physics/validation/impactThermalRules.ts:
 * sixteen impacts that reach the ground, none of whose fireball radii anybody
 * has read. Run once, before the program was asked; its output is pasted into
 * the rules file.
 *
 *   pnpm exec tsx scripts/benchmark/impact-thermal-bodies.ts
 */

const SEED = 1_460_916;
const BODIES = 16;

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
const bodies: string[] = [];
let drawn = 0;
while (bodies.length < BODIES) {
  drawn++;
  const diameterM = round(10 ** (Math.log10(20) + random() * Math.log10(1_000)), 3);
  const densityKgM3 = round(1_000 + random() * 7_000, 1);
  const velocityKmS = round(11.2 + random() * (72 - 11.2), 3);
  const angleDeg = round(10 + random() * 80, 2);
  const target = random() < 0.5 ? 'sedimentary' : 'crystalline';
  const r = simulateImpact({
    impactorDiameter: m(diameterM),
    impactVelocity: mps(velocityKmS * 1_000),
    impactorDensity: kgPerM3(densityKgM3),
    targetDensity: kgPerM3(target === 'sedimentary' ? 2_500 : 2_750),
    impactAngle: degreesToRadians(deg(angleDeg)),
  });
  if (r.entry.regime !== 'PARTIAL_AIRBURST') continue;
  bodies.push(
    `  { diameterM: ${diameterM.toString()}, densityKgM3: ${densityKgM3.toString()}, velocityKmS: ${velocityKmS.toString()}, angleDeg: ${angleDeg.toString()}, target: '${target}' },`
  );
}
console.log(`// ${drawn.toString()} drawn, ${BODIES.toString()} kept`);
console.log(bodies.join('\n'));
