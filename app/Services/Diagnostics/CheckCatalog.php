<?php

namespace App\Services\Diagnostics;

/**
 * The one definition of what each diagnostic check IS — its human label, which group it belongs
 * to, how bad a failure is, and what to actually do about it.
 *
 * Severity lives here rather than inside each check because the checks report a status
 * (passed/warning/failed/skipped) and the reader needs a priority. Those are different questions:
 * "disk 76% full" and "queue worker is dead" both render as one amber row without this, and the
 * reader has no way to tell that one of them means no creator is being paid.
 *
 * A check with no entry here still renders — it falls back to WARNING with its own key as the
 * label — so adding a check can never make the page throw.
 */
class CheckCatalog
{
    public const SEVERITY_CRITICAL = 'critical';

    public const SEVERITY_WARNING = 'warning';

    public const SEVERITY_INFO = 'info';

    /** Ordering weight — lower sorts first. */
    public const SEVERITY_ORDER = [
        self::SEVERITY_CRITICAL => 0,
        self::SEVERITY_WARNING => 1,
        self::SEVERITY_INFO => 2,
    ];

    public const GROUP_PLATFORM = 'Platform';

    public const GROUP_MONEY = 'Money';

    public const GROUP_FLOWS = 'User flows';

    public const GROUP_INTEGRATIONS = 'Integrations';

    public const GROUP_INFRASTRUCTURE = 'Infrastructure';

