/**
 * A humpback breaching out at sea, drawn on a canvas over the water.
 *
 * Motion is ballistic: launched nearly vertically from below the surface, most of
 * the body clears the water, it keeps rotating backwards and lands on its back /
 * side. Water is a particle system under the same gravity: a sheet torn off the
 * surface on the way out, water pouring off the body in the air, a burst of spray
 * and mist on re-entry, then foam and flattened (perspective) ripples.
 *
 * The whale is shaded (dark back, pale belly, white pectoral fins), hazed towards
 * the horizon colour with distance, and shows faintly below the waterline.
 * Frames are only drawn while a breach is under way.
 */

type RGB = [number, number, number];
export type BreachLook = { haze: RGB; light: RGB; day: number };

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; a: number; mist?: boolean };
type Ring = { x: number; t: number; max: number; r0: number; r1: number; a: number };
type Foam = { x: number; w: number; t: number; max: number; a: number };

// Humpback, side view, head at +x; local units, length 200.
const BODY = new Path2D(
  'M200 30C198 22 186 16 168 15C140 14 110 15 84 19C70 21 62 24 56 26L50 21C47 25 44 28 40 29.5C30 32 22 34 14 36C10 30 5 25 0 24C4 31 7 35 9 38C6 42 3 47 0 52C6 50 11 46 15 42C30 44 48 46 66 46C100 47 140 45 168 42C186 40 197 37 200 30Z',
);
const FIN = new Path2D('M156 39C146 50 122 63 92 70C108 60 130 49 143 39Z');
const PLEATS = new Path2D('M122 44.5C145 44 168 41.5 188 37M126 42.6C148 42 168 40 186 35.6M132 40.8C150 40.3 168 38.6 184 34.4');
const CX = 100; // body centre in local units
const CY = 31;
const LEN = 200;

const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const css = (c: RGB, a = 1) => `rgba(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)}, ${a})`;

