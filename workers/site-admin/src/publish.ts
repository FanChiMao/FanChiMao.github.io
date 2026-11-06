/**
 * Turns the admin form into the site's content files (same shape as src/content.config.ts):
 * the post JSON, its photo / clip paths, and for Ajie the like-able ID in src/data/ajie-posts.ts.
 * Paths are built here from validated names, never taken from the request.
 */

export const LOCALES = ['en', 'zh-tw', 'zh-cn', 'ja'] as const;
export type Locale = (typeof LOCALES)[number];
export type T = Partial<Record<Locale, string>>;
export const JOURNEY_CATEGORIES = ['run', 'dive', 'jump', 'hike', 'ride', 'travel', 'other'] as const;

type MediaIn =
  | { type: 'image'; file: string; alt?: T }
  | { type: 'video'; file: string; poster: string; loop?: boolean; alt?: T }
  | { type: 'youtube'; id: string; poster?: string; alt?: T };

export type PublishInput = {
  kind: 'ajie' | 'journey';
  slug: string;
  date: string;
  from?: string;
  title?: T;
  /** Ajie: caption. Journey: story. */
  text: T;
  /** Ajie: location. Journey: place. */
  place?: T;
  category?: (typeof JOURNEY_CATEGORIES)[number];
  stat?: string;
  cover?: { file: string; alt?: T };
  media: MediaIn[];
  /** Blobs already uploaded with POST /api/admin/blob. */
  files: { name: string; sha: string }[];
};

export class InputError extends Error {}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const FILE = /^[a-z0-9][a-z0-9-]{0,60}\.(jpg|jpeg|png|webp|mp4|webm)$/;
const IMAGE = /\.(jpg|jpeg|png|webp)$/;
const VIDEO = /\.(mp4|webm)$/;
const YT = /^[A-Za-z0-9_-]{6,20}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

const validDate = (s: unknown): s is string => typeof s === 'string' && DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/** All four filled: one per language. Otherwise the first filled text is used for every language. */
export function localized(v: T | undefined): string | Record<Locale, string> | undefined {
  if (!v || typeof v !== 'object') return undefined;
  const clean = Object.fromEntries(LOCALES.map((l) => [l, typeof v[l] === 'string' ? v[l]!.trim() : ''])) as Record<Locale, string>;
  if (LOCALES.every((l) => clean[l])) return clean;
  const first = (['zh-tw', 'en', 'zh-cn', 'ja'] as const).map((l) => clean[l]).find(Boolean);
  return first || undefined;
}

export function buildPost(input: PublishInput) {
  const kind = input.kind;
  if (kind !== 'ajie' && kind !== 'journey') throw new InputError('kind must be ajie or journey');
  if (typeof input.slug !== 'string' || !SLUG.test(input.slug) || input.slug.length > 60) throw new InputError('slug: lowercase letters, digits and dashes');
  if (!validDate(input.date)) throw new InputError('date must be YYYY-MM-DD');
  if (input.from !== undefined && input.from !== '' && (!validDate(input.from) || input.from > input.date)) throw new InputError('from must be a date on or before date');
  const id = `${input.date}-${input.slug}`;

  const uploaded = new Map<string, string>();
  for (const f of input.files ?? []) {
    if (typeof f?.name !== 'string' || !FILE.test(f.name) || typeof f.sha !== 'string' || !/^[0-9a-f]{40}$/.test(f.sha)) throw new InputError(`bad file entry: ${f?.name}`);
    uploaded.set(f.name, f.sha);
  }
  const used = new Set<string>();
  const need = (name: unknown, kindOf: RegExp, what: string) => {
    if (typeof name !== 'string' || !FILE.test(name) || !kindOf.test(name)) throw new InputError(`${what}: bad file name`);
    if (!uploaded.has(name)) throw new InputError(`${what}: ${name} was not uploaded`);
    used.add(name);
    return name;
  };
  const assetPath = (name: string) => `${kind}/${id}/${name}`; // relative to src/assets
  const mediaUrl = (name: string) => `/media/${kind}/${id}-${name}`; // under public/

  if (!Array.isArray(input.media)) throw new InputError('media must be a list');
  if (kind === 'ajie' && input.media.length === 0) throw new InputError('an Ajie post needs at least one photo or clip');
  const media = input.media.map((m, i) => {
    const alt = localized(m.alt);
    const extra = alt ? { alt } : {};
    if (m.type === 'image') return { type: 'image', src: assetPath(need(m.file, IMAGE, `media ${i + 1}`)), ...extra };
    if (m.type === 'video')
      return { type: 'video', src: mediaUrl(need(m.file, VIDEO, `media ${i + 1}`)), poster: assetPath(need(m.poster, IMAGE, `media ${i + 1} poster`)), ...(m.loop === false ? { loop: false } : {}), ...extra };
    if (m.type === 'youtube') {
      if (typeof m.id !== 'string' || !YT.test(m.id)) throw new InputError(`media ${i + 1}: bad YouTube id`);
      return { type: 'youtube', id: m.id, ...(m.poster ? { poster: assetPath(need(m.poster, IMAGE, `media ${i + 1} poster`)) } : {}), ...extra };
    }
    throw new InputError(`media ${i + 1}: unknown type`);
  });

  const title = localized(input.title);
  const text = localized(input.text);
  const place = localized(input.place);
  let post: Record<string, unknown>;
  if (kind === 'ajie') {
    if (!text) throw new InputError('caption is required');
    const cover = input.cover?.file ? { src: assetPath(need(input.cover.file, IMAGE, 'cover')), ...(localized(input.cover.alt) ? { alt: localized(input.cover.alt) } : {}) } : undefined;
    post = { date: input.date, ...(input.from ? { from: input.from } : {}), ...(title ? { title } : {}), ...(place ? { location: place } : {}), ...(cover ? { cover } : {}), media, caption: text };
  } else {
    if (!title) throw new InputError('title is required');
    if (!text) throw new InputError('story is required');
    if (!JOURNEY_CATEGORIES.includes(input.category as never)) throw new InputError('category is required');
    const stat = typeof input.stat === 'string' && input.stat.trim() ? input.stat.trim().slice(0, 40) : undefined;
    post = { date: input.date, category: input.category, title, ...(place ? { place } : {}), ...(stat ? { stat } : {}), media, story: text };
  }

  const unused = [...uploaded.keys()].filter((n) => !used.has(n));
  if (unused.length) throw new InputError(`uploaded but not used: ${unused.join(', ')}`);

  const files: { path: string; sha?: string; text?: string }[] = [...used].map((name) => ({
    path: VIDEO.test(name) ? `public${mediaUrl(name)}` : `src/assets/${assetPath(name)}`,
    sha: uploaded.get(name)!,
  }));
  files.push({ path: `src/content/${kind}/${id}.json`, text: `${JSON.stringify(post, null, 2)}\n` });
  return { id, post, files };
}

/** Adds the new post ID to src/data/ajie-posts.ts (the stats Worker only accepts likes on listed posts). */
export function addAjiePostId(source: string, id: string): string {
  const m = /AJIE_POST_IDS = \[([^\]]*)\] as const;/.exec(source);
  if (!m) throw new Error('AJIE_POST_IDS list not found in src/data/ajie-posts.ts');
  const ids = [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
  if (ids.includes(id)) return source;
  const list = [...ids, id].sort().map((x) => `'${x}'`).join(', ');
  return source.replace(m[0], `AJIE_POST_IDS = [${list}] as const;`);
}
