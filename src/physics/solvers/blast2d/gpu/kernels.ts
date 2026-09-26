/**
 * The blast solver's compute shaders (rule 1270 of
 * `validation/blastSolverRules.ts`): the reference scheme of `../solver.ts`
 * — fifth-order WENO-Z reconstruction of w, HLLC fluxes, the axisymmetric
 * term, Berberich et al.'s well-balanced gravity, the third-order
 * Runge–Kutta stages and the a posteriori checks — written in WGSL for single
 * precision on the deviations from the atmosphere at rest (rule 1270 (c)).
 *
 * Every cell holds vec4(ρ − ρ̄, ρu, ρv, E − Ē); w holds vec4((ρ − ρ̄)/ρ̄,
 * u, v, (p − p̄)/p̄), ρ̄ = ρ₀α and p̄ = p₀β at the cell's height. The fluxes
 * are the full ones less the background's momentum flux at the face.
 */

export const WORKGROUP = 128;

export const BLAST2D_WGSL = /* wgsl */ `
const G: i32 = 3;
const WG: u32 = ${String(WORKGROUP)}u;

struct Params {
  nr: i32, nz: i32, stride: i32, zero: u32,
  dx: f32, gamma: f32, dt: f32, keepHi: f32,
  keepLo: f32, addHi: f32, addLo: f32, time: f32,
};

@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read_write> U: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> W: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> S: array<vec4<f32>>;
@group(0) @binding(4) var<storage, read_write> T: array<vec4<f32>>;
@group(0) @binding(5) var<storage, read_write> F: array<vec4<f32>>;
@group(0) @binding(6) var<storage, read_write> D: array<vec4<f32>>;
@group(0) @binding(7) var<storage, read_write> K0: array<vec4<f32>>;
@group(0) @binding(8) var<storage, read_write> PRE: array<vec4<f32>>;
@group(0) @binding(9) var<storage, read> ROW: array<vec4<f32>>;
@group(0) @binding(10) var<storage, read> FACE: array<vec4<f32>>;
@group(0) @binding(11) var<storage, read_write> LOW: array<u32>;
@group(0) @binding(12) var<storage, read_write> SPEED: array<f32>;
@group(0) @binding(13) var<storage, read_write> COUNT: array<atomic<u32>>;
@group(0) @binding(14) var<storage, read_write> PEAK: array<vec4<f32>>;
// The low halves of the state and of its copies (rule 1272).
@group(0) @binding(15) var<storage, read_write> ULO: array<vec4<f32>>;
@group(0) @binding(16) var<storage, read_write> K0LO: array<vec4<f32>>;
@group(0) @binding(17) var<storage, read_write> PRELO: array<vec4<f32>>;

fn cell(i: i32, j: i32) -> i32 { return (j + G) * P.stride + (i + G); }

// ---- double-float arithmetic (rule 1272). Every rounding the error-free
//      transformations rely on is made opaque, or the shader compiler folds
//      the error terms away (checked: without it 3 809 sums of 4 096 lost
//      their error, with it none). ----
fn op(x: vec4<f32>) -> vec4<f32> { return bitcast<vec4<f32>>(bitcast<vec4<u32>>(x) ^ vec4<u32>(P.zero)); }
struct DF { hi: vec4<f32>, lo: vec4<f32> };
fn twoSum(a: vec4<f32>, b: vec4<f32>) -> DF {
  let s = op(a + b);
  let bb = op(s - a);
  return DF(s, op(a - op(s - bb)) + op(b - bb));
}
fn quickTwoSum(a: vec4<f32>, b: vec4<f32>) -> DF {
  let s = op(a + b);
  return DF(s, op(b - op(s - a)));
}
fn twoProd(a: vec4<f32>, b: vec4<f32>) -> DF {
  let p = op(a * b);
  return DF(p, fma(a, b, -p));
}
fn dfAdd(x: DF, y: DF) -> DF {
  let s = twoSum(x.hi, y.hi);
  let t = twoSum(x.lo, y.lo);
  let u = quickTwoSum(s.hi, op(s.lo + t.hi));
  return quickTwoSum(u.hi, op(u.lo + t.lo));
}
fn dfMul(x: DF, y: DF) -> DF {
  let p = twoProd(x.hi, y.hi);
  return quickTwoSum(p.hi, fma(x.hi, y.lo, fma(x.lo, y.hi, p.lo)));
}
/** The state the fluxes and checks read: its high half (rule 1272 (a)). */
fn state(k: i32) -> vec4<f32> { return U[k]; }

// The Z-weighted fifth-order value at the face between c and d
// (Shu, ICASE 97-65; Borges et al. 2008). In single precision ε is 1e-20:
// 1e-40 is below the normal range and a flushed zero would divide 0 by 0.
fn weno5z(a: vec4<f32>, b: vec4<f32>, c: vec4<f32>, d: vec4<f32>, e: vec4<f32>) -> vec4<f32> {
  let q0 = (2.0 * a - 7.0 * b + 11.0 * c) / 6.0;
  let q1 = (-b + 5.0 * c + 2.0 * d) / 6.0;
  let q2 = (2.0 * c + 5.0 * d - e) / 6.0;
  let x0 = a - 2.0 * b + c; let y0 = a - 4.0 * b + 3.0 * c;
  let x1 = b - 2.0 * c + d; let y1 = b - d;
  let x2 = c - 2.0 * d + e; let y2 = 3.0 * c - 4.0 * d + e;
  let b0 = (13.0 / 12.0) * x0 * x0 + 0.25 * y0 * y0;
  let b1 = (13.0 / 12.0) * x1 * x1 + 0.25 * y1 * y1;
  let b2 = (13.0 / 12.0) * x2 * x2 + 0.25 * y2 * y2;
  let tau = abs(b0 - b2);
  let w0 = 0.1 * (1.0 + tau / (b0 + 1e-20));
  let w1 = 0.6 * (1.0 + tau / (b1 + 1e-20));
  let w2 = 0.3 * (1.0 + tau / (b2 + 1e-20));
  return (w0 * q0 + w1 * q1 + w2 * q2) / (w0 + w1 + w2);
}

// HLLC (Toro) with Davis's wave speeds: (mass, normal momentum, tangential
// momentum, energy) across a face.
fn hllc(rL: f32, unL: f32, utL: f32, pL: f32, rR: f32, unR: f32, utR: f32, pR: f32) -> vec4<f32> {
  let g = P.gamma;
  let cL = sqrt(g * pL / rL);
  let cR = sqrt(g * pR / rR);
  let eL = pL / (g - 1.0) + 0.5 * rL * (unL * unL + utL * utL);
  let eR = pR / (g - 1.0) + 0.5 * rR * (unR * unR + utR * utR);
  let sL = min(unL - cL, unR - cR);
  let sR = max(unL + cL, unR + cR);
  if (sL >= 0.0) { return vec4<f32>(rL * unL, rL * unL * unL + pL, rL * unL * utL, unL * (eL + pL)); }
  if (sR <= 0.0) { return vec4<f32>(rR * unR, rR * unR * unR + pR, rR * unR * utR, unR * (eR + pR)); }
  let aL = rL * (sL - unL);
  let aR = rR * (sR - unR);
  let sStar = (pR - pL + unL * aL - unR * aR) / (aL - aR);
  // Toro's star states less the side's own, written so that every
  // difference carries (S* − u): algebraically his, and exactly zero at
  // rest in single precision.
  if (sStar >= 0.0) {
    let q = (sStar - unL) / (sL - sStar);
    let f = aL / (sL - sStar);
    return vec4<f32>(
      rL * unL + sL * rL * q,
      rL * unL * unL + pL + sL * rL * sL * q,
      rL * unL * utL + sL * rL * utL * q,
      unL * (eL + pL) + sL * (sStar - unL) * (eL / (sL - sStar) + f * (sStar + pL / aL)));
  }
  let q = (sStar - unR) / (sR - sStar);
  let f = aR / (sR - sStar);
  return vec4<f32>(
    rR * unR + sR * rR * q,
    rR * unR * unR + pR + sR * rR * sR * q,
    rR * unR * utR + sR * rR * utR * q,
    unR * (eR + pR) + sR * (sStar - unR) * (eR / (sR - sStar) + f * (sStar + pR / aR)));
}

// ---- primitives of the interior, and each cell's fastest signal ----
@compute @workgroup_size(WG) fn primitives(@builtin(global_invocation_id) id: vec3<u32>) {
  let n = u32(P.nr * P.nz);
  if (id.x >= n) { return; }
  let i = i32(id.x) % P.nr;
  let j = i32(id.x) / P.nr;
  let k = cell(i, j);
  let bg = ROW[j];
  let q = state(k);
  let rho = bg.x + q.x;
  let u = q.y / rho;
  let v = q.z / rho;
  let pdev = (P.gamma - 1.0) * (q.w - 0.5 * rho * (u * u + v * v));
  let p = bg.y + pdev;
  W[k] = vec4<f32>(q.x / bg.x, u, v, pdev / bg.y);
  let c = sqrt(P.gamma * p / rho);
  SPEED[id.x] = abs(u) + abs(v) + 2.0 * c;
}

// ---- ghosts: the axis reflects, the outer boundary copies (per interior row) ----
@compute @workgroup_size(WG) fn ghostsR(@builtin(global_invocation_id) id: vec3<u32>) {
  let j = i32(id.x);
  if (j >= P.nz) { return; }
  for (var g = 1; g <= G; g++) {
    let inner = W[cell(g - 1, j)];
    W[cell(-g, j)] = vec4<f32>(inner.x, -inner.y, inner.z, inner.w);
    W[cell(P.nr - 1 + g, j)] = W[cell(P.nr - 1, j)];
  }
}

// ---- ghosts: the ground reflects, the top copies (per column, ghosts included) ----
@compute @workgroup_size(WG) fn ghostsZ(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = i32(id.x) - G;
  if (i >= P.nr + G) { return; }
  for (var g = 1; g <= G; g++) {
    let inner = W[cell(i, g - 1)];
    W[cell(i, -g)] = vec4<f32>(inner.x, inner.y, -inner.z, inner.w);
    W[cell(i, P.nz - 1 + g)] = W[cell(i, P.nz - 1)];
  }
}

// ---- WENO faces along r: cells i in [-1, nr], rows j in [0, nz) ----
@compute @workgroup_size(WG) fn reconR(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = P.nr + 2;
  if (id.x >= u32(width * P.nz)) { return; }
  let i = i32(id.x) % width - 1;
  let j = i32(id.x) / width;
  let k = cell(i, j);
  let a = W[k - 2]; let b = W[k - 1]; let c = W[k]; let d = W[k + 1]; let e = W[k + 2];
  S[k] = weno5z(a, b, c, d, e);
  T[k] = weno5z(e, d, c, b, a);
}

// ---- WENO faces along z: columns i in [0, nr), cells j in [-1, nz] ----
@compute @workgroup_size(WG) fn reconZ(@builtin(global_invocation_id) id: vec3<u32>) {
  let height = P.nz + 2;
  if (id.x >= u32(P.nr * height)) { return; }
  let i = i32(id.x) % P.nr;
  let j = i32(id.x) / P.nr - 1;
  let k = cell(i, j);
  let s = P.stride;
  let a = W[k - 2 * s]; let b = W[k - s]; let c = W[k]; let d = W[k + s]; let e = W[k + 2 * s];
  S[k] = weno5z(a, b, c, d, e);
  T[k] = weno5z(e, d, c, b, a);
}

// Whether a face is taken at fifth order: neither side marked, and the
// reconstructed density and pressure positive on both (rules 1262, 1264).
fn high(kl: i32, kr: i32) -> bool {
  if (LOW[kl] != 0u || LOW[kr] != 0u) { return false; }
  let ok = 1.0 + S[kl].x > 0.0 && 1.0 + S[kl].w > 0.0 && 1.0 + T[kr].x > 0.0 && 1.0 + T[kr].w > 0.0;
  if (!ok) { atomicAdd(&COUNT[2], 1u); }
  return ok;
}

// ---- radial fluxes: faces f in [0, nr] of rows j in [0, nz); F[j*(nr+1)+f] ----
@compute @workgroup_size(WG) fn fluxR(@builtin(global_invocation_id) id: vec3<u32>) {
  let width = P.nr + 1;
  if (id.x >= u32(width * P.nz)) { return; }
  let f = i32(id.x) % width;
  let j = i32(id.x) / width;
  let kl = cell(f - 1, j);
  let kr = cell(f, j);
  var l = W[kl];
  var r = W[kr];
  if (high(kl, kr)) { l = S[kl]; r = T[kr]; }
  let bg = ROW[j];
  let fl = hllc(bg.x * (1.0 + l.x), l.y, l.z, bg.y * (1.0 + l.w), bg.x * (1.0 + r.x), r.y, r.z, bg.y * (1.0 + r.w));
  // The background's pressure is the same at every face of the row.
  F[id.x] = vec4<f32>(fl.x, fl.y - bg.y, fl.z, fl.w);
}

// ---- vertical fluxes: faces g in [0, nz] of columns i in [0, nr);
//      F[offset + g*nr + i], offset = (nr+1)*nz ----
@compute @workgroup_size(WG) fn fluxZ(@builtin(global_invocation_id) id: vec3<u32>) {
  let height = P.nz + 1;
  if (id.x >= u32(P.nr * height)) { return; }
  let i = i32(id.x) % P.nr;
  let g = i32(id.x) / P.nr;
  let kl = cell(i, g - 1);
  let kr = cell(i, g);
  var l = W[kl];
  var r = W[kr];
  if (high(kl, kr)) { l = S[kl]; r = T[kr]; }
  let bg = FACE[g];
  // Normal v, tangential u: the flux's momenta swap back.
  let fl = hllc(bg.x * (1.0 + l.x), l.z, l.y, bg.y * (1.0 + l.w), bg.x * (1.0 + r.x), r.z, r.y, bg.y * (1.0 + r.w));
  F[(P.nr + 1) * P.nz + i32(id.x)] = vec4<f32>(fl.x, fl.z, fl.y - bg.y, fl.w);
}

// ---- the right-hand side of every interior cell ----
@compute @workgroup_size(WG) fn rhs(@builtin(global_invocation_id) id: vec3<u32>) {
  let n = u32(P.nr * P.nz);
  if (id.x >= n) { return; }
  let i = i32(id.x) % P.nr;
  let j = i32(id.x) / P.nr;
  let k = cell(i, j);
  let dx = P.dx;
  let rl = f32(i) * dx;
  let rr = f32(i + 1) * dx;
  let rc = (f32(i) + 0.5) * dx;
  let fr = F[j * (P.nr + 1) + i];
  let fr1 = F[j * (P.nr + 1) + i + 1];
  let off = (P.nr + 1) * P.nz;
  let fz = F[off + j * P.nr + i];
  let fz1 = F[off + (j + 1) * P.nr + i];
  var d = -(rr * fr1 - rl * fr) / (rc * dx) - (fz1 - fz) / dx;
  let bg = ROW[j];
  let w = W[k];
  let q = state(k);
  // The axisymmetric term on the deviation of pressure; gravity on the
  // deviation of density through the reference's lift; the energy's source
  // the vertical velocity times the full density's weight.
  d.y += bg.y * w.w / rc;
  d.z += q.x * bg.z;
  d.w += w.z * (bg.x + q.x) * bg.z;
  D[k] = d;
}

// ---- a Runge–Kutta stage: U = keep·K0 + add·(PRE + dt·D) ----
@compute @workgroup_size(WG) fn stage(@builtin(global_invocation_id) id: vec3<u32>) {
  let n = u32(P.nr * P.nz);
  if (id.x >= n) { return; }
  let k = cell(i32(id.x) % P.nr, i32(id.x) / P.nr);
  let step = dfAdd(DF(PRE[k], PRELO[k]), twoProd(vec4<f32>(P.dt), D[k]));
  let keep = dfMul(DF(K0[k], K0LO[k]), DF(vec4<f32>(P.keepHi), vec4<f32>(P.keepLo)));
  let u = dfAdd(keep, dfMul(step, DF(vec4<f32>(P.addHi), vec4<f32>(P.addLo))));
  U[k] = u.hi;
  ULO[k] = u.lo;
}

// ---- rule 1264: mark every unsound cell; count the new marks and the
//      cells that stay unsound though already marked ----
@compute @workgroup_size(WG) fn check(@builtin(global_invocation_id) id: vec3<u32>) {
  let n = u32(P.nr * P.nz);
  if (id.x >= n) { return; }
  let j = i32(id.x) / P.nr;
  let k = cell(i32(id.x) % P.nr, j);
  let bg = ROW[j];
  let q = state(k);
  let rho = bg.x + q.x;
  let p = bg.y + (P.gamma - 1.0) * (q.w - 0.5 * (q.y * q.y + q.z * q.z) / rho);
  let sound = rho > 0.0 && p > 0.0 && rho < 3.0e38 && p < 3.0e38;
  if (!sound) {
    if (LOW[k] == 0u) { LOW[k] = 1u; atomicAdd(&COUNT[0], 1u); }
    else { atomicAdd(&COUNT[1], 1u); }
  }
}

// ---- rule 1272's check of the error-free sum and product: pairs (a, b) in
//      S, results (sum, its error, product, its error) in T ----
@compute @workgroup_size(WG) fn dfCheck(@builtin(global_invocation_id) id: vec3<u32>) {
  let m = min(4096u, arrayLength(&T) / 4u);
  if (id.x >= m) { return; }
  let a = S[2u * id.x];
  let b = S[2u * id.x + 1u];
  let s = twoSum(a, b);
  let p = twoProd(a, b);
  T[4u * id.x] = s.hi;
  T[4u * id.x + 1u] = s.lo;
  T[4u * id.x + 2u] = p.hi;
  T[4u * id.x + 3u] = p.lo;
}

// ---- the ground's peaks: overpressure p − p̄ of the first row ----
@compute @workgroup_size(WG) fn peaks(@builtin(global_invocation_id) id: vec3<u32>) {
  let i = i32(id.x);
  if (i >= P.nr) { return; }
  let bg = ROW[0];
  let k = cell(i, 0);
  let q = state(k);
  let rho = bg.x + q.x;
  let over = (P.gamma - 1.0) * (q.w - 0.5 * (q.y * q.y + q.z * q.z) / rho);
  // (peak, its time, the overpressure now, 0)
  let old = PEAK[i];
  if (over > old.x) { PEAK[i] = vec4<f32>(over, P.time, over, 0.0); }
  else { PEAK[i] = vec4<f32>(old.x, old.y, over, 0.0); }
}

// ---- the largest signal speed: one partial maximum per workgroup ----
var<workgroup> scratch: array<f32, WG>;
@compute @workgroup_size(WG) fn reduceMax(@builtin(global_invocation_id) id: vec3<u32>,
    @builtin(local_invocation_id) lid: vec3<u32>, @builtin(workgroup_id) wid: vec3<u32>) {
  let n = u32(P.nr * P.nz);
  var v = 0.0;
  if (id.x < n) { v = SPEED[id.x]; }
  scratch[lid.x] = v;
  workgroupBarrier();
  var step = WG / 2u;
  loop {
    if (step == 0u) { break; }
    if (lid.x < step) { scratch[lid.x] = max(scratch[lid.x], scratch[lid.x + step]); }
    workgroupBarrier();
    step = step / 2u;
  }
  if (lid.x == 0u) { SPEED[n + wid.x] = scratch[0]; }
}
`;
