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
  BETWEEN_EVENT_RADIUS_SCATTER,
  compareFootprints,
  EXPECTED_RADIUS_SCATTER,
  footprintBias,
  inventedBands,
  type FootprintRow,
} from '../src/physics/validation/shakemapFootprint.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../src/physics/uq/conventions.js';
import { PLUME_HEIGHT_OBSERVATIONS } from '../src/physics/validation/fixtures.js';
import { comparePlume, type PlumeComparison } from '../src/physics/validation/plumeComparison.js';
import {
  isInformative,
  PREDICTIVE_BAND,
  scorecard,
  scoreStats,
  SIZE_BANDS,
  sizeBandOf,
  type ScoreCell,
  type ScoreRowInput,
  type ScoreStats,
  type ScoredQuantity,
} from '../src/physics/validation/scorecard.js';
import {
  RULE_EARTHQUAKES,
  RULE_PLUMES,
  RULE_SEEN_EARTHQUAKES,
  RULE_TUNED_EARTHQUAKES,
  ruleEarthquakeEvent,
  ruleSiteVs30,
  type RuleEarthquake,
  type RulePlume,
} from '../src/physics/validation/heldOutByRule.js';
import { NCEI_UNMATCHED, RULE_READ_ON } from '../src/physics/validation/heldOutByRuleData.js';
import {
  compareCandidates,
  compareContourLaws,
  compareSiteRules,
  contourPairs,
  type CandidateComparison,
  type ContourComparison,
  type SiteComparison,
} from '../src/physics/validation/contourComparison.js';
import { SITE_RULES, siteVs30, type SiteRule } from '../src/physics/validation/siteVs30.js';
import {
  DEPTH_CANDIDATES,
  falseAlarmShare,
  isQuiet,
  passesOnQuiet,
  type DepthCandidate,
  type UnseenEarthquake,
} from '../src/physics/validation/depthRules.js';
import {
  quietMedianTolls,
  unseenEarthquakeEvent,
  unseenShakemaps,
} from '../src/physics/validation/unseenSet.js';
import {
  UNSEEN_EARTHQUAKES,
  UNSEEN_LISTED,
  UNSEEN_READ_ON,
  UNSEEN_UNREADABLE,
  UNSEEN_WITHOUT_COVERAGE,
} from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { RULE_SITES, SITES_READ_ON } from '../src/physics/validation/siteVs30Data.js';
import { adoptOnTolls, CONTOUR_LAWS } from '../src/physics/validation/contourLaws.js';
import { RULE_SHAKEMAPS } from '../src/physics/validation/ruleShakemapData.js';
import type { ContourLaw } from '../src/physics/events/earthquake/simulate.js';
import {
  eiepRatios,
  simulateEiepRow,
  summariseEiep,
  type EiepQuantity,
  type EiepSummary,
} from '../src/physics/validation/eiepComparison.js';
import { EIEP_READ_ON, EIEP_REFERENCE } from '../src/physics/validation/eiepReference.js';
import {
  residualAgainstReference,
  verifyRings,
  type VerificationRow,
} from '../src/physics/validation/ringVerification.js';
import {
  PEOPLE_LEVELS,
  SHAKING_CHAINS,
  type ShakingChainName,
} from '../src/physics/validation/pagerChain.js';
import { runPagerChains, type PagerChainRun } from '../src/physics/validation/pagerChainRun.js';
import { PAGER_PRODUCTS_READ_ON } from '../src/physics/validation/pagerProductsData.js';
import {
  INTERFACE_LAWS,
  INTERFACE_READINGS,
  type InterfaceLaw,
  type InterfaceReading,
} from '../src/physics/validation/interfaceRules.js';
import {
  runInterfaceRules,
  type InterfaceRulesRun,
  type TollCells as InterfaceTollCells,
} from '../src/physics/validation/interfaceRulesRun.js';
import { INTERFACE_SET_READ_ON } from '../src/physics/validation/interfaceSetData.js';
import {
  INTERFACE_STADIUMS,
  recordedScore,
  STADIUM_CELLS,
  type RecordedRun,
} from '../src/physics/validation/interfaceStadiumRules.js';
import {
  runInterfaceStadium,
  seenRecordedBelow,
  type StadiumRun,
} from '../src/physics/validation/interfaceStadiumRun.js';
import { DEEP_INTERFACE_READ_ON } from '../src/physics/validation/deepInterfaceSetData.js';
import {
  LOW_INTENSITY_TOLLS,
  lowIntensityScore,
  type LowIntensityToll,
} from '../src/physics/validation/lowIntensityRules.js';
import {
  runLowIntensity,
  type LowIntensityRun,
  type ModerateRun,
} from '../src/physics/validation/lowIntensityRun.js';
import { MODERATE_READ_ON } from '../src/physics/validation/moderateSetData.js';
import {
  POINT_SOURCE_CANDIDATES,
  POINT_SOURCE_CELLS,
  POINT_SOURCE_INTERFACE_CANDIDATES,
  POINT_SOURCE_READINGS,
} from '../src/physics/validation/pointSourceRules.js';
import { runPointSource, type PointSourceRun } from '../src/physics/validation/pointSourceRun.js';
import { POINT_SOURCE_READ_ON } from '../src/physics/validation/pointSourceSetData.js';
import { shippedCountryAt } from '../src/physics/validation/shippedPopulation.js';
import { casualtyPlanForResult, configureCountryLookup } from '../src/store/useAppStore.js';
import { pagerFatalityRate } from '../src/physics/casualties.js';
import { pagerVulnerabilityFor } from '../src/physics/pagerVulnerability.js';
import { m } from '../src/physics/units.js';
import { simulateEarthquake } from '../src/physics/events/earthquake/simulate.js';
import { meanAbsoluteBias as meanAbsoluteLogBias } from '../src/physics/validation/contourLaws.js';
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
/** The anchor a row of the net belongs to, for its family and size. */
function anchorOf(
  rowName: string,
  quantity: CalibrationQuantity
): (typeof CALIBRATION_ANCHORS)[number] {
  const anchor = CALIBRATION_ANCHORS.find(
    (a) => rowName.includes(a.name) && a.quantities.includes(quantity)
  );
  if (anchor === undefined) throw new Error(`No anchor for "${rowName}" (${quantity})`);
  return anchor;
}

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
  plumes: PlumeComparison[];
  footprint: FootprintRow[];
  interpolation: InterpolationCost[];
}

