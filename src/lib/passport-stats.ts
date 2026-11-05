/**
 * Anonymous group stats for the 52Hz Logbook, and likes on Ajie's posts.
 * Talks to the stats Worker (workers/achievement-stats). Everything here is optional:
 * badges unlock locally first, and any network failure only means fewer numbers on screen.
 *
 * - Identity: 32 random bytes kept in this browser (base64url). Only the Worker sees it, and it
 *   stores just a SHA-256 digest. It is never put in a URL or logged.
 * - Only personal-world pages sync (startSync); the professional site never calls the API.
 * - Without PUBLIC_PASSPORT_STATS_API_URL, or without localStorage, nothing is registered.
 */
import { unlocked } from './passport';

const API = (import.meta.env.PUBLIC_PASSPORT_STATS_API_URL ?? '').trim().replace(/\/+$/, '');
export const statsEnabled = API !== '';

const ID_KEY = 'passport-stats:identity:v1';
const SYNC_KEY = 'passport-stats:sync:v1';
const STATS_KEY = 'passport-stats:cache:v1';
const LIKES_KEY = 'ajie-likes:v1';
const STATS_TTL = 10 * 60_000;
const LIKES_TTL = 60_000;

// ---------------------------------------------------------------- storage

let store: Storage | null | undefined;
function storage(): Storage | null {
  if (store !== undefined) return store;
  try {
    const s = window.localStorage;
    s.setItem(`${ID_KEY}:probe`, '1');
    s.removeItem(`${ID_KEY}:probe`);
    store = s;
  } catch {
    store = null;
  }
  return store;
}
const read = <T>(key: string): T | null => {
  try {
    return JSON.parse(storage()?.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
};
const write = (key: string, value: unknown) => {
  try {
    storage()?.setItem(key, JSON.stringify(value));
  } catch {
    // Quota or storage gone: keep working from memory.
  }
};

// ---------------------------------------------------------------- identity

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const VALID = /^[A-Za-z0-9_-]{43}$/;

async function readOrCreate(): Promise<string> {
  const have = storage()?.getItem(ID_KEY);
  if (have && VALID.test(have)) return have;
  const fresh = b64url(crypto.getRandomValues(new Uint8Array(32)));
  storage()!.setItem(ID_KEY, fresh);
  // Another tab may have won the race: whatever is stored now is the identity.
  return storage()!.getItem(ID_KEY) ?? fresh;
}

let identityPromise: Promise<{ secret: string; tag: string } | null> | null = null;
/** This browser's secret and a short tag binding sync state to it. Null without storage. */
function identity() {
  identityPromise ??= (async () => {
    if (!storage()) return null;
    try {
      const secret = navigator.locks ? await navigator.locks.request('passport-stats-identity', readOrCreate) : await readOrCreate();
      const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret)));
      return { secret, tag: [...digest.slice(0, 8)].map((b) => b.toString(16).padStart(2, '0')).join('') };
    } catch {
      return null;
    }
  })();
  return identityPromise;
}

// ---------------------------------------------------------------- sync

type SyncState = { tag: string; registered: boolean; acked: string[] };
const loadSync = (tag: string): SyncState => {
  const s = read<SyncState>(SYNC_KEY);
  // Confirmations belong to one identity; a new identity starts over.
  return s && s.tag === tag ? s : { tag, registered: false, acked: [] };
};

let inFlight = false;
let again = false;
let timer = 0;
let attempts = 0;
let stopped = false;

function schedule(ms: number) {
  if (stopped) return;
  clearTimeout(timer);
  timer = window.setTimeout(runSync, ms);
}

async function runSync() {
  if (inFlight) {
    again = true;
    return;
  }
  const id = await identity();
  if (!id) return;
  const state = loadSync(id.tag);
  const acked = new Set(state.acked);
  const pending = Object.keys(unlocked()).filter((x) => !acked.has(x));
  if (state.registered && pending.length === 0) return; // nothing to write
  if (!navigator.onLine) return; // retried on 'online'
  inFlight = true;
  again = false;
  try {
    const res = await fetch(`${API}/v1/passport/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${id.secret}` },
      body: JSON.stringify({ achievementIds: pending.slice(0, 64) }),
    });
    if (res.ok) {
      const body = (await res.json()) as { acknowledgedIds?: string[]; registered?: boolean };
      // Re-read: badges unlocked while this request was out are not part of this answer.
      const now = loadSync(id.tag);
      const merged = new Set([...now.acked, ...(body.acknowledgedIds ?? [])]);
      write(SYNC_KEY, { tag: id.tag, registered: now.registered || !!body.registered, acked: [...merged] });
      attempts = 0;
      if (pending.length > 64) again = true;
    } else if (res.status === 429) {
      retry(Number(res.headers.get('Retry-After')) * 1000 || 60_000);
    } else if (res.status >= 500) {
      retry();
    } else {
      stopped = true; // 4xx: a retry would fail the same way
    }
  } catch {
    retry();
  } finally {
    inFlight = false;
  }
  if (again) schedule(0);
}

/** Capped exponential backoff with jitter: at most three automatic retries per page. */
function retry(after?: number) {
  if (++attempts > 3) return;
  schedule(after ?? 2 ** attempts * 1000 + Math.random() * 1000);
}

