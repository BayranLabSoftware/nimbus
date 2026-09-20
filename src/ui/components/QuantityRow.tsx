import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { FieldIssuesView } from '../../store/useScenarioValidation.js';
import { FieldFeedback } from './FieldFeedback.js';
import styles from './SimulatorPanel.module.css';

/**
 * One measured quantity, as an instrument writes one.
 *
 * The panel used to be a column of boxes, each with a label above a value,
 * every one the same size whatever it held — so nothing said which numbers
 * the reader chose and which the model read off the ground, and a strike
 * inherited from another scenario could point a rupture anywhere with
 * nothing on screen to show it (B-081).
 *
 * A row here is the four columns a datasheet has: the quantity, the value
 * right-aligned in tabular figures so digits line up down the column, its
 * unit in a column of its own, and where the value came from. Reading
 * straight down the last column answers "what did I choose and what did
 * the model?" in one glance, which is the question this panel exists to
 * answer.
 */

export type QuantitySource =
  /** The reader wrote it, and it survives a change of place. */
  | 'user'
  /** The model read it from the data under the pick. */
  | 'read'
  /** Neither: nothing to attribute. */
  | 'none';

export interface QuantityRowProps {
  /** Plain-language name of the quantity. */
  label: string;
  /** The control that shows and edits the value. */
  children: ReactNode;
  /** Unit symbol, in its own column. Omitted for a value that has none. */
  unit?: string;
  /** Where the value came from. */
  source?: QuantitySource;
  /** One short line under the row: a limit, a consequence, a caveat. */
  note?: ReactNode;
  /** Field name for validation feedback, and its issues. */
  field?: string;
  issues?: FieldIssuesView;
  /** Marks the row as read from data, which tints its ground. */
  highlight?: boolean;
}

export function QuantityRow(props: QuantityRowProps): JSX.Element {
  const { t } = useTranslation();
  const source = props.source ?? 'none';
  const sourceLabel =
    source === 'read'
      ? t('simulator.quantity.read')
      : source === 'user'
        ? t('simulator.quantity.yours')
        : '';

  return (
    <div
      className={[styles.quantityRow, props.highlight === true ? styles.quantityRead : '']
        .filter(Boolean)
        .join(' ')}
    >
      <div className={styles.quantityLine}>
        <span className={styles.quantityLabel}>{props.label}</span>
        <span className={styles.quantityValue}>{props.children}</span>
        <span className={styles.quantityUnit}>{props.unit ?? ''}</span>
        <span className={styles.quantitySource}>
          {source === 'none' ? null : (
            <svg width="16" height="16" viewBox="0 0 16 16" role="img" aria-label={sourceLabel}>
              <title>{sourceLabel}</title>
              {source === 'read' ? (
                <circle cx="8" cy="8" r="4" fill="currentColor" />
              ) : (
                <circle cx="8" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              )}
            </svg>
          )}
        </span>
      </div>
      {props.note !== undefined && <p className={styles.quantityNote}>{props.note}</p>}
      {props.field !== undefined && props.issues !== undefined && (
        <FieldFeedback
          field={props.field}
          message={props.issues.topMessage}
          code={props.issues.topCode}
          isError={props.issues.hasError}
        />
      )}
    </div>
  );
}

/** The key to the marks above, shown once under the rows they explain. */
export function QuantityKey(): JSX.Element {
  const { t } = useTranslation();
  return (
    <div className={styles.quantityKey}>
      <span className={styles.quantityKeyItem}>
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
        </svg>
        {t('simulator.quantity.yours')}
      </span>
      <span className={[styles.quantityKeyItem, styles.quantityKeyRead].join(' ')}>
        <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
          <circle cx="8" cy="8" r="4" fill="currentColor" />
        </svg>
        {t('simulator.quantity.read')}
      </span>
    </div>
  );
}
