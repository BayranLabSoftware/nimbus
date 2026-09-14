import type { CalibrationAnchor } from './calibrationEnvelope.js';

/**
 * Where the held-out rows sit on the envelope, as data and nothing
 * else.
 *
 * The envelope ships with the application, which asks it how far a
 * scenario is from anything measured. It needs to know these events
 * are measured; it does not need the rows that run them, and importing
 * those would put the validation harness in the bundle. The rows, the
 * rules they came in under and their results are in heldOutEvents.ts.
 */

export const NCEI = 'NCEI/WDS Global Significant Earthquake Database (doi:10.7289/V5TD9V7K)';

export const IVESPA =
  'IVESPA 1.0 (Aubry et al. 2021, J. Volcanol. Geotherm. Res. 417: 107295; data CC0)';

/** Each held-out row's source, written once for the row and its anchor. */
export const HELD_OUT_SOURCES = {
  christchurch: `${NCEI}, event 9779: 185 deaths; USGS usp000huvq, Mww 6.1`,
  kumamoto: `${NCEI}, event 10177: 273 deaths, which include the disaster-related; 49 caused directly by building collapse and landslides (Fire and Disaster Management Agency, 1 July 2016, in Goda et al. 2016, Front. Built Environ. 2: 19); USGS us20005iis, Mww 7.0`,
  kaikoura: `${NCEI}, event 10206: 2 deaths; USGS us1000778i, Mww 7.8`,
  pohang: `${NCEI}, event 10277: no deaths recorded, 90 injured; USGS us2000bnrs, Mww 5.5`,
  durres: `${NCEI}, event 10461: 51 deaths; USGS us70006d0m, Mww 6.4`,
  illapel:
    'DART 32402 (SHOA; 26.743 °S, 73.983 °W, 4 070 m of water, NOAA NDBC), 582 km from the USGS epicentre: a zero-to-crest maximum of 10.9 cm (Heidarzadeh et al. 2016, Geophys. Res. Lett. 43: 643) and 11 cm on the first crest (Tang et al. 2016, Pure Appl. Geophys. 173: 369); USGS us20003k7a, Mww 8.3',
  grimsvotn: `${IVESPA}, GRI2011_01: 7.29 × 10¹¹ kg in 27 h, ash plume top 16 ± 4 km a.s.l., vent at 1 450 m`,
  calbuco: `${IVESPA}, CAL2015_01: 1.01 × 10¹¹ kg in 1.5 h, plume top 20 ± 3 km a.s.l.; CAL2015_02: 2.81 × 10¹¹ kg in 6.12 h, plume top 21 ± 3 km; vent at 2 003 m`,
  fuego:
    'CONRED: 201 dead and 229 missing in the official count (Emisoras Unidas, 3 June 2026); 113 dead (INACIF) and 332 missing (CONRED) on 4 July 2018 (CONRED bulletin 207-2018). Pyroclastic-flow deposits 49 (15.3–84.5) × 10⁶ m³, 11.7 km down the Las Lajas ravine (Ferrés & Escobar Wolf 2018, Table 1); no evacuation zone in force',
  unzen:
    '43 dead or missing, 40 and 3, from the 3 June 1991 flow and its surge (Sugimoto & Nagai 2009, doi:10.15017/13523; Cabinet Office 2007 report, p. 210); the flow deposit 0.6 × 10⁶ m³ (Nakada & Fujii 1993, as given by Shimizu 2022, J. Disaster Res. 17: 768); all 43 inside an evacuation advisory drawn by district',
} as const;

const FIRST_GROUP_HOW =
  "Chosen on 14 September 2026 in docs/ROADMAP.md (M9, move 0) before the model was run on it, and put in the net under the rules in heldOutEvents.ts: after PAGER's 1973–2007 fitting window, not looked at when the ring relations were chosen, inputs from the USGS ComCat origin and moment tensor, record from the NCEI significant-earthquake database, no gate, no re-tuning.";

