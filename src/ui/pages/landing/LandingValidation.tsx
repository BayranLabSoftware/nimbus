import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import report from '../../../../docs/VALIDATION_REPORT.json';
import { BUILD_INFO, shortCommit } from '../../../buildInfo.js';
import { useAppStore } from '../../../store/index.js';
import { ProgramChart, type ProgramChartRow } from './ProgramChart.js';
import styles from './LandingValidation.module.css';

/** The slice of the validation report the landing page reads. */
interface LandingReportData {
  verification: {
    eiep: {
      readOn: string;
      impacts: number;
      summaries: ProgramChartRow[];
    };
  };
  calibration: {
    fireball: {
      events: { bolides: number };
      meetsBar: boolean;
      readings: Record<string, { medianAbsoluteErrorKm: number; withinFiveKm: number }>;
    };
  };
}

const DATA: LandingReportData = report;

/**
 * The validation section of the landing page — the impacts' own evidence,
 * and what is missing from it.
 *
 * Until 22 September 2026 this section showed eighteen recorded death tolls:
 * Hiroshima, Tōhoku, Pinatubo, Beirut. They calibrate the engines the impacts
 * share — the casualty model, the waves, the shaking — but not one of them is
 * an impact, and on a site that is now an instrument for cosmic impacts alone
 * (store/visibleEvents.ts) they would read as evidence borrowed from other
 * phenomena. Andrea's decision that evening: show the impacts' own evidence,
 * and say plainly what is not there.
 *
 * What is here: the comparison, quantity by quantity, against the Earth
 * Impact Effects Program as its authors run it — the reference implementation
 * of the equations this model cites — and the 357 bolides whose entry the sky
 * actually measured. What is not here, and is said in the fourth figure: no
 * impact in recorded history has left a death toll, so the mortality is
 * calibrated on explosions of the same energy, and it is an extrapolation.
 *
 * Every number comes from docs/VALIDATION_REPORT.json, which the CI
 * regenerates from the code of the commit that built this page.
 */
export function LandingValidation(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setMode = useAppStore((s) => s.setMode);
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';

  const { eiep } = DATA.verification;
  const { fireball } = DATA.calibration;
  const quantities = eiep.summaries;

  // The widest disagreement of any quantity's central value — the honest
  // headline for "how close to the reference implementation", since a mean of
  // means would hide the one that drifts.
  const worst = Math.max(...quantities.map((q) => Math.abs(q.geometricMean - 1)));
  const worstPercent = (worst * 100).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  const cases = quantities.reduce((sum, q) => sum + q.pairs, 0);
  const entry = fireball.readings.default;
  const entryError = (entry?.medianAbsoluteErrorKm ?? 0).toLocaleString(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <>
      <ul className={styles.tiles}>
        <li className={styles.tile}>
          <span className={styles.value}>
            {quantities.length} / {quantities.length}
          </span>
          <span className={styles.label}>
            {t('landing.validation.quantitiesWithin', { percent: worstPercent })}
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>{cases.toLocaleString(locale)}</span>
          <span className={styles.label}>
            {t('landing.validation.programCases', { impacts: eiep.impacts })}
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>{entryError} km</span>
          <span className={styles.label}>
            {t('landing.validation.entryError', { bolides: fireball.events.bolides })}
          </span>
        </li>
        <li className={styles.tile}>
          <span className={styles.value}>0</span>
          <span className={styles.label}>{t('landing.validation.noToll')}</span>
        </li>
      </ul>

      <figure className={styles.figure}>
        <ProgramChart rows={quantities} />
        <figcaption className={styles.caption}>
          <b>{t('landing.validation.figure')}</b> —{' '}
          {t('landing.validation.captionProgram', {
            count: quantities.length,
            impacts: eiep.impacts,
            readOn: eiep.readOn,
          })}
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
