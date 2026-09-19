/**
 * A burst that never touches the ground has no downrange.
 *
 * Nimbus draws an oblique impact's thermal and overpressure rings as ellipses:
 * a semi-major axis grown along the track, a semi-minor axis shrunk across it,
 * and the whole ellipse slid downrange by a fraction of its own radius. The
 * envelope is `obliqueImpactRingAsymmetry` in effects/asymmetry.ts, and the
 * module declares what it is: "a Nimbus fit bracketing the Pierazzo &
 * Artemieva 2003 hydrocode range, NOT their equation", α = 0.30 for an
 * overpressure ring and 0.40 for a thermal one, γ = 0.20 for the offset, each
 * multiplied by (1 − sin θ).
 *
 * It is applied to every impact, at every entry regime, and (1 − sin θ) is
 * largest at the shallow angles — which are the angles at which a body never
 * arrives. The audit of 19 September 2026 (docs/IMPACT_AUDIT.md §3.1) found
 * it on Chelyabinsk; run out over four bodies that all burst in the air:
 *
 *   20 m at 19.2 km/s, 18°   burst 30.9 km, no crater   thermal b/a = 0.675
 *   40 m at 17 km/s, 10°     burst 29.0 km, no crater   thermal b/a = 0.627
 *   30 m at 20 km/s, 45°     burst 14.3 km, no crater   thermal b/a = 0.843
 *   60 m at 20 km/s, 35°     burst  7.1 km, no crater   1 psi   b/a = 0.830,
 *                            and its centre slid 4.10 km downrange of a ring
 *                            48.1 km across — 8.5 % of R.
 *
 * Three things are wrong with that, and they are three different things.
 *
 * The domain. Pierazzo & Artemieva's hydrocode runs are of asteroids that
 * reach the ground and open craters; the envelope describes a projectile
 * whose momentum carries its melt, its vapour and its ejecta downrange of the
 * point it struck. A body that bursts at 31 km strikes nothing.
 *
 * The source. The radii those ellipses reshape do not come from a trajectory.
 * An airburst's overpressure rings are the Earth Impact Effects Program's
 * static source at the burst altitude (effects/airburstBlast.ts) and its burn
 * rings are a point fluence at the same altitude. Both are azimuthally
 * symmetric by construction, and 618 of the benchmark's 636 airburst points
 * agree with the program's own printed overpressure to within 1 %. The number
 * says "a point source overhead"; the shape says "a trajectory smeared
 * downrange". A ring cannot be both.
 *
 * The picture. On the same frame, for the same event, the globe draws an
 * altitude beacon at the event's own latitude and longitude — the burst,
 * vertically overhead — and rings whose centres are slid kilometres away from
 * under it. Whichever is right, they cannot both be.
 *
 * What the field says about exactly this. Collins, G. S., Lynch, E., McAdam,
 * R. & Davison, T. M. (2017), "A numerical assessment of simple airblast
 * models of impact airbursts", Meteoritics & Planetary Science 52 (8):
 * 1542–1560, DOI 10.1111/maps.12873 — the paper this project already takes
 * the regular-reflection relation and the factor of two from — sets three
 * models against iSALE shock-physics runs: the static source, a moving source
 * carrying two thirds internal and one third kinetic energy at the burst
 * altitude, and a cylindrical line source depositing energy along the
 * trajectory through the pancake model. Beyond three burst heights from ground
 * zero all three agree; inside it the moving source doubles the static one and
 * the line source halves it. Their conclusion, in their own words: the static
 * source "provides an adequate approximation of the azimuthally averaged
 * airblast for probabilistic hazard assessment". There is no shape law in it
 * to adopt — and the shape Nimbus drew came from somewhere else entirely.
 *
 * What was looked at before these rules were written, and is therefore not
 * held out: the abstract of Collins et al. (2017) in full; the envelope and
 * its declared provenance in effects/asymmetry.ts; the four bodies above and
 * their b/a and offsets; and the fact that `damageAsymmetry` is read by the
 * renderer and by scripts/audit-rendering-data.ts and by nothing else, so no
 * toll depends on it.
 *
 * The rules, fixed on 19 September 2026, before the candidate was written, and
 * numbered after the two hundred and thirty-four before them:
 *
 * 235. The candidate. Where the entry ends in a COMPLETE_AIRBURST — the swarm
 *      spreads above the ground and nothing arrives — every damage ring is
 *      drawn as the source it was computed from makes it: a circle about the
 *      point under the burst. Both multipliers exactly one, the centre offset
 *      exactly zero, the azimuth kept because the track is still a fact about
 *      the event. The envelope is unchanged wherever a body or a swarm reaches
 *      the ground, INTACT and PARTIAL_AIRBURST alike, because there the
 *      projectile has a downrange and a crater to put it in.
 *
 * 236. Where the domain is declared. In the law, not at the call site: the
 *      helper takes whether the event couples to the ground and returns the
 *      isotropic ring when it does not, so that a future caller cannot apply
 *      it outside its domain by forgetting to ask.
 *
 * 237. What decides. Nothing about the world; this is a category error being
 *      corrected, and the rules say so rather than dressing it as a test.
 *      What is checked is exact and mechanical:
 *      (a) every ring of a complete airburst is a circle — both multipliers
 *          1 and the offset 0, to the bit, at every angle from 1° to 89°;
 *      (b) no ring of an event that reaches the ground changes by anything,
 *          multiplier or offset, at any angle;
 *      (c) no radius moves anywhere: the change is to shape alone, and the
 *          toll is computed on radii, so no row of the calibration net and no
 *          toll may move by a single person;
 *      (d) the release gate stays PASS and the globe audit reports no finding.
 *      Any of these failing refuses the candidate.
 *
 * 238. What is printed. The four bodies above and every impact preset that
 *      bursts in the air: regime, burst altitude, b/a and centre offset before
 *      and after, and the ground area the drawn shape covers against π r².
 *      Beside them, deciding nothing: Tunguska's 2 200 km² of felled forest,
 *      which is not a circle either.
 *
 * 239. What an adoption does. The envelope's own documentation states its
 *      domain; the visual contracts of the rings that can belong to an
 *      airburst say which shape they take and why; the methodology page and
 *      the report name Collins et al. (2017) for the source being symmetric
 *      and for the gap that remains.
 *
 * 240. What is not touched. Every radius, every threshold, every toll; the
 *      crater's own envelope (Gault & Wedekind, Pierazzo & Melosh), which is
 *      about a crater and is only ever drawn where there is one; the ejecta
 *      butterfly, same; the wind drift of an explosion's burn rings, which is
 *      a different law about a different thing.
 *
 * What these rules cannot settle, and it is the important part. A circle is
 * the reference's shape, not nature's. The blast of an airburst radiates from
 * the meteoroid's trajectory — Collins et al. say so in their first sentence —
 * and the ground it damages is elongated along the track: Tunguska felled
 * 2 200 km² of forest in a butterfly, and Chelyabinsk broke glass in a band
 * along its path. The route to that shape is named and not taken here: it is
 * the cylindrical line source of Collins et al. (2017), driven by the energy
 * the pancake model deposits along the path, which this project already
 * computes for the burst altitude and does not yet integrate. Until that is
 * built and measured in a round of its own, the model draws the shape its own
 * source has and the report says plainly that the real footprint is not a
 * circle. Drawing an ellipse of the wrong size in the right direction is not
 * closer to the truth than saying what the model actually computed — it is the
 * same picture with a claim in it that nothing behind the picture supports.
 *
 * And one thing left open rather than closed: whether the envelope is founded
 * even where it is kept. The module's own comment says the numbers are a
 * project fit bracketing a hydrocode range in Pierazzo & Artemieva (2003), a
 * chapter of a GSA Special Paper this project has not read. That is a gap in
 * the cratering case, it is recorded here, and it is not this round's.
 */

