import { describe, expect, it } from 'vitest';
import { airburstReach } from '../effects/airburstBlast.js';
import { simulateImpact } from '../simulate.js';
import { m, type Joules, type Pascals } from '../units.js';
import { GROWTH, THE_408, THE_FOUR_LOOKED_AT } from './impactMonotonicityRules.js';

/**
 * THE OUTCOME OF RULES 555 TO 562, run once on 21 September 2026: the
 * diagnosis is REFUSED as it was written, by one scenario in four hundred
 * and eight.
 *
 * What the run found, on the sweep's own seed:
 *
 *   • the 408 reproduce exactly — lightDamage 149, overpressure1psi 137,
 *     overpressure5psi 122, the counts the report has carried since
 *     16 September;
 *   • the blast yield rose in all 408, so nothing is losing energy;
 *   • rule 556(b) HOLDS: over 42 107 pairs, a 3 % larger yield at a HELD
 *     burst geometry never once gave a smaller ring. The blast law itself
 *     is monotone and there is no defect under this one;
 *   • rule 556(a) FAILS: the burst geometry fell in 407 and ROSE in one.
 *
 * Rule 556 said a single such case means "the rest of the diagnosis does
 * not stand", and it does not. The claim is not restated in a looser form
 * to make it pass — "the geometry MOVES" would cover all 408 and would be a
 * claim written after its own figure, which is the one thing the protocol
 * exists to stop. It is the next round's, pre-registered, if anyone wants
 * it.
 *
 * THE ONE, diagnosed because a refusal is worth measuring: a 5.05 m iron
 * body at 31.4 km/s. Grown by 1 % it breaks up HIGHER, 9 417 m to 9 591 m,
 * and bursts higher, 7 614 m to 7 753 m. That is the same mechanism with
 * its sign reversed — a bigger body has more mass per unit area, so it
 * decelerates less, so it is still fast in thinner air and the dynamic
 * pressure reaches its strength sooner. Its light-damage ring was already
 * above the height-of-burst optimum for a 0.067 Mt yield, so rising shrank
 * it too, 5 373 m to 5 313 m.
 */

describe('rules 555 to 562: the 408, as the run left them', () => {
  it('reproduces the counts the report has carried since 16 September', () => {
    expect(THE_408).toEqual({
      'damage.lightDamage': 149,
      'damage.overpressure1psi': 137,
      'damage.overpressure5psi': 122,
    });
    expect(Object.values(THE_408).reduce((a, b) => a + b, 0)).toBe(408);
  });

  it('pins the one scenario that refused rule 556(a)', () => {
    const input = {
      impactorDiameter: 5.050986692006226,
      impactVelocity: 31_365.74542708695,
      impactorDensity: 9_459.625942981802,
      targetDensity: 3_322.0367124304175,
      impactAngle: 0.45572909789221255,
      impactAzimuthDeg: 85.12414939049631,
      waterDepth: 172.92891037407549,
    } as const;
    const a = simulateImpact(input as never);
    const b = simulateImpact({
      ...input,
      impactorDiameter: input.impactorDiameter * GROWTH,
    } as never);
    const num = (v: unknown): number => Number(v);
    // A bigger body that breaks up and bursts HIGHER, not lower.
    expect(num(a.entry.breakupAltitude)).toBeCloseTo(9_416.571, 2);
    expect(num(b.entry.breakupAltitude)).toBeCloseTo(9_591.421, 2);
    expect(num(b.entry.burstAltitude)).toBeGreaterThan(num(a.entry.burstAltitude));
    // More energy, and a smaller ring all the same.
    expect(num(b.entry.blastYieldMegatons)).toBeGreaterThan(num(a.entry.blastYieldMegatons));
    expect(num(b.damage.lightDamage)).toBeLessThan(num(a.damage.lightDamage));
    expect(num(a.damage.lightDamage)).toBeCloseTo(5_373.488, 2);
    expect(num(b.damage.lightDamage)).toBeCloseTo(5_313.122, 2);
  });

  it('keeps the four that were looked at before the rules were written', () => {
    // Three partial airbursts whose virtual source sinks, one complete
    // airburst whose altitude drops. Declared in the rules as not held out.
    expect(THE_FOUR_LOOKED_AT).toHaveLength(4);
    for (const f of THE_FOUR_LOOKED_AT) {
      expect(f.virtualBurstTo).toBeLessThan(f.virtualBurstFrom);
    }
    expect(THE_FOUR_LOOKED_AT.filter((f) => f.regime === 'COMPLETE_AIRBURST')).toHaveLength(1);
  });
});

describe('rule 556(b): the blast law itself is monotone in yield', () => {
  it('never shrinks a ring for more yield at a held burst altitude', () => {
    // The run did 42 107 pairs and found none. This is a smaller grid of the
    // same question, so the claim stays checked in CI.
    const thresholds: readonly number[] = [34_474, 6_895, 2_000];
    let checked = 0;
    for (let a = 0; a <= 60_000; a += 2_500) {
      for (let e = 12; e <= 21; e += 1) {
        const yieldJ = 10 ** e;
        for (const pa of thresholds) {
          const r0 = Number(airburstReach(pa as Pascals, m(a), yieldJ as Joules));
          const r1 = Number(airburstReach(pa as Pascals, m(a), (yieldJ * 1.03) as Joules));
          if (!(r0 > 0) && !(r1 > 0)) continue;
          checked++;
          expect(r1, `${String(pa)} Pa at ${String(a)} m, 1e${String(e)} J`).toBeGreaterThanOrEqual(
            r0 * (1 - 1e-12)
          );
        }
      }
    }
    expect(checked).toBe(400);
  });

  it('is NOT monotone in the burst altitude, which is the whole point', () => {
    // A ring at a fixed yield rises to an optimum height and falls after it.
    // This is the behaviour G5's clause does not allow for, and it is
    // Glasstone & Dolan's, not this project's invention.
    const yieldJ = 4.184e15 as Joules; // 1 Mt
    const at = (altitudeM: number): number =>
      Number(airburstReach(6_895 as Pascals, m(altitudeM), yieldJ));
    const ground = at(0);
    const heights = [0, 500, 1_000, 2_000, 3_000, 5_000, 8_000, 12_000, 20_000];
    const reaches = heights.map(at);
    const best = Math.max(...reaches);
    const bestAt = heights[reaches.indexOf(best)] ?? 0;
    expect(bestAt).toBeGreaterThan(0);
    expect(best).toBeGreaterThan(ground);
    expect(at(20_000)).toBeLessThan(best);
  });
});
