/**
 * Rules 1162 to 1168 — the opening document of round 3: the one independent
 * test of the FCM branch's atmospheric release (rule 1161), frozen before any
 * reserved target is read. The reviewer's list of 24 September 2026, evening,
 * resolved together, not item by item; the fourth set's inventory is
 * fourthSetRegister.ts (rule 1158). A readable version:
 * docs/FCM_ROUND3_OPENING.md.
 *
 * RULE 1162. THE CANDIDATE, FROZEN. The branch as it stands in the files whose
 * SHA-256 `FCM_ROUND3_SEAL` holds — the engine, the draws of rule 1152, the
 * rules that hold its priors, the 1976 atmosphere — checked by a test: any
 * change to them makes another version, not the one this round judges. The
 * priors of rule 1152 untuned (rule 1160 (d)); both structures and both clouds
 * (rule 1140); steps of 10 m, bins of 10 m, a floor of 1 g, a bound of 100 000
 * components retried at 1 000 000 (rule 1149 (b)); no aggregated tail (rule
 * 1150). The reference atmosphere is the 1976 standard (rule 1153); the
 * exponential runs beside it as a sensitivity; an atmosphere of the place and
 * the date is not used in this round. Round 3's outcome never retouches this
 * candidate: a later version is judged on another set. The round on survival
 * (rule 1161) runs apart — its own commits, versions and targets — and nothing
 * of it enters this candidate.
 *
 * RULE 1163. THE DOMAIN AND ITS BOUNDARY. The candidate is tested on stony
 * bodies of 0.1 to 10 m, 1 500 to 4 000 kg/m³, 11.2 to 30 km/s, 15° to 90° —
 * the proposed upper bound of a candidate, not a domain verified in every
 * combination: of the perimeter, the map exercised 592 runs below 10 m, every
 * one completed (rule 1149), and that is what is known of it.
 *   (a) An event is in the domain when, on its input draws (rule 1168 (c)),
 *       the 5th and 95th percentiles of its diameter lie within 0.1–10 m and
 *       the medians of its density, speed and angle within their ranges;
 *       decided from its inputs alone, before any target is read. Draws of an
 *       eligible event beyond a bound are flown and counted, never cut.
 *   (b) A draw not completed stays in the denominator as «not produced»; a
 *       configuration producing the release in fewer than 90 % of an event's
 *       draws has failed on that event.
 *   (c) A draw not robust (rule 1151) enters no band and no distance; its
 *       share is published. A configuration with more than 20 % of an event's
 *       draws not robust gives that event no single release: it cannot count
 *       as a success there.
 *   (d) The sensitivity to the atmosphere (the exponential against the 1976
 *       standard) and every double peak are published for every event, below
 *       10 m as above.
 *
 * RULE 1164. THE OBSERVABLE: TWO KINDS, NEVER ONE THRESHOLD. The branch
 * computes where energy is deposited, not where light is emitted.
 *   (a) Primary: the altitude of the maximum of an energy-deposition curve
 *       reconstructed by the event's source from a calibrated light curve, its
 *       luminous efficiency and its uncertainty stated — set against the
 *       branch's main peak on the 1 km window.
 *   (b) Proxy: the altitude of the brightest flare on a measured trajectory,
 *       where no reconstruction exists — a qualified comparison, the maximum of
 *       deposition and of light not being the same quantity, with its own
 *       tolerance and half the weight of a primary one in the verdict.
 *   (c) Diagnostic: anything else a source gives (first fragmentation, other
 *       flares, pressures, fragment masses), reported, never judged.
 *   (d) Each event's kind is fixed from its metadata before any extraction
 *       (`FCM_ROUND3_OBSERVABLES`), and at extraction may only fall — a
 *       primary without its reconstruction becomes a proxy, a proxy without a
 *       measured flare a diagnostic — never rise.
 *
 * RULE 1165. THE COMPARISON, paired with Collins: the product frozen at the
 * same commit (its burst altitude on the draws where the body bursts) on the
 * same input draws.
 *   (a) The observed interval: the source's value and its stated uncertainty,
 *       by the source's quality — A, a measured trajectory with a stated
 *       uncertainty: the value ± that uncertainty; B, a value read from a
 *       figure or placed on the trajectory by timing: ± the larger of its
 *       uncertainty and 1 km; C, from eyewitnesses or without uncertainty: not
 *       judged.
 *   (b) Per event, configuration and model, the median's distance to the
 *       interval: favourable where the branch's is smaller than the
 *       baseline's by at least 1 km on a primary, 2 km on a proxy; unfavourable
 *       where larger by the same; «equal» between.
 *   (c) Against bands made wide: each model's 5–95 % band is also scored by
 *       the interval score (Gneiting & Raftery 2007, α = 0.1); a favourable
 *       distance stands only where the branch's interval score is not worse
 *       than the baseline's.
 *   (d) The atmosphere: a favourable outcome on the 1976 standard stands only
 *       where it is not unfavourable under the exponential.
 *
 * RULE 1166. THE FOUR CONFIGURATIONS AND THE MIXTURE. The predictions are
 * frozen for each configuration and for their equal-weight mixture; each one's
 * results are published beside the mixture's. Equal weights are a convention,
 * not a probability of the four structures shown by anything. The verdict
 * reads the mixture, but no mixture makes up for a structural failure defined
 * now: a configuration fails severely on an event where its median misses the
 * observed interval by more than 5 km on a primary or 7 km on a proxy, or where
 * it produces the release in fewer than half its draws; if any configuration
 * fails severely on a third or more of the assessable events, the verdict is at
 * most «inconclusive». The sensitivity to the weights — each configuration at
 * 0.55 and the others at 0.15, the monolith alone, the structured body alone —
 * is published, and no weight is chosen on the new events.
 *
 * RULE 1167. THE VERDICT, on the atmospheric release only.
 *   (a) Assessable: an event in the domain with a primary or proxy observable
 *       of quality A or B, the release produced by both models.
 *   (b) «Favourable» when at least five events are assessable, three of them
 *       with a primary observable or a proxy of quality A; the mixture's
 *       weighted favourable outcomes (primary 1, proxy ½) are at least 60 % of
 *       the weighted assessable ones; no primary outcome is unfavourable and at
 *       most one proxy is; and rule 1166's structural clause is not triggered.
 *       «Unfavourable» when the weighted unfavourable outcomes outnumber the
 *       favourable. «Inconclusive» otherwise, or with fewer events.
 *   (c) The verdict judges the altitude of the atmospheric release and nothing
 *       else: no class B of the full entry, no mass, no survival, no crater, no
 *       integration into the product. The minimums of rule 1145 (c) for the
 *       ground do not apply to this test.
 *
 * RULE 1168. THE ORDER, a deferred deposit.
 *   (a) These rules pushed; nothing of the fourth set's values read.
 *   (b) The final preparation dossier: from the register, the list and its
 *       exclusions frozen — the «to check» resolved from metadata, never from
 *       values — and sent to the reviewer once, with this document.
 *   (c) On his leave and Andrea's for the downloads: each source pinned by its
 *       DOI and its file's SHA-256; the inputs (trajectory, speed, angle,
 *       mass or size, density, with their uncertainties) extracted by a
 *       procedure written before, which names for each source the table or
 *       section read; the input draws built from them and the domain decided
 *       (rule 1163 (a)).
 *   (d) The predictions run by a script written before, the four
 *       configurations, the mixture, the baseline, the atmosphere's
 *       sensitivity — and pushed before any target is extracted.
 *   (e) Then the targets extracted by their own procedure, written before —
 *       the kind (rule 1164), the value, the uncertainty, the quality (rule
 *       1165 (a)) and where each stands in its source — and the verdict
 *       computed by the script that reads both. The model being frozen, whoever
 *       extracts chooses no parameter of it. Every outcome published.
 *
 * The reviewer approved rules 1162 to 1168 on 24 September 2026, evening, with
 * two corrections to be written before any value is read (rules 1169 and
 * 1170), the exposure check extended to every compilation the project has
 * read (rule 1171), and the reconnaissance allowed on, from metadata only, as
 * far as Jenniskens (2026) — to complete the inventory, never to select events
 * that would reach rule 1167's minimum (rule 1172). Andrea's word: the
 * corrections, the checks and the final dossier, then his leave file by file
 * for the downloads.
 *
 * RULE 1169. THE STRUCTURAL FAILURE, TIGHTER (amends 1166). The branch has
 * already shown a systematic failure on the ground and a great structural
 * sensitivity; a single severe structural failure — rule 1166's definition —
 * of any configuration on one event with a primary observable of quality A
 * makes the verdict at most «inconclusive». Rule 1166's clause on a third of
 * the assessable events stays beside it.
 *
 * RULE 1170. THE BOUNDARY AND THE DENOMINATOR (amends 1163). An event whose
 * input draws put the 5th or the 95th percentile of its diameter outside 0.1–10
 * m, or the median of its density, speed or angle outside their ranges, is out
 * of the domain: not assessable, and counted neither among the five events of
 * rule 1167 nor among its three strong ones. Its predictions are still run and
 * published, as a diagnostic outside the domain. The decision is taken from
 * the inputs alone at rule 1168 (c), before any target is extracted, and is
 * final. Inside the domain, an event's draws beyond a bound are flown and
 * counted, never cut.
 *
 * RULE 1171. THE EXPOSURE, CHECKED AGAINST EVERYTHING THE PROJECT HAS READ.
 *   (a) The method: the repository, and every source text the project read
 *       and still holds (the third set's, level B's, R17's and W18's, Kenkmann
 *       et al. 2009's, Borovička et al. 2020's among them), searched for each
 *       candidate's name; each line naming it classified by the kinds of
 *       numbers beside it — an altitude in km, a pressure, a mass, an orbit, a
 *       reference — and, where a number could be a target, the line read with
 *       every digit masked, so that its kind shows and its value does not.
 *       This method was applied before this rule was written; it reads no
 *       value, and the criterion below is written now.
 *   (b) The criterion: a candidate is excluded where a source the project read
 *       shows, beside its name, an altitude of its release — a flare's or a
 *       deposition's maximum. A pressure, a mass, an orbit or a mention in
 *       text is registered as an exposure of its kind, and does not exclude.
 *   (c) What it found: no candidate excluded. Grimsby's one line with an
 *       altitude beside it, in 2022 WJ1's paper, is the town: WJ1 fell above
 *       it, and the altitudes are WJ1's flares. Neuschwanstein: a strength and
 *       an entry mass in Kenkmann et al. (2009) — a diagnostic and an input,
 *       registered; and it is not in Borovička et al. (2020)'s sample, neither
 *       by name nor by its network code. The others: named in text, orbit
 *       tables or references of the third set's sources, registered.
 *   (d) The CNEOS rows the project read (I2's 357): no candidate of the frozen
 *       list falls on the date of one.
 *
 * RULE 1172. THE «TO CHECK», RESOLVED FROM METADATA, AND JENNISKENS (2026).
 *   (a) Neuschwanstein: a candidate (rule 1171 (c)). Benenitra: a candidate,
 *       its kind primary, falling at extraction if its deposition is not
 *       reconstructed from a calibrated light curve with its luminous
 *       efficiency (rule 1164 (d)). Tighert: excluded — a CNEOS row the
 *       project read falls on its date, and its metadata cannot tell the two
 *       apart. Ischgl and the Central Italy bolide: candidates; their open
 *       questions concern the ground, which round 3 does not judge.
 *   (b) Jenniskens (2026), «Bolide light curve systematics from 75 recovered
 *       meteorites», Meteoritics & Planetary Science, doi:10.1111/maps.70203:
 *       its abstract names no candidate and shows no target number; its list
 *       of events is not in its metadata. It may hold light curves of events
 *       in the frozen list: it enters only as a source of targets in the
 *       deferred deposit, pinned with Andrea's leave, read only for events
 *       already in the list — never to add an event after seeing it, never to
 *       raise a kind (rule 1164 (d)) or lower a quality threshold.
 *
 * RULE 1173. THE LIST, FROZEN. Round 3's events are the candidates whose kind
 * (rule 1164 (d)) is primary or proxy: Benenitra (primary); Grimsby, Bunburra
 * Rockhole, Mason Gully, Aguas Zarcas and Neuschwanstein (proxies) — six. The
 * fifteen diagnostic candidates stay in the inventory, outside the verdict:
 * their kind cannot rise. Nothing is added after this rule. Six events against
 * a minimum of five assessable, three of them strong: if the extraction lowers
 * two kinds, or the domain (rule 1170) takes two events out, the verdict is
 * «inconclusive» by rule 1167, and no threshold is loosened to avoid it.
 *
 * RULE 1174. THE TWO EXTRACTION PROCEDURES, written before any download.
 *   (a) The inputs, for each event from its frozen source (and only its
 *       inputs): the speed at the first measured point of the atmospheric
 *       trajectory, or the pre-atmospheric speed where only that is given, and
 *       its uncertainty; the entry angle to the horizontal and its uncertainty;
 *       the initial mass — the source's preferred estimate, photometric or
 *       dynamic, with its range or uncertainty; the bulk density the source
 *       gives, or, where it gives none, the range of its meteorite type from
 *       Flynn, Consolmagno, Brown & Macke (2018), «Physical properties of the
 *       stone meteorites», pinned as a source too. Each value's table, figure
 *       or section recorded. The draws: 200 on `fcm-round3/<event>/inputs` —
 *       speed and angle normal on their uncertainties, mass log-uniform on its
 *       range (or log-normal on a stated uncertainty), density uniform on its
 *       range, the diameter from mass and density; the domain decided (rule
 *       1170).
 *   (b) The targets, after the predictions are pushed: for the primary, the
 *       altitude of the maximum of the source's deposition curve with its
 *       uncertainty; for a proxy, the altitude of the brightest flare — the
 *       source's own word for it, or the light curve's maximum — on the
 *       measured trajectory, with its uncertainty; where two flares are within
 *       0.5 magnitude of each other, the interval spans both. The quality by
 *       rule 1165 (a), a value read from a figure being B with its reading
 *       uncertainty. Each value's table, figure or section recorded; the kind
 *       falls where rule 1164 (d) says.
 */

