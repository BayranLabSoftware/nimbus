import { IMPACT_BLAST_COUPLING, STANDARD_GRAVITY } from '../../physics/constants.js';
import type { ShockArrival } from '../../physics/effects/blastWave.js';
import {
  blastWaveStateAt,
  breakawayTime,
  buildShockArrival,
  impactFireballRadius,
  joulesToKilotons,
  nuclearFireballRadius,
  shockArrivalAt,
} from '../../physics/effects/blastWave.js';
import type { ExplosionScenarioResult } from '../../physics/events/explosion/index.js';
import type { ImpactScenarioResult } from '../../physics/simulate.js';
import type { Joules, Kelvin, Meters, Seconds } from '../../physics/units.js';
import { J, m, s } from '../../physics/units.js';

/**
 * The close-up impact scene: everything the renderer needs about an
 * event, derived once from a simulation result, plus a per-frame
 * snapshot derived from that and the clock.
 *
 * The split matters. `ImpactScene` is built once per Launch and is
 * pure physics; `ImpactFrame` is rebuilt every frame and is a pure
 * function of (scene, time). Nothing in the renderer holds animation
 * state, so the view can be paused, scrubbed, or seeked from a URL and
 * always shows the same picture for the same second.
 *
 * A few quantities here exist only to be drawn — the dust column
 * opacity, the stem radius, the initial flash. They are marked
 * ILLUSTRATIVE in their doc comments and must never be surfaced as
 * readouts; the quantitative fields all trace back to
 * `physics/effects/blastWave.ts` and the modules it cites.
 */

/** Where on Earth the event happens. The renderer needs it to sample
 *  the mosaic; the mosaic loader needs it to fetch one. */
export interface SceneOrigin {
  readonly latitude: number;
  readonly longitude: number;
}

/**
 * One consequence of the event, as a ground footprint.
 *
 * The renderer draws blast and mushroom well, but those are two of the
 * nine things Nimbus computes. A viewer pulling the camera back should
 * see the thermal scorch, the ejecta blanket, the fire zone and the
 * radiation contour too — otherwise the close-up view silently claims
 * an explosion has two effects.
 *
 * `arrival` is when the effect reaches that radius, so nothing appears
 * before its own physics says it should. `material` marks whether the
 * effect CHANGES THE GROUND (thermal char, blast scour, ejecta dust)
 * or is invisible and can only honestly be drawn as a contour
 * (radiation). Painting an invisible hazard as a coloured stain would
 * be the same mistake as the retired damage discs.
 */
export type EffectKind =
  | 'crater'
  | 'ejecta'
  | 'thermal'
  | 'firestorm'
  | 'blast'
  | 'radiation'
  | 'emp';

export interface EffectZone {
  readonly id: string;
  readonly kind: EffectKind;
  /** Ground range the effect reaches (m). */
  readonly radius: Meters;
  /** When it gets there (s). */
  readonly arrival: Seconds;
  /** True when the effect visibly alters the surface. */
  readonly material: boolean;
  /** Plain-language i18n key suffix for the legend. */
  readonly labelKey: string;
}

export interface ImpactScene extends SceneOrigin {
  /** TNT-equivalent energy driving the air shock (J). For an impact
   *  this is the kinetic energy times `IMPACT_BLAST_COUPLING`, exactly
   *  as `impactDamageRadii` does, so the front and the rings agree. */
  readonly blastEnergy: Joules;
  /** Maximum luminous fireball radius (m). */
  readonly fireballRadius: Meters;
  /** Final crater rim radius (m). Zero for an airburst. */
  readonly craterRadius: Meters;
  /** Rim-to-floor crater depth (m). */
  readonly craterDepth: Meters;
  /** Outer edge of the continuous ejecta blanket (m). */
  readonly ejectaRange: Meters;
  /** Launch speed of the fastest ejecta (m/s), fixed by the blanket
   *  edge through the ballistic range — see {@link ejectaSpeedForRange}. */
  readonly ejectaLaunchSpeed: number;
  /** Outermost radius the story reaches: the 0.5 psi contour (m). */
  readonly outerRadius: Meters;
  /** How long the sequence runs in simulation seconds. */
  readonly duration: Seconds;
  /** Pre-integrated shock arrival covering [fireball, outerRadius]. */
  readonly arrival: ShockArrival;
  /** Ground radius the camera should frame at t = 0 (m). */
  readonly framingReach: Meters;
  /** Every consequence with a ground footprint, sorted outward. */
  readonly effects: readonly EffectZone[];
  /** Radius of the outermost effect (m) — how far you must pull the
   *  camera back before the whole story is in frame. */
  readonly effectsReach: Meters;
}

