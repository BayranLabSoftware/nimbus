import { writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  OGBURN_2016_MOBILITY,
  OGBURN_X_ORIGIN_M3,
  POOLED_FIT,
  pdcMobilityBandLn,
  pdcMobilityHoverL,
} from '../../src/physics/effects/pdcMobility.js';
import { pyroclasticRunout } from '../../src/physics/events/volcano/pyroclasticRunout.js';
import {
  PDC_COLLAPSE_HEIGHT_FRACTION,
  pdcRunoutEnergyLine,
} from '../../src/physics/events/volcano/extendedEffects.js';
import { plumeHeight } from '../../src/physics/events/volcano/plumeHeight.js';
import { m } from '../../src/physics/units.js';

/**
 * Rules 220 to 226 of src/physics/validation/pdcMobilityRules.ts, run once: the
 * published mobility against the two relations in place, at the volumes the
 * project's presets carry, and the volume the law would need to reproduce each
 * reach the project already quotes.
 *
 *   pnpm exec tsx scripts/benchmark/pdc-mobility.ts [<out.json>]
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Row {
  event: string;
  /** Bulk erupted volume the preset carries (m³). */
  eruptedM3: number;
  /** Mass eruption rate, where the preset gives one. */
  rate: number | null;
  /** Vertical relief from the vent to where the current stopped (m), and the
   *  reach itself, for the events this project already quotes. Both null where
   *  the project quotes none. */
  reliefM: number | null;
  observedReachM: number | null;
  /** Why the row cannot decide anything, where it cannot. */
  disqualified: string | null;
}

/**
 * The reliefs are the edifice's own, which is what a Heim coefficient is
 * measured over: Mount St Helens before 18 May 1980 stood at 2 950 m over a
 * base near 1 100 m; Vesuvius's cone tops 1 281 m over the bay; Unzen's Fugen-
 * dake reached about 1 360 m over the Shimabara plain.
 */
const ROWS: readonly Row[] = [
  {
    event: 'Unzen 1991 (dome collapse)',
    eruptedM3: 2.0e7,
    rate: null,
    reliefM: 1_360,
    observedReachM: 3_200,
    disqualified: null,
  },
  {
    event: 'Mount St Helens 1980',
    eruptedM3: 1.2e9,
    rate: 4e4,
    reliefM: 1_850,
    observedReachM: 8_000,
    disqualified: "the preset's eruption rate was tuned to the observed plume, which sets the drop",
  },
  {
    event: 'Vesuvius 79 CE',
    eruptedM3: 2.5e9,
    rate: 1.5e5,
    reliefM: 1_281,
    observedReachM: 9_000,
    disqualified: "the preset's volume was lowered to bring the reach into the observed band",
  },
  {
    event: 'Fuego 2018',
    eruptedM3: 4.9e7,
    rate: null,
    reliefM: 2_500,
    observedReachM: 11_700,
    disqualified: 'a held-out anchor: reading it for a model choice would spend it',
  },
  {
    event: 'Krakatau 1883',
    eruptedM3: 2.0e10,
    rate: null,
    reliefM: null,
    observedReachM: null,
    disqualified: null,
  },
  {
    event: 'Tambora 1815',
    eruptedM3: 1.4e11,
    rate: null,
    reliefM: null,
    observedReachM: null,
    disqualified: null,
  },
];

/** The volume the law would need to give this mobility (m³). */
function volumeForMobility(hOverL: number): number {
  const x = (Math.log10(hOverL) - POOLED_FIT.intercept) / POOLED_FIT.slope;
  return OGBURN_X_ORIGIN_M3 * 10 ** x;
}

const out = ROWS.map((r) => {
  const hOverL = pdcMobilityHoverL(r.eruptedM3);
  const bandLn = pdcMobilityBandLn(r.eruptedM3);
  const kv = pyroclasticRunout({ ejectaVolume: r.eruptedM3 }) as number;
  const plume = r.rate === null ? null : (plumeHeight({ volumeEruptionRate: r.rate }) as number);
  const drop = plume === null ? null : plume * PDC_COLLAPSE_HEIGHT_FRACTION;
  const lineInPlace = plume === null ? null : (pdcRunoutEnergyLine(m(plume)) as number);
  const lineWithLaw = drop === null ? null : drop / hOverL;
  const observedMobility =
    r.reliefM === null || r.observedReachM === null ? null : r.reliefM / r.observedReachM;
  return {
    event: r.event,
    eruptedM3: r.eruptedM3,
    hOverLFromLaw: hOverL,
    bandFactor: Math.exp(bandLn),
    reachKvM: kv,
    reachEnergyLineInPlaceM: lineInPlace,
    reachEnergyLineWithLawM: lineWithLaw,
    observedReachM: r.observedReachM,
    observedMobility,
    /** Rule 226's arithmetic: what flow volume the published law would need to
     *  give the mobility this event actually had. */
    volumeTheLawWouldNeedM3: observedMobility === null ? null : volumeForMobility(observedMobility),
    disqualified: r.disqualified,
  };
});

const f = (x: number | null, d = 1): string => (x === null ? '—' : x.toFixed(d));
console.log(
  `pooled fit (median of five): α ${POOLED_FIT.intercept.toFixed(3)}, β ${POOLED_FIT.slope.toFixed(3)}`
);
console.log(
  `\n| event | V erupted | H/L (law) | band | K·V^⅓ km | line in place km | line + law km | observed km | H/L observed | V the law needs |`
);
console.log('| --- | --: | --: | --: | --: | --: | --: | --: | --: | --: |');
for (const r of out) {
  console.log(
    `| ${r.event} | ${r.eruptedM3.toExponential(1)} | ${r.hOverLFromLaw.toFixed(4)} | ×${r.bandFactor.toFixed(2)} | ${f(r.reachKvM === 0 ? null : r.reachKvM / 1000)} | ${f(r.reachEnergyLineInPlaceM === null ? null : r.reachEnergyLineInPlaceM / 1000)} | ${f(r.reachEnergyLineWithLawM === null ? null : r.reachEnergyLineWithLawM / 1000)} | ${f(r.observedReachM === null ? null : r.observedReachM / 1000)} | ${f(r.observedMobility, 3)} | ${r.volumeTheLawWouldNeedM3 === null ? '—' : r.volumeTheLawWouldNeedM3.toExponential(1)} |`
  );
}
console.log('\nTable 1, as transcribed:');
for (const [name, fit] of Object.entries(OGBURN_2016_MOBILITY.fits)) {
  console.log(
    `  ${name.padEnd(16)} β ${fit.slope.toFixed(3)}  α ${fit.intercept.toFixed(3)}  H/L at the origin ${(10 ** fit.intercept).toFixed(3)}`
  );
}

const target = process.argv[2];
if (target !== undefined) {
  writeFileSync(
    resolve(ROOT, target),
    `${JSON.stringify({ track: 'V1-flows', readOn: '2026-09-19', pooled: POOLED_FIT, rows: out }, null, 1)}\n`
  );
  console.log(`\nwrote ${target}`);
}
