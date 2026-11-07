/**
 * Admin page logic: dashboard, deploy status and the three "add" forms (album, journey, Ajie). Talks only to
 * /api/admin/* on this origin (the site-admin Worker, behind Cloudflare Access).
 */
import { bars, columns } from './charts';
import { base64Of, formatBytes, MAX_VIDEO_BYTES, posterOf, prepareVideo, preparePhoto, shotOf, type Shot } from './media';
import { checkPost, contentPath, fileName, formatGuide, posterName, refName, type Checked, type Kind } from '@/lib/admin-post';
import { duration, Progress } from './progress';

if (import.meta.env.DEV && new URLSearchParams(location.search).has('mock')) (await import('./dev-mock')).installMock();

type Names = { badges: Record<string, string>; posts: Record<string, string>; albums: string[]; nextAlbumOrder: number };
const names: Names = JSON.parse(document.getElementById('admin-data')!.textContent!);
const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel)!;
const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => [...root.querySelectorAll<T>(sel)];

// ---------------------------------------------------------------- API

class ApiError extends Error {}
async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/admin/${path}`, { ...init, credentials: 'same-origin', redirect: 'manual' });
  } catch {
    throw new ApiError('連不上後台（網路中斷，或登入已過期：請重新整理頁面）');
  }
  if (res.type === 'opaqueredirect' || res.status === 0) throw new ApiError('登入已過期，請重新整理頁面再登入一次');
  const body = (await res.json().catch(() => null)) as (T & { error?: { message: string } }) | null;
  if (!res.ok) throw new ApiError(body?.error?.message ?? `後台回應 ${res.status}`);
  return body as T;
}

// ---------------------------------------------------------------- tabs

/** The "add" panels, opened from one 新增 menu (inline in the sidebar, a pop-up above the phone tab bar). */
const ADD_PANELS = ['album', 'journey', 'ajie'];
const PANELS = ['stats', 'deploys', 'ig', ...ADD_PANELS];
const phone = matchMedia('(max-width: 899px)');
const menuBtn = $<HTMLButtonElement>('.side__menu-btn');
const menu = $('#add-menu');
const setMenu = (open: boolean) => {
  menu.hidden = !open;
  menuBtn.setAttribute('aria-expanded', String(open));
};

// Phones: the floating tab bar (統計 / 發布 / 新增); 發布 and 新增 open a menu.
const TB_GROUP: Record<string, string> = { stats: 'stats', deploys: 'publish', ig: 'publish', album: 'add', journey: 'add', ajie: 'add' };
const TB_ORDER = ['stats', 'publish', 'add'];
const tabbar = $('.tabbar');
const tbMenus = $$<HTMLButtonElement>('[data-tabbar-menu]');
const closeTbMenus = (except?: HTMLButtonElement) =>
  tbMenus.forEach((b) => {
    if (b === except) return;
    b.setAttribute('aria-expanded', 'false');
    document.getElementById(b.getAttribute('aria-controls')!)!.hidden = true;
  });
function paintTabbar(id: string) {
  const group = TB_GROUP[id] ?? 'stats';
  tabbar.style.setProperty('--i', String(TB_ORDER.indexOf(group)));
  $$('[data-tabbar-group]').forEach((b) => b.toggleAttribute('data-active', b.dataset.tabbarGroup === group));
  closeTbMenus();
}
tbMenus.forEach((b) =>
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    const menuEl = document.getElementById(b.getAttribute('aria-controls')!)!;
    const open = menuEl.hidden;
    closeTbMenus(b);
    menuEl.hidden = !open;
    b.setAttribute('aria-expanded', String(open));
  }),
);
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.tabbar__menu')) closeTbMenus();
});
document.addEventListener('keydown', (e) => e.key === 'Escape' && closeTbMenus());

function showTab(id: string) {
  paintTabbar(id);
  $$('[data-tab]').forEach((b) => (b.dataset.tab === id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $$('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== id));
  const adding = ADD_PANELS.includes(id);
  menuBtn.classList.toggle('is-active', adding);
  setMenu(!phone.matches && (adding || !menu.hidden));
  history.replaceState(null, '', `${location.search}#${id}`);
  scrollTo({ top: 0 });
}
$$('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab!)));
menuBtn.addEventListener('click', () => setMenu(Boolean(menu.hidden)));
document.addEventListener('click', (e) => {
  if (phone.matches && !menu.hidden && !(e.target as Element).closest('.side__add')) setMenu(false);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && phone.matches && !menu.hidden) {
    setMenu(false);
    menuBtn.focus();
  }
});
showTab(PANELS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'stats');

