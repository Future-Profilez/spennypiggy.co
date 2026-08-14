/**
 * Generates the iOS `apple-touch-startup-image` set for the Spenny Piggy PWA.
 *
 * Design is FLAT ON PURPOSE — solid blocks, hard edges, no gradients and no
 * blurs. Two reasons: it matches the app's own neo-brutalist language, and a
 * flat PNG at 1290x2796 quantises to ~47 KB where a smooth gradient of the same
 * size is hundreds. These files ship inside the Lambda.
 *
 * Shapes are drawn by rsvg-convert; TEXT is drawn afterwards by ImageMagick
 * with an explicit TTF path. librsvg on macOS does not honour FONTCONFIG_FILE,
 * so `font-family="newfont"` inside the SVG silently falls back to a system
 * sans — do not move the text back into the SVG.
 *
 * The device list is NOT declared here — it is read from App\Support\PwaSplash,
 * which is also what renders the <link> tags. Two lists would drift, and a
 * drifted entry is a device that launches to a blank screen with nothing failing.
 *
 * Needs `rsvg-convert` and `magick` on PATH (brew install librsvg imagemagick).
 * NOT part of `npm run build` — the artwork changes far less often than the app,
 * and a deploy should never depend on two native binaries.
 *
 *   npm run pwa:splash
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync, statSync, rmSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const APP = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(APP, 'resources/proxy/splash');
const TMP = join(tmpdir(), 'spenny-pwa-splash');

const DISPLAY_FONT = join(APP, 'resources/assets/fonts/legacy/newfont.ttf');      // Gulfs Display
const BODY_FONT = join(APP, 'resources/assets/fonts/legacy/CeraGRMedium.ttf');

const PINK = '#FF007F';
const VIOLET = '#8C52FF';
const MINT = '#05EFB8';
const YELLOW = '#E6EA7B';

/**
 * 🚨 Read from App\Support\PwaSplash, never re-declared here. That class also
 * renders the <link> tags, so a second list would drift — and a drifted entry is
 * a device whose media query matches an image that was never generated, which
 * iOS answers by showing nothing at all.
 */
const SIZES = JSON.parse(
    execFileSync('php', [
        '-r',
        "require 'vendor/autoload.php'; echo json_encode(App\\Support\\PwaSplash::LAUNCH_IMAGES);",
    ], { cwd: APP }).toString(),
).map((d) => [d.w * d.dpr, d.h * d.dpr]);

const iconB64 = readFileSync(join(APP, 'resources/proxy/android-chrome-512x512.png')).toString('base64');

const r = (n) => Math.round(n * 100) / 100;

/**
 * 🚨 Sizes are relative to U, not to W. On an iPad (4:3) a W-relative type scale
 * is ~27% too big for the height available, and the wordmark/tagline collide
 * with the violet arc. The vertical stack is anchored to the ICON rather than to
 * H for the same reason — a fixed H fraction cannot hold on both aspect ratios.
 */
function layout(W, H) {
    const U = Math.min(W, H * 0.55);
    const tile = U * 0.40;
    const iconCy = H * 0.36;
    const P = U * 0.15;
    const step = P * 0.92;              // Gulfs sits tight; a full em leaves a gap
    const y1 = iconCy + tile / 2 + U * 0.10;
    const y2 = y1 + step;
    const y3 = y2 + step + U * 0.05;
    const arcTop = Math.max(H * 0.70, y3 + U * 0.11);

    return { U, tile, iconCy, P, step, y1, y2, y3, arcTop };
}

function svg(W, H) {
    const { U, tile, iconCy, arcTop } = layout(W, H);
    const arcR = W * 1.4;
    const arcCy = arcTop + arcR;
    const stroke = Math.max(2, U * 0.0085);

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${PINK}"/>
  <circle cx="${r(W * 0.02)}" cy="${r(H * 0.055)}" r="${r(U * 0.30)}" fill="${MINT}" stroke="#000" stroke-width="${r(stroke)}"/>
  <circle cx="${r(W * 0.90)}" cy="${r(H * 0.175)}" r="${r(U * 0.085)}" fill="${YELLOW}" stroke="#000" stroke-width="${r(stroke)}"/>
  <circle cx="${r(W / 2)}" cy="${r(arcCy)}" r="${r(arcR)}" fill="${VIOLET}" stroke="#000" stroke-width="${r(stroke)}"/>
  <circle cx="${r(W * 0.155)}" cy="${r(arcTop + (H - arcTop) * 0.60)}" r="${r(U * 0.05)}" fill="${MINT}" stroke="#000" stroke-width="${r(stroke)}"/>
  <circle cx="${r(W * 0.85)}" cy="${r(arcTop + (H - arcTop) * 0.85)}" r="${r(U * 0.03)}" fill="${PINK}" stroke="#000" stroke-width="${r(stroke)}"/>
  <image x="${r((W - tile) / 2)}" y="${r(iconCy - tile / 2)}" width="${r(tile)}" height="${r(tile)}"
         xlink:href="data:image/png;base64,${iconB64}"/>
</svg>`;
}

function textArgs(W, H) {
    const { U, P, y1, y2, y3, arcTop } = layout(W, H);
    const dotR = U * 0.014;
    const dotY = arcTop + (H - arcTop) * 0.30;
    const gap = U * 0.055;

    return [
        '-gravity', 'north',
        '-fill', 'black',
        '-font', DISPLAY_FONT, '-pointsize', String(r(P)), '-kerning', String(r(U * 0.004)),
        '-annotate', `+0+${r(y1)}`, 'SPENNY',
        '-annotate', `+0+${r(y2)}`, 'PIGGY',
        '-font', BODY_FONT, '-pointsize', String(r(U * 0.030)), '-kerning', String(r(U * 0.008)),
        '-fill', 'rgba(0,0,0,0.72)',
        '-annotate', `+0+${r(y3)}`, 'EXCLUSIVE CONTENT · MEMBERSHIPS',
        // Three quiet dots on the violet field — the only hint of "loading".
        '-gravity', 'northwest', '-stroke', 'none',
        '-fill', 'rgba(0,0,0,1)',
        '-draw', `circle ${r(W / 2 - gap)},${r(dotY)} ${r(W / 2 - gap)},${r(dotY - dotR)}`,
        '-fill', 'rgba(0,0,0,0.55)',
        '-draw', `circle ${r(W / 2)},${r(dotY)} ${r(W / 2)},${r(dotY - dotR)}`,
        '-fill', 'rgba(0,0,0,0.3)',
        '-draw', `circle ${r(W / 2 + gap)},${r(dotY)} ${r(W / 2 + gap)},${r(dotY - dotR)}`,
    ];
}

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const f of readdirSync(OUT)) rmSync(join(OUT, f));

let total = 0;
for (const [W, H] of SIZES) {
    const name = `${W}x${H}`;
    const svgPath = join(TMP, `${name}.svg`);
    const pngPath = join(OUT, `${name}.png`);
    writeFileSync(svgPath, svg(W, H));
    execFileSync('rsvg-convert', ['-w', String(W), '-h', String(H), '-o', pngPath, svgPath]);
    execFileSync('magick', [
        pngPath,
        ...textArgs(W, H),
        '-strip', '-colors', '64', '-define', 'png:compression-level=9',
        pngPath,
    ]);
    const kb = statSync(pngPath).size / 1024;
    total += kb;
    console.log(`${name.padEnd(12)} ${kb.toFixed(1)} KB`);
}
console.log(`\n${SIZES.length} files, ${(total / 1024).toFixed(2)} MB total`);
