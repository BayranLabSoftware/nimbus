import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import type { CasualtyEstimate } from '../../physics/casualties.js';
import {
  anchorsFor,
  type CalibrationEnvelope,
} from '../../physics/validation/calibrationEnvelope.js';
import type { PopulationLookupMethod } from '../../scene/populationLookup.js';
import type { CasualtyStatus } from '../../store/index.js';
import { bandLabelKey } from './casualtyBandLabel.js';
import { cx } from '../utils/cx.js';
import {
  formatFactor,
  formatPeople,
  formatWithUnitTiers,
  type UnitTier,
} from '../utils/numberFormat.js';
import { formatElapsed } from '../utils/timeFormat.js';
import styles from './SimulatorPanel.module.css';

const TIERS_RANGE: readonly UnitTier[] = [
  { scale: 1, digits: 0, label: 'm' },
  { scale: 1_000, digits: 1, label: 'km' },
];

/** People, rounded to the precision the model deserves: two
 *  significant figures — "≈ 66 000", never "65 812". */

/**
 * Where this scenario sits against the events the world has already
 * performed — for the death toll specifically, which is what this
 * panel shows. The distinction matters: a fifty-megatonne charge is
 * beside Tsar Bomba if you are asking about the wave and three
 * thousand times past Hiroshima if you are asking about the dead.
 *
 * The estimate itself is unchanged either way. This says what is
 * known about it, which is a different thing and the one a reader
 * needs in order to decide how much weight to put on the number.
 */
function EnvelopeNote({
  envelope,
  compact,
}: {
  envelope: CalibrationEnvelope;
  compact: boolean;
}): JSX.Element | null {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  const what = t(`casualties.envelope.what.${envelope.quantity ?? 'toll'}`);

  // Nothing of this kind has ever been recorded for this family of
  // event. A family with no sentence written for it says nothing at
  // all rather than printing a missing key.
  if (envelope.standing === 'unmeasured' || envelope.nearest === null || envelope.span === null) {
    const none = t(`casualties.envelope.unmeasured.${envelope.eventType}`, { defaultValue: '' });
    if (none === '') return null;
    return (
      <p
        className={cx(styles.envelopeNote, styles.envelopeNoteOutside)}
        data-testid="calibration-envelope"
        data-standing="unmeasured"
      >
        {none}
      </p>
    );
  }

  const outside = envelope.value > envelope.span.high.value ? 'above' : 'below';
  const key = envelope.standing === 'extrapolated' ? outside : envelope.standing;
  const anchors = anchorsFor(envelope.eventType, envelope.quantity ?? undefined);

  return (
    <p
      className={cx(
        styles.envelopeNote,
        envelope.standing === 'extrapolated' && styles.envelopeNoteOutside
      )}
      data-testid="calibration-envelope"
      data-standing={envelope.standing}
    >
      {t(`casualties.envelope.${key}`, {
        event: envelope.nearest.name,
        low: envelope.span.low.name,
        high: envelope.span.high.name,
        times: formatFactor(envelope.beyond, locale),
        what,
      })}
      {!compact && (
        <>
          {' '}
          {t('casualties.envelope.anchors', {
            what,
            list: anchors.map((a) => a.name).join(' · '),
          })}
        </>
      )}
    </p>
  );
}

