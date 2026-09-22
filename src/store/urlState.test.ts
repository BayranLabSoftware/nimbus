import { beforeEach, describe, expect, it } from 'vitest';
import { EARTHQUAKE_PRESETS } from '../physics/events/earthquake/index.js';
import { EXPLOSION_PRESETS } from '../physics/events/explosion/index.js';
import { LANDSLIDE_PRESETS } from '../physics/events/landslide/index.js';
import { VOLCANO_PRESETS } from '../physics/events/volcano/index.js';
import { IMPACT_PRESETS } from '../physics/simulate.js';
import {
  applyIntentToStore,
  decodeSearchParamsToIntent,
  decodeUrl,
  encodeStateToSearchParams,
  knownUrlKeys,
  projectSyncableState,
  URL_KEYS,
  URL_STATE_VERSION,
} from './urlState.js';
import type { AppStore } from './useAppStore.js';
import { CLOSE_UP_VIEW_ENABLED, resetAppStore, useAppStore } from './useAppStore.js';

beforeEach(() => {
  resetAppStore();
});

describe('encodeStateToSearchParams', () => {
  it('emits the baseline Chicxulub impact URL', () => {
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.version)).toBe(URL_STATE_VERSION.toString());
    expect(params.get(URL_KEYS.eventType)).toBe('impact');
    expect(params.get(URL_KEYS.preset)).toBe('CHICXULUB');
    // Landing mode is the default — don't put it in the URL.
    expect(params.get(URL_KEYS.mode)).toBeNull();
    // No location picked yet.
    expect(params.get(URL_KEYS.latitude)).toBeNull();
  });

  it('includes location and non-landing mode when set', () => {
    useAppStore.getState().setLocation({ latitude: 21.3, longitude: -89.5 });
    useAppStore.getState().setMode('globe');
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.latitude)).toBe('21.3');
    expect(params.get(URL_KEYS.longitude)).toBe('-89.5');
    expect(params.get(URL_KEYS.mode)).toBe('globe');
  });

  it('encodes an earthquake preset', () => {
    useAppStore.getState().selectPreset('TOHOKU_2011');
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.eventType)).toBe('earthquake');
    expect(params.get(URL_KEYS.preset)).toBe('TOHOKU_2011');
  });

  it('encodes a volcano preset', () => {
    useAppStore.getState().selectPreset('KRAKATAU_1883');
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.eventType)).toBe('volcano');
    expect(params.get(URL_KEYS.preset)).toBe('KRAKATAU_1883');
  });

  it('serialises CUSTOM impact overrides in short keys', () => {
    useAppStore.getState().setImpactInput({ impactorDiameter: 1_200, impactAngle: 30 });
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.preset)).toBe('CUSTOM');
    expect(params.get(URL_KEYS.diameter)).toBe('1200');
    // impactAngle round-trips via degrees → radians → degrees within trim precision.
    expect(Number(params.get(URL_KEYS.angleDeg))).toBeCloseTo(30, 2);
  });
});

describe('decodeSearchParamsToIntent', () => {
  it('parses a standard impact URL', () => {
    const params = new URLSearchParams(
      `?${URL_KEYS.version}=1&${URL_KEYS.eventType}=impact&${URL_KEYS.preset}=TUNGUSKA&${URL_KEYS.latitude}=45.9&${URL_KEYS.longitude}=7.9&${URL_KEYS.mode}=globe`
    );
    const intent = decodeSearchParamsToIntent(params);
    expect(intent.eventType).toBe('impact');
    expect(intent.preset).toBe('TUNGUSKA');
    expect(intent.location).toEqual({ latitude: 45.9, longitude: 7.9 });
    expect(intent.mode).toBe('globe');
  });

  it('drops invalid preset ids silently', () => {
    const params = new URLSearchParams(
      `?${URL_KEYS.eventType}=impact&${URL_KEYS.preset}=MADE_UP_PRESET`
    );
    expect(decodeSearchParamsToIntent(params).preset).toBeNull();
  });

  it('rejects out-of-range lat/lon', () => {
    const params = new URLSearchParams(`?${URL_KEYS.latitude}=200&${URL_KEYS.longitude}=0`);
    expect(decodeSearchParamsToIntent(params).location).toBeNull();
  });

  it('ignores unknown event types', () => {
    const params = new URLSearchParams(`?${URL_KEYS.eventType}=supernova`);
    expect(decodeSearchParamsToIntent(params).eventType).toBeNull();
  });

  it('parses CUSTOM impact inputs when preset=CUSTOM, with Earth gravity when the link omits it', () => {
    const params = new URLSearchParams(
      `?${URL_KEYS.eventType}=impact&${URL_KEYS.preset}=CUSTOM&${URL_KEYS.diameter}=500&${URL_KEYS.velocity}=18000&${URL_KEYS.angleDeg}=60&${URL_KEYS.impactorDensity}=7800&${URL_KEYS.targetDensity}=2500&${URL_KEYS.impactorStrength}=5e7&${URL_KEYS.impactAzimuthDeg}=200`
    );
    const intent = decodeSearchParamsToIntent(params);
    expect(intent.preset).toBe('CUSTOM');
    expect(intent.customInput).toEqual({
      type: 'impact',
      raw: {
        impactorDiameter: 500,
        impactVelocity: 18_000,
        impactAngleDeg: 60,
        impactorDensity: 7_800,
        targetDensity: 2_500,
        impactorStrength: 5e7,
        impactAzimuthDeg: 200,
        surfaceGravity: 9.806_65,
      },
    });
  });

  it('drops CUSTOM overrides when preset is a named one', () => {
    const params = new URLSearchParams(
      `?${URL_KEYS.eventType}=impact&${URL_KEYS.preset}=CHICXULUB&${URL_KEYS.diameter}=500`
    );
    expect(decodeSearchParamsToIntent(params).customInput).toBeNull();
  });
});

