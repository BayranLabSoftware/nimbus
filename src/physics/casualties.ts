import {
  PAGER_BEST_STOCK,
  PAGER_GLOBAL_MEDIAN,
  PAGER_WORST_STOCK,
  type PagerParameters,
} from './pagerVulnerability.js';
import { distanceForOverpressure } from './events/impact/damageRings.js';
import type { Joules, Meters } from './units.js';
import { EARTH_RADIUS, TNT_SPECIFIC_ENERGY } from './constants.js';
import { m, Pa } from './units.js';

/**
 * Casualty estimates — people, not just exposure.
 *
 * The simulator used to stop at "population inside the headline
 * ring" on purpose: a death toll printed to the person conceals the
 * factor-of-several scatter every vulnerability model carries. This
 * module makes the conversion anyway, because the number a reader
 * needs from a catastrophe simulator is "how many people", and does
 * it the only honest way: with published, cited vulnerability
 * functions, a stated low–high band, and the assumptions on the
 * label — prompt effects only, nobody evacuated, no fallout, famine,
 * disease or tsunami. Every function here is pure; the population
 * inside each band comes from the caller (WorldPop, see
 * `src/scene/populationLookup.ts`).
 *
 * Three hazard families, three sources:
 *
 *   BLAST (impacts, explosions) — U.S. Office of Technology Assessment
 *   (1979), *The Effects of Nuclear War*, OTA-NS-89, ch. II, table 2:
 *   the Hiroshima/Nagasaki-derived mortality by peak overpressure
 *   that every civil-defence planning study since has reused.
 *     ≥ 12 psi  98 % dead,  2 % injured
 *     5–12 psi  50 % dead, 40 % injured
 *     2–5 psi    5 % dead, 45 % injured
 *     1–2 psi    0 % dead, 25 % injured
 *   The bands are the prompt blast + collapse count of the two cities.
 *   The 12 and 2 psi radii are not drawn on the globe; they are
 *   derived from the drawn 5 and 1 psi contours with the Kinney–Graham
 *   curve ratio at the event's yield, so the bands stay consistent
 *   with what the map shows.
 *
 *   BURNS — Glasstone & Dolan (1977), *The Effects of Nuclear Weapons*,
 *   ch. XII: third-degree burns over a large part of the body are
 *   fatal without prompt care, and only the people with a line of
 *   sight to the fireball — outdoors, at a window — receive them; an
 *   urban population indoors is mostly shielded. Inside the drawn
 *   third-degree radius the exposed fraction times the burn mortality
 *   is applied to the people the blast left alive; inside the
 *   second-degree radius the exposed survivors count as injured.
 *
 *   MASS FIRE — where the thermal fluence sustains a firestorm
 *   (Glasstone & Dolan ch. VII: Hiroshima's began twenty minutes after
 *   the burst), the survivors inside it face the Hamburg and Dresden
 *   record at the low end and the near-total mortality Postol (1986)
 *   argued for a nuclear superfire at the high end.
 *
 *   LATER DEATHS — OTA 1979 counts the injured but expects most of the
 *   seriously injured to die for lack of care: two thousand burn beds
 *   in the whole country against hundreds of thousands of burn
 *   casualties. A share of the prompt injured dies within the first
 *   weeks; it is counted, dated and shown apart from the prompt toll.
 *
 *   The hazards of one annulus act in sequence on the people the
 *   previous ones left alive, so nobody dies twice: the combined
 *   mortality is 1 − Π(1 − m).
 *
 *   SHAKING (earthquakes) — Jaiswal & Wald (2010), *An empirical model
 *   for global earthquake fatality estimation*, Earthquake Spectra
 *   26(4), 1017–1037 — the USGS PAGER model. Fatality rate as a
 *   function of shaking intensity S: ν(S) = Φ(ln(S/θ) / β), with
 *   country-specific θ and β fitted on 1973–2007 events. We are not a
 *   country: the central estimate uses an average-stock pair and the
 *   band spans the published national fits, from the best-engineered
 *   stocks (θ ≈ 14.5, narrow β: a few deaths per million at MMI VIII)
 *   to unreinforced masonry (θ ≈ 11.5, wide β: tens of per cent at
 *   IX) — three orders of magnitude, which is the truth of the
 *   matter. Applied to the MMI ≥ VII, ≥ VIII and ≥ IX annuli at their
 *   mid-band intensity.
 *
 *   PYROCLASTIC (volcanoes) — Auker, Sparks, Siebert, Crosweller &
 *   Ewert (2013), *A statistical analysis of the global historical
 *   volcanic fatalities record*, J. Applied Volcanology 2:2: pyroclastic
 *   density currents are the deadliest volcanic hazard on record, and
 *   people caught inside one almost never survive (Saint-Pierre 1902,
 *   Pompeii, Merapi 2010). Mortality inside the runout without
 *   evacuation is taken as 90 %; a lateral blast counts the same
 *   inside its sector. Ashfall at the 1 mm isopach kills nobody.
 *
 *   TSUNAMI — not converted. Counting people in a run-up field needs
 *   a coastal DEM and an inundation model; the globe shows where the
 *   wave lands, the label says the toll is not in the number.
 */

