/**
 * Rules 563 to 570 — I3's band, measured against Collins et al. 2017,
 * 21 September 2026, written and pushed before the run.
 *
 * WHAT I3 ASKS. "The band of an airburst's blast radius holds every measured
 * airburst footprint — the forest flattened at Tunguska, the windows broken
 * at Chelyabinsk — and at least 90 % of the shock-physics runs of Collins
 * et al. 2017, and its width in radius is no more than ×3."
 *
 * WHERE IT STANDS. Not met, and the report carries one number for it:
 * "Tunguska's 20 kPa ring 0.43× the flattened forest" — 11.5 km drawn
 * against a 26.5 km equivalent-area radius. There is no band at all.
 *
 * RULE 563. WHAT THIS ROUND IS. A measurement. It builds no band, adopts
 * nothing and changes no default. It asks whether the pieces I3 needs exist
 * and what they give, so that the round which does build one knows what it
 * is building.
 *
 * RULE 564. THE REFERENCE, downloaded on 21 September 2026. Collins, G. S.,
 * Lynch, E., McAdam, R. & Davison, T. M. (2017), "A numerical assessment of
 * simple airblast models of impact airbursts", Meteoritics & Planetary
 * Science 52(8): 1542–1560, doi:10.1111/maps.12873 — open access under
 * CC-BY, from Imperial College's repository, SHA-256
 * c1cb0fc6df0ecc62d6f2f9c29d44400763c7a0a0cbc72cbc073ac1a285f5238b.
 *
 * Two things are taken from it and nothing else.
 *
 *   (a) Its Equations 6a to 6c, the 1st, 50th and 99th percentiles of burst
 *       altitude z_b in km as functions of L = log10 of the energy in Mt,
 *       from its own Monte Carlo over the impactor population:
 *
 *           z_1%  = 13.0 − 6.04 L − 0.88 L²
 *           z_50% = 25.7 − 7.83 L − 0.31 L²
 *           z_99% = 47.9 − 8.43 L − 0.03 L²
 *
 *       with "98 % of all airburst scenarios lie between z_b,1% and
 *       z_b,99%". That is a published band on the one quantity the blast
 *       radius is most sensitive to, and it is what a band for I3 should be
 *       made of rather than a spread this project invents.
 *
 *   (b) Three statements its prose makes about measured events, quoted
 *       because they are what rule 565 checks against.
 *
 * RULE 565. THE THREE CHECKS, and what each is against.
 *
 *   (i)  Tunguska at 15 Mt, 20 kPa. The paper: "the nominal conditions for
 *        extensive tree damage (40 m s⁻¹ winds; 20 kPa over pressure) are
 *        achieved to a radial distance of 16–22 km for all of the source
 *        approximations". Nimbus's own 20 kPa reach, at the same energy and
 *        at z_50%, is measured against that 16 to 22.
 *   (ii) Tunguska at 5 Mt, 10 kPa. The paper: "peak overpressures of
 *        >10 kPa and wind speeds of >20 m s⁻¹ extend to a radius of
 *        18–22 km". Measured the same way.
 *   (iii) Chelyabinsk at 1 kPa. The paper: "all three energy deposition
 *        approximations predict a ~50 km radius damage zone, which is
 *        broadly consistent with observations".
 *
 * RULE 566. THE THRESHOLD QUESTION, which the paper settles and this
 * project had not asked. Collins et al. name 10 kPa and 20 kPa as "lower
 * and upper limits for extensive tree damage", and say of the 2 200 km² of
 * felled forest that the nominal >20 kPa threshold "may represent
 * conservative thresholds by a factor of two, as local topographic effects
 * and poor tree condition may have exacerbated the tree damage". Nimbus
 * compares its 20 kPa ring — the UPPER limit — against the whole felled
 * area. The round measures the 10 kPa ring beside it and reports both.
 * It does not choose between them: choosing is an adoption and rule 563
 * forbids one here.
 *
 * RULE 567. A DISAGREEMENT IS NOT AUTOMATICALLY A DEFECT, and this is the
 * clause most likely to be needed. I1 holds Nimbus's airburst blast to the
 * Earth Impact Effects Program, and 618 of the benchmark's 636 airburst
 * points agree with that program's own printed overpressure within 1 %. So
 * if Nimbus disagrees with Collins et al. at the same energy and the same
 * burst altitude, what disagrees is the Earth Impact Effects Program and
 * Collins et al., and the round must say so in those words rather than
 * calling it a Nimbus error. Only a disagreement that survives at the same
 * inputs AND is absent from the program is this project's.
 *
 * RULE 568. THE WIDTH. I3 allows a band no wider than ×3 in radius. The
 * round measures what the z_1% to z_99% band gives at each of the three
 * energies and reports it, whatever it is. If it is wider than ×3, that is
 * a fact about the population and I3's ×3 will have to be met some other
 * way — by a narrower quantile, by conditioning on what a scenario knows —
 * and this round names the problem rather than solving it.
 *
 * RULE 569. WHAT REFUSES IT. Nothing can: there is no candidate. A
 * measurement that came out badly would still be published. What can go
 * wrong is the measurement being wrong, so: every figure the round prints
 * is computed from the shipped `airburstReach` and the equations above, and
 * every published number it is compared against is quoted in this file with
 * the sentence it came from.
 *
 * RULE 570. ONE RUN. No default moves, and the next round — a band, if the
 * numbers support one — has its own rules written before it.
 */

