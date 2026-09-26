/**
 * Rules 1241 onward — Porta 1's blast round (rule 1226), opened on Andrea's
 * word of 26 September 2026, 07:52: «possiamo iniziare». Written before any
 * of its sources is read and before any code, as every round of this
 * project is. The entry's three items are written up (rule 1240), which is
 * the condition rule 1226 set for the blast and the heat.
 *
 * RULE 1241. THE QUESTION, THE ORDER, AND WHAT BINDS THE ROUND.
 *
 * (a) THE QUESTION, in the audit's own terms (A4, 25 September 2026). The
 *     product's blast is the Earth Impact Effects Program's static point
 *     source at the burst altitude (`effects/airburstBlast.ts`): a blend of
 *     the regular and Mach reflections whose half-width, 0.00328·z², was
 *     read backward from the program's printed output rather than from a
 *     paper; a 1/r decay over a plane out to thousands of kilometres; no
 *     scaling with ambient pressure; a circular footprint. At Chelyabinsk it
 *     gives 0.74 kPa in the city against about 3.2 kPa from the broken
 *     windows; at Tunguska 20 kPa at 11.5 km against 26.5 km of felled
 *     forest; the band that covers both is ×3.3 to 3.8 on the radius — ×12
 *     on the area and the population. The audit's remedy: the height-of-
 *     burst curves computed by CFD (Aftosmis et al.) as a product variant,
 *     with a source moving along the trajectory; Chelyabinsk and Tunguska
 *     read as intervals (windows 0.5–1.4 and 1.4–5 kPa, trees 10–35 kPa);
 *     the Kinney–Graham «entry shock» rows taken off the blast's class A or
 *     labelled exploratory.
 * (b) THE ORDER.
 *     (1) The sources first, each with a fact sheet in rule 1192's form:
 *         Aftosmis, Mathias & Tarano's height-of-burst map (NTRS 20170011263,
 *         the Acta Astronautica paper), Aftosmis et al.'s entry with a ground
 *         footprint (NTRS 20160000296), Wheeler et al.'s blast-sensitivity
 *         study of 2024 (NTRS 20240016044), and what rule 1240 (b) already
 *         records from the batch of rule 1235.
 *     (2) The damage criterion fixed before the propagation is judged —
 *         Robertson & Mathias's warning (rule 1240 (b)): what overpressure
 *         or wind broke the windows at Chelyabinsk and felled the trees at
 *         Tunguska, from sources that do not fit it to those events, as the
 *         intervals the audit names.
 *     (3) A candidate only under its own later rules, after (1) and (2):
 *         measured on Chelyabinsk and Tunguska as development (both are
 *         development cases), held to a test on events never used to choose
 *         it, never tuned.
 *     (4) The globe draws what the product computes: if the blast changes,
 *         its drawing on the globe and in the report changes in the same
 *         round, before the round is called finished.
 * (c) WHAT BINDS. The product's blast is sealed in the 308 scenarios of the
 *     seal: any change is a declared reseal under its own rules, with the
 *     report and the validation page regenerated. Nothing is adopted without
 *     a rule, written before the measurement, that says why.
 * (d) HOW THE SOURCES ARE READ. Open copies (NTRS) are fetched directly and
 *     their SHA-256 recorded (rule 1225). A source's burst heights are the
 *     variable of its maps, not an event's targets: a text is read whole
 *     where it names no event outside rule 1143's development list; where
 *     it names one, through the altitude mask. The texts stay outside the
 *     repository; fact sheets, fingerprints and quotes under fifteen words
 *     enter it.
 */
export const PORTA1_BLAST_OPENED = '2026-09-26' as const;