export interface CasualtiesPanelProps {
  casualties:
    | (CasualtyEstimate & { source: string; method: PopulationLookupMethod; provisional?: boolean })
    | null;
  status: CasualtyStatus;
  /** Compact layout for the side panel; the report shows every band. */
  compact?: boolean;
  /** Where this scenario sits against the measured record. */
  envelope?: CalibrationEnvelope | null;
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
  envelope = null,
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
                <dt className={styles.resultLabel}>{t('casualties.promptDeaths')}</dt>
                <dd className={styles.resultValue}>{people(casualties.promptDeaths)}</dd>
                <dt className={styles.resultLabel}>{t('casualties.delayedDeaths')}</dt>
                <dd className={styles.resultValue}>
                  {people(casualties.delayedDeaths)}
                  <span style={{ opacity: 0.75 }}>
                    {' '}
                    ({people(casualties.delayedDeathsLow)} – {people(casualties.delayedDeathsHigh)})
                  </span>
                </dd>
              </>
            )}
            {(casualties.tsunamiDeaths ?? 0) > 0 && (
              <>
                <dt className={styles.resultLabel}>{t('casualties.tsunamiDeaths')}</dt>
                <dd className={styles.resultValue}>
                  {people(casualties.tsunamiDeaths ?? 0)}
                  <span style={{ opacity: 0.75 }}>
                    {' '}
                    ({people(casualties.tsunamiDeathsLow ?? 0)} –{' '}
                    {people(casualties.tsunamiDeathsHigh ?? 0)})
                  </span>
                </dd>
              </>
            )}
            {casualties.model === 'blast' && (
              <>
                <dt className={styles.resultLabel}>{t('casualties.injured')}</dt>
                <dd className={styles.resultValue}>{people(casualties.injured)}</dd>
              </>
            )}
            <dt className={styles.resultLabel}>{t('casualties.exposed')}</dt>
            <dd className={styles.resultValue}>{people(casualties.exposed)}</dd>
          </dl>
          {/* What the pair beside the figure is. A band drawn from the
              published input scatter is a different claim from the
              gentlest and harshest rows of a vulnerability table, and
              a reader cannot tell the two apart by looking. */}
          {casualties.predictiveBand === true && (
            <p className={styles.mcFooter}>
              {t('casualties.bandNote')}
              {(casualties.tsunamiDeaths ?? 0) > 0 && ` ${t('casualties.bandNoteWave')}`}
            </p>
          )}
          {!compact && (
            <table className={styles.mcTable}>
              <thead>
                <tr>
                  <th>{t('casualties.table.band')}</th>
                  <th>{t('casualties.table.radius')}</th>
                  <th>{t('casualties.table.population')}</th>
                  <th>{t('casualties.table.mortality')}</th>
                  <th>{t('casualties.table.deaths')}</th>
                  <th>{t('casualties.table.hazards')}</th>
                </tr>
              </thead>
              <tbody>
                {casualties.bands.map((band) => (
                  <tr key={band.key}>
                    <td>{t(`casualties.band.${bandLabelKey(band, casualties.model)}`)}</td>
                    <td>
                      {band.window !== undefined
                        ? `${formatElapsed(band.window.startS)} – ${formatElapsed(band.window.endS)}`
                        : `${formatWithUnitTiers(band.innerRadiusM, TIERS_RANGE)} – ${formatWithUnitTiers(band.outerRadiusM, TIERS_RANGE)}`}
                    </td>
                    <td>{people(band.population)}</td>
                    <td>
                      {(band.mortality * 100).toLocaleString(locale, { maximumFractionDigits: 1 })}{' '}
                      %
                    </td>
                    <td>{people(band.deaths)}</td>
                    <td>{band.hazards.map((h) => t(`casualties.hazard.${h}`)).join(' · ')}</td>
                  </tr>
                ))}
              </tbody>
              {/* The column adds up, and now says so. Each figure is
                  rounded to two significant figures on its own, so the
                  printed rows can miss the printed total by a little;
                  the underlying numbers reconcile exactly. */}
              <tfoot>
                <tr>
                  <td colSpan={2}>{t('casualties.table.total')}</td>
                  <td>{people(casualties.exposed)}</td>
                  <td>
                    {casualties.exposed > 0
                      ? ((casualties.deaths / casualties.exposed) * 100).toLocaleString(locale, {
                          maximumFractionDigits: 1,
                        })
                      : '0'}{' '}
                    %
                  </td>
                  <td>{people(casualties.deaths)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
          {(casualties.tsunamiDeaths ?? 0) > 0 && (
            <p className={styles.mcFooter}>{t('casualties.coarseCoast')}</p>
          )}
          <p className={styles.mcFooter}>
            {t(
              `casualties.model.${casualties.model === 'blast' && casualties.conventional === true ? 'blastChemical' : casualties.model}`
            )}{' '}
            · {t(`casualties.method.${casualties.method}`, { source: casualties.source })}
          </p>
          <p className={styles.mcFooter}>{t('casualties.disclaimer')}</p>
          {envelope !== null && <EnvelopeNote envelope={envelope} compact={compact} />}
        </>
      )}
    </section>
  );
}
