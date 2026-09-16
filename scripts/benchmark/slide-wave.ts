import { writeFileSync } from 'node:fs';
import { runSlideWave } from '../../src/physics/validation/slideWaveRun.js';
import {
  SLIDE_WAVE_BIAS_BOUND,
  SLIDE_WAVE_PEAK_BAND,
  SLIDE_WAVE_PEAK_MIDPOINT,
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
console.log("\nrule 125 decides on this one — Heller's height against the peak height:");
console.log(line('against Peak height', run.againstPeak));
console.log(
  `  rule 124's band is ${SLIDE_WAVE_PEAK_BAND[0].toString()} to ${SLIDE_WAVE_PEAK_BAND[1].toString()}, midpoint ${SLIDE_WAVE_PEAK_MIDPOINT.toFixed(3)}; rule 125 allows x${SLIDE_WAVE_BIAS_BOUND.toString()} either way of it (${(SLIDE_WAVE_PEAK_MIDPOINT / SLIDE_WAVE_BIAS_BOUND).toFixed(3)} to ${(SLIDE_WAVE_PEAK_MIDPOINT * SLIDE_WAVE_BIAS_BOUND).toFixed(3)}) at sigma <= ${SLIDE_WAVE_SIGMA_BOUND.toString()}: ${run.peakMeetsL2 ? 'MET' : 'NOT MET'}`
);
console.log('\nprinted beside it (rule 123), deciding nothing:');
console.log(line('against Run-up h alone', run.againstRunUp));
console.log(line('against Wave h max (rule 120)', run.heller));
for (const c of run.byWaterBody) console.log(line(`  ${c.body}`, c.heller));

console.log('\nprinted, deciding nothing (rule 120) — an amplitude against a height:');
console.log(line('project law, subaerial', run.projectSubaerial));
console.log(line('project law, submarine', run.projectSubmarine));
console.log(line('heller as the product draws it', run.hellerAsDrawn));

console.log('\nevent by event:');
console.log(
  `  ${'event'.padEnd(36)}${'peak'.padStart(8)}${'run-up'.padStart(8)}${'gauge'.padStart(8)}${'Heller'.padStart(9)}  outside`
);
for (const r of [...run.rows].sort((a, b) => b.peakM - a.peakM)) {
  console.log(
    `  ${r.event.event.padEnd(36)}${r.peakM.toFixed(1).padStart(8)}${r.runUpM.toFixed(1).padStart(8)}${r.recordM.toFixed(1).padStart(8)}${r.hellerHeightM.toFixed(1).padStart(9)}  ${r.outside.join(',')}`
  );
}

const out = process.argv[2];
if (out !== undefined) writeFileSync(out, `${JSON.stringify(run, null, 1)}\n`);
