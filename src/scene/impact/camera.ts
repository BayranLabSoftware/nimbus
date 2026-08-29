/**
 * Camera for the close-up impact view.
 *
 * Pure maths: an orbit state plus a scene gives a pose, and a pose
 * gives a view-projection matrix. No canvas, no event handlers, no
 * mutable singleton — the React layer owns the input, this owns the
 * geometry, and a test can pin the framing without a GPU.
 *
 * Local scene frame, fixed once here: metres, right-handed,
 * +x east, +y up, +z north, origin at ground zero.
 *
 * Matrices are column-major Float32Array(16), the layout WebGL's
 * `uniformMatrix4fv` expects with `transpose = false`.
 */

export type Vec3 = readonly [number, number, number];

export interface OrbitState {
  /** Rotation about the vertical axis (rad). */
  readonly yaw: number;
  /** Elevation above the horizon (rad), clamped away from both poles
   *  so the up vector never degenerates. */
  readonly pitch: number;
  /** Multiplier on the auto-framed distance. 1 = framed. */
  readonly zoom: number;
}

export const DEFAULT_ORBIT: OrbitState = { yaw: 0.6, pitch: 0.3, zoom: 1 };

/** Vertical field of view (rad). Wide enough that a fireball filling
 *  the frame still shows the curved horizon behind it. */
export const FOV_Y = (48 * Math.PI) / 180;

const MIN_PITCH = 0.04;
const MAX_PITCH = 1.35;
const MIN_ZOOM = 0.25;
/** How far the camera may get from ground zero, in metres. */
export const MAX_CAMERA_DISTANCE_M = 3_000_000;
/** Default ceiling. Callers that know how far the event's own effects
 *  reach should pass their own: a blast contour a thousand times the
 *  fireball radius is only visible if the camera is allowed to get far
 *  enough away to see it. */
export const DEFAULT_MAX_ZOOM = 4;

export function clampOrbit(orbit: OrbitState, maxZoom = DEFAULT_MAX_ZOOM): OrbitState {
  return {
    yaw: orbit.yaw,
    pitch: Math.min(Math.max(orbit.pitch, MIN_PITCH), MAX_PITCH),
    zoom: Math.min(Math.max(orbit.zoom, MIN_ZOOM), Math.max(MIN_ZOOM, maxZoom)),
  };
}

/**
 * How far out the camera must be allowed to go for this scene: far
 * enough that the outermost effect fits in the frame, with headroom.
 * Returned as a zoom multiplier on the auto-framed distance.
 */
export function maxZoomForReach(framingReach: number, effectsReach: number): number {
  if (!(framingReach > 0)) return DEFAULT_MAX_ZOOM;
  // Room to keep going past the outermost contour, so the viewer can
  // put the whole footprint in a landscape rather than filling the
  // frame with it.
  const wanted = (effectsReach * 5) / framingReach;
  // Absolute ceiling. The scene works in a tangent frame around the
  // impact point; a few thousand kilometres out that stops being a
  // good approximation of the sphere and the geography would start to
  // shear. Better to stop than to draw a wrong map.
  const absolute = MAX_CAMERA_DISTANCE_M / (framingReach * 1.45);
  return Math.max(DEFAULT_MAX_ZOOM, Math.min(wanted, absolute));
}

