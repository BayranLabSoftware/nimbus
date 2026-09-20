/**
 * Campbell & Bozorgnia (2014), the NGA-West2 ground-motion model, for PGA.
 *
 *   Campbell, K. W. & Bozorgnia, Y. (2014). "NGA-West2 Ground Motion Model
 *     for the Average Horizontal Components of PGA, PGV, and 5% Damped
 *     Linear Acceleration Response Spectra." Earthquake Spectra 30 (3),
 *     1087–1115. DOI: 10.1193/062913EQS175M.
 *
 * Why this model is here at all: Boore et al. 2014, which draws the rings
 * today, works in Joyner–Boore distance and carries NO depth — so a Mw 7.0
 * at 3 km and one at 65 km came out identical to the last digit
 * (docs/DEPTH_AND_THE_CONTOUR_LAW.md). Campbell & Bozorgnia is fitted on
 * the same NGA-West2 database as Boore et al. 2014, by the same programme,
 * and its equations 21 to 23 carry the hypocentral depth.
 *
 * The functional form and the PGA coefficients were read from OpenQuake's
 * implementation, `CampbellBozorgnia2014` in openquake.hazardlib (GEM
 * Foundation), which cites the paper; the paper itself was not read here,
 * and the validation page says so — the same provenance, and the same
 * admission, that Allen et al. 2012 already carries in this repository.
 * Nothing is copied: the coefficients are data, and the code below is
 * written from the equations they belong to.
 *
 * WHAT IS LEFT OUT, and why, declared by rule 386 before any number was
 * run:
 *
 *   - The HANGING-WALL term (equations 7 to 16) needs R_x, the horizontal
 *     distance to the surface trace measured perpendicular to strike, and
 *     the rupture's dip and width as a fault plane. This project places an
 *     epicentre on a globe and does not have a fault plane for an arbitrary
 *     point. The term is zero here, as it is in the model wherever the site
 *     is not on the upthrown side.
 *   - The BASIN term (equation 20) needs Z_2.5, the depth to the 2.5 km/s
 *     shear-wave horizon. The shipped tiles carry Vs30 and nothing deeper.
 *     The term is zero, which is the model's own behaviour where the basin
 *     depth is unknown and the region's default applies.
 *
 * Both omissions are declared in the visual contract and in the report, and
 * rule 386 requires their size to be printed where they decide an answer.
 */

import { m, type Meters } from '../../units.js';

/** The PGA row of the model's coefficient table. */
const C = {
  c0: -4.416,
  c1: 0.984,
  c2: 0.537,
  c3: -1.499,
  c4: -0.496,
  c5: -2.773,
  c6: 0.248,
  c7: 6.768,
  c8: 0,
  c9: -0.212,
  c10: 0.72,
  c11: 1.09,
  c12: 2.186,
  c13: 1.42,
  c14: -0.0064,
  c15: -0.202,
  c16: 0.393,
  c17: 0.0977,
  c18: 0.0333,
  c19: 0.00757,
  c20: -0.0055,
  dc20: 0,
  a2: 0.167,
  h1: 0.241,
  h2: 1.474,
  h3: -0.715,
  h5: -0.337,
  h6: -0.27,
  k1: 865,
  k2: -1.186,
  k3: 1.839,
  phi1: 0.734,
  phi2: 0.492,
  tau1: 0.409,
  tau2: 0.322,
} as const;

/** The model's own constants (its `CONSTS`). */
const N = 1.18;
const C_NONLINEAR = 1.88;
const H4 = 1.0;

/** The reference rock the site term is measured against. */
const ROCK_VS30 = 1100;

export type StyleOfFaulting = 'reverse' | 'normal' | 'strike-slip';

export interface CampbellBozorgniaInput {
  magnitude: number;
  /** Closest distance to the rupture surface (m). */
  ruptureDistance: Meters;
  /** Time-averaged shear-wave velocity over the top 30 m (m/s). */
  vs30: number;
  /** Depth of the hypocentre below the surface (m). */
  hypocentreDepth: Meters;
  style: StyleOfFaulting;
  /** Dip of the fault plane (degrees). Enters the dip term below Mw 5.5
   *  and the hanging wall at every magnitude. */
  dipDeg?: number;
  /**
   * The hanging wall, where the geometry is known. All four are needed
   * together, and without them the term is zero — which is the model's own
   * behaviour off the upthrown side, and what rules 384 to 389 ran with.
   *
   * `rxKm` is SIGNED: positive on the side the plane dips towards.
   */
  hangingWall?: {
    rxKm: number;
    rjbKm: number;
    ztorKm: number;
    widthKm: number;
  };
}

/**
 * Equation 2: the magnitude term.
 *
 * The three corrections are CUMULATIVE and each is evaluated at the full
 * magnitude, not at a magnitude clamped to the end of its own segment —
 * which is what this read as at first, and what the check against the
 * reference caught: at Mw 8.0 the clamped reading gave 1.75 where the
 * model gives 0.844, a factor of 2.5 on the PGA.
 */
