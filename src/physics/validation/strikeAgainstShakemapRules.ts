/**
 * Asking ShakeMap whether the strike is right.
 *
 * Rules 295 to 303 measured the strike against six PUBLISHED numbers — the
 * strikes the finite-fault inversions of those six earthquakes report. That is
 * a real measurement and it is not enough, for the reason [[the amendment of 16
 * September]] gives: a bar is worth what the reference reaches on the same
 * rows, and the reference here is not a number in a paper but a program the
 * field runs. E1 of `docs/GOLD_STANDARD.md` names it, and Andrea named it again
 * on 20 September 2026: measure against ShakeMap BY RUNNING IT, not by reading
 * what someone wrote about it.
 *
 * There are two ways to ask, they are not the same question, and this file
 * fixes both before either is run.
 *
 * WHAT WAS LOOKED AT before these rules were fixed: `docs/SHAKEMAP_SETUP.md`,
 * which this project wrote on 19 September 2026 — how ShakeMap 4 installs here,
 * the five scenarios already run with it, and the finding that where both draw
 * an MMI VII our ring is 0.46 of ShakeMap's equivalent radius at the rock
 * reference. `scripts/build-rule-shakemaps.ts`, which already reads published
 * ShakeMap coverages from USGS ComCat and sums the area above each intensity.
 * That our own footprint is too small is therefore KNOWN GOING IN, and rule 306
 * is written around it.
 *
 * NOT looked at: no ShakeMap coverage of any of the six presets has been
 * fetched, no scenario has been run for any of them, and no orientation of any
 * published footprint has been measured.
 *
 * 304. The two questions.
 *      (a) DOES THE PUBLISHED MAP POINT WHERE WE POINT? The ShakeMap of each
 *          preset as USGS publishes it — drawn with stations, intensity reports
 *          and the event's own finite rupture — is the field's answer for that
 *          earthquake, and its MMI VII footprint is an oriented shape. Its
 *          orientation is a fact about the record and not about any model of
 *          ours.
 *      (b) DOES SHAKEMAP ITSELF PREFER OUR STRIKE TO NORTH? ShakeMap run twice
 *          as a scenario on the same event, same source, same configuration,
 *          differing in ONE input — the strike of the finite rupture it is
 *          given: ours, and due north. Then each run's footprint against the
 *          published map. This is the question rules 295 to 303 cannot answer
 *          about themselves, because the program that answers it is not ours
 *          and its ground motion is not ours.
 *
 * 305. How a footprint is given an orientation. The MMI VII mask — every cell
 *      of the coverage at or above 6.5, which is how `pnpm shakemap:build`
 *      already rounds an intensity band — is a set of cells with an area each.
 *      Its orientation is the principal axis of the area-weighted second-moment
 *      tensor of those cells about their centroid, taken in a local tangent
 *      plane with longitudes shortened by cos(latitude). Its aspect ratio is
 *      the square root of the ratio of the two eigenvalues.
 *
 *      An axis is an undirected line, so it is compared modulo 180° exactly as
 *      rule 287 compares strikes.
 *
 * 306. What the comparison may and may not claim. The principal axis of an MMI
 *      VII footprint IS NOT THE STRIKE. It is the strike bent by everything
 *      else the map knows: a coastline that ends the land, a basin that
 *      amplifies, stations clustered in one valley, a rupture that is not a
 *      rectangle. So no absolute bound is set on the difference between them —
 *      setting one would be inventing a tolerance for a quantity nobody has
 *      calibrated — and the measurement is COMPARATIVE, which is the form the
 *      question actually takes:
 *
 *      (a) On every preset whose published footprint is elongated at all
 *          (aspect ratio ≥ 1.2; below that a footprint is round and has no
 *          orientation to report), the strike rules 295 to 303 found is closer
 *          to the published footprint's axis than due north is.
 *      (b) The difference is printed for every preset, elongated or not, beside
 *          the aspect ratio, so that a reader sees how much shape there was to
 *          measure.
 *      (c) Where a preset has no published ShakeMap at all — three of the six
 *          are earthquakes of 1960, 1964 and 2001, and ComCat's coverage of
 *          those is an Atlas product or nothing — it is named and left out. A
 *          missing map is not a failure of the strike.
 *
 * 307. What decides question (b), the one that runs the program. For each
 *      preset with a published map, ShakeMap is run as a scenario twice, with a
 *      finite rupture of the length and width the project already computes,
 *      once at our strike and once at north, everything else identical. Then:
 *
 *      (a) the run at our strike agrees with the published map better than the
 *          run at north does, on every preset where the published map is
 *          elongated, agreement being the intersection over union of the two
 *          MMI VII masks;
 *      (b) the ShakeMap version, its configuration and its ground-motion model
 *          set are recorded with the result, because distances changed at 4.3.0
 *          and a number without a version is not reproducible;
 *      (c) neither run is tuned. The scenario is written once, from the
 *          project's own source parameters, and run. If ShakeMap prefers north,
 *          that is the result and it is printed.
 *
 *      Where ShakeMap cannot be run at all — it is not on PyPI and its
 *      installation is not part of this repository — the clause is PENDING, and
 *      pending is not satisfied. It is not passed by (a) of rule 306.
 *
 * 308. WHAT SHAKEMAP WAS ACTUALLY ASKED, on 20 September 2026, and why it is
 *      not rule 307.
 *
 *      Rule 307 needs the published map of each preset to compare a run
 *      against, and that download was not taken: asked which downloads to
 *      authorise, Andrea authorised the ShakeMap installation and not the
 *      published coverages. **Rule 307 therefore stays PENDING, and pending is
 *      not satisfied.** Nothing below passes it, and nothing below should be
 *      read as having passed it.
 *
 *      What a program that runs, with nothing published to be held against,
 *      CANNOT be asked is "is our strike right". ShakeMap given a rupture at an
 *      azimuth draws a footprint at that azimuth; finding that our footprint
 *      agrees with its footprint when both were turned the same way is a
 *      circle, and a circle is not a measurement. Two things can be asked, and
 *      these are the two:
 *
 *      (a) WHAT DID NORTH COST. ShakeMap is run twice for each preset on one
 *          source — same magnitude, depth, mechanism, rupture dimensions and
 *          configuration — differing in ONE input: the azimuth of the finite
 *          rupture it is given, ours and due north. The intersection over union
 *          of the two MMI VII footprints, their areas, and the population
 *          inside each, are the size of the error the default was making,
 *          measured by the field's own program instead of by ours. No bound is
 *          set: it is a quantity to report, and a bound on it would be a bound
 *          on the tectonics of six places.
 *      (b) DOES OUR FOOTPRINT HAVE THE SHAPE OF ITS FOOTPRINT, given the same
 *          source? Our stadium at the found strike against ShakeMap's MMI VII
 *          at the same rupture: the axis of each (rule 305), the areas, and the
 *          intersection over union. This is E1's question asked about shape
 *          instead of about amplitude. The amplitude gap is known going in —
 *          our ring is 0.46 of ShakeMap's equivalent radius — and is neither
 *          re-measured nor repaired here; it drags the intersection over union
 *          down and that is stated with the number rather than corrected out of
 *          it. Printed, not bounded: the bound belongs to E1, and E1 is scored
 *          on three hundred maps and not on six.
 *
 *      (c) The configuration is a choice, and is declared with the result. The
 *          installation's own test configuration is used, with the
 *          ground-motion model set named per event — a subduction-interface set
 *          where rule 296 said interface, the active-crustal default where rule
 *          300(b) said crustal — because ShakeMap picks that set through its
 *          `select` module, which shells out to STREC, which is not installed.
 *          That configuration's Vs30 grid covers California and nothing else,
 *          so every preset here runs on the configuration's default Vs30. The
 *          dip given to the rupture is 15° for an interface and 90° for a
 *          crustal strike-slip, from the source type and not from Slab2, since
 *          rule 302 keeps this round out of the dip. All three change the
 *          amplitude; none of them changes the azimuth, which is what (a) and
 *          (b) measure.
 *
 * WHAT THIS CANNOT SETTLE. Whether ShakeMap is right: it is the reference, not
 * the truth, and for the great megathrusts its own footprint is drawn from
 * models conditioned on the same finite-fault inversions the published strikes
 * come from, so (a) of rule 304 is closer to a consistency check than to an
 * independent test. Question (b) is the independent one, and it tests the
 * ORIENTATION only — it says nothing about our amplitude, which
 * `docs/SHAKEMAP_SETUP.md` already records as 0.46 of ShakeMap's radius and
 * which is a different debt, in a different block.
 */

