import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';
import {
  IMPULSE_WAVE_EXAMPLE_ONE_SLIDE,
  IMPULSE_WAVE_EXAMPLE_TWO_SLIDE,
  impulseWaveAmplitudes,
  impulseWaveDimensionless,
  outsideTestedRange,
  type ImpulseWaveSlide,
} from '../../src/physics/effects/impulseWave.js';
import { simulateLandslide } from '../../src/physics/events/landslide/simulate.js';
import { VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL } from '../../src/physics/events/volcano/tsunami.js';
import { m } from '../../src/physics/units.js';
import {
  impulseWaveAgrees,
  impulseWaveHeldOutCases,
  impulseWaveL2Scenarios,
  impulseWaveToolOutside,
  impulseWaveVerdict,
  type ImpulseWaveNimbusScenario,
  type ImpulseWaveToolNumbers,
  type ImpulseWaveToolSlide,
} from '../../src/physics/validation/impulseWaveRules.js';

/**
 * Nimbus's impulse waves against the impulse wave manual's own spreadsheet
 * (Evers et al. 2019; the computational tool, doi:10.5281/zenodo.3492000),
 * run in Microsoft Excel through AppleScript. docs/IMPULSE_WAVE_TOOL.md says
 * how to obtain the workbook and remove its macros first.
 *
 *   pnpm exec tsx scripts/benchmark/impulse-wave-against-tool.ts examples <workbook.xlsx>
 *   pnpm exec tsx scripts/benchmark/impulse-wave-against-tool.ts heldout <workbook.xlsx> [<out.json>]
 *
 * `examples` runs the manual's Examples 1 and 2; `heldout` runs rules 164 and
 * 165 of validation/impulseWaveRules.ts and reads rule 166. The tool is fed the
 * slide on its sheet "Generation | Propagation (3D)" — the speed, volume,
 * thickness, width, density, porosity, angle and depth of cells F6 to F13, a
 * radial distance and an angle so that no cell it reads is blank — and every
 * number compared is read back from the sheet as Excel computes it.
 */

const SHEET = 'Generation | Propagation (3D)';
const BATCH = 20;
/** The porosity the tool is given where Nimbus has none: the manual's
 *  Example 1. It enters none of the numbers compared. */
const POROSITY_PCT = 35;

interface ToolReading extends ImpulseWaveToolNumbers {
  firstCrest: number;
  firstTrough: number;
  secondCrest: number;
}

/** Reads back, in this order: F, S, M, D, V, B, P (M18 to M29), the angle
 *  (M25), and the three initial amplitudes (F23 to F25). */
const READ_CELLS = ['M18', 'M19', 'M20', 'M21', 'M23', 'M26', 'M29', 'M25', 'F23', 'F24', 'F25'];

function real(x: number): string {
  return x.toExponential(16).replace('e', 'E');
}

function appleScriptFor(workbook: string, slides: readonly ImpulseWaveToolSlide[]): string {
  const name = basename(workbook);
  const lines = [
    'with timeout of 900 seconds',
    'tell application "Microsoft Excel"',
    `if not (exists workbook "${name}") then open workbook workbook file name "${workbook}"`,
    `set ws to worksheet "${SHEET}" of workbook "${name}"`,
    'set out to {}',
  ];
  for (const s of slides) {
    const inputs: [string, number][] = [
      ['F6', s.impactVelocityMS],
      ['F7', s.volumeM3],
      ['F8', s.thicknessM],
      ['F9', s.widthM],
      ['F10', s.densityKgM3],
      ['F11', s.porosityPct],
      ['F12', s.angleDeg],
      ['F13', s.depthM],
      ['F15', 20 * s.depthM + 10 * s.widthM],
      ['F16', 0],
    ];
    for (const [cell, v] of inputs) lines.push(`set value of range "${cell}" of ws to ${real(v)}`);
    lines.push('calculate');
    lines.push(
      `set end of out to {${READ_CELLS.map((c) => `value of range "${c}" of ws`).join(', ')}}`
    );
  }
  lines.push('return out', 'end tell', 'end timeout');
  return lines.join('\n');
}

