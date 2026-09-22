import { Cartographic, Math as CesiumMath } from 'cesium';
import type { TFunction } from 'i18next';
import { describe, expect, it } from 'vitest';
import { airburstBlastBand } from '../../physics/effects/airburstBlast.js';
import { ejectaThickness } from '../../physics/effects/ejecta.js';
import {
  impactOverpressureAt,
  impactPeakWindAt,
  programOverpressureForWind,
} from '../../physics/events/impact/impactField.js';
import { programShakingRadiusKm } from '../../physics/events/impact/seismic.js';
import { IMPACT_PRESETS, simulateImpact } from '../../physics/simulate.js';
import { J, m, Pa } from '../../physics/units.js';
import {
  heatmapColorAt,
  WAVE_CONTOUR_STYLES,
  WAVE_CREST_CSS,
  WAVE_ISOCHRONE_CSS,
  WAVE_RUNUP_TIERS,
  WAVE_STREAK_CSS,
} from '../heatmap.js';
import { projectAlongAzimuth } from '../stadiumPolygon.js';
import {
  availableImpactLayers,
  buildImpactLayer,
  familyShapes,
  fieldSourceOf,
  IMPACT_LAYER_ORDER,
  isFieldLayer,
  isolinePointAtBearing,
  levelGeometry,
  nominalRangeAt,
  probabilityRadius,
  rasterizeGround,
  uncertaintyChoices,
  type GeoPoint,
  type WaveMapKey,
} from './impactFieldMap.js';
import { ringOutlinePositions } from './ringPresentation.js';

const t = ((key: string, params?: Record<string, unknown>) =>
  params === undefined ? key : `${key}${JSON.stringify(params)}`) as unknown as TFunction;
const ctx = { t, language: 'it' };

const METEOR: GeoPoint = { latDeg: 35.0275, lonDeg: -111.0225 };
const meteor = simulateImpact(IMPACT_PRESETS.METEOR_CRATER.input);
const tunguska = simulateImpact(IMPACT_PRESETS.TUNGUSKA.input);

describe('one geometry for the isoline and the colour (B-105)', () => {
  it('stands an oblique family about the centre the model moves downrange', () => {
    const shape = familyShapes(meteor).blast;
    const ring = meteor.damageAsymmetry.lightDamage;
    const g = levelGeometry(METEOR, shape, meteor.damage.lightDamage);
    const expected = projectAlongAzimuth(
      METEOR.latDeg,
      METEOR.lonDeg,
      (ring.azimuthDeg * Math.PI) / 180,
      ring.centerOffsetMeters
    );
    expect(ring.centerOffsetMeters).toBeGreaterThan(0);
    expect(g.centerLatDeg).toBeCloseTo(expected.latDeg, 9);
    expect(g.centerLonDeg).toBeCloseTo(expected.lonDeg, 9);
    expect(g.semiMajorM).toBeCloseTo(meteor.damage.lightDamage * ring.semiMajorMultiplier, 3);
  });

  it('reads back, from every point of the model’s ellipse, the radius it was drawn for', () => {
    const shapes = familyShapes(meteor);
    for (const [family, radius] of [
      ['blast', meteor.damage.lightDamage],
      ['blast', meteor.damage.overpressure5psi],
      ['heat', meteor.damage.secondDegreeBurn],
      ['ejecta', meteor.ejecta.blanketEdge1mm],
    ] as const) {
      const g = levelGeometry(METEOR, shapes[family], radius);
      const outline = ringOutlinePositions(g);
      expect(outline.length).toBeGreaterThan(20);
      for (const p of outline) {
        const c = Cartographic.fromCartesian(p);
        const back = nominalRangeAt(
          METEOR,
          shapes[family],
          CesiumMath.toDegrees(c.latitude),
          CesiumMath.toDegrees(c.longitude)
        );
        expect(Math.abs(back / radius - 1), `${family} at ${radius.toFixed(0)} m`).toBeLessThan(
          3e-3
        );
      }
    }
  });

  it('writes a label on its line at every bearing, the ones past 180° included', () => {
    const shape = familyShapes(meteor).blast;
    for (let bearing = 0; bearing < 360; bearing += 15) {
      const p = isolinePointAtBearing(METEOR, shape, meteor.damage.overpressure1psi, bearing);
      const back = nominalRangeAt(METEOR, shape, p.latDeg, p.lonDeg);
      expect(
        Math.abs(back / meteor.damage.overpressure1psi - 1),
        `${bearing.toString()}°`
      ).toBeLessThan(1e-5);
    }
  });
});

