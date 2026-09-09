import { nearestCountry } from '../../physics/countryLookup.js';
import {
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Color,
  DistanceDisplayCondition,
  HeightReference,
  HorizontalOrigin,
  LabelCollection,
  LabelStyle,
  NearFarScalar,
  VerticalOrigin,
  type Label,
  type Viewer,
} from 'cesium';

/**
 * Cities on the globe.
 *
 * A simulation is placed by clicking a point on a photograph of the
 * planet, and a photograph has no names on it: finding Naples or
 * Jakarta meant zooming in until the imagery itself became legible.
 * This layer draws the Natural Earth 1:10m populated-places index
 * (public domain, ≈ 4 000 places: every city above 100 000 people,
 * every national capital, and the regional reference points Natural
 * Earth labels at coarse zooms) as a dot + name, clamped to the
 * terrain so mountain capitals (La Paz, Quito, Addis Ababa) don't
 * sink under the DEM. Clicking a city sets it as the event location.
 *
 * Density is governed by Natural Earth's own `min_zoom` — the web-map
 * zoom level at which their cartographers first place each label
 * without collisions — turned into a camera distance per label. From
 * orbit only the handful of world cities show; descending to a
 * region brings in its towns. Labels fade in over the last quarter
 * of their range instead of popping.
 *
 * Two primitive collections (billboards for the dots, labels for the
 * names) rather than entities: entities re-evaluate every property
 * each frame, which for 4 000 points is a measurable cost, while
 * collections batch into a couple of draw calls. `scene` is passed
 * to both so `HeightReference.CLAMP_TO_GROUND` works.
 *
 * Data: `public/data/cities.json`, produced by
 * `scripts/build-cities.ts` — row format documented there.
 */

export interface CityRecord {
  nameEn: string;
  /** Italian exonym when Natural Earth has one that differs (Roma,
   *  Monaco di Baviera, Il Cairo); empty otherwise. */
  nameIt: string;
  lat: number;
  lon: number;
  /** Natural Earth POP_MAX — metro-area upper estimate. */
  popMax: number;
  /** Natural Earth MIN_ZOOM (web-map zoom level, may be fractional). */
  minZoom: number;
  /** ISO 3166-1 alpha-2 country code, or "" where Natural Earth has
   *  none (Kosovo, Somaliland). The shaking casualty model reads it
   *  through `nearestCountry`: the PAGER fatality curves differ by
   *  three orders of magnitude between building stocks, and this
   *  index is the only thing the project ships that knows which
   *  country a place is in. */
  cc: string;
  capital: boolean;
}

/** Object stored as the pick `id` of every city billboard and label,
 *  so the globe's click / hover handlers can tell a city apart from
 *  ring entities (whose ids are strings). */
export interface CityPickId {
  nimbusCity: CityRecord;
}

export function isCityPick(id: unknown): id is CityPickId {
  return (
    typeof id === 'object' && id !== null && 'nimbusCity' in id && typeof id.nimbusCity === 'object'
  );
}

type CityRow = [
  nameEn: string,
  nameIt: string,
  lat: number,
  lon: number,
  popMax: number,
  minZoom: number,
  capital: number,
  cc?: string,
];

interface CityIndexFile {
  rows: CityRow[];
}

/** Path of the static index, relative to the deployed base URL. */
const CITY_INDEX_PATH = 'data/cities.json';

let cityIndexPromise: Promise<CityRecord[]> | null = null;
/** The parsed index, once it has landed. Read synchronously by the
 *  casualty path, which needs a country before it can pick a fatality
 *  curve and cannot await inside the evaluate call. */
let cityIndexCache: CityRecord[] = [];

