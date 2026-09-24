/**
 * Rules 1148 to 1159 — round 1 of the fragment-cloud entry branch («FCM»),
 * run whole on the reviewer's leave of 24 September 2026 (afternoon), with the
 * conditions of that leave written in before any development run. The opening
 * dossier is rules 1137 to 1147 (fcmRoundRules.ts); a readable version of
 * these is docs/FCM_ROUND1_PLAN.md.
 *
 * RULE 1148. THE LEAVE, AND WHAT IT DOES NOT GIVE. Round 1 runs whole on the
 * declared development cases — implementation, verification, registered
 * tuning, paired comparisons — with no further approval before the
 * development runs, and ends in one package (rule 1157) whose proposal is
 * «ready for the independent test», «ready in a restricted domain» or «not
 * ready»: never an adoption. Gates 1 and 2 are not declared passed on the
 * summary sent with the dossier: the package shows the exceptions, the draws
 * not completed and the discrepancies with W18. A change that alters an
 * observable's definition, a gate's criterion or the access to the reserved
 * set is not a correction inside the round: it is a revision of the plan,
 * written as a rule before it is used. Round 2: the reconnaissance of
 * candidates only (rule 1158) — not the fourth set's constitution nor the
 * charter v3, which come in one final preparation dossier. No approval opens
 * the fourth set to the candidate's results or adopts the branch. Andrea's
 * word: the rules, then the whole round, then the package; the reconnaissance
 * after round 1's tuning is frozen; for round 2, metadata only, no download.
 *
 * RULE 1149. THE DOMAIN, A PERIMETER TO PROBE. 1 500–4 000 kg/m³, 0.1–300 m,
 * 11.2–30 km/s and 15°–90° are the perimeter of development, not a domain
 * shown. The package maps it:
 *   (a) the points: the sixteen corners of the four ranges, their centre, and
 *       240 points of a Halton sequence (bases 2, 3, 5, 7), the diameter taken
 *       on its logarithm and the others linearly; at each, one draw of the
 *       priors of rule 1152 under each structure and each cloud — four runs
 *       per point, 1 028 in all;
 *   (b) each run's status at the reference (steps of 10 m, bins of 10 m, a
 *       floor of 1 g, a bound of 100 000 components): «completed and
 *       convergent» where every decisional quantity of rule 1141 (c) moves by
 *       less than its tolerance under the step halved, the step doubled and
 *       bins of 100 m; «completed, not convergent», naming the quantity;
 *       «not robust» where rule 1151 marks the peak; «not completed», run
 *       again at 1 000 000 and, if still not, carried to rule 1150 — each
 *       with its inputs, structure, parameters, components and cost;
 *   (c) the map by region — diameter by decade, speed and angle by thirds of
 *       their ranges, density by halves — every run in its denominator: a
 *       region is not «ready» by leaving out the runs that did not finish;
 *   (d) the cost: components and steps of every run (deterministic), and the
 *       time on this machine in a separate, dated table.
 *
 * RULE 1150. THE CASCADES PAST THE BOUND. A draw the bound stops stays in the
 * denominator as «not completed»: never replaced by an easier draw. One
 * representation is tried, declared now: the aggregated tail — a solid piece
 * lighter than f_agg of the body's mass that reaches its strength breaks
 * wholly into a cloud, as R17's pancake does, instead of into fragments. It
 * is verified on the map's draws that complete exactly: f_agg is the largest
 * of 10⁻⁴, 10⁻⁵ and 10⁻⁶ for which every decisional quantity of every such
 * draw moves by less than rule 1141 (c)'s tolerance against the exact flight.
 * If one passes, it is used only on the draws past the bound, reported apart
 * as «completed by the aggregated tail» — an extrapolation of a verification
 * made where the tail is small, said so; if none passes, the regime restricts
 * the domain ready for the test by a rule written before round 3.
 *
 * RULE 1151. PEAKS NEARLY EQUAL, fixed before the development cases. On the
 * 1 km window sliding along the 10 m bins, a secondary maximum is a local
 * maximum at least 1 km from the main one, with the profile between them
 * falling below 90 % of the lower of the two. Where a secondary maximum
 * reaches 95 % of the main one — two and a half times the convergence
 * tolerance, eight times the largest move of the peak gate 1 found — the
 * draw's release is «not robust»: both altitudes are reported, and the metric
 * «altitude of the only maximum» is not used for that draw, neither in a band
 * nor in a distance. Beside the window, every output also gives the profile at
 * the declared resolution: the fixed 1 km grid and the largest 10 m bin, so
 * that the window hides no narrow peak — their ratio to the window's peak is
 * reported.
 *
 * RULE 1152. THE PRIORS AND STRUCTURES OF THE DEVELOPMENT RUNS.
 *   (a) The strength: the first stage S1 log-uniform on 40–120 kPa and the
 *       second S2 on 0.9–5 MPa (rules 881 to 889), from Borovička, Spurný &
 *       Shrbený (2020): fireballs of the European network, bodies of
 *       centimetres to metres, mostly ordinary chondrites. Initial
 *       development priors for the branch, not empirical priors validated to
 *       300 m: beyond some twenty metres they are an extrapolation, said on
 *       every output. The FCM's strength is an effective parameter (R17), not
 *       a sample's measured strength.
 *   (b) The links, not drawn apart for convenience: a lineage keeps one α, and
 *       its children's strength follows S_p (m_p / m_c)^α; in M2 every group
 *       breaks after the body's release (S2 ≥ 0.9 MPa > S1 by the priors), the
 *       groups' shares and the debris summing to one; the branch's hypothesis
 *       for development is a strength independent of the body's size within
 *       the priors — as the product's — and its alternative, S scaled with the
 *       body's mass from a 1 m body by the drawn α, runs as a sensitivity. The
 *       cloud share is drawn once per draw and kept by every break; W18 sets
 *       it per group, and here every group inherits the draw's.
 *   (c) M1, the monolith breaking progressively: strength S2; α, the larger
 *       share and the cloud share on rule 1139's priors; two fragments per
 *       break.
 *   (d) M2, the structured body after W18's Chelyabinsk and Košice: released
 *       at S1 into a rubble group of ten pieces (a share uniform on
 *       0.04–0.16) at S2 times a factor uniform on 1–2, a strong group of one
 *       piece (0.01–0.03) at S2 times 3–10, the initial debris (0–0.003),
 *       released as one cloud, and a main group of one piece at S2 taking the
 *       rest (0.81–0.95; W18: 93 % and 80 %); α, the split and the cloud
 *       share as M1's draw, inherited by every group.
 *   (e) The clouds: spreading without limit, and capped at ten initial radii
 *       (rule 1140).
 *   (f) σ log-uniform on 1·10⁻⁹–1.6·10⁻⁸ s²/m² (rule 1131); C_disp
 *       log-uniform on 1–3.5 (rule 1139); the material density equal to the
 *       drawn bulk density (no macroporosity drawn — W18's densities appear only
 *       in gate 2).
 *   (g) The draws: for each case, its first 200 input draws on the stream its
 *       earlier rounds used — rule 978's, rule 1126's for the third set — or
 *       its one input where it has one; each paired with one
 *       parameter draw on the stream `fcm-round1/<case>/<structure>/<cloud>`;
 *       the baseline — the product as it stands at the package's commit — on
 *       the same input draws.
 *
 * RULE 1153. THE ATMOSPHERE, SPECIFIED. The 1976 standard's density at a
 * geometric altitude above the sea-level reference: below 86 km from its
 * defining constants (the geopotential of eq. 18, eqs. 23, 33a and 33b), from
 * 86 to 150 km log-linearly between the rows its Table I prints (every 500 m to
 * 100 km) — the product's `ussa1976Entry.ts` (rule 912), whose test checks
 * every printed row within its last digit. The branch reads it through a table
 * of its logarithm every metre from 0 to 120 km, interpolated linearly, checked
 * against the standard's function to 10⁻⁶ (a test). Gravity is g0 (R_E / (R_E
 * + h))² with R17's R_E of 6 371 km — the standard's r0 of 6 356.766 km serves
 * only its geopotential: recorded. The flight starts at 100 km and ends at 0
 * m: no terrain. The exponential atmosphere (ρ0 1 kg/m³, H 8 km, the
 * product's) is a sensitivity, not an equivalent model. An atmosphere of the
 * place and the date may come later as a further sensitivity, never as a
 * silent correction of an event's inputs after seeing it.
 *
 * RULE 1154. THE BALANCES, KEPT APART.
 *   (a) At a break: mass, energy and the momentum vector across the split — a
 *       numerical conservation, reported as such.
 *   (b) In flight: the energy given to the air in each step, the kinetic
 *       energy the component lost plus gravity's work, is set against the
 *       drag's work ∫ ½ C_d A ρ v³ dt and the ablated mass's kinetic energy ∫
 *       ½ v² |dm/dt| dt, integrated apart on the same Runge–Kutta stages: the
 *       two agree only if the integration is right, and their residual is
 *       reported per draw with its order under the step halved. The ablated
 *       mass is the mass equation's own integral, an identity: said so.
 *   (c) The analytic limit of the mass proves the implementation of the law
 *       chosen, not the value of σ for any observed meteoroid.
 *
 * RULE 1155. THE FLOOR, TESTED WHERE IT ACTS. A body built to cascade to the
 * floor — 0.5 m, 3 000 kg/m³, 20 km/s, 45°, 100 kPa, α 0, two equal fragments
 * and no cloud — runs at floors of 1 g and 0.1 g: the ledger closes with the
 * dust counted under both, some mass turns to dust under both, and the
 * decisional quantities move by less than rule 1141 (c)'s tolerance; where
 * they do not, the floor is published as a parameter of the branch, with its
 * effect. No reserved source is opened for it.
 *
 * RULE 1156. THE DEVELOPMENT RUNS, the observational development.
 *   (a) The cases: rule 961's nine; the third set's six (development only,
 *       rule 1128); W18's Košice, Benešov and Tagish Lake, their inputs as W18
 *       prints them — the mass log-uniform over the range W18 gives, the bulk
 *       density uniform over W18's range (Tagish Lake's fixed), speed and
 *       angle fixed — on the stream `fcm-round1/<case>/inputs`, 200 draws.
 *   (b) Each case runs under M1 and M2 and both clouds, paired with the
 *       baseline on the same input draws.
 *   (c) What is read, per draw: the first break's altitude (against m1, the
 *       first event, and Benešov's disruption at 65–70 km); the main peak's
 *       altitude (against m2, the main flare, the third set's flares widened
 *       as rule 1126, and W18's flares, each ±1 km for its reading); the
 *       ground — whether solid pieces arrive, whether any arrives at the
 *       crater law's speeds (rule 1116's 5 km/s), the landed mass and the
 *       largest piece; the energy at the ground, as a diagnostic.
 *   (d) Favourable, unfavourable, not assessable — branch against baseline,
 *       per case, observable and configuration, fixed now: a release is
 *       favourable where the median's distance to the observed interval is
 *       smaller by at least 1 km, unfavourable where larger by at least 1 km,
 *       «equal» between; survival, where the repository documents recovered
 *       meteorites, favourable where the share of draws with pieces at the
 *       ground is higher by at least 0.10, unfavourable where lower by at
 *       least 0.10; «no crater», where documented, unfavourable only — where
 *       the share of draws with an arrival at the crater law's speeds is
 *       higher by at least 0.10; Carancas's crater, favourable where that
 *       share is higher by 0.10, unfavourable where lower; a documented
 *       recovered mass, a lower bound: «contradicted» where the model's 95th
 *       percentile of the landed mass lies below it. Not assessable: no
 *       observation in the repository or in W18's text, a release produced in
 *       fewer than 10 % of either model's draws, or a draw not robust (rule
 *       1151) for the main peak. None of this is a blind test.
 *   (e) The spread between the four configurations is the structural
 *       uncertainty, published as such.
 *   (f) Tuning is allowed on these cases, registered with its interval and
 *       objective; the untuned run is kept and shown beside the tuned one,
 *       never replaced by it; the tuning is frozen in the package.
 *   (g) Sensitivities, on M1 with clouds unlimited: the exponential
 *       atmosphere; C_disp 0.1; three and four fragments per break; the
 *       strength scaled with the body's size (rule 1152 (b)).
 *
 * RULE 1157. THE PACKAGE, one, at the end: (1) the code and its
 * reproducibility — commit, sources' and atmospheric tables' versions, inputs,
 * seeds, cost, the whole register of deviations; (2) gate 1 — built tests for
 * every limit, the balances in flight and at the breaks, the convergence of
 * the decisional outputs, the map of completion; (3) gate 2 — R17 and W18
 * apart, the parameters actually known, the uncertainty of reading figures,
 * every combination tried, the discrepancies not resolved; (4) the
 * observational development — every declared case, the baseline against each
 * structure and each cloud; favourable, unfavourable and not assessable
 * results; (5) a bounded proposal — the domain in which the candidate is ready
 * for round 3, or the technical reasons to stop it; the priors and structure
 * to freeze, with the structural uncertainty left.
 *
 * RULE 1158. ROUND 2'S RECONNAISSANCE, after round 1's tuning is frozen.
 * Titles, abstracts and metadata only; a register of candidates with the
 * reason each might be admitted, its earlier exposures and the observables
 * that might exist. No event chosen because the new branch should reproduce
 * it: the fourth set must be able to refute the model. A number an abstract
 * shows — a flare's altitude, a recovered mass — is registered as an
 * exposure: it does not become blind because the paper stays closed. A DOI
 * and metadata identify a candidate; a file's hash needs its bytes, and so a
 * download, which needs Andrea's leave — none is asked for now, and no hash
 * is called fixed where only an abstract was seen. Before any full
 * extraction: the list and its exclusions frozen, the sources in custody, the
 * extraction procedure written, the branch and its priors frozen and the
 * charter v3 approved; ideally who extracts the targets no longer chooses the
 * model's parameters. The minimums of rule 1145 (c) are aims, not quotas: a
 * missed recovery is not by itself a credible negative, and a crater gives no
 * independent input where the mass and speed were inferred from it.
 *
 * RULE 1159. GATE 2, HOW IT IS READ. R17 and W18 apart. The wording: «R17
 * reproduced within the quantities its text lets one read; W18 partial, with
 * its discrepancies named» — whether that is enough for a test in a restricted
 * domain is left to the final review. Rebuilding W18's groups from its text
 * and trying the corners of its ranges is a study of sensitivity, not a
 * reproduction with the same parameters, which W18 does not print. The
 * uncertainty of every value read from a figure is stated; the criterion of 1
 * km on the peak is «not applicable» where the figure's resolution, several
 * peaks or missing parameters do not let it be decided. No combination is
 * selected afterwards to make gate 2 green: the six of 512 that meet
 * Chelyabinsk's two targets may inform the development tuning, shown with the
 * other 506.
 *
 * RULE 1160. ONE REGISTERED TUNING, T, written after the untuned development
 * runs (rule 1156, fcmDevRuns.json) and before any tuned one. What the untuned
 * runs showed: in every case and every draw something reaches the ground, and
 * the landed mass is far above what is known — Chelyabinsk 24 to 450 t at the
 * median against the 4 to 6 t W18 cites from Popova et al. (2013), Tagish Lake 7
 * to 10 t against W18's 190 kg, 2008 TC3 7 to 10 t, Tunguska some 850 t. The
 * priors of rule 1139 let half the draws take α above 0.33 and a cloud share
 * below 0.45, where the fragments grow strong fast and little goes to clouds;
 * W18's fits of main flares used cloud shares of 40 to 100 % (Košice 40–60,
 * Benešov ~50, Chelyabinsk 75–85, Tagish Lake 80–100).
 *   (a) The objective, on two cases whose landed mass has a published
 *       reference: Chelyabinsk's median landed mass within a factor of three
 *       about 5 000 kg (1 667 to 15 000 kg; Popova's 4 000–6 000 kg and W18's
 *       fits of 5 000–6 500 kg); Tagish Lake's within 60 to 1 300 kg
 *       (Hildebrand et al.'s areal estimate to Brown et al.'s, both as W18
 *       gives them). A candidate meets it in a configuration where both
 *       medians are inside.
 *   (b) The constraint: no case's main-flare verdict worse than under the
 *       untuned priors, in that configuration.
 *   (c) The candidates, declared now and both run on every development case
 *       under the four configurations, on the same streams: T1, the cloud
 *       share uniform on 0.5–0.85; T2, the same and α uniform on 0.05–0.3.
 *       Nothing else changes.
 *   (d) The choice: the candidate meeting (a) and (b) in the most
 *       configurations, T1 on a tie (the smaller change). If neither meets
 *       (a) in any configuration, the untuned priors stay, the ground outcome
 *       is declared not credible in mass, and the proposal limits the claim
 *       to the atmosphere.
 *   (e) The tuned runs are shown beside the untuned, never in their place;
 *       the choice is frozen in the package. The other cases' landed masses
 *       are reported, and judged by nothing new.
 *
 * RULE 1161. THE VERDICT ON ROUND 1 (the reviewer, 24 September 2026,
 * evening): «ready in a restricted domain for an independent test of the
 * atmospheric release only» — a decision on the testability of one bounded
 * prediction, not a validation and not an adoption; no class B; the product's
 * engine unchanged. The development cases are read, the landed mass is
 * systematically too large, and W18 stays a partial comparison with its
 * discrepancies unresolved. The path, the reviewer's preference: the
 * atmosphere first — the branch frozen at its untuned priors, both structures
 * and both clouds, and tested alone on the release; a round on survival,
 * mandatory before any adoption of the full branch, run apart with its own
 * commits, versions and targets, asking which physical process or
 * representation is missing — never which interval brings Chelyabinsk and
 * Tagish Lake inside their targets; round 3's atmospheric outcome never used
 * to retouch the candidate judged in it. Before any reserved target, one
 * opening document of round 3 freezes, together: the exact version, the priors,
 * the four configurations with each one's results obligatory beside the
 * equal-weight mixture, and a decision rule that no mixture can make up for a
 * predefined severe structural failure, with the sensitivity to the weights
 * published and never chosen on the new events; the domain of 0.1 to 10 m —
 * the proposed upper bound of the candidate, not a domain verified in every
 * combination: the points exercised told from the perimeter, double peaks and
 * the atmosphere's sensitivity kept visible below 10 m — its boundary, its
 * non-completions and its nearly equal peaks; the reference atmosphere and
 * its uncertainty; the observable — the maximum of a reconstructed energy
 * deposition, primary where an event has one with its uncertainty, and a
 * luminous flare's altitude only as a qualified proxy with its own uncertainty
 * and weight, never one threshold for both — named event by event without
 * reading the reserved values; thresholds grounded on the sources' quality,
 * the pairing with Collins, and a rule against bands made wide; and a verdict
 * allowed on the atmospheric release only. Andrea's word: the opening
 * document, and the reconnaissance of round 2 now (rule 1158, metadata only,
 * no download), since the document must name each event's observables.
 */

