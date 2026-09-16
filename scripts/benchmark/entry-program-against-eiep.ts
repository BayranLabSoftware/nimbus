import { readFileSync, writeFileSync } from 'node:fs';
import { atmosphericEntry } from '../../src/physics/effects/atmosphericEntry.js';
import {
  airburstOverpressure,
  groundImpactOverpressure,
} from '../../src/physics/effects/airburstBlast.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../../src/physics/units.js';
import {
  ENTRY_PROGRAM_BODIES,
  entryProgramAltitudeAgrees,
  entryProgramPressureAgrees,
  entryProgramVerdict,
  type EntryProgramItem,
} from '../../src/physics/validation/entryProgramRules.js';

/**
 * Rules 143 and 144 of src/physics/validation/entryProgramRules.ts, the held-out
 * part. The program is asked by scripts/eiep-points.py (which also brings back
 * the breakup altitude); this writes what to ask and reads what came back.
 *
 *   pnpm exec tsx scripts/benchmark/entry-program-against-eiep.ts queries <queries.json>
 *   python3 scripts/eiep-points.py <queries.json> <answered.json>
 *   pnpm exec tsx scripts/benchmark/entry-program-against-eiep.ts score <answered.json> [<out.json>]
 */

interface Answer {
  key: string;
  rangeKm: number;
  error: string | null;
  burstAltitudeM: number | null;
  breakupAltitudeM?: number | null;
  overpressurePa: [number, number] | null;
}

const keyOf = (body: number, range: number) =>
  `body ${(body + 1).toString()} range ${(range + 1).toString()}`;

const [mode, ...args] = process.argv.slice(2);

if (mode === 'queries') {
  const [out] = args;
  if (out === undefined) throw new Error('queries <out.json>');
  const queries = ENTRY_PROGRAM_BODIES.flatMap((b, i) =>
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
  const items: (EntryProgramItem & { detail: string })[] = [];
  ENTRY_PROGRAM_BODIES.forEach((b, i) => {
    const v0 = b.velocityKmS * 1_000;
    const energy = 0.5 * (Math.PI / 6) * b.diameterM ** 3 * b.densityKgM3 * v0 * v0;
    const e = atmosphericEntry(
      m(b.diameterM),
      mps(v0),
      undefined,
      kgPerM3(b.densityKgM3),
      J(energy),
      degreesToRadians(deg(b.angleDeg)),
      'program'
    );
    const airburst = e.regime === 'COMPLETE_AIRBURST';
    const gf = e.energyFractionToGround;
    const push = (what: EntryProgramItem['what'], agrees: boolean | null, detail: string) =>
      items.push({ body: i + 1, kind: b.kind, what, agrees, detail });
    let altitudesRead = false;
    b.rangesKm.forEach((rangeKm, j) => {
      const a = answers.find((x) => x.key === keyOf(i, j));
      if (a?.error !== null || a.overpressurePa === null) {
        push('overpressure', null, `${rangeKm.toString()} km: ${a?.error ?? 'not answered'}`);
        return;
      }
      if (a.rangeKm !== rangeKm)
        throw new Error(`${keyOf(i, j)}: asked ${a.rangeKm.toString()} km`);
      const programAirburst = a.burstAltitudeM !== null;
      if (programAirburst !== airburst) {
        push(
          'regime',
          false,
          `${rangeKm.toString()} km: program ${programAirburst ? 'airburst' : 'ground'}, candidate ${e.regime}`
        );
        return;
      }
      if (!altitudesRead) {
        altitudesRead = true;
        if (a.breakupAltitudeM !== null && a.breakupAltitudeM !== undefined) {
          const model = e.breakupAltitude as number;
          push(
            'breakup altitude',
            entryProgramAltitudeAgrees(a.breakupAltitudeM, model),
            `${model.toFixed(1)} against ${a.breakupAltitudeM.toString()} m`
          );
        }
        if (programAirburst && a.burstAltitudeM !== null) {
          const model = e.burstAltitude as number;
          push(
            'burst altitude',
            entryProgramAltitudeAgrees(a.burstAltitudeM, model),
            `${model.toFixed(1)} against ${a.burstAltitudeM.toString()} m`
          );
        }
      }
      const groundRange = m(rangeKm * 1_000);
      const model = airburst
        ? (airburstOverpressure({
            groundRange,
            burstAltitude: e.burstAltitude,
            blastYield: J(e.blastYieldMegatons * 4.184e15),
          }) as number)
        : (groundImpactOverpressure({
            groundRange,
            virtualBurstAltitude: e.virtualBurstAltitude,
            blastYield: J(energy * Math.max(gf, 1 - gf)),
          }) as number);
      const printed = a.overpressurePa[0];
      push(
        'overpressure',
        entryProgramPressureAgrees(printed, model),
        `${rangeKm.toString()} km: ${model.toFixed(3)} against ${printed.toString()} Pa (×${(model / printed).toFixed(5)})`
      );
    });
  });
  for (const it of items) {
    console.log(
      `body ${it.body.toString().padStart(2)} ${it.kind.padEnd(8)} ${it.what.padEnd(16)} ${it.agrees === null ? 'apart  ' : it.agrees ? 'agrees ' : 'OUTSIDE'} ${it.detail}`
    );
  }
  const verdict = entryProgramVerdict(items);
  console.log(
    `\n${JSON.stringify(verdict)}\nRule 144, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/entryProgramRules.ts, rules 141 to 144', verdict, items }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: queries | score');
}
