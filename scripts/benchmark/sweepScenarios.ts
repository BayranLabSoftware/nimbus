/**
 * The thirty scenarios of 18 September 2026, in the corners of the input
 * space: a metre of stone over a city and ten kilometres of it, a burst forty
 * kilometres up and one thirty metres under a shelf sea, a slope below its
 * friction angle, a caldera falling into the sea.
 *
 * They were written for `report-sweep.ts`, which reads what the report page
 * says about each. `globe-audit.ts` reads what the globe draws for the same
 * thirty, so the two are asking about one set of events and not two.
 */

export interface Scenario {
  id: string;
  family: string;
  note: string;
  params: Record<string, string | number>;
}

/** A place on land, a place at sea, a place on a coast. */
const ROME = { lat: 41.898, lon: 12.481 };
const OPEN_SEA = { lat: -10, lon: -140 };
const NAPLES_BAY = { lat: 40.75, lon: 14.35 };
const TOKYO_BAY = { lat: 35.4, lon: 139.8 };
const ANDES = { lat: -33.4, lon: -70.0 };
const ALPS = { lat: 46.27, lon: 12.33 };

export const SWEEP_SCENARIOS: Scenario[] = [
  // ---- cosmic impacts ---------------------------------------------------
  {
    id: 'impact-tiny-land',
    family: 'impact',
    note: 'a metre of stone over a city: everything should end in the air',
    params: { t: 'impact', d: 1, s: 17_000, a: 45, rho: 3_000, ...ROME },
  },
  {
    id: 'impact-chelyabinsk-like',
    family: 'impact',
    note: 'twenty metres at a shallow angle, the Chelyabinsk corner',
    params: { t: 'impact', d: 20, s: 19_200, a: 18, rho: 3_300, ...ROME },
  },
  {
    id: 'impact-iron-ground',
    family: 'impact',
    note: 'fifty metres of iron, steep: a crater and no airburst',
    params: { t: 'impact', d: 50, s: 17_000, a: 80, rho: 7_800, ...ROME },
  },
  {
    id: 'impact-ocean-deep',
    family: 'impact',
    note: 'a kilometre into open ocean: the wave is the story',
    params: { t: 'impact', d: 1_000, s: 20_000, a: 45, rho: 3_000, wd: 4_000, ...OPEN_SEA },
  },
  {
    id: 'impact-ten-km',
    family: 'impact',
    note: 'ten kilometres on land: everything saturates',
    params: { t: 'impact', d: 10_000, s: 20_000, a: 45, rho: 3_000, ...ROME },
  },
  // ---- explosions -------------------------------------------------------
  {
    id: 'explosion-hiroshima-like',
    family: 'explosion',
    note: 'fifteen kilotonnes at 580 m, the airburst everyone knows',
    params: { t: 'explosion', y: 0.015, h: 580, gt: 'FIRM_GROUND', ...ROME },
  },
  {
    id: 'explosion-contact-city',
    family: 'explosion',
    note: 'a megatonne on the ground: a crater in a city',
    params: { t: 'explosion', y: 1, h: 0, gt: 'FIRM_GROUND', ...ROME },
  },
  {
    id: 'explosion-chemical-port',
    family: 'explosion',
    note: 'half a kilotonne of ammonium nitrate on a quay, the Beirut corner',
    params: { t: 'explosion', y: 0.0005, h: 0, ct: 'chemical', gt: 'WET_SOIL', ...NAPLES_BAY },
  },
  {
    id: 'explosion-underwater-shallow',
    family: 'explosion',
    note: 'twenty kilotonnes thirty metres under a shelf sea',
    params: { t: 'explosion', y: 0.02, h: -30, wd: 60, ...TOKYO_BAY },
  },
  {
    id: 'explosion-high-altitude',
    family: 'explosion',
    note: 'a megatonne at forty kilometres: no blast should reach the ground',
    params: { t: 'explosion', y: 1, h: 40_000, ...ROME },
  },
  // ---- earthquakes ------------------------------------------------------
  {
    id: 'quake-shallow-strike-slip',
    family: 'earthquake',
    note: 'Mw 6.5 at 8 km under a city, strike-slip',
    params: { t: 'earthquake', mw: 6.5, dep: 8_000, ft: 'strike-slip', ...ROME },
  },
  {
    id: 'quake-deep-slab',
    family: 'earthquake',
    note: 'Mw 7.5 at 300 km: a slab event, felt far and wide',
    params: { t: 'earthquake', mw: 7.5, dep: 300_000, ft: 'reverse', ...ANDES },
  },
  {
    id: 'quake-megathrust-offshore',
    family: 'earthquake',
    note: 'Mw 9.0 on an interface offshore: rupture, uplift and a wave',
    params: {
      t: 'earthquake',
      mw: 9,
      dep: 20_000,
      ft: 'reverse',
      si: 1,
      st: 200,
      ...TOKYO_BAY,
    },
  },
  {
    id: 'quake-small-remote',
    family: 'earthquake',
    note: 'Mw 4.5 in open country: almost nothing should be claimed',
    params: { t: 'earthquake', mw: 4.5, dep: 10_000, ft: 'normal', ...ANDES },
  },
  {
    id: 'quake-submarine-coastal',
    family: 'earthquake',
    note: 'Mw 7.8 just off a coast, shallow: the wave reaches land at once',
    params: { t: 'earthquake', mw: 7.8, dep: 12_000, ft: 'reverse', si: 1, ...NAPLES_BAY },
  },
  // ---- volcanoes --------------------------------------------------------
  {
    id: 'volcano-vesuvius-like',
    family: 'volcano',
    note: 'a Plinian column over a bay, nobody cleared',
    params: { t: 'volcano', ver: 150_000, vol: 2.5e9, ws: 15, wdir: 90, ...NAPLES_BAY },
  },
  {
    id: 'volcano-evacuated',
    family: 'volcano',
    note: 'the same eruption with ten kilometres cleared',
    params: {
      t: 'volcano',
      ver: 150_000,
      vol: 2.5e9,
      ws: 15,
      wdir: 90,
      ev: 10_000,
      ...NAPLES_BAY,
    },
  },
  {
    id: 'volcano-small-lahar',
    family: 'volcano',
    note: 'a small eruption with a large lahar',
    params: { t: 'volcano', ver: 500, vol: 1e7, ws: 8, lah: 5e7, ...ANDES },
  },
  {
    id: 'volcano-caldera',
    family: 'volcano',
    note: 'a caldera-forming eruption: the top of the scale',
    params: { t: 'volcano', ver: 1e7, vol: 1e12, ws: 20, ...ANDES },
  },
  {
    id: 'volcano-flank-collapse',
    family: 'volcano',
    note: 'a flank collapse into the sea, the Anak Krakatau corner',
    params: {
      t: 'volcano',
      ver: 20_000,
      vol: 1e8,
      ws: 10,
      fcv: 2e8,
      fcs: 30,
      fco: 50,
      ...NAPLES_BAY,
    },
  },
  // ---- landslides -------------------------------------------------------
  {
    id: 'slide-subaerial-fjord',
    family: 'landslide',
    note: 'thirty million cubic metres into deep water from a steep slope',
    params: {
      t: 'landslide',
      lv: 3e7,
      sl: 45,
      rg: 'subaerial',
      od: 120,
      sth: 40,
      swd: 800,
      sdz: 600,
      ...ALPS,
    },
  },
  {
    id: 'slide-submarine-shelf',
    family: 'landslide',
    note: 'a submarine slide on a shelf: the law the manual does not cover',
    params: { t: 'landslide', lv: 1e10, sl: 3, rg: 'submarine', od: 800, ...TOKYO_BAY },
  },
  {
    id: 'slide-confined-basin',
    family: 'landslide',
    note: 'a slide into a narrow reservoir, the Vaiont corner',
    params: { t: 'landslide', lv: 2.7e8, sl: 40, rg: 'subaerial', od: 90, ba: 2e6, ...ALPS },
  },
  {
    id: 'slide-tiny',
    family: 'landslide',
    note: 'a hundred thousand cubic metres: the bottom of the range',
    params: { t: 'landslide', lv: 1e5, sl: 35, rg: 'subaerial', od: 30, ...ALPS },
  },
  {
    id: 'slide-shallow-slope',
    family: 'landslide',
    note: 'a slope below the friction angle: the slide should not move',
    params: { t: 'landslide', lv: 5e7, sl: 10, rg: 'subaerial', od: 200, ...ALPS },
  },
  // ---- waves, whatever raises them --------------------------------------
  {
    id: 'wave-impact-shelf',
    family: 'wave',
    note: 'a hundred metres of rock into shelf water beside a coast',
    params: { t: 'impact', d: 100, s: 20_000, a: 45, rho: 3_000, wd: 150, ...NAPLES_BAY },
  },
  {
    id: 'wave-burst-in-water',
    family: 'wave',
    note: 'a hundred kilotonnes a metre under the surface',
    params: { t: 'explosion', y: 0.1, h: -1, wd: 200, ...TOKYO_BAY },
  },
  {
    id: 'wave-megathrust-far',
    family: 'wave',
    note: 'Mw 9.2 across an ocean: the far field',
    params: { t: 'earthquake', mw: 9.2, dep: 15_000, ft: 'reverse', si: 1, ...OPEN_SEA },
  },
  {
    id: 'wave-slide-into-lake',
    family: 'wave',
    note: 'a slide into shallow water: the breaking limit',
    params: { t: 'landslide', lv: 2e7, sl: 50, rg: 'subaerial', od: 15, ...ALPS },
  },
  {
    id: 'wave-caldera-collapse',
    family: 'wave',
    note: 'a caldera collapsing into the sea',
    params: {
      t: 'volcano',
      ver: 1e6,
      vol: 5e10,
      ws: 12,
      fcv: 5e9,
      fcs: 25,
      fco: 200,
      ...NAPLES_BAY,
    },
  },
];
