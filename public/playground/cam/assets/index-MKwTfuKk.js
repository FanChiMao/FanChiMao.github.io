(function () {
  const e = document.createElement("link").relList;
  if (e && e.supports && e.supports("modulepreload")) return;
  for (const i of document.querySelectorAll('link[rel="modulepreload"]')) s(i);
  new MutationObserver((i) => {
    for (const r of i)
      if (r.type === "childList")
        for (const o of r.addedNodes)
          o.tagName === "LINK" && o.rel === "modulepreload" && s(o);
  }).observe(document, { childList: !0, subtree: !0 });
  function n(i) {
    const r = {};
    return (
      i.integrity && (r.integrity = i.integrity),
      i.referrerPolicy && (r.referrerPolicy = i.referrerPolicy),
      i.crossOrigin === "use-credentials"
        ? (r.credentials = "include")
        : i.crossOrigin === "anonymous"
          ? (r.credentials = "omit")
          : (r.credentials = "same-origin"),
      r
    );
  }
  function s(i) {
    if (i.ep) return;
    i.ep = !0;
    const r = n(i);
    fetch(i.href, r);
  }
})();
/**
 * @vue/shared v3.5.44
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ function Es(t) {
  const e = Object.create(null);
  for (const n of t.split(",")) e[n] = 1;
  return (n) => n in e;
}
const tt = {},
  _e = [],
  Gt = () => {},
  Ni = () => !1,
  Vn = (t) =>
    t.charCodeAt(0) === 111 &&
    t.charCodeAt(1) === 110 &&
    (t.charCodeAt(2) > 122 || t.charCodeAt(2) < 97),
  Bn = (t) => t.startsWith("onUpdate:"),
  ht = Object.assign,
  Ms = (t, e) => {
    const n = t.indexOf(e);
    n > -1 && t.splice(n, 1);
  },
  so = Object.prototype.hasOwnProperty,
  q = (t, e) => so.call(t, e),
  U = Array.isArray,
  ce = (t) => fn(t) === "[object Map]",
  re = (t) => fn(t) === "[object Set]",
  Zs = (t) => fn(t) === "[object Date]",
  N = (t) => typeof t == "function",
  it = (t) => typeof t == "string",
  Yt = (t) => typeof t == "symbol",
  Q = (t) => t !== null && typeof t == "object",
  Vi = (t) => (Q(t) || N(t)) && N(t.then) && N(t.catch),
  Bi = Object.prototype.toString,
  fn = (t) => Bi.call(t),
  io = (t) => fn(t).slice(8, -1),
  Wi = (t) => fn(t) === "[object Object]",
  Cs = (t) =>
    it(t) && t !== "NaN" && t[0] !== "-" && "" + parseInt(t, 10) === t,
  Ge = Es(
    ",key,ref,ref_for,ref_key,onVnodeBeforeMount,onVnodeMounted,onVnodeBeforeUpdate,onVnodeUpdated,onVnodeBeforeUnmount,onVnodeUnmounted",
  ),
  Wn = (t) => {
    const e = Object.create(null);
    return (n) => e[n] || (e[n] = t(n));
  },
  ro = /-\w/g,
  Dt = Wn((t) => t.replace(ro, (e) => e.slice(1).toUpperCase())),
  oo = /\B([A-Z])/g,
  Ae = Wn((t) => t.replace(oo, "-$1").toLowerCase()),
  ji = Wn((t) => t.charAt(0).toUpperCase() + t.slice(1)),
  ts = Wn((t) => (t ? `on${ji(t)}` : "")),
  Xt = (t, e) => !Object.is(t, e),
  wn = (t, ...e) => {
    for (let n = 0; n < t.length; n++) t[n](...e);
  },
  Ki = (t, e, n, s = !1) => {
    Object.defineProperty(t, e, {
      configurable: !0,
      enumerable: !1,
      writable: s,
      value: n,
    });
  },
  zi = (t) => {
    const e = parseFloat(t);
    return isNaN(e) ? t : e;
  };
let ti;
const jn = () =>
  ti ||
  (ti =
    typeof globalThis < "u"
      ? globalThis
      : typeof self < "u"
        ? self
        : typeof window < "u"
          ? window
          : typeof global < "u"
            ? global
            : {});
function Ee(t) {
  if (U(t)) {
    const e = {};
    for (let n = 0; n < t.length; n++) {
      const s = t[n],
        i = it(s) ? uo(s) : Ee(s);
      if (i) for (const r in i) e[r] = i[r];
    }
    return e;
  } else if (it(t) || Q(t)) return t;
}
const lo = /;(?![^(]*\))/g,
  ao = /:([^]+)/,
  co = /"(?:[^"\\]|\\[^])*"|'(?:[^'\\]|\\[^])*'|\\[^]|\/\*[^]*?\*\//g;
function uo(t) {
  const e = {};
  return (
    t
      .replace(co, (n) => (n.startsWith("/*") ? "" : n))
      .split(lo)
      .forEach((n) => {
        if (n) {
          const s = n.split(ao);
          s.length > 1 && (e[s[0].trim()] = s[1].trim());
        }
      }),
    e
  );
}
function Me(t) {
  let e = "";
  if (it(t)) e = t;
  else if (U(t))
    for (let n = 0; n < t.length; n++) {
      const s = Me(t[n]);
      s && (e += s + " ");
    }
  else if (Q(t)) for (const n in t) t[n] && (e += n + " ");
  return e.trim();
}
const fo =
    "itemscope,allowfullscreen,formnovalidate,ismap,nomodule,novalidate,playsinline,readonly",
  ho = Es(fo);
function qi(t) {
  return !!t || t === "";
}
function po(t, e, n) {
  if (t.length !== e.length) return !1;
  let s = !0;
  for (let i = 0; s && i < t.length; i++) s = oe(t[i], e[i], n);
  return s;
}
function ei(t, e, n) {
  if (t.size !== e.size) return !1;
  const s = Array.from(e),
    i = new Uint8Array(s.length);
  for (const r of t) {
    let o = -1;
    for (let l = 0; l < s.length; l++)
      if (!i[l] && oe(r, s[l], n)) {
        o = l;
        break;
      }
    if (o < 0) return !1;
    i[o] = 1;
  }
  return !0;
}
function mo(t, e, n) {
  let s = ce(t),
    i = ce(e);
  if (s || i || ((s = re(t)), (i = re(e)), s || i))
    return s && i ? ei(t, e, n) : !1;
  const r = Object.keys(t).length,
    o = Object.keys(e).length;
  if (r !== o) return !1;
  for (const l in t) {
    const c = t.hasOwnProperty(l),
      f = e.hasOwnProperty(l);
    if ((c && !f) || (!c && f) || !oe(t[l], e[l], n)) return !1;
  }
  return String(t) === String(e);
}
function ni(t, e, n, s) {
  n || (n = [new Map(), new Map()]);
  const [i, r] = n;
  if (i.has(t) || r.has(e)) return i.get(t) === e && r.get(e) === t;
  (i.set(t, e), r.set(e, t));
  const o = s(t, e, n);
  return (i.delete(t), r.delete(e), o);
}
function oe(t, e, n) {
  if (t === e) return !0;
  let s = Zs(t),
    i = Zs(e);
  return s || i
    ? s && i
      ? t.getTime() === e.getTime()
      : !1
    : ((s = Yt(t)),
      (i = Yt(e)),
      s || i
        ? t === e
        : ((s = U(t)),
          (i = U(e)),
          s || i
            ? s && i
              ? ni(t, e, n, po)
              : !1
            : ((s = Q(t)),
              (i = Q(e)),
              s || i
                ? !s || !i
                  ? !1
                  : ni(t, e, n, mo)
                : String(t) === String(e))));
}
function As(t, e) {
  return t.findIndex((n) => oe(n, e));
}
const Xi = (t) => !!(t && t.__v_isRef === !0),
  j = (t) =>
    it(t)
      ? t
      : t == null
        ? ""
        : U(t) || (Q(t) && (t.toString === Bi || !N(t.toString)))
          ? Xi(t)
            ? j(t.value)
            : JSON.stringify(t, Gi, 2)
          : String(t),
  Gi = (t, e) =>
    Xi(e)
      ? Gi(t, e.value)
      : ce(e)
        ? {
            [`Map(${e.size})`]: [...e.entries()].reduce(
              (n, [s, i], r) => ((n[es(s, r) + " =>"] = i), n),
              {},
            ),
          }
        : re(e)
          ? { [`Set(${e.size})`]: [...e.values()].map((n) => es(n)) }
          : Yt(e)
            ? es(e)
            : Q(e) && !U(e) && !Wi(e)
              ? String(e)
              : e,
  es = (t, e = "") => {
    var n;
    return Yt(t) ? `Symbol(${(n = t.description) != null ? n : e})` : t;
  };
/**
 * @vue/reactivity v3.5.44
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let dt;
class go {
  constructor(e = !1) {
    ((this.detached = e),
      (this._active = !0),
      (this._on = 0),
      (this.effects = []),
      (this.cleanups = []),
      (this._isPaused = !1),
      (this._warnOnRun = !0),
      (this.__v_skip = !0),
      !e &&
        dt &&
        (dt.active
          ? ((this.parent = dt),
            (this.index = (dt.scopes || (dt.scopes = [])).push(this) - 1))
          : ((this._active = !1), (this._warnOnRun = !1))));
  }
  get active() {
    return this._active;
  }
  pause() {
    if (this._active) {
      this._isPaused = !0;
      let e, n;
      if (this.scopes) {
        const s = this.scopes.slice();
        for (e = 0, n = s.length; e < n; e++) s[e].pause();
      }
      for (e = 0, n = this.effects.length; e < n; e++) this.effects[e].pause();
    }
  }
  resume() {
    if (this._active && this._isPaused) {
      this._isPaused = !1;
      let e, n;
      if (this.scopes) {
        const i = this.scopes.slice();
        for (e = 0, n = i.length; e < n; e++) i[e].resume();
      }
      const s = this.effects.slice();
      for (e = 0, n = s.length; e < n; e++) s[e].resume();
    }
  }
  run(e) {
    if (this._active) {
      const n = dt;
      try {
        return ((dt = this), e());
      } finally {
        dt = n;
      }
    }
  }
  on() {
    ++this._on === 1 && ((this.prevScope = dt), (dt = this));
  }
  off() {
    if (this._on > 0 && --this._on === 0) {
      if (dt === this) dt = this.prevScope;
      else {
        let e = dt;
        for (; e;) {
          if (e.prevScope === this) {
            e.prevScope = this.prevScope;
            break;
          }
          e = e.prevScope;
        }
      }
      this.prevScope = void 0;
    }
  }
  stop(e) {
    if (this._active) {
      this._active = !1;
      let n, s;
      for (n = 0, s = this.effects.length; n < s; n++) this.effects[n].stop();
      for (this.effects.length = 0, n = 0, s = this.cleanups.length; n < s; n++)
        this.cleanups[n]();
      if (((this.cleanups.length = 0), this.scopes)) {
        const i = this.scopes.slice();
        for (n = 0, s = i.length; n < s; n++) i[n].stop(!0);
        this.scopes.length = 0;
      }
      if (!this.detached && this.parent && !e) {
        const i = this.parent.scopes.pop();
        i &&
          i !== this &&
          ((this.parent.scopes[this.index] = i), (i.index = this.index));
      }
      this.parent = void 0;
    }
  }
}
function vo() {
  return dt;
}
let et;
const ns = new WeakSet();
class Yi {
  constructor(e) {
    ((this.fn = e),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 5),
      (this.next = void 0),
      (this.cleanup = void 0),
      (this.scheduler = void 0),
      dt && (dt.active ? dt.effects.push(this) : (this.flags &= -2)));
  }
  pause() {
    this.flags |= 64;
  }
  resume() {
    this.flags & 64 &&
      ((this.flags &= -65), ns.has(this) && (ns.delete(this), this.trigger()));
  }
  notify() {
    (this.flags & 2 && !(this.flags & 32)) || this.flags & 8 || Ji(this);
  }
  run() {
    if (!(this.flags & 1)) return this.fn();
    ((this.flags |= 2), si(this), Zi(this));
    const e = et,
      n = Lt;
    ((et = this), (Lt = !0));
    try {
      return this.fn();
    } finally {
      (tr(this), (et = e), (Lt = n), (this.flags &= -3));
    }
  }
  stop() {
    if (this.flags & 1) {
      for (let e = this.deps; e; e = e.nextDep) Is(e);
      ((this.deps = this.depsTail = void 0),
        si(this),
        this.onStop && this.onStop(),
        (this.flags &= -2));
    }
  }
  trigger() {
    this.flags & 64
      ? ns.add(this)
      : this.scheduler
        ? this.scheduler()
        : this.runIfDirty();
  }
  runIfDirty() {
    ds(this) && this.run();
  }
  get dirty() {
    return ds(this);
  }
}
let Qi = 0,
  Ye,
  Qe;
function Ji(t, e = !1) {
  if (((t.flags |= 8), e)) {
    ((t.next = Qe), (Qe = t));
    return;
  }
  ((t.next = Ye), (Ye = t));
}
function Ps() {
  Qi++;
}
function Rs() {
  if (--Qi > 0) return;
  if (Qe) {
    let e = Qe;
    for (Qe = void 0; e;) {
      const n = e.next;
      ((e.next = void 0), (e.flags &= -9), (e = n));
    }
  }
  let t;
  for (; Ye;) {
    let e = Ye;
    for (Ye = void 0; e;) {
      const n = e.next;
      if (((e.next = void 0), (e.flags &= -9), e.flags & 1))
        try {
          e.trigger();
        } catch (s) {
          t || (t = s);
        }
      e = n;
    }
  }
  if (t) throw t;
}
function Zi(t) {
  for (let e = t.deps; e; e = e.nextDep)
    ((e.version = -1),
      (e.prevActiveLink = e.dep.activeLink),
      (e.dep.activeLink = e));
}
function tr(t) {
  let e,
    n = t.depsTail,
    s = n;
  for (; s;) {
    const i = s.prevDep;
    (s.version === -1 ? (s === n && (n = i), Is(s), yo(s)) : (e = s),
      (s.dep.activeLink = s.prevActiveLink),
      (s.prevActiveLink = void 0),
      (s = i));
  }
  ((t.deps = e), (t.depsTail = n));
}
function ds(t) {
  for (let e = t.deps; e; e = e.nextDep)
    if (
      e.dep.version !== e.version ||
      (e.dep.computed && (er(e.dep.computed) || e.dep.version !== e.version))
    )
      return !0;
  return !!t._dirty;
}
function er(t) {
  if (
    (t.flags & 4 && !(t.flags & 16)) ||
    ((t.flags &= -17), t.globalVersion === en) ||
    ((t.globalVersion = en),
    !t.isSSR && t.flags & 128 && ((!t.deps && !t._dirty) || !ds(t)))
  )
    return;
  t.flags |= 2;
  const e = t.dep,
    n = et,
    s = Lt;
  ((et = t), (Lt = !0));
  try {
    Zi(t);
    const i = t.fn(t._value);
    (e.version === 0 || Xt(i, t._value)) &&
      ((t.flags |= 128), (t._value = i), e.version++);
  } catch (i) {
    throw (e.version++, i);
  } finally {
    ((et = n), (Lt = s), tr(t), (t.flags &= -3));
  }
}
function Is(t, e = !1) {
  const { dep: n, prevSub: s, nextSub: i } = t;
  if (
    (s && ((s.nextSub = i), (t.prevSub = void 0)),
    i && ((i.prevSub = s), (t.nextSub = void 0)),
    n.subs === t && ((n.subs = s), !s && n.computed))
  ) {
    n.computed.flags &= -5;
    for (let r = n.computed.deps; r; r = r.nextDep) Is(r, !0);
  }
  !e && !--n.sc && n.map && n.map.delete(n.key);
}
function yo(t) {
  const { prevDep: e, nextDep: n } = t;
  (e && ((e.nextDep = n), (t.prevDep = void 0)),
    n && ((n.prevDep = e), (t.nextDep = void 0)));
}
let Lt = !0;
const nr = [];
function Qt() {
  (nr.push(Lt), (Lt = !1));
}
function Jt() {
  const t = nr.pop();
  Lt = t === void 0 ? !0 : t;
}
function si(t) {
  const { cleanup: e } = t;
  if (((t.cleanup = void 0), e)) {
    const n = et;
    et = void 0;
    try {
      e();
    } finally {
      et = n;
    }
  }
}
let en = 0;
class bo {
  constructor(e, n) {
    ((this.sub = e),
      (this.dep = n),
      (this.version = n.version),
      (this.nextDep =
        this.prevDep =
        this.nextSub =
        this.prevSub =
        this.prevActiveLink =
          void 0));
  }
}
class ks {
  constructor(e) {
    ((this.computed = e),
      (this.version = 0),
      (this.activeLink = void 0),
      (this.subs = void 0),
      (this.map = void 0),
      (this.key = void 0),
      (this.sc = 0),
      (this.__v_skip = !0));
  }
  track(e) {
    if (!et || !Lt || et === this.computed) return;
    let n = this.activeLink;
    if (n === void 0 || n.sub !== et)
      ((n = this.activeLink = new bo(et, this)),
        et.deps
          ? ((n.prevDep = et.depsTail),
            (et.depsTail.nextDep = n),
            (et.depsTail = n))
          : (et.deps = et.depsTail = n),
        sr(n));
    else if (n.version === -1 && ((n.version = this.version), n.nextDep)) {
      const s = n.nextDep;
      ((s.prevDep = n.prevDep),
        n.prevDep && (n.prevDep.nextDep = s),
        (n.prevDep = et.depsTail),
        (n.nextDep = void 0),
        (et.depsTail.nextDep = n),
        (et.depsTail = n),
        et.deps === n && (et.deps = s));
    }
    return n;
  }
  trigger(e) {
    (this.version++, en++, this.notify(e));
  }
  notify(e) {
    Ps();
    try {
      for (let n = this.subs; n; n = n.prevSub)
        n.sub.notify() && n.sub.dep.notify();
    } finally {
      Rs();
    }
  }
}
function sr(t) {
  if ((t.dep.sc++, t.sub.flags & 4)) {
    const e = t.dep.computed;
    if (e && !t.dep.subs) {
      e.flags |= 20;
      for (let s = e.deps; s; s = s.nextDep) sr(s);
    }
    const n = t.dep.subs;
    (n !== t && ((t.prevSub = n), n && (n.nextSub = t)), (t.dep.subs = t));
  }
}
const hs = new WeakMap(),
  Te = Symbol(""),
  ps = Symbol(""),
  nn = Symbol("");
function gt(t, e, n) {
  if (Lt && et) {
    let s = hs.get(t);
    s || hs.set(t, (s = new Map()));
    let i = s.get(n);
    (i || (s.set(n, (i = new ks())), (i.map = s), (i.key = n)), i.track());
  }
}
function se(t, e, n, s, i, r) {
  const o = hs.get(t);
  if (!o) {
    en++;
    return;
  }
  const l = (c) => {
    c && c.trigger();
  };
  if ((Ps(), e === "clear")) o.forEach(l);
  else {
    const c = U(t),
      f = c && Cs(n);
    if (c && n === "length") {
      const u = Number(s);
      o.forEach((a, h) => {
        (h === "length" || h === nn || (!Yt(h) && h >= u)) && l(a);
      });
    } else
      switch (
        ((n !== void 0 || o.has(void 0)) && l(o.get(n)), f && l(o.get(nn)), e)
      ) {
        case "add":
          c ? f && l(o.get("length")) : (l(o.get(Te)), ce(t) && l(o.get(ps)));
          break;
        case "delete":
          c || (l(o.get(Te)), ce(t) && l(o.get(ps)));
          break;
        case "set":
          ce(t) && l(o.get(Te));
          break;
      }
  }
  Rs();
}
function Re(t) {
  const e = X(t);
  return e === t || (gt(e, "iterate", nn), It(t))
    ? e
    : Zt(t)
      ? ue(t)
        ? e.map((n) => fe(kt(n)))
        : e.map(fe)
      : e.map(kt);
}
function Kn(t) {
  return (gt((t = X(t)), "iterate", nn), t);
}
function Kt(t, e) {
  return Zt(t) ? fe(ue(t) ? kt(e) : e) : kt(e);
}
const xo = {
  __proto__: null,
  [Symbol.iterator]() {
    return ss(this, Symbol.iterator, (t) => Kt(this, t));
  },
  concat(...t) {
    return Re(this).concat(...t.map((e) => (U(e) ? Re(e) : e)));
  },
  entries() {
    return ss(this, "entries", (t) => ((t[1] = Kt(this, t[1])), t));
  },
  every(t, e) {
    return te(this, "every", t, e, void 0, arguments);
  },
  filter(t, e) {
    return te(
      this,
      "filter",
      t,
      e,
      (n) => n.map((s) => Kt(this, s)),
      arguments,
    );
  },
  find(t, e) {
    return te(this, "find", t, e, (n) => Kt(this, n), arguments);
  },
  findIndex(t, e) {
    return te(this, "findIndex", t, e, void 0, arguments);
  },
  findLast(t, e) {
    return te(this, "findLast", t, e, (n) => Kt(this, n), arguments);
  },
  findLastIndex(t, e) {
    return te(this, "findLastIndex", t, e, void 0, arguments);
  },
  forEach(t, e) {
    return te(this, "forEach", t, e, void 0, arguments);
  },
  includes(...t) {
    return is(this, "includes", t);
  },
  indexOf(...t) {
    return is(this, "indexOf", t);
  },
  join(t) {
    return Re(this).join(t);
  },
  lastIndexOf(...t) {
    return is(this, "lastIndexOf", t);
  },
  map(t, e) {
    return te(this, "map", t, e, void 0, arguments);
  },
  pop() {
    return Be(this, "pop");
  },
  push(...t) {
    return Be(this, "push", t);
  },
  reduce(t, ...e) {
    return ri(this, "reduce", t, e);
  },
  reduceRight(t, ...e) {
    return ri(this, "reduceRight", t, e);
  },
  shift() {
    return Be(this, "shift");
  },
  some(t, e) {
    return te(this, "some", t, e, void 0, arguments);
  },
  splice(...t) {
    return Be(this, "splice", t);
  },
  toReversed() {
    return Re(this).toReversed();
  },
  toSorted(t) {
    return Re(this).toSorted(t);
  },
  toSpliced(...t) {
    return Re(this).toSpliced(...t);
  },
  unshift(...t) {
    return Be(this, "unshift", t);
  },
  values() {
    return ss(this, "values", (t) => Kt(this, t));
  },
};
function ss(t, e, n) {
  const s = Kn(t),
    i = s[e],
    r = i.call(s);
  if (s !== t && !It(t)) {
    if (r[Symbol.toStringTag] === "Array Iterator") {
      const o = Object.create(Object.getPrototypeOf(r));
      return (
        (o.next = () => ii(r.next(), n)),
        i !== ir[e] &&
          Object.defineProperties(o, {
            return: {
              get() {
                const l = r.return;
                return typeof l == "function" ? l.bind(r) : l;
              },
            },
            throw: {
              get() {
                const l = r.throw;
                return typeof l == "function" ? l.bind(r) : l;
              },
            },
          }),
        o
      );
    }
    ((r._next = r.next), (r.next = () => ii(r._next(), n)));
  }
  return r;
}
function ii(t, e) {
  return (t.done || (t.value = e(t.value)), t);
}
const ir = Array.prototype;
function te(t, e, n, s, i, r) {
  const o = Kn(t),
    l = o !== t && !It(t),
    c = o[e];
  if (c !== ir[e]) {
    const a = c.apply(t, r);
    return l ? kt(a) : a;
  }
  let f = n;
  o !== t &&
    (l
      ? (f = function (a, h) {
          return n.call(this, Kt(t, a), h, t);
        })
      : n.length > 2 &&
        (f = function (a, h) {
          return n.call(this, a, h, t);
        }));
  const u = c.call(o, f, s);
  return l && i ? i(u) : u;
}
function ri(t, e, n, s) {
  const i = Kn(t),
    r = i !== t && !It(t);
  let o = n,
    l = !1;
  i !== t &&
    (r
      ? ((l = s.length === 0),
        (o = function (f, u, a) {
          return (
            l && ((l = !1), (f = Kt(t, f))),
            n.call(this, f, Kt(t, u), a, t)
          );
        }))
      : n.length > 3 &&
        (o = function (f, u, a) {
          return n.call(this, f, u, a, t);
        }));
  const c = i[e](o, ...s);
  return l ? Kt(t, c) : c;
}
function is(t, e, n) {
  const s = X(t);
  gt(s, "iterate", nn);
  const i = s[e](...n);
  return (i === -1 || i === !1) && Ds(n[0])
    ? ((n[0] = X(n[0])), s[e](...n))
    : i;
}
function Be(t, e, n = []) {
  (Qt(), Ps());
  const s = X(t)[e].apply(t, n);
  return (Rs(), Jt(), s);
}
const _o = Es("__proto__,__v_isRef,__isVue"),
  rr = new Set(
    Object.getOwnPropertyNames(Symbol)
      .filter((t) => t !== "arguments" && t !== "caller")
      .map((t) => Symbol[t])
      .filter(Yt),
  );
function wo(t) {
  Yt(t) || (t = String(t));
  const e = X(this);
  return (gt(e, "has", t), e.hasOwnProperty(t));
}
class or {
  constructor(e = !1, n = !1) {
    ((this._isReadonly = e), (this._isShallow = n));
  }
  get(e, n, s) {
    if (n === "__v_skip") return e.__v_skip;
    const i = this._isReadonly,
      r = this._isShallow;
    if (n === "__v_isReactive") return !i;
    if (n === "__v_isReadonly") return i;
    if (n === "__v_isShallow") return r;
    if (n === "__v_raw")
      return s === (i ? (r ? ko : ur) : r ? cr : ar).get(e) ||
        Object.getPrototypeOf(e) === Object.getPrototypeOf(s)
        ? e
        : void 0;
    const o = U(e);
    if (!i) {
      let c;
      if (o && (c = xo[n])) return c;
      if (n === "hasOwnProperty") return wo;
    }
    const l = Reflect.get(e, n, vt(e) ? e : s);
    if ((Yt(n) ? rr.has(n) : _o(n)) || (i || gt(e, "get", n), r)) return l;
    if (vt(l)) {
      const c = o && Cs(n) ? l : l.value;
      return i && Q(c) ? gs(c) : c;
    }
    return Q(l) ? (i ? gs(l) : zn(l)) : l;
  }
}
class lr extends or {
  constructor(e = !1) {
    super(!1, e);
  }
  set(e, n, s, i) {
    let r = e[n];
    const o = U(e) && Cs(n);
    if (!this._isShallow) {
      const f = Zt(r);
      if ((!It(s) && !Zt(s) && ((r = X(r)), (s = X(s))), !o && vt(r) && !vt(s)))
        return (f || (r.value = s), !0);
    }
    const l = o ? Number(n) < e.length : q(e, n),
      c = Reflect.set(e, n, s, vt(e) ? e : i);
    return (
      e === X(i) &&
        c &&
        (l ? Xt(s, r) && se(e, "set", n, s) : se(e, "add", n, s)),
      c
    );
  }
  deleteProperty(e, n) {
    const s = q(e, n);
    e[n];
    const i = Reflect.deleteProperty(e, n);
    return (i && s && se(e, "delete", n, void 0), i);
  }
  has(e, n) {
    const s = Reflect.has(e, n);
    return ((!Yt(n) || !rr.has(n)) && gt(e, "has", n), s);
  }
  ownKeys(e) {
    return (gt(e, "iterate", U(e) ? "length" : Te), Reflect.ownKeys(e));
  }
}
class To extends or {
  constructor(e = !1) {
    super(!0, e);
  }
  set(e, n) {
    return !0;
  }
  deleteProperty(e, n) {
    return !0;
  }
}
const So = new lr(),
  Eo = new To(),
  Mo = new lr(!0);
const ms = (t) => t,
  vn = (t) => Reflect.getPrototypeOf(t);
function Co(t, e, n) {
  return function (...s) {
    const i = this.__v_raw,
      r = X(i),
      o = ce(r),
      l = t === "entries" || (t === Symbol.iterator && o),
      c = t === "keys" && o,
      f = i[t](...s),
      u = n ? ms : e ? fe : kt;
    return (
      !e && gt(r, "iterate", c ? ps : Te),
      ht(Object.create(f), {
        next() {
          const { value: a, done: h } = f.next();
          return h
            ? { value: a, done: h }
            : { value: l ? [u(a[0]), u(a[1])] : u(a), done: h };
        },
      })
    );
  };
}
function yn(t) {
  return function (...e) {
    return t === "delete" ? !1 : t === "clear" ? void 0 : this;
  };
}
function Ao(t, e) {
  const n = {
    get(i) {
      const r = this.__v_raw,
        o = X(r),
        l = X(i);
      t || (Xt(i, l) && gt(o, "get", i), gt(o, "get", l));
      const { has: c } = vn(o),
        f = e ? ms : t ? fe : kt;
      if (c.call(o, i)) return f(r.get(i));
      if (c.call(o, l)) return f(r.get(l));
      r !== o && r.get(i);
    },
    get size() {
      const i = this.__v_raw;
      return (!t && gt(X(i), "iterate", Te), i.size);
    },
    has(i) {
      const r = this.__v_raw,
        o = X(r),
        l = X(i);
      return (
        t || (Xt(i, l) && gt(o, "has", i), gt(o, "has", l)),
        i === l ? r.has(i) : r.has(i) || r.has(l)
      );
    },
    forEach(i, r) {
      const o = this,
        l = o.__v_raw,
        c = X(l),
        f = e ? ms : t ? fe : kt;
      return (
        !t && gt(c, "iterate", Te),
        l.forEach((u, a) => i.call(r, f(u), f(a), o))
      );
    },
  };
  return (
    ht(
      n,
      t
        ? {
            add: yn("add"),
            set: yn("set"),
            delete: yn("delete"),
            clear: yn("clear"),
          }
        : {
            add(i) {
              const r = X(this),
                o = vn(r),
                l = X(i),
                c = !e && !It(i) && !Zt(i) ? l : i;
              return (
                o.has.call(r, c) ||
                  (Xt(i, c) && o.has.call(r, i)) ||
                  (Xt(l, c) && o.has.call(r, l)) ||
                  (r.add(c), se(r, "add", c, c)),
                this
              );
            },
            set(i, r) {
              !e && !It(r) && !Zt(r) && (r = X(r));
              const o = X(this),
                { has: l, get: c } = vn(o);
              let f = l.call(o, i);
              f || ((i = X(i)), (f = l.call(o, i)));
              const u = c.call(o, i);
              return (
                o.set(i, r),
                f ? Xt(r, u) && se(o, "set", i, r) : se(o, "add", i, r),
                this
              );
            },
            delete(i) {
              const r = X(this),
                { has: o, get: l } = vn(r);
              let c = o.call(r, i);
              (c || ((i = X(i)), (c = o.call(r, i))), l && l.call(r, i));
              const f = r.delete(i);
              return (c && se(r, "delete", i, void 0), f);
            },
            clear() {
              const i = X(this),
                r = i.size !== 0,
                o = i.clear();
              return (r && se(i, "clear", void 0, void 0), o);
            },
          },
    ),
    ["keys", "values", "entries", Symbol.iterator].forEach((i) => {
      n[i] = Co(i, t, e);
    }),
    n
  );
}
function Fs(t, e) {
  const n = Ao(t, e);
  return (s, i, r) =>
    i === "__v_isReactive"
      ? !t
      : i === "__v_isReadonly"
        ? t
        : i === "__v_isShallow"
          ? e
          : i === "__v_raw"
            ? s
            : Reflect.get(q(n, i) && i in s ? n : s, i, r);
}
const Po = { get: Fs(!1, !1) },
  Ro = { get: Fs(!1, !0) },
  Io = { get: Fs(!0, !1) };
const ar = new WeakMap(),
  cr = new WeakMap(),
  ur = new WeakMap(),
  ko = new WeakMap();
function Fo(t) {
  switch (t) {
    case "Object":
    case "Array":
      return 1;
    case "Map":
    case "Set":
    case "WeakMap":
    case "WeakSet":
      return 2;
    default:
      return 0;
  }
}
function zn(t) {
  return Zt(t) ? t : Os(t, !1, So, Po, ar);
}
function Oo(t) {
  return Os(t, !1, Mo, Ro, cr);
}
function gs(t) {
  return Os(t, !0, Eo, Io, ur);
}
function Os(t, e, n, s, i) {
  if (
    !Q(t) ||
    (t.__v_raw && !(e && t.__v_isReactive)) ||
    t.__v_skip ||
    !Object.isExtensible(t)
  )
    return t;
  const r = i.get(t);
  if (r) return r;
  const o = Fo(io(t));
  if (o === 0) return t;
  const l = new Proxy(t, o === 2 ? s : n);
  return (i.set(t, l), l);
}
function ue(t) {
  return Zt(t) ? ue(t.__v_raw) : !!(t && t.__v_isReactive);
}
function Zt(t) {
  return !!(t && t.__v_isReadonly);
}
function It(t) {
  return !!(t && t.__v_isShallow);
}
function Ds(t) {
  return t ? !!t.__v_raw : !1;
}
function X(t) {
  const e = t && t.__v_raw;
  return e ? X(e) : t;
}
function Do(t) {
  return (
    !q(t, "__v_skip") && Object.isExtensible(t) && Ki(t, "__v_skip", !0),
    t
  );
}
const kt = (t) => (Q(t) ? zn(t) : t),
  fe = (t) => (Q(t) ? gs(t) : t);
function vt(t) {
  return t ? t.__v_isRef === !0 : !1;
}
function mt(t) {
  return fr(t, !1);
}
function oi(t) {
  return fr(t, !0);
}
function fr(t, e) {
  return vt(t) ? t : new Lo(t, e);
}
class Lo {
  constructor(e, n) {
    ((this.dep = new ks()),
      (this.__v_isRef = !0),
      (this.__v_isShallow = !1),
      (this._rawValue = n ? e : X(e)),
      (this._value = n ? e : kt(e)),
      (this.__v_isShallow = n));
  }
  get value() {
    return (this.dep.track(), this._value);
  }
  set value(e) {
    const n = this._rawValue,
      s = this.__v_isShallow || It(e) || Zt(e);
    ((e = s ? e : X(e)),
      Xt(e, n) &&
        ((this._rawValue = e),
        (this._value = s ? e : kt(e)),
        this.dep.trigger()));
  }
}
function E(t) {
  return vt(t) ? t.value : t;
}
const Uo = {
  get: (t, e, n) => (e === "__v_raw" ? t : E(Reflect.get(t, e, n))),
  set: (t, e, n, s) => {
    const i = t[e];
    return vt(i) && !vt(n) ? ((i.value = n), !0) : Reflect.set(t, e, n, s);
  },
};
function dr(t) {
  return ue(t) ? t : new Proxy(t, Uo);
}
class $o {
  constructor(e, n, s) {
    ((this.fn = e),
      (this.setter = n),
      (this._value = void 0),
      (this.dep = new ks(this)),
      (this.__v_isRef = !0),
      (this.deps = void 0),
      (this.depsTail = void 0),
      (this.flags = 16),
      (this.globalVersion = en - 1),
      (this.next = void 0),
      (this.effect = this),
      (this.__v_isReadonly = !n),
      (this.isSSR = s));
  }
  notify() {
    if (((this.flags |= 16), !(this.flags & 8) && et !== this))
      return (Ji(this, !0), !0);
  }
  get value() {
    const e = this.dep.track();
    return (er(this), e && (e.version = this.dep.version), this._value);
  }
  set value(e) {
    this.setter && this.setter(e);
  }
}
function Ho(t, e, n = !1) {
  let s, i;
  return (N(t) ? (s = t) : ((s = t.get), (i = t.set)), new $o(s, i, n));
}
const bn = {},
  Mn = new WeakMap();
let ye;
function No(t, e = !1, n = ye) {
  if (n) {
    let s = Mn.get(n);
    (s || Mn.set(n, (s = [])), s.push(t));
  }
}
function Vo(t, e, n = tt) {
  const {
      immediate: s,
      deep: i,
      once: r,
      scheduler: o,
      augmentJob: l,
      call: c,
    } = n,
    f = (O) => (i ? O : It(O) || i === !1 || i === 0 ? ie(O, 1) : ie(O));
  let u,
    a,
    h,
    b,
    v = !1,
    y = !1;
  if (
    (vt(t)
      ? ((a = () => t.value), (v = It(t)))
      : ue(t)
        ? ((a = () => f(t)), (v = !0))
        : U(t)
          ? ((y = !0),
            (v = t.some((O) => ue(O) || It(O))),
            (a = () =>
              t.map((O) => {
                if (vt(O)) return O.value;
                if (ue(O)) return f(O);
                if (N(O)) return c ? c(O, 2) : O();
              })))
          : N(t)
            ? e
              ? (a = c ? () => c(t, 2) : t)
              : (a = () => {
                  if (h) {
                    Qt();
                    try {
                      h();
                    } finally {
                      Jt();
                    }
                  }
                  const O = ye;
                  ye = u;
                  try {
                    return c ? c(t, 3, [b]) : t(b);
                  } finally {
                    ye = O;
                  }
                })
            : (a = Gt),
    e && i)
  ) {
    const O = a,
      st = i === !0 ? 1 / 0 : i;
    a = () => ie(O(), st);
  }
  const S = vo(),
    M = () => {
      (u.stop(), S && S.active && Ms(S.effects, u));
    };
  if (r && e) {
    const O = e;
    e = (...st) => {
      try {
        return O(...st);
      } finally {
        M();
      }
    };
  }
  let A = y ? new Array(t.length).fill(bn) : bn;
  const $ = (O) => {
    if (!(!(u.flags & 1) || (!u.dirty && !O)))
      if (e) {
        const st = u.run();
        if (
          O ||
          i ||
          v ||
          (y ? st.some((pt, wt) => Xt(pt, A[wt])) : Xt(st, A))
        ) {
          const pt = ye;
          Qt();
          try {
            (h && h(), (ye = u));
            const wt = [st, A === bn ? void 0 : y && A[0] === bn ? [] : A, b];
            ((A = st), c ? c(e, 3, wt) : e(...wt));
          } finally {
            ((ye = pt), Jt());
          }
        }
      } else u.run();
  };
  return (
    l && l($),
    (u = new Yi(a)),
    (u.scheduler = o ? () => o($, !1) : $),
    (b = (O) => No(O, !1, u)),
    (h = u.onStop =
      () => {
        const O = Mn.get(u);
        if (O) {
          if (c) c(O, 4);
          else for (const st of O) st();
          Mn.delete(u);
        }
      }),
    e ? (s ? $(!0) : (A = u.run())) : o ? o($.bind(null, !0), !0) : u.run(),
    (M.pause = u.pause.bind(u)),
    (M.resume = u.resume.bind(u)),
    (M.stop = M),
    M
  );
}
function ie(t, e = 1 / 0, n) {
  if (
    e <= 0 ||
    !Q(t) ||
    t.__v_skip ||
    ((n = n || new Map()), (n.get(t) || 0) >= e)
  )
    return t;
  if ((n.set(t, e), e--, vt(t))) ie(t.value, e, n);
  else if (U(t)) for (let s = 0; s < t.length; s++) ie(t[s], e, n);
  else if (re(t) || ce(t))
    t.forEach((s) => {
      ie(s, e, n);
    });
  else if (Wi(t)) {
    for (const s in t) ie(t[s], e, n);
    for (const s of Object.getOwnPropertySymbols(t))
      Object.prototype.propertyIsEnumerable.call(t, s) && ie(t[s], e, n);
  }
  return t;
}
/**
 * @vue/runtime-core v3.5.44
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ function dn(t, e, n, s) {
  try {
    return s ? t(...s) : t();
  } catch (i) {
    qn(i, e, n);
  }
}
function $t(t, e, n, s) {
  if (N(t)) {
    const i = dn(t, e, n, s);
    return (
      i &&
        Vi(i) &&
        i.catch((r) => {
          qn(r, e, n);
        }),
      i
    );
  }
  if (U(t)) {
    const i = [];
    for (let r = 0; r < t.length; r++) i.push($t(t[r], e, n, s));
    return i;
  }
}
function qn(t, e, n, s = !0) {
  const i = e ? e.vnode : null,
    { errorHandler: r, throwUnhandledErrorInProduction: o } =
      (e && e.appContext.config) || tt;
  if (e) {
    let l = e.parent;
    const c = e.proxy,
      f = `https://vuejs.org/error-reference/#runtime-${n}`;
    for (; l;) {
      const u = l.ec;
      if (u) {
        for (let a = 0; a < u.length; a++) if (u[a](t, c, f) === !1) return;
      }
      l = l.parent;
    }
    if (r) {
      (Qt(), dn(r, null, 10, [t, c, f]), Jt());
      return;
    }
  }
  Bo(t, n, i, s, o);
}
function Bo(t, e, n, s = !0, i = !1) {
  if (i) throw t;
  console.error(t);
}
const xt = [];
let Ot = -1;
const zt = [];
let ae = null,
  ke = 0;
const hr = Promise.resolve();
let Cn = null;
function pr(t) {
  const e = Cn || hr;
  return t ? e.then(this ? t.bind(this) : t) : e;
}
function Wo(t) {
  let e = Ot + 1,
    n = xt.length;
  for (; e < n;) {
    const s = (e + n) >>> 1,
      i = xt[s],
      r = sn(i);
    r < t || (r === t && i.flags & 2) ? (e = s + 1) : (n = s);
  }
  return e;
}
function Ls(t) {
  if (!(t.flags & 1)) {
    const e = sn(t),
      n = xt[xt.length - 1];
    (!n || (!(t.flags & 2) && e >= sn(n)) ? xt.push(t) : xt.splice(Wo(e), 0, t),
      (t.flags |= 1),
      mr());
  }
}
function mr() {
  Cn || (Cn = hr.then(yr));
}
function jo(t) {
  if (!U(t))
    ae && t.id === -1
      ? ae.splice(ke + 1, 0, t)
      : t.flags & 1 || (zt.push(t), (t.flags |= 1));
  else for (let e = 0; e < t.length; e++) zt.push(t[e]);
  mr();
}
function gr(t, e, n, s = Ot + 1) {
  for (; s < xt.length; s++) {
    const i = xt[s];
    if (i && i.flags & 2) {
      if ((t && i.id !== t.uid) || (e !== void 0 && !(i.id >= e))) continue;
      (xt.splice(s, 1),
        (s = t ? s - 1 : Ot),
        i.flags & 4 && (i.flags &= -2),
        i(),
        i.flags & 4 || (i.flags &= -2));
    }
  }
}
function vr(t, e, n = 0) {
  if (zt.length) {
    let s = zt,
      i = 0;
    if (e) {
      s = [];
      for (let o = 0; o < zt.length; o++) {
        const l = zt[o];
        (l.i !== void 0 ? !l.i || l.i.uid < n : e.has(l))
          ? (zt[i++] = l)
          : s.push(l);
      }
    }
    const r = [...new Set(s)].sort((o, l) => sn(o) - sn(l));
    if (((zt.length = i), ae)) {
      for (let o = 0; o < r.length; o++) ae.push(r[o]);
      return;
    }
    for (ae = r, ke = 0; ke < ae.length; ke++) {
      const o = ae[ke];
      (o.flags & 4 && (o.flags &= -2), o.flags & 8 || o(), (o.flags &= -2));
    }
    ((ae = null), (ke = 0));
  }
}
let rs = !1;
function Ko(t, e) {
  if (rs) {
    t();
    return;
  }
  const n = e === void 0 ? void 0 : new Set(zt);
  (t(), (rs = !0));
  try {
    (gr(void 0, e), vr(void 0, n, e));
  } finally {
    rs = !1;
  }
}
const sn = (t) => (t.id == null ? (t.flags & 2 ? -1 : 1 / 0) : t.id);
function yr(t) {
  try {
    for (Ot = 0; Ot < xt.length; Ot++) {
      const e = xt[Ot];
      e &&
        !(e.flags & 8) &&
        (e.flags & 4 && (e.flags &= -2),
        dn(e, e.i, e.i ? 15 : 14),
        e.flags & 4 || (e.flags &= -2));
    }
  } finally {
    for (; Ot < xt.length; Ot++) {
      const e = xt[Ot];
      e && (e.flags &= -2);
    }
    ((Ot = -1),
      (xt.length = 0),
      vr(),
      (Cn = null),
      (xt.length || zt.length) && yr());
  }
}
let Rt = null,
  br = null;
function An(t) {
  const e = Rt;
  return ((Rt = t), (br = (t && t.type.__scopeId) || null), e);
}
function zo(t, e = Rt, n) {
  if (!e || t._n) return t;
  const s = (...i) => {
    s._d && vi(-1);
    const r = An(e),
      o = Se.length;
    let l;
    try {
      l = t(...i);
    } finally {
      for (let c = Se.length; c > o; c--) Wr();
      (An(r), s._d && vi(1));
    }
    return l;
  };
  return ((s._n = !0), (s._c = !0), (s._d = !0), s);
}
function Tt(t, e) {
  if (Rt === null) return t;
  const n = Zn(Rt),
    s = t.dirs || (t.dirs = []);
  for (let i = 0; i < e.length; i++) {
    let [r, o, l, c = tt] = e[i];
    r &&
      (N(r) && (r = { mounted: r, updated: r }),
      r.deep && ie(o),
      s.push({
        dir: r,
        instance: n,
        value: o,
        oldValue: void 0,
        arg: l,
        modifiers: c,
      }));
  }
  return t;
}
function pe(t, e, n, s) {
  const i = t.dirs,
    r = e && e.dirs;
  for (let o = 0; o < i.length; o++) {
    const l = i[o];
    r && (l.oldValue = r[o].value);
    let c = l.dir[s];
    c && (Qt(), $t(c, n, 8, [t.el, l, t, e]), Jt());
  }
}
function qo(t, e) {
  if (_t) {
    let n = _t.provides;
    const s = _t.parent && _t.parent.provides;
    (s === n && (n = _t.provides = Object.create(s)), (n[t] = e));
  }
}
function Tn(t, e, n = !1) {
  const s = Bl();
  if (s || Oe) {
    let i = Oe
      ? Oe._context.provides
      : s
        ? s.parent == null || s.ce
          ? s.vnode.appContext && s.vnode.appContext.provides
          : s.parent.provides
        : void 0;
    if (i && t in i) return i[t];
    if (arguments.length > 1) return n && N(e) ? e.call(s && s.proxy) : e;
  }
}
const Xo = Symbol.for("v-scx"),
  Go = () => Tn(Xo);
function Fe(t, e, n) {
  return xr(t, e, n);
}
function xr(t, e, n = tt) {
  const { immediate: s, deep: i, flush: r, once: o } = n,
    l = ht({}, n),
    c = (e && s) || (!e && r !== "post");
  let f;
  if (ln) {
    if (r === "sync") {
      const b = Go();
      f = b.__watcherHandles || (b.__watcherHandles = []);
    } else if (!c) {
      const b = () => {};
      return ((b.stop = Gt), (b.resume = Gt), (b.pause = Gt), b);
    }
  }
  const u = _t;
  l.call = (b, v, y) => $t(b, u, v, y);
  let a = !1;
  (r === "post"
    ? (l.scheduler = (b) => {
        ((b.i = u), St(b, u && u.suspense));
      })
    : r !== "sync" &&
      ((a = !0),
      (l.scheduler = (b, v) => {
        v ? b() : Ls(b);
      })),
    (l.augmentJob = (b) => {
      (e && (b.flags |= 4),
        a && ((b.flags |= 2), u && ((b.id = u.uid), (b.i = u))));
    }));
  const h = Vo(t, e, l);
  return (ln && (f ? f.push(h) : c && h()), h);
}
function Yo(t, e, n) {
  const s = this.proxy,
    i = it(t) ? (t.includes(".") ? _r(s, t) : () => s[t]) : t.bind(s, s);
  let r;
  N(e) ? (r = e) : ((r = e.handler), (n = e));
  const o = pn(this),
    l = xr(i, r.bind(s), n);
  return (o(), l);
}
function _r(t, e) {
  const n = e.split(".");
  return () => {
    let s = t;
    for (let i = 0; i < n.length && s; i++) s = s[n[i]];
    return s;
  };
}
const Qo = Symbol("_vte"),
  Xn = (t) => t.__isTeleport,
  os = Symbol("_leaveCb");
function Jo(t) {
  let e = t[0];
  if (t.length > 1) {
    for (const n of t)
      if (n.type !== Ht) {
        e = n;
        break;
      }
  }
  return e;
}
function wr(t) {
  if (!Us(t)) return Xn(t.type) && t.children ? Jo(t.children) : t;
  if (t.component) return t.component.subTree;
  const { shapeFlag: e, children: n } = t;
  if (n) {
    if (e & 16) return n[0];
    if (e & 32 && N(n.default)) return n.default();
  }
}
function Pn(t, e) {
  if (t.shapeFlag & 6 && t.component) {
    t.transition = e;
    const n = t.component.subTree;
    Pn((Xn(n.type) && wr(n)) || n, e);
  } else if (t.shapeFlag & 128)
    ((t.ssContent.transition = e.clone(t.ssContent)),
      (t.ssFallback.transition = e.clone(t.ssFallback)));
  else if (((t.transition = e), t.type === nt && U(t.children))) {
    const n = Rr(t.children, !1);
    n && Pn(n, e);
  }
}
function vs(t) {
  if (t.component) return vs(t.component.subTree);
  if (t.type === nt) {
    const e = U(t.children) && Rr(t.children, !1);
    return e ? vs(e) : void 0;
  }
  if (t.type !== Ht) return t;
}
function Ue(t, e) {
  return N(t) ? ht({ name: t.name }, e, { setup: t }) : t;
}
function Tr(t) {
  t.ids = [t.ids[0] + t.ids[2]++ + "-", 0, 0];
}
function li(t, e) {
  let n;
  return !!((n = Object.getOwnPropertyDescriptor(t, e)) && !n.configurable);
}
const Rn = new WeakMap();
function Je(t, e, n, s, i = !1) {
  if (U(t)) {
    t.forEach((y, S) => Je(y, e && (U(e) ? e[S] : e), n, s, i));
    return;
  }
  if (Ze(s) && !i) {
    s.shapeFlag & 512 &&
      s.type.__asyncResolved &&
      s.component.subTree.component &&
      Je(t, e, n, s.component.subTree);
    return;
  }
  const r = s.shapeFlag & 4 ? Zn(s.component) : s.el,
    o = i ? null : r,
    { i: l, r: c } = t,
    f = e && e.r,
    u = l.refs === tt ? (l.refs = {}) : l.refs,
    a = l.setupState,
    h = X(a),
    b = a === tt ? Ni : (y) => (li(u, y) ? !1 : q(h, y)),
    v = (y, S) => !(S && li(u, S));
  if (f != null && f !== c) {
    if ((ai(e), it(f))) ((u[f] = null), b(f) && (a[f] = null));
    else if (vt(f)) {
      const y = e;
      (v(f, y.k) && (f.value = null), y.k && (u[y.k] = null));
    }
  }
  if (N(c)) dn(c, l, 12, [o, u]);
  else {
    const y = it(c),
      S = vt(c);
    if (y || S) {
      const M = () => {
        if (t.f) {
          const A = y ? (b(c) ? a[c] : u[c]) : v() || !t.k ? c.value : u[t.k];
          if (i) U(A) && Ms(A, r);
          else if (U(A)) A.includes(r) || A.push(r);
          else if (y) ((u[c] = [r]), b(c) && (a[c] = u[c]));
          else {
            const $ = [r];
            (v(c, t.k) && (c.value = $), t.k && (u[t.k] = $));
          }
        } else
          y
            ? ((u[c] = o), b(c) && (a[c] = o))
            : S && (v(c, t.k) && (c.value = o), t.k && (u[t.k] = o));
      };
      if (o) {
        const A = () => {
          (M(), Rn.delete(t));
        };
        ((A.id = -1), Rn.set(t, A), St(A, n));
      } else (ai(t), M());
    }
  }
}
function ai(t) {
  const e = Rn.get(t);
  e && ((e.flags |= 8), Rn.delete(t));
}
jn().requestIdleCallback;
jn().cancelIdleCallback;
const Ze = (t) => !!t.type.__asyncLoader,
  Us = (t) => t.type.__isKeepAlive;
function Zo(t, e) {
  Sr(t, "a", e);
}
function tl(t, e) {
  Sr(t, "da", e);
}
function Sr(t, e, n = _t) {
  const s =
    t.__wdc ||
    (t.__wdc = () => {
      let i = n;
      for (; i;) {
        if (i.isDeactivated) return;
        i = i.parent;
      }
      return t();
    });
  if ((Gn(e, s, n), n)) {
    let i = n.parent;
    for (; i && i.parent;)
      (Us(i.parent.vnode) && el(s, e, n, i), (i = i.parent));
  }
}
function el(t, e, n, s) {
  const i = Gn(e, t, s, !0);
  Er(() => {
    Ms(s[e], i);
  }, n);
}
function Gn(t, e, n = _t, s = !1) {
  if (n) {
    const i = n[t] || (n[t] = []),
      r =
        e.__weh ||
        (e.__weh = (...o) => {
          Qt();
          const l = pn(n),
            c = $t(e, n, t, o);
          return (l(), Jt(), c);
        });
    return (s ? i.unshift(r) : i.push(r), r);
  }
}
const le =
    (t) =>
    (e, n = _t) => {
      (!ln || t === "sp") && Gn(t, (...s) => e(...s), n);
    },
  nl = le("bm"),
  Yn = le("m"),
  sl = le("bu"),
  il = le("u"),
  hn = le("bum"),
  Er = le("um"),
  rl = le("sp"),
  ol = le("rtg"),
  ll = le("rtc");
function al(t, e = _t) {
  Gn("ec", t, e);
}
const cl = Symbol.for("v-ndc");
function xe(t, e, n, s) {
  let i;
  const r = n,
    o = U(t);
  if (o || it(t)) {
    const l = o && ue(t);
    let c = !1,
      f = !1;
    (l && ((c = !It(t)), (f = Zt(t)), (t = Kn(t))), (i = new Array(t.length)));
    for (let u = 0, a = t.length; u < a; u++)
      i[u] = e(c ? (f ? fe(kt(t[u])) : kt(t[u])) : t[u], u, void 0, r);
  } else if (typeof t == "number")
    if (!Number.isInteger(t) || t < 0) i = [];
    else {
      i = new Array(t);
      for (let l = 0; l < t; l++) i[l] = e(l + 1, l, void 0, r);
    }
  else if (Q(t))
    if (t[Symbol.iterator]) i = Array.from(t, (l, c) => e(l, c, void 0, r));
    else {
      const l = Object.keys(t);
      i = new Array(l.length);
      for (let c = 0, f = l.length; c < f; c++) {
        const u = l[c];
        i[c] = e(t[u], u, c, r);
      }
    }
  else i = [];
  return i;
}
const ys = (t) => (t ? (qr(t) ? Zn(t) : ys(t.parent)) : null),
  tn = ht(Object.create(null), {
    $: (t) => t,
    $el: (t) => t.vnode.el,
    $data: (t) => t.data,
    $props: (t) => t.props,
    $attrs: (t) => t.attrs,
    $slots: (t) => t.slots,
    $refs: (t) => t.refs,
    $parent: (t) => ys(t.parent),
    $root: (t) => ys(t.root),
    $host: (t) => t.ce,
    $emit: (t) => t.emit,
    $options: (t) => Cr(t),
    $forceUpdate: (t) =>
      t.f ||
      (t.f = () => {
        Ls(t.update);
      }),
    $nextTick: (t) => t.n || (t.n = pr.bind(t.proxy)),
    $watch: (t) => Yo.bind(t),
  }),
  ls = (t, e) => t !== tt && !t.__isScriptSetup && q(t, e),
  ul = {
    get({ _: t }, e) {
      if (e === "__v_skip") return !0;
      const {
        ctx: n,
        setupState: s,
        data: i,
        props: r,
        accessCache: o,
        type: l,
        appContext: c,
      } = t;
      if (e[0] !== "$") {
        const h = o[e];
        if (h !== void 0)
          switch (h) {
            case 1:
              return s[e];
            case 2:
              return i[e];
            case 4:
              return n[e];
            case 3:
              return r[e];
          }
        else {
          if (ls(s, e)) return ((o[e] = 1), s[e]);
          if (i !== tt && q(i, e)) return ((o[e] = 2), i[e]);
          if (q(r, e)) return ((o[e] = 3), r[e]);
          if (n !== tt && q(n, e)) return ((o[e] = 4), n[e]);
          bs && (o[e] = 0);
        }
      }
      const f = tn[e];
      let u, a;
      if (f) return (e === "$attrs" && gt(t.attrs, "get", ""), f(t));
      if ((u = l.__cssModules) && (u = u[e])) return u;
      if (n !== tt && q(n, e)) return ((o[e] = 4), n[e]);
      if (((a = c.config.globalProperties), q(a, e))) return a[e];
    },
    set({ _: t }, e, n) {
      const { data: s, setupState: i, ctx: r } = t;
      return ls(i, e)
        ? ((i[e] = n), !0)
        : s !== tt && q(s, e)
          ? ((s[e] = n), !0)
          : q(t.props, e) || (e[0] === "$" && e.slice(1) in t)
            ? !1
            : ((r[e] = n), !0);
    },
    has(
      {
        _: {
          data: t,
          setupState: e,
          accessCache: n,
          ctx: s,
          appContext: i,
          props: r,
          type: o,
        },
      },
      l,
    ) {
      let c;
      return !!(
        n[l] ||
        (t !== tt && l[0] !== "$" && q(t, l)) ||
        ls(e, l) ||
        q(r, l) ||
        q(s, l) ||
        q(tn, l) ||
        q(i.config.globalProperties, l) ||
        ((c = o.__cssModules) && c[l])
      );
    },
    defineProperty(t, e, n) {
      return (
        n.get != null
          ? (t._.accessCache[e] = 0)
          : q(n, "value") && this.set(t, e, n.value, null),
        Reflect.defineProperty(t, e, n)
      );
    },
  };
function ci(t) {
  return U(t) ? t.reduce((e, n) => ((e[n] = null), e), {}) : t;
}
let bs = !0;
function fl(t) {
  const e = Cr(t),
    n = t.proxy,
    s = t.ctx;
  ((bs = !1), e.beforeCreate && ui(e.beforeCreate, t, "bc"));
  const {
    data: i,
    computed: r,
    methods: o,
    watch: l,
    provide: c,
    inject: f,
    created: u,
    beforeMount: a,
    mounted: h,
    beforeUpdate: b,
    updated: v,
    activated: y,
    deactivated: S,
    beforeDestroy: M,
    beforeUnmount: A,
    destroyed: $,
    unmounted: O,
    render: st,
    renderTracked: pt,
    renderTriggered: wt,
    errorCaptured: Mt,
    serverPrefetch: z,
    expose: lt,
    inheritAttrs: F,
    components: B,
    directives: yt,
    filters: Pe,
  } = e;
  if ((f && dl(f, s, null), o))
    for (const J in o) {
      const G = o[J];
      N(G) && (s[J] = G.bind(n));
    }
  if (i) {
    const J = i.call(n, n);
    Q(J) && (t.data = zn(J));
  }
  if (((bs = !0), r))
    for (const J in r) {
      const G = r[J],
        Nt = N(G) ? G.bind(n, n) : N(G.get) ? G.get.bind(n, n) : Gt,
        de = !N(G) && N(G.set) ? G.set.bind(n) : Gt,
        he = an({ get: Nt, set: de });
      Object.defineProperty(s, J, {
        enumerable: !0,
        configurable: !0,
        get: () => he.value,
        set: (Ft) => (he.value = Ft),
      });
    }
  if (l) for (const J in l) Mr(l[J], s, n, J);
  if (c) {
    const J = N(c) ? c.call(n) : c;
    Reflect.ownKeys(J).forEach((G) => {
      qo(G, J[G]);
    });
  }
  u && ui(u, t, "c");
  function ut(J, G) {
    U(G) ? G.forEach((Nt) => J(Nt.bind(n))) : G && J(G.bind(n));
  }
  if (
    (ut(nl, a),
    ut(Yn, h),
    ut(sl, b),
    ut(il, v),
    ut(Zo, y),
    ut(tl, S),
    ut(al, Mt),
    ut(ll, pt),
    ut(ol, wt),
    ut(hn, A),
    ut(Er, O),
    ut(rl, z),
    U(lt))
  )
    if (lt.length) {
      const J = t.exposed || (t.exposed = {});
      lt.forEach((G) => {
        Object.defineProperty(J, G, {
          get: () => n[G],
          set: (Nt) => (n[G] = Nt),
          enumerable: !0,
        });
      });
    } else t.exposed || (t.exposed = {});
  (st && t.render === Gt && (t.render = st),
    F != null && (t.inheritAttrs = F),
    B && (t.components = B),
    yt && (t.directives = yt),
    z && Tr(t));
}
function dl(t, e, n = Gt) {
  U(t) && (t = xs(t));
  for (const s in t) {
    const i = t[s];
    let r;
    (Q(i)
      ? "default" in i
        ? (r = Tn(i.from || s, i.default, !0))
        : (r = Tn(i.from || s))
      : (r = Tn(i)),
      vt(r)
        ? Object.defineProperty(e, s, {
            enumerable: !0,
            configurable: !0,
            get: () => r.value,
            set: (o) => (r.value = o),
          })
        : (e[s] = r));
  }
}
function ui(t, e, n) {
  $t(U(t) ? t.map((s) => s.bind(e.proxy)) : t.bind(e.proxy), e, n);
}
function Mr(t, e, n, s) {
  let i = s.includes(".") ? _r(n, s) : () => n[s];
  if (it(t)) {
    const r = e[t];
    N(r) && Fe(i, r);
  } else if (N(t)) Fe(i, t.bind(n));
  else if (Q(t))
    if (U(t)) t.forEach((r) => Mr(r, e, n, s));
    else {
      const r = N(t.handler) ? t.handler.bind(n) : e[t.handler];
      N(r) && Fe(i, r, t);
    }
}
function Cr(t) {
  const e = t.type,
    { mixins: n, extends: s } = e,
    {
      mixins: i,
      optionsCache: r,
      config: { optionMergeStrategies: o },
    } = t.appContext,
    l = r.get(e);
  let c;
  return (
    l
      ? (c = l)
      : !i.length && !n && !s
        ? (c = e)
        : ((c = {}),
          i.length && i.forEach((f) => In(c, f, o, !0)),
          In(c, e, o)),
    Q(e) && r.set(e, c),
    c
  );
}
function In(t, e, n, s = !1) {
  const { mixins: i, extends: r } = e;
  (r && In(t, r, n, !0), i && i.forEach((o) => In(t, o, n, !0)));
  for (const o in e)
    if (!(s && o === "expose")) {
      const l = hl[o] || (n && n[o]);
      t[o] = l ? l(t[o], e[o]) : e[o];
    }
  return t;
}
const hl = {
  data: fi,
  props: di,
  emits: di,
  methods: Ke,
  computed: Ke,
  beforeCreate: bt,
  created: bt,
  beforeMount: bt,
  mounted: bt,
  beforeUpdate: bt,
  updated: bt,
  beforeDestroy: bt,
  beforeUnmount: bt,
  destroyed: bt,
  unmounted: bt,
  activated: bt,
  deactivated: bt,
  errorCaptured: bt,
  serverPrefetch: bt,
  components: Ke,
  directives: Ke,
  watch: ml,
  provide: fi,
  inject: pl,
};
function fi(t, e) {
  return e
    ? t
      ? function () {
          return ht(
            N(t) ? t.call(this, this) : t,
            N(e) ? e.call(this, this) : e,
          );
        }
      : e
    : t;
}
function pl(t, e) {
  return Ke(xs(t), xs(e));
}
function xs(t) {
  if (U(t)) {
    const e = {};
    for (let n = 0; n < t.length; n++) e[t[n]] = t[n];
    return e;
  }
  return t;
}
function bt(t, e) {
  return t ? [...new Set([].concat(t, e))] : e;
}
function Ke(t, e) {
  return t ? ht(Object.create(null), t, e) : e;
}
function di(t, e) {
  return t
    ? U(t) && U(e)
      ? [...new Set([...t, ...e])]
      : ht(Object.create(null), ci(t), ci(e ?? {}))
    : e;
}
function ml(t, e) {
  if (!t) return e;
  if (!e) return t;
  const n = ht(Object.create(null), t);
  for (const s in e) n[s] = bt(t[s], e[s]);
  return n;
}
function Ar() {
  return {
    app: null,
    config: {
      isNativeTag: Ni,
      performance: !1,
      globalProperties: {},
      optionMergeStrategies: {},
      errorHandler: void 0,
      warnHandler: void 0,
      compilerOptions: {},
    },
    mixins: [],
    components: {},
    directives: {},
    provides: Object.create(null),
    optionsCache: new WeakMap(),
    propsCache: new WeakMap(),
    emitsCache: new WeakMap(),
  };
}
let gl = 0;
function vl(t, e) {
  return function (s, i = null) {
    (N(s) || (s = ht({}, s)), i != null && !Q(i) && (i = null));
    const r = Ar(),
      o = new WeakSet(),
      l = [];
    let c = !1;
    const f = (r.app = {
      _uid: gl++,
      _component: s,
      _props: i,
      _container: null,
      _context: r,
      _instance: null,
      version: Xl,
      get config() {
        return r.config;
      },
      set config(u) {},
      use(u, ...a) {
        return (
          o.has(u) ||
            (u && N(u.install)
              ? (o.add(u), u.install(f, ...a))
              : N(u) && (o.add(u), u(f, ...a))),
          f
        );
      },
      mixin(u) {
        return (r.mixins.includes(u) || r.mixins.push(u), f);
      },
      component(u, a) {
        return a ? ((r.components[u] = a), f) : r.components[u];
      },
      directive(u, a) {
        return a ? ((r.directives[u] = a), f) : r.directives[u];
      },
      mount(u, a, h) {
        if (!c) {
          const b = f._ceVNode || Ut(s, i);
          return (
            (b.appContext = r),
            h === !0 ? (h = "svg") : h === !1 && (h = void 0),
            t(b, u, h),
            (c = !0),
            (f._container = u),
            (u.__vue_app__ = f),
            Zn(b.component)
          );
        }
      },
      onUnmount(u) {
        l.push(u);
      },
      unmount() {
        c &&
          ($t(l, f._instance, 16),
          t(null, f._container),
          delete f._container.__vue_app__);
      },
      provide(u, a) {
        return ((r.provides[u] = a), f);
      },
      runWithContext(u) {
        const a = Oe;
        Oe = f;
        try {
          return u();
        } finally {
          Oe = a;
        }
      },
    });
    return f;
  };
}
let Oe = null;
const yl = (t, e) =>
  e === "modelValue" || e === "model-value"
    ? t.modelModifiers
    : t[`${e}Modifiers`] || t[`${Dt(e)}Modifiers`] || t[`${Ae(e)}Modifiers`];
function bl(t, e, ...n) {
  if (t.isUnmounted) return;
  const s = t.vnode.props || tt;
  let i = n;
  const r = e.startsWith("update:"),
    o = r && yl(s, e.slice(7));
  o &&
    (o.trim && (i = n.map((u) => (it(u) ? u.trim() : u))),
    o.number && (i = i.map(zi)));
  let l,
    c = s[(l = ts(e))] || s[(l = ts(Dt(e)))];
  (!c && r && (c = s[(l = ts(Ae(e)))]), c && $t(c, t, 6, i));
  const f = s[l + "Once"];
  if (f) {
    if (!t.emitted) t.emitted = {};
    else if (t.emitted[l]) return;
    ((t.emitted[l] = !0), $t(f, t, 6, i));
  }
}
const xl = new WeakMap();
function Pr(t, e, n = !1) {
  const s = n ? xl : e.emitsCache,
    i = s.get(t);
  if (i !== void 0) return i;
  const r = t.emits;
  let o = {},
    l = !1;
  if (!N(t)) {
    const c = (f) => {
      const u = Pr(f, e, !0);
      u && ((l = !0), ht(o, u));
    };
    (!n && e.mixins.length && e.mixins.forEach(c),
      t.extends && c(t.extends),
      t.mixins && t.mixins.forEach(c));
  }
  return !r && !l
    ? (Q(t) && s.set(t, null), null)
    : (U(r) ? r.forEach((c) => (o[c] = null)) : ht(o, r),
      Q(t) && s.set(t, o),
      o);
}
function Qn(t, e) {
  return !t || !Vn(e)
    ? !1
    : ((e = e.slice(2)),
      (e = e === "Once" ? e : e.replace(/Once$/, "")),
      q(t, e[0].toLowerCase() + e.slice(1)) || q(t, Ae(e)) || q(t, e));
}
function hi(t) {
  const {
      type: e,
      vnode: n,
      proxy: s,
      withProxy: i,
      propsOptions: [r],
      slots: o,
      attrs: l,
      emit: c,
      render: f,
      renderCache: u,
      props: a,
      data: h,
      setupState: b,
      ctx: v,
      inheritAttrs: y,
    } = t,
    S = An(t);
  let M, A;
  try {
    if (n.shapeFlag & 4) {
      const O = i || s,
        st = O;
      ((M = qt(f.call(st, O, u, a, b, h, v))), (A = l));
    } else {
      const O = e;
      ((M = qt(
        O.length > 1 ? O(a, { attrs: l, slots: o, emit: c }) : O(a, null),
      )),
        (A = e.props ? l : _l(l)));
    }
  } catch (O) {
    ((Se.length = 0), qn(O, t, 1), (M = Ut(Ht)));
  }
  let $ = M;
  if (A && y !== !1) {
    const O = Object.keys(A),
      { shapeFlag: st } = $;
    O.length &&
      st & 7 &&
      (r && O.some(Bn) && (A = wl(A, r)), ($ = Le($, A, !1, !0)));
  }
  if (
    (n.dirs &&
      (($ = Le($, null, !1, !0)),
      ($.dirs = $.dirs ? $.dirs.concat(n.dirs) : n.dirs)),
    n.transition)
  ) {
    const O = (Xn($.type) && wr($)) || $;
    Pn(O, n.transition);
  }
  return ((M = $), An(S), M);
}
function Rr(t, e = !0) {
  let n;
  for (let s = 0; s < t.length; s++) {
    const i = t[s];
    if (Ns(i)) {
      if (i.type !== Ht || i.children === "v-if") {
        if (n) return;
        n = i;
      }
    } else return;
  }
  return n;
}
const _l = (t) => {
    let e;
    for (const n in t)
      (n === "class" || n === "style" || Vn(n)) && ((e || (e = {}))[n] = t[n]);
    return e;
  },
  wl = (t, e) => {
    const n = {};
    for (const s in t) (!Bn(s) || !(s.slice(9) in e)) && (n[s] = t[s]);
    return n;
  };
function Tl(t, e, n) {
  const { props: s, children: i, component: r } = t,
    { props: o, children: l, patchFlag: c } = e,
    f = r.emitsOptions;
  if (e.dirs || e.transition) return !0;
  if (n && c >= 0) {
    if (c & 1024) return !0;
    if (c & 16) return s ? pi(s, o, f) : !!o;
    if (c & 8) {
      const u = e.dynamicProps;
      for (let a = 0; a < u.length; a++) {
        const h = u[a];
        if (Ir(o, s, h) && !Qn(f, h)) return !0;
      }
    }
  } else
    return (i || l) && (!l || !l.$stable)
      ? !0
      : s === o
        ? !1
        : s
          ? o
            ? pi(s, o, f)
            : !0
          : !!o;
  return !1;
}
function pi(t, e, n) {
  const s = Object.keys(e);
  if (s.length !== Object.keys(t).length) return !0;
  for (let i = 0; i < s.length; i++) {
    const r = s[i];
    if (!q(t, r) || (Ir(e, t, r) && !Qn(n, r))) return !0;
  }
  return !1;
}
function Ir(t, e, n) {
  const s = t[n],
    i = e[n];
  return n === "style" && Q(s) && Q(i) ? !oe(s, i) : s !== i;
}
function Sl({ vnode: t, parent: e, suspense: n }, s) {
  for (; e;) {
    const i = e.subTree;
    if (
      (i.suspense &&
        i.suspense.activeBranch === t &&
        ((i.suspense.vnode.el = i.el = s), (t = i)),
      i === t)
    )
      (((t = e.vnode).el = s), (e = e.parent));
    else break;
  }
  n && n.activeBranch === t && (n.vnode.el = s);
}
const kr = {},
  Fr = () => Object.create(kr),
  Or = (t) => Object.getPrototypeOf(t) === kr;
function El(t, e, n, s = !1) {
  const i = {},
    r = Fr();
  ((t.propsDefaults = Object.create(null)), Dr(t, e, i, r));
  for (const o in t.propsOptions[0]) o in i || (i[o] = void 0);
  (n ? (t.props = s ? i : Oo(i)) : t.type.props ? (t.props = i) : (t.props = r),
    (t.attrs = r));
}
function Ml(t, e, n, s) {
  const {
      props: i,
      attrs: r,
      vnode: { patchFlag: o },
    } = t,
    l = X(i),
    [c] = t.propsOptions;
  let f = !1;
  if ((s || o > 0) && !(o & 16)) {
    if (o & 8) {
      const u = t.vnode.dynamicProps;
      for (let a = 0; a < u.length; a++) {
        let h = u[a];
        if (Qn(t.emitsOptions, h)) continue;
        const b = e[h];
        if (c)
          if (q(r, h)) b !== r[h] && ((r[h] = b), (f = !0));
          else {
            const v = Dt(h);
            i[v] = _s(c, l, v, b, t, !1);
          }
        else b !== r[h] && ((r[h] = b), (f = !0));
      }
    }
  } else {
    Dr(t, e, i, r) && (f = !0);
    let u;
    for (const a in l)
      (!e || (!q(e, a) && ((u = Ae(a)) === a || !q(e, u)))) &&
        (c
          ? n &&
            (n[a] !== void 0 || n[u] !== void 0) &&
            (i[a] = _s(c, l, a, void 0, t, !0))
          : delete i[a]);
    if (r !== l) for (const a in r) (!e || !q(e, a)) && (delete r[a], (f = !0));
  }
  f && se(t.attrs, "set", "");
}
function Dr(t, e, n, s) {
  const [i, r] = t.propsOptions;
  let o = !1,
    l;
  if (e)
    for (let c in e) {
      if (Ge(c)) continue;
      const f = e[c];
      let u;
      i && q(i, (u = Dt(c)))
        ? !r || !r.includes(u)
          ? (n[u] = f)
          : ((l || (l = {}))[u] = f)
        : Qn(t.emitsOptions, c) ||
          ((!(c in s) || f !== s[c]) && ((s[c] = f), (o = !0)));
    }
  if (r) {
    const c = X(n),
      f = l || tt;
    for (let u = 0; u < r.length; u++) {
      const a = r[u];
      n[a] = _s(i, c, a, f[a], t, !q(f, a));
    }
  }
  return o;
}
function _s(t, e, n, s, i, r) {
  const o = t[n];
  if (o != null) {
    const l = q(o, "default");
    if (l && s === void 0) {
      const c = o.default;
      if (o.type !== Function && !o.skipFactory && N(c)) {
        const { propsDefaults: f } = i;
        if (n in f) s = f[n];
        else {
          const u = pn(i);
          ((s = f[n] = c.call(null, e)), u());
        }
      } else s = c;
      i.ce && i.ce._setProp(n, s);
    }
    o[0] &&
      (r && !l ? (s = !1) : o[1] && (s === "" || s === Ae(n)) && (s = !0));
  }
  return s;
}
const Cl = new WeakMap();
function Lr(t, e, n = !1) {
  const s = n ? Cl : e.propsCache,
    i = s.get(t);
  if (i) return i;
  const r = t.props,
    o = {},
    l = [];
  let c = !1;
  if (!N(t)) {
    const u = (a) => {
      c = !0;
      const [h, b] = Lr(a, e, !0);
      (ht(o, h), b && l.push(...b));
    };
    (!n && e.mixins.length && e.mixins.forEach(u),
      t.extends && u(t.extends),
      t.mixins && t.mixins.forEach(u));
  }
  if (!r && !c) return (Q(t) && s.set(t, _e), _e);
  if (U(r))
    for (let u = 0; u < r.length; u++) {
      const a = Dt(r[u]);
      mi(a) && (o[a] = tt);
    }
  else if (r)
    for (const u in r) {
      const a = Dt(u);
      if (mi(a)) {
        const h = r[u],
          b = (o[a] = U(h) || N(h) ? { type: h } : ht({}, h)),
          v = b.type;
        let y = !1,
          S = !0;
        if (U(v))
          for (let M = 0; M < v.length; ++M) {
            const A = v[M],
              $ = N(A) && A.name;
            if ($ === "Boolean") {
              y = !0;
              break;
            } else $ === "String" && (S = !1);
          }
        else y = N(v) && v.name === "Boolean";
        ((b[0] = y), (b[1] = S), (y || q(b, "default")) && l.push(a));
      }
    }
  const f = [o, l];
  return (Q(t) && s.set(t, f), f);
}
function mi(t) {
  return t[0] !== "$" && !Ge(t);
}
const $s = (t) => t === "_" || t === "_ctx" || t === "$stable",
  Hs = (t) => (U(t) ? t.map(qt) : [qt(t)]),
  Al = (t, e, n) => {
    if (e._n) return e;
    const s = zo((...i) => Hs(e(...i)), n);
    return ((s._c = !1), s);
  },
  Ur = (t, e, n) => {
    const s = t._ctx;
    for (const i in t) {
      if ($s(i)) continue;
      const r = t[i];
      if (N(r)) e[i] = Al(i, r, s);
      else if (r != null) {
        const o = Hs(r);
        e[i] = () => o;
      }
    }
  },
  $r = (t, e) => {
    const n = Hs(e);
    t.slots.default = () => n;
  },
  Hr = (t, e, n) => {
    for (const s in e) (n || !$s(s)) && (t[s] = e[s]);
  },
  Pl = (t, e, n) => {
    const s = (t.slots = Fr());
    if (t.vnode.shapeFlag & 32) {
      const i = e._;
      i ? (Hr(s, e, n), n && Ki(s, "_", i, !0)) : Ur(e, s);
    } else e && $r(t, e);
  },
  Rl = (t, e, n) => {
    const { vnode: s, slots: i } = t;
    let r = !0,
      o = tt;
    if (s.shapeFlag & 32) {
      const l = e._;
      (l
        ? n && l === 1
          ? (r = !1)
          : Hr(i, e, n)
        : ((r = !e.$stable), Ur(e, i)),
        (o = e));
    } else e && ($r(t, e), (o = { default: 1 }));
    if (r) for (const l in i) !$s(l) && o[l] == null && delete i[l];
  },
  St = Dl;
function Il(t) {
  return kl(t);
}
function kl(t, e) {
  const n = jn();
  n.__VUE__ = !0;
  const {
      insert: s,
      remove: i,
      patchProp: r,
      createElement: o,
      createText: l,
      createComment: c,
      setText: f,
      setElementText: u,
      parentNode: a,
      nextSibling: h,
      setScopeId: b = Gt,
      insertStaticContent: v,
    } = t,
    y = (
      d,
      p,
      g,
      T = null,
      _ = null,
      w = null,
      I = void 0,
      R = null,
      P = !!p.dynamicChildren,
    ) => {
      if (d === p) return;
      (d && !We(d, p) && ((T = gn(d)), Ft(d, _, w, !0), (d = null)),
        p.patchFlag === -2 && ((P = !1), (p.dynamicChildren = null)),
        p.dynamicChildren &&
          d &&
          d.dynamicChildren &&
          d.dynamicChildren.hasOnce &&
          (p.dynamicChildren === _e && (p.dynamicChildren = []),
          (p.dynamicChildren.hasOnce = !0)));
      const { type: x, ref: D, shapeFlag: k } = p;
      switch (x) {
        case Jn:
          S(d, p, g, T);
          break;
        case Ht:
          M(d, p, g, T);
          break;
        case Sn:
          d == null && A(p, g, T, I);
          break;
        case nt:
          B(d, p, g, T, _, w, I, R, P);
          break;
        default:
          k & 1
            ? st(d, p, g, T, _, w, I, R, P)
            : k & 6
              ? yt(d, p, g, T, _, w, I, R, P)
              : (k & 64 || k & 128) && x.process(d, p, g, T, _, w, I, R, P, Ne);
      }
      D != null && _
        ? Je(D, d && d.ref, w, p || d, !p)
        : D == null && d && d.ref != null && Je(d.ref, null, w, d, !0);
    },
    S = (d, p, g, T) => {
      if (d == null) s((p.el = l(p.children)), g, T);
      else {
        const _ = (p.el = d.el);
        p.children !== d.children && f(_, p.children);
      }
    },
    M = (d, p, g, T) => {
      d == null ? s((p.el = c(p.children || "")), g, T) : (p.el = d.el);
    },
    A = (d, p, g, T) => {
      [d.el, d.anchor] = v(d.children, p, g, T, d.el, d.anchor);
    },
    $ = ({ el: d, anchor: p }, g, T) => {
      let _;
      for (; d && d !== p;) ((_ = h(d)), s(d, g, T), (d = _));
      s(p, g, T);
    },
    O = ({ el: d, anchor: p }) => {
      let g;
      for (; d && d !== p;) ((g = h(d)), i(d), (d = g));
      i(p);
    },
    st = (d, p, g, T, _, w, I, R, P) => {
      if (
        (p.type === "svg" ? (I = "svg") : p.type === "math" && (I = "mathml"),
        d == null)
      )
        pt(p, g, T, _, w, I, R, P);
      else {
        const x = d.el && d.el._isVueCE ? d.el : null;
        try {
          (x && x._beginPatch(), z(d, p, _, w, I, R, P));
        } finally {
          x && x._endPatch();
        }
      }
    },
    pt = (d, p, g, T, _, w, I, R) => {
      let P, x;
      const { props: D, shapeFlag: k, transition: L, dirs: H } = d;
      if (
        ((P = d.el = o(d.type, w, D && D.is, D)),
        k & 8
          ? u(P, d.children)
          : k & 16 && Mt(d.children, P, null, T, _, as(d, w), I, R),
        H && pe(d, null, T, "created"),
        wt(P, d, d.scopeId, I, T),
        D)
      ) {
        for (const Z in D) Z !== "value" && !Ge(Z) && r(P, Z, null, D[Z], w, T);
        ("value" in D && r(P, "value", null, D.value, w),
          (x = D.onVnodeBeforeMount) && jt(x, T, d));
      }
      H && pe(d, null, T, "beforeMount");
      const K = Fl(_, L);
      (K && L.beforeEnter(P),
        s(P, p, g),
        ((x = D && D.onVnodeMounted) || K || H) &&
          St(() => {
            try {
              (x && jt(x, T, d),
                K && L.enter(P),
                H && pe(d, null, T, "mounted"));
            } finally {
            }
          }, _));
    },
    wt = (d, p, g, T, _) => {
      if ((g && b(d, g), T)) for (let w = 0; w < T.length; w++) b(d, T[w]);
      if (_) {
        let w = _.subTree;
        if (
          p === w ||
          (Br(w.type) && (w.ssContent === p || w.ssFallback === p))
        ) {
          const I = _.vnode;
          wt(d, I, I.scopeId, I.slotScopeIds, _.parent);
        }
      }
    },
    Mt = (d, p, g, T, _, w, I, R, P = 0) => {
      for (let x = P; x < d.length; x++) {
        const D = (d[x] = R ? ne(d[x]) : qt(d[x]));
        y(null, D, p, g, T, _, w, I, R);
      }
    },
    z = (d, p, g, T, _, w, I) => {
      const R = (p.el = d.el);
      let { patchFlag: P, dynamicChildren: x, dirs: D } = p;
      P |= d.patchFlag & 16;
      const k = d.props || tt,
        L = p.props || tt;
      let H;
      if (
        (g && me(g, !1),
        (H = L.onVnodeBeforeUpdate) && jt(H, g, p, d),
        D && pe(p, d, g, "beforeUpdate"),
        g && me(g, !0),
        x &&
          (!d.dynamicChildren || d.dynamicChildren.length !== x.length) &&
          ((P = 0), (I = !1), (x = null)),
        ((k.innerHTML && L.innerHTML == null) ||
          (k.textContent && L.textContent == null)) &&
          u(R, ""),
        x
          ? lt(d.dynamicChildren, x, R, g, T, as(p, _), w)
          : I || G(d, p, R, null, g, T, as(p, _), w, !1),
        P > 0)
      ) {
        if (P & 16) F(R, k, L, g, _);
        else if (
          (P & 2 && k.class !== L.class && r(R, "class", null, L.class, _),
          P & 4 && r(R, "style", k.style, L.style, _),
          P & 8)
        ) {
          const K = p.dynamicProps;
          for (let Z = 0; Z < K.length; Z++) {
            const Y = K[Z],
              at = k[Y],
              ft = L[Y];
            (ft !== at || Y === "value") && r(R, Y, at, ft, _, g);
          }
        }
        P & 1 && d.children !== p.children && u(R, p.children);
      } else !I && x == null && F(R, k, L, g, _);
      ((H = L.onVnodeUpdated) || D) &&
        St(() => {
          (H && jt(H, g, p, d), D && pe(p, d, g, "updated"));
        }, T);
    },
    lt = (d, p, g, T, _, w, I) => {
      for (let R = 0; R < p.length; R++) {
        const P = d[R],
          x = p[R],
          D = P.el || ws(P),
          k = D && (P.type === nt || !We(P, x) || P.shapeFlag & 198) ? a(D) : g;
        y(P, x, k, null, T, _, w, I, !0);
      }
    },
    F = (d, p, g, T, _) => {
      if (p !== g) {
        if (p !== tt)
          for (const w in p) !Ge(w) && !(w in g) && r(d, w, p[w], null, _, T);
        for (const w in g) {
          if (Ge(w)) continue;
          const I = g[w],
            R = p[w];
          I !== R && w !== "value" && r(d, w, R, I, _, T);
        }
        "value" in g && r(d, "value", p.value, g.value, _);
      }
    },
    B = (d, p, g, T, _, w, I, R, P) => {
      const x = (p.el = d ? d.el : l("")),
        D = (p.anchor = d ? d.anchor : l(""));
      let { patchFlag: k, dynamicChildren: L, slotScopeIds: H } = p;
      (H && (R = R ? R.concat(H) : H),
        d == null
          ? (s(x, g, T), s(D, g, T), Mt(p.children || [], g, D, _, w, I, R, P))
          : k > 0 &&
              k & 64 &&
              L &&
              d.dynamicChildren &&
              d.dynamicChildren.length === L.length
            ? (lt(d.dynamicChildren, L, g, _, w, I, R),
              (p.key != null || (_ && p === _.subTree)) && Nr(d, p, !0))
            : G(d, p, g, D, _, w, I, R, P));
    },
    yt = (d, p, g, T, _, w, I, R, P) => {
      ((p.slotScopeIds = R),
        d == null
          ? p.shapeFlag & 512
            ? _.ctx.activate(p, g, T, I, P)
            : Pe(p, g, T, _, w, I, P)
          : mn(d, p, P));
    },
    Pe = (d, p, g, T, _, w, I) => {
      const R = (d.component = Vl(d, T, _));
      if ((Us(d) && (R.ctx.renderer = Ne), Wl(R, !1, I), R.asyncDep)) {
        if ((_ && _.registerDep(R, ut, I, w), !d.el)) {
          const P = (R.subTree = Ut(Ht));
          (M(null, P, p, g), (d.placeholder = P.el));
        }
      } else ut(R, d, p, g, _, w, I);
    },
    mn = (d, p, g) => {
      const T = (p.component = d.component);
      if (Tl(d, p, g))
        if (T.asyncDep && !T.asyncResolved) {
          ((p.el = d.el), (p.placeholder = d.placeholder), J(T, p, g));
          return;
        } else ((T.next = p), T.update());
      else ((p.el = d.el), (p.placeholder = d.placeholder), (T.vnode = p));
    },
    ut = (d, p, g, T, _, w, I) => {
      const R = () => {
        if (d.isMounted) {
          let { next: k, bu: L, u: H, parent: K, vnode: Z } = d;
          {
            const Bt = Vr(d);
            if (Bt) {
              (k && ((k.el = Z.el), J(d, k, I)),
                Bt.asyncDep.then(() => {
                  St(() => {
                    d.isUnmounted || x();
                  }, _);
                }));
              return;
            }
          }
          let Y = k,
            at;
          (me(d, !1),
            k ? ((k.el = Z.el), J(d, k, I)) : (k = Z),
            L && wn(L),
            (at = k.props && k.props.onVnodeBeforeUpdate) && jt(at, K, k, Z),
            me(d, !0));
          const ft = hi(d),
            Vt = d.subTree;
          ((d.subTree = ft),
            y(Vt, ft, a(Vt.el), gn(Vt), d, _, w),
            (k.el = ft.el),
            Y === null && Sl(d, ft.el),
            H && St(H, _),
            (at = k.props && k.props.onVnodeUpdated) &&
              St(() => jt(at, K, k, Z), _));
        } else {
          let k;
          const { el: L, props: H } = p,
            { bm: K, m: Z, parent: Y, root: at, type: ft } = d,
            Vt = Ze(p);
          (me(d, !1),
            K && wn(K),
            !Vt && (k = H && H.onVnodeBeforeMount) && jt(k, Y, p),
            me(d, !0));
          {
            at.ce &&
              at.ce._hasShadowRoot() &&
              at.ce._injectChildStyle(ft, d.parent ? d.parent.type : void 0);
            const Bt = (d.subTree = hi(d));
            (y(null, Bt, g, T, d, _, w), (p.el = Bt.el));
          }
          if ((Z && St(Z, _), !Vt && (k = H && H.onVnodeMounted))) {
            const Bt = p;
            St(() => jt(k, Y, Bt), _);
          }
          ((p.shapeFlag & 256 ||
            (Y && Ze(Y.vnode) && Y.vnode.shapeFlag & 256)) &&
            d.a &&
            St(d.a, _),
            (d.isMounted = !0),
            (p = g = T = null));
        }
      };
      d.scope.on();
      const P = (d.effect = new Yi(R));
      d.scope.off();
      const x = (d.update = P.run.bind(P)),
        D = (d.job = P.runIfDirty.bind(P));
      ((D.i = d), (D.id = d.uid), (P.scheduler = () => Ls(D)), me(d, !0), x());
    },
    J = (d, p, g) => {
      p.component = d;
      const T = d.vnode.props;
      ((d.vnode = p),
        (d.next = null),
        Ml(d, p.props, T, g),
        Rl(d, p.children, g),
        Qt(),
        gr(d),
        Jt());
    },
    G = (d, p, g, T, _, w, I, R, P = !1) => {
      const x = d && d.children,
        D = d ? d.shapeFlag : 0,
        k = p.children,
        { patchFlag: L, shapeFlag: H } = p;
      if (L > 0) {
        if (L & 128) {
          de(x, k, g, T, _, w, I, R, P);
          return;
        } else if (L & 256) {
          Nt(x, k, g, T, _, w, I, R, P);
          return;
        }
      }
      H & 8
        ? (D & 16 && He(x, _, w), k !== x && u(g, k))
        : D & 16
          ? H & 16
            ? de(x, k, g, T, _, w, I, R, P)
            : He(x, _, w, !0)
          : (D & 8 && u(g, ""), H & 16 && Mt(k, g, T, _, w, I, R, P));
    },
    Nt = (d, p, g, T, _, w, I, R, P) => {
      ((d = d || _e), (p = p || _e));
      const x = d.length,
        D = p.length,
        k = Math.min(x, D);
      let L;
      for (L = 0; L < k; L++) {
        const H = (p[L] = P ? ne(p[L]) : qt(p[L]));
        y(d[L], H, g, null, _, w, I, R, P);
      }
      x > D ? He(d, _, w, !0, !1, k) : Mt(p, g, T, _, w, I, R, P, k);
    },
    de = (d, p, g, T, _, w, I, R, P) => {
      let x = 0;
      const D = p.length;
      let k = d.length - 1,
        L = D - 1;
      for (; x <= k && x <= L;) {
        const H = d[x],
          K = (p[x] = P ? ne(p[x]) : qt(p[x]));
        if (We(H, K)) y(H, K, g, null, _, w, I, R, P);
        else break;
        x++;
      }
      for (; x <= k && x <= L;) {
        const H = d[k],
          K = (p[L] = P ? ne(p[L]) : qt(p[L]));
        if (We(H, K)) y(H, K, g, null, _, w, I, R, P);
        else break;
        (k--, L--);
      }
      if (x > k) {
        if (x <= L) {
          const H = L + 1,
            K = H < D ? p[H].el : T;
          for (; x <= L;)
            (y(null, (p[x] = P ? ne(p[x]) : qt(p[x])), g, K, _, w, I, R, P),
              x++);
        }
      } else if (x > L) for (; x <= k;) (Ft(d[x], _, w, !0), x++);
      else {
        const H = x,
          K = x,
          Z = new Map();
        for (x = K; x <= L; x++) {
          const Ct = (p[x] = P ? ne(p[x]) : qt(p[x]));
          Ct.key != null && Z.set(Ct.key, x);
        }
        let Y,
          at = 0;
        const ft = L - K + 1;
        let Vt = !1,
          Bt = 0;
        const Ve = new Array(ft);
        for (x = 0; x < ft; x++) Ve[x] = 0;
        for (x = H; x <= k; x++) {
          const Ct = d[x];
          if (at >= ft) {
            Ft(Ct, _, w, !0);
            continue;
          }
          let Wt;
          if (Ct.key != null) Wt = Z.get(Ct.key);
          else
            for (Y = K; Y <= L; Y++)
              if (Ve[Y - K] === 0 && We(Ct, p[Y])) {
                Wt = Y;
                break;
              }
          Wt === void 0
            ? Ft(Ct, _, w, !0)
            : ((Ve[Wt - K] = x + 1),
              Wt >= Bt ? (Bt = Wt) : (Vt = !0),
              y(Ct, p[Wt], g, null, _, w, I, R, P),
              at++);
        }
        const Ys = Vt ? Ol(Ve) : _e;
        for (Y = Ys.length - 1, x = ft - 1; x >= 0; x--) {
          const Ct = K + x,
            Wt = p[Ct],
            Qs = p[Ct + 1],
            Js = Ct + 1 < D ? Qs.el || ws(Qs) : T;
          Ve[x] === 0
            ? y(null, Wt, g, Js, _, w, I, R, P)
            : Vt && (Y < 0 || x !== Ys[Y] ? he(Wt, g, Js, 2) : Y--);
        }
      }
    },
    he = (d, p, g, T, _ = null) => {
      const { el: w, type: I, transition: R, children: P, shapeFlag: x } = d;
      if (x & 6) {
        he(d.component.subTree, p, g, T);
        return;
      }
      if (x & 128) {
        d.suspense.move(p, g, T);
        return;
      }
      if (x & 64) {
        I.move(d, p, g, Ne);
        return;
      }
      if (I === nt) {
        s(w, p, g);
        for (let k = 0; k < P.length; k++) he(P[k], p, g, T);
        s(d.anchor, p, g);
        return;
      }
      if (I === Sn) {
        $(d, p, g);
        return;
      }
      if (T !== 2 && x & 1 && R)
        if (T === 0)
          R.persisted && !w[os]
            ? s(w, p, g)
            : (R.beforeEnter(w), s(w, p, g), St(() => R.enter(w), _));
        else {
          const { leave: k, delayLeave: L, afterLeave: H } = R,
            K = () => {
              d.ctx.isUnmounted ? i(w) : s(w, p, g);
            },
            Z = () => {
              const Y = w._isLeaving || !!w[os];
              (w._isLeaving && w[os](!0),
                R.persisted && !Y
                  ? K()
                  : k(w, () => {
                      (K(), H && H());
                    }));
            };
          L ? L(w, K, Z) : Z();
        }
      else s(w, p, g);
    },
    Ft = (d, p, g, T = !1, _ = !1) => {
      const {
        type: w,
        props: I,
        ref: R,
        children: P,
        dynamicChildren: x,
        shapeFlag: D,
        patchFlag: k,
        dirs: L,
        cacheIndex: H,
        memo: K,
      } = d;
      if (
        ((k === -2 || (x && x.hasOnce)) && (_ = !1),
        R != null && (Qt(), Je(R, null, g, d, !0), Jt()),
        H != null && (!d.ctx || d.ctx === p) && (p.renderCache[H] = void 0),
        D & 256)
      ) {
        p.ctx.deactivate(d);
        return;
      }
      const Z = D & 1 && L,
        Y = !Ze(d);
      let at;
      if ((Y && (at = I && I.onVnodeBeforeUnmount) && jt(at, p, d), D & 6))
        no(d.component, g, T);
      else {
        if (D & 128) {
          d.suspense.unmount(g, T);
          return;
        }
        (Z && pe(d, null, p, "beforeUnmount"),
          D & 64
            ? d.type.remove(d, p, g, Ne, T)
            : x && !x.hasOnce && (w !== nt || (k > 0 && k & 64))
              ? He(x, p, g, !1, !0)
              : ((w === nt && k & 384) || (!_ && D & 16)) && He(P, p, g),
          T && qs(d));
      }
      const ft = K != null && H == null;
      ((Y && (at = I && I.onVnodeUnmounted)) || Z || ft) &&
        St(() => {
          (at && jt(at, p, d),
            Z && pe(d, null, p, "unmounted"),
            ft && (d.el = null));
        }, g);
    },
    qs = (d) => {
      const { type: p, el: g, anchor: T, transition: _ } = d,
        w = p === nt;
      if (w && !_) {
        Xs(g, T);
        return;
      }
      if (p === Sn) {
        (O(d), _ && !_.persisted && _.afterLeave && _.afterLeave());
        return;
      }
      const I = w ? vs(d) : d,
        R = () => {
          (w ? a(g) && Xs(g, T) : i(g),
            _ && !_.persisted && _.afterLeave && _.afterLeave());
        };
      if (I && I.shapeFlag & 1 && _ && !_.persisted) {
        const { leave: P, delayLeave: x } = _,
          D = I.el,
          k = () => P(D, R);
        x ? x(D, R, k) : k();
      } else R();
    },
    Xs = (d, p) => {
      let g;
      for (; d !== p;) ((g = h(d)), i(d), (d = g));
      i(p);
    },
    no = (d, p, g) => {
      const { bum: T, scope: _, job: w, subTree: I, um: R, m: P, a: x } = d;
      (gi(P),
        gi(x),
        T && wn(T),
        _.stop(),
        w
          ? ((w.flags |= 8), Ft(I, d, p, g))
          : d.vnode.el &&
            I &&
            ((I.transition = d.vnode.transition), Ft(I, d, p, g)),
        R && St(R, p),
        St(() => {
          d.isUnmounted = !0;
        }, p));
    },
    He = (d, p, g, T = !1, _ = !1, w = 0) => {
      for (let I = w; I < d.length; I++) Ft(d[I], p, g, T, _);
    },
    gn = (d) => {
      if (d.shapeFlag & 6) return gn(d.component.subTree);
      if (d.shapeFlag & 128) return d.suspense.next();
      const p = h(d.anchor || d.el),
        g = p && p[Qo];
      return g ? h(g) : p;
    },
    Gs = (d, p, g) => {
      const T =
        d && p._vnode ? void 0 : d && d.component ? d.component.uid : Nl();
      Ko(() => {
        (d == null
          ? p._vnode && Ft(p._vnode, null, null, !0)
          : y(p._vnode || null, d, p, null, null, null, g),
          (p._vnode = d));
      }, T);
    },
    Ne = {
      p: y,
      um: Ft,
      m: he,
      r: qs,
      mt: Pe,
      mc: Mt,
      pc: G,
      pbc: lt,
      n: gn,
      o: t,
    };
  return { render: Gs, hydrate: void 0, createApp: vl(Gs) };
}
function as({ type: t, props: e }, n) {
  return (n === "svg" && t === "foreignObject") ||
    (n === "mathml" &&
      t === "annotation-xml" &&
      e &&
      e.encoding &&
      e.encoding.includes("html"))
    ? void 0
    : n;
}
function me({ effect: t, job: e }, n) {
  n ? ((t.flags |= 32), (e.flags |= 4)) : ((t.flags &= -33), (e.flags &= -5));
}
function Fl(t, e) {
  return (!t || (t && !t.pendingBranch)) && e && !e.persisted;
}
function Nr(t, e, n = !1) {
  const s = t.children,
    i = e.children;
  if (U(s) && U(i))
    for (let r = 0; r < s.length; r++) {
      const o = s[r];
      let l = i[r];
      (l.shapeFlag & 1 &&
        !l.dynamicChildren &&
        ((l.patchFlag <= 0 || l.patchFlag === 32) &&
          ((l = i[r] = ne(i[r])), (l.el = o.el)),
        !n && l.patchFlag !== -2 && Nr(o, l)),
        l.type === Jn &&
          (l.patchFlag === -1 && (l = i[r] = ne(l)), (l.el = o.el)),
        l.type === Ht && !l.el && (l.el = o.el));
    }
}
function Ol(t) {
  const e = t.slice(),
    n = [0];
  let s, i, r, o, l;
  const c = t.length;
  for (s = 0; s < c; s++) {
    const f = t[s];
    if (f !== 0) {
      if (((i = n[n.length - 1]), t[i] < f)) {
        ((e[s] = i), n.push(s));
        continue;
      }
      for (r = 0, o = n.length - 1; r < o;)
        ((l = (r + o) >> 1), t[n[l]] < f ? (r = l + 1) : (o = l));
      f < t[n[r]] && (r > 0 && (e[s] = n[r - 1]), (n[r] = s));
    }
  }
  for (r = n.length, o = n[r - 1]; r-- > 0;) ((n[r] = o), (o = e[o]));
  return n;
}
function Vr(t) {
  const e = t.subTree.component;
  if (e) return e.asyncDep && !e.asyncResolved ? e : Vr(e);
}
function gi(t) {
  if (t) for (let e = 0; e < t.length; e++) t[e].flags |= 8;
}
function ws(t) {
  if (t.placeholder) return t.placeholder;
  const e = t.component;
  return e ? ws(e.subTree) : null;
}
const Br = (t) => t.__isSuspense;
function Dl(t, e) {
  e && e.pendingBranch
    ? U(t)
      ? e.effects.push(...t)
      : e.effects.push(t)
    : jo(t);
}
const nt = Symbol.for("v-fgt"),
  Jn = Symbol.for("v-txt"),
  Ht = Symbol.for("v-cmt"),
  Sn = Symbol.for("v-stc"),
  Se = [];
let At = null;
function V(t = !1) {
  Se.push((At = t ? null : []));
}
function Wr() {
  (Se.pop(), (At = Se[Se.length - 1] || null));
}
let rn = 1;
function vi(t, e = !1) {
  ((rn += t), t < 0 && At && e && (At.hasOnce = !0));
}
function jr(t) {
  return (
    (t.dynamicChildren = rn > 0 ? At || _e : null),
    Wr(),
    rn > 0 && At && At.push(t),
    t
  );
}
function W(t, e, n, s, i, r) {
  return jr(m(t, e, n, s, i, r, !0));
}
function ze(t, e, n, s, i) {
  return jr(Ut(t, e, n, s, i, !0));
}
function Ns(t) {
  return t ? t.__v_isVNode === !0 : !1;
}
function We(t, e) {
  return t.type === e.type && t.key === e.key;
}
const Kr = ({ key: t }) => t ?? null,
  En = ({ ref: t, ref_key: e, ref_for: n }) => (
    typeof t == "number" && (t = "" + t),
    t != null
      ? it(t) || vt(t) || N(t)
        ? { i: Rt, r: t, k: e, f: !!n }
        : t
      : null
  );
function m(
  t,
  e = null,
  n = null,
  s = 0,
  i = null,
  r = t === nt ? 0 : 1,
  o = !1,
  l = !1,
) {
  const c = {
    __v_isVNode: !0,
    __v_skip: !0,
    type: t,
    props: e,
    key: e && Kr(e),
    ref: e && En(e),
    scopeId: br,
    slotScopeIds: null,
    children: n,
    component: null,
    suspense: null,
    ssContent: null,
    ssFallback: null,
    dirs: null,
    transition: null,
    el: null,
    anchor: null,
    target: null,
    targetStart: null,
    targetAnchor: null,
    staticCount: 0,
    shapeFlag: r,
    patchFlag: s,
    dynamicProps: i,
    dynamicChildren: null,
    appContext: null,
    ctx: Rt,
  };
  return (
    l
      ? (kn(c, n), r & 128 && t.normalize(c))
      : n && (c.shapeFlag |= it(n) ? 8 : 16),
    rn > 0 &&
      !o &&
      At &&
      (c.patchFlag > 0 || r & 6) &&
      c.patchFlag !== 32 &&
      At.push(c),
    c
  );
}
const Ut = Ll;
function Ll(t, e = null, n = null, s = 0, i = null, r = !1) {
  if (((!t || t === cl) && (t = Ht), Ns(t))) {
    const l = Le(t, e, !0);
    return (
      n && kn(l, n),
      rn > 0 &&
        !r &&
        At &&
        (l.shapeFlag & 6 ? (At[At.indexOf(t)] = l) : At.push(l)),
      (l.patchFlag = -2),
      l
    );
  }
  if ((ql(t) && (t = t.__vccOpts), e)) {
    e = Ul(e);
    let { class: l, style: c } = e;
    (l && !it(l) && (e.class = Me(l)),
      Q(c) && (Ds(c) && !U(c) && (c = ht({}, c)), (e.style = Ee(c))));
  }
  const o = it(t) ? 1 : Br(t) ? 128 : Xn(t) ? 64 : Q(t) ? 4 : N(t) ? 2 : 0;
  return m(t, e, n, s, i, o, r, !0);
}
function Ul(t) {
  return t ? (Ds(t) || Or(t) ? ht({}, t) : t) : null;
}
function Le(t, e, n = !1, s = !1) {
  const { props: i, ref: r, patchFlag: o, children: l, transition: c } = t,
    f = e ? $l(i || {}, e) : i,
    u = {
      __v_isVNode: !0,
      __v_skip: !0,
      type: t.type,
      props: f,
      key: f && Kr(f),
      ref:
        e && e.ref
          ? n && r
            ? U(r)
              ? r.concat(En(e))
              : [r, En(e)]
            : En(e)
          : r,
      scopeId: t.scopeId,
      slotScopeIds: t.slotScopeIds,
      children: l,
      target: t.target,
      targetStart: t.targetStart,
      targetAnchor: t.targetAnchor,
      staticCount: t.staticCount,
      shapeFlag: t.shapeFlag,
      patchFlag: e && t.type !== nt ? (o === -1 ? 16 : o | 16) : o,
      dynamicProps: t.dynamicProps,
      dynamicChildren: t.dynamicChildren,
      appContext: t.appContext,
      dirs: t.dirs,
      transition: c,
      component: t.component,
      suspense: t.suspense,
      ssContent: t.ssContent && Le(t.ssContent),
      ssFallback: t.ssFallback && Le(t.ssFallback),
      placeholder: t.placeholder,
      el: t.el,
      anchor: t.anchor,
      ctx: t.ctx,
      ce: t.ce,
      cacheIndex: t.cacheIndex,
    };
  return (c && s && Pn(u, c.clone(u)), u);
}
function ct(t = " ", e = 0) {
  return Ut(Jn, null, t, e);
}
function yi(t, e) {
  const n = Ut(Sn, null, t);
  return ((n.staticCount = e), n);
}
function Et(t = "", e = !1) {
  return e ? (V(), ze(Ht, null, t)) : Ut(Ht, null, t);
}
function qt(t) {
  return t == null || typeof t == "boolean"
    ? Ut(Ht)
    : U(t)
      ? Ut(nt, null, t.slice())
      : Ns(t)
        ? ne(t)
        : Ut(Jn, null, String(t));
}
function ne(t) {
  return (t.el === null && t.patchFlag !== -1) || t.memo ? t : Le(t);
}
function kn(t, e) {
  let n = 0;
  const { shapeFlag: s } = t;
  if (e == null) e = null;
  else if (U(e)) n = 16;
  else if (typeof e == "object")
    if (s & 65) {
      const i = e.default;
      i && (i._c && (i._d = !1), kn(t, i()), i._c && (i._d = !0));
      return;
    } else {
      n = 32;
      const i = e._;
      !i && !Or(e)
        ? (e._ctx = Rt)
        : i === 3 &&
          Rt &&
          (Rt.slots._ === 1 ? (e._ = 1) : ((e._ = 2), (t.patchFlag |= 1024)));
    }
  else if (N(e)) {
    if (s & 65) {
      kn(t, { default: e });
      return;
    }
    ((e = { default: e, _ctx: Rt }), (n = 32));
  } else ((e = String(e)), s & 64 ? ((n = 16), (e = [ct(e)])) : (n = 8));
  ((t.children = e), (t.shapeFlag |= n));
}
function $l(...t) {
  const e = {};
  for (let n = 0; n < t.length; n++) {
    const s = t[n];
    for (const i in s)
      if (i === "class")
        e.class !== s.class && (e.class = Me([e.class, s.class]));
      else if (i === "style") e.style = Ee([e.style, s.style]);
      else if (Vn(i)) {
        const r = e[i],
          o = s[i];
        o && r !== o && !(U(r) && r.includes(o))
          ? (e[i] = r ? [].concat(r, o) : o)
          : o == null && r == null && !Bn(i) && (e[i] = o);
      } else i !== "" && (e[i] = s[i]);
  }
  return e;
}
function jt(t, e, n, s = null) {
  $t(t, e, 7, [n, s]);
}
const Hl = Ar();
let zr = 0;
function Nl() {
  return zr;
}
function Vl(t, e, n) {
  const s = t.type,
    i = (e ? e.appContext : t.appContext) || Hl,
    r = {
      uid: zr++,
      vnode: t,
      type: s,
      parent: e,
      appContext: i,
      root: null,
      next: null,
      subTree: null,
      effect: null,
      update: null,
      job: null,
      scope: new go(!0),
      render: null,
      proxy: null,
      exposed: null,
      exposeProxy: null,
      withProxy: null,
      provides: e ? e.provides : Object.create(i.provides),
      ids: e ? e.ids : ["", 0, 0],
      accessCache: null,
      renderCache: [],
      components: null,
      directives: null,
      propsOptions: Lr(s, i),
      emitsOptions: Pr(s, i),
      emit: null,
      emitted: null,
      propsDefaults: tt,
      inheritAttrs: s.inheritAttrs,
      ctx: tt,
      data: tt,
      props: tt,
      attrs: tt,
      slots: tt,
      refs: tt,
      setupState: tt,
      setupContext: null,
      suspense: n,
      suspenseId: n ? n.pendingId : 0,
      asyncDep: null,
      asyncResolved: !1,
      isMounted: !1,
      isUnmounted: !1,
      isDeactivated: !1,
      bc: null,
      c: null,
      bm: null,
      m: null,
      bu: null,
      u: null,
      um: null,
      bum: null,
      da: null,
      a: null,
      rtg: null,
      rtc: null,
      ec: null,
      sp: null,
    };
  return (
    (r.ctx = { _: r }),
    (r.root = e ? e.root : r),
    (r.emit = bl.bind(null, r)),
    t.ce && t.ce(r),
    r
  );
}
let _t = null;
const Bl = () => _t || Rt;
let Fn, on;
{
  const t = jn(),
    e = (n, s) => {
      let i;
      return (
        (i = t[n]) || (i = t[n] = []),
        i.push(s),
        (r) => {
          i.length > 1 ? i.forEach((o) => o(r)) : i[0](r);
        }
      );
    };
  ((Fn = e("__VUE_INSTANCE_SETTERS__", (n) => (_t = n))),
    (on = e("__VUE_SSR_SETTERS__", (n) => (ln = n))));
}
const pn = (t) => {
    const e = _t;
    return (
      Fn(t),
      t.scope.on(),
      () => {
        (t.scope.off(), Fn(e));
      }
    );
  },
  bi = () => {
    (_t && _t.scope.off(), Fn(null));
  };
function qr(t) {
  return t.vnode.shapeFlag & 4;
}
let ln = !1;
function Wl(t, e = !1, n = !1) {
  e && on(e);
  const { props: s, children: i } = t.vnode,
    r = qr(t);
  (El(t, s, r, e), Pl(t, i, n || e));
  const o = r ? jl(t, e) : void 0;
  return (e && on(!1), o);
}
function jl(t, e) {
  const n = t.type;
  ((t.accessCache = Object.create(null)), (t.proxy = new Proxy(t.ctx, ul)));
  const { setup: s } = n;
  if (s) {
    Qt();
    const i = (t.setupContext = s.length > 1 ? zl(t) : null),
      r = pn(t),
      o = dn(s, t, 0, [t.props, i]),
      l = Vi(o);
    if ((Jt(), r(), (l || t.sp) && !Ze(t) && Tr(t), l)) {
      if ((o.then(bi, bi), e))
        return o
          .then((c) => {
            on(!0);
            try {
              xi(t, c, e);
            } finally {
              on(!1);
            }
          })
          .catch((c) => {
            qn(c, t, 0);
          });
      t.asyncDep = o;
    } else xi(t, o);
  } else Xr(t);
}
function xi(t, e, n) {
  (N(e)
    ? t.type.__ssrInlineRender
      ? (t.ssrRender = e)
      : (t.render = e)
    : Q(e) && (t.setupState = dr(e)),
    Xr(t));
}
function Xr(t, e, n) {
  const s = t.type;
  t.render || (t.render = s.render || Gt);
  {
    const i = pn(t);
    Qt();
    try {
      fl(t);
    } finally {
      (Jt(), i());
    }
  }
}
const Kl = {
  get(t, e) {
    return (gt(t, "get", ""), t[e]);
  },
};
function zl(t) {
  const e = (n) => {
    t.exposed = n || {};
  };
  return {
    attrs: new Proxy(t.attrs, Kl),
    slots: t.slots,
    emit: t.emit,
    expose: e,
  };
}
function Zn(t) {
  return t.exposed
    ? t.exposeProxy ||
        (t.exposeProxy = new Proxy(dr(Do(t.exposed)), {
          get(e, n) {
            if (n in e) return e[n];
            if (n in tn) return tn[n](t);
          },
          has(e, n) {
            return n in e || n in tn;
          },
        }))
    : t.proxy;
}
function ql(t) {
  return N(t) && "__vccOpts" in t;
}
const an = (t, e) => Ho(t, e, ln),
  Xl = "3.5.44";
/**
 * @vue/runtime-dom v3.5.44
 * (c) 2018-present Yuxi (Evan) You and Vue contributors
 * @license MIT
 **/ let Ts;
