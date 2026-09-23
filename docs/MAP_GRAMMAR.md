# The cartographic grammar of the impact map

The design the reviewer asked for on 23 September 2026, before any map is changed. The rules
are 1028 to 1036, in `src/scene/globe/mapGrammarRules.ts`; this page is their readable form.
The physics does not move: this is how the globe draws and says what the model computes.

## Why

Today the globe confuses four different things: a computed zero, a value below the drawn
thresholds, a limit of the model, and what is not modelled or out of its domain. A limit of the
computation can read as a physical edge:

- Chicxulub's flash stops at the fireball's horizon, 1 616 km, with its four thresholds packed
  within 12 km of it;
- its ejecta end at the 1 mm isopach, 8 556 km, while the K–Pg layer is global;
- Chelyabinsk draws nothing: its 1.6 kPa is below the lowest drawn 3.45 kPa;
- Tunguska draws no heat: its second- and third-degree reaches are shorter than its burst
  altitude.

## The provenance card

Every drawn object — a field, an isoline, a limit line, a not-modelled area — has a card with
five fixed fields, opened from the legend and printed in the report:

| Field                   | Content                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| Quantity and unit       | e.g. peak overpressure at the ground, kPa                                   |
| Epistemic state         | A (implementation verified), exploratory, diagnostic, or out of domain      |
| Source and model        | the equation, the reference, the essential assumptions                      |
| Extent drawn            | the numerical interval actually painted                                     |
| Meaning beyond the edge | computed zero, below the display threshold, not modelled, or not applicable |

## Four visual states

| State                        | When                                           | Drawing                                                                                 | Label on the globe       |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------ |
| Computed                     | a value inside the model's domain              | continuous fill, solid isolines                                                         | — (values in the legend) |
| Below the display threshold  | a non-zero value under the lowest isoline      | very faint shading beyond the last isoline, to one decade below it or the model's limit | «continua sotto soglia»  |
| Limit of the model           | the computation stops by an internal condition | thick dash-dot line, neutral colour                                                     | «limite del modello»     |
| Not modelled / out of domain | no physically applicable value                 | diagonal hatch or semi-transparent grey, never the colour of zero                       | what is not modelled     |

A computed zero draws nothing, and the legend says so. Shading belongs to state 2 alone; hatching
to what is truly not computed. Only the state labels are written on the globe; each isoline's
quantity, threshold, unit and reach stay in the legend.

## Layer by layer

- **Heat.** The direct horizon becomes a state-3 line. Thresholds merged at it become one callout,
  «soglie 5–20 cal/cm² compresse presso il limite geometrico». Beyond it, a state-4 area: «radiazione
  diretta non calcolata oltre l'orizzonte; questo non implica assenza di riscaldamento». Legend:
  «Rientro globale degli ejecta e riscaldamento atmosferico: non modellati in questo layer». No
  shading beyond the horizon.
- **Ejecta.** Fill to the 1 mm isopach, then a fading band, «deposito < 1 mm oppure non risolto
  dalla scala corrente». Legend: «Mappa visualizzata: spessore ≥ 1 mm».
- **Low overpressure.** A layer of its own, «Sovrapressione bassa — danno a vetri (esplorativo)»,
  isolines at 1 and 3 kPa, its own palette, outside the structural scale and the casualties.
- **Below the main threshold.** A layer is never hidden because its drawn thresholds are zero: a
  faint halo, «sotto la soglia principale», what the model computes and, apart, what was observed.
- **Out of the crater's domain.** Concentric rings about the effective source; a light hatch on the
  rings drawn from the residual energy at the ground; the label «Effetti esplorativi: accoppiamento
  al suolo non modellato»; no seismic stage, magnitude, liquefaction or climate tier; casualties
  «non valutabile».
- **Timeline.** A complete airburst's ground effect is «onda atmosferica al suolo»; «Rilascio di
  onde sismiche» only where a coupling to the ground is computed inside the domain. B-128 — the
  out-of-domain crater's stage printing its raw keys — is mended first.

## Step 2, as built

States 2, 3 and 4 are drawn from each layer's edge (step 1), with these choices:

