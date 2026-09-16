import { EARTH_RADIUS } from '../constants.js';
import type { Joules, Meters, Pascals } from '../units.js';
import { J, m, Pa } from '../units.js';

/**
 * The air blast of an airburst as the Earth Impact Effects Program
 * computes it: a static source of energy at the burst altitude, scaled to
 * one kiloton and read off fits to the overpressure nuclear tests left on
 * the ground.
 *
 * Collins, G. S., Melosh, H. J. & Marcus, R. A. (2005), "Earth Impact
 * Effects Program", Meteoritics & Planetary Science 40 (6): 817–840:
 * yield scaling (Eq. 57), the inner edge of the Mach region (Eq. 58) and,
 * inside it, the surface-burst relation (Eq. 54) with its crossover
 * distance moved out by the burst altitude.
 *
 * Collins, G. S., Lynch, E., McAdam, R. & Davison, T. M. (2017), "A
 * numerical assessment of simple airblast models of impact airbursts",
 * Meteoritics & Planetary Science 52 (8): 1542–1560,
 * DOI 10.1111/maps.12873: the regular reflection region (Eq. 7, which
 * replaces 2005 Eqs. 55–56 because they attenuate the blast of high
 * bursts too fast), the energy the source is given, and the factor of two
 * within three burst heights that their shock-physics runs put between a
 * static and a moving source.
 *
 * Nothing here is set by Nimbus. Against the program's own printed
 * overpressure, 636 airburst points of the benchmark campaign
 * (docs/BENCHMARK_PROTOCOL.md), the relations agree to within 1 % in 618.
 *
 * Neither paper says how the program passes from regular reflection to the
 * Mach region, and the program does not step where Eq. 58 puts the edge. What
 * it does was read off its printed overpressure on 16 September 2026 (rule 129
 * of validation/machBlendRules.ts), is `MachTransition` `program`, and is the
 * default since it held on twelve bodies nobody had asked about (rule 131).
 */

/** One kiloton of TNT (J): the relations are for a 1 kt explosion. */
const KILOTON = 4.184e12;
/** 2005 Eq. 54: the overpressure where the decay turns from ~1/r^2.3 to
 *  ~1/r (Pa). */
const CROSSOVER_PRESSURE = 75_000;
/** Scaled burst altitude (m) at and above which there is no Mach region
 *  (2005, under Eq. 58). */
const MACH_CEILING = 550;
/** The crossover distance of the Mach region at a scaled burst altitude of
 *  zero (m): 289 as the project read 2005, 290 as the program computes it. */
const PUBLISHED_CROSSOVER_BASE = 289;
const PROGRAM_CROSSOVER_BASE = 290;
/** Half the width of the program's blend, per square scaled metre of burst
 *  altitude (1/m): the blend spans r_m1 ± 0.00328 z₁². */
const BLEND_HALF_WIDTH = 0.00328;
/** The farthest a ring is drawn: half the Earth's circumference (m). */
const HALF_CIRCUMFERENCE = Math.PI * (EARTH_RADIUS as number);

/**
 * The energy the static source is given (Collins et al. 2017, the first of
 * their three changes to the program): the larger of the kinetic energy the
 * body keeps at the burst altitude and the energy it has handed to the air
 * by then, W = E₀ · max(f, 1 − f) with f = (v_b / v₀)². No blast coupling
 * factor applies: the relations below are fits to nuclear yields, and the
 * program feeds them the impact energy.
 */
export function airburstBlastYield(kineticEnergy: Joules, keptFraction: number): Joules {
  const energy = kineticEnergy as number;
  if (!(energy > 0) || !Number.isFinite(energy) || !Number.isFinite(keptFraction)) return J(0);
  const kept = Math.min(Math.max(keptFraction, 0), 1);
  return J(energy * Math.max(kept, 1 - kept));
}

/**
 * How the overpressure passes from regular reflection to the Mach region.
 *
 * - `published`: the relations as the papers print them, stepping from one to
 *   the other at r_m1 (2005 Eq. 58), with r_x = 289 + 0.65 z₁.
 * - `program`: what the Earth Impact Effects Program computes (rule 129 of
 *   validation/machBlendRules.ts). The Mach relation takes r_x = 290 + 0.65 z₁,
 *   and from r_m1 − 0.00328 z₁² to r_m1 + 0.00328 z₁² the overpressure is a
 *   straight line in range, from the regular relation at the inner end to the
 *   Mach relation at the outer. Where the line rises, it is the knee a burst
 *   above the ground draws where the Mach stem forms.
 */
