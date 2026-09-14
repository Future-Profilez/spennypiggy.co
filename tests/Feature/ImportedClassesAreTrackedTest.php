<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * A CLASS THE BUILD DOES NOT CARRY IS A FATAL ERROR ON THE PATH THAT IMPORTS IT.
 *
 * 🚨 `git commit -a` DOES NOT ADD AN UNTRACKED FILE. So the natural motion — write a
 * helper, use it from a controller, commit everything — ships the CONTROLLER and leaves
 * the HELPER behind, and production answers `Class "App\Support\X" not found`. Locally
 * everything works perfectly, which is what makes it invisible until it deploys.
 *
 * Measured on this repository, 13 Sep 2026 — two were live and both sat on paths that
 * matter:
 *
 *   App\Support\CreatorAge       — imported by ProfileController (the date-of-birth
 *                                  rule) and StripeController (the Connect onboarding
 *                                  gate)
 *   App\Support\ListingRollback  — imported by BillsController, ShopsController and
 *                                  MembershipController (the Stripe-failure rollback
 *                                  when a listing is created)
 *
 * So a deploy would have fataled profile save, Stripe onboarding and listing creation
 * on three modules. One `git add` each was the whole fix.
 *
 * ⚠️ `ScheduledCommandsExistTest` is the NARROW form of this and does not cover it: it
 * judges commands named in `Console\Kernel`, and neither of these is a command. This
 * asks the general question — is every first-party class our own code imports actually
 * in the repository?
 *
 * ⚠️ IT SKIPS OUTSIDE A GIT CHECKOUT rather than failing. A guard that fails for a
 * reason nobody can act on is a guard people delete.
 */
class ImportedClassesAreTrackedTest extends TestCase
{
    public function test_every_first_party_class_our_code_imports_is_in_the_repository(): void
    {
        exec('git rev-parse --is-inside-work-tree 2>/dev/null', $probe, $status);

        if ($status !== 0) {
            $this->markTestSkipped('Not a git checkout — nothing to ask about tracking.');
        }

        // One listing, then set lookups: `git ls-files` per class is a process per
        // import and this app has thousands.
        exec('git ls-files -- app 2>/dev/null', $tracked);
        $tracked = array_flip(array_map(fn ($p) => base_path($p), $tracked));

        $missing = [];

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(app_path(), \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($files as $file) {
            if ($file->getExtension() !== 'php') {
                continue;
            }

            $importer = $file->getPathname();

            // An untracked file importing another untracked file is one fault, not two —
            // and the importer is already reported by its own entry.
            if (! isset($tracked[$importer])) {
                $missing[] = str_replace(base_path().'/', '', $importer).'  (the file itself is untracked)';

                continue;
            }

            $source = file_get_contents($importer);
            $source = preg_replace('#/\*.*?\*/#s', '', $source);
            $source = preg_replace('#//[^\n]*#', '', $source);

            preg_match_all('#^\s*use\s+(App\\\\[A-Za-z0-9_\\\\]+)\s*(?:as\s+\w+\s*)?;#m', $source, $matches);

            foreach ($matches[1] as $class) {
                // PSR-4: App\ maps to app/.
                $path = app_path(str_replace('\\', '/', substr($class, strlen('App\\'))).'.php');

                // A class that does not exist on disk at all is a different fault
                // (a bad import), and `php artisan` would already be failing on it.
                if (! is_file($path)) {
                    continue;
                }

                if (! isset($tracked[$path])) {
                    $missing[str_replace(base_path().'/', '', $path)] =
                        str_replace(base_path().'/', '', $path)
                        .'  — imported by '.str_replace(base_path().'/', '', $importer);
                }
            }
        }

        $this->assertSame(
            [],
            array_values($missing),
            'These classes exist locally and are NOT in the repository, so a deploy fatals '
                ."on whatever imports them. `git add` each one BY NAME:\n  "
                .implode("\n  ", array_values($missing))
        );
    }
}
