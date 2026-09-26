/**
 * Rule 1158's register — round 2's reconnaissance of candidates for the fourth
 * set, begun on 24 September 2026, evening, after rule 1161 was pushed
 * (1f88ea8), on Andrea's word: titles, abstracts and metadata only, from the
 * open catalogue OpenAlex (`scripts/fourth-set-reconnaissance.ts`, and a search
 * by name); no file downloaded, no paper opened. This is an inventory, not the
 * set: the list and its exclusions are frozen, and each source pinned by its
 * file's hash, only in the final preparation dossier, after Andrea's leave for
 * the downloads.
 *
 * The analyst's exposure was kept small: no abstract was printed or stored;
 * the script kept only flags of what each abstract mentions and whether it
 * shows a number that could be a target — an altitude in km, a mass, a
 * pressure — never the number. Where it does, the observable is registered as
 * exposed: it is not blind because the paper stayed closed (rule 1158). A
 * second exposure cannot be ruled out and is declared: the analyst's general
 * knowledge of widely reported events (marked `widelyReported`).
 *
 * Nothing here was chosen because the branch should reproduce it; the
 * candidates are every instrumented fall the searches returned that the
 * repository has not read, weak ones included and marked.
 */

/** What an abstract mentions (never the values). */
export type Mention =
  | 'trajectory'
  | 'lightCurve'
  | 'flare'
  | 'deposition'
  | 'fragmentation'
  | 'recovery'
  | 'infrasound'
  | 'radar';

/** A number an abstract shows that could be a target: registered as exposed. */
export type Exposed = 'altitudeKm' | 'mass' | 'pressure';

export interface FourthSetCandidate {
  readonly event: string;
  /** The fall's or fireball's date (UTC), as the titles and metadata give it. */
  readonly date: string;
  readonly type: string | null;
  readonly sources: readonly {
    readonly doi: string | null;
    readonly year: number;
    readonly title: string;
  }[];
  /** Mentioned by at least one abstract or title: what might exist. */
  readonly mentions: readonly Mention[];
  /** The abstracts showing a number of that kind (not read by the analyst). */
  readonly exposed: readonly Exposed[];
  readonly widelyReported: boolean;
  /** How the trajectory was measured, where a title says so. */
  readonly instruments: string | null;
  /** «candidate»; «weak», the trajectory from eyewitnesses or not said;
   *  «to check», a condition of exclusion open. */
  readonly status: 'candidate' | 'weak' | 'to check';
  readonly note?: string;
}

