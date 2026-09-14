/**
 * Where the model has been measured, and where it has not.
 *
 * The calibration net — {@link RECORDED_TOLLS}, {@link RECORDED_WAVES}
 * and the historical rows of the golden dataset — checks this
 * simulator against events the world has already performed. There are
 * twenty-one of them, and they are the only places where anyone can say
 * whether an answer is right, because they are the only places anyone
 * measured.
 *
 * A visitor with the custom fields open is not restricted to those
 * twenty-one. They can ask for a two-hundred-kilotonne charge under the
 * Adriatic, a thirty-kilometre stone at eleven kilometres a second, a
 * magnitude nine and a half under Lisbon. The property sweep in
 * `customScenarios.test.ts` shows the laws do not break out there.
 * This module answers the other half of the question: how far out
 * there is it, and which measured event is nearest.
 *
 * Nothing here changes a computed number. The estimate is what it was;
 * this says what is known about it. That distinction is the whole
 * point — a model that is confident everywhere is one a reader stops
 * trusting the first time they check a corner they know.
 *
 * The anchors below are observational: something happened, somebody
 * wrote down what it did. Comparisons against other numerical models
 * (the GeoCLAW fixtures) and against analytic benchmarks (the NOAA
 * rows) are deliberately absent — they say the code solves the
 * equations, not that the equations describe the world.
 */

import type { ImpactScenarioResult } from '../simulate.js';
import type { EarthquakeScenarioResult } from '../events/earthquake/simulate.js';
import type { ExplosionScenarioResult } from '../events/explosion/simulate.js';
import type { LandslideScenarioResult } from '../events/landslide/simulate.js';
import type { VolcanoScenarioResult } from '../events/volcano/simulate.js';

/** The event families the envelope knows how to place. */
export type EnvelopeEventType = 'impact' | 'explosion' | 'earthquake' | 'volcano' | 'landslide';

/**
 * What a recorded event pins down. An event can pin more than one:
 * Hiroshima carries both a death toll and a blast radius, Beirut both
 * a toll and a harbour wave.
 */
export type CalibrationQuantity = 'toll' | 'wave' | 'crater' | 'blast' | 'plume';

/**
 * How the scenario sits against the measured range — for one quantity
 * at a time, because the answer differs by quantity even for a single
 * event. A fifty-megatonne charge is beside Tsar Bomba if you are
 * asking about the wave and three thousand times past Hiroshima if
 * you are asking about the dead.
 */
export type EnvelopeStanding = 'measured' | 'interpolated' | 'extrapolated' | 'unmeasured';

/**
 * The quantity each event family is placed on. Every one of them is a
 * decade scale or is trivially made into one, which is what lets a
 * single comparison serve all five — see {@link decades}.
 *
 * Eruptions are placed on erupted volume rather than on VEI: the
 * index is that volume rounded to a whole decade, and a Pinatubo and
 * a Krakatau that differ by a factor of two are both "VEI 6".
 */
export type EnvelopeAxis = 'energy' | 'magnitude' | 'volume';

export const AXIS_BY_TYPE: Readonly<Record<EnvelopeEventType, EnvelopeAxis>> = {
  impact: 'energy',
  explosion: 'energy',
  earthquake: 'magnitude',
  volcano: 'volume',
  landslide: 'volume',
};

/**
 * How a recorded event bears on the model checked against it.
 *
 * A check the model was built to pass says the fit holds, not that the
 * model is right, and the first thing a reviewer asks of a validation
 * table is which rows are which. Until 14 September 2026 this report
 * did not say: nine of fourteen waves "inside" read as validation,
 * while Storegga, Vaiont and Tōhoku's buoy were the very events their
 * coefficients had been set on.
 *
 * Ordered from the most to the least compromising; where more than one
 * applies, the row carries the first and says the rest.
 */
