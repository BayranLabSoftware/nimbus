import { writeFileSync } from 'node:fs';
import {
  airburstOverpressure,
  airburstOverpressureRange,
  airburstReach,
} from '../../src/physics/effects/airburstBlast.js';
import { EIEP_REFERENCE } from '../../src/physics/validation/eiepReference.js';
import { simulateEiepRow } from '../../src/physics/validation/eiepComparison.js';
import { IMPACT_PRESETS, simulateImpact } from '../../src/physics/simulate.js';
import { J, m, Pa } from '../../src/physics/units.js';

/**
 * The held-out checks of the airburst's blast, H1 to H3 of
 * docs/BENCHMARK_PROTOCOL.md ("After the campaign: the airburst's blast"),
 * written before they were run.
 *
 *   pnpm exec tsx scripts/benchmark/airburst-checks.ts [out.json]
 *
 * H1: the validation grid's airburst rows against the program's printed
 * overpressure (class A). H2: Collins et al. 2017 Table 2 against the
 * simple law fed the table's energy at its burst altitude (class B).
 * H3: Chelyabinsk's and Tunguska's footprints (class C).
 */

const MEGATON = 4.184e15;

interface Line {
  check: 'H1' | 'H2' | 'H3';
  item: string;
  nimbus: number | null;
  reference: number | null;
  /** ln(nimbus / reference), when both are numbers above zero. */
  lnRatio: number | null;
  verdict: string;
}

const lines: Line[] = [];
const push = (
  check: Line['check'],
  item: string,
  nimbus: number | null,
  reference: number | null,
  verdict: string
): void => {
  const lnRatio =
    nimbus !== null && reference !== null && nimbus > 0 && reference > 0
      ? Math.log(nimbus / reference)
      : null;
  lines.push({ check, item, nimbus, reference, lnRatio, verdict });
};

// --- H1 ------------------------------------------------------------------
for (const row of EIEP_REFERENCE) {
  if (row.error !== null || row.burstAltitudeM == null || row.overpressurePa == null) continue;
  const r = simulateEiepRow(row);
  const label = `${row.diameterM.toString()} m, ${row.densityKgM3.toString()} kg/m³, ${row.velocityKmS.toString()} km/s, ${row.angleDeg.toString()}°, ${row.distanceKm.toString()} km`;
  if (r.entry.regime !== 'COMPLETE_AIRBURST') {
    push('H1', `${label} (regime)`, null, null, `Nimbus: ${r.entry.regime}`);
    continue;
  }
  const altitudeOff = Math.abs((r.entry.burstAltitude as number) / row.burstAltitudeM - 1);
  const p = airburstOverpressureRange({
    groundRange: m(row.distanceKm * 1_000),
    burstAltitude: r.entry.burstAltitude,
    blastYield: J(r.entry.blastYieldMegatons * MEGATON),
  });
  const [low, high] = row.overpressurePa;
  for (const [end, nimbus, reference] of [
    ['low', p.low as number, low],
    ['high', p.high as number, high],
  ] as const) {
    // Printed to the thousandth of a pascal at most.
    const within = Math.abs(nimbus - reference) <= 0.01 * reference + 0.0005;
    push(
      'H1',
      `${label} (${end})`,
      nimbus,
      reference,
      within ? 'within 1 %' : altitudeOff > 0.01 ? 'apart: burst altitude' : 'outside'
    );
  }
}

// --- H2 ------------------------------------------------------------------
/** Collins et al. 2017, Table 2: static (S) and moving (M) source. null: n/a
 *  (not reached); undefined: too low to be seen in the mesh. */
const TABLE_2 = [
  {
    megatons: 0.5,
    altitudeKm: 21.5,
    peak: [3.81, 5.27],
    atThreeHeights: [0.786, 0.811],
    ranges: { 1: [52.3, 54.8], 10: [null, null], 20: [null, null], 35: [null, null] },
  },
  {
    megatons: 5,
    altitudeKm: 14,
    peak: [21.6, 35.2],
    atThreeHeights: [4.16, 4.41],
    ranges: { 1: [142, 140], 10: [18.7, 22.4], 20: [4.48, 11.8], 35: [null, 1.16] },
  },
  {
    megatons: 15,
    altitudeKm: 10,
    peak: [65.8, 143],
    atThreeHeights: [11.8, 13.0],
    ranges: { 1: [257, 236], 10: [34.4, 36.2], 20: [19.2, 22.1], 35: [11.1, 14.9] },
  },
  {
    megatons: 50,
    altitudeKm: 11,
    peak: [116, 326],
    atThreeHeights: [19.6, 20.5],
    ranges: { 1: [undefined, undefined], 10: [57.0, 54.3], 20: [32.4, 33.5], 35: [20.4, 23.3] },
  },
] as const;

