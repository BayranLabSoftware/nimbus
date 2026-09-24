/**
 * Rules 1028 to 1036 — the cartographic grammar of the impact map, the design
 * the reviewer asked for on 23 September 2026, night, before any map is
 * changed; Andrea's word: «Sì, design, suite e test prima», and the state
 * labels on the globe itself («Sul globo, come chiede il revisore»). A
 * readable version: docs/MAP_GRAMMAR.md.
 *
 * RULE 1028. WHAT THIS IS. Today the globe confuses a computed zero, a value
 * below the drawn thresholds, a model's own limit and what is not modelled or
 * out of its domain: a limit of the computation can read as a physical edge —
 * Chicxulub's flash stopping at the fireball's horizon, 1 616 km, with its
 * four thresholds packed within 12 km of it; its ejecta ending at the 1 mm
 * isopach, 8 556 km, where the K–Pg layer is global; Chelyabinsk drawing
 * nothing, its 1.6 kPa below the lowest drawn 3.45 kPa; Tunguska drawing no
 * heat, its second- and third-degree reaches shorter than its burst altitude.
 * One grammar, for every impact layer and every scenario. The physics does not
 * move: this is how it is drawn and said.
 *
 * RULE 1029. THE PROVENANCE CARD. Every drawn object — a layer's field, each
 * isoline, each limit line, each not-modelled area — carries a card with five
 * fixed fields, opened from the legend and printed in the report:
 *   (1) the quantity and its unit;
 *   (2) the epistemic state — A (implementation verified), exploratory,
 *       diagnostic, or out of domain;
 *   (3) the source and the model — the equation, the reference, the essential
 *       assumptions;
 *   (4) the extent drawn — the numerical interval actually painted;
 *   (5) the meaning beyond its edge — a computed zero, below the display
 *       threshold, not modelled, or not applicable.
 *
 * RULE 1030. FOUR VISUAL STATES, one drawing each, the same on every layer:
 *   (1) computed — a value inside the model's domain: the continuous fill and
 *       solid isolines, as today;
 *   (2) below the display threshold — the model gives a value, non-zero, under
 *       the lowest isoline chosen: a very faint shading beyond the last
 *       isoline, out to where the value falls to a tenth of that isoline's (one
 *       decade) or to the model's limit, whichever comes first, labelled on the
 *       globe "continua sotto soglia";
 *   (3) a limit of the model — the computation stops by an internal condition
 *       (the fireball's direct horizon, the antipode): a thick dash-dot line of
 *       a neutral colour, labelled on the globe "limite del modello", never an
 *       isoline of damage;
 *   (4) not modelled or out of domain — the model gives no physically
 *       applicable value: a diagonal hatch or a semi-transparent grey, never
 *       the colour of zero, labelled on the globe by what is not modelled.
 * A computed zero draws nothing and the legend says "zero calculated". A
 * shading is kept for state 2 alone: there the model goes on giving values;
 * hatching is kept for what is truly not computed. On the globe only these
 * state labels are written; the quantity, threshold, unit and reach of each
 * isoline stay in the legend (Andrea, 21 September 2026).
 *
 * RULE 1031. LAYER BY LAYER.
 *   (a) Heat. The flash's direct horizon is a state-3 line where it cuts the
 *       field. Thresholds merged at it (rule B-119's merge, lines within 0.5 %)
 *       become one callout, "soglie 5–20 cal/cm² compresse presso il limite
 *       geometrico". Beyond the horizon, a state-4 area: "radiazione diretta
 *       non calcolata oltre l'orizzonte; questo non implica assenza di
 *       riscaldamento". A row in the legend: "Rientro globale degli ejecta e
 *       riscaldamento atmosferico: non modellati in questo layer". No shading
 *       is drawn beyond the horizon: that would be a prediction made up.
 *   (b) Ejecta. The fill to the 1 mm isopach, then a band fading out,
 *       "deposito < 1 mm oppure non risolto dalla scala corrente" — never
 *       "continues"; the legend states the cut, "Mappa visualizzata: spessore
 *       ≥ 1 mm". A logarithmic view below 1 mm, labelled exploratory, may come
 *       later and is not part of this round.
 *   (c) Low overpressure. A layer of its own, "Sovrapressione bassa — danno a
 *       vetri (esplorativo)", isolines at 1 and 3 kPa, a palette of its own,
 *       its legend saying: "Le soglie storiche di danno grave iniziano a
 *       0,5 psi / 3,45 kPa"; "Questo layer mostra pressioni inferiori per
 *       interpretare rottura vetri e danno leggero"; "Il modello non è
 *       validato su Chelyabinsk come previsione del campo; confronto
 *       osservativo disponibile". It enters neither the structural scale nor
 *       the casualties.
 *   (d) Below the main threshold (Tunguska's heat). A layer whose every drawn
 *       threshold is zero while the model gives a smaller effect is not hidden:
 *       its tab stays, with a faint halo labelled "sotto la soglia principale".
 *       For heat the legend says what the model computes (for Tunguska: the
 *       fluence of a first-degree burn to 12 km, and no second or third degree
 *       nor ignition) and, apart, what was observed ("Foresta bruciacchiata
 *       osservata vicino all'epicentro; il meccanismo e la distribuzione non
 *       sono validati da questo layer").
 *   (e) Out of the crater's domain. Every ring concentric about the effective
 *       source, never an oblique crater's envelope; a light hatch on every ring
 *       drawn from the residual energy at the ground; a fixed label on the
 *       globe, "Effetti esplorativi: accoppiamento al suolo non modellato"; no
 *       seismic stage, no magnitude, no liquefaction, no climate tier ("non
 *       valutabile"); the casualties shown as "non valutabile", with no number.
 *   (f) The timeline. A complete airburst's ground effect is "onda atmosferica
 *       al suolo", never "shock al suolo"; "Rilascio di onde sismiche" appears
 *       only where the model computes a coupling to the ground inside its
 *       domain. B-128 — the out-of-domain crater's stage printing its raw keys —
 *       is mended first, with its test.
 *   (g) Every other layer (wind, shaking, uncertainty, tsunami) is read through
 *       the same four states, and its edges given their meaning, in step 1.
 *
 * RULE 1032. THE TESTS, automatic, written with step 1 and kept: (a) every
 * layer and every drawn object carries exactly one of the four states and a
 * card with its five fields filled; (b) every edge of a field says what lies
 * beyond it; (c) a layer that draws nothing shows, without ambiguity, "zero",
 * "below the threshold" or "not modelled" — its tab is never simply missing;
 * (d) changing a display threshold changes no physical number (the result of
 * the simulation is the same to the bit); (e) out of the crater's domain no
 * effect of a crater comes back (rim, ejecta, magnitude, liquefaction, climate
 * tier, casualty number).
 *
 * RULE 1033. THE VISUAL SUITE, fixed cases: Chicxulub, Chelyabinsk and
 * Tunguska at their presets, and a body out of the crater's domain (a stone of
 * 0.5 m at 14 km/s and 22.5° over land) — every layer photographed headless,
 * before the change and after each step (scripts/globe-visual-suite.ts), the
 * photographs kept out of the repository and sent to the reviewer; an
 * end-to-end test reads each layer's state and card from the page.
 *
 * RULE 1034. THE ORDER. (0) this design and the suite's photographs before;
 * (1) the vocabulary — states, cards, edges — in the layer model and the
 * legend, the tests of rule 1032, and B-128; (2) the drawing of states 2, 3
 * and 4 on the globe (dash-dot line, faint shading, hatch or grey, the state
 * labels); (3) heat; (4) ejecta; (5) low overpressure; (6) below the main
 * threshold; (7) out of the crater's domain and the timeline. Each step
 * photographed before and after, the seal re-taken with each moving scenario
 * listed.
 *
 * RULE 1035. WHAT MAY NOT HAPPEN. No physical number moves — the seal's
 * numbers digest stays the same for every scenario through every step; what
 * moves is the drawing and the words. No value is drawn that the model does not
 * give. No decorative element reads as a physical claim.
 *
 * RULE 1036. WHAT IS NOT IN THIS ROUND: economic damage (Nimbus computes none);
 * the logarithmic ejecta view; any change of the physics behind a layer
 * (Tunguska's heat is a question of physics, for a round of its own).
 *
 * RULE 1037. THE PRINTED REPORT, NOW. The reviewer, approving steps 1 to 3 on
 * 23 September 2026, night, set this before step 4 (Andrea's order: the
 * report, then steps 4 to 7, then the independent test's charter, then F):
 * the globe and the PDF are one scientific product, and a reader offline must
 * not get the reading the grammar corrects. A pass of presentation alone:
 *   (a) the report's flat maps draw the four states, the edges and the labels
 *       the globe draws — the band below the threshold as a neutral veil
 *       (grey on paper, where white does not show), the limit of the model as
 *       a dash-dot line, the area not computed as a grey hatch, thresholds at a
 *       limit as one callout, the state labels in italics;
 *   (b) the report prints, for every layer it draws, its provenance card
 *       (rule 1029) and the card of each object drawn past its edge, and lists
 *       the layers it does not draw with their reason (rule 1032 (c));
 *   (c) the report carries the fixed note «La resa cartografica non estende il
 *       dominio fisico del modello.» («The map's rendering does not extend the
 *       model's physical domain.»);
 *   (d) photographs before and after; the seal re-taken, its numbers the same.
 * A layer's notes say only what holds for every scenario: what is drawn past
 * an edge is said by its own key and card, where it is drawn. From here on
 * every step of rule 1034 changes the globe and the report together.
 *
 * RULE 1048. STEP 7, COMPLETED. The reviewer, approving the direction on 24
 * September 2026, did not close step 7: the report of Chelyabinsk still says
 * «magnitudo sismica 4,0» while the timeline said the model computes no seismic
 * coupling. Andrea's word: correct what is wrong, and ask the reviewer about
 * the airburst's magnitude before changing it.
 *   (a) Every place a seismic result appears — the report's first box and its
 *       rows, the panel, the legend, the timeline, the Monte Carlo table — is
 *       checked. Where the model computes no magnitude (out of the crater's
 *       domain) each says «non calcolata», never a dash or a silence; so do
 *       the magnitude's range and the liquefaction there; and the Monte Carlo
 *       rows of the magnitude and the liquefaction say their share of draws
 *       out of the domain, as the crater's rows do.
 *   (b) An airburst's magnitude from the wave in the air (rules 730 to 738,
 *       exploratory) exists, and the timeline's words for its ground denied it:
 *       they are corrected to say it is an exploratory estimate. Whether it
 *       becomes «non calcolata» is asked of the reviewer, told that it exists;
 *       until he answers, the number does not move.
 *   (c) The out-of-domain words are the reviewer's: «Geometria e sorgente degli
 *       effetti esplorative; deposizione lungo traiettoria ridotta a sorgente
 *       puntiforme, accoppiamento al suolo non modellato» — not every ring
 *       ascribed to the coupling to the ground, a term that for the test stone
 *       is 5·10⁻⁵ of the energy.
 *   (d) The low overpressure stays selectable wherever the ground reaches
 *       1 kPa. Where its field reaches beyond 2 000 km — about a third of a
 *       radian of the Earth, where a flat point-source law calibrated on
 *       explosions of far smaller scale has no footing — its evidence box says
 *       so above everything: an extrapolation to a planetary scale, no
 *       prediction of broken glass, in no count of damage.
 *   (e) The observed note names its event, on the globe and in the report.
 *
 * RULE 1056. STEP 7, CLOSED ON ITS PRESENTATION. The reviewer, 24 September
 * 2026, withdrew his request that the airburst's magnitude read «non
 * calcolata»: the model computes an exploratory estimate of the coupling of the
 * air wave to the ground, and it stays, told apart from the seismic waves of a
 * crater. Nothing of the 308 results moves for it. What closes the step:
 *   (a) Wherever an airburst's magnitude or its layer of shaking appears — the
 *       report's first box and its rows, the panel, the legend, the timeline —
 *       it is named an exploratory estimate from the coupling of the air wave
 *       to the ground, never a seismic release; the first box no longer reads
 *       «con l'efficienza sismica» for it, which is the crater's relation.
 *   (b) The out-of-domain words read «Geometria e sorgente degli effetti sono
 *       esplorative; …», and the fixed label is drawn legibly, set off from
 *       the rings' values and the names on the coast.
 *   (c) The warning of an extrapolation to a planetary scale is carried by the
 *       structural overpressure and the wind as by the low overpressure,
 *       wherever a layer's field reaches 2 000 km — a practical threshold for
 *       the warning to appear, not a frontier of validity: the words say that
 *       within it nothing is validated by that alone. In the report it goes
 *       with the figures, the provenance cards and the rows of the numbers that
 *       print those radii.
 *
 * RULE 1074. THE PRINTED ROWS. The reviewer found the warning of rule 1056 (c)
 * making the numbers it qualifies harder to read: on Chicxulub's page of
 * parameters and results the long rows of the blast ran into the next column,
 * over the tsunami's. Every value of that page wraps inside its own column,
 * never over another; the planetary warning is one note at the foot of its
 * group, each radius past 2 000 km marked «†» and pointing to it. The page is
 * checked printed at its real size, A4.
 */

/** Rule 1030: the four visual states. */
export type MapState = 'computed' | 'belowThreshold' | 'modelLimit' | 'notModelled';

/** Rule 1029 (2): the epistemic state of a drawn object. */
export type EpistemicState = 'verified' | 'exploratory' | 'diagnostic' | 'outOfDomain';

/** Rule 1029 (5): what lies beyond an edge. */
export type BeyondEdge = 'computedZero' | 'belowThreshold' | 'notModelled' | 'notApplicable';

/** Rule 1029: the provenance card of a drawn object. */
export interface ProvenanceCard {
  quantity: string;
  unit: string;
  state: EpistemicState;
  source: string;
  /** The numerical interval actually painted. */
  extent: string;
  beyond: BeyondEdge;
}

/** Rule 1030 (2): state 2 shades out to one decade below the lowest isoline. */
export const BELOW_THRESHOLD_DECADES = 1;

/** Rule 1048 (d): beyond this reach (m) the low overpressure is an
 *  extrapolation to a planetary scale. */
export const PLANETARY_EXTRAPOLATION_M = 2_000_000;
