/**
 * Photographs of the globe for the printed report (ROADMAP IMP-7c, map C):
 * each layer of an impact's map as the globe draws it, seen from straight
 * above, for the corner of the report's own map of that layer.
 *
 * Only a mounted globe can take them, and the report replaces the globe, so
 * the globe registers here how to take them and the button that opens the
 * report asks for them first. A report opened from a link has no globe behind
 * it and prints its maps without the photographs, and says so.
 */
import type { ImpactLayerId } from './impactFieldMap.js';

/** A JPEG data URL for each layer photographed. */
export type GlobeShots = Partial<Record<ImpactLayerId, string>>;

export type ShotProgress = (done: number, total: number) => void;

type Capture = (layers: readonly ImpactLayerId[], progress: ShotProgress) => Promise<GlobeShots>;

let capture: Capture | null = null;

/** Called by the globe while it is mounted; returns the unregistration. */
export function registerGlobeShots(fn: Capture): () => void {
  capture = fn;
  return () => {
    if (capture === fn) capture = null;
  };
}

/** The globe's photographs of these layers, or none where no globe is
 *  mounted or it could not take them. */
export async function takeGlobeShots(
  layers: readonly ImpactLayerId[],
  progress: ShotProgress = () => undefined
): Promise<GlobeShots> {
  if (capture === null) return {};
  try {
    return await capture(layers, progress);
  } catch (err) {
    console.warn('[globeShots] the globe could not be photographed:', err);
    return {};
  }
}
