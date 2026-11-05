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
    /** Certificate / award image, opened in the media dialog */
    certificate: asset.optional(),
    /** YouTube video id for a demo button */
    video: z.string().optional(),
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

/** Gallery filter categories (labels live in i18n/personal.ts). */
/** A string shared by all languages, or one per language. */
const textOrT = z.union([z.string(), t]);

export const albumCategories = ['astro', 'drone', 'landscape', 'city', 'everyday'] as const;

const albums = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/albums' }),
  schema: z.object({
    order: z.number(),
    emoji: z.string(),
    /** One or more filter categories; an album shows under each. */
    categories: z.array(z.enum(albumCategories)).min(1),
    draft: z.boolean().optional(),
    title: t,
    cover: asset,
    photos: z.array(
      z.object({
        src: asset,
        /** Legacy free-form lines: first line is the heading, the rest the body. */
        caption: z.array(z.string()).default([]),
        /** Optional; a plain string is used for every language. */
        title: textOrT.optional(),
        description: textOrT.optional(),
        /** Below are written by `npm run photos` from EXIF; edit freely. */
        taken: z.iso.date().optional(),
        exif: z
          .object({ camera: z.string(), lens: z.string(), focalLength: z.number(), aperture: z.number(), shutter: z.string(), iso: z.number() })
          .partial()
          .optional(),
        link: z.url().optional(),
      }),
    ),
  }),
});

/**
 * One photo or video in a post. Images live in src/assets (resolved like everything else);
 * short clips are files under public/media/ (shown like an IG video: muted loop by default),
 * long ones are YouTube embeds.
 */
const media = z.discriminatedUnion('type', [
  z.object({ type: z.literal('image'), src: asset, alt: textOrT.optional() }),
  z.object({
    type: z.literal('video'),
    /** Path under /public, e.g. "/media/ajie/first-day.mp4". */
    src: z.string().startsWith('/media/'),
    /** Still frame shown before playing (path under src/assets). */
    poster: asset,
    /** Play muted on a loop like an IG clip (default), or show controls with sound. */
    loop: z.boolean().default(true),
    alt: textOrT.optional(),
  }),
  z.object({ type: z.literal('youtube'), id: z.string(), poster: asset.optional(), alt: textOrT.optional() }),
]);

/** Ajie, the orange tabby: posts shown as an IG-style profile grid. */
const ajie = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/ajie' }),
  schema: z.object({
    date: z.iso.date(),
    media: z.array(media).min(1),
    /** Illustrated cover: the grid thumbnail and the first slide of the post. */
    cover: z.object({ src: asset, alt: textOrT.optional() }).optional(),
    caption: textOrT,
    location: textOrT.optional(),
    /** Pinned posts stay at the front of the grid. */
    pinned: z.boolean().optional(),
    draft: z.boolean().optional(),
  }),
});

export const journeyCategories = ['run', 'dive', 'jump', 'hike', 'ride', 'travel', 'other'] as const;

/** The Journey: first times and journeys worth remembering, on a timeline. */
const journey = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/journey' }),
  schema: z.object({
    date: z.iso.date(),
    category: z.enum(journeyCategories),
    title: textOrT,
    place: textOrT.optional(),
    /** A result worth showing, e.g. "4:28:10" or "18 m". */
    stat: z.string().optional(),
    media: z.array(media).default([]),
    story: textOrT,
    draft: z.boolean().optional(),
  }),
});

export const collections = { experience, competitions, publications, patents, education, albums, ajie, journey };
