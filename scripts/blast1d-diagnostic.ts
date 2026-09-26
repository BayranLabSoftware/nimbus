/**
 * A diagnostic, not a test (rules 1261 (c) and 1262 (b) of
 * `src/physics/validation/blastSolverRules.ts`): the blast solver's schemes in
 * one spherical dimension — a free-air burst of 1 kt in a 45 m sphere at sea
 * level — to see how the peak overpressure at a distance converges with the
 * cell. The same HLLC flux; the reconstruction either second order with van
 * Leer's limiter and the second-order Runge–Kutta (the solver before rule
 * 1262), or fifth-order WENO with Z weights and the third-order one (after).
 * Prints the peak (kPa) at 0.5, 1, 1.5 and 2 km.
 *
 *   pnpm exec tsx scripts/blast1d-diagnostic.ts <cell m> [vanleer | weno]
 *       [fine cell m] [fine out to m]
 */

export {};

const GAMMA = 1.4;
const RHO = 1.225;
const P = 101_325;
const E = 4.184e12;
const SOURCE = 45;
const L = 2_600;
const G = 3;

const dx = Number(process.argv[2] ?? 5);
const scheme = process.argv[3] === 'weno' ? 'weno' : 'vanleer';
const fine = Number(process.argv[4] ?? dx);
const fineTo = Number(process.argv[5] ?? 0);

// Faces: `fine` out to `fineTo`, then growing by 5 % a cell up to `dx`.
const faces: number[] = [0];
for (let r = 0; r < L; ) {
  const prev = faces.length > 1 ? r - (faces[faces.length - 2] ?? 0) : fine;
  r += r < fineTo ? fine : Math.min(dx, prev * 1.05);
  faces.push(r);
}
const n = faces.length - 1;
const N = n + 2 * G;
const face = (i: number): number => {
  const k = i - G;
  return k <= 0 ? k * fine : k >= n ? (faces[n] ?? 0) + (k - n) * dx : (faces[k] ?? 0);
};
const volume = (i: number): number => (4 / 3) * Math.PI * (face(i + 1) ** 3 - face(i) ** 3);

const U = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const K = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const D = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const W = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const up = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const down = [new Float64Array(N), new Float64Array(N), new Float64Array(N)];
const [rho, mom, en] = U as [Float64Array, Float64Array, Float64Array];
const peak = new Float64Array(N);

let inside = 0;
for (let i = G; i < n + G; i++) {
  const b = Math.min(face(i + 1), SOURCE);
  if (b > face(i)) inside += (4 / 3) * Math.PI * (b ** 3 - face(i) ** 3);
}
for (let i = G; i < n + G; i++) {
  rho[i] = RHO;
  en[i] = P / (GAMMA - 1);
  const b = Math.min(face(i + 1), SOURCE);
  if (b > face(i))
    en[i] = (en[i] ?? 0) + ((E / inside) * (4 / 3) * Math.PI * (b ** 3 - face(i) ** 3)) / volume(i);
}

function weno5z(a: number, b: number, c: number, d: number, e: number): number {
  const q0 = (2 * a - 7 * b + 11 * c) / 6;
  const q1 = (-b + 5 * c + 2 * d) / 6;
  const q2 = (2 * c + 5 * d - e) / 6;
  const b0 = (13 / 12) * (a - 2 * b + c) ** 2 + 0.25 * (a - 4 * b + 3 * c) ** 2;
  const b1 = (13 / 12) * (b - 2 * c + d) ** 2 + 0.25 * (b - d) ** 2;
  const b2 = (13 / 12) * (c - 2 * d + e) ** 2 + 0.25 * (3 * c - 4 * d + e) ** 2;
  const tau = Math.abs(b0 - b2);
  const w0 = 0.1 * (1 + tau / (b0 + 1e-40));
  const w1 = 0.6 * (1 + tau / (b1 + 1e-40));
  const w2 = 0.3 * (1 + tau / (b2 + 1e-40));
  return (w0 * q0 + w1 * q1 + w2 * q2) / (w0 + w1 + w2);
}
const vanLeer = (a: number, b: number): number => (a * b > 0 ? (2 * a * b) / (a + b) : 0);

const flux = [0, 0, 0];
function hllc(rL: number, uL: number, pL: number, rR: number, uR: number, pR: number): void {
  const cL = Math.sqrt((GAMMA * pL) / rL);
  const cR = Math.sqrt((GAMMA * pR) / rR);
  const eL = pL / (GAMMA - 1) + 0.5 * rL * uL * uL;
  const eR = pR / (GAMMA - 1) + 0.5 * rR * uR * uR;
  const sL = Math.min(uL - cL, uR - cR);
  const sR = Math.max(uL + cL, uR + cR);
  if (sL >= 0) {
    flux[0] = rL * uL;
    flux[1] = rL * uL * uL + pL;
    flux[2] = uL * (eL + pL);
    return;
  }
  if (sR <= 0) {
    flux[0] = rR * uR;
    flux[1] = rR * uR * uR + pR;
    flux[2] = uR * (eR + pR);
    return;
  }
  const aL = rL * (sL - uL);
  const aR = rR * (sR - uR);
  const s = (pR - pL + uL * aL - uR * aR) / (aL - aR);
  const [r, u, p, e, sK, a] = s >= 0 ? [rL, uL, pL, eL, sL, aL] : [rR, uR, pR, eR, sR, aR];
  const f = a / (sK - s);
  flux[0] = r * u + sK * (f - r);
  flux[1] = r * u * u + p + sK * (f * s - r * u);
  flux[2] = u * (e + p) + sK * (f * (e / r + (s - u) * (s + p / a)) - e);
}

