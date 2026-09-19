import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { simulateEarthquake } from '../../src/physics/events/earthquake/simulate.js';
import { m } from '../../src/physics/units.js';

/**
 * E1's two columns on the same sources: ShakeMap's own scenario against the
 * product's rings.
 *
 *   pnpm exec tsx scripts/benchmark/shakemap-against-nimbus.ts \
 *     benchmark/results/shakemap-scenario-2026-09-19.json [<out.json>]
 *
 * ShakeMap's number is the radius of the circle whose area equals the area its
 * grid puts above MMI VII — which is what rule 28 compares a ring with, and what
 * `prospectiveRules.ts` calls a map's equivalent radius. Ours is the ring the
 * product draws. Two Vs30 are given for ours, because ShakeMap reads a grid of
 * them and the product reads one number: 760 m/s, its rock reference, and the
 * 350 m/s of a soft basin.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const source = process.argv[2];
if (source === undefined) {
  console.error('usage: shakemap-against-nimbus.ts <shakemap-scenario.json> [<out.json>]');
  process.exit(2);
}

interface ShakeRow {
  id: string;
  ok: boolean;
  maxMmi?: number;
  mmi7?: { areaKm2: number; equivalentRadiusKm: number };
  mmi8?: { areaKm2: number; equivalentRadiusKm: number };
  modules?: Record<string, string>;
}
const shake = JSON.parse(readFileSync(resolve(ROOT, source), 'utf8')) as { rows: ShakeRow[] };

/** The sources the scenarios were run on, kept here so the two columns cannot
 *  drift apart: same magnitude, same depth, same mechanism. */
const SOURCES: Readonly<
  Record<string, { magnitude: number; depthKm: number; fault: 'reverse' | 'strike-slip' }>
> = {
  northridge_scenario: { magnitude: 6.7, depthKm: 18, fault: 'reverse' },
  synthetic_m55_d10: { magnitude: 5.5, depthKm: 10, fault: 'strike-slip' },
  synthetic_m65_d10: { magnitude: 6.5, depthKm: 10, fault: 'strike-slip' },
  synthetic_m75_d10: { magnitude: 7.5, depthKm: 10, fault: 'strike-slip' },
  synthetic_m65_d40: { magnitude: 6.5, depthKm: 40, fault: 'strike-slip' },
};

const rows = shake.rows
  .filter((r) => r.ok)
  .map((r) => {
    const src = SOURCES[r.id];
    if (src === undefined) throw new Error(`no source for ${r.id}`);
    const ours = ([760, 350] as const).map((vs30) => {
      const out = simulateEarthquake({
        magnitude: src.magnitude,
        depth: m(src.depthKm * 1_000),
        faultType: src.fault,
        subductionInterface: false,
        vs30,
      });
      return {
        vs30,
        mmi7RadiusKm: (out.shaking.mmi7Radius as number) / 1_000,
        mmi8RadiusKm: (out.shaking.mmi8Radius as number) / 1_000,
        mmiAtEpicentre: out.shaking.mmiAtEpicenter,
      };
    });
    return {
      id: r.id,
      magnitude: src.magnitude,
      depthKm: src.depthKm,
      shakemap: {
        maxMmi: r.maxMmi ?? Number.NaN,
        mmi7RadiusKm: r.mmi7?.equivalentRadiusKm ?? 0,
        mmi8RadiusKm: r.mmi8?.equivalentRadiusKm ?? 0,
      },
      nimbus: ours,
    };
  });

const f = (x: number): string => x.toFixed(2);
console.log(
  '| scenario | Mw | depth | ShakeMap max MMI | ShakeMap VII r | ours at 760 | ours at 350 | our epicentral MMI |'
);
console.log('| --- | --: | --: | --: | --: | --: | --: | --: |');
for (const r of rows) {
  const a = r.nimbus[0];
  const b = r.nimbus[1];
  console.log(
    `| ${r.id} | ${r.magnitude.toFixed(1)} | ${r.depthKm.toString()} km | ${f(r.shakemap.maxMmi)} | ${f(r.shakemap.mmi7RadiusKm)} km | ${f(a?.mmi7RadiusKm ?? 0)} km | ${f(b?.mmi7RadiusKm ?? 0)} km | ${f(a?.mmiAtEpicentre ?? 0)} |`
  );
}
const ratios = rows
  .filter((r) => r.shakemap.mmi7RadiusKm > 0 && (r.nimbus[0]?.mmi7RadiusKm ?? 0) > 0)
  .map((r) => (r.nimbus[0]?.mmi7RadiusKm ?? 0) / r.shakemap.mmi7RadiusKm);
const geo = Math.exp(ratios.reduce((a, b) => a + Math.log(b), 0) / Math.max(ratios.length, 1));
console.log(
  `\nours over ShakeMap's, at the rock reference, on the ${ratios.length.toString()} scenarios where both draw a VII: ${ratios.map((x) => x.toFixed(2)).join(', ')} — geometric mean ${geo.toFixed(2)}`
);
const target = process.argv[3];
if (target !== undefined) {
  writeFileSync(
    resolve(ROOT, target),
    `${JSON.stringify({ track: 'E1', readOn: '2026-09-19', modules: shake.rows[0]?.modules, rows, rockGeometricMean: geo }, null, 1)}\n`
  );
  console.log(`wrote ${target}`);
}
