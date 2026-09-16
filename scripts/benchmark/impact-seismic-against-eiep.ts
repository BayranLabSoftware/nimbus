import { readFileSync, writeFileSync } from 'node:fs';
import {
  candidateSeismicMagnitude,
  IMPACT_SEISMIC_BODIES,
  impactSeismicVerdict,
  seismicBodyAgreements,
  type SeismicLevelAgreement,
} from '../../src/physics/validation/impactSeismicRules.js';

/**
 * Rules 156 and 157 of src/physics/validation/impactSeismicRules.ts, the
 * held-out part. The program is asked by scripts/eiep-points.py; this writes
 * what to ask and reads what came back.
 *
 *   pnpm exec tsx scripts/benchmark/impact-seismic-against-eiep.ts queries <queries.json>
 *   python3 scripts/eiep-points.py <queries.json> <answered.json>
 *   pnpm exec tsx scripts/benchmark/impact-seismic-against-eiep.ts score <answered.json> [<out.json>]
 */

interface Answer {
  key: string;
  error: string | null;
  burstAltitudeM: number | null;
  seismicRadiiM: [number, number][] | null;
}

const [mode, ...args] = process.argv.slice(2);

if (mode === 'queries') {
  const [out] = args;
  if (out === undefined) throw new Error('queries <out.json>');
  const queries = IMPACT_SEISMIC_BODIES.map((b, i) => ({
    key: `body ${(i + 1).toString()}`,
    ...b,
    rangeKm: 100,
  }));
  writeFileSync(out, `${JSON.stringify(queries, null, 1)}\n`);
} else if (mode === 'score') {
  const [answeredPath, out] = args;
  if (answeredPath === undefined) throw new Error('score <answered.json> [out]');
  const answers = (JSON.parse(readFileSync(answeredPath, 'utf8')) as { rows: Answer[] }).rows;
  const perBody: (SeismicLevelAgreement[] | null)[] = [];
  const lines: Record<string, unknown>[] = [];
  IMPACT_SEISMIC_BODIES.forEach((b, i) => {
    const key = `body ${(i + 1).toString()}`;
    const a = answers.find((x) => x.key === key);
    const { magnitude, airburst } = candidateSeismicMagnitude(b);
    if (a?.error !== null || a.seismicRadiiM === null) {
      perBody.push(null);
      lines.push({ body: i + 1, apart: a?.error ?? 'no rings' });
      console.log(`${key}: apart (${a?.error ?? 'no rings'})`);
      return;
    }
    const rings = a.seismicRadiiM.map(([, r]) => r);
    const agreements = seismicBodyAgreements(magnitude, rings);
    perBody.push(agreements);
    lines.push({
      body: i + 1,
      candidateAirburst: airburst,
      programAirburst: a.burstAltitudeM !== null,
      candidateMagnitude: magnitude,
      ringsM: rings,
      agreements,
    });
    console.log(
      `${key} ${airburst ? 'air   ' : 'ground'} M ${magnitude.toFixed(4)}  ${agreements.join(' ')}`
    );
  });
  const verdict = impactSeismicVerdict(perBody);
  console.log(
    `\n${JSON.stringify(verdict)}\nRule 157, held-out part: ${verdict.heldOutPasses ? 'PASSES (the release gate is read next)' : 'FAILS — refused'}`
  );
  if (out !== undefined) {
    writeFileSync(
      out,
      `${JSON.stringify({ rules: 'src/physics/validation/impactSeismicRules.ts, rules 154 to 157', verdict, bodies: lines }, null, 1)}\n`
    );
  }
} else {
  throw new Error('mode: queries | score');
}