/**
 * RULE 1242. THE FIRST SOURCES READ (26 September 2026, 07:55 to 08:20),
 * whole — they name no event outside the development list — with what the
 * project had already measured, so that nothing is done twice.
 *
 * (a) WHAT THE PRODUCT ALREADY IS. Its airburst blast is the Earth Impact
 *     Effects Program's own, as Collins et al. (2017) left it: their Eq. 7
 *     for regular reflection (replacing 2005 Eqs. 55–56, which attenuate high
 *     bursts too fast), their airburst energy, and their factor of two
 *     within three burst altitudes, carried since 21 September as a band
 *     (rules 706 to 713) — reproduced within 1 % of the program. The audit's
 *     ×3.3–3.8 is therefore the static-source method's own shortfall on the
 *     two events, not a fault of its implementation here: Tunguska's 20 kPa
 *     ring at 11.5 km against the 26.5 km radius of the felled forest
 *     (0.43×); Chelyabinsk's 1 kPa ring at 30.2 km against about 56 km, and
 *     0.74 kPa in the city against about 3.2 kPa from the broken windows
 *     (I3, not met).
 * (b) COLLINS ET AL. (2017), MAPS 52, 1542–1560 (open, CC BY; Imperial
 *     College's copy, sha-256 c1cb0fc6…). Shock-physics runs of three simple
 *     sources for vertical airbursts: a static sphere, a sphere moving down
 *     with a third of the energy as motion, and a line source fed by the
 *     pancake model. Beyond three burst altitudes the three agree; inside,
 *     the moving source gives about twice the static overpressure and
 *     matches detailed simulations (Shuvalov et al. 2013), the line source
 *     two to four times less. Their verdict: the static source is an
 *     adequate first-order approximation for probabilistic assessment, with
 *     the factor two as its uncertainty near ground zero; high, shallow
 *     airbursts such as Chelyabinsk are best modelled by a line source in
 *     three dimensions. A Monte Carlo of the pancake model puts the median
 *     burst altitude of a 0.5 Mt airburst at 27.6 km (Chelyabinsk's 28–32
 *     km) and makes Tunguska close to a worst case for its energy.
 * (c) AFTOSMIS ET AL. (2016), NTRS 20160000296 (the preprint of AIAA 2016-
 *     0998; sha-256 b23f9fcc…). Cart3D with the deposition of Brown et al.
 *     (2013) along Chelyabinsk's 18° trajectory reproduces the map of broken
 *     glass; for a vertical entry of the same deposition a static sphere at
 *     the half-energy altitude gives nearly the same ground overpressure as
 *     the line source, away from ground zero. What the static source misses
 *     is therefore the footprint's shape for shallow entries, not the decay
 *     with range. A damage criterion independent of the events is quoted
 *     from blast-wave statistics (Mannan & Lees): about 700 Pa breaks about
 *     5 % of ordinary windows, about 6 kPa about 90 %.
 * (d) AFTOSMIS, MATHIAS & TARANO, the poster of NTRS 20170011263 (sha-256
 *     71b29d5c…), and WHEELER ET AL.'s talk of 2024, NTRS 20240016044
 *     (f7b61b56…). Cube-root yield scaling of nuclear height-of-burst maps
 *     holds to a few megatons; above, the atmosphere's buoyancy breaks the
 *     similarity, and CFD maps give lower optimal burst altitudes, larger
 *     largest radii and steeper fall-offs. PAIR reads the nuclear maps below
 *     5 Mt, the CFD maps above 250 Mt, and interpolates between; it scores
 *     four levels — 1, 2, 4 and 10 psi, with 10, 30, 60 and 100 % of the
 *     population inside affected (Stokes et al. 2017). The maps themselves
 *     are in the paper, Acta Astronautica 156 (2019) 278–283, behind a
 *     paywall: asked of Andrea (rule 1225).
 * (e) WHAT FOLLOWS FROM IT. Below 5 Mt — Chelyabinsk, and Tunguska's lower
 *     estimates — PAIR's practice is the EIEP's own; the CFD maps can move
 *     only the larger yields, and their size at Tunguska's 10–15 Mt is
 *     unknown until the paper is read. Wheeler & Mathias (2019) needed 25 to
 *     35 Mt for Tunguska's damage under that practice, against the 3–15 Mt
 *     the literature gives its energy. Two things, then, stand before any
 *     candidate: the damage criterion (rule 1241 (b)(2)) — how much of the
 *     gap is the thresholds' — and the source's shape for shallow entries,
 *     for which no fast relation is yet in hand.
 */
