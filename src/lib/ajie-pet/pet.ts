/**
 * Pixel Ajie: a small cat that lives along the bottom of the Ajie page.
 *
 * He wanders, sits, grooms and falls asleep when nobody is around. Pet him (click / tap), pick him
 * up and drop him (drag), or click an empty spot and he comes over. The page tells him about likes,
 * view switches and opened posts (react); while a post is open he hops into it and sits on its
 * bottom edge, beside the like button. Near the top of the page he likes to rest on the Instagram
 * link (perch), now and then batting a paw at its icon, as if to say "click here". Only the cat itself takes pointer events, so the page
 * underneath stays usable; he is decorative (aria-hidden) and pauses while the tab is hidden.
 */
import { ANIMS, FRAME, SHEET_SRC, buildSheet, type Anim } from './sprite';

export type PetEvent = 'like' | 'unlike' | 'view' | 'open' | 'close' | 'album-end';
export interface Pet {
  react(e: PetEvent, el?: HTMLElement): void;
  destroy(): void;
}

type Mode = 'idle' | 'walk' | 'run' | 'sit' | 'lie' | 'play' | 'stretch' | 'arch' | 'groom' | 'sleep' | 'jump' | 'happy' | 'held' | 'fall' | 'surprised';

const ANIM_OF: Record<Mode, Anim> = {
  idle: 'idle',
  walk: 'walk',
  run: 'run',
  sit: 'sit',
  lie: 'lie',
  play: 'play',
  stretch: 'stretch',
  arch: 'arch',
  groom: 'groom',
  sleep: 'sleep',
  jump: 'jump',
  fall: 'jump',
  happy: 'happy',
  held: 'held',
  surprised: 'surprised',
};
const FPS: Partial<Record<Anim, number>> = { idle: 2.5, walk: 10, run: 14, sit: 2.5, lie: 2, play: 3.5, stretch: 3, arch: 3, groom: 5, sleep: 1, happy: 8, held: 3, surprised: 6 };
/** Elements a click on which is the page's business, not the cat's. */
const INTERACTIVE = 'a,button,input,select,textarea,label,summary,video,audio,dialog,[role="button"],[contenteditable],.ajie-pet__cat';
/** How far (sprite pixels) he sinks into the Instagram link when on it: the pill's rounded top would
 * otherwise leave a gap under him, as if he floated. */
const PERCH_SINK = 3;
/** One pass of a stretch row (4 frames at 3 fps), so it plays once and does not start over. */
const STRETCH_MS = 1300;
const HEART = '<svg viewBox="0 0 7 6" shape-rendering="crispEdges"><path fill="#e2474f" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/><path fill="#ffb3b8" d="M1 1h1v1H1z"/></svg>';

const CSS = `
.ajie-pet{position:fixed;left:0;bottom:env(safe-area-inset-bottom,0px);width:0;height:0;z-index:40;pointer-events:none}
.ajie-pet__cat{position:absolute;left:0;bottom:0;pointer-events:auto;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;will-change:transform}
.ajie-pet__cat.is-held{cursor:grabbing}
.ajie-pet__cat canvas{display:block;width:100%;height:100%;image-rendering:pixelated}
.ajie-pet__fx{position:absolute;inset:0;pointer-events:none}
.ajie-pet__heart{position:absolute;left:50%;top:10%;width:14px;height:12px;animation:ajie-pet-up 1.1s ease-out forwards}
.ajie-pet__heart svg{display:block;width:100%;height:100%}
.ajie-pet__say{position:absolute;left:50%;bottom:92%;translate:-50% 0;padding:1px 8px;border:2px solid #4a2a12;border-radius:6px;background:#fff8ee;color:#4a2a12;font:700 12px/1.5 system-ui,sans-serif;white-space:nowrap;animation:ajie-pet-pop .18s ease-out}
.ajie-pet__z{position:absolute;left:68%;top:30%;color:var(--muted,#8a94a6);font:700 13px/1 ui-monospace,monospace;animation:ajie-pet-z 2.2s ease-out forwards}
@keyframes ajie-pet-up{from{opacity:0;transform:translate(-50%,0) scale(.5)}20%{opacity:1}to{opacity:0;transform:translate(calc(-50% + var(--dx,0px)),-40px) scale(1.1)}}
@keyframes ajie-pet-pop{from{opacity:0;scale:.6}}
@keyframes ajie-pet-z{from{opacity:0;transform:translate(0,0) scale(.7)}25%{opacity:1}to{opacity:0;transform:translate(14px,-30px) scale(1.2)}}
`;

