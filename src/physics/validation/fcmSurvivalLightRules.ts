/**
 * Rules 1178 to 1191 — the opening document of the survival–light round, on
 * the reviewer's approval of 25 September 2026: a round of development on the
 * FCM branch's own physics, before any test that could adopt it, and — apart
 * — the custody protocol and the reconnaissance of a genuinely blind fifth
 * set. Written and pushed before any code. A readable version:
 * docs/FCM_SURVIVAL_LIGHT_OPENING.md.
 *
 * RULE 1178. THE QUESTION, two findings the round treats as one, because they
 * may share a cause:
 *   (a) survival: in round 1's development, every case and every
 *       configuration lands far more mass than is known — Chelyabinsk 24 to
 *       453 t at the median (Popova et al.'s 4 to 6 t), Tagish Lake 6.7 to
 *       10 t (W18's 190 kg), 2008 TC3 7.0 to 10.4 t (its meteorites 283 g at
 *       most), Tunguska up to 911 t where nothing was found; the registered
 *       tuning of rule 1160 cut it without reaching the objective;
 *   (b) the deposit–light mismatch: round 3's diagnostic on four events found
 *       the branch's main peak of energy deposition close to the onset of
 *       fragmentation, at or above the brightest flare's altitude, worst at
 *       Neuschwanstein (rule §1177's diagnostics). The same pattern holds on
 *       round 1's own development cases: on M1 with clouds unlimited, the
 *       peak sits 0.5 to 3.3 km below the first break on sixteen of eighteen
 *       cases (Tunguska 0.5 km above; Chelyabinsk 9.9 km below).
 * The question, stated as the reviewer asked it: which physical process or
 * representation is missing — not which interval of parameters brings the
 * worst cases inside their targets. No parameter of rules 1139, 1152 or 1160
 * is redrawn to answer it.
 *
 * RULE 1179. WHAT IS DEVELOPMENT, NOW WITHOUT LIMIT. Round 3's five events
 * (Benenitra, Grimsby, Bunburra Rockhole, Mason Gully, Aguas Zarcas,
 * Neuschwanstein) are, by the reviewer's word, permanently development for
 * this candidate and every later version of it: never again a test, on this
 * branch or the next. So is every row Jenniskens (2026) prints — its whole
 * Table 1 and Table 2, all 75 falls — read in full by the analyst on 24
 * September (rule 1177, deviation D15): none of its 75 events may enter a
 * held-out set again, for any round. Rule 961's nine, the third set's six and
 * W18's three stay development, as they have been. The literature the branch
 * already draws its priors from — Borovička, Spurný & Shrbený (2020);
 * Jenniskens (2026)'s account of the seven phases, its citation of McFadden
 * et al. (2021)'s luminous efficiencies — is read as literature, the way
 * rule 1139's strength priors are: informing the model, not a target it is
 * scored against.
 *
 * RULE 1180. THREE HYPOTHESES, DECLARED BEFORE ANY CODE.
 *   (a) H1, the light law: the branch computes where kinetic energy is
 *       deposited, not where light is emitted (rule 1164); Jenniskens (2026)
 *       reports a luminous efficiency of 7–10 % up to the onset of
 *       fragmentation and 3–6 % after (McFadden et al. 2021) — two literature
 *       values, not tuned, their geometric midpoints 8.37 % and 4.24 % fixed
 *       here. A synthetic light curve — each bin's deposited energy (drag's
 *       work plus the ablated mass's, rule 1154 (b)) times 8.37 % above the
 *       branch's first break and 4.24 % at or below it — is compared, in
 *       altitude of its own peak, to the mechanical deposit's peak and, on
 *       the six events of rule 1179, to the brightest flare or end flare a
 *       source gives. H1 is supported where the synthetic light peak sits
 *       measurably closer to those altitudes than the mechanical peak does,
 *       on most of the eighteen development cases and the six read events;
 *       it is not adopted as a prediction of light — the branch's claim stays
 *       the atmospheric release (rule 1161) — only as an account of the
 *       mismatch.
 *   (b) H2, ablation by regime: Jenniskens (2026) attributes most mass loss
 *       from the onset of the plateau to the onset of fragmentation to
 *       shear-layer melting reaching a steady state, not to breakup, and
 *       reports ablation coefficients from arcjet and CFD work — rule 1131's
 *       prior (1·10⁻⁹ to 1.6·10⁻⁸ s²/m²) already spans values found this way.
 *       H2 asks whether a single σ, constant along the whole flight, can
 *       represent both regimes, or whether the branch's excess landed mass
 *       comes in part from ablation too weak after the plateau. Tested only
 *       after (c) is reported: a physics change, not a parameter redraw, and
 *       the round's largest risk.
 *   (c) H3, where the excess mass sits: on the same eighteen cases, a
 *       decomposition — by piece and by cloud, solid survivors against
 *       settled cloud mass, largest piece against the rest — of the landed
 *       mass the ledger already tracks (rule 1141 (a)), to see whether the
 *       excess is concentrated (a few large pieces the model should not have
 *       kept solid) or spread (the clouds themselves ablate too little).
 *       H3 needs no new physics: a diagnostic on the existing ledger.
 * No hypothesis is assumed true; a built test accompanies whichever is coded.
 *
 * RULE 1181. THE PROHIBITION, restated because it is the round's whole point:
 * no luminous efficiency, ablation coefficient or other parameter is chosen,
 * drawn from a narrowed range, or tuned to move the deposit peak, the light
 * peak or the landed mass toward an observed value. Every number H1 and H2
 * use is cited from a source read before this rule, with its place; where a
 * source gives a range, the rule fixes the reading (rule 1180 (a)'s
 * midpoints) before any comparison is computed, exactly as rule 1176 (a) did
 * for an unstated mass.
 *
 * RULE 1182. NUMERICAL PROOF, before any development run.
 *   (a) The light law is deterministic and two-valued: a built test checks it
 *       returns exactly 8.37 % above a component's first break and 4.24 % at
 *       or below, on built cases with a known first break, and that the
 *       synthetic light energy never exceeds the mechanical deposit in any
 *       bin (a triviality at these efficiencies, checked regardless).
 *   (b) The decomposition of rule 1180 (c) is checked to sum, per draw and
 *       configuration, to the ledger's own landed mass (rule 1141 (a)'s
 *       balance): a consistency test against code already verified, not a
 *       new physical claim.
 *   (c) A physics change under H2, if coded, repeats gate 1 in full on it
 *       (rules 1141, 1150, 1153, 1154, 1155) before any development case is
 *       read with it.
 *
 * RULE 1183. THE PACKAGE, at the end of this round's H1 and H3: the synthetic
 * light curves and the mass decomposition for every development case (rule
 * 1179), plotted against the mechanical deposit and, where read, the source's
 * heights; whether H1 is supported, on how many cases, and by how much;
 * where the excess landed mass sits, by case; a decision, written before H2
 * is coded, on whether to proceed to it and on what declared form. Nothing in
 * this round proposes adoption, a class B or a change to the frozen candidate
 * of round 3 (rule 1162), which stays a historical version.
 *
 * RULE 1184. THE FIFTH SET'S CUSTODY PROTOCOL, the reviewer's five steps,
 * written before any file of it is touched, superseding rule 1158's for any
 * future download of this or a later set:
 *   (a) Andrea downloads the authorised file into a custody folder outside
 *       the repository, write access his alone; the analyst may only read it
 *       to compute its hash — never its content, its full file name or its
 *       metadata beyond what identifies it (a DOI or another public
 *       identifier, and the deposit's date);
 *   (b) the system records the SHA-256, the byte size, that identifier and
 *       the date, and nothing else — no preview, no page count, no title
 *       beyond what was already public before the download;
 *   (c) the model, its priors, the event list and the decision charter are
 *       frozen before any extraction from the folder;
 *   (d) the predictions are produced and published from the inputs alone;
 *   (e) only then does a separate procedure extract the targets, keeping a
 *       record of which page or table of the custody file each value came
 *       from, and compute the verdict.
 *   Stronger blindness, where it can be had: whoever extracts targets does
 *   not change code, priors, the domain or a threshold; whoever develops the
 *   model does not read a target before the predictions are pushed. Where
 *   Andrea cannot hold custody of a source, the set built from it is declared
 *   explicitly not blind — never treated as blind by convention.
 *
 * RULE 1185. THE FIFTH SET, reconnaissance only, metadata alone, no file
 * opened: candidates preferred where a source reconstructs an energy-
 * deposition curve with its uncertainty, or gives a calibrated light curve
 * with a stated luminous-efficiency procedure — not «a recovered meteorite»
 * by itself, which guarantees no primary observable (rule 1164). Excluded
 * from the search's results before any is read: every event named in this
 * file, in fourthSetRegister.ts, in the third set, in level B, in R17 or
 * W18, among the 357 CNEOS rows, or among Jenniskens (2026)'s 75 — a
 * candidate whose date or name matches one is dropped and recorded, never
 * silently. The minimum stays the reviewer's: five independent events, three
 * with an observable genuinely primary or strong and not already exposed.
 */

