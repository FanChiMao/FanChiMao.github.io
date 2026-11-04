/**
 * Overlay page scrollbar (fine pointers only; touch devices keep their native
 * overlay indicator).
 *
 * The native root scrollbar is hidden by CSS and replaced by a thin thumb that
 * floats over the content: page backgrounds run underneath it, it stays out of
 * sight until the page scrolls (fading out again when scrolling stops), shows
 * while the pointer is near the right edge, and can be dragged or clicked like
 * a normal scrollbar. Keyboard and wheel scrolling are untouched.
 */

const IDLE_MS = 900;
const MIN_THUMB = 36;

export function setupScrollbar(track: HTMLElement) {
  const thumb = track.firstElementChild as HTMLElement;
  const doc = document.documentElement;
  let idle = 0;
  let queued = false;
  let dragging: { startY: number; startScroll: number } | null = null;
  let thumbH = 0;
  let range = 0; // scrollable distance (px)
  let travel = 0; // distance the thumb can move (px)

  const measure = () => {
    const vh = innerHeight;
    const trackH = track.clientHeight;
    range = Math.max(0, doc.scrollHeight - vh);
    track.hidden = range < 1;
    thumbH = Math.max(MIN_THUMB, (trackH * vh) / Math.max(vh, doc.scrollHeight));
    travel = Math.max(0, trackH - thumbH);
    thumb.style.height = `${thumbH}px`;
  };
  const place = () => {
    queued = false;
    const y = range ? (scrollY / range) * travel : 0;
    thumb.style.transform = `translate3d(0, ${y}px, 0)`;
  };
  const show = () => {
    track.classList.add('is-active');
    clearTimeout(idle);
    idle = window.setTimeout(() => {
      if (!dragging && !track.matches(':hover')) track.classList.remove('is-active');
    }, IDLE_MS);
  };

  addEventListener(
    'scroll',
    () => {
      show();
      if (!queued) {
        queued = true;
        requestAnimationFrame(place);
      }
    },
    { passive: true },
  );
  // Page height changes (images, "Load more", fonts): re-measure.
  new ResizeObserver(() => {
    measure();
    place();
  }).observe(document.body);
  addEventListener('resize', () => {
    measure();
    place();
  });

  track.addEventListener('pointerleave', () => {
    if (!dragging) show();
  });
  thumb.addEventListener('pointerdown', (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    thumb.setPointerCapture(ev.pointerId);
    dragging = { startY: ev.clientY, startScroll: scrollY };
    track.classList.add('is-dragging', 'is-active');
  });
  thumb.addEventListener('pointermove', (ev) => {
    if (!dragging || !travel) return;
    const dy = ev.clientY - dragging.startY;
    scrollTo({ top: dragging.startScroll + (dy / travel) * range, behavior: 'instant' });
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = null;
    track.classList.remove('is-dragging');
    show();
  };
  thumb.addEventListener('pointerup', endDrag);
  thumb.addEventListener('pointercancel', endDrag);
  // Click on the track: centre the thumb there.
  track.addEventListener('pointerdown', (ev) => {
    if (ev.target !== track || ev.button !== 0 || !travel) return;
    const r = track.getBoundingClientRect();
    const k = Math.min(1, Math.max(0, (ev.clientY - r.top - thumbH / 2) / travel));
    scrollTo({ top: k * range, behavior: 'smooth' });
  });

  measure();
  place();
}
