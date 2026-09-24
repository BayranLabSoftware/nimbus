/**
 * Rules 1063 to 1073 — the specification of F, the fragments that slow by their
 * own size, written before its code. The reviewer's order after the study of
 * S: the charter of the independent test first (rules 1038 to 1062), then F as
 * a study of development, with S's discipline; Andrea's word, 24 September
 * 2026: the specification, with no code, before the reviewer reads it. A
 * readable version: docs/FRAGMENTATION_STUDY_F_SPEC.md.
 *
 * RULE 1063. WHAT THIS IS. S's dominant error was the mass that survives: a core
 * that never breaks reaches the ground from about six to over twenty thousand
 * times heavier than the meteorites found. F replaces what happens after the
 * main fragmentation — today one pancake of the whole body (Collins et al.
 * 2005, Eqs. 11 to 20, started at S2 by rule 882(a)) — with a progressive
 * fragmentation into discrete fragments, each slowed and broken by its own
 * physical size, and clouds of debris. One axis (rule 960): nothing before S2
 * changes, and nothing else. F is a study of development: nothing it shows
 * adopts it; it receives no class B; whether it is adopted is the independent
 * test's to say, under the charter, and the third set stays closed.
 *
 * RULE 1064. THE SOURCES, read on 24 September 2026 with Andrea's leave:
 *   (a) Wheeler, Mathias, Stokan & Brown, «Atmospheric energy deposition
 *       modeling and inference for varied meteoroid structures» (Icarus 315,
 *       2018; preprint NTRS 20180002835): §2 and Fig. 1, the fragment-cloud
 *       model (FCM) — each component's flight, the breakup where ρ_a v² > S,
 *       the child's strength S_c = S_p (m_p/m_c)^α, N fragments and one debris
 *       cloud per break, clouds that broaden and slow under a common bow
 *       shock; §4.1, Chelyabinsk's fits (clouds of 75–85 % of the mass at each
 *       break, α from about 0.07 to 0.5, two-fragment splits near 60/40, a
 *       dispersion coefficient of 1.5–2.5 and an ablation coefficient of 4 to
 *       8·10⁻⁹ kg/J, landed masses of 9 g to 340 kg); §5, lower cloud
 *       fractions for the meter-scale Košice and Benešov. The authors say
 *       their fits are per event and not unique (§4).
 *   (b) Register, Mathias & Wheeler, «Asteroid fragmentation approaches for
 *       modeling atmospheric energy deposition» (Icarus 284, 2017; accepted
 *       manuscript NTRS 20180003387): §2.2, Eqs. 8 and 9 — the breakup
 *       criterion, the strength's scaling, a ceiling of 330 MPa from the
 *       compressive strength of meteorites; §2.6, independent wakes, the
 *       fragments starting on the parent's path with no lateral speed; §2.7,
 *       the combination model, two fragments and a dust cloud per break, the
 *       clouds between 3 and 75 % of the parent's mass.
 *   (c) Not read: Wheeler, Register & Mathias (2017, Icarus 295), the FCM's own
 *       paper, behind a paywall; where (a) and (b) do not give a number, this
 *       specification says so and gives Nimbus's.
 *
 * RULE 1065. THE BREAK. Where the body's dynamic pressure first reaches S2 —
 * the point the baseline's pancake starts — it breaks, and so does every
 * fragment where its own pressure ρ_a v² first reaches its own strength:
 *   (a) into two fragments and one debris cloud (N = 2: (b) §2.7; (a) §4.1's
 *       best splits); the cloud takes a share f_c of the parent's mass; the
 *       rest splits between the two fragments as y and 1 − y, y the larger;
 *   (b) each child's strength is S_p (m_p/m_c)^α, never above 330 MPa ((b)
 *       Eqs. 8–9); the first break's parent strength is S2;
 *   (c) the fragments start on the parent's path, at its speed and angle, with
 *       no lateral speed ((b) §2.6) — so F spreads no strewn field, and says so;
 *   (d) a fragment lighter than 1 g is not followed: its kinetic energy is laid
 *       down where it forms and its mass is written in the budget as dust
 *       below the floor — a hypothesis of Nimbus, its sensitivity at 0.1 g
 *       published (rule 1070).
 *
 * RULE 1066. THE FRAGMENTS' FLIGHT. A fragment is a sphere of its mass at the
 * body's density, slowed by drag on its own diameter with Collins et al.'s
 * drag coefficient on the product's exponential atmosphere, integrated by the
 * classical fourth-order Runge–Kutta in altitude, as S integrates its core;
 * gravity and the path's curvature as the product leaves them (rule 1026's
 * terminal floor kept). The ablated mass is none by the model's assumption, as
 * in the baseline and in S (rule 1023 (b)): the FCM's ablation coefficient is
 * an axis of its own, not F's.
 *
 * RULE 1067. THE CLOUDS. A debris cloud starts as a sphere of its mass at the
 * body's density, at its parent's speed, altitude and angle, and is closed by
 * the product's own pancake — Collins et al.'s Eqs. 15 to 17, a burst where it
 * reaches f_p times its starting diameter, or a swarm on the ground — as S
 * closes its shares. This is the product's dispersion, not the FCM's
 * (Hills & Goda's, with its coefficient): a difference declared. With f_c = 1
 * the first break is one cloud of the whole body, and F is the baseline.
 *
 * RULE 1068. THE PRIORS, drawn once per draw beside the baseline's inputs (rule
 * 978), each a hypothesis of Nimbus spanning the sources, none chosen on a case:
 *   f_c uniform on [0.05, 0.85] — (b)'s 3–75 % and (a)'s 75–85 %;
 *   y   uniform on [0.5, 0.7]   — (b)'s even split and (a)'s 60/40;
 *   α   uniform on [0.05, 0.6]  — (a)'s 0.07 to 0.5 and the 0.57 of (b)'s
 *       comparisons.
 * They come from fits of Chelyabinsk (a development case of this round),
 * Košice and Benešov (falls of Borovička et al. 2020's sample, excluded from
 * the third set by rule 936) and Tagish Lake: F's result on Chelyabinsk is not
 * independent of its priors, and is labelled so.
 *
 * RULE 1069. THE BUDGETS, checked on every run, as S's (rule 1020): the masses
 * of every fragment, cloud and dust below the floor sum to the body's; the
 * energy laid down in the air plus the kinetic energy at the ground, the
 * terminal floor's work written in, closes the entry's energy; the momentum
 * with the impulse given to the air closes; each to 10⁻¹² of the whole, or the
 * run is void.
 *
 * RULE 1070. THE VERIFICATION, before any case is run, on bodies that are not
 * development cases:
 *   (a) f_c = 1: F is the baseline — the same release and the same energy,
 *       each within 10⁻⁹ of its value;
 *   (b) f_c = 0 and strengths that never break again: two intact fragments of
 *       y and 1 − y, each on the single-body path of its own mass;
 *   (c) the budgets of rule 1069 on 90 bodies;
 *   (d) convergence: the Runge–Kutta step halved and doubled, and the floor at
 *       0.1 g, move the release altitude and the largest piece's mass at the
 *       ground by less than 1 %; where they do not, it is said, as rule 1027
 *       said it of S;
 *   (e) a bound on the components: a run past 10⁵ is reported as such, never
 *       cut silently.
 *
 * RULE 1071. WHAT IS PUBLISHED, for the baseline, S and F on the development
 * cases of the round (rule 961) and the same draws: the release altitude (m2,
 * a proxy); the largest piece at the ground, its mass and speed; the surviving
 * mass and the number of pieces above 1 g; the regime of arrival and the
 * crater's state (rule 1011's three observables, non-decisional); the budgets.
 * The domain's labels of rule 1023 (a): the ordinary chondrites as development
 * cases, the unknown types as sensitivity, 2024 BX1, 2008 TC3 and 2018 LA as
 * controls; Chelyabinsk marked as the source of F's priors.
 *
 * RULE 1072. THE OUTCOME, in words fixed before the run: «Studio F: la variante
 * mostra come una frammentazione progressiva in frammenti che rallentano e si
 * rompono secondo la propria taglia, con nubi di detriti, modifica quota di
 * rilascio, deposito di energia, sopravvivenza, massa dei pezzi al suolo e
 * regime d'arrivo nel dominio delle condriti ordinarie. Non viene adottata in
 * questo round e non riceve una classe B; la decisione resta riservata al test
 * indipendente della carta (regole 1038–1062).»
 *
 * RULE 1073. THE ORDER. This specification, pushed. The reviewer reads it. Then
 * F's code with rule 1070's verification, then one run on the development
 * cases, then its outcome; S + F only if the two studies call for it. Nothing
 * of F is chosen on the third set, whose sources stay closed.
 */

