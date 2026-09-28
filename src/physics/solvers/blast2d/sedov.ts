/**
 * Rule 1314 (b) (`../../validation/blastSolverRules.ts`): the Taylor–Sedov
 * similarity solution of a strong spherical point explosion in a gas at
 * rest, derived and integrated here. With η = r/R, R = ξ₀(Et²/ρ₀)^(1/5) and
 * U = dR/dt = 2R/(5t), the flow is u = Uφ(η), ρ = ρ₀ψ(η), p = ρ₀U²χ(η), and
 * mass, momentum and entropy become
 *   (φ − η)ψ' + ψφ' + 2ψφ/η = 0,
 *   (φ − η)φ' − (3/2)φ + χ'/ψ = 0,
 *   (φ − η)(χ'/χ − γψ'/ψ) = 3,
 * integrated from the strong shock's conditions at η = 1 — φ = 2/(γ+1),
 * ψ = (γ+1)/(γ−1), χ = 2/(γ+1) — inward in ln η by fourth-order
 * Runge–Kutta, ψ and χ through their logarithms. The energy
 * E = 4πR³ρ₀U²∫[ψφ²/2 + χ/(γ−1)]η²dη gives ξ₀⁵ = 25/(16πI).
 */

import type { BlastSolver2D } from './solver.js';

export interface SedovProfile {
  readonly phi: number;
  readonly psi: number;
  readonly chi: number;
}

export interface SedovSolution {
  readonly gamma: number;
  readonly xi0: number;
  /** The energy integral I = ∫₀¹[ψφ²/2 + χ/(γ−1)]η²dη. */
  readonly integral: number;
  profile(eta: number): SedovProfile;
}

/** The solution for γ, on `steps` steps of ln η from 0 down to ln 10⁻⁵. */
export function sedovSolution(gamma: number, steps = 40_000): SedovSolution {
  const tMin = Math.log(1e-5);
  const h = tMin / steps;
  // State: φ, ln ψ, ln χ, and J = ∫ from η = 1 of the energy's integrand η³ dt.
  const rates = (t: number, s: readonly number[]): number[] => {
    const eta = Math.exp(t);
    const phi = s[0] ?? 0;
    const psi = Math.exp(s[1] ?? 0);
    const chi = Math.exp(s[2] ?? 0);
    const a = phi - eta;
    const dphi =
      (3 - (2 * gamma * phi) / eta - (1.5 * a * psi * phi) / chi) / (gamma - (a * a * psi) / chi);
    const dlnpsi = ((-2 * phi) / eta - dphi) / a;
    const dlnchi = (psi * (1.5 * phi - a * dphi)) / chi;
    const integrand = (0.5 * psi * phi * phi + chi / (gamma - 1)) * eta * eta * eta;
    return [eta * dphi, eta * dlnpsi, eta * dlnchi, integrand];
  };
  const etas = new Float64Array(steps + 1);
  const phis = new Float64Array(steps + 1);
  const lnPsis = new Float64Array(steps + 1);
  const lnChis = new Float64Array(steps + 1);
  let s = [2 / (gamma + 1), Math.log((gamma + 1) / (gamma - 1)), Math.log(2 / (gamma + 1)), 0];
  for (let n = 0; n <= steps; n++) {
    const t = n * h;
    etas[n] = Math.exp(t);
    phis[n] = s[0] ?? 0;
    lnPsis[n] = s[1] ?? 0;
    lnChis[n] = s[2] ?? 0;
    if (n === steps) break;
    const k1 = rates(t, s);
    const k2 = rates(
      t + h / 2,
      s.map((v, q) => v + (h / 2) * (k1[q] ?? 0))
    );
    const k3 = rates(
      t + h / 2,
      s.map((v, q) => v + (h / 2) * (k2[q] ?? 0))
    );
    const k4 = rates(
      t + h,
      s.map((v, q) => v + h * (k3[q] ?? 0))
    );
    s = s.map(
      (v, q) => v + (h / 6) * ((k1[q] ?? 0) + 2 * (k2[q] ?? 0) + 2 * (k3[q] ?? 0) + (k4[q] ?? 0))
    );
  }
  // J ran from η = 1 downwards (dt < 0): I = −J, the rest below 10⁻⁵ negligible.
  const integral = -(s[3] ?? 0);
  const xi0 = Math.pow(25 / (16 * Math.PI * integral), 0.2);
  const last = steps;
  return {
    gamma,
    xi0,
    integral,
    profile(eta: number): SedovProfile {
      if (eta >= 1)
        return { phi: phis[0] ?? 0, psi: Math.exp(lnPsis[0] ?? 0), chi: Math.exp(lnChis[0] ?? 0) };
      const t = Math.log(Math.max(eta, 1e-300));
      if (t <= tMin) {
        // The centre: φ ∝ η, ψ ∝ η^(3/(γ−1)), χ constant.
        const e0 = etas[last] ?? 1e-5;
        return {
          phi: ((phis[last] ?? 0) * eta) / e0,
          psi: Math.exp(lnPsis[last] ?? 0) * Math.pow(eta / e0, 3 / (gamma - 1)),
          chi: Math.exp(lnChis[last] ?? 0),
        };
      }
      const x = t / h;
      const n = Math.min(last - 1, Math.floor(x));
      const f = x - n;
      const mix = (arr: Float64Array): number =>
        (arr[n] ?? 0) + f * ((arr[n + 1] ?? 0) - (arr[n] ?? 0));
      return { phi: mix(phis), psi: Math.exp(mix(lnPsis)), chi: Math.exp(mix(lnChis)) };
    },
  };
}

