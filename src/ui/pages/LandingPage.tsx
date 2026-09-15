import { Suspense, lazy, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { EARTHQUAKE_PRESETS } from '../../physics/events/earthquake/index.js';
import { EXPLOSION_PRESETS } from '../../physics/events/explosion/index.js';
import { LANDSLIDE_PRESETS } from '../../physics/events/landslide/index.js';
import { VOLCANO_PRESETS } from '../../physics/events/volcano/index.js';
import { IMPACT_PRESETS } from '../../physics/simulate.js';
import { useAppStore } from '../../store/index.js';
import { REPOSITORY_URL } from '../../buildInfo.js';
import { LanguageSwitch } from '../components/LanguageSwitch';
import { cx } from '../utils/cx';
import { useReducedMotion } from '../utils/useReducedMotion';
import { CITATIONS, METHODOLOGY_SECTIONS, type Citation } from './methodologyContent.js';
import styles from './LandingPage.module.css';

// The validation section reads the 130 KB validation report: it loads on its
// own chunk, shared with the validation page, below the fold.
const LandingValidation = lazy(() =>
  import('./landing/LandingValidation.js').then((mod) => ({ default: mod.LandingValidation }))
);

/**
 * The event types the simulator offers, each with the sources behind its
 * principal relations. Tsunamis are not a type of their own: they are what
 * an impact, an earthquake or a landslide can generate.
 */
const MODELS = [
  { key: 'impact', sources: [CITATIONS.collins2005] },
  { key: 'explosion', sources: [CITATIONS.glasstoneDolan1977] },
  { key: 'earthquake', sources: [CITATIONS.hanksKanamori1979, CITATIONS.boore2014] },
  { key: 'volcano', sources: [CITATIONS.mastin2009, CITATIONS.auker2013] },
  { key: 'landslide', sources: [CITATIONS.watts2000] },
  { key: 'tsunami', sources: [CITATIONS.ward2000, CITATIONS.wunnemann2010] },
] as const;
const EVENT_TYPE_COUNT = MODELS.filter((m) => m.key !== 'tsunami').length;

// Counted from the preset tables themselves, so the figure follows the code.
const PRESET_COUNT = [
  IMPACT_PRESETS,
  EXPLOSION_PRESETS,
  EARTHQUAKE_PRESETS,
  VOLCANO_PRESETS,
  LANDSLIDE_PRESETS,
].reduce((sum, table) => sum + Object.keys(table).length, 0);

// The two equations shown are taken verbatim from the methodology page.
const FORMULAS = [
  { id: 'kinetic-energy', label: 'kineticEnergy' },
  { id: 'seismic-moment', label: 'seismicMoment' },
] as const;
const formulaEntry = (id: string) =>
  METHODOLOGY_SECTIONS.flatMap((s) => s.entries).find((e) => e.id === id);

/** "Collins et al. 2005", "Glasstone & Dolan 1977", "Watts 2000". */
function shortCitation(c: Citation): string {
  const surnames = [
    ...c.authors.matchAll(/([\p{Lu}][\p{L}'’-]+(?: [\p{Lu}][\p{L}'’-]+)*), (?:\p{Lu}\.\s?)+/gu),
  ].map((m) => m[1] ?? '');
  const [first = c.authors, second = ''] = surnames;
  const names =
    c.authors.includes('et al.') || surnames.length > 2
      ? `${first} et al.`
      : surnames.length === 2
        ? `${first} & ${second}`
        : first;
  return `${names} ${String(c.year)}`;
}

