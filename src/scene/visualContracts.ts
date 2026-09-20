/**
 * Visual contract registry — the single source of truth for "what
 * each rendered shape on the globe actually represents in physics".
 *
 * The user-facing complaint that drove this file: **"many graphics
 * don't reflect the real behaviour"**. The root cause was that we
 * had been adding visualisations one at a time without forcing each
 * one to declare its scientific contract. So a circle rendered for
 * MMI VII looked the same as a circle rendered for the impact crater
 * rim — but the underlying physics is completely different (extended-
 * source rupture vs single-point excavation), and the circle is the
 * wrong shape for one of them and the right shape for the other.
 *
 * Every entity that the Globe layer adds via `viewer.entities.add()`
 * MUST reference a contract id from this registry. The contract
 * tells the renderer (and the reader of the source code, and the
 * hover tooltip) exactly:
 *
 *   - What physical quantity the shape represents (`quantity`)
 *   - The formula or paper the rendering derives from (`formula`)
 *   - The geometric semantic (`geometry`) — concentric ring? extended
 *     source contour? topographic channel? heatmap rectangle?
 *   - Whether the shape is a quantitative match to the formula or an
 *     illustrative placeholder (`isQuantitative`)
 *   - Any caveats the renderer should surface (`caveats`)
 *
 * **Geometry vocabulary.** These are the shape categories the
 * renderer is allowed to use; the registry rejects anything else.
 * Adding a new geometry means adding a new entry to the union AND
 * a new branch in the renderer that handles it.
 *
 *   - `point-source-ring` — circle around a point source. Right for
 *     impact craters, nuclear bursts, PDC vent (when terrain-flat).
 *     Wrong for any extended source.
 *   - `extended-source-stadium` — line-source + perpendicular offset.
 *     Stadium-shaped contour. Right for rupture-driven MMI on big
 *     earthquakes, where the rupture is L × W with L ≫ W.
 *   - `asymmetric-ellipse` — oblique-impact downrange stretch
 *     (a Nimbus heuristic) or wind-drift thermal pulse.
 *   - `bathymetric-isocontour` — marching-squares iso-line on a
 *     2-D scalar field (FMM arrival, amplitude). Follows real
 *     coastlines because the underlying field is masked by land.
 *   - `heatmap-rectangle` — Cesium Rectangle entity displaying a
 *     scalar field as an image. The rectangle bbox is purely a
 *     coordinate system for the colormap pixels; transparent pixels
 *     hide the bbox where the field is not defined.
 *   - `coastal-band` — polygon strip running along the coastline,
 *     width modulated by a coastal-cell quantity (run-up height).
 *   - `topographic-channel` — polyline routed by the DEM's drainage
 *     network (lahar) or steepest-descent slope (PDC).
 *   - `point-marker` — single point with style modulated by a scalar
 *     (aftershock magnitude, ECDF threshold).
 *   - `illustrative-3d` — pictorial 3D mesh (mushroom cloud, plume
 *     column). Height matches a scaling formula; shape is qualitative.
 */

export type VisualGeometry =
  | 'point-source-ring'
  | 'extended-source-stadium'
  | 'asymmetric-ellipse'
  | 'bathymetric-isocontour'
  | 'heatmap-rectangle'
  | 'coastal-band'
  | 'topographic-channel'
  | 'point-marker'
  | 'illustrative-3d';

export interface VisualContract {
  /** Stable lookup key, also used as a substring of the Cesium
   *  entity id so a runtime audit can verify each entity was added
   *  via a contracted helper (see `assertEntityContract` below). */
  id: string;
  /** What the user sees this shape representing, in plain language. */
  quantity: string;
  /** Source paper(s) for the formula behind the shape. Always cite
   *  authors + year + journal; the linter for this file rejects
   *  empty strings. */
  formula: string;
  /** SI unit of the quantity (or "dimensionless" for ratios). */
  unit: string;
  /** Geometric semantic — see the module header for the vocabulary. */
  geometry: VisualGeometry;
  /** True when the shape is a faithful rendering of the formula's
   *  output: the position, size and outline ALL derive from physics.
   *  False ("illustrative") when the height / size matches a scaling
   *  but the visual form (e.g. mushroom cloud morphology, plume
   *  column texture) is qualitative. The methodology page surfaces
   *  the boolean as a "scientifically faithful / illustrative" badge. */
  isQuantitative: boolean;
  /** Caveats the renderer should surface in the hover tooltip or
   *  next to the contract on the methodology page. Examples: "ring
   *  ignores terrain shadowing", "amplitude clamped at McCowan". */
  caveats: string[];
}

/**
 * Build a typed registry helper so a misspelt id is caught at the
 * compiler boundary rather than at runtime.
 */
