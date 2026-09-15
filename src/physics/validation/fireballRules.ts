/**
 * The entry model against the bolides the sensors have seen.
 *
 * Nimbus brings a body through the atmosphere with Collins, Melosh & Marcus
 * 2005's equations 8 to 20, and every figure of that pass — the breakup
 * altitude, the burst altitude, the energy that reaches the ground — has been
 * held to the Earth Impact Effects Program, their own program, within its
 * printed rounding (docs/VALIDATION_REPORT.md). That is verification: the two
 * agree because they are the same equations. Nothing has said how near either
 * comes to a body that really fell. NASA JPL's Center for Near-Earth Object
 * Studies publishes what the United States Government sensors recorded of
 * every fireball since 1988 — where it was, how fast it came, how much energy
 * it carried and the altitude at which it burned brightest. The altitude is
 * the one number the entry model predicts and the sensors measure.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the catalogue's fields and its counts, below; that Chelyabinsk
 * 2013 is in it, whose body the project took from Popova et al. 2013 (B-033)
 * and which is therefore taken out; and no altitude of any other bolide, nor
 * any figure the model reads of one.
 *
 * The rules, fixed on 16 September 2026, before the model was run on any
 * bolide of rule 76's set, and numbered after the seventy-five before them:
 *
 *  76. The set. Every bolide NASA JPL's Fireball Data API returns — 1 072 on
 *      16 September 2026 — that carries an altitude of peak brightness, a
 *      pre-entry speed with its components, a total impact energy and a
 *      place: 357, after 472 without an altitude, 242 without a speed and
 *      Chelyabinsk 2013 are left out. They run from 1998 to 2026: 1 of the
 *      1990s, 51 of the 2000s, 157 of the 2010s and 148 since. By energy, 200
 *      below 0.3 kt, 129 from 0.3 to 3 and 28 above, the largest 49 kt; by
 *      speed, 168 below 17 km/s and 189 above, from 9.8 to 71.1 km/s.
 *      scripts/build-fireball-set.ts writes them into fireballSetData.ts,
 *      committed before the model is run on any of them.
 *  77. The scenario a bolide is run as. The body itself was not observed, so
 *      it is built from what was: its mass is twice the energy over the speed
 *      squared, and its diameter that mass at the density a scenario that
 *      names no class carries, 3 000 kg/m³ (constants.ts, CHONDRITIC_DENSITY),
 *      with the strength that scenario takes, Collins et al.'s equation 9 of
 *      the density. Its angle from the horizontal is the angle between the
 *      velocity the catalogue gives and the horizontal plane at the place it
 *      gives, which every row of the set carries. Those components lie in the
 *      catalogue's Earth-fixed frame, so the place needs no turning; five rows
 *      whose components point upward from their own place take the model's
 *      default of 45°, and the report counts them. Read beside,
 *      deciding nothing: the same bodies at the panel's stony class (1 MPa,
 *      Popova et al. 2011) and at an iron's (50 MPa, 7 800 kg/m³), to show
 *      what the assumption is worth.
 *  78. The score. The model's burst altitude against the catalogue's altitude
 *      of peak brightness: the median absolute difference in km, the mean
 *      difference (the model above the record positive), the share within 5
 *      km, and the share of bolides the model brings whole or in a swarm to
 *      the ground, where the record has a flare in the air. Each is read over
 *      the set and in cells: by energy (below 0.3 kt, 0.3 to 3, above 3) and
 *      by speed (below 17 km/s, from 17).
 *  79. What the reading decides. Nothing in the model: no candidate stands
 *      against it here, and rule 5 forbids tuning on a set read this way. It
 *      is the accuracy docs/GOLD_STANDARD.md asks of an impact's entry (I2): a
 *      median absolute difference of 5 km or less and a mean within 3 km, on
 *      at least 300 bolides. The report prints every figure of rule 78,
 *      whatever it reads, and where the bar is missed the gap is declared
 *      with the figures beside it.
 *
 * What these rules cannot settle. The body is inferred, not observed: a
 * denser or stronger one of the same energy bursts lower, and the catalogue
 * gives neither density nor strength, so rule 77's reading is the model's
 * answer for the body a visitor would type, not for the body that fell. The
 * energies are themselves computed from the radiated energy through a
 * luminous efficiency that carries a factor of its own. The altitude of peak
 * brightness is where the fireball shone brightest, which the burst altitude
 * approximates: for a body that never disrupts the two need not agree at all,
 * and the model then has no burst altitude to give. The angle is read from
 * components the catalogue rounds to a tenth of a kilometre per second, whose
 * length differs from the speed it prints by more than 2 % on eight rows and
 * points upward on five. And the sensors see what
 * they see: the catalogue is not a census, and nothing here corrects for what
 * it missed.
 */