describe('decodeUrl', () => {
  it('parses a full URL string', () => {
    const intent = decodeUrl('https://example.com/?t=impact&p=TUNGUSKA&m=globe');
    expect(intent.eventType).toBe('impact');
    expect(intent.preset).toBe('TUNGUSKA');
    expect(intent.mode).toBe('globe');
  });

  it('returns a null-filled intent on malformed URLs', () => {
    const intent = decodeUrl('not a url');
    expect(intent.eventType).toBeNull();
    expect(intent.preset).toBeNull();
  });
});

describe('applyIntentToStore', () => {
  it('applies each field via the typed store actions', () => {
    applyIntentToStore(
      {
        eventType: 'earthquake',
        preset: 'NORTHRIDGE_1994',
        location: { latitude: 34.2, longitude: -118.5 },
        mode: 'globe',
        simTime: null,
        customInput: null,
        impactThreshold: null,
      },
      useAppStore.getState()
    );
    const s = useAppStore.getState();
    expect(s.eventType).toBe('earthquake');
    expect(s.earthquake.preset).toBe('NORTHRIDGE_1994');
    expect(s.location).toEqual({ latitude: 34.2, longitude: -118.5 });
    expect(s.mode).toBe('globe');
  });

  it('restores a CUSTOM impact wholesale, and an incomplete one not at all', () => {
    const impact = {
      impactorDiameter: 250,
      impactVelocity: 17_000,
      impactAngleDeg: 45,
      impactorDensity: 3_000,
      targetDensity: 2_500,
      surfaceGravity: 9.806_65,
    };
    applyIntentToStore(
      {
        eventType: 'impact',
        preset: 'CUSTOM',
        location: null,
        mode: null,
        simTime: null,
        customInput: { type: 'impact', raw: impact },
        impactThreshold: null,
      },
      useAppStore.getState()
    );
    const s = useAppStore.getState();
    expect(s.impact.preset).toBe('CUSTOM');
    expect(s.impact.input.impactorDiameter as number).toBe(250);
    expect(s.impact.input.impactAngle as number).toBeCloseTo(Math.PI / 4, 12);
    // Nothing of the preset it replaced survives in it.
    expect(s.impact.input).not.toHaveProperty('waterDepth');

    // Until 18 September 2026 a link without the densities was dropped
    // wholesale — "no impactor to rebuild" — and the app ran its own scenario
    // while the report printed it as the link's (B-048 of
    // docs/BUG_REGISTRY.md). A link is now rebuilt from what it says, with the
    // app's own value for the fields the validator insists on, and the page
    // says which those were.
    resetAppStore();
    const before = useAppStore.getState().impact;
    applyIntentToStore(
      {
        eventType: 'impact',
        preset: 'CUSTOM',
        location: null,
        mode: null,
        simTime: null,
        customInput: {
          type: 'impact',
          raw: { impactorDiameter: 500, impactVelocity: 18_000, impactAngleDeg: 60 },
        },
        impactThreshold: null,
      },
      useAppStore.getState()
    );
    const rebuilt = useAppStore.getState();
    expect(rebuilt.impact.input.impactorDiameter as number).toBe(500);
    expect(rebuilt.impact.input.impactVelocity as number).toBe(18_000);
    expect(rebuilt.impact.input.impactorDensity).toBe(before.input.impactorDensity);
    expect(rebuilt.impact.input.targetDensity).toBe(before.input.targetDensity);
    expect(rebuilt.linkNotice).toMatch(/did not say/);
  });
});

