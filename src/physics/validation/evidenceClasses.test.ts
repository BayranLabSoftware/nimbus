import { readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import en from '../../i18n/locales/en.json';
import it_ from '../../i18n/locales/it.json';
import { EIEP_GRID } from './eiepGrid.js';
import { EIEP_REFERENCE } from './eiepReference.js';
import {
  EVIDENCE,
  EVIDENCE_CLASSES,
  EVIDENCE_QUANTITIES,
  EVIDENCE_REFERENCE_QUANTITIES,
  type EvidenceQuantity,
} from './evidenceClasses.js';
import { bandOf, epsilonOf, runLevelA, type LevelARun } from './levelA.js';

/**
 * The evidence table (phase 1 of the plan of 22 September 2026) states
 * figures — how many impacts, how many readings, the widest gap, the bolides'
 * median error — and a class is only as honest as the figures it rests on. So
 * every figure is recomputed here from its source, and the classes are held
 * to the scale's own conditions.
 */

const breathe = (): Promise<void> =>
  new Promise((resolve) => {
    setImmediate(resolve);
  });

let levelA: LevelARun;

function referenceOf(quantity: EvidenceQuantity): {
  impacts: number;
  readings: number;
  excellentPercent: number;
  pastTen: number;
} {
  const names = EVIDENCE_REFERENCE_QUANTITIES[quantity] ?? [];
  const pairs = levelA.pairs.filter((r) => names.includes(r.quantity));
  const impacts = new Set(pairs.map((p) => p.row)).size;
  const excellent = pairs.filter((p) => bandOf(epsilonOf(p)) === 'excellent').length;
  return {
    impacts,
    readings: pairs.length,
    // Rounded down to a tenth of a per cent, as the table states it.
    excellentPercent: Math.floor((excellent / pairs.length) * 1_000) / 10,
    pastTen: pairs.filter((p) => bandOf(epsilonOf(p)) === 'audit').length,
  };
}

describe('the evidence behind each number an impact prints', () => {
  beforeAll(async () => {
    levelA = await runLevelA([...EIEP_REFERENCE, ...EIEP_GRID], breathe);
  }, 900_000);

  it('names every family once, and a class for each', () => {
    expect(Object.keys(EVIDENCE).sort()).toEqual([...EVIDENCE_QUANTITIES].sort());
    for (const q of EVIDENCE_QUANTITIES) {
      expect(EVIDENCE[q].quantity).toBe(q);
      expect(EVIDENCE_CLASSES).toContain(EVIDENCE[q].klass);
    }
  });

  it('states level A’s comparison as it is computed today, on both grids', () => {
    for (const q of EVIDENCE_QUANTITIES) {
      const stated = EVIDENCE[q].reference;
      if (EVIDENCE_REFERENCE_QUANTITIES[q] === undefined) {
        expect(stated, `${q} states a comparison it has no quantity for`).toBeNull();
        continue;
      }
      expect(stated, q).toEqual(referenceOf(q));
    }
  });

  it('gives class A only where every reading past the audit bar has its documented cause', () => {
    // The scale's own condition: over 10 % a case is audited or its difference
    // documented, so a family with an undocumented case is not "implementation
    // verified" until it has been.
    for (const q of EVIDENCE_QUANTITIES) {
      const record = EVIDENCE[q];
      if (record.klass !== 'A') continue;
      expect(record.reference, `${q} is A with no reference check`).not.toBeNull();
      expect(record.reference?.readings ?? 0, q).toBeGreaterThan(0);
      const names = EVIDENCE_REFERENCE_QUANTITIES[q] ?? [];
      const open = levelA.audits.filter(
        (a) => names.includes(a.pair.quantity) && a.difference === null
      );
      expect(open, q).toEqual([]);
    }
  });

  it('states the bolides as the validation report measures them', () => {
    const report = JSON.parse(
      readFileSync(new URL('../../../docs/VALIDATION_REPORT.json', import.meta.url), 'utf8')
    ) as {
      calibration: {
        fireball: {
          events: { bolides: number };
          meetsBar: boolean;
          readings: Record<string, { medianAbsoluteErrorKm: number }>;
        };
      };
    };
    const fireball = report.calibration.fireball;
    const observed = EVIDENCE.entry.observed;
    expect(observed).not.toBeNull();
    expect(observed?.events).toBe(fireball.events.bolides);
    expect(observed?.medianError).toBe(
      Math.round((fireball.readings.default?.medianAbsoluteErrorKm ?? Number.NaN) * 10) / 10
    );
    expect(observed?.meetsBar).toBe(fireball.meetsBar);
  });

  it('never lets a family that misses its observations above class A', () => {
    // B is "validated within stated domain": a family whose observations miss
    // their bar cannot hold it.
    for (const q of EVIDENCE_QUANTITIES) {
      const record = EVIDENCE[q];
      if (record.observed !== null && !record.observed.meetsBar) {
        expect(['A', 'exploratory'], q).toContain(record.klass);
      }
    }
  });

  it('has the words of every class and every family in both languages', () => {
    for (const [name, locale] of [
      ['en', en],
      ['it', it_],
    ] as const) {
      const e = (locale as { evidence: Record<string, unknown> }).evidence as {
        class: Record<string, { label: string; short: string; meaning: string }>;
        quantity: Record<
          string,
          { name: string; summary: string; domain: string; error: string; missing: string }
        >;
      };
      for (const k of EVIDENCE_CLASSES) {
        expect(e.class[k]?.label, `${name} ${k}`).toBeTruthy();
        expect(e.class[k]?.short, `${name} ${k}`).toBeTruthy();
        expect(e.class[k]?.meaning, `${name} ${k}`).toBeTruthy();
      }
      for (const q of EVIDENCE_QUANTITIES) {
        const words = e.quantity[q];
        expect(words?.name, `${name} ${q}`).toBeTruthy();
        expect(words?.summary, `${name} ${q}`).toBeTruthy();
        expect(words?.domain, `${name} ${q}`).toBeTruthy();
        expect(words?.missing, `${name} ${q}`).toBeTruthy();
        // A family with no reference check must say in words why its error is
        // not established; a checked one may leave it to the figures.
        if (EVIDENCE[q].klass !== 'A') expect(words?.error, `${name} ${q}`).toBeTruthy();
      }
    }
  });
});
