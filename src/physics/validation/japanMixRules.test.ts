import { describe, expect, it } from 'vitest';
import {
  combineMortality,
  estimateCasualties,
  type CasualtyHazard,
  type CasualtyPlan,
} from '../casualties.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { casualtyPlanForResult, type ActiveResult } from '../../store/useAppStore.js';
import {
  JAPAN_BURN_SHARE,
  JAPAN_RADIATION_SHARE,
  initialRadiationMortality,
} from './japanMixRules.js';
import {
  JAPAN_MORTALITY_TOLERANCE,
  JAPAN_ZONE_EDGES_M,
  JAPAN_ZONE_RECORD,
} from './japanMortalityRules.js';

/**
 * Rules 282 and 283: the causes, against §12.13 and §12.16.
 *
 * The rules were fixed and pushed (commit 845f6eb) before the candidate was
 * written. The populations are the book's own, spread over each zone at the
 * density the book gives it, so the raster never enters.
 */

type City = 'Hiroshima' | 'Nagasaki';

const CITIES: readonly {
  city: City;
  input: (typeof EXPLOSION_PRESETS)['HIROSHIMA_1945']['input'];
  at: { latitude: number; longitude: number };
}[] = [
  {
    city: 'Hiroshima',
    input: EXPLOSION_PRESETS.HIROSHIMA_1945.input,
    at: { latitude: 34.3955, longitude: 132.4553 },
  },
  {
    city: 'Nagasaki',
    input: EXPLOSION_PRESETS.NAGASAKI_1945.input,
    at: { latitude: 32.7503, longitude: 129.8779 },
  },
];

/** Cumulative population within a radius, at the book's own per-zone density. */
function bookPopulationWithin(city: City): (radiusM: number) => number {
  const rec = JAPAN_ZONE_RECORD[city];
  return (radiusM: number): number => {
    let acc = 0;
    for (let i = 0; i + 1 < JAPAN_ZONE_EDGES_M.length; i++) {
      const a = JAPAN_ZONE_EDGES_M[i] ?? 0;
      const b = JAPAN_ZONE_EDGES_M[i + 1] ?? 0;
      const r = Math.min(Math.max(radiusM, a), b);
      if (r <= a) continue;
      acc += ((rec.population[i] ?? 0) * (r * r - a * a)) / (b * b - a * a);
    }
    return acc;
  };
}

function mixOf(city: (typeof CITIES)[number]): {
  byHazard: Map<CasualtyHazard, number>;
  deaths: number;
  plan: CasualtyPlan;
} {
  const result: ActiveResult = { type: 'explosion', data: simulateExplosion(city.input) };
  const plan = casualtyPlanForResult(result, city.at);
  if (plan === null) throw new Error(`no plan for ${city.city}`);
  const population = bookPopulationWithin(city.city);
  const est = estimateCasualties(
    plan,
    plan.bands.map((b) => population(b.outerRadiusM))
  );
  const byHazard = new Map<CasualtyHazard, number>();
  for (const band of est.bands) {
    for (const h of band.byHazard) byHazard.set(h.hazard, (byHazard.get(h.hazard) ?? 0) + h.deaths);
  }
  return { byHazard, deaths: est.deaths, plan };
}

