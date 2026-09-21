import { EARTH_RADIUS } from '../constants.js';
import type { EntryPathSample } from './atmosphericEntry.js';

/**
 * The radiation a meteor's shock layer and wake send to the ground, as
 * Johnston & Stern (2019) correlate it for NASA's Asteroid Threat Assessment
 * Project (ATAP): "A model for thermal radiation from the Tunguska airburst",
 * Icarus 327, 48–59 (doi:10.1016/j.icarus.2019.01.028, open access).
 *
 * Their Navier–Stokes flowfields, with coupled radiation and ablation, were
 * ray-traced to the ground at velocities of 6 to 18 km/s, radii of 25 to
 * 200 m, altitudes of 10 to 30 km and view angles of 0 to 150 degrees, and
 * the flux reduced to their Eq. (9), within ±30 % of the simulations but for
 * four cases; the atmosphere's absorption between the shock layer and the
 * ground to their Eq. (3), within ±15 to ±25 %. Integrated along a Tunguska
 * trajectory — a pancake whose radius is held at four times the body's — the
 * 40 J/cm² contour of the heat load, where wood visibly chars, lies within
 * ±2 km of the measured radiant burn, and its centre 2.5 km uprange of the
 * epicentre, where the burn's lies 2 km uprange (their Figs. 19 to 24).
 */

/**
 * What an airburst's flash is drawn from (B-095).
 *
 * - `efficiency`: the flash of the energy left in the air at Collins et al.'s
 *   impact luminous efficiency, 3 × 10⁻³ — the nominal of PAIR, NASA's
 *   operational impact risk model (Coates et al. 2023).
 * - `atap`: the stronger, at every range, of that flash and the heat load
 *   Johnston & Stern's correlation lays along the entry's path where it was
 *   fitted; the fireball on the ground is added to either, as it is today.
 */
export type AirburstRadiation = 'efficiency' | 'atap';

/** What an impact that names no airburst radiation uses. */
export const DEFAULT_AIRBURST_RADIATION: AirburstRadiation = 'efficiency';

/** Where the correlation was fitted: the simulation matrix of Johnston &
 *  Stern's Section 4, in their units. */
export const ATAP_DOMAIN = {
  /** Velocity, km/s. */
  velocity: [6, 18],
  /** Radius of the body or its debris cloud, m. */
  radius: [25, 200],
  /** Velocity over altitude, (km/s)/km: the matrix's range of the view-angle
   *  exponent a = 0.69 (V/H)², whose largest is at 18 km/s and 10 km. Their
   *  own Tunguska trajectories stay inside it below 10 km, where the body
   *  has slowed. */
  velocityOverAltitude: 18 / 10,
  /** View angle from the velocity vector, degrees. */
  viewAngle: [0, 150],
} as const;

/** Johnston & Stern's own maximum radius factor for the debris cloud, which
 *  their Tunguska trajectories hold it at (they vary it from 3 to 5.5). */
export const ATAP_RADIUS_CAP = 4;

/** The altitude their trajectories start at (km): the flux above is nil. */
export const ATAP_TOP_KM = 40;

/** The spacing in altitude the path is read at (m). */
export const ATAP_PATH_STEP = 200;

/**
 * Eq. (9): the radiative flux (W/cm²) at a point on the ground, for a meteor at
 * velocity `v` (km/s) and altitude `h` (km), of radius `r` (m), seen at a view
 * angle `phi` (degrees from its velocity vector) and a distance `l` (km) from
 * its nose, without the atmosphere's absorption.
 */
export function atapFlux(v: number, h: number, r: number, phi: number, l: number): number {
  const a = 0.69 * (v / h) ** 2;
  const b = 1.3 - 0.015 * v ** 1.12 * r ** 0.21;
  const fPhi = 2.75 + 9.6 * (phi / 60) ** a;
  const fH = (4.15 * Math.exp(-0.1423 * h)) ** b;
  const fR = (r / 25) ** 1.7;
  const fL = (10 / l) ** 2;
  const fV = Math.exp(4.1267 - 0.0357 * v - 54.137 / v);
  return fPhi * fH * fR * fL * fV;
}

