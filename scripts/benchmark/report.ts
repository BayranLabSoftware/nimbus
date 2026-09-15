import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { QuantityStats } from './stats.js';

/**
 * Writes docs/BENCHMARK_REPORT.md from benchmark/results/*.json and the
 * findings below. The numbers come from the results; the words around
 * them are the campaign's reading of those numbers, written after the
 * comparisons ran and marked as such.
 *
 *   pnpm exec tsx scripts/benchmark/report.ts
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RESULTS = join(ROOT, 'benchmark', 'results');

interface TrackFile {
  track: string;
  reference: string;
  stats: QuantityStats[];
  [key: string]: unknown;
}

const read = (name: string): unknown => {
  const file = join(RESULTS, `${name}.json`);
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as unknown) : null;
};

const f = (x: number | null | undefined, digits = 2): string =>
  x === null || x === undefined || !Number.isFinite(x) ? '—' : x.toFixed(digits);
const pct = (x: number | null | undefined): string =>
  x === null || x === undefined ? '—' : `${Math.round(x * 100).toString()} %`;
const factor = (medianAbsLn: number | null): string =>
  medianAbsLn === null ? '—' : `×${Math.exp(medianAbsLn).toFixed(2)}`;
const cell = (s: string): string => s.replace(/\|/g, '\\|');

/** The scorecard of a track: one row a quantity, all cases. */
export function scorecard(file: TrackFile, labels: Record<string, string>): string {
  const order = Object.keys(labels);
  const rank = (q: string): number => {
    const i = order.indexOf(q);
    return i < 0 ? order.length : i;
  };
  const rows = file.stats
    .filter((s) => s.subset === 'all')
    .sort((a, b) => rank(a.quantity) - rank(b.quantity));
  const lines = [
    '| Quantity | Class | Pairs | Geometric mean N/R | σ ln | Median factor | Within tolerance (A) | Within ×1.25 | Within ×2 | Within ×10 | Review |',
    '| --- | :-: | --: | --: | --: | --: | --: | --: | --: | --: | :-: |',
  ];
  for (const s of rows) {
    const label = labels[s.quantity] ?? s.quantity;
    if (s.agreement !== null) {
      lines.push(
        `| ${cell(label)} | ${s.cls} | ${s.rows.toString()} | agreement ${pct(s.agreement)} | | | | | | | ${s.flagged ? 'flag' : ''} |`
      );
      continue;
    }
    const apart = Object.values(s.unpaired).reduce((a, b) => a + b, 0) + s.bothZero;
    lines.push(
      `| ${cell(label)} | ${s.cls} | ${s.pairs.toString()}${apart > 0 ? ` (+${apart.toString()} apart)` : ''} | ${f(s.geometricMeanRatio, 3)} | ${f(s.scatterLn)} | ${factor(s.medianAbsLn)} | ${s.cls === 'A' ? pct(s.withinTolerance) : ''} | ${pct(s.within125)} | ${pct(s.within2)} | ${pct(s.within10)} | ${s.flagged ? 'flag' : ''} |`
    );
  }
  return lines.join('\n');
}

/** Geometric mean ratio by bin (a distance, a threshold) for some quantities. */
export function binTable(
  file: TrackFile,
  quantities: readonly string[],
  labels: Record<string, string>
): string {
  const found = [
    ...new Set(
      file.stats
        .filter((s) => quantities.includes(s.quantity) && s.subset.startsWith('bin: '))
        .map((s) => s.subset.slice(5))
    ),
  ];
  // Distances in order of distance; thresholds and labels as they came.
  const km = (b: string): number => (/^[\d.]+ km$/.test(b) ? Number.parseFloat(b) : Number.NaN);
  const bins = found.every((b) => Number.isFinite(km(b)))
    ? [...found].sort((a, b) => km(a) - km(b))
    : found;
  const lines = [
    `| Quantity | ${bins.map(cell).join(' | ')} |`,
    `| --- | ${bins.map(() => '--:').join(' | ')} |`,
  ];
  for (const q of quantities) {
    const values = bins.map((b) => {
      const s = file.stats.find((x) => x.quantity === q && x.subset === `bin: ${b}`);
      return s === undefined ? '' : `${f(s.geometricMeanRatio, 2)} (${s.pairs.toString()})`;
    });
    lines.push(`| ${cell(labels[q] ?? q)} | ${values.join(' | ')} |`);
  }
  return lines.join('\n');
}

/** Presets against custom cases, and size bands, for the quantities asked. */
export function subsetTable(
  file: TrackFile,
  quantities: readonly string[],
  labels: Record<string, string>
): string {
  const subsets = [
    ...new Set(
      file.stats
        .filter(
          (s) =>
            quantities.includes(s.quantity) && s.subset !== 'all' && !s.subset.startsWith('bin: ')
        )
        .map((s) => s.subset)
    ),
  ];
  const lines = [
    `| Quantity | ${subsets.map((s) => cell(s.replace('band: ', ''))).join(' | ')} |`,
    `| --- | ${subsets.map(() => '--:').join(' | ')} |`,
  ];
  for (const q of quantities) {
    const values = subsets.map((sub) => {
      const s = file.stats.find((x) => x.quantity === q && x.subset === sub);
      if (s === undefined) return '';
      return s.agreement !== null
        ? `${pct(s.agreement)} (${s.rows.toString()})`
        : `${f(s.geometricMeanRatio, 2)} (${s.pairs.toString()})`;
    });
    lines.push(`| ${cell(labels[q] ?? q)} | ${values.join(' | ')} |`);
  }
  return lines.join('\n');
}

export const get = (
  file: TrackFile | null,
  quantity: string,
  subset = 'all'
): QuantityStats | undefined =>
  file?.stats.find((s) => s.quantity === quantity && s.subset === subset);

export { f, pct, factor, read, RESULTS, ROOT, writeFileSync };

// ---------------------------------------------------------------------------
// The report.

interface InvFile {
  scenariosPerHazard: Record<string, number>;
  watchdogMs: number;
  failures: Record<
    string,
    Record<string, { count: number; examples: { input: unknown; detail: string }[] }>
  >;
}

interface UiFile {
  base: string;
  presets: {
    type: string;
    preset: string;
    site: { lat: number; lon: number };
    launched: boolean;
    numbersCompared: number;
    numbersDifferingCount: number;
    numbersDiffering: { path: string; browser: number | string; node: number | string }[];
    browserOnly: number;
    displayedChecked: number;
    displayedFailures: { label: string; text: string; node: number }[];
    displayedMissing: string[];
    error?: string;
  }[];
}