/**
 * Rules 1078 to 1083 — F's specification completed, on the reviewer's reply of
 * 24 September 2026: the approach approved as a study, not yet for code, with
 * five clauses to add before it. Andrea's word: the specification completed,
 * then the text; the code after the reviewer's answer.
 *
 * RULE 1078. THE BUDGETS, defined (amends rule 1069). At every step and at the
 * end: MASS — the fragments in flight, the clouds in flight, the pieces on the
 * ground and the dust below the floor sum to the body's mass (no ablation);
 * the dust's mass is written where it formed, altitude by altitude, never
 * dropped. ENERGY — the entry's kinetic energy plus the work of gravity on
 * every component equals the energy laid down in the air (each component's
 * kinetic energy lost to drag, and the dust's kinetic energy at its birth,
 * laid down at its birth's altitude) plus the kinetic energy of everything on
 * the ground plus that still in flight. MOMENTUM, along each component's path —
 * the entry's momentum plus the impulse of gravity minus the impulse given to
 * the air by drag equals the momentum of everything in flight and on the
 * ground, the dust's at its birth given to the air with its energy. Each closes
 * to 10⁻¹² of the entry's value, or the run is void.
 *
 * RULE 1079. THE BREAK, without double counting (amends rule 1065). At the
 * altitude z where a parent of mass m, speed v, angle θ and strength S_p meets
 * its criterion, the parent's path ends and its energy lost down to z is
 * counted once, on its own path. There begin, each at z, v and θ: two fragments
 * of masses y(1 − f_c)m and (1 − y)(1 − f_c)m, spheres at the body's density,
 * with strengths min(S_p (m/m_child)^α, 330 MPa); and one cloud of mass f_c m,
 * starting as the sphere of its mass at the body's density. Every component
 * lays down its own energy on its own path from z on; the profile is their sum
 * per altitude bin, no part counted twice. A child whose pressure at z already
 * reaches its own strength breaks at once, at z, by the same rule, until every
 * piece is stronger than its pressure there or lies below the floor.
 *
 * RULE 1080. CONVERGENCE ON WHAT COUNTS (amends rule 1070 (d)). The step
 * halved and doubled, and the floor at 0.1 g, must move each of: the release
 * altitude, by less than 1 %; the median mass of the largest piece on the
 * ground, by less than 1 %; the share of draws with a piece on the ground, by
 * less than 0.01 — each on the same draws. The floor's sensitivity publishes
 * where the mass below the floor went — its share of the body and the
 * altitudes at which its energy was laid down — beside the rest of the budget.
 * Where a quantity does not converge, it is said, and that quantity is not
 * published as a result.
 *
 * RULE 1081. THE LIMIT OF THE BASELINE, verifiable (amends rule 1070 (a)). F's
 * clouds are closed by the very code the baseline's pancake runs, started from
 * the cloud's state. With f_c = 1, on the same draws: the burst altitude, the
 * breakup altitude, the energy fraction to the ground and the entry's regime
 * are the baseline's; each continuous quantity within 10⁻⁹ in relative error
 * (|F − baseline| / |baseline|, an absolute 10⁻⁶ m where the baseline's value
 * is zero), and every energy bin of the profile within 10⁻⁹ of the total
 * energy; the regime and the crater's state equal; the cloud's law of
 * expansion the same function, not a copy.
 *
 * RULE 1082. THE PRIORS, attributed precisely (amends rule 1068). What the
 * sources support: the structure — discrete fragments and debris clouds, a
 * break into pieces and a cloud (Register et al. §2.7; Wheeler et al. §2);
 * the strength's scaling S_c = S_p (m_p/m_c)^α with its ceiling of 330 MPa
 * (Register et al. §2.2); two-fragment splits as their best for Chelyabinsk's
 * lower flare (Wheeler et al. §4.1); and the values their fits took for single
 * events — clouds of 75–85 % and α of about 0.07 to 0.5 for Chelyabinsk,
 * splits near 60/40, clouds between 3 and 75 % as a consequence of Register et
 * al.'s split of radii. What Nimbus chooses, with no source behind it: that
 * each parameter is uniform on its interval; the interval's bounds; that f_c,
 * y and α are drawn independently of one another and held for every break of a
 * draw. The sources justify neither a uniform probability nor these bounds.
 *
 * RULE 1083. WHAT F CANNOT CLAIM, and the bound. With no lateral speed F
 * predicts no strewn field and no place of any recovery; with no ablation its
 * surviving masses carry no ablation's loss — F says neither where meteorites
 * fall nor what they weigh once ablated, and its O2 and O3 readings are
 * labelled so. A run past 10⁵ components is declared not completed: its
 * outputs are published with that mark and enter no comparison.
 */

