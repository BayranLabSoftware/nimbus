/**
 * Store-setter ↔ schema-validator consistency.
 *
 * Pins the contract that `set*Input` setters DO NOT classify input
 * differently than `validateScenario` would. Specifically:
 *   - If validator says 'invalid' → state remains unchanged.
 *   - If validator says 'normalized' / 'suspicious' / 'accepted' →
 *     state advances to CUSTOM with the validator's normalized payload.
 *
 * Closes L1 in `CONSOLIDATION_AUDIT.md`. Catches future regressions
 * if a contributor reintroduces inline `if (override > 0)` filters
 * that compete with the schema.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { useAppStore } from './useAppStore.js';
import { validateScenario } from '../physics/validation/inputSchema.js';

interface SetterCase {
  label: string;
  /** Apply a setter on the store. */
  apply: () => void;
  /** Read back the input from the store after `apply`. */
  read: () => unknown;
  /** Type used for `validateScenario`. */
  type: 'earthquake' | 'explosion' | 'volcano' | 'landslide' | 'impact';
  /** Build the merged-input that the setter is conceptually applying.
   *  This must match the in-setter merge — type-correct (branded) so
   *  the validator sees the same shape it sees in the setter. */
  buildMerged: () => Record<string, unknown>;
  /** Whether validator-classified outcome should match the stored
   *  input (true for non-invalid) or the previous state (false for
   *  invalid). */
  expectStateChanged: boolean;
}

function resetStore(): void {
  useAppStore.setState(useAppStore.getInitialState());
}

