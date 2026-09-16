import { readFileSync, writeFileSync } from 'node:fs';
import { airburstOverpressure } from '../../src/physics/effects/airburstBlast.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';
import {
  MACH_BLEND_ANCHOR_KM,
  MACH_BLEND_BODIES,
  machBlendAgrees,
  machBlendRangesKm,
  machBlendScale,
  machBlendSpan,
  machBlendVerdict,
  machBlendYieldJ,
  type MachBlendPoint,
} from '../../src/physics/validation/machBlendRules.js';

/**
 * Rules 130 and 131 of src/physics/validation/machBlendRules.ts. The program
 * is asked by scripts/eiep-points.py; this writes what to ask and reads what
 * came back.
 *
 *   pnpm exec tsx scripts/benchmark/mach-blend-against-eiep.ts anchors <anchors.json>
 *   python3 scripts/eiep-points.py <anchors.json> <anchors-answered.json>
 *   pnpm exec tsx scripts/benchmark/mach-blend-against-eiep.ts ranges <anchors-answered.json> <ranges.json>
 *   python3 scripts/eiep-points.py <ranges.json> <ranges-answered.json>
 *   pnpm exec tsx scripts/benchmark/mach-blend-against-eiep.ts score <anchors-answered.json> <ranges-answered.json> [<out.json>]
 */

interface Query {
  key: string;
  diameterM: number;
  densityKgM3: number;
  velocityKmS: number;
  angleDeg: number;
  rangeKm: number;
}
interface Answer extends Query {
  error: string | null;
  burstAltitudeM: number | null;
  overpressurePa: [number, number] | null;
}

const MEGATON = 4.184e15;
const readAnswers = (path: string): Answer[] =>
  (JSON.parse(readFileSync(path, 'utf8')) as { rows: Answer[] }).rows;
const bodyQuery = (i: number, rangeKm: number, key: string): Query => {
  const b = MACH_BLEND_BODIES[i];
  if (b === undefined) throw new Error(`no body ${i.toString()}`);
  const { diameterM, densityKgM3, velocityKmS, angleDeg } = b;
  return { key, diameterM, densityKgM3, velocityKmS, angleDeg, rangeKm };
};

/** What rule 130 places for one body from its anchor, or why it cannot. */
function placed(
  anchor: Answer | undefined
):
  | { burstAltitudeM: number; scale: number; z1: number }
  | { apart: 'unanswered' | 'ground' | 'no Mach region' } {
  if (anchor?.error !== null || anchor.overpressurePa === null) {
    return { apart: 'unanswered' };
  }
  if (anchor.burstAltitudeM === null) return { apart: 'ground' };
  const scale = machBlendScale(
    MACH_BLEND_ANCHOR_KM,
    anchor.burstAltitudeM,
    anchor.overpressurePa[0]
  );
  const z1 = anchor.burstAltitudeM / scale;
  if (machBlendSpan(z1) === null) return { apart: 'no Mach region' };
  return { burstAltitudeM: anchor.burstAltitudeM, scale, z1 };
}

const [mode, ...args] = process.argv.slice(2);

