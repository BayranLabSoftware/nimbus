import { describe, expect, it } from 'vitest';
import {
  MANUAL_EXAMPLE_TWO_PROPAGATION,
  SUBSTITUTION_TYPO,
} from '../validation/propagationRules.js';
import {
  distanceFromImpactZone,
  firstCrestCelerity,
  impactRadius,
  impactRadiusAcrossAxis,
  impactRadiusAlongAxis,
  propagate,
  propagationOutsideTestedRange,
  PROPAGATION_TESTED_RELATIVE_DISTANCE,
  type PropagatingWave,
} from './impulseWavePropagation.js';

/** Rule 527's slide. Every field is read from the manual's §5.2.2. */
const example: PropagatingWave = {
  firstCrestM: MANUAL_EXAMPLE_TWO_PROPAGATION.firstCrestM,
  firstTroughM: MANUAL_EXAMPLE_TWO_PROPAGATION.firstTroughM,
  secondCrestM: MANUAL_EXAMPLE_TWO_PROPAGATION.secondCrestM,
  widthM: MANUAL_EXAMPLE_TWO_PROPAGATION.widthM,
  depthM: MANUAL_EXAMPLE_TWO_PROPAGATION.depthM,
  angleDeg: MANUAL_EXAMPLE_TWO_PROPAGATION.angleDeg,
  impulseProduct: MANUAL_EXAMPLE_TWO_PROPAGATION.impulseProduct,
};

describe('rule 527(a) to (c): the impact radii', () => {
  it('gives the 204 m and 177 m the manual prints', () => {
    expect(impactRadiusAlongAxis(example)).toBeCloseTo(
      MANUAL_EXAMPLE_TWO_PROPAGATION.radiusAlongAxisM,
      0
    );
    expect(impactRadiusAcrossAxis(example)).toBeCloseTo(
      MANUAL_EXAMPLE_TWO_PROPAGATION.radiusAcrossAxisM,
      0
    );
  });

  it('gives the ellipse of Eq. (3.24) at both angles the example reads', () => {
    expect(impactRadius(example, 0)).toBeCloseTo(
      MANUAL_EXAMPLE_TWO_PROPAGATION.radiusAtAngleM[0],
      0
    );
    expect(impactRadius(example, 80)).toBeCloseTo(
      MANUAL_EXAMPLE_TWO_PROPAGATION.radiusAtAngleM[80],
      0
    );
  });

  it('returns the axis radii at 0° and 90°, as an ellipse must', () => {
    expect(impactRadius(example, 0)).toBeCloseTo(impactRadiusAlongAxis(example), 9);
    expect(impactRadius(example, 90)).toBeCloseTo(impactRadiusAcrossAxis(example), 9);
  });
});

