/**
 * The Journey's globe view: a stylised 3D Earth (three.js, through the small MiniGlobe) in the site's deep-sea
 * look, with a pin on each milestone's exact spot. Loaded only when the reader switches to the
 * globe, so the timeline stays light.
 *
 * The land (Natural Earth via world-atlas, public domain) is painted once onto a canvas: a faint
 * fill, glowing coastlines and a dot matrix, plus a graticule. That texture is the globe's
 * surface, so nothing heavy runs per frame and there is no polygon triangulation (which froze the
 * page for tens of seconds with detailed coastlines). Zoomed in, a second canvas is painted for
 * just the region in view (with the 1:10m coastline, loaded then) and laid over the globe, so the
 * coast stays sharp at any zoom; it is repainted once the camera rests somewhere else.
 *
 * Colours come from CSS custom properties on the stage (--globe-ocean, --globe-dot, ...), so the
 * globe follows the light / dark theme.
 *
 * Pins that land too close together on screen are drawn as one group (a count), recomputed as the
 * camera moves, so a cluster like northern Taiwan never piles up into unreadable labels.
 */
import { MiniGlobe } from './mini-globe';
import { BufferGeometry, CanvasTexture, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshPhongMaterial, SRGBColorSpace } from 'three';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import landUrl from 'world-atlas/land-50m.json?url';
import landDetailUrl from 'world-atlas/land-10m.json?url';

export type Pin = { id: string; lat: number; lng: number };

/**
 * What is drawn on the globe: a single pin, a group of pins too close together on screen (at
 * their centre), or the "peek" pin shown while the reader points at a milestone in a group's list.
 */
export type Mark = { kind: 'pin'; pin: Pin; lat: number; lng: number } | { kind: 'group'; pins: Pin[]; lat: number; lng: number } | { kind: 'peek'; pin: Pin; lat: number; lng: number };

