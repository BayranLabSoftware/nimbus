/**
 * Generate `docs/VALIDATION_REPORT.md` and its JSON sidecar from the
 * live state of the model.
 *
 * Two kinds of evidence, and the report carries both:
 *
 *   - **Against the record.** The calibration net: death tolls against
 *     events that were counted, waves against buoys and surveys, the
 *     shaking footprint against USGS ShakeMap, and what the product's
 *     population interpolation costs. This is what a reader comes for.
 *   - **Against itself.** The replay fixtures and the executable golden
 *     dataset, which pin the model's outputs so that a change shows up
 *     as a diff rather than as a surprise.
 *
 * **Deterministic, and checked.** The output carries no timestamp and
 * every figure is rounded to the precision it is quoted at, so the
 * same code always writes the same bytes. CI regenerates both files
 * and fails if they differ from the committed ones. That is the whole
 * point: this report sat frozen at 30 April 2026 for four months while
 * CI regenerated a throwaway copy on every push, and by September the
 * document meant to prove the model described one that no longer
 * existed. Now the copy at any commit describes the model at that
 * commit, and every printed simulation report links to it.
 *
 * Usage:
 *   pnpm validation-report                  # strict gate (default)
 *   pnpm validation-report --mode=advisory  # report, do not block
 */

import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLDEN_DATASET } from '../src/physics/validation/goldenDataset.js';
import {
  loadReplayFixtures,
  runReplay,
  type ReplayReport,
} from '../src/physics/validation/replayHarness.js';
import {
  compareWithRecord,
  interpolationCost,
  RECORDED_EVENTS,
  type InterpolationCost,
  type TollComparison,
} from '../src/physics/validation/recordedTolls.js';
import {
  compareWave,
  RECORDED_WAVES,
  type WaveComparison,
} from '../src/physics/validation/recordedWaves.js';
import {
  compareFootprints,
  footprintBias,
  inventedBands,
  type FootprintRow,
} from '../src/physics/validation/shakemapFootprint.js';
import {
  CALIBRATION_ANCHORS,
  type EnvelopeEventType,
} from '../src/physics/validation/calibrationEnvelope.js';

const REPO_ROOT = fileURLToPath(new URL('..', import.meta.url));

// ---------------------------------------------------------------------
// Formatting. Every figure is rounded to what it is quoted at, and
// thousands are grouped by hand rather than by the runtime's locale
// data, so the bytes do not depend on which Node wrote them.
// ---------------------------------------------------------------------

function grouped(n: number): string {
  const rounded = Math.round(n);
  const sign = rounded < 0 ? '-' : '';
  return (
    sign +
    Math.abs(rounded)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  );
}

function factor(ratio: number): string {
  if (!Number.isFinite(ratio)) return 'from nothing';
  return `${ratio.toFixed(2)}×`;
}

function metres(v: number): string {
  return v >= 10 ? `${v.toFixed(1)} m` : `${v.toFixed(2)} m`;
}

function range(metresRange: number): string {
  return metresRange >= 10_000 ? `${grouped(metresRange / 1000)} km` : `${grouped(metresRange)} m`;
}

/** JSON numbers at a fixed precision, for the same reason. */
function fixed(v: number, digits: number): number {
  if (!Number.isFinite(v)) return v > 0 ? Number.MAX_SAFE_INTEGER : 0;
  return Number(v.toFixed(digits));
}

/** Code-unit order. Not `localeCompare`: collation comes from the
 *  runtime's ICU data, which is not the same in every Node, and the
 *  bytes of this report must not depend on which one wrote them. */
