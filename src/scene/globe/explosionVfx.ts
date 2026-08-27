import {
  CallbackPositionProperty,
  CallbackProperty,
  Cartesian3,
  Color,
  ColorMaterialProperty,
  ReferenceFrame,
  type Entity,
  type Viewer,
} from 'cesium';
import { cloudMaterialFromProperty } from './cloudMaterial.js';
import { VolumetricFireballMaterialProperty } from './fireballMaterial.js';

/**
 * Empirical mushroom-cloud altitude vs yield, fitted to the canonical
 * observations of Hiroshima (~6 km @ 15 kt), Crossroads Baker
 * (~3 km @ 23 kt underwater), Castle Bravo (~40 km @ 15 Mt) and
 * Tsar Bomba (~64 km @ 50 Mt):
 *
 *     H[km] ≈ 1.7 · W[kt]^0.42
 *
 * Source: Glasstone & Dolan (1977) §2.51 stabilisation-altitude
 * regression + open-source reconstruction of Tsar Bomba in
 * Khariton et al. 2005. Capped at 60 km because above that the
 * cloud-top is in the stratopause and the visual rules of thumb
 * break down. Returns metres so callers do not have to convert.
 */
export function mushroomCloudAltitudeMeters(yieldKilotons: number): number {
  if (!Number.isFinite(yieldKilotons) || yieldKilotons <= 0) return 0;
  const km = 1.7 * Math.pow(yieldKilotons, 0.42);
  return Math.min(km, 60) * 1_000;
}

export interface ExplosionVfxInput {
  viewer: Viewer;
  /** WGS84 latitude of the burst centre (deg). */
  latitude: number;
  /** WGS84 longitude (deg). */
  longitude: number;
  /** Total explosion energy expressed as TNT-equivalent kilotons.
   *  Drives both the size and the vertical reach of the cloud. */
  yieldKilotons: number;
  /** PROTOTIPO: palla di fuoco volumetrica con shader al posto dei
   *  due ellissoidi colorati. Attivato dal parametro `?vol` per poter
   *  confrontare le due rese sullo stesso evento. */
  volumetricFireball?: boolean;
}

const FIREBALL_BURST_S = 0.5;
const FIREBALL_FADE_S = 1.4;
const STEM_RISE_S = 2.8;
const CAP_DELAY_S = 1.6;
const CAP_GROWTH_S = 2.6;
const TOTAL_LIFETIME_S = 7.0;
/** Durata della cupola d'urto: il fronte in aria supera la scala
 *  visibile in pochi secondi, poi non c'e' piu' niente da mostrare. */
const DOME_S = 4.5;
const FADE_OUT_S = 1.8;

/** easeOutCubic — slows as t approaches 1, matches the visual
 *  "expanding-then-stalling" rhythm of real cloud growth. */
function easeOutCubic(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return 1 - (1 - c) ** 3;
}

/**
 * Convert a (north, east) offset in metres at the burst latitude into
 * a Cartesian3 in WGS84 with a given altitude. 1° lat ≈ 111 km;
 * lon scales with cos(lat). Used to spread cluster puffs around
 * the cloud's vertical axis without hand-rolling matrix maths.
 */
function pointAt(
  centerLat: number,
  centerLon: number,
  altitudeM: number,
  northM: number,
  eastM: number
): Cartesian3 {
  const latRad = (centerLat * Math.PI) / 180;
  const dLat = northM / 111_000;
  const dLon = eastM / (111_000 * Math.max(Math.cos(latRad), 1e-6));
  return Cartesian3.fromDegrees(centerLon + dLon, centerLat + dLat, altitudeM);
}

/** Cumulus-style colour palette for the cloud. Keeping them out of
 *  the function body so the cluster reads as if it had been picked
 *  from a single design system. */
const CLOUD_COLOURS = {
  capTop: '#f5f5f4',
  capMid: '#d6d3d1',
  capLow: '#a8a29e',
  capShadow: '#78716c',
  stemUpper: '#9ca3af',
  stemMid: '#6b7280',
  stemLower: '#4b5563',
  stemBase: '#292524',
  fireCore: '#fff7c4',
  fireMid: '#fb923c',
  fireOuter: '#b91c1c',
};