// ---------------------------------------------------------------- Instagram

import('./ig').then(({ initIg }) => initIg(api, (id) => document.querySelector(`[data-tab="${id}"]`)));

// ---------------------------------------------------------------- dashboard

type Stats = {
  asOf: string;
  explorers: number;
  newExplorers: { day: string; n: number }[];
  badges: { id: string; n: number }[];
  badgesPerDay: { day: string; n: number }[];
  likes: { id: string; n: number }[];
};

/** The last 30 days in Taiwan time, oldest first, with zeros where nothing happened. */
function last30(rows: { day: string; n: number }[]) {
  const by = new Map(rows.map((r) => [r.day, r.n]));
  const today = new Date(Date.now() + 8 * 3600_000);
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(today.getTime() - (29 - i) * 86_400_000).toISOString().slice(0, 10);
    const [, m, day] = d.split('-').map(Number);
    return { label: `${m}/${day}`, tip: d, value: by.get(d) ?? 0 };
  });
}

async function loadStats() {
  const err = $('#stats-error');
  err.hidden = true;
  $('#stats').setAttribute('aria-busy', 'true');
  try {
    const s = await api<Stats>('stats');
    const days = last30(s.newExplorers);
    const badgeTotal = s.badges.reduce((a, b) => a + b.n, 0);
    const likeTotal = s.likes.reduce((a, b) => a + b.n, 0);
    const tiles: [string, number, string][] = [
      ['探索者', s.explorers, '進入過個人世界的瀏覽器'],
      ['近 30 天新增', days.reduce((a, d) => a + d.value, 0), '新的探索者'],
      ['徽章解鎖', badgeTotal, `近 30 天 ${s.badgesPerDay.reduce((a, d) => a + d.n, 0)} 次`],
      ['阿桔愛心', likeTotal, `${s.likes.length} 篇貼文有愛心`],
    ];
    $('#kpis').innerHTML = tiles.map(([k, v, note]) => `<div class="kpi"><span class="kpi__label">${k}</span><strong class="kpi__value">${v.toLocaleString()}</strong><span class="kpi__note">${note}</span></div>`).join('');
    columns($('#chart-explorers'), days, '位新探索者');
    const pct = (n: number) => (s.explorers ? `${((n / s.explorers) * 100).toFixed(n / s.explorers < 0.1 ? 1 : 0)}%` : '');
    bars($('#chart-badges'), s.badges.map((b) => ({ label: names.badges[b.id] ?? b.id, value: b.n, note: pct(b.n) })), '位探索者', '還沒有人解鎖徽章');
    bars($('#chart-likes'), s.likes.map((l) => ({ label: names.posts[l.id] ?? l.id, value: l.n })), '個愛心', '還沒有愛心');
    $('#stats-asof').textContent = `資料時間 ${new Date(s.asOf).toLocaleString('zh-TW', { hour12: false })}`;
  } catch (e) {
    err.textContent = (e as Error).message;
    err.hidden = false;
  } finally {
    $('#stats').removeAttribute('aria-busy');
  }
}
$('#stats-refresh').addEventListener('click', loadStats);

// ---------------------------------------------------------------- deploys

type Run = { id: number; sha: string; status: string; conclusion: string | null; createdAt: string; url: string; title: string };
const runLabel = (r: Run) =>
  r.status !== 'completed' ? ['部署中', 'running'] : r.conclusion === 'success' ? ['已上線', 'good'] : r.conclusion === 'cancelled' ? ['已取消', 'muted'] : ['失敗', 'bad'];

