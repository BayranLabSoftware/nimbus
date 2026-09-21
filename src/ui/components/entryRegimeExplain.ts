import type { ImpactScenarioResult } from '../../physics/simulate.js';

/** The sentences the panel explains an impact's entry with. */
export type EntryRegimeExplainKey =
  | ImpactScenarioResult['entry']['regime']
  | 'STREWN_FIELD'
  | 'IRON_SWARM'
  | 'COMPLETE_AIRBURST_LOW';

/**
 * Which sentence explains an impact's entry. The regime alone told every
 * complete airburst that "no crater forms", beside the crater an iron's strewn
 * field digs — Sikhote-Alin's 26.7 m — and, since rules 756 to 763, the crater
 * a burst below its own fireball digs (B-103). A strewn field is told as one
 * whatever its regime: its swarm does not strike as one blow either.
 */
export function entryRegimeExplainKey(
  result: Pick<ImpactScenarioResult, 'entry' | 'crater'>
): EntryRegimeExplainKey {
  if (result.crater.origin === 'strewnField') return 'STREWN_FIELD';
  if (result.crater.origin === 'ironSwarm') return 'IRON_SWARM';
  if (result.crater.origin === 'lowBurst') return 'COMPLETE_AIRBURST_LOW';
  return result.entry.regime;
}
