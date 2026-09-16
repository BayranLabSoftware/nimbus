import {
  impulseProduct,
  impulseWaveAmplitudes,
  outsideTestedRange,
  slideFromVolume,
  type SlideClosure,
} from '../../effects/impulseWave.js';
import type { Meters, SquareMeters } from '../../units.js';
import { m } from '../../units.js';
import {
  volcanoTsunami,
  VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
  type VolcanoTsunamiResult,
} from '../volcano/tsunami.js';

/**
 * Submarine / sub-aerial landslide tsunami source.
 *
 * Mass-failure events on coastal slopes and continental margins are
 * the third major tsunami-generation pathway alongside seismic uplift
 * and volcanic collapse. The same Watts (2000) cube-root scaling that
 * the volcano module uses applies here — the landslide block volume,
 * combined with the failure-plane slope, sets the initial wave
 * amplitude. We reuse {@link volcanoTsunami} verbatim so the two
 * cascades share calibration and the report numbers stay comparable.
 *
 * Three benchmark events anchor the parameter space:
 *   - Lituya Bay 1958 (Alaska, sub-aerial fjord rockfall): observed
 *     run-up of 524 m on the opposite shore. The fjord geometry and
 *     reflection/focusing effects mean this scenario CANNOT be
 *     reproduced by an open-ocean Watts source — the popular-science
 *     model under-predicts by ≈ an order of magnitude. We ship the
 *     preset for educational comparison, NOT as a validation case.
 *   - Storegga ~8 200 BP (Norwegian continental slope, ≈ 3 000 km³
 *     submarine slide): trans-Atlantic tsunami, observed coastal
 *     run-up 10–25 m. (Bondevik et al. 2005, Marine Geology 215.)
 *   - Anak Krakatau 22 Dec 2018 (sub-aerial flank collapse, ≈ 0.27
 *     km³): also surfaced as a volcano preset; included here so
 *     users can compare the "landslide" framing to the "volcanic
 *     collapse" framing of the same physical event.
 *
 * References:
 *   Watts, P. (2000). "Tsunami features of solid block underwater
 *     landslides." J. Waterway Port Coastal Ocean Eng., 126(3): 144–152.
 *   Synolakis, C. E. et al. (2008). "Validation and verification of
 *     tsunami numerical models." Pure Appl. Geophys. 165, 2197–2228.
 *   Bondevik, S. et al. (2005). "The Storegga slide tsunami —
 *     comparing field observations with numerical simulations."
 *     Marine and Petroleum Geology 22 (1–2), 195–208.
 */

export type LandslideRegime = 'submarine' | 'subaerial';

/** Failure-plane dip when the input gives none (°). */
export const LANDSLIDE_DEFAULT_SLOPE_DEG = 20;
/** Regime when the input gives none. */
export const LANDSLIDE_DEFAULT_REGIME: LandslideRegime = 'submarine';

/**
 * Which law makes the wave at the slide.
 *
 * `project` is Watts (2000)'s cube root, K·(γ/γ_ref)·V^(1/3)·sin θ capped at
 * 40 % of the water column, with K set on Anak Krakatau (subaerial) and
 * Storegga (submarine).
 *
 * `impulseWaveManual` is the field's method for a slide entering water from
 * above: the first crest of the impulse wave manual's three-dimensional
 * generation (Evers et al. 2019, 2nd edition, `effects/impulseWave.ts`), which
 * CI holds to the manual's worked examples. It needs a slide's speed,
 * thickness and width, and closes them where a caller has none. It is read
 * only for a subaerial slide in open water: a submarine slump and a confined
 * basin keep the project's relations, whatever this says (rule 163 of
 * validation/impulseWaveRules.ts). Named `heller2009` until 17 September 2026,
 * after the first edition, which is not the one these equations come from
 * (B-043).
 */
export type LandslideWaveLaw = 'project' | 'impulseWaveManual';

