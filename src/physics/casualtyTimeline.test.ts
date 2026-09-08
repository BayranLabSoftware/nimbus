import { describe, expect, it } from 'vitest';
import { blastCasualtyPlan, estimateCasualties, pyroclasticCasualtyPlan } from './casualties.js';
import {
  arrivalFunctionFor,
  buildCasualtyTimeline,
  casualtiesAtTime,
  LATERAL_BLAST_FRONT_SPEED,
  PYROCLASTIC_FRONT_SPEED,
  SHEAR_WAVE_SPEED,
  sweptFraction,
} from './casualtyTimeline.js';
import type { CasualtyEstimate } from './casualties.js';
import { J, m } from './units.js';
import { TNT_SPECIFIC_ENERGY } from './constants.js';

/** A uniform city of 5 000 people per km²: population ∝ area. */
const uniformCity = (radiusM: number): number => 5_000 * Math.PI * (radiusM / 1_000) ** 2;

function hiroshimaEstimate(): CasualtyEstimate {
  const plan = blastCasualtyPlan({
    blastEnergy: J(15 * TNT_SPECIFIC_ENERGY * 1e6),
    overpressure5psiRadius: m(1_600),
    overpressure1psiRadius: m(4_500),
  });
  if (plan === null) throw new Error('plan');
  return estimateCasualties(
    plan,
    plan.bands.map((b) => uniformCity(b.outerRadiusM))
  );
}

describe('casualtyTimeline — blast sweep', () => {
  const estimate = hiroshimaEstimate();
  const r1 = estimate.bands[3]?.outerRadiusM ?? 0;
  const arrival = arrivalFunctionFor({
    model: 'blast',
    blastEnergy: J(15 * TNT_SPECIFIC_ENERGY * 1e6),
    maxRadiusM: r1,
  });
  const timeline = buildCasualtyTimeline(estimate, arrival);

  it('starts at zero and ends at the estimate totals', () => {
    const start = casualtiesAtTime(timeline, 0);
    expect(start.deaths).toBe(0);
    expect(start.injured).toBe(0);
    const end = casualtiesAtTime(timeline, timeline.endS);
    expect(end.deaths).toBeCloseTo(timeline.deaths, 6);
    expect(end.deathsLow).toBeCloseTo(timeline.deathsLow, 6);
    expect(end.deathsHigh).toBeCloseTo(timeline.deathsHigh, 6);
    expect(end.injured).toBeCloseTo(timeline.injured, 6);
    expect(casualtiesAtTime(timeline, timeline.endS * 10).deaths).toBeCloseTo(timeline.deaths, 6);
    // The estimate rounds per band and per total: a person per band.
    for (const key of ['deaths', 'deathsLow', 'deathsHigh', 'injured'] as const) {
      expect(Math.abs(timeline[key] - estimate[key])).toBeLessThanOrEqual(estimate.bands.length);
    }
  });

  it('never goes backwards', () => {
    let previous = 0;
    for (let i = 0; i <= 200; i++) {
      const sample = casualtiesAtTime(timeline, (timeline.endS * i) / 200);
      expect(sample.deaths).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = sample.deaths;
    }
  });

  it('a 15 kt front crosses 4.5 km in seconds, not minutes, and slows towards sound speed', () => {
    expect(timeline.endS).toBeGreaterThan(5);
    expect(timeline.endS).toBeLessThan(20);
    // Far-field: the last kilometre takes about r/c₀ ≈ 3 s.
    const t35 = arrival(3_500, 'blast1psi');
    const t45 = arrival(4_500, 'blast1psi');
    expect(t45 - t35).toBeGreaterThan(2.5);
    expect(t45 - t35).toBeLessThan(3.5);
  });

  it('the deaths stop at the 2 psi ring while the injured keep accruing to 1 psi', () => {
    const band2 = timeline.bands[2];
    if (band2 === undefined) throw new Error('band');
    expect(timeline.deathsEndS).toBeCloseTo(band2.endS, 9);
    expect(timeline.endS).toBeGreaterThan(timeline.deathsEndS);
    const atDeathsEnd = casualtiesAtTime(timeline, timeline.deathsEndS);
    expect(atDeathsEnd.deaths).toBeCloseTo(timeline.deaths, 6);
    expect(atDeathsEnd.injured).toBeLessThan(estimate.injured);
  });

  it('when the front reaches the 5 psi ring the two inner bands are complete', () => {
    const r5 = estimate.bands[1]?.outerRadiusM ?? 0;
    const sample = casualtiesAtTime(timeline, arrival(r5, 'blast5psi'));
    const inner = (estimate.bands[0]?.deaths ?? 0) + (estimate.bands[1]?.deaths ?? 0);
    expect(sample.deaths).toBeGreaterThanOrEqual(inner - 1e-6);
    expect(sample.deaths).toBeLessThan(estimate.deaths);
  });

  it('within a band the toll follows the swept area, not the swept radius', () => {
    const band = timeline.bands[1];
    if (band === undefined) throw new Error('band');
    const mid = 0.5 * (band.innerRadiusM + band.outerRadiusM);
    const f = sweptFraction(band, arrival(mid, band.key));
    const areaFraction =
      (mid * mid - band.innerRadiusM ** 2) / (band.outerRadiusM ** 2 - band.innerRadiusM ** 2);
    expect(f).toBeCloseTo(areaFraction, 2);
    expect(f).toBeLessThan(0.5);
  });
});

