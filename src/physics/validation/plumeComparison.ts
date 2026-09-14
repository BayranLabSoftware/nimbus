import { plumeHeight } from '../events/volcano/plumeHeight.js';
import type { PlumeHeightObservation } from './fixtures.js';

/**
 * An eruption column against the height observed.
 *
 * One computation for the suite that gates the plume rows, the report
 * that prints them and the scorecard that scores them.
 */
export interface PlumeComparison {
  observation: PlumeHeightObservation;
  /** Mastin et al. 2009 at the observation's eruption rate, km above
   *  the vent. */
  modelKm: number;
  /** Inside the observation's own uncertainty plus half the predicted
   *  height, the scatter of the fit. */
  contains: boolean;
}

export function comparePlume(observation: PlumeHeightObservation): PlumeComparison {
  const modelKm =
    (plumeHeight({ volumeEruptionRate: observation.volumeEruptionRate }) as number) / 1_000;
  const tolerance = observation.toleranceKm + 0.5 * modelKm;
  return {
    observation,
    modelKm,
    contains: Math.abs(modelKm - observation.observedPlumeHeightKm) < tolerance,
  };
}
