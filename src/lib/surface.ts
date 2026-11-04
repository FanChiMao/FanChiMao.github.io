/**
 * "Go Deeper?" water surface: one continuous gradient from the page colour down to
 * deep water whose colour lines are waves, painted per pixel once (and again when
 * the theme or width changes). No bands, no seams, no horizontal edge:
 *
 *   T(x, y) = y + A(y) * swell(x, y)      warped depth, 0 at the top, 1 at the bottom
 *   colour  = palette(ease(T))            mixed in OKLab, dithered against banding
 *
 * A(y) vanishes at both ends and `ease` is flat there, so the surface meets the
 * page above and the water below without any visible line.
 */

type Lab = [number, number, number];

const srgbToLinear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c: number) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function toOklab([r, g, b]: number[]): Lab {
  const [R, G, B] = [r, g, b].map((v) => srgbToLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
function fromOklab([L, a, b]: Lab): [number, number, number] {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const rgb = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  return rgb.map((v) => Math.round(Math.min(1, Math.max(0, linearToSrgb(v))) * 255)) as [number, number, number];
}

/** Resolve any CSS colour (hex, rgb(), named, var()-substituted) to sRGB bytes. */
function cssColour(value: string, probe: CanvasRenderingContext2D): number[] {
  probe.fillStyle = '#000';
  probe.fillStyle = value.trim();
  probe.clearRect(0, 0, 1, 1);
  probe.fillRect(0, 0, 1, 1);
  return Array.from(probe.getImageData(0, 0, 1, 1).data.slice(0, 3));
}

const smoothstep = (t: number) => t * t * (3 - 2 * t);

export function paintSurface(canvas: HTMLCanvasElement, tokens: HTMLElement, anchors = 6) {
  // Soft image: half the CSS width is plenty, the browser upscales it smoothly.
  const W = Math.max(64, Math.round(canvas.clientWidth / 2));
  const H = Math.max(32, Math.round(canvas.clientHeight / 2));
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: false });
  if (!ctx) return;

  const probe = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
  probe.canvas.width = probe.canvas.height = 1;
  const style = getComputedStyle(tokens);
  const stops = Array.from({ length: anchors }, (_, i) => toOklab(cssColour(style.getPropertyValue(`--w${i}`), probe)));

  // Palette lookup table in OKLab, 512 steps.
  const LUT = 512;
  const lut = new Float32Array(LUT * 3);
  for (let i = 0; i < LUT; i++) {
    const x = (i / (LUT - 1)) * (anchors - 1);
    const k = Math.min(anchors - 2, Math.floor(x));
    const u = x - k;
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = stops[k][c] + (stops[k + 1][c] - stops[k][c]) * u;
  }
  const rgbLut = new Uint8ClampedArray(LUT * 3);
  for (let i = 0; i < LUT; i++) rgbLut.set(fromOklab([lut[i * 3], lut[i * 3 + 1], lut[i * 3 + 2]]), i * 3);

  // About one long swell per ~700 CSS px, whatever the width.
  const cycles = Math.max(1.2, (W * 2) / 700);
  const img = ctx.createImageData(W, H);
  const d = img.data;
  let seed = 52;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let y = 0; y < H; y++) {
    const v = y / (H - 1);
    const amp = 0.16 * Math.sin(Math.PI * v) ** 1.5; // zero at the top and the bottom
    const ph = v * 2.2;
    for (let x = 0; x < W; x++) {
      const k = (x / W) * Math.PI * 2 * cycles;
      const swell = Math.sin(k + 0.6 + ph) + 0.35 * Math.sin(k * 2.3 + 1.7 + ph * 1.6) + 0.15 * Math.sin(k * 4.1 + ph * 2.4);
      const t = Math.min(1, Math.max(0, v + amp * swell));
      const i = Math.round(smoothstep(t) * (LUT - 1)) * 3;
      const o = (y * W + x) * 4;
      const n = (rand() - 0.5) * 2; // ±1 level of dither
      d[o] = rgbLut[i] + n;
      d[o + 1] = rgbLut[i + 1] + n;
      d[o + 2] = rgbLut[i + 2] + n;
      d[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
}
