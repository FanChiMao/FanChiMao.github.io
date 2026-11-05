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
  /** 'male' or 'female'; shown as a small symbol next to the name. */
  sex: 'male' | 'female' | null;
  /** A line or two about Ajie: one string for every language, or one per language. */
  bio: string | Record<Locale, string> | null;
} = {
  adopted: '2025-10-04',
  sex: 'male',
  // Estimated from tooth wear (3 to 7 years old when adopted); counted as 7.
  born: '2018',
  bio: {
    en: 'An orange tabby adopted from the Taipei City Animal Shelter, and now the real boss of the house.',
    'zh-tw': '從臺北市動物之家領養回家的橘貓，現在是家裡真正的主人。',
    'zh-cn': '从台北市动物之家领养回家的橘猫，现在是家里真正的主人。',
    ja: '台北市動物之家から迎えた茶トラ猫。いまでは家の本当の主です。',
  },
};
