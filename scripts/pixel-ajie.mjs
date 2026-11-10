/**
 * Turns a generated Pixel Ajie sheet into the one the page uses (docs/specs/pixel-ajie/README.md).
 *
 *   node scripts/pixel-ajie.mjs <generated.png> [public/ajie/pixel-ajie.png]
 *
 * Image models draw the sheet larger than asked, not on an exact grid (cats drift into the next
 * cell), with soft or semi-transparent edges and a reddish fringe from background removal. So
 * instead of cutting a fixed grid, this finds the cats: rows are split at the empty bands between
 * them, each row into its frames at the empty columns. Every cat is then scaled by the same factor to
 * the 32 px grid (the most common colour in the middle of each block), with every pixel fully
 * opaque or transparent, standing on the floor line (row 30) and, in side views, lined up on its
 * front (the head), so frames of one animation neither hop nor slide. Open eyes, which scaling turns
 * to mush, are found in the full-size image and redrawn clean. Writes an 8× preview to the system temp
 * folder to check by eye (NO_EYES=1 skips the eye redraw, to compare).
 */
import sharp from 'sharp';
import os from 'node:os';
import path from 'node:path';

const COLS = 6, F = 32;
const FLOOR = 30; // lowest row the feet / belly sit on
// Frames per row (src/lib/ajie-pet/sprite.ts ANIMS): unused cells are left empty.
const FRAMES = [4, 6, 4, 4, 4, 2, 3, 4, 2, 2, 4, 4, 4, 4];
const ROWS = FRAMES.length;
/** Rows drawn facing us (held, play): centred instead of lined up on the head. */
const FRONT = new Set([8, 11]);

const [src, out = 'public/ajie/pixel-ajie.png'] = process.argv.slice(2);
if (!src) {
  console.error('Usage: node scripts/pixel-ajie.mjs <generated.png> [out.png]');
  process.exit(1);
}

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height;
/** Leftover background (red / magenta tint) on the edge of the cut-out. */
const fringe = (r, g, b) => r > 140 && g < 0.45 * r && b < 0.55 * r && Math.abs(g - b) < 60 && r - g > 110;
const solid = new Uint8Array(W * H);
for (let i = 0; i < W * H; i++) {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2], a = data[i * 4 + 3];
  solid[i] = a >= 128 && !fringe(r, g, b) ? 1 : 0;
}

/** Runs of non-empty positions (gaps up to `gap` bridged), dropping specks lighter than `minShare` of the heaviest. */
function runs(counts, gap, minShare) {
  const segs = [];
  let start = -1, last = -1;
  counts.forEach((c, i) => {
    if (!c) return;
    if (start < 0) start = i;
    else if (i - last - 1 > gap) (segs.push([start, last]), (start = i));
    last = i;
  });
  if (start >= 0) segs.push([start, last]);
  const weight = (s) => counts.slice(s[0], s[1] + 1).reduce((a, b) => a + b, 0);
  const max = Math.max(0, ...segs.map(weight));
  return segs.filter((s) => weight(s) >= max * minShare);
}
/** Merges the closest neighbours until there are `n` runs (a detached tail tip, a split ear...). */
function mergeTo(segs, n) {
  while (segs.length > n) {
    let k = 0;
    for (let i = 1; i < segs.length - 1; i++) if (segs[i + 1][0] - segs[i][1] < segs[k + 1][0] - segs[k][1]) k = i;
    segs.splice(k, 2, [segs[k][0], segs[k + 1][1]]);
  }
  return segs;
}

