/**
 * Rules 1352 (b) and 1355 (`src/physics/validation/blastSolverRules.ts`): real
 * air on the GPU, its checks.
 *   G0 — air at rest (uniform and isothermal, real air) stays at rest: the
 *        largest speed after 200 steps exactly 0.
 *   G2 — T2's 1 kt hot hemisphere in real air, 200 steps: mass kept to 10⁻⁶
 *        of the domain's, the source's energy to 10⁻⁴ (no wave has left).
 *   G1 — the same case on the CPU (the table) and on the GPU, same grid:
 *        T2's 1 kt at the ground (45 m, 20 m cells, uniform air, 1 km) and
 *        T4's 5 Mt static at 14 km (its coarse grid, 342 m, the isothermal
 *        atmosphere, 50.4 km): every reach at 1, 2, 4 and 10 psi within
 *        0.5 %, the ground's peak within 1 % wherever above 1 kPa.
 *
 *   pnpm exec tsx scripts/verify-blast-gpu-air.ts
 *
 * Writes src/physics/validation/verifyBlastGpuAir.json.
 */

import { writeFileSync } from 'node:fs';
import { withGpuPage } from './blast2d-gpu.js';
import { reachOf, runCase, type BlastCase, type BlastRun } from './blast2d-run.js';

const P0 = 101_325;
const RHO0 = 1.225;
const G = 9.80665;
const uniform = { kind: 'uniform', rho0: RHO0, p0: P0 } as const;
const isothermal = { kind: 'isothermal', rho0: RHO0, p0: P0, g: G } as const;
const PSI = 6_894.757;

const t2: BlastCase = {
  atmosphere: uniform,
  energy: 4.184e12,
  height: 0,
  radius: 45,
  dx: 20,
  rMax: 1_000,
  zMax: 800,
  soundFloor: 1.1,
  limiter: 'has',
  eos: 'air',
};
const H = P0 / (RHO0 * G);
const E5 = 5e3 * 4.184e12;
const rho14 = RHO0 * Math.exp(-14_000 / H);
const t4: BlastCase = {
  atmosphere: isothermal,
  energy: E5,
  height: 14_000,
  // Collins et al.'s 8.968 MJ/kg at the burst's density (T4's static source).
  radius: Math.cbrt((3 * (E5 / 8.968e6)) / (4 * Math.PI * rho14)),
  dx: 20 * Math.cbrt(5e3),
  rMax: 50_400,
  zMax: 34_000,
  soundFloor: 1.1,
  limiter: 'has',
  eos: 'air',
};

const result = await withGpuPage(async (page) => {
  const rest = async (atmosphere: unknown): Promise<number> => {
    const c = { ...t2, atmosphere, energy: 1 };
    const out = (await page.evaluate(
      async ([cc, s]) => window.blast2dGpu?.restCheck(cc as never, s),
      [c, 200] as const
    )) as unknown as { maxSpeed: number };
    return out.maxSpeed;
  };
  const g0 = { uniform: await rest(uniform), isothermal: await rest(isothermal) };
  const g2 = (await page.evaluate(
    async ([cc, s]) => window.blast2dGpu?.conservationCheck(cc as never, s),
    [t2, 200] as const
  )) as unknown as { massChange: number; energyChange: number };
  const gpu = async (c: BlastCase): Promise<BlastRun & { newtonResiduals?: number }> =>
    (await page.evaluate(async (cc) => window.blast2dGpu?.runCaseGpu(cc as never), c)) as never;
  return { g0, g2, gpuT2: await gpu(t2), gpuT4: await gpu(t4) };
});

function compare(
  cpu: BlastRun,
  gpu: BlastRun
): { reaches: number; peaks: number; passes: boolean } {
  let reaches = 0;
  for (const psi of [1, 2, 4, 10]) {
    const a = reachOf(cpu, psi * PSI);
    const b = reachOf(gpu, psi * PSI);
    if (a > 0 || b > 0) reaches = Math.max(reaches, Math.abs(b / a - 1));
  }
  let peaks = 0;
  for (const [i, pa] of cpu.peaks.entries()) {
    const pb = gpu.peaks[i] ?? NaN;
    if (pa > 1_000) peaks = Math.max(peaks, Math.abs(pb / pa - 1));
  }
  return { reaches, peaks, passes: reaches <= 0.005 && peaks <= 0.01 };
}
const cpuT2 = runCase(t2);
const cpuT4 = runCase(t4);
const g1 = { t2: compare(cpuT2, result.gpuT2), t4: compare(cpuT4, result.gpuT4) };
const g0Pass = result.g0.uniform === 0 && result.g0.isothermal === 0;
const g2Pass = Math.abs(result.g2.massChange) <= 1e-6 && Math.abs(result.g2.energyChange) <= 1e-4;
const g1Pass = g1.t2.passes && g1.t4.passes;
console.log(
  `G0 real air at rest: largest speed ${String(result.g0.uniform)} (uniform), ${String(result.g0.isothermal)} (isothermal) — ${g0Pass ? 'PASSES' : 'FAILS'}`
);
console.log(
  `G2: mass ${result.g2.massChange.toExponential(2)} of the domain's, energy ${result.g2.energyChange.toExponential(2)} of the source's — ${g2Pass ? 'PASSES' : 'FAILS'}`
);
for (const [name, x] of Object.entries(g1))
  console.log(
    `G1 ${name}: reaches within ${(x.reaches * 100).toFixed(3)} %, peaks within ${(x.peaks * 100).toFixed(3)} % — ${x.passes ? 'PASSES' : 'FAILS'}`
  );
console.log(
  `Newton residuals on the GPU: T2 ${String(result.gpuT2.newtonResiduals)}, T4 ${String(result.gpuT4.newtonResiduals)}; CPU steps ${String(cpuT2.steps)} / ${String(cpuT4.steps)}, GPU ${String(result.gpuT2.steps)} / ${String(result.gpuT4.steps)}`
);
writeFileSync(
  'src/physics/validation/verifyBlastGpuAir.json',
  `${JSON.stringify(
    {
      rule: '1352 (b), 1355',
      g0: { ...result.g0, passes: g0Pass },
      g2: { ...result.g2, passes: g2Pass },
      g1,
      newtonResiduals: { t2: result.gpuT2.newtonResiduals, t4: result.gpuT4.newtonResiduals },
      passes: g0Pass && g1Pass && g2Pass,
    },
    null,
    2
  )}\n`
);
