/**
 * Where a pyroclastic current stops, and the published law this project did not
 * have.
 *
 * V1 for flows is the oldest naked relation in Nimbus. `pyroclasticRunout.ts`
 * publishes `L_km = K · V_km³^(1/3)` with "K = 10 … a project value", and
 * `extendedEffects.ts` publishes an energy line at a fixed slope, "H/L ≈ 0.1 for
 * dense flows". Both say in their own comments what they are: a volume scaling
 * nobody published, and a mobility that does not move with the size of the flow.
 * The gold standard's V1 names what the field uses instead — "the energy cone,
 * H/L from a calibration (Aravena et al. 2022)" — and the round of 18 September
 * left V4 open for exactly this reason: the energy cone takes an H/L and Nimbus
 * has none.
 *
 * On 19 September 2026 the two papers were read. Aravena et al. (2022), Bull.
 * Volcanol. 84: 29 — whose calibration strategies ECMapProb implements — turns
 * out not to publish a volume-to-H/L law at all: it publishes *procedures* for
 * calibrating one against a reference deposit or a runout distribution, and it
 * says two things that matter here. First, that "the statistical correlation
 * between flow volume and tan(φ) was further investigated and quantified in
 * Spiller et al. (2014) and Ogburn et al. (2016)" — so the law is in those, not
 * in it. Second, that three-dimensional multiphase simulations show "column
 * collapse height is virtually irrelevant in the determination of the flow
 * runout", so the energy cone's H_c "has to be considered as a model parameter
 * for which a numerical calibration becomes necessary" and not as a height.
 *
 * The law, then, is **Ogburn, S., Berger, J., Calder, E., Lopes, D., Patra, A.,
 * Pitman, E., Rutarindwa, R., Spiller, E. & Wolpert, R. (2016), "Pooling
 * strength amongst limited datasets using hierarchical Bayesian analysis, with
 * application to pyroclastic density current mobility metrics", Statistics in
 * Volcanology 2: 1–26, doi:10.5038/2163-338X.2.1** — diamond open access, read
 * from the journal's own copy. Its model is
 *
 *     log10(H/L) = α + β · log10(V / 10^5.5)
 *
 * and its Table 1 fits it at five volcanoes on dome-collapse block-and-ash
 * flows from the FlowDat database:
 *
 *     Colima            β −0.224   α −0.386   MSR 66.5 × 10⁻⁴   unchannelized
 *     Merapi            β −0.183   α −0.384   MSR 95.2 × 10⁻⁴   unchannelized
 *     Soufrière Hills   β −0.201   α −0.531   MSR 24.8 × 10⁻⁴   channelized
 *     Unzen             β −0.156   α −0.493   MSR 26.3 × 10⁻⁴   channelized
 *     Semeru            β −0.314   α −0.172   MSR 24.3 × 10⁻⁴   channelized
 *
 * The hierarchical posterior that pools them is reported graphically only
 * (Figures 2 to 4), with no table of hyper-mean slope and intercept, so a model
 * that does not know which volcano it is standing on has to take a central pair
 * and carry the spread of the five as its band.
 *
 * The rules, fixed on 19 September 2026 and numbered after the two hundred and
 * nineteen before them, written before any number of ours is compared with
 * anything:
 *
 *  220. **What was read, and what it cost.** The two papers above, and nothing
 *       of this project's. Transcribing a published table spends no set. The
 *       transcription lives in `effects/pdcMobility.ts` and the rules name it
 *       rather than holding a second copy — the correction rule 198 needed and
 *       rule 203 made.
 *
 *  221. **The candidate (`pdcMobility`).** One reach, from the energy line at
 *       the published mobility:
 *
 *           H/L(V) = 10^(α + β · log10(V / 10^5.5)),   L = H_drop / (H/L)
 *
 *       with α and β the median of Table 1's five pairs. Exactly one thing
 *       changes: the mobility stops being a constant. The drop height stays
 *       what the project already computes — a fraction of the plume top, the
 *       `PDC_COLLAPSE_HEIGHT_FRACTION` of `extendedEffects.ts` — untouched by
 *       this round, because a round that moves two things measures neither.
 *       `pyroclasticRunout`'s `K · V^(1/3)`, which no paper publishes, goes if
 *       the candidate is adopted.
 *
 *  222. **What decides, and what cannot.** The bar is the field's tool on the
 *       same inputs, as the amendment of 16 September requires and as V1 for
 *       flows already words it: **ECMapProb** (Aravena et al. 2020, 2022), run
 *       offline on its own topography with the H/L this law prescribes and the
 *       collapse height Nimbus computes, its maximum reach against ours.
 *       Adopted when, over a spread of volumes covering the project's presets,
 *       ours is within **a factor of 1.5** of the tool's maximum reach at the
 *       same H/L, and the suite and the release gate hold.
 *
 *       What cannot decide it, and why, said before the numbers: **no
 *       observational set.** Of the three eruptions whose pyroclastic reach this
 *       project already quotes, Vesuvius 79 CE is disqualified by its own
 *       comment — its erupted volume was "lowered to … 2.5e9 to bring PDC reach
 *       into the literature band 6–14 km", so the input was tuned on the output
 *       — and Mount St Helens 1980's eruption rate was tuned to its observed
 *       plume, which sets the collapse height and so the reach. That leaves
 *       Unzen 1991, one event. Fuego 2018 is a held-out anchor and reading it
 *       for a model choice would spend it. So the observed reaches are printed
 *       beside this round and decide nothing, and whether a set is spent on this
 *       relation is a decision about the shape of the 9, not a step of a round.
 *
 *  223. **What is measured.** H/L and the reach at every volcano preset the
 *       project carries, under the law and under the two relations in place; the
 *       ratio between them; and ECMapProb's maximum reach at the same H/L.
 *
 *  224. **The band.** The spread of Table 1's five fitted lines at a given
 *       volume, in log10, together with the within-volcano mean square
 *       residuals. That is the published relation's own scatter: **in sample for
 *       the paper and out of sample for us**, which is more than the factor of
 *       two `uq/conventions.ts` asserts today for this quantity and less than a
 *       band scored on a held-out set. G3 asks for the second and this is not
 *       it, and the report must say so where it prints it.
 *
 *  225. **What an adoption does.** `pyroclasticRunout`'s K goes; the page and
 *       the globe print one reach with Ogburn et al. (2016)'s citation and the
 *       band beside it; the declared gap that reads "the reach of pyroclastic
 *       currents (L = 10 · V^⅓, a project mobility)" is replaced by the
 *       extrapolation warning of rule 226; and V1 for flows is read against
 *       ECMapProb rather than against nothing.
 *
 *  226. **What these rules cannot settle.** Three things, and the first is
 *       large. The law is fitted on **dome-collapse block-and-ash flows**, whose
 *       own x-origin is 10^5.5 m³ — three hundred thousand cubic metres — and
 *       the project's presets run to 1.4 × 10^11 for Tambora: five and a half
 *       orders of magnitude past the data, into a different kind of current.
 *       Extrapolating it is not the same as having a law for these eruptions, and
 *       the adoption of a published relation does not make the extrapolation
 *       published. Second, where the current goes is still not computed: that is
 *       a DEM and a drainage network, which is what the energy cone and PFZ are
 *       and what this project has not written. Third, the drop height remains a
 *       fraction of a plume top, which Aravena et al. say is a model parameter
 *       and not a height; this round does not touch it, and V4 is not closed by
 *       it.
 */

