import { describe, expect, it } from 'vitest';
import { m } from '../units.js';
import {
  ENET_GRILLI_MODEL,
  EQ17_AGAINST_BEM_COLUMN,
  SUBMARINE_SLIDE_TESTED,
  WATTS_2003_CASES,
} from '../validation/submarineSlideRules.js';
import {
  submarineSlideAmplitude,
  submarineSlideFromVolume,
  submarineSlideMotion,
  submarineSlideOutsideTestedRange,
  submarineSlideShapeFunctions,
  type SubmarineSlide,
} from './submarineSlide.js';

/**
 * Rule 502: the transcription is held to the printed page, within G1's 1 %.
 *
 * Every number on the right-hand side of an expectation here is read from a
 * published table or a published sentence, and is repeated in
 * `validation/submarineSlideRules.ts` where it was written down before any of
 * this module existed.
 */

const field = (c: (typeof WATTS_2003_CASES)[number]): SubmarineSlide => ({
  lengthM: c.lengthM,
  thicknessM: c.thicknessM,
  widthM: c.widthM,
  depthM: c.depthM,
  angleDeg: c.angleDeg,
  specificDensity: c.specificDensity,
});

/** Half a unit in the last significant figure a number is printed to. */
const half = (value: number, figures: number): number =>
  value === 0 ? 0 : Math.pow(10, Math.ceil(Math.log10(Math.abs(value))) - figures) / 2;

/**
 * THE TOLERANCE, AND THAT IT WAS CHOSEN AFTER A FAILURE — said here rather
 * than buried, because this project publishes that kind of thing.
 *
 * The first version of this test held every printed output to half a unit in
 * its last figure. Fourteen of fifteen passed; Skagway slide B's u_t missed
 * by 0.02 m/s, 32.48 against a printed 33. Measuring why, before accepting
 * the refusal, showed the disagreement is NOT the transcription: the paper's
 * own printed coefficients — a₀ ≅ 0.30 g sin θ and u_t ≅ 1.16 √(b g sin θ) —
 * give 32.61 on that row and 901.7 s for Unimak's t₀ against a printed 903,
 * so **neither form reproduces the tables to their printed rounding**, and
 * the worst point disagreement is 1.58 % for the exact form and 1.42 % for
 * the paper's own.
 *
 * The reason is that the INPUTS are printed rounded too. Skagway B's incline
 * is printed 22°, which is any angle from 21.5 to 22.5, and that alone moves
 * u_t from 32.09 to 32.87. So what the printed page pins is not a number but
 * an interval, and the honest check is whether each printed output lies in
 * the interval its printed inputs allow. It does, for all fifteen.
 *
 * So each value is held two ways: every output of a three-figure table within
 * G1's 1 %, which rule 502 fixed in advance and which the Unimak case meets
 * on all five; and every output of every table consistent with the interval
 * its own inputs' rounding produces. The second was chosen after seeing the
 * first fail. It is derived from the precision of the page and not from the
 * size of the error, but a reader should know the order it happened in.
 */
/** How many significant figures each table prints each INPUT to, read off the
 *  page: "40" km, "1700" m, "4.3°"; "600" m, "150" m, "9°"; "215" m, "95" m,
 *  "22°". Only the three that reach the motion equations are here. */
const INPUT_FIGURES: Record<string, { length: number; depth: number; angle: number }> = {
  'Unimak 1946': { length: 2, depth: 2, angle: 2 },
  'Skagway 1994, slide A': { length: 3, depth: 2, angle: 1 },
  'Skagway 1994, slide B': { length: 3, depth: 2, angle: 2 },
};

