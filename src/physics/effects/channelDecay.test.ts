import { describe, expect, it } from 'vitest';
import {
  CHANNEL_DECAY_PROBE_P,
  MANUAL_EXAMPLE_TWO_CHANNEL_DECAY,
  ZONE_JOIN_RATIO,
} from '../validation/channelDecayRules.js';
import { impulseProduct } from './impulseWave.js';
import {
  CHANNEL_DECAY_EXPONENT,
  channelDecay,
  channelMaximumAmplitude,
  channelWaveAmplitude,
  channelMaximumDistance,
  channelMaximumWaveHeight,
  channelWaveHeight,
  channelWavePeriod,
  channelZoneJoinRatio,
} from './channelDecay.js';

/**
 * Rules 518 to 524. Every number on the right of an expectation is read from
 * the manual, and every one of them is repeated in
 * `validation/channelDecayRules.ts`, which was pushed before this file
 * existed.
 */

describe('rule 521: the manual’s own worked channel decay', () => {
  it('carries 2.2 m over 1 550 m in 100 m of water to the 1.1 m it prints', () => {
    const e = MANUAL_EXAMPLE_TWO_CHANNEL_DECAY;
    const atDam = channelDecay(e.amplitudeAtCM, e.depthM, e.distanceM);
    // The manual prints 1.1 m, to two significant figures.
    expect(atDam).toBeCloseTo(1.0593, 4);
    expect(Math.abs(atDam - e.amplitudeAtDamM)).toBeLessThanOrEqual(0.05);
  });

  it('uses the exponent the manual writes, exactly and not as a decimal', () => {
    expect(CHANNEL_DECAY_EXPONENT).toBe(-4 / 15);
    expect(CHANNEL_DECAY_EXPONENT).toBe(MANUAL_EXAMPLE_TWO_CHANNEL_DECAY.exponent);
    // And it is Eq. (3.19)'s own X-dependence, (X^(-1/3))^(4/5), not a
    // separate number that happens to be near it.
    expect(CHANNEL_DECAY_EXPONENT).toBeCloseTo(-(1 / 3) * (4 / 5), 15);
  });

  it('carries an amplitude between two points of the channel, not only from zero', () => {
    const e = MANUAL_EXAMPLE_TWO_CHANNEL_DECAY;
    // Splitting the leg in two must give what one leg gives.
    const half = channelDecay(e.amplitudeAtCM, e.depthM, 700);
    const rest = channelDecay(half, e.depthM, e.distanceM, 700);
    expect(rest).toBeCloseTo(channelDecay(e.amplitudeAtCM, e.depthM, e.distanceM), 12);
  });
});

describe('rule 520: the three relations of the impact zone', () => {
  it('are Eqs. (3.13), (3.14) and (3.15) as printed', () => {
    const P = 0.43;
    const h = 100;
    expect(channelMaximumWaveHeight(P, h)).toBeCloseTo((5 / 9) * Math.pow(P, 0.8) * h, 12);
    expect(channelMaximumDistance(P, h)).toBeCloseTo((11 / 2) * Math.sqrt(P) * h, 12);
    expect(channelWavePeriod(P, h)).toBeCloseTo(9 * Math.sqrt(P) * Math.sqrt(h / 9.81), 12);
  });

  it('read the impulse product this project already verifies, not a new one', () => {
    // Example 2's slide, whose P the manual prints as 0.43 and which
    // `impulseWave.test.ts` already holds to that.
    const P = impulseProduct({
      froude: 32 / Math.sqrt(9.81 * 100),
      thicknessM: 40,
      widthM: 120,
      volumeM3: 600_000,
      densityKgM3: 500,
      angleDeg: 35,
      depthM: 100,
    });
    expect(P).toBeCloseTo(0.43, 2);
    expect(channelMaximumWaveHeight(P, 100)).toBeGreaterThan(0);
  });

  it('give nothing where there is nothing to give', () => {
    for (const f of [channelMaximumWaveHeight, channelMaximumDistance, channelWavePeriod]) {
      expect(f(0, 100)).toBe(0);
      expect(f(0.43, 0)).toBe(0);
      expect(f(-1, 100)).toBe(0);
    }
  });
});

