/**
 * GLSL for the close-up impact view.
 *
 * UNITS. The physics layer is SI throughout; the shaders work in
 * KILOMETRES. That is not sloppiness, it is precision management: the
 * scene sits on a sphere of radius 6 371 km and a 32-bit float carries
 * about seven significant digits, so in metres the ray-sphere
 * intersection would resolve the ground to roughly half a metre and
 * the crater bowl would terrace. The conversion happens once, at the
 * uniform boundary in ImpactRenderer, and nowhere else.
 *
 * The two-pass structure — a full-screen raymarch for ground and
 * volume, then additive points for the ejecta — is deliberate: the
 * ground and the fireball need a shared depth ordering that only the
 * raymarch can give cheaply, while tens of thousands of ballistic
 * fragments are far better served by the rasteriser.
 */

/** Full-screen triangle. No vertex buffer: gl_VertexID does the work. */
export const QUAD_VS = `#version 300 es
void main(){
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const SCENE_FS = `#version 300 es
precision highp float;
out vec4 fragColor;

uniform vec2  uRes;
uniform vec3  uCam;        // km, local frame: +x east, +y up, +z north
uniform mat3  uBasis;      // right, up, -forward
uniform float uTan;        // tan(fovY / 2)
uniform vec3  uSun;

uniform float uTime;       // s
uniform float uFireR;      // km
uniform float uFireT;      // K
uniform float uFireY;      // km
uniform float uStemR;      // km
uniform float uShock;      // km
uniform float uCraterR;    // km
uniform float uCraterD;    // km
uniform float uScour;      // km
uniform float uDust;       // 0..1
uniform float uFlash;      // 0..1
uniform float uFogK;       // extinction per km
uniform float uGrainF;     // terrain grain frequency, cycles per km

uniform sampler2D uImg;    // satellite imagery
uniform sampler2D uDem;    // normalised elevation, one channel
uniform vec4  uImgBnd;     // lonWest, lonEast, latNorth, latSouth
uniform vec4  uDemBnd;     // imagery and elevation are planned on
                           // independent zoom grids, so they do NOT
                           // share bounds — mapping both through the
                           // same rectangle would shift the terrain
                           // against the photograph.
uniform vec3  uElev;       // metres: min, max, value at ground zero
uniform vec2  uOrg;        // lat0, lon0 (degrees)
uniform vec3  uAvg;        // fallback colour outside the mosaic

// Second, wider mosaic. Pulling the camera back to take in a
// thousand-kilometre contour leaves the close tile behind, and without
// this the ground outside it collapses to one flat average colour.
uniform sampler2D uImg2;
uniform sampler2D uDem2;
uniform vec4  uImgBnd2;
uniform vec4  uDemBnd2;
uniform vec2  uElev2;      // metres: min, max of the wide DEM
uniform float uHasFar;     // 1 when the wide mosaic is bound

// Effect footprints, in km. Zero means this event has none.
uniform vec3  uThermal;    // 3rd, 2nd, 1st degree burn
uniform vec3  uBlastR;     // 5 psi, 1 psi, 0.5 psi
uniform vec2  uFireEj;     // firestorm ignition, ejecta blanket edge
uniform vec2  uRadEmp;     // radiation LD50, EMP footprint
uniform float uEjArrival;  // s, when the blanket has landed
// Camera distance over framing reach: crossfades from "standing next
// to it" to "looking at a map of it".
uniform float uScale;
// Contour palette, uploaded from scene/impact/effectStyle.ts. NOT
// duplicated here: the legend and the shader index the same table, so
// a colour cannot drift out of sync between them.
uniform vec3  uEffectColor[11];

const float RE  = 6371.008;          // km, IUGG mean radius
const float PI  = 3.14159265359;
const float MPD = 111.19492664;      // km per degree of latitude

float hash31(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x),
                 mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x),
                 mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
