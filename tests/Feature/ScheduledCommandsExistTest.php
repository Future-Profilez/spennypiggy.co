<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

/**
 * 🚨 A SCHEDULED COMMAND THAT PRODUCTION CANNOT RESOLVE RUNS NOTHING, FOR EVER.
 *
 * Live on 6 Sep 2026 (Sentry JAVASCRIPT-REACT-8P): production answered
 * *"There are no commands defined in the \"notification-logs\" namespace"* while
 * `php artisan list` on the developer's machine showed the command perfectly —
 * the file had never been `git add`ed, so it existed locally and in no build.
 *
 * ⚠️ Two different faults, two tests, because each is invisible to the other:
 * a name nothing registers (typo, rename, deleted command), and a name that
 * registers HERE and nowhere else (never committed).
 *
 * ⚠️ Needs no database — it reads the Kernel source and the Artisan registry.
 */
class ScheduledCommandsExistTest extends TestCase
{
    /**
     * Every `$schedule->command('x')` name in Console\Kernel.
     *
     * @return array<int, string>
     */
    private function scheduledNames(): array
    {
        $source = file_get_contents(base_path('app/Console/Kernel.php'));

        // Blank comments first — a commented-out schedule is not a schedule,
        // and the notes in this Kernel quote command names in prose.
        $source = preg_replace('#/\*.*?\*/#s', '', $source);
        $source = preg_replace('#^\s*//.*$#m', '', (string) $source);

        preg_match_all(
            "/->command\(\s*'([a-z0-9][a-z0-9:_-]*)/i",
            (string) $source,
            $matches
        );

        $names = array_values(array_unique($matches[1] ?? []));

        $this->assertNotEmpty($names, 'No scheduled commands were parsed — has Kernel.php moved?');

        return $names;
    }

    /** name => the file its class is declared in */
    private function registeredFiles(): array
    {
        $files = [];

        foreach (Artisan::all() as $name => $command) {
            $file = (new \ReflectionClass($command))->getFileName();

            if (is_string($file)) {
                $files[$name] = $file;
            }
        }

        return $files;
    }

    /**
     * 🚨 A NAME THE SCHEDULER CANNOT RESOLVE IS A JOB THAT NEVER RUNS.
     *
     * Symfony throws `NamespaceNotFoundException` and the run dies — so a typo,
     * a rename, or a command deleted while its schedule stayed behind produces
     * a task that quietly does nothing for as long as nobody notices.
     */
    public function test_every_scheduled_command_resolves(): void
    {
        $registered = $this->registeredFiles();

        foreach ($this->scheduledNames() as $name) {
            $this->assertArrayHasKey(
                $name,
                $registered,
                "Console\\Kernel schedules '{$name}', which is not a registered Artisan command."
            );
        }
    }

    /**
     * 🚨 AND A COMMAND FILE GIT DOES NOT CARRY IS ONE PRODUCTION NEVER GETS.
     *
     * This is the half that actually bit (Sentry JAVASCRIPT-REACT-8P): the file
     * exists on the developer's machine, so the test above passes and
     * `php artisan list` shows it — while the deploy ships a Kernel scheduling a
     * command that is not in the build. `git commit -a` does NOT add an untracked
     * file, so committing the Kernel edit alone is the easy way to do it.
     *
     * ⚠️ SKIPS rather than fails outside a git checkout — a guard that fails for
     * a reason nobody can act on is a guard people delete.
     */
    public function test_every_scheduled_command_is_committed(): void
    {
        if (! is_dir(base_path('.git'))) {
            $this->markTestSkipped('Not a git checkout — nothing to compare against.');
        }

        $registered = $this->registeredFiles();
        $untracked = [];

        foreach ($this->scheduledNames() as $name) {
            $file = $registered[$name] ?? null;

            if ($file === null || ! str_starts_with($file, base_path('app'))) {
                continue; // unresolvable is the other test's job; vendor is not ours
            }

            exec(
                'git -C '.escapeshellarg(base_path())
                .' ls-files --error-unmatch '.escapeshellarg($file).' 2>/dev/null',
                $out,
                $status
            );

            if ($status !== 0) {
                $untracked[] = $name.'  ('.str_replace(base_path().'/', '', $file).')';
            }
        }

        $this->assertSame(
            [],
            $untracked,
            'These commands are SCHEDULED but their files are not tracked by git, so a deploy '
            ."ships a schedule pointing at nothing:\n  - ".implode("\n  - ", $untracked)
        );
    }
}
