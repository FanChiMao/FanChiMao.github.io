// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

/** Placeholder chapters (src/views/personal/stubs.ts): noindex pages, so not in the sitemap either. */
const STUB_SLUGS = ['journey', 'companion'];
const stubPath = new RegExp(`^/(?:(?:zh-tw|zh-cn|ja)/)?personal/(?:${STUB_SLUGS.join('|')})/$`);

export default defineConfig({
  site: 'https://52hzfan.com',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [
    icon({ include: { lucide: ['*'], mdi: ['github', 'linkedin', 'facebook', 'instagram', 'youtube', 'skateboarding'] } }),
    sitemap({
      // Skip standalone apps, the old gallery URLs (now redirects) and placeholder chapters.
      filter: (page) => {
        const path = new URL(page).pathname;
        return !path.startsWith('/playground/') && !/^\/(?:(?:zh-tw|zh-cn|ja)\/)?gallery\//.test(path) && !stubPath.test(path);
      },
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-tw': 'zh-TW', 'zh-cn': 'zh-CN', ja: 'ja' },
      },
    }),
  ],
});
