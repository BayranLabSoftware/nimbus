/**
 * Rule 1334 (c) V6: the exact solution of the Riemann problem for a gas with
 * a general equation of state p(e, ρ), c²(e, ρ) — written from the
 * publications (Colella & Glaz 1985, J. Comput. Phys. 59, 264; Menikoff &
 * Plohr 1989, Rev. Mod. Phys. 61, 75; Quartapelle et al. 2003, J. Comput.
 * Phys. 190, 118) and sharing nothing with the scheme but the equation of
 * state it is given.
 *
 * - A shock on side K (p* > p_K): the Hugoniot e = e_K − ½(p* + p_K)(v − v_K)
 *   solved with p(e, 1/v) = p* for v by Illinois' regula falsi; the mass
 *   flux m = √((p* − p_K)/(v_K − v)), u* = u_K ∓ m(v_K − v), the shock's
 *   speed u_K ∓ m v_K (− on the left).
 * - A rarefaction (p* ≤ p_K): the isentrope de/dv = −p integrated by RK4 in
 *   s = ln v, with du/ds = ±c (+ on the left), to p = p*, the last step cut
 *   by bisection of its length.
 * - p* where u*_L(p*) = u*_R(p*), by Illinois in ln p; a fan's state at
 *   x/t where u ∓ c = x/t along the isentrope, found the same way.
 */

export interface Eos {
  /** Pressure (Pa) at specific internal energy e (J/kg) and density ρ. */
  p(e: number, rho: number): number;
  /** Sound speed squared (m²/s²). */
  c2(e: number, rho: number): number;
}

export interface State {
  rho: number;
  u: number;
  p: number;
  e: number;
}

/** Illinois' regula falsi on a bracket [a, b] with f(a)·f(b) < 0. */
function illinois(f: (x: number) => number, a0: number, b0: number, tol: number): number {
  let a = a0;
  let b = b0;
  let fa = f(a);
  let fb = f(b);
  if (!(fa * fb < 0)) throw new Error(`riemann: no bracket (${String(fa)}, ${String(fb)})`);
  let side = 0;
  for (let n = 0; n < 400; n++) {
    const c = (a * fb - b * fa) / (fb - fa);
    const fc = f(c);
    if (fc === 0 || Math.abs(b - a) <= tol * Math.max(Math.abs(a), Math.abs(b))) return c;
    if (fc * fb < 0) {
      a = b;
      fa = fb;
      b = c;
      fb = fc;
      side = 0;
    } else {
      b = c;
      fb = fc;
      if (side === 1) fa /= 2;
      side = 1;
    }
  }
  return 0.5 * (a + b);
}

interface Wave {
  /** The star state on this side. */
  star: State;
  shock: boolean;
  /** A shock's speed; a fan's head and tail speeds. */
  speed: number;
  head: number;
  tail: number;
}

/** Side K's wave for a given p*; sign −1 on the left, +1 on the right. */
function wave(eos: Eos, k: State, pStar: number, sign: -1 | 1, ds: number): Wave {
  const vK = 1 / k.rho;
  if (pStar > k.p) {
    const eOf = (v: number): number => k.e - 0.5 * (pStar + k.p) * (v - vK);
    const g = (v: number): number => eos.p(eOf(v), 1 / v) - pStar;
    let lo = vK / 2;
    while (!(g(lo) > 0)) {
      lo /= 2;
      if (lo < vK * 1e-6) throw new Error('riemann: no compression reaches p*');
    }
    const v = illinois(g, lo, vK, 1e-15);
    const m = Math.sqrt((pStar - k.p) / (vK - v));
    const u = k.u + sign * m * (vK - v);
    const speed = k.u + sign * m * vK;
    return {
      star: { rho: 1 / v, u, p: pStar, e: eOf(v) },
      shock: true,
      speed,
      head: speed,
      tail: speed,
    };
  }
  const end = isentrope(eos, k, sign, ds, (st) => st.p - pStar);
  const cK = Math.sqrt(eos.c2(k.e, k.rho));
  const cS = Math.sqrt(eos.c2(end.e, end.rho));
  return {
    star: end,
    shock: false,
    speed: NaN,
    head: k.u + sign * cK,
    tail: end.u + sign * cS,
  };
}

/**
 * The isentrope from K in s = ln v, RK4 with step ds, until stop(state)
 * first changes sign (from positive), that step cut by bisection of its
 * length to 10⁻¹⁵.
 */
