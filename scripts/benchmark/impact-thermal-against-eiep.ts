import { readFileSync, writeFileSync } from 'node:fs';
import {
  fluenceReach,
  impactThermalExposure,
  programIgnitionExposure,
} from '../../src/physics/effects/impactThermal.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';
import {
  IMPACT_THERMAL_BODIES,
  impactThermalAgrees,
  impactThermalVerdict,
} from '../../src/physics/validation/impactThermalRules.js';

/**
 * Rules 148 and 149 of src/physics/validation/impactThermalRules.ts, the
 * held-out part. The program is asked by scripts/eiep-points.py; this writes
 * what to ask and reads what came back.
 *
 *   pnpm exec tsx scripts/benchmark/impact-thermal-against-eiep.ts queries <queries.json>
 *   python3 scripts/eiep-points.py <queries.json> <answered.json>
 *   pnpm exec tsx scripts/benchmark/impact-thermal-against-eiep.ts score <answered.json> [<out.json>]
 */

interface Answer {
  key: string;
  error: string | null;
  burstAltitudeM: number | null;
  fireballRadiiM: number[] | null;
}

const TARGET_DENSITY = { sedimentary: 2_500, crystalline: 2_750 } as const;
const [mode, ...args] = process.argv.slice(2);

if (mode === 'queries') {
  const [out] = args;
  if (out === undefined) throw new Error('queries <out.json>');
  const queries = IMPACT_THERMAL_BODIES.map((b, i) => ({
    key: `body ${(i + 1).toString()}`,
    ...b,
    rangeKm: 100,
  }));
  writeFileSync(out, `${JSON.stringify(queries, null, 1)}\n`);
} else if (mode === 'score') {
  const [answeredPath, out] = args;
  if (answeredPath === undefined) throw new Error('score <answered.json> [out]');
  const answers = (JSON.parse(readFileSync(answeredPath, 'utf8')) as { rows: Answer[] }).rows;
  const rows = IMPACT_THERMAL_BODIES.map((b, i) => {
    const a = answers.find((x) => x.key === `body ${(i + 1).toString()}`);
    const r = simulateImpact({
      impactorDiameter: m(b.diameterM),
      impactVelocity: mps(b.velocityKmS * 1_000),
      impactorDensity: kgPerM3(b.densityKgM3),
      targetDensity: kgPerM3(TARGET_DENSITY[b.target]),
      impactAngle: degreesToRadians(deg(b.angleDeg)),
    });
    const energy = J((r.impactor.kineticEnergy as number) * r.entry.energyFractionToGround);
    const model = fluenceReach(
      (d) => impactThermalExposure(m(d), energy),
      programIgnitionExposure(energy)
    ) as number;
    const program = a?.fireballRadiiM?.[1];
    const apart =
      a === undefined
        ? 'not asked'
        : a.error !== null
          ? `program: ${a.error}`
          : a.burstAltitudeM !== null
            ? 'program: airburst'
            : program === undefined
              ? 'program: no ring'
              : null;
    const agrees =
      apart === null && program !== undefined ? impactThermalAgrees(program, model) : null;
    return { body: i + 1, model, program: program ?? null, apart, agrees };
  });
  for (const row of rows) {
    console.log(
      `body ${row.body.toString().padStart(2)}  model ${(row.model / 1000).toFixed(3).padStart(10)} km  program ${row.program === null ? (row.apart ?? '') : `${(row.program / 1000).toFixed(3)} km`}  ${row.agrees === null ? 'apart' : row.agrees ? `agrees (×${(row.model / (row.program ?? 1)).toFixed(4)}, ${(row.model - (row.program ?? 0)).toFixed(0)} m)` : `OUTSIDE (×${(row.model / (row.program ?? 1)).toFixed(4)})`}`
    );
  }
  const verdict = impactThermalVerdict(rows.map((r) => r.agrees));
  console.log(
    `\n${JSON.stringify(verdict)}\nRule 149, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/impactThermalRules.ts, rules 146 to 149', verdict, rows }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: queries | score');
}
