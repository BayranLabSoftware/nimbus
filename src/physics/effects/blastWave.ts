import {
  AIR_HEAT_CAPACITY_RATIO,
  SEA_LEVEL_AIR_DENSITY,
  SEA_LEVEL_PRESSURE,
  SEA_LEVEL_SOUND_SPEED,
  TNT_SPECIFIC_ENERGY,
} from '../constants.js';
import { peakOverpressure } from '../events/explosion/overpressure.js';
import type { Joules, Kelvin, Meters, Pascals, Seconds } from '../units.js';
import { J, K, m, Pa, s } from '../units.js';

/**
 * Time-resolved blast-wave propagation.
 *
 * Every other blast module in this repo answers "how far?" — given a
 * threshold, at what ground range is it reached. None of them answers
 * "when?". That gap is why the scene layer had to invent its own
 * cinematic constants (a hard-coded 343 m/s front, a 5 s cascade cap)
 * with no path back to a citation.
 *
 * This module closes it. It exposes the shock front as `r(t)` and its
 * inverse `t(r)`, plus the fireball's radius, temperature and buoyant
 * rise — the four quantities a renderer needs to draw an explosion
 * unfolding rather than an explosion that has already finished.
 *
 * Three regimes, joined:
 *
 *   1. **Strong shock (early).** Taylor-Sedov point-blast similarity
 *      solution in a uniform atmosphere. Exact in the limit
 *      Δp ≫ p₀, which holds for the first milliseconds-to-seconds.
 *   2. **Transition.** The front decays; its Mach number follows from
 *      the Rankine-Hugoniot normal-shock relation applied to the
 *      Kinney-Graham overpressure already used for the damage rings.
 *      Integrating `dt = dr / (c₀ · M(Δp(r)))` bridges from the Sedov
 *      regime down to acoustic propagation without a seam.
 *   3. **Acoustic (late).** Δp → 0 ⇒ M → 1 ⇒ the front travels at the
 *      ambient sound speed. Falls out of (2) for free.
 *
 * Using the SAME overpressure law that sets the damage-ring radii means
 * the arrival time and the ring position can never disagree: the front
 * crosses the 5 psi contour exactly when this module says it does.
 *
 * References:
 *   Taylor, G. I. (1950). "The formation of a blast wave by a very
 *     intense explosion. II. The atomic explosion of 1945."
 *     Proc. R. Soc. Lond. A 201 (1065), 175–186.
 *     DOI: 10.1098/rspa.1950.0050
 *   Sedov, L. I. (1946). "Propagation of strong shock waves."
 *     J. Appl. Math. Mech. 10, 241–250.
 *   Glasstone, S. & Dolan, P. J. (1977). "The Effects of Nuclear
 *     Weapons" (3rd ed.), §2.112–§2.130 (fireball growth, breakaway,
 *     cloud rise).
 *   Collins, G. S., Melosh, H. J. & Marcus, R. A. (2005). MAPS 40(6),
 *     Eq. 33 (impact fireball radius).
 *     DOI: 10.1111/j.1945-5100.2005.tb00157.x
 *   Kinney, G. F. & Graham, K. J. (1985). "Explosive Shocks in Air"
 *     (2nd ed.), Ch. 4.
 */

/**
 * Taylor-Sedov similarity constant ξ₀ for a spherical blast in a
 * γ = 1.4 gas. Taylor (1950) Table 1 gives ξ₀ ≈ 1.033; the value is
 * weakly dependent on γ and is the standard choice for air.
 */
const SEDOV_XI = 1.033;

/** Sedov radius exponent: R ∝ t^(2/5) in three dimensions. */
const SEDOV_TIME_EXPONENT = 2 / 5;
/** Sedov energy exponent: R ∝ (E/ρ)^(1/5). */
const SEDOV_ENERGY_EXPONENT = 1 / 5;

/**
 * Shock-front radius from the Taylor-Sedov point-blast solution:
 *
 *     R(t) = ξ₀ · (E / ρ₀)^(1/5) · t^(2/5)
 *
 * Valid while the shock is strong (Δp ≫ p₀) — the first few
 * milliseconds for a kilotonne device, the first seconds for a
 * megatonne one. Past that use {@link buildShockArrival}, which
 * continues the front into the weak-shock and acoustic regimes.
 *
 * Historical check: Taylor recovered the Trinity yield from exactly
 * this relation and the timed fireball photographs — at t = 6 ms the
 * front stood at ≈ 80 m. The unit test pins that number.
 */
