import { m } from '../../units.js';
import type { Meters } from '../../units.js';

/**
 * Median peak ground acceleration of an earthquake inside a subducting slab,
 * the two candidates of rule 67 of validation/slabRules.ts. Both are coded
 * from the coefficient tables of OpenQuake's implementations (GEM
 * Foundation, AGPL-3.0-or-later) and held to them in
 * slabAttenuation.test.ts.
 *
 *  - Abrahamson, N., Gregor, N. & Addo, K. (2016). BC Hydro ground motion
 *    prediction equations for subduction earthquakes. Earthquake Spectra
 *    32 (1): 23–44. OpenQuake's `AbrahamsonEtAl2015SSlab`: the central
 *    magnitude scaling for slab events (ΔC1 = −0.3), a forearc site, the
 *    ergodic model, the hypocentral distance and the hypocentre's depth.
 *  - Parker, G. A., Stewart, J. P., Boore, D. M., Atkinson, G. M. &
 *    Hassani, B. (2022). NGA-Subduction global ground motion models with
 *    regional adjustment factors. Earthquake Spectra 38 (1): 456–493; PEER
 *    Report 2020/03. OpenQuake's `ParkerEtAl2020SSlab` with no region,
 *    saturation region or basin: the global slab model, its magnitude break
 *    at Mw 7.6 and its depth scaling.
 *
 * A slab earthquake is taken as the point at its hypocentre, as both
 * implementations take one, so the distance each reads is the hypocentral
 * distance. Both return the geometric-mean PGA in g.
 */

export interface SlabMotionInput {
  magnitude: number;
  /** Hypocentral distance (km). */
  hypocentralKm: number;
  /** Hypocentre depth (km). */
  depthKm: number;
  /** Time-averaged shear-wave velocity of the top 30 m (m/s). */
  vs30: number;
}

/** Abrahamson et al. 2016: the period-independent constants (Table 2), the
 *  PGA row of Table 3 and the central slab ΔC1. */
const BC_HYDRO = {
  n: 1.18,
  c: 1.88,
  theta3: 0.1,
  theta4: 0.9,
  theta5: 0,
  theta9: 0.4,
  c4: 10,
  c1: 7.8,
  vlin: 865.1,
  b: -1.186,
  theta1: 4.2203,
  theta2: -1.35,
  theta6: -0.0012,
  theta10: 3.12,
  theta11: 0.013,
  theta12: 0.98,
  theta13: -0.0135,
  theta14: -0.4,
  deltaC1: -0.3,
} as const;

/** Abrahamson, Gregor & Addo 2016, intraslab, median PGA (g). */
export function abrahamson2016SlabPga(input: SlabMotionInput): number {
  const k = BC_HYDRO;
  const { magnitude, hypocentralKm, depthKm, vs30 } = input;
  const hinge = k.c1 + k.deltaC1;
  const magnitudeTerm =
    k.theta1 +
    k.theta4 * k.deltaC1 +
    (magnitude > hinge ? k.theta5 : k.theta4) * (magnitude - hinge) +
    k.theta13 * (10 - magnitude) ** 2;
  const distanceTerm =
    (k.theta2 + k.theta14 + k.theta3 * (magnitude - k.c1)) *
      Math.log(hypocentralKm + k.c4 * Math.exp((magnitude - 6) * k.theta9)) +
    k.theta6 * hypocentralKm +
    k.theta10;
  const depthTerm = k.theta11 * (Math.min(depthKm, 120) - 60);
  // A forearc site: the backarc term is nil.
  const path = magnitudeTerm + distanceTerm + depthTerm;
  // The PGA on 1 000 m/s rock drives the non-linear site term.
  const pga1000 = Math.exp(path + (k.theta12 + k.b * k.n) * Math.log(1_000 / k.vlin));
  const ratio = Math.min(vs30, 1_000) / k.vlin;
  const site =
    k.theta12 * Math.log(ratio) +
    (vs30 >= k.vlin
      ? k.b * k.n * Math.log(ratio)
      : -k.b * Math.log(pga1000 + k.c) + k.b * Math.log(pga1000 + k.c * ratio ** k.n));
  return Math.exp(path + site);
}

