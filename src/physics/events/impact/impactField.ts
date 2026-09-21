import { IMPACT_BLAST_COUPLING, IMPACT_LUMINOUS_EFFICIENCY } from '../../constants.js';
import {
  airburstOverpressure,
  DEFAULT_GROUND_BLAST,
  groundImpactOverpressure,
  type GroundBlast,
} from '../../effects/airburstBlast.js';
import {
  DEFAULT_AIR_FLASH,
  DEFAULT_LOW_BURST_FLASH,
  groundFireballShare,
  type AirFlash,
  type EntryRegime,
  type LowBurstFlash,
} from '../../effects/atmosphericEntry.js';
import { impactThermalExposure } from '../../effects/impactThermal.js';
import { J, m } from '../../units.js';
import { peakOverpressure } from '../explosion/overpressure.js';

/**
 * The field an impact makes — its overpressure and its thermal exposure at a
 * ground range — read back from the result it was drawn from.
 *
 * Rules 621 to 629 (`validation/continuityRules.ts`). G5's harness checks a
 * contour, the range where a threshold is crossed, for continuity only where
 * the regime switches, because a contour at its birth moves as the square
 * root of the excess and no correct model keeps it continuous there
 * (`ringBirth.test.ts`). What it checks everywhere instead is the field, at
 * fixed places, which is where continuity is a property of the physics. For
 * that to check anything, the field must be the one the product draws its
 * rings from, and not a second model written beside it.
 *
 * So these functions take the branches `simulateImpact` takes, from the
 * numbers the result itself carries:
 *
 *   - a body that reaches the ground (INTACT or PARTIAL_AIRBURST) blasts as
 *     the Earth Impact Effects Program reads it, from Eq. 18's altitude and
 *     E₀ · max(f, 1 − f) (`groundImpactOverpressure`);
 *   - a COMPLETE_AIRBURST blasts as the larger of the surface burst of the
 *     energy that reached the ground and the air burst of the entry, at the
 *     burst altitude when it is above the ground, and as a surface burst of
 *     the atmospheric yield when it is not — the same three cases the rings
 *     are drawn in;
 *   - the flash is the program's fireball on the ground plus the project's
 *     flash in the air (`simulate.ts`, `thermalFluence`).
 *
 * `impactField.test.ts` holds the functions to the rings: at the radius of
 * every overpressure ring the overpressure is that ring's threshold, and at
 * the radius of every burn ring the horizon did not cut, the exposure is that
 * burn's threshold, on bodies of every entry regime.
 */

/** What these functions read from a result: nothing a result does not carry. */
export interface ImpactFieldSource {
  /** The law the rings were drawn with, where the input names one. */
  inputs?: {
    groundBlast?: GroundBlast;
    airFlash?: AirFlash;
    lowBurstFlash?: LowBurstFlash;
    impactVelocity?: number;
  };
  impactor: { kineticEnergy: number };
  entry: {
    regime: EntryRegime;
    /** The speed at the burst or at the ground (m/s). */
    endVelocity?: number;
    energyFractionToGround: number;
    burstAltitude: number;
    virtualBurstAltitude: number;
    blastYieldMegatons: number;
    atmosphericYieldMegatons: number;
  };
}

const JOULES_PER_MEGATON = 4.184e15;

/** The overpressure (Pa) the impact puts on the ground at a range (m). */
export function impactOverpressureAt(source: ImpactFieldSource, rangeM: number): number {
  const ke = source.impactor.kineticEnergy;
  const gf = source.entry.energyFractionToGround;
  const law = source.inputs?.groundBlast ?? DEFAULT_GROUND_BLAST;
  if (law !== 'project' && source.entry.regime !== 'COMPLETE_AIRBURST') {
    return groundImpactOverpressure({
      groundRange: m(rangeM),
      virtualBurstAltitude: m(source.entry.virtualBurstAltitude),
      blastYield: J(ke * Math.max(gf, 1 - gf)),
      held: law === 'programHeld',
    });
  }
  const surfaceEnergy = ke * Math.max(gf, 0) * IMPACT_BLAST_COUPLING;
  const surface =
    surfaceEnergy > 0
      ? (peakOverpressure({ distance: m(rangeM), yieldEnergy: J(surfaceEnergy) }) as number)
      : 0;
  return Math.max(surface, airOverpressureAt(source, rangeM));
}