describe('Store-setter ↔ schema-validator consistency', () => {
  beforeEach(() => {
    resetStore();
  });

  it('VALID input: setter applies the validator-classified payload', () => {
    const initialMagnitude = useAppStore.getState().earthquake.input.magnitude;
    expect(initialMagnitude).toBeGreaterThan(0); // sanity

    useAppStore.getState().setEarthquakeInput({ magnitude: 7.5 });
    const stored = useAppStore.getState().earthquake.input;

    const v = validateScenario('earthquake', { ...stored });
    expect(v.result.status).not.toBe('invalid');
    expect(stored.magnitude).toBe(7.5);
  });

  it('INVALID input (NaN magnitude): state is unchanged, validator says invalid', () => {
    const before = useAppStore.getState().earthquake.input;
    useAppStore.getState().setEarthquakeInput({ magnitude: Number.NaN });
    const after = useAppStore.getState().earthquake.input;
    expect(after).toEqual(before);

    const v = validateScenario('earthquake', { magnitude: Number.NaN });
    expect(v.result.status).toBe('invalid');
  });

  it('INVALID input (negative magnitude): state is unchanged', () => {
    const before = useAppStore.getState().earthquake.input;
    useAppStore.getState().setEarthquakeInput({ magnitude: -5 });
    const after = useAppStore.getState().earthquake.input;
    expect(after).toEqual(before);
  });

  it('a custom edit keeps what the preset carried and the wind the panel set', () => {
    // Until 14 September 2026 the explosion validator copied six fields
    // and the store kept only those: editing Beirut made it nuclear, and
    // the wind slider sprang back because its value never arrived.
    useAppStore.getState().selectPreset('BEIRUT_2020');
    useAppStore.getState().setExplosionInput({ windSpeed: 20, windDirectionDeg: 45 });
    const stored = useAppStore.getState().explosion.input;
    expect(stored.chargeType).toBe('chemical');
    expect(stored.windSpeed as number | undefined).toBe(20);
    expect(stored.windDirectionDeg).toBe(45);
    useAppStore.getState().setExplosionInput({ yieldMegatons: 0.001 });
    expect(useAppStore.getState().explosion.input.chargeType).toBe('chemical');
    expect(useAppStore.getState().explosion.input.windSpeed as number | undefined).toBe(20);
  });

  it('a custom edit keeps a historical basin with no warning system, and the ocean an impact crosses', () => {
    // Two more fields the validators did not copy until 14 September
    // 2026. Editing the magnitude of Sumatra 2004 gave its coasts a
    // warning nobody could have issued; editing the ocean Chicxulub
    // put it back on the default basin.
    useAppStore.getState().selectPreset('SUMATRA_2004');
    useAppStore.getState().setEarthquakeInput({ magnitude: 9.1 });
    expect(useAppStore.getState().earthquake.input.warningIssueS).toBe(Number.POSITIVE_INFINITY);

    useAppStore.getState().selectPreset('CHICXULUB_OCEAN');
    const basin = useAppStore.getState().impact.input.meanOceanDepth;
    expect(basin).toBeDefined();
    useAppStore.getState().setImpactInput({ impactVelocity: 18_000 });
    expect(useAppStore.getState().impact.input.meanOceanDepth).toBe(basin);
  });

  it('the landslide panel sets every optional field, and clears it back to the default', () => {
    // The slide density was read by the model but not copied by the
    // validator until 14 September 2026: no edit could keep one.
    useAppStore.getState().selectPreset('VAIONT_1963');
    useAppStore.getState().setLandslideInput({
      slideDensity: 2_700,
      slideFootprintArea: 4e6,
      confinementDynamicFactor: 2.5,
    });
    const set = useAppStore.getState().landslide;
    expect(set.preset).toBe('CUSTOM');
    expect(set.input).toMatchObject({
      confinedBasinArea: 3e6,
      confinementDynamicFactor: 2.5,
      slideDensity: 2_700,
      slideFootprintArea: 4e6,
    });

    useAppStore.getState().setLandslideInput({
      confinedBasinArea: null,
      confinementDynamicFactor: null,
      slideFootprintArea: null,
      slideDensity: null,
    });
    const cleared = useAppStore.getState().landslide.input;
    expect(cleared).not.toHaveProperty('confinedBasinArea');
    expect(cleared).not.toHaveProperty('confinementDynamicFactor');
    expect(cleared).not.toHaveProperty('slideFootprintArea');
    expect(cleared).not.toHaveProperty('slideDensity');
    expect(cleared.volumeM3).toBe(2.7e8);
  });

  it('a slide density must be positive, and one no denser than seawater is flagged', () => {
    const zero = validateScenario('landslide', { volumeM3: 1e8, slideDensity: 0 });
    expect(zero.result.status).toBe('invalid');
    expect(zero.result.errors.map((e) => e.code)).toContain('ZERO_FORBIDDEN');

    const floating = validateScenario('landslide', { volumeM3: 1e8, slideDensity: 1_000 });
    expect(floating.result.status).not.toBe('invalid');
    expect(floating.result.warnings.map((w) => [w.field, w.code])).toContainEqual([
      'slideDensity',
      'PHYS_SUSPICIOUS_LOW',
    ]);
  });

  it('INVALID input (zero yield): state is unchanged', () => {
    const before = useAppStore.getState().explosion.input;
    useAppStore.getState().setExplosionInput({ yieldMegatons: 0 });
    const after = useAppStore.getState().explosion.input;
    expect(after).toEqual(before);
  });

  it('NORMALIZED input (impactAzimuth 405°): setter stores the validator-normalized 45°', () => {
    useAppStore.getState().setImpactInput({ impactAzimuthDeg: 405 });
    const stored = useAppStore.getState().impact.input;
    expect(stored.impactAzimuthDeg).toBe(45);

    // Validator agreement.
    const v = validateScenario('impact', { ...stored });
    expect(v.result.status).not.toBe('invalid');
  });

  it('NORMALIZED input (impactAzimuth -90°): setter stores 270°', () => {
    useAppStore.getState().setImpactInput({ impactAzimuthDeg: -90 });
    expect(useAppStore.getState().impact.input.impactAzimuthDeg).toBe(270);
  });

  it('SUSPICIOUS input (Mw 11): setter accepts and stores; validator flags PHYS_SUSPICIOUS_HIGH', () => {
    useAppStore.getState().setEarthquakeInput({ magnitude: 11 });
    const stored = useAppStore.getState().earthquake.input;
    expect(stored.magnitude).toBe(11);
    const v = validateScenario('earthquake', { ...stored });
    expect(v.result.status).toBe('suspicious');
    expect(v.result.warnings.map((w) => w.code)).toContain('PHYS_SUSPICIOUS_HIGH');
  });

  it('Volcano: zero volumeEruptionRate is invalid → state unchanged', () => {
    const before = useAppStore.getState().volcano.input;
    useAppStore.getState().setVolcanoInput({ volumeEruptionRate: 0 });
    const after = useAppStore.getState().volcano.input;
    expect(after).toEqual(before);
  });

  it('Landslide: zero slopeAngleDeg is invalid → state unchanged', () => {
    const before = useAppStore.getState().landslide.input;
    useAppStore.getState().setLandslideInput({ slopeAngleDeg: 0 });
    const after = useAppStore.getState().landslide.input;
    expect(after).toEqual(before);
  });

  it('Partial override: unaffected fields remain at their previous value', () => {
    // Set a baseline.
    useAppStore.getState().setEarthquakeInput({ magnitude: 6.5, vs30: 600 });
    expect(useAppStore.getState().earthquake.input.magnitude).toBe(6.5);
    expect(useAppStore.getState().earthquake.input.vs30).toBe(600);

    // Update only magnitude.
    useAppStore.getState().setEarthquakeInput({ magnitude: 7.0 });
    expect(useAppStore.getState().earthquake.input.magnitude).toBe(7.0);
    // vs30 must persist.
    expect(useAppStore.getState().earthquake.input.vs30).toBe(600);
  });

  it('No silent cleanup: a NaN-bearing override does NOT half-update other fields', () => {
    // Baseline.
    useAppStore.getState().setEarthquakeInput({ magnitude: 7.0, vs30: 760 });
    const baseline = useAppStore.getState().earthquake.input;

    // Mixed override: NaN magnitude + new vs30. The whole input is
    // invalid → no field should land. (Pre-fix the inline guards
    // would have silently dropped `magnitude` but kept `vs30`.)
    useAppStore.getState().setEarthquakeInput({
      magnitude: Number.NaN,
      vs30: 800,
    });
    expect(useAppStore.getState().earthquake.input).toEqual(baseline);
  });

  // Cross-verifying the 5 setters against the validator at once.
  const SETTERS: SetterCase[] = [
    {
      label: 'earthquake | invalid (NaN)',
      apply: () => useAppStore.getState().setEarthquakeInput({ magnitude: Number.NaN }),
      read: () => useAppStore.getState().earthquake.input,
      type: 'earthquake',
      buildMerged: () => ({ ...useAppStore.getState().earthquake.input, magnitude: Number.NaN }),
      expectStateChanged: false,
    },
    {
      label: 'explosion | invalid (negative yield)',
      apply: () => useAppStore.getState().setExplosionInput({ yieldMegatons: -1 }),
      read: () => useAppStore.getState().explosion.input,
      type: 'explosion',
      buildMerged: () => ({ ...useAppStore.getState().explosion.input, yieldMegatons: -1 }),
      expectStateChanged: false,
    },
    {
      label: 'explosion | valid (wind, which the validator used to throw away)',
      apply: () =>
        useAppStore.getState().setExplosionInput({ windSpeed: 15, windDirectionDeg: 200 }),
      read: () => useAppStore.getState().explosion.input,
      type: 'explosion',
      buildMerged: () => ({
        ...useAppStore.getState().explosion.input,
        windSpeed: 15,
        windDirectionDeg: 200,
      }),
      expectStateChanged: true,
    },
    {
      label: 'explosion | valid (a depth of burst, under the water)',
      apply: () => useAppStore.getState().setExplosionInput({ heightOfBurst: -30 }),
      read: () => useAppStore.getState().explosion.input,
      type: 'explosion',
      buildMerged: () => ({ ...useAppStore.getState().explosion.input, heightOfBurst: -30 }),
      expectStateChanged: true,
    },
    {
      label: 'explosion | invalid (deeper than any ocean)',
      apply: () => useAppStore.getState().setExplosionInput({ heightOfBurst: -12_000 }),
      read: () => useAppStore.getState().explosion.input,
      type: 'explosion',
      buildMerged: () => ({ ...useAppStore.getState().explosion.input, heightOfBurst: -12_000 }),
      expectStateChanged: false,
    },
    {
      label: 'volcano | invalid (zero rate)',
      apply: () => useAppStore.getState().setVolcanoInput({ volumeEruptionRate: 0 }),
      read: () => useAppStore.getState().volcano.input,
      type: 'volcano',
      buildMerged: () => ({ ...useAppStore.getState().volcano.input, volumeEruptionRate: 0 }),
      expectStateChanged: false,
    },
    {
      label: 'landslide | invalid (slope 0)',
      apply: () => useAppStore.getState().setLandslideInput({ slopeAngleDeg: 0 }),
      read: () => useAppStore.getState().landslide.input,
      type: 'landslide',
      buildMerged: () => ({ ...useAppStore.getState().landslide.input, slopeAngleDeg: 0 }),
      expectStateChanged: false,
    },
  ];

  for (const c of SETTERS) {
    it(`Cross-check: ${c.label}`, () => {
      const before = c.read();
      const v = validateScenario(c.type, c.buildMerged());

      c.apply();
      const after = c.read();

      const stateChanged = JSON.stringify(after) !== JSON.stringify(before);
      const validatorRejected = v.result.status === 'invalid';

      // The setter changes state IFF the validator did NOT reject it.
      expect(
        !stateChanged,
        `setter changed state but validator rejected. validator: ${JSON.stringify(v.result.errors)}`
      ).toBe(validatorRejected);

      if (c.expectStateChanged) {
        expect(stateChanged).toBe(true);
      } else {
        expect(stateChanged).toBe(false);
      }
    });
  }
});
