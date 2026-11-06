/**
 * Dev only (npm run dev, then /admin/?mock): a fake /api/admin/* so the page can be tried
 * without the Worker or Cloudflare Access. Nothing is uploaded or committed. Never bundled
 * into production builds (imported behind import.meta.env.DEV).
 */
export function installMock() {
  const real = window.fetch.bind(window);
  const day = (back: number) => new Date(Date.now() + 8 * 3600_000 - back * 86_400_000).toISOString().slice(0, 10);
  let blobs = 0;
  const runs = [{ id: 1, sha: 'abc1234', status: 'completed', conclusion: 'success', createdAt: new Date(Date.now() - 3600_000).toISOString(), url: '#', title: 'Ajie: illustrations / photos pill' }];
  const json = (b: unknown, status = 200) => new Promise<Response>((ok) => setTimeout(() => ok(new Response(JSON.stringify(b), { status })), 250));
  window.fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : (input as Request).url, location.href);
    if (!url.pathname.startsWith('/api/admin/')) return real(input, init);
    const p = url.pathname.slice('/api/admin/'.length);
    console.info('[admin mock]', init?.method ?? 'GET', p);
    if (p === 'me') return json({ email: 'mock@localhost' });
    if (p === 'stats')
      return json({
        asOf: new Date().toISOString(),
        explorers: 37,
        newExplorers: [12, 9, 6, 5, 3, 2, 1, 0].map((n, i) => ({ day: day([0, 1, 3, 4, 8, 15, 21, 28][i]), n })),
        badges: [
          { id: 'deep-diver', n: 37 },
          { id: 'whale-watcher', n: 14 },
          { id: 'researcher', n: 6 },
          { id: 'inventor', n: 2 },
        ],
        badgesPerDay: [{ day: day(0), n: 20 }],
        likes: [
          { id: '2025-10-27-the-decision', n: 8 },
          { id: '2025-10-04-adoption', n: 5 },
        ],
      });
    if (p === 'deploys') return json({ runs });
    if (p === 'redeploy') return json({ ok: true });
    if (p === 'blob') return json({ sha: (++blobs).toString(16).padStart(40, '0') });
    if (p === 'publish') {
      const sha = Math.random().toString(16).slice(2).padEnd(40, '0');
      runs.unshift({ id: runs.length + 1, sha, status: 'in_progress', conclusion: null as never, createdAt: new Date().toISOString(), url: '#', title: 'mock publish' });
      setTimeout(() => Object.assign(runs[0], { status: 'completed', conclusion: 'success' }), 15_000);
      console.info('[admin mock] publish body', String(init?.body));
      return json({ id: 'mock', commit: { sha, url: '#' } });
    }
    return json({ error: { message: 'mock: not found' } }, 404);
  };
}