/**
 * Ballistic launch speed that lands material at `range` on a flat
 * surface, for the optimal 45° launch angle:
 *
 *     R = v² · sin(2θ) / g   ⇒   v = √(g · R)   at θ = 45°
 *
 * This is the constraint that keeps the rendered debris honest: the
 * particle fountain is not tuned by eye, it is required to deposit at
 * the same distance the ejecta module already computes. A test pins
 * the two together.
 */
export function ejectaSpeedForRange(range: Meters): number {
  const R = range;
  if (!Number.isFinite(R) || R <= 0) return 0;
  return Math.sqrt(STANDARD_GRAVITY * R);
}

/** Inverse: the range a launch speed reaches at 45°. */
export function ejectaRangeForSpeed(speed: number): Meters {
  if (!Number.isFinite(speed) || speed <= 0) return m(0);
  return m((speed * speed) / STANDARD_GRAVITY);
}

/**
 * How long to run the sequence. Long enough for the shock to clear the
 * outermost contour, and for the cloud to have risen and the crater to
 * have visibly cooled — but bounded, because a Chicxulub front takes
 * hours to reach its 0.5 psi ring and nobody watches that.
 */
function sequenceDuration(arrival: ShockArrival, fireballRadius: Meters): Seconds {
  const front = arrival.totalTime;
  const thermal = Math.max(30, Math.sqrt(fireballRadius) * 6);
  return s(Math.min(Math.max(front, thermal), 900));
}

/**
 * How much ground to frame. The subject is the fireball and the
 * crater — the shock front outruns everything and is meant to leave
 * the frame. Framing on the outer contour instead would reduce the
 * event to a dot, which is exactly what the first render study got
 * wrong.
 */
function framingReach(fireballRadius: Meters, craterRadius: Meters): Meters {
  return m(Math.max(craterRadius * 2.6, fireballRadius * 2.2, 200));
}

/** Ballistic flight time to a ground range at the optimal 45° launch. */
function ballisticArrival(range: Meters, launchSpeed: number): Seconds {
  if (!(range > 0) || !(launchSpeed > 0)) return s(0);
  const v = Math.min(launchSpeed, ejectaSpeedForRange(range));
  return s((Math.SQRT2 * v) / STANDARD_GRAVITY);
}

function build(params: {
  origin: SceneOrigin;
  effects: readonly EffectZone[];
  blastEnergy: Joules;
  fireballRadius: Meters;
  craterRadius: Meters;
  craterDepth: Meters;
  ejectaRange: Meters;
  outerRadius: Meters;
}): ImpactScene {
  const outer = m(Math.max(params.outerRadius, params.fireballRadius * 4, 1_000));
  const arrival = buildShockArrival(params.blastEnergy, params.fireballRadius, outer);
  const effects = params.effects
    .filter((e) => Number.isFinite(e.radius) && e.radius > 0)
    .slice()
    .sort((a, b) => a.radius - b.radius);
  const effectsReach = m(effects.reduce((max, e) => Math.max(max, e.radius), 0));
  return {
    latitude: params.origin.latitude,
    longitude: params.origin.longitude,
    effects,
    effectsReach,
    blastEnergy: params.blastEnergy,
    fireballRadius: params.fireballRadius,
    craterRadius: params.craterRadius,
    craterDepth: params.craterDepth,
    ejectaRange: params.ejectaRange,
    ejectaLaunchSpeed: ejectaSpeedForRange(params.ejectaRange),
    outerRadius: outer,
    duration: sequenceDuration(arrival, params.fireballRadius),
    arrival,
    framingReach: framingReach(params.fireballRadius, params.craterRadius),
  };
}

