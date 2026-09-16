import type { KilogramPerCubicMeter, Meters, MetersPerSecond, Radians } from '../../units.js';
import { m } from '../../units.js';

/**
 * The wave of an impact in water as the Earth Impact Effects Program computes
 * it, read off the wave rings its map draws (rules 150 to 153 of
 * validation/impactTsunamiRules.ts).
 *
 * The program opens a crater in the water of diameter
 *
 *     D_w = 0.82581965 · (ρᵢ / ρ_w)^⅓ · L^0.78 · v^0.44 · sin^⅓ θ   (m, SI units)
 *
 * — the form of Collins et al. 2005's Eq. 21, with ρ_w = 1 000 kg/m³ and v the
 * speed the body or its swarm strikes the water at — and draws a wave that
 * falls as the inverse of the range from one crater diameter out:
 *
 *     A(r) = min(0.07 · D_w, h) · D_w / r,   r ≥ D_w
 *
 * with h the depth of the water it struck. Nearer than a crater diameter the
 * program draws no ring; here the wave holds its value at D_w.
 */

export type ImpactTsunamiLaw = 'wunnemann' | 'program';

/** What an impact in water that names no law uses. */
export const DEFAULT_IMPACT_TSUNAMI_LAW: ImpactTsunamiLaw = 'wunnemann';

/** The prefactor of the program's water crater (SI units). */
export const PROGRAM_WATER_CRATER_COEFFICIENT = 0.82581965;
/** The wave height, one crater diameter out, per metre of crater diameter. */
export const PROGRAM_WAVE_FRACTION = 0.07;
const WATER_DENSITY = 1_000;

export interface ProgramWaterCraterInput {
  impactorDiameter: Meters;
  impactorDensity: KilogramPerCubicMeter;
  /** The speed at the water (m/s). */
  impactVelocity: MetersPerSecond;
  impactAngle: Radians;
}

/** The program's crater in the water (m). */
export function programWaterCraterDiameter(input: ProgramWaterCraterInput): Meters {
  const L = input.impactorDiameter as number;
  const rho = input.impactorDensity as number;
  const v = input.impactVelocity as number;
  const sin = Math.sin(input.impactAngle);
  if (!(L > 0) || !(rho > 0) || !(v > 0) || !(sin > 0)) return m(0);
  return m(
    PROGRAM_WATER_CRATER_COEFFICIENT *
      Math.cbrt(rho / WATER_DENSITY) *
      L ** 0.78 *
      v ** 0.44 *
      Math.cbrt(sin)
  );
}

/** The program's wave one crater diameter from the impact (m). */
export function programTsunamiReferenceAmplitude(
  waterCraterDiameter: Meters,
  waterDepth: Meters
): Meters {
  const D = waterCraterDiameter as number;
  const h = waterDepth as number;
  if (!(D > 0) || !(h > 0)) return m(0);
  return m(Math.min(PROGRAM_WAVE_FRACTION * D, h));
}

/** The program's wave at a range (m). */
export function programTsunamiAmplitude(
  waterCraterDiameter: Meters,
  waterDepth: Meters,
  range: Meters
): Meters {
  const D = waterCraterDiameter as number;
  const reference = programTsunamiReferenceAmplitude(waterCraterDiameter, waterDepth) as number;
  const r = Math.abs(range);
  if (!(reference > 0)) return m(0);
  return m(r > D ? (reference * D) / r : reference);
}
