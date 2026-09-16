import { SEAWATER_DENSITY } from '../../constants.js';
import type { Meters, Seconds, SquareMeters } from '../../units.js';
import { m } from '../../units.js';
import { impactAmplitudeAtDistance } from '../tsunami/impact.js';
import { tsunamiTravelTime } from '../tsunami/propagation.js';

/**
 * Volcanic tsunami source — flank collapse or caldera-floor collapse
 * dropping a block of edifice material into the surrounding water.
 *
 * Two well-known archetypes anchor the parameter space:
 *   - Anak Krakatau, 22 December 2018: ≈ 0.27 km³ flank collapse,
 *     the best-estimate volume of Grilli et al. (2019, Sci. Rep. 9:
 *     11946), whose simulation raises a leading wave nearly 50 m high
 *     near the island. The ≈ 85 m this prefactor was set on is not in
 *     that paper.
 *   - Krakatau, 27 August 1883: ≈ 25 km³ caldera collapse,
 *     observed coastal run-up 30–40 m around the Sunda Strait
 *     (Self 1992; Maeno & Imamura 2011, J. Geophys. Res. 116: B09205).
 *
 * For the popular-science envelope we use a Watts (2000)-INSPIRED
 * calibrated parameterisation (NOT Watts' published predictive
 * equation):
 *
 *     η_source = K · V^(1/3) · sin(θ)        (m, with V in m³, θ in rad)
 *
 * where K is a regime-dependent prefactor (see
 * {@link VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL} /
 * {@link VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE}).
 *
 * **What this keeps and what it drops vs. Watts (2000).** The cube-root
 * scaling captures the basic geometry — the slide block's characteristic
 * linear dimension grows as V^(1/3), and the maximum vertical wave
 * excursion roughly tracks that dimension scaled by the slope. The
 * submerged density contrast γ = (ρ_slide/ρ_water − 1) — a primary
 * driver in Watts' theory — IS carried explicitly via the optional
 * `slideDensity` (the amplitude scales by γ/γ_ref about a regime
 * reference density; see {@link VolcanoTsunamiInput.slideDensity}), so a
 * dense basalt block makes a bigger wave than a soft mud slump of equal
 * volume. What remains folded into the calibrated regime prefactors (and
 * NOT modelled explicitly) is the slide THICKNESS and the Froude
 * number / acceleration. So this is still a calibrated envelope, not a
 * transcription of Watts' numbered equations — it reproduces the
 * benchmark events within the genuine ±factor-2 landslide-source scatter
 * (Tappin 2017, Earth-Science Reviews 169: 73–101). Treat the output as
 * order-of-magnitude.
 *
 * The caller's volume is the COLLAPSED block; for caldera events
 * "slope" should be set to the post-collapse caldera-wall angle
 * (≈ 45° for Krakatau-class structures). For flank slides "slope"
 * is the failure-plane dip (≈ 20° for Anak Krakatau-class events).
 *
 * Far-field amplitude propagation reuses the Ward & Asphaug (2000)
 * 1/r decay primitive; the cavity radius that seeds it is the slide's
 * characteristic linear scale (V^(1/3), or √(area/π) when a footprint
 * is supplied), NOT the impact-style 2·η_source back-derivation — see
 * the inline note on `cavityRadius` below.
 *
 * References:
 *   Watts, P. (2000). "Tsunami features of solid block underwater
 *     landslides." J. Waterway Port Coastal Ocean Eng., 126(3): 144–152.
 *   Grilli, S. T., et al. (2019). "Modelling of the tsunami from the
 *     December 22, 2018 lateral collapse of Anak Krakatau."
 *     Scientific Reports 9: 11946.
 *   Maeno, F. & Imamura, F. (2011). "Tsunami generation by a rapid
 *     entrance of pyroclastic flow into the sea during the 1883
 *     Krakatau eruption." J. Geophys. Res., 116: B09205.
 *   Tappin, D. R. (2017). "Submarine landslides and their tsunami
 *     hazard." Annual Review of Earth and Planetary Sciences 47: 89–128.
 */

