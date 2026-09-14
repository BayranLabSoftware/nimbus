/**
 * The ground under the rings: what the harness has assumed, what the
 * browser does, and which of them the rings should stand on.
 *
 * Rules 17 to 19 chose the law that draws the intensity rings on 370
 * USGS ShakeMaps with every earthquake on reference rock, Vs30 760 m/s,
 * because rule 3 sets no Vs30 and the simulator takes rock for a Vs30
 * nobody set. The browser does not stand a pick on rock. With no Vs30
 * typed in, the store gives the simulator Wald & Allen 2007's Vs30 of
 * the slope at the epicentre, on the terrain tile the globe fetched for
 * the pick (`evaluate` in store/useAppStore.ts). Every figure the harness
 * has printed for an earthquake — the net, the sets held out by rule, the
 * choice of the rings — is a figure for a simulation a visitor sees only
 * by typing 760: the mismatch B-022 was for the rupture's shape, here for
 * the ground. And on rock Boore et al. 2014 draws MMI VII at about half
 * the ShakeMap's radius between Mw 6.5 and 7.5, where ShakeMap stands on
 * the ground's own Vs30 (the `ringsOnRock` gap).
 *
 * The rules, fixed before any row of rule 11's set or of the net was
 * run on a Vs30 other than rock, and numbered after the nineteen in
 * heldOutEvents.ts, heldOutByRule.ts and contourLaws.ts:
 *
 *  20. The site as the browser takes it. For each row of rule 11's set
 *      and each earthquake of the net, the Vs30 the store gives the
 *      simulator when that epicentre is picked with no Vs30 typed in and
 *      the terrain under it has arrived: `waldAllen2007Vs30FromSlope` of
 *      `sampleSlope` at the epicentre, on the grid
 *      `fetchTerrainGridForLocation` builds for it — the zoom-8
 *      Terrarium tile under the pick; the nine around it resampled, where
 *      less than a quarter of that tile is land; the strip along the
 *      rupture `terrainSpanForEarthquake` asks for, where a row sets a
 *      strike (rule 3 sets none, and the net's presets some). The tiles
 *      are chosen and resampled by that code, as it stands after B-025,
 *      handed a loader that reads them in Node (terrainSite.ts, whose
 *      test holds its thrift to the whole grid). The elevation, the slope
 *      and the Vs30 are written by scripts/build-site-vs30.ts into
 *      siteVs30Data.ts, with the day the tiles were read, and committed
 *      before any earthquake is scored on them.
 *  21. The site rule, chosen on shaking. Three candidates, written here
 *      before any was scored: `pick`, rule 20's, the one the browser
 *      ships; `rock`, 760 m/s, the one the harness has run; and
 *      `pickOnLand`, rule 20's where the epicentre stands at or above sea
 *      level on its grid and rock where it is under the sea — the slope
 *      of a sea floor says nothing of the ground under the people the
 *      shaking reaches. Each is scored as rule 18 scores a law, on the
 *      same ShakeMaps, with the law rule 19 adopted, Boore et al. 2014.
 *      `pick` stays unless another beats it by 0.05; a winner that does
 *      is then checked on the dead as rule 19 checks a law, against
 *      `pick`'s tolls, and if it fails `pick` stays.
 *  22. The law once more. On the site rule that 21 leaves, rules 18 and
 *      19 are applied once more to rule 17's three laws, with Boore et
 *      al. 2014 the law in place: it stays unless another beats it by
 *      0.05 on the ShakeMaps and passes on the dead. The harness then runs
 *      every earthquake it scores — rule 11's set and the net — on the
 *      site rule and the law that result, and the browser takes them if
 *      they are not its own already: a harness that measures a
 *      simulation the browser does not run measures nothing a visitor
 *      reads. The report prints the figures on rock beside the new ones
 *      and every candidate's figures whatever they read. Rows of the net
 *      that leave their band are ungated with their cause, and nothing is
 *      re-tuned (rules 5 and 6).
 *
 * What one site cannot be. ShakeMap reads each cell's Vs30 off a map of
 * the ground; the simulator draws every ring on the one Vs30 at the
 * epicentre. The candidates are compared on that footing, and nothing
 * here turns a site into a map. Nor is Wald & Allen's slope a
 * measurement of Vs30: it is the proxy USGS draws its global map with,
 * and its scatter is in the band (uq/conventions.ts).
 *
 * Run once, on 14 September 2026, and said here rather than folded into
 * the rules above: rock won on the ShakeMaps and lost on the tolls, so
 * `pick` stands, and on it Boore et al. 2014 stays. The harness runs
 * every earthquake on `pick` since (heldOutByRule.ts, recordedTolls.ts,
 * shakemapFootprint.ts); the browser already did. The figures, and what
 * was read in them afterwards, are in docs/SCIENCE.md, "The ground under
 * the rings", and the `ringsOnRock` gap has been `inventedShaking` since.
 */

export type SiteRule = 'pick' | 'rock' | 'pickOnLand';

export const SITE_RULES: readonly SiteRule[] = ['pick', 'rock', 'pickOnLand'];

/** A site as rule 20 measures it. */
export interface SiteRow {
  /** Rule 11's ComCat event, or the name of the net's row. */
  key: string;
  latitude: number;
  longitude: number;
  /** Tiles the browser fetches for the pick: one, the nine of a block,
   *  or a strip's. */
  tiles: number;
  /** Elevation at the epicentre on the browser's grid, m. */
  elevationM: number;
  /** Slope at the epicentre on the browser's grid, radians. */
  slopeRad: number;
  /** Rule 20's Vs30, m/s. */
  vs30: number;
}

/**
 * The Vs30 a site rule gives the simulator for a row. Undefined is
 * rock: the simulator's own reading of a Vs30 nobody set, and the
 * browser's when the terrain never arrived.
 */
export function siteVs30(rule: SiteRule, site: SiteRow | undefined): number | undefined {
  if (rule === 'rock' || site === undefined) return undefined;
  if (rule === 'pickOnLand' && site.elevationM < 0) return undefined;
  return site.vs30;
}
