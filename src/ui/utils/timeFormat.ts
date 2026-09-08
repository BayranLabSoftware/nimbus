const ONE_MINUTE = 60;
const ONE_HOUR = 3_600;
const ONE_DAY = 86_400;

/**
 * Elapsed time since the event, the way the cascade timeline stamps
 * its onsets: "+42 s", "+3 min", "+1.5 h", "+2 d". The counter in the
 * bar shows the physical clock next to the toll so the compressed
 * animation never passes for real time.
 */
export function formatElapsed(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '+0 s';
  if (seconds < ONE_MINUTE) return `+${seconds.toFixed(0)} s`;
  if (seconds < ONE_HOUR) return `+${(seconds / ONE_MINUTE).toFixed(0)} min`;
  if (seconds < ONE_DAY) return `+${(seconds / ONE_HOUR).toFixed(1)} h`;
  return `+${(seconds / ONE_DAY).toFixed(0)} d`;
}
