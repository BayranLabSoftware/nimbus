import { readFileSync, writeFileSync } from 'node:fs';
import { atmosphericEntry } from '../../src/physics/effects/atmosphericEntry.js';
import {
  programTsunamiReferenceAmplitude,
  programWaterCraterDiameter,
} from '../../src/physics/events/tsunami/impactProgram.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';
import {
  IMPACT_TSUNAMI_BODIES,
  IMPACT_TSUNAMI_LEVELS,
  impactTsunamiVerdict,
  tsunamiRingAgreement,
  type RingAgreement,
} from '../../src/physics/validation/impactTsunamiRules.js';

/**
 * Rules 152 and 153 of src/physics/validation/impactTsunamiRules.ts, the
 * held-out part. The program is asked by scripts/eiep-water.py; this writes
 * what to ask and reads what came back.
 *
 *   pnpm exec tsx scripts/benchmark/impact-tsunami-against-eiep.ts queries <bodies.json>
 *   python3 scripts/eiep-water.py <bodies.json> <cache directory> <answered.json>
 *   pnpm exec tsx scripts/benchmark/impact-tsunami-against-eiep.ts score <answered.json> [<out.json>]
 */

interface Answer {
  key: string;
  error: string | null;
  burstAltitudeM: number | null;
  tsunamiRadiiM: [number, number][] | null;
}

const [mode, ...args] = process.argv.slice(2);

if (mode === 'queries') {
  const [out] = args;
  if (out === undefined) throw new Error('queries <out.json>');
  const bodies = IMPACT_TSUNAMI_BODIES.map((b, i) => ({ key: `body ${(i + 1).toString()}`, ...b }));
  writeFileSync(out, `${JSON.stringify(bodies, null, 1)}\n`);
} else if (mode === 'score') {
  const [answeredPath, out] = args;
  if (answeredPath === undefined) throw new Error('score <answered.json> [out]');
  const answers = (JSON.parse(readFileSync(answeredPath, 'utf8')) as { rows: Answer[] }).rows;
  const perBody: (RingAgreement[] | null)[] = [];
  const lines: Record<string, unknown>[] = [];
  IMPACT_TSUNAMI_BODIES.forEach((b, i) => {
    const key = `body ${(i + 1).toString()}`;
    const a = answers.find((x) => x.key === key);
    if (a?.error !== null || a.burstAltitudeM !== null || a.tsunamiRadiiM === null) {
      perBody.push(null);
      lines.push({
        body: i + 1,
        apart: a?.error ?? (a?.burstAltitudeM !== null ? 'airburst' : 'no rings'),
      });
      console.log(`${key}: apart`);
      return;
    }
    const v0 = b.velocityKmS * 1_000;
    const energy = 0.5 * (Math.PI / 6) * b.diameterM ** 3 * b.densityKgM3 * v0 * v0;
    const angle = degreesToRadians(deg(b.angleDeg));
    const e = atmosphericEntry(
      m(b.diameterM),
      mps(v0),
      undefined,
      kgPerM3(b.densityKgM3),
      J(energy),
      angle,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      // Rule 994: the program's pancake is Eq. 15*.
      'eq15'
    );
    const crater = programWaterCraterDiameter({
      impactorDiameter: m(b.diameterM),
      impactorDensity: kgPerM3(b.densityKgM3),
      impactVelocity: e.endVelocity,
      impactAngle: angle,
    }) as number;
    const reference = programTsunamiReferenceAmplitude(m(crater), m(b.waterDepthM)) as number;
    const agreements = IMPACT_TSUNAMI_LEVELS.map((level) => {
      const model = reference > level ? (reference * crater) / level : 0;
      const program = a.tsunamiRadiiM?.find(([amplitude]) => amplitude === level)?.[1] ?? 0;
      const agreement = tsunamiRingAgreement(model, crater, program);
      lines.push({ body: i + 1, level, model, program, crater, agreement });
      console.log(
        `${key} ${level.toString().padStart(5)} m: model ${(model / 1000).toFixed(3).padStart(11)} km  program ${(program / 1000).toFixed(3).padStart(11)} km  ${agreement}`
      );
      return agreement;
    });
    perBody.push(agreements);
  });
  const verdict = impactTsunamiVerdict(perBody);
  console.log(
    `\n${JSON.stringify(verdict)}\nRule 153, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/impactTsunamiRules.ts, rules 150 to 153', verdict, rings: lines }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: queries | score');
}