/**
 * THE OUTCOME OF RULE 308, measured on 20 September 2026 with ShakeMap 4
 * (`shakemap-modules` 1.2.4, `esi-shakelib` 1.2.6, Python 3.12), its own test
 * configuration, gmpe `subduction_interface_nshmp2014` for the five interface
 * events and `active_crustal_nshmp2014` for Kokoxili, gmice WGRW12, ipe
 * AllenEtAl2012, default Vs30, no stations, no intensity reports. Twelve runs,
 * two per preset, differing in one input.
 *
 * | preset      | strike given | ShakeMap's axis | at north | aspect | IoU of the two runs | MMI VII area (strike / north) | people under (strike / north) |
 * |-------------|-------------:|----------------:|---------:|-------:|--------------------:|------------------------------:|------------------------------:|
 * | Tōhoku      |       199.5° |           18.9° |     0.7° |   1.89 |               0.776 |   560 400 / 561 471 km²       |        58.37 M / 55.03 M      |
 * | Kokoxili    |        83.5° |           83.5° |   180.0° |   2.24 |               0.318 |    33 858 /  33 888 km²       |         0.00 M /  0.00 M      |
 * | Sumatra     |       327.2° |          147.2° |     0.0° |   2.92 |               0.444 |   943 675 / 942 064 km²       |        19.93 M /  7.35 M      |
 * | Valdivia    |        11.2° |           10.4° |   179.1° |   2.19 |               0.824 | 1 248 731 / 1 251 290 km²     |        19.33 M / 17.62 M      |
 * | Alaska      |       234.8° |           54.3° |     1.7° |   1.94 |               0.480 |   674 234 / 685 434 km²       |         0.51 M /  0.61 M      |
 * | Gorkha      |       281.8° |          101.9° |     0.1° |   1.44 |               0.596 |    35 553 /  35 602 km²       |         7.81 M /  8.18 M      |
 *
 * THE HARNESS IS SOUND, and this had to be checked before anything else was
 * read from the table. ShakeMap's own footprint comes back pointing where the
 * rupture it was handed points, modulo 180 and within a degree on all six:
 * 199.5 → 18.9 against the 19.5 expected, 83.5 → 83.5, 327.2 → 147.2, 11.2 →
 * 10.4, 234.8 → 54.3, 281.8 → 101.9. At north every axis is 0 to 1.7°. So the
 * rupture GeoJSON this harness writes is read as written, and rule 305's axis
 * recovers an orientation from a footprint drawn by a program that knows
 * nothing about rule 305.
 *
 * WHAT NORTH COST, which is rule 308(a) and the reason for running this at all.
 * Rotating the rupture by the angle the default was wrong by moves between 18 %
 * and 68 % of the MMI VII footprint onto different ground — an intersection
 * over union of 0.318 at Kokoxili, where the strike was wrong by 83°, and 0.824
 * at Valdivia, where north happened to be nearly right.
 *
 * AND THE AREA BARELY MOVES WHILE THE PEOPLE DO. Every pair of areas agrees
 * within 1.7 %, because turning a rupture does not change how much ground
 * shakes; and under Sumatra the population inside MMI VII goes from 7.35 M at
 * north to 19.93 M at the strike the lookup found — a factor of 2.7, twelve and
 * a half million people. Turning the fault does not change how much ground
 * shakes. It changes WHOSE ground. That is the whole case for this block, and
 * it is now measured by the field's program rather than argued from ours.
 *
 * WHAT THIS IS NOT. It is not rule 307, which stays PENDING: none of the twelve
 * runs was compared against the published ShakeMap of its earthquake, because
 * those coverages were not fetched. Nothing above says our strike is right —
 * that is rules 295 to 303, measured against published finite-fault strikes.
 * This says what the error was worth.
 *
 * A DEFECT IN THE COMPARISON, found and fixed before the table above was
 * written, recorded because the first numbers were printed and were wrong:
 * ShakeMap chooses its own grid for every run, and the two runs of Valdivia came
 * back with origins 0.07° apart and cell sizes differing in the fourth decimal.
 * Read off their native cells, two masks then share no cell at all and their
 * agreement is near zero whatever the shapes: Valdivia came out at 0.025 for an
 * 11° rotation, which is impossible and was the tell. Both masks are now
 * sampled onto one fixed 0.02° lattice, finer than either grid. The twelve runs
 * were not repeated — the fix is in the arithmetic that reads them, not in
 * anything ShakeMap computed.
 */