export function sedovShockRadius(
  energy: Joules,
  time: Seconds,
  ambientDensity: number = SEA_LEVEL_AIR_DENSITY
): Meters {
  const E = energy as number;
  const t = time as number;
  if (!Number.isFinite(E) || E <= 0 || !Number.isFinite(t) || t <= 0) return m(0);
  return m(SEDOV_XI * (E / ambientDensity) ** SEDOV_ENERGY_EXPONENT * t ** SEDOV_TIME_EXPONENT);
}

/**
 * Inverse of {@link sedovShockRadius}: the time at which the strong
 * shock reaches `radius`. Closed form, no iteration.
 */
export function sedovTimeToRadius(
  energy: Joules,
  radius: Meters,
  ambientDensity: number = SEA_LEVEL_AIR_DENSITY
): Seconds {
  const E = energy as number;
  const R = radius as number;
  if (!Number.isFinite(E) || E <= 0 || !Number.isFinite(R) || R <= 0) return s(0);
  const scale = SEDOV_XI * (E / ambientDensity) ** SEDOV_ENERGY_EXPONENT;
  return s((R / scale) ** (1 / SEDOV_TIME_EXPONENT));
}

/**
 * Shock-front Mach number from the peak overpressure behind it, via
 * the Rankine-Hugoniot normal-shock relation. For a calorically
 * perfect gas the pressure jump across a normal shock is
 *
 *     p₂/p₁ = (2γM² − (γ − 1)) / (γ + 1)
 *
 * which rearranges to
 *
 *     M = √( 1 + (γ + 1)/(2γ) · Δp/p₁ )
 *
 * — for γ = 1.4 the coefficient is 6/7. M → 1 as Δp → 0, so a decayed
 * front automatically travels at the ambient sound speed.
 */
export function shockMachNumber(
  overpressure: Pascals,
  ambientPressure: Pascals = SEA_LEVEL_PRESSURE
): number {
  const dp = overpressure as number;
  const p1 = ambientPressure as number;
  if (!Number.isFinite(dp) || dp <= 0) return 1;
  const gamma = AIR_HEAT_CAPACITY_RATIO;
  return Math.sqrt(1 + ((gamma + 1) / (2 * gamma)) * (dp / p1));
}

/**
 * Maximum fireball radius of a nuclear detonation.
 *
 *     R_max ≈ 70 · W^0.4      (W in kilotonnes, R in metres)
 *
 * Fitted to Glasstone & Dolan (1977) §2.120, which quotes a maximum
 * fireball diameter of ≈ 440 m for 20 kt and ≈ 2.2 km for 1 Mt. The
 * W^0.4 exponent is the standard scaling across that range.
 */
export function nuclearFireballRadius(yieldKilotons: number): Meters {
  if (!Number.isFinite(yieldKilotons) || yieldKilotons <= 0) return m(0);
  return m(70 * yieldKilotons ** 0.4);
}

/**
 * Fireball radius of a cosmic impact.
 *
 *     R_f = 0.002 · E^(1/3)     (E in joules, R in metres)
 *
 * Collins, Melosh & Marcus (2005), Eq. 33 — the same relation whose
 * horizon term bounds the thermal-radiation reach.
 */
export function impactFireballRadius(energy: Joules): Meters {
  const E = energy as number;
  if (!Number.isFinite(E) || E <= 0) return m(0);
  return m(0.002 * Math.cbrt(E));
}

/**
 * Fraction of the MAXIMUM fireball radius at which the shock front
 * breaks away. Breakaway happens well before the fireball stops
 * growing: Glasstone & Dolan §2.117–§2.120 place it at ≈ 15 ms for
 * 20 kt, and the Sedov front is at ≈ 112 m then, against a maximum
 * fireball radius of ≈ 232 m. One anchor, one number, ≈ 0.5.
 *
 * The same 0.5 reproduces the ≈ 0.1 s quoted for a 1 Mt burst without
 * any further tuning, which is the check that it is a scaling and not
 * a fit to a single point.
 */
const BREAKAWAY_RADIUS_FRACTION = 0.5;

/**
 * Breakaway: the instant the shock front detaches from the luminous
 * fireball and races ahead of it. Past this point the fireball stops
 * tracking the blast and starts to rise; the front continues alone.
 */
