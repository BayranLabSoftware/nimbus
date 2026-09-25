import type { JSX } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clampToGreatCircle, isGlobalReach } from '../../physics/earthScale.js';
import { useAppStore, type ActiveResult } from '../../store/index.js';
import {
  formatWithUnitTiers,
  NON_FINITE_PLACEHOLDER,
  type UnitTier,
} from '../utils/numberFormat.js';
import { pickFuzzyMetrics } from '../../scene/globe/monteCarloHalos.js';
import type { FuzzyMetric } from '../../scene/globe/monteCarloHalos.js';
import { INTENSITY_BANDS } from '../../scene/globe/shakingOverlay.js';
import { entryCellSentence } from '../../scene/globe/measuredCellText.js';
import { ImpactFieldLegend } from './ImpactFieldLegend.js';
import styles from './RingLegend.module.css';

const TIERS_RANGE: readonly UnitTier[] = [
  { scale: 1, digits: 0, label: 'm' },
  { scale: 1_000, digits: 1, label: 'km' },
];

/**
 * Mirror of the swatch hexes used by `Globe.tsx` for each ring kind.
 * Kept here as a flat lookup so the legend reads as a self-contained
 * mapping from "what you see on the globe" to "what it means" without
 * forcing the rendering module to export its private palette.
 *
 * If a colour changes in `Globe.tsx`, change it here too — there is a
 * (deliberately) small E2E that verifies the legend swatches match
 * the rendered ring colours, see tests/e2e/simulator.spec.ts.
 */
const SWATCH: Record<string, string> = {
  craterRim: '#B91C1C',
  thirdDegreeBurn: '#F97316',
  secondDegreeBurn: '#FB923C',
  massFire: '#EA580C',
  fireIgnition: '#B45309',
  overpressure5psi: '#FACC15',
  overpressure1psi: '#FDE047',
  lightDamage: '#FEF3C7',
  radiationLD50: '#A855F7',
  empAffected: '#06B6D4',
  mmi7: '#FB923C',
  mmi8: '#DC2626',
  mmi9: '#7F1D1D',
  tsunamiCavity: '#38BDF8',
  tsunamiWaveFront5m: '#DB2777',
  tsunamiWaveFront1m: '#22D3EE',
  tsunamiWaveFront03m: '#A5F3FC',
  pyroclasticRunout: '#E11D48',
  lateralBlast: '#BE185D',
  ashfallPlume: '#9CA3AF',
  ejectaBlanket: '#78350F',
  seismicFront: '#FFFFFF',
  // Il fronte d'urto non è una zona di danno ma un bordo che viaggia:
  // bianco puro, l'unico tono che nessun anello usa (il danno leggero
  // è crema, non bianco). Così a colpo d'occhio si distingue ciò che
  // si muove da ciò che resta.
  shockFront: '#FFFFFF',
};

interface LegendRow {
  /** Stable React key + i18n key suffix (e.g. 'craterRim'). Matches the
   *  `RingTooltipKind` used by Globe.tsx so the visibility toggle and
   *  the per-ring CallbackProperty share a vocabulary. */
  key: string;
  /** Translated human-readable label. */
  label: string;
  /** Hex swatch colour. */
  color: string;
  /** Pre-formatted radius string (e.g. "1.2 km", "950 m", "global"). */
  radiusLabel: string;
  /** True when the raw radius wraps the planet — caller renders an
   *  i18n badge (`global` / `globale`) so the user reads the value
   *  the same way it appears in the SimulationReport panel. */
  global: boolean;
}

function formatRange(radiusM: number): string {
  if (!Number.isFinite(radiusM) || radiusM <= 0) return NON_FINITE_PLACEHOLDER;
  const clamped = clampToGreatCircle(radiusM) as number;
  return formatWithUnitTiers(clamped, TIERS_RANGE);
}

