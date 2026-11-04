/**
 * Generates the 1200x630 social preview images in public/og/<lang>.png.
 *
 * The images are committed, so this only needs to run after changing the name, title or
 * design. It renders an HTML template in a local Chromium-based browser (Edge or Chrome)
 * so CJK text uses real system fonts:
 *
 *   npx -y -p puppeteer-core node scripts/og.mjs
 *   BROWSER="C:/Program Files/Google/Chrome/Application/chrome.exe" npx -y -p puppeteer-core node scripts/og.mjs
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
// Resolve puppeteer-core from wherever npx (or the caller) installed it.
const load = createRequire(join(process.cwd(), 'noop.js'));
const puppeteer = load('puppeteer-core');

const browserPath =
  process.env.BROWSER ??
  (process.platform === 'win32'
    ? 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
    : process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : '/usr/bin/google-chrome');

const font = (p) => `data:font/woff2;base64,${readFileSync(join(root, 'node_modules', p)).toString('base64')}`;
const figure = `data:image/webp;base64,${readFileSync(join(root, 'src/assets/hero/3.webp')).toString('base64')}`;

const copy = {
  en: { name: 'Chi-Mao (Jonathan) Fan', role: 'AI R&D Engineer · ASUS', line: 'Computer vision, deep learning and AI product development', tags: ['Oriented object detection', 'Image restoration', 'IEEE Best Dissertation'], cjk: '' },
  'zh-tw': { name: '范植貿 Jonathan Fan', role: '華碩 AI 研發工程師', line: '電腦視覺、深度學習與 AI 產品開發', tags: ['旋轉物件偵測', '影像修復', 'IEEE 最佳碩博士論文獎'], cjk: '"Microsoft JhengHei", "PingFang TC", "Noto Sans TC"' },
  'zh-cn': { name: '范植贸 Jonathan Fan', role: '华硕 AI 研发工程师', line: '计算机视觉、深度学习与 AI 产品开发', tags: ['旋转目标检测', '图像修复', 'IEEE 最佳硕博士论文奖'], cjk: '"Microsoft YaHei", "PingFang SC", "Noto Sans SC"' },
  ja: { name: '范植貿 Jonathan Fan', role: 'ASUS AI研究開発エンジニア', line: 'コンピュータビジョン・深層学習・AI製品開発', tags: ['回転物体検出', '画像復元', 'IEEE 最優秀論文賞'], cjk: '"Yu Gothic UI", "Meiryo", "Hiragino Sans", "Noto Sans JP"' },
};

/* Same oriented boxes as the hero, in hero/3.webp pixel space (682 x 720). */
const boxes = [
  { cx: 393, cy: 154, w: 250, h: 92, a: 0, c: '#4ade80', l: 'text 0.99' },
  { cx: 331, cy: 454, w: 178, h: 404, a: 0, c: '#5cc6ff', l: 'person 0.97' },
  { cx: 528, cy: 450, w: 62, h: 86, a: 0, c: '#f87171', l: 'card 0.92' },
  { cx: 535, cy: 563.5, w: 58, h: 124, a: 43, c: '#a78bfa', l: 'guitar · 43°' },
];

/** One oriented box plus its tag, placed above the box's axis-aligned bounds. */
function box(b) {
  const r = (b.a * Math.PI) / 180;
  const hw = (Math.abs(b.w * Math.cos(r)) + Math.abs(b.h * Math.sin(r))) / 2;
  const hh = (Math.abs(b.w * Math.sin(r)) + Math.abs(b.h * Math.cos(r))) / 2;
  const tw = b.l.length * 14 + 16;
  const tx = Math.min(Math.max(0, b.cx - hw), 682 - tw);
  const ty = Math.max(0, b.cy - hh - 34);
  return `<rect x="${-b.w / 2}" y="${-b.h / 2}" width="${b.w}" height="${b.h}" rx="3" fill="${b.c}22" stroke="${b.c}" stroke-width="4" transform="translate(${b.cx} ${b.cy}) rotate(${b.a})"/>
    <rect x="${tx}" y="${ty}" width="${tw}" height="30" rx="5" fill="${b.c}"/>
    <text x="${tx + 8}" y="${ty + 22}" font-family="Consolas, monospace" font-size="22" font-weight="700" fill="#071019">${b.l}</text>`;
}