const LABELS: Record<string, string> = {
  // IMP
  referenceAnswered: 'The program answered the case',
  energy: 'Kinetic energy',
  breakupAltitude: 'Breakup altitude',
  airburstOutcome: 'Airburst or ground impact',
  burstAltitude: 'Airburst altitude',
  groundVelocity: 'Speed at the ground',
  groundEnergy: 'Energy at the ground',
  transientDiameter: 'Transient crater diameter',
  finalDiameter: 'Final crater diameter',
  finalDepth: 'Final crater depth',
  fireballRadius: 'Fireball radius',
  fireballVisibleRadius: 'Fireball visible to',
  clothingIgnitionRadius: 'Clothing-ignition radius (at the program’s fluence)',
  overpressureAtDistanceGround: 'Overpressure at a distance, ground impacts',
  overpressureAtDistanceAirburst: 'Overpressure at a distance, airbursts',
  airblastRadiusGround: 'Air-blast radius, ground impacts (20, 5 kPa)',
  airblastRadiusGroundAsLabelled: 'Air-blast radius, ground impacts, as the page labels them',
  airblastRadiusAirburst: 'Air-blast radius, airbursts (20, 5, 1 kPa)',
  ejectaEdge: 'Ejecta blanket edge (0.01–100 m)',
  transientDiameterSeafloor: 'Transient crater, water target',
  finalDiameterSeafloor: 'Final crater, water target',
  finalDepthSeafloor: 'Crater depth, water target',
  waterCavityDiameter: 'Crater in the water',
  tsunamiAmplitudeAtRadius: 'Impact tsunami amplitude at the program’s radii',
  // NUC
  blastRingAsDrawn: '5 and 1 psi rings',
  blastRadiusAtNukemapThreshold: '20 psi radius (at NUKEMAP’s threshold)',
  burnRingAsDrawn: 'Burn rings (Nimbus 8/5/2 cal/cm² against NUKEMAP’s)',
  burnRadiusAtNukemapFluence: 'Burn radii at NUKEMAP’s fluences',
  radiationRingNearestDose: 'Initial radiation (nearest dose)',
  craterRadiusVsInside: 'Crater radius against NUKEMAP’s inside radius',
  craterRadiusVsLip: 'Crater radius against NUKEMAP’s lip radius',
  fourmilabOverpressureSurface: 'Fourmilab overpressure, surface burst',
  fourmilabWindSurface: 'Fourmilab wind, surface burst',
  fourmilabOverpressureOptimumHeight:
    'Fourmilab overpressure, optimum height (Nimbus at the case height)',
  fourmilabWindOptimumHeight: 'Fourmilab wind, optimum height (Nimbus at the case height)',
  // CHEM
  incidentOverpressure: 'Incident overpressure at scaled distance',
  ringRadius: '5, 1 and 0.5 psi rings',
  // EQ-GM
  pgaBoore2014: 'PGA, Boore et al. 2014',
  ringBoore2014: 'MMI VII–IX rings, Boore et al. 2014',
  ringVsAbrahamson2014: 'Rings against Abrahamson et al. 2014',
  ringVsCampbellBozorgnia2014: 'Rings against Campbell & Bozorgnia 2014',
  ringVsChiouYoungs2014: 'Rings against Chiou & Youngs 2014',
  ringVsNgaWest2Ensemble: 'Rings against the NGA-West2 ensemble',
  ringVsAllen2012Finite: 'Rings against Allen et al. 2012 (finite rupture)',
  ringVsAllen2012Point: 'Rings against Allen et al. 2012 (hypocentral)',
  pgaReportedVsNgaWest2Ensemble: 'PGA the panel prints (20, 100 km) against the ensemble',
  ringVsAbrahamson2016Interface: 'Interface presets against Abrahamson et al. 2016',
  ringVsParker2020Interface: 'Interface presets against Parker et al. 2020',
  // EQ-PAGER
  exposureMmi7Plus: 'People at MMI VII and above',
  exposureMmi8Plus: 'People at MMI VIII and above',
  exposureMmi9Plus: 'People at MMI IX and above',
  centralToll: 'Central toll',
  fatalityAlert: 'Fatality alert level',
  // TSU
  maxAmplitudeGaussian: 'Largest crest, Gaussian humps',
  arrivalTimeGaussian: 'Arrival, Gaussian humps',
  maxAmplitudeMegathrustUplift: 'Largest crest, megathrust (Nimbus’s uplift in GeoClaw)',
  maxAmplitudeMegathrustOkada: 'Largest crest, megathrust (Okada deformation in GeoClaw)',
  arrivalTimeMegathrust: 'Arrival, megathrusts',
  // VOL
  massLoadingDownwind: 'Tephra loading on the wind axis',
  massLoadingCrosswind: 'Tephra loading off the axis (50 km downwind)',
  isopach1mmReach: '1 mm isopach reach downwind',
  // LAND
  firstCrestAmplitudeAtBandCentre: 'Source amplitude against Heller’s first crest (band centre)',
  insideHellerBand: 'Inside Heller’s band over his Froude range',
};

function track(name: string): TrackFile | null {
  return read(name) as TrackFile | null;
}

