import { env } from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
import { IgError, IgInput, instagram } from '../src/instagram';

// A fake Graph API: records calls, hands out container ids, finishes them at once.
type Call = { method: string; path: string; params: Record<string, string> };
let calls: Call[];
let refuse: string | null;
let notReady: number;
/** media_publish posts it but answers with an error (as Instagram sometimes does). */
let postsButFails: boolean;
const published = new Set<string>();
const graph: typeof fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' ? input : (input as Request).url);
  const method = init?.method ?? 'GET';
  const params = Object.fromEntries(method === 'GET' ? url.searchParams : new URLSearchParams(String(init!.body)));
  const path = url.pathname.replace('/v25.0', '');
  calls.push({ method, path, params });
  const ok = (b: unknown) => new Response(JSON.stringify(b));
  if (refuse && path.endsWith('/media')) return new Response(JSON.stringify({ error: { message: refuse } }), { status: 400 });
  if (path === '/1784' && method === 'GET') return ok({ username: 'ajie.archive' });
  if (path === '/1784/media' && method === 'GET') return ok({ data: [{ id: '88888', permalink: 'https://www.instagram.com/p/newest/' }] });
  if (path === '/1784/media') return ok({ id: String(90000 + calls.length) });
  if (path === '/1784/media_publish' && postsButFails) {
    published.add(params.creation_id);
    return new Response(JSON.stringify({ error: { message: '為了保護社群安全，我們會限制特定活動', code: 4 } }), { status: 400 });
  }
  if (path === '/1784/media_publish' && notReady > 0) {
    notReady--;
    return new Response(JSON.stringify({ error: { message: 'Media ID is not available', code: 9007, error_subcode: 2207027 } }), { status: 400 });
  }
  if (path === '/1784/media_publish') return ok({ id: '77777' });
  if (path === '/77777') return ok({ permalink: 'https://www.instagram.com/p/abc/' });
  if (/^\/\d+$/.test(path)) return ok({ status_code: published.has(path.slice(1)) ? 'PUBLISHED' : 'FINISHED' });
  return new Response('{}', { status: 404 });
};
const ig = () => instagram({ IG_TOKEN: 'tok', IG_USER_ID: '1784', MEDIA: env.MEDIA, FETCH: graph });
const jpeg = () => new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

beforeEach(() => {
  calls = [];
  refuse = null;
  notReady = 0;
  postsButFails = false;
  published.clear();
});

