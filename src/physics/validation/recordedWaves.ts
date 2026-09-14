import { simulateExplosion } from '../events/explosion/simulate.js';
import { simulateEarthquake, EARTHQUAKE_PRESETS } from '../events/earthquake/simulate.js';
import { simulateLandslide, LANDSLIDE_PRESETS } from '../events/landslide/simulate.js';
import { m } from '../units.js';
import { DART_21413_FROM_TOHOKU_EPICENTRE_M } from './noaaBenchmarkFixtures.js';
import { veilLaw } from '../tsunami/amplitudeField.js';
import { propagationSpeed } from '../tsunami/linearWaves.js';
import { extractTsunamiMeta, type ActiveResult } from '../../store/useAppStore.js';

/**
 * Waves that were measured, and where the simulator puts them.
 *
 * The toll harness measures what the model does to people; this one
 * measures what it does to water, and it exists because the first
 * thing outside the toll harness's reach — a half-kilotonne charge on
 * the Beirut quay — was wrong by a factor of three hundred and nobody
 * saw it until it was on the live site.
 *
 * Waves are easier to check than deaths. A death toll depends on who
 * happened to live there; a wave height was written down by people
 * with instruments, and the same charge in the same water makes the
 * same wave whoever is watching. Crossroads Baker in particular is
 * the best-instrumented explosion-generated wave there will ever be:
 * a known yield at a known depth in a lagoon of known depth, with the
 * wave height tabulated at seven ranges.
 *
 * What this can and cannot reach, said here rather than discovered
 * later: there is no bathymetry in a test, so nothing here propagates
 * over real seafloor. Every model figure asks the globe's own
 * question — the veil's law at one cell, `veilLaw` in
 * `tsunami/amplitudeField.ts`, which the field calls at every cell —
 * on a flat sea of the depth the wave was measured in, where the
 * arrival time is the range over the speed the arrival-time solver
 * uses there — the long-wave speed, or an explosion's group velocity.
 *
 * Until 14 September 2026 the burst rows asked a different question,
 * and compared the answer with the wrong quantity. They spread an
 * underwater burst as A₀·√(R₀/r), without the energy of a ring that
 * the veil has carried since 9 September, and read 23.3 m at 300 m
 * and 1.89 m at 5.5 km against records of 20–45 m and 1–3 m: inside
 * both, while the globe drew about half. But Glasstone & Dolan
 * tabulate Baker's waves as heights from crest to trough, and the
 * model computes an amplitude, the crest above still water.
 *
 * Later the same day the burst's wave itself became Glasstone &
 * Dolan's: the shallow-water relation of §6.121 for Baker, with no
 * constant fitted to Baker. So these rows now check the book against
 * its own table, and the book is honest about it: the relation is an
 * approximation that reads about seven tenths of the tabulated heights
 * out to 2 000 yards — inside its 35 % — and less beyond, where the
 * table stops falling as 1/R.
 */

export interface RecordedWave {
  name: string;
  /** What was observed, in metres, and where. */
  observed: { low: number; high: number; atRangeM: number };
  source: string;
  /** What the model says at that range, in metres. */
  model: () => number;
  /** What the globe's amplitude veil draws at the same range, where
   *  it is computed by a different law from `model`. Absent where the
   *  two are the same number. */
  globe?: () => number;
  /** Whether a miss fails the suite. */
  gated: boolean;
  caveat?: string;
}

const YARD_M = 0.9144;
const FOOT_M = 0.3048;

/**
 * Crossroads Baker as it was fired: 23 kt hung 90 ft under a landing
 * ship, in a lagoon Glasstone & Dolan give as "about 200 feet deep"
 * (§2.63).
 */
export const CROSSROADS_BAKER = {
  yieldMegatons: 0.023,
  burstDepthM: 90 * FOOT_M,
  lagoonDepthM: 200 * FOOT_M,
} as const;

/**
 * Glasstone & Dolan 1977, Table 6.57: "maximum heights (crest to
 * trough) and arrival times of water waves at Bikini BAKER test".
 * Every row, in the units it was printed in.
 */