const mat3 ROT = mat3(0.0, 0.8, 0.6, -0.8, 0.36, -0.48, -0.6, -0.48, 0.64);
float fbm(vec3 p, int octaves){
  float a = 0.5, sum = 0.0;
  for (int i = 0; i < 7; i++){ if (i >= octaves) break; sum += a * vnoise(p); p = ROT * p * 2.03; a *= 0.5; }
  return sum;
}

/* Black-body-ish emission ramp, dull red through to blue-white. */
vec3 blackbody(float T){
  float t = clamp((T - 700.0) / 6200.0, 0.0, 1.0);
  vec3 c = mix(vec3(1.0, 0.11, 0.012), vec3(1.0, 0.42, 0.06), smoothstep(0.0, 0.28, t));
  c = mix(c, vec3(1.0, 0.76, 0.32), smoothstep(0.22, 0.58, t));
  c = mix(c, vec3(1.0, 0.95, 0.85), smoothstep(0.52, 0.86, t));
  c = mix(c, vec3(0.92, 0.96, 1.0), smoothstep(0.86, 1.0, t));
  return c * pow(t, 0.42);
}

/* Local frame (km east, km north) to geographic degrees. Mirrors
   scene/geo/mercator.ts localToGeo — the two must not drift. */
vec2 toGeo(vec2 xz){
  float lat = uOrg.x + xz.y / MPD;
  float lon = uOrg.y + xz.x / (MPD * max(cos(radians(lat)), 0.05));
  return vec2(lon, lat);
}
/* Geographic degrees to mosaic UV, through the Mercator northing. */
vec2 toUV(vec2 lonlat, vec4 bnd){
  float u = (lonlat.x - bnd.x) / (bnd.y - bnd.x);
  float mN = log(tan(radians(45.0 + bnd.z * 0.5)));
  float mS = log(tan(radians(45.0 + bnd.w * 0.5)));
  float mY = log(tan(radians(45.0 + clamp(lonlat.y, -84.0, 84.0) * 0.5)));
  return vec2(u, (mN - mY) / (mN - mS));
}
float insideUV(vec2 uv){ vec2 e = min(uv, 1.0 - uv); return smoothstep(0.0, 0.030, min(e.x, e.y)); }

/* Real terrain height (km) above the impact site's own elevation.
   Reads the close mosaic where it covers, the wide one beyond it. */
float terrain(vec2 xz, out float water, out float inside){
  vec2 geo = toGeo(xz);
  vec2 uvN = toUV(geo, uDemBnd);
  float inN = insideUV(uvN);
  float metres = uElev.x + texture(uDem, clamp(uvN, 0.0015, 0.9985)).r * (uElev.y - uElev.x);
  float inF = 0.0;
  if (uHasFar > 0.5){
    vec2 uvF = toUV(geo, uDemBnd2);
    inF = insideUV(uvF);
    float wide = uElev2.x + texture(uDem2, clamp(uvF, 0.0015, 0.9985)).r * (uElev2.y - uElev2.x);
    metres = mix(wide, metres, inN);
  }
  inside = max(inN, inF);
  water = 1.0 - smoothstep(-8.0, 3.0, metres);
  float h = (metres - uElev.z) / 1000.0;
  // The DEM arrives as 8 bits; a little grain breaks the terracing.
  h += (fbm(vec3(xz * uGrainF, 0.0), 3) - 0.5) * uCraterD * 0.035;
  return h * inside;
}

/* One threshold ring, thinned by the screen-space derivative so it
   stays a hairline at any zoom. Contours are the analytical register:
   they fade IN as the camera pulls back and the volumetric detail
   stops carrying the information. */
vec3 contour(vec3 col, float d, float radius, vec3 tint, float strength){
  if (radius <= 0.0 || strength <= 0.0) return col;
  float w = max(fwidth(d) * 1.6, radius * 0.0015);
  return col + tint * (1.0 - smoothstep(0.0, w, abs(d - radius))) * strength;
}

