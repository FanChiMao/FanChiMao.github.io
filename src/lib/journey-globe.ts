/**
 * The Journey's globe view: a stylised 3D Earth (three.js through globe.gl) in the site's deep-sea
 * look, with a pin on each milestone's exact spot. Loaded only when the reader switches to the
 * globe, so the timeline stays light.
 *
 * The land (Natural Earth via world-atlas, public domain) is painted once onto a canvas: a faint
 * fill, glowing coastlines and a dot matrix, plus a graticule. That texture is the globe's
 * surface, so nothing heavy runs per frame and there is no polygon triangulation (which froze the
 * page for tens of seconds with detailed coastlines).
 *
 * Colours come from CSS custom properties on the stage (--globe-ocean, --globe-dot, ...), so the
 * globe follows the light / dark theme.
 */
import Globe, { type GlobeInstance } from 'globe.gl';
import { CanvasTexture, Color, MeshPhongMaterial, SRGBColorSpace } from 'three';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import landUrl from 'world-atlas/land-50m.json?url';

export type Pin = { id: string; lat: number; lng: number };

export type GlobeView = {
  /** Show these pins (each drawn by the `pin` callback). */
  setPins(pins: Pin[]): void;
  /** Turn and zoom to a pin. */
  flyTo(pin: Pin): void;
  /** Back to the whole globe, centred on the pins. */
  reset(instant?: boolean): void;
  /** Turn like the real Earth (west to east) or stop. */
  setSpin(on: boolean): void;
  /** Called when spinning starts or stops (also when the reader grabs the globe). */
  onSpin(cb: (on: boolean) => void): void;
  /** Called once per gesture when the reader really turns or zooms the globe (not on a plain tap, not on flyTo). */
  onUserMove(cb: () => void): void;
  pause(): void;
  resume(): void;
};

/** WebGL is needed; some locked-down browsers turn it off. */
export function canDrawGlobe(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

const RADIUS = 100; // globe.gl's globe radius in scene units
type Ring = [number, number][];
type Palette = { oceanTop: string; ocean: string; oceanBottom: string; land: string; coast: string; dot: string; grid: string; glow: string };

/** Land as polygons (outer ring first), in [lng, lat]. */
async function loadLand(): Promise<Ring[][]> {
  const topo = (await (await fetch(landUrl)).json()) as Topology;
  const geo = feature(topo, topo.objects.land) as unknown as { features?: { geometry: { type: string; coordinates: unknown } }[]; geometry?: { type: string; coordinates: unknown } };
  const geoms = geo.features ? geo.features.map((f) => f.geometry) : geo.geometry ? [geo.geometry] : [];
  const out: Ring[][] = [];
  for (const g of geoms) {
    if (g.type === 'Polygon') out.push(g.coordinates as Ring[]);
    if (g.type === 'MultiPolygon') out.push(...(g.coordinates as Ring[][]));
  }
  return out;
}

/** Paints the surface: ocean gradient, graticule, land fill, coastline glow and a dot matrix. */
function paint(land: Ring[][], c: Palette, W: number): HTMLCanvasElement {
  const H = W / 2;
  const x = (lng: number) => ((lng + 180) / 360) * W;
  const y = (lat: number) => ((90 - lat) / 180) * H;
  const path = (ctx: CanvasRenderingContext2D, k = 1) => {
    ctx.beginPath();
    for (const poly of land)
      for (const ring of poly) {
        ring.forEach(([lng, lat], i) => (i ? ctx.lineTo(x(lng) * k, y(lat) * k) : ctx.moveTo(x(lng) * k, y(lat) * k)));
        ctx.closePath();
      }
  };

  // Land mask at a fixed small size (cheap to read back), to know where the dots go.
  const MW = 2048;
  const MH = MW / 2;
  const k = MW / W;
  const mask = document.createElement('canvas');
  mask.width = MW;
  mask.height = MH;
  const m = mask.getContext('2d', { willReadFrequently: true })!;
  m.fillStyle = '#fff';
  path(m, k);
  m.fill('evenodd');
  const alpha = m.getImageData(0, 0, MW, MH).data;
  const onLand = (px: number, py: number) => alpha[(Math.min(MH - 1, Math.floor(py * k)) * MW + Math.min(MW - 1, Math.floor(px * k))) * 4 + 3] >= 128;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const sea = ctx.createLinearGradient(0, 0, 0, H);
  sea.addColorStop(0, c.oceanTop);
  sea.addColorStop(0.5, c.ocean);
  sea.addColorStop(1, c.oceanBottom);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, W, H);

  // Graticule every 15 degrees.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = W / 4096;
  ctx.beginPath();
  for (let lng = -180; lng <= 180; lng += 15) {
    ctx.moveTo(x(lng), 0);
    ctx.lineTo(x(lng), H);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.moveTo(0, y(lat));
    ctx.lineTo(W, y(lat));
  }
  ctx.stroke();

  // Land: a faint fill and a soft glowing coastline.
  path(ctx);
  ctx.fillStyle = c.land;
  ctx.fill('evenodd');
  ctx.strokeStyle = c.coast;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = W / 900; // soft halo
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = W / 3000; // crisp line
  ctx.stroke();

  // Dot matrix on land, spaced evenly on the sphere (wider apart in pixels towards the poles).
  const step = W / 520;
  const r = step * 0.3;
  ctx.fillStyle = c.dot;
  ctx.beginPath();
  for (let py = step / 2; py < H; py += step) {
    const lat = 90 - (py / H) * 180;
    const dx = step / Math.max(0.12, Math.cos((lat * Math.PI) / 180));
    const offset = (Math.round(py / step) % 2) * (dx / 2);
    for (let px = offset; px < W; px += dx) {
      if (!onLand(px, py)) continue;
      ctx.moveTo(px + r, py);
      ctx.arc(px, py, r, 0, Math.PI * 2);
    }
  }
  ctx.fill();
  return canvas;
}

