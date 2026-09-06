<?php

namespace App\Support;

use App\Models\Admin;
use App\Models\AlertRoute;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

/**
 * Who receives one piece of the platform's own operational mail.
 *
 * Before this class the answer lived in SIX places — config/alerts.php, two
 * fallback chains inside Helpers, a `$type` parameter that was accepted and
 * ignored, a diagnostics-only env variable, a hardcoded address in EmailService
 * and another in MonitorPlatformRiskState — so "which alert goes where" could
 * only be answered by reading code, and changing it meant a deploy.
 *
 * Everything about internal alerts lives in TWO places and no third:
 * `config/alerts.php` (master switch, emergency fallback, the channel
 * catalogue) and the `alert_routes` table (who gets what — the admin screen).
 *
 * 🚨 THIS CLASS MUST NEVER THROW AND MUST NEVER SILENTLY SEND TO NOBODY.
 * Every caller is an alert about something already going wrong. A missing row,
 * a missing table, an unknown channel or a database fault all fall back to
 * config/alerts.php — the behaviour that was in place before any of this
 * existed. The ONLY way to reach an empty recipient list is a row that exists
 * and says `enabled = false`, which is a decision somebody made on a screen.
 *
 * 🚨 MIRRORED IN BOTH APPS AND MUST STAY IDENTICAL — shared database, separate
 * code. `config/alerts.php` is mirrored beside it.
 */
class AlertRouter
{
    /** Cache the resolved list briefly: an alert storm must not be one query per mail. */
    private const CACHE_SECONDS = 60;

    /**
     * 🚨 --force ONLY. When true, the master switch and a row's own `enabled`
     * are ignored for the rest of THIS process, so a deliberate manual run can
     * actually produce mail — without it, a command's --force bypassed its own
     * gate and then recipients() answered [] anyway, and "force" sent nothing.
     * Never set from a web request; the flag dies with the process.
     */
    private static bool $ignoreSwitches = false;

    public static function ignoreSwitchesForThisRun(): void
    {
        self::$ignoreSwitches = true;
    }

    /** Undo the --force override — the flag is static, so tests must reset it. */
    public static function obeySwitches(): void
    {
        self::$ignoreSwitches = false;
    }

    /**
     * The addresses an alert on this channel should go to, right now.
     *
     * @return array<int, string>
     */
    public static function recipients(string $channel): array
    {
        try {
            if (! self::masterEnabled() && ! self::$ignoreSwitches) {
                Log::info('AlertRouter: ALERTS_ENABLED is off on this host', ['channel' => $channel]);

                return [];
            }

            $route = self::route($channel);

            if ($route === null) {
                return self::fallback();
            }

            if (! ($route['enabled'] ?? true) && ! self::$ignoreSwitches) {
                // A deliberate silence, not a fault. Logged at info so
                // "why did nobody get paged?" has an answer.
                Log::info('AlertRouter: channel is switched off', ['channel' => $channel]);

                return [];
            }

            $resolved = self::preview($route['emails'] ?? [], $route['roles'] ?? []);

            /*
             * A row that resolves to nobody is a configuration accident, not a
             * decision — the decision is the `enabled` flag above. Falling back
             * is the safe direction: a duplicate recipient is noise, a silent
             * alert is the failure this class exists to prevent.
             */
            if ($resolved === []) {
                Log::warning('AlertRouter: channel resolved to no recipients, falling back', [
                    'channel' => $channel,
                ]);

                return self::fallback();
            }

            return $resolved;
        } catch (\Throwable $e) {
            Log::warning('AlertRouter: routing lookup failed, falling back', [
                'channel' => $channel,
                'error' => $e->getMessage(),
            ]);

            return self::fallback();
        }
    }

    /**
     * Whether this channel is switched on. An unrouted channel is ON — nothing
     * has been decided about it yet, and defaulting to off would silence every
     * alert the day this shipped.
     */
    public static function isEnabled(string $channel): bool
    {
        try {
            if (! self::masterEnabled()) {
                return false;
            }

            $route = self::route($channel);

            return $route === null ? true : (bool) ($route['enabled'] ?? true);
        } catch (\Throwable $e) {
            return true;
        }
    }

    /**
     * What a given set of addresses and roles resolves to, with NO fallback.
     *
     * 🚨 `recipients()` falls back to config/alerts.php when a row reaches
     * nobody, which is the right behaviour for a sender — and exactly the wrong
     * thing to validate a save against, because it makes an empty critical
     * channel look populated. The admin screen checks THIS.
     *
     * @param  array<int, mixed>  $emails
     * @param  array<int, mixed>  $roles
     * @return array<int, string>
     */
    public static function preview(array $emails, array $roles): array
    {
        return self::normalise(array_merge($emails, self::addressesForRoles($roles)));
    }

