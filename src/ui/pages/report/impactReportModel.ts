/**
 * What an impact's report says, in the reader's language (ROADMAP IMP-7c).
 *
 * The page renders this and adds nothing of its own: every label comes from
 * the locales through `t`, every number through `reportFormat.ts`, and every
 * map through the same `availableImpactLayers` the globe draws, so the report
 * cannot tell a scenario differently from the globe, nor in two languages at
 * once (B-110). Pure — the tests run it in both languages.
 */
import type { TFunction } from 'i18next';
import type { CasualtyEstimate } from '../../../physics/casualties.js';
import type { ImpactScenarioResult } from '../../../physics/simulate.js';
import { joulesToMegatons, radiansToDegrees } from '../../../physics/units.js';
import {
  EVIDENCE_QUANTITIES,
  type EvidenceQuantity,
} from '../../../physics/validation/evidenceClasses.js';
import { SHORE_DEPTH_CAP_M } from '../../../physics/validation/shoreDepthRules.js';
import { evidenceText, type EvidenceText } from '../../../scene/globe/evidenceText.js';
import {
  availableImpactLayers,
  isFieldLayer,
  isolineMembers,
  probabilityRadius,
  windReachM,
  WIND_LEVELS_KMH,
  type ImpactLayerId,
  type ImpactMapLayer,
} from '../../../scene/globe/impactFieldMap.js';
import type { Citation } from '../methodologyContent.js';
import { collectImpactCitations } from '../reportCitations.js';
import { impactFormulaBlocks, type ImpactFormulaExtras } from './impactFormulas.js';
import {
  area,
  compassPoint,
  coordinates,
  countryName,
  dateTime,
  duration,
  energyShare,
  fixed,
  length,
  mass,
  meters,
  NONE,
  people,
  peopleOrder,
  percent,
  tnt,
} from './reportFormat.js';

export interface ReportRow {
  id: string;
  label: string;
  value: string;
  /** The figure that draws this quantity, where one does. */
  figure?: number;
  /** What the number can claim (evidence classes, phase 1); absent only on
   *  the scenario's own inputs, which are the reader's, not the model's. */
  evidence?: EvidenceQuantity;
}

export interface ReportGroup {
  id: string;
  title: string;
  rows: ReportRow[];
}

export interface KeyFigure {
  id: string;
  label: string;
  value: string;
  detail: string;
  evidence: EvidenceQuantity;
}

export interface ReportFigure {
  number: number;
  layer: ImpactMapLayer;
}

export interface ReportFormula {
  id: string;
  name: string;
  formula: string;
}

export interface ReportSource {
  /** "Collins, Melosh & Marcus (2005)". */
  header: string;
  /** Why the run cites it, where the run's citation list says so. */
  reason: string | null;
  formulas: ReportFormula[];
  /** The bibliography's line. */
  reference: string;
}

/** The nearest named place to the point of impact, from the city index. */
export interface NearestPlace {
  name: string;
  countryCode: string;
  distanceM: number;
  /** Bearing from the place to the point of impact, degrees from north. */
  bearingDeg: number;
}

export interface ImpactReportContext {
  t: TFunction;
  language: string;
  location: { latitude: number; longitude: number } | null;
  /** When the scenario was evaluated (ms since the epoch). */
  evaluatedAt: number | null;
  /** Fixed in tests; the reader's own zone otherwise. */
  timeZone?: string;
  /** The preset's own name, or null for a scenario of the reader's own. */
  presetName: string | null;
  uncertaintyKey: string | null;
  casualties: CasualtyEstimate | null;
  nearest: NearestPlace | null;
  extras: ImpactFormulaExtras;
}

export interface ImpactReportModel {
  title: string;
  subtitle: string;
  event: string;
  place: string | null;
  generated: string | null;
  keyFigures: KeyFigure[];
  figures: ReportFigure[];
  groups: ReportGroup[];
  /** What each family of numbers rests on, every family, in the table's order. */
  evidence: EvidenceText[];
  sources: ReportSource[];
}

const F = 'report.impact.field';

/** The figure numbers, in the order the atlas prints the layers. */
function figureNumbers(figures: ReportFigure[]): (id: ImpactLayerId) => number | undefined {
  return (id) => figures.find((f) => f.layer.id === id)?.number;
}

function row(
  t: TFunction,
  id: string,
  value: string,
  figure?: number,
  params?: Record<string, string>
): ReportRow {
  return {
    id,
    label: params === undefined ? t(`${F}.${id}`) : t(`${F}.${id}`, params),
    value,
    ...(figure !== undefined && { figure }),
  };
}

