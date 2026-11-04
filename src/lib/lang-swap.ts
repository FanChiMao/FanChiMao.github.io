/**
 * In-place language switch (personal world).
 *
 * Every locale of a page is rendered from the same template, so the DOM has
 * the same shape and only text and a few attributes differ. Instead of
 * navigating, fetch the translated page, walk both trees in parallel and
 * patch just those differences: canvases, running animations, scroll
 * position and component state are left alone, so nothing flashes.
 *
 * If the trees do not line up exactly (some markup differs per locale), the
 * caller falls back to a normal navigation. Each locale keeps its own real
 * URL, so crawlers and direct visits are unaffected.
 */

/** Containers that are compared and patched. */
const ROOTS = ['[data-nav]', '#main', 'footer.footer'];
/** Attributes owned by scripts at runtime, never copied from the fetched page. */
const RUNTIME_ATTRS = new Set(['class', 'style', 'open', 'aria-expanded', 'aria-pressed', 'hidden', 'width', 'height']);
/** Localised attributes that may be present in one locale and absent in another. */
const OPTIONAL_ATTRS = new Set(['aria-current', 'title', 'aria-label', 'lang', 'hreflang']);
/** Subtrees not compared: their content is script-generated or locale-independent. */
const OPAQUE_TAGS = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEMPLATE', 'IFRAME']);

type Patch = () => void;

function syncAttrs(cur: Element, next: Element, patches: Patch[]) {
  for (const { name, value } of Array.from(next.attributes)) {
    if (!RUNTIME_ATTRS.has(name) && cur.getAttribute(name) !== value) patches.push(() => cur.setAttribute(name, value));
  }
  for (const name of cur.getAttributeNames()) {
    if (OPTIONAL_ATTRS.has(name) && !next.hasAttribute(name)) patches.push(() => cur.removeAttribute(name));
  }
}

/** Collects patches turning `cur` into `next`; false if their structure differs. */
function diff(cur: Node, next: Node, patches: Patch[]): boolean {
  if (cur.nodeType !== next.nodeType) return false;
  if (cur.nodeType === Node.TEXT_NODE) {
    if (cur.nodeValue !== next.nodeValue) patches.push(() => (cur.nodeValue = next.nodeValue));
    return true;
  }
  if (cur.nodeType !== Node.ELEMENT_NODE) return true;
  const a = cur as Element;
  const b = next as Element;
  if (a.tagName !== b.tagName) return false;
  if (OPAQUE_TAGS.has(a.tagName) || a.hasAttribute('data-swap-skip')) return true;
  syncAttrs(a, b, patches);
  const ac = a.childNodes;
  const bc = b.childNodes;
  if (ac.length !== bc.length) return false;
  for (let i = 0; i < ac.length; i++) if (!diff(ac[i], bc[i], patches)) return false;
  return true;
}

function syncHead(doc: Document) {
  document.title = doc.title;
  document.documentElement.lang = doc.documentElement.lang;
  const sel = ['meta[name="description"]', 'link[rel="canonical"]', 'meta[property^="og:"]', 'meta[name^="twitter:"]'];
  for (const s of sel) {
    for (const el of doc.head.querySelectorAll(s)) {
      const key = el.getAttribute('property') ? `meta[property="${el.getAttribute('property')}"]` : el.getAttribute('name') ? `meta[name="${el.getAttribute('name')}"]` : s;
      const here = document.head.querySelector(key);
      if (!here) continue;
      for (const attr of ['content', 'href']) {
        const v = el.getAttribute(attr);
        if (v !== null) here.setAttribute(attr, v);
      }
    }
  }
}

/** Element just below the nav, used to keep what the reader is looking at in place. */
function anchorAtTop(): Element | null {
  const navH = document.querySelector('[data-nav]')?.getBoundingClientRect().bottom ?? 0;
  return document.elementFromPoint(innerWidth / 2, Math.min(innerHeight - 1, navH + 24));
}

const pages = new Map<string, Promise<Document | null>>();
function load(url: string) {
  let p = pages.get(url);
  if (!p) {
    p = fetch(url, { credentials: 'same-origin' })
      .then(async (r) => (r.ok ? new DOMParser().parseFromString(await r.text(), 'text/html') : null))
      .catch(() => null);
    pages.set(url, p);
    p.then((d) => d || pages.delete(url));
  }
  return p;
}

/** Fetch and parse ahead of a likely switch. */
export function warm(url: string) {
  void load(url);
}

/**
 * Swap the current page to the locale at `url` in place.
 * Resolves false (having changed nothing) when an in-place swap is not possible.
 */
export async function swapLanguage(url: string, { push = true } = {}): Promise<boolean> {
  const doc = await load(url);
  if (!doc) return false;
  const patches: Patch[] = [];
  for (const sel of ROOTS) {
    const cur = document.querySelector(sel);
    const next = doc.querySelector(sel);
    if (!cur || !next || !diff(cur, next, patches)) return false;
  }

  const anchor = anchorAtTop();
  const before = anchor?.getBoundingClientRect().top ?? 0;
  if (push) {
    // Mark the entry we leave so Back can swap back instead of reloading.
    history.replaceState({ ...(history.state ?? {}), langSwap: true }, '');
    // Keep in-page state carried by the hash (e.g. a gallery filter).
    const to = new URL(url, location.href);
    if (!to.hash) to.hash = location.hash;
    history.pushState({ langSwap: true }, '', to);
  }
  syncHead(doc);
  for (const p of patches) p();
  // Translations change line lengths: keep the element under the nav where it was.
  if (anchor?.isConnected) {
    const shift = anchor.getBoundingClientRect().top - before;
    if (Math.abs(shift) > 0.5) scrollBy({ top: shift, behavior: 'instant' });
  }
  document.dispatchEvent(new CustomEvent('langswap', { detail: { lang: document.documentElement.lang } }));
  return true;
}

/** Back/Forward between swapped locales. */
export function handleHistory() {
  addEventListener('popstate', (ev) => {
    if (!ev.state?.langSwap) return;
    swapLanguage(location.href, { push: false }).then((ok) => ok || location.reload());
  });
}
