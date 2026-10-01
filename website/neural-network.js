// Geometry and ink for the neural-network study. Every mark is made from
// triangles in the hero's WebGL canvas; no image or texture is sampled.
import { PRINT_WIPE } from "./print-transition.js";

const LAYERS = [
  { x: -0.73, y: [-0.255, 0.005, 0.255] },
  { x: -0.28, y: [-0.305, -0.105, 0.105, 0.305] },
  { x: 0.255, y: [-0.295, -0.085, 0.115, 0.295] },
  { x: 0.73, y: [-0.245, 0.0, 0.245] },
];

const nodes = LAYERS.map((column, layer) => column.y.map((y, index) => ({
  x: column.x + 0.067 * Math.sin(index * 2.71 + layer * 1.89),
  y: y + 0.019 * Math.sin(index * 3.37 + layer * 2.18),
  layer,
  index,
  radius: (layer === 1 || layer === 2 ? 0.048 : 0.039)
    + 0.008 * (0.5 + 0.5 * Math.sin(index * 4.13 + layer * 2.7)),
})));

function curve(a, b, bend, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t + bend * 4 * t * (1 - t),
  };
}

function putEdgeVertex(out, p, t, side, layer, id, weight) {
  out.push(p.x, p.y, t, side, layer, id, weight);
}

function appendStroke(out, p0, p1, t0, t1, halfWidth, layer, id, weight) {
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const length = Math.hypot(dx, dy);
  const nx = -dy / length * halfWidth;
  const ny = dx / length * halfWidth;
  const lo0 = { x: p0.x - nx, y: p0.y - ny };
  const hi0 = { x: p0.x + nx, y: p0.y + ny };
  const lo1 = { x: p1.x - nx, y: p1.y - ny };
  const hi1 = { x: p1.x + nx, y: p1.y + ny };
  putEdgeVertex(out, lo0, t0, -1, layer, id, weight);
  putEdgeVertex(out, hi0, t0, 1, layer, id, weight);
  putEdgeVertex(out, lo1, t1, -1, layer, id, weight);
  putEdgeVertex(out, hi0, t0, 1, layer, id, weight);
  putEdgeVertex(out, hi1, t1, 1, layer, id, weight);
  putEdgeVertex(out, lo1, t1, -1, layer, id, weight);
}

export function makeNeuralGeometry() {
  const edges = [];
  const discs = [];
  let edgeId = 0;

  for (let layer = 0; layer < nodes.length - 1; layer++) {
    const from = nodes[layer];
    const to = nodes[layer + 1];
    from.forEach((a, i) => {
      const nearest = to.map((b, j) => ({ b, j, gap: Math.abs(a.y - b.y) }))
        .sort((left, right) => left.gap - right.gap)
        .slice(0, 2);
      nearest.forEach(({ b, j, gap }, rank) => {
        const bend = 0.046 * Math.sin(i * 3.7 + j * 2.3 + layer * 1.4);
        const weight = Math.max(0.38, 1 - gap * 1.5) * (rank === 0 ? 1 : 0.82);
        const halfWidth = 0.0037 + weight * 0.0022;
        for (let step = 0; step < 12; step++) {
          const t0 = step / 12;
          const t1 = (step + 1) / 12;
          const p0 = curve(a, b, bend, t0);
          const p1 = curve(a, b, bend, t1);
          appendStroke(edges, p0, p1, t0, t1, halfWidth, layer, edgeId, weight);
        }
        edgeId++;
      });
    });
  }

  nodes.flat().forEach((node) => {
    // Short bifurcating dendrites give each soma its own etched silhouette.
    // They share the same forward activation as the longer weighted links.
    for (let branch = 0; branch < 5; branch++) {
      const angle = branch * Math.PI * 2 / 5 + node.index * 0.72 + node.layer * 0.37;
      const radius = node.radius;
      const tip = 1.65 + 0.23 * Math.sin(branch * 3.9 + node.index);
      const at = (distance, direction = angle) => ({
        x: node.x + Math.cos(direction) * radius * distance,
        y: node.y + Math.sin(direction) * radius * distance,
      });
      const root = at(0.78);
      const fork = at(tip);
      appendStroke(edges, root, fork, 0, 0.74, 0.0018,
        node.layer, edgeId, 0.25);
      appendStroke(edges, fork, at(tip + 0.36, angle + 0.21),
        0.74, 1, 0.00125, node.layer, edgeId, 0.25);
      appendStroke(edges, fork, at(tip + 0.31, angle - 0.25),
        0.74, 1, 0.00125, node.layer, edgeId, 0.25);
      edgeId++;
    }

    // Six vertices form a square around each neuron. The fragment shader
    // carves an irregular membrane and a pulsing nucleus from it.
    for (const [x, y] of [[-1.18, -1.18], [1.18, -1.18], [-1.18, 1.18],
      [1.18, -1.18], [1.18, 1.18], [-1.18, 1.18]]) {
      discs.push(node.x, node.y, x, y, node.layer, node.index, node.radius);
    }
  });

  return { edges: new Float32Array(edges), discs: new Float32Array(discs) };
}