/*
 * ===========================================================================
 * The outcome of rules 220 to 226, 19 September 2026: NOT ADOPTED
 * ===========================================================================
 *
 * The law is right, correctly transcribed, and **not a law about the number
 * Nimbus has**. That is the whole result, and it was found by rule 226's own
 * arithmetic before rule 222's reference was ever run.
 *
 * Ogburn et al.'s V is the volume of **one current**: their Table 3 defines it
 * as "volume of PDC", their data are 14 to 80 individual dome-collapse flows per
 * volcano, and their volume axis is centred at 3 × 10^5 m³. Nimbus's input is
 * the volume of an **eruption**. Feeding the second into a law fitted on the
 * first is a category error of between one and two and a half orders of
 * magnitude, and the measurement says exactly how much (`scripts/benchmark/
 * pdc-mobility.ts`, `benchmark/results/pdc-mobility-2026-09-19.json`):
 *
 *   event                erupted     the law needs   ratio   observed reach
 *   Unzen 1991           2.0 × 10⁷    2.7 × 10⁵      × 74     3.2 km
 *   Mount St Helens 1980 1.2 × 10⁹    5.5 × 10⁶      × 218    8 km
 *   Vesuvius 79 CE       2.5 × 10⁹    6.2 × 10⁷      × 40     9 km (Pompeii)
 *   Fuego 2018           4.9 × 10⁷    8.2 × 10⁶      × 6      11.7 km
 *
 * "The law needs" is the flow volume at which the pooled fit returns the
 * mobility the event actually had, H/L = relief / reach. The Unzen row is the
 * one that settles it: 2.7 × 10^5 m³ is within a fifth of the paper's own
 * x-origin — that is, for the one event of the four that *is* a dome-collapse
 * block-and-ash flow, the law asks for a single-flow volume and gets one. The
 * relation is not wrong; the input is the wrong quantity.
 *
 * So the candidate of rule 221 is **not adopted** and nothing in the product
 * moves. `pyroclasticRunout`'s K = 10 stays, unpublished, and V1 for flows stays
 * not met. What has changed is that the gap is now named precisely: what is
 * missing is not a mobility law — that exists, is open access, and is
 * transcribed in `effects/pdcMobility.ts` with its band — but **a per-current
 * volume**, or a mobility law fitted on eruption-scale currents. Neither is in
 * hand, and no amount of reading H/L papers will produce one.
 *
 * Two things measured on the way, which rule 223 asked for and which decide
 * nothing by rule 222's own words.
 *
 * The relation the project already has is the better of the three at the four
 * events it quotes. `K · V^(1/3)` gives 2.7, 10.6, 13.6 and 3.7 km against 3.2,
 * 8.0, 9.0 and 11.7 observed — ratios 0.84, 1.33, 1.51 and 0.32, a geometric
 * mean of 0.86. That is not a validation: two of the four events are
 * disqualified by their own presets (Vesuvius's volume was lowered to bring the
 * reach into the observed band, Mount St Helens's rate was tuned to the observed
 * plume) and Fuego is a held-out anchor. It is, however, enough to say that
 * replacing it with an extrapolated per-flow law would have made the product
 * worse while giving it a citation, which is the worst trade this project can
 * make.
 *
 * And the energy line the page prints is an order of magnitude over. With the
 * drop height the project computes — a quarter of the Mastin plume top — it
 * reads **64.3 km at Mount St Helens and 88.4 km at Vesuvius**, against 8 and 9
 * km observed; with the published mobility in place of its fixed 0.1 it reads
 * 81.9 and 130.6. The cause is the drop: a Heim coefficient is measured over the
 * edifice's own relief, one to two kilometres, and a quarter of a Plinian plume
 * is five to nine. The round of 18 September relabelled that row as "an
 * order-of-magnitude upper bound", which these numbers say is generous rather
 * than cautious. Fixing it means moving the drop height, which rule 221
 * forbids this round from touching, so it is declared here and left for a round
 * of its own.
 */

export {
  OGBURN_2016_MOBILITY,
  OGBURN_X_ORIGIN_M3,
  pdcMobilityHoverL,
  pdcMobilityBandLn,
  pdcReachFromEnergyLine,
} from '../effects/pdcMobility.js';

/** Rule 222. Ours against the field's tool at the same mobility. */
export const PDC_REACH_TOLERANCE = 1.5;
