/**
 * How much of its peak an outgoing wave keeps at range r — in one
 * place, for every caller.
 *
 * There is one question here and the simulator used to answer it in
 * four: the veil on the globe, the far-field row each event module
 * publishes, the row the calibration harness compared against the
 * record, and a 1/r cross-check in the extended-effects module. A
 * reviewer who sees two numbers for one wave stops trusting the rest,
 * and rightly.
 *
 * `(R₀ / r)^q` is the shape, and until 9 September 2026 it was also
 * the whole law: amplitude held at the source value out to R₀ and
 * decaying from there. That over-states the far field badly, because
 * a hump does not travel as a coherent ring of its own peak height —
 * it spreads, and the leading crest carries only part of what it
 * started with. For Tōhoku the law read 1.34 m at DART 21413 where
 * 30 cm was recorded, and the whole planet's coasts came out at a
 * metre or two, so the toll of a Sumatran earthquake was dominated by
 * Tokyo Bay, Mumbai and Rio de Janeiro.
 *
 * Energy fixes the normalisation without a fitted constant. A hump of
 * peak A₀ and radius a holds ½ρg·A₀²·πa² of potential energy; half of
 * it goes outward, and at range r it occupies a ring of circumference
 * 2πr whose effective width is √π·a. Equating the two,
 *
 *     A(r) = A₀ · √( a / (4√π · r) )     for r ≫ a
 *
 * and the form below reduces to that far away while staying at A₀ at
 * the edge of the source, where it belongs. It reproduces the
 * Saint-Venant solver of the NOAA benchmark to three per cent — that
 * solver run on its own Gaussian gives 0.494 m at DART where this
 * gives 0.508 — and it takes the field itself to 0.27 m against the
 * 0.30 recorded.
 *
 * The constant is 4√π, the algebra of a Gaussian ring rather than a
 * number chosen to make a row pass.
 *
 * A caller that supplies its own exponent and asks for no
 * normalisation gets the bare (a/r)^q, which is what an impact rim
 * wave needs: Wünnemann's regime-dependent exponents are fitted to
 * their own amplitudes and carry their own constant.
 */

/** The energy of a Gaussian ring, and the whole of the difference
 *  between a decay of the right slope and one of the right size. */
export const SPREAD_NORMALISATION = 4 * Math.sqrt(Math.PI);

/** Smallest source a megathrust is allowed to look like. A shallow
 *  Mw 6.5 has a down-dip width of a few kilometres, and a source
 *  radius below the grid it is drawn on is a singularity rather than
 *  a fault. */
export const MIN_SOURCE_RADIUS_M = 10_000;

export function spreadingFactor(
  sourceRadiusM: number,
  rangeM: number,
  q: number,
  normalise: boolean
): number {
  const a = Math.max(sourceRadiusM, 1e-9);
  const r = Math.max(rangeM, a);
  if (!normalise) return (a / r) ** q;
  // One at the edge of the source, √(a / (4√π·r)) far from it.
  return (a / (a + SPREAD_NORMALISATION * (r - a))) ** q;
}

/**
 * The radius a megathrust looks like to the wave leaving it: half its
 * down-dip width, floored.
 *
 * Not half its along-strike length. A wave leaving a long fault
 * leaves it broadside, so what it sees is the across-strike profile —
 * the same argument that settles the wavelength at 2·W. Measured at
 * DART 21413: half the along-strike length spreads Tōhoku's whole
 * source amplitude over a disc 351 km across and reads 1.93 m where
 * 0.30 was recorded; half the down-dip width reads 0.27 m.
 *
 * One line, so the veil and the published rows cannot pick different
 * ones — which they did, and the gap was pinned as a known
 * divergence for weeks.
 */
export function megathrustSourceRadius(ruptureWidthM: number): number {
  return Math.max(ruptureWidthM / 2, MIN_SOURCE_RADIUS_M);
}
