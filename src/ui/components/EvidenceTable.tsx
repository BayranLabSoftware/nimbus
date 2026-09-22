import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { EVIDENCE_CLASSES, EVIDENCE_QUANTITIES } from '../../physics/validation/evidenceClasses.js';
import { evidenceText, type EvidenceText } from '../../scene/globe/evidenceText.js';
import styles from './EvidenceTable.module.css';

/**
 * What each number an impact prints rests on (physics/validation/
 * evidenceClasses.ts): for every family of numbers, its class, where it holds,
 * its error and what would raise it — and what each class means. The panel
 * folds it under its results; the report prints it open, on paper. A reviewer
 * reads here, without asking, in which domain a number is and what it is
 * worth.
 */
export function EvidenceTable({
  tone = 'panel',
  rows: given,
}: {
  /** `panel` folds it; `paper` prints it in the report; `page` is a section
   *  of the validation page, under the page's own heading style. */
  tone?: 'panel' | 'paper' | 'page';
  /** The report's own rows, from its model; the panel's are read here. */
  rows?: EvidenceText[];
}): JSX.Element {
  const { t, i18n } = useTranslation();
  const rows = given ?? EVIDENCE_QUANTITIES.map((q) => evidenceText(q, t, i18n.language));
  const content = (
    <>
      <p className={styles.intro}>{t('evidence.intro')}</p>
      <dl className={styles.classes}>
        {EVIDENCE_CLASSES.map((k) => (
          <div key={k} className={styles.class}>
            <dt>{t(`evidence.class.${k}.label`)}</dt>
            <dd>{t(`evidence.class.${k}.meaning`)}</dd>
          </div>
        ))}
      </dl>
      <ul className={styles.rows}>
        {rows.map((r) => (
          <li
            key={r.quantity}
            className={[styles.row, r.klass === 'exploratory' ? styles.exploratory : '']
              .filter(Boolean)
              .join(' ')}
            data-evidence={r.quantity}
            data-evidence-class={r.klass}
          >
            <p className={styles.name}>
              <strong>{r.name}</strong> — {r.label}
            </p>
            <dl className={styles.facts}>
              <dt>{t('evidence.columns.domain')}</dt>
              <dd>{r.domain}</dd>
              <dt>{t('evidence.columns.error')}</dt>
              <dd>{r.error}</dd>
              <dt>{t('evidence.columns.missing')}</dt>
              <dd>{r.missing}</dd>
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
  if (tone === 'page') {
    return (
      <div className={styles.table} data-testid="evidence-table">
        <h2>{t('evidence.heading')}</h2>
        {content}
      </div>
    );
  }
  if (tone === 'paper') {
    return (
      <section className={[styles.table, styles.paper].join(' ')} data-testid="evidence-table">
        <h2 className={styles.heading}>{t('evidence.heading')}</h2>
        {content}
      </section>
    );
  }
  return (
    <details className={styles.table} data-testid="evidence-table">
      <summary className={styles.summary}>{t('evidence.heading')}</summary>
      {content}
    </details>
  );
}
