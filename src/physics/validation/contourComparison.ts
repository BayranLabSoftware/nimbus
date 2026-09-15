import {
  simulateEarthquake,
  type ContourLaw,
  type DeepLaw,
  type IntensityMeasure,
  type InterfaceStadium,
  type PointSourceDistance,
} from '../events/earthquake/simulate.js';
import type { FaultType } from '../events/earthquake/ruptureLength.js';
import { m } from '../units.js';
import {
  chooseCandidate,
  chooseContourLaw,
  CONTOUR_LAWS,
  scoreContours,
  type ContourCell,
  type ContourPair,
  type Rule17Law,
  type ShakemapAreas,
} from './contourLaws.js';
import { RULE_EARTHQUAKES } from './heldOutByRule.js';
import { footprintAreaKm2, MMI_THRESHOLDS } from './shakemapFootprint.js';
import { SITE_RULES, siteVs30, type SiteRow, type SiteRule } from './siteVs30.js';

/**
 * Rule 18 of contourLaws.ts, run: every candidate's footprint against
 * the ShakeMap of every earthquake of rule 11's set that has one, on
 * rule 12's inputs, and the winner. Rules 21 and 22 of siteVs30.ts run
 * the same comparison on the ground each site rule gives.
 *
 * One computation for the report that prints it and the test that
 * keeps the report honest about it.
 */

/** What a comparison runs an earthquake on: rules 1 to 3's inputs. */
export interface QuakeInputs {
  comcat: string;
  magnitude: number;
  depthKm: number;
  faultType: FaultType;
}

/** The Vs30 a row runs on; nothing, reference rock, unless given. */
export type RowVs30 = (row: QuakeInputs) => number | undefined;

const RULE_ROWS: readonly QuakeInputs[] = RULE_EARTHQUAKES.map((q) => q.row);

/** Every row's footprint under `law` against its ShakeMap. `subductionInterface`
 *  marks every row an interface scenario, as rule 35 of interfaceRules.ts
 *  runs its set, `interfaceStadium` sets its geometry below Mw 7.5, as
 *  rule 41 of interfaceStadiumRules.ts does, `pointSourceDistance` the
 *  distance a disc's rings stand at, as rule 51 of pointSourceRules.ts
 *  does, and `deepLaw` the law of a row deeper than 70 km, as rule 67 of
 *  slabRules.ts does. */
export function contourPairs(
  law: ContourLaw,
  shakemaps: readonly ShakemapAreas[],
  vs30For?: RowVs30,
  rows: readonly QuakeInputs[] = RULE_ROWS,
  measure: IntensityMeasure = 'pga',
  subductionInterface = false,
  interfaceStadium?: InterfaceStadium,
  pointSourceDistance?: PointSourceDistance,
  deepLaw?: DeepLaw
): ContourPair[] {
  const byEvent = new Map(shakemaps.map((s) => [s.comcat, s]));
  const pairs: ContourPair[] = [];
  for (const row of rows) {
    const shakemap = byEvent.get(row.comcat);
    if (shakemap === undefined) continue;
    const vs30 = vs30For?.(row);
    const result = simulateEarthquake({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
      contourLaw: law,
      ...(measure === 'pga' ? {} : { intensityMeasure: measure }),
      ...(vs30 === undefined ? {} : { vs30 }),
      ...(subductionInterface ? { subductionInterface } : {}),
      ...(interfaceStadium === undefined ? {} : { interfaceStadium }),
      ...(pointSourceDistance === undefined ? {} : { pointSourceDistance }),
      ...(deepLaw === undefined ? {} : { deepLaw }),
    });
    for (const threshold of MMI_THRESHOLDS) {
      pairs.push({
        magnitude: row.magnitude,
        threshold,
        modelKm2: footprintAreaKm2(result, threshold),
        observedKm2: shakemap.areaKm2[threshold],
      });
    }
  }
  return pairs;
}

export interface ContourComparison {
  scores: Record<Rule17Law, ContourCell[]>;
  meanAbsoluteBias: Record<Rule17Law, number>;
  winner: Rule17Law;
  /** Earthquakes compared. */
  events: number;
}

function comparedEvents(shakemaps: readonly ShakemapAreas[]): number {
  const ids = new Set(shakemaps.map((s) => s.comcat));
  return RULE_EARTHQUAKES.filter((q) => ids.has(q.row.comcat)).length;
}

export function compareContourLaws(
  shakemaps: readonly ShakemapAreas[],
  options: { inPlace: Rule17Law; vs30For?: RowVs30 }
): ContourComparison {
  const scores = Object.fromEntries(
    CONTOUR_LAWS.map((law) => [law, scoreContours(contourPairs(law, shakemaps, options.vs30For))])
  ) as Record<Rule17Law, ContourCell[]>;
  return {
    scores,
    ...chooseContourLaw(scores, options.inPlace),
    events: comparedEvents(shakemaps),
  };
}

export interface SiteComparison {
  scores: Record<SiteRule, ContourCell[]>;
  meanAbsoluteBias: Record<SiteRule, number>;
  winner: SiteRule;
  events: number;
}

/** Rule 21 on the ShakeMaps: each site rule under one law, the rule in
 *  place `pick`. */
export function compareSiteRules(
  shakemaps: readonly ShakemapAreas[],
  sites: ReadonlyMap<string, SiteRow>,
  law: ContourLaw
): SiteComparison {
  const scores = Object.fromEntries(
    SITE_RULES.map((rule) => [
      rule,
      scoreContours(contourPairs(law, shakemaps, (row) => siteVs30(rule, sites.get(row.comcat)))),
    ])
  ) as Record<SiteRule, ContourCell[]>;
  return {
    scores,
    ...chooseCandidate(SITE_RULES, 'pick', scores),
    events: comparedEvents(shakemaps),
  };
}

export interface CandidateComparison<T extends ContourLaw> {
  scores: Record<T, ContourCell[]>;
  meanAbsoluteBias: Record<T, number>;
  winner: T;
  /** Earthquakes compared: the rows with a ShakeMap. */
  events: number;
}

/** Rule 24 on any set of rows: each candidate law on its ShakeMaps, on
 *  the ground `vs30For` gives, chosen as rule 18 chooses. */
export function compareCandidates<T extends ContourLaw>(
  laws: readonly T[],
  inPlace: T,
  shakemaps: readonly ShakemapAreas[],
  rows: readonly QuakeInputs[],
  vs30For: RowVs30
): CandidateComparison<T> {
  const scores = Object.fromEntries(
    laws.map((law) => [law, scoreContours(contourPairs(law, shakemaps, vs30For, rows))])
  ) as Record<T, ContourCell[]>;
  const ids = new Set(shakemaps.map((s) => s.comcat));
  return {
    scores,
    ...chooseCandidate(laws, inPlace, scores),
    events: rows.filter((row) => ids.has(row.comcat)).length,
  };
}