function scenarioRows(r: ImpactScenarioResult, ctx: ImpactReportContext): ReportRow[] {
  const { t, language: l } = ctx;
  const input = r.inputs;
  const rows: ReportRow[] = [
    row(t, 'impactorDiameter', length(input.impactorDiameter, l)),
    row(t, 'impactVelocity', `${fixed((input.impactVelocity as number) / 1_000, 1, l)} km/s`),
    row(t, 'impactorDensity', `${fixed(input.impactorDensity, 0, l)} kg/m³`),
    row(t, 'targetDensity', `${fixed(input.targetDensity, 0, l)} kg/m³`),
    row(t, 'impactAngle', `${fixed(radiansToDegrees(input.impactAngle), 0, l)}°`),
  ];
  const water = input.waterDepth as number | undefined;
  if (water !== undefined && water > 0) {
    // On land the depth is the nearest sea's: "the water depth at impact"
    // would put an inland city under the sea (B-044).
    const shore = input.shoreDistance as number | undefined;
    // Where the crater reaches that sea, the depth is the mean of the water
    // within the crater, which is what the wave rises in (rules 798 to 804).
    rows.push(
      shore !== undefined && shore > 0
        ? row(
            t,
            'nearestSea',
            t(
              r.tsunami === undefined
                ? 'report.impact.value.nearestSea'
                : water >= SHORE_DEPTH_CAP_M
                  ? 'report.impact.value.nearestSeaCraterCapped'
                  : 'report.impact.value.nearestSeaCrater',
              {
                distance: length(shore, l),
                depth: length(water, l),
              }
            )
          )
        : row(t, 'waterDepth', length(water, l))
    );
  }
  if ((input.meanOceanDepth as number | undefined) !== undefined) {
    rows.push(row(t, 'meanBasinDepth', length(input.meanOceanDepth as number, l)));
  }
  if (input.impactorStrength !== undefined) {
    rows.push(
      row(t, 'impactorStrength', `${fixed((input.impactorStrength as number) / 1e6, 2, l)} MPa`)
    );
  }
  return rows;
}

function magnitudeLabelId(r: ImpactScenarioResult): string {
  if (r.seismic.magnitudeSource === null) return 'seismicMagnitude';
  return r.seismic.magnitudeSource === 'program'
    ? 'seismicMagnitudeProgram'
    : 'seismicMagnitudeAir';
}

function tsunamiRows(r: ImpactScenarioResult, ctx: ImpactReportContext): ReportRow[] {
  const tsunami = r.tsunami;
  if (tsunami === undefined) return [];
  const { t, language: l } = ctx;
  const program = tsunami.farFieldLaw === 'program';
  const m2 = (v: unknown): string => meters(v as number, 2, l);
  const rows: ReportRow[] = [
    row(t, 'tsunamiCavity', length(tsunami.cavityRadius, l)),
    // The wave the model propagates, no taller than the water it stands in:
    // the program's one water crater out, or the rim wave before 16 September.
    row(
      t,
      program ? 'tsunamiSourceProgram' : 'tsunamiSourceRimWave',
      meters(tsunami.rimWaveSourceAmplitude, 1, l)
    ),
    row(t, 'tsunamiSourceWard', meters(tsunami.sourceAmplitude, 1, l)),
    row(t, 'tsunamiAt1000Ward', m2(tsunami.amplitudeAt1000km)),
    row(t, 'tsunamiAt1000Program', m2(tsunami.amplitudeAt1000kmWunnemann)),
  ];
  if (!program) {
    rows.push(
      row(
        t,
        'tsunamiAt1000Range',
        `${fixed(tsunami.amplitudeAt1000kmLower, 2, l)} – ${m2(tsunami.amplitudeAt1000kmUpper)}`
      )
    );
  }
  const coupling = tsunami.seaCoupling;
  rows.push(
    row(
      t,
      'seaCoupling',
      t(program ? 'report.impact.value.seaCouplingWave' : 'report.impact.value.seaCouplingEnergy', {
        mechanism: t(`report.impact.enum.mechanism.${coupling.mechanism}`),
        shore: length(coupling.shoreDistance as number, l),
        fraction: percent(coupling.fraction, 0, l),
      })
    )
  );
  if (program) {
    rows.push(row(t, 'waterCrater', length(tsunami.farFieldReferenceRadius, l)));
  } else {
    const collapse = tsunami.collapseWaveForms
      ? t('report.impact.value.collapseWave', {
          exponent: fixed(tsunami.collapseWaveExponent, 2, l),
        })
      : '';
    rows.push(
      row(
        t,
        'waveRegime',
        `${fixed(tsunami.depthToImpactorRatio, 2, l)} · ${fixed(tsunami.rimWaveExponent, 2, l)}${collapse}`
      )
    );
  }
  rows.push(row(t, 'tsunamiAt5000Ward', m2(tsunami.amplitudeAt5000km)));
  if (!program) {
    rows.push(
      row(
        t,
        'tsunamiAt5000Range',
        `${fixed(tsunami.amplitudeAt5000kmLower, 2, l)} – ${m2(tsunami.amplitudeAt5000kmUpper)}`
      )
    );
  }
  rows.push(
    row(t, 'tsunamiAt5000Dispersed', m2(tsunami.amplitudeAt5000kmDispersed)),
    row(t, 'runupAt1000', meters(tsunami.runupAt1000km, 1, l)),
    row(t, 'travelTo1000', duration(tsunami.travelTimeTo1000km, l))
  );
  return rows;
}

