/**
 * The few GitHub REST calls the admin needs: upload blobs, write one commit on the branch, read a
 * file, and list deploy workflow runs. The token is a fine-grained PAT for this repo only.
 */

export type GitHubConfig = { token: string; repo: string; branch: string };

export class GitHubError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function client(cfg: GitHubConfig, fetcher: typeof fetch = fetch) {
  const base = `https://api.github.com/repos/${cfg.repo}`;
  const headers = {
    Authorization: `Bearer ${cfg.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': '52hzfan-site-admin',
  };
  async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetcher(`${base}${path}`, { ...init, headers: { ...headers, ...(init.body && !(init.headers as Record<string, string>)?.['Content-Length'] ? { 'Content-Type': 'application/json' } : {}), ...(init.headers ?? {}) } });
    if (!res.ok) throw new GitHubError(res.status, `GitHub ${init.method ?? 'GET'} ${path}: ${res.status}`);
    return (res.status === 204 ? undefined : await res.json()) as T;
  }

  return {
    /**
     * Upload one file as a blob. `base64` is streamed straight into GitHub's JSON body, so the
     * Worker never parses or decodes large files (keeps CPU time tiny on the free plan).
     */
    async blobFromStream(base64: ReadableStream<Uint8Array>, length: number): Promise<string> {
      const prefix = new TextEncoder().encode('{"encoding":"base64","content":"');
      const suffix = new TextEncoder().encode('"}');
      const { readable, writable } = new FixedLengthStream(prefix.length + length + suffix.length);
      const pump = (async () => {
        const w = writable.getWriter();
        await w.write(prefix);
        const r = base64.getReader();
        for (;;) {
          const { done, value } = await r.read();
          if (done) break;
          await w.write(value);
        }
        await w.write(suffix);
        await w.close();
      })();
      const [blob] = await Promise.all([
        call<{ sha: string }>('/git/blobs', { method: 'POST', body: readable, headers: { 'Content-Type': 'application/json', 'Content-Length': String(prefix.length + length + suffix.length) } }),
        pump,
      ]);
      return blob.sha;
    },

    async readText(path: string): Promise<{ text: string; sha: string }> {
      const f = await call<{ content: string; sha: string }>(`/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`);
      const bytes = Uint8Array.from(atob(f.content.replace(/\n/g, '')), (c) => c.charCodeAt(0));
      return { text: new TextDecoder().decode(bytes), sha: f.sha };
    },

    async exists(path: string): Promise<boolean> {
      try {
        await call(`/contents/${path}?ref=${encodeURIComponent(cfg.branch)}`);
        return true;
      } catch (e) {
        if (e instanceof GitHubError && e.status === 404) return false;
        throw e;
      }
    },

    /**
     * One commit on top of the branch head with the given files (blob SHA or text content).
     * Retries if the branch moved in between (another push), never force-pushes.
     */
    async commit(message: string, files: { path: string; sha?: string; text?: string }[]): Promise<{ sha: string; url: string }> {
      for (let attempt = 0; attempt < 3; attempt++) {
        const ref = await call<{ object: { sha: string } }>(`/git/ref/heads/${cfg.branch}`);
        const head = await call<{ tree: { sha: string } }>(`/git/commits/${ref.object.sha}`);
        const tree = await call<{ sha: string }>('/git/trees', {
          method: 'POST',
          body: JSON.stringify({
            base_tree: head.tree.sha,
            tree: files.map((f) => ({ path: f.path, mode: '100644', type: 'blob', ...(f.sha ? { sha: f.sha } : { content: f.text }) })),
          }),
        });
        const commit = await call<{ sha: string; html_url: string }>('/git/commits', {
          method: 'POST',
          body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }),
        });
        try {
          await call(`/git/refs/heads/${cfg.branch}`, { method: 'PATCH', body: JSON.stringify({ sha: commit.sha, force: false }) });
          return { sha: commit.sha, url: commit.html_url };
        } catch (e) {
          if (e instanceof GitHubError && e.status === 422) continue; // not a fast-forward: rebuild on the new head
          throw e;
        }
      }
      throw new GitHubError(409, 'The branch keeps moving; try again.');
    },

    /** Start the site deploy workflow by hand (rebuild without a new commit). Needs Actions: write. */
    async dispatchDeploy(): Promise<void> {
      await call('/actions/workflows/deploy.yml/dispatches', { method: 'POST', body: JSON.stringify({ ref: cfg.branch }) });
    },

    /** Latest runs of the site deploy workflow. */
    async deployRuns(limit = 5) {
      const r = await call<{ workflow_runs: { id: number; head_sha: string; status: string; conclusion: string | null; created_at: string; updated_at: string; html_url: string; display_title: string }[] }>(
        `/actions/workflows/deploy.yml/runs?branch=${encodeURIComponent(cfg.branch)}&per_page=${limit}`,
      );
      return r.workflow_runs.map((w) => ({ id: w.id, sha: w.head_sha, status: w.status, conclusion: w.conclusion, createdAt: w.created_at, updatedAt: w.updated_at, url: w.html_url, title: w.display_title }));
    },
  };
}