describe('the layers an impact draws: every quantity, nothing left out', () => {
  it('draws Meteor Crater six ways and Tunguska four', () => {
    expect(availableImpactLayers(meteor, ctx).map((l) => l.id)).toEqual([
      'overpressure',
      'wind',
      'thermal',
      'ejecta',
      'shaking',
      'uncertainty',
    ]);
    expect(availableImpactLayers(tunguska, ctx).map((l) => l.id)).toEqual([
      'overpressure',
      'wind',
      'shaking',
      'uncertainty',
    ]);
  });

  it('stands the overpressure isolines on the rings the result publishes, at their thresholds', () => {
    const layer = buildImpactLayer(meteor, 'overpressure', ctx);
    const source = fieldSourceOf(meteor);
    expect(layer?.isolines.map((l) => l.radiusM)).toEqual([
      meteor.damage.overpressure5psi,
      meteor.damage.overpressure1psi,
      meteor.damage.lightDamage,
    ]);
    expect(layer?.isolines.map((l) => l.label)).toEqual(['5 psi', '1 psi', '0,5 psi']);
    for (const line of layer?.isolines ?? []) {
      expect(impactOverpressureAt(source, line.radiusM)).toBeGreaterThan(3_447);
    }
  });

  it('paints the zone where buildings collapse, and every range out to 0.5 psi (B-104)', () => {
    const layer = buildImpactLayer(meteor, 'overpressure', ctx);
    const field = layer?.field;
    expect(field).toBeDefined();
    if (field === undefined || field === null) return;
    for (
      let r: number = meteor.damage.craterRim;
      r <= meteor.damage.lightDamage * 0.999;
      r *= 1.05
    ) {
      expect(field.colorAt(r)?.[3] ?? 0, `${r.toFixed(0)} m`).toBeGreaterThan(0);
    }
    expect(field.colorAt(meteor.damage.lightDamage * 1.02)).toBeNull();
    // The zone of 5 psi is its own quantity's, more opaque than the far field.
    const inside = field.colorAt(meteor.damage.overpressure5psi * 0.9)?.[3] ?? 0;
    const outside = field.colorAt(meteor.damage.overpressure1psi * 1.1)?.[3] ?? 0;
    expect(inside).toBeGreaterThan(outside);
  });

  it('draws the wind where the blast sets the air moving at each level', () => {
    const layer = buildImpactLayer(meteor, 'wind', ctx);
    const source = fieldSourceOf(meteor);
    expect(layer?.isolines.map((l) => l.label)).toEqual([
      '100 km/h',
      '200 km/h',
      '300 km/h',
      '500 km/h',
      '1000 km/h',
    ]);
    for (const [i, kmh] of [100, 200, 300, 500, 1_000].entries()) {
      const r = layer?.isolines[i]?.radiusM ?? 0;
      expect(Math.abs(impactPeakWindAt(source, r) / (kmh / 3.6) - 1)).toBeLessThan(1e-6);
    }
  });

  it('stands the thermal isolines on the burns and the fires, and the ejecta on its thicknesses', () => {
    const heat = buildImpactLayer(meteor, 'thermal', ctx);
    expect(heat?.isolines.map((l) => l.radiusM).sort((a, b) => a - b)).toEqual(
      [
        meteor.firestorm.sustainRadius,
        meteor.firestorm.ignitionRadius,
        meteor.damage.thirdDegreeBurn,
        meteor.damage.secondDegreeBurn,
      ].sort((a, b) => a - b)
    );
    expect(heat?.isolines.find((l) => l.id === 'heat-secondDegreeBurn')?.label).toBe('5');
    expect(heat?.isolines.find((l) => l.id === 'heat-thirdDegreeBurn')?.label).toBe('8');
    const ejecta = buildImpactLayer(meteor, 'ejecta', ctx);
    expect(ejecta?.isolines.map((l) => l.label)).toEqual(['1 m', '10 cm', '1 cm', '1 mm']);
    expect(ejecta?.isolines.at(-1)?.radiusM).toBe(meteor.ejecta.blanketEdge1mm);
    const oneCm = ejecta?.isolines.find((l) => l.label === '1 cm')?.radiusM ?? 0;
    const rim = m((meteor.crater.finalDiameter as number) / 2);
    expect(ejectaThickness(m(oneCm), meteor.crater.transientDiameter, rim) as number).toBeCloseTo(
      0.01,
      6
    );
  });

  it('draws the program’s shaking rings, V–VI filled and III as a line (B-107)', () => {
    const layer = buildImpactLayer(meteor, 'shaking', ctx);
    const M = meteor.seismic.magnitude ?? 0;
    expect(layer?.isolines.map((l) => l.label)).toEqual(['III', 'V']);
    expect(layer?.isolines[0]?.radiusM).toBeCloseTo(programShakingRadiusKm(M, 3) * 1_000, 3);
    expect(layer?.isolines[1]?.radiusM).toBeCloseTo(programShakingRadiusKm(M, 4) * 1_000, 3);
    expect(layer?.categories.map((c) => c.label)).toEqual([
      'globe.impactMap.shakingZone{"levels":"V–VI","range":"49,3 km"}',
      'globe.impactMap.shakingZoneLine{"levels":"III–IV","range":"210 km"}',
    ]);
    expect(layer?.field?.colorAt(20_000)).not.toBeNull();
    expect(layer?.field?.colorAt(100_000)).toBeNull();
  });
});

