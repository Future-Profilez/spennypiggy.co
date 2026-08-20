/**
 * Write `.release` — the commit this deploy is shipping.
 *
 * WHY THIS EXISTS
 * `/health` is what CI curls to decide whether a deploy worked, and it reported a
 * hardcoded "1.0.0" forever, so it could never say what was actually live.
 *
 * There is no Vapor runtime variable carrying the deployed commit, and
 * `vapor deploy --commit=` only labels the artifact record in the Vapor API — it
 * never reaches the running app. `.git` is also in `.vaporignore`, so a vapor.yml
 * BUILD step cannot ask git anything either: the build container has no
 * repository. The only place that still knows the commit is right here, in the
 * working directory, before `vapor deploy` runs.
 *
 * `.release` is not in `.vaporignore`, so it is copied into the build path and
 * ships inside the artifact. It IS in `.gitignore` — it is a build product, and a
 * committed one would be stale the moment it was committed.
 *
 * RELEASE_SHA overrides git, so CI can pass `${{ github.sha }}` (the runner's
 * checkout is often detached/shallow, and the SHA it was given is the truth).
 */
import { execSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const git = (cmd) => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return '';
  }
};

let stamp = (process.env.RELEASE_SHA || '').trim();

if (!stamp) {
  stamp = git('git rev-parse --short=12 HEAD');

  // A deploy from a dirty tree is NOT the commit it claims to be, and saying so
  // is the entire point of the stamp. Vapor's own Git::hash() takes the harsher
  // line and reports nothing at all for a dirty tree, which is how the admin
  // app's deployment list ended up unreadable.
  if (stamp && git('git status --porcelain')) {
    stamp += '-dirty';
  }
}

if (!stamp) {
  // No git, no override. Write nothing rather than a placeholder: /health
  // reports `version: null, version_source: "unset"`, which is honest.
  console.warn('release:stamp — no commit available; leaving .release unwritten.');
  process.exit(0);
}

writeFileSync('.release', `${stamp}\n`);
console.log(`release:stamp — ${stamp}`);
