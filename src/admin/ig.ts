/**
 * "發到 IG": posts one Ajie post that is already on the site to @ajie.archive, through the
 * site-admin Worker (/api/admin/ig/*). Photos are re-framed to 4:5 here (Instagram refuses the
 * iPhone's 3:4), staged on R2, then Instagram builds the carousel and publishes it.
 */
import { duration, Progress } from './progress';

type Api = <T>(path: string, init?: RequestInit) => Promise<T>;
type Slide = { type: 'image' | 'video'; src: string; thumb: string; ai?: boolean };
type Post = { id: string; date: string; from?: string; title: string; caption: string; place: string; slides: Slide[] };

const MAX = 10;
const W = 1080;
const H = 1350; // 4:5
const $ = <T extends HTMLElement = HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const md = (iso: string) => `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))}`;
const period = (p: Post) => (p.from && p.from !== p.date ? `${p.from.slice(0, 4)}/${md(p.from)}–${md(p.date)}` : `${p.date.slice(0, 4)}/${md(p.date)}`);

/** Default caption: title and period, the post's text, the place, hashtags (blank line between each). */
export const defaultCaption = (p: Post) =>
  [
    `${p.title ? `${p.title}｜` : ''}${period(p)}`,
    p.caption.trim(),
    p.place ? `📍 ${p.place}` : '',
    '#阿桔 #橘貓 #橘色虎斑 #貓咪日常 #毛孩 #orangecat #catsofinstagram #tabbycat',
  ]
    .filter(Boolean)
    .join('\n\n');

/** A photo as a 1080 x 1350 JPEG: blurred fill behind the whole picture ("pad"), or cropped to fill ("crop"). */
async function frame(src: string, mode: 'pad' | 'crop'): Promise<Blob> {
  const bmp = await createImageBitmap(await (await fetch(src)).blob());
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  const cover = Math.max(W / bmp.width, H / bmp.height);
  const drawAt = (k: number, target = ctx) => {
    const w = bmp.width * k, h = bmp.height * k;
    target.drawImage(bmp, (target.canvas.width - w) / 2, (target.canvas.height - h) / 2, w, h);
  };
  if (mode === 'crop') drawAt(cover);
  else {
    // Blur without ctx.filter (older Safari): draw tiny, then scale up smoothly; darken a little.
    const tiny = document.createElement('canvas');
    tiny.width = 27;
    tiny.height = 34;
    const t = tiny.getContext('2d')!;
    t.drawImage(bmp, 0, 0, bmp.width, bmp.height, 0, 0, tiny.width, tiny.height);
    ctx.drawImage(tiny, -W * 0.05, -H * 0.05, W * 1.1, H * 1.1);
    ctx.fillStyle = 'rgb(0 0 0 / 0.18)';
    ctx.fillRect(0, 0, W, H);
    drawAt(Math.min(W / bmp.width, H / bmp.height));
  }
  bmp.close();
  return new Promise((ok, fail) => c.toBlob((b) => (b ? ok(b) : fail(new Error('無法輸出 JPEG'))), 'image/jpeg', 0.9));
}