export type GlobeView = {
  /** Show these pins (newest first: the first one of a group leads it). `solo`: never grouped (the picked one). */
  setPins(pins: Pin[], solo?: string | null): void;
  /** Redraw every mark (e.g. after the language or the picked pin changed). */
  redraw(): void;
  /** Show the real pin of a milestone on top of its group, or none. */
  peek(pin: Pin | null): void;
  /** Turn and zoom to a pin. */
  flyTo(pin: Pin): void;
  /** Turn and zoom so these pins fill the view. */
  flyToAll(pins: Pin[]): void;
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

const RADIUS = 100; // the globe's radius in scene units (globe.gl's convention, kept by MiniGlobe)
type Palette = { oceanTop: string; ocean: string; oceanBottom: string; land: string; coast: string; dot: string; grid: string; glow: string };
/** A land ring in [lng, lat], made continuous across the date line, with its bounding box. */
type Ring = { pts: [number, number][]; lng0: number; lng1: number; lat0: number; lat1: number };
/** What a canvas covers (degrees; lng may run past +-180) and its size in px. */
type View = { lng0: number; lng1: number; lat0: number; lat1: number; W: number; H: number; detail: boolean };

/**
 * Land rings, ready to paint. Natural Earth cuts some rings at the date line (Chukotka, Fiji,
 * Antarctica): drawn as they are, they jump from +180 to -180 and streak across the whole map,
 * which on the sphere shows as rings around the poles. Each ring is unwrapped instead (no jump
 * over 180 degrees), painted again 360 degrees to each side, and a ring that goes all the way
 * round (Antarctica) is closed over its pole.
 */
function prepare(topo: Topology): Ring[] {
  const geo = feature(topo, topo.objects.land) as unknown as { features?: { geometry: { type: string; coordinates: unknown } }[]; geometry?: { type: string; coordinates: unknown } };
  const geoms = geo.features ? geo.features.map((f) => f.geometry) : geo.geometry ? [geo.geometry] : [];
  const raw: [number, number][][] = [];
  for (const g of geoms) {
    if (g.type === 'Polygon') raw.push(...(g.coordinates as [number, number][][]));
    if (g.type === 'MultiPolygon') for (const p of g.coordinates as [number, number][][][]) raw.push(...p);
  }
  const out: Ring[] = [];
  for (const r of raw) {
    if (r.length < 3) continue;
    const pts: [number, number][] = [[r[0][0], r[0][1]]];
    for (let i = 1; i < r.length; i++) {
      let lng = r[i][0];
      const prev = pts[i - 1][0];
      while (lng - prev > 180) lng -= 360;
      while (lng - prev < -180) lng += 360;
      pts.push([lng, r[i][1]]);
    }
    const lats = pts.map((p) => p[1]);
    const first = pts[0], last = pts[pts.length - 1];
    if (Math.abs(last[0] - first[0]) > 180) {
      // Round the whole Earth: close it over the pole it surrounds.
      const pole = lats.reduce((a, b) => a + b, 0) / lats.length > 0 ? 90 : -90;
      pts.push([last[0], pole], [first[0], pole]);
    }
    const lngs = pts.map((p) => p[0]);
    out.push({ pts, lng0: Math.min(...lngs), lng1: Math.max(...lngs), lat0: Math.min(...pts.map((p) => p[1])), lat1: Math.max(...pts.map((p) => p[1])) });
  }
  return out;
}

async function loadLand(url: string): Promise<Ring[]> {
  return prepare((await (await fetch(url)).json()) as Topology);
}

/** Spacing of the dot matrix on the whole globe, in degrees. */
const DOT_STEP = 360 / 520;

/**
 * Paints a piece of the surface (or all of it): ocean gradient, graticule, land fill, coastline
 * glow and a dot matrix. The dots sit on the same grid at every scale (halved when zoomed in
 * close), so a detail canvas lines up with the globe's own texture.
 */
function paint(rings: Ring[], c: Palette, v: View): HTMLCanvasElement {
  const { W, H } = v;
  const sx = W / (v.lng1 - v.lng0);
  const sy = H / (v.lat1 - v.lat0);
  const x = (lng: number) => (lng - v.lng0) * sx;
  const y = (lat: number) => (v.lat1 - lat) * sy;
  // Rings (and their copies one turn to either side) that reach into this view.
  const shown: [Ring, number][] = [];
  for (const r of rings)
    for (const o of [-360, 0, 360]) if (r.lng1 + o >= v.lng0 && r.lng0 + o <= v.lng1 && r.lat1 >= v.lat0 && r.lat0 <= v.lat1) shown.push([r, o]);
  const path = (ctx: CanvasRenderingContext2D, k = 1) => {
    ctx.beginPath();
    for (const [r, o] of shown) {
      r.pts.forEach(([lng, lat], i) => (i ? ctx.lineTo(x(lng + o) * k, y(lat) * k) : ctx.moveTo(x(lng + o) * k, y(lat) * k)));
      ctx.closePath();
    }
  };

  // Land mask at a small size (cheap to read back), to know where the dots go.
  const k = Math.min(1, 2048 / W);
  const MW = Math.round(W * k);
  const MH = Math.max(1, Math.round(H * k));
  const mask = document.createElement('canvas');
  mask.width = MW;
  mask.height = MH;
  const m = mask.getContext('2d', { willReadFrequently: true })!;
  m.fillStyle = '#fff';
  path(m, k);
  m.fill('evenodd');
  const alpha = m.getImageData(0, 0, MW, MH).data;
  const onLand = (px: number, py: number) => {
    const ix = Math.floor(px * k), iy = Math.floor(py * k);
    return ix >= 0 && iy >= 0 && ix < MW && iy < MH && alpha[(iy * MW + ix) * 4 + 3] >= 128;
  };

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const sea = ctx.createLinearGradient(0, y(90), 0, y(-90));
  sea.addColorStop(0, c.oceanTop);
  sea.addColorStop(0.5, c.ocean);
  sea.addColorStop(1, c.oceanBottom);
  ctx.fillStyle = sea;
  ctx.fillRect(0, 0, W, H);

  // Graticule every 15 degrees.
  ctx.strokeStyle = c.grid;
  ctx.lineWidth = v.detail ? 1.2 : W / 4096;
  ctx.beginPath();
  for (let lng = Math.ceil(v.lng0 / 15) * 15; lng <= v.lng1; lng += 15) {
    ctx.moveTo(x(lng), 0);
    ctx.lineTo(x(lng), H);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    if (lat < v.lat0 || lat > v.lat1) continue;
    ctx.moveTo(0, y(lat));
    ctx.lineTo(W, y(lat));
  }
  ctx.stroke();

  // Land: a faint fill and a soft glowing coastline (thin on screen when zoomed in).
  path(ctx);
  ctx.fillStyle = c.land;
  ctx.fill('evenodd');
  ctx.strokeStyle = c.coast;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = v.detail ? 7 : W / 900; // soft halo
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = v.detail ? 2 : W / 3000; // crisp line
  ctx.stroke();

  // Dot matrix on land, spaced evenly on the sphere (wider apart in pixels towards the poles).
  let step = DOT_STEP;
  if (v.detail) while (step * sx > 36) step /= 2; // close up: denser, not just bigger
  const rx = step * 0.3 * sx;
  const ry = step * 0.3 * sy;
  ctx.fillStyle = c.dot;
  ctx.beginPath();
  for (let row = Math.max(0, Math.floor((90 - v.lat1) / step) - 1); ; row++) {
    const lat = 90 - (row + 0.5) * step;
    if (lat < Math.max(-90, v.lat0 - step)) break;
    const dx = step / Math.max(0.12, Math.cos((lat * Math.PI) / 180));
    const offset = (Math.round(row + 0.5) % 2) * (dx / 2);
    const west = -180 + offset;
    for (let j = Math.ceil((v.lng0 - west) / dx); west + j * dx <= v.lng1; j++) {
      const px = x(west + j * dx), py = y(lat);
      if (!onLand(px, py)) continue;
      ctx.moveTo(px + rx, py);
      ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2);
    }
  }
  ctx.fill();

  // A detail canvas fades out at its edges into the globe's own texture underneath.
  if (v.detail) {
    ctx.globalCompositeOperation = 'destination-in';
    const e = 0.12;
    for (const [x0, y0, x1, y1] of [
      [0, 0, W, 0],
      [0, 0, 0, H],
    ]) {
      const fade = ctx.createLinearGradient(x0, y0, x1, y1);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(e, 'rgba(0,0,0,1)');
      fade.addColorStop(1 - e, 'rgba(0,0,0,1)');
      fade.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, W, H);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  return canvas;
}

/** A piece of sphere just above the globe, covering a View, for a detail canvas. */
function patchGeometry(v: View): BufferGeometry {
  const N = 48;
  const r = RADIUS * 1.0006;
  const pos: number[] = [], nrm: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= N; i++) {
    const lat = Math.max(-89.9, Math.min(89.9, v.lat0 + ((v.lat1 - v.lat0) * i) / N));
    for (let j = 0; j <= N; j++) {
      const lng = v.lng0 + ((v.lng1 - v.lng0) * j) / N;
      // globe.gl's own mapping of lat / lng to the scene.
      const phi = (90 - lat) * toRad, theta = (90 - lng) * toRad;
      const nx = Math.sin(phi) * Math.cos(theta), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(theta);
      pos.push(nx * r, ny * r, nz * r);
      nrm.push(nx, ny, nz);
      uv.push(j / N, (lat - v.lat0) / (v.lat1 - v.lat0));
    }
  }
  for (let i = 0; i < N; i++)
    for (let j = 0; j < N; j++) {
      const a = i * (N + 1) + j, b = a + 1, c2 = a + N + 1, d = c2 + 1;
      idx.push(a, c2, b, b, c2, d);
    }
  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(pos, 3));
  geo.setAttribute('normal', new Float32BufferAttribute(nrm, 3));
  geo.setAttribute('uv', new Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  return geo;
}

