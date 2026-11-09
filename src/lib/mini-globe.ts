/**
 * A small stand-in for globe.gl, with only what the Journey globe uses: a textured sphere with an
 * atmosphere glow, HTML elements pinned to lat / lng (hidden on the far side), orbit controls,
 * animated points of view and screen coordinates. Built on three.js alone, it is a fraction of
 * globe.gl's size (which brings every layer type and their dependencies along).
 *
 * Conventions match globe.gl, so code written against it keeps working: globe radius 100, the
 * same lat / lng to scene mapping, the texture's prime meridian facing +z, the same default lights,
 * and rotate / zoom speeds that scale with the camera's altitude.
 */
import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  Color,
  DirectionalLight,
  Material,
  Mesh,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  WebGLRenderer,
  type WebGLRendererParameters,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export const RADIUS = 100;
const toRad = Math.PI / 180;

type Pov = { lat: number; lng: number; altitude: number };

/** globe.gl's mapping: lat / lng / altitude (in Earth radii) to scene coordinates. */
export function toScene(lat: number, lng: number, altitude = 0) {
  const r = RADIUS * (1 + altitude);
  const phi = (90 - lat) * toRad, theta = (90 - lng) * toRad;
  return new Vector3(r * Math.sin(phi) * Math.cos(theta), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(theta));
}

