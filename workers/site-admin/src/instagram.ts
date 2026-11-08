/**
 * Posting a site post to Ajie's Instagram (@ajie.archive) through the Instagram Graph API, with a
 * never-expiring system user token (IG_TOKEN secret) and the account's ID (IG_USER_ID var).
 *
 * Instagram fetches the media itself, from public URLs: photos are staged as 4:5 JPEGs in the R2
 * bucket under ig/tmp/<post>/ (public at media.52hzfan.com) and removed after publishing; clips
 * are already in the bucket. The admin page drives the steps, so no request waits long:
 *   1. PUT  /api/admin/ig/image    stage one JPEG
 *   2. POST /api/admin/ig/items    create one container per photo / clip
 *   3. GET  /api/admin/ig/item     poll a container until Instagram has processed it
 *   4. POST /api/admin/ig/publish  (carousel container +) publish, remember the permalink
 *   POST /api/admin/ig/cleanup     drop the staged photos (after a cancel)
 */
import { ID } from '../../../src/lib/admin-post';

const GRAPH = 'https://graph.facebook.com/v25.0';
const MEDIA = 'https://media.52hzfan.com/';
// Carousel limit: 20 in the Instagram app since 2024; the API docs still say 10. If the API
// refuses more than 10, Instagram's own message shows when the carousel is built (nothing is posted).
const MAX_ITEMS = 20;
const MAX_CAPTION = 2200;
const MAX_IMAGE = 8 * 1024 * 1024; // Instagram's limit for photos

export type IgEnv = { IG_TOKEN?: string; IG_USER_ID?: string; MEDIA: R2Bucket; FETCH?: typeof fetch };
export type Item = { type: 'image' | 'video'; url: string };

/** A refusal from Instagram, with its own message (they are usually clear: ratio, size, format). */
export class IgError extends Error {
  constructor(
    message: string,
    readonly code?: number,
    readonly subcode?: number,
  ) {
    super(message);
  }
}
export class IgInput extends Error {}
/**
 * The carousel is still being put together on Instagram's side (big ones take a while): nothing
 * is posted yet. The admin page waits and calls publish again with the same `creation` id.
 */
export class IgNotReady extends Error {
  constructor(readonly creation: string) {
    super('Instagram 還在整理這篇，稍等一下會自動再試。');
  }
}
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
/** "Media ID is not available" / "not ready for publishing" (code 9007, subcode 2207027). */
const notReady = (e: unknown) => e instanceof IgError && (e.code === 9007 || e.subcode === 2207027 || /not (?:ready|available)|尚未準備/i.test(e.message));

const tmpPrefix = (post: string) => `ig/tmp/${post}/`;
const postedKey = (post: string) => `ig/posted/${post}.json`;
const checkPost = (post: unknown): string => {
  if (typeof post !== 'string' || !ID.test(post) || post.length > 80) throw new IgInput('Bad post id.');
  return post;
};

