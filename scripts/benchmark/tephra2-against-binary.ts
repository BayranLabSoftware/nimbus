import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  prepareTephra2Deposit,
  tephra2Loading,
  type Tephra2Eruption,
  type WindReading,
} from '../../src/physics/events/volcano/tephra2Fallout.js';
import {
  tephra2HeldOutCases,
  tephra2PointAgrees,
  tephra2Verdict,
  type Tephra2Case,
} from '../../src/physics/validation/tephra2Rules.js';

/**
 * Nimbus's Tephra2 forward model against the program itself
 * (docs/TEPHRA2_SETUP.md says how to build it): the same eruption, wind and
 * points written as the program's three input files, the program run once,
 * and every point's loading compared.
 *
 *   pnpm exec tsx scripts/benchmark/tephra2-against-binary.ts example <binary> <config> <points> <wind> [max points]
 *   pnpm exec tsx scripts/benchmark/tephra2-against-binary.ts cases <binary> <cases.json> [<out.json>]
 *   pnpm exec tsx scripts/benchmark/tephra2-against-binary.ts heldout <binary> [<out.json>]
 *
 * cases.json is a list of { key, eruption, wind, points: [{ northM, eastM, elevationM }] };
 * `heldout` runs rule 160's forty eruptions of validation/tephra2Rules.ts and
 * reads rule 161. A point agrees as rule 160 says.
 */

const VENT_EAST = 500_000;
const VENT_NORTH = 2_000_000;

function configText(e: Tephra2Eruption): string {
  return [
    `VENT_EASTING ${VENT_EAST.toString()}`,
    `VENT_NORTHING ${VENT_NORTH.toString()}`,
    `VENT_ELEVATION ${e.ventElevationM.toPrecision(17)}`,
    `PLUME_HEIGHT ${e.plumeTopElevationM.toPrecision(17)}`,
    `ALPHA ${e.releaseAlpha.toPrecision(17)}`,
    `BETA ${e.releaseBeta.toPrecision(17)}`,
    `ERUPTION_MASS ${e.massKg.toPrecision(17)}`,
    `MAX_GRAINSIZE ${e.coarsestPhi.toPrecision(17)}`,
    `MIN_GRAINSIZE ${e.finestPhi.toPrecision(17)}`,
    `MEDIAN_GRAINSIZE ${e.medianPhi.toPrecision(17)}`,
    `STD_GRAINSIZE ${e.sigmaPhi.toPrecision(17)}`,
    `EDDY_CONST ${e.eddyConstant.toPrecision(17)}`,
    `DIFFUSION_COEFFICIENT ${e.diffusionCoefficientM2S.toPrecision(17)}`,
    `FALL_TIME_THRESHOLD ${e.fallTimeThresholdS.toPrecision(17)}`,
    `LITHIC_DENSITY ${e.lithicDensityKgM3.toPrecision(17)}`,
    `PUMICE_DENSITY ${e.pumiceDensityKgM3.toPrecision(17)}`,
    `COL_STEPS ${e.columnSteps.toString()}`,
    `PART_STEPS ${e.grainSteps.toString()}`,
    'PLUME_MODEL 2',
    '',
  ].join('\n');
}

/** The configuration file's keys, read into an eruption (the vent's position
 *  is returned apart, for the points). */
function parseConfig(text: string): { eruption: Tephra2Eruption; east: number; north: number } {
  const values = new Map<string, number>();
  for (const raw of text.split('\n')) {
    const line = raw.trim();
    if (line === '' || line.startsWith('#') || line.startsWith('/*')) continue;
    const [key, value] = line.split(/\s+/);
    if (key !== undefined && value !== undefined) values.set(key, Number(value));
  }
  const get = (k: string): number => {
    const v = values.get(k);
    if (v === undefined || !Number.isFinite(v)) throw new Error(`config: ${k}`);
    return v;
  };
  return {
    east: get('VENT_EASTING'),
    north: get('VENT_NORTHING'),
    eruption: {
      ventElevationM: get('VENT_ELEVATION'),
      plumeTopElevationM: get('PLUME_HEIGHT'),
      massKg: get('ERUPTION_MASS'),
      coarsestPhi: get('MAX_GRAINSIZE'),
      finestPhi: get('MIN_GRAINSIZE'),
      medianPhi: get('MEDIAN_GRAINSIZE'),
      sigmaPhi: get('STD_GRAINSIZE'),
      releaseAlpha: get('ALPHA'),
      releaseBeta: get('BETA'),
      eddyConstant: get('EDDY_CONST'),
      diffusionCoefficientM2S: get('DIFFUSION_COEFFICIENT'),
      fallTimeThresholdS: get('FALL_TIME_THRESHOLD'),
      lithicDensityKgM3: get('LITHIC_DENSITY'),
      pumiceDensityKgM3: get('PUMICE_DENSITY'),
      columnSteps: get('COL_STEPS'),
      grainSteps: get('PART_STEPS'),
    },
  };
}

function parseWind(text: string): WindReading[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l !== '' && !l.startsWith('#'))
    .map((l) => {
      const [h, s, d] = l.split(/\s+/).map(Number);
      return { heightM: h ?? 0, speedMS: s ?? 0, towardDeg: d ?? 0 };
    });
}

/** The loadings the program printed, in the order of its points file. */
function runProgram(binary: string, config: string, points: string, wind: string): number[] {
  const stdout = execFileSync(binary, [config, points, wind], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
    cwd: tmpdir(),
  });
  const loads: number[] = [];
  for (const line of stdout.split('\n')) {
    if (line.startsWith('#')) continue;
    const parts = line.trim().split(/\s+/);
    if (parts.length < 4) continue;
    loads.push(Number(parts[3]));
  }
  return loads;
}

