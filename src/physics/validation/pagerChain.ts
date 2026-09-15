import { meanAbsoluteBias } from './contourLaws.js';
import { SIZE_BANDS, sizeBandOf } from './scorecard.js';

/**
 * People and deaths against USGS PAGER: the chain from shaking to loss.
 *
 * The benchmark campaign (docs/BENCHMARK_REPORT.md, BM-03) put the
 * simulator's people at MMI VII and above at 0.13 of the people PAGER
 * counts for the same 187 earthquakes, its toll at 0.30 of PAGER's
 * estimate, and nobody at MMI IX where PAGER counts millions. Three things
 * were found before these rules were written, and they are not held out:
 *
 *  - PAGER counts intensity k from k − ½ to k + ½ (usgs/pager,
 *    losspager/models/exposure.py), as ShakeMap's legend bands it. The
 *    simulator's VII starts at 7.0, which alone about halves the people.
 *  - The rings convert Boore et al. 2014's median PGA with Worden et al.
 *    2012's PGA relation. PGA saturates near a fault: the highest intensity
 *    that median reaches is 8.0 to 8.8, for any magnitude on any ground,
 *    so the MMI IX ring is empty by construction. ShakeMap draws intensity
 *    from PGV where it has one; with Boore et al. 2014's median PGV, IX
 *    appears only from about Mw 7.8 on soft ground.
 *  - PAGER's empirical model counts deaths in the bins from V to IX, each
 *    at the rate of its integer intensity (losspager/models/emploss.py).
 *    The simulator counts them from VII, at the rates of 7.5, 8.5 and 9.5.
 *
 * What is left after those — median rings against maps built on the
 * recordings of earthquakes chosen because they did damage, one Vs30 under
 * the epicentre against a map of sites, one country's curve for a
 * footprint that crosses borders — is the model's, and is declared rather
 * than fixed here.
 *
 * The rules, fixed on 15 September 2026, before either chain below was run
 * on any earthquake they name, and numbered after the thirty before them:
 *
 *  31. The chains. In place: Boore et al. 2014's median PGA with its
 *      fault-type and site terms, each intensity's PGA from Worden et al.
 *      2012's PGA relation, the rings at MMI 7.0, 8.0 and 9.0, and the
 *      toll's bands VII–VIII, VIII–IX and IX and above at PAGER's rates
 *      for 7.5, 8.5 and 9.5. PAGER's: Boore et al. 2014's median PGV with
 *      its fault-type and site terms (the non-linear one driven by the PGA
 *      on reference rock, as the paper has it), each intensity's PGV from
 *      Worden et al. 2012's PGV relation, and the bands PAGER's loss model
 *      counts — intensity k from k − ½ to k + ½, for k from V to IX with IX
 *      open above — each at PAGER's rate for k, with the rings drawn at the
 *      bands' edges, 4.5, 5.5, 6.5, 7.5 and 8.5, and the ground-motion
 *      residual sampled with the PGV σ of Boore et al. 2014. Everything else
 *      is shared: the footprint (a disc, or the rupture's stadium), the
 *      ground by rule 22, the population, the country's curve at the
 *      epicentre, and the harness. Before any score, Boore et al. 2014's
 *      PGV as coded is held to the values of D. M. Boore's own Fortran
 *      program in OpenQuake's test data within 0.1 %, as its PGA is
 *      (ringVerification.ts), and Worden et al. 2012's PGV relation to the
 *      coefficients in ShakeMap's code (shakelib/gmice/wgrw12.py); a miss
 *      is a defect to fix, not a choice.
 *  32. People. For each of the 187 earthquakes of the campaign's EQ-PAGER
 *      track, whose PAGER products are stored in pagerProductsData.ts
 *      before either chain runs on them, and with the events the campaign
 *      built for them (scripts/benchmark/compare-pager.ts): each chain's
 *      people at and above VII, VIII and IX as its own bands count them —
 *      from 7.0, 8.0 and 9.0 in place, from 6.5, 7.5 and 8.5 in PAGER's —
 *      counted by the harness on the shipped population raster, against
 *      PAGER's people in the same bins and above. A pair where either side
 *      counts 1 000 people or more scores ln((model + 1 000) / (PAGER +
 *      1 000)). A cell is an intensity in a magnitude cell of the
 *      scorecard; its bias is the mean score of its pairs; and a chain's
 *      people score is the mean absolute bias over the cells with five
 *      pairs or more.
 *  33. Adoption. PAGER's chain replaces the chain in place, in the
 *      simulator and in the harness, when all three hold. (a) Its people
 *      score is lower by ln 1.25 or more. (b) On the dead, rule 19's test on
 *      rule 11's held-out tolls on the browser's ground, with room: its
 *      mean absolute log bias over the three magnitude cells is no more
 *      than the chain in place's plus 0.10, and its band holds eight
 *      records in ten, among the rows with something, in every cell. (c) On
 *      the shaking, rule 18's score on its 370 maps at MMI VII, VIII and IX
 *      on the browser's ground, with both chains' rings taken at 7.0, 8.0
 *      and 9.0 because the maps are summed there, is no more than the chain
 *      in place's plus 0.10. Rows of the net that then leave their band are
 *      ungated with their cause and never re-tuned (rules 5 and 6). Nothing
 *      in either chain is set on any of these sets.
 *  34. Reported, deciding nothing: each chain's central toll against
 *      PAGER's estimate and its fatality alert against PAGER's alert, as
 *      the campaign scored them; the two half-chains — PGA with PAGER's
 *      bands, and PGV with the bands in place — through rules 32 and 33, so
 *      that the report says which half moves what; and rule 28's counts on
 *      rule 23's maps. The report prints them whatever they read.
 *
 * What this cannot settle. PAGER is a model as well: its exposure stands
 * on ShakeMaps and LandScan, and its estimate on curves fitted to that
 * exposure, so agreeing with it is not agreeing with the ground. That is
 * why the dead guard the choice, and why a chain that counts PAGER's
 * people better and its own dead worse does not replace one that does not.
 */

