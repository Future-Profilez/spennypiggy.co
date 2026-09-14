#!/usr/bin/env node
/**
 * 🚨 A FEE PERCENTAGE TYPED INTO A PAGE CANNOT FOLLOW A CONFIG CHANGE.
 *
 * Three creator-facing forms said "Our fee is 19%" — Tasks/Create, Tasks/Edit
 * and Auth/Wishlist. It was true under the legacy markup and became false the
 * moment the platform moved to an all-in supporter rate on 11 Sep 2026. Nothing
 * errored. No test failed. No scanner could see it: a number in JSX is valid
 * text whatever the checkout actually charges, and the only person who finds
 * out is the creator who was quoted one figure and charged another.
 *
 * The client's §3 asks for pricing that moves WITHOUT development work. That is
 * only true if no surface carries its own copy of the number.
 *
 * The legitimate way to render a fee is `resources/js/lib/fees.js`
 * (`feeRateLabel`, `feeRate`, `feeIsAllIn`, `creatorFeeNote`) reading the shared
 * `fees` prop, which `HandleInertiaRequests` fills from
 * `App\Services\Pricing\FeeModel`. One definition, one number, no drift.
 *
 * ── WHAT THIS MATCHES ────────────────────────────────────────────────────────
 *   1. A literal percentage in TEXT that sits in fee context — "our fee is 20%",
 *      "we take 15% commission", "a 12% service charge". The figure and the
 *      word need not be on the same line: JSX wraps prose across lines and
 *      `<strong>20%</strong>` is three lines from "our fee is" in real markup,
 *      so the window is flattened (tags stripped) before it is read.
 *   2. A fee CONSTANT — `const PLATFORM_FEE = 17` — a number the server owns,
 *      declared in the browser bundle where nothing can keep it in step.
 *
 * ── WHAT IT DELIBERATELY DOES NOT MATCH ──────────────────────────────────────
 * False positives are what get a scanner deleted, so every one of these is
 * excluded structurally rather than by an allowlist:
 *   · `className` and `style` values — `w-[22%]`, `left-[15%]`, `h-[calc(100%-2rem)]`
 *   · gradient stops, `calc()`, `translate()`, `rgba()`/`hsl()` — CSS lengths
 *     and colour stops that happen to be written as percentages
 *   · `100%` and `0%` anywhere — "you keep 100% of your listed price" and "0%
 *     commission on your sales" are the CREATOR's side, which did not change
 *     when the supporter rate did. Flagging them would send the author to the
 *     supporter rate and make a correct figure wrong.
 *   · RESERVE rates. `Legal/PaymentsPolicy.jsx` lists 0/10/15/20/30% and those
 *     are correctly literal — a reserve is a risk band, not the advertised fee,
 *     and it comes off the creator's NET rather than the supporter's gross.
 *   · VAT. A tax rate is set by a jurisdiction, not by `config/payments.php`.
 *   · `${…}%` — an interpolated value is the helper doing its job.
 *   · comments. Prose explaining why a figure went is not a figure; the bodies
 *     are blanked before anything is read, exactly as the other checks do it.
 *
 * ── THE ESCAPE HATCH ─────────────────────────────────────────────────────────
 *   `fee-literal-ok: <reason>` within the eight lines above the figure (or on
 *   its own line beside it). 🚨 A NOTE WITHOUT A REASON IS THE ALLOWLIST
 *   ROTTING — at least eight characters of reason are required, the same rule
 *   `bottom-bar-safe:` carries. Legitimate reasons look like:
 *     · "a competitor's own published rate, sourced and dated"
 *     · "historic promotion terms — states the rate as it stood, must not
 *        silently rewrite itself"
 *     · "the one client-side mirror of the server's own constant"
 *   ⚠️ Inside a `&& (` or ternary branch the note must be a `//` line, never a
 *   `{/* *\/}` — that is an object literal there and fails the build.
 *
 *   node scripts/checks/check-fee-literals.mjs .
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.argv[2] ?? process.cwd();
const SCAN = ['resources/js'];

/** The word that turns a percentage into a claim about what we charge. */
const FEE_CONTEXT =
    /\b(fee|fees|commission|our cut|we take|platform takes|service charge|all-?in rate)\b/i;

