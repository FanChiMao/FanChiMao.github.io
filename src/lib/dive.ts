/**
 * "Go Deeper?" transition: professional -> personal world.
 *
 * Plays a short descent (sonar ripple, pixels turning into rising bubbles, a
 * passing whale) over the current page, then navigates. The existing
 * cross-document view transition cross-fades into /personal/, whose hero
 * starts in the same deep blue.
 *
 * - Full version once per tab session, a short ripple afterwards.
 * - prefers-reduced-motion: navigate straight away.
 * - Click, Escape, Enter or Space (or the focused Skip button) jumps ahead.
 * - Modified clicks (new tab etc.) are left to the browser.
 * - Back/forward cache: the overlay is removed when the page is shown again.
 */

const SEEN_KEY = 'dive-seen';
const FULL_MS = 1500;
const SHORT_MS = 480;
const EASE = 'cubic-bezier(0.65, 0, 0.35, 1)';

function seen(): boolean {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}
function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {}
}

/** Warm the destination once its link is close to the viewport. */
function prefetchWhenNear(a: HTMLAnchorElement) {
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = a.href;
      document.head.append(link);
    },
    { rootMargin: '600px 0px' },
  );
  io.observe(a);
}

let active: { overlay: HTMLElement; timer: number } | null = null;

function cleanup() {
  if (!active) return;
  clearTimeout(active.timer);
  active.overlay.remove();
  document.documentElement.classList.remove('is-diving');
  active = null;
}

function dive(a: HTMLAnchorElement, template: HTMLTemplateElement, origin: { x: number; y: number }) {
  if (active) return;
  const href = a.href;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    markSeen();
    location.assign(href);
    return;
  }

  const full = !seen();
  const total = full ? FULL_MS : SHORT_MS;
  const overlay = template.content.firstElementChild!.cloneNode(true) as HTMLElement;
  const w = innerWidth;
  const h = innerHeight;
  // Flood circle big enough to cover the farthest corner from the click.
  const r = Math.hypot(Math.max(origin.x, w - origin.x), Math.max(origin.y, h - origin.y));
  overlay.style.setProperty('--x', `${origin.x}px`);
  overlay.style.setProperty('--y', `${origin.y}px`);
  overlay.style.setProperty('--d', `${Math.ceil(r * 2)}px`);
  overlay.classList.toggle('is-short', !full);
  document.body.append(overlay);
  document.documentElement.classList.add('is-diving');

  let gone = false;
  const go = () => {
    if (gone) return;
    gone = true;
    markSeen();
    location.assign(href);
  };
  active = { overlay, timer: window.setTimeout(go, total) };

  overlay.addEventListener('click', go);
  overlay.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' || ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      go();
    }
  });
  overlay.querySelector<HTMLButtonElement>('[data-dive-skip]')?.focus({ preventScroll: true });

  const q = <T extends Element = HTMLElement>(s: string) => overlay.querySelector<T>(s)!;
  const flood = q('.dive__flood');
  flood.animate([{ transform: 'translate(-50%, -50%) scale(0)' }, { transform: 'translate(-50%, -50%) scale(1)' }], {
    duration: full ? 760 : 420,
    easing: EASE,
    fill: 'forwards',
  });

  // Sonar rings spreading from the click point.
  overlay.querySelectorAll<HTMLElement>('.dive__ring').forEach((ring, i) =>
    ring.animate(
      [
        { transform: 'translate(-50%, -50%) scale(0.05)', opacity: 0.85 },
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 0 },
      ],
      { duration: full ? 1100 : 520, delay: i * (full ? 160 : 70), easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
    ),
  );

  if (!full) return;

  // Square "pixels" rising past the viewer, rounding off into bubbles: the sinking feel.
  const field = q('.dive__bubbles');
  const n = w < 700 ? 12 : 22;
  for (let i = 0; i < n; i++) {
    const b = document.createElement('span');
    const size = 3 + Math.random() * 9;
    b.className = 'dive__bubble';
    b.style.left = `${Math.random() * 100}%`;
    b.style.width = b.style.height = `${size}px`;
    field.append(b);
    const sway = (Math.random() - 0.5) * 40;
    b.animate(
      [
        { transform: `translate3d(0, ${h + 40}px, 0)`, borderRadius: '1px', opacity: 0 },
        { transform: `translate3d(${sway * 0.5}px, ${h * 0.6}px, 0)`, borderRadius: '2px', opacity: 1, offset: 0.25 },
        { transform: `translate3d(${sway}px, ${h * 0.2}px, 0)`, borderRadius: '50%', opacity: 0.9, offset: 0.7 },
        { transform: `translate3d(${sway * 0.6}px, -60px, 0)`, borderRadius: '50%', opacity: 0 },
      ],
      { duration: 700 + Math.random() * 500, delay: 220 + Math.random() * 420, easing: 'cubic-bezier(0.4, 0, 0.6, 1)', fill: 'both' },
    );
  }

  // Light fading out as we go down.
  q('.dive__depth').animate([{ opacity: 0 }, { opacity: 1 }], { duration: 700, delay: 600, easing: 'ease-in', fill: 'both' });

  // The whale glides through, briefly.
  q('.dive__whale').animate(
    [
      { transform: 'translate3d(-46%, 8px, 0) scale(0.96)', opacity: 0 },
      { transform: 'translate3d(-50%, 0, 0) scale(1)', opacity: 1, offset: 0.45 },
      { transform: 'translate3d(-54%, -4px, 0) scale(1.02)', opacity: 0.85 },
    ],
    { duration: 820, delay: 620, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', fill: 'both' },
  );
  q('.dive__label').animate([{ opacity: 0, letterSpacing: '0.5em' }, { opacity: 0.8, letterSpacing: '0.32em' }], {
    duration: 600,
    delay: 820,
    easing: 'ease-out',
    fill: 'both',
  });
}

export function setupDive(root: ParentNode = document) {
  const template = root.querySelector<HTMLTemplateElement>('template[data-dive-template]');
  if (!template) return;
  root.querySelectorAll<HTMLAnchorElement>('a[data-dive]').forEach((a) => {
    prefetchWhenNear(a);
    a.addEventListener('click', (ev) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      ev.preventDefault();
      // Keyboard activation reports 0,0: start from the link instead.
      const box = a.getBoundingClientRect();
      const fromPointer = ev.detail > 0 && (ev.clientX || ev.clientY);
      dive(a, template, fromPointer ? { x: ev.clientX, y: ev.clientY } : { x: box.left + box.width / 2, y: box.top + box.height / 2 });
    });
  });
  // Coming back with the browser's Back button may restore this page from bfcache, overlay and all.
  addEventListener('pageshow', (ev) => {
    if (ev.persisted) cleanup();
  });
}