/*
 * No tsunami wave-front rows. The legend used to list three — where the
 * open-ocean amplitude falls to 5 m, 1 m and 0.3 m — "from the same law
 * the globe paints the rings with". The globe stopped painting them in
 * Phase 16, when the wave became a heatmap and comet glyphs read off
 * the propagated field, and the rows stayed: toggling them hid nothing,
 * and their radii came from laws the field no longer uses (a megathrust
 * spread from half its length, a burst from Ward's uncapped source).
 * A legend row is a promise that something is drawn. The cavity ring,
 * which is drawn, stays.
 */

/**
 * Build the active-ring list for whichever scenario is currently in
 * the store. Returns an empty array when no simulation has run yet so
 * the caller can render the empty-state copy.
 */
function buildRingRows(
  result: ActiveResult | null,
  t: (key: string) => string,
  /** True when the globe painted the intensity FIELD for this scenario.
   *  The MMI rings are then not drawn at all — the field is the intensity
   *  — and a legend row is a promise that something is drawn, so their
   *  rows go with them. Their radii stay in the report, and the seismic
   *  front still runs to the outermost of them, which is why they are
   *  still measured here and only their rows are withheld. */
  fieldDrawn = false
): LegendRow[] {
  if (result === null) return [];
  const out: LegendRow[] = [];
  /** Ogni raggio spinto, per chiave: il fronte legge solo i propri. */
  const raggi = new Map<string, number>();
  const push = (key: keyof typeof SWATCH, radiusM: number, rowToo = true): void => {
    if (!Number.isFinite(radiusM) || radiusM <= 0) return;
    raggi.set(key, radiusM);
    if (!rowToo) return;
    out.push({
      key,
      label: t(`globe.ringLabel.${key}`),
      color: SWATCH[key] ?? '#ffffff',
      radiusLabel: formatRange(radiusM),
      global: isGlobalReach(radiusM),
    });
  };

  /**
   * Il fronte corre fino al più esterno dei *propri* anelli, e se non ne ha
   * nessuno non c'è riga: «A legend row is a promise that something is drawn»,
   * e prima del 19 settembre 2026 questa riga prendeva l'anello più esterno
   * qualunque fosse. Chelyabinsk, che a terra non produce alcuna
   * sovrapressione, leggeva «onda d'urto · fronte in corsa 1,7 km» — il raggio
   * della sua ustione di secondo grado (docs/IMPACT_AUDIT.md §3.5).
   * Va chiamata DOPO gli anelli, così i raggi sono già noti.
   */
  const pushFront = (key: 'shockFront' | 'seismicFront', suoi: readonly string[]): void => {
    let reach = 0;
    for (const k of suoi) reach = Math.max(reach, raggi.get(k) ?? 0);
    if (reach <= 0) return;
    out.push({
      key,
      label: t(`globe.ringLabel.${key}`),
      color: SWATCH[key] ?? '#ffffff',
      radiusLabel: formatRange(reach),
      global: isGlobalReach(reach),
    });
  };

  /** Gli anelli che un fronte d'urto è: le sue sovrapressioni. */
  const ANELLI_DURTO = ['overpressure5psi', 'overpressure1psi', 'lightDamage'] as const;
  /** Quelli di un fronte sismico: le sue intensità. */
  const ANELLI_SISMICI = ['mmi9', 'mmi8', 'mmi7'] as const;

  switch (result.type) {
    case 'impact': {
      // Since 22 September 2026 an impact is drawn as the field's own map,
      // and its legend is that map's (`ImpactFieldLegend`): the colour
      // scale, the thresholds on it and their reach, and the front while it
      // runs (B-107). What stays a row is the tsunami's cavity, drawn as it
      // was.
      if (result.data.tsunami) {
        push('tsunamiCavity', result.data.tsunami.cavityRadius);
      }
      break;
    }
    case 'explosion': {
      const b = result.data.blast;
      push('craterRim', (result.data.crater.apparentDiameter as number) / 2);
      push('thirdDegreeBurn', result.data.thermal.thirdDegreeBurnRadius);
      push('secondDegreeBurn', result.data.thermal.secondDegreeBurnRadius);
      push('massFire', result.data.firestorm.sustainRadius);
      push('fireIgnition', result.data.firestorm.ignitionRadius);
      push('overpressure5psi', b.overpressure5psiRadiusHob);
      push('overpressure1psi', b.overpressure1psiRadiusHob);
      // B-058: the ring the globe draws, which is the one the burst's own
      // height gives. This row read `lightDamageRadius` — the surface burst's —
      // while its two neighbours already read the corrected ones, so a 15 Mt at
      // 700 m put "0.5 psi · 61.8 km" in the legend beside a ring the globe
      // labelled 55.6 km. B-049 corrected the globe on 18 September and left
      // the legend behind.
      push('lightDamage', b.lightDamageRadiusHob);
      // Initial radiation lethal-dose ring — only when LD50 actually
      // escapes the fireball (small for sub-megaton, suppressed by
      // the renderer for very large yields).
      if (Number.isFinite(result.data.radiation.ld50Radius)) {
        push('radiationLD50', result.data.radiation.ld50Radius);
      }
      // EMP footprint — only for non-NEGLIGIBLE regimes (HEMP shots
      // dominate, Starfish-Prime-style continental reach).
      if (result.data.emp.regime !== 'NEGLIGIBLE') {
        push('empAffected', result.data.emp.affectedRadius);
      }
      if (result.data.tsunami) {
        push('tsunamiCavity', result.data.tsunami.cavityRadius);
      }
      pushFront('shockFront', ANELLI_DURTO);
      break;
    }
    case 'earthquake': {
      const s = result.data.shaking;
      push('mmi9', s.mmi9Radius, !fieldDrawn);
      push('mmi8', s.mmi8Radius, !fieldDrawn);
      push('mmi7', s.mmi7Radius, !fieldDrawn);
      pushFront('seismicFront', ANELLI_SISMICI);
      break;
    }
    case 'volcano': {
      push('pyroclasticRunout', result.data.pyroclasticRunout);
      if (result.data.lateralBlast) push('lateralBlast', result.data.lateralBlast.runout);
      if (result.data.windAdvectedAshfall)
        push('ashfallPlume', result.data.windAdvectedAshfall.downwindRange);
      if (result.data.tsunami) {
        push('tsunamiCavity', result.data.tsunami.cavityRadius);
      }
      break;
    }
    case 'landslide': {
      if (result.data.tsunami !== null) {
        push('tsunamiCavity', result.data.tsunami.cavityRadius);
      }
      break;
    }
  }
  return out;
}