/** Rule 1180 (a): the light law's two literature values, and their fixed
 *  midpoints (McFadden et al. 2021, cited by Jenniskens 2026). */
export const FCM_LUMINOUS_EFFICIENCY = {
  beforeFragmentationRange: [0.07, 0.1],
  afterFragmentationRange: [0.03, 0.06],
  beforeFragmentation: Math.sqrt(0.07 * 0.1),
  afterFragmentation: Math.sqrt(0.03 * 0.06),
  source: 'McFadden et al. (2021), cited in Jenniskens (2026)',
} as const;

/** Rule 1178: the excess landed mass round 1 found, for reference. */
export const FCM_SURVIVAL_EXCESS = {
  Chelyabinsk: { medianKgRange: [24_200, 452_800], referenceKgRange: [4_000, 6_000] },
  'Tagish Lake': { medianKgRange: [6_747, 10_040], referenceKg: 190 },
  '2008 TC3': { medianKgRange: [6_975, 10_350], referenceKg: 0.283 },
  Tunguska: { medianKgRange: [763.6, 911_200], referenceKg: 0 },
} as const;

/** Rule 1179: sources whose events may never again form a held-out set. */
export const FCM_PERMANENT_DEVELOPMENT_SOURCES = [
  'round 961',
  'third set',
  'W18',
  'round 3 (Benenitra, Grimsby, Bunburra Rockhole, Mason Gully, Aguas Zarcas, Neuschwanstein)',
  'Jenniskens (2026), all 75 falls of Tables 1 and 2',
] as const;

