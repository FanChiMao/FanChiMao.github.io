// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://52hzfan.com',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { format: 'directory' },
  integrations: [
    icon({ include: { lucide: ['*'], mdi: ['github', 'linkedin', 'facebook', 'instagram', 'youtube', 'skateboarding'] } }),
    sitemap({
      // Skip standalone apps and the old gallery URLs (now redirects).
      filter: (page) => !page.includes('/playground/') && !/^\/(?:(?:zh-tw|zh-cn|ja)\/)?gallery\//.test(new URL(page).pathname),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-tw': 'zh-TW', 'zh-cn': 'zh-CN', ja: 'ja' },
      },
    }),
  ],
});
