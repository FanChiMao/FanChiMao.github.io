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
    icon({ include: { lucide: ['*'], mdi: ['github', 'linkedin', 'facebook', 'instagram', 'twitter', 'youtube', 'skateboarding'] } }),
    sitemap({
      filter: (page) => !page.includes('/playground/'),
      i18n: {
        defaultLocale: 'en',
        locales: { en: 'en', 'zh-tw': 'zh-TW', 'zh-cn': 'zh-CN', ja: 'ja' },
      },
    }),
  ],
});
