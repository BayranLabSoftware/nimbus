/**
 * The run of rules 605 to 612: the possibility lens on accounting.
 *
 *   pnpm exec tsx scripts/benchmark/conservation.ts
 */
import { mulberry32 } from '../../src/physics/montecarlo/sampling.js';
import {
  BULK_TO_DRE,
  CONSERVATION_QUESTIONS,
  CRUSTAL_RIGIDITY_PA,
  MAX_CREDIBLE_SLIP_M,
  radiatedSeismicEnergy,
  seismicMomentOf,
  type ConservationQuestion,
} from '../../src/physics/validation/conservationRules.js';
import { SWEEP_SEED } from '../../src/physics/validation/physicalInvariantRules.js';
import { HAZARDS, type Json } from './invariants.js';

const SCENARIOS = Number(process.env.NIMBUS_INV_SCENARIOS ?? 5_000);

interface Hit {
  ratio: number;
  detail: string;
}
const hits = new Map<ConservationQuestion, Hit[]>();
const asked = new Map<ConservationQuestion, number>();
for (const q of CONSERVATION_QUESTIONS) {
  hits.set(q, []);
  asked.set(q, 0);
}

const at = (o: unknown, p: string): number | undefined => {
  const v = p.split('.').reduce<unknown>((a, k) => (a as Json | undefined)?.[k], o);
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
};

/** Rule 609: a question is only asked of a scenario that carries it. */
function ask(q: ConservationQuestion, got: number, allowed: number, detail: string): void {
  if (!(Number.isFinite(got) && Number.isFinite(allowed)) || allowed <= 0) return;
  asked.set(q, (asked.get(q) ?? 0) + 1);
  if (got > allowed) hits.get(q)?.push({ ratio: got / allowed, detail });
}

/** Rule 606(e): the transient bowl, a paraboloid of depth D/(2√2). */
const transientBowlVolume = (diameter: number): number =>
  (Math.PI * diameter ** 3) / (16 * Math.SQRT2);

/**
 * Rule 606(e): the blanket's own profile. The model prints a thickness at
 * two crater radii and at ten, so the power law through them is its own,
 * and it is integrated from the rim out to where it reaches 1 mm.
 */
function blanketVolume(
  craterRadius: number,
  thicknessAt2R: number,
  thicknessAt10R: number,
  edge1mm: number
): number | undefined {
  if (!(craterRadius > 0 && thicknessAt2R > 0 && thicknessAt10R > 0 && edge1mm > craterRadius)) {
    return undefined;
  }
  const exponent = Math.log(thicknessAt10R / thicknessAt2R) / Math.log(5);
  // t(r) = thicknessAt2R · (r / 2R)^exponent, integrated as 2π ∫ t r dr.
  const p = exponent + 2;
  const scale = thicknessAt2R / (2 * craterRadius) ** exponent;
  if (Math.abs(p) < 1e-9) return undefined;
  return ((2 * Math.PI * scale) / p) * (edge1mm ** p - craterRadius ** p);
}