/** One annulus of the casualty model. `outerRadiusM` is what the
 *  caller queries the population for; the population INSIDE the band
 *  is the difference of successive cumulative counts. */
/** A hazard acting inside an annulus. */
export type CasualtyHazard =
  | 'blast'
  | 'thermal'
  | 'firestorm'
  | 'delayed'
  | 'shaking'
  | 'pyroclastic'
  | 'lateralBlast'
  | 'tsunami';

/** A low / central / high triple for a vulnerability parameter. */
export interface Triple {
  low: number;
  mid: number;
  high: number;
}

/** One hazard of a band, acting on the people the earlier ones left
 *  alive. */
export interface HazardComponent {
  hazard: CasualtyHazard;
  /** Mortality among the survivors of the earlier components (0–1). */
  mortality: number;
  mortalityLow: number;
  mortalityHigh: number;
  /** Prompt-injury rate as a fraction of the band population (OTA's
   *  convention: deaths + injured ≤ 100 % of the band). */
  injuryRate?: number;
  /** Prompt-injury rate as a fraction of the survivors not yet
   *  injured (the burns convention). */
  survivorInjuryRate?: number;
}

export interface CasualtyBand {
  /** Stable, unique key. For single-hazard models it is also the
   *  i18n suffix (`casualties.band.<key>`). */
  key: string;
  innerRadiusM: number;
  outerRadiusM: number;
  /** OTA overpressure class of the annulus, for the label. */
  psiBand?: 'blast12psi' | 'blast5psi' | 'blast2psi' | 'blast1psi';
  /** The hazards acting here, in the order they act. Absent for the
   *  single-hazard models, whose `mortality` is the whole story. */
  components?: HazardComponent[];
  /** Share of the prompt injured who die within weeks for lack of
   *  care, with its band. */
  delayedFraction?: Triple;
  /** Optional footprint replacing the circle of `outerRadiusM` — the
   *  rupture stadium of an extended earthquake source, whose MMI
   *  contours hug a 500 km fault rather than a point. Cumulative
   *  semantics are unchanged: the annulus is the difference of
   *  successive footprints. */
  polygon?: readonly { latDeg: number; lonDeg: number }[];
  /** Central mortality inside the band (0–1). */
  mortality: number;
  /** Low / high mortality for the uncertainty band (0–1). */
  mortalityLow: number;
  mortalityHigh: number;
  /** Prompt-injury rate inside the band, when the source gives one. */
  injuryRate?: number;
}

export interface CasualtyPlan {
  /** 'blast' | 'shaking' | 'pyroclastic' — which source the bands come
   *  from; an estimate made of the coastal toll alone is 'tsunami'. */
  model: 'blast' | 'shaking' | 'pyroclastic' | 'tsunami';
  /** Blast plans only: the bands were the conventional ones, not
   *  OTA's nuclear pair. */
  conventional?: boolean;
  /** Annuli, inner to outer, contiguous. */
  bands: CasualtyBand[];
}

/** Combine mortalities acting in sequence on the survivors of one
 *  another: 1 − Π(1 − m). */
export function combineMortality(rates: readonly number[]): number {
  if (rates.length === 1) return Math.min(1, Math.max(0, rates[0] ?? 0));
  let alive = 1;
  for (const m of rates) alive *= 1 - Math.min(1, Math.max(0, m));
  return 1 - alive;
}

// ---------------------------------------------------------------------
// Blast — OTA 1979
// ---------------------------------------------------------------------

const PSI = 6_894.757;

/** OTA-NS-89 ch. II table 2 — mortality / injury by overpressure band. */
export const OTA_BLAST_BANDS = [
  { key: 'blast12psi', minPsi: 12, mortality: 0.98, injury: 0.02 },
  { key: 'blast5psi', minPsi: 5, mortality: 0.5, injury: 0.4 },
  { key: 'blast2psi', minPsi: 2, mortality: 0.05, injury: 0.45 },
  { key: 'blast1psi', minPsi: 1, mortality: 0, injury: 0.25 },
] as const;

/** Scatter on the OTA rates: the Hiroshima/Nagasaki mortality at a
 *  given overpressure spans roughly a factor 2 between studies
 *  (Glasstone & Dolan 1977 ch. XII). */
const BLAST_BAND_FACTOR = 2;

