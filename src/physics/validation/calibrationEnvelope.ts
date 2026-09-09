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
 * nineteen. They can ask for a two-hundred-kilotonne charge under the
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

export interface CalibrationAnchor {
  /** The event, as it is written in the calibration net. */
  readonly name: string;
  readonly eventType: EnvelopeEventType;
  /** Position on that family's axis: joules, Mw, or cubic metres. */
  readonly value: number;
  /** What was recorded about it. */
  readonly quantities: readonly CalibrationQuantity[];
  /**
   * True when a test fails the build if the model drifts away from
   * this row; false when the row is measured and printed with a
   * written reason but not enforced. Hiroshima is the clearest of the
   * second kind: the raster counts the 1.2 million living there now,
   * not the 350 000 of 1945, so the model must overshoot and the gate
   * would be dishonest.
   */
  readonly gated: boolean;
  /** Where the number comes from. */
  readonly source: string;
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
    gated: true,
    source: 'Boslough & Crawford 2008; Chyba 1993 — 3–30 Mt from the flattened forest',
  },
  {
    name: 'Meteor Crater',
    eventType: 'impact',
    value: 10 * MEGATON_J,
    quantities: ['crater'],
    gated: true,
    source: 'Kring 2007 — a 1.2 km crater from a 50 m iron at 12.8 km/s',
  },
  {
    name: 'Chicxulub',
    eventType: 'impact',
    value: 7.8e23,
    quantities: ['crater'],
    gated: true,
    source: 'Hildebrand 1991, Morgan 2016 — a final crater of about 180 km',
  },

  // --- Explosions. The only family with a toll, a wave and a blast
  //     radius all measured. -----------------------------------------
  {
    name: 'Beirut 2020',
    eventType: 'explosion',
    value: 0.5 * KILOTON_J,
    quantities: ['toll', 'wave'],
    gated: false,
    source: '218 dead; a harbour wave of the order of a metre that drowned nobody',
  },
  {
    name: 'Hiroshima 1945',
    eventType: 'explosion',
    value: 15 * KILOTON_J,
    quantities: ['toll', 'blast'],
    gated: false,
    source: 'Manhattan Engineer District 1946; Glasstone & Dolan Fig. 3.74a for 5 psi at 1.7 km',
  },
  {
    name: 'Crossroads Baker 1946',
    eventType: 'explosion',
    value: 23 * KILOTON_J,
    quantities: ['wave'],
    gated: true,
    source: 'Operation Crossroads: about 30 m at 300 m and 1.8 m at 5.5 km, from 27 m down',
  },
  {
    name: 'Ivy Mike 1952',
    eventType: 'explosion',
    value: 10.4 * MEGATON_J,
    quantities: ['wave'],
    gated: true,
    source: 'Fired on an islet it vapourised; no recorded wave',
  },
  {
    name: 'Castle Bravo 1954',
    eventType: 'explosion',
    value: 15 * MEGATON_J,
    quantities: ['wave'],
    gated: true,
    source: 'Fired on the Bikini reef; remembered for its crater and its fallout, not a wave',
  },
  {
    name: 'Tsar Bomba',
    eventType: 'explosion',
    value: 50 * MEGATON_J,
    quantities: ['wave'],
    gated: true,
    source: 'The largest device ever fired, 1961, 4 km up over water; no wave',
  },

  // --- Earthquakes. Five gated tolls from M6.2 to M7.8, and the two
  //     megathrusts whose dead were nearly all drowned. --------------
  {
    name: 'Amatrice 2016',
    eventType: 'earthquake',
    value: 6.2,
    quantities: ['toll'],
    gated: true,
    source: '299 dead',
  },
  {
    name: "L'Aquila 2009",
    eventType: 'earthquake',
    value: 6.3,
    quantities: ['toll'],
    gated: true,
    source: '309 dead',
  },
  {
    name: 'Northridge 1994',
    eventType: 'earthquake',
    value: 6.7,
    quantities: ['toll'],
    gated: true,
    source: '57 dead',
  },
  {
    name: 'Kokoxili (Kunlun) 2001',
    eventType: 'earthquake',
    value: 7.8,
    quantities: ['toll'],
    gated: true,
    source: 'A 400 km rupture across empty Tibetan plateau; nobody died',
  },
  {
    name: 'Gorkha (Nepal) 2015',
    eventType: 'earthquake',
    value: 7.8,
    quantities: ['toll'],
    gated: true,
    source: '8 964 dead',
  },
  {
    name: 'Tōhoku 2011',
    eventType: 'earthquake',
    value: 9.1,
    quantities: ['toll', 'wave'],
    gated: false,
    source: '18 500 dead, over 90 % of them drowned; 30 cm at DART 21413, 1 500 km out',
  },
  {
    name: 'Sumatra–Andaman 2004',
    eventType: 'earthquake',
    value: 9.2,
    quantities: ['toll'],
    gated: false,
    source: '227 898 dead, almost all of them drowned',
  },

  // --- Volcanoes. Three columns measured, two tolls, and no wave —
  //     Krakatau drowned 36 000 people and nothing here checks it. ---
  {
    name: 'Mount St Helens 1980',
    eventType: 'volcano',
    value: 1.2e9,
    quantities: ['toll', 'plume'],
    gated: false,
    source: '57 dead inside a mountain closed for two months; a 24 km column',
  },
  {
    name: 'Pinatubo 1991',
    eventType: 'volcano',
    value: 1e10,
    quantities: ['toll', 'plume'],
    gated: false,
    source: '847 dead after an evacuation that worked; a 35 km column',
  },
  {
    name: 'Krakatau 1883',
    eventType: 'volcano',
    value: 2e10,
    quantities: ['plume'],
    gated: true,
    source: 'Self & Rampino 1981 — a 40 km column; its wave is not checked here',
  },

  // --- Landslides. Two waves, four decades of volume apart. ---------
  {
    name: 'Vaiont 1963',
    eventType: 'landslide',
    value: 2.7e8,
    quantities: ['wave'],
    gated: true,
    source: 'Genevois 2005 — the reservoir wave that overtopped the dam by 245 m',
  },
  {
    name: 'Storegga 8200 BP',
    eventType: 'landslide',
    value: 3e12,
    quantities: ['wave'],
    gated: true,
    source: 'Bondevik 2005 — 10–25 m of run-up read from the Norwegian deposits',
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