const _i = typeof window < "u" && window.trustedTypes;
if (_i)
  try {
    Ts = _i.createPolicy("vue", { createHTML: (t) => t });
  } catch {}
const Gr = Ts ? (t) => Ts.createHTML(t) : (t) => t,
  Gl = "http://www.w3.org/2000/svg",
  Yl = "http://www.w3.org/1998/Math/MathML",
  ee = typeof document < "u" ? document : null,
  wi = ee && ee.createElement("template"),
  Ql = {
    insert: (t, e, n) => {
      e.insertBefore(t, n || null);
    },
    remove: (t) => {
      const e = t.parentNode;
      e && e.removeChild(t);
    },
    createElement: (t, e, n, s) => {
      const i =
        e === "svg"
          ? ee.createElementNS(Gl, t)
          : e === "mathml"
            ? ee.createElementNS(Yl, t)
            : n
              ? ee.createElement(t, { is: n })
              : ee.createElement(t);
      return (
        t === "select" &&
          s &&
          s.multiple != null &&
          i.setAttribute("multiple", s.multiple),
        i
      );
    },
    createText: (t) => ee.createTextNode(t),
    createComment: (t) => ee.createComment(t),
    setText: (t, e) => {
      t.nodeValue = e;
    },
    setElementText: (t, e) => {
      t.textContent = e;
    },
    parentNode: (t) => t.parentNode,
    nextSibling: (t) => t.nextSibling,
    querySelector: (t) => ee.querySelector(t),
    setScopeId(t, e) {
      t.setAttribute(e, "");
    },
    insertStaticContent(t, e, n, s, i, r) {
      const o = n ? n.previousSibling : e.lastChild;
      if (i && (i === r || i.nextSibling))
        for (
          ;
          e.insertBefore(i.cloneNode(!0), n),
            !(i === r || !(i = i.nextSibling));
        );
      else {
        wi.innerHTML = Gr(
          s === "svg"
            ? `<svg>${t}</svg>`
            : s === "mathml"
              ? `<math>${t}</math>`
              : t,
        );
        const l = wi.content;
        if (s === "svg" || s === "mathml") {
          const c = l.firstChild;
          for (; c.firstChild;) l.appendChild(c.firstChild);
          l.removeChild(c);
        }
        e.insertBefore(l, n);
      }
      return [
        o ? o.nextSibling : e.firstChild,
        n ? n.previousSibling : e.lastChild,
      ];
    },
  },
  Jl = Symbol("_vtc");
