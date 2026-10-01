import { FRAGMENT } from "./hero-shader.js";
import { NC_CONTOURS } from "./nc-geometry.js";
import { PRINT_WIPE } from "./print-transition.js";
import {
  makeNeuralGeometry,
  NEURAL_EDGE_VERTEX,
  NEURAL_EDGE_FRAGMENT,
  NEURAL_NODE_VERTEX,
  NEURAL_NODE_FRAGMENT,
} from "./neural-network.js";

/**
 * Six studies of Carolina and alignment, printed by one virtual press.
 * The paper never changes. Every fragment resolves to paper, plate, or ink;
 * signed-distance coverage and frame-seeded dithering provide all texture.
 */

const canvas = document.querySelector("#hero-canvas");
const stage = document.querySelector("#art-stage");
const indexNode = document.querySelector("#art-index");
const titleNode = document.querySelector("#art-title");
const descriptionNode = document.querySelector("#art-description");

const FPS = 24;
const SCENE_FRAMES = 72;
const TRANSITION_FRAMES = 24;
const SEGMENT_FRAMES = SCENE_FRAMES + TRANSITION_FRAMES;
const STILL_FRAME = 56;
const PAPER = [249, 251, 252];
const SCENES = [
  { title: "Carolina monogram", description: "The interlocking NC takes shape in printed ink.", plate: [134, 184, 212], ink: [29, 51, 68] },
  { title: "Capability landscape", description: "Uneven abilities rise across a shared field.", plate: [134, 184, 212], ink: [29, 51, 68] },
  { title: "Attention field", description: "Relations between tokens become visible as ink.", plate: [48, 64, 85], ink: [140, 196, 227] },
  { title: "Neural network", description: "Activation moves through four layers of weighted connections.", plate: [52, 73, 86], ink: [211, 229, 240] },
  { title: "The Old Well", description: "Carolina's landmark grows from roof, columns, fountain, and stone.", plate: [116, 153, 168], ink: [27, 48, 61] },
  { title: "Feature superposition", description: "Distinct features gather into one shared representation.", plate: [175, 207, 228], ink: [29, 51, 68] },
];

// A long rest, a brisk crossing, then another rest. Interpolated continuously;
// the film grain alone is stepped at 24 frames per second.
const PRESS_BEAT = [0, 0, 0.004, 0.012, 0.025, 0.05, 0.11, 0.22, 0.43, 0.7, 0.86, 0.94, 0.977, 0.993, 1, 1, 1];
const SOFT_BEAT = [0, 0.003, 0.012, 0.03, 0.067, 0.12, 0.2, 0.31, 0.46, 0.61, 0.74, 0.84, 0.92, 0.965, 0.987, 0.997, 1];

function sampleBeat(table, phase) {
  const v = Math.max(0, Math.min(1, phase)) * (table.length - 1);
  const i = Math.min(table.length - 2, Math.floor(v));
  return table[i] + (table[i + 1] - table[i]) * (v - i);
}

function markBeat(phase) {
  const x = Math.max(0, Math.min(1, (phase - 0.045) / 0.73));
  return x * x * (3 - 2 * x);
}

const VERTEX = `
attribute vec2 aPosition;
void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
`;

const MARK_VERTEX = `
attribute vec2 aPosition;
uniform float uAspect;
uniform vec2 uMarkSize;
varying vec2 vMark;
void main() {
  vMark = aPosition;
  vec2 p = aPosition * uMarkSize;
  gl_Position = vec4(p.x * 2.0 / uAspect, p.y * 2.0, 0.0, 1.0);
}
`;

const MARK_STENCIL = `
precision mediump float;
void main() { gl_FragColor = vec4(1.0); }
`;

