<?php

namespace App\Services\Pricing;

use App\Models\PlatformPricingVersion;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * WHERE the platform's advertised rate comes from.
 *
 * 🚨 `FeeModel` IS STILL THE ONE READ PATH. Nothing outside this namespace calls this
 * class — every surface asks `FeeModel`, and `FeeModel` asks here. What changed on
 * 11 Sep 2026 is only where the answer is FETCHED from, because the client's §3 asks
 * for pricing that moves without development work and config is baked into a deploy.
 *
 * THE CHAIN, in order, and a caller can never tell which link answered:
 *
 *   1. the published pricing version that is in force right now
 *      (`platform_pricing_versions`, written by admin.spennypiggy.co)
 *   2. `config/payments.php` — what a deploy shipped, and the state on the day this
 *      table is empty
 *   3. a hard-coded default, so a broken config still prices something sane
 *
 * 🚨 IT FAILS OPEN, UPWARDS. Any throwable — table missing, column added and not yet
 * migrated on one app, a database blip mid-checkout — falls back to config and logs.
 * The same rule `CreatorFeeResolver` follows, and for the same reason: a checkout that
 * charges the previous rate for one transaction is recoverable; a checkout that cannot
 * price itself is not.
 *
 * 🚨 A SCHEDULED VERSION IS NEVER READABLE FROM A PUBLIC SURFACE. The one resolution
 * query filters `effective_at <= now`, so a future rate cannot leak into the shared
 * `fees` Inertia prop, a help token, the comparison page or an API response. Client
 * direction: "do not expose future pricing plans publicly." The admin screen is the
 * only place a scheduled version is visible, and it reads the model directly.
 *
 * 🚨 HISTORY IS NOT RE-PRICED. Every charge freezes its own rates on the row
 * (`platform_fee_rate`, `stripe_fee_rate`, `fee_model`, `supporter_rate`) and every
 * recompute path passes them back as `$rateOverride`. A pricing change is FORWARD-ONLY
 * and needed no migration of existing transactions.
 */
final class PricingResolver
{
    public const CACHE_KEY = 'platform_pricing:current:v1';

    /**
     * ⚠️ DELIBERATELY SHORT, AND IT IS A CROSS-APP FACT RATHER THAN A PREFERENCE.
     * Pricing is published from the ADMIN app; the two apps share a database but NOT
     * a cache, so nothing the admin does can forget a key this app holds. A long TTL
     * bumped on write is therefore not available here — the same constraint, and the
     * same 60 seconds, as `CreatorFeeResolver::RATE_MAP_TTL`.
     *
     * ⚠️ The publishing app DOES bust its own copy immediately (`forget()`), so the
     * screen an operator is looking at never lies to them about what they just did.
     */
    public const CACHE_TTL = 60;

    /**
     * How long a resolved version may be pinned inside one process.
     *
     * 🚨 THIS IS THE RACE-SAFETY MECHANISM, not an optimisation. `FeeModel` is asked
     * several times while one charge is built — the price preview, the tier decision,
     * the charge itself — and a scheduled version landing between two of those calls
     * would compute one transaction at two rates. The memo pins ONE version for the
     * whole of a request, so that is structurally impossible.
     *
     * ⚠️ The freshness window exists for `queue:work`, which is one long-lived process
     * handling thousands of jobs: without it a worker started before a rate change
     * would price at the old rate until it was restarted.
     */
    private const MEMO_TTL = 30;

    /** @var array{taken_at: float, data: array}|null */
    private static ?array $memo = null;

    /** @var array<int, string|null> creator id => created_at, for the grandfather test */
    private static array $creatorAges = [];