describe('the uncertainty view: the band on the globe, in its own view', () => {
  it('reads a ground impact’s thresholds as a probability from the published scatter', () => {
    const choices = uncertaintyChoices(meteor, ctx);
    const fivePsi = choices.find((c) => c.key === 'overpressure5psi');
    expect(fivePsi?.kind).toBe('probability');
    expect(fivePsi?.sigma).toBe(0.18);
    expect(choices.find((c) => c.key === 'lightDamage')?.unavailable).toBeDefined();
    const layer = buildImpactLayer(meteor, 'uncertainty', {
      ...ctx,
      uncertaintyKey: 'overpressure5psi',
    });
    const r5 = meteor.damage.overpressure5psi;
    expect(layer?.isolines.map((l) => l.radiusM)).toEqual([
      probabilityRadius(r5, 0.18, 0.9),
      r5,
      probabilityRadius(r5, 0.18, 0.1),
    ]);
    expect(probabilityRadius(r5, 0.18, 0.1) / r5).toBeCloseTo(
      Math.exp(1.2815515655446004 * Math.log(1.18)),
      12
    );
  });

  it('reads an airburst’s blast as the agreement of the field’s band, rule 706’s own', () => {
    const choices = uncertaintyChoices(tunguska, ctx);
    const onePsi = choices.find((c) => c.key === 'overpressure1psi');
    expect(onePsi?.kind).toBe('agreement');
    expect(onePsi?.lowM).toBe(tunguska.airburstBand?.overpressure1psi.low);
    expect(onePsi?.highM).toBe(tunguska.airburstBand?.overpressure1psi.high);
    const wind = choices.find((c) => c.key === 'wind100');
    const band = airburstBlastBand(
      Pa(programOverpressureForWind(100 / 3.6)),
      tunguska.entry.burstAltitude,
      J(tunguska.entry.blastYieldMegatons * 4.184e15)
    );
    expect(wind?.kind).toBe('agreement');
    expect(wind?.lowM).toBe(Math.min(band.low as number, wind?.medianM ?? 0));
    expect(wind?.highM).toBe(Math.max(band.high as number, wind?.medianM ?? 0));
  });
});

