// A stationary grain pattern lets the next plate roll across the old one.
// The feathered front keeps the handoff inside the same screenprint language.
export const PRINT_WIPE = `
bool wipeReject(vec2 frag, vec2 resolution, float progress) {
  if (progress < 0.0) return false;
  float travel = smoothstep(0.02, 0.96, progress);
  vec2 uv = frag / resolution;
  float front = mix(-0.22, 1.22, travel);
  float paperWave = 0.046 * sin(uv.y * 8.4 + 0.8)
                  + 0.022 * sin(uv.y * 25.0 - 0.3);
  float d = front - (uv.x + paperWave);
  float coverage = smoothstep(-0.085, 0.085, d);
  float grain = hash(floor(frag) + vec2(41.0, 73.0));
  return grain > coverage;
}
`;
