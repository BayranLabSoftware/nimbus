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
uniform float uFogK;       // extra extinction from lofted dust, 0..1
uniform float uGrainF;     // terrain grain frequency, cycles per km

/* Terrain pyramid. Four levels, coarsest first, all the same size and
   all in one array texture: adding a level is data, not another pair
   of samplers and another five uniforms. Imagery and elevation keep
   separate bounds — the terrain source stops at zoom 15 while the
   imagery goes to 19, so at close range the two blocks are genuinely
   different patches of ground and pretending otherwise would put the
   photograph in the wrong place. */
#define MAX_LAYERS 6
// sampler2DArray has no default precision in GLSL ES 3.00 the way
// sampler2D does; without this the shader will not compile.
precision highp sampler2DArray;
uniform sampler2DArray uImgArr;
uniform sampler2DArray uDemArr;
uniform vec4  uLayerImgBnd[MAX_LAYERS];  // lonWest, lonEast, latNorth, latSouth
uniform vec4  uLayerDemBnd[MAX_LAYERS];  // the DEM caps out at z15, so it
                                         // covers more ground than the photo
uniform vec2  uLayerElev[MAX_LAYERS];    // metres: min, max
uniform vec3  uLayerMean[MAX_LAYERS];    // mean linear colour, for exposure
uniform int   uLayerCount;

uniform vec3  uElev;       // metres: min, max, value at ground zero (finest level)
uniform vec3  uAvg;        // fallback colour where no level covers

uniform vec2  uOrg;        // lat0, lon0 (degrees)

/* Elevation range the height-field march brackets against, in metres.
   Taken from the middle level, not the close tile and not the planet:
   the close tile spans a few tens of kilometres and misses every real
   mountain, so they fall back to the smooth sphere and read as a
   printed texture; the planet's range is eighteen kilometres thick and
   makes the march step over everything. */
uniform vec2  uMarchRange;

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
/* Aerial perspective. Extinction at sea level for a clear day —
   roughly a 120 km meteorological visual range — and the 8 km density
   scale height of the lower atmosphere. Both are properties of the
   AIR, not of the event: the previous version scaled the coefficient
   by the scenario's framing reach, so a small burst (Hiroshima frames
   at 456 m) got an enormous per-kilometre extinction and everything
   past a couple of hundred kilometres washed out into the sky. The
   map was there the whole time; the fog was eating it. */
/* Clear day, Rayleigh-dominated: a meteorological visual range near
   300 km. The first attempt used 120 km, which is a hazy day, and over
   a scene that spans hundreds of kilometres it erased the landscape. */
const float FOG_BETA = 0.0035;       // per km at sea level
const float FOG_H    = 8.0;          // km, density scale height
/* Longest path the height-field march will cover, in km.
   Where the march runs out it falls back to the smooth sphere, which
   sits ABOVE the real ground — so a cap that bites inside the visible
   range draws a raised ledge along the skyline. Far enough out that
   the fallback happens past the horizon. */
const float MARCH_MAX_LENGTH = 700.0;
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
/* Coverage of a mosaic level, faded at the border. The fade has to be
   wide: each level is a different zoom of a different photograph, so
   a hard edge between them shows up as a rectangle drawn on the
   landscape. */
float insideUV(vec2 uv){ vec2 e = min(uv, 1.0 - uv); return smoothstep(0.0, 0.090, min(e.x, e.y)); }

float lumOf(vec3 c){ return dot(c, vec3(0.2126, 0.7152, 0.0722)); }

/* Imagery luminance at one point of one level. Clamped like every
   other mosaic read: a UV that walks off the block would wrap onto the
   opposite edge of a completely different piece of ground. */
float lumAt(vec2 uv, float layer){
  return lumOf(texture(uImgArr, vec3(clamp(uv, 0.0015, 0.9985), layer)).rgb);
}

/* Micro-relief taken from the imagery itself.
   The DEM stops at about 30 m/px. Inside that a hillside is a flat
   plane with a photograph glued to it, which is precisely what reads
   as a printed map. The photograph still carries the ground's own
   texture at metre scale in its luminance, so treating that luminance
   as a height field and taking its gradient recovers a normal that
   responds to OUR sun instead of the one baked into the picture.
   This is shading only. It never touches the surface the rays hit,
   the elevation the physics reads, or any reported number: it is a
   lighting cue, and is faded out as soon as the pixel is coarser than
   the texel it would be inventing detail from. */