/** What a scenario that names no law draws: the impulse wave manual since
 *  17 September 2026, when rules 162 to 167 of validation/impulseWaveRules.ts
 *  held it to the manual's own spreadsheet on 143 cases drawn after they were
 *  pushed. */
export const DEFAULT_LANDSLIDE_WAVE_LAW: LandslideWaveLaw = 'impulseWaveManual';

export interface LandslideScenarioInput {
  /** Volume of the failed block (m³). Sub-aerial events sit at
   *  ≈ 10⁵ – 10⁹; submarine continental-margin events at ≈ 10⁹ – 10¹². */
  volumeM3: number;
  /** Slope of the failure plane (°). 5–15° for submarine slumps,
   *  20–40° for sub-aerial flank collapses. Defaults to 20°. */
  slopeAngleDeg?: number;
  /** Depth of the water the slide moves into (m). It does three jobs:
   *  it caps the source amplitude (40 % of it in open water, all of it
   *  in a confined basin), it sets the travel time, and 0 is a slide
   *  that ends on dry land and raises no wave (Elm 1881). Defaults to
   *  1 000 m (continental shelf). */
  meanOceanDepth?: Meters;
  /** Optional planform area of the slide footprint (m²). When set,
   *  the equivalent cavity radius driving the 1/r far-field decay is
   *  sqrt(A/π) instead of the V^(1/3) generic estimate — important
   *  for elongated slumps (e.g. Storegga, 290 × 100 km footprint
   *  gives 96 km vs V^(1/3) = 14 km, a 7× difference at trans-basin
   *  ranges). For compact rockfalls and flank collapses (Anak
   *  Krakatau, Lituya, Vaiont), V^(1/3) is already a good estimate
   *  and this field can be omitted. */
  slideFootprintArea?: SquareMeters;
  /** Optional planform area of the CONFINED BASIN the slide enters
   *  (m²). When set, source amplitude is computed as the basin-fill
   *  formula `η = V/A × dynamic_factor` capped at `meanOceanDepth`,
   *  instead of the open-ocean Watts cube-root form. Use this for
   *  reservoirs, fjords, and other geometrically confined cases
   *  where 2D radial spreading does not apply (Vaiont 1963 is the
   *  textbook case; Lituya Bay 1958 partially). */
  confinedBasinArea?: SquareMeters;
  /** Optional dynamic-amplification factor for the confined-basin
   *  formula above. Defaults to 3.0 (calibrated against Vaiont). */
  confinementDynamicFactor?: number;
  /** 'submarine' (sediment sliding on the sea floor) or 'subaerial'
   *  (rockfall or flank collapse entering the water). Not a tag: it
   *  picks the calibrated coupling of the open-water source, K = 0.4
   *  for a rigid block falling in (Anak Krakatau 2018) against 0.005
   *  for soft sediment (Storegga), and the reference density the slide
   *  density is read against. The same volume and slope make a wave up
   *  to 80 times taller as 'subaerial'. Defaults to 'submarine'. */
  regime?: LandslideRegime;
  /** Slide thickness at impact (m). The manual's equations want it; absent, it
   *  is closed as V^(1/3) and the result says so. Only the `impulseWaveManual`
   *  wave law reads it. */
  slideThicknessM?: number;
  /** Slide width at impact (m). Same: absent, V^(1/3). */
  slideWidthM?: number;
  /** How far the slide's centre of mass falls before it reaches the water (m).
   *  It is what sets the impact speed, and it is genuinely independent of the
   *  volume — Lituya Bay's 30 × 10⁶ m³ fell nine hundred metres. Absent, it is
   *  closed as V^(1/3)·sin α, which is the weakest closure here. */
  dropHeightM?: number;
  /** A published impact speed (m/s), which overrides every closure. */
  impactVelocityMS?: number;
  /** Which law makes the wave (rules 162 to 167 of
   *  validation/impulseWaveRules.ts). Omitted, {@link DEFAULT_LANDSLIDE_WAVE_LAW}.
   *  It is read only for a subaerial slide in open water: the manual's
   *  experiments are a slide entering water from above, and a submarine slump
   *  or a confined basin keeps the project's relation whatever this says. */
  waveLaw?: LandslideWaveLaw;
  /** Slide bulk density (kg/m³). Drives the Watts submerged
   *  specific-gravity factor in {@link volcanoTsunami}: a dense rock
   *  avalanche makes a bigger wave than a soft sediment slump of the
   *  same volume. Defaults to the regime reference density (rock for
   *  subaerial, marine sediment for submarine) → historic calibration. */
  slideDensity?: number;
}

