import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/index.js';
import styles from './ViewSwitch.module.css';

/**
 * Globe ↔ close-up toggle.
 *
 * Only rendered once a simulation exists that HAS a close-up: an
 * earthquake or a volcano has nothing to look at from ground level,
 * and offering a control that leads to an apology is worse than not
 * offering it. The button therefore appears with the first compatible
 * result rather than sitting permanently disabled.
 */
export function ViewSwitch(): JSX.Element | null {
  const { t } = useTranslation();
  const mode = useAppStore((s) => s.mode);
  const result = useAppStore((s) => s.result);
  const transitionTo = useAppStore((s) => s.transitionTo);

  const hasCloseUp = result?.type === 'impact' || result?.type === 'explosion';
  if (!hasCloseUp) return null;
  if (mode !== 'globe' && mode !== 'impact') return null;

  return (
    <div className={styles.group} role="group" aria-label={t('appBar.viewSwitchLabel')}>
      <button
        type="button"
        className={styles.button}
        aria-pressed={mode === 'globe'}
        onClick={() => transitionTo('globe')}
      >
        {t('appBar.viewGlobe')}
      </button>
      <button
        type="button"
        className={styles.button}
        aria-pressed={mode === 'impact'}
        onClick={() => transitionTo('impact')}
      >
        {t('appBar.viewImpact')}
      </button>
    </div>
  );
}
