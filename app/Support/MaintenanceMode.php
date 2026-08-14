<?php

namespace App\Support;

use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * The ONE definition of whether this site is serving traffic.
 *
 * The flag lives in the shared `settings` table under a single key holding JSON,
 * because the two apps share a DATABASE but NOT a cache — the admin app cannot
 * invalidate anything this app holds in memory. Everything here therefore reads
 * the row itself behind a deliberately SHORT cache (see CACHE_TTL).
 *
 * `php artisan down` is not an option: Vapor runs on Lambda, whose filesystem is
 * ephemeral and per-instance, so the marker file would exist on one container and
 * not the next. The stock PreventRequestsDuringMaintenance middleware still sits
 * in the global stack and is simply inert here.
 *
 * EVERYTHING IN THIS CLASS FAILS OPEN. A missing row, malformed JSON or an
 * unreachable database means the site stays UP. A database blip must never be
 * able to black out the platform, and a maintenance wall nobody asked for is far
 * worse than a maintenance wall that is a few seconds late.
 */
class MaintenanceMode
{
    /** Key in the shared `settings` table. Value is a JSON object. */
    public const SETTING_KEY = 'maintenance_mode';

    /** Cookie carrying the bypass token once a valid link has been opened. */
    public const BYPASS_COOKIE = 'sp_maintenance_bypass';

    /**
     * 10 seconds, not the 300 that `Setting::getValue()` uses.
     *
     * The admin app writes this row and cannot forget this app's cache entry, so
     * the TTL IS the lag in both directions: how long the site stays up after you
     * take it down, and — the one that actually hurts — how long it stays down
     * after you lift it. Do not raise this.
     */
    public const CACHE_TTL = 10;

    private const CACHE_KEY = 'maintenance_mode_state_v1';

    /** How long a bypass cookie survives. Deliberately short — it defeats the wall. */
    public const BYPASS_HOURS = 8;

    /**
     * Paths that are served whatever the flag says.
     *
     * 🚨 The webhook entries are not a convenience. Stripe retries a failing
     * webhook for three days and then gives up permanently — a 503'd
     * `checkout.session.completed` means a supporter is charged and never
     * receives their deliverable, a subscription silently never renews, and a
     * payout is never confirmed. None of it errors anywhere we would see.
     *
     * Matched as path prefixes against the request path with no leading slash.
     */
    public const EXEMPT_PREFIXES = [
        // Money. Never gate these.
        'webhook',
        'stripe/webhook',
        'rye-webhook',

        // The way back in.
        'maintenance-access',

        // Uptime probes — a monitor that reads the wall as an outage pages people
        // for a window that was planned.
        'health',
        'up',

        // Static assets: the maintenance page's own siblings, and anything a
        // browser or crawler fetches without rendering the app.
        'build',
        'assets',
        'images',
        'fonts',
        'storage',
        'favicon.ico',
        'robots.txt',
        'sw.js',
        'service-worker.js',
        'manifest.json',
        'manifest.webmanifest',
    ];