export interface LandslideScenarioResult {
  inputs: LandslideScenarioInput;
  /** Linear extent of the failed block, V^(1/3) (m). Useful as a
   *  "how big is the slide" sanity check in the report. */
  characteristicLength: Meters;
  /** Effective failure-plane area (m²), V^(2/3). Cosmetic for the
   *  report; not consumed downstream. */
  characteristicArea: SquareMeters;
  /** Tsunami source produced by the slide. Always present for a
   *  positive volume + slope; null only when the inputs are
   *  ill-formed. */
  tsunami: VolcanoTsunamiResult | null;
  /** Echo of the regime tag for the report. Defaults to 'submarine'. */
  regime: LandslideRegime;
  /** Which law made the wave. */
  waveLaw: LandslideWaveLaw;
  /**
   * How much the regime decides this scenario's wave.
   *
   * `regime` is not a label: it picks K = 0.4 for a rigid block falling in
   * against 0.005 for soft sediment sliding on the sea floor, eighty times
   * apart, and a visitor setting up a scenario usually cannot know which
   * their slide was — the catalogues do not say. Measured on the
   * twenty-six held-out landslides of rules 118 to 121, the same events came
   * out 3.630× the record as subaerial and 0.049× as submarine: the switch
   * moves the answer by about seventy times, and it is the largest single
   * uncertainty in a landslide wave.
   *
   * So the product computes both and says so, rather than printing one and
   * leaving the reader to discover that the other exists (G4 of
   * docs/GOLD_STANDARD.md).
   */
  regimeSensitivity: {
    subaerialAmplitude: Meters;
    submarineAmplitude: Meters;
    /** The larger over the smaller, 1 where the two agree; null where one of
     *  the two makes no wave at all — a slide the bed friction holds above the
     *  water raises nothing, and a ratio to nothing is not a number a panel
     *  can print. Until 17 September 2026 that was Infinity, which no scenario
     *  reached until the impulse wave manual became the law above the water
     *  and the landslide sweep found 606. */
    ratio: number | null;
  } | null;
  /** Present only where `impulseWaveManual` made the wave: what the slide
   *  looked like to the manual's equations, which of its three unknowns had to
   *  be closed, and which of the manual's limits the scenario falls outside
   *  of — G4 of docs/GOLD_STANDARD.md asks that the product say the last one. */
  impulseWave?: {
    /** Slide impact velocity (m/s), given or closed. */
    impactVelocityMS: number;
    froude: number;
    impulseProduct: number;
    thicknessM: number;
    widthM: number;
    /** The first crest, first trough and second crest at the slide (m). */
    firstCrestM: number;
    firstTroughM: number;
    secondCrestM: number;
    closed: SlideClosure['closed'];
    outsideTestedRange: string[];
    /** True where the slide never reaches the water with any speed: at a
     *  slope no steeper than its bed friction angle, Eq. 3.5 gives zero, and
     *  so does every amplitude. There is then no wave, and the result says why
     *  rather than falling back on another law. */
    held: boolean;
  };
}

interface LandslideSource {
  tsunami: VolcanoTsunamiResult | null;
  impulseWave: LandslideScenarioResult['impulseWave'] | undefined;
}