describe('round trip: store → encode → decode → apply', () => {
  it('restores the exact same preset-level state', () => {
    useAppStore.getState().selectPreset('TAMBORA_1815');
    useAppStore.getState().setLocation({ latitude: -8.25, longitude: 118 });
    useAppStore.getState().setMode('globe');

    const urlParams = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(urlParams), useAppStore.getState());

    const s = useAppStore.getState();
    expect(s.eventType).toBe('volcano');
    expect(s.volcano.preset).toBe('TAMBORA_1815');
    expect(s.location).toEqual({ latitude: -8.25, longitude: 118 });
    expect(s.mode).toBe('globe');
  });
});

describe('custom explosion inputs in the URL', () => {
  it('writes every field a custom burst carries, the depth of burst as a negative height', () => {
    useAppStore.getState().selectPreset('ONE_MEGATON');
    useAppStore.getState().setExplosionInput({
      yieldMegatons: 2.5,
      heightOfBurst: -40,
      windSpeed: 12,
      windDirectionDeg: 270,
    });
    const p = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(p.get(URL_KEYS.eventType)).toBe('explosion');
    expect(p.get(URL_KEYS.preset)).toBe('CUSTOM');
    expect(p.get(URL_KEYS.yieldMegatons)).toBe('2.5');
    expect(p.get(URL_KEYS.heightOfBurst)).toBe('-40');
    expect(p.get(URL_KEYS.groundType)).toBe('FIRM_GROUND');
    expect(p.get(URL_KEYS.windSpeed)).toBe('12');
    expect(p.get(URL_KEYS.windDirectionDeg)).toBe('270');
    expect(p.get(URL_KEYS.chargeType)).toBeNull();
  });

  it('writes nothing custom for a named preset', () => {
    useAppStore.getState().selectPreset('HIROSHIMA_1945');
    const p = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(p.get(URL_KEYS.preset)).toBe('HIROSHIMA_1945');
    expect(p.get(URL_KEYS.yieldMegatons)).toBeNull();
    expect(p.get(URL_KEYS.heightOfBurst)).toBeNull();
  });

  it('reads them back, and drops what no burst could be', () => {
    const intent = decodeSearchParamsToIntent(
      new URLSearchParams('t=explosion&p=CUSTOM&y=0.02&h=-27&gt=WET_SOIL&ws=5&wdir=90&ct=chemical')
    );
    expect(intent.preset).toBe('CUSTOM');
    expect(intent.customInput).toEqual({
      type: 'explosion',
      raw: {
        yieldMegatons: 0.02,
        heightOfBurst: -27,
        groundType: 'WET_SOIL',
        windSpeed: 5,
        windDirectionDeg: 90,
        chargeType: 'chemical',
      },
    });
    const nonsense = decodeSearchParamsToIntent(
      new URLSearchParams('t=explosion&p=CUSTOM&y=-1&h=-20000&gt=MUD&ws=-3&ct=antimatter')
    );
    expect(nonsense.customInput).toBeNull();
    // A named preset keeps its own inputs, whatever the link adds.
    expect(
      decodeSearchParamsToIntent(new URLSearchParams('t=explosion&p=HIROSHIMA_1945&y=50'))
        .customInput
    ).toBeNull();
  });

  it('rebuilds the same input object a sender had, charge type and all', () => {
    // A custom burst derived from Beirut: chemical, placed under the
    // water, with wind. The recipient's store has to end up with the
    // identical object, because the predictive band is seeded on it.
    useAppStore.getState().selectPreset('BEIRUT_2020');
    useAppStore.getState().setExplosionInput({
      yieldMegatons: 0.001,
      heightOfBurst: -5,
      windSpeed: 8,
      windDirectionDeg: 45,
    });
    const sent = JSON.stringify(useAppStore.getState().explosion.input);
    expect(JSON.parse(sent)).toMatchObject({ chargeType: 'chemical', windSpeed: 8 });

    const p = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(p), useAppStore.getState());

    const s = useAppStore.getState();
    expect(s.eventType).toBe('explosion');
    expect(s.explosion.preset).toBe('CUSTOM');
    expect(JSON.stringify(s.explosion.input)).toBe(sent);
  });
});

