// Every file that USES a pricing symbol must also import/declare it.
// esbuild cannot catch this: an undefined identifier compiles fine and
// only explodes at render time as a ReferenceError (white screen).
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

const IMPORTED = ['feeRatesFor', 'supporterTotal', 'creatorIdOf'];
const DECLARED = ['__pageProps', '__rates'];

const files = globSync('resources/js/**/*.{js,jsx}', { cwd: process.argv[2] });
let bad = 0;

for (const rel of files) {
  const path = `${process.argv[2]}/${rel}`;
  if (rel.endsWith('utils/pricing.js')) continue;
  const src = readFileSync(path, 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  for (const sym of IMPORTED) {
    if (!new RegExp(`\\b${sym}\\s*\\(`).test(code)) continue;
    const imported = new RegExp(`import\\s*\\{[^}]*\\b${sym}\\b[^}]*\\}\\s*from\\s*['"]@/utils/pricing['"]`).test(code);
    if (!imported) { console.log(`✗ ${rel}: uses ${sym}() but does not import it`); bad++; }
  }
  for (const sym of DECLARED) {
    if (!new RegExp(`\\b${sym}\\b`).test(code)) continue;
    if (!new RegExp(`(const|let|var)\\s+${sym}\\b`).test(code)) {
      console.log(`✗ ${rel}: uses ${sym} but never declares it`); bad++;
    }
  }
}

console.log(bad === 0 ? `\n✓ ${files.length} files scanned, all pricing symbols resolved` : `\n${bad} unresolved symbol(s)`);
process.exit(bad === 0 ? 0 : 1);
