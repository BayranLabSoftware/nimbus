import type { JSX } from 'react';
import { useId, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImpactScenarioResult } from '../../physics/simulate.js';
import {
  absentImpactLayers,
  availableImpactLayers,
  layoutColorbar,
  rampColor,
  resolveImpactLayer,
  type ColorbarSpec,
} from '../../scene/globe/impactFieldMap.js';
import { useAppStore } from '../../store/index.js';
import styles from './ImpactFieldLegend.module.css';

/**
 * The legend of an impact's map (ROADMAP IMP-7b): which layer is drawn and
 * which others there are, its colour scale in its units with the model's
 * thresholds on it, what each threshold reaches, and what the map cannot
 * say. It reads the same layer the globe draws (`resolveImpactLayer`), so the
 * two cannot tell one scenario two ways.
 */
export function ImpactFieldLegend({ result }: { result: ImpactScenarioResult }): JSX.Element {
  const { t, i18n } = useTranslation();
  const layerId = useAppStore((s) => s.impactFieldLayer);
  const uncertaintyKey = useAppStore((s) => s.impactUncertaintyKey);
  const setLayer = useAppStore((s) => s.setImpactFieldLayer);
  const setUncertaintyKey = useAppStore((s) => s.setImpactUncertaintyKey);
  const frontActive = useAppStore((s) => s.shockFrontActive);
  const waveMap = useAppStore((s) => s.waveMapKey);
  const waveUnpropagatedReachM = useAppStore((s) => s.waveUnpropagatedReachM);
  const language = i18n.language;

  const { layers, layer, absent } = useMemo(() => {
    const ctx = { t, language, uncertaintyKey, waveMap, waveUnpropagatedReachM };
    return {
      layers: availableImpactLayers(result, ctx),
      layer: resolveImpactLayer(result, layerId, ctx),
      // Rule 1032 (c): a layer that draws nothing is never simply missing.
      absent: absentImpactLayers(result, ctx),
    };
  }, [result, t, language, uncertaintyKey, layerId, waveMap, waveUnpropagatedReachM]);

  return (
    <section className={styles.map} data-testid="impact-field-legend">
      {layers.length === 0 && (
        // B-099: a scenario that ran and draws nothing on the ground is told so.
        <p className={styles.unit}>{t('globe.legend.noRings')}</p>
      )}
      <div className={styles.tabs} role="group" aria-label={t('globe.impactMap.tabsAria')}>
        {layers.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={l.id === layer?.id}
            className={styles.tab}
            onClick={(): void => {
              setLayer(l.id);
            }}
            data-testid={`impact-layer-${l.id}`}
          >
            {l.tab}
          </button>
        ))}
      </div>
      {absent.length > 0 && (
        <div className={styles.absent} data-testid="impact-layers-absent">
          <p className={styles.absentHeading}>{t('globe.impactMap.absentHeading')}</p>
          <ul className={styles.absentList}>
            {absent.map((a) => (
              <li key={a.id} data-testid={`impact-layer-absent-${a.id}`} data-beyond={a.beyond}>
                <strong>{a.tab}</strong> — {a.why}
              </li>
            ))}
          </ul>
        </div>
      )}
      {layer !== null && (
        <>
          <div className={styles.head}>
            <h3 className={styles.title}>{layer.title}</h3>
            <p className={styles.unit}>{layer.unit}</p>
          </div>
          {/* Phase 1: what the layer's numbers can claim, above all it says. */}
          <p
            className={[
              styles.evidence,
              layer.evidence.klass === 'exploratory' ? styles.evidenceExploratory : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-testid="impact-layer-evidence"
            data-evidence-class={layer.evidence.klass}
          >
            <strong>{layer.evidence.label}.</strong> {layer.evidence.summary}
          </p>
          {/* Rule 1029: the layer's provenance card, five fixed fields. */}
          <details className={styles.card} data-testid="impact-layer-card" data-state={layer.state}>
            <summary>{t('globe.impactMap.card.heading')}</summary>
            <dl className={styles.notes} data-beyond={layer.card.beyond}>
              {(
                [
                  ['quantity', `${layer.card.quantity} · ${layer.card.unit}`],
                  ['state', t(`globe.impactMap.state.${layer.card.state}`)],
                  ['source', layer.card.source],
                  ['extent', layer.card.extent],
                  ['beyond', t(`globe.impactMap.beyond.${layer.card.beyond}`)],
                ] as const
              ).map(([key, value]) => (
                <div key={key} className={styles.note} data-card={key}>
                  <dt>{t(`globe.impactMap.card.${key}`)}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </details>
          {layer.uncertainty !== undefined && (
            <div
              className={styles.chips}
              role="group"
              aria-label={t('globe.impactMap.thresholdAria')}
            >
              {layer.uncertainty.choices.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  className={styles.chip}
                  aria-pressed={c.key === layer.uncertainty?.selected?.key}
                  disabled={c.unavailable !== undefined}
                  title={c.unavailable}
                  onClick={(): void => {
                    setUncertaintyKey(c.key);
                  }}
                  data-testid={`impact-threshold-${c.key}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
          {layer.colorbar !== null && <Colorbar spec={layer.colorbar} />}
          {layer.categories.length > 0 && (
            <ul className={styles.categories}>
              {layer.categories.map((c) => (
                <li key={c.label} className={styles.category}>
                  <span
                    className={[
                      styles.swatch,
                      c.hatched ? styles.hatched : '',
                      c.shape !== undefined ? styles[c.shape] : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    style={{
                      backgroundColor: c.hatched || c.shape === 'dashed' ? undefined : c.color,
                      color: c.color,
                    }}
                    data-shape={c.shape ?? 'area'}
                    aria-hidden="true"
                  />
                  <span>{c.label}</span>
                </li>
              ))}
            </ul>
          )}
          <dl className={styles.notes}>
            {layer.notes.map((n) => (
              <div key={n.label} className={styles.note}>
                <dt>{n.label}</dt>
                <dd>{n.text}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      {frontActive && (
        // B-107: a row is a promise that something is drawn, so the front has
        // one only while it runs.
        <p className={styles.front} data-testid="impact-front-row">
          <span className={styles.frontSwatch} aria-hidden="true" />
          {t('globe.ringLabel.shockFront')}
        </p>
      )}
    </section>
  );
}

/** The layer's colour scale, upright, its thresholds marked on it with what
 *  they mean and how far they reach, spread so that no two print over each
 *  other. */
function Colorbar({ spec }: { spec: ColorbarSpec }): JSX.Element {
  const gradientId = useId();
  const top = 8;
  const height = 176;
  const x = 8;
  const width = 12;
  const { ticks, marks } = layoutColorbar(spec, top, height, 26);
  const stops = Array.from({ length: 17 }, (_, i) => {
    const [r, g, b] = rampColor(spec.palette, 1 - i / 16);
    return (
      <stop
        key={i}
        offset={(i / 16).toFixed(4)}
        stopColor={`rgb(${Math.round(r).toString()},${Math.round(g).toString()},${Math.round(b).toString()})`}
      />
    );
  });
  const labelX = 104;
  return (
    <svg
      className={styles.colorbar}
      viewBox={`0 0 280 ${(top + height + 12).toString()}`}
      role="img"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          {stops}
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={top}
        width={width}
        height={height}
        fill={`url(#${gradientId})`}
        stroke="rgba(255,255,255,0.3)"
      />
      {ticks.map(({ y, label }) => {
        return (
          <g key={label}>
            <line x1={x + width} x2={x + width + 4} y1={y} y2={y} stroke="#8a857c" />
            <text x={x + width + 7} y={y + 3.5} className={styles.tick}>
              {label}
            </text>
          </g>
        );
      })}
      {marks.map((m) => (
        <g key={`${m.label}-${m.detail}`}>
          <line
            x1={x - 3}
            x2={x + width + 3}
            y1={m.y}
            y2={m.y}
            stroke="#ffffff"
            strokeWidth={1.6}
          />
          <path
            d={`M${(x + width + 3).toString()},${m.y.toString()} L${(labelX - 12).toString()},${m.y.toString()} L${(labelX - 4).toString()},${m.ly.toString()}`}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
          />
          <text x={labelX} y={m.ly - 1} className={styles.markLabel}>
            {m.label}
          </text>
          <text x={labelX} y={m.ly + 11} className={styles.markDetail}>
            {m.detail}
          </text>
        </g>
      ))}
    </svg>
  );
}
