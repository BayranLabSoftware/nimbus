import { describe, expect, it } from 'vitest';
import { CHARTER_V1_STATUS } from './independentTestCharter.js';
import {
  arrivalBreakdown,
  CHARTER_V2,
  DECISIVE_V2,
  craterWorsensV2,
  drawState,
  F_ADOPTABLE_THIS_ROUND,
  groundReading,
  groundVerdict,
  pieceClass,
  releaseStatus,
  V2_OBSERVABLES,
  verdictV2,
  type BodyDocumentation,
  type GroundState,
} from './independentTestCharterV2.js';

const draws = (spec: Partial<Record<GroundState, number>>): GroundState[] =>
  (Object.entries(spec) as [GroundState, number][]).flatMap(([s, k]) =>
    Array.from({ length: k }, () => s)
  );

const ALL: BodyDocumentation = { recovery: true, noCrater: true, regime: true };
const RECOVERY_ONLY: BodyDocumentation = { recovery: true, noCrater: false, regime: false };

describe('rule 1099: the first charter suspended as a judge', () => {
  it('is kept frozen, and not run to decide an adoption', () => {
    expect(CHARTER_V1_STATUS.frozen).toBe(true);
    expect(CHARTER_V1_STATUS.executableForAdoption).toBe(false);
    expect(CHARTER_V2.frozen).toBe(false);
  });
});

describe('rule 1107: the arrivals of a draw, exhaustive', () => {
  it('classes each piece on its own', () => {
    // Rule 1116: a crater only where the model's own code computed one.
    expect(pieceClass(6_000, false, true)).toBe('crater');
    expect(pieceClass(6_000, false)).toBe('fast');
    expect(pieceClass(60, true)).toBe('darkFlight');
    expect(pieceClass(900, false)).toBe('between');
  });

  it('sets the draw’s state by a fixed precedence', () => {
    expect(drawState([])).toBe('nothing');
    expect(drawState(['darkFlight', 'darkFlight'])).toBe('darkFlight');
    // Mixed: some at terminal speed, one between — the draw is between.
    expect(drawState(['darkFlight', 'between', 'darkFlight'])).toBe('between');
    // One piece digging a crater and others slow — the draw has a crater.
    expect(drawState(['between', 'crater', 'darkFlight'])).toBe('crater');
    // A fast arrival prevails over the slow ones, and is never a crater.
    expect(drawState(['darkFlight', 'fast', 'between'])).toBe('fast');
  });

  it('counts every class, so the state that prevails hides none (rule 1117)', () => {
    const b = arrivalBreakdown([
      [
        { cls: 'darkFlight', mass: 3 },
        { cls: 'between', mass: 1 },
      ],
      [{ cls: 'darkFlight', mass: 2 }],
      [],
    ]);
    expect(b.between.drawsWith).toBeCloseTo(1 / 3, 12);
    expect(b.darkFlight.drawsWith).toBeCloseTo(2 / 3, 12);
    expect(b.darkFlight.meanMassShare).toBeCloseTo((0.75 + 1) / 2, 12);
    expect(b.crater.drawsWith).toBe(0);
  });
});