function magnitudeTerm(mw: number): number {
  let f = C.c0 + C.c1 * mw;
  if (mw > 4.5) f += C.c2 * (mw - 4.5);
  if (mw > 5.5) f += C.c3 * (mw - 5.5);
  if (mw > 6.5) f += C.c4 * (mw - 6.5);
  return f;
}

/** Equation 3: geometric attenuation, with the model's own near-source
 *  saturation `c7` — a constant of the model, not the source's depth. */
function geometricTerm(mw: number, rrupKm: number): number {
  return (C.c5 + C.c6 * mw) * Math.log(Math.sqrt(rrupKm * rrupKm + C.c7 * C.c7));
}

/** Equations 4 to 6: style of faulting, fading in between Mw 4.5 and 5.5. */
function styleTerm(mw: number, style: StyleOfFaulting): number {
  const faulting = style === 'reverse' ? C.c8 : style === 'normal' ? C.c9 : 0;
  const scale = mw <= 4.5 ? 0 : mw > 5.5 ? 1 : mw - 4.5;
  return faulting * scale;
}

/**
 * Equations 21 to 23: the hypocentral depth term — the reason this model is
 * in the repository. Depth counts from 7 km down, saturating at 20 km, and
 * its weight grows with magnitude between Mw 5.5 and 6.5.
 */
function hypocentralDepthTerm(mw: number, depthKm: number): number {
  const h = Math.min(Math.max(depthKm - 7, 0), 13);
  const m = mw <= 5.5 ? C.c17 : mw > 6.5 ? C.c18 : C.c17 + (C.c18 - C.c17) * (mw - 5.5);
  return h * m;
}

/** Equation 24: the dip term, which vanishes above Mw 5.5. */
function dipTerm(mw: number, dipDeg: number): number {
  if (mw > 5.5) return 0;
  if (mw < 4.5) return C.c19 * dipDeg;
  return C.c19 * (5.5 - mw) * dipDeg;
}

/**
 * Equations 7 to 16: the hanging wall.
 *
 * Five factors multiplied together, each of which can switch the term off
 * on its own: the site must be on the upthrown side (R_x), the rupture
 * must not be directly under it (R_rup against R_jb), the event must be
 * big enough (Mw 5.5 up), its top must be shallow (nothing past 16.66 km),
 * and the plane must actually dip (nothing at 90°). It is the term this
 * project could not feed until it had a fault plane to build R_x from.
 */
function hangingWallTerm(input: {
  magnitude: number;
  rxKm: number;
  rjbKm: number;
  rrupKm: number;
  ztorKm: number;
  dipDeg: number;
  widthKm: number;
}): number {
  const { magnitude: mw, rxKm, rjbKm, rrupKm, ztorKm, dipDeg, widthKm } = input;
  // Equation 16: a vertical plane has no hanging wall.
  const fDip = (90 - dipDeg) / 45;
  if (fDip <= 0) return 0;
  // Equation 15: nothing once the top of the rupture is deep.
  const fZtor = ztorKm > 16.66 ? 0 : 1 - 0.06 * ztorKm;
  if (fZtor <= 0) return 0;
  // Equation 14: nothing below Mw 5.5.
  const fMag =
    mw < 5.5 ? 0 : mw > 6.5 ? 1 + C.a2 * (mw - 6.5) : (mw - 5.5) * (1 + C.a2 * (mw - 6.5));
  if (fMag === 0) return 0;
  // Equation 13: nothing where the rupture is directly below.
  const fRrup = rrupKm > 0 ? (rrupKm - rjbKm) / rrupKm : 1;
  // Equations 7 to 12: the distance across the trace, signed.
  const r1 = widthKm * Math.cos((dipDeg * Math.PI) / 180);
  const r2 = 62 * mw - 350;
  let fRx: number;
  if (rxKm < 0) fRx = 0;
  else if (rxKm < r1) {
    const ratio = r1 === 0 ? 0 : rxKm / r1;
    fRx = C.h1 + C.h2 * ratio + C.h3 * ratio * ratio;
  } else {
    const span = r2 - r1;
    const d = span === 0 ? 0 : (rxKm - r1) / span;
    fRx = Math.max(0, H4 + C.h5 * d + C.h6 * d * d);
  }
  return C.c10 * fRx * fRrup * fMag * fZtor * fDip;
}

/** Equation 25: anelastic attenuation, beyond 80 km only. */
function anelasticTerm(rrupKm: number): number {
  return rrupKm >= 80 ? (C.c20 + C.dc20) * (rrupKm - 80) : 0;
}

/**
 * Equations 17 to 19: the shallow site response, linear above `k1` and
 * nonlinear below it, where the softer the ground the more the rock motion
 * it is standing on matters.
 */
function siteTerm(vs30: number, pgaOnRock: number): number {
  const ratio = vs30 / C.k1;
  if (vs30 > C.k1) return (C.c11 + C.k2 * N) * Math.log(ratio);
  return (
    C.c11 * Math.log(ratio) +
    C.k2 *
      (Math.log(pgaOnRock + C_NONLINEAR * Math.pow(ratio, N)) - Math.log(pgaOnRock + C_NONLINEAR))
  );
}