/** Build a scene from a cosmic-impact result. */
export function sceneFromImpact(result: ImpactScenarioResult, origin: SceneOrigin): ImpactScene {
  const ke = result.impactor.kineticEnergy;
  const blastEnergy = J(ke * IMPACT_BLAST_COUPLING);
  const craterRadius = m(result.crater.finalDiameter / 2);
  const ejectaRange = result.ejecta.blanketEdge1mm;
  const ejectaSpeed = ejectaSpeedForRange(ejectaRange);
  const arrival = buildShockArrival(
    blastEnergy,
    impactFireballRadius(ke),
    m(Math.max(result.damage.lightDamage, impactFireballRadius(ke) * 4, 1_000))
  );
  const blastAt = (r: Meters): Seconds => shockArrivalAt(arrival, r);

  return build({
    origin,
    blastEnergy,
    fireballRadius: impactFireballRadius(ke),
    craterRadius,
    craterDepth: result.crater.depth,
    ejectaRange,
    outerRadius: result.damage.lightDamage,
    effects: [
      zone('crater', 'crater', craterRadius, s(0), true, 'crater'),
      zone(
        'ejecta',
        'ejecta',
        ejectaRange,
        ballisticArrival(ejectaRange, ejectaSpeed),
        true,
        'ejecta'
      ),
      // The thermal pulse travels at light speed: it is already there.
      zone('thermal3', 'thermal', result.damage.thirdDegreeBurn, s(0), true, 'thermal3'),
      zone('thermal2', 'thermal', result.damage.secondDegreeBurn, s(0), true, 'thermal2'),
      zone('firestorm', 'firestorm', result.firestorm.ignitionRadius, s(0), true, 'firestorm'),
      zone(
        'blast5',
        'blast',
        result.damage.overpressure5psi,
        blastAt(result.damage.overpressure5psi),
        true,
        'blast5'
      ),
      zone(
        'blast1',
        'blast',
        result.damage.overpressure1psi,
        blastAt(result.damage.overpressure1psi),
        true,
        'blast1'
      ),
      zone(
        'blastLight',
        'blast',
        result.damage.lightDamage,
        blastAt(result.damage.lightDamage),
        true,
        'blastLight'
      ),
    ],
  });
}

/** Small constructor so the effect tables below stay readable. */
function zone(
  id: string,
  kind: EffectKind,
  radius: Meters,
  arrival: Seconds,
  material: boolean,
  labelKey: string
): EffectZone {
  return { id, kind, radius, arrival, material, labelKey };
}

/** Build a scene from a nuclear / conventional explosion result. */
export function sceneFromExplosion(
  result: ExplosionScenarioResult,
  origin: SceneOrigin
): ImpactScene {
  const energy = J(result.yield.joules);
  const craterRadius = m(result.crater.apparentDiameter / 2);
  const fireballRadius = nuclearFireballRadius(joulesToKilotons(energy));
  const ejectaRange = m(craterRadius * 4);
  const ejectaSpeed = ejectaSpeedForRange(ejectaRange);
  const arrival = buildShockArrival(
    energy,
    fireballRadius,
    m(Math.max(result.blast.lightDamageRadiusHob, fireballRadius * 4, 1_000))
  );
  const blastAt = (r: Meters): Seconds => shockArrivalAt(arrival, r);

  return build({
    origin,
    blastEnergy: energy,
    fireballRadius,
    // Glasstone §6.06: the apparent crater is a shallow bowl, depth
    // roughly a quarter of its diameter for a surface burst.
    craterDepth: m(result.crater.apparentDiameter * 0.25),
    craterRadius,
    // Surface bursts throw a debris blanket a few crater radii out;
    // an airburst (no crater) throws none.
    ejectaRange,
    outerRadius: m(result.blast.lightDamageRadiusHob),
    effects: [
      zone('crater', 'crater', craterRadius, s(0), true, 'crater'),
      zone(
        'ejecta',
        'ejecta',
        ejectaRange,
        ballisticArrival(ejectaRange, ejectaSpeed),
        true,
        'ejecta'
      ),
      zone('thermal3', 'thermal', result.thermal.thirdDegreeBurnRadius, s(0), true, 'thermal3'),
      zone('thermal2', 'thermal', result.thermal.secondDegreeBurnRadius, s(0), true, 'thermal2'),
      zone('thermal1', 'thermal', result.thermal.firstDegreeBurnRadius, s(0), true, 'thermal1'),
      zone('firestorm', 'firestorm', result.firestorm.ignitionRadius, s(0), true, 'firestorm'),
      zone(
        'blast5',
        'blast',
        m(result.blast.overpressure5psiRadiusHob),
        blastAt(m(result.blast.overpressure5psiRadiusHob)),
        true,
        'blast5'
      ),
      zone(
        'blast1',
        'blast',
        m(result.blast.overpressure1psiRadiusHob),
        blastAt(m(result.blast.overpressure1psiRadiusHob)),
        true,
        'blast1'
      ),
      zone(
        'blastLight',
        'blast',
        m(result.blast.lightDamageRadiusHob),
        blastAt(m(result.blast.lightDamageRadiusHob)),
        true,
        'blastLight'
      ),
      // Prompt radiation leaves the ground looking exactly as it was.
      // It can only be drawn as a contour, never as a stain.
      zone('radiation', 'radiation', result.radiation.ld50Radius, s(0), false, 'radiation'),
      zone('emp', 'emp', m(result.emp.affectedRadius), s(0), false, 'emp'),
    ],
  });
}