export async function createGlobe(stage: HTMLElement, pin: (p: Pin) => HTMLElement, reduceMotion: boolean): Promise<GlobeView> {
  const land = await loadLand();
  const css = (): Palette => {
    const s = getComputedStyle(stage);
    const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
    return {
      oceanTop: v('--globe-ocean-top', '#08182c'),
      ocean: v('--globe-ocean', '#0b2440'),
      oceanBottom: v('--globe-ocean-bottom', '#071526'),
      land: v('--globe-land', 'rgba(70, 170, 190, 0.16)'),
      coast: v('--globe-coast', 'rgba(120, 220, 235, 0.75)'),
      dot: v('--globe-dot', 'rgba(140, 230, 240, 0.85)'),
      grid: v('--globe-grid', 'rgba(120, 200, 255, 0.10)'),
      glow: v('--globe-glow', '#4fb6ff'),
    };
  };

  const g: GlobeInstance = new Globe(stage, { rendererConfig: { antialias: true, alpha: true }, waitForGlobeReady: false, animateIn: !reduceMotion })
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereAltitude(0.2)
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(0.002)
    .htmlElement((d) => pin(d as Pin))
    .htmlTransitionDuration(0)
    // Pins on the far side of the Earth fade out instead of showing through it.
    .htmlElementVisibilityModifier((el, visible) => el.classList.toggle('is-behind', !visible));

  // Texture size: sharp on big screens, light on phones (and within the GPU's limit).
  const max = g.renderer().capabilities.maxTextureSize;
  const W = Math.min(max, matchMedia('(min-width: 900px)').matches ? 8192 : 4096);
  const texture = new CanvasTexture(document.createElement('canvas'));
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = Math.min(8, g.renderer().capabilities.getMaxAnisotropy());
  const surface = new MeshPhongMaterial({ map: texture, shininess: 10, specular: new Color('#1d2b3c'), emissive: new Color('#0a1a2c'), emissiveIntensity: 0.35 });
  const repaint = () => {
    const c = css();
    texture.image = paint(land, c, W);
    texture.needsUpdate = true;
    g.atmosphereColor(c.glow);
  };
  repaint();
  g.globeMaterial(surface);

  const controls = g.controls();
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.minDistance = RADIUS * 1.06; // regional scale: the painted coastline stays crisp
  controls.maxDistance = RADIUS * 5;
  // Spin like the real Earth: west to east, so the surface moves left to right (the camera orbits
  // the other way, hence the negative speed). Stops for good once the reader takes over.
  let spinListener: (on: boolean) => void = () => {};
  const spin = (on: boolean) => {
    controls.autoRotate = on;
    spinListener(on);
  };
  controls.autoRotateSpeed = -0.45;
  controls.autoRotate = !reduceMotion;
  controls.addEventListener('start', () => controls.autoRotate && spin(false));

  // A drag or zoom by the reader ('start' only fires for user input). A tap on a pin can also
  // start a gesture, so it only counts once the camera has really moved.
  let moveListener: () => void = () => {};
  const camera = g.camera();
  let from: { x: number; y: number; z: number } | null = null;
  controls.addEventListener('start', () => (from = camera.position.clone()));
  controls.addEventListener('change', () => {
    if (!from || camera.position.distanceTo(from as never) < RADIUS * 0.02) return;
    from = null;
    moveListener();
  });
  controls.addEventListener('end', () => (from = null));

  const size = () => g.width(stage.clientWidth).height(stage.clientHeight);
  size();
  new ResizeObserver(size).observe(stage);

  // Follow the site theme.
  new MutationObserver(repaint).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  let pins: Pin[] = [];
  const ms = (n: number) => (reduceMotion ? 0 : n);
  /** Centre of the pins (by unit vectors, so it works across the date line). */
  const centre = () => {
    if (!pins.length) return { lat: 23.7, lng: 121 }; // Taiwan
    let x = 0, y = 0, z = 0;
    for (const p of pins) {
      const la = (p.lat * Math.PI) / 180, lo = (p.lng * Math.PI) / 180;
      x += Math.cos(la) * Math.cos(lo);
      y += Math.cos(la) * Math.sin(lo);
      z += Math.sin(la);
    }
    return { lat: (Math.atan2(z, Math.hypot(x, y)) * 180) / Math.PI, lng: (Math.atan2(y, x) * 180) / Math.PI };
  };

  return {
    setPins(next) {
      pins = next;
      g.htmlElementsData(next);
    },
    flyTo(p) {
      if (controls.autoRotate) spin(false);
      g.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.35 }, ms(1600));
    },
    reset(instant = false) {
      g.pointOfView({ ...centre(), altitude: 1.9 }, instant ? 0 : ms(1200));
    },
    setSpin: spin,
    onSpin(cb) {
      spinListener = cb;
      cb(controls.autoRotate);
    },
    onUserMove(cb) {
      moveListener = cb;
    },
    pause: () => g.pauseAnimation(),
    resume: () => g.resumeAnimation(),
  };
}
