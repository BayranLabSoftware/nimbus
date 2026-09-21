import {
  airburstOverpressureRange,
  DEFAULT_GROUND_BLAST,
  groundImpactOverpressure,
} from '../effects/airburstBlast.js';
import { ejectaBlanketOuterEdge } from '../effects/ejecta.js';
import { impactFireballRadius } from '../effects/blastWave.js';
import { peakOverpressure } from '../events/explosion/overpressure.js';
import { simulateImpact, type ImpactScenarioResult } from '../simulate.js';
import { deg, degreesToRadians, J, kgPerM3, m, mps } from '../units.js';
import { EIEP_REFERENCE, type EiepRow } from './eiepReference.js';

/**
 * The simulator's impact pipeline against the Earth Impact Effects
 * Program on the grid scripts/eiep-reference.py fixed: every custom
 * input a user can set for an impact on land, and what the reference
 * implementation of the equations the simulator cites prints for it.
 *
 * Where the two differ by design the difference is still measured, and
 * the report names the design: the air blast of an impact that reaches
 * the ground is Kinney & Graham's free-air fit on the energy that reaches
 * it here, the program's the scaling Collins et al. give; the simulator's
 * strength classes are Popova et al.'s, the program's a function of
 * density. The air blast of an airburst is the program's own
 * (effects/airburstBlast.ts), at both ends of its range.
 */

/** Collins et al. 2005's target density for each target (Section 3). */
export const EIEP_TARGET_DENSITY: Readonly<Record<EiepRow['target'], number>> = {
  sedimentary: 2_500,
  crystalline: 2_750,
};

export function simulateEiepRow(row: EiepRow): ImpactScenarioResult {
  return simulateImpact({
    impactorDiameter: m(row.diameterM),
    impactVelocity: mps(row.velocityKmS * 1_000),
    impactorDensity: kgPerM3(row.densityKgM3),
    targetDensity: kgPerM3(EIEP_TARGET_DENSITY[row.target]),
    impactAngle: degreesToRadians(deg(row.angleDeg)),
  });
}

export type EiepQuantity =
  | 'energy'
  | 'breakupAltitude'
  | 'burstAltitude'
  | 'groundVelocity'
  | 'transientDiameter'
  | 'finalDiameter'
  | 'finalDepth'
  | 'overpressure'
  | 'airburstOverpressure'
  | 'airburstOverpressureHigh'
  | 'fireballRadius'
  | 'ejectaEdge';

export interface EiepRatio {
  row: EiepRow;
  quantity: EiepQuantity;
  /** For the ejecta edge, the deposit thickness (m) the edge is for. */
  detail?: number;
  model: number;
  reference: number;
}

/** Every pair where both sides answer with a number above zero. */
export function eiepRatios(rows: readonly EiepRow[] = EIEP_REFERENCE): EiepRatio[] {
  const out: EiepRatio[] = [];
  for (const row of rows) {
    if (row.error !== null) continue;
    const r = simulateEiepRow(row);
    const groundEnergy = (r.impactor.kineticEnergy as number) * r.entry.energyFractionToGround;
    const pair = (
      quantity: EiepQuantity,
      model: number,
      reference: number | null | undefined,
      detail?: number
    ): void => {
      if (reference === null || reference === undefined || !(reference > 0) || !(model > 0)) return;
      out.push({ row, quantity, model, reference, ...(detail === undefined ? {} : { detail }) });
    };
    pair('energy', r.impactor.kineticEnergy, row.energyJ);
    pair('breakupAltitude', r.entry.breakupAltitude, row.breakupAltitudeM);
    const airburst = row.burstAltitudeM !== null && row.burstAltitudeM !== undefined;
    if (airburst) pair('burstAltitude', r.entry.burstAltitude, row.burstAltitudeM);
    if (!airburst) pair('groundVelocity', r.entry.endVelocity / 1_000, row.impactVelocityKmS);
    pair('transientDiameter', r.crater.transientDiameter, row.transientDiameterM);
    pair('finalDiameter', r.crater.finalDiameter, row.finalDiameterM);
    pair('finalDepth', r.crater.depth, row.finalDepthM);
    if (
      airburst &&
      r.entry.regime === 'COMPLETE_AIRBURST' &&
      row.overpressurePa !== null &&
      row.overpressurePa !== undefined
    ) {
      const p = airburstOverpressureRange({
        groundRange: m(row.distanceKm * 1_000),
        burstAltitude: r.entry.burstAltitude,
        blastYield: J(r.entry.blastYieldMegatons * 4.184e15),
      });
      pair('airburstOverpressure', p.low, row.overpressurePa[0]);
      pair('airburstOverpressureHigh', p.high, row.overpressurePa[1]);
    }
    if (!airburst && row.overpressurePa !== null && row.overpressurePa !== undefined) {
      const distance = m(row.distanceKm * 1_000);
      const gf = r.entry.energyFractionToGround;
      // The blast the model draws for an impact that reaches the ground: the
      // program's own since rule 144 of entryProgramRules.ts.
      pair(
        'overpressure',
        DEFAULT_GROUND_BLAST !== 'project'
          ? groundImpactOverpressure({
              groundRange: distance,
              virtualBurstAltitude: r.entry.virtualBurstAltitude,
              blastYield: J((r.impactor.kineticEnergy as number) * Math.max(gf, 1 - gf)),
              held: DEFAULT_GROUND_BLAST === 'programHeld',
            })
          : peakOverpressure({ distance, yieldEnergy: J(groundEnergy) }),
        row.overpressurePa[0]
      );
    }
    if (!airburst)
      pair('fireballRadius', impactFireballRadius(J(groundEnergy)), row.fireballRadiiM?.[0]);
    for (const [thickness, radius] of row.ejectaRadiiM ?? []) {
      pair(
        'ejectaEdge',
        ejectaBlanketOuterEdge(
          r.crater.transientDiameter,
          m((r.crater.finalDiameter as number) / 2),
          m(thickness)
        ),
        radius,
        thickness
      );
    }
  }
  return out;
}

export interface EiepSummary {
  quantity: EiepQuantity;
  pairs: number;
  /** Geometric mean of simulator over program. */
  geometricMean: number;
  p10: number;
  median: number;
  p90: number;
  min: number;
  max: number;
}

export function summariseEiep(ratios: readonly EiepRatio[]): EiepSummary[] {
  const quantities = [...new Set(ratios.map((r) => r.quantity))];
  return quantities.map((quantity) => {
    const values = ratios
      .filter((r) => r.quantity === quantity)
      .map((r) => r.model / r.reference)
      .sort((a, b) => a - b);
    const at = (q: number): number => values[Math.round(q * (values.length - 1))] ?? Number.NaN;
    return {
      quantity,
      pairs: values.length,
      geometricMean: Math.exp(values.reduce((a, b) => a + Math.log(b), 0) / values.length),
      p10: at(0.1),
      median: at(0.5),
      p90: at(0.9),
      min: values[0] ?? Number.NaN,
      max: values[values.length - 1] ?? Number.NaN,
    };
  });
}
