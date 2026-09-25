import { describe, expect, it } from 'vitest';
import { validateScenario } from './inputSchema.js';

/**
 * Rule 1203: A12's "le soglie di avviso contraddicono i loro testi" --
 * every `PHYS_SUSPICIOUS_*` warning `validateImpactInput` can raise now
 * states its OWN threshold before naming the physical reference it sits
 * near, so a reader can never read a message and conclude a value should
 * have warned when the validator's own code says otherwise (or the
 * reverse). One case per warning, holding it to the letter: the threshold
 * number itself appears in the message.
 */

const BASE_IMPACT = {
  impactorDiameter: 1_000,
  impactVelocity: 20_000,
  impactorDensity: 3_000,
  targetDensity: 2_500,
  impactAngleDeg: 45,
  surfaceGravity: 9.81,
};

function warningsOf(over: Record<string, unknown>): { field: string; message: string }[] {
  const v = validateScenario('impact', { ...BASE_IMPACT, ...over });
  if (v.result.status === 'invalid') throw new Error('fixture itself is invalid');
  return v.result.warnings.map((w) => ({ field: w.field, message: w.message }));
}

describe("rule 1203: a suspicious-value warning's own threshold is in its own text", () => {
  it('impactVelocity below 1 km/s: the message names its own 1 km/s floor, not just 11.2', () => {
    const w = warningsOf({ impactVelocity: 500 }).find((x) => x.field === 'impactVelocity');
    expect(w?.message).toContain('1 km/s');
    expect(w?.message).toContain('11.2');
  });

  it('impactVelocity above 80 km/s: the message names its own 80 km/s ceiling, not just 73', () => {
    const w = warningsOf({ impactVelocity: 85_000 }).find((x) => x.field === 'impactVelocity');
    expect(w?.message).toContain('80 km/s');
    expect(w?.message).toContain('73');
  });

  it('impactorDensity outside [500, 8000]: the message names that exact bracket, not [600, 7800] alone', () => {
    const low = warningsOf({ impactorDensity: 450 }).find((x) => x.field === 'impactorDensity');
    expect(low?.message).toContain('500');
    expect(low?.message).toContain('8000');
    const high = warningsOf({ impactorDensity: 8_100 }).find((x) => x.field === 'impactorDensity');
    expect(high?.message).toContain('500');
    expect(high?.message).toContain('8000');
  });

  it('impactorDiameter above 100 km: the message names its own 100 km ceiling, not just Vredefort’s 10-15', () => {
    const w = warningsOf({ impactorDiameter: 150_000 }).find((x) => x.field === 'impactorDiameter');
    expect(w?.message).toContain('100 km');
  });

  it('shoreDistance above 5 000 km: the message names its own 5 000 km ceiling, not just ~2 650', () => {
    const w = warningsOf({ shoreDistance: 6_000_000 }).find((x) => x.field === 'shoreDistance');
    expect(w?.message).toContain('5 000 km');
  });

  it('a value the text alone might suggest should warn, but the code does not, warns nothing', () => {
    // 5 km/s reads "below 11.2" in the old wording; the code's own floor
    // is 1 km/s, so this must NOT warn.
    expect(warningsOf({ impactVelocity: 5_000 })).toHaveLength(0);
    // 550 kg/m³ reads "outside [600, 7800]" in the old wording; the
    // code's own bracket is [500, 8000], so this must NOT warn either.
    expect(warningsOf({ impactorDensity: 550 })).toHaveLength(0);
  });
});
