/**
 * Pixel Ajie's sprite sheet: 32 × 32 frames, facing right, one animation per row.
 *
 * Until a drawn sheet exists, a placeholder is painted here in code, after his photos: an orange
 * tabby with a pink nose, pale paws, a ringed tail and a tipped ear. To use a drawn sheet, put a PNG
 * with the same layout (rows as in ANIMS, frames left to right, transparent background, feet on
 * row 29 or 30) in public/ and point SHEET_SRC at it; nothing else changes.
 */
export const FRAME = 32;

export const ANIMS = {
  idle: { row: 0, frames: 4 }, // 0-2 tail sway, 3 blink
  walk: { row: 1, frames: 6 },
  run: { row: 2, frames: 4 },
  sit: { row: 3, frames: 4 },
  groom: { row: 4, frames: 4 },
  sleep: { row: 5, frames: 2 },
  jump: { row: 6, frames: 3 }, // crouch, rising, falling
  happy: { row: 7, frames: 4 },
  held: { row: 8, frames: 2 },
  surprised: { row: 9, frames: 2 },
  lie: { row: 10, frames: 4 }, // lying down, head up, watching; the tail tip flicks
  play: { row: 11, frames: 4 }, // lying, facing us, batting a paw over the edge below (front view: never mirrored)
  stretch: { row: 12, frames: 4 }, // waking up: front legs reaching forward, rear up (played once)
  arch: { row: 13, frames: 4 }, // then the back arched up high (played once)
} as const;
export type Anim = keyof typeof ANIMS;

/** A drawn sheet in public/ (e.g. '/ajie/pixel-ajie.png'); empty: the placeholder below. */
export const SHEET_SRC = '/ajie/pixel-ajie.png';

// ---------------------------------------------------------------- placeholder painter

const PAL = {
  O: '#4a2a12', // outline
  F: '#ee9a48', // fur
  D: '#d27f34', // far-side legs
  S: '#c4661f', // tabby stripes
  L: '#fcd8a6', // muzzle, chest, paws
  P: '#f29b9b', // nose, blush, tongue
  I: '#f5b4a2', // inner ear
  E: '#2a1c10', // eyes
  W: '#ffffff', // eye shine
} as const;
type K = keyof typeof PAL;
type Eyes = 'open' | 'closed' | 'happy' | 'wide';

class Px {
  b: (K | null)[] = new Array(FRAME * FRAME).fill(null);
  set(x: number, y: number, k: K) {
    x = Math.floor(x);
    y = Math.floor(y);
    if (x >= 0 && x < FRAME && y >= 0 && y < FRAME) this.b[y * FRAME + x] = k;
  }
  get(x: number, y: number) {
    return x >= 0 && x < FRAME && y >= 0 && y < FRAME ? this.b[y * FRAME + x] : null;
  }
  ellipse(cx: number, cy: number, rx: number, ry: number, k: K) {
    for (let y = 0; y < FRAME; y++)
      for (let x = 0; x < FRAME; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, k);
      }
  }
  poly(pts: [number, number][], k: K) {
    for (let y = 0; y < FRAME; y++)
      for (let x = 0; x < FRAME; x++) {
        const px = x + 0.5, py = y + 0.5;
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, k);
      }
  }
  /** A thick line of t × t squares. */
  line(x0: number, y0: number, x1: number, y1: number, k: K, t = 2) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    for (let i = 0; i <= n; i++) {
      const x = x0 + ((x1 - x0) * i) / n, y = y0 + ((y1 - y0) * i) / n;
      for (let a = 0; a < t; a++) for (let c = 0; c < t; c++) this.set(x + a, y + c, k);
    }
  }
  clear(test: (x: number, y: number) => boolean) {
    for (let y = 0; y < FRAME; y++) for (let x = 0; x < FRAME; x++) if (test(x, y)) this.b[y * FRAME + x] = null;
  }
  /** A dark edge around the whole silhouette. */
  outline() {
    const add: [number, number][] = [];
    for (let y = 0; y < FRAME; y++)
      for (let x = 0; x < FRAME; x++) {
        if (this.get(x, y)) continue;
        const n = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)];
        if (n.some((k) => k && k !== 'O')) add.push([x, y]);
      }
    for (const [x, y] of add) this.set(x, y, 'O');
  }
  paint(g: CanvasRenderingContext2D, ox: number, oy: number) {
    for (let y = 0; y < FRAME; y++)
      for (let x = 0; x < FRAME; x++) {
        const k = this.b[y * FRAME + x];
        if (!k) continue;
        g.fillStyle = PAL[k];
        g.fillRect(ox + x, oy + y, 1, 1);
      }
  }
}

