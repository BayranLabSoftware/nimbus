import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import {
  IMPACT_PRESETS,
  simulateImpact,
  type ImpactScenarioResult,
} from '../../physics/simulate.js';
import { thermalHorizonRadius } from '../../physics/casualties.js';
import { impactFireballRadius } from '../../physics/effects/blastWave.js';
import {
  fieldSourceOf,
  absentImpactLayers,
  availableImpactLayers,
  IMPACT_LAYER_ORDER,
  markGroundField,
} from './impactFieldMap.js';
import { impactOverpressureAt } from '../../physics/events/impact/impactField.js';
import { programSeismicAttenuation } from '../../physics/events/impact/seismic.js';
import { degreesToRadians, deg, J, kgPerM3, m, mps } from '../../physics/units.js';
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
        for (const mark of layer.marks) {
          expect(STATES, `${name} ${layer.id} ${mark.id}`).toContain(mark.state);
          expect(mark.state).not.toBe('computed');
          for (const text of [
            mark.card.quantity,
            mark.card.unit,
            mark.card.source,
            mark.card.extent,
          ])
            expect(text.length, `${name} ${layer.id} ${mark.id}`).toBeGreaterThan(0);
          expect(EPISTEMIC).toContain(mark.card.state);
          expect(BEYOND).toContain(mark.card.beyond);
        }
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
    // Tunguska's heat is drawn, below its main threshold (rule 1031 (d)).
    expect(tunguska.find((a) => a.id === 'thermal')).toBeUndefined();
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

const layersOf = (key: keyof typeof IMPACT_PRESETS) =>
  availableImpactLayers(simulateImpact(IMPACT_PRESETS[key].input), ctx);