/** Rule 1149: the map of the perimeter. */
export const FCM_DOMAIN_MAP = {
  halton: 240,
  bases: [2, 3, 5, 7],
  configurations: ['M1/unlimited', 'M1/capped', 'M2/unlimited', 'M2/capped'],
  reference: { stepM: 10, binM: 10, floorKg: 1e-3, maxComponents: 100_000 },
  retryComponents: 1_000_000,
  variations: [{ stepM: 5 }, { stepM: 20 }, { binM: 100 }],
  seed: 'fcm-round1/map',
} as const;

/** Rule 1150: the aggregated tail's candidates, largest first. */
export const FCM_AGGREGATED_TAIL = [1e-4, 1e-5, 1e-6] as const;

/** Rule 1151: peaks nearly equal. */
export const FCM_PEAKS = {
  secondaryShare: 0.95,
  separationKm: 1,
  dipShare: 0.9,
} as const;

/** Rule 1152: the development priors and structures. */
export const FCM_DEV_PRIORS = {
  firstStagePa: [40_000, 120_000],
  secondStagePa: [900_000, 5_000_000],
  m2: {
    rubble: [0.04, 0.16],
    debris: [0, 0.003],
    rubblePieces: 10,
    rubbleFactor: [1, 2],
    strong: [0.01, 0.03],
    strongFactor: [3, 10],
  },
  cloudCapRadii: 10,
  sigma: [1e-9, 1.6e-8],
  cDispersion: [1, 3.5],
  sizeScalingReferenceM: 1,
  extrapolationAboveM: 20,
  draws: 200,
  seed: 'fcm-round1/',
} as const;

