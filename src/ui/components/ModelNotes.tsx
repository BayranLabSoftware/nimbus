import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { EventType } from '../../store/index.js';
import styles from './SimulatorPanel.module.css';

/**
 * What the model does not do, gathered and counted.
 *
 * These admissions were scattered one per field — the depth's three-line
 * note sat between the depth box and the fault menu, where it broke the
 * reading and was skipped. A reader who skips them is a reader who does
 * not know that the depth they just typed changes nothing in the
 * intensities, which is exactly the thing they most need to know.
 *
 * Together, headed by their own count, they are read. Every line here is
 * a limit the project has MEASURED and written down somewhere else —
 * `visualContracts.ts`, `docs/VALIDATION_REPORT.md`, the bug registry —
 * not a hedge added to sound careful.
 */

const NOTES: Record<EventType, readonly string[]> = {
  earthquake: ['depth', 'areas', 'topography', 'vulnerability', 'fires'],
  impact: ['impactAngle', 'impactToll'],
  explosion: ['explosionEnvelope'],
  volcano: ['volcanoPlume'],
  landslide: ['landslideRunup'],
};

export function ModelNotes({ eventType }: { eventType: EventType }): JSX.Element | null {
  const { t } = useTranslation();
  const keys = NOTES[eventType];
  if (keys.length === 0) return null;
  return (
    <aside className={styles.modelNotes} aria-label={t('simulator.modelNotes.aria')}>
      <svg
        width="14"
        height="14"
        viewBox="0 0 16 16"
        aria-hidden="true"
        style={{ flexShrink: 0, marginTop: 2 }}
      >
        <path
          d="M8 1.5 L15 14 L1 14 Z"
          fill="none"
          stroke="#D4A24C"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        <path d="M8 6 L8 10" stroke="#D4A24C" strokeWidth="1.3" />
        <circle cx="8" cy="11.6" r="0.7" fill="#D4A24C" />
      </svg>
      <div className={styles.modelNotesBody}>
        <p className={styles.modelNotesTitle}>
          {t('simulator.modelNotes.title', { count: keys.length })}
        </p>
        <ul className={styles.modelNotesList}>
          {keys.map((key) => (
            <li key={key}>{t(`simulator.modelNotes.items.${key}`)}</li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
