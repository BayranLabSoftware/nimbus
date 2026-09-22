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
  'ADOPTED 22 September 2026: the impacts module is sealed to the bit — 308 scenarios, four digests each (numbers, drawing, report text in Italian and in English), 5.3 s on every commit. One unit in the last place of a density turns it red and names what moved. To the bit on one engine: the Node version pinned in .nvmrc (rule 836).';

/**
 * 836. The engine. Written on 23 September 2026 after the CI had read the seal
 *      of commit bd01331 red, so written knowing what it answers — and said so.
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
