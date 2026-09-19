import { describe, expect, it } from 'vitest';
import { combineMortality, type CasualtyPlan } from '../casualties.js';
import { EXPLOSION_PRESETS, simulateExplosion } from '../events/explosion/simulate.js';
import { casualtyPlanForResult, type ActiveResult } from '../../store/useAppStore.js';
import {
  JAPAN_DECIDING_ZONE,
  JAPAN_MORTALITY_TOLERANCE,
  JAPAN_ZONE_EDGES_M,
  JAPAN_ZONE_RECORD,
} from './japanMortalityRules.js';

/**
 * Rules 263 and 264: the two cities, per head, against Table 12.09.
 *
 * The rules were fixed and pushed (commit 07f081d) before the candidate was
 * written. The populations are the book's own, so the raster never enters and
 * the comparison is a mortality against a mortality.
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

/** Which end of each hazard's triple to read. */
type End = 'low' | 'mid' | 'high';

/**
 * The model's mortality over [a, b), area-weighted — the annulus is uniform in
 * the book's own presentation, which gives a density per zone.
 */
function zoneMortality(plan: CasualtyPlan, a: number, b: number, end: End): number {
  let num = 0;
  for (const band of plan.bands) {
    const lo = Math.max(a, band.innerRadiusM);
    const hi = Math.min(b, band.outerRadiusM);
    if (hi <= lo) continue;
    const rates = (band.components ?? []).map((c) =>
      end === 'low' ? c.mortalityLow : end === 'high' ? c.mortalityHigh : c.mortality
    );
    num += Math.PI * (hi * hi - lo * lo) * combineMortality(rates);
  }
  return num / (Math.PI * (b * b - a * a));
}

function planOf(city: (typeof CITIES)[number]): CasualtyPlan {
  const result: ActiveResult = { type: 'explosion', data: simulateExplosion(city.input) };
  const plan = casualtyPlanForResult(result, city.at);
  if (plan === null) throw new Error(`no plan for ${city.city}`);
  return plan;
}

interface Scored {
  city: City;
  zones: { modelled: number; recorded: number }[];
  totalModelled: number;
  totalRecorded: number;
  highModelled: number;
}

function score(end: End = 'mid'): Scored[] {
  return CITIES.map((c) => {
    const plan = planOf(c);
    const rec = JAPAN_ZONE_RECORD[c.city];
    const zones: { modelled: number; recorded: number }[] = [];
    let killed = 0;
    let killedHigh = 0;
    let recorded = 0;
    let people = 0;
    for (let i = 0; i + 1 < JAPAN_ZONE_EDGES_M.length; i++) {
      const a = JAPAN_ZONE_EDGES_M[i] ?? 0;
      const b = JAPAN_ZONE_EDGES_M[i + 1] ?? 0;
      const pop = rec.population[i] ?? 0;
      const rk = rec.killed[i] ?? 0;
      const m = zoneMortality(plan, a, b, end);
      zones.push({ modelled: m, recorded: pop > 0 ? rk / pop : 0 });
      killed += m * pop;
      killedHigh += zoneMortality(plan, a, b, 'high') * pop;
      recorded += rk;
      people += pop;
    }
    return {
      city: c.city,
      zones,
      totalModelled: killed / people,
      totalRecorded: recorded / people,
      highModelled: killedHigh / people,
    };
  });
}

const pc = (x: number): string => `${(100 * x).toFixed(1)} %`;

describe('rules 261 to 266 — the only two cities there are, read per head', () => {
  it('rule 263(a) and (b): each city and its middle zone within a quarter of the record', () => {
    const scored = score();
    const lines = [
      '',
      '| city | zone | recorded | model | ratio |',
      '| --- | --- | --: | --: | --: |',
    ];
    for (const s of scored) {
      for (const [i, z] of s.zones.entries()) {
        const label = ['0 – 0.6 mi', '0.6 – 1.6 mi', '1.6 – 3.1 mi'][i] ?? '';
        lines.push(
          `| ${s.city} | ${label} | ${pc(z.recorded)} | ${pc(z.modelled)} | ${(z.modelled / z.recorded).toFixed(2)}× |`
        );
      }
      lines.push(
        `| ${s.city} | **all** | ${pc(s.totalRecorded)} | ${pc(s.totalModelled)} | ${(s.totalModelled / s.totalRecorded).toFixed(2)}× |`
      );
    }
    console.log(lines.join('\n'));
    for (const s of scored) {
      expect(
        Math.abs(s.totalModelled / s.totalRecorded - 1),
        `${s.city} total`
      ).toBeLessThanOrEqual(JAPAN_MORTALITY_TOLERANCE);
      const z = s.zones[JAPAN_DECIDING_ZONE];
      expect(z).toBeDefined();
      expect(
        Math.abs((z?.modelled ?? 0) / (z?.recorded ?? 1) - 1),
        `${s.city} deciding zone`
      ).toBeLessThanOrEqual(JAPAN_MORTALITY_TOLERANCE);
    }
  });

  it('rule 263(c): the fire storm is still possible — the high end stays above the record', () => {
    for (const s of score()) {
      expect(s.highModelled, `${s.city} high end`).toBeGreaterThan(s.totalRecorded);
    }
  });

  it('rule 264: the three findings this round may not touch, printed', () => {
    const scored = score();
    const lines = [
      '',
      '| city | innermost | recorded | outermost | recorded |',
      '| --- | --: | --: | --: | --: |',
    ];
    for (const s of scored) {
      const inner = s.zones[0];
      const outer = s.zones[2];
      lines.push(
        `| ${s.city} | ${pc(inner?.modelled ?? 0)} | ${pc(inner?.recorded ?? 0)} | ${pc(outer?.modelled ?? 0)} | ${pc(outer?.recorded ?? 0)} |`
      );
    }
    lines.push(
      '',
      'Innermost: OTA figure 1 puts 98 % above 12 psi and Japan recorded 86 and 88.',
      'Outermost: below 2 psi the model carries no hazard at all, and Japan recorded 2.1 % and 1.1 %.',
      'And §12.16 makes initial radiation 5 to 15 % of Japan’s fatalities, which this model does not count among an explosion’s dead.',
      'Each is a round of its own (rule 264).'
    );
    console.log(lines.join('\n'));
    expect(scored.length).toBe(2);
  });
});
