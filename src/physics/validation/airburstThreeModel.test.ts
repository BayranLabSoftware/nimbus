import { describe, expect, it } from 'vitest';
import { airburstReach } from '../effects/airburstBlast.js';
import { m, type Joules, type Pascals } from '../units.js';
import {
  burstAltitudeKm,
  PUBLISHED,
  TREE_DAMAGE_KPA,
  TUNGUSKA_FELLED,
} from './airburstBandRules.js';
import {
  AGREEMENT_BURST_HEIGHTS,
  LINE_SOURCE_FACTOR_ABSTRACT,
  MOVING_SOURCE_FACTOR,
  WIDTH_LIMIT,
} from './airburstThreeModelRules.js';

/**
 * THE OUTCOME OF RULES 571 TO 578, run once on 21 September 2026: REFUSED
 * by rule 574(a), on the one clause it could not choose.
 *
 * The band holds what I3 asks it to hold.
 *
 *   Tunguska    the felled forest's 26.5 km is inside the 20 kPa band at
 *               15 Mt (8.2 to 31.1 km) and inside the 10 kPa band at 5 and
 *               10 Mt. It misses at 20 and 30 Mt, where the static reach
 *               already passes three burst heights and the band closes to a
 *               point — which is the reference's own statement that the
 *               three models agree out there, not a failure of the band.
 *   Chelyabinsk 18.9 to 63.3 km, holding the ~50 km of broken windows.
 *   Rule 574(d) no inversion: the static source is inside its own band
 *               everywhere.
 *
 * AND IT IS TOO WIDE. I3 allows ×3 in radius. The band measures
 *
 *   Tunguska 15 Mt at 20 kPa    3.79×
 *   Chelyabinsk at 1 kPa        3.34×
 *   Tunguska 5 Mt at 10 kPa     unbounded — the low edge reaches nothing
 *
 * THE FINDING, which is worth more than the refusal. The band is not wide
 * because this project drew it wide. It is the reference's own statement of
 * how far its three approximations disagree: a factor of two either side in
 * overpressure, which is a factor of four across, and the blast law's slope
 * turns that into three and a half to four in radius. **I3's ×3 is tighter
 * than the spread the field reports on its own models.** A band that met
 * I3 would be claiming more precision than Collins et al. claim, and this
 * round will not do that to pass a rule.
 *
 * No band is shipped, so I3's ×3 has not yet been measured on a band this
 * product draws, and the bound is not spent. What is now on the record is
 * that any band honest about the reference will fail it, so whoever writes
 * the amendment writes it knowing that.
 *
 * Rule 577 stands: the other half of I3 — 90 % of the paper's shock-physics
 * runs — needs its Table 2, which is set sideways and does not come out of
 * any text extractor here. I3 is not closable until someone reads it off
 * the page.
 */

const MT = 4.184e15;

const scenarioAltitudeKm = (energyMt: number): number =>
  (burstAltitudeKm(energyMt, 1) + burstAltitudeKm(energyMt, 50)) / 2;

const reachKm = (energyMt: number, kPa: number, altitudeKm: number): number =>
  Number(
    airburstReach((kPa * 1_000) as Pascals, m(altitudeKm * 1_000), (energyMt * MT) as Joules)
  ) / 1_000;

/** Rule 571's band, with the line source at the abstract's factor. */
const band = (
  energyMt: number,
  kPa: number,
  altitudeKm: number,
  lineFactor: number = LINE_SOURCE_FACTOR_ABSTRACT
): { low: number; mid: number; high: number } => {
  const mid = reachKm(energyMt, kPa, altitudeKm);
  const agree = AGREEMENT_BURST_HEIGHTS * altitudeKm;
  if (mid >= agree) return { low: mid, mid, high: mid };
  const high = Math.min(
    Math.max(reachKm(energyMt, kPa / MOVING_SOURCE_FACTOR, altitudeKm), mid),
    Math.max(agree, mid)
  );
  return { low: Math.min(reachKm(energyMt, kPa * lineFactor, altitudeKm), mid), mid, high };
};

