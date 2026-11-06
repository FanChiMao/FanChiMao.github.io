/**
 * Checks a post or album written as JSON on the admin page (by hand or by an agent) and links it
 * to the uploaded files. Shared by the admin page (live check while typing) and the site-admin
 * Worker (final check before committing), so both always agree. Mirrors the ajie / journey /
 * albums schemas in src/content.config.ts: a post that passes here builds.
 *
 * In the JSON, files are referenced by their name only ("img-1234.jpg", "play.mp4"); full paths
 * of this post are accepted too. The canonical paths are filled in here.
 */

export const LOCALES = ['en', 'zh-tw', 'zh-cn', 'ja'] as const;
export const JOURNEY_CATEGORIES = ['run', 'dive', 'jump', 'hike', 'ride', 'travel', 'other'] as const;
export const ALBUM_CATEGORIES = ['astro', 'drone', 'landscape', 'city', 'everyday'] as const;
export type Kind = 'album' | 'journey' | 'ajie';
export const KINDS: readonly Kind[] = ['album', 'journey', 'ajie'];
const LABEL: Record<Kind, string> = { album: '相簿', journey: '旅程', ajie: '阿桔' };

/** IDs: the JSON file name (and photo folder), e.g. 2025-11-02-new-toy or starry_sky. */
export const ID = /^[a-z0-9]+(?:[-_][a-z0-9]+)*$/;

/** Photo folder under src/assets. */
const assetDir = (kind: Kind, id: string) => (kind === 'album' ? `gallery/${id}` : `${kind}/${id}`);
/** The JSON file in the repo. */
export const contentPath = (kind: Kind, id: string) => `src/content/${kind === 'album' ? 'albums' : kind}/${id}.json`;
/** Names of uploaded files, as the admin page produces them (JPEG photos, MP4 clips). */
export const FILE = /^[a-z0-9][a-z0-9-]{0,60}\.(?:jpg|mp4)$/;