    /*
     * Hard defaults: the state if config itself is broken.
     *
     * 🚨 BANK WAS 9.0 HERE UNTIL 12 Sep 2026 AND THAT WAS A PRE-D2 LEFTOVER.
     * Client decision D2 put BOTH rails on the same all-in 12% — the shipped
     * config was moved and this last-resort default was not, so a broken or
     * half-cached config would have quietly priced bank at 9%.
     *
     * ⚠️ That is not merely under-charging the platform. Below break-even the
     * CREATOR is short: Stripe's fixed component does not shrink with the sale,
     * so at 9% a bank payment stops covering itself around £5.67 while the
     * minimum listing is £4.99 — the platform fee clamps at zero and the
     * shortfall lands on the creator. `FeeModel::minimumSellable()` is the
     * calculation and `AllInFeeModelTest` fails the build on the SHIPPED config,
     * but it reads the config — it can never see this constant.
     */
    private const DEFAULTS = ['card' => 12.0, 'bank' => 12.0];

    /**
     * 🚨 CALL AFTER ANY WRITE, AND IN `Tests\TestCase::setUp()`.
     *
     * A PHPUnit run is ONE process and the memo is a static, so without the test-side
     * flush one test's published version would price every test after it — the exact
     * order-dependent failure `SeoMeta` caused and that `TestCase` already guards.
     * Production is unaffected either way: PHP-FPM gives each request a fresh process.
     */
    public static function forget(): void
    {
        self::$memo = null;
        self::$creatorAges = [];

        try {
            Cache::forget(self::CACHE_KEY);
        } catch (\Throwable $e) {
            // An unreachable cache must never be the reason a rate change fails to
            // save. The bounded TTL means the stale entry cannot outlive a minute.
            Log::warning('PricingResolver: could not clear the pricing cache', ['error' => $e->getMessage()]);
        }
    }

    /**
     * The pricing in force right now.
     *
     * @return array{source: string, version_id: int|null, label: string|null, model: string,
     *               rates: array<string, float>, fixed_fee_enabled: bool, fixed_fee_gbp: float,
     *               grandfather: array|null}
     */
    public static function current(): array
    {
        if (self::$memo !== null && (microtime(true) - self::$memo['taken_at']) < self::MEMO_TTL) {
            return self::settled(self::$memo['data']);
        }

        $data = self::load();

        self::$memo = ['taken_at' => microtime(true), 'data' => $data];

        return self::settled($data);
    }

    /**
     * ⚠️ WHEN NOTHING IS PUBLISHED, CONFIG IS RE-READ ON EVERY CALL — the memo and the
     * cache exist to avoid the DATABASE, and config is already in memory, so pinning it
     * buys nothing and costs correctness. `FEE_MODEL=legacy_markup` is an incident
     * lever; a `config()` override that took up to 30 seconds to be believed would make
     * it one nobody trusts, and every existing test that sets a rate with `config()`
     * would be asserting against a value from a previous test.
     *
     * ⚠️ This does NOT weaken the race safety the memo provides. Config cannot change
     * midway through a request in production — a deploy replaces the process. Only a
     * PUBLISHED version can land mid-request, and that is the branch the memo pins.
     */
    private static function settled(array $data): array
    {
        return ($data['source'] ?? 'config') === 'config' ? self::fromConfig() : $data;
    }

    /**
     * The all-in rate for a rail, for a creator (or for nobody, which is the
     * platform's advertised rate).
     *
     * ⚠️ A BESPOKE DEAL IS NOT RESOLVED HERE. `FeeModel::supporterRate()` asks
     * `CreatorFeeResolver` first and only falls through to this when the creator is on
     * standard terms — a negotiated rate beats a published version, including a
     * campaign, because it is an agreement with a named person rather than a platform
     * price. One decision, in one place, rather than two classes both claiming to know
     * which wins.
     */
    public static function rateFor(string $rail, ?int $creatorId = null): float
    {
        $version = self::applicableTo($creatorId);

        $rate = (float) ($version['rates'][$rail] ?? $version['rates']['card'] ?? self::DEFAULTS['card']);

        return $rate > 0 ? $rate : (float) (self::DEFAULTS[$rail] ?? self::DEFAULTS['card']);
    }

