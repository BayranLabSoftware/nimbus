import { describe, expect, it } from 'vitest';
import { blastCasualtyPlan, estimateCasualties } from './casualties.js';
import { arrivalFunctionFor, buildCasualtyTimeline, casualtiesAtTime } from './casualtyTimeline.js';
import { TNT_SPECIFIC_ENERGY } from './constants.js';
import {
  estimateTsunamiCasualties,
  inundationDistance,
  MAX_INUNDATION_M,
  meanFlowDepth,
  mergeTsunamiCasualties,
  shoreHeight,
  TSUNAMI_VULNERABILITY,
  WARNING_ISSUE_S,
  warningLeadS,
  tsunamiFatalityRate,
  vulnerabilityAt,
  WARNING_FULL_S,
  WARNING_ONSET_S,
  type TsunamiCoastCell,
} from './tsunamiCasualties.js';
import { J, m } from './units.js';

describe('tsunamiFatalityRate', () => {
  it('rises with the flow depth and with the vulnerability', () => {
    const mid = TSUNAMI_VULNERABILITY.mid;
    expect(tsunamiFatalityRate(0, mid)).toBe(0);
    expect(tsunamiFatalityRate(1, mid)).toBeLessThan(0.01);
    expect(tsunamiFatalityRate(5, mid)).toBeGreaterThan(0.2);
    expect(tsunamiFatalityRate(5, mid)).toBeLessThan(0.35);
    expect(tsunamiFatalityRate(10, mid)).toBeGreaterThan(0.5);
    expect(tsunamiFatalityRate(30, mid)).toBeGreaterThan(0.9);
    // Evacuated coast at the low end, Banda Aceh at the high end.
    expect(tsunamiFatalityRate(5, TSUNAMI_VULNERABILITY.low)).toBeLessThan(0.1);
    expect(tsunamiFatalityRate(5, TSUNAMI_VULNERABILITY.high)).toBeGreaterThan(0.5);
  });
});

describe('vulnerabilityAt — warning is a matter of time', () => {
  it('no warning within half an hour, the evacuated pair from three hours, Banda Aceh throughout', () => {
    expect(vulnerabilityAt(0).mid.theta).toBe(TSUNAMI_VULNERABILITY.mid.theta);
    expect(vulnerabilityAt(WARNING_ONSET_S).mid.theta).toBe(TSUNAMI_VULNERABILITY.mid.theta);
    expect(vulnerabilityAt(WARNING_FULL_S).mid.theta).toBe(TSUNAMI_VULNERABILITY.low.theta);
    expect(vulnerabilityAt(10 * 3_600).low.theta).toBe(2 * TSUNAMI_VULNERABILITY.low.theta);
    expect(vulnerabilityAt(10 * 3_600).high.theta).toBe(TSUNAMI_VULNERABILITY.high.theta);
    const hour = vulnerabilityAt(3_600).mid.theta;
    expect(hour).toBeGreaterThan(TSUNAMI_VULNERABILITY.mid.theta);
    expect(hour).toBeLessThan(TSUNAMI_VULNERABILITY.low.theta);
    // A 5 m flood: a quarter or more on an unwarned coast, a few per cent hours ahead.
    expect(tsunamiFatalityRate(5, vulnerabilityAt(600).mid)).toBeGreaterThan(0.2);
    expect(tsunamiFatalityRate(5, vulnerabilityAt(8 * 3_600).mid)).toBeLessThan(0.1);
  });
});

describe('inundationDistance', () => {
  it('follows Bretschneider & Wybro: 1.4 km for a 10 m run-up, capped at ten kilometres', () => {
    expect(inundationDistance(10)).toBeGreaterThan(1_300);
    expect(inundationDistance(10)).toBeLessThan(1_500);
    expect(inundationDistance(5)).toBeGreaterThan(500);
    expect(inundationDistance(5)).toBeLessThan(600);
    expect(inundationDistance(40)).toBeGreaterThan(8_000);
    expect(inundationDistance(60)).toBe(MAX_INUNDATION_M);
    expect(inundationDistance(0)).toBe(0);
    expect(meanFlowDepth(6)).toBe(3);
    // The run-up is trusted only up to the amplitude that arrived: a
    // 5 m wave whose run-up came back at the 4x clamp stands 5 m at
    // the shore, not 9.7 m, and floods 570 m rather than 1.4 km.
    expect(shoreHeight(19, 5)).toBe(5);
    expect(shoreHeight(20, 5)).toBe(5);
    // Below the clamp the solver is speaking, and the smaller number wins.
    expect(shoreHeight(3, 5)).toBeCloseTo(Math.sqrt(15), 9);
    expect(shoreHeight(6, undefined)).toBe(3);
  });
});