export const NEURAL_EDGE_VERTEX = `
attribute vec2 aPosition;
attribute vec4 aMeta;
attribute float aWeight;
uniform float uAspect;
uniform float uScaleX;
varying vec4 vMeta;
varying float vWeight;
void main() {
  vMeta = aMeta;
  vWeight = aWeight;
  gl_Position = vec4(aPosition.x * uScaleX * 2.0 / uAspect,
                     aPosition.y * 2.0, 0.0, 1.0);
}
`;

export const NEURAL_EDGE_FRAGMENT = `
precision highp float;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uPhase;
uniform float uFrame;
uniform float uWipe;
uniform vec2 uResolution;
varying vec4 vMeta;
varying float vWeight;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
${PRINT_WIPE}
void main() {
  if (wipeReject(gl_FragCoord.xy, uResolution, uWipe)) discard;
  float t = vMeta.x;
  float side = abs(vMeta.y);
  float layer = vMeta.z;
  float id = vMeta.w;
  vec2 pixel = floor(gl_FragCoord.xy);
  float frame = floor(mod(uFrame, 72.0) * 0.5);
  float dryEdge = hash(floor(pixel * 0.46) + vec2(id * 9.1, frame * 2.7));

  // A feedforward impulse takes one layer per beat. Nearby strands respond
  // together, while individual synapses lag slightly behind one another.
  float impulse = uPhase * 4.35 - layer - 0.13 - 0.11 * hash(vec2(id, 7.0));
  float pulse = exp(-pow((t - impulse) * 9.5, 2.0));
  float spacing = abs(fract(t * 37.0 + id * 0.37) - 0.5);
  float synapses = 1.0 - smoothstep(0.13, 0.27, spacing);
  if (side > 0.49 + 0.27 * synapses + 0.20 * pulse
      + (dryEdge - 0.5) * 0.19) discard;
  float grain = hash(pixel + vec2(frame * 13.17 + id * 3.7, frame * 7.41));
  float density = 0.13 + vWeight * 0.15
    + synapses * (0.19 + vWeight * 0.20) + pulse * 0.60;
  if (grain > density) discard;
  gl_FragColor = vec4(mix(uInk, uPaper, pulse * 0.76), 1.0);
}
`;

export const NEURAL_NODE_VERTEX = `
attribute vec2 aCenter;
attribute vec2 aLocal;
attribute vec3 aMeta;
uniform float uAspect;
uniform float uScaleX;
uniform float uPhase;
varying vec2 vLocal;
varying vec2 vIdentity;
varying float vSignal;
void main() {
  float delay = aMeta.y * 0.023;
  float signal = exp(-pow((uPhase * 4.35 - aMeta.x - delay) * 2.15, 2.0));
  float radius = aMeta.z * mix(0.74, 1.0, uScaleX) * (1.0 + signal * 0.055);
  vec2 p = vec2(aCenter.x * uScaleX, aCenter.y) + aLocal * radius;
  vLocal = aLocal;
  vIdentity = aMeta.xy;
  vSignal = signal;
  gl_Position = vec4(p.x * 2.0 / uAspect, p.y * 2.0, 0.0, 1.0);
}
`;

export const NEURAL_NODE_FRAGMENT = `
precision highp float;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform float uFrame;
uniform float uWipe;
uniform vec2 uResolution;
varying vec2 vLocal;
varying vec2 vIdentity;
varying float vSignal;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
${PRINT_WIPE}
void main() {
  if (wipeReject(gl_FragCoord.xy, uResolution, uWipe)) discard;
  vec2 pixel = floor(gl_FragCoord.xy);
  float frame = floor(mod(uFrame, 72.0) * 0.5);
  float id = vIdentity.x * 9.0 + vIdentity.y;
  float angle = atan(vLocal.y, vLocal.x);
  float membrane = length(vLocal) + 0.072 * sin(angle * 5.0 + id * 2.4)
                            + 0.022 * sin(angle * 11.0 - id * 3.1);
  if (membrane > 1.12) discard;
  float rim = 1.0 - smoothstep(0.018, 0.085, abs(membrane - 0.88));
  float body = 1.0 - smoothstep(0.76, 0.98, membrane);
  float center = length(vLocal - vec2(0.11 * sin(id * 2.1), 0.10 * cos(id * 1.7)));
  float chamber = 1.0 - smoothstep(0.32, 0.39, center);
  float nucleus = 1.0 - smoothstep(0.11, 0.19, center);
  float innerRing = 1.0 - smoothstep(0.015, 0.08, abs(center - 0.43));
  float radialEtching = pow(abs(sin(angle * 9.0 + id * 3.7)), 8.0);
  float cellInk = body * (0.25 + 0.47 * vSignal)
    * (1.0 - chamber * 0.80);
  float veins = body * radialEtching * (1.0 - chamber) * 0.38;
  float halo = (1.0 - smoothstep(0.90, 1.12, membrane))
    * (0.10 + 0.16 * vSignal);
  float density = max(rim * 0.96, max(innerRing * 0.70,
    max(nucleus * 0.96, cellInk + veins))) + halo;
  float inkGrain = hash(pixel + vec2(frame * 13.17 + id * 17.0, frame * 7.41));
  float fibers = hash(floor(pixel * 0.42) + vec2(id * 19.0, frame * 3.1));
  if (inkGrain > density * (0.87 + 0.13 * fibers)) discard;
  gl_FragColor = vec4(mix(uInk, uPaper, vSignal * 0.72 + nucleus * 0.13), 1.0);
}
`;
