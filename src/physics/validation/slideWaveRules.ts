/**
 * The wave a landslide raises, against landslides somebody measured.
 *
 * Rule L2 of docs/GOLD_STANDARD.md asks for a held-out set of at least ten
 * landslides with a published slide volume and a measured wave or run-up near
 * the source, and a bias within ×1.5 at σ_ln no more than 0.7. The project has
 * never had one. Its landslide wave stands on two prefactors — K = 0.4
 * subaerial, set on Anak Krakatau 2018, and K = 0.005 submarine, set on
 * Storegga — and on a ceiling of 0.4 of the water column that turns out to be
 * the answer itself for half the wave presets (B-039). Four events, all of
 * them tuned on, is the whole evidence base.
 *
 * These rules build the set and say what it decides, and they are committed
 * and pushed before the model is run on one row of it.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out:
 *
 *  - NOAA NCEI's landslide-caused tsunamis were listed on 16 September 2026
 *    while judging whether a set was possible at all: for the thirty events
 *    with the most observations, the year, the cause code, the count and the
 *    **largest observed height** were printed. Those thirty are named in
 *    {@link SLIDE_WAVE_SEEN_WHILE_LOOKING}. Nothing was run on any of them and
 *    no number of the model was compared to any of them, but a reader should
 *    know they were seen, and rows that are in both sources are marked.
 *  - Dohmen's catalogue was counted, and its columns and codes read, before
 *    these rules were fixed: how many rows carry a volume, a width, a drop
 *    height, a wave; how they split by water body and by cause. Counts, not
 *    values — no wave height of any individual event was read except the four
 *    printed in the feasibility check, which are named in
 *    {@link SLIDE_WAVE_PRINTED_WHILE_COUNTING}.
 *
 * The rules, fixed on 16 September 2026, and numbered after the hundred and
 * seventeen before them:
 *
 *  118. **The set.** Dohmen, Braun & Fernandez-Steeger (2025), "A catalog of
 *       landslide-triggered tsunamis", PANGAEA doi:10.1594/PANGAEA.979839,
 *       CC-BY-4.0, read once and kept. A row is in the set when all of:
 *       its `Status` is "okay" (the catalogue's own mark for a valid entry,
 *       which drops both erroneous rows and tsunamis raised by several slides
 *       at once); it carries a slide volume above zero; it carries a
 *       **maximum wave height** above zero; its water body is marine (`OM` or
 *       `EM`), because the depth the wave was made in has to come from
 *       bathymetry and no bathymetry covers a lake bed; and its event name
 *       does not contain Vaiont, Vajont, Storegga, Krakatau or Lituya, the
 *       events this project's prefactors and presets were set on. That is the
 *       whole filter, and it is arithmetic on the file: no row is chosen or
 *       dropped by hand.
 *
 *  119. **The water depth**, which the catalogue does not give, is read from
 *       the same AWS Terrain Tiles the browser draws bathymetry from
 *       (`validation/terrariumTiles.ts`), at zoom {@link SLIDE_WAVE_TILE_ZOOM},
 *       as the deepest water within {@link SLIDE_WAVE_DEPTH_RADIUS_M} of the
 *       event's coordinates. Deepest rather than nearest, because a slide
 *       enters the water at the foot of its slope and not at the shoreline
 *       point the catalogue names, and because a nearest sample on a coast is
 *       as likely to be dry land. A row whose search finds no water is dropped
 *       and counted, not given a made-up depth.
 *
 *  120. **What is compared, and the thing this rule cannot fix.** The
 *       catalogue gives a wave **height**. Nimbus's `project` law gives an
 *       **amplitude** and nothing else, so for that law the comparison is an
 *       amplitude against a height and is declared as such — a wave whose
 *       crest and trough are alike would make the ratio 2, so a bias near 0.5
 *       under `project` means agreement and not a miss. Heller's equations
 *       give both, so under `heller2009` the model figure is the crest plus
 *       the trough, a height against a height, and it is that comparison the
 *       rule scores. Both are printed; only the second decides. Where the
 *       catalogue also publishes the slide's width, drop height and sliding
 *       distance, the same rows are scored a second time with those in place
 *       of this project's closures, which is the only measurement there is of
 *       what the closures cost — too few rows to be a cell of its own, and
 *       reported as a curiosity rather than a result.
 *
 *  121. **What decides.** L2's own bounds, on the `heller2009` comparison of
 *       rule 120, over the whole set and over each water body with at least
 *       twenty rows: bias within ×1.5, σ_ln no more than 0.7. The outcome is
 *       declared whichever way it falls, and **nothing is tuned on this set
 *       whatever it says** (rules 5 and 6) — this is a reading, and a reading
 *       that goes badly is a reading. Adopting `heller2009` as the law the
 *       product draws is a separate decision with its own rules, which this
 *       set may inform but may not be re-run to justify: once read, it is
 *       read.
 *
 * What these rules cannot settle. A catalogue's "maximum wave height" is not
 * necessarily measured at the source, and a landslide's tsunami is usually
 * largest near it but not always — part of whatever bias comes out is that,
 * and no filter here can separate it. Twenty-six marine rows is a coarse test:
 * a bias within ×1.5 on twenty-six events says much less than the same bias on
 * three hundred earthquakes. The depths of rule 119 are a global terrain
 * mosaic read at a coordinate, which for a fjord or a narrow bay is the
 * roughest number in the whole chain. And an earthquake-triggered slide makes
 * a wave alongside the wave the shaking makes; the catalogue's cause column
 * says which rows those are, they are kept, and the split is printed.
 */

