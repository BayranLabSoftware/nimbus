/**
 * Numbers a person types into the panel, on their way to the model.
 *
 * Twelve significant digits is more than any field can be typed to and
 * less than a double carries, so rounding a product to it removes the
 * float noise the product leaves and nothing the typist meant: 8.05 km
 * is 8 050 m, not 8 050.000000000001, and 2.5 × 10⁵ m³/s is 250 000,
 * not 249 999.99999999997.
 */
const TYPED_SIGNIFICANT_DIGITS = 12;

/** A number typed in the unit a reader thinks in (km, km/s), in the
 *  unit the model keeps (m, m/s). */
export function scaleTyped(value: number, factor: number): number {
  return Number((value * factor).toPrecision(TYPED_SIGNIFICANT_DIGITS));
}

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

/** A mantissa times a power of ten. */
export function fromScientific(mantissa: number, exp: number): number {
  return scaleTyped(mantissa, 10 ** exp);
}

/** Whether a typed mantissa reads as one. Anything outside [1, 10)
 *  would move the exponent under the typist's fingers, so the editors
 *  wait for the text to become one. */
export function isMantissa(v: number): boolean {
  return v >= 1 && v < 10;
}
