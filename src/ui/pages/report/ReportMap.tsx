import { useEffect, useId, useMemo, useState, type JSX } from 'react';
import type { ImpactScenarioResult } from '../../../physics/simulate.js';
import { cityDisplayName, type CityRecord } from '../../../scene/globe/cityLabels.js';
import {
  familyShapes,
  markLabelRadius,
  type GeoPoint,
  type ImpactMapLayer,
} from '../../../scene/globe/impactFieldMap.js';
import {
  aeqdForward,
  gridSampler,
  isolineInPlane,
  placeCities,
  rasterizeReportMap,
  reportMapDrawing,
  reportMapOverlays,
  type PlanePoint,
  type PopulationGridLike,
} from '../../../scene/globe/reportMap.js';
import { fixed } from './reportFormat.js';
import styles from './ImpactReport.module.css';

export interface ReportMapProps {
  result: ImpactScenarioResult;
  layer: ImpactMapLayer;
  anchor: GeoPoint;
  /** Side of the square, CSS pixels. */
  size: number;
  /** Side of the ground's raster, pixels: twice the size prints sharp. */
  resolution: number;
  language: string;
  cities: readonly CityRecord[] | null;
  /** Undefined while it loads, null where it could not be loaded. */
  population: PopulationGridLike | null | undefined;
  craterLabel: string | null;
  /** The globe's own view of this layer (map C), where there is one. */
  globeShot: string | null;
  words: {
    north: string;
    onGlobe: string;
    hemispheres: { north: string; south: string; east: string; west: string };
  };
}

const INK = '#141414';
const HALO = 'rgba(255,255,255,0.96)';
const FAINT = 'rgba(0,0,0,0.17)';
/** Rule 1030 (3) on paper: a limit of the model, a neutral dash-dot line. */
const LIMIT_INK = '#5c5c5c';
const LIMIT_DASH = '7 2.5 1.5 2.5';

