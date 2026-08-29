import { describe, expect, it, vi } from 'vitest';
import { s } from '../physics/units.js';
import { SCRUB_EXPONENT, SimClock, scrubToTime, timeToScrub } from './simClock.js';

const clock = (duration = 10, rate = 1, multiplier = 1): SimClock =>
  new SimClock({ duration: s(duration), rate, rateMultiplier: multiplier });

describe('SimClock — advancing', () => {
  it('does not move while paused, however hard it is driven', () => {
    const c = clock();
    for (let i = 0; i < 100; i++) c.advance(16);
    expect(c.getState().time as number).toBe(0);
  });

  it('advances one simulation second per wall second at rate 1', () => {
    const c = clock();
    c.play();
    for (let i = 0; i < 20; i++) c.advance(50); // 20 x 50 ms = 1 s
    expect(c.getState().time as number).toBeCloseTo(1, 9);
  });

  it('scales with rate and with the accessibility multiplier', () => {
    const fast = clock(100, 4);
    fast.play();
    fast.advance(100);
    expect(fast.getState().time as number).toBeCloseTo(0.4, 9);

    const reduced = clock(100, 4, 0.5);
    reduced.play();
    reduced.advance(100);
    expect(reduced.getState().time as number).toBeCloseTo(0.2, 9);
  });

  it('applies the reduced-motion multiplier exactly once', () => {
    // Regression: the retired cascade scheduler multiplied by the
    // reduced-motion scale both in the cap and in the per-ring delay,
    // so the sequence ran 6.25x faster instead of 2.5x.
    const m = 0.4;
    const c = clock(100, 1, m);
    c.play();
    for (let i = 0; i < 10; i++) c.advance(100); // 1 wall second
    expect(c.getState().time as number).toBeCloseTo(m, 9);
  });

  it('clamps a huge wall delta so a backgrounded tab cannot skip the event', () => {
    const c = clock(100);
    c.play();
    c.advance(30_000); // tab was hidden for 30 s
    expect(c.getState().time as number).toBeLessThanOrEqual(0.1);
  });

  it('stops exactly at the end and reports not playing', () => {
    const c = clock(1);
    c.play();
    for (let i = 0; i < 100; i++) c.advance(50);
    const st = c.getState();
    expect(st.time as number).toBe(1);
    expect(st.playing).toBe(false);
    expect(st.progress).toBe(1);
  });

  it('is deterministic: the same delta sequence gives the same time', () => {
    const run = (): number => {
      const c = clock(50);
      c.play();
      for (const d of [16, 33, 8, 41, 16, 16, 90]) c.advance(d);
      return c.getState().time;
    };
    expect(run()).toBe(run());
  });
});

describe('SimClock — transport', () => {
  it('play from the end restarts from zero', () => {
    const c = clock(1);
    c.seek(s(1));
    c.play();
    expect(c.getState().time as number).toBe(0);
    expect(c.getState().playing).toBe(true);
  });

  it('toggle flips the transport', () => {
    const c = clock();
    expect(c.toggle().playing).toBe(true);
    expect(c.toggle().playing).toBe(false);
  });

  it('seek clamps into range and pauses', () => {
    const c = clock(10);
    c.play();
    expect(c.seek(s(-5)).time as number).toBe(0);
    expect(c.seek(s(999)).time as number).toBe(10);
    expect(c.getState().playing).toBe(false);
  });

  it('seekProgress maps [0,1] onto the duration', () => {
    const c = clock(80);
    expect(c.seekProgress(0.25).time as number).toBeCloseTo(20, 9);
    expect(c.seekProgress(2).time as number).toBe(80);
    expect(c.seekProgress(Number.NaN).time as number).toBe(0);
  });

  it('rejects a non-positive rate instead of freezing or reversing', () => {
    const c = clock(10, 2);
    c.setRate(0);
    c.setRate(-3);
    c.setRate(Number.NaN);
    expect(c.getState().rate).toBe(2);
  });

  it('setDuration keeps the normalised position across a scenario change', () => {
    const c = clock(46);
    c.seek(s(23)); // halfway through a 46 s scenario
    c.setDuration(s(300));
    expect(c.getState().time as number).toBeCloseTo(150, 6);
    expect(c.getState().progress).toBeCloseTo(0.5, 9);
  });

  it('reset returns to a paused zero', () => {
    const c = clock();
    c.play();
    c.advance(500);
    const st = c.reset();
    expect(st.time as number).toBe(0);
    expect(st.playing).toBe(false);
  });
});

describe('SimClock — subscriptions', () => {
  it('notifies on every state change and stops after unsubscribe', () => {
    const c = clock();
    const seen = vi.fn();
    const off = c.subscribe(seen);
    c.play();
    c.advance(100);
    c.pause();
    expect(seen).toHaveBeenCalledTimes(3);
    off();
    c.play();
    expect(seen).toHaveBeenCalledTimes(3);
  });

  it('hands the listener the same state getState reports', () => {
    const c = clock(20);
    let captured = c.getState();
    c.subscribe((st) => (captured = st));
    c.seek(s(7));
    expect(captured.time as number).toBe(7);
    expect(captured).toEqual(c.getState());
  });
});

describe('scrub curve', () => {
  it('round-trips time through the slider position', () => {
    const d = s(75);
    for (const t of [0, 0.01, 0.5, 4, 20, 75]) {
      expect(scrubToTime(timeToScrub(s(t), d), d) as number).toBeCloseTo(t, 6);
    }
  });

  it('gives the opening moments most of the slider travel', () => {
    const d = s(100);
    // Half the slider must land well inside the first eighth of the event.
    expect(scrubToTime(0.5, d) as number).toBeCloseTo(100 * 0.5 ** SCRUB_EXPONENT, 9);
    expect(scrubToTime(0.5, d) as number).toBeLessThan(13);
    // The first tenth of the slider stays in the first fraction of a second.
    expect(scrubToTime(0.1, d) as number).toBeLessThan(0.2);
  });

  it('is monotone and hits both ends exactly', () => {
    const d = s(30);
    expect(scrubToTime(0, d) as number).toBe(0);
    expect(scrubToTime(1, d) as number).toBe(30);
    let prev = -1;
    for (let i = 0; i <= 20; i++) {
      const t = scrubToTime(i / 20, d) as number;
      expect(t).toBeGreaterThan(prev);
      prev = t;
    }
  });

  it('survives rubbish input', () => {
    expect(scrubToTime(Number.NaN, s(10)) as number).toBe(0);
    expect(scrubToTime(-1, s(10)) as number).toBe(0);
    expect(timeToScrub(s(5), s(0))).toBe(0);
  });
});