export const BAKER_TABLE_6_57: readonly { yards: number; feet: number; seconds: number }[] = [
  { yards: 330, feet: 94, seconds: 11 },
  { yards: 660, feet: 47, seconds: 23 },
  { yards: 1_330, feet: 24, seconds: 48 },
  { yards: 2_000, feet: 16, seconds: 74 },
  { yards: 2_700, feet: 13, seconds: 101 },
  { yards: 3_300, feet: 11, seconds: 127 },
  { yards: 4_000, feet: 9, seconds: 154 },
];

/**
 * "An accuracy of about 35 percent": what Glasstone & Dolan claim for
 * their own relation between an explosion wave's height, the yield
 * and the range (§6.119). Every Baker figure is held to the
 * reference's tolerance rather than to one chosen here.
 */
export const GLASSTONE_WAVE_ACCURACY = 0.35;

/**
 * The amplitude a height printed crest to trough in whole feet
 * allows: half of it, for a wave that sinks as far below still water
 * as it rises above, widened by the foot it was rounded to and by the
 * reference's own 35 %.
 */
export function amplitudeFromCrestToTrough(feet: number): { low: number; high: number } {
  return {
    low: (((feet - 0.5) * FOOT_M) / 2) * (1 - GLASSTONE_WAVE_ACCURACY),
    high: (((feet + 0.5) * FOOT_M) / 2) * (1 + GLASSTONE_WAVE_ACCURACY),
  };
}

/**
 * What the amplitude veil on the globe draws for a result at a range,
 * on a flat sea: the field's own per-cell law, at the arrival time the
 * fast-marching solver gives on flat water. The depth is the sea the
 * wave was measured in, or the source's own where the row names none.
 * A bearing matters only to an oriented source.
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

/** A burst as the store simulates one clicked on open water: the depth
 *  under the click, and nothing else about the sea. */
export function burstResult(
  yieldMegatons: number,
  heightOfBurstM: number,
  waterDepthM: number
): ActiveResult {
  return {
    type: 'explosion',
    data: simulateExplosion({
      yieldMegatons,
      groundType: 'WET_SOIL',
      heightOfBurst: m(heightOfBurstM),
      waterDepth: m(waterDepthM),
    }),
  };
}

function burstOnGlobe(
  yieldMegatons: number,
  heightOfBurstM: number,
  waterDepthM: number,
  rangeM: number
): number {
  return globeVeilAt(burstResult(yieldMegatons, heightOfBurstM, waterDepthM), rangeM, {
    depthM: waterDepthM,
  });
}

const bakerOnGlobe = (rangeM: number): number =>
  burstOnGlobe(
    CROSSROADS_BAKER.yieldMegatons,
    -CROSSROADS_BAKER.burstDepthM,
    CROSSROADS_BAKER.lagoonDepthM,
    rangeM
  );

/** 1330 → "1,330", without the runtime's locale data. */
const grouped = (n: number): string =>
  n >= 1_000
    ? `${Math.floor(n / 1_000).toString()},${(n % 1_000).toString().padStart(3, '0')}`
    : n.toString();

/**
 * Where Glasstone's 1/R is what the table shows. Out to 2 000 yards
 * the tabulated H·R holds within 3 % of its first value; from 2 700
 * yards it is 13–17 % higher, because the highest wave has passed back
 * into the train that follows the first (§6.56) and falls more slowly
 * than the train's envelope. A relation that is 1/R is checked where
 * the record is 1/R, and the rows beyond are printed with the reason.
 */
export const BAKER_ONE_OVER_R_TO_YARDS = 2_000;