/** File name the admin page gives an upload: lowercase, dashes, .jpg (photos) or .mp4 (clips). */
export function fileName(original: string, video: boolean): string {
  const base = original
    .replace(/\.[^./]*$/, '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return `${base || 'file'}${video ? '.mp4' : '.jpg'}`;
}

/**
 * The uploaded file name a reference in the JSON points to: a bare name ("IMG_1234.JPG" ->
 * "img-1234.jpg", the same clean-up as uploads) or a full path of this post. Undefined for
 * paths elsewhere.
 */
export function refName(kind: Kind, id: string, ref: string, video: boolean): string | undefined {
  let name = ref.trim();
  for (const prefix of [`src/assets/${assetDir(kind, id)}/`, `${assetDir(kind, id)}/`, `public/media/${kind}/${id}-`, `/media/${kind}/${id}-`]) {
    if (name.startsWith(prefix)) name = name.slice(prefix.length);
  }
  if (name.includes('/')) return undefined;
  return FILE.test(name) ? name : fileName(name, video);
}

/** Poster generated for a clip: play.mp4 -> play-poster.jpg */
export const posterName = (video: string) => video.replace(/\.mp4$/, '-poster.jpg');

const KEYS: Record<Kind, string[]> = {
  ajie: ['date', 'from', 'title', 'location', 'cover', 'media', 'caption', 'pinned', 'draft'],
  journey: ['date', 'category', 'title', 'place', 'stat', 'media', 'story', 'draft'],
  album: ['order', 'emoji', 'categories', 'title', 'cover', 'photos', 'draft'],
};
const PHOTO_KEYS = ['src', 'caption', 'title', 'description', 'taken', 'exif', 'link'];
const EXIF_KEYS: Record<string, 'string' | 'number'> = { camera: 'string', lens: 'string', focalLength: 'number', aperture: 'number', shutter: 'string', iso: 'number' };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const validDate = (s: unknown): s is string =>
  typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

export type Checked = {
  /** The post as it will be committed (file references turned into site paths). */
  post: Record<string, unknown>;
  /** Uploaded file names the post uses, in order. */
  used: string[];
  /** Problems, in Traditional Chinese; empty when the post can be published. */
  errors: string[];
};

/**
 * @param uploaded names of the files uploaded with this post
 */
export function checkPost(kind: Kind, id: string, input: unknown, uploaded: ReadonlySet<string>): Checked {
  const errors: string[] = [];
  const used: string[] = [];
  const err = (m: string) => errors.push(m);
  if (!KINDS.includes(kind)) return { post: {}, used, errors: ['kind 必須是 album、journey 或 ajie'] };
  if (typeof id !== 'string' || !ID.test(id) || id.length > 80) err('ID 只能用小寫英文、數字、- 和 _（例如 2025-11-02-new-toy、taipei_night）');
  if (!isObj(input)) return { post: {}, used, errors: [...errors, 'JSON 最外層必須是一個物件 { … }'] };

  const post: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(input)) {
    if (k === 'id' || k === '$schema') continue; // the ID comes from the field / file name
    if (!KEYS[kind].includes(k)) err(`不認得的欄位「${k}」（${LABEL[kind]}可用：${KEYS[kind].join(', ')}）`);
    else post[k] = v;
  }

  const text = (key: string, v: unknown, required: boolean) => {
    if (v === undefined) return required && err(`缺少「${key}」`);
    if (typeof v === 'string') return v.trim() || err(`「${key}」是空的`);
    if (!isObj(v)) return err(`「${key}」要是文字，或 { "en", "zh-tw", "zh-cn", "ja" } 四種語言`);
    const missing = LOCALES.filter((l) => typeof v[l] !== 'string' || !(v[l] as string).trim());
    const extra = Object.keys(v).filter((l) => !(LOCALES as readonly string[]).includes(l));
    if (missing.length) err(`「${key}」缺少語言：${missing.join(', ')}（只想寫一種就直接用文字）`);
    if (extra.length) err(`「${key}」有不認得的語言：${extra.join(', ')}`);
  };
  const bool = (key: string, v: unknown) => v !== undefined && typeof v !== 'boolean' && err(`「${key}」要是 true 或 false`);

  /** A file reference -> the uploaded name (checked), or undefined. */
  const file = (where: string, ref: unknown, video: boolean): string | undefined => {
    if (typeof ref !== 'string' || !ref.trim()) return void err(`${where}：缺少檔名`);
    const name = refName(kind, id, ref, video);
    if (!name) return void err(`${where}：「${ref}」只要寫檔名，不要路徑`);
    if (!uploaded.has(name)) return void err(`${where}：找不到上傳的檔案「${name}」`);
    if (!used.includes(name)) used.push(name);
    return name;
  };
  const assetPath = (name: string) => `${assetDir(kind, id)}/${name}`; // under src/assets
  const mediaUrl = (name: string) => `/media/${kind}/${id}-${name}`; // under public/

  if (kind === 'album') {
    if (typeof post.order !== 'number' || !Number.isFinite(post.order)) err('「order」要是數字（相簿的排列順序）');
    if (typeof post.emoji !== 'string' || !post.emoji.trim() || post.emoji.length > 16) err('「emoji」要是一個表情符號，例如 "📷"');
    if (!Array.isArray(post.categories) || !post.categories.length || post.categories.some((c) => !(ALBUM_CATEGORIES as readonly unknown[]).includes(c)))
      err(`「categories」要是列表，從這些選一個以上：${ALBUM_CATEGORIES.join(', ')}`);
    if (!isObj(post.title)) err('相簿的「title」四種語言都要寫：{ "en", "zh-tw", "zh-cn", "ja" }');
    else text('title', post.title, true);
    bool('draft', post.draft);
    if (!Array.isArray(post.photos) || !post.photos.length) err('「photos」要是列表，至少一張照片');
    else
      post.photos = post.photos.map((ph: unknown, i) => {
        const where = `photos 第 ${i + 1} 張`;
        if (!isObj(ph)) return void err(`${where}：要是一個物件`);
        for (const k of Object.keys(ph)) if (!PHOTO_KEYS.includes(k)) err(`${where}：不認得的欄位「${k}」（可用：${PHOTO_KEYS.join(', ')}）`);
        const name = file(where, ph.src, false);
        if (name && !name.endsWith('.jpg')) err(`${where}：相簿只能放照片`);
        if (ph.caption !== undefined && (!Array.isArray(ph.caption) || ph.caption.some((c) => typeof c !== 'string'))) err(`${where}：caption 要是文字列表`);
        text(`${where} title`, ph.title, false);
        text(`${where} description`, ph.description, false);
        if (ph.taken !== undefined && !validDate(ph.taken)) err(`${where}：taken 要是 YYYY-MM-DD`);
        if (ph.exif !== undefined) {
          if (!isObj(ph.exif)) err(`${where}：exif 要是物件`);
          else for (const [k, v] of Object.entries(ph.exif)) if (!EXIF_KEYS[k] || typeof v !== EXIF_KEYS[k]) err(`${where}：exif.${k} 不正確`);
        }
        if (ph.link !== undefined && (typeof ph.link !== 'string' || !/^https?:\/\/\S+$/.test(ph.link))) err(`${where}：link 要是 http(s) 網址`);
        return name ? { ...ph, src: assetPath(name) } : ph;
      });
    if (post.cover === undefined) {
      const first = Array.isArray(post.photos) ? (post.photos[0] as { src?: unknown } | undefined)?.src : undefined;
      if (typeof first === 'string') post.cover = first; // the first photo
    } else {
      const name = file('cover', post.cover, false);
      if (name) post.cover = assetPath(name);
    }
    return { post, used, errors };
  }

  if (!validDate(post.date)) err('「date」要是存在的日期 YYYY-MM-DD');
  if (post.from !== undefined && (!validDate(post.from) || (validDate(post.date) && post.from > post.date))) err('「from」要是 date 當天或之前的日期 YYYY-MM-DD');
  text('title', post.title, kind === 'journey');
  bool('draft', post.draft);
  if (kind === 'ajie') {
    text('caption', post.caption, true);
    text('location', post.location, false);
    bool('pinned', post.pinned);
    if (post.cover !== undefined) {
      if (!isObj(post.cover)) err('「cover」要是 { "src": "檔名.jpg", "alt": … }');
      else {
        const name = file('cover', post.cover.src, false);
        text('cover.alt', post.cover.alt, false);
        if (name) post.cover = { ...post.cover, src: assetPath(name) };
      }
    }
  } else {
    text('story', post.story, true);
    text('place', post.place, false);
    if (!(JOURNEY_CATEGORIES as readonly unknown[]).includes(post.category)) err(`「category」要是其中一個：${JOURNEY_CATEGORIES.join(', ')}`);
    if (post.stat !== undefined && (typeof post.stat !== 'string' || post.stat.length > 40)) err('「stat」要是 40 字以內的文字');
  }

  const media = post.media ?? (kind === 'journey' ? [] : undefined);
  if (!Array.isArray(media)) err('「media」要是一個列表 [ … ]');
  else {
    if (kind === 'ajie' && media.length === 0) err('阿桔的貼文至少要有一張照片或一段影片');
    post.media = media.map((m: unknown, i) => {
      const where = `media 第 ${i + 1} 個`;
      if (!isObj(m)) return void err(`${where}：要是一個物件`);
      text(`${where} alt`, m.alt, false);
      if (m.type === 'image') {
        const name = file(where, m.src, false);
        return name ? { ...m, src: assetPath(name) } : m;
      }
      if (m.type === 'video') {
        bool(`${where} loop`, m.loop);
        const name = file(where, m.src, true);
        if (!name) return m;
        const poster = m.poster === undefined ? (uploaded.has(posterName(name)) ? file(`${where} poster`, posterName(name), false) : void err(`${where}：影片需要封面圖（poster）`)) : file(`${where} poster`, m.poster, false);
        return { ...m, src: mediaUrl(name), ...(poster ? { poster: assetPath(poster) } : {}) };
      }
      if (m.type === 'youtube') {
        if (typeof m.id !== 'string' || !/^[A-Za-z0-9_-]{6,20}$/.test(m.id)) err(`${where}：YouTube id 不正確`);
        const poster = m.poster === undefined ? undefined : file(`${where} poster`, m.poster, false);
        return poster ? { ...m, poster: assetPath(poster) } : m;
      }
      err(`${where}：type 要是 image、video 或 youtube`);
      return m;
    });
  }
  return { post, used, errors };
}