/**
 * Context that makes a literal percentage correct.
 *
 * ⚠️ A reserve is not a fee: it is a share of the creator's NET held back and
 * released, its bands are a published risk table, and it does not move when the
 * supporter rate does. VAT is a tax rate set by a jurisdiction. Neither can be
 * fixed by reading `fees`, so flagging them would be telling the author to do
 * something wrong.
 */
const NOT_A_FEE = /\b(reserve|reserves|reserved|vat|tax|interest)\b/i;

/**
 * A reason is required, and it has to be long enough to be one.
 *
 * ⚠️ `\s*` HERE WAS A BUG IN THIS FILE'S FIRST DRAFT and it is the whole reason
 * the escape is verified red as well as the figures. `\s` matches a newline, so
 * a bare `// fee-literal-ok:` read the NEXT LINE OF CODE as its reason and was
 * silently accepted — the allowlist rotting through the very check written to
 * stop it rotting. The reason must sit on the token's own line.
 */
const ESCAPE = /fee-literal-ok:[ \t]*(\S[^\n]{7,})/;
const ESCAPE_BARE = /fee-literal-ok:/;

/**
 * A named constant holding a fee figure — the server owns that number.
 *
 * ⚠️ The name list is this codebase's own fee vocabulary, not a guess at one.
 * `STRIPE_FEE_RATE` and `DEFAULT_PLATFORM_RATE` are both real declarations in
 * `utils/pricing.js`; a bare `/rate/i` would have swept up `SAMPLE_RATE` and
 * `payRatio` and made the check noise, so the rate half is qualified by the
 * thing being rated.
 */
const FEE_CONST =
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*(?:(?:FEE|Fee|fee|COMMISSION|Commission|commission)[\w$]*|(?:PLATFORM|Platform|platform|COMPLIANCE|Compliance|compliance|SUPPORTER|Supporter|supporter|PROCESSING|Processing|processing|STRIPE|Stripe|stripe)_?(?:RATE|Rate|rate|PCT|Pct|PERCENT[\w$]*|Percent[\w$]*)))\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:[;,\n)]|$)/g;

function walk(dir, out = []) {
    let entries;
    try {
        entries = readdirSync(dir);
    } catch {
        return out;
    }
    for (const name of entries) {
        const p = join(dir, name);
        if (p.includes('node_modules') || p.includes('/build/')) continue;
        const st = statSync(p);
        if (st.isDirectory()) walk(p, out);
        else if (/\.jsx?$/.test(name)) out.push(p);
    }
    return out;
}

const blank = (m) => m.replace(/[^\n]/g, ' ');

/** Comment bodies, keeping the line count so every report names a real line. */
function blankComments(src) {
    return src
        .replace(/\/\*[\s\S]*?\*\//g, blank)
        .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(m.length - p.length));
}

/**
 * The value of an attribute, brace-balanced.
 *
 * `className={`… ${x} …`}` and `style={{ width: "50%" }}` both carry
 * percentages that are lengths, and both are one `{` away from a naive regex.
 */
function blankAttrValue(src, attr) {
    const re = new RegExp(`${attr}\\s*=\\s*`, 'g');
    let out = src;
    for (const m of [...src.matchAll(re)]) {
        let i = m.index + m[0].length;
        const open = out[i];
        let end = -1;

        if (open === '"' || open === "'") {
            end = out.indexOf(open, i + 1);
            if (end !== -1) end += 1;
        } else if (open === '{') {
            let depth = 0,
                quote = null;
            for (let j = i; j < out.length; j++) {
                const c = out[j];
                if (quote) {
                    if (c === quote && out[j - 1] !== '\\') quote = null;
                    continue;
                }
                if (c === '"' || c === "'" || c === '`') {
                    quote = c;
                    continue;
                }
                if (c === '{') depth++;
                else if (c === '}' && --depth === 0) {
                    end = j + 1;
                    break;
                }
            }
        }
        if (end > i) out = out.slice(0, i) + blank(out.slice(i, end)) + out.slice(end);
    }
    return out;
}