// Eyes: a few pixels of pupil, iris and shine, which scaling by a fraction turns to mush. They are
// found in the full-size source instead, where a pupil is a clear blob of near-black with yellow-green
// iris round it (the outline is browner, closed eyes have no iris): each open eye is painted over on
// the 32 px frame with the fur round it and redrawn clean there (dark pupil, white shine, iris).
const EYE_DARK = [43, 24, 10], EYE_SHINE = [255, 250, 235], EYE_IRIS = [190, 196, 62];
// Yellow-green (e.g. 244,220,50 / 212,180,27): nearly as much green as red, hardly any blue. Orange fur
// has much less green, cream fur much more blue.
const isIris = ([r, g, b]) => r > 80 && g > 90 && g >= 0.82 * r && b < 0.4 * g;
const isDark = ([r, g, b]) => r + g + b < 230;
const srcPx = (x, y) => {
  const i = (y * W + x) * 4;
  return [data[i], data[i + 1], data[i + 2], data[i + 3]];
};
/** Open eyes of one cat in the source: centre and height (source px). */
function sourceEyes(c, s) {
  const inCat = (x, y) => x >= c.x0 && x <= c.x1 && y >= c.y0 && y <= c.y1;
  const pupil = (x, y) => {
    if (!inCat(x, y)) return false;
    const [r, g, b, a] = srcPx(x, y);
    return a >= 128 && r + g + b < 60;
  };
  // Anywhere in the cat (the head is low in a stretch): the iris round a pupil tells it from other dark bits.
  const headEnd = c.y1;
  const seen = new Set(), eyes = [];
  for (let y = c.y0; y <= headEnd; y++)
    for (let x = c.x0; x <= c.x1; x++) {
      if (seen.has(y * W + x) || !pupil(x, y)) continue;
      const pts = [], todo = [[x, y]];
      seen.add(y * W + x);
      while (todo.length) {
        const [px, py] = todo.pop();
        pts.push([px, py]);
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            const nx = px + dx, ny = py + dy;
            if (seen.has(ny * W + nx) || !pupil(nx, ny)) continue;
            seen.add(ny * W + nx);
            todo.push([nx, ny]);
          }
      }
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      if (pts.length < 4 || x1 - x0 > 5 * s || y1 - y0 > 5 * s) continue; // a speck, or the outline
      let iris = 0;
      const pad = Math.ceil(s);
      for (let yy = y0 - pad; yy <= y1 + pad; yy++) for (let xx = x0 - pad; xx <= x1 + pad; xx++) if (inCat(xx, yy) && srcPx(xx, yy)[3] >= 128 && isIris(srcPx(xx, yy))) iris++;
      if (iris < 3) continue;
      eyes.push({ cx: xs.reduce((a, b) => a + b, 0) / pts.length + 0.5, cy: ys.reduce((a, b) => a + b, 0) / pts.length + 0.5, h: y1 - y0 + 1 });
    }
  return eyes;
}
/** Paints the found eyes onto a 32 px frame (tx, ty: their centres there; th: height in frame px). */
function crispEyes(cell, at, eyes) {
  const inside = (x, y) => at(x - 1, y) && at(x + 1, y) && at(x, y - 1) && at(x, y + 1);
  for (const { tx, ty, th } of eyes) {
    const x0 = Math.floor(tx) - 2, x1 = Math.floor(tx) + 2, y0 = Math.floor(ty) - 2, y1 = Math.floor(ty) + 2;
    // Paint the old eye over with the fur round it.
    const votes = new Map();
    for (let yy = y0 - 1; yy <= y1 + 1; yy++)
      for (let xx = x0 - 1; xx <= x1 + 1; xx++) {
        const n = at(xx, yy);
        if (!n || !inside(xx, yy) || isDark(n) || isIris(n)) continue;
        votes.set(n.join(), (votes.get(n.join()) ?? 0) + 1);
      }
    if (!votes.size) continue;
    const fur = [...votes].sort((a, b) => b[1] - a[1])[0][0].split(',').map(Number);
    for (let yy = y0; yy <= y1; yy++)
      for (let xx = x0; xx <= x1; xx++) {
        const n = at(xx, yy);
        if (n && inside(xx, yy) && (isDark(n) || isIris(n)) && Math.abs(xx + 0.5 - tx) <= 2 && Math.abs(yy + 0.5 - ty) <= 2) cell[yy * F + xx] = fur;
      }
    // Redraw: 2 wide, 2 or 3 tall; never over the outline (an eye by the edge of the face moves in).
    const h = th >= 2.6 ? 3 : 2;
    const cx = Math.round(tx - 1), cy = Math.round(ty - h / 2);
    const fits = (l, t) => {
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < 2; xx++) if (!inside(l + xx, t + yy)) return false;
      return true;
    };
    const spot = [[cx, cy], [cx - 1, cy], [cx + 1, cy], [cx, cy + 1], [cx - 1, cy + 1], [cx, cy - 1]].find(([l, t]) => fits(l, t));
    if (!spot) continue;
    const [left, top] = spot;
    for (let yy = 0; yy < h; yy++)
      for (let xx = 0; xx < 2; xx++) cell[(top + yy) * F + left + xx] = yy === 0 && xx === 1 ? EYE_SHINE : yy === h - 1 && xx === 1 ? EYE_IRIS : EYE_DARK;
    // The source shades under each eye; next to the clean eye that reads as a dark line: fur instead.
    const lum = ([r, g, b]) => r + g + b;
    for (let xx = left - 1; xx <= left + 2; xx++) {
      const n = at(xx, top + h);
      if (n && inside(xx, top + h) && !isIris(n) && lum(n) < lum(fur) - 60) cell[(top + h) * F + xx] = fur;
    }
  }
}