function groups(
  r: ImpactScenarioResult,
  ctx: ImpactReportContext,
  figures: ReportFigure[]
): ReportGroup[] {
  const { t, language: l } = ctx;
  const fig = figureNumbers(figures);
  const crater = (r.crater.finalDiameter as number) > 0;
  // Every row of a group carries its family's class, unless it names its own.
  const group = (id: string, rows: ReportRow[], evidence?: EvidenceQuantity): ReportGroup => ({
    id,
    title: t(`report.impact.group.${id}`),
    rows:
      evidence === undefined
        ? rows
        : rows.map((one) => (one.evidence === undefined ? { ...one, evidence } : one)),
  });
  const tagged = (one: ReportRow, evidence: EvidenceQuantity): ReportRow => ({ ...one, evidence });

  const body = group('body', [
    tagged(row(t, 'impactorMass', mass(r.impactor.mass, l)), 'energy'),
    tagged(row(t, 'kineticEnergy', tnt(joulesToMegatons(r.impactor.kineticEnergy), l)), 'energy'),
    tagged(row(t, 'entryRegime', t(`report.impact.enum.regime.${r.entry.regime}`)), 'entry'),
    tagged(row(t, 'energyToGround', energyShare(r.entry.energyFractionToGround, l)), 'entry'),
  ]);

  const craterRows = [
    row(t, 'transientCrater', length(r.crater.transientDiameter, l)),
    row(t, 'finalCrater', length(r.crater.finalDiameter, l)),
    row(t, 'craterDepth', length(r.crater.depth, l)),
  ];
  // A morphology is a fact about a crater, and an airburst leaves none (B-045).
  if (crater) {
    craterRows.push(
      row(t, 'craterMorphology', t(`report.impact.enum.morphology.${r.crater.morphology}`))
    );
  }
  craterRows.push(row(t, 'craterRim', length(r.damage.craterRim, l)));

  const blastFigure = fig('overpressure');
  const windFigure = fig('wind');
  const blastRows = [
    row(t, 'overpressure5psi', length(r.damage.overpressure5psi, l), blastFigure),
    row(t, 'overpressure1psi', length(r.damage.overpressure1psi, l), blastFigure),
    row(t, 'lightDamage', length(r.damage.lightDamage, l), blastFigure),
  ];
  if (windFigure !== undefined) {
    for (const kmh of WIND_LEVELS_KMH) {
      const reach = windReachM(r, kmh);
      if (reach > 0) {
        blastRows.push({
          ...row(t, 'windOutTo', length(reach, l), windFigure, {
            speed: `${fixed(kmh, 0, l)} km/h`,
          }),
          id: `windOutTo${kmh.toString()}`,
        });
      }
    }
  }

  const heatFigure = fig('thermal');
  const heat = group(
    'heat',
    [
      row(t, 'thirdDegreeBurn', length(r.damage.thirdDegreeBurn, l), heatFigure),
      row(t, 'secondDegreeBurn', length(r.damage.secondDegreeBurn, l), heatFigure),
      row(t, 'fireIgnition', length(r.firestorm.ignitionRadius, l), heatFigure),
      row(t, 'fireSustain', length(r.firestorm.sustainRadius, l), heatFigure),
      row(t, 'fireIgnitionArea', area(r.firestorm.ignitionArea, l)),
    ],
    'thermal'
  );

  const ejectaFigure = fig('ejecta');
  const ejecta = group(
    'ejecta',
    [
      row(t, 'ejectaEdge1mm', length(r.ejecta.blanketEdge1mm, l), ejectaFigure),
      row(t, 'ejectaEdge1m', length(r.ejecta.blanketEdge1m, l), ejectaFigure),
      row(t, 'ejectaAt2R', meters(r.ejecta.thicknessAt2R, 1, l)),
      row(t, 'ejectaAt10R', meters(r.ejecta.thicknessAt10R, 2, l)),
    ],
    'ejecta'
  );

  const shakingFigure = fig('shaking');
  const range = r.seismic.magnitudeRange;
  const shakingRows = [
    row(
      t,
      magnitudeLabelId(r),
      r.seismic.magnitude === null
        ? t('report.impact.value.magnitudeNone')
        : fixed(r.seismic.magnitude, 1, l)
    ),
    row(
      t,
      'magnitudeRange',
      range === null ? NONE : `${fixed(range.low, 1, l)}–${fixed(range.high, 1, l)}`
    ),
  ];
  const shakingLayer = figures.find((f) => f.layer.id === 'shaking')?.layer;
  for (const line of (shakingLayer?.isolines ?? []).flatMap(isolineMembers)) {
    if (!line.id.split('+')[0]?.startsWith('mercalli-')) continue;
    shakingRows.push({
      ...row(t, 'mercalliOutTo', length(line.radiusM, l), shakingFigure, { level: line.label }),
      id: `mercalliOutTo${line.label}`,
    });
  }
  const liquefaction = r.seismic.liquefactionRadius as number;
  shakingRows.push(
    row(t, 'liquefaction', length(liquefaction, l), liquefaction > 0 ? shakingFigure : undefined)
  );

  const atmosphere = group(
    'atmosphere',
    [
      row(t, 'stratDust', mass(r.atmosphere.stratosphericDust, l)),
      row(t, 'acidRain', mass(r.atmosphere.acidRainMass, l)),
      row(t, 'climateTier', t(`report.impact.enum.climate.${r.atmosphere.climateTier}`)),
    ],
    'atmosphere'
  );

  const out = [
    group('scenario', scenarioRows(r, ctx)),
    body,
    group('crater', craterRows, 'crater'),
    group('blast', blastRows, 'blast'),
    heat,
    ejecta,
    group('shaking', shakingRows, 'seismic'),
    atmosphere,
  ];
  const wave = tsunamiRows(r, ctx);
  if (wave.length > 0) out.push(group('tsunami', wave, 'tsunami'));
  return out;
}

