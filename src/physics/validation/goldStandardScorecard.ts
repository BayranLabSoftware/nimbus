/**
 * The count toward a 9, domain by domain: what docs/GOLD_STANDARD.md asks of
 * each domain, and whether each piece of it holds at this commit.
 *
 * A 9 is every rule at once, and below it the file used to leave the grade a
 * reading — impacts 6.5, volcanoes 4 — that moved with whoever made it. On
 * 16 September 2026 Andrea asked for a count instead, printed at every commit,
 * so that progress shows and cannot be talked up. This is that count.
 *
 * How it counts. Each domain is scored on its own rules and on the rules of
 * "Every domain" that apply to it. A rule of a domain that is itself one of
 * those — I1, N1 and V1 are G1 against a named reference, L1 is G1 and G4 for
 * the wave's relation, E4, T5, L3 and V6 are G3 for their quantities, E5 is G4
 * for earthquakes — stands for it, and is counted once. G2 is not counted
 * apart: its bounds are the domain's accuracy rules. A rule that lists clauses
 * (I1, N1, V1) earns the share of its clauses that hold; every other rule
 * earns 1 when it holds and 0 when it does not or is pending — a rule whose
 * reference has not been run on its rows is not met (the amendment of
 * 16 September 2026). The reading is 9 × credit / rules: a 9 only when
 * everything holds, as the file says a 9 is.
 *
 * What it cannot do is decide a status: each one here is the verdict a rule
 * file, a test or the report already reached, and its evidence says which. A
 * status changes in the same commit as the verdict that changes it.
 */

export type RuleStatus = 'met' | 'not met' | 'pending';

export interface ScorecardClause {
  name: string;
  status: RuleStatus;
  evidence: string;
}

export interface ScorecardRule {
  rule: string;
  /** The generic rules this one stands for, if any. */
  standsFor?: readonly string[];
  /** Set when the rule has no clauses. */
  status?: RuleStatus;
  clauses?: readonly ScorecardClause[];
  evidence: string;
}

export interface DomainScorecard {
  domain: string;
  rules: readonly ScorecardRule[];
}

const G6: ScorecardRule = {
  rule: 'G6',
  status: 'not met',
  evidence:
    'Every gap is declared in the report, but a 9 may carry only the ceilings, and the report declares gaps that are not ceilings.',
};
const G7: ScorecardRule = {
  rule: 'G7',
  status: 'met',
  evidence:
    'Every default changed since the rules were written changed by rules pushed before their candidate ran, with every outcome recorded (docs/BENCHMARK_PROTOCOL.md; the rule files of validation/).',
};

