import { m } from '../../units.js';
import type { Meters } from '../../units.js';

/**
 * Median peak ground acceleration of an earthquake on a subduction
 * interface, the two candidates of rule 36 of
 * validation/interfaceRules.ts. Both are coded from the coefficient tables
 * of OpenQuake's implementations (GEM Foundation, AGPL-3.0-or-later) and
 * held to them in interfaceAttenuation.test.ts.
 *
 *  - Abrahamson, N., Gregor, N. & Addo, K. (2016). BC Hydro ground motion
 *    prediction equations for subduction earthquakes. Earthquake Spectra
 *    32 (1): 23–44. OpenQuake's `AbrahamsonEtAl2015SInter`: the central
 *    magnitude scaling (ΔC1 = 0.2 at PGA), a forearc site, the ergodic
 *    model.
 *  - Parker, G. A., Stewart, J. P., Boore, D. M., Atkinson, G. M. &
 *    Hassani, B. (2022). NGA-Subduction global ground motion models with
 *    regional adjustment factors. Earthquake Spectra 38 (1): 456–493; PEER
 *    Report 2020/03. OpenQuake's `ParkerEtAl2020SInter` with no region,
 *    saturation region or basin: the global interface model.
 *
 * Both take the closest distance to the rupture and the site's Vs30, and
 * return the geometric-mean PGA in g.
 */

export interface InterfaceMotionInput {
  magnitude: number;
  /** Closest distance to the rupture (km). */
  rrupKm: number;
  /** Time-averaged shear-wave velocity of the top 30 m (m/s). */
  vs30: number;
}

/** Abrahamson et al. 2016: the period-independent constants (Table 2) and
 *  the PGA row of Table 3, with the central ΔC1 for PGA. */
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
  theta12: 0.98,
  theta13: -0.0135,
  deltaC1: 0.2,
} as const;

/** ln PGA on the model's reference rock before its site term. */
function bcHydroSourceAndPath(magnitude: number, rrupKm: number): number {
  const k = BC_HYDRO;
  const hinge = k.c1 + k.deltaC1;
  const magnitudeTerm =
    k.theta1 +
    k.theta4 * k.deltaC1 +
    (magnitude > hinge ? k.theta5 : k.theta4) * (magnitude - hinge) +
    k.theta13 * (10 - magnitude) ** 2;
  const distanceTerm =
    (k.theta2 + k.theta3 * (magnitude - k.c1)) *
      Math.log(rrupKm + k.c4 * Math.exp((magnitude - 6) * k.theta9)) +
    k.theta6 * rrupKm;
  return magnitudeTerm + distanceTerm;
}

/** Abrahamson, Gregor & Addo 2016, interface, median PGA (g). */
export function abrahamson2016InterfacePga(input: InterfaceMotionInput): number {
  const k = BC_HYDRO;
  const path = bcHydroSourceAndPath(input.magnitude, input.rrupKm);
  // The PGA on 1 000 m/s rock drives the non-linear site term.
  const pga1000 = Math.exp(path + (k.theta12 + k.b * k.n) * Math.log(1_000 / k.vlin));
  const ratio = Math.min(input.vs30, 1_000) / k.vlin;
  const site =
    k.theta12 * Math.log(ratio) +
    (input.vs30 >= k.vlin
      ? k.b * k.n * Math.log(ratio)
      : -k.b * Math.log(pga1000 + k.c) + k.b * Math.log(pga1000 + k.c * ratio ** k.n));
  return Math.exp(path + site);
}

/** Parker et al. 2022, global interface model: the PGA row of its
 *  coefficient table, and its fixed constants. */
const NGA_SUB = {
  c0: 4.082,
  c1: -1.662,
  b4: 0.1,
  a0: -0.00657,
  c4: 1.246,
  c5: -0.021,
  c6: 1.128,
  magnitudeBreak: 7.9,
  s2: -0.498,
  v2: 1_350,
  vref: 760,
  f3: 0.05,
  f4: -0.44169,
  f5: -0.0052,
  vb: 200,
} as const;

/** Parker et al. 2022, global interface model, median PGA (g). */
export function parker2022InterfacePga(input: InterfaceMotionInput): number {
  const k = NGA_SUB;
  const { magnitude, rrupKm, vs30 } = input;
  const dm = magnitude - k.magnitudeBreak;
  const magnitudeTerm = dm > 0 ? k.c6 * dm : k.c4 * dm + k.c5 * dm * dm;
  const h = 10 ** (-0.82 + 0.252 * magnitude);
  const r = Math.sqrt(rrupKm * rrupKm + h * h);
  const path =
    k.c1 * Math.log(r) + k.b4 * magnitude * Math.log(r / Math.sqrt(1 + h * h)) + k.a0 * r;
  // The global model's linear site term has one slope, s1 = s2.
  const linear = vs30 <= k.v2 ? k.s2 * Math.log(vs30 / k.vref) : k.s2 * Math.log(k.v2 / k.vref);
  const rockPga = Math.exp(path + magnitudeTerm + k.c0);
  const nonLinear =
    k.f4 *
    (Math.exp(k.f5 * (Math.min(vs30, k.vref) - k.vb)) - Math.exp(k.f5 * (k.vref - k.vb))) *
    Math.log((rockPga + k.f3) / k.f3);
  return Math.exp(path + nonLinear + linear + magnitudeTerm + k.c0);
}

export type InterfaceMotionModel = 'abrahamson2016' | 'parker2022';

const MODELS: Readonly<Record<InterfaceMotionModel, (input: InterfaceMotionInput) => number>> = {
  abrahamson2016: abrahamson2016InterfacePga,
  parker2022: parker2022InterfacePga,
};

/** The median PGA (g) one of rule 36's models gives. The rings below invert
 *  this; rule 193 of validation/epicentralIntensityRules.ts reads it at the
 *  epicentre, so both ask one function and cannot drift apart. */
export function interfacePga(model: InterfaceMotionModel, input: InterfaceMotionInput): number {
  return MODELS[model](input);
}

/**
 * Rule 51's ring of a point source: the epicentral distance at which the
 * median PGA at the rupture distance `rrupKm` gives for it falls to
 * `targetG`. 0 where the median never reaches it.
 */
export function epicentralDistanceForInterfacePga(
  model: InterfaceMotionModel,
  input: { magnitude: number; vs30: number },
  targetG: number,
  rrupKm: (epicentralKm: number) => number
): Meters {
  const pga = MODELS[model];
  const at = (rKm: number): number =>
    pga({ magnitude: input.magnitude, rrupKm: rrupKm(rKm), vs30: input.vs30 });
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

/**
 * Rule 36's ring: the Joyner–Boore distance x from the rupture's stadium at
 * which the median PGA at the rupture distance √(x² + h²) falls to
 * `targetG`, h the depth. 0 where the median never reaches it.
 */
export function distanceForInterfacePga(
  model: InterfaceMotionModel,
  input: { magnitude: number; depthKm: number; vs30: number },
  targetG: number
): Meters {
  const pga = MODELS[model];
  const at = (xKm: number): number =>
    pga({ magnitude: input.magnitude, rrupKm: Math.hypot(xKm, input.depthKm), vs30: input.vs30 });
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
