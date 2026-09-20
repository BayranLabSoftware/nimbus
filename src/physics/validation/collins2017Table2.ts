/**
 * Table 2 of Collins, G. S., Lynch, E., McAdam, R. & Davison, T. M. (2017),
 * "A numerical assessment of simple airblast models of impact airbursts",
 * Meteoritics & Planetary Science 52(8): 1542–1560, doi:10.1111/maps.12873.
 * Open access under CC-BY; the copy read is SHA-256
 * c1cb0fc6df0ecc62d6f2f9c29d44400763c7a0a0cbc72cbc073ac1a285f5238b from
 * Imperial College's repository.
 *
 * "Blastwave outcomes from airburst simulations." Four airburst energies
 * against three energy-deposition models — S static source, M moving
 * source, C cylindrical line source — each run in the iSALE shock physics
 * code. These are the runs I3 of docs/GOLD_STANDARD.md asks a band to hold
 * ninety per cent of.
 *
 * HOW IT WAS READ, because it matters for whether to trust it. The table is
 * set sideways on page 13 of the PDF, and every text extractor in this
 * repository returns that page without it — `pdfplumber`'s table finder
 * finds nothing and `pdfminer` drops the characters. They are there: they
 * are the page's non-upright glyphs, 620 of them, and grouping those by
 * their x coordinate and sorting each group by descending y reconstructs
 * the rows exactly. Two independent checks that the reading is right:
 *
 *   • the 15 Mt row's 20 kPa entries are 19.2, 22.1 and 16.0 km, and the
 *     paper's prose says of that scenario "the nominal conditions for
 *     extensive tree damage ... are achieved to a radial distance of
 *     16–22 km for all of the source approximations";
 *   • the 0.5 Mt row's 1 kPa entries are 52.3, 54.8 and 55.5 km, and the
 *     prose says of Chelyabinsk "all three energy deposition approximations
 *     predict a ~50 km radius damage zone".
 *
 * WHAT THE TABLE DOES NOT CARRY, and this is the finding. Each row's BURST
 * ALTITUDE. The three models are run at a burst altitude and the table does
 * not print it, and the text names four altitudes — 21.8, 17, 13.5 and
 * 10.9 km — for the four asteroid diameters of its Figure 9 rather than for
 * these four energies. Without the altitude a like-for-like comparison with
 * this project's static source cannot be made, and every assignment that
 * has been tried gives a different answer:
 *
 *   assignment                         this model against the S column
 *   the four stated altitudes in order 1 of 11 radii within 10 %
 *   halfway between z_1% and z_50%,    0.72× to 1.09×, and the 15 Mt row's
 *     which is the rule the text gives peak overpressure to 1.6 %
 *   least squares over each whole row  residual 1.11× to 1.21×, and the
 *                                      recovered altitudes are not monotone
 *                                      in energy, which they must be
 *
 * So the residual disagreement between this model's static source and the
 * paper's is somewhere near 1.1 to 1.2× and cannot be pinned tighter. I3's
 * "ninety per cent of the shock-physics runs" is not scorable until the
 * altitudes are known — from the authors, or from the figures, or from
 * re-deriving them with the pancake model at the stated 20 km s⁻¹,
 * 3 000 kg m⁻³ and 0.2 MPa.
 *
 * The one row that does line up is 15 Mt: its least-squares altitude is
 * 10.36 km and "halfway between z_1% and z_50%" gives 10.37.
 */

/** One model's outcomes at one energy. `null` is the table's "n/a" — no
 *  overpressure of that magnitude is reached in the simulation — and
 *  `'offMesh'` is its em dash, too low to be observed in the computational
 *  mesh. The two mean opposite things and are not merged. */
export type TableEntry = number | null | 'offMesh';

export interface Table2Row {
  /** Airburst energy, Mt. */
  energyMt: number;
  /** Peak overpressure at ground zero, kPa, for S, M and C. */
  peakKPa: readonly [number, number, number];
  /** Overpressure at r = 3 z_b, kPa. */
  atThreeBurstHeightsKPa: readonly [number, number, number];
  /** Range at which 1, 10, 20 and 35 kPa are reached, km. */
  rangeKm: Readonly<
    Record<'1' | '10' | '20' | '35', readonly [TableEntry, TableEntry, TableEntry]>
  >;
}

export const COLLINS_2017_TABLE_2: readonly Table2Row[] = [
  {
    energyMt: 0.5,
    peakKPa: [3.81, 5.27, 1.32],
    atThreeBurstHeightsKPa: [0.786, 0.811, 0.894],
    rangeKm: {
      '1': [52.3, 54.8, 55.5],
      '10': [null, null, null],
      '20': [null, null, null],
      '35': [null, null, null],
    },
  },
  {
    energyMt: 5,
    peakKPa: [21.6, 35.2, 7.56],
    atThreeBurstHeightsKPa: [4.16, 4.41, 4.37],
    rangeKm: {
      '1': [142, 140, 'offMesh'],
      '10': [18.7, 22.4, null],
      '20': [4.48, 11.8, null],
      '35': [null, 1.16, null],
    },
  },
  {
    energyMt: 15,
    peakKPa: [65.8, 143, 26.5],
    atThreeBurstHeightsKPa: [11.8, 13.0, 12.2],
    rangeKm: {
      '1': [257, 236, 'offMesh'],
      '10': [34.4, 36.2, 37.0],
      '20': [19.2, 22.1, 16.0],
      '35': [11.1, 14.9, null],
    },
  },
  {
    energyMt: 50,
    peakKPa: [116, 326, 35.7],
    atThreeBurstHeightsKPa: [19.6, 20.5, 15.5],
    rangeKm: {
      '1': ['offMesh', 'offMesh', 'offMesh'],
      '10': [57.0, 54.3, 52.9],
      '20': [32.4, 33.5, 24.0],
      '35': [20.4, 23.3, 4.23],
    },
  },
];

/** The three models, in the order the table's columns run. */
export const TABLE_2_MODELS = ['static', 'moving', 'cylindricalLine'] as const;

/**
 * What the altitude of each row is under each assignment that has been
 * tried, and how well this model's static source then matches the S column.
 * Recorded so the next attempt does not repeat one of them.
 */
export const ALTITUDE_ASSIGNMENTS = {
  /** The four altitudes the text names, taken in energy order. */
  statedInOrder: { altitudesKm: [21.8, 17, 13.5, 10.9], radiiWithinTenPercent: 1, of: 11 },
  /** "Approximately halfway between the worst-case and median scenarios". */
  halfwayOfEq6: { altitudesKm: [21.38, 14.21, 10.37, 5.85], worstRatio: 0.72, bestRatio: 1.09 },
  /** Least squares in log over each row's whole set of S values. */
  leastSquares: {
    altitudesKm: [17.52, 12.19, 10.36, 12.92],
    residual: [1.107, 1.21, 1.123, 1.127],
    monotoneInEnergy: false,
  },
} as const;

export const COLLINS_2017_TABLE_2_SOURCE =
  'Collins, Lynch, McAdam & Davison 2017, Meteoritics & Planetary Science 52(8): 1542-1560, Table 2, CC-BY';
