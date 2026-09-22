import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { EvidenceQuantity } from '../../physics/validation/evidenceClasses.js';
import { evidenceText } from '../../scene/globe/evidenceText.js';
import styles from './EvidenceTag.module.css';

/**
 * The class of evidence behind a number (physics/validation/evidenceClasses.ts),
 * printed beside it: "A", or "exploratory". Its title says what the class
 * means and what the number rests on; the table the panel and the report
 * carry says the rest.
 */
export function EvidenceTag({ quantity }: { quantity: EvidenceQuantity }): JSX.Element {
  const { t, i18n } = useTranslation();
  const text = evidenceText(quantity, t, i18n.language);
  return (
    <span
      className={[
        styles.tag,
        text.klass === 'exploratory' ? styles.exploratory : styles.checked,
      ].join(' ')}
      title={t('evidence.tagTitle', { label: text.label, summary: text.summary })}
      data-evidence={quantity}
      data-evidence-class={text.klass}
    >
      {text.short}
      <span className={styles.hidden}>
        {' — '}
        {text.label}
      </span>
    </span>
  );
}
