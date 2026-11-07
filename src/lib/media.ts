/**
 * Clips are not in git: they live in the R2 bucket "52hzfan-media", served at media.52hzfan.com.
 * Post JSON keeps the site path "/media/<kind>/<id>-<name>.mp4"; the bucket key is the same
 * path without "/media/".
 */
export const MEDIA_ORIGIN = 'https://media.52hzfan.com';

export const clipUrl = (src: string) => (src.startsWith('/media/') ? `${MEDIA_ORIGIN}/${src.slice('/media/'.length)}` : src);
