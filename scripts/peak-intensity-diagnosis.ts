import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import { unseenEarthquakeEvent } from '../src/physics/validation/unseenSet.js';
import { centralEstimate } from '../src/physics/validation/recordedTolls.js';
import { simulateEarthquake } from '../src/physics/events/earthquake/simulate.js';
import { shippedCountryAt } from '../src/physics/validation/shippedPopulation.js';
import { PAGER_COUNTRIES } from '../src/physics/pagerCountries.js';
import { peakIntensityBias } from '../src/physics/validation/vulnerabilityTableRules.js';
import { QUIET_TOLL_THRESHOLD } from '../src/physics/validation/quietBandRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * Rules 455 to 458: the count that acquits the vulnerability table, and
 * the peak the same reading convicts instead.
 *
 * Usage:
 *   pnpm exec tsx scripts/peak-intensity-diagnosis.ts
 */

const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));

function main(): void {
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet);
  let own = 0;
  let borrowed = 0;
  const loud: number[] = [];
  const rest: number[] = [];
  let invented = 0;
  const rows: string[] = [];

  for (const row of quiet) {
    const vs30 = siteVs30('pick', SITES.get(row.comcat));
    const deaths = centralEstimate(unseenEarthquakeEvent(row, { vs30 }))?.deaths ?? 0;
    const r = simulateEarthquake({
      magnitude: row.magnitude,
      depth: (row.depthKm * 1_000) as Meters,
      faultType: row.faultType,
      ...(vs30 === undefined ? {} : { vs30 }),
    });
    const bias = peakIntensityBias(r.shaking.mmiAtEpicenter, row.maxMmi);
    const isLoud = deaths >= QUIET_TOLL_THRESHOLD;
    if (bias !== null) (isLoud ? loud : rest).push(bias);
    if (!isLoud) continue;

    const iso = shippedCountryAt(row.latitude, row.longitude);
    const model = iso === null ? undefined : PAGER_COUNTRIES[iso];
    if (model?.own === true) own += 1;
    else borrowed += 1;
    if (row.maxMmi < 8 && (r.shaking.mmi8Radius as number) > 0) invented += 1;
    rows.push(
      `  ${row.comcat.padEnd(11)} Mw ${row.magnitude.toFixed(1)} ${(iso ?? '--').padEnd(3)} ` +
        `own=${model === undefined ? '--' : model.own ? 'YES' : 'no '} · ` +
        `peak ${r.shaking.mmiAtEpicenter.toFixed(2)} vs ShakeMap ${row.maxMmi.toFixed(2)} ` +
        `(${bias === null ? '—' : (bias >= 0 ? '+' : '') + bias.toFixed(2)}) · ` +
        `deaths ${deaths.toFixed(0).padStart(6)}  ${row.place.slice(0, 30)}`
    );
  }

  const mean = (v: readonly number[]): string => {
    if (v.length === 0) return '—';
    const m = v.reduce((a, b) => a + b, 0) / v.length;
    return `${m >= 0 ? '+' : ''}${m.toFixed(2)} (n=${v.length.toString()})`;
  };

  console.log('### rule 455 — the count that acquits the table');
  console.log(`  false alarms in a country with PAGER's OWN fit: ${own.toString()}`);
  console.log(`  false alarms in a country that borrows a curve: ${borrowed.toString()}`);
  console.log("\n### rule 456 — the peak, model minus the event's own ShakeMap");
  console.log(`  the loud ones: ${mean(loud)}`);
  console.log(`  all the rest:  ${mean(rest)}`);
  console.log(
    `  loud events drawing an MMI VIII ring the record never reaches: ${invented.toString()} of ${(own + borrowed).toString()}`
  );
  console.log(`\n${rows.join('\n')}`);
}

main();
