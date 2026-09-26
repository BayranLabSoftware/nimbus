/**
 * Rule 1243 (d) (`src/physics/validation/porta1BlastRules.ts`): the
 * product's blast read at a damage criterion fixed from sources independent
 * of the two events — windows at 0.7 kPa (their edge) and 3.4–6.9 kPa (most
 * broken); a felled forest at 40–45 m/s (moderate), bounded by 27 and 63
 * m/s — for its Chelyabinsk and Tunguska presets, the static source and the
 * band of Collins et al. (2017) about it. Development only; the product is
 * not changed.
 *
 *   pnpm exec tsx scripts/porta1-blast-criteria.ts
 *
 * Writes src/physics/validation/porta1BlastCriteria.json and
 * docs/PORTA1_BLAST_CRITERIA.md.
 */

import { writeFileSync } from 'node:fs';
import { airburstBlastBand, airburstReach } from '../src/physics/effects/airburstBlast.js';
import { peakWindFromOverpressure } from '../src/physics/events/explosion/peakWind.js';
import { IMPACT_PRESETS, simulateImpact } from '../src/physics/simulate.js';
import { J, m, Pa } from '../src/physics/units.js';

/** The overpressure (Pa) whose peak wind is `wind` (m/s), by bisection on
 *  the product's own shock relation. */
function overpressureForWind(wind: number): number {
  let lo = 1;
  let hi = 1e6;
  for (let i = 0; i < 200; i++) {
    const mid = Math.sqrt(lo * hi);
    if ((peakWindFromOverpressure(Pa(mid)) as number) < wind) lo = mid;
    else hi = mid;
  }
  return Math.sqrt(lo * hi);
}

const km = (x: number): number => Math.round(x / 10) / 100;

interface Reading {
  criterion: string;
  overpressureKpa: number;
  staticKm: number;
  bandLowKm: number;
  bandHighKm: number;
}

function readAt(
  label: string,
  pascals: number,
  burstAltitude: number,
  blastYieldJ: number
): Reading {
  const band = airburstBlastBand(Pa(pascals), m(burstAltitude), J(blastYieldJ));
  return {
    criterion: label,
    overpressureKpa: Math.round(pascals) / 1000,
    staticKm: km(airburstReach(Pa(pascals), m(burstAltitude), J(blastYieldJ))),
    bandLowKm: km(band.low),
    bandHighKm: km(band.high),
  };
}

const cases = [
  {
    preset: 'CHELYABINSK' as const,
    observed: 'windows broken over about 10 000 km² (a circle of 56 km)',
    observedKm: 56,
    criteria: [
      { label: 'edge of broken windows, 0.7 kPa (about 5 % broken)', pa: 700 },
      { label: 'most windows broken, 3.4 kPa (0.5 psi)', pa: 3_447 },
      { label: 'most windows broken, 6.9 kPa (1.0 psi)', pa: 6_895 },
    ],
  },
  {
    preset: 'TUNGUSKA' as const,
    observed: 'felled forest over about 2 200 km² (a circle of 26.5 km)',
    observedKm: 26.5,
    criteria: [27, 36, 40, 45, 58, 63].map((w) => ({
      label: `${String(w)} m/s (${w <= 36 ? 'light' : w <= 45 ? 'moderate' : 'severe'})`,
      pa: overpressureForWind(w),
    })),
  },
];

const results = cases.map((c) => {
  const r = simulateImpact(IMPACT_PRESETS[c.preset].input);
  const burstAltitude = r.entry.burstAltitude as number;
  const blastYieldJ = r.entry.blastYieldMegatons * 4.184e15;
  return {
    preset: c.preset,
    regime: r.entry.regime,
    burstAltitudeKm: km(burstAltitude),
    blastYieldMt: Math.round(r.entry.blastYieldMegatons * 1000) / 1000,
    observed: c.observed,
    observedKm: c.observedKm,
    readings: c.criteria.map((k) => readAt(k.label, k.pa, burstAltitude, blastYieldJ)),
  };
});

writeFileSync(
  'src/physics/validation/porta1BlastCriteria.json',
  `${JSON.stringify({ rule: '1243 (d)', results }, null, 1)}\n`
);

const lines: string[] = [
  '# Porta 1 — the blast read at an independent damage criterion (rule 1243)',
  '',
  'The product’s airburst blast (the Earth Impact Effects Program’s, as Collins et al. 2017 left it) for its two presets, read at criteria fixed from Glasstone & Dolan (1977) and blast-wave statistics before the reading: the edge of broken windows at 0.7 kPa, most windows broken at 3.4–6.9 kPa; a felled forest’s edge at the moderate criterion’s 40–45 m/s, bounded by 27 and 63 m/s. «Band» is Collins et al.’s about the static source (twice and half its overpressure within three burst altitudes). Development only; nothing in the product changed.',
  '',
];
for (const r of results) {
  lines.push(
    `## ${r.preset === 'CHELYABINSK' ? 'Chelyabinsk' : 'Tunguska'} — ${r.observed}`,
    '',
    `The preset bursts at ${String(r.burstAltitudeKm)} km with ${String(r.blastYieldMt)} Mt (${r.regime}).`,
    '',
    '| Criterion | Overpressure (kPa) | Static reach (km) | Band (km) | Static / observed |',
    '| --- | --: | --: | --- | --: |',
    ...r.readings.map(
      (x) =>
        `| ${x.criterion} | ${String(x.overpressureKpa)} | ${String(x.staticKm)} | ${String(x.bandLowKm)}–${String(x.bandHighKm)} | ${(x.staticKm / r.observedKm).toFixed(2)} |`
    ),
    ''
  );
}
writeFileSync('docs/PORTA1_BLAST_CRITERIA.md', lines.join('\n'));
console.log(JSON.stringify(results, null, 1));
