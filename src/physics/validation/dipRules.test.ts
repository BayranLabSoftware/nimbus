import { describe, expect, it } from 'vitest';
import { decodeDipByte, dipFor, DIP_STEP_DEG, encodeDipDeg } from './dipRules.js';

/**
 * Rule 427's order and rule 429's byte, pinned before the run.
 *
 * The order matters because it is the whole rule: a scenario drawn along
 * a slab must dip like that slab, and one drawn along a crustal fault
 * like that fault. Getting it backwards would hand a megathrust a
 * vertical fault again, which is the defect this round exists for.
 */
describe('rule 427: the dip follows the strike', () => {
  const style = { styleDipDeg: 90 };

  it('takes the slab where the strike came from the slab', () => {
    expect(
      dipFor({
        ...style,
        slabDipDeg: 18,
        faultDipDeg: 70,
        strikeFromSlab: true,
        strikeFromFault: false,
      })
    ).toEqual({ dipDeg: 18, source: 'slab' });
  });

  it('takes the fault where the strike came from a fault', () => {
    expect(
      dipFor({
        ...style,
        slabDipDeg: 18,
        faultDipDeg: 70,
        strikeFromSlab: false,
        strikeFromFault: true,
      })
    ).toEqual({ dipDeg: 70, source: 'fault' });
  });

  it('keeps the style constant where no structure answered', () => {
    expect(
      dipFor({
        ...style,
        slabDipDeg: null,
        faultDipDeg: null,
        strikeFromSlab: false,
        strikeFromFault: false,
      })
    ).toEqual({ dipDeg: 90, source: 'style' });
  });

  it('falls through rather than inventing a dip the source does not have', () => {
    // On a slab whose dip grid has no value at that point: the slab
    // answered the strike but cannot answer the dip, so the next source
    // speaks. Nothing is guessed.
    expect(
      dipFor({
        ...style,
        slabDipDeg: null,
        faultDipDeg: 70,
        strikeFromSlab: true,
        strikeFromFault: true,
      })
    ).toEqual({ dipDeg: 70, source: 'fault' });
    expect(
      dipFor({
        ...style,
        slabDipDeg: null,
        faultDipDeg: null,
        strikeFromSlab: true,
        strikeFromFault: false,
      })
    ).toEqual({ dipDeg: 90, source: 'style' });
  });
});

describe('rule 429: the dip byte', () => {
  it('round-trips every dip a fault can have', () => {
    for (let dip = 0; dip <= 90; dip += DIP_STEP_DEG) {
      const back = decodeDipByte(encodeDipDeg(dip));
      expect(back, `${dip.toString()}°`).toBeCloseTo(dip, 9);
    }
  });

  it('keeps zero for a cell with no dip, so absence is not a dip of zero', () => {
    // A horizontal rupture and a missing one must not encode the same:
    // cos(0°) is 1 and would lay the whole width on the ground.
    expect(decodeDipByte(0)).toBeNull();
    expect(encodeDipDeg(0)).toBe(1);
    expect(decodeDipByte(encodeDipDeg(0))).toBe(0);
  });

  it('refuses a dip that is not a dip', () => {
    expect(encodeDipDeg(Number.NaN)).toBe(0);
    expect(encodeDipDeg(-5)).toBe(0);
    // 90° is the steepest a fault can be, and it fits with room over.
    expect(encodeDipDeg(90)).toBeLessThan(255);
  });
});
