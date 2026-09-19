import { JOULES_PER_CAL_CM2 } from './burnExposure.js';

/**
 * The radiant exposure that sets a material alight, from the table the book
 * gives it in.
 *
 * Glasstone & Dolan (1977), The Effects of Nuclear Weapons, 3rd edition,
 * Table 7.40 on page 289 — "Approximate radiant exposures for ignition of
 * various materials for low air bursts" — lists some forty materials against
 * three yields: 35 kilotons, 1.4 megatons and 20 megatons. The exposure grows
 * with the yield for the same reason the burn exposures of Figure 12.64 do: a
 * larger explosion spreads the same heat over a longer pulse, and the material
 * sheds more of it while it arrives.
 *
 * Two of its rows are carried here, chosen by rule 228 of
 * validation/massFireRules.ts:
 *
 *   Newspaper, shredded        ignites                     4    6   11
 *   Plywood, douglas fir       flaming during exposure     9   16   20
 *
 * They are transcribed by hand from the page image of the public scan (DTIC
 * ADA087568, page 289), not from its OCR, which reads 8 for 9 and 9 for 8
 * through this table. The table's own footnote travels with them: the values
 * are estimated good to ±25 % under standard laboratory conditions and to
 * ±50 % under typical field conditions, "with a greater likelihood of higher
 * rather than lower values". The outdoor tinder rows carry a third footnote —
 * ignition depends strongly on moisture content — and are not read here.
 *
 * What the two stand for. The shredded newspaper is the lightest household
 * tinder in the table and the material Nimbus's own ignition constant claimed
 * to be. The douglas fir plywood is the table's one structural surface whose
 * recorded effect is flaming during the exposure itself, and it stands for the
 * second of §7.58's four requirements for a fire storm — at least half the
 * structures in the area on fire simultaneously — which is the only one of the
 * four that a radiant exposure can speak to. The other three are a fuel
 * loading, a wind and a minimum area; §7.58 says plainly that there is no
 * generally accepted definition of a fire storm and that the conditions under
 * which one may be expected are not known.
 */

/** Which row of the table a ring is drawn at. */
export type IgnitionMaterial = 'tinder' | 'structural';

/** The yields the table's three columns are read at, in kilotons. */
export const IGNITION_YIELDS_KT: readonly number[] = [35, 1_400, 20_000];

/** Table 7.40's two rows, in cal/cm², at {@link IGNITION_YIELDS_KT}. */
export const IGNITION_EXPOSURE_CAL_CM2: Readonly<Record<IgnitionMaterial, readonly number[]>> = {
  tinder: [4, 6, 11],
  structural: [9, 16, 20],
};

/**
 * The exposure (cal/cm²) that row asks for at this yield, interpolated in the
 * logarithm of the yield between the table's three columns and held flat
 * outside them, where the table says nothing.
 *
 * Holding flat is not neutral, and rule 228 records which way it leans. Below
 * 35 kt the true exposure is lower than the held value, so a ring drawn here
 * falls a little short of its ground. Above 20 Mt — every impact worth the
 * name — the true exposure is higher, and for an impact higher again, because
 * its pulse outlasts a nuclear fireball's by orders of magnitude. There, the
 * ring is an upper bound on the reach.
 */
export function ignitionExposureCalPerCm2(
  material: IgnitionMaterial,
  yieldKilotons: number
): number {
  const values = IGNITION_EXPOSURE_CAL_CM2[material];
  const first = values[0] ?? 0;
  const last = values[values.length - 1] ?? 0;
  if (!(yieldKilotons > 0)) return first;
  const w = Math.log10(yieldKilotons);
  for (let i = 1; i < IGNITION_YIELDS_KT.length; i++) {
    const lo = IGNITION_YIELDS_KT[i - 1];
    const hi = IGNITION_YIELDS_KT[i];
    const vlo = values[i - 1];
    const vhi = values[i];
    if (lo === undefined || hi === undefined || vlo === undefined || vhi === undefined) continue;
    if (w <= Math.log10(lo)) return i === 1 ? first : vlo;
    if (w <= Math.log10(hi)) {
      const t = (w - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo));
      return vlo + t * (vhi - vlo);
    }
  }
  return last;
}

const JOULES_PER_KILOTON = 4.184e12;

/** The same exposure as a fluence in J/m², for a scenario of `yieldJoules`. */
export function ignitionFluenceThreshold(material: IgnitionMaterial, yieldJoules: number): number {
  return ignitionExposureCalPerCm2(material, yieldJoules / JOULES_PER_KILOTON) * JOULES_PER_CAL_CM2;
}