export const RULE_1242_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1243. THE DAMAGE CRITERION, fixed from sources independent of the
 * two events and before the product is read at it (rule 1241 (b)(2);
 * 26 September 2026, 08:10).
 *
 * (a) WINDOWS. Glasstone & Dolan (1977), Table 5.145 (fourmilab's copy of
 *     Chapter V, sha-256 d1c87229…): large and small glass windows fail —
 *     «shattering usually» — at 0.5 to 1.0 psi side-on, 3.4 to 6.9 kPa.
 *     Blast-wave statistics (Mannan & Lees, as quoted by Aftosmis et al.
 *     2016, rule 1242 (c)): about 700 Pa breaks about 5 % of ordinary
 *     windows, about 6 kPa about 90 %. So the edge of a region where windows
 *     broke lies at about 0.7 kPa; where most broke, at 3.4 to 6.9 kPa.
 * (b) TREES. Glasstone & Dolan, Table 5.149, in the equivalent steady wind:
 *     light damage (deciduous stands only) 60–80 mph, 27–36 m/s; moderate,
 *     about 30 % of the trees blown down, 90–100 mph, 40–45 m/s; severe, up
 *     to 90 % down, 130–140 mph, 58–63 m/s. The edge of a mapped felled
 *     forest is read at the moderate criterion, 40–45 m/s, bounded by the
 *     light one's 27 m/s and the severe one's 63 m/s; the wind is the
 *     product's own (Glasstone & Dolan's shock relation, as the program
 *     applies it).
 * (c) THE TWO EVENTS, read at these criteria — fixed now: Chelyabinsk's
 *     region of broken windows (about 10 000 km², a circle of 56 km) at the
 *     0.7 kPa edge; Tunguska's felled forest (about 2 200 km², a circle of
 *     26.5 km) at 40–45 m/s, 27–63 m/s its bounds. The city of Chelyabinsk's
 *     «about 3.2 kPa» (Brown et al. 2013) is an inference from its glass,
 *     not a measurement, and is not used. Both footprints are compared as
 *     circles of the same area, as I3 does; their shapes are the source's
 *     question, not the criterion's.
 * (d) WHAT IS MEASURED: the product's reach at these criteria for its two
 *     presets — the static source, and the band of Collins et al. (2017)
 *     about it (rules 706 to 713) — to say how much of the audit's ×3.3–3.8
 *     is the thresholds'. Development only (both are development cases);
 *     nothing in the product changes.
 */
export const RULE_1243_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1244. RULE 1243'S OUTCOME (26 September 2026, 08:15;
 * `porta1BlastCriteria.json`, `docs/PORTA1_BLAST_CRITERIA.md`).
 *
 * (a) CHELYABINSK. The preset bursts at 27.1 km with a blast yield of 0.298
 *     Mt. At the edge of broken windows, 0.7 kPa, the static source reaches
 *     47.7 km against the 56 km circle of the region where windows broke —
 *     0.85×, where I3 read 0.54× at 1 kPa — and Collins et al.'s band,
 *     14.5 to 81.4 km, holds it. The static source reaches 3.4 kPa nowhere
 *     on the ground: under it, most windows broke nowhere.
 * (b) TUNGUSKA. The preset bursts at 8.2 km with 8.04 Mt. At the moderate
 *     criterion, 40–45 m/s, the static source reaches 12.8 to 14.0 km
 *     against the 26.5 km circle of the felled forest — 0.48× to 0.53× —
 *     and the band's high edge, the moving source, 24.5 km, 0.92×. Only the
 *     light criterion's 27 m/s, which Glasstone & Dolan give for deciduous
 *     stands alone, reaches beyond it (28.5 km); the taiga was coniferous.
 * (c) WHAT IT MEANS. At Chelyabinsk most of the audit's shortfall was the
 *     threshold: read at the independent edge, the static source falls short
 *     by 15 %, and what remains is the footprint's shape under a shallow
 *     entry. At Tunguska it is the source's: the static source is short by
 *     half where trees fall, and the moving source — the approximation
 *     Collins et al. found closest to detailed simulations of low airbursts
 *     — comes within 8 % of the forest.
 * (d) NEXT, each under its own rules before any code: the moving source as
 *     the product's estimate where Collins et al.'s own text places it (its
 *     bounds from their paper, never from Tunguska); the CFD maps above 5 Mt
 *     when Aftosmis, Mathias & Tarano (2019) is read; the shallow entry's
 *     footprint, for which no fast relation is in hand. Both events are
 *     development cases: whatever is chosen is then held to events never
 *     used to choose it.
 */
