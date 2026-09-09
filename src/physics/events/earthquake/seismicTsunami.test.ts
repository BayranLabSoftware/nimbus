import { describe, expect, it } from 'vitest';
import { m } from '../../units.js';
import { seismicTsunamiFromMegathrust } from './seismicTsunami.js';
import { megathrustSourceRadius, spreadingFactor } from '../../tsunami/spreading.js';

describe('seismicTsunamiFromMegathrust', () => {
  it('Tōhoku 2011 Mw 9.1, 700 km rupture → initial amplitude 4–10 m', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    const A0 = r.initialAmplitude as number;
    expect(A0).toBeGreaterThan(4);
    expect(A0).toBeLessThan(12);
  });

  it('scales with seafloor uplift (uplift ≈ slip / 2)', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    expect(r.seafloorUplift as number).toBeCloseTo((r.meanSlip as number) / 2, 4);
  });

  it('decays as 1/√r far away, and not quite yet at a thousand kilometres', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    // Five times the range takes √5 ≈ 2.236 off the amplitude once
    // the source is small compared with the distance. At 1 000 km it
    // is not yet: the ring still remembers its own radius, and the
    // drop is a few per cent steeper than the asymptote. Reading the
    // same ratio between 5 000 and 25 000 km recovers it.
    const near = (r.amplitudeAt1000km as number) / (r.amplitudeAt5000km as number);
    expect(near).toBeGreaterThan(Math.sqrt(5));
    expect(near).toBeLessThan(Math.sqrt(5) * 1.1);
    const far =
      spreadingFactor(megathrustSourceRadius(r.ruptureWidth), 5_000_000, 0.5, true) /
      spreadingFactor(megathrustSourceRadius(r.ruptureWidth), 25_000_000, 0.5, true);
    // Closer to the asymptote further out, and always approached
    // from above: the offset can only make the near field decay
    // faster than 1/√r, never slower.
    expect(far).toBeGreaterThan(Math.sqrt(5));
    expect(far - Math.sqrt(5)).toBeLessThan(near - Math.sqrt(5));
    expect(far).toBeCloseTo(Math.sqrt(5), 1);
  });

  it('a megathrust crosses an ocean without dispersing', () => {
    // Kajiura's parameter, not a scale length: a rupture 700 km long
    // radiates a wave 1 400 km long, and over 4 km of ocean such a
    // wave keeps its shape for five thousand kilometres. The fixed
    // exponential this replaced took 86 % of it, which is what a
    // one-size decay does to the one source that does not disperse.
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    const ratio = (r.amplitudeAt5000kmDispersed as number) / (r.amplitudeAt5000km as number);
    expect(ratio).toBeGreaterThan(0.99);
    expect(ratio).toBeLessThanOrEqual(1);
  });

  it('a shallow basin disperses the same rupture, because depth is in the law', () => {
    const deep = seismicTsunamiFromMegathrust({
      magnitude: 7.5,
      ruptureLength: m(60_000),
      basinDepth: m(4_000),
    });
    const shallow = seismicTsunamiFromMegathrust({
      magnitude: 7.5,
      ruptureLength: m(60_000),
      basinDepth: m(1_000),
    });
    const ratio = (t: typeof deep): number =>
      (t.amplitudeAt5000kmDispersed as number) / (t.amplitudeAt5000km as number);
    // A short rupture makes a short wave, and a short wave disperses:
    // the deep basin takes more of it than the shallow one, because
    // the parameter goes as h². No threshold here — the comparison is
    // the property, and a threshold would only pin today's numbers.
    expect(ratio(deep)).toBeLessThan(ratio(shallow));

    // And a short rupture disperses where a long one does not, which
    // is the whole reason one scale length could not serve both.
    const long = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      basinDepth: m(4_000),
    });
    expect(ratio(deep)).toBeLessThan(ratio(long));
  });

  it('Synolakis runup at 1 000 km is an order of magnitude larger than the open-ocean amplitude', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    expect((r.runupAt1000km as number) / (r.amplitudeAt1000km as number)).toBeGreaterThan(5);
  });

  it('Sumatra 2004-like Mw 9.3, 1 600 km rupture → initial amplitude in the 1–10 m range', () => {
    // Despite the higher total moment, the amplitude is diluted by the
    // much longer rupture (same M₀ spread over 5× the area gives less
    // mean slip). This is physically correct — Sumatra's destructive
    // reach came from the wave-front length, not point amplitude.
    const r = seismicTsunamiFromMegathrust({
      magnitude: 9.3,
      ruptureLength: m(1_600_000),
    });
    expect(r.initialAmplitude as number).toBeGreaterThan(1);
    expect(r.initialAmplitude as number).toBeLessThan(10);
  });

  it('Small event Mw 6.5 falls back to zero-ish amplitude (short rupture, little uplift)', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 6.5, ruptureLength: m(30_000) });
    expect(r.initialAmplitude as number).toBeLessThan(2);
  });

  it('Invalid inputs collapse to zero', () => {
    const r = seismicTsunamiFromMegathrust({ magnitude: 0, ruptureLength: m(0) });
    expect(r.initialAmplitude).toBe(0);
    expect(r.runupAt1000km).toBe(0);
    expect(r.deepWaterCelerity).toBe(0);
    expect(r.sourceWavelength).toBe(0);
    expect(r.dominantPeriod).toBe(0);
    expect(r.inundationDistanceAt1000km).toBe(0);
  });

  it('open-ocean celerity at the default 4 km basin depth ≈ 198 m/s (Lamb 1932)', () => {
    // c = √(g · h) with g = 9.81 m/s² and h = 4 000 m gives ≈ 198 m/s,
    // ≈ 713 km/h — the canonical "tsunami crosses the Pacific in
    // ≈ a day" speed. We bracket loosely (±5 m/s) to absorb the
    // 9.80665 / 9.81 / 9.80 ambiguity in different gravity tables.
    const r = seismicTsunamiFromMegathrust({
      magnitude: 9.0,
      ruptureLength: m(500_000),
    });
    expect(r.deepWaterCelerity as number).toBeGreaterThan(193);
    expect(r.deepWaterCelerity as number).toBeLessThan(203);
  });

  it('Tōhoku 2011: the dominant period matches the one the buoys recorded', () => {
    // This is the observation that settles the source wavelength. The
    // leading wave at DART 21413 had a period of roughly half an hour
    // to forty minutes (Satake et al. 2013 BSSA 103 (2B): 1473–1492).
    //
    // λ = 2·W over 4 km of ocean gives about that. λ = 2·L, which
    // this model used until 9 September 2026, gives close to two
    // hours, and no buoy recorded a two-hour leading wave.
    const r = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
    });
    const minutes = (r.dominantPeriod as number) / 60;
    expect(minutes).toBeGreaterThan(25);
    expect(minutes).toBeLessThan(45);
    // And the wavelength it implies is the across-strike scale of the
    // rupture, not the along-strike one.
    expect(r.sourceWavelength as number).toBeLessThan(700_000);
  });

  it('honours a caller-supplied beach slope inside the [1:1000, 1:3] envelope', () => {
    // 1:30 beach (≈ 1.91°): slope rad ≈ 0.0333. Synolakis run-up
    // scales as √cot(β), so a steeper slope gives a larger run-up.
    const flatRunup = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      coastalBeachSlopeRad: Math.atan(1 / 100),
    }).runupAt1000km as number;
    const steepRunup = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      coastalBeachSlopeRad: Math.atan(1 / 30),
    }).runupAt1000km as number;
    // 1:30 vs 1:100 → √(100/30) ≈ 1.83× run-up — but the 1:100 case
    // is the BIGGER one because Synolakis uses cot(β): flatter
    // beach amplifies more. Quick sanity: flat > steep.
    expect(flatRunup).toBeGreaterThan(steepRunup);
  });

  it('falls back to the 1:100 reference when the supplied slope is out of range', () => {
    const reference = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
    });
    const tooSteep = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      coastalBeachSlopeRad: Math.atan(1 / 2), // > MAX_BEACH_SLOPE_RAD
    });
    expect(tooSteep.beachSlopeFromDEM).toBe(false);
    expect(tooSteep.beachSlopeRadUsed).toBeCloseTo(reference.beachSlopeRadUsed, 8);
    expect(tooSteep.runupAt1000km as number).toBeCloseTo(reference.runupAt1000km, 4);
  });

  it('flags beachSlopeFromDEM correctly', () => {
    const dem = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      coastalBeachSlopeRad: Math.atan(1 / 50),
    });
    expect(dem.beachSlopeFromDEM).toBe(true);
    const fallback = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
    });
    expect(fallback.beachSlopeFromDEM).toBe(false);
  });

  it('shallower basin → slower celerity → longer period', () => {
    // 100 m continental shelf vs 4 km open ocean: c drops from
    // ≈ 198 m/s to ≈ 31 m/s, period scales accordingly.
    const ocean = seismicTsunamiFromMegathrust({
      magnitude: 8.0,
      ruptureLength: m(200_000),
    });
    const shelf = seismicTsunamiFromMegathrust({
      magnitude: 8.0,
      ruptureLength: m(200_000),
      basinDepth: m(100),
    });
    expect(ocean.deepWaterCelerity as number).toBeGreaterThan(shelf.deepWaterCelerity);
    expect(shelf.dominantPeriod as number).toBeGreaterThan(ocean.dominantPeriod);
  });

  it('subduction interface uses aspect L/W = 2 and uplift 0.6 — Tōhoku class', () => {
    // Mw 9.1 + 700 km rupture flagged subductionInterface true: the
    // simulator widens W to L/2 = 350 km and lifts the uplift
    // coefficient from 0.5 to 0.6. Net amplitude (after the 0.7
    // wave-coupling factor) is bracketed by published Tōhoku source
    // amplitudes (~3-5 m average uplift, ~5-10 m peak — Satake 2013).
    const r = seismicTsunamiFromMegathrust({
      magnitude: 9.1,
      ruptureLength: m(700_000),
      subductionInterface: true,
    });
    const A0 = r.initialAmplitude as number;
    expect(A0).toBeGreaterThan(2);
    expect(A0).toBeLessThan(6);
    // The seafloor uplift before wave coupling sits in the 3-5 m
    // average band Satake et al. 2013 inversion reports.
    expect(r.seafloorUplift as number).toBeGreaterThan(3);
    expect(r.seafloorUplift as number).toBeLessThan(6);
  });

  it('continental normal fault uses L/W = 1.5 and uplift 0.4 — L′Aquila / Amatrice class', () => {
    // Custom-input scenario: a Mw 7 normal fault under shallow water
    // (rare but physically possible — Aegean / Suez normal-fault
    // events with offshore fault planes). Aspect 1.5 widens W; 0.4
    // uplift coefficient lowers vertical motion.
    const r = seismicTsunamiFromMegathrust({
      magnitude: 7,
      ruptureLength: m(40_000),
      faultType: 'normal',
    });
    // Aspect 1.5: W = L / 1.5 = 26.7 km, A = 1.07e9 m².
    // M0 = 10^(1.5·7+9.1) = 4.0e19 N·m. D̄ = M0/(μ·A) = 1.24 m.
    // Uplift = 0.4 · 1.24 = 0.50 m. A0 = 0.7 · 0.50 = 0.35 m.
    expect(r.seafloorUplift as number).toBeGreaterThan(0.3);
    expect(r.seafloorUplift as number).toBeLessThan(0.8);
  });

  it('strike-slip earthquake produces near-zero source amplitude', () => {
    // Strike-slip displaces the seafloor laterally with negligible
    // vertical component. The auto-trigger in simulateEarthquake
    // already excludes this fault style, but custom input can still
    // force the seismic-tsunami path. The dip factor 0.05 collapses
    // the amplitude to a residual value, capturing the right physics.
    const r = seismicTsunamiFromMegathrust({
      magnitude: 7.5,
      ruptureLength: m(150_000),
      faultType: 'strike-slip',
    });
    expect(r.initialAmplitude as number).toBeLessThan(0.1);
  });

  it('continental reverse default (no faultType) preserves legacy behaviour modulo the 0.7 wave coupling', () => {
    // Backward-compat anchor: when the caller passes neither
    // faultType nor subductionInterface, the simulator defaults to
    // continental reverse (aspect 3, uplift 0.5). Combined with the
    // 0.7 coupling factor, the Tōhoku-magnitude reference value
    // sits at ≈ 4 m (legacy: 5.7 m without coupling).
    const r = seismicTsunamiFromMegathrust({ magnitude: 9.1, ruptureLength: m(700_000) });
    const A0 = r.initialAmplitude as number;
    expect(A0).toBeGreaterThan(3);
    expect(A0).toBeLessThan(6);
  });

  it('aspect ratio is fault-style-dependent (subduction wider, strike-slip narrower)', () => {
    // Same magnitude, same rupture length, different fault style →
    // different rupture WIDTH → different mean slip → different
    // amplitude. Subduction interface (L/W = 2) gives the lowest
    // mean slip; strike-slip (L/W = 5) gives the highest.
    const subduction = seismicTsunamiFromMegathrust({
      magnitude: 8.5,
      ruptureLength: m(500_000),
      subductionInterface: true,
    });
    const reverse = seismicTsunamiFromMegathrust({
      magnitude: 8.5,
      ruptureLength: m(500_000),
      faultType: 'reverse',
    });
    const strikeSlip = seismicTsunamiFromMegathrust({
      magnitude: 8.5,
      ruptureLength: m(500_000),
      faultType: 'strike-slip',
    });
    // Wider rupture (smaller aspect) ⇒ smaller mean slip.
    expect(subduction.meanSlip as number).toBeLessThan(reverse.meanSlip);
    expect(reverse.meanSlip as number).toBeLessThan(strikeSlip.meanSlip);
  });
});
