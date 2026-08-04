// Identifiers referenced but never bound anywhere in the file.
//
// This is the class of bug the build cannot see: an undefined identifier is
// valid syntax, so esbuild and `npm run build` both pass and the page throws a
// ReferenceError at render — a white screen with a green build.
import { readFileSync, globSync } from 'node:fs';

const GLOBALS = new Set(['window','document','console','Math','JSON','Object','Array','String','Number','Boolean','Date','Promise','Set','Map','RegExp','Error','parseInt','parseFloat','isNaN','isFinite','setTimeout','clearTimeout','setInterval','clearInterval','fetch','localStorage','sessionStorage','navigator','location','history','URL','URLSearchParams','FormData','Intl','React','undefined','null','true','false','this','arguments','requestAnimationFrame','cancelAnimationFrame','Infinity','NaN','globalThis','structuredClone','CustomEvent','Blob','File','AbortController','encodeURIComponent','decodeURIComponent','alert','confirm','prompt','process','atob','btoa','Image','Symbol','WeakMap','queueMicrotask']);

const root = process.argv[2];
let bad = 0, scanned = 0;

for (const rel of globSync('resources/js/**/*.{js,jsx}', { cwd: root })) {
  const raw = readFileSync(`${root}/${rel}`, 'utf8');
  scanned++;

  // Strip comments, strings, template literals and JSX text so only code remains.
  const src = raw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ')
    .replace(/`(?:\\.|\$\{[^}]*\}|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');

  // Everything the file binds: imports, declarations, params, JSX-free names.
  const bound = new Set(GLOBALS);
  const add = (s) => { for (const n of String(s).split(/[^\w$]+/)) if (n) bound.add(n); };

  for (const m of src.matchAll(/import\s+([\s\S]*?)\s+from/g)) add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var|function|class)\s+([\w$]+)/g)) bound.add(m[1]);
  for (const m of src.matchAll(/(?:const|let|var)\s*(\{[^}]*\}|\[[^\]]*\])/g)) add(m[1]);
  for (const m of src.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1]);
  for (const m of src.matchAll(/function\s*[\w$]*\s*\(([^()]*)\)/g)) add(m[1]);
  for (const m of src.matchAll(/([\w$]+)\s*=>/g)) bound.add(m[1]);
  for (const m of src.matchAll(/catch\s*\(\s*([\w$]+)/g)) bound.add(m[1]);
  for (const m of src.matchAll(/for\s*\(\s*(?:const|let|var)\s+([\w$]+)/g)) bound.add(m[1]);

  // Only check identifiers passed as a bare argument to a known helper — a full
  // scope analysis needs a parser; this catches the realistic slip (renaming a
  // map parameter, or copying a call between callbacks).
  for (const m of src.matchAll(/\b(creatorIdOf|feeRatesFor|supporterTotal)\s*\(\s*([\w$]+)\s*[),?]/g)) {
    const name = m[2];
    if (/^\d/.test(name) || bound.has(name)) continue;
    console.log(`✗ ${rel}: ${m[1]}(${name}) — "${name}" is not bound in this file (ReferenceError at render)`);
    bad++;
  }
}

console.log(bad === 0 ? `\n✓ ${scanned} files scanned, no unbound identifier passed to a pricing helper` : `\n${bad} unbound identifier(s)`);
process.exit(bad === 0 ? 0 : 1);