let started = false;
/** Register this browser and report its badges. Call on personal-world pages only. */
export function startSync() {
  if (started || !statsEnabled || typeof window === 'undefined') return;
  started = true;
  schedule(300);
  // Several unlocks in a row go out as one request.
  addEventListener('passport:unlock', () => schedule(2000));
  addEventListener('online', () => {
    attempts = 0;
    schedule(0);
  });
}

// ---------------------------------------------------------------- group stats

export type BadgeStats = {
  sampleSize: number;
  minSampleSize: number;
  asOf: string;
  counts: Record<string, number>;
};
export type StatsResult = { stats: BadgeStats | null; stale: boolean; fetchedAt: number | null };

let statsMemory: { at: number; stats: BadgeStats } | null = null;
let statsPromise: Promise<StatsResult> | null = null;

/** All badge counts in one request, cached for 10 minutes (shared across tabs and languages). */
export function getStats(): Promise<StatsResult> {
  if (!statsEnabled) return Promise.resolve({ stats: null, stale: false, fetchedAt: null });
  const cached = read<{ at: number; stats: BadgeStats }>(STATS_KEY) ?? statsMemory;
  if (cached && Date.now() - cached.at < STATS_TTL) return Promise.resolve({ stats: cached.stats, stale: false, fetchedAt: cached.at });
  statsPromise ??= (async () => {
    try {
      const res = await fetch(`${API}/v1/passport/stats`);
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { sampleSize: number; minSampleSize: number; asOf: string; achievements: { id: string; unlockedCount: number }[] };
      const stats: BadgeStats = {
        sampleSize: body.sampleSize,
        minSampleSize: body.minSampleSize,
        asOf: body.asOf,
        counts: Object.fromEntries(body.achievements.map((a) => [a.id, a.unlockedCount])),
      };
      statsMemory = { at: Date.now(), stats };
      write(STATS_KEY, statsMemory);
      return { stats, stale: false, fetchedAt: statsMemory.at };
    } catch {
      // Keep showing the last good numbers, marked as stale.
      return cached ? { stats: cached.stats, stale: true, fetchedAt: cached.at } : { stats: null, stale: true, fetchedAt: null };
    } finally {
      statsPromise = null;
    }
  })();
  return statsPromise;
}

export type RateKind = 'collecting' | 'none' | 'lessThan' | 'about' | 'over' | 'all' | 'unavailable';
/** How to show one badge's rate (see docs/specs/achievement-statistics.md §4.2). */
export function rateOf(stats: BadgeStats | null, id: string): { kind: RateKind; pct?: number } {
  if (!stats) return { kind: 'unavailable' };
  const n = stats.sampleSize;
  const c = stats.counts[id];
  if (c === undefined || !Number.isFinite(n)) return { kind: 'unavailable' };
  if (n < stats.minSampleSize) return { kind: 'collecting' };
  if (c <= 0) return { kind: 'none' };
  if (c >= n) return { kind: 'all' };
  const pct = (c / n) * 100;
  if (pct < 0.1) return { kind: 'lessThan' };
  if (Math.round(pct * 10) / 10 >= 100) return { kind: 'over' };
  return { kind: 'about', pct };
}

// ---------------------------------------------------------------- Ajie likes

let likesMemory: { at: number; counts: Record<string, number> } | null = null;
let likesPromise: Promise<Record<string, number> | null> | null = null;

/** Like counts for every post (cached for a minute). Null when unavailable. */
export function getLikes(): Promise<Record<string, number> | null> {
  if (!statsEnabled) return Promise.resolve(null);
  if (likesMemory && Date.now() - likesMemory.at < LIKES_TTL) return Promise.resolve(likesMemory.counts);
  likesPromise ??= (async () => {
    try {
      const res = await fetch(`${API}/v1/ajie/likes`);
      if (!res.ok) throw new Error(String(res.status));
      const body = (await res.json()) as { counts: Record<string, number> };
      likesMemory = { at: Date.now(), counts: body.counts };
      return body.counts;
    } catch {
      return likesMemory?.counts ?? null;
    } finally {
      likesPromise = null;
    }
  })();
  return likesPromise;
}

/** Posts this browser has liked (kept locally so the heart shows filled straight away). */
export function likedPosts(): Set<string> {
  return new Set(read<string[]>(LIKES_KEY) ?? []);
}

/** Whether this browser can like at all (needs the API and storage for an identity). */
export const canLike = () => statsEnabled && typeof window !== 'undefined' && storage() !== null;

/** Like or unlike a post. Resolves to the server's new count, or null on failure. */
export async function setLike(postId: string, on: boolean): Promise<number | null> {
  const id = await identity();
  if (!id) return null;
  try {
    const res = await fetch(`${API}/v1/ajie/likes/${encodeURIComponent(postId)}`, {
      method: on ? 'PUT' : 'DELETE',
      headers: { Authorization: `Bearer ${id.secret}` },
    });
    if (!res.ok) return null;
    const body = (await res.json()) as { count: number };
    const liked = likedPosts();
    if (on) liked.add(postId);
    else liked.delete(postId);
    write(LIKES_KEY, [...liked]);
    if (likesMemory) likesMemory.counts[postId] = body.count;
    return body.count;
  } catch {
    return null;
  }
}