/** Per-frame snapshot. Everything the shaders bind, and nothing else. */
export interface ImpactFrame {
  readonly time: Seconds;
  /** Shock-front ground range (m). QUANTITATIVE. */
  readonly shockRadius: Meters;
  /** Luminous fireball radius (m). QUANTITATIVE. */
  readonly fireballRadius: Meters;
  /** Fireball temperature (K). ILLUSTRATIVE — calibrated envelope. */
  readonly fireballTemperature: Kelvin;
  /** Fireball centre altitude (m). QUANTITATIVE (buoyant rise). */
  readonly fireballAltitude: Meters;
  /** Radius of the rising dust column (m). ILLUSTRATIVE. */
  readonly stemRadius: Meters;
  /** How far the ground has been stripped (m). Tracks the front,
   *  bounded by the 1 psi contour. QUANTITATIVE in extent. */
  readonly scourRadius: Meters;
  /** Crater depth excavated so far (m). QUANTITATIVE at the end. */
  readonly craterDepth: Meters;
  /** Dust-column opacity in [0, 1]. ILLUSTRATIVE. */
  readonly dustOpacity: number;
  /** Initial-flash intensity in [0, 1]. ILLUSTRATIVE. */
  readonly flash: number;
  /** True once the front has left the fireball behind. */
  readonly brokenAway: boolean;
}

/**
 * Sample the scene at one instant. Pure: same (scene, time) always
 * gives the same frame, which is what lets a screenshot test seek
 * instead of racing a timer.
 */
export function frameAt(scene: ImpactScene, time: Seconds): ImpactFrame {
  const t = Math.max(time, 0);
  const blast = blastWaveStateAt(
    {
      blastEnergy: scene.blastEnergy,
      fireballRadius: scene.fireballRadius,
      arrival: scene.arrival,
    },
    s(t)
  );
  const breakaway = breakawayTime(scene.blastEnergy, scene.fireballRadius);
  const riseStart = breakaway * 2.2 + 0.4;
  const risen = Math.max(0, t - riseStart);

  return {
    time: s(t),
    shockRadius: blast.shockRadius,
    fireballRadius: blast.fireballRadius,
    fireballTemperature: blast.fireballTemperature,
    fireballAltitude: blast.fireballAltitude,
    stemRadius: m(blast.fireballRadius * 0.3 * Math.min(1, risen / (riseStart * 1.5 + 0.5))),
    scourRadius: m(Math.min(blast.shockRadius, scene.outerRadius * 0.55)),
    craterDepth: m(scene.craterDepth * Math.min(1, t / (breakaway * 3 + 0.4))),
    dustOpacity: Math.min(1, t / (riseStart * 2 + 1)),
    flash: Math.exp(-((t / (breakaway * 0.55 + 0.05)) ** 1.4)),
    brokenAway: blast.brokenAway,
  };
}

/** Radius of one named effect, or 0 when the event does not have it. */
export function effectRadius(scene: ImpactScene, id: string): number {
  return scene.effects.find((e) => e.id === id)?.radius ?? 0;
}

/** Arrival time of one named effect, or 0. */
export function effectArrival(scene: ImpactScene, id: string): number {
  return scene.effects.find((e) => e.id === id)?.arrival ?? 0;
}

/**
 * Where to drop the playhead when the close-up opens.
 *
 * t = 0 is physically the most interesting instant and visually the
 * worst: the flash saturates the frame and a first-time viewer sees a
 * white rectangle. Rather than pick a fraction by eye, solve the flash
 * envelope for the moment it has fallen to 5 % —
 *
 *     exp(-(t/tau)^1.4) = 0.05   =>   t = tau * 3^(1/1.4)
 *
 * with the same tau `frameAt` uses. The fireball is fully formed by
 * then and the front has just detached, which is the frame that
 * actually explains what is happening.
 */
export function openingTime(scene: ImpactScene): Seconds {
  const breakaway = breakawayTime(scene.blastEnergy, scene.fireballRadius);
  const tau = breakaway * 0.55 + 0.05;
  return s(Math.min(tau * Math.pow(3, 1 / 1.4), scene.duration * 0.25));
}
