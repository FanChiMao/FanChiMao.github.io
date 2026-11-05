/**
 * Gallery photo pipeline.
 *
 *   npm run photos                  Strip GPS (losslessly) from every photo in src/assets/gallery/<album>/,
 *                                   then add new photos, with their date and camera settings, to
 *                                   src/content/albums/<album>.json. Hand-written captions are never touched.
 *   npm run photos -- --refresh     Also rewrite date/EXIF of photos already listed.
 *   npm run photos:check            Fail if any image under src/assets or public still carries GPS.
 *                                   Runs automatically before every build (and therefore in CI).
 *
 * Why before commit and not at build time: the repo is public and Astro also serves the original
 * files, so a location has to be gone before the photo ever reaches git.
 *
 * "Lossless" means only metadata segments are rewritten; the compressed image data is copied
 * byte for byte, so there is no re-encoding and no quality loss.
 */
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import exifr from 'exifr';
import piexif from 'piexifjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GALLERY = join(root, 'src/assets/gallery');
const ALBUMS = join(root, 'src/content/albums');
const IMAGE = /\.(jpe?g|png|webp|avif|tiff?|heic|heif)$/i;
const JPEG = /\.jpe?g$/i;
/** GPS in EXIF, XMP (exif:GPSLatitude) or vendor XMP such as DJI drones (drone-dji:GpsLatitude). */
const GPS_TEXT = /GPS ?(?:Latitude|Longitude)|Gps(?:Latitude|Longitude)/i;

const args = new Set(process.argv.slice(2));
const CHECK = args.has('--check');
const REFRESH = args.has('--refresh');

const rel = (p) => relative(root, p).replaceAll('\\', '/');
const walk = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        return statSync(p).isDirectory() ? walk(p) : IMAGE.test(f) ? [p] : [];
      })
    : [];

// ---------------------------------------------------------------- GPS detection

/** Metadata segments of a JPEG (everything before the image data), as one latin1 string. */
function jpegMetadataText(buf) {
  let out = '';
  for (const seg of jpegSegments(buf).segments) out += buf.toString('latin1', seg.start, seg.end);
  return out;
}

/** `input` is a path, or a JPEG buffer. */
async function hasGps(input) {
  const buf = Buffer.isBuffer(input) ? input : readFileSync(input);
  const isJpeg = Buffer.isBuffer(input) || JPEG.test(input);
  let gps;
  try {
    gps = await exifr.gps(buf);
  } catch {
    gps = undefined;
  }
  if (gps && (Number.isFinite(gps.latitude) || Number.isFinite(gps.longitude))) return true;
  // XMP / vendor tags exifr.gps() does not look at. For JPEGs only the metadata segments are
  // searched, so compressed image bytes can never cause a false positive.
  const text = isJpeg ? jpegMetadataText(buf) : buf.toString('latin1');
  return GPS_TEXT.test(text);
}

// ---------------------------------------------------------------- lossless JPEG GPS removal

/** Split a JPEG into its marker segments (up to SOS) and the untouched rest. */
function jpegSegments(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG');
  const segments = [];
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) throw new Error(`bad marker at ${i}`);
    const marker = buf[i + 1];
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end of image: the rest is image data
    const len = buf.readUInt16BE(i + 2);
    segments.push({ marker, start: i, end: i + 2 + len });
    i += 2 + len;
  }
  return { segments, rest: i };
}


/** Returns a new buffer without GPS, or null if there was nothing to remove. */
function stripJpegGps(buf) {
  let bin = buf.toString('binary');
  let changed = false;

  // 1. EXIF: drop the GPS IFD and its pointer, keep everything else.
  if (bin.includes('Exif\0\0')) {
    let exif;
    try {
      exif = piexif.load(bin);
    } catch {
      exif = null;
    }
    if (exif && exif.GPS && Object.keys(exif.GPS).length > 0) {
      exif.GPS = {};
      delete exif['0th'][piexif.ImageIFD.GPSTag];
      try {
        bin = piexif.insert(piexif.dump(exif), bin);
      } catch {
        // Some maker notes cannot be re-serialised; then drop EXIF entirely (date/camera were read already).
        bin = piexif.remove(bin);
      }
      changed = true;
    }
  }

  // 2. XMP (and any other APP segment) that mentions GPS: drop the whole segment.
  let out = Buffer.from(bin, 'binary');
  const { segments, rest } = jpegSegments(out);
  const keep = segments.filter((s) => {
    const isApp = s.marker >= 0xe0 && s.marker <= 0xef;
    const text = out.toString('latin1', s.start + 4, s.end);
    const drop = isApp && GPS_TEXT.test(text);
    if (drop) changed = true;
    return !drop;
  });
  if (!changed) return null;
  out = Buffer.concat([out.subarray(0, 2), ...keep.map((s) => out.subarray(s.start, s.end)), out.subarray(rest)]);
  return out;
}

// ---------------------------------------------------------------- EXIF for the lightbox

