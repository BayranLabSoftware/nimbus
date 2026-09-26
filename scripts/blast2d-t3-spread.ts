/**
 * Rule 1273 (d)(2) (`src/physics/validation/blastSolverRules.ts`): how well
 * the reference determines itself. T3's case at 0.048 km scaled on its coarse
 * grid, to a fixed end of 700 s, the source's energy moved by amounts from
 * one unit in the last place to 10⁻⁹, either way; the GPU's run of the same
 * case beside them. With BLAST2D_LIMITER=has, the same on rule 1277's
 * limiter (its criterion (e)(2)), and no GPU run: the GPU is not written to it
 * yet.
 *
 *   pnpm exec tsx scripts/blast2d-t3-spread.ts
 *   BLAST2D_LIMITER=has pnpm exec tsx scripts/blast2d-t3-spread.ts
 *
 * Writes src/physics/validation/blast2dT3Spread.json (.has.json with the
 * limiter; each CPU run is kept in scripts/tmp/blast2d-spread, keyed to the
 * solver's code and the limiter).
 */

import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BlastSolver2D } from '../src/physics/solvers/blast2d/solver.js';
import { atmosphereOf, type BlastCase, type BlastRun } from './blast2d-run.js';

const G = 9.80665;
const P0 = 101_325;
const SCALE = Math.cbrt(250e3);
const H = 40_000 / Math.log(1 / 2.7e-3);
const T_END = 700;
/** T3's case at 0.0476 km scaled, 20 m scaled cells (as `blast2d-t3-aftosmis.ts` builds it). */
const CASE: BlastCase = {
  atmosphere: { kind: 'isothermal', rho0: P0 / (G * H), p0: P0, g: G },
  energy: 250e6 * 4.184e9,
  height: 0.0476 * 1_000 * SCALE,
  radius: 500,
  dx: 20 * SCALE,
  rMax: 3.1 * 1_000 * SCALE,
  zMax: 1.6 * 1_000 * SCALE,
};
const ULP = 2 ** -52;
const MOVES = [0, ULP, -ULP, 1e-15, 1e-14, 1e-13, 1e-12, -1e-12, 1e-11, 1e-10, 1e-9];
const LIMITER = process.env.BLAST2D_LIMITER === 'has' ? 'has' : undefined;

interface Member {
  move: number;
  steps: number;
  fallbacks: number;
  peaks: number[];
}

function runOne(move: number): Member {
  const nr = Math.ceil((1.15 * CASE.rMax) / CASE.dx);
  const nz = Math.ceil(CASE.zMax / CASE.dx);
  const s = new BlastSolver2D(
    { nr, nz, dx: CASE.dx },
    atmosphereOf(CASE),
    LIMITER === undefined ? {} : { limiter: LIMITER }
  );
  s.deposit({ energy: CASE.energy * (1 + move), height: CASE.height, radius: CASE.radius });
  while (s.time < T_END) s.step(T_END - s.time);
  return {
    move,
    steps: s.steps,
    fallbacks: LIMITER === undefined ? s.fallbacks : s.limitedFaces,
    peaks: Array.from(s.groundPeak),
  };
}

if (process.argv[2] === 'one') {
  writeFileSync(process.argv[4] ?? '', `${JSON.stringify(runOne(Number(process.argv[3])))}\n`);
} else if (process.argv[1]?.endsWith('blast2d-t3-spread.ts')) {
  const code = [
    'src/physics/solvers/blast2d/solver.ts',
    'src/physics/solvers/blast2d/atmosphere.ts',
  ]
    .map((f) => readFileSync(f, 'utf8'))
    .join('\n');
  const tag = `${createHash('sha256').update(code).digest('hex').slice(0, 12)}${LIMITER === undefined ? '' : `-${LIMITER}`}`;
  const dir = 'scripts/tmp/blast2d-spread';
  mkdirSync(dir, { recursive: true });
  const fileOf = (move: number): string => join(dir, `${tag}-${String(move)}.json`);
  let next = 0;
  const worker = async (): Promise<void> => {
    for (;;) {
      const move = MOVES[next++];
      if (move === undefined) return;
      if (existsSync(fileOf(move))) continue;
      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          'pnpm',
          ['exec', 'tsx', 'scripts/blast2d-t3-spread.ts', 'one', String(move), fileOf(move)],
          { stdio: ['ignore', 'ignore', 'inherit'] }
        );
        child.on('error', reject);
        child.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`move ${String(move)}`))));
      });
      console.log(`move ${String(move)} done`);
    }
  };
  await Promise.all([worker(), worker(), worker(), worker()]);
  const members = MOVES.map((m) => JSON.parse(readFileSync(fileOf(m), 'utf8')) as Member);
  let gpu: (BlastRun & { fallbacks: number }) | undefined;
  if (LIMITER === undefined) {
    const { withGpuPage } = await import('./blast2d-gpu.js');
    gpu = (await withGpuPage((page) =>
      page.evaluate(async ([c, t]) => window.blast2dGpu?.runCaseGpu(c as never, t), [
        CASE as unknown,
        T_END,
      ] as const)
    )) as unknown as BlastRun & { fallbacks: number };
  }

  const base = members[0];
  if (base === undefined) throw new Error('no base run');
  const last = Math.min(base.peaks.length - 1, Math.floor(CASE.rMax / CASE.dx));
  const rows = [];
  let worstMember = 0;
  let widest = 0;
  let gpuWorst = 0;
  let gpuOutside = { by: 0, km: 0 };
  for (let i = 0; i <= last; i++) {
    const a = base.peaks[i] ?? 0;
    const values = members.map((m) => m.peaks[i] ?? 0);
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const g = gpu === undefined ? null : (gpu.peaks[i] ?? 0);
    const km = ((i + 0.5) * CASE.dx) / 1_000;
    rows.push({ km, base: a, min: lo, max: hi, gpu: g });
    if (a <= 1_000) continue;
    worstMember = Math.max(worstMember, ...values.map((v) => Math.abs(v / a - 1)));
    widest = Math.max(widest, (hi - lo) / a);
    if (g === null) continue;
    gpuWorst = Math.max(gpuWorst, Math.abs(g / a - 1));
    const out = Math.max(lo - g, g - hi, 0) / a;
    if (out > gpuOutside.by) gpuOutside = { by: out, km };
  }
  const summary = {
    rule: LIMITER === undefined ? '1273 (d)(2)' : '1277 (e)(2)',
    limiter: LIMITER ?? 'mood',
    case: CASE,
    tEnd: T_END,
    // With the limiter, «fallbacks» counts the faces blended (θ < 1).
    members: members.map((m) => ({ move: m.move, steps: m.steps, fallbacks: m.fallbacks })),
    gpu: gpu === undefined ? null : { steps: gpu.steps, fallbacks: gpu.fallbacks },
    worstMemberAgainstBase: worstMember,
    widestSpread: widest,
    gpuWorstAgainstBase: gpuWorst,
    gpuFarthestOutside: gpuOutside,
    rows,
  };
  writeFileSync(
    `src/physics/validation/blast2dT3Spread${LIMITER === undefined ? '' : `.${LIMITER}`}.json`,
    `${JSON.stringify(summary, null, 1)}\n`
  );
  console.log(
    `worst member ${(100 * worstMember).toFixed(2)} %, widest spread ${(100 * widest).toFixed(2)} %, ` +
      (gpu === undefined
        ? 'no GPU run'
        : `GPU ${(100 * gpuWorst).toFixed(2)} % against the base, outside the spread by ${(100 * gpuOutside.by).toFixed(3)} % at ${gpuOutside.km.toFixed(1)} km`)
  );
}
