import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import {
  C2_GUARDS,
  NO_WORSE_MARGIN_LN,
  T1_BOUNDS,
  crestWindowS,
  noWorseThanReference,
} from './farFieldReferenceRules.js';

/**
 * Rules 208 to 214, before any of them is run: the arithmetic they will be
 * judged by, and the one check that can be made without a single GeoClaw run —
 * that the window a C2 crest will be read in is the window the records were
 * read in. Every record's own crest was found inside its window by
 * construction, so if the transcription here were wrong, that would show.
 */

const RECORDS = fileURLToPath(new URL('../../../benchmark/dart/records.json', import.meta.url));
interface Rec {
  station: string;
  distanceKm: number;
  crestAfterS?: number;
  keptBy: Record<string, boolean>;
}
interface Ev {
  id: string;
  keptBy: Record<string, boolean>;
  records: Rec[];
}
const set = JSON.parse(readFileSync(RECORDS, 'utf8')) as { variants: string[]; events: Ev[] };
const kept = set.events
  .filter((e) => e.keptBy['bracketed-2cm'] === true)
  .flatMap((e) =>
    e.records.filter((r) => r.keptBy['bracketed-2cm'] === true).map((r) => [e, r] as const)
  );

describe('the bar the far wave will be held to', () => {
  it('carries T1’s three bounds as the gold standard writes them', () => {
    expect(T1_BOUNDS.medianEventFactor).toBe(1.25);
    expect(T1_BOUNDS.sigmaLn).toBe(0.5);
    expect(T1_BOUNDS.farFieldFactor).toBe(1.5);
    expect(T1_BOUNDS.farFieldFromKm).toBe(7_000);
  });

  it('reads “no worse than the reference” as a quarter, either side of zero', () => {
    expect(NO_WORSE_MARGIN_LN).toBeCloseTo(0.2231, 4);
    // Ours 1.00×, the reference 0.60×: we are nearer the records, so we pass.
    expect(noWorseThanReference(0, Math.log(0.6))).toBe(true);
    // Ours 2.00×, the reference 1.00×: we are a factor of two out where the
    // reference is on the nose, so we do not.
    expect(noWorseThanReference(Math.log(2), 0)).toBe(false);
    // The sign of neither matters: a reference low by two is as far out as one
    // high by two.
    expect(noWorseThanReference(Math.log(2), Math.log(0.5))).toBe(true);
    expect(noWorseThanReference(Math.log(2), Math.log(2))).toBe(true);
    // Exactly a quarter worse still passes; a hair more does not.
    expect(noWorseThanReference(Math.log(1.25), 0)).toBe(true);
    expect(noWorseThanReference(Math.log(1.2501), 0)).toBe(false);
  });

  it('keeps rule 210’s guards where a harness cannot soften them', () => {
    expect(C2_GUARDS).toEqual({
      convergenceTolerance: 0.25,
      minimumGaugeDepthM: -50,
      minimumEvents: 7,
      minimumRecords: 60,
    });
    // The column may not be scored on a handful of gauges: seven of nine
    // events, and more than half the records.
    expect(C2_GUARDS.minimumRecords / kept.length).toBeGreaterThan(0.5);
  });

  it('reads a crest in the window the records were read in, on all 113 of them', () => {
    expect(kept.length).toBe(113);
    for (const [ev, rec] of kept) {
      const w = crestWindowS(rec.distanceKm);
      const at = rec.crestAfterS;
      expect(at, `${ev.id} ${rec.station}`).toBeDefined();
      expect(at!, `${ev.id} ${rec.station} above the floor`).toBeGreaterThanOrEqual(w.fromS);
      expect(at!, `${ev.id} ${rec.station} below the ceiling`).toBeLessThanOrEqual(w.toS);
    }
  });

  it('never opens the window before the Rayleigh waves have gone by', () => {
    // The protocol's floor: never before 20 min, however near the buoy.
    expect(crestWindowS(10).fromS).toBe(20 * 60);
    expect(crestWindowS(2_000).fromS).toBe(2_000_000 / 250 - 1_800);
  });
});
