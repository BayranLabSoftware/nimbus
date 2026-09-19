import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en.json';
import itLocale from '../i18n/locales/it.json';
import {
  ENTITY_CONTRACTS,
  SIM_ENTITY_PREFIXES,
  VISUAL_CONTRACTS,
  type VisualContract,
} from './visualContracts.js';
import { simulateVolcano } from '../physics/events/volcano/simulate.js';

/**
 * The contracts, read by something at last.
 *
 * `visualContracts.ts` lists what every shape on the globe is, which formula
 * it comes from and whether the drawing is faithful or a placeholder, and its
 * own header says the ids are there "so a runtime audit can verify each entity
 * was added". Nothing imported the file: thirty-four contracts, no reader.
 *
 * That is how a hazard came to be published, printed in the report, printed in
 * the panel with a citation — and drawn nowhere. A volcano's lahar ran forty
 * kilometres in the numbers and the globe showed an eruption with no mud in it
 * (B-054). The contract that would have named the gap did not exist either.
 *
 * What is checked here is what can be checked without a browser: that the
 * shapes a visitor reads a caption off carry one, in both languages, and that
 * every hazard a volcano publishes is a declared visual. Whether the entity is
 * actually added, and at the radius the model published, is the job of
 * `scripts/benchmark/globe-audit.ts`, which drives the real renderer.
 */

type Captions = Record<string, string>;
const captions = (bundle: typeof en): { short: Captions; label: Captions } => ({
  short: (bundle as unknown as { globe: { ringShort: Captions } }).globe.ringShort,
  label: (bundle as unknown as { globe: { ringLabel: Captions } }).globe.ringLabel,
});

/** The contracts a visitor meets as a captioned contour on the ground. */
const CAPTIONED: VisualContract['geometry'][] = ['point-source-ring', 'asymmetric-ellipse'];

/** The one contour that carries no caption of its own, and should not: the
 *  dashed upper-σ halo belongs to the ring it surrounds and says that ring's
 *  number. `addSigmaBandLine` adds a line and no label. */
const UNCAPTIONED_BY_DESIGN = new Set(['sigmaUpperBand']);