function toPov(v: Vector3): Pov {
  const r = v.length();
  const phi = Math.acos(Math.max(-1, Math.min(1, v.y / r)));
  const theta = Math.atan2(v.z, v.x);
  let lng = 90 - theta / toRad;
  if (lng > 180) lng -= 360;
  return { lat: 90 - phi / toRad, lng, altitude: r / RADIUS - 1 };
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export class MiniGlobe {
  private _renderer: WebGLRenderer;
  private _scene = new Scene();
  private _camera = new PerspectiveCamera(50, 1, 0.1, 50000);
  private _controls: OrbitControls;
  private globe: Mesh;
  private atmosphere: Mesh;
  private atmoMat: ShaderMaterial;
  private atmoAlt = 0.15;
  private layer = document.createElement('div');
  private w = 1;
  private h = 1;
  private running = true;
  private raf = 0;
  private tween: { from: Pov; to: Pov; t0: number; ms: number } | null = null;

  // HTML layer.
  private data: object[] = [];
  private els = new Map<object, { el: HTMLElement; visible: boolean | null }>();
  private latOf: (d: object) => number = (d) => (d as { lat: number }).lat;
  private lngOf: (d: object) => number = (d) => (d as { lng: number }).lng;
  private altOf: (d: object) => number = () => 0;
  private make: (d: object) => HTMLElement = () => document.createElement('div');
  private visibility: (el: HTMLElement, visible: boolean) => void = (el, v) => (el.style.visibility = v ? '' : 'hidden');

  constructor(private stage: HTMLElement, opts: { rendererConfig?: WebGLRendererParameters; animateIn?: boolean } = {}) {
    this._renderer = new WebGLRenderer({ antialias: true, alpha: true, ...opts.rendererConfig });
    this._renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this._renderer.setClearColor(0x000000, 0);
    const canvas = this._renderer.domElement;
    canvas.style.display = 'block';
    stage.append(canvas);

    Object.assign(this.layer.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' });
    if (getComputedStyle(stage).position === 'static') stage.style.position = 'relative';
    stage.append(this.layer);

    // globe.gl's default lights; the directional one rides with the camera.
    const sun = new DirectionalLight(0xffffff, 0.6 * Math.PI);
    sun.position.set(1, 1, 1);
    this._camera.add(sun);
    this._scene.add(new AmbientLight(0xcccccc, Math.PI), this._camera);

    this.globe = new Mesh(new SphereGeometry(RADIUS, 96, 64), new MeshPhongMaterial({ color: 0x000000 }));
    this.globe.rotation.y = -Math.PI / 2; // texture's prime meridian facing +z, like globe.gl
    this._scene.add(this.globe);

    // Atmosphere: a slightly bigger back-facing sphere, brighter towards its rim.
    this.atmoMat = new ShaderMaterial({
      uniforms: { color: { value: new Color('#4fb6ff') } },
      vertexShader: 'varying vec3 vNormal; void main() { vNormal = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 color; varying vec3 vNormal; void main() { float i = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 6.0); gl_FragColor = vec4(color, 1.0) * clamp(i, 0.0, 1.0); }',
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    this.atmosphere = new Mesh(new SphereGeometry(RADIUS * (1 + this.atmoAlt), 64, 48), this.atmoMat);
    this._scene.add(this.atmosphere);

    this._controls = new OrbitControls(this._camera, canvas);
    this._controls.enablePan = false;
    this._controls.minDistance = RADIUS * 1.01;
    this._controls.maxDistance = RADIUS * 10;
    // Slower to turn and zoom when close, like globe.gl.
    this._controls.addEventListener('change', () => {
      const alt = this.pointOfView().altitude;
      this._controls.rotateSpeed = alt * 0.2;
      this._controls.zoomSpeed = Math.sqrt(alt) * 0.6;
    });

    this.pointOfView({ lat: 0, lng: 0, altitude: 2.5 });
    if (opts.animateIn) {
      canvas.style.opacity = '0';
      canvas.style.transition = 'opacity 0.6s ease-out';
      requestAnimationFrame(() => (canvas.style.opacity = '1'));
    }
    this.raf = requestAnimationFrame(this.frame);
  }

  private frame = (t: number) => {
    if (!this.running) return;
    if (this.tween) {
      const { from, to, t0, ms } = this.tween;
      const k = Math.min(1, (t - t0) / ms);
      const e = easeInOutCubic(k);
      this.place({ lat: from.lat + (to.lat - from.lat) * e, lng: from.lng + (to.lng - from.lng) * e, altitude: from.altitude + (to.altitude - from.altitude) * e });
      if (k >= 1) this.tween = null;
    }
    this._controls.update();
    this.updateLayer();
    this._renderer.render(this._scene, this._camera);
    this.raf = requestAnimationFrame(this.frame);
  };

  private place(p: Pov) {
    this._camera.position.copy(toScene(p.lat, p.lng, p.altitude));
    this._camera.lookAt(0, 0, 0);
  }

  // ---- Chainable settings (globe.gl names).
  backgroundColor(_: string) {
    return this; // the canvas is transparent: the stage's CSS background shows through
  }
  showAtmosphere(on: boolean) {
    this.atmosphere.visible = on;
    return this;
  }
  atmosphereAltitude(alt: number) {
    this.atmoAlt = alt;
    this.atmosphere.geometry.dispose();
    this.atmosphere.geometry = new SphereGeometry(RADIUS * (1 + alt), 64, 48);
    return this;
  }
  atmosphereColor(color: string) {
    (this.atmoMat.uniforms.color.value as Color).set(color);
    return this;
  }
  globeMaterial(m: Material) {
    this.globe.material = m;
    return this;
  }
  htmlLat(key: string) {
    this.latOf = (d) => (d as Record<string, number>)[key];
    return this;
  }
  htmlLng(key: string) {
    this.lngOf = (d) => (d as Record<string, number>)[key];
    return this;
  }
  htmlAltitude(alt: number) {
    this.altOf = () => alt;
    return this;
  }
  htmlElement(fn: (d: object) => HTMLElement) {
    this.make = fn;
    return this;
  }
  htmlTransitionDuration(_: number) {
    return this;
  }
  htmlElementVisibilityModifier(fn: (el: HTMLElement, visible: boolean) => void) {
    this.visibility = fn;
    return this;
  }
  /** Elements are kept per data object, so an unchanged item keeps its element. Later items sit on top. */
  htmlElementsData(data: object[]) {
    this.data = data;
    const keep = new Set(data);
    for (const [d, { el }] of this.els) if (!keep.has(d)) (el.remove(), this.els.delete(d));
    for (const d of data) {
      let entry = this.els.get(d);
      if (!entry) {
        const el = this.make(d);
        Object.assign(el.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'auto' });
        entry = { el, visible: null };
        this.els.set(d, entry);
      }
      this.layer.append(entry.el); // (re)append in data order
    }
    this.updateLayer();
    return this;
  }

  private updateLayer() {
    const cam = this._camera.position;
    for (const d of this.data) {
      const entry = this.els.get(d);
      if (!entry) continue;
      const p = toScene(this.latOf(d), this.lngOf(d), this.altOf(d));
      // On the side facing the camera: the point and the camera are on the same side of its tangent plane.
      const visible = p.dot(cam) > RADIUS * RADIUS;
      if (visible !== entry.visible) {
        entry.visible = visible;
        this.visibility(entry.el, visible);
      }
      const s = this.project(p);
      entry.el.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) translate(-50%, -50%)`;
    }
  }

  private project(p: Vector3) {
    const v = p.clone().project(this._camera);
    return { x: ((v.x + 1) / 2) * this.w, y: ((1 - v.y) / 2) * this.h };
  }

  // ---- Queries and actions.
  renderer() {
    return this._renderer;
  }
  scene() {
    return this._scene;
  }
  camera() {
    return this._camera;
  }
  controls() {
    return this._controls;
  }
  getScreenCoords(lat: number, lng: number, altitude = 0) {
    return this.project(toScene(lat, lng, altitude));
  }
  pointOfView(): Pov;
  pointOfView(pov: Partial<Pov>, ms?: number): this;
  pointOfView(pov?: Partial<Pov>, ms = 0): Pov | this {
    const now = toPov(this._camera.position);
    if (!pov) return now;
    const to = { lat: pov.lat ?? now.lat, lng: pov.lng ?? now.lng, altitude: pov.altitude ?? now.altitude };
    // The short way round in longitude.
    to.lng = now.lng + ((((to.lng - now.lng) % 360) + 540) % 360) - 180;
    if (ms > 0) this.tween = { from: now, to, t0: performance.now(), ms };
    else {
      this.tween = null;
      this.place(to);
    }
    return this;
  }
  width(w: number) {
    this.w = Math.max(1, w);
    this.resize();
    return this;
  }
  height(h: number) {
    this.h = Math.max(1, h);
    this.resize();
    return this;
  }
  private resize() {
    this._renderer.setSize(this.w, this.h);
    this._camera.aspect = this.w / this.h;
    this._camera.updateProjectionMatrix();
  }
  pauseAnimation() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    return this;
  }
  resumeAnimation() {
    if (this.running) return this;
    this.running = true;
    this.raf = requestAnimationFrame(this.frame);
    return this;
  }
}