describe('knownUrlKeys', () => {
  it('lists every key currently supported by the schema', () => {
    expect(knownUrlKeys()).toEqual(Object.values(URL_KEYS));
  });
});

describe('impact close-up mode in the URL', () => {
  it('lands on the globe while the close-up is off, so an old link still opens', () => {
    const intent = decodeSearchParamsToIntent(
      new URLSearchParams('t=explosion&p=HIROSHIMA_1945&lat=27.89&lon=-81.59&m=impact')
    );
    expect(intent.mode).toBe(CLOSE_UP_VIEW_ENABLED ? 'impact' : 'globe');
    // Whatever the flag says, the rest of the link survives intact.
    expect(intent.preset).toBe('HIROSHIMA_1945');
    expect(intent.location?.latitude).toBeCloseTo(27.89, 6);
  });

  it('round-trips through encode → decode', () => {
    const params = encodeStateToSearchParams({
      ...projectSyncableState(useAppStore.getState()),
      mode: 'impact',
    });
    expect(params.get(URL_KEYS.mode)).toBe('impact');
    expect(decodeSearchParamsToIntent(params).mode).toBe(
      CLOSE_UP_VIEW_ENABLED ? 'impact' : 'globe'
    );
  });

  it('still rejects a mode that does not exist', () => {
    expect(decodeSearchParamsToIntent(new URLSearchParams('m=nonsense')).mode).toBeNull();
  });
});