describe('the ground painted as an image', () => {
  const layer = buildImpactLayer(meteor, 'overpressure', ctx);
  const shape = familyShapes(meteor).blast;

  it('paints inside the lowest isoline and nothing outside it', () => {
    if (layer?.field === null || layer?.field === undefined) throw new Error('no field');
    const [tile] = rasterizeGround(layer.field, shape, METEOR, 200);
    expect(tile).toBeDefined();
    if (tile === undefined) return;
    const alphaAt = (p: GeoPoint): number => {
      const x = Math.floor(((p.lonDeg - tile.west) / (tile.east - tile.west)) * tile.width);
      const y = Math.floor(((tile.north - p.latDeg) / (tile.north - tile.south)) * tile.height);
      expect(
        x >= 0 && x < tile.width && y >= 0 && y < tile.height,
        'the point lies on the tile'
      ).toBe(true);
      return tile.data[(y * tile.width + x) * 4 + 3] ?? 0;
    };
    // Across the family, where the 0.5 psi line stands at less than its radius.
    const across = ((shape.azimuthDeg + 90) * Math.PI) / 180;
    const inside = isolinePointAtBearing(
      METEOR,
      shape,
      meteor.damage.overpressure1psi,
      shape.azimuthDeg
    );
    const outside = projectAlongAzimuth(
      METEOR.latDeg,
      METEOR.lonDeg,
      across,
      meteor.damage.lightDamage
    );
    expect(alphaAt(inside)).toBeGreaterThan(0);
    expect(alphaAt(outside)).toBe(0);
  });

  it('splits a cap across ±180° in two tiles, and wraps one that reaches a pole', () => {
    if (layer?.field === null || layer?.field === undefined) throw new Error('no field');
    const east = rasterizeGround(layer.field, shape, { latDeg: 10, lonDeg: 179.9 }, 64);
    expect(east.length).toBe(2);
    expect(east.some((tile) => tile.east === 180)).toBe(true);
    expect(east.some((tile) => tile.west === -180)).toBe(true);
    const polar = rasterizeGround(layer.field, shape, { latDeg: 84.9, lonDeg: 20 }, 64);
    expect(polar.length).toBe(1);
    expect(polar[0]?.west).toBe(-180);
    expect(polar[0]?.east).toBe(180);
  });
});

