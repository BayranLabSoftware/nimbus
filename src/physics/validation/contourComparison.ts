import { simulateEarthquake, type ContourLaw } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import {
  chooseCandidate,
  chooseContourLaw,
  CONTOUR_LAWS,
  scoreContours,
  type ContourCell,
  type ContourPair,
  type ShakemapAreas,
} from './contourLaws.js';
import { RULE_EARTHQUAKES } from './heldOutByRule.js';
import type { RuleEarthquakeRow } from './heldOutByRuleData.js';
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

/** The Vs30 a row runs on; nothing, reference rock, unless given. */
export type RowVs30 = (row: RuleEarthquakeRow) => number | undefined;

export function contourPairs(
  law: ContourLaw,
  shakemaps: readonly ShakemapAreas[],
  vs30For?: RowVs30
): ContourPair[] {
  const byEvent = new Map(shakemaps.map((s) => [s.comcat, s]));
  const pairs: ContourPair[] = [];
  for (const { row } of RULE_EARTHQUAKES) {
    const shakemap = byEvent.get(row.comcat);
    if (shakemap === undefined) continue;
    const vs30 = vs30For?.(row);
    const result = simulateEarthquake({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
      contourLaw: law,
      ...(vs30 === undefined ? {} : { vs30 }),
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
  scores: Record<ContourLaw, ContourCell[]>;
  meanAbsoluteBias: Record<ContourLaw, number>;
  winner: ContourLaw;
  /** Earthquakes compared. */
  events: number;
}

function comparedEvents(shakemaps: readonly ShakemapAreas[]): number {
  const ids = new Set(shakemaps.map((s) => s.comcat));
  return RULE_EARTHQUAKES.filter((q) => ids.has(q.row.comcat)).length;
}

export function compareContourLaws(
  shakemaps: readonly ShakemapAreas[],
  options: { inPlace: ContourLaw; vs30For?: RowVs30 }
): ContourComparison {
  const scores = Object.fromEntries(
    CONTOUR_LAWS.map((law) => [law, scoreContours(contourPairs(law, shakemaps, options.vs30For))])
  ) as Record<ContourLaw, ContourCell[]>;
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