/**
 * Mortality by overpressure for a CONVENTIONAL detonation.
 *
 * OTA's bands are Hiroshima and Nagasaki: a nuclear flash through
 * cities of light timber, where the shock broke the houses and the
 * flash then burned them, and half the people at five psi died. None
 * of that describes a warehouse of ammonium nitrate going off in a
 * city of reinforced concrete, and using OTA there put Beirut 2020 at
 * fifty times the 218 who were killed.
 *
 * What is left when the flash is taken away is the shock itself and
 * what it brings down, and the two have very different thresholds.
 * Direct overpressure barely touches a person below the pressures
 * that damage lungs — Glasstone & Dolan 1977 §12.44 put the threshold
 * of lung injury near 8-12 psi, the threshold of lethality near
 * 20-30 psi and fifty per cent near 30-50 psi — so at the five psi
 * where OTA kills half the population, the blast wave alone kills
 * almost nobody. The dead are under the buildings: collapse and
 * flying debris, with the share of occupants who die in a collapsed
 * structure running in the tens of per cent and the share of
 * buildings that collapse falling steeply with distance.
 *
 * These rates carry the two mechanisms together and are the widest in
 * this module for the reason that the record behind them is thin:
 * a factor of three either way, against OTA's factor of two.
 */
export const CONVENTIONAL_BLAST_BANDS = [
  { key: 'blast12psi', minPsi: 12, mortality: 0.2, injury: 0.4 },
  { key: 'blast5psi', minPsi: 5, mortality: 0.03, injury: 0.45 },
  { key: 'blast2psi', minPsi: 2, mortality: 0.005, injury: 0.35 },
  { key: 'blast1psi', minPsi: 1, mortality: 0.0005, injury: 0.2 },
] as const;

/** The conventional rates are a composition, not a fit: three either
 *  way, wider than OTA's two. */
const CONVENTIONAL_BAND_FACTOR = 3;

/**
 * Later deaths after a conventional explosion.
 *
 * OTA's thirty per cent of the injured is not a fact about wounds, it
 * is a fact about a country under nuclear attack: two thousand burn
 * beds against hundreds of thousands of casualties, and no hospital
 * left standing to take them. A warehouse detonating in a port leaves
 * the city's medicine intact and brings the world's in behind it, so
 * what remains is the share of the seriously injured who die despite
 * treatment — a few per cent, and the band spans an order of
 * magnitude because that share depends entirely on where it happens.
 */
export const CONVENTIONAL_DELAYED_FRACTION: Triple = { low: 0.005, mid: 0.02, high: 0.06 };

/**
 * Radius of the luminous fireball of a cosmic impact (m) for its
 * kinetic energy: R_f = 0.002 · E^(1/3), Collins, Melosh & Marcus
 * (2005) eq. 12 — the scaling the Earth Impact Effects Program uses.
 * A 15 km stone at 20 km/s makes one about 200 km across.
 */
export function impactFireballRadius(energy: Joules): Meters {
  const e = energy as number;
  return m(e > 0 ? 0.002 * e ** (1 / 3) : 0);
}

/**
 * Radius of the luminous fireball of a nuclear burst (m) for its
 * yield: R_f ≈ 55 · W^0.4 with W in kilotonnes, the maximum-brilliance
 * size of Glasstone & Dolan (1977) §2.120 fig. 2.120. A 15 kt burst
 * makes one 160 m across; even a 50 Mt one stays inside 5 km.
 */
export function nuclearFireballRadius(yieldEnergy: Joules): Meters {
  const kt = (yieldEnergy as number) / (TNT_SPECIFIC_ENERGY * 1e6);
  return m(kt > 0 ? 55 * kt ** 0.4 : 0);
}

/**
 * Ground range (m) beyond which the fireball has set below the
 * horizon, and its light no longer reaches anyone.
 *
 *     d = R⊕ · arccos( R⊕ / (R⊕ + R_f) )
 *
 * Thermal radiation travels in straight lines. The Earth Impact
 * Effects Program (Collins et al. 2005) makes the same cut: past this
 * range the fireball is under the curve of the Earth and the direct
 * flash — the burns, the ignition of a mass fire — cannot arrive.
 * A 200 km fireball, the one a Chicxulub-class impact raises, is
 * visible to about 1 600 km; a nuclear fireball to a few tens.
 *
 * The heat that does reach the far side of the planet after an impact
 * this size comes from rock thrown out on ballistic arcs and
 * re-entering everywhere at once — a diffuse infrared bath over
 * minutes, described in the event's cascade and cited there, whose
 * lethality depends on shelter rather than on line of sight. It is
 * not the same hazard as a fireball's flash and this model does not
 * count deaths from it: Goldin & Melosh (2009) argue the ejecta
 * shield their own radiation enough to make the global firestorm a
 * fizzle rather than a certainty, and a toll built on the fireball's
 * mortality would be a number with the wrong physics behind it.
 */
export function thermalHorizonRadius(fireballRadius: Meters): number {
  const rf = fireballRadius as number;
  if (!Number.isFinite(rf) || rf <= 0) return Number.POSITIVE_INFINITY;
  const re = EARTH_RADIUS as number;
  return re * Math.acos(Math.min(1, re / (re + rf)));
}

