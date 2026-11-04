/* eslint-disable */
// Card detection + tracking worker (classic worker so OpenCV.js can be importScripts'ed).
//
// Per frame:
//   1. RGBA -> gray.
//   2. Tracking (if a card was found before): Lucas-Kanade optical flow on feature points
//      inside the card + RANSAC homography moves the previous quad to the new frame.
//   3. Detection: two candidate sources, scored together
//        a) edges: blur -> auto-threshold Canny -> dilate -> contours (RETR_LIST, so the
//           card outline survives even when a hand touches its edge)
//        b) brightness: Otsu threshold -> close -> outer contours (white card on darker bg)
//      Each contour -> convex hull -> quadrilateral. When a finger hides a corner the hull
//      has 5-8 vertices; the corner is rebuilt by intersecting the four longest edges.
//      Candidates are scored by card aspect ratio, solidity, angles, brightness and
//      proximity to the tracked pose.
//   4. Fusion: a detection close to the tracked quad wins (sharper edges, no drift);
//      otherwise the tracked quad is kept, so a stray rectangle can't steal the overlay.
// Coordinates are returned normalized to [0,1] of the frame.

let cv = null;
let ready = false;

self.importScripts('opencv/opencv.js');

function initCv() {
  return new Promise((resolve, reject) => {
    const m = self.cv;
    if (!m) return reject(new Error('OpenCV failed to load'));
    const done = (mod) => {
      cv = mod && mod.Mat ? mod : self.cv;
      resolve();
    };
    if (m.Mat) return done(m);
    // Emscripten MODULARIZE: either a real Promise or a Module with a custom then().
    // Never `await` it: awaiting a thenable that resolves to itself loops forever.
    if (typeof m.then === 'function') m.then((mod) => done(mod));
    else m.onRuntimeInitialized = () => done(m);
    setTimeout(() => (self.cv && self.cv.Mat ? done(self.cv) : reject(new Error('OpenCV init timeout'))), 30000);
  });
}

initCv()
  .then(() => {
    ready = true;
    self.postMessage({ type: 'ready', lk: hasLK() });
  })
  .catch((e) => self.postMessage({ type: 'error', message: String(e && e.message ? e.message : e) }));

function hasLK() {
  return typeof cv.calcOpticalFlowPyrLK === 'function' && typeof cv.findHomography === 'function' && typeof cv.goodFeaturesToTrack === 'function';
}

// ---------------------------------------------------------------- state
let W = 0, H = 0;
let rgba, gray, prevGray, blur, edges, bin, kernel3, mask;
let trackQuad = null;   // [x0,y0,...] pixel coords
let trackPts = null;    // cv.Mat CV_32FC2
let trackPtsInitial = 0;
let frameNo = 0;
let lastSeed = -999;

function alloc(w, h) {
  free();
  W = w; H = h;
  rgba = new cv.Mat(h, w, cv.CV_8UC4);
  gray = new cv.Mat(h, w, cv.CV_8UC1);
  prevGray = new cv.Mat(h, w, cv.CV_8UC1);
  blur = new cv.Mat(h, w, cv.CV_8UC1);
  edges = new cv.Mat(h, w, cv.CV_8UC1);
  bin = new cv.Mat(h, w, cv.CV_8UC1);
  mask = new cv.Mat(h, w, cv.CV_8UC1);
  kernel3 = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
  resetTrack();
}
function free() {
  for (const m of [rgba, gray, prevGray, blur, edges, bin, mask, kernel3]) if (m && !m.isDeleted()) m.delete();
  rgba = gray = prevGray = blur = edges = bin = mask = kernel3 = null;
}
function resetTrack() {
  trackQuad = null;
  if (trackPts) trackPts.delete();
  trackPts = null;
  trackPtsInitial = 0;
}

