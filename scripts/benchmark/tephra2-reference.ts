import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_GRAIN_SPECTRUM } from '../../src/physics/events/volcano/ashfall.js';
import { plumeHeight } from '../../src/physics/events/volcano/plumeHeight.js';

/**
 * Track VOL's reference: Tephra2 run on the same eruptions Nimbus is scored
 * on, so BM-07 can be reproduced instead of remembered.
 *
 * The campaign of 15 September 2026 built Tephra2 and ran it by hand, and
 * only its statistics survived — `benchmark/results/volcano.json` holds the
 * aggregates and not a single reference point, so no candidate for the
 * crosswind spread could ever be measured against it. This writes the
 * reference file `compare-volcano.ts` expects, from the same matrix, with the
 * same choices the protocol records:
 *
 *   - the plume height is Nimbus's own, Mastin 2009 on the case's volume rate;
 *   - the erupted mass is the case's bulk volume at Nimbus's deposit density;
 *   - the wind is the case's, constant with height;
 *   - the grain size is Nimbus's four classes fitted as a Gaussian in φ —
 *     mean −0.10 φ, standard deviation 2.80 φ, which is what those four
 *     classes weigh out to;
 *   - everything Nimbus has no equivalent for — the eddy constant, the
 *     diffusion coefficient, the fall-time threshold, the column steps, the
 *     particle densities — is Tephra2's own example, unchanged.
 *
 *   pnpm exec tsx scripts/benchmark/tephra2-reference.ts <tephra2 binary> <out.json>
 *
 * `docs/TEPHRA2_SETUP.md` says how to build the binary on this machine.
 * Nothing here changes Nimbus: it only runs the reference.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface VolcanoCase {
  id: string;
  source: string;
  volumeEruptionRate: number;
  totalEjectaVolume: number;
  windSpeed: number;
  downwindKm: number[];
}

/** The crosswind offsets the campaign sampled, at 50 km downwind. */
const CROSSWIND_KM = [10, 30];
const CROSSWIND_AT_DOWNWIND_KM = 50;

/** Nimbus's deposit density (kg/m³) — `ashfall.ts`'s default. */
const DEPOSIT_DENSITY = 1_000;

/** A vent on flat ground, in a UTM-like frame with metres for axes. The
 *  model only ever sees differences, so the origin is arbitrary. */
const VENT_EASTING = 500_000;
const VENT_NORTHING = 2_000_000;
/** Not zero: Tephra2 divides zero by zero at a vent on the datum, which the
 *  campaign found and recorded (BENCHMARK_REPORT.md, note 5). */
const VENT_ELEVATION = 0.001;

/** Nimbus's four grain classes as a Gaussian in φ: the mass-weighted mean
 *  and standard deviation of φ = −log2(diameter in mm). */
function grainGaussian(): { medianPhi: number; stdPhi: number } {
  let mean = 0;
  for (const g of DEFAULT_GRAIN_SPECTRUM) mean += g.massFraction * -Math.log2(g.diameter * 1_000);
  let variance = 0;
  for (const g of DEFAULT_GRAIN_SPECTRUM) {
    variance += g.massFraction * (-Math.log2(g.diameter * 1_000) - mean) ** 2;
  }
  return { medianPhi: mean, stdPhi: Math.sqrt(variance) };
}

/** Tephra2's own example configuration, with the fields this run sets left
 *  as placeholders. Everything else is `inputs/tephra2.conf` unchanged. */
function config(heightM: number, massKg: number, grain: ReturnType<typeof grainGaussian>): string {
  return [
    `VENT_EASTING ${VENT_EASTING.toString()}`,
    `VENT_NORTHING ${VENT_NORTHING.toString()}`,
    `VENT_ELEVATION ${VENT_ELEVATION.toString()}`,
    `PLUME_HEIGHT ${heightM.toFixed(1)}`,
    'ALPHA 1.04487',
    'BETA 1.46425',
    `ERUPTION_MASS ${massKg.toExponential(6)}`,
    'MAX_GRAINSIZE -7',
    'MIN_GRAINSIZE 7',
    `MEDIAN_GRAINSIZE ${grain.medianPhi.toFixed(5)}`,
    `STD_GRAINSIZE ${grain.stdPhi.toFixed(5)}`,
    'EDDY_CONST  0.04',
    'DIFFUSION_COEFFICIENT 5138',
    'FALL_TIME_THRESHOLD 288',
    'LITHIC_DENSITY 2700',
    'PUMICE_DENSITY 1000',
    'COL_STEPS 100',
    'PART_STEPS 100',
    'PLUME_MODEL 2',
    '',
  ].join('\n');
}

