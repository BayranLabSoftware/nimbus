import { describe, expect, it } from 'vitest';
import { formatRingRadius, spreadLabelBearings } from './ringPresentation.js';

describe('spreadLabelBearings', () => {
  it('spreads N captions evenly around the family, never closer than 36°', () => {
    expect(spreadLabelBearings(3)).toEqual([35, 155, 275]);
    const eight = spreadLabelBearings(8);
    expect(eight).toHaveLength(8);
    for (let i = 1; i < eight.length; i++) {
      const a = eight[i - 1] ?? 0;
      const b = eight[i] ?? 0;
      expect((b - a + 360) % 360).toBeCloseTo(45, 9);
    }
    const twelve = spreadLabelBearings(12);
    expect(((twelve[1] ?? 0) - (twelve[0] ?? 0) + 360) % 360).toBeCloseTo(36, 9);
  });

  it('handles degenerate counts', () => {
    expect(spreadLabelBearings(0)).toEqual([]);
    expect(spreadLabelBearings(1)).toEqual([35]);
  });
});

describe('formatRingRadius', () => {
  it('prints metres, then one-decimal kilometres, then whole kilometres', () => {
    expect(formatRingRadius(850, 'en')).toBe('850 m');
    expect(formatRingRadius(1_740, 'en')).toBe('1.7 km');
    expect(formatRingRadius(1_740, 'it')).toBe('1,7 km');
    expect(formatRingRadius(839_300, 'en')).toBe('839 km');
    expect(formatRingRadius(13_714_700, 'en')).toBe('13,715 km');
    expect(formatRingRadius(0, 'en')).toBe('—');
  });
});