const inputInterval = (
  c: (typeof WATTS_2003_CASES)[number],
  pick: (m: ReturnType<typeof submarineSlideMotion>) => number
): [number, number] => {
  const figs = INPUT_FIGURES[c.name];
  if (figs === undefined) throw new Error(`no printed precision recorded for ${c.name}`);
  const hb = half(c.lengthM, figs.length);
  const hd = half(c.depthM, figs.depth);
  const hth = half(c.angleDeg, figs.angle);
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  for (const db of [-hb, 0, hb])
    for (const dd of [-hd, 0, hd])
      for (const dt of [-hth, 0, hth]) {
        const v = pick(
          submarineSlideMotion({
            ...field(c),
            lengthM: c.lengthM + db,
            depthM: c.depthM + dd,
            angleDeg: c.angleDeg + dt,
          })
        );
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
  return [lo, hi];
};

describe('rule 502(a): the empirical functions of Eq. (18)', () => {
  it("returns Enet & Grilli's own printed F and G for their own slide", () => {
    const { F, G } = submarineSlideShapeFunctions({
      lengthM: 0.298,
      thicknessM: 0.082,
      widthM: 0.513,
      depthM: 0.1,
      angleDeg: ENET_GRILLI_MODEL.angleDeg,
      specificDensity: ENET_GRILLI_MODEL.specificDensity,
    });
    expect(F).toBeCloseTo(ENET_GRILLI_MODEL.F, 4);
    expect(G).toBeCloseTo(ENET_GRILLI_MODEL.G, 3);
    // And well inside the 1 % G1 asks for, not merely at it.
    expect(Math.abs(F / ENET_GRILLI_MODEL.F - 1)).toBeLessThan(0.001);
    expect(Math.abs(G / ENET_GRILLI_MODEL.G - 1)).toBeLessThan(0.001);
  });
});

describe('rule 502(b): the dispersion parameter of Eq. (19)', () => {
  it('reduces to 0.0958 (d/B)^0.5 at their coefficients', () => {
    // μ = d/λ₀. With the motion of this module, λ₀ = t₀√(g d), so
    // μ = √(d)/(t₀√g) — and the claim is that this is 0.0958·√(d/B).
    const at = (depthM: number, lengthM: number): number => {
      const motion = submarineSlideMotion({
        lengthM,
        thicknessM: 0.01 * lengthM,
        widthM: lengthM,
        depthM,
        angleDeg: ENET_GRILLI_MODEL.angleDeg,
        specificDensity: ENET_GRILLI_MODEL.specificDensity,
        addedMass: ENET_GRILLI_MODEL.addedMass,
        dragCoefficient: ENET_GRILLI_MODEL.dragCoefficient,
      });
      return depthM / motion.characteristicWavelengthM;
    };
    const pairs: readonly (readonly [number, number])[] = [
      [0.1, 0.298],
      [0.061, 0.298],
      [1, 5],
      [120, 900],
    ];
    for (const [depthM, lengthM] of pairs) {
      const mu = at(depthM, lengthM);
      const printed = ENET_GRILLI_MODEL.dispersionPrefactor * Math.sqrt(depthM / lengthM);
      expect(Math.abs(mu / printed - 1), `d=${String(depthM)} B=${String(lengthM)}`).toBeLessThan(
        0.001
      );
    }
  });
});

describe('rule 502(c) and (d): the field cases of Watts et al. 2003', () => {
  it.each(WATTS_2003_CASES.map((c) => [c.name, c] as const))(
    'reproduces the motion table of %s',
    (_name, c) => {
      const motion = submarineSlideMotion(field(c));
      const held: [number, number, string, (m: typeof motion) => number][] = [
        [motion.initialAccelerationMS2, c.accelerationMS2, 'a0', (m) => m.initialAccelerationMS2],
        [motion.terminalVelocityMS, c.terminalVelocityMS, 'ut', (m) => m.terminalVelocityMS],
        [motion.characteristicDistanceM, c.distanceM, 's0', (m) => m.characteristicDistanceM],
        [motion.characteristicTimeS, c.timeS, 't0', (m) => m.characteristicTimeS],
        [
          motion.characteristicWavelengthM,
          c.wavelengthM,
          'lambda0',
          (m) => m.characteristicWavelengthM,
        ],
      ];
      for (const [got, printed, what, pick] of held) {
        const where = `${what}: ${got.toString()} vs printed ${printed.toString()}`;
        // Rule 502: 1 % where the table prints three figures.
        if (c.figures >= 3) expect(Math.abs(got / printed - 1), where).toBeLessThan(0.01);
        // And every row consistent with what its own printed inputs pin.
        const [lo, hi] = inputInterval(c, pick);
        const h = half(printed, c.figures);
        expect(lo, `${where} — interval [${lo.toString()}, ${hi.toString()}]`).toBeLessThanOrEqual(
          printed + h
        );
        expect(
          hi,
          `${where} — interval [${lo.toString()}, ${hi.toString()}]`
        ).toBeGreaterThanOrEqual(printed - h);
      }
    }
  );

  it('agrees with the wavelength written the other way, Eq. (3a)', () => {
    // λ₀ ≅ 3.87 √(b d / sin θ) is the same quantity as t₀√(g d) at γ = 1.85,
    // and a transcription that got one right and the other wrong would be
    // carrying a coefficient rather than a derivation.
    for (const c of WATTS_2003_CASES) {
      const sin = Math.sin((c.angleDeg * Math.PI) / 180);
      const eq3a = 3.87 * Math.sqrt((c.lengthM * c.depthM) / sin);
      const mine = submarineSlideMotion(field(c)).characteristicWavelengthM;
      expect(Math.abs(mine / eq3a - 1), c.name).toBeLessThan(0.01);
    }
  });
});

describe('rule 503: the η₀ column is a BEM run, not Eq. (17)', () => {
  it('disagrees with it by exactly what the rules recorded beforehand', () => {
    // Pinned so that the disagreement can never be read as a regression, and
    // so that nobody tunes Eq. (17) towards a column it did not produce.
    for (const c of WATTS_2003_CASES) {
      const pinned = EQ17_AGAINST_BEM_COLUMN[c.name as keyof typeof EQ17_AGAINST_BEM_COLUMN] as
        | { equation17M: number; tablePrintsM: number }
        | undefined;
      if (pinned === undefined) continue;
      expect(submarineSlideAmplitude(field(c)), c.name).toBeCloseTo(pinned.equation17M, 1);
    }
  });
});

describe('rule 504: the product says where it is extrapolating', () => {
  const inside: SubmarineSlide = {
    lengthM: 1_000,
    thicknessM: 10,
    widthM: 1_000,
    depthM: 200,
    angleDeg: 10,
    specificDensity: 1.9,
  };

  it('is silent inside every limit', () => {
    expect(submarineSlideOutsideTestedRange(inside)).toEqual([]);
  });

  it('names each limit, and only that limit, when it is crossed', () => {
    expect(submarineSlideOutsideTestedRange({ ...inside, angleDeg: 35 })).toEqual(['angle']);
    expect(submarineSlideOutsideTestedRange({ ...inside, thicknessM: 300 })).toEqual([
      'relativeThickness',
    ]);
    expect(submarineSlideOutsideTestedRange({ ...inside, depthM: 50 })).toEqual([
      'relativeSubmergence',
    ]);
    expect(submarineSlideOutsideTestedRange({ ...inside, specificDensity: 3.1 })).toEqual([
      'specificDensity',
    ]);
    expect(submarineSlideOutsideTestedRange({ ...inside, specificDensity: 1.2 })).toEqual([
      'specificDensity',
    ]);
  });

  it('reads the limits the rules wrote down, not its own', () => {
    expect(SUBMARINE_SLIDE_TESTED.angleDeg[1]).toBe(30);
    expect(SUBMARINE_SLIDE_TESTED.relativeThickness[1]).toBe(0.2);
    expect(SUBMARINE_SLIDE_TESTED.specificDensity).toEqual([1.46, 2.93]);
    expect(SUBMARINE_SLIDE_TESTED.relativeSubmergence[0]).toBe(0.06);
  });

  it("flags the authors' own laboratory slide on thickness, as they say it should be", () => {
    // Enet & Grilli print T/B = 0.27 for their model and call it "quite large
    // for Eq. (17) to strictly apply". A range check that passed it would be
    // reading a different range from theirs.
    expect(
      submarineSlideOutsideTestedRange({
        lengthM: 0.298,
        thicknessM: 0.082,
        widthM: 0.513,
        depthM: 0.1,
        angleDeg: ENET_GRILLI_MODEL.angleDeg,
        specificDensity: ENET_GRILLI_MODEL.specificDensity,
      })
    ).toContain('relativeThickness');
  });

  it("flags Unimak on submergence — the papers' own flagship case is outside", () => {
    // Read after the fact and worth writing down: Watts et al. 2003's largest
    // field case is a 40 km slide under 1 700 m of water, so d/B = 0.043 and
    // Eq. (17)'s fitted range wants d/B > 0.06. The case that opens the paper
    // is outside the range of the closed form published two years later. The
    // two Skagway slides are inside every limit.
    expect(submarineSlideOutsideTestedRange(field(WATTS_2003_CASES[0]))).toEqual([
      'relativeSubmergence',
    ]);
    expect(WATTS_2003_CASES[0].depthM / WATTS_2003_CASES[0].lengthM).toBeCloseTo(0.0425, 4);
    for (const c of WATTS_2003_CASES.slice(1)) {
      expect(submarineSlideOutsideTestedRange(field(c)), c.name).toEqual([]);
    }
  });
});

describe('the closure from a volume', () => {
  it('gives back the volume it was built from', () => {
    for (const volumeM3 of [1e6, 2.7e8, 3e12]) {
      const { slide } = submarineSlideFromVolume({
        volumeM3,
        angleDeg: 8,
        depthM: 1_200,
        specificDensity: 1.9,
      });
      const v = (Math.PI * slide.lengthM * slide.widthM * slide.thicknessM) / 6;
      expect(v / volumeM3).toBeCloseTo(1, 6);
    }
  });

  it('keeps every dimension a caller measured', () => {
    const { slide, closed } = submarineSlideFromVolume({
      volumeM3: 1e9,
      angleDeg: 5,
      depthM: 900,
      specificDensity: 1.85,
      lengthM: 40_000,
      thicknessM: 300,
      widthM: 20_000,
    });
    expect(slide.lengthM).toBe(40_000);
    expect(slide.thicknessM).toBe(300);
    expect(slide.widthM).toBe(20_000);
    expect(closed).toEqual({ length: false, thickness: false, width: false });
  });

  it('lands inside the tested ranges for an ordinary submarine slide', () => {
    // The point of the 0.01 ratio: a closure that made the slide a cube would
    // put every scenario outside T/B and make the warning say nothing.
    const { slide } = submarineSlideFromVolume({
      volumeM3: 1e9,
      angleDeg: 6,
      depthM: 1_500,
      specificDensity: 1.9,
    });
    expect(submarineSlideOutsideTestedRange(slide)).toEqual([]);
    expect(slide.thicknessM / slide.lengthM).toBeCloseTo(0.01, 12);
  });
});

describe('the amplitude itself', () => {
  it('is zero where there is no wave to make', () => {
    const base: SubmarineSlide = {
      lengthM: 1_000,
      thicknessM: 10,
      widthM: 1_000,
      depthM: 200,
      angleDeg: 10,
      specificDensity: 1.9,
    };
    expect(submarineSlideAmplitude({ ...base, angleDeg: 0 })).toBe(0);
    expect(submarineSlideAmplitude({ ...base, lengthM: 0 })).toBe(0);
    expect(submarineSlideAmplitude({ ...base, depthM: 0 })).toBe(0);
    expect(submarineSlideAmplitude({ ...base, specificDensity: 1 })).toBe(0);
  });

  it('grows with thickness and falls with depth, as the exponents say', () => {
    const base: SubmarineSlide = {
      lengthM: 1_000,
      thicknessM: 10,
      widthM: 1_000,
      depthM: 200,
      angleDeg: 10,
      specificDensity: 1.9,
    };
    expect(submarineSlideAmplitude({ ...base, thicknessM: 20 })).toBeCloseTo(
      2 * submarineSlideAmplitude(base),
      9
    );
    expect(submarineSlideAmplitude({ ...base, depthM: 400 })).toBeLessThan(
      submarineSlideAmplitude(base)
    );
  });
});

/**
 * THE OUTCOME OF RULES 500 TO 508, run once on 20 September 2026: REFUSED as
 * a default, and pinned here so the figure that refused it cannot drift.
 *
 * The transcription passes every worked example above. What it does not pass
 * is the only recorded submarine wave this project holds. Storegga is a
 * 3 000 km³ continental-margin failure under 1 500 m of water; the closure
 * makes it an 83 km slide, which puts d/B at 0.018 against the 0.06 the
 * equations were fitted above — outside by a factor of three and a third —
 * and Eq. (17) answers with 458 m where the record implies 0.3 to 3.0 m at a
 * thousand kilometres.
 *
 * The product's own range check says so before the number is printed, which
 * is rule 504 doing its job. But a default that turns an existing bar red is
 * refused, and rule 508 forbids redesigning the round now that the figure is
 * known. So `submarinePredictive` stays selectable and unshipped, and the
 * split that suggests itself — the field's equations inside their fitted
 * range, the project's relation outside it, the result saying which drew the
 * number — is the NEXT round's candidate, with its rules pushed before it
 * runs. It is not taken here.
 *
 * What this round did close: the equations exist, verified, in CI, with their
 * fitted ranges declared and read. L1's first clause is met for a submerged
 * slide; L1 itself is not, because the relation that makes the shipped wave
 * is still the prefactor.
 */
describe('rules 500 to 508: the outcome', () => {
  it('pins Storegga, the figure that refused the default', () => {
    const { slide } = submarineSlideFromVolume({
      volumeM3: 3e12,
      angleDeg: 5,
      depthM: 1_500,
      specificDensity: 1_950 / 1_030,
    });
    expect(slide.lengthM / 1_000).toBeCloseTo(83.1, 1);
    expect(slide.depthM / slide.lengthM).toBeCloseTo(0.0181, 4);
    expect(submarineSlideOutsideTestedRange(slide)).toEqual(['relativeSubmergence']);
    expect(submarineSlideAmplitude(slide)).toBeCloseTo(458.5, 0);
  });

  it('is not what the simulator draws: the default is untouched', async () => {
    const { LANDSLIDE_PRESETS, simulateLandslide } =
      await import('../events/landslide/simulate.js');
    const shipped = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(shipped.waveLaw).not.toBe('submarinePredictive');
    expect(shipped.submarineSlide).toBeUndefined();
    expect(Number(shipped.tsunami?.sourceAmplitude)).toBeGreaterThan(2);
    expect(Number(shipped.tsunami?.sourceAmplitude)).toBeLessThan(15);
    // And the candidate is reachable, so the next round can run it.
    const candidate = simulateLandslide({
      ...LANDSLIDE_PRESETS.STOREGGA_8200_BP.input,
      waveLaw: 'submarinePredictive',
    });
    expect(candidate.submarineSlide?.outsideTestedRange).toEqual(['relativeSubmergence']);
    expect(Number(candidate.tsunami?.sourceAmplitude)).toBeCloseTo(458.5, 0);
  });
});

/**
 * THE OUTCOME OF RULES 509 TO 517, run once on 20 September 2026: REFUSED by
 * rule 511, and pinned here.
 *
 * The split — the field's equations inside their fitted range, the project's
 * prefactor outside it — got everything right except the thing rule 511 was
 * written to catch. It holds Storegga (6.29 m at the source, 0.604 m at a
 * thousand kilometres, both inside), it reaches 442 of the 1 739 submarine
 * scenarios of the sweep so it is not cosmetic, and it says which relation
 * drew each number.
 *
 * And it opens a seam of **21.1×** at d/B = 0.06. Twice B-083's tenfold jump,
 * against a limit of 2 taken from the landslide source scatter this project
 * has declared since before the round. The seam does not depend on the slide's
 * volume at all — 7.85× at 3°, 13.74× at 8°, 18.22× at 15°, 21.08× at 25° —
 * because the two relations scale differently in every variable, so it is
 * structural and no closure fixes it.
 *
 * Rule 517 says what happens next and it is being obeyed: the prefactor
 * stays, L1's submarine half stays open with both readings and both figures
 * published, and no third arrangement is invented tonight.
 */
describe('rules 509 to 517: the outcome', () => {
  it('pins the seam that refused the split', async () => {
    const { LANDSLIDE_PRESETS: _p, simulateLandslide } =
      await import('../events/landslide/simulate.js');
    const at = (ratio: number, volumeM3: number, slopeDeg: number): number => {
      const { slide } = submarineSlideFromVolume({
        volumeM3,
        angleDeg: slopeDeg,
        depthM: 1,
        specificDensity: 1_950 / 1_030,
      });
      const r = simulateLandslide({
        volumeM3,
        regime: 'submarine',
        slopeAngleDeg: slopeDeg,
        meanOceanDepth: m(ratio * slide.lengthM),
        waveLaw: 'submarineInRange',
      });
      return Number(r.tsunami?.sourceAmplitude ?? 0);
    };
    // The seam is the same whatever the slide weighs, and grows with slope.
    for (const [slopeDeg, expected] of [
      [3, 7.852],
      [8, 13.744],
      [15, 18.224],
      [25, 21.076],
    ] as const) {
      for (const volumeM3 of [1e7, 3e12]) {
        const below = at(0.0599, volumeM3, slopeDeg);
        const above = at(0.0601, volumeM3, slopeDeg);
        expect(above / below, `${String(slopeDeg)}° at ${volumeM3.toExponential(0)}`).toBeCloseTo(
          expected,
          2
        );
      }
    }
  });

  it('leaves the shipped submarine wave exactly where it was', async () => {
    const { LANDSLIDE_PRESETS, simulateLandslide } =
      await import('../events/landslide/simulate.js');
    const shipped = simulateLandslide(LANDSLIDE_PRESETS.STOREGGA_8200_BP.input);
    expect(shipped.submarineSlide).toBeUndefined();
    expect(Number(shipped.tsunami?.sourceAmplitude)).toBeCloseTo(6.29, 2);
    // And the refused split, run on purpose, gets Storegga right — which is
    // exactly why the seam had to be measured rather than assumed away.
    const split = simulateLandslide({
      ...LANDSLIDE_PRESETS.STOREGGA_8200_BP.input,
      waveLaw: 'submarineInRange',
    });
    expect(split.submarineSlide?.relation).toBe('projectPrefactor');
    expect(Number(split.tsunami?.sourceAmplitude)).toBeCloseTo(6.29, 2);
  });
});