/** Rule 118: the catalogue. */
export const SLIDE_WAVE_SOURCE =
  'Dohmen, K; Braun, A; Fernandez-Steeger, T M (2025): A catalog of landslide-triggered tsunamis. PANGAEA, doi:10.1594/PANGAEA.979839 (CC-BY-4.0)';
export const SLIDE_WAVE_SOURCE_SHA256 =
  'c3fe591a5fffa9b1124dd50c401092c99f953512e5428064251fff2f1e78ad57';

/** Rule 118: the events this project's prefactors and presets were set on, by
 *  the substrings that name them in the catalogue. */
export const SLIDE_WAVE_CALIBRATED_ON: readonly string[] = [
  'vaiont',
  'vajont',
  'storegga',
  'krakatau',
  'lituya',
];

/** Rule 118: the water bodies bathymetry can reach. */
export const SLIDE_WAVE_MARINE: readonly string[] = ['OM', 'EM'];

/** Rule 119: how the depth is read. */
export const SLIDE_WAVE_TILE_ZOOM = 10;
export const SLIDE_WAVE_DEPTH_RADIUS_M = 5_000;

/** Rule 121: L2's bounds. */
export const SLIDE_WAVE_BIAS_BOUND = 1.5;
export const SLIDE_WAVE_SIGMA_BOUND = 0.7;
export const SLIDE_WAVE_MIN_EVENTS = 10;
export const SLIDE_WAVE_MIN_CELL_ROWS = 20;

/**
 * The thirty NCEI landslide-caused tsunamis whose largest observed height was
 * printed on 16 September 2026 while judging whether a set was possible — by
 * year and place, as that listing showed them. Declared under the header
 * above; rows of the set that are the same event are marked in the run.
 */
export const SLIDE_WAVE_SEEN_WHILE_LOOKING: readonly (readonly [number, string])[] = [
  [2022, 'tonga'],
  [1946, 'unimak island'],
  [2024, 'honshu: w coast'],
  [2018, 'krakatau'],
  [1964, 'prince william sound'],
  [2018, 'sulawesi'],
  [1996, 'irian jaya'],
  [1992, 'flores sea'],
  [1998, 'papua new guinea'],
  [1956, 'cyclades'],
  [1883, 'krakatau'],
  [1975, 'hawaii'],
  [1908, 'messina strait'],
  [1741, 'w. hokkaido island'],
  [2023, 'izu islands'],
  [1953, 'fiji islands'],
  [1945, 'makran coast'],
  [2010, 'haiti & dominican republic'],
  [1918, 'mona passage'],
  [1929, 'grand banks'],
  [1927, 'sw. honshu island'],
  [1995, 'ryukyu islands'],
  [1958, 'se. alaska'],
  [1674, 'banda sea'],
  [1956, 'kamchatka'],
  [2013, 'off coast gwadar'],
  [1899, 'yakutat bay'],
  [1947, 'off coast of north island'],
  [2002, 'stromboli island'],
  [1927, 'crimea, black sea'],
];

/** The four rows whose values were printed while counting the catalogue's
 *  columns, before these rules were fixed. */
export const SLIDE_WAVE_PRINTED_WHILE_COUNTING: readonly string[] = [
  'LTT_GrandBanks_1929',
  'LTT_Suva_1953',
  'LTT_KarratFjord_2017',
  'LTT_ChehalisLake_2007',
];

export interface SlideWaveReading {
  rows: number;
  /** Geometric mean of model over record. */
  bias: number;
  sigmaLn: number;
  withinTwo: number;
}

/** Rule 121: whether a reading meets L2. */
export function meetsL2(r: SlideWaveReading): boolean {
  return (
    r.rows >= SLIDE_WAVE_MIN_EVENTS &&
    r.bias >= 1 / SLIDE_WAVE_BIAS_BOUND &&
    r.bias <= SLIDE_WAVE_BIAS_BOUND &&
    r.sigmaLn <= SLIDE_WAVE_SIGMA_BOUND
  );
}