function pathOf(
  points: readonly PlanePoint[],
  X: (x: number) => number,
  Y: (y: number) => number
): string {
  return points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${X(x).toFixed(1)},${Y(y).toFixed(1)}`)
    .join('');
}

/** A graticule value as a map's margin writes it: "35,2° N". */
function degreeLabel(
  value: number,
  kind: 'lat' | 'lon',
  step: number,
  language: string,
  h: ReportMapProps['words']['hemispheres']
): string {
  const digits = step >= 1 ? 0 : Math.abs(step * 10 - Math.round(step * 10)) < 1e-9 ? 1 : 2;
  const side = kind === 'lat' ? (value >= 0 ? h.north : h.south) : value >= 0 ? h.east : h.west;
  return `${fixed(Math.abs(value), digits, language)}° ${side}`;
}

function Halo({
  x,
  y,
  text,
  size,
  weight,
  mono,
  italic,
  anchor = 'middle',
}: {
  x: number;
  y: number;
  /** Lines apart at «\n». */
  text: string;
  size: number;
  weight: number;
  mono?: boolean;
  /** A state's words (rule 1030), set apart from the values. */
  italic?: boolean;
  anchor?: 'start' | 'middle' | 'end';
}): JSX.Element {
  const lines = text.split('\n');
  const step = size + 2;
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      dominantBaseline="central"
      className={mono === true ? styles.mapTextMono : styles.mapText}
      fontSize={size}
      fontWeight={weight}
      fontStyle={italic === true ? 'italic' : undefined}
      fill={INK}
      stroke={HALO}
      strokeWidth={3}
      strokeLinejoin="round"
      paintOrder="stroke"
    >
      {lines.length === 1
        ? text
        : lines.map((line, i) => (
            <tspan key={line} x={x} y={y + (i - (lines.length - 1) / 2) * step}>
              {line}
            </tspan>
          ))}
    </text>
  );
}

/**
 * One layer of an impact's map, flat, for the report: the ground as the
 * model paints it (`rasterizeReportMap`), and in vector over it the isolines
 * with their values, the crater, the graticule, the cities, a scale bar and
 * the north — and, in its corner, the globe's own view of the layer.
 */
export function ReportMap({
  result,
  layer,
  anchor,
  size,
  resolution,
  language,
  cities,
  population,
  craterLabel,
  globeShot,
  words,
}: ReportMapProps): JSX.Element {
  const clipId = useId();
  const drawing = useMemo(() => reportMapDrawing(result, layer, anchor), [result, layer, anchor]);
  const [raster, setRaster] = useState<string | null>(null);

  useEffect(() => {
    if (population === undefined) return;
    let cancelled = false;
    // Off the render: a map is some hundred thousand pixels.
    const handle = window.setTimeout(() => {
      const shapes = familyShapes(result);
      const shape = layer.field === null ? null : shapes[layer.field.family];
      const data = rasterizeReportMap(
        layer.field,
        shape,
        anchor,
        drawing.halfWidthM,
        resolution,
        population === null ? null : gridSampler(population),
        reportMapOverlays(result, layer)
      );
      const canvas = document.createElement('canvas');
      canvas.width = resolution;
      canvas.height = resolution;
      const ctx = canvas.getContext('2d');
      if (ctx === null || cancelled) return;
      ctx.putImageData(new ImageData(data, resolution, resolution), 0, 0);
      setRaster(canvas.toDataURL('image/jpeg', 0.9));
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [result, layer, anchor, drawing.halfWidthM, resolution, population]);

  const H = drawing.halfWidthM;
  const k = size / (2 * H);
  const X = (x: number): number => (x + H) * k;
  const Y = (y: number): number => (H - y) * k;
  const labelSize = size > 340 ? 10.5 : 9.5;

  // Each line's value, and each state's words (rule 1037 (a)), where the globe
  // writes them; where that would print over a label already placed — the
  // wind's lines crowd the centre — turned along its own line until it prints
  // clear. A state's words that find no clear place are left to the legend's
  // key; a line's value always prints.
  const labels = useMemo(() => {
    const shapes = familyShapes(result);
    const stateSize = labelSize - 1;
    const items = [
      ...layer.isolines.map((line, i) => ({
        key: `${line.id}-label`,
        text: drawing.isolines[i]?.label ?? line.label,
        family: line.family,
        radiusM: line.radiusM,
        bearingDeg: line.labelBearingDeg,
        state: line.state === 'modelLimit',
        required: true,
      })),
      ...layer.marks.map((mk) => ({
        key: `mark-${mk.id}-label`,
        text: mk.label,
        family: mk.family,
        radiusM: markLabelRadius(mk),
        bearingDeg: mk.labelBearingDeg,
        state: true,
        required: false,
      })),
    ];
    // The north, the scale and the photograph are taken before any label.
    const placedBoxes: [number, number, number, number][] = [
      [size - 30, 0, size, 40],
      [0, size - 30, size * 0.45, size],
    ];
    if (globeShot !== null)
      placedBoxes.push([size - size * 0.31 - 10, size - size * 0.31 - 24, size, size]);
    return items.flatMap((item) => {
      const fontSize = item.state ? stateSize : labelSize;
      const lines = item.text.split('\n');
      const w = Math.max(...lines.map((l) => l.length)) * fontSize * (item.state ? 0.5 : 0.62) + 6;
      const h = lines.length * (fontSize + 2) + 2;
      const boxAt = (px: number, py: number): [number, number, number, number] => [
        px - w / 2,
        py - h / 2,
        px + w / 2,
        py + h / 2,
      ];
      for (const delta of [0, 28, -28, 56, -56, 84, -84, 112, -112, 140, -140, 180]) {
        const [x, y] = isolineInPlane(shapes[item.family], item.radiusM, item.bearingDeg + delta);
        const px = (x + H) * k;
        const py = (H - y) * k;
        const box = boxAt(px, py);
        const clear =
          box[0] > 2 &&
          box[1] > 12 &&
          box[2] < size - 2 &&
          box[3] < size - 24 &&
          !placedBoxes.some(
            (b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]
          );
        if (clear) {
          placedBoxes.push(box);
          return [{ ...item, fontSize, x: px, y: py, box }];
        }
      }
      if (!item.required) return [];
      const [x, y] = isolineInPlane(shapes[item.family], item.radiusM, item.bearingDeg);
      const px = (x + H) * k;
      const py = (H - y) * k;
      return [{ ...item, fontSize, x: px, y: py, box: boxAt(px, py) }];
    });
  }, [result, layer, drawing, H, k, size, labelSize, globeShot]);

  // What the cities' names must not print over: the labels, the north, the
  // scale and the photograph.
  const inset = globeShot === null ? null : { w: size * 0.31 };
  const occupied: [number, number, number, number][] = labels.map((l) => l.box);
  occupied.push([size - 30, 0, size, 40], [0, size - 30, size * 0.45, size]);
  if (inset !== null) occupied.push([size - inset.w - 10, size - inset.w - 24, size, size]);

  const placed = useMemo(() => {
    if (cities === null) return [];
    const inside = [];
    for (const c of cities) {
      const [x, y] = aeqdForward(anchor, c.lat, c.lon);
      if (Math.abs(x) >= H * 0.97 || Math.abs(y) >= H * 0.97) continue;
      inside.push({
        name: cityDisplayName(c, language),
        x: X(x),
        y: Y(y),
        popMax: c.popMax,
      });
    }
    return placeCities(inside, size, occupied, 5.6);
    // `occupied` follows from the drawing and the size.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities, anchor, H, size, language, drawing, globeShot]);

  const craterPx =
    drawing.crater === null ? 0 : Math.max(...drawing.crater.map((p) => Math.abs(p[0]))) * k;
  const bar = drawing.scaleBarM * k;
  const barLabel =
    drawing.scaleBarM < 1_000
      ? `${fixed(drawing.scaleBarM, 0, language)} m`
      : `${fixed(drawing.scaleBarM / 1_000, 0, language)} km`;

  let lastLonEnd = Number.NEGATIVE_INFINITY;
  const lonLabels: JSX.Element[] = [];
  const latLabels: JSX.Element[] = [];
  for (const g of drawing.graticule.lines) {
    if (g.kind === 'lat') {
      const p = g.points.find((q) => q[0] >= -H * 0.985);
      if (p !== undefined && Math.abs(p[1]) < H * 0.9) {
        latLabels.push(
          <Halo
            key={`lat-${g.valueDeg.toString()}`}
            x={4}
            y={Y(p[1]) - 6}
            text={degreeLabel(
              g.valueDeg,
              'lat',
              drawing.graticule.stepDeg,
              language,
              words.hemispheres
            )}
            size={8}
            weight={500}
            mono
            anchor="start"
          />
        );
      }
    }
  }
  const meridians = drawing.graticule.lines
    .filter((g) => g.kind === 'lon')
    .map((g) => ({ g, p: [...g.points].reverse().find((q) => q[1] <= H * 0.985) }))
    .filter(
      (m): m is { g: (typeof drawing.graticule.lines)[number]; p: PlanePoint } => m.p !== undefined
    )
    .sort((a, b) => a.p[0] - b.p[0]);
  for (const { g, p } of meridians) {
    const text = degreeLabel(
      g.valueDeg,
      'lon',
      drawing.graticule.stepDeg,
      language,
      words.hemispheres
    );
    const x0 = X(p[0]) + 3;
    const x1 = x0 + text.length * 5.1;
    if (Math.abs(p[0]) < H * 0.9 && x0 > lastLonEnd + 6 && x1 < size - 34) {
      lonLabels.push(
        <Halo
          key={`lon-${g.valueDeg.toString()}`}
          x={x0}
          y={9}
          text={text}
          size={8}
          weight={500}
          mono
          anchor="start"
        />
      );
      lastLonEnd = x1;
    }
  }

  return (
    <svg
      className={styles.mapSvg}
      viewBox={`0 0 ${size.toString()} ${size.toString()}`}
      role="img"
      aria-label={layer.title}
      data-report-map={layer.id}
      data-ready={raster === null ? 'false' : 'true'}
    >
      <defs>
        <clipPath id={clipId}>
          <rect width={size} height={size} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <rect width={size} height={size} fill="#f1f0eb" />
        {raster !== null && (
          <image href={raster} x={0} y={0} width={size} height={size} preserveAspectRatio="none" />
        )}
        {drawing.graticule.lines.map((g) => (
          <path
            key={`${g.kind}-${g.valueDeg.toString()}`}
            d={pathOf(g.points, X, Y)}
            fill="none"
            stroke={FAINT}
            strokeWidth={0.7}
          />
        ))}
        {latLabels}
        {lonLabels}
        {drawing.crater !== null && craterPx >= 2.5 ? (
          <path
            d={`${pathOf(drawing.crater, X, Y)}Z`}
            fill="#050505"
            fillOpacity={0.9}
            stroke="#f4f1ea"
            strokeWidth={0.9}
          />
        ) : (
          <circle cx={X(0)} cy={Y(0)} r={2.6} fill="#ffd34d" stroke={INK} strokeWidth={1} />
        )}
        {drawing.limits.map((l) => {
          const d = pathOf(l.points, X, Y);
          return (
            <g key={`limit-${l.id}`} data-map-state="modelLimit">
              <path d={d} fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth={3.4} />
              <path
                d={d}
                fill="none"
                stroke={LIMIT_INK}
                strokeWidth={1.9}
                strokeDasharray={LIMIT_DASH}
              />
            </g>
          );
        })}
        {drawing.isolines.map((l) => {
          // Rule 1031 (a): at a limit of the model, the limit's line and a
          // callout, no isoline.
          if (l.state === 'modelLimit') return null;
          const d = pathOf(l.points, X, Y);
          return (
            <g key={l.id}>
              <path
                d={d}
                fill="none"
                stroke="rgba(255,255,255,0.8)"
                strokeWidth={3.2}
                strokeLinejoin="round"
              />
              <path d={d} fill="none" stroke={INK} strokeWidth={1.4} strokeLinejoin="round" />
            </g>
          );
        })}
        {placed.map((c) => (
          <g key={`${c.name}-${c.x.toFixed(0)}`}>
            <circle cx={c.x} cy={c.y} r={2.3} fill={INK} stroke={HALO} strokeWidth={1.2} />
            {c.label !== null && (
              <Halo
                x={c.label.x}
                y={c.label.y}
                text={c.name}
                size={9}
                weight={500}
                anchor={c.label.anchor}
              />
            )}
          </g>
        ))}
        {labels.map((l) => (
          <Halo
            key={l.key}
            x={l.x}
            y={l.y}
            text={l.text}
            size={l.fontSize}
            weight={l.state ? 600 : 700}
            mono={!l.state}
            italic={l.state}
          />
        ))}
        {craterLabel !== null && craterPx >= 2.5 && (
          <Halo x={X(0)} y={Y(0) + craterPx + 9} text={craterLabel} size={9} weight={600} />
        )}
        <g aria-hidden="true">
          <rect
            x={10}
            y={size - 14}
            width={bar / 2}
            height={4}
            fill={INK}
            stroke={HALO}
            strokeWidth={0.8}
          />
          <rect
            x={10 + bar / 2}
            y={size - 14}
            width={bar / 2}
            height={4}
            fill="#ffffff"
            stroke={INK}
            strokeWidth={0.8}
          />
          <Halo x={10} y={size - 21} text="0" size={8} weight={500} mono anchor="start" />
          <Halo
            x={10 + bar}
            y={size - 21}
            text={barLabel}
            size={8}
            weight={600}
            mono
            anchor="end"
          />
          <path
            d={`M${(size - 16).toString()},${(12).toString()} L${(size - 11).toString()},27 L${(size - 16).toString()},24 L${(size - 21).toString()},27 Z`}
            fill={INK}
            stroke={HALO}
            strokeWidth={1}
          />
          <Halo x={size - 16} y={35} text={words.north} size={8.5} weight={700} />
        </g>
        {inset !== null && globeShot !== null && (
          <g>
            <rect
              x={size - inset.w - 8}
              y={size - inset.w - 22}
              width={inset.w + 4}
              height={inset.w + 16}
              fill="#ffffff"
              stroke="rgba(0,0,0,0.35)"
              strokeWidth={0.6}
            />
            <image
              href={globeShot}
              x={size - inset.w - 6}
              y={size - inset.w - 20}
              width={inset.w}
              height={inset.w}
              preserveAspectRatio="xMidYMid slice"
            />
            <text
              x={size - inset.w - 5}
              y={size - 10}
              className={styles.mapTextMono}
              fontSize={6.8}
              fill="#57534c"
            >
              {words.onGlobe}
            </text>
          </g>
        )}
      </g>
      <rect
        x={0.5}
        y={0.5}
        width={size - 1}
        height={size - 1}
        fill="none"
        stroke="#1b1b19"
        strokeWidth={1}
      />
    </svg>
  );
}