/** Everything but the site term, which needs the rock motion first. */
function baseTerms(input: CampbellBozorgniaInput): number {
  const mw = input.magnitude;
  const rrupKm = (input.ruptureDistance as number) / 1_000;
  const depthKm = (input.hypocentreDepth as number) / 1_000;
  const dip =
    input.dipDeg ?? (input.style === 'strike-slip' ? 90 : input.style === 'normal' ? 55 : 45);
  return (
    magnitudeTerm(mw) +
    geometricTerm(mw, rrupKm) +
    styleTerm(mw, input.style) +
    hypocentralDepthTerm(mw, depthKm) +
    dipTerm(mw, dip) +
    anelasticTerm(rrupKm) +
    (input.hangingWall === undefined
      ? 0
      : hangingWallTerm({
          magnitude: mw,
          rxKm: input.hangingWall.rxKm,
          rjbKm: input.hangingWall.rjbKm,
          rrupKm,
          ztorKm: input.hangingWall.ztorKm,
          dipDeg: dip,
          widthKm: input.hangingWall.widthKm,
        }))
    // + basinTerm: not available here, see the file's header
  );
}

/**
 * Median PGA, as a fraction of g.
 *
 * Two passes, as the model requires: the site term is nonlinear in the
 * motion the rock beneath is carrying, so the rock case is solved first at
 * Vs30 = 1100 m/s and its answer feeds the site term of the real one.
 */
export function campbellBozorgnia2014Pga(input: CampbellBozorgniaInput): number {
  const base = baseTerms(input);
  const pgaOnRock = Math.exp(base + siteTerm(ROCK_VS30, 0));
  return Math.exp(base + siteTerm(input.vs30, pgaOnRock));
}

/**
 * Total standard deviation of ln(PGA), the between-event and within-event
 * parts combined (equations 27 to 31, with the site-amplification
 * correlation at its PGA value of 1).
 */
export function campbellBozorgnia2014Sigma(magnitude: number): number {
  const between =
    magnitude <= 4.5
      ? C.tau1
      : magnitude >= 5.5
        ? C.tau2
        : C.tau1 + (C.tau2 - C.tau1) * (magnitude - 4.5);
  const within =
    magnitude <= 4.5
      ? C.phi1
      : magnitude >= 5.5
        ? C.phi2
        : C.phi1 + (C.phi2 - C.phi1) * (magnitude - 4.5);
  return Math.sqrt(between * between + within * within);
}

/**
 * The epicentral distance at which this model's PGA falls to a target, for
 * a source at a given depth.
 *
 * The model is written in R_rup, the closest distance to the rupture
 * surface; a point on the surface at epicentral distance d from a source
 * z deep is sqrt(d² + z²) away from it, which is where the depth enters
 * the answer. Solved by bisection, as every other inversion here is: the
 * form is monotone in distance, so there is one root.
 *
 * `shiftLnPga` is the ground-motion residual, in natural logs of PGA, for
 * the realisations of a predictive band.
 */
export function epicentralDistanceForCampbellBozorgnia2014(
  input: Omit<CampbellBozorgniaInput, 'ruptureDistance'> & {
    /** Depth to the TOP of the rupture (m). A rupture reaches up from its
     *  hypocentre, and R_rup is measured to the plane, not to the focus:
     *  Northridge's hypocentre is 18 km down and the top of its rupture
     *  about 5, which is a factor of three on the distance to every site
     *  above it. Defaults to the hypocentral depth for a point source. */
    topOfRuptureDepth?: Meters;
  },
  targetPgaG: number,
  shiftLnPga = 0
): number {
  const zKm = Math.max(((input.topOfRuptureDepth ?? input.hypocentreDepth) as number) / 1_000, 0);
  const shift = Math.exp(shiftLnPga);
  const at = (epicentralKm: number): number =>
    campbellBozorgnia2014Pga({
      ...input,
      ruptureDistance: m(Math.hypot(epicentralKm, zKm) * 1_000),
    }) * shift;
  if (at(0) < targetPgaG) return 0;
  let lo = 0;
  let hi = 2_000;
  if (at(hi) >= targetPgaG) return hi * 1_000;
  for (let i = 0; i < 60; i += 1) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) >= targetPgaG) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi) * 1_000;
}

/** The PGA this model gives at an epicentral distance, the inversion above
 *  read forwards — the pair `contourAt` and `intensityAt` need. */
export function campbellBozorgnia2014PgaAtEpicentralDistance(
  input: Omit<CampbellBozorgniaInput, 'ruptureDistance'> & { topOfRuptureDepth?: Meters },
  epicentralDistanceM: number
): number {
  const zKm = Math.max(((input.topOfRuptureDepth ?? input.hypocentreDepth) as number) / 1_000, 0);
  const dKm = Math.max(epicentralDistanceM, 0) / 1_000;
  return campbellBozorgnia2014Pga({
    ...input,
    ruptureDistance: m(Math.hypot(dKm, zKm) * 1_000),
  });
}