/** Rule 1184: the custody protocol's steps, named. */
export const FCM_CUSTODY_PROTOCOL = [
  'Andrea deposits the file; the analyst reads only its hash',
  'the system records SHA-256, bytes, identifier, date — nothing else',
  'model, priors, event list and charter frozen before extraction',
  'predictions produced and published from inputs alone',
  'targets extracted after, by a separate procedure, with a page/table record',
] as const;

/**
 * RULE 1186. H2, DECLARED FORM (rule 1180 (b), after H1 and H3's package,
 * docs/FCM_SURVIVAL_LIGHT_PACKAGE.md). H3 found the excess landed mass is
 * solid pieces, spread across many discrete fragments, not concentrated in
 * one and not unablated cloud (below 10 m). The branch draws σ once per whole
 * draw (rule 1152 (f)) and holds it for every component of the cascade —
 * parent, every solid descendant, every cloud alike. H2 tests a structural
 * change, not a directional one: whether letting σ be redrawn at every break
 * — once per break, shared by every solid child that break produces
 * (fragments born together stay identical in mass and now in σ, and so still
 * bundle exactly as one component: no loss of the exactness rule 1141 (a)'s
 * test checks) — from the same prior (rule 1131's 1·10⁻⁹ to 1.6·10⁻⁸ s²/m²,
 * log-uniform, unchanged and unnarrowed), changes the landed mass, against
 * the whole cascade sharing the one value drawn for the body. A structure
 * group's pieces (identical, W18) share one σ per group, drawn once; a cloud
 * keeps the σ of the solid piece it broke from; the unbroken body draws once,
 * as before. A first attempt drew σ per individual fragment rather than per
 * break: on an even, low-α split it stopped every bundling, and the
 * resulting cascade of distinct components ran past any reasonable bound — a
 * cost finding, not a physical one, corrected before any development case
 * was read (this document, not a later amendment). Nothing is chosen to move
 * a mass toward a reference (rule 1181): the range is the same one already
 * in use, only its point of redraw changes, and the direction of any effect
 * is not predicted before the run.
 *
 * Engine: `src/physics/effects/fcmBranchH2.ts`, a fork of the sealed
 * `fcmBranch.ts` (round 3's candidate, rule 1162, untouched) — H2 is not this
 * candidate and does not change it. Numerical proof before any development
 * case (rule 1182 (c)): the closed-form limits of rule 1141 (b) (unaffected,
 * since an unbroken component still draws σ once); the ledger's balance at
 * breaks and in flight (rule 1141 (a), 1154 (b)) on cascades with the new
 * per-break draw.
 */

/** Rule 1186: H2's σ prior — the same range as rule 1131, unnarrowed. */
export const FCM_H2_SIGMA_RANGE = [1e-9, 1.6e-8] as const;

/**
 * RULE 1187. H4, THE PRIOR'S OWN SCALE (declared after H2's null result,
 * docs/FCM_SURVIVAL_LIGHT_PACKAGE.md). H2 found that letting σ vary between
 * breaks, inside rule 1131's prior, does not move the landed mass. What is
 * left untested is the prior's own scale: rule 1131 fixed σ log-uniform on
 * 1·10⁻⁹ to 1.6·10⁻⁸ s²/m², and named Borovička et al. (2013b)'s upper value
 * from the dynamics of Chelyabinsk's *small fragments* — 3.5·10⁻⁷ s²/m² — as
 * «run apart as a sensitivity, never mixed in» (rule 1131, written before
 * this round, before round 1, before any target of it was read). H4 is that
 * sensitivity, run at last: every solid component's σ, from the unbroken
 * body through every fragment, set to that one published value — not a
 * range, not drawn, the single constant rule 1131 already named. Unlike H2,
 * H4 is declared directional: a much larger σ should ablate more mass, and
 * finding that it does would not by itself be a discovery. What is tested,
 * stated before any run: whether it ablates *enough* — bringing the landed
 * mass near the references of rule 1178 (a) — and whether it does so without
 * a new failure (the main peak moving far from where H1/H3's baseline put
 * it, or a new non-completion pattern). No value between 1.6·10⁻⁸ and
 * 3.5·10⁻⁷ is tried, and no further value beyond 3.5·10⁻⁷: only the one
 * already on the books.
 *
 * Engine: the same fork, `fcmBranchH2.ts`, unchanged — a degenerate σ range
 * (`[3.5e-7, 3.5e-7]`) needs no new code or new gate-1 proof; `drawSigma`
 * already returns a fixed range's single value without consuming a draw
 * (checked by rule 1182 (c)'s own closed-form test). Run by
 * `scripts/fcm-h4-run.ts`, a copy of `fcm-h2-run.ts` with one fixed σ in place
 * of a per-break draw, against the same H3 baseline.
 */

