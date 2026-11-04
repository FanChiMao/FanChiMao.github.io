import type { ChapterId } from '@/i18n/personal';

/** Personal chapters that still render the placeholder page, with their URL slug. */
export const STUBS: { id: ChapterId; slug: string }[] = [
  { id: 'journey', slug: 'journey' },
  { id: 'companion', slug: 'companion' },
  { id: 'secrets', slug: 'achievements' },
];