vec3 photoRelief(vec2 geo, int lvl){
  vec4 b = uLayerImgBnd[lvl];
  vec2 uv = toUV(geo, b);
  vec2 tx = 1.0 / vec2(textureSize(uImgArr, 0).xy);
  float l = float(lvl);
  float xa = lumAt(uv - vec2(tx.x, 0.0), l);
  float xb = lumAt(uv + vec2(tx.x, 0.0), l);
  float ya = lumAt(uv - vec2(0.0, tx.y), l);
  float yb = lumAt(uv + vec2(0.0, tx.y), l);
  // uv.y runs south, world +z runs north, hence the sign on the second.
  return vec3(-(xb - xa) * 0.5, 0.0, (yb - ya) * 0.5);
}

/* Metres covered by one imagery texel at this level — the yardstick
   for deciding when the pixel has outrun the data. */
float texelMetres(int lvl){
  vec4 b = uLayerImgBnd[lvl];
  return (b.z - b.w) * 111320.0 / float(textureSize(uImgArr, 0).y);
}

/* Real terrain height (km) above the impact site's own elevation. */

/* Elevation in metres from the finest level that covers this point.
   Walks the pyramid coarse to fine so the sharpest available data
   always wins, and nothing is left uncovered while any level reaches. */
float elevationAt(vec2 xz, out float water, out float inside){
  vec2 geo = toGeo(xz);
  float metres = 0.0;
  float cover = 0.0;
  for (int i = 0; i < MAX_LAYERS; i++){
    if (i >= uLayerCount) break;
    vec2 uv = toUV(geo, uLayerDemBnd[i]);
    float w = insideUV(uv);
    if (w <= 0.0) continue;
    float e = texture(uDemArr, vec3(clamp(uv, 0.0015, 0.9985), float(i))).r;
    metres = mix(metres, uLayerElev[i].x + e * (uLayerElev[i].y - uLayerElev[i].x), w);
    cover = max(cover, w);
  }
  inside = cover;
  water = 1.0 - smoothstep(-8.0, 3.0, metres);
  return metres;
}

/* Terrain height in km, referenced to the impact site's own ground. */
float terrain(vec2 xz, out float water, out float inside){
  float metres = elevationAt(xz, water, inside);
  float h = (metres - uElev.z) / 1000.0;
  // The DEM arrives as 8 bits; a little grain breaks the terracing.
  h += (fbm(vec3(xz * uGrainF, 0.0), 3) - 0.5) * uCraterD * 0.035;
  return h * inside;
}

/* Same surface without the grain octave — the raymarch calls this
   dozens of times per pixel and the noise is invisible at that step
   size anyway. */
float groundFast(vec2 xz){
  float water, inside;
  float metres = elevationAt(xz, water, inside);
  float h = ((metres - uElev.z) / 1000.0) * inside;
  float d = length(xz);
  float k = max(uCraterR, 1e-4);
  return h
    - uCraterD * exp(-pow(d / (k * 0.82), 2.4))
    + uCraterD * 0.42 * exp(-pow((d - k) / (k * 0.30), 2.0))
    + uCraterD * 0.10 * exp(-d / (k * 3.4));
}

/* Optical depth along a ray through an exponential atmosphere,
   integrated analytically. Heights are above sea level, in km. */
float aerialDepth(float yCam, float yHit, float pathLen){
  float a = max(yCam, 0.0);
  float b = max(yHit, 0.0);
  float dy = a - b;
  if (abs(dy) < 1e-4) return FOG_BETA * pathLen * exp(-b / FOG_H);
  return FOG_BETA * pathLen * (FOG_H / dy) * (exp(-b / FOG_H) - exp(-a / FOG_H));
}

/* One threshold ring, thinned by the screen-space derivative so it
   stays a hairline at any zoom. Contours are the analytical register:
   they fade IN as the camera pulls back and the volumetric detail
   stops carrying the information. */
