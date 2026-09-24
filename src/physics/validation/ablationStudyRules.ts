/**
 * RULE 1128. AFTER THE THIRD SET (the reviewer, 24 September 2026, closing the
 * round). The round is closed with its verdict: S not adoptable under version
 * 2; nothing adopted; no class B. A byte-for-byte reproduction of the run is
 * not a condition of the rule «one run»; if ever made, it is a technical
 * check, so labelled, with no power of decision. From now on:
 *   (a) the third set has been read: its six bodies guide development and
 *       diagnostics, as development cases, and never again judge an adoption —
 *       no variant retouched on them is adopted on them (rule 937);
 *   (b) the order of what follows: first the ablation of the fragments, with
 *       its budgets of mass and its convergence (rules 1129 to 1136) — the
 *       limit that keeps O2 from being read and may change the survival that
 *       is S's main gain; then, in a study of its own, the release altitude of
 *       strong bodies, O1 being unfavourable on Hamburg for both models; and
 *       beside them the search for a future admissible ground case, reserved
 *       for a new independent test whose eligibility and targets are frozen
 *       before it is used to choose any law;
 *   (c) the reviewer did not verify GitHub's arrival times himself: they stay
 *       a record of Nimbus, not a certified chronology.
 */

/**
 * Rules 1129 to 1136 — the study of the fragments' ablation («A»), specified
 * before any code. Andrea's word: the rule and this specification, then the
 * text; no code before the reviewer reads it. Sources, read for F with
 * Andrea's leave (NTRS 20180002835 and 20180003387):
 *   (a) Wheeler, Mathias, Stokan et al. (2018), «Atmospheric energy deposition
 *       modeling and inference for varied meteoroid structures», Icarus / NTRS
 *       20180002835: the fragment-cloud model's flight, dm/dt = −½ ρ v³ A σ
 *       (Fig. 1); σ = 1 × 10⁻⁸ kg/J as the baseline adopted from Hills & Goda
 *       (1993); 4–8 × 10⁻⁹ kg/J in the best fits of Chelyabinsk; 5 × 10⁻⁹ to
 *       3.5 × 10⁻⁷ kg/J from the dynamics of Chelyabinsk's fragments
 *       (Borovička et al. 2013b, as it quotes them); 1.6 × 10⁻⁸ kg/J in Popova
 *       et al. (2013); 1–5.5 × 10⁻⁹ kg/J from aerothermodynamic simulations
 *       (Johnston et al. 2018); 5 × 10⁻⁹ kg/J («0.005 s² km⁻²») for Košice,
 *       over 1 × 10⁻⁹ to 1.5 × 10⁻⁸ kg/J (Borovička et al. 2013a);
 *   (b) Register, Mathias & Wheeler (2017), «Asteroid fragmentation approaches
 *       for modeling atmospheric energy deposition», NTRS 20180003387: the same law
 *       (their Eq. 3), mass lost «until the cloud fully ablates»; a fragment's
 *       area following its mass at constant density and spherical shape.
 *
 * RULE 1129. WHAT A IS. F (rules 1063 to 1097), with one change: every
 * fragment loses mass by ablation along its flight, from its birth to the
 * ground, to its terminal speed or to the floor. The whole body before its
 * first break does not ablate, and the clouds do not ablate: so the main break
 * stays the baseline's event (rule 1088) and the clouds the baseline's
 * pancake. Both are declared as limits, not physics claimed. A is a study of
 * development: no class B, no adoption, its outcome in words fixed before it
 * runs (rule 1136).
 *
 * RULE 1130. THE LAW. The classic single-body law, dm/dv = σ m v, so that a
 * fragment born with mass m_b at speed v_b carries m(v) = m_b exp(σ (v² −
 * v_b²) / 2): the form in which the fireball studies quoted in rule 1129 fit
 * their σ, which Wheeler et al. compare with kg/J one to one (their «5 × 10⁻⁹
 * kg/J (0.005 s² km⁻²)»). Its diameter follows its mass at the body's density,
 * a sphere; its drag is Collins et al.'s on that diameter, on the product's
 * exponential atmosphere; its strength stays the one it was born with (rule
 * 1065 (b)). The speed along the altitude then solves dv/dz = (3/4) C_D ρ(z) v
 * / (ρ_i L(v) sin θ) with L(v) = L_b exp(σ (v² − v_b²) / 6) — the α–β
 * problem, solved by its exponential integral or by Runge–Kutta, the code
 * choosing one and checking it against the other to 10⁻⁹ (rule 1134 (b)). A
 * break is found where ρ v² first reaches the fragment's strength, as rule
 * 1091 (a) finds it.
 *
 * RULE 1131. THE PRIOR OF σ, drawn once per draw beside F's three, uniform in
 * log10 between 1 × 10⁻⁹ and 1.6 × 10⁻⁸ s²/m² — from the aerothermodynamic
 * lower end to Popova et al.'s value, the Hills & Goda baseline, Chelyabinsk's
 * and Košice's fits inside it. Borovička et al. (2013b)'s upper 3.5 × 10⁻⁷,
 * from Chelyabinsk's small fragments, is run apart as a sensitivity, never
 * mixed in. What the sources support: the law, and the values their fits took
 * for single events. What Nimbus chooses with no source behind it: a
 * log-uniform law, its bounds, one σ for every fragment of a draw, and σ drawn
 * independently of F's priors. Chelyabinsk and Košice fed the interval: A's
 * results on Chelyabinsk are not independent of it, and are labelled so.
 *
 * RULE 1132. WHERE THE ABLATED MASS GOES. The mass a fragment loses between
 * two altitudes leaves it as vapour in the air there: its mass is written to
 * the vapour's account in that bin, its kinetic energy ½ Δm v² to the air in
 * that bin as E_vapour, its momentum Δm v u to the air as J_vapour, apart from
 * drag's E_drag and J_drag. A fragment whose mass falls below the floor (rule
 * 1065 (d)) in flight becomes dust there (rule 1085), its remaining kinetic
 * energy and momentum given to the air at that altitude.
 *
 * RULE 1133. THE BUDGETS (amend rules 1078 and 1086). MASS — fragments, clouds,
 * the ground, dust and vapour sum to the body's mass; ENERGY — E0 + W_g =
 * E_drag + E_dust + E_vapour + E_ground + E_flight; MOMENTUM — the vector
 * p0 + J_g − J_drag − J_dust − J_vapour − (p_flight + p_ground); each to 10⁻¹²
 * of the entry's value, or the draw is void.
 *
 * RULE 1134. THE VERIFICATION, before any case, on the 180 bodies of rules
 * 1070 and 1092 and on constructed cases:
 *   (a) σ = 0: A is F to the bit, every output;
 *   (b) a single fragment's speed against Runge–Kutta at a halved step, and its
 *       mass against m_b exp(σ (v² − v_b²) / 2), each to 10⁻⁹;
 *   (c) the budgets of rule 1133 on every draw;
 *   (d) convergence: the profile's bin halved and doubled, the floor at 0.1 g,
 *       moving the release altitude, the median largest piece and the share of
 *       draws with a piece on the ground by less than 1 %, 1 % and 0.01, on the
 *       same draws (rule 1087 (c)); a quantity that does not converge is said,
 *       and not published as a result; the floor «not exercised» where it acts
 *       on no draw (rule 1095);
 *   (e) the bound of 10⁵ components, the draws not completed counted;
 *   (f) a constructed case where ablation brings a fragment below the floor in
 *       flight, its mass, energy and momentum followed into dust.
 *
 * RULE 1135. THE RUN OF DEVELOPMENT, after the verification and the reviewer's
 * leave: the development cases of rule 961 and the third set's six bodies
 * (rule 1128 (a)), on their frozen draws, beside the baseline, S and F; A
 * with σ from its prior, and apart with σ = 3.5 × 10⁻⁷ s²/m². Published: the
 * ground's classes and D1, J and D3 as descriptions; the largest piece's mass
 * and speed; the surviving mass; the ablated share of the mass; the release
 * altitude by rule 1094's route (c), no aggregate comparable; and, for the
 * third set's bodies, the largest piece beside the recovered mass — a lower
 * bound, so a diagnostic of the comparison's limit (rule 1127 (b)), never a
 * verdict of accuracy.
 *
 * RULE 1136. THE OUTCOME, in words fixed now: «Studio A: l'ablazione dei
 * frammenti di F mostra quanto la massa che arriva al suolo, la sopravvivenza e
 * il regime d'arrivo dipendono dalla perdita di massa in volo, nel dominio delle
 * condriti ordinarie. Non viene adottata e non riceve una classe B; ogni
 * adozione richiede un nuovo test indipendente, con un caso al suolo ammissibile
 * congelato prima.»
 */

/** Rule 1131: σ's prior, log-uniform (s²/m²), and its sensitivity apart. */
export const A_SIGMA_PRIOR_S2_M2 = [1e-9, 1.6e-8] as const;
export const A_SIGMA_SENSITIVITY_S2_M2 = 3.5e-7;

/** Rule 1131: Hills & Goda's baseline σ, inside the prior (s²/m²). */
export const A_SIGMA_BASELINE_S2_M2 = 1e-8;

/** Rules 1133 and 1134: the budgets and the checks. */
export const A_BUDGET_TOLERANCE = 1e-12;
export const A_CHECK_TOLERANCE = 1e-9;

/** Rule 1130: a fragment's mass at speed v, from its birth (m_b, v_b). */
export function ablatedMass(mb: number, vb: number, v: number, sigma: number): number {
  return mb * Math.exp((sigma * (v * v - vb * vb)) / 2);
}