if (mode === 'anchors') {
  const [out] = args;
  if (out === undefined) throw new Error('anchors <out.json>');
  const queries = MACH_BLEND_BODIES.map((_, i) =>
    bodyQuery(i, MACH_BLEND_ANCHOR_KM, `body ${(i + 1).toString()} anchor`)
  );
  writeFileSync(out, `${JSON.stringify(queries, null, 1)}\n`);
} else if (mode === 'ranges') {
  const [anchorsPath, out] = args;
  if (anchorsPath === undefined || out === undefined) throw new Error('ranges <anchors> <out>');
  const anchors = readAnswers(anchorsPath);
  const queries: Query[] = [];
  MACH_BLEND_BODIES.forEach((b, i) => {
    const p = placed(anchors[i]);
    if ('apart' in p) {
      console.log(`body ${(i + 1).toString()}: ${p.apart}`);
      return;
    }
    machBlendRangesKm(p.burstAltitudeM, p.scale, b.fractions).forEach((km, j) => {
      queries.push(bodyQuery(i, km, `body ${(i + 1).toString()} range ${(j + 1).toString()}`));
    });
    console.log(
      `body ${(i + 1).toString()}: burst ${p.burstAltitudeM.toString()} m, scale ${p.scale.toFixed(6)}, z₁ ${p.z1.toFixed(1)} m`
    );
  });
  writeFileSync(out, `${JSON.stringify(queries, null, 1)}\n`);
} else if (mode === 'score') {
  const [anchorsPath, rangesPath, out] = args;
  if (anchorsPath === undefined || rangesPath === undefined) {
    throw new Error('score <anchors> <ranges> [out]');
  }
  const anchors = readAnswers(anchorsPath);
  const answers = readAnswers(rangesPath);
  const points: (MachBlendPoint & {
    z1: number;
    where: 'regular' | 'blend' | 'Mach';
    entryPa: number | null;
  })[] = [];
  const apart: { body: number; why: string }[] = [];
  MACH_BLEND_BODIES.forEach((b, i) => {
    const p = placed(anchors[i]);
    if ('apart' in p) {
      apart.push({ body: i + 1, why: p.apart });
      return;
    }
    const span = machBlendSpan(p.z1);
    const own = simulateImpact({
      impactorDiameter: m(b.diameterM),
      impactVelocity: mps(b.velocityKmS * 1_000),
      impactorDensity: kgPerM3(b.densityKgM3),
      targetDensity: kgPerM3(2_500),
      impactAngle: degreesToRadians(deg(b.angleDeg)),
    });
    const expected = machBlendRangesKm(p.burstAltitudeM, p.scale, b.fractions);
    const burst = { burstAltitude: m(p.burstAltitudeM), blastYield: J(machBlendYieldJ(p.scale)) };
    expected.forEach((km, j) => {
      const key = `body ${(i + 1).toString()} range ${(j + 1).toString()}`;
      const a = answers.find((x) => x.key === key);
      if (a !== undefined && a.rangeKm !== km)
        throw new Error(`${key}: asked ${a.rangeKm.toString()} km`);
      const groundRange = m(km * 1_000);
      const r1 = (km * 1_000) / p.scale;
      points.push({
        body: i + 1,
        rangeKm: km,
        z1: p.z1,
        where: span === null || r1 <= span.inner ? 'regular' : r1 >= span.outer ? 'Mach' : 'blend',
        programPa: a?.error !== null || a.overpressurePa === null ? null : a.overpressurePa[0],
        blendPa: airburstOverpressure({ ...burst, groundRange, machTransition: 'program' }),
        stepPa: airburstOverpressure({ ...burst, groundRange, machTransition: 'published' }),
        entryPa:
          own.entry.regime === 'COMPLETE_AIRBURST'
            ? airburstOverpressure({
                groundRange,
                burstAltitude: own.entry.burstAltitude,
                blastYield: J(own.entry.blastYieldMegatons * MEGATON),
                machTransition: 'program',
              })
            : null,
      });
    });
  });
  const verdict = machBlendVerdict(points);
  const ratio = (x: number, y: number | null) => (y === null ? '—' : (x / y).toFixed(5));
  console.log('body  z₁ (m)   range (km)  where    program (Pa)   blend    step     entry');
  for (const q of points) {
    console.log(
      `${q.body.toString().padStart(4)} ${q.z1.toFixed(1).padStart(7)} ${q.rangeKm.toFixed(4).padStart(11)}  ${q.where.padEnd(7)} ${(q.programPa?.toFixed(3) ?? 'unanswered').padStart(14)}  ${ratio(q.blendPa, q.programPa).padStart(7)}  ${ratio(q.stepPa, q.programPa).padStart(7)}  ${q.entryPa === null ? 'ground' : ratio(q.entryPa, q.programPa).padStart(7)}${q.programPa !== null && !machBlendAgrees(q.programPa, q.blendPa) ? '  OUTSIDE' : ''}`
    );
  }
  for (const x of apart) console.log(`body ${x.body.toString()}: apart, ${x.why}`);
  console.log(
    `\n${verdict.answered.toString()} points answered on ${verdict.bodies.toString()} bodies: the blend agrees on ${verdict.blendAgrees.toString()}, the step on ${verdict.stepAgrees.toString()}. Rule 131: ${verdict.adopted ? 'ADOPTED' : verdict.enough ? 'REFUSED' : 'REFUSED (too little answered)'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/machBlendRules.ts, rules 129 to 131', verdict, apart, points }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: anchors | ranges | score');
}
