/**
 * Files of Ajie posts and Journey milestones are not in git: they live in the R2 bucket
 * "52hzfan-media", served at media.52hzfan.com. Post JSON keeps the site path
 * "/media/<kind>/<id>-<name>"; the bucket key is the same path without "/media/".
 *
 * Photos there come with smaller copies made at upload ("x.jpg" -> "x-480.jpg", "x-800.jpg",
 * "x-1200.jpg"), used for srcset since nothing resizes them at build time.
 */
import { PHOTO_WIDTHS, variantName } from './admin-post';

export const MEDIA_ORIGIN = 'https://media.52hzfan.com';
export { PHOTO_WIDTHS };

export const isMedia = (src: string) => src.startsWith('/media/');

export const clipUrl = (src: string) => (isMedia(src) ? `${MEDIA_ORIGIN}/${src.slice('/media/'.length)}` : src);

/** URL of an R2 photo, or of its copy `w` px wide. */
export const photoUrl = (src: string, w?: number) => clipUrl(w ? variantName(src, w) : src);

export const photoSrcset = (src: string, widths: readonly number[] = PHOTO_WIDTHS) => widths.map((w) => `${photoUrl(src, w)} ${w}w`).join(', ');