export function breakawayTime(energy: Joules, fireballRadius: Meters): Seconds {
  return sedovTimeToRadius(energy, m((fireballRadius as number) * BREAKAWAY_RADIUS_FRACTION));
}

/**
 * Buoyant rise speed of the post-breakaway cloud (m/s).
 *
 * Glasstone & Dolan §2.126 report a rise of roughly 100 m/s during the
 * first minute, weakly increasing with yield. We scale gently with
 * fireball size and cap at 150 m/s: above the megatonne range there is
 * no observational anchor, and an uncapped linear scaling sends a
 * Chicxulub-class bubble past escape velocity.
 */
export function buoyantRiseSpeed(fireballRadius: Meters): number {
  const R = fireballRadius as number;
  if (!Number.isFinite(R) || R <= 0) return 0;
  return Math.min(150, Math.max(45, R * 0.13));
}

/**
 * Fireball surface temperature (K) at time `t` after detonation.
 *
 * CALIBRATED ENVELOPE, NOT A DERIVED LAW. Glasstone & Dolan §2.106
 * put the second thermal maximum near 7 000–8 000 K, after which the
 * fireball cools radiatively. We fit a single-parameter decay anchored
 * on the breakaway time so the shape is right and the peak matches the
 * published figure; the exact cooling curve depends on opacity and
 * yield in ways this model does not resolve.
 *
 * Consumers that label their output as quantitative must NOT cite this
 * as a measurement — it sets the colour of a rendered fireball, not a
 * reported number.
 */
export function fireballTemperature(time: Seconds, breakaway: Seconds): Kelvin {
  const t = Math.max(time, 0);
  const tau = Math.max((breakaway as number) * 4, 0.05);
  return K(Math.max(400, 7600 * (tau / (tau + t)) ** 0.62));
}

/**
 * Tabulated shock arrival: radius and time sampled together so both
 * `r(t)` and `t(r)` are one interpolation away. Monotone in both.
 */
export interface ShockArrival {
  /** Front radius at each sample (m), strictly increasing. */
  readonly radii: Float64Array;
  /** Arrival time at the matching radius (s), strictly increasing. */
  readonly times: Float64Array;
  /** Time at which the front reaches `radii[last]` (s). */
  readonly totalTime: Seconds;
}

/**
 * Integrate the front outward from the fireball surface to `maxRadius`:
 *
 *     t(R) = ∫ dr / ( c₀ · M(Δp(r)) )
 *
 * with Δp from Kinney-Graham and M from Rankine-Hugoniot. Log-spaced
 * samples put resolution where the front is fastest. The integral is
 * evaluated at segment midpoints (second-order accurate) rather than
 * endpoints, because near the source Δp varies by orders of magnitude
 * across a single segment.
 *
 * `yieldEnergy` is the TNT-equivalent energy that drives the AIR SHOCK.
 * For a cosmic impact that is the kinetic energy times
 * `IMPACT_BLAST_COUPLING`, exactly as `impactDamageRadii` does — pass
 * the same value so the front and the rings stay consistent.
 */
export function buildShockArrival(
  yieldEnergy: Joules,
  startRadius: Meters,
  maxRadius: Meters,
  samples = 768
): ShockArrival {
  const n = Math.max(2, Math.floor(samples));
  const radii = new Float64Array(n);
  const times = new Float64Array(n);
  const r0 = Math.max(startRadius, 1e-3);
  const r1 = Math.max(maxRadius, r0 * 1.001);
  const c0 = SEA_LEVEL_SOUND_SPEED as number;

  const logA = Math.log(r0);
  const logB = Math.log(r1);
  radii[0] = r0;
  times[0] = 0;
  let t = 0;
  for (let i = 1; i < n; i++) {
    const r = Math.exp(logA + ((logB - logA) * i) / (n - 1));
    const prev = radii[i - 1] ?? r0;
    const mid = 0.5 * (r + prev);
    const dp = peakOverpressure({ distance: m(mid), yieldEnergy });
    const mach = shockMachNumber(dp);
    t += (r - prev) / (c0 * mach);
    radii[i] = r;
    times[i] = t;
  }
  return { radii, times, totalTime: s(t) };
}

/** Binary search for the last index whose value is < `x`. */
function lowerIndex(values: Float64Array, x: number): number {
  let lo = 0;
  let hi = values.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if ((values[mid] ?? 0) < x) lo = mid;
    else hi = mid;
  }
  return lo;
}

