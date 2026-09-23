/**
 * The seal of the impacts module.
 *
 * Andrea, 22 September 2026: the modules are to work as watertight
 * compartments, and a closed one is sealed **to the bit** — its numbers, its
 * drawing and the text of its report — so that work on anything else cannot
 * move an impact's answer without the build saying so. Two breakages of one
 * night came through the common code (the toll band, and
 * `outlinePointAtBearing`, which draws every module's labels): both would have
 * been caught here.
 *
 * This is not a validation round. No candidate physics is proposed, no number
 * is meant to move, and a seal is not evidence that an answer is right — it
 * says only that the answer has not changed. It protects a defect as faithfully
 * as a virtue, which is why the certification levels of the plan
 * (`~/Desktop/Nimbus-PIANO.md`, phases 2 to 6) sit on top of it and not under
 * it.
 *
 * Measured before the rules were written, on this machine: a sealed reading —
 * the pipeline, the layers in two languages and the report in two languages —
 * costs 17 ms on average over the eight presets (3.8 ms for Chelyabinsk,
 * 38 ms for Chicxulub), and serialises to about 100 kB. The set below is
 * therefore sized by its file, not by its clock: the digests are stored, the
 * serialisations are not.
 *
 * The rules, fixed on 22 September 2026, before the candidate was written, and
 * numbered after the eight hundred and twenty-five before them:
 *
 * 826. The candidate. A sealed reading is taken for every scenario of the set
 *      of rule 827, and holds four digests over a canonical serialisation
 *      (rule 829):
 *        (a) **the numbers** — the whole result of `safeRunImpact`, the
 *            validation block included, and the casualty plan the store builds
 *            from it, run against the population ladder of rule 828(c);
 *        (b) **the drawing** — `availableImpactLayers` in Italian and in
 *            English, which is what the globe draws and what the report prints;
 *        (c) **the text in Italian** and (d) **the text in English** — the
 *            whole of `buildImpactReport` in each language.
 *      A test recomputes all four at every commit and compares them with exact
 *      equality. Nothing of the product is changed by this round: the seal only
 *      reads.
 *
 * 827. The set. Three hundred and eight scenarios, fixed here and not chosen
 *      by their results:
 *      (a) the eight impact presets at their own inputs, each identified by its
 *          preset key;
 *      (b) three hundred drawn scenarios, identified by their index, stratified
 *          so the four families Andrea named are all present whatever the draw:
 *          indices 0 to 99 on land (no water, no shore within reach), 100 to
 *          199 on a coast (on land, with a sea at a written distance), 200 to
 *          299 at sea (a water column over the floor); and within each hundred
 *          the even indices draw a body of 1 to 100 m, which is the range that
 *          bursts in the air, and the odd indices a body of 100 m to 20 km,
 *          which is the range that reaches the ground.
 *      (c) The draw is `mulberry32` of `src/physics/montecarlo/sampling.ts`,
 *          seeded with the string `impact-seal-v1`, reading the fields in the
 *          order written in the candidate, so that the set is reproducible from
 *          the seed and the grid alone and no scenario is a stored input that
 *          somebody could quietly edit.
 *
 * 828. The fixtures, which are fixtures and not physics.
 *      (a) The grids of rule 827 — diameters, velocities, densities, angles,
 *          strengths, water depths, shore distances, azimuths — are the ranges
 *          a visitor can set in the panel, and are written in the candidate
 *          beside this file.
 *      (b) A sealed scenario is a set of inputs, not a place: the seal does not
 *          derive a water depth, a shore distance or a beach slope from the
 *          terrain, it is given them.
 *      (c) The casualty plan is run against a written population ladder — a
 *          thousand people inside the first band and ten times as many in each
 *          band outward — so the mortality arithmetic is sealed without the
 *          seal pretending to know who lives anywhere.
 *
 * 829. The serialisation. Canonical and lossless, or the seal is a seal on
 *      something else: object keys sorted, arrays in their own order, every
 *      number written so that it reads back to the same double — negative zero,
 *      the infinities and NaN distinguishable from the numbers and from each
 *      other, which JSON alone does not do. The digest is SHA-256 of that text.
 *      A ground field, whose samples run to megabytes, is serialised as its
 *      dimensions, its extent and the digest of its samples: the comparison
 *      stays at the bit, the file does not carry the grid.
 *
 * 830. What the seal file holds, beside the digests: for every scenario, the
 *      inputs it was built from and a short table of its key numbers — the
 *      energy, the burst altitude, the transient and final crater, the air
 *      blast at 5 and 1 psi, the third-degree burn, the ejecta's reach, the
 *      seismic magnitude, the wave at the source, and the counts of layers,
 *      isolines and report rows. The digests are what decides; the table is so
 *      that a broken seal says what moved instead of only that something did.
 *
 * 831. What is not sealed, named and not changed. The derivation of the
 *      terrain-given inputs — water depth, shore distance, beach slope — and
 *      the search for the shore and the wave's seeds, which only the running
 *      app does and which the benchmark reads through a browser; the population
 *      exposure, which comes from the network; the bathymetric solver's wave
 *      map, its crest and its run-up markers; the Monte Carlo. They enter the
 *      seal as written inputs (rule 828(b)) or not at all. Sealing them wants
 *      the app running, and is a round of its own — the e2e workflow already
 *      runs on every commit that touches code, and is where it will go.
 *
 * 832. What decides.
 *      (a) Run twice on an unchanged tree, the seal reproduces every digest.
 *      (b) A deliberate change of one bit in the impacts pipeline — a
 *          coefficient moved in the last place it has — turns the test red and
 *          names the scenario and which of the four digests moved. Tried on a
 *          scratch tree and reverted; the seal is not sealed against a change
 *          it has not been shown to catch.
 *      (c) The whole seal runs in under sixty seconds on the CI runner, and its
 *          file stays under half a megabyte.
 *      (d) The product's bundle does not grow: nothing the browser ships
 *          imports the seal, and the bundle-size budget is unchanged.
 *      (e) The release gate stays PASS and the validation report is regenerated
 *          once.
 *      (f) Typecheck, lint, format and the whole test suite stay green.
 *      Any of these failing refuses the candidate.
 *
 * 833. Re-sealing. The seal is remade only when the impacts module is
 *      deliberately opened, and the regeneration records in the file, in one
 *      line each: the date, the commit it was taken on, the rule or the bug
 *      that opened the module, and what moved. A regeneration without a reason
 *      is the one thing this round exists to prevent, so the script refuses to
 *      run without one, and no workflow ever regenerates the file: the CI only
 *      compares.
 *
 * 834. What an adoption does. The ROADMAP takes the plan of the watertight
 *      compartments — seal, shell and contract, the move of the impacts into
 *      their own module, the boundaries held by the lint — as Andrea asked on
 *      22 September, and the seal's file carries its first reason: sealed at
 *      the commit that adopts this, nothing moved.
 *
 * 835. What may not happen. No constant of the model is introduced or touched;
 *      no physics, no drawing and no text of the product is changed by this
 *      round; no existing test is weakened to make the seal fit. If a digest
 *      moves in a later round for a reason that was written first, it is
 *      re-sealed under rule 833 — never by regenerating until the build turns
 *      green.
 */

