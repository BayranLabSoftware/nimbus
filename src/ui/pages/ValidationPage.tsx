import type { TFunction } from 'i18next';
import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import report from '../../../docs/VALIDATION_REPORT.json';
import { MAIN_STAGE_STRENGTH } from '../../physics/effects/atmosphericEntry.js';
import { BUILD_INFO, shortCommit, validationReportUrl, REPOSITORY_URL } from '../../buildInfo.js';
import { useAppStore } from '../../store/index.js';
import { EvidenceTable } from '../components/EvidenceTable.js';
import { cx } from '../utils/cx';
import { ProgramChart, type ProgramChartRow } from './landing/ProgramChart.js';
import styles from './ValidationPage.module.css';
import { IMPACT_GAPS } from './validationGaps.js';

/**
 * The impacts against what has been measured, in public.
 *
 * Every figure on this page is read from `docs/VALIDATION_REPORT.json`,
 * which the report generator writes from the code and CI refuses to let
 * drift from it by a single byte. So the page cannot go stale any more than
 * the report can, and it says nothing the report does not.
 *
 * Until 22 September 2026 this page carried all five modules: eighteen
 * recorded death tolls, sixteen wave heights, the ShakeMap footprints, the
 * sets chosen by rule for earthquakes and plumes. The site is now an
 * instrument for cosmic impacts alone (store/visibleEvents.ts), and Andrea's
 * decision that evening was that the page shows the impacts' own evidence and
 * says plainly what is not there — rather than leaving a reader to take a
 * calibration made on explosions and earthquakes for a validation of impacts.
 * Those tables are in the report, which is linked from the top of the page,
 * and they come back with their modules.
 *
 * What is here, in order: how far the pipeline is from the reference
 * implementation of the equations it cites; what the sky has actually
 * measured of an entry; the rules of the gold standard the domain holds and
 * the one it does not; what has never been measured at all; and the gaps the
 * model declares. The misses are the point of the page rather than its fine
 * print. A simulator that shows only where it is right is asking to be taken
 * on trust; one that shows where it is wrong and why is giving a reader the
 * means not to.
 */

interface EiepSummary extends ProgramChartRow {
  min: number;
  max: number;
}

interface EntryReading {
  rows: number;
  burst: number;
  toTheGround: number;
  medianAbsoluteErrorKm: number;
  meanErrorKm: number;
  withinFiveKm: number;
}

interface RuleClause {
  name: string;
  status: string;
}

interface DomainRule {
  rule: string;
  measure: string;
  holds: boolean;
  credit: number;
  status: string | null;
  clauses: RuleClause[];
}

interface ReportData {
  goldStandard: {
    domains: {
      domain: string;
      rules: DomainRule[];
      held: number;
      pending: number;
      reading: number;
    }[];
  };
  gate: { decision: string };
  replay: { total: number; passed: number };
  golden: { total: number; passed: number };
  verification: {
    eiep: {
      readOn: string;
      impacts: number;
      failed: number;
      summaries: EiepSummary[];
      regimes: Record<string, number>;
      craters: Record<string, number>;
    };
    levelA: {
      readOn: string;
      cases: number;
      programFailed: number;
      readings: number;
    };
  };
  calibration: {
    fireball: {
      readOn: string;
      events: { bolides: number; fast: number };
      meetsBar: boolean;
      readings: Record<string, EntryReading>;
    };
    entryCells: {
      spans: { key: string; unit: string; from: number; to: number }[];
      rows: number;
      scored: boolean;
      counts: { within: number; bm13: number; departs: number };
      model: { medianAbsKm: number };
      program: { medianAbsKm: number };
      g2: string;
      g3: string;
    }[];
  };
}

const DATA = report as unknown as ReportData;

/**
 * A clause of a rule, in the reader's language. The report writes the names
 * in English — it is a document for reviewers — so the page looks each one up
 * by its slug and falls back to the report's own words for a clause added
 * since this was translated, rather than printing a key.
 */
function clauseName(t: TFunction, name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return t(`validation.rules.clause.${slug}`, { defaultValue: name });
}

/** The readings of the entry the page prints, in this order. */
const ENTRY_READINGS = ['default', 'stony', 'iron'] as const;