/** Blank balanced CSS-function arguments (two passes: nested gradients). */
function stripCssArgs(src) {
    const NAMES =
        /\b(?:linear-gradient|radial-gradient|conic-gradient|calc|clamp|rgba?|hsla?|translate[XYZ3d]*|scale[XYZ3d]*)\s*\(/gi;
    let out = src;
    for (let pass = 0; pass < 2; pass++) {
        let changed = false;
        for (const m of [...out.matchAll(NAMES)]) {
            const start = m.index + m[0].length - 1;
            let depth = 0;
            for (let j = start; j < out.length; j++) {
                if (out[j] === '(') depth++;
                else if (out[j] === ')' && --depth === 0) {
                    const seg = out.slice(start + 1, j);
                    if (/[^\s]/.test(seg)) {
                        out = out.slice(0, start + 1) + blank(seg) + out.slice(j);
                        changed = true;
                    }
                    break;
                }
            }
        }
        if (!changed) break;
    }
    return out;
}

/** Tailwind arbitrary values — `w-[22%]`, `top-[15%]`, `bg-[#fff]`. */
function stripArbitrary(src) {
    return src.replace(/-\[[^\]\n]*\]/g, blank);
}

/** Flatten a JSX window to the prose a reader would actually see. */
function flatten(text) {
    return text
        .replace(/<[^>]*>/g, ' ')
        .replace(/\{["'`]\s*["'`]\}/g, ' ')
        .replace(/[{}]/g, ' ')
        .replace(/\s+/g, ' ');
}

/**
 * A literal percentage.
 *
 * 🚨 `100%` AND `0%` ARE EXCLUDED AT THE SOURCE, and the reason is that flagging
 * them would give the author WRONG advice. "You keep 100% of your listed price"
 * and "0% commission on your sales. Ever." are both statements about the
 * CREATOR's side, and that side did not change when the supporter rate did —
 * the creator has received 100% of the listed price under both fee models, and
 * both apps' rules say so in as many words. `lib/fees.js` carries the SUPPORTER
 * rate, so sending somebody there to replace a correct 0 with a 12 is the one
 * outcome worse than not checking at all.
 *
 * A preceding `$`, `.`, word character or `-` rules out `${x}%` (an
 * interpolation is the helper already doing its job), `3.4` inside a longer
 * number, and `-15%` in a utility.
 */
const PERCENT = /(?<![\w$.\-])(\d{1,3}(?:\.\d+)?)\s*%/g;

const findings = [];

for (const base of SCAN) {
    for (const file of walk(join(root, base))) {
        const raw = readFileSync(file, 'utf8');
        const rel = relative(root, file);
        if (!/%|fee|commission/i.test(raw)) continue;

        let src = blankComments(raw);
        src = blankAttrValue(src, 'className');
        src = blankAttrValue(src, 'class');
        src = blankAttrValue(src, 'style');
        src = stripArbitrary(src);
        src = stripCssArgs(src);

        const lines = src.split('\n');
        const rawLines = raw.split('\n');

        const escaped = (lineNo) => {
            const from = Math.max(0, lineNo - 9);
            const window = rawLines.slice(from, lineNo + 1).join('\n');
            if (!ESCAPE_BARE.test(window)) return false;
            if (ESCAPE.test(window)) return true;
            findings.push(
                `${rel}:${lineNo}  fee-literal-ok with no reason — say WHY this figure is allowed to be literal`
            );
            return true;
        };

        // 1 — a percentage rendered in fee context.
        for (const m of src.matchAll(PERCENT)) {
            if (m[1] === '100' || Number(m[1]) === 0) continue;
            const lineNo = src.slice(0, m.index).split('\n').length;
            const window = flatten(
                lines.slice(Math.max(0, lineNo - 3), lineNo + 2).join('\n')
            );
            if (!FEE_CONTEXT.test(window)) continue;
            if (NOT_A_FEE.test(window)) continue;
            if (escaped(lineNo)) continue;
            findings.push(`${rel}:${lineNo}  "${m[0]}" in fee copy — read it from lib/fees.js`);
        }

        // 2 — a fee figure held in a constant.
        for (const m of src.matchAll(FEE_CONST)) {
            const lineNo = src.slice(0, m.index).split('\n').length;
            if (escaped(lineNo)) continue;
            findings.push(
                `${rel}:${lineNo}  const ${m[1]} = ${m[2]} — the server owns that number`
            );
        }
    }
}

if (findings.length) {
    console.log(`✗ ${findings.length} hardcoded fee figure(s)\n`);
    findings.forEach((f) => console.log('  ' + f));
    console.log(
        '\n  Render it with feeRateLabel()/creatorFeeNote() from resources/js/lib/fees.js,' +
            '\n  or add a `fee-literal-ok: <reason>` note saying why this one may be literal.'
    );
    process.exit(1);
}

console.log('✓ no hardcoded fee figures');
