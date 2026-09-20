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
import { shippedDipAnswer } from '../src/physics/validation/shippedFaults.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 472 to 477: a law whose distance carries the source,
 * paired with the geometry that works, on the peak and the areas at once.
 *
 * Usage:
 *   pnpm exec tsx scripts/near-field-round.ts
 */

/** Rule 472's arms: a law and a geometry, together where the rules pair
 *  them. `geometry` is the pairing of rules 427 to 434. */
const ARMS = [
  {
    key: 'ships (boore, old geometry)',
    law: 'boore2014' as ContourLaw,
    geometry: false,
    tw: false,
  },
  { key: 'boore + Thompson-Worden', law: 'boore2014' as ContourLaw, geometry: false, tw: true },
  { key: 'CB14 + geometry', law: 'campbellBozorgnia2014' as ContourLaw, geometry: true, tw: false },
  { key: 'allen + geometry', law: 'allen2012Hypocentral' as ContourLaw, geometry: true, tw: false },
] as const;
type Arm = (typeof ARMS)[number];
const GEOMETRY = { stadiumWidth: 'surfaceProjection', extendedSource: 'always' } as const;
const FIRST = ARMS[0];
const THRESHOLDS = [7, 8, 9] as const;

function inputFor(
  arm: Arm,
  e: {
    magnitude: number;
    depthKm: number;
    faultType: 'all' | 'reverse' | 'normal' | 'strike-slip';
    latitude: number;
    longitude: number;
  },
  vs30?: number
): Parameters<typeof simulateEarthquake>[0] {
  const base = {
    magnitude: e.magnitude,
    depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
    faultType: e.faultType,
    contourLaw: arm.law,
    ...(vs30 === undefined ? {} : { vs30 }),
    ...('tw' in arm && arm.tw ? { pointSourceDistance: 'thompsonWorden2018' as const } : {}),
    ...(arm.geometry ? GEOMETRY : {}),
  };
  if (!arm.geometry) return base;
  const first = simulateEarthquake(base);
  const dip = shippedDipAnswer(
    e.latitude,
    e.longitude,
    (first.inputs.depth as number | undefined) ?? 10_000,
    first.ruptureLength
  );
  return dip === null ? base : { ...base, dipDeg: dip.dipDeg };
}

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
  const peaks = new Map<string, Pair[]>();
  for (const arm of ARMS) peaks.set(arm.key, []);
  for (const e of jury) {
    const vs30 = atlasGround(e);
    for (const arm of ARMS) {
      const r = simulateEarthquake(inputFor(arm, e, vs30));
      peaks.get(arm.key)?.push({
        id: e.comcat,
        modelPeakMmi: r.shaking.mmiAtEpicenter,
        recordPeakMmi: e.maxMmi,
      });
    }
  }

  console.log(`### rule 475(a) — the peak, on all ${shape.events.toString()}`);
  console.log('| law | events | mean bias | sd | within 1 degree | worst |');
  console.log('| --- | --- | --- | --- | --- | --- |');
  for (const arm of ARMS) {
    const r = readPeaks(peaks.get(arm.key) ?? []);
    console.log(
      `| ${arm.key} | ${r.events.toString()} | ${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)} | ` +
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
  console.log(`| band | n | ${ARMS.map((a) => a.key).join(' | ')} |`);
  console.log(`| --- | --- | ${ARMS.map(() => '---').join(' | ')} |`);
  for (const b of bands) {
    const cols = ARMS.map((arm) => {
      const r = readPeaks(
        (peaks.get(arm.key) ?? []).filter((p) => p.recordPeakMmi >= b.lo && p.recordPeakMmi < b.hi)
      );
      return r.events === 0 ? '—' : `${r.meanBias >= 0 ? '+' : ''}${r.meanBias.toFixed(2)}`;
    });
    const n = (peaks.get(FIRST.key) ?? []).filter(
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
  const areas = new Map<string, Band[]>();
  for (const arm of ARMS) areas.set(arm.key, []);
  for (const e of widerJury()) {
    const cell = magnitudeCell(e.magnitude);
    for (const arm of ARMS) {
      const r = simulateEarthquake(inputFor(arm, e));
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
  console.log('\n### rule 475(b) — the areas, on the 116 where an area exists');
  console.log(`| law | mean | scatter | ${cells.join(' | ')} |`);
  console.log(`| --- | --- | --- | ${cells.map(() => '---').join(' | ')} |`);
  for (const arm of ARMS) {
    const s = score(areas.get(arm.key) ?? []);
    const cb = biasByCell(areas.get(arm.key) ?? []);
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

  console.log('\n### rule 476 — the verdict');
  const basePeak = readPeaks(peaks.get(FIRST.key) ?? []);
  const baseCells = biasByCell(areas.get(FIRST.key) ?? []);
  const baseArea = score(areas.get(FIRST.key) ?? []);
  for (const arm of ARMS) {
    if (arm.key === FIRST.key) continue;
    const peak = readPeaks(peaks.get(arm.key) ?? []);
    const cb = biasByCell(areas.get(arm.key) ?? []);
    const s = score(areas.get(arm.key) ?? []);
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
      `  ${arm.key.padEnd(28)} peak ${peakOk ? 'PASS' : 'fail'} ` +
        `(${peak.meanBias >= 0 ? '+' : ''}${peak.meanBias.toFixed(2)} vs ${basePeak.meanBias >= 0 ? '+' : ''}${basePeak.meanBias.toFixed(2)}, ` +
        `sd ${peak.sdBias.toFixed(2)} vs ${basePeak.sdBias.toFixed(2)}) · areas ` +
        `${areaOk ? 'PASS' : `fail${worsened.length === 0 ? ' (overall)' : ` (${worsened.join(', ')})`}`} → ` +
        (peakOk && areaOk ? 'DISPLACES' : 'refused')
    );
  }
}

main();