export function startPet(opts: { meow: () => string; perch?: HTMLElement | null }): Pet {
  const perch = opts.perch ?? null;
  if (!document.getElementById('ajie-pet-css')) {
    const style = document.createElement('style');
    style.id = 'ajie-pet-css';
    style.textContent = CSS;
    document.head.append(style);
  }
  const host = document.createElement('div');
  host.className = 'ajie-pet';
  host.setAttribute('aria-hidden', 'true');
  const cat = document.createElement('div');
  cat.className = 'ajie-pet__cat';
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = FRAME;
  const fx = document.createElement('div');
  fx.className = 'ajie-pet__fx';
  cat.append(canvas, fx);
  host.append(cat);
  document.body.append(host);
  const g = canvas.getContext('2d')!;

  let sheet: CanvasImageSource = buildSheet();
  if (SHEET_SRC) {
    const img = new Image();
    img.onload = () => ((sheet = img), (drawn = ''));
    img.src = SHEET_SRC;
  }

  // ---- State. x: centre, y: height of the feet above the floor (px), facing: 1 right, -1 left.
  // room: the open post he is in (its bottom edge is his floor), or null for the page.
  // perched: resting on top of the Instagram link (perch), scrolling with the page.
  let room: HTMLElement | null = null;
  let perched = false;
  let scale = 3, size = FRAME * scale, k = 1;
  const resize = () => {
    scale = room || perched || innerWidth < 640 ? 2 : 3;
    size = FRAME * scale;
    k = scale / 3;
    cat.style.width = cat.style.height = `${size}px`;
    x = clampX(x);
  };
  /** Where he may stand: the page's width, or the text side of an open post (clear of its corners and arrows). */
  /** On the perch, his reaching paw (sprite column 9) comes down on the link's icon. */
  const perchX = () => {
    const icon = (perch!.querySelector('svg') ?? perch!).getBoundingClientRect();
    return icon.left + icon.width / 2 - 9 * scale + size / 2;
  };
  const perchVisible = () => {
    if (!perch) return false;
    const r = perch.getBoundingClientRect();
    return r.width > 0 && r.top > 70 && r.bottom < innerHeight - 40;
  };
  const bounds = (): [number, number] => {
    if (perched) return [perchX(), perchX()];
    if (!room) return [size * 0.4, innerWidth - size * 0.4];
    const box = (room.querySelector<HTMLElement>('.ajie-post__text') ?? room).getBoundingClientRect();
    const inset = innerWidth < 900 ? 64 : 24; // phones: the prev / next arrows sit in the bottom corners
    const lo = box.left + inset + size / 2, hi = box.right - inset - size / 2;
    return lo < hi ? [lo, hi] : [(box.left + box.right) / 2, (box.left + box.right) / 2];
  };
  const clampX = (v: number) => {
    const [lo, hi] = bounds();
    return Math.min(hi, Math.max(lo, v));
  };
  /** Height of his floor above the bottom of the screen. */
  let lift = 0;
  const placeFloor = () => {
    if (perched && perch) {
      // In the page (absolute), so he scrolls with the link instead of trailing it a frame behind.
      const r = perch.getBoundingClientRect();
      const base = getComputedStyle(document.body).position === 'static' ? -scrollY : document.body.getBoundingClientRect().top;
      host.style.position = 'absolute';
      host.style.top = `${r.top - base + PERCH_SINK * scale}px`;
      host.style.bottom = 'auto';
      return;
    }
    host.style.position = '';
    host.style.top = '';
    if (room && !room.hasAttribute('open')) return; // closing: keep the last edge (it has no box now)
    lift = room ? Math.max(0, innerHeight - room.getBoundingClientRect().bottom + 1) : 0;
    host.style.bottom = room ? `${lift}px` : '';
  };
  let x = -size, y = 0, vy = 0, facing = 1;
  let mode: Mode = 'walk', since = 0, until = Infinity, target = 0;
  let then: (() => void) | null = null;
  let crouchUntil = 0, blinkUntil = 0, nextZ = 0;
  let lastTouch = performance.now();
  let pets: number[] = [];
  let drawn = '';
  resize();
  x = -size * 0.5;
  target = innerWidth * (0.15 + Math.random() * 0.3);

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  let climbing = false;
  const set = (m: Mode, ms = Infinity, next: (() => void) | null = null) => {
    climbing = false;
    mode = m;
    since = performance.now();
    until = since + ms;
    then = next;
  };
  const touch = () => (lastTouch = performance.now());
  const goTo = (to: number, next: (() => void) | null = null, run?: boolean) => {
    target = clampX(to);
    if (Math.abs(target - x) < 8) return next ? next() : rest();
    set(run ?? Math.abs(target - x) > 260 ? 'run' : 'walk', Infinity, next);
  };
  /** Sits, or lies down, and watches. */
  const rest = (min = 3000, max = 7000) => set(Math.random() < 0.5 ? 'sit' : 'lie', rand(min, max));
  const jump = (power: number, next: (() => void) | null = null) => {
    set('jump', Infinity, next);
    crouchUntil = performance.now() + 120;
    vy = power * k;
  };

  /** Waking up on his own: a long stretch forward, then the back arched, then up. */
  const wake = () =>
    set('stretch', STRETCH_MS, () => set('arch', STRETCH_MS, () => (perched ? rest(3000, 6000) : set('idle', rand(1500, 3000)))));

  // ---- The perch (Instagram link).
  const enterPerch = (from = 0) => {
    if (!perch) return;
    perched = true;
    room = null;
    if (host.parentElement !== document.body) document.body.append(host);
    resize();
    placeFloor();
    x = perchX();
    y = from;
    vy = 0;
    if (from > 0) set('fall', Infinity, () => rest(4000, 8000));
    else rest(4000, 8000);
  };
  /** Down to the floor of the screen, from wherever the link is (above the screen: drops in from the top). */
  const leavePerch = (next: (() => void) | null = null) => {
    if (!perched || !perch) return;
    const top = perch.getBoundingClientRect().top + PERCH_SINK * scale;
    perched = false;
    placeFloor();
    resize();
    y = Math.max(0, Math.min(innerHeight + size, innerHeight - top));
    vy = 0;
    set('fall', Infinity, next);
  };
  let climbTo = 0;
  /** A big jump up onto the link. */
  const climb = () => {
    if (!perch || !perchVisible()) return rest();
    climbTo = innerHeight - perch.getBoundingClientRect().top;
    jump(Math.sqrt(2 * 1600 * k * (climbTo + 30)) / k);
    climbing = true;
  };
  const perchDecide = () => {
    const quiet = performance.now() - lastTouch;
    const r = Math.random();
    if (quiet > 45_000 && r < 0.25) return set('sleep', rand(20_000, 40_000), wake);
    if (r < 0.4) return set('play', rand(2500, 4000));
    if (r < 0.85) return rest(4000, 9000);
    if (r < 0.93) return set('groom', rand(2500, 4000));
    leavePerch();
  };

  /** What to do next when nothing is going on. */
  const decide = () => {
    if (perched) return perchDecide();
    if (!room && perchVisible() && Math.random() < 0.2) return goTo(perchX(), climb);
    const quiet = performance.now() - lastTouch;
    if (quiet > 45_000 && mode !== 'sleep' && Math.random() < 0.6) return set('sleep', rand(40_000, 90_000), wake);
    const r = Math.random();
    const [lo, hi] = bounds();
    if (r < 0.45 && hi - lo > 150) {
      let to = rand(lo, hi);
      if (Math.abs(to - x) < 120) to = x < (lo + hi) / 2 ? x + rand(150, 300) : x - rand(150, 300);
      goTo(to, () => (Math.random() < 0.6 ? rest() : set('idle', rand(1500, 3500))), false);
    } else if (r < 0.75) rest();
    else if (r < 0.88) set('groom', rand(2500, 4500));
    else if (r < 0.94) set('idle', rand(2000, 5000));
    else set('stretch', STRETCH_MS, () => set('idle', rand(1500, 3000)));
  };

  // ---- Effects.
  const heart = (n = 1) => {
    for (let i = 0; i < n; i++) {
      const h = document.createElement('span');
      h.className = 'ajie-pet__heart';
      h.innerHTML = HEART;
      h.style.setProperty('--dx', `${rand(-18, 18)}px`);
      h.style.animationDelay = `${i * 120}ms`;
      h.addEventListener('animationend', () => h.remove());
      fx.append(h);
    }
  };
  let sayTimer = 0;
  const say = (text: string) => {
    fx.querySelector('.ajie-pet__say')?.remove();
    const s = document.createElement('span');
    s.className = 'ajie-pet__say';
    s.textContent = text;
    fx.append(s);
    clearTimeout(sayTimer);
    sayTimer = window.setTimeout(() => s.remove(), 1600);
  };
  const zzz = () => {
    const z = document.createElement('span');
    z.className = 'ajie-pet__z';
    z.textContent = 'z';
    z.addEventListener('animationend', () => z.remove());
    fx.append(z);
  };

  // ---- Petting.
  const pet = () => {
    touch();
    const now = performance.now();
    pets = pets.filter((t) => now - t < 4000);
    pets.push(now);
    if (mode === 'sleep') {
      say('!?');
      return set('surprised', 800, () => set('idle', 2000));
    }
    if (pets.length >= 6) {
      // Enough is enough: off to the other side.
      pets = [];
      say('!!');
      const [lo, hi] = bounds();
      return set('surprised', 450, () => (perched ? leavePerch(rest) : goTo(x < (lo + hi) / 2 ? hi : lo, rest, true)));
    }
    heart(pets.length > 2 ? 2 : 1);
    if (pets.length === 1 || Math.random() < 0.4) say(opts.meow());
    set('happy', 1400, () => set('idle', rand(1500, 3000)));
  };

  // ---- Pointer on the cat: tap to pet, drag to carry.
  let down: { id: number; x0: number; y0: number; dragging: boolean } | null = null;
  const holdAt = (cx: number, cy: number) => {
    const floor = host.getBoundingClientRect().bottom;
    x = clampX(cx);
    y = Math.max(0, Math.min(innerHeight - size, floor - cy - size * 0.78));
  };
  const onCatDown = (e: PointerEvent) => {
    if (e.button > 0) return;
    e.preventDefault();
    e.stopPropagation();
    cat.setPointerCapture(e.pointerId);
    down = { id: e.pointerId, x0: e.clientX, y0: e.clientY, dragging: false };
  };
  const onCatMove = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    if (!down.dragging && Math.hypot(e.clientX - down.x0, e.clientY - down.y0) > 6) {
      down.dragging = true;
      touch();
      if (perched) leavePerch();
      cat.classList.add('is-held');
      set('held');
    }
    if (down.dragging) holdAt(e.clientX, e.clientY);
  };
  const onCatUp = (e: PointerEvent) => {
    if (!down || e.pointerId !== down.id) return;
    const was = down;
    down = null;
    if (was.dragging) {
      cat.classList.remove('is-held');
      vy = 0;
      // Let go over the Instagram link: he settles on it.
      const r = perch?.getBoundingClientRect();
      if (r && !room && e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 90 && e.clientY < r.bottom + 20) enterPerch(size * 0.3);
      else set('fall');
    } else if (e.type === 'pointerup') pet();
  };
  cat.addEventListener('pointerdown', onCatDown);
  cat.addEventListener('pointermove', onCatMove);
  cat.addEventListener('pointerup', onCatUp);
  cat.addEventListener('pointercancel', onCatUp);
  cat.addEventListener('click', (e) => e.stopPropagation());
  cat.addEventListener('contextmenu', (e) => e.preventDefault());

  // ---- The page around him.
  const onPageClick = (e: MouseEvent) => {
    if (mode === 'held' || (e.target as Element).closest?.(INTERACTIVE)) return;
    if (document.querySelector('dialog[open]')) return;
    touch();
    const come = () => goTo(e.clientX, () => set('sit', rand(2500, 5000)));
    if (perched) leavePerch(come);
    else if (mode === 'sleep') set('surprised', 500, come);
    else if (mode !== 'jump' && mode !== 'fall') come();
  };
  const onPointerMove = (e: PointerEvent) => {
    // Turns to look at the mouse when it is not busy.
    if (e.pointerType !== 'mouse' || !(mode === 'idle' || mode === 'sit' || mode === 'lie')) return;
    if (Math.abs(e.clientX - x) > 30) facing = e.clientX > x ? 1 : -1;
  };
  const onResize = () => resize();
  document.addEventListener('click', onPageClick);
  document.addEventListener('pointermove', onPointerMove, { passive: true });
  addEventListener('resize', onResize);

  // ---- Loop.
  let raf = 0, last = performance.now();
  const step = (now: number, dt: number) => {
    switch (mode) {
      case 'walk':
      case 'run': {
        const speed = (mode === 'run' ? 200 : 55) * k;
        const d = target - x;
        facing = d > 0 ? 1 : -1;
        if (Math.abs(d) <= speed * dt) {
          x = target;
          const next = then;
          if (next) (then = null), next();
          else decide();
        } else x += Math.sign(d) * speed * dt;
        break;
      }
      case 'jump':
      case 'fall': {
        if (now < crouchUntil) break;
        vy -= 1600 * k * dt;
        y += vy * dt;
        // Climbing: at the top of the jump, onto the link.
        if (climbing && vy <= 0) return enterPerch(Math.max(0, y - climbTo));
        if (y <= 0) {
          const hard = vy < -900 * k;
          y = 0;
          vy = 0;
          const next = then;
          then = null;
          if (next) next();
          else if (hard) set('surprised', 600, () => set('idle', 2000));
          else set('idle', rand(1500, 3000));
        }
        break;
      }
      case 'held':
        break;
      case 'sleep':
        if (now > nextZ) (zzz(), (nextZ = now + 1500));
      // falls through
      default:
        if (now >= until) {
          const next = then;
          then = null;
          if (next) next();
          else decide();
        }
    }
  };
  const draw = (now: number) => {
    const anim = ANIM_OF[mode];
    const { row, frames } = ANIMS[anim];
    let f = 0;
    if (anim === 'jump') f = mode === 'jump' && now < crouchUntil ? 0 : vy > 0 ? 1 : 2;
    else if (anim === 'idle') {
      if (now > blinkUntil + 2500 && Math.random() < 0.01) blinkUntil = now + 160;
      f = now < blinkUntil ? 3 : [0, 1, 2, 1][Math.floor(((now - since) / 1000) * (FPS.idle ?? 1)) % 4];
    } else f = Math.floor(((now - since) / 1000) * (FPS[anim] ?? 1)) % frames;
    const key = `${anim}:${f}:${facing}`;
    if (key !== drawn) {
      drawn = key;
      g.clearRect(0, 0, FRAME, FRAME);
      g.drawImage(sheet, f * FRAME, row * FRAME, FRAME, FRAME, 0, 0, FRAME, FRAME);
      canvas.style.transform = facing < 0 && anim !== 'play' ? 'scaleX(-1)' : '';
    }
    cat.style.transform = `translate(${(x - size / 2).toFixed(1)}px, ${(-y).toFixed(1)}px)`;
  };
  const tick = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (perched && perch) {
      // Scrolled away from the link: he jumps down and follows (drops in from the top of the screen).
      const r = perch.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) leavePerch();
      else if (mode !== 'held') x = perchX();
    }
    if (room || perched) placeFloor();
    step(now, dt);
    draw(now);
    raf = requestAnimationFrame(tick);
  };
  const onVisibility = () => {
    cancelAnimationFrame(raf);
    if (!document.hidden) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);
  // Hovering the link: he plays with its icon.
  const onPerchEnter = () => {
    if (perched && (mode === 'sit' || mode === 'lie' || mode === 'idle' || mode === 'groom')) set('play', rand(2500, 3500));
  };
  perch?.addEventListener('pointerenter', onPerchEnter);
  // Starts on the link when it is in view, otherwise walks in from the side.
  if (perchVisible()) enterPerch();
  else set('walk', Infinity, rest);
  raf = requestAnimationFrame(tick);

  /** Settles in the post's corner, looking at the text. */
  const settle = () => {
    facing = -1;
    rest(8000, 15000);
  };
  /** Hops into an open post: drops onto its bottom edge, beside the like button. */
  const visit = (d: HTMLElement) => {
    const slot = d.querySelector<HTMLElement>('[data-pet-slot]');
    if (!slot) return set('sit', rand(4000, 8000));
    const moving = room !== null; // stepping from one post to the next: already inside
    perched = false;
    host.style.position = '';
    host.style.top = '';
    room = d;
    slot.append(host);
    resize();
    placeFloor();
    x = bounds()[1];
    if (moving) return settle();
    // The post's opening animation (a scale) would carry him along: wait it out, then drop in.
    cat.style.visibility = 'hidden';
    set('held');
    window.setTimeout(() => {
      cat.style.visibility = '';
      if (room !== d || mode !== 'held') return;
      placeFloor();
      x = bounds()[1];
      y = size * 1.2;
      vy = 0;
      set('fall', Infinity, settle);
    }, 380);
  };
  /** Back to the page when the post closes: drops from where the post's edge was. */
  const leave = () => {
    const from = lift;
    room = null;
    document.body.append(host);
    placeFloor();
    resize();
    y = from;
    vy = 0;
    set('fall');
  };

  return {
    react(e, el) {
      if (mode === 'held' && e !== 'close') return;
      touch();
      if (e === 'like') jump(560, () => (heart(3), set('happy', 1500, () => set('idle', 2000))));
      else if (e === 'unlike') set('sit', rand(2500, 4000));
      else if (e === 'view') jump(380);
      else if (e === 'album-end') (heart(1), set('happy', 1200));
      else if (e === 'open' && el) visit(el);
      else if (e === 'close') {
        // Stepping to the next post closes the old one after the new one opened: stay there.
        if (!room || room.hasAttribute('open')) return;
        leave();
      }
    },
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(sayTimer);
      document.removeEventListener('click', onPageClick);
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('visibilitychange', onVisibility);
      removeEventListener('resize', onResize);
      perch?.removeEventListener('pointerenter', onPerchEnter);
      host.remove();
    },
  };
}