    /**
     * Current state, as a plain array with every key guaranteed present.
     *
     * @return array{
     *     enabled: bool,
     *     headline: string,
     *     message: string,
     *     starts_at: ?string,
     *     ends_at: ?string,
     *     auto_lift: bool,
     *     allow_ips: array<int, string>,
     *     bypass_token: ?string,
     *     updated_by: ?string,
     *     updated_at: ?string
     * }
     */
    public static function state(): array
    {
        try {
            return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function () {
                $raw = DB::table('settings')
                    ->where('key', self::SETTING_KEY)
                    ->value('value');

                return self::normalise($raw ? json_decode($raw, true) : null);
            });
        } catch (Throwable $e) {
            // Fail open, and say so once rather than on every request.
            Log::warning('Maintenance state unreadable, treating site as up: '.$e->getMessage());

            return self::normalise(null);
        }
    }

    /** Coerce whatever is stored into the full shape, with safe defaults. */
    public static function normalise(mixed $data): array
    {
        $data = is_array($data) ? $data : [];

        $ips = $data['allow_ips'] ?? [];
        $ips = is_array($ips) ? array_values(array_filter(array_map('trim', $ips))) : [];

        return [
            'enabled' => (bool) ($data['enabled'] ?? false),
            'headline' => (string) ($data['headline'] ?? 'We will be back shortly'),
            'message' => (string) ($data['message'] ?? ''),
            'starts_at' => self::asIso($data['starts_at'] ?? null),
            'ends_at' => self::asIso($data['ends_at'] ?? null),
            // Default TRUE: an unattended overrun should end, not persist.
            'auto_lift' => (bool) ($data['auto_lift'] ?? true),
            'allow_ips' => $ips,
            'bypass_token' => ($data['bypass_token'] ?? null) ?: null,
            'updated_by' => ($data['updated_by'] ?? null) ?: null,
            'updated_at' => self::asIso($data['updated_at'] ?? null),
        ];
    }

    /**
     * Is the wall up RIGHT NOW?
     *
     * Three separate conditions, deliberately not collapsed: the flag is on, the
     * window has started, and the window has not auto-ended.
     */
    public static function isDown(?array $state = null): bool
    {
        $state = $state ?? self::state();

        if (! $state['enabled']) {
            return false;
        }

        $now = Carbon::now();

        // Scheduled for later — the site is still live until then.
        if ($state['starts_at'] && $now->lt(Carbon::parse($state['starts_at']))) {
            return false;
        }

        // Window passed and auto-lift is on. With auto-lift OFF the wall stays up
        // past `ends_at` on purpose: someone has to confirm the work finished.
        if ($state['auto_lift'] && $state['ends_at'] && $now->gte(Carbon::parse($state['ends_at']))) {
            return false;
        }

        return true;
    }

    /** Is maintenance scheduled to begin, but not yet begun? */
    public static function isScheduled(?array $state = null): bool
    {
        $state = $state ?? self::state();

        return $state['enabled']
            && $state['starts_at']
            && Carbon::now()->lt(Carbon::parse($state['starts_at']));
    }

    /** Paths that are served regardless — see EXEMPT_PREFIXES for why. */
    public static function isExempt(Request $request): bool
    {
        $path = ltrim($request->path(), '/');

        foreach (self::EXEMPT_PREFIXES as $prefix) {
            if ($path === $prefix || str_starts_with($path, $prefix.'/')) {
                return true;
            }
        }

        return false;
    }

    /**
     * May THIS request through the wall?
     *
     * Two doors: a bypass token carried in a cookie, and an IP allowlist. The
     * token is compared with hash_equals — it is a secret, and a timing-safe
     * compare costs nothing.
     */
    public static function hasBypass(Request $request, ?array $state = null): bool
    {
        $state = $state ?? self::state();

        $token = $state['bypass_token'];
        if ($token) {
            $presented = (string) $request->cookie(self::BYPASS_COOKIE);
            if ($presented !== '' && hash_equals($token, $presented)) {
                return true;
            }
        }

        if ($state['allow_ips'] !== []) {
            $ip = (string) $request->ip();
            if ($ip !== '' && in_array($ip, $state['allow_ips'], true)) {
                return true;
            }
        }

        return false;
    }

    /** Seconds until the site is expected back, for the Retry-After header. */
    public static function retryAfterSeconds(?array $state = null): int
    {
        $state = $state ?? self::state();

        if ($state['ends_at']) {
            $seconds = Carbon::now()->diffInSeconds(Carbon::parse($state['ends_at']), false);

            if ($seconds > 0) {
                // Cap at a day: a header promising a return next week reads to a
                // crawler as "stop coming back".
                return (int) min($seconds, 86400);
            }
        }

        return 3600;
    }

    /** A fresh bypass token. Rotating one instantly revokes every issued link. */
    public static function newToken(): string
    {
        return bin2hex(random_bytes(24));
    }

    /**
     * The brand faces as `@font-face` rules with the woff2 INLINED as data: URIs.
     *
     * 🚨 The wall cannot fetch a font over the network. `vapor.yml` uploads only
     * `public/build/**` to S3/CloudFront, so anything else under `public/` ships
     * inside the Lambda and is never served: a request for `/fonts/newfont.woff2`
     * reaches the router, falls through to the `/{username}` profile catch-all and
     * 404s. Locally PHP serves `public/` directly, so it looked correct right up
     * until it was live — the page rendered in the system sans on production and
     * in the brand face on every developer's machine.
     *
     * Referencing the BUILT copies is not an option either: they are
     * content-hashed (`newfont-BRfniQek.woff2`), and a wall that reads the Vite
     * manifest breaks on exactly the deploy that raised it.
     *
     * So the bytes travel in the document. ~25 KB of woff2 becomes ~33 KB of
     * base64 on a page that has no other assets at all, and the result cannot be
     * broken by an asset host, a CDN, or a `vapor.yml` edit.
     *
     * Fails open: a missing or unreadable file returns nothing and the page falls
     * back to the system stack. A wall in the wrong typeface is a cosmetic
     * problem; a wall that will not render is not.
     */
    public static function fontCss(): string
    {
        static $css = null;

        if ($css !== null) {
            return $css;
        }

        $faces = [
            'gulfs' => 'newfont.woff2',
            'CeraGR' => 'CeraGRMedium.woff2',
        ];

        $out = '';

        foreach ($faces as $family => $file) {
            try {
                $path = resource_path('assets/fonts/optimized/'.$file);

                if (! is_readable($path)) {
                    continue;
                }

                $data = base64_encode((string) file_get_contents($path));

                $out .= sprintf(
                    "@font-face{font-family:'%s';font-display:swap;src:url(data:font/woff2;base64,%s) format('woff2');}",
                    $family,
                    $data
                );
            } catch (Throwable $e) {
                Log::warning('Maintenance font could not be inlined ('.$file.'): '.$e->getMessage());
            }
        }

        return $css = $out;
    }

    private static function asIso(mixed $value): ?string
    {
        if (! $value) {
            return null;
        }

        try {
            return Carbon::parse($value)->toIso8601String();
        } catch (Throwable) {
            return null;
        }
    }
}
