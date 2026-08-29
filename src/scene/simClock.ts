import type { Seconds } from '../physics/units.js';
import { s } from '../physics/units.js';

/**
 * Simulation clock.
 *
 * The scene layer used to animate imperatively: every overlay owned a
 * `requestAnimationFrame` loop, a hard-coded duration and its own
 * cinematic constants. Nothing could be paused, nothing could be
 * scrubbed, two overlays could disagree about what time it was, and
 * the reduced-motion scale was applied twice in one code path because
 * there was no single place that owned "when".
 *
 * This is that single place. It holds one number — the simulation time
 * — and everything drawn is a pure function of it. Consequences:
 *
 *   - the scene can be paused mid-event and orbited;
 *   - a shared link can carry `t` and reproduce the exact frame;
 *   - a screenshot test can seek to a time instead of racing a timer;
 *   - reduced motion is one multiplier in one place.
 *
 * Deliberately free of DOM and of `Date.now()`: the caller supplies the
 * wall-clock delta. That makes the whole thing deterministic under test
 * and lets a headless renderer step it at whatever cadence it likes.
 */

/** Simulation seconds elapsed per wall-clock second, at rate 1. */
export const DEFAULT_RATE = 1;

/** Largest wall-clock step honoured in one advance, in milliseconds.
 *  A backgrounded tab can return a multi-second delta on the first
 *  frame after it regains focus; without a clamp the event would jump
 *  from the flash straight to the aftermath. */
const MAX_STEP_MS = 100;

export interface SimClockState {
  /** Current simulation time (s), always within [0, duration]. */
  readonly time: Seconds;
  /** Full length of the scenario in simulation seconds. */
  readonly duration: Seconds;
  /** Simulation seconds per wall second. */
  readonly rate: number;
  /** True while the clock is advancing on its own. */
  readonly playing: boolean;
  /** Normalised position in [0, 1]. */
  readonly progress: number;
}

export type SimClockListener = (state: SimClockState) => void;

export interface SimClockOptions {
  /** Scenario length in simulation seconds. Must be > 0. */
  readonly duration: Seconds;
  /** Initial rate. Defaults to {@link DEFAULT_RATE}. */
  readonly rate?: number;
  /** Multiplier applied on top of `rate`, for accessibility settings.
   *  Pass 1 for normal motion. Kept separate from `rate` so a user's
   *  reduced-motion preference survives a scenario change. */
  readonly rateMultiplier?: number;
}

export class SimClock {
  private t = 0;
  private dur: number;
  private rateValue: number;
  private multiplier: number;
  private isPlaying = false;
  private readonly listeners = new Set<SimClockListener>();

  constructor(options: SimClockOptions) {
    this.dur = Math.max(options.duration, 1e-6);
    this.rateValue = options.rate ?? DEFAULT_RATE;
    this.multiplier = options.rateMultiplier ?? 1;
  }

  getState(): SimClockState {
    return {
      time: s(this.t),
      duration: s(this.dur),
      rate: this.rateValue,
      playing: this.isPlaying,
      progress: this.t / this.dur,
    };
  }

  /**
   * Advance by a wall-clock interval. Returns the new state. A no-op
   * when paused, so the caller can drive it unconditionally from its
   * animation loop.
   */
  advance(wallDeltaMs: number): SimClockState {
    if (!this.isPlaying || !Number.isFinite(wallDeltaMs) || wallDeltaMs <= 0) {
      return this.getState();
    }
    const step = Math.min(wallDeltaMs, MAX_STEP_MS) / 1_000;
    const next = this.t + step * this.rateValue * this.multiplier;
    if (next >= this.dur) {
      this.t = this.dur;
      this.isPlaying = false;
    } else {
      this.t = next;
    }
    return this.emit();
  }

  /** Start playing. Restarts from zero when already at the end. */
  play(): SimClockState {
    if (this.t >= this.dur) this.t = 0;
    this.isPlaying = true;
    return this.emit();
  }

  pause(): SimClockState {
    this.isPlaying = false;
    return this.emit();
  }

  toggle(): SimClockState {
    return this.isPlaying ? this.pause() : this.play();
  }

  /** Jump to an absolute simulation time. Pauses; scrubbing is a
   *  deliberate act and should not fight the playhead. */
  seek(time: Seconds): SimClockState {
    this.t = Math.min(Math.max(time, 0), this.dur);
    this.isPlaying = false;
    return this.emit();
  }

  /** Jump to a normalised position in [0, 1]. */
  seekProgress(progress: number): SimClockState {
    const p = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
    return this.seek(s(p * this.dur));
  }

  setRate(rate: number): SimClockState {
    if (Number.isFinite(rate) && rate > 0) this.rateValue = rate;
    return this.emit();
  }

  /** Change the accessibility multiplier without touching `rate`. */
  setRateMultiplier(multiplier: number): SimClockState {
    if (Number.isFinite(multiplier) && multiplier > 0) this.multiplier = multiplier;
    return this.emit();
  }

  /**
   * Retarget to a new scenario length, keeping the same NORMALISED
   * position. Switching from a 46 s scenario to a 300 s one should not
   * teleport the playhead to the very beginning of the new event.
   */
  setDuration(duration: Seconds): SimClockState {
    const next = Math.max(duration, 1e-6);
    const p = this.t / this.dur;
    this.dur = next;
    this.t = Math.min(p * next, next);
    return this.emit();
  }

  /** Reset to t = 0, paused. */
  reset(): SimClockState {
    this.t = 0;
    this.isPlaying = false;
    return this.emit();
  }

  subscribe(listener: SimClockListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(): SimClockState {
    const state = this.getState();
    for (const listener of this.listeners) listener(state);
    return state;
  }
}

/**
 * Scrub curve.
 *
 * Almost everything worth watching in a blast happens in the first
 * seconds — the flash, the fireball, breakaway, the ejecta launch —
 * and a linear slider skips straight past them. Mapping the slider
 * through a power curve gives the opening moments most of the travel
 * while still reaching the end of the scenario.
 *
 * Exponent 3 puts the first 10 % of the slider on the first 0.1 % of
 * the timeline, which is where the fireball is born, and keeps the
 * midpoint at 12.5 % of the duration.
 *
 * Kept out of {@link SimClock} on purpose: the clock stores real
 * seconds, the curve is a UI concern. A test that seeks to 3 s must
 * not have to know how the slider is shaped.
 */
export const SCRUB_EXPONENT = 3;

/** Slider position [0, 1] → simulation time. */
export function scrubToTime(fraction: number, duration: Seconds): Seconds {
  const f = Number.isFinite(fraction) ? Math.min(Math.max(fraction, 0), 1) : 0;
  return s(f ** SCRUB_EXPONENT * (duration as number));
}

/** Simulation time → slider position [0, 1]. Inverse of the above. */
export function timeToScrub(time: Seconds, duration: Seconds): number {
  const d = duration as number;
  if (!(d > 0)) return 0;
  const p = Math.min(Math.max((time as number) / d, 0), 1);
  return p ** (1 / SCRUB_EXPONENT);
}