describe('the visual contracts', () => {
  const all = Object.values(VISUAL_CONTRACTS) as VisualContract[];

  it('name a formula and a quantity for every shape', () => {
    expect(all.length).toBeGreaterThan(30);
    for (const contract of all) {
      expect(contract.formula.trim().length, contract.id).toBeGreaterThan(0);
      expect(contract.quantity.trim().length, contract.id).toBeGreaterThan(0);
    }
  });

  it('give every captioned contour a caption, in English and in Italian', () => {
    const enCaps = captions(en);
    const itCaps = captions(itLocale);
    for (const contract of all) {
      if (!CAPTIONED.includes(contract.geometry)) continue;
      if (UNCAPTIONED_BY_DESIGN.has(contract.id)) continue;
      // The intensity contours are contracted once per geometry and captioned
      // once per intensity: mmi7Point and mmi7Stadium are both "mmi7".
      const key = contract.id.replace(/(Point|Stadium)$/, '');
      for (const [lang, caps] of [
        ['en', enCaps],
        ['it', itCaps],
      ] as const) {
        expect(caps.short[key], `${contract.id} short (${lang})`).toBeTruthy();
        expect(caps.label[key], `${contract.id} label (${lang})`).toBeTruthy();
      }
    }
  });

  it('cover every hazard a volcano publishes (B-054)', () => {
    const erupting = simulateVolcano({
      volumeEruptionRate: 500,
      totalEjectaVolume: 1e7,
      windSpeed: 8,
      laharVolume: 5e7,
    });
    // Each published reach, and the contract that says how it is drawn.
    const published: [string, number | undefined, string][] = [
      ['pyroclastic flow', erupting.pyroclasticRunout, 'pyroclasticRunout'],
      ['lahar', erupting.laharRunout, 'laharRunout'],
      ['ashfall plume', erupting.windAdvectedAshfall?.downwindRange, 'ashfallPlume'],
    ];
    for (const [what, value, id] of published) {
      expect(value, `${what} is published`).toBeGreaterThan(0);
      const contract = (VISUAL_CONTRACTS as Record<string, VisualContract | undefined>)[id];
      expect(contract, `${what} has a visual contract`).toBeDefined();
    }
  });

  it('give every entity the globe draws a contract, or a written reason for none', () => {
    // The rule this file opens with — every entity the globe adds references a
    // contract — was unenforceable until 19 September 2026, because the list of
    // entity prefixes lived in Globe.tsx and the contracts here, and nothing
    // compared them. Four families were drawn with none: the rupture trace, the
    // altitude beacons, the eruption column and the cascade's wave-front
    // indicator.
    expect(ENTITY_CONTRACTS.length).toBe(SIM_ENTITY_PREFIXES.length);
    for (const entry of ENTITY_CONTRACTS) {
      expect(entry.prefix.trim().length, 'a prefix is not empty').toBeGreaterThan(0);
      if (entry.contracts.length === 0) {
        expect(
          entry.why?.trim().length,
          `${entry.prefix} draws no quantity and says why`
        ).toBeGreaterThan(0);
        continue;
      }
      for (const id of entry.contracts) {
        expect(
          (VISUAL_CONTRACTS as Record<string, VisualContract | undefined>)[id],
          `${entry.prefix} → ${id}`
        ).toBeDefined();
      }
    }
    // And the other way: no contract is written for a shape nobody draws.
    const drawn = new Set(ENTITY_CONTRACTS.flatMap((e) => e.contracts));
    for (const id of Object.keys(VISUAL_CONTRACTS)) {
      expect(drawn.has(id as never), `${id} is drawn by some entity`).toBe(true);
    }
  });

  it('credit no source the physics itself disclaims', () => {
    // The audit of 19 September 2026: the pyroclastic ring credited "Sheridan
    // 1979 / Dade & Huppert 1998" for a relation whose own module calls those
    // papers "background, not the source of the equation", and the initial
    // radiation ring credited a Glasstone figure the module flags as unverified
    // and not a dose–range figure. A caption that names a paper for a project
    // value is the same defect as a label that does, and the page's labels were
    // corrected on 19 September while these were not.
    const pdc = VISUAL_CONTRACTS.pyroclasticRunout;
    expect(pdc.formula).toMatch(/Nimbus value|project/i);
    expect(pdc.formula).not.toMatch(/Dade & Huppert/);
    expect(VISUAL_CONTRACTS.radiationLD50.formula).toMatch(/project fit/i);
    expect(VISUAL_CONTRACTS.mushroomCloud.formula).toMatch(/project fit/i);
    // A shape that serves an impact and an explosion names both relations.
    for (const id of ['craterRim', 'thirdDegreeBurn', 'overpressure5psi'] as const) {
      expect(VISUAL_CONTRACTS[id].formula, id).toMatch(/impact:/);
      expect(VISUAL_CONTRACTS[id].formula, id).toMatch(/explosion:/);
    }
  });

  it('say how the rupture is drawn, and what the drawing does not know', () => {
    const trace = VISUAL_CONTRACTS.faultTrace;
    // The trace follows the strike the scenario gives, and the contract has to
    // say the three things the drawing does not know: the dip, the direction,
    // and that a gold-standard product draws the fault plane's surface
    // projection rather than a line.
    expect(trace.formula).toMatch(/strike/i);
    expect(trace.caveats.some((c) => /polygon|surface projection/i.test(c))).toBe(true);
    expect(trace.caveats.some((c) => /symmetric/i.test(c))).toBe(true);
    expect(VISUAL_CONTRACTS.mmi7Stadium.caveats.some((c) => /down-dip|cos\(dip\)/i.test(c))).toBe(
      true
    );
  });

  it('say out loud where the shape is a placeholder and the number is not', () => {
    // A flow that follows a valley drawn as a circle is a placeholder, and the
    // contract has to admit it: the reach is the model's, the shape is not the
    // mountain's. Both volcanic runouts carry that caveat.
    for (const id of ['pyroclasticRunout', 'laharRunout']) {
      const contract = (VISUAL_CONTRACTS as Record<string, VisualContract | undefined>)[id];
      expect(
        contract?.caveats.some((c) => /circle|placeholder|valley/i.test(c)),
        id
      ).toBe(true);
    }
  });
});