export type CalibrationRole =
  /** A coefficient, an input or a modelling choice in this repository
   *  was made with this row in view: set so the quantity comes out as
   *  recorded, or chosen because an alternative made the row worse. */
  | 'tuned'
  /** The scenario's input is itself inferred, in the literature, from
   *  the quantity being checked, so agreement is partly by construction. */
  | 'inputInferred'
  /** The published relation the model uses was fitted on data that
   *  include this event, or the "record" is read from a published
   *  relation rather than measured at the event. */
  | 'sameSource'
  /** None of the above, as far as the code and its cited sources show. */
  | 'heldOut'
  /** Not yet established; `how` says what is open. */
  | 'unestablished';

export const CALIBRATION_ROLES: readonly CalibrationRole[] = [
  'tuned',
  'inputInferred',
  'sameSource',
  'heldOut',
  'unestablished',
];

export interface CalibrationUse {
  readonly role: CalibrationRole;
  /** What makes it so, specifically enough for a reader to check: the
   *  coefficient or input and where it is set, or the source and what
   *  its data hold. */
  readonly how: string;
}

export interface CalibrationAnchor {
  /** The event, as it is written in the calibration net. */
  readonly name: string;
  readonly eventType: EnvelopeEventType;
  /** Position on that family's axis: joules, Mw, or cubic metres. */
  readonly value: number;
  /** What was recorded about it. */
  readonly quantities: readonly CalibrationQuantity[];
  /**
   * The quantities for which a test fails the build if the model
   * drifts away from this row. The rest of `quantities` are measured
   * and printed with a written reason, but not enforced.
   *
   * Per quantity, because one event can be both. Hiroshima's 5 psi
   * radius is a golden case and fails the build; its death toll is
   * declared, because the raster counts the 1.2 million living there
   * now and not the 350 000 of 1945, so the model must overshoot and
   * a gate would be dishonest. This used to be a single boolean per
   * event, and on 14 September 2026 the first regenerated validation
   * report showed it wrong for seven of the twenty-one anchors at
   * once — two rows ungated in the toll net still marked gated, and
   * five gated waves, plumes and blast radii marked declared because
   * the same event's toll was.
   */
  readonly gated: readonly CalibrationQuantity[];
  /** Where the number comes from. */
  readonly source: string;
  /** For each quantity in `quantities`, whether the model was set on
   *  it — see {@link CalibrationRole}. */
  readonly use: Readonly<Partial<Record<CalibrationQuantity, CalibrationUse>>>;
}

const KILOTON_J = 4.184e12;
const MEGATON_J = 4.184e15;

/**
 * The twenty-one events the model is measured against, each placed on
 * its family's axis.
 *
 * Impact energies are inferred, not weighed: Chicxulub's is what a
 * 180 km crater implies through the same scaling the simulator uses,
 * and Tunguska's is the geometric centre of the 3–30 Mt the flattened
 * forest allows. Both are quoted the way the literature quotes them.
 */
