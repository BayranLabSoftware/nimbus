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
  CALIBRATION_ROLES,
  type CalibrationQuantity,
  type CalibrationRole,
  type CalibrationUse,
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

const ROLE_LABEL: Readonly<Record<CalibrationRole, string>> = {
  tuned: 'tuned on it',
  inputInferred: 'input inferred from it',
  sameSource: 'same source',
  heldOut: 'held out',
  unestablished: 'not established',
};

/**
 * Whether the model was set on the event behind a row, for the quantity
 * the row checks. A row belongs to the anchor whose name it contains —
 * the rule `calibrationEnvelope.test.ts` holds every row to — and a row
 * without one stops the report rather than printing a blank.
 */
function useOf(rowName: string, quantity: CalibrationQuantity): CalibrationUse {
  const anchor = CALIBRATION_ANCHORS.find(
    (a) => rowName.includes(a.name) && a.quantities.includes(quantity)
  );
  const use = anchor?.use[quantity];
  if (use === undefined) {
    throw new Error(`No calibration role for "${rowName}" (${quantity})`);
  }
  return use;
}

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
      `| ${t.event.name} | ${recordedLabel(t)} | ${grouped(t.deaths)} | ${grouped(t.low)} – ${grouped(t.high)} | ${bandSpan(t.low, t.high)} | ${tollRatio(t)} | ${t.contains ? 'contains' : '**misses**'} | ${t.event.cause ?? '—'} | ${t.event.gated ? 'gated' : 'declared'} | ${ROLE_LABEL[useOf(t.event.name, 'toll').role]} |`
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
    'with its reason, and the reason is below. **Role** says whether the',
    'model was set on the event, which is under "Which checks are validation".',
    '',
    '| Event | Recorded | Model | Band (5–95 %) | Span | Model / record | Verdict | Cause | Standing | Role |',
    '|-------|---------:|------:|--------------:|-----:|---------------:|---------|-------|----------|------|',
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
    return `| ${w.wave.name} | ${range(o.atRangeM)} | ${observed} | ${metres(w.model)} | ${w.contains ? 'contains' : '**misses**'} | ${globe} | ${w.wave.gated ? 'gated' : 'declared'} | ${ROLE_LABEL[useOf(w.wave.name, 'wave').role]} |`;
  });
  const globeMisses = net.waves.filter((w) => w.globeContains === false);
  return [
    'Wave amplitudes against buoys, gauges, surveys and deposits. **Model** is',
    'the figure the harness computes and gates, asked of the veil on the',
    "globe's own per-cell law on a flat sea of the measured depth; **Globe",
    'draws** is printed wherever a row gates a different number — because a',
    'gate on a number the product does not show would be a gate on nothing.',
    'A height recorded from crest to trough is halved to the amplitude the',
    "model computes, and Crossroads Baker's figures carry Glasstone & Dolan's",
    'own 35 % accuracy for explosion waves.',
    '',
    '| Record | Range | Observed | Model | Verdict | Globe draws | Standing | Role |',
    '|--------|------:|---------:|------:|---------|------------:|----------|------|',
    ...rows,
    '',
    ...(globeMisses.length === 0
      ? []
      : [
          `**Where the globe misses a record the harness contains (${globeMisses.length.toString()}):** ${globeMisses.map((w) => w.wave.name).join('; ')}. The list is pinned empty in \`recordedWaves.test.ts\`, so a row here is a failure somebody has to explain.`,
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

const ROLE_MEANING: Readonly<Record<CalibrationRole, string>> = {
  tuned:
    'a coefficient, an input or a modelling choice in this repository was made with this row in view — set so the quantity comes out as recorded, or chosen because an alternative made the row worse.',
  inputInferred:
    'the scenario’s input is itself inferred, in the literature, from the quantity being checked, so agreement is partly by construction.',
  sameSource:
    'the published relation the model uses was fitted on data that include the event, or the “record” is read from a published relation rather than measured at the event.',
  heldOut: 'none of these, as far as the code and its cited sources show.',
  unestablished: 'not yet checked; the note says what is open.',
};

/** Held-out rows of one table, and how many of them contain their record. */
function heldOutTally<T>(
  rows: readonly T[],
  name: (row: T) => string,
  quantity: CalibrationQuantity,
  contains: (row: T) => boolean,
  recordsNothing: (row: T) => boolean
): HeldOut {
  const held = rows.filter((r) => useOf(name(r), quantity).role === 'heldOut');
  const inside = held.filter(contains);
  return { total: held.length, inside: inside.length, zeros: inside.filter(recordsNothing).length };
}

interface HeldOut {
  total: number;
  inside: number;
  /** Of those inside, the ones whose record is of nothing: no dead, no wave. */
  zeros: number;
}

function heldOutTallies(net: CalibrationNet): { tolls: HeldOut; waves: HeldOut } {
  return {
    tolls: heldOutTally(
      net.tolls,
      (t) => t.event.name,
      'toll',
      (t) => t.contains,
      (t) => t.event.recordedDeaths === 0
    ),
    waves: heldOutTally(
      net.waves,
      (w) => w.wave.name,
      'wave',
      (w) => w.contains,
      (w) => w.wave.observed.high <= 0
    ),
  };
}

/**
 * What the held-out rows that pass are made of. A zero from a place
 * nobody lives, or from a charge that never entered the water, checks
 * a rule rather than a number, and a reader deciding whether the model
 * has been validated needs that said beside the count.
 */
function zerosNote(held: { tolls: HeldOut; waves: HeldOut }): string {
  const inside = held.tolls.inside + held.waves.inside;
  const zeros = held.tolls.zeros + held.waves.zeros;
  if (inside === 0) return '';
  if (zeros === inside) {
    return ' Every held-out row inside its record is a record of nothing — no dead, or no wave — so no held-out row yet checks a number the model had to get right.';
  }
  return ` ${zeros.toString()} of the ${inside.toString()} held-out rows inside their record are a record of nothing — no dead, or no wave.`;
}

function rolesSection(net: CalibrationNet): string {
  const held = heldOutTallies(net);
  const { tolls, waves } = held;
  const checks = CALIBRATION_ANCHORS.flatMap((a) =>
    a.quantities.map((q) => ({ anchor: a, quantity: q, use: useOf(a.name, q) }))
  );
  const lines = [
    'A check the model was built to pass says the fit holds, not that the',
    'model is right. Every event above, and every golden case against a',
    'recorded event, carries one of these roles for each quantity it checks:',
    '',
    bullet(CALIBRATION_ROLES.map((r) => `**${ROLE_LABEL[r]}** — ${ROLE_MEANING[r]}`)),
    '',
    `Held out, the tables above read: death tolls **${tolls.inside.toString()} of ${tolls.total.toString()}** inside the band, waves **${waves.inside.toString()} of ${waves.total.toString()}** inside the record.${zerosNote(held)}`,
    '',
  ];
  for (const role of CALIBRATION_ROLES) {
    const these = checks.filter((c) => c.use.role === role);
    if (these.length === 0) continue;
    lines.push(
      `#### ${ROLE_LABEL[role][0]?.toUpperCase() ?? ''}${ROLE_LABEL[role].slice(1)} (${these.length.toString()})`,
      ''
    );
    for (const c of these) {
      lines.push(`**${c.anchor.name}, ${c.quantity}.** ${c.use.how}`, '');
    }
  }
  return lines.join('\n');
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
        .map(
          (q) =>
            `${q} (${a.gated.includes(q) ? 'gated' : 'declared'}, ${ROLE_LABEL[useOf(a.name, q).role]})`
        )
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

/** What the wave misses are, in one sentence, or nothing when there are none. */
function waveMissSummary(waves: readonly WaveComparison[]): string {
  const misses = waves.filter((w) => !w.contains);
  if (misses.length === 0) return '';
  const declared = misses.filter((w) => !w.wave.gated).length;
  return declared === misses.length
    ? ` All ${misses.length.toString()} misses are declared rows, each with its reason below.`
    : ` ${declared.toString()} of the ${misses.length.toString()} misses are declared rows, each with its reason below.`;
}

function summary(net: CalibrationNet, replay: AggregateBucket, golden: AggregateBucket): string {
  const tollGated = net.tolls.filter((t) => t.event.gated);
  const tollContains = net.tolls.filter((t) => t.contains);
  const waveContains = net.waves.filter((w) => w.contains);
  const bias = footprintBias(net.footprint);
  const invented = inventedBands(net.footprint);
  const held = heldOutTallies(net);
  const heldTolls = held.tolls;
  const heldWaves = held.waves;
  return bullet([
    `**Death tolls:** ${tollContains.length.toString()} of ${net.tolls.length.toString()} events inside the model's band; ${tollGated.filter((t) => t.contains).length.toString()} of ${tollGated.length.toString()} gated rows pass. Every miss carries its cause below.`,
    `**Waves:** ${waveContains.length.toString()} of ${net.waves.length.toString()} records inside the model's figure, which is the figure the globe draws wherever the table prints no second one${net.waves.some((w) => w.globeContains === false) ? `; the globe misses ${net.waves.filter((w) => w.globeContains === false).length.toString()} of the records the model contains` : ''}.${waveMissSummary(net.waves)}`,
    `**Shaking footprint:** centred at ${bias.geometricMeanRadiusRatio.toFixed(2)} in radius (${bias.biasInStandardErrors.toFixed(2)} standard errors), scatter σ_ln ${bias.sdLn.toFixed(2)} against 0.70 expected; ${invented.length.toString()} bands painted at an intensity never reached.`,
    `**Held out** — the rows nothing in the model was set on: death tolls ${heldTolls.inside.toString()} of ${heldTolls.total.toString()} inside the band, waves ${heldWaves.inside.toString()} of ${heldWaves.total.toString()}.${zerosNote(held)} The rest are fits, shared sources or inputs read back from the record, and each says which under "Which checks are validation".`,
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

### Which checks are validation

${rolesSection(net)}

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
  "**A warned coast evacuates on a timer, not on the shaking.** Volcanic scenarios carry the zone that was cleared before the eruption, and inside it the mortality measured at Merapi in 2010. Tsunamis do not yet: a warning with under half an hour of lead has no effect, and on Tōhoku's coast — where the wave itself is right, a median shore height of 9.5 m against a surveyed 8–15, and 57 % of surveyed evacuees left immediately after the shaking — the coastal toll is about three times the record for it (docs/ROADMAP.md, move 3b).",
  "**Distant coasts of very long ruptures get too small a wave, and the cause is not settled.** Sumatra's far coasts are five to ten times under-waved. The far-field law does not use the rupture length, but a naive line-source correction would take DART 21413 from 0.90× the record to about 3× (docs/ROADMAP.md, moves 3b and 3d).",
  '**The coastal toll needs bathymetry**, so no offline test reaches it: the death-toll rows above are the shaking, blast and pyroclastic tolls only, and the wave rows are open-ocean amplitudes. The coastal numbers are measured in the browser; docs/ROADMAP.md carries the console snippet that reproduces them.',
  "**No impact in recorded history left a death toll**, so an impact's toll will never be validated. The simulator says so beside every impact toll.",
  "**A burst on the surface of open water makes no wave here.** Glasstone & Dolan's wave relations are for a burst within the water, at any depth in it (§6.119), and give nothing for one on its surface, so the wave steps from nothing to the full relation as the charge goes under. The wider explosion-wave literature describes surface bursts that do make waves; until a relation is taken from it, the step stays and is said (docs/ROADMAP.md, M9 move 3).",
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
        cause: t.event.cause ?? null,
        role: useOf(t.event.name, 'toll').role,
        source: t.event.source,
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
        role: useOf(w.wave.name, 'wave').role,
        source: w.wave.source,
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
      anchors: CALIBRATION_ANCHORS.map((a) => ({
        name: a.name,
        eventType: a.eventType,
        quantities: a.quantities,
        gated: a.gated,
        use: Object.fromEntries(a.quantities.map((q) => [q, useOf(a.name, q)])),
        source: a.source,
      })),
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
