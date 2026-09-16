import { readFileSync, writeFileSync } from 'node:fs';
import { IMPACT_BLAST_COUPLING } from '../../src/physics/constants.js';
import { groundImpactOverpressure } from '../../src/physics/effects/airburstBlast.js';
import { peakOverpressure } from '../../src/physics/events/explosion/overpressure.js';
import { simulateImpact } from '../../src/physics/simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';
import {
  GROUND_BLAST_BODIES,
  groundBlastAgrees,
  groundBlastVerdict,
  type GroundBlastPoint,
} from '../../src/physics/validation/groundBlastRules.js';

/**
 * Rules 139 and 140 of src/physics/validation/groundBlastRules.ts. The program
 * is asked by scripts/eiep-points.py; this writes what to ask and reads what
 * came back.
 *
 *   pnpm exec tsx scripts/benchmark/ground-blast-against-eiep.ts queries <queries.json>
 *   python3 scripts/eiep-points.py <queries.json> <answered.json>
 *   pnpm exec tsx scripts/benchmark/ground-blast-against-eiep.ts score <answered.json> [<out.json>]
 */

interface Answer {
  key: string;
  rangeKm: number;
  error: string | null;
  burstAltitudeM: number | null;
  overpressurePa: [number, number] | null;
}

const TARGET_DENSITY = { sedimentary: 2_500, crystalline: 2_750 } as const;
const keyOf = (body: number, range: number) =>
  `body ${(body + 1).toString()} range ${(range + 1).toString()}`;

const [mode, ...args] = process.argv.slice(2);

if (mode === 'queries') {
  const [out] = args;
  if (out === undefined) throw new Error('queries <out.json>');
  const queries = GROUND_BLAST_BODIES.flatMap((b, i) =>
    b.rangesKm.map((rangeKm, j) => ({
      key: keyOf(i, j),
      diameterM: b.diameterM,
      densityKgM3: b.densityKgM3,
      velocityKmS: b.velocityKmS,
      angleDeg: b.angleDeg,
      target: b.target,
      rangeKm,
    }))
  );
  writeFileSync(out, `${JSON.stringify(queries, null, 1)}\n`);
} else if (mode === 'score') {
  const [answeredPath, out] = args;
  if (answeredPath === undefined) throw new Error('score <answered.json> [out]');
  const answers = (JSON.parse(readFileSync(answeredPath, 'utf8')) as { rows: Answer[] }).rows;
  const points: (GroundBlastPoint & { apart: string | null })[] = [];
  GROUND_BLAST_BODIES.forEach((b, i) => {
    const r = simulateImpact({
      impactorDiameter: m(b.diameterM),
      impactVelocity: mps(b.velocityKmS * 1_000),
      impactorDensity: kgPerM3(b.densityKgM3),
      targetDensity: kgPerM3(TARGET_DENSITY[b.target]),
      impactAngle: degreesToRadians(deg(b.angleDeg)),
    });
    const ke = r.impactor.kineticEnergy as number;
    const gf = r.entry.energyFractionToGround;
    const surfaceBlast = ke * Math.max(gf, 0) * IMPACT_BLAST_COUPLING;
    const entryBlast = r.entry.atmosphericYieldMegatons * 4.184e15 * IMPACT_BLAST_COUPLING;
    b.rangesKm.forEach((rangeKm, j) => {
      const a = answers.find((x) => x.key === keyOf(i, j));
      if (a !== undefined && a.rangeKm !== rangeKm) {
        throw new Error(`${keyOf(i, j)}: asked ${a.rangeKm.toString()} km`);
      }
      const distance = m(rangeKm * 1_000);
      const apart =
        a === undefined
          ? 'not asked'
          : a.error !== null
            ? `program: ${a.error}`
            : a.burstAltitudeM !== null
              ? 'program: airburst'
              : a.overpressurePa === null
                ? 'program: no overpressure'
                : null;
      points.push({
        body: i + 1,
        rangeKm,
        apart,
        programPa: apart === null && a?.overpressurePa ? a.overpressurePa[0] : null,
        programLawPa: groundImpactOverpressure({
          groundRange: distance,
          virtualBurstAltitude: r.entry.virtualBurstAltitude,
          blastYield: J(ke * Math.max(gf, 1 - gf)),
        }),
        inPlacePa: Math.max(
          surfaceBlast > 0 ? peakOverpressure({ distance, yieldEnergy: J(surfaceBlast) }) : 0,
          entryBlast > 0 ? peakOverpressure({ distance, yieldEnergy: J(entryBlast) }) : 0
        ),
      });
    });
  });
  const verdict = groundBlastVerdict(points);
  const ratio = (x: number, y: number | null) => (y === null ? '—' : (x / y).toFixed(5));
  console.log('body  range (km)    program (Pa)   law      in place');
  for (const q of points) {
    console.log(
      `${q.body.toString().padStart(4)} ${q.rangeKm.toFixed(3).padStart(10)}  ${(q.programPa?.toFixed(3) ?? q.apart ?? '').padStart(16)}  ${ratio(q.programLawPa, q.programPa).padStart(7)}  ${ratio(q.inPlacePa, q.programPa).padStart(8)}${q.programPa !== null && !groundBlastAgrees(q.programPa, q.programLawPa) ? '  OUTSIDE' : ''}`
    );
  }
  console.log(
    `\n${verdict.compared.toString()} points compared on ${verdict.bodies.toString()} bodies: the program's law agrees on ${verdict.lawAgrees.toString()}, the model in place on ${verdict.inPlaceAgrees.toString()}. Rule 140: ${verdict.adopted ? 'ADOPTED' : verdict.enough ? 'REFUSED' : 'REFUSED (too little compared)'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/groundBlastRules.ts, rules 138 to 140', verdict, points }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: queries | score');
}