    /** The flat supporter fee in GBP, before any currency conversion. */
    public static function fixedFeeGbp(?int $creatorId = null): float
    {
        $version = self::applicableTo($creatorId);

        if (! $version['fixed_fee_enabled']) {
            return 0.0;
        }

        return max(0.0, (float) $version['fixed_fee_gbp']);
    }

    /**
     * 🚨 THE COMMERCIAL MODEL IS NOT PUBLISHABLE, AND THAT IS DELIBERATE.
     *
     * `FEE_MODEL=legacy_markup` is an INCIDENT LEVER — it switches the whole platform
     * back to the old stacked-fee arithmetic — and reading it off a published version
     * would mean the lever silently stopped working the moment anybody published a
     * price. A rate is a commercial decision an operator makes on a screen; which
     * formula the platform charges by is a deploy-level decision, and the two must not
     * be confused because one of them is the way out of an incident.
     *
     * ⚠️ `platform_pricing_versions.fee_model` is still RECORDED, so a history row says
     * which model a rate was set under. It is never read to price a charge.
     */
    public static function model(): string
    {
        return (string) config('payments.model', FeeModel::MODEL_ALL_IN);
    }

    /**
     * The version that prices THIS creator — the current one, unless they were
     * grandfathered off it.
     *
     * 🚨 GRANDFATHERING IS ABOUT WHEN THE ACCOUNT WAS CREATED, not when it started
     * selling. A version published with `grandfather_existing` pins everybody who
     * already had an account to the terms they signed up under; a creator who joins
     * afterwards gets the new rate. The pinned version is read BY ID and ignores its
     * own window, because it is a snapshot of a promise rather than a live version.
     *
     * ⚠️ Costs ONE extra query per creator per request, memoised, and ONLY while a
     * grandfather clause is actually in force. With no clause the creator id is never
     * looked up at all.
     */
    private static function applicableTo(?int $creatorId): array
    {
        $current = self::current();

        $grandfather = $current['grandfather'] ?? null;

        if ($grandfather === null || $creatorId === null) {
            return $current;
        }

        $createdAt = self::creatorCreatedAt($creatorId);

        // Unknown age is treated as NEW. The safe direction: the worst case is a
        // long-standing creator paying today's published rate for one transaction,
        // where the reverse silently applies a retired rate for ever.
        if ($createdAt === null) {
            return $current;
        }

        // ⚠️ PARSED, never compared as strings. The two values come from different
        // places — one straight off the database driver, one from Carbon — and a
        // fractional-seconds suffix on either side makes a lexical comparison answer
        // the wrong way round for a creator who signed up within a second of the
        // cutoff. A malformed value falls back to "new", the safe direction above.
        try {
            $joined = Carbon::parse($createdAt);
            $cutoff = Carbon::parse($grandfather['cutoff_at']);
        } catch (\Throwable $e) {
            return $current;
        }

        return $joined->lt($cutoff) ? $grandfather['version'] : $current;
    }

    private static function creatorCreatedAt(int $creatorId): ?string
    {
        if (array_key_exists($creatorId, self::$creatorAges)) {
            return self::$creatorAges[$creatorId];
        }

        try {
            $value = DB::table('users')->where('id', $creatorId)->value('created_at');
        } catch (\Throwable $e) {
            Log::warning('PricingResolver: could not read a creator age for grandfathering', [
                'creator_id' => $creatorId,
                'error' => $e->getMessage(),
            ]);

            $value = null;
        }

        return self::$creatorAges[$creatorId] = $value ? (string) $value : null;
    }

    /* --------------------------------------------------------------- loading -- */

    private static function load(): array
    {
        try {
            return Cache::remember(self::CACHE_KEY, self::ttl(), fn () => self::fromDatabase() ?? self::fromConfig());
        } catch (\Throwable $e) {
            Log::warning('PricingResolver: falling back to configured pricing', ['error' => $e->getMessage()]);

            return self::fromConfig();
        }
    }