/* Real terrain plus the deformation the impact inflicts on it. */
float ground(vec2 xz){
  float water, inside;
  float h = terrain(xz, water, inside);
  float d = length(xz);
  float k = max(uCraterR, 1e-4);
  float bowl = -uCraterD * exp(-pow(d / (k * 0.82), 2.4));
  float rim  =  uCraterD * 0.42 * exp(-pow((d - k) / (k * 0.30), 2.0));
  float ejct =  uCraterD * 0.10 * exp(-d / (k * 3.4));
  return h + bowl + rim + ejct;
}

/* Curved Earth: a sphere centred one radius below the origin. */
float hitEarth(vec3 ro, vec3 rd){
  vec3 oc = ro + vec3(0.0, RE, 0.0);
  float b = dot(oc, rd), c = dot(oc, oc) - RE * RE, h = b * b - c;
  if (h < 0.0) return -1.0;
  float t = -b - sqrt(h);
  return t > 0.0 ? t : -1.0;
}
/* Refine against the height field. Only worth doing near the crater,
   where the bowl and rim actually break the smooth sphere. */
float refineGround(vec3 ro, vec3 rd, float t0){
  float t = t0 * 0.72, dt = (t0 * 0.55) / 22.0;
  for (int i = 0; i < 22; i++){
    vec3 p = ro + rd * t;
    float surf = -(dot(p.xz, p.xz)) / (2.0 * RE) + ground(p.xz);
    if (p.y < surf) return t - dt * 0.5;
    t += dt;
  }
  return t0;
}

/* Volume density. 'hot' separates gas that EMITS from dust that only
   SCATTERS: without the split a cooled mushroom cap renders as an
   opaque black blob, because it neither emits nor receives. */
float density(vec3 p, out float temp, out float hot){
  float sc = 2.1 / max(uFireR, 0.02);
  float n1 = fbm(p * sc + vec3(0.0, -uTime * 0.30, uTime * 0.07), 4);
  float n2 = fbm(p * sc * 3.1 + vec3(uTime * 0.15, 0.0, -uTime * 0.11), 3);
  float turb = 0.62 * n1 + 0.38 * n2;

  vec3 q = p - vec3(0.0, uFireY, 0.0);
  float rise = uFireY / max(uFireR, 0.01);
  float capR = uFireR * (1.0 + 0.42 * smoothstep(0.0, 2.0, rise));
  float rr = length(vec3(q.x, q.y * (1.0 + 0.85 * smoothstep(0.6, 3.0, rise)), q.z));
  float edge = capR * (0.72 + 0.62 * turb);
  float cap = 1.0 - smoothstep(edge * 0.80, edge * 1.10, rr);
  float torus = 1.0 - smoothstep(capR * 0.30, capR * 0.95,
                 abs(length(q.xz) - capR * 0.62) + abs(q.y) * 1.5);
  cap = mix(cap, max(cap * 0.55, torus), smoothstep(1.2, 3.2, rise));

  float stem = (1.0 - smoothstep(uStemR * 0.35, uStemR * (1.15 + 0.7 * turb), length(p.xz)))
             * smoothstep(-0.01, uFireR * 0.30, p.y)
             * (1.0 - smoothstep(uFireY * 0.72, uFireY * 1.02, p.y))
             * step(0.001, uStemR);

  float wallH = uShock * 0.085 * uDust;
  float ring = (1.0 - smoothstep(uShock * 0.02, uShock * 0.13, abs(length(p.xz) - uShock * 0.97)))
             * (1.0 - smoothstep(0.0, max(wallH, 1e-4), p.y)) * step(-0.001, p.y)
             * smoothstep(0.0, 0.15, uTime) * (0.55 + 0.9 * turb);

  float fire = max(cap, stem * 0.80);
  float dust = max(ring, stem * 0.55 * smoothstep(0.8, 2.5, rise));
  float d = clamp(max(fire, dust) * (0.5 + 1.0 * turb), 0.0, 1.0);
  // Geometry alone is not enough: once the bubble drops below ~700 K
  // it is dust, not incandescent gas, and must be lit rather than emit.
  hot = clamp(fire / max(fire + dust, 1e-4), 0.0, 1.0) * smoothstep(680.0, 2100.0, uFireT);

  float core = 1.0 - smoothstep(0.0, capR * 1.05, length(q));
  temp = mix(520.0, uFireT, pow(clamp(core, 0.0, 1.0), 0.62));
  return d;
}

