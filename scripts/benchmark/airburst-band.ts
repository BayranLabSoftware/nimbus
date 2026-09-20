/**
 * The run of rules 563 to 570: what I3's band would be made of, measured.
 *
 *   pnpm exec tsx scripts/benchmark/airburst-band.ts
 */
import { airburstBlastYield, airburstReach } from '../../src/physics/effects/airburstBlast.js';
import {
  BURST_ALTITUDE_FIT_RANGE,
  burstAltitudeKm,
  I3_WIDTH_LIMIT,
  PUBLISHED,
  TREE_DAMAGE_KPA,
  TUNGUSKA_FELLED,
} from '../../src/physics/validation/airburstBandRules.js';
import { m, type Joules, type Pascals } from '../../src/physics/units.js';

const MT = 4.184e15;
/** Nimbus's reach at a threshold, for an energy entirely given to the blast
 *  at a stated altitude — the same `airburstReach` the product draws with. */
const reachKm = (energyMt: number, kPa: number, altitudeKm: number): number =>
  Number(
    airburstReach((kPa * 1_000) as Pascals, m(altitudeKm * 1_000), (energyMt * MT) as Joules)
  ) / 1_000;

console.log('Rules 563 to 570 — I3, measured\n');

console.log('Collins et al. 2017 Eqs. 6a-6c, the burst altitude by percentile (km):');
console.log('  energy      1%      50%      99%');
for (const e of [0.55, 5, 15]) {
  console.log(
    `  ${String(e).padStart(5)} Mt  ${burstAltitudeKm(e, 1).toFixed(2).padStart(6)}  ${burstAltitudeKm(e, 50).toFixed(2).padStart(7)}  ${burstAltitudeKm(e, 99).toFixed(2).padStart(7)}` +
      (Math.log10(e) < BURST_ALTITUDE_FIT_RANGE[0] || Math.log10(e) > BURST_ALTITUDE_FIT_RANGE[1]
        ? '   (outside the fit)'
        : '')
  );
}

/**
 * The altitude the paper's OWN blast scenarios use: "We used altitudes of
 * 21.8, 17, 13.5, and 10.9 km, which are approximately halfway between the
 * worst-case (zb,1%) and median (zb,50%) scenarios from our Monte Carlo
 * analysis, given by Equation 6." Rule 565 said the median, which is higher
 * and therefore draws a smaller ring; this is the comparison the rule meant
 * to make and did not say.
 */
const scenarioAltitudeKm = (energyMt: number): number =>
  (burstAltitudeKm(energyMt, 1) + burstAltitudeKm(energyMt, 50)) / 2;

console.log("\nrule 565: Nimbus at the paper's own scenario altitude, against the paper");
for (const [name, p] of Object.entries(PUBLISHED)) {
  const z50 = scenarioAltitudeKm(p.energyMt);
  const mine = reachKm(p.energyMt, p.thresholdKPa, z50);
  const inside = mine >= p.lowKm && mine <= p.highKm;
  console.log(
    `  ${name.padEnd(22)} ${String(p.energyMt).padStart(5)} Mt at ${String(p.thresholdKPa).padStart(2)} kPa, z = ${z50.toFixed(1)} km (median would be ${burstAltitudeKm(p.energyMt, 50).toFixed(1)})`
  );
  console.log(
    `    paper ${String(p.lowKm)}-${String(p.highKm)} km   Nimbus ${mine.toFixed(2)} km   ${inside ? 'INSIDE' : 'OUTSIDE'}  (${(mine / ((p.lowKm + p.highKm) / 2)).toFixed(3)}x the middle)`
  );
}

console.log('\nrule 568: the width the 98 % burst-altitude band gives');
for (const [name, p] of Object.entries(PUBLISHED)) {
  const lo = reachKm(p.energyMt, p.thresholdKPa, burstAltitudeKm(p.energyMt, 1));
  const hi = reachKm(p.energyMt, p.thresholdKPa, burstAltitudeKm(p.energyMt, 99));
  const [a, b] = lo <= hi ? [lo, hi] : [hi, lo];
  const width = a > 0 ? b / a : Number.POSITIVE_INFINITY;
  console.log(
    `  ${name.padEnd(22)} ${a.toFixed(2)} to ${b.toFixed(2)} km   width ${Number.isFinite(width) ? width.toFixed(2) + 'x' : 'unbounded (the low end draws nothing)'}   ${width <= I3_WIDTH_LIMIT ? 'within I3' : 'WIDER THAN I3 ALLOWS'}`
  );
}

console.log('\nrule 566: the two tree-damage thresholds on the felled forest');
console.log(
  `  the forest: ${String(TUNGUSKA_FELLED.areaKm2)} km2, equivalent radius ${String(TUNGUSKA_FELLED.equivalentRadiusKm)} km`
);
for (const energyMt of [5, 10, 15, 20, 30]) {
  const z = scenarioAltitudeKm(energyMt);
  const upper = reachKm(energyMt, TREE_DAMAGE_KPA.upper, z);
  const lower = reachKm(energyMt, TREE_DAMAGE_KPA.lower, z);
  console.log(
    `  ${String(energyMt).padStart(2)} Mt at z ${z.toFixed(1)} km:  20 kPa ${upper.toFixed(2)} km (${(upper / TUNGUSKA_FELLED.equivalentRadiusKm).toFixed(3)}x)   10 kPa ${lower.toFixed(2)} km (${(lower / TUNGUSKA_FELLED.equivalentRadiusKm).toFixed(3)}x)`
  );
}

console.log('\nwhat the product actually draws for its own Tunguska preset');
console.log('  (the report carries 11.5 km at 20 kPa against the 26.5 km forest, 0.43x)');
console.log(
  `  a blast yield of 1 Mt keeps ${(airburstBlastYield(MT as Joules, 1) / MT).toFixed(3)} Mt`
);

// ---- rule 567: who disagrees with whom? -------------------------------
import { airburstOverpressure } from '../../src/physics/effects/airburstBlast.js';
console.log(
  '\nrule 567: the peak overpressure at ground zero, where the paper puts it above the threshold'
);
for (const [name, p] of Object.entries(PUBLISHED)) {
  const z50 = scenarioAltitudeKm(p.energyMt);
  const gz = Number(
    airburstOverpressure({
      groundRange: m(0),
      burstAltitude: m(z50 * 1_000),
      blastYield: (p.energyMt * MT) as Joules,
    })
  );
  console.log(
    `  ${name.padEnd(22)} ground zero ${(gz / 1_000).toFixed(2)} kPa   threshold ${String(p.thresholdKPa)} kPa   ${gz / 1_000 >= p.thresholdKPa ? 'reached' : 'NEVER REACHED'}`
  );
}
console.log('\n  the scaled burst height z/W^(1/3), in m per kt^(1/3):');
for (const [name, p] of Object.entries(PUBLISHED)) {
  const kt = (p.energyMt * MT) / 4.184e12;
  console.log(
    `  ${name.padEnd(22)} ${((scenarioAltitudeKm(p.energyMt) * 1_000) / Math.cbrt(kt)).toFixed(0)}`
  );
}
