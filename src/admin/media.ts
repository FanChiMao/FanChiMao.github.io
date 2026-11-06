/**
 * Prepares files in the browser before they go to GitHub, so nothing private or oversized
 * is ever uploaded:
 *  - photos: re-drawn on a canvas (long side <= 2400 px, JPEG). Re-drawing drops every bit of
 *    EXIF, including GPS.
 *  - clips: always re-encoded to H.264 MP4 (short side <= 720 px) with mediabunny / WebCodecs,
 *    with metadata tags cleared, so location atoms and huge phone bitrates are gone. If the
 *    result is still too big, it tries again at a lower quality.
 */
import { ALL_FORMATS, BlobSource, BufferTarget, Conversion, Input, Mp4OutputFormat, Output, Quality, canEncode } from 'mediabunny';

export const MAX_VIDEO_BYTES = 40 * 1024 * 1024; // what we upload; the API accepts ~50 MB
const PHOTO_LONG_SIDE = 2400;
const VIDEO_SHORT_SIDE = 720;

const canvasBlob = (canvas: HTMLCanvasElement, quality = 0.86) =>
  new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('無法輸出 JPEG'))), 'image/jpeg', quality));

/** Photo -> JPEG without metadata, long side at most 2400 px (orientation applied). */
export async function preparePhoto(file: Blob): Promise<Blob> {
  let bmp: ImageBitmap;
  try {
    bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new Error('瀏覽器無法讀取這張圖（HEIC 請先在手機轉成 JPEG，或設定「相機 → 格式 → 最相容」）');
  }
  const scale = Math.min(1, PHOTO_LONG_SIDE / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close();
  return canvasBlob(canvas);
}

const even = (n: number) => Math.max(2, Math.round(n / 2) * 2);

/** Clip -> small H.264 MP4 without metadata. `keepAudio` false for silent looping clips. */
export async function prepareVideo(file: Blob, keepAudio: boolean, onProgress: (p: number, pass: number) => void): Promise<Blob> {
  if (typeof VideoEncoder === 'undefined' || !(await canEncode('avc'))) throw new Error('這個瀏覽器不支援影片編碼，請改用新版 Chrome / Edge / Safari');
  const qualities = [new Quality('medium'), new Quality('low'), new Quality('very-low')];
  for (let pass = 0; pass < qualities.length; pass++) {
    const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });
    const track = await input.getPrimaryVideoTrack();
    if (!track) throw new Error('檔案裡沒有影片軌');
    const cantDecode = async () => {
      const hevc = track.codec === 'hevc';
      const hdr = await track.hasHighDynamicRange().catch(() => false);
      const kind = `${hevc ? 'HEVC（iPhone「高效率」格式）' : (track.codec ?? '未知格式')}${hdr ? '、HDR' : ''}`;
      return new Error(
        `這支影片是 ${kind}，這個瀏覽器解不開。` +
          (hevc ? '請改用 iPhone 或 Mac 的 Safari 打開 admin 頁面上傳（直接支援）；之後拍的影片可在 iPhone「設定 → 相機 → 格式」選「最相容」避免這個問題。' : '請先用手機或剪輯軟體轉成 H.264 MP4 再上傳。'),
      );
    };
    if (!(await track.canDecode())) throw await cantDecode();
    const w = track.displayWidth;
    const h = track.displayHeight;
    const scale = Math.min(1, VIDEO_SHORT_SIDE / Math.min(w, h));
    const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target: new BufferTarget() });
    const conversion = await Conversion.init({
      input,
      output,
      video: { width: even(w * scale), height: even(h * scale), fit: 'fill', codec: 'avc', quality: qualities[pass], forceTranscode: true, allowTransformationMetadata: false },
      audio: keepAudio ? { codec: 'aac', quality: new Quality('low') } : { discard: true },
      tags: {}, // drop every metadata tag (location, device, ...)
      showWarnings: false,
    });
    if (!conversion.isValid) throw new Error(`無法轉檔：${conversion.discardedTracks.map((t) => t.reason).join(', ')}`);
    conversion.onProgress = (p) => onProgress(p, pass);
    try {
      await conversion.execute();
    } catch (e) {
      // canDecode() only checks the codec string; some files (10-bit HDR, Dolby Vision) still fail here.
      if (/decod/i.test(String((e as Error)?.message ?? e))) throw await cantDecode();
      throw e;
    }
    const blob = new Blob([output.target.buffer!], { type: 'video/mp4' });
    if (blob.size <= MAX_VIDEO_BYTES) return blob;
  }
  throw new Error('壓縮後仍超過 40 MB，請先把影片剪短再上傳（或改用 YouTube）');
}

