/**
 * Rule 341 of `src/physics/validation/fieldTollRules.ts`: what counting the
 * dead cell by cell does to the calibration net, row by row, before and after.
 *
 *   pnpm exec tsx scripts/benchmark/field-toll.ts
 *
 * Nothing is wired while this runs: the "before" is what the product publishes
 * today, the "after" is rule 335's sum over the same scenario's field, and the
 * two are computed side by side so that neither waits on the other.
 */

import { RECORDED_EVENTS, compareWithRecord } from '../../src/physics/validation/recordedTolls.js';
import {
  shippedCountryAt,
  shippedLandDensity,
} from '../../src/physics/validation/shippedPopulation.js';
import { shippedSiteLookup } from '../../src/physics/validation/shippedVs30.js';
import {
  tollAmendmentHolds,
  type TollReading,
} from '../../src/physics/validation/fieldTollRules.js';
import { pagerVulnerabilityFor } from '../../src/physics/pagerVulnerability.js';
import { tollOverField } from '../../src/physics/events/earthquake/fieldToll.js';
import {
  evaluateShakingField,
  type RuptureFootprint,
} from '../../src/physics/events/earthquake/shakingField.js';
import { intensityLawOf } from '../../src/physics/events/earthquake/simulate.js';

const site = shippedSiteLookup();

function stats(ratios: readonly number[]): TollReading {
  const ln = ratios.filter((r) => Number.isFinite(r) && r > 0).map(Math.log);
  const mean = ln.reduce((a, b) => a + b, 0) / ln.length;
  const variance =
    ln.length > 1 ? ln.reduce((a, b) => a + (b - mean) ** 2, 0) / (ln.length - 1) : 0;
  return { bias: Math.exp(mean), sigma: Math.sqrt(variance), rows: ln.length };
}

console.log(
  '| riga | record | morti oggi | morti sul campo | rapporto oggi | rapporto campo | celle | ms |'
);
console.log('| --- | --: | --: | --: | --: | --: | --: | --: |');

const before: number[] = [];
const after: number[] = [];
let slowest = 0;

for (const event of RECORDED_EVENTS) {
  const result = event.run();
  if (result.type !== 'earthquake') continue;
  const law = intensityLawOf(result.data);
  if (law === null) continue;
  const today = compareWithRecord(event);

  const rupture: RuptureFootprint = {
    latitude: event.latitude,
    longitude: event.longitude,
    strikeDeg: result.data.inputs.strikeAzimuthDeg ?? 0,
    halfLengthM: result.data.isExtendedSource ? result.data.ruptureLength / 2 : 0,
    halfWidthM: result.data.isExtendedSource ? result.data.ruptureWidth / 2 : 0,
  };
  // Rule 312: wide enough to hold the outermost band the plan carries.
  const outermost = Math.max(
    result.data.shaking.mmi5Radius ?? 0,
    result.data.shaking.mmi6Radius ?? 0,
    result.data.shaking.mmi7Radius
  );
  const field = evaluateShakingField({
    rupture,
    intensityAt: law,
    siteAt: site ?? (() => ({ vs30: result.data.inputs.vs30 ?? 760, provenance: 'rock' as const })),
    halfSpanM: rupture.halfLengthM + Math.max(30_000, 1.2 * outermost),
  });
  const vulnerability = pagerVulnerabilityFor(
    shippedCountryAt(event.latitude, event.longitude) ?? undefined
  );
  const lowest = (result.data.inputs.lowIntensityDeaths ?? 'none') === 'none' ? 7 : 5;
  const toll = tollOverField({
    field,
    densityAt: shippedLandDensity,
    vulnerability,
    lowestBand: lowest,
  });
  slowest = Math.max(slowest, toll.elapsedMs);

  const record = event.recordedDeaths;
  const ratioToday = today.ratio;
  const ratioField = record > 0 ? toll.deaths / record : Number.NaN;
  if (record > 0) {
    before.push(ratioToday);
    after.push(ratioField);
  }
  console.log(
    `| ${event.name} | ${record.toString()} | ${today.deaths.toFixed(0)} | ${toll.deaths.toFixed(0)} | ${Number.isFinite(ratioToday) ? ratioToday.toFixed(2) : '—'} | **${Number.isFinite(ratioField) ? ratioField.toFixed(2) : '—'}** | ${toll.populatedCells.toString()} | ${toll.elapsedMs.toString()} |`
  );
}

const a = stats(before);
const b = stats(after);
console.log('');
console.log(
  `338(b) bias ${a.bias.toFixed(3)} -> ${b.bias.toFixed(3)}, σ ${a.sigma.toFixed(3)} -> ${b.sigma.toFixed(3)} su ${b.rows.toString()} righe  ->  ${tollAmendmentHolds(a, b) ? 'DENTRO' : 'FUORI'}`
);
console.log(`340 campo più lento: ${slowest.toString()} ms contro 250`);
