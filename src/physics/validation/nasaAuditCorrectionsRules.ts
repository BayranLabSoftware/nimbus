/**
 * Rules 1193 onward — the corrections the NASA-lab audit of 25 September 2026
 * found (`~/Desktop/Nimbus-audit-NASA-2026-09-25.pdf`, commit 04eefcd,
 * verified figure by figure against the repository before any of this was
 * written). Andrea's word: follow the audit to the letter, do all of its
 * "correzioni immediate" (A2, A7, A8, A11, A12 of the audit's own numbering),
 * and take no other decision without asking him first. This file is the
 * "regole scritte prima" for that work — one rule per correction, written
 * before the code that makes it, in the order `Nimbus-PIANO.md` sets.
 *
 * RULE 1193. A2 — THE SCORECARD MUST COUNT WHAT IT PRINTS IN PROSE.
 *
 * The defect, in the audit's words: I2 reads "met" because, since the
 * amendment of 16 September 2026, it is scored against the Earth Impact
 * Effects Program's own entry on the same 357 fireballs, not against the
 * altitude of peak brightness the rule asked for as first written; I3 reads
 * "met" after two amendments of 21 September 2026, the second of which
 * rewrote its 90 %-of-runs clause into "matches whatever the field's own
 * tool achieves" in the same commit that first computed what the field's own
 * tool achieves (27 of 43, 63 %) — `git show f71dcb3` says so in its own
 * message: "the runs became scorable this afternoon ... and at them the
 * band ... holds 27 of 43 ... Recorded beside the amendment." That is a
 * bound written knowing the figure, which `docs/GOLD_STANDARD.md` has
 * forbidden since it was first written ("never loosened after a figure has
 * failed it"). Both rules' evidence text already says as much in prose —
 * "under the bound as first written, not met" appears for both — but the
 * *counted* status, the one field `ruleHolds` reads and the one the 8.0 of 9
 * on the public scorecard is built from, only ever reflects the amended
 * reading. A reviewer who reads the number and not the paragraph sees a
 * validation that is not there.
 *
 * This project's own rule already says how to fix it, and has since
 * commit 955c096: "A bound changes only by a dated amendment in this file
 * that says why ... and it is never loosened after a figure has failed it."
 * The 16 September amendment kept to that — it left I2 *pending*, not met,
 * because the reference had not yet been run, and only crossed to "met" in
 * a later, separate commit (8c401e8) once the program's own 357-fireball run
 * was in hand. The second 21 September amendment to I3 did not keep to it:
 * it rewrote I3's own bound in place, in the same commit that first computed
 * the figure the rewritten bound would need to pass.
 *
 * The fix, exactly as the audit's "come migliorare" asks: freeze I2 and I3
 * as first written, permanently, at the status their own original bound
 * gives them — never edited again, whatever a future amendment measures.
 * What the 16 September and 21 September amendments were actually
 * measuring — agreement with a tool of the field, not agreement with the
 * sky — becomes its own rule, numbered fresh (I5 for the fireball entry,
 * I6 for the airburst band), counted beside I2 and I3 and never merged into
 * them again. No number in either rule's evidence changes; the fireball
 * figures (13.74 km median, 12.75 km mean against the model; 13.68 and
 * 12.69 for the program) and the airburst figures (3.34× to 3.79× width,
 * 27 of 43 runs, both footprints held) are the ones already committed. What
 * moves is which rule they are counted under.
 *
 * One consequence stated before any code changes it: the Impacts domain's
 * reading on the public scorecard drops from 8.0 to whatever eleven rules
 * with I2 and I3 permanently at their original credit give it — computed
 * below, not chosen. This is the point of the fix, not a side effect of it.
 *
 * A second, separate correction the same rule covers: Level A
 * (`eiepComparison.ts`) pins `strengthLaw: 'density'` and
 * `craterDomain: 'legacy'` for every row of the 1 865-case grid, which is
 * not what the product ships (`DEFAULT_STRENGTH_LAW` is `'twoStage'`,
 * `DEFAULT_CRATER_DOMAIN` is `'hypervelocity'`). Pinning the reference's own
 * assumptions is the right way to ask "does the model implement Collins et
 * al.'s formulas correctly" — G1's question — and I1's clause text already
 * says so for the departures it names. It is the wrong way to answer a
 * different question the scorecard does not currently ask at all: how far
 * the configuration the product actually ships is from the program on the
 * same grid. Rule 1193(b) below runs the grid a second time on the shipped
 * configuration and prints both counts side by side; it changes no clause of
 * I1, because I1 is not the rule this was ever the wrong answer to — the gap
 * was that no rule asked the other question.
 *
 * RULE 1193(a). No figure computed for this rule may be adjusted after it is
 * read. The fireball and airburst figures are the ones already committed
 * (rules 126–128, 706–713); nothing is re-run to make a number more
 * favourable, and if the shipped-configuration grid of 1193(b) reads worse
 * than the pinned one, that is printed exactly as it reads.
 *
 * RULE 1193(b). Level A a second time, on the shipped configuration
 * (`strengthLaw: 'twoStage'`, `craterDomain: 'hypervelocity'`, the two
 * fields `eiepRowInput` pins today), same grid, same rows, same ε and the
 * same three bands (<2 %, 2–10 %, >10 %); printed beside the pinned-grid
 * count under a heading that says which is which, in the validation report
 * and nowhere it could be read as the same number twice.
 */