function invSection(inv: InvFile | null): string {
  if (inv === null) return '_The invariant sweep did not run._';
  const lines: string[] = [];
  for (const [hazard, tallies] of Object.entries(inv.failures)) {
    const n = inv.scenariosPerHazard[hazard] ?? 0;
    const entries = Object.entries(tallies).sort((a, b) => b[1].count - a[1].count);
    const total = entries.reduce((s, [, t]) => s + t.count, 0);
    lines.push(
      `**${hazard}** — ${n.toLocaleString('en-US')} scenarios, ${total.toLocaleString('en-US')} failures.`
    );
    if (entries.length === 0) {
      lines.push('');
      continue;
    }
    lines.push('', '| Invariant and output | Scenarios | Example |', '| --- | --: | --- |');
    for (const [key, t] of entries) {
      const ex = t.examples[0];
      lines.push(
        `| ${cell(key)} | ${t.count.toLocaleString('en-US')} | ${cell(ex?.detail ?? '')} |`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

function uiSection(ui: UiFile | null): string {
  if (ui === null) return '_The UI sweep did not run._';
  const lines = [
    '| Hazard | Preset | Site | Launched | Numbers compared | Differing | Panel values checked | Off | Note |',
    '| --- | --- | --- | :-: | --: | --: | --: | --: | --- |',
  ];
  for (const p of ui.presets) {
    const note = [
      p.error === undefined ? '' : `error: ${p.error}`,
      p.displayedMissing.length > 0 ? `not printed: ${p.displayedMissing.join(', ')}` : '',
      p.numbersDiffering.length > 0
        ? `differ: ${p.numbersDiffering
            .slice(0, 3)
            .map((d) => `${d.path} ${String(d.browser)} vs ${String(d.node)}`)
            .join('; ')}`
        : '',
      p.displayedFailures.length > 0
        ? `off: ${p.displayedFailures.map((d) => `${d.label} “${d.text}” vs ${d.node.toPrecision(6)}`).join('; ')}`
        : '',
    ]
      .filter((x) => x !== '')
      .join(' · ');
    lines.push(
      `| ${p.type} | ${p.preset} | ${p.site.lat.toString()}, ${p.site.lon.toString()} | ${p.launched ? 'yes' : 'no'} | ${p.numbersCompared.toString()} | ${p.numbersDifferingCount.toString()} | ${p.displayedChecked.toString()} | ${p.displayedFailures.length.toString()} | ${cell(note)} |`
    );
  }
  return lines.join('\n');
}

export function main(): void {
  const imp = track('impact');
  const nuc = track('nuclear');
  const chem = track('chemical');
  const eq = track('earthquake');
  const pager = track('pager');
  const tsu = track('tsunami');
  const vol = track('volcano');
  const land = track('landslide');
  const inv = read('invariants') as InvFile | null;
  const ui = read('ui') as UiFile | null;
  const body = REPORT({ imp, nuc, chem, eq, pager, tsu, vol, land, inv, ui });
  writeFileSync(join(ROOT, 'docs', 'BENCHMARK_REPORT.md'), body);
  console.log('wrote docs/BENCHMARK_REPORT.md');
}

interface Data {
  imp: TrackFile | null;
  nuc: TrackFile | null;
  chem: TrackFile | null;
  eq: TrackFile | null;
  pager: TrackFile | null;
  tsu: TrackFile | null;
  vol: TrackFile | null;
  land: TrackFile | null;
  inv: InvFile | null;
  ui: UiFile | null;
}

const gm = (file: TrackFile | null, q: string, subset = 'all'): string =>
  f(get(file, q, subset)?.geometricMeanRatio, 2);
const med = (file: TrackFile | null, q: string, subset = 'all'): string =>
  factor(get(file, q, subset)?.medianAbsLn ?? null);
const n = (file: TrackFile | null, q: string, subset = 'all'): string =>
  (get(file, q, subset)?.pairs ?? 0).toString();
const share = (
  file: TrackFile | null,
  q: string,
  key: 'withinTolerance' | 'within125' | 'within2' | 'within10' | 'agreement',
  subset = 'all'
): string => pct(get(file, q, subset)?.[key] ?? null);

function invCount(inv: InvFile | null, hazard: string, prefix: string): number {
  const tallies = inv?.failures[hazard] ?? {};
  return Object.entries(tallies)
    .filter(([k]) => k.startsWith(prefix))
    .reduce((s, [, t]) => s + t.count, 0);
}

function REPORT(d: Data): string {
  const { imp, nuc, chem, eq, pager, tsu, vol, land, inv, ui } = d;
  const hangs = invCount(inv, 'earthquake', 'finite: the run does not return');
  const eqScenarios = inv?.scenariosPerHazard.earthquake ?? 0;
  const firestormAntipode = invCount(inv, 'impact', 'within the antipode: firestorm');
  const firestormArea = invCount(inv, 'impact', "within the Earth's surface: firestorm");
  const impactMonotone =
    inv?.failures.impact?.['monotone in size: damage.overpressure1psi']?.count ?? 0;
  const monotoneDetail =
    inv?.failures.impact?.['monotone in size: damage.overpressure1psi']?.examples[0]?.detail ?? '';
  const monotoneExample = monotoneDetail
    .split(' → ')
    .map((v) => `${(Number(v) / 1_000).toFixed(2)} km`)
    .join(' to ');
  const ashRange =
    inv?.failures.volcano?.['monotone in size: windAdvectedAshfall.downwindRange']?.count ?? 0;
  const ashArea = inv?.failures.volcano?.['monotone in size: windAdvectedAshfall.area']?.count ?? 0;
  const uiPresets = ui?.presets.length ?? 0;
  const uiLaunched = ui?.presets.filter((p) => p.launched).length ?? 0;
  const uiNumbers = ui?.presets.reduce((s, p) => s + p.numbersCompared, 0) ?? 0;
  const uiDiffer = ui?.presets.reduce((s, p) => s + p.numbersDifferingCount, 0) ?? 0;
  const uiPanel = ui?.presets.reduce((s, p) => s + p.displayedChecked, 0) ?? 0;
  const uiOff = ui?.presets.reduce((s, p) => s + p.displayedFailures.length, 0) ?? 0;
  const pagerEvents = (pager?.events as number | undefined) ?? 0;
  const eqPga = get(eq, 'pgaBoore2014');
  const tsuStatus = (tsu?.referenceStatus as string | undefined) ?? 'missing';
  const tsuRuns = (tsu?.runs as number | undefined) ?? 0;
  const landExample = (
    land?.exampleOne as { computed: { P: number; c1: number; t1: number; c2: number } } | undefined
  )?.computed;

  return `# Nimbus against the field's programs — benchmark report

Campaign of 15 September 2026, run to the protocol committed before any
reference program was asked a case (\`docs/BENCHMARK_PROTOCOL.md\`,
commit 844fb5e). The physics was frozen at \`2dfe0c3\` for the whole
campaign: nothing under \`src/\` changed between that commit and this
report, and nothing found here has been fixed yet. The numbers below are
generated by \`scripts/benchmark/report.ts\` from \`benchmark/results/\`;
the words around them are the campaign's reading of those numbers,
written after the comparisons ran.

A ratio is always **Nimbus over the reference**. Class **A** is code
verification (the reference implements the equations Nimbus cites), class
**B** the same model family with different choices, class **C** a
different model. "Median factor" is exp(median |ln ratio|): half the pairs
are within that factor. "Apart" counts pairs where one side is zero or
absent, with the reason in \`benchmark/results/\`.

## What the campaign found

**Where Nimbus reproduces the reference's own equations.** Every class A
quantity of the impact pipeline — kinetic energy, the speed and energy at
the ground, the transient and final crater diameters, the fireball and the
ejecta blanket — agrees with the Earth Impact Effects Program within its
printed rounding on every pair (three ejecta edges the program draws and
Nimbus does not are counted apart); the airburst-or-crater call
agrees on ${share(imp, 'airburstOutcome', 'agreement')} of them. Boore et
al. (2014) agrees with OpenQuake's implementation at ${eqPga?.pairs.toLocaleString('en-US') ?? '0'}
distance points to a largest relative difference of ${eqPga?.maxRelative?.toExponential(1) ?? '—'},
and the MMI VII–IX rings drawn with it fall on OpenQuake's crossings
within the 0.5 km grid they were read on (${share(eq, 'ringBoore2014', 'withinTolerance')}).

**Where the same physics is implemented with different choices.** The
chemical blast lies within ×1.25 of Kingery–Bulmash at ${share(chem, 'incidentOverpressure', 'within125')}
of the scaled distances (geometric mean ${gm(chem, 'incidentOverpressure')}), and its rings
within ×1.25 in ${share(chem, 'ringRadius', 'within125')}. The nuclear 5 and 1 psi rings sit at
${gm(nuc, 'blastRingAsDrawn')} of NUKEMAP's (all within ×1.25), the burn rings at
${gm(nuc, 'burnRingAsDrawn')}, the fireball at ${gm(nuc, 'fireballRadius')}.

**What does not hold, in order of consequence.**

1. **An earthquake of magnitude 3.2 to 3.7 never finishes.** The aftershock
   sampler draws magnitudes above the completeness cutoff and rejects those
   above Båth's ceiling; up to Mw 3.7 the ceiling is at or under the cutoff,
   and once the catalogue is to hold one aftershock the loop cannot end. ${hangs.toLocaleString('en-US')} of ${eqScenarios.toLocaleString('en-US')} random earthquakes
   hung (${pct(eqScenarios === 0 ? null : hangs / eqScenarios)}). The form accepts Mw 3–10 in steps of 0.1, and six
   of its values (3.2 to 3.7) send the simulation worker into the loop: the
   result never comes, every later run in the tab waits behind it, and a
   core stays busy until the page is reloaded. Reproducer:
   \`simulateEarthquake({ magnitude: 3.5 })\`.
2. **Airbursts carry their blast far beyond the Earth Impact Effects
   Program's.** For a burst in the air Nimbus lifts the reach of a
   surface-burst curve by up to ×15 for the thin air it starts in; the
   program, whose airblast its authors revised after Collins et al. (2017),
   draws the same airbursts' rings far smaller.
   The 1 kPa ring is ${gm(imp, 'airblastRadiusAirburst', 'bin: 1 kPa')}× the program's (geometric mean), the
   overpressure ${gm(imp, 'overpressureAtDistanceAirburst', 'bin: 100 km')}× at 100 km, and
   ${(get(imp, 'airblastRadiusAirburst')?.unpaired['reference zero'] ?? 0).toString()} of the ${(get(imp, 'airblastRadiusAirburst')?.rows ?? 0).toString()} airburst rings Nimbus draws are
   rings the program says never reach the ground. The code already calls
   the factor "an order-of-magnitude correction that no record validates";
   this is the measurement of how far it goes.
3. **The earthquake rings hold a fraction of the people PAGER counts.** On
   ${pagerEvents.toString()} earthquakes with a PAGER loss product, the people inside Nimbus's MMI VII
   footprint are ${gm(pager, 'exposureMmi7Plus')}× PAGER's at VII and above (median factor
   ${med(pager, 'exposureMmi7Plus')}), and ${gm(pager, 'exposureMmi8Plus')}× at VIII; the central toll is ${gm(pager, 'centralToll')}×,
   and the fatality alert colour agrees on ${share(pager, 'fatalityAlert', 'agreement')} of the events.
   PAGER counts on a ShakeMap built with the recordings; Nimbus on rings
   drawn from the magnitude. The gap is the ring-area gap the validation
   report measures against ShakeMaps, seen through the population.
4. **Impact fire and some rings leave the planet.** The firestorm radii of
   a large impact are not capped: ${firestormAntipode.toLocaleString('en-US')} radius and ${firestormArea.toLocaleString('en-US')} area
   values of the random impacts are beyond half the Earth's circumference
   or larger than its surface, and the Chicxulub panel prints an ignition
   area of 1,897.9 million km², 3.7 times the surface of the Earth. The panel
   caps the radii it prints (GLOBAL) but not the areas.
5. **The megathrust wave is a third of GeoClaw's on the same uplift.**
   Nimbus's published amplitude is ${gm(tsu, 'maxAmplitudeMegathrustUplift')}× the crest GeoClaw computes from
   Nimbus's own uniform uplift, gauge after gauge; against an Okada
   deformation of the same slip it is ${gm(tsu, 'maxAmplitudeMegathrustOkada')}×. The Gaussian humps
   agree better (${gm(tsu, 'maxAmplitudeGaussian')}×, closing to ${gm(tsu, 'maxAmplitudeGaussian', 'bin: 3000 km')} at 3 000 km).
6. **Complex craters are a third deeper than the program now prints.** The
   web service's depths follow 0.294·D^0.301 (km), not the 0.4·D^0.3 of
   Collins et al. (2005, Eq. 28) that Nimbus implements; every complex
   crater is ${gm(imp, 'finalDepth')}× deeper in Nimbus. The reference was revised
   after the publication Nimbus cites.
7. **Tephra falls in the right place but not in the right amount.** On the
   wind axis Nimbus's loading is ${gm(vol, 'massLoadingDownwind')}× Tephra2's with a scatter of
   σ ln = ${f(get(vol, 'massLoadingDownwind')?.scatterLn)} (${share(vol, 'massLoadingDownwind', 'within2')} within ×2); 30 km off the axis
   the Nimbus plume is far too narrow; the 1 mm isopach reach, where both
   end inside the sampled 5–500 km, agrees within ×2 in ${share(vol, 'isopach1mmReach', 'within2')}.

The discrepancy register at the end lists every finding with its
classification and a reproducer.

## Scorecard

| Track | Reference | Result in one line |
| --- | --- | --- |
| IMP | Earth Impact Effects Program (web service, queried 15 Sep 2026) | Class A exact within printed rounding except crater depth (reference revised) and breakup altitude in 2 cases; air blast of airbursts far wider |
| NUC | NUKEMAP 2.76; Fourmilab Nuclear Bomb Effects Computer | Blast rings ×${gm(nuc, 'blastRingAsDrawn')}, burns ×${gm(nuc, 'burnRingAsDrawn')}, LD50/500 rem ×${gm(nuc, 'radiationRingNearestDose', 'bin: LD50 vs 500 rem')}; crater smaller |
| CHEM | Kingery–Bulmash (Swisdak 1994 fits) | Overpressure ×${gm(chem, 'incidentOverpressure')}, rings ×${gm(chem, 'ringRadius')} |
| EQ-GM | OpenQuake Engine 3.26.2 | BSSA14 identical; rings ×${gm(eq, 'ringVsNgaWest2Ensemble')} the NGA-West2 ensemble, ×${gm(eq, 'ringVsAllen2012Point')} Allen 2012 |
| EQ-PAGER | USGS PAGER loss products | Exposure at VII+ ×${gm(pager, 'exposureMmi7Plus')}, toll ×${gm(pager, 'centralToll')}, alert agrees ${share(pager, 'fatalityAlert', 'agreement')} |
| TSU | GeoClaw 5.14.0 (${tsuStatus}, ${tsuRuns.toString()} runs) | Humps ×${gm(tsu, 'maxAmplitudeGaussian')}; megathrust ×${gm(tsu, 'maxAmplitudeMegathrustUplift')} on the same uplift |
| VOL | Tephra2 2.0 (local) | Axis loading ×${gm(vol, 'massLoadingDownwind')} (σ ln ${f(get(vol, 'massLoadingDownwind')?.scatterLn)}); isopach reach ×${gm(vol, 'isopach1mmReach')} |
| LAND | Heller, Hager & Minor 2009 | Inside the band of Heller's Froude range in ${share(land, 'insideHellerBand', 'agreement')}; ×${gm(land, 'firstCrestAmplitudeAtBandCentre')} at its centre |
| INV | Invariants on 5 000 random scenarios a hazard | Earthquake hangs ${pct(eqScenarios === 0 ? null : hangs / eqScenarios)}; impact firestorm off the planet; ashfall not monotone |
| UI | The application against Node | ${uiLaunched.toString()} of ${uiPresets.toString()} presets launched; ${uiDiffer.toString()} of ${uiNumbers.toLocaleString('en-US')} numbers differ; ${uiOff.toString()} of ${uiPanel.toString()} printed values off |

## IMP — impacts against the Earth Impact Effects Program

Reference: Collins, Melosh & Marcus (2005) as their web service answers,
\`impact.ese.ic.ac.uk/map\`, one request at a time, ${(get(imp, 'referenceAnswered')?.rows ?? 0).toString()} cases at 8 distances
(1 552 requests; the service answered ${share(imp, 'referenceAnswered', 'agreement')} of the cases, with HTTP 500 for the
rest). Nimbus ran with the program's target densities. Class A tolerance
is 1 % plus the rounding the program printed the value with (most values
to two significant figures).

${imp === null ? '' : scorecard(imp, LABELS)}

Overpressure and air-blast radii by distance and threshold (geometric mean,
pairs in brackets):

${imp === null ? '' : binTable(imp, ['overpressureAtDistanceGround', 'overpressureAtDistanceAirburst'], LABELS)}

${imp === null ? '' : binTable(imp, ['airblastRadiusGround', 'airblastRadiusAirburst'], LABELS)}

Reading. Inside ~10 km of a ground impact Kinney & Graham saturates while
the program's fit keeps rising, which is inside the fireball and the
crater for most cases; from 300 to 3 000 km the ground-impact overpressure
is ${gm(imp, 'overpressureAtDistanceGround', 'bin: 300 km')}–${gm(imp, 'overpressureAtDistanceGround', 'bin: 3000 km')}× the program's. The ground
impacts' air-blast radii are consistently ${gm(imp, 'airblastRadiusGround')}× (σ ln ${f(get(imp, 'airblastRadiusGround')?.scatterLn)}), which is
the cube root of the half of the energy Nimbus puts in the air shock (0.5^⅓ = 0.79). The clothing-ignition radius
agrees in the median (${gm(imp, 'clothingIgnitionRadius')}×) but Nimbus's burn radius keeps growing
past the fireball's horizon for the largest impacts (10²³ J and more, up
to ×3.5), where the program lets the fireball sink below it. Seismic shaking has no common
output: the service prints intensity radii only, Nimbus the magnitude only.
The impact tsunami is compared at the program's own amplitude radii
(${n(imp, 'tsunamiAmplitudeAtRadius')} pairs, ${gm(imp, 'tsunamiAmplitudeAtRadius')}× with a scatter of σ ln ${f(get(imp, 'tsunamiAmplitudeAtRadius')?.scatterLn)}); Nimbus emits no tsunami at
${(get(imp, 'tsunamiAmplitudeAtRadius')?.unpaired['Nimbus: no tsunami source'] ?? 0).toString()} of the program's radii, those of broken bodies that bring less than half
their energy to the surface.

## NUC — nuclear explosions against NUKEMAP and the Nuclear Bomb Effects Computer

Reference: NUKEMAP 2.76, the rings its page draws for ${(get(nuc, 'fireballRadius')?.rows ?? 0).toString()} cases (its casualty
service was not used); the Fourmilab online edition of the 1962 slide
rule, read from its rendered images for overpressure and wind (±3 %).

${nuc === null ? '' : scorecard(nuc, LABELS)}

${nuc === null ? '' : binTable(nuc, ['blastRingAsDrawn', 'burnRingAsDrawn', 'burnRadiusAtNukemapFluence', 'radiationRingNearestDose'], LABELS)}

${nuc === null ? '' : binTable(nuc, ['fourmilabOverpressureSurface', 'fourmilabWindSurface'], LABELS)}

Reading. The blast agrees with NUKEMAP's rings within ×1.25 everywhere;
Nimbus's 1 psi ring is the wider one (${gm(nuc, 'blastRingAsDrawn', 'bin: 1 psi')}×). The burn rings are
${gm(nuc, 'burnRingAsDrawn')}× NUKEMAP's, and they stay there when Nimbus is asked at NUKEMAP's own
fluences (${gm(nuc, 'burnRadiusAtNukemapFluence')}×): the difference is the attenuation and partition, not the
threshold. Against the 1962 rule Nimbus's surface-burst overpressure is
${gm(nuc, 'fourmilabOverpressureSurface')}× higher, rising with range. Nimbus's apparent crater radius lies
between NUKEMAP's inside (${gm(nuc, 'craterRadiusVsInside')}×) and lip (${gm(nuc, 'craterRadiusVsLip')}×) radii.

## CHEM — chemical surface charges against Kingery–Bulmash

Reference: Swisdak's (1994) simplified Kingery–Bulmash polynomials for a
hemispherical TNT surface burst, as the MIT-licensed \`kingery-bulmash\`
package implements them (commit 194c3c7), held first to the three worked
examples of IATG 01.80 (2021), Table 5: largest difference 0.53 %.

${chem === null ? '' : scorecard(chem, LABELS)}

${chem === null ? '' : binTable(chem, ['incidentOverpressure'], LABELS)}

Reading. Twice the charge in Kinney & Graham's free-air fit tracks the
hemispherical surface burst within ${med(chem, 'incidentOverpressure')} in the median: ~20 % high
close in (Z ≤ 3 m/kg^⅓), ~8 % low at 10–20, 13 % high at 40.

## EQ-GM — ground motion against the OpenQuake Engine

Reference: OpenQuake 3.26.2 hazardlib on ${((get(eq, 'ringBoore2014')?.rows ?? 0) / 3).toString()} cases at 13 distances,
the crossings of the Worden et al. (2012) accelerations read on a 0.5 km
grid of Joyner–Boore distance. Subduction-interface presets are compared
with the interface models only.

${eq === null ? '' : scorecard(eq, LABELS)}

${eq === null ? '' : subsetTable(eq, ['ringVsNgaWest2Ensemble', 'ringVsAllen2012Point'], LABELS)}

Reading. The implementation is exact. As a model, Boore et al. (2014)
draws rings ${gm(eq, 'ringVsNgaWest2Ensemble')}× the NGA-West2 ensemble's (${share(eq, 'ringVsNgaWest2Ensemble', 'within2')} within ×2) and
${gm(eq, 'ringVsAllen2012Point')}× the intensity rings Allen et al. (2012) predict directly. The
five megathrust presets' rings are ${gm(eq, 'ringVsAbrahamson2016Interface')}× and ${gm(eq, 'ringVsParker2020Interface')}× the interface
models': the crustal relation over-reaches on the interface. Many rows
sit apart because the NGA-West2 models never reach MMI VIII or IX where
Boore et al. do.

## EQ-PAGER — people and deaths against USGS PAGER

Reference: the PAGER loss product (exposure by intensity, empirical
fatality estimate) of every earthquake of rule 11, rule 23 and the net
that has one: ${pagerEvents.toString()} events. Nimbus's side is the validation harness's run
of the same rows, on the shipped population raster.

${pager === null ? '' : scorecard(pager, LABELS)}

${pager === null ? '' : subsetTable(pager, ['exposureMmi7Plus', 'centralToll', 'fatalityAlert'], LABELS)}

Alert colours, PAGER → Nimbus: ${
    pager === null
      ? ''
      : Object.entries(pager.alertConfusion as Record<string, number>)
          .map(
            ([k, v]) => `${k.replace('PAGER ', '').replace(' → Nimbus ', ' → ')} ${v.toString()}`
          )
          .join('; ')
  }.

## TSU — the open ocean against GeoClaw

Reference: GeoClaw 5.14.0 on the sphere over a flat ocean, no friction;
${tsuRuns.toString()} runs (status: ${tsuStatus}). Gaussian humps of 1–20 m and 20–100 km over
1 000 and 4 000 m; megathrusts built from Nimbus's own rupture, fed to
GeoClaw as Nimbus's uniform uplift and as an Okada deformation of the same
slip. Gauges are broadside to the fault.

${tsu === null ? '' : scorecard(tsu, LABELS)}

${tsu === null ? '' : binTable(tsu, ['maxAmplitudeGaussian', 'arrivalTimeGaussian', 'maxAmplitudeMegathrustUplift', 'maxAmplitudeMegathrustOkada'], LABELS)}

Reading. The globe's spreading law over-states a hump's crest near the
source (×${gm(tsu, 'maxAmplitudeGaussian', 'bin: 100 km')} at 100 km) and converges on the shallow-water solution
far out. Arrival near the source is not comparable: GeoClaw's first
crossing of a tenth of the crest at 100 km is the hump's own flank.

## VOL — tephra against Tephra2

Reference: Tephra2 2.0 (commit ff621c6, GPL-3.0, built and run locally)
with Nimbus's plume height, erupted mass and wind for ${(get(vol, 'isopach1mmReach')?.rows ?? 0).toString()} eruptions,
Nimbus's four grain classes as a Gaussian in φ; parameters Nimbus does not
have taken from Tephra2's own example.

${vol === null ? '' : scorecard(vol, LABELS)}

${vol === null ? '' : binTable(vol, ['massLoadingDownwind', 'massLoadingCrosswind'], LABELS)}

## LAND — landslide waves against Heller, Hager & Minor

Reference: the three-dimensional generation equations of the VAW manual
(Heller et al. 2009), held first to its Example 1: P = ${f(landExample?.P)} (manual 0.64),
first crest ${f(landExample?.c1, 1)} m (14.4), first trough ${f(landExample?.t1, 1)} m (22.7), second crest ${f(landExample?.c2, 1)} m (10.1).
Heller needs the slide's velocity, thickness and width, which Nimbus does
not take; they are closed as declared in the deviations, and Nimbus's
source amplitude is scored against the band Heller's equations give over
the Froude numbers his experiments span.

${land === null ? '' : scorecard(land, LABELS)}

${land === null ? '' : subsetTable(land, ['firstCrestAmplitudeAtBandCentre', 'insideHellerBand'], LABELS)}

## INV — invariants on random scenarios

Five thousand scenarios a hazard over the ranges the custom forms accept,
seeded; each run in a worker with a ${((inv?.watchdogMs ?? 0) / 1000).toString()} s watchdog. Checks: no NaN,
no infinity, no throw, no hang; radii, areas and amplitudes not negative;
no radius past half the Earth's circumference and no area past its surface;
the drawn rings monotone in size (+1 %) and continuous (+0.1 % moves them
by less than 5 %; rings under a millimetre are not compared).

${invSection(inv)}

Reading. The earthquake hangs are finding 1. The impact firestorm radii
and areas are finding 4; the form takes impactors from 1 m to 100 000 km,
eight times the Earth's diameter, so half the random impacts are large
enough to draw fire past the planet. The impact blast rings shrink slightly with size
in ${impactMonotone.toLocaleString('en-US')} scenarios: a larger body bursts lower, where the altitude
factor lifts its reach less, and the lift it loses outweighs the energy it
gains (in the example kept, 1 % more diameter takes the 1 psi ring from
${monotoneExample}). The wind-driven ashfall footprint
is not monotone in erupted volume (${ashRange.toLocaleString('en-US')} range and ${ashArea.toLocaleString('en-US')} area failures), and
it jumps: in the examples kept, 1 % more tephra takes the downwind reach
from the 5 000 km cap to 4 070 km, and 0.1 % more takes the area down by 15 %. The earthquake "continuity" rows are rings a few hundred
metres wide appearing as the epicentral acceleration crosses the
threshold, where the radius grows as the square root of the excess —
steep, continuous, and not a defect.

## UI — the application against Node

Every preset opened in the application (dev server, headless Chromium),
launched on a fixed inland site or, for the sources in the water, at sea;
the result the application's store holds compared number by number with
the same inputs run in Node, and the headline values the panel prints
held to the Node values at the precision they are printed with.

${uiSection(ui)}

Reading. The application computes what Node computes: every number the
store holds equals the Node result bit for bit, except where the store
deliberately edits the result for a source in open water — an impact's
firestorm and liquefaction, and a submarine earthquake's liquefaction,
are set to zero. Two things follow. The impact gate zeroes the ignition
radius, the sustain radius and the ignition area but not the sustain area,
so the ocean variant of Chicxulub still prints a firestorm area beside
rings of zero (the explosion gate zeroes all four). And the megathrust
presets print a liquefaction radius of 0 m, the gate's choice for an
epicentre at sea, though the radius Nimbus computes reaches the coast.

## Discrepancy register

| ID | Track | Finding | Classification | Consequence | Reproducer |
| --- | --- | --- | --- | --- | --- |
| BM-01 | INV | Mw ≈ 3.13–3.70 never returns (aftershock rejection loop: Båth ceiling at or below the completeness cutoff) | Implementation defect | High: for six values the form offers the result never comes and the simulation worker stays busy | \`simulateEarthquake({ magnitude: 3.5 })\` |
| BM-02 | IMP | Airburst blast rings and overpressure far beyond EIEP (×${gm(imp, 'airblastRadiusAirburst', 'bin: 1 kPa')} at 1 kPa; rings the program never lets reach the ground) | Model-form difference (altitude factor) | High for airbursts above ~10 km | \`benchmark/results/impact.json\`, e.g. imp-grid-016 |
| BM-03 | EQ-PAGER | Exposure at MMI VII+ ×${gm(pager, 'exposureMmi7Plus')} PAGER; toll ×${gm(pager, 'centralToll')}; MMI IX ring empty where PAGER has people | Model-form difference (ring area) | High for tolls | \`benchmark/results/pager.json\` |
| BM-04 | INV / IMP | Impact firestorm radii past the antipode and areas larger than the Earth; the panel prints them | Implementation defect (no spherical cap) | Medium: absurd numbers on large impacts | Chicxulub preset: \`firestorm.ignitionRadius\` 24 579 km, \`ignitionArea\` 1.9 × 10¹⁵ m² |
| BM-05 | TSU | Megathrust crest ×${gm(tsu, 'maxAmplitudeMegathrustUplift')} GeoClaw on the same uplift | Model-form difference (spreading normalisation of a rectangular source) | Medium for far-field waves | tsu-mega-* (uplift) |
| BM-06 | IMP | Complex-crater depth ×${gm(imp, 'finalDepth')} the service | Reference revision (0.294·D^0.301 against Eq. 28) | Low | imp-grid-007 |
| BM-07 | VOL | Loading ×${gm(vol, 'massLoadingDownwind')} Tephra2 on the axis, σ ln ${f(get(vol, 'massLoadingDownwind')?.scatterLn)}; plume too narrow across the wind | Model-form difference | Medium for ash thickness away from the axis | vol-* at 50 km, 30 km across |
| BM-08 | INV | Wind-driven ashfall range and area not monotone in volume; reach capped at 5 000 km then falling | Implementation defect | Low–medium | \`simulateVolcano\` examples in \`invariants.json\` |
| BM-09 | IMP | No impact tsunami when a broken body brings < 50 % of its energy to the surface (EIEP gives one) | Model-form gate | Low–medium | imp-grid-059…062 |
| BM-10 | EQ-GM | Interface presets' rings ×${gm(eq, 'ringVsAbrahamson2016Interface')}–${gm(eq, 'ringVsParker2020Interface')} the interface models | Model-form difference | Medium for megathrust shaking | eq-preset-TOHOKU_2011 and the other interface presets |
| BM-11 | IMP | Burn radius not bounded by the fireball's horizon for the largest impacts (10²³ J and more; up to ×3.5 the program's) | Model-form difference | Low | imp-grid-010 |
| BM-12 | NUC | Burn rings ×${gm(nuc, 'burnRingAsDrawn')} NUKEMAP; surface-burst overpressure ×${gm(nuc, 'fourmilabOverpressureSurface')} the 1962 rule; crater between NUKEMAP's radii | Model-form difference | Low | \`benchmark/results/nuclear.json\` |
| BM-13 | IMP | Breakup and burst altitude 1.7–3.4 % off in two cases (tolerance 1 %) | Candidate implementation difference | Low | imp-grid-045, imp-preset-METEOR_CRATER |
| BM-14 | IMP | Fireball horizon 0.5–3 % short for the largest energies | Candidate implementation difference | Low | imp-grid-010 |
| BM-15 | INV | Sub-metre impactors throw (reachable through a link, not the form) | Implementation defect | Low | \`simulateImpact({ impactorDiameter: 0.05, impactVelocity: 33000, impactorDensity: 8400, targetDensity: 1800, impactAngle: 1.4 })\` |
| BM-16 | INV | Airburst blast rings shrink by a few tenths of a percent as the body grows (it bursts lower, where the altitude factor lifts less); crater and ejecta shrink by 8 % in two scenarios | Model-form behaviour | Low | \`invariants.json\` |
| BM-17 | IMP | EIEP labels ground-impact air-blast radii one threshold off; its printed overpressure and its radii disagree | Reference limitation | None for Nimbus; affects anyone reading the map | \`airblastRadiusGroundAsLabelled\` |
| BM-18 | LAND | Source amplitude below Heller's band in about half the cases under the V^⅓ closure | Model-form difference / input mismatch | Low (closure-dependent) | \`benchmark/results/landslide.json\` |
| BM-19 | UI | The open-water impact gate leaves \`firestorm.sustainArea\` (the printed firestorm area) untouched while zeroing the radii | Implementation defect | Low | Chicxulub (ocean variant) at sea |
| BM-20 | UI | Megathrust presets print a liquefaction radius of 0 m (gate for an epicentre at sea) | Design choice to review | Low | Tōhoku 2011 at sea |

## Deviations from the protocol

1. **Kingery–Bulmash coefficients.** UFC 3-340-02 and Swisdak (1994) were
   not reachable (DTIC and the publishers answered 403). The reference is
   the MIT-licensed \`kingery-bulmash\` package, which implements Swisdak's
   polynomials, held to IATG 01.80 Table 5 before use.
2. **EIEP quantities.** The service's /map page prints air blast and
   crater at a distance and draws rings for the rest. Seismic shaking has
   no common output and is not compared. Thermal exposure is compared at
   the program's clothing-ignition fluence (1 MJ/m² × E_Mt^⅙, read back from
   its radii); air-blast radii of ground impacts are read as 20 and 5 kPa,
   the thresholds their scaled distances share with the program's own
   airburst radii, with the reading by the page's labels kept as a
   sensitivity row. Class A tolerance is widened by the rounding each value
   was printed with; OpenQuake's crossings by their 0.5 km grid.
3. **OpenQuake.** \`gdal\` was excluded from the install (no arm64 wheel;
   hazardlib does not import it). \`rrup\` was computed over
   curvature-following facets, because a single planar surface on the
   sphere sinks for long ruptures. Megathrust presets are compared with the
   interface models only.
4. **NUKEMAP and Fourmilab.** NUKEMAP keeps the height of burst in whole
   feet; Starfish Prime has no blast, burn or radiation rings in NUKEMAP.
   The Fourmilab rule was read for overpressure and wind only (92 of 232
   points); it has no height of burst, so its optimum-height scales are
   compared with Nimbus at the case's height as a separate quantity. Radiation
   rings are compared at the nearest dose (LD50 ≈ 4.5 Gy with 500 rem,
   LD100 ≈ 8 Gy with 1 000 rem, 1 Gy with 100 rem), and the crater with both
   of NUKEMAP's radii.
5. **Tephra2.** The vent sits at 0.001 m (0 m makes Tephra2 divide 0 by 0);
   the eddy constant, diffusion coefficient, fall-time threshold and plume
   shape come from Tephra2's Colima example.
6. **Heller.** The slide's thickness and width are V^⅓, its density the
   regime's reference density, and its velocity is not chosen: Nimbus is
   scored against Heller's first crest across 0.40 ≤ F ≤ 3.40. The grid runs
   in the subaerial regime (Nimbus's default is submarine); most cases lie
   outside Heller's tested S, M and B ranges under this closure.
7. **GeoClaw.** The 15 GeoClaw fixtures already in the validation suite
   were not rerun here. ${tsuStatus === 'complete' ? '' : `The matrix was not finished in the night: ${tsuRuns.toString()} of the 28 planned runs (18 humps, 5 megathrusts two ways) had ended when this report was written; the rest are added when they end.`}
8. **PAGER.** ${pagerEvents.toString()} of the 414 events asked have exposure and loss JSON; one of them is a
   net event. The alert colour is read from the fatality estimate alone.
9. **INV harness.** A first sweep drew impactor diameters from 1 mm to 100 km
   instead of the form's 1 m to 100 000 km, compared rings of 10⁻⁷⁷ m, and read
   a height × range product as a range. The sampler, a 1 mm floor and the
   exclusion were corrected and the sweep rerun; the sub-metre throw the
   first sweep found is kept as BM-15.
10. **UI.** Two fixed sites stand in for a visitor's click; the comparison
    is of the simulate result and of the headline values of each panel, not
    of every string the panel prints.

## Environment and provenance

- Nimbus: physics at \`2dfe0c3\`; scripts in \`scripts/benchmark/\`; macOS 26.6.2,
  Apple M5, Node 22.20.0.
- Earth Impact Effects Program: \`https://impact.ese.ic.ac.uk/map\`, 1 552
  requests from 22:29 to 23:06 UTC on 14 September 2026, one at a time, a
  second apart, every page cached.
- NUKEMAP 2.76 (\`nukemap2.js?v=202602091\`, \`nukeeffects.js?v=202311\`),
  headless Chromium, 22:43–22:46 UTC, casualty and logging services
  blocked; Fourmilab Nuclear Bomb Effects Computer, online edition (page
  of June 2005), 22:49–23:10 UTC.
- \`kingery-bulmash\` (github.com/fcento100/kingery-bulmash, MIT), commit
  194c3c7a91ecda97bb3e8aaca55f0359d4066d5e; \`kingery_bulmash.py\` SHA-256
  afec9cae1b2d3f01c126683cc481b86086b722f083a516962de8637743e877ce.
- OpenQuake Engine 3.26.2 (wheel SHA-256 ce735712…038e7a), CPython 3.12.13,
  numpy 2.2.6, scipy 1.18.1; checked on BSSA_2014_MEAN.csv (≤ 0.0004 %) and
  Allen et al. (2012) tables.
- USGS PAGER loss products through ComCat, read 22:30–22:45 UTC on 14 September 2026.
- GeoClaw: Clawpack 5.14.0 (geoclaw 11479f67), GNU Fortran 16.2.0, OpenMP.
- Tephra2 2.0, commit ff621c6612afa730d7a21ce9832e80af4fff3964, Apple clang
  21.0.0, bdw-gc 8.2.12.
- Heller, Hager & Minor (2009), VAW Mitteilung 4257, public PDF.

Raw reference outputs were kept in the campaign's scratch directory, as the
protocol says; \`benchmark/results/\` holds every statistic the report is
built from, with the five worst pairs of each quantity.

## Credibility, after NASA-STD-7009A

- **Verification.** Strong where a reference implements the cited
  equations: the impact entry, crater, fireball and ejecta, and Boore et
  al. (2014), agree to rounding. Two small entry differences and the
  crater-depth revision are open.
- **Validation.** Against other models Nimbus sits within ×1.25 for the
  blast of explosions, within ×2 for most earthquake rings, and outside ×2
  for airburst blast, megathrust waves, off-axis tephra and the people
  inside earthquake rings.
- **Input pedigree.** Presets and 5 000-scenario sweeps; the references'
  inputs are Nimbus's own where the models need parameters Nimbus lacks,
  and every closure is declared.
- **Uncertainty.** The scatter of each ratio is reported; the references'
  own uncertainties (EIEP rounding, rule reading, grid convergence of
  GeoClaw) are named where they matter.
- **Robustness.** Not yet: one input range hangs the page and one family of
  outputs leaves the planet.
- **Use history.** The comparisons here are the first against the field's
  programs across the input space, and they are repeatable from
  \`scripts/benchmark/\`.
`;
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main();
}
