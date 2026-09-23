import type { TFunction } from 'i18next';
import type { ImpactScenarioResult } from '../../physics/simulate.js';

/**
 * Where the rings of a body out of the crater's domain take their energy
 * (rule 969 of physics/validation/craterDomainRules.ts): the energy the body
 * deposits in the air along its path, the energy it brings to the ground, or
 * both — never an impact that digs a crater, which the model does not resolve
 * there.
 */
export interface RingSource {
  kind: 'both' | 'ground' | 'air';
  groundMt: number;
  airMt: number;
}

export function ringSource(r: Pick<ImpactScenarioResult, 'impactor' | 'entry'>): RingSource {
  // What the air receives is all the body loses on its way down, burst or
  // drag — the energy the blast of a body reaching the ground is read from
  // (`GroundBlast` in effects/airburstBlast.ts) — not only a burst's yield,
  // which is none for a body kept whole.
  const toGround = Math.min(1, Math.max(r.entry.energyFractionToGround, 0));
  const groundMt = r.impactor.kineticEnergyMegatons * toGround;
  const airMt = r.impactor.kineticEnergyMegatons * (1 - toGround);
  const kind = groundMt > 0 && airMt > 0 ? 'both' : groundMt > 0 ? 'ground' : 'air';
  return { kind, groundMt, airMt };
}

/** The sentence, under `${prefix}.ringSource.{both,ground,air}`. */
export function ringSourceText(
  r: Pick<ImpactScenarioResult, 'impactor' | 'entry'>,
  t: TFunction,
  formatMegatons: (mt: number) => string,
  prefix: string
): string {
  const source = ringSource(r);
  return t(`${prefix}.ringSource.${source.kind}`, {
    ground: formatMegatons(source.groundMt),
    air: formatMegatons(source.airMt),
  });
}

/** Rule 969's energies, in TNT equivalent from the kilogram up: a body out of
 *  the crater's domain may bring less than a tonne to the ground. */
export function tntFromKilograms(
  format: (mt: number) => string,
  language: string
): (mt: number) => string {
  return (mt) =>
    mt > 0 && mt < 1e-6
      ? `${(mt * 1e9).toLocaleString(language, { maximumSignificantDigits: 2 })} kg`
      : format(mt);
}