/** Fraction of the people with a line of sight to the fireball —
 *  outdoors or at a window — who receive the full thermal pulse. An
 *  urban population indoors is mostly shielded (Glasstone & Dolan
 *  1977 §12.68 on Hiroshima's exposed morning crowd). */
export const THERMAL_EXPOSED_FRACTION: Triple = { low: 0.1, mid: 0.25, high: 0.5 };

/** Mortality of the exposed inside the third-degree radius without
 *  prompt care (Glasstone & Dolan 1977 §12.51–12.68: extensive
 *  full-thickness burns are fatal untreated). */
export const THIRD_DEGREE_MORTALITY: Triple = { low: 0.3, mid: 0.5, high: 0.8 };

/** Mortality of the blast and burn survivors inside a sustained mass
 *  fire: the Hamburg 1943 and Dresden 1945 record at the low end,
 *  Hiroshima in the middle, the near-total mortality of a nuclear
 *  superfire (Postol 1986) at the high end. */
export const FIRESTORM_MORTALITY: Triple = { low: 0.1, mid: 0.3, high: 0.8 };

/** Share of the prompt injured who die within the first weeks for
 *  lack of care (OTA 1979 ch. II: the seriously injured, the burn
 *  cases above all, outnumber the beds by orders of magnitude). */
export const DELAYED_DEATH_FRACTION: Triple = { low: 0.1, mid: 0.3, high: 0.6 };

export interface BlastCasualtyInput {
  /** Energy driving the air blast (J): explosion yield, or the
   *  impact's blast-coupled kinetic energy. Used only for the
   *  Kinney–Graham radius ratios. */
  blastEnergy: Joules;
  /** 5 psi radius as drawn on the globe (m). */
  overpressure5psiRadius: Meters;
  /** 1 psi radius as drawn on the globe (m). */
  overpressure1psiRadius: Meters;
  /** Third-degree burn radius as drawn (m); omit for no burns. */
  thirdDegreeBurnRadius?: Meters;
  /** Second-degree burn radius as drawn (m); omit for no burn injuries. */
  secondDegreeBurnRadius?: Meters;
  /** Radius inside which the fluence sustains a firestorm (m); omit
   *  or pass 0 for no mass fire. */
  firestormRadius?: Meters;
  /** Luminous fireball radius (m). When given, the burn and mass-fire
   *  radii are cut at the range where the fireball sets below the
   *  horizon: past it the flash never arrives. See
   *  {@link thermalHorizonRadius}. */
  fireballRadius?: Meters;
  /** 'chemical' swaps OTA's nuclear bands for
   *  {@link CONVENTIONAL_BLAST_BANDS}. Defaults to nuclear, which is
   *  what an impact's air shock resembles. */
  chargeType?: 'nuclear' | 'chemical';
}

/**
 * Ratio r(P)/r(P_ref) on the Kinney–Graham surface-burst curve at the
 * given yield. Falls back to the far-field scaling (Δp ∝ r^−1.3 ⇒
 * r ∝ Δp^−0.77) when the inversion cannot bracket the target.
 */
function overpressureRadiusRatio(energy: Joules, psi: number, refPsi: number): number {
  try {
    const r = distanceForOverpressure(energy, Pa(psi * PSI)) as number;
    const ref = distanceForOverpressure(energy, Pa(refPsi * PSI)) as number;
    if (Number.isFinite(r) && Number.isFinite(ref) && ref > 0 && r > 0) return r / ref;
  } catch {
    // fall through to the scaling law
  }
  return (psi / refPsi) ** (-1 / 1.3);
}

/** Half the circumference of the Earth (m): a ring of this radius is
 *  the whole planet, and no band needs to reach farther. */
export const WHOLE_PLANET_RADIUS_M = Math.PI * 6_371_000;

function positiveRadius(value: Meters | undefined): number {
  const r = value as number | undefined;
  return r !== undefined && Number.isFinite(r) && r > 0 ? Math.min(r, WHOLE_PLANET_RADIUS_M) : 0;
}

/**
 * Blast casualty plan: the four OTA overpressure bands anchored on the
 * drawn rings, split further wherever the third-degree, second-degree
 * and firestorm radii fall, so every annulus carries exactly the
 * hazards that reach it. Beyond the 1 psi ring only the burns remain.
 * Each annulus applies its hazards in sequence — blast, burns, fire —
 * to the people the previous ones left alive, and dates a share of
 * its injured as later deaths.
 */
