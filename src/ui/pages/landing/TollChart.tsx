import type { JSX } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './TollChart.module.css';

/** One death-toll row of the validation report, as the chart reads it. */
export interface TollChartRow {
  event: string;
  recorded: number;
  model: number;
  bandLow: number;
  bandHigh: number;
  contains: boolean;
}

// Drawing units. The SVG scales to its container through the viewBox; on
// a narrow screen the figure keeps this geometry and scrolls sideways
// inside its frame instead of shrinking the labels below legibility.
const WIDTH = 980;
const ROW = 30;
const LABEL = 222; // column of event names
const RESULT = 84; // column of "inside / outside"
const ZERO = LABEL + 10; // the column for a toll of zero
const LOG_START = LABEL + 52; // where the logarithmic axis begins
const TOP = 12;
const AXIS = 30;

/**
 * Figure 2 of the landing page: for every event, the model's 5–95 %
 * predictive interval (bar), the recorded toll (tick) and the model's
 * central estimate (dot), on a logarithmic axis.
 *
 * Zero has no place on a log axis, and several rows have a band starting
 * at zero or a record of nothing: they sit in a column of their own left
 * of an axis break. The rows come from docs/VALIDATION_REPORT.json, the
 * same data the validation page reads, so the two can never disagree.
 */
export function TollChart({ rows }: { rows: TollChartRow[] }): JSX.Element {
  const { t, i18n } = useTranslation();
  const locale = i18n.language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  const sorted = [...rows].sort((a, b) => b.recorded - a.recorded);

  const peak = Math.max(1, ...rows.flatMap((r) => [r.recorded, r.model, r.bandHigh]));
  const decades = Math.max(1, Math.ceil(Math.log10(peak)));
  const logEnd = WIDTH - RESULT - 12;
  const x = (v: number): number => {
    if (v <= 0) return ZERO;
    const d = Math.log10(Math.max(v, 1)) / decades;
    return LOG_START + d * (logEnd - LOG_START);
  };
  const height = TOP + ROW * sorted.length + AXIS;
  const plotBottom = TOP + ROW * sorted.length;
  const ticks = Array.from({ length: decades + 1 }, (_, i) => 10 ** i);
  const breakX = (ZERO + LOG_START) / 2;
  const int = (n: number): string => Math.round(n).toLocaleString(locale);

  return (
    <div className={styles.chart}>
      <ul className={styles.legend} aria-hidden="true">
        <li>
          <span className={styles.keyBand} />
          {t('landing.validation.legendBand')}
        </li>
        <li>
          <span className={styles.keyRecorded} />
          {t('landing.validation.legendRecorded')}
        </li>
        <li>
          <span className={styles.keyModel} />
          {t('landing.validation.legendModel')}
        </li>
      </ul>

      {/* On a narrow screen this box scrolls sideways, and a region that
          scrolls must be reachable from the keyboard: it takes the tab stop
          and says what it holds. The drawing inside stays hidden from
          screen readers — the table below carries the same numbers. */}
      <div
        className={styles.scroll}
        /* axe's scrollable-region-focusable asks for exactly this: a box
           that scrolls has to be reachable from the keyboard, interactive
           or not. The lint rule is a heuristic; the checker is the law. */
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        role="group"
        aria-label={t('landing.validation.chartRegion')}
      >
        <svg
          className={styles.svg}
          viewBox={`0 0 ${String(WIDTH)} ${String(height)}`}
          aria-hidden="true"
          focusable="false"
        >
          {ticks.map((v) => (
            <g key={v}>
              <line className={styles.grid} x1={x(v)} x2={x(v)} y1={TOP - 4} y2={plotBottom} />
              <text className={styles.tick} x={x(v)} y={plotBottom + 18} textAnchor="middle">
                {int(v)}
              </text>
            </g>
          ))}
          <line className={styles.grid} x1={ZERO} x2={ZERO} y1={TOP - 4} y2={plotBottom} />
          <text className={styles.tick} x={ZERO} y={plotBottom + 18} textAnchor="middle">
            0
          </text>
          <path
            className={styles.axisBreak}
            d={`M${String(breakX - 5)},${String(plotBottom + 5)} l4,-9 M${String(breakX)},${String(plotBottom + 5)} l4,-9`}
          />

          {sorted.map((r, i) => {
            const cy = TOP + ROW * i + ROW / 2;
            const a = x(r.bandLow);
            const b = x(r.bandHigh);
            return (
              <g key={r.event}>
                {i % 2 === 0 && (
                  <rect
                    className={styles.stripe}
                    x={0}
                    y={cy - ROW / 2}
                    width={WIDTH}
                    height={ROW}
                  />
                )}
                <text className={styles.name} x={LABEL - 14} y={cy + 4} textAnchor="end">
                  {r.event}
                </text>
                <rect
                  className={styles.band}
                  x={a}
                  y={cy - 4}
                  width={Math.max(b - a, 8)}
                  height={8}
                  rx={4}
                />
                <rect
                  className={styles.recorded}
                  x={x(r.recorded) - 1.25}
                  y={cy - 8}
                  width={2.5}
                  height={16}
                  rx={1}
                />
                <circle className={styles.model} cx={x(r.model)} cy={cy} r={5} />
                <text
                  className={r.contains ? styles.inside : styles.outside}
                  x={WIDTH - 8}
                  y={cy + 4}
                  textAnchor="end"
                >
                  {r.contains ? t('landing.validation.inside') : t('landing.validation.outside')}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <p className={styles.axisLabel} aria-hidden="true">
        {t('landing.validation.axis')}
      </p>

      {/* The same numbers as a table, for screen readers: the drawing is
          hidden from them, and a figure read by colour and position alone
          would say nothing. A table ignores width: 1px, so the hiding goes
          on a wrapper: on the table itself it widened the whole page. */}
      <div className={styles.srOnly}>
        <table>
          <caption>{t('landing.validation.tableCaption')}</caption>
          <thead>
            <tr>
              <th scope="col">{t('landing.validation.tableEvent')}</th>
              <th scope="col">{t('landing.validation.tableRecorded')}</th>
              <th scope="col">{t('landing.validation.tableModel')}</th>
              <th scope="col">{t('landing.validation.tableBand')}</th>
              <th scope="col">{t('landing.validation.tableResult')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.event}>
                <th scope="row">{r.event}</th>
                <td>{int(r.recorded)}</td>
                <td>{int(r.model)}</td>
                <td>
                  {int(r.bandLow)}–{int(r.bandHigh)}
                </td>
                <td>
                  {r.contains ? t('landing.validation.inside') : t('landing.validation.outside')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