export const GOLD_STANDARD_SCORECARD: readonly DomainScorecard[] = [
  {
    domain: 'Earthquakes',
    rules: [
      {
        rule: 'G1',
        status: 'not met',
        evidence:
          "Met for Boore et al. 2014 (to Boore's Fortran), Allen et al. 2012, the interface models and Thompson & Worden's distances; not for every relation that sets a printed number.",
      },
      {
        rule: 'E1',
        status: 'pending',
        evidence: 'A ShakeMap scenario run without stations on the same maps has not been run.',
      },
      {
        rule: 'E2',
        status: 'not met',
        evidence: "0.13× PAGER's people at MMI VII and above, σ_ln 2.18.",
      },
      {
        rule: 'E3',
        status: 'pending',
        evidence: "PAGER's own σ_ln on the same rows has not been read.",
      },
      {
        rule: 'E4',
        standsFor: ['G3'],
        status: 'pending',
        evidence: 'Follows E3.',
      },
      {
        rule: 'E5',
        standsFor: ['G4'],
        status: 'not met',
        evidence: 'The envelope has no depth cells.',
      },
      {
        rule: 'G5',
        status: 'not met',
        evidence:
          'The sweep of 16 September 2026 finds 16 failures: rings stepping over their thresholds (benchmark/results/invariants-2026-09-16-4.json).',
      },
      G6,
      G7,
    ],
  },
  {
    domain: 'Waves from earthquakes',
    rules: [
      {
        rule: 'G1',
        status: 'not met',
        evidence:
          'The far-field and run-up relations are held to GeoClaw fixtures by tolerance, not within 1 % of a reference implementation.',
      },
      {
        rule: 'T1',
        status: 'pending',
        evidence: 'GeoClaw has been run only over a flat ocean.',
      },
      {
        rule: 'T2',
        status: 'pending',
        evidence:
          'GeoClaw on real bathymetry not run; under the bound as first written, not met (3.16×, rules 102 to 105).',
      },
      {
        rule: 'T3',
        status: 'pending',
        evidence: 'No reference travel-time computation on the records.',
      },
      {
        rule: 'T4',
        status: 'pending',
        evidence: 'No held-out set of tsunami tolls.',
      },
      {
        rule: 'T5',
        standsFor: ['G3'],
        status: 'not met',
        evidence: 'Waves carry no band.',
      },
      {
        rule: 'G4',
        status: 'not met',
        evidence: 'No measured cells for waves.',
      },
      {
        rule: 'G5',
        status: 'pending',
        evidence: "The earthquake sweep checks the shaking's rings and not the wave's.",
      },
      G6,
      G7,
    ],
  },
  {
    domain: 'Waves from landslides',
    rules: [
      {
        rule: 'L1',
        standsFor: ['G1', 'G4'],
        status: 'not met',
        evidence:
          "The relation in place is Watts 2000's cube root with the project's prefactors; Heller et al. 2009 is verified to 0.4 % of its manual but is not the default, and the product does not warn outside Heller's ranges.",
      },
      {
        rule: 'L2',
        status: 'not met',
        evidence:
          'Against Heller on the same rows: Heller 1.282× at σ_ln 1.776, the model 2.090× at 1.529.',
      },
      {
        rule: 'L3',
        standsFor: ['G3'],
        status: 'not met',
        evidence: 'No Monte Carlo sampler.',
      },
      {
        rule: 'G5',
        status: 'met',
        evidence:
          'No failure in the sweep of 5 000 landslides, and the application prints what Node computes (benchmark/results/invariants-2026-09-16-4.json).',
      },
      G6,
      G7,
    ],
  },
  {
    domain: 'Impacts',
    rules: [
      {
        rule: 'I1',
        standsFor: ['G1'],
        evidence:
          'Against the Earth Impact Effects Program on the grid of validation/eiepReference.ts, gated in eiepComparison.test.ts.',
        clauses: [
          {
            name: 'the entry',
            status: 'met',
            evidence: 'Breakup altitudes 1.00×, gated at 0.2 % (rules 141 to 145).',
          },
          {
            name: 'the burst',
            status: 'met',
            evidence: 'Burst altitudes 1.00×, gated at 0.2 % (rules 141 to 145).',
          },
          {
            name: 'the speed and energy at the ground',
            status: 'met',
            evidence: "Within the program's printed rounding, gated.",
          },
          {
            name: "the crater's diameters and depth",
            status: 'met',
            evidence: "Diameters within the program's rounding; depth 0.995× since B-040.",
          },
          {
            name: 'the fireball and its horizon',
            status: 'met',
            evidence: 'Fireball radius gated at the rounding; horizon Eq. 37* (B-037).',
          },
          {
            name: 'the thermal exposure',
            status: 'met',
            evidence:
              "The program's exposure, half-space and Eq. 36*: sixteen held-out ignition rings within 1 % (rules 146 to 149).",
          },
          {
            name: 'the ejecta',
            status: 'met',
            evidence: 'Blanket edge gated at 2 %.',
          },
          {
            name: 'the air blast of airbursts',
            status: 'met',
            evidence: 'Gated at 1 % at both ends; the Mach passage since rules 129 to 131.',
          },
          {
            name: 'the air blast of ground impacts',
            status: 'met',
            evidence: 'Gated at 1 % since rules 141 to 145 (BM-21 closed).',
          },
          {
            name: 'the seismic magnitude',
            status: 'pending',
            evidence: 'The two magnitudes have not been compared.',
          },
          {
            name: 'the impact tsunami',
            status: 'met',
            evidence:
              "The program's wave, 1/r from one water crater out: thirteen held-out impacts agree at all 49 levels, the rings within 1 % (rules 150 to 153).",
          },
        ],
      },
      {
        rule: 'I2',
        status: 'met',
        evidence:
          "Read against the program's entry on the 357 CNEOS fireballs (rules 126 to 128, validation/fireballAnchorRules.ts).",
      },
      {
        rule: 'I3',
        status: 'not met',
        evidence: "Tunguska's 20 kPa ring 0.43× the flattened forest.",
      },
      {
        rule: 'I4',
        status: 'met',
        evidence:
          'Rings counted within 2.7 % of an exact count (rules 94 to 97), and the toll carries its ceiling.',
      },
      {
        rule: 'G3',
        status: 'not met',
        evidence: 'No quantity of an impact carries a band scored on a held-out set.',
      },
      {
        rule: 'G4',
        status: 'not met',
        evidence: 'No measured cells for impacts.',
      },
      {
        rule: 'G5',
        status: 'not met',
        evidence:
          "426 failures in the sweep of 16 September 2026, which holds the wave a visitor is shown since rules 150 to 153; two are a seafloor cutoff of the model's own (benchmark/results/invariants-2026-09-16-15.json).",
      },
      G6,
      G7,
    ],
  },
  {
    domain: 'Explosions',
    rules: [
      {
        rule: 'N1',
        standsFor: ['G1'],
        evidence:
          'Against Glasstone & Dolan 1977 and Kingery–Bulmash (docs/GOLD_STANDARD.md, standing).',
        clauses: [
          {
            name: 'overpressure with range',
            status: 'met',
            evidence: 'Kingery–Bulmash within 10 % in range on all thirty rings of the campaign.',
          },
          {
            name: 'overpressure with height of burst',
            status: 'not met',
            evidence: "A piecewise factor of the project's stands in for Figs. 3.73a–c.",
          },
          {
            name: 'the fireball',
            status: 'met',
            evidence: 'Standing of N1: down to the height-of-burst clause.',
          },
          {
            name: 'thermal fluence and its partition',
            status: 'met',
            evidence: 'Standing of N1: down to the height-of-burst clause.',
          },
          {
            name: 'burns at exposures that grow with yield',
            status: 'met',
            evidence: 'Figure 12.65 since rules 114 to 117.',
          },
          {
            name: 'initial radiation',
            status: 'met',
            evidence: 'Figures 8.33a/b and 8.64a/b (rules 85 to 89).',
          },
          {
            name: 'the crater',
            status: 'met',
            evidence: 'Figures 6.72a/b, three coefficients read and two declared (rules 90 to 93).',
          },
          {
            name: 'the water wave',
            status: 'met',
            evidence: "Within the book's 35 % where its relation applies.",
          },
          {
            name: 'Kingery–Bulmash for a charge on the ground',
            status: 'met',
            evidence: 'All thirty rings within 10 %, worst 0.934×.',
          },
        ],
      },
      {
        rule: 'N2',
        status: 'pending',
        evidence: 'No set of accidental explosions.',
      },
      {
        rule: 'N3',
        status: 'not met',
        evidence: 'Two tolls, both tuned; Beirut 6.6× outside its band.',
      },
      {
        rule: 'G3',
        status: 'not met',
        evidence: 'No band scored on a held-out set.',
      },
      {
        rule: 'G4',
        status: 'not met',
        evidence: 'No measured cells for explosions.',
      },
      {
        rule: 'G5',
        status: 'met',
        evidence:
          'One failure in the sweep, the lethal-dose ring where the sphere meets the ground tangentially, which is the geometry and declared; the application prints what Node computes.',
      },
      G6,
      G7,
    ],
  },
  {
    domain: 'Volcanoes',
    rules: [
      {
        rule: 'V1',
        standsFor: ['G1'],
        evidence: 'The column, the ash and the flows against their references.',
        clauses: [
          {
            name: 'the column',
            status: 'met',
            evidence: 'The column is Mastin et al. 2009, the reference V2 names.',
          },
          {
            name: 'the ash',
            status: 'not met',
            evidence: "Tephra2's closure adopted (rules 110 to 113), still 0.299× across the wind.",
          },
          {
            name: 'the pyroclastic currents',
            status: 'not met',
            evidence: 'A project mobility, not LaharZ or the energy cone.',
          },
          {
            name: 'the lahars',
            status: 'not met',
            evidence: 'No lahar follows a valley.',
          },
        ],
      },
      {
        rule: 'V2',
        status: 'pending',
        evidence: 'No held-out set beyond IVESPA 1.0, which is read.',
      },
      {
        rule: 'V3',
        status: 'pending',
        evidence: 'Tephra2 not run on a set of isopach maps.',
      },
      {
        rule: 'V4',
        status: 'pending',
        evidence: 'The energy cone and LaharZ not run on a set of currents.',
      },
      {
        rule: 'V5',
        status: 'not met',
        evidence: 'One held-out toll of three inside, 0.21×.',
      },
      {
        rule: 'V6',
        standsFor: ['G3'],
        status: 'pending',
        evidence: 'Follows V2 to V5.',
      },
      {
        rule: 'G4',
        status: 'not met',
        evidence: 'No measured cells for volcanoes.',
      },
      {
        rule: 'G5',
        status: 'not met',
        evidence:
          "6 failures: the ashfall's plume crossing a grain-size regime (benchmark/results/invariants-2026-09-16-4.json).",
      },
      G6,
      G7,
    ],
  },
];