    /**
     * 🚨 THE CACHE ENTRY CAN NEVER OUTLIVE THE NEXT SCHEDULED CHANGE.
     *
     * A scheduled version becomes due with nobody pressing anything, so there is no
     * publish event to bust on — the entry has to expire by itself, exactly then. The
     * TTL is therefore the shorter of the standard window and the time remaining until
     * the next boundary (a scheduled `effective_at`, or a campaign's `ends_at`).
     *
     * ⚠️ Floored at one second: a boundary in the past or this very second would
     * otherwise ask the cache for a zero or negative TTL, which some stores read as
     * "forever".
     */
    private static function ttl(): int
    {
        try {
            $now = Carbon::now();

            $next = PlatformPricingVersion::query()
                ->whereNull('cancelled_at')
                ->where('effective_at', '>', $now)
                ->min('effective_at');

            $endsAt = PlatformPricingVersion::query()
                ->applicableAt($now)
                ->value('ends_at');

            $boundaries = array_values(array_filter([
                $next ? Carbon::parse($next) : null,
                $endsAt ? Carbon::parse($endsAt) : null,
            ]));

            if ($boundaries === []) {
                return self::CACHE_TTL;
            }

            usort($boundaries, fn ($a, $b) => $a <=> $b);

            $seconds = (int) floor(Carbon::now()->diffInSeconds($boundaries[0], false));

            return max(1, min(self::CACHE_TTL, $seconds));
        } catch (\Throwable $e) {
            return self::CACHE_TTL;
        }
    }

    private static function fromDatabase(): ?array
    {
        $now = Carbon::now();

        $version = PlatformPricingVersion::query()->applicableAt($now)->first();

        if (! $version) {
            return null;
        }

        $grandfather = null;

        if ($version->grandfather_existing && $version->grandfathered_from_id) {
            $pinned = PlatformPricingVersion::query()->find($version->grandfathered_from_id);

            if ($pinned) {
                $grandfather = [
                    // ⚠️ The cutoff is the NEW version's start, not the pinned one's:
                    // "everybody who was here before the price went up".
                    'cutoff_at' => $version->effective_at?->toDateTimeString() ?? $now->toDateTimeString(),
                    'version' => self::shape($pinned, null),
                ];
            }
        }

        return self::shape($version, $grandfather);
    }

    private static function shape(PlatformPricingVersion $version, ?array $grandfather): array
    {
        return [
            'source' => 'database',
            'version_id' => (int) $version->id,
            'label' => (string) $version->label,
            'model' => (string) ($version->fee_model ?: FeeModel::MODEL_ALL_IN),
            'rates' => [
                'card' => (float) $version->rate_card,
                'bank' => (float) $version->rate_bank,
            ],
            'fixed_fee_enabled' => (bool) $version->fixed_fee_enabled,
            'fixed_fee_gbp' => (float) $version->fixed_fee_gbp,
            'grandfather' => $grandfather,
        ];
    }

    /**
     * What a deploy shipped — the state on the day the table is empty, and the answer
     * whenever the database cannot be read.
     */
    public static function fromConfig(): array
    {
        $card = (float) config('payments.all_in.card', self::DEFAULTS['card']);
        $bank = (float) config('payments.all_in.bank', self::DEFAULTS['bank']);

        return [
            'source' => 'config',
            'version_id' => null,
            'label' => null,
            'model' => (string) config('payments.model', FeeModel::MODEL_ALL_IN),
            'rates' => [
                'card' => $card > 0 ? $card : self::DEFAULTS['card'],
                'bank' => $bank > 0 ? $bank : self::DEFAULTS['bank'],
            ],
            'fixed_fee_enabled' => (bool) config('payments.fixed_fee.enabled', false),
            'fixed_fee_gbp' => (float) config('payments.fixed_fee.amount_gbp', 0),
            'grandfather' => null,
        ];
    }
}