function parseCityRows(rows: readonly CityRow[]): CityRecord[] {
  const out: CityRecord[] = [];
  for (const row of rows) {
    if (!Array.isArray(row)) continue;
    const [nameEn, nameIt, lat, lon, popMax, minZoom, capital, cc] = row;
    if (typeof nameEn !== 'string' || !Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    out.push({
      nameEn,
      nameIt: typeof nameIt === 'string' ? nameIt : '',
      lat,
      lon,
      popMax: Number.isFinite(popMax) ? popMax : 0,
      minZoom: Number.isFinite(minZoom) ? minZoom : 10,
      capital: capital === 1,
      cc: typeof cc === 'string' && cc.length === 2 ? cc : '',
    });
  }
  return out;
}

/**
 * Fetch and parse the city index once per session. Resolves to an
 * empty list when the asset is unreachable — the globe simply has no
 * names on it, which is the pre-existing behaviour, not an error the
 * user should see.
 */
export function loadCityIndex(baseUrl: string = import.meta.env.BASE_URL): Promise<CityRecord[]> {
  if (cityIndexPromise !== null) return cityIndexPromise;
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  cityIndexPromise = fetch(`${base}${CITY_INDEX_PATH}`)
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`city index fetch failed: ${response.status.toString()}`);
      }
      const file = (await response.json()) as CityIndexFile;
      cityIndexCache = parseCityRows(file.rows);
      return cityIndexCache;
    })
    .catch((err: unknown) => {
      console.warn('[cityLabels] city index unavailable:', err);
      cityIndexPromise = null;
      return [];
    });
  return cityIndexPromise;
}

/** Name to draw for the active UI language. */
export function cityDisplayName(city: CityRecord, language: string): string {
  return language.toLowerCase().startsWith('it') && city.nameIt.length > 0
    ? city.nameIt
    : city.nameEn;
}

/**
 * Camera distance (m) at which a label of the given Natural Earth
 * zoom tier becomes visible. A web map at zoom z resolves
 * 156 543 / 2^z m per pixel; on a 1 440 px viewport under Cesium's
 * 60° field of view that scale is reached at an altitude of
 * ≈ 1.95 × 10⁸ / 2^z m. We use 0.6 of that: the globe is a
 * perspective view whose scale shrinks away from the centre, so
 * labels placed at exactly the flat-map altitude would collide near
 * the limb. World cities (tier ≤ 2.5) are visible from any distance.
 */
const LABEL_RANGE_SCALE_M = 1.2e8;
const ALWAYS_VISIBLE_TIER = 2.5;
const FAR_LIMIT_M = 1e9;

export function labelRangeMetres(minZoom: number): number {
  if (!Number.isFinite(minZoom) || minZoom <= ALWAYS_VISIBLE_TIER) return FAR_LIMIT_M;
  return LABEL_RANGE_SCALE_M / 2 ** minZoom;
}

/** Population, rounded the way a caption would print it. */
export function formatPopulation(popMax: number, language: string): string {
  if (!Number.isFinite(popMax) || popMax <= 0) return '';
  const locale = language.toLowerCase().startsWith('it') ? 'it-IT' : 'en-US';
  if (popMax >= 1_000_000) {
    return `${(popMax / 1_000_000).toLocaleString(locale, { maximumFractionDigits: 1 })} M`;
  }
  return popMax.toLocaleString(locale, { maximumFractionDigits: 0 });
}

/** Labels are never hidden by terrain within this distance of the
 *  camera; beyond it the depth test against the globe takes over so
 *  the far side of the planet stays clean. 300 km is below the
 *  horizon distance from 7 km of altitude, so a label can only leak
 *  through the limb from a camera lower than that. */
const DEPTH_TEST_FREE_M = 300_000;

const LABEL_FILL = Color.fromCssColorString('#F4F1EA').withAlpha(0.95);
const LABEL_OUTLINE = Color.fromCssColorString('#0A0E16').withAlpha(0.9);

function makeDotImage(radiusPx: number, capital: boolean): HTMLCanvasElement {
  // 2× canvas, drawn at scale 0.5, so the dot stays crisp on HiDPI.
  const size = Math.ceil(radiusPx * 2 + 6) * 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx === null) return canvas;
  const c = size / 2;
  ctx.beginPath();
  ctx.arc(c, c, radiusPx * 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 241, 234, 0.96)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(10, 14, 22, 0.9)';
  ctx.stroke();
  if (capital) {
    // A capital is a ringed dot — the classic atlas convention.
    ctx.beginPath();
    ctx.arc(c, c, radiusPx * 2 * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
    ctx.fill();
  }
  return canvas;
}

export interface CityLayerOptions {
  /** Active UI language — picks the exonym column. */
  language: string;
  /** Software-WebGL machines get the coarse tiers only. */
  lite: boolean;
}

export interface CityLayerHandle {
  setVisible(visible: boolean): void;
  setLanguage(language: string): void;
  /** Number of cities placed (for diagnostics). */
  readonly count: number;
  destroy(): void;
}

/** Coarsest Natural Earth tier drawn on a software rasteriser. */
const LITE_MAX_TIER = 5.9;

/**
 * Mount the dots and names on the viewer. Returns a handle used by the
 * globe to toggle visibility, swap the language and tear down.
 */
