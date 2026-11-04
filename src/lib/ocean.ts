/**
 * Night-sea surface for the personal hero: a small WebGL fragment shader.
 *
 * A perspective-projected height field (a few directional swells plus noise)
 * reflects a dark sky through a Fresnel term, with a glitter path towards a
 * faint light just above the horizon, and fades into haze at the horizon so it
 * meets the sky seamlessly. Rendered below CSS resolution (water is soft) and
 * paused whenever it is not visible.
 *
 * Colours and light height come from a palette (moonlit night / sunrise), swappable
 * at runtime when the theme changes.
 *
 * Returns null when WebGL is unavailable; the caller keeps its 2D fallback.
 */

type RGB = [number, number, number];
export type OceanPalette = {
  /** Haze at the horizon (should match the sky just above it). */
  horizon: RGB;
  /** Sky high up, as seen in reflections. */
  zenith: RGB;
  /** Water colour looking straight down. */
  deep: RGB;
  /** Colour of the glitter path. */
  light: RGB;
  /** Glow of the sky around the light. */
  glow: RGB;
  /** Colour the sea settles into at the bottom (the page below). */
  fade: RGB;
  /** Height of the light above the horizon (direction y). */
  lightY: number;
  /** Glitter strength. */
  spec: number;
};

const hex = (h: string): RGB => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as RGB;

export const PALETTES: Record<'night' | 'dawn', OceanPalette> = {
  night: {
    horizon: [0.039, 0.149, 0.27],
    zenith: [0.008, 0.031, 0.078],
    deep: [0.004, 0.02, 0.047],
    light: [0.78, 0.88, 1.0],
    glow: [0.1, 0.2, 0.32],
    fade: [0.008, 0.031, 0.078],
    lightY: 0.09,
    spec: 1.5,
  },
  dawn: {
    horizon: hex('#f4c9a2'),
    zenith: hex('#93b3d8'),
    deep: hex('#2c4c6e'),
    light: hex('#fff0c9'),
    glow: [0.5, 0.32, 0.12],
    fade: hex('#eef3f7'),
    lightY: 0.025,
    spec: 1.8,
  },
};

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uLightX; // screen x (0..1) of the light above the horizon
uniform float uLightY;
uniform float uSpec;
uniform vec3 uHorizon, uZenith, uDeep, uLight, uGlow, uFade;


float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// Water height at plane position p; far-away detail is damped to avoid shimmering.
float height(vec2 p, float dist){
  float t = uTime;
  float damp = exp(-dist * 0.018);
  float h = 0.0;
  h += 0.110 * sin(dot(p, vec2(0.28, 1.00)) * 0.55 + t * 0.80);
  h += 0.070 * sin(dot(p, vec2(-0.55, 1.00)) * 0.95 + t * 1.15);
  h += 0.045 * sin(dot(p, vec2(0.85, 0.55)) * 1.70 + t * 1.60) * damp;
  h += 0.025 * sin(dot(p, vec2(-0.25, 0.95)) * 3.10 + t * 2.20) * damp;
  h += 0.030 * (noise(p * 1.6 + vec2(t * 0.15, t * 0.35)) - 0.5) * damp;
  h += 0.015 * (noise(p * 4.2 - vec2(t * 0.25, t * 0.10)) - 0.5) * damp * damp;
  return h;
}

