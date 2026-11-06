/**
 * Admin page logic: dashboard, the two "add" forms and deploy status. Talks only to
 * /api/admin/* on this origin (the site-admin Worker, behind Cloudflare Access).
 */
import { bars, columns } from './charts';
import { base64Of, formatBytes, MAX_VIDEO_BYTES, posterOf, prepareVideo, preparePhoto } from './media';

if (import.meta.env.DEV && new URLSearchParams(location.search).has('mock')) (await import('./dev-mock')).installMock();

type Names = { badges: Record<string, string>; posts: Record<string, string> };
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

function showTab(id: string) {
  $$('[data-tab]').forEach((b) => (b.dataset.tab === id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $$('[data-panel]').forEach((p) => (p.hidden = p.dataset.panel !== id));
  history.replaceState(null, '', `${location.search}#${id}`);
  scrollTo({ top: 0 });
}
$$('[data-tab]').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab!)));
const PANELS = ['stats', 'deploys', 'ajie', 'journey'];
showTab(PANELS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'stats');

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

// ---------------------------------------------------------------- media items

type Item = {
  key: number;
  type: 'image' | 'video' | 'youtube';
  blob?: Blob;
  poster?: Blob;
  ytId?: string;
  loop: boolean;
  alt: string;
  status: 'working' | 'ready' | 'error';
  note: string;
  url?: string;
};

let nextKey = 1;

class PostForm {
  items: Item[] = [];
  cover?: { blob: Blob; url: string };
  busy = false;
  list: HTMLElement;

