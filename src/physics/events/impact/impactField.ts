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
import { radiantHeatExposure, type RadiantHeat } from '../../effects/atapRadiation.js';
import { impactThermalExposure } from '../../effects/impactThermal.js';
import { J, m } from '../../units.js';
import { peakOverpressure } from '../explosion/overpressure.js';
import {
  PROGRAM_AMBIENT_PRESSURE_PA,
  PROGRAM_SOUND_SPEED_M_S,
} from '../../validation/impactWindRules.js';

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
 *   - a body that reaches the ground (INTACT or PARTIAL_AIRBURST) blasts with
 *     the Earth Impact Effects Program's law on E₀ · max(f, 1 − f), at the
 *     ground since rules 748 to 755, or from Eq. 18's altitude as the program
 *     reads it where that law is asked for (`groundImpactOverpressure`);
 *   - a COMPLETE_AIRBURST blasts as the larger of the surface burst of the
 *     energy that reached the ground and the air burst of the entry, at the
 *     burst altitude when it is above the ground, and as a surface burst of
 *     the atmospheric yield when it is not — the same three cases the rings
 *     are drawn in;
 *   - the flash is the program's fireball on the ground plus the project's
 *     flash in the air (`simulate.ts`, `thermalFluence`), which is, where the
 *     result carries a radiant heat (B-095), the stronger at every range of
 *     that flash and the heat Johnston & Stern's correlation lays along the
 *     path.
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
  /** The heat load along the entry's path, as its equal-area profile (B-095). */
  radiantHeat?: RadiantHeat | null;
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
      virtualBurstAltitude: m(law === 'surface' ? 0 : source.entry.virtualBurstAltitude),
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

/**
 * The peak wind (m/s) behind a shock front whose peak overpressure is
 * `overpressurePa`: Collins, Melosh & Marcus (2005)'s relation,
 * u = (5p / 7P₀) · c₀ / √(1 + 6p / 7P₀), with the round constants the Earth
 * Impact Effects Program uses, P₀ = 10⁵ Pa and c₀ = 330 m/s (rules 788 to
 * 792). An explosion reads the same relation at Glasstone & Dolan's sea level
 * (`events/explosion/peakWind.ts`); each domain implements its own field's
 * tool. Zero where there is no shock.
 */
export function programPeakWind(overpressurePa: number): number {
  if (!Number.isFinite(overpressurePa) || overpressurePa <= 0) return 0;
  const x = overpressurePa / (7 * PROGRAM_AMBIENT_PRESSURE_PA);
  return (5 * x * PROGRAM_SOUND_SPEED_M_S) / Math.sqrt(1 + 6 * x);
}

/** The peak overpressure (Pa) whose wind, by {@link programPeakWind}, is
 *  `windMs`: the same relation solved for p, in closed form. Where a map draws
 *  a wind's contour it draws this overpressure's, so the two cannot part. */
export function programOverpressureForWind(windMs: number): number {
  if (!Number.isFinite(windMs) || windMs <= 0) return 0;
  const c2 = PROGRAM_SOUND_SPEED_M_S * PROGRAM_SOUND_SPEED_M_S;
  const u2 = windMs * windMs;
  const x = (6 * u2 + Math.sqrt(36 * u2 * u2 + 100 * c2 * u2)) / (50 * c2);
  return 7 * PROGRAM_AMBIENT_PRESSURE_PA * x;
}

/** Rule 790: the peak wind (m/s) the impact's shock sets the air moving at,
 *  at a ground range (m) — the program's relation on the impact's own
 *  overpressure, the field its blast rings are drawn from. */
export function impactPeakWindAt(source: ImpactFieldSource, rangeM: number): number {
  return programPeakWind(impactOverpressureAt(source, rangeM));
}

/**
 * The farthest ground range (m), between `minRangeM` and `maxRangeM`, at which
 * a field still reaches `value`: a scan in the logarithm of the range, 64
 * steps to a decade from the far end inward, refined by halving. 0 where it
 * reaches it nowhere in the span, `maxRangeM` where it still does there. The
 * field is the one the result publishes, read where it is, so that a contour
 * drawn at a level stands where the field says and nowhere else.
 */
export function impactFieldReach(
  fieldAt: (rangeM: number) => number,
  value: number,
  minRangeM: number,
  maxRangeM: number
): number {
  if (!(value > 0) || !(maxRangeM > minRangeM) || !(minRangeM > 0)) return 0;
  if (fieldAt(maxRangeM) >= value) return maxRangeM;
  const steps = Math.max(1, Math.ceil(64 * Math.log10(maxRangeM / minRangeM)));
  const ratio = Math.pow(maxRangeM / minRangeM, 1 / steps);
  let outer = maxRangeM;
  for (let i = 1; i <= steps; i++) {
    const inner = maxRangeM / Math.pow(ratio, i);
    if (fieldAt(inner) >= value) {
      let lo = inner;
      let hi = outer;
      for (let k = 0; k < 40; k++) {
        const mid = Math.sqrt(lo * hi);
        if (fieldAt(mid) >= value) lo = mid;
        else hi = mid;
      }
      return lo;
    }
    outer = inner;
  }
  return 0;
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
      ? groundFireballShare(m(source.entry.burstAltitude), J(kept))
      : 0;
  const onGround = kept * share;
  const inTheAir =
    (IMPACT_LUMINOUS_EFFICIENCY * (airEnergy - onGround)) /
    (4 * Math.PI * (rangeM * rangeM + flashAltitude * flashAltitude));
  return (
    impactThermalExposure(m(rangeM), J(Number(groundEnergy) + onGround)) +
    Math.max(inTheAir, radiantHeatExposure(source.radiantHeat ?? null, rangeM))
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