export function LandingPage(): JSX.Element {
  const { t, i18n } = useTranslation();
  const reducedMotion = useReducedMotion();
  const transitionTo = useAppStore((s) => s.transitionTo);
  const setMode = useAppStore((s) => s.setMode);
  const base = import.meta.env.BASE_URL;
  const italian = i18n.language.toLowerCase().startsWith('it');

  const handleEnter = (): void => {
    transitionTo('globe', { instant: reducedMotion });
  };

  return (
    <div className={styles.page}>
      <a href="#main" className="skip-link">
        {t('landing.skipLink')}
      </a>

      <header className={styles.header}>
        {/* Il marchio della casa, in alto a sinistra e cliccabile: stessa
            posizione e stessa misura che ha sulle altre pagine del sito.
            L'indirizzo e' assoluto: la pagina d'ingresso di BayranLab sta
            alla radice del dominio, fuori dalla base dell'app. */}
        <a
          className={styles.brand}
          href="https://bayranlabsoftware.github.io/"
          aria-label="BayranLab Software"
        >
          <img
            className={styles.brandLogo}
            src={`${base}bayranlab-logo.png`}
            alt="BayranLab Software"
            width={614}
            height={189}
          />
        </a>
        <nav className={styles.nav} aria-label={t('landing.nav.label')}>
          <button type="button" className={styles.navLink} onClick={handleEnter}>
            {t('landing.nav.simulator')}
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => {
              setMode('methodology');
            }}
          >
            {t('landing.nav.methodology')}
          </button>
          <button
            type="button"
            className={styles.navLink}
            onClick={() => {
              setMode('validation');
            }}
          >
            {t('landing.nav.validation')}
          </button>
          <a className={styles.navLink} href="#cite">
            {t('landing.nav.cite')}
          </a>
          <a
            className={styles.navLink}
            href={REPOSITORY_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('footer.github')}
          </a>
          <LanguageSwitch />
        </nav>
      </header>

      <main id="main">
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroText}>
            <p className={styles.eyebrow}>
              <span className={styles.dot} aria-hidden="true" />
              {t('landing.eyebrow')}
            </p>
            <h1 id="hero-title" className={styles.title}>
              {t('landing.projectName')}
            </h1>
            <p className={styles.tagline}>{t('landing.tagline')}</p>
            <p className={styles.description}>{t('landing.description')}</p>
            <div className={styles.ctas}>
              <button
                type="button"
                className={cx(styles.cta, styles.ctaPrimary)}
                onClick={handleEnter}
              >
                {t('landing.cta.enterSimulator')}
              </button>
              <button
                type="button"
                className={styles.cta}
                onClick={() => {
                  setMode('validation');
                }}
              >
                {t('landing.cta.validation')}
              </button>
            </div>
            <p className={styles.meta}>{t('landing.meta')}</p>
          </div>
          <figure className={styles.planet}>
            <img
              src={`${base}landing/globe-chicxulub.webp`}
              alt={t('landing.hero.alt')}
              width={1200}
              height={1213}
              fetchPriority="high"
            />
            <figcaption>
              {t('landing.hero.caption')} {t('landing.instrument.imagery')}
            </figcaption>
          </figure>
        </section>

        <section className={styles.facts} aria-label={t('landing.facts.label')}>
          <dl className={styles.factsRow}>
            <div className={styles.fact}>
              <dt>{EVENT_TYPE_COUNT}</dt>
              <dd>{t('landing.facts.eventTypes')}</dd>
            </div>
            <div className={styles.fact}>
              <dt>{PRESET_COUNT}</dt>
              <dd>{t('landing.facts.presets')}</dd>
            </div>
            <div className={styles.fact}>
              <dt>5–95 %</dt>
              <dd>{t('landing.facts.band')}</dd>
            </div>
            <div className={styles.fact}>
              <dt>P10–P90</dt>
              <dd>{t('landing.facts.monteCarlo')}</dd>
            </div>
            <div className={styles.fact}>
              <dt>WCAG 2.1 AA</dt>
              <dd>{t('landing.facts.accessibility')}</dd>
            </div>
          </dl>
        </section>

        <section className={styles.section} aria-labelledby="models-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>{t('landing.models.eyebrow')}</p>
              <h2 id="models-title" className={styles.sectionTitle}>
                {t('landing.models.title')}
              </h2>
            </div>
            <p className={styles.sectionBody}>{t('landing.models.body')}</p>
          </div>
          <ul className={styles.models} aria-label={t('landing.models.listLabel')}>
            {MODELS.map((m) => (
              <li key={m.key} className={styles.model}>
                <h3 className={styles.modelName}>{t(`landing.models.${m.key}.name`)}</h3>
                <p className={styles.modelDetail}>{t(`landing.models.${m.key}.detail`)}</p>
                <p className={styles.modelSource}>{m.sources.map(shortCitation).join(' · ')}</p>
              </li>
            ))}
          </ul>
          <div className={styles.formulas}>
            {FORMULAS.map((f) => {
              const entry = formulaEntry(f.id);
              if (!entry) return null;
              const c = entry.citation;
              return (
                <div key={f.id} className={styles.formula}>
                  <p className={styles.equation}>{entry.formula}</p>
                  <p className={styles.formulaSource}>
                    {t(`landing.models.${f.label}`)} · {shortCitation(c)}, {c.venue}
                    {c.doi ? ` · doi:${c.doi}` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className={styles.section} aria-labelledby="instrument-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>{t('landing.instrument.eyebrow')}</p>
              <h2 id="instrument-title" className={styles.sectionTitle}>
                {t('landing.instrument.title')}
              </h2>
            </div>
            <p className={styles.sectionBody}>{t('landing.instrument.body')}</p>
          </div>
          <figure className={styles.screen}>
            <img
              src={`${base}landing/simulator-tohoku-${italian ? 'it' : 'en'}.webp`}
              alt={t('landing.instrument.alt')}
              width={1920}
              height={1200}
              loading="lazy"
            />
            <figcaption>
              <b>{t('landing.instrument.figure')}</b> — {t('landing.instrument.caption')}{' '}
              <span className={styles.credit}>{t('landing.instrument.imagery')}</span>
            </figcaption>
          </figure>
          <ul className={styles.notes}>
            {(['scale', 'uncertainty', 'reproducible'] as const).map((k) => (
              <li key={k}>
                <h3>{t(`landing.instrument.${k}.name`)}</h3>
                <p>{t(`landing.instrument.${k}.detail`)}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={styles.section} aria-labelledby="validation-title">
          <div className={styles.sectionHead}>
            <div>
              <p className={styles.eyebrow}>{t('landing.validation.eyebrow')}</p>
              <h2 id="validation-title" className={styles.sectionTitle}>
                {t('landing.validation.title')}
              </h2>
            </div>
            <p className={styles.sectionBody}>{t('landing.validation.body')}</p>
          </div>
          <Suspense fallback={<div className={styles.placeholder} />}>
            <LandingValidation />
          </Suspense>
        </section>

        <section id="cite" className={cx(styles.section, styles.cite)} aria-labelledby="cite-title">
          <div>
            <p className={styles.eyebrow}>{t('landing.cite.eyebrow')}</p>
            <h2 id="cite-title" className={styles.sectionTitle}>
              {t('landing.cite.title')}
            </h2>
            <p className={styles.sectionBody}>{t('landing.cite.body')}</p>
            <div className={styles.ctas}>
              <a
                className={styles.cta}
                href={`${REPOSITORY_URL}/blob/main/CITATION.cff`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landing.cite.cff')}
              </a>
              <a
                className={styles.cta}
                href={REPOSITORY_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('landing.cite.source')}
              </a>
            </div>
          </div>
          <pre className={styles.citation}>
            <b>Rossi, A., &amp; Nimbus contributors.</b>
            {` Nimbus — Nuclear & Impact Modeling & Blast Understanding System [software].
${REPOSITORY_URL}

@software{nimbus,
  author  = {Rossi, Andrea and {Nimbus contributors}},
  title   = {Nimbus — Nuclear & Impact Modeling &
             Blast Understanding System},
  url     = {https://bayranlabsoftware.github.io/nimbus/},
  license = {AGPL-3.0-or-later}
}`}
          </pre>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerRow}>
          <span>© 2026 {t('landing.projectName')}</span>
          <span aria-hidden="true">·</span>
          <a href={REPOSITORY_URL} target="_blank" rel="noopener noreferrer">
            {t('footer.github')}
          </a>
          <span aria-hidden="true">·</span>
          <span>{t('footer.license')}</span>
          <span aria-hidden="true">·</span>
          {/* Pagina statica servita da public/privacy/. Il percorso parte da
              BASE_URL e non da un relativo: l'app vive sotto /nimbus/ sul sito
              e sotto / in sviluppo, e un "privacy/" secco si romperebbe in uno
              dei due casi. */}
          <a href={`${base}privacy/`}>{t('footer.privacy')}</a>
          <span aria-hidden="true">·</span>
          <span>{t('footer.madeIn')}</span>
        </div>
        <p className={styles.footerCredits}>{t('footer.credits')}</p>
      </footer>
    </div>
  );
}