describe('instagram', () => {
  it('is not ready without the token and the account id', () => {
    expect(instagram({ MEDIA: env.MEDIA }).ready).toBe(false);
    expect(ig().ready).toBe(true);
  });

  it('stages JPEGs only, under ig/tmp/<post>/', async () => {
    const url = await ig().stage('2025-11-19-back-to-normal', 0, jpeg());
    expect(url).toMatch(/^https:\/\/media\.52hzfan\.com\/ig\/tmp\/2025-11-19-back-to-normal\/0-[0-9a-f]{8}\.jpg$/);
    await expect(ig().stage('2025-11-19-back-to-normal', 0, new Uint8Array([1, 2, 3, 4]))).rejects.toThrow(IgInput);
    await expect(ig().stage('../x', 0, jpeg())).rejects.toThrow(IgInput);
    await expect(ig().stage('ok', 20, jpeg())).rejects.toThrow(IgInput);
  });

  it('refuses media from anywhere else', async () => {
    await expect(ig().items('p1', [{ type: 'image', url: 'https://evil.example/x.jpg' }], '')).rejects.toThrow(IgInput);
    await expect(ig().items('p1', [{ type: 'image', url: 'https://media.52hzfan.com/ig/tmp/other/0.jpg' }], '')).rejects.toThrow(IgInput);
    await expect(ig().items('p1', [{ type: 'video', url: 'https://media.52hzfan.com/ig/tmp/p1/x.mp4' }], '')).rejects.toThrow(IgInput);
    await expect(ig().items('p1', [], '')).rejects.toThrow(IgInput);
    await expect(ig().items('p1', [{ type: 'image', url: 'https://media.52hzfan.com/ig/tmp/p1/0.jpg' }], 'x'.repeat(2201))).rejects.toThrow(IgInput);
  });

  it('single photo: one container with the caption; clips alone are Reels', async () => {
    const r = await ig().items('p1', [{ type: 'image', url: 'https://media.52hzfan.com/ig/tmp/p1/0-aa.jpg' }], '阿桔');
    expect(r.single).toBe(true);
    expect(calls[0].params).toMatchObject({ image_url: 'https://media.52hzfan.com/ig/tmp/p1/0-aa.jpg', caption: '阿桔', access_token: 'tok' });
    calls = [];
    await ig().items('p1', [{ type: 'video', url: 'https://media.52hzfan.com/ajie/p1-a.mp4' }], 'x');
    expect(calls[0].params).toMatchObject({ media_type: 'REELS', video_url: 'https://media.52hzfan.com/ajie/p1-a.mp4' });
  });

  it('carousel: child containers, then the carousel, publish, permalink kept, staged photos removed', async () => {
    const a = await ig().stage('p2', 0, jpeg());
    const b = await ig().stage('p2', 1, jpeg());
    const { ids } = await ig().items('p2', [{ type: 'image', url: a }, { type: 'image', url: b }, { type: 'video', url: 'https://media.52hzfan.com/ajie/p2-c.mp4' }], '文案');
    expect(ids).toHaveLength(3);
    expect(calls.filter((c) => c.path === '/1784/media').map((c) => c.params.is_carousel_item)).toEqual(['true', 'true', 'true']);
    expect(calls[2].params.media_type).toBe('VIDEO');
    const res = await ig().publish('p2', ids, '文案', false);
    expect(res.permalink).toBe('https://www.instagram.com/p/abc/');
    const carousel = calls.find((c) => c.params.media_type === 'CAROUSEL')!;
    expect(carousel.params).toMatchObject({ children: ids.join(','), caption: '文案' });
    expect((await env.MEDIA.list({ prefix: 'ig/tmp/p2/' })).objects).toHaveLength(0);
    expect((await ig().account()).posted.p2).toBe('https://www.instagram.com/p/abc/');
    await expect(ig().publish('p2', ids, '文案', false)).rejects.toThrow(/已經發到 IG/);
    await expect(ig().publish('p2', ids, '文案', true)).resolves.toBeTruthy();
  });

  it('waits when Instagram says the carousel is not ready yet, and can reuse a carousel', async () => {
    notReady = 1;
    const res = await ig().publish('p5', ['11111', '22222'], 'x', false);
    expect(res.permalink).toBe('https://www.instagram.com/p/abc/');
    expect(calls.filter((c) => c.path === '/1784/media_publish')).toHaveLength(2);
    calls = [];
    await ig().publish('p6', ['11111', '22222'], 'x', false, '33333');
    expect(calls.some((c) => c.params.media_type === 'CAROUSEL')).toBe(false); // reused, not built again
    expect(calls.find((c) => c.path === '/1784/media_publish')!.params.creation_id).toBe('33333');
    await expect(ig().publish('p7', ['11111'], 'x', false, '../x')).rejects.toThrow(IgInput);
  }, 15000);

  it('counts a post that went out despite an error from Instagram as done (no second post)', async () => {
    postsButFails = true;
    const res = await ig().publish('p8', ['11111', '22222'], 'x', false);
    expect(res.permalink).toBe('https://www.instagram.com/p/newest/');
    expect(calls.filter((c) => c.path === '/1784/media_publish')).toHaveLength(1);
    expect((await ig().account()).posted.p8).toBe('https://www.instagram.com/p/newest/');
    // A later try with the same carousel finds it published and does not post again.
    calls = [];
    const creation = [...published][0];
    await ig().publish('p9', ['11111', '22222'], 'x', false, creation);
    expect(calls.some((c) => c.path === '/1784/media_publish')).toBe(false);
  }, 15000);

  it('cleans up staged photos after a cancel', async () => {
    await ig().stage('p4', 0, jpeg());
    await ig().stage('p4', 1, jpeg());
    expect((await ig().cleanup('p4')).removed).toBe(2);
    expect((await env.MEDIA.list({ prefix: 'ig/tmp/p4/' })).objects).toHaveLength(0);
    await expect(ig().cleanup('../x')).rejects.toThrow(IgInput);
  });

  it("passes Instagram's own reason on", async () => {
    refuse = 'The aspect ratio is not supported.';
    await expect(ig().items('p3', [{ type: 'image', url: 'https://media.52hzfan.com/ig/tmp/p3/0.jpg' }], '')).rejects.toThrow(new IgError('The aspect ratio is not supported.'));
  });
});