/** Where each used file goes in the repo. */
export const repoPath = (kind: Kind, id: string, name: string) => (name.endsWith('.mp4') ? `public/media/${kind}/${id}-${name}` : `src/assets/${assetDir(kind, id)}/${name}`);

/** Format notes to hand to whoever (or whichever agent) writes the JSON. */
export function formatGuide(kind: Kind, files: string[]): string {
  const list = files.length ? files.map((f) => `- ${f}`).join('\n') : '- （還沒上傳檔案）';
  const t = '{ "en": "…", "zh-tw": "…", "zh-cn": "…", "ja": "…" }';
  if (kind === 'album')
    return `請幫我整理成網站「相簿」的 JSON。

規則：
- 只輸出一個 JSON 物件。
- 相簿的 title 四種語言都要寫：${t}。
- 照片的 title / description 可以是一段文字（所有語言共用），或四種語言都寫。
- 照片只寫檔名（必須是下面已上傳的檔名），不要路徑。
- 拍攝日期與相機參數（taken、exif）會從照片自動讀出，不用寫。
- "id" 是相簿 ID / 資料夾名稱：小寫英文、數字、- 或 _，例如 "taipei_night"。

已上傳的照片（photos 請照這個順序排）：
${list}

欄位（? 為選填）：
- id
- order?：相簿排序的數字，省略就排在最後
- emoji：一個代表相簿的表情符號
- categories：從 ${ALBUM_CATEGORIES.join(' / ')} 選一個以上（星空 / 空拍 / 風景 / 城市夜景 / 日常）
- title：相簿名稱（四種語言）
- cover?：封面照片檔名，省略就用第一張
- photos：照片列表
  - { "src": "檔名.jpg", "title"?: 照片標題, "description"?: 說明, "link"?: "https://…" }
- draft?：true 先不公開

範例：
{
  "id": "taipei_night",
  "emoji": "🌃",
  "categories": ["city"],
  "title": ${t},
  "photos": [
    { "src": "dsc-0012.jpg", "title": "象山看 101" },
    { "src": "dsc-0020.jpg" }
  ]
}`;
  const common = `規則：
- 只輸出一個 JSON 物件。
- 文字欄位可以是一段文字（所有語言共用），或 ${t} 四種語言都要有。
- 檔案只寫檔名（必須是下面已上傳的檔名），不要路徑。
- 影片會自動用「檔名-poster.jpg」當封面，不用另外寫 poster。
- 日期格式 YYYY-MM-DD。
- "id" 是貼文 ID / 檔名：小寫英文、數字和 -，通常是「最後一天日期-英文代稱」。

已上傳的檔案（media 請照這個順序排；AI 封面插圖放 cover，不放 media）：
${list}`;
  if (kind === 'ajie')
    return `請幫我整理成網站「阿桔」貼文的 JSON。

${common}

欄位（? 為選填）：
- id
- date：這篇涵蓋的最後一天
- from?：期間型貼文的第一天
- title?：短標題
- location?：地點
- cover?：AI 插畫封面 { "src": "檔名.jpg", "alt"?: 說明 }
- media：照片 / 影片，至少一個，照「已上傳的檔案」的順序
  - { "type": "image", "src": "檔名.jpg", "alt"?: 說明 }
  - { "type": "video", "src": "檔名.mp4", "loop"?: true（預設，像 IG 靜音循環）| false（顯示播放鍵）, "alt"?: 說明 }
  - { "type": "youtube", "id": "YouTube 影片 ID" }
- caption：內文
- pinned?、draft?：true / false

範例：
{
  "id": "2025-11-02-new-toy",
  "date": "2025-11-02",
  "from": "2025-10-28",
  "title": ${t},
  "cover": { "src": "cover.jpg", "alt": "插畫：阿桔撲向逗貓棒" },
  "media": [
    { "type": "image", "src": "img-1234.jpg" },
    { "type": "video", "src": "play.mp4" }
  ],
  "caption": ${t}
}`;
  return `請幫我整理成網站「旅程」里程碑的 JSON。

${common}

欄位（? 為選填）：
- id
- date
- category：${JOURNEY_CATEGORIES.join(' / ')}（跑步 / 潛水 / 跳傘 / 登山 / 騎車 / 旅行 / 其他）
- title：標題
- place?：地點
- stat?：成績，例如 "2:05:30"、"18 m"
- media?：照片 / 影片，照「已上傳的檔案」的順序（格式同下），可省略
  - { "type": "image", "src": "檔名.jpg", "alt"?: 說明 }
  - { "type": "video", "src": "檔名.mp4", "loop"?: false }
  - { "type": "youtube", "id": "YouTube 影片 ID" }
- story：故事
- draft?：true / false

範例：
{
  "id": "2026-01-11-first-half-marathon",
  "date": "2026-01-11",
  "category": "run",
  "title": ${t},
  "place": "台北",
  "stat": "2:05:30",
  "media": [{ "type": "image", "src": "finish-line.jpg" }],
  "story": ${t}
}`;
}
