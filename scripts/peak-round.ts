import {
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import {
  EXTENDED_SOURCE_CELLS,
  magnitudeCell,
} from '../src/physics/validation/extendedSourceRules.js';
import {
  displacesOnPeak,
  PEAK_AREA_MARGIN,
  readPeaks,
} from '../src/physics/validation/peakIntensityRules.js';
import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 459 to 464: the epicentral intensity of three laws
 * against the peak of each earthquake's own ShakeMap.
 *
 * Usage:
 *   pnpm exec tsx scripts/peak-round.ts
 */

const LAWS: readonly ContourLaw[] = ['boore2014', 'campbellBozorgnia2014', 'allen2012Hypocentral'];
const THRESHOLDS = [7, 8, 9] as const;
const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));

interface Band {
  cell: string;
  observedKm2: number;
  modelKm2: number;
}

function score(bands: readonly Band[]): { bias: number; sdLn: number } {
  const logs = bands
    .filter((b) => b.observedKm2 > 0 && b.modelKm2 > 0)
    .map((b) => Math.log(b.modelKm2 / b.observedKm2));
  if (logs.length < 2) return { bias: Number.NaN, sdLn: Number.NaN };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  return {
    bias: Math.exp(mean),
    sdLn: Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1)),
  };
}

function biasByCell(bands: readonly Band[]): Record<string, number | null> {
  const out: Record<string, number | null> = {};
  for (const cell of EXTENDED_SOURCE_CELLS) {
    const s = score(bands.filter((b) => b.cell === cell.label));
    out[cell.label] = Number.isFinite(s.bias) ? s.bias : null;
  }
  return out;
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent.');
    process.exit(1);
  }
  const jury = widerJury();
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet);

  const peaksJury = new Map<
    ContourLaw,
    { id: string; modelPeakMmi: number; recordPeakMmi: number }[]
  >();
  const peaksQuiet = new Map<
    ContourLaw,
    { id: string; modelPeakMmi: number; recordPeakMmi: number }[]
  >();
  const areas = new Map<ContourLaw, Band[]>();
  for (const law of LAWS) {
    peaksJury.set(law, []);
    peaksQuiet.set(law, []);
    areas.set(law, []);
  }

  for (const e of jury) {
    const cell = magnitudeCell(e.magnitude);
    for (const law of LAWS) {
      const input: EarthquakeScenarioInput = {
        magnitude: e.magnitude,
        depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
        faultType: e.faultType,
        contourLaw: law,
      };
      const r = simulateEarthquake(input);
      peaksJury.get(law)?.push({
        id: e.comcat,
        modelPeakMmi: r.shaking.mmiAtEpicenter,
        recordPeakMmi: e.maxMmi,
      });
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
          .get(law)
          ?.push({ cell, observedKm2: e.areaKm2[t], modelKm2: areaAbove(field, t) / 1e6 });
      }
    }
  }

  for (const row of quiet) {
    const vs30 = siteVs30('pick', SITES.get(row.comcat));
    for (const law of LAWS) {
      const r = simulateEarthquake({
        magnitude: row.magnitude,
        depth: (row.depthKm * 1_000) as Meters,
        faultType: row.faultType,
        contourLaw: law,
        ...(vs30 === undefined ? {} : { vs30 }),
      });
      peaksQuiet.get(law)?.push({
        id: row.comcat,
        modelPeakMmi: r.shaking.mmiAtEpicenter,
        recordPeakMmi: row.maxMmi,
      });
    }
  }

  const table = (
    title: string,
    by: Map<ContourLaw, { id: string; modelPeakMmi: number; recordPeakMmi: number }[]>
  ): void => {
    console.log(`\n### ${title}`);
    console.log('| law | events | mean bias | sd | within 1 degree | worst |');
    console.log('| --- | --- | --- | --- | --- | --- |');
    for (const law of LAWS) {
      const r = readPeaks(by.get(law) ?? []);
      console.log(
        `| ${law} | ${r.events.toString()} | ${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)} | ` +
          `${r.sdBias.toFixed(2)} | ${(100 * r.withinOne).toFixed(0)} % | ` +
          `${r.worst === null ? '—' : `+${r.worst.bias.toFixed(2)} ${r.worst.id}`} |`
      );
    }
  };

  table('rule 461 — the peak, on the 116', peaksJury);
  table('rule 461 — the peak, on the 805 quiet', peaksQuiet);

  console.log('\n### rule 462(c) — the areas, on the same 116');
  const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
  console.log(`| law | mean | scatter | ${cells.join(' | ')} |`);
  console.log(`| --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
  for (const law of LAWS) {
    const s = score(areas.get(law) ?? []);
    const cb = biasByCell(areas.get(law) ?? []);
    console.log(
      `| ${law} | ${s.bias.toFixed(3)}x | ${s.sdLn.toFixed(3)} | ` +
        cells
          .map((c) => {
            const v = cb[c];
            return v === null || v === undefined ? '—' : `${v.toFixed(2)}x`;
          })
          .join(' | ') +
        ' |'
    );
  }

  console.log('\n### rule 462 — the verdict');
  const basePeak = readPeaks(peaksJury.get('boore2014') ?? []);
  const baseCells = biasByCell(areas.get('boore2014') ?? []);
  const baseArea = score(areas.get('boore2014') ?? []);
  for (const law of LAWS) {
    if (law === 'boore2014') continue;
    const peak = readPeaks(peaksJury.get(law) ?? []);
    const cb = biasByCell(areas.get(law) ?? []);
    const s = score(areas.get(law) ?? []);
    const worsened: string[] = [];
    for (const cell of cells) {
      const x = baseCells[cell];
      const y = cb[cell];
      if (x === null || x === undefined || y === null || y === undefined) continue;
      if (Math.abs(Math.log(y)) - Math.abs(Math.log(x)) > PEAK_AREA_MARGIN) worsened.push(cell);
    }
    const areaOk =
      worsened.length === 0 && Math.abs(Math.log(s.bias)) <= Math.abs(Math.log(baseArea.bias));
    const peakOk = displacesOnPeak(basePeak, peak);
    console.log(
      `  ${law.padEnd(24)} peak ${peakOk ? 'PASS' : 'fail'} (${peak.meanBias >= 0 ? '+' : ''}${peak.meanBias.toFixed(2)} vs ${basePeak.meanBias >= 0 ? '+' : ''}${basePeak.meanBias.toFixed(2)}, ` +
        `sd ${peak.sdBias.toFixed(2)} vs ${basePeak.sdBias.toFixed(2)}) · ` +
        `areas ${areaOk ? 'PASS' : `fail${worsened.length === 0 ? ' (overall)' : ` (${worsened.join(', ')})`}`} → ` +
        (peakOk && areaOk ? 'DISPLACES' : 'refused')
    );
  }
}

main();