/** A cell's value as AppleScript prints it, or NaN for anything that is not a
 *  finite number — a blank, a text, or one of Excel's error codes. */
function numberOf(v: unknown): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return Number.NaN;
  // Excel hands its error values (#NUM!, #VALUE!) to AppleScript as large
  // negative integers.
  if (v < -2_146_000_000 && v > -2_147_000_000 && Number.isInteger(v)) return Number.NaN;
  return v;
}

function runTool(
  workbook: string,
  slides: readonly ImpulseWaveToolSlide[]
): (ToolReading | null)[] {
  const out: (ToolReading | null)[] = [];
  const work = mkdtempSync(join(tmpdir(), 'nimbus-iwm-'));
  for (let i = 0; i < slides.length; i += BATCH) {
    const batch = slides.slice(i, i + BATCH);
    const file = join(work, `batch-${i.toString()}.applescript`);
    writeFileSync(file, appleScriptFor(workbook, batch));
    let text: string;
    try {
      text = execFileSync('osascript', ['-s', 's', file], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
      });
    } catch (err) {
      console.log(`batch ${i.toString()}: the tool did not answer: ${String(err).slice(0, 200)}`);
      out.push(...batch.map(() => null));
      continue;
    }
    const json = text
      .trim()
      .replace(/missing value/g, 'null')
      .replace(/\{/g, '[')
      .replace(/\}/g, ']');
    const rows = JSON.parse(json) as unknown[][];
    for (const row of rows) {
      const [F, S, M, D, V, B, P, angleDeg, c1, t1, c2] = row.map(numberOf);
      out.push({
        F: F ?? Number.NaN,
        S: S ?? Number.NaN,
        M: M ?? Number.NaN,
        D: D ?? Number.NaN,
        V: V ?? Number.NaN,
        B: B ?? Number.NaN,
        P: P ?? Number.NaN,
        angleDeg: angleDeg ?? Number.NaN,
        firstCrest: c1 ?? Number.NaN,
        firstTrough: t1 ?? Number.NaN,
        secondCrest: c2 ?? Number.NaN,
      });
    }
    console.log(
      `tool: ${Math.min(i + BATCH, slides.length).toString()} of ${slides.length.toString()}`
    );
  }
  return out;
}

function closeWorkbook(workbook: string): void {
  const name = basename(workbook);
  try {
    execFileSync('osascript', [
      '-e',
      `tell application "Microsoft Excel" to if (exists workbook "${name}") then close workbook "${name}" saving no`,
    ]);
  } catch {
    // Left open: nothing was saved to it either way.
  }
}

interface Compared {
  name: string;
  model: number;
  tool: number;
  agrees: boolean;
}

function compare(pairs: readonly [string, number, number][]): Compared[] {
  return pairs.map(([name, model, tool]) => ({
    name,
    model,
    tool,
    agrees: impulseWaveAgrees(model, tool),
  }));
}

function worst(numbers: readonly Compared[]): number {
  let w = 0;
  for (const n of numbers) {
    if (n.model === 0 && n.tool === 0) continue;
    const rel = n.tool === 0 ? Number.POSITIVE_INFINITY : Math.abs(n.model / n.tool - 1);
    if (!(rel <= w)) w = rel;
  }
  return w;
}

function slideOf(t: ImpulseWaveToolSlide): ImpulseWaveSlide {
  return {
    froude: t.impactVelocityMS / Math.sqrt(9.81 * t.depthM),
    thicknessM: t.thicknessM,
    widthM: t.widthM,
    volumeM3: t.volumeM3,
    densityKgM3: t.densityKgM3,
    angleDeg: t.angleDeg,
    depthM: t.depthM,
  };
}

