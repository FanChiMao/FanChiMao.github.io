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
  const files = ['cover.jpg', 'img-1234.jpg', 'play.mp4', 'play-poster.jpg'].map((name, i) => ({ name, sha: hex(i + 1) }));
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
    const { post, files: out } = buildPost(ajie());
    expect(post).toEqual({
      date: '2025-11-02',
      from: '2025-10-28',
      title: T,
      cover: { src: 'ajie/2025-11-02-new-toy/cover.jpg', alt: '插畫' },
      media: [
        { type: 'image', src: 'ajie/2025-11-02-new-toy/img-1234.jpg' },
        { type: 'video', src: '/media/ajie/2025-11-02-new-toy-play.mp4', loop: false, poster: 'ajie/2025-11-02-new-toy/play-poster.jpg' },
        { type: 'youtube', id: 'dQw4w9WgXcQ' },
      ],
      caption: '今天買了逗貓棒。',
    });
    expect(out.map((f) => f.path).sort()).toEqual([
      'public/media/ajie/2025-11-02-new-toy-play.mp4',
      'src/assets/ajie/2025-11-02-new-toy/cover.jpg',
      'src/assets/ajie/2025-11-02-new-toy/img-1234.jpg',
      'src/assets/ajie/2025-11-02-new-toy/play-poster.jpg',
      'src/content/ajie/2025-11-02-new-toy.json',
    ]);
  });

  it('accepts full paths of the same post', () => {
    const { post } = buildPost(ajie({ media: [{ type: 'image', src: 'ajie/2025-11-02-new-toy/img-1234.jpg' }, { type: 'video', src: '/media/ajie/2025-11-02-new-toy-play.mp4' }] , cover: { src: 'src/assets/ajie/2025-11-02-new-toy/cover.jpg' } }));
    expect((post.media as { src: string }[])[0].src).toBe('ajie/2025-11-02-new-toy/img-1234.jpg');
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
    expect(() => buildPost(ajie({}, { files: [{ name: '../x.jpg', sha: hex(1) }] }))).toThrow();
    expect(() => buildPost(ajie({ media: [] }, { files: [{ name: 'cover.jpg', sha: hex(1) }] }))).toThrow(/至少/);
  });

  it('journey needs a title, a story and a category', () => {
    const base: PublishInput = { kind: 'journey', id: '2026-01-11-first-half', post: { date: '2026-01-11', category: 'run', title: '第一次半馬', story: '跑完了。', stat: '2:05:30' }, files: [] };
    expect(buildPost(base).post).toEqual({ date: '2026-01-11', category: 'run', title: '第一次半馬', story: '跑完了。', stat: '2:05:30', media: [] });
    expect(() => buildPost({ ...base, post: { ...(base.post as object), category: 'swim' } })).toThrow(/category/);
    expect(() => buildPost({ ...base, post: { date: '2026-01-11', category: 'run', story: 'x' } })).toThrow(/title/);
    expect(() => buildPost({ ...base, post: { ...(base.post as object), caption: 'x' } })).toThrow(/caption/);
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

  it('rejects bodies that are not base64', async () => {
    const res = await call('/api/admin/blob', { method: 'POST', body: '{"not":"base64"}', headers: { Origin: SITE, 'Content-Length': '16' } });
    expect(res.status).toBe(400);
  });

  it('publishes one commit with the files and the new like-able ID', async () => {
    const a = await upload(btoa('photo'));
    const input = { kind: 'ajie', id: '2025-11-02-new-toy', post: { date: '2025-11-02', caption: '逗貓棒', media: [{ type: 'image', src: '01.jpg' }] }, files: [{ name: '01.jpg', sha: a.sha }] };
    const res = await call('/api/admin/publish', { method: 'POST', body: JSON.stringify(input), headers: { Origin: SITE } });
    expect(res.status).toBe(200);
    const body = await res.json<{ id: string; commit: { sha: string } }>();
    expect(body.id).toBe('2025-11-02-new-toy');
    const tree = gh.commits.find((c) => c.message === '(tree)')!.tree;
    expect(tree.map((t) => t.path).sort()).toEqual(['src/assets/ajie/2025-11-02-new-toy/01.jpg', 'src/content/ajie/2025-11-02-new-toy.json', 'src/data/ajie-posts.ts']);
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