export const STRIKE_AGAINST_SHAKEMAP_308 =
  'MEASURED 20 September 2026: ShakeMap run twice per preset, one input different. Its own footprint points where the rupture it is given points (within 1\u00b0 on all six), so the harness is sound; and the strike the lookup found moves 18 % to 68 % of the MMI VII footprint off the ground due north put it on, at almost unchanged area — 943 675 km\u00b2 against 942 064 at Sumatra — while the population inside goes from 7.35 M to 19.93 M. Turning the fault does not change how much ground shakes; it changes whose. Rule 307 stays PENDING: no run was held against a published map.';

/** Rule 305: the band whose mask is measured, as `pnpm shakemap:build` rounds
 *  an intensity. */
export const FOOTPRINT_MMI = 6.5;

/** Rule 306(a): below this a footprint is round, and a round shape has no
 *  orientation to be right or wrong about. */
export const MINIMUM_ASPECT_RATIO = 1.2;

/** A cell of a coverage, as rule 305 weighs it. */
export interface FootprintCell {
  latitude: number;
  longitude: number;
  /** Ground area of the cell (m²), which is its weight. */
  areaM2: number;
}

/** What rule 305 reads out of a footprint. */
export interface FootprintOrientation {
  /** Principal axis, degrees from north, in [0, 180). */
  axisDeg: number;
  /** √(λ₁/λ₂) — 1 is a disc, large is a line. */
  aspectRatio: number;
  centroid: { latitude: number; longitude: number };
  cells: number;
  areaM2: number;
}

