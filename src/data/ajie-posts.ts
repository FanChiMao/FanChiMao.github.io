/**
 * Every Ajie post that can be liked: the file name (without .json) of each post in
 * src/content/ajie/. Pure data, shared by the site and the stats Worker
 * (workers/achievement-stats), which only accepts likes on these IDs.
 *
 * Adding a post: add its ID here too (the site build fails with a reminder if a published
 * post is missing), then redeploy the Worker so it accepts likes on it.
 */
export const AJIE_POST_IDS = ['2025-10-04-adoption', '2025-10-11-first-vet-visit', '2025-10-19-meds-and-wet-food', '2025-10-26-eye-specialist', '2025-10-27-the-decision', '2025-11-06-waiting-for-surgery', '2025-11-12-unexpected-hope', '2025-11-19-back-to-normal', '2025-11-20-cold-and-recovery'] as const;