export const CALIBRATION_ANCHORS: readonly CalibrationAnchor[] = [
  // --- Impacts. Craters and an airburst; no impact in recorded
  //     history has a death toll to check against. -------------------
  {
    name: 'Tunguska 1908',
    eventType: 'impact',
    value: Math.sqrt(3 * 30) * MEGATON_J,
    quantities: ['blast'],
    gated: ['blast'],
    source: 'Boslough & Crawford 2008; Chyba 1993 — 3–30 Mt from the flattened forest',
    use: {
      blast: {
        role: 'tuned',
        how: 'The row checks the energy the preset carries against the 3–30 Mt the flattened forest allows, and two coefficients of the entry model were set on this event: PENETRATION_COEFFICIENT is "tuned against Tunguska + Chelyabinsk observations", and SACHS_BETA = 5/3 is "a single fitted knob, chosen because it lands Chelyabinsk and Tunguska on observation" (effects/atmosphericEntry.ts). The energy itself is inferred from the forest.',
      },
    },
  },
  {
    name: 'Meteor Crater',
    eventType: 'impact',
    value: 10 * MEGATON_J,
    quantities: ['crater'],
    gated: ['crater'],
    source: 'Kring 2007 — a 1.2 km crater from a 50 m iron at 12.8 km/s',
    use: {
      crater: {
        role: 'inputInferred',
        how: "The impactor — Kring 2007's 50 m iron at 12.8 km/s — is not observed: its size and speed are estimates made from the crater itself and from the unmelted fragments around it (Melosh & Collins 2005 give about 40 m at 12 km/s).",
      },
    },
  },
  {
    name: 'Chicxulub',
    eventType: 'impact',
    value: 7.8e23,
    quantities: ['crater'],
    gated: ['crater'],
    source: 'Hildebrand 1991, Morgan 2016 — a final crater of about 180 km',
    use: {
      crater: {
        role: 'inputInferred',
        how: "The impactor's size is not observed. The 10–15 km the literature gives is an estimate made largely from this crater, with the global iridium layer, so a scaling law of the family the model uses was part of how the input was chosen.",
      },
    },
  },

  // --- Explosions. The only family with a toll, a wave and a blast
  //     radius all measured. -----------------------------------------
  {
    name: 'Beirut 2020',
    eventType: 'explosion',
    value: 0.5 * KILOTON_J,
    quantities: ['toll', 'wave'],
    gated: ['wave'],
    source: '218 dead; a harbour wave of the order of a metre that drowned nobody',
    use: {
      toll: {
        role: 'tuned',
        how: "The conventional-blast mortality bands (CONVENTIONAL_BLAST_BANDS in casualties.ts) were written after OTA's nuclear bands put this row at fifty times the record. They are composed from Glasstone & Dolan's injury thresholds rather than fitted to the 218, but they were made with this row in view.",
      },
      wave: {
        role: 'heldOut',
        how: 'No coefficient decides it. The charge sat on a quay, and the model makes a wave only from a burst within the water, the case Glasstone & Dolan give relations for (§6.119). A zero from a burst on land checks that rule, not a wave law.',
      },
    },
  },
  {
    name: 'Hiroshima 1945',
    eventType: 'explosion',
    value: 15 * KILOTON_J,
    quantities: ['toll', 'blast'],
    gated: ['blast'],
    source: 'Manhattan Engineer District 1946; Glasstone & Dolan Fig. 3.74a for 5 psi at 1.7 km',
    use: {
      toll: {
        role: 'tuned',
        how: 'Two things in the toll lean on this event: OTA 1979\'s blast mortality — the fatality by overpressure OTA calls its own "relatively conservative" assumptions, and Postol 1986 describes as the standard Hiroshima-based rules — and the central mass-fire mortality, set at Hiroshima\'s (FIRESTORM_MORTALITY in casualties.ts: "Hiroshima in the middle").',
      },
      blast: {
        role: 'tuned',
        how: "The height-of-burst factor was calibrated on this very figure: hobBlastFactor's 1.5 at Hiroshima's scaled height is set so that 5 psi falls at 1.7 km (events/explosion/hob.ts). And the figure is not a measurement in the city but Glasstone & Dolan's Fig. 3.74a read at Hiroshima's yield and height.",
      },
    },
  },
  {
    name: 'Crossroads Baker 1946',
    eventType: 'explosion',
    value: 23 * KILOTON_J,
    quantities: ['wave'],
    gated: ['wave'],
    source:
      'Glasstone & Dolan 1977 Table 6.57: 94 ft crest to trough at 330 yd down to 9 ft at 4 000 yd, from 90 ft down in a 200 ft lagoon',
    use: {
      wave: {
        role: 'sameSource',
        how: 'Glasstone & Dolan give the shallow-water relation the model uses (§6.121) as the approximation for bursts "such as Bikini BAKER", and Table 6.57 — the record — is Baker\'s own data in the same book. Nothing in Nimbus was set on it, but the relation and the record share their source.',
      },
    },
  },
  {
    name: 'Ivy Mike 1952',
    eventType: 'explosion',
    value: 10.4 * MEGATON_J,
    quantities: ['wave'],
    gated: ['wave'],
    source: 'Fired on an islet it vapourised; no recorded wave',
    use: {
      wave: {
        role: 'heldOut',
        how: 'No coefficient decides it: the device was fired on an islet, and the model makes a wave only from a burst within the water. The row checks that rule.',
      },
    },
  },
  {
    name: 'Castle Bravo 1954',
    eventType: 'explosion',
    value: 15 * MEGATON_J,
    quantities: ['wave'],
    gated: ['wave'],
    source: 'Fired on the Bikini reef; remembered for its crater and its fallout, not a wave',
    use: {
      wave: {
        role: 'heldOut',
        how: 'No coefficient decides it: the device was fired on the reef, not in the water, and the model makes a wave only from a burst within the water. The row checks that rule.',
      },
    },
  },
  {
    name: 'Tsar Bomba',
    eventType: 'explosion',
    value: 50 * MEGATON_J,
    quantities: ['wave'],
    gated: ['wave'],
    source: 'The largest device ever fired, 1961, 4 km up over water; no wave',
    use: {
      wave: {
        role: 'heldOut',
        how: 'No coefficient decides it: a burst 4 km up is not in the water, and no relation the model uses gives a wave for it. The row checks that rule.',
      },
    },
  },

  // --- Earthquakes. Five gated tolls from M6.2 to M7.8, and the two
  //     megathrusts whose dead were nearly all drowned. --------------
  {
    name: 'Amatrice 2016',
    eventType: 'earthquake',
    value: 6.2,
    quantities: ['toll'],
    gated: [],
    source: '299 dead',
    use: {
      toll: {
        role: 'tuned',
        how: "The shaking contours are still drawn with Joyner–Boore 1981 partly because NGA-West2, tried on 9 September, pushed this row out of its gate (events/earthquake/simulate.ts): the law was chosen with this row in view. Italy's own PAGER curve was fitted on 1973–2007 earthquakes, before this one.",
      },
    },
  },
  {
    name: "L'Aquila 2009",
    eventType: 'earthquake',
    value: 6.3,
    quantities: ['toll'],
    gated: ['toll'],
    source: '309 dead',
    use: {
      toll: {
        role: 'tuned',
        how: "The contour law was kept because NGA-West2, tried on 9 September, took this toll from 227 dead to 40 against 309 (events/earthquake/simulate.ts): chosen with this row in view. Italy's own PAGER curve was fitted on 1973–2007 earthquakes, before this one.",
      },
    },
  },
  {
    name: 'Northridge 1994',
    eventType: 'earthquake',
    value: 6.7,
    quantities: ['toll'],
    gated: ['toll'],
    source: '57 dead',
    use: {
      toll: {
        role: 'tuned',
        how: "The contour law was kept because NGA-West2, tried on 9 September, took this toll from 38 dead to 13 against 57 (events/earthquake/simulate.ts): chosen with this row in view. The United States take PAGER's regional fatality curve, fitted on 1973–2007 earthquakes — this one's period.",
      },
    },
  },
  {
    name: 'Kokoxili (Kunlun) 2001',
    eventType: 'earthquake',
    value: 7.8,
    quantities: ['toll'],
    gated: ['toll'],
    source: 'A 400 km rupture across empty Tibetan plateau; nobody died',
    use: {
      toll: {
        role: 'heldOut',
        how: "Nothing was set on it, and the zero is the population map's: nobody lives in the footprint, so no fatality curve could make it anything else. China's PAGER rates were fitted on 1973–2007 earthquakes; whether this one, which killed nobody, was among them does not bear on this row — which is also why it tests the exposure more than the model.",
      },
    },
  },
  {
    name: 'Gorkha (Nepal) 2015',
    eventType: 'earthquake',
    value: 7.8,
    quantities: ['toll'],
    gated: [],
    source: '8 964 dead',
    use: {
      toll: {
        role: 'heldOut',
        how: "Nothing in Nimbus was set on it, and Nepal borrows its region's PAGER curve, fitted on 1973–2007 earthquakes — before 2015.",
      },
    },
  },
  {
    name: 'Tōhoku 2011',
    eventType: 'earthquake',
    value: 9.1,
    quantities: ['toll', 'wave'],
    gated: ['wave'],
    source: '18 500 dead, over 90 % of them drowned; 30 cm at DART 21413, 1 242 km out',
    use: {
      toll: {
        role: 'heldOut',
        how: "The offline row is the shaking alone, and nothing that decides it was set on this event: Japan's own PAGER curve was fitted on 1973–2007 earthquakes. The drowning curve read from the 2011 record (TSUNAMI_VULNERABILITY) does not enter it — which is why the coastal toll, measured only in the browser, cannot be called validated.",
      },
      wave: {
        role: 'tuned',
        how: 'The megathrust uplift factor 0.6 is "the calibrated all-in factor against Tōhoku DART buoy amplitudes" (events/earthquake/seismicTsunami.ts), and the far-field source radius — half the down-dip width — was chosen by measuring this buoy against the alternative (tsunami/spreading.ts).',
      },
    },
  },
  {
    name: 'Sumatra–Andaman 2004',
    eventType: 'earthquake',
    value: 9.2,
    quantities: ['toll'],
    gated: [],
    source: '227 898 dead, almost all of them drowned',
    use: {
      toll: {
        role: 'sameSource',
        how: "Indonesia's own PAGER curve was fitted on 1973–2007 earthquakes, this one's period. The row is the shaking alone; the 1 300 km rupture is Lay et al. 2005's measurement, an input rather than a fit.",
      },
    },
  },

  // --- Volcanoes. Three columns measured, two tolls, and no wave —
  //     Krakatau drowned 36 000 people and nothing here checks it. ---
  {
    name: 'Mount St Helens 1980',
    eventType: 'volcano',
    value: 1.2e9,
    quantities: ['toll', 'plume'],
    gated: ['plume'],
    source: '57 dead inside a mountain closed for two months; a 24 km column',
    use: {
      toll: {
        role: 'tuned',
        how: "LATERAL_BLAST_RUNOUT_MULTIPLIER = 2.5 was chosen to land the directed blast on the 27 km Glicken 1996 gives for this eruption (events/volcano/simulate.ts), and 264 of the model's 265 dead are inside that blast.",
      },
      plume: {
        role: 'tuned',
        how: "The preset's eruption rate was re-tuned from 4×10³ to 4×10⁴ m³/s so that the column would reach the observed height (MT_ST_HELENS_1980 in events/volcano/simulate.ts), and the golden case uses 5×10⁴. Mastin et al. 2009 also fitted the plume-height relation on this eruption (their Table 1, 18 May 1980).",
      },
    },
  },
  {
    name: 'Pinatubo 1991',
    eventType: 'volcano',
    value: 1e10,
    quantities: ['toll', 'plume'],
    gated: ['plume'],
    source: '847 dead after an evacuation that worked; a 35 km column',
    use: {
      toll: {
        role: 'heldOut',
        how: "Nothing that decides it was set on this eruption: the currents' reach is Sheridan 1979's mobility ratio on the erupted volume, the mortality inside the cleared zone is Merapi 2010's, and the zone is the one PHIVOLCS actually cleared — an input from the record of the evacuation, not from the toll.",
      },
      plume: {
        role: 'sameSource',
        how: "Mastin et al. 2009 fitted the plume-height relation the model uses on the eruptions in their Table 1, and 15 June 1991 Pinatubo is one of them. Where the preset's eruption rate comes from is not written down.",
      },
    },
  },
  {
    name: 'Krakatau 1883',
    eventType: 'volcano',
    value: 2e10,
    quantities: ['plume'],
    gated: ['plume'],
    source: 'Self & Rampino 1981 — a 40 km column; its wave is not checked here',
    use: {
      plume: {
        role: 'unestablished',
        how: "Krakatau 1883 is not among the eruptions Mastin et al. 2009 fitted, which would make this row held out. But the preset's eruption rate, 2×10⁵ m³/s, has carried no source since the first commit, so whether it was read back from the 40 km column is not established.",
      },
    },
  },

  // --- Landslides. Two waves, four decades of volume apart. ---------
  {
    name: 'Vaiont 1963',
    eventType: 'landslide',
    value: 2.7e8,
    quantities: ['wave'],
    gated: ['wave'],
    source:
      'Genevois & Ghirotti 2005 — a wave that crested 140 m above the top of the dam, which stood 25 m above the lake (ASDSO)',
    use: {
      wave: {
        role: 'tuned',
        how: 'The confined-basin amplification (DEFAULT_CONFINEMENT_DYNAMIC_FACTOR = 1.8) was chosen on this wave, the only confined basin with a record: 90 m of static rise times 1.8 is 162 m against 165. Until 14 September 2026 the factor was 3, tuned on a 250 m that is the thickness of the slide in the same paper.',
      },
    },
  },
  {
    name: 'Storegga 8200 BP',
    eventType: 'landslide',
    value: 3e12,
    quantities: ['wave'],
    gated: ['wave'],
    source:
      'Bondevik et al. 2005 — deposits 10–12 m above the sea of the time in western Norway, 3–6 m in northeast Scotland, over 20 m on Shetland',
    use: {
      wave: {
        role: 'tuned',
        how: 'The submarine prefactor, VOLCANO_TSUNAMI_PREFACTOR_SUBMARINE = 0.005, was calibrated on a 5–10 m source amplitude credited to Bondevik et al. 2005, who give run-up read from deposits, not a source amplitude; the far-field band is the project’s inference from the same paper.',
      },
    },
  },
];