export function blastCasualtyPlan(input: BlastCasualtyInput): CasualtyPlan | null {
  const r5 = positiveRadius(input.overpressure5psiRadius);
  const r1 = positiveRadius(input.overpressure1psiRadius);
  if (r5 <= 0 || r1 <= r5) return null;
  const r12 = r5 * overpressureRadiusRatio(input.blastEnergy, 12, 5);
  const r2 = r1 * overpressureRadiusRatio(input.blastEnergy, 2, 1);
  const psiEdges = [0, Math.min(r12, r5), r5, Math.max(r5, Math.min(r2, r1)), r1];
  // Line of sight first: a fluence radius says how much heat would
  // arrive with nothing in the way, and for an impact-scale fireball
  // it runs right around the planet. The horizon is what actually
  // limits it.
  const horizon =
    input.fireballRadius === undefined
      ? Number.POSITIVE_INFINITY
      : thermalHorizonRadius(input.fireballRadius);
  const seen = (radius: Meters | undefined): number => Math.min(positiveRadius(radius), horizon);
  const burn3 = seen(input.thirdDegreeBurnRadius);
  const burn2 = Math.max(burn3, seen(input.secondDegreeBurnRadius));
  const fire = seen(input.firestormRadius);

  const edges = [...new Set([...psiEdges, burn3, burn2, fire].filter((r) => r >= 0))].sort(
    (a, b) => a - b
  );
  const psiClassAt = (r: number): number => {
    // Index into OTA_BLAST_BANDS of the annulus containing radius r,
    // or -1 beyond the 1 psi ring.
    for (let i = 0; i < OTA_BLAST_BANDS.length; i++) {
      const lo = psiEdges[i] ?? 0;
      const hi = psiEdges[i + 1] ?? 0;
      if (r >= lo && r < hi) return i;
    }
    return -1;
  };

  const bands: CasualtyBand[] = [];
  for (let i = 0; i + 1 < edges.length; i++) {
    const inner = edges[i] ?? 0;
    const outer = edges[i + 1] ?? 0;
    if (!(outer > inner)) continue;
    const mid = 0.5 * (inner + outer);
    const components: HazardComponent[] = [];
    const psi = psiClassAt(mid);
    const chemical = input.chargeType === 'chemical';
    const table = chemical ? CONVENTIONAL_BLAST_BANDS : OTA_BLAST_BANDS;
    const factor = chemical ? CONVENTIONAL_BAND_FACTOR : BLAST_BAND_FACTOR;
    const ota = psi >= 0 ? table[psi] : undefined;
    if (ota !== undefined) {
      components.push({
        hazard: 'blast',
        mortality: ota.mortality,
        mortalityLow: ota.mortality / factor,
        mortalityHigh: Math.min(1, ota.mortality * factor),
        injuryRate: ota.injury,
      });
    }
    // A chemical detonation has no thermal pulse worth the name: a
    // nuclear burst radiates about a third of its energy, an
    // explosive a few per cent of it, and for milliseconds rather
    // than seconds. No flash, no burns, and nothing to start a mass
    // fire from the air. Applying the nuclear thermal model to the
    // Beirut port was most of a factor of forty.
    if (chemical) {
      // nothing radiative
    } else if (mid < burn3) {
      components.push({
        hazard: 'thermal',
        mortality: THERMAL_EXPOSED_FRACTION.mid * THIRD_DEGREE_MORTALITY.mid,
        mortalityLow: THERMAL_EXPOSED_FRACTION.low * THIRD_DEGREE_MORTALITY.low,
        mortalityHigh: THERMAL_EXPOSED_FRACTION.high * THIRD_DEGREE_MORTALITY.high,
        // The exposed who survive their burns are injured.
        survivorInjuryRate: THERMAL_EXPOSED_FRACTION.mid,
      });
    } else if (mid < burn2) {
      components.push({
        hazard: 'thermal',
        mortality: 0,
        mortalityLow: 0,
        mortalityHigh: 0,
        survivorInjuryRate: THERMAL_EXPOSED_FRACTION.mid,
      });
    }
    if (!chemical && mid < fire) {
      components.push({
        hazard: 'firestorm',
        mortality: FIRESTORM_MORTALITY.mid,
        mortalityLow: FIRESTORM_MORTALITY.low,
        mortalityHigh: FIRESTORM_MORTALITY.high,
      });
    }
    if (components.length === 0) continue;
    const injuryRate = components.reduce((acc, c) => acc + (c.injuryRate ?? 0), 0);
    bands.push({
      key: `b${bands.length.toString()}`,
      innerRadiusM: inner,
      outerRadiusM: outer,
      ...(ota !== undefined && { psiBand: ota.key }),
      components,
      mortality: combineMortality(components.map((c) => c.mortality)),
      mortalityLow: combineMortality(components.map((c) => c.mortalityLow)),
      mortalityHigh: combineMortality(components.map((c) => c.mortalityHigh)),
      ...(injuryRate > 0 && { injuryRate }),
      delayedFraction: chemical ? CONVENTIONAL_DELAYED_FRACTION : DELAYED_DEATH_FRACTION,
    });
  }
  return bands.length > 0
    ? { model: 'blast', bands, conventional: input.chargeType === 'chemical' }
    : null;
}

// ---------------------------------------------------------------------
// Shaking — PAGER (Jaiswal & Wald 2010)
// ---------------------------------------------------------------------

