/**
 * The run of rules 586 to 592: the audit's seventh question, asked.
 *
 *   pnpm exec tsx scripts/benchmark/toll-invariants.ts
 */
import {
  blastCasualtyPlan,
  estimateCasualties,
  pyroclasticCasualtyPlan,
  shakingCasualtyPlan,
  type CasualtyPlan,
} from '../../src/physics/casualties.js';
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import { SWEEP_SEED } from '../../src/physics/validation/physicalInvariantRules.js';
import {
  PEOPLE_PER_SQUARE_KM,
  ROUNDING_SLACK_PER_BAND,
  TOLL_INVARIANTS,
  type TollInvariant,
} from '../../src/physics/validation/tollInvariantRules.js';
import { m, type Joules } from '../../src/physics/units.js';
import { HAZARDS, type Json } from './invariants.js';

const SCENARIOS = Number(process.env.NIMBUS_INV_SCENARIOS ?? 5_000);

const hits = new Map<TollInvariant, string[]>();
for (const q of TOLL_INVARIANTS) hits.set(q, []);
const note = (q: TollInvariant, detail: string): void => {
  hits.get(q)?.push(detail);
};

const num = (v: unknown): number | undefined => (typeof v === 'number' ? v : undefined);
const at = (o: unknown, p: string): number | undefined =>
  num(p.split('.').reduce<unknown>((a, k) => (a as Json | undefined)?.[k], o));

/** Rule 587: a hundred people to the square kilometre, everywhere. */
const peopleInside = (radiusM: number): number =>
  (PEOPLE_PER_SQUARE_KM * Math.PI * radiusM * radiusM) / 1e6;

/** Which plan a domain's result makes, if any. */
function planFor(hazard: string, r: Json): CasualtyPlan | null {
  if (hazard === 'earthquake') {
    const r7 = at(r, 'shaking.mmi7Radius');
    const r8 = at(r, 'shaking.mmi8Radius');
    const r9 = at(r, 'shaking.mmi9Radius');
    if (r7 === undefined || r8 === undefined || r9 === undefined) return null;
    return shakingCasualtyPlan({ mmi7Radius: m(r7), mmi8Radius: m(r8), mmi9Radius: m(r9) });
  }
  if (hazard === 'explosion') {
    const r5 = at(r, 'blast.overpressure5psiRadiusHob');
    const r1 = at(r, 'blast.overpressure1psiRadiusHob');
    const joules = at(r, 'yield.joules');
    if (r5 === undefined || r1 === undefined || joules === undefined) return null;
    return blastCasualtyPlan({
      blastEnergy: joules as Joules,
      overpressure5psiRadius: m(r5),
      overpressure1psiRadius: m(r1),
      ...(at(r, 'thermal.thirdDegreeBurnRadius') === undefined
        ? {}
        : { thirdDegreeBurnRadius: m(at(r, 'thermal.thirdDegreeBurnRadius') ?? 0) }),
      ...(at(r, 'thermal.secondDegreeBurnRadius') === undefined
        ? {}
        : { secondDegreeBurnRadius: m(at(r, 'thermal.secondDegreeBurnRadius') ?? 0) }),
    });
  }
  if (hazard === 'impact') {
    const r5 = at(r, 'damage.overpressure5psi');
    const r1 = at(r, 'damage.overpressure1psi');
    const mt = at(r, 'entry.blastYieldMegatons');
    if (r5 === undefined || r1 === undefined || mt === undefined) return null;
    return blastCasualtyPlan({
      blastEnergy: (mt * 4.184e15) as Joules,
      overpressure5psiRadius: m(r5),
      overpressure1psiRadius: m(r1),
      ...(at(r, 'damage.thirdDegreeBurn') === undefined
        ? {}
        : { thirdDegreeBurnRadius: m(at(r, 'damage.thirdDegreeBurn') ?? 0) }),
      ...(at(r, 'damage.secondDegreeBurn') === undefined
        ? {}
        : { secondDegreeBurnRadius: m(at(r, 'damage.secondDegreeBurn') ?? 0) }),
    });
  }
  if (hazard === 'volcano') {
    const runout = at(r, 'pyroclasticRunout');
    if (runout === undefined) return null;
    return pyroclasticCasualtyPlan({ pyroclasticRunout: m(runout) });
  }
  return null;
}