vec3 sky(vec3 r, vec3 L){
  vec3 c = mix(uHorizon, uZenith, smoothstep(0.0, 0.35, r.y));
  // Soft glow of the light just above the horizon.
  float g = max(dot(r, L), 0.0);
  c += uGlow * pow(g, 18.0);
  return c;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float v = 1.0 - frag.y / uRes.y;              // 0 at the horizon, 1 at the bottom
  float aspect = uRes.x / uRes.y;
  vec3 L = normalize(vec3((uLightX - 0.5) * aspect * 0.32, uLightY, 1.0));
  vec3 rd = normalize(vec3((frag.x / uRes.x - 0.5) * aspect * 0.32, -(v * 0.32 + 0.0015), 1.0));
  float camH = 1.6;
  float dist = camH / -rd.y;
  vec2 p = vec2(rd.x, rd.z) * dist;

  float e = 0.04 + dist * 0.004;
  float h  = height(p, dist);
  float hx = height(p + vec2(e, 0.0), dist);
  float hz = height(p + vec2(0.0, e), dist);
  vec3 n = normalize(vec3(-(hx - h) / e, 1.0, -(hz - h) / e));

  vec3 r = reflect(rd, n);
  r.y = abs(r.y);
  float fres = 0.02 + 0.98 * pow(1.0 - max(dot(n, -rd), 0.0), 5.0);

  float s = max(dot(r, L), 0.0);
  float spec = (pow(s, 900.0) + pow(s, 120.0) * 0.09) * uSpec;

  vec3 col = mix(uDeep, sky(r, L), fres) + uLight * spec;
  col = mix(col, uHorizon, 1.0 - exp(-dist * 0.012));  // haze towards the horizon
  col = mix(col, uFade, smoothstep(0.55, 1.0, v));     // settle into the page below
  gl_FragColor = vec4(col, 1.0);
}`;

export type Ocean = { start: () => void; stop: () => void; resize: () => void; still: () => void; setPalette: (p: OceanPalette) => void };

export function createOcean(canvas: HTMLCanvasElement, palette: OceanPalette = PALETTES.night): Ocean | null {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, powerPreference: 'low-power' });
  if (!gl) return null;

  const compile = (type: number, src: string) => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    return gl.getShaderParameter(sh, gl.COMPILE_STATUS) ? sh : null;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  // One triangle covering the viewport.
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uLightX = gl.getUniformLocation(prog, 'uLightX');
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const applyPalette = (p: OceanPalette) => {
    gl.uniform3fv(u('uHorizon'), p.horizon);
    gl.uniform3fv(u('uZenith'), p.zenith);
    gl.uniform3fv(u('uDeep'), p.deep);
    gl.uniform3fv(u('uLight'), p.light);
    gl.uniform3fv(u('uGlow'), p.glow);
    gl.uniform3fv(u('uFade'), p.fade);
    gl.uniform1f(u('uLightY'), p.lightY);
    gl.uniform1f(u('uSpec'), p.spec);
  };
  applyPalette(palette);

  // Water is soft: render below CSS resolution and let the browser upscale.
  const scale = Math.min(devicePixelRatio || 1, 1) * 0.7;
  const resize = () => {
    const w = Math.max(1, Math.round(canvas.clientWidth * scale));
    const h = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
    gl.uniform2f(uRes, w, h);
    // Keep the glitter path clear of centred UI: under the copy on wide screens, to the right on narrow ones.
    const lx = parseFloat(getComputedStyle(canvas).getPropertyValue('--light-x')) || 0.5;
    gl.uniform1f(uLightX, lx);
  };

  const t0 = performance.now();
  const render = (now: number) => {
    gl.uniform1f(uTime, (now - t0) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  // Phones and coarse pointers get 30 fps; the swell is slow enough.
  const minDt = matchMedia('(pointer: coarse)').matches ? 33 : 16;
  let raf = 0;
  let last = 0;
  let lost = false;
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (now - last < minDt - 1) return;
    last = now;
    render(now);
  };
  canvas.addEventListener('webglcontextlost', (ev) => {
    ev.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    canvas.dispatchEvent(new CustomEvent('ocean:lost'));
  });

  resize();
  return {
    resize: () => {
      if (lost) return;
      resize();
      render(performance.now());
    },
    start: () => {
      if (lost) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    },
    stop: () => cancelAnimationFrame(raf),
    still: () => {
      if (!lost) render(t0 + 4000);
    },
    setPalette: (p: OceanPalette) => {
      if (lost) return;
      applyPalette(p);
      render(performance.now());
    },
  };
}
