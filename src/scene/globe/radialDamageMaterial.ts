import { Color, Event, Material } from 'cesium';

/**
 * Custom Cesium Fabric material used for every damage zone on the
 * globe.
 *
 * A damage threshold is a contour; the *area* between two contours is
 * a zone ("from here in, buildings collapse"). Earlier revisions drew
 * every threshold as a full translucent disc with an edge-lit rim —
 * six overlapping discs summed into a mush at the centre and the
 * bloomed rims read as neon halos, not as a hazard map. This material
 * paints only the annulus between the ring's inner edge (the previous
 * threshold) and its own boundary, so the zones tile the ground
 * without stacking and each carries one flat tint, the way a
 * published hazard map does. The crisp boundary itself is a separate
 * ground polyline (`ringPresentation.ts`), not a shader trick.
 *
 * Uniforms:
 *   - `color`          — zone tint, alpha = fill opacity.
 *   - `innerFraction`  — inner edge as a fraction of the ellipse
 *                        radius (0 = full disc). Fed every frame from
 *                        the entity's current radius, so while the
 *                        ring grows during the cascade the painted
 *                        band is exactly [previous threshold, front].
 *
 * `r` is the Euclidean distance from the ellipse centre, normalised so
 * r = 1.0 lands exactly on the ellipse boundary inscribed in the
 * [0, 1]² texture-coordinate frame Cesium hands to ground primitives.
 * The Fabric type is registered exactly once at module load via a
 * side-effect Material construction; subsequent instances reuse the
 * cached, compiled shader.
 */

const FABRIC_TYPE = 'RadialDamageRing';

const FABRIC_SOURCE = `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st - vec2(0.5);
  float r = length(st) * 2.0;
  if (r > 1.0) discard;

  // Inner edge: a soft 3 % feather so the band starts without a hard
  // seam against the previous zone (their fills differ in hue, the
  // feather keeps the transition from reading as a second contour).
  float feather = 0.03;
  float inner = clamp(innerFraction, 0.0, 0.999);
  float body = smoothstep(inner, inner + feather, r);
  // Outer edge: a faint 1.5 % darkening under the polyline contour
  // gives the boundary weight on bright terrain without a glow.
  float edge = smoothstep(0.975, 1.0, r) * 0.35;

  material.diffuse = color.rgb * (1.0 - edge);
  material.alpha = body * color.a * (1.0 + edge * 0.6);
  return material;
}
`;

let fabricRegistered = false;

/**
 * Side-effect: compile and cache the Fabric definition under
 * {@link FABRIC_TYPE}. Cesium's Material constructor adds inline
 * `fabric` definitions to its internal `_materialCache` keyed by
 * `type`, so a single throw-away construction is enough to register
 * the shader for every later use. Idempotent; cheap to call.
 */
function ensureFabricRegistered(): void {
  if (fabricRegistered) return;
  const _registrationProbe = new Material({
    fabric: {
      type: FABRIC_TYPE,
      uniforms: { color: new Color(1, 1, 1, 1), innerFraction: 0.0 },
      source: FABRIC_SOURCE,
    },
    translucent: true,
  });
  void _registrationProbe;
  fabricRegistered = true;
}

export interface RadialDamageUniforms {
  color: Color;
  innerFraction: number;
}

/**
 * Per-entity `MaterialProperty`-shaped wrapper. Cesium duck-types the
 * material accessor on ground primitives: any object exposing
 * `definitionChanged`, `isConstant`, `getType`, `getValue`, and
 * `equals` is accepted. We deliberately do not extend Cesium's
 * abstract `MaterialProperty` class — its constructor is internal-
 * only and changes between minor releases.
 *
 * The inner fraction is read through a callback every frame (the
 * property is therefore not constant): the caller passes a function
 * that divides the zone's inner radius by the ellipse's *current*
 * semi-major axis, so the annulus follows the cascade animation with
 * no geometry rebuild — only a uniform changes.
 */
export class RadialDamageMaterialProperty {
  /** Cesium's `MaterialProperty` shape. False: the inner fraction is
   *  re-evaluated per frame while the ring grows. */
  public readonly isConstant = false;

  public readonly definitionChanged: Event = new Event();

  private readonly _color: Color;
  private readonly _innerFraction: () => number;

  constructor(color: Color, innerFraction: () => number = () => 0) {
    ensureFabricRegistered();
    this._color = Color.clone(color);
    this._innerFraction = innerFraction;
  }

  getType(): string {
    return FABRIC_TYPE;
  }

  getValue(_time?: unknown, result?: Partial<RadialDamageUniforms>): RadialDamageUniforms {
    const target = result ?? {};
    target.color = Color.clone(this._color, target.color);
    const f = this._innerFraction();
    target.innerFraction = Number.isFinite(f) ? Math.min(0.999, Math.max(0, f)) : 0;
    return target as RadialDamageUniforms;
  }

  equals(other?: unknown): boolean {
    return (
      this === other ||
      (other instanceof RadialDamageMaterialProperty &&
        Color.equals(this._color, other._color) &&
        this._innerFraction === other._innerFraction)
    );
  }
}

/**
 * Convenience factory: a zone fill of the supplied tint at `alpha`
 * opacity. `innerFraction` (optional) returns the zone's inner edge
 * as a fraction of the ellipse's current radius; omit it for a full
 * disc (cavities, plumes, halos).
 */
export function radialDamageMaterial(
  color: Color,
  alpha = 1.0,
  innerFraction?: () => number
): RadialDamageMaterialProperty {
  return new RadialDamageMaterialProperty(color.withAlpha(alpha), innerFraction);
}
