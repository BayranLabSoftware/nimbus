import { describe, expect, it } from 'vitest';
import { HAZARDS } from '../../../scripts/benchmark/invariants.js';
import { mulberry32 } from '../montecarlo/sampling.js';
import { INVARIANT_QUESTIONS, SWEEP_SEED } from './physicalInvariantRules.js';

/**
 * THE OUTCOME OF RULES 548 TO 554, run once on 21 September 2026 over the
 * 5 000 scenarios per domain the invariant sweep draws, with its own seeds:
 *
 *   nesting                  0 of  76 478 readings
 *   waveInsideItsWater       0 of   8 856
 *   tollInsideItsExposure    —  nothing to read: no result of the sweep
 *                               carries a toll at all
 *   energy                   0 of  18 704
 *   craterShape              0 of   4 015
 *   airburstIsInTheAir       0 of   5 000
 *   nothingNegative          0 of 3 681 741
 *
 * Six questions asked and answered clean, one with nothing to ask it of.
 *
 * The line that matters most is the second. `waveInsideItsWater` is B-084's
 * question, and four hours before this run it would have read 278 — the
 * defect was found by accident and closed by rules 541 to 547 the same
 * night. The audit exists because that one was found by accident, and its
 * own answer is that there was not a second of its kind.
 *
 * Six readings were WITHDRAWN as not being laws, each on grounds
 * independent of its having failed, and they are listed in
 * `scripts/benchmark/physical-invariants.ts`. The seventh question could
 * not be asked at all, because the sweep computes no tolls — a gap in the
 * sweep rather than an answer.
 *
 * This test re-asks them on a slice small enough for CI. It draws from the
 * sweep's OWN samplers rather than copies of them: the first draft of both
 * the audit and this test hand-rolled the draws and got them wrong twice —
 * paths that do not exist, and a volcano built from a `vei` when
 * `simulateVolcano` wants an erupted volume. A copy of a sampler is a
 * second thing to keep in step, and it does not get kept.
 */

/** How many of each domain the slice draws. The volcano's Tephra2 deposit
 *  is slow enough that 120 of them do not fit in a test's five seconds. */
const SLICE: Readonly<Record<string, number>> = {
  landslide: 120,
  earthquake: 120,
  explosion: 120,
  impact: 120,
  volcano: 25,
};

function leaves(value: unknown, path: string, out: Map<string, number>): void {
  if (typeof value === 'number') {
    out.set(path, value);
    return;
  }
  if (value === null || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((v, i) => leaves(v, `${path}[${i.toString()}]`, out));
    return;
  }
  for (const [k, v] of Object.entries(value)) {
    if (path === '' && k === 'inputs') continue;
    leaves(v, path === '' ? k : `${path}.${k}`, out);
  }
}

/** Every scenario of one domain's slice, as its own sampler draws it. */
const slice = (name: string): { input: Record<string, unknown>; out: Map<string, number> }[] => {
  const hazard = HAZARDS.find((h) => h.name === name);
  if (hazard === undefined) throw new Error(`no hazard ${name}`);
  const rng = mulberry32(SWEEP_SEED(name));
  const u = (): number => rng.next();
  const rows: { input: Record<string, unknown>; out: Map<string, number> }[] = [];
  for (let i = 0; i < (SLICE[name] ?? 120); i++) {
    const input = hazard.sample(u);
    try {
      const out = new Map<string, number>();
      leaves(hazard.run(input), '', out);
      rows.push({ input, out });
    } catch {
      /* a throw is `invariants.ts`'s own business, not this test's */
    }
  }
  return rows;
};

describe('rules 548 to 554: a wave inside its water', () => {
  it('holds on every landslide of the slice — the question B-084 came from', () => {
    let read = 0;
    for (const { input, out } of slice('landslide')) {
      const depth = input.meanOceanDepth;
      const amp = out.get('tsunami.sourceAmplitude');
      if (typeof depth !== 'number' || !(depth > 0) || amp === undefined || !(amp > 0)) continue;
      read++;
      expect(
        amp,
        `a ${amp.toFixed(1)} m wave in ${depth.toFixed(1)} m of water`
      ).toBeLessThanOrEqual(depth);
    }
    expect(read).toBeGreaterThan(10);
  });
});

describe('rules 548 to 554: rings nest', () => {
  const chains: Readonly<Record<string, readonly (readonly string[])[]>> = {
    earthquake: [['shaking.mmi9Radius', 'shaking.mmi8Radius', 'shaking.mmi7Radius']],
    explosion: [
      ['blast.overpressure5psiRadius', 'blast.overpressure1psiRadius', 'blast.lightDamageRadius'],
      [
        'thermal.thirdDegreeBurnRadius',
        'thermal.secondDegreeBurnRadius',
        'thermal.firstDegreeBurnRadius',
      ],
    ],
    impact: [
      ['damage.overpressure5psi', 'damage.overpressure1psi', 'damage.lightDamage'],
      ['damage.thirdDegreeBurn', 'damage.secondDegreeBurn'],
    ],
  };

  it.each(Object.keys(chains))(
    'holds for every graded ring of a %s',
    (name) => {
      let read = 0;
      for (const { out } of slice(name)) {
        for (const chain of chains[name] ?? []) {
          for (let k = 1; k < chain.length; k++) {
            const severe = out.get(chain[k - 1] ?? '');
            const mild = out.get(chain[k] ?? '');
            if (severe === undefined || mild === undefined) continue;
            if (!(severe > 0) || !(mild > 0)) continue;
            read++;
            expect(
              severe,
              `${chain[k - 1] ?? ''} ${severe.toPrecision(5)} vs ${chain[k] ?? ''} ${mild.toPrecision(5)}`
            ).toBeLessThanOrEqual(mild);
          }
        }
      }
      // The guard is against a vacuous test, not a threshold: an earthquake
      // reaches MMI IX rarely, and five readings in a hundred and twenty
      // draws is five real comparisons.
      expect(read, `${name} read nothing — the chain's paths may not exist`).toBeGreaterThan(0);
    },
    60_000
  );
});

describe('rules 548 to 554: nothing negative, and a crater is not deeper than it is wide', () => {
  const signed =
    /(azimuthDeg|Offset|offset|climateCoolingK|virtualBurstAltitude|hobScaled|seismic\.magnitude)/;

  it.each(['landslide', 'volcano', 'explosion'])(
    'finds nothing negative in a %s',
    (name) => {
      let read = 0;
      for (const { out } of slice(name)) {
        for (const [path, v] of out) {
          if (!Number.isFinite(v) || signed.test(path)) continue;
          read++;
          expect(v, `${path} = ${v.toPrecision(5)}`).toBeGreaterThanOrEqual(0);
        }
      }
      expect(read).toBeGreaterThan(100);
    },
    60_000
  );

  it('keeps an impact crater no deeper than its diameter', () => {
    let read = 0;
    for (const { out } of slice('impact')) {
      const depth = out.get('crater.depth');
      const dia = out.get('crater.finalDiameter');
      if (depth === undefined || dia === undefined || !(depth > 0) || !(dia > 0)) continue;
      read++;
      expect(depth).toBeLessThanOrEqual(dia);
    }
    expect(read).toBeGreaterThan(5);
  }, 60_000);
});

describe('the seven questions are the seven that were fixed', () => {
  it('has not grown a question since the rules were pushed', () => {
    expect([...INVARIANT_QUESTIONS]).toEqual([
      'nesting',
      'waveInsideItsWater',
      'tollInsideItsExposure',
      'energy',
      'craterShape',
      'airburstIsInTheAir',
      'nothingNegative',
    ]);
  });
});
