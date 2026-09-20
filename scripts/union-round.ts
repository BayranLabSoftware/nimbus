import {
  intensityLawOf,
  simulateEarthquake,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedDipAnswer, shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import { atlasGround } from '../src/physics/validation/atlasRun.js';
import {
  EXTENDED_SOURCE_CELLS,
  magnitudeCell,
} from '../src/physics/validation/extendedSourceRules.js';
import {
  displacesOnPeak,
  PEAK_AREA_MARGIN,
  readPeaks,
} from '../src/physics/validation/peakIntensityRules.js';
import { wholeAtlasPeakJury } from '../src/physics/validation/wholeAtlasPeakRules.js';
import { UNION_SETTINGS } from '../src/physics/validation/unionRules.js';
import {
  centralEstimate,
  compareWithRecord,
  RECORDED_EVENTS,
  sampleToll,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import { unseenEarthquakeEvent } from '../src/physics/validation/unseenSet.js';
import { intervalScore } from '../src/physics/validation/intervalScoreRules.js';
import { QUIET_TOLL_THRESHOLD } from '../src/physics/validation/quietBandRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 483 to 487: every correction together, on all four
 * sets, once.
 *
 * Usage:
 *   pnpm exec tsx scripts/union-round.ts
 */

const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
const THRESHOLDS = [7, 8, 9] as const;

function unionInput(
  base: EarthquakeScenarioInput,
  latitude: number,
  longitude: number
): EarthquakeScenarioInput {
  const withSettings = { ...base, ...UNION_SETTINGS };
  const first = simulateEarthquake(withSettings);
  const dip = shippedDipAnswer(
    latitude,
    longitude,
    (first.inputs.depth as number | undefined) ?? 10_000,
    first.ruptureLength
  );
  return dip === null ? withSettings : { ...withSettings, dipDeg: dip.dipDeg };
}

function asUnion(event: RecordedEvent): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const r = run();
      if (r.type !== 'earthquake') return r;
      return {
        type: 'earthquake',
        data: simulateEarthquake(unionInput(r.data.inputs, event.latitude, event.longitude)),
      };
    },
  };
}