// ---------------------------------------------------------------- geometry helpers
const P = (q, i) => [q[(i % 4) * 2], q[(i % 4) * 2 + 1]];
function polyArea(q) {
  let s = 0;
  for (let i = 0; i < 4; i++) { const a = P(q, i), b = P(q, i + 1); s += a[0] * b[1] - b[0] * a[1]; }
  return Math.abs(s) / 2;
}
function isConvex(q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const a = P(q, i), b = P(q, i + 1), c = P(q, i + 2);
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    const s = Math.sign(cr);
    if (s === 0) return false;
    if (!sign) sign = s; else if (s !== sign) return false;
  }
  return true;
}
function minAngleCos(q) {
  // largest |cos| of the four interior angles (0 = all right angles)
  let worst = 0;
  for (let i = 0; i < 4; i++) {
    const a = P(q, i + 3), b = P(q, i), c = P(q, i + 1);
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const cos = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2) + 1e-9);
    worst = Math.max(worst, Math.abs(cos));
  }
  return worst;
}
function aspectOf(q) {
  const len = (i) => { const a = P(q, i), b = P(q, i + 1); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  const e02 = (len(0) + len(2)) / 2, e13 = (len(1) + len(3)) / 2;
  return Math.max(e02, e13) / Math.max(1e-6, Math.min(e02, e13));
}
function center(q) { return [(q[0] + q[2] + q[4] + q[6]) / 4, (q[1] + q[3] + q[5] + q[7]) / 4]; }
function diag(q) { return (Math.hypot(q[0] - q[4], q[1] - q[5]) + Math.hypot(q[2] - q[6], q[3] - q[7])) / 2; }
/** Mean corner distance, best over cyclic orderings and both windings. */
function quadDist(a, b) {
  let best = Infinity;
  for (const dir of [1, -1]) {
    for (let k = 0; k < 4; k++) {
      let s = 0;
      for (let i = 0; i < 4; i++) {
        const j = (((k + dir * i) % 4) + 4) % 4;
        s += Math.hypot(a[i * 2] - b[j * 2], a[i * 2 + 1] - b[j * 2 + 1]);
      }
      best = Math.min(best, s / 4);
    }
  }
  return best;
}
function lineIntersect(p1, p2, p3, p4) {
  const d = (p1[0] - p2[0]) * (p3[1] - p4[1]) - (p1[1] - p2[1]) * (p3[0] - p4[0]);
  if (Math.abs(d) < 1e-9) return null;
  const a = p1[0] * p2[1] - p1[1] * p2[0], b = p3[0] * p4[1] - p3[1] * p4[0];
  return [(a * (p3[0] - p4[0]) - (p1[0] - p2[0]) * b) / d, (a * (p3[1] - p4[1]) - (p1[1] - p2[1]) * b) / d];
}
/** Rebuild a quad from a 5..8-gon by intersecting its four longest edges (a hidden corner). */
function quadFromLongestEdges(pts) {
  const n = pts.length;
  const edges = [];
  for (let i = 0; i < n; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    edges.push({ i, a, b, len: Math.hypot(a[0] - b[0], a[1] - b[1]) });
  }
  const top = edges.slice().sort((x, y) => y.len - x.len).slice(0, 4).sort((x, y) => x.i - y.i);
  const q = [];
  for (let k = 0; k < 4; k++) {
    const e1 = top[k], e2 = top[(k + 1) % 4];
    const p = lineIntersect(e1.a, e1.b, e2.a, e2.b);
    if (!p) return null;
    q.push(p[0], p[1]);
  }
  return q;
}
function matToPts(m) {
  const out = [];
  const d = m.data32S;
  for (let i = 0; i < m.rows; i++) out.push([d[i * 2], d[i * 2 + 1]]);
  return out;
}

// ---------------------------------------------------------------- detection
function fitQuad(contour, minArea) {
  const area = cv.contourArea(contour);
  if (area < minArea) return null;
  const hull = new cv.Mat();
  const approx = new cv.Mat();
  try {
    cv.convexHull(contour, hull, false, true);
    const hullArea = cv.contourArea(hull);
    if (hullArea <= 0) return null;
    const solidity = area / hullArea;
    if (solidity < 0.8) return null;
    const peri = cv.arcLength(hull, true);
    let q = null;
    let poly = null;
    for (const eps of [0.015, 0.025, 0.035, 0.05]) {
      cv.approxPolyDP(hull, approx, eps * peri, true);
      if (approx.rows === 4) { q = matToPts(approx).flat(); break; }
      if (approx.rows < 4) break;
      if (approx.rows <= 8) poly = matToPts(approx);
    }
    if (!q && poly) {
      q = quadFromLongestEdges(poly);
      if (q) {
        const qa = polyArea(q);
        if (qa < hullArea * 0.95 || qa > hullArea * 1.3) q = null; // rebuilt corner must be plausible
      }
    }
    if (!q || !isConvex(q)) return null;
    return { q, solidity, area: polyArea(q) };
  } finally {
    hull.delete();
    approx.delete();
  }
}

function collect(src, mode, minArea, out) {
  const contours = new cv.MatVector();
  const hier = new cv.Mat();
  try {
    cv.findContours(src, contours, hier, mode, cv.CHAIN_APPROX_SIMPLE);
    const n = contours.size();
    for (let i = 0; i < n && out.length < 40; i++) {
      const c = contours.get(i);
      const r = fitQuad(c, minArea);
      c.delete();
      if (r) out.push(r);
    }
  } finally {
    contours.delete();
    hier.delete();
  }
}

const hist = new Uint32Array(256);
function median(mat) {
  hist.fill(0);
  const d = mat.data;
  for (let i = 0; i < d.length; i += 4) hist[d[i]]++;
  const half = d.length / 8;
  let acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= half) return v; }
  return 128;
}