for (const hazard of HAZARDS) {
  const rng = mulberry32(SWEEP_SEED(hazard.name));
  const u = (): number => rng.next();
  for (let i = 0; i < SCENARIOS; i++) {
    let r: Json;
    try {
      r = hazard.run(hazard.sample(u));
    } catch {
      continue;
    }

    if (hazard.name === 'volcano') {
      // (a) the ash that lands is not more than the ash that came out
      const area = at(r, 'ashfallArea1mm');
      const erupted = at(r, 'inputs.totalEjectaVolume');
      if (area !== undefined && erupted !== undefined) {
        ask(
          'ashLandsNoDeeperThanItErupted',
          area * 0.001,
          erupted * BULK_TO_DRE,
          `1 mm contour holds ≥ ${((area * 0.001) / 1e9).toPrecision(3)} km³ of ${((erupted * BULK_TO_DRE) / 1e9).toPrecision(3)} km³ erupted`
        );
      }
      // (b) a lahar deposits no more than its own volume
      const inundation = at(r, 'laharInundationArea');
      const cross = at(r, 'laharCrossSection');
      const swath = at(r, 'laharSwathWidth');
      const laharVolume = at(r, 'inputs.laharVolume');
      if (
        inundation !== undefined &&
        cross !== undefined &&
        swath !== undefined &&
        swath > 0 &&
        laharVolume !== undefined
      ) {
        const deposited = inundation * (cross / swath);
        ask(
          'laharDepositsNoMoreThanItsVolume',
          deposited,
          laharVolume,
          `${deposited.toPrecision(3)} m³ over ${(inundation / 1e6).toPrecision(3)} km² of ${laharVolume.toPrecision(3)} m³`
        );
      }
    }

    if (hazard.name === 'impact') {
      // (c) the air gets no more than the body had
      const ke = at(r, 'impactor.kineticEnergyMegatons');
      for (const path of ['entry.atmosphericYieldMegatons', 'entry.blastYieldMegatons']) {
        const y = at(r, path);
        if (y !== undefined && ke !== undefined && y > 0) {
          ask(
            'airGetsNoMoreThanTheBodyHad',
            y,
            ke,
            `${path}: ${y.toPrecision(4)} Mt of ${ke.toPrecision(4)} Mt`
          );
        }
      }
      // (d) a seismic magnitude implies no more energy than the event had
      const magnitude = at(r, 'seismic.magnitude');
      const joules = at(r, 'impactor.kineticEnergy');
      if (magnitude !== undefined && joules !== undefined && magnitude > 0) {
        ask(
          'seismicImpliesNoMoreThanTheEventHad',
          radiatedSeismicEnergy(magnitude),
          joules,
          `M ${magnitude.toFixed(2)} implies ${radiatedSeismicEnergy(magnitude).toPrecision(3)} J of ${joules.toPrecision(3)} J`
        );
      }
      // (e) the blanket holds no more rock than the crater lost
      const rim = at(r, 'damage.craterRim');
      const t2 = at(r, 'ejecta.thicknessAt2R');
      const t10 = at(r, 'ejecta.thicknessAt10R');
      const edge = at(r, 'ejecta.blanketEdge1mm');
      const transient = at(r, 'crater.transientDiameter');
      if (
        rim !== undefined &&
        t2 !== undefined &&
        t10 !== undefined &&
        edge !== undefined &&
        transient !== undefined
      ) {
        const volume = blanketVolume(rim, t2, t10, edge);
        if (volume !== undefined) {
          ask(
            'blanketHoldsNoMoreThanTheCraterLost',
            volume,
            transientBowlVolume(transient),
            `blanket ${(volume / 1e9).toPrecision(3)} km³ of a ${(transientBowlVolume(transient) / 1e9).toPrecision(3)} km³ bowl (transient ${(transient / 1_000).toFixed(2)} km)`
          );
        }
      }
    }

    if (hazard.name === 'earthquake') {
      const moment = at(r, 'seismicMoment');
      // (f) aftershocks release no more moment than the mainshock
      const events = (r as { aftershocks?: { events?: { magnitude?: number }[] } }).aftershocks
        ?.events;
      if (moment !== undefined && Array.isArray(events) && events.length > 0) {
        let sum = 0;
        let largest = -Infinity;
        for (const e of events) {
          if (typeof e.magnitude !== 'number' || !Number.isFinite(e.magnitude)) continue;
          sum += seismicMomentOf(e.magnitude);
          largest = Math.max(largest, e.magnitude);
        }
        ask(
          'aftershocksReleaseNoMoreThanTheMainshock',
          sum,
          moment,
          `${String(events.length)} aftershocks sum to ${sum.toPrecision(3)} N·m of ${moment.toPrecision(3)} N·m, largest M ${largest.toFixed(2)}`
        );
        const mainshock = at(r, 'inputs.magnitude');
        if (mainshock !== undefined && Number.isFinite(largest)) {
          ask(
            'aftershocksReleaseNoMoreThanTheMainshock',
            seismicMomentOf(largest),
            seismicMomentOf(mainshock),
            `largest aftershock M ${largest.toFixed(2)} against a mainshock M ${mainshock.toFixed(2)}`
          );
        }
      }
      // (g) a fault slips what a fault can slip
      const length = at(r, 'ruptureLength');
      const width = at(r, 'ruptureWidth');
      if (
        moment !== undefined &&
        length !== undefined &&
        width !== undefined &&
        length * width > 0
      ) {
        const slip = moment / (CRUSTAL_RIGIDITY_PA * length * width);
        ask(
          'aFaultSlipsWhatAFaultCanSlip',
          slip,
          MAX_CREDIBLE_SLIP_M,
          `M ${(at(r, 'inputs.magnitude') ?? 0).toFixed(2)} on ${(length / 1_000).toFixed(0)} × ${(width / 1_000).toFixed(0)} km implies ${slip.toFixed(1)} m of slip`
        );
      }
    }
  }
}

console.log(
  `Rules 605 to 612 — ${String(SCENARIOS)} scenarios per domain, the sweep's own seeds\n`
);
console.log('question                                     asked   failed      worst');
for (const q of CONSERVATION_QUESTIONS) {
  const found = (hits.get(q) ?? []).slice().sort((a, b) => b.ratio - a.ratio);
  const count = asked.get(q) ?? 0;
  if (count === 0) {
    console.log(`${q.padEnd(44)} NOTHING TO READ`);
    continue;
  }
  const worst = found[0];
  console.log(
    `${q.padEnd(44)} ${String(count).padStart(6)} ${String(found.length).padStart(8)} ${
      worst === undefined ? '         —' : `${worst.ratio.toPrecision(4)}×`.padStart(10)
    }`
  );
  for (const f of found.slice(0, 4)) console.log(`    ${f.ratio.toPrecision(4)}×  ${f.detail}`);
  if (found.length > 4) console.log(`    … and ${String(found.length - 4)} more`);
}