/**
 * Rule 305: the principal axis of a set of cells, area-weighted, about their
 * own centroid, in the local tangent plane.
 *
 * Null where there are no cells, no area, or the tensor is degenerate — a
 * single cell has no orientation, and neither has a perfect disc.
 */
export function footprintOrientation(cells: readonly FootprintCell[]): FootprintOrientation | null {
  let weight = 0;
  let latSum = 0;
  let lonSum = 0;
  for (const c of cells) {
    if (!(c.areaM2 > 0)) continue;
    weight += c.areaM2;
    latSum += c.areaM2 * c.latitude;
    lonSum += c.areaM2 * c.longitude;
  }
  if (!(weight > 0)) return null;
  const lat0 = latSum / weight;
  const lon0 = lonSum / weight;
  const cosLat = Math.cos((lat0 * Math.PI) / 180);

  // Second moments: x east, y north, in degrees scaled to be metric.
  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  let n = 0;
  for (const c of cells) {
    if (!(c.areaM2 > 0)) continue;
    let dLon = c.longitude - lon0;
    if (dLon > 180) dLon -= 360;
    if (dLon < -180) dLon += 360;
    const x = dLon * cosLat;
    const y = c.latitude - lat0;
    sxx += c.areaM2 * x * x;
    syy += c.areaM2 * y * y;
    sxy += c.areaM2 * x * y;
    n += 1;
  }
  sxx /= weight;
  syy /= weight;
  sxy /= weight;

  const trace = sxx + syy;
  const diff = Math.sqrt((sxx - syy) * (sxx - syy) + 4 * sxy * sxy);
  const major = (trace + diff) / 2;
  const minor = (trace - diff) / 2;
  if (!(major > 0)) return null;

  // The eigenvector of the larger eigenvalue, as a bearing from north.
  const angleFromEast = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const bearing = 90 - (angleFromEast * 180) / Math.PI;
  const axisDeg = ((bearing % 180) + 180) % 180;

  return {
    axisDeg,
    aspectRatio: minor > 0 ? Math.sqrt(major / minor) : Number.POSITIVE_INFINITY,
    centroid: { latitude: lat0, longitude: lon0 },
    cells: n,
    areaM2: weight,
  };
}

/** Rule 307(a): how well two masks agree, as intersection over union. The masks
 *  are sets of cell keys on one common lattice. */
export function intersectionOverUnion(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  if (a.size === 0 && b.size === 0) return Number.NaN;
  let intersection = 0;
  for (const key of a) if (b.has(key)) intersection += 1;
  const union = a.size + b.size - intersection;
  return union > 0 ? intersection / union : Number.NaN;
}
