import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('/src/assets/**/*.{jpg,jpeg,png,webp,avif}', { eager: true });

/** Resolve a content path such as `competitions/x/1.webp` to imported image metadata. */
export function asset(path: string): ImageMetadata {
  const mod = images[`/src/assets/${path}`];
  if (!mod) throw new Error(`Missing asset: src/assets/${path}`);
  return mod.default;
}