/**
 * Rules 1085 to 1088 — F's specification made verifiable, on the reviewer's
 * reply of 24 September 2026: the structure is settled; the dust below the
 * floor, the budgets' quantities and tolerances, the immediate cascades and
 * the limit of the baseline are fixed here without ambiguity, before any code.
 * They change no result and tune nothing on any case.
 *
 * RULE 1085. THE DUST BELOW THE FLOOR (amends rules 1065 (d) and 1078). A piece
 * lighter than 1 g born at altitude z with speed v along direction u leaves
 * the components in flight at that instant and is never among them again. Its
 * mass is written to the dust's account at z. Its kinetic energy ½ m v² is laid
 * down in the air at z, in the energy profile's bin of z, and written as the
 * dust's energy E_dust, apart from the energy drag lays down, E_drag. Its
 * momentum m v u is given to the air at z as an impulse J_dust, written apart
 * from drag's impulse J_drag: the two are never confused.
 *
 * RULE 1086. THE BUDGETS' QUANTITIES AND TOLERANCES (amends rule 1078). With m0,
 * E0 and p0 the entry's mass, kinetic energy and momentum vector at the top of
 * the atmosphere:
 *   MASS — |m_flight + m_ground + m_dust − m0| ≤ 10⁻¹² m0;
 *   ENERGY — with W_g gravity's work on every component,
 *     |(E0 + W_g) − (E_drag + E_dust + E_ground + E_flight)| ≤ 10⁻¹² (E0 + |W_g|);
 *   MOMENTUM — a vector in the vertical plane of the entry, where every path
 *     lies (no lateral speed, rule 1065 (c)): with J_g gravity's impulse on every
 *     component, |p0 + J_g − J_drag − J_dust − (p_flight + p_ground)| ≤ 10⁻¹² |p0|,
 *     the norm Euclidean; where every path keeps the entry's angle it is that
 *     vector's projection on the path, and the same test.
 * The denominators are the entry's own values, never zero for a body that
 * enters; a run whose budget fails is void and is published as void.
 *
 * RULE 1087. CASCADES AND CONVERGENCE (amends rules 1079 and 1080).
 *   (a) The breaks at one altitude are resolved breadth-first: a child whose
 *       pressure already reaches its strength is replaced at once by its own
 *       children, at the same altitude, until none of them breaks there or it
 *       falls below the floor. The pieces' strengths grow and their masses
 *       shrink geometrically at each break, so a cascade ends.
 *   (b) The count of components is every fragment and cloud ever created in a
 *       draw; where it passes 10⁵ at any moment — within a cascade too — the
 *       draw stops and is declared not completed (rule 1083), its outputs
 *       entering no comparison.
 *   (c) Convergence is read on the same paired draws — the same drawn inputs
 *       and priors — the step or the floor alone changed, so that numerical
 *       change and Monte Carlo change never mix. A relative criterion reads
 *       |a − b| / |b|, b the finer run's value; where b is zero or absent (no
 *       break, no piece on the ground), the two runs converge only if a is zero
 *       or absent too. The survival share is judged absolutely, within 0.01.
 *
 * RULE 1088. THE LIMIT OF THE BASELINE, at the same event (amends rule 1081).
 * With f_c = 1, F and the baseline are compared on the same drawn inputs; the
 * main fragmentation is found by the very function the baseline uses, so that
 * the state that starts the pancake — its altitude, speed, angle and diameter
 * — is the same to the bit, and the identity of the pancake's code applies to
 * the identity of the event that starts it. The profiles are compared on the
 * same altitude bins. Continuous quantities within 10⁻⁹ relative; a value that
 * is zero in the baseline within its own absolute tolerance — 10⁻⁶ m for an
 * altitude, 10⁻⁹ E0 for an energy, 10⁻⁹ m0 for a mass; discrete ones — the
 * regime, the crater's state — equal. This checks the numbers against the
 * baseline's, which is a regression; it is no validation against what was
 * observed, which stays a separate step.
 */