describe('rules 1102, 1108 and 1110: the questions of the ground', () => {
  it('never reads out of the domain as «no crater» nor as «crater»', () => {
    const r = groundReading(draws({ darkFlight: 90, between: 10 }));
    expect(r.q1).toBe(1);
    expect(r.joint).toBeCloseTo(0.9, 12);
    expect(r.q2Draws).toBe(0);
    expect(r.q2CraterShare).toBeNull();
    expect(r.craters).toBe(0);
    expect(r.q3).toBeCloseTo(0.9, 12);
  });

  it('keeps D3 a description, not assessable where fewer than half arrive', () => {
    const r = groundReading(draws({ nothing: 60, darkFlight: 40 }));
    expect(r.q3).toBeNull();
    // The joint outcome reads all the draws, so the few arrivals show there.
    expect(r.joint).toBeCloseTo(0.4, 12);
  });

  it('credits a fall’s meteorites in dark flight against a burst, through J', () => {
    const v = groundVerdict(
      [0, 1, 2].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ darkFlight: 95, between: 5 })),
        documented: ALL,
      }))
    );
    expect(v.joint.gain).toBeCloseTo(0.95, 12);
    expect(v.worsens).toBe(false);
    expect(v.improves).toBe(true);
  });

  it('does not let survival be bought with arrivals a documented fall contradicts', () => {
    // J eligible on three bodies: the model's gain of D1 comes from arrivals
    // between, and J does not rise — no improvement.
    const v = groundVerdict(
      [0, 1, 2].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ between: 100 })),
        documented: ALL,
      }))
    );
    expect(v.d1.improves).toBe(true);
    expect(v.joint.improves).toBe(false);
    expect(v.improves).toBe(false);
  });

  it('lets D1 decide alone where the regime is documented on fewer than three', () => {
    const v = groundVerdict(
      [0, 1, 2].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ between: 100 })),
        documented: RECOVERY_ONLY,
      }))
    );
    expect(v.joint.eligible).toBe(0);
    expect(v.improves).toBe(true);
  });

  it('reads fast arrivals alike for every model in the worsening (rule 1116)', () => {
    const baseline = groundReading(draws({ nothing: 100 }));
    const model = groundReading(draws({ fast: 20, darkFlight: 80 }));
    expect(model.craters).toBe(0);
    expect(model.lawSpeedShareAll).toBeCloseTo(0.2, 12);
    expect(model.joint).toBeCloseTo(0.8, 12);
    expect(craterWorsensV2(baseline, model)).toBe(true);
  });

  it('worsens by craters only where «no crater» is documented', () => {
    const baseline = groundReading(draws({ nothing: 100 }));
    const model = groundReading(draws({ crater: 20, darkFlight: 80 }));
    expect(craterWorsensV2(baseline, model)).toBe(true);
    const documented = groundVerdict([0, 1, 2].map(() => ({ baseline, model, documented: ALL })));
    expect(documented.worsens).toBe(true);
    const silent = groundVerdict(
      [0, 1, 2].map(() => ({ baseline, model, documented: RECOVERY_ONLY }))
    );
    expect(silent.craters).toBe(false);
  });

  it('cannot improve on fewer than three bodies', () => {
    const v = groundVerdict(
      [0, 1].map(() => ({
        baseline: groundReading(draws({ nothing: 100 })),
        model: groundReading(draws({ darkFlight: 100 })),
        documented: ALL,
      }))
    );
    expect(v.improves).toBe(false);
  });
});

describe('rule 1111: O1’s draws, each accounted for', () => {
  it('never excludes a draw with no crater, in or out of the law’s domain', () => {
    expect(releaseStatus('darkFlight', 31_000)).toBe('produced');
    expect(releaseStatus('between', 31_000)).toBe('produced');
    expect(releaseStatus('crater', 31_000)).toBe('excludedBySelection');
    expect(releaseStatus('darkFlight', null)).toBe('notProduced');
    expect(releaseStatus('nothing', 31_000, false)).toBe('notConvergent');
  });
});

describe('rules 1114 and 1115: O2 diagnostic, and the decisive observables left', () => {
  it('gives no model credit on O2, and leaves O1 and the ground outcome', () => {
    expect(V2_OBSERVABLES.O2.role).toBe('diagnostic');
    expect(V2_OBSERVABLES.O2.assessableFor).toHaveLength(0);
    expect(DECISIVE_V2).toEqual(['O1', 'ground']);
    expect(V2_OBSERVABLES.O1.assessableFor).not.toContain('F');
    expect(V2_OBSERVABLES.O4.assessableFor).toHaveLength(0);
  });

  it('adopts only where both are assessable and improve, neither worsening', () => {
    const yes = { assessable: true, improves: true, worsens: false };
    const off = { assessable: false, improves: false, worsens: false };
    expect(verdictV2(yes, yes).adoptable).toBe(true);
    // F: O1 not assessable — the ground outcome alone cannot adopt it.
    expect(verdictV2(off, yes).adoptable).toBe(false);
    expect(F_ADOPTABLE_THIS_ROUND).toBe(false);
    expect(verdictV2(yes, { ...yes, improves: false }).adoptable).toBe(false);
    expect(verdictV2(yes, { ...yes, worsens: true }).adoptable).toBe(false);
  });
});