/** A PAGER loss product, as scripts/build-pager-products.ts stores it. */
export interface PagerProduct {
  comcat: string;
  alert: string | null;
  maxMmi: number;
  /** People in PAGER's intensity bins 1 to 10; bin k runs from k − ½ to
   *  k + ½. */
  exposure: readonly number[];
  /** PAGER's empirical fatality estimate. */
  fatalities: number;
}

/** Rule 31: how intensity is drawn, and how its people are banded. */
export interface ShakingChain {
  measure: 'pga' | 'pgv';
  bands: 'rings' | 'pager';
}

/** Rule 31's two chains, and rule 34's two halves of them. */
export const SHAKING_CHAINS = {
  inPlace: { measure: 'pga', bands: 'rings' },
  pager: { measure: 'pgv', bands: 'pager' },
  pgaWithPagerBands: { measure: 'pga', bands: 'pager' },
  pgvWithRings: { measure: 'pgv', bands: 'rings' },
} as const satisfies Readonly<Record<string, ShakingChain>>;

export type ShakingChainName = keyof typeof SHAKING_CHAINS;

/** Rule 32's intensities. */
export const PEOPLE_LEVELS = [7, 8, 9] as const;
export type PeopleLevel = (typeof PEOPLE_LEVELS)[number];

/** Rule 32: added to both counts, and the least either side must count
 *  for a pair to be scored. */
export const PEOPLE_FLOOR = 1_000;
/** Rule 32: the pairs a cell needs to be scored. */
export const PEOPLE_MIN_PAIRS = 5;
/** Rule 33 (a): how much lower PAGER's chain must score. */
export const PEOPLE_MARGIN = Math.log(1.25);
/** Rule 33 (b) and (c): how much worse PAGER's chain may do. */
export const GUARD_TOLERANCE = 0.1;

/** PAGER's people at and above an intensity: its bins from that one up. */
export function pagerPeopleAtLeast(product: PagerProduct, level: PeopleLevel): number {
  return product.exposure.slice(level - 1).reduce((a, b) => a + b, 0);
}

/** Rule 32's score of a pair; null when neither side counts the floor. */
export function peopleScore(model: number, pager: number): number | null {
  if (!(model >= PEOPLE_FLOOR) && !(pager >= PEOPLE_FLOOR)) return null;
  return Math.log((Math.max(model, 0) + PEOPLE_FLOOR) / (Math.max(pager, 0) + PEOPLE_FLOOR));
}

export interface PeoplePair {
  magnitude: number;
  level: PeopleLevel;
  model: number;
  pager: number;
}

export interface PeopleCell {
  level: PeopleLevel;
  sizeBand: string;
  /** Pairs scored: either side at or above the floor. */
  pairs: number;
  /** Mean score; null without pairs. */
  bias: number | null;
}

export function scorePeople(pairs: readonly PeoplePair[]): PeopleCell[] {
  return PEOPLE_LEVELS.flatMap((level) =>
    SIZE_BANDS.earthquake.map((band) => {
      const scores = pairs
        .filter((p) => p.level === level && sizeBandOf('earthquake', p.magnitude) === band.label)
        .map((p) => peopleScore(p.model, p.pager))
        .filter((s): s is number => s !== null);
      return {
        level,
        sizeBand: band.label,
        pairs: scores.length,
        bias: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null,
      };
    })
  );
}

/** Rule 32: a chain's people score, over the cells with enough pairs. */
export function peopleScoreOf(cells: readonly PeopleCell[]): number {
  return meanAbsoluteBias(cells.filter((c) => c.pairs >= PEOPLE_MIN_PAIRS));
}

/** What rule 33 reads of one chain. */
export interface ChainEvidence {
  /** Rule 32. */
  people: number;
  /** Rule 19's cells on rule 11's held-out tolls. */
  tolls: readonly { bias: number | null; inside: number; rows: number }[];
  /** Rule 18's mean absolute bias on its maps. */
  shaking: number;
}

/** Rule 33: whether PAGER's chain replaces the one in place, and which of
 *  its three conditions hold. */
export function adoptPagerChain(
  inPlace: ChainEvidence,
  pager: ChainEvidence
): { adopted: boolean; people: boolean; tolls: boolean; shaking: boolean } {
  const tollBias = (cells: ChainEvidence['tolls']): number =>
    meanAbsoluteBias(cells.map((c) => ({ bias: c.bias === null ? null : Math.log(c.bias) })));
  const people = pager.people <= inPlace.people - PEOPLE_MARGIN;
  const tolls =
    tollBias(pager.tolls) <= tollBias(inPlace.tolls) + GUARD_TOLERANCE &&
    pager.tolls.every((c) => c.rows === 0 || c.inside / c.rows >= 0.8);
  const shaking = pager.shaking <= inPlace.shaking + GUARD_TOLERANCE;
  return { adopted: people && tolls && shaking, people, tolls, shaking };
}
