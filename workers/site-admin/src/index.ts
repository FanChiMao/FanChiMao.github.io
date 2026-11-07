/**
 * 52Hz Fan admin API, behind Cloudflare Access on https://52hzfan.com/api/admin/*.
 *
 *   GET  /api/admin/me        who is signed in
 *   GET  /api/admin/stats     dashboard numbers from the stats database (read only)
 *   POST /api/admin/blob      upload one photo (body: base64 text) to GitHub, returns its blob SHA
 *   PUT  /api/admin/media     upload one clip (body: the MP4) to the R2 bucket behind media.52hzfan.com,
 *                             ?kind=ajie&id=<post id>&name=<file>.mp4
 *   POST /api/admin/publish   new Ajie post or Journey milestone: one commit on main
 *   GET  /api/admin/deploys   latest site deploy runs (GitHub Actions)
 *   POST /api/admin/redeploy  rebuild the site without a new commit
 *   /api/admin/ig/*           post a site post to Instagram (see instagram.ts)
 *
 * Every request needs a valid Access token for ADMIN_EMAIL; writes also need the site's Origin.
 */
import { verifyAccess } from './access';
import { client, GitHubError } from './github';
import { addAjiePostId, buildPost, InputError, type PublishInput } from './publish';
import { contentPath, FILE, ID, isClip, KINDS, mediaKey, type Kind } from '../../../src/lib/admin-post';
import { IgError, IgInput, instagram, type Item } from './instagram';

export interface Env {
  DB: D1Database;
  /** Clips, served publicly at https://media.52hzfan.com/<key>. */
  MEDIA: R2Bucket;
  GITHUB_TOKEN?: string;
  /** Instagram: system user token (secret) and the @ajie.archive account ID. */
  IG_TOKEN?: string;
  IG_USER_ID?: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH: string;
  ACCESS_TEAM_DOMAIN: string;
  ACCESS_AUD: string;
  ADMIN_EMAIL: string;
  /** Tests only: where the GitHub and Access-cert calls go. */
  FETCH?: typeof fetch;
}

const SITE_ORIGIN = 'https://52hzfan.com';
const MAX_BLOB_B64 = 72 * 1024 * 1024; // ~54 MB file
const MAX_JSON = 256 * 1024;
const MAX_CLIP = 45 * 1024 * 1024; // the admin page compresses clips to 40 MB at most
const BASE64 = /^[A-Za-z0-9+/]*={0,2}$/;
const TZ_OFFSET = 8 * 3600; // dashboard days in Taiwan time

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } });
const fail = (status: number, code: string, message: string) => json({ error: { code, message } }, status);

async function stats(env: Env) {
  const since = Date.now() - 30 * 86_400_000;
  const [total, perDay, badges, badgeDays, likes] = await env.DB.batch([
    env.DB.prepare('SELECT COUNT(*) AS n FROM visitors'),
    env.DB.prepare(`SELECT date(created_at / 1000 + ${TZ_OFFSET}, 'unixepoch') AS day, COUNT(*) AS n FROM visitors WHERE created_at >= ?1 GROUP BY day ORDER BY day`).bind(since),
    env.DB.prepare('SELECT achievement_id AS id, COUNT(*) AS n FROM visitor_achievements GROUP BY achievement_id ORDER BY n DESC'),
    env.DB.prepare(`SELECT date(reported_at / 1000 + ${TZ_OFFSET}, 'unixepoch') AS day, COUNT(*) AS n FROM visitor_achievements WHERE reported_at >= ?1 GROUP BY day ORDER BY day`).bind(since),
    env.DB.prepare('SELECT post_id AS id, COUNT(*) AS n FROM ajie_likes GROUP BY post_id ORDER BY n DESC'),
  ]);
  return {
    asOf: new Date().toISOString(),
    explorers: (total.results[0] as { n: number }).n,
    newExplorers: perDay.results,
    badges: badges.results,
    badgesPerDay: badgeDays.results,
    likes: likes.results,
  };
}

