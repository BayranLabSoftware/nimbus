import i18next from 'i18next';
import { ENTRY_CELLS } from '../../physics/validation/entryCells.js';
import { cellSpans, type CellVerdict } from '../../physics/validation/measuredCells.js';

/**
 * Rule 725 of physics/validation/entryCellsRules.ts: the verdict of G4 for an
 * impact's entry, as the panel, the legend and the globe say it. One wording
 * for all three, in the language the interface is in.
 */

const SUPERSCRIPT: Record<string, string> = {
  '-': '⁻',
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
};

/** A figure as a verdict quotes it: three significant figures grouped by the
 *  locale, and a power of ten from a million up. */
export function quoteCellFigure(value: number, language: string): string {
  if (!Number.isFinite(value)) return '—';
  const locale = language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  if (Math.abs(value) >= 1e6) {
    const exp = Math.floor(Math.log10(Math.abs(value)));
    const mantissa = (value / 10 ** exp).toLocaleString(locale, { maximumFractionDigits: 2 });
    const power = exp.toString().replace(/[-0-9]/g, (c) => SUPERSCRIPT[c] ?? c);
    return `${mantissa} × 10${power}`;
  }
  return value.toLocaleString(locale, { maximumSignificantDigits: 3 });
}

/** The verdict in a sentence, naming the cell and its rows, or what puts the
 *  scenario out and the set's bound on it. */
export function entryCellSentence(verdict: CellVerdict, language: string): string {
  const t = (key: string, vars: Record<string, string | number> = {}): string =>
    i18next.t(`measuredCells.entry.${key}`, { lng: language, ...vars });
  if (verdict.inside) {
    const cell = cellSpans(ENTRY_CELLS, verdict.bins)
      .map(
        (s) => `${quoteCellFigure(s.from, language)}–${quoteCellFigure(s.to, language)} ${s.unit}`
      )
      .join(', ');
    return t(verdict.scored ? 'inside' : 'insideThin', {
      cell,
      rows: verdict.rows,
      scoredFrom: ENTRY_CELLS.scoredFrom,
    });
  }
  const out = verdict.outside;
  if (out.kind === 'axis') {
    return t(`outside.${out.key}.${out.side}`, {
      value: quoteCellFigure(out.value, language),
      bound: quoteCellFigure(out.bound, language),
    });
  }
  return t(`outside.${out.key}`);
}

/** The verdict in a few words, under the burst altitude on the globe. */
export function entryCellShort(verdict: CellVerdict, language: string): string {
  return i18next.t(`measuredCells.entry.${verdict.inside ? 'shortInside' : 'shortOutside'}`, {
    lng: language,
  });
}
