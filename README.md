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

- **Ajie** (`/personal/companion/`, IG-style grid): `src/content/ajie/<date>-<slug>.json`, photos in `src/assets/ajie/`.
  Profile facts (adoption date, birthday, bio) live in `src/data/ajie.ts`.
- **Journey** (`/personal/journey/`, timeline): `src/content/journey/<date>-<slug>.json`, photos in `src/assets/journey/`.
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

An Ajie post has `date`, `media`, `caption`, and optionally `location` and `pinned`. Short clips go in `public/media/<ajie|journey>/` (H.264 MP4, a few MB; they loop muted like an IG clip, or set `"loop": false` for controls and sound); long ones are better on YouTube. `npm run photos` also strips GPS from photos in these folders, and the build fails if a video still carries a location (iPhone: Share → Options → turn off Location before exporting). A chapter with no posts yet stays noindex and out of the sitemap.

### Explorer Passport (achievements)

Rules live in `src/lib/passport.ts` (`ACHIEVEMENTS`); texts in `src/i18n/personal.ts` (`passport.items`). Components only report events with `track('event', 'detail')`. Progress is stored in the visitor's localStorage; the page is `/personal/achievements/`.

## URLs

| Page | English | 繁中 | 简中 | 日本語 |
| --- | --- | --- | --- | --- |
| Home | `/` | `/zh-tw/` | `/zh-cn/` | `/ja/` |
| Gallery | `/gallery/` | `/zh-tw/gallery/` | `/zh-cn/gallery/` | `/ja/gallery/` |
| Album | `/gallery/ramen/` | `/zh-tw/gallery/ramen/` | … | … |

Old URLs (`index_tw.html`, `index_ch.html`, `index_jp.html`, `gallery/main.html`) redirect to the new ones (`public/`).

## Deploy

`.github/workflows/deploy.yml` builds and publishes on every push to `main`, and every Monday so the GitHub star counts stay fresh.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The custom domain is kept via `public/CNAME`.
