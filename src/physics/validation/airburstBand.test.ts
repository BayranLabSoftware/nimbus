import { describe, expect, it } from 'vitest';
import { airburstOverpressure, airburstReach } from '../effects/airburstBlast.js';
import { m, type Joules, type Pascals } from '../units.js';
import {
  BURST_ALTITUDE_FIT_RANGE,
  burstAltitudeKm,
  I3_WIDTH_LIMIT,
  PUBLISHED,
  TREE_DAMAGE_KPA,
  TUNGUSKA_FELLED,
} from './airburstBandRules.js';

/**
 * THE OUTCOME OF RULES 563 TO 570, run once on 21 September 2026. Nothing is
 * adopted; rule 563 made this a measurement.
 *
 * FOUR THINGS IT FOUND.
 *
 * 1. THE REPORT COMPARES AGAINST ONE THRESHOLD WHERE THE FIELD NAMES TWO.
 *    Collins et al. 2017 call 10 kPa and 20 kPa the "lower and upper limits
 *    for extensive tree damage", and say the nominal 20 kPa reading of the
 *    2 200 km² of felled forest "may represent conservative thresholds by a
 *    factor of two" for topography and poor tree health. At 15 Mt and the
 *    paper's own scenario altitude the model draws 15.71 km at 20 kPa and
 *    37.42 km at 10 kPa, and the forest's 26.5 km equivalent radius lies
 *    BETWEEN them. The report's "0.43× the flattened forest" is one of the
 *    two limits against the whole area.
 *
 * 2. AGAINST THE PAPER'S OWN NUMBERS the model reads 0.66 to 0.90 of the
 *    middle of each published range, and Chelyabinsk is inside it:
 *
 *      15 Mt at 20 kPa   paper 16–22 km   model 15.71 km   just outside
 *       5 Mt at 10 kPa   paper 18–22 km   model 13.11 km   outside
 *      0.55 Mt at 1 kPa  paper ~50 km     model 45.09 km   INSIDE
 *
 *    Rule 567 required the round to say whose disagreement this is. The
 *    model's ground-zero overpressures are 66.8, 17.1 and 2.9 kPa, all above
 *    their thresholds, so nothing is failing to fire; the model simply
 *    attenuates faster in the near field than the paper's shock physics.
 *    That is where the paper itself says its three approximations differ by
 *    two to four times, and the model is the static source, which the paper
 *    calls "an adequate approximation ... for probabilistic hazard
 *    assessment".
 *
 * 3. I3'S ×3 CANNOT BE MET BY A BAND OVER THE IMPACTOR POPULATION. The
 *    paper's Eqs. 6a–6c put 98 % of airbursts between z_1% and z_99%, and at
 *    z_99% none of the three thresholds is reached at all — the ring is
 *    zero, so the band's width is unbounded. A band for I3 has to be
 *    conditioned on what a scenario already knows, because a visitor gives
 *    the diameter, the speed, the angle and the density, and those very
 *    nearly determine the burst altitude. This round names that and does not
 *    solve it.
 *
 * 4. A MISTAKE IN MY OWN RULE 565. It said to compare at the median burst
 *    altitude. The paper's blast scenarios are not there: "We used altitudes
 *    of 21.8, 17, 13.5, and 10.9 km, which are approximately halfway between
 *    the worst-case (z_b,1%) and median (z_b,50%) scenarios". At the median
 *    the model reads 9.81 km against 16–22, at 0.52×; at the paper's own
 *    altitude it reads 15.71, at 0.83×. The first figure was measured and is
 *    recorded here so the correction is visible, not quietly dropped — the
 *    rule was wrong about where to look, and looking in the right place
 *    halved the disagreement.
 */

const MT = 4.184e15;

/** The altitude the paper's own blast scenarios use. */
const scenarioAltitudeKm = (energyMt: number): number =>
  (burstAltitudeKm(energyMt, 1) + burstAltitudeKm(energyMt, 50)) / 2;

const reachKm = (energyMt: number, kPa: number, altitudeKm: number): number =>
  Number(
    airburstReach((kPa * 1_000) as Pascals, m(altitudeKm * 1_000), (energyMt * MT) as Joules)
  ) / 1_000;

describe("rule 564: Collins et al. 2017's burst-altitude percentiles", () => {
  it('reproduces Eqs. 6a to 6c', () => {
    // 1 Mt, where log10 E = 0 and each fit is its own constant term.
    expect(burstAltitudeKm(1, 1)).toBeCloseTo(13.0, 9);
    expect(burstAltitudeKm(1, 50)).toBeCloseTo(25.7, 9);
    expect(burstAltitudeKm(1, 99)).toBeCloseTo(47.9, 9);
    // And they stay ordered across the range the fit was made over.
    const fit: readonly number[] = BURST_ALTITUDE_FIT_RANGE;
    for (let L = fit[0] ?? -1.5; L <= (fit[1] ?? 2); L += 0.25) {
      const e = 10 ** L;
      expect(burstAltitudeKm(e, 1)).toBeLessThan(burstAltitudeKm(e, 50));
      expect(burstAltitudeKm(e, 50)).toBeLessThan(burstAltitudeKm(e, 99));
    }
  });

  it("puts the paper's own four scenario altitudes where it says they are", () => {
    // "21.8, 17, 13.5, and 10.9 km ... approximately halfway between the
    // worst-case and median scenarios" for 20, 30, 40 and 50 m stony
    // asteroids. Checked as an ordering rather than to the metre, since the
    // paper gives the diameters and not the energies.
    const alts: number[] = [0.55, 2, 6, 15].map(scenarioAltitudeKm);
    for (let i = 1; i < alts.length; i++) expect(alts[i]).toBeLessThan(Number(alts[i - 1]));
    expect(scenarioAltitudeKm(0.55)).toBeGreaterThan(15);
    expect(scenarioAltitudeKm(15)).toBeLessThan(15);
  });
});

