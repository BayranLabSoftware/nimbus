import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact, type ImpactScenarioInput } from '../simulate.js';
import { degreesToRadians, deg, kgPerM3, m, mps } from '../units.js';
import { CRATER_DOMAIN_MIN_SPEED_MS } from './craterDomainRules.js';

/**
 * Rules 945 to 952: the crater below the hypervelocity domain. Each case runs
 * both branches explicitly, so the test holds whichever is the default.
 */
const both = (input: ImpactScenarioInput) => ({
  legacy: simulateImpact({ ...input, craterDomain: 'legacy' }),
  domain: simulateImpact({ ...input, craterDomain: 'hypervelocity' }),
});

/** A sub-metre stone at a shallow angle, kept whole to the ground (B-124). */
const slowStone: ImpactScenarioInput = {
  impactorDiameter: m(0.5),
  impactVelocity: mps(14_000),
  impactorDensity: kgPerM3(3_000),
  targetDensity: kgPerM3(2_700),
  impactAngle: degreesToRadians(deg(22.5)),
  surfaceGravity: 9.806_65,
};

describe('rules 945 to 952: the crater’s domain', () => {
  it('B-124: a body reaching the ground below 5 km/s has no crater number, and is never "none"', () => {
    const { legacy, domain } = both(slowStone);
    expect(legacy.entry.endVelocity).toBeLessThan(CRATER_DOMAIN_MIN_SPEED_MS);
    expect(legacy.crater.finalDiameter).toBeGreaterThan(0);
    expect(domain.crater.state).toBe('outOfDomain');
    expect(domain.crater.finalDiameter).toBeNaN();
    expect(domain.crater.transientDiameter).toBeNaN();
    expect(domain.crater.depth).toBeNaN();
    expect(domain.damage.craterRim).toBeNaN();
    expect(domain.ejecta.blanketEdge1m).toBeNaN();
    expect(domain.ejecta.blanketEdge1mm).toBeNaN();
  });

  it('rule 948: nothing of the entry, and no effect of the energy, moves', () => {
    const { legacy, domain } = both(slowStone);
    expect(domain.entry).toEqual(legacy.entry);
    expect(domain.seismic).toEqual(legacy.seismic);
    expect(domain.firestorm).toEqual(legacy.firestorm);
    const { craterRim: _a, ...legacyRings } = legacy.damage;
    const { craterRim: _b, ...domainRings } = domain.damage;
    expect(domainRings).toEqual(legacyRings);
  });

  it('rule 948: a crater computed at 5 km/s or more is the same to the bit', () => {
    for (const id of ['METEOR_CRATER', 'CHICXULUB'] as const) {
      const { legacy, domain } = both(IMPACT_PRESETS[id].input);
      expect(domain.crater.state, id).toBe('computed');
      expect(domain.crater, id).toEqual({ ...legacy.crater, state: 'computed' });
      expect(domain.ejecta, id).toEqual(legacy.ejecta);
    }
  });

  it('rule 947: an airburst stays "none", and an iron’s strewn field keeps its own law', () => {
    const tunguska = both(IMPACT_PRESETS.TUNGUSKA.input);
    expect(tunguska.domain.crater.state).toBe('none');
    expect(tunguska.domain.crater).toEqual(tunguska.legacy.crater);
    const sikhote = both(IMPACT_PRESETS.SIKHOTE_ALIN_1947.input);
    expect(sikhote.domain.crater.origin).toBe('strewnField');
    expect(sikhote.domain.crater.state).toBe('computed');
    expect(sikhote.domain.crater.finalDiameter).toBe(sikhote.legacy.crater.finalDiameter);
  });
});
