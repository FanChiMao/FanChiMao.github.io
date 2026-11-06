// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import { existsSync, readdirSync, readFileSync } from 'node:fs';

/** A chapter with no published posts yet is noindex (see its view), so keep it out of the sitemap too. */
/** @param {string} dir */
const published = (dir) =>
  existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.json') && !JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')).draft);
const STUB_SLUGS = [
  ...(published('./src/content/journey') ? [] : ['journey']),
  ...(published('./src/content/ajie') ? [] : ['companion']),
];
const stubPath = STUB_SLUGS.length ? new RegExp(`^/(?:(?:zh-tw|zh-cn|ja)/)?personal/(?:${STUB_SLUGS.join('|')})/$`) : /^$/;

export default defineConfig({
  site: 'https://52hzfan.com',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [
    icon({ include: { lucide: ['*'], mdi: ['github', 'linkedin', 'facebook', 'instagram', 'youtube', 'skateboarding'] } }),
    sitemap({
      // Skip standalone apps, the private admin page, the old gallery URLs (now redirects) and placeholder chapters.
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith('/playground/') && !path.startsWith('/admin/') && !/^\/(?:(?:zh-tw|zh-cn|ja)\/)?gallery\//.test(path) && !stubPath.test(path);
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-tw': 'zh-TW', 'zh-cn': 'zh-CN', ja: 'ja' },
      },
    }),
  ],
});