function byCodeUnit(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

function bullet(rows: string[]): string {
  return rows.map((r) => `- ${r}`).join('\n');
}

// ---------------------------------------------------------------------
// Replay fixtures and golden dataset — the model against itself.
// ---------------------------------------------------------------------

interface SuspiciousCase {
  /** Fixture / golden-case ID, e.g. `G-PHYS-SUSPICIOUS-MW`. */
  id: string;
  /** Human-readable title from the fixture / golden definition. */
  title: string;
  /** Warning codes attached to this case (typically PHYS_SUSPICIOUS_*). */
  warningCodes: string[];
}

interface AggregateBucket {
  total: number;
  passed: number;
  failed: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  topErrorCodes: { code: string; count: number }[];
  topWarningCodes: { code: string; count: number }[];
  failures: { id: string; violations: string[] }[];
  /**
   * S3 cases (validation.status === 'suspicious') with their identity,
   * so the release-readiness consumer can name the case in the summary.
   */
  suspiciousCases: SuspiciousCase[];
}

function topN(counts: Record<string, number>, n: number): { code: string; count: number }[] {
  return Object.entries(counts)
    .map(([code, count]) => ({ code, count }))
    .sort((a, b) => b.count - a.count || byCodeUnit(a.code, b.code))
    .slice(0, n);
}

function sortedRecord(r: Record<string, number>): Record<string, number> {
  return Object.fromEntries(Object.entries(r).sort(([a], [b]) => byCodeUnit(a, b)));
}

function aggregateReports(
  reports: ReplayReport[],
  fixturesById: Map<string, { title: string }>
): AggregateBucket {
  const byCategory: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const errorCodeCounts: Record<string, number> = {};
  const warningCodeCounts: Record<string, number> = {};
  const failures: { id: string; violations: string[] }[] = [];
  const suspiciousCases: SuspiciousCase[] = [];
  let passed = 0;
  for (const r of reports) {
    byCategory[r.category] = (byCategory[r.category] ?? 0) + 1;
    const status = r.snapshot.validation.status;
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    for (const e of r.snapshot.validation.errors) {
      errorCodeCounts[e.code] = (errorCodeCounts[e.code] ?? 0) + 1;
    }
    for (const w of r.snapshot.validation.warnings) {
      warningCodeCounts[w.code] = (warningCodeCounts[w.code] ?? 0) + 1;
    }
    if (status === 'suspicious') {
      const fx = fixturesById.get(r.fixtureId);
      suspiciousCases.push({
        id: r.fixtureId,
        title: fx?.title ?? '(unknown — fixture not found in source map)',
        warningCodes: Array.from(new Set(r.snapshot.validation.warnings.map((w) => w.code))).sort(),
      });
    }
    if (r.passed) {
      passed += 1;
    } else {
      failures.push({
        id: r.fixtureId,
        violations: r.violations.map(
          (v) =>
            `${v.field}: ${v.reason} (expected ${JSON.stringify(v.expected)}, got ${JSON.stringify(v.actual)})`
        ),
      });
    }
  }
  suspiciousCases.sort((a, b) => byCodeUnit(a.id, b.id));
  failures.sort((a, b) => byCodeUnit(a.id, b.id));
  return {
    total: reports.length,
    passed,
    failed: reports.length - passed,
    byCategory: sortedRecord(byCategory),
    byStatus: sortedRecord(byStatus),
    topErrorCodes: topN(errorCodeCounts, 5),
    topWarningCodes: topN(warningCodeCounts, 5),
    failures,
    suspiciousCases,
  };
}

function reportTable(b: AggregateBucket): string {
  const lines = [
    `| Total | Passed | Failed |`,
    `|-------|--------|--------|`,
    `| ${b.total.toString()} | ${b.passed.toString()} | ${b.failed.toString()} |`,
    '',
    '**By category:**',
    '',
    '| Category | Count |',
    '|----------|-------|',
    ...Object.entries(b.byCategory).map(([k, v]) => `| ${k} | ${v.toString()} |`),
    '',
    '**By validation status:**',
    '',
    '| Status | Count |',
    '|--------|-------|',
    ...['accepted', 'normalized', 'suspicious', 'invalid'].map(
      (s) => `| ${s} | ${(b.byStatus[s] ?? 0).toString()} |`
    ),
  ];
  if (b.topErrorCodes.length > 0) {
    lines.push('', '**Top error codes:**', '', '| Code | Count |', '|------|-------|');
    for (const e of b.topErrorCodes) lines.push(`| ${e.code} | ${e.count.toString()} |`);
  }
  if (b.topWarningCodes.length > 0) {
    lines.push('', '**Top warning codes:**', '', '| Code | Count |', '|------|-------|');
    for (const w of b.topWarningCodes) lines.push(`| ${w.code} | ${w.count.toString()} |`);
  }
  return lines.join('\n');
}

function failureSection(b: AggregateBucket, header: string): string {
  if (b.failures.length === 0) return `### ${header}\n\nAll passed.\n`;
  const lines = [`### ${header}`, ''];
  for (const f of b.failures) {
    lines.push(`#### ${f.id}`);
    for (const v of f.violations) lines.push(`- ${v}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------
// The calibration net — the model against the record.
// ---------------------------------------------------------------------

interface CalibrationNet {
  tolls: TollComparison[];
  waves: WaveComparison[];
  footprint: FootprintRow[];
  interpolation: InterpolationCost[];
}

function runCalibrationNet(): CalibrationNet {
  return {
    tolls: RECORDED_EVENTS.map(compareWithRecord),
    waves: RECORDED_WAVES.map(compareWave),
    footprint: compareFootprints(),
    interpolation: RECORDED_EVENTS.map(interpolationCost).filter(
      (c): c is InterpolationCost => c !== null
    ),
  };
}

function recordedLabel(t: TollComparison): string {
  const e = t.event;
  const base = grouped(e.recordedDeaths);
  if (e.recordedDeathsLow === undefined || e.recordedDeathsHigh === undefined) return base;
  return `${base} (${grouped(e.recordedDeathsLow)}–${grouped(e.recordedDeathsHigh)})`;
}

function bandSpan(low: number, high: number): string {
  if (!(high > 0)) return '—';
  return `10^${(Math.log10(high / Math.max(low, 1)) || 0).toFixed(1)}`;
}

function tollRatio(t: TollComparison): string {
  if (t.event.recordedDeaths === 0) return t.deaths === 0 ? 'both zero' : 'from nothing';
  return factor(t.ratio);
}

function tollSection(net: CalibrationNet): string {
  const rows = net.tolls.map(
    (t) =>
      `| ${t.event.name} | ${recordedLabel(t)} | ${grouped(t.deaths)} | ${grouped(t.low)} – ${grouped(t.high)} | ${bandSpan(t.low, t.high)} | ${tollRatio(t)} | ${t.contains ? 'contains' : '**misses**'} | ${t.event.gated ? 'gated' : 'declared'} |`
  );
  const misses = net.tolls.filter((t) => !t.contains && t.event.caveat !== undefined);
  const notes = net.tolls.filter((t) => t.contains && t.event.caveat !== undefined);
  return [
    'Every event with a counted death toll, run through the same plan builder',
    'the application uses, on the population rasters the application ships.',
    'The band is the 5th–95th percentile of 200 realisations drawn from the',
    'published input scatter — a claim that can be wrong, not the range of',
    'the vulnerability table. A **gated** row fails the build when its band',
    'stops containing the record; a **declared** row is measured and printed',
    'with its reason, and the reason is below.',
    '',
    '| Event | Recorded | Model | Band (5–95 %) | Span | Model / record | Verdict | Standing |',
    '|-------|---------:|------:|--------------:|-----:|---------------:|---------|----------|',
    ...rows,
    '',
    '#### Where the band misses, and why',
    '',
    ...misses.flatMap((t) => [`**${t.event.name}.** ${t.event.caveat ?? ''}`, '']),
    ...(notes.length > 0
      ? [
          '#### What to know about the rows that contain their record',
          '',
          ...notes.flatMap((t) => [`**${t.event.name}.** ${t.event.caveat ?? ''}`, '']),
        ]
      : []),
  ].join('\n');
}

function interpolationSection(net: CalibrationNet): string {
  const rows = net.interpolation.map(
    (c) =>
      `| ${c.event.name} | ${grouped(c.measured.low)} – ${grouped(c.measured.high)} | ${grouped(c.interpolated.low)} – ${grouped(c.interpolated.high)} | ${c.lowFactor.toFixed(2)}× / ${c.highFactor.toFixed(2)}× | ${c.comparable ? 'yes' : 'too few dead'} |`
  );
  const worst = net.interpolation
    .filter((c) => c.comparable)
    .reduce((m, c) => Math.max(m, c.lowFactor, c.highFactor), 1);
  return [
    'The browser cannot query the population backend once per realisation, so',
    'it counts the people inside each damage ring plus two footprints that',
    'bracket the radii the draws reach, and reads every sampled radius off that',
    'curve at one density per annulus. This harness has the raster in memory',
    'and can afford the exact query at every radius. Comparing the two is the',
    'only way to know the band a visitor reads is a statement about the event',
    'rather than about the interpolation.',
    '',
    '| Event | Measured band | Interpolated band | Ends apart (low / high) | Comparable |',
    '|-------|--------------:|------------------:|------------------------:|------------|',
    ...rows,
    '',
    `Worst comparable end: **${worst.toFixed(2)}×**, against a gate of 2×.`,
  ].join('\n');
}

function waveSection(net: CalibrationNet): string {
  const rows = net.waves.map((w) => {
    const o = w.wave.observed;
    const observed = o.high <= 0 ? 'no wave' : `${metres(o.low)} – ${metres(o.high)}`;
    const globe =
      w.globe === null
        ? 'same'
        : `${metres(w.globe)}${w.globeContains === true ? '' : ' — **misses**'}`;
    return `| ${w.wave.name} | ${range(o.atRangeM)} | ${observed} | ${metres(w.model)} | ${w.contains ? 'contains' : '**misses**'} | ${globe} | ${w.wave.gated ? 'gated' : 'declared'} |`;
  });
  const globeMisses = net.waves.filter((w) => w.globeContains === false);
  return [
    'Wave amplitudes against buoys, gauges, surveys and deposits. **Model** is',
    'the figure the harness computes and gates; **Globe draws** is what the',
    'amplitude veil on the globe shows at the same range, printed wherever it',
    'is computed by a different law — because a gate on a number the product',
    'does not show would be a gate on nothing.',
    '',
    '| Record | Range | Observed | Model | Verdict | Globe draws | Standing |',
    '|--------|------:|---------:|------:|---------|------------:|----------|',
    ...rows,
    '',
    ...(globeMisses.length === 0
      ? []
      : [
          `**Where the globe misses a record the harness contains (${globeMisses.length.toString()}):** ${globeMisses.map((w) => w.wave.name).join('; ')}. For an underwater burst the veil spreads with the energy normalisation of a ring and the harness spreads without it. Which law is right for a compact source near the burst is open (docs/ROADMAP.md, M9 move 3); the list is pinned in \`recordedWaves.test.ts\` so it cannot change without somebody deciding.`,
          '',
        ]),
    ...net.waves.flatMap((w) =>
      w.wave.caveat === undefined ? [] : [`**${w.wave.name}.** ${w.wave.caveat}`, '']
    ),
    '_Sources:_',
    '',
    bullet(net.waves.map((w) => `${w.wave.name} — ${w.wave.source}`)),
  ].join('\n');
}