/**
 * Spawn an Entity-based mushroom-cloud VFX above an impact or
 * explosion event. Visual hierarchy is:
 *
 *   1. **Fireball** — a hot core + glowing aura at ground zero,
 *      bright yellow → orange → red, ~1.4 s.
 *   2. **Stem** — five stacked ellipsoids (base → top, decreasing
 *      radius), each with its own rise timing and slight horizontal
 *      offset so the column reads as turbulent rising plume rather
 *      than a single grey rod.
 *   3. **Cap** — seven overlapping puffs (one central + four lobes
 *      arranged around it + two top crowns) in graded greys, each
 *      starting at slightly different times so the cap fluffs
 *      outward instead of inflating as one rigid sphere.
 *
 * Sizes scale with `mushroomCloudAltitudeMeters(yieldKilotons)`;
 * Hiroshima-class scenarios get a tight ~6 km cloud, Tsar-Bomba-class
 * scenarios get a textbook ~60 km mushroom against the OSM imagery.
 *
 * The whole VFX uses Cesium `Entity` + `EllipsoidGraphics` (not
 * `ParticleSystem`) — entities cannot fail to render the way the
 * particle path silently could under modelMatrix-anchored emitters
 * in 1.140; `CallbackProperty` is the same animation backbone used
 * for the marker-halo pulse, which we know works in this build.
 *
 * Returns a cleanup function that yanks every spawned entity. The
 * renderer calls it on every re-evaluate so stale clouds don't pile
 * up between consecutive simulations.
 */
