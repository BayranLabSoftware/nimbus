/**
 * Rule 1251 (c) (`src/physics/validation/porta1BlastRules.ts`): the product's
 * static blast against the height-of-burst maps of Aftosmis, Mathias & Tarano
 * (2019)'s Fig. 5, as digitised in `porta1Hob250MtFigure.json` — (1) against
 * Glasstone & Dolan's 1 kt map, (2) against the 250 Mt Cart3D map, both in
 * km scaled to 1 kt (the product scales by the cube root of the yield alone,
 * so its scaled map is the same at every yield), and (3) which bodies the
 * product sends to complete airbursts above 5 Mt. Development only; nothing
 * in the product changes.
 *
 *   pnpm exec tsx scripts/porta1-hob-250mt.ts
 *
 * Writes src/physics/validation/porta1Hob250Mt.json and docs/PORTA1_HOB_250MT.md.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { airburstReach } from '../src/physics/effects/airburstBlast.js';
import { IMPACT_PRESETS, simulateImpact } from '../src/physics/simulate.js';
import { degreesToRadians, deg, J, kgPerM3, m, mps, Pa } from '../src/physics/units.js';

interface Reading {
  h: number;
  r: number[];
}
interface Figure {
  heightsKm1kt: number[];
  curves: Record<string, { glasstoneDolan1kt: Reading[]; cartesian3d250Mt: Reading[] }>;
}

const figure = JSON.parse(
  readFileSync('src/physics/validation/porta1Hob250MtFigure.json', 'utf8')
) as Figure;

const KT = 4.184e12;
const PSI = 6_894.757;
const round = (x: number, d = 3): number => Math.round(x * 10 ** d) / 10 ** d;

/** The product's farthest scaled ground range (km at 1 kt) of a threshold. */
function productReach(psi: number, hKm: number, yieldJ = KT): number {
  const s = Math.cbrt(yieldJ / KT);
  return (airburstReach(Pa(psi * PSI), m(hKm * 1_000 * s), J(yieldJ)) as number) / 1_000 / s;
}

/** A curve's farthest range at a height, or 0 where it is not reached. */
const outer = (rows: Reading[], h: number): number | null => {
  const row = rows.find((x) => x.h === h);
  return row === undefined ? null : Math.max(...row.r);
};

// The product's similarity, checked: its scaled reach at 250 Mt is its reach at 1 kt.
const similarity = Math.max(
  ...[1, 2, 4, 10].flatMap((psi) =>
    figure.heightsKm1kt.map((h) =>
      Math.abs(productReach(psi, h, 250e6 * 4.184e9) - productReach(psi, h))
    )
  )
);

const thresholds = [1, 2, 4, 10].map((psi) => {
  const c = figure.curves[`${String(psi)} psi`];
  if (c === undefined) throw new Error(`no curve at ${String(psi)} psi`);
  const rows = figure.heightsKm1kt.map((h) => {
    const product = productReach(psi, h);
    const gd = outer(c.glasstoneDolan1kt, h);
    const cfd = outer(c.cartesian3d250Mt, h);
    return {
      hKm1kt: h,
      productKm1kt: round(product),
      glasstoneDolanKm1kt: gd,
      cfd250MtKm1kt: cfd,
      productOverGD: gd !== null && gd > 0 ? round(product / gd, 2) : null,
      productOverCFD: cfd !== null && cfd > 0 ? round(product / cfd, 2) : null,
    };
  });
  const best = (key: 'productKm1kt' | 'glasstoneDolanKm1kt' | 'cfd250MtKm1kt') => {
    let top = { h: 0, r: 0 };
    for (const x of rows) {
      const r = x[key];
      if (r !== null && r > top.r) top = { h: x.hKm1kt, r };
    }
    return top;
  };
  return {
    psi,
    rows,
    largest: {
      product: best('productKm1kt'),
      glasstoneDolan: best('glasstoneDolanKm1kt'),
      cfd250Mt: best('cfd250MtKm1kt'),
    },
  };
});