/** One bolide of rule 76's set, as the catalogue gives it. */
export interface FireballEvent {
  /** UTC, as the catalogue prints it. */
  date: string;
  /** Degrees; south and west negative. */
  latitude: number;
  longitude: number;
  /** Altitude of peak brightness (km). */
  altitudeKm: number;
  /** Pre-entry speed (km/s) and its components in the catalogue's
   *  Earth-centred frame. */
  speedKmS: number;
  vxKmS: number;
  vyKmS: number;
  vzKmS: number;
  /** Total impact energy (kt of TNT). */
  energyKt: number;
}

/** Rule 77's bodies: the one a scenario naming no class carries, and the two
 *  read beside. */
export const FIREBALL_BODIES = [
  { key: 'default', densityKgM3: 3_000, strengthPa: null },
  { key: 'stony', densityKgM3: 3_000, strengthPa: 1e6 },
  { key: 'iron', densityKgM3: 7_800, strengthPa: 5e7 },
] as const;

export type FireballBody = (typeof FIREBALL_BODIES)[number];

/** Rule 78's cells. */
export const FIREBALL_ENERGY_CELLS = [
  { label: 'below 0.3 kt', max: 0.3 },
  { label: '0.3 to 3 kt', max: 3 },
  { label: 'above 3 kt', max: Infinity },
] as const;

export const FIREBALL_SPEED_SPLIT_KMS = 17;

/** Rule 79: the bar docs/GOLD_STANDARD.md (I2) sets for the entry model. */
export const FIREBALL_MEDIAN_ERROR_KM = 5;
export const FIREBALL_MEAN_ERROR_KM = 3;

/** Rule 78's reading of one body on one set of bolides. */
export interface FireballReading {
  rows: number;
  /** Rows the model bursts in the air, which the difference is read over. */
  burst: number;
  /** Rows the model brings to the ground, where the record has a flare. */
  toTheGround: number;
  medianAbsoluteErrorKm: number | null;
  meanErrorKm: number | null;
  withinFiveKm: number;
}

/** Rule 79: whether a reading meets the bar of I2. */
export function meetsFireballBar(reading: FireballReading): boolean {
  return (
    reading.medianAbsoluteErrorKm !== null &&
    reading.meanErrorKm !== null &&
    reading.rows >= 300 &&
    reading.medianAbsoluteErrorKm <= FIREBALL_MEDIAN_ERROR_KM &&
    Math.abs(reading.meanErrorKm) <= FIREBALL_MEAN_ERROR_KM
  );
}

/** Rule 77: the angle a bolide takes where its velocity does not point
 *  downward from the place the catalogue gives — the model's own default. */
export const FIREBALL_DEFAULT_ANGLE_RAD = Math.PI / 4;

/**
 * Rule 77: the angle between a bolide's velocity and the horizontal at the
 * place the catalogue gives, in radians. Its components lie in the
 * catalogue's Earth-fixed frame — x towards 0° latitude and 0° longitude, y
 * towards 90° east, z towards the pole — so the place needs no turning. A
 * body falling straight down reads π/2; where the components point upward
 * from that place, the model's own 45°.
 */
export function fireballEntryAngle(event: FireballEvent): number {
  const lat = (event.latitude * Math.PI) / 180;
  const lon = (event.longitude * Math.PI) / 180;
  // The outward vertical at the place, in the catalogue's frame.
  const up = [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
  const v = [event.vxKmS, event.vyKmS, event.vzKmS];
  const speed = Math.hypot(v[0] ?? 0, v[1] ?? 0, v[2] ?? 0);
  if (!(speed > 0)) return FIREBALL_DEFAULT_ANGLE_RAD;
  const downward =
    -((v[0] ?? 0) * (up[0] ?? 0) + (v[1] ?? 0) * (up[1] ?? 0) + (v[2] ?? 0) * (up[2] ?? 0)) / speed;
  if (!(downward > 0)) return FIREBALL_DEFAULT_ANGLE_RAD;
  return Math.asin(Math.min(1, downward));
}

/** Rule 77: the diameter (m) of a body of `energyKt` at `speedKmS` and
 *  `densityKgM3`, its mass twice the energy over the speed squared. */
export function fireballDiameterM(energyKt: number, speedKmS: number, densityKgM3: number): number {
  const joules = energyKt * 4.184e12;
  const speed = speedKmS * 1_000;
  if (!(joules > 0) || !(speed > 0) || !(densityKgM3 > 0)) return 0;
  const mass = (2 * joules) / (speed * speed);
  return Math.cbrt((6 * mass) / (Math.PI * densityKgM3));
}