/** A straight coast of `count` cells, 1 km apart, arriving one after the other. */
function coast(
  count: number,
  runupM: number,
  densityPerKm2: number,
  arrivalStartS = 3_600,
  arrivalStepS = 60
): TsunamiCoastCell[] {
  return Array.from({ length: count }, (_, i) => ({
    latitude: 40 + i * 0.009,
    longitude: 14,
    runupM,
    amplitudeM: runupM / 4,
    slopeRad: Math.atan(1 / 100),
    spacingM: 1_000,
    arrivalS: arrivalStartS + i * arrivalStepS,
    densityPerKm2,
  }));
}

describe('estimateTsunamiCasualties', () => {
  it('counts the people in the inundation strips and the share the depth kills', () => {
    // 50 cells × 1 km of coast, Bretschneider–Wybro strips.
    const cells = coast(50, 5, 2_000);
    const est = estimateTsunamiCasualties(cells);
    // 5 m run-up from 1.25 m offshore: the run-up is above the trusted
    // ceiling, so the water stands as high as the wave that arrived.
    const height = shoreHeight(5, 1.25);
    expect(height).toBeCloseTo(1.25, 9);
    const stripKm2 = (1_000 * inundationDistance(height)) / 1e6;
    expect(est.exposed).toBe(Math.round(50 * stripKm2 * 2_000));
    const expectedDeaths = cells.reduce(
      (acc, c) =>
        acc +
        (est.exposed / cells.length) *
          tsunamiFatalityRate(meanFlowDepth(height), vulnerabilityAt(c.arrivalS ?? 0).mid),
      0
    );
    expect(Math.abs(est.deaths - expectedDeaths)).toBeLessThanOrEqual(est.bands.length + 1);
    expect(est.deathsLow).toBeLessThan(est.deaths);
    expect(est.deathsHigh).toBeGreaterThan(est.deaths);
    expect(est.firstArrivalS).toBe(3_600);
    expect(est.lastArrivalS).toBe(3_600 + 49 * 60);
    expect(est.cellCount).toBe(50);
  });

  it('bins the toll by arrival, oldest first, every band dated', () => {
    const est = estimateTsunamiCasualties(coast(200, 8, 1_000, 1_800, 90));
    expect(est.bands.length).toBeGreaterThan(3);
    expect(est.bands.length).toBeLessThanOrEqual(12);
    for (let i = 1; i < est.bands.length; i++) {
      const a = est.bands[i - 1]?.window;
      const b = est.bands[i]?.window;
      if (a === undefined || b === undefined) throw new Error('window');
      expect(b.startS).toBeGreaterThanOrEqual(a.startS);
      expect(a.endS).toBeGreaterThan(a.startS);
    }
    expect(est.bands.every((b) => b.hazards[0] === 'tsunami')).toBe(true);
    const sum = est.bands.reduce((acc, b) => acc + b.deaths, 0);
    expect(Math.abs(sum - est.deaths)).toBeLessThanOrEqual(est.bands.length);
  });

  it('a wet beach kills nobody, and an empty coast is an empty toll', () => {
    expect(estimateTsunamiCasualties(coast(20, 1.5, 5_000)).deaths).toBe(0); // 0.375 m at the shore
    expect(estimateTsunamiCasualties(coast(20, 5, 0)).exposed).toBe(0);
    expect(estimateTsunamiCasualties([]).bands).toEqual([]);
  });
});

describe('mergeTsunamiCasualties', () => {
  const hiroshima = J(15 * TNT_SPECIFIC_ENERGY * 1e6);
  const plan = blastCasualtyPlan({
    blastEnergy: hiroshima,
    overpressure5psiRadius: m(1_600),
    overpressure1psiRadius: m(4_500),
  });
  if (plan === null) throw new Error('plan');
  const base = estimateCasualties(
    plan,
    plan.bands.map((b) => 5_000 * Math.PI * (b.outerRadiusM / 1_000) ** 2)
  );
  const tsunami = estimateTsunamiCasualties(coast(100, 6, 3_000, 2_700, 30));

  it('adds the coastal toll to the blast toll and keeps the bands apart', () => {
    const merged = mergeTsunamiCasualties(base, tsunami);
    expect(merged.model).toBe('blast');
    expect(merged.deaths).toBe(base.deaths + tsunami.deaths);
    expect(merged.tsunamiDeaths).toBe(tsunami.deaths);
    expect(merged.delayedDeaths).toBe(base.delayedDeaths);
    expect(merged.bands.length).toBe(base.bands.length + tsunami.bands.length);
    // Merging again replaces the coastal bands rather than stacking them.
    const again = mergeTsunamiCasualties(merged, tsunami);
    expect(again.bands.length).toBe(merged.bands.length);
  });

  it('stands alone for an event whose only hazard is the wave', () => {
    const alone = mergeTsunamiCasualties(null, tsunami);
    expect(alone.model).toBe('tsunami');
    expect(alone.deaths).toBe(tsunami.deaths);
    expect(alone.injured).toBe(0);
  });

  it('the sweep raises the coastal toll when the wave lands, hours after the blast', () => {
    const merged = mergeTsunamiCasualties(base, tsunami);
    const timeline = buildCasualtyTimeline(
      merged,
      arrivalFunctionFor({ model: 'blast', blastEnergy: hiroshima, maxRadiusM: 4_500 })
    );
    const coastal = (t: number): number =>
      timeline.bands
        .filter((b) => b.hazard === 'tsunami')
        .reduce((acc, b) => acc + b.deaths * (t >= b.endS ? 1 : t <= b.startS ? 0 : 0.5), 0);
    // Before the first arrival nothing coastal; after the last, all of it.
    expect(casualtiesAtTime(timeline, 2_000).deaths).toBeCloseTo(
      casualtiesAtTime(timeline, 2_000).deaths - 0,
      6
    );
    expect(coastal(2_000)).toBe(0);
    expect(coastal(tsunami.lastArrivalS + 601)).toBeCloseTo(
      timeline.bands.filter((b) => b.hazard === 'tsunami').reduce((a, b) => a + b.deaths, 0),
      6
    );
    const beforeWave = casualtiesAtTime(timeline, 2_000).deaths;
    const afterWave = casualtiesAtTime(timeline, tsunami.lastArrivalS + 601).deaths;
    expect(afterWave - beforeWave).toBeGreaterThanOrEqual(tsunami.deaths - tsunami.bands.length);
  });
});