/** The wave at the slide in one regime, under one law. */
function landslideSource(
  input: LandslideScenarioInput,
  regime: LandslideRegime,
  slopeDeg: number,
  waveLaw: LandslideWaveLaw
): LandslideSource {
  const depthM = (input.meanOceanDepth as number | undefined) ?? 1_000;
  const basin = input.confinedBasinArea as number | undefined;
  const confined = basin !== undefined && Number.isFinite(basin) && basin > 0;
  const shared = {
    collapseVolumeM3: input.volumeM3,
    slopeAngleRad: (slopeDeg * Math.PI) / 180,
    regime,
    ...(input.meanOceanDepth !== undefined && { meanOceanDepth: input.meanOceanDepth }),
    ...(input.slideFootprintArea !== undefined && {
      slideFootprintArea: input.slideFootprintArea,
    }),
    ...(input.confinedBasinArea !== undefined && { confinedBasinArea: input.confinedBasinArea }),
    ...(input.confinementDynamicFactor !== undefined && {
      confinementDynamicFactor: input.confinementDynamicFactor,
    }),
    ...(input.slideDensity !== undefined && { slideDensity: input.slideDensity }),
  };
  // The manual's experiments are a slide entering water from above, in open
  // water or a basin wide enough for the wave to spread. A submarine slump is
  // not one, and a confined basin keeps its own branch.
  const manual =
    waveLaw === 'impulseWaveManual' &&
    regime === 'subaerial' &&
    !confined &&
    depthM > 0 &&
    input.volumeM3 > 0 &&
    slopeDeg > 0;
  if (!manual) return { tsunami: volcanoTsunami(shared), impulseWave: undefined };

  const closure = slideFromVolume({
    volumeM3: input.volumeM3,
    angleDeg: slopeDeg,
    depthM,
    densityKgM3: input.slideDensity ?? VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
    ...(input.slideThicknessM !== undefined && { thicknessM: input.slideThicknessM }),
    ...(input.slideWidthM !== undefined && { widthM: input.slideWidthM }),
    ...(input.dropHeightM !== undefined && { dropHeightM: input.dropHeightM }),
    ...(input.impactVelocityMS !== undefined && { impactVelocityMS: input.impactVelocityMS }),
  });
  const amplitudes = impulseWaveAmplitudes(closure.slide);
  const crest = amplitudes.firstCrest;
  const held = !(Number.isFinite(crest) && crest > 0);
  return {
    tsunami: held ? null : volcanoTsunami({ ...shared, sourceAmplitudeM: crest }),
    impulseWave: {
      impactVelocityMS: closure.impactVelocityMS,
      froude: closure.slide.froude,
      impulseProduct: impulseProduct(closure.slide),
      thicknessM: closure.slide.thicknessM,
      widthM: closure.slide.widthM,
      firstCrestM: held ? 0 : crest,
      firstTroughM: held ? 0 : amplitudes.firstTrough,
      secondCrestM: held ? 0 : amplitudes.secondCrest,
      closed: closure.closed,
      outsideTestedRange: outsideTestedRange(closure.slide),
      held,
    },
  };
}

/** Both regimes' source amplitudes for the same slide, under the law the
 *  scenario runs, so the result can say how much the switch decides. Null
 *  where there is no wave either way. */
function regimeSensitivity(
  input: LandslideScenarioInput,
  slopeDeg: number,
  waveLaw: LandslideWaveLaw
): LandslideScenarioResult['regimeSensitivity'] {
  const under = (regime: LandslideRegime): number =>
    Number(landslideSource(input, regime, slopeDeg, waveLaw).tsunami?.sourceAmplitude ?? 0);
  const subaerial = under('subaerial');
  const submarine = under('submarine');
  if (!(subaerial > 0) && !(submarine > 0)) return null;
  const hi = Math.max(subaerial, submarine);
  const lo = Math.min(subaerial, submarine);
  return {
    subaerialAmplitude: m(subaerial),
    submarineAmplitude: m(submarine),
    ratio: lo > 0 ? hi / lo : null,
  };
}

