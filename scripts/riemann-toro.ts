/**
 * Toro's exact Riemann solution for the ideal gas (Riemann Solvers and
 * Numerical Methods for Fluid Dynamics, ch. 4): V2's (rule 1295 (c)) and V6's
 * ideal-gas check (rule 1334 (c)). Moved here unchanged from
 * `verify-blast-v2.ts`.
 */

export interface Side {
  rho: number;
  u: number;
  p: number;
}

/**
 * Toro's (Riemann Solvers and Numerical Methods for Fluid Dynamics, ch. 4)
 * exact solution: the star pressure and velocity, and the state at x/t.
 */
export function riemann(l: Side, r: Side, g: number) {
  const cl = Math.sqrt((g * l.p) / l.rho);
  const cr = Math.sqrt((g * r.p) / r.rho);
  // His pressure function f_K(p) and its derivative, for side K.
  const f = (p: number, k: Side, c: number): [number, number] => {
    if (p > k.p) {
      const a = 2 / ((g + 1) * k.rho);
      const b = ((g - 1) / (g + 1)) * k.p;
      const s = Math.sqrt(a / (p + b));
      return [(p - k.p) * s, s * (1 - (p - k.p) / (2 * (b + p)))];
    }
    const x = p / k.p;
    return [
      ((2 * c) / (g - 1)) * (x ** ((g - 1) / (2 * g)) - 1),
      (1 / (k.rho * c)) * x ** (-(g + 1) / (2 * g)),
    ];
  };
  const du = r.u - l.u;
  // The primitive-variable guess, then Newton to a relative change of 10⁻¹⁴.
  let p = Math.max(1e-12, 0.5 * (l.p + r.p) - 0.125 * du * (l.rho + r.rho) * (cl + cr));
  for (let n = 0; n < 100; n++) {
    const [fl, dl] = f(p, l, cl);
    const [fr, dr] = f(p, r, cr);
    const next = Math.max(1e-12, p - (fl + fr + du) / (dl + dr));
    const change = (2 * Math.abs(next - p)) / (next + p);
    p = next;
    if (change < 1e-14) break;
  }
  const pStar = p;
  const uStar = 0.5 * (l.u + r.u) + 0.5 * (f(pStar, r, cr)[0] - f(pStar, l, cl)[0]);
  const g6 = (g - 1) / (g + 1);
  const shockL = pStar > l.p;
  const shockR = pStar > r.p;
  const rhoStarL = shockL
    ? (l.rho * (pStar / l.p + g6)) / (g6 * (pStar / l.p) + 1)
    : l.rho * (pStar / l.p) ** (1 / g);
  const rhoStarR = shockR
    ? (r.rho * (pStar / r.p + g6)) / (g6 * (pStar / r.p) + 1)
    : r.rho * (pStar / r.p) ** (1 / g);
  const speedL = l.u - cl * Math.sqrt(((g + 1) / (2 * g)) * (pStar / l.p) + (g - 1) / (2 * g));
  const speedR = r.u + cr * Math.sqrt(((g + 1) / (2 * g)) * (pStar / r.p) + (g - 1) / (2 * g));
  const headL = l.u - cl;
  const tailL = uStar - cl * (pStar / l.p) ** ((g - 1) / (2 * g));
  const headR = r.u + cr;
  const tailR = uStar + cr * (pStar / r.p) ** ((g - 1) / (2 * g));
  /** The density at s = x/t. */
  const density = (s: number): number => {
    if (s <= uStar) {
      if (shockL) return s <= speedL ? l.rho : rhoStarL;
      if (s <= headL) return l.rho;
      if (s >= tailL) return rhoStarL;
      return l.rho * (2 / (g + 1) + ((g - 1) / ((g + 1) * cl)) * (l.u - s)) ** (2 / (g - 1));
    }
    if (shockR) return s >= speedR ? r.rho : rhoStarR;
    if (s >= headR) return r.rho;
    if (s <= tailR) return rhoStarR;
    return r.rho * (2 / (g + 1) - ((g - 1) / ((g + 1) * cr)) * (r.u - s)) ** (2 / (g - 1));
  };
  const waves = [
    ...(shockL ? [speedL] : [headL, tailL]),
    uStar,
    ...(shockR ? [speedR] : [headR, tailR]),
  ];
  return { pStar, uStar, rhoStarL, rhoStarR, speedR, shockR, waves, density };
}