function Zl(t, e, n) {
  const s = t[Jl];
  (s && (e = (e ? [e, ...s] : [...s]).join(" ")),
    e == null
      ? t.removeAttribute("class")
      : n
        ? t.setAttribute("class", e)
        : (t.className = e));
}
const Ti = Symbol("_vod"),
  ta = Symbol("_vsh"),
  ea = Symbol(""),
  na = /(?:^|;)\s*display\s*:/;
function sa(t, e, n) {
  const s = t.style,
    i = it(n);
  let r = !1;
  if (n && !i) {
    if (e)
      if (it(e))
        for (const o of e.split(";")) {
          const l = o.slice(0, o.indexOf(":")).trim();
          n[l] == null && qe(s, l, "");
        }
      else for (const o in e) n[o] == null && qe(s, o, "");
    for (const o in n) {
      o === "display" && (r = !0);
      const l = n[o];
      l != null
        ? ra(t, o, !it(e) && e ? e[o] : void 0, l) || qe(s, o, l)
        : qe(s, o, "");
    }
  } else if (i) {
    if (e !== n) {
      const o = s[ea];
      (o && (n += ";" + o), (s.cssText = n), (r = na.test(n)));
    }
  } else e && t.removeAttribute("style");
  Ti in t &&
    ((!i || e !== n) && (t[Ti] = r ? s.display : ""),
    t[ta] && (s.display = "none"));
}
const xn = /\s*!important$/;
function qe(t, e, n) {
  if (U(n)) n.forEach((s) => qe(t, e, s));
  else if ((n == null && (n = ""), e.startsWith("--")))
    xn.test(n)
      ? t.setProperty(e, n.replace(xn, ""), "important")
      : t.setProperty(e, n);
  else {
    const s = ia(t, e);
    xn.test(n)
      ? t.setProperty(Ae(s), n.replace(xn, ""), "important")
      : (t[s] = n);
  }
}
const Si = ["Webkit", "Moz", "ms"],
  cs = {};
