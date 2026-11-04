/**
 * Star counts for the owner's public repos, fetched once per build.
 *
 * Failure (offline, rate limit, API change) resolves to an empty map so pages simply
 * render without numbers instead of showing stale or made-up ones. In CI the workflow
 * passes GITHUB_TOKEN, which lifts the 60 requests/hour anonymous limit.
 */
const OWNER = 'FanChiMao';

type Repo = { name: string; stargazers_count: number; fork: boolean };

let cache: Promise<Map<string, number>> | undefined;

async function load(): Promise<Map<string, number>> {
  const stars = new Map<string, number>();
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json', 'User-Agent': '52hzfan.com-build' };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    for (let page = 1; page <= 5; page++) {
      const res = await fetch(`https://api.github.com/users/${OWNER}/repos?type=owner&per_page=100&page=${page}`, {
        headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`GitHub API ${res.status} ${res.statusText}`);
      const repos = (await res.json()) as Repo[];
      for (const r of repos) if (!r.fork) stars.set(r.name.toLowerCase(), r.stargazers_count);
      if (repos.length < 100) break;
    }
  } catch (err) {
    console.warn(`[github] star counts unavailable, rendering without them: ${(err as Error).message}`);
    stars.clear();
  }
  return stars;
}

export const githubStars = () => (cache ??= load());

/** Stars for a repo URL like https://github.com/FanChiMao/SUNet, or undefined if unknown. */
export async function starsFor(url: string | undefined): Promise<number | undefined> {
  const m = url?.match(/github\.com\/([^/]+)\/([^/#?]+)/i);
  if (!m || m[1].toLowerCase() !== OWNER.toLowerCase()) return undefined;
  return (await githubStars()).get(m[2].toLowerCase());
}

/** Total stars across the owner's non-fork repos, or undefined if the fetch failed. */
export async function totalStars(): Promise<number | undefined> {
  const s = await githubStars();
  if (s.size === 0) return undefined;
  let total = 0;
  for (const n of s.values()) total += n;
  return total;
}

/** 1234 -> "1.2k" */
export const formatStars = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}k` : String(n));
