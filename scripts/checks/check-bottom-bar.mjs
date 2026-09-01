#!/usr/bin/env node
/**
 * 🚨 NOTHING SITS UNDER THE BOTTOM BAR (client direction, 31 Aug 2026).
 *
 * The phone's tab bar is `position: fixed; z-index: 999999` and the Intercom
 * launcher is higher still. Any element pinned to the foot of the screen with
 * `fixed … bottom-0` / `sticky bottom-0` — or a full-screen `fixed inset-0`
 * panel — lands UNDER one of them on every signed-in phone, and the thing at
 * the foot of a panel is nearly always its button. Found live three times in
 * one day: the creator-plan "Start" bar, the bio preview's swatch strip, and a
 * help sheet. Nothing errors; the button is simply not there.
 *
 * An element passes when its OPENING TAG (className + style) carries one of
 * the house devices, or a `bottom-bar-safe:` note with a reason sits within
 * the eight lines above it or inside the opening tag:
 *   · `--sp-bottombar-h` / `--sp-bottombar-inset` — offset by the bar's ONE
 *     definition of its height (shop/Item.jsx's buy bar is the reference)
 *   · `retro-bottom-bar` in a `[body:has(.retro-bottom-bar)_&]:` variant
 *   · `bottom-bar-safe: <reason>` — e.g. "inside Popup, which sets
 *     body.sheet-open and hides the bar", "guest-only page, no layout mounts
 *     the bar", "dead component"
 *
 * A note is REQUIRED to carry a reason. "bottom-bar-safe" on its own is the
 * allowlist rotting the way every allowlist does.
 *
 *   node scripts/checks/check-bottom-bar.mjs .
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const SCAN = ['resources/js'];

const PINNED =
    /(^|\s)(fixed|sticky)(\s|$)/;
const AT_FOOT = /(^|\s)(bottom-0|inset-0)(\s|$)/;
// A decorative overlay nobody can tap cannot hide a control.
const INERT = /(^|\s)pointer-events-none(\s|$)/;
const SAFE_DEVICE = /--sp-bottombar-(h|inset)|retro-bottom-bar/;
const SAFE_NOTE = /bottom-bar-safe:\s*\S/;

function walk(dir, out = []) {
    for (const name of readdirSync(dir)) {
        const p = join(dir, name);
        const st = statSync(p);
        if (st.isDirectory()) walk(p, out);
        else if (/\.jsx?$/.test(name)) out.push(p);
    }
    return out;
}

function blankComments(src) {
    // Keep line count; drop /* */ and // bodies so prose never matches.
    return src
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
        .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
}

/** The opening tag that contains `idx`: from the last `<` before it to the
 *  first `>` after it that is outside every {…} / (…) / string. Approximate,
 *  and enough for a className attribute. */
function openingTag(src, idx) {
    const start = src.lastIndexOf('<', idx);
    let depth = 0, quote = null;
    for (let i = idx; i < src.length; i++) {
        const c = src[i];
        if (quote) { if (c === quote && src[i - 1] !== '\\') quote = null; continue; }
        if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
        if (c === '{' || c === '(') depth++;
        else if (c === '}' || c === ')') depth--;
        else if (c === '>' && depth <= 0) return { start, end: i + 1, text: src.slice(start, i + 1) };
    }
    return { start, end: src.length, text: src.slice(start) };
}

const findings = [];

for (const base of SCAN) {
    for (const file of walk(join(root, base))) {
        const raw = readFileSync(file, 'utf8');
        const src = blankComments(raw);
        const rel = relative(root, file);

        const re = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{`([^`]*)`\}|\{\[([\s\S]*?)\]\.join\(\s*['"] ['"]\s*\)\})/g;
        for (const m of src.matchAll(re)) {
            const classes = (m[1] ?? m[2] ?? m[3] ?? m[4] ?? '').replace(/\s+/g, ' ');
            if (!PINNED.test(classes) || !AT_FOOT.test(classes) || INERT.test(classes)) continue;

            const tag = openingTag(src, m.index);
            if (SAFE_DEVICE.test(tag.text)) continue;

            const line = src.slice(0, tag.start).split('\n').length;
            const above = raw.split('\n').slice(Math.max(0, line - 9), line - 1).join('\n');
            // The note may sit above the element or inside its opening tag (a
            // `// bottom-bar-safe:` line between the attributes).
            if (SAFE_NOTE.test(above) || SAFE_NOTE.test(raw.slice(tag.start, tag.end))) continue;

            findings.push(`${rel}:${line}  ${classes.match(/(fixed|sticky)[^"]*?(bottom-0|inset-0)/)?.[0] ?? classes.slice(0, 60)}`);
        }
    }
}

if (findings.length) {
    console.log(`✗ ${findings.length} element(s) pinned to the foot of the screen with no bottom-bar device\n`);
    findings.forEach((f) => console.log('  ' + f));
    console.log('\n  Offset it by --sp-bottombar-h (see shop/Item.jsx), put it in the flow, or add a `bottom-bar-safe: <reason>` note above it.');
    process.exit(1);
}

console.log('✓ nothing sits under the bottom bar');
