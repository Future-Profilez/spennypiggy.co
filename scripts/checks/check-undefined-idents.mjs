// Identifiers referenced but never bound anywhere in the file — a JSX component
// that was never written or imported, and a bare argument to a pricing helper.
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
    // 🚨 A STRING PATTERN MUST NOT CROSS A NEWLINE, OR JSX TEXT EATS REAL CODE.
    // Comments are gone by here, but an apostrophe in JSX PROSE ("you don't
    // have any yet") is not a string opener — and an unbounded pattern treats
    // it as one, swallowing everything up to the next apostrophe, which is
    // routinely hundreds of lines away and takes real `function X()`
    // declarations with it. Measured: that alone produced 49 phantom hits
    // across the two apps, every one a component defined lower in its own file.
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');

  /*
   * 🚨 BINDINGS ARE READ FROM THE LIGHTLY-CLEANED SOURCE, USAGES FROM THE HEAVY ONE.
   *
   * The aggressive strip above exists to stop a quoted `<Foo>` reading as a real
   * usage — but run over the whole file it also deletes DECLARATIONS whenever a
   * quote pattern misfires, and a lost binding turns every honest use of that
   * component into a phantom error. A declaration that only appears INSIDE a
   * string is not a thing anybody writes, so reading bindings from the
   * comment-stripped text costs nothing and cannot invent a failure.
   *
   * ⚠️ The asymmetry is deliberate and is the safe direction: an over-generous
   * binding list can only ever MISS a real fault, never manufacture one. A guard
   * that cries wolf is a guard somebody deletes.
   */
  const declSrc = raw
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/.*$/gm, ' ');

  // Everything the file binds: imports, declarations, params, JSX-free names.
  const bound = new Set(GLOBALS);
  const add = (s) => { for (const n of String(s).split(/[^\w$]+/)) if (n) bound.add(n); };

  for (const m of declSrc.matchAll(/import\s+([\s\S]*?)\s+from/g)) add(m[1]);
  for (const m of declSrc.matchAll(/(?:const|let|var|function|class)\s+([\w$]+)/g)) bound.add(m[1]);
  for (const m of declSrc.matchAll(/(?:const|let|var)\s*(\{[^}]*\}|\[[^\]]*\])/g)) add(m[1]);
  for (const m of declSrc.matchAll(/\(([^()]*)\)\s*=>/g)) add(m[1]);
  for (const m of declSrc.matchAll(/function\s*[\w$]*\s*\(([^()]*)\)/g)) add(m[1]);
  for (const m of declSrc.matchAll(/([\w$]+)\s*=>/g)) bound.add(m[1]);
  // ⚠️ A SHORTHAND METHOD BINDS ITS PARAMETERS AND CARRIES NO `function` KEYWORD.
  // `setup({ el, App, props })` in app.jsx is the live case — without this every
  // app entry point reports its own `<App>` as undefined.
  for (const m of declSrc.matchAll(/(?:^|[\s,{])([\w$]+)\s*\(([^()]*)\)\s*\{/g)) add(m[2]);
  for (const m of declSrc.matchAll(/catch\s*\(\s*([\w$]+)/g)) bound.add(m[1]);
  for (const m of declSrc.matchAll(/for\s*\(\s*(?:const|let|var)\s+([\w$]+)/g)) bound.add(m[1]);

  // 🚨 AN UNDEFINED JSX COMPONENT IS A GUARANTEED CRASH, AND THE BUILD IS GREEN.
  //
  // `<OptionCard …>` compiles to `React.createElement(OptionCard, …)`, which is
  // valid syntax referencing a name that does not exist — so esbuild resolves
  // nothing, vite reports nothing, and the step throws ReferenceError the moment
  // a creator opens it. Live 12 Sep 2026 on the shop form
  // (Sentry JAVASCRIPT-REACT-C4), three uses of a component that was never
  // written or imported.
  //
  // ⚠️ Capitalised names only — that IS the rule JSX itself uses to tell a
  // component from a `<div>`, so anything lowercase is a DOM tag and not ours.
  // ⚠️ The ROOT of a dotted name (`<Menu.Button>` binds `Menu`), and never a
  // closing tag, which cannot introduce a name the opening tag did not.
  for (const m of src.matchAll(/<([A-Z][\w$]*)(?:\.[\w$]+)*[\s/>]/g)) {
    const name = m[1];
    if (bound.has(name)) continue;
    console.log(`✗ ${rel}: <${name}> is not bound in this file (ReferenceError at render)`);
    bad++;
  }

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

console.log(bad === 0 ? `\n✓ ${scanned} files scanned, no unbound identifier (JSX component or pricing-helper argument)` : `\n${bad} unbound identifier(s)`);
process.exit(bad === 0 ? 0 : 1);
