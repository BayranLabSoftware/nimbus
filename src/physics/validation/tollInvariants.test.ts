import { describe, expect, it } from 'vitest';
import {
  blastCasualtyPlan,
  estimateCasualties,
  pyroclasticCasualtyPlan,
  shakingCasualtyPlan,
  type CasualtyPlan,
} from '../casualties.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { m, type Joules } from '../units.js';
import { SWEEP_SEED } from './physicalInvariantRules.js';
import {
  PEOPLE_PER_SQUARE_KM,
  ROUNDING_SLACK_PER_BAND,
  TOLL_INVARIANTS,
} from './tollInvariantRules.js';

/**
 * Rules 586 to 592 — the audit's seventh question, asked.
 *
 * The parent audit could not ask "a toll inside its exposure" because no
 * result of the sweep carries a toll, and it printed NOTHING TO READ rather
 * than a zero. This puts synthetic people under the sweep's own scenarios —
 * a hundred to the square kilometre, everywhere — and asks five things of
 * the casualty arithmetic.
 *
 * THE FULL RUN, on 21 September 2026, over the 25 000 scenarios with the
 * sweep's own seeds — `scripts/benchmark/toll-invariants.ts`:
 *
 *   scenarios run          25 000
 *   of which made a plan   11 142
 *   bands in those plans   33 790
 *
 *   tollInsideItsExposure       0
 *   bandContainsEstimate        0
 *   partsSumToWhole             0
 *   bandInsideItsPeople         0
 *   nothingNegative             0
 *
 * Eleven thousand plans and thirty-three thousand bands, and the arithmetic
 * holds everywhere. The gap the parent audit left in its own coverage is
 * closed, and closed clean.
 *
 * This is the slice that keeps the claim alive in CI between full runs. It
 * builds its plans directly rather than through the sweep, so that it is
 * quick and reaches the corners on purpose — the script exercises the
 * sweep's own samplers.
 */

const SLICE = 120;

const peopleInside = (radiusM: number): number =>
  (PEOPLE_PER_SQUARE_KM * Math.PI * radiusM * radiusM) / 1e6;

/** Plans built from radii a domain plausibly draws, rather than from the
 *  sweep — the sweep's own samplers are exercised by the script, and a test
 *  wants to be quick and to reach the corners on purpose. */
const plans = (): { name: string; plan: CasualtyPlan }[] => {
  const out: { name: string; plan: CasualtyPlan }[] = [];
  const rng = mulberry32(SWEEP_SEED('tolls'));
  const u = (): number => rng.next();
  const logU = (a: number, b: number): number =>
    Math.exp(Math.log(a) + u() * (Math.log(b) - Math.log(a)));
  for (let i = 0; i < SLICE; i++) {
    // Shaking: three nested rings, sometimes with the inner two absent.
    const r7 = logU(1e2, 4e5);
    const r8 = r7 * (0.2 + 0.6 * u());
    const r9 = r8 * (0.1 + 0.7 * u());
    const shaking = shakingCasualtyPlan({
      mmi7Radius: m(r7),
      mmi8Radius: m(r8),
      mmi9Radius: m(r9),
    });
    if (shaking !== null) out.push({ name: 'shaking', plan: shaking });

    // Blast: a 5 psi inside a 1 psi, with burns sometimes outside both.
    const r1 = logU(1e2, 1e6);
    const r5 = r1 * (0.1 + 0.6 * u());
    const blast = blastCasualtyPlan({
      blastEnergy: (logU(4.184e9, 4.184e18) * 1) as Joules,
      overpressure5psiRadius: m(r5),
      overpressure1psiRadius: m(r1),
      ...(u() < 0.5 ? { thirdDegreeBurnRadius: m(r1 * (0.3 + u())) } : {}),
      ...(u() < 0.5 ? { secondDegreeBurnRadius: m(r1 * (0.5 + 1.5 * u())) } : {}),
    });
    if (blast !== null) out.push({ name: 'blast', plan: blast });

    // Pyroclastic: a runout, sometimes with an evacuation inside it.
    const runout = logU(1e2, 2e5);
    const pyro = pyroclasticCasualtyPlan({
      pyroclasticRunout: m(runout),
      ...(u() < 0.4 ? { evacuationRadiusM: runout * u() } : {}),
    });
    if (pyro !== null) out.push({ name: 'pyroclastic', plan: pyro });
  }
  return out;
};

describe('rules 586 to 592: the casualty arithmetic', () => {
  const built = plans();

  it('builds enough plans for the answers to mean something', () => {
    // Rule 590: a clean answer over three plans is not a clean answer.
    expect(built.length).toBeGreaterThan(200);
    expect(new Set(built.map((b) => b.name)).size).toBe(3);
  });

  it.each(['tollInsideItsExposure', 'bandContainsEstimate', 'partsSumToWhole'])(
    'holds %s on every plan of the slice',
    (which) => {
      let read = 0;
      for (const { name, plan } of built) {
        const cumulative = plan.bands.map((b) => peopleInside(b.outerRadiusM));
        const e = estimateCasualties(plan, cumulative);
        read++;
        const where = `${name}: ${e.deaths.toFixed(0)} dead of ${e.exposed.toFixed(0)}`;
        if (which === 'tollInsideItsExposure') {
          expect(e.deaths, where).toBeLessThanOrEqual(e.exposed + 1);
        } else if (which === 'bandContainsEstimate') {
          expect(e.deathsLow, where).toBeLessThanOrEqual(e.deaths + 1);
          expect(e.deaths, where).toBeLessThanOrEqual(e.deathsHigh + 1);
        } else {
          const slack = ROUNDING_SLACK_PER_BAND * plan.bands.length + 1;
          expect(Math.abs(e.promptDeaths + e.delayedDeaths - e.deaths), where).toBeLessThanOrEqual(
            slack
          );
        }
      }
      expect(read).toBeGreaterThan(200);
    }
  );

  it('holds bandInsideItsPeople on every band of every plan', () => {
    let bands = 0;
    for (const { name, plan } of built) {
      const cumulative = plan.bands.map((b) => peopleInside(b.outerRadiusM));
      const e = estimateCasualties(plan, cumulative);
      for (const [k, b] of e.bands.entries()) {
        const people = (cumulative[k] ?? 0) - (cumulative[k - 1] ?? 0);
        bands++;
        expect(
          b.deaths,
          `${name} band ${b.key}: ${String(b.deaths)} of ${people.toFixed(0)}`
        ).toBeLessThanOrEqual(people + 1);
      }
    }
    expect(bands).toBeGreaterThan(400);
  });

  it('holds nothingNegative on every count', () => {
    for (const { name, plan } of built) {
      const cumulative = plan.bands.map((b) => peopleInside(b.outerRadiusM));
      const e = estimateCasualties(plan, cumulative);
      for (const [k, v] of Object.entries(e)) {
        if (typeof v !== 'number' || !Number.isFinite(v)) continue;
        expect(v, `${name}: ${k}`).toBeGreaterThanOrEqual(0);
      }
      for (const b of e.bands) expect(b.deaths, `${name} band ${b.key}`).toBeGreaterThanOrEqual(0);
    }
  });

  it('has not grown an invariant since the rules were pushed', () => {
    expect([...TOLL_INVARIANTS]).toEqual([
      'tollInsideItsExposure',
      'bandContainsEstimate',
      'partsSumToWhole',
      'bandInsideItsPeople',
      'nothingNegative',
    ]);
  });
});