describe('rules 279 to 285 — a toll that names its causes has to name them right', () => {
  it('rule 279: the curve is one inside LD₁₀₀, a half at LD₅₀, nothing at the ARS line', () => {
    expect(initialRadiationMortality(0, 1_000, 1_300, 1_700)).toBe(1);
    expect(initialRadiationMortality(1_000, 1_000, 1_300, 1_700)).toBe(1);
    expect(initialRadiationMortality(1_300, 1_000, 1_300, 1_700)).toBeCloseTo(0.5, 12);
    expect(initialRadiationMortality(1_700, 1_000, 1_300, 1_700)).toBe(0);
    expect(initialRadiationMortality(2_500, 1_000, 1_300, 1_700)).toBe(0);
    // Linear between, and never rising outward.
    let previous = Number.POSITIVE_INFINITY;
    for (let r = 0; r <= 2_000; r += 50) {
      const m = initialRadiationMortality(r, 1_000, 1_300, 1_700);
      expect(m).toBeLessThanOrEqual(previous);
      previous = m;
    }
    // Nonsense in, nothing out.
    expect(initialRadiationMortality(500, 0, 0, 0)).toBe(0);
  });

  it('rule 282(a): the radiation takes between 5 and 15 % of the dead, on both cities', () => {
    const lines = [
      '',
      '| city | blast | burns | radiation | mass fire | deferred |',
      '| --- | --: | --: | --: | --: | --: |',
    ];
    for (const c of CITIES) {
      const { byHazard } = mixOf(c);
      const total = [...byHazard.values()].reduce((a, b) => a + b, 0);
      const share = (h: CasualtyHazard): number => (byHazard.get(h) ?? 0) / total;
      lines.push(
        `| ${c.city} | ${(100 * share('blast')).toFixed(1)} % | ${(100 * share('thermal')).toFixed(1)} % | **${(100 * share('radiation')).toFixed(1)} %** | ${(100 * share('firestorm')).toFixed(1)} % | ${(100 * share('delayed')).toFixed(1)} % |`
      );
      expect(share('radiation'), `${c.city} radiation share`).toBeGreaterThanOrEqual(
        JAPAN_RADIATION_SHARE.low
      );
      expect(share('radiation'), `${c.city} radiation share`).toBeLessThanOrEqual(
        JAPAN_RADIATION_SHARE.high
      );
    }
    lines.push(
      '',
      `§12.16 puts the initial radiation at ${(100 * JAPAN_RADIATION_SHARE.low).toFixed(0)} to ${(100 * JAPAN_RADIATION_SHARE.high).toFixed(0)} % of Japan's fatalities.`,
      `§12.13 puts burns of one kind or another at about ${(100 * JAPAN_BURN_SHARE).toFixed(0)} %, which rule 284 leaves to a round of its own.`
    );
    console.log(lines.join('\n'));
  });

  it('rule 282(b): both totals stay inside the quarter rule 263 fixed', () => {
    // Rule 282(b) names rule 263's bound, so it reads rule 263's way: the
    // model's mortality area-weighted into the book's three zones and applied
    // to the book's own populations. Letting the model's bands carve the
    // population instead is a different measurement and would answer a
    // different question.
    for (const c of CITIES) {
      const { plan } = mixOf(c);
      const rec = JAPAN_ZONE_RECORD[c.city];
      let killed = 0;
      let recorded = 0;
      for (let i = 0; i + 1 < JAPAN_ZONE_EDGES_M.length; i++) {
        const a = JAPAN_ZONE_EDGES_M[i] ?? 0;
        const b = JAPAN_ZONE_EDGES_M[i + 1] ?? 0;
        let num = 0;
        for (const band of plan.bands) {
          const lo = Math.max(a, band.innerRadiusM);
          const hi = Math.min(b, band.outerRadiusM);
          if (hi <= lo) continue;
          num +=
            Math.PI *
            (hi * hi - lo * lo) *
            combineMortality((band.components ?? []).map((x) => x.mortality));
        }
        killed += (num / (Math.PI * (b * b - a * a))) * (rec.population[i] ?? 0);
        recorded += rec.killed[i] ?? 0;
      }
      const ratio = killed / recorded;
      expect(Math.abs(ratio - 1), `${c.city} total ${ratio.toFixed(3)}×`).toBeLessThanOrEqual(
        JAPAN_MORTALITY_TOLERANCE
      );
      console.log(`rule 282(b): ${c.city} ${ratio.toFixed(2)}× the record, per head`);
    }
  });

  it('rule 280: an impact has no initial radiation, and is given none', () => {
    // The plan a chemical charge and an impact build carries no radiation
    // component at any radius.
    const chemical = casualtyPlanForResult(
      {
        type: 'explosion',
        data: simulateExplosion({
          ...EXPLOSION_PRESETS.HIROSHIMA_1945.input,
          chargeType: 'chemical',
        }),
      },
      CITIES[0]?.at ?? { latitude: 0, longitude: 0 }
    );
    expect(chemical).not.toBeNull();
    for (const band of chemical?.bands ?? []) {
      expect((band.components ?? []).some((x) => x.hazard === 'radiation')).toBe(false);
    }
  });
});
