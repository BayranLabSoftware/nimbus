import type { Meters } from '../../units.js';
import { m } from '../../units.js';

/**
 * Extended-footprint estimators for large volcanic eruptions:
 *   - energy-line pyroclastic-flow runout (Dade & Huppert 1998),
 *   - VEI → peak global ΔT climate cooling (Sato 1993 / Robock 2000),
 *   - plinian ashfall 1 mm isopach area,
 *   - lahar / debris-flow runout (Iverson 1997 / Vallance & Iverson 2015).
 *
 * Each helper is intentionally simple (single power law or linear band)
 * because the published uncertainty on all four is at least ±factor 2.
 * Test tolerances reflect that.
 */

/**
 * Pyroclastic-density-current runout using the energy-line ("Heim
 * coefficient") mobility model:
 *
 *   Hayashi, J. N. & Self, S. (1992). "A comparison of pyroclastic flow
 *    and debris avalanche mobility." J. Geophys. Res. 97 (B6): 9063–9071.
 *    DOI: 10.1029/92JB00173 — the PDC energy-line / mobility reference.
 *   Sheridan, M. F. (1979). "Emplacement of pyroclastic flows: a
 *    review." GSA Special Paper 180: 125–136 — H/L mobility ratio.
 *   (The energy-line concept for long-runout granular flows is also
 *    developed by Dade & Huppert 1998 for rockfalls; it is NOT a PDC
 *    paper, so it is not cited as the source here.)
 *
 * A column-collapse PDC descends along an effective "energy line" of
 * slope H/L ≈ 0.08–0.12 for dense flows, so the runout is
 * L ≈ H_collapse / slope.
 *
 * **The drop height is the column-COLLAPSE height, not the buoyant
 * plume top.** A Plinian column collapses from the unstable lower part
 * of the eruption column — a few km — well below the buoyant plume top
 * that {@link plumeHeight} (Mastin 2009) returns. Feeding the full
 * Mastin plume top (tens of km) into the energy line inflates the
 * runout by ~10× (e.g. a 37 km Krakatau plume would give an absurd
 * 370 km PDC). We take the collapse height as a fraction of the plume
 * top (default {@link PDC_COLLAPSE_HEIGHT_FRACTION} = 0.25; Sparks 1986
 * / Woods 1988 put column-collapse heights at ~10–40 % of the
 * equivalent buoyant column). Result is an order-of-magnitude UPPER
 * bound — the ±factor-2 scatter is carried by the UI band.
 *
 * @param plumeHeight  buoyant plume top (m) from Mastin 2009
 * @param slopeHoverL  energy-line slope H/L (default 0.10)
 * @param collapseHeightFraction  fraction of the plume top that the
 *                    collapsing fountain reaches (default 0.25)
 */
export const PDC_COLLAPSE_HEIGHT_FRACTION = 0.25;

export function pdcRunoutEnergyLine(
  plumeHeight: Meters,
  slopeHoverL = 0.1,
  collapseHeightFraction = PDC_COLLAPSE_HEIGHT_FRACTION
): Meters {
  const H = plumeHeight as number;
  if (!Number.isFinite(H) || H <= 0 || slopeHoverL <= 0 || collapseHeightFraction <= 0) {
    return m(0);
  }
  const collapseHeight = H * collapseHeightFraction;
  return m(collapseHeight / slopeHoverL);
}

/**
 * Peak global surface-temperature anomaly (K, negative = cooling)
 * following a VEI-based stratospheric-aerosol scaling inspired by:
 *   Robock, A. (2000). "Volcanic eruptions and climate." Reviews of
 *    Geophysics 38 (2): 191–219. DOI: 10.1029/1998RG000054.
 *   Sato, M., Hansen, J. E., McCormick, M. P. & Pollack, J. B. (1993).
 *    "Stratospheric aerosol optical depths, 1850–1990." J. Geophys.
 *    Res. 98 (D12): 22987–22994.
 *   Toohey, M. & Sigl, M. (2017). "Volcanic stratospheric sulfur
 *    injections and aerosol optical depth from 500 BCE to 1900 CE."
 *    Earth System Science Data 9 (2): 809–831.
 *    DOI: 10.5194/essd-9-809-2017.
 *
 * Empirical anchors and what this formula returns at each one:
 *
 *   VEI  Event           Observed ΔT      Formula ΔT      Δ%
 *   5    El Chichón 1982  −0.3 K           −0.24 K         −20 %
 *   6    Pinatubo 1991    −0.5 K           −0.53 K         + 6 %
 *   6    Krakatau 1883    −0.55 K          −0.53 K         − 4 %
 *   7    Tambora 1815     −1.5 K           −1.17 K         −22 %
 *   8    Toba (model)     −3 to −5 K       −2.58 K (cap)   − 14…48 %
 *
 * Calibration: ΔT(VEI) = max(−5, −0.05 · 2.2^(VEI − 3)) K.
 *   - The 2.2× per-VEI rate (instead of 2×) better fits the observed
 *     Pinatubo→Tambora ratio of ≈ 3 across one VEI step.
 *   - Hard saturation at −5 K reflects the physical fact that
 *     stratospheric aerosol coalesces and sediments faster as mass
 *     increases — past Tambora-class injections, additional SO₂ does
 *     not produce proportionally more cooling (Robock 2000 §5.2).
 *
 * Same-VEI variance: real events at the same VEI can differ ~2× in
 * ΔT depending on stratospheric SO₂ injection (Krakatau 1883 ≈ 35 Tg
 * vs Pinatubo 1991 ≈ 17 Tg, both VEI 6). The simulator's published
 * ±70 % confidence band on this field is the right place to read
 * that variability, not the point estimate.
 */