/**
 * What each family of event produces that could in principle be
 * checked against a record. Subtracting what the anchors actually
 * carry gives the quantities nobody has ever measured at any scale —
 * the honest gap, and one that no amount of extra care inside the
 * model can close.
 */
const PRODUCED_BY_TYPE: Readonly<Record<EnvelopeEventType, readonly CalibrationQuantity[]>> = {
  impact: ['toll', 'blast', 'crater', 'wave'],
  explosion: ['toll', 'blast', 'crater', 'wave'],
  earthquake: ['toll', 'wave'],
  volcano: ['toll', 'plume', 'wave'],
  landslide: ['toll', 'wave'],
};

/**
 * Every axis on a common ruler: decades of energy.
 *
 * Magnitude is a decade scale already, at 1.5 units of Mw per decade
 * of seismic moment (Hanks & Kanamori 1979). Energy and volume are
 * decades of themselves. Eruptions go on erupted volume rather than
 * on VEI, which is that same volume rounded to a whole decade
 * (Newhall & Self 1982) and would throw away everything finer. So one
 * distance function serves all five families, and "a factor of ten"
 * means the same thing whichever one the reader is looking at.
 */
function decades(axis: EnvelopeAxis, value: number): number {
  switch (axis) {
    case 'magnitude':
      return 1.5 * value;
    case 'energy':
    case 'volume':
      return Math.log10(Math.max(value, Number.MIN_VALUE));
  }
}

