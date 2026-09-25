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
 * ocean site into land with no warning; the keyboard-navigation claim.
 * Several need code most of the way through the render path this round has
 * not read carefully enough to touch safely -- left open and said so.
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
