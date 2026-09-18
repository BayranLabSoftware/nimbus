import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import {
  modifiedMercalliIntensity,
  mmiFromPgaEuropean,
} from '../../src/physics/events/earthquake/intensity.js';
import { peakGroundAcceleration } from '../../src/physics/events/earthquake/attenuation.js';
import { ATLAS_EARTHQUAKES } from '../../src/physics/validation/atlasSetData.js';
import { ATLAS_SITES } from '../../src/physics/validation/atlasSiteData.js';
import { atlasGround } from '../../src/physics/validation/atlasRun.js';
import { isInterfaceEvent } from '../../src/physics/validation/interfaceRules.js';
import {
  readPeakIntensities,
  type PeakIntensityPair,
} from '../../src/physics/validation/epicentralIntensityRules.js';
import { m } from '../../src/physics/units.js';

/**
 * Rule 195 of validation/epicentralIntensityRules.ts: the model's strongest
 * shaking against the ShakeMap's, on the 1 101 events of the atlas set.
 *
 *   pnpm exec tsx scripts/benchmark/peak-intensity.ts [out.json]
 *
 * The law in place until 18 September 2026 — Joyner & Boore 1981 at distance
 * zero, no site term and no depth — is computed here rather than kept alive in
 * the model, so the comparison is explicit and the product carries one law.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Row extends PeakIntensityPair {
  inPlaceMmi: number;
  interface: boolean;
  deep: boolean;
  /** The ground under the epicentre, from the site the atlas read there. */
  elevationM: number | undefined;
}

const SITE_ELEVATION = new Map(ATLAS_SITES.map((site) => [site.key, site.elevationM]));

const rows: Row[] = [];
for (const quake of ATLAS_EARTHQUAKES) {
  if (!(quake.maxMmi > 0)) continue;
  const vs30 = atlasGround(quake);
  const result = simulateEarthquake({
    magnitude: quake.magnitude,
    depth: m(quake.depthKm * 1_000),
    faultType: quake.faultType,
    ...(vs30 === undefined ? {} : { vs30 }),
    ...(isInterfaceEvent(quake) ? { subductionInterface: true } : {}),
  });
  rows.push({
    comcat: quake.comcat,
    magnitude: quake.magnitude,
    depthKm: quake.depthKm,
    mapMmi: quake.maxMmi,
    modelMmi: result.shaking.mmiAtEpicenter,
    inPlaceMmi: modifiedMercalliIntensity(
      peakGroundAcceleration({ magnitude: quake.magnitude, distance: m(0) })
    ),
    interface: isInterfaceEvent(quake),
    deep: quake.depthKm > 70,
    elevationM: SITE_ELEVATION.get(quake.comcat),
  });
}

const candidate = readPeakIntensities(rows);
const inPlace = readPeakIntensities(rows.map((r) => ({ ...r, modelMmi: r.inPlaceMmi })));

/** The same reading over a subset, so the round can say where it moved. */
const on = (label: string, keep: (r: Row) => boolean) => {
  const subset = rows.filter(keep);
  return {
    label,
    events: subset.length,
    inPlace: readPeakIntensities(subset.map((r) => ({ ...r, modelMmi: r.inPlaceMmi }))),
    candidate: readPeakIntensities(subset),
  };
};

const out = {
  rule: '192-196',
  what: 'the model’s peak intensity against the ShakeMap’s, atlas set',
  events: rows.length,
  inPlace,
  candidate,
  bySubset: [
    on('crustal, not interface', (r) => !r.interface && !r.deep),
    on('interface', (r) => r.interface),
    on('deeper than 70 km', (r) => r.deep),
    on('Mw ≥ 7.5', (r) => r.magnitude >= 7.5),
    on('Mw < 6.5', (r) => r.magnitude < 6.5),
    // Found after the reading, and therefore a diagnostic and not a score
    // (see the note in the round's outcome): a ShakeMap's peak intensity for
    // an epicentre in open water is at the nearest land, while the model's is
    // at the epicentre, so those rows compare two different places.
    on('epicentre on land', (r) => (r.elevationM ?? -1) > 0),
    on('epicentre at sea', (r) => (r.elevationM ?? -1) <= 0),
  ],
  // The European row moves with it; printed so the report can say so.
  europeExample: mmiFromPgaEuropean(peakGroundAcceleration({ magnitude: 7, distance: m(0) })),
  rows: rows.map((r) => [r.comcat, r.magnitude, r.depthKm, r.mapMmi, r.modelMmi, r.inPlaceMmi]),
};

const target =
  process.argv[2] ?? join(ROOT, 'benchmark', 'results', 'peak-intensity-2026-09-18.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(out, null, 1)}\n`);

const show = (
  label: string,
  r: { events: number; meanDifference: number; sigma: number; withinOne: number }
) =>
  console.log(
    `${label.padEnd(26)} n=${String(r.events).padStart(5)}  mean ${r.meanDifference >= 0 ? '+' : ''}${r.meanDifference.toFixed(
      2
    )}  σ ${r.sigma.toFixed(2)}  within 1 ${(100 * r.withinOne).toFixed(1)} %`
  );

show('in place (JB81 at zero)', inPlace);
show('candidate (ring law)', candidate);
console.log();
for (const s of out.bySubset) {
  show(`${s.label} — in place`, s.inPlace);
  show(`${s.label} — candidate`, s.candidate);
  console.log();
}
console.log(`wrote ${target}`);