/** Standard normal CDF, Abramowitz & Stegun 7.1.26 (|ε| < 1.5 × 10⁻⁷). */
export function normalCdf(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const poly =
    t *
    (0.31938153 + t * (-0.356563782 + t * (1.781477937 + t * (-1.821255978 + t * 1.330274429))));
  const density = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
  const upper = 1 - density * poly;
  return x >= 0 ? upper : 1 - upper;
}

/**
 * The default when no country is known: the median of the 252 fitted
 * countries in the middle, the best and worst building stocks in the
 * table as the band.
 *
 * It used to be three numbers chosen to look like the published
 * spread — θ 14.5 / 13.5 / 11.5 — and the middle one read Northridge
 * 1994 at 12 546 dead against 57. That factor of 220 was two errors
 * multiplied: 13.5 was six times deadlier at MMI VII–VIII than the
 * table's real median, and having no country at all costs another
 * forty in the United States, whose fitted curve is θ = 46.2. Both
 * are now taken from PAGER's own table rather than approximated. See
 * `pagerVulnerability.ts`; these three are what is left for a place
 * the city index cannot name.
 */
export const PAGER_VULNERABILITY = {
  low: PAGER_BEST_STOCK,
  mid: PAGER_GLOBAL_MEDIAN,
  high: PAGER_WORST_STOCK,
} as const satisfies Record<'low' | 'mid' | 'high', PagerParameters>;

/** ν(S) = Φ(ln(S/θ)/β) — fatality rate at shaking intensity S. */
export function pagerFatalityRate(mmi: number, params: PagerParameters): number {
  if (!Number.isFinite(mmi) || mmi <= 0) return 0;
  return Math.min(1, Math.max(0, normalCdf(Math.log(mmi / params.theta) / params.beta)));
}

export interface ShakingCasualtyInput {
  mmi7Radius: Meters;
  mmi8Radius: Meters;
  mmi9Radius: Meters;
}

/** Shaking casualty plan: the ≥ IX, VIII–IX and VII–VIII annuli at
 *  their mid-band intensity (9.5, 8.5, 7.5). */
export function shakingCasualtyPlan(
  input: ShakingCasualtyInput,
  vulnerability: {
    low: PagerParameters;
    mid: PagerParameters;
    high: PagerParameters;
  } = PAGER_VULNERABILITY
): CasualtyPlan | null {
  const r7 = input.mmi7Radius as number;
  const r8 = input.mmi8Radius as number;
  const r9 = input.mmi9Radius as number;
  if (![r7, r8, r9].every((r) => Number.isFinite(r) && r >= 0)) return null;
  if (r7 <= 0) return null;
  const rings: { key: string; inner: number; outer: number; mmi: number }[] = [
    { key: 'mmi9', inner: 0, outer: r9, mmi: 9.5 },
    { key: 'mmi8', inner: r9, outer: Math.max(r9, r8), mmi: 8.5 },
    { key: 'mmi7', inner: Math.max(r9, r8), outer: Math.max(r9, r8, r7), mmi: 7.5 },
  ];
  const bands: CasualtyBand[] = rings
    .filter((r) => r.outer > r.inner)
    .map((r) => ({
      key: r.key,
      innerRadiusM: r.inner,
      outerRadiusM: r.outer,
      mortality: pagerFatalityRate(r.mmi, vulnerability.mid),
      mortalityLow: pagerFatalityRate(r.mmi, vulnerability.low),
      mortalityHigh: pagerFatalityRate(r.mmi, vulnerability.high),
    }));
  if (bands.length === 0) return null;
  return { model: 'shaking', bands };
}

// ---------------------------------------------------------------------
// Pyroclastic — Auker et al. 2013
// ---------------------------------------------------------------------

/** Mortality inside a pyroclastic density current without evacuation. */
export const PYROCLASTIC_MORTALITY = 0.9;

/**
 * The low end of a pyroclastic band is not a gentler current. It is
 * an empty one.
 *
 * People caught inside a density current almost never survive, which
 * is why the central figure is Auker's ninety per cent. But a volcano
 * gives days of warning where an impact gives none, and a modern
 * eruption is usually evacuated: Pinatubo moved sixty thousand people
 * out before the climax and lost nobody to the currents, Merapi 2010
 * evacuated three hundred and fifty thousand and lost 353 — about one
 * in a thousand of those at risk, the ones who would not leave or who
 * went back. Unzen 1991 killed forty-three, most of them journalists
 * and scientists who had stayed to watch.
 *
 * So the band is asymmetric on purpose, and it says the only thing
 * worth saying about a pyroclastic current: if they left, almost
 * nobody; if they did not, almost everybody. One per cent is the
 * Merapi ratio rounded up, and the simulator cannot know which of the
 * two worlds it is in, because it does not know whether anyone told
 * them to go.
 */
export const PYROCLASTIC_MORTALITY_EVACUATED = 0.01;

export interface PyroclasticCasualtyInput {
  pyroclasticRunout: Meters;
  /** Lateral-blast runout (m) and sector width (°), when the eruption
   *  has one. The blast is a wedge: its annulus beyond the pyroclastic
   *  disc is weighted by sector/360. */
  lateralBlastRunout?: Meters;
  lateralBlastSectorDeg?: number;
}