/** The entry's air shock at a range, in the two cases `atmosphericEntry.ts`
 *  draws its rings in. */
function airOverpressureAt(source: ImpactFieldSource, rangeM: number): number {
  const atmosphericYield = source.entry.atmosphericYieldMegatons * JOULES_PER_MEGATON;
  if (!Number.isFinite(atmosphericYield) || atmosphericYield <= 0) return 0;
  const altitude = source.entry.burstAltitude;
  if (Number.isFinite(altitude) && altitude > 0) {
    return airburstOverpressure({
      groundRange: m(rangeM),
      burstAltitude: m(altitude),
      blastYield: J(Math.max(source.entry.blastYieldMegatons * JOULES_PER_MEGATON, 0)),
    });
  }
  return peakOverpressure({
    distance: m(rangeM),
    yieldEnergy: J(atmosphericYield * IMPACT_BLAST_COUPLING),
  });
}

/** The thermal exposure (J/m²) at a range (m): the program's fireball on the
 *  ground plus the project's flash in the air. */
export function impactThermalExposureAt(source: ImpactFieldSource, rangeM: number): number {
  const ke = source.impactor.kineticEnergy;
  const groundEnergy = J(ke * Math.max(source.entry.energyFractionToGround, 0));
  const airEnergy = source.entry.atmosphericYieldMegatons * JOULES_PER_MEGATON;
  // B-094: a complete airburst's flash at its burst altitude, when asked.
  const flashAltitude =
    (source.inputs?.airFlash ?? DEFAULT_AIR_FLASH) === 'burst' &&
    source.entry.regime === 'COMPLETE_AIRBURST'
      ? Math.max(source.entry.burstAltitude, 0)
      : 0;
  // B-093: below its own fireball, a share of the kept energy on the ground.
  const v0 = source.inputs?.impactVelocity ?? 0;
  const kept =
    source.entry.regime === 'COMPLETE_AIRBURST' && v0 > 0 && source.entry.endVelocity !== undefined
      ? ke * Math.min(1, (source.entry.endVelocity / v0) ** 2)
      : 0;
  const share =
    (source.inputs?.lowBurstFlash ?? DEFAULT_LOW_BURST_FLASH) === 'fireball'
      ? groundFireballShare(source.entry.burstAltitude, kept)
      : 0;
  const onGround = kept * share;
  return (
    impactThermalExposure(m(rangeM), J(Number(groundEnergy) + onGround)) +
    (IMPACT_LUMINOUS_EFFICIENCY * (airEnergy - onGround)) /
      (4 * Math.PI * (rangeM * rangeM + flashAltitude * flashAltitude))
  );
}

/** Rule 624: the fixed ground ranges, in metres. The same seven as
 *  `FIELD_RANGES_M` of the rules, which `impactField.test.ts` holds equal. */
export const IMPACT_FIELD_RANGES_M = [1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6] as const;

/** The key a field sample is published under, e.g. `overpressureAt30km`. */
export const impactFieldKey = (
  quantity: 'overpressure' | 'thermalExposure',
  rangeM: number
): string => `${quantity}At${String(rangeM / 1_000)}km`;

/** Rule 624: the field at the seven fixed ranges, as the result publishes it. */
export function impactFieldSamples(source: ImpactFieldSource): Record<string, number> {
  const out: Record<string, number> = {};
  for (const range of IMPACT_FIELD_RANGES_M) {
    out[impactFieldKey('overpressure', range)] = impactOverpressureAt(source, range);
    out[impactFieldKey('thermalExposure', range)] = impactThermalExposureAt(source, range);
  }
  return out;
}
