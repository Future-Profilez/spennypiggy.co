#!/usr/bin/env node
/**
 * Static checks for the frontend faults `npm run build` cannot see.
 *
 * An undefined identifier, a missing import and a temporal-dead-zone read are
 * all VALID SYNTAX — esbuild compiles them happily and the page throws a
 * ReferenceError at render, which is a white screen with a green build.
 *
 * Three bugs of exactly this class shipped during one feature (a missing
 * import, an undeclared variable, and a map parameter referenced by the wrong
 * name) and every one of them reached a browser before anyone noticed. Each
 * check below was written against the real bug it now catches.
 *
 *   npm run check          # all of them
 *   node scripts/checks/check-tdz.mjs .
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = process.argv[2] ?? process.cwd();

const CHECKS = [
    ['hook dependency order (TDZ)', 'check-tdz.mjs'],
    ['pricing symbols imported', 'check-pricing-symbols.mjs'],
    ['no unbound identifiers', 'check-undefined-idents.mjs'],
    /*
     * Same family of fault, different mechanism: two utilities on one element
     * setting the same property. Nothing errors, the class the author meant is
     * simply not the one that renders, and which wins is decided by stylesheet
     * order rather than by source order. Found live on 19 elements — including a
     * pink CTA carrying both `text-black` and `text-white`, and a card carrying
     * both `rounded-lg` (16px in this config) and `rounded-[30px]`.
     */
    ['no conflicting utility classes', 'check-conflicting-classes.mjs'],
    /*
     * Not a fault the build cannot see — a DIRECTION the build has no opinion
     * about. Nothing on this site casts a shadow; the frame is a line. Without a
     * check, that comes back one screen at a time, because "a bit of depth here"
     * always looks fine on its own page and wrong beside the next one.
     */
    ['no shadows, only borders', 'check-no-shadows.mjs'],
];

let failed = 0;

for (const [label, script] of CHECKS) {
    process.stdout.write(`\n── ${label} ──\n`);
    const run = spawnSync(process.execPath, [join(here, script), root], { stdio: 'inherit' });
    if (run.status !== 0) failed++;
}

process.stdout.write(
    failed === 0
        ? '\nAll frontend static checks passed.\n'
        : `\n${failed} check(s) failed — the build will still succeed, and the page will still break.\n`,
);

process.exit(failed === 0 ? 0 : 1);