async function route(req: Request, env: Env): Promise<Response> {
  const fetcher = env.FETCH ?? fetch;
  const email = await verifyAccess(req, { teamDomain: env.ACCESS_TEAM_DOMAIN, aud: env.ACCESS_AUD, email: env.ADMIN_EMAIL }, fetcher);
  if (!email) return fail(403, 'FORBIDDEN', 'Sign in through Cloudflare Access with the admin account.');

  const { pathname } = new URL(req.url);
  const write = req.method !== 'GET';
  // Writes only from the admin page itself (defence in depth on top of Access).
  if (write && req.headers.get('Origin') !== SITE_ORIGIN) return fail(403, 'BAD_ORIGIN', 'Writes must come from the admin page.');

  if (pathname === '/api/admin/me' && req.method === 'GET') return json({ email });
  if (pathname === '/api/admin/stats' && req.method === 'GET') return json(await stats(env));

  if (pathname.startsWith('/api/admin/ig/')) {
    const ig = instagram({ ...env, FETCH: env.FETCH });
    if (!ig.ready) return fail(503, 'NO_IG', 'IG_TOKEN secret or IG_USER_ID var is not set.');
    const q = new URL(req.url).searchParams;
    try {
      if (pathname === '/api/admin/ig/status' && req.method === 'GET') return json(await ig.account());
      if (pathname === '/api/admin/ig/image' && req.method === 'PUT') {
        const len = Number(req.headers.get('Content-Length') ?? '');
        if (!Number.isFinite(len) || len <= 0 || len > 8 * 1024 * 1024) return fail(413, 'TOO_LARGE', 'Photo too large (8 MB at most).');
        return json({ url: await ig.stage(q.get('post') ?? '', Number(q.get('n')), new Uint8Array(await req.arrayBuffer())) });
      }
      if (pathname === '/api/admin/ig/items' && req.method === 'POST') {
        const b = (await req.json().catch(() => null)) as { post: string; items: Item[]; caption: string } | null;
        if (!b) return fail(400, 'BAD_JSON', 'Body is not JSON.');
        return json(await ig.items(b.post, b.items, b.caption));
      }
      if (pathname === '/api/admin/ig/item' && req.method === 'GET') return json(await ig.item(q.get('id') ?? ''));
      if (pathname === '/api/admin/ig/publish' && req.method === 'POST') {
        const b = (await req.json().catch(() => null)) as { post: string; ids: string[]; caption: string; again?: boolean } | null;
        if (!b) return fail(400, 'BAD_JSON', 'Body is not JSON.');
        return json(await ig.publish(b.post, b.ids, b.caption, b.again === true));
      }
    } catch (e) {
      if (e instanceof IgInput) return fail(400, 'INVALID', e.message);
      if (e instanceof IgError) return fail(502, 'INSTAGRAM', `Instagram：${e.message}`);
      throw e;
    }
    return fail(404, 'NOT_FOUND', 'Not found.');
  }

  if (!env.GITHUB_TOKEN) return fail(503, 'NO_TOKEN', 'GITHUB_TOKEN secret is not set.');
  const gh = client({ token: env.GITHUB_TOKEN, repo: env.GITHUB_REPO, branch: env.GITHUB_BRANCH }, fetcher);

  if (pathname === '/api/admin/deploys' && req.method === 'GET') return json({ runs: await gh.deployRuns(6) });

  if (pathname === '/api/admin/redeploy' && req.method === 'POST') {
    await gh.dispatchDeploy();
    return json({ ok: true });
  }

  if (pathname === '/api/admin/blob' && req.method === 'POST') {
    const len = Number(req.headers.get('Content-Length') ?? '');
    if (!Number.isFinite(len) || len <= 0 || !req.body) return fail(411, 'LENGTH_REQUIRED', 'Send the file as base64 with a Content-Length.');
    if (len > MAX_BLOB_B64) return fail(413, 'TOO_LARGE', 'File too large (about 50 MB at most).');
    // Cheap sanity check on the first bytes; GitHub rejects anything that is not valid base64.
    const [head, body] = req.body.tee();
    const peek = await head.getReader().read();
    const start = new TextDecoder().decode(peek.value?.slice(0, 64) ?? new Uint8Array());
    if (!BASE64.test(start.replace(/=+$/, ''))) return fail(400, 'BAD_BODY', 'Body must be base64.');
    const sha = await gh.blobFromStream(body, len);
    return json({ sha });
  }

  if (pathname === '/api/admin/media' && req.method === 'PUT') {
    const q = new URL(req.url).searchParams;
    const kind = q.get('kind') as Kind;
    const id = q.get('id') ?? '';
    const name = q.get('name') ?? '';
    if (!KINDS.includes(kind) || kind === 'album' || !ID.test(id) || id.length > 80 || !FILE.test(name) || !isClip(name)) return fail(400, 'BAD_NAME', 'Bad kind, id or file name.');
    const len = Number(req.headers.get('Content-Length') ?? '');
    if (!Number.isFinite(len) || len <= 0) return fail(411, 'LENGTH_REQUIRED', 'Send the clip with a Content-Length.');
    if (len > MAX_CLIP) return fail(413, 'TOO_LARGE', 'Clip too large (40 MB at most).');
    // Never replace a clip of a post that is already live.
    if (await gh.exists(contentPath(kind, id))) return fail(409, 'EXISTS', `${id} 已經存在；第一版只能新增，請換一個 ID。`);
    const bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length !== len) return fail(400, 'BAD_BODY', 'Body length does not match.');
    // An MP4 starts with a box whose type is "ftyp".
    if (String.fromCharCode(...bytes.subarray(4, 8)) !== 'ftyp') return fail(400, 'BAD_BODY', 'Body must be an MP4 file.');
    const key = mediaKey(kind, id, name);
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'video/mp4', cacheControl: 'public, max-age=604800' } });
    return json({ key });
  }

  if (pathname === '/api/admin/publish' && req.method === 'POST') {
    const text = await req.text();
    if (text.length > MAX_JSON) return fail(413, 'TOO_LARGE', 'Post data too large.');
    let input: PublishInput;
    try {
      input = JSON.parse(text);
    } catch {
      return fail(400, 'BAD_JSON', 'Body is not JSON.');
    }
    let built;
    try {
      built = buildPost(input);
    } catch (e) {
      if (e instanceof InputError) return fail(400, 'INVALID', e.message);
      throw e;
    }
    const jsonPath = built.files.at(-1)!.path;
    if (await gh.exists(jsonPath)) return fail(409, 'EXISTS', `${built.id} 已經存在；第一版只能新增，請換一個 ID。`);
    for (const key of built.clips) if (!(await env.MEDIA.head(key))) return fail(400, 'INVALID', `影片還沒上傳完成：${key.split('/').pop()}`);
    const files = [...built.files];
    if (input.kind === 'ajie') {
      const ids = await gh.readText('src/data/ajie-posts.ts');
      files.push({ path: 'src/data/ajie-posts.ts', text: addAjiePostId(ids.text, built.id) });
    }
    const label = { ajie: 'Ajie', journey: 'Journey', album: 'Gallery' }[input.kind];
    const commit = await gh.commit(`${label}: ${built.id} (published from the admin page)`, files);
    return json({ id: built.id, commit });
  }

  return fail(404, 'NOT_FOUND', 'Not found.');
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    try {
      return await route(req, env);
    } catch (err) {
      if (err instanceof GitHubError) {
        console.error('site-admin GitHub error', err.status);
        const hint = err.status === 401 || err.status === 403 ? 'Check the GITHUB_TOKEN secret and its permissions.' : 'GitHub request failed.';
        return fail(502, 'GITHUB', `${hint} (${err.status})`);
      }
      console.error('site-admin failure:', (err as Error)?.name ?? 'Error');
      return fail(500, 'INTERNAL', 'Something went wrong.');
    }
  },
} satisfies ExportedHandler<Env>;
