#!/usr/bin/env node
/**
 * 🚨 NOTHING ON THIS SITE CASTS A SHADOW (client direction, 14 Aug 2026).
 *
 * A frame is a LINE — `border-[3px] border-black` for a container, `border-2`
 * for a control — and depth is carried by border weight, border colour and
 * space. ~850 elements, 65 CSS declarations and the whole `boxShadow` scale were
 * removed in one pass; without this check they come back one screen at a time,
 * because "a bit of depth here" is always a local decision that looks fine on
 * its own page and wrong beside the next one.
 *
 * What is allowed, and why:
 *   · `ring-*`         compiles to a box-shadow but RENDERS as a line
 *   · `drop-shadow-*`  a filter on the glyph or image itself — the Pride page's
 *                      neon glow is an effect, not a frame
 *   · `text-shadow`    typography (`.shadow-yellow` is a letterform treatment)
 *   · e-mail templates — a mail client has no Tailwind and no border support
 *                      worth relying on; those are inline styles for a different
 *                      medium entirely
 *
 *   node scripts/checks/check-no-shadows.mjs .
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? process.cwd();

const SCAN = [
    'resources/js',
    'resources/css',
    'resources/views',
    'public/offline.html',
];

// `resources/views/email` is exempt — see the header.
const EXEMPT = [
    /resources[\\/]views[\\/]email[\\/]/,
    // Signature markup is pasted into a mail client — same medium, same exemption.
    /resources[\\/]views[\\/]brand[\\/]signatures[\\/]/,
];

/*
 * ⚠️ A modifier is REQUIRED. A bare `shadow` is the English word far more often
 * than it is Tailwind's default shadow utility, and this file is surrounded by
 * comments explaining why the shadows went — matching those made the check
 * unreadable. The trailing `/[0-9.]+` matters too: `shadow-red-200/50` is how
 * eight of them survived every earlier sweep, because a word boundary does not
 * fall on a slash.
 */
const CLASS_TOKEN =
    /(^|[\s"'`{])(!?(?:[a-z-]+:)*shadow-[a-z0-9[\]#_.%()-]+(?:\/[0-9.]+)?)(?=[\s"'`}]|$)/g;
const CSS_DECL = /(^|[\s;{])box-shadow\s*:/g;

/*
 * 🚨 A JS STYLE OBJECT WAS A BLIND SPOT, AND 36 SHADOWS LIVED IN IT.
 *
 * `style={{ boxShadow: … }}` is neither a class token nor a CSS declaration, and
 * the CSS check above only ever ran on `.css`, `.blade.php` and `.html` — so
 * every inline shadow in a component passed this check while the header of this
 * very file said nothing casts one. Found 21 Aug 2026: glows on the Purchase
 * Hub, a diffuse shadow on Profile/Edit, a hard offset on the register review
 * step. This is the fourth place a style hides, and the root CLAUDE.md already
 * warned that a className sweep only reaches the first.
 *
 * ⚠️ A RING IS ALLOWED, exactly as `ring-*` is: `0 0 0 1px` and
 * `inset 0 0 0 1px` have no offset and no blur, so they RENDER AS A LINE, which
 * is what the direction asks for. Anything with an offset or a blur is a shadow.
 *
 * ⚠️ Single-line values only. A `boxShadow` broken across lines is not matched
 * here; the check is deliberately simple and its blind spot is a smaller one
 * than the hole it closes.
 */
const JS_SHADOW = /boxShadow\s*:\s*(`[^`]*`|'[^']*'|"[^"]*"|[^,}\n]+)/g;

/** `0 0 0 1px …` / `inset 0 0 0 1px …` draw a line, not a shadow. */
const RING_ONLY = /^\s*(?:inset\s+)?0\s+0\s+0\s+[\d.]+(?:px|rem|em)?\b/;

function walk(path, out = []) {
    let s;
    try {
        s = statSync(path);
    } catch {
        return out;
    }
    if (s.isFile()) {
        out.push(path);
        return out;
    }
    for (const e of readdirSync(path)) {
        const p = join(path, e);
        if (p.includes('node_modules') || p.includes('/build/')) continue;
        walk(p, out);
    }
    return out;
}

const findings = [];

for (const target of SCAN) {
    for (const file of walk(join(root, target))) {
        if (!/\.(jsx?|css|blade\.php|html)$/.test(file)) continue;
        const rel = relative(root, file);
        if (EXEMPT.some((r) => r.test(rel))) continue;

        const src = readFileSync(file, 'utf8');
        if (!/shadow/i.test(src)) continue;

        src.split('\n').forEach((line, i) => {
            const trimmed = line.trim();
            // Prose explaining why the shadows went is not a shadow.
            if (/^(\/\/|\*|\/\*)/.test(trimmed)) return;
            const bare = line
                .replace(/drop-shadow-[a-z0-9[\]#_./%()-]+/g, '')
                .replace(/text-shadow\s*:[^;]*/g, '');

            for (const m of bare.matchAll(CLASS_TOKEN)) {
                findings.push(`${rel}:${i + 1}  ${m[2]}`);
            }
            if (/\.css$/.test(file) || /\.(blade\.php|html)$/.test(file)) {
                for (const _ of bare.matchAll(CSS_DECL)) {
                    findings.push(`${rel}:${i + 1}  box-shadow declaration`);
                }
            }

            if (/\.jsx?$/.test(file)) {
                for (const m of bare.matchAll(JS_SHADOW)) {
                    const value = m[1].replace(/^[`'"]|[`'"]$/g, '').trim();

                    // An explicit "none" is a removal, not a shadow.
                    if (/^none$/i.test(value)) continue;

                    // A ring renders as a line — same allowance as `ring-*`.
                    if (RING_ONLY.test(value)) continue;

                    findings.push(
                        `${rel}:${i + 1}  inline boxShadow: ${value.slice(0, 46)}`
                    );
                }
            }
        });
    }
}

if (findings.length) {
    console.log(`✗ ${findings.length} shadow(s) found — use a border instead\n`);
    findings.slice(0, 40).forEach((f) => console.log('  ' + f));
    if (findings.length > 40) console.log(`  …and ${findings.length - 40} more`);
    process.exit(1);
}

console.log('✓ no element casts a shadow');
