import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './SimulatorPanel.module.css';

/**
 * A magnitude on a scale with real earthquakes as its ticks.
 *
 * "Mw 7.9" says nothing to a reader who has not spent time with the
 * scale, and the scale is logarithmic, so the distance between 7.9 and
 * 9.5 is not the distance the digits suggest. The ticks are events, and
 * the last one is the largest ever recorded — which is also where this
 * model stops being calibrated on anything and starts extrapolating. A
 * limit drawn is a limit a reader can see coming.
 *
 * The events and their magnitudes are the ones the project already
 * carries as presets and validation anchors, so nothing here is a number
 * invented for a picture.
 */

interface Landmark {
  mw: number;
  /** i18n key under `simulator.earthquake.landmarks`. */
  key: string;
}

// Four, not five: at the panel's width a fifth label overlaps its
// neighbour, and Maule 8.8 says little that Valdivia 9.5 does not.
const LANDMARKS: readonly Landmark[] = [
  { mw: 5.5, key: 'laquila' },
  { mw: 6.7, key: 'northridge' },
  { mw: 7.8, key: 'gorkha' },
  { mw: 9.5, key: 'valdivia' },
] as const;

const FLOOR = 4;
const CEILING = 9.5;

function positionOf(mw: number): number {
  const clamped = Math.min(Math.max(mw, FLOOR), CEILING);
  return ((clamped - FLOOR) / (CEILING - FLOOR)) * 100;
}

export function MagnitudeScale({ magnitude }: { magnitude: number }): JSX.Element {
  const { t } = useTranslation();
  const here = positionOf(magnitude);
  const beyond = magnitude > CEILING;
  return (
    <div className={styles.scale}>
      <div className={styles.scaleTrack}>
        <div className={styles.scaleFill} style={{ width: `${here.toFixed(1)}%` }} />
        {LANDMARKS.map((mark) => (
          <span
            key={mark.key}
            className={styles.scaleTick}
            style={{ left: `${positionOf(mark.mw).toFixed(1)}%` }}
          />
        ))}
        <span className={styles.scaleHead} style={{ left: `${here.toFixed(1)}%` }} />
      </div>
      <div className={styles.scaleLabels}>
        {LANDMARKS.map((mark) => (
          <span
            key={mark.key}
            className={styles.scaleLabel}
            style={{ left: `${positionOf(mark.mw).toFixed(1)}%` }}
          >
            {mark.mw.toFixed(1)}
            <br />
            {t(`simulator.earthquake.landmarks.${mark.key}`)}
          </span>
        ))}
      </div>
      {beyond && <p className={styles.scaleBeyond}>{t('simulator.earthquake.beyondTheRecord')}</p>}
    </div>
  );
}