let scenarios = 0;
let withPlan = 0;
let bandsSeen = 0;
for (const hazard of HAZARDS) {
  const rng = mulberry32(SWEEP_SEED(hazard.name));
  const u = (): number => rng.next();
  for (let i = 0; i < SCENARIOS; i++) {
    const input = hazard.sample(u);
    let result: Json;
    try {
      result = hazard.run(input);
    } catch {
      continue;
    }
    scenarios++;
    let plan: CasualtyPlan | null;
    try {
      plan = planFor(hazard.name, result);
    } catch {
      continue;
    }
    if (plan === null || plan.bands.length === 0) continue;
    withPlan++;
    bandsSeen += plan.bands.length;

    const cumulative = plan.bands.map((b) => peopleInside(b.outerRadiusM));
    let e;
    try {
      e = estimateCasualties(plan, cumulative);
    } catch (err) {
      note('nothingNegative', `${hazard.name}: estimate threw ${String(err).slice(0, 60)}`);
      continue;
    }
    const where = `${hazard.name}/${plan.model}`;

    // (a) a toll inside its exposure
    if (e.deaths > e.exposed + 1) {
      note('tollInsideItsExposure', `${where}: ${e.deaths.toFixed(0)} of ${e.exposed.toFixed(0)}`);
    }
    // (b) a band that contains its estimate
    if (!(e.deathsLow <= e.deaths + 1 && e.deaths <= e.deathsHigh + 1)) {
      note(
        'bandContainsEstimate',
        `${where}: ${e.deathsLow.toFixed(0)} | ${e.deaths.toFixed(0)} | ${e.deathsHigh.toFixed(0)}`
      );
    }
    // (c) the parts sum to the whole
    const slack = ROUNDING_SLACK_PER_BAND * plan.bands.length + 1;
    if (Math.abs(e.promptDeaths + e.delayedDeaths - e.deaths) > slack) {
      note(
        'partsSumToWhole',
        `${where}: ${e.promptDeaths.toFixed(0)} + ${e.delayedDeaths.toFixed(0)} != ${e.deaths.toFixed(0)}`
      );
    }
    // (d) each band inside its own people
    for (const [k, b] of e.bands.entries()) {
      const people = (cumulative[k] ?? 0) - (cumulative[k - 1] ?? 0);
      if (b.deaths > people + 1) {
        note(
          'bandInsideItsPeople',
          `${where} band ${b.key}: ${String(b.deaths)} of ${people.toFixed(0)}`
        );
      }
    }
    // (e) nothing negative
    for (const [k, v] of Object.entries(e)) {
      if (typeof v === 'number' && Number.isFinite(v) && v < 0) {
        note('nothingNegative', `${where}: ${k} = ${v.toPrecision(4)}`);
      }
    }
    for (const b of e.bands) {
      if (b.deaths < 0) note('nothingNegative', `${where} band ${b.key}: ${String(b.deaths)}`);
    }
  }
}

console.log(`Rules 586 to 592 — ${String(SCENARIOS)} scenarios per domain, the sweep's own seeds`);
console.log(`people: ${String(PEOPLE_PER_SQUARE_KM)} to the square kilometre, everywhere\n`);
console.log(`scenarios run:            ${String(scenarios)}`);
console.log(`of which made a plan:     ${String(withPlan)}`);
console.log(`bands in those plans:     ${String(bandsSeen)}\n`);
console.log('invariant                 violations');
for (const q of TOLL_INVARIANTS) {
  const found = hits.get(q) ?? [];
  console.log(`${q.padEnd(24)} ${String(found.length).padStart(10)}`);
  for (const f of found.slice(0, 4)) console.log(`    ${f}`);
  if (found.length > 4) console.log(`    … and ${String(found.length - 4)} more`);
}