export function mountCityLayer(
  viewer: Viewer,
  cities: readonly CityRecord[],
  options: CityLayerOptions
): CityLayerHandle {
  const scene = viewer.scene;
  const billboards = new BillboardCollection({ scene });
  const labels = new LabelCollection({ scene });
  const dot = makeDotImage(3.2, false);
  const capitalDot = makeDotImage(4, true);
  const placed: { label: Label; city: CityRecord }[] = [];

  for (const city of cities) {
    if (options.lite && city.minZoom > LITE_MAX_TIER) continue;
    const far = labelRangeMetres(city.minZoom);
    const condition = new DistanceDisplayCondition(0, far);
    const fade = far >= FAR_LIMIT_M ? undefined : new NearFarScalar(far * 0.75, 1.0, far, 0.0);
    const position = Cartesian3.fromDegrees(city.lon, city.lat);
    const pickId: CityPickId = { nimbusCity: city };
    const prominent = city.capital || city.popMax >= 5_000_000;
    billboards.add({
      position,
      image: city.capital ? capitalDot : dot,
      scale: 0.5,
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.CENTER,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: DEPTH_TEST_FREE_M,
      distanceDisplayCondition: condition,
      ...(fade !== undefined && { translucencyByDistance: fade }),
      id: pickId,
    });
    const label = labels.add({
      position,
      text: cityDisplayName(city, options.language),
      font: prominent
        ? '600 13px Inter, "Segoe UI", system-ui, sans-serif'
        : '500 12px Inter, "Segoe UI", system-ui, sans-serif',
      fillColor: LABEL_FILL,
      outlineColor: LABEL_OUTLINE,
      outlineWidth: 3,
      style: LabelStyle.FILL_AND_OUTLINE,
      pixelOffset: new Cartesian2(city.capital ? 9 : 7, 0),
      horizontalOrigin: HorizontalOrigin.LEFT,
      verticalOrigin: VerticalOrigin.CENTER,
      heightReference: HeightReference.CLAMP_TO_GROUND,
      disableDepthTestDistance: DEPTH_TEST_FREE_M,
      distanceDisplayCondition: condition,
      ...(fade !== undefined && { translucencyByDistance: fade }),
      id: pickId,
    });
    placed.push({ label, city });
  }

  scene.primitives.add(billboards);
  scene.primitives.add(labels);
  scene.requestRender();

  return {
    count: placed.length,
    setVisible(visible: boolean): void {
      billboards.show = visible;
      labels.show = visible;
      scene.requestRender();
    },
    setLanguage(language: string): void {
      for (const { label, city } of placed) {
        label.text = cityDisplayName(city, language);
      }
      scene.requestRender();
    },
    destroy(): void {
      if (viewer.isDestroyed()) return;
      scene.primitives.remove(billboards);
      scene.primitives.remove(labels);
    },
  };
}

/**
 * Case- and accent-insensitive prefix search over both name columns,
 * largest cities first. Used by the "go to city" field in the
 * simulator panel.
 */
export function searchCities(
  cities: readonly CityRecord[],
  query: string,
  limit = 8
): CityRecord[] {
  const q = normaliseForSearch(query);
  if (q.length === 0) return [];
  const out: CityRecord[] = [];
  for (const city of cities) {
    const en = normaliseForSearch(city.nameEn);
    const it = normaliseForSearch(city.nameIt);
    if (en.startsWith(q) || (it.length > 0 && it.startsWith(q))) {
      out.push(city);
      if (out.length >= limit) break;
    }
  }
  return out;
}

function normaliseForSearch(text: string): string {
  // NFD splits "ã" into "a" + combining tilde; dropping the combining
  // block (U+0300–U+036F) leaves the bare letter.
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * The country of the nearest city to a point, from the index if it
 * has loaded, or null if it has not.
 *
 * Synchronous on purpose. The casualty path picks a PAGER fatality
 * curve while building its plan and cannot await there; the globe
 * fetches this index when it mounts, which is long before anyone can
 * pick a location on it, so in practice it is warm. When it is not,
 * the model falls back to the median of the world's countries and
 * says so.
 */
export function countryAtCached(lat: number, lon: number): string | null {
  return nearestCountry(cityIndexCache, lat, lon)?.cc ?? null;
}

/** Warm the index without waiting for it. */
export function warmCityIndex(): void {
  void loadCityIndex();
}