const pad = (n) => String(n).padStart(2, '0');
const round = (n, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

function shutter(t) {
  if (!Number.isFinite(t) || t <= 0) return undefined;
  return t >= 1 ? `${round(t)}s` : `1/${Math.round(1 / t)}s`;
}

async function readShot(file) {
  let d;
  try {
    d = await exifr.parse(readFileSync(file), { tiff: true, exif: true, gps: false, xmp: false, icc: false, iptc: false });
  } catch {
    d = null;
  }
  if (!d) return {};
  const make = d.Make?.trim();
  const model = d.Model?.trim();
  const camera = model ? (make && !model.toLowerCase().startsWith(make.toLowerCase().split(' ')[0]) ? `${make} ${model}` : model) : make;
  const exif = {
    camera,
    lens: d.LensModel?.trim() || undefined,
    focalLength: Number.isFinite(d.FocalLength) ? round(d.FocalLength) : undefined,
    aperture: Number.isFinite(d.FNumber) ? round(d.FNumber) : undefined,
    shutter: shutter(d.ExposureTime),
    iso: Number.isFinite(d.ISO) ? d.ISO : undefined,
  };
  for (const k of Object.keys(exif)) if (exif[k] === undefined || exif[k] === '') delete exif[k];
  const when = d.DateTimeOriginal ?? d.CreateDate;
  // exifr returns camera-local time as a local Date; format the wall-clock date, not UTC.
  const taken = when instanceof Date && !Number.isNaN(+when) ? `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}` : undefined;
  return { ...(taken ? { taken } : {}), ...(Object.keys(exif).length ? { exif } : {}) };
}

// ---------------------------------------------------------------- album JSON

function newAlbum(id, cover) {
  return {
    order: 99,
    emoji: '📷',
    categories: ['everyday'],
    // Hidden until the title and categories below are filled in.
    draft: true,
    title: { en: id, 'zh-tw': id, 'zh-cn': id, ja: id },
    cover,
    photos: [],
  };
}

// ---------------------------------------------------------------- main

async function check() {
  const files = [...walk(join(root, 'src/assets')), ...walk(join(root, 'public'))];
  const bad = [];
  for (const f of files) if (await hasGps(f)) bad.push(rel(f));
  if (bad.length) {
    console.error(`\n✖ ${bad.length} image(s) still contain GPS location data:\n${bad.map((b) => `  - ${b}`).join('\n')}`);
    console.error('\nRun `npm run photos` to strip it (gallery JPEGs), or remove the location before committing.\n');
    process.exit(1);
  }
  console.log(`✔ photos: no GPS data in ${files.length} images`);
}

async function sync() {
  const albums = existsSync(GALLERY) ? readdirSync(GALLERY).filter((d) => statSync(join(GALLERY, d)).isDirectory()) : [];
  let stripped = 0;
  let added = 0;
  const problems = [];

  for (const id of albums) {
    const dir = join(GALLERY, id);
    const files = readdirSync(dir)
      .filter((f) => IMAGE.test(f))
      .sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
    if (files.length === 0) continue;

    const jsonPath = join(ALBUMS, `${id}.json`);
    const existed = existsSync(jsonPath);
    const album = existed ? JSON.parse(readFileSync(jsonPath, 'utf8')) : newAlbum(id, `gallery/${id}/${files[0]}`);
    const before = JSON.stringify(album);
    const bySrc = new Map(album.photos.map((p) => [p.src, p]));

    for (const f of files) {
      const file = join(dir, f);
      const src = `gallery/${id}/${f}`;

      // Read date/camera first: GPS removal may have to drop EXIF entirely for odd files.
      const shot = await readShot(file);

      if (await hasGps(file)) {
        if (!JPEG.test(f)) {
          problems.push(`${rel(file)}: has GPS but is not a JPEG; remove the location in your photo app and re-export`);
          continue;
        }
        const clean = stripJpegGps(readFileSync(file));
        if (!clean || (await hasGps(clean))) {
          problems.push(`${rel(file)}: could not remove GPS automatically`);
          continue;
        }
        writeFileSync(file, clean);
        stripped++;
        console.log(`  stripped GPS  ${rel(file)}`);
      }

      const entry = bySrc.get(src);
      if (!entry) {
        album.photos.push({ src, caption: [], ...shot });
        added++;
        console.log(`  added         ${src}${shot.taken ? `  (${shot.taken})` : ''}`);
      } else if (REFRESH || (entry.taken === undefined && entry.exif === undefined)) {
        // Only date/EXIF are machine-owned; caption, title, description and link stay as written.
        delete entry.taken;
        delete entry.exif;
        Object.assign(entry, shot);
      }
    }

    for (const p of album.photos) {
      if (!existsSync(join(root, 'src/assets', p.src))) problems.push(`${rel(jsonPath)}: ${p.src} is listed but the file is missing`);
    }

    if (JSON.stringify(album) !== before || !existed) {
      writeFileSync(jsonPath, `${JSON.stringify(album, null, 2)}\n`);
      console.log(`${existed ? 'updated' : 'created'}   ${rel(jsonPath)}${existed ? '' : '  (draft: fill in title, emoji and categories)'}`);
    }
  }

  console.log(`\nphotos: ${added} added, ${stripped} GPS removed`);
  if (problems.length) {
    console.error(`\n✖ needs attention:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
    process.exit(1);
  }
  await check();
}

if (CHECK) await check();
else await sync();

