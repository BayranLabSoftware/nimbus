import { Color, Event, Material } from 'cesium';

/**
 * Custom Cesium Fabric material used for every damage ring on the
 * globe. Replaces the previous flat `ColorMaterialProperty` so the
 * rings read as volumetric "domes" — transparent at the centre, with
 * a marked rim glow — without faking real 3D geometry. The shape
 * still occupies its true geographic radius; the gradient is purely
 * a perceptual cue layered on top of the 2D ground ellipse.
 *
 * The Fabric type is registered exactly once at module load via a
 * side-effect Material construction; subsequent instances reuse the
 * cached, compiled shader. {@link RadialDamageMaterialProperty} is
 * the per-entity wrapper expected by `entity.ellipse.material`.
 */

const FABRIC_TYPE = 'RadialDamageRing';

/**
 * Fragment shader — the «bordo acceso, interno al 10%» law from the
 * approved art direction: the ring is an edge-lit contour, not a
 * blanket. The interior keeps a whisper of fill (≤ 10% alpha) so the
 * affected area still reads as an area, while the rim carries the
 * signal — pushed above 1.0 in the diffuse term so the scene's HDR
 * bloom bites exactly there and nowhere else. `r` is the Euclidean
 * distance from the ellipse centre, normalised so r = 1.0 lands
 * exactly on the ellipse boundary inscribed in the [0, 1]²
 * texture-coordinate frame Cesium hands to ground primitives.
 */
const FABRIC_SOURCE = `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st - vec2(0.5);
  float r = length(st) * 2.0;
  if (r > 1.02) discard;

  float body = smoothstep(0.0, 1.0, r) * 0.10;
  float rim = smoothstep(0.88, 0.97, r) * (1.0 - smoothstep(0.97, 1.02, r));

  material.diffuse = color.rgb * (1.0 + rim * 0.25);
  material.alpha = clamp(body + rim * 0.75, 0.0, 1.0) * color.a;
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
  // The constructed Material is intentionally discarded — we only
  // care about the cache side-effect, which compiles and caches the
  // GLSL on first render.
  const _registrationProbe = new Material({
    fabric: {
      type: FABRIC_TYPE,
      uniforms: { color: new Color(1, 1, 1, 1) },
      source: FABRIC_SOURCE,
    },
    translucent: true,
  });
  void _registrationProbe;
  fabricRegistered = true;
}

/**
 * Per-entity `MaterialProperty`-shaped wrapper. Cesium duck-types the
 * material accessor on ground primitives: any object exposing
 * `definitionChanged`, `isConstant`, `getType`, `getValue`, and
 * `equals` is accepted. We deliberately do not extend Cesium's
 * abstract `MaterialProperty` class — its constructor is internal-
 * only and changes between minor releases.
 */
export class RadialDamageMaterialProperty {
  /** Cesium's `MaterialProperty` shape: indicates the property's value
   *  never changes over time. Always true for damage rings — the colour
   *  is fixed at construction. Exposed as a readonly field rather than
   *  a getter so the literal value satisfies `class-literal-property-style`. */
  public readonly isConstant = true;

  public readonly definitionChanged: Event = new Event();

  private readonly _color: Color;

  constructor(color: Color) {
    ensureFabricRegistered();
    this._color = Color.clone(color);
  }

  getType(): string {
    return FABRIC_TYPE;
  }

  getValue(_time?: unknown, result?: { color?: Color }): { color: Color } {
    const target = result ?? {};
    target.color = Color.clone(this._color, target.color);
    return target as { color: Color };
  }

  equals(other?: unknown): boolean {
    return (
      this === other ||
      (other instanceof RadialDamageMaterialProperty && Color.equals(this._color, other._color))
    );
  }
}

/**
 * Convenience factory: builds a {@link RadialDamageMaterialProperty}
 * with the supplied tint and alpha. The alpha multiplies the shader's
 * own (body + rim) intensity envelope, so passing 0.85 keeps the rim
 * crisp while toning the whole ring down a notch.
 */
export function radialDamageMaterial(color: Color, alpha = 1.0): RadialDamageMaterialProperty {
  return new RadialDamageMaterialProperty(color.withAlpha(alpha));
}