// (3) The bodies the product sends to complete airbursts above 5 Mt.
const grid: {
  diameterM: number;
  speedKms: number;
  angleDeg: number;
  densityKgM3: number;
  blastMt: number;
  burstKm: number;
  burstKm1kt: number;
}[] = [];
const template = IMPACT_PRESETS.TUNGUSKA.input;
let runs = 0;
for (const diameterM of [30, 40, 50, 60, 80, 100, 120, 150, 200, 250])
  for (const speedKms of [12, 17, 20, 25])
    for (const angleDeg of [15, 30, 45, 60, 90])
      for (const densityKgM3 of [1_500, 2_600, 3_300]) {
        runs++;
        const r = simulateImpact({
          ...template,
          impactorDiameter: m(diameterM),
          impactVelocity: mps(speedKms * 1_000),
          impactAngle: degreesToRadians(deg(angleDeg)),
          impactorDensity: kgPerM3(densityKgM3),
        });
        if (r.entry.regime !== 'COMPLETE_AIRBURST' || !(r.entry.blastYieldMegatons > 5)) continue;
        const burstKm = (r.entry.burstAltitude as number) / 1_000;
        grid.push({
          diameterM,
          speedKms,
          angleDeg,
          densityKgM3,
          blastMt: round(r.entry.blastYieldMegatons, 1),
          burstKm: round(burstKm, 1),
          burstKm1kt: round(burstKm / Math.cbrt(r.entry.blastYieldMegatons * 1_000), 3),
        });
      }

const out = {
  rule: '1251 (c)',
  similarityKm1kt: similarity,
  thresholds,
  airburstsAbove5Mt: { runs, count: grid.length, bodies: grid },
};
writeFileSync('src/physics/validation/porta1Hob250Mt.json', `${JSON.stringify(out, null, 1)}\n`);

const f = (x: number | null): string => (x === null ? '—' : String(x));
const lines = [
  '# Porta 1 — the product against the 250 Mt height-of-burst map (rule 1251)',
  '',
  'Aftosmis, Mathias & Tarano (2019), Fig. 5, digitised as rule 1251 (b) sets out (`src/physics/validation/porta1Hob250MtFigure.json`; ±0.006 km of range and ±0.005 km of height, 1 kt scaled). Ranges are the farthest ground range at each simulated burst height, in km scaled to 1 kt; the product scales by the cube root of the yield alone (its scaled reach at 250 Mt differs from its reach at 1 kt by at most ' +
    String(similarity) +
    ' km), so one column serves both maps. Development only; nothing in the product changed.',
  '',
];
for (const t of thresholds) {
  lines.push(
    `## ${String(t.psi)} psi`,
    '',
    `Largest reach — product ${String(round(t.largest.product.r))} km at ${String(t.largest.product.h)} km; Glasstone & Dolan ${String(t.largest.glasstoneDolan.r)} km at ${String(t.largest.glasstoneDolan.h)} km; 250 Mt ${String(t.largest.cfd250Mt.r)} km at ${String(t.largest.cfd250Mt.h)} km.`,
    '',
    '| Height (km, 1 kt) | Product | Glasstone & Dolan | 250 Mt | Product / G&D | Product / 250 Mt |',
    '| --: | --: | --: | --: | --: | --: |',
    ...t.rows.map(
      (x) =>
        `| ${String(x.hKm1kt)} | ${String(x.productKm1kt)} | ${f(x.glasstoneDolanKm1kt)} | ${f(x.cfd250MtKm1kt)} | ${f(x.productOverGD)} | ${f(x.productOverCFD)} |`
    ),
    ''
  );
}
lines.push(
  '## The bodies it could move',
  '',
  `Of ${String(runs)} bodies (30 to 250 m; 12 to 25 km/s; 15° to 90°; 1 500, 2 600 and 3 300 kg/m³), the product sends ${String(grid.length)} to a complete airburst above 5 Mt.`,
  '',
  '| Diameter (m) | Speed (km/s) | Angle (°) | Density (kg/m³) | Blast (Mt) | Burst (km) | Burst (km, 1 kt) |',
  '| --: | --: | --: | --: | --: | --: | --: |',
  ...grid.map(
    (g) =>
      `| ${String(g.diameterM)} | ${String(g.speedKms)} | ${String(g.angleDeg)} | ${String(g.densityKgM3)} | ${String(g.blastMt)} | ${String(g.burstKm)} | ${String(g.burstKm1kt)} |`
  ),
  ''
);
writeFileSync('docs/PORTA1_HOB_250MT.md', lines.join('\n'));
console.log(
  JSON.stringify(
    {
      similarity,
      largest: thresholds.map((t) => ({ psi: t.psi, ...t.largest })),
      count: grid.length,
      runs,
    },
    null,
    1
  )
);