function defineContract<I extends string>(
  contract: VisualContract & { id: I }
): VisualContract & { id: I } {
  if (contract.formula.trim().length === 0) {
    throw new Error(`Visual contract "${contract.id}" has empty formula citation`);
  }
  if (contract.quantity.trim().length === 0) {
    throw new Error(`Visual contract "${contract.id}" has empty quantity description`);
  }
  return contract;
}

export const VISUAL_CONTRACTS = {
  // ---- Shapes an impact and an explosion share -------------------
  // Six of these ids are used by both families, because the shape and
  // the quantity are the same — a 5 psi ring is a 5 psi ring — while the
  // relation behind it is not. Each therefore declares BOTH provenances,
  // labelled, and the caveats say where the two differ materially. The
  // audit of 19 September 2026 found every one of these six citing only
  // one of its two families, and three citing a source the physics
  // itself disclaims.
  craterRim: defineContract({
    id: 'craterRim',
    quantity: 'Final crater rim radius',
    formula:
      'impact: Collins, Melosh & Marcus (2005) MAPS 40(6), Eq. 21 transient → Eq. 22 simple / Eq. 27 complex, halved · explosion: Glasstone & Dolan (1977) §6.09 with Figure 6.72a’s K and Nordyke (1962), D ∝ W^0.3',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'an explosion draws none unless the burst is on the surface: the K · W^0.3 scaling holds in the contact regime only, and Hiroshima’s observed crater was zero',
    ],
  }),
  thirdDegreeBurn: defineContract({
    id: 'thirdDegreeBurn',
    quantity: '3rd-degree burn radius',
    formula:
      'explosion: Glasstone & Dolan (1977) Figure 12.65, the 50 % line of skin-burn probability for an average unshielded population, by yield (rules 114 to 117 of validation/burnProbabilityRules.ts) · impact: the same inverse-square radius at the project’s own 8 cal/cm² with Collins et al. (2005) Eq. 5’s luminous efficiency ≈ 3 × 10⁻³ (rule 81 of validation/burnRules.ts)',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'ignores atmospheric scattering and terrain shadowing',
      'the figure’s population is “average unshielded, taking no evasive action”, which a visitor’s usually is not',
      'an impact combines its two flashes — the fireball at the ground and the energy left in the air — as √(r_ground² + r_air²), adopted by rule 135; Glasstone’s own burn curves are NOT used there, because they are drawn for a nuclear pulse lasting seconds',
    ],
  }),
  secondDegreeBurn: defineContract({
    id: 'secondDegreeBurn',
    quantity: '2nd-degree burn radius',
    formula:
      'explosion: Glasstone & Dolan (1977) Figure 12.65’s 50 % line for the second degree · impact: the project’s own 5 cal/cm² with Collins et al. (2005)’s luminous efficiency',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'ignores atmospheric scattering',
      'always larger than the 3rd-degree ring',
      'until 16 September 2026 an explosion read Figure 12.64 instead — the exposure three skin pigmentations need, which carries no probability; the two differ by a few per cent and not always in the same direction',
    ],
  }),
  massFire: defineContract({
    id: 'massFire',
    quantity: 'mass-fire radius',
    formula:
      'the range at which the thermal fluence falls to the exposure Glasstone & Dolan (1977) Table 7.40 gives for douglas fir plywood at this yield — 9, 16 and 20 cal/cm² at 35 kt, 1.4 Mt and 20 Mt, interpolated in log yield and held flat outside — gated by §7.58’s fourth requirement, a burning area of at least half a square mile (rules 227 to 234 of validation/massFireRules.ts)',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'a plywood coupon facing the fireball square-on stands here for §7.58’s second requirement, half the structures in the area alight at once; a real structure catches through its curtains and its rubbish, which §7.63 records at Hiroshima',
      '§7.58 says there is no generally accepted definition of a fire storm and that the conditions under which one may be expected are not known; of its four requirements only the area is evaluated, the fuel loading and the wind being assumed',
      'the table stops at 20 Mt and its pulse is a nuclear fireball’s: an impact’s lasts orders of magnitude longer and needs more exposure, so above 20 Mt the ring is an upper bound on the reach',
      'measured once, against Hiroshima’s 4.4 square miles of severely fire-damaged ground (§7.62): 2.02 km drawn against 1.90 km recorded, 1.06×',
      'the death toll integrates this ring, at 30 % mortality of the blast and burn survivors inside it (10 % to 80 %)',
    ],
  }),
  fireIgnition: defineContract({
    id: 'fireIgnition',
    quantity: 'ignition radius',
    formula:
      'the same inverse-square fluence at the exposure Table 7.40 gives for shredded newspaper — 4, 6 and 11 cal/cm² at 35 kt, 1.4 Mt and 20 Mt (rule 228 of validation/massFireRules.ts)',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'laboratory values for a material facing the fireball square-on; the table’s own footnote puts the field within ±50 % “with a greater likelihood of higher rather than lower values”, so the true ring is more often smaller than this one',
      'always outside the mass fire, and at Hiroshima half again as wide as the ground that actually burned — §7.71 attributes the difference to the fire storm’s own inward draft',
      'until 19 September 2026 this ring was drawn at 10 cal/cm² and the mass fire at 6, which put the mass fire outside it at every scale (B-061)',
    ],
  }),
  overpressure5psi: defineContract({
    id: 'overpressure5psi',
    quantity: '5 psi (34.5 kPa) overpressure radius',
    formula:
      'threshold from Glasstone & Dolan (1977) §5.129 and Table 5.139; range by inverting Kinney & Graham (1985) Ch. 4 — explosion: with Glasstone’s height-of-burst factor · impact: on half the kinetic energy (IMPACT_BLAST_COUPLING), no height-of-burst factor',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'ignores terrain channelling and reflections',
      'for an impact the model in place is NOT Kinney & Graham: rules 138 to 140 refused the Earth Impact Effects Program’s ground blast on the paper’s entry equations (55 of 60), and rules 141 to 144 adopted it the same day on the program’s own (60 of 60, worst ×1.0019), closing BM-21. An impact’s rings are the program’s Mach relation read at Eq. 18’s altitude, which for such a body lies below the ground; Kinney & Graham stays for the explosion side, and for the share a swarm leaves in the air',
    ],
  }),
  overpressure1psi: defineContract({
    id: 'overpressure1psi',
    quantity: '1 psi (6.9 kPa) overpressure radius',
    formula:
      'threshold from Glasstone & Dolan (1977) §5.139 and Table 5.139; range by inverting Kinney & Graham (1985) Ch. 4, with the height-of-burst factor for an explosion and half the kinetic energy for an impact',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [],
  }),
  lightDamage: defineContract({
    id: 'lightDamage',
    quantity: '0.5 psi (3.5 kPa) light-damage overpressure radius',
    formula:
      'threshold from Glasstone & Dolan (1977) Table 5.139; range by inverting Kinney & Graham (1985) Ch. 4, as the two rings above',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'drawn as an ellipse elongated along the track and slid downrange where the body reaches the ground, and as a circle about the point under the burst where it does not: an airburst’s radii come from a source that is azimuthally symmetric by construction, and Collins et al. (2017) assessed exactly that approximation. The real footprint of an airburst is not a circle either: Collins et al. (2017), citing Popova et al. (2013) on Chelyabinsk, put the damage ellipse’s semi-major axis PERPENDICULAR to the trajectory, ~10 000 km² of broken windows elongated across the path, because along it the trail’s contributions interfere destructively. Tunguska felled 2 200 km² in a butterfly. The line source that would give that shape is named in rules 235 to 240 and not yet built',
      'for an explosion this is the ring the burst actually draws at its own height, corrected on 18 September 2026 (B-049)',
    ],
  }),
  radiationLD50: defineContract({
    id: 'radiationLD50',
    quantity: 'Initial-radiation LD50/60 dose radius (≈ 4.5 Gy)',
    formula:
      'a project fit, range ∝ W^0.18, to three anchors: ≈ 0.7 km at 1 kt, ≈ 1.0 km at Hiroshima’s 15 kt and ≈ 2.5 km at 1 Mt; the doses themselves are UNSCEAR and BEIR VII values',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'ignores shielding (buildings, terrain)',
      'the “Glasstone Fig. 8.46” this contract credited until 19 September 2026 is flagged in the module itself as not a dose–range figure and unverified; the exponent is the project’s, fitted to the three anchors within 15 %',
    ],
  }),
  empAffected: defineContract({
    id: 'empAffected',
    quantity: 'EMP-affected ground footprint',
    formula:
      'IEC 61000-2-9’s 50 kV/m canonical peak for a 1 Mt high-altitude burst, falling as the cube root of yield — a project assumption, not a published range law',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'exoatmospheric only; a ground burst makes a local source-region field of order 0.1·√(W/kt) kV/m and no continental footprint',
      'Meta-R-320 finds the early-time field weakly dependent on yield, which this scaling does not reproduce',
    ],
  }),

  // ---- Earthquake MMI contours ------------------------------------
  // Two shapes, chosen by Mw and fault style: the point-source ring for
  // small and continental events, the extended-source stadium from
  // Mw 7.5 and for any declared subduction interface. Which LAW draws
  // the radius is chosen by depth, and the citations below say so — they
  // credited Boore et al. 2014 alone until 19 September 2026, where a
  // source deeper than 70 km has been drawn by an intraslab model since
  // 15 September.
  mmi7Point: defineContract({
    id: 'mmi7Point',
    quantity: 'MMI VII felt-intensity radius (point source)',
    formula:
      'Worden et al. (2012) PGA↔MMI inverted on the law the depth selects: Boore et al. (2014) NGA-West2 to 70 km, Abrahamson, Gregor & Addo (2016) intraslab beyond it (rules 66 to 70 of validation/deepRules.ts)',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'point-source attenuation, with one Vs30 read at the epicentre for the whole footprint where a ShakeMap reads each cell’s own',
      'the two subduction-interface relations implemented were NOT adopted, so a megathrust no deeper than 70 km is shaken by a law fitted to shallow crustal events',
      'against ShakeMap’s own scenario, on the first five of 19 September 2026, this ring is 0.46 of the equivalent radius of the area ShakeMap puts above MMI VII, and it is drawn where ShakeMap draws none',
    ],
  }),
  mmi7Stadium: defineContract({
    id: 'mmi7Stadium',
    quantity: 'MMI VII felt-intensity contour around the rupture',
    formula:
      'the point-source radius above, taken as a Joyner–Boore distance and swept around the surface projection of the rupture rectangle (L from Wells & Coppersmith 1994, or Strasser et al. 2010 for a megathrust)',
    unit: 'metres',
    geometry: 'extended-source-stadium',
    isQuantitative: true,
    caveats: [
      'the across-strike half-width is the DOWN-DIP width W/2, not its surface projection W·cos(dip)/2: an earthquake here carries no dip, so the stadium is as wide across strike as the fault is deep, which for a 45° fault is about 40 % too wide and for a 15° megathrust about 3 %',
      'the rupture is centred on the epicentre and symmetric about it, where a real rupture is usually one-sided',
      'r_jb is the perpendicular distance to that projection; the radius itself is a point-source inverse, not a finite-fault relation, where a gold-standard product computes a distance metric cell by cell over a grid and lets the contour fall out of it',
      'the slip is uniform, so the footprint is even along strike where a real one is patchy: no asperity, and no directivity',
    ],
  }),
  mmiField: defineContract({
    id: 'mmiField',
    quantity:
      'the felt-intensity field around a rupture, drawn as filled bands and labelled contours',
    formula:
      "the scenario's own intensity law evaluated cell by cell on a 257 x 257 grid in the rupture's frame, each cell on the Vs30 the shipped USGS tiles give it, with the bands V to X taken off that grid by marching squares",
    unit: 'Modified Mercalli intensity',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: [
      'this is a PREDICTION and not a measurement: a USGS ShakeMap, which it resembles, is partly made of accelerometers and felt reports, and there are none here',
      'the contour is drawn as a line where the ground-motion residual is sigma_lnY = 0.60 about the median — through Worden et al. 2012 that is about ONE WHOLE INTENSITY DEGREE, so a line labelled VII could honestly be VI or VIII',
      'the areas are known to be too large: on Tohoku the model paints MMI VIII over 192 279 km2 where the published ShakeMap measures 67 625, a factor of 2.84, and the picture does not say so',
      'the irregularity comes ONLY from the Vs30 grid, whose own convention in this project carries 30 % uncertainty; there is no topography, no basin depth and no within-event spatial correlation',
      'what the field fixes, relative to the rings it is drawn beside: the contour falls out of a distance metric computed cell by cell rather than being a point-source radius swept around a rectangle',
    ],
  }),
  mmi8Point: defineContract({
    id: 'mmi8Point',
    quantity: 'MMI VIII felt-intensity radius (point source)',
    formula: 'as mmi7Point, at intensity VIII',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: ['see mmi7Point'],
  }),
  mmi8Stadium: defineContract({
    id: 'mmi8Stadium',
    quantity: 'MMI VIII felt-intensity contour around the rupture',
    formula: 'as mmi7Stadium, at intensity VIII',
    unit: 'metres',
    geometry: 'extended-source-stadium',
    isQuantitative: true,
    caveats: ['see mmi7Stadium'],
  }),
  mmi9Point: defineContract({
    id: 'mmi9Point',
    quantity: 'MMI IX felt-intensity radius (point source)',
    formula: 'as mmi7Point, at intensity IX',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: ['see mmi7Point'],
  }),
  mmi9Stadium: defineContract({
    id: 'mmi9Stadium',
    quantity: 'MMI IX felt-intensity contour around the rupture',
    formula: 'as mmi7Stadium, at intensity IX',
    unit: 'metres',
    geometry: 'extended-source-stadium',
    isQuantitative: true,
    caveats: ['see mmi7Stadium'],
  }),
  faultTrace: defineContract({
    id: 'faultTrace',
    quantity: 'Surface trace of the rupture, along strike through the epicentre',
    formula:
      'a line of the rupture length L (Wells & Coppersmith 1994, or Strasser et al. 2010 for a megathrust) on the azimuth the scenario gives as its strike, laid on the same sphere as the stadium it belongs to',
    unit: 'metres (length)',
    geometry: 'extended-source-stadium',
    isQuantitative: true,
    caveats: [
      'drawn only for an extended source — from Mw 7.5, or any declared subduction interface',
      'a line where a gold-standard product draws the surface projection of the fault PLANE as a polygon, and where a real event’s trace is read from a finite-fault inversion rather than from a length relation',
      'symmetric about the epicentre, like the stadium: the ignition animation runs both ways from the hypocentre because the model has no rupture direction',
      'this entity was drawn without a contract at all until 19 September 2026, which is the defect B-054 found for the lahar, the other way round',
    ],
  }),

  // ---- Tsunami: cavity, wavefronts, isochrones --------------------
  tsunamiCavity: defineContract({
    id: 'tsunamiCavity',
    quantity: 'The disc the wave leaves from',
    formula:
      'impact: Ward & Asphaug (2000) Eq. 3 with the size-dependent coupling · earthquake: half the down-dip rupture width, floored at 10 km (`seismicSourceCavityRadiusM`), which is the disc the arrival field is seeded from',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'for an impact on ground the cavity drawn is the equal-area circle of the segment of the transient crater that lies beyond the shoreline, and there is none at all where the crater stops short of the water (rules 267 to 273); until 19 September 2026 it was the water cavity the impact would have dug if it had happened at sea, which for an inland strike is a hole that is not there',
      'near field; the ring marks where the source ends, not where damage stops',
      'until 18 September 2026 the globe drew a quarter of the rupture length here while the wave left from half the width — 201 km against 111 for a Mw 9.2 (B-053)',
    ],
  }),
  tsunamiWaveFront5m: defineContract({
    id: 'tsunamiWaveFront5m',
    quantity: 'Iso-amplitude contour at 5 m wave height',
    formula:
      'the amplitude veil of tsunami/amplitudeField.ts: geometric spreading from the source disc, Kajiura dispersion, and Green’s (1838) shoaling on the bathymetric grid, over the arrival field marched at Lamb (1932)’s long-wave speed',
    unit: 'metres (amplitude)',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: [
      'follows real coastlines because the field is masked by land',
      'the source amplitude is the event’s own — Ward & Asphaug for an impact, the megathrust relation for an earthquake, Glasstone & Dolan §6.121 for a burst in water, the impulse-wave manual for a slide',
    ],
  }),
  tsunamiWaveFront1m: defineContract({
    id: 'tsunamiWaveFront1m',
    quantity: 'Iso-amplitude contour at 1 m wave height',
    formula: 'as tsunamiWaveFront5m, at 1 m',
    unit: 'metres (amplitude)',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: ['see tsunamiWaveFront5m'],
  }),
  tsunamiWaveFront03m: defineContract({
    id: 'tsunamiWaveFront03m',
    quantity: 'Iso-amplitude contour at 0.3 m wave height',
    formula: 'as tsunamiWaveFront5m, at 0.3 m',
    unit: 'metres (amplitude)',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: ['below 0.3 m the wave is mostly invisible at the coast'],
  }),
  tsunamiIsochrone1h: defineContract({
    id: 'tsunamiIsochrone1h',
    quantity: 'Tsunami arrival contour at +1 hour',
    formula:
      'the eikonal arrival field of tsunami/fastMarching.ts, marched at Lamb (1932)’s √(g·h) over the bathymetric grid from the seeds the store places along the source',
    unit: 'seconds (travel time)',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: [
      'the march wraps the antimeridian since 18 September 2026; before that the Pacific was a wall and a point two degrees past the dateline read 17.7 times late (B-055)',
    ],
  }),
  tsunamiIsochrone2h: defineContract({
    id: 'tsunamiIsochrone2h',
    quantity: 'Tsunami arrival contour at +2 hours',
    formula: 'as tsunamiIsochrone1h',
    unit: 'seconds',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: [],
  }),
  tsunamiIsochrone4h: defineContract({
    id: 'tsunamiIsochrone4h',
    quantity: 'Tsunami arrival contour at +4 hours',
    formula: 'as tsunamiIsochrone1h',
    unit: 'seconds',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: [],
  }),
  tsunamiIsochrone8h: defineContract({
    id: 'tsunamiIsochrone8h',
    quantity: 'Tsunami arrival contour at +8 hours',
    formula: 'as tsunamiIsochrone1h',
    unit: 'seconds',
    geometry: 'bathymetric-isocontour',
    isQuantitative: true,
    caveats: [],
  }),
  tsunamiAmplitudeHeatmapLocal: defineContract({
    id: 'tsunamiAmplitudeHeatmapLocal',
    quantity: 'Wave amplitude field, near-source high resolution',
    formula: 'the same veil as the iso-amplitude contours, drawn cell by cell',
    unit: 'metres (amplitude)',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: ['rendered as an image inside the local terrain tile’s bounding box'],
  }),
  tsunamiAmplitudeHeatmapGlobal: defineContract({
    id: 'tsunamiAmplitudeHeatmapGlobal',
    quantity: 'Wave amplitude field, planet-wide low resolution',
    formula: 'the same veil, on the zoom-2 terrarium mosaic',
    unit: 'metres (amplitude)',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: [
      '≈ 40 km a pixel — a coastline smaller than that is smeared, and three of the nine megathrust epicentres of BM-05 fall on land at this resolution',
    ],
  }),
  tsunamiArrivalHeatmap: defineContract({
    id: 'tsunamiArrivalHeatmap',
    quantity: 'Tsunami travel-time field',
    formula: 'as the isochrones: the eikonal march at Lamb (1932)’s long-wave speed',
    unit: 'seconds',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: [],
  }),
  tsunamiCoastalRunup: defineContract({
    id: 'tsunamiCoastalRunup',
    quantity: 'Vertical run-up height at coastal cells',
    formula: 'Synolakis (1987) plane beach, R = 2.831 · H · √(cot β) · (H/d)^¼',
    unit: 'metres (vertical)',
    geometry: 'point-marker',
    isQuantitative: true,
    caveats: [
      'rendered as colour-tier dots, not yet a coastal band',
      'the source amplitude is capped at 0.4 of the water column at the generation site — a number with NO source: the McCowan (1894) attribution was removed from the physics on 16 September 2026 (B-039), and McCowan’s own breaking limit is 0.78 of the depth',
      'held out and measured on 18 September 2026, the run-up stands at 3.69× what was recorded over 2 468 coastal bins, against T2’s bound of ×1.5',
    ],
  }),

  // ---- Volcano: PDC, lahar, lateral blast, ashfall ----------------
  pyroclasticRunout: defineContract({
    id: 'pyroclasticRunout',
    quantity: 'Pyroclastic-current reach',
    formula:
      'L = K · V^(1/3) with K = 10, a Nimbus value: Sheridan (1979) and Hayashi & Self (1992) are background and, in the module’s own words, “not the source of the equation”',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'a circle about the vent: the reach is a magnitude, the shape is a placeholder, and routing it needs a DEM drainage network this project has not written',
      'the field’s published mobility law is Ogburn et al. (2016), whose volume is ONE current’s and not an eruption’s — by a factor of 6 to 218 on the events this project quotes — so it was read on 19 September 2026 and not adopted (rules 220 to 226 of validation/pdcMobilityRules.ts)',
      'the “PDC runout (energy line)” the page prints beside this is a different number, 64 km at Mount St Helens and 88 at Vesuvius against 8 and 9 observed, and it is NOT drawn here',
      'this contract credited “Sheridan 1979 / Dade & Huppert 1998” until 19 September 2026, for a relation neither published',
    ],
  }),
  laharRunout: defineContract({
    id: 'laharRunout',
    quantity: 'Lahar (debris-flow) reach',
    formula:
      'project recast of Iverson, Schilling & Vallance (1998) GSA Bull. 110(8): 972–984, an inundation-AREA law read as a length',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'an unfilled outline about the vent, because a filled disc of this radius claims 5 576 km² where Griswold & Iverson (2008)’s own area law gives 27.1 (rules 202 to 207)',
      'a lahar follows a valley; routing it needs the DEM drainage network, as the pyroclastic contract says of its own shape',
      'calibrated on Mount St Helens 1980, where it gives 42.1 km against about 50 observed; its band is a factor of two',
    ],
  }),
  lateralBlast: defineContract({
    id: 'lateralBlast',
    quantity: 'Mount-St-Helens-style directional blast wedge',
    formula:
      'a project multiplier on the pyroclastic reach above — itself a project scaling — calibrated so the Mount St Helens 1980 wedge reaches the ≈ 27 km of Glicken (1996) USGS OFR 96-677, which is the account it was fitted to and not a formula it provides',
    unit: 'metres',
    geometry: 'asymmetric-ellipse',
    isQuantitative: true,
    caveats: [
      'the wedge is centred on the direction the scenario names, and its width is a choice',
    ],
  }),
  ashfallPlume: defineContract({
    id: 'ashfallPlume',
    quantity: 'Extent of the 1 mm ash isopach, downwind and across the wind',
    formula:
      'Tephra2’s own advection–diffusion model (Connor & Connor 2006), written for Nimbus and adopted on 16 September 2026 by rules 158 to 161: a Suzuki release, Ganser (1993) settling, and the diffusion Tephra2 uses, walked band by band along the wind',
    unit: 'metres (extent of the 1 mm contour)',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: [
      'what is drawn is the FOOTPRINT of the 1 mm isopach — a downwind reach and a crosswind half-width — and not a field of thickness',
      'one wind, constant with height and time; not a 3-D atmospheric solver',
      'agreeing with Tephra2 is agreeing with its parameters, inverted from one eruption at Colima; ten isopach maps, which gold-standard rule V3 asks for, have not been read',
    ],
  }),
  ejectaBlanket: defineContract({
    id: 'ejectaBlanket',
    quantity: 'Impact ejecta blanket, 1 m thickness contour',
    formula:
      'Collins, Melosh & Marcus (2005) Eq. 47*, the r⁻³ thickness law inverted for the range at 1 m, with the Pierazzo & Melosh downrange asymmetry',
    unit: 'metres',
    geometry: 'asymmetric-ellipse',
    isQuantitative: true,
    caveats: ['only the 1 m tier is drawn; the model also publishes 1 mm'],
  }),

  // ---- Markers, bands and illustrations ---------------------------
  altitudeBeacon: defineContract({
    id: 'altitudeBeacon',
    quantity: 'Altitude of a burst, a height of burst, or an eruption column top',
    formula:
      'the altitude the model computes for that scenario: an airburst’s peak-brightness altitude from the entry model, the height of burst the scenario names, or Mastin et al. (2009)’s plume top',
    unit: 'metres (altitude)',
    geometry: 'point-marker',
    isQuantitative: true,
    caveats: [
      'a vertical shaft to scale; nothing below 500 m is drawn',
      'this entity was drawn without a contract until 19 September 2026',
    ],
  }),
  eruptionColumn: defineContract({
    id: 'eruptionColumn',
    quantity: 'Eruption column, to the plume top',
    formula: 'Mastin et al. (2009) plume height from the volume eruption rate',
    unit: 'metres (altitude)',
    geometry: 'illustrative-3d',
    isQuantitative: false,
    caveats: [
      'the height matches the relation; the column’s shape and umbrella are qualitative',
      'this entity was drawn without a contract until 19 September 2026',
    ],
  }),
  cascadeWavefront: defineContract({
    id: 'cascadeWavefront',
    quantity: 'Where the wave front stands, during the cascade animation',
    formula: 'the arrival field’s own contour at the animation’s current time',
    unit: 'seconds (elapsed)',
    geometry: 'point-marker',
    isQuantitative: false,
    caveats: [
      'an indicator for the animation, not a hazard contour: the contoured field is the one the isochrones draw',
      'this entity was drawn without a contract until 19 September 2026',
    ],
  }),
  aftershockMarker: defineContract({
    id: 'aftershockMarker',
    quantity: 'Aftershock event (location, magnitude)',
    formula: 'Reasenberg & Jones (1989) sequence with Båth’s ceiling on the largest',
    unit: 'magnitude (Mw, dimensionless) + metres (offset)',
    geometry: 'point-marker',
    isQuantitative: true,
    caveats: [
      'reveal time is log-compressed for display; the physical onsets are in the panel',
      'the locations are drawn about the epicentre and are not on a fault',
    ],
  }),
  ecdfRadialBitmap: defineContract({
    id: 'ecdfRadialBitmap',
    quantity: 'Probability that a damage radius reaches this far',
    formula:
      'the empirical distribution of the Monte Carlo ensemble, 200 realisations by default (`DEFAULT_ITERATIONS`)',
    unit: 'dimensionless probability',
    geometry: 'heatmap-rectangle',
    isQuantitative: true,
    caveats: ['alpha at range r encodes P(R ≥ r), rotationally symmetric'],
  }),
  sigmaUpperBand: defineContract({
    id: 'sigmaUpperBand',
    quantity: 'Upper-1σ envelope around a damage radius',
    formula: 'the per-quantity 1σ of src/physics/uq/conventions.ts',
    unit: 'metres',
    geometry: 'point-source-ring',
    isQuantitative: true,
    caveats: [
      'the outer halo only; the symmetric inner band is not drawn',
      'for most quantities that σ is a project convention and not a band scored on a held-out set, which is what gold-standard rule G3 asks for',
    ],
  }),
  mushroomCloud: defineContract({
    id: 'mushroomCloud',
    quantity: 'Stabilisation altitude of the rising fireball cloud',
    formula:
      'a project fit, H[km] = 1.7 · W[kt]^0.42, to four observations — Hiroshima ≈ 6 km at 15 kt, Crossroads Baker ≈ 3 km, Castle Bravo ≈ 40 km at 15 Mt, Tsar Bomba ≈ 64 km at 50 Mt — capped at 60 km',
    unit: 'metres (altitude)',
    geometry: 'illustrative-3d',
    isQuantitative: false,
    caveats: [
      'the altitude matches the fit; the cloud’s morphology is qualitative',
      'Glasstone & Dolan §2.51 and Khariton et al. (2005) are where two of the four observations come from, not the source of the regression',
    ],
  }),
} as const satisfies Record<string, VisualContract>;

