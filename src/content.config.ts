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
    /** Department, location and start date line. */
    org: t.optional(),
    description: t,
    /** Products worked on within this role, newest first. */
    products: z.array(z.object({ name: z.string(), period: z.string(), focus: t, points: tList })).optional(),
    /** Other contributions in this role. */
    highlights: tList.optional(),
    tags: z.array(z.string()),
  }),
});


const patents = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/patents' }),
  schema: z.object({
    order: z.number(),
    title: t,
    /** Publication (grant) number, e.g. TWM681536U */
    publicationNumber: z.string(),
    applicationNumber: z.string(),
    filingDate: z.iso.date(),
    publicationDate: z.iso.date(),
    applicant: z.string(),
    /** Fill in only once the permanent public URL has been verified. */
    officialUrl: z.url().nullable(),
  }),
});


const competitions = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/competitions' }),
  schema: z.object({
    order: z.number(),
    year: z.number(),
    title: t,
    description: t,
    /** Team results must be labelled as such, e.g. "Team result: 2nd of 286". */
    achievement: t.optional(),
    repo: z.url(),
    /** Photos; without them the card shows an icon placeholder. */
    images: z.array(asset).optional(),
    icon: z.string().optional(),
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
      arxiv: z.url().optional(),
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
    period: z.string(),
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

export const collections = { experience, competitions, publications, patents, education, albums };