const MARK_FILL = `
precision highp float;
uniform vec3 uColor;
uniform float uBeat;
uniform float uPhase;
uniform float uFrame;
uniform float uLayer;
uniform float uWipe;
uniform vec2 uResolution;
varying vec2 vMark;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123); }
${PRINT_WIPE}
void main() {
  if (wipeReject(gl_FragCoord.xy, uResolution, uWipe)) discard;
  // The geometry stays registered; only the pressure and pigment move.
  float frame = mod(uFrame, 72.0);
  float seed = frame * 13.17;
  vec2 pixel = floor(gl_FragCoord.xy);
  float reveal = mix(-0.58, 0.58, uBeat)
    + 0.033 * sin(vMark.x * 8.0 + 0.7 * sin(vMark.x * 17.0))
    + 0.013 * sin(vMark.x * 27.0 - 0.8);
  reveal += (hash(floor(pixel * 0.31) + vec2(frame * 5.3, uLayer * 37.0)) - 0.5) * 0.040;
  if (vMark.y > reveal) discard;

  // Slowly migrating areas of dry pressure make the print keep reprinting
  // itself. Individual pinholes turn over at 24 fps without moving the logo.
  float pressure = 0.5 + 0.5 * sin(vMark.x * 12.0 + vMark.y * 9.0 - uPhase * 10.0)
    * sin(vMark.x * 7.0 - vMark.y * 14.0 + uPhase * 7.0);
  float speckle = hash(pixel + vec2(seed + 61.0, seed + 89.0));
  float patch = hash(floor(pixel * 0.29) + vec2(seed * 0.71, uLayer * 97.0));
  float missing = (uLayer < 0.5 ? 0.055 : 0.080) + pressure * 0.105;
  if (speckle < missing || (patch < 0.13 && speckle < 0.34)) discard;
  float tone = hash(pixel + vec2(seed + 181.0, seed + 137.0));
  vec3 dryInk = uLayer < 0.5 ? vec3(0.25, 0.36, 0.42) : vec3(0.64, 0.75, 0.80);
  vec3 color = mix(uColor, dryInk, step(0.72, tone) * (0.19 + pressure * 0.21));
  gl_FragColor = vec4(color, 1.0);
}
`;

function makeProgram(gl, vertexSource, fragmentSource) {
  const vertex = makeShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = makeShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  const program = gl.createProgram();
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
  }
  return program;
}

function contourTriangles(contours) {
  const vertices = [];
  const point = (contour, index) => [
    (contour[index * 2] - 85) / 170,
    (67 - contour[index * 2 + 1]) / 134,
  ];
  for (const contour of contours) {
    const count = contour.length / 2;
    const origin = point(contour, 0);
    for (let i = 1; i < count - 1; i++) {
      vertices.push(...origin, ...point(contour, i), ...point(contour, i + 1));
    }
  }
  return new Float32Array(vertices);
}


function makeShader(gl, kind, source) {
  const shader = gl.createShader(kind);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
  }
  return shader;
}

