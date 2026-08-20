<?php

namespace App\Support;

/**
 * What is actually live.
 *
 * 🚨 `/health` used to report `config('app.version', '1.0.0')` against a config
 * key that did not exist in ANY config file — so every environment, on every
 * deploy, answered `"version": "1.0.0"`. CI curls `/health` immediately after a
 * deploy to decide whether the deploy worked; a constant makes that check unable
 * to tell the release it just shipped from the one that was there before it.
 *
 * ⚠️ There is NO Vapor runtime variable carrying the deployed commit. Grepping
 * `vendor/laravel/vapor-core` turns up `VAPOR_SSM_PATH`, `VAPOR_ENV`,
 * `VAPOR_RUNTIME`, `VAPOR_MAINTENANCE_MODE*` and nothing release-shaped, and
 * `vapor deploy --commit=` only writes metadata onto the Vapor API's artifact
 * record — it never reaches the running application. So the commit has to be
 * carried INTO the artifact by whatever runs the deploy.
 *
 * ⚠️ `.git` is in `.vaporignore`, so the build container has no repository and a
 * build step cannot ask git anything. The stamp must therefore be written in the
 * working directory BEFORE `vapor deploy` runs (see the `release:stamp` npm
 * script and the CI workflow), where git and `${{ github.sha }}` still exist.
 *
 * NULL is a legitimate answer. An honest "we do not know what is deployed" is
 * debuggable; a fabricated version number is not.
 */
class Release
{
    /** The build stamp, relative to the project root. Not in `.vaporignore`, so it ships. */
    public const STAMP_FILE = '.release';

    private static ?array $resolved = null;

    /**
     * @return array{version: string|null, source: string}
     */
    public static function resolve(): array
    {
        if (self::$resolved !== null) {
            return self::$resolved;
        }

        // 1. The per-deploy stamp. Most specific: it is written by the thing that
        //    ran this particular deploy, so it changes every time.
        $stamp = self::readStamp();
        if ($stamp !== null) {
            return self::$resolved = ['version' => $stamp, 'source' => 'build-stamp'];
        }

        // 2. An explicitly set environment variable. Accurate only as often as a
        //    human remembers to change it, which is why it is not first.
        $configured = config('app.version');
        if (is_string($configured) && $configured !== '') {
            return self::$resolved = ['version' => $configured, 'source' => 'APP_VERSION'];
        }

        // 3. Sentry already has a release concept wired into config/sentry.php.
        //    If someone sets SENTRY_RELEASE, that is the same fact.
        $sentry = config('sentry.release');
        if (is_string($sentry) && $sentry !== '') {
            return self::$resolved = ['version' => $sentry, 'source' => 'SENTRY_RELEASE'];
        }

        return self::$resolved = ['version' => null, 'source' => 'unset'];
    }

    public static function version(): ?string
    {
        return self::resolve()['version'];
    }

    public static function source(): string
    {
        return self::resolve()['source'];
    }

    /** Test seam — the resolution is memoised for the life of the container. */
    public static function forget(): void
    {
        self::$resolved = null;
    }

    private static function readStamp(): ?string
    {
        try {
            $path = base_path(self::STAMP_FILE);

            if (! is_file($path) || ! is_readable($path)) {
                return null;
            }

            // First line only, trimmed, and capped — a health endpoint must never
            // echo back an arbitrarily large file because something wrote the
            // wrong thing here.
            $line = trim((string) strtok((string) file_get_contents($path), "\n"));

            return $line === '' ? null : substr($line, 0, 64);
        } catch (\Throwable $e) {
            // A health endpoint that 500s because it could not read its own
            // version file is worse than one that says it does not know.
            return null;
        }
    }
}
