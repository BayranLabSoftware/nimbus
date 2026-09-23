/**
 * The words of an evidence class (physics/validation/evidenceClasses.ts), in
 * the reader's language. One function for the globe's legend, the panel and
 * the report, so the three cannot word a class differently.
 */
import type { TFunction } from 'i18next';
import {
  EVIDENCE,
  EVIDENCE_REFERENCE_PROGRAM,
  type EvidenceClass,
  type EvidenceQuantity,
} from '../../physics/validation/evidenceClasses.js';

export interface EvidenceText {
  quantity: EvidenceQuantity;
  klass: EvidenceClass;
  /** "A · implementation verified", "Exploratory only". */
  label: string;
  /** "A", "exploratory": what a tag beside a number prints. */
  short: string;
  /** What the class means, whatever the quantity. */
  meaning: string;
  /** The quantity's name. */
  name: string;
  /** One sentence: the class and what it rests on, for a legend or a tooltip. */
  summary: string;
  domain: string;
  error: string;
  missing: string;
}

function fixedPercent(value: number, language: string): string {
  return value.toLocaleString(language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function plainNumber(value: number, language: string): string {
  return value.toLocaleString(language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US');
}

export function evidenceText(
  quantity: EvidenceQuantity,
  t: TFunction,
  language: string
): EvidenceText {
  const record = EVIDENCE[quantity];
  const base = `evidence.quantity.${quantity}`;
  const reference = record.reference;
  const observed = record.observed;
  const values = {
    excellent: reference === null ? '' : fixedPercent(reference.excellentPercent, language),
    pastTen: reference === null ? '' : plainNumber(reference.pastTen, language),
    impacts: reference === null ? '' : plainNumber(reference.impacts, language),
    readings: reference === null ? '' : plainNumber(reference.readings, language),
    program: EVIDENCE_REFERENCE_PROGRAM,
    events: observed === null ? '' : plainNumber(observed.events, language),
    error: observed === null ? '' : fixedPercent(observed.medianError, language),
    bar: observed === null ? '' : plainNumber(observed.bar, language),
  };
  // Level A's error is the reference's own comparison, in figures; the rest
  // say in words why there is none yet.
  const errors: string[] = [];
  if (record.klass === 'A' && reference !== null)
    errors.push(t(reference.pastTen > 0 ? 'evidence.checked' : 'evidence.checkedClean', values));
  if (observed !== null) errors.push(t('evidence.observedBolides', values));
  if (record.levelB !== null) errors.push(t(`evidence.levelB.${quantity}`));
  const own = t(`${base}.error`, values);
  if (own.length > 0) errors.push(own);
  return {
    quantity,
    klass: record.klass,
    label: t(`evidence.class.${record.klass}.label`),
    short: t(`evidence.class.${record.klass}.short`),
    meaning: t(`evidence.class.${record.klass}.meaning`),
    name: t(`${base}.name`),
    summary: t(`${base}.summary`, values),
    domain: t(`${base}.domain`, values),
    error: errors.join(' '),
    missing: t(`${base}.missing`, values),
  };
}