describe('rule 1030: what the globe draws past a field’s edge', () => {
  it('draws only past the edge, and writes only a state’s words', () => {
    for (const [name, r] of CASES)
      for (const layer of availableImpactLayers(r, ctx))
        for (const mark of layer.marks) {
          expect(mark.fromM, `${name} ${layer.id}`).toBeGreaterThanOrEqual(
            (layer.edge?.atM ?? 0) * (1 - 1e-9)
          );
          expect(mark.toM).toBeGreaterThanOrEqual(mark.fromM);
          const words =
            mark.state === 'notModelled'
              ? `globe.impactMap.mark.label.notModelled.${layer.id}`
              : layer.id === 'ejecta'
                ? 'globe.impactMap.mark.label.belowThresholdEjecta'
                : mark.id === 'halo'
                  ? 'globe.impactMap.mark.label.belowMain'
                  : `globe.impactMap.mark.label.${mark.state}`;
          expect(mark.label).toBe(words);
        }
  });

  it('(2) a band below the threshold runs one decade below the edge’s value', () => {
    const meteor = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
    const source = fieldSourceOf(meteor);
    const blast = availableImpactLayers(meteor, ctx).find((l) => l.id === 'overpressure');
    const band = blast?.marks.find((mk) => mk.state === 'belowThreshold');
    expect(band).toBeDefined();
    if (blast?.edge == null || band === undefined) return;
    expect(band.fromM).toBe(blast.edge.atM);
    const atEdge = impactOverpressureAt(source, band.fromM);
    expect(impactOverpressureAt(source, band.toM) / atEdge).toBeCloseTo(0.1, 6);
    // A magnitude falls a decade of amplitude by one unit.
    const shaking = availableImpactLayers(meteor, ctx).find((l) => l.id === 'shaking');
    const shake = shaking?.marks.find((mk) => mk.state === 'belowThreshold');
    const M = meteor.seismic.magnitude ?? 0;
    if (shake === undefined) throw new Error('no band on the shaking');
    expect(M - programSeismicAttenuation(shake.fromM / 1_000)).toBeCloseTo(3, 6);
    expect(M - programSeismicAttenuation(shake.toM / 1_000)).toBeCloseTo(2, 6);
  });

  it('(3)–(4) at the fireball’s horizon, a limit and an area not computed — no band past it', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const horizon = thermalHorizonRadius(impactFireballRadius(J(r.impactor.kineticEnergy)));
    const heat = availableImpactLayers(r, ctx).find((l) => l.id === 'thermal');
    expect(heat?.marks.map((mk) => mk.state)).toEqual(['modelLimit', 'notModelled']);
    const [line, area] = heat?.marks ?? [];
    expect(line?.fromM).toBe(horizon);
    expect(area?.fromM).toBe(horizon);
    expect(area?.toM).toBeCloseTo(Math.PI * 6_371_000, -4);
    expect(area?.card.state).toBe('outOfDomain');
    // Popigai's band meets the horizon first: it stops there, and the limit
    // and the area follow.
    const popigai = layersOf('POPIGAI').find((l) => l.id === 'thermal');
    expect(popigai?.marks.map((mk) => mk.state)).toEqual([
      'belowThreshold',
      'modelLimit',
      'notModelled',
    ]);
    const [band, limit] = popigai?.marks ?? [];
    expect(band?.toM).toBeCloseTo(limit?.fromM ?? 0, 3);
    expect(band?.card.beyond).toBe('notModelled');
  });

  it('draws no band where the field is not a quantity that goes on falling', () => {
    // I3's agreement: past the band's upper edge a computed no.
    const agreement = layersOf('TUNGUSKA').find((l) => l.id === 'uncertainty');
    expect(agreement?.edge?.beyond).toBe('computedZero');
    expect(agreement?.marks).toEqual([]);
  });

  it('paints the band fading to nothing, the area hatched, the line nothing', () => {
    const marks = layersOf('POPIGAI').find((l) => l.id === 'thermal')?.marks ?? [];
    const [band, line, area] = marks;
    if (band === undefined || line === undefined || area === undefined) throw new Error('marks');
    const shade = markGroundField(band);
    const alphas = [0, 0.25, 0.5, 0.75, 0.999].map(
      (u) => shade?.colorAt(band.fromM * Math.pow(band.toM / band.fromM, u))?.[3] ?? 0
    );
    for (let i = 1; i < alphas.length; i++) expect(alphas[i] ?? 0).toBeLessThan(alphas[i - 1] ?? 0);
    expect(alphas[alphas.length - 1] ?? 1).toBeLessThanOrEqual(1);
    expect(shade?.holeM).toBe(band.fromM);
    expect(markGroundField(line)).toBeNull();
    const hatch = markGroundField(area);
    expect(hatch?.hatchedAt?.(area.fromM * 2)).toBe(true);
    expect(hatch?.holeM).toBe(area.fromM);
  });
});

describe('rule 1031 (a): the heat at its horizon', () => {
  it('writes the thresholds pressed against the horizon as one callout, not an isoline', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHICXULUB.input);
    const horizon = thermalHorizonRadius(impactFireballRadius(J(r.impactor.kineticEnergy)));
    const heat = availableImpactLayers(r, ctx).find((l) => l.id === 'thermal');
    const atLimit = heat?.isolines.filter((l) => l.state === 'modelLimit') ?? [];
    expect(atLimit).toHaveLength(1);
    const callout = atLimit[0];
    expect(callout?.members?.length).toBe(4);
    expect(callout?.atLimit).toBe('globe.impactMap.mark.label.compressed{"lo":"5","hi":"20"}');
    // No isoline of damage is left within 1 % of the horizon.
    for (const line of heat?.isolines ?? [])
      if (line.state === 'computed')
        expect(Math.abs(line.radiusM - horizon)).toBeGreaterThan(0.01 * horizon);
    expect(heat?.notes.map((n) => n.text)).toContain('globe.impactMap.note.thermalNotModelled');
    // The card reads each threshold, not the joined line (rule 1037 (b)).
    expect(heat?.card.extent).toMatch(/"outer":"5","inner":"20"/);
  });

  it('leaves a heat that stops short of its horizon as it was', () => {
    const heat = layersOf('METEOR_CRATER').find((l) => l.id === 'thermal');
    expect(heat?.isolines.every((l) => l.state === 'computed')).toBe(true);
    expect(heat?.notes.map((n) => n.text)).not.toContain('globe.impactMap.note.thermalNotModelled');
  });
});