export interface PointAgreement {
  model: number;
  program: number;
  agrees: boolean;
}

function compare(
  model: (i: number) => number,
  program: readonly number[]
): { agreements: PointAgreement[]; worst: number } {
  let worst = 0;
  const agreements = program.map((p, i) => {
    const m = model(i);
    const rel = p === 0 ? (m === 0 ? 0 : Number.POSITIVE_INFINITY) : Math.abs(m - p) / Math.abs(p);
    if (rel > worst) worst = rel;
    return { model: m, program: p, agrees: tephra2PointAgrees(m, p) };
  });
  return { agreements, worst };
}

const [mode, ...args] = process.argv.slice(2);

if (mode === 'example') {
  const [binary, configPath, pointsPath, windPath, maxPoints] = args;
  if (
    binary === undefined ||
    configPath === undefined ||
    pointsPath === undefined ||
    windPath === undefined
  ) {
    throw new Error('example <binary> <config> <points> <wind> [max points]');
  }
  const { eruption, east, north } = parseConfig(readFileSync(configPath, 'utf8'));
  const wind = parseWind(readFileSync(windPath, 'utf8'));
  const limit = maxPoints === undefined ? Number.POSITIVE_INFINITY : Number(maxPoints);
  const pointLines = readFileSync(pointsPath, 'utf8')
    .split('\n')
    .filter((l) => l.trim() !== '' && !l.startsWith('#'))
    .slice(0, limit);
  const work = mkdtempSync(join(tmpdir(), 'nimbus-t2-'));
  const pts = join(work, 'points');
  writeFileSync(pts, `${pointLines.join('\n')}\n`);
  const program = runProgram(binary, configPath, pts, windPath);
  const deposit = prepareTephra2Deposit(eruption, wind);
  const coords = pointLines.map((l) => l.trim().split(/\s+/).map(Number));
  const { agreements, worst } = compare((i) => {
    const [e, n, z] = coords[i] ?? [0, 0, 0];
    return tephra2Loading(deposit, (n ?? 0) - north, (e ?? 0) - east, z ?? 0);
  }, program);
  console.log(
    JSON.stringify({
      points: agreements.length,
      agree: agreements.filter((a) => a.agrees).length,
      worstRelative: worst,
    })
  );
} else if (mode === 'cases' || mode === 'heldout') {
  const [binary, second, third] = args;
  if (binary === undefined || (mode === 'cases' && second === undefined)) {
    throw new Error('cases <binary> <cases.json> [out.json] | heldout <binary> [out.json]');
  }
  const cases =
    mode === 'heldout'
      ? tephra2HeldOutCases()
      : (JSON.parse(readFileSync(second ?? '', 'utf8')) as Tephra2Case[]);
  const out = mode === 'heldout' ? second : third;
  const work = mkdtempSync(join(tmpdir(), 'nimbus-t2-'));
  const rows: Record<string, unknown>[] = [];
  const perCase: (boolean[] | null)[] = [];
  for (const c of cases) {
    const config = join(work, 'tephra2.conf');
    const points = join(work, 'points');
    const wind = join(work, 'wind');
    writeFileSync(config, configText(c.eruption));
    writeFileSync(
      points,
      `${c.points.map((p) => `${(VENT_EAST + p.eastM).toPrecision(17)} ${(VENT_NORTH + p.northM).toPrecision(17)} ${p.elevationM.toPrecision(17)}`).join('\n')}\n`
    );
    writeFileSync(
      wind,
      `${c.wind.map((w) => `${w.heightM.toPrecision(17)} ${w.speedMS.toPrecision(17)} ${w.towardDeg.toPrecision(17)}`).join('\n')}\n`
    );
    let program: number[];
    try {
      program = runProgram(binary, config, points, wind);
    } catch (err) {
      rows.push({ key: c.key, error: String(err).slice(0, 200) });
      perCase.push(null);
      console.log(`${c.key}: the program did not run`);
      continue;
    }
    if (program.length !== c.points.length) {
      rows.push({ key: c.key, error: `printed ${program.length.toString()} points` });
      perCase.push(null);
      console.log(`${c.key}: the program printed ${program.length.toString()} points`);
      continue;
    }
    const deposit = prepareTephra2Deposit(c.eruption, c.wind);
    const { agreements, worst } = compare((i) => {
      const p = c.points[i];
      return p === undefined
        ? Number.NaN
        : tephra2Loading(deposit, p.northM, p.eastM, p.elevationM);
    }, program);
    const agree = agreements.filter((a) => a.agrees).length;
    perCase.push(agreements.map((a) => a.agrees));
    rows.push({ key: c.key, points: agreements.length, agree, worstRelative: worst, agreements });
    console.log(
      `${c.key}: ${agree.toString()}/${agreements.length.toString()} agree, ${agreements.filter((a) => a.program > 0).length.toString()} above zero, worst ${worst.toExponential(2)}`
    );
  }
  const verdict = tephra2Verdict(perCase);
  console.log(JSON.stringify(verdict));
  if (mode === 'heldout') {
    console.log(
      `Rule 161, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
    );
  }
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: mode === 'heldout' ? 'src/physics/validation/tephra2Rules.ts, rules 158 to 161' : null, verdict, cases: rows }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: example | cases | heldout');
}
