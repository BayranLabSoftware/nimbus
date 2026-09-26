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
