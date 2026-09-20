import {
  EARTHQUAKE_PRESETS,
  intensityLawOf,
  simulateEarthquake,
  type ContourLaw,
  type EarthquakeScenarioInput,
} from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import type { Meters } from '../src/physics/units.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import type { AtlasEarthquake } from '../src/physics/validation/atlasRules.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { SHAKEMAP_FOOTPRINTS } from '../src/physics/validation/shakemapFixtures.js';
import { NET_SITES } from '../src/physics/validation/siteVs30Data.js';
import { countMagnitudeInversions } from '../src/physics/validation/propertyPrecedenceRules.js';
import { widerJury, WIDER_JURY_COUNTS } from '../src/physics/validation/widerFootprintRules.js';

/**
 * The round of rules 405 to 411: both contour laws, measured on a jury of
 * 116 ShakeMaps instead of six.
 *
 * Nothing here chooses anything. It measures, prints, and leaves the
 * verdict to be read off rule 409's clauses — which is the point of
 * having written them first.
 *
 * Usage:
 *   pnpm exec tsx scripts/wider-footprint-round.ts
 */

const LAWS: readonly ContourLaw[] = ['boore2014', 'campbellBozorgnia2014'];
const THRESHOLDS = [7, 8, 9] as const;
type Threshold = (typeof THRESHOLDS)[number];

interface Band {
  event: string;
  threshold: Threshold;
  observedKm2: number;
  modelKm2: number;
}

/**
 * Rule 406: the scenario the PRODUCT would build for this ComCat row.
 *
 * No preset, no hand-set strike, no mechanism filled in where the
 * catalogue does not know one. `faultType` goes in exactly as the atlas
 * holds it, which for 80 of the 116 is `all` — unknown — and the
 * simulator handles that the way it handles it for a user who clicks a
 * spot on the globe and types a magnitude.
 */
function scenarioFor(event: AtlasEarthquake, law: ContourLaw): EarthquakeScenarioInput {
  return {
    magnitude: event.magnitude,
    depth: (Math.max(0, event.depthKm) * 1_000) as Meters,
    faultType: event.faultType,
    contourLaw: law,
  };
}

/** Rule 407: the ground the field covers, not the area of a ring. */
function fieldAreasKm2(
  input: EarthquakeScenarioInput,
  latitude: number,
  longitude: number,
  site: ReturnType<typeof shippedSiteLookup>
): Record<Threshold, number> | null {
  const result = simulateEarthquake(input);
  const law = intensityLawOf(result);
  if (law === null) return null;

  // The strike the globe would use: the reader's if the scenario carries
  // one, otherwise the lookup's — `shippedStrikeAnswer`, same call, same
  // arguments as `scripts/render-shaking-map.ts` makes.
  const answer = shippedStrikeAnswer(
    latitude,
    longitude,
    (result.inputs.depth as number | undefined) ?? 10_000,
    result.ruptureLength
  );
  const rupture: RuptureFootprint = {
    latitude,
    longitude,
    strikeDeg: result.inputs.strikeAzimuthDeg ?? answer.strikeDeg ?? 0,
    halfLengthM: result.isExtendedSource ? (result.ruptureLength as number) / 2 : 0,
    halfWidthM: result.isExtendedSource ? (result.ruptureWidth as number) / 2 : 0,
  };
  const { field } = fitShakingField({
    rupture,
    intensityAt: law,
    siteAt: (lat, lon) =>
      site === null
        ? { vs30: 760, provenance: 'rock' as const }
        : { vs30: site(lat, lon).vs30, provenance: 'grid' as const },
  });
  const out = {} as Record<Threshold, number>;
  for (const t of THRESHOLDS) out[t] = areaAbove(field, t) / 1e6;
  return out;
}

/**
 * The statistic the three published rounds reported, reproduced exactly so
 * that this round's numbers can be set beside theirs.
 *
 * It is the geometric mean of the AREA ratio — not the radius ratio that
 * `footprintBias` returns — with the SAMPLE standard deviation (n − 1) of
 * its logarithm. Checked against the Z_tor round's published figures on the
 * six fixtures BEFORE the wider jury was read once, and it reproduces the
 * published figures to every digit they were printed with: 0.733x with
 * 1.336 against a published 0.73x/1.34, and 0.918x with 1.529 against a
 * published 0.92x/1.53. The per-band areas agree exactly too — Northridge's
 * MMI VIII at 79 km² for the shipped law and 92 for the candidate against a
 * record of 823, L'Aquila at 2.83x and 6.42x, Amatrice at 5.10x and 11.30x.
 * The one figure that moves is the combined error of the shipped law, 1.372
 * here against a published 1.376, because that note squared the ROUNDED
 * 0.73 and 1.34 rather than the values behind them.
 */