function runCalibrationNet(): CalibrationNet {
  return {
    tolls: RECORDED_EVENTS.map(compareWithRecord),
    waves: RECORDED_WAVES.map(compareWave),
    plumes: PLUME_HEIGHT_OBSERVATIONS.map(comparePlume),
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
      `| ${c.event.name} | ${grouped(c.measured.low)} – ${grouped(c.measured.high)} | ${grouped(c.interpolated.low)} – ${grouped(c.interpolated.high)} | ${c.lowFactor.toFixed(2)}× / ${c.highFactor.toFixed(2)}× | ${!c.comparable ? 'too few dead' : c.lowComparable ? 'yes' : 'high end only'} |`
  );
  const worst = net.interpolation
    .filter((c) => c.comparable)
    .reduce((m, c) => Math.max(m, c.lowComparable ? c.lowFactor : 1, c.highFactor), 1);
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

/** Every row of the net the scorecard can score, as it scores them. */
function scoreInputs(net: CalibrationNet): ScoreRowInput[] {
  const input = (
    name: string,
    quantity: ScoredQuantity,
    fields: Pick<ScoreRowInput, 'record' | 'model' | 'inside' | 'bandDecades'>
  ): ScoreRowInput => {
    const anchor = anchorOf(name, quantity);
    const role = anchor.use[quantity]?.role;
    if (role === undefined) throw new Error(`No calibration role for "${name}" (${quantity})`);
    return {
      name,
      quantity,
      family: anchor.eventType,
      size: anchor.value,
      role,
      ...fields,
    };
  };
  return [
    ...net.tolls.map((t) =>
      input(t.event.name, 'toll', {
        record: t.event.recordedDeaths,
        model: t.deaths,
        inside: t.contains,
        bandDecades: Math.log10(Math.max(t.high, 1) / Math.max(t.low, 1)),
      })
    ),
    // A wave's record is a range; its geometric centre stands for it,
    // and a range that starts at zero has no centre to stand.
    ...net.waves.map((w) => {
      const { low, high } = w.wave.observed;
      return input(w.wave.name, 'wave', {
        record: high <= 0 ? 0 : low > 0 ? Math.sqrt(low * high) : null,
        model: w.model,
        inside: w.contains,
        bandDecades: null,
      });
    }),
    ...net.plumes.map((c) =>
      input(c.observation.event, 'plume', {
        record: c.observation.observedPlumeHeightKm,
        model: c.modelKm,
        inside: c.contains,
        bandDecades: null,
      })
    ),
  ];
}

const QUANTITY_LABEL: Readonly<Record<ScoredQuantity, string>> = {
  toll: 'Death tolls',
  wave: 'Waves',
  plume: 'Eruption columns',
};

function scoreFigures(s: ScoreStats, predictive: boolean): string[] {
  const inside =
    s.rows === 0
      ? '—'
      : `${s.inside.toString()} of ${s.rows.toString()}${predictive ? '' : ' accepted'}`;
  return [
    s.rows.toString(),
    s.scored.toString(),
    // Two significant figures below a tenth: a bias of 0.0019× is not 0.00×.
    s.bias === null ? '—' : `${s.bias >= 0.1 ? s.bias.toFixed(2) : s.bias.toPrecision(2)}×`,
    s.scatterLn === null ? '—' : s.scatterLn.toFixed(2),
    inside,
    `${s.bothZero.toString()} / ${s.falseAlarms.toString()} / ${s.missedToZero.toString()}`,
    // Rounded from the two decimals the JSON keeps, so the page and the
    // report print the same figure.
    s.medianBandDecades === null
      ? '—'
      : `10^${(Math.round(fixed(s.medianBandDecades, 2) * 10) / 10).toFixed(1)}`,
  ];
}

function scorecardSection(cells: readonly ScoreCell[]): string {
  const lines = [
    'How accurate and how precise the model is, scored on the rows nothing in the',
    'model was set on and, for comparison, on every row. **Bias** is the geometric',
    'mean of model over record (1.00× is unbiased) and **scatter** the standard',
    'deviation of ln(model / record), both over the rows where record and model',
    'are above zero — at least two of them, and read as indicative below five.',
    'Zeros are counted apart: both zero / a record of nothing where the model',
    'says something / a record where the model says nothing. For death tolls',
    '**inside** is the claim of the 5–95 % band, which should hold about nine',
    'records in ten while being as narrow as it can — calibration and sharpness,',
    'in Gneiting, Balabdaoui & Raftery (2007); for waves and columns it is an',
    'acceptance, not a probability. **Band** is the median width of the death',
    "toll's band. Each family is scored as a whole and by size — magnitude,",
    'energy, volume — because a custom scenario asks how good the model is near',
    'its own inputs.',
    '',
  ];
  const quantities: ScoredQuantity[] = ['toll', 'wave', 'plume'];
  for (const q of quantities) {
    const these = cells.filter((c) => c.quantity === q);
    if (these.length === 0) continue;
    lines.push(
      `#### ${QUANTITY_LABEL[q]}`,
      '',
      '| Family | Size | Held-out rows | Scored | Bias | Scatter σ_ln | Inside | Zeros | Band | All rows | Scored | Bias | Scatter σ_ln | Inside | Zeros | Band |',
      '|--------|------|--------------:|-------:|-----:|-------------:|--------|-------|-----:|---------:|-------:|-----:|-------------:|--------|-------|-----:|'
    );
    for (const c of these) {
      const predictive = PREDICTIVE_BAND[q];
      lines.push(
        `| ${c.sizeBand === null ? `**${c.family}**` : ''} | ${c.sizeBand ?? 'all sizes'} | ${[
          ...scoreFigures(c.heldOut, predictive),
          ...scoreFigures(c.all, predictive),
        ].join(' | ')} |`
      );
    }
    lines.push('');
  }
  return lines.join('\n');
}

/** A scorecard statistic as the JSON keeps it. */
function scoreJson(st: ScoreStats) {
  return {
    rows: st.rows,
    scored: st.scored,
    bias: st.bias === null ? null : Number(st.bias.toPrecision(3)),
    // Two decimals, as the report prints it: the page rounding a third
    // decimal would print a figure the report does not.
    scatterLn: st.scatterLn === null ? null : fixed(st.scatterLn, 2),
    inside: st.inside,
    bothZero: st.bothZero,
    falseAlarms: st.falseAlarms,
    missedToZero: st.missedToZero,
    medianBandDecades: st.medianBandDecades === null ? null : fixed(st.medianBandDecades, 2),
  };
}

// ---------------------------------------------------------------------
// Held out by rule: the sets heldOutByRule.ts chose (rules 11 to 16).
// ---------------------------------------------------------------------

interface RuleQuakeRun {
  quake: RuleEarthquake;
  toll: TollComparison;
  score: ScoreRowInput;
}

interface RulePlumeRun {
  plume: RulePlume;
  column: PlumeComparison;
  score: ScoreRowInput;
}

interface RuleSets {
  earthquakes: RuleQuakeRun[];
  plumes: RulePlumeRun[];
}

function runRuleSets(): RuleSets {
  return {
    earthquakes: RULE_EARTHQUAKES.map((quake) => {
      const toll = compareWithRecord(quake.event);
      return {
        quake,
        toll,
        score: {
          name: quake.event.name,
          quantity: 'toll',
          family: 'earthquake',
          size: quake.row.magnitude,
          role: quake.role,
          record: quake.event.recordedDeaths,
          model: toll.deaths,
          inside: toll.contains,
          bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
          bandHigh: toll.high,
        },
      };
    }),
    plumes: RULE_PLUMES.map((plume) => {
      const column = comparePlume(plume.observation);
      return {
        plume,
        column,
        score: {
          name: plume.observation.event,
          quantity: 'plume',
          family: 'volcano',
          size: plume.volumeM3,
          role: plume.role,
          record: plume.observation.observedPlumeHeightKm,
          model: column.modelKm,
          inside: column.contains,
          bandDecades: null,
        },
      };
    }),
  };
}

interface RuleCell {
  kind: 'all' | 'size' | 'morphology';
  /** The size band or the plume morphology; null for the whole set. */
  group: string | null;
  all: ScoreStats;
  /** The rows whose record or band is above zero (`isInformative`). */
  informative: ScoreStats;
  /** Those rows, less the ones run in the net before the rule. */
  unseen: ScoreStats;
}

function ruleCell<T extends { score: ScoreRowInput }>(
  kind: RuleCell['kind'],
  group: string | null,
  rows: readonly T[],
  seen: (row: T) => boolean
): RuleCell {
  const informative = rows.filter((r) => isInformative(r.score));
  return {
    kind,
    group,
    all: scoreStats(rows.map((r) => r.score)),
    informative: scoreStats(informative.map((r) => r.score)),
    unseen: scoreStats(informative.filter((r) => !seen(r)).map((r) => r.score)),
  };
}

const PLUME_MORPHOLOGIES = ['strong', 'weak', 'Unknown'] as const;

const MORPHOLOGY_LABEL: Readonly<Record<(typeof PLUME_MORPHOLOGIES)[number], string>> = {
  strong: 'strong plumes',
  weak: 'weak plumes',
  Unknown: 'morphology not given',
};

function ruleCells(sets: RuleSets): { earthquakes: RuleCell[]; plumes: RuleCell[] } {
  const quakes = sets.earthquakes.filter((e) => e.quake.role === 'heldOut');
  const plumes = sets.plumes.filter((p) => p.plume.role === 'heldOut');
  const quakeSeen = (e: RuleQuakeRun): boolean => e.quake.seen;
  const plumeSeen = (p: RulePlumeRun): boolean => p.plume.seen;
  return {
    earthquakes: [
      ruleCell('all', null, quakes, quakeSeen),
      ...SIZE_BANDS.earthquake.map((b) =>
        ruleCell(
          'size',
          b.label,
          quakes.filter((e) => sizeBandOf('earthquake', e.score.size) === b.label),
          quakeSeen
        )
      ),
    ].filter((c) => c.all.rows > 0),
    plumes: [
      ruleCell('all', null, plumes, plumeSeen),
      ...PLUME_MORPHOLOGIES.map((m) =>
        ruleCell(
          'morphology',
          m,
          plumes.filter((p) => p.plume.row.morphology === m),
          plumeSeen
        )
      ),
      ...SIZE_BANDS.volcano.map((b) =>
        ruleCell(
          'size',
          b.label,
          plumes.filter((p) => sizeBandOf('volcano', p.score.size) === b.label),
          plumeSeen
        )
      ),
    ].filter((c) => c.all.rows > 0),
  };
}

function biasText(s: ScoreStats): string {
  return s.bias === null ? '—' : `${s.bias >= 0.1 ? s.bias.toFixed(2) : s.bias.toPrecision(2)}×`;
}

function shareText(inside: number, rows: number): string {
  if (rows === 0) return '—';
  return `${inside.toString()} of ${rows.toString()} (${Math.round((100 * inside) / rows).toString()} %)`;
}

function cellText(s: string): string {
  return s.replace(/\|/g, '\\|');
}

function ruleRecord(e: RuleQuakeRun): string {
  const { deaths, missing } = e.quake.row;
  return missing > 0 ? `${grouped(deaths)} (+${grouped(missing)} missing)` : grouped(deaths);
}

const CONTOUR_LAW_LABEL: Readonly<Record<ContourLaw, string>> = {
  joynerBoore1981: 'Joyner & Boore 1981',
  boore2014: 'Boore et al. 2014',
  'boore2014FromMw7.5': 'Joyner & Boore below Mw 7.5, Boore et al. from it',
  allen2012Hypocentral: 'Allen, Wald & Worden 2012, hypocentral',
  'allen2012HypocentralBelowMw7.5': 'Allen et al. below Mw 7.5, Boore et al. from it',
  abrahamson2016Interface: 'Abrahamson, Gregor & Addo 2016 on the interface',
  parker2022Interface: 'Parker et al. 2022 on the interface',
};

type TollCells = { group: string; stats: ScoreStats }[];

/** Rule 19's toll cells for one law on one ground: the held-out rows of
 *  rule 11's set run on them, scored per magnitude cell over the rows
 *  with something. */
function ruleTollCells(law: ContourLaw, ground: SiteRule): TollCells {
  const rows = RULE_EARTHQUAKES.filter((q) => q.role === 'heldOut').map((q) => {
    const toll = compareWithRecord(
      ruleEarthquakeEvent(q.row, { contourLaw: law, vs30: ruleSiteVs30(q.row, ground) })
    );
    const score: ScoreRowInput = {
      name: q.event.name,
      quantity: 'toll',
      family: 'earthquake',
      size: q.row.magnitude,
      role: q.role,
      record: q.event.recordedDeaths,
      model: toll.deaths,
      inside: toll.contains,
      bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
      bandHigh: toll.high,
    };
    return score;
  });
  return SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      rows.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

interface ContourLawRun {
  comparison: ContourComparison;
  tolls: Record<'joynerBoore1981' | 'boore2014', TollCells>;
  adopted: boolean;
}

const tollTest = (cells: TollCells) =>
  cells.map((c) => ({ bias: c.stats.bias, inside: c.stats.inside, rows: c.stats.rows }));

/** Rules 17 to 19, as they ran: every earthquake on rock. */
function runContourLaws(): ContourLawRun {
  const comparison = compareContourLaws(RULE_SHAKEMAPS, { inPlace: 'joynerBoore1981' });
  const tolls = {
    joynerBoore1981: ruleTollCells('joynerBoore1981', 'rock'),
    boore2014: ruleTollCells('boore2014', 'rock'),
  };
  return {
    comparison,
    tolls,
    adopted: adoptOnTolls(tollTest(tolls.joynerBoore1981), tollTest(tolls.boore2014)),
  };
}

interface GroundRun {
  sites: SiteComparison;
  /** Boore et al. 2014's held-out tolls on each ground. */
  tolls: Record<SiteRule, TollCells>;
  /** Rule 21: a winner other than the browser's ground passed on the dead. */
  siteAdopted: boolean;
  standing: SiteRule;
  /** Rule 22, on the ground that stands. */
  laws: ContourComparison;
  lawTolls: TollCells | null;
  lawAdopted: boolean;
}

/** Rules 20 to 22 (siteVs30.ts), run on the sites stored by rule 20. */
function runGround(sets: RuleSets, rockTolls: TollCells): GroundRun {
  const sites = compareSiteRules(
    RULE_SHAKEMAPS,
    new Map(RULE_SITES.map((site) => [site.key, site])),
    'boore2014'
  );
  // The sets held out by rule have just been run on the browser's ground
  // with Boore et al. 2014, the harness's default since rule 22.
  const pick = SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      sets.earthquakes
        .filter((e) => e.quake.role === 'heldOut')
        .map((e) => e.score)
        .filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
  const tolls: Record<SiteRule, TollCells> = {
    pick,
    rock: rockTolls,
    pickOnLand: ruleTollCells('boore2014', 'pickOnLand'),
  };
  const siteAdopted =
    sites.winner !== 'pick' && adoptOnTolls(tollTest(tolls.pick), tollTest(tolls[sites.winner]));
  const standing: SiteRule = siteAdopted ? sites.winner : 'pick';
  const laws = compareContourLaws(RULE_SHAKEMAPS, {
    inPlace: 'boore2014',
    vs30For: (row) => ruleSiteVs30(row, standing),
  });
  const lawTolls = laws.winner === 'boore2014' ? null : ruleTollCells(laws.winner, standing);
  const lawAdopted =
    lawTolls !== null && adoptOnTolls(tollTest(tolls[standing]), tollTest(lawTolls));
  // The harness and the browser stand on the browser's ground with Boore
  // et al. 2014. Rules that leave anything else have not been followed by
  // the code, and a report that printed them beside it would be wrong.
  if (standing !== 'pick' || lawAdopted) {
    throw new Error(
      `Rules 21 and 22 now leave ${standing} with ${lawAdopted ? laws.winner : 'boore2014'}; the harness runs pick with boore2014`
    );
  }
  return { sites, tolls, siteAdopted, standing, laws, lawTolls, lawAdopted };
}

function contourLawSection(run: ContourLawRun): string {
  const radius = (bias: number | null): string =>
    bias === null ? '—' : `${Math.exp(bias).toFixed(2)}×`;
  const { comparison } = run;
  const shakemapRows = CONTOUR_LAWS.map((law) => {
    const cells = comparison.scores[law];
    const invented = cells.reduce((a, c) => a + c.invented, 0);
    const missed = cells.reduce((a, c) => a + c.missed, 0);
    return `| ${CONTOUR_LAW_LABEL[law]}${law === comparison.winner ? ' (winner)' : ''} | ${cells.map((c) => radius(c.bias)).join(' | ')} | ${comparison.meanAbsoluteBias[law].toFixed(2)} | ${invented.toString()} | ${missed.toString()} |`;
  });
  const tollRow = (law: 'joynerBoore1981' | 'boore2014'): string =>
    `| ${CONTOUR_LAW_LABEL[law]} | ${run.tolls[law]
      .map(
        (c) => `${biasText(c.stats)} · ${c.stats.inside.toString()} of ${c.stats.rows.toString()}`
      )
      .join(' | ')} |`;
  return [
    'Rules 17 to 19 (`validation/contourLaws.ts`), committed before any candidate ran,',
    'choose the law on shaking and check it on the dead, with every earthquake on',
    "reference rock as they ran (the next section moves it). Rule 18: each candidate's",
    `ground area at MMI VII, VIII and IX against the USGS ShakeMaps of ${comparison.events.toString()} earthquakes of rule 11's set, as a`,
    'radius ratio floored at 10 km² per band, by magnitude cell; the winner has the smallest',
    'mean absolute log bias over the cells, and the law used before stays unless beaten by',
    '0.05.',
    '',
    `| Law | ${SIZE_BANDS.earthquake.map((b) => b.label).join(' | ')} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...shakemapRows,
    '',
    "Rule 19: the winner on rule 11's held-out tolls, beside the law used before — bias over the rows where record and model are both above zero, and the band's share inside over the rows with something. It is adopted if its mean absolute log bias is no larger and it holds eight records in ten in every cell.",
    '',
    `| Law | ${SIZE_BANDS.earthquake.map((b) => b.label).join(' | ')} |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|`,
    tollRow('joynerBoore1981'),
    tollRow('boore2014'),
    '',
    `Adopted: ${run.adopted ? 'yes' : 'no'}. The score's floor counts a band the model paints and the ShakeMap never reached, and most of Boore et al. 2014's margin is there: where both reach MMI VII it draws the ring smaller than the ShakeMap, about half its radius between Mw 6.5 and 7.5 (docs/SCIENCE.md, "Which law draws the rings").`,
  ].join('\n');
}

const GROUND_LABEL: Readonly<Record<SiteRule, string>> = {
  pick: "The browser's slope under the pick",
  rock: 'Rock, 760 m/s',
  pickOnLand: 'The slope on land, rock under the sea',
};

/** Mean absolute log toll bias over the cells that have one. */
function tollLogBias(cells: TollCells): number {
  const logs = cells
    .map((c) => c.stats.bias)
    .filter((b): b is number => b !== null && b > 0)
    .map((b) => Math.abs(Math.log(b)));
  return logs.length === 0 ? Number.NaN : logs.reduce((a, b) => a + b, 0) / logs.length;
}

function groundSection(run: GroundRun): string {
  const radius = (bias: number | null): string =>
    bias === null ? '—' : `${Math.exp(bias).toFixed(2)}×`;
  const cellsText = (cells: TollCells): string =>
    cells
      .map(
        (c) => `${biasText(c.stats)} · ${c.stats.inside.toString()} of ${c.stats.rows.toString()}`
      )
      .join(' | ');
  const vs30s = RULE_SITES.map((site) => site.vs30).sort((a, b) => a - b);
  const medianVs30 = vs30s[Math.floor(vs30s.length / 2)] ?? Number.NaN;
  const atSea = RULE_SITES.filter((site) => site.elevationM < 0).length;
  const { sites, laws } = run;
  const bandsHeader = SIZE_BANDS.earthquake.map((b) => b.label).join(' | ');
  const shakemapRow = (
    label: string,
    cells: readonly { bias: number | null; invented: number; missed: number }[],
    mab: number,
    winner: boolean
  ): string =>
    `| ${label}${winner ? ' (winner)' : ''} | ${cells.map((c) => radius(c.bias)).join(' | ')} | ${mab.toFixed(2)} | ${cells.reduce((a, c) => a + c.invented, 0).toString()} | ${cells.reduce((a, c) => a + c.missed, 0).toString()} |`;
  const siteVerdict =
    sites.winner === 'pick'
      ? "The browser's ground is not beaten by 0.05 on the ShakeMaps, and stands."
      : `${GROUND_LABEL[sites.winner]} beats the browser's ground on the ShakeMaps by ${(sites.meanAbsoluteBias.pick - sites.meanAbsoluteBias[sites.winner]).toFixed(2)}; on the tolls its mean absolute log bias is ${tollLogBias(run.tolls[sites.winner]).toFixed(2)} against ${tollLogBias(run.tolls.pick).toFixed(2)}, so by rule 21 it is ${run.siteAdopted ? 'adopted' : "not adopted, and the browser's ground stands"}. Rule 21 checks only the ShakeMap winner on the tolls.`;
  const lawVerdict =
    laws.winner === 'boore2014'
      ? 'Boore et al. 2014 is not beaten by 0.05, and stays.'
      : `${CONTOUR_LAW_LABEL[laws.winner]} beats Boore et al. 2014 on the ShakeMaps; on the tolls it reads ${run.lawTolls === null ? '—' : cellsText(run.lawTolls)}, and it is ${run.lawAdopted ? 'adopted' : 'not adopted'}.`;
  return [
    'Rules 17 to 19 stood every earthquake on reference rock; the browser gives the simulator',
    'the Vs30 of the slope under the pick. Rules 20 to 22 (`validation/siteVs30.ts`), committed',
    "before any row ran on other ground, read the browser's ground under every epicentre",
    `(rule 20: the terrain tiles it would fetch, read on ${SITES_READ_ON}; median ${Math.round(medianVs30).toString()} m/s, ${atSea.toString()} of ${RULE_SITES.length.toString()} epicentres under the sea),`,
    "choose the ground as rule 18 chooses a law, with Boore et al. 2014, the browser's ground",
    'staying unless beaten by 0.05 and a winner checked on the tolls as rule 19 checks a law',
    '(rule 21), and choose the law once more on the ground that stands (rule 22).',
    '',
    `| Ground | ${bandsHeader} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|--------|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...SITE_RULES.map((rule) =>
      shakemapRow(
        GROUND_LABEL[rule],
        sites.scores[rule],
        sites.meanAbsoluteBias[rule],
        rule === sites.winner
      )
    ),
    '',
    "Boore et al. 2014's held-out tolls on each ground, bias and inside as in rule 19's table:",
    '',
    `| Ground | ${bandsHeader} | Mean abs. log bias |`,
    `|--------|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|----:|`,
    ...SITE_RULES.map(
      (rule) =>
        `| ${GROUND_LABEL[rule]} | ${cellsText(run.tolls[rule])} | ${tollLogBias(run.tolls[rule]).toFixed(2)} |`
    ),
    '',
    `${siteVerdict} Rule 22, on ${run.standing === 'pick' ? "the browser's ground" : GROUND_LABEL[run.standing].toLowerCase()}:`,
    '',
    `| Law | ${bandsHeader} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...CONTOUR_LAWS.map((law) =>
      shakemapRow(
        CONTOUR_LAW_LABEL[law],
        laws.scores[law],
        laws.meanAbsoluteBias[law],
        law === laws.winner
      )
    ),
    '',
    `${lawVerdict} Every earthquake this report scores stands on the browser's ground since, the net's and the footprint anchors' included; the tables of rules 17 to 19 above are on rock, as those rules ran (docs/SCIENCE.md, "The ground under the rings").`,
  ].join('\n');
}

const UNSEEN_SITE_MAP = new Map(UNSEEN_SITES.map((site) => [site.key, site]));
const unseenVs30 = (row: { comcat: string }): number | undefined =>
  siteVs30('pick', UNSEEN_SITE_MAP.get(row.comcat));

interface DepthRun {
  unseen: CandidateComparison<DepthCandidate>;
  seen: CandidateComparison<DepthCandidate>;
  /** Rule 25: rule 11's held-out tolls, for the law in place and a
   *  winner other than it. */
  tolls: Partial<Record<DepthCandidate, TollCells>>;
  /** Rule 25: the share of quiet earthquakes whose median toll is ten or
   *  more. */
  quietShare: Partial<Record<DepthCandidate, number>>;
  /** The set's recorded tolls, which decide nothing. */
  recorded: Partial<Record<DepthCandidate, TollCells>>;
  adopted: boolean;
}

/** The set's recorded (not quiet) earthquakes under one law, scored per
 *  magnitude cell over the rows with something. */
function unseenRecordedCells(law: DepthCandidate): TollCells {
  const rows = UNSEEN_EARTHQUAKES.filter((q) => !isQuiet(q)).map((q: UnseenEarthquake) => {
    const event = unseenEarthquakeEvent(q, { contourLaw: law, vs30: unseenVs30(q) });
    const toll = compareWithRecord(event);
    const score: ScoreRowInput = {
      name: event.name,
      quantity: 'toll',
      family: 'earthquake',
      size: q.magnitude,
      role: 'heldOut',
      record: event.recordedDeaths,
      model: toll.deaths,
      inside: toll.contains,
      bandDecades: Math.log10(Math.max(toll.high, 1) / Math.max(toll.low, 1)),
      bandHigh: toll.high,
    };
    return score;
  });
  return SIZE_BANDS.earthquake.map((b) => ({
    group: b.label,
    stats: scoreStats(
      rows.filter((r) => sizeBandOf('earthquake', r.size) === b.label && isInformative(r))
    ),
  }));
}

/** Rules 23 to 26 (depthRules.ts), run on the set stored by rule 23. */
function runDepth(inPlaceTolls: TollCells): DepthRun {
  const unseen = compareCandidates(
    DEPTH_CANDIDATES,
    'boore2014',
    unseenShakemaps(UNSEEN_EARTHQUAKES),
    UNSEEN_EARTHQUAKES,
    unseenVs30
  );
  const seen = compareCandidates(
    DEPTH_CANDIDATES,
    'boore2014',
    RULE_SHAKEMAPS,
    RULE_EARTHQUAKES.map((q) => q.row),
    (row) => ruleSiteVs30(row)
  );
  const tolls: Partial<Record<DepthCandidate, TollCells>> = { boore2014: inPlaceTolls };
  const quietShare: Partial<Record<DepthCandidate, number>> = {
    boore2014: falseAlarmShare(quietMedianTolls(UNSEEN_EARTHQUAKES, 'boore2014', unseenVs30)),
  };
  const recorded: Partial<Record<DepthCandidate, TollCells>> = {
    boore2014: unseenRecordedCells('boore2014'),
  };
  let adopted = false;
  if (unseen.winner !== 'boore2014') {
    const winner = unseen.winner;
    tolls[winner] = ruleTollCells(winner, 'pick');
    quietShare[winner] = falseAlarmShare(quietMedianTolls(UNSEEN_EARTHQUAKES, winner, unseenVs30));
    recorded[winner] = unseenRecordedCells(winner);
    adopted =
      adoptOnTolls(tollTest(inPlaceTolls), tollTest(tolls[winner])) &&
      passesOnQuiet(quietShare.boore2014 ?? 0, quietShare[winner]);
  }
  // The simulator and the harness draw the rings with Boore et al. 2014.
  // A rule that adopts another law has not been followed by the code yet.
  if (adopted) {
    throw new Error(`Rule 25 adopts ${unseen.winner}; the simulator still draws boore2014`);
  }
  return { unseen, seen, tolls, quietShare, recorded, adopted };
}

const CHAIN_LABEL: Readonly<Record<ShakingChainName, string>> = {
  inPlace: 'In place: PGA, the rings at 7, 8 and 9',
  pager: "PAGER's: PGV, PAGER's bands",
  pgaWithPagerBands: "Half: PGA, PAGER's bands",
  pgvWithRings: 'Half: PGV, the rings at 7, 8 and 9',
};

const CHAIN_NAMES = Object.keys(SHAKING_CHAINS) as ShakingChainName[];

/** Rules 31 to 34 (pagerChain.ts), run on the products stored first. */
function runPager(): PagerChainRun {
  const run = runPagerChains();
  // The simulator and the harness draw the chain in place. A rule that
  // adopts PAGER's has not been followed by the code yet.
  if (run.decision.adopted) {
    throw new Error("Rule 33 adopts PAGER's chain; the simulator still draws the chain in place");
  }
  return run;
}

function runInterface(): InterfaceRulesRun {
  const run = runInterfaceRules();
  // Scenarios marked a subduction interface still draw Boore et al. 2014.
  // A rule that adopts another law has not been followed by the code yet.
  if (run.dead?.decision.adopted === true) {
    throw new Error(`Rule 38 adopts ${run.choice.winner}; the simulator still draws boore2014`);
  }
  return run;
}

const INTERFACE_READING_LABEL: Readonly<Record<InterfaceReading, string>> = {
  rule11Rock: "Rule 11's maps, rock",
  rule11Ground: "Rule 11's maps, browser's ground",
  rule23Rock: "Rule 23's maps, rock",
  rule23Ground: "Rule 23's maps, browser's ground",
};

function interfaceSection(run: InterfaceRulesRun): string {
  const radius = (bias: number | null): string =>
    bias === null ? '—' : `${Math.exp(bias).toFixed(2)}×`;
  const bandsHeader = SIZE_BANDS.earthquake.map((b) => b.label).join(' | ');
  const cellRow = (
    law: InterfaceLaw,
    cells: readonly { bias: number | null; pairs: number; invented: number; missed: number }[]
  ): string =>
    `| ${CONTOUR_LAW_LABEL[law]} | ${cells.map((c) => `${radius(c.bias)} (${c.pairs.toString()})`).join(' | ')} | ${meanAbsoluteLogBias(cells).toFixed(2)} | ${cells.reduce((a, c) => a + c.invented, 0).toString()} | ${cells.reduce((a, c) => a + c.missed, 0).toString()} |`;
  const sum = (law: InterfaceLaw): number =>
    INTERFACE_READINGS.reduce((a, reading) => a + run.choice.meanAbsoluteBias[reading][law], 0);
  const choiceRows = INTERFACE_LAWS.map(
    (law) =>
      `| ${CONTOUR_LAW_LABEL[law]}${law === run.choice.winner ? ' (winner)' : run.choice.eligible.includes(law) ? ' (eligible)' : ''} | ${INTERFACE_READINGS.map((reading) => run.choice.meanAbsoluteBias[reading][law].toFixed(2)).join(' | ')} | ${sum(law).toFixed(2)} |`
  );
  const tollLine = (law: InterfaceLaw, cells: InterfaceTollCells): string => {
    const logs = cells
      .map((c) => (c.stats.bias === null ? null : Math.abs(Math.log(c.stats.bias))))
      .filter((x): x is number => x !== null);
    const mab = logs.length === 0 ? null : logs.reduce((a, b) => a + b, 0) / logs.length;
    const quiet = run.dead?.quiet[law];
    return `| ${CONTOUR_LAW_LABEL[law]} | ${cells.map((c) => `${biasText(c.stats)} · ${c.stats.inside.toString()} of ${c.stats.rows.toString()}`).join(' | ')} | ${mab === null ? '—' : mab.toFixed(2)} | ${quiet === undefined ? '—' : `${(100 * quiet.share).toFixed(1)} % of ${quiet.quiet.toString()}`} |`;
  };
  const dead = run.dead;
  const verdict =
    dead === null
      ? 'No candidate beats Boore et al. 2014 by 0.05 in every reading, so by rule 37 it stays and nothing runs on the dead.'
      : dead.decision.adopted
        ? `By rule 38 ${CONTOUR_LAW_LABEL[run.choice.winner]} draws the rings of a scenario marked a subduction interface.`
        : `${CONTOUR_LAW_LABEL[run.choice.winner]} wins on the shaking, and by rule 38 Boore et al. 2014 stays: ${[
            dead.decision.tolls
              ? null
              : "on rule 11's held-out tolls its band holds fewer than eight records in ten, among the rows with something, in some magnitude cell, or its bias is larger",
            dead.decision.quiet ? null : 'it raises more quiet earthquakes to a median toll of ten',
          ]
            .filter((x): x is string => x !== null)
            .join(', and ')}.`;
  const families = Object.entries(run.beside.byModelSet);
  const presetRows = [...new Set(run.beside.presets.map((p) => p.preset))].map((preset) => {
    const cellsFor = (law: InterfaceLaw): string => {
      const found = run.beside.presets.find((p) => p.preset === preset && p.law === law);
      return found === undefined ? '—' : found.radiiKm.map((r) => r.toFixed(0)).join(' · ');
    };
    return `| ${preset} | ${INTERFACE_LAWS.map(cellsFor).join(' | ')} |`;
  });
  return [
    "The benchmark campaign drew the megathrust presets' rings at 4.2 and 6.0 times two",
    "interface models' distances (docs/BENCHMARK_REPORT.md, BM-10). Rules 35 to 39",
    '(`validation/interfaceRules.ts`), committed before either candidate was coded, choose whether',
    'a scenario marked a subduction interface should draw its rings with Abrahamson, Gregor & Addo',
    '2016 or Parker et al. 2022 instead, on the ShakeMaps USGS drew with its interface models (read',
    `on ${INTERFACE_SET_READ_ON}: ${run.events.rule11.toString()} earthquakes of rule 11's set and ${run.events.rule23.toString()} of rule 23's), every law run`,
    'on the scenario marked a subduction interface. A candidate must lower the mean absolute log',
    "radius ratio by 0.05 in all four readings, then pass rule 19's test on rule 11's held-out tolls",
    "and rule 25's on rule 23's quiet earthquakes. Since rules 40 to 44 below, a marked scenario is",
    'a stadium from Mw 7.5 only, so these are the figures under that geometry; the rules ran once, on',
    '15 September 2026, on the stadium at every magnitude, and docs/SCIENCE.md gives those figures.',
    '',
    `| Law | ${INTERFACE_READINGS.map((r) => INTERFACE_READING_LABEL[r]).join(' | ')} | Sum |`,
    `|-----|${INTERFACE_READINGS.map(() => '----:').join('|')}|----:|`,
    ...choiceRows,
    '',
    `Rule 11's maps on the browser's ground, by magnitude cell (the radius ratio, with its pairs):`,
    '',
    `| Law | ${bandsHeader} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...INTERFACE_LAWS.map((law) => cellRow(law, run.scores.rule11Ground[law])),
    '',
    ...(dead === null
      ? [verdict]
      : [
          `| Law | Rule 11's held-out tolls: ${bandsHeader} | Mean abs. log bias | Quiet earthquakes with a median toll of ten or more |`,
          `|-----|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|----:|----:|`,
          ...INTERFACE_LAWS.filter((law) => dead.tolls[law] !== undefined).map((law) =>
            tollLine(law, dead.tolls[law] ?? [])
          ),
          '',
          verdict,
        ]),
    '',
    `Printed beside, deciding nothing (rule 39): the ${run.beside.stationsEvents.toString()} maps with ten seismic stations or more, on the browser's ground,`,
    '',
    `| Law | ${bandsHeader} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...INTERFACE_LAWS.map((law) => cellRow(law, run.beside.stations[law])),
    '',
    "and the maps apart by the interface models ShakeMap drew them with, which include BC Hydro's form (NSHMP 2014, Chile) or Parker et al.'s (NSHMP 2023):",
    '',
    `| Law | ${families.map(([family, set]) => `${family} (${set.events.toString()})`).join(' | ')} |`,
    `|-----|${families.map(() => '----:').join('|')}|`,
    ...INTERFACE_LAWS.map(
      (law) =>
        `| ${CONTOUR_LAW_LABEL[law]} | ${families.map(([, set]) => meanAbsoluteLogBias(set.cells[law]).toFixed(2)).join(' | ')} |`
    ),
    '',
    "The megathrust presets' rings under each law, MMI VII · VIII · IX beyond the rupture's stadium (km):",
    '',
    `| Preset | ${INTERFACE_LAWS.map((law) => CONTOUR_LAW_LABEL[law]).join(' | ')} |`,
    `|--------|${INTERFACE_LAWS.map(() => '----:').join('|')}|`,
    ...presetRows,
  ].join('\n');
}

function runStadium(): StadiumRun {
  const run = runInterfaceStadium();
  // What a scenario marked a subduction interface draws below Mw 7.5 when
  // it names no geometry must be what rules 42 and 43 decided.
  const drawn = simulateEarthquake({ magnitude: 7, subductionInterface: true }).isExtendedSource
    ? 'always'
    : 'fromMw7.5';
  const decided = run.dead?.decision.adopted === true ? 'fromMw7.5' : 'always';
  if (drawn !== decided) {
    throw new Error(`Rules 42 and 43 decide ${decided}; the simulator draws ${drawn}`);
  }
  return run;
}

const STADIUM_LABEL: Readonly<Record<(typeof INTERFACE_STADIUMS)[number], string>> = {
  always: 'A stadium at every magnitude',
  'fromMw7.5': 'A stadium from Mw 7.5, a disc below',
};

function stadiumSection(run: StadiumRun): string {
  const radius = (bias: number | null): string =>
    bias === null ? '—' : `${Math.exp(bias).toFixed(2)}×`;
  const below = <T extends { sizeBand: string }>(cells: readonly T[]): T[] =>
    cells.filter((c) => STADIUM_CELLS.includes(c.sizeBand));
  const cellRow = (
    label: string,
    cells: readonly {
      sizeBand: string;
      bias: number | null;
      pairs: number;
      invented: number;
      missed: number;
    }[]
  ): string => {
    const kept = below(cells);
    return `| ${label} | ${kept.map((c) => `${radius(c.bias)} (${c.pairs.toString()})`).join(' | ')} | ${meanAbsoluteLogBias(kept).toFixed(2)} | ${kept.reduce((a, c) => a + c.invented, 0).toString()} | ${kept.reduce((a, c) => a + c.missed, 0).toString()} |`;
  };
  const insideText = (rows: readonly RecordedRun[]): string =>
    STADIUM_CELLS.map(
      (cell) =>
        `${rows.filter((r) => r.sizeBand === cell && r.inside).length.toString()} of ${rows.filter((r) => r.sizeBand === cell).length.toString()}`
    ).join(' · ');
  const dead = run.dead;
  const verdict =
    dead === null
      ? 'The disc is not better by 0.05 on the maps, so by rule 42 the stadium stays and nothing runs on the dead.'
      : dead.decision.adopted
        ? 'By rules 42 and 43 the disc is adopted: a scenario marked a subduction interface is a rupture stadium from Mw 7.5 only, in the simulator and in the harness, the runs of rules 35 to 39 above included.'
        : `By rule 43 the stadium stays: ${[
            dead.decision.quiet ? null : 'the disc raises more quiet earthquakes to a toll of ten',
            dead.decision.recorded
              ? null
              : 'the disc holds fewer records in a cell or reads them worse',
          ]
            .filter((x): x is string => x !== null)
            .join(', and ')}.`;
  const seenRows = Object.entries(run.beside.seen).map(
    ([reading, cells]) =>
      `| ${reading.replace('rule11', "Rule 11's maps, ").replace('rule23', "Rule 23's maps, ").replace('Rock', 'rock').replace('Ground', "browser's ground")} | ${INTERFACE_STADIUMS.map((g) => meanAbsoluteLogBias(below(cells[g])).toFixed(2)).join(' | ')} |`
  );
  const seenTolls = INTERFACE_STADIUMS.map((g) => {
    const rows = seenRecordedBelow(g);
    return `| ${STADIUM_LABEL[g]} | ${recordedScore(rows).toFixed(2)} | ${insideText(rows)} |`;
  });
  return [
    'A scenario marked a subduction interface was a rupture stadium at every magnitude, where any',
    'other becomes one from Mw 7.5. Rules 40 to 44 (`validation/interfaceStadiumRules.ts`), committed',
    'before either geometry was run on the earthquakes they name, put the stadium below Mw 7.5 to',
    `earthquakes no rule had read: ComCat's M 6 to 7.5 earthquakes of 2008 to 2025 deeper than 40 km and no deeper than 70 (read on ${DEEP_INTERFACE_READ_ON}), of which ${run.events.interface.toString()} are interface earthquakes by rule 35's weight, ${run.events.quiet.toString()} of them quiet.`,
    "On reference rock, the disc must lower rule 18's score below Mw 7.5 by 0.05, raise no more quiet",
    'earthquakes to a toll of ten, hold no fewer records in either cell and read them no worse.',
    '',
    `| Geometry | ${STADIUM_CELLS.join(' | ')} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|----------|${STADIUM_CELLS.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...INTERFACE_STADIUMS.map((g) => cellRow(STADIUM_LABEL[g], run.shaking[g])),
    '',
    ...(dead === null
      ? [verdict]
      : [
          `| Geometry | Quiet earthquakes raised to ten | Recorded: mean abs. ln((toll + 1) / (record + 1)) | Records held (${STADIUM_CELLS.join(' · ')}) |`,
          '|----------|----:|----:|----:|',
          ...INTERFACE_STADIUMS.map(
            (g) =>
              `| ${STADIUM_LABEL[g]} | ${(100 * dead.quiet[g].share).toFixed(1)} % of ${dead.quiet[g].quiet.toString()} | ${recordedScore(dead.recorded[g]).toFixed(2)} | ${insideText(dead.recorded[g])} |`
          ),
          '',
          verdict,
        ]),
    '',
    "Printed beside, deciding nothing (rule 44): rule 18's score below Mw 7.5 on rule 35's interface earthquakes of rule 11's and rule 23's sets, where the disc is the unmarked scenario and its figures were known before these rules,",
    '',
    `| Maps | ${INTERFACE_STADIUMS.map((g) => STADIUM_LABEL[g]).join(' | ')} |`,
    `|------|${INTERFACE_STADIUMS.map(() => '----:').join('|')}|`,
    ...seenRows,
    `| Rule 40's ${run.beside.stationsEvents.toString()} maps with ten stations or more, rock | ${INTERFACE_STADIUMS.map((g) => meanAbsoluteLogBias(below(run.beside.stations[g])).toFixed(2)).join(' | ')} |`,
    '',
    "and rule 11's held-out interface tolls below Mw 7.5, on the browser's ground:",
    '',
    `| Geometry | Mean abs. ln((toll + 1) / (record + 1)) | Records held (${STADIUM_CELLS.join(' · ')}) |`,
    '|----------|----:|----:|',
    ...seenTolls,
  ].join('\n');
}

const LOW_INTENSITY_LABEL: Readonly<Record<LowIntensityToll, string>> = {
  none: 'Inside MMI VII only',
  midBand: 'V and VI at their middles',
  pager: 'V and VI at their integers',
};

/** The toll a scenario that names none counts below VII, read off the plan
 *  the store builds, on PAGER's global curve. */
function tollCountedBelowVii(): LowIntensityToll {
  const data = simulateEarthquake({ magnitude: 5, depth: m(10_000), faultType: 'strike-slip' });
  configureCountryLookup(() => null);
  try {
    const band = casualtyPlanForResult(
      { type: 'earthquake', data },
      { latitude: 0, longitude: 0 }
    )?.bands.find((b) => b.key === 'mmi5');
    if (band === undefined) return 'none';
    return band.mortality === pagerFatalityRate(5, pagerVulnerabilityFor(null).mid)
      ? 'pager'
      : 'midBand';
  } finally {
    configureCountryLookup(shippedCountryAt);
  }
}

function runLow(): LowIntensityRun {
  const run = runLowIntensity();
  // What a scenario that names no toll counts below VII must be what rules
  // 47 and 48 decided.
  const decided = run.winner?.decision.adopted === true ? run.winner.toll : 'none';
  const counted = tollCountedBelowVii();
  if (counted !== decided) {
    throw new Error(`Rules 47 and 48 decide ${decided}; the simulator counts ${counted}`);
  }
  return run;
}

function runPointSourceRules(): PointSourceRun {
  const run = runPointSource();
  // What a disc draws when it names no distance must be what rules 52 and
  // 53 decided, and a scenario marked a subduction interface that names no
  // law must draw what rule 54 left in place.
  const disc = { magnitude: 6.8, depth: m(15_000), faultType: 'reverse' } as const;
  const drawn =
    simulateEarthquake(disc).shaking.mmi7Radius ===
    simulateEarthquake({ ...disc, pointSourceDistance: 'thompsonWorden2018' }).shaking.mmi7Radius
      ? 'thompsonWorden2018'
      : 'epicentral';
  if (drawn !== run.distance) {
    throw new Error(`Rules 52 and 53 decide ${run.distance}; the simulator draws ${drawn}`);
  }
  if (run.interface.dead?.decision.adopted === true) {
    throw new Error(
      `Rule 54 adopts ${run.interface.dead.winner}; the simulator still draws Boore et al. 2014 on an interface`
    );
  }
  return run;
}

const DISTANCE_LABEL: Readonly<Record<(typeof POINT_SOURCE_CANDIDATES)[number], string>> = {
  epicentral: 'From the epicentre',
  thompsonWorden2018: 'Thompson & Worden’s average',
};

/** The same distances inside a sentence. */
const DISTANCE_AT: Readonly<Record<(typeof POINT_SOURCE_CANDIDATES)[number], string>> = {
  epicentral: 'at the epicentral distance',
  thompsonWorden2018: 'at Thompson & Worden’s average',
};

function pointSourceSection(run: PointSourceRun): string {
  const below = <T extends { sizeBand: string }>(cells: readonly T[]): T[] =>
    cells.filter((c) => POINT_SOURCE_CELLS.includes(c.sizeBand));
  const signed = (bias: number | null): string => (bias === null ? '—' : bias.toFixed(2));
  const meanBelow = (cells: readonly { sizeBand: string; bias: number | null }[]): string =>
    meanAbsoluteLogBias(below(cells)).toFixed(2);
  const dead = run.dead;
  const shakingRows = POINT_SOURCE_CANDIDATES.map(
    (d) =>
      `| ${DISTANCE_LABEL[d]} | ${POINT_SOURCE_READINGS.map(
        (r) =>
          `${below(run.shaking[r][d])
            .map((c) => `${signed(c.bias)} (${c.pairs.toString()})`)
            .join(' | ')} | ${meanBelow(run.shaking[r][d])}`
      ).join(
        ' | '
      )} | ${POINT_SOURCE_READINGS.map((r) => meanBelow(run.leastModelled[r][d])).join(' | ')} |`
  );
  const verdict = run.choice.eligible
    ? run.dead?.decision.adopted === true
      ? 'By rules 52 and 53 a disc’s rings stand at Thompson & Worden’s average distance to the rupture, in the simulator and in the harness.'
      : `By rule 53 the distance in place stays: ${[
          run.dead?.decision.tolls === true
            ? null
            : "the candidate fails rule 19's test on rule 11's held-out tolls",
          run.dead?.decision.quiet === true
            ? null
            : "it raises more of rule 23's quiet earthquakes to a toll of ten",
        ]
          .filter((x): x is string => x !== null)
          .join(', and ')}.`
    : 'The candidate does not beat the distance in place by 0.05 in both readings while doing no worse on the least modelled maps, so by rule 52 the rings of a disc stay at the epicentral distance and nothing runs on the dead.';
  const bands = SIZE_BANDS.earthquake.map((b) => b.label);
  const lawLabel = (law: (typeof POINT_SOURCE_INTERFACE_CANDIDATES)[number] | 'inPlace'): string =>
    law === 'inPlace'
      ? `Boore et al. 2014 ${DISTANCE_AT[run.distance]}`
      : `${CONTOUR_LAW_LABEL[law]} at Thompson & Worden’s average below Mw 7.5`;
  const ic = run.interface.choice;
  const interfaceRows = (['inPlace', ...POINT_SOURCE_INTERFACE_CANDIDATES] as const).map(
    (law) =>
      `| ${lawLabel(law)}${law !== 'inPlace' && law === ic.winner ? ' (winner)' : law !== 'inPlace' && ic.eligible.includes(law) ? ' (eligible)' : ''} | ${POINT_SOURCE_READINGS.map((r) => ic.meanAbsoluteBias[r][law].toFixed(2)).join(' | ')} |`
  );
  const idead = run.interface.dead;
  const interfaceVerdict =
    ic.winner === null
      ? 'No interface model beats the law in place by 0.05 in both readings, so by rule 54 nothing runs on the dead.'
      : idead?.decision.adopted === true
        ? `By rule 54 ${CONTOUR_LAW_LABEL[ic.winner]} draws the rings of a scenario marked a subduction interface.`
        : `By rule 54 Boore et al. 2014 keeps drawing the rings of a scenario marked a subduction interface: ${[
            idead?.decision.tolls === true
              ? null
              : `${CONTOUR_LAW_LABEL[ic.winner]} fails rule 19's test on rule 11's interface tolls`,
            idead?.decision.quiet === true
              ? null
              : "it raises more of rule 23's quiet interface earthquakes to a toll of ten",
          ]
            .filter((x): x is string => x !== null)
            .join(', and ')}.`;
  const recorded = POINT_SOURCE_CANDIDATES.map((d) => {
    const rows = run.beside.recorded[d];
    return `| ${DISTANCE_LABEL[d]} | ${recordedScore(rows).toFixed(3)} | ${rows.filter((r) => r.inside).length.toString()} of ${rows.length.toString()} | ${grouped(rows.reduce((a, r) => a + r.central, 0))} |`;
  });
  const recordTotal = run.beside.recorded.epicentral.reduce((a, r) => a + r.record, 0);
  const km = (metresValue: number): string => (metresValue / 1_000).toFixed(1);
  return [
    'Below Mw 7.5 every scenario is a disc, and its rings take the Joyner–Boore distance to be the distance',
    'from the epicentre; USGS ShakeMap 4.0 to 4.2 draws such an earthquake at Thompson & Worden’s (2018)',
    'average distance to the ruptures it can have. Rules 50 to 55 (`validation/pointSourceRules.ts`),',
    'committed before the candidate was scored, put that average, as ShakeMap 4.0.2 computes it for an',
    `origin with no tectonic region, to ComCat’s ShakeMaps of M 6 or more, 2000 to 2007, no deeper than 40 km (read on ${POINT_SOURCE_READ_ON}): ${run.events.earthquakes.toString()} maps, ${run.events.leastModelled.toString()} of them drawn on a finite rupture or with ten stations or more, ${run.events.interface.toString()} of interface earthquakes.`,
    "The candidate must lower rule 18's score below Mw 7.5 by 0.05 on rock and on the browser's ground, and be",
    'no worse on the least modelled maps. Each cell gives the mean log radius ratio and its pairs.',
    '',
    `| Distance | ${POINT_SOURCE_READINGS.map((r) => `${r === 'rock' ? 'Rock' : 'Ground'}: ${POINT_SOURCE_CELLS.join(' | ')} | Mean abs.`).join(' | ')} | Least modelled, rock | Least modelled, ground |`,
    `|----------|${[...POINT_SOURCE_READINGS.flatMap(() => [...POINT_SOURCE_CELLS, 'mean']), 'rock', 'ground'].map(() => '----:').join('|')}|`,
    ...shakingRows,
    '',
    ...(dead === null
      ? [verdict]
      : [
          `| Distance | Rule 11's held-out tolls: ${bands.join(' | ')} | Mean abs. log bias | Rule 23's quiet earthquakes raised to ten |`,
          `|----------|${bands.map(() => '-----').join('|')}|----:|----:|`,
          ...POINT_SOURCE_CANDIDATES.map(
            (d) =>
              `| ${DISTANCE_LABEL[d]} | ${dead.tolls[d].map((t) => `${biasText(t.stats)} · ${t.stats.inside.toString()} of ${t.stats.rows.toString()}`).join(' | ')} | ${tollLogBias(dead.tolls[d]).toFixed(2)} | ${(100 * dead.quiet[d].share).toFixed(1)} % of ${dead.quiet[d].quiet.toString()} |`
          ),
          '',
          verdict,
        ]),
    '',
    "Rule 54 puts the interface models, at the candidate's rupture distance below Mw 7.5, to the set's interface maps, each run as a scenario marked a subduction interface: rule 18's mean absolute log bias over the three magnitude cells.",
    '',
    `| Law | ${POINT_SOURCE_READINGS.map((r) => (r === 'rock' ? 'Rock' : 'Ground')).join(' | ')} |`,
    `|-----|${POINT_SOURCE_READINGS.map(() => '----:').join('|')}|`,
    ...interfaceRows,
    '',
    ...(idead === null
      ? [interfaceVerdict]
      : [
          `| Law | Rule 11's held-out interface tolls: ${bands.join(' | ')} | Mean abs. log bias | Rule 23's quiet interface earthquakes raised to ten |`,
          `|-----|${bands.map(() => '-----').join('|')}|----:|----:|`,
          ...(['inPlace', 'winner'] as const).map(
            (side) =>
              `| ${side === 'inPlace' ? lawLabel('inPlace') : lawLabel(idead.winner)} | ${idead.tolls[side].map((t) => `${biasText(t.stats)} · ${t.stats.inside.toString()} of ${t.stats.rows.toString()}`).join(' | ')} | ${tollLogBias(idead.tolls[side]).toFixed(2)} | ${(100 * idead.quiet[side].share).toFixed(1)} % of ${idead.quiet[side].quiet.toString()} |`
          ),
          '',
          interfaceVerdict,
        ]),
    '',
    `Printed beside, deciding nothing (rule 55): the set's recorded earthquakes below Mw 7.5, on the browser's ground, whose ${grouped(recordTotal)} dead the country curves were fitted on,`,
    '',
    '| Distance | Mean abs. ln((toll + 1) / (record + 1)) | Records held | Dead counted |',
    '|----------|----:|----:|----:|',
    ...recorded,
    '',
    "rule 18's mean absolute log bias below Mw 7.5 on the maps drawn on a finite rupture and on those with ten stations or more, and the interface models at rule 36's hypocentral distance on the set's interface maps,",
    '',
    `| Maps | ${POINT_SOURCE_READINGS.map((r) => (r === 'rock' ? 'Rock' : 'Ground')).join(' | ')} |`,
    `|------|${POINT_SOURCE_READINGS.map(() => '----:').join('|')}|`,
    ...POINT_SOURCE_CANDIDATES.flatMap((d) => [
      `| Finite rupture, ${DISTANCE_AT[d]} | ${POINT_SOURCE_READINGS.map((r) => meanBelow(run.beside.finiteFault[r][d])).join(' | ')} |`,
      `| Ten stations or more, ${DISTANCE_AT[d]} | ${POINT_SOURCE_READINGS.map((r) => meanBelow(run.beside.stations[r][d])).join(' | ')} |`,
    ]),
    ...POINT_SOURCE_INTERFACE_CANDIDATES.map(
      (law) =>
        `| Interface maps, ${CONTOUR_LAW_LABEL[law]} at the hypocentral distance, three cells | ${POINT_SOURCE_READINGS.map((r) => meanAbsoluteLogBias(run.beside.hypocentral[r][law]).toFixed(2)).join(' | ')} |`
    ),
    '',
    "and the net's rings below Mw 7.5 under both distances (km):",
    '',
    '| Earthquake | MMI VII | MMI VIII | MMI IX |',
    '|------------|----:|----:|----:|',
    ...run.beside.net.map(
      (n) =>
        `| ${cellText(n.name)} (Mw ${n.magnitude.toString()}) | ${km(n.rings.epicentral.mmi7)} → ${km(n.rings.thompsonWorden2018.mmi7)} | ${km(n.rings.epicentral.mmi8)} → ${km(n.rings.thompsonWorden2018.mmi8)} | ${km(n.rings.epicentral.mmi9)} → ${km(n.rings.thompsonWorden2018.mmi9)} |`
    ),
  ].join('\n');
}

/** Rules 50 to 55 in the report's JSON. */
function pointSourceJson(run: PointSourceRun) {
  const side = (d: (typeof POINT_SOURCE_CANDIDATES)[number]) =>
    d === 'epicentral' ? 'inPlace' : 'candidate';
  const dead = run.dead;
  const interfaceDead = run.interface.dead;
  return {
    readOn: POINT_SOURCE_READ_ON,
    events: run.events,
    belowMw75: Object.fromEntries(
      POINT_SOURCE_READINGS.map((reading) => [
        reading,
        Object.fromEntries(
          POINT_SOURCE_CANDIDATES.map((d) => [
            d,
            {
              all: fixed(run.choice.all[reading][side(d)], 3),
              leastModelled: fixed(run.choice.leastModelled[reading][side(d)], 3),
            },
          ])
        ),
      ])
    ),
    eligible: run.choice.eligible,
    dead:
      dead === null
        ? null
        : {
            decision: dead.decision,
            tollLogBias: Object.fromEntries(
              POINT_SOURCE_CANDIDATES.map((d) => [d, fixed(tollLogBias(dead.tolls[d]), 3)])
            ),
            quietShare: Object.fromEntries(
              POINT_SOURCE_CANDIDATES.map((d) => [d, fixed(dead.quiet[d].share, 4)])
            ),
          },
    distance: run.distance,
    interface: {
      meanAbsoluteBias: Object.fromEntries(
        POINT_SOURCE_READINGS.map((reading) => [
          reading,
          Object.fromEntries(
            Object.entries(run.interface.choice.meanAbsoluteBias[reading]).map(([law, v]) => [
              law,
              fixed(v, 3),
            ])
          ),
        ])
      ),
      eligible: run.interface.choice.eligible,
      winner: run.interface.choice.winner,
      dead:
        interfaceDead === null
          ? null
          : {
              winner: interfaceDead.winner,
              decision: interfaceDead.decision,
              inside: {
                inPlace: interfaceDead.tolls.inPlace.map((t) => [t.stats.inside, t.stats.rows]),
                winner: interfaceDead.tolls.winner.map((t) => [t.stats.inside, t.stats.rows]),
              },
              quietShare: {
                inPlace: fixed(interfaceDead.quiet.inPlace.share, 4),
                winner: fixed(interfaceDead.quiet.winner.share, 4),
              },
            },
    },
    besideRecorded: Object.fromEntries(
      POINT_SOURCE_CANDIDATES.map((d) => [
        d,
        {
          score: fixed(recordedScore(run.beside.recorded[d]), 3),
          held: run.beside.recorded[d].filter((r) => r.inside).length,
          rows: run.beside.recorded[d].length,
        },
      ])
    ),
  };
}

function lowIntensitySection(run: LowIntensityRun): string {
  const held = (rows: readonly ModerateRun[]): string =>
    `${rows.filter((r) => r.inside).length.toString()} of ${rows.length.toString()}`;
  const selectionRows = LOW_INTENSITY_TOLLS.map((toll) => {
    const rows = run.selection[toll];
    const recorded = rows.filter((r) => r.record > 0);
    const quiet = rows.filter((r) => r.record === 0);
    const total = Math.round(rows.reduce((a, r) => a + r.central, 0));
    return `| ${LOW_INTENSITY_LABEL[toll]} | ${lowIntensityScore(rows).toFixed(2)} | ${held(rows)} | ${held(recorded)} | ${quiet.filter((r) => r.central >= 10).length.toString()} of ${quiet.length.toString()} | ${recorded.filter((r) => r.central < 0.5).length.toString()} of ${recorded.length.toString()} | ${grouped(total)} |`;
  });
  const recordTotal = run.selection.none.reduce((a, r) => a + r.record, 0);
  const w = run.winner;
  const verdict =
    w === null
      ? 'Neither candidate lowers the score by ln 1.25 while holding no fewer records, so by rule 47 the toll in place stays and nothing else runs.'
      : w.decision.adopted
        ? `By rules 47 and 48 the toll counts the dead below VII, ${LOW_INTENSITY_LABEL[w.toll].toLowerCase()}, in the simulator and in the harness; the runs of rules 19, 25, 33, 38 and 43 above keep the toll in place.`
        : `By rule 48 the toll in place stays: ${[
            w.decision.tolls
              ? null
              : "the winner does worse on rule 11's held-out dead than the room allows",
            w.decision.quiet
              ? null
              : "it raises more of rule 23's quiet earthquakes to a toll of ten than the room allows",
          ]
            .filter((x): x is string => x !== null)
            .join(', and ')}.`;
  const bandsHeader = SIZE_BANDS.earthquake.map((b) => b.label).join(' | ');
  return [
    'The toll counts the dead inside the MMI VII ring only; USGS PAGER counts them from V. Rules 45 to',
    '49 (`validation/lowIntensityRules.ts`), committed before either candidate was coded, try adding',
    "the V and VI bands the rings draw, at PAGER's rates for their middles or for their integers, on",
    `every NCEI significant earthquake of magnitude 5.0 to 5.99 from 2008 to 2025 no deeper than 40 km (read on ${MODERATE_READ_ON}): ${run.events.earthquakes.toString()} earthquakes, ${run.events.recorded.toString()} of them with deaths, ${grouped(recordTotal)} dead in all, on the browser's ground.`,
    'A candidate must lower the mean |ln((toll + 1) / (record + 1))| by ln 1.25 and hold no fewer records.',
    '',
    '| Toll | Mean abs. ln((toll + 1) / (record + 1)) | Records held | Records of deaths held | Records of none given ten or more | Records of deaths given none | Dead counted |',
    '|------|----:|----:|----:|----:|----:|----:|',
    ...selectionRows,
    '',
    ...(w === null
      ? [verdict]
      : [
          `| Toll | Rule 11's held-out tolls: ${bandsHeader} | Mean abs. log bias | Rule 23's quiet earthquakes raised to ten |`,
          `|------|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|----:|----:|`,
          ...(['inPlace', 'winner'] as const).map((side) => {
            const toll = side === 'inPlace' ? 'none' : w.toll;
            return `| ${LOW_INTENSITY_LABEL[toll]} | ${w.tolls[side].map((t) => `${biasText(t.stats)} · ${t.stats.inside.toString()} of ${t.stats.rows.toString()}`).join(' | ')} | ${tollLogBias(w.tolls[side]).toFixed(2)} | ${(100 * w.quiet[side].share).toFixed(1)} % of ${w.quiet[side].quiet.toString()} |`;
          }),
          '',
          verdict,
          '',
          "Printed beside, deciding nothing (rule 49): each toll's central figure against PAGER's estimate on the campaign's PAGER products, and the fatality alert against PAGER's.",
          '',
          "| Toll | Toll against PAGER's | Alert agreement |",
          '|------|----:|----:|',
          ...(['inPlace', 'winner'] as const).map((side) => {
            const toll = side === 'inPlace' ? 'none' : w.toll;
            const a = w.againstPager[side];
            return `| ${LOW_INTENSITY_LABEL[toll]} | ${biasText(a.stats)} | ${Math.round(100 * a.alertAgreement).toString()} % |`;
          }),
        ]),
  ].join('\n');
}

const run33 = (
  run: PagerChainRun
): PagerChainRun['decision'] & { halves: PagerChainRun['halves'] } => ({
  ...run.decision,
  halves: run.halves,
});

function pagerChainSection(run: PagerChainRun): string {
  const factor = (ln: number | null): string => (ln === null ? '—' : `${Math.exp(ln).toFixed(2)}×`);
  const bandsHeader = SIZE_BANDS.earthquake.map((b) => b.label).join(' | ');
  const peopleRows = CHAIN_NAMES.map((name) => {
    const c = run.chains[name];
    const byLevel = PEOPLE_LEVELS.map((level) =>
      c.people.cells
        .filter((cell) => cell.level === level)
        .map((cell) => `${factor(cell.bias)} (${cell.pairs.toString()})`)
        .join(' · ')
    );
    return `| ${CHAIN_LABEL[name]} | ${byLevel.join(' | ')} | ${c.people.score.toFixed(2)} |`;
  });
  const tollRows = CHAIN_NAMES.map((name) => {
    const c = run.chains[name];
    const logBias = c.tolls.map((t) => (t.stats.bias === null ? null : Math.log(t.stats.bias)));
    const mab =
      logBias.filter((b): b is number => b !== null).reduce((a, b) => a + Math.abs(b), 0) /
      Math.max(logBias.filter((b) => b !== null).length, 1);
    return `| ${CHAIN_LABEL[name]} | ${c.tolls.map((t) => `${biasText(t.stats)} · ${t.stats.inside.toString()} of ${t.stats.rows.toString()}`).join(' | ')} | ${mab.toFixed(2)} | ${c.shakingScore.toFixed(2)} |`;
  });
  const besideRows = CHAIN_NAMES.map((name) => {
    const c = run.chains[name];
    const q = c.quietMaps;
    const band8 = q.bands.find((b) => b.band === 8)?.outcome;
    return `| ${CHAIN_LABEL[name]} | ${biasText(c.people.tollAgainstPager)} | ${Math.round(100 * c.people.alertAgreement).toString()} % | ${q.score === null ? '—' : q.score.toFixed(2)} | ${q.sharpness === null ? '—' : q.sharpness.toFixed(2)} | ${band8 === undefined ? '—' : `${band8.falseAlarms.toString()} / ${band8.silences.toString()}`} |`;
  });
  const d = run.decision;
  const failed = [
    d.people ? null : 'its people score does not fall by ln 1.25',
    d.tolls ? null : 'it does worse on the dead than the margin allows',
    d.shaking ? null : "it does worse on rule 18's ShakeMaps than the margin allows",
  ].filter((x): x is string => x !== null);
  const verdict = d.adopted
    ? "By rule 33 PAGER's chain replaces the chain in place."
    : `By rule 33 the chain in place stays: ${failed.join(', and ')}.`;
  return [
    "The benchmark campaign put the simulator's people at MMI VII and above at 0.13 of what USGS",
    'PAGER counts on 187 earthquakes (docs/BENCHMARK_REPORT.md, BM-03). Rules 31 to 34',
    '(`validation/pagerChain.ts`), committed before either chain ran on them, try the chain PAGER',
    "uses — intensity from Boore et al. 2014's median PGV through Worden et al. 2012's PGV relation,",
    'banded and weighted as its loss model bands and weights it — against the chain in place, on',
    `PAGER's products read on ${PAGER_PRODUCTS_READ_ON}. People at and above each intensity are scored`,
    "as ln((model + 1 000) / (PAGER + 1 000)) by magnitude cell; PAGER's chain is adopted if that",
    "score falls by ln 1.25 or more and it does no worse by more than 0.10 on rule 11's held-out dead",
    "and on rule 18's ShakeMaps.",
    '',
    `| Chain | People at VII and above (${SIZE_BANDS.earthquake.map((b) => b.label).join(' · ')}) | At VIII and above | At IX and above | People score |`,
    '|-------|-----|-----|-----|----:|',
    ...peopleRows,
    '',
    'Each cell is the geometric mean of model over PAGER, floored at a thousand people, by magnitude cell, with its pairs; the score is the mean absolute log over the cells with five pairs or more.',
    '',
    `| Chain | Rule 11's held-out tolls: ${bandsHeader} | Mean abs. log bias | Rule 18's ShakeMaps |`,
    `|-------|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|----:|----:|`,
    ...tollRows,
    '',
    verdict,
    '',
    "Printed beside, deciding nothing (rule 34): the central toll against PAGER's estimate, the fatality alert against PAGER's, and rule 28's score on rule 23's maps, which credits a band rightly left blank.",
    '',
    "| Chain | Toll against PAGER's | Alert agreement | Rule 28 score | Sharpness | MMI VIII false alarms / silences |",
    '|-------|----:|----:|----:|----:|----:|',
    ...besideRows,
  ].join('\n');
}

function depthSection(run: DepthRun): string {
  const radius = (bias: number | null): string =>
    bias === null ? '—' : `${Math.exp(bias).toFixed(2)}×`;
  const bandsHeader = SIZE_BANDS.earthquake.map((b) => b.label).join(' | ');
  const table = (c: CandidateComparison<DepthCandidate>): string[] => [
    `| Law | ${bandsHeader} | Mean abs. log bias | Bands invented | Bands missed |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '----:').join('|')}|----:|----:|----:|`,
    ...DEPTH_CANDIDATES.map((law) => {
      const cells = c.scores[law];
      return `| ${CONTOUR_LAW_LABEL[law]}${law === c.winner ? ' (winner)' : ''} | ${cells.map((x) => radius(x.bias)).join(' | ')} | ${c.meanAbsoluteBias[law].toFixed(2)} | ${cells.reduce((a, x) => a + x.invented, 0).toString()} | ${cells.reduce((a, x) => a + x.missed, 0).toString()} |`;
    }),
  ];
  const cellsText = (cells: TollCells): string =>
    cells
      .map(
        (c) => `${biasText(c.stats)} · ${c.stats.inside.toString()} of ${c.stats.rows.toString()}`
      )
      .join(' | ');
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet).length;
  const laws = DEPTH_CANDIDATES.filter((law) => run.quietShare[law] !== undefined);
  const winner = run.unseen.winner;
  const verdict =
    winner === 'boore2014'
      ? 'Boore et al. 2014 is not beaten by 0.05 on the unseen ShakeMaps, and stays; nothing else runs on the dead.'
      : `${CONTOUR_LAW_LABEL[winner]} beats Boore et al. 2014 on the unseen ShakeMaps by ${(run.unseen.meanAbsoluteBias.boore2014 - run.unseen.meanAbsoluteBias[winner]).toFixed(2)}, and is ${run.adopted ? 'adopted' : 'not adopted'} on the dead.`;
  return [
    'Boore et al. 2014 draws the rings with no depth of its own. Rules 23 to 26',
    '(`validation/depthRules.ts`), committed before any earthquake they name was read,',
    'choose whether the rings carry depth on earthquakes no rule had looked at: every',
    'M ≥ 6 earthquake of 2008 to 2025, no deeper than 40 km, that USGS holds a ShakeMap',
    `for and rule 11 did not take (read on ${UNSEEN_READ_ON}: ${UNSEEN_LISTED.toString()} listed, ${UNSEEN_EARTHQUAKES.length.toString()} with a low-resolution MMI map after rule 11's are taken out, ${UNSEEN_WITHOUT_COVERAGE.length.toString()} without one and ${UNSEEN_UNREADABLE.length.toString()} ComCat no longer serves; ${quiet.toString()} quiet, the rest in NCEI's database).`,
    'The candidates are scored on their ShakeMaps as rule 18 scores a law, on the ground the',
    "browser reads; Boore et al. 2014 stays unless beaten by 0.05, and a winner must pass rule 19's",
    "test on rule 11's tolls and raise no more quiet earthquakes to a median toll of ten.",
    '',
    ...table(run.unseen),
    '',
    "The same candidates on rule 18's 370 ShakeMaps, which decide nothing:",
    '',
    ...table(run.seen),
    '',
    `${verdict} A pair of bands that neither side reaches is not scored, so the table's invented and missed columns count what the score does not; what was read in them afterwards is in docs/SCIENCE.md, "Whether the rings carry depth".`,
    '',
    `| Law | Rule 11's held-out tolls: ${bandsHeader} | Quiet earthquakes with a median toll of ten or more | The set's recorded tolls: ${bandsHeader} |`,
    `|-----|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|----:|${SIZE_BANDS.earthquake.map(() => '-----').join('|')}|`,
    ...laws.map(
      (law) =>
        `| ${CONTOUR_LAW_LABEL[law]} | ${cellsText(run.tolls[law] ?? [])} | ${((run.quietShare[law] ?? 0) * 100).toFixed(1)} % of ${quiet.toString()} | ${cellsText(run.recorded[law] ?? [])} |`
    ),
  ].join('\n');
}

function ringVerificationSection(rows: readonly VerificationRow[]): string {
  const residual = residualAgainstReference();
  return [
    'The relations that draw the intensity rings, and the one each earthquake is',
    "tried against, computed at the inputs of their authors' own code. The OpenQuake",
    "Engine's test data keep the values David M. Boore's Fortran program gives for",
    'Boore et al. 2014 (July 2014) and those of an independent Matlab implementation',
    'of Allen, Wald & Worden 2012 (`validation/openQuakeReference.ts`, GEM Foundation,',
    'AGPL-3.0-or-later). OpenQuake allows the first two per cent and the second a tenth',
    'of one; the test here allows a hundredth.',
    '',
    '| Relation | Quantity | Reference | Rows | Largest difference | Where |',
    '|----------|----------|-----------|-----:|-------------------:|-------|',
    ...rows.map(
      (r) =>
        `| ${r.relation} | ${r.quantity} | ${r.reference} | ${r.rows.toString()} | ${(r.worstRelative * 100).toFixed(4)} % | ${r.worstAt} |`
    ),
    '',
    `The toll band draws one ground-motion residual for every earthquake, σ = ${residual.convention.toFixed(2)} in ln PGA; the Fortran program gives ${residual.min.toFixed(4)} to ${residual.max.toFixed(4)} over the ${residual.rows.toString()} rows of Mw 5.5 and above, R_JB within 80 km and Vs30 of 300 m/s or more. Smaller earthquakes scatter more, up to ${residual.smallEarthquakeMax.toFixed(4)}, and softer ground less, down to ${residual.softGroundMin.toFixed(4)}, which one number does not follow (\`uq/conventions.ts\`).`,
  ].join('\n');
}

function medianOf(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? (sorted[mid] ?? null)
    : ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

/** The rings' declared gap, measured at MMI VII on the ShakeMaps of rule
 *  11's set with the harness's law, on its ground and on rock. */
function ringsGap(depth: DepthRun): string {
  const atVII = (ground: SiteRule) =>
    contourPairs('boore2014', RULE_SHAKEMAPS, (row) => ruleSiteVs30(row, ground)).filter(
      (p) => p.threshold === 7
    );
  const medians = (
    pairs: readonly { magnitude: number; modelKm2: number; observedKm2: number }[]
  ) =>
    SIZE_BANDS.earthquake
      .map((b) =>
        medianOf(
          pairs
            .filter(
              (p) =>
                sizeBandOf('earthquake', p.magnitude) === b.label &&
                p.modelKm2 > 0 &&
                p.observedKm2 > 0
            )
            .map((p) => Math.sqrt(p.modelKm2 / p.observedKm2))
        )
      )
      .map((m) => (m === null ? '—' : m.toFixed(2)));
  const pick = atVII('pick');
  const rock = atVII('rock');
  const without = pick.filter((p) => !(p.observedKm2 > 0));
  const invented = without.filter((p) => p.modelKm2 > 0).length;
  const inventedOnRock = rock.filter((p) => !(p.observedKm2 > 0) && p.modelKm2 > 0).length;
  const [small, middle, great] = medians(pick);
  const [smallRock, middleRock, greatRock] = medians(rock);
  const drawn =
    invented === without.length && inventedOnRock === invented
      ? `draw a VII band about every one of them, on the ground the browser reads under the epicentre and on rock alike`
      : `draw a VII band about ${invented.toString()} of them on the ground the browser reads under the epicentre, ${inventedOnRock.toString()} on rock`;
  return `**The rings paint intensity VII where ShakeMaps record none.** Held out by rule, ${without.length.toString()} of the ${pick.length.toString()} USGS ShakeMaps hold no ground at MMI VII on their low-resolution grid, and Boore et al. 2014's rings ${drawn}. The rings take no account of how deep the source lies, and a ShakeMap's grid does not hold a peak smaller than one of its cells; which of the two, or what else, makes the difference is not established. Where a ShakeMap does reach MMI VII, the ring runs at a median ${String(small)}, ${String(middle)} and ${String(great)} of its radius below Mw 6.5, between 6.5 and 7.5 and above (${String(smallRock)}, ${String(middleRock)} and ${String(greatRock)} on rock). On the ${depth.unseen.events.toString()} earthquakes of rule 23 no rule had read, Boore et al. 2014 paints ${unseenInvented(depth, 'boore2014').toString()} bands where their ShakeMaps hold none, and Allen, Wald & Worden's intensity equation, which reads the depth, ${unseenInvented(depth, 'allen2012Hypocentral').toString()}; the score rules 23 to 26 chose with gives no credit for a band rightly left blank, and it kept Boore et al. 2014 (docs/SCIENCE.md, "Whether the rings carry depth"). And the ground is one Vs30, read at the epicentre, for the whole footprint, where a ShakeMap reads each cell's own (docs/SCIENCE.md, "The ground under the rings").`;
}

function unseenInvented(depth: DepthRun, law: DepthCandidate): number {
  return depth.unseen.scores[law].reduce((a, c) => a + c.invented, 0);
}

/** The declared gap the sets held out by rule measure, in their own
 *  figures, so the sentence moves when the model does. */
function greatRuptureGap(cells: readonly RuleCell[]): string {
  const label = SIZE_BANDS.earthquake[SIZE_BANDS.earthquake.length - 1]?.label;
  const great = cells.find((c) => c.kind === 'size' && c.group === label);
  const measured =
    great === undefined || great.informative.rows === 0
      ? 'The sets held out by rule have no such earthquake to measure it on.'
      : `Held out by rule, the earthquakes of ${String(label)} read ${biasText(great.all)} their record with a scatter of ${great.all.scatterLn === null ? '—' : great.all.scatterLn.toFixed(2)}, and their band holds ${great.informative.inside.toString()} of ${great.informative.rows.toString()} records by spanning a median of ${great.informative.medianBandDecades === null ? '—' : `10^${(Math.round(fixed(great.informative.medianBandDecades, 2) * 10) / 10).toFixed(1)}`}.`;
  return `**A great rupture's toll is read off rings drawn for a point.** From Mw 7.5 the intensity rings — Boore et al. 2014's since 14 September 2026 — are a relation for a point, stretched along the rupture as a stadium, and the simulator counts the people inside it; no finite-fault or subduction-interface relation is implemented. ${measured} On Joyner & Boore 1981's rings the same cell read 13.85×, a figure the calibration harness hid until the same day by counting circles about the epicentre (docs/ROADMAP.md, M9 move 4; docs/BUG_REGISTRY.md, B-022).`;
}

function byRuleSection(
  sets: RuleSets,
  cells: { earthquakes: RuleCell[]; plumes: RuleCell[] }
): string {
  const held = sets.earthquakes.filter((e) => e.quake.role === 'heldOut');
  const tuned = sets.earthquakes.filter((e) => e.quake.role === 'tuned');
  const quakes = cells.earthquakes.find((c) => c.kind === 'all');
  const columns = cells.plumes.find((c) => c.kind === 'all');
  if (quakes === undefined || columns === undefined) throw new Error('A rule set has no rows');
  const bandText = (s: ScoreStats): string =>
    s.medianBandDecades === null
      ? '—'
      : `10^${(Math.round(fixed(s.medianBandDecades, 2) * 10) / 10).toFixed(1)}`;
  const scatterText = (s: ScoreStats): string =>
    s.scatterLn === null ? '—' : s.scatterLn.toFixed(2);
  const seenNames = Object.values(RULE_SEEN_EARTHQUAKES).join(', ');
  const unmatched = NCEI_UNMATCHED.length;
  const outsideQuakes = held
    .filter((e) => !e.toll.contains)
    .sort((a, b) => b.quake.row.magnitude - a.quake.row.magnitude);
  const outsidePlumes = sets.plumes.filter((p) => !p.column.contains);
  return [
    'Two sets chosen by a rule rather than from a list, fixed in',
    '`src/physics/validation/heldOutByRule.ts` (rules 11 to 16) and committed',
    'before the model was run on any of their rows: every earthquake of the',
    'NCEI/WDS significant-earthquake database from 2008 to 2025 with magnitude 6',
    'or more and focal depth 40 km or less, run on its USGS ComCat origin and',
    'moment tensor and on the ground the browser reads under its epicentre (rules 20',
    `to 22), and every IVESPA eruption phase from 2009 on. Read on ${RULE_READ_ON}.`,
    'Nothing here is gated and nothing was re-tuned on it; docs/SCIENCE.md, "Held',
    'out by rule", reads what the first run found.',
    '',
    '#### Earthquake death tolls',
    '',
    `${held.length.toString()} rows held out. ${unmatched.toString()} ${unmatched === 1 ? 'record has' : 'records have'} no ComCat event and ${unmatched === 1 ? 'is' : 'are'} left out, and the ${tuned.length.toString()} events the shaking contours were chosen with in view are scored apart, below. **With something** are the rows whose record or band is above zero: the other ${(quakes.all.rows - quakes.informative.rows).toString()} are a band of nothing about a record of nothing, inside by construction, so the share inside is read over the rows with something. Bias and scatter are over the rows where record and model are both above zero; zeros are both zero / a record of nothing where the model says something / a record the model makes nothing of; the band is the median width of the 5–95 % band over the rows with something.`,
    '',
    '| Size | Rows | With something | Scored | Bias | Scatter σ_ln | Inside, with something | Inside, all rows | Zeros | Band |',
    '|------|-----:|---------------:|-------:|-----:|-------------:|------------------------|------------------|-------|-----:|',
    ...cells.earthquakes.map(
      (c) =>
        `| ${c.group ?? '**all sizes**'} | ${c.all.rows.toString()} | ${c.informative.rows.toString()} | ${c.all.scored.toString()} | ${biasText(c.all)} | ${scatterText(c.all)} | ${shareText(c.informative.inside, c.informative.rows)} | ${shareText(c.all.inside, c.all.rows)} | ${c.all.bothZero.toString()} / ${c.all.falseAlarms.toString()} / ${c.all.missedToZero.toString()} | ${bandText(c.informative)} |`
    ),
    '',
    `Without the rows run in the net before the rule (${seenNames}): bias ${biasText(quakes.unseen)}, scatter ${scatterText(quakes.unseen)}, inside ${shareText(quakes.unseen.inside, quakes.unseen.rows)} of the rows with something.`,
    '',
    `Tuned, and scored apart: ${tuned
      .map(
        (e) =>
          `${RULE_TUNED_EARTHQUAKES[e.quake.row.comcat] ?? e.quake.event.name}, ${grouped(e.toll.deaths)} dead against ${ruleRecord(e)} on a band of ${grouped(e.toll.low)} to ${grouped(e.toll.high)}`
      )
      .join('; ')}.`,
    '',
    '#### Eruption columns',
    '',
    `${sets.plumes.length.toString()} phases, every one held out. A row is accepted by the rule the net's column rows use; the three phases of Grímsvötn 2011 and Calbuco 2015 were in the net before the rule.`,
    '',
    '| Phases | Rows | Bias | Scatter σ_ln | Accepted |',
    '|--------|-----:|-----:|-------------:|----------|',
    ...cells.plumes.map((c) => {
      const label =
        c.kind === 'all'
          ? '**all phases**'
          : c.kind === 'morphology'
            ? MORPHOLOGY_LABEL[c.group as (typeof PLUME_MORPHOLOGIES)[number]]
            : c.group;
      return `| ${label ?? ''} | ${c.all.rows.toString()} | ${biasText(c.all)} | ${scatterText(c.all)} | ${shareText(c.all.inside, c.all.rows)} |`;
    }),
    '',
    `Without the phases in the net before the rule: bias ${biasText(columns.unseen)}, scatter ${scatterText(columns.unseen)}, accepted ${shareText(columns.unseen.inside, columns.unseen.rows)}.`,
    '',
    '#### Outside',
    '',
    '| Row | Size | Record | Model | Band or tolerance | Seen before |',
    '|-----|-----:|-------:|------:|-------------------|-------------|',
    ...outsideQuakes.map(
      (e) =>
        `| ${cellText(e.quake.event.name)} | Mw ${e.quake.row.magnitude.toFixed(1)} | ${ruleRecord(e)} | ${grouped(e.toll.deaths)} | ${grouped(e.toll.low)} to ${grouped(e.toll.high)} | ${e.quake.seen ? 'yes' : ''} |`
    ),
    ...outsidePlumes.map(
      (p) =>
        `| ${cellText(p.plume.observation.event)} | ${grouped(p.plume.observation.volumeEruptionRate)} m³/s | ${p.plume.observation.observedPlumeHeightKm.toFixed(1)} km | ${p.column.modelKm.toFixed(1)} km | ± ${(p.plume.observation.toleranceKm + 0.5 * p.column.modelKm).toFixed(1)} km | ${p.plume.seen ? 'yes' : ''} |`
    ),
    '',
    '<details>',
    `<summary>Every earthquake row (${sets.earthquakes.length.toString()})</summary>`,
    '',
    '| Origin (UTC) and place | Mw | Depth | Fault | Record | Model | Band | Inside | Role |',
    '|------------------------|---:|------:|-------|-------:|------:|------|--------|------|',
    ...sets.earthquakes.map(
      (e) =>
        `| ${cellText(e.quake.event.name)} | ${e.quake.row.magnitude.toFixed(1)} | ${e.quake.row.depthKm.toFixed(1)} km | ${e.quake.row.faultType} | ${ruleRecord(e)} | ${grouped(e.toll.deaths)} | ${grouped(e.toll.low)} to ${grouped(e.toll.high)} | ${e.toll.contains ? 'yes' : '**no**'} | ${e.quake.role === 'tuned' ? 'tuned' : e.quake.seen ? 'held out, seen' : 'held out'} |`
    ),
    '',
    '</details>',
    '',
    '<details>',
    `<summary>Every eruption column (${sets.plumes.length.toString()})</summary>`,
    '',
    '| Phase | Morphology | V̇ | Observed above vent | Model | Accepted |',
    '|-------|------------|---:|--------------------:|------:|----------|',
    ...sets.plumes.map(
      (p) =>
        `| ${cellText(p.plume.observation.event)} | ${p.plume.row.morphology} | ${grouped(p.plume.observation.volumeEruptionRate)} m³/s | ${p.plume.observation.observedPlumeHeightKm.toFixed(1)} ± ${p.plume.observation.toleranceKm.toFixed(1)} km | ${p.column.modelKm.toFixed(1)} km | ${p.column.contains ? 'yes' : '**no**'} |`
    ),
    '',
    '</details>',
    '',
    ...(unmatched === 0
      ? []
      : [
          `Left out without a ComCat event: ${NCEI_UNMATCHED.map((u) => `NCEI ${u.ncei.toString()}, ${u.date}, ${u.place} (${grouped(u.deaths)} dead)`).join('; ')}.`,
        ]),
  ].join('\n');
}

// ---------------------------------------------------------------------
// The impact pipeline against the Earth Impact Effects Program.
// ---------------------------------------------------------------------

interface EiepRun {
  summaries: EiepSummary[];
  /** [program's crater, simulator's crater] → impacts. */
  craters: Record<string, number>;
  /** [program's outcome, simulator's regime] → impacts. */
  regimes: Record<string, number>;
  failed: number;
}

function runEiep(): EiepRun {
  const ratios = eiepRatios();
  const craters: Record<string, number> = {};
  const regimes: Record<string, number> = {};
  for (const row of EIEP_REFERENCE) {
    if (row.error !== null) continue;
    const r = simulateEiepRow(row);
    const crater = `${row.craterType ?? 'none'} → ${(r.crater.finalDiameter as number) > 0 ? r.crater.morphology : 'none'}`;
    craters[crater] = (craters[crater] ?? 0) + 1;
    const outcome =
      row.burstAltitudeM === null || row.burstAltitudeM === undefined ? 'ground' : 'airburst';
    const regime = `${outcome} → ${r.entry.regime}`;
    regimes[regime] = (regimes[regime] ?? 0) + 1;
  }
  return {
    summaries: summariseEiep(ratios),
    craters: sortedRecord(craters),
    regimes: sortedRecord(regimes),
    failed: EIEP_REFERENCE.filter((row) => row.error !== null).length,
  };
}

const EIEP_LABEL: Readonly<Record<EiepQuantity, string>> = {
  energy: 'Energy before entry',
  breakupAltitude: 'Breakup altitude',
  burstAltitude: 'Burst altitude (airbursts)',
  groundVelocity: 'Speed at the ground',
  transientDiameter: 'Transient crater diameter',
  finalDiameter: 'Final crater diameter',
  finalDepth: 'Final crater depth',
  overpressure: 'Air-blast overpressure at the distance (ground impacts)',
  airburstOverpressure: 'Air-blast overpressure at the distance (airbursts)',
  airburstOverpressureHigh: 'The same, high end within three burst altitudes',
  fireballRadius: 'Fireball radius',
  ejectaEdge: 'Ejecta blanket edge (1 cm to 100 m)',
};

function eiepSection(run: EiepRun): string {
  const ratio = (v: number): string => `${v.toFixed(2)}×`;
  const table = (rows: readonly EiepSummary[]): string[] => [
    '| Quantity | Pairs | Geometric mean | 10th pct | Median | 90th pct | Range |',
    '|----------|------:|---------------:|---------:|-------:|---------:|-------|',
    ...rows.map(
      (x) =>
        `| ${EIEP_LABEL[x.quantity]} | ${x.pairs.toString()} | ${ratio(x.geometricMean)} | ${ratio(x.p10)} | ${ratio(x.median)} | ${ratio(x.p90)} | ${ratio(x.min)} – ${ratio(x.max)} |`
    ),
  ];
  const count = (record: Record<string, number>): string =>
    Object.entries(record)
      .map(([k, v]) => `${k}: ${v.toString()}`)
      .join('; ');
  return [
    'The Earth Impact Effects Program is the implementation of the equations this',
    "simulator's impact pipeline cites, run online by their authors (Collins,",
    'Melosh & Marcus 2005). `scripts/eiep-reference.py` fixed a grid of impacts on',
    'land — seven diameters from 10 m to 10 km, three speeds, three angles, three',
    'densities, two targets, five distances — and stores what the program printed',
    `on ${EIEP_READ_ON} (\`validation/eiepReference.ts\`); ${run.failed.toString()} of its ${EIEP_REFERENCE.length.toString()} inputs made the program fail.`,
    'Each figure is simulator over program, over the pairs where both answer.',
    '',
    ...table(run.summaries),
    '',
    `Outcome, program → simulator: ${count(run.regimes)}. Crater, program → simulator: ${count(run.craters)}. Until 14 September 2026 the simulator's entry was a classifier tuned on Chelyabinsk and Tunguska, and it burst in the air 21 of the 57 impacts the program brings to the ground (B-023); it now integrates the same pancake equations (Collins et al.'s Eqs. 8–20), and \`eiepComparison.test.ts\` gates the outcome, the entry, the craters, the ejecta blanket and the fireball to the program's rounding. Since 15 September 2026 the air blast of an airburst is the program's own (Collins et al. 2005 Eqs. 54, 57–58 and Collins et al. 2017 Eq. 7, with their airburst energy and factor-of-two range; B-032), gated at 1 % at both ends on these rows, which were held out when it was adopted (\`docs/BENCHMARK_PROTOCOL.md\`). Two quantities part by design:`,
    '',
    bullet([
      '**Complex crater depth.** The simulator follows Eq. 28 of the paper, d = 0.4 D^0.3; the online program prints about three quarters of that for every complex crater of the grid. Which the authors now intend is a question for them, and the simulator keeps the published relation until it is answered.',
      "**Air blast of an impact that reaches the ground.** The simulator reads Kinney & Graham's free-air fit on the energy that reaches the ground; the program, the air-blast scaling its authors give. The two part from a quarter to eight times across the grid, and neither is a measurement of an impact's blast.",
      "**Strength.** Where a strength class is chosen — every impact preset but Tunguska, and the custom panel's taxonomy — the simulator takes it (Popova et al. 2011); the grid, like the program, takes the strength of Collins et al.'s Eq. 9 from density.",
    ]),
  ].join('\n');
}

function plumeSection(net: CalibrationNet): string {
  const rows = net.plumes.map((c) => {
    const o = c.observation;
    const role = ROLE_LABEL[useOf(o.event, 'plume').role];
    return `| ${o.event} | ${grouped(o.volumeEruptionRate)} m³/s | ${o.observedPlumeHeightKm.toFixed(1)} ± ${o.toleranceKm.toFixed(1)} km | ${c.modelKm.toFixed(1)} km | ${(c.modelKm / o.observedPlumeHeightKm).toFixed(2)}× | ${c.contains ? 'contains' : '**misses**'} | ${o.gated === false ? 'declared' : 'gated'} | ${role} |`;
  });
  return [
    'The height of the column above the vent against the eruption rate that',
    'fed it, by Mastin et al. 2009 (H = 2.00 · V̇^0.241, V̇ in m³ of dense rock',
    "per second). A row is inside when the model lands within the observation's",
    'own uncertainty plus half its predicted height, the scatter of the fit.',
    '',
    '| Eruption | V̇ | Observed above vent | Model | Model / record | Verdict | Standing | Role |',
    '|----------|---:|--------------------:|------:|---------------:|---------|----------|------|',
    ...rows,
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
  const oneSigmaInRadius = Math.exp(EXPECTED_RADIUS_SCATTER);
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
    `realisation of it; one sigma of ground motion (σ_lnY ≈ ${EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma.toFixed(2)}, Boore et al. 2014`,
    `at M ≥ 5.5, over an R^(−0.71) decay) is a factor of ${oneSigmaInRadius.toFixed(1)} in radius and`,
    `${(oneSigmaInRadius ** 2).toFixed(1)} in area before anything is wrong. What a median can honestly be`,
    'held to is being centred and scattering no more than the ground:',
    '',
    `- Bands both reach: **${bias.bands.toString()}**`,
    `- Geometric-mean radius ratio: **${bias.geometricMeanRadiusRatio.toFixed(2)}**, ${bias.biasInStandardErrors.toFixed(2)} standard errors from centred`,
    `- Scatter σ_ln of the radius ratio: **${bias.sdLn.toFixed(2)}**, against the ${EXPECTED_RADIUS_SCATTER.toFixed(2)} the published ground-motion sigma implies. That is a ceiling, not a match: over an area the within-event part of the scatter partly averages out, and the between-event part alone implies ${BETWEEN_EVENT_RADIUS_SCATTER.toFixed(2)}.`,
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

function heldOutTallies(net: CalibrationNet): { tolls: HeldOut; waves: HeldOut; plumes: HeldOut } {
  return {
    plumes: heldOutTally(
      net.plumes,
      (c) => c.observation.event,
      'plume',
      (c) => c.contains,
      () => false
    ),
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
function zerosNote(held: { tolls: HeldOut; waves: HeldOut; plumes: HeldOut }): string {
  const inside = held.tolls.inside + held.waves.inside + held.plumes.inside;
  const zeros = held.tolls.zeros + held.waves.zeros;
  if (inside === 0) return '';
  if (zeros === inside) {
    return ' Every held-out row inside its record is a record of nothing — no dead, or no wave — so no held-out row yet checks a number the model had to get right.';
  }
  return ` ${zeros.toString()} of the ${inside.toString()} held-out rows inside their record are a record of nothing — no dead, or no wave.`;
}

function rolesSection(net: CalibrationNet): string {
  const held = heldOutTallies(net);
  const { tolls, waves, plumes } = held;
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
    `Held out, the tables above read: death tolls **${tolls.inside.toString()} of ${tolls.total.toString()}** inside the band, waves **${waves.inside.toString()} of ${waves.total.toString()}** inside the record, eruption columns **${plumes.inside.toString()} of ${plumes.total.toString()}**.${zerosNote(held)}`,
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
  const heldPlumes = held.plumes;
  return bullet([
    `**Death tolls:** ${tollContains.length.toString()} of ${net.tolls.length.toString()} events inside the model's band; ${tollGated.filter((t) => t.contains).length.toString()} of ${tollGated.length.toString()} gated rows pass. Every miss carries its cause below.`,
    `**Waves:** ${waveContains.length.toString()} of ${net.waves.length.toString()} records inside the model's figure, which is the figure the globe draws wherever the table prints no second one${net.waves.some((w) => w.globeContains === false) ? `; the globe misses ${net.waves.filter((w) => w.globeContains === false).length.toString()} of the records the model contains` : ''}.${waveMissSummary(net.waves)}`,
    `**Shaking footprint:** centred at ${bias.geometricMeanRadiusRatio.toFixed(2)} in radius (${bias.biasInStandardErrors.toFixed(2)} standard errors), scatter σ_ln ${bias.sdLn.toFixed(2)} against a ceiling of ${EXPECTED_RADIUS_SCATTER.toFixed(2)} from ground motion; ${invented.length.toString()} bands painted at an intensity never reached.`,
    `**Held out** — the rows nothing in the model was set on: death tolls ${heldTolls.inside.toString()} of ${heldTolls.total.toString()} inside the band, waves ${heldWaves.inside.toString()} of ${heldWaves.total.toString()}, eruption columns ${heldPlumes.inside.toString()} of ${heldPlumes.total.toString()}.${zerosNote(held)} The rest are fits, shared sources or inputs read back from the record, and each says which under "Which checks are validation".`,
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
  const cells = scorecard(scoreInputs(net));
  const ruleSets = runRuleSets();
  const byRule = ruleCells(ruleSets);
  const eiep = runEiep();
  const ringChecks = verifyRings();
  const contourLaws = runContourLaws();
  const ground = runGround(ruleSets, contourLaws.tolls.boore2014);
  const depth = runDepth(ground.tolls.pick);
  const pagerChain = runPager();
  const interfaceRules = runInterface();
  const interfaceStadium = runStadium();
  const lowIntensity = runLow();
  const pointSource = runPointSourceRules();

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

## Scorecard

${scorecardSection(cells)}

## Held out by rule

${byRuleSection(ruleSets, byRule)}

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

### Eruption columns

${plumeSection(net)}

### Shaking footprint against USGS ShakeMap

${footprintSection(net)}

### Which law draws the intensity rings

${contourLawSection(contourLaws)}

### The ground under the rings

${groundSection(ground)}

### Whether the rings carry depth

${depthSection(depth)}

### PAGER's chain from shaking to loss

${pagerChainSection(pagerChain)}

### The rings of a subduction interface

${interfaceSection(interfaceRules)}

### An interface scenario below Mw 7.5

${stadiumSection(interfaceStadium)}

### The dead below MMI VII

${lowIntensitySection(lowIntensity)}

### A disc's distance to its rupture

${pointSourceSection(pointSource)}

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

### The impact pipeline against the Earth Impact Effects Program

${eiepSection(eiep)}

### The intensity rings against their authors' code

${ringVerificationSection(ringChecks)}

## Declared gaps

What the model is known not to do, stated so nobody has to discover it. The
misses above carry their own causes; these are the gaps that no single row
shows.

${bullet([
  "**A warned coast evacuates on a timer, not on the shaking.** Volcanic scenarios carry the zone that was cleared before the eruption, and inside it the mortality measured at Merapi in 2010. Tsunamis do not yet: a warning with under half an hour of lead has no effect, and on Tōhoku's coast — where the wave itself is right, a median shore height of 9.5 m against a surveyed 8–15, and 57 % of surveyed evacuees left immediately after the shaking — the coastal toll is about three times the record for it (docs/ROADMAP.md, move 3b).",
  "**Distant coasts of very long ruptures get too small a wave, and the cause is not settled.** Sumatra's far coasts are five to ten times under-waved. The far-field law does not use the rupture length. On the deep ocean it holds: across nine megathrusts and 113 DART records, read to rules committed before the law was run on them, it reads 1.00× at the median event and 0.84× beyond 7 000 km, where an exact linear solution for a uniform slip on the same ruptures reads 1.38× (docs/BENCHMARK_PROTOCOL.md, BM-05). None of the nine is as long as Sumatra's 1 300 km (docs/ROADMAP.md, moves 3b and 3d).",
  '**The coastal toll needs bathymetry**, so no offline test reaches it: the death-toll rows above are the shaking, blast and pyroclastic tolls only, and the wave rows are open-ocean amplitudes. The coastal numbers are measured in the browser; docs/ROADMAP.md carries the console snippet that reproduces them.',
  "**The toll band draws the fatality curve's published scatter, but not the census.** Since 14 September 2026 a shaking realisation scales its mortality by exp(N(0, G)), G being PAGER's `gnormvalue` for the country — the standard deviation of ln(deaths) PAGER's own loss module uses. The population is still held fixed, and so are the blast and pyroclastic rates, which publish no scatter. G was measured on ShakeMap intensities, so it overlaps, by an amount not separated here, with the ground-motion residual drawn beside it. Where the curve is steep or its scatter large the band spans four orders of magnitude or more — Gorkha, Kumamoto, Pohang — which is the width PAGER's own numbers give a single event, and a row inside such a band has passed nothing (`uq/tollBand.ts`).",
  greatRuptureGap(byRule.earthquakes),
  ringsGap(depth),
  "**Subduction earthquakes are shaken with laws fitted to crustal ones.** The intensity rings and the reported accelerations use Boore et al. 2014, fitted on shallow crustal events; no subduction-interface relation is implemented, and Tōhoku's MMI VIII band in the footprint table, nearly three times the ShakeMap's area, is where it shows. Two more simplifications show on the same event. Every fault slips on one rigidity, 30 GPa, where along megathrusts it changes with depth (Bilek & Lay 1999). And Tōhoku's mean slip is 13.0 m where the inversions average about 10, because the Strasser et al. 2010 rupture area it is divided by is smaller than the inverted one; a rigidity changed across the board does not mend it, since the rows that depend on it need to move in opposite directions (docs/ROADMAP.md, M9 move 3).",
  "**Two wave calibrations stand on numbers their sources do not give.** Anak Krakatau's subaerial prefactor, K = 0.4, was set on an ≈ 85 m source amplitude credited to Grilli et al. 2019, who simulate a leading wave nearly 50 m high near the island; the preset makes 80 m, and no row of this report checks it. Storegga's submarine prefactor, K = 0.005, was set on a 5–10 m source amplitude credited to Bondevik et al. 2005, who read run-up from deposits (its row above says so). Neither is re-tuned until a number the source does give is chosen to tune on (docs/ROADMAP.md, move 0b).",
  "**Two numbers are not traced to a source read here.** The arrival times the travel-time tests compared against had a citation that does not exist, so `tsunami.test.ts` skips them until times are read from a published table; and the complex-crater depth is Herrick et al. 1997's Venus relation, read only through Collins et al. 2005. A third, the 30 cm at DART 21413 that the Tōhoku wave row was tuned on, was read from the buoy's own file on 15 September 2026: it crests at 0.81 m, and the row is declared (B-034).",
  "**An airburst's blast is a point that does not move, drawn as round rings.** Since 15 September 2026 it is the Earth Impact Effects Program's own air blast (Collins et al. 2005 and 2017; B-032), reproduced within 1 % on the airburst rows above, which were held out when it was adopted. What that model is not was checked against rules written first (`docs/BENCHMARK_PROTOCOL.md`): against the shock-physics runs of Collins et al. 2017, Table 2, its figures are 0.92× theirs, the median off by a factor of 1.21; at Tunguska its 20 kPa ring reaches 11.5 km, against the 26.5 km radius of the ~2 200 km² of flattened forest (0.43×), beyond a factor of two. At Chelyabinsk the check first flagged a 1 kPa ring of 17.6 km against the 56 km radius of the ~10 000 km² over which windows broke; the preset then took the body Popova et al. 2013 measured, as its source says and not as the check asked (B-033), and on a re-run that is not a validation the ring reaches 30.2 km (0.54×), 68.0 km for a moving source. In the city, 45 km out, the law gives 0.74 kPa where the broken windows put about 3.2 kPa (Brown et al. 2013). A shallow, high burst spreads its energy along its path and damages an ellipse, farthest across the path; ReVelle's weak-shock line source, the only analytic one, is \"largely inapplicable\" beneath Chelyabinsk's trail (Gi, Brown & Aftosmis 2018), and the elongated footprint has been reproduced only by three-dimensional hydrocodes (Popova et al. 2013; Aftosmis et al. 2016). Tunguska's blast row checks the energy, not the blast (`effects/airburstBlast.ts`).",
  "**Parts of the explosion model are the project's, not the book's.** Burn thresholds are fixed fluences of 8, 5 and 2 cal/cm² where Glasstone & Dolan make them grow with yield; the initial-radiation radii scale as a project fit not checked against the book's dose–range curves; the thermal partition between a burst on the ground and one in the air is a straight line rather than the book's Table 7.101; and the conventional mortality bands were composed with Beirut in view (docs/ROADMAP.md, move 0b).",
  "**No impact in recorded history left a death toll**, so an impact's toll will never be validated. The simulator says so beside every impact toll.",
  "**A burst on the surface of open water makes no wave here.** Glasstone & Dolan's wave relations are for a burst within the water, at any depth in it (§6.119), and give nothing for one on its surface, so the wave steps from nothing to the full relation as the charge goes under. The wider explosion-wave literature describes surface bursts that do make waves; until a relation is taken from it, the step stays and is said (docs/ROADMAP.md, M9 move 3).",
  "**The volcanic relations are the project's calibrations, and a current is a disc.** The reach of pyroclastic currents (L = 10 · V^⅓, a project mobility), the ashfall, the lahars and the climate response were set on anchors that the source review of 14 September did not recheck (docs/ROADMAP.md, move 0b). A current is drawn as a disc about the vent: held out, Fuego 2018's reaches 3.7 km where the current that killed ran 11.7 km down one ravine, and its toll lands inside the record only because a reach three times short and a footprint far too wide cancel; Unzen 1991's reaches 0.84 km against a flow of 3.2 km.",
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
      plumes: net.plumes.map((c) => ({
        eruption: c.observation.event,
        volumeEruptionRate: fixed(c.observation.volumeEruptionRate, 1),
        observedKm: fixed(c.observation.observedPlumeHeightKm, 3),
        toleranceKm: c.observation.toleranceKm,
        modelKm: fixed(c.modelKm, 3),
        contains: c.contains,
        gated: c.observation.gated !== false,
        role: useOf(c.observation.event, 'plume').role,
        source: c.observation.source,
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
      scorecard: cells.map((c) => ({
        quantity: c.quantity,
        family: c.family,
        sizeBand: c.sizeBand,
        predictive: PREDICTIVE_BAND[c.quantity],
        heldOut: scoreJson(c.heldOut),
        all: scoreJson(c.all),
      })),
      contourLaws: {
        winner: contourLaws.comparison.winner,
        adopted: contourLaws.adopted,
        events: contourLaws.comparison.events,
        meanAbsoluteBias: Object.fromEntries(
          CONTOUR_LAWS.map((law) => [law, fixed(contourLaws.comparison.meanAbsoluteBias[law], 3)])
        ),
        shakemap: Object.fromEntries(
          CONTOUR_LAWS.map((law) => [
            law,
            contourLaws.comparison.scores[law].map((c) => ({
              sizeBand: c.sizeBand,
              pairs: c.pairs,
              bias: c.bias === null ? null : fixed(c.bias, 3),
              scatter: c.scatter === null ? null : fixed(c.scatter, 3),
              invented: c.invented,
              missed: c.missed,
            })),
          ])
        ),
        tolls: {
          joynerBoore1981: contourLaws.tolls.joynerBoore1981.map((c) => ({
            sizeBand: c.group,
            ...scoreJson(c.stats),
          })),
          boore2014: contourLaws.tolls.boore2014.map((c) => ({
            sizeBand: c.group,
            ...scoreJson(c.stats),
          })),
        },
      },
      depth: {
        readOn: UNSEEN_READ_ON,
        listed: UNSEEN_LISTED,
        earthquakes: UNSEEN_EARTHQUAKES.length,
        quiet: UNSEEN_EARTHQUAKES.filter(isQuiet).length,
        withoutCoverage: UNSEEN_WITHOUT_COVERAGE.length,
        winner: depth.unseen.winner,
        adopted: depth.adopted,
        meanAbsoluteBias: Object.fromEntries(
          DEPTH_CANDIDATES.map((law) => [law, fixed(depth.unseen.meanAbsoluteBias[law], 3)])
        ),
        shakemap: Object.fromEntries(
          DEPTH_CANDIDATES.map((law) => [
            law,
            depth.unseen.scores[law].map((c) => ({
              sizeBand: c.sizeBand,
              pairs: c.pairs,
              bias: c.bias === null ? null : fixed(c.bias, 3),
              scatter: c.scatter === null ? null : fixed(c.scatter, 3),
              invented: c.invented,
              missed: c.missed,
            })),
          ])
        ),
        quietShare: Object.fromEntries(
          DEPTH_CANDIDATES.filter((law) => depth.quietShare[law] !== undefined).map((law) => [
            law,
            fixed(depth.quietShare[law] ?? 0, 4),
          ])
        ),
      },
      pagerChain: {
        readOn: PAGER_PRODUCTS_READ_ON,
        decision: run33(pagerChain),
        chains: Object.fromEntries(
          CHAIN_NAMES.map((name) => {
            const c = pagerChain.chains[name];
            return [
              name,
              {
                peopleScore: fixed(c.people.score, 3),
                people: c.people.cells.map((cell) => ({
                  level: cell.level,
                  sizeBand: cell.sizeBand,
                  pairs: cell.pairs,
                  bias: cell.bias === null ? null : fixed(cell.bias, 3),
                })),
                tolls: c.tolls.map((t) => ({
                  sizeBand: t.group,
                  bias: t.stats.bias === null ? null : fixed(t.stats.bias, 3),
                  inside: t.stats.inside,
                  rows: t.stats.rows,
                })),
                shakemapScore: fixed(c.shakingScore, 3),
                tollAgainstPager:
                  c.people.tollAgainstPager.bias === null
                    ? null
                    : fixed(c.people.tollAgainstPager.bias, 3),
                alertAgreement: fixed(c.people.alertAgreement, 3),
                rule28Score: c.quietMaps.score === null ? null : fixed(c.quietMaps.score, 3),
                rule28Sharpness:
                  c.quietMaps.sharpness === null ? null : fixed(c.quietMaps.sharpness, 3),
              },
            ];
          })
        ),
      },
      interfaceStadium: {
        readOn: DEEP_INTERFACE_READ_ON,
        events: interfaceStadium.events,
        meanAbsoluteBias: {
          always: fixed(interfaceStadium.choice.inPlace, 3),
          'fromMw7.5': fixed(interfaceStadium.choice.candidate, 3),
        },
        eligible: interfaceStadium.choice.eligible,
        dead:
          interfaceStadium.dead === null
            ? null
            : {
                decision: interfaceStadium.dead.decision,
                quietShare: {
                  always: fixed(interfaceStadium.dead.quiet.always.share, 4),
                  'fromMw7.5': fixed(interfaceStadium.dead.quiet['fromMw7.5'].share, 4),
                },
                recordedScore: {
                  always: fixed(recordedScore(interfaceStadium.dead.recorded.always), 3),
                  'fromMw7.5': fixed(recordedScore(interfaceStadium.dead.recorded['fromMw7.5']), 3),
                },
              },
      },
      lowIntensity: {
        readOn: MODERATE_READ_ON,
        events: lowIntensity.events,
        score: Object.fromEntries(
          LOW_INTENSITY_TOLLS.map((toll) => [toll, fixed(lowIntensity.choice.score[toll], 3)])
        ),
        held: lowIntensity.choice.held,
        eligible: lowIntensity.choice.eligible,
        winner: lowIntensity.choice.winner,
        guards:
          lowIntensity.winner === null
            ? null
            : {
                toll: lowIntensity.winner.toll,
                decision: lowIntensity.winner.decision,
                tollLogBias: {
                  inPlace: fixed(tollLogBias(lowIntensity.winner.tolls.inPlace), 3),
                  winner: fixed(tollLogBias(lowIntensity.winner.tolls.winner), 3),
                },
                quietShare: {
                  inPlace: fixed(lowIntensity.winner.quiet.inPlace.share, 4),
                  winner: fixed(lowIntensity.winner.quiet.winner.share, 4),
                },
              },
      },
      pointSource: pointSourceJson(pointSource),
      interfaceRules: {
        readOn: INTERFACE_SET_READ_ON,
        events: interfaceRules.events,
        meanAbsoluteBias: Object.fromEntries(
          INTERFACE_READINGS.map((reading) => [
            reading,
            Object.fromEntries(
              INTERFACE_LAWS.map((law) => [
                law,
                fixed(interfaceRules.choice.meanAbsoluteBias[reading][law], 3),
              ])
            ),
          ])
        ),
        eligible: interfaceRules.choice.eligible,
        winner: interfaceRules.choice.winner,
        dead:
          interfaceRules.dead === null
            ? null
            : {
                decision: interfaceRules.dead.decision,
                tolls: Object.fromEntries(
                  Object.entries(interfaceRules.dead.tolls).map(([law, cells]) => [
                    law,
                    cells.map((t) => ({
                      sizeBand: t.group,
                      bias: t.stats.bias === null ? null : fixed(t.stats.bias, 3),
                      inside: t.stats.inside,
                      rows: t.stats.rows,
                    })),
                  ])
                ),
                quiet: Object.fromEntries(
                  Object.entries(interfaceRules.dead.quiet).map(([law, q]) => [
                    law,
                    { share: fixed(q.share, 4), earthquakes: q.quiet },
                  ])
                ),
              },
        stationsEvents: interfaceRules.beside.stationsEvents,
        presets: interfaceRules.beside.presets.map((p) => ({
          preset: p.preset,
          law: p.law,
          radiiKm: p.radiiKm.map((r) => fixed(r, 1)),
        })),
      },
      ground: {
        sitesReadOn: SITES_READ_ON,
        standing: ground.standing,
        siteRules: {
          winner: ground.sites.winner,
          adopted: ground.siteAdopted,
          meanAbsoluteBias: Object.fromEntries(
            SITE_RULES.map((rule) => [rule, fixed(ground.sites.meanAbsoluteBias[rule], 3)])
          ),
          shakemap: Object.fromEntries(
            SITE_RULES.map((rule) => [
              rule,
              ground.sites.scores[rule].map((c) => ({
                sizeBand: c.sizeBand,
                pairs: c.pairs,
                bias: c.bias === null ? null : fixed(c.bias, 3),
                scatter: c.scatter === null ? null : fixed(c.scatter, 3),
                invented: c.invented,
                missed: c.missed,
              })),
            ])
          ),
          tolls: Object.fromEntries(
            SITE_RULES.map((rule) => [
              rule,
              ground.tolls[rule].map((c) => ({ sizeBand: c.group, ...scoreJson(c.stats) })),
            ])
          ),
        },
        laws: {
          winner: ground.laws.winner,
          adopted: ground.lawAdopted,
          meanAbsoluteBias: Object.fromEntries(
            CONTOUR_LAWS.map((law) => [law, fixed(ground.laws.meanAbsoluteBias[law], 3)])
          ),
          shakemap: Object.fromEntries(
            CONTOUR_LAWS.map((law) => [
              law,
              ground.laws.scores[law].map((c) => ({
                sizeBand: c.sizeBand,
                pairs: c.pairs,
                bias: c.bias === null ? null : fixed(c.bias, 3),
                scatter: c.scatter === null ? null : fixed(c.scatter, 3),
                invented: c.invented,
                missed: c.missed,
              })),
            ])
          ),
        },
      },
      // The per-row tables are in the Markdown copy; the page reads the
      // cells, and the rows that miss.
      byRule: {
        readOn: RULE_READ_ON,
        earthquakes: {
          rows: ruleSets.earthquakes.length,
          heldOut: ruleSets.earthquakes.filter((e) => e.quake.role === 'heldOut').length,
          seen: ruleSets.earthquakes.filter((e) => e.quake.seen).length,
          unmatched: NCEI_UNMATCHED.length,
          cells: byRule.earthquakes.map((c) => ({
            kind: c.kind,
            group: c.group,
            all: scoreJson(c.all),
            informative: scoreJson(c.informative),
            unseen: scoreJson(c.unseen),
          })),
          outside: ruleSets.earthquakes
            .filter((e) => e.quake.role === 'heldOut' && !e.toll.contains)
            .map((e) => ({
              event: e.quake.event.name,
              comcat: e.quake.row.comcat,
              magnitude: e.quake.row.magnitude,
              recorded: e.quake.row.deaths,
              missing: e.quake.row.missing,
              model: Math.round(e.toll.deaths),
              bandLow: Math.round(e.toll.low),
              bandHigh: Math.round(e.toll.high),
              seen: e.quake.seen,
            })),
          tuned: ruleSets.earthquakes
            .filter((e) => e.quake.role === 'tuned')
            .map((e) => ({
              event: e.quake.event.name,
              recorded: e.quake.row.deaths,
              model: Math.round(e.toll.deaths),
              bandLow: Math.round(e.toll.low),
              bandHigh: Math.round(e.toll.high),
              contains: e.toll.contains,
            })),
        },
        plumes: {
          rows: ruleSets.plumes.length,
          seen: ruleSets.plumes.filter((p) => p.plume.seen).length,
          cells: byRule.plumes.map((c) => ({
            kind: c.kind,
            group: c.group,
            all: scoreJson(c.all),
            unseen: scoreJson(c.unseen),
          })),
          outside: ruleSets.plumes
            .filter((p) => !p.column.contains)
            .map((p) => ({
              eruption: p.plume.observation.event,
              morphology: p.plume.row.morphology,
              volumeEruptionRate: fixed(p.plume.observation.volumeEruptionRate, 1),
              observedKm: fixed(p.plume.observation.observedPlumeHeightKm, 3),
              toleranceKm: p.plume.observation.toleranceKm,
              modelKm: fixed(p.column.modelKm, 3),
              seen: p.plume.seen,
            })),
        },
      },
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
        expectedSdLn: fixed(EXPECTED_RADIUS_SCATTER, 3),
        betweenEventSdLn: fixed(BETWEEN_EVENT_RADIUS_SCATTER, 3),
        inventedBands: inventedBands(net.footprint),
      },
      interpolation: net.interpolation.map((c) => ({
        event: c.event.name,
        measuredLow: Math.round(c.measured.low),
        measuredHigh: Math.round(c.measured.high),
        interpolatedLow: Math.round(c.interpolated.low),
        interpolatedHigh: Math.round(c.interpolated.high),
        comparable: c.comparable,
        lowComparable: c.lowComparable,
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
    verification: {
      rings: ringChecks.map((r) => ({
        relation: r.relation,
        quantity: r.quantity,
        reference: r.reference,
        rows: r.rows,
        worstRelative: Number(r.worstRelative.toExponential(3)),
        worstAt: r.worstAt,
      })),
      eiep: {
        readOn: EIEP_READ_ON,
        impacts: EIEP_REFERENCE.length,
        failed: eiep.failed,
        summaries: eiep.summaries.map((x) => ({
          quantity: x.quantity,
          pairs: x.pairs,
          geometricMean: fixed(x.geometricMean, 3),
          p10: fixed(x.p10, 3),
          median: fixed(x.median, 3),
          p90: fixed(x.p90, 3),
          min: fixed(x.min, 3),
          max: fixed(x.max, 3),
        })),
        regimes: eiep.regimes,
        craters: eiep.craters,
      },
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