describe('rule 574(d): the band is the right way round', () => {
  it('contains the static source at every case measured', () => {
    for (const p of Object.values(PUBLISHED)) {
      const b = band(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt));
      expect(b.low).toBeLessThanOrEqual(b.mid);
      expect(b.mid).toBeLessThanOrEqual(b.high);
    }
    for (const energyMt of [5, 10, 15, 20, 30]) {
      for (const kPa of [TREE_DAMAGE_KPA.lower, TREE_DAMAGE_KPA.upper]) {
        const b = band(energyMt, kPa, scenarioAltitudeKm(energyMt));
        expect(b.low, `${String(energyMt)} Mt at ${String(kPa)} kPa`).toBeLessThanOrEqual(b.mid);
        expect(b.mid).toBeLessThanOrEqual(b.high);
      }
    }
  });

  it('puts the high edge where the static source reaches HALF the threshold, clipped', () => {
    // The mistake rule 574(d) exists for: more overpressure means a longer
    // reach, so the moving source's edge is the static reach at T/2. The
    // low edge is the static reach at double.
    const z = scenarioAltitudeKm(15);
    expect(band(15, 20, z).low).toBeCloseTo(reachKm(15, 40, z), 6);
    // The high edge is that reach OR three burst heights, whichever comes
    // first — beyond three the reference says the three models agree, so a
    // band cannot be open out there. At 15 Mt the clip binds: the static
    // source reaches 10 kPa at 37.42 km and three burst heights is 31.11.
    expect(reachKm(15, 10, z)).toBeCloseTo(37.42, 1);
    expect(AGREEMENT_BURST_HEIGHTS * z).toBeCloseTo(31.11, 1);
    expect(band(15, 20, z).high).toBeCloseTo(AGREEMENT_BURST_HEIGHTS * z, 6);
    // Which of the two binds is not the same everywhere, and that is worth
    // recording rather than assuming: the agreement distance caps the band
    // at 15 Mt and at Chelyabinsk, and the factor of two caps it at 5 Mt.
    const binds: string[] = [];
    for (const p of Object.values(PUBLISHED)) {
      const zp = scenarioAltitudeKm(p.energyMt);
      const byFactor = reachKm(p.energyMt, p.thresholdKPa / MOVING_SOURCE_FACTOR, zp);
      const byAgreement = AGREEMENT_BURST_HEIGHTS * zp;
      expect(band(p.energyMt, p.thresholdKPa, zp).high).toBeCloseTo(
        Math.min(byFactor, byAgreement),
        6
      );
      binds.push(byAgreement < byFactor ? 'agreement' : 'factor');
    }
    expect(binds).toEqual(['agreement', 'factor', 'agreement']);
  });
});

describe('rule 573(b) and (c): the band holds both measured footprints', () => {
  it('holds Tunguska at 15 Mt and 20 kPa', () => {
    const b = band(15, TREE_DAMAGE_KPA.upper, scenarioAltitudeKm(15));
    expect(b.low).toBeCloseTo(8.2, 0);
    expect(b.high).toBeCloseTo(31.1, 0);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeGreaterThanOrEqual(b.low);
    expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeLessThanOrEqual(b.high);
  });

  it('holds Tunguska at 5 and 10 Mt on the lower tree-damage threshold', () => {
    for (const energyMt of [5, 10]) {
      const b = band(energyMt, TREE_DAMAGE_KPA.lower, scenarioAltitudeKm(energyMt));
      expect(TUNGUSKA_FELLED.equivalentRadiusKm, `${String(energyMt)} Mt`).toBeLessThanOrEqual(
        b.high
      );
      expect(TUNGUSKA_FELLED.equivalentRadiusKm).toBeGreaterThanOrEqual(b.low);
    }
  });

  it('closes to a point at 20 and 30 Mt, where the reference says the models agree', () => {
    for (const energyMt of [20, 30]) {
      const z = scenarioAltitudeKm(energyMt);
      const b = band(energyMt, TREE_DAMAGE_KPA.upper, z);
      expect(b.low).toBe(b.high);
      expect(b.mid).toBeGreaterThanOrEqual(AGREEMENT_BURST_HEIGHTS * z);
    }
  });

  it('holds Chelyabinsk', () => {
    const p = PUBLISHED.chelyabinskAt1kPa;
    const b = band(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt));
    expect(b.low).toBeCloseTo(18.9, 0);
    expect(b.high).toBeCloseTo(63.3, 0);
    expect(50).toBeGreaterThanOrEqual(b.low);
    expect(50).toBeLessThanOrEqual(b.high);
  });
});

describe("rule 574(a): and it is wider than I3's x3, which refuses it", () => {
  it('measures 3.79x at Tunguska and 3.34x at Chelyabinsk', () => {
    const tunguska = band(15, 20, scenarioAltitudeKm(15));
    expect(tunguska.high / tunguska.low).toBeCloseTo(3.79, 1);
    expect(tunguska.high / tunguska.low).toBeGreaterThan(WIDTH_LIMIT);

    const p = PUBLISHED.chelyabinskAt1kPa;
    const chelyabinsk = band(p.energyMt, p.thresholdKPa, scenarioAltitudeKm(p.energyMt));
    expect(chelyabinsk.high / chelyabinsk.low).toBeCloseTo(3.34, 1);
    expect(chelyabinsk.high / chelyabinsk.low).toBeGreaterThan(WIDTH_LIMIT);
  });

  it('is wide because the reference is, not because this project drew it so', () => {
    // A factor of two either side in overpressure is a factor of four
    // across, and the blast law's slope turns that into three and a half to
    // four in radius. The width is a property of Collins et al.'s own
    // assessment of their approximations.
    expect(MOVING_SOURCE_FACTOR * LINE_SOURCE_FACTOR_ABSTRACT).toBe(4);
    const z = scenarioAltitudeKm(15);
    const acrossInPressure = (20 * LINE_SOURCE_FACTOR_ABSTRACT) / (20 / MOVING_SOURCE_FACTOR);
    expect(acrossInPressure).toBe(4);
    const acrossInRadius = reachKm(15, 10, z) / reachKm(15, 40, z);
    expect(acrossInRadius).toBeGreaterThan(WIDTH_LIMIT);
  });
});