function ia(t, e) {
  const n = cs[e];
  if (n) return n;
  let s = Dt(e);
  if (s !== "filter" && s in t) return (cs[e] = s);
  s = ji(s);
  for (let i = 0; i < Si.length; i++) {
    const r = Si[i] + s;
    if (r in t) return (cs[e] = r);
  }
  return e;
}
function ra(t, e, n, s) {
  return (
    t.tagName === "TEXTAREA" &&
    (e === "width" || e === "height") &&
    it(s) &&
    n === s
  );
}
const Ei = "http://www.w3.org/1999/xlink";
function Mi(t, e, n, s, i, r = ho(e)) {
  s && e.startsWith("xlink:")
    ? n == null
      ? t.removeAttributeNS(Ei, e.slice(6, e.length))
      : t.setAttributeNS(Ei, e, n)
    : n == null || (r && !qi(n))
      ? t.removeAttribute(e)
      : t.setAttribute(e, r ? "" : Yt(n) ? String(n) : n);
}
function Ci(t, e, n, s, i) {
  if (e === "innerHTML" || e === "textContent") {
    n != null && (t[e] = e === "innerHTML" ? Gr(n) : n);
    return;
  }
  const r = t.tagName;
  if (e === "value" && r !== "PROGRESS" && !r.includes("-")) {
    const l = r === "OPTION" ? t.getAttribute("value") || "" : t.value,
      c = n == null ? (t.type === "checkbox" ? "on" : "") : String(n);
    ((l !== c || !("_value" in t)) && (t.value = c),
      n == null && t.removeAttribute(e),
      (t._value = n));
    return;
  }
  let o = !1;
  if (n === "" || n == null) {
    const l = typeof t[e];
    l === "boolean"
      ? (n = qi(n))
      : n == null && l === "string"
        ? ((n = ""), (o = !0))
        : l === "number" && ((n = 0), (o = !0));
  }
  try {
    t[e] = n;
  } catch {}
  o && t.removeAttribute(i || e);
}
function Vs(t, e, n, s) {
  t.addEventListener(e, n, s);
}
function oa(t, e, n, s) {
  t.removeEventListener(e, n, s);
}
const Ai = Symbol("_vei");
function la(t, e, n, s, i = null) {
  const r = t[Ai] || (t[Ai] = {}),
    o = r[e];
  if (s && o) o.value = s;
  else {
    const [l, c] = ua(e);
    if (s) {
      const f = (r[e] = ha(s, i));
      Vs(t, l, f, c);
    } else o && (oa(t, l, o, c), (r[e] = void 0));
  }
}
const aa = /(Once|Passive|Capture)$/,
  ca = /^on:?(?:Once|Passive|Capture)$/;