const BAKER_TABLE_ROWS: RecordedWave[] = BAKER_TABLE_6_57.map((row, index) => ({
  name: `Crossroads Baker 1946, ${grouped(row.yards)} yd`,
  observed: { ...amplitudeFromCrestToTrough(row.feet), atRangeM: row.yards * YARD_M },
  source: `Glasstone & Dolan 1977, Table 6.57 (maximum heights, crest to trough): ${row.feet.toString()} ft at ${grouped(row.yards)} yd from surface zero, ${row.seconds.toString()} s after the burst`,
  model: () => bakerOnGlobe(row.yards * YARD_M),
  gated: row.yards <= BAKER_ONE_OVER_R_TO_YARDS,
  ...(index === 0 && {
    caveat:
      'Every Baker height is printed from crest to trough, and the model computes the crest above still water, so each is halved and held to the reference\'s own 35 %. The model is Glasstone & Dolan\'s shallow-water relation (§6.121), H·R = 150·d_w·W^0.25 ft², with nothing fitted to Baker: it reads 0.68–0.71 of the tabulated heights out to 2 000 yards, the approximation the book offers for bursts "such as Bikini BAKER". Until 14 September 2026 these rows compared an amplitude with the full height, through a law the globe did not draw.',
  }),
  ...(index === BAKER_TABLE_6_57.findIndex((r) => r.yards > BAKER_ONE_OVER_R_TO_YARDS) && {
    caveat:
      'Declared, not gated, from here out. The tabulated H·R stops being constant at 2 700 yards and rises 13–17 %, because the highest wave passes back into the train (§6.56) and falls more slowly than 1/R. A relation that is 1/R cannot follow it, and reads about six tenths of these heights — just outside the 35 %.',
  }),
}));

