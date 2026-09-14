import { simulateEarthquake, type ContourLaw } from '../events/earthquake/simulate.js';
import { m } from '../units.js';
import {
  chooseContourLaw,
  CONTOUR_LAWS,
  scoreContours,
  type ContourCell,
  type ContourPair,
  type ShakemapAreas,
} from './contourLaws.js';
import { RULE_EARTHQUAKES } from './heldOutByRule.js';
import { footprintAreaKm2, MMI_THRESHOLDS } from './shakemapFootprint.js';

/**
 * Rule 18 of contourLaws.ts, run: every candidate's footprint against
 * the ShakeMap of every earthquake of rule 11's set that has one, on
 * rule 12's inputs, and the winner.
 *
 * One computation for the report that prints it and the test that
 * keeps the report honest about it.
 */

export function contourPairs(law: ContourLaw, shakemaps: readonly ShakemapAreas[]): ContourPair[] {
  const byEvent = new Map(shakemaps.map((s) => [s.comcat, s]));
  const pairs: ContourPair[] = [];
  for (const { row } of RULE_EARTHQUAKES) {
    const shakemap = byEvent.get(row.comcat);
    if (shakemap === undefined) continue;
    const result = simulateEarthquake({
      magnitude: row.magnitude,
      depth: m(row.depthKm * 1_000),
      faultType: row.faultType,
      contourLaw: law,
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

export function compareContourLaws(shakemaps: readonly ShakemapAreas[]): ContourComparison {
  const scores = Object.fromEntries(
    CONTOUR_LAWS.map((law) => [law, scoreContours(contourPairs(law, shakemaps))])
  ) as Record<ContourLaw, ContourCell[]>;
  const ids = new Set(shakemaps.map((s) => s.comcat));
  return {
    scores,
    ...chooseContourLaw(scores),
    events: RULE_EARTHQUAKES.filter((q) => ids.has(q.row.comcat)).length,
  };
}
