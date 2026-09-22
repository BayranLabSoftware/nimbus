import { beforeAll, describe, expect, it } from 'vitest';
import {
  EVIDENCE,
  EVIDENCE_CLASSES,
  EVIDENCE_QUANTITIES,
} from '../physics/validation/evidenceClasses.js';
import { safeRunImpact } from '../physics/validation/safeRun.js';
import { availableImpactLayers } from '../scene/globe/impactFieldMap.js';
import { buildImpactReport } from '../ui/pages/report/impactReportModel.js';
import { buildSealScenarios, sealTranslators, type SealTranslators } from './impactSeal.js';

/**
 * Phase 1's proof (the plan of 22 September 2026): no number an impact prints
 * appears without its class of evidence. Read on the seal's own 308 scenarios
 * — every preset, and three hundred drawn on land, on a coast and at sea — in
 * both languages: every layer the globe draws, every row of the report but the
 * reader's own inputs, and every key figure.
 *
 * The panel is held to the same in the end-to-end suite, on the page itself.
 */

describe('every number an impact prints carries its class of evidence', () => {
  let t: SealTranslators;
  beforeAll(async () => {
    t = await sealTranslators();
  });

  it('on the globe, in the report and in its key figures, for every sealed scenario', () => {
    let layers = 0;
    let rows = 0;
    for (const scenario of buildSealScenarios()) {
      const run = safeRunImpact(scenario.input);
      if (!run.ok) continue;
      for (const language of ['en', 'it'] as const) {
        const tr = t[language];
        for (const layer of availableImpactLayers(run.result, { t: tr, language })) {
          layers++;
          expect(EVIDENCE_QUANTITIES, `${scenario.id} ${layer.id}`).toContain(
            layer.evidence.quantity
          );
          expect(layer.evidence.klass).toBe(EVIDENCE[layer.evidence.quantity].klass);
          expect(layer.evidence.label.length).toBeGreaterThan(0);
          expect(layer.evidence.summary.length).toBeGreaterThan(0);
        }
        const report = buildImpactReport(run.result, {
          t: tr,
          language,
          location: null,
          evaluatedAt: null,
          timeZone: 'UTC',
          presetName: scenario.presetName,
          uncertaintyKey: null,
          casualties: null,
          nearest: null,
          extras: { bathymetricTsunami: false, monteCarlo: false, predictiveBand: false },
        });
        for (const group of report.groups) {
          if (group.id === 'scenario') continue;
          for (const row of group.rows) {
            rows++;
            expect(row.evidence, `${scenario.id} ${group.id}.${row.id}`).toBeDefined();
          }
        }
        for (const key of report.keyFigures) {
          expect(EVIDENCE_QUANTITIES, `${scenario.id} key ${key.id}`).toContain(key.evidence);
        }
        expect(report.evidence.map((e) => e.quantity)).toEqual([...EVIDENCE_QUANTITIES]);
        for (const e of report.evidence) expect(EVIDENCE_CLASSES).toContain(e.klass);
      }
    }
    // The read covered something: a test that saw nothing proves nothing.
    expect(layers).toBeGreaterThan(1_000);
    expect(rows).toBeGreaterThan(10_000);
  }, 120_000);
});