/**
 * The outcome of the round, written after the candidate was measured, on
 * 22 September 2026. The rules above were pushed in commit 246bfac before the
 * candidate was written.
 *
 * ADOPTED. Rule 832 holds on every clause.
 *
 * (a) Read twice on an unchanged tree, all 1 232 digests of the 308 scenarios
 *     reproduce; the second reading of five scenarios taken apart from the
 *     first is identical too, so no reading depends on a clock or on what the
 *     scenario before it left behind.
 *     [Corrected on 23 September 2026, rule 836: on the same machine. Read on
 *     the CI runner, on another Node, 782 of the 1 232 moved — "reproduces"
 *     held on one engine and was written as if it held on every one.]
 * (b) One unit in the last place of the chondritic density — 3 000 to
 *     3 000.000 000 000 000 5 kg/m³, tried on a scratch tree and reverted —
 *     turns the test red on eleven digests of four presets, and the message
 *     names each: `preset:TUNGUSKA — numbers moved`, energy
 *     9.122 932 777 513 38 → 9.122 932 777 513 382 Mt. Where the change is
 *     deeper than rule 830's table the message says so rather than pretending
 *     to explain it: Chicxulub's numbers move with no key number moving.
 * (c) The whole seal runs in 5.3 s, a ninth of the sixty seconds allowed, and
 *     the file is 351 kB, a third under the half megabyte — one line per
 *     reading, so a moved digest is one line of the diff.
 * (d) Nothing the browser ships imports `src/seal/`; the bundle-size budget is
 *     unchanged.
 * (e) The release gate stays PASS and the validation report was regenerated
 *     once.
 * (f) Typecheck, lint, format and the whole suite stay green.
 *
 * What the set turned out to cover, which the grid was written to reach but
 * could not promise: all three entry regimes (161 partial airbursts, 144
 * complete, 3 intact) and all five origins of a crater (152 dug by the body,
 * 136 none, 14 a strewn field, 5 an iron swarm, 1 a low burst), across 107
 * scenarios on land, 100 on a coast and 101 at sea.
 *
 * One thing the round found without looking for it: an impact input with no
 * `surfaceGravity` is refused by the schema, though the field is optional in
 * the type and `simulateImpact` has a default for it. The first draw of three
 * hundred scenarios was refused whole. Named here, not changed — it is not
 * this round's business, and the seal now passes Earth's gravity as the
 * presets do.
 */