export function pyroclasticCasualtyPlan(input: PyroclasticCasualtyInput): CasualtyPlan | null {
  const runout = input.pyroclasticRunout as number;
  const bands: CasualtyBand[] = [];
  if (Number.isFinite(runout) && runout > 0) {
    bands.push({
      key: 'pyroclastic',
      innerRadiusM: 0,
      outerRadiusM: runout,
      mortality: PYROCLASTIC_MORTALITY,
      mortalityLow: PYROCLASTIC_MORTALITY_EVACUATED,
      mortalityHigh: 1,
    });
  }
  const blast = input.lateralBlastRunout as number | undefined;
  const sector = input.lateralBlastSectorDeg ?? 0;
  if (blast !== undefined && Number.isFinite(blast) && blast > Math.max(0, runout) && sector > 0) {
    const weight = Math.min(1, Math.max(0, sector / 360));
    bands.push({
      key: 'lateralBlast',
      innerRadiusM: Math.max(0, runout),
      outerRadiusM: blast,
      mortality: PYROCLASTIC_MORTALITY * weight,
      mortalityLow: PYROCLASTIC_MORTALITY_EVACUATED * weight,
      mortalityHigh: weight,
    });
  }
  if (bands.length === 0) return null;
  return { model: 'pyroclastic', bands };
}

// ---------------------------------------------------------------------
// Evaluation
// ---------------------------------------------------------------------

export interface HazardDeaths {
  hazard: CasualtyHazard;
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
}

export interface BandEstimate {
  key: string;
  innerRadiusM: number;
  outerRadiusM: number;
  /** OTA overpressure class, when the band has one. */
  psiBand?: 'blast12psi' | 'blast5psi' | 'blast2psi' | 'blast1psi';
  /** The hazards acting in the band, in order. */
  hazards: CasualtyHazard[];
  /** For a toll dated rather than placed — the coastal toll of a
   *  tsunami, binned by arrival — the window (s) it falls in; the
   *  radii are then meaningless. */
  window?: { startS: number; endS: number };
  /** People inside the annulus. */
  population: number;
  /** Share of them who die of the event, prompt and delayed together
   *  (0–1), so that `mortality × population = deaths` and a reader can
   *  reconcile the row. */
  mortality: number;
  /** The immediate share alone (0–1), for callers that want it. */
  promptMortality: number;
  /** Prompt plus later deaths. */
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  promptDeaths: number;
  delayedDeaths: number;
  /** Prompt injuries. */
  injured: number;
  /** Deaths by hazard, later deaths under 'delayed'. */
  byHazard: HazardDeaths[];
}

export interface CasualtyEstimate {
  model: CasualtyPlan['model'];
  /** People inside the outermost band. */
  exposed: number;
  /** Prompt plus later deaths — the headline. */
  deaths: number;
  deathsLow: number;
  deathsHigh: number;
  /** Deaths within the event itself. */
  promptDeaths: number;
  /** Deaths within the first weeks, among the injured, for lack of care. */
  delayedDeaths: number;
  delayedDeathsLow: number;
  delayedDeathsHigh: number;
  /** Prompt injuries (0 for the models without an injury rate). */
  injured: number;
  /** True when the blast bands were the conventional ones rather than
   *  OTA's nuclear pair — the label has to say which. */
  conventional?: boolean;
  /** True when `deathsLow`/`deathsHigh` are the fifth and ninety-fifth
   *  percentiles of the toll under the published input scatter, rather
   *  than the gentlest and harshest settings of the vulnerability
   *  table. The two mean different things and the panel says which it
   *  is showing. See `uq/tollBand.ts`. */
  predictiveBand?: boolean;
  /** The coastal toll of the tsunami, when the wave map reached a
   *  coast; part of `deaths`. */
  tsunamiDeaths?: number;
  tsunamiDeathsLow?: number;
  tsunamiDeathsHigh?: number;
  bands: BandEstimate[];
}

/** The single-hazard models carry their hazard in the model or the key. */
function hazardOf(plan: CasualtyPlan, band: CasualtyBand): CasualtyHazard {
  if (plan.model === 'tsunami') return 'tsunami';
  if (plan.model === 'shaking') return 'shaking';
  if (plan.model === 'pyroclastic')
    return band.key === 'lateralBlast' ? 'lateralBlast' : 'pyroclastic';
  return 'blast';
}

/**
 * Turn a plan plus the CUMULATIVE population inside each band's outer
 * radius (same order as `plan.bands`) into an estimate. Cumulative
 * counts are what a circle query returns; the annulus population is
 * the difference, clamped at zero against raster noise. A band's
 * hazards act in sequence on the people the earlier ones left alive;
 * a share of the injured is dated as later deaths.
 */
