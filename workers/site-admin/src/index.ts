/**
 * 52Hz Fan admin API, behind Cloudflare Access on https://52hzfan.com/api/admin/*.
 *
 *   GET  /api/admin/me        who is signed in
 *   GET  /api/admin/stats     dashboard numbers from the stats database (read only)
 *   POST /api/admin/blob      upload one file (body: base64 text) to GitHub, returns its blob SHA
 *   POST /api/admin/publish   new Ajie post or Journey milestone: one commit on main
 *   GET  /api/admin/deploys   latest site deploy runs (GitHub Actions)
 *   POST /api/admin/redeploy  rebuild the site without a new commit
 *
 * Every request needs a valid Access token for ADMIN_EMAIL; writes also need the site's Origin.
 */
import { verifyAccess } from './access';
import { client, GitHubError } from './github';
import { addAjiePostId, buildPost, InputError, type PublishInput } from './publish';

export interface Env {
  DB: D1Database;
  GITHUB_TOKEN?: string;
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
    const jsonPath = `src/content/${input.kind}/${built.id}.json`;
    if (await gh.exists(jsonPath)) return fail(409, 'EXISTS', `${built.id} already exists; pick another date or slug.`);
    const files = [...built.files];
    if (input.kind === 'ajie') {
      const ids = await gh.readText('src/data/ajie-posts.ts');
      files.push({ path: 'src/data/ajie-posts.ts', text: addAjiePostId(ids.text, built.id) });
    }
    const label = input.kind === 'ajie' ? 'Ajie' : 'Journey';
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
