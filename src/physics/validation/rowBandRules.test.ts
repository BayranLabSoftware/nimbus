import { describe, expect, it } from 'vitest';
import { estimateCasualties, type CasualtyPlan } from '../casualties.js';
import { EARTHQUAKE_PRESETS, simulateEarthquake } from '../events/earthquake/simulate.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { VOLCANO_PRESETS, simulateVolcano } from '../events/volcano/simulate.js';
import { IMPACT_PRESETS, simulateImpact } from '../simulate.js';
import { bandFromPlans, sampleScenarioPlans } from '../uq/tollBand.js';
import { casualtyPlanForResult, type ActiveResult } from '../../store/useAppStore.js';
import { ROW_BAND_HIGH_Q, ROW_BAND_LOW_Q, quantileOf } from './rowBandRules.js';

/**
 * Rules 257 and 258: a row's pair is that row's own percentile, checked over
 * every preset of every family.
 *
 * The rules were fixed and pushed (commit c40b296) before the candidate was
 * written. The population is a uniform city, as the module's own tests use:
 * what is under test is which numbers the pair is taken from, not how many
 * people live where.
 */

/** A city of uniform density — a disc's population is linear in r². */
const uniform =
  (perKm2: number) =>
  (radiusM: number): number =>
    perKm2 * Math.PI * (radiusM / 1_000) ** 2;

/** Somewhere on land with a country behind it, so the shaking plan has a
 *  vulnerability to read. L'Aquila, as the module's own tests use. */
const WHERE = { latitude: 42.35, longitude: 13.38 };

const planFor = (result: ActiveResult): CasualtyPlan | null => casualtyPlanForResult(result, WHERE);

interface Row {
  name: string;
  central: number;
  wholeLow: number;
  wholeHigh: number;
  rowLow: number;
  rowHigh: number;
  samples: number;
}

function everyPreset(): ActiveResult[] {
  const out: ActiveResult[] = [];
  for (const preset of Object.values(EXPLOSION_PRESETS))
    out.push({ type: 'explosion', data: simulateExplosion(preset.input) });
  for (const preset of Object.values(EARTHQUAKE_PRESETS))
    out.push({ type: 'earthquake', data: simulateEarthquake(preset.input) });
  for (const preset of Object.values(IMPACT_PRESETS))
    out.push({ type: 'impact', data: simulateImpact(preset.input) });
  for (const preset of Object.values(VOLCANO_PRESETS))
    out.push({ type: 'volcano', data: simulateVolcano(preset.input) });
  return out;
}

/**
 * Every preset's pair, computed once for the whole file.
 *
 * Two tests read this and it is deterministic — one seed per preset index —
 * so computing it twice is two seconds of the same arithmetic. That was
 * enough to put `rule 258` over vitest's five-second default in CI, where
 * coverage instrumentation roughly doubles it, while it passed locally
 * without coverage: the run is `pnpm test -- --coverage`. Memoised here, and
 * the two tests that use it carry an explicit timeout, because a test this
 * size should say how long it may take rather than sit just under a default.
 */
let memoised: Row[] | null = null;

function rowsOf(): Row[] {
  if (memoised !== null) return memoised;
  const population = uniform(2_000);
  const rows: Row[] = [];
  for (const [i, result] of everyPreset().entries()) {
    const plan = planFor(result);
    if (plan === null) continue;
    const plans = sampleScenarioPlans({ result, planFor, seed: `row-band-${i.toString()}` });
    if (plans.length === 0) continue;
    const band = bandFromPlans(plans, (radiusM) => population(radiusM));
    if (band === null) continue;
    const central = estimateCasualties(
      plan,
      plan.bands.map((b) => population(b.outerRadiusM))
    );
    rows.push({
      name: `${result.type}/${String(i)}`,
      central: central.delayedDeaths,
      wholeLow: band.low.delayedDeaths,
      wholeHigh: band.high.delayedDeaths,
      rowLow: band.rows.delayedDeaths.low,
      rowHigh: band.rows.delayedDeaths.high,
      samples: band.samples,
    });
  }
  memoised = rows;
  return rows;
}

describe('rules 255 to 260 — a pair beside a number is a claim about that number', () => {
  it('rule 257(a): the deferred pair is the percentile of the deferred deaths', () => {
    const population = uniform(2_000);
    const result: ActiveResult = {
      type: 'explosion',
      data: simulateExplosion(EXPLOSION_PRESETS.HIROSHIMA_1945.input),
    };
    const plans = sampleScenarioPlans({ result, planFor, seed: 'hiroshima' });
    const band = bandFromPlans(plans, (radiusM) => population(radiusM));
    expect(band).not.toBeNull();
    // Recomputed here from the same draws, the long way round.
    const deferred = plans
      .map((plan) =>
        estimateCasualties(
          plan,
          plan.bands.map((b) => population(b.outerRadiusM))
        )
      )
      .map((e) => e.delayedDeaths)
      .sort((a, b) => a - b);
    expect(band?.rows.delayedDeaths.low).toBe(quantileOf(deferred, ROW_BAND_LOW_Q));
    expect(band?.rows.delayedDeaths.high).toBe(quantileOf(deferred, ROW_BAND_HIGH_Q));
  });

  it('rule 257(b): ordered by construction, at every preset of every family', () => {
    const rows = rowsOf();
    expect(rows.length).toBeGreaterThan(20);
    let wholeBackwards = 0;
    for (const r of rows) {
      expect(r.rowLow, r.name).toBeLessThanOrEqual(r.rowHigh);
      if (r.wholeLow > r.wholeHigh) wholeBackwards += 1;
    }
    // And the pair that used to be printed was not: this is the finding, on
    // the shipped presets rather than on one reader's scenario.
    expect(wholeBackwards).toBeGreaterThan(0);
    console.log(
      `\nrule 257(b): ${rows.length.toString()} presets, none backwards. The whole-realisation pair was backwards on ${wholeBackwards.toString()} of them.`
    );
  }, 120_000);

  it('rule 258: how often the pair contains the figure beside it — recorded, not gated', () => {
    const rows = rowsOf();
    const holds = (r: Row): boolean => r.central >= r.rowLow && r.central <= r.rowHigh;
    const wholeHolds = (r: Row): boolean =>
      r.central >= Math.min(r.wholeLow, r.wholeHigh) &&
      r.central <= Math.max(r.wholeLow, r.wholeHigh);
    const now = rows.filter(holds).length;
    const before = rows.filter(wholeHolds).length;
    const lines = [
      '',
      `| preset | figure | whole-realisation pair | row's own pair | holds? |`,
      '| --- | --: | --: | --: | :-- |',
      ...rows
        .slice(0, 12)
        .map(
          (r) =>
            `| ${r.name} | ${Math.round(r.central).toString()} | ${Math.round(r.wholeLow).toString()} – ${Math.round(r.wholeHigh).toString()} | ${Math.round(r.rowLow).toString()} – ${Math.round(r.rowHigh).toString()} | ${holds(r) ? 'yes' : 'no'} |`
        ),
      '',
      `contains the figure: ${now.toString()} of ${rows.length.toString()} with the row's own pair, ${before.toString()} of ${rows.length.toString()} with the whole realisation's (ordered first, so it is a fair comparison).`,
      'Rule 258 records this and does not gate it: a percentile over sampled draws need not contain the single unsampled run the application shows.',
    ];
    console.log(lines.join('\n'));
    // Nothing is asserted about the share. It is printed.
    expect(rows.length).toBeGreaterThan(0);
  }, 120_000);
});