export const RULE_1244_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1245. THE SECOND READING, AND WHAT THE ROUND CAN AND CANNOT DO
 * (26 September 2026, 08:35).
 *
 * (a) AN EXPOSURE, declared. Gi, Brown & Aftosmis (2018), MAPS 53 («The
 *     frequency of window damage caused by bolide airbursts»), could not be
 *     downloaded and its text was pasted into the conversation. It names
 *     Park Forest, a candidate of the fourth set's register: its reported
 *     energy, speed, angle and azimuth, a mass and radius derived from them,
 *     and modelled ground overpressures — no altitude of it. It gives the
 *     heights of the Marshall Islands fireball (in no set of this project)
 *     and of two CNEOS rows already read for I2. Recorded here; Park
 *     Forest's register is to carry it. What cannot be saved into the
 *     folder is saved as a page, not pasted.
 * (b) GI ET AL. (2018). Window breakage follows the probit of Reed (1992)
 *     and Gilbert (1994): ordinary urban panes (0.5–1.5 m²) break at 0.01–
 *     0.7 % at 0.2 kPa, 0.4–7 % at 0.5 kPa, 25–60 % at 3 kPa; they name 0.2
 *     and 0.5 kPa the thresholds of light and heavy window damage. In
 *     Chelyabinsk, 20 % of the panes seen in videos broke; the overpressure
 *     there was estimated from the speed of flying glass at 2.6 kPa (Brown et
 *     al. 2013) and from car exhaust at 1.6–1.9 kPa (Avramenko et al. 2014).
 *     ReVelle's weak-shock line source is «largely inapplicable» beneath
 *     Chelyabinsk's trail. So: rule 1243's edge at 0.7 kPa stands; and in
 *     the city, 45 km out, the product's 0.74 kPa is 0.28× to 0.46× what was
 *     measured — the static source is short where the shallow entry's line
 *     of energy passed closest.
 * (c) AFTOSMIS, MATHIAS & TARANO (2019), Acta Astronautica 156, 278–283,
 *     open (CC BY; sha-256 5697fb52…). Yield scaling with Glasstone &
 *     Dolan's 1 kt map predicts ground overpressure well up to 5–10 Mt; above,
 *     the atmosphere's scale height breaks the similarity. Twenty-six Cart3D
 *     bursts of 250 Mt at 0 to 80 km give a 250 Mt map — in a figure only
 *     (1, 2, 4 and 10 psi) — whose optimum height is lower and whose bulge
 *     is elongated; PAIR interpolates between maps and keeps the standard
 *     behaviour below 5 Mt. Neither event is moved by it (0.3–0.5 Mt; 8 Mt);
 *     what it would move — bodies above 50–80 m — has no observed event to
 *     test, and its map would be read off a figure.
 * (d) BOSLOUGH & CRAWFORD (2008), IJIE 35, 1441–1448 (sha-256 0458aafc…).
 *     A point source at the altitude of peak deposition understates the
 *     ground's blast: the body's fireball descends at 9 km/s from 9 km for a
 *     15 Mt stony impactor. Treefall overstates Tunguska's yield — ridges
 *     raise the wind, and the forest's own weakness (Florenskiy's
 *     dynamometer) brings the needed point source to 3.5 Mt. Tunguska's
 *     energy and its trees' criterion are uncertain by factors: the event
 *     can test a blast law only loosely, and pin none (with Robertson &
 *     Mathias, rule 1240 (b)).
 * (e) WHAT FOLLOWS. The round has one change the sources support without
 *     any event: the damage criterion. The product's rings say «window
 *     breakage» at 6.9 kPa and «scattered windows» at 3.45 kPa, where the
 *     sources put the onset of broken windows at 0.2–0.7 kPa and «most
 *     shattered» at 3.4–6.9 kPa — at Chelyabinsk its lightest ring reaches
 *     no ground while windows broke over 10 000 km². The moving source is
 *     already the band's high edge; making it central needs a rule on where
 *     it applies that no source gives in numbers. The 250 Mt map concerns
 *     only large yields and a figure. The shallow entry's footprint has no
 *     fast relation. Which of these becomes a product change is Andrea's
 *     choice (they move the drawn rings, the report and the seal).
 */
