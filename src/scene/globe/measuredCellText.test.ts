import { describe, expect, it } from 'vitest';
import '../../i18n/index.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { entryCellVerdict } from '../../physics/validation/entryCells.js';
import { entryCellSentence, entryCellShort, quoteCellFigure } from './measuredCellText.js';

/** Rule 725 of physics/validation/entryCellsRules.ts: the verdict, said. */

const KT = 4.184e12;
const body = (energyKt: number, speedKmS: number) =>
  entryCellVerdict({
    kineticEnergy: energyKt * KT,
    impactVelocity: speedKmS * 1_000,
    impactorDensity: 3_000,
    impactAngle: Math.PI / 4,
  });

describe('rule 725: the entry’s measured cell, as the product says it', () => {
  it('names the cell and its rows inside, in both languages', () => {
    expect(entryCellSentence(body(1, 20), 'en')).toBe(
      'inside, 0.3–3 kt, 17–71.1 km/s: 70 fireballs (I2)'
    );
    expect(entryCellSentence(body(1, 20), 'it')).toBe(
      'dentro, 0,3–3 kt, 17–71,1 km/s: 70 bolidi (I2)'
    );
    expect(entryCellSentence(body(10, 12), 'en')).toBe(
      'inside, 3–49 kt, 9.8–17 km/s: 13 fireballs, fewer than the 20 a cell is scored from alone (I2)'
    );
  });

  it('names what puts a scenario out, and the set’s bound on it', () => {
    const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input).measuredCells.entry;
    expect(entryCellSentence(tunguska, 'en')).toBe(
      'outside: 9,120 kt, above the largest of the 357 fireballs the entry was measured on (49 kt, I2)'
    );
    expect(entryCellSentence(tunguska, 'it')).toBe(
      "fuori: 9120 kt, oltre il più grande dei 357 bolidi su cui l'ingresso è stato misurato (49 kt, I2)"
    );
    const sikhote = simulateImpact(IMPACT_PRESETS.SIKHOTE_ALIN_1947.input).measuredCells.entry;
    expect(entryCellSentence(sikhote, 'en')).toContain('bodies of 3,000 kg/m³ with no class');
    expect(entryCellShort(tunguska, 'en')).toBe('outside the measured cells');
    expect(entryCellShort(body(1, 20), 'it')).toBe('in una cella misurata');
  });

  it('quotes a figure past a million as a power of ten', () => {
    expect(quoteCellFigure(2.534e11, 'en')).toBe('2.53 × 10¹¹');
    expect(quoteCellFigure(0.048, 'it')).toBe('0,048');
    expect(quoteCellFigure(Number.NaN, 'en')).toBe('—');
  });
});
