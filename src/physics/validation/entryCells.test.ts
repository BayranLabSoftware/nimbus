import { describe, expect, it } from 'vitest';
import { IMPACT_PRESETS, simulateImpact } from '../simulate.js';
import {
  ENTRY_CELLS,
  ENTRY_CELLS_ANGLE_DEG,
  ENTRY_CELLS_DENSITY,
  entryCellVerdict,
  type EntryCellInput,
} from './entryCells.js';
import {
  FIREBALL_BODIES,
  FIREBALL_ENERGY_CELLS,
  FIREBALL_SPEED_SPLIT_KMS,
  fireballEntryAngle,
} from './fireballRules.js';
import { FIREBALL_EVENTS } from './fireballSetData.js';
import { cellSpans, everyCell, locateCell } from './measuredCells.js';

/** Rules 722 to 729 (G4): the cells an impact's entry was measured in. */

const KT = 4.184e12;
const energyAxis = ENTRY_CELLS.axes[0];
const speedAxis = ENTRY_CELLS.axes[1];

/** A body of the set's kind at an energy (kt), a speed (km/s) and an angle. */
const body = (energyKt: number, speedKmS: number, angleDeg = 45): EntryCellInput => ({
  kineticEnergy: energyKt * KT,
  impactVelocity: speedKmS * 1_000,
  impactorDensity: ENTRY_CELLS_DENSITY,
  impactAngle: (angleDeg * Math.PI) / 180,
});

describe('rules 722 to 729: the cells an impact’s entry was measured in', () => {
  it('(a) takes its edges, its rows and its conditions from the set', () => {
    const energies = FIREBALL_EVENTS.map((e) => e.energyKt);
    const speeds = FIREBALL_EVENTS.map((e) => e.speedKmS);
    expect(energyAxis?.edges).toEqual([
      Math.min(...energies),
      ...FIREBALL_ENERGY_CELLS.slice(0, -1).map((c) => c.max),
      Math.max(...energies),
    ]);
    expect(speedAxis?.edges).toEqual([
      Math.min(...speeds),
      FIREBALL_SPEED_SPLIT_KMS,
      Math.max(...speeds),
    ]);
    const counted = ENTRY_CELLS.rows.map(() => 0);
    for (const e of FIREBALL_EVENTS) {
      const v = locateCell(ENTRY_CELLS, { energy: e.energyKt, speed: e.speedKmS });
      expect(v.inside).toBe(true);
      if (v.inside) counted[v.cell] = (counted[v.cell] ?? 0) + 1;
    }
    expect(counted).toEqual([...ENTRY_CELLS.rows]);
    expect(counted.reduce((a, b) => a + b, 0)).toBe(357);
    const angles = FIREBALL_EVENTS.map((e) => (fireballEntryAngle(e) * 180) / Math.PI);
    const least = Math.min(...angles);
    const greatest = Math.max(...angles);
    expect(ENTRY_CELLS_ANGLE_DEG.least).toBeLessThanOrEqual(least);
    expect(least - ENTRY_CELLS_ANGLE_DEG.least).toBeLessThan(1e-4);
    expect(ENTRY_CELLS_ANGLE_DEG.greatest).toBeGreaterThanOrEqual(greatest);
    expect(ENTRY_CELLS_ANGLE_DEG.greatest - greatest).toBeLessThan(1e-4);
    const run = FIREBALL_BODIES.find((b) => b.key === 'default');
    expect(run?.densityKgM3).toBe(ENTRY_CELLS_DENSITY);
    expect(run?.strengthPa).toBeNull();
  });

  it('(a) places a body in every cell, at every edge, and nowhere past the set', () => {
    for (const bins of everyCell(ENTRY_CELLS)) {
      const spans = cellSpans(ENTRY_CELLS, bins);
      const [e, s] = spans;
      if (e === undefined || s === undefined) throw new Error('two axes');
      const mid = entryCellVerdict(body(Math.sqrt(e.from * e.to), (s.from + s.to) / 2));
      expect(mid.inside && mid.bins).toEqual(bins);
      const low = entryCellVerdict(body(e.from, s.from));
      expect(low.inside && low.bins).toEqual(bins);
    }
    // The top of the set closes its last cells.
    const top = entryCellVerdict(body(49, 71.1));
    expect(top.inside && top.bins).toEqual([2, 1]);
    expect(top.inside && top.rows).toBe(15);
    expect(top.inside && top.scored).toBe(false);
    const scored = entryCellVerdict(body(1, 20));
    expect(scored.inside && scored.rows).toBe(70);
    expect(scored.inside && scored.scored).toBe(true);
    expect(entryCellVerdict(body(49.01, 20))).toEqual({
      inside: false,
      outside: { kind: 'axis', key: 'energy', value: 49.01, side: 'above', bound: 49 },
    });
    expect(entryCellVerdict(body(0.047, 20))).toMatchObject({
      inside: false,
      outside: { key: 'energy', side: 'below', bound: 0.048 },
    });
    expect(entryCellVerdict(body(1, 71.2))).toMatchObject({
      inside: false,
      outside: { key: 'speed', side: 'above', bound: 71.1 },
    });
    expect(entryCellVerdict(body(1, 9.7))).toMatchObject({
      inside: false,
      outside: { key: 'speed', side: 'below', bound: 9.8 },
    });
    expect(entryCellVerdict(body(Number.NaN, 20))).toMatchObject({
      inside: false,
      outside: { key: 'energy', side: 'below' },
    });
  });

  it('(a) puts out a body the rows were not run as', () => {
    const outBy = (input: EntryCellInput): string | null => {
      const v = entryCellVerdict(input);
      return v.inside ? null : v.outside.key;
    };
    expect(outBy({ ...body(1, 20), impactorDensity: 3_300 })).toBe('density');
    expect(outBy({ ...body(1, 20), impactorStrength: 1e6 })).toBe('strength');
    expect(outBy(body(1, 20, 0.5))).toBe('angle');
    expect(outBy(body(1, 20, 89))).toBe('angle');
    expect(outBy(body(1, 20, 88.35))).toBeNull();
  });

  it('(b) reads every preset as rule 723 lists it', () => {
    const outBy = (id: keyof typeof IMPACT_PRESETS): string | null => {
      const v = simulateImpact(IMPACT_PRESETS[id].input).measuredCells.entry;
      return v.inside
        ? null
        : `${v.outside.key}${v.outside.kind === 'axis' ? ` ${v.outside.side}` : ''}`;
    };
    for (const id of [
      'CHICXULUB',
      'CHICXULUB_OCEAN',
      'POPIGAI',
      'BOLTYSH',
      'TUNGUSKA',
      'CHELYABINSK',
      'METEOR_CRATER',
    ] as const) {
      expect(outBy(id)).toBe('energy above');
    }
    expect(outBy('SIKHOTE_ALIN_1947')).toBe('density');
    expect(Object.keys(IMPACT_PRESETS)).toHaveLength(8);
  });
});