/** The first group: five earthquake tolls. */
export const HELD_OUT_EARTHQUAKE_ANCHORS: readonly CalibrationAnchor[] = [
  { name: 'Christchurch 2011', value: 6.1, source: HELD_OUT_SOURCES.christchurch },
  { name: 'Kumamoto 2016', value: 7.0, source: HELD_OUT_SOURCES.kumamoto },
  { name: 'Kaikōura 2016', value: 7.8, source: HELD_OUT_SOURCES.kaikoura },
  { name: 'Pohang 2017', value: 5.5, source: HELD_OUT_SOURCES.pohang },
  { name: 'Durrës (Albania) 2019', value: 6.4, source: HELD_OUT_SOURCES.durres },
].map(
  ({ name, value, source }): CalibrationAnchor => ({
    name,
    eventType: 'earthquake',
    value,
    quantities: ['toll'],
    gated: [],
    source,
    use: { toll: { role: 'heldOut', how: FIRST_GROUP_HOW } },
  })
);

/**
 * The second group: a wave at a buoy, three plume phases and two
 * volcanic tolls, written down before the model was run on them under
 * rules 7 to 10 of heldOutEvents.ts. Not yet in the net: the commit
 * that puts them there comes after the one that fixes them.
 */
export const HELD_OUT_SECOND_GROUP_ANCHORS: readonly CalibrationAnchor[] = [
  {
    name: 'Illapel 2015',
    eventType: 'earthquake',
    value: 8.3,
    quantities: ['wave'],
    gated: [],
    source: HELD_OUT_SOURCES.illapel,
    use: {
      wave: {
        role: 'heldOut',
        how: 'Chosen in docs/ROADMAP.md (M9, move 0) as a megathrust the coupling was not tuned on, and put in the net under rule 7 of heldOutEvents.ts before the model was run on it: inputs from the USGS ComCat origin and moment tensor, the buoy where NOAA lists it, the record from two published readings, a factor of two either way fixed before the run, no gate, no re-tuning.',
      },
    },
  },
  {
    name: 'Grímsvötn 2011',
    eventType: 'volcano',
    value: 7.29e8,
    quantities: ['plume'],
    gated: [],
    source: HELD_OUT_SOURCES.grimsvotn,
    use: {
      plume: {
        role: 'heldOut',
        how: 'After the eruptions Mastin et al. 2009 fitted, and put in the net under rule 8 of heldOutEvents.ts: IVESPA’s independently estimated mass, duration and height for every phase, no gate, no re-tuning. Not blind — the one-line relation was computed on these numbers while the sources were read — and the rule taking every phase whatever it reads is what keeps it a check.',
      },
    },
  },
  {
    name: 'Calbuco 2015',
    eventType: 'volcano',
    value: 4.24e8,
    quantities: ['plume'],
    gated: [],
    source: HELD_OUT_SOURCES.calbuco,
    use: {
      plume: {
        role: 'heldOut',
        how: 'After the eruptions Mastin et al. 2009 fitted, and put in the net under rule 8 of heldOutEvents.ts: IVESPA’s independently estimated mass, duration and height for both phases, no gate, no re-tuning. Not blind — the one-line relation was computed on these numbers while the sources were read — and the rule taking every phase whatever it reads is what keeps it a check.',
      },
    },
  },
  {
    name: 'Fuego 2018',
    eventType: 'volcano',
    value: 4.9e7,
    quantities: ['toll'],
    gated: [],
    source: HELD_OUT_SOURCES.fuego,
    use: {
      toll: {
        role: 'heldOut',
        how: 'Chosen in docs/ROADMAP.md (M9, move 0) as an eruption no volcanic constant was set on, and put in the net under rule 9 of heldOutEvents.ts before the model was run on it: the deposits’ volume, no evacuation radius because none was in force, the record from the official counts, no gate, no re-tuning.',
      },
    },
  },
  {
    name: 'Unzen 1991',
    eventType: 'volcano',
    value: 6e5,
    quantities: ['toll'],
    gated: [],
    source: HELD_OUT_SOURCES.unzen,
    use: {
      toll: {
        role: 'heldOut',
        how: 'Chosen in docs/ROADMAP.md (M9, move 0) as an eruption no volcanic constant was set on, and put in the net under rule 9 of heldOutEvents.ts before the model was run on it: the flow deposit’s volume, no evacuation radius because the advisory was drawn by district, the record from the police count as published, no gate, no re-tuning.',
      },
    },
  },
];