export const RECORDED_WAVES: RecordedWave[] = [
  ...BAKER_TABLE_ROWS,
  {
    name: "Crossroads Baker 1946, USS Saratoga's stern",
    observed: {
      low: 43 * FOOT_M * (1 - GLASSTONE_WAVE_ACCURACY),
      // The crest cannot stand higher than the whole wave, which the
      // table's first two rows put at 94 ft × 330/400 here — they fall
      // exactly as 1/R.
      high: ((94 * 330) / 400) * FOOT_M * (1 + GLASSTONE_WAVE_ACCURACY),
      atRangeM: 400 * YARD_M,
    },
    source:
      'Glasstone & Dolan 1977 §6.58: the carrier, anchored almost broadside on with its stern 400 yd from surface zero, rose on the first wave crest until the stern was over 43 ft above its previous position',
    model: () => bakerOnGlobe(400 * YARD_M),
    gated: false,
    caveat:
      "Declared. The one Baker figure that is a crest rather than a height, and a lower bound: the stern rose over 43 ft on the first wave, a long solitary wave (§6.55) whose crest stands above half its height. Glasstone's relation, halved, reads about two thirds of it. Nothing the toll reads is this close to a burst.",
  },
  {
    name: 'Crossroads Baker 1946, ninth wave at 22,000 ft',
    observed: { ...amplitudeFromCrestToTrough(6), atRangeM: 22_000 * FOOT_M },
    source:
      'Glasstone & Dolan 1977 §2.70: at 22,000 ft from surface zero the ninth wave in the series was the highest, with a height of 6 ft',
    model: () => bakerOnGlobe(22_000 * FOOT_M),
    gated: false,
    caveat:
      'Declared. The farthest Baker figure, where the highest wave had passed back to the ninth of the train (§6.56) and the height had fallen far more slowly than 1/R: Glasstone’s relation reads half of it.',
  },
  {
    name: 'Castle Bravo 1954',
    observed: { low: 0, high: 0, atRangeM: 300 },
    source:
      '15 Mt fired at the surface on the Bikini reef; remembered for its crater and its fallout, not for a wave',
    model: () => burstOnGlobe(15, 0, 50, 300),
    gated: true,
    caveat:
      'A thousand times the energy of Baker and no wave, because the charge never entered the water. Six hundred times, in fact, and this row is the one that says the curve is about placement and not about size.',
  },
  {
    name: 'Ivy Mike 1952',
    observed: { low: 0, high: 0, atRangeM: 300 },
    source: '10.4 Mt fired on the islet of Elugelab, which it vapourised; no recorded wave',
    model: () => burstOnGlobe(10.4, 0, 50, 300),
    gated: true,
  },
  {
    name: 'Beirut 2020',
    observed: { low: 0, high: 2, atRangeM: 300 },
    source:
      '≈ 0.5 kt TNT-equivalent on a portside quay; a harbour wave said to be of the order of a metre, for which no published measurement is cited here',
    model: () => burstOnGlobe(0.0005, 0, 15, 300),
    gated: true,
    caveat: 'The row this harness was built for: it read 77 000 dead from this wave.',
  },
  {
    name: 'Tōhoku 2011 at DART 21413',
    observed: { low: 0.2, high: 0.5, atRangeM: DART_21413_FROM_TOHOKU_EPICENTRE_M },
    source:
      'DART buoy 21413, 1 242 km from the epicentre, recorded a peak of about 30 cm (Satake et al. 2013, BSSA 103 (2B): 1473)',
    model: () =>
      globeVeilAt(
        { type: 'earthquake', data: simulateEarthquake(EARTHQUAKE_PRESETS.TOHOKU_2011.input) },
        DART_21413_FROM_TOHOKU_EPICENTRE_M,
        // The buoy lies at bearing 131° from the epicentre and the
        // Japan Trench strikes 200°: 21° off the seaward
        // perpendicular, inside the main lobe. Four kilometres of
        // Pacific under it.
        { depthM: 4_000, bearingDeg: 131 }
      ),
    gated: true,
    caveat:
      'Gated since 9 September 2026, and it used to be the row that measured a divergence rather than a model. This project had four far-field laws for one wave and they bracketed the buoy from opposite sides: the seismic module spread cylindrically from half the rupture length and landed at 1.93 m, six times the 30 cm recorded, while tohoku2011DARTReference spreads as 1/r from a 2 m source and lands at 0.13 m. The product path is now one law, in tsunami/spreading.ts — from half the down-dip width, with the energy normalisation of a ring — and the row reads 0.29 m against the 0.30 recorded, inside the observed band. (0.27 m at the 1 500 km every row used for this buoy until 14 September 2026; it is 1 242 km from the epicentre.)',
  },
  {
    name: 'Storegga 8200 BP on the Norwegian coast',
    observed: { low: 0.3, high: 3, atRangeM: 1_000_000 },
    source:
      'Bondevik et al. 2005 read run-up from tsunami deposits — 10–12 m in western Norway, 3–6 m in northeast Scotland, over 20 m on Shetland; the metre-scale open-ocean wave at a thousand kilometres is this project’s inference from them',
    model: () => {
      const r = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
      if (r.tsunami === null) return 0;
      return r.tsunami.amplitudeAt1000km;
    },
    // The published row follows Lamb's 1/r; the veil spreads the same
    // slide geometrically, and stands above it at this range by the
    // gap `fieldScalarAgreement.test.ts` pins. Different laws on purpose
    // — see that file — and so a different number on the globe.
    globe: () => {
      const data = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
      return globeVeilAt({ type: 'landslide', data }, 1_000_000);
    },
    gated: true,
    caveat:
      'Open-ocean amplitude inferred from run-up rather than measured, so the band is wide; it is here because it is the only prehistoric event with deposits good enough to argue from.',
  },
];

export interface WaveComparison {
  wave: RecordedWave;
  model: number;
  contains: boolean;
  /** What the globe draws, where that is a different number. */
  globe: number | null;
  /** Whether the globe's number is inside the record; null where the
   *  globe draws the same number as `model`. */
  globeContains: boolean | null;
}

export function compareWave(wave: RecordedWave): WaveComparison {
  const model = wave.model();
  const inside = (v: number): boolean => v >= wave.observed.low && v <= wave.observed.high;
  const globe = wave.globe === undefined ? null : wave.globe();
  return {
    wave,
    model,
    contains: inside(model),
    globe,
    globeContains: globe === null ? null : inside(globe),
  };
}