describe('rule 565: the model against the three published figures', () => {
  it('reads 15.71 km where the paper puts 16 to 22, at 15 Mt and 20 kPa', () => {
    const p = PUBLISHED.tunguska15MtAt20kPa;
    expect(reachKm(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt))).toBeCloseTo(
      15.71,
      1
    );
  });

  it('reads 13.11 km where the paper puts 18 to 22, at 5 Mt and 10 kPa', () => {
    const p = PUBLISHED.tunguska5MtAt10kPa;
    expect(reachKm(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt))).toBeCloseTo(
      13.11,
      1
    );
  });

  it('is INSIDE the paper at Chelyabinsk, 45.09 km against ~50', () => {
    const p = PUBLISHED.chelyabinskAt1kPa;
    const mine = reachKm(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt));
    expect(mine).toBeCloseTo(45.09, 1);
    expect(mine).toBeGreaterThanOrEqual(p.lowKm);
    expect(mine).toBeLessThanOrEqual(p.highKm);
  });

  it('pins what rule 565 asked for, so the correction stays visible', () => {
    // At the MEDIAN altitude the rule named, the 15 Mt case reads 9.81 km.
    const p = PUBLISHED.tunguska15MtAt20kPa;
    expect(reachKm(p.energyMt, p.thresholdKPa, burstAltitudeKm(p.energyMt, 50))).toBeCloseTo(
      9.81,
      1
    );
  });
});

describe('rule 567: nothing is failing to fire', () => {
  it('has a ground-zero overpressure above the threshold in all three', () => {
    const gz = (energyMt: number): number =>
      Number(
        airburstOverpressure({
          groundRange: m(0),
          burstAltitude: m(scenarioAltitudeKm(energyMt) * 1_000),
          blastYield: (energyMt * MT) as Joules,
        })
      ) / 1_000;
    expect(gz(15)).toBeCloseTo(66.84, 1);
    expect(gz(5)).toBeCloseTo(17.09, 1);
    expect(gz(0.55)).toBeCloseTo(2.94, 1);
    for (const [energyMt, kPa] of [
      [15, 20],
      [5, 10],
      [0.55, 1],
    ] as const) {
      expect(gz(energyMt)).toBeGreaterThan(kPa);
    }
  });
});

describe('rule 566: the forest lies between the two thresholds the field names', () => {
  it('brackets 26.5 km at 15 Mt', () => {
    const z = scenarioAltitudeKm(15);
    const upper = reachKm(15, TREE_DAMAGE_KPA.upper, z);
    const lower = reachKm(15, TREE_DAMAGE_KPA.lower, z);
    expect(upper).toBeCloseTo(15.71, 1);
    expect(lower).toBeCloseTo(37.42, 1);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeGreaterThan(upper);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeLessThan(lower);
  });

  it('does not bracket it at 10 Mt or at 20 Mt, which is what makes it a constraint', () => {
    for (const energyMt of [10, 20]) {
      const z = scenarioAltitudeKm(energyMt);
      const upper = reachKm(energyMt, TREE_DAMAGE_KPA.upper, z);
      const lower = reachKm(energyMt, TREE_DAMAGE_KPA.lower, z);
      const brackets =
        TUNGUSKA_FELLED.equivalentRadiusKm > upper && TUNGUSKA_FELLED.equivalentRadiusKm < lower;
      expect(brackets, `${String(energyMt)} Mt: ${upper.toFixed(2)} to ${lower.toFixed(2)}`).toBe(
        false
      );
    }
  });
});

describe("rule 568: I3's width cannot come from the population", () => {
  it('draws nothing at all at the 99th percentile altitude', () => {
    for (const [energyMt, kPa] of [
      [15, 20],
      [5, 10],
      [0.55, 1],
    ] as const) {
      expect(reachKm(energyMt, kPa, burstAltitudeKm(energyMt, 99))).toBe(0);
    }
    // So the band from z_1% to z_99% has no finite width to compare with
    // I3's limit, which is the finding rather than a failure to measure.
    expect(I3_WIDTH_LIMIT).toBe(3);
  });

  it('is finite and wide once the low end is dropped', () => {
    // From the 1st percentile to the median, which a scenario's own inputs
    // would narrow much further.
    const width = (energyMt: number, kPa: number): number =>
      reachKm(energyMt, kPa, burstAltitudeKm(energyMt, 1)) /
      reachKm(energyMt, kPa, burstAltitudeKm(energyMt, 50));
    expect(width(15, 20)).toBeGreaterThan(1);
    expect(width(0.55, 1)).toBeGreaterThan(1);
  });
});
