# 52hzfan.com

Personal website of Chi-Mao Fan (范植貿), built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev       # http://localhost:4321
npm run build     # static output in dist/
npm run preview   # serve dist/
npm run check     # type-check .astro / .ts files
```

Requires Node 24 (see `.nvmrc`).

## Where things live

| What | Where |
| --- | --- |
| UI text in all 4 languages (nav, headings, hero, about, buttons…) | `src/i18n/ui.ts` |
| Email, phone, résumé link, social links, focus areas, core stack, visitor map (MapMyVisitors) | `src/lib/site.ts` |
| Work experience, incl. per-product periods | `src/content/experience/*.json` |
| Patents (link to the verified Google Patents page) | `src/content/patents/*.json` |
| Competitions | `src/content/competitions/*.json` + images in `src/assets/competitions/<id>/` |
| Publications | `src/content/publications/*.json` + previews in `public/media/papers/` |
| Education | `src/content/education/*.json` |
| Before/after restoration slider (Publications) | `src/components/RestorationDemo.astro` + image pairs in `src/assets/restoration/` |
| GitHub star counts (fetched at build; hidden if the API fails) | `src/lib/github.ts` |
| Social preview images (1200x630, one per language) | `public/og/*.png`, regenerate with `npx -y -p puppeteer-core node scripts/og.mjs` |
| Structured data (schema.org Person, WebSite, ScholarlyArticle) | `src/components/StructuredData.astro` |
| Google Search Console ownership file (**do not delete**, verification depends on it) | `public/googlea75f55073ef5610a.html` |
| Photo albums | `src/content/albums/*.json` + photos in `src/assets/gallery/<album>/` |
| Standalone apps (not processed by Astro) | `public/playground/` |
| Content schema (validated at build time) | `src/content.config.ts` |

Every translatable field is an object with `en`, `zh-tw`, `zh-cn` and `ja` keys — the build fails if one is missing.

### Add a competition

1. Put the photos in `src/assets/competitions/my-comp-2025/` (any size; Astro generates responsive WebP).
2. Create `src/content/competitions/my-comp-2025.json`:

```json
{
  "order": -1,
  "year": 2025,
  "title": { "en": "…", "zh-tw": "…", "zh-cn": "…", "ja": "…" },
  "description": { "en": "…", "zh-tw": "…", "zh-cn": "…", "ja": "…" },
  "achievement": { "en": "Team result: …", "zh-tw": "團隊成果：…", "zh-cn": "…", "ja": "…" },
  "repo": "https://github.com/FanChiMao/…",
  "images": ["competitions/my-comp-2025/1.webp", "competitions/my-comp-2025/2.webp"]
}
```

Lower `order` shows first. The first 4 cards are shown; the rest sit behind "Load more".

### Add photos to an album

1. Drop the photos into `src/assets/gallery/<album>/` (a new folder makes a new album).
2. Run `npm run photos`. It
   - removes GPS location from each photo **losslessly** (only the metadata is rewritten, the image data is untouched),
   - appends new photos to `src/content/albums/<album>.json` with the date taken and camera settings (shown in the lightbox),
   - creates a draft album JSON for a new folder (fill in `title`, `emoji`, `categories`, then remove `draft`).
3. Add a caption, `title` or `description` by hand if you like; the script never overwrites them.
   `npm run photos -- --refresh` re-reads date and EXIF for photos already listed.

```json
{ "src": "gallery/ramen/00026.jpg", "caption": ["Shop name", "2025.01.01"], "link": "https://maps.app.goo.gl/…" }
```

Every build runs `npm run photos:check` first and fails if any image under `src/assets` or `public` still carries GPS, so a location can never be deployed by accident. The repo is public: run `npm run photos` **before committing** new photos.

### Ajie and Journey posts

Each post is one JSON file. Text fields take a plain string (used for every language) or `{ "en", "zh-tw", "zh-cn", "ja" }`.

- **Ajie** (`/personal/ajie/`, IG-style grid; the old `/personal/companion/` redirects): `src/content/ajie/<date>-<slug>.json`, photos and clips in R2 (see below).
  Profile facts (adoption date, birthday, bio) live in `src/data/ajie.ts`.
- **Journey** (`/personal/journey/`, timeline): `src/content/journey/<date>-<slug>.json`, photos and clips in R2 (see below); search by title, filter by year and category, and "Play" flies through the milestones on the globe.
  `category` is one of `run`, `dive`, `jump`, `hike`, `ride`, `travel`, `other`.

```json
{
  "date": "2025-02-16",
  "category": "run",
  "title": { "en": "First marathon", "zh-tw": "第一次全馬", "zh-cn": "第一次全马", "ja": "はじめてのフルマラソン" },
  "place": "Taipei",
  "stat": "4:28:10",
  "media": [
    { "type": "image", "src": "journey/2025-marathon/1.jpg" },
    { "type": "video", "src": "/media/journey/2025-marathon.mp4", "poster": "journey/2025-marathon/poster.jpg" },
    { "type": "youtube", "id": "VIDEO_ID" }
  ],
  "story": "First paragraph.

Second paragraph."
}
```

An Ajie post has `date`, `media`, `caption`, and optionally `location` and `pinned`. Photos of Ajie posts and Journey milestones (and clip posters) are not in git either: they sit in the same bucket as the clips below, as `<kind>/<id>-<name>.jpg` (long side 2400 px, no metadata) plus `-480.jpg`, `-800.jpg` and `-1200.jpg` copies for `srcset`; the admin page makes and uploads all four. Album photos stay in `src/assets/gallery/` (optimised at build time). Short clips (H.264 MP4, a few MB; they loop muted like an IG clip, or set `"loop": false` for controls and sound) are not in git: they live in the Cloudflare R2 bucket `52hzfan-media`, served at `https://media.52hzfan.com`. The JSON keeps the site path `/media/<ajie|journey>/<id>-<name>.mp4` and the bucket key is the same path without `/media/`. The admin page uploads them there (re-encoded, metadata removed); by hand, check the file with `npm run photos:check` while it is still in `public/media/` (MP4s there are gitignored), then `npx wrangler r2 object put 52hzfan-media/ajie/<id>-<name>.mp4 --file <file> --content-type video/mp4 --cache-control "public, max-age=604800" --remote` from `workers/site-admin`. Long clips are better on YouTube. A chapter with no posts yet stays noindex and out of the sitemap.

### Explorer Passport (achievements)

Rules live in `src/lib/passport.ts` (`ACHIEVEMENTS`); texts in `src/i18n/personal.ts` (`passport.items`). Components only report events with `track('event', 'detail')`. Progress is stored in the visitor's localStorage; the page is `/personal/achievements/`.

## Stats API (badge rates, Ajie likes)

`workers/achievement-stats/` is a Cloudflare Worker with a D1 database. It counts, anonymously, how many explorers (visitors who entered the personal world) hold each badge, and the likes on Ajie's posts. Spec: `docs/specs/achievement-statistics.md`.

- The browser keeps a random installation secret (`passport-stats:identity:v1`); the Worker stores only its SHA-256. No IP, user agent or location is stored.
- Professional pages never call the API. Personal pages register once and report new badges (batched, at most a few requests per visit).
- If `PUBLIC_PASSPORT_STATS_API_URL` is not set, the site builds and works exactly as before: no requests, no rates, no hearts.
- Resetting the logbook only clears this browser; badges already counted stay counted.

**Setup (Cloudflare Dashboard)**

1. D1 → Create database `passport-stats`; put its Database ID in `workers/achievement-stats/wrangler.jsonc`.
2. D1 → `passport-stats` → Console: run `workers/achievement-stats/migrations/0001_init.sql`, then record it:
   `CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL); INSERT INTO d1_migrations (name) VALUES ('0001_init.sql');`
   (or `npm run migrate:remote` from the Worker folder after `npx wrangler login`).
3. Workers & Pages → Create → Import a repository → this repo; name `achievement-stats`, root directory `workers/achievement-stats`, no build command, deploy command `npx wrangler deploy`. Pushes to `main` redeploy it.
4. Worker → Settings → Variables and Secrets → Secret `RATE_SALT` (any long random string; used to hash IPs for rate limiting).
5. GitHub → Settings → Secrets and variables → Actions → Variables: `PUBLIC_PASSPORT_STATS_API_URL` = the Worker URL. The Pages build reads it.

**Develop / test** (in `workers/achievement-stats`): `npm test` (local throwaway D1), `npm run check`, `npm run dev` (local Worker on :8787; copy `.dev.vars.example` to `.dev.vars`, run `npm run migrate:local` once). Build the site against it with `PUBLIC_PASSPORT_STATS_API_URL=http://localhost:8787 npm run build`.

**Operate**: health check `GET /health`. Usage: Workers → `achievement-stats` → Metrics (requests) and D1 → `passport-stats` → Metrics (rows read/written) are billed separately; check current free-plan limits on Cloudflare's pricing page. Backup: D1 → `passport-stats` → Backups / Time Travel, or `npx wrangler d1 export passport-stats --remote --output backup.sql`. Rate limits (10/min per identity, 30/min per IP) use Workers rate limiting, which is approximate and per location, not an exact global quota. Allowed origins: `ALLOWED_ORIGINS` in `wrangler.jsonc`.

**Turn it off**: clear the `PUBLIC_PASSPORT_STATS_API_URL` variable and redeploy the site. Badges keep working; do not delete the D1 data to roll back.

## Admin page (stats, add posts)

`https://52hzfan.com/admin/` (page: `src/pages/admin/`, logic: `src/admin/`) shows the stats from the database above and adds albums, Journey milestones and Ajie posts without a local checkout (新增 menu). Its API is a second Worker, `workers/site-admin/`, on `52hzfan.com/api/admin/*`.

- **Who gets in**: Cloudflare Access blocks both paths for everyone but `ADMIN_EMAIL`. The Worker checks the Access token itself as well (signature, audience, issuer, expiry, email), and refuses writes from other origins.
- **What a post does**: upload the photos / clips, then paste (or pick) the post JSON, in the same shape as the files in `src/content/ajie|journey/`, with files referenced by name only (`"src": "img-1234.jpg"`). "複製格式說明" copies the format and the uploaded names, ready to hand to an agent. The page checks the JSON live with `src/lib/admin-post.ts`, and the Worker checks it again with the same code. The browser shrinks photos (long side 2400 px) and re-encodes clips (720p H.264 MP4, retried at lower quality, at most 40 MB, with an automatic `<name>-poster.jpg`). Both drop EXIF, GPS and video location tags. Only files the JSON uses are uploaded, as GitHub blobs. Then one commit on `main` adds them, `src/content/<kind>/<id>.json` (file paths filled in) and, for Ajie, the ID in `src/data/ajie-posts.ts`. That push deploys the site and the stats Worker. Files are reordered by dragging their ⠿ handle; the JSON order follows.
- **Albums**: same flow, photos only, into `src/assets/gallery/<id>/` and `src/content/albums/<id>.json`. GPS is removed by re-drawing, but the shooting date and camera settings are read first (same fields as `npm run photos`) and added to each photo; `order` defaults to after the last album and `cover` to the first photo. Set `"draft": true` to keep a new album hidden.
- v1 only adds: edit or delete posts and albums in the repo as before.
- **Rebuild** runs the deploy workflow without a commit.

**Setup (Cloudflare / GitHub)**

1. Zero Trust → Access → Applications → Add → Self-hosted. Add two public hostnames on `52hzfan.com`: path `admin` and path `api/admin`. Policy: Allow, Include → Emails → your address. Copy the team domain (`<team>.cloudflareaccess.com`) and the application's AUD tag into `ACCESS_TEAM_DOMAIN` / `ACCESS_AUD` in `workers/site-admin/wrangler.jsonc`.
2. GitHub → Settings → Developer settings → Fine-grained tokens: only this repository; permissions Contents (read and write) and Actions (read and write).
3. Workers & Pages → Create → Import a repository → this repo; name `site-admin`, root directory `workers/site-admin`, deploy command `npx wrangler deploy`. Then Settings → Variables and Secrets → Secret `GITHUB_TOKEN` = the token. The route `52hzfan.com/api/admin/*` comes from `wrangler.jsonc`.

**Develop / test**: `npm run dev`, then open `/admin/?mock` for a fake API (dev only, nothing is uploaded). Worker tests: `npm test` and `npm run check` in `workers/site-admin` (fake GitHub, throwaway D1).

## URLs

| Page | English | 繁中 | 简中 | 日本語 |
| --- | --- | --- | --- | --- |
| Home | `/` | `/zh-tw/` | `/zh-cn/` | `/ja/` |
| Gallery | `/gallery/` | `/zh-tw/gallery/` | `/zh-cn/gallery/` | `/ja/gallery/` |
| Album | `/gallery/ramen/` | `/zh-tw/gallery/ramen/` | … | … |

Old URLs (`index_tw.html`, `index_ch.html`, `index_jp.html`, `gallery/main.html`) redirect to the new ones (`public/`).

## Deploy

`.github/workflows/deploy.yml` builds and publishes on every push to `main`, and every Monday so the GitHub star counts stay fresh.
Next to the build, a check job runs `astro check` (and, when `workers/` or a file they share with the site changed, both Workers' type checks and tests); the site is only published if both pass, so a broken change, by hand or from the admin page, stays off the live site (the admin page then reports the deploy as failed).
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The custom domain is kept via `public/CNAME`.
