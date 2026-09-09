/**
 * Observed shaking footprints — GENERATED, do not edit by hand.
 *
 * Run `pnpm shakemap:build` to regenerate from the USGS event API.
 *
 * The ground area above each MMI threshold, from the ShakeMap of each
 * event: the only field measurement of an earthquake's shaking there
 * is. Area and not a contour, because the model draws circles and
 * stadiums where the earth draws whatever the geology says, and what
 * the two can honestly be compared on is how much ground shook that
 * hard.
 *
 * Source: USGS Earthquake Hazards Program, ShakeMap product
 * (`coverage_mmi_*.covjson`), public domain.
 */

export interface ShakemapFootprint {
  /** The event, as the calibration net names it. */
  name: string;
  /** The preset in `EARTHQUAKE_PRESETS` this anchors. */
  preset: string;
  /** USGS event id, so the fixture can be traced back. */
  eventId: string;
  /** Highest MMI anywhere in the published map. */
  maxMmi: number;
  /** Ground area (km²) at or above MMI 7, 8 and 9. Zero means the
   *  event never reached that intensity anywhere. */
  areaKm2: { 7: number; 8: number; 9: number };
}

export const SHAKEMAP_FOOTPRINTS: readonly ShakemapFootprint[] = [
  {
    name: 'Northridge 1994',
    preset: 'NORTHRIDGE_1994',
    eventId: 'ci3144585',
    maxMmi: 8.79,
    areaKm2: { 7: 2824, 8: 823, 9: 0 },
  },
  {
    name: "L'Aquila 2009",
    preset: 'L_AQUILA_2009',
    eventId: 'usp000gvtu',
    maxMmi: 7.81,
    areaKm2: { 7: 61, 8: 0, 9: 0 },
  },
  {
    name: 'Amatrice 2016',
    preset: 'AMATRICE_2016',
    eventId: 'us10006g7d',
    maxMmi: 7.37,
    areaKm2: { 7: 26, 8: 0, 9: 0 },
  },
  {
    name: 'Gorkha 2015',
    preset: 'NEPAL_2015',
    eventId: 'us20002926',
    maxMmi: 8.72,
    areaKm2: { 7: 40767, 8: 3799, 9: 0 },
  },
  {
    name: 'Tōhoku 2011',
    preset: 'TOHOKU_2011',
    eventId: 'official20110311054624120_30',
    maxMmi: 8.18,
    areaKm2: { 7: 199742, 8: 67625, 9: 0 },
  },
  {
    name: 'Kokoxili 2001',
    preset: 'KUNLUN_2001',
    eventId: 'usp000asvm',
    maxMmi: 9.25,
    areaKm2: { 7: 51427, 8: 23334, 9: 1700 },
  },
];
