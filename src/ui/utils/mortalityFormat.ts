/**
 * A mortality rate a reader can believe.
 *
 * Rounded to one decimal place, the rate that kills 330 people out of
 * 6 700 000 prints as "0 %" — and a column that says nobody dies beside a
 * column that says 330 did makes the whole table look broken. It was the
 * first thing a reader asked about.
 *
 * The rates here span five orders of magnitude, from PAGER's best-stock
 * countries at a few per hundred thousand to its worst at better than one
 * in two, so no fixed number of decimals works. Two significant figures
 * always say something, and for anything below a percent the "one in N"
 * form is the one people actually read.
 */
export function formatMortality(
  rate: number,
  locale: string,
  oneIn: (n: string) => string
): string {
  if (!Number.isFinite(rate) || rate <= 0) return '0 %';
  const percent = rate * 100;
  // Two significant figures: for a percentage below 1, that is one more
  // decimal place than the position of its first significant digit.
  const digits = percent >= 1 ? 1 : Math.min(8, 1 - Math.floor(Math.log10(percent)));
  const shown = `${percent.toLocaleString(locale, { maximumFractionDigits: digits })} %`;
  if (rate >= 0.01) return shown;
  // One in N, rounded to one significant figure: the point is the order of
  // magnitude, not the digits.
  const n = 1 / rate;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const rounded = Math.round(n / magnitude) * magnitude;
  return `${shown} · ${oneIn(rounded.toLocaleString(locale))}`;
}
