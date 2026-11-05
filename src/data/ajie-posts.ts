/**
 * Every Ajie post that can be liked: the file name (without .json) of each post in
 * src/content/ajie/. Pure data, shared by the site and the stats Worker
 * (workers/achievement-stats), which only accepts likes on these IDs.
 *
 * Adding a post: add its ID here too (the site build fails with a reminder if a published
 * post is missing), then redeploy the Worker so it accepts likes on it.
 */
export const AJIE_POST_IDS = ['2025-10-04-adoption'] as const;