/** Per-regime empirical prefactor in η_source = K · V^(1/3) · sin(θ).
 *
 * The Watts 2000 form has a single linear K, but real-world calibration
 * targets force two distinct values:
 *
 *   - **Subaerial / fast / rigid block** (volcanic flank collapse,
 *     rockfall into water, Anak Krakatau 2018): K ≈ 0.40, set on an
 *     ≈ 85 m source amplitude for the 0.27 km³ flank slide at 20° that
 *     was credited to Grilli et al. 2019; the paper's leading wave near
 *     the island is nearly 50 m.
 *
 *   - **Submarine / slow / soft sediment** (continental-margin slumps,
 *     Storegga 8 200 BP): K ≈ 0.005, set on a 5–10 m source amplitude
 *     for a 3 000 km³ slope failure at 5° that was credited to Bondevik
 *     et al. 2005, who give run-up read from deposits (10–12 m in
 *     western Norway) for a 2 400 km³ slide, not a source amplitude. Soft-sediment slides decouple
 *     from the water column much more efficiently than a rigid block
 *     would — the V^(1/3) scaling alone over-predicts by factor 70+.
 *
 * Choosing the wrong regime drifts the source amplitude by two orders
 * of magnitude. Volcanic and rockfall callers should pass 'subaerial';
 * trans-basin submarine slides 'submarine'.
 *
 * Reference: Murty 2003 (Mar. Geol. 199) reviews regime-dependent
 * coupling efficiency; Synolakis et al. 2008 (Pageoph 165) tabulates
 * observed-vs-predicted source amplitudes across both regimes.
 */
export const VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL = 0.4;
export const VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE = 0.005;

/**
 * Reference slide bulk densities (kg/m³) at which each regime's
 * prefactor K was calibrated. The Watts (2000) characteristic amplitude
 * scales with the SUBMERGED specific gravity γ = ρ_slide/ρ_water − 1,
 * so the source amplitude carries an explicit γ-ratio factor
 * (γ / γ_ref); at the reference density the factor is 1 and the output
 * equals the historic calibration exactly.
 *
 *   - Subaerial reference: volcanic edifice rock ≈ 2500 kg/m³ — the
 *     material of the Anak Krakatau 2018 flank against which K = 0.4
 *     was calibrated.
 *   - Submarine reference: water-saturated marine sediment ≈ 1950 kg/m³
 *     — the Storegga continental-slope material behind K = 0.005.
 *
 * Making γ explicit restores the density dependence that the bare
 * V^(1/3) form dropped: a dense basalt block makes a markedly larger
 * wave than a soft mud slump of the same volume and slope.
 */
/**
 * The share of the source water column the wave at the source is held to.
 *
 * **A project number with no source.** It was credited to McCowan (1894) until
 * 16 September 2026, and it is not his: McCowan's solitary-wave breaking limit
 * is 0.78 of the depth, which this project uses correctly in
 * `tsunamiCasualties.ts` (BREAKING_INDEX) and states in docs/SCIENCE.md's
 * shoaling section. Nothing has been found that gives 0.4, and the value is
 * left exactly where it was rather than moved under cover of fixing the
 * citation — see B-039 in docs/BUG_REGISTRY.md.
 *
 * What it decides: four of the product's eight wave presets sit exactly on it
 * — Lituya Bay 1958, Anak Krakatau 2018 in both its framings, and Hunga Tonga
 * 2022 — so for those the wave a visitor sees is this number and not the
 * relation above it. Whether a generation-site ceiling should be 0.4, 0.78, or
 * absent is an open question: McCowan's limit is for a solitary wave shoaling
 * on a flat bottom, which a wave at its own source is not, and Heller's
 * impulse-wave equations produce crests up to 0.94 of the depth inside the
 * ranges his own experiments span.
 */
