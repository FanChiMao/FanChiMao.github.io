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

Drop the file into `src/assets/gallery/<album>/` and append an entry to `photos` in `src/content/albums/<album>.json`:

```json
{ "src": "gallery/ramen/00026.jpg", "caption": ["Shop name", "2025.01.01"], "link": "https://maps.app.goo.gl/…" }
```

Albums with `"draft": true` (snapshot, nature, animals) are hidden until they have real content.

## URLs

| Page | English | 繁中 | 简中 | 日本語 |
| --- | --- | --- | --- | --- |
| Home | `/` | `/zh-tw/` | `/zh-cn/` | `/ja/` |
| Gallery | `/gallery/` | `/zh-tw/gallery/` | `/zh-cn/gallery/` | `/ja/gallery/` |
| Album | `/gallery/ramen/` | `/zh-tw/gallery/ramen/` | … | … |

Old URLs (`index_tw.html`, `index_ch.html`, `index_jp.html`, `gallery/main.html`) redirect to the new ones (`public/`).

## Deploy

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**. The custom domain is kept via `public/CNAME`.
