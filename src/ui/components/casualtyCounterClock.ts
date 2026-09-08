/**
 * The clock behind the death-toll counter in the bar.
 *
 * The globe has no playback clock: the cascade panel reveals its
 * stages over a fixed UI budget with the physical onsets
 * log-compressed into it, so seconds and centuries share five
 * seconds of screen time. The counter borrows the same idea over its
 * own range: UI progress p ∈ [0, 1] maps to the physical time
 *
 *     t(p) = expm1(p · ln(1 + T)),   T = when the last death occurs,
 *
 * which gives the first seconds — where a city dies — room to be
 * seen and keeps the hours of a planetary blast from stealing the
 * screen. The physical time is printed next to the toll, so the
 * compression never passes for real time.
 */

/** UI budget of the sweep (ms): the cascade timeline's reveal length,
 *  so the toll and the panel unfold together. */
export const COUNTER_ANIMATION_MS = 5_000;

/** Physical seconds shown at UI progress `progress` for a sweep whose
 *  last death occurs at `endS`. Monotonic, 0 at p = 0, `endS` at p = 1. */
export function physicalTimeAt(progress: number, endS: number): number {
  const p = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  if (!(endS > 0)) return 0;
  if (p >= 1) return endS;
  return Math.expm1(p * Math.log1p(endS));
}

/** Time constant (ms) of the easing that slides the displayed figure
 *  towards the sample, so a refined estimate glides instead of jumping. */
export const COUNTER_EASE_MS = 120;

/** One easing step: the displayed value after `dtMs` chasing `target`. */
export function easeTowards(shown: number, target: number, dtMs: number): number {
  const k = 1 - Math.exp(-Math.max(0, dtMs) / COUNTER_EASE_MS);
  return shown + (target - shown) * k;
}

/** Whether the displayed figure has settled on the target: within a
 *  person or 0.2 %, whichever is larger — below what two significant
 *  figures can show. */
export function hasSettled(shown: number, target: number): boolean {
  return Math.abs(target - shown) <= Math.max(1, target * 0.002);
}