const html = (c) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: 'SG'; src: url('${font('@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2')}') format('woff2'); font-weight: 300 700; }
@font-face { font-family: 'IN'; src: url('${font('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2')}') format('woff2'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; background: #060a14; color: #fff;
  font-family: 'IN', ${c.cjk || 'sans-serif'}, sans-serif; }
.bg { position: absolute; inset: 0;
  background:
    radial-gradient(60% 80% at 12% 20%, rgb(92 198 255 / 0.22), transparent 60%),
    radial-gradient(50% 70% at 90% 90%, rgb(167 139 250 / 0.22), transparent 60%),
    linear-gradient(rgb(255 255 255 / 0.035) 1px, transparent 1px) 0 0 / 40px 40px,
    linear-gradient(90deg, rgb(255 255 255 / 0.035) 1px, transparent 1px) 0 0 / 40px 40px,
    #060a14; }
.wrap { position: relative; display: grid; grid-template-columns: 1fr 380px; gap: 48px; align-items: center; height: 100%; padding: 0 72px; }
.kicker { display: inline-flex; gap: 10px; align-items: center; font: 600 20px 'SG', ${c.cjk || 'sans-serif'}, sans-serif; letter-spacing: 0.06em; color: #7dd3fc; text-transform: uppercase; }
.kicker i { width: 36px; height: 2px; background: #5cc6ff; display: block; }
h1 { margin-top: 22px; font: 700 ${c.cjk ? 58 : 56}px/1.08 'SG', ${c.cjk || 'sans-serif'}, sans-serif; letter-spacing: -0.02em; }
.role { margin-top: 18px; font: 600 32px/1.2 'SG', ${c.cjk || 'sans-serif'}, sans-serif;
  background: linear-gradient(90deg, #7dd3fc, #c4b5fd 60%, #f0abfc); -webkit-background-clip: text; color: transparent; }
.line { margin-top: 14px; font-size: 24px; color: rgb(255 255 255 / 0.72); }
.tags { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
.tags span { padding: 8px 16px; border-radius: 999px; border: 1px solid rgb(255 255 255 / 0.16); background: rgb(255 255 255 / 0.06); font-size: 19px; color: rgb(255 255 255 / 0.88); }
.url { position: absolute; left: 72px; bottom: 40px; font: 600 20px 'SG', sans-serif; color: rgb(255 255 255 / 0.5); letter-spacing: 0.04em; }
.panel { position: relative; padding: 14px; border-radius: 22px; border: 1px solid rgb(255 255 255 / 0.12); background: rgb(7 11 22 / 0.8); box-shadow: 0 30px 80px -30px #000; }
.view { position: relative; width: 352px; aspect-ratio: 682 / 720; border-radius: 12px; overflow: hidden; }
.view img, .view svg { position: absolute; inset: 0; width: 100%; height: 100%; }
.hud { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; font: 600 14px ui-monospace, Consolas, monospace; color: rgb(255 255 255 / 0.8); letter-spacing: 0.08em; text-transform: uppercase; }
.hud b { width: 8px; height: 8px; border-radius: 50%; background: #4ade80; box-shadow: 0 0 10px #4ade80; }
.hud em { margin-left: auto; font-style: normal; color: #7dd3fc; }
</style></head><body><div class="bg"></div>
<div class="wrap">
  <div>
    <div class="kicker"><i></i>52hzfan</div>
    <h1>${c.name}</h1>
    <div class="role">${c.role}</div>
    <div class="line">${c.line}</div>
    <div class="tags">${c.tags.map((t) => `<span>${t}</span>`).join('')}</div>
  </div>
  <div class="panel">
    <div class="hud"><b></b>OBB · done<em>AI R&amp;D Engineer 0.94</em></div>
    <div class="view"><img src="${figure}"><svg viewBox="0 0 682 720">${boxes.map(box).join('')}</svg></div>
  </div>
</div>
<div class="url">52hzfan.com</div>
</body></html>`;

const out = join(root, 'public/og');
mkdirSync(out, { recursive: true });
const browser = await puppeteer.launch({ executablePath: browserPath, headless: 'new', args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
for (const [lang, c] of Object.entries(copy)) {
  await page.setContent(html(c), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(out, `${lang}.png`), type: 'png' });
  console.log(`public/og/${lang}.png`);
}
await browser.close();
