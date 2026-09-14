/**
 * A positive number as a mantissa in [1, 10) and a base-10 exponent,
 * for the editors whose quantity spans many orders of magnitude (an
 * eruption's volume, a landslide's). Anything else reads as 1 × 10⁰.
 */
export function splitScientific(n: number): { mantissa: number; exp: number } {
  if (!(n > 0) || !Number.isFinite(n)) return { mantissa: 1, exp: 0 };
  const exp = Math.floor(Math.log10(n));
  return { mantissa: n / 10 ** exp, exp };
}