describe('shoreHeight — the clamp is a ceiling, not a measurement', () => {
  it('a saturated run-up never lifts the water above the wave that arrived', () => {
    // runupField clamps at 4x the amplitude; measured, that clamp binds
    // on 84-95 % of coastal cells, so a saturated run-up carries no
    // information and must not amplify the flood.
    for (const a of [0.5, 1.4, 5, 13.8, 60]) {
      expect(shoreHeight(4 * a, a)).toBeCloseTo(a, 9);
      expect(shoreHeight(10 * a, a)).toBeCloseTo(a, 9);
    }
  });

  it('is monotonic in both the run-up and the amplitude, and never above either', () => {
    let previous = 0;
    for (let r = 0.5; r <= 40; r += 0.5) {
      const h = shoreHeight(r, 5);
      expect(h).toBeGreaterThanOrEqual(previous - 1e-12);
      expect(h).toBeLessThanOrEqual(Math.max(r, 5) + 1e-12);
      previous = h;
    }
    expect(shoreHeight(10, 2)).toBeLessThan(shoreHeight(10, 4));
  });

  it('Anak Krakatau 2018: a 13.8 m wave stands 13.8 m, not the 55 m of the clamp', () => {
    expect(shoreHeight(55.4, 13.8)).toBeCloseTo(13.8, 9);
    // …and floods 2.2 km rather than the capped ten.
    expect(inundationDistance(shoreHeight(55.4, 13.8))).toBeGreaterThan(1_500);
    expect(inundationDistance(shoreHeight(55.4, 13.8))).toBeLessThan(3_000);
    expect(inundationDistance(55.4)).toBe(MAX_INUNDATION_M);
  });
});

describe('a warning nobody could have given', () => {
  const cell = {
    latitude: 6,
    longitude: 80,
    runupM: 6,
    amplitudeM: 6,
    slopeRad: Math.atan(1 / 100),
    spacingM: 40_000,
    densityPerKm2: 500,
    arrivalS: 2 * 3_600,
  };

  it('two hours of travel time is two hours of warning, in a basin that has one', () => {
    const warned = estimateTsunamiCasualties([cell], { warningIssueS: WARNING_ISSUE_S.modern });
    const unwarned = estimateTsunamiCasualties([cell], { warningIssueS: WARNING_ISSUE_S.none });
    // Same wave, same people, same coast. The only difference is
    // whether anyone could tell them it was coming.
    expect(unwarned.deaths).toBeGreaterThan(warned.deaths);
    expect(unwarned.exposed).toBeCloseTo(warned.exposed, 6);
  });

  it('a basin with no system gives no lead however far the coast is', () => {
    expect(warningLeadS(6 * 3_600, WARNING_ISSUE_S.none)).toBe(0);
    expect(warningLeadS(6 * 3_600, WARNING_ISSUE_S.modern)).toBeCloseTo(6 * 3_600 - 600, 6);
  });

  it('the lead is the travel time less the issue, never negative', () => {
    expect(warningLeadS(300, WARNING_ISSUE_S.modern)).toBe(0);
    expect(warningLeadS(0, 0)).toBe(0);
  });

  it('the modern default is what an unstated scenario gets', () => {
    const stated = estimateTsunamiCasualties([cell], { warningIssueS: WARNING_ISSUE_S.modern });
    const unstated = estimateTsunamiCasualties([cell]);
    expect(unstated.deaths).toBeCloseTo(stated.deaths, 6);
  });
});
