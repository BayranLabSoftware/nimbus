import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/index.js';
import { AboutDialog } from './AboutDialog.js';
import { GlossaryDialog } from './GlossaryDialog.js';
import { LanguageSwitch } from './LanguageSwitch.js';
import styles from './AppBar.module.css';

/**
 * Slim glass application bar across the top of the globe view.
 *
 * Replaces the two chips that used to float in the top-left corner —
 * a wordmark anchors the product, the crumb says which event family
 * is armed, and the info / glossary / language controls live where a
 * visitor expects utilities to live. The dialogs themselves are
 * unchanged: only their triggers moved in here, restyled from
 * absolutely-positioned chips to in-flow bar buttons.
 */
export function AppBar(): JSX.Element {
  const { t } = useTranslation();
  const eventType = useAppStore((s) => s.eventType);

  return (
    <header className={styles.bar} aria-label={t('appBar.label')}>
      <span className={styles.wordmark}>
        <i className={styles.dot} aria-hidden="true" />
        Nimbus
      </span>
      <span className={styles.crumb}>{t(`simulator.eventTypes.${eventType}`)}</span>
      <span className={styles.spacer} />
      <div className={styles.utilities}>
        <AboutDialog />
        <GlossaryDialog />
        <LanguageSwitch />
      </div>
    </header>
  );
}
