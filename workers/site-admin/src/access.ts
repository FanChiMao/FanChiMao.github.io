/**
 * Cloudflare Access check. Access already blocks anyone but the admin at the edge; this verifies
 * the signed token it forwards (Cf-Access-Jwt-Assertion) so the Worker is safe on its own too:
 * RS256 signature against the team's public keys, audience, issuer, expiry and the admin email.
 */

export type AccessConfig = { teamDomain: string; aud: string; email: string };
type Jwk = JsonWebKey & { kid: string };

const b64urlToBytes = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4)), (c) => c.charCodeAt(0));
const parse = <T>(part: string): T => JSON.parse(new TextDecoder().decode(b64urlToBytes(part))) as T;

let keyCache: { domain: string; at: number; keys: Jwk[] } | null = null;

async function teamKeys(domain: string, fetcher: typeof fetch, force = false): Promise<Jwk[]> {
  if (!force && keyCache && keyCache.domain === domain && Date.now() - keyCache.at < 3_600_000) return keyCache.keys;
  const res = await fetcher(`https://${domain}/cdn-cgi/access/certs`);
  if (!res.ok) throw new Error(`certs ${res.status}`);
  const { keys } = (await res.json()) as { keys: Jwk[] };
  keyCache = { domain, at: Date.now(), keys };
  return keys;
}

/** Returns the admin's email when the request carries a valid Access token for this app; otherwise null. */
export async function verifyAccess(req: Request, cfg: AccessConfig, fetcher: typeof fetch = fetch): Promise<string | null> {
  if (!cfg.teamDomain || !cfg.aud || !cfg.email) return null; // not configured: nobody gets in
  const token = req.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const header = parse<{ alg: string; kid: string }>(parts[0]);
    const claims = parse<{ aud: string | string[]; iss: string; exp: number; nbf?: number; email?: string }>(parts[1]);
    if (header.alg !== 'RS256') return null;
    let keys = await teamKeys(cfg.teamDomain, fetcher);
    let jwk = keys.find((k) => k.kid === header.kid);
    if (!jwk) {
      keys = await teamKeys(cfg.teamDomain, fetcher, true); // keys rotate
      jwk = keys.find((k) => k.kid === header.kid);
    }
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(`${parts[0]}.${parts[1]}`));
    if (!ok) return null;
    const now = Math.floor(Date.now() / 1000);
    const auds = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!auds.includes(cfg.aud)) return null;
    if (claims.iss !== `https://${cfg.teamDomain}`) return null;
    if (!(claims.exp > now) || (claims.nbf && claims.nbf > now + 60)) return null;
    if (!claims.email || claims.email.toLowerCase() !== cfg.email.toLowerCase()) return null;
    return claims.email;
  } catch {
    return null;
  }
}