/** C1 to C3, which hold for Nimbus as a whole. */
export const CITABILITY: readonly ScorecardRule[] = [
  { rule: 'C1', status: 'not met', evidence: 'No tagged release with a DOI.' },
  { rule: 'C2', status: 'not met', evidence: 'No outside review.' },
  { rule: 'C3', status: 'not met', evidence: 'No accepted article.' },
];

/** The credit a rule earns: its share of clauses, or 1 when it holds. */
export function ruleCredit(r: ScorecardRule): number {
  if (r.clauses !== undefined && r.clauses.length > 0) {
    return r.clauses.filter((c) => c.status === 'met').length / r.clauses.length;
  }
  return r.status === 'met' ? 1 : 0;
}

/** A rule holds only when it, and every clause of it, holds. */
export function ruleHolds(r: ScorecardRule): boolean {
  return ruleCredit(r) === 1;
}

export interface DomainCount {
  domain: string;
  rules: number;
  held: number;
  pending: number;
  credit: number;
  /** 9 × credit / rules, cut to one decimal, so that only a domain where
   *  everything holds reads 9. */
  reading: number;
}

export function domainCount(d: DomainScorecard): DomainCount {
  const credit = d.rules.reduce((sum, r) => sum + ruleCredit(r), 0);
  const pending = d.rules.filter(
    (r) => r.status === 'pending' || (r.clauses?.some((c) => c.status === 'pending') ?? false)
  ).length;
  return {
    domain: d.domain,
    rules: d.rules.length,
    held: d.rules.filter(ruleHolds).length,
    pending,
    credit,
    reading: Math.floor((90 * credit) / d.rules.length + 1e-9) / 10,
  };
}
