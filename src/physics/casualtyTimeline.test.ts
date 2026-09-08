import { describe, expect, it } from 'vitest';
import { blastCasualtyPlan, estimateCasualties, pyroclasticCasualtyPlan } from './casualties.js';
import type { CasualtyEstimate } from './casualties.js';
import {
  arrivalFunctionFor,
  buildCasualtyTimeline,
  casualtiesAtTime,
  DELAYED_END_S,
  DELAYED_ONSET_S,
  FIRESTORM_END_S,
  FIRESTORM_ONSET_S,
  LATERAL_BLAST_FRONT_SPEED,
  PYROCLASTIC_FRONT_SPEED,
  SHEAR_WAVE_SPEED,
  sweptFraction,
  thermalPulseDuration,
} from './casualtyTimeline.js';
import { TNT_SPECIFIC_ENERGY } from './constants.js';
import { J, m } from './units.js';

/** A uniform city of 5 000 people per km²: population ∝ area. */
const uniformCity = (radiusM: number): number => 5_000 * Math.PI * (radiusM / 1_000) ** 2;
const HIROSHIMA_J = J(15 * TNT_SPECIFIC_ENERGY * 1e6);

function hiroshimaEstimate(withThermal = false): CasualtyEstimate {
  const plan = blastCasualtyPlan({
    blastEnergy: HIROSHIMA_J,
    overpressure5psiRadius: m(1_600),
    overpressure1psiRadius: m(4_500),
    ...(withThermal && {
      thirdDegreeBurnRadius: m(2_500),
      secondDegreeBurnRadius: m(3_400),
      firestormRadius: m(1_900),
    }),
  });
  if (plan === null) throw new Error('plan');
  return estimateCasualties(
    plan,
    plan.bands.map((b) => uniformCity(b.outerRadiusM))
  );
}

