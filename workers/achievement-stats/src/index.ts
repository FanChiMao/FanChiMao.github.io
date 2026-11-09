/**
 * 52Hz Fan stats API (Cloudflare Worker + D1).
 *
 *   POST   /v1/passport/sync           register this browser and report its badges (Bearer secret)
 *   GET    /v1/passport/stats          group stats: how many explorers have each badge
 *   GET    /v1/passport/rank           this browser's place among those holding the 52Hz badge (Bearer secret)
 *   GET    /v1/ajie/likes              like count per Ajie post
 *   PUT    /v1/ajie/likes/:postId      like a post (Bearer secret)
 *   DELETE /v1/ajie/likes/:postId      take the like back (Bearer secret)
 *   GET    /health
 *
 * Writes need the RATE_SALT secret; without it they answer 503 instead of rate limiting on a
 * guessable key. Likes are accepted only for the posts in src/data/ajie-posts.ts.
 *
 * Badges are earned in the browser, so a determined visitor can always fake their own. The checks
 * here keep fakes out of the shared numbers instead: a new identity must pass Cloudflare Turnstile
 * once (when TURNSTILE_SECRET is set), new identities per IP are limited, and the
 * 52Hz badge (and with it the "No. N in the world" rank) only counts for an identity at least a
 * day old that also holds nearly every other badge; otherwise it is left unacknowledged and the
 * browser offers it again on a later visit.
 *
 * The browser keeps a random installation secret; only its SHA-256 digest is stored. No IP,
 * user agent, name or location is ever written to D1 or logged.
 */
import { ACHIEVEMENT_IDS } from '../../../src/lib/achievements';
import { AJIE_POST_IDS } from '../../../src/data/ajie-posts';

export interface Env {
  DB: D1Database;
  VISITOR_LIMITER?: RateLimit;
  IP_LIMITER?: RateLimit;
  /** New identities per IP (a burst of fresh secrets is how counts get padded). */
  REGISTER_LIMITER?: RateLimit;
  /** Cloudflare Turnstile secret (Worker secret). Unset: new identities are not challenged. */
  TURNSTILE_SECRET?: string;
  /** Comma-separated frontend hostnames a Turnstile token may come from (e.g. "52hzfan.com"). */
  TURNSTILE_HOSTNAMES?: string;
  /** Tests only: where Siteverify calls go. */
  VERIFY_FETCH?: typeof fetch;
  ALLOWED_ORIGINS: string;
  RATE_SALT?: string;
}

const MIN_SAMPLE = 30;
const MAX_BODY = 8 * 1024;
const MAX_IDS = 64;
const STATS_TTL = 300; // seconds, Worker cache
const LIKES_TTL = 60;
const VALID_IDS = new Set<string>(ACHIEVEMENT_IDS);
/** Only real posts can be liked, so the table and the public counts cannot be padded with junk IDs. */
const VALID_POSTS = new Set<string>(AJIE_POST_IDS);
const POST_ID = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SECRET = /^[A-Za-z0-9_-]{43}$/; // 32 random bytes, base64url without padding
/** The badge for collecting every other one. */
const FINAL_BADGE = 'lonely-whale';
/** "Regular" alone needs three different days, so nobody earns everything faster than this. */
const FINAL_MIN_AGE = 20 * 3_600_000;
/**
 * Share of the other badges an identity must hold for its 52Hz badge to count. Not all of them:
 * someone who finished before new badges were added keeps theirs.
 */
const FINAL_MIN_SHARE = 0.75;

type ErrorCode = 'BAD_REQUEST' | 'UNAUTHORIZED' | 'CHALLENGE_FAILED' | 'NOT_FOUND' | 'TOO_LARGE' | 'RATE_LIMITED' | 'UNAVAILABLE' | 'METHOD_NOT_ALLOWED';
const STATUS: Record<ErrorCode, number> = { BAD_REQUEST: 400, UNAUTHORIZED: 401, CHALLENGE_FAILED: 403, NOT_FOUND: 404, TOO_LARGE: 413, RATE_LIMITED: 429, UNAVAILABLE: 503, METHOD_NOT_ALLOWED: 405 };

class HttpError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public headers: Record<string, string> = {},
  ) {
    super(message);
  }
}

// ---------------------------------------------------------------- helpers

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers } });

