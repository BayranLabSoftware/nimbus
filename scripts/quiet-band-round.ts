import { UNSEEN_EARTHQUAKES } from '../src/physics/validation/unseenSetData.js';
import { UNSEEN_SITES } from '../src/physics/validation/unseenSiteData.js';
import { siteVs30 } from '../src/physics/validation/siteVs30.js';
import { isQuiet } from '../src/physics/validation/depthRules.js';
import { unseenEarthquakeEvent } from '../src/physics/validation/unseenSet.js';
import {
  centralEstimate,
  sampleToll,
  type RecordedEvent,
} from '../src/physics/validation/recordedTolls.js';
import { simulateEarthquake } from '../src/physics/events/earthquake/simulate.js';
import { shippedDipAnswer } from '../src/physics/validation/shippedFaults.js';
import {
  bandWidthLn,
  corroboratesRefusal,
  medianOf,
  QUIET_TOLL_THRESHOLD,
} from '../src/physics/validation/quietBandRules.js';

/**
 * The round of rules 435 to 439: what the quiet earthquakes say about the
 * geometry rule 433(d) refused.
 *
 * It adopts nothing. It measures and prints, and rule 438 says which way
 * the evidence falls.
 *
 * Usage:
 *   pnpm exec tsx scripts/quiet-band-round.ts
 */

const SITES = new Map(UNSEEN_SITES.map((s) => [s.key, s]));
const ground = (row: { comcat: string }): number | undefined =>
  siteVs30('pick', SITES.get(row.comcat));

/** Rule 436: arm C — the projection, the stadium at every magnitude, and
 *  the dip of the structure the strike came from. */
function asArmC(event: RecordedEvent): RecordedEvent {
  const run = event.run;
  return {
    ...event,
    run: () => {
      const result = run();
      if (result.type !== 'earthquake') return result;
      const settings = {
        ...result.data.inputs,
        stadiumWidth: 'surfaceProjection' as const,
        extendedSource: 'always' as const,
      };
      const first = simulateEarthquake(settings);
      const dip = shippedDipAnswer(
        event.latitude,
        event.longitude,
        (first.inputs.depth as number | undefined) ?? 10_000,
        first.ruptureLength
      );
      return {
        type: 'earthquake',
        data: simulateEarthquake(dip === null ? settings : { ...settings, dipDeg: dip.dipDeg }),
      };
    },
  };
}

interface Loud {
  id: string;
  magnitude: number;
  place: string;
  deaths: number;
}

function measure(arm: 'in place' | 'arm C'): {
  loud: Loud[];
  reachesZero: number;
  banded: number;
  widths: number[];
} {
  const loud: Loud[] = [];
  const widths: number[] = [];
  let reachesZero = 0;
  let banded = 0;
  for (const row of UNSEEN_EARTHQUAKES.filter(isQuiet)) {
    const base = unseenEarthquakeEvent(row, { vs30: ground(row) });
    const event = arm === 'in place' ? base : asArmC(base);
    const deaths = centralEstimate(event)?.deaths ?? 0;
    if (deaths >= QUIET_TOLL_THRESHOLD) {
      loud.push({ id: row.comcat, magnitude: row.magnitude, place: row.place, deaths });
    }
    const band = sampleToll(event);
    if (band === null) continue;
    banded += 1;
    if (band.low.deaths <= 0) reachesZero += 1;
    const width = bandWidthLn(band.low.deaths, band.high.deaths);
    if (width !== null) widths.push(width);
  }
  return { loud, reachesZero, banded, widths };
}

function main(): void {
  const quiet = UNSEEN_EARTHQUAKES.filter(isQuiet).length;
  console.log(`rule 435: ${quiet.toString()} quiet earthquakes\n`);

  const a = measure('in place');
  const b = measure('arm C');

  console.log('### rules 437(a) to (c)');
  console.log('| arm | toll >= 10 | share | band reaches zero | median band width (ln) |');
  console.log('| --- | --- | --- | --- | --- |');
  for (const [name, m] of [
    ['in place', a],
    ['arm C', b],
  ] as const) {
    const width = medianOf(m.widths);
    console.log(
      `| ${name} | ${m.loud.length.toString()} | ${((100 * m.loud.length) / quiet).toFixed(1)} % | ` +
        `${m.reachesZero.toString()} of ${m.banded.toString()} | ${width === null ? '—' : width.toFixed(2)} |`
    );
  }

  console.log('\n### rule 437(d) — every quiet earthquake raised to ten or more');
  const ids = new Set([...a.loud, ...b.loud].map((l) => l.id));
  const byId = (m: Loud[]): Map<string, Loud> => new Map(m.map((l) => [l.id, l]));
  const aById = byId(a.loud);
  const bById = byId(b.loud);
  const rows = [...ids]
    .map((id) => ({ id, a: aById.get(id), b: bById.get(id) }))
    .sort((x, y) => (y.b?.deaths ?? y.a?.deaths ?? 0) - (x.b?.deaths ?? x.a?.deaths ?? 0));
  for (const r of rows) {
    const any = r.a ?? r.b;
    if (any === undefined) continue;
    const mark = r.a === undefined ? ' NEW' : r.b === undefined ? ' GONE' : '';
    console.log(
      `  ${r.id.padEnd(11)} Mw ${any.magnitude.toFixed(1)}  in place ${(r.a?.deaths ?? 0).toFixed(0).padStart(6)}  ` +
        `arm C ${(r.b?.deaths ?? 0).toFixed(0).padStart(6)}${mark.padEnd(5)}  ${any.place}`
    );
  }

  console.log('\n### rule 438 — which way the evidence falls');
  const corroborates = corroboratesRefusal(a.loud.length, b.loud.length);
  console.log(
    `  count ${a.loud.length.toString()} → ${b.loud.length.toString()} ` +
      `(${(b.loud.length - a.loud.length >= 0 ? '+' : '') + (b.loud.length - a.loud.length).toString()}) → ` +
      (corroborates ? 'CORROBORATES the refusal of arm C' : 'does NOT corroborate it')
  );
}

main();
