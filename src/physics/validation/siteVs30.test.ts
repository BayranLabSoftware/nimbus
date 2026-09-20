import { describe, expect, it } from 'vitest';
import { waldAllen2007Vs30FromSlope } from '../elevation/index.js';
import { simulateEarthquake } from '../events/earthquake/simulate.js';
import { compareContourLaws, compareSiteRules } from './contourComparison.js';
import { chooseCandidate } from './contourLaws.js';
import { RULE_EARTHQUAKES, ruleSiteVs30 } from './heldOutByRule.js';
import { RULE_SHAKEMAPS } from './ruleShakemapData.js';
import { NCEI_EARTHQUAKE_ROWS } from './heldOutByRuleData.js';
import { RECORDED_EVENTS } from './recordedTolls.js';
import { SITE_RULES, siteVs30, type SiteRow } from './siteVs30.js';
import { NET_SITES, RULE_SITES } from './siteVs30Data.js';

/**
 * Rule 20's sites are the rows they claim to be, rule 21's candidates
 * give the simulator what they say they give, and the choice between
 * them keeps the rule in place unless beaten by the margin. Nothing here
 * scores an earthquake on a ShakeMap or a toll.
 */

const site = (elevationM: number, vs30: number): SiteRow => ({
  key: 'test',
  latitude: 0,
  longitude: 0,
  tiles: 1,
  elevationM,
  slopeRad: 0.01,
  vs30,
});

describe("rule 21's site rules", () => {
  it('give the pick its own Vs30, rock nothing, and the sea floor rock on land-only', () => {
    expect(siteVs30('pick', site(120, 310))).toBe(310);
    expect(siteVs30('pick', site(-2_400, 180))).toBe(180);
    expect(siteVs30('rock', site(120, 310))).toBeUndefined();
    expect(siteVs30('pickOnLand', site(120, 310))).toBe(310);
    expect(siteVs30('pickOnLand', site(0, 310))).toBe(310);
    expect(siteVs30('pickOnLand', site(-2_400, 180))).toBeUndefined();
    // No site measured is what the browser does without terrain: rock.
    expect(siteVs30('pick', undefined)).toBeUndefined();
  });

  it('read nothing as rock, as the simulator does', () => {
    const rock = simulateEarthquake({ magnitude: 7, faultType: 'reverse' });
    const typed = simulateEarthquake({ magnitude: 7, faultType: 'reverse', vs30: 760 });
    expect(rock.shaking.mmi7Radius).toBe(typed.shaking.mmi7Radius);
    const soft = simulateEarthquake({ magnitude: 7, faultType: 'reverse', vs30: 300 });
    expect(soft.shaking.mmi7Radius as number).toBeGreaterThan(rock.shaking.mmi7Radius);
  });

  it('keep the pick unless another beats it by the margin', () => {
    const cells = (bias: number) => [{ bias }, { bias: -bias }, { bias }];
    expect(
      chooseCandidate(SITE_RULES, 'pick', {
        pick: cells(0.3),
        rock: cells(0.26),
        pickOnLand: cells(0.29),
      }).winner
    ).toBe('pick');
    expect(
      chooseCandidate(SITE_RULES, 'pick', {
        pick: cells(0.3),
        rock: cells(0.4),
        pickOnLand: cells(0.2),
      }).winner
    ).toBe('pickOnLand');
  });
});

describe("rule 20's sites, as stored", () => {
  it('are one for every row of rule 11 and every earthquake of the net', () => {
    expect(RULE_SITES.map((r) => r.key)).toEqual(NCEI_EARTHQUAKE_ROWS.map((r) => r.comcat));
    const net = RECORDED_EVENTS.filter((e) => e.run().type === 'earthquake');
    expect(NET_SITES.map((r) => r.key)).toEqual(net.map((e) => e.name));
    for (const [site, event] of NET_SITES.map((r, i) => [r, net[i]] as const)) {
      expect(site.latitude, site.key).toBe(event?.latitude);
      expect(site.longitude, site.key).toBe(event?.longitude);
    }
  });

  it('carry the Vs30 of their own slope', () => {
    for (const site of [...RULE_SITES, ...NET_SITES]) {
      expect(
        Math.abs(site.vs30 - waldAllen2007Vs30FromSlope(site.slopeRad)),
        site.key
      ).toBeLessThan(0.01);
    }
  });
});

describe('rules 21 and 22, as they ran', () => {
  it("chose rock on the ShakeMaps, and kept Boore et al. 2014 on the browser's ground", () => {
    // Rock then lost on the tolls, 0.83 against 0.72, which the report
    // runs and prints (scripts/generate-validation-report.ts throws if the
    // rules ever leave the harness on anything but the browser's ground).
    const sites = compareSiteRules(
      RULE_SHAKEMAPS,
      new Map(RULE_SITES.map((site) => [site.key, site])),
      'boore2014'
    );
    expect(sites.winner).toBe('rock');
    // Rule 44: a re-run figure, and this one MOVED when the cell from the
    // re-filtered frontier was adopted on 20 September. Scored on today's
    // geometry, rule 18's comparison would pick `boore2014FromMw7.5` — the
    // split law — over the one that ships.
    //
    // It does NOT change what ships. Rule 19's verdict stands and rule 44
    // says its printed figures move while its verdict keeps; nothing here
    // adopts anything. But it is a live signal that the law and the
    // geometry were chosen against each other, and a round that re-opens
    // rule 18 on the adopted geometry now has a reason to.
    const laws = compareContourLaws(RULE_SHAKEMAPS, {
      inPlace: 'boore2014',
      vs30For: (row) => ruleSiteVs30(row, 'pick'),
    });
    expect(laws.winner).toBe('boore2014FromMw7.5');
  }, 30_000);

  it("stand every earthquake the harness scores on the browser's ground", () => {
    const sites = new Map(RULE_SITES.map((site) => [site.key, site]));
    for (const quake of RULE_EARTHQUAKES.slice(0, 25)) {
      const result = quake.event.run();
      if (result.type !== 'earthquake') throw new Error(quake.event.name);
      expect(result.data.inputs.vs30, quake.event.name).toBe(sites.get(quake.row.comcat)?.vs30);
    }
    for (const event of RECORDED_EVENTS) {
      const result = event.run();
      if (result.type !== 'earthquake') continue;
      const site = NET_SITES.find((s) => s.key === event.name);
      expect(result.data.inputs.vs30, event.name).toBe(site?.vs30);
    }
  });
});