const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const length = (a: Vec3): number => Math.hypot(a[0], a[1], a[2]);
const normalize = (a: Vec3): Vec3 => {
  const l = length(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export interface FramingInput {
  /** Ground radius to frame at t = 0 (m). */
  readonly reach: number;
  /** Current fireball radius (m). */
  readonly fireballRadius: number;
  /** Current fireball altitude (m). */
  readonly fireballAltitude: number;
  /** Crater rim radius (m). */
  readonly craterRadius: number;
}

/**
 * Distance from ground zero that keeps the event in frame.
 *
 * The camera widens as the bubble grows and rises — the same thing an
 * operator does to hold a subject. Without it the fireball overflows
 * the frame within a second and the viewer loses the sense of scale;
 * with a fixed wide shot instead, the opening moments are a dot.
 */
export function autoFrameDistance(input: FramingInput): number {
  const subject = Math.max(
    input.fireballRadius * 2.3,
    input.fireballAltitude * 1.7,
    input.craterRadius * 1.6
  );
  const grow = Math.max(1, subject / Math.max(input.reach, 1));
  return Math.max(input.reach, 1) * 1.45 * grow;
}

/** Height the camera sits at, as a fraction of its ground distance. */
const CAMERA_HEIGHT_RATIO = 0.34 / 1.45;

export interface CameraPose {
  readonly position: Vec3;
  readonly target: Vec3;
  readonly forward: Vec3;
  readonly right: Vec3;
  readonly up: Vec3;
  /** Distance from the camera to its target (m). */
  readonly distance: number;
}

/**
 * Place the camera. It orbits ground zero at the auto-framed distance,
 * aiming a little above the surface so the rising column stays in
 * shot rather than climbing out of the top of the frame.
 */
export function poseFor(input: FramingInput, orbit: OrbitState): CameraPose {
  // Already clamped by the caller; re-clamping here with the default
  // ceiling would undo a scene-specific one.
  const o = orbit;
  const dist = autoFrameDistance(input) * o.zoom;
  const height = dist * CAMERA_HEIGHT_RATIO * (0.4 + o.pitch);
  const position: Vec3 = [dist * Math.cos(o.yaw), height, dist * Math.sin(o.yaw)];
  const aim = Math.min(input.fireballAltitude * 0.62, Math.max(input.reach, 1) * 0.85);
  const target: Vec3 = [0, Math.max(aim, input.craterRadius * 0.15), 0];

  const forward = normalize(sub(target, position));
  // Guard the degenerate case where forward is parallel to world up.
  const reference: Vec3 = Math.abs(forward[1]) > 0.999 ? [0, 0, 1] : [0, 1, 0];
  const right = normalize(cross(forward, reference));
  const up = cross(right, forward);
  return { position, target, forward, right, up, distance: length(sub(target, position)) };
}

/**
 * View-projection matrix for a pose. Column-major, right-handed,
 * OpenGL clip convention (z ∈ [−1, 1]).
 */
export function viewProjection(
  pose: CameraPose,
  aspect: number,
  fovY: number = FOV_Y,
  near = 1,
  far = 1e7
): Float32Array {
  const f = 1 / Math.tan(fovY / 2);
  const { right: r, up: u, forward: fwd, position: p } = pose;

  // View matrix, column-major.
  const view = [
    r[0],
    u[0],
    -fwd[0],
    0,
    r[1],
    u[1],
    -fwd[1],
    0,
    r[2],
    u[2],
    -fwd[2],
    0,
    -dot(r, p),
    -dot(u, p),
    dot(fwd, p),
    1,
  ];
  const proj = [
    f / aspect,
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (far + near) / (near - far),
    -1,
    0,
    0,
    (2 * far * near) / (near - far),
    0,
  ];

  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += (proj[k * 4 + row] ?? 0) * (view[c * 4 + k] ?? 0);
      out[c * 4 + row] = sum;
    }
  }
  return out;
}

/**
 * Camera basis as the mat3 the raymarching fragment shader wants:
 * columns are (right, up, −forward), so `basis * vec3(ndc * tan, −1)`
 * gives a world-space ray direction.
 */
export function rayBasis(pose: CameraPose): Float32Array {
  const { right: r, up: u, forward: f } = pose;
  return new Float32Array([r[0], r[1], r[2], u[0], u[1], u[2], -f[0], -f[1], -f[2]]);
}

/** Project a world point through a view-projection. Returns NDC plus
 *  the clip w, so a test can check both position and visibility. */
export function projectPoint(vp: Float32Array, point: Vec3): { x: number; y: number; w: number } {
  const at = (i: number): number => vp[i] ?? 0;
  const x = at(0) * point[0] + at(4) * point[1] + at(8) * point[2] + at(12);
  const y = at(1) * point[0] + at(5) * point[1] + at(9) * point[2] + at(13);
  const w = at(3) * point[0] + at(7) * point[1] + at(11) * point[2] + at(15);
  return w === 0 ? { x: 0, y: 0, w } : { x: x / w, y: y / w, w };
}