/** Ears first (the head covers their base). The near ear is tipped, like Ajie's. */
function ears(p: Px, hx: number, hy: number) {
  p.poly([[hx - 6, hy - 2.5], [hx - 4.5, hy - 9], [hx - 0.5, hy - 4.5]], 'F');
  p.poly([[hx + 0.5, hy - 4.5], [hx + 4.5, hy - 9], [hx + 6, hy - 2.5]], 'F');
  p.clear((x, y) => x > hx + 1 && y < Math.floor(hy - 7)); // the tip
  p.poly([[hx - 4.8, hy - 3.5], [hx - 4.3, hy - 7], [hx - 1.8, hy - 4.5]], 'I');
  p.poly([[hx + 1.8, hy - 4.5], [hx + 4.2, hy - 6.8], [hx + 4.8, hy - 3.5]], 'I');
}

function head(p: Px, hx: number, hy: number) {
  ears(p, hx, hy);
  p.ellipse(hx, hy, 6.5, 5.5, 'F');
  p.ellipse(hx + 3, hy + 2.8, 2.8, 1.8, 'L');
  for (const [x, y] of [[-2, -4], [0, -5], [0, -4], [2, -4]]) p.set(hx + x, hy + y, 'S');
}

/** Face details, after the outline. */
function face(p: Px, hx: number, hy: number, eyes: Eyes, mouth = false) {
  for (const ex of [Math.floor(hx - 3.5), Math.floor(hx + 1.5)]) {
    const ey = Math.floor(hy - 1);
    if (eyes === 'open' || eyes === 'wide') {
      const top = eyes === 'wide' ? ey - 1 : ey;
      for (let y = top; y <= ey + 1; y++) (p.set(ex, y, 'E'), p.set(ex + 1, y, 'E'));
      p.set(ex + 1, top, 'W');
    } else if (eyes === 'closed') {
      p.set(ex, ey + 1, 'O');
      p.set(ex + 1, ey + 1, 'O');
    } else {
      p.set(ex, ey + 1, 'O');
      p.set(ex + 1, ey, 'O');
      p.set(ex + 2, ey + 1, 'O');
    }
  }
  p.set(hx + 4.5, hy + 1.5, 'P');
  p.set(hx - 4.5, hy + 1.5, 'P');
  p.set(hx + 3.5, hy + 3.5, mouth ? 'P' : 'O');
}

/** A ringed tail: segments from (x, y), each turned by its angle (0 up, -90 left, 90 right, 180 down). */
function tail(p: Px, x: number, y: number, angles: number[], seg = 3, t = 2) {
  angles.forEach((a, i) => {
    const r = (a * Math.PI) / 180;
    const nx = x + Math.sin(r) * seg, ny = y - Math.cos(r) * seg;
    p.line(x, y, nx, ny, i % 2 ? 'S' : 'F', t);
    x = nx;
    y = ny;
  });
}

function leg(p: Px, x: number, top: number, bottom: number, lean: number, k: K) {
  p.line(x, top, x + lean, bottom - 1, k);
  p.set(x + lean, bottom, 'L');
  p.set(x + lean + 1, bottom, 'L');
}

type Stand = {
  b?: number; // body bob (negative: up)
  legs?: [dx: number, lift: number, lean: number][]; // far back, far front, near back, near front
  tail?: number[];
  eyes?: Eyes;
  thick?: number;
  long?: number; // extra leg length (falling)
};