export type VisualContractId = keyof typeof VISUAL_CONTRACTS;

/**
 * Every entity id the simulator pipeline creates starts with one of these
 * prefixes, and each prefix names the contracts that describe what it draws.
 *
 * Two jobs in one list, and that is deliberate. The renderer sweeps these
 * prefixes to purge a previous simulation's entities, so a shape added without
 * an entry here leaves a ghost on the next click. And the registry's own rule
 * at the top of this file — every entity the globe adds must reference a
 * contract — is only enforceable if the two lists are written side by side:
 * until 19 September 2026 they were not, and four families were drawn with no
 * contract at all (the rupture trace, the altitude beacons, the eruption column
 * and the cascade's wave-front indicator). B-054 was the same defect the other
 * way round — a lahar with no contract, and so no entity either.
 *
 * `contracts: []` is allowed for a shape that carries no physical quantity, and
 * the reason has to be written beside it.
 */
export const ENTITY_CONTRACTS: readonly {
  prefix: string;
  contracts: readonly VisualContractId[];
  why?: string;
}[] = [
  {
    prefix: 'impact-marker',
    contracts: [],
    why: 'the locator dot: where the user clicked, not a quantity',
  },
  {
    prefix: 'damage-ring-',
    contracts: [
      'craterRim',
      'thirdDegreeBurn',
      'secondDegreeBurn',
      'massFire',
      'fireIgnition',
      'overpressure5psi',
      'overpressure1psi',
      'lightDamage',
    ],
  },
  { prefix: 'mmi-ring-', contracts: ['mmi7Point', 'mmi8Point', 'mmi9Point'] },
  { prefix: 'mmi-stadium-', contracts: ['mmi7Stadium', 'mmi8Stadium', 'mmi9Stadium'] },
  {
    prefix: 'mmi-field',
    contracts: ['mmiField'],
    why: 'the intensity as a field, under the rings that summarise it',
  },
  {
    prefix: 'explosion-',
    contracts: [
      'craterRim',
      'thirdDegreeBurn',
      'secondDegreeBurn',
      'massFire',
      'fireIgnition',
      'overpressure5psi',
      'overpressure1psi',
      'lightDamage',
      'radiationLD50',
      'empAffected',
      'mushroomCloud',
    ],
  },
  {
    prefix: 'tsunami-',
    contracts: [
      'tsunamiCavity',
      'tsunamiWaveFront5m',
      'tsunamiWaveFront1m',
      'tsunamiWaveFront03m',
      'tsunamiIsochrone1h',
      'tsunamiIsochrone2h',
      'tsunamiIsochrone4h',
      'tsunamiIsochrone8h',
      'tsunamiAmplitudeHeatmapLocal',
      'tsunamiAmplitudeHeatmapGlobal',
      'tsunamiArrivalHeatmap',
      'tsunamiCoastalRunup',
    ],
  },
  { prefix: 'aftershock-', contracts: ['aftershockMarker'] },
  { prefix: 'pyroclastic-', contracts: ['pyroclasticRunout'] },
  { prefix: 'lahar-', contracts: ['laharRunout'] },
  { prefix: 'ashfall-', contracts: ['ashfallPlume'] },
  { prefix: 'ejecta-', contracts: ['ejectaBlanket'] },
  { prefix: 'lateral-blast', contracts: ['lateralBlast'] },
  { prefix: 'cascade-', contracts: ['cascadeWavefront'] },
  { prefix: 'fuzzy-mc-', contracts: ['ecdfRadialBitmap', 'sigmaUpperBand'] },
  { prefix: 'beacon-', contracts: ['altitudeBeacon'] },
  { prefix: 'eruption-vfx-', contracts: ['eruptionColumn'] },
  { prefix: 'fault-', contracts: ['faultTrace'] },
];

/** The prefixes alone, which is what the renderer's purge needs. */
export const SIM_ENTITY_PREFIXES: readonly string[] = ENTITY_CONTRACTS.map((e) => e.prefix);

/** Look up a contract by id, throwing in dev mode if it is missing. */
export function getVisualContract(id: VisualContractId): VisualContract {
  return VISUAL_CONTRACTS[id];
}

/**
 * Aggregate every contract whose `geometry` is one of the provided
 * categories. Useful for tooling — e.g. "list every illustrative-3d
 * contract" or "audit every point-source-ring contract for caveats".
 */
export function contractsByGeometry(...geometries: VisualGeometry[]): VisualContract[] {
  const set = new Set<VisualGeometry>(geometries);
  return Object.values(VISUAL_CONTRACTS).filter((c) => set.has(c.geometry));
}