interface Band {
  cell: string;
  observedKm2: number;
  modelKm2: number;
}
const score = (b: readonly Band[]): { bias: number; sdLn: number } => {
  const logs = b
    .filter((x) => x.observedKm2 > 0 && x.modelKm2 > 0)
    .map((x) => Math.log(x.modelKm2 / x.observedKm2));
  if (logs.length < 2) return { bias: Number.NaN, sdLn: Number.NaN };
  const m = logs.reduce((a, c) => a + c, 0) / logs.length;
  return {
    bias: Math.exp(m),
    sdLn: Math.sqrt(logs.reduce((a, c) => a + (c - m) ** 2, 0) / (logs.length - 1)),
  };
};
const byCell = (b: readonly Band[]): Record<string, number | null> => {
  const out: Record<string, number | null> = {};
  for (const c of EXTENDED_SOURCE_CELLS) {
    const s = score(b.filter((x) => x.cell === c.label));
    out[c.label] = Number.isFinite(s.bias) ? s.bias : null;
  }
  return out;
};

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent.');
    process.exit(1);
  }
  const arms = [
    { key: 'ships', union: false },
    { key: 'the union', union: true },
  ] as const;

  // (a) the peak
  console.log('### rule 485(a) — the peak, on 1 100');
  const peakRows = new Map<string, { id: string; modelPeakMmi: number; recordPeakMmi: number }[]>();
  for (const arm of arms) peakRows.set(arm.key, []);
  for (const e of wholeAtlasPeakJury()) {
    const vs30 = atlasGround(e);
    const base: EarthquakeScenarioInput = {
      magnitude: e.magnitude,
      depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
      faultType: e.faultType,
      ...(vs30 === undefined ? {} : { vs30 }),
    };
    for (const arm of arms) {
      const r = simulateEarthquake(arm.union ? unionInput(base, e.latitude, e.longitude) : base);
      peakRows.get(arm.key)?.push({
        id: e.comcat,
        modelPeakMmi: r.shaking.mmiAtEpicenter,
        recordPeakMmi: e.maxMmi,
      });
    }
  }
  console.log('| arm | mean bias | sd | within 1 degree |');
  console.log('| --- | --- | --- | --- |');
  for (const arm of arms) {
    const r = readPeaks(peakRows.get(arm.key) ?? []);
    console.log(
      `| ${arm.key} | ${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)} | ${r.sdBias.toFixed(2)} | ${(100 * r.withinOne).toFixed(0)} % |`
    );
  }

  // (b) the areas
  const areas = new Map<string, Band[]>();
  for (const arm of arms) areas.set(arm.key, []);
  for (const e of widerJury()) {
    const cell = magnitudeCell(e.magnitude);
    const base: EarthquakeScenarioInput = {
      magnitude: e.magnitude,
      depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
      faultType: e.faultType,
    };
    for (const arm of arms) {
      const r = simulateEarthquake(arm.union ? unionInput(base, e.latitude, e.longitude) : base);
      const f = intensityLawOf(r);
      if (f === null) continue;
      const a = shippedStrikeAnswer(e.latitude, e.longitude, e.depthKm * 1000, r.ruptureLength);
      const rupture: RuptureFootprint = {
        latitude: e.latitude,
        longitude: e.longitude,
        strikeDeg: r.inputs.strikeAzimuthDeg ?? a.strikeDeg ?? 0,
        halfLengthM: r.isExtendedSource ? (r.ruptureLength as number) / 2 : 0,
        halfWidthM: r.isExtendedSource ? (r.ruptureFootprintWidth as number) / 2 : 0,
      };
      const { field } = fitShakingField({
        rupture,
        intensityAt: f,
        siteAt: (la, lo) => ({ vs30: site(la, lo).vs30, provenance: 'grid' as const }),
      });
      for (const t of THRESHOLDS) {
        areas
          .get(arm.key)
          ?.push({ cell, observedKm2: e.areaKm2[t], modelKm2: areaAbove(field, t) / 1e6 });
      }
    }
  }
  const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
  console.log('\n### rule 485(b) — the areas, on the 116');
  console.log(`| arm | mean | scatter | ${cells.join(' | ')} |`);
  console.log(`| --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
  for (const arm of arms) {
    const s = score(areas.get(arm.key) ?? []);
    const cb = byCell(areas.get(arm.key) ?? []);
    console.log(
      `| ${arm.key} | ${s.bias.toFixed(3)}x | ${s.sdLn.toFixed(3)} | ` +
        cells
          .map((c) => {
            const v = cb[c];
            return v === null || v === undefined ? '—' : `${v.toFixed(2)}x`;
          })
          .join(' | ') +
        ' |'
    );
  }

  // (c) the dead
  console.log('\n### rule 485(c) — the dead, on the net rows');
  const base = RECORDED_EVENTS.map((r) => compareWithRecord(r));
  const inside0 = base.filter((c) => c.contains).length;
  const netScore = new Map<string, number>();
  for (const arm of arms) {
    let inside = 0;
    let s = 0;
    const lost: string[] = [];
    const gained: string[] = [];
    RECORDED_EVENTS.forEach((row, i) => {
      const a = base[i];
      if (a === undefined) return;
      const b = arm.union ? compareWithRecord(asUnion(row)) : a;
      if (b.contains) inside += 1;
      if (a.contains && !b.contains) lost.push(row.name);
      if (!a.contains && b.contains) gained.push(row.name);
      s += intervalScore(b.low, b.high, row.recordedDeaths);
    });
    netScore.set(arm.key, s);
    console.log(
      `  ${arm.key.padEnd(10)} score ${s.toFixed(1)} · inside ${inside.toString()}/${inside0.toString()} · ` +
        `lost ${lost.length === 0 ? 'none' : lost.join(', ')} · gained ${gained.length === 0 ? 'none' : gained.join(', ')}`
    );
  }

  // (d) the quiet
  console.log('\n### rule 485(d) — the quiet, on 805');
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet);
  const qScore = new Map<string, number>();
  const qLoud = new Map<string, number>();
  const qZero = new Map<string, number>();
  for (const arm of arms) {
    let loud = 0;
    let zero = 0;
    let banded = 0;
    let s = 0;
    for (const row of quiet) {
      const vs30 = siteVs30('pick', SITES.get(row.comcat));
      const ev0 = unseenEarthquakeEvent(row, { vs30 });
      const ev = arm.union ? asUnion(ev0) : ev0;
      if ((centralEstimate(ev)?.deaths ?? 0) >= QUIET_TOLL_THRESHOLD) loud += 1;
      const band = sampleToll(ev);
      if (band === null) continue;
      banded += 1;
      if (band.low.deaths <= 0) zero += 1;
      s += intervalScore(band.low.deaths, band.high.deaths, 0);
    }
    qScore.set(arm.key, s);
    qLoud.set(arm.key, loud);
    qZero.set(arm.key, zero);
    console.log(
      `  ${arm.key.padEnd(10)} score ${s.toFixed(0)} · toll >= 10: ${loud.toString()} · ` +
        `band reaches zero ${zero.toString()}/${banded.toString()}`
    );
  }

  // the verdict
  console.log('\n### rule 486 — the verdict');
  const pk = readPeaks(peakRows.get('the union') ?? []);
  const pkb = readPeaks(peakRows.get('ships') ?? []);
  const ca = byCell(areas.get('ships') ?? []);
  const cb2 = byCell(areas.get('the union') ?? []);
  const worsened = cells.filter((c) => {
    const x = ca[c];
    const y = cb2[c];
    if (x === null || x === undefined || y === null || y === undefined) return false;
    return Math.abs(Math.log(y)) - Math.abs(Math.log(x)) > PEAK_AREA_MARGIN;
  });
  const sa = score(areas.get('ships') ?? []);
  const sb = score(areas.get('the union') ?? []);
  const a1 = displacesOnPeak(pkb, pk);
  const a2 = worsened.length === 0 && Math.abs(Math.log(sb.bias)) <= Math.abs(Math.log(sa.bias));
  const a3 = (netScore.get('the union') ?? Infinity) <= (netScore.get('ships') ?? Infinity);
  const a4 =
    (qScore.get('the union') ?? Infinity) <= (qScore.get('ships') ?? Infinity) &&
    (qLoud.get('the union') ?? Infinity) <= (qLoud.get('ships') ?? Infinity) &&
    (qZero.get('the union') ?? -1) >= (qZero.get('ships') ?? -1);
  console.log(`  (a) peak   ${a1 ? 'PASS' : 'FAIL'}`);
  console.log(
    `  (b) areas  ${a2 ? 'PASS' : `FAIL${worsened.length > 0 ? ` (${worsened.join(', ')})` : ''}`}`
  );
  console.log(`  (c) dead   ${a3 ? 'PASS' : 'FAIL'}`);
  console.log(`  (d) quiet  ${a4 ? 'PASS' : 'FAIL'}`);
  console.log(`  → ${a1 && a2 && a3 && a4 ? 'THE UNION DISPLACES' : 'refused'}`);
}

main();
