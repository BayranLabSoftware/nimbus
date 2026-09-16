import { writeFileSync } from 'node:fs';
import { runSlideWave } from '../../src/physics/validation/slideWaveRun.js';
import {
  SLIDE_WAVE_BIAS_BOUND,
  SLIDE_WAVE_SIGMA_BOUND,
} from '../../src/physics/validation/slideWaveRules.js';
import {
  SLIDE_WAVE_FILTERED,
  SLIDE_WAVE_NO_WATER,
} from '../../src/physics/validation/slideWaveSetData.js';

/**
 * Rules 118 to 121 of src/physics/validation/slideWaveRules.ts, run once and
 * printed: the wave Nimbus raises at a landslide against the wave somebody
 * measured at twenty-six of them.
 *
 *   pnpm exec tsx scripts/benchmark/slide-wave.ts [<out.json>]
 */

const run = runSlideWave();
const line = (
  name: string,
  r: { rows: number; bias: number; sigmaLn: number; withinTwo: number }
): string =>
  `  ${name.padEnd(34)} n=${r.rows.toString().padStart(3)}  gm=${r.bias.toFixed(3).padStart(7)}  sigma=${r.sigmaLn.toFixed(3).padStart(6)}  within x2=${(100 * r.withinTwo).toFixed(0).padStart(3)} %`;

console.log(
  `${SLIDE_WAVE_FILTERED.toString()} rows passed rule 118, ${SLIDE_WAVE_NO_WATER.toString()} found no water, ${run.rows.length.toString()} scored`
);
console.log(
  `  slope from the catalogue on ${run.slopesFromCatalogue.toString()}/${run.rows.length.toString()}, width on ${run.widthsFromCatalogue.toString()}/${run.rows.length.toString()}, outside one of Heller's ranges on ${run.outsideAnyRange.toString()}/${run.rows.length.toString()}`
);
console.log('\nrule 121 decides on this one — a height against a height:');
console.log(line("Heller's crest + trough", run.heller));
console.log(
  `  L2 asks bias within x${SLIDE_WAVE_BIAS_BOUND.toString()} and sigma <= ${SLIDE_WAVE_SIGMA_BOUND.toString()}: ${run.hellerMeetsL2 ? 'MET' : 'NOT MET'}`
);
for (const c of run.byWaterBody) console.log(line(`  ${c.body}`, c.heller));

console.log('\nprinted, deciding nothing (rule 120) — an amplitude against a height:');
console.log(line('project law, subaerial', run.projectSubaerial));
console.log(line('project law, submarine', run.projectSubmarine));
console.log(line('heller as the product draws it', run.hellerAsDrawn));

console.log('\nevent by event:');
console.log(
  `  ${'event'.padEnd(36)}${'record'.padStart(8)}${'Heller'.padStart(9)}${'proj sub-a'.padStart(11)}${'proj sub-m'.padStart(11)}  outside`
);
for (const r of [...run.rows].sort((a, b) => b.recordM - a.recordM)) {
  console.log(
    `  ${r.event.event.padEnd(36)}${r.recordM.toFixed(1).padStart(8)}${r.hellerHeightM.toFixed(1).padStart(9)}${r.projectSubaerialM.toFixed(1).padStart(11)}${r.projectSubmarineM.toFixed(1).padStart(11)}  ${r.outside.join(',')}`
  );
}

const out = process.argv[2];
if (out !== undefined) writeFileSync(out, `${JSON.stringify(run, null, 1)}\n`);
