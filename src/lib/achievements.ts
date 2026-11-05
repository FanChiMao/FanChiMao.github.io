/**
 * The badge list: pure data, the single source of achievement IDs.
 * Used by the browser engine (passport.ts) and by the stats Worker (workers/achievement-stats),
 * so it must not touch the DOM, storage or any Astro runtime.
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

/** Just the IDs, for validation (e.g. the stats API whitelist). */
export const ACHIEVEMENT_IDS: readonly AchievementId[] = ACHIEVEMENTS.map((a) => a.id);