function rhs(): number {
  let fastest = 0;
  const [wr, wu, wp] = W as [Float64Array, Float64Array, Float64Array];
  for (let i = G; i < n + G; i++) {
    const r = rho[i] ?? 0;
    const u = (mom[i] ?? 0) / r;
    const p = (GAMMA - 1) * ((en[i] ?? 0) - 0.5 * r * u * u);
    wr[i] = r;
    wu[i] = u;
    wp[i] = p;
    fastest = Math.max(fastest, Math.abs(u) + Math.sqrt((GAMMA * p) / r));
  }
  for (let g = 1; g <= G; g++) {
    wr[G - g] = wr[G + g - 1] ?? 0;
    wu[G - g] = -(wu[G + g - 1] ?? 0);
    wp[G - g] = wp[G + g - 1] ?? 0;
    for (const w of W) w[n + G - 1 + g] = w[n + G - 1] ?? 0;
  }
  for (let q = 0; q < 3; q++) {
    const w = W[q] as Float64Array;
    const hi = up[q] as Float64Array;
    const lo = down[q] as Float64Array;
    for (let i = 2; i < N - 2; i++) {
      const c = w[i] ?? 0;
      if (scheme === 'weno') {
        const a = w[i - 2] ?? 0;
        const b = w[i - 1] ?? 0;
        const d = w[i + 1] ?? 0;
        const e = w[i + 2] ?? 0;
        hi[i] = weno5z(a, b, c, d, e);
        lo[i] = weno5z(e, d, c, b, a);
      } else {
        const s = vanLeer(c - (w[i - 1] ?? 0), (w[i + 1] ?? 0) - c);
        hi[i] = c + 0.5 * s;
        lo[i] = c - 0.5 * s;
      }
    }
  }
  for (const d of D) d.fill(0);
  const [ur, uu, up2] = up as [Float64Array, Float64Array, Float64Array];
  const [dr, du, dp] = down as [Float64Array, Float64Array, Float64Array];
  for (let f = G; f <= n + G; f++) {
    const l = f - 1;
    const r = f;
    const ok = (ur[l] ?? 0) > 0 && (up2[l] ?? 0) > 0 && (dr[r] ?? 0) > 0 && (dp[r] ?? 0) > 0;
    if (ok) hllc(ur[l] ?? 0, uu[l] ?? 0, up2[l] ?? 0, dr[r] ?? 0, du[r] ?? 0, dp[r] ?? 0);
    else hllc(wr[l] ?? 0, wu[l] ?? 0, wp[l] ?? 0, wr[r] ?? 0, wu[r] ?? 0, wp[r] ?? 0);
    const area = 4 * Math.PI * face(f) ** 2;
    for (let q = 0; q < 3; q++) {
      const d = D[q] as Float64Array;
      const F = (flux[q] ?? 0) * area;
      if (l >= G) d[l] = (d[l] ?? 0) - F / volume(l);
      if (r < n + G) d[r] = (d[r] ?? 0) + F / volume(r);
    }
  }
  const dm = D[1] as Float64Array;
  for (let i = G; i < n + G; i++)
    dm[i] =
      (dm[i] ?? 0) + ((wp[i] ?? 0) * 4 * Math.PI * (face(i + 1) ** 2 - face(i) ** 2)) / volume(i);
  return fastest;
}

const index = (r: number): number => {
  let i = G;
  while (face(i + 1) < r) i++;
  return i;
};
const last = index(2_500);
const stages: [number, number][] =
  scheme === 'weno'
    ? [
        [0, 1],
        [0.75, 0.25],
        [1 / 3, 2 / 3],
      ]
    : [
        [0, 1],
        [0.5, 0.5],
      ];
let steps = 0;
for (;;) {
  let dt = 0;
  for (let q = 0; q < 3; q++) (K[q] as Float64Array).set(U[q] as Float64Array);
  for (const [s, [keep, add]] of stages.entries()) {
    const fastest = rhs();
    if (s === 0) dt = (0.4 * Math.min(dx, fine)) / fastest;
    for (let q = 0; q < 3; q++) {
      const u = U[q] as Float64Array;
      const k0 = K[q] as Float64Array;
      const d = D[q] as Float64Array;
      for (let i = G; i < n + G; i++)
        u[i] = keep * (k0[i] ?? 0) + add * ((u[i] ?? 0) + dt * (d[i] ?? 0));
    }
  }
  steps++;
  for (let i = G; i < n + G; i++) {
    const r = rho[i] ?? 0;
    const u = (mom[i] ?? 0) / r;
    const over = (GAMMA - 1) * ((en[i] ?? 0) - 0.5 * r * u * u) - P;
    if (over > (peak[i] ?? 0)) peak[i] = over;
  }
  const r = rho[last] ?? 0;
  const u = (mom[last] ?? 0) / r;
  const over = (GAMMA - 1) * ((en[last] ?? 0) - 0.5 * r * u * u) - P;
  if ((peak[last] ?? 0) > 1e-4 * P && over < (peak[last] ?? 0) / 3) break;
}
const at = (r: number): string => ((peak[index(r)] ?? 0) / 1_000).toFixed(3);
console.log(
  `${scheme} cell ${String(dx)} m (fine ${String(fine)} m to ${String(fineTo)} m): ${String(steps)} steps; ` +
    `free-air peak (kPa) at 0.5/1/1.5/2 km: ${at(500)} ${at(1_000)} ${at(1_500)} ${at(2_000)}`
);