/**
 * Floating contextual legend pinned to the lower-right of the globe.
 * Reads the active simulation result from the Zustand store and
 * lists every visible ring with its swatch, plain-language label,
 * and ground-range radius. Each row is a toggle button — clicking it
 * hides / shows the matching ring on the globe through the
 * `hiddenRingKeys` store slice (Globe.tsx wires a CallbackProperty
 * to each entity's `show` field, so toggling does NOT restart the
 * ring-grow animation). Collapsible; respects WCAG keyboard focus
 * rules.
 *
 * Pedagogical role: the globe shows the colours, the legend explains
 * what they mean. Together they remove the "what does the orange ring
 * actually represent?" friction that was previously forcing users to
 * cross-reference the side simulator panel.
 */
export function RingLegend(): JSX.Element {
  const { t, i18n } = useTranslation();
  const result = useAppStore((s) => s.result);
  const hiddenRingKeys = useAppStore((s) => s.hiddenRingKeys);
  const shakingFieldBands = useAppStore((s) => s.shakingFieldBands);
  const toggleRingVisibility = useAppStore((s) => s.toggleRingVisibility);
  const showAllRings = useAppStore((s) => s.showAllRings);
  const bathymetricTsunami = useAppStore((s) => s.bathymetricTsunami);
  const globalBathymetricGrid = useAppStore((s) => s.globalBathymetricGrid);
  const waveMap = useAppStore((s) => s.waveMapKey);
  const monteCarlo = useAppStore((s) => s.monteCarlo);
  const [collapsed, setCollapsed] = useState(false);

  const rows = buildRingRows(result, t, shakingFieldBands !== null);
  const anyHidden = rows.some((r) => hiddenRingKeys.has(r.key));
  const impactMap = result?.type === 'impact' ? result.data : null;

  // Phase 12c — tsunami map status. Surfaces the user-facing question
  // "did the trans-oceanic propagation actually run for this scenario?"
  // without making them open dev-tools.
  // The bands the globe painted, in the globe's own table — imported
  // rather than mirrored like SWATCH above, because this table is already
  // exported and a second copy is a second thing to forget.
  const fieldBands =
    shakingFieldBands === null
      ? []
      : INTENSITY_BANDS.filter((band) => shakingFieldBands.includes(band.label));

  const tsunamiPresent = bathymetricTsunami !== null;
  const globalAvailable = globalBathymetricGrid !== null;
  const globalComputed = bathymetricTsunami?.global !== undefined;
  // B-117: once the planet's field is computed, the line says what the globe
  // drew from it (`waveMapKey`) — the planet's veil, the tile about the source
  // where the planet's wave stays under a metre, or nothing — and not that
  // both layers are on, which the globe never draws together.
  let tsunamiStatusKey:
    | 'globalActive'
    | 'localDrawn'
    | 'nothingDrawn'
    | 'localOnly'
    | 'globalLoading'
    | null = null;
  if (tsunamiPresent) {
    if (globalComputed) {
      tsunamiStatusKey =
        waveMap === null
          ? 'nothingDrawn'
          : waveMap.scope === 'global'
            ? 'globalActive'
            : 'localDrawn';
    } else if (!globalAvailable) tsunamiStatusKey = 'globalLoading';
    else tsunamiStatusKey = 'localOnly';
  }

  // Rule 1201: the same two metrics `Globe.tsx` drew P10/P90 halos and the
  // radial probability heatmap for, read from the same function so the
  // legend cannot name a metric the globe did not draw (or vice versa).
  // Impacts only — the other four event types are this round's declared
  // scope boundary (rule 1195), not a defect specific to them.
  const impactFuzzyMetrics: FuzzyMetric[] =
    monteCarlo !== null && monteCarlo.type === 'impact' && result?.type === 'impact'
      ? pickFuzzyMetrics(monteCarlo)
      : [];

  return (
    <aside
      className={[styles.legend, impactMap !== null ? styles.legendMap : '']
        .filter(Boolean)
        .join(' ')}
      aria-label={t(impactMap !== null ? 'globe.impactMap.heading' : 'globe.legend.heading')}
      data-testid="ring-legend"
    >
      <header className={styles.header}>
        <h2 className={styles.heading}>
          {t(impactMap !== null ? 'globe.impactMap.heading' : 'globe.legend.heading')}
        </h2>
        <div className={styles.headerActions}>
          {anyHidden && (
            <button
              type="button"
              className={styles.showAll}
              onClick={(): void => {
                showAllRings();
              }}
              data-testid="ring-legend-show-all"
            >
              {t('globe.legend.showAll')}
            </button>
          )}
          <button
            type="button"
            className={styles.toggle}
            onClick={(): void => {
              setCollapsed((prev) => !prev);
            }}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t('globe.legend.toggleShow') : t('globe.legend.toggleHide')}
          >
            {collapsed ? '▸' : '▾'}
          </button>
        </div>
      </header>
      {!collapsed && (
        <>
          {impactMap !== null && <ImpactFieldLegend result={impactMap} />}
          {(impactMap === null || rows.length > 0) && (
            <p className={styles.subheading}>{t('globe.legend.subheading')}</p>
          )}
          {impactMap !== null && rows.length === 0 ? null : rows.length === 0 ? (
            // B-099: a scenario that ran and draws no ring is told so, not
            // asked to run.
            <p className={styles.empty}>
              {t(result === null ? 'globe.legend.empty' : 'globe.legend.noRings')}
            </p>
          ) : (
            <ul className={styles.list}>
              {rows.map((row) => {
                const hidden = hiddenRingKeys.has(row.key);
                return (
                  <li key={row.key} className={styles.row}>
                    <button
                      type="button"
                      className={[styles.rowButton, hidden ? styles.rowHidden : '']
                        .filter(Boolean)
                        .join(' ')}
                      onClick={(): void => {
                        toggleRingVisibility(row.key);
                      }}
                      aria-pressed={!hidden}
                      aria-label={
                        hidden
                          ? t('globe.legend.rowAriaShow', { name: row.label })
                          : t('globe.legend.rowAriaHide', { name: row.label })
                      }
                      data-testid={`ring-legend-row-${row.key}`}
                    >
                      <span
                        className={styles.swatch}
                        style={{ backgroundColor: row.color, color: row.color }}
                        aria-hidden="true"
                      />
                      <span className={styles.label}>{row.label}</span>
                      <span className={styles.radius}>
                        {row.radiusLabel}
                        {row.global && (
                          <span className={styles.globalBadge}>
                            {' '}
                            ({t('globe.legend.globalBadge')})
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {fieldBands.length > 0 && (
            <section className={styles.fieldSection} data-testid="legend-shaking-field">
              <h3 className={styles.fieldTitle}>{t('globe.legend.field.title')}</h3>
              <ul className={styles.fieldScale}>
                {fieldBands.map((band) => (
                  <li
                    key={band.label}
                    className={styles.fieldBand}
                    style={{ background: band.css, borderColor: band.lineCss }}
                  >
                    {band.label}
                  </li>
                ))}
              </ul>
              <p className={styles.fieldNote}>{t('globe.legend.field.note')}</p>
            </section>
          )}
          {tsunamiStatusKey !== null && (
            <p className={styles.tsunamiStatus} data-status={tsunamiStatusKey}>
              {t(`globe.legend.tsunamiStatus.${tsunamiStatusKey}`)}
            </p>
          )}
          {impactFuzzyMetrics.length > 0 && (
            <section data-testid="legend-monte-carlo">
              <p className={styles.uncertaintyNote}>{t('globe.legend.monteCarlo.intro')}</p>
              <ul className={styles.list}>
                {impactFuzzyMetrics.map((metric) => {
                  const cssColor = metric.color.toCssColorString();
                  return (
                    <li
                      key={metric.metricKey}
                      className={styles.row}
                      style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '6px 8px' }}
                    >
                      <span
                        className={styles.swatch}
                        style={{ backgroundColor: cssColor, color: cssColor }}
                        aria-hidden="true"
                      />
                      <span className={styles.label}>
                        {t(`globe.legend.monteCarlo.metric.${metric.metricKey}`)}
                      </span>
                    </li>
                  );
                })}
              </ul>
              {impactFuzzyMetrics.some((metric) => metric.samples !== undefined) && (
                <p className={styles.uncertaintyNote}>{t('globe.legend.monteCarlo.heatmap')}</p>
              )}
            </section>
          )}
          {result?.type === 'impact' && (
            <p className={styles.uncertaintyNote} data-testid="legend-entry-cell">
              {t('measuredCells.entry.legend', {
                sentence: entryCellSentence(result.data.measuredCells.entry, i18n.language),
              })}
            </p>
          )}
          {rows.length > 0 && impactMap === null && (
            <p className={styles.uncertaintyNote}>{t('globe.legend.uncertaintyNote')}</p>
          )}
        </>
      )}
    </aside>
  );
}