/** A slide the tool can take, from what the candidate used for a scenario. */
function nimbusRun(scenario: ImpulseWaveNimbusScenario): {
  toolSlide: ImpulseWaveToolSlide;
  printed: number;
  impulse: NonNullable<ReturnType<typeof simulateLandslide>['impulseWave']>;
} {
  const r = simulateLandslide({ ...scenario, meanOceanDepth: m(scenario.meanOceanDepth) });
  const impulse = r.impulseWave;
  if (impulse === undefined) throw new Error('the candidate did not draw the manual');
  return {
    toolSlide: {
      impactVelocityMS: impulse.impactVelocityMS,
      volumeM3: scenario.volumeM3,
      thicknessM: impulse.thicknessM,
      widthM: impulse.widthM,
      densityKgM3: scenario.slideDensity ?? VOLCANO_TSUNAMI_REFERENCE_DENSITY_SUBAERIAL,
      porosityPct: POROSITY_PCT,
      angleDeg: scenario.slopeAngleDeg,
      depthM: scenario.meanOceanDepth,
    },
    printed: Number(r.tsunami?.sourceAmplitude ?? 0),
    impulse,
  };
}

const sameNames = (a: readonly string[], b: readonly string[]): boolean =>
  a.length === b.length && a.every((x, i) => x === b[i]);

const [mode, workbook, out] = process.argv.slice(2);
if (workbook === undefined || (mode !== 'examples' && mode !== 'heldout')) {
  throw new Error('examples <workbook.xlsx> | heldout <workbook.xlsx> [out.json]');
}

