import type { Locale } from '@/i18n/ui';

/**
 * Ajie's profile at the top of /personal/ajie/. Facts only, filled in by Chi-Mao;
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
  /** The name of Ajie's diary, as on Instagram (shown above the name). */
  archive: string | Record<Locale, string> | null;
  /** Instagram handle, without the @. */
  instagram: string | null;
} = {
  adopted: '2025-10-04',
  sex: 'male',
  // Estimated from tooth wear (3 to 7 years old when adopted); counted as 7.
  born: '2018',
  // Same voice as the Instagram profile (@ajie.archive): "一隻橘貓 / 領養於 2025.10 / 記錄平凡但深刻的回憶".
  bio: {
    en: 'An orange tabby adopted from the Taipei City Animal Shelter. Ordinary days, deeply remembered.',
    'zh-tw': '從臺北市動物之家領養回家的橘貓，在這裡記錄平凡但深刻的回憶。',
    'zh-cn': '从台北市动物之家领养回家的橘猫，在这里记录平凡但深刻的回忆。',
    ja: '台北市動物之家から迎えた茶トラ猫。平凡だけど心に残る日々の記録。',
  },
  archive: { en: 'Ajie Archive · orange tabby diary', 'zh-tw': '桔事簿 · 橘貓生活紀錄', 'zh-cn': '桔事簿 · 橘猫生活记录', ja: '桔事簿 · 茶トラ猫の日々' },
  instagram: 'ajie.archive',
};