function footprintSection(net: CalibrationNet): string {
  const rows = net.footprint.map(
    (r) =>
      `| ${r.name} | MMI ≥ ${r.threshold.toString()} | ${grouped(r.observedKm2)} km² | ${grouped(r.modelKm2)} km² | ${r.observedKm2 === 0 && r.modelKm2 === 0 ? 'neither reaches it' : factor(r.ratio)} |`
  );
  const bias = footprintBias(net.footprint);
  const invented = inventedBands(net.footprint);
  return [
    'How much ground the model shakes at MMI VII, VIII and IX, against the',
    'area the USGS ShakeMap recorded (`pnpm shakemap:build`). Area, not shape:',
    'the model draws a circle or a rupture stadium, the earth draws whatever the',
    'geology says.',
    '',
    '| Event | Threshold | ShakeMap | Model | Model / record |',
    '|-------|-----------|---------:|------:|---------------:|',
    ...rows,
    '',
    'The model predicts the median ground motion and a ShakeMap records one',
    'realisation of it; one sigma of ground motion (σ_lnY ≈ 0.5 over an',
    'R^(−0.71) decay) is a factor of two in radius and four in area before',
    'anything is wrong. What a median can honestly be held to is being centred',
    'and scattering like the ground:',
    '',
    `- Bands both reach: **${bias.bands.toString()}**`,
    `- Geometric-mean radius ratio: **${bias.geometricMeanRadiusRatio.toFixed(2)}**, ${bias.biasInStandardErrors.toFixed(2)} standard errors from centred`,
    `- Scatter σ_ln of the radius ratio: **${bias.sdLn.toFixed(2)}**, against the 0.70 the published ground-motion sigma implies`,
    '',
    invented.length === 0
      ? 'No band is painted at an intensity its event never reached.'
      : `**Bands painted at an intensity the event never reached (${invented.length.toString()}):** ${invented.join(', ')}. A laboratory-level model has none; the count is pinned in \`shakemapFootprint.test.ts\` so it can only go down.`,
  ].join('\n');
}

