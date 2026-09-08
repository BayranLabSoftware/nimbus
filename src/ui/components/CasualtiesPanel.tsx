import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { CasualtyEstimate } from '../../physics/casualties.js';
import type { PopulationLookupMethod } from '../../scene/populationLookup.js';
import type { CasualtyStatus } from '../../store/index.js';
import { formatPeople, formatWithUnitTiers, type UnitTier } from '../utils/numberFormat.js';
import styles from './SimulatorPanel.module.css';

const TIERS_RANGE: readonly UnitTier[] = [
  { scale: 1, digits: 0, label: 'm' },
  { scale: 1_000, digits: 1, label: 'km' },
];

/** People, rounded to the precision the model deserves: two
 *  significant figures — "≈ 66 000", never "65 812". */
export interface CasualtiesPanelProps {
  casualties:
    | (CasualtyEstimate & { source: string; method: PopulationLookupMethod; provisional?: boolean })
    | null;
  status: CasualtyStatus;
  /** Compact layout for the side panel; the report shows every band. */
  compact?: boolean;
}

/**
 * Estimated dead and injured from the population inside each hazard
 * band — WorldPop counts times a published vulnerability function
 * (OTA 1979 for blast, PAGER for shaking, Auker 2013 for pyroclastic
 * flows). Shows the central figure with its low–high band, the
 * per-band breakdown, the data source, and the assumptions on the
 * label: prompt effects, nobody evacuated, no tsunami, fallout,
 * famine or disease. The number is an order of magnitude with a
 * citation, not a body count.
 */
export function CasualtiesPanel({
  casualties,
  status,
  compact = true,
}: CasualtiesPanelProps): JSX.Element {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  const people = (n: number): string => formatPeople(n, locale);

  return (
    // A plain block: the two-column grid belongs to the <dl> below, not
    // to the section — nested in it, every note fell into a 60 px cell.
    <section aria-label={t('casualties.label')} data-testid="casualties">
      <h3 className={styles.sectionHeading}>{t('casualties.label')}</h3>
      {status === 'fetching' && casualties === null && (
        <p className={styles.presetNote}>{t('casualties.loading')}</p>
      )}
      {casualties?.provisional === true && (
        <p className={styles.presetNote}>{t('casualties.provisional')}</p>
      )}
      {status === 'error' && casualties === null && (
        <p className={styles.presetNote}>{t('casualties.unavailable')}</p>
      )}
      {status === 'unsupported' && casualties === null && (
        <p className={styles.presetNote}>{t('casualties.unsupported')}</p>
      )}
      {casualties !== null && (
        <>
          <dl className={styles.result}>
            <dt className={styles.resultLabel}>{t('casualties.deaths')}</dt>
            <dd className={styles.resultValue}>
              <strong>{people(casualties.deaths)}</strong>
              <span style={{ opacity: 0.75 }}>
                {' '}
                ({people(casualties.deathsLow)} – {people(casualties.deathsHigh)})
              </span>
            </dd>
            {casualties.model === 'blast' && (
              <>
                <dt className={styles.resultLabel}>{t('casualties.injured')}</dt>
                <dd className={styles.resultValue}>{people(casualties.injured)}</dd>
              </>
            )}
            <dt className={styles.resultLabel}>{t('casualties.exposed')}</dt>
            <dd className={styles.resultValue}>{people(casualties.exposed)}</dd>
          </dl>
          {!compact && (
            <table className={styles.mcTable}>
              <thead>
                <tr>
                  <th>{t('casualties.table.band')}</th>
                  <th>{t('casualties.table.radius')}</th>
                  <th>{t('casualties.table.population')}</th>
                  <th>{t('casualties.table.mortality')}</th>
                  <th>{t('casualties.table.deaths')}</th>
                </tr>
              </thead>
              <tbody>
                {casualties.bands.map((band) => (
                  <tr key={band.key}>
                    <td>{t(`casualties.band.${band.key}`)}</td>
                    <td>
                      {formatWithUnitTiers(band.innerRadiusM, TIERS_RANGE)} –{' '}
                      {formatWithUnitTiers(band.outerRadiusM, TIERS_RANGE)}
                    </td>
                    <td>{people(band.population)}</td>
                    <td>
                      {(band.mortality * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}{' '}
                      %
                    </td>
                    <td>{people(band.deaths)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className={styles.mcFooter}>
            {t(`casualties.model.${casualties.model}`)} ·{' '}
            {t(`casualties.method.${casualties.method}`, { source: casualties.source })}
          </p>
          <p className={styles.mcFooter}>{t('casualties.disclaimer')}</p>
        </>
      )}
    </section>
  );
}