export const RULE_1245_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1246. THE FIRST PRODUCT CHANGE: THE WINDOWS' CRITERION ON THE GLOBE
 * AND IN THE REPORT, AND THE AIRBURST'S DECLARED LIMIT (26 September 2026,
 * 08:40; Andrea's word, «voglio la cosa più completa di tutte, quindi aiutami
 * a scegliere», and the order proposed on it: this first, then the moving
 * source as a variant, then the 250 Mt map as exploratory, each under its own
 * rules). Written before any code.
 *
 * (a) WHAT DOES NOT MOVE. No physical number. The thresholds stay — 5 psi, 1
 *     psi and 0.5 psi (34.5, 6.9, 3.45 kPa) — because the casualty model is
 *     tied to them (rule 1197) and PAIR scores at 1, 2, 4 and 10 psi: the
 *     seal's numbers digest must be the same for every scenario. I3 — the
 *     gate that reads Chelyabinsk at 1 kPa — stays as it was fixed: changing a
 *     gate's criterion after its outcome is known is moving the goalpost, and
 *     a gate is Andrea's. The explosion module's rings share the words of
 *     `globe.ringLabel.*` and `globe.tooltip.ring.*`; that module is paused,
 *     so the impacts get their own keys and its words are left as they are
 *     (the same correction would apply there, on Andrea's order).
 * (b) WHAT MOVES, the words. Glasstone & Dolan (Table 5.145, §5.143) and the
 *     statistics of rules 1243 (a) and 1245 (b) put «shattering usually» at
 *     0.5–1.0 psi, about 25 to 60 % of ordinary panes broken at 3 kPa, about
 *     90 % at 6 kPa, and light damage to all but blast-resistant structures at
 *     1 psi. So the impact's 0.5 psi line says «many windows broken», not
 *     «scattered windows» nor «light damage»; its 1 psi line «nearly all
 *     windows broken»; the 5 psi line is unchanged. This in the field map's
 *     overpressure layer (isolines and colour bar), the report's rows and the
 *     impact view's legend, in Italian and in English.
 * (c) WHAT MOVES, the low overpressure (rule 1031 (c)). The layer keeps its
 *     form — its own tab, its own palette, exploratory, outside the
 *     structural scale and the toll, its lines at 1 and 3 kPa — and gains the
 *     two criteria the sources fix below them: 0.7 kPa, about one pane in
 *     twenty (Mannan & Lees; the edge of a region of broken windows, rule
 *     1243 (a)), and 0.2 kPa, Gi et al.'s threshold of light window damage
 *     (0.01–0.7 % of panes). Its scale starts at 0.2 kPa instead of 1. Each
 *     line says what the sources give at it (3 kPa: a quarter to more than
 *     half of the panes; 1 kPa: no source names it — the layer's own line).
 *     Its notes say where its thresholds come from, and its validation note
 *     states rule 1244's comparison as what it is: on Chelyabinsk, a
 *     development case, the 0.7 kPa line reaches 0.85 of the radius of the
 *     region where windows broke — a comparison, not a validation.
 * (d) WHAT MOVES, the declared limit. Every complete airburst's blast layers
 *     (overpressure, low overpressure, wind) carry a note: the airburst is
 *     drawn round, from a source standing still at the burst altitude; a
 *     shallow entry lays its energy along tens of kilometres of trajectory,
 *     the region struck is drawn out along the track, and beneath the track
 *     the overpressure can exceed the drawn one beyond the factor two of the
 *     field-agreement view (Collins et al. 2017; Aftosmis et al. 2016) — at
 *     Chelyabinsk the city, 45 km from the point below the burst, had an
 *     estimated 2 to 3.5 times what this source gives there (Gi et al. 2018).
 *     No angle below which it applies is drawn: no source gives one in
 *     numbers.
 * (e) WHAT DOES NOT ENTER, and why. Trees. Glasstone & Dolan give forest
 *     damage (Table 5.149) as the equivalent steady wind that would produce
 *     comparable damage, and its distances by yield from a nomogram for
 *     nuclear bursts (Fig. 5.146, halved for surface bursts on forests) —
 *     not as a peak wind behind a shock. A tree line read off the product's
 *     peak wind would claim an equivalence the book does not make. Rule 1244
 *     (b)'s ratios at Tunguska carry that approximation, and are read with
 *     it. The nomogram could enter only read off a figure: a later step, if
 *     Andrea wants it.
 * (f) HOW IT IS CHECKED. The tests of rule 1031 (c) are extended to the four
 *     lines (Chelyabinsk's preset: the field reads each line's value where it
 *     is drawn; which lines exist); the seal is re-taken with the reason and
 *     every moved scenario listed — the drawing and the report's text move,
 *     the numbers digest of every scenario must not; `tsc --noEmit`, eslint
 *     and the unit tests pass; the globe is photographed headless for
 *     Chelyabinsk and Tunguska before and after (rule 1033's suite); the
 *     validation report is regenerated once and must not change, since no
 *     number does.
 */
export const RULE_1246_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1247. RULE 1246'S OUTCOME (26 September 2026, 09:05).
 *
 * (a) NO NUMBER MOVED. The seal was re-taken (rule 833, its reason and what
 *     moved written into it): the numbers digest of none of the 308 scenarios
 *     moved; the drawing of 280 moved, the text of all 308 (Italian and
 *     English). The 28 drawings that did not move draw no blast layer before
 *     or after — complete airbursts whose largest ground overpressure is under
 *     0.2 kPa (0.193 at most), 24 of them drawing no layer at all. Forty
 *     scenarios whose ground peak lies between 0.2 and 1 kPa gain the low
 *     overpressure's layer they did not draw before. The validation report,
 *     regenerated once, is unchanged to the byte (Gate: PASS).
 * (b) WHERE THE LINES FALL, on the presets: Chelyabinsk 1 kPa at 30.2 km,
 *     0.7 kPa at 47.7 km (rule 1244's reach, the city now inside it), 0.2
 *     kPa at 161 km; Tunguska 3 kPa at 84.4 km, 1 kPa at 221 km, 0.7 kPa at
 *     309 km, 0.2 kPa at 1 050 km; Meteor Crater 0.2 kPa at 531 km; Sikhote-
 *     Alin 0.2 kPa at 33 km. Chicxulub and Popigai already passed the
 *     planetary warning and keep it; Boltysh's 0.2 kPa line (18 220 km) falls
 *     under the same warning its 1 kPa line (3 837 km) already carried. None
 *     of these reaches was compared with an observation other than
 *     Chelyabinsk's (rule 1244), and none is a validation.
 * (c) THE CHECKS of rule 1246 (f): `tsc --noEmit` and eslint clean on the
 *     changed files; the unit suite green (3 270 tests, 363 files, 12
 *     skipped), with the tests of rule 1031 (c) extended to the
 *     four lines and two new ones (the impact's own words for the psi lines
 *     with the three thresholds unchanged; the airburst's note on every blast
 *     layer of a complete airburst and on none of a ground impact); rule
 *     1033's suite photographed before and after, no page errors — Chelyabinsk
 *     now draws its 0.7 and 0.2 kPa lines, Tunguska four lines, and each
 *     legend says where its thresholds come from and that the airburst is
 *     drawn round.
 * (d) WHAT REMAINS OF THE BLAST ROUND, in the order of rule 1246: the moving
 *     source as a product variant (its bounds from Collins et al.'s text,
 *     never from Tunguska), then the 250 Mt map as exploratory — each under
 *     its own rules before any code. The explosion module's ring words keep
 *     the old labels until Andrea orders that module opened; the trees'
 *     nomogram waits for Andrea's word (rule 1246 (e)).
 */
export const RULE_1247_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1248. THE MOVING SOURCE, READ BEFORE ANY CHOICE (26 September 2026,
 * 09:15). Collins et al. (2017), re-fetched from Imperial College's open copy
 * after the machine's restart (sha-256 c1cb0fc6…, the same bytes as rule 1242
 * (b)), read again for what the second step of rule 1246 needs: the moving
 * source's bounds from their text.
 *
 * (a) WHAT THE MOVING SOURCE IS. An iSALE simulation, not a formula: the
 *     static source's sphere of hot gas at the burst altitude, holding the
 *     entry energy less the residual kinetic energy, given a downward speed
 *     from that residue — a third of the initial kinetic energy, which their
 *     pancake Monte Carlo puts at 0.33–0.34 over a wide range of airbursts;
 *     2 450 m/s in every run. Vertical entries only (two-dimensional,
 *     cylindrical). It matches Shuvalov et al.'s SOVA runs for 20 to 50 m
 *     bodies except above about 40 kPa for the 50 m one.
 * (b) WHAT THEY GIVE IN NUMBERS: Table 2, four burst energies at fixed burst
 *     altitudes — 0.5 Mt at 21.5 km, 5 at 14, 15 at 10, 50 at 11 — the
 *     overpressure at ground zero and at three burst altitudes, and the
 *     ranges of 1, 10, 20 and 35 kPa, for the static (S), moving (M) and line
 *     (C) sources. The moving over the static source: at ground zero 1.38,
 *     1.63, 2.17, 2.81; at three burst altitudes 1.03 to 1.10; at 1 kPa's
 *     range 1.05, 0.99, 0.92 (farther out the moving source reaches less
 *     [at 5 and 15 Mt only; at 0.5 Mt a little farther — corrected under rule
 *     1249]);
 *     at 20 kPa's range 2.63 (5 Mt), 1.15 (15), 1.03 (50). Their S is their
 *     own iSALE sphere, not the program's scaling law the product draws.
 * (c) WHAT THEY GIVE AS A FAST METHOD: no analytic moving source — they name
 *     one as future work («it may be fruitful to explore an analytical
 *     approach») — but the static-source method with a factor of two on the
 *     overpressure inside three burst altitudes, «as a correction or measure
 *     of uncertainty». That is the product's band already (rules 706 to 713):
 *     its high edge is the static reach at half the threshold, capped at three
 *     burst altitudes.
 * (d) WHAT FOLLOWS. The moving source's bounds from the text are those of
 *     (b) and (c) and no others: a ratio growing with energy at ground zero
 *     (1.4 to 2.8 over 0.5 to 50 Mt, each at one burst altitude), about 1 at
 *     three burst altitudes, below 1 far out. A product variant can be only
 *     one of: (1) the band's high edge named for what it is, Collins et al.'s
 *     own fast stand-in for the moving source, with Table 2's ratios in its
 *     note — no new model; or (2) a correction of the static field by Table
 *     2's ratios, interpolated in energy and in range over four simulations
 *     whose static source is not the product's — a model this project would
 *     build, exploratory by construction, with no airburst outside the
 *     development list to hold it to. Which, if either, is Andrea's choice.
 */
export const RULE_1248_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1249. THE SECOND STEP, CHOSEN: THE BAND NAMED FOR WHAT IT IS (26
 * September 2026, 09:20; Andrea's answer to rule 1248 (d): «Nominare la
 * banda»). Written before any code.
 *
 * (a) WHAT DOES NOT MOVE. No model is added and no number moves: the band of
 *     rules 706 to 713 stays as it is — within three burst altitudes, the
 *     static reach at half the threshold for its upper edge and at twice it
 *     for its lower edge; beyond, the static reach. The numbers digest of every
 *     scenario of the seal must stay the same.
 * (b) WHAT MOVES, the words of the Field agreement view (complete airbursts
 *     only) and of the overpressure layer's band note, in Italian and in
 *     English. The upper edge is named what Collins et al. make it: their fast
 *     stand-in for the moving source (a fireball still falling); the lower
 *     edge, the line source along a vertical trajectory. A note of its own
 *     gives Table 2's ratios — the moving over the static source 1.4 times at
 *     ground zero for 0.5 Mt at 21.5 km, 2.8 times for 50 Mt at 11 km, about
 *     1 at three burst altitudes, and at 1 kPa's range a little less at 5
 *     and 15 Mt, a little more at 0.5 Mt; the line source 2 to 4
 *     times lower beneath the burst — and says the factor two is their fast
 *     correction, not one of their results, for vertical entries only.
 * (c) HOW IT IS CHECKED. A test that the Field agreement view names both
 *     edges and carries the note, on a complete airburst; the seal re-taken
 *     with the moved scenarios listed, numbers digest unmoved; `tsc
 *     --noEmit`, eslint, the unit suite; the validation report, unchanged.
 */
export const RULE_1249_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1250. RULE 1249'S OUTCOME, AND THE SECOND STEP CLOSED (26 September
 * 2026, 09:40).
 *
 * (a) The seal re-taken with its reason: numbers digest moved in none of the
 *     308 scenarios; drawing and text in the 57 complete airbursts, the only
 *     ones that draw the Field agreement view. The validation report,
 *     regenerated once, is unchanged to the byte (Gate: PASS). `tsc --noEmit`
 *     and eslint clean; the unit suite green, 3 271 tests with rule 1249's.
 * (b) The second step of rule 1246 is closed with no model added: the moving
 *     source stays the band's upper edge, now named so, with Collins et al.'s
 *     numbers beside it. Rule 1244 (b)'s 24.5 km at Tunguska (0.92 of the
 *     felled forest) is that edge; it is a development reading and stays one.
 * (c) NEXT, the third step: Aftosmis, Mathias & Tarano (2019)'s 250 Mt map as
 *     exploratory, under its own rules before any code — what its figure
 *     gives, how it would be read off, which bodies it would move, and how it
 *     would be shown without claiming a validation it cannot have.
 */
export const RULE_1250_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1251. THE THIRD STEP: THE 250 Mt MAP READ OFF ITS FIGURE, AND THE
 * PRODUCT MEASURED AGAINST IT — BEFORE ANY DISPLAY (26 September 2026,
 * 09:50). Written before the figure is digitised.
 *
 * (a) THE SOURCE. Aftosmis, Mathias & Tarano (2019), Acta Astronautica 156,
 *     278–283, open (CC BY), Andrea's copy in the sources folder (sha-256
 *     5697fb52…, rule 1245 (c)). Its Fig. 5 is the only form of the 250 Mt
 *     map: ground range against burst height, both scaled to 1 kt by the
 *     cube root of the yield, with Glasstone & Dolan's 1 kt map (solid) and
 *     the 26 Cart3D bursts of 250 Mt (dashed) at 1, 2, 4 and 10 psi. The PDF
 *     carries it as seven raster tiles (about 4.2 pixels per point),
 *     recomposed by their placement matrices; no table of it exists.
 * (b) HOW IT IS READ. Axes calibrated on the frame and the grid (0 to 3 km of
 *     range, 0 to 1.6 km of height, 1 kt scaled). Each threshold's curve is
 *     isolated by its colour; the dashed curve is read at the 26 simulated
 *     heights the footnote lists (the map's own data points, 0 to 1.270 km
 *     scaled), the solid one at the same heights. Where a height meets a curve
 *     twice (the bulge), both crossings are kept. A reading's uncertainty is
 *     the line's half-width plus a pixel, stated in km scaled and at 250 Mt.
 *     The digitised values, with the figure's fingerprint and the procedure,
 *     enter the repository; the figure does not.
 * (c) WHAT IS MEASURED, development only, nothing in the product changing:
 *     (1) the product's static source at 1 kt against Glasstone & Dolan's
 *     solid curves — whether the product's blast is the map the figure
 *     starts from; (2) the product at 250 Mt against the dashed curves, at
 *     the same scaled heights — the ratio of reaches at 1, 2, 4 and 10 psi;
 *     (3) which bodies the product sends to complete airbursts above 5 Mt,
 *     where the map could matter. No observed event is involved: the map can
 *     move only yields no airburst on record has reached.
 * (d) WHAT DOES NOT FOLLOW YET. How the map would be shown — a layer, a
 *     note, a variant — and what would be done between 5 and 250 Mt, where
 *     PAIR interpolates by a variable its papers do not state, are decided
 *     after (c) is measured, by Andrea.
 */
