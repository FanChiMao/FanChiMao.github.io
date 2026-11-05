/**
 * 52Hz Logbook: the achievement engine (stamps collected around the site).
 *
 * Components only report what happened, e.g. `track('breach')` or `track('visit', 'gallery')`;
 * the rules below decide what that unlocks. Kept small and UI-free so the professional pages
 * can report events too (the toast and the passport page live in the personal world).
 *
 * State lives in localStorage. If storage is unavailable (private mode, blocked, quota), the
 * passport is simply off: track() is a no-op and nothing else on the site is affected.
 */

/** Where a badge can be earned: the professional site, the personal world, or anywhere. */
export const SCOPES = ['pro', 'personal', 'any'] as const;
export type Scope = (typeof SCOPES)[number];

export const ACHIEVEMENTS = [
  // ---- Professional site
  /** Opened three different paper abstracts. */
  { id: 'researcher', scope: 'pro', icon: 'book-open', event: 'abstract', count: 3 },
  /** Opened a patent record. */
  { id: 'inventor', scope: 'pro', icon: 'lightbulb', event: 'patent' },
  /** Opened a project's code on GitHub. */
  { id: 'source-diver', scope: 'pro', icon: 'github', event: 'github' },
  /** Dragged the thesis restoration before/after slider. */
  { id: 'restorer', scope: 'pro', icon: 'wand-sparkles', event: 'restore' },
  /** Ran the hero's detection + classification pipeline five times (start to result). */
  { id: 'inference-loop', scope: 'pro', icon: 'repeat', event: 'pipeline', count: 5 },
  /** Took the "Go Deeper?" dive into the personal world. */
  { id: 'deep-diver', scope: 'pro', icon: 'anchor', event: 'dive' },
  // ---- Personal world
  /** Saw the humpback breach. */
  { id: 'whale-watcher', scope: 'personal', icon: 'fish', event: 'breach' },
  /** Touched the whale while it was in the air. */
  { id: 'whale-whisperer', scope: 'personal', icon: 'hand', event: 'whale-touch' },
  /** Clicked a shooting star before it faded. */
  { id: 'stargazer', scope: 'personal', icon: 'sparkles', event: 'meteor' },
  /** Clicked the little boat (and the cat on board). */
  { id: 'sailor', scope: 'personal', icon: 'sailboat', event: 'boat' },
  /** Light theme: watched the boat sail across the rising sun. */
  { id: 'sunrise-sail', scope: 'personal', icon: 'sunrise', event: 'boat-sun' },
  /** Opened one of Ajie's posts. */
  { id: 'cat-person', scope: 'personal', icon: 'cat', event: 'ajie-post' },
  /** Opened one of the Journey milestones. */
  { id: 'fellow-traveller', scope: 'personal', icon: 'route', event: 'milestone' },
  /** Opened a photo album. */
  { id: 'leafing-through', scope: 'personal', icon: 'book-image', event: 'album' },
  /** Opened every chapter of the personal world. */
  { id: 'explorer', scope: 'personal', icon: 'compass', event: 'visit', need: ['gallery', 'journey', 'companion', 'achievements'] },
  /** Switched the personal hero to both sunrise and moonlit night. */
  { id: 'tide-turner', scope: 'personal', icon: 'sun-moon', event: 'scene-theme', need: ['light', 'dark'] },
  /** Visited the personal world between midnight and 4 a.m. (visitor's local time). */
  { id: 'night-owl', scope: 'personal', icon: 'moon-star', event: 'night' },
  // ---- Anywhere
  /** Read the site in all four languages. */
  { id: 'polyglot', scope: 'any', icon: 'languages', event: 'lang', need: ['en', 'zh-tw', 'zh-cn', 'ja'] },
  /** Came back on three different days (visitor's local calendar). */
  { id: 'regular', scope: 'any', icon: 'calendar-heart', event: 'day', count: 3 },
  /** Every other badge collected. Its seal reads "52Hz" instead of an icon. */
  { id: 'lonely-whale', scope: 'any', icon: '52hz' },
] as const satisfies readonly { id: string; scope: Scope; icon: string; event?: string; need?: readonly string[]; count?: number }[];

export type AchievementId = (typeof ACHIEVEMENTS)[number]['id'];

type State = {
  v: 1;
  /** Unlock time (ms since epoch) per achievement. */
  unlocked: Partial<Record<AchievementId, number>>;
  /** Unlocks the visitor has already been told about (no repeat toasts after a reload). */
  seen: Partial<Record<AchievementId, 1>>;
  /** Distinct details reported per event, e.g. visit -> ['gallery', 'journey']. */
  progress: Record<string, string[]>;
};