    /**
     * key => [label, group, severity-when-not-passing, remediation]
     *
     * CRITICAL is reserved for "money cannot move, the site is down, or data is at risk". Nothing
     * else earns it — a page where everything is critical prioritises nothing.
     */
    public const CHECKS = [
        // ---- Platform -------------------------------------------------------------------
        'routes_syntax' => [
            'label' => 'Code syntax & routes integrity',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'A syntax error or unresolvable route will 500 in production. Run `php artisan route:list` and `./vendor/bin/pint --test` to find it.',
        ],
        'database' => [
            'label' => 'Database connectivity',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Nothing works without the database. Check the DB service is running and DB_* credentials are correct.',
        ],
        'cache' => [
            'label' => 'Cache / Redis',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Sessions, profile caches and the leaderboard all read through the cache. Check CACHE_DRIVER and that the store is reachable.',
        ],
        'pending_migrations' => [
            'label' => 'Pending database migrations',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Code is running against a schema it was not written for. Run `php artisan migrate`.',
        ],
        'env_variables' => [
            'label' => 'Environment variables',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Set the missing variables, then `php artisan config:clear`. On Vapor set them in the environment, not the .env file.',
        ],
        'storage_permissions' => [
            'label' => 'Storage permissions',
            'group' => self::GROUP_PLATFORM,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Logs, cache and sessions cannot be written. Fix ownership on storage/ and bootstrap/cache/.',
        ],

        // ---- Money ----------------------------------------------------------------------
        'stripe_payments' => [
            'label' => 'Stripe payments processing',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'No supporter can pay. Verify STRIPE_SECRET and that the platform account is active.',
        ],
        'stripe_webhook' => [
            'label' => 'Stripe webhook config',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Without the webhook secret, bank/SEPA/ACH settlements never fulfil and no deliverable is created. Set STRIPE_WEBHOOK_SECRET.',
        ],
        'financial_integrity' => [
            'label' => 'Financial data integrity',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Inspect the listed transaction ids. For fee mismatches run `php artisan payments:verify-creator-net --all`; for stale pending rows run `php artisan payments:sweep-stuck`.',
        ],
        'stuck_payouts' => [
            'label' => 'Stuck payouts & blocked reserves',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Creators are not being paid. Check the last payout run, then `php artisan reserve:release`.',
        ],
        'stripe_id_flow' => [
            'label' => 'Stripe Connect & ID verification',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'New creators cannot onboard. Check Connect is enabled on the platform account.',
        ],
        'referral_system' => [
            'label' => 'Referral & earn system',
            'group' => self::GROUP_MONEY,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Stuck referral payouts need an admin decision in the admin app — they do not clear themselves.',
        ],

        // ---- User flows -----------------------------------------------------------------
        'signup_flow' => [
            'label' => 'User sign up flow',
            'group' => self::GROUP_FLOWS,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Nobody can join. Check the users table schema and any creating hooks on the User model.',
        ],
        'cart_flow' => [
            'label' => 'Add to cart flow',
            'group' => self::GROUP_FLOWS,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Basket checkout is broken. Trace CheckoutController::createCheckout.',
        ],
        'wish_items' => ['label' => 'Wish items (add/edit/delete)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot manage wish listings. Check WishitemController and the wish_items schema.'],
        'bills' => ['label' => 'Bills (add/edit/delete)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot manage bill listings. Check BillsController and the bills schema.'],
        'memberships' => ['label' => 'Memberships (add/edit/delete)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot manage membership tiers. Check MembershipController and the memberships schema.'],
        'shop_items' => ['label' => 'Shop items (add/edit/delete)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot manage shop listings. Check ShopsController and the shops schema.'],
        'tasks' => ['label' => 'Tasks (add/edit/delete)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot manage paid tasks. Check TaskController and the tasks schema.'],
        'social_flow' => ['label' => 'Social flow (follow/unfollow)', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_INFO, 'remediation' => 'Following is broken. Check the follows table and UserBlock scopes.'],
        'profile_update' => ['label' => 'Profile management', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Creators cannot edit their profile. Check ProfileController::update.'],
        'search_engine' => ['label' => 'Platform search engine', 'group' => self::GROUP_FLOWS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Discovery is broken. Check DiscoveryService and the search indexes.'],

        // ---- Integrations ---------------------------------------------------------------
        'email' => [
            'label' => 'Email service',
            'group' => self::GROUP_INTEGRATIONS,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'No receipts, password resets or verification mail. Check the MAIL_* configuration.',
        ],
        'uploadcare' => [
            'label' => 'Image hosting (Uploadcare)',
            'group' => self::GROUP_INTEGRATIONS,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Uploads and every moderation scan depend on this. Check UPLOADCARE_PUBLIC_KEY / UPLOADCARE_SECRET_KEY.',
        ],
        'push_notifications' => ['label' => 'Push notifications (MagicBell)', 'group' => self::GROUP_INTEGRATIONS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Check MAGICBELL_API_KEY / MAGICBELL_API_SECRET.'],
        'intercom' => ['label' => 'Support chat (Intercom)', 'group' => self::GROUP_INTEGRATIONS, 'severity' => self::SEVERITY_INFO, 'remediation' => 'Support chat is unavailable. Check the Intercom configuration.'],
        'termly_consent' => ['label' => 'Termly consent', 'group' => self::GROUP_INTEGRATIONS, 'severity' => self::SEVERITY_WARNING, 'remediation' => 'Cookie consent is a legal requirement. Check the Termly script in app.blade.php.'],

        // ---- Infrastructure -------------------------------------------------------------
        'queue_health' => [
            'label' => 'Queue health',
            'group' => self::GROUP_INFRASTRUCTURE,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Deliverables, receipts, moderation scans and payouts all run on the queue and silently do nothing without it. Start `php artisan queue:work`, then `php artisan queue:retry all` for the failures.',
        ],
        'scheduled_tasks' => [
            'label' => 'Scheduled tasks / cron',
            'group' => self::GROUP_INFRASTRUCTURE,
            'severity' => self::SEVERITY_CRITICAL,
            'remediation' => 'Reserve releases, payout runs and SLA refunds never fire without the scheduler. Start `php artisan schedule:work`.',
        ],
        'recent_errors' => [
            'label' => 'Recent error log',
            'group' => self::GROUP_INFRASTRUCTURE,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Errors are grouped by signature below — work down from the most frequent.',
        ],
        'disk_space' => [
            'label' => 'Disk space',
            'group' => self::GROUP_INFRASTRUCTURE,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Clear old logs and caches: `php artisan optimize:clear` and truncate storage/logs.',
        ],
        'app_response_time' => [
            'label' => 'App homepage response time',
            'group' => self::GROUP_INFRASTRUCTURE,
            'severity' => self::SEVERITY_WARNING,
            'remediation' => 'Profile the homepage query path; check cache hit rates and the leaderboard board cache.',
        ],
    ];

    /**
     * Checks that CREATE something real at a third party. They are excluded from a normal run and
     * only included on an explicit deep run — a diagnostic that mutates production state on every
     * page load is not a diagnostic, and this one was making a real Stripe Connect Express account
     * and a real PaymentIntent every single time the page was opened.
     */
    public const MUTATING_CHECKS = ['stripe_id_flow', 'stripe_payments'];

    public static function label(string $key): string
    {
        return self::CHECKS[$key]['label'] ?? ucfirst(str_replace('_', ' ', $key));
    }

    public static function group(string $key): string
    {
        return self::CHECKS[$key]['group'] ?? self::GROUP_INFRASTRUCTURE;
    }

    public static function severity(string $key): string
    {
        return self::CHECKS[$key]['severity'] ?? self::SEVERITY_WARNING;
    }

    public static function remediation(string $key): ?string
    {
        return self::CHECKS[$key]['remediation'] ?? null;
    }

    public static function isMutating(string $key): bool
    {
        return in_array($key, self::MUTATING_CHECKS, true);
    }

    /** Group order for the UI, so the page always reads top-down in the same order. */
    public static function groupOrder(): array
    {
        return [
            self::GROUP_MONEY,
            self::GROUP_PLATFORM,
            self::GROUP_INFRASTRUCTURE,
            self::GROUP_FLOWS,
            self::GROUP_INTEGRATIONS,
        ];
    }
}
