/**
 * The apparent crater of a contact surface burst, as Glasstone & Dolan print
 * it (rule 90 of validation/craterRules.ts).
 *
 * The book's Figures 6.72a and b draw the apparent crater radius and depth
 * against the depth of burst for a 1 kiloton explosion in four media, and
 * because the dimensions change so fast as the burst passes through the
 * surface they print the contact-surface-burst values explicitly on the page
 * rather than leaving them to be read off a curve. Those eight numbers are
 * here, in the feet the book gives them in. §6.72 scales both dimensions as
 * W^0.3 at a fixed scaled depth of burst — the book's own worked example
 * confirms the exponent by arithmetic, dividing a 270-foot burst depth at
 * 20 kt by 2.46 and multiplying the answer back by the same 2.46, and
 * 20^0.3 = 2.4622.
 *
 * Nothing is traced here. The figures themselves are curves, but a contact
 * surface burst is the one point of each that the book states in words.
 */

/** The book's four media, numbered as its own legend numbers them. */
export type BookCraterMedium =
  | 'wetSoilOrSoftRock'
  | 'drySoilOrSoftRock'
  | 'wetHardRock'
  | 'dryHardRock';

export const FOOT_M = 0.3048;

/** §6.72: both the radius and the depth of a crater vary as W^0.3. */
export const CRATER_YIELD_EXPONENT = 0.3;

/** The apparent crater of a 1 kt contact surface burst, in feet, as printed on
 *  Figures 6.72a (radius) and 6.72b (depth). */
export const BOOK_CONTACT_CRATER_FT: Readonly<
  Record<BookCraterMedium, { radius: number; depth: number; legend: number; name: string }>
> = {
  wetSoilOrSoftRock: { radius: 82, depth: 31, legend: 1, name: 'wet soil or wet soft rock' },
  drySoilOrSoftRock: { radius: 61, depth: 28, legend: 2, name: 'dry soil or dry soft rock' },
  wetHardRock: { radius: 58, depth: 28, legend: 3, name: 'wet hard rock' },
  dryHardRock: { radius: 49, depth: 22, legend: 4, name: 'dry hard rock' },
};

/** The apparent crater diameter (m) of a contact surface burst of
 *  `yieldKilotons` in one of the book's media. */
export function bookCraterDiameterM(medium: BookCraterMedium, yieldKilotons: number): number {
  if (!(yieldKilotons > 0)) return 0;
  const radiusFt = BOOK_CONTACT_CRATER_FT[medium].radius;
  return 2 * radiusFt * FOOT_M * yieldKilotons ** CRATER_YIELD_EXPONENT;
}

/** The apparent crater depth (m) of the same burst. */
export function bookCraterDepthM(medium: BookCraterMedium, yieldKilotons: number): number {
  if (!(yieldKilotons > 0)) return 0;
  return BOOK_CONTACT_CRATER_FT[medium].depth * FOOT_M * yieldKilotons ** CRATER_YIELD_EXPONENT;
}

/** The coefficient K of `D_a = K · W_kt^0.3` the book's numbers give, in
 *  metres of diameter — the same shape as the project's own coefficients. */
export function bookCraterCoefficient(medium: BookCraterMedium): number {
  return 2 * BOOK_CONTACT_CRATER_FT[medium].radius * FOOT_M;
}