function stand(p: Px, o: Stand = {}) {
  const b = o.b ?? 0;
  const legs = o.legs ?? [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const xs = [7, 17, 10, 20];
  const bottom = 29 + (o.long ?? 0);
  tail(p, 7, 19 + b, o.tail ?? [-60, -25, 0, 25], 3, o.thick ?? 2);
  for (const i of [0, 1]) leg(p, xs[i] + legs[i][0], 24 + b, bottom - legs[i][1], legs[i][2], 'D');
  p.ellipse(14, 21.5 + b, 8.5, 5, 'F');
  p.ellipse(20.5, 22 + b, 2.6, 3, 'L');
  for (const x of [9, 12, 15]) (p.set(x, 17 + b, 'S'), p.set(x, 18 + b, 'S'));
  for (const i of [2, 3]) leg(p, xs[i] + legs[i][0], 24 + b, bottom - legs[i][1], legs[i][2], 'F');
  head(p, 22.5, 13.5 + b);
  p.outline();
  face(p, 22.5, 13.5 + b, o.eyes ?? 'open');
}

type Sit = { h?: number; eyes?: Eyes; tail?: number; paw?: number; mouth?: boolean };

function sit(p: Px, o: Sit = {}) {
  const hy = 11 + (o.h ?? 0);
  tail(p, 8, 28, [-90, -60, -20, 10 + (o.tail ?? 0)]);
  p.ellipse(14, 22, 6.5, 7, 'F');
  p.ellipse(11, 25.5, 4.5, 3.5, 'F');
  p.line(13, 28, 15, 28, 'F');
  p.set(14, 29, 'L');
  p.set(15, 29, 'L');
  p.ellipse(18, 21, 2.4, 4, 'L');
  for (const y of [17, 18]) (p.set(10, y, 'S'), p.set(12, y - 1, 'S'));
  leg(p, 16, 22, 29, 0, 'D');
  if (o.paw === undefined) leg(p, 19, 22, 29, 0, 'F');
  else {
    // Paw raised to the mouth (grooming).
    p.line(19, 22, 21, 16 + o.paw, 'F');
    p.set(21, 15 + o.paw, 'L');
    p.set(22, 15 + o.paw, 'L');
  }
  head(p, 18.5, hy);
  p.outline();
  face(p, 18.5, hy, o.eyes ?? 'open', o.mouth);
}

/** Lying down: asleep (tail wrapped round, eyes shut) or awake (head up, tail flicking behind). */
function loaf(p: Px, breath: number, awake?: { flick: number; eyes: Eyes }) {
  if (awake) tail(p, 7, 27, [-80, -45 + awake.flick, -10 + awake.flick * 1.5], 3);
  p.ellipse(15, 25 - breath * 0.5, 10, 4.5 + breath * 0.5, 'F');
  for (const x of [8, 11, 14]) (p.set(x, 22 - breath, 'S'), p.set(x, 23 - breath, 'S'));
  if (awake) {
    // Front paws stretched out in front.
    p.line(21, 27, 27, 27, 'F');
    for (const x of [26, 27, 28]) p.set(x, 28, 'L');
  } else tail(p, 6, 28, [90, 90, 90], 4);
  const hy = awake ? 19 : 21;
  head(p, 23, hy);
  p.outline();
  face(p, 23, hy, awake?.eyes ?? 'closed');
}

function held(p: Px, sway: number) {
  tail(p, 16, 26, [180 - sway * 10, 180 + sway * 15], 3);
  leg(p, 11, 16, 22, -1 + sway, 'D');
  leg(p, 13, 24, 29, -1, 'D');
  p.ellipse(16, 20, 5, 6.5, 'F');
  p.ellipse(16, 19, 2.5, 3.5, 'L');
  leg(p, 20, 16, 22, 1 + sway, 'F');
  leg(p, 18, 24, 29, 1, 'F');
  head(p, 16, 10);
  p.outline();
  face(p, 16, 10, sway ? 'open' : 'wide');
}

/** Facing us, lying on a ledge; one paw raised or reaching down over its edge (rows 30-31). */
function front(p: Px, paw: 'up' | 'down', eyes: Eyes, flick: number) {
  tail(p, 24, 27, [70, 25 + flick, -5 + flick], 3);
  p.ellipse(16, 25, 10, 4.5, 'F');
  p.ellipse(20.5, 28.5, 2.4, 1.5, 'L'); // the resting paw
  if (paw === 'down') {
    p.line(10, 25, 8, 28, 'F');
    for (const [x, y] of [[8, 30], [9, 30], [8, 31], [9, 31]]) p.set(x, y, 'L');
  } else {
    p.line(10, 24, 6, 19, 'F');
    for (const [x, y] of [[5, 17], [6, 17], [5, 18], [6, 18]]) p.set(x, y, 'L');
  }
  p.poly([[9.5, 13], [10.5, 5], [14.5, 9.5]], 'F');
  p.poly([[17.5, 9.5], [21.5, 5], [22.5, 13]], 'F');
  p.clear((x, y) => x > 18 && y < 7); // the tipped ear
  p.poly([[11, 11], [11.3, 7], [13.5, 9.8]], 'I');
  p.poly([[18.5, 9.8], [20.7, 7.5], [21, 11]], 'I');
  p.ellipse(16, 15, 7, 6, 'F');
  p.ellipse(16, 18.5, 3.2, 2, 'L');
  for (const [x, y] of [[13, 10], [15, 9], [15, 10], [16, 9], [16, 10], [18, 10]]) p.set(x, y, 'S');
  p.outline();
  for (const ex of [11, 19]) {
    if (eyes === 'happy') {
      p.set(ex - 1, 15, 'O');
      p.set(ex, 14, 'O');
      p.set(ex + 1, 14, 'O');
      p.set(ex + 2, 15, 'O');
    } else {
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) p.set(ex + dx, 14 + dy, 'E');
      p.set(ex, 14, 'W');
    }
  }
  p.set(15, 17, 'P');
  p.set(16, 17, 'P');
  p.set(15, 19, 'O');
  p.set(16, 19, 'O');
  p.set(10, 17, 'P');
  p.set(21, 17, 'P');
}

