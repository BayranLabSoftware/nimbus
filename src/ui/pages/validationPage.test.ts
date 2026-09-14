import { describe, expect, it } from 'vitest';
import en from '../../i18n/locales/en.json';
import it_ from '../../i18n/locales/it.json';
import report from '../../../docs/VALIDATION_REPORT.json';
import { VALIDATION_GAPS } from './validationGaps.js';

/**
 * The validation page reads its figures from the generated report and
 * its words from the locales. The report grows on its own — a new
 * event, a new cause, a new quantity — and the page must never answer
 * a new row with a raw key. So every name the data can hand the page
 * is held to having words in both languages.
 */

type Tree = Record<string, unknown>;

function lookup(tree: Tree, path: string): unknown {
  return path.split('.').reduce<unknown>((node, key) => {
    if (node === null || typeof node !== 'object') return undefined;
    return (node as Tree)[key];
  }, tree);
}

const LOCALES: [string, Tree][] = [
  ['en', en],
  ['it', it_],
];

function expectText(path: string): void {
  for (const [name, tree] of LOCALES) {
    const value = lookup(tree, path);
    expect(typeof value === 'string' && value.length > 0, `${name}: ${path}`).toBe(true);
  }
}

describe('the validation page has words for everything its data can say', () => {
  it('every cause a toll row names', () => {
    const causes = new Set(
      report.calibration.tolls.map((r) => r.cause).filter((c): c is string => c !== null)
    );
    expect(causes.size).toBeGreaterThan(0);
    for (const c of causes) {
      expectText(`validation.causes.${c}.label`);
      expectText(`validation.causes.${c}.body`);
    }
  });

  it('every quantity an anchor measures, and every family it belongs to', () => {
    for (const a of report.calibration.anchors) {
      for (const q of a.quantities) expectText(`validation.quantity.${q}`);
      expectText(`simulator.eventTypes.${a.eventType}`);
    }
  });

  it('every fixed line of the page', () => {
    for (const key of [
      'title',
      'subtitle',
      'provenance',
      'provenanceDirty',
      'provenanceUnknown',
      'fullReport',
      'tolls.title',
      'tolls.body',
      'causesTitle',
      'causesBody',
      'waves.title',
      'waves.globeNote',
      'footprint.bias',
      'footprint.biasOff',
      'footprint.invented',
      'interpolation.worst',
      'anchors.title',
      'gaps.title',
      'verdict.inside',
      'verdict.misses',
      'standing.gated',
      'standing.declared',
      'scorecard.title',
      'scorecard.body',
      'scorecard.note',
      'scorecard.scored',
      'scorecard.insideOf',
      'scorecard.acceptedOf',
      'scorecard.table.events',
      'scorecard.table.rows',
      'scorecard.table.bias',
      'scorecard.table.scatter',
      'scorecard.table.inside',
      'scorecard.table.band',
      'scorecard.quantity.toll',
      'scorecard.quantity.wave',
      'scorecard.quantity.plume',
    ]) {
      expectText(`validation.${key}`);
    }
    for (const gap of VALIDATION_GAPS) {
      expectText(`validation.gaps.${gap}.item`);
      expectText(`validation.gaps.${gap}.note`);
    }
  });

  it('every row that misses its record carries a cause the page can explain', () => {
    for (const r of report.calibration.tolls) {
      if (r.contains) continue;
      expect(r.cause, `${r.event} misses without a cause`).not.toBeNull();
    }
  });
});