/** The entry regimes that put something on the ground. Outside these there is
 *  no crater, no downrange, and no envelope. */
export const GROUND_COUPLED_REGIMES = ['INTACT', 'PARTIAL_AIRBURST'] as const;

/** The angles rule 237(a) and (b) are checked over, in degrees. */
export const SHAPE_SWEEP_ANGLES_DEG: readonly number[] = [
  1, 5, 10, 15, 18, 20, 25, 30, 35, 40, 45, 50, 60, 70, 80, 89,
];

/**
 * Tunguska's felled forest, printed beside the result by rule 238 and deciding
 * nothing: about 2 200 km², and shaped like a butterfly rather than a disc
 * (Collins et al. 2017, quoting Ben-Menahem 1975, Chyba et al. 1993, Boslough
 * & Crawford 2008 and Artemieva & Shuvalov).
 */
export const TUNGUSKA_FELLED_AREA_M2 = 2_200e6;

/**
 * The outcome of the round, written after the candidate was measured, on
 * 19 September 2026. The rules above were pushed in commit d3f566e before the
 * candidate was written.
 *
 * ADOPTED. Every check of rule 237 holds.
 *
 * (a) Circles where nothing lands. At all sixteen angles from 1° to 89°, for
 *     both variants, the envelope returns both multipliers exactly 1 and the
 *     offset exactly 0 when the event does not couple to the ground, and keeps
 *     the azimuth. The four bodies of the finding:
 *
 *       20 m, 19.2 km/s, 18°   burst 30.86 km   b/a 0.742 → 1.000
 *       40 m, 17 km/s, 10°     burst 28.97 km   b/a 0.702 → 1.000
 *       30 m, 20 km/s, 45°     burst 14.33 km   b/a 0.879 → 1.000, offset 0.52 → 0 km
 *       60 m, 20 km/s, 35°     burst  7.13 km   b/a 0.830 → 1.000, offset 4.10 → 0 km
 *
 *     All four open no crater, and every one of their five rings is now round.
 *
 * (b) Nothing moved where something lands. At the same sixteen angles the
 *     multipliers and the offset agree with the arithmetic as it stood to
 *     twelve decimal places, and a 1 km stone at 15° keeps its ellipse, its
 *     downrange offset and its crater's own envelope.
 *
 * (c) No number moved at all. The whole suite passes and
 *     docs/VALIDATION_REPORT.json regenerates byte for byte identical: not a
 *     radius, not a toll, not a row of the calibration net. That is what was
 *     expected and it is worth having checked — `damageAsymmetry` is read by
 *     the renderer and by scripts/audit-rendering-data.ts and by nothing that
 *     counts people.
 *
 * (d) Gate PASS in strict mode, and the globe audit reports no finding over
 *     all thirty scenarios.
 *
 * And one thing the round found in the project's own shipped text, which makes
 * the removal easier rather than harder. The methodology page, on the very
 * entry that computes an airburst's rings, already says: "a burst on a shallow
 * path spreads its energy along a line and damages an ellipse that reaches
 * farthest ACROSS it, which this round source does not draw", citing Gi, Brown
 * & Aftosmis (2018) for the analytic line source being inapplicable so close
 * to such a trail and noting that only three-dimensional hydrocodes have drawn
 * the shape. The envelope removed here elongated the rings ALONG the track. So
 * it was not merely the wrong size: by the project's own reading of the
 * literature it may have been the wrong direction. Which of the two the real
 * footprint takes is not settled here — it is the first question the line-
 * source round has to answer, before any axis is drawn again.
 *
 * What the round leaves standing, and it is the honest part. The picture is
 * now internally consistent — the beacon says the burst is overhead and the
 * rings agree — and it is not nature. Tunguska felled 2 200 km² of forest in a
 * butterfly, and the blast of an airburst radiates from the trajectory, not
 * from a point on it. The route is named in rule 240 and not taken: the
 * cylindrical line source of Collins et al. (2017), driven by the energy the
 * pancake model lays along the path. Until that is built and measured, the
 * model draws the shape its own source has and says so.
 */
export const AIRBURST_SHAPE_OUTCOME =
  'ADOPTED 19 September 2026: the oblique envelope no longer applies where nothing reaches the ground, every ring of a complete airburst is a circle about the point under the burst, nothing that reaches the ground changed, and no published number moved.';