/**
 * RULE 1090. THE CODE'S THREE CHECKS (the reviewer, 24 September 2026, who
 * authorizes F's code as a study of development only — no independent test, no
 * class B, no conclusion of observational compatibility):
 *   (a) CONTACT WITH THE GROUND. E_ground and p_ground are each piece's kinetic
 *       energy and momentum at the instant before it touches the ground — its
 *       speed there, after the terminal floor — and a swarm's likewise; no piece
 *       is kept on the ground at rest, so no energy or impulse of contact
 *       enters the budgets beyond them.
 *   (b) THE VECTOR BALANCE IS THE ONE THAT DECIDES. F's equations, as Collins
 *       et al.'s, keep every path on the entry's straight line at its angle
 *       (gravity enters only through the terminal floor, rule 1026, written as
 *       an impulse and a work along that line); the code keeps the momentum as
 *       a vector in the entry's vertical plane, and the vector test of rule
 *       1086 is the one applied — that it equals the projection is a property
 *       of these equations, checked, never assumed.
 *   (c) THE BOUND STOPS WHAT DOES NOT END. The count of components is checked
 *       at every creation, inside a cascade too: a cascade that does not
 *       resolve is stopped by the bound of 10⁵, and its draw is declared not
 *       completed (rule 1087 (b)).
 */