/**
 * How close counts as the same size: a factor of three in energy.
 *
 * Not tighter, because the calibration net cannot resolve tighter. Its
 * toll gate passes when a band a factor of a few wide contains the
 * record, so "as big as a measured event" cannot honestly mean
 * anything narrower than the check itself.
 */
const MEASURED_DECADES = Math.log10(3);

export interface CalibrationEnvelope {
  readonly eventType: EnvelopeEventType;
  readonly axis: EnvelopeAxis;
  /** The scenario's position on the axis. */
  readonly value: number;
  /** The quantity this placement is about, or null for the family as
   *  a whole. */
  readonly quantity: CalibrationQuantity | null;
  readonly standing: EnvelopeStanding;
  /** The nearest event with this quantity on record; null when no
   *  event has it on record at any size. */
  readonly nearest: CalibrationAnchor | null;
  /** The smallest and largest events with this quantity on record. */
  readonly span: { readonly low: CalibrationAnchor; readonly high: CalibrationAnchor } | null;
  /**
   * How far past the end of the measured range, as an energy ratio:
   * 1 inside it, 10 000 for a scenario four decades beyond the
   * largest event anyone has recorded. Always ≥ 1, and always the
   * same unit whichever axis the family uses.
   */
  readonly beyond: number;
  /** Quantities this family produces that no record checks, at any size. */
  readonly unchecked: readonly CalibrationQuantity[];
}