function score(bands: readonly Band[]): {
  bands: number;
  bias: number;
  sdLn: number;
  combined: number;
} {
  const logs = bands
    .filter((b) => b.observedKm2 > 0 && b.modelKm2 > 0)
    .map((b) => Math.log(b.modelKm2 / b.observedKm2));
  if (logs.length < 2) return { bands: logs.length, bias: 1, sdLn: 0, combined: 0 };
  const mean = logs.reduce((a, b) => a + b, 0) / logs.length;
  const sdLn = Math.sqrt(logs.reduce((a, b) => a + (b - mean) ** 2, 0) / (logs.length - 1));
  return {
    bands: logs.length,
    bias: Math.exp(mean),
    sdLn,
    // The two errors as one number, as the Z_tor round reported it:
    // sqrt(ln(bias)^2 + scatter^2), both in ln area.
    combined: Math.sqrt(mean ** 2 + sdLn ** 2),
  };
}

/** Rule 408's other two counts. */
function lostAndInvented(bands: readonly Band[]): { lost: Band[]; invented: Band[] } {
  return {
    lost: bands.filter((b) => b.observedKm2 > 0 && !(b.modelKm2 > 0)),
    invented: bands.filter((b) => !(b.observedKm2 > 0) && b.modelKm2 > 0),
  };
}

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent; rule 406 asks for the ground the browser');
    console.error('reads, so this round cannot be run on rock. Build public/data/vs30 first.');
    process.exit(1);
  }
  // A dry run on the six alone, which have been read three times already:
  // it checks that this script reproduces the published 0.73x / 1.34 before
  // the wider jury is looked at even once. Rule 411 wants ONE run on the
  // wider set, so the machinery gets proved on spent evidence first.
  const sixOnly = process.argv.includes('--six');
  const jury = sixOnly ? [] : widerJury();
  console.log(
    `rule 405: ${jury.length.toString()} earthquakes (pinned ${WIDER_JURY_COUNTS.events.toString()})`
  );

  const wide = new Map<ContourLaw, Band[]>();
  const six = new Map<ContourLaw, Band[]>();
  for (const law of LAWS) {
    wide.set(law, []);
    six.set(law, []);
  }

  // --- the wider jury -----------------------------------------------------
  let done = 0;
  for (const event of jury) {
    for (const law of LAWS) {
      const areas = fieldAreasKm2(scenarioFor(event, law), event.latitude, event.longitude, site);
      if (areas === null) {
        console.error(`  ${event.comcat}: no intensity law under ${law}`);
        continue;
      }
      for (const t of THRESHOLDS) {
        wide.get(law)?.push({
          event: event.comcat,
          threshold: t,
          observedKm2: event.areaKm2[t],
          modelKm2: areas[t],
        });
      }
    }
    done += 1;
    if (done % 20 === 0) console.log(`  … ${done.toString()} of ${jury.length.toString()}`);
  }

  // --- the six, rule 410, measured the same way in the same run -----------
  for (const f of SHAKEMAP_FOOTPRINTS) {
    const preset = EARTHQUAKE_PRESETS[f.preset as keyof typeof EARTHQUAKE_PRESETS];
    // The epicentre from the one place the repository already keeps it for
    // these events — the net's own sites, which `modelAreaKm2` reads to give
    // each fixture its ground. Not a second copy written out here.
    const spot = NET_SITES.find((s) => s.key === (NET_ROW_NAME[f.name] ?? f.name));
    if (spot === undefined) {
      console.error(`  ${f.name}: no site in siteVs30Data.ts`);
      continue;
    }
    for (const law of LAWS) {
      const areas = fieldAreasKm2(
        { ...preset.input, contourLaw: law },
        spot.latitude,
        spot.longitude,
        site
      );
      if (areas === null) continue;
      for (const t of THRESHOLDS) {
        six.get(law)?.push({
          event: f.name,
          threshold: t,
          observedKm2: f.areaKm2[t],
          modelKm2: areas[t],
        });
      }
    }
  }

  // --- what the run says --------------------------------------------------
  const report = (title: string, by: Map<ContourLaw, Band[]>): void => {
    console.log(`\n### ${title}`);
    console.log('| law | bands | geometric mean | scatter (ln) | combined | lost | invented |');
    console.log('| --- | ----- | -------------- | ------------ | -------- | ---- | -------- |');
    for (const law of LAWS) {
      const bands = by.get(law) ?? [];
      const s = score(bands);
      const { lost, invented } = lostAndInvented(bands);
      console.log(
        `| ${law} | ${s.bands.toString()} | ${s.bias.toFixed(3)}x | ${s.sdLn.toFixed(3)} | ` +
          `${s.combined.toFixed(3)} | ${lost.length.toString()} | ${invented.length.toString()} |`
      );
    }
    if (process.argv.includes('--bands')) {
      for (const law of LAWS) {
        for (const b of by.get(law) ?? []) {
          console.log(
            `    ${law} ${b.event} MMI${b.threshold.toString()} model ${b.modelKm2.toFixed(0)} record ${b.observedKm2.toFixed(0)}` +
              (b.observedKm2 > 0 && b.modelKm2 > 0
                ? ` ratio ${(b.modelKm2 / b.observedKm2).toFixed(2)}x`
                : '')
          );
        }
      }
    }
    for (const law of LAWS) {
      const { lost } = lostAndInvented(by.get(law) ?? []);
      if (lost.length > 0 && lost.length <= 12) {
        console.log(
          `  ${law} loses: ${lost.map((b) => `${b.event} MMI${b.threshold.toString()}`).join(', ')}`
        );
      }
    }
  };

  if (!sixOnly) report(`the wider jury — ${jury.length.toString()} events, rules 405 to 409`, wide);
  report('the six fixtures, rule 410', six);

  // Rule 409's last two clauses are properties of the LAW and not of the
  // jury, so they read the same whichever set is in front of them. They are
  // measured here anyway, in the same run, rather than carried over on the
  // word of the round that measured them last.
  const mmi7RadiusM = (magnitude: number): number =>
    simulateEarthquake({ magnitude, contourLaw: 'campbellBozorgnia2014' }).shaking.mmi7Radius || 0;
  const mono = countMagnitudeInversions(mmi7RadiusM);
  const epicentral = (magnitude: number, depthKm: number): number => {
    const r = simulateEarthquake({
      magnitude,
      depth: (depthKm * 1_000) as Meters,
      contourLaw: 'campbellBozorgnia2014',
    });
    const law = intensityLawOf(r);
    return law === null ? Number.NaN : law(0, 760);
  };
  console.log('\n### rule 409, the clauses that are properties of the law');
  console.log(
    `  monotonicity in magnitude: ${mono.inversions.toString()} inversions ` +
      `(worst drop ${mono.worstDropKm.toFixed(1)} km) → ${mono.inversions === 0 ? 'PASS' : 'FAIL'}`
  );
  for (const mw of [5.5, 6.5, 7.5]) {
    const drop = epicentral(mw, 5) - epicentral(mw, 50);
    console.log(
      `  depth, Mw ${mw.toFixed(1)}: MMI falls ${drop.toFixed(2)} between 5 km and 50 km → ` +
        (drop >= 1 ? 'PASS' : 'FAIL')
    );
  }

  // Rule 409's first two clauses, read off the wider jury.
  const a = score(wide.get('boore2014') ?? []);
  const b = score(wide.get('campbellBozorgnia2014') ?? []);
  const lostA = lostAndInvented(wide.get('boore2014') ?? []).lost;
  const lostB = lostAndInvented(wide.get('campbellBozorgnia2014') ?? []).lost;
  const lostKeys = new Set(lostB.map((x) => `${x.event}/${x.threshold.toString()}`));
  const newlyLost =
    lostA.length - lostA.filter((x) => lostKeys.has(`${x.event}/${x.threshold.toString()}`)).length;
  console.log('\n### rule 409, clause by clause, on the wider jury');
  console.log(
    `  centred:  |ln bias| ${Math.abs(Math.log(b.bias)).toFixed(3)} against ${Math.abs(Math.log(a.bias)).toFixed(3)} → ` +
      (Math.abs(Math.log(b.bias)) <= Math.abs(Math.log(a.bias)) ? 'PASS' : 'FAIL')
  );
  console.log(
    `  scatter:  ${b.sdLn.toFixed(3)} against ${a.sdLn.toFixed(3)} → ${b.sdLn <= a.sdLn ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `  no band lost that the shipped law draws: ${lostB.length.toString()} lost by the candidate, ` +
      `${lostA.length.toString()} by the shipped law (${newlyLost.toString()} the candidate keeps)`
  );
}

/** The net's name for an anchor, where the fixture's is shorter — the
 *  same two rows `shakemapFootprint.ts` has to translate. */
const NET_ROW_NAME: Readonly<Record<string, string>> = {
  'Gorkha 2015': 'Gorkha (Nepal) 2015',
  'Kokoxili 2001': 'Kokoxili (Kunlun) 2001',
};

main();