/**
 * RULE 1091. THE FLIGHT SOLVED EXACTLY, AND WHAT F REPORTS (amends rules 1066,
 * 1071 and 1080; written before the code, to be declared to the reviewer).
 *   (a) A fragment of F has no ablation, so its diameter stays what it was at
 *       birth; on the product's exponential atmosphere its drag equation,
 *       dv/dz = (3/4) C_D ρ(z) v / (ρ_i L sin θ), then has an exact solution —
 *       Collins et al.'s Eq. 8 started from the fragment's state:
 *       v(z) = v_b exp(−a (ρ(z) − ρ(z_b))), a = 3 C_D H / (4 ρ_i L sin θ).
 *       The code uses it in place of the Runge–Kutta integration of rule 1066,
 *       which S needed only because its core's diameter changed; a test checks
 *       the two agree to 10⁻⁹. A break is found where ρ v² first reaches the
 *       fragment's strength, by bisection on ρ to machine precision, as S found
 *       the whole body's crossing; past the maximum of ρ v² a fragment never
 *       breaks again.
 *   (b) With no step to halve, rule 1080's convergence is read on the energy
 *       profile's bin — 100 m, halved and doubled — and on the floor, 1 g
 *       against 0.1 g, with the same criteria.
 *   (c) What F reports: the release altitude, the centre of the profile's bin
 *       in which the air receives the most energy (the energy of drag, of the
 *       dust and of the clouds' bursts); the regime — INTACT where the body
 *       never breaks, COMPLETE_AIRBURST where nothing reaches the ground, and
 *       PARTIAL_AIRBURST where a fragment or a cloud's swarm does; the share of
 *       energy at the ground, E_ground / E0; and, beside them, the baseline's
 *       own burst altitude, today's m2.
 */

/** Rule 1091 (b): the energy profile's bin (m), and its halving and doubling. */
export const F_PROFILE_BIN_M = 100;

/** Rule 1065 (a): fragments per break, besides the cloud. */
export const F_FRAGMENTS_PER_BREAK = 2;

/** Rule 1065 (b): the ceiling of a fragment's strength (Pa). */
export const F_STRENGTH_CEILING_PA = 330e6;

/** Rule 1065 (d): the lightest fragment followed (kg), and its sensitivity. */
export const F_MASS_FLOOR_KG = 1e-3;
export const F_MASS_FLOOR_SENSITIVITY_KG = 1e-4;

/** Rule 1068: the priors, each uniform on its interval. */
export const F_PRIORS = {
  cloudShare: [0.05, 0.85],
  largerSplit: [0.5, 0.7],
  strengthScaling: [0.05, 0.6],
} as const;

/** Rules 1069 and 1070: the budgets' closure, and the limit of the baseline. */
export const F_BUDGET_TOLERANCE = 1e-12;
export const F_BASELINE_LIMIT_TOLERANCE = 1e-9;

/** Rule 1070 (d) and (e): convergence, and the bound on the components. */
export const F_CONVERGENCE = 0.01;
export const F_MAX_COMPONENTS = 100_000;