describe('casualtyTimeline — blast sweep', () => {
  const estimate = hiroshimaEstimate();
  const r1 = Math.max(...estimate.bands.map((b) => b.outerRadiusM));
  const arrival = arrivalFunctionFor({ model: 'blast', blastEnergy: HIROSHIMA_J, maxRadiusM: r1 });
  const timeline = buildCasualtyTimeline(estimate, arrival);
  const blastOnly = (t: number): number =>
    timeline.bands
      .filter((b) => b.hazard === 'blast')
      .reduce((acc, b) => acc + b.deaths * sweptFraction(b, t), 0);

  it('starts at zero and ends at the timeline totals, which match the estimate to a person per band', () => {
    const start = casualtiesAtTime(timeline, 0);
    expect(start.deaths).toBe(0);
    expect(start.injured).toBe(0);
    const end = casualtiesAtTime(timeline, timeline.endS);
    expect(end.deaths).toBeCloseTo(timeline.deaths, 6);
    expect(end.deathsLow).toBeCloseTo(timeline.deathsLow, 6);
    expect(end.deathsHigh).toBeCloseTo(timeline.deathsHigh, 6);
    expect(end.injured).toBeCloseTo(timeline.injured, 6);
    expect(casualtiesAtTime(timeline, timeline.endS * 10).deaths).toBeCloseTo(timeline.deaths, 6);
    for (const key of ['deaths', 'deathsLow', 'deathsHigh', 'injured'] as const) {
      expect(Math.abs(timeline[key] - estimate[key])).toBeLessThanOrEqual(
        2 * estimate.bands.length
      );
    }
  });

  it('never goes backwards', () => {
    let previous = 0;
    for (let i = 0; i <= 400; i++) {
      const t = Math.expm1((Math.log1p(timeline.endS) * i) / 400);
      const sample = casualtiesAtTime(timeline, t);
      expect(sample.deaths).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = sample.deaths;
    }
  });

  it('a 15 kt front crosses 4.5 km in seconds, not minutes, and slows towards sound speed', () => {
    const blastBand = timeline.bands.filter((b) => b.hazard === 'blast');
    const promptEnd = Math.max(...blastBand.map((b) => b.endS));
    expect(promptEnd).toBeGreaterThan(5);
    expect(promptEnd).toBeLessThan(20);
    const ref = blastBand[0];
    if (ref === undefined) throw new Error('band');
    // Far-field: the last kilometre takes about r/c₀ ≈ 3 s.
    const t35 = arrival(3_500, ref);
    const t45 = arrival(4_500, ref);
    expect(t45 - t35).toBeGreaterThan(2.5);
    expect(t45 - t35).toBeLessThan(3.5);
  });

  it('the prompt deaths stop at the 2 psi ring; the later deaths run to a month', () => {
    const twoPsi = estimate.bands.find((b) => b.psiBand === 'blast2psi');
    if (twoPsi === undefined) throw new Error('band');
    const blast2 = timeline.bands.find((b) => b.key === `${twoPsi.key}:blast`);
    if (blast2 === undefined) throw new Error('sweep band');
    expect(timeline.promptDeathsEndS).toBeCloseTo(blast2.endS, 9);
    expect(timeline.deathsEndS).toBe(DELAYED_END_S);
    expect(timeline.endS).toBe(DELAYED_END_S);
    // At the end of the prompt sweep every prompt death is in and no later one.
    const atPromptEnd = casualtiesAtTime(timeline, timeline.promptDeathsEndS);
    expect(atPromptEnd.deaths).toBeCloseTo(blastOnly(Number.POSITIVE_INFINITY), 6);
    expect(atPromptEnd.deaths).toBeLessThan(timeline.deaths);
    // A day later the injured start dying; by the month they are all counted.
    expect(casualtiesAtTime(timeline, DELAYED_ONSET_S).deaths).toBeCloseTo(atPromptEnd.deaths, 6);
    expect(
      casualtiesAtTime(timeline, (DELAYED_ONSET_S + DELAYED_END_S) / 2).deaths
    ).toBeGreaterThan(atPromptEnd.deaths);
    expect(casualtiesAtTime(timeline, DELAYED_END_S).deaths).toBeCloseTo(timeline.deaths, 6);
  });

  it('when the front reaches the 5 psi ring the two inner bands are complete', () => {
    const fivePsi = estimate.bands.find((b) => b.psiBand === 'blast5psi');
    if (fivePsi === undefined) throw new Error('band');
    const ref = timeline.bands[0];
    if (ref === undefined) throw new Error('sweep band');
    const t = arrival(fivePsi.outerRadiusM, ref);
    const inner = estimate.bands
      .filter((b) => b.outerRadiusM <= fivePsi.outerRadiusM)
      .reduce((acc, b) => acc + b.promptDeaths, 0);
    expect(blastOnly(t)).toBeGreaterThanOrEqual(inner - 2);
    expect(blastOnly(t)).toBeLessThan(timeline.deaths);
  });

  it('within a band the toll follows the swept area, not the swept radius', () => {
    const band = timeline.bands.find((b) => b.hazard === 'blast' && b.innerRadiusM > 0);
    if (band === undefined) throw new Error('band');
    const mid = 0.5 * (band.innerRadiusM + band.outerRadiusM);
    const f = sweptFraction(band, arrival(mid, band));
    const areaFraction =
      (mid * mid - band.innerRadiusM ** 2) / (band.outerRadiusM ** 2 - band.innerRadiusM ** 2);
    expect(f).toBeCloseTo(areaFraction, 2);
    expect(f).toBeLessThan(0.5);
  });
});

