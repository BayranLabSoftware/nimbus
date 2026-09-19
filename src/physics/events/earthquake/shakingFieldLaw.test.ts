import { describe, expect, it } from 'vitest';
import { EARTHQUAKE_PRESETS, bandEdge, intensityLawOf, simulateEarthquake } from './simulate.js';

/**
 * Rule 309 of `validation/shakingFieldRules.ts`, and the one thing that can go
 * wrong with it: `intensityAt` is the law the contours are drawn by, read
 * forwards, so at the radius of a contour it must give that contour's
 * intensity. A branch that drifted from its mirror would draw a picture the
 * field disagrees with, on the very events the project publishes.
 */

/** Every preset that is an earthquake, so every branch is exercised by a
 *  scenario the project actually ships rather than by one invented here. */
const PRESETS = Object.entries(
  EARTHQUAKE_PRESETS as unknown as Record<
    string,
    { input: Parameters<typeof simulateEarthquake>[0] }
  >
);

describe('rule 309 — the field is the contour law read forwards', () => {
  it('gives each contour’s own intensity at that contour’s radius', () => {
    let checked = 0;
    for (const [name, preset] of PRESETS) {
      const result = simulateEarthquake(preset.input);
      const vs30 = preset.input.vs30 ?? 760;
      for (const mmi of [7, 8, 9] as const) {
        const radius = result.shaking[`mmi${mmi.toString()}Radius` as 'mmi7Radius'] as number;
        if (!(radius > 0)) continue; // the law never reaches it here
        const law = intensityLawOf(result);
        expect(law).not.toBeNull();
        const back = (law ?? (() => Number.NaN))(radius, vs30);
        expect(
          Math.abs(back - bandEdge(mmi, preset.input.intensityBanding ?? 'rings')),
          `${name} at MMI ${mmi.toString()}`
        ).toBeLessThan(0.05);
        checked += 1;
      }
    }
    // The presets must actually have exercised the thing.
    expect(checked).toBeGreaterThan(5);
  });

  it('falls with distance and rises on soft ground', () => {
    const result = simulateEarthquake({ magnitude: 7, depth: 10_000 } as Parameters<
      typeof simulateEarthquake
    >[0]);
    const law = intensityLawOf(result) ?? (() => Number.NaN);
    const near = law(10_000, 760);
    const far = law(100_000, 760);
    expect(near).toBeGreaterThan(far);
    // Soft ground shakes harder than rock at the same distance, which is the
    // whole reason the field exists.
    expect(law(50_000, 250)).toBeGreaterThan(law(50_000, 760));
  });

  it('takes the scenario’s own site where none is given', () => {
    const result = simulateEarthquake({ magnitude: 6.5, depth: 10_000, vs30: 300 } as Parameters<
      typeof simulateEarthquake
    >[0]);
    const law = intensityLawOf(result) ?? (() => Number.NaN);
    expect(law(20_000, Number.NaN)).toBeCloseTo(law(20_000, 300), 9);
  });
});
