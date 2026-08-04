// A hook's dependency array is evaluated EAGERLY — it is a plain argument, not
// deferred like the callback body. Listing a binding declared LOWER in the
// component reads it inside its temporal dead zone and throws
// "Cannot access 'x' before initialization" on every render.
//
// esbuild and `npm run build` cannot see this. The page simply dies.
import { readFileSync, globSync } from 'node:fs';

const HOOKS = /\b(useCallback|useMemo|useEffect|useLayoutEffect)\s*\(/g;

/** Offset just past the hook call's matching close paren, respecting nesting. */
function endOfCall(src, openParen) {
  let depth = 0;
  for (let i = openParen; i < src.length; i++) {
    const c = src[i];
    if (c === '(') depth++;
    else if (c === ')') { depth--; if (depth === 0) return i; }
  }
  return -1;
}

const root = process.argv[2];
let bad = 0, scanned = 0;

for (const rel of globSync('resources/js/**/*.jsx', { cwd: root })) {
  const src = readFileSync(`${root}/${rel}`, 'utf8');
  scanned++;

  // Where each binding is introduced.
  const declared = new Map();
  const declRe = /const\s*(?:\{([^}]*)\}|([\w$]+))\s*=\s*(?:useForm|useState|useReducer|useMemo|useCallback|usePage)\s*\(/g;
  let d;
  while ((d = declRe.exec(src))) {
    for (const raw of (d[1] ? d[1].split(',') : [d[2]])) {
      const n = raw.split(':').pop().trim();
      if (n && !declared.has(n)) declared.set(n, d.index);
    }
  }

  HOOKS.lastIndex = 0;
  let h;
  while ((h = HOOKS.exec(src))) {
    const open = h.index + h[0].length - 1;
    const close = endOfCall(src, open);
    if (close < 0) continue;

    // The dep array is the last [...] before the closing paren.
    const args = src.slice(open + 1, close);
    const dep = args.match(/,\s*\[([^\]]*)\]\s*$/);
    if (!dep) continue;

    for (const raw of dep[1].split(',')) {
      const name = raw.trim().split(/[.?[(]/)[0];
      if (!name || !declared.has(name)) continue;
      if (declared.get(name) > h.index) {
        console.log(`✗ ${rel}:${src.slice(0, h.index).split('\n').length} — ${h[1]} dependency [${name}] is declared LOWER in the component (TDZ — throws on render)`);
        bad++;
      }
    }
  }
}

console.log(bad === 0
  ? `\n✓ ${scanned} components scanned, no hook dependency reads a binding declared below it`
  : `\n${bad} TDZ violation(s)`);
process.exit(bad === 0 ? 0 : 1);