/** Rule 1187: H4's one value — rule 1131's own named sensitivity. */
export const FCM_H4_SIGMA_S2_M2 = 3.5e-7;

/**
 * RULE 1188. H5, THE RESIDUAL HISTORY OF SURVIVING FRAGMENTS — the reviewer's
 * answer of 25 September 2026 to H1–H4's close: stop searching for a value of
 * σ on these same cases; H1–H4 show that redrawing σ inside the same prior
 * (H2) or fixing it at the prior's own top (H4) do not close H3's gap, not
 * that ablation is irrelevant, and not that a value between the two would —
 * choosing one now because it lands closer would be exactly the tuning rule
 * 1181 forbids. H3 stays the most useful finding so far, but conditioned to
 * the one configuration it examined (M1, clouds unlimited): H5 works inside
 * that same configuration, not across all four.
 *
 * H5 asks a mechanical question with NO NEW FREE PARAMETER: is the excess
 * landed mass dominated by solid fragments the branch creates already large
 * and late in the cascade (a question about break conditions, mass
 * partition and the genealogy of children — H2/H4 never touched this), or
 * by fragments born early, with a long residual flight still ahead of them,
 * that nonetheless keep most of their birth mass (a question that would
 * still point at ablation, but not at its redraw point or its scale alone)?
 * The reviewer's own qualification, carried here unchanged: recovered
 * masses are generally lower bounds on the mass that fell, not the fallen
 * mass itself, so a modelled mass above a recovered one is not by itself a
 * measured size of error; W18's own modelled masses are not an independent
 * observation either. H5 decomposes the branch's OWN landed mass against
 * its OWN birth conditions — an audit of the model's internal budget, not a
 * new claim about how large the real discrepancy is.
 *
 * RULE 1188 (a). WHAT IS RECORDED, for every solid piece the branch already
 * lands at the ground (`FcmPiece`, unchanged) under M1/unlimited, on the same
 * 18 development cases and the same input and parameter streams as H1's and
 * H3's runs (rule 1179; `drawFcm`, `fcmRound1Common.ts`, unchanged): its
 * generation (0 = the unbroken body itself, landing whole; 1 = born at the
 * first break; 2 = born at a break of a first-break child; and so on — one
 * more than its parent's, counted from birth, already implicit in how a
 * piece came to exist and not a new physical quantity), the altitude, speed,
 * mass and inherited strength it was born with, the material density its
 * area follows, and its mass at three points along its own flight — at
 * birth, at half the altitude it drops between birth and the ground
 * (linearly interpolated between the two nearest simulated steps), and at
 * landing (already `mass`). Nothing here is drawn or chosen: every one of
 * these quantities already exists on the branch's own internal state at the
 * moment a piece is born or lands; only its record survives past that
 * moment, where the sealed engine already discards it.
 *
 * RULE 1188 (b). THE CLASSIFICATION, fixed before any case is read, needing
 * no threshold chosen after seeing a result:
 *   - a piece is EARLY if its generation is 1 (born at the very first break —
 *     the highest, earliest a fragment can be created, and so the one with
 *     the longest possible residual flight in front of it) and LATE if its
 *     generation is 2 or more (born at a break after the first, necessarily
 *     lower and later);
 *   - a piece RETAINED its birth mass if landed mass over birth mass exceeds
 *     one half, and did not otherwise — a round, symmetric split, not fitted
 *     to any case;
 *   - every landed piece falls in exactly one of four buckets: EARLY+RETAINED
 *     (points to ablation: born as high and early as a fragment can be, with
 *     the longest possible flight to lose mass in, and still keeping most of
 *     it), LATE+RETAINED (points to genealogy: born already large, late in
 *     the cascade, when little flight remained regardless of ablation), and
 *     the two RETAINED=false buckets (ablated as expected, not part of the
 *     excess this round is chasing).
 *
 * RULE 1188 (c). THE DECISION, mechanical, from each bucket's SHARE OF THE
 * POOLED LANDED MASS across all 18 cases (mass-weighted: a piece's own
 * landed mass — count × mass — over the sum of every case's landed mass),
 * not from a count of pieces or of cases:
 *   - if the LATE+RETAINED share exceeds twice the EARLY+RETAINED share, the
 *     excess is dominated by genealogy: the next causal study is break
 *     conditions, mass partition and child genealogy, and changing σ again,
 *     in any form, risks masking it rather than testing it;
 *   - if the EARLY+RETAINED share exceeds twice the LATE+RETAINED share, the
 *     excess is dominated by insufficiently ablated early survivors: a
 *     regime-dependent ablation law becomes worth a separately preregistered
 *     specification, grounded in a source that gives its physical regimes
 *     (Jenniskens's plateau of shear-melt against catastrophic
 *     fragmentation) — not a formula this round invents;
 *   - otherwise (neither share leads by that margin), the mechanism is NOT
 *     IDENTIFIED by this decomposition: no correction is forced, and this
 *     round names, rather than closes, what a next round of observables
 *     would need to separate the two populations.
 * The 2× margin, like every other number in (b), is fixed here, before any
 * case is read.
 *
 * RULE 1188 (d). THE ENGINE, a new fork — `fcmBranchH5.ts` — carrying no
 * physics change at all: the same `FcmOptions` shape as the sealed candidate
 * (`ablation: number`, one fixed σ per draw, exactly as round 1 and H3 ran
 * it), the only addition a generation counter and the recording, at the
 * moment a piece is born or lands, of state the engine's own step already
 * holds. Because nothing about the dynamics changes, the fork's output must
 * be checked EXACTLY equal to the sealed candidate's, not merely close —
 * same mass, speed, ledger, completion and step count, component by
 * component, on a spread of random cases — before any development case is
 * read with it. The sealed files (rule 1162) stay untouched.
 *
 * RULE 1188 (e). NO ADOPTION, as every rule of this round: H5 informs which
 * later round to open — the break condition, a regime-dependent ablation
 * law, or neither — and adopts nothing into the frozen candidate itself.
 *
 * In parallel, per the reviewer's direction and rule 1185's already-declared
 * scope: the fifth set's metadata-only reconnaissance begins now, without
 * waiting for H5 — its custody protocol (rule 1184) is unchanged, and its
 * altitudes or curves stay unread until a version and its charter are frozen.
 */