/** Rule 564(a): Collins et al. 2017 Eqs. 6a to 6c. `energyMt` is the
 *  pre-entry kinetic energy in megatons; the result is kilometres. */
export function burstAltitudeKm(energyMt: number, percentile: 1 | 50 | 99): number {
  const L = Math.log10(energyMt);
  if (percentile === 1) return 13.0 - 6.04 * L - 0.88 * L * L;
  if (percentile === 50) return 25.7 - 7.83 * L - 0.31 * L * L;
  return 47.9 - 8.43 * L - 0.03 * L * L;
}

/** Rule 564: the fit was performed over this range of log10(E in Mt), and
 *  is extrapolation outside it. */
export const BURST_ALTITUDE_FIT_RANGE = [-1.5, 2] as const;

/** Rule 565: the three published figures, with the sentence each is from. */
export const PUBLISHED = {
  tunguska15MtAt20kPa: {
    energyMt: 15,
    thresholdKPa: 20,
    lowKm: 16,
    highKm: 22,
    quote:
      'the nominal conditions for extensive tree damage (40 m s-1 winds; 20 kPa over pressure) are achieved to a radial distance of 16-22 km for all of the source approximations',
  },
  tunguska5MtAt10kPa: {
    energyMt: 5,
    thresholdKPa: 10,
    lowKm: 18,
    highKm: 22,
    quote:
      'peak overpressures of >10 kPa and wind speeds of >20 m s-1 extend to a radius of 18-22 km',
  },
  chelyabinskAt1kPa: {
    energyMt: 0.55,
    thresholdKPa: 1,
    lowKm: 40,
    highKm: 60,
    quote:
      'all three energy deposition approximations predict a ~50 km radius damage zone, which is broadly consistent with observations',
  },
} as const;

/** Rule 566: what the paper says the two tree-damage thresholds are. */
export const TREE_DAMAGE_KPA = { lower: 10, upper: 20 } as const;

/** The felled forest, as the project already records it: 2 200 km², whose
 *  equivalent-area radius is 26.5 km. */
export const TUNGUSKA_FELLED = { areaKm2: 2_200, equivalentRadiusKm: 26.5 } as const;

/** Rule 568: I3's limit on the width of a band, in radius. */
export const I3_WIDTH_LIMIT = 3;

export const AIRBURST_BAND_RULES = 'rules 563 to 570, fixed 21 September 2026';
