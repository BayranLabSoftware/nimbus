import i18next, { type TFunction } from 'i18next';
import { beforeAll, describe, expect, it } from 'vitest';
import en from '../../../i18n/locales/en.json';
import itLocale from '../../../i18n/locales/it.json';
import {
  IMPACT_PRESETS,
  simulateImpact,
  type ImpactScenarioResult,
} from '../../../physics/simulate.js';
import { degreesToRadians, deg, kgPerM3, m, mps } from '../../../physics/units.js';
import { CITATIONS } from '../methodologyContent.js';
import {
  buildImpactReport,
  nearestPlace,
  referenceLine,
  sourceAuthors,
  thresholdRows,
  type ImpactReportContext,
  type ImpactReportModel,
} from './impactReportModel.js';
import { energyShare } from './reportFormat.js';

const keyOnly = ((key: string) => key) as unknown as TFunction;

async function translator(lng: 'it' | 'en'): Promise<TFunction> {
  const instance = i18next.createInstance();
  await instance.init({
    resources: { en: { translation: en }, it: { translation: itLocale } },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
  return instance.t.bind(instance);
}

function context(
  t: TFunction,
  language: string,
  over: Partial<ImpactReportContext> = {}
): ImpactReportContext {
  return {
    t,
    language,
    location: { latitude: 35.0275, longitude: -111.0225 },
    evaluatedAt: Date.UTC(2026, 8, 22, 8, 37, 55),
    timeZone: 'Europe/Rome',
    presetName: 'Meteor Crater (Barringer)',
    uncertaintyKey: null,
    casualties: null,
    nearest: null,
    extras: { bathymetricTsunami: false, monteCarlo: false, predictiveBand: false },
    ...over,
  };
}

/** Every string the page prints from the model, figures' words included. */
function wordsOf(model: ImpactReportModel): string[] {
  const out = [model.title, model.subtitle, model.event, model.place ?? '', model.generated ?? ''];
  for (const k of model.keyFigures) out.push(k.label, k.value, k.detail);
  for (const g of model.groups) {
    out.push(g.title);
    for (const r of g.rows) out.push(r.label, r.value);
  }
  for (const f of model.figures) {
    const l = f.layer;
    out.push(l.title, l.unit, l.tab);
    for (const n of l.notes) out.push(n.label, n.text);
    for (const c of l.categories) out.push(c.label);
    for (const i of l.isolines) out.push(i.label, i.title, i.description, i.source);
    for (const m of l.colorbar?.marks ?? []) out.push(m.label, m.detail);
    for (const tk of l.colorbar?.ticks ?? []) out.push(tk.label);
  }
  for (const s of model.sources) {
    if (s.reason !== null) out.push(s.reason);
    for (const f of s.formulas) out.push(f.name, f.formula);
  }
  return out;
}

const PRESETS = [
  'METEOR_CRATER',
  'TUNGUSKA',
  'CHICXULUB',
  'CHELYABINSK',
  'SIKHOTE_ALIN_1947',
] as const;
const run = (key: (typeof PRESETS)[number]): ImpactScenarioResult =>
  simulateImpact(IMPACT_PRESETS[key].input);

describe("an impact's report, in the reader's language (IMP-7c)", () => {
  let italian: TFunction;
  let english: TFunction;
  beforeAll(async () => {
    italian = await translator('it');
    english = await translator('en');
  });

  it('takes every label from the locales: with keys for words, only keys and numbers remain', () => {
    for (const key of PRESETS) {
      const model = buildImpactReport(run(key), context(keyOnly, 'en'));
      for (const g of model.groups) {
        expect(g.title).toMatch(/^report\.impact\.group\./);
        for (const r of g.rows) expect(r.label).toMatch(/^report\.impact\.field\./);
      }
      for (const k of model.keyFigures) {
        expect(k.label).toMatch(/^report\.impact\.key\./);
        expect(k.detail).toMatch(/^report\.impact\.key\./);
      }
      expect(model.subtitle).toBe('report.impact.subtitle');
    }
  });

  it('prints no English word in Italian, report and maps alike', async () => {
    const t = italian;
    // Words the report printed in English before (B-110); proper names such
    // as the Earth Impact Effects Program are not on the list.
    const english_ = [
      'away',
      'deep',
      'shore',
      'none',
      'intact',
      'partial',
      'simple',
      'complex',
      'local',
      'regional',
      'crater',
      'radius',
      'thickness',
      'edge',
      'blanket',
      'dust',
      'acid',
      'magnitude',
      'burn',
      'firestorm',
      'ignition',
      'overpressure',
      'wind',
      'velocity',
      'density',
      'angle',
      'energy',
      'fraction',
      'depth',
      'diameter',
      'morphology',
      'tier',
      'coupling',
      'travel',
      'amplitude',
      'liquefaction',
      'damage',
    ];
    const pattern = new RegExp(`\\b(${english_.join('|')})\\b`, 'i');
    await Promise.resolve();
    for (const key of PRESETS) {
      // A preset's name is a proper name ("Meteor Crater"), not a word.
      const name = IMPACT_PRESETS[key].name;
      const words = wordsOf(buildImpactReport(run(key), context(t, 'it', { presetName: name })));
      const offenders = words.map((w) => w.split(name).join('')).filter((w) => pattern.test(w));
      expect(offenders, key).toEqual([]);
    }
  });

  it('writes the same rows in both languages, with each language’s numbers', () => {
    const r = run('METEOR_CRATER');
    const it_ = buildImpactReport(r, context(italian, 'it'));
    const en_ = buildImpactReport(r, context(english, 'en'));
    const ids = (m: ImpactReportModel): string[] =>
      m.groups.flatMap((g) => g.rows.map((row) => row.id));
    expect(ids(it_)).toEqual(ids(en_));
    const value = (m: ImpactReportModel, id: string): string | undefined =>
      m.groups.flatMap((g) => g.rows).find((row) => row.id === id)?.value;
    expect(value(it_, 'impactVelocity')).toBe('12,8 km/s');
    expect(value(en_, 'impactVelocity')).toBe('12.8 km/s');
    expect(value(it_, 'entryRegime')).toBe('si frammenta in aria, colpisce il suolo');
    expect(value(en_, 'entryRegime')).toBe('breaks up in the air, strikes the ground');
    expect(value(it_, 'craterMorphology')).toBe('semplice');
    expect(it_.subtitle).toBe('Impatto cosmico · Meteor Crater (Barringer)');
    expect(it_.generated).toBe('22 settembre 2026 alle ore 10:37 CEST');
  });

  it('never prints the whole energy to the ground beside a break-up in the air', () => {
    // The astrophysicist's review of 22 September 2026: «partial airburst»
    // beside «100 % of the energy to the ground» read as a contradiction. A
    // share is printed to the decimal that keeps it off a whole it is not.
    for (const id of Object.keys(IMPACT_PRESETS) as (keyof typeof IMPACT_PRESETS)[]) {
      const r = simulateImpact(IMPACT_PRESETS[id].input);
      if (r.entry.regime !== 'PARTIAL_AIRBURST') continue;
      const model = buildImpactReport(r, context(english, 'en'));
      const share = model.groups
        .flatMap((g) => g.rows)
        .find((row) => row.id === 'energyToGround')?.value;
      expect(share, id).not.toBe('100 %');
      expect(model.keyFigures.find((k) => k.id === 'entry')?.detail, id).not.toMatch(/^100 %/);
    }
    expect(energyShare(0.9996, 'en')).toBe('> 99.9 %');
    expect(energyShare(0.9951, 'it')).toBe('99,5 %');
    expect(energyShare(0.62, 'en')).toBe('62 %');
    expect(energyShare(0.0004, 'en')).toBe('< 0.1 %');
    expect(energyShare(1, 'en')).toBe('100 %');
    expect(energyShare(0, 'en')).toBe('0 %');
  });

  it('points every row that a map draws to its figure', () => {
    const model = buildImpactReport(run('METEOR_CRATER'), context(keyOnly, 'en'));
    const figureOf = (id: string): number | undefined =>
      model.figures.find((f) => f.layer.id === id)?.number;
    const rows = model.groups.flatMap((g) => g.rows);
    expect(rows.find((r) => r.id === 'overpressure5psi')?.figure).toBe(figureOf('overpressure'));
    expect(rows.find((r) => r.id === 'thirdDegreeBurn')?.figure).toBe(figureOf('thermal'));
    expect(rows.find((r) => r.id === 'ejectaEdge1mm')?.figure).toBe(figureOf('ejecta'));
    expect(rows.filter((r) => r.id.startsWith('windOutTo')).length).toBe(5);
    expect(rows.filter((r) => r.id.startsWith('mercalliOutTo')).map((r) => r.id)).toEqual([
      'mercalliOutToIII',
      'mercalliOutToV',
    ]);
    expect(model.figures.map((f) => f.layer.id)).toEqual([
      'overpressure',
      'lowOverpressure',
      'wind',
      'thermal',
      'ejecta',
      'shaking',
      'uncertainty',
    ]);
  });

  it('places the impact from the nearest named place, in the language', () => {
    const cities = [
      { nameEn: 'Flagstaff', nameIt: '', lat: 35.198, lon: -111.651, cc: 'US' },
      { nameEn: 'Phoenix', nameIt: '', lat: 33.54, lon: -112.07, cc: 'US' },
    ];
    const nearest = nearestPlace(cities, 35.0275, -111.0225, 'it');
    expect(nearest?.name).toBe('Flagstaff');
    const it_ = buildImpactReport(run('METEOR_CRATER'), context(italian, 'it', { nearest }));
    expect(it_.place).toMatch(/— 60,2 km a est-sud-est di Flagstaff \(Stati Uniti\)$/);
    const en_ = buildImpactReport(run('METEOR_CRATER'), context(english, 'en', { nearest }));
    expect(en_.place).toMatch(/— 60\.2 km east-southeast of Flagstaff \(United States\)$/);
  });

  it('prints every threshold of the uncertainty view, the one on the map marked', () => {
    const model = buildImpactReport(run('METEOR_CRATER'), context(english, 'en'));
    const layer = model.figures.find((f) => f.layer.id === 'uncertainty')?.layer;
    expect(layer).toBeDefined();
    const rows = layer === undefined ? [] : thresholdRows(layer, 'en');
    expect(rows.length).toBeGreaterThan(5);
    expect(rows.filter((r) => r.selected)).toHaveLength(1);
    const light = rows.find((r) => r.key === 'lightDamage');
    expect(light?.unavailable).not.toBeNull();
    expect(light?.near).toBe('—');
    const five = rows.find((r) => r.key === 'overpressure5psi');
    expect(five?.median).toBe('8.5 km');
    expect(five?.sigma).toBe('±18 %');
  });

  it('names the sources as their papers do, and the words of service in Italian', () => {
    expect(sourceAuthors(CITATIONS.collins2005.authors)).toBe('Collins, Melosh & Marcus');
    expect(sourceAuthors(CITATIONS.glasstoneDolan1977.authors)).toBe('Glasstone & Dolan');
    expect(sourceAuthors(CITATIONS.ota1979.authors)).toBe(CITATIONS.ota1979.authors);
    expect(sourceAuthors(CITATIONS.toon1997.authors)).toBe('Toon et al.');
    const ota = referenceLine(CITATIONS.ota1979, 'it');
    expect(ota).toContain('cap. II');
    expect(ota).not.toContain('ch. II');
    expect(referenceLine(CITATIONS.glasstoneDolan1977, 'it')).toContain('«');
    expect(referenceLine(CITATIONS.glasstoneDolan1977, 'en')).toContain('"');
  });

  it('prints only what an airburst has', () => {
    const model = buildImpactReport(run('TUNGUSKA'), context(keyOnly, 'en'));
    const ids = model.groups.flatMap((g) => g.rows.map((r) => r.id));
    expect(ids).not.toContain('craterMorphology');
    expect(model.figures.map((f) => f.layer.id)).not.toContain('ejecta');
    const crater = model.keyFigures.find((k) => k.id === 'crater');
    expect(crater?.value).toBe('—');
    expect(crater?.detail).toBe('report.impact.key.craterNone');
  });

  it('rule 1202: prints the azimuth typed in, the breakup and burst altitudes, and the end-of-entry speed — on the panel already, not on this page before', () => {
    const rowValue = (model: ImpactReportModel, id: string): string | undefined =>
      model.groups.flatMap((g) => g.rows).find((r) => r.id === id)?.value;

    // TUNGUSKA: a COMPLETE_AIRBURST with a real burst altitude and a
    // non-zero breakup altitude — both read straight from the same
    // simulation the model built its report from, not re-derived.
    const tunguska = run('TUNGUSKA');
    const tunguskaModel = buildImpactReport(tunguska, context(keyOnly, 'en'));
    expect(rowValue(tunguskaModel, 'burstAltitude')).toBeDefined();
    expect(rowValue(tunguskaModel, 'breakupAltitude')).toBeDefined();
    expect(rowValue(tunguskaModel, 'endVelocity')).toBeDefined();
    expect(rowValue(tunguskaModel, 'impactAzimuthDeg')).toBe('90°N');

    // CHICXULUB: PARTIAL_AIRBURST, the swarm reaching the ground before it
    // spreads wide — it breaks up (breakupAltitude > 0) but never truly
    // bursts (burstAltitude legitimately 0, not absent), which is what
    // the panel's own Esito tab already shows ("Si frammenta, colpisce il
    // suolo").
    const chicxulub = run('CHICXULUB');
    const chicxulubModel = buildImpactReport(chicxulub, context(keyOnly, 'en'));
    expect(chicxulub.entry.regime).toBe('PARTIAL_AIRBURST');
    expect(chicxulub.entry.breakupAltitude as number).toBeGreaterThan(0);
    expect(chicxulub.entry.burstAltitude as number).toBe(0);
    // The exact point rule 1202's own draft got wrong at first: a zero
    // burst altitude is a fact (no airburst happened), not an absent
    // measurement, so it must read "0 m", never the report's NONE glyph
    // (—) that a damage ring of zero radius would.
    expect(rowValue(chicxulubModel, 'burstAltitude')).toBe('0 m');
    expect(rowValue(chicxulubModel, 'breakupAltitude')).toBeDefined();
    expect(rowValue(chicxulubModel, 'breakupAltitude')).not.toBe('—');

    // CHICXULUB's own preset gives no impactAzimuthDeg at all, so
    // chicxulubModel already reads the model's own default (90°),
    // matching ImpactCustomInputs.tsx and simulate.ts.
    expect(rowValue(chicxulubModel, 'impactAzimuthDeg')).toBe('90°N');
  });

  it('rule 1219: a back-solved preset says so where the event is named, and only it', () => {
    const popigai = buildImpactReport(
      simulateImpact(IMPACT_PRESETS.POPIGAI.input),
      context(keyOnly, 'en', { presetName: 'Popigai 35.7 Ma', preset: 'POPIGAI' })
    );
    expect(popigai.event).toContain('report.impact.consistency');
    const tunguska = buildImpactReport(
      run('TUNGUSKA'),
      context(keyOnly, 'en', { presetName: 'Tunguska', preset: 'TUNGUSKA' })
    );
    expect(tunguska.event).not.toContain('report.impact.consistency');
  });

  it("rule 1213: prints G4's verdict, I2's band and the model's configuration, in the reader's language", async () => {
    const rowOf = (model: ImpactReportModel, id: string) =>
      model.groups.flatMap((g) => g.rows).find((r) => r.id === id);
    for (const lng of ['en', 'it'] as const) {
      const t = await translator(lng);
      const model = buildImpactReport(run('TUNGUSKA'), context(t, lng));
      const cell = rowOf(model, 'entryMeasuredCell');
      // The entry's, and translated: no key reaches the page.
      expect(cell?.evidence).toBe('entry');
      expect(cell?.value).not.toContain('measuredCells.');
      // Every preset lies outside the measured cells (G4), so no band follows.
      expect(cell?.value).not.toContain(t('measuredCells.entry.bandLabel'));
      expect(rowOf(model, 'entryAltitudeBand')).toBeUndefined();
      // Every switch at its default: one line that says so.
      expect(model.configuration).toBe(t('report.impact.configurationDefault', { count: 14 }));
    }
  });
});

describe('rule 1031 (e): out of the crater’s domain the report gives no number', () => {
  it('says the toll and the climate tier are not assessable', () => {
    const stone = simulateImpact({
      impactorDiameter: m(0.5),
      impactVelocity: mps(14_000),
      impactorDensity: kgPerM3(3_000),
      targetDensity: kgPerM3(2_700),
      impactAngle: degreesToRadians(deg(22.5)),
      surfaceGravity: 9.806_65,
    });
    expect(stone.crater.state).toBe('outOfDomain');
    const model = buildImpactReport(stone, context(keyOnly, 'en', { presetName: null }));
    const deaths = model.keyFigures.find((k) => k.id === 'deaths');
    expect(deaths?.value).toBe('report.impact.notAssessable');
    const rows = model.groups.flatMap((g) => g.rows);
    expect(rows.find((r) => r.id === 'climateTier')?.value).toBe('report.impact.notAssessable');
    // Rule 1048 (a): the first box and the rows say «non calcolata», never a dash.
    expect(model.keyFigures.find((k) => k.id === 'magnitude')?.value).toBe(
      'report.impact.notComputed'
    );
    expect(rows.find((r) => r.id === 'magnitudeRange')?.value).toBe('report.impact.notComputed');
    expect(rows.find((r) => r.id === 'liquefaction')?.value).toBe('report.impact.notComputed');
    expect(rows.map((r) => r.value)).toContain('report.impact.value.magnitudeOutOfDomain');
  });
});

describe('rule 1056: the report names what the air wave gives and where the law extrapolates', () => {
  it('reads an airburst’s magnitude as the air wave’s exploratory estimate', () => {
    const model = buildImpactReport(run('CHELYABINSK'), context(keyOnly, 'en'));
    expect(model.keyFigures.find((k) => k.id === 'magnitude')?.detail).toBe(
      'report.impact.key.magnitudeAir'
    );
  });

  it('marks the radii past 2 000 km as an extrapolation to a planetary scale', () => {
    const rows = buildImpactReport(run('CHICXULUB'), context(keyOnly, 'en')).groups.flatMap(
      (g) => g.rows
    );
    // Rule 1074: a «†» on the radius, one note at the foot of the group.
    expect(rows.find((r) => r.id === 'lightDamage')?.value).toMatch(/†$/);
    const blast = buildImpactReport(run('CHICXULUB'), context(keyOnly, 'en')).groups.find(
      (g) => g.id === 'blast'
    );
    expect(blast?.footnote).toBe('report.impact.planetaryNote');
    const meteor = buildImpactReport(run('METEOR_CRATER'), context(keyOnly, 'en')).groups.flatMap(
      (g) => g.rows
    );
    expect(meteor.find((r) => r.id === 'lightDamage')?.value).not.toContain('†');
  });
});