/** Eq. (3): the share of the flux the atmosphere lets through, for an angle
 *  `psi` from the ground's normal and a view angle `phi` (degrees). */
export function atapTransmission(psi: number, phi: number): number {
  return (
    ((-9.56e-5 * psi * psi + 2.54e-3 * psi + 0.59) * (1.32 + 0.11 * phi)) / (2.75 + 0.16 * phi)
  );
}

/** Whether a sample of the path lies where the correlation was fitted. */
export function atapInDomain(v: number, h: number, r: number): boolean {
  return (
    v >= ATAP_DOMAIN.velocity[0] &&
    v <= ATAP_DOMAIN.velocity[1] &&
    r >= ATAP_DOMAIN.radius[0] &&
    r <= ATAP_DOMAIN.radius[1] &&
    h > 0 &&
    v / h <= ATAP_DOMAIN.velocityOverAltitude
  );
}

/**
 * The heat load's footprint reduced as PAIR reduces it: for each exposure, the
 * radius of the disc of the same area as the ground it reaches (Coates et al.
 * 2023). `exposures` fall and `radii` grow; J/m² and m.
 */
export interface RadiantHeat {
  exposures: number[];
  radii: number[];
}

// The grid the footprint is read on, and the path's spacing below: within 2 %
// of a grid of 25 × 72 at 100 m on every ring over a kilometre and every
// field sample over 0.1 J/cm², a third of the time.
const RAY_COUNT = 19;
const RADIAL_COUNT = 56;
const INNER_RADIUS = 30;
const OUTER_RADIUS = 800_000;
const LEVELS_PER_DECADE = 8;
const DECADES = 9;

/**
 * The heat load (J/m²) the path lays on the ground, reduced to its equal-area
 * profile; null where no sample of the path is read. The path runs
 * along +x on the ground at `angle` (radians from the horizontal); the origin is
 * the point under the end of the path, `endAltitude` (m) up. Every in-domain
 * sample radiates for the time the body takes to cross its step, Eq. (9) times
 * Eq. (3) at each point of a polar grid; a sample below a point's horizon, or
 * seen at a view angle past 150 degrees, sends nothing there.
 */
export function radiantHeatOf(
  path: readonly EntryPathSample[],
  angle: number,
  endAltitude: number
): RadiantHeat | null {
  const heatAt = radiantHeatField(path, angle, endAltitude);
  if (heatAt === null) return null;
  return equalAreaProfile(heatAt);
}

/**
 * The heat load (J/m²) the path lays at a point of the ground, x along the path
 * and y across it (km), from the point under the end of the path; null where no
 * sample of the path is fast enough to be read.
 */
