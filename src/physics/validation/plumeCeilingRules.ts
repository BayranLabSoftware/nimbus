/**
 * Rules 593 to 604 — a physical ceiling for a volcanic plume,
 * 21 September 2026, written and pushed before the candidate was run.
 *
 * WHY. B-085 is open: `plumeHeight` is Mastin et al. (2009)'s
 * H = 2.00·V̇^0.241 and carries no upper bound at all. At the rate
 * `inputSchema.ts` itself calls "the largest known eruption (Tambora 1815)"
 * it returns 82.3 km, above the mesopause; at the top of the invariant
 * sweep's own sampler it returns 512.8 km, five hundred kilometres of
 * volcanic plume. The registry recorded the defect and, the same night,
 * ruled out the obvious repair: capping at the largest height inside the
 * relation's fitted box would cap a plume at about 36 km, BELOW Pinatubo
 * 1991's ≈ 40 km and Hunga Tonga's ≈ 57 km. Rule 163 undid exactly that
 * mistake for the impulse wave. The registry left the judgement open and
 * said what it had to be: "the ceiling for a plume has to be physical
 * rather than statistical — the atmosphere it rises through".
 *
 * RULE 593. WHAT THE CEILING IS. A plume rises because it is lighter than
 * the air around it. It expands as it rises, and expanding cools it. So
 * there is a level at which it is no longer lighter, and it cannot pass
 * that level however much of it there is. That level is a property of the
 * ATMOSPHERE and of the plume's own composition and temperature — not of
 * the eruption rate, and not of any dataset.
 *
 * RULE 594. THE FORM, fixed now.
 *
 *   A parcel leaving the vent at temperature T₀ and expanding adiabatically
 *   is, at ambient pressure P,
 *
 *       T_p(P) = T₀ · (P / P_vent)^κ,      κ = (γ − 1)/γ
 *
 *   and, at the same pressure, it is lighter than the air around it while
 *
 *       T_p / T_a  >  M_p / M_a
 *
 *   where M is molar mass. The ceiling is the height at which that becomes
 *   an equality. T_a(z) and P(z) are the US Standard Atmosphere 1976, whose
 *   seven layers are a definition rather than a measurement and are written
 *   out in `effects/standardAtmosphere.ts` from that definition.
 *
 * RULE 595. WHICH PARCEL. Every parameter is taken at the value that puts
 * the ceiling HIGHER, so that what comes out is a bound and not a fit:
 *
 *   - the plume is pure water vapour, M = 18.015 g/mol, the lightest a
 *     volcanic plume can be — CO₂ is 44 and SO₂ is 64, and a real column is
 *     mostly entrained air at 28.96 with ash in it, all heavier;
 *   - it is at 1 700 K, above any terrestrial magma: basalt erupts near
 *     1 400 K and rhyolite near 1 100 K;
 *   - it entrains nothing and radiates nothing, so it keeps every joule it
 *     left the vent with.
 *
 * RULE 596. NO OVERSHOOT TERM, AND WHY. A real plume arrives at its neutral
 * level moving and overshoots it, by tens of per cent. That is not added
 * here, because the parcel of rule 595 is not a plume: a real column rises
 * by entraining air and heating it, which is the very thing rule 595 forbids
 * in order to keep the heat. The zero-entrainment limit overstates the rise
 * by far more than an overshoot adds — the margin between what it gives and
 * the highest plume ever measured is the evidence, and rule 600 requires it
 * to be wide.
 *
 * RULE 597. WHAT THE NUMBER MUST CLEAR, fixed before it is computed.
 * The ceiling is refused unless it lies ABOVE every plume the world has
 * recorded: Hunga Tonga–Hunga Haʻapai, January 2022, ≈ 57 km, the highest
 * ever measured; Pinatubo 1991, ≈ 40 km; Krakatoa 1883 and Tambora 1815,
 * ≈ 40 and ≈ 43 km as reconstructed. A ceiling that cuts any of those is
 * the mistake rule 163 undid and this round will not make it.
 *
 * RULE 598. WHAT IT MUST ALSO DO, or it is not worth having: it must cut
 * the two readings B-085 was registered on — 82.3 km at 5×10⁶ m³/s and
 * 512.8 km at 9.9×10⁹ — and it must leave the relation untouched over the
 * range it was fitted in, which its own paper's Table 1 puts at 2.4 to
 * 1.6×10⁵ m³/s DRE.
 *
 * RULE 599. THE FORM IN THE CODE IS A MINIMUM, not a rewrite:
 * `min(Mastin, ceiling)`. Above the crossing the relation is not used,
 * because it is a fit and it is outside its box; below it nothing changes.
 * The crossing is a consequence and is not chosen: it falls where it falls.
 *
 * RULE 600. WHAT REFUSES THE CANDIDATE. Any one of these, and it is
 * published as a refusal:
 *
 *   (a) the ceiling comes out below 60 km above vent, which would put it
 *       within 5 % of Hunga Tonga and leave no margin for rule 596's
 *       missing overshoot;
 *   (b) any validation row, preset or recorded event moves;
 *   (c) any golden-dataset figure moves;
 *   (d) the suite goes red anywhere outside the plume's own tests.
 *
 * RULE 601. THE CEILING IS ON THE HEIGHT ABOVE THE VENT, which is what
 * `plumeHeight` returns. That the bound is nearly the same whether the vent
 * is at sea level or at 7 km — 71.9 against 72.0 km — is a property of the
 * atmosphere and is measured, not assumed.
 *
 * RULE 602. WHAT THIS DOES NOT FIX, said in advance so that it is not
 * claimed later. The ceiling removes an impossibility. It does not make the
 * relation right near the top of its range, and one reading says it is not:
 * `inputSchema.ts` puts Tambora 1815 at ~5×10⁶ m³/s, and `plumeHeight.ts`'s
 * own note puts Krakatoa-class at 2×10⁵ m³/s and 38 km. Taken together the
 * product says Tambora's plume was more than twice Krakatoa's, where the
 * record has them within a few kilometres of each other. One of the two
 * numbers is wrong and this round does not have a source in hand to say
 * which, so it says neither.
 *
 * RULE 603. NO RE-TUNING. The constants of rule 595 are fixed above. If the
 * ceiling they give is refused by rule 600 it is published as refused, and
 * the constants are not moved to make it pass.
 *
 * RULE 604. ONE RUN, and the answer is published whatever it is.
 */

/** Rule 595: the lightest plume, in kg/mol. */
export const CEILING_PLUME_MOLAR_MASS = 0.018015;

/** Dry air, kg/mol (US Standard Atmosphere 1976). */
export const AIR_MOLAR_MASS = 0.0289644;

/** Rule 595: above any terrestrial magma, in K. */
export const CEILING_VENT_TEMPERATURE_K = 1_700;

/** Rule 594: (γ − 1)/γ for water vapour, γ = 1.33. */
export const CEILING_ADIABATIC_EXPONENT = 0.248;

/** Rule 597: the plumes the ceiling may not cut, in metres above vent. */
export const RECORDED_PLUME_TOPS = {
  hungaTonga2022: 57_000,
  tambora1815: 43_000,
  krakatoa1883: 40_000,
  pinatubo1991: 40_000,
} as const;

/** Rule 600(a): below this the candidate is refused, in metres. */
export const CEILING_REFUSAL_FLOOR = 60_000;

export const PLUME_CEILING_RULES = 'rules 593 to 604, fixed 21 September 2026';