export function ValidationPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setMode = useAppStore((s) => s.setMode);
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';

  const int = (n: number): string => Math.round(n).toLocaleString(locale);
  const dec = (n: number, digits: number): string =>
    n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const ratio = (v: number): string => `${dec(v, 3)}×`;

  const { eiep, levelA } = DATA.verification;
  const { fireball, entryCells } = DATA.calibration;
  const impacts = DATA.goldStandard.domains.find((d) => d.domain === 'Impacts');
  const quantities = eiep.summaries;
  const worstPercent = dec(
    Math.max(...quantities.map((q) => Math.abs(q.geometricMean - 1))) * 100,
    1
  );
  const comparisons = quantities.reduce((sum, q) => sum + q.pairs, 0);
  const entry = fireball.readings.default;
  // Rule 1207: the miss the bar reads, and each side's range across the
  // cells -- the model on the law it ships, the program on its own (Eq. 9).
  const span = (xs: number[]): { from: string; to: string } => ({
    from: dec(Math.min(...xs), 2),
    to: dec(Math.max(...xs), 2),
  });
  const programSpan = span(entryCells.map((c) => c.program.medianAbsKm));
  const modelSpan = span(entryCells.map((c) => c.model.medianAbsKm));

  const provenance = (): JSX.Element => {
    if (BUILD_INFO.commit === null) return <>{t('validation.provenanceUnknown')}</>;
    const short = shortCommit(BUILD_INFO.commit);
    if (BUILD_INFO.dirty) return <>{t('validation.provenanceDirty', { commit: short })}</>;
    return (
      <>
        {t('validation.provenance', { commit: short })}{' '}
        <a href={validationReportUrl(BUILD_INFO.commit)}>{t('validation.fullReport')}</a>
      </>
    );
  };

  return (
    <div className={styles.root} data-testid="validation-page">
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => {
            setMode('landing');
          }}
        >
          ← {t('validation.back')}
        </button>
        <h1 className={styles.title}>{t('validation.title')}</h1>
        <p className={styles.subtitle}>{t('validation.subtitle')}</p>
        <p className={styles.provenance} data-testid="validation-provenance">
          {provenance()}
        </p>
      </header>

      <section className={styles.section} aria-label={t('validation.summaryLabel')}>
        <ul className={styles.tiles}>
          <li className={styles.tile}>
            <span className={styles.tileValue}>
              {quantities.length} / {quantities.length}
            </span>
            <span className={styles.tileLabel}>{t('validation.summary.quantities')}</span>
            <span className={styles.tileNote}>
              {t('validation.summary.quantitiesNote', { percent: worstPercent })}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>{int(comparisons)}</span>
            <span className={styles.tileLabel}>{t('validation.summary.comparisons')}</span>
            <span className={styles.tileNote}>
              {t('validation.summary.comparisonsNote', {
                answered: int(eiep.impacts - eiep.failed),
                impacts: int(eiep.impacts),
                readOn: eiep.readOn,
                casesA: int(levelA.cases),
                refusedA: int(levelA.programFailed),
                readingsA: int(levelA.readings),
                readOnA: levelA.readOn,
              })}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>{dec(entry?.medianAbsoluteErrorKm ?? 0, 1)} km</span>
            <span className={styles.tileLabel}>{t('validation.summary.entry')}</span>
            <span className={cx(styles.tileNote, styles.tileWarn)}>
              {t('validation.summary.entryNote', { bolides: fireball.events.bolides })}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>0</span>
            <span className={styles.tileLabel}>{t('validation.summary.tollsMeasured')}</span>
            <span className={cx(styles.tileNote, styles.tileWarn)}>
              {t('validation.summary.tollsMeasuredNote')}
            </span>
          </li>
        </ul>
      </section>

      <section className={styles.section} data-testid="validation-program">
        <h2>{t('validation.program.title')}</h2>
        <p className={styles.prose}>{t('validation.program.body')}</p>
        <ProgramChart rows={quantities} />
        <TableRegion label={t('validation.program.title')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('landing.validation.tableQuantity')}</th>
                <th scope="col" className={styles.num}>
                  {t('landing.validation.tableCases')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('landing.validation.tableRatio')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('landing.validation.tableSpread')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.program.extremes')}
                </th>
              </tr>
            </thead>
            <tbody>
              {quantities.map((q) => (
                <tr key={q.quantity}>
                  <th scope="row">{t(`landing.validation.quantities.${q.quantity}`)}</th>
                  <td className={styles.num}>{int(q.pairs)}</td>
                  <td className={styles.num}>{ratio(q.geometricMean)}</td>
                  <td className={styles.num}>
                    {ratio(q.p10)}–{ratio(q.p90)}
                  </td>
                  <td className={styles.num}>
                    {ratio(q.min)}–{ratio(q.max)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <p className={styles.note}>
          {t('validation.program.regimes', {
            regimes: Object.entries(eiep.regimes)
              .map(([k, n]) => `${k} (${int(n)})`)
              .join(' · '),
            craters: Object.entries(eiep.craters)
              .map(([k, n]) => `${k} (${int(n)})`)
              .join(' · '),
          })}
        </p>
        {eiep.failed > 0 && (
          <p className={styles.note}>
            {t('validation.program.failed', { count: eiep.failed, impacts: eiep.impacts })}
          </p>
        )}
      </section>

      <section className={styles.section} data-testid="validation-entry">
        <h2>{t('validation.entry.title')}</h2>
        <p className={styles.prose}>
          {t('validation.entry.body', {
            bolides: fireball.events.bolides,
            readOn: fireball.readOn,
          })}
        </p>
        <TableRegion label={t('validation.entry.title')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('validation.entry.reading')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.median')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.mean')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.withinFive')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.toTheGround')}
                </th>
              </tr>
            </thead>
            <tbody>
              {ENTRY_READINGS.map((key) => {
                const row = fireball.readings[key];
                if (row === undefined) return null;
                return (
                  <tr key={key}>
                    <th scope="row">
                      {t(`validation.entry.readings.${key}`, {
                        strength: dec((MAIN_STAGE_STRENGTH as number) / 1e6, 1),
                      })}
                    </th>
                    <td className={styles.num}>{dec(row.medianAbsoluteErrorKm, 2)} km</td>
                    <td className={styles.num}>{dec(row.meanErrorKm, 2)} km</td>
                    <td className={styles.num}>
                      {int(row.withinFiveKm)} / {int(row.rows)}
                    </td>
                    <td className={styles.num}>{int(row.toTheGround)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableRegion>
        <p className={styles.note}>
          {fireball.meetsBar
            ? t('validation.entry.barMet')
            : t('validation.entry.barMissed', {
                median: entry === undefined ? '—' : dec(entry.medianAbsoluteErrorKm, 2),
                programFrom: programSpan.from,
                programTo: programSpan.to,
                modelFrom: modelSpan.from,
                modelTo: modelSpan.to,
              })}
        </p>
        <TableRegion label={t('validation.entry.cells')}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th scope="col">{t('validation.entry.cell')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.rows')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.model')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.program')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.entry.within')}
                </th>
              </tr>
            </thead>
            <tbody>
              {entryCells.map((cell) => {
                const label = cell.spans
                  .map(
                    (s) =>
                      `${t(`validation.entry.span.${s.key}`)} ${dec(s.from, 2)}–${dec(s.to, 2)} ${s.unit}`
                  )
                  .join(' · ');
                return (
                  <tr key={label}>
                    <th scope="row">{label}</th>
                    <td className={styles.num}>{int(cell.rows)}</td>
                    <td className={styles.num}>{dec(cell.model.medianAbsKm, 2)} km</td>
                    <td className={styles.num}>{dec(cell.program.medianAbsKm, 2)} km</td>
                    <td className={styles.num}>
                      {int(cell.counts.within)} / {int(cell.rows)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableRegion>
        <p className={styles.note}>{t('validation.entry.cellsNote')}</p>
      </section>

      {impacts && (
        <section className={styles.section} data-testid="validation-rules">
          <h2>{t('validation.rules.title')}</h2>
          <p className={styles.prose}>{t('validation.rules.body')}</p>
          <p className={styles.note}>
            {t('validation.rules.reading', {
              held: impacts.held,
              of: impacts.rules.length,
              reading: dec(impacts.reading, 1),
            })}
          </p>
          <TableRegion label={t('validation.rules.title')}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('validation.rules.rule')}</th>
                  <th scope="col">{t('validation.rules.asks')}</th>
                  <th scope="col">{t('validation.rules.measure')}</th>
                  <th scope="col">{t('validation.rules.status')}</th>
                </tr>
              </thead>
              <tbody>
                {impacts.rules.map((rule) => (
                  <tr key={rule.rule}>
                    <th scope="row">{rule.rule}</th>
                    <td>{t(`validation.rules.ask.${rule.rule}`)}</td>
                    <td>{t(`validation.rules.measures.${rule.measure}`)}</td>
                    <td>
                      <span className={rule.holds ? styles.inside : styles.misses}>
                        {t(rule.holds ? 'validation.rules.held' : 'validation.rules.notHeld')}
                      </span>
                      {rule.clauses.length > 0 && (
                        <span className={styles.tileNote}>
                          {' '}
                          {t('validation.rules.clauses', {
                            met: rule.clauses.filter((c) => c.status === 'met').length,
                            total: rule.clauses.length,
                          })}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
          {impacts.rules
            .filter((rule) => rule.clauses.length > 0)
            .map((rule) => (
              <p key={rule.rule} className={styles.note}>
                <strong>{rule.rule}</strong>
                {' — '}
                {rule.clauses.map((c) => clauseName(t, c.name)).join(' · ')}
              </p>
            ))}
        </section>
      )}

      <section className={styles.section} data-testid="validation-evidence">
        <EvidenceTable tone="page" />
      </section>

      <section className={styles.section} data-testid="validation-unmeasured">
        <h2>{t('validation.unmeasured.title')}</h2>
        <p className={styles.prose}>{t('validation.unmeasured.body')}</p>
        <ul className={styles.gaps}>
          <li>
            <strong>{t('validation.unmeasured.toll.item')}</strong>
            <span>{t('validation.unmeasured.toll.note')}</span>
          </li>
          <li>
            <strong>{t('validation.unmeasured.wave.item')}</strong>
            <span>{t('validation.unmeasured.wave.note')}</span>
          </li>
          <li>
            <strong>{t('validation.unmeasured.crater.item')}</strong>
            <span>{t('validation.unmeasured.crater.note')}</span>
          </li>
        </ul>
        <p className={styles.note}>{t('validation.unmeasured.others')}</p>
      </section>

      <section className={styles.section} data-testid="validation-gate">
        <h2>{t('validation.gate.title')}</h2>
        <p className={styles.prose}>
          {t('validation.gate.body', {
            replayPassed: DATA.replay.passed,
            replayTotal: DATA.replay.total,
            goldenPassed: DATA.golden.passed,
            goldenTotal: DATA.golden.total,
          })}
        </p>
        <p className={styles.note}>
          <span className={DATA.gate.decision === 'pass' ? styles.inside : styles.misses}>
            {t(`validation.gate.${DATA.gate.decision === 'pass' ? 'pass' : 'fail'}`)}
          </span>
        </p>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.gaps.title')}</h2>
        <p className={styles.prose}>{t('validation.gaps.body')}</p>
        <ul className={styles.gaps}>
          {IMPACT_GAPS.map((g) => (
            <li key={g}>
              <strong>{t(`validation.gaps.${g}.item`)}</strong>
              <span>{t(`validation.gaps.${g}.note`)}</span>
            </li>
          ))}
        </ul>
      </section>

      <footer className={styles.footer}>
        <p>
          {t('validation.footer')}{' '}
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => {
              setMode('methodology');
            }}
          >
            {t('validation.toMethodology')}
          </button>
          {' · '}
          <a href={REPOSITORY_URL}>{t('footer.github')}</a>
        </p>
      </footer>
    </div>
  );
}

/**
 * A table too wide for a phone scrolls inside its own box, and a box
 * that scrolls has to be reachable from the keyboard or it is only
 * scrollable with a mouse. So it takes focus and says what it holds.
 */
function TableRegion({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a scrollable region must be focusable (WCAG 2.1.1; axe scrollable-region-focusable)
    <div className={styles.tableWrap} role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