function ua(t) {
  let e, n;
  for (; (n = t.match(aa)) && !ca.test(t);)
    (e || (e = {}),
      (t = t.slice(0, t.length - n[1].length)),
      (e[n[1].toLowerCase()] = !0));
  return [t[2] === ":" ? t.slice(3) : Ae(t.slice(2)), e];
}
let us = 0;
const fa = Promise.resolve(),
  da = () => us || (fa.then(() => (us = 0)), (us = Date.now()));
function ha(t, e) {
  const n = (s) => {
    if (!s._vts) s._vts = Date.now();
    else if (s._vts <= n.attached) return;
    const i = n.value;
    if (U(i)) {
      const r = s.stopImmediatePropagation;
      s.stopImmediatePropagation = () => {
        (r.call(s), (s._stopped = !0));
      };
      const o = i.slice(),
        l = [s];
      for (let c = 0; c < o.length && !s._stopped; c++) {
        const f = o[c];
        f && $t(f, e, 5, l);
      }
    } else $t(i, e, 5, [s]);
  };
  return ((n.value = t), (n.attached = da()), n);
}
const Pi = (t) =>
    t.charCodeAt(0) === 111 &&
    t.charCodeAt(1) === 110 &&
    t.charCodeAt(2) > 96 &&
    t.charCodeAt(2) < 123,
  pa = (t, e, n, s, i, r) => {
    const o = i === "svg";
    e === "class"
      ? Zl(t, s, o)
      : e === "style"
        ? sa(t, n, s)
        : Vn(e)
          ? Bn(e) || la(t, e, n, s, r)
          : (
                e[0] === "."
                  ? ((e = e.slice(1)), !0)
                  : e[0] === "^"
                    ? ((e = e.slice(1)), !1)
                    : ma(t, e, s, o)
              )
            ? (Ci(t, e, s),
              !t.tagName.includes("-") &&
                (e === "value" || e === "checked" || e === "selected") &&
                Mi(t, e, s, o, r, e !== "value"))
            : t._isVueCE &&
                (ga(t, e) ||
                  (t._def.__asyncLoader && (/[A-Z]/.test(e) || !it(s))))
              ? Ci(t, Dt(e), s, r, e)
              : (e === "true-value"
                  ? (t._trueValue = s)
                  : e === "false-value" && (t._falseValue = s),
                Mi(t, e, s, o));
  };
function ma(t, e, n, s) {
  if (s)
    return !!(
      e === "innerHTML" ||
      e === "textContent" ||
      (e in t && Pi(e) && N(n))
    );
  if (
    e === "spellcheck" ||
    e === "draggable" ||
    e === "translate" ||
    e === "autocorrect" ||
    (e === "sandbox" && t.tagName === "IFRAME") ||
    e === "form" ||
    (e === "list" && t.tagName === "INPUT") ||
    (e === "type" && t.tagName === "TEXTAREA")
  )
    return !1;
  if (e === "width" || e === "height") {
    const i = t.tagName;
    if (i === "IMG" || i === "VIDEO" || i === "CANVAS" || i === "SOURCE")
      return !1;
  }
  return Pi(e) && it(n) ? !1 : e in t;
}
function ga(t, e) {
  const n = t._def.props;
  if (!n) return !1;
  const s = Dt(e);
  return Array.isArray(n)
    ? n.some((i) => Dt(i) === s)
    : Object.keys(n).some((i) => Dt(i) === s);
}
const On = (t) => {
    const e = t.props["onUpdate:modelValue"] || !1;
    return U(e) ? (n) => wn(e, n) : e;
  },
  De = Symbol("_assign"),
  ge = {
    deep: !0,
    created(t, e, n) {
      ((t[De] = On(n)),
        Vs(t, "change", () => {
          const s = t._modelValue,
            i = cn(t),
            r = t.checked,
            o = t[De];
          if (U(s)) {
            const l = As(s, i),
              c = l !== -1;
            if (r && !c) o(s.concat(i));
            else if (!r && c) {
              const f = [...s];
              (f.splice(l, 1), o(f));
            }
          } else if (re(s)) {
            const l = new Set(s);
            (r ? l.add(i) : l.delete(i), o(l));
          } else o(Yr(t, r));
        }));
    },
    mounted: Ri,
    beforeUpdate(t, e, n) {
      ((t[De] = On(n)), Ri(t, e, n));
    },
  };
function Ri(t, { value: e, oldValue: n }, s) {
  t._modelValue = e;
  let i;
  if (U(e)) i = As(e, s.props.value) > -1;
  else if (re(e)) i = e.has(s.props.value);
  else {
    if (e === n) return;
    i = oe(e, Yr(t, !0));
  }
  t.checked !== i && (t.checked = i);
}
const ve = {
  deep: !0,
  created(t, { value: e, modifiers: { number: n } }, s) {
    ((t._modelValue = e),
      Vs(t, "change", () => {
        const i = Array.prototype.filter
            .call(t.options, (c) => c.selected)
            .map((c) => (n ? zi(cn(c)) : cn(c))),
          r = t.multiple,
          o = r ? (re(t._modelValue) ? new Set(i) : i) : i[0],
          l = (t._pendingValue = [r, r ? (U(o) ? i.slice() : i) : o]);
        try {
          t[De](o);
        } finally {
          pr(() => {
            t._pendingValue === l && (t._pendingValue = void 0);
          });
        }
      }),
      (t[De] = On(s)));
  },
  mounted(t, { value: e }) {
    Ii(t, e);
  },
  beforeUpdate(t, { value: e }, n) {
    ((t._modelValue = e), (t[De] = On(n)));
  },
  updated(t, { value: e }) {
    const n = t._pendingValue;
    ((t._pendingValue = void 0),
      (!n || n[0] !== t.multiple || !va(e, n[1], n[0])) && Ii(t, e));
  },
};
function va(t, e, n) {
  if (!n || U(t)) return oe(t, e);
  if (re(t)) {
    if (t.size !== e.length) return !1;
    for (const s of e) if (!t.has(s)) return !1;
    return !0;
  }
  return !1;
}
function Ii(t, e) {
  const n = t.multiple,
    s = U(e);
  if (!(n && !s && !re(e))) {
    for (let i = 0, r = t.options.length; i < r; i++) {
      const o = t.options[i],
        l = cn(o);
      if (n)
        if (s) {
          const c = typeof l;
          c === "string" || c === "number"
            ? (o.selected = e.some((f) => String(f) === String(l)))
            : (o.selected = As(e, l) > -1);
        } else o.selected = e.has(l);
      else if (oe(cn(o), e)) {
        t.selectedIndex !== i && (t.selectedIndex = i);
        return;
      }
    }
    !n && t.selectedIndex !== -1 && (t.selectedIndex = -1);
  }
}
function cn(t) {
  return "_value" in t ? t._value : t.value;
}
function Yr(t, e) {
  const n = e ? "_trueValue" : "_falseValue";
  return n in t ? t[n] : e;
}
const ya = ["ctrl", "shift", "alt", "meta"],
  ba = {
    stop: (t) => t.stopPropagation(),
    prevent: (t) => t.preventDefault(),
    self: (t) => t.target !== t.currentTarget,
    ctrl: (t) => !t.ctrlKey,
    shift: (t) => !t.shiftKey,
    alt: (t) => !t.altKey,
    meta: (t) => !t.metaKey,
    left: (t) => "button" in t && t.button !== 0,
    middle: (t) => "button" in t && t.button !== 1,
    right: (t) => "button" in t && t.button !== 2,
    exact: (t, e) => ya.some((n) => t[`${n}Key`] && !e.includes(n)),
  },
  be = (t, e) => {
    if (!t) return t;
    const n = t._withMods || (t._withMods = {}),
      s = e.join(".");
    return (
      n[s] ||
      (n[s] = (i, ...r) => {
        for (let o = 0; o < e.length; o++) {
          const l = ba[e[o]];
          if (l && l(i, e)) return;
        }
        return t(i, ...r);
      })
    );
  },
  xa = ht({ patchProp: pa }, Ql);
let ki;
function _a() {
  return ki || (ki = Il(xa));
}
const wa = (...t) => {
  const e = _a().createApp(...t),
    { mount: n } = e;
  return (
    (e.mount = (s) => {
      const i = Sa(s);
      if (!i) return;
      const r = e._component;
      (!N(r) && !r.render && !r.template && (r.template = i.innerHTML),
        i.nodeType === 1 && (i.textContent = ""));
      const o = n(i, !1, Ta(i));
      return (
        i instanceof Element &&
          (i.removeAttribute("v-cloak"), i.setAttribute("data-v-app", "")),
        o
      );
    }),
    e
  );
};
function Ta(t) {
  if (t instanceof SVGElement) return "svg";
  if (typeof MathMLElement == "function" && t instanceof MathMLElement)
    return "mathml";
}
function Sa(t) {
  return it(t) ? document.querySelector(t) : t;
}
const Ea = { class: "ui" },
  Ma = { class: "preview" },
  Ca = { key: 0, class: "grid" },
  Aa = { key: 1, class: "level", viewBox: "0 0 70 72", "aria-hidden": "true" },
  Pa = { class: "zoom-row", "data-control": "" },
  Ra = ["onClick"],
  Ia = { class: "shutter-row" },
  ka = { class: "mode-row" },
  Fa = ["src"],
  Oa = Ue({
    __name: "CameraUI",
    props: {
      zoom: {},
      zoomOptions: {},
      availableZoom: { type: Function },
      thumbnail: {},
      showGrid: { type: Boolean },
      showLevel: { type: Boolean },
    },
    emits: ["shutter", "flip", "zoom", "openSettings"],
    setup(t, { emit: e }) {
      const n = t,
        s = e,
        i = mt(0),
        r = mt(!1);
      function o() {
        (i.value++, s("flip"));
      }
      let l,
        c = { x: 0, y: 0 };
      function f(v) {
        ((c = { x: v.clientX, y: v.clientY }),
          clearTimeout(l),
          (l = setTimeout(() => s("openSettings"), 2e3)));
      }
      function u(v) {
        Math.hypot(v.clientX - c.x, v.clientY - c.y) > 12 && clearTimeout(l);
      }
      function a() {
        clearTimeout(l);
      }
      hn(() => clearTimeout(l));
      const h = [-39, 0, 38, 77];
      function b(v, y) {
        const S = v < 1 ? ".5" : String(v);
        return y ? `${S}×` : S;
      }
      return (v, y) => (
        V(),
        W("div", Ea, [
          y[12] || (y[12] = m("div", { class: "bar top" }, null, -1)),
          y[13] || (y[13] = m("div", { class: "bar bottom" }, null, -1)),
          m("div", Ma, [
            n.showGrid
              ? (V(),
                W("div", Ca, [
                  ...(y[4] ||
                    (y[4] = [
                      m(
                        "i",
                        { class: "v", style: { left: "33.333%" } },
                        null,
                        -1,
                      ),
                      m(
                        "i",
                        { class: "v", style: { left: "66.666%" } },
                        null,
                        -1,
                      ),
                      m(
                        "i",
                        { class: "h", style: { top: "33.333%" } },
                        null,
                        -1,
                      ),
                      m(
                        "i",
                        { class: "h", style: { top: "66.666%" } },
                        null,
                        -1,
                      ),
                    ])),
                ]))
              : Et("", !0),
            n.showLevel
              ? (V(),
                W("svg", Aa, [
                  ...(y[5] ||
                    (y[5] = [
                      m(
                        "path",
                        {
                          d: "M35 0 V72",
                          stroke: "#ffd60a",
                          "stroke-width": "2",
                        },
                        null,
                        -1,
                      ),
                      m(
                        "path",
                        {
                          d: "M0 34.5 H70 M0 38.5 H70",
                          stroke: "#ffd60a",
                          "stroke-width": "1.6",
                        },
                        null,
                        -1,
                      ),
                    ])),
                ]))
              : Et("", !0),
            y[11] ||
              (y[11] = yi(
                '<div class="top-icons" data-control data-v-4a1ecc4d><svg viewBox="0 0 24 24" aria-hidden="true" data-v-4a1ecc4d><path d="M13.2 2.5 5.6 13.1h5.3l-1.6 8.4 7.7-10.7h-5.3z" fill="#fff" data-v-4a1ecc4d></path><path d="M4.5 3.8 19.6 20" stroke="#000" stroke-width="3.4" stroke-linecap="round" data-v-4a1ecc4d></path><path d="M4.5 3.8 19.6 20" stroke="#fff" stroke-width="1.7" stroke-linecap="round" data-v-4a1ecc4d></path></svg><svg viewBox="0 0 24 24" aria-hidden="true" data-v-4a1ecc4d><circle cx="12" cy="12" r="10" fill="none" stroke="#fff" stroke-width="1.3" stroke-dasharray="0.6 1.9" stroke-linecap="round" data-v-4a1ecc4d></circle><circle cx="12" cy="12" r="7" fill="none" stroke="#fff" stroke-width="1.6" data-v-4a1ecc4d></circle><circle cx="12" cy="12" r="3.4" fill="none" stroke="#fff" stroke-width="1.6" data-v-4a1ecc4d></circle><path d="M4 4 20 20" stroke="#000" stroke-width="3.4" stroke-linecap="round" data-v-4a1ecc4d></path><path d="M4 4 20 20" stroke="#fff" stroke-width="1.6" stroke-linecap="round" data-v-4a1ecc4d></path></svg><svg viewBox="0 0 26 24" aria-hidden="true" data-v-4a1ecc4d><circle cx="9" cy="8" r="3.6" fill="#fff" data-v-4a1ecc4d></circle><path d="M2 19.5c0-4 3.2-6.6 7-6.6s7 2.6 7 6.6z" fill="#fff" data-v-4a1ecc4d></path><circle cx="17.5" cy="7.5" r="3.2" fill="#fff" data-v-4a1ecc4d></circle><path d="M14 13.2c1-.6 2.2-.9 3.5-.9 3.5 0 6.4 2.4 6.4 6v1.2h-6.6" fill="#fff" data-v-4a1ecc4d></path><path d="M5 3 23.5 21.5" stroke="#000" stroke-width="3.6" stroke-linecap="round" data-v-4a1ecc4d></path><path d="M5 3 23.5 21.5" stroke="#fff" stroke-width="1.7" stroke-linecap="round" data-v-4a1ecc4d></path></svg></div><div class="drawer-tab" data-control data-v-4a1ecc4d><svg viewBox="0 0 10 24" aria-hidden="true" data-v-4a1ecc4d><path d="M7.5 3 2.5 12l5 9" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round" data-v-4a1ecc4d></path></svg></div>',
                2,
              )),
            m("div", Pa, [
              (V(!0),
              W(
                nt,
                null,
                xe(
                  n.zoomOptions,
                  (S, M) => (
                    V(),
                    W(
                      "button",
                      {
                        key: S,
                        class: Me(["zoom", { on: n.zoom === S }]),
                        style: Ee({ left: `calc(50% + ${h[M]}px)` }),
                        onClick: (A) => n.availableZoom(S) && s("zoom", S),
                      },
                      j(b(S, n.zoom === S)),
                      15,
                      Ra,
                    )
                  ),
                ),
                128,
              )),
            ]),
            m("div", Ia, [
              y[7] ||
                (y[7] = m(
                  "div",
                  { class: "round side left", "data-control": "" },
                  [
                    m("svg", { viewBox: "0 0 24 24", "aria-hidden": "true" }, [
                      m("path", {
                        d: "M15.6 4.2c-1.7-.6-3.3.2-3.9 2.3L9 18.4c-.5 2.1-1.8 3-3.4 2.5",
                        stroke: "#fff",
                        "stroke-width": "1.7",
                        fill: "none",
                        "stroke-linecap": "round",
                      }),
                      m("path", {
                        d: "M8.4 10.6h7",
                        stroke: "#fff",
                        "stroke-width": "1.7",
                        "stroke-linecap": "round",
                      }),
                    ]),
                  ],
                  -1,
                )),
              m(
                "button",
                {
                  class: Me(["shutter", { down: r.value }]),
                  "data-control": "",
                  onPointerdown: y[0] || (y[0] = (S) => (r.value = !0)),
                  onPointerup: y[1] || (y[1] = (S) => (r.value = !1)),
                  onPointerleave: y[2] || (y[2] = (S) => (r.value = !1)),
                  onClick: y[3] || (y[3] = (S) => s("shutter")),
                },
                [...(y[6] || (y[6] = [m("span", null, null, -1)]))],
                34,
              ),
              y[8] ||
                (y[8] = yi(
                  '<div class="round side right" data-control data-v-4a1ecc4d><svg viewBox="0 0 24 24" aria-hidden="true" data-v-4a1ecc4d><g fill="#fff" data-v-4a1ecc4d><circle cx="5" cy="9" r="2.1" data-v-4a1ecc4d></circle><circle cx="12" cy="9" r="2.1" data-v-4a1ecc4d></circle><circle cx="19" cy="9" r="2.1" data-v-4a1ecc4d></circle><circle cx="5" cy="15.5" r="2.1" data-v-4a1ecc4d></circle><circle cx="12" cy="15.5" r="2.1" data-v-4a1ecc4d></circle><circle cx="19" cy="15.5" r="2.1" data-v-4a1ecc4d></circle></g></svg></div>',
                  1,
                )),
            ]),
            m("div", ka, [
              m(
                "div",
                {
                  class: "round thumb",
                  "data-control": "",
                  onPointerdown: f,
                  onPointermove: u,
                  onPointerup: a,
                  onPointercancel: a,
                  onPointerleave: a,
                },
                [
                  n.thumbnail
                    ? (V(),
                      W(
                        "img",
                        {
                          key: 0,
                          src: n.thumbnail,
                          alt: "",
                          draggable: "false",
                        },
                        null,
                        8,
                        Fa,
                      ))
                    : Et("", !0),
                ],
                32,
              ),
              y[10] ||
                (y[10] = m(
                  "div",
                  { class: "modes", "data-control": "" },
                  [
                    m("span", null, "錄影"),
                    m("span", { class: "on" }, "拍照"),
                    m("span", null, "人像"),
                  ],
                  -1,
                )),
              m(
                "button",
                { class: "round flip", "data-control": "", onClick: o },
                [
                  (V(),
                  W(
                    "svg",
                    {
                      viewBox: "0 0 28 28",
                      "aria-hidden": "true",
                      style: Ee({ transform: `rotate(${i.value * 180}deg)` }),
                    },
                    [
                      ...(y[9] ||
                        (y[9] = [
                          m(
                            "path",
                            {
                              d: "M5.2 12.2A9 9 0 0 1 21.4 8.4",
                              stroke: "#fff",
                              "stroke-width": "2.2",
                              fill: "none",
                              "stroke-linecap": "round",
                            },
                            null,
                            -1,
                          ),
                          m(
                            "path",
                            {
                              d: "M22.6 4.3v5.4h-5.4",
                              stroke: "#fff",
                              "stroke-width": "2.2",
                              fill: "none",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                            },
                            null,
                            -1,
                          ),
                          m(
                            "path",
                            {
                              d: "M22.8 15.8A9 9 0 0 1 6.6 19.6",
                              stroke: "#fff",
                              "stroke-width": "2.2",
                              fill: "none",
                              "stroke-linecap": "round",
                            },
                            null,
                            -1,
                          ),
                          m(
                            "path",
                            {
                              d: "M5.4 23.7v-5.4h5.4",
                              stroke: "#fff",
                              "stroke-width": "2.2",
                              fill: "none",
                              "stroke-linecap": "round",
                              "stroke-linejoin": "round",
                            },
                            null,
                            -1,
                          ),
                        ])),
                    ],
                    4,
                  )),
                ],
              ),
            ]),
          ]),
        ])
      );
    },
  }),
  $e = (t, e) => {
    const n = t.__vccOpts || t;
    for (const [s, i] of e) n[s] = i;
    return n;
  },
  Da = $e(Oa, [["__scopeId", "data-v-4a1ecc4d"]]),
  La = { key: 0, class: "panel" },
  Ua = Ue({
    __name: "DebugOverlay",
    props: { engine: {}, stats: {} },
    setup(t) {
      const e = t,
        n = mt();
      let s = 0;
      function i() {
        const r = n.value;
        if (r) {
          const o = window.devicePixelRatio || 1,
            l = window.innerWidth,
            c = window.innerHeight;
          r.width !== Math.round(l * o) &&
            ((r.width = Math.round(l * o)), (r.height = Math.round(c * o)));
          const f = r.getContext("2d");
          (f.setTransform(o, 0, 0, o, 0, 0), f.clearRect(0, 0, l, c));
          const u = e.engine,
            a = (v) => u.mapper.videoToDisplay(v),
            h = (v, y, S, M = []) => {
              (f.beginPath(),
                v.forEach((A, $) =>
                  $ ? f.lineTo(A.x, A.y) : f.moveTo(A.x, A.y),
                ),
                f.closePath(),
                f.setLineDash(M),
                (f.strokeStyle = y),
                (f.lineWidth = S),
                f.stroke());
            },
            b = u.lastResult;
          if (
            b &&
            (b.candidates.forEach((v) =>
              h(v.map(a), "rgba(255,255,255,0.5)", 1, [4, 4]),
            ),
            b.points)
          ) {
            const v = b.points.map(a);
            h(v, b.source === "detect" ? "#ff3b30" : "#ff9f0a", 1.5);
            const y = v.map((M) => M.x),
              S = v.map((M) => M.y);
            (f.setLineDash([2, 3]),
              (f.strokeStyle = "rgba(255,59,48,0.6)"),
              f.strokeRect(
                Math.min(...y),
                Math.min(...S),
                Math.max(...y) - Math.min(...y),
                Math.max(...S) - Math.min(...S),
              ));
          }
          u.lastQuad &&
            (h(u.lastQuad, "#30d158", 2),
            u.lastQuad.forEach((v, y) => {
              ((f.fillStyle = ["#30d158", "#0a84ff", "#ffd60a", "#ff375f"][y]),
                f.beginPath(),
                f.arc(v.x, v.y, 5, 0, Math.PI * 2),
                f.fill());
            }));
        }
        s = requestAnimationFrame(i);
      }
      return (
        Yn(() => (s = requestAnimationFrame(i))),
        hn(() => cancelAnimationFrame(s)),
        (r, o) => (
          V(),
          W(
            nt,
            null,
            [
              m(
                "canvas",
                { ref_key: "canvas", ref: n, class: "dbg" },
                null,
                512,
              ),
              t.stats
                ? (V(),
                  W("div", La, [
                    m(
                      "div",
                      null,
                      "camera " +
                        j(t.stats.cameraFps) +
                        " fps · render " +
                        j(t.stats.renderFps) +
                        " fps",
                      1,
                    ),
                    m(
                      "div",
                      null,
                      "video " + j(t.stats.videoW) + "×" + j(t.stats.videoH),
                      1,
                    ),
                    m(
                      "div",
                      null,
                      "detect " +
                        j(t.stats.detectFps) +
                        " fps · " +
                        j(t.stats.detectMs.toFixed(1)) +
                        " ms · " +
                        j(t.stats.detector),
                      1,
                    ),
                    m(
                      "div",
                      null,
                      "track " +
                        j(t.stats.trackStatus) +
                        " · conf " +
                        j(t.stats.confidence.toFixed(2)),
                      1,
                    ),
                    m("div", null, "state " + j(t.stats.magicState), 1),
                    m(
                      "div",
                      null,
                      " light " +
                        j(
                          t.engine.light.white
                            .map((l) => l.toFixed(2))
                            .join(" "),
                        ),
                      1,
                    ),
                  ]))
                : Et("", !0),
            ],
            64,
          )
        )
      );
    },
  }),
  $a = $e(Ua, [["__scopeId", "data-v-44b4b9f9"]]),
  Ha = Ue({
    __name: "FocusBox",
    props: { x: {}, y: {} },
    setup(t) {
      return (e, n) => (
        V(),
        W(
          "div",
          { class: "focus", style: Ee({ left: `${t.x}px`, top: `${t.y}px` }) },
          [
            ...(n[0] ||
              (n[0] = [
                m("i", { class: "t" }, null, -1),
                m("i", { class: "r" }, null, -1),
                m("i", { class: "b" }, null, -1),
                m("i", { class: "l" }, null, -1),
              ])),
          ],
          4,
        )
      );
    },
  }),
  Na = $e(Ha, [["__scopeId", "data-v-f71de83f"]]);
function Bs(t, e, n, s) {
  const i = t.width * e,
    r = i * s,
    o = (t.rotation * Math.PI) / 180,
    l = Math.cos(o),
    c = Math.sin(o),
    f = t.cx * e,
    u = t.cy * n;
  return [
    { x: -i / 2, y: -r / 2 },
    { x: i / 2, y: -r / 2 },
    { x: i / 2, y: r / 2 },
    { x: -i / 2, y: r / 2 },
  ].map((h, b) => {
    const v = t.corners[b] ?? { x: 0, y: 0 };
    return {
      x: f + h.x * l - h.y * c + v.x * e,
      y: u + h.x * c + h.y * l + v.y * e,
    };
  });
}
const Va = ["viewBox"],
  Ba = ["points"],
  Wa = ["onPointerdown"],
  ja = Ue({
    __name: "ManualEditor",
    props: { pose: {}, cardAspect: {} },
    emits: ["done"],
    setup(t, { emit: e }) {
      const n = t,
        s = e,
        i = mt(window.innerWidth),
        r = mt(window.innerHeight),
        o = () => {
          ((i.value = window.innerWidth), (r.value = window.innerHeight));
        };
      (Yn(() => window.addEventListener("resize", o)),
        hn(() => window.removeEventListener("resize", o)));
      const l = an(() => Bs(n.pose, i.value, r.value, n.cardAspect)),
        c = an(() => l.value.map((S) => `${S.x},${S.y}`).join(" ")),
        f = new Map();
      let u = null,
        a = null;
      function h() {
        const [S, M] = [...f.values()];
        return {
          d: Math.hypot(M.x - S.x, M.y - S.y),
          a: Math.atan2(M.y - S.y, M.x - S.x),
        };
      }
      function b(S, M) {
        if (
          (S.currentTarget.setPointerCapture?.(S.pointerId),
          f.set(S.pointerId, { x: S.clientX, y: S.clientY }),
          f.size === 2)
        ) {
          ((u = null),
            (a = { ...h(), width: n.pose.width, rotation: n.pose.rotation }));
          return;
        }
        if (M !== void 0) {
          const A = n.pose.corners[M];
          u = {
            kind: "corner",
            i: M,
            x: S.clientX,
            y: S.clientY,
            ox: A.x,
            oy: A.y,
          };
        } else
          u = {
            kind: "move",
            x: S.clientX,
            y: S.clientY,
            cx: n.pose.cx,
            cy: n.pose.cy,
          };
      }
      function v(S) {
        if (!f.has(S.pointerId)) return;
        f.set(S.pointerId, { x: S.clientX, y: S.clientY });
        const M = n.pose;
        if (a && f.size === 2) {
          const O = h();
          ((M.width = Math.min(
            1.5,
            Math.max(0.1, (a.width * O.d) / Math.max(1, a.d)),
          )),
            (M.rotation =
              Math.round((a.rotation + ((O.a - a.a) * 180) / Math.PI) * 10) /
              10));
          return;
        }
        if (!u) return;
        const A = S.clientX - u.x,
          $ = S.clientY - u.y;
        u.kind === "move"
          ? ((M.cx = u.cx + A / i.value), (M.cy = u.cy + $ / r.value))
          : (M.corners[u.i] = { x: u.ox + A / i.value, y: u.oy + $ / i.value });
      }
      function y(S) {
        (f.delete(S.pointerId),
          f.size < 2 && (a = null),
          f.size === 0 && (u = null));
      }
      return (S, M) => (
        V(),
        W(
          "div",
          {
            class: "editor",
            onPointerdown: M[2] || (M[2] = (A) => b(A)),
            onPointermove: v,
            onPointerup: y,
            onPointercancel: y,
          },
          [
            (V(),
            W(
              "svg",
              { class: "outline", viewBox: `0 0 ${i.value} ${r.value}` },
              [
                m(
                  "polygon",
                  {
                    points: c.value,
                    fill: "rgba(255,214,10,0.08)",
                    stroke: "#ffd60a",
                    "stroke-width": "1.5",
                    "stroke-dasharray": "6 4",
                  },
                  null,
                  8,
                  Ba,
                ),
              ],
              8,
              Va,
            )),
            (V(!0),
            W(
              nt,
              null,
              xe(
                l.value,
                (A, $) => (
                  V(),
                  W(
                    "div",
                    {
                      key: $,
                      class: "handle",
                      style: Ee({ left: `${A.x}px`, top: `${A.y}px` }),
                      onPointerdown: be((O) => b(O, $), ["stop"]),
                      onPointermove: be(v, ["stop"]),
                      onPointerup: be(y, ["stop"]),
                      onPointercancel: be(y, ["stop"]),
                    },
                    null,
                    44,
                    Wa,
                  )
                ),
              ),
              128,
            )),
            M[3] ||
              (M[3] = m(
                "div",
                { class: "hint" },
                "拖曳移動 · 拖角調整透視 · 雙指縮放／旋轉",
                -1,
              )),
            m(
              "button",
              {
                class: "done",
                onPointerdown: M[0] || (M[0] = be(() => {}, ["stop"])),
                onClick: M[1] || (M[1] = be((A) => s("done"), ["stop"])),
              },
              "完成",
              32,
            ),
          ],
          32,
        )
      );
    },
  }),
  Ka = $e(ja, [["__scopeId", "data-v-a134d831"]]),
  Dn = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K"],
  Ln = ["S", "H", "D", "C"];
