import { useEffect, useMemo, useRef, useState, type JSX, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { BUILD_INFO, commitUrl, shortCommit, validationReportUrl } from '../../../buildInfo.js';
import { buildImpactCascade } from '../../../physics/cascade.js';
import { IMPACT_PRESETS, type ImpactScenarioResult } from '../../../physics/simulate.js';
import { envelopeOf } from '../../../physics/validation/calibrationEnvelope.js';
import { loadCityIndex, type CityRecord } from '../../../scene/globe/cityLabels.js';
import {
  formatRange,
  isolineMembers,
  type ImpactMapLayer,
} from '../../../scene/globe/impactFieldMap.js';
import {
  reportMapBox,
  reportMapHalfWidth,
  type PopulationGridLike,
} from '../../../scene/globe/reportMap.js';
import { populationGridFor } from '../../../scene/populationLookup.js';
import { useAppStore, type ActiveResult } from '../../../store/index.js';
import { CascadeTimeline } from '../../components/CascadeTimeline.js';
import { CasualtiesPanel } from '../../components/CasualtiesPanel.js';
import { EvidenceTable } from '../../components/EvidenceTable.js';
import { EvidenceTag } from '../../components/EvidenceTag.js';
import {
  buildImpactReport,
  nearestPlace,
  thresholdRows,
  type ReportFigure,
  type ReportGroup,
} from './impactReportModel.js';
import { ReportColorbar } from './ReportColorbar.js';
import { ReportMap, type ReportMapProps } from './ReportMap.js';
import styles from './ImpactReport.module.css';

/** A string for CSS `content`, quoted. */
function cssString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function Sheet({
  children,
  foot,
  testId,
}: {
  children: ReactNode;
  foot: string;
  testId: string;
}): JSX.Element {
  return (
    <section className={styles.sheet} data-report-sheet={testId}>
      <div className={styles.sheetBody}>{children}</div>
      <footer className={styles.sheetFoot} aria-hidden="true">
        <span>{foot}</span>
      </footer>
    </section>
  );
}

function Legend({ layer, barHeight }: { layer: ImpactMapLayer; barHeight: number }): JSX.Element {
  return (
    <div>
      <div className={styles.legendTitle}>{layer.title}</div>
      <div className={styles.legendUnit}>{layer.unit}</div>
      <p className={styles.legendEvidence} data-evidence-class={layer.evidence.klass}>
        <b>{layer.evidence.label}.</b> {layer.evidence.summary}
      </p>
      {layer.colorbar !== null && <ReportColorbar spec={layer.colorbar} height={barHeight} />}
      {layer.categories.length > 0 && (
        <ul className={styles.cats}>
          {layer.categories.map((c) => (
            <li key={c.label} className={styles.cat}>
              <span
                className={[styles.swatch, c.color === 'transparent' ? styles.swatchLine : '']
                  .filter(Boolean)
                  .join(' ')}
                style={c.color === 'transparent' ? undefined : { backgroundColor: c.color }}
                aria-hidden="true"
              />
              <span>{c.label}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className={styles.notes}>
        {layer.notes.map((n) => (
          <div key={n.label} style={{ display: 'contents' }}>
            <dt>{n.label}</dt>
            <dd>{n.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function IsolineTable({
  layer,
  language,
}: {
  layer: ImpactMapLayer;
  language: string;
}): JSX.Element {
  const { t } = useTranslation();
  // A line's own sentence is printed where it tells the lines apart — the wind
  // on each overpressure, the fluence of each burn, the reach of each
  // intensity — and left out where every line says the same.
  // A line the globe draws for several thresholds that coincide there keeps a
  // row for each, at its own radius (B-119).
  const lines = layer.isolines.flatMap(isolineMembers);
  const distinct = new Set(lines.map((l) => l.description)).size > 1;
  const source = layer.isolines[0]?.source;
  return (
    <>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{t('report.impact.table.isoline')}</th>
            <th>{t('report.impact.table.marks')}</th>
            <th className={styles.num}>{t('report.impact.table.radius')}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l) => (
            <tr key={l.id}>
              <td className={styles.lab}>{l.label}</td>
              <td>
                {l.title}
                {distinct && <span className={styles.small}>{l.description}</span>}
              </td>
              <td className={styles.num}>{formatRange(l.radiusM, language)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {source !== undefined && (
        <p className={styles.sourceLine}>
          {t('report.impact.table.source')}: {source}
        </p>
      )}
    </>
  );
}

function ThresholdTable({
  layer,
  language,
}: {
  layer: ImpactMapLayer;
  language: string;
}): JSX.Element | null {
  const { t } = useTranslation();
  const rows = thresholdRows(layer, language);
  if (rows.length === 0) return null;
  const agreement = rows.every((r) => r.kind === 'agreement');
  const head = agreement
    ? ['threshold', 'agreeNear', 'agreeMedian', 'agreeFar']
    : ['threshold', 'p90', 'p50', 'p10', 'sigma'];
  return (
    <>
      <h3 className={styles.subheading}>{t('report.impact.thresholds.title')}</h3>
      <table className={styles.table}>
        <thead>
          <tr>
            {head.map((h, i) => (
              <th key={h} className={i === 0 ? undefined : styles.num}>
                {t(`report.impact.thresholds.${h}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={r.selected ? styles.selected : undefined}>
              <td>
                {r.label}
                {r.selected && (
                  <span className={styles.onMap}>{t('report.impact.thresholds.onMap')}</span>
                )}
                {r.unavailable !== null && <span className={styles.small}>{r.unavailable}</span>}
              </td>
              <td className={styles.num}>{r.near}</td>
              <td className={styles.num}>{r.median}</td>
              <td className={styles.num}>{r.far}</td>
              {!agreement && <td className={styles.num}>{r.sigma}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function Groups({ groups }: { groups: ReportGroup[] }): JSX.Element {
  const { t } = useTranslation();
  // Two columns of about as many rows each, groups kept whole.
  const total = groups.reduce((n, g) => n + g.rows.length + 1, 0);
  let seen = 0;
  const left: ReportGroup[] = [];
  const right: ReportGroup[] = [];
  for (const g of groups) {
    (seen < total / 2 ? left : right).push(g);
    seen += g.rows.length + 1;
  }
  const column = (list: ReportGroup[]): JSX.Element => (
    <div>
      {list.map((g) => (
        <div key={g.id} className={styles.group}>
          <h3 className={styles.groupTitle}>{g.title}</h3>
          <dl>
            {g.rows.map((r) => (
              <div key={r.id} className={styles.row}>
                <dt>
                  {r.label}
                  {r.evidence !== undefined && <EvidenceTag quantity={r.evidence} />}
                </dt>
                <dd>
                  {r.value}
                  {r.figure !== undefined && (
                    <span className={styles.figureRef}>
                      {t('report.impact.figureRef', { n: r.figure })}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
  return (
    <div className={styles.columns}>
      {column(left)}
      {column(right)}
    </div>
  );
}

/**
 * An impact's report (ROADMAP IMP-7c): the scenario's summary with its default
 * map, an atlas of every layer the globe draws — each map with its colour bar,
 * its isolines and what it cannot say — the numbers grouped by effect, the
 * toll and the sequence, and the formulas the run used with their sources.
 * Everything in the reader's language (B-110), as it prints (B-109).
 */
export function ImpactReport({
  active,
  result,
}: {
  active: ActiveResult;
  result: ImpactScenarioResult;
}): JSX.Element {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const italian = language.toLowerCase().startsWith('it');
  const evaluatedAtLocation = useAppStore((s) => s.lastEvaluatedAtLocation);
  const pickedLocation = useAppStore((s) => s.location);
  const location = evaluatedAtLocation ?? pickedLocation;
  const evaluatedAt = useAppStore((s) => s.lastEvaluatedAt);
  const preset = useAppStore((s) => s.impact.preset);
  const uncertaintyKey = useAppStore((s) => s.impactUncertaintyKey);
  const casualties = useAppStore((s) => s.casualties);
  const casualtyStatus = useAppStore((s) => s.casualtyStatus);
  const bathymetricTsunami = useAppStore((s) => s.bathymetricTsunami);
  const monteCarlo = useAppStore((s) => s.monteCarlo);
  const linkNotice = useAppStore((s) => s.linkNotice);
  const shotsRecord = useAppStore((s) => s.reportGlobeShots);
  const setMode = useAppStore((s) => s.setMode);
  const shots = shotsRecord !== null && shotsRecord.result === active ? shotsRecord.shots : {};
  const hasShots = Object.keys(shots).length > 0;

  const [cities, setCities] = useState<CityRecord[] | null>(null);
  useEffect(() => {
    let live = true;
    void loadCityIndex().then((list) => {
      if (live) setCities(list);
    });
    return () => {
      live = false;
    };
  }, []);

  const anchor = useMemo(
    () => (location === null ? null : { latDeg: location.latitude, lonDeg: location.longitude }),
    [location]
  );
  const nearest = useMemo(
    () =>
      cities === null || location === null || cities.length === 0
        ? null
        : nearestPlace(cities, location.latitude, location.longitude, language),
    [cities, location, language]
  );

  const model = useMemo(
    () =>
      buildImpactReport(result, {
        t,
        language,
        location,
        evaluatedAt,
        presetName: preset === 'CUSTOM' ? null : IMPACT_PRESETS[preset].name,
        uncertaintyKey,
        casualties,
        nearest,
        extras: {
          bathymetricTsunami: bathymetricTsunami !== null,
          monteCarlo: monteCarlo !== null,
          predictiveBand: casualties?.predictiveBand === true,
        },
      }),
    [
      result,
      t,
      language,
      location,
      evaluatedAt,
      preset,
      uncertaintyKey,
      casualties,
      nearest,
      bathymetricTsunami,
      monteCarlo,
    ]
  );

  // One population grid for every map, the widest map's box.
  const widest = useMemo(
    () => Math.max(0, ...model.figures.map((f) => reportMapHalfWidth(result, f.layer))),
    [model.figures, result]
  );
  const [population, setPopulation] = useState<PopulationGridLike | null | undefined>(undefined);
  useEffect(() => {
    if (anchor === null) {
      setPopulation(null);
      return;
    }
    let live = true;
    setPopulation(undefined);
    populationGridFor(reportMapBox(anchor, widest)).then(
      (grid) => {
        if (live) setPopulation(grid);
      },
      () => {
        if (live) setPopulation(null);
      }
    );
    return () => {
      live = false;
    };
  }, [anchor, widest]);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);
  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    []
  );

  // The link that reopens this very report, in the language it is read in:
  // the sender's, which the reader can change from the bar.
  const reportLink = ((): string => {
    const url = new URL(window.location.href);
    url.searchParams.set('m', 'report');
    url.searchParams.set('lng', italian ? 'it' : 'en');
    return url.toString();
  })();

  const switchLanguage = (lng: 'it' | 'en'): void => {
    void i18n.changeLanguage(lng);
    const url = new URL(window.location.href);
    url.searchParams.set('lng', lng);
    window.history.replaceState(window.history.state, '', url);
  };

  const copyLink = (): void => {
    const done = (): void => {
      setCopied(true);
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => {
        setCopied(false);
      }, 2_000);
    };
    try {
      void navigator.clipboard.writeText(reportLink).then(done, done);
    } catch {
      done();
    }
  };

  const name = preset === 'CUSTOM' ? t('report.impact.custom') : IMPACT_PRESETS[preset].name;
  const commit = BUILD_INFO.commit;
  const foot = t('report.impact.foot', {
    name,
    model: commit === null ? t('report.meta.modelUnknown') : shortCommit(commit),
  });
  const pageStyle = `@media print { @page { size: A4 portrait; margin: 12mm 14mm 16mm;
    @bottom-left { content: ${cssString(foot)}; font: 7pt 'JetBrains Mono', monospace; color: #77736b; }
    @bottom-right { content: ${cssString(t('report.impact.page'))} " " counter(page) " " ${cssString(t('report.impact.pageOf'))} " " counter(pages); font: 7pt 'JetBrains Mono', monospace; color: #77736b; } } }`;

  const craterLabel =
    (result.damage.craterRim as number) > 0
      ? t('globe.impactMap.craterLabel', {
          diameter: formatRange((result.damage.craterRim as number) * 2, language),
        })
      : null;
  const words: ReportMapProps['words'] = {
    north: t('report.impact.hemisphere.n'),
    onGlobe: t('report.impact.onGlobe'),
    hemispheres: {
      north: t('report.impact.hemisphere.n'),
      south: t('report.impact.hemisphere.s'),
      east: t('report.impact.hemisphere.e'),
      west: t('report.impact.hemisphere.w'),
    },
  };
  const credit = hasShots
    ? `${t('report.impact.credit.model')} · ${t('report.impact.credit.globe')}`
    : t('report.impact.credit.model');

  const map = (figure: ReportFigure, size: number, withCrater: boolean): JSX.Element | null =>
    anchor === null ? null : (
      <div>
        <ReportMap
          result={result}
          layer={figure.layer}
          anchor={anchor}
          size={size}
          resolution={size * 2}
          language={language}
          cities={cities}
          population={population}
          craterLabel={withCrater ? craterLabel : null}
          globeShot={shots[figure.layer.id] ?? null}
          words={words}
        />
        <p className={styles.credit}>{credit}</p>
      </div>
    );

  const card = (figure: ReportFigure): JSX.Element => (
    <section key={figure.layer.id} className={styles.figure}>
      <h2 className={styles.figureTitle}>
        {t('report.impact.figure', { n: figure.number })} · {figure.layer.title}
      </h2>
      <div className={styles.figHalf}>
        {map(figure, 280, false)}
        <Legend layer={figure.layer} barHeight={150} />
      </div>
      <IsolineTable layer={figure.layer} language={language} />
      {figure.layer.id === 'uncertainty' && (
        <ThresholdTable layer={figure.layer} language={language} />
      )}
    </section>
  );

  const [first, ...rest] = model.figures;
  const others = rest.filter((f) => f.layer.id !== 'uncertainty');
  const uncertainty = rest.find((f) => f.layer.id === 'uncertainty');
  const atlas: ReportFigure[][] = [];
  for (let i = 0; i < others.length; i += 2) atlas.push(others.slice(i, i + 2));
  if (uncertainty !== undefined) atlas.push([uncertainty]);

  return (
    <div className={styles.root} data-testid="impact-report" lang={italian ? 'it' : 'en'}>
      <style>{pageStyle}</style>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={() => {
              setMode('globe');
            }}
          >
            ← {t('report.backToSimulator')}
          </button>
          <span
            className={styles.langSwitch}
            role="group"
            aria-label={t('report.impact.toolbar.language')}
          >
            {(['it', 'en'] as const).map((lng) => (
              <button
                key={lng}
                type="button"
                className={styles.langButton}
                aria-pressed={(lng === 'it') === italian}
                onClick={() => {
                  switchLanguage(lng);
                }}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </span>
        </div>
        <div className={styles.toolGroup}>
          <button
            type="button"
            className={styles.toolButton}
            onClick={copyLink}
            data-testid="report-copy-link"
          >
            <span aria-live="polite">
              {copied ? t('report.impact.toolbar.linkCopied') : t('report.impact.toolbar.copyLink')}
            </span>
          </button>
          <button
            type="button"
            className={styles.printButton}
            onClick={() => {
              window.print();
            }}
          >
            {t('report.print')}
          </button>
        </div>
      </div>

      {linkNotice !== null && (
        <p role="status" className={styles.linkNotice}>
          {linkNotice}
        </p>
      )}

      <div className={styles.sheets}>
        <Sheet foot={foot} testId="summary">
          <p className={styles.brand}>Bayran Nimbus</p>
          <h1 className={styles.title}>{model.title}</h1>
          <p className={styles.subtitle}>{model.subtitle}</p>
          <dl className={styles.meta}>
            <dt>{t('report.meta.event')}</dt>
            <dd>{model.event}</dd>
            {model.place !== null && (
              <>
                <dt>{t('report.meta.location')}</dt>
                <dd data-testid="report-place">{model.place}</dd>
              </>
            )}
            {model.generated !== null && evaluatedAt !== null && (
              <>
                <dt>{t('report.meta.generated')}</dt>
                <dd>
                  <time dateTime={new Date(evaluatedAt).toISOString()}>{model.generated}</time>
                </dd>
              </>
            )}
            <dt>{t('report.meta.model')}</dt>
            <dd data-testid="report-model">
              {commit === null ? (
                t('report.meta.modelUnknown')
              ) : (
                <>
                  <a href={commitUrl(commit)}>{shortCommit(commit)}</a>
                  {BUILD_INFO.dirty && ` (${t('report.meta.modelDirty')})`}
                </>
              )}
            </dd>
          </dl>
          <div className={styles.keys}>
            {model.keyFigures.map((k) => (
              <div key={k.id} className={styles.key}>
                <div className={styles.keyLabel}>
                  {k.label}
                  <EvidenceTag quantity={k.evidence} />
                </div>
                <div className={styles.keyValue}>{k.value}</div>
                <div className={styles.keyDetail}>{k.detail}</div>
              </div>
            ))}
          </div>
          {first !== undefined && (
            <>
              <h2 className={styles.figureTitle}>
                {t('report.impact.figure', { n: first.number })} · {first.layer.title}
              </h2>
              <div className={styles.figBig}>
                {map(first, 404, true)}
                <Legend layer={first.layer} barHeight={236} />
              </div>
              <p className={styles.caption}>
                <b>{t('report.impact.figure', { n: first.number })}.</b>{' '}
                {t('report.impact.caption')}
                {hasShots && ` ${t('report.impact.captionGlobe')}`}
              </p>
              <IsolineTable layer={first.layer} language={language} />
            </>
          )}
          <h3 className={styles.subheading}>{t('report.impact.howTitle')}</h3>
          <p className={styles.note}>{t('report.impact.how')}</p>
        </Sheet>

        {atlas.map((figures, i) => (
          <Sheet
            key={figures.map((f) => f.layer.id).join('-')}
            foot={foot}
            testId={`atlas-${(i + 1).toString()}`}
          >
            {i === 0 && <p className={styles.atlasKicker}>{t('report.impact.atlas')}</p>}
            {figures.map(card)}
          </Sheet>
        ))}

        <Sheet foot={foot} testId="numbers">
          <h2 className={styles.sectionTitle}>{t('report.impact.numbers')}</h2>
          <Groups groups={model.groups} />
        </Sheet>

        <Sheet foot={foot} testId="evidence">
          <EvidenceTable tone="paper" rows={model.evidence} />
        </Sheet>

        <Sheet foot={foot} testId="toll">
          <div className={styles.panels}>
            {(casualties !== null || casualtyStatus !== 'idle') && (
              <CasualtiesPanel
                casualties={casualties}
                status={casualtyStatus}
                compact={false}
                envelope={envelopeOf(active, 'toll')}
                tone="paper"
              />
            )}
            <CascadeTimeline stages={buildImpactCascade(result)} variant="print" />
          </div>
        </Sheet>

        <Sheet foot={foot} testId="method">
          <h2 className={styles.sectionTitle}>{t('report.impact.method')}</h2>
          <h3 className={styles.subheading}>{t('report.impact.formulas')}</h3>
          <p className={styles.note}>{t('report.impact.formulasBody')}</p>
          {model.sources.map((s) => (
            <article key={s.header} className={styles.source}>
              <h4 className={styles.sourceHeader}>{s.header}</h4>
              {s.reason !== null && <p className={styles.reason}>{s.reason}</p>}
              {s.formulas.map((f) => (
                <div key={f.id}>
                  <p className={styles.formulaName}>{f.name}</p>
                  <pre className={styles.formula}>{f.formula}</pre>
                </div>
              ))}
            </article>
          ))}
          <h3 className={styles.subheading}>{t('report.bibliographyTitle')}</h3>
          <ol className={styles.bibliography}>
            {model.sources.map((s) => (
              <li key={s.reference}>{s.reference}</li>
            ))}
          </ol>
          <h3 className={styles.subheading}>{t('report.impact.provenance.title')}</h3>
          <dl className={styles.provenance}>
            <dt>{t('report.meta.model')}</dt>
            <dd>{commit === null ? t('report.meta.modelUnknown') : commitUrl(commit)}</dd>
            <dt>{t('report.impact.provenance.validation')}</dt>
            <dd data-testid="report-validation">
              {commit !== null && !BUILD_INFO.dirty
                ? `${t('report.validationReport')} ${validationReportUrl(commit)}`
                : t('report.validationUnavailable')}
            </dd>
            <dt>{t('report.impact.provenance.link')}</dt>
            <dd>{reportLink}</dd>
            <dt>{t('report.impact.provenance.data')}</dt>
            <dd>{t('report.impact.provenance.dataText')}</dd>
            <dt>{t('report.impact.provenance.globe')}</dt>
            <dd>
              {hasShots
                ? t('report.impact.provenance.globeTaken')
                : t('report.impact.provenance.globeNone')}
            </dd>
          </dl>
          <p className={styles.note} style={{ marginTop: 8 }}>
            {t('report.footer')}
          </p>
        </Sheet>
      </div>
    </div>
  );
}