describe('rule 1031 (b): the ejecta past the 1 mm isopach', () => {
  it('fades out a decade thinner, never said to continue, and the legend states the cut', () => {
    for (const key of ['CHICXULUB', 'METEOR_CRATER'] as const) {
      const r = simulateImpact(IMPACT_PRESETS[key].input);
      const ejecta = availableImpactLayers(r, ctx).find((l) => l.id === 'ejecta');
      const band = ejecta?.marks.find((mk) => mk.state === 'belowThreshold');
      expect(band?.label, key).toBe('globe.impactMap.mark.label.belowThresholdEjecta');
      expect(band?.fromM).toBe(r.ejecta.blanketEdge1mm);
      // The r⁻³ law: a tenth of the thickness is 10^(1/3) times as far.
      expect((band?.toM ?? 0) / (band?.fromM ?? 1)).toBeCloseTo(Math.cbrt(10), 3);
      expect(ejecta?.notes.map((n) => n.text)).toContain('globe.impactMap.note.ejectaShown');
    }
  });
});

describe('rule 1031 (c): the low overpressure', () => {
  it('draws Chelyabinsk’s 1.6 kPa as its own exploratory layer, outside the structural scale', () => {
    const r = simulateImpact(IMPACT_PRESETS.CHELYABINSK.input);
    const low = availableImpactLayers(r, ctx).find((l) => l.id === 'lowOverpressure');
    expect(low).toBeDefined();
    // 1.6 kPa at the ground: the 1 kPa line, not the 3 kPa one.
    expect(low?.isolines.map((l) => l.id)).toEqual(['low-1']);
    expect(low?.evidence.klass).toBe('exploratory');
    expect(low?.card.state).toBe('exploratory');
    const notes = low?.notes.map((n) => n.text) ?? [];
    for (const key of ['lowThresholds', 'lowWhat', 'lowValidation', 'lowNot'])
      expect(notes).toContain(`globe.impactMap.note.${key}`);
    // The structural layer still says it draws nothing, and why.
    expect(absentImpactLayers(r, ctx).find((a) => a.id === 'overpressure')?.beyond).toBe(
      'belowThreshold'
    );
    // Its lines stand where the field reads 1 kPa.
    const line = low?.isolines[0];
    expect(impactOverpressureAt(fieldSourceOf(r), line?.radiusM ?? 0) / 1_000).toBeCloseTo(1, 6);
  });
});

describe('rule 1031 (d): below the main threshold', () => {
  const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);

  it('keeps Tunguska’s heat, a faint halo out to the first degree’s reach', () => {
    const heat = availableImpactLayers(tunguska, ctx).find((l) => l.id === 'thermal');
    expect(heat).toBeDefined();
    expect(heat?.state).toBe('belowThreshold');
    expect(heat?.isolines).toEqual([]);
    expect(heat?.marks).toHaveLength(1);
    const halo = heat?.marks[0];
    expect(halo?.fromM).toBe(0);
    expect(halo?.toM).toBe(tunguska.entry.flashBurnRadii.firstDegree);
    expect(halo?.card.beyond).toBe('belowThreshold');
    expect(heat?.notes.map((n) => n.text)).toContain(
      'globe.impactMap.note.thermalBelowMain{"reach":"12,1 km"}'
    );
    const shade = halo === undefined ? null : markGroundField(halo);
    expect(shade?.colorAt(1_000)?.[3]).toBeGreaterThan(0);
    expect(shade?.colorAt((halo?.toM ?? 0) * 0.999)?.[3] ?? 0).toBeLessThan(
      shade?.colorAt(1_000)?.[3] ?? 0
    );
  });

  it('says what was observed apart, only for the event it was observed at', () => {
    const noted = (preset: string | null): string[] =>
      availableImpactLayers(tunguska, { ...ctx, preset })
        .find((l) => l.id === 'thermal')
        ?.notes.map((n) => n.text) ?? [];
    expect(noted('TUNGUSKA')).toContain('globe.impactMap.observed.tunguskaThermal');
    expect(noted(null)).not.toContain('globe.impactMap.observed.tunguskaThermal');
  });
});