/**
 * Rule 1314 (c): the solver's cells set to the free-air point explosion of
 * energy `energy` (J) centred at the ground's axis, its shock at
 * `shockRadius` (m) — for a ground burst, the mirror's free air of twice
 * its energy — as r-weighted cell averages (16 × 16 points in a cell the
 * shock crosses, 4 × 4 Gauss elsewhere), p = p₀ + ρ₀U²χ, the core's density
 * held at 0.01 ρ₀ (rule 1315); air at rest outside. Returns the energy put in above the air at rest (J), over the
 * half space the solver holds.
 */
export function sedovStart(
  solver: BlastSolver2D,
  energy: number,
  shockRadius: number,
  gamma = solver.gamma
): number {
  // Rule 1354 (c): the core lies far beyond real air's fit.
  if (solver.eos === 'air') throw new Error('blast2d: rule 1354 (c) -- no Sedov start in real air');
  const sol = sedovSolution(gamma);
  const rho0 = solver.backgroundDensity(0);
  const p0 = solver.backgroundPressure(0);
  const t0 = Math.sqrt((Math.pow(shockRadius, 5) * rho0) / (Math.pow(sol.xi0, 5) * energy));
  const u0 = (0.4 * shockRadius) / t0;
  const dx = solver.dx;
  const gauss = [
    [0.5 - 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
    [0.5 - 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
    [0.5 + 0.5 * 0.3399810435848563, 0.5 * 0.6521451548625461],
    [0.5 + 0.5 * 0.8611363115940526, 0.5 * 0.3478548451374538],
  ] as const;
  const fine = Array.from({ length: 16 }, (_, n) => [(n + 0.5) / 16, 1 / 16] as const);
  let excess = 0;
  const reach = Math.ceil(shockRadius / dx) + 1;
  for (let j = 0; j < Math.min(solver.nz, reach); j++)
    for (let i = 0; i < Math.min(solver.nr, reach); i++) {
      const near = Math.hypot(i * dx, j * dx);
      const far = Math.hypot((i + 1) * dx, (j + 1) * dx);
      if (near >= shockRadius) continue;
      const nodes = far > shockRadius ? fine : gauss;
      let w = 0;
      let mass = 0;
      let mr = 0;
      let mz = 0;
      let en = 0;
      for (const [a, wa] of nodes)
        for (const [b, wb] of nodes) {
          const r = (i + a) * dx;
          const z = (j + b) * dx;
          const s = Math.hypot(r, z);
          const weight = wa * wb * r;
          w += weight;
          if (s >= shockRadius) {
            mass += weight * rho0;
            en += (weight * p0) / (gamma - 1);
            continue;
          }
          const q = sol.profile(s / shockRadius);
          // Rule 1315: the empty core's density held at 0.01 ρ₀, its pressure
          // and each point's kinetic energy unchanged.
          const rhoTrue = rho0 * q.psi;
          const rho = Math.max(rhoTrue, 0.01 * rho0);
          const u = u0 * q.phi * Math.sqrt(rhoTrue / rho);
          const p = p0 + rho0 * u0 * u0 * q.chi;
          mass += weight * rho;
          mr += (weight * rho * u * r) / s;
          mz += (weight * rho * u * z) / s;
          en += weight * (p / (gamma - 1) + 0.5 * rho * u * u);
        }
      const k = solver.index(i, j);
      solver.rho[k] = mass / w;
      solver.mr[k] = mr / w;
      solver.mz[k] = mz / w;
      solver.en[k] = en / w;
      excess += (en / w - p0 / (gamma - 1)) * solver.cellVolume(i);
    }
  return excess;
}