export function climateCoolingFromVEI(vei: number): number {
  if (!Number.isFinite(vei) || vei < 1) return 0;
  return Math.max(-5, -0.05 * Math.pow(2.2, vei - 3));
}

/**
 * Approximate area (m²) inside the 1 mm ashfall isopach for a given
 * total bulk ejecta volume. Simplified Walker (1980) / Pyle (1989)
 * isopach scaling:
 *
 *     Area(1 mm) ≈ C · V^0.8     (V in km³, Area in km²)
 *
 * with C ≈ 6 × 10⁴ km²·km⁻²·⁴ (see the in-body calibration note — the
 * Pyle 1989 fit is K ≈ 5×10⁴, NOT the 3×10³ used before the Phase-10
 * audit, which under-predicted by ~20×). Order-of-magnitude only; real
 * fallout is wind-shaped and requires HYSPLIT-like Lagrangian
 * advection for a realistic footprint.
 */
export function ashfallArea1mm(totalEjectaVolume: number): number {
  if (!Number.isFinite(totalEjectaVolume) || totalEjectaVolume <= 0) return 0;
  const V_km3 = totalEjectaVolume / 1e9;
  // Phase 10 audit: prefactor 3 000 under-predicted by factor 25
  // (Pinatubo 1991 sim 19 000 km² vs lit 500 000 km²). Re-fit against
  // Pyle 1989 / Bonadonna & Costa 2013 isopach datasets:
  //   MSH 1980 (V≈1 km³) → 50 000 km² observed
  //   Pinatubo 1991 (V≈10 km³) → 500 000 km² observed
  //   Krakatau 1883 (V≈20 km³) → ~1×10⁶ km² observed
  // K = 60 000 fits all three within ±factor-2. Old prefactor was a
  // typo — the published Pyle 1989 fit is K ≈ 5×10⁴, not 3×10³.
  const areaKm2 = 60_000 * Math.pow(V_km3, 0.8);
  return areaKm2 * 1_000_000; // km² → m²
}

/**
 * Approximate lahar (debris-flow) runout distance for a given lahar
 * total volume. Iverson (1997) / Vallance & Iverson (2015) empirical
 * volume–runout scaling for saturated mud-and-debris flows:
 *
 *     L_km ≈ 0.05 · V_m3^0.38
 *
 * Reproduces Mt St. Helens 1980 (V ≈ 5 × 10⁷ m³ → L ≈ 50 km observed)
 * within a factor of 2. The Iverson-style band has wide (±factor 2)
 * scatter around the fit.
 *
 * NOTE ON THE CITATION. Iverson et al. (1998)'s published statistical
 * relation is for inundation *area* (planimetric A ∝ V^(2/3) and
 * cross-sectional area ∝ V^(2/3)), NOT a direct volume→runout-length
 * law. The form below is a runout-LENGTH recast (length ≈ area/width,
 * giving an exponent near 0.4), calibrated to the MSH observation —
 * not a transcription of a numbered Iverson equation.
 *
 * Reference: Iverson, R. M., Schilling, S. P. & Vallance, J. W. (1998).
 * "Objective delineation of lahar-inundation hazard zones." GSA Bull.
 * 110 (8): 972–984; Vallance, J. W. & Iverson, R. M. (2015). "Lahars
 * and their deposits." In Encyclopedia of Volcanoes (2nd ed.),
 * pp. 649–664. Academic Press / Elsevier.
 */
export function laharRunout(laharVolumeM3: number): Meters {
  if (!Number.isFinite(laharVolumeM3) || laharVolumeM3 <= 0) return m(0);
  const L_km = 0.05 * Math.pow(laharVolumeM3, 0.38);
  return m(L_km * 1_000);
}
