/**
 * Which of the catalogue's formulas an impact run uses (B-108).
 *
 * The report used to match a formula to the run by its source alone, so an
 * impact whose burn toll cites Glasstone & Dolan printed the explosion's
 * height-of-burst curves, its initial radiation and its underwater burst, and
 * a formula whose source the run did not cite went unprinted even where the
 * page printed its number. Here each formula an impact can run is listed once,
 * with the condition under which the run runs it, and the report prints those
 * and only those.
 */
import type { ImpactScenarioResult } from '../../../physics/simulate.js';
import { radiansToDegrees } from '../../../physics/units.js';
import { METHODOLOGY_SECTIONS, type Citation, type FormulaEntry } from '../methodologyContent.js';

export interface ImpactFormulaExtras {
  /** The wave's arrival field was computed on the bathymetry. */
  bathymetricTsunami: boolean;
  /** The Monte Carlo of the inputs ran, and the report prints its bands. */
  monteCarlo: boolean;
  /** The death toll's band is the 5th and 95th percentile of realisations
   *  of the scenario (`CasualtyEstimate.predictiveBand`). */
  predictiveBand: boolean;
}

type Use = (r: ImpactScenarioResult, x: ImpactFormulaExtras) => boolean;

const positive = (v: unknown): boolean => (v as number) > 0;
const dug: Use = (r) => positive(r.crater.finalDiameter);
const broke: Use = (r) => r.entry.regime !== 'INTACT';
const airburst: Use = (r) => r.entry.regime === 'COMPLETE_AIRBURST';
const wave: Use = (r) => r.tsunami !== undefined;
const programWave: Use = (r) => r.tsunami?.farFieldLaw === 'program';
const rimWave: Use = (r, x) => wave(r, x) && !programWave(r, x);
const burns: Use = (r) => positive(r.damage.thirdDegreeBurn) || positive(r.damage.secondDegreeBurn);
const blast: Use = (r) =>
  positive(r.damage.overpressure5psi) || positive(r.damage.overpressure1psi);

/**
 * Every formula an impact can run, in the order the report prints them, with
 * the condition under which it runs. Formulas of the other modules' sections
 * appear only where an impact reads them: Glasstone & Dolan's blast thresholds
 * and fire table, and the tsunami's propagation.
 */
export const IMPACT_FORMULA_USES: readonly { id: string; use: Use }[] = [
  // The body and its flight.
  { id: 'kinetic-energy', use: () => true },
  { id: 'taxonomy', use: () => true },
  { id: 'airburst', use: () => true },
  { id: 'atmospheric-yield', use: broke },
  // The crater.
  { id: 'transient-crater', use: dug },
  {
    id: 'iron-crater-field',
    use: (r) => r.crater.origin === 'strewnField' || r.crater.origin === 'ironSwarm',
  },
  { id: 'final-crater', use: dug },
  { id: 'crater-depth', use: dug },
  // The ground's shaking.
  { id: 'seismic-magnitude', use: (r) => r.seismic.magnitude !== null },
  {
    id: 'airburst-seismic',
    use: (r) => r.seismic.magnitudeSource === 'air' || r.seismic.magnitudeSource === 'ground',
  },
  // The ejecta.
  { id: 'ejecta', use: (r) => dug(r, NO_EXTRAS) && positive(r.ejecta.blanketEdge1mm) },
  {
    id: 'ejecta-asymmetry',
    use: (r) => dug(r, NO_EXTRAS) && radiansToDegrees(r.inputs.impactAngle) < 45,
  },
  // What reaches the stratosphere.
  { id: 'strat-dust', use: (r) => positive(r.atmosphere.stratosphericDust) },
  { id: 'acid-rain', use: (r) => positive(r.atmosphere.acidRainMass) },
  // The blast, the flash and the fire.
  { id: 'damage-rings-airburst-honest', use: (r, x) => !airburst(r, x) },
  { id: 'airburst-blast', use: airburst },
  { id: 'entry-flash-shock', use: broke },
  { id: 'airburst-radiation', use: airburst },
  { id: 'blast-thresholds', use: blast },
  { id: 'firestorm', use: (r) => positive(r.firestorm.ignitionRadius) },
  { id: 'casualties-horizon', use: burns },
  // The wave.
  { id: 'impact-tsunami-cavity', use: wave },
  { id: 'impact-tsunami-program', use: programWave },
  { id: 'impact-tsunami-wunnemann', use: rimWave },
  { id: 'impact-tsunami-wunnemann-envelope', use: rimWave },
  {
    id: 'impact-sea-coupling',
    use: (r) => r.tsunami !== undefined && r.tsunami.seaCoupling.mechanism !== 'water',
  },
  { id: 'celerity', use: wave },
  { id: 'dispersion', use: rimWave },
  { id: 'synolakis-runup', use: wave },
  { id: 'fast-marching', use: (_, x) => x.bathymetricTsunami },
  // The toll.
  { id: 'casualties-blast', use: (r) => positive(r.damage.overpressure5psi) },
  { id: 'casualties-burns', use: (r) => positive(r.damage.thirdDegreeBurn) },
  { id: 'casualties-firestorm', use: (r) => positive(r.firestorm.sustainRadius) },
  { id: 'casualties-delayed', use: (r) => positive(r.damage.overpressure5psi) },
  { id: 'casualties-tsunami', use: wave },
  { id: 'casualties-honesty', use: (r) => positive(r.damage.overpressure5psi) },
  // The scatter.
  { id: 'toll-band', use: (_, x) => x.predictiveBand },
  { id: 'sin-weighted-angle', use: (_, x) => x.predictiveBand || x.monteCarlo },
  { id: 'boxMuller', use: (_, x) => x.predictiveBand || x.monteCarlo },
  { id: 'mulberry32', use: (_, x) => x.predictiveBand || x.monteCarlo },
  { id: 'percentile-band', use: (_, x) => x.monteCarlo },
];

const NO_EXTRAS: ImpactFormulaExtras = {
  bathymetricTsunami: false,
  monteCarlo: false,
  predictiveBand: false,
};

/** The catalogue's formulas by id. */
export const FORMULA_BY_ID: ReadonlyMap<string, FormulaEntry> = new Map(
  METHODOLOGY_SECTIONS.flatMap((s) => s.entries.map((e) => [e.id, e] as const))
);

/** The ids of the formulas the run used, in the order the report prints them. */
export function impactFormulaIds(
  result: ImpactScenarioResult,
  extras: ImpactFormulaExtras
): string[] {
  return IMPACT_FORMULA_USES.filter((f) => f.use(result, extras)).map((f) => f.id);
}

export interface FormulaBlock {
  citation: Citation;
  entries: FormulaEntry[];
}

/** The formulas the run used, grouped under their source, the sources in
 *  the order of their first formula. */
export function impactFormulaBlocks(
  result: ImpactScenarioResult,
  extras: ImpactFormulaExtras
): FormulaBlock[] {
  const blocks: FormulaBlock[] = [];
  for (const id of impactFormulaIds(result, extras)) {
    const entry = FORMULA_BY_ID.get(id);
    if (entry === undefined) continue;
    const block = blocks.find((b) => b.citation === entry.citation);
    if (block === undefined) blocks.push({ citation: entry.citation, entries: [entry] });
    else block.entries.push(entry);
  }
  return blocks;
}