/** Rule 1188 (b): a piece "retained" its birth mass above this fraction. */
export const FCM_H5_RETAINED_FRACTION = 0.5;

/** Rule 1188 (c): the mass-weighted share one bucket needs over the other to
 *  decide the round, rather than declare the mechanism unidentified. */
export const FCM_H5_DOMINANCE_MARGIN = 2;

/**
 * RULE 1189. THE CASCADE AUDIT — the reviewer's own next step (25 September
 * 2026), approved after H5, with three qualifications on H5 itself that this
 * audit is built to answer: (1) "late" (generation 2 or more) is not the same
 * as "little residual atmosphere"; a causal claim needs the recorded
 * altitudes and the residual trajectory, not the generation label alone;
 * (2) H5 decomposed only LANDED pieces — survivors, selected on the very
 * property (surviving) the study wants to explain — so separating a
 * break-threshold effect from a mass-partition effect needs the children
 * that do NOT land too, not only the ones that do; (3) H5's pooled total is
 * dominated by a few massive events (Tagish Lake, 2008 TC3), so a per-case,
 * per-configuration account is what any later claim must rest on, not the
 * pooled share alone. H5's approved closing formula, carried here unchanged:
 * «In the M1/unlimited configuration, the landed solid mass on the
 * development cases is dominated by descendants of later breaks that retain
 * more than half the mass they were born with; this diagnosis directs the
 * study toward genealogy, but does not yet identify whether the break
 * threshold, the mass partition, or the children's later evolution is at
 * fault.»
 *
 * NO NEW PHYSICS, and no hypothesis tested yet — a measurement, the
 * reviewer's own first step of "misurare, poi intervenire un meccanismo alla
 * volta" (measure, then intervene one mechanism at a time). Its result
 * informs the cloud audit of rule 1190 and the dossier of rule 1191, not a
 * law.
 *
 * RULE 1189 (a). WHAT IS RECORDED, for every break the branch produces —
 * the initial disruption of a structured body included — and for every
 * component that break creates, on all four configurations (M1 and M2,
 * clouds unlimited and capped) and the same 18 development cases and input
 * streams as H1, H3 and H5:
 *   - the break itself: its altitude, the parent's speed, mass and strength
 *     at that altitude, and the ratio of dynamic pressure to strength there
 *     (recorded, not assumed — it should sit at very nearly 1, the
 *     bisection's own precision, and an audit that finds otherwise has found
 *     a bug before it has found a mechanism);
 *   - every child that break produces, whether solid or cloud, its count
 *     (identical children born together), mass, inherited strength and
 *     area-to-mass ratio at birth — the number and mass spectrum of a
 *     break's children, not only the child that eventually lands;
 *   - EVERY child's eventual fate: broke again (and if so, its own break's
 *     altitude, speed, mass and pressure ratio — the next generation's row),
 *     landed as a solid piece, landed as part of a settled cloud, settled
 *     mid-flight as a cloud, turned to dust at the mass floor or a
 *     non-physical step, or was folded into the aggregated tail (rule 1150).
 *     A component born together with identical siblings (`n`/count) is one
 *     row, not `n` rows: exactly how the sealed engine already bundles them.
 *
 * RULE 1189 (b). THE ENGINE, a third fork of the sealed candidate
 * (`fcmBranch.ts`, rule 1162, untouched) — `fcmBranchAudit.ts` — carrying,
 * like H5's, NO physics change: every equation and every branch of every
 * break copied unchanged, the only addition a record kept at each break and
 * each termination, of state the branch's own step already computes.
 * Verified to EXACT equality with the sealed candidate's own output, not
 * merely close, on a spread of random cases, before any development case is
 * read with it — the same discipline as rule 1188 (d).
 *
 * RULE 1189 (c). THE REPORT: distributions, by case AND by configuration —
 * never only the pooled sum, per the reviewer's third qualification — of the
 * break's pressure ratio (a sanity check), the children's mass spectrum
 * relative to their parent's mass, the share of each break's produced mass
 * that eventually lands versus is lost to each other fate, and how these
 * relate to the residual altitude a landing child had (its own birth
 * altitude, not only its generation). No threshold is chosen here to call a
 * pattern "the cause": this rule reports what the cascade does: rule 1191's
 * dossier is where a candidate mechanism, if any is discriminable, gets
 * proposed and its falsification named.
 *
 * RULE 1189 (d). NO ADOPTION: the sealed candidate (rule 1162) stays exactly
 * as it is: this audit changes no default, no prior, no branch of the
 * engine — only what is recorded of a run that would happen identically
 * without it.
 *
 * RULE 1190. THE CLOUD'S OWN AUDIT — the reviewer's correction to rule
 * 1189's first result (25 September 2026): 93.2 % of the body's mass,
 * pooled, was reported "settled" — stopped once a cloud reaches within
 * `settleWithin` (1 %) of its own terminal speed (rule 1138 (c)). That stop
 * is a NUMERICAL condition, chosen so the integration does not stall
 * (deviation D9): by itself it says nothing about the material's later,
 * physical fate. Rule 1189's own report is accepted as what the engine
 * accounts for in its completed runs — not as a claim that 93.2 % of the
 * true mass never reaches the ground; the two are conflated nowhere in the
 * branch's own physics, only in a reading of the audit that this rule now
 * forecloses. This rule does not sum "settled" mass into any ground- or
 * meteorite-mass claim: dispersed dust and a recoverable fragment are not
 * the same observable, and nothing here decides which "settled" mass is
 * which.
 *
 * A second, independent correction, found while checking the first: the
 * "largest child" rule 1189 reported at a break can be — and at Chelyabinsk,
 * every break of the one produced draw, was — the CLOUD, not a solid
 * fragment, wherever the draw's own cloud share exceeds its largest solid
 * fragment's share. This is not a bug in what was measured; it is a gap in
 * how it was reported: one column conflated "largest of every child" with
 * an implicit reading of "the dominant surviving solid," which is what
 * matters for H5's genealogy question. Rule 1189's own report is corrected,
 * not re-run: `largestChildShare` (any component) and
 * `largestSolidChildShare` (solid only, or null where every child is a
 * cloud) are reported apart from here on, alongside the cloud's own share,
 * already present.
 *
 * RULE 1190 (a). WHAT IS ADDED TO EVERY STOPPED COMPONENT'S RECORD (rule
 * 1189 (a), unchanged for every other field): the EXACT reason integration
 * stopped — `'terminalVelocity'` (a cloud within `settleWithin` of its own
 * terminal speed), `'nonPhysicalStep'` (rule 1141 (a)'s halving exhausted:
 * the same branch a solid can also stop in, at `floorKg` or an unphysical
 * step), or `'massFloor'` (below `floorKg`, at birth or in flight) — and,
 * for a cloud, its radius and its own local terminal speed at that instant
 * (`Math.sqrt(2 m g(h) / (C_d ρ(h) π r²))`, the same closed form the sealed
 * engine already computes to decide the stop, recorded rather than only
 * compared). No new category is invented for what a stopped cloud becomes
 * next (ablated, dispersed, suspended, deposited): rule 1189's own report
 * already had no physics to decide that, and this rule adds none — only the
 * state at the moment integration stopped, for whoever studies it next.
 *
 * RULE 1190 (b). THE ENGINE: the same fork, `fcmBranchAudit.ts`, extended —
 * still no physics change, verified to the same exact-equality discipline
 * as rule 1189 (b) before any case is read with the extension.
 *
 * RULE 1190 (c). THE SENSITIVITY, on `settleWithin` — a NUMERICAL check, not
 * a tuning, because nothing about it moves any of H1 through H5's own
 * results: the same development cases run at `settleWithin` a tenth and ten
 * times rule 1138 (c)'s own value (0.1 % and 10 %, against the baseline
 * 1 %), comparing the settled-mass share and the ledger's own balance
 * (rule 1141 (a)) across the three. A share that moves by a wide margin
 * says the stop condition itself governs the result; one that barely moves
 * still leaves the settled mass's physical fate exactly as open as before —
 * this rule decides the first question, not the second.
 *
 * RULE 1190 (d). NO ADOPTION, no new claim about ground or meteorite mass:
 * the sealed candidate (rule 1162) stays untouched, and `settleWithin`'s own
 * value (rule 1138 (c)) is not changed by what this rule finds — only read
 * at three points to see whether it matters.
 */