async function loadDeploys(): Promise<Run[]> {
  try {
    const { runs } = await api<{ runs: Run[] }>('deploys');
    $('#deploys').innerHTML = runs.length
      ? runs
          .map((r) => {
            const [label, tone] = runLabel(r);
            const when = new Date(r.createdAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
            return `<li><span class="pill pill--${tone}">${label}</span><a href="${r.url}" target="_blank" rel="noopener">${r.title.replace(/</g, '&lt;')}</a><time>${when}</time></li>`;
          })
          .join('')
      : '<li class="muted">還沒有部署紀錄</li>';
    const latest = runs[0];
    $('#deploy-latest').innerHTML = latest ? `<span class="pill pill--${runLabel(latest)[1]}">${runLabel(latest)[0]}</span>` : '';
    $('#tb-deploy').innerHTML = $('#deploy-latest').innerHTML;
    return runs;
  } catch (e) {
    $('#deploys').innerHTML = `<li class="error">${(e as Error).message}</li>`;
    return [];
  }
}
$('#deploys-refresh').addEventListener('click', loadDeploys);
$('#redeploy').addEventListener('click', async (ev) => {
  const btn = ev.currentTarget as HTMLButtonElement;
  btn.disabled = true;
  try {
    await api('redeploy', { method: 'POST' });
    btn.textContent = '已觸發，稍候…';
    setTimeout(loadDeploys, 4000);
  } catch (e) {
    alertBox((e as Error).message);
  } finally {
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '重新部署';
    }, 8000);
  }
});

function alertBox(msg: string) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  setTimeout(() => (el.hidden = true), 8000);
}

// ---------------------------------------------------------------- new posts: files + JSON

type Upload = {
  key: number;
  /** Name in the repo and in the JSON, e.g. img-1234.jpg */
  name: string;
  original: string;
  type: 'image' | 'video';
  blob?: Blob;
  /** Thumbnail URL. */
  url?: string;
  /** A poster made from a clip (uploaded only if the JSON uses it). */
  auto?: boolean;
  status: 'working' | 'ready' | 'error';
  note: string;
  /** Albums: shooting date / camera read before re-drawing, added to the photo entry. */
  shot?: Shot;
};

let nextKey = 1;
const escHtml = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

class PostForm {
  uploads: Upload[] = [];
  busy = false;
  idTouched = false;
  kind: Kind;
  list: HTMLElement;
  json: HTMLTextAreaElement;
  idField: HTMLInputElement;
  checked: (Checked & { input: unknown }) | null = null;
  progress: Progress;

