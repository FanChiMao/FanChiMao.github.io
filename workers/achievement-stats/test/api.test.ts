import { createExecutionContext, env, SELF, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';
import { beforeEach, describe, expect, it } from 'vitest';
import { ACHIEVEMENT_IDS } from '../../../src/lib/achievements';

const API = 'https://api.test';
const ORIGIN = 'https://52hzfan.com';

/** A fresh 32-byte base64url installation secret. */
function secret() {
  const b = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** A different documentation-range IP per request, so the per-IP limits only bite where a test means them to. */
let ipN = 0;
const ip = () => `198.51.${(++ipN >> 8) & 255}.${ipN & 255}`;

const sync = (token: string | null, ids: unknown, init: RequestInit = {}) =>
  SELF.fetch(`${API}/v1/passport/sync`, {
    method: 'POST',
    headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip(), 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: typeof ids === 'string' ? ids : JSON.stringify({ achievementIds: ids }),
    ...init,
  });

// Each request goes through the Worker cache; bust it by asking D1 directly.
async function snapshot() {
  const n = (await env.DB.prepare('SELECT COUNT(*) AS n FROM visitors').first<{ n: number }>())!.n;
  const { results } = await env.DB.prepare('SELECT achievement_id AS id, COUNT(*) AS c FROM visitor_achievements GROUP BY achievement_id').all<{ id: string; c: number }>();
  return { n, counts: Object.fromEntries(results.map((r) => [r.id, r.c])) as Record<string, number> };
}

beforeEach(async () => {
  await env.DB.batch([env.DB.prepare('DELETE FROM ajie_likes'), env.DB.prepare('DELETE FROM visitor_achievements'), env.DB.prepare('DELETE FROM visitors')]);
  await caches.default.delete(new Request('https://cache.internal/v1/passport/stats'));
  await caches.default.delete(new Request('https://cache.internal/v1/ajie/likes'));
});

describe('POST /v1/passport/sync', () => {
  it('registers the first explorer with an empty list', async () => {
    const res = await sync(secret(), []);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ version: 1, acknowledgedIds: [], registered: true });
    expect(res.headers.get('Cache-Control')).toBe('no-store');
    expect(await snapshot()).toEqual({ n: 1, counts: {} });
  });

  it('counts one explorer per secret, also for repeated and parallel requests', async () => {
    const a = secret();
    await Promise.all([sync(a, []), sync(a, []), sync(a, ['deep-diver']), sync(a, ['deep-diver'])]);
    expect(await snapshot()).toEqual({ n: 1, counts: { 'deep-diver': 1 } });
    await sync(secret(), ['deep-diver']);
    expect(await snapshot()).toEqual({ n: 2, counts: { 'deep-diver': 2 } });
  });

  it('acknowledges ids already stored, so a retry after a lost response completes', async () => {
    const a = secret();
    await sync(a, ['deep-diver', 'researcher']);
    const retry = await sync(a, ['deep-diver', 'researcher', 'deep-diver']);
    expect((await retry.json<{ acknowledgedIds: string[] }>()).acknowledgedIds).toEqual(['deep-diver', 'researcher']);
    expect((await snapshot()).counts).toEqual({ 'deep-diver': 1, researcher: 1 });
  });

  it('rejects a batch with an unknown id and writes nothing', async () => {
    const res = await sync(secret(), ['deep-diver', 'not-a-badge']);
    expect(res.status).toBe(400);
    expect((await res.json<{ error: { code: string } }>()).error.code).toBe('BAD_REQUEST');
    expect(await snapshot()).toEqual({ n: 0, counts: {} });
  });

  it('rejects malformed bodies, too many ids and oversized bodies', async () => {
    const t = secret();
    expect((await sync(t, '{oops')).status).toBe(400);
    expect((await sync(t, 'deep-diver')).status).toBe(400);
    expect((await sync(t, Array(65).fill('deep-diver'))).status).toBe(400);
    expect((await sync(t, JSON.stringify({ achievementIds: [], pad: 'x'.repeat(9000) }))).status).toBe(413);
    expect(await snapshot()).toEqual({ n: 0, counts: {} });
  });

  it('requires a well-formed installation secret', async () => {
    expect((await sync(null, [])).status).toBe(401);
    expect((await sync('short', [])).status).toBe(401);
    expect(await snapshot()).toEqual({ n: 0, counts: {} });
  });

  it('limits how many new identities one IP can register', async () => {
    const at = { 'CF-Connecting-IP': '203.0.113.77', 'Content-Type': 'application/json', Origin: ORIGIN };
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      const t = secret();
      statuses.push((await sync(t, [], { headers: { ...at, Authorization: `Bearer ${t}` } })).status);
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429]);
  });

  it('rate limits a single identity with Retry-After', async () => {
    const t = secret();
    const statuses: number[] = [];
    for (let i = 0; i < 12; i++) statuses.push((await sync(t, [], { headers: { 'CF-Connecting-IP': '203.0.113.9', Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', Origin: ORIGIN } })).status);
    expect(statuses.slice(0, 10).every((s) => s === 200)).toBe(true);
    const last = await sync(t, [], { headers: { 'CF-Connecting-IP': '203.0.113.9', Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', Origin: ORIGIN } });
    expect(last.status).toBe(429);
    expect(last.headers.get('Retry-After')).toBe('60');
    expect((await snapshot()).n).toBe(1);
  });

  it('never stores the secret itself', async () => {
    const t = secret();
    await sync(t, []);
    const row = await env.DB.prepare('SELECT visitor_hash FROM visitors').first<{ visitor_hash: string }>();
    expect(row!.visitor_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(row!.visitor_hash).not.toContain(t);
  });
});

describe('GET /v1/passport/stats', () => {
  it('reports every current badge with a consistent sample size', async () => {
    const a = secret();
    const b = secret();
    await sync(a, ['deep-diver', 'researcher']);
    await sync(b, ['deep-diver']);
    const res = await SELF.fetch(`${API}/v1/passport/stats`, { headers: { Origin: ORIGIN } });
    expect(res.status).toBe(200);
    const body = await res.json<{ sampleSize: number; minSampleSize: number; achievements: { id: string; unlockedCount: number }[]; asOf: string }>();
    expect(body.sampleSize).toBe(2);
    expect(body.minSampleSize).toBe(30);
    expect(body.achievements.map((x) => x.id)).toEqual([...ACHIEVEMENT_IDS]);
    const get = (id: string) => body.achievements.find((x) => x.id === id)!.unlockedCount;
    expect(get('deep-diver')).toBe(2);
    expect(get('researcher')).toBe(1);
    expect(get('stargazer')).toBe(0);
    expect(body.achievements.every((x) => x.unlockedCount <= body.sampleSize)).toBe(true);
    expect(Number.isNaN(Date.parse(body.asOf))).toBe(false);
  });

  it('works with no explorers at all', async () => {
    const body = await (await SELF.fetch(`${API}/v1/passport/stats`)).json<{ sampleSize: number; achievements: { unlockedCount: number }[] }>();
    expect(body.sampleSize).toBe(0);
    expect(body.achievements.every((x) => x.unlockedCount === 0)).toBe(true);
  });

  it('exposes no identities', async () => {
    await sync(secret(), ['deep-diver']);
    const text = await (await SELF.fetch(`${API}/v1/passport/stats`)).text();
    expect(text).not.toMatch(/[0-9a-f]{64}/);
  });
});

/** SHA-256 hex of the stored form of a secret (as the Worker does). */
async function hashOf(token: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`52hz:${token}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** Make an identity look registered `hours` ago. */
async function age(token: string, hours: number) {
  await env.DB.prepare('UPDATE visitors SET created_at = ?1 WHERE visitor_hash = ?2').bind(Date.now() - hours * 3_600_000, await hashOf(token)).run();
}
const everyOther = ACHIEVEMENT_IDS.filter((id) => id !== 'lonely-whale');

describe('Turnstile for new identities', () => {
  /** Calls the Worker directly with a Turnstile secret and a fake Siteverify. */
  const call = async (token: string, turnstile: string | null, verdict: object) => {
    const ctx = createExecutionContext();
    const req = new Request(`${API}/v1/passport/sync`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip(), 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(turnstile ? { 'X-Turnstile-Token': turnstile } : {}) },
      body: JSON.stringify({ achievementIds: [] }),
    });
    const verify = (async () => new Response(JSON.stringify(verdict))) as typeof fetch;
    const res = await worker.fetch(req, { ...env, TURNSTILE_SECRET: 's', TURNSTILE_HOSTNAMES: '52hzfan.com', VERIFY_FETCH: verify }, ctx);
    await waitOnExecutionContext(ctx);
    return res;
  };
  const good = { success: true, action: 'register', hostname: '52hzfan.com' };

  it('lets a new identity in only with a good token, for our action and our site', async () => {
    expect((await call(secret(), null, good)).status).toBe(403);
    expect((await call(secret(), 'tok', { ...good, success: false })).status).toBe(403);
    expect((await call(secret(), 'tok', { ...good, action: 'login' })).status).toBe(403);
    expect((await call(secret(), 'tok', { ...good, hostname: 'evil.example' })).status).toBe(403);
    expect((await snapshot()).n).toBe(0);
    expect((await call(secret(), 'tok', good)).status).toBe(200);
    expect((await snapshot()).n).toBe(1);
  });

  it('does not ask an identity it already knows', async () => {
    const a = secret();
    await call(a, 'tok', good);
    expect((await call(a, null, good)).status).toBe(200);
  });
});

describe('the 52Hz badge only counts when it is plausible', () => {
  it('is left unacknowledged for a brand-new identity, or one missing most badges', async () => {
    const a = secret();
    const fresh = await sync(a, [...everyOther, 'lonely-whale']);
    expect((await fresh.json<{ acknowledgedIds: string[] }>()).acknowledgedIds).not.toContain('lonely-whale');
    expect((await snapshot()).counts['lonely-whale']).toBeUndefined();
    const b = secret();
    await sync(b, ['deep-diver']);
    await age(b, 30);
    const thin = await sync(b, ['researcher', 'lonely-whale']);
    expect((await thin.json<{ acknowledgedIds: string[] }>()).acknowledgedIds).toEqual(['researcher']);
  });

  it('counts for a day-old identity holding (nearly) every other badge, offered again later', async () => {
    const a = secret();
    await sync(a, everyOther);
    await age(a, 30);
    const later = await sync(a, ['lonely-whale']);
    expect((await later.json<{ acknowledgedIds: string[] }>()).acknowledgedIds).toEqual(['lonely-whale']);
    expect((await snapshot()).counts['lonely-whale']).toBe(1);
  });
});

describe('GET /v1/passport/rank', () => {
  const rank = (token: string | null) => SELF.fetch(`${API}/v1/passport/rank`, { headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip(), ...(token ? { Authorization: `Bearer ${token}` } : {}) } });
  /** A day-old identity with every other badge, then the 52Hz one. */
  const whale = async (token: string) => {
    await sync(token, everyOther);
    await age(token, 30);
    await sync(token, ['lonely-whale']);
  };

  it("gives each holder of the 52Hz badge their own place, in the order they reached it", async () => {
    const a = secret();
    const b = secret();
    const c = secret();
    await whale(a);
    await new Promise((r) => setTimeout(r, 5));
    await whale(b);
    await sync(c, ['deep-diver']);
    expect(await (await rank(a)).json()).toMatchObject({ rank: 1, total: 2 });
    expect(await (await rank(b)).json()).toMatchObject({ rank: 2, total: 2 });
    expect(await (await rank(c)).json()).toMatchObject({ rank: null, total: 2 });
  });

  it('needs the installation secret', async () => {
    expect((await rank(null)).status).toBe(401);
  });
});

describe('Ajie likes', () => {
  const like = (token: string, post: string, method: 'PUT' | 'DELETE' = 'PUT') =>
    SELF.fetch(`${API}/v1/ajie/likes/${post}`, { method, headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip(), Authorization: `Bearer ${token}` } });

  it('counts one like per visitor and allows taking it back', async () => {
    const a = secret();
    const b = secret();
    expect((await (await like(a, '2025-10-04-adoption')).json<{ count: number }>()).count).toBe(1);
    expect((await (await like(a, '2025-10-04-adoption')).json<{ count: number }>()).count).toBe(1);
    expect((await (await like(b, '2025-10-04-adoption')).json<{ count: number }>()).count).toBe(2);
    expect((await (await like(a, '2025-10-04-adoption', 'DELETE')).json<{ count: number }>()).count).toBe(1);
    const all = await (await SELF.fetch(`${API}/v1/ajie/likes`)).json<{ counts: Record<string, number> }>();
    expect(all.counts).toEqual({ '2025-10-04-adoption': 1 });
    // A like after the counts were read (and cached) shows up on the next read.
    await like(b, '2025-10-04-adoption', 'DELETE');
    await new Promise((r) => setTimeout(r, 50));
    const again = await (await SELF.fetch(`${API}/v1/ajie/likes`)).json<{ counts: Record<string, number> }>();
    expect(again.counts).toEqual({});
  });

  it('rejects malformed post ids and missing secrets', async () => {
    expect((await like(secret(), 'Bad_ID!')).status).toBe(400);
    const res = await SELF.fetch(`${API}/v1/ajie/likes/2025-10-04-adoption`, { method: 'PUT' });
    expect(res.status).toBe(401);
  });

  it('only accepts likes on real posts, so the public counts cannot be padded', async () => {
    const res = await like(secret(), 'this-post-does-not-exist');
    expect(res.status).toBe(404);
    expect((await res.json<{ error: { code: string } }>()).error.code).toBe('NOT_FOUND');
    const stored = await env.DB.prepare('SELECT COUNT(*) AS c FROM ajie_likes').first<{ c: number }>();
    expect(stored!.c).toBe(0);
  });

  it('answers 400, not 503, to broken percent-encoding', async () => {
    const res = await like(secret(), '%E0%A4%A');
    expect(res.status).toBe(400);
    expect((await res.json<{ error: { code: string } }>()).error.code).toBe('BAD_REQUEST');
  });
});

describe('configuration', () => {
  it('refuses writes when RATE_SALT is missing instead of hashing IPs with a guessable salt', async () => {
    const ctx = createExecutionContext();
    const req = new Request(`${API}/v1/passport/sync`, {
      method: 'POST',
      headers: { Origin: ORIGIN, 'CF-Connecting-IP': ip(), 'Content-Type': 'application/json', Authorization: `Bearer ${secret()}` },
      body: JSON.stringify({ achievementIds: [] }),
    });
    const res = await worker.fetch(req, { ...env, RATE_SALT: undefined } as typeof env, ctx);
    await waitOnExecutionContext(ctx);
    expect(res.status).toBe(503);
    expect((await snapshot()).n).toBe(0); // nothing written
  });
});

describe('CORS and errors', () => {
  it('allows the site origin and answers preflight', async () => {
    const res = await SELF.fetch(`${API}/v1/passport/sync`, { method: 'OPTIONS', headers: { Origin: ORIGIN, 'Access-Control-Request-Method': 'POST' } });
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('does not allow other origins', async () => {
    const res = await SELF.fetch(`${API}/v1/passport/stats`, { headers: { Origin: 'https://evil.example' } });
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('uses the shared error shape and never leaks details', async () => {
    const res = await SELF.fetch(`${API}/nope`);
    expect(res.status).toBe(404);
    const body = await res.json<{ error: { code: string; message: string } }>();
    expect(body.error.code).toBe('NOT_FOUND');
  });

  it('health check reaches D1', async () => {
    expect(await (await SELF.fetch(`${API}/health`)).json()).toEqual({ ok: true });
  });
});