export function initIg(api: Api, tab: (id: string) => Element | null) {
  const posts: Post[] = JSON.parse(document.getElementById('ig-data')!.textContent!);
  const form = $<HTMLFormElement>('#ig-form');
  const select = $<HTMLSelectElement>('#ig-post');
  const slidesEl = $('#ig-slides');
  const caption = $<HTMLTextAreaElement>('#ig-caption');
  const pr = new Progress($('#ig-progress'));
  let note = ''; // "already posted" link, shown under the picker
  const btn = $<HTMLButtonElement>('#ig-publish');
  let posted: Record<string, string> = {};
  let ready = false;
  let busy = false;

  const post = () => posts.find((p) => p.id === select.value);
  const mode = () => (form.querySelector<HTMLInputElement>('input[name="ig-frame"]:checked')?.value === 'crop' ? 'crop' : 'pad');
  const chosen = () => {
    const p = post();
    return p ? [...slidesEl.querySelectorAll<HTMLInputElement>('input[type=checkbox]')].filter((i) => i.checked).map((i) => p.slides[Number(i.value)]) : [];
  };
  const update = () => {
    const n = chosen().length;
    $('#ig-count').textContent = `已選 ${n} / ${MAX}`;
    $('#ig-count').className = n > MAX ? 'bad small' : 'muted small';
    $('#ig-chars').textContent = `${caption.value.length} / 2200 字`;
    btn.disabled = busy || !ready || !post() || n === 0 || n > MAX || caption.value.length > 2200;
    btn.textContent = post() && posted[select.value] !== undefined ? '再發一次到 IG' : '發到 IG';
  };

  /** Not posted yet first, oldest first (backfilling keeps the IG grid in order); posted ones after, newest first. */
  const ordered = () => {
    const todo = posts.filter((p) => posted[p.id] === undefined).sort((a, b) => a.date.localeCompare(b.date));
    const done = posts.filter((p) => posted[p.id] !== undefined).sort((a, b) => b.date.localeCompare(a.date));
    return [...todo, ...done];
  };
  /** "接著發到 IG" after publishing a post opens this page with ?ig=<post id>. */
  let wanted = new URLSearchParams(location.search).get('ig');
  const fillSelect = () => {
    const keep = wanted && posts.some((p) => p.id === wanted) ? wanted : '';
    select.innerHTML = ordered().map((p) => `<option value="${p.id}">${posted[p.id] !== undefined ? '✓ ' : ''}${esc(period(p))} ${esc(p.title || p.id)}</option>`).join('');
    if (keep) select.value = keep;
    else select.selectedIndex = 0;
  };
  const renderPost = () => {
    const p = post();
    if (!busy) pr.hide();
    if (!p) return update();
    slidesEl.innerHTML = p.slides
      .map(
        (s, i) =>
          `<li class="ig__slide"><label><input type="checkbox" value="${i}" ${i < MAX ? 'checked' : ''} aria-label="第 ${i + 1} 張"><img class="ig__bg" src="${s.thumb}" alt=""><img class="ig__img" src="${s.thumb}" alt=""><span class="ig__tag">${s.ai ? 'AI 插畫' : s.type === 'video' ? '影片' : `${i + 1}`}</span></label></li>`,
      )
      .join('');
    caption.value = defaultCaption(p);
    note = posted[p.id] ? `這篇已經發過：<a href="${esc(posted[p.id])}" target="_blank" rel="noopener">在 IG 上看</a>` : '';
    $('#ig-posted').innerHTML = note;
    update();
  };

  async function loadAccount() {
    try {
      const a = await api<{ username: string; posted: Record<string, string> }>('ig/status');
      posted = a.posted;
      ready = true;
      $('#ig-account').textContent = `已連結 @${a.username}`;
      $('#ig-account').className = 'good small';
    } catch (e) {
      ready = false;
      $('#ig-account').textContent = (e as Error).message;
      $('#ig-account').className = 'bad small';
    }
    fillSelect();
    renderPost();
    if (wanted) {
      wanted = null;
      history.replaceState(null, '', `${location.pathname}#ig`);
    }
  }

  async function publish() {
    const p = post();
    if (!p) return;
    const items = chosen();
    const again = posted[p.id] !== undefined;
    if (again && !confirm('這篇已經發到 IG 過了，確定要再發一次？')) return;
    busy = true;
    update();
    pr.start('準備照片…');
    const t0 = Date.now();
    try {
      // Photos: the first 35% of the bar; Instagram processing up to 90%; publishing the rest.
      const sent: { type: 'image' | 'video'; url: string }[] = [];
      for (const [i, s] of items.entries()) {
        pr.set(0.35 * (i / items.length), `準備第 ${i + 1} / ${items.length} 個`, s.type === 'video' ? '影片（已在 R2）' : '照片轉成 4:5 並上傳');
        if (s.type === 'video') {
          sent.push({ type: 'video', url: s.src });
          continue;
        }
        const jpeg = await frame(s.src, mode());
        const { url } = await api<{ url: string }>(`ig/image?${new URLSearchParams({ post: p.id, n: String(i) })}`, { method: 'PUT', body: jpeg, headers: { 'Content-Type': 'image/jpeg' } });
        sent.push({ type: 'image', url });
        pr.log(`第 ${i + 1} 張照片已上傳`);
      }
      pr.set(0.38, '交給 Instagram…');
      const { ids } = await api<{ ids: string[] }>('ig/items', { method: 'POST', body: JSON.stringify({ post: p.id, items: sent, caption: caption.value }), headers: { 'Content-Type': 'application/json' } });
      // Clips take Instagram a while (up to a few minutes); photos are quick.
      const started = Date.now();
      const hasVideo = items.some((s) => s.type === 'video');
      for (const [i, id] of ids.entries()) {
        for (;;) {
          const s = await api<{ status: string; detail: string }>(`ig/item?id=${id}`);
          if (s.status === 'FINISHED' || s.status === 'PUBLISHED') break;
          if (s.status === 'ERROR' || s.status === 'EXPIRED') throw new Error(`第 ${i + 1} 個項目被 IG 拒絕：${s.detail || s.status}（還沒發出任何東西，取消勾選它再試）`);
          if (Date.now() - started > 8 * 60_000) throw new Error('IG 處理太久，請稍後再試（還沒發出任何東西）');
          pr.set(0.4 + 0.5 * (i / ids.length), `Instagram 處理中 ${i + 1} / ${ids.length}`, `${duration(Date.now() - started)}${hasVideo ? '・影片通常要 1–3 分鐘' : ''}`);
          await wait(3000);
        }
        pr.set(0.4 + 0.5 * ((i + 1) / ids.length), `Instagram 處理中 ${Math.min(i + 2, ids.length)} / ${ids.length}`, duration(Date.now() - started));
      }
      pr.log(`Instagram 處理完成（${ids.length} 個）`);
      pr.set(0.93, '發佈中…');
      const res = await api<{ permalink: string }>('ig/publish', { method: 'POST', body: JSON.stringify({ post: p.id, ids, caption: caption.value, again }), headers: { 'Content-Type': 'application/json' } });
      posted[p.id] = res.permalink;
      const title = p.title || p.id;
      // Move on to the next one still to post (oldest first); the result stays in the card.
      busy = false;
      fillSelect();
      renderPost();
      const next = posted[select.value] === undefined ? select.selectedOptions[0]?.textContent ?? '' : '';
      pr.done(
        `「${title}」已發到 IG 🎉`,
        res.permalink ? `<a class="button" href="${esc(res.permalink)}" target="_blank" rel="noopener">打開 IG 貼文</a>` : '',
        `花了 ${duration(Date.now() - t0)}${next ? `・下一篇已選好：${next}` : '・全部都發完了'}`,
      );
    } catch (e) {
      pr.fail((e as Error).message);
    } finally {
      busy = false;
      update();
    }
  }

  select.addEventListener('change', renderPost);
  slidesEl.addEventListener('change', update);
  caption.addEventListener('input', update);
  form.addEventListener('change', (e) => {
    if ((e.target as HTMLInputElement).name === 'ig-frame') form.dataset.frame = mode();
  });
  $('#ig-reset-caption').addEventListener('click', () => {
    const p = post();
    if (p) caption.value = defaultCaption(p);
    update();
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    publish();
  });

  // Ask Instagram only once the panel is opened.
  let started = false;
  const open = () => {
    if (started || $('[data-panel="ig"]').hidden) return;
    started = true;
    loadAccount();
  };
  tab('ig')?.addEventListener('click', () => setTimeout(open));
  open();
  form.dataset.frame = mode();
  fillSelect();
}