/** Pins closer than this on screen (px) are drawn as one group. */
const GROUP_PX = 56;
const toRad = Math.PI / 180;

/** Unit-vector mean of points (works across the date line). */
function centreOf(points: { lat: number; lng: number }[]) {
  let x = 0, y = 0, z = 0;
  for (const p of points) {
    const la = p.lat * toRad, lo = p.lng * toRad;
    x += Math.cos(la) * Math.cos(lo);
    y += Math.cos(la) * Math.sin(lo);
    z += Math.sin(la);
  }
  return { lat: Math.atan2(z, Math.hypot(x, y)) / toRad, lng: Math.atan2(y, x) / toRad };
}

/** Great-circle angle between two points, in radians. */
function arc(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const s = Math.sin(((b.lat - a.lat) * toRad) / 2) ** 2 + Math.cos(a.lat * toRad) * Math.cos(b.lat * toRad) * Math.sin(((b.lng - a.lng) * toRad) / 2) ** 2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(s)));
}

export async function createGlobe(stage: HTMLElement, draw: (m: Mark) => HTMLElement, reduceMotion: boolean): Promise<GlobeView> {
  const land = await loadLand(landUrl);
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

  const g = new MiniGlobe(stage, { rendererConfig: { antialias: true, alpha: true }, animateIn: !reduceMotion })
    .backgroundColor('rgba(0,0,0,0)')
    .showAtmosphere(true)
    .atmosphereAltitude(0.2)
    .htmlLat('lat')
    .htmlLng('lng')
    .htmlAltitude(0.002)
    .htmlElement((d) => draw(d as Mark))
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
    texture.image = paint(land, c, { lng0: -180, lng1: 180, lat0: -90, lat1: 90, W, H: W / 2, detail: false });
    texture.needsUpdate = true;
    g.atmosphereColor(c.glow);
    detail.invalidate();
  };

  // ---- Detail: zoomed in, the region in view gets its own sharp canvas over the globe.
  const DETAIL_BELOW = 0.8; // camera altitude (in Earth radii) under which it is used
  const DW = matchMedia('(min-width: 900px)').matches ? 2048 : 1536;
  const detail = (() => {
    let fine: Ring[] | null = null;
    let loadingFine = false;
    let at: { lat: number; lng: number; altitude: number; halfLat: number; halfLng: number } | null = null;
    const mat = new MeshPhongMaterial({ shininess: 10, specular: new Color('#1d2b3c'), emissive: new Color('#0a1a2c'), emissiveIntensity: 0.35, transparent: true, depthWrite: false, side: DoubleSide });
    const mesh = new Mesh(new BufferGeometry(), mat);
    mesh.renderOrder = 1;
    mesh.visible = false;
    g.scene().add(mesh);
    const paintAt = (lat: number, lng: number, altitude: number) => {
      if (!fine && !loadingFine) {
        loadingFine = true;
        loadLand(landDetailUrl)
          .then((r) => {
            fine = r;
            at = null; // repaint with the finer coastline
          })
          .catch(() => {});
      }
      const aspect = Math.max(1, stage.clientWidth / Math.max(1, stage.clientHeight));
      const cos = Math.max(0.2, Math.cos(lat * toRad));
      const halfLat = Math.min(40, Math.max(1.5, altitude * 42));
      const halfLng = Math.min(90, (halfLat * aspect) / cos);
      const v: View = {
        lat0: Math.max(-90, lat - halfLat),
        lat1: Math.min(90, lat + halfLat),
        lng0: lng - halfLng,
        lng1: lng + halfLng,
        W: DW,
        H: Math.round(Math.min(DW, Math.max(256, (DW * (2 * halfLat)) / (2 * halfLng * cos)))),
        detail: true,
      };
      const tex = new CanvasTexture(paint(fine ?? land, css(), v));
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = texture.anisotropy;
      mat.map?.dispose();
      mat.map = tex;
      mat.needsUpdate = true;
      mesh.geometry.dispose();
      mesh.geometry = patchGeometry(v);
      mesh.visible = true;
      at = { lat, lng, altitude, halfLat, halfLng };
    };
    return {
      /** Every frame: hide it when zoomed out; repaint once the camera rests outside the painted part. */
      update(resting: boolean) {
        const { lat, lng, altitude } = g.pointOfView();
        if (altitude > DETAIL_BELOW) {
          mesh.visible = false;
          return;
        }
        if (at) {
          const dLng = ((((lng - at.lng) % 360) + 540) % 360) - 180;
          const fresh = altitude > at.altitude / 1.6 && altitude < at.altitude * 1.6 && Math.abs(lat - at.lat) < at.halfLat * 0.35 && Math.abs(dLng) < at.halfLng * 0.35;
          if (fresh) {
            mesh.visible = true;
            return;
          }
        }
        if (resting) paintAt(lat, lng, altitude);
      },
      invalidate() {
        at = null;
      },
    };
  })();

  repaint();
  g.globeMaterial(surface);

  const controls = g.controls();
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.rotateSpeed = 0.6;
  controls.zoomSpeed = 0.9;
  controls.minDistance = RADIUS * 1.06; // regional scale: the painted coastline stays crisp
  controls.maxDistance = RADIUS * 5;
  // Spin like the real Earth: west to east, so the surface moves left to right. A positive speed
  // orbits the camera westward (towards lower longitudes), which turns the Earth eastward under it.
  // Stops for good once the reader takes over.
  let spinListener: (on: boolean) => void = () => {};
  const spin = (on: boolean) => {
    controls.autoRotate = on;
    spinListener(on);
  };
  controls.autoRotateSpeed = 0.45;
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
  let solo: string | null = null;
  let peeked: Pin | null = null;
  const ms = (n: number) => (reduceMotion ? 0 : n);
  const centre = () => (pins.length ? centreOf(pins) : { lat: 23.7, lng: 121 }); // Taiwan

  // ---- Grouping. Marks are cached by key, so an unchanged mark keeps its element (no flicker).
  let cache = new Map<string, Mark>();
  let shownKey = '';
  /** Is this point on the side of the Earth facing the camera? */
  const facing = (p: Pin) => {
    const phi = (90 - p.lat) * toRad, theta = (90 - p.lng) * toRad;
    const x = RADIUS * Math.sin(phi) * Math.cos(theta), y = RADIUS * Math.cos(phi), z = RADIUS * Math.sin(phi) * Math.sin(theta);
    const c = camera.position;
    return x * c.x + y * c.y + z * c.z > RADIUS * RADIUS;
  };
  const regroup = (force = false) => {
    const w = stage.clientWidth, h = stage.clientHeight;
    const groups: { pins: Pin[]; x: number; y: number; front: boolean }[] = [];
    for (const p of pins) {
      if (p.id === solo) continue;
      const { x, y } = g.getScreenCoords(p.lat, p.lng, 0.002);
      const front = facing(p);
      // Off-screen or behind the Earth: drawn alone (MiniGlobe hides it), never pulls others in.
      const near = front && x > -GROUP_PX && y > -GROUP_PX && x < w + GROUP_PX && y < h + GROUP_PX ? groups.find((gr) => gr.front && Math.hypot(gr.x - x, gr.y - y) < GROUP_PX) : undefined;
      if (near) near.pins.push(p);
      else groups.push({ pins: [p], x, y, front });
    }
    const marks: Mark[] = [];
    const keys: string[] = [];
    const take = (key: string, make: () => Mark) => {
      keys.push(key);
      const m = cache.get(key) ?? make();
      marks.push(m);
    };
    for (const gr of groups) {
      if (gr.pins.length === 1) {
        const p = gr.pins[0];
        take(`p:${p.id}`, () => ({ kind: 'pin', pin: p, lat: p.lat, lng: p.lng }));
      } else take(`g:${gr.pins.map((p) => p.id).join(',')}`, () => ({ kind: 'group', pins: gr.pins, ...centreOf(gr.pins) }));
    }
    const soloPin = pins.find((p) => p.id === solo);
    if (soloPin) take(`p:${soloPin.id}`, () => ({ kind: 'pin', pin: soloPin, lat: soloPin.lat, lng: soloPin.lng }));
    if (peeked && peeked.id !== solo) {
      const p = peeked;
      take(`k:${p.id}`, () => ({ kind: 'peek', pin: p, lat: p.lat, lng: p.lng }));
    }
    const key = keys.join('|');
    if (!force && key === shownKey) return;
    shownKey = key;
    cache = new Map(keys.map((k, i) => [k, marks[i]]));
    g.htmlElementsData(marks);
  };
  const rebuild = () => {
    cache = new Map();
    regroup(true);
  };
  // Regroup whenever the camera moves (drags, zooms, fly-to animations, spinning): cheap, and
  // the pins are only redrawn when the grouping really changes.
  let last = '';
  let looping = true;
  let movedAt = 0;
  const loop = () => {
    if (!looping) return;
    const c = camera.position;
    const now = `${c.x.toFixed(2)},${c.y.toFixed(2)},${c.z.toFixed(2)},${stage.clientWidth}x${stage.clientHeight}`;
    const t = performance.now();
    if (now !== last) {
      last = now;
      movedAt = t;
      regroup();
    }
    // The detail canvas is painted only once the camera has rested a moment (not mid-flight).
    detail.update(t - movedAt > 160);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  return {
    setPins(next, only = null) {
      pins = next;
      solo = only;
      if (peeked && !next.some((p) => p.id === peeked!.id)) peeked = null;
      rebuild();
    },
    redraw: rebuild,
    peek(p) {
      if ((p?.id ?? null) === (peeked?.id ?? null)) return;
      peeked = p;
      regroup(true);
    },
    flyTo(p) {
      if (controls.autoRotate) spin(false);
      g.pointOfView({ lat: p.lat, lng: p.lng, altitude: 0.35 }, ms(1600));
    },
    flyToAll(list) {
      if (!list.length) return;
      if (controls.autoRotate) spin(false);
      const c = centreOf(list);
      const spread = Math.max(...list.map((p) => arc(c, p)));
      // About 2.4 x the spread fills the view comfortably; never closer than the zoom limit.
      g.pointOfView({ ...c, altitude: Math.min(1.9, Math.max(0.07, spread * 2.4 + 0.05)) }, ms(1400));
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
    pause: () => {
      looping = false;
      g.pauseAnimation();
    },
    resume: () => {
      g.resumeAnimation();
      if (looping) return;
      looping = true;
      requestAnimationFrame(loop);
    },
  };
}
