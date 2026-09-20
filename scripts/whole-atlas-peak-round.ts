import {
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
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
import {
  juryCanSeeSaturation,
  shapeOf,
  wholeAtlasPeakJury,
} from '../src/physics/validation/wholeAtlasPeakRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 465 to 471: the peak on the atlas entire, with the
 * jury shown unconditioned before any law runs.
 *
 * Usage:
 *   pnpm exec tsx scripts/whole-atlas-peak-round.ts
 */

const LAWS: readonly ContourLaw[] = ['boore2014', 'campbellBozorgnia2014', 'allen2012Hypocentral'];
const THRESHOLDS = [7, 8, 9] as const;

interface Pair {
  id: string;
  modelPeakMmi: number;
  recordPeakMmi: number;
}
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
  // --- rule 466, before any law ------------------------------------------
  const jury = wholeAtlasPeakJury();
  const shape = shapeOf(jury);
  console.log('### rule 466 — the jury, before the laws');
  console.log(
    `  ${shape.events.toString()} earthquakes · record peak ${shape.minMmi.toFixed(2)} to ` +
      `${shape.maxMmi.toFixed(2)}, median ${shape.medianMmi.toFixed(2)} · ` +
      `${(100 * shape.shareBelowSeven).toFixed(0)} % below MMI 7`
  );
  const old = shapeOf(widerJury());
  console.log(
    `  for comparison, rule 459's jury: ${old.events.toString()} events, median ` +
      `${old.medianMmi.toFixed(2)}, ${(100 * old.shareBelowSeven).toFixed(0)} % below MMI 7 → ` +
      (juryCanSeeSaturation(old) ? 'usable' : 'REFUSED by rule 466')
  );
  if (!juryCanSeeSaturation(shape)) {
    console.error('  this jury cannot see saturation either; rule 466 stops the round.');
    process.exit(1);
  }
  console.log('  this jury can see saturation → the round proceeds\n');

  // --- rule 468, the peak -------------------------------------------------
  const peaks = new Map<ContourLaw, Pair[]>();
  for (const law of LAWS) peaks.set(law, []);
  for (const e of jury) {
    const vs30 = atlasGround(e);
    for (const law of LAWS) {
      const r = simulateEarthquake({
        magnitude: e.magnitude,
        depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
        faultType: e.faultType,
        contourLaw: law,
        ...(vs30 === undefined ? {} : { vs30 }),
      });
      peaks.get(law)?.push({
        id: e.comcat,
        modelPeakMmi: r.shaking.mmiAtEpicenter,
        recordPeakMmi: e.maxMmi,
      });
    }
  }

  console.log(`### rule 468 — the peak, on all ${shape.events.toString()}`);
  console.log('| law | events | mean bias | sd | within 1 degree | worst |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const law of LAWS) {
    const r = readPeaks(peaks.get(law) ?? []);
    console.log(
      `| ${law} | ${r.events.toString()} | ${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)} | ` +
        `${r.sdBias.toFixed(2)} | ${(100 * r.withinOne).toFixed(0)} % | ` +
        `${r.worst === null ? '—' : `+${r.worst.bias.toFixed(2)}`} |`
    );
  }

  console.log("\n### rule 468 — the same, split by the RECORD's own peak");
  const bands: { label: string; lo: number; hi: number }[] = [
    { label: 'record < 5', lo: 0, hi: 5 },
    { label: 'record 5–6', lo: 5, hi: 6 },
    { label: 'record 6–7', lo: 6, hi: 7 },
    { label: 'record 7–8', lo: 7, hi: 8 },
    { label: 'record >= 8', lo: 8, hi: 99 },
  ];
  console.log(`| band | n | ${LAWS.join(' | ')} |`);
  console.log(`| --- | --- | ${LAWS.map(() => '---').join(' | ')} |`);
  for (const b of bands) {
    const cols = LAWS.map((law) => {
      const r = readPeaks(
        (peaks.get(law) ?? []).filter((p) => p.recordPeakMmi >= b.lo && p.recordPeakMmi < b.hi)
      );
      return r.events === 0 ? '—' : `${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)}`;
    });
    const n = (peaks.get('boore2014') ?? []).filter(
      (p) => p.recordPeakMmi >= b.lo && p.recordPeakMmi < b.hi
    ).length;
    console.log(`| ${b.label} | ${n.toString()} | ${cols.join(' | ')} |`);
  }

  // --- rule 469(c), the areas on the 116 ---------------------------------
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent; rule 469(c) cannot be read.');
    process.exit(1);
  }
  const areas = new Map<ContourLaw, Band[]>();
  for (const law of LAWS) areas.set(law, []);
  for (const e of widerJury()) {
    const cell = magnitudeCell(e.magnitude);
    for (const law of LAWS) {
      const r = simulateEarthquake({
        magnitude: e.magnitude,
        depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
        faultType: e.faultType,
        contourLaw: law,
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

  const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
  console.log('\n### rule 469(c) — the areas, on the 116 where an area exists');
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

  console.log('\n### rule 469 — the verdict');
  const basePeak = readPeaks(peaks.get('boore2014') ?? []);
  const baseCells = biasByCell(areas.get('boore2014') ?? []);
  const baseArea = score(areas.get('boore2014') ?? []);
  for (const law of LAWS) {
    if (law === 'boore2014') continue;
    const peak = readPeaks(peaks.get(law) ?? []);
    const cb = biasByCell(areas.get(law) ?? []);
    const s = score(areas.get(law) ?? []);
    const worsened = cells.filter((c) => {
      const x = baseCells[c];
      const y = cb[c];
      if (x === null || x === undefined || y === null || y === undefined) return false;
      return Math.abs(Math.log(y)) - Math.abs(Math.log(x)) > PEAK_AREA_MARGIN;
    });
    const areaOk =
      worsened.length === 0 && Math.abs(Math.log(s.bias)) <= Math.abs(Math.log(baseArea.bias));
    const peakOk = displacesOnPeak(basePeak, peak);
    console.log(
      `  ${law.padEnd(24)} peak ${peakOk ? 'PASS' : 'fail'} ` +
        `(${peak.meanBias >= 0 ? '+' : ''}${peak.meanBias.toFixed(2)} vs ${basePeak.meanBias >= 0 ? '+' : ''}${basePeak.meanBias.toFixed(2)}, ` +
        `sd ${peak.sdBias.toFixed(2)} vs ${basePeak.sdBias.toFixed(2)}) · areas ` +
        `${areaOk ? 'PASS' : `fail${worsened.length === 0 ? ' (overall)' : ` (${worsened.join(', ')})`}`} → ` +
        (peakOk && areaOk ? 'DISPLACES' : 'refused')
    );
  }
}

main();