export type MachTransition = 'published' | 'program';

/** What a blast that names no transition uses: the program's, adopted on
 *  16 September 2026 by rule 131 of validation/machBlendRules.ts, when it
 *  reproduced the program's printed overpressure on 72 of 72 held-out points
 *  of twelve bodies and the step did on 42. */
export const DEFAULT_MACH_TRANSITION: MachTransition = 'program';

export interface AirburstBlastInput {
  /** Distance along the ground from the point under the burst (m). */
  groundRange: Meters;
  /** Burst altitude (m). */
  burstAltitude: Meters;
  /** Energy of the static source, {@link airburstBlastYield} (J). */
  blastYield: Joules;
  /** {@link MachTransition}; {@link DEFAULT_MACH_TRANSITION} when omitted. */
  machTransition?: MachTransition;
}

/** 2005 Eq. 58: where the Mach region begins for a 1 kt burst at scaled
 *  altitude z₁ (both in m). */
function machEdge(z1: number): number {
  return z1 < MACH_CEILING ? (MACH_CEILING * z1) / (1.2 * (MACH_CEILING - z1)) : Infinity;
}

/** 2017 Eq. 7, as a function of the scaled slant distance d₁ (m). */
function regularReflection(d1: number): number {
  const d2 = d1 * d1;
  return 3.14e11 * d2 ** -1.3 + 1.8e7 * d2 ** -0.565;
}

/** 2005 Eq. 54 with r_x = base + 0.65 z₁, at scaled ground range r₁ (m). */
function machReflection(r1: number, z1: number, base: number): number {
  const rx = base + 0.65 * z1;
  return ((CROSSOVER_PRESSURE * rx) / (4 * r1)) * (1 + 3 * (rx / r1) ** 1.3);
}

/** The program's blend, in scaled metres: where it starts and ends, and the
 *  overpressure the line runs between. Both ends are infinite where there is
 *  no Mach region. */
function blend(z1: number): { inner: number; outer: number; pInner: number; pOuter: number } {
  const edge = machEdge(z1);
  if (!Number.isFinite(edge)) {
    return { inner: Infinity, outer: Infinity, pInner: 0, pOuter: 0 };
  }
  const half = BLEND_HALF_WIDTH * z1 * z1;
  const inner = edge - half;
  const outer = edge + half;
  return {
    inner,
    outer,
    pInner: regularReflection(Math.hypot(inner, z1)),
    pOuter: outer > 0 ? machReflection(outer, z1, PROGRAM_CROSSOVER_BASE) : Infinity,
  };
}

/** Overpressure of a 1 kt burst at scaled altitude z₁, scaled range r₁. */
function scaledOverpressure(r1: number, z1: number, transition: MachTransition): number {
  if (transition === 'published') {
    if (r1 >= machEdge(z1)) {
      return r1 > 0 ? machReflection(r1, z1, PUBLISHED_CROSSOVER_BASE) : Infinity;
    }
    return regularReflection(Math.hypot(r1, z1));
  }
  const b = blend(z1);
  if (r1 >= b.outer) return r1 > 0 ? machReflection(r1, z1, PROGRAM_CROSSOVER_BASE) : Infinity;
  if (r1 <= b.inner) return regularReflection(Math.hypot(r1, z1));
  return b.pInner + ((b.pOuter - b.pInner) * (r1 - b.inner)) / (b.outer - b.inner);
}

/** Cube-root yield scale (m per m of a 1 kt burst), or NaN on bad input. */
function yieldScale(blastYield: Joules): number {
  const w = blastYield as number;
  return w > 0 && Number.isFinite(w) ? Math.cbrt(w / KILOTON) : NaN;
}

/**
 * Peak overpressure on the ground from the static source — the low end of
 * the program's range. Infinite at the burst point of a burst on the
 * ground; 0 for no energy.
 */
export function airburstOverpressure({
  groundRange,
  burstAltitude,
  blastYield,
  machTransition = DEFAULT_MACH_TRANSITION,
}: AirburstBlastInput): Pascals {
  const s = yieldScale(blastYield);
  const r = Math.abs(groundRange);
  const z = burstAltitude as number;
  if (!Number.isFinite(s) || !Number.isFinite(r) || !(z >= 0) || !Number.isFinite(z)) return Pa(0);
  return Pa(scaledOverpressure(r / s, z / s, machTransition));
}

