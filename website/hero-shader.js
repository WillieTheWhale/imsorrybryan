// Each scene is a different view of a system, held together by the same
// paper, registration, three inks, and frame-indexed screenprint grain.
import { PRINT_WIPE } from "./print-transition.js";

export const FRAGMENT = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform vec3 uPaper;
uniform vec3 uPlate;
uniform vec3 uInk;
uniform float uFrame;
uniform float uPhase;
uniform float uBeat;
uniform float uHover;
uniform float uWipe;
uniform int uScene;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

${PRINT_WIPE}

float coverage(float d, float spray) {
  float core = 1.0 / (1.0 + exp(clamp(d / spray, -12.0, 12.0)));
  float tail = 0.016 * exp(-max(d, 0.0) / (spray * 7.0));
  return clamp(core + (1.0 - core) * tail, 0.0, 1.0);
}

float bell(vec2 p, vec2 c, vec2 radius) {
  vec2 q = (p - c) / radius;
  return exp(-dot(q, q) * 1.4);
}

float boxD(vec2 p, vec2 halfSize) {
  vec2 d = abs(p) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

float ovalD(vec2 p, vec2 center, vec2 radius) {
  return (length((p - center) / radius) - 1.0) * min(radius.x, radius.y);
}

void pressInk(inout vec3 color, float d, vec2 pixel, float seed) {
  if (hash(pixel + vec2(seed, seed * 1.37)) < coverage(d, 0.0017)) color = uInk;
}

void pressPaper(inout vec3 color, float d, vec2 pixel, float seed) {
  if (hash(pixel + vec2(seed, seed * 1.71)) < coverage(d, 0.0015)) color = uPaper;
}

// Each Doric column is built from shaft, flutes, plinth, neck, echinus and
// abacus. Its top follows the animated entablature so the rotunda stays joined.
void wellColumn(inout vec3 color, vec2 w, vec2 pixel, float seed,
                float x, float top, float foot, float width) {
  if (abs(w.x - x) <= width * 1.7 && w.y >= top - 0.018 && w.y <= foot + 0.020) {
  float shaftTop = top + 0.031;
  float shaftBottom = foot - 0.019;
  float shaftCenter = 0.5 * (shaftTop + shaftBottom);
  float shaftHeight = 0.5 * (shaftBottom - shaftTop);
  float plinth = boxD(w - vec2(x, foot - 0.006), vec2(width * 0.82, 0.012));
  float base = boxD(w - vec2(x, foot - 0.020), vec2(width * 0.66, 0.008));
  float shaft = boxD(w - vec2(x, shaftCenter), vec2(width * 0.47, shaftHeight));
  float neck = boxD(w - vec2(x, top + 0.028), vec2(width * 0.62, 0.008));
  float echinus = boxD(w - vec2(x, top + 0.016), vec2(width * 0.74, 0.009));
  float abacus = boxD(w - vec2(x, top + 0.004), vec2(width * 0.91, 0.009));
  float silhouette = min(min(plinth, base), min(shaft, min(neck, min(echinus, abacus))));
  pressInk(color, silhouette - 0.002, pixel, seed + x * 31.0);
  pressPaper(color, silhouette + 0.003, pixel, seed + x * 67.0);
  float fluteRegion = max(abs(w.y - shaftCenter) - (shaftHeight - 0.014),
                          abs(w.x - x) - width * 0.40);
  float flute = 0.93 - abs(sin((w.x - x) / width * 25.0));
  pressInk(color, max(fluteRegion, flute * 0.006), pixel, seed + x * 101.0);
  pressInk(color, min(abs(w.y - (top + 0.034)) - 0.0012,
                      abs(w.y - (foot - 0.029)) - 0.0012) +
                      max(abs(w.x - x) - width * 0.55, 0.0), pixel, seed + 13.0);
  }
}

// All Old Well architecture is evaluated directly at this fragment. No image,
// canvas texture, SVG, or overlay participates in the render.
void oldWell(inout vec3 color, vec2 p, vec2 pixel, float seed, float aspect) {
  float width = aspect > 1.25 ? 0.88 : 0.71;
  vec2 w = (p - vec2(0.0, -0.01)) / vec2(width, 0.82) + 0.5;
  w.y = 1.0 - w.y;
  if (w.x >= -0.07 && w.x <= 1.07 && w.y >= -0.06 && w.y <= 1.06) {
  vec3 underlying = color;
  float lift = 0.0;
  float reveal = 0.93 * (1.0 - uBeat) + 0.012 * sin(w.x * 19.0);

  // The lower oval reads as two circular courses of stone, viewed obliquely.
  if (w.y > 0.77) {
    pressInk(color, ovalD(w, vec2(0.5, 0.909), vec2(0.477, 0.071)), pixel, seed + 7.0);
    pressPaper(color, ovalD(w, vec2(0.5, 0.888), vec2(0.454, 0.054)), pixel, seed + 11.0);
    pressInk(color, ovalD(w, vec2(0.5, 0.872), vec2(0.433, 0.042)) - 0.002, pixel, seed + 17.0);
    pressPaper(color, ovalD(w, vec2(0.5, 0.866), vec2(0.422, 0.035)), pixel, seed + 23.0);
    float course = abs(ovalD(w, vec2(0.5, 0.890), vec2(0.460, 0.057))) - 0.0018;
    pressInk(color, course, pixel, seed + 29.0);
  }

  // Rear four supports surround a recessed ceiling. They remain visible
  // through the wide open space between the near columns.
  wellColumn(color, w, pixel, seed, 0.25, 0.297 + lift, 0.849, 0.064);
  wellColumn(color, w, pixel, seed, 0.405, 0.309 + lift, 0.861, 0.062);
  wellColumn(color, w, pixel, seed, 0.595, 0.309 + lift, 0.861, 0.062);
  wellColumn(color, w, pixel, seed, 0.75, 0.297 + lift, 0.849, 0.064);
  if (w.y > 0.27 + lift && w.y < 0.39 + lift) {
    float ceiling = ovalD(w, vec2(0.5, 0.285 + lift), vec2(0.430, 0.087));
    pressInk(color, max(ceiling, w.y - (0.364 + lift)), pixel, seed + 37.0);
    pressPaper(color, max(ovalD(w, vec2(0.5, 0.289 + lift), vec2(0.397, 0.058)), w.y - (0.352 + lift)), pixel, seed + 41.0);
    for (int j = 0; j < 5; j++) {
      float y = 0.309 + lift + float(j) * 0.009;
      float curve = y + 0.044 * (1.0 - pow((w.x - 0.5) / 0.43, 2.0));
      float rib = max(abs(w.y - curve) - 0.001, abs(w.x - 0.5) - 0.40);
      pressInk(color, rib, pixel, seed + float(j) * 5.0 + 47.0);
    }
  }

  // Drinking fountain with basin, pedestal, spout and a glint of water.
  if (abs(w.x - 0.5) < 0.085 && w.y > 0.68 && w.y < 0.87) {
    pressInk(color, ovalD(w, vec2(0.5, 0.843), vec2(0.072, 0.012)), pixel, seed + 61.0);
    pressInk(color, boxD(w - vec2(0.5, 0.787), vec2(0.039, 0.065)), pixel, seed + 67.0);
    pressPaper(color, boxD(w - vec2(0.476, 0.789), vec2(0.004, 0.043)), pixel, seed + 71.0);
    pressInk(color, ovalD(w, vec2(0.5, 0.727), vec2(0.066, 0.010)), pixel, seed + 73.0);
    pressPaper(color, ovalD(w, vec2(0.5, 0.725), vec2(0.029, 0.002)), pixel, seed + 79.0);
    pressInk(color, boxD(w - vec2(0.5, 0.715), vec2(0.004, 0.011)), pixel, seed + 83.0);
  }

  wellColumn(color, w, pixel, seed, 0.115, 0.268 + lift, 0.857, 0.077);
  wellColumn(color, w, pixel, seed, 0.361, 0.301 + lift, 0.876, 0.086);
  wellColumn(color, w, pixel, seed, 0.639, 0.301 + lift, 0.876, 0.086);
  wellColumn(color, w, pixel, seed, 0.885, 0.268 + lift, 0.857, 0.077);

  // A low copper dome with radial seams, horizontal weathering and a small
  // finial. Its shaped top is much broader than the columns below it.
  vec2 roof = vec2(w.x, w.y - lift);
  if (roof.y < 0.39 && roof.y > 0.0) {
    float edge = abs(roof.x - 0.5) / 0.46;
    float roofTop = 0.055 + 0.195 * pow(edge, 2.16);
    float dome = max(max(roofTop - roof.y, roof.y - 0.273), edge - 1.0);
    pressInk(color, dome, pixel, seed + 97.0);
    float seam = 100.0;
    for (int i = 0; i < 11; i++) {
      float f = (float(i) - 5.0) / 5.0;
      float x = 0.5 + f * (0.026 + 0.385 * smoothstep(0.05, 0.275, roof.y));
      seam = min(seam, abs(roof.x - x) - 0.0012);
    }
    pressPaper(color, max(seam, dome + 0.003), pixel, seed + 101.0);
    float courses = min(abs(roof.y - 0.153), abs(roof.y - 0.218)) - 0.0010;
    pressPaper(color, max(courses, dome + 0.004), pixel, seed + 103.0);
    float roofTooth = hash(floor(roof * vec2(400.0, 290.0))) - 0.5;
    if (dome < -0.003 && roofTooth > 0.47) color = uPaper;
    // Three layers of moulding and a row of individual dentil brackets.
    float curve = 0.013 * (1.0 - pow((roof.x - 0.5) / 0.46, 2.0));
    float lip = max(max(0.248 + curve - roof.y, roof.y - (0.278 + curve)), abs(roof.x - 0.5) - 0.470);
    float fascia = max(max(0.276 + curve - roof.y, roof.y - (0.316 + curve)), abs(roof.x - 0.5) - 0.461);
    float lower = max(max(0.316 + curve - roof.y, roof.y - (0.340 + curve)), abs(roof.x - 0.5) - 0.449);
    pressInk(color, min(lip, min(fascia, lower)) - 0.003, pixel, seed + 109.0);
    pressPaper(color, min(lip + 0.003, min(fascia + 0.003, lower + 0.003)), pixel, seed + 113.0);
    float dentilX = abs(fract((roof.x - 0.043) * 19.0) - 0.5);
    float dentil = max(dentilX - 0.26, abs(roof.y - (0.307 + curve)) - 0.011);
    dentil = max(dentil, abs(roof.x - 0.5) - 0.43);
    pressInk(color, dentil, pixel, seed + 127.0);
    float corniceLine = min(abs(roof.y - (0.278 + curve)), abs(roof.y - (0.336 + curve))) - 0.0018;
    pressInk(color, max(corniceLine, abs(roof.x - 0.5) - 0.45), pixel, seed + 131.0);
    pressInk(color, boxD(roof - vec2(0.5, 0.046), vec2(0.013, 0.010)), pixel, seed + 137.0);
    pressInk(color, ovalD(roof, vec2(0.5, 0.033), vec2(0.007, 0.008)), pixel, seed + 139.0);
  }

  // Stone approach extends from the circular platform to the plate edge.
  if (w.y > 0.884) {
    float halfRamp = mix(0.076, 0.276, clamp((w.y - 0.89) / 0.125, 0.0, 1.0));
    float ramp = max(0.891 - w.y, abs(w.x - 0.5) - halfRamp);
    pressInk(color, ramp - 0.006, pixel, seed + 149.0);
    pressPaper(color, ramp, pixel, seed + 151.0);
    float seam = min(abs(w.y - 0.944), abs(w.y - 0.983)) - 0.0012;
    pressInk(color, max(seam, abs(w.x - 0.5) - halfRamp + 0.009), pixel, seed + 157.0);
  }
  if (w.y + (hash(pixel + vec2(seed + 3.0, 7.0)) - 0.5) * 0.018 < reveal) color = underlying;
  }
}

// Successive elevation profiles form a capability landscape. Each peak
// corresponds to a domain with its own height and rate of change.
float capabilityProfile(float x, float depth) {
  float h = 0.0;
  h += (0.68 + 0.18 * uBeat) * exp(-pow((x + 0.94) / 0.18, 2.0));
  h += (0.35 + 0.44 * uBeat) * exp(-pow((x + 0.56) / 0.19, 2.0));
  h += (0.82 + 0.05 * uBeat) * exp(-pow((x + 0.09) / 0.29, 2.0));
  h += (0.24 + 0.53 * uBeat) * exp(-pow((x - 0.42) / 0.21, 2.0));
  h += (0.61 + 0.12 * uBeat) * exp(-pow((x - 0.87) / 0.19, 2.0));
  h += 0.28 * uHover * exp(-pow((x - uPointer.x) / 0.20, 2.0));
  return 0.26 * h * (0.45 + 0.55 * depth)
       + 0.012 * sin(x * 10.0 + depth * 2.8);
}

float capabilityInk(vec2 p, out float cut) {
  // One large ink mass carries the five uneven peaks. Open strata are cut
  // from that mass, so this reads as a print rather than a line chart.
  float crest = -0.20 + 1.85 * capabilityProfile(p.x, 1.0);
  float d = p.y - crest;
  float strata = 100.0;
  for (int i = 0; i < 17; i++) {
    float f = float(i) / 16.0;
    float y = -0.425 + f * 0.56 + capabilityProfile(p.x + (f - 0.5) * 0.16, f) * (0.4 + 0.8 * f);
    float width = mod(float(i), 4.0) < 0.5 ? 0.0045 : 0.0025;
    strata = min(strata, abs(p.y - y) - width);
  }
  cut = max(strata, d + 0.009);
  return d;
}

// A regular token lattice becomes an attention field. Nothing is randomized:
// dot size comes from two drifting bands of activation and a local response
// to the pointer. The lattice itself bows as the represented relation moves.
float attentionInk(vec2 p, float plateD, out float cut) {
  vec2 q = p;
  q.x += 0.035 * sin(q.y * 7.0 + uBeat * 2.2);
  q.y += 0.051 * sin(q.x * 3.9 - uBeat * 2.4);
  vec2 stepSize = vec2(0.058, 0.057);
  vec2 cell = floor(q / stepSize);
  vec2 center = (cell + 0.5) * stepSize;
  vec2 local = q - center;
  float route1 = 0.20 * sin(center.x * 2.45 + uBeat * 2.3) + 0.045;
  float route2 = -0.18 * sin(center.x * 2.9 - uBeat * 1.7) - 0.080;
  float a1 = exp(-pow((center.y - route1) / 0.105, 2.0));
  float a2 = 0.90 * exp(-pow((center.y - route2) / 0.120, 2.0));
  float localFocus = 0.65 * uHover * bell(center, uPointer, vec2(0.20, 0.18));
  float active = clamp(max(a1, a2) + localFocus, 0.0, 1.0);
  float radius = 0.0035 + 0.024 * pow(active, 1.35);
  float dot = length(local) - radius;
  // This is a fill, so it stays just inside the coloured plate.
  cut = 100.0;
  return max(dot, plateD + 0.026);
}

// Feature superposition, a mechanistic interpretability question: several
// distinct features gradually share one representational patch. Signed
// distances are min-combined so they actually fuse into a compound ink body.
vec3 feature(int i) {
  if (i == 0) return vec3(-0.08, -0.03, 0.27);
  if (i == 1) return vec3(-0.82, 0.22, 0.13);
  if (i == 2) return vec3(-0.64, -0.24, 0.18);
  if (i == 3) return vec3(-0.40, 0.28, 0.11);
  if (i == 4) return vec3(0.30, 0.23, 0.20);
  if (i == 5) return vec3(0.68, -0.16, 0.15);
  if (i == 6) return vec3(0.88, 0.24, 0.08);
  if (i == 7) return vec3(0.24, -0.34, 0.10);
  return vec3(-0.95, -0.11, 0.07);
}

float featureInk(vec2 p, out float cut) {
  float sx = min(1.0, (uResolution.x / uResolution.y) / 2.05);
  float d = 100.0;
  for (int i = 0; i < 9; i++) {
    vec3 f = feature(i);
    float pull = i == 0 ? 0.02 : (i == 4 ? 0.24 : (i == 2 ? 0.31 : 0.43));
    vec2 c = f.xy * vec2(sx, 1.0) * (1.0 - pull * uBeat);
    c += 0.025 * uHover * (uPointer - c) * (i == 0 ? 0.2 : 1.0);
    float r = f.z * (1.0 + 0.22 * uBeat);
    d = min(d, length(p - c) - r);
  }
  cut = 100.0;
  return d;
}

void main() {
  if (wipeReject(gl_FragCoord.xy, uResolution, uWipe)) discard;
  vec2 pixel = floor(gl_FragCoord.xy);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float aspect = uResolution.x / uResolution.y;
  vec2 halfPlate = vec2(aspect * 0.466, 0.432);
  float plateD = max(abs(p.x) - halfPlate.x, abs(p.y) - halfPlate.y);

  // Keep the hash arguments in a numerically stable range on mobile GPUs.
  float seed = mod(uFrame, 72.0) * 13.17;
  float plateRoll = hash(pixel + vec2(seed + 11.0, 13.0));
  float inkRoll = hash(pixel + vec2(seed + 37.0, 41.0));
  float plateWobble = hash(pixel * 0.29 + vec2(seed + 73.0, 79.0)) - 0.5;
  float inkWobble = hash(pixel * 0.39 + vec2(seed + 101.0, 107.0)) - 0.5;
  float grainPaper = hash(pixel + vec2(seed + 131.0, 137.0));
  float grainPlate = hash(pixel + vec2(seed + 163.0, 167.0));
  float grainInk = hash(pixel + vec2(seed + 193.0, 197.0));

  float cut = 100.0;
  float inkD = 100.0;
  float spray = 0.0032;
  if (uScene == 1) {
    inkD = capabilityInk(p, cut);
    spray *= 1.20;
  } else if (uScene == 2) {
    inkD = attentionInk(p, plateD, cut);
    spray *= 0.78;
  } else if (uScene == 5) {
    inkD = featureInk(p, cut);
    spray *= 1.20;
  }

  float pc = coverage(plateD + plateWobble * 0.006, 0.0040);
  float ic = coverage(inkD + inkWobble * 0.006, spray);
  float cc = coverage(cut + inkWobble * 0.002, 0.0016);
  vec3 color = uPaper;
  if (plateRoll < pc) color = uPlate;
  if (inkRoll < ic) color = uInk;
  if (cc > 0.30 && inkRoll < cc * 0.92) color = uPaper;

  if (all(equal(color, uPaper)) && grainPaper < 0.0015 && plateD < 0.06) color = uPlate;
  if (all(equal(color, uPlate)) && grainPlate < 0.009) color = uPaper;
  if (all(equal(color, uInk)) && grainInk < 0.008) color = uPlate;

  if (uScene == 4) oldWell(color, p, pixel, seed + 223.0, aspect);
  gl_FragColor = vec4(color, 1.0);
}
`;