export const IMPACT_SEAL_OUTCOME =
  'ADOPTED 22 September 2026: the impacts module is sealed to the bit — 308 scenarios, four digests each (numbers, drawing, report text in Italian and in English), 5.3 s on every commit. One unit in the last place of a density turns it red and names what moved. To the bit on one engine and one platform: the Node pinned in .nvmrc, on macOS arm64 (rules 836 and 837).';

/**
 * 836. The engine. Written on 23 September 2026 after the CI had read the seal
 *      of commit bd01331 red, so written knowing what it answers — and said so.
 *      [Its diagnosis is corrected by rule 837: neither the Node release nor
 *      its ICU moved the digests; the platform did. Its clauses stand.]
 *
 *      On the CI runner (Node 20, Linux x64), 782 of the 1 232 digests taken on
 *      Andrea's machine (Node 22.20.0, ICU 77.1, macOS arm64) moved, and not
 *      one of rule 830's key numbers did. Two causes, both of the engine and
 *      neither of the model. The drawing and the report format their numbers,
 *      and the report its date, through ICU, whose locale data changes between
 *      Node releases: on ICU 77 Italian writes 1234,5 with no separator of the
 *      thousands. And Meteor Crater's numbers moved as well, though they hold
 *      no formatted text at all: the engine's arithmetic itself answered with
 *      another last bit somewhere. Which of V8's routines, the failed run does
 *      not say — its message reads only rule 830's table, which did not move.
 *
 *      So a seal to the bit is a seal on an engine, and it names its engine:
 *      (a) the seal's file records the Node version it was read on, that
 *          Node's ICU, and the platform;
 *      (b) the repository pins one Node version, exact to the patch, in
 *          `.nvmrc`, and the CI's verify job runs on that;
 *      (c) the test refuses to compare digests on another Node or ICU and
 *          says why, instead of listing hundreds of digests that moved for a
 *          reason that is not the module's; and it fails if the seal's Node
 *          is not the one `.nvmrc` pins;
 *      (d) the re-seal script refuses to run on any Node but the pinned one;
 *      (e) moving the engine is a re-seal under rule 833, with the move as its
 *          reason, and it is a decision taken for itself — never a side effect
 *          of another change.
 *      The platform is recorded and not compared. V8 ships its own Math
 *      routines instead of the system's, but whether the same Node answers
 *      alike on the runner's x64 and on an arm64 Mac is not known here: it is
 *      read by the first CI run after this rule. If it does not, the platform
 *      joins clause (c), and the seal is taken where the CI compares.
 *
 *      What this does not change: the seal is still a statement about Node.
 *      A browser runs its own engine, with its own ICU, and the seal says
 *      nothing about the last bit a visitor's browser computes — it guards the
 *      code against change, not the arithmetic of every machine that runs it.
 */

