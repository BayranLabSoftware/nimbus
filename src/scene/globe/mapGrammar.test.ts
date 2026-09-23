import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import {
  IMPACT_PRESETS,
  simulateImpact,
  type ImpactScenarioResult,
} from '../../physics/simulate.js';
import { degreesToRadians, deg, kgPerM3, m, mps } from '../../physics/units.js';
import { absentImpactLayers, availableImpactLayers, IMPACT_LAYER_ORDER } from './impactFieldMap.js';
import type { BeyondEdge, EpistemicState, MapState } from './mapGrammarRules.js';

/** Rule 1032: the grammar's tests, on the presets and a body out of the
 *  crater's domain. */
const t = ((key: string, params?: Record<string, unknown>) =>
  params === undefined ? key : `${key}${JSON.stringify(params)}`) as unknown as TFunction;
const ctx = { t, language: 'it' };

const slowStone = simulateImpact({
  impactorDiameter: m(0.5),
  impactVelocity: mps(14_000),
  impactorDensity: kgPerM3(3_000),
  targetDensity: kgPerM3(2_700),
  impactAngle: degreesToRadians(deg(22.5)),
  surfaceGravity: 9.806_65,
});
const CASES: [string, ImpactScenarioResult][] = [
  ...Object.entries(IMPACT_PRESETS).map(
    ([k, p]) => [k, simulateImpact(p.input)] as [string, ImpactScenarioResult]
  ),
  ['out of the domain', slowStone],
];
const STATES: MapState[] = ['computed', 'belowThreshold', 'modelLimit', 'notModelled'];
const EPISTEMIC: EpistemicState[] = ['verified', 'exploratory', 'diagnostic', 'outOfDomain'];
const BEYOND: BeyondEdge[] = ['computedZero', 'belowThreshold', 'notModelled', 'notApplicable'];

describe('rule 1032: the grammar of the impact map', () => {
  it('(a) every layer and isoline has one state, and a card with its five fields', () => {
    for (const [name, r] of CASES)
      for (const layer of availableImpactLayers(r, ctx)) {
        expect(STATES, `${name} ${layer.id}`).toContain(layer.state);
        for (const line of layer.isolines) expect(STATES).toContain(line.state);
        const c = layer.card;
        for (const text of [c.quantity, c.unit, c.source, c.extent])
          expect(text.length, `${name} ${layer.id}`).toBeGreaterThan(0);
        expect(EPISTEMIC).toContain(c.state);
        expect(BEYOND).toContain(c.beyond);
      }
  });

  it('(b) every field says what lies beyond its edge', () => {
    for (const [name, r] of CASES)
      for (const layer of availableImpactLayers(r, ctx)) {
        if (layer.field === null) continue;
        expect(layer.edge, `${name} ${layer.id}`).not.toBeNull();
        expect(layer.edge?.atM).toBeGreaterThan(0);
        expect(BEYOND).toContain(layer.edge?.beyond);
        expect(layer.card.beyond).toBe(layer.edge?.beyond);
      }
    // Chicxulub's flash stops at its fireball's horizon: a limit of the model.
    const chicxulub = availableImpactLayers(simulateImpact(IMPACT_PRESETS.CHICXULUB.input), ctx);
    const heat = chicxulub.find((l) => l.id === 'thermal');
    expect(heat?.edge).toMatchObject({ kind: 'modelLimit', beyond: 'notModelled' });
  });

  it('(c) a layer that draws nothing says why — never simply missing', () => {
    for (const [name, r] of CASES) {
      const drawn = availableImpactLayers(r, ctx).map((l) => l.id);
      const absent = absentImpactLayers(r, ctx);
      expect([...drawn, ...absent.map((a) => a.id)].sort(), name).toEqual(
        [...IMPACT_LAYER_ORDER].sort()
      );
      for (const a of absent) {
        expect(BEYOND).toContain(a.beyond);
        expect(a.why.length).toBeGreaterThan(0);
      }
    }
    const chelyabinsk = absentImpactLayers(simulateImpact(IMPACT_PRESETS.CHELYABINSK.input), ctx);
    expect(chelyabinsk.find((a) => a.id === 'overpressure')?.beyond).toBe('belowThreshold');
    const tunguska = absentImpactLayers(simulateImpact(IMPACT_PRESETS.TUNGUSKA.input), ctx);
    expect(tunguska.find((a) => a.id === 'thermal')?.beyond).toBe('belowThreshold');
    expect(tunguska.find((a) => a.id === 'ejecta')?.beyond).toBe('computedZero');
  });

  it('(d) drawing a map changes no physical number', () => {
    for (const [name, r] of CASES) {
      const before = JSON.stringify(r);
      availableImpactLayers(r, ctx);
      absentImpactLayers(r, ctx);
      expect(JSON.stringify(r), name).toBe(before);
    }
  });

  it('(e) out of the crater’s domain no effect of a crater comes back', () => {
    expect(slowStone.crater.state).toBe('outOfDomain');
    expect(slowStone.damage.craterRim).toBeNaN();
    expect(slowStone.seismic.magnitude).toBeNull();
    expect(slowStone.seismic.liquefactionRadius).toBe(0);
    const drawn = availableImpactLayers(slowStone, ctx).map((l) => l.id);
    expect(drawn).not.toContain('ejecta');
    expect(drawn).not.toContain('shaking');
    const absent = absentImpactLayers(slowStone, ctx);
    expect(absent.find((a) => a.id === 'ejecta')?.beyond).toBe('notModelled');
    expect(absent.find((a) => a.id === 'shaking')?.beyond).toBe('notModelled');
  });
});