/** The family of each key figure. */
const KEY_EVIDENCE: Readonly<Record<string, EvidenceQuantity>> = {
  energy: 'energy',
  entry: 'entry',
  crater: 'crater',
  magnitude: 'seismic',
  deaths: 'casualties',
};

function keyFigures(r: ImpactScenarioResult, ctx: ImpactReportContext): KeyFigure[] {
  const { t, language: l } = ctx;
  const k = (id: string, value: string, detail: string): KeyFigure => ({
    id,
    label: t(`report.impact.key.${id}`),
    value,
    detail,
    evidence: KEY_EVIDENCE[id] ?? 'energy',
  });
  const regime = r.entry.regime;
  const crater = (r.crater.finalDiameter as number) > 0;
  const range = r.seismic.magnitudeRange;
  const toll = ctx.casualties;
  return [
    k(
      'energy',
      tnt(joulesToMegatons(r.impactor.kineticEnergy), l),
      t('report.impact.key.energyDetail')
    ),
    k(
      'entry',
      t(`report.impact.enum.regime.${regime}`),
      regime === 'INTACT'
        ? t('report.impact.key.entryIntact')
        : t('report.impact.key.entryDetail', {
            share: energyShare(r.entry.energyFractionToGround, l),
            air: energyShare(1 - r.entry.energyFractionToGround, l),
          })
    ),
    k(
      'crater',
      crater ? length(r.crater.finalDiameter, l) : NONE,
      crater
        ? t(
            r.crater.origin === 'craterField'
              ? 'report.impact.key.craterFieldDetail'
              : 'report.impact.key.craterDetail',
            {
              depth: length(r.crater.depth as number, l),
              morphology: t(`report.impact.enum.morphology.${r.crater.morphology}`),
            }
          )
        : t('report.impact.key.craterNone')
    ),
    k(
      'magnitude',
      r.seismic.magnitude === null ? NONE : fixed(r.seismic.magnitude, 1, l),
      range === null
        ? t('report.impact.key.magnitudeNone')
        : t('report.impact.key.magnitudeDetail', {
            low: fixed(range.low, 1, l),
            high: fixed(range.high, 1, l),
          })
    ),
    k(
      'deaths',
      toll === null ? NONE : peopleOrder(toll.deaths, l),
      toll === null
        ? t('report.impact.key.deathsPending')
        : t(
            toll.predictiveBand === true
              ? 'report.impact.key.deathsBand'
              : 'report.impact.key.deathsTable',
            {
              low: people(Math.min(toll.deathsLow, toll.deathsHigh), l),
              high: people(Math.max(toll.deathsLow, toll.deathsHigh), l),
            }
          )
    ),
  ];
}