void main(){
  vec2 ndc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
  ndc.x *= uRes.x / uRes.y;
  vec3 rd = normalize(uBasis * vec3(ndc * uTan, -1.0));
  vec3 ro = uCam;
  float tGround = hitEarth(ro, rd);

  /* Sky from the stratosphere: black overhead, blue at the limb. */
  float up = clamp(rd.y, -1.0, 1.0);
  vec3 sky = mix(vec3(0.16, 0.32, 0.55), vec3(0.005, 0.010, 0.028), pow(clamp(up, 0.0, 1.0), 0.42));
  sky += vec3(0.42, 0.55, 0.78) * pow(1.0 - abs(up), 22.0) * 0.34;
  float sd = max(dot(rd, uSun), 0.0);
  sky += vec3(1.0, 0.62, 0.30) * pow(sd, 90.0) * 0.9 + vec3(1.0, 0.80, 0.55) * pow(sd, 7.0) * 0.06;
  sky += vec3(0.75, 0.82, 1.0) * smoothstep(0.9977, 1.0, hash31(floor(rd * 1500.0)))
       * smoothstep(0.06, 0.5, up);
  vec3 col = sky;

  if (tGround > 0.0){
    float t = tGround;
    if (length((ro + rd * tGround).xz) < uCraterR * 7.0) t = refineGround(ro, rd, tGround);
    vec3 p = ro + rd * t;
    float d = length(p.xz);

    float eps = max(uCraterR * 0.035, d * 0.0016);
    float h0 = ground(p.xz);
    vec3 N = normalize(vec3(-(ground(p.xz + vec2(eps, 0.0)) - h0) / eps, 1.0,
                            -(ground(p.xz + vec2(0.0, eps)) - h0) / eps));
    N = normalize(N + vec3(-p.x / RE, 0.0, -p.z / RE));

    float grain = fbm(vec3(p.xz * (9.0 / max(uCraterR, 0.05)), 0.0), 4);
    vec2 geo = toGeo(p.xz);
    vec2 uvI = toUV(geo, uImgBnd);
    float inside = insideUV(uvI);
    float water, demInside;
    terrain(p.xz, water, demInside);

    vec3 photo = pow(texture(uImg, clamp(uvI, 0.0015, 0.9985)).rgb, vec3(2.2));
    if (uHasFar > 0.5){
      vec2 uvF = toUV(geo, uImgBnd2);
      vec3 wide = pow(texture(uImg2, clamp(uvF, 0.0015, 0.9985)).rgb, vec3(2.2));
      photo = mix(wide, photo, inside);
      inside = max(inside, insideUV(uvF));
    }
    photo = mix(vec3(dot(photo, vec3(0.299, 0.587, 0.114))), photo, 1.25);
    vec3 albedo = mix(uAvg * uAvg * (0.72 + 0.56 * grain), photo, inside);

    /* ── Every consequence that visibly alters the ground ──────────
       Each one appears only once its own physics has reached this
       distance. The thermal pulse travels at light speed and is
       therefore already here; the blast waits for the front; the
       ejecta wait out their ballistic flight. Radiation and EMP are
       NOT in this list: they leave the surface looking exactly as it
       was, and are drawn as contours further down. */

    // Thermal: char graded across the three burn thresholds.
    float th3 = uThermal.x, th2 = uThermal.y, th1 = uThermal.z;
    float thermalOn = smoothstep(0.0, 0.25, uTime);
    float charHeavy = th3 > 0.0 ? (1.0 - smoothstep(th3 * 0.75, th3, d)) : 0.0;
    float charMid   = th2 > 0.0 ? (1.0 - smoothstep(th2 * 0.80, th2, d)) : 0.0;
    float charLight = th1 > 0.0 ? (1.0 - smoothstep(th1 * 0.85, th1, d)) : 0.0;
    albedo = mix(albedo, vec3(0.118, 0.092, 0.070), charLight * 0.30 * thermalOn);
    albedo = mix(albedo, vec3(0.070, 0.052, 0.040), charMid * 0.45 * thermalOn);
    albedo = mix(albedo, vec3(0.031, 0.025, 0.021), charHeavy * 0.88 * thermalOn);

    // Blast: scour graded across the overpressure thresholds, and
    // only where the front has already gone past.
    float passed = 1.0 - smoothstep(uShock * 0.985, uShock * 1.015, d);
    float b5 = uBlastR.x > 0.0 ? (1.0 - smoothstep(uBlastR.x * 0.80, uBlastR.x, d)) : 0.0;
    float b1 = uBlastR.y > 0.0 ? (1.0 - smoothstep(uBlastR.y * 0.85, uBlastR.y, d)) : 0.0;
    float bl = uBlastR.z > 0.0 ? (1.0 - smoothstep(uBlastR.z * 0.90, uBlastR.z, d)) : 0.0;
    float scour = max(1.0 - smoothstep(uScour * 0.80, uScour * 1.02, d), b5) * passed;
    vec3 stripped = mix(vec3(0.072, 0.061, 0.052), vec3(0.163, 0.138, 0.112), grain);
    albedo = mix(albedo, albedo * 0.72, bl * 0.35 * passed);
    albedo = mix(albedo, mix(albedo * 0.45, stripped, 0.55), b1 * 0.55 * passed);
    albedo = mix(albedo, stripped, scour * 0.90);

    // Ejecta blanket: pale dust with radial streaks, once it lands.
    float ejR = max(uFireEj.y, uCraterR * 4.0);
    float ejLanded = smoothstep(uEjArrival * 0.4, uEjArrival + 0.6, uTime);
    vec3 radial = normalize(vec3(p.x, 0.0, p.z) + vec3(1e-6));
    float streak = fbm(radial * 34.0, 3);
    float blanket = (1.0 - smoothstep(uCraterR, ejR, d)) * ejLanded;
    albedo = mix(albedo, vec3(0.315, 0.272, 0.231),
                 blanket * (0.40 + 0.45 * smoothstep(0.42, 0.78, streak)));

    /* The imagery already carries its own illumination, so the Lambert
       term is lifted: it adds relief, it does not relight the scene. */
    float lam = max(dot(N, uSun), 0.0);
    float shade = 0.38 + 0.72 * lam;
    vec3 lit = albedo * shade * vec3(1.0, 0.92, 0.80) * 1.55 + albedo * vec3(0.06, 0.08, 0.13);
    if (water > 0.01){
      vec3 wN = normalize(mix(N, vec3(0.0, 1.0, 0.0) + vec3(-p.x, 0.0, -p.z) / RE, water));
      vec3 hv = normalize(uSun - rd);
      lit = mix(lit, albedo * 0.55 * shade
                + vec3(1.0, 0.94, 0.82) * pow(max(dot(wN, hv), 0.0), 260.0) * 2.4, water);
    }

    /* The fireball is the dominant light source. This single term is
       what makes the scene read as lit BY the event. */
    vec3 fpos = vec3(0.0, max(uFireY, uFireR * 0.35), 0.0);
    vec3 L = fpos - p;
    float Ld = max(length(L), uFireR * 0.6);
    vec3 Ln = L / Ld;
    float att = (uFireR * uFireR) / (Ld * Ld);
    vec3 fireCol = blackbody(uFireT);
    lit += albedo * fireCol * max(dot(N, Ln), 0.0) * att * 7.0;

    /* Molten crater floor, cracks staying hot as it radiates away. */
    float melt = 1.0 - smoothstep(uCraterR * 0.55, uCraterR * 1.02, d);
    float crack = smoothstep(0.46, 0.74, fbm(vec3(p.xz * (26.0 / max(uCraterR, 0.05)), uTime * 0.02), 4));
    float meltT = mix(2900.0, 360.0, clamp(pow(uTime / (18.0 + uCraterR * 7.0), 0.55), 0.0, 1.0));
    lit += blackbody(meltT) * melt * (0.16 + 1.5 * crack) * 3.4;
    lit += blackbody(meltT * 0.82) * exp(-pow((d - uCraterR) / (uCraterR * 0.28), 2.0)) * 0.55;

    /* The front at the ground: a thin compression line, freshly
       stripped earth right behind it. */
    float fw = max(uShock * 0.012, uCraterR * 0.05);
    lit += vec3(0.80, 0.88, 1.0) * exp(-pow((d - uShock) / fw, 2.0)) * 0.55 * smoothstep(0.0, 0.1, uTime);
    lit += blackbody(1400.0) * exp(-pow((d - uShock * 0.93) / (fw * 2.6), 2.0)) * 0.25;

    /* Firestorm. Fires do not start with the flash: they take tens of
       seconds to catch and merge. Drawn as flickering embers plus the
       smoke that dulls everything under them. */
    if (uFireEj.x > 0.0){
      float fireZone = 1.0 - smoothstep(uFireEj.x * 0.75, uFireEj.x, d);
      float caught = smoothstep(4.0, 45.0, uTime) * fireZone;
      float patches = smoothstep(0.52, 0.80, fbm(vec3(p.xz * (12.0 / max(uFireEj.x, 0.05)), uTime * 0.05), 4));
      float flicker = 0.72 + 0.28 * fbm(vec3(p.xz * 40.0, uTime * 1.7), 2);
      lit = mix(lit, lit * 0.55, caught * 0.55);                       // smoke pall
      lit += blackbody(1150.0) * caught * patches * flicker * 1.9;     // embers
    }

    lit += vec3(1.0, 0.95, 0.88) * uFlash * 2.2 * max(dot(N, Ln), 0.0);

    /* ── The analytical register ──────────────────────────────────
       Threshold contours, faded in with camera distance. Up close the
       material change IS the information; from a map altitude the
       material change is a smudge and the cited number is what the
       viewer needs. Radiation and EMP appear ONLY here, because they
       change nothing you could photograph. */
    float mapFade = smoothstep(1.6, 6.0, uScale);
    if (mapFade > 0.002){
      float k = mapFade * 0.85;
      lit = contour(lit, d, uCraterR,   uEffectColor[0],  k);
      lit = contour(lit, d, uFireEj.y,  uEffectColor[1],  k * 0.7);
      lit = contour(lit, d, uThermal.x, uEffectColor[2],  k);
      lit = contour(lit, d, uThermal.y, uEffectColor[3],  k * 0.8);
      lit = contour(lit, d, uThermal.z, uEffectColor[4],  k * 0.7);
      lit = contour(lit, d, uFireEj.x,  uEffectColor[5],  k * 0.8);
      lit = contour(lit, d, uBlastR.x,  uEffectColor[6],  k);
      lit = contour(lit, d, uBlastR.y,  uEffectColor[7],  k * 0.9);
      lit = contour(lit, d, uBlastR.z,  uEffectColor[8],  k * 0.8);
      lit = contour(lit, d, uRadEmp.x,  uEffectColor[9],  k);
      lit = contour(lit, d, uRadEmp.y,  uEffectColor[10], k * 0.8);
    }

    float fog = 1.0 - exp(-t * uFogK * (1.0 + 0.6 * smoothstep(0.0, 1.0, uDust)));
    col = mix(lit, sky * 0.9 + vec3(0.05, 0.06, 0.08), clamp(fog, 0.0, 0.92));
  }

  /* Volume: fireball, stem, cap, and the dust wall at the front. */
  {
    float R = max(uFireR * 2.6, uShock * 1.05);
    vec3 c = vec3(0.0, max(uFireY, uFireR), 0.0);
    vec3 oc = ro - c;
    float b = dot(oc, rd), cc = dot(oc, oc) - R * R, hh = b * b - cc;
    if (hh > 0.0){
      float sq = sqrt(hh), t0 = max(-b - sq, 0.0), t1 = -b + sq;
      if (tGround > 0.0) t1 = min(t1, tGround);
      if (t1 > t0){
        const int STEPS = 34;
        float dt = (t1 - t0) / float(STEPS);
        float trans = 1.0;
        vec3 acc = vec3(0.0);
        vec3 fireCol = blackbody(uFireT);
        float sunPhase = 0.42 + 0.58 * pow(max(dot(rd, uSun), 0.0), 1.6);
        for (int i = 0; i < STEPS; i++){
          if (trans < 0.015) break;
          vec3 p = ro + rd * (t0 + dt * (float(i) + 0.5));
          if (p.y < -0.005) continue;
          float T, hot;
          float de = density(p, T, hot);
          if (de <= 0.004) continue;
          float a = 1.0 - exp(-de * dt * (3.1 / max(uFireR, 0.02)));
          vec3 emit = blackbody(T) * (0.5 + 5.2 * smoothstep(650.0, 3200.0, T)) * hot;
          vec3 toF = vec3(0.0, max(uFireY, uFireR * 0.4), 0.0) - p;
          float fd = max(length(toF), uFireR * 0.7);
          // Dust is LIT, never emissive — but it is still dust, not
          // snow. Overdriving the sun term turns the column into a
          // white-out that flattens the whole frame.
          vec3 scatter = vec3(0.52, 0.46, 0.38) * sunPhase * 1.25
                       + vec3(0.14, 0.19, 0.30) * (0.5 + 0.5 * normalize(p - vec3(0.0, uFireY, 0.0)).y)
                       + fireCol * ((uFireR * uFireR) / (fd * fd)) * 3.2;
          acc += (emit + scatter * (1.0 - hot)) * a * trans;
          trans *= 1.0 - a * 0.94;
        }
        col = col * trans + acc;
      }
    }
  }

  col += vec3(1.0, 0.96, 0.90) * uFlash * uFlash * 1.6;
  fragColor = vec4(max(col, 0.0), 1.0);
}`;

/**
 * Ejecta. Each fragment's trajectory is a closed form of (id, t), so
 * there is no simulation state to keep, nothing to reset on a scrub,
 * and seeking backwards is free. The launch-speed distribution is
 * anchored on ejectaSpeedForRange(), which ties the landing pattern to
 * the blanket edge the physics module already computed.
 */
export const PARTICLE_VS = `#version 300 es
precision highp float;
uniform mat4  uVP;
uniform vec3  uCam;
uniform vec2  uRes;
uniform float uTime;       // s
uniform float uCraterR;    // km
uniform float uMaxSpeed;   // km/s
out vec3 vColor;
out float vAlpha;
const float G = 0.00980665; // km/s^2