- **One veil for state 2 on every layer**: white, 12 % opaque at the field's edge, fading to
  nothing where the value has fallen a decade (or at the model's limit), so that its end reads as
  no edge. A layer's own palette was tried first and dropped: on the shaking it made the weaker
  ground beyond III look stronger than the unfilled III–IV zone inside it.
- **A decade of the shaking** is one unit of the program's effective magnitude (a decade of
  amplitude): the band runs from III's line to effective magnitude 2.
- **The probability view's edge** is where it stops painting, 2 %, and its band runs to 0.2 %.
  **I3's agreement** draws no band: past the band's upper edge not even that edge passes the
  threshold, a computed no, and its card says "computed zero".
- **The ejecta** draw no band yet: their band has its own words (rule 1031 (b)) and comes in
  step 4.
- **Past the fireball's horizon** the not-modelled hatch runs to the antipode; where a band meets
  the horizon first (Popigai), it stops there and the limit and the hatch follow.
- **The words** stand south of the point of impact, clear of the values and of the screen's side
  panels; the report's photographs carry none (IMP-7c).

## Step 3, as built

- Thresholds within 1 % of the fireball's direct horizon (B-119's test for lines on the horizon)
  are no isoline of damage: the limit's dash-dot line stands there, and they are written as one
  callout on it, «soglie 5–20 cal/cm² compresse presso il limite geometrico» (a single one,
  «soglia … compressa …»). The legend's colour bar still lists each threshold at its own radius.
- The row «Rientro globale degli ejecta e riscaldamento atmosferico: non modellati in questo
  layer» is shown where the heat reaches its horizon (Chicxulub, Popigai), not on a heat that stops
  short of it.

## Step 4, as built

- Past the 1 mm isopach the ejecta draw the same veil, out to where the r⁻³ law has thinned the
  blanket to 0.1 mm (10^⅓ times farther), labelled «deposito < 1 mm oppure non risolto dalla scala
  corrente» — never «continua». The legend states the cut: «Mappa visualizzata: spessore ≥ 1 mm».
- The globe and the report change together (rule 1037).

## Step 5, as built

- A layer of its own, «Sovrappressione bassa — danno a vetri (esplorativo)»: the overpressure's
  own field (the one verified at level A), read from 1 kPa up to 0.5 psi = 3.45 kPa, where the
  structural layer starts, on ColorBrewer's BuPu; lines at 1 and 3 kPa where the field reaches
  them. Its evidence class is exploratory by name, and its legend carries the reviewer's three
  sentences and «fuori dalla scala strutturale e dal conteggio delle vittime». Below 1 kPa the same
  state-2 veil as every layer.
- Chelyabinsk: 1.6 kPa at the ground gives the 1 kPa line at 30 km, no 3 kPa line; its structural
  layer still says it draws nothing, and why.
- It sits second among the tabs, so a scenario without a structural layer opens on it.

## The printed report (rule 1037)

The reviewer, approving steps 1 to 3, asked for the report now, before step 4: the globe and the
PDF are one product. A pass of presentation alone — the flat maps draw the four states, edges and
labels (the veil grey on paper); the report prints every drawn layer's provenance card and each of
its marks', and lists the layers not drawn with their reason; it carries the fixed note «La resa
cartografica non estende il dominio fisico del modello.»; photographs before and after, the seal's
numbers the same. From here on every step changes the globe and the report together.

## Tests and the visual suite

Automatic tests: every layer and object has one state and a full card; every edge says what lies
beyond it; a layer that draws nothing says «zero», «below the threshold» or «not modelled»;
changing a display threshold changes no physical number; out of the crater's domain no crater
effect comes back.

The visual suite photographs every layer of four fixed cases — Chicxulub, Chelyabinsk, Tunguska
and a body out of the crater's domain — before the change and after each step
(`scripts/globe-visual-suite.ts`); an end-to-end test reads each layer's state and card.

## Order

0. This design and the photographs before.
1. The vocabulary (states, cards, edges) in the layer model and the legend; the tests; B-128.
2. The drawing of states 2, 3 and 4 and the state labels on the globe.
3. Heat. 4. Ejecta. 5. Low overpressure. 6. Below the main threshold. 7. Out of the crater's
   domain and the timeline.

Each step is photographed before and after, and the seal re-taken with each moving scenario
listed; its numbers never move. Not in this round: economic damage (Nimbus computes none), the
logarithmic ejecta view, any change of the physics behind a layer.