export const FOURTH_SET_CANDIDATES: readonly FourthSetCandidate[] = [
  {
    event: 'Grimsby',
    date: '2009-09-26',
    type: 'H5',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2010.01167.x',
        year: 2011,
        title:
          'The fall of the Grimsby meteorite—I: Fireball dynamics and orbit from radar, video, and infrasound records',
      },
    ],
    mentions: ['trajectory', 'flare', 'fragmentation', 'recovery', 'infrasound', 'radar'],
    exposed: ['altitudeKm', 'mass', 'pressure'],
    widelyReported: false,
    instruments: 'radar, video, infrasound',
    status: 'candidate',
  },
  {
    event: 'Bunburra Rockhole',
    date: '2007-07-20',
    type: 'basaltic achondrite (anomalous eucrite)',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2011.01321.x',
        year: 2012,
        title:
          'The Bunburra Rockhole meteorite fall in SW Australia: fireball trajectory, luminosity, dynamics, orbit, and impact position from photographic and photoelectric records',
      },
    ],
    mentions: ['trajectory', 'lightCurve', 'fragmentation', 'recovery'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: 'photographic and photoelectric (Desert Fireball Network)',
    status: 'candidate',
  },
  {
    event: 'Mason Gully',
    date: '2010-04-13',
    type: 'H5',
    sources: [
      {
        doi: null,
        year: 2012,
        title:
          'The Mason Gully Meteorite Fall in SW Australia: Fireball Trajectory, Luminosity, Dynamics, Orbit and Impact Position',
      },
      {
        doi: '10.1111/maps.12605',
        year: 2016,
        title:
          'Characterization of Mason Gully (H5): The second recovered fall from the Desert Fireball Network',
      },
    ],
    mentions: ['trajectory', 'lightCurve', 'recovery'],
    exposed: [],
    widelyReported: false,
    instruments: 'photographic (Desert Fireball Network)',
    status: 'candidate',
  },
  {
    event: 'Dingle Dell',
    date: '2016-10-31',
    type: 'L6',
    sources: [
      {
        doi: '10.1111/maps.13142',
        year: 2018,
        title: 'The Dingle Dell meteorite: A Halloween treat from the Main Belt',
      },
    ],
    mentions: ['trajectory', 'fragmentation', 'recovery'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: 'Desert Fireball Network',
    status: 'candidate',
  },
  {
    event: 'Murrili',
    date: '2015-11-27',
    type: 'H5',
    sources: [
      {
        doi: '10.1111/maps.13566',
        year: 2020,
        title: 'Murrili meteorite’s fall and recovery from Kati Thanda',
      },
    ],
    mentions: ['trajectory', 'recovery'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: 'Desert Fireball Network',
    status: 'candidate',
  },
  {
    event: 'Neuschwanstein',
    date: '2002-04-06',
    type: 'EL6',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2004.tb00061.x',
        year: 2004,
        title:
          'Entry dynamics and acoustics/infrasonic/seismic analysis for the Neuschwanstein meteorite fall',
      },
    ],
    mentions: ['trajectory', 'lightCurve', 'fragmentation', 'recovery', 'infrasound'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: true,
    instruments: 'photographic (European Fireball Network), infrasound, seismic',
    status: 'candidate',
    note: 'rule 1171 (c): not in Borovička et al. (2020)’s sample, neither by name nor by its network code; a strength and an entry mass in Kenkmann et al. (2009), registered',
  },
  {
    event: 'Park Forest',
    date: '2003-03-27',
    type: 'L5',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2004.tb00075.x',
        year: 2004,
        title: 'The orbit, atmospheric dynamics, and initial mass of the Park Forest meteorite',
      },
    ],
    mentions: ['trajectory', 'fragmentation', 'recovery', 'infrasound'],
    exposed: ['altitudeKm', 'mass', 'pressure'],
    widelyReported: true,
    instruments: 'video, infrasound',
    status: 'candidate',
    note: 'rule 1245 (a): Gi et al. (2018), pasted into the conversation on 26 September 2026, showed its reported energy, speed, angle and azimuth, a mass and radius derived from them, and modelled ground overpressures; no altitude of it',
  },
  {
    event: 'Aguas Zarcas',
    date: '2019-04-23',
    type: 'CM2',
    sources: [
      {
        doi: '10.1111/maps.14337',
        year: 2025,
        title:
          'Orbit, meteoroid size, and cosmic ray exposure history of the Aguas Zarcas CM2 breccia',
      },
    ],
    mentions: ['trajectory', 'lightCurve', 'flare', 'fragmentation', 'recovery'],
    exposed: ['altitudeKm', 'pressure'],
    widelyReported: false,
    instruments: null,
    status: 'candidate',
  },
  {
    event: 'Benenitra',
    date: '2018-07-27',
    type: null,
    sources: [
      {
        doi: '10.17159/sajs.2021/8200',
        year: 2021,
        title:
          'An investigation of the 27 July 2018 bolide and meteorite fall over Benenitra, southwestern Madagascar',
      },
    ],
    mentions: ['deposition', 'fragmentation', 'recovery', 'infrasound'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: null,
    status: 'candidate',
    note: 'rule 1172 (a): a candidate, its kind primary, falling at extraction if its deposition is not reconstructed from a calibrated light curve',
  },
  {
    event: 'Antonin',
    date: '2021-07-15',
    type: 'L4-5',
    sources: [
      {
        doi: '10.1111/maps.13929',
        year: 2022,
        title:
          'Analysis of the daylight fireball of July 15, 2021, leading to a meteorite fall and find near Antonin, Poland',
      },
    ],
    mentions: ['trajectory', 'recovery'],
    exposed: ['mass'],
    widelyReported: false,
    instruments: 'a daylight fireball',
    status: 'candidate',
  },
  {
    event: 'Osceola',
    date: '2016-01-24',
    type: 'L6',
    sources: [
      {
        doi: '10.5194/epsc2020-730',
        year: 2020,
        title: 'Orbit, Meteoroid Size and Cosmic History of the Osceola (L6) Meteorite',
      },
    ],
    mentions: ['trajectory', 'recovery', 'radar'],
    exposed: ['mass'],
    widelyReported: false,
    instruments: 'video; weather radar (the 2016 survey of radar falls)',
    status: 'candidate',
  },
  {
    event: 'Ischgl',
    date: '1970-11-24',
    type: null,
    sources: [
      {
        doi: '10.1111/maps.14173',
        year: 2024,
        title:
          'The fireball of November 24, 1970, as the most probable source of the Ischgl meteorite',
      },
    ],
    mentions: ['trajectory', 'recovery'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: 'photographic (a historic fireball)',
    status: 'candidate',
    note: 'rule 1172 (a): the fireball’s tie to the meteorite concerns the ground, which round 3 does not judge',
  },
  {
    event: 'Annama',
    date: '2014-04-19',
    type: 'H5',
    sources: [
      {
        doi: null,
        year: 2015,
        title:
          'Annama H5 meteorite fall: orbit, trajectory, recovery, petrology, noble gases and cosmogenic radionuclides',
      },
    ],
    mentions: ['trajectory', 'recovery'],
    exposed: [],
    widelyReported: false,
    instruments: 'Finnish Fireball Network',
    status: 'candidate',
  },
  {
    event: 'Buzzard Coulee',
    date: '2008-11-20',
    type: 'H4',
    sources: [
      {
        doi: null,
        year: 2009,
        title:
          'A Bright Multiple Fragmentation Fireball and Meteorite Fall at Buzzard Coulee, Saskatchewan, Canada',
      },
    ],
    mentions: ['fragmentation', 'recovery'],
    exposed: ['mass'],
    widelyReported: false,
    instruments: 'video, shadow calibration',
    status: 'candidate',
  },
  {
    event: 'Creston',
    date: '2015-10-24',
    type: 'L6',
    sources: [
      {
        doi: '10.1111/maps.13235',
        year: 2019,
        title: 'The Creston, California, meteorite fall and the origin of L chondrites',
      },
    ],
    mentions: ['fragmentation', 'recovery'],
    exposed: [],
    widelyReported: false,
    instruments: null,
    status: 'candidate',
  },
  {
    event: 'Sutter’s Mill',
    date: '2012-04-22',
    type: 'CM2',
    sources: [
      {
        doi: null,
        year: 2012,
        title:
          'Radar-Enabled Recovery of the Sutter’s Mill Meteorite, a Carbonaceous Chondrite Regolith Breccia',
      },
    ],
    mentions: ['recovery', 'radar'],
    exposed: [],
    widelyReported: true,
    instruments: 'video, weather radar',
    status: 'candidate',
  },
  {
    event: 'Central Italy bolide',
    date: '2022-03-05',
    type: null,
    sources: [
      {
        doi: '10.1038/s41598-023-48396-8',
        year: 2023,
        title:
          'The optical, seismic, and infrasound signature of the March 5 2022, bolide over Central Italy',
      },
    ],
    mentions: ['trajectory', 'recovery', 'infrasound'],
    exposed: ['altitudeKm', 'mass'],
    widelyReported: false,
    instruments: 'optical, seismic, infrasound',
    status: 'candidate',
    note: 'rule 1172 (a): whether meteorites were recovered concerns the ground, which round 3 does not judge',
  },
  {
    event: 'Puerto Lápice',
    date: '2007-05-10',
    type: 'eucrite',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2009.tb00726.x',
        year: 2009,
        title:
          'Puerto Lápice eucrite fall: Strewn field, physical description, probable fireball trajectory, and orbit',
      },
    ],
    mentions: ['trajectory', 'fragmentation', 'recovery'],
    exposed: [],
    widelyReported: false,
    instruments: 'a «probable» trajectory, the title says',
    status: 'weak',
  },
  {
    event: 'Cali',
    date: '2007-07-06',
    type: 'H/L',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2009.tb00729.x',
        year: 2009,
        title: 'The Cali meteorite fall: A new H/L ordinary chondrite',
      },
    ],
    mentions: ['trajectory', 'recovery'],
    exposed: ['mass'],
    widelyReported: false,
    instruments: null,
    status: 'weak',
  },
  {
    event: 'Berduc',
    date: '2008-04-06',
    type: 'L6',
    sources: [
      {
        doi: '10.1111/j.1945-5100.2010.01029.x',
        year: 2010,
        title:
          'The Berduc L6 chondrite fall: Meteorite characterization, trajectory, and orbital elements',
      },
    ],
    mentions: ['trajectory', 'recovery', 'infrasound'],
    exposed: [],
    widelyReported: false,
    instruments: null,
    status: 'weak',
  },
];