export function radiantHeatField(
  path: readonly EntryPathSample[],
  angle: number,
  endAltitude: number
): ((x: number, y: number) => number) | null {
  const sinTheta = Math.sin(angle);
  const cosTheta = Math.cos(angle);
  const tanTheta = sinTheta / cosTheta;
  if (!(sinTheta > 0) || path.length < 2) return null;
  const earthRadiusKm = (EARTH_RADIUS as number) / 1_000;
  // The samples read, with what depends on them alone.
  const sources: {
    x: number;
    h: number;
    a: number;
    rest: number;
    dt: number;
    horizon2: number;
  }[] = [];
  for (let i = 0; i < path.length; i++) {
    const s = path[i];
    if (s === undefined) continue;
    const h = s.altitude / 1_000;
    if (h > ATAP_TOP_KM || h <= 0) continue;
    // Below 6 km/s the correlation gives under 0.4 % of its flux at 18 km/s,
    // and nothing is read there.
    if (s.velocity / 1_000 < ATAP_DOMAIN.velocity[0]) continue;
    // Past the fitted range the correlation is read at its edge, never beyond:
    // a faster body at 18 km/s, a wider cloud at 200 m, and a body too fast
    // for its altitude at the altitude where V/H is the matrix's largest. A
    // sharp cut there drew the rings smaller as the body grew. Below 25 m the
    // fitted (R/25)^1.7 of the radiating layer's projected area is continued,
    // so that the flux falls to nothing with the radius and never steps.
    const v = Math.min(s.velocity / 1_000, ATAP_DOMAIN.velocity[1]);
    const r = Math.min(s.radius, ATAP_DOMAIN.radius[1]);
    const hFit = Math.max(h, v / ATAP_DOMAIN.velocityOverAltitude);
    const next = path[i + 1] ?? path[i - 1];
    if (next === undefined) continue;
    const dz = Math.abs(s.altitude - next.altitude);
    const dt = dz / sinTheta / s.velocity;
    const b = 1.3 - 0.015 * v ** 1.12 * r ** 0.21;
    // Eq. (9)'s factors that do not depend on the point on the ground (W/cm²).
    const rest =
      (4.15 * Math.exp(-0.1423 * hFit)) ** b *
      (r / 25) ** 1.7 *
      Math.exp(4.1267 - 0.0357 * v - 54.137 / v);
    sources.push({
      x: -(s.altitude - endAltitude) / 1_000 / tanTheta,
      h,
      a: 0.69 * (v / hFit) ** 2,
      rest,
      dt,
      horizon2: 2 * earthRadiusKm * h,
    });
  }
  if (sources.length === 0) return null;
  const heatAt = (xg: number, yg: number): number => {
    let total = 0;
    for (const s of sources) {
      const dx = xg - s.x;
      const ground2 = dx * dx + yg * yg;
      if (ground2 > s.horizon2) continue;
      const l = Math.sqrt(ground2 + s.h * s.h);
      const cosPhi = Math.max(-1, Math.min(1, (dx * cosTheta + s.h * sinTheta) / l));
      const phi = (Math.acos(cosPhi) * 180) / Math.PI;
      if (phi > ATAP_DOMAIN.viewAngle[1]) continue;
      const psi = (Math.acos(Math.min(1, s.h / l)) * 180) / Math.PI;
      const fPhi = 2.75 + 9.6 * (phi / 60) ** s.a;
      // W/cm² through the atmosphere, for the seconds of the step: J/cm².
      total += fPhi * s.rest * (10 / l) ** 2 * atapTransmission(psi, phi) * s.dt;
    }
    // J/m².
    return total * 1e4;
  };
  return heatAt;
}

/** The equal-area profile of a heat-load field, on a polar grid about the
 *  origin over the half-plane y ≥ 0 (the footprint is symmetric about the
 *  path). */
