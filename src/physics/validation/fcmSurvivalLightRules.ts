/**
 * Rules 1178 to 1187 — the opening document of the survival–light round, on
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