/** Parker et al. 2022, global slab model: the PGA row of its coefficient
 *  table, its fixed constants and its default magnitude break. */
const NGA_SUB_SLAB = {
  c0: 9.907,
  c1: -2.543,
  b4: 0.1,
  a0: -0.00255,
  c4: 1.84,
  c5: -0.05,
  c6: 0.4,
  magnitudeBreak: 7.6,
  d: 0.3004,
  m: 0.0314,
  db: 67,
  s2: -0.498,
  v2: 1_350,
  vref: 760,
  f3: 0.05,
  f4: -0.44169,
  f5: -0.0052,
  vb: 200,
} as const;

/** Parker et al. 2022, global slab model, median PGA (g). */
export function parker2022SlabPga(input: SlabMotionInput): number {
  const k = NGA_SUB_SLAB;
  const { magnitude, hypocentralKm, depthKm, vs30 } = input;
  const dm = magnitude - k.magnitudeBreak;
  const magnitudeTerm = dm > 0 ? k.c6 * dm : k.c4 * dm + k.c5 * dm * dm;
  const slope = (Math.log10(35) - Math.log10(3.12)) / (k.magnitudeBreak - 4);
  const h = magnitude <= k.magnitudeBreak ? 10 ** (slope * dm + Math.log10(35)) : 35;
  const r = Math.sqrt(hypocentralKm * hypocentralKm + h * h);
  const path =
    k.c1 * Math.log(r) + k.b4 * magnitude * Math.log(r / Math.sqrt(1 + h * h)) + k.a0 * r;
  const depthTerm =
    depthKm >= k.db ? k.d : depthKm <= 20 ? k.m * (20 - k.db) + k.d : k.m * (depthKm - k.db) + k.d;
  // The global model's linear site term has one slope, s1 = s2.
  const linear = vs30 <= k.v2 ? k.s2 * Math.log(vs30 / k.vref) : k.s2 * Math.log(k.v2 / k.vref);
  const rockPga = Math.exp(path + magnitudeTerm + k.c0 + depthTerm);
  const nonLinear =
    k.f4 *
    (Math.exp(k.f5 * (Math.min(vs30, k.vref) - k.vb)) - Math.exp(k.f5 * (k.vref - k.vb))) *
    Math.log((rockPga + k.f3) / k.f3);
  return Math.exp(path + nonLinear + linear + magnitudeTerm + k.c0 + depthTerm);
}

export type SlabMotionModel = 'abrahamson2016Slab' | 'parker2022Slab';

const MODELS: Readonly<Record<SlabMotionModel, (input: SlabMotionInput) => number>> = {
  abrahamson2016Slab: abrahamson2016SlabPga,
  parker2022Slab: parker2022SlabPga,
};

/**
 * Rule 67's ring: the epicentral distance at which the median PGA at the
 * hypocentral distance √(x² + h²), h the depth, falls to `targetG`. 0 where
 * the median never reaches it.
 */
export function epicentralDistanceForSlabPga(
  model: SlabMotionModel,
  input: { magnitude: number; depthKm: number; vs30: number },
  targetG: number
): Meters {
  const pga = MODELS[model];
  const at = (xKm: number): number =>
    pga({
      magnitude: input.magnitude,
      hypocentralKm: Math.hypot(xKm, input.depthKm),
      depthKm: input.depthKm,
      vs30: input.vs30,
    });
  if (!(at(0) >= targetG)) return m(0);
  let lo = 0;
  let hi = 10_000;
  for (let i = 0; i < 60; i++) {
    const mid = 0.5 * (lo + hi);
    if (at(mid) > targetG) lo = mid;
    else hi = mid;
  }
  return m(0.5 * (lo + hi) * 1_000);
}