/**
 * Deterministic Layer-2 landslide-tsunami evaluator. No randomness,
 * no I/O, no framework imports.
 */
export function simulateLandslide(input: LandslideScenarioInput): LandslideScenarioResult {
  const slopeDeg = input.slopeAngleDeg ?? LANDSLIDE_DEFAULT_SLOPE_DEG;
  const regime = input.regime ?? LANDSLIDE_DEFAULT_REGIME;
  const sideLength = Math.cbrt(Math.max(input.volumeM3, 0));
  const waveLaw = input.waveLaw ?? DEFAULT_LANDSLIDE_WAVE_LAW;
  const { tsunami, impulseWave } = landslideSource(input, regime, slopeDeg, waveLaw);
  return {
    inputs: input,
    characteristicLength: m(sideLength),
    characteristicArea: (sideLength * sideLength) as SquareMeters,
    tsunami,
    regime,
    waveLaw,
    regimeSensitivity: regimeSensitivity(input, slopeDeg, waveLaw),
    ...(impulseWave === undefined ? {} : { impulseWave }),
  };
}

/**
 * Canonical landslide-tsunami presets used for the UI gallery and CLI.
 * See the module header for caveats — Lituya in particular is included
 * for educational comparison, not as a validation target.
 */
export const LANDSLIDE_PRESETS = {
  /** 9 July 1958 Lituya Bay, Alaska — ≈ 30 × 10⁶ m³ rockfall into a
   *  fjord. The reference 524 m run-up cannot be reproduced by an
   *  open-ocean Watts source (Walder et al. 2003). */
  LITUYA_BAY_1958: {
    name: 'Lituya Bay 1958',
    note: 'Sub-aerial fjord rockfall; open-ocean model under-predicts the 524 m run-up',
    input: {
      volumeM3: 3e7,
      slopeAngleDeg: 35,
      meanOceanDepth: m(120),
      regime: 'subaerial',
    } satisfies LandslideScenarioInput,
  },
  /** ≈ 8 200 BP Storegga submarine slide, Norwegian continental
   *  slope — ≈ 3 000 km³ of sediment, basin-scale tsunami.
   *  Slide footprint ≈ 290 km long × 100 km wide along the slope
   *  (Bondevik et al. 2005 Fig. 1; Bryn et al. 2005 MPGS 22:11),
   *  yielding an equivalent-disc cavity radius of ≈ 96 km — far
   *  larger than the V^(1/3) = 14 km generic estimate, so we set
   *  `slideFootprintArea` explicitly. Without this, the 1/r decay
   *  at trans-Atlantic ranges (Sula 600 km, Shetland 950 km)
   *  under-predicts by ~7×. */
  STOREGGA_8200_BP: {
    name: 'Storegga ≈ 8 200 BP',
    note: 'Norwegian continental-margin submarine slide; trans-Atlantic tsunami',
    input: {
      volumeM3: 3e12,
      slopeAngleDeg: 5,
      meanOceanDepth: m(1_500),
      slideFootprintArea: 2.9e10 as SquareMeters,
      regime: 'submarine',
    } satisfies LandslideScenarioInput,
  },
  /** 22 December 2018 Anak Krakatau flank collapse (also exposed as
   *  a volcano preset for cross-comparison). */
  ANAK_KRAKATAU_2018: {
    name: 'Anak Krakatau 2018 (slide framing)',
    note: 'Sub-aerial flank collapse — same physical event as the volcano preset, framed as a slide',
    input: {
      volumeM3: 2.7e8,
      slopeAngleDeg: 20,
      meanOceanDepth: m(200),
      regime: 'subaerial',
    } satisfies LandslideScenarioInput,
  },
  /** 9 October 1963 Vaiont reservoir, Dolomites (Friuli, Italy) —
   *  ≈ 270 × 10⁶ m³ of Mt Toc detached and slid into the just-filled
   *  reservoir behind the Vaiont dam at 20–30 m/s. The displaced
   *  reservoir water raised a wave that crested 140 m above the top of
   *  the 276 m double-curvature dam (which itself survived intact) and
   *  swept down the Piave valley, destroying Longarone, Pirago,
   *  Rivalta and Villanova in minutes; almost 2 000 dead (Genevois &
   *  Ghirotti 2005). The 250 m of earlier comments is the thickness of
   *  the slide mass in that paper, not the wave. The dam-
   *  failure-without-failure remains the textbook case study for
   *  reservoir-triggered landslides and engineering ethics in
   *  geotechnical practice. References: Müller (1964) "The rock
   *  slide in the Vajont valley." Rock Mech. Eng. Geol. 2: 148-212;
   *  Genevois & Ghirotti (2005) "The 1963 Vajont landslide."
   *  Giorn. Geol. Appl. 1: 41-52. DOI: 10.1474/GGA.2005-01.0-05.0005. */
  VAIONT_1963: {
    name: 'Vaiont 1963',
    note: '≈ 270 Mm³ rockslide into the Vaiont reservoir; the wave crested 140 m above the top of the dam, almost 2 000 dead — Genevois & Ghirotti 2005, GGA 1: 41. Type case for reservoir-triggered landslides; uses the confined-basin formula because open-ocean Watts spreading does not apply to a 3 km² reservoir.',
    input: {
      volumeM3: 2.7e8,
      slopeAngleDeg: 35,
      // meanOceanDepth = 238 m: the reservoir was 782 ft deep that
      //   night, at 700.4 m a.s.l. (ASDSO, Dam Failures: Vajont), used
      //   as the source-amplitude cap (a wave can't be taller than the
      //   basin it sloshes in).
      // confinedBasinArea = 3 × 10⁶ m²: reservoir surface area
      //   (Müller 1964 Rock Mech. Eng. Geol. 2: 148, Fig. 3). Triggers
      //   the basin-fill formula η = V/A × 1.8 = 162 m, against the
      //   165 m above the lake of a crest 140 m over a dam top 25 m
      //   above the water (Genevois & Ghirotti 2005; ASDSO).
      meanOceanDepth: m(238),
      confinedBasinArea: 3e6 as SquareMeters,
      regime: 'subaerial',
    } satisfies LandslideScenarioInput,
  },
  /** 11 September 1881 Elm rockslide, Glarus Alps, Switzerland —
   *  ≈ 10 × 10⁶ m³ of slate-quarry detritus failed catastrophically
   *  on a steep cliff face, descended ≈ 600 m vertically and ran out
   *  ≈ 2 km across the village of Elm with mean fragment-debris
   *  velocity ≈ 70 m/s; ≈ 115 fatalities. Heim's first-hand account
   *  of the runout founded the modern understanding of long-runout
   *  ("sturzstrom") rock avalanches. Reference: Heim (1932)
   *  "Bergsturz und Menschenleben." Vierteljahrsschrift Naturf.
   *  Ges. Zürich 77: 1-218; Hsü (1975) "Catastrophic debris streams
   *  (sturzstroms) generated by rockfalls." GSA Bull. 86: 129-140.
   *  DOI: 10.1130/0016-7606(1975)86<129:CDSSGB>2.0.CO;2. */
  ELM_1881: {
    name: 'Elm 1881',
    note: '≈ 10 Mm³ rock avalanche, Glarus Alps — Heim 1932; Hsü 1975, GSA Bull. 86: 129. Founding case study for long-runout "sturzstrom" mobility.',
    input: {
      volumeM3: 1e7,
      slopeAngleDeg: 60,
      meanOceanDepth: m(0),
      regime: 'subaerial',
    } satisfies LandslideScenarioInput,
  },
} as const;

export type LandslidePresetId = keyof typeof LANDSLIDE_PRESETS;
