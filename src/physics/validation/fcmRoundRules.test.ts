import { describe, expect, it } from 'vitest';
import { FCM_CONSTANTS, FCM_DOMAIN, FCM_GATE1, FCM_GATE2, FCM_PRIORS } from './fcmRoundRules.js';

describe('rules 1137 to 1147: the opening dossier of the FCM round', () => {
  it('fixes the branch’s domain and R17’s constants', () => {
    expect(FCM_DOMAIN.angleDeg).toEqual([15, 90]);
    expect(FCM_CONSTANTS.dragCoefficient).toBe(1);
    expect(FCM_CONSTANTS.stepM).toBe(10);
    expect(FCM_CONSTANTS.strengthCeilingPa).toBe(330e6);
  });

  it('draws the free parameters on intervals that span the sources', () => {
    expect(FCM_PRIORS.cDispersionLog).toEqual([1, 3.5]);
    expect(FCM_PRIORS.cDispersionSensitivity).toBeLessThan(FCM_PRIORS.cDispersionLog[0]);
  });

  it('sets the gates before any case', () => {
    expect(FCM_GATE1.convergence).toBe(0.02);
    // Two sources agree on the pancake's peak for Chelyabinsk: ~50 % above ~82.
    const [lo, hi] = FCM_GATE2.chelyabinsk.observedPeakKtKm;
    expect(FCM_GATE2.chelyabinsk.pancakePeakKtKm / lo).toBeCloseTo(1.5, 1);
    expect(FCM_GATE2.chelyabinsk.pancakePeakKtKm / hi).toBeCloseTo(1.48, 1);
    expect(FCM_GATE2.peakAltitudeToleranceM).toBe(1_000);
  });
});
