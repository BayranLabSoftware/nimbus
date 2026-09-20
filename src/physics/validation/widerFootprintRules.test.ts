import { describe, expect, it } from 'vitest';
import { ATLAS_EARTHQUAKES } from './atlasSetData.js';
import { isLeastModelled } from './pointSourceRules.js';
import { SHAKEMAP_FOOTPRINTS } from './shakemapFixtures.js';
import { WIDER_JURY_COUNTS, WIDER_JURY_MIN_MAX_MMI, widerJury } from './widerFootprintRules.js';

/**
 * Rule 405's jury, pinned.
 *
 * These numbers were written into the rule before any area of the wider
 * set was scored. They are here so that the set cannot drift — from a
 * rebuilt atlas, from a changed `isLeastModelled`, from a helpful edit —
 * without a test going red and somebody having to say so out loud.
 */
describe('rule 405: the wider jury', () => {
  const jury = widerJury();

  it('is the criterion and not a list', () => {
    // Every member passes both halves; every event that passes both halves
    // is a member. A hand-picked set would fail one direction or the other.
    for (const e of jury) {
      expect(isLeastModelled(e), e.comcat).toBe(true);
      expect(e.maxMmi, e.comcat).toBeGreaterThanOrEqual(WIDER_JURY_MIN_MAX_MMI);
    }
    const eligible = ATLAS_EARTHQUAKES.filter(
      (e) => isLeastModelled(e) && e.maxMmi >= WIDER_JURY_MIN_MAX_MMI
    );
    expect(jury.length).toBe(eligible.length);
  });

  it('counts 138 least modelled maps, 116 of them reaching MMI VII', () => {
    expect(ATLAS_EARTHQUAKES.filter(isLeastModelled).length).toBe(WIDER_JURY_COUNTS.leastModelled);
    expect(jury.length).toBe(WIDER_JURY_COUNTS.events);
  });

  it('carries 178 comparable bands where the six fixtures carry ten', () => {
    for (const threshold of [7, 8, 9] as const) {
      expect(
        jury.filter((e) => e.areaKm2[threshold] > 0).length,
        `MMI ${threshold.toString()}`
      ).toBe(WIDER_JURY_COUNTS.bands[threshold]);
    }
    const total =
      WIDER_JURY_COUNTS.bands[7] + WIDER_JURY_COUNTS.bands[8] + WIDER_JURY_COUNTS.bands[9];
    expect(total).toBe(178);

    // The jury it replaces: the six fixtures' bands with ground in them.
    // Eleven, of which the last round scored ten — the one it could not
    // score is Northridge's MMI VIII, the band three rounds turned on.
    const before = SHAKEMAP_FOOTPRINTS.flatMap((f) =>
      [7, 8, 9].filter((t) => f.areaKm2[t as 7 | 8 | 9] > 0)
    ).length;
    expect(before).toBe(WIDER_JURY_COUNTS.bandsBefore);
    expect(WIDER_JURY_COUNTS.scoredBefore).toBeLessThan(before);
  });

  it('does not overlap the six, which rule 56 took out of the atlas', () => {
    // Rule 410 reports the two juries side by side, which only means
    // something if they are actually different events.
    const spent = new Set(SHAKEMAP_FOOTPRINTS.map((f) => f.eventId));
    for (const e of jury) expect(spent.has(e.comcat), e.comcat).toBe(false);
  });

  it('is a set no candidate could have been fitted to pass', () => {
    // Rule 405's declaration: these are crustal earthquakes of 1973 to
    // 1999 with a mechanism often unknown. If the jury ever became all of
    // one style or one magnitude, the round would stop meaning what it
    // says it means.
    const styles = new Set(jury.map((e) => e.faultType));
    expect(styles.size).toBeGreaterThanOrEqual(3);
    expect(Math.min(...jury.map((e) => e.magnitude))).toBeLessThanOrEqual(6.1);
    expect(Math.max(...jury.map((e) => e.magnitude))).toBeGreaterThanOrEqual(8);
  });
});
