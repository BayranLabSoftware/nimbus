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
 * Two measures beside it (the amendment of 16 September 2026, evening, at
 * Andrea's request). Every rule of a domain is also counted under one of two:
 * **fidelity**, the rules that ask the model to give what a tool of the field
 * gives on the same inputs — verification (G1, and I1, N1, V1 and L1, which
 * stand for it), I4's count against an exact count, and every accuracy bound
 * the first amendment of that day read against a tool of the field on the same
 * rows; and **beyond**, the rules that ask for what no tool of the field gives —
 * bands (G3), the input space (G4), robustness (G5), gaps (G6), method (G7),
 * the airburst band that must hold measured footprints (I3), and the tolls no
 * tool of the field computes (T4, N3, V5). Each measure reads 9 × its credit
 * over its rules, as the count does. Neither is a 9: a domain has a 9 only when
 * every rule holds.
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

/** Which of the two measures a domain's rule is counted under. */
export type Measure = 'fidelity' | 'beyond';

export interface DomainRule extends ScorecardRule {
  measure: Measure;
}

export interface DomainScorecard {
  domain: string;
  rules: readonly DomainRule[];
}

const G6: DomainRule = {
  rule: 'G6',
  measure: 'beyond',
  status: 'not met',
  evidence:
    'Every gap is declared in the report, but a 9 may carry only the ceilings, and the report declares gaps that are not ceilings.',
};
const G7: DomainRule = {
  rule: 'G7',
  measure: 'beyond',
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
        measure: 'fidelity',
        status: 'not met',
        evidence:
          "Met for Boore et al. 2014 (to Boore's Fortran), Allen et al. 2012, the interface models and Thompson & Worden's distances; not for every relation that sets a printed number.",
      },
      {
        rule: 'E1',
        measure: 'fidelity',
        status: 'pending',
        evidence:
          "ShakeMap 4 runs here since 19 September 2026 (docs/SHAKEMAP_SETUP.md): its own assemble and model, on an event with a source and no data, over its California Vs30 grid with active_crustal_nshmp2014, WGRW12 and Allen12IPE. On the first five scenarios our ring is 0.46 of ShakeMap's equivalent MMI VII radius at the rock reference, we draw 6.7 and 9.7 km of VII where it draws none, and at Mw 6.5 we draw the same 9.68 km at 10 km depth and at 40 where its own maximum intensity falls from 7.75 to 6.24. Five scenarios are not three hundred maps, so the rule stays pending on its set (benchmark/results/shakemap-against-nimbus-2026-09-19.json).",
      },
      {
        rule: 'E2',
        measure: 'fidelity',
        status: 'not met',
        evidence: "0.13× PAGER's people at MMI VII and above, σ_ln 2.18.",
      },
      {
        rule: 'E3',
        measure: 'fidelity',
        status: 'not met',
        evidence:
          "PAGER's own scatter read on 19 September 2026 (rules 215 to 219): on the 48 held-out rows where the record and both models are above zero, the toll is 0.901× with σ_ln 2.798 against PAGER's 3.375× and σ_ln 2.547 — a scatter 1.286 times the reference's, where the amendment of 16 September allows none. Under the bound as first written, PAGER's plus 0.25, it misses by 0.00127 in ln (benchmark/results/pager-scatter-2026-09-19.json).",
      },
      {
        rule: 'E4',
        measure: 'beyond',
        standsFor: ['G3'],
        status: 'pending',
        evidence: 'Follows E3.',
      },
      {
        rule: 'E5',
        measure: 'beyond',
        standsFor: ['G4'],
        status: 'not met',
        evidence: 'The envelope has no depth cells.',
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'not met',
        evidence:
          "The sweep of 19 September 2026 finds the same 16 failures as 16 September, and now says what they are: every one is a contour's radius, and on 19 September the sweep also read the field itself at fixed places and found it smooth. At Mw 9.5925 and 319 km depth a thousandth of a magnitude moves the MMI VII radius 15.6 %, from 13 445 m to 15 542 m, while the epicentral intensity moves from 7.0018 to 7.0024 and the accelerations at 20 and 100 km by 0.06 %: the epicentral contour of a source three hundred kilometres down is ill-conditioned, not discontinuous. The other ten are rings being born — 0 to 786 m for MMI IX as the epicentral intensity crosses 9.0000, 0 to 276 m for liquefaction — where the crossing moves as the square root of the excess. The continuity clause as written is about the radius, so this stays not met; whether a contour's conditioning should be read as a regime switch is a question for an amendment, and an amendment may not be written after the figure (benchmark/results/invariants-2026-09-19-1.json).",
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
        measure: 'fidelity',
        status: 'not met',
        evidence:
          'The far-field and run-up relations are held to GeoClaw fixtures by tolerance, not within 1 % of a reference implementation.',
      },
      {
        rule: 'T1',
        measure: 'fidelity',
        status: 'pending',
        evidence: 'GeoClaw has been run only over a flat ocean.',
      },
      {
        rule: 'T2',
        measure: 'fidelity',
        status: 'pending',
        evidence:
          'GeoClaw on real bathymetry not run; under the bound as first written, not met (3.16×, rules 102 to 105).',
      },
      {
        rule: 'T3',
        measure: 'fidelity',
        status: 'pending',
        evidence: 'No reference travel-time computation on the records.',
      },
      {
        rule: 'T4',
        measure: 'beyond',
        status: 'pending',
        evidence: 'No held-out set of tsunami tolls.',
      },
      {
        rule: 'T5',
        measure: 'beyond',
        standsFor: ['G3'],
        status: 'not met',
        evidence: 'Waves carry no band.',
      },
      {
        rule: 'G4',
        measure: 'beyond',
        status: 'not met',
        evidence: 'No measured cells for waves.',
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'met',
        evidence:
          "Since 19 September 2026 the sweep reads the wave and not only the shaking: the slip, the seafloor uplift, the down-dip width, the source wavelength and period, the amplitudes at 1 000 and 5 000 km — undispersed, dispersed and toward a receiver — the run-up, the inundation distance and the travel time, fifteen quantities over 5 000 random scenarios, with no failure of monotonicity or continuity in any of them. The earthquake family's 16 failures are all in the shaking's contours and belong to that domain. The second clause, that the application prints what the model computes, was read by the globe audit of 18 September on 94 contours (benchmark/results/invariants-2026-09-19-1.json, benchmark/results/globe-audit-2026-09-18.json).",
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
        measure: 'fidelity',
        standsFor: ['G1', 'G4'],
        status: 'not met',
        evidence:
          "A slide entering open water from above draws the impulse wave manual's first crest (Evers et al. 2019, 2nd edition), held in CI to its worked Examples 1 and 2 and to the manual's own spreadsheet on 143 held-out cases within 10⁻⁹, and the panel and the report name each of the manual's limits a scenario falls outside of (rules 162 to 167). A slide under the water and a confined basin still draw the project's calibrated forms. What changed on 21 September 2026 is why. It is no longer that no source's worked example holds them: rules 500 to 540 transcribed and verified three more laws — Watts et al. 2005's predictive equations for a submerged slide, and both of the manual's own reservoir shapes, its 2D channel decay and its 3D propagation. Three candidates were then REFUSED. The submarine equations return 458 m on Storegga, which lies outside their own fitted range at d/B = 0.018 against 0.06. Using them only inside that range opens a seam of 21.1× at the threshold, twice B-083's, against a limit of 2 taken from Tappin 2017's published scatter. And the manual's own case, applied to the confined basin, gives Vaiont 336 m in a 238 m lake and reopens B-003 and B-016. The confined basin also turns out to be the manual's 2D extreme case rather than something outside the manual — its §3.2.4 is \"Reservoir shape\" — so what this project replaced for it was the GENERATION where the manual only changes the decay.",
      },
      {
        rule: 'L2',
        measure: 'fidelity',
        status: 'met',
        evidence:
          "Read under the amendment of 16 September 2026: on the same 43 rows the model is the manual's first crest, checked against the manual's own spreadsheet on every row (rule 165), so its bias and σ_ln are the reference's. The field's reading printed beside it stays the one committed on 16 September, 1.282× at σ_ln 1.776, computed before B-042 corrected the slide's speed; the set is closed to further readings (rule 125).",
      },
      {
        rule: 'L3',
        measure: 'beyond',
        standsFor: ['G3'],
        status: 'not met',
        evidence: 'No Monte Carlo sampler.',
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'met',
        evidence:
          'No failure in the sweep of 5 000 landslides under the impulse wave manual, once the ratio between regimes was null where one makes no wave, and the application prints what Node computes on every preset (benchmark/results/invariants-2026-09-16-22.json, ui.json).',
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
        measure: 'fidelity',
        standsFor: ['G1'],
        evidence:
          "Against the Earth Impact Effects Program on the grid of validation/eiepReference.ts, gated in eiepComparison.test.ts. One declared departure since 21 September 2026: where the program would shorten the Mach crossover of a ground impact below 53.05 m/kt^⅓ — the shortest it has been checked at here, on 69 points — it is held there, because past it the program heads to the error it returns at zero, where this project drew no air blast at all (B-088, rules 630 to 637). It moves none of the 69 checked points and no preset. And a second, on the crater: Collins, Melosh & Marcus's two fits for the final crater do not meet at the simple-to-complex transition, and where the complex fit applies the final crater holds at the transition diameter until that fit reaches it — a transient from 2 560 to 2 784.9 m on Earth, where no crater row of the grid lies (rules 647 to 653). And a third, on the entry, since the same day: the model breaks a body up on Eq. 12's I_f, as Collins, Melosh & Marcus print it, and not on twice it as the program computes it (BM-13), and gives a broken body the speed of their Eq. 20 with its −3(l/H)² term. Eq. 12's I_f is the exact condition, in Eqs. 8 to 10, for a body's ram pressure to reach its strength: on twice it a body breaks below where its ram pressure passed its strength — 332 m at an I_f of 0.1, 6.1 km at ½ — and from ½ to 1 the program has no answer; Sikhote-Alin, which broke near 5.8 km, does not break on it; and the seam where this project passed from one to the other was B-089 (rules 667 to 697). It moves the grid's breakup altitudes to within 1 % of the program, its burst altitudes to within 5 % and its airburst overpressures to within 1 %; every relation stays held to the program on the program's entry, named in each test.",
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
            evidence:
              "Diameters within the program's rounding; depth 0.995× since B-040. For an iron's airburst the program prints no crater's size, only that its large fragments may create a strewn field, and its map draws the ejecta of the whole body's crater at its residual speed: since rules 764 to 771 the model digs that crater, its blanket within 2 % of the map's.",
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
              "The program's exposure, half-space and Eq. 36*: sixteen held-out ignition rings within 1 % (rules 146 to 149). A named departure since 21 September 2026 (rules 780 to 787, B-095): the flash in the air is the stronger, at every range, of the program's efficiency and the radiation Johnston & Stern's correlation lays along the entry's path, which the program does not compute; for a body that reaches the ground it adds to the program's fireball, and Meteor Crater's third-degree ring reaches 8.42 km where the fireball alone draws 7.15. The fireball's own law stays held to the program.",
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
            evidence:
              "Gated at 1 % since rules 141 to 145 (BM-21 closed). A named departure since 21 September 2026 (rules 748 to 755): a body that reaches the ground bursts at the ground — the program's law on the program's energy at z₁ = 0, Collins et al. 2005's Eq. 54 — where the program reads Eq. 18's altitude below it, which no paper derives and which made a larger body blast less. The program's law stays as `groundBlast: 'programHeld'` and keeps its 69 checked points; the energy a ground impact couples to the air follows Collins et al.'s surface burst, which no impact on the ground has been measured to test.",
          },
          {
            name: 'the seismic magnitude',
            status: 'met',
            evidence:
              "Read off the program's Mercalli rings: sixteen held-out bodies agree within 0.01 at all 45 rings (rules 154 to 157). A named departure since 21 September 2026 (rules 730 to 738, B-092): a complete airburst's magnitude is read from the air that carries its blast — Harkrider, Newton & Flinn (1974)'s Ms for its blast yield at its burst altitude, or the program's relation on the kept energy that reaches the ground below its fireball, the larger — where the program reads the kinetic energy the body keeps, which falls as the body grows. The program's reading is kept as `airburstSeismic: 'program'` and still agrees with it on the same sixteen bodies.",
          },
          {
            name: 'the impact tsunami',
            status: 'met',
            evidence:
              "The program's wave, 1/r from one water crater out: thirteen held-out impacts agree at all 49 levels, the rings within 1 % (rules 150 to 153).",
          },
          {
            name: 'the peak wind',
            status: 'met',
            evidence:
              "Since 22 September 2026 (rules 793 to 797, validation/impactWindRules.ts; rules 788 to 792 refused on the mechanism): Collins et al. 2005's relation with the program's round constants, 1 bar and 330 m/s, reads the program's wind at 0.9999× to 1.0008× on the overpressure gated for each of the 81 rows that print one, and an airburst's drawn wind within 1 % on both entries. It is drawn on the impact's own blast, so a body that reaches the ground carries the ground blast's named departure (rules 748 to 755).",
          },
        ],
      },
      {
        rule: 'I2',
        // Rule 1194's own re-reading: as first written this asks the model
        // to match real observation (the sky's peak brightness), which no
        // tool of the field computes -- 'beyond', not 'fidelity'. Its old
        // 'fidelity' tag reflected the amendment this rule now withdraws
        // from it, not the bound as first written.
        measure: 'beyond',
        status: 'not met',
        evidence:
          "FROZEN by rule 1193 (nasaAuditCorrectionsRules.ts) at the status the bound as first written gives it, permanently: an outside audit (25 September 2026) found the counted status here reflected only the reading the amendment of 16 September 2026 introduced — agreement with the Earth Impact Effects Program's own entry, not with the sky — while the rule's own text never asked for that. Against the bound as first written (median ≤ 5 km, mean ≤ 3 km, on the same 357 CNEOS fireballs): the model misses by 13.74 km in the median and 12.75 km in the mean (rules 76 to 79). NOT MET, and this status does not change again; what the 16 September amendment measured is I5.",
      },
      {
        rule: 'I3',
        measure: 'beyond',
        clauses: [
          {
            name: 'holds the forest flattened at Tunguska',
            status: 'met',
            evidence:
              'Over the field’s 10–20 kPa range for tree damage, the felled forest’s 26.5 km equivalent radius is bracketed at 15 Mt (rules 563 to 570).',
          },
          {
            name: 'holds the windows broken at Chelyabinsk',
            status: 'met',
            evidence:
              'Over the field’s 0.5–5 kPa range for window damage, the model holds the 50 km radius reported broken (rules 563 to 570).',
          },
          {
            name: 'holds ≥90 % of Collins et al. 2017’s shock-physics runs',
            status: 'not met',
            evidence:
              'Read at the burst altitudes the paper’s text gives (21.5, 14, 10, 11 km), a band about the product’s static source holds 27 of 43 scorable runs — 63 %, against 90 % (rule 1193(a), the figure recorded before the 21 September 2026 amendment that rewrote this clause to ask for it instead).',
          },
          {
            name: 'width no more than ×3',
            status: 'not met',
            evidence:
              'The narrowest band honest about the reference (Collins et al. 2017’s own three approximations) measures 3.34× at Chelyabinsk and 3.79× at Tunguska’s 15 Mt — both over ×3 (rules 571 to 578).',
          },
        ],
        evidence:
          "FROZEN by rule 1193 (nasaAuditCorrectionsRules.ts) at the status the bound as first written gives it, permanently: an outside audit (25 September 2026) found the second of the two 21 September 2026 amendments rewrote this rule's own 90 %-of-runs clause in the same commit that first computed what the field's tool achieves (27 of 43, 63 %) — a bound written knowing the figure, which this file has forbidden since it was first written. Two of the four things this rule asks for hold (both footprints); two do not (the coverage and the width, as first written). This status does not change again; what the two amendments measured is I6.",
      },
      {
        rule: 'I4',
        measure: 'fidelity',
        status: 'met',
        evidence:
          'Rings counted within 2.7 % of an exact count (rules 94 to 97), and the toll carries its ceiling.',
      },
      {
        rule: 'I5',
        measure: 'fidelity',
        status: 'met',
        evidence:
          "Opened by rule 1193, carrying forward what the amendment of 16 September 2026 measured before I2 was frozen. Read against the program's entry on the 357 CNEOS fireballs (rules 126 to 128, validation/fireballAnchorRules.ts). Rescored on 21 September 2026 when the entry went back to Eq. 12's I_f (rules 691 to 697): 352 within 1 %, 4 through BM-13, 1 refused by the program — the model is the field's tool on this set, by construction (G1), so the held-out miss (13.74 km model, 13.68 km program, in the median) is printed as what it says of the field and not read as a bar.",
      },
      {
        rule: 'I6',
        measure: 'fidelity',
        status: 'met',
        evidence:
          "Opened by rule 1193, carrying forward what the two amendments of 21 September 2026 measured before I3 was frozen. The product carries, for every complete airburst, the band Collins et al. 2017 give their own three approximations about the static source it draws — twice and half the static overpressure within three burst altitudes, the static source beyond — and every ring of 1 097 complete airbursts of the sweep lies in its band (rules 706 to 713, validation/airburstBandProductRules.ts). Width: the band is the reference's own, by construction. Runs: holds 27 of 43 at the paper's own burst altitudes, which is what the same band holds drawn about the program's own static source, since I1 already verifies the model is that source — stated plainly: this half of the rule holds by the same construction that makes the width hold, not by an independent measurement, and the disagreement it reports (0.71× to 1.34×) is the program's distance from the paper's shock-physics runs, not the model's.",
      },
      {
        rule: 'G3',
        measure: 'beyond',
        status: 'not met',
        evidence:
          "The quantity I2 names, the entry's burst altitude, carries a band since rules 739 to 747 (validation/entryBandRules.ts): the altitude plus the 5th and 95th percentiles of the model's error over the fireballs of its measured cell, sampled on the 357 of rules 76 to 79 and frozen on 21 September 2026, drawn in the panel and on the burst's beacon, none outside the cells. It is scored on the fireballs NASA JPL's catalogue publishes after the freeze, first when there are eight — about March 2027 at sixteen a year (IMP-0) — and how G3's width bound, written for a σ_ln, reads kilometres is IMP-6's to fix with Andrea before then. No band of an impact has yet been scored on a held-out set.",
      },
      {
        rule: 'G4',
        measure: 'beyond',
        status: 'met',
        evidence:
          "Rules 722 to 729 (validation/entryCellsRules.ts, 21 September 2026): the one quantity of an impact a held-out set measured, the altitude its entry spends the energy at, has its cells — rule 78's axes crossed and closed at the 357 fireballs' bounds, 0.048 to 49 kt and 9.8 to 71.1 km/s, for bodies of 3 000 kg/m³ with no class at 0.68 to 88.35 degrees. The product carries the verdict for every input (`measuredCells.entry`, validation/measuredCells.ts, generic) and says it in the panel, under the burst's beacon on the globe and in the legend, read headless in both languages; every preset lies outside, seven by energy and Sikhote-Alin by its composition. The report prints I2 cell by cell — the model and the program against the sky, rules 126 to 128's agreement, G2 in the four cells of twenty fireballs or more — and G3's column, empty until a band is read on held-out fireballs (IMP-6). Nothing else of an impact has a held-out set, so G4 gives nothing else a cell.",
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'met',
        evidence:
          "Met on 21 September 2026. With an iron's crater field ended by its mass where Bland & Artemieva (2006) end it (rules 764 to 771, B-098), still 0 on the benchmark's draw and 0 on a seed no run had used, under both laws: the crater that vanished at 20 m is continuous there, and the two irons whose crater was born below their fireball dig as one (benchmark/results/invariants-2026-09-21-45.json against -44, -47 against -46). With a low airburst digging where the energy it keeps strikes the ground (rules 756 to 763, B-097), still 0 on the benchmark's draw, and 7 against 7 on a seed no run had used, the same keys: the crater that opened at full size where a complete airburst becomes a partial one is the same either side of the switch, and one that vanished at that switch the other way round, a stone whose breakup rises with its size, now falls by 3.6 % (benchmark/results/invariants-2026-09-21-41.json against -40, -43 against -42). From that round the harness reads a crater's birth as it reads a contour's, where the regime switches, and every other step of it as the value it was, searched by halving. With an airburst's magnitude read from the air that carries it (rules 730 to 738, B-092), the benchmark's draw reads 0: of the magnitudes that fall as a body grows, 19 are moved by the altitude of their source, as the blast rings are, and one by the table's own reading of Ms where its peak moves to a period twice as long; two rise steeply where the ground's term is born below a burst's fireball, searched by halving and not a jump (benchmark/results/invariants-2026-09-21-33.json against -32 under the program's reading). On a seed no run had used, 9 against 35, all of one iron of 1.44 m that the paper's I_f = 1 turns from whole to burst (B-091), under both readings (-35 against -34). The second clause: every preset printed in the application as Node computes it, number for number, but Chicxulub at sea, where the application zeroes the fires and the liquefaction of an open-water strike on purpose (`gateImpactByTerrain`, B-031) and Node does not (benchmark/results/ui.json, 21 September 2026). Open, and outside the benchmark's draw: B-091, where the paper's sharp strength switches a body from whole to burst. B-097, a crater that opened at full size where a complete airburst becomes a partial one, is closed by rules 756 to 763, and B-098, an iron's crater that vanished at the strewn field's cut at 20 m, by rules 764 to 771. With a low airburst's flash tapered where its fireball meets the ground (rules 714 to 721, B-093), 38: the burn ring that stepped where a complete airburst becomes a partial one is gone, and no other scenario's failures differ; on a seed no run had used, 50 against 57 with the flash all in the air, no key printed that the old law did not print, and three findings under both: a crater that opens at full size at that same switch (B-097), an iron's crater that vanishes at the strewn field's cut at 20 m (B-098), and B-091's neighbourhood, where the breakup rises with the body's size (benchmark/results/invariants-2026-09-21-29.json against -28, -31 against -30). What G5 reads on the own seed is now the 38 airburst magnitudes of B-092. With an airburst's flash placed at its burst altitude (rules 698 to 705, B-094), still 39, the same keys and scenarios, and 40 on a seed no run had used under either placement: no body that is not a complete airburst moves, and each complete airburst's burns and fires are drawn at the ground ranges its flash reaches (benchmark/results/invariants-2026-09-21-24.json against -23, -26 against -25). With the entry on Eq. 12's I_f (rules 691 to 697), still 39, the same keys and the same scenarios, and on a seed no run had used 46 under either entry, the same keys: B-089's seam, where the source of every blast ring jumped, is gone (benchmark/results/invariants-2026-09-21-20.json against -19, and -22 against -21 on the unseen seed). With the harness asking of a blast ring that shrinks whether its source moved it (rules 683 to 690, validation/blastShrinkSourceRules.ts), 39: each of the 396 is moved by the altitude of the static source it is drawn from — the burst altitude, or Eq. 18's below the ground — which moves without a step, and at the larger body's energy and the smaller's altitude no ring shrinks; on a seed no run had used, 321 of 330 likewise, and the nine others have a source that jumps, B-089's seam and a new one, B-091, where the paper's I_f crosses 1 (benchmark/results/invariants-2026-09-21-16.json and -18, against -15 and -17 without the statement). What G5 reads on the own seed is 38 airburst magnitudes, the program's reading of an airburst's seismic source falling as the body grows, and one second-degree burn. The paper's entry equations were asked twice the same morning to close B-089 and refused twice, by the letter of a condition and then by the count of rings the height of burst shrinks, which the harness could not yet tell from a defect (rules 667 to 682). With the field read as the limit continuity is (rules 660 to 666, validation/fieldJumpRules.ts), 435: rule 624 bounded the field's slope, not its continuity, and its ten jumps are all steep and continuous — searched by halving the step thirty times, none of 167 flagged samples jumps on the own seed, nor of 150 on a seed no run had used, where every other count is unchanged key for key (benchmark/results/invariants-2026-09-21-8.json, and -9 on the unseen seed, 383 there). What is left is 396 blast rings, 38 airburst magnitudes and one burn. With the seafloor taper adopted (rules 654 to 659, refused on 16 September only because it moved a crater onto the step now joined), 445: the two tsunami amplitudes are gone and every other count is unchanged (benchmark/results/invariants-2026-09-21-7.json, against -6 with the step on the same commit). With the final crater joined across the simple-to-complex transition (rules 647 to 653), 447: the rim and the final diameter no longer shrink there, and nothing new appears in the crater, the rim or the ejecta (benchmark/results/invariants-2026-09-21-5.json, against -4 before the join on the same seed). Earlier the same day, rules 638 to 646 read two physical causes a blast ring may shrink by — a burst moving away from that ring's optimum height, and a body sending more of its energy into the ground — and were REFUSED on a seed no run had used: 314 of 318 shrinking rings had one, and four, in two scenarios, had neither. One is the model jumping, B-089 (the entry); the other is the knee of the height-of-burst curve, which Glasstone & Dolan's Figure 3.73c has too, crossed by the body's step — a case cause (i) could not see because it read the distance to the optimum and not the side of it (B-090, registered and withdrawn the same hour); the harness reads no cause, and every shrinking ring still counts (benchmark/results/invariants-2026-09-21-3.json). Under the ground blast held on 21 September 2026 (rules 630 to 637, B-088), 449: the twelve blast rings that shrank past the program's checked crossover are gone, and the four field samples of IMP-1's 814 m body with them; 396 blast rings remain — 158 airbursts bursting away from their ring's optimum height, one bursting higher and away from it on the other side, and the rest bodies that reach the ground, above the held crossover — with 38 airburst magnitudes, 2 wave amplitudes, one burn ring, the crater rim and final diameter, and 10 field samples, for IMP-2b onward (benchmark/results/invariants-2026-09-21-2.json; the law in place, read in the same session, in -1). Read again on 21 September 2026 by the corrected harness (rules 621 to 629, validation/continuityRules.ts): 465 failures over the same 5 000 scenarios. The thirteen contours at their birth are no longer counted — the check as it was, read in the same run, still finds all thirteen — and the monotonicity failures are the same: 408 blast rings, 38 airburst magnitudes, 2 tsunami amplitudes, one second-degree burn ring, and the crater rim and final diameter at the simple-to-complex transition, which were monotonicity failures all along and not continuity ones, as rule 628 wrongly expected. What the old check could not see, the field at fixed places, jumps in fourteen samples under a 0.1 % step: the thermal exposure at 1 000 km in five, the overpressure at 1 to 100 km in nine. They belong to IMP-2, to be read continuous or discontinuous by refining the step, and not explained away (benchmark/results/invariants-2026-09-21.json). The reading of 16 September follows, kept as it was. 464 failures in the sweep of 16 September 2026. 408 of them are three damage rings shrinking as the impactor grows — lightDamage 149, overpressure1psi 137, overpressure5psi 122 — and rules 555 to 562 say what they are: G5's clause reads \"the other inputs held\", and an impactor's size is not held against the burst altitude, it SETS it. A bigger body bursts lower, and below the height-of-burst optimum a lower burst puts less overpressure on the ground than a higher one of slightly larger yield. The blast law itself is monotone in yield at a held geometry, over 42 107 pairs. The diagnosis was refused by one case in 408, where the body bursts HIGHER because it decelerates less, and it is not restated loosely to pass. 38 more are an airburst's magnitude falling as the body grows, as the program's does (rules 154 to 157), and two a seafloor cutoff of the model's own. Of the sixteen left, two are the published discontinuity at the simple-to-complex crater transition, which events/impact/crater.ts has always declared — \"the two fits do not join: at D_tc = 2.56 km the simple rule gives 3.20 km and the complex one 2.91 km\" — so a one per cent larger impactor that carries the transient across 2.56 km cuts a final crater seven per cent smaller. That is Collins, Melosh & Marcus's own Eqs. 22 and 27 and their own test. The last thirteen are overpressure rings AT THEIR BIRTH. The mechanism was already named on 16 September, for eight of them — GOLD_STANDARD.md's G5 row reads \"8 rings born under the burst, whose peak overpressure is within 3 % of the threshold, growing steeply from nothing\" — and what 21 September adds is that ALL THIRTEEN are that, the two competing explanations ruled out, and a closed form: the regime is unchanged in all thirteen, the branch between the surface ring and the air ring never flips, and all thirteen are reproduced exactly by the reach the model itself calls. What moves them is that formula's conditioning — d ln R / d ln E runs 9.1 to 392.6 against a healthy curve's 1/3, because under a high burst the overpressure lies on a shelf, d ln P / d ln r measuring −0.002 to −0.059 at the ring against −0.617 at eight times its radius. At the limit the shelf's peak IS the threshold and the ring is being born, where it grows as the square root of the excess energy (a constant to 0.55 % over five decades of it) so that its elasticity is 1/(2·excess) and unbounded. A threshold contour genuinely appears with infinite slope, as the earthquake sweep's own ten MMI IX rings do; the reading is G5's continuity clause being ill-posed at a birth, not a defect (events/impact/ringBirth.test.ts). All 464 now have a cause (benchmark/results/invariants-2026-09-16-17.json).",
      },
      {
        rule: 'G6',
        measure: 'beyond',
        status: 'met',
        evidence:
          "Met on 21 September 2026, read for impacts by IMP-8 and closed by rules 780 to 787. Of the gaps the report declares for an impact, three are ceilings of docs/GOLD_STANDARD.md: its toll, which no impact in recorded history left; the deaths no count of the prompt effects sees, climate first; and, since I3's band holds both measured footprints, an airburst's round footprint. The entry's miss of the sky is the field's own — the Earth Impact Effects Program misses the same 357 fireballs by 13.68 km in the median, and the model is that program on them — so it is printed beside the program's, as the amendment of 16 September 2026 says, and not carried as a gap. The two gaps that were not ceilings are closed. An impact's air blast read from under the ground, as the program reads it, by rules 748 to 755: a body that reaches the ground bursts at the ground. And an airburst's flash, too faint by the luminous efficiency of an impact's plume (B-095), by rules 780 to 787, asked again after rules 772 to 779 were refused: the flash in the air is, at every range, the stronger of that efficiency's and the radiation Johnston & Stern's correlation for NASA's ATAP (Icarus 327, 2019) lays along the entry's path, read inside its fitted range and at its edge beyond — their six Tunguska radii within 7.2 % through this project's path. What the correlation cannot read is drawn at the efficiency PAIR, NASA's operational risk model, takes as its nominal: the field's own, printed beside it, by Andrea's decision of that evening. Under it Tunguska's preset draws a first-degree flash 10.1 km out and still chars no forest, its 60 m body at 0.34 MPa being smaller and weaker than the paper's, whose size is the field's open question",
      },
      G7,
    ],
  },
  {
    domain: 'Explosions',
    rules: [
      {
        rule: 'N1',
        measure: 'fidelity',
        standsFor: ['G1'],
        evidence:
          'Against Glasstone & Dolan 1977 and Kingery–Bulmash (docs/GOLD_STANDARD.md, standing).',
        clauses: [
          {
            name: 'overpressure with range',
            status: 'met',
            evidence:
              "Kingery–Bulmash itself for a chemical charge on the ground (rules 177 to 181), and the book's own curves for a nuclear burst at any height (rules 168 to 173).",
          },
          {
            name: 'overpressure with height of burst',
            status: 'met',
            evidence:
              "Figure 3.73c's own curves since rules 168 to 173, traced from the scan: the caption's example within 1 %, Figure 3.73b's 10 and 15 psi curves within 3.9 %, and NUKEMAP's 1 psi ring within 0.3 % on the five cases the campaign kept.",
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
            evidence:
              "The relation itself since rules 177 to 181: Swisdak's simplified fits for a hemispherical TNT surface burst, written from his Table 1 and held in CI to IATG 01.80's worked examples within 1 %, to his own English coefficients within 0.1 % and to itself at the joins. Before them, the Kinney–Graham fit at twice the yield, within 10 % of it on all thirty rings of the campaign, worst 0.934×.",
          },
        ],
      },
      {
        rule: 'N2',
        measure: 'fidelity',
        status: 'pending',
        evidence: 'No set of accidental explosions.',
      },
      {
        rule: 'N3',
        measure: 'beyond',
        status: 'not met',
        evidence: 'Two tolls, both tuned; Beirut 6.6× outside its band.',
      },
      {
        rule: 'G3',
        measure: 'beyond',
        status: 'not met',
        evidence: 'No band scored on a held-out set.',
      },
      {
        rule: 'G4',
        measure: 'beyond',
        status: 'not met',
        evidence: 'No measured cells for explosions.',
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'met',
        evidence:
          "Two failures in the sweep, both the geometry and declared: the lethal-dose ring where the sphere meets the ground tangentially, and a 5 psi ring just under the top of the book's contour, where the farthest crossing moves steeply with the height (benchmark/results/invariants-2026-09-16-24.json); the application prints what Node computes on every preset (ui.json).",
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
        measure: 'fidelity',
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
            status: 'met',
            evidence:
              "Tephra2's forward model, written anew: forty held-out eruptions, all 1 600 points within the program's printing (rules 158 to 161).",
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
        measure: 'fidelity',
        status: 'pending',
        evidence: 'No held-out set beyond IVESPA 1.0, which is read.',
      },
      {
        rule: 'V3',
        measure: 'fidelity',
        status: 'pending',
        evidence: 'Tephra2 not run on a set of isopach maps.',
      },
      {
        rule: 'V4',
        measure: 'fidelity',
        status: 'pending',
        evidence: 'The energy cone and LaharZ not run on a set of currents.',
      },
      {
        rule: 'V5',
        measure: 'beyond',
        status: 'not met',
        evidence: 'One held-out toll of three inside, 0.21×.',
      },
      {
        rule: 'V6',
        measure: 'beyond',
        standsFor: ['G3'],
        status: 'pending',
        evidence: 'Follows V2 to V5.',
      },
      {
        rule: 'G4',
        measure: 'beyond',
        status: 'not met',
        evidence: 'No measured cells for volcanoes.',
      },
      {
        rule: 'G5',
        measure: 'beyond',
        status: 'met',
        evidence:
          "No failure in the sweep of 5 000 volcanoes on Tephra2's deposit, where the closed form had 6 (rules 158 to 161, benchmark/results/invariants-2026-09-16-19.json), and the application prints what Node computes on every preset (benchmark/results/ui.json).",
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

export interface RuleCount {
  rules: number;
  held: number;
  pending: number;
  credit: number;
  /** 9 × credit / rules, cut to one decimal, so that only rules that all hold
   *  read 9. */
  reading: number;
}

export interface DomainCount extends RuleCount {
  domain: string;
  /** The rules that ask for what a tool of the field gives on the same inputs. */
  fidelity: RuleCount;
  /** The rules that ask for what no tool of the field gives. */
  beyond: RuleCount;
}

function countRules(rules: readonly ScorecardRule[]): RuleCount {
  const credit = rules.reduce((sum, r) => sum + ruleCredit(r), 0);
  const pending = rules.filter(
    (r) => r.status === 'pending' || (r.clauses?.some((c) => c.status === 'pending') ?? false)
  ).length;
  return {
    rules: rules.length,
    held: rules.filter(ruleHolds).length,
    pending,
    credit,
    reading: rules.length === 0 ? 0 : Math.floor((90 * credit) / rules.length + 1e-9) / 10,
  };
}

export function domainCount(d: DomainScorecard): DomainCount {
  return {
    domain: d.domain,
    ...countRules(d.rules),
    fidelity: countRules(d.rules.filter((r) => r.measure === 'fidelity')),
    beyond: countRules(d.rules.filter((r) => r.measure === 'beyond')),
  };
}