for (const row of TABLE_2) {
  const altitude = m(row.altitudeKm * 1_000);
  const blastYield = J(row.megatons * MEGATON);
  const scenario = `${row.megatons.toString()} Mt at ${row.altitudeKm.toString()} km`;
  const at = (rangeM: number) =>
    airburstOverpressureRange({ groundRange: m(rangeM), burstAltitude: altitude, blastYield });
  const ends = [
    ['S', 'low'],
    ['M', 'high'],
  ] as const;
  ends.forEach(([source, end], i) => {
    const peak = at(0)[end] as number;
    push('H2', `${scenario}: peak overpressure, ${source}`, peak / 1_000, row.peak[i] ?? null, '');
    // At exactly three burst altitudes both ends are the static source's.
    const three = airburstOverpressure({
      groundRange: m(3 * (altitude as number)),
      burstAltitude: altitude,
      blastYield,
    }) as number;
    push(
      'H2',
      `${scenario}: overpressure at 3 z_b, ${source}`,
      three / 1_000,
      row.atThreeHeights[i] ?? null,
      ''
    );
    for (const kPa of [1, 10, 20, 35] as const) {
      const reference = row.ranges[kPa][i];
      if (reference === undefined) continue;
      const reach = (airburstReach(Pa(kPa * 1_000), altitude, blastYield, end) as number) / 1_000;
      if (reference === null) {
        push(
          'H2',
          `${scenario}: ${kPa.toString()} kPa range, ${source}`,
          reach,
          null,
          reach === 0 ? 'not reached, as in the paper' : 'reached; the paper: not reached'
        );
      } else {
        push(
          'H2',
          `${scenario}: ${kPa.toString()} kPa range, ${source}`,
          reach,
          reference,
          reach === 0 ? 'not reached; the paper reaches it' : ''
        );
      }
    }
  });
}

// --- H3 ------------------------------------------------------------------
const chelyabinsk = simulateImpact(IMPACT_PRESETS.CHELYABINSK.input);
const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);
const presetReach = (r: typeof chelyabinsk, kPa: number, end: 'low' | 'high') =>
  (airburstReach(
    Pa(kPa * 1_000),
    r.entry.burstAltitude,
    J(r.entry.blastYieldMegatons * MEGATON),
    end
  ) as number) / 1_000;
const circle = (km2: number) => Math.sqrt(km2 / Math.PI);
const flag = (nimbus: number, reference: number) =>
  nimbus > 0 && Math.abs(Math.log(nimbus / reference)) <= Math.log(2) ? 'within ×2' : 'flag';
for (const [label, r, kPa, km2] of [
  ['Chelyabinsk: 1 kPa range against the ~10 000 km² of broken windows', chelyabinsk, 1, 10_000],
  ['Tunguska: 20 kPa range against the ~2 200 km² of flattened forest', tunguska, 20, 2_200],
  ['Tunguska: 10 kPa range (reported beside it)', tunguska, 10, 2_200],
] as const) {
  for (const end of ['low', 'high'] as const) {
    const nimbus = presetReach(r, kPa, end);
    push('H3', `${label}, ${end} end`, nimbus, circle(km2), flag(nimbus, circle(km2)));
  }
}

// --- Report --------------------------------------------------------------
/** Pairs, geometric mean ratio and median |ln ratio| of the lines kept. */
const summary = (keep: (l: Line) => boolean) => {
  const ln = lines.flatMap((l) => (keep(l) && l.lnRatio !== null ? [l.lnRatio] : []));
  const abs = ln.map(Math.abs).sort((a, b) => a - b);
  return {
    pairs: ln.length,
    geometricMeanRatio:
      ln.length === 0 ? null : Math.exp(ln.reduce((a, b) => a + b, 0) / ln.length),
    medianAbsLn: abs.length === 0 ? null : (abs[Math.floor((abs.length - 1) / 2)] ?? null),
  };
};
const h2static = summary((l) => l.check === 'H2' && l.item.endsWith(', S'));
const header = {
  H1: summary((l) => l.check === 'H1'),
  H2static: { ...h2static, flagged: (h2static.medianAbsLn ?? 0) > Math.log(1.25) },
  H2moving: summary((l) => l.check === 'H2' && l.item.endsWith(', M')),
};
for (const l of lines) {
  const n = l.nimbus === null ? '—' : l.nimbus.toPrecision(4);
  const ref = l.reference === null ? '—' : l.reference.toPrecision(4);
  const ratio = l.lnRatio === null ? '' : ` ×${Math.exp(l.lnRatio).toFixed(3)}`;
  console.log(`${l.check}  ${l.item}: ${n} vs ${ref}${ratio} ${l.verdict}`);
}
console.log(JSON.stringify(header, null, 2));
const out = process.argv[2];
if (out !== undefined) writeFileSync(out, `${JSON.stringify({ header, lines }, null, 2)}\n`);