function cors(req: Request, env: Env, res: Response): Response {
  const origin = req.headers.get('Origin');
  const allowed = env.ALLOWED_ORIGINS.split(',').map((s) => s.trim());
  const out = new Response(res.body, res);
  out.headers.append('Vary', 'Origin');
  if (origin && allowed.includes(origin)) {
    out.headers.set('Access-Control-Allow-Origin', origin);
    out.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    out.headers.set('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Turnstile-Token');
    out.headers.set('Access-Control-Expose-Headers', 'Retry-After');
    out.headers.set('Access-Control-Max-Age', '86400');
  }
  return out;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function visitorHash(req: Request): Promise<string> {
  const m = /^Bearer (\S+)$/.exec(req.headers.get('Authorization') ?? '');
  if (!m || !SECRET.test(m[1])) throw new HttpError('UNAUTHORIZED', 'Missing or malformed installation secret.');
  return sha256Hex(`52hz:${m[1]}`);
}

/** Per-visitor and per-IP write limits. The IP key is a salted, hourly-rotating hash: never stored. */
async function limit(req: Request, env: Env, visitor: string, isNew = false) {
  // Without the secret salt the IP key would be guessable: refuse writes rather than weaken it.
  if (!env.RATE_SALT) {
    console.error('stats-api misconfigured: RATE_SALT is not set');
    throw new HttpError('UNAVAILABLE', 'Service unavailable.');
  }
  const ip = req.headers.get('CF-Connecting-IP') ?? 'unknown';
  const hour = Math.floor(Date.now() / 3_600_000);
  const ipKey = await sha256Hex(`${env.RATE_SALT}:${hour}:${ip}`);
  const checks = await Promise.all([env.VISITOR_LIMITER?.limit({ key: visitor }), env.IP_LIMITER?.limit({ key: ipKey }), isNew ? env.REGISTER_LIMITER?.limit({ key: ipKey }) : undefined]);
  if (checks.some((c) => c && !c.success)) throw new HttpError('RATE_LIMITED', 'Too many requests.', { 'Retry-After': '60' });
}

async function readJson(req: Request): Promise<unknown> {
  const len = Number(req.headers.get('Content-Length') ?? '0');
  if (len > MAX_BODY) throw new HttpError('TOO_LARGE', 'Body too large.');
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError('TOO_LARGE', 'Body too large.');
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError('BAD_REQUEST', 'Body is not valid JSON.');
  }
}

/** Serve from the Worker cache under a fixed key (independent of Origin and identity). */
const cacheKey = (key: string) => new Request(`https://cache.internal${key}`);
const workerCache = () => (caches as unknown as { default: Cache }).default;

/**
 * Serve from the Worker cache under a fixed key (independent of Origin and identity).
 * `ttl` is how long the Worker keeps it; browsers get `clientTtl` (0 = always revalidate here).
 */
async function cached(ctx: ExecutionContext, key: string, ttl: number, clientTtl: number, compute: () => Promise<unknown>): Promise<Response> {
  const hit = await workerCache().match(cacheKey(key));
  const browser = clientTtl > 0 ? `public, max-age=${clientTtl}` : 'no-cache';
  if (hit) {
    const out = new Response(hit.body, hit);
    out.headers.set('Cache-Control', browser);
    return out;
  }
  const body = await compute(); // throws on failure: errors are never cached
  const res = json(body, 200, { 'Cache-Control': `public, max-age=${ttl}` });
  ctx.waitUntil(workerCache().put(cacheKey(key), res.clone()));
  const out = new Response(res.body, res);
  out.headers.set('Cache-Control', browser);
  return out;
}

// ---------------------------------------------------------------- handlers

/** The Turnstile action the site uses when a browser first registers. */
export const TURNSTILE_ACTION = 'register';

/** Siteverify's answer, as far as it matters here. */
export type Siteverify = { success?: boolean; action?: string; hostname?: string };
/** A token is good when Cloudflare says so, for our action, from one of our own pages. */
export const turnstileOk = (r: Siteverify, hostnames: Set<string>) => r.success === true && r.action === TURNSTILE_ACTION && hostnames.has(r.hostname ?? '');

/**
 * A new identity proves once that a person is behind it (Cloudflare Turnstile; tokens are
 * single-use and redeemed here, never in the browser). Skipped while TURNSTILE_SECRET is unset.
 */
async function challenge(req: Request, env: Env) {
  if (!env.TURNSTILE_SECRET) return;
  const hostnames = new Set((env.TURNSTILE_HOSTNAMES ?? '').split(',').map((h) => h.trim()).filter(Boolean));
  const token = req.headers.get('X-Turnstile-Token');
  const fail = () => new HttpError('CHALLENGE_FAILED', 'Turnstile check failed.');
  if (typeof token !== 'string' || !token || token.length > 2048 || hostnames.size === 0) throw fail();
  let result: Siteverify;
  try {
    const r = await (env.VERIFY_FETCH ?? fetch)('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(10_000),
      body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: req.headers.get('CF-Connecting-IP') ?? '' }),
    });
    if (!r.ok) throw new Error(`siteverify ${r.status}`);
    result = await r.json();
  } catch {
    throw fail();
  }
  if (!turnstileOk(result, hostnames)) throw fail();
}