describe('casualtyTimeline — other fronts', () => {
  it('shaking sweeps at the crustal shear-wave speed', () => {
    const arrival = arrivalFunctionFor({ model: 'shaking', maxRadiusM: 100_000 });
    expect(arrival(100_000, 'mmi7')).toBeCloseTo(100_000 / SHEAR_WAVE_SPEED, 9);
    expect(SHEAR_WAVE_SPEED).toBeGreaterThan(3_000);
    expect(SHEAR_WAVE_SPEED).toBeLessThan(4_000);
  });

  it('a lateral blast outruns the pyroclastic current', () => {
    const plan = pyroclasticCasualtyPlan({
      pyroclasticRunout: m(15_000),
      lateralBlastRunout: m(27_000),
      lateralBlastSectorDeg: 180,
    });
    if (plan === null) throw new Error('plan');
    const estimate = estimateCasualties(
      plan,
      plan.bands.map((b) => uniformCity(b.outerRadiusM))
    );
    const arrival = arrivalFunctionFor({ model: 'pyroclastic', maxRadiusM: 27_000 });
    const timeline = buildCasualtyTimeline(estimate, arrival);
    const pdc = timeline.bands.find((b) => b.key === 'pyroclastic');
    const blast = timeline.bands.find((b) => b.key === 'lateralBlast');
    if (pdc === undefined || blast === undefined) throw new Error('bands');
    expect(pdc.endS).toBeCloseTo(15_000 / PYROCLASTIC_FRONT_SPEED, 6);
    expect(blast.endS).toBeCloseTo(27_000 / LATERAL_BLAST_FRONT_SPEED, 6);
    // St Helens: 27 km in about a minute.
    expect(blast.endS).toBeGreaterThan(50);
    expect(blast.endS).toBeLessThan(80);
    expect(casualtiesAtTime(timeline, timeline.endS).deaths).toBeCloseTo(timeline.deaths, 6);
  });

  it('a blast with no energy is instantaneous rather than broken', () => {
    const estimate = hiroshimaEstimate();
    const timeline = buildCasualtyTimeline(
      estimate,
      arrivalFunctionFor({ model: 'blast', maxRadiusM: 4_500 })
    );
    expect(timeline.endS).toBe(0);
    expect(casualtiesAtTime(timeline, 0).deaths).toBeCloseTo(timeline.deaths, 6);
  });

  it('an empty estimate is an empty sweep', () => {
    const timeline = buildCasualtyTimeline(
      { model: 'blast', exposed: 0, deaths: 0, deathsLow: 0, deathsHigh: 0, injured: 0, bands: [] },
      () => 0
    );
    expect(timeline.endS).toBe(0);
    expect(casualtiesAtTime(timeline, 5).deaths).toBe(0);
  });
});
