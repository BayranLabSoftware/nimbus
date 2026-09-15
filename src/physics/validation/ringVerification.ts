import { STANDARD_GRAVITY } from '../constants.js';
import {
  peakGroundAccelerationNGAWest2,
  peakGroundVelocityNGAWest2,
  type NGAFaultType,
} from '../events/earthquake/attenuation.js';
import {
  abrahamson2016InterfacePga,
  parker2022InterfacePga,
} from '../events/earthquake/interfaceAttenuation.js';
import {
  allen2012HypocentralMmi,
  allen2012HypocentralSigma,
} from '../events/earthquake/intensityPrediction.js';
import { EARTHQUAKE_INPUT_SIGMA } from '../uq/conventions.js';
import { m } from '../units.js';
import {
  AWW12_RHYPO_MEAN,
  AWW12_RHYPO_SIGMA,
  BSSA14_PGA_MEAN,
  BSSA14_PGA_MEAN_UNSPECIFIED,
  BSSA14_PGA_TOTAL_SIGMA,
  BSSA14_PGV_MEAN,
  BSSA14_PGV_MEAN_UNSPECIFIED,
} from './openQuakeReference.js';
import { INTERFACE_REFERENCE, INTERFACE_REFERENCE_OPENQUAKE } from './interfaceReference.js';

/**
 * The relations that draw the intensity rings, against their authors'
 * own code.
 *
 * A formula can be cited correctly and coded wrongly, and the loose
 * brackets beside it in attenuation.test.ts would not see a coefficient
 * off by a few per cent. The OpenQuake Engine keeps, as test data, the
 * values of Boore et al. 2014 that David M. Boore's Fortran program gives
 * (July 2014) and those of Allen, Wald & Worden 2012 from an independent
 * Matlab implementation (openQuakeReference.ts). The two interface
 * candidates of rule 36 of interfaceRules.ts are held to OpenQuake's own
 * implementation, whose tests hold it to its tables within a tenth of a
 * per cent (interfaceReference.ts). This computes ours at the same inputs
 * and says how far apart they are. One computation for the test that
 * holds it and the report that prints it.
 */

export interface VerificationRow {
  relation: string;
  quantity: string;
  reference: string;
  rows: number;
  /** The largest relative difference, |ours / theirs − 1|. */
  worstRelative: number;
  /** The inputs of the row where it occurs. */
  worstAt: string;
}

/** Boore et al. 2014's style of faulting from a rake, as its Fortran
 *  program and OpenQuake read one: within 30° of horizontal strike-slip,
 *  otherwise reverse above and normal below. */
function faultTypeFromRake(rake: number): NGAFaultType {
  if (Math.abs(rake) <= 30 || Math.abs(rake) >= 150) return 'strike-slip';
  return rake > 0 ? 'reverse' : 'normal';
}

function worst<T>(
  rows: readonly T[],
  ours: (row: T) => number,
  theirs: (row: T) => number,
  label: (row: T) => string
): { worstRelative: number; worstAt: string } {
  let worstRelative = 0;
  let worstAt = '—';
  for (const row of rows) {
    const rel = Math.abs(ours(row) / theirs(row) - 1);
    if (rel > worstRelative) {
      worstRelative = rel;
      worstAt = label(row);
    }
  }
  return { worstRelative, worstAt };
}

const pgaG = (magnitude: number, rjbKm: number, vs30: number, faultType: NGAFaultType): number =>
  (peakGroundAccelerationNGAWest2({
    magnitude,
    distance: m(rjbKm * 1_000),
    faultType,
    vs30,
  }) as number) / STANDARD_GRAVITY;

const pgvCmS = (magnitude: number, rjbKm: number, vs30: number, faultType: NGAFaultType): number =>
  (peakGroundVelocityNGAWest2({
    magnitude,
    distance: m(rjbKm * 1_000),
    faultType,
    vs30,
  }) as number) * 100;