export function instagram(env: IgEnv) {
  const fetcher = env.FETCH ?? fetch;
  const token = env.IG_TOKEN ?? '';
  const me = env.IG_USER_ID ?? '';

  async function graph<T>(path: string, params: Record<string, string> = {}, method: 'GET' | 'POST' = 'GET'): Promise<T> {
    const q = new URLSearchParams({ ...params, access_token: token });
    const res = await fetcher(method === 'GET' ? `${GRAPH}${path}?${q}` : `${GRAPH}${path}`, method === 'GET' ? {} : { method, body: q });
    const body = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; error_user_msg?: string; code?: number; error_subcode?: number } };
    if (!res.ok || body.error) throw new IgError(body.error?.error_user_msg || body.error?.message || `Instagram ${res.status}`, body.error?.code, body.error?.error_subcode);
    return body;
  }

  const container = (item: Item, extra: Record<string, string>) =>
    graph<{ id: string }>(`/${me}/media`, item.type === 'image' ? { image_url: item.url, ...extra } : { video_url: item.url, media_type: extra.is_carousel_item ? 'VIDEO' : 'REELS', ...extra }, 'POST');

  const status = (id: string) => graph<{ status_code?: string; status?: string }>(`/${id}`, { fields: 'status_code,status' });

  return {
    ready: Boolean(token && me),

    async account() {
      const a = await graph<{ username?: string }>(`/${me}`, { fields: 'username' });
      const posted: Record<string, string> = {};
      const list = await env.MEDIA.list({ prefix: 'ig/posted/' });
      for (const o of list.objects) {
        const v = await (await env.MEDIA.get(o.key))?.json<{ permalink?: string }>();
        posted[o.key.slice('ig/posted/'.length, -'.json'.length)] = v?.permalink ?? '';
      }
      return { username: a.username ?? '', posted };
    },

    /** Stage one photo (JPEG) for Instagram to fetch. */
    async stage(post: string, n: number, bytes: Uint8Array) {
      checkPost(post);
      if (!Number.isInteger(n) || n < 0 || n >= MAX_ITEMS) throw new IgInput('Bad slide number.');
      if (bytes.length > MAX_IMAGE) throw new IgInput('Photo too large (8 MB at most).');
      if (bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[2] !== 0xff) throw new IgInput('Body must be a JPEG.');
      const key = `${tmpPrefix(post)}${n}-${crypto.randomUUID().slice(0, 8)}.jpg`;
      await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: 'image/jpeg', cacheControl: 'no-store' } });
      return `${MEDIA}${key}`;
    },

    /** One container per slide (a single slide carries the caption itself). */
    async items(post: string, items: Item[], caption: string) {
      checkPost(post);
      if (!Array.isArray(items) || !items.length || items.length > MAX_ITEMS) throw new IgInput(`1 to ${MAX_ITEMS} photos or clips.`);
      if (typeof caption !== 'string' || caption.length > MAX_CAPTION) throw new IgInput(`Caption: ${MAX_CAPTION} characters at most.`);
      for (const it of items) {
        const ok =
          (it?.type === 'image' && typeof it.url === 'string' && it.url.startsWith(`${MEDIA}${tmpPrefix(post)}`) && it.url.endsWith('.jpg')) ||
          (it?.type === 'video' && typeof it.url === 'string' && /^https:\/\/media\.52hzfan\.com\/(?:ajie|journey)\/[a-z0-9-]+\.mp4$/.test(it.url));
        if (!ok) throw new IgInput('Media must be staged photos or clips on media.52hzfan.com.');
      }
      const single = items.length === 1;
      const ids: string[] = [];
      for (const it of items) ids.push((await container(it, single ? { caption } : { is_carousel_item: 'true' })).id);
      return { ids, single };
    },

    async item(id: string) {
      if (!/^\d{5,30}$/.test(id)) throw new IgInput('Bad container id.');
      const s = await status(id);
      return { status: s.status_code ?? 'IN_PROGRESS', detail: s.status ?? '' };
    },

    async cleanup(post: string) {
      checkPost(post);
      const tmp = await env.MEDIA.list({ prefix: tmpPrefix(post) });
      if (tmp.objects.length) await env.MEDIA.delete(tmp.objects.map((o) => o.key));
      return { removed: tmp.objects.length };
    },

    /**
     * Publish: builds the carousel container (or reuses `creation` from an earlier try), waits for
     * Instagram to finish it (about 40 s here at most), then publishes. Still not ready: IgNotReady.
     */
    async publish(post: string, ids: string[], caption: string, again: boolean, reuse?: string) {
      checkPost(post);
      if (!Array.isArray(ids) || !ids.length || ids.length > MAX_ITEMS || ids.some((id) => typeof id !== 'string' || !/^\d{5,30}$/.test(id))) throw new IgInput('Bad container ids.');
      if (typeof caption !== 'string' || caption.length > MAX_CAPTION) throw new IgInput('Bad caption.');
      if (reuse !== undefined && (typeof reuse !== 'string' || !/^\d{5,30}$/.test(reuse))) throw new IgInput('Bad creation id.');
      if (!again && (await env.MEDIA.head(postedKey(post)))) throw new IgInput('這篇已經發到 IG 了。');
      let creation = reuse ?? ids[0];
      if (ids.length > 1 && !reuse) creation = (await graph<{ id: string }>(`/${me}/media`, { media_type: 'CAROUSEL', children: ids.join(','), caption }, 'POST')).id;
      for (let i = 0; ; i++) {
        const s = await status(creation);
        if (s.status_code === 'FINISHED') break;
        if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new IgError(s.status || 'Instagram could not build the carousel.');
        if (i >= 20) throw new IgNotReady(creation);
        await sleep(2000);
      }
      let id = '';
      for (let i = 0; !id; i++) {
        try {
          id = (await graph<{ id: string }>(`/${me}/media_publish`, { creation_id: creation }, 'POST')).id;
        } catch (e) {
          // "Finished" can still be a moment early for media_publish.
          if (!notReady(e)) throw e;
          if (i >= 2) throw new IgNotReady(creation);
          await sleep(4000);
        }
      }
      const { permalink = '' } = await graph<{ permalink?: string }>(`/${id}`, { fields: 'permalink' }).catch(() => ({ permalink: '' }));
      await env.MEDIA.put(postedKey(post), JSON.stringify({ id, permalink, at: new Date().toISOString() }), { httpMetadata: { contentType: 'application/json' } });
      // Instagram has its own copies now.
      const tmp = await env.MEDIA.list({ prefix: tmpPrefix(post) });
      if (tmp.objects.length) await env.MEDIA.delete(tmp.objects.map((o) => o.key));
      return { id, permalink };
    },
  };
}
