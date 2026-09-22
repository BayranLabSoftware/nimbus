import { useId, type JSX } from 'react';
import {
  layoutColorbar,
  rampColor,
  type ColorbarSpec,
} from '../../../scene/globe/impactFieldMap.js';
import styles from './ImpactReport.module.css';

/**
 * A layer's colour scale on paper: the globe legend's bar, laid out by the
 * same `layoutColorbar`, in ink. `height` is the drawing's, in CSS pixels.
 */
export function ReportColorbar({
  spec,
  height,
}: {
  spec: ColorbarSpec;
  height: number;
}): JSX.Element {
  const gradientId = useId();
  const top = 8;
  const bar = height - 22;
  const x = 8;
  const width = 12;
  const labelX = 86;
  const { ticks, marks } = layoutColorbar(spec, top, bar, 22);
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
  return (
    <svg
      className={styles.colorbar}
      viewBox={`0 0 300 ${(top + bar + 14).toString()}`}
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
        height={bar}
        fill={`url(#${gradientId})`}
        stroke="#1b1b19"
        strokeWidth={0.7}
      />
      {ticks.map(({ y, label }) => (
        <g key={label}>
          <line x1={x + width} x2={x + width + 4} y1={y} y2={y} stroke="#6b675f" />
          <text x={x + width + 7} y={y + 3.2} className={styles.barTick}>
            {label}
          </text>
        </g>
      ))}
      {marks.map((m) => (
        <g key={`${m.label}-${m.detail}`}>
          <line
            x1={x - 3}
            x2={x + width + 3}
            y1={m.y}
            y2={m.y}
            stroke="#141414"
            strokeWidth={1.5}
          />
          <path
            d={`M${(x + width + 3).toString()},${m.y.toString()} L${(labelX - 10).toString()},${m.y.toString()} L${(labelX - 3).toString()},${m.ly.toString()}`}
            fill="none"
            stroke="rgba(0,0,0,0.35)"
          />
          <text x={labelX} y={m.ly - 1} className={styles.barMark}>
            {m.label}
          </text>
          <text x={labelX} y={m.ly + 9.5} className={styles.barDetail}>
            {m.detail}
          </text>
        </g>
      ))}
    </svg>
  );
}