const TYPE_ORDER: readonly EnvelopeEventType[] = [
  'impact',
  'explosion',
  'earthquake',
  'volcano',
  'landslide',
];

function anchorsSection(): string {
  const lines = [
    'By event family, and per quantity: **gated** fails the build if the model',
    'drifts, **declared** is measured and printed with its reason. The',
    'simulator shows a reader how far their scenario sits from the nearest of',
    'these, for the quantity the panel is showing.',
    '',
  ];
  for (const type of TYPE_ORDER) {
    const anchors = CALIBRATION_ANCHORS.filter((a) => a.eventType === type);
    lines.push(`**${type}** (${anchors.length.toString()})`, '');
    if (anchors.length === 0) {
      lines.push('- none', '');
      continue;
    }
    for (const a of anchors) {
      const standing = a.quantities
        .map((q) => `${q} (${a.gated.includes(q) ? 'gated' : 'declared'})`)
        .join(', ');
      lines.push(`- ${a.name} — ${standing} — ${a.source}`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------
// The gate.
// ---------------------------------------------------------------------

/**
 * Release-gate policy. Single source of truth for what blocks the
 * CI pipeline vs what is reported as a known gap.
 *
 *   - 'strict' (default): any replay or golden failure blocks, and so
 *     does any GATED calibration row whose record falls outside the
 *     model's band. Suspicious-but-valid cases and declared rows are
 *     reported, not blocking.
 *   - 'advisory': everything is reported; nothing blocks.
 */
type GateMode = 'strict' | 'advisory';

function selectMode(): GateMode {
  const fromEnv = process.env.VALIDATION_MODE;
  const fromArgs = process.argv.find((a) => a.startsWith('--mode='));
  const value = fromArgs?.slice('--mode='.length) ?? fromEnv ?? 'strict';
  return value === 'advisory' ? 'advisory' : 'strict';
}

interface GateDecision {
  mode: GateMode;
  blocking: string[];
  warnings: string[];
  exitCode: 0 | 1;
}

function gate(
  replay: AggregateBucket,
  golden: AggregateBucket,
  net: CalibrationNet,
  mode: GateMode
): GateDecision {
  const problems: string[] = [];
  if (replay.failed > 0) problems.push(`replay failures: ${replay.failed.toString()}`);
  if (golden.failed > 0) problems.push(`golden failures: ${golden.failed.toString()}`);
  const tollMisses = net.tolls.filter((t) => t.event.gated && !t.contains);
  if (tollMisses.length > 0) {
    problems.push(
      `gated death-toll rows missing their record: ${tollMisses.map((t) => t.event.name).join(', ')}`
    );
  }
  const waveMisses = net.waves.filter((w) => w.wave.gated && !w.contains);
  if (waveMisses.length > 0) {
    problems.push(
      `gated wave rows missing their record: ${waveMisses.map((w) => w.wave.name).join(', ')}`
    );
  }
  const blocking = mode === 'strict' ? problems : [];
  const warnings = mode === 'advisory' ? problems : [];
  return { mode, blocking, warnings, exitCode: blocking.length > 0 ? 1 : 0 };
}

// ---------------------------------------------------------------------

function summary(net: CalibrationNet, replay: AggregateBucket, golden: AggregateBucket): string {
  const tollGated = net.tolls.filter((t) => t.event.gated);
  const tollContains = net.tolls.filter((t) => t.contains);
  const waveContains = net.waves.filter((w) => w.contains);
  const bias = footprintBias(net.footprint);
  const invented = inventedBands(net.footprint);
  return bullet([
    `**Death tolls:** ${tollContains.length.toString()} of ${net.tolls.length.toString()} events inside the model's band; ${tollGated.filter((t) => t.contains).length.toString()} of ${tollGated.length.toString()} gated rows pass. Every miss carries its cause below.`,
    `**Waves:** ${waveContains.length.toString()} of ${net.waves.length.toString()} records inside the harness figure — but the globe draws a different law for underwater bursts, and there it misses ${net.waves.filter((w) => w.globeContains === false).length.toString()} of the records the harness contains.`,
    `**Shaking footprint:** centred at ${bias.geometricMeanRadiusRatio.toFixed(2)} in radius (${bias.biasInStandardErrors.toFixed(2)} standard errors), scatter σ_ln ${bias.sdLn.toFixed(2)} against 0.70 expected; ${invented.length.toString()} bands painted at an intensity never reached.`,
    `**Replay fixtures:** ${replay.passed.toString()} of ${replay.total.toString()} pass. **Golden dataset:** ${golden.passed.toString()} of ${golden.total.toString()} pass.`,
  ]);
}

function main(): void {
  const replayFixtures = loadReplayFixtures();
  const replayReports = replayFixtures.map(runReplay);
  const goldenReports = GOLDEN_DATASET.map(runReplay);
  const replayById = new Map(replayFixtures.map((f) => [f.id, { title: f.title }]));
  const goldenById = new Map(GOLDEN_DATASET.map((g) => [g.id, { title: g.title }]));
  const replayAgg = aggregateReports(replayReports, replayById);
  const goldenAgg = aggregateReports(goldenReports, goldenById);

  const net = runCalibrationNet();

  const mode = selectMode();
  const decision = gate(replayAgg, goldenAgg, net, mode);

  const md = `# Nimbus validation report

Generated by \`pnpm validation-report\` from the code in this commit. Do not
edit by hand.

**This file cannot go stale.** CI regenerates it on every push and fails the
build if the committed copy differs by a single byte, so the version of this
file at any commit describes the model at that commit — and every simulation
report the application prints links to the copy for the commit that built
it. It carries no timestamp for the same reason: the commit is the date.

A machine-readable copy of the same data is in \`docs/VALIDATION_REPORT.json\`.

## Summary

${summary(net, replayAgg, goldenAgg)}

## Release gate

| Mode | Decision | Exit code |
|------|----------|-----------|
| **${decision.mode}** | ${decision.blocking.length === 0 ? 'PASS' : 'BLOCK'} | ${decision.exitCode.toString()} |

${decision.blocking.length === 0 ? '' : `**Blocking:**\n\n${bullet(decision.blocking)}\n`}
${decision.warnings.length === 0 ? '' : `**Warnings (non-blocking):**\n\n${bullet(decision.warnings)}\n`}
**Policy:** \`strict\` (the CI default) blocks on any replay or golden failure
and on any gated calibration row whose record falls outside the model's band.
Declared rows and suspicious-but-valid scenarios are reported, not blocking.
\`advisory\` reports everything and blocks nothing — switch with
\`pnpm validation-report --mode=advisory\` or \`VALIDATION_MODE=advisory\`.

## Against the record

### Death tolls

${tollSection(net)}
### What the product's interpolation costs

${interpolationSection(net)}

### Waves

${waveSection(net)}

### Shaking footprint against USGS ShakeMap

${footprintSection(net)}

### Where the model has been measured

${anchorsSection()}
## Against itself

- **Verification** (does the code do what we said it does?) is the unit-test
  layer: \`customInput.invariants\`, \`monotonicity.property\`,
  \`geometry.crs\`, \`regressionRegistry\`, and the per-formula tests beside
  each module.
- **Replay fixtures and the golden dataset** pin the model's outputs, routed
  through the centralised \`inputSchema.ts\` and the \`safeRun*()\` wrappers —
  the same path the UI, the store and the CLI use.

### Replay fixtures

${reportTable(replayAgg)}

${failureSection(replayAgg, 'Replay failures')}

### Golden dataset

${reportTable(goldenAgg)}

${failureSection(goldenAgg, 'Golden case failures')}

## Declared gaps

What the model is known not to do, stated so nobody has to discover it. The
misses above carry their own causes; these are the gaps that no single row
shows.

${bullet([
  "**Evacuation is not modelled.** The toll counts everyone inside the footprint. It is the largest single cause among the misses above — Tōhoku's coast, Mount St Helens and Pinatubo all over-predict because people had left — and on Tōhoku the wave itself is right: the model's median shore height on the Sanriku coast is 9.5 m against a surveyed 8–15 (docs/ROADMAP.md, move 3b).",
  "**The far-field wave law has no rupture length in it.** Every source spreads as a ring of half its down-dip width, so 702 km of fault and 1 300 km radiate the same wave at the same range. Sumatra's far coasts are five to ten times under-waved as a result (docs/ROADMAP.md, move 3b).",
  '**The coastal toll needs bathymetry**, so no offline test reaches it: the death-toll rows above are the shaking, blast and pyroclastic tolls only, and the wave rows are open-ocean amplitudes. The coastal numbers are measured in the browser; docs/ROADMAP.md carries the console snippet that reproduces them.',
  "**No impact in recorded history left a death toll**, so an impact's toll will never be validated. The simulator says so beside every impact toll.",
  '**Hazards outside the count:** fallout, initial radiation, famine, disease and climate. For a Chicxulub-class impact the climate is what kills most survivors.',
  '**GeoClaw sub-grid probes** below the AMR base-grid noise floor (< 1 cm) run as `it.skip` in `geoclawComparison.test.ts` — sub-grid sources, not regressions.',
  '**Custom-user GeoClaw fixtures** cover eight parameter-grid samples per source class; more is a fixed compute job (docs/GEOCLAW_SETUP.md).',
])}

## Scenarios still untrusted

${bullet([
  'Earthquake aftershock sequences: deterministic, not pinned by a replay fixture.',
  "The browser's fine population backends (WorldPop zonal statistics, fine tiles): the calibration net reads the shipped rasters, which are coarser over a city.",
  'The Comlink worker round-trip: covered by store smoke tests, not by this harness.',
  'Landslides have no Monte-Carlo sampler, so their toll band is still the range of the vulnerability parameters.',
])}

## How to add evidence

- **An event with a recorded outcome:** a row in \`RECORDED_EVENTS\`
  (\`src/physics/validation/recordedTolls.ts\`) or \`RECORDED_WAVES\`
  (\`recordedWaves.ts\`), and an anchor in \`calibrationEnvelope.ts\`.
- **A replay fixture:** a JSON file in \`src/physics/validation/replayFixtures/\`.
- **A golden case:** an entry in \`GOLDEN_DATASET\` and its row in
  \`docs/GOLDEN_CASES.md\`.

Then \`pnpm validation-report\` and commit both files; CI refuses the push
otherwise.
`;

  const out = join(REPO_ROOT, 'docs', 'VALIDATION_REPORT.md');
  writeFileSync(out, md.replace(/\n{3,}/g, '\n\n'), 'utf8');

  const jsonOut = join(REPO_ROOT, 'docs', 'VALIDATION_REPORT.json');
  const bias = footprintBias(net.footprint);
  const jsonSummary = {
    mode: decision.mode,
    gate: {
      decision: decision.blocking.length === 0 ? 'pass' : 'block',
      exitCode: decision.exitCode,
      blocking: decision.blocking,
      warnings: decision.warnings,
    },
    calibration: {
      tolls: net.tolls.map((t) => ({
        event: t.event.name,
        recorded: t.event.recordedDeaths,
        recordedLow: t.event.recordedDeathsLow ?? t.event.recordedDeaths,
        recordedHigh: t.event.recordedDeathsHigh ?? t.event.recordedDeaths,
        model: Math.round(t.deaths),
        bandLow: Math.round(t.low),
        bandHigh: Math.round(t.high),
        ratio: fixed(t.ratio, 3),
        contains: t.contains,
        gated: t.event.gated,
      })),
      waves: net.waves.map((w) => ({
        record: w.wave.name,
        rangeM: w.wave.observed.atRangeM,
        observedLowM: w.wave.observed.low,
        observedHighM: w.wave.observed.high,
        modelM: fixed(w.model, 3),
        contains: w.contains,
        globeM: w.globe === null ? null : fixed(w.globe, 3),
        globeContains: w.globeContains,
        gated: w.wave.gated,
      })),
      footprint: {
        rows: net.footprint.map((r) => ({
          event: r.name,
          mmi: r.threshold,
          shakemapKm2: Math.round(r.observedKm2),
          modelKm2: Math.round(r.modelKm2),
        })),
        geometricMeanRadiusRatio: fixed(bias.geometricMeanRadiusRatio, 3),
        biasInStandardErrors: fixed(bias.biasInStandardErrors, 3),
        sdLn: fixed(bias.sdLn, 3),
        inventedBands: inventedBands(net.footprint),
      },
      interpolation: net.interpolation.map((c) => ({
        event: c.event.name,
        measuredLow: Math.round(c.measured.low),
        measuredHigh: Math.round(c.measured.high),
        interpolatedLow: Math.round(c.interpolated.low),
        interpolatedHigh: Math.round(c.interpolated.high),
        comparable: c.comparable,
      })),
      anchors: CALIBRATION_ANCHORS.length,
    },
    replay: {
      total: replayAgg.total,
      passed: replayAgg.passed,
      failed: replayAgg.failed,
      byCategory: replayAgg.byCategory,
      byStatus: replayAgg.byStatus,
      topErrorCodes: replayAgg.topErrorCodes,
      topWarningCodes: replayAgg.topWarningCodes,
      suspiciousCases: replayAgg.suspiciousCases,
    },
    golden: {
      total: goldenAgg.total,
      passed: goldenAgg.passed,
      failed: goldenAgg.failed,
      byCategory: goldenAgg.byCategory,
      byStatus: goldenAgg.byStatus,
      topErrorCodes: goldenAgg.topErrorCodes,
      topWarningCodes: goldenAgg.topWarningCodes,
      suspiciousCases: goldenAgg.suspiciousCases,
    },
  };
  writeFileSync(jsonOut, `${JSON.stringify(jsonSummary, null, 2)}\n`, 'utf8');

  console.log(`Wrote ${out}`);
  console.log(`Wrote ${jsonOut}`);
  console.log(
    `Tolls: ${net.tolls.filter((t) => t.contains).length.toString()}/${net.tolls.length.toString()} inside; waves ${net.waves.filter((w) => w.contains).length.toString()}/${net.waves.length.toString()}; replay ${replayAgg.passed.toString()}/${replayAgg.total.toString()}; golden ${goldenAgg.passed.toString()}/${goldenAgg.total.toString()}.`
  );
  console.log(
    `Gate: ${decision.blocking.length === 0 ? 'PASS' : 'BLOCK'} (mode=${decision.mode}, exit=${decision.exitCode.toString()})`
  );
  if (decision.exitCode !== 0) process.exitCode = decision.exitCode;
}

main();