vec3 contour(vec3 col, float d, float radius, vec3 tint, float strength){
  if (radius <= 0.0 || strength <= 0.0) return col;
  float px = fwidth(d);
  /* At grazing incidence one pixel spans tens of kilometres of ground,
     the derivative explodes, and the hairline turns into a band wide
     enough that EVERY threshold matches at once — ten contours adding
     together into a bright wall along the skyline. Past a quarter of
     the radius per pixel the contour cannot be resolved at all, so
     the honest thing is to not draw it. */
  if (px > radius * 0.25) return col;
  float w = max(px * 1.6, radius * 0.0015);
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

/* Curved Earth: a sphere centred one radius below the origin.
 *
 * The naive form computes dot(oc, oc) - RE*RE, a difference of two
 * numbers near 4e7. In 32-bit that leaves about four significant
 * digits, and at grazing incidence — which is the whole horizon — the
 * discriminant quantises and the skyline breaks into rectangular
 * steps. The local frame has its origin ON the sphere, so the same
 * quantity has an exact closed form with no cancellation at all:
 *
 *   |oc|^2 - RE^2 = 2*RE*ro.y + dot(ro, ro)
 */
float sphereC(vec3 ro){
  return 2.0 * RE * ro.y + dot(ro, ro);
}

float hitEarth(vec3 ro, vec3 rd){
  vec3 oc = ro + vec3(0.0, RE, 0.0);
  float b = dot(oc, rd);
  float h = b * b - sphereC(ro);
  if (h < 0.0) return -1.0;
  float t = -b - sqrt(h);
  return t > 0.0 ? t : -1.0;
}
/* Intersect a sphere of radius RE + h centred one Earth radius below
   the origin. Used to bracket the height field between its own floor
   and ceiling, so the march has a tight, correct interval. */
float hitShell(vec3 ro, vec3 rd, float h, out float tFar){
  vec3 oc = ro + vec3(0.0, RE, 0.0);
  float b = dot(oc, rd);
  // Same cancellation-free identity, offset by the shell height:
  //   |oc|^2 - (RE+h)^2 = 2*RE*(ro.y - h) + dot(ro, ro) - h*h
  float c = 2.0 * RE * (ro.y - h) + dot(ro, ro) - h * h;
  float disc = b * b - c;
  if (disc < 0.0){ tFar = -1.0; return -1.0; }
  float q = sqrt(disc);
  tFar = -b + q;
  return -b - q;
}

/* Height of the terrain surface, in the local frame, at the ground
   point under the ray — curvature included. */
float surfaceAt(vec2 xz){
  return -(dot(xz, xz)) / (2.0 * RE) + groundFast(xz);
}

/*
 * Real height-field intersection.
 *
 * The earlier version only refined within a few crater radii and let
 * the smooth sphere stand in everywhere else, so the landscape had a
 * perturbed normal but no silhouette: seen edge-on — which is how this
 * camera sees almost everything — hills read as paint, not as hills.
 *
 * March between the ceiling and floor shells of the actual relief, so
 * the interval is as tight as the data allows, then bisect the
 * crossing. Returns -1 when the ray misses the ground entirely.
 */
float marchGround(vec3 ro, vec3 rd, float tSphere){
  /* Bracket tightly, on the LOCAL relief.
     Widening it to the global DEM range looked more correct and was
     much worse: the shell became eighteen kilometres thick, a grazing
     ray spends five hundred kilometres inside it, and fifty-six steps
     across that resolve nothing at all — the surface turns to mush.
     Step size is what decides whether the march sees a hill, so the
     bracket has to stay thin. Terrain outside it falls back to the
     smooth sphere with its normal map, which near the horizon is a
     few pixels tall and indistinguishable. */
  float relief = max((uMarchRange.y - uElev.z) / 1000.0, uCraterD) + 0.05;
  float floorH = min((uMarchRange.x - uElev.z) / 1000.0, -uCraterD) - 0.05;
  float ceilFar, floorFar;
  float tCeil = hitShell(ro, rd, relief + 0.05, ceilFar);
  float tFloor = hitShell(ro, rd, floorH, floorFar);

  float t0 = max(tCeil, 0.0);
  float t1 = tFloor > 0.0 ? tFloor : (tSphere > 0.0 ? tSphere * 1.35 : ceilFar);
  // Hard cap on how far the march runs. A ray that skims the shell can
  // stay inside it for hundreds of kilometres; past this the sphere is
  // the honest answer and a coarse march is worse than none.
  t1 = min(t1, t0 + MARCH_MAX_LENGTH);
  if (t1 <= t0) return tSphere;

  /* If the ray is ALREADY under the surface where the bracket starts,
     the terrain here is higher than the range the bracket was built
     from — mountains outside the middle tile, read off the coarse
     planet level. Marching anyway bisects between two points that are
     both underground and pins the hit to the ceiling shell, which
     draws a row of flat rectangular notches along the horizon. The
     smooth sphere is the honest answer out there. */
  if ((ro + rd * t0).y - surfaceAt((ro + rd * t0).xz) < 0.0) return tSphere;

  const int STEPS = 72;
  float dt = (t1 - t0) / float(STEPS);
  float prev = t0;
  for (int i = 1; i <= STEPS; i++){
    float t = t0 + dt * float(i);
    vec3 p = ro + rd * t;
    float gap = p.y - surfaceAt(p.xz);
    if (gap < 0.0){
      // Bisect: eight halvings put the hit inside a few metres even on
      // a kilometre-long step.
      float lo = prev, hi = t;
      for (int k = 0; k < 8; k++){
        float mid = 0.5 * (lo + hi);
        vec3 q = ro + rd * mid;
        if (q.y - surfaceAt(q.xz) < 0.0) hi = mid; else lo = mid;
      }
      return 0.5 * (lo + hi);
    }
    prev = t;
  }
  return tSphere;
}

/* Volume density. 'hot' separates gas that EMITS from dust that only
   SCATTERS: without the split a cooled mushroom cap renders as an
   opaque black blob, because it neither emits nor receives. */
/* The column as geometry, with the turbulence passed in.
   Split out from density() so the shadow march can reuse it with the
   turbulence frozen: seven noise evaluations per sample is affordable
   once along the view ray and not five more times towards the sun,
   and a light ray does not need the fine structure to know whether it
   is inside the column. */
float envelope(vec3 p, float turb, float turbCol, out float fireFrac){
  vec3 q = p - vec3(0.0, uFireY, 0.0);
  float rise = uFireY / max(uFireR, 0.01);
  float capR = uFireR * (1.0 + 0.42 * smoothstep(0.0, 2.0, rise));
  float rr = length(vec3(q.x, q.y * (1.0 + 0.85 * smoothstep(0.6, 3.0, rise)), q.z));
  // Cauliflower, not a flying saucer: the lumps have to be a large
  // fraction of the cap and the falloff sharp enough to read as
  // separate billows rather than one soft fringe.
  float edge = capR * (0.60 + 0.88 * turb);
  float cap = 1.0 - smoothstep(edge * 0.86, edge * 1.06, rr);
  float torus = 1.0 - smoothstep(capR * 0.30, capR * 0.95,
                 abs(length(q.xz) - capR * 0.62) + abs(q.y) * 1.5);
  cap = mix(cap, max(cap * 0.55, torus), smoothstep(1.2, 3.2, rise));

  /* The stem takes its own turbulence. Modulating it at the fireball's
     scale gave a smooth pipe with a fine crust — the frequency that
     reads as a rising column is set by the column's own width, and it
     has to wander sideways as well as ripple. */
  float lean = (turbCol - 0.5) * uStemR * 1.9;
  float rStem = length(p.xz - vec2(lean, lean * 0.6));
  float stem = (1.0 - smoothstep(uStemR * (0.28 + 0.30 * turbCol),
                                 uStemR * (1.05 + 0.85 * turbCol), rStem))
             * smoothstep(-0.01, uFireR * 0.30, p.y)
             * (1.0 - smoothstep(uFireY * 0.72, uFireY * 1.02, p.y))
             * step(0.001, uStemR);

  float wallH = uShock * 0.085 * uDust;
  float ring = (1.0 - smoothstep(uShock * 0.02, uShock * 0.13, abs(length(p.xz) - uShock * 0.97)))
             * (1.0 - smoothstep(0.0, max(wallH, 1e-4), p.y)) * step(-0.001, p.y)
             * smoothstep(0.0, 0.15, uTime) * (0.55 + 0.9 * turb);

  /* The stem is drawn-up dust, not plasma: it has to be thinner than
     the cap and shot through with its own turbulence, or it renders as
     a solid pillar with the cap balanced on top. */
  stem *= 0.30 + 0.85 * turbCol;
  float fire = max(cap, stem * 0.55);
  float dust = max(ring, stem * 0.70 * smoothstep(0.8, 2.5, rise));
  fireFrac = clamp(fire / max(fire + dust, 1e-4), 0.0, 1.0);
  return clamp(max(fire, dust) * (0.5 + 1.0 * turb), 0.0, 1.0);
}

float density(vec3 p, out float temp, out float hot){
  float sc = 2.1 / max(uFireR, 0.02);
  float n1 = fbm(p * sc + vec3(0.0, -uTime * 0.30, uTime * 0.07), 4);
  float n2 = fbm(p * sc * 3.1 + vec3(uTime * 0.15, 0.0, -uTime * 0.11), 3);
  float turb = 0.62 * n1 + 0.38 * n2;
  // Column-scale turbulence: wide, and stretched along the rise.
  float cs = 1.0 / max(uStemR * 2.2, 0.05);
  float turbCol = fbm(vec3(p.x, p.y * 0.30, p.z) * cs + vec3(0.0, -uTime * 0.05, 3.7), 3);

  float ff;
  float d = envelope(p, turb, turbCol, ff);
  // Geometry alone is not enough: once the bubble drops below ~700 K
  // it is dust, not incandescent gas, and must be lit rather than emit.
  hot = ff * smoothstep(680.0, 2100.0, uFireT);

  vec3 q = p - vec3(0.0, uFireY, 0.0);
  float capR = uFireR * (1.0 + 0.42 * smoothstep(0.0, 2.0, uFireY / max(uFireR, 0.01)));
  float core = 1.0 - smoothstep(0.0, capR * 1.05, length(q));
  temp = mix(520.0, uFireT, pow(clamp(core, 0.0, 1.0), 0.62));
  return d;
}

/* Optical depth between a point and the sun. Without it every sample
   in the column is lit identically, the volume has no near side and no
   far side, and a kilometre of pulverised rock reads as a bank of
   white smoke. Five taps is enough to separate the lit flank from the
   shadowed one, which is the whole job — this is not a
   radiative-transfer solution and is not offered as one. */
float sunDepth(vec3 p){
  float ss = max(max(uFireR, uStemR), 0.02) * 0.85;
  float tau = 0.0;
  for (int j = 0; j < 5; j++){
    vec3 q = p + uSun * (ss * (float(j) + 0.5));
    if (q.y < 0.0) break;
    float ff;
    tau += envelope(q, 0.5, 0.5, ff) * ss;
  }
  return tau * (2.6 / max(uFireR, 0.02));
}

/* How much sunlight reaches a point, direct beam plus two broader
   lobes standing in for multiple scattering.
   Single scattering alone makes an optically thick cloud black, which
   is not what a mushroom cap looks like: light that fails to arrive
   straight from the sun still arrives after a few bounces, and that
   is the whole difference between a grey cloud and a silhouette. The
   lobes are normalised so an unshadowed sample still gets exactly one
   unit of light. */
float sunlight(vec3 p){
  float tau = sunDepth(p);
  return (exp(-tau) + 0.42 * exp(-tau * 0.22) + 0.20 * exp(-tau * 0.06)) / 1.62;
}

/* Radius of the cap, which also sets the scale of everything above
   the ground. Recomputed rather than passed around: it is four
   operations and it must not drift between the density field and the
   volume that brackets it. */
float capRadius(){
  return uFireR * (1.0 + 0.42 * smoothstep(0.0, 2.0, uFireY / max(uFireR, 0.01)));
}

/* One pass of the volume integral over [t0, t1].
   Two passes, not one, because the two things in this volume live at
   completely different scales. The column is a couple of hundred
   metres across; the dust wall rides the shock front, kilometres out.
   A single sphere holding both gives a step longer than the column is
   wide, and a step that long samples the column exactly once, at full
   strength — which is how a translucent dust column comes out as an
   opaque white slab with hard vertical sides. */
void marchVolume(vec3 ro, vec3 rd, float t0, float t1, int steps,
                 float jit, float extinction, vec3 fireCol, float sunPhase,
                 inout float trans, inout vec3 acc){
  const int MAX_STEPS = 40;
  if (t1 <= t0) return;
  float dt = (t1 - t0) / float(steps);
  for (int i = 0; i < MAX_STEPS; i++){
    if (i >= steps || trans < 0.015) break;
    vec3 p = ro + rd * (t0 + dt * (float(i) + jit));
    if (p.y < -0.005) continue;
    float T, hot;
    float de = density(p, T, hot);
    if (de <= 0.004) continue;
    float a = 1.0 - exp(-de * dt * extinction);
    // The shadow march is five more envelope evaluations. A sample
    // that contributes under two percent of the final pixel does not
    // earn them; it takes the average and moves on.
    float weight = a * trans;
    vec3 emit = blackbody(T) * (0.5 + 5.2 * smoothstep(650.0, 3200.0, T)) * hot;
    vec3 toF = vec3(0.0, max(uFireY, uFireR * 0.4), 0.0) - p;
    float fd = max(length(toF), uFireR * 0.7);
    /* Dust is LIT, never emissive. What was missing was not brightness
       but shadow: with every sample lit the same, the volume had no
       near side and no far side, and a kilometre of pulverised rock
       came out as a bank of white smoke. The sun term can be strong
       precisely because most of the volume no longer receives it, and
       the sky term is dimmed by the same occlusion — the inside of a
       dust column does not see the sky either. */
    float shade = weight < 0.02 ? 0.5 : sunlight(p);
    /* Pulverised rock reflects about a third of what hits it. The
       previous albedo was effectively 0.95, which is fresh snow: with
       the fireball cooled past its emissive range — 400 K twelve
       seconds after a fifteen-kilotonne burst — scattering is ALL
       there is, and an albedo near one turns the column into a white
       slab no amount of shadowing can rescue. */
    vec3 scatter = vec3(0.34, 0.30, 0.25) * sunPhase * shade
                 // Sky above, dusty ground below. Both dimmed by the
                 // same occlusion: the inside of a column sees neither.
                 + mix(vec3(0.09, 0.07, 0.055), vec3(0.10, 0.13, 0.20),
                       clamp(0.5 + 0.5 * normalize(p - vec3(0.0, uFireY, 0.0)).y, 0.0, 1.0))
                   * (0.22 + 0.78 * shade)
                 + fireCol * ((uFireR * uFireR) / (fd * fd)) * 3.2;
    acc += (emit + scatter * (1.0 - hot)) * a * trans;
    trans *= 1.0 - a * 0.94;
  }
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
    float t = marchGround(ro, rd, tGround);
    if (t <= 0.0) t = tGround;
    vec3 p = ro + rd * t;
    float d = length(p.xz);

    float eps = max(uCraterR * 0.035, d * 0.0016);
    float h0 = ground(p.xz);
    vec3 N = normalize(vec3(-(ground(p.xz + vec2(eps, 0.0)) - h0) / eps, 1.0,
                            -(ground(p.xz + vec2(0.0, eps)) - h0) / eps));
    N = normalize(N + vec3(-p.x / RE, 0.0, -p.z / RE));

    float grain = fbm(vec3(p.xz * (9.0 / max(uCraterR, 0.05)), 0.0), 4);
    vec2 geo = toGeo(p.xz);
    float water, demInside;
    terrain(p.xz, water, demInside);

    /* ── The terrain pyramid, coarse to fine ──────────────────────
       Every level is used wherever it covers, at full strength. An
       earlier version faded the sharp level out as the camera pulled
       back, on the theory that its detail was wasted at map altitude;
       what that actually did was throw away the only sharp data on
       screen and fall back on a level eight times coarser, which is
       why the map went soft the moment you zoomed out. A border does
       not need a fade to nothing — it needs a fade to the level
       underneath, which insideUV already gives, plus a shared
       exposure so the two agree on brightness where they meet. */
    vec3 photo = uAvg * uAvg;
    float inside = 0.0;
    int fine = 0;
    vec3 target = uLayerMean[max(uLayerCount - 1, 0)];
    for (int i = 0; i < MAX_LAYERS; i++){
      if (i >= uLayerCount) break;
      vec2 uv = toUV(geo, uLayerImgBnd[i]);
      float w = insideUV(uv);
      if (w <= 0.0) continue;
      vec3 c = pow(texture(uImgArr, vec3(clamp(uv, 0.0015, 0.9985), float(i))).rgb, vec3(2.2));
      photo = mix(photo, c * (target / max(uLayerMean[i], vec3(1e-3))), w);
      inside = max(inside, w);
      fine = i;
    }

    /* Foreground relief. The pixel footprint comes from the screen-space
       derivative of the ground position, so it already accounts for
       distance and for grazing incidence; once it is coarser than a
       texel there is no detail left to recover and the perturbation
       would only alias, so it is faded out there. */
    float texM = texelMetres(fine);
    float footM = length(fwidth(p.xz)) * 1000.0;
    /* The fade is generous because the effect attenuates itself: the
       four taps are offset by one texel of the base level, so the
       hardware picks the same mip as the main sample and the gradient
       flattens out on its own as the pixel grows. The window only has
       to stop the last, aliasing-prone stretch. */
    float micro = 1.0 - smoothstep(texM * 2.0, texM * 14.0, footM);
    micro *= inside * (1.0 - water);

    photo = mix(vec3(dot(photo, vec3(0.299, 0.587, 0.114))), photo, 1.25);
    vec3 albedo = mix(uAvg * uAvg * (0.72 + 0.56 * grain), photo, inside);

    /* Satellite imagery is shot near local noon with the sun close to
       overhead, so the shading it carries is nearly flat and it fights
       whatever sun angle the scene is using. Pulling that baked
       contrast down where the relief takes over stops the two from
       being added on top of each other. */
    albedo = mix(albedo, vec3(lumOf(albedo)) * 0.55 + albedo * 0.45, micro * 0.5);

    // Shading normal: geometry, plus the imagery's own micro-relief in
    // the foreground, plus a fine rock grain below even that.
    vec3 rock = vec3(fbm(vec3(p.xz * 260.0, 11.0), 3) - 0.5, 0.0,
                     fbm(vec3(p.xz * 260.0, 29.0), 3) - 0.5);
    vec3 Ns = normalize(N
      + photoRelief(geo, fine) * (micro * 0.55)
      + rock * (micro * 0.10));

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
    /* Relief needs contrast. The imagery carries its own lighting, so
       the Lambert term cannot be used raw — but lifting it to a 0.38
       floor, as it was, leaves a slope facing away from the sun as
       bright as one facing it, and the landscape flattens into a
       photograph pasted on a sphere. A low floor plus a sky term that
       follows how much sky the slope can actually see gives the hills
       back without inventing light. */
    float lam = max(dot(Ns, uSun), 0.0);
    float skyView = 0.5 + 0.5 * N.y;                 // flat ground sees all of it
    float shade = 0.14 + 1.15 * lam;
    /* Exposure. The sun sits eleven degrees up, so flat ground returns
       about a fifth of the key light; at the old gain that came out as
       a dark brown smear and read as a bad photograph rather than as
       late afternoon. A real camera exposes for the scene in front of
       it, and so does this one. The low sun is kept deliberately: it
       is what makes the relief below read at all. */
    vec3 lit = albedo * shade * vec3(1.0, 0.92, 0.80) * 2.25
             + albedo * vec3(0.16, 0.21, 0.32) * skyView * 0.80;
    if (water > 0.01){
      vec3 wN = normalize(mix(Ns, vec3(0.0, 1.0, 0.0) + vec3(-p.x, 0.0, -p.z) / RE, water));
      vec3 hv = normalize(uSun - rd);
      // Sun glint. A very tight lobe over a nearly flat surface gives
      // one blown, hard-edged white patch; broadening it and cutting
      // the gain turns it back into a sheen.
      float glint = pow(max(dot(wN, hv), 0.0), 90.0);
      lit = mix(lit, albedo * 0.55 * shade + vec3(1.0, 0.94, 0.82) * glint * 0.7, water);
    }

    /* The fireball is the dominant light source. This single term is
       what makes the scene read as lit BY the event. */
    vec3 fpos = vec3(0.0, max(uFireY, uFireR * 0.35), 0.0);
    vec3 L = fpos - p;
    float Ld = max(length(L), uFireR * 0.6);
    vec3 Ln = L / Ld;
    float att = (uFireR * uFireR) / (Ld * Ld);
    vec3 fireCol = blackbody(uFireT);
    lit += albedo * fireCol * max(dot(Ns, Ln), 0.0) * att * 7.0;

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

    lit += vec3(1.0, 0.95, 0.88) * uFlash * 2.2 * max(dot(Ns, Ln), 0.0);

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

    // Aerial perspective. Kept light: the camera spends most of its
    // range above the bulk of the atmosphere, and an over-driven haze
    // washes the far landscape into the sky.
    // Aerial perspective from the actual air column between the camera
    // and the ground, plus whatever dust the event has lofted.
    float seaLevel = uElev.z / 1000.0;
    float tau = aerialDepth(ro.y + seaLevel, p.y + seaLevel, t)
              * (1.0 + 1.4 * uFogK * smoothstep(0.0, 1.0, uDust));
    // Capped below one on purpose. The integral is honest, but a low
    // sun over a long path puts the in-scattered haze brighter than
    // the ground it covers, and letting it run to saturation deletes
    // the landscape instead of softening it.
    float fog = min(1.0 - exp(-tau), 0.58);
    /* Blend toward the light the air scatters IN, not toward the sky
       overhead. Reusing the zenith colour for a downward ray mixes in
       a saturated blue that is brighter, in linear light, than the
       ground it is covering — so distance did not soften the
       landscape, it deleted it. The haze warms toward the sun (Mie
       forward scattering) and dims on the night side. */
    float towardSun = max(dot(rd, uSun), 0.0);
    vec3 haze = mix(vec3(0.075, 0.100, 0.150), vec3(0.185, 0.150, 0.108),
                    pow(towardSun, 4.0));
    // Day/night factor from the sun's elevation at this point: the
    // haze has nothing to scatter after dark.
    float daylight = smoothstep(-0.14, 0.16, dot(N, uSun));
    haze *= 0.30 + 0.90 * daylight;
    col = mix(lit, haze, fog);
  }

  /* Volume: fireball, stem and cap in one bracket, the dust wall at
     the shock front in another. */
  {
    // Start each ray at a different fraction of a step. Evenly spaced
    // samples through a soft volume lay down concentric shells;
    // dithering the start turns the banding into noise, which is what
    // dust looks like anyway.
    float jit = hash31(vec3(gl_FragCoord.xy, 7.0));
    float trans = 1.0;
    vec3 acc = vec3(0.0);
    vec3 fireCol = blackbody(uFireT);
    // Mie forward scattering: dust is far brighter with the sun behind
    // you than in front of it.
    float sunPhase = 0.42 + 0.58 * pow(max(dot(rd, uSun), 0.0), 1.6);
    float capR = capRadius();

    // --- the column ---
    {
      vec3 c = vec3(0.0, uFireY * 0.55, 0.0);
      float R = max(uFireY * 0.62 + capR * 1.7, capR * 2.3);
      vec3 oc = ro - c;
      float b = dot(oc, rd), cc = dot(oc, oc) - R * R, hh = b * b - cc;
      if (hh > 0.0){
        float sq = sqrt(hh), t0 = max(-b - sq, 0.0), t1 = -b + sq;
        if (tGround > 0.0) t1 = min(t1, tGround);
        // Optical depth of about six across the fireball's diameter:
        // opaque where the plasma is, translucent across a stem a
        // third of that width.
        marchVolume(ro, rd, t0, t1, 34, jit, 3.1 / max(uFireR, 0.02),
                    fireCol, sunPhase, trans, acc);
      }
    }

    // --- the dust wall riding the front ---
    // A thin disc on the ground, so it is bracketed as a slab rather
    // than as a sphere kilometres deep and almost entirely empty.
    float wallH = max(uShock * 0.085 * uDust, 1e-4);
    if (uShock > capR * 1.5){
      float top = wallH * 3.0;
      // Where the ray crosses y = -0.01 and y = top.
      float ta = 0.0, tb = MARCH_MAX_LENGTH;
      if (abs(rd.y) > 1e-6){
        float u0 = (-0.01 - ro.y) / rd.y;
        float u1 = (top - ro.y) / rd.y;
        ta = max(0.0, min(u0, u1));
        tb = max(u0, u1);
      } else if (ro.y < -0.01 || ro.y > top) {
        tb = -1.0;
      }
      if (tGround > 0.0) tb = min(tb, tGround);

      /* Clip to the cylinder the wall actually lives in. A ray that
         skims the horizon enters the slab and never leaves it, so
         without this it runs for hundreds of kilometres and its
         twenty-two samples land wherever the dither puts them — which
         is what painted a band of speckle right across the skyline. */
      float Rw = uShock * 1.25;
      float A = dot(rd.xz, rd.xz);
      float B = dot(ro.xz, rd.xz);
      float C = dot(ro.xz, ro.xz) - Rw * Rw;
      if (A < 1e-9){
        if (C > 0.0) tb = -1.0;
      } else {
        float disc = B * B - A * C;
        if (disc <= 0.0) tb = -1.0;
        else {
          float sq2 = sqrt(disc);
          ta = max(ta, (-B - sq2) / A);
          tb = min(tb, (-B + sq2) / A);
        }
      }

      marchVolume(ro, rd, ta, tb, 22, jit, 2.2 / max(uShock * 0.08, 0.02),
                  fireCol, sunPhase, trans, acc);
    }

    col = col * trans + acc;
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