export const RULE_1193_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194. A11 — TWELVE PUNCTUAL DEFECTS ON THE DEFAULT PATH, TAKEN IN THE
 * ORDER THE AUDIT LISTS THEM. Each moves a number or a declared status, so
 * each is its own paragraph below, written before its fix, with a verdict:
 * fixed now, or left open and said so — never silently dropped.
 *
 * (1) The Monte Carlo and the toll band drew a fresh impact angle from
 *     sin 2θ on every iteration, discarding the caller's own angle
 *     (`impactMonteCarlo.ts:99`, shared by `tollBand.ts` through
 *     `impactSampler`) — documented as deliberate in the file's own
 *     docstring, which is what made it easy to miss as a defect rather than
 *     a choice. FIXED: `impactAngle` joins `surfaceGravity`, `waterDepth`
 *     and `impactorStrength` on the list of inputs this wrapper does not
 *     resample — the scenario's own chosen geometry, not a measured orbital
 *     parameter. `sampleImpactAngle` itself is untouched (it still states a
 *     real, citable distribution) and is simply no longer called from here.
 *
 * (3) The firestorm hazard's `low = mid = 0` (declaring that the model
 *     cannot say a mass fire forms at all, not merely that its rate is
 *     uncertain) silently zeroes `tripleSigmaLn`'s guard, so
 *     `withVulnerabilityScatter` gives it no dispersion of its own — a
 *     named cause of the band missing the record on 9 of 10 Japanese-city
 *     held-out rows. FIXED as a **declared exclusion**, the audit's own
 *     second option: both `tripleSigmaLn` and `FIRESTORM_MORTALITY` now say
 *     in comments that this is why, not an accident. NOT fixed: the band's
 *     actual coverage gap, which needs an occurrence-probability model this
 *     round has no grounds to invent — said plainly, not implied fixed.
 *
 * (12) Three implementations of the 1976 US Standard Atmosphere
 *      (`atmosphere/ussa1976.ts`, `effects/ussa1976Entry.ts`,
 *      `effects/standardAtmosphere.ts`) carry the universal gas constant,
 *      and one of the three read the modern CODATA value (8.314462618)
 *      where USSA-76 §1.3.1 fixes its own, 8.31432 — the other two already
 *      had it right. FIXED: `ussa1976.ts`'s `R_STAR` corrected to 8.31432.
 *      NOT fixed: "a single implementation", the audit's own preferred
 *      remedy — the three serve three different, largely non-overlapping
 *      callers (volcano ashfall, volcano plume height, an atmosphere-table
 *      validation script), and merging them safely is a refactor of its
 *      own, not a constant fix; left open rather than rushed.
 *
 * (10, partial) The taxonomy selector already had a note saying it fills
 *     strength alongside density; it did not say that giving a strength
 *     takes the entry off the two-stage default onto that single class
 *     value. FIXED: the note now says so, in both languages
 *     (`ImpactCustomInputs.tsx`'s `taxonomyNote`). NOT fixed: the deeper
 *     inconsistency -- the measured cells and their accuracy band still
 *     hold only at exactly 3 000 kg/m³ with no strength given, so no
 *     taxonomy choice and no preset falls inside one; aligning module,
 *     default and cells is a design decision, not a label.
 *
 * (7)/(8) Constants "read backward from the program's output" or "without a
 *     citation": most of what the audit's compressed list names already
 *     carries an honest comment saying so on inspection —
 *     `BLEND_HALF_WIDTH` (airburstBlast.ts) names the program's blend by
 *     construction; `PROGRAM_WATER_CRATER_COEFFICIENT`
 *     (tsunami/impactProgram.ts) is titled "as the program computes it";
 *     `NEAR_SLOPE`/`MID_SLOPE` (seismic.ts) already say which paper
 *     equation and which printed decimal they refine; the ejecta
 *     asymmetry's 0.3 already says "not a published fit";
 *     `IRON_FIELD_CUT_DIAMETER` already says "the project's, with no
 *     source." Two genuinely carried no comment at all: the seafloor
 *     crater's 1/3.4 exponent (`simulate.ts`) and `IRON_DENSITY = 6 000`
 *     (`ironCraterField.ts`). FIXED: both now say, in place, that they are
 *     the project's own with no primary source — flagged, not replaced,
 *     since this round has no researched alternative to put in their
 *     place. NOT fixed: finding or ruling out a primary source for either.
 *
 * Left open, not started this round, said so rather than left silent: (2)
 * DONE as rule 1197, see below; (4) read further below (the audit's own
 * citation checked and found not to say what the audit says it says);
 * (5) read further
 * below (liquefaction's own domain); (6) DONE, see below; (9) read
 * further below (the reference's own unsolved problem); (10, the rest)
 * measured cells that hold only at exactly 3 000 kg/m³ with no strength
 * given, so no taxonomy choice and no preset falls inside one
 * (`entryCells.ts`) -- the note is fixed, the underlying inconsistency is
 * not; (11) 46 `as number` casts in `simulate.ts` and bare numbers in mixed
 * units elsewhere. Each needs either a design decision this file is not the
 * place to make alone, or research this round has not done — continued in
 * a later block of the same round, not abandoned.
 */
export const RULE_1194_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (2), READ FURTHER: the two blast laws are not a loose
 * end that only needs picking one -- `casualties.ts` already knows what
 * the right answer is and does not do it. Its own comment above
 * `BlastCasualtyInput.chemicalBlast` says: "The band edges [12 psi, 2 psi]
 * follow it, so that the 12 psi and 2 psi circles sit on the same curve
 * as the rings they are measured from. Read only for a chemical charge."
 * `blastCasualtyPlan`'s `ratio()` branches on `input.chargeType ===
 * 'chemical'`; an impact is never that charge type, so it always falls to
 * `overpressureRadiusRatio`, which calls `distanceForOverpressure`
 * (`events/impact/damageRings.ts`) -- a bisection against
 * `peakOverpressure`, a FIXED Kinney-Graham-family law, regardless of
 * which law actually drew the 5 psi and 1 psi rings the 12 psi and 2 psi
 * ones are meant to sit on. For a ground impact those rings come from
 * `groundImpactOverpressure`'s `programHeld` default (Collins et al.'s
 * Eq. 54 family, not Kinney-Graham); for an airburst, from
 * `airburstOverpressureRange`. Neither is invertible by the same bisection
 * `distanceForOverpressure` already does for the fixed law -- that
 * bisection pattern is right, it is just closed over the wrong function.
 * No new bisection is even needed: `groundImpactReach` and `airburstReach`
 * (`effects/airburstBlast.ts`), the inverse of the two laws that draw the
 * 5 psi and 1 psi rings themselves, already exist and are presumably what
 * draws those rings today. `blastCasualtyPlan` cannot call them as it
 * stands -- `BlastCasualtyInput` carries the two radii already computed,
 * not the burst altitude, yield and ground range those functions need --
 * so the fix is a threading change (`useAppStore.ts` to `casualties.ts`),
 * not a missing piece of physics.
 *
 * DONE, in a later block of this same round, as rule 1197: the numeric
 * size of the shift was measured against every development case before
 * being trusted (not assumed small because the reasoning is sound), and
 * came back under 8% everywhere, with the airburst fallback exactly
 * unchanged by construction -- see rule 1197 and its own measurement note
 * for the full account. This paragraph is kept as the investigation that
 * led there, not restated.
 */
export const RULE_1194_ITEM_2_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1195. A12 — TEXTS THE INTERFACE PRINTS THAT ARE FALSE OR UNDISCLOSED,
 * TAKEN AS FOUND, NOT IN THE AUDIT'S OWN ORDER. Started in the same block as
 * rule 1194's first items because each fix is a sentence, not a redesign.
 *
 * - The impact-angle methodology note said the angle "does not change the
 *   airburst altitude" -- false: it does, through sin θ in the same
 *   equation that reads strength and speed (`atmosphericEntry.ts:591`).
 *   FIXED in both languages.
 * - Popigai and Boltysh's diameters are chosen so the model's own crater law
 *   reproduces the crater observed for each, not measured independently --
 *   their preset notes said only the crater size and the (independent)
 *   composition source, not this. FIXED: both notes now say the diameter is
 *   circular with the crater, not a check of it.
 * - The landing page said "every estimate carries its own uncertainty
 *   interval", which is not true of the third-degree burn radius or the
 *   5 psi and 1 psi rings, all single values today. FIXED: reworded to what
 *   is true of every quantity -- that each is marked with what it is
 *   checked against.
 * - The taxonomy selector's own note said it fills strength alongside
 *   density; it did not say that doing so moves the entry off the two-stage
 *   default. FIXED (see rule 1194's note on item 10) -- the underlying
 *   inconsistency with the measured cells is not.
 *
 * - The 13/13 validation tile (`ValidationPage.tsx`,
 *   `LandingValidation.tsx`) is a count over its own count, always 100 % by
 *   construction -- not fixable by computing a different number this round
 *   has grounds to invent, but its label called that "quantities agreeing
 *   with the reference program", which claims a threshold the number never
 *   tested. FIXED: relabelled "quantities compared against the reference
 *   program" in both places and both languages -- and, found while reading
 *   it closely, the figure beside it is `Math.abs(geometricMean - 1)`, the
 *   widest departure of a GEOMETRIC MEAN, which both labels called a
 *   "median" -- corrected too.
 * - README.md claimed "full keyboard navigation" flatly. The WCAG suite
 *   (`tests/e2e/a11y.spec.ts`) excludes the Cesium/R3F canvas from its own
 *   audit by name, with a comment saying why (axe cannot introspect a
 *   WebGL surface) -- so the claim was verified for the panel and dialogs
 *   only, never for the globe, where picking a point still needs a click
 *   or a searched city name. FIXED: reworded to say which is which.
 *
 * Left open, not started this round: the azimuth cursor not saying it moves
 * nothing for an airburst -- which the
 * panel cannot know until the scenario is simulated, so a text fix alone is
 * not enough; P10/P90 circles and the Monte Carlo probability map drawn
 * without a legend entry or a grammar state; the printed report's missing
 * fields (burst/breakup altitude, final speed, I2's band, the measured
 * cell's verdict, azimuth, the Monte Carlo table, active model variants);
 * silent field-validation failures; the terrain 8 s timeout that turns an
 * ocean site into land with no warning.
 * Several need code most of the way through the render path this round has
 * not read carefully enough to touch safely -- left open and said so.
 *
 * [Correction, a later round, after reading A12's own page of the PDF in
 * full rather than through this file's own paraphrase (the mistake rule
 * 1199 named for A7, repeated here for A12): "the keyboard-navigation
 * claim" was NOT a slip to strike. The audit's own sentence is "il globo
 * non e' operabile da tastiera nonostante il README" -- not "the claim is
 * false" (which this rule's third paragraph above did fix, by reading
 * README's wording down to the panel and dialogs) but a functional gap:
 * the globe itself has no keyboard path, and the audit's "come
 * migliorare" names two possible fixes, not one -- "tastiera O inserimento
 * di coordinate" (keyboard OR coordinate entry). Wording the claim
 * honestly did not close this; conflating the two -- as the struck
 * paragraph below did -- would have let a real open item disappear under
 * a correct-sounding sentence. Left open, correctly, until it is done.]
 */
export const RULE_1195_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1196. A8 -- THE RELEASE GATE COUNTED AN OPEN BUG AS A CLOSED ONE.
 * Written after the fix (`scripts/release-readiness.ts`, block 1 of this
 * round) because the fix itself was small and mechanical enough to write
 * alongside its own discovery; the investigation that followed is the part
 * worth a rule.
 *
 * The defect: `checkBugRegistry`'s `looksFixed` test accepted any non-empty
 * fix-column text other than `pending`, `tbd`, `n/a` or `-` -- so a row
 * whose fix column literally reads `OPEN` (B-091) or `OPEN: rules 987 to
 * 991 refused; ...` (B-126) passed the gate as though it were closed. FIXED:
 * `!fix.startsWith('open')` added to the rejection list.
 *
 * What running the corrected gate found, not assumed: B-077 and B-083 are
 * ALSO open with a literal "OPEN"/"pending" fix column, and were passing
 * the same way -- two defects this fix uncovers that neither this round nor
 * the audit named, both in the earthquake domain (extended-source
 * thresholds), both out of scope for a round that is impacts only (see
 * `nimbus-solo-impatti`). Named here, not fixed here, and not silently
 * left off the list: `docs/BUG_REGISTRY.md` already has their rows, this
 * finding just means the gate will correctly say NO-GO until they close,
 * where before it did not.
 *
 * B-091 and B-126 were asked for a regression test each (rule 1194's own
 * text on item (3) is not this rule's; A8 asked separately, "test per
 * B-091 e B-126 prima di ogni altro lavoro"). Both investigated, neither
 * written:
 *
 * - B-126's own row cites a test, `craterDomainRules.test.ts`, that does
 *   not contain it -- confirmed absent from the whole test suite, not
 *   merely misfiled. Not written this round: the row names three refused
 *   sub-fixes (the flash's ground term, the rings' oblique envelope, the
 *   timeline's seismic stage) whose current, still-open shape this round
 *   has not read carefully enough to turn into an honest test rather than
 *   a guess.
 * - B-091's own row gives a reproduction (`impactorDiameter:
 *   2.098110449261881 * 1.01` bursting where the undoubled body lands
 *   whole). Run against today's code across a 0.99x to 1.02x scan of the
 *   same body: EVERY point in that range already reads COMPLETE_AIRBURST,
 *   including the undoubled one the row calls whole. The reproduction is
 *   stale -- entry physics has moved since 21 September 2026 (rules 691 to
 *   697 among others) -- and a test written to it now would either fail on
 *   arrival or silently test nothing. A test was drafted, found to fail
 *   this way, and withdrawn rather than adjusted to pass: adjusting a test
 *   to match whatever the code currently does, after finding the one it
 *   was asked to write does not, is exactly the kind of after-the-fact
 *   fit this project's own rules forbid elsewhere. Whether the underlying
 *   defect (a sharp jump at I_f = 1) still exists somewhere in the input
 *   space, or was incidentally resolved by later work, is not this
 *   round's to decide -- flagged for the reviewer, not guessed at.
 */
export const RULE_1196_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (9), READ FURTHER: the reference this project verifies
 * against admits, in its own text, that it never solved this.
 *
 * Collins, Melosh & Marcus (2005), read directly (not from an abstract or
 * a summary), on their own air-blast equation: "the peak overpressure
 * decays to zero at distances so small (<1 km) that the curvature of the
 * Earth may be ignored. Neither of these assumptions applies to larger
 * impacts... In the future, we hope to examine the effect of a
 * variable-density atmosphere and a curved Earth on the blast wave decay
 * using numerical modeling." No published follow-up does this -- Collins
 * et al. 2017 (the Mach-stem paper this project also cites) stays
 * near-field, curvature unmentioned. In place of a geometric correction
 * the 2005 paper offers only a blunt margin: "Equation 44 probably
 * overestimates the blast wave effects by a factor of 2-5" for large
 * impacts, and its Discussion attributes the gap from Toon et al. (1997)
 * to "our neglect of the effects of Earth curvature." Tellingly, the same
 * paper DOES apply a rigorous spherical correction elsewhere -- the
 * fireball's horizon (its Eq. 36-37, h = (1-cos Δ)·R_E) -- so the authors
 * had the tool and chose not to extend it to the blast.
 *
 * What this means for this round: deriving and shipping a spherical
 * correction to Kinney-Graham or to the program's own air-blast law would
 * not be restating the reference's own physics, honestly adopted -- it
 * would be inventing physics the reference's own authors explicitly
 * declined to publish, on the project's own authority alone. That is
 * exactly the "no number without a source" discipline this round has
 * held everywhere else (rule 1194, items 7/8). NOT fixed. What IS true
 * and citable, and worth carrying into the report: I1's own clause
 * already documents the two ground-blast departures from Eq. 18 (rules
 * 630 to 637, 748 to 755) without touching this one, and the reference's
 * own admitted "factor of 2-5" overestimate at large range is a fact this
 * project can print next to the affected radii -- a caveat, not a fix,
 * and a smaller, safer thing to do than inventing the geometry.
 */
export const RULE_1194_ITEM_9_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (5), READ FURTHER: the "max Ms/energy magnitude" choice
 * is already declared (rules 730-738, B-092) with a physical reason -- the
 * larger of two real mechanisms, not a guess -- so the audit's real target
 * is liquefaction, extrapolated on a magnitude no real earthquake has ever
 * reached. `events/earthquake/liquefaction.ts`'s magnitude scaling factor
 * (Youd & Idriss 2001) takes any `magnitude` with no domain check; called
 * from the impacts path in `simulate.ts` on a seismic magnitude that, for
 * a Chicxulub-class body, reads near 9.9 -- past Mw 9.5 (Valdivia 1960),
 * the largest instrumentally recorded earthquake, which
 * `inputValidity.ts:212` already flags as "pure extrapolation" for a
 * user-CHOSEN earthquake magnitude. The same bound applies here to a
 * CALCULATED one; the pattern to reuse already exists, just not wired to
 * this path.
 *
 * THE DECISION, taken here rather than left for a UI redesign: past
 * Mw 9.5, `liquefactionRadius` returns 0 in the impacts path, the same
 * choice this project already makes for every other quantity a domain
 * check rules out (an iron's crater below the strewn-field cut, a crater
 * under the hypervelocity floor) -- zero, not a distinguishable
 * "unknown" state, because `Meters` carries no such state and every
 * consumer already reads zero as "no ring drawn". This under-states the
 * honest answer (zero reads as "no liquefaction" where the true answer
 * is "not extrapolated"), which is why it is written here rather than
 * left silent: the three UI surfaces that show a liquefaction ring
 * (`SimulatorPanel.tsx`, `SimulationReportPage.tsx`,
 * `GlossaryDialog.tsx`) inherit the same zero without a caveat of their
 * own, and giving each one a domain-flag caveat properly is follow-up
 * work, not blocked by this fix.
 */
export const RULE_1194_ITEM_5_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (4), READ FURTHER: the audit's own citation, checked
 * directly against the primary source (the PDF read in full, not a
 * summary), does not say what the audit's "come migliorare" says it
 * says.
 *
 * The paper exists and is almost certainly the one meant: Coates, Stern,
 * Johnston, Wheeler & Mathias (2024), "Sensitivity Study of Impact Risk
 * Model Results to Thermal Radiation Damage Model for Large Objects",
 * Acta Astronautica 218:356-366, DOI: 10.1016/j.actaastro.2024.02.022 --
 * NASA ATAP authors, one of them (Johnston) already cited in this
 * project's own thermal code. But it does not propose new thresholds and
 * does not touch the E^(1/6) scaling at all: it takes Collins et al.
 * 2005's φ_i(1 Mt)·E_Mt^(1/6) as a fixed input and never questions it.
 * Its actual subject is the model's sensitivity to which of three
 * competing thermal models is chosen (this project's Collins/Glasstone-
 * Dolan; IDG RAS, Popova et al. 2021; NASA ATAP itself, Johnston & Stern
 * 2019) and above all to the luminous efficiency parameter eta (accepted
 * range 1e-4 to 1e-2) -- not pulse duration, which the paper never
 * discusses.
 *
 * NOT fixed, and not fixable as the audit describes it: "thermal
 * thresholds for long pulses" is not in this source. What IS there and
 * worth a future round, named honestly as a different thing from what
 * was asked: a structural-uncertainty comparison across the three
 * thermal models the paper studies, on the same eta range -- Porta 1
 * work, not a correction, and not started here.
 */
export const RULE_1194_ITEM_4_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (6), DONE: the breaking criterion Synolakis's own
 * source gives, read directly, declared before it is applied.
 *
 * `synolakisRunup` (`events/tsunami/extendedEffects.ts`) is valid only
 * where the incident wave does not break before reaching the shore.
 * Synolakis's 1986 Caltech thesis ("The Runup of Long Waves", the direct
 * source of the 1987 JFM paper this project already cites -- the
 * thesis's non-breaking run-up, Eq. 3.4.19, R/d = 2.831·√(cotβ)·(H/d)^
 * (5/4), is algebraically the formula already in this file), read
 * directly page by page (a scan, no embedded text), gives the breaking
 * criterion at Eq. 3.6.4, p.89: the Carrier-Greenspan transform's
 * Jacobian vanishes, and the non-breaking solution stops applying, at
 *
 *     H/d = 0.8183 · (cot beta)^(-10/9)
 *
 * Past it, no closed form exists in the same source for the breaking
 * case: Chapter 4 uses an empirical "runup number" that depends on the
 * generating wave's own characteristics, not H/d and beta alone, and
 * does not translate into this project's inputs. So this is a
 * declared-limit fix, not a replacement formula: `synolakisBreaks`
 * reads the same criterion and is called ONLY from the impacts path
 * (`simulate.ts`), leaving `synolakisRunup` itself untouched -- every
 * other caller (earthquake and landslide waves) is unaffected, and the
 * risk of breaking a paused module is avoided by construction. Zero was
 * considered and rejected: Synolakis's own laboratory table (Ch. 5)
 * shows breaking and bore run-up reading HIGHER than non-breaking, not
 * lower, so returning zero past the limit would understate the hazard,
 * the opposite of this round's direction everywhere else. The number is
 * printed as it is computed; a caveat is added instead, saying the
 * non-breaking formula is past its own stated validity there.
 */
export const RULE_1194_ITEM_6_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (6), THE MEASUREMENT: the only development preset with
 * `waterDepth` set, CHICXULUB_OCEAN, read before and after (git stash,
 * not a re-derivation): frictionless run-up at 1000 km falls from
 * 252.9 m to 35.5 m -- a factor of 7.1x, not a small one, because the
 * missing cap was not a fine correction, it was an entirely absent
 * guard rail. 252.9 m of run-up from a beach-incident amplitude near
 * 8.9 m (a 28x amplification) is the "unphysical Green upper bound" this
 * file's own non-linear-shoaling comment already names as the thing to
 * avoid, reached anyway because the shoaling correction alone was not
 * the only missing piece. Read as it computes, not tuned toward a
 * smaller number: this is what applying the same rule every other
 * caller already applies does.
 */
export const RULE_1194_ITEM_6_MEASURED = '2026-09-25' as const;

/**
 * RULE 1194, ITEM (11): the 45 `as number` casts in `simulate.ts`
 * (49 counted at the expression level; the audit's "46" and this file's
 * "45"/"49" are different ways of counting the same lines, not a
 * disagreement), sorted before any signature changes -- a read-only pass
 * first, so no function's contract changes on a guess.
 *
 * 32 are plain arithmetic: a branded value unwrapped for a calculation
 * already inside this file, the result re-wrapped with `m()`/`J()`/`Mt()`
 * before it leaves, or a genuinely dimensionless local (a 0-1 share, a
 * boolean, a solver's own scratch variable). Not a type hole; left
 * untouched.
 *
 * 13, across 7 functions, ARE real ones: the unwrapped value crosses into
 * a function whose own parameter is plain `number` where it concept­ually
 * means a specific unit, so nothing stops a future caller passing km
 * where the function reads metres. Ranked by how many production modules
 * (not call sites) a signature change touches, lowest first:
 *
 *   `ironFieldShare` (ironCraterField.ts) -- 1 call site, this file only.
 *   `swarmSpreadAtGround`, `swarmSpreadAtBurst` (atmosphericEntry.ts) --
 *     3 call sites, this file only.
 *   `craterFieldShare` (impact/craterField.ts) -- 2 call sites, this file
 *     only.
 *   `shoreSegmentFraction` (validation/coastalWaveRules.ts) -- reached
 *     from this file and its own internals.
 *   `computeSeaCoupling` (effects/seaCoupling.ts) -- ALSO called from
 *     events/explosion/simulate.ts: a signature change is not contained
 *     to the impacts module.
 *   `groundFireballShare` (atmosphericEntry.ts) -- ALSO called from
 *     airburstSeismic.ts and impactField.ts: same cross-module reach.
 *   `craterAsymmetry` / `obliqueImpactRingAsymmetry` /
 *     `obliqueImpactCentreOffset` (effects/asymmetry.ts) -- contained to
 *     one module, but ~30 tests read their `number` signature directly.
 *
 * This block fixes the four contained-to-this-file cases
 * (`ironFieldShare`, `swarmSpreadAtGround`, `swarmSpreadAtBurst`,
 * `craterFieldShare`) and the asymmetry family
 * (`craterAsymmetry`/`obliqueImpactRingAsymmetry`/
 * `obliqueImpactCentreOffset`): each takes and returns branded units now,
 * callers updated (production and the ~35 test call sites it touched, in
 * `simulate.ts`, `asymmetry.test.ts`, `airburstShapeRules.test.ts` and
 * `regressionRegistry.test.ts`), no behaviour changes (the function
 * bodies are untouched, only what the type checker can see at the
 * boundary) -- confirmed independently by the seal, which does not move
 * at all on this block. The three cross-module cases
 * (`shoreSegmentFraction`, `computeSeaCoupling`, `groundFireballShare`)
 * were left for a following block: touching a module outside
 * simulate.ts is its own change to verify carefully, not a rename to
 * fold into this one.
 *
 * That following block, same day. All three done, each with every caller
 * across its own module boundary:
 *
 *   `shoreSegmentFraction` / `shoreSegmentEquivalentRadius`
 *     (coastalWaveRules.ts) -- both take `Meters` now; the one production
 *     caller (simulate.ts) and the eight call sites of
 *     coastalWaveRules.test.ts updated.
 *   `computeSeaCoupling` (seaCoupling.ts) -- `SeaCouplingInput`'s four
 *     fields are `Meters` now; both production callers fixed
 *     (simulate.ts and events/explosion/simulate.ts, which is the reach
 *     the audit named) plus the test call sites in seaCoupling.test.ts
 *     and validation/customScenarios.test.ts.
 *   `groundFireballShare` (atmosphericEntry.ts) -- takes `Meters, Joules`
 *     now; every caller found, which is one more module than the audit's
 *     own count named (simulate.ts itself, twice, in addition to
 *     airburstSeismic.ts and impactField.ts) plus the two test files
 *     that call it directly.
 *
 * No function body changed, only the boundary; the seal does not move on
 * this block either, and the full suite is green.
 */
export const RULE_1194_ITEM_11_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1197. A11, ITEM (2), DONE -- THE CASUALTY BAND EDGES SIT ON THE LAW
 * THAT DREW THE RINGS THEY ARE MEASURED FROM, FOR AN IMPACT TOO.
 *
 * The declaration (rule 1194, item 2, read further, above): `casualties.ts`
 * already states the right rule in its own comment -- "the 12 psi and
 * 2 psi circles sit on the same curve as the rings they are measured
 * from" -- and already follows it for a chemical explosion
 * (`chargeType === 'chemical'`, Kingery-Bulmash), but never for an impact,
 * which always fell through to a fixed Kinney-Graham-family bisection
 * (`overpressureRadiusRatio` → `distanceForOverpressure` →
 * `peakOverpressure`) regardless of which law drew the 5 psi and 1 psi
 * rings it was scaling from.
 *
 * The fix, decided here before writing it: `simulate.ts` already computes
 * the 5 psi, 1 psi and 0.5 psi (`lightDamage`) rings through one function,
 * `blastRing(surface, air, threshold)`, that reads the ground-impact law
 * (`groundImpactReach`, itself `GroundBlast`-aware) where a body reaches
 * the ground and the larger of the project's two Kinney-Graham rings
 * otherwise (`entry.shockWaveRadii`, `surfaceDamage`) -- the same choice,
 * by construction, that drew the rings the panel shows. Two more calls to
 * the SAME function, at the OTA bands' own 12 psi and 2 psi, give the two
 * missing radii on the same law, no new bisection and no new physics.
 * These become two new fields of `ImpactDamageRadii`
 * (`overpressure12psi`, `overpressure2psi`), threaded through
 * `useAppStore.ts` to `blastCasualtyPlan` as two new, optional
 * `BlastCasualtyInput` fields (`overpressure12psiRadius`,
 * `overpressure2psiRadius`); `casualties.ts`'s `ratio()` scaling stays,
 * unchanged, as the fallback an explosion with no impact-drawn rings still
 * needs.
 *
 * What this rule commits to before any number is read: the shift is
 * measured on every development preset before it is called done, printed
 * as a ratio of the old 12 psi and 2 psi radii to the new ones, and if any
 * preset's shift is large enough to plausibly move a band's population by
 * a factor worth noticing, that is reported exactly as it reads --
 * nothing here is re-tuned to make the shift look smaller.
 */
export const RULE_1197_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1197, THE MEASUREMENT COMMITTED TO ABOVE. Every development preset,
 * old (scaled from 5 psi / 1 psi by a fixed Kinney-Graham ratio) against
 * new (read from the law that actually drew the rings), ratio new/old:
 *
 *   CHICXULUB / CHICXULUB_OCEAN (PARTIAL_AIRBURST): 12 psi 1.000×, 2 psi 1.075×
 *   TUNGUSKA (COMPLETE_AIRBURST): 12 psi 1.000×, 2 psi 1.000× (the fallback
 *     this rule declared for a body that never leaves the air -- unchanged
 *     by construction)
 *   METEOR_CRATER (PARTIAL_AIRBURST): 12 psi 0.984×, 2 psi 1.000×
 *   POPIGAI (PARTIAL_AIRBURST): 12 psi 0.967×, 2 psi 1.075×
 *   BOLTYSH (PARTIAL_AIRBURST): 12 psi 0.967×, 2 psi 1.075×
 *   CHELYABINSK, SIKHOTE_ALIN_1947: no plan either way (already below the
 *     1 psi floor `blastCasualtyPlan` requires -- unrelated to this fix,
 *     true before and after it)
 *
 * Every shift is under 8 %, none changes which OTA band a fixed distance
 * falls in for any preset checked, and the airburst fallback is exactly
 * unchanged as declared. Read as such, not tuned to read small: this is
 * what the law that already draws the 5 psi and 1 psi rings gives at
 * 12 psi and 2 psi, on the bodies this project already develops against.
 * `src/physics/casualties.test.ts` and `casualtyTimeline.test.ts` (46
 * tests) call `blastCasualtyPlan` with synthetic radii and no new field,
 * so they exercise the unchanged fallback and stay green unmodified; nothing
 * in the suite pins a band radius against a live preset, so nothing else
 * needed a change.
 */
export const RULE_1197_MEASURED = '2026-09-25' as const;

/**
 * RULE 1198. A12 — TWO OF THE ITEMS RULE 1195 LEFT OPEN, READ FURTHER: ONE
 * IS NOT REACHABLE FOR IMPACTS AS THE PANEL STANDS, ONE IS A REAL SILENT
 * DEGRADATION AND GETS A NOTICE.
 *
 * (1) "Silent field-validation failures" -- not reachable for impacts today,
 * and said so rather than fixed on a guess. `useScenarioValidation.ts`'s own
 * comment already names the abstract gap: the store setter rejects a
 * schema-'invalid' input at the boundary and no-ops (`return state`), so
 * `useFieldIssues` -- which re-validates `state.impact.input`, the last
 * ACCEPTED value -- can never see a rejected attempt; the field would go
 * quiet at blur with no explanation. Traced for real against
 * `ImpactCustomInputs.tsx`, the five numeric handlers
 * (`updateDiameter`/`updateVelocity`/`updateImpactorDensity`/
 * `updateTargetDensity`/`updateAngle`) each already guard with
 * `Number.isFinite(...) && ... > 0` (the angle handler also guards its own
 * `<= 90`) before ever calling `setImpactInput` -- exactly the conditions
 * `validateImpactInput` (`inputSchema.ts`) would reject as `NOT_FINITE` /
 * `ZERO_FORBIDDEN`. `updateAzimuth` guards only `Number.isFinite`, but an
 * out-of-range or negative azimuth is `normalizeAzimuthDeg`'s WARNING path,
 * not a rejection. `applyTaxonomy` writes fixed, always-valid table values.
 * `impactorStrength` is set only by that same taxonomy table; `shoreDistance`
 * and `waterDepth` are never user fields for impacts, only store-computed
 * ones. The one real path that CAN hand the store a hard-invalid impact
 * payload -- a hand-edited shared link -- is already disclosed: `evaluate`'s
 * link-restore branch (`useAppStore.ts`, the `filled`/`refused` closures)
 * sets `linkNotice` to name exactly which fields were missing or why the
 * whole link was refused. So: the gap is real as an abstract property of the
 * store, and worth the comment that already flags it, but for the impacts
 * panel as it is wired today every reachable path either cannot produce a
 * hard-invalid value or already discloses when it does. Left as read, not
 * patched against a case nothing can drive.
 *
 * (2) The terrain 8 s timeout that turns an ocean site into land with no
 * warning -- real, and reachable on an ordinary slow connection.
 * `ensureTerrainForEvaluate` (`useAppStore.ts`) gives the per-click
 * Terrarium tile up to `GLOBAL_MOSAIC_WAIT_MS` (8 s) via `settleWithin`,
 * then proceeds regardless. `evaluate`'s impact branch samples elevation
 * only `state.elevationGrid !== null && gridCoversLocation(...)`; when the
 * tile did not land in time, `impactClickZ` stays `undefined`, the
 * `waterDepth` auto-derivation block (guarded on
 * `impactClickZ !== undefined`) never runs, and the impact is simulated as
 * dry land arbitrarily far from any coast -- identical to what a genuine
 * inland click produces, with nothing on screen to say the two were told
 * apart by a stopwatch, not by the map.
 *
 * The candidate, decided here before writing it: a new store field,
 * `impactTerrainNotice: 'timedOut' | null`, alongside `linkNotice` in
 * `AppStore` and `initialState()`. Set in `evaluate`'s impact branch, once
 * per run, exactly when a real degradation happened: `state.location` is
 * not null (a point WAS picked), `impactInput.waterDepth` is `undefined`
 * (nothing here overrides the auto-derivation this notice is about), and
 * the elevation grid that reached this point either is null or does not
 * cover the pick. Cleared to `null` on every run that does not meet all
 * three -- including a run whose tile arrived, however close to the 8 s
 * edge, and a run where the user (or a preset) set `waterDepth` by hand,
 * for whom the auto-derivation this notice concerns never applied. Unlike
 * `linkNotice` (one string, shared verbatim across every event type and
 * left in English by an earlier round's own choice), this field is
 * impacts-only and carries a CODE, not a sentence: `ImpactReport.tsx`
 * translates it with `t()`, so it comes out in whichever language the
 * report is already reading in (rule IMP-7c's own discipline), not
 * hard-coded English bolted onto an Italian page.
 *
 * What is checked: a test that starves `evaluate` of a terrain loader
 * entirely (the existing "does not touch the network when no loaders are
 * configured" case in `useAppStore.test.ts` already sets this scene) reads
 * `impactTerrainNotice === 'timedOut'`; a second run with a loader that
 * resolves in time reads `null`; a preset that ships its own `waterDepth`
 * (`CHICXULUB_OCEAN`) with no loader configured at all still reads `null`,
 * because the auto-derivation the notice warns about never runs for it.
 * Nothing about the 8 s figure itself, or the decision to proceed after it,
 * changes -- rule 272's own kind of restraint: the timeout stays what
 * `GLOBAL_MOSAIC_WAIT_MS`'s comment already justifies (generous for a slow
 * connection, short enough the Launch button is never held hostage); only
 * the silence after it is fixed.
 */
export const RULE_1198_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1199. A7 -- READ IN FULL (page 14 of the audit, not the shorter
 * paraphrase this round's own `Nimbus-PIANO.md` carried). One of its four
 * clauses is a small, contained fix with nothing to decide; the other three
 * invert decisions Andrea already took by name, in rules 836, 837 and 833's
 * own practice across this very round -- and rule 1193's own word ("any
 * other choice is mine to take, not the assistant's") says those are not
 * this round's to make.
 *
 * The audit's own four-part "come migliorare", read exactly:
 * (1) "Sigillo con tolleranza per numero derivata dal condizionamento
 * misurato (la regola 854 e' la base)" -- move the seal from bit-exact
 * comparison to a per-number tolerance, using rule 854's Node-22-vs-24
 * measurement as the method. (2) "preso su Linux x64 nella CI e verificato
 * anche su macOS" -- move the REFERENCE platform from macOS arm64 to Linux
 * x64. (3) "le stringhe del report al bit; tolleranza dichiarata nel
 * report" -- keep report TEXT at bit-exact comparison, and print the
 * tolerance chosen in the validation report. (4) "risigillo solo a ogni
 * release" -- re-seal only at a release, not at every round that moves a
 * number.
 *
 * What (1), (2) and (4) would reverse, each named:
 * - Rule 837 chose macOS arm64 as the platform the seal is taken AND
 *   compared on -- "on Andrea's word" (rule 854's own phrase for how an
 *   engine move is decided) is not written of 837 by name, but 837 itself
 *   records why: the CI's Linux x64 gives other last bits than "the arm64
 *   Mac the seal is taken on", i.e. Andrea's own machine, and the fix was to
 *   compare where it is taken rather than change where it is taken. A move
 *   to Linux x64 as the reference is the opposite choice, not a refinement
 *   of this one.
 * - Rule 854 already tried a per-number tolerance, once, for one engine
 *   move (Node 22 to 24): REFUSED at 10⁻¹² by its own letter, on one number
 *   in 32 911 (the flash radius conditioning, 3×10⁻¹²), with the explicit
 *   lesson "a bound for the next move should be set per number... not a
 *   single figure written before the conditioning was known". Building a
 *   PERMANENT per-number tolerance into the seal's own comparison (rather
 *   than a one-off measurement for one engine move, taken and refused on
 *   its own terms) is a materially bigger change than what 854 did, and
 *   854's own outcome is a caution against doing this lightly, not a
 *   green light.
 * - Rule 833's own discipline -- re-seal at the round that moves a number,
 *   with that round's reason -- is what every block of this file has
 *   practiced: four re-seals this round alone (rule 1197's field addition,
 *   item 5's liquefaction domain, item 6's McCowan cap), each with an
 *   `--opened-by`/`--moved` reason, each read before the next round began.
 *   "Risigillo solo a ogni release" is not a bug fix on that practice, it
 *   is a different practice, with a different cost (a defect sits unsealed
 *   for however long until the next release) and a different benefit (the
 *   23-reseals-in-three-days count the audit itself cites stops being
 *   true). Trading one for the other is Andrea's to weigh, not this
 *   round's to assume.
 *
 * What is NOT in dispute, and is fixed here without asking: the audit's own
 * evidence line, read in full, adds one clause this round's earlier
 * reading (via `Nimbus-PIANO.md`'s paraphrase) had not carried at all --
 * "macos-latest non e' un'immagine fissata". `.github/workflows/ci.yml`'s
 * `seal` job runs on `macos-latest`, which GitHub's own runner-images
 * README (read today, 25 September 2026) names as macOS 26 Arm64 --
 * `macos-latest` moving to a new major, on GitHub's own schedule and with
 * no line in this repository, is exactly the silent engine-adjacent change
 * rules 836 and 837 were written against, just one layer further out.
 * Pinned to `macos-26` (the exact label the same README gives that
 * version), nothing else changes: `SEAL_PLATFORM` (`impactSeal.ts`) reads
 * `${process.platform}-${process.arch}`, `darwin-arm64` on any macOS major,
 * so the pin touches no comparison the seal already makes -- only which
 * image `-latest` is free to silently become next.
 *
 * Left for Andrea, in one question, not decided here: whether to move the
 * seal's reference platform and comparison from bit-exact-on-macOS-arm64 to
 * tolerance-on-Linux-x64, and whether to move re-sealing from every
 * number-moving round to every release. Both cost something this round
 * cannot weigh for him.
 *
 * Andrea's answer, the same day: leave it as it is. Rule 837's platform and
 * bit-exact comparison, and rule 833's re-seal-at-the-round-that-moves-a-
 * number practice, both stand, unchanged and not revisited. A7 closes here
 * with its one contained fix (the image pin above) and its three other
 * clauses read, weighed and declined by the one person who could decide
 * them -- not silently dropped, and not taken on a guess.
 */
export const RULE_1199_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1200. A12 -- THE AZIMUTH CURSOR, FOR A BODY THAT WILL COMPLETELY
 * AIRBURST ON TODAY'S OTHER INPUTS, MOVES NOTHING DRAWN ON THE GLOBE, AND
 * NOW SAYS SO.
 *
 * The defect, rule 1195's own words: "the azimuth cursor not saying it
 * moves nothing for an airburst -- which the panel cannot know until the
 * scenario is simulated, so a text fix alone is not enough". Traced to its
 * exact mechanism in `simulate.ts`: `couplesToGround = entry.regime !==
 * 'COMPLETE_AIRBURST'` (line 1133) is the one flag every ring's asymmetry
 * (`obliqueImpactRingAsymmetry`) and centre offset
 * (`obliqueImpactCentreOffset`) is drawn from, and passing it `false`
 * returns the isotropic ring by construction (asymmetry.ts, rules 235-240 of
 * `airburstShapeRules.ts`) -- an azimuthally symmetric source is the Earth
 * Impact Effects Program's own model of a burst, not a simplification this
 * project added. `craterAsymmetry` does not take the flag, but a
 * `COMPLETE_AIRBURST` draws no crater at all, so its shape is moot. So the
 * azimuth cursor is cosmetic, exactly and only, for a body whose OTHER five
 * inputs (diameter, velocity, density, angle, strength) already cross it
 * into that regime -- which the audit's own diagnosis is right that the
 * panel cannot read off any single field; it is a threshold the physics
 * crosses.
 *
 * The candidate, decided here before writing it: read the threshold the
 * same way the panel already reads a live physical answer it does not
 * store, `EarthquakeCustomInputs.tsx`'s own `strike` preview being the
 * precedent -- call `simulateImpact` on the CURRENT six inputs (not a
 * cached `result`, which may be null or stale against an edit not yet
 * launched) and read `entry.regime` back. Measured before committing to
 * it: ~5-7 ms a call on this machine (CHICXULUB and TUNGUSKA, 200-call
 * average, headless) -- run through `useMemo` keyed on `input`, so it
 * re-runs once per accepted edit, not once per keystroke or render, and
 * never blocks typing. `ImpactCustomInputs.tsx`'s azimuth `QuantityRow`
 * swaps its note for a stated one when the preview reads
 * `COMPLETE_AIRBURST`, in both languages; the slider itself, and every
 * other field, are unchanged -- rule 1195 asked for the panel to stop
 * implying an effect that is not there, not to hide or disable the control.
 *
 * What is checked: TUNGUSKA (COMPLETE_AIRBURST on its own preset inputs)
 * reads the airburst note; CHICXULUB (INTACT/ground-coupled) reads the
 * ordinary degrees note; a diameter edited from Tunguska's own small body
 * up past the airburst threshold flips the note without a relaunch, on the
 * input alone.
 */
export const RULE_1200_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1201. A12 -- THE LAST ITEM RULE 1195 LEFT OPEN FOR IMPACTS: THE
 * MONTE CARLO P10/P90 HALOS AND THEIR RADIAL PROBABILITY HEATMAP ARE DRAWN
 * ON THE GLOBE WITH NO LEGEND ENTRY AT ALL.
 *
 * Traced to its mechanism: `Globe.tsx`'s `pickFuzzyMetrics` (line ~4633)
 * chooses, for an impact, two MC metrics -- `finalCraterDiameter` and
 * `firestormIgnition` -- and draws, per metric, a faint P10 and P90 ellipse
 * (an "uncertainty halo" around the deterministic ring, the code's own
 * words) plus, where the MC engine kept raw samples, a 256-step radial
 * exceedance-probability bitmap underneath ("darker = very likely, fading
 * = rare worst case", also the code's own words). `RingLegend.tsx` -- the
 * one place a visitor reads what a colour or a shape on the globe means --
 * names neither: grep for "monteCarlo" or "MonteCarlo" in that file
 * returns nothing. A visitor who has run the MC sweep sees two extra faint
 * rings and a soft glow around them with no key at all.
 *
 * This is NOT the four-state cartographic grammar of rules 1028-1074
 * (`mapGrammarRules.ts`): that grammar answers "what does an edge of a
 * deterministic physical field mean" (computed / below threshold / a
 * model's own limit / not modelled) for one drawn quantity. A P10/P90 halo
 * is a different kind of thing -- a statistical confidence spread around a
 * central estimate, from repeated sampling, not a physical field's edge --
 * and forcing it through the same four states would misname it, not fix
 * it. What is missing here is simpler and does not want a new grammar: a
 * legend entry saying what the halos and the heatmap already are, in the
 * code's own words above.
 *
 * The candidate, decided here before writing it. `FuzzyMetric`
 * (`Globe.tsx`) gains one field, `metricKey: string` -- the Monte Carlo
 * metric's own field name (`'finalCraterDiameter'`, `'firestormIgnition'`)
 * -- and `pickFuzzyMetrics` plus the `FuzzyMetric` type are exported. Both
 * were private to `Globe.tsx` before; `RingLegend.tsx` is never loaded
 * without it (only `GlobeView.tsx` imports either, and both are inside its
 * lazy chunk), so this adds no weight to the bundle the budget gate
 * checks. `RingLegend.tsx` calls the same function with the same
 * `monteCarlo` state Globe.tsx draws from, for `monteCarlo?.type ===
 * 'impact'` only (rule 1195's own scope: impacts, not the other four
 * event types this round does not touch) -- so the legend can never say
 * two metrics different from the two the globe actually drew; the two
 * cannot drift apart because they are read from one function, not
 * duplicated. Each metric's swatch is `metric.color.toCssColorString()`
 * (Cesium's own conversion), the exact colour the ring already uses, not
 * a second palette to keep in step by hand. The entry states, once, what
 * P10/P90 mean (an uncertainty band from repeated Monte Carlo draws, not
 * an additional damage threshold) and what the underlying glow is (denser
 * where outcomes cluster); it is shown only while `monteCarlo !== null`,
 * exactly the condition the globe already draws the halos under.
 *
 * What is checked: with no MC run, the legend is unchanged (nothing new
 * to explain); after CHICXULUB's MC sweep, the new entry names exactly
 * `finalCraterDiameter` and `firestormIgnition`, each swatch equal to the
 * `Color` the globe drew that metric's halo in.
 */
export const RULE_1201_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1202. A12 -- THE PRINTED REPORT'S MISSING FIELDS, FIRST THREE OF
 * SEVEN: BURST ALTITUDE, FRAGMENTATION ONSET AND THE SPEED AT THE END OF
 * ENTRY ARE ON THE PANEL BUT NOT ON THE PAGE A READER TAKES AWAY; SO IS
 * THE AZIMUTH THAT WAS TYPED IN.
 *
 * Traced against `impactReportModel.ts`: `scenarioRows()` prints diameter,
 * velocity, both densities and the angle, never the azimuth; `groups()`'s
 * `body` group tags `entryRegime` and `energyToGround` as `'entry'` and
 * stops there -- `r.entry.burstAltitude`, `r.entry.breakupAltitude` and
 * `r.entry.endVelocity` are computed (the panel's own Esito tab already
 * shows all three, read directly in the browser: "Altezza detonazione",
 * "Inizio frammentazione", the end-of-entry speed folds into "Energia al
 * suolo") but never reach `buildImpactReport`. A reader with the PDF alone,
 * offline, cannot see any of the four -- exactly the printed-report gap
 * A12 named, and exactly the case rule 1037 was written against: "the
 * globe and the PDF are one scientific product, and a reader offline must
 * not get [a lesser] reading."
 *
 * The candidate, decided here before writing it, for these four only:
 * `scenarioRows()` gains one row, `impactAzimuthDeg`, reading
 * `r.inputs.impactAzimuthDeg ?? 90` -- the same fallback
 * `ImpactCustomInputs.tsx` and `simulate.ts` line 1102 already apply, so
 * the report never claims "no azimuth was used" for a scenario the model
 * quietly defaulted to 90°. `groups()`'s `body` group gains three rows,
 * each tagged `'entry'` like its two neighbours: `endVelocity` in km/s
 * (the same unit and one-decimal precision `impactVelocity` already
 * prints, for the same reason: reading the two side by side is the
 * point); `burstAltitude` and `breakupAltitude` through a new local
 * `altitude()`, NOT `length()` -- caught only by reading the rendered
 * page, not by any test: `length()` (via `formatRange`) treats a radius
 * of zero as "no effect drawn" and prints NONE, right for a damage ring,
 * wrong for an altitude of exactly zero, which for a body that reaches
 * the ground whole is a fact (no airburst happened), not an absence.
 * `altitude()` also could not reuse `SimulatorPanel.tsx`'s own
 * `TIERS_METERS`/`formatWithUnitTiers`: that helper resolves its decimal
 * separator from the global i18next instance, not from the `language`
 * this model is always given explicitly, and this file stays pure on
 * that point (its own header says so) -- so `altitude()` is built on
 * `fixed()`, the same primitive every other number in this file already
 * goes through, scaling to km past 1000 m the same way the panel does.
 * No new UI, no new concept -- four `row()` calls and four new
 * `report.impact.field.*` keys in both languages, plus
 * `report.impact.field.impactAzimuthDeg`'s unit ("°N", matching the
 * panel's own `azimuthLabel`).
 *
 * What is checked: `buildImpactReport` on TUNGUSKA (COMPLETE_AIRBURST, a
 * non-zero breakup altitude, a zero burst-relative crater) and on
 * CHICXULUB (PARTIAL_AIRBURST -- it breaks up, `breakupAltitude` > 0, but
 * the swarm reaches the ground before it spreads wide, so `burstAltitude`
 * is legitimately 0, not INTACT as first assumed here and caught by the
 * test itself) both print all four new rows, CHICXULUB's `burstAltitude`
 * printing "0 m" and not NONE; TUNGUSKA's burst and breakup altitudes
 * matching `simulateImpact` read directly; a scenario with no
 * `impactAzimuthDeg` given prints 90°, matching the panel's own
 * default.
 *
 * What this rule leaves for a following one, named so they are not lost
 * to silence: I2's band and the measured cell's verdict (`measuredCells`,
 * already rendered once for the panel by `entryCellSentence` --
 * `RingLegend.tsx` calls it, the report does not yet); the Monte Carlo
 * table (today `extras.monteCarlo` is a boolean that only selects which
 * formula citations appear, not the P10/P50/P90 figures themselves); and
 * which of the seven model-variant fields
 * (`craterDomain`/`groundBlast`/`entryEquations`/`airFlash`/`lowBurstFlash`/
 * `lowBurstCrater`/`craterField`/`airburstSeismic`) were set away from
 * their defaults for this run. Each is a design decision this rule has
 * not made (a table's layout, a sentence's wording, which variants are
 * worth naming when none or all are non-default) rather than a four-line
 * addition like this block's -- left open deliberately, not silently.
 */
export const RULE_1202_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1203. A12, READ AGAIN IN FULL (page 18 of the audit) -- WHAT SIX
 * BLOCKS OF WORK FROM ITS OWN PARAPHRASE IN `Nimbus-PIANO.md` MISSED.
 *
 * The same mistake rule 1199 named for A7: this whole round's A12 work
 * (rules 1195, 1198, 1200, 1201, 1202) was done against `Nimbus-PIANO.md`'s
 * one-paragraph summary of A12, not the audit's own page. Reading the page
 * itself now, after believing A12 closed, finds thirteen sentences the
 * paraphrase carried none of. Listed here in the audit's own order, each
 * marked with what this round has now done about it:
 *
 * 1. "'confidence interval' su un intervallo Monte Carlo, e linee
 *    tratteggiate che dal 22-09 non esistono più" -- NOT YET READ. Where
 *    on the landing/methodology page, and against what the 22 September
 *    grammar round actually removed, this round has not traced.
 * 2. "il testo dell'ingresso dice che il programma 'manca di circa
 *    altrettanto' accanto a celle che mostrano 4,5-7 km / 9,5-15,8 km" --
 *    NOT YET READ.
 * 3. "due denominatori (938 su 83 impatti; 1 794 impatti) senza
 *    spiegazione" -- NOT YET READ.
 * 4. "codici delle regole (I1, G3) senza descrizione" -- NOT YET READ.
 * 5. "la vista di probabilità eredita l'etichetta 'A' ... mentre la sua σ
 *    è una convenzione del progetto che la legenda chiama 'dispersione
 *    pubblicata' (impactFieldMap.ts:498, visualContracts.ts:653)" -- NOT
 *    YET READ.
 * 6. "lo stato 'diagnostico' della grammatica non è mai assegnato" -- NOT
 *    YET READ; `EpistemicState` (mapGrammarRules.ts) does carry
 *    `'diagnostic'` in its type, so this is whether any object actually
 *    gets it, not whether the state exists.
 * 7. "dopo un Monte Carlo... cerchi P10/P90 e mappa di probabilità...
 *    senza voce di legenda né scheda" -- the legend-entry half is DONE
 *    (rule 1201, this round); the per-object provenance CARD (rule 1029's
 *    five fields) is not, and neither is "in gradi (distorti alle grandi
 *    distanze)" -- whether the halo geometry itself needs the sphere
 *    correction the impact rings already have (rule 1194 item 8's
 *    domain), separate from naming what is drawn.
 * 8. "il cratere e l'anello della cavità non hanno scheda" -- NOT YET
 *    READ.
 * 9. "il 'Coastal Deep Dive (Tier 2)'... senza classe di evidenza e solo
 *    in inglese" -- NOT YET READ; a different report section
 *    (`DeepDiveResult`) from anything this round's A12 work touched.
 * 10. The printed report's missing fields -- FOUR of seven DONE (rule
 *     1202: azimuth, burst/breakup altitude, end velocity); I2's band,
 *     the measured cell's verdict, the Monte Carlo table and active
 *     model variants remain, as rule 1202 itself already said; "non cita
 *     Borovička 2020 (legge di default)" is a FIFTH still-open field
 *     this round's earlier reading of A12 never carried at all.
 * 11. "le soglie di avviso contraddicono i loro testi (velocità 1 km/s
 *     contro '11,2', densità 500-8 000 contro '600-7 800')" -- DONE, this
 *     rule, immediately below.
 * 12. "il globo bloccato non mostra alcun messaggio" -- NOT YET READ; what
 *     "bloccato" names (a hung render, a failed tile fetch, a worker
 *     that never resolves) is not yet traced to a mechanism.
 * 13. "il globo non è operabile da tastiera... tastiera O inserimento di
 *     coordinate" -- corrected above (rule 1195's struck paragraph):
 *     wording the claim honestly (done) is not the same as closing the
 *     functional gap (not done).
 *
 * What this rule does, now: item 11, the one already fully traced and
 * safe to fix without further reading -- and read past the audit's own
 * two named examples, into every warning `validateImpactInput`
 * (`inputSchema.ts`) has, because "le soglie di avviso contraddicono i
 * loro testi" names a pattern, not a two-item list, and a search that
 * stopped at the two the audit happened to quote would repeat A12's own
 * lesson (reading a summary instead of the source). Five, all of the
 * same shape -- the CODE threshold and the number the message cites as
 * though it were the threshold are different:
 *   - `impactVelocity < 1_000` (1 km/s) message cited "~11.2 km/s"
 *     (Earth escape velocity) as though it were the floor -- eleven
 *     times off.
 *   - `impactorDensity < 500 || > 8_000` message cited "[600, 7800]"
 *     (the taxonomy envelope itself) as the bound.
 *   - `impactorDiameter > 100_000` (100 km) message cited Vredefort's
 *     impactor "~10-15 km" as though that were the ceiling -- an order
 *     of magnitude off.
 *   - `impactVelocity > 80_000` (80 km/s) message cited "~73 km/s"
 *     (the heliocentric retrograde maximum) as the ceiling.
 *   - `shoreDistance > 5_000_000` (5 000 km) message cited "~2 650 km"
 *     (the farthest any point on Earth sits from open water) as the
 *     ceiling -- nearly double.
 * A reader who trusts any of these five and types a value the text
 * implies should warn -- 5 km/s, 550 kg/m³, 50 km, 75 km/s, 3 000 km
 * shore distance -- gets nothing. The candidate, for all five: reword to
 * state the validator's OWN threshold first ("this validator's own
 * 100 km ceiling"), then the physical reference it sits near or above,
 * so the two numbers are never presented as one. No threshold moves --
 * the same fix in kind as rule 1195's angle note, a true sentence about
 * an unchanged number, not a re-tuning (rules 5, 6).
 *
 * The other twelve items are named here so they are not lost the way A12
 * itself was nearly lost to a paraphrase -- left open, each for a
 * dedicated reading before it is touched, not guessed at from this list
 * alone.
 */
export const RULE_1203_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1204. A12, ITEM 12: "IL GLOBO BLOCCATO NON MOSTRA ALCUN MESSAGGIO."
 *
 * Traced to three distinct mechanisms in `Globe.tsx`, all silent by the
 * same shape -- a `console.warn`/`console.error` and nothing a visitor
 * ever sees:
 *
 * (a) Cesium fails to initialise at all (line ~1173): "Browser can't run
 *     Cesium (e.g. Safari < 16.4 without OffscreenCanvas). Log once; the
 *     rest of the app keeps working" -- the silence here is DELIBERATE
 *     and stated: the SimulatorPanel must keep working with no globe at
 *     all, on a browser too old for one. Left as it is: this is not the
 *     defect, and a banner over an absent canvas is a design question of
 *     its own (rule 1195's own scope: correcting a false claim, not
 *     redesigning around a browser-support edge this round has not been
 *     asked to weigh).
 * (b) `webglcontextlost` (line ~1074): the GPU driver drops the context
 *     (a backgrounded tab, an aggressive resize, a driver hiccup) and the
 *     canvas freezes on its last frame. `onContextRestored` already
 *     listens and recovers automatically in the common case; nothing here
 *     reads as a deliberate choice to stay silent, more an omission -- no
 *     comment argues for silence the way (a)'s does.
 * (c) `renderError` exhausts its retries (line ~1110): "the freeze that
 *     only a reload clears. Nobody was listening, so nobody restarted
 *     it" -- the code's own words already name the gap; a `renderError`
 *     handler is written, retries up to `MAX_RENDER_ERROR_RESTARTS` (5)
 *     times, and on the sixth simply gives up, `console.error` only. This
 *     is the one unambiguously silent AND unrecovered case: not (a)'s
 *     declared trade-off, not (b)'s usually-self-healing transient.
 *
 * The candidate, decided here before writing it, for (b) and (c) only --
 * (a) is left exactly as its own comment already justifies. A local
 * `globeStatus: 'ok' | 'contextLost' | 'stuck'` state in the `Globe`
 * component: `'contextLost'` set in `onContextLost`, cleared in
 * `onContextRestored`; `'stuck'` set only past
 * `MAX_RENDER_ERROR_RESTARTS`, with a "try again" action that re-arms
 * `useDefaultRenderLoop` and resets the retry count, mirroring what
 * `onContextRestored` already does for case (b). Rendered as a small,
 * non-blocking badge over a CORNER of the globe container, never a
 * full-canvas overlay -- `Globe.module.css`'s own comment on
 * `.cesium-widget-errorPanel` already states this project's rule for
 * globe-area chrome: an error must never intercept clicks meant for the
 * SimulatorPanel, About or Glossary overlays sitting above the canvas.
 * `pointer-events: none` on the badge's own container, `auto` only on
 * its retry button. Two languages, both new keys, no existing string
 * touched.
 *
 * What is checked, and how: no unit-test harness in this project mounts
 * `Globe.tsx` -- it is Cesium-heavy and every existing test of this file
 * reads the exported pure geometry/format helpers, never the component
 * (rule 1201's own file split kept that true). Mocking a `Viewer` well
 * enough to fake `renderError`/`webglcontextlost` would test the mock,
 * not Cesium's real event wiring, so this was checked instead against
 * the running app (`?probe` exposes `window.__nimbusViewer`, already
 * built for exactly this): `canvasEl.dispatchEvent(new
 * Event('webglcontextlost', {cancelable: true}))` raised the transient
 * badge in Italian, `defaultPrevented` confirming `preventDefault()`
 * ran; `dispatchEvent(new Event('webglcontextrestored'))` cleared it;
 * `viewer.scene.renderError.raiseEvent(viewer.scene, new Error(...))`
 * called six times (past `MAX_RENDER_ERROR_RESTARTS`, 5) raised the
 * stuck badge with a working "Riprova" button -- clicking it (`.click()`
 * on the button element; the harness's coordinate-based click did not
 * land while the pane was backgrounded, a tooling limit unrelated to
 * this code) cleared the badge and reset the retry budget. Read, not
 * assumed: `getComputedStyle` on the badge's container gave
 * `pointer-events: none`, on the button `auto`.
 */
export const RULE_1204_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1205. A12, ITEM 1: THE ENTRY PAGE'S "13.74 KM" READS AS THE SAME
 * NUMBER AS THE TABLE ABOVE IT, WHICH SAYS "5.3 KM" -- VERIFIED, NEITHER
 * NUMBER IS WRONG, THE SENTENCE THAT JOINS THEM IS.
 *
 * A background agent traced this one in full (its report is this rule's
 * source, not re-derived here): `barMissed`'s claim that the reference
 * program "misses the recorded altitude by about as much" as the model is
 * demonstrably FALSE against the one live comparison actually on the page
 * -- `entryCells`' six rows (`ValidationPage.tsx:356-368`), where the
 * model's median error runs 4.5-7 km and the program's 9.5-15.8 km, a
 * factor of 1.4x-2.9x in the program's disfavour in every cell, no
 * exception. That much needs no further checking; it is a plain reading
 * of numbers already on the page and is item 11's own kind of defect,
 * not a new one -- left for wherever the barMissed sentence is next
 * touched, since fixing the sentence without the number it is attached to
 * being current would just move the inaccuracy.
 *
 * The harder half, checked here rather than assumed from the agent's
 * report: `docs/VALIDATION_REPORT.md`'s fireball section shows, four
 * lines apart, "5.3 km" (the table, `fireballRules.ts`/`fireballRun.ts`,
 * rules 76-79 -- every one of 357 CNEOS fireballs, the model alone) and
 * "13.74" (the prose, `fireballAnchorRules.ts`, rules 126-128 -- only the
 * 356 fireballs where the model AND the program both burst in the air,
 * scored against a different question: does the model agree with the
 * program, not how far either sits from the sky). The prose says "The
 * miss above is the field's own" -- naming the table two paragraphs up as
 * its source, which it is not.
 *
 * Verified directly, not assumed stale: `nasaAuditCorrectionsRules.ts`
 * (rule 1193) permanently froze I2's evidence text at "13.74 km... 12.75
 * km" (`goldStandardScorecard.ts` line ~324), and `GOLD_STANDARD.md`
 * carries the same figures. Rule 691-697's entry change (~21 September)
 * predates that freeze, so the question was live: is 13.74 the CURRENT
 * model, or a number rule 1193 itself already inherited stale? Recomputed
 * today, from `benchmark/results/eiep-fireballs-2026-09-16.json`'s own
 * saved inputs (`sent`: diameter, density, speed, angle -- the program's
 * own frozen answers are a fixed external reference and untouched),
 * calling today's `atmosphericEntry` fresh for all 357 rather than
 * reading the file's frozen `nimbusBurstKm`: within 352, bm13 4,
 * unanswered 1, median 13.7432 km / mean 12.7539 -- matching the frozen
 * 13.7441 / 12.7538 to four figures. **The 13.74 km figure is correct,
 * current, and unmoved by the entry change.** Rule 1193's freeze, and
 * GOLD_STANDARD.md's I2 row, are NOT stale and are not touched by this
 * rule.
 *
 * What IS wrong, fixed here: `generate-validation-report.ts`'s own prose
 * template says "The miss above is the field's own" immediately after
 * describing the rules-126-128 comparison, pointing a reader at the
 * rules-76-79 table two paragraphs earlier instead of at the comparison
 * the sentence itself just finished describing. Reworded to name what it
 * actually reports (the same 356-fireball, both-burst subset the
 * sentence's own preceding clause already scoped) rather than "above",
 * and to say plainly that it is a narrower, different count from the
 * table's 357/351 -- not a second reading of the same figure. No number
 * changes; `docs/VALIDATION_REPORT.md`/`.json` are regenerated
 * (`pnpm validation-report`) so the committed report matches, which CI's
 * freshness gate already requires.
 *
 * What this rule does NOT resolve, named so it is not mistaken for
 * settled: WHY rules 76-79's reading (5.3 km median, 351 of 357 burst)
 * and rules 126-128's (13.74 km, 356 of 357 burst, a different
 * denominator) differ this much for what both call "the same 357
 * fireballs" is not traced to its mechanism here -- the two pipelines
 * build the scenario each fireball is run as from the same catalogue row
 * by two separate code paths (`fireballRun.ts`'s own construction vs.
 * whatever `scripts/eiep-fireballs.py` sent the program and saved as
 * `sent`, which this rule's recomputation reused rather than
 * re-derived), and reconciling them -- or confirming they are correctly
 * answering two different questions, as rules 126-128's own text already
 * argues (I2 met by construction vs. I2 as first written) -- is a reading
 * of its own, not a sentence-level fix. Left open, honestly, rather than
 * guessed at past midnight on the module this project holds itself to
 * the most.
 *
 * [Correction, rule 1207, 26 September 2026: the paragraph above that calls
 * 13.74 km "correct, current, and unmoved by the entry change" and rule
 * 1193's freeze "NOT stale" is wrong. Its recomputation called
 * `atmosphericEntry` with no strength, which reads Collins et al.'s Eq. 9 --
 * the program's law, not the two-stage law the product has shipped since 23
 * September 2026 (rules 896 to 902). On the shipped law the same 357 read
 * 5.30 km in the median and +1.69 km in the mean, the table's figures; the
 * gap this rule left open is that law, and rule 1207 traces it and corrects
 * every text that printed the Eq. 9 figure as the shipped entry's.]
 */
export const RULE_1205_WRITTEN = '2026-09-25' as const;

/**
 * RULE 1206. A12, ITEMS 1 AND 5 OF RULE 1203'S LIST: A MONTE CARLO RANGE
 * CALLED A CONFIDENCE INTERVAL, A DASHED LINE THAT IS NO LONGER DRAWN, AND
 * A PROBABILITY VIEW THAT INHERITS A LABEL IT NEVER EARNED.
 *
 * Read, not assumed, before writing:
 *
 * (a) `landing.facts.monteCarlo` sets "P10–P90" beside "confidence
 *     intervals from Monte Carlo sampling". A P10–P90 range of outcomes over
 *     sampled inputs is not a confidence interval (a statement about an
 *     estimated parameter from data); it is the spread of results when the
 *     inputs are drawn from their assumed distributions. Reworded to say
 *     that.
 * (b) `landing.instrument.uncertainty.detail`: "the nominal value is drawn
 *     as a solid line, its spread as a dashed line". Checked in `Globe.tsx`:
 *     the only `PolylineDashMaterialProperty` left are the tsunami's hourly
 *     isochrones and the volcanic ashfall isopach -- neither is an
 *     uncertainty band, and no impact ring has a dashed spread line since
 *     the grammar round of 22-23 September (rules 1028-1036). The spread is
 *     shown today by the probability view (its own tab) and, after a Monte
 *     Carlo run, by the faint P10–P90 halos (rule 1201). Reworded to that.
 *     `methodology.uncertainty.outputNote`'s "the dashed rings on the globe
 *     read a table of their own" gets the same correction (the table is
 *     `ringSigma.ts`; the rings are not dashed on the impact globe).
 * (c) The probability view (`impactFieldMap.ts`, `layerEvidence` for
 *     `layer.id === 'uncertainty'`) takes its evidence class from
 *     `FAMILY_EVIDENCE[family]` -- class A for blast, ejecta and crater --
 *     while what it draws is a band: for the `probability` kind a 1σ on the
 *     radius from `RING_RADIUS_SIGMA` (`ringSigma.ts`), which
 *     `visualContracts.ts`' own `sigmaUpperBand` contract already says is,
 *     for most quantities, "a project convention and not a band scored on a
 *     held-out set"; for the `agreement` kind (a complete airburst's blast)
 *     the disagreement of Collins et al. 2017's three models, published but
 *     never scored either (I3 not met, frozen by rule 1193). Class A is
 *     "implementation verified against the reference program, case by
 *     case" -- no band has been so checked. The fix follows the precedent
 *     `layerEvidence` already sets for the low overpressure (rule 1031
 *     (c)): the uncertainty layer carries `klass: 'exploratory'`, the
 *     exploratory label, and a summary of its own saying what the band
 *     rests on, one for each kind. The `quantity` stays the family's, as
 *     the low overpressure's does.
 * (d) The probability kind's three texts call its σ "the published scatter
 *     of the radius" (`globe.impactMap.note.probabilityFrom`,
 *     `.source.probability`, `.isoline.probability`). True in part only:
 *     for the two fire rings (mass fire, ignition) σ = 0.3 is Glasstone &
 *     Dolan's own Table 7.40 footnote, ±50 % in the field, carried through
 *     the inverse square (`OUTPUT_SIGMA`, 19 September); for the burns
 *     (0.3), the blast (0.18) and the ejecta (0.5) `ringSigma.ts` names no
 *     source for the figure. Reworded to "a 1σ the project sets for the
 *     radius", with the fire rings' derivation named where it is true.
 *
 * Left as it is, and why: `globe.legend.uncertaintyNote` also speaks of
 * dotted and dashed lines and of a published 1σ, but `RingLegend.tsx`
 * renders it only when the active result is NOT an impact
 * (`impactMap === null`) -- the paused modules, which the site no longer
 * offers (impacts only, since 22 September 2026). Named, not touched.
 *
 * No number moves. What the globe and the report say about the probability
 * view moves, so the seal's drawing and text digests will move on every
 * scenario that has that view: re-sealed under rule 833 with this as the
 * reason.
 */
export const RULE_1206_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1207. A12, ITEM 2 OF RULE 1203'S LIST, AND THE SENTENCE A2 QUOTES:
 * THE ENTRY'S FIGURES WERE READ ON TWO STRENGTH LAWS AND PRINTED AS ONE --
 * AND RULE 1205'S CONCLUSION, WHICH WAS WRONG.
 *
 * (a) What rule 1205 left open, traced to its mechanism: the 5.30 km of
 *     rules 76 to 79 and the 13.74 km of rules 126 to 128 differ by the
 *     strength law, not by the two pipelines. `fireballRun.ts`'s
 *     `fireballRow` runs every bolide under `DEFAULT_STRENGTH_LAW`, which is
 *     `'twoStage'` since c9d35e8 (23 September 2026, rules 896 to 902): a
 *     body of 3 000 kg/m³ with no strength given starts its pancake at the
 *     second stage's strength of meteoroids, `MAIN_STAGE_STRENGTH`, about
 *     2.12 MPa (the geometric mean of Borovička et al. 2020's 0.9-5 MPa).
 *     The comparison with the program (rules 126 to 128; in the report
 *     `readEntryCellsFor(runFireball('density'))`, rule 898(a)) is pinned to
 *     the program's own law, Collins et al.'s Eq. 9 -- and so was rule
 *     1205's recomputation, which called `atmosphericEntry` with no strength
 *     and therefore read Eq. 9 too. Read again on 26 September 2026 from the
 *     same saved inputs (`benchmark/results/eiep-fireballs-2026-09-16.json`,
 *     `sent`), both ways, through rules 126 to 128's own
 *     `fireballAnchorVerdict`: on Eq. 9, within 1 % on 352, BM-13 on 4, 1
 *     refused, median 13.743 km, mean +12.754 km; on the shipped two-stage
 *     law, within 1 % on 0, BM-13 on 351, regime 5, 1 refused, median
 *     5.300 km, mean +1.692 km -- the report's table to the digit. The
 *     adoption's own outcome (`strengthTwoStageAgainRules.ts`, (b)) already
 *     said so on 23 September: "13.74 km under `density`, 5.30 km under
 *     `twoStage`".
 *
 * (b) So rule 1205 was wrong in the part it called verified. "The 13.74 km
 *     figure is correct, current, and unmoved by the entry change" is true
 *     of the model run on the program's law and false of the entry the
 *     product ships; "rule 1193's freeze, and GOLD_STANDARD.md's I2 row, are
 *     NOT stale" is wrong in the one place that matters -- both give 13.74
 *     and 12.75 as the reading of "rules 76 to 79", which have read 5.30 and
 *     +1.69 since 23 September. The audit had it right on its first page
 *     ("5,3 km ... barra 5 km non raggiunta; 13,7 km sulle equazioni del
 *     programma") and quoted the sentence in A2: "il programma manca di
 *     13,68 km, questo ingresso di 13,74, accanto a una tabella che per la
 *     stessa riga mostra 5,3 km". Rule 1205 re-read the number and not the
 *     law it was computed on. A bracketed correction is added at its end, as
 *     rule 1195's was, so its conclusion is not read as settled.
 *
 * (c) What is false, and the fix for each. No number moves; no status moves.
 *     1. `validation.entry.barMissed` (en, it): "neither by this model nor
 *        by the reference program, which misses the recorded altitude by
 *        about as much. It is a gap of the published equations, not of this
 *        implementation" -- false against the page's own cells (the model
 *        4.5-7 km, the program 9.5-15.8 km). Rewritten to say what the page
 *        shows: the bar is missed by this model's median, on the two-stage
 *        law (Borovička et al. 2020, adopted on 23 September 2026 and chosen
 *        with these bolides already read, rule 900 -- so not a held-out
 *        reading); the program, on Eq. 9, misses by its own range across the
 *        cells below, the model by its. Every figure interpolated from the
 *        report's JSON, none written into the string.
 *     2. `validation.entry.readings.default` (en, it): "As the panel runs it
 *        (stony, 1 MPa)" -- the row is the body with no class, which carries
 *        about 2.1 MPa under the two-stage law; 1 MPa is the next row's body.
 *        Rewritten to name the law and its strength.
 *     3. `validation.entry.within` (en, it): "Inside the cell's band" heads
 *        `counts.within`, which is rules 126 to 128's count of the fireballs
 *        where the model, on Eq. 9, agrees with the program within 1 % -- not
 *        the band of rules 739 to 747. Rewritten to say what it counts.
 *     4. `generate-validation-report.ts`, `FIREBALL_LABEL`: the default
 *        body's label, "(Collins et al.'s Eq. 9 strength)", names the law
 *        the product left on 23 September; and the stony row's, "The panel's
 *        stony class, 1 MPa", names a class the panel does not have -- its
 *        S-type is 3 300 kg/m³ at 2 MPa (`ASTEROID_TAXONOMY`), while the row
 *        runs 3 000 kg/m³ at 1 MPa. Both relabelled to what the row runs.
 *     5. The report's verdict paragraph: "and **it is met**" gives I2 a
 *        status rule 1193 took from it (the amendment's reading is I5);
 *        "this entry's 13.74" is the model on the program's law; and "it is
 *        the field's error, not a gap of this model's" is false of the
 *        shipped entry, whose 5.3 km is its own. Rewritten to name each law
 *        with its figure and to say that the shipped law's 5.3 km was read
 *        on bolides its choice was not blind to (rule 900).
 *     6. The report's cell table: its lead-in says which column is read on
 *        which law -- the model's miss on the shipped law, the agreement
 *        with the program on Eq. 9 (rule 898(a)) -- which the table itself
 *        never said.
 *     7. `goldStandardScorecard.ts`, I2's frozen evidence: the figures it
 *        gives as "rules 76 to 79" are rules 126 to 128's on Eq. 9. The
 *        STATUS does not move: the shipped entry's median, 5.30 km, is over
 *        the 5 km bar, so I2 as first written is not met on either law (its
 *        mean, +1.69 km, is within 3 km; the median alone fails it). The
 *        figures sentence is corrected, with a bracketed note saying what it
 *        first said and which rule changed it. I5's evidence names the law
 *        its 13.74 km is read on.
 *     8. `docs/GOLD_STANDARD.md`, rule 1193's amendment paragraph: the same
 *        attribution. That file never rewrites a record in place, so the
 *        paragraph stays as written and a dated correction follows it.
 *     9. The report's list of what parts from the program by design,
 *        "**Strength.**": it says a chosen class is taken and that the grid
 *        reads Eq. 9, and says nothing of a body with no class -- which is
 *        the two-stage law's since 23 September. The sentence that says so
 *        is added; the audit's "il report non nomina ... la legge a due
 *        stadi" (A2) is this, for the entry.
 *
 * (d) Left as they are, and why: GOLD_STANDARD.md's lines of 16 September
 *     (the dated entry "I2 met" and the row of "Where each domain stands, 15
 *     September 2026") are dated records, true on the law in force that day
 *     -- Eq. 9 was the default until 23 September. The page's third row,
 *     "Iron strength", is true as it stands.
 *
 * No number of any scenario moves and nothing the globe or the impact report
 * draws or prints is touched, so the seal does not move. The validation
 * report moves in its prose and its labels: regenerated once.
 */
export const RULE_1207_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1208. A12, ITEM 4 OF RULE 1203'S LIST: "CODICI DELLE REGOLE (I1, G3)
 * SENZA DESCRIZIONE".
 *
 * Read before writing: the validation page's table of the gold standard's
 * rules (`ValidationPage.tsx`, section `validation-rules`) prints each rule
 * by its code alone -- I1 to I6, G3 to G7, the eleven the Impacts domain
 * counts since rule 1193 -- beside what it measures (fidelity or beyond) and
 * its verdict. What each code asks is written only in
 * `docs/GOLD_STANDARD.md`, which the page does not link from the table. A
 * visitor reads "G3 -- not held" and cannot tell what was not held. The
 * codes elsewhere in the interface (the panel's and the globe's "(I1)",
 * "(I2)") already sit inside a sentence that says what was measured, so
 * they are citations, not bare codes; they are not touched.
 *
 * The fix: a column "What it asks" in that table, one sentence per rule in
 * both languages, each a plain reading of the rule's own text in
 * `docs/GOLD_STANDARD.md` ("Every domain" for G3 to G7, "Impacts" for I1 to
 * I6) -- the bound as written, never the amended reading and never a
 * verdict; the verdict stays in its own column. The frozen rules (I2, I3)
 * are described as first written, which is what their status now counts.
 * The page's existing test that every measure of a rule has words is
 * extended to every code the report hands the page, so a rule opened later
 * cannot reach the page as a raw key.
 *
 * Found while reading the same table: its lead-in, `validation.rules.body`,
 * says the letter gives the measure -- "I-rules for fidelity to the
 * equations, G-rules for what lies beyond them" -- which the table's own
 * second column has contradicted since rule 1194 re-read I2 and I3 as
 * 'beyond' (both ask the model to match the sky, which no tool of the field
 * computes). The letter says whose rule it is -- I the Impacts domain's own,
 * G every domain's -- and the column says what it measures. And its last
 * sentence, "A rule holds or it does not; there is no partial credit", is
 * true of the "held" count and false of the reading printed right under it:
 * `ruleCredit` gives a rule with clauses the share of them that holds (I3's
 * two of four earn 0.5 of the 6.9). Both reworded to what the code does, in
 * both languages.
 *
 * No number moves; nothing the globe or the impact report prints is
 * touched, so the seal does not move.
 */
export const RULE_1208_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1209. A12, ITEM 3 OF RULE 1203'S LIST: "DUE DENOMINATORI (938 SU 83
 * IMPATTI; 1 794 IMPATTI) SENZA SPIEGAZIONE".
 *
 * Read before writing. The landing page and the validation page each carry
 * a tile "938 -- comparisons, over 83 impacts of a fixed grid"
 * (`landing.validation.programCases`, `validation.summary.comparisons` and
 * its note). The 938 is the sum of `verification.eiep.summaries[].pairs`:
 * one pair is one quantity of one impact, thirteen quantities, not all of
 * which an impact has (a ground impact has no burst altitude, an airburst
 * no crater), on the 81 of the grid's 83 impacts the program answered (it
 * refuses 2), and the ejecta edge read at several distances (281 pairs).
 * Nothing on either page says any of that, so 938 "over 83" reads as a
 * count that cannot be. The report's level A, meanwhile, gives its own
 * readings per quantity -- 1 794 for the energy -- over a different grid:
 * the same 83 plus the 1 782 `scripts/eiep-grid.py` fixed, 1 865 in all, of
 * which the program refused 71; and nothing on the pages says that grid
 * exists, so a reader of both meets two counts of "impacts compared" and no
 * word joining them.
 *
 * The fix, in words only -- no count changes:
 *   (a) the two tiles say what one comparison is, and how many of the grid's
 *       impacts the program answered: "one quantity of one impact, on the
 *       {{answered}} of {{impacts}} impacts of the first fixed grid the
 *       program answered";
 *   (b) both then name level A's wider grid in one clause, from the report's
 *       own `verification.levelA` (cases, the program's refusals, readings,
 *       the date read), so the second count is on the page with what it
 *       counts rather than only in the report;
 *   (c) the report's level A lead-in says, beside its own count, that a
 *       row's readings are the grid's impacts the program answered for that
 *       quantity -- 1 794 = 1 865 - 71 where every impact has it -- and that
 *       the public pages' 938 is the first grid's.
 * The figures are interpolated from the report's JSON, none written into a
 * string. Nothing the globe or the impact report prints is touched; the
 * seal does not move.
 */
export const RULE_1209_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1210. A2, "PORTARE NEL REPORT CIÒ CHE IL CODICE SA (WJ1, TERZO
 * INSIEME, FCM, DUE STADI)" -- THE THREE OF THE FOUR RULE 1207 DID NOT
 * COVER.
 *
 * Read before writing: at d9adf46 `docs/VALIDATION_REPORT.md` names none of
 * them -- "WJ1" 0 times, "third set" 0, "FCM" and "fragment-cloud" 0,
 * "two-stage" 0 (the one "twoStage" is rule 1193(b)'s configuration name).
 * Rule 1207 brought the two-stage law into the entry's section. The other
 * three each have their record in the repository, and two have a function
 * that recomputes their verdict:
 *   - Level B's second round: `levelB2Score.ts`, `scoreLevelB2()`, over the
 *     predictions committed before any observed value
 *     (`levelB2Predictions.json`, aaec9bf) and `levelB2Targets.ts`. Read on
 *     26 September 2026: "incompatible with 2022 WJ1; no class B" -- E1
 *     fails (8.2 % of the draws answer that no crater forms, against a bar
 *     of 90 %), E3 holds on the draws that dig none.
 *   - The third set: `thirdSetRun.json`, rule 1126's one paired run, whose
 *     verdict `thirdSetAudit.ts`'s `auditThirdSetRun()` re-derives apart from
 *     the judge: S not adoptable under version 2. Its baseline is the
 *     product itself (`simulateImpact`, rule 1126 (b)), so the record also
 *     says, body by body, whether the product's release band meets the
 *     observed interval -- `bodies[].o1.baseline.compatible`.
 *   - The fragment-cloud branch: `effects/fcmBranch.ts`, in development and
 *     "not read by the product" by its own header; its round 3 judged by
 *     `fcmRound3Verdict.json` (rule 1168 (e)); its survival-light round and
 *     causal dossier closed by rule 1192 (c), "NOT IDENTIFIABLE" for both
 *     candidates, in `fcmSurvivalLightRules.ts`.
 *
 * The fix: a section of the report after level B's, one paragraph for each
 * of the three, every verdict computed by the function that owns it or read
 * from the record that holds it -- never retyped into the generator -- and
 * the report's JSON carries the same verdicts. What each paragraph may say
 * is what its record says; nothing is summarised past it, and each names
 * its file so a reviewer can read the rest there.
 *
 * No number of any scenario moves and nothing the globe or the impact
 * report prints is touched; the seal does not move.
 */
export const RULE_1210_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1211. A2, "VERSIONARE IL RIFERIMENTO (DATA, CASI RIFIUTATI, HASH
 * DELLE RISPOSTE)".
 *
 * Read before writing: the reference is a web service with no version of
 * its own (the audit's words: "un servizio web non versionato"); what this
 * repository compares against is its answers, saved on the day they were
 * asked. Three sets: the first grid of 83 impacts (read 14 September 2026),
 * level A's wide grid (`validation/eiepGrid.json`, 1 865 impacts, read 23
 * September 2026) and the 357 CNEOS fireballs
 * (`benchmark/results/eiep-fireballs-2026-09-16.json`). The report gives
 * each one's date and, for level A, its refusals; it gives no fingerprint of
 * any answer file, so a reader cannot tell that the answers compared today
 * are the ones read that day.
 *
 * The fix: a table in the report, one row per saved answer set -- its file,
 * the date read, the cases asked, the cases the program refused (its own
 * error text), and the SHA-256 of the file's bytes, computed by the
 * generator from the file itself at every regeneration. The JSON carries
 * the same. A changed answer file changes its hash, which changes the
 * report, which CI's freshness gate already refuses to let pass
 * unregenerated: the fingerprint is kept honest by the machinery that
 * already exists, not by a new test. Where a set's answers live in a
 * TypeScript module rather than a file of their own, the hash is of that
 * module's source and the row says so.
 *
 * No number of any scenario moves; the seal does not move.
 */
export const RULE_1211_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1212. A12, ITEM 9 OF RULE 1203'S LIST: THE "COASTAL DEEP DIVE (TIER
 * 2)" -- "SENZA CLASSE DI EVIDENZA E SOLO IN INGLESE"; THE AUDIT'S FIX, "OGNI
 * OGGETTO ... CON SCHEDA O NON DISEGNATO".
 *
 * Read before writing (`SimulatorPanel.tsx`, `DeepDivePanel` and the button
 * that runs it; `useAppStore.ts`, `evaluateDeepDive`): a 1D radial
 * Saint-Venant solver (`physics/tsunami/saintVenant1D.ts`, MUSCL-RK2, Manning
 * n = 0.025) on a flat basin of one depth -- the scenario's mean ocean
 * depth -- 400 cells of 10 km, started from a Gaussian hump whose height is
 * the scenario's tsunami source amplitude (Ward & Asphaug's cavity, through
 * `impactSourceAmplitude`) and whose σ is a fixed 350 km, whatever the
 * cavity's own size; no dispersion, no bathymetry, no coast; the peak |η|
 * read at 100, 500, 1 000, 2 000 and 3 000 km. Nothing in the repository
 * checks it against a reference for an impact. Every word it prints --
 * the button, its title, the heading, the table's columns, the chart's
 * label, the footer, the three error messages the store sets -- is English
 * written into the code, and no class of evidence goes with any number.
 *
 * Of the audit's two ways ("con scheda o non disegnato"), the one that
 * takes no decision away from Andrea: the card. Whether to keep the panel
 * at all is his, and is put to him. What changes:
 *   (a) every string in both languages, the store's three messages turned
 *       into codes the panel words (a solver's own exception text is
 *       printed as it comes, after a translated lead);
 *   (b) under the table, rule 1029's five-field card, drawn by the same
 *       `CardFields` the globe's legend uses: the quantity (the peak surface
 *       elevation, m); the state, exploratory; the source and model, as read
 *       above, the 350 km σ said to be fixed and not the cavity's; the
 *       extent, the five probe ranges; beyond them, not modelled (no coast,
 *       no run-up, no bathymetry);
 *   (c) the button's own title says the class too, so it is known before
 *       the solver runs.
 * No number moves -- the solver, its source and its probes are untouched.
 * The panel is not part of the seal's digests (it prints only after a
 * click), so the seal does not move; checked, not assumed, by re-running it.
 */
export const RULE_1212_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1213. A12, ITEM 10 OF RULE 1203'S LIST, FINISHED: THE PRINTED
 * REPORT'S FIELDS RULE 1202 LEFT OPEN -- "BANDA I2, VERDETTO DELLA CELLA
 * MISURATA, ... TABELLA MONTE CARLO E VARIANTI DEL MODELLO ATTIVE, E NON
 * CITA BOROVIČKA 2020 (LEGGE DI DEFAULT)".
 *
 * Read before writing: the panel already prints two of them for every
 * impact (`SimulatorPanel.tsx`, the entry's block): G4's verdict,
 * `entryCellSentence(result.measuredCells.entry)`, and I2's band,
 * `result.entryAltitudeBand` (null outside the measured cells, where the
 * panel says so). The report (`impactReportModel.ts`, `buildImpactReport`)
 * prints neither. The Monte Carlo table the panel draws after a run
 * (`MonteCarloPanel`) never reaches the report, which only knows that a run
 * happened (`extras.monteCarlo`). The model's variants -- the sixteen
 * switches `ImpactScenarioInput` carries (the strength law, the entry's
 * atmosphere and equations, the crater's domain, the ground blast, ...) --
 * are printed nowhere, so a printed page cannot say which configuration
 * made it. And `collectImpactCitations` (`reportCitations.ts`) cites
 * Collins, Chyba, Popova and the rest, but not Borovička, Spurný & Shrbený
 * (2020), whose second-phase strength the default law starts every stony
 * body without a class at (rules 882 to 902).
 *
 * The fix:
 *   (a) two rows in the report's entry group, tagged with the entry's
 *       evidence: the measured cell, in the panel's own sentence (the
 *       sentence's function given the report's translator, so the seal's
 *       two languages read it as the page does), and I2's band, or the
 *       panel's own words where there is none;
 *   (b) a row in the scenario group, the model's configuration: each of
 *       the fourteen switches with the value the run used, those set away
 *       from their default marked -- read from one table of the defaults
 *       the simulator itself reads (`IMPACT_MODEL_DEFAULTS`, exported beside
 *       `simulateImpact`), whose test holds it to those constants one by
 *       one, so the page cannot print a default the code does not use;
 *   (c) Borovička, Spurný & Shrbený (2020), AJ 160, 42, DOI
 *       10.3847/1538-3881/ab9608 (arXiv:2006.07080, rule 883; the DOI read
 *       from arXiv's own page on 26 September 2026), added to the
 *       bibliography and cited by the report wherever the run started a
 *       body at the two-stage law's strength;
 *   (d) the Monte Carlo table printed in the report when a run exists, the
 *       panel's own table, under a heading and with its footer -- and the
 *       footer itself corrected, since it would now be printed: "Inputs
 *       sampled from published distributions ... P10–P90 bracket the 80 %
 *       confidence band" is rule 1206 (a)'s defect again (a spread of
 *       outcomes over drawn inputs is not a confidence band) and rule 1206
 *       (d)'s (the three spreads are the project's -- σ_log 0.15 on the
 *       diameter and on the density, 10 % on the speed, `uq/conventions.ts`,
 *       the density's called "a project value" in its own comment --
 *       informed by Mainzer 2019, JPL's orbital fits and Britt & Consolmagno
 *       2003, not distributions those sources publish). Reworded to that.
 * Also, found in the same reading: `ImpactScenarioInput.impactorStrength`'s
 * doc comment still says it "Defaults to STONY (1 MPa)" -- the default is
 * the two-stage law's main-stage strength since 23 September; corrected
 * with rule 1207's figures.
 *
 * No number moves. The report's text moves in every scenario (two rows of
 * the entry, one of the scenario, a citation where the law applies), so the
 * seal's text digests move: re-sealed under rule 833 with this as the
 * reason. The drawing does not move.
 *
 * [Amended the same night, before the push: (b)'s row among the numbers
 * pushed the numbers' sheet onto a second A4 page -- found by the end-to-end
 * suite's own check, "prints to A4, a sheet a page", run locally before
 * pushing (measured per sheet: the numbers 1 page before, 2 after). The
 * configuration is printed instead as a paragraph of the method's sheet,
 * with the formulas it chose, which kept its one page. Re-sealed again,
 * text digests only.]
 */
export const RULE_1213_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1214. A12: "I VALORI NON VALIDI DIGITATI NEI CAMPI SONO IGNORATI IN
 * SILENZIO"; THE AUDIT'S FIX, "VALIDAZIONE DEI CAMPI VISIBILE".
 *
 * Read before writing: the impact's number fields (`ImpactCustomInputs.tsx`)
 * pass every keystroke to an update function that stores the value only if
 * it parses and lies in the field's domain -- a diameter, a speed and the
 * two densities above zero, an angle above 0° and at most 90° -- and
 * otherwise does nothing. `DraftNumberInput` keeps the typed text while the
 * field has focus and, on leaving it, shows what the store kept. So "-5",
 * "0" or "95°" is dropped without a word, and the field quietly goes back
 * to the old value; the validator's feedback (`useFieldIssues`, printed by
 * `QuantityRow`) only ever sees values that were accepted. The azimuth is a
 * slider and cannot take an invalid value.
 *
 * The fix, in the panel only: each of the five fields keeps the text it
 * refused, and while it does, its row prints -- where the validator's
 * issues already go, as an error -- that the text was not accepted, what
 * the field takes, and the value the scenario keeps. The note clears at the
 * next accepted keystroke, when the field is emptied to be retyped, and
 * when a preset replaces the inputs. What each field accepts is the update
 * function's own test, written once and read by both, so the words and the
 * test cannot part. Nothing the model computes moves; the seal does not
 * move.
 */
export const RULE_1214_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1215. A12, ITEM 13 OF RULE 1203'S LIST: "IL GLOBO NON È OPERABILE DA
 * TASTIERA NONOSTANTE IL README"; THE AUDIT'S FIX, "TASTIERA O INSERIMENTO
 * DI COORDINATE".
 *
 * Read before writing: the only keyboard path to a point today is the
 * panel's city search (`CitySearch.tsx`): a name from the Natural Earth
 * index, Enter for the first match. A point that is not a city -- open
 * sea, a coast between towns, a desert -- takes a click on the canvas.
 * README.md says as much since rule 1195 ("picking a point still needs a
 * click or a searched city name").
 *
 * Of the audit's two ways, the smaller and the one that serves every point:
 * coordinates, typed where a city already is. The same field reads a
 * latitude and a longitude -- decimal degrees, signed or with N/S and E/W
 * (O for "ovest" too), separated by a comma, a semicolon or a space, a
 * decimal comma accepted where the separator leaves no doubt -- and offers
 * "go to" those coordinates as its first result, which Enter takes, exactly
 * as it takes a city. Out-of-range figures (|lat| > 90, |lon| > 180) are
 * not offered, and the list says why. The parser is a pure function with
 * its own tests; the pin and the camera move through the same two store
 * actions a city uses. The label, the placeholder and README.md's sentence
 * say the field now takes coordinates.
 *
 * No number moves; the seal does not move.
 */
export const RULE_1215_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1216. A12, ITEM 8 OF RULE 1203'S LIST: "IL CRATERE E L'ANELLO DELLA
 * CAVITÀ NON HANNO SCHEDA"; THE AUDIT'S FIX, "OGNI OGGETTO SUL GLOBO CON
 * SCHEDA O NON DISEGNATO".
 *
 * Read before writing: `impactFieldRenderer.ts` draws the crater -- a dark
 * disc, a light rim and a label -- "on every layer" wherever
 * `damage.craterRim` is above zero; `Globe.tsx` draws the tsunami's source
 * cavity as a blue ring wherever the result has a tsunami with a cavity
 * radius above zero (`addCavityRing`). Neither is a layer of the map, so
 * neither reaches the legend's card (rule 1029) or the report's table of
 * cards (rule 1037 (b)); the only words they have are a hover tooltip.
 *
 * The fix, the card, not the removal (both objects are what the scenario
 * computes, and what the tooltip already sources): a pure function beside
 * the layers (`impactFieldMap.ts`, `fixedImpactObjects`) gives, for each
 * object the globe draws on every layer, its label and rule 1029's five
 * fields --
 *   - the crater: its rim's radius; the state A (the crater family's, level
 *     A) where the crater is computed at 200 m or more, exploratory below
 *     (rule 955's bound, the report's own `craterExploratory` test), out of
 *     domain where the crater is (rule 947); the source the tooltip already
 *     gives (`globe.tooltip.source.impactCrater`); the extent, a disc to the
 *     rim; beyond it, not applicable -- the rim is the object's edge, not a
 *     threshold;
 *   - the cavity: its radius; exploratory (the tsunami family's class); the
 *     tooltip's source (`globe.tooltip.source.impactCavity`, Ward & Asphaug
 *     2000); the extent, a ring at that radius; beyond it, not applicable.
 * The legend lists them under a heading of their own, each with its card;
 * the report's table of cards prints them after the layers'. The drawing
 * does not move. The report's text does, in every scenario with a crater or
 * a cavity: re-sealed under rule 833 with this rule and rule 1213 as the
 * reasons.
 */
export const RULE_1216_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1217. A12, ITEM 7 OF RULE 1203'S LIST, FINISHED: THE MONTE CARLO'S
 * P10/P90 HALOS AND ITS PROBABILITY MAP -- "SENZA VOCE DI LEGENDA NÉ SCHEDA,
 * IN GRADI (DISTORTI ALLE GRANDI DISTANZE)".
 *
 * Rule 1201 gave them their legend entry; two halves remain.
 *
 * (a) The card. Read: `RingLegend.tsx`'s Monte Carlo section names each
 *     halo's metric and says in a sentence what the glow is, but neither
 *     has rule 1029's five fields. Each halo, and the glow where it is
 *     drawn, gets them, in the legend, from one pure function beside the
 *     metric picker (`monteCarloHalos.ts`): the quantity (the metric's
 *     radius); exploratory; the source -- the P10 and P90 of the run's own
 *     draws, the inputs drawn with the spreads the Monte Carlo's footer
 *     names (rule 1213), checked against no reference; the extent, P10 to
 *     P90 from the centre (for the glow, out to the largest draw); beyond
 *     it, not applicable for a halo, and for the glow a computed zero -- no
 *     draw reaches farther.
 * (b) The geometry. Read (`Globe.tsx`, the Monte Carlo block): the halos
 *     are Cesium ellipses sized in metres -- geodesic, correct at any range.
 *     The glow is not: `renderRadialEcdfBitmap` paints a square canvas and
 *     a `Rectangle.fromDegrees` stretches it over latitude ± r/111 km and
 *     longitude ± that over cos(latitude). A square in degrees is not a
 *     disc on the sphere: the error grows with the radius and with the
 *     latitude (the firestorm's glow reaches 1 000-2 000 km), and past a
 *     pole the rectangle is not even defined. The fix draws the glow the
 *     way the halos are drawn: a stack of geodesic discs, one at each of N
 *     quantiles of the draws, each of the same small opacity, chosen so
 *     that where every draw reaches the stack reads the glow's old peak
 *     opacity and where none does it reads nothing -- the same "darker =
 *     reached by more draws" in metres on the ellipsoid, no degrees
 *     anywhere. The opacities and radii come from a pure function with its
 *     own test (`ecdfDiscs`); the bitmap module and its test, unused once
 *     the globe no longer paints a canvas, are removed with it.
 * Checked on the globe itself, headless (Playwright on the dev server, the
 * way this project checks what Cesium draws), after the change, at a mid
 * latitude and at a high one: the entities the scene holds, and a picture
 * of each. The old rectangle is not re-drawn to compare: its own arithmetic
 * above is the defect. No number moves; the seal does not draw the Monte
 * Carlo (no scenario of it runs one), so it does not move.
 */
export const RULE_1217_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1218. A2, "DUE COLONNE NEL CARTELLONE E NELLA PAGINA PUBBLICA:
 * FEDELTÀ AL RIFERIMENTO E VALIDAZIONE OSSERVATIVA, CON I2 «NON RAGGIUNTA»
 * NELLA SECONDA".
 *
 * Read before writing: since rules 1193 and 1194 the scorecard counts each
 * rule under what it measures and the report prints both readings side by
 * side (`goldStandard.domains[].fidelity` and `.beyond`, the report's
 * scorecard table). The public page does not: `ValidationPage.tsx` prints
 * one reading ("8 of 11 rules hold: the domain reads 6.9 out of 9") and a
 * per-rule column saying what each measures, but never the two readings the
 * audit asked for on the page -- fidelity to the reference, 9.0 of 9, four
 * of four; validation beyond it, 5.7 of 9, four of seven -- nor which rules
 * of the second do not hold.
 *
 * The fix: under the domain's reading, one line with the two readings from
 * the report's own JSON, and the codes of the rules that do not hold in the
 * second, read from the rules themselves (not typed: I2, I3 and G3 today),
 * each code already described in its row since rule 1208. Both languages.
 * No number moves; the seal does not move.
 */
export const RULE_1218_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1219. A12: "I DIAMETRI DI POPIGAI E BOLTYSH NEI PRESET SONO RICAVATI
 * A RITROSO DAI CRATERI ... E L'INTERFACCIA NON LO DICE"; THE AUDIT'S FIX,
 * "PRESET BACK-SOLVED ETICHETTATI «COERENZA»".
 *
 * Read before writing: rule 1195 put the sentence in both presets' notes
 * (`IMPACT_PRESETS.POPIGAI.note`, `.BOLTYSH.note`: "circular, not a
 * check"). Two things it did not do. The label: nothing where the preset is
 * chosen or printed says "consistency" -- the selector reads "Popigai 35.7
 * Ma" like any other, and so does the report's heading. And the language:
 * the panel reads a preset's note from `presets.impact.<id>.note` and falls
 * back to the English written beside the physics where the key is missing
 * -- and it is missing for Popigai, Boltysh and Sikhote-Alin, so an Italian
 * reader got all three in English, the circularity sentence included.
 *
 * The fix:
 *   (a) one exported set beside the presets (`CONSISTENCY_PRESETS`,
 *       `simulate.ts`: Popigai and Boltysh, the two whose diameter is
 *       back-solved with this model's own crater law), read by the panel's
 *       selector, which labels them "consistency" / "coerenza", and by the
 *       report, whose event line says it and why -- inside
 *       `buildImpactReport`, so the seal reads it as the page prints it;
 *   (b) the three missing Italian notes, translated from the English beside
 *       the physics, the circularity sentence included.
 * Meteor Crater's impactor is also inferred from its crater in the
 * literature (level B already counts it "consistency only, class D", rule
 * 857 (d)), but by others' fits, not this model's law, and the audit named
 * the two back-solved here: named, not touched, for Andrea.
 *
 * No number moves. The report's text moves for the two presets: re-sealed
 * under rule 833 with this as the reason.
 */
export const RULE_1219_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1220. A12: "IL TASSELLO «13 / 13» DELLA PAGINA DI VALIDAZIONE È
 * CABLATO COME CONTEGGIO/CONTEGGIO E NON CALCOLATO CONTRO ALCUNA SOGLIA";
 * THE AUDIT'S FIX, "TASSELLI CALCOLATI, NON CABLATI".
 *
 * Rule 1195 relabelled the tile ("quantities compared against the reference
 * program") and left its figure as it was, `{quantities.length} /
 * {quantities.length}` in both `ValidationPage.tsx` and
 * `LandingValidation.tsx`, saying no threshold could be computed against
 * without inventing one. One exists, and was written before any answer was
 * read: level A's bar (`levelA.ts`, `LEVEL_A_BARS.excellent`, 2 %, commit
 * 509e3d7). The tile now counts the quantities whose geometric mean of
 * model over program lies within that bar -- a figure that falls the day a
 * quantity drifts, which a count over itself never could -- and its words
 * say which bar, read from the constant, not typed. It reads 13 / 13 today
 * because every departure is under 0.5 %: the same figure, now computed.
 * No number of the model moves; the seal does not move.
 */
export const RULE_1220_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1221. A8: "RELEASE.YML ESEGUE MENO CONTROLLI DELLA CI ORDINARIA
 * (NIENTE GATE DI VALIDAZIONE, SIGILLO, BUNDLE NÉ PLAYWRIGHT, CONTRARIAMENTE
 * AL SUO COMMENTO)".
 *
 * Read: `.github/workflows/release.yml`'s header says it "re-runs every
 * quality gate against the tagged commit first (typecheck, lint, format,
 * unit, build, build-storybook, full Playwright matrix)"; its one verify job
 * runs the first six and no Playwright at all, and nothing of what
 * `ci.yml` also gates -- the validation report's strict gate and freshness,
 * the seal on its pinned platform, the bundle budget. Whether a release must
 * run all of them is a decision about releases, which this project has not
 * yet made (no tag has been cut) and which is Andrea's; what is not a
 * decision is a comment that claims a check the file does not run. Fixed:
 * the comment now says what the job runs and names what it does not, with
 * a pointer to `ci.yml`, where those gates run on every push. No workflow
 * step changes.
 */
export const RULE_1221_WRITTEN = '2026-09-26' as const;