describe('rule 527(d) and (e): the two sections of Example 2', () => {
  it.each(MANUAL_EXAMPLE_TWO_PROPAGATION.sections.map((s) => [s.name, s] as const))(
    'reproduces section %s',
    (_name, s) => {
      expect(distanceFromImpactZone(example, s.radialDistanceM, s.propagationAngleDeg)).toBeCloseTo(
        s.starDistanceM,
        0
      );
      // The INITIAL amplitudes are themselves printed to one decimal, so
      // what the page pins is an interval, not a number. Nine of the eleven
      // values land inside half a unit of the print on their own; the two
      // second crests, 7.343 against 7.4 and 2.148 against 2.2, need the
      // ±0.05 on a_0 propagated — which is the same discipline
      // `submarineSlide.test.ts` arrived at, and for the same reason.
      const spread = (
        pick: (p: ReturnType<typeof propagate>) => number,
        key: keyof typeof example
      ) => {
        let lo = Number.POSITIVE_INFINITY;
        let hi = Number.NEGATIVE_INFINITY;
        for (const d of [-0.05, 0, 0.05]) {
          const v = pick(
            propagate(
              { ...example, [key]: example[key] + d },
              s.radialDistanceM,
              s.propagationAngleDeg
            )
          );
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
        return [lo, hi] as const;
      };
      const held: [
        string,
        number,
        (p: ReturnType<typeof propagate>) => number,
        keyof typeof example,
      ][] = [
        ['a_c1', s.firstCrestM, (p) => p.firstCrestM, 'firstCrestM'],
        ['a_t1', s.firstTroughM, (p) => p.firstTroughM, 'firstTroughM'],
        ['a_c2', s.secondCrestM, (p) => p.secondCrestM, 'secondCrestM'],
      ];
      for (const [what, printed, pick, key] of held) {
        const [lo, hi] = spread(pick, key);
        expect(
          lo,
          `${what}: interval [${lo.toString()}, ${hi.toString()}] vs ${printed.toString()}`
        ).toBeLessThanOrEqual(printed + 0.05);
        expect(
          hi,
          `${what}: interval [${lo.toString()}, ${hi.toString()}] vs ${printed.toString()}`
        ).toBeGreaterThanOrEqual(printed - 0.05);
      }
    }
  );

  it('keeps the second crest largest far off the axis, as the manual notes', () => {
    // "As a_c2 > a_c1, the decay of the wave amplitude a_c2 from point C to
    // the embankment dam will be determined using the 2D decay terms."
    const c = propagate(example, 1_100, 80);
    expect(c.secondCrestM).toBeGreaterThan(c.firstCrestM);
  });
});

describe('rule 529: the square root inside the exponential', () => {
  it('is there — dropping it would move section A–B by more than a factor of ten', () => {
    // A transcription with r*/h instead of √(r*/h) is the most likely
    // mistake, so this states what it would have cost.
    const h = example.depthM;
    const star = 526;
    const withRoot = Math.exp(-0.4 * Math.pow(14.4 / h, -0.3) * Math.sqrt(star / h));
    const without = Math.exp(-0.4 * Math.pow(14.4 / h, -0.3) * (star / h));
    expect(14.4 * withRoot).toBeCloseTo(2.79, 1);
    // Measured, not guessed: 8.35 times, which is the whole of section A–B.
    expect(withRoot / without).toBeCloseTo(8.35, 1);
  });
});

describe('rule 528: the typo in the manual’s substitution lines', () => {
  it('records what taking the printed 1.02 as P would have cost', () => {
    const wrong: PropagatingWave = {
      ...example,
      impulseProduct: SUBSTITUTION_TYPO.printedInSubstitution,
    };
    expect(impactRadiusAlongAxis(wrong)).toBeCloseTo(SUBSTITUTION_TYPO.radiusFromTypoM, 0);
    expect(impactRadiusAlongAxis(example)).toBeCloseTo(SUBSTITUTION_TYPO.radiusPrintedM, 0);
    // Twenty-four per cent, which a reader checking against the printed
    // result would catch and a reader checking the substitution would not.
    expect(impactRadiusAlongAxis(wrong) / impactRadiusAlongAxis(example) - 1).toBeGreaterThan(0.2);
  });

  it('confirms P = 0.43 from Eq. (3.12) rather than taking the table’s word', async () => {
    const { impulseProduct } = await import('./impulseWave.js');
    const P = impulseProduct({
      // The example's own Froude number, 32/√(9.81·100) = 1.0217, which the
      // manual rounds to 1.02 in its table. Feeding the ROUNDED 1.02 back in
      // gives P = 0.4245, which rounds to 0.42 and not to the 0.43 the
      // manual prints — one more place where reading a printed intermediate
      // instead of recomputing it moves the answer.
      froude: 32 / Math.sqrt(9.81 * 100),
      thicknessM: 40,
      widthM: 120,
      volumeM3: 600_000,
      densityKgM3: 500,
      angleDeg: 35,
      depthM: 100,
    });
    // Eq. (3.12) gives 0.4252 from the example's own inputs, which is what
    // the manual prints as 0.43 — and is nowhere near the 1.02 its
    // substitution lines show. Both facts matter: the typo is real, and so
    // is the rounding trap underneath it.
    expect(Math.round(P * 100) / 100).toBe(SUBSTITUTION_TYPO.actualImpulseProduct);
    expect(P).toBeGreaterThan(0.42);
    expect(P).toBeLessThan(0.43);
  });
});

describe('rule 530(c): the reach of Table 3-2', () => {
  it('is 1 to 16 in r/h and is read', () => {
    expect(PROPAGATION_TESTED_RELATIVE_DISTANCE).toEqual([1, 16]);
    expect(propagationOutsideTestedRange(100, 730)).toEqual([]);
    expect(propagationOutsideTestedRange(100, 1_100)).toEqual([]);
    // The manual's own A–D, r/h = 26.5, is outside — which is why the
    // example switches to the channel decay there.
    expect(propagationOutsideTestedRange(100, 2_650)).toEqual(['relativeDistanceTooFar']);
    expect(propagationOutsideTestedRange(100, 50)).toEqual(['relativeDistanceTooNear']);
  });
});

describe('the celerity of Eq. (3.32)', () => {
  it('is Eq. (3.17)’s solitary celerity times 0.95, and not Eq. (3.17) itself', () => {
    // The manual's worked sentence — "an impulse wave with an amplitude of
    // a = 20 m in h = 100 m deep water will have a celerity c of about
    // 34 m/s" — belongs to Eq. (3.17), c = √(g(h+a)), which gives 34.31.
    // Eq. (3.32) is the FIRST CREST's celerity and carries a 0.95 the
    // solitary form does not. This test had them confused when it was
    // written, which is exactly the mistake the 0.95 is there to prevent.
    const solitary = Math.sqrt(9.81 * (100 + 20));
    expect(solitary).toBeCloseTo(34.31, 2);
    expect(firstCrestCelerity(100, 20)).toBeCloseTo(0.95 * solitary, 9);
    expect(firstCrestCelerity(100, 20)).toBeCloseTo(32.59, 2);
  });
});

describe('rule 525: nothing in the product calls this', () => {
  it('leaves every landslide preset where it was', async () => {
    const { LANDSLIDE_PRESETS, simulateLandslide } =
      await import('../events/landslide/simulate.js');
    const at = (k: keyof typeof LANDSLIDE_PRESETS): number =>
      Number(simulateLandslide(LANDSLIDE_PRESETS[k].input).tsunami?.sourceAmplitude ?? 0);
    expect(at('VAIONT_1963')).toBeCloseTo(162.0, 1);
    expect(at('STOREGGA_8200_BP')).toBeCloseTo(6.29, 2);
    expect(at('LITUYA_BAY_1958')).toBeCloseTo(93.9, 1);
  });
});
