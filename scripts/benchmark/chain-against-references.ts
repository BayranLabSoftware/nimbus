import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { applyIntentToStore, decodeUrl } from '../../src/store/urlState.js';
import { useAppStore } from '../../src/store/useAppStore.js';
import {
  kingeryBulmashRange,
  TNT_KG_PER_KILOTON,
} from '../../src/physics/effects/kingeryBulmash.js';
import { plumeHeight } from '../../src/physics/events/volcano/plumeHeight.js';
import { Pa } from '../../src/physics/units.js';

/**
 * The chain against the field's own references, on the scenarios a visitor
 * would build.
 *
 * The rules of docs/GOLD_STANDARD.md hold the *modules* to the field's tools on
 * grids that cover the input space. What no rule reads is the chain a visitor
 * actually runs: a link, the store's own derivations, the scenario the panel
 * builds, the numbers the report prints. A unit lost between two of those
 * layers would pass every test in the repository.
 *
 * So: build the scenario from its link exactly as the application does, take
 * the numbers the report would print, and put them beside the reference's
 * answer for the same inputs.
 *
 *   pnpm exec tsx scripts/benchmark/chain-against-references.ts [out.json]
 *
 * References read here, all offline:
 *   - Kingery–Bulmash (Swisdak 1994, `effects/kingeryBulmash.ts`) for a
 *     chemical charge's rings;
 *   - Mastin et al. (2009) for an eruption column.
 * The Earth Impact Effects Program is a web service and is asked by
 * `scripts/eiep-fireballs.py`; this file stays offline so it can run in CI.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

interface Row {
  scenario: string;
  quantity: string;
  chain: number;
  reference: number;
  ratio: number;
}

const rows: Row[] = [];

function fromLink(query: string): void {
  applyIntentToStore(decodeUrl(`http://localhost/?${query}`), useAppStore.getState());
}

// ---- a chemical charge, against Kingery–Bulmash ---------------------------
for (const tonnes of [0.5, 5, 50, 500, 5_000]) {
  fromLink(
    `v=1&p=CUSTOM&t=explosion&ct=chemical&y=${(tonnes / 1e6).toString()}&h=0&lat=40.75&lon=14.35`
  );
  const state = useAppStore.getState();
  const input = state.explosion.input;
  const { simulateExplosion } = await import('../../src/physics/events/explosion/simulate.js');
  const result = simulateExplosion(input);
  const charge = result.yield.kilotons * TNT_KG_PER_KILOTON;
  const rings: [string, number, number][] = [
    ['5 psi', result.blast.overpressure5psiRadius, 34_474],
    ['1 psi', result.blast.overpressure1psiRadius, 6_895],
    ['0.5 psi', result.blast.lightDamageRadius, 3_447],
  ];
  for (const [label, chain, pascals] of rings) {
    const reference = kingeryBulmashRange(charge, Pa(pascals)) as number;
    rows.push({
      scenario: `${tonnes.toString()} t of TNT on the ground`,
      quantity: `${label} ring`,
      chain,
      reference,
      ratio: reference > 0 ? chain / reference : Number.NaN,
    });
  }
}

// ---- an eruption column, against Mastin et al. 2009 -----------------------
for (const rate of [500, 5_000, 150_000, 1e6, 1e7]) {
  fromLink(
    `v=1&p=CUSTOM&t=volcano&ver=${rate.toString()}&vol=2500000000&ws=15&lat=40.75&lon=14.35`
  );
  const state = useAppStore.getState();
  const { simulateVolcano } = await import('../../src/physics/events/volcano/simulate.js');
  const result = simulateVolcano(state.volcano.input);
  const reference = plumeHeight({ volumeEruptionRate: state.volcano.input.volumeEruptionRate });
  rows.push({
    scenario: `${rate.toExponential(0)} m³/s of magma`,
    quantity: 'plume height',
    chain: result.plumeHeight,
    reference: reference,
    ratio: (result.plumeHeight as number) / (reference as number),
  });
}

const worst = rows.reduce(
  (acc, r) => (Math.abs(Math.log(r.ratio)) > Math.abs(Math.log(acc.ratio)) ? r : acc),
  rows[0] ?? { scenario: '', quantity: '', chain: 0, reference: 0, ratio: 1 }
);

const out = {
  what: 'the chain a visitor runs, against the field’s references on the same inputs',
  rows,
  worstRatio: worst.ratio,
  worstRow: `${worst.scenario} — ${worst.quantity}`,
};
const target = process.argv[2] ?? join(ROOT, 'benchmark', 'results', 'chain-2026-09-18.json');
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(out, null, 1)}\n`);

for (const row of rows) {
  console.log(
    `${row.scenario.padEnd(28)} ${row.quantity.padEnd(14)} chain ${row.chain.toFixed(1).padStart(10)}  reference ${row.reference
      .toFixed(1)
      .padStart(10)}  ${row.ratio.toFixed(5)}`
  );
}
console.log(`\nworst ${worst.ratio.toFixed(5)} on ${worst.scenario} — ${worst.quantity}`);
console.log(`wrote ${target}`);
