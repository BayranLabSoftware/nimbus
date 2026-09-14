import type { JSX, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import report from '../../../docs/VALIDATION_REPORT.json';
import { BUILD_INFO, shortCommit, validationReportUrl, REPOSITORY_URL } from '../../buildInfo.js';
import { useAppStore } from '../../store/index.js';
import { cx } from '../utils/cx';
import styles from './ValidationPage.module.css';
import { VALIDATION_GAPS } from './validationGaps.js';

/**
 * The model against the record, in public.
 *
 * Every figure on this page is read from `docs/VALIDATION_REPORT.json`,
 * which the report generator writes from the code and CI refuses to
 * let drift from it by a single byte. So the page cannot go stale any
 * more than the report can, and it says nothing the report does not:
 * the tolls that sit inside the model's band, the ones that do not,
 * and — for every one that does not — the named cause.
 *
 * The misses are the point of the page rather than its fine print. A
 * simulator that shows only where it is right is asking to be taken on
 * trust; one that shows where it is wrong and why is giving a reader
 * the means not to.
 */

interface TollRow {
  event: string;
  recorded: number;
  recordedLow: number;
  recordedHigh: number;
  model: number;
  bandLow: number;
  bandHigh: number;
  ratio: number;
  contains: boolean;
  gated: boolean;
  cause: string | null;
  role: string;
  source: string;
}

interface WaveRow {
  record: string;
  rangeM: number;
  observedLowM: number;
  observedHighM: number;
  modelM: number;
  contains: boolean;
  globeM: number | null;
  globeContains: boolean | null;
  gated: boolean;
  role: string;
  source: string;
}

interface FootprintRow {
  event: string;
  mmi: number;
  shakemapKm2: number;
  modelKm2: number;
}

interface InterpolationRow {
  event: string;
  measuredLow: number;
  measuredHigh: number;
  interpolatedLow: number;
  interpolatedHigh: number;
  comparable: boolean;
  /** Whether the low end, on its own, has dead enough to compare. */
  lowComparable: boolean;
}

interface AnchorRow {
  name: string;
  eventType: string;
  quantities: string[];
  gated: string[];
  use: Record<string, { role: string; how: string } | undefined>;
  source: string;
}

interface ValidationReportData {
  calibration: {
    tolls: TollRow[];
    waves: WaveRow[];
    footprint: {
      rows: FootprintRow[];
      geometricMeanRadiusRatio: number;
      biasInStandardErrors: number;
      sdLn: number;
      /** The ceiling one sigma of ground motion implies, in radius. */
      expectedSdLn: number;
      /** The between-event part of it alone. */
      betweenEventSdLn: number;
      inventedBands: string[];
    };
    interpolation: InterpolationRow[];
    anchors: AnchorRow[];
  };
}

const DATA: ValidationReportData = report;

/** The causes the page can explain; the harness test holds every miss
 *  to one of these. */
const CAUSES = [
  'evacuation',
  'buildingStock',
  'populationRaster',
  'drownedOffline',
  'populationChanged',
  'occupancy',
  'mechanismNotModelled',
  'belowResolution',
] as const;
type Cause = (typeof CAUSES)[number];
const isCause = (c: string | null): c is Cause =>
  c !== null && (CAUSES as readonly string[]).includes(c);

/** Whether the model was set on the event behind a check, most
 *  compromising first — `CalibrationRole` in calibrationEnvelope.ts. */
const ROLES = ['tuned', 'inputInferred', 'sameSource', 'heldOut', 'unestablished'] as const;
type Role = (typeof ROLES)[number];
const isRole = (r: string | undefined): r is Role =>
  r !== undefined && (ROLES as readonly string[]).includes(r);

const FAMILIES = ['impact', 'explosion', 'earthquake', 'volcano', 'landslide'] as const;

const ROMAN: Readonly<Record<number, string>> = { 7: 'VII', 8: 'VIII', 9: 'IX' };

export function ValidationPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const setMode = useAppStore((s) => s.setMode);
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';

  const int = (n: number): string => Math.round(n).toLocaleString(locale);
  const dec = (n: number, digits: number): string =>
    n.toLocaleString(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const metres = (v: number): string => `${dec(v, v >= 10 ? 1 : 2)} m`;
  const distance = (m: number): string => (m >= 10_000 ? `${int(m / 1000)} km` : `${int(m)} m`);

  const { tolls, waves, footprint, interpolation, anchors } = DATA.calibration;

  const tollsInside = tolls.filter((r) => r.contains).length;
  const gated = tolls.filter((r) => r.gated);
  const wavesInside = waves.filter((r) => r.contains).length;
  const globeMisses = waves.filter((r) => r.globeContains === false);
  const causesShown = CAUSES.filter((c) => tolls.some((r) => r.cause === c));
  const heldTolls = tolls.filter((r) => r.role === 'heldOut');
  const heldWaves = waves.filter((r) => r.role === 'heldOut');
  // A held-out row that passes on a record of nothing — no dead, no
  // wave — checks a rule rather than a number; the tile says so.
  const heldInside = [
    ...heldTolls.filter((r) => r.contains).map((r) => r.recorded === 0),
    ...heldWaves.filter((r) => r.contains).map((r) => r.observedHighM <= 0),
  ];
  const heldInsideAllZeros = heldInside.length > 0 && heldInside.every(Boolean);
  const checks = anchors.flatMap((a) =>
    a.quantities.map((q) => ({ name: a.name, quantity: q, role: a.use[q]?.role }))
  );
  const worstInterpolation = interpolation
    .filter((r) => r.comparable)
    .reduce((worst, r) => {
      const f = (a: number, b: number): number => {
        const x = Math.max(a, 1);
        const y = Math.max(b, 1);
        return x > y ? x / y : y / x;
      };
      return Math.max(
        worst,
        r.lowComparable ? f(r.measuredLow, r.interpolatedLow) : 1,
        f(r.measuredHigh, r.interpolatedHigh)
      );
    }, 1);

  const recorded = (r: TollRow): string =>
    r.recordedLow === r.recordedHigh
      ? int(r.recorded)
      : `${int(r.recorded)} (${int(r.recordedLow)}–${int(r.recordedHigh)})`;

  const ratio = (r: TollRow): string => {
    if (r.recorded === 0) return r.model === 0 ? t('validation.table.bothZero') : '—';
    return `${dec(r.ratio, 2)}×`;
  };

  const footprintRatio = (r: FootprintRow): string => {
    if (r.shakemapKm2 === 0 && r.modelKm2 === 0) return t('validation.footprint.neither');
    if (r.shakemapKm2 === 0) return t('validation.footprint.fromNothing');
    return `${dec(r.modelKm2 / r.shakemapKm2, 2)}×`;
  };

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
              {tollsInside} / {tolls.length}
            </span>
            <span className={styles.tileLabel}>{t('validation.summary.tolls')}</span>
            <span className={styles.tileNote}>
              {t('validation.summary.tollsGated', {
                pass: gated.filter((r) => r.contains).length,
                total: gated.length,
              })}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>
              {wavesInside} / {waves.length}
            </span>
            <span className={styles.tileLabel}>{t('validation.summary.waves')}</span>
            {globeMisses.length > 0 && (
              <span className={cx(styles.tileNote, styles.tileWarn)}>
                {t('validation.summary.wavesGlobe', { count: globeMisses.length })}
              </span>
            )}
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>{dec(footprint.geometricMeanRadiusRatio, 2)}×</span>
            <span className={styles.tileLabel}>{t('validation.summary.footprint')}</span>
            <span className={styles.tileNote}>
              {t('validation.summary.footprintScatter', {
                sd: dec(footprint.sdLn, 2),
                expected: dec(footprint.expectedSdLn, 2),
              })}
            </span>
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>
              {heldTolls.filter((r) => r.contains).length +
                heldWaves.filter((r) => r.contains).length}{' '}
              / {heldTolls.length + heldWaves.length}
            </span>
            <span className={styles.tileLabel}>{t('validation.summary.heldOut')}</span>
            <span className={styles.tileNote}>
              {t('validation.summary.heldOutNote', {
                tollsInside: heldTolls.filter((r) => r.contains).length,
                tolls: heldTolls.length,
                wavesInside: heldWaves.filter((r) => r.contains).length,
                waves: heldWaves.length,
              })}
            </span>
            {heldInsideAllZeros && (
              <span className={cx(styles.tileNote, styles.tileWarn)}>
                {t('validation.summary.heldOutZeros')}
              </span>
            )}
          </li>
          <li className={styles.tile}>
            <span className={styles.tileValue}>{footprint.inventedBands.length}</span>
            <span className={styles.tileLabel}>{t('validation.summary.invented')}</span>
          </li>
        </ul>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.tolls.title')}</h2>
        <p className={styles.prose}>{t('validation.tolls.body')}</p>
        <TableRegion label={t('validation.tolls.title')}>
          <table className={styles.table} data-testid="validation-tolls">
            <thead>
              <tr>
                <th scope="col">{t('validation.table.event')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.recorded')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.model')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.band')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.ratio')}
                </th>
                <th scope="col">{t('validation.table.verdict')}</th>
                <th scope="col">{t('validation.table.cause')}</th>
                <th scope="col">{t('validation.table.role')}</th>
              </tr>
            </thead>
            <tbody>
              {tolls.map((r) => (
                <tr key={r.event}>
                  <th scope="row">
                    {r.event}
                    {r.gated && (
                      <span className={styles.gated}>{t('validation.standing.gated')}</span>
                    )}
                  </th>
                  <td className={styles.num}>{recorded(r)}</td>
                  <td className={styles.num}>{int(r.model)}</td>
                  <td className={styles.num}>
                    {int(r.bandLow)} – {int(r.bandHigh)}
                  </td>
                  <td className={styles.num}>{ratio(r)}</td>
                  <td>
                    <Verdict inside={r.contains} />
                  </td>
                  <td>{isCause(r.cause) ? t(`validation.causes.${r.cause}.label`) : '—'}</td>
                  <td>
                    <RoleChip role={r.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.causesTitle')}</h2>
        <p className={styles.prose}>{t('validation.causesBody')}</p>
        <dl className={styles.causes}>
          {causesShown.map((c) => (
            <div key={c} className={styles.cause}>
              <dt>{t(`validation.causes.${c}.label`)}</dt>
              <dd>
                <p>{t(`validation.causes.${c}.body`)}</p>
                <p className={styles.causeEvents}>
                  {tolls
                    .filter((r) => r.cause === c)
                    .map((r) => r.event)
                    .join(' · ')}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.waves.title')}</h2>
        <p className={styles.prose}>{t('validation.waves.body')}</p>
        <TableRegion label={t('validation.waves.title')}>
          <table className={styles.table} data-testid="validation-waves">
            <thead>
              <tr>
                <th scope="col">{t('validation.table.record')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.range')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.observed')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.model')}
                </th>
                <th scope="col">{t('validation.table.verdict')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.globe')}
                </th>
                <th scope="col">{t('validation.table.role')}</th>
              </tr>
            </thead>
            <tbody>
              {waves.map((r) => (
                <tr key={r.record}>
                  <th scope="row">{r.record}</th>
                  <td className={styles.num}>{distance(r.rangeM)}</td>
                  <td className={styles.num}>
                    {r.observedHighM <= 0
                      ? t('validation.waves.noWave')
                      : `${metres(r.observedLowM)} – ${metres(r.observedHighM)}`}
                  </td>
                  <td className={styles.num}>{metres(r.modelM)}</td>
                  <td>
                    <Verdict inside={r.contains} />
                  </td>
                  <td className={styles.num}>
                    {r.globeM === null ? (
                      t('validation.waves.globeSame')
                    ) : (
                      <>
                        {metres(r.globeM)} {r.globeContains === false && <Verdict inside={false} />}
                      </>
                    )}
                  </td>
                  <td>
                    <RoleChip role={r.role} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        {globeMisses.length > 0 && (
          <p className={styles.note}>
            {t('validation.waves.globeNote', {
              list: globeMisses.map((r) => r.record).join(' · '),
            })}
          </p>
        )}
      </section>

      <section className={styles.section}>
        <h2>{t('validation.footprint.title')}</h2>
        <p className={styles.prose}>{t('validation.footprint.body')}</p>
        <TableRegion label={t('validation.footprint.title')}>
          <table className={styles.table} data-testid="validation-footprint">
            <thead>
              <tr>
                <th scope="col">{t('validation.table.event')}</th>
                <th scope="col">{t('validation.table.threshold')}</th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.shakemap')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.model')}
                </th>
                <th scope="col" className={styles.num}>
                  {t('validation.table.ratio')}
                </th>
              </tr>
            </thead>
            <tbody>
              {footprint.rows.map((r) => (
                <tr key={`${r.event}-${r.mmi.toString()}`}>
                  <th scope="row">{r.event}</th>
                  <td>MMI ≥ {ROMAN[r.mmi] ?? r.mmi}</td>
                  <td className={styles.num}>{int(r.shakemapKm2)} km²</td>
                  <td className={styles.num}>{int(r.modelKm2)} km²</td>
                  <td className={styles.num}>{footprintRatio(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableRegion>
        <p className={styles.note}>
          {/* A median can be held to being centred, and the answer is a
              standard error rather than a bound somebody picked: inside
              two of them the model cannot be shown to be off-centre. */}
          {t(
            footprint.biasInStandardErrors < 2
              ? 'validation.footprint.bias'
              : 'validation.footprint.biasOff',
            {
              ratio: dec(footprint.geometricMeanRadiusRatio, 2),
              se: dec(footprint.biasInStandardErrors, 2),
              sd: dec(footprint.sdLn, 2),
              expected: dec(footprint.expectedSdLn, 2),
              between: dec(footprint.betweenEventSdLn, 2),
            }
          )}
        </p>
        {footprint.inventedBands.length > 0 && (
          <p className={styles.note}>
            {t('validation.footprint.invented', { list: footprint.inventedBands.join(' · ') })}
          </p>
        )}
      </section>

      <section className={styles.section}>
        <details className={styles.details}>
          <summary>{t('validation.interpolation.title')}</summary>
          <p className={styles.prose}>{t('validation.interpolation.body')}</p>
          <TableRegion label={t('validation.interpolation.title')}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">{t('validation.table.event')}</th>
                  <th scope="col" className={styles.num}>
                    {t('validation.interpolation.measured')}
                  </th>
                  <th scope="col" className={styles.num}>
                    {t('validation.interpolation.interpolated')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {interpolation.map((r) => (
                  <tr key={r.event}>
                    <th scope="row">{r.event}</th>
                    <td className={styles.num}>
                      {int(r.measuredLow)} – {int(r.measuredHigh)}
                    </td>
                    <td className={styles.num}>
                      {int(r.interpolatedLow)} – {int(r.interpolatedHigh)}
                      {!r.comparable && ` · ${t('validation.interpolation.tooFew')}`}
                      {r.comparable &&
                        !r.lowComparable &&
                        ` · ${t('validation.interpolation.tooFewLow')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableRegion>
          <p className={styles.note}>
            {t('validation.interpolation.worst', { factor: dec(worstInterpolation, 2) })}
          </p>
        </details>
      </section>

      <section className={styles.section} data-testid="validation-roles">
        <h2>{t('validation.roles.title')}</h2>
        <p className={styles.prose}>{t('validation.roles.body')}</p>
        <dl className={styles.causes}>
          {ROLES.filter((role) => checks.some((c) => c.role === role)).map((role) => (
            <div key={role} className={styles.cause}>
              <dt>{t(`validation.role.${role}.label`)}</dt>
              <dd>
                <p>{t(`validation.role.${role}.body`)}</p>
                <p className={styles.causeEvents}>
                  {checks
                    .filter((c) => c.role === role)
                    .map((c) => `${c.name} (${t(`validation.quantity.${c.quantity}`)})`)
                    .join(' · ')}
                </p>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.anchors.title')}</h2>
        <p className={styles.prose}>{t('validation.anchors.body')}</p>
        <div className={styles.families}>
          {FAMILIES.map((family) => (
            <div key={family} className={styles.family}>
              <h3>{t(`simulator.eventTypes.${family}`)}</h3>
              <ul>
                {anchors
                  .filter((a) => a.eventType === family)
                  .map((a) => (
                    <li key={a.name}>
                      <span className={styles.anchorName}>{a.name}</span>
                      <span className={styles.anchorQuantities}>
                        {a.quantities.map((q) => (
                          <span
                            key={q}
                            className={a.gated.includes(q) ? styles.chipGated : styles.chip}
                          >
                            {t(`validation.quantity.${q}`)} ·{' '}
                            {t(
                              a.gated.includes(q)
                                ? 'validation.standing.gated'
                                : 'validation.standing.declared'
                            )}
                            <AnchorRole role={a.use[q]?.role} />
                          </span>
                        ))}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>{t('validation.gaps.title')}</h2>
        <p className={styles.prose}>{t('validation.gaps.body')}</p>
        <ul className={styles.gaps}>
          {VALIDATION_GAPS.map((g) => (
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

/** The role beside an anchor's quantity chip, when it has one. */
function AnchorRole({ role }: { role: string | undefined }): JSX.Element | null {
  const { t } = useTranslation();
  if (!isRole(role)) return null;
  return <> · {t(`validation.role.${role}.label`)}</>;
}

/** Whether the model was set on the event behind a row. Held out is the
 *  one that counts as validation, so it is the one set apart. */
function RoleChip({ role }: { role: string }): JSX.Element {
  const { t } = useTranslation();
  if (!isRole(role)) return <>—</>;
  return (
    <span className={role === 'heldOut' ? styles.chipHeldOut : styles.chip}>
      {t(`validation.role.${role}.label`)}
    </span>
  );
}

function Verdict({ inside }: { inside: boolean }): JSX.Element {
  const { t } = useTranslation();
  return (
    <span className={inside ? styles.inside : styles.misses}>
      {t(inside ? 'validation.verdict.inside' : 'validation.verdict.misses')}
    </span>
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