/** Rule 1162: the SHA-256 of the files that make the candidate. */
export const FCM_ROUND3_SEAL: Readonly<Record<string, string>> = {
  'src/physics/effects/fcmBranch.ts':
    '2a5a9ff8e6f608f5fde3b4b82572725acf232f767b290b70337f8e873219cbdc',
  'scripts/fcmRound1Common.ts': '169b47a27cb968e45f465bff39acaea0d208b098e5a6a476b38d5460be0f0bc6',
  'src/physics/validation/fcmRound1Rules.ts':
    '30b2e059faec8238f5854449761af0b38086c1b098ee27d8dcb9934f464da07b',
  'src/physics/effects/ussa1976Entry.ts':
    'ff6f42ff66c16c4b17ac9c525df5fdc16fefc443b08f416e21c7c98784b02bac',
};

/** Rules 1163 and 1165 to 1167: the numbers of the test. */
export const FCM_ROUND3 = {
  domain: { diameterM: [0.1, 10], percentiles: [0.05, 0.95] },
  producedShareMin: 0.9,
  notRobustShareMax: 0.2,
  margins: { primaryKm: 1, proxyKm: 2 },
  qualityBMinimumKm: 1,
  intervalScoreAlpha: 0.1,
  severe: { primaryKm: 5, proxyKm: 7, producedShareMin: 0.5, eventShare: 1 / 3 },
  weights: {
    mixture: [0.25, 0.25, 0.25, 0.25],
    rotated: [0.55, 0.15, 0.15, 0.15],
  },
  verdict: {
    minEvents: 5,
    minStrong: 3,
    favourableShare: 0.6,
    proxyWeight: 0.5,
    maxProxyUnfavourable: 1,
  },
} as const;