/**
 * The program's range at a point: the static source, and twice it within
 * three burst altitudes of the point under the burst, where Collins et al.
 * (2017) found a moving source up to twice as strong.
 */
export function airburstOverpressureRange(input: AirburstBlastInput): {
  low: Pascals;
  high: Pascals;
} {
  const low = airburstOverpressure(input);
  const within = Math.abs(input.groundRange) < 3 * (input.burstAltitude as number);
  return { low, high: Pa(within ? 2 * (low as number) : low) };
}

/** Geometric bisection for the point where a decreasing f crosses target,
 *  between lo (f ≥ target) and hi (f < target). */
function crossing(f: (x: number) => number, target: number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  for (let i = 0; i < 200 && b - a > 1e-9 * b; i++) {
    const mid = a > 0 ? Math.sqrt(a * b) : b / 2;
    if (f(mid) >= target) a = mid;
    else b = mid;
  }
  return a;
}

/** The first x ≥ start, doubling from it, where f falls below target —
 *  or the limit, if f is still above it there. */
function upperBracket(
  f: (x: number) => number,
  target: number,
  start: number,
  limit: number
): number {
  let hi = Math.max(start, 1e-6) * 2;
  while (hi < limit && f(hi) >= target) hi *= 2;
  return Math.min(hi, limit);
}

/**
 * The farthest scaled ground range r₁ ≤ limit at which a 1 kt burst at
 * scaled altitude z₁ reaches the target overpressure, 0 if none. The
 * regions are tried from the outermost in. In the Mach region and the
 * regular one the overpressure falls with range, so the set above the target
 * in each starts where the region does; the program's blend between them is
 * a straight line, which may rise.
 */
function scaledReach(
  target: number,
  z1: number,
  limit: number,
  transition: MachTransition
): number {
  const base = transition === 'published' ? PUBLISHED_CROSSOVER_BASE : PROGRAM_CROSSOVER_BASE;
  const b = transition === 'published' ? null : blend(z1);
  const edge = b === null ? machEdge(z1) : b.outer;
  if (edge <= limit) {
    const start = edge > 0 ? edge : 0;
    const atStart = start > 0 ? machReflection(start, z1, base) : Infinity;
    if (atStart >= target) {
      const mach = (r1: number) => machReflection(r1, z1, base);
      if (mach(limit) >= target) return limit;
      const hi = upperBracket(mach, target, start, limit);
      return crossing(mach, target, start, hi);
    }
  }
  if (b !== null && b.inner < limit && b.outer > b.inner) {
    const end = Math.min(b.outer, limit);
    const line = (r1: number) =>
      b.pInner + ((b.pOuter - b.pInner) * (r1 - b.inner)) / (b.outer - b.inner);
    if (line(end) >= target) return end;
    // The line is above the target at its inner end and below it at `end`,
    // so it falls, and crosses once.
    if (b.pInner >= target) {
      return b.inner + ((b.pInner - target) * (b.outer - b.inner)) / (b.pInner - b.pOuter);
    }
  }
  const inner = Math.min(b === null ? edge : b.inner, limit);
  if (regularReflection(z1) < target) return 0;
  const byRange = (r1: number) => regularReflection(Math.hypot(r1, z1));
  if (byRange(inner) >= target) return inner;
  const hi = upperBracket(byRange, target, Math.max(z1, 1e-6), inner);
  return crossing(byRange, target, 0, hi);
}

/**
 * The farthest ground range at which the blast reaches the threshold: the
 * static source's for the low end, and for the high end the farther of the
 * static reach and the reach of half the threshold within three burst
 * altitudes. Never beyond half the Earth's circumference; 0 when the
 * threshold is not reached.
 */
export function airburstReach(
  threshold: Pascals,
  burstAltitude: Meters,
  blastYield: Joules,
  end: 'low' | 'high' = 'low',
  transition: MachTransition = DEFAULT_MACH_TRANSITION
): Meters {
  const s = yieldScale(blastYield);
  const target = threshold as number;
  const z = burstAltitude as number;
  if (!Number.isFinite(s) || !(target > 0) || !(z >= 0) || !Number.isFinite(z)) return m(0);
  const z1 = z / s;
  const limit = HALF_CIRCUMFERENCE / s;
  const low = scaledReach(target, z1, limit, transition);
  if (end === 'low') return m(low * s);
  const nearField = scaledReach(target / 2, z1, Math.min(3 * z1, limit), transition);
  return m(Math.max(low, nearField) * s);
}
