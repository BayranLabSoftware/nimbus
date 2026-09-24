import { describe, expect, it } from 'vitest';
import { CHARTER_V1_STATUS } from './independentTestCharter.js';
import {
  CHARTER_V2,
  craterWorsensV2,
  groundReading,
  groundVerdict,
  V2_OBSERVABLES,
  type GroundState,
} from './independentTestCharterV2.js';

const draws = (spec: Partial<Record<GroundState, number>>): GroundState[] =>
  (Object.entries(spec) as [GroundState, number][]).flatMap(([s, k]) =>
    Array.from({ length: k }, () => s)
  );

describe('rule 1099: the first charter suspended as a judge', () => {
  it('is kept frozen, and not run to decide an adoption', () => {
    expect(CHARTER_V1_STATUS.frozen).toBe(true);
    expect(CHARTER_V1_STATUS.executableForAdoption).toBe(false);
    expect(CHARTER_V2.frozen).toBe(false);
  });
});

describe('rules 1102 and 1103: the three questions of the ground', () => {
  it('never reads out of the domain as «no crater» nor as «crater»', () => {
    const r = groundReading(draws({ darkFlight: 90, between: 10 }));
    expect(r.q1).toBe(1);
    // No draw in the law's domain: Q2 has no answer, not a «no crater».
    expect(r.q2Draws).toBe(0);
    expect(r.q2CraterShare).toBeNull();
    expect(r.q3).toBeCloseTo(0.9, 12);
    expect(r.betweenShare).toBeCloseTo(0.1, 12);
  });

  it('leaves Q3 not assessable where fewer than half the draws arrive', () => {
    const r = groundReading(draws({ nothing: 60, darkFlight: 40 }));
    expect(r.q1).toBeCloseTo(0.4, 12);
    expect(r.q3).toBeNull();
    expect(r.q2CraterShare).toBe(0);
  });

  it('gives a fall’s meteorites in dark flight no loss against a burst', () => {
    // The case rule 1098 (c) found: the baseline bursts, the variant brings the
    // meteorites down in dark flight — the outcome a fall shows.
    const bodies = [0, 1, 2].map(() => ({
      baseline: groundReading(draws({ nothing: 100 })),
      model: groundReading(draws({ darkFlight: 95, between: 5 })),
    }));
    const v = groundVerdict(bodies);
    expect(v.q1.gain).toBe(1);
    // Q3 is not assessable for the baseline, so it is not compared.
    expect(v.q3.comparable).toBe(0);
    expect(v.worsens).toBe(false);
    expect(v.improves).toBe(true);
  });

  it('still worsens a model that digs craters on a fall', () => {
    const baseline = groundReading(draws({ nothing: 100 }));
    const model = groundReading(draws({ crater: 20, darkFlight: 80 }));
    expect(craterWorsensV2(baseline, model)).toBe(true);
    const v = groundVerdict([0, 1, 2].map(() => ({ baseline, model })));
    expect(v.worsens).toBe(true);
    expect(v.improves).toBe(false);
  });

  it('does not let a gain of survival be bought with arrivals a fall contradicts', () => {
    // The baseline bursts; the variant brings material down, but between dark
    // flight and the crater law's speeds — not what a fall shows.
    const v = groundVerdict(
      [0, 1, 2].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ between: 60, darkFlight: 40 })),
      }))
    );
    expect(v.q1.gain).toBe(1);
    expect(v.barred).toBe(true);
    expect(v.improves).toBe(false);
  });

  it('cannot improve on fewer than three comparable bodies', () => {
    const v = groundVerdict(
      [0, 1].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ darkFlight: 100 })),
      }))
    );
    expect(v.improves).toBe(false);
  });
});

describe('rule 1105: what can be assessed', () => {
  it('gives F nothing for O1 and no model O4', () => {
    expect(V2_OBSERVABLES.O1.producedBy).not.toContain('F');
    expect(V2_OBSERVABLES.O4.producedBy).toHaveLength(0);
  });
});