/**
 * The anchors for one family, smallest first. Narrowed to those with
 * a given quantity on record when one is asked for — the set that
 * actually bears on a death toll is not the set that bears on a wave.
 */
export function anchorsFor(
  eventType: EnvelopeEventType,
  quantity?: CalibrationQuantity
): readonly CalibrationAnchor[] {
  return CALIBRATION_ANCHORS.filter(
    (a) => a.eventType === eventType && (quantity === undefined || a.quantities.includes(quantity))
  ).sort((a, b) => a.value - b.value);
}

/** Quantities this family produces that nothing in the net measures. */
export function uncheckedFor(eventType: EnvelopeEventType): readonly CalibrationQuantity[] {
  const measured = new Set(anchorsFor(eventType).flatMap((a) => a.quantities));
  return PRODUCED_BY_TYPE[eventType].filter((q) => !measured.has(q));
}

/**
 * Place a scenario against the events that have actually been
 * measured. `value` is on the family's own axis: joules for an impact
 * or an explosion, Mw for an earthquake, VEI for an eruption, cubic
 * metres for a slide.
 */
export function calibrationEnvelope(
  eventType: EnvelopeEventType,
  value: number,
  quantity?: CalibrationQuantity
): CalibrationEnvelope | null {
  if (!Number.isFinite(value) || value <= 0) return null;
  const anchors = anchorsFor(eventType, quantity);
  const unchecked = uncheckedFor(eventType);

  // Nothing of this kind has ever been recorded for this family of
  // event, at any size. No impact in history left a death toll; no
  // landslide in the net has one either. There is no nearest event
  // because there is no event.
  if (anchors.length === 0) {
    return {
      eventType,
      axis: AXIS_BY_TYPE[eventType],
      value,
      quantity: quantity ?? null,
      standing: 'unmeasured',
      nearest: null,
      span: null,
      beyond: 1,
      unchecked,
    };
  }

  const axis = AXIS_BY_TYPE[eventType];
  const here = decades(axis, value);
  const low = anchors[0];
  const high = anchors[anchors.length - 1];
  if (low === undefined || high === undefined) return null;

  let nearest = low;
  let best = Infinity;
  for (const anchor of anchors) {
    const gap = Math.abs(decades(axis, anchor.value) - here);
    if (gap < best) {
      best = gap;
      nearest = anchor;
    }
  }

  const past = Math.max(here - decades(axis, high.value), decades(axis, low.value) - here, 0);
  const standing: EnvelopeStanding =
    best <= MEASURED_DECADES ? 'measured' : past > 0 ? 'extrapolated' : 'interpolated';

  return {
    eventType,
    axis,
    value,
    quantity: quantity ?? null,
    standing,
    nearest,
    span: { low, high },
    beyond: 10 ** past,
    unchecked,
  };
}

