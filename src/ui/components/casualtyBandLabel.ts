import type { BandEstimate, CasualtyEstimate } from '../../physics/casualties.js';

/** The i18n suffix of a band's label: its OTA class, the coast the
 *  wave reached, a burns-only annulus, a fire-only one, or the
 *  single-hazard key.
 *
 *  The fire-only case is the annulus past the second-degree burn
 *  radius where the column still ignites, and it is not a small one:
 *  for a 500 Mt burst it runs from 177 km to the fireball horizon at
 *  365 km and carries two thirds of the dead. It used to fall through
 *  to `band.key` and print `casualties.band.b6` on the report. */
export function bandLabelKey(band: BandEstimate, model: CasualtyEstimate['model']): string {
  if (band.hazards[0] === 'tsunami') return 'tsunami';
  if (band.psiBand !== undefined) return band.psiBand;
  if (model === 'blast' && band.hazards.includes('thermal')) return 'thermalOnly';
  if (model === 'blast' && band.hazards.includes('firestorm')) return 'firestormOnly';
  return band.key;
}
