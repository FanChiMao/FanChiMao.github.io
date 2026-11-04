import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

/** A string translated into every supported locale. */
const t = z.object({ en: z.string(), 'zh-tw': z.string(), 'zh-cn': z.string(), ja: z.string() });
const tList = z.object({ en: z.array(z.string()), 'zh-tw': z.array(z.string()), 'zh-cn': z.array(z.string()), ja: z.array(z.string()) });
/** Path relative to src/assets, resolved at build time by lib/assets.ts. */
const asset = z.string();

const experience = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/experience' }),
  schema: z.object({
    order: z.number(),
    start: z.number(),
    end: z.number().nullable(),
    company: t,
    role: t,
    description: t,
    tags: tList,
  }),
});

const competitions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/competitions' }),
  schema: z.object({
    order: z.number(),
    year: z.number(),
    title: t,
    description: t,
    repo: z.url(),
    images: z.array(asset).min(1),
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/publications' }),
  schema: z.object({
    order: z.number(),
    year: z.number(),
    venueShort: z.string(),
    award: z.boolean().optional(),
    venue: t,
    title: t,
    /** Trusted HTML (authored in this repo). */
    abstract: t,
    links: z.object({
      paper: z.url(),
      code: z.url().optional(),
      /** YouTube video id */
      video: z.string().optional(),
    }),
    /** Animated preview served from /public */
    media: z.string().optional(),
    extraImage: z.object({ src: asset, thumb: asset }).optional(),
  }),
});

const education = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/education' }),
  schema: z.object({
    order: z.number(),
    degree: t,
    school: t,
    /** Trusted HTML */
    description: t,
  }),
});

const albums = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/albums' }),
  schema: z.object({
    order: z.number(),
    emoji: z.string(),
    draft: z.boolean().optional(),
    title: t,
    cover: asset,
    photos: z.array(z.object({ src: asset, caption: z.array(z.string()), link: z.url().optional() })),
  }),
});

export const collections = { experience, competitions, publications, education, albums };