const KEY = 'passport:v1';
const META: AchievementId = 'lonely-whale';
const empty = (): State => ({ v: 1, unlocked: {}, seen: {}, progress: {} });

let storage: Storage | null | undefined;
function store(): Storage | null {
  if (storage !== undefined) return storage;
  try {
    const s = window.localStorage;
    s.setItem(`${KEY}:probe`, '1');
    s.removeItem(`${KEY}:probe`);
    storage = s;
  } catch {
    storage = null;
  }
  return storage;
}

function load(): State {
  const s = store();
  if (!s) return empty();
  try {
    const raw = JSON.parse(s.getItem(KEY) ?? 'null');
    return raw && raw.v === 1 ? { ...empty(), ...raw } : empty();
  } catch {
    return empty();
  }
}

function save(state: State) {
  try {
    store()?.setItem(KEY, JSON.stringify(state));
  } catch {
    // Quota or a storage that vanished mid-session: keep the in-memory state, stop persisting.
  }
}

/** Whether the passport can work in this browser. */
export const enabled = () => typeof window !== 'undefined' && store() !== null;

export const unlocked = (): Partial<Record<AchievementId, number>> => load().unlocked;

/** How far along a multi-step stamp is, e.g. explorer -> { have: 2, need: 4 }. Null for one-step stamps. */
export function progressOf(id: AchievementId): { have: number; need: number } | null {
  const a = ACHIEVEMENTS.find((x) => x.id === id);
  if (!a) return null;
  const s = load();
  if (a.id === META) {
    const others = ACHIEVEMENTS.filter((x) => x.id !== META);
    return { have: others.filter((x) => s.unlocked[x.id]).length, need: others.length };
  }
  if (!('event' in a)) return null;
  const got = s.progress[a.event] ?? [];
  if ('need' in a) return { have: a.need.filter((n) => got.includes(n)).length, need: a.need.length };
  if ('count' in a) return { have: Math.min(got.length, a.count), need: a.count };
  return null;
}

/** Unlocked but not yet announced, oldest first. */
export function unseen(): AchievementId[] {
  const s = load();
  return (Object.keys(s.unlocked) as AchievementId[]).filter((id) => !s.seen[id]).sort((a, b) => s.unlocked[a]! - s.unlocked[b]!);
}

export function markSeen(id: AchievementId) {
  const s = load();
  if (!s.unlocked[id] || s.seen[id]) return;
  s.seen[id] = 1;
  save(s);
}

export function reset() {
  try {
    store()?.removeItem(KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent('passport:change'));
}

/**
 * Report something that happened. `detail` distinguishes instances for rules that need
 * several different ones (which chapter, which language...).
 */
export function track(event: string, detail = '*') {
  if (!enabled()) return;
  const s = load();
  const seen = new Set(s.progress[event] ?? []);
  const before = seen.size;
  seen.add(detail);
  if (seen.size !== before) s.progress[event] = [...seen].slice(-50);

  const fresh: AchievementId[] = [];
  const now = Date.now();
  for (const a of ACHIEVEMENTS) {
    if (!('event' in a) || a.event !== event || s.unlocked[a.id]) continue;
    const got = s.progress[event] ?? [];
    const ok = 'need' in a ? a.need.every((n) => got.includes(n)) : 'count' in a ? got.length >= a.count : true;
    if (ok) {
      s.unlocked[a.id] = now;
      fresh.push(a.id);
    }
  }
  if (!s.unlocked[META] && ACHIEVEMENTS.every((a) => a.id === META || s.unlocked[a.id])) {
    s.unlocked[META] = now + 1;
    fresh.push(META);
  }
  if (seen.size === before && fresh.length === 0) return;
  save(s);
  for (const id of fresh) window.dispatchEvent(new CustomEvent('passport:unlock', { detail: { id } }));
  if (fresh.length) window.dispatchEvent(new CustomEvent('passport:change'));
}

/** html[lang] value -> locale code, for the polyglot stamp. */
export const LOCALE_OF: Record<string, string> = { en: 'en', 'zh-Hant-TW': 'zh-tw', 'zh-Hans-CN': 'zh-cn', ja: 'ja' };

// Another tab unlocked something: let open pages refresh.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) window.dispatchEvent(new CustomEvent('passport:change'));
  });
}
