/**
 * Rule 328 of `src/physics/validation/wiredStrikeRules.ts`: what the wiring
 * does to the calibration net, row by row, before and after.
 *
 *   pnpm exec tsx scripts/benchmark/wired-strike.ts
 */

import {
  NET_WITHOUT_STRIKE_LOOKUP,
  RECORDED_EVENTS,
  compareWithRecord,
} from '../../src/physics/validation/recordedTolls.js';
import { shippedStrikeAnswer } from '../../src/physics/validation/shippedFaults.js';
import { amendmentHolds, type TollBias } from '../../src/physics/validation/wiredStrikeRules.js';

function stats(ratios: readonly number[]): TollBias {
  const ln = ratios.filter((r) => Number.isFinite(r) && r > 0).map(Math.log);
  const mean = ln.reduce((a, b) => a + b, 0) / ln.length;
  const variance =
    ln.length > 1 ? ln.reduce((a, b) => a + (b - mean) ** 2, 0) / (ln.length - 1) : 0;
  return { bias: Math.exp(mean), sigma: Math.sqrt(variance), rows: ln.length };
}

console.log(
  '| riga | strike prima | strike dopo | sorgente | morti prima | morti dopo | record | banda prima | banda dopo |'
);
console.log('| --- | --: | --: | --- | --: | --: | --: | --- | --- |');

const before: number[] = [];
const after: number[] = [];
let leftBand = 0;
let moved = 0;

for (const event of RECORDED_EVENTS) {
  const plain = NET_WITHOUT_STRIKE_LOOKUP.find((e) => e.name === event.name);
  if (plain === undefined) continue;
  const oldResult = plain.run();
  if (oldResult.type !== 'earthquake') continue;
  const newResult = event.run();
  if (newResult.type !== 'earthquake') continue;

  const oldStrike = oldResult.data.inputs.strikeAzimuthDeg;
  const newStrike = newResult.data.inputs.strikeAzimuthDeg;
  const answer =
    oldStrike === undefined
      ? shippedStrikeAnswer(
          event.latitude,
          event.longitude,
          oldResult.data.inputs.depth ?? 10_000,
          oldResult.data.ruptureLength
        )
      : null;

  const oldToll = compareWithRecord(plain);
  const newToll = compareWithRecord(event);
  before.push(oldToll.ratio);
  after.push(newToll.ratio);
  if (oldToll.deaths !== newToll.deaths) moved += 1;
  if (event.gated && oldToll.contains && !newToll.contains) leftBand += 1;

  console.log(
    `| ${event.name} | ${oldStrike?.toFixed(0) ?? 'nord'}° | ${newStrike?.toFixed(0) ?? 'nord'}° | ${answer?.source ?? 'preset'} | ${oldToll.deaths.toFixed(0)} | ${newToll.deaths.toFixed(0)} | ${event.recordedDeaths.toFixed(0)} | ${oldToll.contains ? 'dentro' : 'FUORI'} | ${newToll.contains ? 'dentro' : 'FUORI'} |`
  );
}

const a = stats(before);
const b = stats(after);
console.log('');
console.log(`righe mosse: ${moved.toString()} su ${before.length.toString()}`);
console.log(
  `326(b) bias ${a.bias.toFixed(3)} -> ${b.bias.toFixed(3)}, σ ${a.sigma.toFixed(3)} -> ${b.sigma.toFixed(3)}  ->  ${amendmentHolds(a, b) ? 'DENTRO' : 'FUORI'}`
);
console.log(
  `326(a) righe uscite dalla banda: ${leftBand.toString()}  ->  ${leftBand === 0 ? 'DENTRO' : 'FUORI'}`
);
