import { describe, expect, it } from 'vitest';

import en from '../i18n/locales/en.json';
import itLocale from '../i18n/locales/it.json';
import { VISUAL_CONTRACTS, type VisualContract } from './visualContracts.js';
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