export function createBreach(canvas: HTMLCanvasElement, opts: { look: () => BreachLook; waterline: () => number; x: () => number }) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  let running = false;
  let first = true;
  let timer = 0;
  let raf = 0;
  let w = 0;
  let h = 0;
  /** Where the whale is while it is out of the water, for hit tests (52Hz Logbook). */
  let live: { x: number; y: number; r: number } | null = null;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const play = () => {
    if (!running) return;
    first = false;
    resize();
    const L = Math.max(70, Math.min(150, w * 0.085)); // whale length on screen
    const dir = Math.random() < 0.5 ? -1 : 1;
    const water = opts.waterline();
    const x0 = opts.x();
    // Ballistics: centre starts 0.62 L deep, peaks 0.14 L above the surface after tUp.
    const tUp = 1.35;
    const rise = 0.76 * L;
    const g = (2 * rise) / (tUp * tUp);
    const v0 = g * tUp;
    const vx = 0.16 * L * dir;
    const tEnd = tUp + Math.sqrt((2 * (rise + 0.1 * L)) / g); // back to 0.72 L deep
    const pitch = (t: number) => {
      // Nose up 76deg, rotating backwards past vertical, landing on its back.
      const k = Math.min(1, t / tEnd);
      return (-76 - 82 * (k * k * (3 - 2 * k))) * (Math.PI / 180);
    };
    const parts: P[] = [];
    const rings: Ring[] = [];
    const foam: Foam[] = [];
    let landed = false;
    let start = 0;
    let last = 0;

    const spawn = (n: number, f: (i: number) => Partial<P> & { x: number; y: number }) => {
      for (let i = 0; i < n; i++) parts.push({ vx: 0, vy: 0, life: 0, max: 1.2, r: 1.2, a: 0.85, ...f(i) });
    };
    const ring = (x: number, a = 0.5) => {
      rings.push({ x, t: 0, max: 3.4, r0: 0.3 * L, r1: 1.25 * L, a });
      rings.push({ x, t: -0.45, max: 3.8, r0: 0.2 * L, r1: 1.6 * L, a: a * 0.5 });
    };
    ring(x0, 0.18);

    const frame = (now: number) => {
      if (!start) start = last = now;
      const t = (now - start) / 1000;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const look = opts.look();
      const night = 1 - look.day;

      // Whale state.
      const cy = water + 0.62 * L - (v0 * t - 0.5 * g * t * t);
      const cx = x0 + vx * t;
      live = cy < water + 0.25 * L ? { x: cx, y: cy, r: 0.6 * L } : null;
      const vy = -(v0 - g * t);
      const ang = pitch(t);
      const s = L / LEN;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const toWorld = (lx: number, ly: number) => {
        const px = (lx - CX) * s * dir;
        const py = (ly - CY) * s;
        return [cx + px * cos - py * sin * dir, cy + px * sin * dir + py * cos] as const;
      };

      if (t < tEnd) {
        // Water sheet torn off the surface while the body crosses it on the way up.
        const out = water - cy;
        if (vy < 0 && out > -0.5 * L && out < 0.35 * L) {
          spawn(4, () => ({
            x: cx + (Math.random() - 0.5) * 0.35 * L,
            y: water - 1,
            vx: (Math.random() - 0.5) * 0.9 * L + vx,
            vy: vy * (0.35 + Math.random() * 0.5),
            max: 0.9 + Math.random() * 0.6,
            r: 0.6 + Math.random() * 1.4,
          }));
        }
        // Water pouring off the body while it is in the air.
        spawn(2, () => {
          const [px, py] = toWorld(20 + Math.random() * 170, 22 + Math.random() * 22);
          return py < water ? { x: px, y: py, vx: vx * 0.6 + (Math.random() - 0.5) * 18, vy: vy * 0.55 + Math.random() * 10, max: 1.1, r: 0.5 + Math.random() * 1.1, a: 0.7 } : { x: -99, y: -99, max: 0 };
        });
      }
      // Re-entry: the burst.
      if (!landed && vy > 0 && cy > water + 0.05 * L) {
        landed = true;
        const vs = Math.sqrt(g * L);
        spawn(110, () => {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
          const sp = vs * (0.35 + Math.random() * 0.95);
          return { x: cx + (Math.random() - 0.5) * 0.7 * L, y: water - 1, vx: Math.cos(a) * sp + vx * 0.4, vy: Math.sin(a) * sp, max: 1.3 + Math.random() * 1.1, r: 0.6 + Math.random() * 1.9 };
        });
        spawn(28, () => ({ x: cx + (Math.random() - 0.5) * 0.8 * L, y: water - Math.random() * 0.25 * L, vx: (Math.random() - 0.5) * 30, vy: -10 - Math.random() * 30, max: 2.4 + Math.random() * 1.6, r: 0.12 * L + Math.random() * 0.18 * L, a: 0.1, mist: true }));
        foam.push({ x: cx, w: 0.9 * L, t: 0, max: 5, a: 0.75 });
        ring(cx, 0.3);
      }

      // Physics.
      for (const p of parts) {
        p.life += dt;
        if (p.mist) {
          p.vy *= 0.98;
          p.r += dt * 0.08 * L;
        } else {
          p.vy += g * dt;
          p.vx *= 0.995;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (!p.mist && p.y > water && p.vy > 0) p.life = p.max; // back into the sea
      }
      for (let i = parts.length - 1; i >= 0; i--) if (parts[i].life >= parts[i].max) parts.splice(i, 1);

      // ---- Draw
      ctx.clearRect(0, 0, w, h);
      const back = mix([0.07, 0.11, 0.16], look.haze, 0.38);
      const belly = mix([0.62, 0.68, 0.73], look.haze, 0.3);
      const fin = mix([0.88, 0.9, 0.92], look.haze, 0.25);

      const drawWhale = (alpha: number, tint?: RGB) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(ang * dir);
        ctx.scale(s * dir, s);
        ctx.translate(-CX, -CY);
        ctx.globalAlpha = alpha;
        const grad = ctx.createLinearGradient(0, 14, 0, 48);
        grad.addColorStop(0, css(tint ?? back));
        grad.addColorStop(0.55, css(tint ?? mix(back, belly, 0.35)));
        grad.addColorStop(1, css(tint ?? belly));
        ctx.fillStyle = grad;
        ctx.fill(BODY);
        if (!tint) {
          ctx.strokeStyle = css(mix(belly, back, 0.4), 0.55);
          ctx.lineWidth = 0.9;
          ctx.stroke(PLEATS);
          // Rim of light along the outline from the moon / sun.
          ctx.strokeStyle = css(look.light, 0.18 + 0.12 * night);
          ctx.lineWidth = 1.2 / s;
          ctx.stroke(BODY);
          ctx.fillStyle = css(fin);
          ctx.fill(FIN);
          ctx.fillStyle = css(back);
          ctx.beginPath();
          ctx.arc(178, 29, 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fill(FIN);
        }
        ctx.restore();
      };

      if (t < tEnd + 0.3) {
        // Above the surface (with a slight swell on the waterline)...
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, w, water + Math.sin(t * 3) * 0.8);
        ctx.clip();
        drawWhale(1);
        ctx.restore();
        // ...and faintly below it, through the water.
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, water, w, h - water);
        ctx.clip();
        drawWhale(0.12 + 0.06 * night, mix(look.haze, [0.02, 0.06, 0.12], 0.6));
        ctx.restore();
        // White water collar where the body cuts the surface.
        const depth = cy - water;
        if (Math.abs(depth) < 0.7 * L) {
          ctx.fillStyle = css([1, 1, 1], 0.35 * (1 - Math.abs(depth) / (0.7 * L)));
          ctx.beginPath();
          ctx.ellipse(cx, water, 0.32 * L, 0.035 * L, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Foam patch on the water.
      for (const f of foam) {
        f.t += dt;
        const k = Math.min(1, f.t / f.max);
        const a = f.a * (1 - k) * (1 - k);
        const spread = f.w * (1 + k * 1.8);
        for (let i = 0; i < 26; i++) {
          const fx = f.x + Math.sin(i * 12.9898) * spread * 0.5;
          const fy = water + Math.abs(Math.cos(i * 78.233)) * 0.06 * L * (1 + k);
          ctx.fillStyle = css([1, 1, 1], a * (0.4 + 0.6 * Math.abs(Math.sin(i * 4.1))));
          ctx.fillRect(fx - 3 - (i % 4), fy, 6 + (i % 5) * 2, 1);
        }
      }
      // Ripples, flattened by perspective.
      for (const r of rings) {
        r.t += dt;
        if (r.t < 0) continue;
        const k = Math.min(1, r.t / r.max);
        const rx = r.r0 + (r.r1 - r.r0) * (1 - (1 - k) * (1 - k));
        ctx.strokeStyle = css([1, 1, 1], r.a * (1 - k));
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(r.x, water + 0.02 * L, rx, rx * 0.11, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      // Spray and mist: white by day, dimmer and moon-tinted by night; drops drawn as
      // short streaks along their motion, the way spray reads at a distance.
      const water_c = mix([0.97, 0.98, 1], mix(look.haze, look.light, 0.5), 0.25 + 0.35 * night);
      const bright = 0.85 - 0.3 * night;
      ctx.lineCap = 'round';
      for (const p of parts) {
        const fade = 1 - p.life / p.max;
        if (p.mist) {
          const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          gr.addColorStop(0, css(water_c, p.a * fade * bright));
          gr.addColorStop(1, css(water_c, 0));
          ctx.fillStyle = gr;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.strokeStyle = css(water_c, p.a * fade * bright);
          ctx.lineWidth = p.r;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - p.vx * 0.025, p.y - p.vy * 0.025);
          ctx.stroke();
        }
      }

      const done = t > tEnd + 0.5 && parts.length === 0 && foam.every((f) => f.t >= f.max) && rings.every((r) => r.t >= r.max);
      if (done || !running) {
        live = null;
        ctx.clearRect(0, 0, w, h);
        if (running) schedule();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    canvas.dispatchEvent(new CustomEvent('breach', { bubbles: true }));
    raf = requestAnimationFrame(frame);
  };

  const schedule = () => {
    clearTimeout(timer);
    const wait = first ? 3500 + Math.random() * 3000 : 16000 + Math.random() * 16000;
    timer = window.setTimeout(play, wait);
  };

  return {
    start() {
      if (running) return;
      running = true;
      schedule();
    },
    stop() {
      running = false;
      live = null;
      clearTimeout(timer);
      cancelAnimationFrame(raf);
      ctx.clearRect(0, 0, w, h);
    },
    resize,
    /** Is the point (canvas coordinates) on the whale while it is in the air? */
    hit(x: number, y: number) {
      return !!live && Math.hypot(x - live.x, y - live.y) < live.r;
    },
  };
}
