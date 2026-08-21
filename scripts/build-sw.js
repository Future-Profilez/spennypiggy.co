import { injectManifest } from 'workbox-build';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🚨 THE SERVICE WORKER IS SERVED BY A ROUTE, NOT FROM `public/`.
//
// `routes/web.php` answers `GET /service-worker.js` by reading
// `resources/proxy/service-worker.js` — and `MagicBellNotification.jsx` registers
// exactly that path. Nothing serves `public/service-worker.js`: a file under
// `public/` is not reachable on the app domain (only `public/build/**` is).
//
// This script used to write there, so the workbox worker it built was NEVER
// DEPLOYED. What production served instead was the MagicBell client library
// bundle sitting at the route's path — a file with no `push` listener, no
// `notificationclick` and no caching, which is why pushes silently displayed
// nothing and why a stale hashed chunk had no cache to fall back on.
const SW_SRC = 'public/sw.js';
const SW_DEST = 'resources/proxy/service-worker.js';
const PUSH_SRC = 'resources/proxy/sw-push.js';

// 🚨 EVERY PRECACHED URL MUST ACTUALLY RESOLVE ON THE APP DOMAIN.
//
// `precacheAndRoute` fetches all of them during `install`, and ONE failure
// rejects the whole install — the worker never activates, so push AND caching
// both stay dead with nothing logged. This list was globbed out of `public/`
// before, which produced `/offline.html`, `/siteicon.png`, `/logo.png` and
// `/Favicon.svg`. Measured against production: all four answer 404.
//
// So the manifest is written by hand from the ROUTES that serve these files, and
// `url` is the address, `file` the source on disk to hash. Verify a new entry
// with `php artisan route:list` before adding it — an unreachable one does not
// degrade, it disables the entire service worker.
//
// ⚠️ `/favicon.ico` is deliberately absent: it answers 302, and a redirected
// response is not a precacheable one.
const PRECACHE = [
  // `offline.html` route, added alongside the service-worker route.
  { url: '/offline.html', file: 'resources/proxy/offline.html' },
  // `192.image.file`
  { url: '/android-chrome-192x192.png', file: 'resources/proxy/android-chrome-192x192.png' },
  // `512.image.file`
  { url: '/android-chrome-512x512.png', file: 'resources/proxy/android-chrome-512x512.png' },
  // `apple.touch.icon.file`
  { url: '/apple-touch-icon.png', file: 'resources/proxy/apple-touch-icon.png' },
  // `32.image.file`
  { url: '/favicon-32x32.png', file: 'resources/proxy/favicon-32x32.png' },
];

function revisionOf(file) {
  return crypto.createHash('md5').update(fs.readFileSync(file)).digest('hex');
}

function buildPrecacheEntries() {
  const entries = [];

  for (const entry of PRECACHE) {
    const abs = path.resolve(__dirname, '..', entry.file);

    // ⚠️ A missing source is reported and SKIPPED, never precached blind. The
    // point of this list is that install cannot fail; adding an entry whose file
    // is not on disk would defeat it at build time instead of at runtime.
    if (!fs.existsSync(abs)) {
      console.warn(`⚠️  Precache source missing, skipping: ${entry.file}`);
      continue;
    }

    entries.push({ url: entry.url, revision: revisionOf(abs) });
  }

  return entries;
}

async function buildServiceWorker() {
  try {
    const additionalManifestEntries = buildPrecacheEntries();

    const { count, size, warnings } = await injectManifest({
      swSrc: SW_SRC,
      swDest: SW_DEST,

      // 🚨 PRECACHE THE APP SHELL ONLY — never `build/**`, and never a glob.
      //
      // Globbing `public/` used to precache 552 files, 449 of them hashed build
      // chunks (399 JS files, 6.4MB). Precaching means the service worker
      // downloads all of it during `install`, in one burst, on the client — and
      // Workbox re-runs that whole install on every deploy because each chunk's
      // filename changed. On an installed iOS PWA that burst lands exactly when
      // the app resumes, and it is the single largest memory event the app
      // produces; iOS jettisons the WKWebView content process under memory
      // pressure and the app comes back blank.
      //
      // It is also pure waste: the app lazy-loads one route's chunks per page,
      // the runtime `static-assets-v1` CacheFirst route already caches each chunk
      // the moment it is genuinely requested, and every chunk is content-hashed
      // so it can be cached for a year on first real use.
      //
      // What belongs here is only what must work with NO network — and only if it
      // is reachable. See `PRECACHE` above.
      globDirectory: 'public/',
      globPatterns: [],
      additionalManifestEntries,

      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB
    });

    if (warnings.length > 0) {
      console.warn('⚠️  Warnings:', warnings);
    }

    // 🚨 The push handlers are PREPENDED, so they are registered before the
    // workbox CDN `importScripts` runs. A failed import aborts evaluation of the
    // whole script, and everything below it is silently never registered — push
    // would die with the caching, on somebody else's outage. See `sw-push.js`.
    const push = fs.readFileSync(path.resolve(__dirname, '..', PUSH_SRC), 'utf8');
    const worker = fs.readFileSync(path.resolve(__dirname, '..', SW_DEST), 'utf8');

    fs.writeFileSync(
      path.resolve(__dirname, '..', SW_DEST),
      `${push}\n${worker}`
    );

    console.log(`✅ ${SW_DEST} — ${count} precached file(s), ${(size / 1024).toFixed(1)} KB`);

    return { count, size };
  } catch (error) {
    console.error('❌ Service Worker build failed:', error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildServiceWorker()
    .then(() => console.log('🎉 Service Worker build completed!'))
    .catch(error => {
      console.error('💥 Build failed:', error);
      process.exit(1);
    });
}

export { buildServiceWorker };