const createdAt = async (env: Env, visitor: string) =>
  (await env.DB.prepare('SELECT created_at AS c FROM visitors WHERE visitor_hash = ?1').bind(visitor).first<{ c: number }>())?.c ?? null;

async function sync(req: Request, env: Env) {
  const visitor = await visitorHash(req);
  const since = await createdAt(env, visitor);
  await limit(req, env, visitor, since === null);
  if (since === null) await challenge(req, env);
  const body = (await readJson(req)) as { achievementIds?: unknown };
  const ids = body.achievementIds;
  if (!Array.isArray(ids) || ids.length > MAX_IDS || ids.some((x) => typeof x !== 'string')) {
    throw new HttpError('BAD_REQUEST', 'achievementIds must be an array of at most 64 strings.');
  }
  let unique = [...new Set(ids as string[])];
  if (unique.some((id) => !VALID_IDS.has(id))) throw new HttpError('BAD_REQUEST', 'Unknown achievement id.');
  const now = Date.now();
  // The 52Hz badge counts only for a day-old identity holding nearly every other badge. Otherwise
  // it is not acknowledged (the browser offers it again later), never refused outright.
  if (unique.includes(FINAL_BADGE)) {
    const held = new Set((await env.DB.prepare('SELECT achievement_id AS id FROM visitor_achievements WHERE visitor_hash = ?1').bind(visitor).all<{ id: string }>()).results.map((r) => r.id));
    for (const id of unique) held.add(id);
    const others = ACHIEVEMENT_IDS.filter((id) => id !== FINAL_BADGE);
    const share = others.filter((id) => held.has(id)).length / others.length;
    const oldEnough = since !== null && now - since >= FINAL_MIN_AGE;
    const already = (await env.DB.prepare('SELECT 1 FROM visitor_achievements WHERE visitor_hash = ?1 AND achievement_id = ?2').bind(visitor, FINAL_BADGE).first()) !== null;
    if (!already && (!oldEnough || share < FINAL_MIN_SHARE)) unique = unique.filter((id) => id !== FINAL_BADGE);
  }
  // One atomic batch: the visitor row and every badge, all or nothing. Re-sending is harmless.
  await env.DB.batch([
    env.DB.prepare('INSERT INTO visitors (visitor_hash, created_at) VALUES (?1, ?2) ON CONFLICT DO NOTHING').bind(visitor, now),
    ...unique.map((id) =>
      env.DB.prepare('INSERT INTO visitor_achievements (visitor_hash, achievement_id, reported_at) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING').bind(visitor, id, now),
    ),
  ]);
  return json({ version: 1, acknowledgedIds: unique, registered: true }, 200, { 'Cache-Control': 'no-store' });
}

async function stats(env: Env) {
  // One statement, so the explorer count and every badge count come from the same snapshot.
  const { results } = await env.DB.prepare(
    `SELECT (SELECT COUNT(*) FROM visitors) AS n, a.achievement_id AS id, COUNT(*) AS c
       FROM visitor_achievements a GROUP BY a.achievement_id
     UNION ALL SELECT (SELECT COUNT(*) FROM visitors), NULL, 0`,
  ).all<{ n: number; id: string | null; c: number }>();
  const sampleSize = results[0]?.n ?? 0;
  const counts = new Map(results.filter((r) => r.id).map((r) => [r.id as string, r.c]));
  return {
    version: 1,
    population: 'registered_personal_visitors',
    minSampleSize: MIN_SAMPLE,
    sampleSize,
    asOf: new Date().toISOString(),
    // Only the current list; retired IDs keep their rows but are not reported.
    achievements: ACHIEVEMENT_IDS.map((id) => ({ id, unlockedCount: Math.min(counts.get(id) ?? 0, sampleSize) })),
  };
}

/**
 * Where this browser stands among everyone holding the final badge, by the time it was reported
 * (ties broken by hash). Only the asker's own place; null until its badge has been synced.
 */
async function rank(req: Request, env: Env) {
  const visitor = await visitorHash(req);
  await limit(req, env, visitor);
  const mine = await env.DB.prepare('SELECT reported_at AS t FROM visitor_achievements WHERE visitor_hash = ?1 AND achievement_id = ?2').bind(visitor, FINAL_BADGE).first<{ t: number }>();
  const total = (await env.DB.prepare('SELECT COUNT(*) AS n FROM visitor_achievements WHERE achievement_id = ?1').bind(FINAL_BADGE).first<{ n: number }>())!.n;
  let place: number | null = null;
  if (mine) {
    place = (
      await env.DB.prepare('SELECT COUNT(*) AS n FROM visitor_achievements WHERE achievement_id = ?1 AND (reported_at < ?2 OR (reported_at = ?2 AND visitor_hash <= ?3))')
        .bind(FINAL_BADGE, mine.t, visitor)
        .first<{ n: number }>()
    )!.n;
  }
  return json({ version: 1, rank: place, total }, 200, { 'Cache-Control': 'no-store' });
}

