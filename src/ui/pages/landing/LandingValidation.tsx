import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import report from '../../../../docs/VALIDATION_REPORT.json';
import { BUILD_INFO, shortCommit } from '../../../buildInfo.js';
import { useAppStore } from '../../../store/index.js';
import { TollChart, type TollChartRow } from './TollChart.js';
import styles from './LandingValidation.module.css';

/** The slice of the validation report the landing page reads. */
interface LandingReportData {
  calibration: {
    tolls: (TollChartRow & { role: string })[];
    waves: { contains: boolean; role: string }[];
    footprint: { geometricMeanRadiusRatio: number };
  };
}

const DATA: LandingReportData = report;

/**
 * The validation section of the landing page: four figures and the death
 * toll chart, computed from docs/VALIDATION_REPORT.json exactly as the
 * validation page computes its own tiles, so the two pages always show the
 * same numbers — and neither goes stale, since CI regenerates the report
 * from the code.
 *
 * Loaded on its own chunk: the report is 130 KB of JSON that the validation
 * page already fetches lazily, and the landing page's first paint should not
 * wait for it.
 */
export function LandingValidation(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setMode = useAppStore((s) => s.setMode);
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';

  const { tolls, waves, footprint } = DATA.calibration;
  const tollsInside = tolls.filter((r) => r.contains).length;
  const wavesInside = waves.filter((r) => r.contains).length;
  const heldTolls = tolls.filter((r) => r.role === 'heldOut');
  const heldWaves = waves.filter((r) => r.role === 'heldOut');
  const heldInside =
    heldTolls.filter((r) => r.contains).length + heldWaves.filter((r) => r.contains).length;
  const ratio = footprint.geometricMeanRadiusRatio.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const outside = tolls.length - tollsInside;

  return (
    <>
      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.value}>
            {tollsInside} / {tolls.length}
          </span>
          <span className={styles.label}>{t('landing.validation.tolls')}</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>
            {wavesInside} / {waves.length}
          </span>
          <span className={styles.label}>{t('landing.validation.waves')}</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>{ratio}×</span>
          <span className={styles.label}>{t('landing.validation.footprint')}</span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>
            {heldInside} / {heldTolls.length + heldWaves.length}
          </span>
          <span className={styles.label}>{t('landing.validation.heldOut')}</span>
        </li>
      </ul>

      <figure className={styles.figure}>
        <TollChart rows={tolls} />
        <figcaption className={styles.caption}>
          <b>{t('landing.validation.figure')}</b> —{' '}
          {t('landing.validation.caption', { count: tolls.length, outside })}
        </figcaption>
      </figure>

      <p className={styles.source}>
        {BUILD_INFO.commit
          ? t('landing.validation.source', { commit: shortCommit(BUILD_INFO.commit) })
          : t('landing.validation.sourceUnknown')}
        {' · '}
        <button
          type="button"
          className={styles.link}
          onClick={() => {
            setMode('validation');
          }}
        >
          {t('landing.validation.fullReport')}
        </button>
      </p>
      <p className={styles.limits}>{t('landing.validation.limits')}</p>
    </>
  );
}