type Draw = (p: Px) => void;

/** Frames per animation, in ANIMS row order. */
function frames(): Record<Anim, Draw[]> {
  const walk: Draw[] = [];
  for (let i = 0; i < 6; i++) {
    const t = (i / 6) * Math.PI * 2;
    const a = Math.round(Math.sin(t) * 1.5), lift = (s: number) => (s > 0.5 ? 1 : 0);
    walk.push((p) =>
      stand(p, {
        b: i % 3 === 1 ? -1 : 0,
        legs: [[a, lift(Math.cos(t)), 0], [-a, lift(-Math.cos(t)), 0], [-a, lift(-Math.cos(t)), 0], [a, lift(Math.cos(t)), 0]],
        tail: [-60, -25 + Math.sin(t) * 8, 0 + Math.sin(t) * 10, 25],
      }),
    );
  }
  const runTail = [-62, -50, -38];
  return {
    idle: [0, 6, 12, 0].map((s, i) => (p: Px) => stand(p, { tail: [-60, -25 + s / 2, s, 25 + s], eyes: i === 3 ? 'closed' : 'open' })),
    walk,
    run: [
      (p) => stand(p, { legs: [[3, 1, 0], [-2, 1, 0], [2, 1, 0], [-3, 1, 0]], tail: runTail }),
      (p) => stand(p, { b: -1, legs: [[0, 0, -3], [0, 0, 3], [0, 0, -3], [0, 0, 3]], tail: runTail }),
      (p) => stand(p, { b: -2, legs: [[-2, 1, -2], [2, 1, 3], [-2, 1, -2], [2, 1, 3]], tail: runTail }),
      (p) => stand(p, { b: -1, legs: [[-1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, 1]], tail: runTail }),
    ],
    sit: [0, 8, 16, 8].map((s) => (p: Px) => sit(p, { tail: s })),
    groom: [0, 1, 0, 1].map((s, i) => (p: Px) => sit(p, { h: 1, paw: s, eyes: 'closed', mouth: i % 2 === 1 })),
    sleep: [0, 1].map((s) => (p: Px) => loaf(p, s)),
    jump: [
      (p) => stand(p, { b: 1, tail: [-50, -30, -10] }),
      (p) => stand(p, { b: -2, legs: [[0, 1, -2], [0, 1, 2], [0, 1, -2], [0, 1, 2]], tail: [-70, -55, -40], eyes: 'wide' }),
      (p) => stand(p, { b: -1, long: 1, legs: [[0, 0, -1], [1, 0, 1], [0, 0, -1], [1, 0, 1]], tail: [-40, -10, 10, 30] }),
    ],
    happy: [0, -1, 0, -1].map((h, i) => (p: Px) => sit(p, { h, eyes: 'happy', mouth: true, tail: i * 10 })),
    held: [0, 1].map((s) => (p: Px) => held(p, s)),
    surprised: [-1, -2].map((b) => (p: Px) => stand(p, { b, eyes: 'wide', tail: [-10, 0, 0, 5], thick: 3 })),
    lie: [0, 10, 20, 10].map((flick, i) => (p: Px) => loaf(p, i % 2, { flick, eyes: 'open' })),
    play: [
      (p) => front(p, 'up', 'open', 0),
      (p) => front(p, 'down', 'open', 10),
      (p) => front(p, 'up', 'open', 20),
      (p) => front(p, 'down', 'happy', 10),
    ],
    // Rough stand-ins (the drawn sheet has the real stretches).
    stretch: [0, 1, 2, 2].map((s) => (p: Px) => stand(p, { b: s > 0 ? 1 : 0, legs: [[0, 0, -s], [s, 0, s + 1], [0, 0, -s], [s, 0, s + 1]], tail: [-20, -5, 5, 15], eyes: s === 2 ? 'closed' : 'open' })),
    arch: [0, 1, 2, 1].map((s) => (p: Px) => stand(p, { b: -s, tail: [-30, -10, 0, 10], eyes: s === 2 ? 'closed' : 'open' })),
  };
}

/** The placeholder sheet, painted once. */
export function buildSheet(): HTMLCanvasElement {
  const all = frames();
  const cols = Math.max(...Object.values(ANIMS).map((a) => a.frames));
  const c = document.createElement('canvas');
  c.width = cols * FRAME;
  c.height = Object.keys(ANIMS).length * FRAME;
  const g = c.getContext('2d')!;
  for (const [name, { row }] of Object.entries(ANIMS) as [Anim, (typeof ANIMS)[Anim]][]) {
    all[name].forEach((draw, i) => {
      const p = new Px();
      draw(p);
      p.paint(g, i * FRAME, row * FRAME);
    });
  }
  return c;
}