/**
 * 837. The platform. Written on 23 September 2026 after the CI had read the
 *      seal of commit 943336a red as well — so written, like rule 836, knowing
 *      what it answers.
 *
 *      Rule 836 named the wrong cause. The verify job ran on the pinned Node,
 *      22.20.0 with ICU 77.1 — its check of the engine passed — and the same
 *      782 digests moved, to the same values, digest for digest, as they had
 *      on Node 20. So neither the Node release nor its ICU moved them: the
 *      platform did. The same Node answers with other last bits on the
 *      runner's Linux x64 than on the arm64 Mac the seal was taken on —
 *      through the processor or through the system beneath the engine, the
 *      run does not say. That the report's texts moved with the drawing is no
 *      second cause: a report's figures carry the drawing's layers, so a moved
 *      drawing moves both texts.
 *
 *      So the seal is compared where it is taken:
 *      (a) the platform is compared beside the Node and its ICU; the seal
 *          names it, and `SEAL_PLATFORM` pins it: darwin-arm64;
 *      (b) the CI compares the digests in a job of its own on GitHub's macOS
 *          arm64 runner, on the Node `.nvmrc` pins; the job sets
 *          NIMBUS_SEAL_REQUIRED, so a runner of another platform fails it
 *          instead of skipping it;
 *      (c) everywhere else the comparison is skipped under a name that says
 *          where it is made — on the verify job's Linux x64 among them, where
 *          the rest of the seal's test still runs: the set, the pins, a
 *          scenario read twice, the reasons;
 *      (d) the re-seal script refuses any other platform.
 *      Pinning the Node stays: a release can move the digests as well, and
 *      moving the engine stays a decision taken for itself.
 *
 *      Whether the runner's macOS reads the same bits as the Mac the seal is
 *      taken on — the same processor family and the same Node binary, but not
 *      the same system — is read by the first run of that job. If it does not,
 *      the seal is taken where the CI compares, and this rule says so.
 *
 *      Read the same night, on commit 8b46921: the job's first run passed.
 *      GitHub's macOS arm64 runner reproduces every one of the 1 232 digests
 *      taken on the Mac, in 17 seconds, and the verify job on Linux x64 skips
 *      the comparison as clause (c) says. The seal holds across two machines of
 *      one platform — which is what rule 832(a) had claimed for every machine.
 */