  constructor(public form: HTMLFormElement) {
    this.list = $('.media-list', form);
    const kind = form.dataset.kind!;
    $<HTMLInputElement>('[data-add-media]', form).addEventListener('change', (e) => {
      const input = e.currentTarget as HTMLInputElement;
      [...(input.files ?? [])].forEach((f) => this.add(f));
      input.value = '';
    });
    $('[data-add-youtube]', form).addEventListener('click', () => {
      const field = $<HTMLInputElement>('[data-youtube]', form);
      const raw = field.value.trim();
      field.value = '';
      const id = /(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,20})/.exec(raw)?.[1] ?? (/^[A-Za-z0-9_-]{6,20}$/.test(raw.trim()) ? raw.trim() : '');
      if (!id) return raw && alertBox('看不懂這個 YouTube 網址');
      this.items.push({ key: nextKey++, type: 'youtube', ytId: id, loop: false, alt: '', status: 'ready', note: `YouTube ${id}` });
      this.render();
    });
    const cover = form.querySelector<HTMLInputElement>('[data-cover]');
    cover?.addEventListener('change', async () => {
      const f = cover.files?.[0];
      if (!f) return;
      const out = $('.cover-preview', form);
      out.textContent = '處理中…';
      try {
        const blob = await preparePhoto(f);
        if (this.cover) URL.revokeObjectURL(this.cover.url);
        this.cover = { blob, url: URL.createObjectURL(blob) };
        out.innerHTML = `<img src="${this.cover.url}" alt=""><span>${formatBytes(blob.size)}</span><button type="button" class="link">移除</button>`;
        $('button', out).addEventListener('click', () => {
          this.cover = undefined;
          out.textContent = '';
          cover.value = '';
          this.update();
        });
      } catch (e) {
        out.textContent = (e as Error).message;
      }
      this.update();
    });
    form.addEventListener('input', () => this.update());
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.publish(kind as 'ajie' | 'journey');
    });
    this.update();
  }

  async add(file: File) {
    const isVideo = file.type.startsWith('video/') || /\.(mov|mp4|m4v|webm)$/i.test(file.name);
    const item: Item = { key: nextKey++, type: isVideo ? 'video' : 'image', loop: true, alt: '', status: 'working', note: `${file.name} · 處理中…` };
    this.items.push(item);
    this.render();
    try {
      if (isVideo) {
        item.blob = await prepareVideo(file, true, (p, pass) => {
          item.note = `${file.name} · 壓縮中 ${Math.round(p * 100)}%${pass ? `（第 ${pass + 1} 次，畫質再降一級）` : ''}`;
          this.renderNote(item);
        });
        item.poster = await posterOf(item.blob);
        item.url = URL.createObjectURL(item.poster);
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}（已去除位置資訊）`;
      } else {
        item.blob = await preparePhoto(file);
        item.url = URL.createObjectURL(item.blob);
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}（已去除 EXIF / GPS）`;
      }
      item.status = 'ready';
    } catch (e) {
      item.status = 'error';
      item.note = `${file.name}：${(e as Error).message}`;
    }
    this.render();
  }

  renderNote(item: Item) {
    const el = this.list.querySelector(`[data-key="${item.key}"] .media__note`);
    if (el) el.textContent = item.note;
  }

  render() {
    this.list.innerHTML = this.items
      .map(
        (it, i) => `<li class="media media--${it.status}" data-key="${it.key}">
          <span class="media__n">${i + 1}</span>
          <span class="media__thumb">${it.url ? `<img src="${it.url}" alt="">` : it.type === 'youtube' ? '▶' : '…'}${it.type === 'video' ? '<span class="media__badge">影片</span>' : ''}</span>
          <span class="media__body">
            <span class="media__note">${it.note.replace(/</g, '&lt;')}</span>
            <input class="media__alt" type="text" placeholder="替代文字（選填，給看不到圖的人）" value="${it.alt.replace(/"/g, '&quot;')}">
            ${it.type === 'video' ? `<label class="check"><input type="checkbox" class="media__loop" ${it.loop ? 'checked' : ''}> 像 IG 一樣靜音循環播放（取消則顯示播放鍵、可開聲音）</label>` : ''}
          </span>
          <span class="media__actions">
            <button type="button" data-move="-1" aria-label="往前" ${i === 0 ? 'disabled' : ''}>↑</button>
            <button type="button" data-move="1" aria-label="往後" ${i === this.items.length - 1 ? 'disabled' : ''}>↓</button>
            <button type="button" data-remove aria-label="移除">✕</button>
          </span>
        </li>`,
      )
      .join('');
    this.list.querySelectorAll<HTMLElement>('li').forEach((li) => {
      const item = this.items.find((x) => x.key === Number(li.dataset.key))!;
      $<HTMLInputElement>('.media__alt', li).addEventListener('input', (e) => (item.alt = (e.target as HTMLInputElement).value));
      li.querySelector<HTMLInputElement>('.media__loop')?.addEventListener('change', (e) => (item.loop = (e.target as HTMLInputElement).checked));
      li.querySelectorAll<HTMLButtonElement>('[data-move]').forEach((b) =>
        b.addEventListener('click', () => {
          const i = this.items.indexOf(item);
          const j = i + Number(b.dataset.move);
          [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
          this.render();
        }),
      );
      $('[data-remove]', li).addEventListener('click', () => {
        if (item.url) URL.revokeObjectURL(item.url);
        this.items = this.items.filter((x) => x !== item);
        this.render();
      });
    });
    this.update();
  }

  field(name: string) {
    return (this.form.elements.namedItem(name) as HTMLInputElement | null)?.value.trim() ?? '';
  }
  langs(group: string) {
    return Object.fromEntries($$<HTMLInputElement>(`[data-lang="${group}"] [data-l]`, this.form).map((el) => [el.dataset.l!, el.value.trim()]));
  }

  update() {
    const date = this.field('date');
    const slug = this.field('slug');
    $('[data-id]', this.form).textContent = date && slug ? `${date}-${slug}` : '（填好日期和代稱後顯示）';
    const working = this.items.some((i) => i.status === 'working');
    const broken = this.items.some((i) => i.status === 'error');
    const btn = $<HTMLButtonElement>('[type=submit]', this.form);
    btn.disabled = this.busy || working || broken;
    $('[data-hint]', this.form).textContent = working ? '還有檔案在處理中…' : broken ? '有檔案處理失敗，請移除它' : '';
  }

  log(msg: string, tone = '') {
    const li = document.createElement('li');
    li.className = tone;
    li.innerHTML = msg;
    $('.log', this.form).append(li);
    return li;
  }

  async publish(kind: 'ajie' | 'journey') {
    if (!this.form.reportValidity()) return;
    this.busy = true;
    this.update();
    $('.log', this.form).innerHTML = '';
    try {
      const uploads: { name: string; blob: Blob }[] = [];
      const media = this.items.map((it, i) => {
        const nn = String(i + 1).padStart(2, '0');
        const alt = it.alt.trim() ? { 'zh-tw': it.alt.trim() } : undefined;
        if (it.type === 'image') {
          uploads.push({ name: `${nn}.jpg`, blob: it.blob! });
          return { type: 'image', file: `${nn}.jpg`, alt };
        }
        if (it.type === 'video') {
          uploads.push({ name: `${nn}.mp4`, blob: it.blob! }, { name: `${nn}-poster.jpg`, blob: it.poster! });
          return { type: 'video', file: `${nn}.mp4`, poster: `${nn}-poster.jpg`, loop: it.loop, alt };
        }
        return { type: 'youtube', id: it.ytId!, alt };
      });
      if (this.cover) uploads.push({ name: 'cover.jpg', blob: this.cover.blob });
      if (kind === 'ajie' && !media.length) throw new Error('阿桔的貼文至少要一張照片或一段影片');

      const files: { name: string; sha: string }[] = [];
      for (const [i, u] of uploads.entries()) {
        if (u.blob.size > MAX_VIDEO_BYTES + 1) throw new Error(`${u.name} 太大`);
        const line = this.log(`上傳 ${u.name}（${formatBytes(u.blob.size)}，${i + 1}/${uploads.length}）…`);
        const { sha } = await api<{ sha: string }>('blob', { method: 'POST', body: await base64Of(u.blob), headers: { 'Content-Type': 'text/plain' } });
        files.push({ name: u.name, sha });
        line.textContent += ' 完成';
      }

      const input = {
        kind,
        slug: this.field('slug'),
        date: this.field('date'),
        from: this.field('from') || undefined,
        title: this.langs('title'),
        place: this.langs('place'),
        text: this.langs('text'),
        category: this.field('category') || undefined,
        stat: this.field('stat') || undefined,
        cover: this.cover ? { file: 'cover.jpg', alt: this.langs('cover-alt') } : undefined,
        media,
        files,
      };
      this.log('建立 commit…');
      const res = await api<{ id: string; commit: { sha: string; url: string } }>('publish', { method: 'POST', body: JSON.stringify(input), headers: { 'Content-Type': 'application/json' } });
      this.log(`已 commit 到 main：<a href="${res.commit.url}" target="_blank" rel="noopener">${res.commit.sha.slice(0, 7)}</a>`, 'good');
      this.reset();
      await this.follow(res.commit.sha, kind);
    } catch (e) {
      this.log((e as Error).message, 'bad');
    } finally {
      this.busy = false;
      this.update();
    }
  }

  reset() {
    this.items.forEach((i) => i.url && URL.revokeObjectURL(i.url));
    this.items = [];
    this.cover = undefined;
    this.form.reset();
    const cp = this.form.querySelector('.cover-preview');
    if (cp) cp.textContent = '';
    this.render();
  }

  /** Watch the deploy run for this commit until the site is live (about 2-4 minutes). */
  async follow(sha: string, kind: 'ajie' | 'journey') {
    const line = this.log('等待網站部署開始…');
    const started = Date.now();
    while (Date.now() - started < 20 * 60_000) {
      await new Promise((r) => setTimeout(r, 10_000));
      const run = (await loadDeploys()).find((r) => r.sha === sha);
      if (!run) continue;
      const [label] = runLabel(run);
      const secs = Math.round((Date.now() - started) / 1000);
      if (run.status !== 'completed') {
        line.innerHTML = `網站${label}（${secs} 秒）… <a href="${run.url}" target="_blank" rel="noopener">看 Actions</a>`;
        continue;
      }
      if (run.conclusion === 'success') {
        const page = kind === 'ajie' ? '/zh-tw/personal/companion/' : '/zh-tw/personal/journey/';
        line.innerHTML = `網站已更新 🎉 <a href="${page}" target="_blank" rel="noopener">打開${kind === 'ajie' ? '阿桔' : '旅程'}頁面</a>（瀏覽器可能要強制重新整理）`;
        line.className = 'good';
      } else {
        line.innerHTML = `部署${label}：<a href="${run.url}" target="_blank" rel="noopener">看錯誤訊息</a>（內容已在 main，修好後可按「重新部署」）`;
        line.className = 'bad';
      }
      return;
    }
    line.textContent = '等很久都沒看到部署結果，請到左邊「網站部署」確認';
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