export const RULE_1251_WRITTEN = '2026-09-26' as const;

/**
 * RULE 1252. THE PRINTED REPORT SPILLED, AND HOW IT IS MENDED (26 September
 * 2026, 10:25). Written before the fix.
 *
 * (a) WHAT FAILED. The CI of 5189a8f failed «prints to A4, a sheet a page»
 *     on Chromium and mobile Chrome: 13 pages where 12 is the budget, the
 *     first atlas sheet printing on two. Rule 1246 (c) gave each low
 *     overpressure line its own sentence; the report prints a line's sentence
 *     wherever the sentences tell the lines apart (a block under the title),
 *     so Meteor Crater's table went from two rows of one line to four rows of
 *     two — 52 to 131 px — and its notes 11 px longer: the sheet grew from
 *     907 to 997 px (measured locally against the base 4cff07f served beside
 *     it). The lesson recorded on 26 September at 01:45 — run the Chromium
 *     end-to-end tests on the pages touched before pushing — was not
 *     followed; it is followed now.
 * (b) A TRIAL THAT DID NOT COUNT. A first fix was tried in the page — the
 *     sentence on the title's line, the closing «exploratory, not validated»
 *     dropped from each — and read as fitting; the reading was wrong: after
 *     the first measurement the page had been put back to screen media, and
 *     the later PDFs were printed with the screen's styles. Measured again
 *     with the print styles, that fix leaves the sheet at 954 px and on two
 *     pages; the local limit lies between 927 and 937 px, and the two added
 *     rows alone cost 36 px the sheet does not have. It was undone.
 * (c) THE FIX, keeping everything rule 1246 put there. (1) The low
 *     overpressure's figure takes a sheet of its own in the atlas, the other
 *     figures paired after it in their order. Tried in the page with the
 *     print styles before any code: Meteor Crater prints on 14 pages locally,
 *     as the base does, every atlas sheet on one page. With an odd number of
 *     figures, as there, no sheet is added; with an even number, one is —
 *     each sheet still one page. (2) The new pair (wind and heat) is left
 *     with 0 to 10 px to spare locally, too little to trust the CI's fonts:
 *     a line's sentence follows its title on the same line, after a « · »,
 *     in every table of the impacts' report — measured with the print
 *     styles, that pair's sheet then has at least 50 px to spare, and the
 *     summary sheet shrinks from 917 to 884 px. The dropped «exploratory»
 *     of (b) is not taken up: the sentences stay as rule 1246 wrote them.
 * (d) HOW IT IS CHECKED. The report's end-to-end tests run locally on
 *     Chromium, each sheet counted against the base served beside it; the
 *     unit suite; the seal (the report's text is unchanged, so it must not
 *     move).
 */
export const RULE_1252_WRITTEN = '2026-09-26' as const;
