import { describe, expect, it } from 'vitest';
import { refusalOf } from './fieldRefusal.js';

/** Rule 1214: what the impact's number fields refuse, and why. */
describe('a typed value the model refuses is refused for a reason it can say', () => {
  it('takes a number above zero, and an angle up to 90°', () => {
    expect(refusalOf('19.8', 'impactorDiameter')).toBeNull();
    expect(refusalOf('90', 'impactAngle')).toBeNull();
    expect(refusalOf('0.5', 'impactVelocity')).toBeNull();
  });

  it('names each refusal', () => {
    expect(refusalOf('abc', 'impactorDiameter')).toBe('NOT_NUMBER');
    expect(refusalOf('0', 'impactorDensity')).toBe('ZERO_FORBIDDEN');
    expect(refusalOf('-5', 'impactVelocity')).toBe('NEGATIVE_FORBIDDEN');
    expect(refusalOf('95', 'impactAngle')).toBe('OUT_OF_DOMAIN');
    // Above 90 is refused for the angle alone.
    expect(refusalOf('95', 'targetDensity')).toBeNull();
  });
});