/** "Collins, Melosh & Marcus" from "Collins, G. S., Melosh, H. J. & Marcus,
 *  R. A.": the surnames, or the first one and "et al." beyond three. */
export function sourceAuthors(authors: string): string {
  const initials = /^([A-Z][a-z]?\.\s*-?\s*)+(Jr\.)?$/;
  const parts = authors
    .split(/,\s*|\s*&\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  // An institution has no initials: "U.S. Congress, Office of Technology
  // Assessment" is one author, not two.
  if (!parts.some((s) => initials.test(s) || s.includes('et al.'))) return authors;
  const surnames = parts.filter((s) => !initials.test(s) && s !== 'et al.');
  if (surnames.length === 0) return authors;
  if (authors.includes('et al.') || surnames.length > 3) return `${surnames[0] ?? ''} et al.`;
  if (surnames.length === 1) return surnames[0] ?? '';
  return `${surnames.slice(0, -1).join(', ')} & ${surnames[surnames.length - 1] ?? ''}`;
}

/** A bibliography line in the reader's language: the reference as it was
 *  published, with the words of service — chapter, edition, editors — and the
 *  quotation marks of the language it is read in. */
export function referenceLine(c: Citation, language: string): string {
  const italian = language.toLowerCase().startsWith('it');
  const service = (s: string): string =>
    italian
      ? s
          .replace(/\bch\. /g, 'cap. ')
          .replace(/\((\d)(st|nd|rd|th) ed\.\)/g, '($1ª ed.)')
          .replace(/\(eds?\.\)/g, '(a cura di)')
      : s;
  const doi = c.doi === undefined ? '' : `  ·  DOI: ${c.doi}`;
  const title = italian ? `«${service(c.title)}».` : `"${c.title}."`;
  return `${c.authors} (${c.year.toString()}). ${title} ${service(c.venue)}${doi}.`;
}

function sources(r: ImpactScenarioResult, ctx: ImpactReportContext): ReportSource[] {
  const { t, language } = ctx;
  const triggers = collectImpactCitations(r);
  const reasonOf = (c: Citation): string | null => {
    const trigger = triggers.find((tr) => tr.citation === c);
    if (trigger === undefined) return null;
    return trigger.reasonKey === undefined
      ? trigger.reason
      : t(trigger.reasonKey, { defaultValue: trigger.reason });
  };
  const blocks = impactFormulaBlocks(r, ctx.extras);
  const out: ReportSource[] = blocks.map((b) => ({
    header: `${sourceAuthors(b.citation.authors)} (${b.citation.year.toString()})`,
    reason: reasonOf(b.citation),
    formulas: b.entries.map((e) => ({
      id: e.id,
      name: t(`methodologyFormula.${e.id}.name`, { defaultValue: e.name }),
      formula: t(`methodologyFormula.${e.id}.formula`, { defaultValue: e.formula }),
    })),
    reference: referenceLine(b.citation, language),
  }));
  // A source the run cites for what it did, with no formula of its own in
  // the catalogue — the pancake of Chyba et al., Chelyabinsk's anchor.
  for (const trigger of triggers) {
    if (blocks.some((b) => b.citation === trigger.citation)) continue;
    out.push({
      header: `${sourceAuthors(trigger.citation.authors)} (${trigger.citation.year.toString()})`,
      reason: reasonOf(trigger.citation),
      formulas: [],
      reference: referenceLine(trigger.citation, language),
    });
  }
  return out;
}

/** The place, as a reader finds it on a map: the coordinates, and how far
 *  and which way from the nearest named place. */
function placeOf(ctx: ImpactReportContext): string | null {
  const { t, language: l, location, nearest } = ctx;
  if (location === null) return null;
  const where = coordinates(location.latitude, location.longitude, l, {
    north: t('report.impact.hemisphere.n'),
    south: t('report.impact.hemisphere.s'),
    east: t('report.impact.hemisphere.e'),
    west: t('report.impact.hemisphere.w'),
  });
  if (nearest === null) return where;
  const country = countryName(nearest.countryCode, l);
  const near = t(country === null ? 'report.impact.near' : 'report.impact.nearCountry', {
    distance: length(nearest.distanceM, l),
    direction: t(`report.impact.compass.${compassPoint(nearest.bearingDeg)}`),
    place: nearest.name,
    country: country ?? '',
  });
  return `${where} — ${near}`;
}

export function buildImpactReport(
  result: ImpactScenarioResult,
  ctx: ImpactReportContext
): ImpactReportModel {
  const { t, language } = ctx;
  // The tsunami's layer is the globe's wave map, which a flat map of the
  // report does not draw; the wave is in the numbers.
  const figures = availableImpactLayers(result, {
    t,
    language,
    uncertaintyKey: ctx.uncertaintyKey,
  })
    .filter((layer) => isFieldLayer(layer.id))
    .map((layer, i) => ({ number: i + 1, layer }));
  const name = ctx.presetName ?? t('report.impact.custom');
  return {
    title: t('report.title'),
    subtitle: t('report.impact.subtitle', { name }),
    event:
      ctx.presetName === null ? t('report.impact.eventCustom') : t('report.impact.event', { name }),
    place: placeOf(ctx),
    generated: ctx.evaluatedAt === null ? null : dateTime(ctx.evaluatedAt, language, ctx.timeZone),
    keyFigures: keyFigures(result, ctx),
    figures,
    groups: groups(result, ctx, figures),
    evidence: EVIDENCE_QUANTITIES.map((q) => evidenceText(q, ctx.t, ctx.language)),
    sources: sources(result, ctx),
  };
}

/** The nearest named place to a point, and the way from it to the point. */
export function nearestPlace(
  cities: readonly { nameEn: string; nameIt: string; lat: number; lon: number; cc: string }[],
  latitude: number,
  longitude: number,
  language: string
): NearestPlace | null {
  const rad = Math.PI / 180;
  const f2 = latitude * rad;
  let best: NearestPlace | null = null;
  for (const c of cities) {
    const f1 = c.lat * rad;
    const dl = (longitude - c.lon) * rad;
    const h = Math.sin((f2 - f1) / 2) ** 2 + Math.cos(f1) * Math.cos(f2) * Math.sin(dl / 2) ** 2;
    const d = 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
    if (best !== null && d >= best.distanceM) continue;
    const bearing =
      (Math.atan2(
        Math.sin(dl) * Math.cos(f2),
        Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl)
      ) /
        rad +
        360) %
      360;
    const italian = language.toLowerCase().startsWith('it') && c.nameIt.length > 0;
    best = {
      name: italian ? c.nameIt : c.nameEn,
      countryCode: c.cc,
      distanceM: d,
      bearingDeg: bearing,
    };
  }
  return best;
}

