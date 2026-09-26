/**
 * The atmosphere at rest the blast solver runs in (rules 1254 and 1255 of
 * `validation/blastSolverRules.ts`): its density and pressure written as
 * ρ̄ = ρ₀α(z) and p̄ = p₀β(z), the form Berberich et al. (2019)'s
 * well-balanced reconstruction reads.
 */

export interface Atmosphere {
  /** Density at the ground (kg/m³). */
  readonly rho0: number;
  /** Pressure at the ground (Pa). */
  readonly p0: number;
  /** Gravity (m/s²); 0 for a uniform atmosphere. */
  readonly g: number;
  /** ρ̄(z)/ρ₀. */
  alpha(z: number): number;
  /** p̄(z)/p₀. */
  beta(z: number): number;
}

/** A uniform gas with no gravity — Sedov–Taylor, and a 1 kt burst near the
 *  ground, far smaller than any scale height. */
export function uniformAtmosphere(rho0: number, p0: number): Atmosphere {
  return { rho0, p0, g: 0, alpha: () => 1, beta: () => 1 };
}

/**
 * An isothermal atmosphere in hydrostatic balance: p̄ = p₀·exp(−z/H) and
 * ρ̄ = ρ₀·exp(−z/H), with H = p₀/(ρ₀g) the pressure scale height.
 */
export function isothermalAtmosphere(rho0: number, p0: number, g: number): Atmosphere {
  const h = p0 / (rho0 * g);
  const shape = (z: number): number => Math.exp(-z / h);
  return { rho0, p0, g, alpha: shape, beta: shape };
}

/** The scale height (m) of an isothermal atmosphere. */
export function scaleHeight(atmosphere: Atmosphere): number {
  return atmosphere.g > 0 ? atmosphere.p0 / (atmosphere.rho0 * atmosphere.g) : Infinity;
}