describe('custom earthquakes, volcanoes and landslides in the URL', () => {
  /** Edit a preset in the panel's way, share it, open the link in a
   *  fresh store, and require the identical input object back. */
  const roundTrip = (edit: () => void, read: () => unknown): { sent: string; received: string } => {
    edit();
    const sent = JSON.stringify(read());
    const p = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(p), useAppStore.getState());
    return { sent, received: JSON.stringify(read()) };
  };

  it('an earthquake keeps its rupture, its strike and a basin with no warning system', () => {
    const { sent, received } = roundTrip(
      () => {
        useAppStore.getState().selectPreset('SUMATRA_2004');
        useAppStore.getState().setEarthquakeInput({ magnitude: 9.0, depth: 25_000 });
      },
      () => useAppStore.getState().earthquake.input
    );
    const input = JSON.parse(sent) as Record<string, unknown>;
    // Infinity serialises as null; what matters is that it came back.
    expect(input.ruptureLengthOverride).toBe(1_300_000);
    expect(useAppStore.getState().earthquake.input.warningIssueS).toBe(Number.POSITIVE_INFINITY);
    expect(useAppStore.getState().earthquake.preset).toBe('CUSTOM');
    expect(received).toBe(sent);
  });

  it('a volcano keeps its flank collapse, its lateral blast, its wind and its cleared zone', () => {
    const krakatau = roundTrip(
      () => {
        useAppStore.getState().selectPreset('KRAKATAU_1883');
        useAppStore.getState().setVolcanoInput({ windSpeed: 25, windDirectionDegrees: 300 });
      },
      () => useAppStore.getState().volcano.input
    );
    expect(krakatau.received).toBe(krakatau.sent);
    expect(useAppStore.getState().volcano.input.flankCollapse).toBeDefined();

    resetAppStore();
    const stHelens = roundTrip(
      () => {
        useAppStore.getState().selectPreset('MT_ST_HELENS_1980');
        useAppStore.getState().setVolcanoInput({ evacuationRadiusM: 12_000 });
      },
      () => useAppStore.getState().volcano.input
    );
    expect(stHelens.received).toBe(stHelens.sent);
    expect(useAppStore.getState().volcano.input.lateralBlast).toBeDefined();
  });

  it('a landslide keeps its confined basin and its regime', () => {
    const { sent, received } = roundTrip(
      () => {
        useAppStore.getState().selectPreset('VAIONT_1963');
        useAppStore.getState().setLandslideInput({ volumeM3: 3e8 });
      },
      () => useAppStore.getState().landslide.input
    );
    expect(JSON.parse(sent)).toMatchObject({ confinedBasinArea: 3e6, regime: 'subaerial' });
    expect(received).toBe(sent);
  });

  it('a landslide keeps the density, footprint and basin amplification the panel set', () => {
    let params = new URLSearchParams();
    const { sent, received } = roundTrip(
      () => {
        useAppStore.getState().selectEventType('landslide');
        useAppStore.getState().selectPreset('VAIONT_1963');
        useAppStore.getState().setLandslideInput({
          slideDensity: 2_650,
          slideFootprintArea: 1.5e6,
          confinementDynamicFactor: 2.5,
          regime: 'submarine',
        });
        params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
      },
      () => useAppStore.getState().landslide.input
    );
    expect(params.get(URL_KEYS.slideDensity)).toBe('2650');
    expect(params.get(URL_KEYS.slideFootprintArea)).toBe('1500000');
    expect(params.get(URL_KEYS.confinedBasinArea)).toBe('3000000');
    expect(params.get(URL_KEYS.confinementDynamicFactor)).toBe('2.5');
    expect(params.get(URL_KEYS.slideRegime)).toBe('submarine');
    expect(received).toBe(sent);
  });

  it('a landslide keeps the thickness, width, speed and drop the impulse wave manual wants', () => {
    // The model read all four before 17 September 2026 and the validator
    // copied none, so no edit and no link could keep one.
    let params = new URLSearchParams();
    const { sent, received } = roundTrip(
      () => {
        useAppStore.getState().selectEventType('landslide');
        useAppStore.getState().selectPreset('LITUYA_BAY_1958');
        useAppStore.getState().setLandslideInput({
          slideThicknessM: 92,
          slideWidthM: 823,
          impactVelocityMS: 110,
          dropHeightM: 610,
        });
        params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
      },
      () => useAppStore.getState().landslide.input
    );
    expect(params.get(URL_KEYS.slideThicknessM)).toBe('92');
    expect(params.get(URL_KEYS.slideWidthM)).toBe('823');
    expect(params.get(URL_KEYS.slideImpactVelocityMS)).toBe('110');
    expect(params.get(URL_KEYS.slideDropHeightM)).toBe('610');
    expect(JSON.parse(sent)).toMatchObject({
      slideThicknessM: 92,
      slideWidthM: 823,
      impactVelocityMS: 110,
      dropHeightM: 610,
    });
    expect(received).toBe(sent);
    // And an empty field takes the measure away again.
    useAppStore.getState().setLandslideInput({ slideThicknessM: null });
    expect(useAppStore.getState().landslide.input.slideThicknessM).toBeUndefined();
  });

  it('reads a hand-written link, and a link it cannot use leaves the preset alone', () => {
    const intent = decodeSearchParamsToIntent(
      new URLSearchParams('t=earthquake&p=CUSTOM&mw=7.1&dep=12000&ft=reverse&si=0&wi=none')
    );
    expect(intent.customInput).toEqual({
      type: 'earthquake',
      raw: {
        magnitude: 7.1,
        depth: 12_000,
        faultType: 'reverse',
        subductionInterface: false,
        warningIssueS: Number.POSITIVE_INFINITY,
      },
    });
    // A magnitude below zero is dropped, and without one the store has
    // nothing valid to restore: the earthquake keeps its preset.
    applyIntentToStore(
      decodeSearchParamsToIntent(new URLSearchParams('t=earthquake&p=CUSTOM&mw=-2')),
      useAppStore.getState()
    );
    expect(useAppStore.getState().earthquake.preset).not.toBe('CUSTOM');
  });
});