/** Found by the searches and left out, with the reason (rule 1145 (a)). */
export const FOURTH_SET_LEFT_OUT: readonly { readonly event: string; readonly reason: string }[] = [
  { event: 'Chinese fireball of 22 December 2020', reason: 'a CNEOS row the repository read (I2)' },
  { event: 'Tajikistan superbolide, 23 July 2008', reason: 'a CNEOS row the repository read (I2)' },
  { event: 'Bering Sea bolide, 18 December 2018', reason: 'a CNEOS row the repository read (I2)' },
  {
    event: 'Iberian superbolide, 18 May 2024',
    reason: 'a CNEOS row the repository read (I2); a cometary orbit, out of the domain',
  },
  {
    event: 'Ciechanów fireball, 10 October 2013',
    reason:
      'no meteorite in its title or flags; kept for a later search of credible negatives, not as an entry event',
  },
  {
    event: 'Tighert (28 June 2014)',
    reason:
      'rule 1172 (a): a CNEOS row the repository read (I2) falls on its date, and its metadata cannot tell the two apart',
  },
  {
    event: 'Sariçiçek (2 September 2015)',
    reason:
      'the CNEOS row 2015-09-02T20:10:30Z the repository read (I2) — the fall was that evening: taken as the same event',
  },
  { event: 'Tissint', reason: 'no instrumented fireball in its titles; a Martian meteorite' },
  { event: 'Tarda', reason: 'no instrumented fireball in its titles' },
  { event: 'Kamargaon, Mahadevpur, Lorton', reason: 'no instrumented fireball in their titles' },
];