/** Rule 1153: the atmosphere's table and its check. */
export const FCM_ATMOSPHERE = {
  tableStepM: 1,
  tableTopM: 120_000,
  check: 1e-6,
  earthRadiusM: 6.371e6,
  standardR0M: 6_356_766,
} as const;

/** Rule 1155: the body built to cascade to the floor. */
export const FCM_FLOOR_BODY = {
  diameterM: 0.5,
  densityKgM3: 3_000,
  speedMS: 20_000,
  angleDeg: 45,
  strengthPa: 100_000,
  alpha: 0,
  floorsKg: [1e-3, 1e-4],
} as const;

/** Rule 1156: the development runs' judgement. */
export const FCM_DEV_RUN = {
  releaseMarginM: 1_000,
  shareMargin: 0.1,
  minProducedShare: 0.1,
  w18ReadingM: 1_000,
  craterLawSpeedMS: 5_000,
  w18Cases: {
    Košice: {
      massKg: [1_170, 10_500],
      densityKgM3: [1_100, 3_400],
      speedMS: 15_000,
      angleDeg: 60,
      flaresKm: [37, 53],
    },
    Benešov: {
      massKg: [2_050, 8_200],
      densityKgM3: [2_000, 3_700],
      speedMS: 21_000,
      angleDeg: 81,
      disruptionKm: [65, 70],
    },
    'Tagish Lake': {
      massKg: [5e4, 1.8e5],
      densityKgM3: [1_640, 1_640],
      speedMS: 15_800,
      angleDeg: 18,
      flaresKm: [32, 36, 47],
      recordedMassKg: 16.3,
    },
  },
} as const;

/** Rule 1160: the registered tuning's objective and candidates. */
export const FCM_TUNING = {
  objective: {
    Chelyabinsk: [1_667, 15_000],
    'Tagish Lake': [60, 1_300],
  },
  candidates: {
    T1: { cloudShare: [0.5, 0.85] },
    T2: { cloudShare: [0.5, 0.85], alpha: [0.05, 0.3] },
  },
} as const;

/** Rule 1161: the verdict on round 1, and what it does not give. */
export const FCM_ROUND1_VERDICT = {
  verdict: 'ready in a restricted domain for an independent test of the atmospheric release only',
  domainUpperBoundM: 10,
  adoption: false,
  classB: false,
  productUnchanged: true,
  path: 'atmosphere first; survival as its own round, before any adoption',
} as const;