export function isentrope(
  eos: Eos,
  k: State,
  sign: -1 | 1,
  ds: number,
  stop: (st: State) => number,
  path?: { s: number; e: number; u: number }[]
): State {
  const rhs = (s: number, e: number): [number, number] => {
    const v = Math.exp(s);
    const rho = 1 / v;
    return [-eos.p(e, rho) * v, -sign * Math.sqrt(eos.c2(e, rho))];
  };
  const advance = (s: number, e: number, u: number, h: number): [number, number] => {
    const [a1, b1] = rhs(s, e);
    const [a2, b2] = rhs(s + h / 2, e + (h / 2) * a1);
    const [a3, b3] = rhs(s + h / 2, e + (h / 2) * a2);
    const [a4, b4] = rhs(s + h, e + h * a3);
    return [e + (h / 6) * (a1 + 2 * a2 + 2 * a3 + a4), u + (h / 6) * (b1 + 2 * b2 + 2 * b3 + b4)];
  };
  const at = (s: number, e: number, u: number): State => {
    const rho = Math.exp(-s);
    return { rho, u, p: eos.p(e, rho), e };
  };
  let s = Math.log(1 / k.rho);
  let e = k.e;
  let u = k.u;
  path?.push({ s, e, u });
  if (!(stop(at(s, e, u)) > 0)) return at(s, e, u);
  for (let n = 0; n < 2_000_000; n++) {
    const [e1, u1] = advance(s, e, u, ds);
    if (stop(at(s + ds, e1, u1)) > 0) {
      s += ds;
      e = e1;
      u = u1;
      path?.push({ s, e, u });
      continue;
    }
    // The zero lies within this step: bisect its length.
    let lo = 0;
    let hi = ds;
    for (let b = 0; b < 200 && hi - lo > 1e-15 * Math.max(1, Math.abs(s)); b++) {
      const mid = 0.5 * (lo + hi);
      const [em, um] = advance(s, e, u, mid);
      if (stop(at(s + mid, em, um)) > 0) lo = mid;
      else hi = mid;
    }
    const [ef, uf] = advance(s, e, u, hi);
    return at(s + hi, ef, uf);
  }
  throw new Error('riemann: the isentrope never reached its end');
}

export interface Solution {
  pStar: number;
  uStar: number;
  left: Wave;
  right: Wave;
  /** The state at ξ = x/t. */
  sample(xi: number): State;
  /** The waves' speeds, in order (for splitting integrals). */
  speeds: number[];
}

/** The exact solution; ds the isentropes' RK4 step in ln v. */
export function exactRiemann(eos: Eos, l: State, r: State, ds = 1e-3): Solution {
  const f = (lnp: number): number => {
    const p = Math.exp(lnp);
    return wave(eos, r, p, 1, ds).star.u - wave(eos, l, p, -1, ds).star.u;
  };
  const lo = Math.log(1e-6 * Math.min(l.p, r.p));
  const hi = Math.log(1e4 * Math.max(l.p, r.p));
  const pStar = Math.exp(illinois(f, lo, hi, 1e-16));
  const left = wave(eos, l, pStar, -1, ds);
  const right = wave(eos, r, pStar, 1, ds);
  const uStar = 0.5 * (left.star.u + right.star.u);
  // A fan's isentrope recorded once, step by step; a sample restarts from
  // the last recorded point before its ξ and integrates only that step.
  const record = (k: State, sign: -1 | 1): { s: number; e: number; u: number }[] => {
    const path: { s: number; e: number; u: number }[] = [];
    isentrope(eos, k, sign, ds, (st) => st.p - pStar, path);
    return path;
  };
  const paths = {
    left: left.shock ? [] : record(l, -1),
    right: right.shock ? [] : record(r, 1),
  };
  const fan = (k: State, sign: -1 | 1, xi: number): State => {
    const path = sign === -1 ? paths.left : paths.right;
    const lambda = (p: { s: number; e: number; u: number }): number =>
      p.u + sign * Math.sqrt(eos.c2(p.e, Math.exp(-p.s)));
    const beyond = (p: { s: number; e: number; u: number }): boolean =>
      sign === -1 ? lambda(p) >= xi : lambda(p) <= xi;
    let lo = 0;
    let hi = path.length - 1;
    const last = path[hi];
    if (last === undefined || !beyond(last)) hi = path.length;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      const pm = path[mid];
      if (pm !== undefined && beyond(pm)) hi = mid;
      else lo = mid;
    }
    const start = path[lo] ?? { s: Math.log(1 / k.rho), e: k.e, u: k.u };
    const from: State = {
      rho: Math.exp(-start.s),
      u: start.u,
      p: eos.p(start.e, Math.exp(-start.s)),
      e: start.e,
    };
    return isentrope(eos, from, sign, ds, (st) => {
      const lam = st.u + sign * Math.sqrt(eos.c2(st.e, st.rho));
      return sign === -1 ? xi - lam : lam - xi;
    });
  };
  const sample = (xi: number): State => {
    if (xi <= uStar) {
      if (left.shock) return xi <= left.speed ? l : left.star;
      if (xi <= left.head) return l;
      if (xi >= left.tail) return left.star;
      return fan(l, -1, xi);
    }
    if (right.shock) return xi >= right.speed ? r : right.star;
    if (xi >= right.head) return r;
    if (xi <= right.tail) return right.star;
    return fan(r, 1, xi);
  };
  const speeds = [
    ...(left.shock ? [left.speed] : [left.head, left.tail]),
    uStar,
    ...(right.shock ? [right.speed] : [right.head, right.tail]),
  ];
  return { pStar, uStar, left, right, sample, speeds };
}