describe('casualtyTimeline — burns and mass fire', () => {
  const estimate = hiroshimaEstimate(true);
  const maxR = Math.max(...estimate.bands.map((b) => b.outerRadiusM));
  const arrival = arrivalFunctionFor({
    model: 'blast',
    blastEnergy: HIROSHIMA_J,
    maxRadiusM: maxR,
  });
  const timeline = buildCasualtyTimeline(estimate, arrival);
  const hazardDeaths = (hazard: string, t: number): number =>
    timeline.bands
      .filter((b) => b.hazard === hazard)
      .reduce((acc, b) => acc + b.deaths * sweptFraction(b, t), 0);
  const hazardTotal = (hazard: string): number =>
    timeline.bands.filter((b) => b.hazard === hazard).reduce((acc, b) => acc + b.deaths, 0);

  it('the thermal pulse of 15 kt is over in a second or two, a megatonne in ten', () => {
    expect(thermalPulseDuration(HIROSHIMA_J as number)).toBeGreaterThan(1);
    expect(thermalPulseDuration(HIROSHIMA_J as number)).toBeLessThan(2);
    expect(thermalPulseDuration((1_000 * (HIROSHIMA_J as number)) / 15)).toBeGreaterThan(5);
    expect(thermalPulseDuration((1_000 * (HIROSHIMA_J as number)) / 15)).toBeLessThan(15);
    expect(thermalPulseDuration(0)).toBe(1);
  });

  it('burns are counted within the pulse, before the shock has crossed the city', () => {
    const pulse = thermalPulseDuration(HIROSHIMA_J);
    expect(hazardTotal('thermal')).toBeGreaterThan(0);
    expect(hazardDeaths('thermal', pulse)).toBeCloseTo(hazardTotal('thermal'), 6);
    expect(hazardDeaths('blast', pulse)).toBeLessThan(hazardTotal('blast'));
  });

  it('the mass fire takes its toll between twenty minutes and six hours', () => {
    expect(hazardTotal('firestorm')).toBeGreaterThan(0);
    expect(hazardDeaths('firestorm', FIRESTORM_ONSET_S)).toBe(0);
    const half = hazardDeaths('firestorm', (FIRESTORM_ONSET_S + FIRESTORM_END_S) / 2);
    expect(half).toBeGreaterThan(0.4 * hazardTotal('firestorm'));
    expect(half).toBeLessThan(0.6 * hazardTotal('firestorm'));
    expect(hazardDeaths('firestorm', FIRESTORM_END_S)).toBeCloseTo(hazardTotal('firestorm'), 6);
  });

  it('the whole sweep is monotonic across five orders of magnitude in time', () => {
    let previous = 0;
    for (let i = 0; i <= 600; i++) {
      const t = Math.expm1((Math.log1p(DELAYED_END_S) * i) / 600);
      const sample = casualtiesAtTime(timeline, t);
      expect(sample.deaths).toBeGreaterThanOrEqual(previous - 1e-9);
      previous = sample.deaths;
    }
    expect(previous).toBeCloseTo(timeline.deaths, 6);
  });
});

describe('casualtyTimeline — other fronts', () => {
  const ref = { key: 'x', hazard: 'shaking' as const, innerRadiusM: 0, outerRadiusM: 100_000 };

  it('shaking sweeps at the crustal shear-wave speed', () => {
    const arrival = arrivalFunctionFor({ model: 'shaking', maxRadiusM: 100_000 });
    expect(arrival(100_000, ref)).toBeCloseTo(100_000 / SHEAR_WAVE_SPEED, 9);
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
    const pdc = timeline.bands.find((b) => b.hazard === 'pyroclastic');
    const blast = timeline.bands.find((b) => b.hazard === 'lateralBlast');
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
    expect(timeline.promptDeathsEndS).toBe(0);
    expect(casualtiesAtTime(timeline, 0).deaths).toBeCloseTo(
      timeline.bands.filter((b) => b.hazard !== 'delayed').reduce((a, b) => a + b.deaths, 0),
      6
    );
  });

  it('an empty estimate is an empty sweep', () => {
    const timeline = buildCasualtyTimeline(
      {
        model: 'blast',
        exposed: 0,
        deaths: 0,
        deathsLow: 0,
        deathsHigh: 0,
        promptDeaths: 0,
        delayedDeaths: 0,
        delayedDeathsLow: 0,
        delayedDeathsHigh: 0,
        injured: 0,
        bands: [],
      },
      () => 0
    );
    expect(timeline.endS).toBe(0);
    expect(casualtiesAtTime(timeline, 5).deaths).toBe(0);
  });
});
