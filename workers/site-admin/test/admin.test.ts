import { env } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import worker, { type Env } from '../src/index';
import { addAjiePostId, buildPost, type PublishInput } from '../src/publish';

const TEAM = 'test-team.cloudflareaccess.com';
const AUD = 'aud-123';
const ADMIN = 'qaz5517359@gmail.com';
const SITE = 'https://52hzfan.com';

// ---------------------------------------------------------------- Access tokens signed by a test key

let keys: CryptoKeyPair;
let jwk: JsonWebKey & { kid: string };
const b64url = (bytes: Uint8Array | string) => {
  const s = typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
async function token(claims: Record<string, unknown> = {}, kid = 'k1') {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: 'RS256', kid }));
  const body = b64url(JSON.stringify({ aud: [AUD], iss: `https://${TEAM}`, exp: now + 600, email: ADMIN, ...claims }));
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keys.privateKey, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64url(sig)}`;
}

beforeAll(async () => {
  keys = (await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
  jwk = { ...((await crypto.subtle.exportKey('jwk', keys.publicKey)) as JsonWebKey), kid: 'k1' };
});

// ---------------------------------------------------------------- a fake GitHub repository

type Fake = { files: Map<string, string>; blobs: Map<string, string>; head: string; commits: { message: string; tree: { path: string; sha?: string; content?: string }[] }[]; moveOnce: boolean; dispatched?: string };
let gh: Fake;
const hex = (n: number) => n.toString(16).padStart(40, '0');

const fakeFetch: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : (input as Request).url);
  const method = init?.method ?? 'GET';
  const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
  if (url.hostname === TEAM) return ok({ keys: [jwk] });
  const p = url.pathname.replace('/repos/FanChiMao/FanChiMao.github.io', '');
  if (p === '/git/blobs' && method === 'POST') {
    const body = JSON.parse(await new Response(init!.body).text()) as { content: string; encoding: string };
    expect(body.encoding).toBe('base64');
    const sha = hex(gh.blobs.size + 1);
    gh.blobs.set(sha, atob(body.content));
    return ok({ sha }, 201);
  }
  if (p.startsWith('/contents/')) {
    const path = decodeURIComponent(p.slice('/contents/'.length));
    const text = gh.files.get(path);
    return text === undefined ? ok({ message: 'Not Found' }, 404) : ok({ content: btoa(unescape(encodeURIComponent(text))), sha: 'f' });
  }
  if (p === '/git/ref/heads/main') return ok({ object: { sha: gh.head } });
  if (p.startsWith('/git/commits/') && method === 'GET') return ok({ tree: { sha: 'tree0' } });
  if (p === '/git/trees') return ok({ sha: 'tree1' }, 201);
  if (p === '/git/commits' && method === 'POST') {
    gh.commits.push({ message: JSON.parse(String(init!.body)).message, tree: [] });
    return ok({ sha: hex(1000 + gh.commits.length), html_url: 'https://github.com/x/commit/1' }, 201);
  }
  if (p === '/git/refs/heads/main' && method === 'PATCH') {
    if (gh.moveOnce) {
      gh.moveOnce = false;
      gh.head = hex(999);
      return ok({ message: 'Update is not a fast forward' }, 422);
    }
    gh.head = JSON.parse(String(init!.body)).sha;
    return ok({});
  }
  if (p === '/actions/workflows/deploy.yml/dispatches' && method === 'POST') {
    gh.dispatched = JSON.parse(String(init!.body)).ref;
    return new Response(null, { status: 204 });
  }
  if (p.startsWith('/actions/workflows/deploy.yml/runs')) return ok({ workflow_runs: [{ id: 1, head_sha: gh.head, status: 'in_progress', conclusion: null, created_at: '', updated_at: '', html_url: '', display_title: 'x' }] });
  return ok({ message: `unhandled ${method} ${p}` }, 500);
};

// Capture the tree sent with each commit.
const recordingFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : (input as Request).url;
  if (url.endsWith('/git/trees')) gh.commits.push({ message: '(tree)', tree: JSON.parse(String(init!.body)).tree });
  return fakeFetch(input, init);
};

const E = (over: Partial<Env> = {}): Env => ({
  DB: env.DB,
  MEDIA: env.MEDIA,
  GITHUB_TOKEN: 'test-token',
  GITHUB_REPO: 'FanChiMao/FanChiMao.github.io',
  GITHUB_BRANCH: 'main',
  ACCESS_TEAM_DOMAIN: TEAM,
  ACCESS_AUD: AUD,
  ADMIN_EMAIL: ADMIN,
  FETCH: recordingFetch,
  ...over,
});
const call = async (path: string, init: RequestInit & { jwt?: string | null } = {}, e = E()) => {
  const jwt = init.jwt === undefined ? await token() : init.jwt;
  const headers = new Headers(init.headers);
  if (jwt) headers.set('Cf-Access-Jwt-Assertion', jwt);
  return worker.fetch(new Request(`${SITE}${path}`, { ...init, headers }), e);
};

beforeEach(() => {
  gh = { files: new Map([['src/data/ajie-posts.ts', "export const AJIE_POST_IDS = ['2025-10-04-adoption'] as const;\n"]]), blobs: new Map(), head: hex(1), commits: [], moveOnce: false };
});

// ---------------------------------------------------------------- tests

describe('Access', () => {
  it('lets the admin in', async () => {
    const res = await call('/api/admin/me');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ email: ADMIN });
  });
  it('rejects missing, forged, foreign and expired tokens', async () => {
    expect((await call('/api/admin/me', { jwt: null })).status).toBe(403);
    const good = await token();
    const forged = good.slice(0, -4) + (good.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect((await call('/api/admin/me', { jwt: forged })).status).toBe(403);
    expect((await call('/api/admin/me', { jwt: await token({ email: 'someone@else.com' }) })).status).toBe(403);
    expect((await call('/api/admin/me', { jwt: await token({ aud: ['other-app'] }) })).status).toBe(403);
    expect((await call('/api/admin/me', { jwt: await token({ iss: 'https://evil.cloudflareaccess.com' }) })).status).toBe(403);
    expect((await call('/api/admin/me', { jwt: await token({ exp: Math.floor(Date.now() / 1000) - 5 }) })).status).toBe(403);
  });
  it('lets nobody in until Access is configured', async () => {
    expect((await call('/api/admin/me', {}, E({ ACCESS_AUD: '' }))).status).toBe(403);
  });
  it('refuses writes from other origins', async () => {
    const res = await call('/api/admin/publish', { method: 'POST', body: '{}', headers: { Origin: 'https://evil.example' } });
    expect(res.status).toBe(403);
  });
});

describe('stats', () => {
  it('reads explorers, badges and likes', async () => {
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare('DELETE FROM ajie_likes'),
      env.DB.prepare('DELETE FROM visitor_achievements'),
      env.DB.prepare('DELETE FROM visitors'),
      env.DB.prepare('INSERT INTO visitors VALUES (?1, ?2), (?3, ?2)').bind('a', now, 'b'),
      env.DB.prepare("INSERT INTO visitor_achievements VALUES ('a', 'deep-diver', ?1), ('b', 'deep-diver', ?1), ('a', 'researcher', ?1)").bind(now),
      env.DB.prepare("INSERT INTO ajie_likes VALUES ('2025-10-04-adoption', 'a', ?1)").bind(now),
    ]);
    const s = await (await call('/api/admin/stats')).json<{ explorers: number; badges: { id: string; n: number }[]; likes: { id: string; n: number }[]; newExplorers: { n: number }[] }>();
    expect(s.explorers).toBe(2);
    expect(s.badges[0]).toEqual({ id: 'deep-diver', n: 2 });
    expect(s.likes).toEqual([{ id: '2025-10-04-adoption', n: 1 }]);
    expect(s.newExplorers.reduce((a, d) => a + d.n, 0)).toBe(2);
  });
});

describe('content building', () => {
  const T = { en: 'New toy', 'zh-tw': '新玩具', 'zh-cn': '新玩具', ja: '新しいおもちゃ' };
  // Posts' files are in R2: uploaded with PUT /api/admin/media, so no blob SHA.
  const files = ['cover.jpg', 'img-1234.jpg', 'play.mp4', 'play-poster.jpg'].map((name) => ({ name }));
  const ajie = (post: Record<string, unknown> = {}, over: Partial<PublishInput> = {}): PublishInput => ({
    kind: 'ajie',
    id: '2025-11-02-new-toy',
    post: {
      id: '2025-11-02-new-toy',
      date: '2025-11-02',
      from: '2025-10-28',
      title: T,
      cover: { src: 'cover.jpg', alt: '插畫' },
      media: [{ type: 'image', src: 'IMG_1234.JPG' }, { type: 'video', src: 'play.mp4', loop: false }, { type: 'youtube', id: 'dQw4w9WgXcQ' }],
      caption: '今天買了逗貓棒。',
      ...post,
    },
    files,
    ...over,
  });

  it('links file names to the uploads and writes site paths', () => {
    const { post, files: out, objects } = buildPost(ajie());
    expect(post).toEqual({
      date: '2025-11-02',
      from: '2025-10-28',
      title: T,
      cover: { src: '/media/ajie/2025-11-02-new-toy-cover.jpg', alt: '插畫' },
      media: [
        { type: 'image', src: '/media/ajie/2025-11-02-new-toy-img-1234.jpg' },
        { type: 'video', src: '/media/ajie/2025-11-02-new-toy-play.mp4', loop: false, poster: '/media/ajie/2025-11-02-new-toy-play-poster.jpg' },
        { type: 'youtube', id: 'dQw4w9WgXcQ' },
      ],
      caption: '今天買了逗貓棒。',
    });
    // Everything in R2 (photos with their smaller copies), only the JSON in the commit.
    expect(objects).toContain('ajie/2025-11-02-new-toy-play.mp4');
    expect(objects).toContain('ajie/2025-11-02-new-toy-img-1234-800.jpg');
    expect(objects).toHaveLength(1 + 3 * 4);
    expect(out.map((f) => f.path)).toEqual(['src/content/ajie/2025-11-02-new-toy.json']);
  });

  it('accepts full paths of the same post', () => {
    const { post } = buildPost(ajie({ media: [{ type: 'image', src: '/media/ajie/2025-11-02-new-toy-img-1234.jpg' }, { type: 'video', src: '/media/ajie/2025-11-02-new-toy-play.mp4' }] , cover: { src: 'src/assets/ajie/2025-11-02-new-toy/cover.jpg' } }));
    expect((post.media as { src: string }[])[0].src).toBe('/media/ajie/2025-11-02-new-toy-img-1234.jpg');
    expect((post.cover as { src: string }).src).toBe('/media/ajie/2025-11-02-new-toy-cover.jpg');
  });

  it('explains every problem at once', () => {
    let msg = '';
    try {
      buildPost(ajie({ date: '2025-02-30', title: { en: 'x' }, caption: undefined, mood: 'happy', media: [{ type: 'image', src: '../x.jpg' }, { type: 'image', src: 'missing.jpg' }] }));
    } catch (e) {
      msg = (e as Error).message;
    }
    for (const part of ['date', '缺少語言', 'caption', 'mood', '只要寫檔名', 'missing.jpg', '沒用到']) expect(msg).toContain(part);
  });

  it('rejects unsafe IDs and bad file entries', () => {
    expect(() => buildPost(ajie({}, { id: '../etc' }))).toThrow(/ID/);
    expect(() => buildPost(ajie({}, { files: [{ name: '../x.jpg' }] }))).toThrow();
    expect(() => buildPost(ajie({}, { files: [{ name: 'cover.jpg', sha: hex(1) }] }))).toThrow(/檔案資料/); // posts are not in git
    expect(() => buildPost(ajie({}, { files: [{ name: 'play.mp4', sha: hex(1) }] }))).toThrow(/檔案資料/);
    expect(() => buildPost(ajie({ media: [] }, { files: [{ name: 'cover.jpg' }] }))).toThrow(/至少/);
    // A photo's smaller copies are named x-480.jpg ...: an upload may not take such a name.
    expect(() => buildPost(ajie({ media: [{ type: 'image', src: 'a.jpg' }, { type: 'image', src: 'a-800.jpg' }], cover: undefined }, { files: [{ name: 'a.jpg' }, { name: 'a-800.jpg' }] }))).toThrow(/縮圖同名/);
  });

  it('journey needs a title, a story and a category', () => {
    const base: PublishInput = { kind: 'journey', id: '2026-01-11-first-half', post: { date: '2026-01-11', category: 'run', title: '第一次半馬', story: '跑完了。', stat: '2:05:30' }, files: [] };
    expect(buildPost(base).post).toEqual({ date: '2026-01-11', category: 'run', title: '第一次半馬', story: '跑完了。', stat: '2:05:30', media: [] });
    expect(() => buildPost({ ...base, post: { ...(base.post as object), category: 'swim' } })).toThrow(/category/);
    expect(() => buildPost({ ...base, post: { date: '2026-01-11', category: 'run', story: 'x' } })).toThrow(/title/);
    expect(() => buildPost({ ...base, post: { ...(base.post as object), caption: 'x' } })).toThrow(/caption/);
    expect(buildPost({ ...base, post: { ...(base.post as object), coords: { lat: 3.1532, lng: 101.7135 } } }).post.coords).toEqual({ lat: 3.1532, lng: 101.7135 });
    expect(() => buildPost({ ...base, post: { ...(base.post as object), coords: { lat: '3.15', lng: 101.7 } } })).toThrow(/coords/);
    expect(() => buildPost({ ...base, post: { ...(base.post as object), coords: { lat: 95, lng: 0 } } })).toThrow(/coords/);
  });

  it('album: photos in the gallery folder, cover defaults to the first photo', () => {
    const base: PublishInput = {
      kind: 'album',
      id: 'taipei_night',
      post: {
        id: 'taipei_night',
        order: 6,
        emoji: '🌃',
        categories: ['city'],
        title: { en: 'Taipei at night', 'zh-tw': '台北夜景', 'zh-cn': '台北夜景', ja: '台北の夜景' },
        photos: [
          { src: 'DSC_0012.JPG', title: '象山看 101', taken: '2025-12-31', exif: { camera: 'Sony A7 III', focalLength: 24, iso: 100 } },
          { src: 'dsc-0020.jpg' },
        ],
      },
      files: [{ name: 'dsc-0012.jpg', sha: hex(1) }, { name: 'dsc-0020.jpg', sha: hex(2) }],
    };
    const { post, files: out } = buildPost(base);
    expect(post.cover).toBe('gallery/taipei_night/dsc-0012.jpg');
    expect((post.photos as { src: string }[]).map((p) => p.src)).toEqual(['gallery/taipei_night/dsc-0012.jpg', 'gallery/taipei_night/dsc-0020.jpg']);
    expect(out.map((f) => f.path)).toEqual(['src/assets/gallery/taipei_night/dsc-0012.jpg', 'src/assets/gallery/taipei_night/dsc-0020.jpg', 'src/content/albums/taipei_night.json']);
    const bad = (post: Record<string, unknown>) => () => buildPost({ ...base, post: { ...(base.post as object), ...post } });
    expect(bad({ title: '台北夜景' })).toThrow(/四種語言/);
    expect(bad({ categories: ['food'] })).toThrow(/categories/);
    expect(bad({ order: undefined })).toThrow(/order/);
    expect(bad({ photos: [{ src: 'dsc-0012.jpg', exif: { iso: '100' } }, { src: 'dsc-0020.jpg' }] })).toThrow(/exif\.iso/);
    expect(bad({ photos: [{ src: 'dsc-0012.jpg', link: 'javascript:alert(1)' }, { src: 'dsc-0020.jpg' }] })).toThrow(/link/);
  });

  it('adds the post ID to the like-able list once, sorted', () => {
    const src = "export const AJIE_POST_IDS = ['2025-10-04-adoption', '2025-10-27-the-decision'] as const;";
    const out = addAjiePostId(src, '2025-10-11-first-vet-visit');
    expect(out).toContain("['2025-10-04-adoption', '2025-10-11-first-vet-visit', '2025-10-27-the-decision']");
    expect(addAjiePostId(out, '2025-10-11-first-vet-visit')).toBe(out);
  });
});

describe('publishing', () => {
  const upload = async (b64: string) => (await call('/api/admin/blob', { method: 'POST', body: b64, headers: { Origin: SITE, 'Content-Length': String(b64.length) } })).json<{ sha: string }>();

  it('streams uploads to GitHub as blobs', async () => {
    const { sha } = await upload(btoa('fake jpeg bytes'));
    expect(gh.blobs.get(sha)).toBe('fake jpeg bytes');
  });

  const mp4 = (n = 64) => {
    const b = new Uint8Array(n);
    b.set(new TextEncoder().encode('ftypisom'), 4);
    return b;
  };
  const putClip = (q: string, body: Uint8Array, headers: Record<string, string> = {}) =>
    call(`/api/admin/media?${q}`, { method: 'PUT', body, headers: { Origin: SITE, 'Content-Length': String(body.length), ...headers } });

  it('stores clips in R2 under <kind>/<id>-<name>', async () => {
    const res = await putClip('kind=ajie&id=2025-11-02-new-toy&name=play.mp4', mp4());
    expect(res.status).toBe(200);
    expect((await res.json<{ key: string }>()).key).toBe('ajie/2025-11-02-new-toy-play.mp4');
    const obj = await env.MEDIA.get('ajie/2025-11-02-new-toy-play.mp4');
    expect(obj?.httpMetadata?.contentType).toBe('video/mp4');
    expect((await obj!.arrayBuffer()).byteLength).toBe(64);
  });

  const jpeg = (n = 64) => {
    const b = new Uint8Array(n);
    b.set([0xff, 0xd8, 0xff, 0xe0]);
    return b;
  };

  it('stores photos in R2 too, as JPEGs only', async () => {
    const res = await putClip('kind=journey&id=2026-01-11-first-half&name=finish-800.jpg', jpeg());
    expect(res.status).toBe(200);
    expect((await env.MEDIA.get('journey/2026-01-11-first-half-finish-800.jpg'))?.httpMetadata?.contentType).toBe('image/jpeg');
    expect((await putClip('kind=journey&id=ok&name=a.jpg', mp4())).status).toBe(400);
    expect((await putClip('kind=journey&id=ok&name=a.mp4', jpeg())).status).toBe(400);
    expect((await putClip('kind=album&id=ok&name=a.jpg', jpeg())).status).toBe(400); // albums stay in git
    expect((await putClip('kind=ajie&id=ok&name=a.jpg', jpeg(), { 'Content-Length': String(17 * 1024 * 1024) })).status).toBe(413);
  });

  it('refuses bad clip names, non-MP4 bodies, huge clips and live posts', async () => {
    for (const q of ['kind=ajie&id=../x&name=a.mp4', 'kind=ajie&id=ok&name=a.png', 'kind=ajie&id=ok&name=../a.mp4', 'kind=album&id=ok&name=a.mp4', 'kind=x&id=ok&name=a.mp4'])
      expect((await putClip(q, mp4())).status, q).toBe(400);
    expect((await putClip('kind=ajie&id=ok&name=a.mp4', new Uint8Array(64))).status).toBe(400);
    expect((await putClip('kind=ajie&id=ok&name=a.mp4', mp4(), { 'Content-Length': String(46 * 1024 * 1024) })).status).toBe(413);
    gh.files.set('src/content/ajie/2025-10-04-adoption.json', '{}');
    expect((await putClip('kind=ajie&id=2025-10-04-adoption&name=a.mp4', mp4())).status).toBe(409);
    expect(await env.MEDIA.head('ajie/2025-10-04-adoption-a.mp4')).toBeNull();
  });

  const putPhoto = async (kind: string, id: string, name: string) => {
    for (const n of [name, ...[480, 800, 1200].map((w) => name.replace(/\.jpg$/, `-${w}.jpg`))]) expect((await putClip(`kind=${kind}&id=${id}&name=${n}`, jpeg())).status).toBe(200);
  };

  it('publishes a clip only once it is in R2, and keeps it out of the commit', async () => {
    await putPhoto('ajie', '2025-11-03-zoomies', 'run-poster.jpg');
    const input = { kind: 'ajie', id: '2025-11-03-zoomies', post: { date: '2025-11-03', caption: '暴衝', media: [{ type: 'video', src: 'run.mp4' }] }, files: [{ name: 'run.mp4' }, { name: 'run-poster.jpg' }] };
    const send = () => call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    const early = await send();
    expect(early.status).toBe(400);
    expect((await early.json<{ error: { message: string } }>()).error.message).toContain('run.mp4');
    expect((await putClip('kind=ajie&id=2025-11-03-zoomies&name=run.mp4', mp4())).status).toBe(200);
    expect((await send()).status).toBe(200);
    const tree = gh.commits.find((c) => c.message === '(tree)')!.tree;
    expect(tree.map((t) => t.path).sort()).toEqual(['src/content/ajie/2025-11-03-zoomies.json', 'src/data/ajie-posts.ts']);
    expect(tree.find((t) => t.path.endsWith('.json'))!.content).toContain('"/media/ajie/2025-11-03-zoomies-run.mp4"');
    expect(tree.find((t) => t.path.endsWith('.json'))!.content).toContain('"/media/ajie/2025-11-03-zoomies-run-poster.jpg"');
  });

  it('rejects bodies that are not base64', async () => {
    const res = await call('/api/admin/blob', { method: 'POST', body: '{"not":"base64"}', headers: { Origin: SITE, 'Content-Length': '16' } });
    expect(res.status).toBe(400);
  });

  it('publishes a photo only once it and its smaller copies are in R2', async () => {
    const input = { kind: 'journey', id: '2026-02-01-dive', post: { date: '2026-02-01', title: '潛水', story: '下水', category: 'dive', media: [{ type: 'image', src: 'reef.jpg' }] }, files: [{ name: 'reef.jpg' }] };
    const send = () => call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    expect((await putClip('kind=journey&id=2026-02-01-dive&name=reef.jpg', jpeg())).status).toBe(200);
    const early = await send();
    expect(early.status).toBe(400);
    expect((await early.json<{ error: { message: string } }>()).error.message).toContain('reef-480.jpg');
    await putPhoto('journey', '2026-02-01-dive', 'reef.jpg');
    expect((await send()).status).toBe(200);
  });

  it('publishes one commit with the JSON and the new like-able ID', async () => {
    await putPhoto('ajie', '2025-11-02-new-toy', '01.jpg');
    const input = { kind: 'ajie', id: '2025-11-02-new-toy', post: { date: '2025-11-02', caption: '逗貓棒', media: [{ type: 'image', src: '01.jpg' }] }, files: [{ name: '01.jpg' }] };
    const res = await call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    expect(res.status).toBe(200);
    const body = await res.json<{ id: string; commit: { sha: string } }>();
    expect(body.id).toBe('2025-11-02-new-toy');
    const tree = gh.commits.find((c) => c.message === '(tree)')!.tree;
    expect(tree.map((t) => t.path).sort()).toEqual(['src/content/ajie/2025-11-02-new-toy.json', 'src/data/ajie-posts.ts']);
    expect(tree.find((t) => t.path === 'src/data/ajie-posts.ts')!.content).toContain("'2025-11-02-new-toy'");
    expect(gh.head).toBe(body.commit.sha);
  });

  it('rebuilds on the new head when main moved, and refuses duplicates', async () => {
    gh.moveOnce = true;
    const input = { kind: 'journey', id: '2026-01-11-first-half', post: { date: '2026-01-11', title: '半馬', story: '跑完了', category: 'run' }, files: [] };
    const res = await call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    expect(res.status).toBe(200);
    expect(gh.commits.filter((c) => c.message !== '(tree)')).toHaveLength(2); // first attempt lost the race
    gh.files.set('src/content/journey/2026-01-11-first-half.json', '{}');
    const dup = await call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    expect(dup.status).toBe(409);
  });

  it('reports invalid posts as 400 with a reason', async () => {
    const res = await call('/api/admin/publish', { method: 'POST', body: JSON.stringify({ kind: 'journey', id: 'x', post: { date: 'nope' }, files: [] }), headers: { Origin: SITE } });
    expect(res.status).toBe(400);
    expect((await res.json<{ error: { message: string } }>()).error.message).toMatch(/date/);
  });

  it('starts a rebuild on main', async () => {
    const res = await call('/api/admin/redeploy', { method: 'POST', headers: { Origin: SITE } });
    expect(res.status).toBe(200);
    expect(gh.dispatched).toBe('main');
  });

  it('lists deploy runs', async () => {
    const runs = await (await call('/api/admin/deploys')).json<{ runs: { status: string }[] }>();
    expect(runs.runs[0].status).toBe('in_progress');
  });
});