/**
 * The same union the store carries as its active result, restated
 * here so this module never imports the store. Structural typing makes
 * an `ActiveResult` assignable without any adapter.
 */
export type EnvelopeResult =
  | { type: 'impact'; data: ImpactScenarioResult }
  | { type: 'explosion'; data: ExplosionScenarioResult }
  | { type: 'earthquake'; data: EarthquakeScenarioResult }
  | { type: 'volcano'; data: VolcanoScenarioResult }
  | { type: 'landslide'; data: LandslideScenarioResult };

/** Pull the axis value out of a finished simulation. */
export function axisValueOf(result: EnvelopeResult): number {
  switch (result.type) {
    case 'impact':
      return result.data.impactor.kineticEnergy;
    case 'explosion':
      return result.data.yield.joules;
    case 'earthquake':
      return result.data.inputs.magnitude;
    case 'volcano':
      return result.data.inputs.totalEjectaVolume;
    case 'landslide':
      return result.data.inputs.volumeM3;
  }
}

/**
 * Place a finished simulation against the measured record, for one
 * quantity: what a reader looking at a death toll needs to know is
 * not what a reader looking at a wave height needs to know.
 */
export function envelopeOf(
  result: EnvelopeResult,
  quantity?: CalibrationQuantity
): CalibrationEnvelope | null {
  return calibrationEnvelope(result.type, axisValueOf(result), quantity);
}