  constructor(public form: HTMLFormElement) {
    this.kind = form.dataset.kind as Kind;
    this.list = $('.files', form);
    this.json = $<HTMLTextAreaElement>('[data-json]', form);
    this.idField = $<HTMLInputElement>('[name=id]', form);
    this.progress = new Progress($('[data-progress]', form));

    // JSON helpers for phones: replace from the clipboard, select all, clear.
    $('[data-json-paste]', form).addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (!text.trim()) return alertBox('剪貼簿是空的');
        this.json.value = text;
        this.update();
        this.saveDraft();
      } catch {
        alertBox('無法讀取剪貼簿：請長按文字框選「貼上」');
      }
    });
    $('[data-json-select]', form).addEventListener('click', () => {
      this.json.focus();
      this.json.setSelectionRange(0, this.json.value.length);
    });
    $('[data-json-clear]', form).addEventListener('click', () => {
      if (this.json.value.trim() && !confirm('清空 JSON？')) return;
      this.json.value = '';
      this.update();
      this.saveDraft();
    });
    this.restoreDraft();

    $<HTMLInputElement>('[data-add-files]', form).addEventListener('change', (e) => {
      const input = e.currentTarget as HTMLInputElement;
      [...(input.files ?? [])].forEach((f) => this.add(f));
      input.value = '';
    });
    $<HTMLInputElement>('[data-json-file]', form).addEventListener('change', async (e) => {
      const input = e.currentTarget as HTMLInputElement;
      const f = input.files?.[0];
      input.value = '';
      if (!f) return;
      this.json.value = await f.text();
      if (!this.idTouched) this.idField.value = f.name.replace(/\.json$/i, '');
      this.update();
    });
    this.idField.addEventListener('input', () => (this.idTouched = this.idField.value.trim() !== ''));
    $('[data-copy-guide]', form).addEventListener('click', async (e) => {
      const btn = e.currentTarget as HTMLButtonElement; // read before await: currentTarget is cleared after dispatch
      const names = this.uploads.filter((u) => !u.auto && u.status === 'ready').map((u) => u.name);
      await navigator.clipboard.writeText(formatGuide(this.kind, names));
      btn.textContent = '已複製 ✓';
      setTimeout(() => (btn.textContent = '複製格式說明（給 agent）'), 2000);
    });
    form.addEventListener('input', () => {
      this.update();
      this.saveDraft();
    });
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.publish();
    });
    this.render();
  }

  uniqueName(name: string) {
    const taken = new Set(this.uploads.map((u) => u.name));
    if (!taken.has(name)) return name;
    const [base, ext] = [name.replace(/\.\w+$/, ''), name.match(/\.\w+$/)![0]];
    for (let i = 2; ; i++) if (!taken.has(`${base}-${i}${ext}`)) return `${base}-${i}${ext}`;
  }

  async add(file: File) {
    const video = file.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
    if (video && this.kind === 'album') return alertBox(`相簿只能放照片：${file.name}`);
    const item: Upload = { key: nextKey++, name: this.uniqueName(fileName(file.name, video)), original: file.name, type: video ? 'video' : 'image', status: 'working', note: '處理中…' };
    this.uploads.push(item);
    this.render();
    try {
      if (video) {
        item.blob = await prepareVideo(file, true, (p, pass) => {
          item.note = `壓縮中 ${Math.round(p * 100)}%${pass ? `（第 ${pass + 1} 次，畫質再降一級）` : ''}`;
          this.renderNote(item);
        });
        item.note = '產生影片封面中…';
        this.renderNote(item);
        const poster = await posterOf(item.blob);
        item.url = URL.createObjectURL(poster);
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}，已去除位置資訊`;
        if (!this.uploads.some((u) => u.name === posterName(item.name)))
          this.uploads.splice(this.uploads.indexOf(item) + 1, 0, { key: nextKey++, name: posterName(item.name), original: '', type: 'image', blob: poster, url: item.url, auto: true, status: 'ready', note: '自動產生的影片封面' });
      } else {
        if (this.kind === 'album') item.shot = await shotOf(file);
        item.blob = await preparePhoto(file);
        item.url = URL.createObjectURL(item.blob);
        const s = item.shot;
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}，${
          this.kind === 'album' ? `已去除 GPS${s?.taken || s?.exif ? `，保留 ${[s.taken, s.exif?.camera].filter(Boolean).join(' · ')}` : ''}` : '已去除 EXIF / GPS'
        }`;
      }
      item.status = 'ready';
    } catch (e) {
      item.status = 'error';
      item.note = (e as Error).message;
    }
    this.render();
  }

  remove(item: Upload) {
    const gone = new Set([item, ...(item.type === 'video' ? this.uploads.filter((u) => u.auto && u.name === posterName(item.name)) : [])]);
    gone.forEach((u) => u.url && !this.uploads.some((o) => !gone.has(o) && o.url === u.url) && URL.revokeObjectURL(u.url));
    this.uploads = this.uploads.filter((u) => !gone.has(u));
    this.render();
  }

  /** Uploads grouped as [file, its auto poster?], in list order. */
  groups(): Upload[][] {
    const out: Upload[][] = [];
    for (const u of this.uploads) {
      if (u.auto && out.length && out.at(-1)![0].type === 'video' && posterName(out.at(-1)![0].name) === u.name) out.at(-1)!.push(u);
      else out.push([u]);
    }
    return out;
  }

  /** Move a file up / down the list; the JSON's media order follows. */
  move(item: Upload, by: -1 | 1) {
    const groups = this.groups();
    const i = groups.findIndex((g) => g[0] === item);
    const j = i + by;
    if (i < 0 || j < 0 || j >= groups.length) return;
    [groups[i], groups[j]] = [groups[j], groups[i]];
    this.uploads = groups.flat();
    this.syncJsonOrder();
    this.render();
  }

  /**
   * Press and drag a file's handle to reorder (touch, pen or mouse). The dragged row follows the
   * finger, the others slide out of the way; the list and the JSON update on release.
   */
  drag(e: PointerEvent, item: Upload, handle: HTMLElement) {
    if (e.button !== 0 || this.uploads.some((u) => u.status === 'working')) return;
    e.preventDefault();
    const groups = this.groups();
    const from = groups.findIndex((g) => g[0] === item);
    if (from < 0 || groups.length < 2) return;
    const els = groups.map((g) => g.map((u) => this.list.querySelector<HTMLElement>(`[data-key="${u.key}"]`)!));
    const box = (g: HTMLElement[]) => ({ top: g[0].getBoundingClientRect().top + scrollY, bottom: g.at(-1)!.getBoundingClientRect().bottom + scrollY });
    const rects = els.map(box);
    const gap = rects[1].top - rects[0].bottom;
    const height = rects[from].bottom - rects[from].top + gap;
    const mid = (r: { top: number; bottom: number }) => (r.top + r.bottom) / 2;
    const startY = e.clientY + scrollY;
    let lastY = e.clientY;
    let to = from;
    let raf = 0;
    handle.setPointerCapture(e.pointerId);
    this.list.classList.add('is-sorting');
    els[from].forEach((el) => el.classList.add('is-dragging'));
    const layout = () => {
      const dy = lastY + scrollY - startY;
      const center = mid(rects[from]) + dy;
      to = from;
      for (let i = from + 1; i < rects.length; i++) if (center > mid(rects[i])) to = i;
      for (let i = from - 1; i >= 0; i--) if (center < mid(rects[i])) to = i;
      els.forEach((g, i) => {
        const shift = i === from ? dy : from < i && i <= to ? -height : to <= i && i < from ? height : 0;
        g.forEach((el) => (el.style.transform = shift ? `translateY(${shift}px)` : ''));
      });
    };
    // Scroll the page while holding near the top or bottom (above the phone tab bar).
    const edge = () => {
      const bottom = innerHeight - (phone.matches ? 90 : 40);
      const step = lastY < 90 ? -12 : lastY > bottom ? 12 : 0;
      if (step) {
        scrollBy(0, step);
        layout();
      }
      raf = requestAnimationFrame(edge);
    };
    raf = requestAnimationFrame(edge);
    const onMove = (ev: PointerEvent) => {
      lastY = ev.clientY;
      layout();
    };
    const done = () => {
      cancelAnimationFrame(raf);
      handle.removeEventListener('pointermove', onMove);
      handle.removeEventListener('pointerup', done);
      handle.removeEventListener('pointercancel', done);
      this.list.classList.remove('is-sorting');
      if (to !== from) {
        const [g] = groups.splice(from, 1);
        groups.splice(to, 0, g);
        this.uploads = groups.flat();
        this.syncJsonOrder();
      }
      this.render();
    };
    handle.addEventListener('pointermove', onMove);
    handle.addEventListener('pointerup', done);
    handle.addEventListener('pointercancel', done);
  }

  /** Reorder the JSON's media (albums: photos) that point at uploads to match the list (others stay put). */
  syncJsonOrder() {
    let input: Record<string, unknown>;
    try {
      input = JSON.parse(this.json.value);
    } catch {
      return;
    }
    const key = this.kind === 'album' ? 'photos' : 'media';
    if (!Array.isArray(input?.[key])) return;
    const id = this.idField.value.trim() || (typeof input.id === 'string' ? input.id : '');
    const order = new Map(this.uploads.map((u, i) => [u.name, i]));
    const rank = (m: { type?: unknown; src?: unknown }) =>
      typeof m?.src === 'string' && (this.kind === 'album' || m.type === 'image' || m.type === 'video') ? order.get(refName(this.kind, id, m.src, m.type === 'video') ?? '') : undefined;
    const media = input[key] as { type?: unknown; src?: unknown }[];
    const slots = media.map((m, i) => (rank(m) === undefined ? -1 : i)).filter((i) => i >= 0);
    const sorted = slots.map((i) => media[i]).sort((a, b) => rank(a)! - rank(b)!);
    const next = [...media];
    slots.forEach((slot, k) => (next[slot] = sorted[k]));
    if (next.every((m, i) => m === media[i])) return;
    input[key] = next;
    this.json.value = JSON.stringify(input, null, 2);
  }

  renderNote(item: Upload) {
    const el = this.list.querySelector(`[data-key="${item.key}"] .file__note`);
    if (el) el.textContent = item.note;
  }

  render() {
    const heads = this.groups().map((g) => g[0]);
    this.list.innerHTML = this.uploads
      .map(
        (u) => `<li class="file file--${u.status}${u.auto ? ' file--auto' : ''}" data-key="${u.key}">
          ${
            u.auto
              ? '<span class="file__grip"></span>'
              : `<button type="button" class="file__grip" data-grip aria-label="第 ${heads.indexOf(u) + 1} 個，按住拖曳排序（或用上下鍵）"><span aria-hidden="true">⠿</span><small>${heads.indexOf(u) + 1}</small></button>`
          }
          <span class="file__thumb">${u.url ? `<img src="${u.url}" alt="">` : '…'}${u.type === 'video' ? '<span class="file__badge">影片</span>' : ''}</span>
          <span class="file__body">
            <button type="button" class="file__name" title="複製檔名">${escHtml(u.name)}</button>
            <span class="file__note">${u.original && u.original !== u.name ? `${escHtml(u.original)} · ` : ''}${escHtml(u.note)}</span>
          </span>
          ${u.auto ? '' : '<button type="button" class="file__remove" aria-label="移除">✕</button>'}
        </li>`,
      )
      .join('');
    this.list.querySelectorAll<HTMLElement>('li').forEach((li) => {
      const item = this.uploads.find((u) => u.key === Number(li.dataset.key))!;
      li.querySelector('.file__remove')?.addEventListener('click', () => this.remove(item));
      const grip = li.querySelector<HTMLElement>('[data-grip]');
      grip?.addEventListener('pointerdown', (e) => this.drag(e, item, grip));
      grip?.addEventListener('keydown', (e) => {
        if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
        e.preventDefault();
        this.move(item, e.key === 'ArrowUp' ? -1 : 1);
        this.list.querySelector<HTMLElement>(`[data-key="${item.key}"] [data-grip]`)?.focus();
      });
      $('.file__name', li).addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLElement;
        await navigator.clipboard.writeText(item.name);
        btn.classList.add('is-copied');
        setTimeout(() => li.querySelector('.file__name')?.classList.remove('is-copied'), 1200);
      });
    });
    this.update();
  }

  /**
   * Albums: fill in what the page knows and the JSON need not say. Each photo gets its shooting
   * date / camera (unless written), order defaults to after the last album.
   */
  prepare(input: unknown): unknown {
    if (this.kind !== 'album' || typeof input !== 'object' || input === null || Array.isArray(input)) return input;
    const out = { ...(input as Record<string, unknown>) };
    if (out.order === undefined) out.order = names.nextAlbumOrder;
    const id = this.idField.value.trim();
    if (Array.isArray(out.photos))
      out.photos = out.photos.map((ph) => {
        if (typeof ph !== 'object' || ph === null || typeof (ph as { src?: unknown }).src !== 'string') return ph;
        const name = refName('album', id, (ph as { src: string }).src, false);
        const shot = this.uploads.find((u) => u.name === name)?.shot;
        return shot ? { ...ph, ...(('taken' in ph) ? {} : shot.taken ? { taken: shot.taken } : {}), ...(('exif' in ph) ? {} : shot.exif ? { exif: shot.exif } : {}) } : ph;
      });
    return out;
  }

  /** Live check of the JSON against the uploads (same rules as the Worker). */
  update() {
    const out = $('.check', this.form);
    const btn = $<HTMLButtonElement>('[type=submit]', this.form);
    const raw = this.json.value.trim();
    this.checked = null;
    const working = this.uploads.some((u) => u.status === 'working');
    const broken = this.uploads.filter((u) => u.status === 'error');
    let input: unknown;
    const lines: string[] = [];
    if (raw) {
      try {
        input = JSON.parse(raw);
      } catch (e) {
        lines.push(`<li class="bad">JSON 格式錯誤：${escHtml((e as Error).message)}</li>`);
      }
    }
    if (input !== undefined) {
      const fromJson = typeof (input as { id?: unknown })?.id === 'string' ? (input as { id: string }).id : '';
      if (fromJson && !this.idTouched) this.idField.value = fromJson;
      const ready = new Set(this.uploads.filter((u) => u.status === 'ready').map((u) => u.name));
      const id = this.idField.value.trim();
      const prepared = this.prepare(input);
      const c = checkPost(this.kind, id, prepared, ready);
      if (this.kind === 'album' && names.albums.includes(id)) c.errors.push(`相簿「${id}」已經存在；第一版只能新增，請換一個 ID`);
      this.checked = { ...c, input: prepared };
      c.errors.forEach((m) => lines.push(`<li class="bad">${escHtml(m)}</li>`));
      const unused = this.uploads.filter((u) => !u.auto && u.status === 'ready' && !c.used.includes(u.name)).map((u) => u.name);
      if (unused.length) lines.push(`<li class="warn">JSON 沒用到，不會上傳：${escHtml(unused.join(', '))}</li>`);
      if (!c.errors.length) lines.unshift(`<li class="good">可以發布：會新增 <code>${escHtml(contentPath(this.kind, id))}</code> 和 ${c.used.length} 個檔案</li>`);
    }
    broken.forEach((u) => lines.push(`<li class="bad">${escHtml(u.original)}：${escHtml(u.note)}（請移除）</li>`));
    if (working) lines.push('<li class="muted">還有檔案在處理中…</li>');
    out.innerHTML = lines.join('') || '<li class="muted">貼上 JSON 後會在這裡即時檢查</li>';
    btn.disabled = this.busy || working || broken.length > 0 || !this.checked || this.checked.errors.length > 0;
  }

  /** The JSON and ID survive a closed tab (iOS often drops background tabs); photos must be picked again. */
  private get draftKey() {
    return `admin:draft:${this.kind}`;
  }
  saveDraft() {
    try {
      const json = this.json.value;
      if (json.trim()) localStorage.setItem(this.draftKey, JSON.stringify({ json, id: this.idTouched ? this.idField.value : '' }));
      else localStorage.removeItem(this.draftKey);
    } catch {}
  }
  restoreDraft() {
    try {
      const d = JSON.parse(localStorage.getItem(this.draftKey) ?? 'null') as { json: string; id: string } | null;
      if (!d?.json) return;
      this.json.value = d.json;
      if (d.id) {
        this.idField.value = d.id;
        this.idTouched = true;
      }
      $('[data-draft-note]', this.form).hidden = false;
    } catch {}
  }
  clearDraft() {
    try {
      localStorage.removeItem(this.draftKey);
    } catch {}
    $('[data-draft-note]', this.form).hidden = true;
  }

  async publish() {
    const c = this.checked;
    if (!c || c.errors.length) return;
    const id = this.idField.value.trim();
    this.busy = true;
    this.update();
    const pr = this.progress;
    pr.start('準備上傳…');
    try {
      const toSend = c.used.map((name) => this.uploads.find((u) => u.name === name)!);
      const files: { name: string; sha?: string }[] = [];
      // Uploads are the first 60% of the bar (by size), the commit a little, the deploy the rest.
      const total = toSend.reduce((a, u) => a + (u.blob?.size ?? 0), 0) || 1;
      let sent = 0;
      for (const [i, u] of toSend.entries()) {
        if (u.blob!.size > MAX_VIDEO_BYTES + 1) throw new Error(`${u.name} 太大`);
        pr.set(0.6 * (sent / total), `上傳中 ${i + 1} / ${toSend.length}`, `${u.name}（${formatBytes(u.blob!.size)}）`);
        if (u.type === 'video') {
          // Clips go to the R2 bucket (media.52hzfan.com), not into git.
          const q = new URLSearchParams({ kind: this.kind, id, name: u.name });
          await api<{ key: string }>(`media?${q}`, { method: 'PUT', body: u.blob!, headers: { 'Content-Type': 'video/mp4' } });
          files.push({ name: u.name });
        } else {
          const { sha } = await api<{ sha: string }>('blob', { method: 'POST', body: await base64Of(u.blob!), headers: { 'Content-Type': 'text/plain' } });
          files.push({ name: u.name, sha });
        }
        sent += u.blob!.size;
        pr.log(`上傳 ${escHtml(u.name)}（${formatBytes(u.blob!.size)}）`);
      }
      pr.set(0.62, '建立 commit…');
      const res = await api<{ id: string; commit: { sha: string; url: string } }>('publish', {
        method: 'POST',
        body: JSON.stringify({ kind: this.kind, id, post: c.input, files }),
        headers: { 'Content-Type': 'application/json' },
      });
      pr.log(`已 commit 到 main：<a href="${res.commit.url}" target="_blank" rel="noopener">${res.commit.sha.slice(0, 7)}</a>`, 'good');
      this.reset();
      this.clearDraft();
      await this.follow(res.commit.sha, id);
    } catch (e) {
      pr.fail((e as Error).message);
    } finally {
      this.busy = false;
      this.update();
    }
  }

  reset() {
    this.uploads.forEach((u) => u.url && URL.revokeObjectURL(u.url));
    this.uploads = [];
    this.form.reset();
    this.idTouched = false;
    this.render();
  }

  /** Watch the deploy run for this commit until the site is live (about 2-4 minutes). */
  async follow(sha: string, id: string) {
    const pr = this.progress;
    const started = Date.now();
    const TYPICAL = 180_000; // a deploy usually takes 2-4 minutes: the bar moves on that guess, never quite to the end
    let phase = '等待網站部署開始…';
    const tick = () => {
      const t = Date.now() - started;
      pr.set(0.65 + 0.32 * Math.min(1, t / TYPICAL), phase, `${duration(t)}（通常 2–4 分鐘）・內容已存到 GitHub，離開這頁網站也會自己更新`);
    };
    tick();
    const timer = setInterval(tick, 1000);
    try {
      while (Date.now() - started < 20 * 60_000) {
        await new Promise((r) => setTimeout(r, 8_000));
        const run = (await loadDeploys()).find((r) => r.sha === sha);
        if (!run) continue;
        const [label] = runLabel(run);
        if (run.status !== 'completed') {
          phase = '網站部署中…';
          pr.setActions(`<a class="button ghost" href="${run.url}" target="_blank" rel="noopener">看 Actions</a>`);
          continue;
        }
        clearInterval(timer);
        if (run.conclusion === 'success') {
          const page = { ajie: '/zh-tw/personal/companion/', journey: '/zh-tw/personal/journey/', album: `/zh-tw/personal/gallery/${id}/` }[this.kind];
          const name = { ajie: '阿桔頁面', journey: '旅程頁面', album: '這本相簿' }[this.kind];
          pr.done(
            '網站已更新 🎉',
            `<a class="button" href="${page}" target="_blank" rel="noopener">打開${name}</a>${this.kind === 'ajie' ? `<a class="button primary" href="/admin/?${new URLSearchParams({ ig: id })}#ig">接著發到 IG →</a>` : ''}`,
            `花了 ${duration(Date.now() - started)}・瀏覽器可能要強制重新整理${this.kind === 'album' ? '・draft 的相簿不會公開' : ''}`,
          );
        } else {
          pr.fail(`部署${label}。內容已在 main，修好後可到「網站部署」按「重新部署」。`);
          pr.setActions(`<a class="button" href="${run.url}" target="_blank" rel="noopener">看錯誤訊息</a>`);
        }
        return;
      }
      pr.fail('等很久都沒看到部署結果，請到「網站部署」確認');
    } finally {
      clearInterval(timer);
    }
  }
}

$$<HTMLFormElement>('form[data-kind]').forEach((f) => new PostForm(f));

// ---------------------------------------------------------------- start

api<{ email: string }>('me')
  .then(({ email }) => {
    $('#who').textContent = email;
    loadStats();
    loadDeploys();
  })
  .catch((e) => {
    $('#gate').hidden = false;
    $('#gate-msg').textContent = (e as Error).message;
  });