export const SOURCE_AMPLITUDE_CEILING = 0.4;

export const VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL = 2_500;
export const VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE = 1_950;

/**
 * Default prefactor — kept for back-compat with callers that did not
 * specify a regime. Resolves to the subaerial value because every
 * pre-existing caller (volcano caldera + flank slides) is in that
 * regime; the submarine path is opt-in via the new `regime` field.
 */
export const VOLCANO_TSUNAMI_PREFACTOR = VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL;

export type LandslideTsunamiRegime = 'subaerial' | 'submarine';

/** Basin depth when the caller gives none (m): most volcanic islands
 *  sit on a shelf much shallower than the global ocean mean. */
export const DEFAULT_SOURCE_BASIN_DEPTH_M = 1_000;

/** Dynamic amplification of the static V/A rise in a confined basin
 *  when the caller gives none: the value that reproduces the wave at
 *  the Vaiont dam (see `confinedBasinArea`). 3 until 14 September
 *  2026, when the wave it had been set on turned out to be the
 *  thickness of the slide. */
export const DEFAULT_CONFINEMENT_DYNAMIC_FACTOR = 1.8;

export interface VolcanoTsunamiInput {
  /** Collapsed block volume (m³). Anak Krakatau-class events sit at
   *  ≈ 3 × 10⁸; Krakatau-class caldera collapses at ≈ 2 × 10¹⁰. */
  collapseVolumeM3: number;
  /** Slope angle of the failure plane (rad). 20–25° for sub-aerial
   *  flank slides; 40–60° for caldera-wall collapse. */
  slopeAngleRad: number;
  /** Mean basin depth used for travel-time AND for the breaking cap
   *  unless `sourceWaterDepth` is set (m). Defaults to 1 000 m — most
   *  volcanic islands sit on a shelf much shallower than the global
   *  ocean mean. */
  meanOceanDepth?: Meters;
  /** Optional: depth of the water column AT THE SOURCE where the
   *  collapse occurs (m). When set, this controls the ceiling-style
   *  breaking cap on the source amplitude — distinct from the depth
   *  the wave PROPAGATES through (`meanOceanDepth`).
   *
   *  For Krakatau 1883 this is the post-collapse caldera depth (~250 m),
   *  NOT the surrounding shelf shallows (~50 m). Without this split,
   *  the cap on a 50 m shelf saturates a 25 km³ caldera collapse to a
   *  20 m source amplitude — physically wrong for a depression that
   *  sinks hundreds of metres. Defaults to `meanOceanDepth` for
   *  back-compat with callers that don't make the distinction. */
  sourceWaterDepth?: Meters;
  /** Optional: planform area of the slide footprint (m²). When set,
   *  the equivalent cavity radius is sqrt(area/π) — appropriate for
   *  elongated submarine slumps where the V^(1/3) generic estimate
   *  under-counts the line-source character.
   *
   *  Storegga ~8 200 BP is the canonical case: ≈ 290 km long × ≈ 100 km
   *  wide footprint over 250 m thickness gives V^(1/3) = 14 km but a
   *  proper equivalent-disc radius of ≈ 96 km. The 1/r far-field decay
   *  over 14 km vs 96 km is a ~7× under-prediction at trans-Atlantic
   *  ranges, which matters for Bondevik 2005 Sula / Shetland comparison.
   *  For compact volcanic flank collapses (Anak Krakatau ~1 km block),
   *  V^(1/3) is already a good approximation; the field is opt-in. */
  slideFootprintArea?: SquareMeters;
  /** A source amplitude (m) computed elsewhere, which replaces the Watts
   *  cube root and its breaking cap. Everything downstream — the cavity
   *  radius, the 1/r decay, the travel times — is unchanged, so this hands
   *  the *generation* to another relation and keeps the propagation. The
   *  landslide module passes Heller's first crest here
   *  (effects/impulseWave.ts, rule 119 of validation/impulseWaveRules.ts). */
  sourceAmplitudeM?: number;
  /** Optional: planform area of the CONFINED BASIN (reservoir, fjord)
   *  the slide enters (m²). When set, the source amplitude is
   *  computed as the basin-fill formula
   *
   *      η_source = min(V / A_basin × confinementDynamicFactor,
   *                     sourceWaterDepth)
   *
   *  instead of the open-ocean Watts cube-root form. Confined-basin
   *  slides cannot dissipate energy by 2D radial spreading — the
   *  displaced volume raises the basin water level uniformly to first
   *  order, and the dynamic (impulsive-entry) amplification multiplies
   *  that static rise. Cap is the basin depth (the wave cannot exceed
   *  the water column it lives in).
   *
   *  Calibration anchor (with `confinementDynamicFactor` defaulting to
   *  1.8, calibrated on it):
   *    - Vaiont 1963 (V = 2.7 × 10⁸ m³, A_res ≈ 3 × 10⁶ m², 238 m of
   *      water at the dam): η_static = 90 m, dynamic ×1.8 = 162 m. The
   *      wave crested 140 m above the top of the dam (Genevois &
   *      Ghirotti 2005, Giorn. Geol. Appl. 1: 41), and the lake stood
   *      25 m below the crest (ASDSO, Dam Failures: Vajont) — 165 m
   *      above the water. The factor was 3 until 14 September 2026,
   *      tuned on a 250 m wave that is the thickness of the slide in
   *      that paper.
   *    - Lituya Bay 1958 still acknowledged as out-of-model: even
   *      the basin-fill formula under-predicts the 524 m run-up
   *      because the steep fjord walls produce splash-up effects
   *      Watts-class models cannot capture (Walder et al. 2003,
   *      Pure Appl. Geophys. 160). */
  confinedBasinArea?: SquareMeters;
  /** Optional dynamic-amplification factor applied on top of the
   *  static V/A basin rise when `confinedBasinArea` is set. Defaults
   *  to 1.8, calibrated against Vaiont; a single event, so a basin
   *  of another shape may want another value. */
  confinementDynamicFactor?: number;
  /** Regime selects the per-style prefactor. Defaults to 'subaerial'
   *  for back-compat with the volcano-collapse callers. */
  regime?: LandslideTsunamiRegime;
  /** Slide bulk density (kg/m³). Drives the Watts (2000) submerged
   *  specific-gravity factor γ = ρ_slide/ρ_water − 1: the open-ocean
   *  source amplitude is scaled by γ/γ_ref, where γ_ref is the regime
   *  reference density ({@link VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL}
   *  / `…_SUBMARINE`). Defaults to the regime reference (factor 1 →
   *  historic calibration). A denser slide (basalt ≈ 2900) makes a
   *  bigger wave; a near-neutrally-buoyant one makes essentially none.
   *  Ignored by the confined-basin branch, which is displacement-volume
   *  driven to first order. */
  slideDensity?: number;
}

