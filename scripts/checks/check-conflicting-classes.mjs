/*
 * Two Tailwind utilities on the SAME element setting the SAME property under the
 * SAME variant. Whichever wins is decided by the order the classes happen to sit
 * in the generated stylesheet, not by the order they are written in the JSX — so
 * the element renders one way, reads another, and nothing errors.
 *
 * Real instances this found on its first run, all shipped:
 *   - a pink CTA carrying both `text-white` and `text-black`
 *   - a card carrying both `rounded-lg` (16px here) and `rounded-[30px]`
 *   - buttons carrying two different `hover:shadow-*` values
 *
 * Deliberately conservative: it only reports groups where a duplicate is always a
 * mistake, and it ignores the responsive/state variants that are the whole point
 * of Tailwind (`md:p-6` beside `p-4` is correct and is not reported, because the
 * variant is part of the key).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.argv[2] || '.';
const SCAN = ['resources/js'];

/** property group -> does this class token belong to it? */
const GROUPS = [
  ['rounded', (c) => /^rounded(-(none|sm|md|lg|xl|2xl|3xl|4xl|full|box|box-sm|\[[^\]]+\]))?$/.test(c)],
  /*
   * ⚠️ `shadow-md` sets the shadow's SIZE and `shadow-pink-200` sets its COLOUR —
   * they compose, they do not conflict, and treating them as one group reported a
   * dozen correct call sites. Only the box-shadow keys defined in this project's
   * tailwind.config (black / pink / pinks / mint / voilet / violet) plus the stock
   * size scale belong here; anything carrying a numeric colour step or an alpha
   * suffix is a colour.
   */
  ['shadow', (c) =>
    /^shadow(-(sm|md|lg|xl|2xl|none|black|pink|pinks|mint|voilet|violet|\[[^\]]+\]))?$/.test(c) &&
    !/\/\d+$/.test(c)],
  ['line-height', (c) => /^leading-\S+$/.test(c)],
  ['padding-x', (c) => /^px-\S+$/.test(c)],
  ['padding-y', (c) => /^py-\S+$/.test(c)],
  ['padding-all', (c) => /^p-\S+$/.test(c)],
  ['margin-all', (c) => /^m-\S+$/.test(c)],
  ['display', (c) => /^(block|inline-block|inline|flex|inline-flex|grid|inline-grid|hidden)$/.test(c)],
  ['position', (c) => /^(static|fixed|absolute|relative|sticky)$/.test(c)],
  ['text-align', (c) => /^text-(left|center|right|justify)$/.test(c)],
  ['font-size', (c) => /^text-(xs|sm|base|lg|xl|[2-9]xl|\[\d+(\.\d+)?(px|rem|em)\])$/.test(c)],
  ['text-color', (c) =>
    /^text-(black|white|transparent|current|inherit)(\/\d+)?$/.test(c) ||
    /^text-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brandPink|brandYellow|mint|voilet)-\d{2,3}(\/\d+)?$/.test(c) ||
    /^text-\[#[0-9a-fA-F]{3,8}\](\/\d+)?$/.test(c)],
  ['bg-color', (c) =>
    /^bg-(black|white|transparent|current|inherit)(\/\d+)?$/.test(c) ||
    /^bg-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|brandPink|brandYellow|mint|voilet)-\d{2,3}(\/\d+)?$/.test(c) ||
    /^bg-\[(#[0-9a-fA-F]{3,8}|rgb|rgba)[^\]]*\](\/\d+)?$/.test(c)],
];

/** Split "md:hover:px-4" -> { variant: "md:hover", base: "px-4" }. */
function split(token) {
  const bang = token.startsWith('!');
  const t = bang ? token.slice(1) : token;
  // An arbitrary value can contain ':' inside [...], so only split on colons
  // that sit outside brackets.
  let depth = 0, last = 0;
  const parts = [];
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (ch === '[') depth++;
    else if (ch === ']') depth--;
    else if (ch === ':' && depth === 0) { parts.push(t.slice(last, i)); last = i + 1; }
  }
  parts.push(t.slice(last));
  const base = parts.pop();
  return { variant: parts.join(':'), base, important: bang };
}

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    const s = statSync(p);
    if (s.isDirectory()) walk(p);
    else if (/\.jsx?$/.test(entry)) files.push(p);
  }
})(join(ROOT, SCAN[0]));

// className="…" and className={`…`} — only the literal runs; an interpolated
// ${…} is replaced with a space so two halves are never falsely joined.
const CLASS_ATTR = /className\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*`([^`]*)`\s*\}|\{\s*"([^"]*)"\s*\}|\{\s*'([^']*)'\s*\})/g;

const findings = [];

/*
 * Commented-out markup is not shipped markup. Blanking comments (rather than
 * deleting them) keeps every byte offset intact, so the reported line numbers
 * still point at the real source. Same reflex the repo's other scanners need:
 * a commented-out block otherwise reads as a live defect.
 */
function blankComments(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, (s) => ' '.repeat(s.length)) // {/* jsx */}
    .replace(/\/\*[\s\S]*?\*\//g, (s) => s.replace(/[^\n]/g, ' '))       // /* block */
    .replace(/(^|[^:])\/\/[^\n]*/g, (s, p) => p + ' '.repeat(s.length - p.length)); // // line
}

for (const file of files) {
  const src = blankComments(readFileSync(file, 'utf8'));
  let m;
  while ((m = CLASS_ATTR.exec(src)) !== null) {
    const raw = m[1] ?? m[2] ?? m[3] ?? m[4] ?? m[5] ?? '';
    const literal = raw.replace(/\$\{[^}]*\}/g, ' ');
    const tokens = literal.split(/\s+/).filter(Boolean);
    if (tokens.length < 2) continue;

    const seen = new Map(); // "group|variant" -> [tokens]
    for (const token of tokens) {
      const { variant, base, important } = split(token);
      for (const [group, test] of GROUPS) {
        if (!test(base)) continue;
        // `!important` genuinely beats a non-important sibling; that is a
        // deliberate override, not an accidental collision.
        const key = `${group}|${variant}|${important ? 'imp' : 'norm'}`;
        if (!seen.has(key)) seen.set(key, []);
        seen.get(key).push(token);
        break;
      }
    }

    for (const [key, list] of seen) {
      if (list.length < 2) continue;
      const [group, variant] = key.split('|');
      const line = src.slice(0, m.index).split('\n').length;
      findings.push({
        file: relative(ROOT, file),
        line,
        group,
        variant: variant || '(none)',
        classes: list.join(' '),
        // The same class written twice renders correctly; it is copy-paste debris
        // rather than a defect, so it is listed apart and does not fail the check.
        duplicate: new Set(list).size === 1,
      });
    }
  }
}

const conflicts = findings.filter((f) => !f.duplicate);
const dupes = findings.filter((f) => f.duplicate);
const label = (f) => `  ${f.file}:${f.line}  [${f.group}${f.variant === '(none)' ? '' : ` @ ${f.variant}`}]  ${f.classes}`;

if (dupes.length) {
  console.log(`· ${dupes.length} element(s) repeat an identical class (harmless, worth tidying):\n`);
  dupes.forEach((f) => console.log(label(f)));
  console.log('');
}

if (conflicts.length === 0) {
  console.log(`✓ ${files.length} files scanned, no element sets the same property twice`);
  process.exit(0);
}

console.log(`✗ ${conflicts.length} element(s) set the same property twice under one variant:\n`);
conflicts.forEach((f) => console.log(label(f)));
console.log(`\nWhichever class wins is decided by stylesheet order, not by the order written here.`);
process.exit(1);