/** A wind file: Tephra2 reads height (m), speed (m/s), direction (° from
 *  north, the direction the wind blows towards). Due east for every level,
 *  which makes +easting the downwind axis. */
function wind(speed: number): string {
  const levels = [0, 1_000, 2_000, 4_000, 8_000, 12_000, 16_000, 20_000, 30_000, 45_000];
  return `${levels.map((z) => `${z.toString()} ${speed.toFixed(2)} 90`).join('\n')}\n`;
}

function main(): void {
  const binary = process.argv[2];
  const outPath = process.argv[3];
  if (binary === undefined || outPath === undefined) {
    console.error('usage: tephra2-reference.ts <tephra2 binary> <out.json>');
    process.exit(2);
  }
  const cases = JSON.parse(
    readFileSync(join(ROOT, 'benchmark', 'matrices', 'volcano.json'), 'utf8')
  ) as VolcanoCase[];
  const grain = grainGaussian();
  const work = mkdtempSync(join(tmpdir(), 'nimbus-tephra2-'));
  const out: { reference: string; grain: typeof grain; cases: unknown[] } = {
    reference: 'Tephra2 2.0 (commit ff621c6), built and run locally',
    grain,
    cases: [],
  };

  for (const c of cases) {
    const heightM = plumeHeight({ volumeEruptionRate: c.volumeEruptionRate }) as number;
    const massKg = c.totalEjectaVolume * DEPOSIT_DENSITY;
    const wanted: { xKm: number; yKm: number }[] = [
      ...c.downwindKm.map((xKm) => ({ xKm, yKm: 0 })),
      ...CROSSWIND_KM.map((yKm) => ({ xKm: CROSSWIND_AT_DOWNWIND_KM, yKm })),
    ];
    const confFile = join(work, 'tephra2.conf');
    const gridFile = join(work, 'points.grid');
    const windFile = join(work, 'wind');
    writeFileSync(confFile, config(heightM, massKg, grain));
    writeFileSync(windFile, wind(c.windSpeed));
    writeFileSync(
      gridFile,
      `${wanted
        .map(
          (p) =>
            `${(VENT_EASTING + p.xKm * 1_000).toString()} ${(VENT_NORTHING + p.yKm * 1_000).toString()} ${VENT_ELEVATION.toString()}`
        )
        .join('\n')}\n`
    );
    let stdout: string;
    try {
      stdout = execFileSync(binary, [confFile, gridFile, windFile], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'ignore'],
      });
    } catch {
      out.cases.push({ id: c.id, points: [], notes: 'Tephra2 refused the case' });
      continue;
    }
    // Every line that starts with a number is a point: easting, northing,
    // elevation, mass loading, then the grain-size distribution.
    const loads = new Map<string, number>();
    for (const line of stdout.split('\n')) {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 4) continue;
      const east = Number(parts[0]);
      const north = Number(parts[1]);
      const load = Number(parts[3]);
      if (!Number.isFinite(east) || !Number.isFinite(north) || !Number.isFinite(load)) continue;
      loads.set(`${Math.round(east).toString()}:${Math.round(north).toString()}`, load);
    }
    const points = wanted.map((p) => ({
      xKm: p.xKm,
      yKm: p.yKm,
      massLoadingKgM2:
        loads.get(
          `${Math.round(VENT_EASTING + p.xKm * 1_000).toString()}:${Math.round(VENT_NORTHING + p.yKm * 1_000).toString()}`
        ) ?? Number.NaN,
    }));
    out.cases.push({ id: c.id, points });
    process.stderr.write(
      `${c.id} H=${(heightM / 1_000).toFixed(1)} km mass=${massKg.toExponential(2)} → ${points.filter((p) => Number.isFinite(p.massLoadingKgM2)).length.toString()}/${points.length.toString()} points\n`
    );
  }
  writeFileSync(
    outPath.startsWith('/') ? outPath : join(ROOT, outPath),
    JSON.stringify(out, null, 1)
  );
  console.error(`wrote ${out.cases.length.toString()} cases`);
}

main();