/** First frame worth showing (at ~0.5 s) of a clip, as a JPEG poster. */
export async function posterOf(video: Blob): Promise<Blob> {
  const url = URL.createObjectURL(video);
  try {
    const el = document.createElement('video');
    el.muted = true;
    el.playsInline = true;
    el.preload = 'auto';
    el.src = url;
    await new Promise<void>((ok, fail) => {
      el.onloadeddata = () => ok();
      el.onerror = () => fail(new Error('無法讀取影片畫面'));
    });
    el.currentTime = Math.min(0.5, (el.duration || 1) / 2);
    await new Promise<void>((ok) => (el.onseeked = () => ok()));
    const canvas = document.createElement('canvas');
    canvas.width = el.videoWidth;
    canvas.height = el.videoHeight;
    canvas.getContext('2d')!.drawImage(el, 0, 0);
    return canvasBlob(canvas, 0.82);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export type Shot = { taken?: string; exif?: { camera?: string; lens?: string; focalLength?: number; aperture?: number; shutter?: string; iso?: number } };

/**
 * Shooting date and camera settings of a photo, read before it is re-drawn (which drops EXIF).
 * Same fields and rules as readShot() in scripts/photos.mjs, so admin uploads match `npm run photos`.
 */
export async function shotOf(file: Blob): Promise<Shot> {
  let d: Record<string, any> | undefined;
  try {
    const exifr = (await import('exifr')).default;
    d = await exifr.parse(file, { tiff: true, exif: true, gps: false, xmp: false, icc: false, iptc: false });
  } catch {
    d = undefined;
  }
  if (!d) return {};
  const round = (n: number) => Math.round(n * 10) / 10;
  const make = d.Make?.trim();
  const model = d.Model?.trim();
  const camera = model ? (make && !model.toLowerCase().startsWith(make.toLowerCase().split(' ')[0]) ? `${make} ${model}` : model) : make;
  const t = d.ExposureTime;
  const shutter = Number.isFinite(t) && t > 0 ? (t >= 1 ? `${round(t)}s` : `1/${Math.round(1 / t)}s`) : undefined;
  const exif: NonNullable<Shot['exif']> = {
    camera: camera || undefined,
    lens: d.LensModel?.trim() || undefined,
    focalLength: Number.isFinite(d.FocalLength) ? round(d.FocalLength) : undefined,
    aperture: Number.isFinite(d.FNumber) ? round(d.FNumber) : undefined,
    shutter,
    iso: Number.isFinite(d.ISO) ? d.ISO : undefined,
  };
  for (const k of Object.keys(exif) as (keyof typeof exif)[]) if (exif[k] === undefined || exif[k] === '') delete exif[k];
  const when = d.DateTimeOriginal ?? d.CreateDate;
  const pad = (n: number) => String(n).padStart(2, '0');
  const taken = when instanceof Date && !Number.isNaN(+when) ? `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}` : undefined;
  return { ...(taken ? { taken } : {}), ...(Object.keys(exif).length ? { exif } : {}) };
}

/** Base64 text of a blob (what POST /api/admin/blob takes). */
export async function base64Of(blob: Blob): Promise<string> {
  const url = await new Promise<string>((ok, fail) => {
    const r = new FileReader();
    r.onload = () => ok(String(r.result));
    r.onerror = () => fail(r.error);
    r.readAsDataURL(blob);
  });
  return url.slice(url.indexOf(',') + 1);
}

export const formatBytes = (n: number) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