describe('the tsunami’s layer: the wave map, named as the globe draws it (B-113)', () => {
  // Chicxulub on New Orleans, as the globe evaluates it: 9.2 km inland, the
  // nearest sea 1.17 m deep.
  const neworleans = simulateImpact({
    ...IMPACT_PRESETS.CHICXULUB.input,
    waterDepth: m(1.17),
    shoreDistance: m(9_245),
  });
  const ocean = simulateImpact({ ...IMPACT_PRESETS.METEOR_CRATER.input, waterDepth: m(100) });
  const nothing: WaveMapKey = {
    scope: 'global',
    veilTop: null,
    veilOpacity: { min: 0, max: 0 },
    contours: [],
    isochroneHours: [],
    crest: false,
    streaks: false,
    runup: [],
  };
  const hex = ([r, g, b]: [number, number, number]): string =>
    `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

  it('is offered only where the impact raises a wave, after the shaking, and is no field', () => {
    expect(meteor.tsunami).toBeUndefined();
    expect(availableImpactLayers(meteor, ctx).map((l) => l.id)).not.toContain('tsunami');
    expect(neworleans.tsunami).toBeDefined();
    const ids = availableImpactLayers(neworleans, ctx).map((l) => l.id);
    expect(ids.slice(-3)).toEqual(['shaking', 'tsunami', 'uncertainty']);
    for (const id of IMPACT_LAYER_ORDER) expect(isFieldLayer(id)).toBe(id !== 'tsunami');
    const layer = buildImpactLayer(neworleans, 'tsunami', ctx);
    expect(layer?.field).toBeNull();
    expect(layer?.isolines).toEqual([]);
  });

  it('promises nothing while the globe has drawn nothing', () => {
    for (const waveMap of [undefined, null]) {
      const layer = buildImpactLayer(neworleans, 'tsunami', { ...ctx, waveMap });
      expect(layer?.colorbar).toBeNull();
      expect(layer?.categories).toEqual([]);
      expect(layer?.notes.map((n) => n.text)).toContain('globe.impactMap.note.tsunamiNothing');
    }
  });

  it('keys each thing drawn, as it is drawn, and nothing else', () => {
    const drawn: WaveMapKey = {
      ...nothing,
      isochroneHours: [1, 2, 4, 8],
      crest: true,
      streaks: true,
      runup: WAVE_RUNUP_TIERS.slice(0, 1),
    };
    const layer = buildImpactLayer(neworleans, 'tsunami', { ...ctx, waveMap: drawn });
    expect(layer?.colorbar).toBeNull();
    expect(layer?.categories.map((c) => [c.shape, c.color])).toEqual([
      ['dashed', WAVE_ISOCHRONE_CSS],
      ['line', WAVE_CREST_CSS],
      ['line', WAVE_STREAK_CSS],
      ['dot', WAVE_RUNUP_TIERS[0]?.css],
    ]);
    expect(layer?.categories[0]?.label).toBe(
      'globe.impactMap.tsunamiIsochrones{"hours":"+1 h · +2 h · +4 h · +8 h"}'
    );
    expect(layer?.categories[3]?.label).toBe(
      'globe.impactMap.tsunamiRunupBand{"low":"2","high":"5 m"}'
    );
    expect(layer?.notes.map((n) => n.text)).toContain('globe.impactMap.note.tsunamiLinesOnly');
    const top = buildImpactLayer(neworleans, 'tsunami', {
      ...ctx,
      waveMap: { ...nothing, runup: WAVE_RUNUP_TIERS.slice(2) },
    });
    expect(top?.categories.map((c) => c.label)).toEqual([
      'globe.impactMap.tsunamiRunupFrom{"height":"10 m"}',
    ]);
  });

  it('draws the veil’s scale in the colours the heatmap paints, over the heights it spans', () => {
    const drawn: WaveMapKey = {
      ...nothing,
      veilTop: 38,
      veilOpacity: { min: 0.1, max: 0.34 },
      contours: WAVE_CONTOUR_STYLES.slice(0, 3),
    };
    const layer = buildImpactLayer(ocean, 'tsunami', { ...ctx, waveMap: drawn });
    const bar = layer?.colorbar;
    expect(bar).toBeDefined();
    if (bar === null || bar === undefined) return;
    expect([bar.log, bar.lo]).toEqual([true, 0]);
    expect(bar.hi).toBeCloseTo(Math.log10(38), 12);
    // Each stop of the bar is the heatmap's colour at the height it stands at.
    bar.palette.forEach((colour, i) => {
      const height = 10 ** ((i / (bar.palette.length - 1)) * Math.log10(38));
      expect(colour).toBe(hex(heatmapColorAt(height, 1, 38, 'waveVeil', 'sqrt')));
    });
    expect(bar.ticks.map((tick) => tick.label)).toEqual(['1 m', '3 m', '6 m', '10 m', '38 m']);
    expect(layer?.categories.map((c) => [c.shape, c.label])).toEqual([
      ['line', 'globe.impactMap.tsunamiContour{"height":"1 m"}'],
      ['line', 'globe.impactMap.tsunamiContour{"height":"3 m"}'],
      ['line', 'globe.impactMap.tsunamiContour{"height":"6 m"}'],
    ]);
    expect(layer?.notes.map((n) => n.text)).toContain(
      'globe.impactMap.note.tsunamiVeilGlobal{"top":"38 m"}'
    );
    const local = buildImpactLayer(ocean, 'tsunami', {
      ...ctx,
      waveMap: { ...drawn, scope: 'local', veilTop: 10 },
    });
    expect(local?.colorbar?.ticks.map((tick) => tick.label)).toEqual(['1 m', '3 m', '6 m', '10 m']);
    expect(local?.notes.map((n) => n.text)).toContain(
      'globe.impactMap.note.tsunamiVeilLocal{"top":"10 m"}'
    );
  });

  it('says what raised the wave and in how much water', () => {
    const layer = buildImpactLayer(neworleans, 'tsunami', ctx);
    const source = layer?.notes[0]?.text ?? '';
    expect(source).toContain('globe.impactMap.note.tsunamiSourceProgram');
    expect(source).toContain('"depth":"1,17 m"');
    expect(layer?.notes[2]?.text).toBe('globe.impactMap.note.tsunamiLimitLand');
    expect(buildImpactLayer(ocean, 'tsunami', ctx)?.notes[2]?.text).toBe(
      'globe.impactMap.note.tsunamiLimitSea'
    );
  });
});
