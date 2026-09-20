/**
 * The impulse wave manual's **two-dimensional** case: a reservoir narrow
 * enough that the wave cannot spread sideways, and travels down it as it
 * would down a laboratory wave channel.
 *
 * Evers, Heller, Fuchs, Hager & Boes (2019), *Landslide-generated Impulse
 * Waves in Reservoirs — Basics and Computation*, 2nd edition, VAW-Mitteilung
 * 254, ETH Zürich, §3.2.4.2 "Extreme case (a) (2D)", Eqs. (3.13), (3.14),
 * (3.15) and (3.19). It is the same manual `effects/impulseWave.ts` already
 * carries — this is its other reservoir shape, which this project had not
 * read (rules 518 to 524 of `validation/channelDecayRules.ts`).
 *
 * **What this is not.** It is not a generation law. The manual generates the
 * same way in both shapes — its own worked Example 2 uses the 3D equations
 * 3.26 to 3.28 and switches to these only where the reservoir "resembles that
 * of a laboratory wave channel". Every function here takes the impulse
 * product parameter P that `impulseProduct` already computes.
 *
 * **Nothing in the product calls this yet.** Rule 518 keeps the round that
 * wrote it to transcription: rewiring the confined basin touches Vaiont and
 * the recorded waves, and is a round of its own.
 */

/** The gravity the manual computes in, as `impulseWave.ts` keeps it. */
const GRAVITY = 9.81;

/**
 * Eq. (3.13): the maximum wave height, reached in the slide impact zone.
 *
 *     H_M = (5/9) P^(4/5) h
 */
export function channelMaximumWaveHeight(impulseProduct: number, depthM: number): number {
  if (!(impulseProduct > 0 && depthM > 0)) return 0;
  return (5 / 9) * Math.pow(impulseProduct, 4 / 5) * depthM;
}

/**
 * Eq. (3.14): how far down the channel that maximum occurs.
 *
 *     x_M = (11/2) P^(1/2) h
 */
export function channelMaximumDistance(impulseProduct: number, depthM: number): number {
  if (!(impulseProduct > 0 && depthM > 0)) return 0;
  return (11 / 2) * Math.sqrt(impulseProduct) * depthM;
}

/**
 * Eq. (3.15): the period of the maximum wave.
 *
 *     T_M = 9 P^(1/2) (h/g)^(1/2)
 */
export function channelWavePeriod(impulseProduct: number, depthM: number): number {
  if (!(impulseProduct > 0 && depthM > 0)) return 0;
  return 9 * Math.sqrt(impulseProduct) * Math.sqrt(depthM / GRAVITY);
}

/**
 * Eq. (3.19): the wave height farther down the channel than the maximum.
 *
 *     H(x) = (3/4) (P X^(−1/3))^(4/5) h      for X = x/h > X_M = x_M/h
 *
 * Outside that domain — at or before the maximum — this returns 0 rather
 * than a number, because the manual gives the equation only "for X > X_M"
 * and a caller who read it closer in would be extrapolating without knowing.
 * `channelMaximumWaveHeight` is what the impact zone has, and the two do NOT
 * meet: see `CHANNEL_ZONE_JOIN` below.
 */
export function channelWaveHeight(
  impulseProduct: number,
  depthM: number,
  distanceM: number
): number {
  if (!(impulseProduct > 0 && depthM > 0 && distanceM > 0)) return 0;
  if (distanceM <= channelMaximumDistance(impulseProduct, depthM)) return 0;
  const X = distanceM / depthM;
  return (3 / 4) * Math.pow(impulseProduct * Math.pow(X, -1 / 3), 4 / 5) * depthM;
}

/**
 * The exponent the manual writes the channel decay with: an impulse wave in
 * a wave channel is attenuated "in proportion to (x/h)^(−4/15)". It is
 * Eq. (3.19)'s own X-dependence, (X^(−1/3))^(4/5), and the manual's Example 2
 * carries an amplitude down the channel with it directly.
 */
export const CHANNEL_DECAY_EXPONENT = -4 / 15;

/**
 * Carry an amplitude already known at one point of the channel to another
 * farther along, the way the manual's Example 2 carries a_c2 from point C to
 * the dam: 2.2 m over 1 550 m in 100 m of water becomes 1.1 m.
 *
 * `fromM` is the distance from the slide impact at which `amplitudeM` is
 * known; the manual's example starts the count at the impact and reads the
 * ratio of the two X, which for its single-leg case is just the far X.
 */
export function channelDecay(
  amplitudeM: number,
  depthM: number,
  distanceM: number,
  fromM = 0
): number {
  if (!(amplitudeM > 0 && depthM > 0 && distanceM > 0)) return 0;
  const far = Math.pow(distanceM / depthM, CHANNEL_DECAY_EXPONENT);
  const near = fromM > 0 ? Math.pow(fromM / depthM, CHANNEL_DECAY_EXPONENT) : 1;
  return amplitudeM * (far / near);
}

/**
 * The manual's two zones do not join, and this says by how much.
 *
 * Eq. (3.19) evaluated where Eq. (3.14) puts the maximum does not return
 * Eq. (3.13)'s H_M. The ratio is 1.125 at P = 0.13, 0.959 at 0.43, 0.857 at
 * 1.00 and 0.777 at 2.08 — they cross near P ≈ 0.37 and diverge by a quarter
 * at the top of the fitted range. It cannot be a transcription error:
 * Eq. (3.13) carries P^(4/5) and Eq. (3.19) at X_M carries P^(2/3).
 *
 * It matters for whoever wires this in. Eq. (3.19) is a decay law fitted in
 * the propagation zone, not a continuation of the peak, so an amplitude
 * carried down the channel is started from where the channel begins — as
 * Example 2 starts from a_c2 at point C — and not from H_M.
 */
export function channelZoneJoinRatio(impulseProduct: number): number {
  const depthM = 1;
  const peak = channelMaximumWaveHeight(impulseProduct, depthM);
  if (!(peak > 0)) return Number.NaN;
  const atPeak = channelMaximumDistance(impulseProduct, depthM);
  const X = atPeak / depthM;
  const propagation = (3 / 4) * Math.pow(impulseProduct * Math.pow(X, -1 / 3), 4 / 5) * depthM;
  return propagation / peak;
}
