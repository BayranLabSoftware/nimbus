import { intensityLawOf, simulateEarthquake } from '../src/physics/events/earthquake/simulate.js';
import type { EarthquakeScenarioInput } from '../src/physics/events/earthquake/simulate.js';
import { areaAbove, type RuptureFootprint } from '../src/physics/events/earthquake/shakingField.js';
import { fitShakingField } from '../src/scene/globe/shakingOverlay.js';
import { shippedStrikeAnswer } from '../src/physics/validation/shippedFaults.js';
import { shippedSiteLookup } from '../src/physics/validation/shippedVs30.js';
import { widerJury } from '../src/physics/validation/widerFootprintRules.js';
import {
  EXTENDED_SOURCE_CELLS,
  magnitudeCell,
} from '../src/physics/validation/extendedSourceRules.js';
import { walkArea } from '../src/physics/validation/areaPropertyRules.js';
import { gainBeyondTheSeam } from '../src/physics/validation/reopeningRules.js';
import type { Meters } from '../src/physics/units.js';

/**
 * The round of rules 495 to 499: may rules 52 and 53's verdict be
 * replaced?
 *
 * Usage:
 *   pnpm exec tsx scripts/reopening-round.ts
 */

type Settings = Partial<
  Pick<EarthquakeScenarioInput, 'stadiumWidth' | 'pointSourceDistance' | 'extendedSource'>
>;
const ARMS: { key: string; s: Settings }[] = [
  {
    key: 'shipped  downDip + epicentral',
    s: { stadiumWidth: 'downDip', pointSourceDistance: 'epicentral' },
  },
  {
    key: 'projection + epicentral      ',
    s: { stadiumWidth: 'surfaceProjection', pointSourceDistance: 'epicentral' },
  },
  {
    key: 'downDip + Thompson-Worden    ',
    s: { stadiumWidth: 'downDip', pointSourceDistance: 'thompsonWorden2018' },
  },
  {
    key: 'projection + T-W (proposed)  ',
    s: { stadiumWidth: 'surfaceProjection', pointSourceDistance: 'thompsonWorden2018' },
  },
  {
    key: 'always + downDip (no T-W)    ',
    s: { extendedSource: 'always', stadiumWidth: 'downDip', pointSourceDistance: 'epicentral' },
  },
];
const THRESHOLDS = [7, 8, 9] as const;