export type ObservableKind = 'primary' | 'proxy' | 'diagnostic';

/**
 * Rule 1164 (d): each candidate's kind, fixed from its metadata alone (the
 * register's mentions): «primary» where an abstract mentions an energy
 * deposition; «proxy» where it mentions flares or a light curve on a measured
 * trajectory; «diagnostic» otherwise. At extraction it may only fall.
 */
export const FCM_ROUND3_OBSERVABLES: Readonly<Record<string, ObservableKind>> = {
  Benenitra: 'primary',
  Grimsby: 'proxy',
  'Bunburra Rockhole': 'proxy',
  'Mason Gully': 'proxy',
  Neuschwanstein: 'proxy',
  'Aguas Zarcas': 'proxy',
  'Park Forest': 'diagnostic',
  'Dingle Dell': 'diagnostic',
  Murrili: 'diagnostic',
  Antonin: 'diagnostic',
  Osceola: 'diagnostic',
  Ischgl: 'diagnostic',
  Annama: 'diagnostic',
  'Buzzard Coulee': 'diagnostic',
  Creston: 'diagnostic',
  'Sutter’s Mill': 'diagnostic',
  'Central Italy bolide': 'diagnostic',
  'Puerto Lápice': 'diagnostic',
  Cali: 'diagnostic',
  Berduc: 'diagnostic',
};

/** Rules 1172 (a) and 1173: the frozen list of round 3, and what was left. */
export const FCM_ROUND3_LIST = {
  primary: ['Benenitra'],
  proxy: ['Grimsby', 'Bunburra Rockhole', 'Mason Gully', 'Aguas Zarcas', 'Neuschwanstein'],
  excludedAtResolution: { Tighert: 'a CNEOS row the project read falls on its date' },
  jenniskens2026: '10.1111/maps.70203',
} as const;

/** Rule 1169: one severe structural failure on a primary event of quality A. */
export const FCM_ROUND3_STRUCTURAL_A = { severeOnPrimaryA: 1 } as const;