/**
 * RULE 1191. THE CAUSAL DOSSIER — written on the reviewer's own order (25
 * September 2026): the cloud's unresolved state first, then the mass
 * partition, then break timing measured directly, then — only at the end —
 * separate candidate hypotheses on threshold, partition and their possible
 * interaction, each held to his four requirements: a discriminating
 * observation, an independent source constraining the proposed FORM (not a
 * number fit to these cases), effects expected beyond landed mass, and a
 * result that would refute it. Where a hypothesis cannot meet this without
 * deriving its form from the very masses it would be tested against, the
 * declared verdict is NOT IDENTIFIABLE, not a hypothesis dressed up to look
 * testable. NO CODE, no new fit, no adoption: this dossier proposes what a
 * later, separately preregistered round might test — it decides nothing.
 *
 * RULE 1191 (a). THE CLOUD'S STATE — still unresolved, restated so the
 * dossier does not quietly assume it: rule 1190 found that 93.2 % of the
 * body's mass, pooled over the 71 pairs that complete, stops being
 * integrated at a numerical condition (a cloud near its own terminal
 * speed), overwhelmingly the ordinary stop and not a fallback, and that the
 * unlimited-cloud configurations' accounting is stable against the
 * threshold while the capped ones are not (rule 1190 (c), tied to the
 * already-known capped pathology of deviation D16). NONE of this identifies
 * what the settled mass physically becomes. This dossier's three sections
 * below concern the LANDED mass's own excess (H3's channel, H5's
 * genealogy) — a small share of the entry mass, distinct from the settled
 * question — and do not depend on resolving it; a reader should not read
 * either the threshold or the partition candidate below as an account of
 * the settled 93.2 % too.
 *
 * RULE 1191 (b). THE MASS PARTITION, measured directly rather than
 * summarised. Rule 1139's own development prior fixes `larger` — the share
 * of a break's non-cloud remainder the larger child receives — uniform on
 * [0.5, 0.8], drawn once per full draw and reused at every break of that
 * cascade (`fcmRound1Common.ts`'s `drawFcm`). Because the range's own floor
 * is 0.5, EVERY break of EVERY draw gives its larger child at least half
 * the solid remainder, by construction — not an emergent pattern the audit
 * discovered, but a guarantee already sitting in the prior's declared
 * range. Rule 1190's corrected figures (largest solid child a median of
 * 56.5 % of the parent's mass at the first break, 50.1 % at later breaks,
 * rule 1190's own report) are the visible consequence of that guarantee,
 * not new evidence of it. `docs/FCM_ROUND_DOSSIER.md` names `larger`
 * itself, alongside `alpha` and `cloudShare`, an "effective parameter kept
 * apart from measured ones," with "tuning on declared development cases
 * allowed, recorded, frozen before round 3" — meaning its own range is not
 * independently sourced from outside this project's cases. A hypothesis
 * that simply narrows or redraws `larger` inside its current range, or
 * proposes a new range chosen because it reduces landed mass on these same
 * cases, would repeat exactly the tuning rule 1181 forbade for H1
 * through H4 — this dossier does not propose that.
 *
 * RULE 1191 (c). BREAK TIMING, measured by the recorded altitude, not the
 * generation label — the reviewer's own correction to how rule 1188 read
 * H5. Landed solid pieces sorted by their own birth altitude into three
 * equal-count groups (rule 1190's own tertiles, pooled as a median of each
 * pair's own median, 71 case–configuration pairs): the lowest-altitude
 * third retains a median 75.8 % of its birth mass, the middle third 73.7 %,
 * the highest-altitude third 70.0 % — monotonic, in the mechanically
 * expected direction (a piece born lower has less atmosphere left to ablate
 * through), and present at the pooled level even though only 52 of 71
 * individual pairs show it themselves (rule 1190's own count). Altitude is
 * therefore a real, if noisy, pooled signal — not merely the generation
 * label's shadow — but a 5.8-percentage-point spread across the full range
 * of birth altitudes is modest next to the 20-to-100-times excess rule
 * 1178 (a) named: whatever role break timing plays, this direct measure
 * does not by itself look large enough to be the whole channel. Birth
 * speed is recorded on every landed piece alongside altitude (rule
 * 1189 (a)) and was not cross-tabulated for this dossier; a round that
 * makes timing central should use it too, not altitude alone.
 *
 * RULE 1191 (d). THE THRESHOLD CANDIDATE. Rule 1191 (b) shows the
 * partition's own prior is tuned, not independent; the break CONDITION
 * itself (ρv² ≥ strength, R17 Eq. 8, with S_p(m_p/m_c)^α inheritance) is a
 * separate structural choice rule 1191 (b) does not touch. A literature
 * search for a genuinely independent form — dynamic-loading, Weibull-flaw-
 * statistics accounts of when and where a brittle solid fractures under
 * strain-rate-dependent stress, from lab experiments on rock or ceramic
 * analogues, never fit to a meteor's mass — turned up real candidates
 * (Weibull's own statistics; Denoual & Hild 2002 and Levy & Molinari 2009's
 * defect-statistics fragmentation models; strain-rate-dependent rock
 * strength measurements such as Vivek et al. 2022's Hopkinson-bar tests on
 * basalt and granite). NONE of these has been read by this project — they
 * are leads from a search, not citations: rule "mai copiare i riferimenti"
 * applies here as everywhere, and no source becomes a citation before it is
 * read directly. IF a specific source is read and does give a threshold
 * form independent of these cases: the discriminating observation would be
 * where and how densely breaks occur along the trajectory relative to what
 * the current ρv²-only condition predicts (more breaks earlier, at lower
 * dynamic pressure, if strain-rate weakening is real); the expected effect
 * beyond landed mass is on the deposit profile's own shape (rule 1151),
 * since moving breaks earlier changes where energy is deposited, not only
 * how much mass survives to the ground; the falsifying result is a form
 * that, applied to these development cases, moves the deposit peak away
 * from where H1's own diagnostic and round 3's read events already placed
 * it. Until a source is read and its form checked against these
 * requirements, the threshold candidate's status is NOT YET IDENTIFIABLE —
 * not refused, not adopted, waiting on the reading rule 1184's own
 * discipline requires before any citation.
 *
 * RULE 1191 (e). THE PARTITION CANDIDATE. Symmetrically: a literature
 * search for an independent fragment-mass-spectrum form — from explosive or
 * impact fragmentation of brittle solids, never fit to a meteor's mass —
 * also turned up real candidates (Mott's and Grady & Kipp's shell-
 * fragmentation theory; impact and explosion fragment-size scaling such as
 * Housen & Holsapple 1985; hypervelocity disruption experiments on rock and
 * porous targets, e.g. Nakamura et al. 2008). Again, none read; leads, not
 * citations, for the same reason as rule 1191 (d). IF a source is read and
 * gives an independent fragment-mass distribution (a spectrum across many
 * pieces, say, rather than the branch's fixed one-or-two-child split): the
 * discriminating observation is the shape of the surviving mass spectrum
 * itself — the branch's own audit already records every child's mass at
 * every break (rule 1189 (a)), so this is measurable without new code, only
 * new analysis of what rule 1189's run already wrote; the expected effect
 * beyond landed mass is on the number and size distribution of pieces
 * reaching the ground (already in `FcmPiece`), not only their summed mass;
 * the falsifying result is a source's own spectrum failing to reproduce the
 * skew rule 1191 (b) already measured (the current, tuned `larger` prior)
 * as well as or better than the tuned prior does, on an honest comparison
 * that does not itself use these cases' landed masses to pick the winner.
 * Same status as (d): NOT YET IDENTIFIABLE until read.
 *
 * RULE 1191 (f). THE INTERACTION — the reviewer's own instruction: only
 * attempted, if ever, after (d) and (e) are separately grounded and show an
 * identifiable, individually measurable effect. Not proposed in any form
 * here; naming it only to record that it is not forgotten, not skipped.
 *
 * RULE 1191 (g). WHAT THIS DOSSIER AUTHORISES: reading the specific sources
 * named in (d) and (e) — or better ones, if a closer read finds these
 * unsuitable — to check whether any actually gives an independent,
 * checkable form, before any is cited as a rule the way H1's or H4's
 * numbers were. It authorises no code, no redraw of `larger`, `alpha` or
 * the break condition, no new fit to these cases' masses, and no change to
 * the sealed candidate (rule 1162). If reading finds no source that gives a
 * form independent of these cases, the honest verdict for that candidate is
 * NOT IDENTIFIABLE, and this dossier's own preference — restated — is that
 * such a verdict is a better result than a parameter chosen because it
 * moves the landed mass the right way.
 */