/**
 * 854. Node 24. Written on 23 September 2026, before Node 24 has run a line of
 *      this repository, on Andrea's word of that morning («node24 se dici che
 *      è ora di passarci lo facciamo»): a move of the engine taken for itself,
 *      as rule 836(e) asks, and nothing else in the same commit.
 *
 *      Why now. Node 22 leaves maintenance at the end of April 2027, Node 24
 *      at the end of April 2028. The blind tests of the plan's phase 3 must
 *      run on the engine the rest of the plan keeps, so the engine moves before
 *      they are asked and not between them. The release is 24.21.0 (7
 *      September 2026, V8 13.6), the newest of the long-term line 24 when this
 *      is written — not 26, which is not yet a long-term release.
 *
 *      What moves: `.nvmrc`, from 22.20.0 to 24.21.0, which every workflow
 *      reads; the guides that name the Node to install; and the seal, re-taken
 *      under rule 833 with the move as its reason. No line of the model, of
 *      the drawing or of the report is touched.
 *
 *      What decides — every clause, or `.nvmrc` stays at 22.20.0:
 *      (a) Before the seal is re-taken, the 308 scenarios are read on Node
 *          24.21.0, on the Mac, and compared with what Node 22.20.0 answers on
 *          the same commit. Every number digest that moves is explained number
 *          by number: no number of a scenario's result or toll differs between
 *          the two engines by more than one part in 10¹² (or 10⁻¹² where one
 *          of the two is zero). A number that moves by more is a defect to be
 *          found before the engine moves.
 *      (b) Every drawing and text digest that moves is explained: the two
 *          engines' drawings and texts differ only in what ICU formats (the
 *          separators and spaces of numbers and dates) or in the last digits
 *          of a number (a) let move. Each kind of difference is listed in the
 *          outcome with one example.
 *      (c) Level A reads the same: the evidence table's figures do not move,
 *          and the validation report, regenerated once, moves nowhere but
 *          where it names the engine.
 *      (d) On Node 24.21.0: typecheck, lint, format, the whole suite with
 *          coverage, the strict gate PASS, and Chromium's end-to-end suite;
 *          then, on the commit that moves `.nvmrc`, every job of the CI green,
 *          the `seal` job on macOS arm64 comparing the new seal.
 *      (e) Node 22.20.0 stays installed on the Mac beside it until (d)'s CI
 *          is green, so (a) can be read again.
 *
 *      What it does not change: the site. A visitor's browser runs its own
 *      engine; this moves only the one the tests, the seal and the scripts
 *      run on.
 *
 *      Read the same morning, on commit 7e6fd61, once: REFUSED by clause (a),
 *      by its letter. `.nvmrc` stays at 22.20.0.
 *
 *      (a) NOT MET. Node 22.20.0 reproduced all 1 232 digests of the seal. On
 *          Node 24.21.0 the number digests of 300 of the 308 scenarios moved:
 *          32 911 numbers, of which 32 910 within one part in 10¹² — the
 *          largest 1.3 × 10⁻¹³, the exposures of a flash in the air. One did
 *          not: the first-degree flash radius of `drawn:014`, 1 128.403 157 199 8 m
 *          on Node 22 and 1 128.403 157 196 4 m on Node 24, 3.0 × 10⁻¹².
 *          The cause, found. Of V8's Math routines only `Math.pow` (and `**`)
 *          answers differently between V8 12.4 and 13.6 — by one unit in the
 *          last place, for about one argument in eleven; exp, log, the
 *          trigonometric and hyperbolic functions, cbrt, hypot and sqrt answer
 *          alike to the bit on 200 000 arguments each. The flash radius is
 *          read between two tabulated exposures by a log-log interpolation
 *          whose denominator is the logarithm of their ratio; where the two
 *          are close, it multiplies the exposures' 1.3 × 10⁻¹³ by about 23.
 *          That is the conditioning of a radius read where the exposure is
 *          nearly flat, not a defect of the physics — but the clause was
 *          written as a bound, and a number past it.
 *      (b) MET, read for the record. No word and no format moved: ICU 78.3
 *          writes every number and date of the report as 77.1 did. The 232
 *          drawings and report texts that moved did so only through the
 *          colours a field paints along its ladder of ranges: 10 851 colour
 *          channels by at most 2.1 × 10⁻¹² of 255, and in 25 ejecta fields
 *          the outermost rung — sampled exactly at the field's edge, where the
 *          thickness equals its threshold — painted on one engine and not on
 *          the other.
 *      (c), (d) Not run: the engine does not move. (e) Both engines stay on
 *          the Mac; nothing links to Node 24.
 *
 *      What was learned, for the next move: an engine moves the last bits of
 *      one routine, and a model's conditioning decides how far they travel. A
 *      bound for the next move should be set per number from that — not a
 *      single figure written before the conditioning was known, as this one
 *      was. Node 22 is maintained until the end of April 2027, and Node 26
 *      becomes a long-term release in October 2026: one move, to 26, can
 *      replace this one.
 */