export function spawnExplosionVfx(input: ExplosionVfxInput): () => void {
  const { viewer, latitude, longitude, yieldKilotons } = input;
  if (yieldKilotons <= 0 || !Number.isFinite(yieldKilotons)) {
    return () => {
      /* no-op */
    };
  }

  const altitudeM = mushroomCloudAltitudeMeters(yieldKilotons);
  // Cupola d'urto — l'onda di pressione come emisfero traslucido che
  // si espande, non come cerchio disegnato a terra. Il raggio segue
  // la legge di scala cubica dell'energia (Glasstone & Dolan §3.66:
  // le distanze di sovrappressione scalano con W^(1/3)), tarata sul
  // raggio a 1 psi; e' un volume, quindi si vede da qualunque
  // angolazione e da' profondita' alla scena.
  const domeMaxM = Math.min(1_400 * Math.cbrt(yieldKilotons), 150_000);
  const stemRadiusM = Math.max(80, altitudeM * 0.04);
  const capRadiusM = Math.max(250, altitudeM * 0.35);
  const fireballRadiusM = Math.max(60, altitudeM * 0.025);

  const t0 = performance.now();
  const elapsedSec = (): number => (performance.now() - t0) / 1000;
  /** Linear fade-out alpha factor across the final FADE_OUT_S of the
   *  total VFX window. 1 during the active life, 0 after the system
   *  is supposed to be gone. */
  const fadeAlpha = (): number => {
    const e = elapsedSec();
    const fadeStart = TOTAL_LIFETIME_S - FADE_OUT_S;
    if (e <= fadeStart) return 1;
    return Math.max(0, 1 - (e - fadeStart) / FADE_OUT_S);
  };

  const entities: Entity[] = [];

  // -------- Fireball: hot core + glowing aura ---------------------
  // Two stacked ellipsoids at the burst point. Inner is the bright
  // yellow core; outer is a translucent orange "aura" ~1.6× larger
  // that sells the radiative-heat envelope.
  const fireballCoreRadii = new CallbackProperty(() => {
    const e = elapsedSec();
    const growT = easeOutCubic(e / FIREBALL_BURST_S);
    const r = fireballRadiusM * growT;
    return new Cartesian3(r, r, r * 0.95);
  }, false);
  const fireballCoreColour = new CallbackProperty(() => {
    const e = elapsedSec();
    if (e < FIREBALL_BURST_S) return Color.fromCssColorString(CLOUD_COLOURS.fireCore).withAlpha(1);
    const fadeT = Math.min((e - FIREBALL_BURST_S) / FIREBALL_FADE_S, 1);
    const start = Color.fromCssColorString(CLOUD_COLOURS.fireMid);
    const end = Color.fromCssColorString(CLOUD_COLOURS.fireOuter).withAlpha(0);
    return Color.lerp(start, end, fadeT, new Color());
  }, false);
  // PROTOTIPO Strada 2: una sola sfera con densita' interna al posto
  // dei due ellissoidi. Vive piu' a lungo del nucleo classico perche'
  // il senso del confronto e' poterla guardare.
  if (input.volumetricFireball === true) {
    const volRadii = new CallbackProperty(() => {
      const e = elapsedSec();
      const cresce = easeOutCubic(e / (FIREBALL_BURST_S * 1.4));
      const r = Math.max(1, fireballRadiusM * 2.2 * cresce);
      return new Cartesian3(r, r, r * 0.92);
    }, false);
    const nucleo = new Color();
    const bordo = new Color();
    const materiale = new VolumetricFireballMaterialProperty(() => {
      const e = elapsedSec();
      const spegnimento = Math.min(1, e / 4.0);
      // Il nucleo passa da bianco a giallo mentre si raffredda; il
      // bordo dal rosso vivo al rosso cupo, e tutto perde opacita'.
      Color.lerp(
        Color.fromCssColorString('#FFFDF0'),
        Color.fromCssColorString('#FFC24A'),
        spegnimento,
        nucleo
      );
      nucleo.alpha = Math.max(0, 1 - spegnimento) * fadeAlpha();
      Color.lerp(
        Color.fromCssColorString('#FF6A18'),
        Color.fromCssColorString('#7A1206'),
        spegnimento,
        bordo
      );
      return {
        nucleo,
        bordo,
        tempo: e * 0.6,
        // La turbolenza cresce mentre la palla si gonfia e si sfalda.
        turbolenza: 2.2 + 1.6 * spegnimento,
        intensita: 1.6 * (1 - 0.5 * spegnimento),
      };
    });
    entities.push(
      viewer.entities.add({
        id: 'explosion-vfx-fireball-volumetric',
        position: Cartesian3.fromDegrees(longitude, latitude, fireballRadiusM * 1.1),
        ellipsoid: { radii: volRadii, material: materiale, outline: false },
      })
    );
  } else {
    entities.push(
      viewer.entities.add({
        id: 'explosion-vfx-fireball-core',
        position: Cartesian3.fromDegrees(longitude, latitude, fireballRadiusM * 0.5),
        ellipsoid: {
          radii: fireballCoreRadii,
          material: new ColorMaterialProperty(fireballCoreColour),
          outline: false,
        },
      })
    );
  }

  // -------- Cupola d'urto -----------------------------------------
  // Un emisfero traslucido che si espande dal punto di scoppio: e' il
  // fronte di pressione come VOLUME, quindi conserva la profondita' da
  // qualunque angolazione, al contrario del cerchio disegnato a terra.
  // Sfuma mentre cresce, come fa l'onda perdendo energia.
  const domeRadii = new CallbackProperty(() => {
    const u = Math.min(elapsedSec() / DOME_S, 1);
    // Radice quadrata: parte veloce e rallenta, come un fronte che si
    // espande perdendo pressione.
    const r = Math.max(1, domeMaxM * Math.sqrt(u));
    return new Cartesian3(r, r, r * 0.5);
  }, false);
  const domeColour = new CallbackProperty(() => {
    const u = Math.min(elapsedSec() / DOME_S, 1);
    // Visibile per quasi tutta la corsa, poi si spegne in fretta: un
    // fronte che sfuma subito non si legge come volume.
    const spegnimento = u < 0.7 ? 1 : 1 - (u - 0.7) / 0.3;
    return Color.fromCssColorString('#DCEBFF').withAlpha(0.34 * spegnimento * fadeAlpha());
  }, false);
  entities.push(
    viewer.entities.add({
      id: 'explosion-vfx-shock-dome',
      position: Cartesian3.fromDegrees(longitude, latitude, 0),
      ellipsoid: {
        radii: domeRadii,
        material: new ColorMaterialProperty(domeColour),
        outline: false,
      },
    })
  );

  const fireballAuraRadii = new CallbackProperty(() => {
    const e = elapsedSec();
    const growT = easeOutCubic(e / (FIREBALL_BURST_S * 1.2));
    const r = fireballRadiusM * 1.6 * growT;
    return new Cartesian3(r, r, r * 0.6);
  }, false);
  const fireballAuraColour = new CallbackProperty(() => {
    const e = elapsedSec();
    const total = FIREBALL_BURST_S + FIREBALL_FADE_S;
    const fadeT = Math.min(e / total, 1);
    const start = Color.fromCssColorString(CLOUD_COLOURS.fireMid).withAlpha(0.55);
    const end = Color.fromCssColorString(CLOUD_COLOURS.fireOuter).withAlpha(0);
    return Color.lerp(start, end, fadeT, new Color());
  }, false);
  entities.push(
    viewer.entities.add({
      id: 'explosion-vfx-fireball-aura',
      position: Cartesian3.fromDegrees(longitude, latitude, fireballRadiusM * 0.7),
      ellipsoid: {
        radii: fireballAuraRadii,
        material: new ColorMaterialProperty(fireballAuraColour),
        outline: false,
      },
    })
  );

  // -------- Stem: five stacked, offset puffs ----------------------
  // Each segment occupies a vertical band of the column, has its
  // own rise timing, and is offset slightly off-axis so the stem
  // reads as turbulent rising smoke rather than a single grey rod.
  // The vertical-half-extent of each puff equals its band's half-
  // height; the bottom edge of each ellipsoid stays anchored at
  // the band's lower altitude.
  const STEM_BANDS = 5;
  const stemBaseColours = [
    CLOUD_COLOURS.stemBase,
    CLOUD_COLOURS.stemLower,
    CLOUD_COLOURS.stemMid,
    CLOUD_COLOURS.stemMid,
    CLOUD_COLOURS.stemUpper,
  ];
  const stemRadiiScales = [1.4, 1.15, 0.95, 0.85, 0.95]; // narrows mid-stem, flares at the cap base
  const stemDelays = [0, 0.2, 0.45, 0.7, 0.95]; // seconds of stagger

  for (let i = 0; i < STEM_BANDS; i++) {
    const bandLowFrac = i / STEM_BANDS;
    const bandHighFrac = (i + 1) / STEM_BANDS;
    const bandCentreFrac = 0.5 * (bandLowFrac + bandHighFrac);
    const bandHalfHeight = (altitudeM * (bandHighFrac - bandLowFrac)) / 2;
    const offsetN = Math.sin(i * 1.7) * stemRadiusM * 0.4;
    const offsetE = Math.cos(i * 1.7) * stemRadiusM * 0.4;
    const ringScale = stemRadiiScales[i] ?? 1.0;
    const delay = stemDelays[i] ?? 0;
    const bandColour = stemBaseColours[i] ?? CLOUD_COLOURS.stemMid;

    const positionProp = new CallbackPositionProperty(
      () => {
        const e = elapsedSec();
        const t = easeOutCubic(Math.max(0, (e - delay) / (STEM_RISE_S - delay)));
        const bandCentreAltitude = altitudeM * bandCentreFrac * t;
        return pointAt(latitude, longitude, bandCentreAltitude, offsetN, offsetE);
      },
      false,
      ReferenceFrame.FIXED
    );

    const radiiProp = new CallbackProperty(() => {
      const e = elapsedSec();
      const t = easeOutCubic(Math.max(0, (e - delay) / (STEM_RISE_S - delay)));
      const horizontal = stemRadiusM * ringScale * Math.max(t, 0.001);
      const vertical = bandHalfHeight * Math.max(t, 0.001);
      return new Cartesian3(horizontal, horizontal, vertical);
    }, false);

    const colourProp = new CallbackProperty(() => {
      const alpha = 0.85 * fadeAlpha();
      return Color.fromCssColorString(bandColour).withAlpha(alpha);
    }, false);

    entities.push(
      viewer.entities.add({
        id: `explosion-vfx-stem-${i.toString()}`,
        position: positionProp,
        ellipsoid: {
          radii: radiiProp,
          // Cloud material: soft silhouette fade + lit-top / shadow-
          // bottom gradient applied in the fragment shader. Drops the
          // "billiard ball" look the previous flat-colour material
          // produced.
          material: cloudMaterialFromProperty(colourProp),
          outline: false,
        },
      })
    );
  }

  // -------- Cap: seven overlapping puffs --------------------------
  // 1 central oblate (the head), 4 lobes around it, 2 top crowns.
  // Each puff has an independent stagger so the cap fluffs out
  // organically rather than inflating as a single sphere.
  interface CapPuff {
    /** Horizontal lat-offset in units of capRadiusM. */
    nFrac: number;
    /** Horizontal lon-offset in units of capRadiusM. */
    eFrac: number;
    /** Vertical offset in units of (capRadiusM * 0.4). */
    upFrac: number;
    /** Multiplier on capRadiusM for this puff's xy radius. */
    sizeFrac: number;
    /** Vertical squash (z-radius / xy-radius). */
    squash: number;
    /** Stagger before this puff starts inflating, in seconds. */
    delay: number;
    /** Colour key into CLOUD_COLOURS. */
    tint: keyof typeof CLOUD_COLOURS;
  }
  const capPuffs: CapPuff[] = [
    { nFrac: 0, eFrac: 0, upFrac: 0, sizeFrac: 1.0, squash: 0.45, delay: 0, tint: 'capMid' },
    {
      nFrac: 0.55,
      eFrac: 0,
      upFrac: 0.1,
      sizeFrac: 0.7,
      squash: 0.55,
      delay: 0.25,
      tint: 'capLow',
    },
    {
      nFrac: -0.55,
      eFrac: 0,
      upFrac: 0.1,
      sizeFrac: 0.7,
      squash: 0.55,
      delay: 0.35,
      tint: 'capLow',
    },
    {
      nFrac: 0,
      eFrac: 0.55,
      upFrac: 0.1,
      sizeFrac: 0.7,
      squash: 0.55,
      delay: 0.45,
      tint: 'capLow',
    },
    {
      nFrac: 0,
      eFrac: -0.55,
      upFrac: 0.1,
      sizeFrac: 0.7,
      squash: 0.55,
      delay: 0.55,
      tint: 'capLow',
    },
    { nFrac: 0.2, eFrac: 0.2, upFrac: 0.6, sizeFrac: 0.5, squash: 0.6, delay: 0.7, tint: 'capTop' },
    {
      nFrac: -0.2,
      eFrac: -0.2,
      upFrac: 0.55,
      sizeFrac: 0.45,
      squash: 0.6,
      delay: 0.85,
      tint: 'capTop',
    },
  ];

  for (let i = 0; i < capPuffs.length; i++) {
    const puff = capPuffs[i];
    if (!puff) continue;
    const offsetN = puff.nFrac * capRadiusM;
    const offsetE = puff.eFrac * capRadiusM;
    const altOffset = puff.upFrac * capRadiusM * 0.4;
    const puffAltitude = altitudeM + altOffset;
    const puffPosition = pointAt(latitude, longitude, puffAltitude, offsetN, offsetE);
    const localDelay = CAP_DELAY_S + puff.delay;
    const localGrowth = CAP_GROWTH_S - puff.delay; // staggered puffs still finish by ≈ TOTAL_LIFETIME_S

    // Each puff is rendered as THREE overlapping ellipsoids:
    //   * lit core (top hemisphere, lighter tint),
    //   * shadow base (bottom hemisphere, darker tint),
    //   * soft halo (full sphere, larger, low alpha).
    // The result reads as a 3D cumulus puff with a lit top, a
    // shadowed underside, and a feathered edge — much less "solid
    // grey ball" than a single ellipsoid.
    const corePosition = puffPosition;
    const haloPosition = pointAt(latitude, longitude, puffAltitude, offsetN, offsetE);

    const coreRadii = new CallbackProperty(() => {
      const e = elapsedSec();
      if (e < localDelay) return new Cartesian3(0.01, 0.01, 0.01);
      const t = easeOutCubic((e - localDelay) / localGrowth);
      const r = capRadiusM * puff.sizeFrac * t;
      return new Cartesian3(r, r, r * puff.squash);
    }, false);
    const haloRadii = new CallbackProperty(() => {
      const e = elapsedSec();
      if (e < localDelay) return new Cartesian3(0.01, 0.01, 0.01);
      const t = easeOutCubic((e - localDelay) / localGrowth);
      const r = capRadiusM * puff.sizeFrac * t * 1.45;
      return new Cartesian3(r, r, r * puff.squash * 1.1);
    }, false);

    // Top hemisphere — lit. Cesium's `minimumCone` / `maximumCone`
    // are measured from the local +Z axis (up); 0 → π/2 selects the
    // upper half-sphere. Tint is bumped one step lighter than the
    // base puff colour so a "capLow" puff has a "capMid" top, etc.
    const litTint =
      puff.tint === 'capShadow'
        ? 'capLow'
        : puff.tint === 'capLow'
          ? 'capMid'
          : puff.tint === 'capMid'
            ? 'capTop'
            : 'capTop';
    const shadowTint =
      puff.tint === 'capTop'
        ? 'capMid'
        : puff.tint === 'capMid'
          ? 'capLow'
          : puff.tint === 'capLow'
            ? 'capShadow'
            : 'capShadow';

    const litColour = new CallbackProperty(() => {
      const alpha = 0.92 * fadeAlpha();
      return Color.fromCssColorString(CLOUD_COLOURS[litTint]).withAlpha(alpha);
    }, false);
    const shadowColour = new CallbackProperty(() => {
      const alpha = 0.85 * fadeAlpha();
      return Color.fromCssColorString(CLOUD_COLOURS[shadowTint]).withAlpha(alpha);
    }, false);
    const haloColour = new CallbackProperty(() => {
      const alpha = 0.18 * fadeAlpha();
      return Color.fromCssColorString(CLOUD_COLOURS[puff.tint]).withAlpha(alpha);
    }, false);

    // Halo (soft outer fade — back-most so painter's order draws
    // it first and the lit/shadow halves render on top). Cloud
    // material's fresnel fade gives the halo its feathered edge
    // for free; the wider ellipsoid only contributes the body.
    entities.push(
      viewer.entities.add({
        id: `explosion-vfx-cap-${i.toString()}-halo`,
        position: haloPosition,
        ellipsoid: {
          radii: haloRadii,
          material: cloudMaterialFromProperty(haloColour),
          outline: false,
        },
      })
    );
    // Lit top hemisphere — cloud material reinforces the lit-side
    // gradient produced by the geometry split.
    entities.push(
      viewer.entities.add({
        id: `explosion-vfx-cap-${i.toString()}-lit`,
        position: corePosition,
        ellipsoid: {
          radii: coreRadii,
          minimumCone: 0,
          maximumCone: Math.PI / 2,
          material: cloudMaterialFromProperty(litColour),
          outline: false,
        },
      })
    );
    // Shadow bottom hemisphere.
    entities.push(
      viewer.entities.add({
        id: `explosion-vfx-cap-${i.toString()}-shadow`,
        position: corePosition,
        ellipsoid: {
          radii: coreRadii,
          minimumCone: Math.PI / 2,
          maximumCone: Math.PI,
          material: cloudMaterialFromProperty(shadowColour),
          outline: false,
        },
      })
    );
  }

  const autoCleanupTimer = window.setTimeout(
    () => {
      cleanup();
    },
    (TOTAL_LIFETIME_S + 0.5) * 1000
  );

  let disposed = false;
  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(autoCleanupTimer);
    if (viewer.isDestroyed()) return;
    for (const entity of entities) {
      viewer.entities.remove(entity);
    }
  };
  return cleanup;
}

/**
 * Convenience wrapper that maps a Joule-typed energy to the
 * TNT-equivalent kiloton input expected by {@link spawnExplosionVfx}.
 * Uses the standard 1 kg TNT = 4.184 × 10⁶ J definition.
 */
export function spawnExplosionVfxFromJoules(
  input: Omit<ExplosionVfxInput, 'yieldKilotons'> & { energyJoules: number }
): () => void {
  const kt = input.energyJoules / 4.184e12;
  const { energyJoules: _energy, ...rest } = input;
  return spawnExplosionVfx({ ...rest, yieldKilotons: kt });
}