float hash11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

void main(){
  float id = float(gl_VertexID);
  float azimuth = hash11(id * 1.017) * 6.2831853;
  float u1 = hash11(id * 2.311 + 7.7);
  float u2 = hash11(id * 3.733 + 19.3);
  float u3 = hash11(id * 5.191 + 3.1);
  float big = pow(hash11(id * 7.13 + 41.0), 9.0);

  // Launch site from the crater floor out to the rim; inner material
  // leaves fastest (Housen-Holsapple style scaling).
  float x = mix(0.14, 1.0, pow(u1, 0.55));
  float v = min(uMaxSpeed, uMaxSpeed * pow(x, -1.35) * 0.16 * (0.55 + 0.75 * u2));
  float elev = radians(mix(38.0, 58.0, u3));
  vec3 p0 = vec3(cos(azimuth), 0.0, sin(azimuth)) * uCraterR * x;
  vec3 dir = vec3(cos(azimuth) * cos(elev), sin(elev), sin(azimuth) * cos(elev));

  float t0 = 0.05 + u2 * 0.55 * max(uCraterR, 0.2);
  float tf = uTime - t0;
  float tLand = 2.0 * v * sin(elev) / G;
  if (tf < 0.0 || tf > tLand || uMaxSpeed <= 0.0){
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    vAlpha = 0.0; vColor = vec3(0.0);
    return;
  }
  vec3 p = p0 + dir * v * tf - vec3(0.0, 0.5 * G * tf * tf, 0.0);
  gl_Position = uVP * vec4(p, 1.0);

  float dist = length(p - uCam);
  gl_PointSize = clamp(uRes.y * 0.0022 * (0.30 + 1.1 * u2 + 7.0 * big)
                       * max(uCraterR, 0.15) / max(dist, 0.02), 1.0, 40.0);
  float T = mix(2700.0, 520.0, clamp(tf / (tLand * 0.85 + 0.3), 0.0, 1.0));
  float tt = clamp((T - 700.0) / 2200.0, 0.0, 1.0);
  vColor = mix(vec3(1.0, 0.22, 0.03), vec3(1.0, 0.88, 0.60), tt) * (0.30 + 1.5 * tt);
  vAlpha = (1.0 - smoothstep(0.80, 1.0, tf / max(tLand, 0.01)))
         * (1.0 - smoothstep(uCraterR * 4.0, uCraterR * 22.0, dist))
         * (0.10 + 0.30 * u2 + 0.75 * big);
}`;

export const PARTICLE_FS = `#version 300 es
precision highp float;
in vec3 vColor;
in float vAlpha;
out vec4 fragColor;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float r = length(c);
  if (r > 0.5) discard;
  fragColor = vec4(vColor * exp(-r * r * 9.0) * vAlpha * 1.7, 1.0);
}`;

export const BRIGHT_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uRes;
void main(){
  vec3 c = texture(uTex, gl_FragCoord.xy / uRes).rgb;
  fragColor = vec4(c * smoothstep(0.55, 1.6, dot(c, vec3(0.2126, 0.7152, 0.0722))), 1.0);
}`;

export const BLUR_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uDir;
void main(){
  vec2 uv = gl_FragCoord.xy / uRes, t = uDir / uRes;
  vec3 s = texture(uTex, uv).rgb * 0.227027;
  s += (texture(uTex, uv + t * 1.3846).rgb + texture(uTex, uv - t * 1.3846).rgb) * 0.3162162;
  s += (texture(uTex, uv + t * 3.2308).rgb + texture(uTex, uv - t * 3.2308).rgb) * 0.0702703;
  fragColor = vec4(s, 1.0);
}`;

export const COMPOSITE_FS = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform sampler2D uScene;
uniform sampler2D uBloomNear;
uniform sampler2D uBloomWide;
uniform vec2 uRes;
uniform float uGrainSeed;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash21(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec3 c = texture(uScene, uv).rgb
         + texture(uBloomNear, uv).rgb * 0.55
         + texture(uBloomWide, uv).rgb * 0.42;
  c = pow(aces(c * 1.10), vec3(1.0 / 2.2));
  c *= 1.0 - 0.34 * pow(length(uv - 0.5) * 1.32, 2.4);
  c += (hash21(uv * uRes + uGrainSeed) - 0.5) * 0.016;
  fragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
}`;
