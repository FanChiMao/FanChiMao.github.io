/**
 * Turns an admin upload (post JSON + uploaded file blobs) into the files of one commit.
 * The checks and path rules live in src/lib/admin-post.ts, shared with the admin page.
 * Paths are always built from validated names, never taken from the request.
 */
import { checkPost, contentPath, FILE, inR2, isClip, mediaKey, PHOTO_WIDTHS, repoPath, variantName, type Kind } from '../../../src/lib/admin-post';

export type PublishInput = {
  kind: Kind;
  /** Post ID = JSON file name, e.g. 2025-11-02-new-toy. */
  id: string;
  /** The post, as written on the admin page. */
  post: unknown;
  /** Album photos already uploaded with POST /api/admin/blob (sha); post files with PUT /api/admin/media (no sha). */
  files: { name: string; sha?: string }[];
};

export class InputError extends Error {}

export function buildPost(input: PublishInput) {
  if (!input || typeof input !== 'object') throw new InputError('Body must be a JSON object.');
  const shas = new Map<string, string | undefined>();
  const r2 = inR2(input.kind);
  for (const f of Array.isArray(input.files) ? input.files : []) {
    const ok = typeof f?.name === 'string' && FILE.test(f.name) && (r2 ? f.sha === undefined : !isClip(f.name) && typeof f.sha === 'string' && /^[0-9a-f]{40}$/.test(f.sha));
    if (!ok) throw new InputError(`檔案資料不正確：${f?.name}`);
    shas.set(f.name, f.sha);
  }
  const { post, used, errors } = checkPost(input.kind, input.id, input.post, new Set(shas.keys()));
  const unused = [...shas.keys()].filter((n) => !used.includes(n));
  if (unused.length) errors.push(`上傳了但 JSON 沒用到：${unused.join(', ')}`);
  if (errors.length) throw new InputError(errors.join('\n'));
  const files: { path: string; sha?: string; text?: string }[] = r2 ? [] : used.map((name) => ({ path: repoPath(input.kind, input.id, name), sha: shas.get(name)! }));
  files.push({ path: contentPath(input.kind, input.id), text: `${JSON.stringify(post, null, 2)}\n` });
  /** R2 keys that must already be in the bucket: clips, photos and their smaller copies. */
  const objects = r2 ? used.flatMap((name) => (isClip(name) ? [name] : [name, ...PHOTO_WIDTHS.map((w) => variantName(name, w))])).map((name) => mediaKey(input.kind, input.id, name)) : [];
  return { id: input.id, post, files, objects };
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