Ln.flatMap((t) => Dn.map((e) => `${e}${t}`));
const Ss = {
    A: "A",
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    T: "10",
    J: "J",
    Q: "Q",
    K: "K",
  },
  Fi = { S: "♠ 黑桃", H: "♥ 紅心", D: "♦ 方塊", C: "♣ 梅花" };
function za(t) {
  return (
    typeof t == "string" &&
    t.length === 2 &&
    Dn.includes(t[0]) &&
    Ln.includes(t[1])
  );
}
const un = (t) => t[0],
  Ce = (t) => t[1],
  Qr = (t) => Ce(t) === "H" || Ce(t) === "D",
  Un = { poker: 88 / 63, bridge: 88.9 / 57.15 },
  Jr = {
    cx: 0.5,
    cy: 0.45,
    width: 0.42,
    rotation: 0,
    corners: [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
  };
function Ws() {
  return {
    initialCard: "9D",
    finalCard: "AS",
    facingMode: "environment",
    mirrorFront: !0,
    detectionMode: "auto",
    autoFallbackManual: !1,
    cardType: "poker",
    manual: structuredClone(Jr),
    overlayLocked: !1,
    animationType: "focus",
    animationDuration: 700,
    triggerDelay: 0,
    smoothing: 0.6,
    holdMs: 1500,
    syncVideo: !0,
    lightMatch: 0.85,
    softness: 0.7,
    grain: 0.02,
    edgeInset: 0.04,
    showGrid: !0,
    showLevel: !0,
    debug: !1,
  };
}
const Zr = "magic-camera.settings.v2",
  legacySettingsKeyV1 = "magic-camera.settings.v1";
function qa(t) {
  const e = Ws();
  if (!t || typeof t != "object") return e;
  const n = t,
    s = { ...e };
  for (const i of Object.keys(e)) {
    const r = n[i];
    if (r !== void 0)
      if (i === "initialCard" || i === "finalCard") za(r) && (s[i] = r);
      else if (i === "manual") {
        const o = r;
        o &&
          typeof o == "object" &&
          Array.isArray(o.corners) &&
          o.corners.length === 4 &&
          (s.manual = {
            ...e.manual,
            ...o,
            corners: o.corners.map((l) => ({ x: +l.x || 0, y: +l.y || 0 })),
          });
      } else typeof r == typeof e[i] && (s[i] = r);
  }
  return s;
}
function Xa() {
  try {
    const t = localStorage.getItem(Zr),
      e = localStorage.getItem(legacySettingsKeyV1),
      n = qa(t ? JSON.parse(t) : e ? JSON.parse(e) : null);
    // Migrate the old demo's reversed default without changing customized cards.
    return (
      !t && e && n.initialCard === "AS" && n.finalCard === "9D"
        ? ((n.initialCard = "9D"), (n.finalCard = "AS"))
        : void 0,
      n
    );
  } catch {
    return Ws();
  }
}
const C = zn(Xa());
let Oi;
Fe(
  C,
  () => {
    (clearTimeout(Oi),
      (Oi = setTimeout(() => {
        try {
          localStorage.setItem(Zr, JSON.stringify(C));
        } catch {}
      }, 200)));
  },
  { deep: !0 },
);
function Ga() {
  Object.assign(C, Ws());
}
const Ya = { class: "scroll", "data-allow-scroll": "" },
  Qa = { class: "row" },
  Ja = { class: "value" },
  Za = { class: "row" },
  tc = { class: "pair" },
  ec = ["value"],
  nc = ["value"],
  sc = { class: "row" },
  ic = { class: "pair" },
  rc = ["value"],
  oc = ["value"],
  lc = { class: "row" },
  ac = { class: "row" },
  cc = { class: "row slider" },
  uc = ["value"],
  fc = { class: "row slider" },
  dc = ["value"],
  hc = { class: "row" },
  pc = { class: "value" },
  mc = { class: "row" },
  gc = { class: "row" },
  vc = { class: "row" },
  yc = { class: "row" },
  bc = { key: 0, class: "note" },
  xc = { class: "row" },
  _c = { class: "row slider" },
  wc = ["value"],
  Tc = { class: "row slider" },
  Sc = ["value"],
  Ec = { class: "row" },
  Mc = { class: "row" },
  Cc = { class: "row slider" },
  Ac = ["value"],
  Pc = { class: "row slider" },
  Rc = ["value"],
  Ic = { class: "row slider" },
  kc = ["value"],
  Fc = { class: "row slider" },
  Oc = ["value"],
  Dc = ["value", "onInput"],
  Lc = ["value", "onInput"],
  Uc = { class: "row slider" },
  $c = ["value"],
  Hc = { class: "row slider" },
  Nc = ["value"],
  Vc = { class: "row slider" },
  Bc = ["value"],
  Wc = { class: "row slider" },
  jc = ["value"],
  Kc = { class: "row" },
  zc = Ue({
    __name: "SettingsPanel",
    props: { stats: {}, detectorError: {} },
    emits: [
      "close",
      "resetPerformance",
      "editOnScreen",
      "copyAutoPose",
      "flip",
    ],
    setup(t, { emit: e }) {
      const n = e;
      function s(u) {
        return {
          rank: an({
            get: () => un(C[u]),
            set: (a) => (C[u] = `${a}${Ce(C[u])}`),
          }),
          suit: an({
            get: () => Ce(C[u]),
            set: (a) => (C[u] = `${un(C[u])}${a}`),
          }),
        };
      }
      const i = s("initialCard"),
        r = s("finalCard"),
        o = {
          ready: "0 Ready（顯示起始牌）",
          reveal: "1 Reveal（顯示結果牌）",
          real: "2 Real（無 Overlay）",
        };
      function l() {
        C.manual = structuredClone(Jr);
      }
      function c() {
        window.confirm("重設所有設定？") && Ga();
      }
      const f = (u) => Number(u);
      return (u, a) => (
        V(),
        W(
          "div",
          {
            class: "sheet",
            "data-allow-scroll": "",
            onPointerdown: a[31] || (a[31] = be(() => {}, ["stop"])),
          },
          [
            m("header", null, [
              a[32] || (a[32] = m("span", null, "設定", -1)),
              m(
                "button",
                { class: "close", onClick: a[0] || (a[0] = (h) => n("close")) },
                "完成",
              ),
            ]),
            m("div", Ya, [
              m("section", null, [
                a[34] || (a[34] = m("h3", null, "表演", -1)),
                m("div", Qa, [
                  a[33] || (a[33] = m("label", null, "目前狀態", -1)),
                  m("span", Ja, j(t.stats ? o[t.stats.magicState] : "-"), 1),
                ]),
                m(
                  "button",
                  {
                    class: "action",
                    onClick: a[1] || (a[1] = (h) => n("resetPerformance")),
                  },
                  "重新開始表演（Reset Performance）",
                ),
              ]),
              m("section", null, [
                a[39] || (a[39] = m("h3", null, "牌面", -1)),
                m("div", Za, [
                  a[35] || (a[35] = m("label", null, "Initial Card", -1)),
                  m("span", tc, [
                    Tt(
                      m(
                        "select",
                        {
                          "onUpdate:modelValue":
                            a[2] || (a[2] = (h) => (E(i).rank.value = h)),
                        },
                        [
                          (V(!0),
                          W(
                            nt,
                            null,
                            xe(
                              E(Dn),
                              (h) => (
                                V(),
                                W(
                                  "option",
                                  { key: h, value: h },
                                  j(E(Ss)[h]),
                                  9,
                                  ec,
                                )
                              ),
                            ),
                            128,
                          )),
                        ],
                        512,
                      ),
                      [[ve, E(i).rank.value]],
                    ),
                    Tt(
                      m(
                        "select",
                        {
                          "onUpdate:modelValue":
                            a[3] || (a[3] = (h) => (E(i).suit.value = h)),
                        },
                        [
                          (V(!0),
                          W(
                            nt,
                            null,
                            xe(
                              E(Ln),
                              (h) => (
                                V(),
                                W(
                                  "option",
                                  { key: h, value: h },
                                  j(E(Fi)[h]),
                                  9,
                                  nc,
                                )
                              ),
                            ),
                            128,
                          )),
                        ],
                        512,
                      ),
                      [[ve, E(i).suit.value]],
                    ),
                  ]),
                ]),
                m("div", sc, [
                  a[36] || (a[36] = m("label", null, "Final Card", -1)),
                  m("span", ic, [
                    Tt(
                      m(
                        "select",
                        {
                          "onUpdate:modelValue":
                            a[4] || (a[4] = (h) => (E(r).rank.value = h)),
                        },
                        [
                          (V(!0),
                          W(
                            nt,
                            null,
                            xe(
                              E(Dn),
                              (h) => (
                                V(),
                                W(
                                  "option",
                                  { key: h, value: h },
                                  j(E(Ss)[h]),
                                  9,
                                  rc,
                                )
                              ),
                            ),
                            128,
                          )),
                        ],
                        512,
                      ),
                      [[ve, E(r).rank.value]],
                    ),
                    Tt(
                      m(
                        "select",
                        {
                          "onUpdate:modelValue":
                            a[5] || (a[5] = (h) => (E(r).suit.value = h)),
                        },
                        [
                          (V(!0),
                          W(
                            nt,
                            null,
                            xe(
                              E(Ln),
                              (h) => (
                                V(),
                                W(
                                  "option",
                                  { key: h, value: h },
                                  j(E(Fi)[h]),
                                  9,
                                  oc,
                                )
                              ),
                            ),
                            128,
                          )),
                        ],
                        512,
                      ),
                      [[ve, E(r).suit.value]],
                    ),
                  ]),
                ]),
                m("div", lc, [
                  a[38] || (a[38] = m("label", null, "牌型尺寸", -1)),
                  Tt(
                    m(
                      "select",
                      {
                        "onUpdate:modelValue":
                          a[6] || (a[6] = (h) => (E(C).cardType = h)),
                      },
                      [
                        ...(a[37] ||
                          (a[37] = [
                            m("option", { value: "poker" }, "Poker 63×88", -1),
                            m(
                              "option",
                              { value: "bridge" },
                              "Bridge 57×89",
                              -1,
                            ),
                          ])),
                      ],
                      512,
                    ),
                    [[ve, E(C).cardType]],
                  ),
                ]),
              ]),
              m("section", null, [
                a[44] || (a[44] = m("h3", null, "變牌", -1)),
                m("div", ac, [
                  a[41] || (a[41] = m("label", null, "Animation Type", -1)),
                  Tt(
                    m(
                      "select",
                      {
                        "onUpdate:modelValue":
                          a[7] || (a[7] = (h) => (E(C).animationType = h)),
                      },
                      [
                        ...(a[40] ||
                          (a[40] = [
                            m(
                              "option",
                              { value: "focus" },
                              "對焦模糊（Focus pull）",
                              -1,
                            ),
                            m(
                              "option",
                              { value: "crossfade" },
                              "Cross-Fade",
                              -1,
                            ),
                            m("option", { value: "instant" }, "立即切換", -1),
                          ])),
                      ],
                      512,
                    ),
                    [[ve, E(C).animationType]],
                  ),
                ]),
                m("div", cc, [
                  m("label", null, [
                    a[42] || (a[42] = ct("Animation Duration ", -1)),
                    m("b", null, j(E(C).animationDuration) + " ms", 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "100",
                      max: "2000",
                      step: "50",
                      value: E(C).animationDuration,
                      onInput:
                        a[8] ||
                        (a[8] = (h) =>
                          (E(C).animationDuration = f(h.target.value))),
                    },
                    null,
                    40,
                    uc,
                  ),
                ]),
                m("div", fc, [
                  m("label", null, [
                    a[43] || (a[43] = ct("Trigger Delay ", -1)),
                    m("b", null, j(E(C).triggerDelay) + " ms", 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "3000",
                      step: "50",
                      value: E(C).triggerDelay,
                      onInput:
                        a[9] ||
                        (a[9] = (h) => (E(C).triggerDelay = f(h.target.value))),
                    },
                    null,
                    40,
                    dc,
                  ),
                ]),
              ]),
              m("section", null, [
                a[49] || (a[49] = m("h3", null, "相機", -1)),
                m("div", hc, [
                  a[45] || (a[45] = m("label", null, "Camera", -1)),
                  m(
                    "span",
                    pc,
                    j(E(C).facingMode === "user" ? "前鏡頭" : "後鏡頭"),
                    1,
                  ),
                  m(
                    "button",
                    {
                      class: "mini",
                      onClick: a[10] || (a[10] = (h) => n("flip")),
                    },
                    "切換",
                  ),
                ]),
                m("div", mc, [
                  a[46] || (a[46] = m("label", null, "前鏡頭鏡像預覽", -1)),
                  Tt(
                    m(
                      "input",
                      {
                        type: "checkbox",
                        "onUpdate:modelValue":
                          a[11] || (a[11] = (h) => (E(C).mirrorFront = h)),
                      },
                      null,
                      512,
                    ),
                    [[ge, E(C).mirrorFront]],
                  ),
                ]),
                m("div", gc, [
                  a[47] || (a[47] = m("label", null, "九宮格", -1)),
                  Tt(
                    m(
                      "input",
                      {
                        type: "checkbox",
                        "onUpdate:modelValue":
                          a[12] || (a[12] = (h) => (E(C).showGrid = h)),
                      },
                      null,
                      512,
                    ),
                    [[ge, E(C).showGrid]],
                  ),
                ]),
                m("div", vc, [
                  a[48] || (a[48] = m("label", null, "水平儀十字", -1)),
                  Tt(
                    m(
                      "input",
                      {
                        type: "checkbox",
                        "onUpdate:modelValue":
                          a[13] || (a[13] = (h) => (E(C).showLevel = h)),
                      },
                      null,
                      512,
                    ),
                    [[ge, E(C).showLevel]],
                  ),
                ]),
              ]),
              m("section", null, [
                a[61] || (a[61] = m("h3", null, "定位", -1)),
                m("div", yc, [
                  a[51] || (a[51] = m("label", null, "Detection Mode", -1)),
                  Tt(
                    m(
                      "select",
                      {
                        "onUpdate:modelValue":
                          a[14] || (a[14] = (h) => (E(C).detectionMode = h)),
                      },
                      [
                        ...(a[50] ||
                          (a[50] = [
                            m(
                              "option",
                              { value: "manual" },
                              "Manual（不需 OpenCV）",
                              -1,
                            ),
                            m(
                              "option",
                              { value: "auto" },
                              "Auto（OpenCV 偵測）",
                              -1,
                            ),
                          ])),
                      ],
                      512,
                    ),
                    [[ve, E(C).detectionMode]],
                  ),
                ]),
                E(C).detectionMode === "auto" && t.stats
                  ? (V(),
                    W("p", bc, [
                      ct(" OpenCV：" + j(t.stats.detector), 1),
                      t.detectorError
                        ? (V(),
                          W(
                            nt,
                            { key: 0 },
                            [ct(" — " + j(t.detectorError), 1)],
                            64,
                          ))
                        : Et("", !0),
                    ]))
                  : Et("", !0),
                m("div", xc, [
                  a[52] || (a[52] = m("label", null, "Lock Overlay", -1)),
                  Tt(
                    m(
                      "input",
                      {
                        type: "checkbox",
                        "onUpdate:modelValue":
                          a[15] || (a[15] = (h) => (E(C).overlayLocked = h)),
                      },
                      null,
                      512,
                    ),
                    [[ge, E(C).overlayLocked]],
                  ),
                ]),
                E(C).detectionMode === "auto"
                  ? (V(),
                    W(
                      nt,
                      { key: 1 },
                      [
                        m("div", _c, [
                          m("label", null, [
                            a[53] || (a[53] = ct("Tracking Smoothing ", -1)),
                            m("b", null, j(E(C).smoothing.toFixed(2)), 1),
                          ]),
                          m(
                            "input",
                            {
                              type: "range",
                              min: "0",
                              max: "1",
                              step: "0.05",
                              value: E(C).smoothing,
                              onInput:
                                a[16] ||
                                (a[16] = (h) =>
                                  (E(C).smoothing = f(h.target.value))),
                            },
                            null,
                            40,
                            wc,
                          ),
                        ]),
                        m("div", Tc, [
                          m("label", null, [
                            a[54] || (a[54] = ct("遺失後保持 ", -1)),
                            m("b", null, j(E(C).holdMs) + " ms", 1),
                          ]),
                          m(
                            "input",
                            {
                              type: "range",
                              min: "0",
                              max: "5000",
                              step: "100",
                              value: E(C).holdMs,
                              onInput:
                                a[17] ||
                                (a[17] = (h) =>
                                  (E(C).holdMs = f(h.target.value))),
                            },
                            null,
                            40,
                            Sc,
                          ),
                        ]),
                        m("div", Ec, [
                          a[55] ||
                            (a[55] = m(
                              "label",
                              null,
                              "同步畫面（無 Overlay 延遲）",
                              -1,
                            )),
                          Tt(
                            m(
                              "input",
                              {
                                type: "checkbox",
                                "onUpdate:modelValue":
                                  a[18] ||
                                  (a[18] = (h) => (E(C).syncVideo = h)),
                              },
                              null,
                              512,
                            ),
                            [[ge, E(C).syncVideo]],
                          ),
                        ]),
                        m("div", Mc, [
                          a[56] ||
                            (a[56] = m(
                              "label",
                              null,
                              "未偵測到時使用手動位置",
                              -1,
                            )),
                          Tt(
                            m(
                              "input",
                              {
                                type: "checkbox",
                                "onUpdate:modelValue":
                                  a[19] ||
                                  (a[19] = (h) =>
                                    (E(C).autoFallbackManual = h)),
                              },
                              null,
                              512,
                            ),
                            [[ge, E(C).autoFallbackManual]],
                          ),
                        ]),
                        m(
                          "button",
                          {
                            class: "action",
                            onClick:
                              a[20] || (a[20] = (h) => n("copyAutoPose")),
                          },
                          "將目前偵測位置複製到手動模式",
                        ),
                      ],
                      64,
                    ))
                  : Et("", !0),
                a[62] || (a[62] = m("h4", null, "Manual Overlay", -1)),
                m(
                  "button",
                  {
                    class: "action",
                    onClick: a[21] || (a[21] = (h) => n("editOnScreen")),
                  },
                  "在畫面上調整…",
                ),
                m("div", Cc, [
                  m("label", null, [
                    a[57] || (a[57] = ct("Position X ", -1)),
                    m("b", null, j(E(C).manual.cx.toFixed(3)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "1",
                      step: "0.002",
                      value: E(C).manual.cx,
                      onInput:
                        a[22] ||
                        (a[22] = (h) => (E(C).manual.cx = f(h.target.value))),
                    },
                    null,
                    40,
                    Ac,
                  ),
                ]),
                m("div", Pc, [
                  m("label", null, [
                    a[58] || (a[58] = ct("Position Y ", -1)),
                    m("b", null, j(E(C).manual.cy.toFixed(3)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "1",
                      step: "0.002",
                      value: E(C).manual.cy,
                      onInput:
                        a[23] ||
                        (a[23] = (h) => (E(C).manual.cy = f(h.target.value))),
                    },
                    null,
                    40,
                    Rc,
                  ),
                ]),
                m("div", Ic, [
                  m("label", null, [
                    a[59] || (a[59] = ct("Scale ", -1)),
                    m("b", null, j(E(C).manual.width.toFixed(3)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0.1",
                      max: "1.2",
                      step: "0.002",
                      value: E(C).manual.width,
                      onInput:
                        a[24] ||
                        (a[24] = (h) =>
                          (E(C).manual.width = f(h.target.value))),
                    },
                    null,
                    40,
                    kc,
                  ),
                ]),
                m("div", Fc, [
                  m("label", null, [
                    a[60] || (a[60] = ct("Rotation ", -1)),
                    m("b", null, j(E(C).manual.rotation.toFixed(1)) + "°", 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "-180",
                      max: "180",
                      step: "0.5",
                      value: E(C).manual.rotation,
                      onInput:
                        a[25] ||
                        (a[25] = (h) =>
                          (E(C).manual.rotation = f(h.target.value))),
                    },
                    null,
                    40,
                    Oc,
                  ),
                ]),
                (V(!0),
                W(
                  nt,
                  null,
                  xe(
                    E(C).manual.corners,
                    (h, b) => (
                      V(),
                      W("div", { key: b, class: "row corner" }, [
                        m(
                          "label",
                          null,
                          j(["左上", "右上", "右下", "左下"][b]) + " 透視",
                          1,
                        ),
                        m(
                          "input",
                          {
                            type: "range",
                            min: "-0.15",
                            max: "0.15",
                            step: "0.001",
                            value: h.x,
                            onInput: (v) => (h.x = f(v.target.value)),
                          },
                          null,
                          40,
                          Dc,
                        ),
                        m(
                          "input",
                          {
                            type: "range",
                            min: "-0.15",
                            max: "0.15",
                            step: "0.001",
                            value: h.y,
                            onInput: (v) => (h.y = f(v.target.value)),
                          },
                          null,
                          40,
                          Lc,
                        ),
                      ])
                    ),
                  ),
                  128,
                )),
                m("button", { class: "action", onClick: l }, "重設手動位置"),
              ]),
              m("section", null, [
                a[67] || (a[67] = m("h3", null, "畫面融合", -1)),
                m("div", Uc, [
                  m("label", null, [
                    a[63] || (a[63] = ct("光線匹配 ", -1)),
                    m("b", null, j(E(C).lightMatch.toFixed(2)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "1",
                      step: "0.05",
                      value: E(C).lightMatch,
                      onInput:
                        a[26] ||
                        (a[26] = (h) => (E(C).lightMatch = f(h.target.value))),
                    },
                    null,
                    40,
                    $c,
                  ),
                ]),
                m("div", Hc, [
                  m("label", null, [
                    a[64] || (a[64] = ct("柔化 ", -1)),
                    m("b", null, j(E(C).softness.toFixed(2)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "2.5",
                      step: "0.05",
                      value: E(C).softness,
                      onInput:
                        a[27] ||
                        (a[27] = (h) => (E(C).softness = f(h.target.value))),
                    },
                    null,
                    40,
                    Nc,
                  ),
                ]),
                m("div", Vc, [
                  m("label", null, [
                    a[65] || (a[65] = ct("雜訊顆粒 ", -1)),
                    m("b", null, j(E(C).grain.toFixed(3)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "0.08",
                      step: "0.002",
                      value: E(C).grain,
                      onInput:
                        a[28] ||
                        (a[28] = (h) => (E(C).grain = f(h.target.value))),
                    },
                    null,
                    40,
                    Bc,
                  ),
                ]),
                m("div", Wc, [
                  m("label", null, [
                    a[66] || (a[66] = ct("邊緣內縮 ", -1)),
                    m("b", null, j(E(C).edgeInset.toFixed(3)), 1),
                  ]),
                  m(
                    "input",
                    {
                      type: "range",
                      min: "0",
                      max: "0.06",
                      step: "0.001",
                      value: E(C).edgeInset,
                      onInput:
                        a[29] ||
                        (a[29] = (h) => (E(C).edgeInset = f(h.target.value))),
                    },
                    null,
                    40,
                    jc,
                  ),
                ]),
              ]),
              m("section", null, [
                a[69] || (a[69] = m("h3", null, "其他", -1)),
                m("div", Kc, [
                  a[68] || (a[68] = m("label", null, "Debug Overlay", -1)),
                  Tt(
                    m(
                      "input",
                      {
                        type: "checkbox",
                        "onUpdate:modelValue":
                          a[30] || (a[30] = (h) => (E(C).debug = h)),
                      },
                      null,
                      512,
                    ),
                    [[ge, E(C).debug]],
                  ),
                ]),
                m(
                  "button",
                  { class: "action danger", onClick: c },
                  "重設所有設定",
                ),
                a[70] ||
                  (a[70] = m(
                    "p",
                    { class: "note" },
                    " 隱藏入口：長按左下角相簿縮圖 2 秒。點擊預覽畫面：Ready → Reveal → Real → Ready。 ",
                    -1,
                  )),
              ]),
            ]),
          ],
          32,
        )
      );
    },
  }),
  qc = $e(zc, [["__scopeId", "data-v-094bc9d7"]]);
class Ie extends Error {
  constructor(e, n) {
    (super(n), (this.kind = e));
  }
}
class Xc {
  video;
  stream = null;
  queue = Promise.resolve();
  facing = "user";
  frameCounter = 0;
  lastTime = -1;
  rvfcHandle = 0;
  disposed = !1;
  frameTimes = [];
  onError = () => {};
  onStarted = () => {};
  constructor(e) {
    ((this.video = e),
      (e.muted = !0),
      (e.playsInline = !0),
      e.setAttribute("playsinline", ""),
      e.setAttribute("webkit-playsinline", ""),
      (e.autoplay = !0),
      document.addEventListener("visibilitychange", this.onVisibility),
      window.addEventListener("pageshow", this.onVisibility));
  }
  get facingMode() {
    return this.facing;
  }
  get isLive() {
    return (
      !!this.stream &&
      this.stream.getVideoTracks().some((e) => e.readyState === "live")
    );
  }
  get frameId() {
    if (!("requestVideoFrameCallback" in HTMLVideoElement.prototype)) {
      const e = this.video.currentTime;
      e !== this.lastTime && ((this.lastTime = e), this.countFrame());
    }
    return this.frameCounter;
  }
  get fps() {
    const e = performance.now();
    for (; this.frameTimes.length && e - this.frameTimes[0] > 1e3;)
      this.frameTimes.shift();
    return this.frameTimes.length;
  }
  countFrame() {
    (this.frameCounter++,
      this.frameTimes.push(performance.now()),
      this.frameTimes.length > 120 && this.frameTimes.shift());
  }
  watchFrames() {
    const e = this.video;
    if (!e.requestVideoFrameCallback) return;
    this.rvfcHandle && e.cancelVideoFrameCallback?.(this.rvfcHandle);
    const n = () => {
      this.disposed ||
        (this.countFrame(), (this.rvfcHandle = e.requestVideoFrameCallback(n)));
    };
    this.rvfcHandle = e.requestVideoFrameCallback(n);
  }
  start(e = this.facing) {
    return (
      (this.facing = e),
      (this.queue = this.queue.then(() => this.doStart(e)).catch(() => {})),
      this.queue
    );
  }
  stopTracks() {
    (this.stream?.getTracks().forEach((e) => {
      ((e.onended = null), e.stop());
    }),
      (this.stream = null));
  }
  async doStart(e) {
    if (this.disposed) return;
    if (!window.isSecureContext) {
      this.onError(new Ie("insecure", "Camera requires HTTPS"));
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      this.onError(new Ie("unsupported", "Camera API not available"));
      return;
    }
    (this.stopTracks(), (this.video.srcObject = null));
    const n = [
      {
        audio: !1,
        video: {
          facingMode: { ideal: e },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 60, max: 60 },
        },
      },
      {
        audio: !1,
        video: {
          facingMode: { ideal: e },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      { audio: !1, video: !0 },
    ];
    let s = null;
    for (const i of n)
      try {
        const r = await navigator.mediaDevices.getUserMedia(i);
        if (this.disposed) {
          r.getTracks().forEach((l) => l.stop());
          return;
        }
        this.stream = r;
        const o = r.getVideoTracks()[0];
        ((o.onended = () => {
          document.visibilityState === "visible" && this.start();
        }),
          (this.video.srcObject = r),
          await this.video.play().catch(() => {}),
          await this.waitForDimensions(),
          this.watchFrames(),
          this.onError(null),
          this.onStarted());
        return;
      } catch (r) {
        s = r;
        const o = r?.name;
        if (o === "NotAllowedError" || o === "SecurityError") break;
      }
    this.onError(this.classify(s));
  }
  waitForDimensions() {
    return this.video.videoWidth > 0
      ? Promise.resolve()
      : new Promise((e) => {
          const n = () => {
            (this.video.removeEventListener("loadedmetadata", n),
              this.video.removeEventListener("resize", n),
              e());
          };
          (this.video.addEventListener("loadedmetadata", n),
            this.video.addEventListener("resize", n),
            setTimeout(n, 3e3));
        });
  }
  classify(e) {
    const n = e?.name ?? "";
    return n === "NotAllowedError" || n === "SecurityError"
      ? new Ie("denied", "Camera permission denied")
      : n === "NotFoundError" || n === "OverconstrainedError"
        ? new Ie("notfound", "No camera found")
        : n === "NotReadableError" || n === "AbortError"
          ? new Ie("busy", "Camera is in use")
          : new Ie("unknown", String(e?.message ?? e));
  }
  onVisibility = () => {
    this.disposed ||
      document.visibilityState !== "visible" ||
      (this.isLive
        ? this.video.paused && this.video.play().catch(() => this.start())
        : this.start());
  };
  zoomCapabilities() {
    const n = this.stream?.getVideoTracks()[0]?.getCapabilities?.();
    return n?.zoom ? { min: n.zoom.min, max: n.zoom.max } : null;
  }
  async applyHardwareZoom(e) {
    const n = this.stream?.getVideoTracks()[0],
      s = this.zoomCapabilities();
    if (!n || !s || e < s.min || e > s.max) return !1;
    try {
      return (await n.applyConstraints({ advanced: [{ zoom: e }] }), !0);
    } catch {
      return !1;
    }
  }
  dispose() {
    ((this.disposed = !0),
      document.removeEventListener("visibilitychange", this.onVisibility),
      window.removeEventListener("pageshow", this.onVisibility));
    const e = this.video;
    (this.rvfcHandle && e.cancelVideoFrameCallback?.(this.rvfcHandle),
      this.stopTracks(),
      (this.video.srcObject = null));
  }
}
class js {
  status = "idle";
  error = "";
  worker = null;
  canvas = document.createElement("canvas");
  ctx = this.canvas.getContext("2d", { willReadFrequently: !0 });
  spare = null;
  inFlight = !1;
  inFlightSince = 0;
  times = [];
  lastMs = 0;
  onResult = () => {};
  onStatus = () => {};
  static PROCESS_SIZE = 480;
  load() {
    if (!this.worker) {
      this.setStatus("loading");
      try {
        this.worker = new Worker("./cv-worker.js");
      } catch (e) {
        ((this.error = String(e)), this.setStatus("error"));
        return;
      }
      ((this.worker.onmessage = (e) => this.handle(e.data)),
        (this.worker.onerror = (e) => {
          ((this.error = e.message || "worker error"),
            (this.inFlight = !1),
            this.setStatus("error"));
        }));
    }
  }
  setStatus(e) {
    ((this.status = e), this.onStatus(e));
  }
  get busy() {
    return (
      this.inFlight &&
        performance.now() - this.inFlightSince > 1500 &&
        (this.inFlight = !1),
      this.inFlight
    );
  }
  get fps() {
    const e = performance.now();
    for (; this.times.length && e - this.times[0] > 1e3;) this.times.shift();
    return this.times.length;
  }
  send(e, n, s) {
    if (
      this.status !== "ready" ||
      this.busy ||
      !this.worker ||
      e.videoWidth === 0
    )
      return !1;
    const i = e.videoWidth,
      r = e.videoHeight,
      o = js.PROCESS_SIZE / Math.max(i, r),
      l = Math.max(16, Math.round(i * o)),
      c = Math.max(16, Math.round(r * o));
    ((this.canvas.width !== l || this.canvas.height !== c) &&
      ((this.canvas.width = l), (this.canvas.height = c)),
      this.ctx.drawImage(e, 0, 0, l, c));
    const f = this.ctx.getImageData(0, 0, l, c);
    let u;
    return (
      this.spare && this.spare.byteLength === f.data.byteLength
        ? ((u = this.spare), new Uint8Array(u).set(f.data))
        : (u = f.data.buffer),
      (this.spare = null),
      (this.inFlight = !0),
      (this.inFlightSince = performance.now()),
      this.worker.postMessage(
        { type: "frame", id: n, width: l, height: c, buffer: u, cardAspect: s },
        [u],
      ),
      !0
    );
  }
  resetTracking() {
    this.worker?.postMessage({ type: "reset" });
  }
  handle(e) {
    if (e.type === "ready") this.setStatus("ready");
    else if (e.type === "error")
      ((this.error = String(e.message)),
        (this.inFlight = !1),
        this.setStatus("error"));
    else if (e.type === "result") {
      ((this.inFlight = !1),
        (this.spare = e.buffer),
        this.times.push(performance.now()),
        (this.lastMs = e.ms));
      const n = (s) =>
        s ? [0, 1, 2, 3].map((i) => ({ x: s[i * 2], y: s[i * 2 + 1] })) : null;
      this.onResult({
        id: e.id,
        points: n(e.quad),
        confidence: e.confidence,
        source: e.source,
        candidates: (e.candidates ?? []).map((s) => n(s)),
        ms: e.ms,
        width: e.width,
        height: e.height,
      });
    }
  }
  dispose() {
    (this.worker?.terminate(), (this.worker = null), (this.status = "idle"));
  }
}
function Gc(t) {
  const [e, n, s, i] = t,
    r = e.x - n.x + s.x - i.x,
    o = e.y - n.y + s.y - i.y;
  let l, c, f, u, a, h, b, v;
  if (Math.abs(r) < 1e-12 && Math.abs(o) < 1e-12)
    ((l = n.x - e.x),
      (c = s.x - n.x),
      (f = e.x),
      (u = n.y - e.y),
      (a = s.y - n.y),
      (h = e.y),
      (b = 0),
      (v = 0));
  else {
    const y = n.x - s.x,
      S = i.x - s.x,
      M = n.y - s.y,
      A = i.y - s.y,
      $ = y * A - S * M;
    if (Math.abs($) < 1e-12) return null;
    ((b = (r * A - S * o) / $),
      (v = (y * o - r * M) / $),
      (l = n.x - e.x + b * n.x),
      (c = i.x - e.x + v * i.x),
      (f = e.x),
      (u = n.y - e.y + b * n.y),
      (a = i.y - e.y + v * i.y),
      (h = e.y));
  }
  return [l, c, f, u, a, h, b, v, 1];
}
function Yc(t) {
  const [e, n, s, i, r, o, l, c, f] = t,
    u = r * f - o * c,
    a = -(i * f - o * l),
    h = i * c - r * l,
    b = e * u + n * a + s * h;
  if (Math.abs(b) < 1e-14) return null;
  const v = 1 / b;
  return [
    u * v,
    -(n * f - s * c) * v,
    (n * o - s * r) * v,
    a * v,
    (e * f - s * l) * v,
    -(e * o - s * i) * v,
    h * v,
    -(e * c - n * l) * v,
    (e * r - n * i) * v,
  ];
}
const we = (t, e) => Math.hypot(t.x - e.x, t.y - e.y);
function to(t) {
  return {
    x: (t[0].x + t[1].x + t[2].x + t[3].x) / 4,
    y: (t[0].y + t[1].y + t[2].y + t[3].y) / 4,
  };
}
function Qc(t) {
  return (we(t[0], t[2]) + we(t[1], t[3])) / 2;
}
function eo(t, e) {
  return (
    (we(t[0], e[0]) + we(t[1], e[1]) + we(t[2], e[2]) + we(t[3], e[3])) / 4
  );
}
function je(t, e) {
  return [t[e % 4], t[(e + 1) % 4], t[(e + 2) % 4], t[(e + 3) % 4]];
}
const Xe = (t, e) => t.map(e);
function Jc(t, e) {
  let n = !1;
  for (let s = 0, i = 3; s < 4; i = s++) {
    const r = e[s],
      o = e[i];
    r.y > t.y != o.y > t.y &&
      t.x < ((o.x - r.x) * (t.y - r.y)) / (o.y - r.y) + r.x &&
      (n = !n);
  }
  return n;
}
function _n(t, e = 1, n) {
  const s = {
      x: t.reduce((u, a) => u + a.x, 0) / t.length,
      y: t.reduce((u, a) => u + a.y, 0) / t.length,
    },
    i = [...t]
      .sort(
        (u, a) =>
          Math.atan2(u.y - s.y, (u.x - s.x) * e) -
          Math.atan2(a.y - s.y, (a.x - s.x) * e),
      )
      .slice(0, 4);
  if (n) {
    let u = i,
      a = 1 / 0;
    for (let h = 0; h < 4; h++) {
      const b = je(i, h),
        v = eo(b, n);
      v < a && ((a = v), (u = b));
    }
    return u;
  }
  const r = (u) => ({ x: u.x * e, y: u.y }),
    o = (u) => we(r(i[u]), r(i[(u + 1) % 4])),
    c =
      o(0) + o(2) <= o(1) + o(3) ? [je(i, 0), je(i, 2)] : [je(i, 1), je(i, 3)],
    f = (u) => (u[0].y + u[1].y) / 2;
  return f(c[0]) <= f(c[1]) ? c[0] : c[1];
}
class $n {
  constructor(e = 1, n = 0, s = 1) {
    ((this.minCutoff = e), (this.beta = n), (this.dCutoff = s));
  }
  x = null;
  dx = 0;
  t = 0;
  static alpha(e, n) {
    return 1 / (1 + 1 / (2 * Math.PI * e) / n);
  }
  reset() {
    ((this.x = null), (this.dx = 0));
  }
  filter(e, n) {
    if (this.x === null) return ((this.x = e), (this.t = n), e);
    const s = Math.max(0.001, n - this.t);
    this.t = n;
    const i = (e - this.x) / s;
    this.dx += $n.alpha(this.dCutoff, s) * (i - this.dx);
    const r = this.minCutoff + this.beta * Math.abs(this.dx);
    return ((this.x += $n.alpha(r, s) * (e - this.x)), this.x);
  }
}
const Zc = {
  acquireFrames: 2,
  jumpTolerance: 0.45,
  relocateFrames: 4,
  holdMs: 1500,
  fadeMs: 250,
  smoothing: 0.6,
};
class tu {
  opts;
  filters = Array.from({ length: 8 }, () => new $n());
  current = null;
  lastSeen = 0;
  confidence = 0;
  candidate = null;
  candidateCount = 0;
  outlier = null;
  outlierCount = 0;
  aspect = 1;
  constructor(e = {}) {
    ((this.opts = { ...Zc, ...e }), this.applySmoothing());
  }
  setOptions(e) {
    const n = this.opts.smoothing;
    ((this.opts = { ...this.opts, ...e }),
      n !== this.opts.smoothing && this.applySmoothing());
  }
  applySmoothing() {
    const e = Math.min(1, Math.max(0, this.opts.smoothing));
    for (const n of this.filters)
      ((n.minCutoff = 6 * (1 - e) + 0.4 * e),
        (n.beta = 25 * (1 - e) + 4 * e),
        (n.dCutoff = 1));
  }
  reset() {
    ((this.current = null),
      (this.candidate = null),
      (this.candidateCount = 0),
      (this.outlier = null),
      (this.outlierCount = 0),
      (this.confidence = 0),
      this.filters.forEach((e) => e.reset()));
  }
  rel(e, n) {
    const s = (o) => Xe(o, (l) => ({ x: l.x * this.aspect, y: l.y })),
      i = s(e),
      r = s(n);
    return eo(i, r) / Math.max(1e-6, Qc(r));
  }
  update(e, n, s, i) {
    // A low-confidence contour must never move an established card pose.
    if (((this.aspect = s), !e || e.length !== 4 || n < 0.22)) return;
    const r = i / 1e3;
    if (this.current) {
      const l = _n(e, s, this.current);
      if (this.rel(l, this.current) <= this.opts.jumpTolerance)
        (this.accept(l, r), (this.outlier = null), (this.outlierCount = 0));
      else {
        const c = this.outlier ? _n(e, s, this.outlier) : _n(e, s);
        (this.outlier && this.rel(c, this.outlier) < 0.25
          ? this.outlierCount++
          : (this.outlierCount = 1),
          (this.outlier = c),
          this.outlierCount >= this.opts.relocateFrames &&
            (this.filters.forEach((f) => f.reset()),
            this.accept(c, r),
            (this.outlier = null),
            (this.outlierCount = 0)));
      }
      this.confidence = this.confidence * 0.7 + n * 0.3;
      return;
    }
    const o = _n(e, s, this.candidate);
    (this.candidate && this.rel(o, this.candidate) < 0.25
      ? this.candidateCount++
      : (this.candidateCount = 1),
      (this.candidate = o),
      this.candidateCount >= this.opts.acquireFrames &&
        (this.filters.forEach((l) => l.reset()),
        this.accept(o, r),
        (this.candidate = null),
        (this.candidateCount = 0),
        (this.confidence = n)));
  }
  accept(e, n) {
    const s = e.map((i, r) => ({
      x: this.filters[r * 2].filter(i.x, n),
      y: this.filters[r * 2 + 1].filter(i.y, n),
    }));
    ((this.current = s), (this.lastSeen = n * 1e3));
  }
  output(e) {
    if (!this.current)
      return { quad: null, visibility: 0, status: "searching", confidence: 0 };
    const n = e - this.lastSeen;
    if (n <= this.opts.holdMs) {
      const i = n > 200 ? "holding" : "tracking";
      return {
        quad: this.current,
        // Keep the pose for reacquisition, but hide it as soon as tracking is
        // stale. A frozen composite is more noticeable than a clean camera
        // frame when the physical card keeps moving.
        visibility: i === "tracking" ? 1 : 0,
        status: i,
        confidence: this.confidence,
      };
    }
    const s = 1 - (n - this.opts.holdMs) / Math.max(1, this.opts.fadeMs);
    return s <= 0
      ? (this.reset(),
        { quad: null, visibility: 0, status: "searching", confidence: 0 })
      : {
          quad: this.current,
          visibility: s,
          status: "holding",
          confidence: this.confidence,
        };
  }
}
const eu = "#f7f6f1",
  Ks = "#c4122f",
  Hn = "#141414",
  nu = 500;
function su(t, e, n) {
  switch ((t.beginPath(), e)) {
    case "H":
      (t.moveTo(0, 0.46 * n),
        t.bezierCurveTo(
          -0.12 * n,
          0.3 * n,
          -0.5 * n,
          0.08 * n,
          -0.5 * n,
          -0.17 * n,
        ),
        t.bezierCurveTo(
          -0.5 * n,
          -0.43 * n,
          -0.14 * n,
          -0.52 * n,
          0,
          -0.26 * n,
        ),
        t.bezierCurveTo(
          0.14 * n,
          -0.52 * n,
          0.5 * n,
          -0.43 * n,
          0.5 * n,
          -0.17 * n,
        ),
        t.bezierCurveTo(0.5 * n, 0.08 * n, 0.12 * n, 0.3 * n, 0, 0.46 * n));
      break;
    case "D":
      (t.moveTo(0, -0.5 * n),
        t.quadraticCurveTo(0.16 * n, -0.22 * n, 0.38 * n, 0),
        t.quadraticCurveTo(0.16 * n, 0.22 * n, 0, 0.5 * n),
        t.quadraticCurveTo(-0.16 * n, 0.22 * n, -0.38 * n, 0),
        t.quadraticCurveTo(-0.16 * n, -0.22 * n, 0, -0.5 * n));
      break;
    case "S":
      (t.moveTo(0, -0.5 * n),
        t.bezierCurveTo(
          -0.12 * n,
          -0.32 * n,
          -0.5 * n,
          -0.12 * n,
          -0.5 * n,
          0.12 * n,
        ),
        t.bezierCurveTo(
          -0.5 * n,
          0.36 * n,
          -0.16 * n,
          0.42 * n,
          -0.03 * n,
          0.22 * n,
        ),
        t.quadraticCurveTo(-0.06 * n, 0.42 * n, -0.2 * n, 0.5 * n),
        t.lineTo(0.2 * n, 0.5 * n),
        t.quadraticCurveTo(0.06 * n, 0.42 * n, 0.03 * n, 0.22 * n),
        t.bezierCurveTo(
          0.16 * n,
          0.42 * n,
          0.5 * n,
          0.36 * n,
          0.5 * n,
          0.12 * n,
        ),
        t.bezierCurveTo(0.5 * n, -0.12 * n, 0.12 * n, -0.32 * n, 0, -0.5 * n));
      break;
    case "C": {
      const s = 0.21 * n;
      (t.moveTo(s, -0.27 * n),
        t.arc(0, -0.27 * n, s, 0, Math.PI * 2),
        t.moveTo(-0.24 * n + s, 0.08 * n),
        t.arc(-0.24 * n, 0.08 * n, s, 0, Math.PI * 2),
        t.moveTo(0.24 * n + s, 0.08 * n),
        t.arc(0.24 * n, 0.08 * n, s, 0, Math.PI * 2),
        t.moveTo(-0.1 * n, -0.1 * n),
        t.lineTo(0.1 * n, -0.1 * n),
        t.lineTo(0.1 * n, 0.12 * n),
        t.lineTo(-0.1 * n, 0.12 * n),
        t.moveTo(-0.03 * n, 0.1 * n),
        t.quadraticCurveTo(-0.06 * n, 0.4 * n, -0.2 * n, 0.5 * n),
        t.lineTo(0.2 * n, 0.5 * n),
        t.quadraticCurveTo(0.06 * n, 0.4 * n, 0.03 * n, 0.1 * n));
      break;
    }
  }
  t.closePath();
}
function Nn(t, e, n, s, i, r = !1, o) {
  (t.save(),
    t.translate(n, s),
    r && t.rotate(Math.PI),
    (t.fillStyle = e === "H" || e === "D" ? Ks : Hn),
    su(t, e, i),
    t.fill("nonzero"),
    t.restore());
}
const rt = 0.29,
  Pt = 0.5,
  ot = 0.71,
  iu = {
    2: [
      [Pt, 0.2],
      [Pt, 0.8],
    ],
    3: [
      [Pt, 0.2],
      [Pt, 0.5],
      [Pt, 0.8],
    ],
    4: [
      [rt, 0.2],
      [ot, 0.2],
      [rt, 0.8],
      [ot, 0.8],
    ],
    5: [
      [rt, 0.2],
      [ot, 0.2],
      [Pt, 0.5],
      [rt, 0.8],
      [ot, 0.8],
    ],
    6: [
      [rt, 0.2],
      [ot, 0.2],
      [rt, 0.5],
      [ot, 0.5],
      [rt, 0.8],
      [ot, 0.8],
    ],
    7: [
      [rt, 0.2],
      [ot, 0.2],
      [Pt, 0.35],
      [rt, 0.5],
      [ot, 0.5],
      [rt, 0.8],
      [ot, 0.8],
    ],
    8: [
      [rt, 0.2],
      [ot, 0.2],
      [Pt, 0.35],
      [rt, 0.5],
      [ot, 0.5],
      [Pt, 0.65],
      [rt, 0.8],
      [ot, 0.8],
    ],
    9: [
      [rt, 0.2],
      [ot, 0.2],
      [rt, 0.4],
      [ot, 0.4],
      [Pt, 0.5],
      [rt, 0.6],
      [ot, 0.6],
      [rt, 0.8],
      [ot, 0.8],
    ],
    T: [
      [rt, 0.2],
      [ot, 0.2],
      [Pt, 0.3],
      [rt, 0.4],
      [ot, 0.4],
      [rt, 0.6],
      [ot, 0.6],
      [Pt, 0.7],
      [rt, 0.8],
      [ot, 0.8],
    ],
  };
function Di(t, e, n) {
  const s = Qr(e) ? Ks : Hn,
    i = Ss[un(e)];
  (t.save(),
    (t.fillStyle = s),
    (t.textAlign = "center"),
    (t.textBaseline = "alphabetic"),
    (t.font = `bold ${n * 0.13}px Georgia, "Times New Roman", serif`),
    t.translate(n * 0.085, n * 0.15),
    i.length > 1 && t.scale(0.72, 1),
    t.fillText(i, 0, 0),
    t.restore(),
    Nn(t, Ce(e), n * 0.085, n * 0.225, n * 0.085));
}
function ru(t, e, n, s) {
  const i = Ce(e),
    r = Qr(e),
    o = r ? Ks : Hn,
    l = n * 0.18,
    c = s * 0.12,
    f = n * 0.64,
    u = s * 0.76;
  (t.save(),
    t.beginPath(),
    t.rect(l, c, f, u),
    t.clip(),
    (t.fillStyle = "#f4e7c1"),
    t.fillRect(l, c, f, u));
  const a = () => {
    const h = l + f / 2,
      b = c,
      v = f;
    ((t.fillStyle = r ? "#1f4fa3" : "#b3202c"),
      t.beginPath(),
      t.moveTo(l, b + u / 2),
      t.lineTo(l, b + v * 0.62),
      t.quadraticCurveTo(h, b + v * 0.4, l + f, b + v * 0.62),
      t.lineTo(l + f, b + u / 2),
      t.closePath(),
      t.fill(),
      (t.fillStyle = "#e8b73a"),
      t.fillRect(h - v * 0.06, b + v * 0.5, v * 0.12, u / 2 - v * 0.5),
      (t.fillStyle = "#f2cfa6"),
      t.beginPath(),
      t.ellipse(h, b + v * 0.4, v * 0.15, v * 0.18, 0, 0, Math.PI * 2),
      t.fill(),
      (t.strokeStyle = Hn),
      (t.lineWidth = 2),
      t.stroke(),
      (t.fillStyle = "#e8b73a"),
      t.beginPath());
    const y = un(e),
      S = b + v * 0.26;
    if (y === "K") {
      t.moveTo(h - v * 0.17, S);
      for (let M = 0; M <= 4; M++)
        t.lineTo(
          h - v * 0.17 + (M * v * 0.34) / 4,
          S - (M % 2 === 0 ? v * 0.16 : v * 0.07),
        );
      t.lineTo(h + v * 0.17, S);
    } else
      y === "Q"
        ? (t.moveTo(h - v * 0.16, S),
          t.quadraticCurveTo(h, S - v * 0.2, h + v * 0.16, S))
        : (t.moveTo(h - v * 0.17, S),
          t.lineTo(h - v * 0.1, S - v * 0.1),
          t.lineTo(h + v * 0.22, S - v * 0.08),
          t.lineTo(h + v * 0.17, S));
    (t.closePath(),
      t.fill(),
      t.stroke(),
      Nn(t, i, l + f * 0.2, b + v * 0.18, v * 0.16),
      (t.fillStyle = o),
      (t.font = `bold ${v * 0.16}px Georgia, serif`),
      (t.textAlign = "center"),
      t.fillText(y, l + f * 0.82, b + v * 0.22));
  };
  (a(),
    t.translate(n, s),
    t.rotate(Math.PI),
    a(),
    t.restore(),
    (t.strokeStyle = o),
    (t.lineWidth = 3),
    t.strokeRect(l, c, f, u),
    t.beginPath(),
    t.moveTo(l, c + u / 2),
    t.lineTo(l + f, c + u / 2),
    (t.lineWidth = 1.5),
    t.stroke());
}
function ou(t, e) {
  const n = nu,
    s = Math.round(n * Un[e]),
    i = document.createElement("canvas");
  ((i.width = n), (i.height = s));
  const r = i.getContext("2d");
  ((r.fillStyle = eu), r.fillRect(0, 0, n, s));
  const o = un(t),
    l = Ce(t);
  if (o === "A") Nn(r, l, n / 2, s / 2, n * (l === "S" ? 0.46 : 0.32));
  else if (o === "J" || o === "Q" || o === "K") ru(r, t, n, s);
  else for (const [c, f] of iu[o]) Nn(r, l, c * n, f * s, n * 0.19, f > 0.5);
  return (
    Di(r, t, n),
    r.save(),
    r.translate(n, s),
    r.rotate(Math.PI),
    Di(r, t, n),
    r.restore(),
    i
  );
}
function Li(t) {
  return new Promise((e, n) => {
    const s = new Image();
    ((s.onload = () => (s.naturalWidth > 0 ? e(s) : n(new Error("empty")))),
      (s.onerror = () => n(new Error(`missing ${t}`))),
      (s.src = t));
  });
}
const Ui = new Map();
function lu(t, e) {
  const n = `${t}:${e}`;
  let s = Ui.get(n);
  return (
    s ||
      ((s = Li(`./cards/${t}.png`)
        .catch(() => Li(`./cards/${t}.jpg`))
        .then((r) => r)
        .catch(() => ou(t, e))),
      Ui.set(n, s)),
    s
  );
}
class au {
  viewW = 1;
  viewH = 1;
  videoW = 1;
  videoH = 1;
  mirror = !1;
  zoom = 1;
  update(e, n, s, i, r, o) {
    ((this.viewW = Math.max(1, e)),
      (this.viewH = Math.max(1, n)),
      (this.videoW = Math.max(1, s)),
      (this.videoH = Math.max(1, i)),
      (this.mirror = r),
      (this.zoom = Math.max(1, o)));
  }
  layout() {
    const e =
        Math.max(this.viewW / this.videoW, this.viewH / this.videoH) *
        this.zoom,
      n = this.videoW * e,
      s = this.videoH * e;
    return { dw: n, dh: s, ox: (this.viewW - n) / 2, oy: (this.viewH - s) / 2 };
  }
  videoToDisplay(e) {
    const { dw: n, dh: s, ox: i, oy: r } = this.layout();
    let o = i + e.x * n;
    return (this.mirror && (o = this.viewW - o), { x: o, y: r + e.y * s });
  }
  displayToVideo(e) {
    const { dw: n, dh: s, ox: i, oy: r } = this.layout();
    return {
      x: ((this.mirror ? this.viewW - e.x : e.x) - i) / n,
      y: (e.y - r) / s,
    };
  }
  videoUvTransform() {
    const { dw: e, dh: n, ox: s, oy: i } = this.layout(),
      r = this.viewH / n,
      o = -i / n;
    return this.mirror
      ? [-this.viewW / e, r, (this.viewW - s) / e, o]
      : [this.viewW / e, r, -s / e, o];
  }
}
class zs {
  canvas = document.createElement("canvas");
  ctx = this.canvas.getContext("2d", { willReadFrequently: !0 });
  last = 0;
  hist = new Uint32Array(256);
  white = [0.96, 0.96, 0.96];
  static PAPER = 0.96;
  update(e, n, s) {
    if (!n || e.videoWidth === 0 || s - this.last < 150) return;
    this.last = s;
    const i = 128 / Math.max(e.videoWidth, e.videoHeight),
      r = Math.max(8, Math.round(e.videoWidth * i)),
      o = Math.max(8, Math.round(e.videoHeight * i));
    ((this.canvas.width !== r || this.canvas.height !== o) &&
      ((this.canvas.width = r), (this.canvas.height = o)),
      this.ctx.drawImage(e, 0, 0, r, o));
    const l = this.ctx.getImageData(0, 0, r, o).data,
      c = n.map((z) => z.x * r),
      f = n.map((z) => z.y * o),
      u = Math.max(0, Math.floor(Math.min(...c))),
      a = Math.min(r - 1, Math.ceil(Math.max(...c))),
      h = Math.max(0, Math.floor(Math.min(...f))),
      b = Math.min(o - 1, Math.ceil(Math.max(...f))),
      v = n.map((z) => ({ x: z.x * r, y: z.y * o })),
      y = [];
    this.hist.fill(0);
    for (let z = h; z <= b; z++)
      for (let lt = u; lt <= a; lt++) {
        if (!Jc({ x: lt + 0.5, y: z + 0.5 }, v)) continue;
        const F = (z * r + lt) * 4,
          B = (l[F] * 54 + l[F + 1] * 183 + l[F + 2] * 19) >> 8;
        (this.hist[B]++, y.push(F, B));
      }
    const S = y.length / 2;
    if (S < 12) return;
    let M = 0,
      A = 255;
    for (let z = 255; z >= 0; z--)
      if (((M += this.hist[z]), M >= S * 0.15)) {
        A = z;
        break;
      }
    let $ = 0,
      O = 0,
      st = 0,
      pt = 0;
    for (let z = 0; z < y.length; z += 2) {
      if (y[z + 1] < A) continue;
      const lt = y[z];
      (($ += l[lt]), (O += l[lt + 1]), (st += l[lt + 2]), pt++);
    }
    if (!pt) return;
    const wt = 0.25,
      Mt = [$ / pt / 255, O / pt / 255, st / pt / 255];
    this.white = this.white.map((z, lt) => z + (Mt[lt] - z) * wt);
  }
  gain(e) {
    return this.white.map(
      (n) => 1 + (Math.min(1.12, Math.max(0.25, n / zs.PAPER)) - 1) * e,
    );
  }
}
const fs = (t) => t * t * (3 - 2 * t),
  $i = (t) => Math.min(1, Math.max(0, t));
class uu {
  constructor(e) {
    this.config = e;
  }
  _state = "reveal";
  transition = null;
  pendingAt = null;
  lastTrigger = -1 / 0;
  listeners = new Set();
  get state() {
    return this._state;
  }
  onChange(e) {
    return (this.listeners.add(e), () => this.listeners.delete(e));
  }
  isBusy(e) {
    return (
      this.advance(e),
      this.pendingAt !== null || this.transition !== null
    );
  }
  trigger(e) {
    return this.isBusy(e) || e - this.lastTrigger < this.config.cooldownMs
      ? !1
      : ((this.lastTrigger = e), this.setState("real"), !0);
  }
  reset() {
    ((this.transition = null),
      (this.pendingAt = null),
      (this.lastTrigger = -1 / 0),
      this.setState("reveal"));
  }
  setState(e) {
    e !== this._state &&
      ((this._state = e), this.listeners.forEach((n) => n(e)));
  }
  advance(e) {
    if (
      this.transition &&
      e >= this.transition.start + this.transition.duration
    ) {
      const n = this.transition.to;
      ((this.transition = null), this.setState(n));
    }
  }
  frame(e) {
    this.advance(e);
    const { initialCard: n, finalCard: s } = this.config,
      i = {
        state: this._state,
        cardA: n,
        cardB: s,
        // The physical 9D is never rendered as a virtual card. Only the AS
        // replacement texture participates in the composite.
        mix: 1,
        overlayAlpha: this._state === "real" ? 0 : 1,
        blur: 0,
        busy: this.pendingAt !== null || this.transition !== null,
      },
      r = this.transition;
    if (!r) return i;
    const o = r.duration > 0 ? $i((e - r.start) / r.duration) : 1;
    if (r.type === "crossfade")
      r.to === "reveal"
        ? (i.mix = fs(o))
        : r.to === "real" && (i.overlayAlpha = 1 - fs(o));
    else if (r.type === "focus") {
      i.blur = Math.sin(Math.PI * o);
      const l = fs($i((o - 0.35) / 0.3));
      r.to === "reveal"
        ? (i.mix = l)
        : r.to === "real" && (i.overlayAlpha = 1 - l);
    }
    return i;
  }
}
const fu = `#version 300 es
in vec2 a_pos;
uniform vec4 u_xform;
out vec2 v_uv;
void main() {
  vec2 s = vec2(a_pos.x * 0.5 + 0.5, 0.5 - a_pos.y * 0.5);
  v_uv = s * u_xform.xy + u_xform.zw;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`,
  du = `#version 300 es
precision highp float;
in vec2 v_uv;
uniform sampler2D u_tex;
uniform float u_bias;
uniform vec2 u_texel;
out vec4 o;
void main() {
  if (u_bias <= 0.0) { o = vec4(texture(u_tex, v_uv).rgb, 1.0); return; }
  vec2 d = u_texel * exp2(u_bias) * 0.7;
  vec3 c = texture(u_tex, v_uv, u_bias).rgb * 0.4
         + texture(u_tex, v_uv + vec2(d.x, d.y), u_bias).rgb * 0.15
         + texture(u_tex, v_uv + vec2(-d.x, d.y), u_bias).rgb * 0.15
         + texture(u_tex, v_uv + vec2(d.x, -d.y), u_bias).rgb * 0.15
         + texture(u_tex, v_uv + vec2(-d.x, -d.y), u_bias).rgb * 0.15;
  o = vec4(c, 1.0);
}`,
  hu = `#version 300 es
in vec2 a_pos; // device pixels, top-left origin
uniform vec2 u_view;
void main() {
  gl_Position = vec4(a_pos.x / u_view.x * 2.0 - 1.0, 1.0 - a_pos.y / u_view.y * 2.0, 0.0, 1.0);
}`,
  pu = `#version 300 es
precision highp float;
uniform mat3 u_hinv;
uniform vec2 u_view;
uniform sampler2D u_a;
uniform sampler2D u_b;
uniform sampler2D u_video;
uniform vec4 u_video_xform;
uniform vec2 u_video_texel;
uniform float u_mix;
uniform float u_alpha;
uniform vec3 u_gain;
uniform float u_light_strength;
uniform float u_bias;
uniform float u_grain;
uniform float u_seed;
uniform float u_inset;
uniform float u_aspect;
out vec4 o;

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}
float hash(vec2 p) {
  p = fract(p * vec2(443.897, 441.423));
  p += dot(p, p.yx + 19.19);
  return fract((p.x + p.y) * p.x);
}

float luminance(vec3 c) {
  return dot(c, vec3(0.2126, 0.7152, 0.0722));
}

// Conservative, soft skin protection. Saturated red ink is rejected by the
// green/blue and saturation gates, while warm skin remains camera-visible.
float skinMask(vec3 c) {
  float hi = max(c.r, max(c.g, c.b));
  float lo = min(c.r, min(c.g, c.b));
  float saturation = (hi - lo) / max(hi, 0.05);
  float warm = smoothstep(0.015, 0.075, c.r - c.g)
             * smoothstep(-0.025, 0.055, c.g - c.b);
  float exposed = smoothstep(0.08, 0.22, hi);
  float notRedInk = 1.0 - smoothstep(0.68, 0.88, saturation);
  return smoothstep(0.15, 0.75, warm * exposed * notRedInk);
}

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_view.y - gl_FragCoord.y);
  vec3 q = u_hinv * vec3(p, 1.0);
  vec2 uv = q.xy / q.z;
  vec2 c = (uv - 0.5) * vec2(1.0, u_aspect);

  // Replace only the printed interior. The detected physical border, rounded
  // corners, background and everything outside the homography stay untouched.
  float border = max(0.035, u_inset);
  vec2 interior = vec2(0.5 - border, (0.5 - border) * u_aspect);
  float d = sdRoundBox(c, interior, 0.028);
  float feather = max(0.010, fwidth(d) * 1.5);
  float cover = 1.0 - smoothstep(-feather, feather, d);
  if (cover <= 0.0) discard;

  // Sample the live camera at this fragment. A wide cross-filter plus a max
  // bias estimates the low-frequency paper illumination without copying the
  // original 9D pips into the AS texture.
  vec2 videoUv = (p / u_view) * u_video_xform.xy + u_video_xform.zw;
  vec2 ld = u_video_texel * 24.0;
  vec3 camera = texture(u_video, videoUv).rgb;
  float y0 = luminance(camera);
  float y1 = luminance(texture(u_video, videoUv + vec2( ld.x, 0.0)).rgb);
  float y2 = luminance(texture(u_video, videoUv + vec2(-ld.x, 0.0)).rgb);
  float y3 = luminance(texture(u_video, videoUv + vec2(0.0,  ld.y)).rgb);
  float y4 = luminance(texture(u_video, videoUv + vec2(0.0, -ld.y)).rgb);
  float localPaper = mix((y0 + y1 + y2 + y3 + y4) * 0.2,
                         max(y0, max(max(y1, y2), max(y3, y4))), 0.65);
  float referencePaper = max(0.18, luminance(vec3(0.96) * u_gain));
  float lighting = clamp(localPaper / referencePaper, 0.62, 1.22);

  vec2 tuv = clamp(uv, 0.0, 1.0);
  vec3 col = mix(texture(u_a, tuv, u_bias).rgb, texture(u_b, tuv, u_bias).rgb, u_mix);
  col *= u_gain * mix(1.0, lighting, u_light_strength);
  col += (hash(gl_FragCoord.xy + u_seed) - 0.5) * u_grain;
  cover *= 1.0 - skinMask(camera);
  if (cover <= 0.001) discard;
  o = vec4(col, cover * u_alpha);
}`;
function Hi(t, e, n) {
  const s = (l, c) => {
      const f = t.createShader(l);
      if (
        (t.shaderSource(f, c),
        t.compileShader(f),
        !t.getShaderParameter(f, t.COMPILE_STATUS))
      )
        throw new Error(t.getShaderInfoLog(f) ?? "shader error");
      return f;
    },
    i = t.createProgram(),
    r = s(t.VERTEX_SHADER, e),
    o = s(t.FRAGMENT_SHADER, n);
  if (
    (t.attachShader(i, r),
    t.attachShader(i, o),
    t.bindAttribLocation(i, 0, "a_pos"),
    t.linkProgram(i),
    t.deleteShader(r),
    t.deleteShader(o),
    !t.getProgramParameter(i, t.LINK_STATUS))
  )
    throw new Error(t.getProgramInfoLog(i) ?? "link error");
  return i;
}
class mu {
  constructor(e) {
    this.canvas = e;
    const n = e.getContext("webgl2", {
      alpha: !1,
      antialias: !1,
      depth: !1,
      stencil: !1,
      premultipliedAlpha: !1,
      preserveDrawingBuffer: !1,
      powerPreference: "high-performance",
      desynchronized: !0,
    });
    if (!n) throw new Error("WebGL2 is not available");
    ((this.gl = n),
      e.addEventListener("webglcontextlost", this.onLost),
      e.addEventListener("webglcontextrestored", this.onRestored),
      this.init());
  }
  gl;
  s = null;
  displaySlot = 0;
  cardSources = [null, null];
  lost = !1;
  dpr = 1;
  onLost = (e) => {
    (e.preventDefault(), (this.lost = !0), (this.s = null));
  };
  onRestored = () => {
    ((this.lost = !1),
      this.init(),
      this.cardSources.forEach((e, n) => e && this.setCard(n, e)));
  };
  init() {
    const e = this.gl,
      n = Hi(e, fu, du),
      s = Hi(e, hu, pu),
      i = e.createBuffer();
    (e.bindBuffer(e.ARRAY_BUFFER, i),
      e.bufferData(
        e.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
        e.STATIC_DRAW,
      ));
    const r = e.createBuffer(),
      o = () => {
        const c = e.createTexture();
        return (
          e.bindTexture(e.TEXTURE_2D, c),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_S, e.CLAMP_TO_EDGE),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_WRAP_T, e.CLAMP_TO_EDGE),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MIN_FILTER, e.LINEAR),
          e.texParameteri(e.TEXTURE_2D, e.TEXTURE_MAG_FILTER, e.LINEAR),
          e.texImage2D(
            e.TEXTURE_2D,
            0,
            e.RGBA,
            1,
            1,
            0,
            e.RGBA,
            e.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 0, 255]),
          ),
          c
        );
      },
      l = {};
    for (const c of ["u_xform", "u_tex", "u_bias", "u_texel"])
      l["v" + c] = e.getUniformLocation(n, c);
    for (const c of [
      "u_view",
      "u_hinv",
      "u_a",
      "u_b",
      "u_video",
      "u_video_xform",
      "u_video_texel",
      "u_mix",
      "u_alpha",
      "u_gain",
      "u_light_strength",
      "u_bias",
      "u_grain",
      "u_seed",
      "u_inset",
      "u_aspect",
    ])
      l["c" + c] = e.getUniformLocation(s, c);
    ((this.s = {
      videoProg: n,
      cardProg: s,
      quadBuf: i,
      cardBuf: r,
      videoTex: [o(), o(), o()],
      videoSize: [
        [1, 1],
        [1, 1],
        [1, 1],
      ],
      cardTex: [o(), o()],
      uni: l,
    }),
      e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, !1),
      e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, !1));
  }
  get isLost() {
    return this.lost;
  }
  resize(e, n, s) {
    this.dpr = Math.min(3, s);
    const i = Math.round(e * this.dpr),
      r = Math.round(n * this.dpr);
    (this.canvas.width !== i || this.canvas.height !== r) &&
      ((this.canvas.width = i), (this.canvas.height = r));
  }
  uploadVideo(e, n) {
    const s = this.s;
    if (!s || e.videoWidth === 0) return;
    const i = this.gl;
    (i.bindTexture(i.TEXTURE_2D, s.videoTex[n]),
      i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, e),
      (s.videoSize[n] = [e.videoWidth, e.videoHeight]));
  }
  showSlot(e) {
    this.displaySlot = e;
  }
  get shownSlot() {
    return this.displaySlot;
  }
  setCard(e, n) {
    this.cardSources[e] = n;
    const s = this.s;
    if (!s) return;
    const i = this.gl;
    (i.bindTexture(i.TEXTURE_2D, s.cardTex[e]),
      i.texImage2D(i.TEXTURE_2D, 0, i.RGBA, i.RGBA, i.UNSIGNED_BYTE, n),
      i.generateMipmap(i.TEXTURE_2D),
      i.texParameteri(
        i.TEXTURE_2D,
        i.TEXTURE_MIN_FILTER,
        i.LINEAR_MIPMAP_LINEAR,
      ));
    const r = i.getExtension("EXT_texture_filter_anisotropic");
    r &&
      i.texParameterf(
        i.TEXTURE_2D,
        r.TEXTURE_MAX_ANISOTROPY_EXT,
        Math.min(8, i.getParameter(r.MAX_TEXTURE_MAX_ANISOTROPY_EXT)),
      );
  }
  render(e) {
    const n = this.s;
    if (!n || this.lost) return;
    const s = this.gl,
      i = this.canvas.width,
      r = this.canvas.height;
    (s.viewport(0, 0, i, r), s.disable(s.BLEND));
    const o = e.videoBlur * 4;
    (s.useProgram(n.videoProg),
      s.activeTexture(s.TEXTURE0),
      s.bindTexture(s.TEXTURE_2D, n.videoTex[this.displaySlot]),
      o > 0.01
        ? (s.generateMipmap(s.TEXTURE_2D),
          s.texParameteri(
            s.TEXTURE_2D,
            s.TEXTURE_MIN_FILTER,
            s.LINEAR_MIPMAP_LINEAR,
          ))
        : s.texParameteri(s.TEXTURE_2D, s.TEXTURE_MIN_FILTER, s.LINEAR));
    const [l, c] = n.videoSize[this.displaySlot];
    (s.uniform1i(n.uni.vu_tex, 0),
      s.uniform4fv(n.uni.vu_xform, e.uvTransform),
      s.uniform1f(n.uni.vu_bias, o > 0.01 ? o : 0),
      s.uniform2f(n.uni.vu_texel, 1 / l, 1 / c),
      s.bindBuffer(s.ARRAY_BUFFER, n.quadBuf),
      s.enableVertexAttribArray(0),
      s.vertexAttribPointer(0, 2, s.FLOAT, !1, 0, 0),
      s.drawArrays(s.TRIANGLE_STRIP, 0, 4));
    const f = e.card;
    if (!f || f.alpha <= 0.001) return;
    const u = f.quad.map((A) => ({ x: A.x * this.dpr, y: A.y * this.dpr })),
      a = f.flipX ? [u[1], u[0], u[3], u[2]] : u,
      h = Gc(a),
      b = h && Yc(h);
    if (!b) return;
    const v = to(u),
      y = new Float32Array(8);
    ([0, 1, 3, 2].forEach((A, $) => {
      ((y[$ * 2] = v.x + (u[A].x - v.x) * 1.04),
        (y[$ * 2 + 1] = v.y + (u[A].y - v.y) * 1.04));
    }),
      s.useProgram(n.cardProg),
      s.bindBuffer(s.ARRAY_BUFFER, n.cardBuf),
      s.bufferData(s.ARRAY_BUFFER, y, s.DYNAMIC_DRAW),
      s.vertexAttribPointer(0, 2, s.FLOAT, !1, 0, 0),
      s.activeTexture(s.TEXTURE0),
      s.bindTexture(s.TEXTURE_2D, n.cardTex[0]),
      s.activeTexture(s.TEXTURE1),
      s.bindTexture(s.TEXTURE_2D, n.cardTex[1]),
      s.activeTexture(s.TEXTURE2),
      s.bindTexture(s.TEXTURE_2D, n.videoTex[this.displaySlot]));
    const M = n.uni;
    (s.uniform2f(M.cu_view, i, r),
      s.uniformMatrix3fv(M.cu_hinv, !0, b),
      s.uniform1i(M.cu_a, 0),
      s.uniform1i(M.cu_b, 1),
      s.uniform1i(M.cu_video, 2),
      s.uniform4fv(M.cu_video_xform, e.uvTransform),
      s.uniform2f(M.cu_video_texel, 1 / l, 1 / c),
      s.uniform1f(M.cu_mix, f.mix),
      s.uniform1f(M.cu_alpha, f.alpha),
      s.uniform3fv(M.cu_gain, f.gain),
      s.uniform1f(M.cu_light_strength, f.lightStrength),
      s.uniform1f(M.cu_bias, f.softness + f.blur * 4),
      s.uniform1f(M.cu_grain, f.grain),
      s.uniform1f(M.cu_seed, (performance.now() % 1e3) * 0.137),
      s.uniform1f(M.cu_inset, f.inset),
      s.uniform1f(M.cu_aspect, f.aspect),
      s.enable(s.BLEND),
      s.blendFunc(s.SRC_ALPHA, s.ONE_MINUS_SRC_ALPHA),
      s.drawArrays(s.TRIANGLE_STRIP, 0, 4),
      s.disable(s.BLEND),
      s.activeTexture(s.TEXTURE0));
  }
  dispose() {
    (this.canvas.removeEventListener("webglcontextlost", this.onLost),
      this.canvas.removeEventListener("webglcontextrestored", this.onRestored));
    const e = this.s;
    if (e) {
      const n = this.gl;
      (n.deleteProgram(e.videoProg),
        n.deleteProgram(e.cardProg),
        n.deleteBuffer(e.quadBuf),
        n.deleteBuffer(e.cardBuf),
        [...e.videoTex, ...e.cardTex].forEach((s) => n.deleteTexture(s)));
    }
    ((this.s = null),
      this.gl.getExtension("WEBGL_lose_context")?.loseContext());
  }
}
class gu {
  constructor(e, n, s) {
    ((this.settings = s),
      (this.renderer = new mu(e)),
      (this.camera = new Xc(n)),
      (this.camera.onError = (i) => this.onCameraError(i)),
      (this.camera.onStarted = () => {
        (this.tracker.reset(), this.detector.resetTracking());
      }),
      (this.machine = new uu(this.machineConfig())),
      (this.detector.onResult = (i) => this.handleResult(i)),
      window.addEventListener("resize", this.onResize),
      this.onResize());
  }
  mapper = new au();
  camera;
  renderer;
  detector = new js();
  tracker = new tu();
  machine;
  light = new zs();
  zoom = 1;
  lastResult = null;
  lastQuad = null;
  onStats = () => {};
  onCameraError = () => {};
  raf = 0;
  viewW = 1;
  viewH = 1;
  lastFrameId = -1;
  lastUploadAt = 0;
  seq = 0;
  pendingSlot = 0;
  pendingSince = 0;
  renderTimes = [];
  lastStats = 0;
  cardKeys = ["", ""];
  lockedQuad = null;
  smoothQuad = null;
  lastNow = 0;
  disposed = !1;
  machineConfig() {
    const e = this.settings;
    return {
      initialCard: e.initialCard,
      finalCard: e.finalCard,
      animationType: e.animationType,
      durationMs: e.animationDuration,
      triggerDelayMs: e.triggerDelay,
      cooldownMs: 350,
    };
  }
  onResize = () => {
    ((this.viewW = window.innerWidth),
      (this.viewH = window.innerHeight),
      this.renderer.resize(
        this.viewW,
        this.viewH,
        window.devicePixelRatio || 1,
      ));
  };
  get mirror() {
    return this.camera.facingMode === "user" && this.settings.mirrorFront;
  }
  get cardAspect() {
    return Un[this.settings.cardType];
  }
  start() {
    (this.camera.start(this.settings.facingMode),
      this.settings.detectionMode === "auto" && this.detector.load());
    const e = (n) => {
      this.disposed || (this.frame(n), (this.raf = requestAnimationFrame(e)));
    };
    this.raf = requestAnimationFrame(e);
  }
  setFacing(e) {
    return (
      (this.settings.facingMode = e),
      (this.zoom = 1),
      this.tracker.reset(),
      this.detector.resetTracking(),
      this.renderer.showSlot(0),
      (this.pendingSlot = 0),
      this.camera.start(e)
    );
  }
  trigger() {
    return this.machine.trigger(performance.now());
  }
  resetPerformance() {
    this.machine.reset();
  }
  setLocked(e) {
    this.lockedQuad =
      e && this.lastQuad
        ? Xe(this.lastQuad, (n) => this.mapper.displayToVideo(n))
        : null;
  }
  snapshot() {
    return (
      this.frame(performance.now(), !0),
      this.renderer.canvas.toDataURL("image/jpeg", 0.85)
    );
  }
  handleResult(e) {
    ((this.lastResult = e),
      this.tracker.update(
        e.points,
        e.confidence,
        e.width / e.height,
        performance.now(),
      ),
      this.pendingSlot &&
        e.id === this.pendingSlot &&
        (this.renderer.showSlot(this.pendingSlot), (this.pendingSlot = 0)));
  }
  syncCards() {
    const e = this.settings;
    [e.initialCard, e.finalCard].forEach((s, i) => {
      const r = `${s}:${e.cardType}`;
      this.cardKeys[i] !== r &&
        ((this.cardKeys[i] = r),
        lu(s, e.cardType).then((o) => {
          this.cardKeys[i] === r &&
            !this.disposed &&
            this.renderer.setCard(i, o);
        }));
    });
  }
  frame(e, n = !1) {
    const s = this.settings,
      i = this.camera.video;
    ((this.machine.config = this.machineConfig()),
      this.syncCards(),
      this.tracker.setOptions({ smoothing: s.smoothing, holdMs: s.holdMs }),
      s.detectionMode === "auto" &&
        this.detector.status === "idle" &&
        this.detector.load(),
      this.mapper.update(
        this.viewW,
        this.viewH,
        i.videoWidth,
        i.videoHeight,
        this.mirror,
        this.zoom,
      ));
    const r = s.detectionMode === "auto" && this.detector.status === "ready",
      o = r && s.syncVideo && !s.overlayLocked && !n,
      l = this.camera.frameId,
      c = i.readyState >= 2 && e - this.lastUploadAt > 120;
    if ((l !== this.lastFrameId || c) && i.videoWidth > 0)
      if (o) {
        if (!this.detector.busy && !this.pendingSlot) {
          const A = this.renderer.shownSlot === 1 ? 2 : 1;
          (this.renderer.uploadVideo(i, A),
            (this.lastUploadAt = e),
            this.detector.send(i, A, this.cardAspect)
              ? ((this.pendingSlot = A), (this.pendingSince = e))
              : this.renderer.showSlot(A),
            (this.lastFrameId = l));
        }
      } else
        (this.renderer.uploadVideo(i, 0),
          (this.lastUploadAt = e),
          this.renderer.showSlot(0),
          (this.pendingSlot = 0),
          (this.lastFrameId = l),
          r &&
            !s.overlayLocked &&
            this.detector.send(i, ++this.seq + 10, this.cardAspect));
    this.pendingSlot &&
      e - this.pendingSince > 300 &&
      (this.renderer.showSlot(this.pendingSlot), (this.pendingSlot = 0));
    const f = this.machine.frame(e);
    let u = null,
      a = !1,
      h = 1,
      b = "manual",
      v = 1;
    const y = () => {
      ((u = Bs(s.manual, this.viewW, this.viewH, this.cardAspect)),
        (a = this.mirror));
    };
    if (s.detectionMode === "manual") y();
    else if (s.overlayLocked && this.lockedQuad)
      u = Xe(this.lockedQuad, (A) => this.mapper.videoToDisplay(A));
    else {
      const A = this.tracker.output(e);
      ((b = A.status),
        (v = A.confidence),
        A.quad
          ? ((u = Xe(A.quad, ($) => this.mapper.videoToDisplay($))),
            (h = A.visibility),
            o || (u = this.interpolate(u, e)))
          : s.autoFallbackManual && y());
    }
    (u || (this.smoothQuad = null), (this.lastQuad = u), (this.lastNow = e));
    const S = u ? Xe(u, (A) => this.mapper.displayToVideo(A)) : null;
    this.light.update(i, S, e);
    const M = f.blur * 0.6;
    for (
      this.renderer.render({
        uvTransform: this.mapper.videoUvTransform(),
        videoBlur: M,
        card: u
          ? {
              quad: u,
              flipX: a,
              mix: f.mix,
              alpha: f.overlayAlpha * h,
              gain: this.light.gain(s.lightMatch),
              lightStrength: s.lightMatch,
              softness: s.softness,
              blur: M,
              grain: s.grain,
              inset: s.edgeInset,
              aspect: this.cardAspect,
            }
          : null,
      }),
        this.renderTimes.push(e);
      this.renderTimes.length && e - this.renderTimes[0] > 1e3;
    )
      this.renderTimes.shift();
    e - this.lastStats > 250 &&
      ((this.lastStats = e),
      this.onStats({
        cameraFps: this.camera.fps,
        renderFps: this.renderTimes.length,
        detectFps: this.detector.fps,
        detectMs: this.detector.lastMs,
        confidence: v,
        trackStatus: b,
        magicState: f.state,
        detector: this.detector.status,
        videoW: i.videoWidth,
        videoH: i.videoHeight,
      }));
  }
  interpolate(e, n) {
    const s = Math.max(0, n - this.lastNow);
    if (!this.smoothQuad || s > 200) return ((this.smoothQuad = e), e);
    const i = 1 - Math.exp(-s / 35);
    return (
      (this.smoothQuad = this.smoothQuad.map((r, o) => ({
        x: r.x + (e[o].x - r.x) * i,
        y: r.y + (e[o].y - r.y) * i,
      }))),
      this.smoothQuad
    );
  }
  dispose() {
    ((this.disposed = !0),
      cancelAnimationFrame(this.raf),
      window.removeEventListener("resize", this.onResize),
      this.detector.dispose(),
      this.camera.dispose(),
      this.renderer.dispose());
  }
}
const vu = { class: "root" },
  yu = { key: 2, class: "cam-msg" },
  bu = { key: 6, class: "fatal" },
  xu = Ue({
    __name: "App",
    setup(t) {
      const e = mt(),
        n = mt(),
        s = oi(null),
        i = oi(null),
        r = mt(null),
        o = mt(""),
        l = mt(""),
        c = mt(!1),
        f = mt(!1),
        u = mt(null),
        a = mt(0),
        h = mt(null),
        b = mt(1),
        v = [0.5, 1, 2, 5];
      let y = null;
      async function S() {
        try {
          const F = navigator;
          document.visibilityState === "visible" &&
            F.wakeLock &&
            (y = await F.wakeLock.request("screen"));
        } catch {}
      }
      const M = () => document.visibilityState === "visible" && S();
      (Yn(() => {
        try {
          const F = new gu(n.value, e.value, C);
          ((F.onStats = (B) => {
            ((i.value = B), (l.value = F.detector.error));
          }),
            (F.onCameraError = (B) => (r.value = B)),
            F.start(),
            (s.value = F));
        } catch (F) {
          o.value = String(F?.message ?? F);
        }
        (S(), document.addEventListener("visibilitychange", M));
      }),
        hn(() => {
          (document.removeEventListener("visibilitychange", M),
            y?.release().catch(() => {}),
            s.value?.dispose());
        }),
        Fe(
          () => C.overlayLocked,
          (F) => s.value?.setLocked(F),
        ),
        Fe(
          () => C.detectionMode,
          () => {
            (s.value?.tracker.reset(), s.value?.detector.resetTracking());
          },
        ));
      let A = null;
      function $(F) {
        A = { x: F.clientX, y: F.clientY, t: performance.now() };
        const B = s.value?.camera.video;
        B && B.srcObject && B.paused && B.play().catch(() => {});
      }
      function O(F) {
        const B = A;
        if (
          ((A = null),
          !B ||
            performance.now() - B.t > 600 ||
            Math.hypot(F.clientX - B.x, F.clientY - B.y) > 12)
        )
          return;
        const yt = document.querySelector(".preview")?.getBoundingClientRect();
        if (!(yt && (F.clientY < yt.top || F.clientY > yt.bottom))) {
          if (r.value) {
            s.value?.camera.start();
            return;
          }
          ((h.value = {
            x: F.clientX,
            y: F.clientY,
            key: (h.value?.key ?? 0) + 1,
          }),
            s.value?.trigger());
        }
      }
      function st() {
        const F = s.value;
        F && ((u.value = F.snapshot()), a.value++);
      }
      function pt(F) {
        ((b.value = F), s.value && (s.value.zoom = F));
      }
      const wt = (F) => F >= 1;
      async function Mt() {
        const F = C.facingMode === "user" ? "environment" : "user";
        ((b.value = 1), await s.value?.setFacing(F));
      }
      function z() {
        const F = s.value?.lastQuad;
        if (!F) return;
        const B = window.innerWidth,
          yt = window.innerHeight,
          Pe = to(F),
          mn = Math.hypot(F[1].x - F[0].x, F[1].y - F[0].y),
          ut = Math.hypot(F[2].x - F[3].x, F[2].y - F[3].y),
          J = {
            cx: Pe.x / B,
            cy: Pe.y / yt,
            width: (mn + ut) / 2 / B,
            rotation:
              (Math.atan2(F[1].y - F[0].y, F[1].x - F[0].x) * 180) / Math.PI,
            corners: [0, 1, 2, 3].map(() => ({ x: 0, y: 0 })),
          },
          G = Bs(J, B, yt, Un[C.cardType]);
        ((J.corners = G.map((Nt, de) => ({
          x: (F[de].x - Nt.x) / B,
          y: (F[de].y - Nt.y) / B,
        }))),
          (C.manual = J));
      }
      function lt() {
        ((c.value = !1), (f.value = !0));
      }
      return (F, B) => (
        V(),
        W("div", vu, [
          m(
            "video",
            {
              ref_key: "video",
              ref: e,
              class: Me([
                "video",
                { mirror: E(C).facingMode === "user" && E(C).mirrorFront },
              ]),
              playsinline: "",
              muted: "",
              autoplay: "",
            },
            null,
            2,
          ),
          m(
            "canvas",
            {
              ref_key: "canvas",
              ref: n,
              class: Me(["gl", { hidden: !!o.value }]),
            },
            null,
            2,
          ),
          m(
            "div",
            { class: "tap-layer", onPointerdown: $, onPointerup: O },
            null,
            32,
          ),
          h.value
            ? (V(),
              ze(
                Na,
                { key: h.value.key, x: h.value.x, y: h.value.y },
                null,
                8,
                ["x", "y"],
              ))
            : Et("", !0),
          Ut(
            Da,
            {
              zoom: b.value,
              "zoom-options": v,
              "available-zoom": wt,
              thumbnail: u.value,
              "show-grid": E(C).showGrid,
              "show-level": E(C).showLevel,
              onShutter: st,
              onFlip: Mt,
              onZoom: pt,
              onOpenSettings: B[0] || (B[0] = (yt) => (c.value = !0)),
            },
            null,
            8,
            ["zoom", "thumbnail", "show-grid", "show-level"],
          ),
          a.value
            ? (V(), W("div", { key: a.value, class: "flash" }))
            : Et("", !0),
          r.value
            ? (V(),
              W("div", yu, [
                r.value.kind === "denied"
                  ? (V(),
                    W(nt, { key: 0 }, [ct("請在「設定」中允許取用相機")], 64))
                  : r.value.kind === "insecure"
                    ? (V(),
                      W(nt, { key: 1 }, [ct("需要 HTTPS 才能使用相機")], 64))
                    : r.value.kind === "busy"
                      ? (V(),
                        W(nt, { key: 2 }, [ct("相機正被其他 App 使用")], 64))
                      : (V(), W(nt, { key: 3 }, [ct("相機無法使用")], 64)),
                B[4] || (B[4] = m("small", null, "輕點以重試", -1)),
              ]))
            : Et("", !0),
          f.value && !E(C).overlayLocked
            ? (V(),
              ze(
                Ka,
                {
                  key: 3,
                  pose: E(C).manual,
                  "card-aspect": E(Un)[E(C).cardType],
                  onDone: B[1] || (B[1] = (yt) => (f.value = !1)),
                },
                null,
                8,
                ["pose", "card-aspect"],
              ))
            : Et("", !0),
          E(C).debug && s.value && !c.value
            ? (V(),
              ze($a, { key: 4, engine: s.value, stats: i.value }, null, 8, [
                "engine",
                "stats",
              ]))
            : Et("", !0),
          c.value
            ? (V(),
              ze(
                qc,
                {
                  key: 5,
                  stats: i.value,
                  "detector-error": l.value,
                  onClose: B[2] || (B[2] = (yt) => (c.value = !1)),
                  onResetPerformance:
                    B[3] || (B[3] = (yt) => s.value?.resetPerformance()),
                  onEditOnScreen: lt,
                  onCopyAutoPose: z,
                  onFlip: Mt,
                },
                null,
                8,
                ["stats", "detector-error"],
              ))
            : Et("", !0),
          o.value && E(C).debug
            ? (V(), W("div", bu, j(o.value), 1))
            : Et("", !0),
        ])
      );
    },
  }),
  _u = $e(xu, [["__scopeId", "data-v-2e54191b"]]);
document.addEventListener("gesturestart", (t) => t.preventDefault());
document.addEventListener("contextmenu", (t) => t.preventDefault());
document.addEventListener(
  "touchmove",
  (t) => {
    t.target?.closest?.("[data-allow-scroll]") || t.preventDefault();
  },
  { passive: !1 },
);
wa(_u).mount("#app");