// 1. Rows, then the cats in each row.
const yCounts = Array.from({ length: H }, (_, y) => {
  let n = 0;
  for (let x = 0; x < W; x++) n += solid[y * W + x];
  return n;
});
const bands = mergeTo(runs(yCounts, 3, 0.02), ROWS);
if (bands.length < ROWS) console.warn(`Warning: found ${bands.length} rows, the page expects ${ROWS}; the missing ones stay empty.`);
const cats = bands.map(([y0, y1], row) => {
  const xCounts = Array.from({ length: W }, (_, x) => {
    let n = 0;
    for (let y = y0; y <= y1; y++) n += solid[y * W + x];
    return n;
  });
  const segs = mergeTo(runs(xCounts, 3, 0.03), FRAMES[row]);
  if (segs.length !== FRAMES[row]) console.warn(`Warning: row ${row} has ${segs.length} cats, expected ${FRAMES[row]}.`);
  return segs.map(([x0, x1]) => {
    let top = y1, bottom = y0;
    for (let y = y0; y <= y1; y++)
      for (let x = x0; x <= x1; x++)
        if (solid[y * W + x]) {
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    return { x0, x1, y0: top, y1: bottom };
  });
});

// 2. One scale for the whole sheet: the intended cell size, or larger if a cat would not fit.
const all = cats.flat();
const s = Math.max(W / (COLS * F), ...all.map((c) => (c.x1 - c.x0 + 1) / (F - 1)), ...all.map((c) => (c.y1 - c.y0 + 1) / (FLOOR + 1)));

// 3. Sample each cat onto its 32 × 32 frame.
const sheet = Buffer.alloc(COLS * F * ROWS * F * 4);
cats.forEach((row, r) => {
  const widest = Math.max(...row.map((c) => (c.x1 - c.x0 + 1) / s));
  row.forEach((c, col) => {
    const w = (c.x1 - c.x0 + 1) / s;
    // Target x of the cat's right edge (exclusive): side views line up on the head, the row centred.
    const right = FRONT.has(r) ? (F + w) / 2 : (F + widest) / 2;
    const cell = [];
    for (let ty = 0; ty < F; ty++)
      for (let tx = 0; tx < F; tx++) {
        const X0 = c.x1 + 1 - (right - tx) * s, Y0 = c.y1 + 1 - (FLOOR + 1 - ty) * s;
        const votes = new Map();
        let n = 0;
        for (const fy of [0.3, 0.5, 0.7])
          for (const fx of [0.3, 0.5, 0.7]) {
            const x = Math.floor(X0 + fx * s), y = Math.floor(Y0 + fy * s);
            if (x < c.x0 || x > c.x1 || y < c.y0 || y > c.y1 || !solid[y * W + x]) continue;
            n++;
            const i = (y * W + x) * 4;
            const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
            const v = votes.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
            v.n++;
            v.r += data[i];
            v.g += data[i + 1];
            v.b += data[i + 2];
            votes.set(key, v);
          }
        if (n < 5) {
          cell.push(null);
          continue;
        }
        const best = [...votes.values()].sort((a, b) => b.n - a.n)[0];
        cell.push([Math.round(best.r / best.n), Math.round(best.g / best.n), Math.round(best.b / best.n)]);
      }
    // Drop specks (a lone pixel), then stand it exactly on the floor line.
    const at = (x, y) => (x >= 0 && x < F && y >= 0 && y < F ? cell[y * F + x] : null);
    for (let y = 0; y < F; y++)
      for (let x = 0; x < F; x++) if (at(x, y) && !at(x - 1, y) && !at(x + 1, y) && !at(x, y - 1) && !at(x, y + 1)) cell[y * F + x] = null;
    if (!process.env.NO_EYES)
      crispEyes(
        cell,
        at,
        sourceEyes(c, s).map((e) => ({ tx: right - (c.x1 + 1 - e.cx) / s, ty: FLOOR + 1 - (c.y1 + 1 - e.cy) / s, th: e.h / s })),
      );
    let bottom = -1;
    for (let y = 0; y < F; y++) for (let x = 0; x < F; x++) if (at(x, y)) bottom = y;
    const shift = bottom < 0 ? 0 : FLOOR - bottom;
    for (let y = 0; y < F; y++)
      for (let x = 0; x < F; x++) {
        const p = at(x, y - shift);
        if (!p) continue;
        const i = ((r * F + y) * COLS * F + col * F + x) * 4;
        sheet[i] = p[0];
        sheet[i + 1] = p[1];
        sheet[i + 2] = p[2];
        sheet[i + 3] = 255;
      }
  });
});

const raw = { raw: { width: COLS * F, height: ROWS * F, channels: 4 } };
await sharp(sheet, raw).png({ palette: true, colours: 24, dither: 0, compressionLevel: 9 }).toFile(out);
const preview = path.join(os.tmpdir(), 'pixel-ajie-preview.png'); // not next to the output: public/ is deployed
await sharp(out).resize(COLS * F * 8, ROWS * F * 8, { kernel: 'nearest' }).flatten({ background: '#cfe3f0' }).png().toFile(preview);
console.log(`${path.basename(src)} (${W} × ${H}): ${bands.length} rows, ${s.toFixed(2)} source px per pixel → ${out} (${COLS * F} × ${ROWS * F}), preview ${preview}`);
