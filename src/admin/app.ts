/**
 * Admin page logic: dashboard, the two "add" forms and deploy status. Talks only to
 * /api/admin/* on this origin (the site-admin Worker, behind Cloudflare Access).
 */
import { bars, columns } from './charts';
import { base64Of, formatBytes, MAX_VIDEO_BYTES, posterOf, prepareVideo, preparePhoto } from './media';
import { checkPost, fileName, formatGuide, posterName, type Checked, type Kind } from '@/lib/admin-post';

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

  constructor(public form: HTMLFormElement) {
    this.kind = form.dataset.kind as Kind;
    this.list = $('.files', form);
    this.json = $<HTMLTextAreaElement>('[data-json]', form);
    this.idField = $<HTMLInputElement>('[name=id]', form);

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
    form.addEventListener('input', () => this.update());
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
    const item: Upload = { key: nextKey++, name: this.uniqueName(fileName(file.name, video)), original: file.name, type: video ? 'video' : 'image', status: 'working', note: '處理中…' };
    this.uploads.push(item);
    this.render();
    try {
      if (video) {
        item.blob = await prepareVideo(file, true, (p, pass) => {
          item.note = `壓縮中 ${Math.round(p * 100)}%${pass ? `（第 ${pass + 1} 次，畫質再降一級）` : ''}`;
          this.renderNote(item);
        });
        const poster = await posterOf(item.blob);
        item.url = URL.createObjectURL(poster);
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}，已去除位置資訊`;
        if (!this.uploads.some((u) => u.name === posterName(item.name)))
          this.uploads.splice(this.uploads.indexOf(item) + 1, 0, { key: nextKey++, name: posterName(item.name), original: '', type: 'image', blob: poster, url: item.url, auto: true, status: 'ready', note: '自動產生的影片封面' });
      } else {
        item.blob = await preparePhoto(file);
        item.url = URL.createObjectURL(item.blob);
        item.note = `${formatBytes(file.size)} → ${formatBytes(item.blob.size)}，已去除 EXIF / GPS`;
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

  renderNote(item: Upload) {
    const el = this.list.querySelector(`[data-key="${item.key}"] .file__note`);
    if (el) el.textContent = item.note;
  }

  render() {
    this.list.innerHTML = this.uploads
      .map(
        (u) => `<li class="file file--${u.status}${u.auto ? ' file--auto' : ''}" data-key="${u.key}">
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
      $('.file__name', li).addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLElement;
        await navigator.clipboard.writeText(item.name);
        btn.classList.add('is-copied');
        setTimeout(() => li.querySelector('.file__name')?.classList.remove('is-copied'), 1200);
      });
    });
    this.update();
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
      const c = checkPost(this.kind, this.idField.value.trim(), input, ready);
      this.checked = { ...c, input };
      c.errors.forEach((m) => lines.push(`<li class="bad">${escHtml(m)}</li>`));
      const unused = this.uploads.filter((u) => !u.auto && u.status === 'ready' && !c.used.includes(u.name)).map((u) => u.name);
      if (unused.length) lines.push(`<li class="warn">JSON 沒用到，不會上傳：${escHtml(unused.join(', '))}</li>`);
      if (!c.errors.length) {
        const id = this.idField.value.trim();
        lines.unshift(`<li class="good">可以發布：會新增 <code>src/content/${this.kind}/${escHtml(id)}.json</code> 和 ${c.used.length} 個檔案</li>`);
      }
    }
    broken.forEach((u) => lines.push(`<li class="bad">${escHtml(u.original)}：${escHtml(u.note)}（請移除）</li>`));
    if (working) lines.push('<li class="muted">還有檔案在處理中…</li>');
    out.innerHTML = lines.join('') || '<li class="muted">貼上 JSON 後會在這裡即時檢查</li>';
    btn.disabled = this.busy || working || broken.length > 0 || !this.checked || this.checked.errors.length > 0;
  }

  log(msg: string, tone = '') {
    const li = document.createElement('li');
    li.className = tone;
    li.innerHTML = msg;
    $('.log', this.form).append(li);
    return li;
  }

  async publish() {
    const c = this.checked;
    if (!c || c.errors.length) return;
    const id = this.idField.value.trim();
    this.busy = true;
    this.update();
    $('.log', this.form).innerHTML = '';
    try {
      const toSend = c.used.map((name) => this.uploads.find((u) => u.name === name)!);
      const files: { name: string; sha: string }[] = [];
      for (const [i, u] of toSend.entries()) {
        if (u.blob!.size > MAX_VIDEO_BYTES + 1) throw new Error(`${u.name} 太大`);
        const line = this.log(`上傳 ${escHtml(u.name)}（${formatBytes(u.blob!.size)}，${i + 1}/${toSend.length}）…`);
        const { sha } = await api<{ sha: string }>('blob', { method: 'POST', body: await base64Of(u.blob!), headers: { 'Content-Type': 'text/plain' } });
        files.push({ name: u.name, sha });
        line.textContent += ' 完成';
      }
      this.log('建立 commit…');
      const res = await api<{ id: string; commit: { sha: string; url: string } }>('publish', {
        method: 'POST',
        body: JSON.stringify({ kind: this.kind, id, post: c.input, files }),
        headers: { 'Content-Type': 'application/json' },
      });
      this.log(`已 commit 到 main：<a href="${res.commit.url}" target="_blank" rel="noopener">${res.commit.sha.slice(0, 7)}</a>`, 'good');
      this.reset();
      await this.follow(res.commit.sha);
    } catch (e) {
      this.log(escHtml((e as Error).message).replace(/\n/g, '<br>'), 'bad');
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
  async follow(sha: string) {
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
        const page = this.kind === 'ajie' ? '/zh-tw/personal/companion/' : '/zh-tw/personal/journey/';
        line.innerHTML = `網站已更新 🎉 <a href="${page}" target="_blank" rel="noopener">打開${this.kind === 'ajie' ? '阿桔' : '旅程'}頁面</a>（瀏覽器可能要強制重新整理）`;
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