function meanInQuad(q) {
  mask.setTo(new cv.Scalar(0));
  const pts = cv.matFromArray(4, 1, cv.CV_32SC2, q.map(Math.round));
  const v = new cv.MatVector();
  v.push_back(pts);
  cv.fillPoly(mask, v, new cv.Scalar(255));
  const m = cv.mean(gray, mask)[0];
  v.delete();
  pts.delete();
  return m;
}

function detect(cardAspect, prior) {
  const minArea = W * H * 0.012;
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  const med = median(blur);
  const lo = Math.max(15, Math.min(90, 0.5 * med));
  cv.Canny(blur, edges, lo, lo * 2.5);
  cv.dilate(edges, edges, kernel3);

  const cands = [];
  collect(edges, cv.RETR_LIST, minArea, cands);
  cv.threshold(blur, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
  cv.morphologyEx(bin, bin, cv.MORPH_CLOSE, kernel3);
  collect(bin, cv.RETR_EXTERNAL, minArea, cands);

  const frameMean = med;
  const pd = prior ? diag(prior) : 0;
  const scored = [];
  for (const c of cands) {
    if (c.area > W * H * 0.9) continue;
    const r = aspectOf(c.q);
    if (r < 1.12 || r > 1.9) continue;
    const ang = minAngleCos(c.q);
    if (ang > 0.5) continue; // an interior angle outside ~60..120 degrees
    const sAspect = Math.exp(-Math.pow((r - cardAspect) / 0.18, 2));
    const sAngle = 1 - ang;
    const sSolid = Math.min(1, (c.solidity - 0.8) / 0.15);
    let sPrior = 1;
    if (prior) {
      const d = quadDist(c.q, prior) / pd;
      sPrior = 0.15 + 0.85 * Math.exp(-Math.pow(d / 0.3, 2));
    }
    scored.push({ ...c, pre: sAspect * sAngle * (0.5 + 0.5 * sSolid) * sPrior });
  }
  scored.sort((a, b) => b.pre - a.pre);
  const top = scored.slice(0, 5);
  for (const c of top) {
    const inside = meanInQuad(c.q);
    // Cards are usually brighter than their surroundings; soft factor only.
    const sBright = Math.min(1, Math.max(0.25, 0.5 + (inside - frameMean) / 80));
    c.score = c.pre * sBright * Math.sqrt(Math.min(1, c.area / (W * H * 0.05)));
  }
  top.sort((a, b) => b.score - a.score);
  return top;
}

// ---------------------------------------------------------------- tracking
function seedFeatures(q) {
  if (!hasLK()) return;
  // features inside the card (shrunk to avoid background), plus the corners themselves
  const c = center(q);
  const shrunk = q.map((v, i) => (i % 2 === 0 ? c[0] + (v - c[0]) * 0.85 : c[1] + (v - c[1]) * 0.85));
  mask.setTo(new cv.Scalar(0));
  const pts = cv.matFromArray(4, 1, cv.CV_32SC2, shrunk.map(Math.round));
  const v = new cv.MatVector();
  v.push_back(pts);
  cv.fillPoly(mask, v, new cv.Scalar(255));
  v.delete();
  pts.delete();
  const corners = new cv.Mat();
  cv.goodFeaturesToTrack(gray, corners, 50, 0.01, 5, mask, 3);
  const arr = Array.from(corners.data32F);
  corners.delete();
  arr.push(...q);
  if (trackPts) trackPts.delete();
  trackPts = cv.matFromArray(arr.length / 2, 1, cv.CV_32FC2, arr);
  trackPtsInitial = arr.length / 2;
  lastSeed = frameNo;
}

function trackLK() {
  if (!trackQuad || !trackPts || trackPts.rows < 6 || !hasLK()) return null;
  const next = new cv.Mat();
  const status = new cv.Mat();
  const err = new cv.Mat();
  const criteria = new cv.TermCriteria(cv.TERM_CRITERIA_EPS | cv.TERM_CRITERIA_COUNT, 20, 0.03);
  let result = null;
  try {
    cv.calcOpticalFlowPyrLK(prevGray, gray, trackPts, next, status, err, new cv.Size(21, 21), 3, criteria);
    const src = [], dst = [];
    for (let i = 0; i < status.rows; i++) {
      if (status.data[i] !== 1) continue;
      src.push(trackPts.data32F[i * 2], trackPts.data32F[i * 2 + 1]);
      dst.push(next.data32F[i * 2], next.data32F[i * 2 + 1]);
    }
    const n = src.length / 2;
    if (n < 6) return null;
    const sM = cv.matFromArray(n, 1, cv.CV_32FC2, src);
    const dM = cv.matFromArray(n, 1, cv.CV_32FC2, dst);
    const inl = new cv.Mat();
    const Hm = cv.findHomography(sM, dM, cv.RANSAC, 3, inl);
    sM.delete();
    dM.delete();
    if (Hm.empty()) { Hm.delete(); inl.delete(); return null; }
    const h = Hm.data64F;
    const q = [];
    for (let i = 0; i < 4; i++) {
      const x = trackQuad[i * 2], y = trackQuad[i * 2 + 1];
      const w = h[6] * x + h[7] * y + h[8];
      q.push((h[0] * x + h[1] * y + h[2]) / w, (h[3] * x + h[4] * y + h[5]) / w);
    }
    // keep inlier destination points as next frame's features
    const keep = [];
    let inliers = 0;
    for (let i = 0; i < n; i++) if (inl.data[i]) { keep.push(dst[i * 2], dst[i * 2 + 1]); inliers++; }
    Hm.delete();
    inl.delete();
    if (inliers < 6 || !isConvex(q)) return null;
    trackPts.delete();
    trackPts = cv.matFromArray(inliers, 1, cv.CV_32FC2, keep);
    result = { q, conf: Math.min(1, inliers / Math.max(8, trackPtsInitial * 0.6)) };
  } catch (e) {
    result = null;
  } finally {
    next.delete();
    status.delete();
    err.delete();
  }
  return result;
}

// ---------------------------------------------------------------- frame
function onFrame(msg) {
  const t0 = performance.now();
  if (msg.width !== W || msg.height !== H) alloc(msg.width, msg.height);
  rgba.data.set(new Uint8Array(msg.buffer));
  cv.cvtColor(rgba, gray, cv.COLOR_RGBA2GRAY);
  frameNo++;

  const tracked = trackLK();
  const prior = tracked ? tracked.q : trackQuad;
  const cands = detect(msg.cardAspect || 1.397, prior);
  const best = cands[0];

  let quad = null, conf = 0, source = 'none';
  const pd = prior ? diag(prior) : 0;
  const near = best && prior && quadDist(best.q, prior) / pd < 0.25;
  if (best && (near || !tracked) && best.score > 0.12) {
    quad = best.q;
    conf = Math.min(1, best.score * 1.5);
    source = 'detect';
  } else if (tracked && tracked.conf > 0.25) {
    quad = tracked.q;
    conf = tracked.conf * 0.8;
    source = 'track';
  }

  if (quad) {
    trackQuad = quad;
    if (source === 'detect' && (frameNo - lastSeed > 8 || !trackPts || trackPts.rows < 12)) seedFeatures(quad);
  } else {
    resetTrack();
  }
  // swap gray buffers
  const tmp = prevGray; prevGray = gray; gray = tmp;

  const norm = (q) => q.map((v, i) => (i % 2 === 0 ? v / W : v / H));
  const buffer = msg.buffer;
  self.postMessage(
    {
      type: 'result',
      id: msg.id,
      quad: quad ? norm(quad) : null,
      confidence: conf,
      source,
      candidates: cands.slice(1, 4).map((c) => norm(c.q)),
      ms: performance.now() - t0,
      width: W,
      height: H,
      buffer,
    },
    [buffer],
  );
}

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'frame') {
    if (!ready) {
      self.postMessage({ type: 'result', id: m.id, quad: null, confidence: 0, source: 'none', candidates: [], ms: 0, width: m.width, height: m.height, buffer: m.buffer }, [m.buffer]);
      return;
    }
    try {
      onFrame(m);
    } catch (err) {
      resetTrack();
      self.postMessage({ type: 'result', id: m.id, quad: null, confidence: 0, source: 'none', candidates: [], ms: 0, width: m.width, height: m.height, buffer: m.buffer }, [m.buffer]);
    }
  } else if (m.type === 'reset') {
    resetTrack();
  }
};