if (mode === 'examples') {
  const examples: [string, ImpulseWaveSlide, number][] = [
    ['Example 1', IMPULSE_WAVE_EXAMPLE_ONE_SLIDE, 58],
    ['Example 2', IMPULSE_WAVE_EXAMPLE_TWO_SLIDE, 32],
  ];
  const slides = examples.map(([, s, v]) => ({
    impactVelocityMS: v,
    volumeM3: s.volumeM3,
    thicknessM: s.thicknessM,
    widthM: s.widthM,
    densityKgM3: s.densityKgM3,
    porosityPct: POROSITY_PCT,
    angleDeg: s.angleDeg,
    depthM: s.depthM,
  }));
  const readings = runTool(workbook, slides);
  closeWorkbook(workbook);
  const rows = examples.map(([name, slide], i) => {
    const row = {
      name,
      tool: readings[i] ?? null,
      model: { ...impulseWaveDimensionless(slide), ...impulseWaveAmplitudes(slide) },
    };
    console.log(name, JSON.stringify(row));
    return row;
  });
  if (out !== undefined) writeFileSync(out, `${JSON.stringify({ examples: rows }, null, 1)}\n`);
} else {
  const cases = impulseWaveHeldOutCases();
  const l2 = impulseWaveL2Scenarios();
  const nimbusRuns = cases.nimbus.map((c) => ({ key: c.key, ...nimbusRun(c.scenario) }));
  const l2Runs = l2.map((c) => ({ key: c.key, ...nimbusRun(c.scenario) }));
  const toolSlides = [
    ...cases.tool.map((c) => c.slide),
    ...nimbusRuns.map((r) => r.toolSlide),
    ...l2Runs.map((r) => r.toolSlide),
  ];
  const readings = runTool(workbook, toolSlides);
  closeWorkbook(workbook);

  const toolRows = cases.tool.map((c, i) => {
    const t = readings[i] ?? null;
    if (t === null) return { key: c.key, slide: c.slide, answered: false as const };
    const slide = slideOf(c.slide);
    const n = impulseWaveDimensionless(slide);
    const a = impulseWaveAmplitudes(slide);
    const numbers = compare([
      ['F', n.F, t.F],
      ['S', n.S, t.S],
      ['M', n.M, t.M],
      ['D', n.D, t.D],
      ['V', n.V, t.V],
      ['B', n.B, t.B],
      ['P', n.P, t.P],
      ['first crest', a.firstCrest, t.firstCrest],
      ['first trough', a.firstTrough, t.firstTrough],
      ['second crest', a.secondCrest, t.secondCrest],
    ]);
    const modelOutside = outsideTestedRange(slide);
    const toolOutside = impulseWaveToolOutside(t);
    return {
      key: c.key,
      slide: c.slide,
      answered: true as const,
      numbers,
      worstRelative: worst(numbers),
      modelOutside,
      toolOutside,
      limits: sameNames(modelOutside, toolOutside),
    };
  });

  const nimbusRows = (
    runs: typeof nimbusRuns,
    offset: number,
    scenarios: readonly { key: string; scenario: ImpulseWaveNimbusScenario }[]
  ) =>
    runs.map((r, i) => {
      const t = readings[offset + i] ?? null;
      const scenario = scenarios[i]?.scenario;
      if (t === null) return { key: r.key, scenario, answered: false as const };
      const numbers = compare([
        ['printed source amplitude', r.printed, t.firstCrest],
        ['first trough', r.impulse.firstTroughM, t.firstTrough],
        ['second crest', r.impulse.secondCrestM, t.secondCrest],
        ['P', r.impulse.impulseProduct, t.P],
        ['F', r.impulse.froude, t.F],
      ]);
      const toolOutside = impulseWaveToolOutside(t);
      return {
        key: r.key,
        scenario,
        toolSlide: r.toolSlide,
        answered: true as const,
        held: r.impulse.held,
        numbers,
        worstRelative: worst(numbers),
        modelOutside: r.impulse.outsideTestedRange,
        toolOutside,
        limits: sameNames(r.impulse.outsideTestedRange, toolOutside),
      };
    });

  const nimbusResult = nimbusRows(nimbusRuns, cases.tool.length, cases.nimbus);
  const l2Result = nimbusRows(l2Runs, cases.tool.length + nimbusRuns.length, l2);

  const forVerdict = (
    rows: readonly (
      | { answered: false }
      | { answered: true; numbers: Compared[]; limits: boolean }
    )[]
  ) =>
    rows.map((r) =>
      r.answered ? { numbers: r.numbers.map((n) => n.agrees), limits: r.limits } : null
    );
  const verdict = impulseWaveVerdict({
    tool: forVerdict(toolRows),
    nimbus: forVerdict(nimbusResult),
    l2: forVerdict(l2Result),
    l2RowsExpected: l2.length,
  });

  const report = (
    label: string,
    rows: readonly { answered: boolean; worstRelative?: number }[]
  ) => {
    const answered = rows.filter((r) => r.answered);
    const w = answered.reduce((acc, r) => Math.max(acc, r.worstRelative ?? 0), 0);
    console.log(
      `${label}: ${answered.length.toString()} of ${rows.length.toString()} answered, worst ${w.toExponential(2)}`
    );
  };
  report("the tool's slides", toolRows);
  report("Nimbus's scenarios", nimbusResult);
  report("L2's rows", l2Result);
  console.log(
    `held by friction: ${nimbusResult.filter((r) => r.answered && r.held).length.toString()} of Nimbus's, ${l2Result.filter((r) => r.answered && r.held).length.toString()} of L2's`
  );
  console.log(JSON.stringify(verdict));
  console.log(
    `Rule 166, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify(
        {
          rules: 'src/physics/validation/impulseWaveRules.ts, rules 162 to 167',
          tool: 'BFE_VAW_Impulse_Wave_Manual_Computational_Tool_v1-0.xlsm, doi:10.5281/zenodo.3492000, macros removed, Microsoft Excel via AppleScript',
          verdict,
          toolSlides: toolRows,
          nimbusScenarios: nimbusResult,
          l2Rows: l2Result,
        },
        null,
        1
      )}\n`
    );
  }
}
