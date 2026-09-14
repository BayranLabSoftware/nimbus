import { extractTsunamiMeta, type ActiveResult } from '../../store/useAppStore.js';
import { veilLaw } from '../tsunami/amplitudeField.js';
import { propagationSpeed } from '../tsunami/linearWaves.js';

/**
 * What the amplitude veil on the globe draws for a result at a range,
 * on a flat sea: the field's own per-cell law, at the arrival time the
 * fast-marching solver gives on flat water. The depth is the sea the
 * wave was measured in, or the source's own where the row names none.
 * A bearing matters only to an oriented source.
 *
 * In a module of its own so that the wave rows and the held-out rows
 * can both ask it without importing each other.
 */
export function globeVeilAt(
  result: ActiveResult,
  rangeM: number,
  sea: { depthM?: number; bearingDeg?: number } = {}
): number {
  const meta = extractTsunamiMeta(result);
  if (meta === null) return 0;
  const depthM = sea.depthM ?? meta.sourceDepthM;
  const arrivalTimeS = rangeM / propagationSpeed(depthM, meta.sourcePeriodS);
  return veilLaw(meta)(arrivalTimeS, depthM, sea.bearingDeg);
}