export function estimateCasualties(
  plan: CasualtyPlan,
  cumulativePopulation: readonly number[]
): CasualtyEstimate {
  const bands: BandEstimate[] = [];
  let previous = 0;
  const totals = {
    deaths: 0,
    deathsLow: 0,
    deathsHigh: 0,
    promptDeaths: 0,
    delayedDeaths: 0,
    delayedDeathsLow: 0,
    delayedDeathsHigh: 0,
    injured: 0,
  };
  plan.bands.forEach((band, i) => {
    const cumulative = Math.max(previous, cumulativePopulation[i] ?? previous);
    const population = Math.max(0, cumulative - previous);
    previous = cumulative;

    const components: HazardComponent[] = band.components ?? [
      {
        hazard: hazardOf(plan, band),
        mortality: band.mortality,
        mortalityLow: band.mortalityLow,
        mortalityHigh: band.mortalityHigh,
        ...(band.injuryRate !== undefined && { injuryRate: band.injuryRate }),
      },
    ];
    const byHazard: HazardDeaths[] = [];
    let alive = population;
    let aliveLow = population;
    let aliveHigh = population;
    let injured = 0;
    for (const c of components) {
      const d = alive * c.mortality;
      const dl = aliveLow * c.mortalityLow;
      const dh = aliveHigh * c.mortalityHigh;
      alive -= d;
      aliveLow -= dl;
      aliveHigh -= dh;
      injured += population * (c.injuryRate ?? 0);
      if (c.survivorInjuryRate !== undefined) {
        injured += Math.max(0, alive - injured) * c.survivorInjuryRate;
      }
      byHazard.push({ hazard: c.hazard, deaths: d, deathsLow: dl, deathsHigh: dh });
    }
    injured = Math.min(injured, Math.max(0, alive));
    const promptDeaths = population - alive;
    const promptLow = population - aliveLow;
    const promptHigh = population - aliveHigh;
    const delayed = band.delayedFraction;
    const delayedDeaths = delayed === undefined ? 0 : injured * delayed.mid;
    const delayedLow = delayed === undefined ? 0 : injured * delayed.low;
    const delayedHigh = delayed === undefined ? 0 : injured * delayed.high;
    if (delayed !== undefined && injured > 0) {
      byHazard.push({
        hazard: 'delayed',
        deaths: delayedDeaths,
        deathsLow: delayedLow,
        deathsHigh: delayedHigh,
      });
    }

    totals.promptDeaths += promptDeaths;
    totals.delayedDeaths += delayedDeaths;
    totals.delayedDeathsLow += delayedLow;
    totals.delayedDeathsHigh += delayedHigh;
    totals.deaths += promptDeaths + delayedDeaths;
    totals.deathsLow += promptLow + delayedLow;
    totals.deathsHigh += promptHigh + delayedHigh;
    totals.injured += injured;
    bands.push({
      key: band.key,
      innerRadiusM: band.innerRadiusM,
      outerRadiusM: band.outerRadiusM,
      ...(band.psiBand !== undefined && { psiBand: band.psiBand }),
      hazards: byHazard.map((h) => h.hazard),
      population: Math.round(population),
      // The share of the people in this annulus who die of it — all
      // of them, not only the ones killed in the first minutes.
      //
      // This used to be prompt deaths over population while `deaths`
      // carried prompt plus delayed, so the two columns could not be
      // reconciled by anyone reading the table: the outermost ring of
      // a large impact printed "0 % mortality, 2 000 000 dead", both
      // numbers right and the pair impossible. Mortality is now the
      // total, and `promptMortality` carries the immediate share for
      // callers that want the split.
      mortality: population > 0 ? (promptDeaths + delayedDeaths) / population : band.mortality,
      promptMortality: population > 0 ? promptDeaths / population : band.mortality,
      deaths: Math.round(promptDeaths + delayedDeaths),
      deathsLow: Math.round(promptLow + delayedLow),
      deathsHigh: Math.round(promptHigh + delayedHigh),
      promptDeaths: Math.round(promptDeaths),
      delayedDeaths: Math.round(delayedDeaths),
      injured: Math.round(injured),
      byHazard: byHazard.map((h) => ({
        hazard: h.hazard,
        deaths: Math.round(h.deaths),
        deathsLow: Math.round(h.deathsLow),
        deathsHigh: Math.round(h.deathsHigh),
      })),
    });
  });
  return {
    model: plan.model,
    ...(plan.conventional === true && { conventional: true }),
    exposed: Math.round(previous),
    deaths: Math.round(totals.deaths),
    deathsLow: Math.round(totals.deathsLow),
    deathsHigh: Math.round(totals.deathsHigh),
    promptDeaths: Math.round(totals.promptDeaths),
    delayedDeaths: Math.round(totals.delayedDeaths),
    delayedDeathsLow: Math.round(totals.delayedDeathsLow),
    delayedDeathsHigh: Math.round(totals.delayedDeathsHigh),
    injured: Math.round(totals.injured),
    bands,
  };
}