function main(): void {
  const site = shippedSiteLookup();
  if (site === null) {
    console.error('The shipped Vs30 tiles are absent.');
    process.exit(1);
  }

  // --- rule 497(a): can the geometry touch rule 52's numbers at all? ----
  console.log('### rule 497(a) — can the surface projection reach rule 52 below Mw 7.5?');
  let moved = 0;
  for (const magnitude of [5.2, 6.0, 6.8, 7.4]) {
    const a = simulateEarthquake({
      magnitude,
      depth: 15_000 as Meters,
      faultType: 'reverse',
      stadiumWidth: 'downDip',
    });
    const b = simulateEarthquake({
      magnitude,
      depth: 15_000 as Meters,
      faultType: 'reverse',
      stadiumWidth: 'surfaceProjection',
    });
    const same = a.shaking.mmi7Radius === b.shaking.mmi7Radius && !a.isExtendedSource;
    if (!same) moved += 1;
    console.log(
      `  Mw ${magnitude.toFixed(1)}  extended ${a.isExtendedSource ? 'yes' : 'no '}  ` +
        `MMI VII ring ${((a.shaking.mmi7Radius as number) / 1000).toFixed(2)} km ` +
        `vs ${((b.shaking.mmi7Radius as number) / 1000).toFixed(2)} km  ${same ? 'identical' : 'MOVED'}`
    );
  }
  console.log(
    moved === 0
      ? '  → the projection cannot reach rule 52. Its numbers stand: 1.53 and 1.78\n' +
          '    against 0.88 and 1.17. Rule 496(a) is NOT satisfied.\n'
      : `  → the projection DOES reach rule 52 in ${moved.toString()} of the cases; 496(a) is live.\n`
  );

  // --- rule 497(b): where the candidate's gain lives ---------------------
  const cells = EXTENDED_SOURCE_CELLS.map((c) => c.label);
  const biasOf = (s: Settings): { overall: number; byCell: Record<string, number> } => {
    const logs: number[] = [];
    const perCell: Record<string, number[]> = {};
    for (const c of cells) perCell[c] = [];
    for (const e of widerJury()) {
      const r = simulateEarthquake({
        magnitude: e.magnitude,
        depth: (Math.max(0, e.depthKm) * 1_000) as Meters,
        faultType: e.faultType,
        ...s,
      });
      const law = intensityLawOf(r);
      if (law === null) continue;
      const a = shippedStrikeAnswer(e.latitude, e.longitude, e.depthKm * 1000, r.ruptureLength);
      const rupture: RuptureFootprint = {
        latitude: e.latitude,
        longitude: e.longitude,
        strikeDeg: r.inputs.strikeAzimuthDeg ?? a.strikeDeg ?? 0,
        halfLengthM: r.isExtendedSource ? (r.ruptureLength as number) / 2 : 0,
        halfWidthM: r.isExtendedSource ? (r.ruptureFootprintWidth as number) / 2 : 0,
      };
      const { field } = fitShakingField({
        rupture,
        intensityAt: law,
        siteAt: (la, lo) => ({ vs30: site(la, lo).vs30, provenance: 'grid' as const }),
      });
      const cell = magnitudeCell(e.magnitude);
      for (const t of THRESHOLDS) {
        const rec = e.areaKm2[t];
        const mod = areaAbove(field, t) / 1e6;
        if (rec > 0 && mod > 0) {
          const l = Math.log(mod / rec);
          logs.push(l);
          perCell[cell]?.push(l);
        }
      }
    }
    const mean = (v: number[]): number =>
      v.length === 0 ? Number.NaN : Math.exp(v.reduce((a, b) => a + b, 0) / v.length);
    const byCell: Record<string, number> = {};
    for (const c of cells) byCell[c] = mean(perCell[c] ?? []);
    return { overall: mean(logs), byCell };
  };

  console.log('### rule 497(b) and (c) — where the gain lives, and the seam');
  console.log(`| arm | overall | ${cells.join(' | ')} | worst step |`);
  console.log(`| --- | --- | ${cells.map(() => '---').join(' | ')} | --- |`);
  const overalls = new Map<string, number>();
  for (const arm of ARMS) {
    const b = biasOf(arm.s);
    const w = walkArea(arm.s);
    overalls.set(arm.key.trim(), Math.abs(Math.log(b.overall)));
    console.log(
      `| ${arm.key.trim()} | ${b.overall.toFixed(3)}x | ` +
        cells.map((c) => `${(b.byCell[c] ?? Number.NaN).toFixed(2)}x`).join(' | ') +
        ` | x${w.worst.ratio.toFixed(2)} at Mw ${w.worst.atMw.toFixed(2)} |`
    );
  }

  const g = gainBeyondTheSeam({
    base: overalls.get('shipped  downDip + epicentral') ?? Number.NaN,
    withCandidate: overalls.get('projection + T-W (proposed)') ?? Number.NaN,
    seamClosed: overalls.get('always + downDip (no T-W)') ?? Number.NaN,
    both: overalls.get('always + downDip (no T-W)') ?? Number.NaN,
  });
  console.log(
    `\n  the candidate takes |ln bias| down by ${g.total.toFixed(3)}; closing the seam another ` +
      `way takes it down by ${(g.total - g.beyondTheSeam).toFixed(3)} without it.`
  );

  console.log('\n### rule 498 — the verdict');
  console.log(
    moved === 0
      ? '  496(a) NOT satisfied: rule 52 cannot see the geometry, so its verdict is untouched.'
      : '  496(a) may be satisfied; rule 52 must be re-run.'
  );
}

main();
