import type { ChapterId } from '@/i18n/personal';

/**
 * Personal chapters that still render the placeholder page, with their URL slug.
 * Placeholders are noindex; keep STUB_SLUGS in astro.config.mjs in sync so they also stay out of the sitemap.
 */
export const STUBS: { id: ChapterId; slug: string }[] = [
  { id: 'journey', slug: 'journey' },
  { id: 'companion', slug: 'companion' },
];
