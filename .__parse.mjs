import esbuild from 'esbuild';
import fs from 'fs';
let bad = 0;
for (const f of process.argv.slice(2)) {
  try { esbuild.transformSync(fs.readFileSync(f,'utf8'), { loader:'jsx' }); }
  catch (e) { bad++; console.log('FAIL', f, e.errors?.[0]?.text, 'line', e.errors?.[0]?.location?.line); }
}
console.log(bad === 0 ? `OK ${process.argv.length-2} files parse` : `${bad} FAILED`);