    /** 'production' or 'non_production' — the bucket this host routes on. */
    public static function environment(): string
    {
        return app()->environment('production') ? 'production' : 'non_production';
    }

    /**
     * The declared channels, with their stored routing merged in. Used by the
     * admin screen; never by a sender.
     *
     * @return array<string, array<string, mixed>>
     */
    public static function catalogue(): array
    {
        $environment = self::environment();
        $stored = self::rows();

        $out = [];

        foreach ((array) config('alerts.channels', []) as $key => $channel) {
            $route = $stored[$key] ?? null;

            $out[$key] = array_merge($channel, [
                'key' => $key,
                'environment' => $environment,
                'routed' => $route !== null,
                'enabled' => $route === null ? true : (bool) ($route['enabled'] ?? true),
                'emails' => $route === null ? (array) ($channel['emails'] ?? []) : (array) ($route['emails'] ?? []),
                'roles' => $route === null ? (array) ($channel['roles'] ?? []) : (array) ($route['roles'] ?? []),
                'resolved' => self::recipients($key),
                'updated_at' => $route['updated_at'] ?? null,
                'updated_by' => $route['updated_by'] ?? null,
            ]);
        }

        return $out;
    }

    /** Drop the cached routing. Called after any write. */
    public static function forget(): void
    {
        Cache::forget(self::cacheKey());
    }

    /**
     * The stored row for one channel in this environment, or null when the
     * channel is unknown to the catalogue or has never been routed.
     *
     * @return array<string, mixed>|null
     */
    private static function route(string $channel): ?array
    {
        if (! array_key_exists($channel, (array) config('alerts.channels', []))) {
            // An undeclared channel cannot be aimed from the screen, so aiming
            // it here would be inventing a destination nobody can see or change.
            Log::warning('AlertRouter: unknown channel, falling back', ['channel' => $channel]);

            return null;
        }

        return self::rows()[$channel] ?? null;
    }

    /**
     * Every stored route for this environment, keyed by channel.
     *
     * @return array<string, array<string, mixed>>
     */
    private static function rows(): array
    {
        return Cache::remember(self::cacheKey(), self::CACHE_SECONDS, function () {
            // The table is created by admin.spennypiggy.co's migration. A host
            // that has not run it yet must still send its alerts.
            if (! Schema::hasTable('alert_routes')) {
                return [];
            }

            return AlertRoute::query()
                ->where('environment', self::environment())
                ->get()
                ->keyBy('channel')
                ->map(fn ($row) => [
                    'emails' => (array) $row->emails,
                    'roles' => (array) $row->roles,
                    'enabled' => (bool) $row->enabled,
                    'updated_at' => optional($row->updated_at)->toDateTimeString(),
                    'updated_by' => $row->updated_by,
                ])
                ->all();
        });
    }

    private static function cacheKey(): string
    {
        return 'alert_routes:'.self::environment();
    }

    /**
     * Live addresses for a set of admin role ids.
     *
     * Roles are expanded at SEND time on purpose: a new Finance admin is
     * reachable without anybody editing a list, and a disabled or deleted one
     * stops receiving alerts the moment their account does.
     *
     * ⚠️ Role ids live in admin.spennypiggy.co's Admin model and are read here
     * out of the SHARED database. Change them there, change them here.
     *
     * @param  array<int, int|string>  $roles
     * @return array<int, string>
     */
    private static function addressesForRoles(array $roles): array
    {
        $roles = array_values(array_filter(array_map('intval', $roles)));

        if ($roles === []) {
            return [];
        }

        try {
            return Admin::query()
                ->whereNull('deleted_at')
                ->whereNull('disabled_at')
                ->whereIn('role', $roles)
                ->whereNotNull('email')
                ->pluck('email')
                ->all();
        } catch (\Throwable $e) {
            // Schema drift or a missing admins table must not lose the typed
            // addresses beside the roles.
            Log::warning('AlertRouter: admin role lookup failed', ['error' => $e->getMessage()]);

            return [];
        }
    }

    /** ALERTS_ENABLED — the per-host master switch. Unset means on (except local). */
    public static function masterEnabled(): bool
    {
        return (bool) config('alerts.enabled', true);
    }

    /**
     * ALERT_FALLBACK_EMAILS — the emergency list, used whenever the database
     * cannot answer. Never empty: config/alerts.php substitutes a default.
     *
     * @return array<int, string>
     */
    public static function fallback(): array
    {
        return self::normalise((array) config('alerts.fallback', []));
    }

    /**
     * @param  array<int, mixed>  $addresses
     * @return array<int, string>
     */
    private static function normalise(array $addresses): array
    {
        $clean = [];

        foreach ($addresses as $address) {
            $address = strtolower(trim((string) $address));

            if ($address === '' || ! filter_var($address, FILTER_VALIDATE_EMAIL)) {
                continue;
            }

            $clean[$address] = true;
        }

        return array_keys($clean);
    }
}