class PrintEngine {
  constructor() {
    this.gl = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false, stencil: true, preserveDrawingBuffer: true });
    if (!this.gl) throw new Error("WebGL is unavailable");
    const gl = this.gl;
    if (!gl.getContextAttributes().stencil) throw new Error("WebGL stencil support is unavailable");
    this.program = makeProgram(gl, VERTEX, FRAGMENT);
    gl.useProgram(this.program);
    this.uniforms = Object.fromEntries(["uResolution", "uPointer", "uPaper", "uPlate", "uInk", "uFrame", "uPhase", "uBeat", "uHover", "uWipe", "uScene"].map((key) => [key, gl.getUniformLocation(this.program, key)]));
    this.buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    this.position = gl.getAttribLocation(this.program, "aPosition");
    gl.enableVertexAttribArray(this.position);
    gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);

    this.markStencilProgram = makeProgram(gl, MARK_VERTEX, MARK_STENCIL);
    this.markFillProgram = makeProgram(gl, MARK_VERTEX, MARK_FILL);
    this.markMeshes = NC_CONTOURS.map((contours) => {
      const triangles = contourTriangles(contours);
      const buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
      return { buffer, count: triangles.length / 2 };
    });
    this.markQuad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.markQuad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -0.5, -0.5, 0.5, -0.5, -0.5, 0.5,
      -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    ]), gl.STATIC_DRAW);
    this.markStencilAttrib = gl.getAttribLocation(this.markStencilProgram, "aPosition");
    this.markFillAttrib = gl.getAttribLocation(this.markFillProgram, "aPosition");
    this.markStencilUniforms = {
      aspect: gl.getUniformLocation(this.markStencilProgram, "uAspect"),
      size: gl.getUniformLocation(this.markStencilProgram, "uMarkSize"),
    };
    this.markFillUniforms = {
      aspect: gl.getUniformLocation(this.markFillProgram, "uAspect"),
      size: gl.getUniformLocation(this.markFillProgram, "uMarkSize"),
      color: gl.getUniformLocation(this.markFillProgram, "uColor"),
      beat: gl.getUniformLocation(this.markFillProgram, "uBeat"),
      phase: gl.getUniformLocation(this.markFillProgram, "uPhase"),
      frame: gl.getUniformLocation(this.markFillProgram, "uFrame"),
      layer: gl.getUniformLocation(this.markFillProgram, "uLayer"),
      wipe: gl.getUniformLocation(this.markFillProgram, "uWipe"),
      resolution: gl.getUniformLocation(this.markFillProgram, "uResolution"),
    };

    const neuralGeometry = makeNeuralGeometry();
    this.neuralEdgeProgram = makeProgram(gl, NEURAL_EDGE_VERTEX, NEURAL_EDGE_FRAGMENT);
    this.neuralNodeProgram = makeProgram(gl, NEURAL_NODE_VERTEX, NEURAL_NODE_FRAGMENT);
    this.neuralEdgeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.neuralEdgeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, neuralGeometry.edges, gl.STATIC_DRAW);
    this.neuralEdgeCount = neuralGeometry.edges.length / 7;
    this.neuralNodeBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.neuralNodeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, neuralGeometry.discs, gl.STATIC_DRAW);
    this.neuralNodeCount = neuralGeometry.discs.length / 7;
    this.neuralEdgeLocations = {
      position: gl.getAttribLocation(this.neuralEdgeProgram, "aPosition"),
      meta: gl.getAttribLocation(this.neuralEdgeProgram, "aMeta"),
      weight: gl.getAttribLocation(this.neuralEdgeProgram, "aWeight"),
      aspect: gl.getUniformLocation(this.neuralEdgeProgram, "uAspect"),
      scaleX: gl.getUniformLocation(this.neuralEdgeProgram, "uScaleX"),
      phase: gl.getUniformLocation(this.neuralEdgeProgram, "uPhase"),
      frame: gl.getUniformLocation(this.neuralEdgeProgram, "uFrame"),
      wipe: gl.getUniformLocation(this.neuralEdgeProgram, "uWipe"),
      resolution: gl.getUniformLocation(this.neuralEdgeProgram, "uResolution"),
      ink: gl.getUniformLocation(this.neuralEdgeProgram, "uInk"),
      paper: gl.getUniformLocation(this.neuralEdgeProgram, "uPaper"),
    };
    this.neuralNodeLocations = {
      center: gl.getAttribLocation(this.neuralNodeProgram, "aCenter"),
      local: gl.getAttribLocation(this.neuralNodeProgram, "aLocal"),
      meta: gl.getAttribLocation(this.neuralNodeProgram, "aMeta"),
      aspect: gl.getUniformLocation(this.neuralNodeProgram, "uAspect"),
      scaleX: gl.getUniformLocation(this.neuralNodeProgram, "uScaleX"),
      phase: gl.getUniformLocation(this.neuralNodeProgram, "uPhase"),
      frame: gl.getUniformLocation(this.neuralNodeProgram, "uFrame"),
      wipe: gl.getUniformLocation(this.neuralNodeProgram, "uWipe"),
      resolution: gl.getUniformLocation(this.neuralNodeProgram, "uResolution"),
      ink: gl.getUniformLocation(this.neuralNodeProgram, "uInk"),
      paper: gl.getUniformLocation(this.neuralNodeProgram, "uPaper"),
    };
    this.lastFrame = -1;
    this.pointer = [0, 0];
    this.pointerTarget = [0, 0];
    this.hover = 0;
    this.hoverTarget = 0;
    this.paused = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    this.reducedMotion = this.paused;
    this.frozenFrame = 4 * SEGMENT_FRAMES + STILL_FRAME;
    this.visible = true;
    this.pageVisible = !document.hidden;
    this.anchor = performance.now();
    this.scene = 0;
    this.resize();
    canvas.dataset.artReady = "true";
    updateCaption(this.paused ? 4 : this.scene);
    if (this.paused) {
      this.render(4 * SCENE_FRAMES + STILL_FRAME);
    } else {
      this.raf = requestAnimationFrame(this.tick);
    }
  }

  resize() {
    const gl = this.gl;
    if (!gl) return;
    const rect = canvas.getBoundingClientRect();
    const nominal = Math.min(window.devicePixelRatio || 1, 1.4);
    const pixelLimit = Math.sqrt(1_400_000 / Math.max(1, rect.width * rect.height));
    const dpr = Math.min(nominal, pixelLimit);
    const w = Math.max(1, Math.round(rect.width * dpr));
    const h = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      this.lastFrame = -1;
      this.render(this.paused ? this.frozenFrame : this.currentFrame());
    }
  }

  currentFrame() {
    return Math.max(0, Math.floor(((performance.now() - this.anchor) / 1000) * FPS));
  }

  render(frame) {
    if (this.reducedMotion) {
      this.drawScene(4, 1, frame, -1);
      if (this.scene !== 4) {
        this.scene = 4;
        updateCaption(4);
      }
      return;
    }
    const loopFrames = SEGMENT_FRAMES * SCENES.length;
    const frameInLoop = ((frame % loopFrames) + loopFrames) % loopFrames;
    const scene = Math.floor(frameInLoop / SEGMENT_FRAMES);
    const localFrame = frameInLoop % SEGMENT_FRAMES;
    let captionScene = scene;
    if (localFrame < SCENE_FRAMES) {
      // Each study keeps its complete original 0-to-1 animation.
      this.drawScene(scene, localFrame / (SCENE_FRAMES - 1), frame, -1);
    } else {
      // The finished plate stays in place while the next plate prints over it.
      // The incoming study starts at phase zero when the wipe has completed.
      this.drawScene(scene, 1, frame, -1);
      const progress = (localFrame - SCENE_FRAMES + 1) / TRANSITION_FRAMES;
      const incoming = (scene + 1) % SCENES.length;
      this.drawScene(incoming, 0, frame, progress);
      if (progress >= 0.56) captionScene = incoming;
    }
    if (captionScene !== this.scene) {
      this.scene = captionScene;
      updateCaption(captionScene);
    }
  }

  drawScene(scene, phase, frame, wipe) {
    const gl = this.gl;
    if (!gl) return;
    const palette = SCENES[scene];
    const u = this.uniforms;
    gl.useProgram(this.program);
    gl.uniform2f(u.uResolution, canvas.width, canvas.height);
    gl.uniform2f(u.uPointer, this.pointer[0], this.pointer[1]);
    gl.uniform3f(u.uPaper, ...PAPER.map((v) => v / 255));
    gl.uniform3f(u.uPlate, ...palette.plate.map((v) => v / 255));
    gl.uniform3f(u.uInk, ...palette.ink.map((v) => v / 255));
    gl.uniform1f(u.uFrame, frame);
    gl.uniform1f(u.uPhase, phase);
    gl.uniform1f(u.uBeat, sampleBeat(scene === 2 || scene === 3 || scene === 4 ? SOFT_BEAT : PRESS_BEAT, phase));
    gl.uniform1f(u.uHover, this.hover);
    gl.uniform1f(u.uWipe, wipe);
    gl.uniform1i(u.uScene, scene);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
    gl.enableVertexAttribArray(this.position);
    gl.vertexAttribPointer(this.position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (scene === 0) this.drawCarolinaMark(frame, phase, palette, wipe);
    if (scene === 3) this.drawNeuralNetwork(frame, phase, palette, wipe);
  }

  drawNeuralNetwork(frame, phase, palette, wipe) {
    const gl = this.gl;
    const aspect = canvas.width / canvas.height;
    const scaleX = Math.min(1, aspect / 2.05);
    const ink = palette.ink.map((v) => v / 255);
    const paper = PAPER.map((v) => v / 255);

    const edge = this.neuralEdgeLocations;
    gl.useProgram(this.neuralEdgeProgram);
    gl.uniform1f(edge.aspect, aspect);
    gl.uniform1f(edge.scaleX, scaleX);
    gl.uniform1f(edge.phase, phase);
    gl.uniform1f(edge.frame, frame);
    gl.uniform1f(edge.wipe, wipe);
    gl.uniform2f(edge.resolution, canvas.width, canvas.height);
    gl.uniform3f(edge.ink, ...ink);
    gl.uniform3f(edge.paper, ...paper);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.neuralEdgeBuffer);
    gl.enableVertexAttribArray(edge.position);
    gl.enableVertexAttribArray(edge.meta);
    gl.enableVertexAttribArray(edge.weight);
    gl.vertexAttribPointer(edge.position, 2, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(edge.meta, 4, gl.FLOAT, false, 28, 8);
    gl.vertexAttribPointer(edge.weight, 1, gl.FLOAT, false, 28, 24);
    gl.drawArrays(gl.TRIANGLES, 0, this.neuralEdgeCount);

    const node = this.neuralNodeLocations;
    gl.useProgram(this.neuralNodeProgram);
    gl.uniform1f(node.aspect, aspect);
    gl.uniform1f(node.scaleX, scaleX);
    gl.uniform1f(node.phase, phase);
    gl.uniform1f(node.frame, frame);
    gl.uniform1f(node.wipe, wipe);
    gl.uniform2f(node.resolution, canvas.width, canvas.height);
    gl.uniform3f(node.ink, ...ink);
    gl.uniform3f(node.paper, ...paper);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.neuralNodeBuffer);
    gl.enableVertexAttribArray(node.center);
    gl.enableVertexAttribArray(node.local);
    gl.enableVertexAttribArray(node.meta);
    gl.vertexAttribPointer(node.center, 2, gl.FLOAT, false, 28, 0);
    gl.vertexAttribPointer(node.local, 2, gl.FLOAT, false, 28, 8);
    gl.vertexAttribPointer(node.meta, 3, gl.FLOAT, false, 28, 16);
    gl.drawArrays(gl.TRIANGLES, 0, this.neuralNodeCount);
  }

  drawCarolinaMark(frame, phase, palette, wipe) {
    const gl = this.gl;
    const aspect = canvas.width / canvas.height;
    const width = Math.min(0.94, aspect * 0.82);
    const height = width * 134 / 170;
    gl.enable(gl.STENCIL_TEST);
    for (let layer = 0; layer < this.markMeshes.length; layer++) {
      gl.stencilMask(0xff);
      gl.clearStencil(0);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.colorMask(false, false, false, false);
      gl.stencilFunc(gl.ALWAYS, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);

      gl.useProgram(this.markStencilProgram);
      gl.uniform1f(this.markStencilUniforms.aspect, aspect);
      gl.uniform2f(this.markStencilUniforms.size, width, height);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.markMeshes[layer].buffer);
      gl.enableVertexAttribArray(this.markStencilAttrib);
      gl.vertexAttribPointer(this.markStencilAttrib, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, this.markMeshes[layer].count);

      gl.colorMask(true, true, true, true);
      gl.stencilMask(0x00);
      gl.stencilFunc(gl.EQUAL, 0xff, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.useProgram(this.markFillProgram);
      gl.uniform1f(this.markFillUniforms.aspect, aspect);
      gl.uniform2f(this.markFillUniforms.size, width, height);
      gl.uniform3f(this.markFillUniforms.color, ...(layer === 0 ? palette.ink : PAPER).map((v) => v / 255));
      const printPhase = layer === 0 ? phase : Math.max(0, (phase - 0.09) / 0.91);
      gl.uniform1f(this.markFillUniforms.beat, markBeat(printPhase));
      gl.uniform1f(this.markFillUniforms.phase, phase);
      gl.uniform1f(this.markFillUniforms.frame, frame);
      gl.uniform1f(this.markFillUniforms.layer, layer);
      gl.uniform1f(this.markFillUniforms.wipe, wipe);
      gl.uniform2f(this.markFillUniforms.resolution, canvas.width, canvas.height);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.markQuad);
      gl.enableVertexAttribArray(this.markFillAttrib);
      gl.vertexAttribPointer(this.markFillAttrib, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    gl.stencilMask(0xff);
    gl.disable(gl.STENCIL_TEST);
  }

  tick = (now) => {
    if (this.paused || !this.visible || !this.pageVisible) return;
    const frame = this.currentFrame();
    const easing = 0.13;
    this.pointer[0] += (this.pointerTarget[0] - this.pointer[0]) * easing;
    this.pointer[1] += (this.pointerTarget[1] - this.pointer[1]) * easing;
    this.hover += (this.hoverTarget - this.hover) * easing;
    const activePointer = Math.abs(this.hover - this.hoverTarget) > 0.001 || Math.abs(this.pointer[0] - this.pointerTarget[0]) > 0.001 || Math.abs(this.pointer[1] - this.pointerTarget[1]) > 0.001;
    if (frame !== this.lastFrame || activePointer) {
      this.lastFrame = frame;
      this.render(frame);
    }
    this.raf = requestAnimationFrame(this.tick);
  };

  sync() {
    cancelAnimationFrame(this.raf);
    if (!this.paused && this.visible && this.pageVisible) this.raf = requestAnimationFrame(this.tick);
  }

  setPaused(value) {
    if (this.paused === value) return;
    if (value) {
      this.frozenFrame = this.currentFrame();
      this.paused = true;
      cancelAnimationFrame(this.raf);
    } else {
      this.anchor = performance.now() - (this.frozenFrame / FPS) * 1000;
      this.paused = false;
      this.sync();
    }
  }
}