export interface ThresholdRow {
  key: string;
  label: string;
  kind: 'probability' | 'agreement';
  /** Probability: out to where the threshold is passed nine times in ten,
   *  half the time (the median, the map's own line) and once in ten.
   *  Agreement: where the field's models all agree, the median, and the
   *  farthest any of them reaches. */
  near: string;
  median: string;
  far: string;
  /** The published 1σ of the radius, for a probability. */
  sigma: string;
  unavailable: string | null;
  /** The threshold the map shows. */
  selected: boolean;
}

/** Every threshold of the uncertainty view, for the table under its map:
 *  the globe shows one at a time, the page prints them all. */
export function thresholdRows(layer: ImpactMapLayer, language: string): ThresholdRow[] {
  const u = layer.uncertainty;
  if (u === undefined) return [];
  return u.choices.map((c) => {
    const probability = c.kind === 'probability';
    const at = (p: number): string =>
      c.sigma === undefined ? NONE : length(probabilityRadius(c.medianM, c.sigma, p), language);
    return {
      key: c.key,
      label: c.label,
      kind: c.kind,
      near: probability ? at(0.9) : length(c.lowM ?? 0, language),
      median: length(c.medianM, language),
      far: probability ? at(0.1) : length(c.highM ?? 0, language),
      sigma:
        probability && c.sigma !== undefined ? `±${fixed(c.sigma * 100, 0, language)} %` : NONE,
      unavailable: c.unavailable ?? null,
      selected: c.key === u.selected?.key,
    };
  });
}