describe('rule 520: Eq. (3.19) and the domain the manual gives it in', () => {
  it('is silent at or before the maximum, where the manual does not give it', () => {
    const P = 0.43;
    const h = 100;
    const xM = channelMaximumDistance(P, h);
    expect(channelWaveHeight(P, h, xM)).toBe(0);
    expect(channelWaveHeight(P, h, xM * 0.9)).toBe(0);
    expect(channelWaveHeight(P, h, xM * 1.01)).toBeGreaterThan(0);
  });

  it('falls with distance at the rate the decay does', () => {
    const P = 0.43;
    const h = 100;
    const a = channelWaveHeight(P, h, 1_000);
    const b = channelWaveHeight(P, h, 4_000);
    expect(b).toBeLessThan(a);
    expect(b / a).toBeCloseTo(Math.pow(4, CHANNEL_DECAY_EXPONENT), 12);
  });
});

describe('rule 522: the two zones do not join, measured and pinned', () => {
  it('reproduces the four ratios the rules recorded', () => {
    for (const P of CHANNEL_DECAY_PROBE_P) {
      const printed = ZONE_JOIN_RATIO[String(P)];
      expect(printed, `no ratio recorded for P=${String(P)}`).toBeDefined();
      expect(channelZoneJoinRatio(P), `P=${String(P)}`).toBeCloseTo(printed!, 4);
    }
  });

  it('crosses once, at P = 0.3139, and diverges either side', () => {
    // Solved rather than eyeballed: the ratio is
    // [(3/4)(11/2)^(-4/15)/(5/9)]·P^(-2/15) = 0.856848·P^(-2/15), so it
    // passes 1 at P = exp(ln(1/0.856848)/(-2/15)) = 0.31389. The rules file
    // first said "near 0.37", read off the four sampled points; that was a
    // guess between samples and it was wrong, which this corrects.
    expect(channelZoneJoinRatio(0.13)).toBeGreaterThan(1);
    expect(channelZoneJoinRatio(0.31389)).toBeCloseTo(1, 5);
    expect(channelZoneJoinRatio(2.08)).toBeLessThan(0.8);
    // Monotone in P: the gap only widens as the slide gets more energetic.
    const ratios: number[] = [0.13, 0.43, 1, 2.08].map(channelZoneJoinRatio);
    for (let i = 1; i < ratios.length; i++) {
      expect(ratios[i]!).toBeLessThan(ratios[i - 1]!);
    }
  });

  it('does not depend on the water depth, so it is the exponents and nothing else', () => {
    for (const depthM of [10, 100, 1_000]) {
      const P = 1;
      const peak = channelMaximumWaveHeight(P, depthM);
      const X = channelMaximumDistance(P, depthM) / depthM;
      const propagation = (3 / 4) * Math.pow(P * Math.pow(X, -1 / 3), 4 / 5) * depthM;
      expect(propagation / peak).toBeCloseTo(channelZoneJoinRatio(P), 12);
    }
  });
});

describe('rule 518: nothing in the product calls this yet', () => {
  it('leaves the landslide simulator exactly where it was', async () => {
    const { LANDSLIDE_PRESETS, simulateLandslide } =
      await import('../events/landslide/simulate.js');
    // Vaiont is the confined-basin preset this round refuses to rewire.
    const vaiont = simulateLandslide(LANDSLIDE_PRESETS.VAIONT_1963.input);
    expect(Number(vaiont.tsunami?.sourceAmplitude)).toBeCloseTo(162.0, 1);
  });
});

describe('Eq. (3.16): the amplitude from the height', () => {
  it('is four fifths of it, and leaves the trough at a fifth as the manual says', () => {
    expect(channelWaveAmplitude(10)).toBeCloseTo(8, 12);
    // "The wave trough is thus equal on average to only about 20 % of the
    // wave height H in 2D" — a free check that the 4/5 is the right way up.
    const H = 10;
    expect(H - channelWaveAmplitude(H)).toBeCloseTo(0.2 * H, 12);
    expect(channelWaveAmplitude(0)).toBe(0);
    expect(channelWaveAmplitude(-3)).toBe(0);
  });

  it('gives a confined basin its source amplitude, (4/9) P^(4/5) h', () => {
    for (const P of [0.13, 0.43, 2.08]) {
      expect(channelMaximumAmplitude(P, 238)).toBeCloseTo((4 / 9) * Math.pow(P, 0.8) * 238, 9);
    }
  });
});