function updateCaption(scene) {
  const data = SCENES[scene];
  indexNode.textContent = `${String(scene + 1).padStart(2, "0")} / 06`;
  titleNode.textContent = data.title;
  descriptionNode.textContent = data.description;
  stage.dataset.scene = String(scene);
}

let engine;
try {
  engine = new PrintEngine();
} catch (error) {
  console.error("The animated print could not start:", error);
  stage.classList.add("art-unavailable");
}

if (engine) {
  const resizeObserver = new ResizeObserver(() => engine.resize());
  resizeObserver.observe(stage);
  const intersection = new IntersectionObserver(([entry]) => {
    engine.visible = entry.isIntersecting;
    engine.sync();
  }, { threshold: 0.08 });
  intersection.observe(stage);
  document.addEventListener("visibilitychange", () => {
    engine.pageVisible = !document.hidden;
    engine.sync();
  });
  stage.addEventListener("pointermove", (event) => {
    const rect = stage.getBoundingClientRect();
    engine.pointerTarget[0] = (event.clientX - rect.left - rect.width / 2) / rect.height;
    engine.pointerTarget[1] = (rect.height / 2 - (event.clientY - rect.top)) / rect.height;
    engine.hoverTarget = 1;
  });
  stage.addEventListener("pointerleave", () => { engine.hoverTarget = 0; });
  const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  motionQuery.addEventListener("change", (event) => {
    engine.reducedMotion = event.matches;
    engine.setPaused(event.matches);
    if (event.matches) engine.render(4 * SCENE_FRAMES + STILL_FRAME);
  });
}
