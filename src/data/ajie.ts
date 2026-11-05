import type { Locale } from '@/i18n/ui';

/**
 * Ajie's profile at the top of /personal/companion/. Facts only, filled in by Chi-Mao;
 * anything left null is simply not shown.
 */
export const ajieProfile: {
  /** ISO date, e.g. '2023-05-20'. */
  adopted: string | null;
  /** ISO date or a year, e.g. '2022' when the exact day is unknown. */
  born: string | null;
  /** A line or two about Ajie: one string for every language, or one per language. */
  bio: string | Record<Locale, string> | null;
} = {
  adopted: null,
  born: null,
  bio: null,
};