describe('every preset, edited in the panel and shared', () => {
  // A basin with no warning system holds Infinity, which JSON would
  // write as null and so hide a link that lost it.
  const serialise = (v: unknown): string =>
    JSON.stringify(v, (_key, x: unknown) => (x === Number.POSITIVE_INFINITY ? 'Infinity' : x));
  const fieldPaths = (v: unknown, prefix = ''): string[] =>
    typeof v === 'object' && v !== null
      ? Object.entries(v).flatMap(([k, x]) => fieldPaths(x, `${prefix}${k}.`))
      : [prefix.slice(0, -1)];
  const store = (): AppStore => useAppStore.getState();

  const cases = [
    ...Object.entries(IMPACT_PRESETS).map(([id, p]) => ({
      type: 'impact' as const,
      id,
      preset: p.input,
      edit: () => store().setImpactInput({}),
    })),
    ...Object.entries(EXPLOSION_PRESETS).map(([id, p]) => ({
      type: 'explosion' as const,
      id,
      preset: p.input,
      edit: () => store().setExplosionInput({}),
    })),
    ...Object.entries(EARTHQUAKE_PRESETS).map(([id, p]) => ({
      type: 'earthquake' as const,
      id,
      preset: p.input,
      edit: () => store().setEarthquakeInput({}),
    })),
    ...Object.entries(VOLCANO_PRESETS).map(([id, p]) => ({
      type: 'volcano' as const,
      id,
      preset: p.input,
      edit: () => store().setVolcanoInput({}),
    })),
    ...Object.entries(LANDSLIDE_PRESETS).map(([id, p]) => ({
      type: 'landslide' as const,
      id,
      preset: p.input,
      edit: () => store().setLandslideInput({}),
    })),
  ];

  it.each(cases)('$type $id keeps every field it carried, and its link rebuilds it', (c) => {
    // The panel's way: the tab first, then the preset from its list.
    store().selectEventType(c.type);
    store().selectPreset(c.id as Parameters<AppStore['selectPreset']>[0]);
    expect(store().eventType).toBe(c.type);
    c.edit();
    expect(store()[c.type].preset).toBe('CUSTOM');
    const sent = store()[c.type].input;
    // The validator is what the store keeps: a field it does not copy
    // is gone at the first edit, silently.
    expect(fieldPaths(sent)).toEqual(expect.arrayContaining(fieldPaths(c.preset)));

    const params = encodeStateToSearchParams(projectSyncableState(store()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(params), store());
    expect(store().eventType).toBe(c.type);
    expect(serialise(store()[c.type].input)).toBe(serialise(sent));
  });

  it('a custom iron impactor keeps its strength and its azimuth', () => {
    // Until 14 September 2026 an impact link carried seven fields and
    // laid them over the recipient's own input: an iron body shared
    // from Meteor Crater arrived with Chicxulub's strength, which is to
    // say a different entry regime, and pointing the other way.
    store().selectPreset('METEOR_CRATER');
    store().setImpactInput({ impactorDiameter: 60, impactAzimuthDeg: 200, impactAngle: 37.5 });
    const sent = store().impact.input;
    expect(sent.impactorStrength).toBeDefined();

    const params = encodeStateToSearchParams(projectSyncableState(store()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(params), store());
    const received = store().impact.input;
    expect(store().impact.preset).toBe('CUSTOM');
    expect(received.impactorStrength).toBe(sent.impactorStrength);
    expect(received.impactAzimuthDeg).toBe(200);
    expect(received.impactAngle).toBe(sent.impactAngle);
    expect(serialise(received)).toBe(serialise(sent));
  });

  it('a named landslide preset that shares its id with a volcano opens as the landslide', () => {
    store().selectEventType('landslide');
    store().selectPreset('ANAK_KRAKATAU_2018');
    const params = encodeStateToSearchParams(projectSyncableState(store()));
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(params), store());
    expect(store().eventType).toBe('landslide');
    expect(store().landslide.preset).toBe('ANAK_KRAKATAU_2018');
  });
});

describe("an impact's uncertainty threshold in the link (IMP-7c)", () => {
  it('carries the threshold of the report and the globe, and reads it back', () => {
    const store = useAppStore.getState();
    store.setMode('report');
    store.setImpactUncertaintyKey('overpressure1psi');
    const params = encodeStateToSearchParams(projectSyncableState(useAppStore.getState()));
    expect(params.get(URL_KEYS.impactThreshold)).toBe('overpressure1psi');
    resetAppStore();
    applyIntentToStore(decodeSearchParamsToIntent(params), useAppStore.getState());
    expect(useAppStore.getState().impactUncertaintyKey).toBe('overpressure1psi');
  });

  it('keeps it out of a link that has no map to read it, and refuses what is not a key', () => {
    const store = useAppStore.getState();
    store.setImpactUncertaintyKey('overpressure1psi');
    // The landing page draws no map.
    expect(
      encodeStateToSearchParams(projectSyncableState(useAppStore.getState())).get(
        URL_KEYS.impactThreshold
      )
    ).toBeNull();
    expect(decodeUrl('/?t=impact&p=TUNGUSKA&thr=%3Cscript%3E').impactThreshold).toBeNull();
    expect(
      decodeUrl('/?t=earthquake&p=NORTHRIDGE_1994&thr=overpressure1psi').impactThreshold
    ).toBeNull();
    expect(decodeUrl('/?t=impact&p=TUNGUSKA&thr=lightDamage').impactThreshold).toBe('lightDamage');
  });
});