async function likeCounts(env: Env) {
  const { results } = await env.DB.prepare('SELECT post_id AS id, COUNT(*) AS c FROM ajie_likes GROUP BY post_id').all<{ id: string; c: number }>();
  return { version: 1, asOf: new Date().toISOString(), counts: Object.fromEntries(results.map((r) => [r.id, r.c])) };
}

async function like(req: Request, env: Env, ctx: ExecutionContext, postId: string, on: boolean) {
  if (!POST_ID.test(postId)) throw new HttpError('BAD_REQUEST', 'Malformed post id.');
  if (!VALID_POSTS.has(postId)) throw new HttpError('NOT_FOUND', 'Unknown post.');
  const visitor = await visitorHash(req);
  const isNew = (await createdAt(env, visitor)) === null;
  await limit(req, env, visitor, isNew);
  if (isNew) await challenge(req, env);
  const now = Date.now();
  const write = on
    ? [
        env.DB.prepare('INSERT INTO visitors (visitor_hash, created_at) VALUES (?1, ?2) ON CONFLICT DO NOTHING').bind(visitor, now),
        env.DB.prepare('INSERT INTO ajie_likes (post_id, visitor_hash, liked_at) VALUES (?1, ?2, ?3) ON CONFLICT DO NOTHING').bind(postId, visitor, now),
      ]
    : [env.DB.prepare('DELETE FROM ajie_likes WHERE post_id = ?1 AND visitor_hash = ?2').bind(postId, visitor)];
  const results = await env.DB.batch([...write, env.DB.prepare('SELECT COUNT(*) AS c FROM ajie_likes WHERE post_id = ?1').bind(postId)]);
  const count = (results.at(-1)!.results[0] as { c: number }).c;
  // The next read of the counts must include this change.
  ctx.waitUntil(workerCache().delete(cacheKey('/v1/ajie/likes')));
  return json({ version: 1, postId, liked: on, count }, 200, { 'Cache-Control': 'no-store' });
}

async function route(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const { pathname } = new URL(req.url);
  const m = req.method;
  if (pathname === '/health' && m === 'GET') {
    await env.DB.prepare('SELECT 1').first();
    return json({ ok: true }, 200, { 'Cache-Control': 'no-store' });
  }
  if (pathname === '/v1/passport/sync') {
    if (m !== 'POST') throw new HttpError('METHOD_NOT_ALLOWED', 'Use POST.');
    return sync(req, env);
  }
  if (pathname === '/v1/passport/stats') {
    if (m !== 'GET') throw new HttpError('METHOD_NOT_ALLOWED', 'Use GET.');
    return cached(ctx, '/v1/passport/stats', STATS_TTL, STATS_TTL, () => stats(env));
  }
  if (pathname === '/v1/passport/rank') {
    if (m !== 'GET') throw new HttpError('METHOD_NOT_ALLOWED', 'Use GET.');
    return rank(req, env);
  }
  if (pathname === '/v1/ajie/likes') {
    if (m !== 'GET') throw new HttpError('METHOD_NOT_ALLOWED', 'Use GET.');
    return cached(ctx, '/v1/ajie/likes', LIKES_TTL, 0, () => likeCounts(env));
  }
  const lm = /^\/v1\/ajie\/likes\/([^/]+)$/.exec(pathname);
  if (lm) {
    let postId: string;
    try {
      postId = decodeURIComponent(lm[1]);
    } catch {
      throw new HttpError('BAD_REQUEST', 'Malformed post id.'); // broken %-encoding
    }
    if (m === 'PUT') return like(req, env, ctx, postId, true);
    if (m === 'DELETE') return like(req, env, ctx, postId, false);
    throw new HttpError('METHOD_NOT_ALLOWED', 'Use PUT or DELETE.');
  }
  throw new HttpError('NOT_FOUND', 'Not found.');
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (req.method === 'OPTIONS') return cors(req, env, new Response(null, { status: 204 }));
    try {
      return cors(req, env, await route(req, env, ctx));
    } catch (err) {
      if (err instanceof HttpError) {
        return cors(req, env, json({ error: { code: err.code, message: err.message } }, STATUS[err.code], { 'Cache-Control': 'no-store', ...err.headers }));
      }
      // Never echo SQL, stacks or headers; log only the error name.
      console.error('stats-api failure:', (err as Error)?.name ?? 'Error');
      return cors(req, env, json({ error: { code: 'UNAVAILABLE', message: 'Service unavailable.' } }, 503, { 'Cache-Control': 'no-store' }));
    }
  },
} satisfies ExportedHandler<Env>;
