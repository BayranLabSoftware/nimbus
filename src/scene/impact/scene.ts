import { IMPACT_BLAST_COUPLING, STANDARD_GRAVITY } from '../../physics/constants.js';
import type { ShockArrival } from '../../physics/effects/blastWave.js';
import {
  blastWaveStateAt,
  breakawayTime,
  buildShockArrival,
  impactFireballRadius,
  joulesToKilotons,
  nuclearFireballRadius,
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

function build(params: {
  origin: SceneOrigin;
  blastEnergy: Joules;
  fireballRadius: Meters;
  craterRadius: Meters;
  craterDepth: Meters;
  ejectaRange: Meters;
  outerRadius: Meters;
}): ImpactScene {
  const outer = m(Math.max(params.outerRadius, params.fireballRadius * 4, 1_000));
  const arrival = buildShockArrival(params.blastEnergy, params.fireballRadius, outer);
  return {
    latitude: params.origin.latitude,
    longitude: params.origin.longitude,
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
  return build({
    origin,
    blastEnergy: J(ke * IMPACT_BLAST_COUPLING),
    fireballRadius: impactFireballRadius(ke),
    craterRadius: m(result.crater.finalDiameter / 2),
    craterDepth: result.crater.depth,
    ejectaRange: result.ejecta.blanketEdge1mm,
    outerRadius: result.damage.lightDamage,
  });
}

/** Build a scene from a nuclear / conventional explosion result. */
export function sceneFromExplosion(
  result: ExplosionScenarioResult,
  origin: SceneOrigin
): ImpactScene {
  const energy = J(result.yield.joules);
  const craterRadius = m(result.crater.apparentDiameter / 2);
  return build({
    origin,
    blastEnergy: energy,
    fireballRadius: nuclearFireballRadius(joulesToKilotons(energy)),
    // Glasstone §6.06: the apparent crater is a shallow bowl, depth
    // roughly a quarter of its diameter for a surface burst.
    craterDepth: m(result.crater.apparentDiameter * 0.25),
    craterRadius,
    // Surface bursts throw a debris blanket a few crater radii out;
    // an airburst (no crater) throws none.
    ejectaRange: m(craterRadius * 4),
    outerRadius: m(result.blast.lightDamageRadiusHob),
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