export interface VolcanoTsunamiResult {
  /** Initial wave amplitude at the source (m). */
  sourceAmplitude: Meters;
  /** Equivalent cavity radius (m) seeding the 1/r far-field decay —
   *  the slide's characteristic linear scale V^(1/3) (or √(area/π) when
   *  a slide footprint is supplied), NOT the impact-style 2·η_source. */
  cavityRadius: Meters;
  /** Far-field amplitude at 100 km from the volcano (m). */
  amplitudeAt100km: Meters;
  /** Far-field amplitude at 1 000 km from the volcano (m). */
  amplitudeAt1000km: Meters;
  /** Travel time to the 100 km contour (s). */
  travelTimeTo100km: Seconds;
  /** Travel time to the 1 000 km contour (s). */
  travelTimeTo1000km: Seconds;
  /** Echo of the basin depth used. */
  meanOceanDepth: Meters;
}

/**
 * Compute the volcanic-collapse tsunami source. Returns null when the
 * inputs cannot drive a wave (zero or negative volume / slope, or no
 * water column for the slide to displace — Elm 1881 sturzstrom in the
 * Glarus Alps is the canonical "subaerial, dry" archetype).
 */
export function volcanoTsunami(input: VolcanoTsunamiInput): VolcanoTsunamiResult | null {
  const V = input.collapseVolumeM3;
  const theta = input.slopeAngleRad;
  if (!Number.isFinite(V) || V <= 0) return null;
  if (!Number.isFinite(theta) || theta <= 0) return null;

  const meanOceanDepth = input.meanOceanDepth ?? m(DEFAULT_SOURCE_BASIN_DEPTH_M);
  // No water → no Watts source. Catches the dry-runout flank failure
  // case where a caller plumbs meanOceanDepth = 0 to flag "no basin".
  if ((meanOceanDepth as number) <= 0) return null;
  const sourceWaterDepth = input.sourceWaterDepth ?? meanOceanDepth;
  if ((sourceWaterDepth as number) <= 0) return null;
  const K =
    input.regime === 'submarine'
      ? VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE
      : VOLCANO_TSUNAMI_PREFACTOR_SUBAERIAL;
  // Source amplitude: two-branch logic.
  //
  // (a) Confined basin (Vaiont reservoir, fjord rockfalls). When the
  // caller passes `confinedBasinArea` we use the basin-fill formula
  //
  //     η_source = min(V / A_basin × confinementDynamicFactor,
  //                    sourceWaterDepth)
  //
  // The slide volume raises the basin level uniformly (V/A static
  // rise) and the impulsive entry amplifies that by a calibrated
  // factor (default 1.8, matching Vaiont 1963). The cap is the basin
  // depth — wave cannot exceed the water column it lives in, but is
  // NOT subject to the 0.4·h source ceiling because confined-
  // basin sloshing modes can transiently exceed solitary-wave limits.
  //
  // (b) Open-ocean (every existing caller). The Watts (2000)
  // cube-root form K · V^(1/3) · sin(θ) saturated at
  // {@link SOURCE_AMPLITUDE_CEILING} of the SOURCE water column.
  //
  // That ceiling used to be credited here to McCowan 1894. It is not
  // his: McCowan's solitary-wave breaking limit is 0.78 of the depth,
  // which this project uses correctly elsewhere (BREAKING_INDEX in
  // tsunamiCasualties.ts, and docs/SCIENCE.md's shoaling section). The
  // 0.4 has no source that has been found, and it is now declared as
  // the project number it is (B-039).
  const basinArea = input.confinedBasinArea as number | undefined;
  const confinementFactor = input.confinementDynamicFactor ?? DEFAULT_CONFINEMENT_DYNAMIC_FACTOR;
  let eta0: number;
  const supplied = input.sourceAmplitudeM;
  if (basinArea !== undefined && Number.isFinite(basinArea) && basinArea > 0) {
    const staticRise = V / basinArea;
    const dynamicAmp = staticRise * confinementFactor;
    eta0 = Math.min(dynamicAmp, sourceWaterDepth);
  } else if (supplied !== undefined && Number.isFinite(supplied) && supplied > 0) {
    // (c) The generation came from another relation. A confined basin wins
    // over it — a reservoir that sloshes is not a slide entering open water,
    // and it is the case the relations handed in here least apply to. What
    // stays is the breaking cap, which belongs to the water column and not to
    // the law that made the wave: a crest taller than 40 % of its own depth
    // has broken before it is a crest.
    eta0 = Math.min(supplied, (sourceWaterDepth as number) * SOURCE_AMPLITUDE_CEILING);
  } else {
    // Watts (2000) submerged specific-gravity factor γ/γ_ref. γ_ref is
    // the regime's calibration density, so an unspecified slideDensity
    // (or one equal to the reference) gives factor 1 and reproduces the
    // historic K calibration exactly. A slide less dense than seawater
    // is buoyant and displaces no water column → factor 0.
    const seawater = SEAWATER_DENSITY as number;
    const refDensity =
      input.regime === 'submarine'
        ? VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBMARINE
        : VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL;
    const density =
      input.slideDensity !== undefined &&
      Number.isFinite(input.slideDensity) &&
      input.slideDensity > 0
        ? input.slideDensity
        : refDensity;
    const gamma = density / seawater - 1;
    const gammaRef = refDensity / seawater - 1;
    const gammaFactor = gamma > 0 ? gamma / gammaRef : 0;
    const wattsAmplitude = K * gammaFactor * Math.cbrt(V) * Math.sin(theta);
    eta0 = Math.min(wattsAmplitude, (sourceWaterDepth as number) * SOURCE_AMPLITUDE_CEILING);
  }
  const sourceAmplitude = m(eta0);
  // Cavity radius from collapse geometry (V^(1/3) ≈ characteristic
  // linear scale of the slide footprint), NOT from 2·η₀ as a previous
  // implementation did. The Ward-Asphaug back-derivation R_cavity =
  // 2·η₀ is correct for impact craters where the cavity is set by the
  // wave amplitude, but for slope failures the cavity is set by the
  // displaced volume — and 2·η₀ produces tens-of-metres cavities for
  // kilometres-of-collapse events, which then under-predicts far-field
  // amplitudes by 10²-10³× via the impactAmplitudeAtDistance 1/r decay.
  //
  // For elongated slumps (Storegga 290×100 km footprint) the V^(1/3)
  // generic estimate under-counts the line-source character; callers
  // can pass `slideFootprintArea` for an equivalent-disc radius
  // sqrt(A/π) that captures the actual planform spread.
  //
  // Calibration anchors: Krakatau 1883 (V = 2.5 × 10¹⁰ m³) → 2.9 km
  // ≈ 5 km caldera footprint (Pelinovsky et al. 2005); Anak Krakatau
  // 2018 (V = 2.7 × 10⁸) → 0.65 km ≈ 1 km observed slide footprint
  // (Grilli et al. 2019); Storegga (V = 3 × 10¹², A = 2.9 × 10¹⁰ m²)
  // → 96 km vs V^(1/3) = 14 km, matching Bondevik 2005 Fig. 1.
  const footprintArea = input.slideFootprintArea as number | undefined;
  const cavityRadius = m(
    footprintArea !== undefined && Number.isFinite(footprintArea) && footprintArea > 0
      ? Math.sqrt(footprintArea / Math.PI)
      : Math.cbrt(V)
  );
  // Far field uses the UNDAMPED Ward-Asphaug 1/r primitive
  // ({@link impactAmplitudeAtDistance}), NOT the Wünnemann-damped impact
  // variant. The Wünnemann/Melosh damping is specific to short-wavelength
  // IMPACT-cavity waves; it is not transferable as-is to a slope-failure
  // source. So the slide far-field here is the OPTIMISTIC (upper-envelope)
  // 1/r reach — real landslide tsunamis also disperse and decay somewhat
  // faster than 1/r at trans-basin range (Tappin 2017), so read these as
  // an upper bound, not a best estimate.
  const amp100 = impactAmplitudeAtDistance({
    sourceAmplitude,
    cavityRadius,
    distance: m(100_000),
  });
  const amp1000 = impactAmplitudeAtDistance({
    sourceAmplitude,
    cavityRadius,
    distance: m(1_000_000),
  });

  return {
    sourceAmplitude,
    cavityRadius,
    amplitudeAt100km: amp100,
    amplitudeAt1000km: amp1000,
    travelTimeTo100km: tsunamiTravelTime(m(100_000), meanOceanDepth),
    travelTimeTo1000km: tsunamiTravelTime(m(1_000_000), meanOceanDepth),
    meanOceanDepth,
  };
}