function interpolate(from: Float64Array, to: Float64Array, x: number): number {
  const n = from.length;
  const first = from[0] ?? 0;
  const last = from[n - 1] ?? 0;
  if (!(n > 1) || x <= first) return to[0] ?? 0;
  if (x >= last) return to[n - 1] ?? 0;
  const i = lowerIndex(from, x);
  const x0 = from[i] ?? 0;
  const x1 = from[i + 1] ?? x0;
  const y0 = to[i] ?? 0;
  const y1 = to[i + 1] ?? y0;
  const span = x1 - x0;
  return span === 0 ? y0 : y0 + ((y1 - y0) * (x - x0)) / span;
}

/** Front radius (m) at time `t`. Clamped to the tabulated range. */
export function shockRadiusAt(arrival: ShockArrival, time: Seconds): Meters {
  return m(interpolate(arrival.times, arrival.radii, time));
}

/** Arrival time (s) of the front at ground range `r`. */
export function shockArrivalAt(arrival: ShockArrival, radius: Meters): Seconds {
  return s(interpolate(arrival.radii, arrival.times, radius));
}

/** Convert an energy to TNT-equivalent kilotonnes. */
export function joulesToKilotons(energy: Joules): number {
  return (energy as number) / (TNT_SPECIFIC_ENERGY * 1e6);
}

/**
 * Everything a renderer needs about the blast at one instant, derived
 * from one energy and one clock reading. Pure — no globals, no
 * animation constants, no frame counter.
 */
export interface BlastWaveState {
  /** Shock-front ground range (m). */
  readonly shockRadius: Meters;
  /** Luminous fireball radius (m). */
  readonly fireballRadius: Meters;
  /** Fireball surface temperature (K) — illustrative, see the note on
   *  {@link fireballTemperature}. */
  readonly fireballTemperature: Kelvin;
  /** Altitude of the fireball centre (m) after buoyant rise. */
  readonly fireballAltitude: Meters;
  /** Peak overpressure immediately behind the front (Pa). */
  readonly overpressureAtFront: Pascals;
  /** True once the front has detached from the fireball. */
  readonly brokenAway: boolean;
}

export interface BlastWaveInput {
  /** TNT-equivalent energy driving the air shock (J). */
  readonly blastEnergy: Joules;
  /** Maximum fireball radius (m) — from {@link nuclearFireballRadius}
   *  or {@link impactFireballRadius}. */
  readonly fireballRadius: Meters;
  /** Pre-built arrival table covering the range of interest. */
  readonly arrival: ShockArrival;
}

/**
 * Sample the blast at one instant. The fireball grows with the Sedov
 * front until breakaway, then stabilises and begins to rise; the shock
 * front continues on its own.
 */
export function blastWaveStateAt(input: BlastWaveInput, time: Seconds): BlastWaveState {
  const t = Math.max(time, 0);
  const rMax = input.fireballRadius as number;
  const breakaway = breakawayTime(input.blastEnergy, input.fireballRadius) as number;

  const growing = sedovShockRadius(input.blastEnergy, s(t)) as number;
  const brokenAway = t > breakaway;
  const fireR = brokenAway
    ? rMax * (1 + 0.35 * Math.min(1, (t - breakaway) / (breakaway * 14 + 2)))
    : Math.max(growing, rMax * 0.05);

  const riseStart = breakaway * 2.2 + 0.4;
  const dtRise = Math.max(0, t - riseStart);
  const vRise = buoyantRiseSpeed(input.fireballRadius);
  const altitude = fireR * 0.55 + (vRise * dtRise) / (1 + dtRise / (riseStart * 9 + 14));

  const shockRadius = shockRadiusAt(input.arrival, s(t));
  return {
    shockRadius,
    fireballRadius: m(fireR),
    fireballTemperature: fireballTemperature(s(t), s(breakaway)),
    fireballAltitude: m(altitude),
    overpressureAtFront: peakOverpressure({
      distance: m(Math.max(shockRadius, 1)),
      yieldEnergy: input.blastEnergy,
    }),
    brokenAway,
  };
}

/** Re-exported so callers can build an energy without importing units. */
export const blastEnergyFromJoules = (joules: number): Joules => J(joules);

/** Ambient pressure re-export, so the renderer never hard-codes 101325. */
export const AMBIENT_PRESSURE: Pascals = Pa(SEA_LEVEL_PRESSURE);