function equalAreaProfile(heatAt: (x: number, y: number) => number): RadiantHeat | null {
  // The polar grid, over the half-plane y ≥ 0: the footprint is symmetric.
  const radii: number[] = [];
  for (let k = 0; k < RADIAL_COUNT; k++) {
    radii.push(INNER_RADIUS * (OUTER_RADIUS / INNER_RADIUS) ** (k / (RADIAL_COUNT - 1)));
  }
  const rays: number[][] = [];
  let peak = 0;
  for (let j = 0; j < RAY_COUNT; j++) {
    const beta = (Math.PI * j) / (RAY_COUNT - 1);
    const ray: number[] = [];
    for (const r of radii) {
      const heat = heatAt((r / 1_000) * Math.cos(beta), (r / 1_000) * Math.sin(beta));
      ray.push(heat);
      if (heat > peak) peak = heat;
    }
    rays.push(ray);
  }
  if (!(peak > 0)) return null;
  // The equal-area profile, level by level, down to where a ray's outermost
  // point still lies inside the level.
  const exposures: number[] = [peak];
  const profile: number[] = [0];
  const dBeta = Math.PI / (RAY_COUNT - 1);
  for (let n = 1; n <= LEVELS_PER_DECADE * DECADES; n++) {
    const level = peak * 10 ** (-n / LEVELS_PER_DECADE);
    let halfArea = 0;
    let truncated = false;
    for (let j = 0; j < RAY_COUNT; j++) {
      const ray = rays[j] ?? [];
      let outer = -1;
      for (let k = ray.length - 1; k >= 0; k--) {
        if ((ray[k] ?? 0) >= level) {
          outer = k;
          break;
        }
      }
      let reach = 0;
      if (outer === ray.length - 1) {
        truncated = true;
        break;
      }
      if (outer >= 0) {
        const r0 = radii[outer] ?? 0;
        const r1 = radii[outer + 1] ?? r0;
        const h0 = ray[outer] ?? level;
        const h1 = ray[outer + 1] ?? 0;
        // Log–log between the last point inside and the first outside.
        reach =
          h1 > 0
            ? Math.exp(
                Math.log(r0) +
                  ((Math.log(h0) - Math.log(level)) / (Math.log(h0) - Math.log(h1))) *
                    (Math.log(r1) - Math.log(r0))
              )
            : r0;
      }
      const weight = j === 0 || j === RAY_COUNT - 1 ? 0.5 : 1;
      halfArea += (weight * dBeta * reach * reach) / 2;
    }
    if (truncated) break;
    const radius = Math.sqrt((2 * halfArea) / Math.PI);
    exposures.push(level);
    profile.push(Math.max(radius, profile[profile.length - 1] ?? 0));
  }
  return { exposures, radii: profile };
}

/** The radius (m) of the disc whose area the heat load reaches at an exposure
 *  (J/m²); zero past the peak. */
export function radiantHeatRadius(heat: RadiantHeat | null, exposure: number): number {
  if (heat === null || !(exposure > 0)) return 0;
  const { exposures, radii } = heat;
  const first = exposures[0];
  if (first === undefined || exposure > first) return 0;
  for (let n = 1; n < exposures.length; n++) {
    const e1 = exposures[n] ?? 0;
    if (exposure >= e1) {
      const e0 = exposures[n - 1] ?? e1;
      const r0 = radii[n - 1] ?? 0;
      const r1 = radii[n] ?? r0;
      // From the peak, at the centre, the logarithm of the exposure falls
      // linearly with the radius.
      if (!(r0 > 0))
        return r1 * ((Math.log(e0) - Math.log(exposure)) / (Math.log(e0) - Math.log(e1)));
      return Math.exp(
        Math.log(r0) +
          ((Math.log(e0) - Math.log(exposure)) / (Math.log(e0) - Math.log(e1))) *
            (Math.log(r1) - Math.log(r0))
      );
    }
  }
  // Past the last level: the far field of a source of finite size.
  const eLast = exposures[exposures.length - 1] ?? 0;
  const rLast = radii[radii.length - 1] ?? 0;
  return rLast * Math.sqrt(eLast / exposure);
}

/** The exposure (J/m²) whose equal-area disc has this radius (m): the inverse
 *  of {@link radiantHeatRadius}, the radial field the rings are drawn on. */
export function radiantHeatExposure(heat: RadiantHeat | null, range: number): number {
  if (heat === null || !(range > 0)) return 0;
  const { exposures, radii } = heat;
  for (let n = 1; n < radii.length; n++) {
    const r1 = radii[n] ?? 0;
    if (range <= r1) {
      const r0 = radii[n - 1] ?? r1;
      const e0 = exposures[n - 1] ?? 0;
      const e1 = exposures[n] ?? e0;
      if (r1 === r0) return e1;
      if (!(r0 > 0)) return Math.exp(Math.log(e0) + (range / r1) * (Math.log(e1) - Math.log(e0)));
      return Math.exp(
        Math.log(e0) +
          ((Math.log(range) - Math.log(r0)) / (Math.log(r1) - Math.log(r0))) *
            (Math.log(e1) - Math.log(e0))
      );
    }
  }
  const eLast = exposures[exposures.length - 1] ?? 0;
  const rLast = radii[radii.length - 1] ?? 0;
  return eLast * (rLast / range) ** 2;
}