export function verifyRings(): VerificationRow[] {
  const boore = 'Boore et al. 2014';
  const allen = 'Allen, Wald & Worden 2012, hypocentral';
  const fortran = "D. M. Boore's Fortran program, via OpenQuake's test data";
  const matlab = "An independent Matlab implementation, via OpenQuake's test data";
  return [
    {
      relation: boore,
      quantity: 'median PGA, with style of faulting',
      reference: fortran,
      rows: BSSA14_PGA_MEAN.length,
      ...worst(
        BSSA14_PGA_MEAN,
        ([mag, rake, rjb, vs30]) => pgaG(mag, rjb, vs30, faultTypeFromRake(rake)),
        (row) => row[4],
        ([mag, rake, rjb, vs30]) =>
          `M ${mag.toString()}, rake ${rake.toString()}°, R_JB ${rjb.toString()} km, Vs30 ${vs30.toString()} m/s`
      ),
    },
    {
      relation: boore,
      quantity: 'median PGA, style of faulting unspecified',
      reference: fortran,
      rows: BSSA14_PGA_MEAN_UNSPECIFIED.length,
      ...worst(
        BSSA14_PGA_MEAN_UNSPECIFIED,
        ([mag, rjb, vs30]) => pgaG(mag, rjb, vs30, 'unspecified'),
        (row) => row[3],
        ([mag, rjb, vs30]) =>
          `M ${mag.toString()}, R_JB ${rjb.toString()} km, Vs30 ${vs30.toString()} m/s`
      ),
    },
    {
      relation: boore,
      quantity: 'median PGV, with style of faulting',
      reference: fortran,
      rows: BSSA14_PGV_MEAN.length,
      ...worst(
        BSSA14_PGV_MEAN,
        ([mag, rake, rjb, vs30]) => pgvCmS(mag, rjb, vs30, faultTypeFromRake(rake)),
        (row) => row[4],
        ([mag, rake, rjb, vs30]) =>
          `M ${mag.toString()}, rake ${rake.toString()}°, R_JB ${rjb.toString()} km, Vs30 ${vs30.toString()} m/s`
      ),
    },
    {
      relation: boore,
      quantity: 'median PGV, style of faulting unspecified',
      reference: fortran,
      rows: BSSA14_PGV_MEAN_UNSPECIFIED.length,
      ...worst(
        BSSA14_PGV_MEAN_UNSPECIFIED,
        ([mag, rjb, vs30]) => pgvCmS(mag, rjb, vs30, 'unspecified'),
        (row) => row[3],
        ([mag, rjb, vs30]) =>
          `M ${mag.toString()}, R_JB ${rjb.toString()} km, Vs30 ${vs30.toString()} m/s`
      ),
    },
    {
      relation: allen,
      quantity: 'median MMI',
      reference: matlab,
      rows: AWW12_RHYPO_MEAN.length,
      ...worst(
        AWW12_RHYPO_MEAN,
        ([mag, r]) => allen2012HypocentralMmi(mag, r),
        (row) => row[2],
        ([mag, r]) => `M ${mag.toString()}, R_hyp ${r.toString()} km`
      ),
    },
    {
      relation: allen,
      quantity: 'total σ of MMI',
      reference: matlab,
      rows: AWW12_RHYPO_SIGMA.length,
      ...worst(
        AWW12_RHYPO_SIGMA,
        ([, r]) => allen2012HypocentralSigma(r),
        (row) => row[2],
        ([mag, r]) => `M ${mag.toString()}, R_hyp ${r.toString()} km`
      ),
    },
    ...(
      [
        ['Abrahamson, Gregor & Addo 2016, interface', 'abrahamson2016', abrahamson2016InterfacePga],
        ['Parker et al. 2022, global interface', 'parker2022', parker2022InterfacePga],
      ] as const
    ).map(([relation, key, pga]) => ({
      relation,
      quantity: 'median PGA',
      reference: `OpenQuake ${INTERFACE_REFERENCE_OPENQUAKE}'s implementation`,
      rows: INTERFACE_REFERENCE[key].length,
      ...worst(
        INTERFACE_REFERENCE[key],
        ([magnitude, rrupKm, vs30]) => pga({ magnitude, rrupKm, vs30 }),
        (row) => row[3],
        ([mag, r, vs30]) =>
          `M ${mag.toString()}, R_rup ${r.toString()} km, Vs30 ${vs30.toString()} m/s`
      ),
    })),
  ];
}

/**
 * The ground-motion residual the band draws, one σ for every earthquake,
 * against the total σ of ln PGA the Fortran program gives over the range
 * it is said to stand for: Mw 5.5 and above, R_JB within 80 km, Vs30 of
 * 300 m/s or more.
 */
export function residualAgainstReference(): {
  convention: number;
  min: number;
  max: number;
  rows: number;
  /** The largest σ below Mw 5.5, where the scatter grows. */
  smallEarthquakeMax: number;
  /** The smallest σ on ground softer than 300 m/s, from Mw 5.5. */
  softGroundMin: number;
} {
  const sigma = (keep: (mag: number, rjb: number, vs30: number) => boolean): number[] =>
    BSSA14_PGA_TOTAL_SIGMA.filter(([mag, , rjb, vs30]) => keep(mag, rjb, vs30)).map(
      (row) => row[4]
    );
  const inRange = sigma((mag, rjb, vs30) => mag >= 5.5 && rjb <= 80 && vs30 >= 300);
  return {
    convention: EARTHQUAKE_INPUT_SIGMA.groundMotion.sigma,
    min: Math.min(...inRange),
    max: Math.max(...inRange),
    rows: inRange.length,
    smallEarthquakeMax: Math.max(...sigma((mag) => mag < 5.5)),
    softGroundMin: Math.min(...sigma((mag, _rjb, vs30) => mag >= 5.5 && vs30 < 300)),
  };
}
