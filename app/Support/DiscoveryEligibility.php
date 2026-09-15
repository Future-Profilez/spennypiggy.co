<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Schema;

/**
 * WHO MAY BE SHOWN ON A DISCOVERY SURFACE — the one definition.
 *
 * 🚨 THIS EXISTS BECAUSE THE RULE WAS ABOUT TO BE WRITTEN A THIRD TIME.
 * `CreatorRecommendationService` (Phase 3) and `BirthdayDiscoveryService`
 * (Phase 4) each carry their own copy, clause for clause, and
 * `BirthdayDiscoveryTest::test_both_discovery_services_agree_on_who_is_eligible`
 * exists solely to catch them drifting apart. That test is an admission: two
 * copies needed a guard, and Phase 5's ten collections would have made three.
 *
 * 🚨 EVERY CLAUSE HERE IS A PROMISE TO A SUPPORTER, NOT A FILTER. A Discovery
 * surface is Spenny Piggy CHOOSING to put a creator in front of someone:
 *   · `role = 1`               — a creator, not a fan account
 *   · `suspended_account = 0`  — never promote an account we have suspended
 *   · `profile_status_lock = 2`— the profile has been reviewed and is public
 *   · approved avatar + name + username — a card with a hole in it is not a
 *                                recommendation, it is a broken tile
 *   · `exclude_from_discovery` — the admin switch, and it is absolute
 *
 * ⚠️ `exclude_from_discovery` IS READ THROUGH `Schema::hasColumn`. Both apps
 * share one database and that column arrived with Phase 3; a missing column
 * would throw on every profile page rather than degrade, which is not a trade
 * any of these surfaces is worth. Same defensive pattern `DiscoveryService`
 * already uses.
 *
 * ⚠️ THIS CLASS DOES NOT DECIDE "HAS SOMETHING TO SELL". That gate is per
 * surface — Phase 3 requires a live sellable item, the birthday campaign
 * requires one too, but a "New to Spenny Piggy" collection may legitimately
 * want a creator who has only just arrived. Folding it in here would quietly
 * impose one surface's product rule on all of them.
 */
class DiscoveryEligibility
{
    /**
     * The columns every Discovery card is built from.
     *
     * ⚠️ A WHITELIST, NEVER `SELECT *`. These rows are turned into public cards,
     * and the one rule that governs every Discovery surface is that no money
     * figure and no private column can reach one by being added to the users
     * table. Naming the columns is what makes that structural rather than a
     * habit. `date_of_birth` is deliberately absent — see
     * `BirthdayDiscoveryService`, which builds "12 March" from day/month columns
     * precisely so the year is never in scope.
     */
    public const CARD_COLUMNS = [
        'id', 'name', 'username', 'role', 'created_at',
        'avatar', 'avatar_approved', 'avatar_cdn_modifier',
        'cover', 'cover_approved', 'cover_cdn_modifier',
        'bio', 'bio_approved', 'profile_status_lock',
        'identity_status', 'identity_admin_status', 'suspended_account',
        'content_posting_paused_at',
        /*
         * ⚠️ SELECTED SO A CARD CAN SAY WHY IT IS HERE, AND GATED ON IN
         * payable(). A Discovery card is an invitation to buy, so the columns
         * that decide whether buying is possible belong in the same whitelist
         * as the ones that draw the face.
         */
        'account_id', 'stripe_details_submitted', 'charges_enabled', 'charges_checked_at',
        /*
         * ⚠️ SELECTED, NEVER GATED ON. `country` is read by the supporter
         * recommendation row (CreatorRecommendationService::pickNearby) to put
         * one creator from the supporter's own country in front of them. It is
         * not a clause in scope() and must not become one — a creator is
         * eligible for discovery wherever they are, and filtering the pool by
         * country would empty the row for every supporter in a small market.
         */
        'country',
    ];

    /**
     * Apply the shared clauses to any `users` query.
     *
     * Takes and returns a Builder so a caller can add its own rules — a
     * collection that wants creators who joined this month adds that itself,
     * and cannot accidentally drop one of these.
     */
    /** @var array<string, bool> */
    private static array $columnCache = [];

    public static function scope(Builder|Relation $query): Builder|Relation
    {
        $query
            ->where('role', 1)
            ->where('suspended_account', 0)
            ->where('profile_status_lock', 2)
            ->where('avatar_approved', 1)
            ->whereNotNull('avatar')
            ->whereNotNull('username')
            ->where('username', '!=', '')
            ->whereNotNull('name')
            ->where('name', '!=', '');

        if (self::hasColumn('exclude_from_discovery')) {
            $query->where(function ($q) {
                $q->where('exclude_from_discovery', 0)
                    ->orWhereNull('exclude_from_discovery');
            });
        }

        return self::payable($query);
    }

    /**
     * CAN THIS CREATOR ACTUALLY BE BOUGHT FROM? — the one definition, and the
     * only Discovery clause that is about money rather than presentation.
     *
     * 🚨 A DISCOVERY SURFACE IS A PROMISE THAT THE UNLOCK BUTTON WORKS. Every
     * card on Discover carries a price and a button; a creator who has not
     * finished Stripe Connect, or whose account Stripe has since disabled, is
     * refused by `hasCardPaymentsCapability()` at the checkout — so promoting
     * them spends a supporter's click on a dead end, records a
     * `blocked_payment_attempts` row against a creator who did nothing wrong,
     * and teaches the supporter that the buttons on this site do not work.
     *
     * The three clauses, and why each is the one it is:
     *
     *   · `account_id LIKE 'acct%'` — a Stripe CONNECTED account exists.
     *     ⚠️ The pattern is `acct%`, not `acct_%`: `_` is a single-character
     *     WILDCARD in LIKE, so the underscore in the second form matches any
     *     character and says less than it looks like it says.
     *     ⚠️ The prefix is load-bearing, not decoration: this column has been
     *     found holding a Stripe CUSTOMER id (`cus_…`), which is why
     *     `StripeControl::ensureManualPayoutSchedule()` screens on the same
     *     prefix. A bare `whereNotNull` would pass that row.
     *
     *   · `stripe_details_submitted = 1` — onboarding was FINISHED. An account
     *     created and abandoned half way through carries an `acct_` id and can
     *     take nothing.
     *
     *   · NOT explicitly charges-disabled — `charges_enabled = 0` is honoured
     *     only when `charges_checked_at` says somebody actually asked Stripe.
     *
     * 🚨 A NULL `charges_checked_at` PASSES, DELIBERATELY, AND THAT IS THE
     * WEAKEST PART OF THIS RULE. `charges_enabled` defaults to 0 and was
     * written by nothing for years, so 0 means BOTH "Stripe says no" and
     * "nobody ever asked" — and `stripe:sync-charges-enabled` shipped with a
     * skip that stepped over exactly the rows Stripe reports as false, leaving
     * them unstamped. Reading an unstamped 0 as a refusal would therefore hide
     * healthy creators on the strength of a column nobody had filled in, which
     * is the costlier direction to be wrong in: a dead Unlock button is one bad
     * click, an unjustly hidden creator earns nothing and is never told why.
     *
     * ⚠️ ONCE `stripe:sync-charges-enabled` HAS RUN ON PRODUCTION (post-fix),
     * the column is authoritative and this should tighten to a plain
     * `charges_enabled = 1`. Until then, do not.
     *
     * ⚠️ THE PLATFORM SUBSCRIPTION IS NOT A CLAUSE HERE. `validateCreatorSubscription`
     * also refuses a creator whose own subscription lapsed, and it reads live
     * `monthly_charges` periods through an accessor — not expressible in this
     * query, and a SQL approximation that disagreed with the checkout would be
     * a second answer to the same question. Discovery is deliberately the
     * looser of the two.
     *
     * ⚠️ BOTH COLUMNS ARE READ THROUGH `Schema::hasColumn`. `charges_checked_at`
     * arrived 4 Sep 2026 and the apps share one database; a missing column must
     * degrade to "cannot judge", never throw on a public page.
     */
    /**
     * 🚨 A RELATION IS NOT A BUILDER, AND AN EAGER-LOAD CONSTRAINT IS HANDED A
     * RELATION.
     *
     * `->whereHas('user', fn ($q) => …)` passes a `Builder`; `->with(['user' =>
     * fn ($q) => …])` passes the `BelongsTo` itself (`Builder::eagerLoadRelation`
     * calls `$constraints($relation)`). The two read identically at a call site
     * and differ in type, so a `Builder` hint here turns one eager-load
     * constraint into a **TypeError on a public page** — measured live on
     * `/discover/creators/new/all` (Sentry JAVASCRIPT-REACT-C8), a 500 for every
     * visitor, with nothing wrong at the site that wrote it.
     *
     * ⚠️ Nothing else changes: `Relation::__call` forwards every builder method
     * and returns the Relation for a fluent call, so each clause below applies
     * exactly as it does to a Builder — including the nested closure, which
     * receives the underlying Builder either way.
     *
     * ⚠️ WIDENED HERE RATHER THAN FIXED AT THE CALL SITE. This class is the one
     * definition and is applied at ~38 sites; the next eager-load constraint to
     * ask for it would be the same 500, and the build cannot see it coming.
     */
    public static function payable(Builder|Relation $query): Builder|Relation
    {
        $query
            ->where('account_id', 'like', 'acct%')
            ->where('stripe_details_submitted', 1);

        if (self::hasColumn('charges_enabled') && self::hasColumn('charges_checked_at')) {
            $query->where(function ($q) {
                $q->whereNull('charges_checked_at')
                    ->orWhere('charges_enabled', 1);
            });
        }

        return $query;
    }

    /**
     * 🚨 `Schema::hasColumn` IS NOT A CHEAP CALL, AND THIS CLASS IS ASKED ~25
     * TIMES A REQUEST.
     *
     * On MySQL it reads `information_schema` for the WHOLE table to answer
     * whether one column exists, and `payable()` is applied at twenty sites in
     * `DiscoveryService` plus every collection, the recommendation row and the
     * birthday campaign — so a single cold `/discover` render, which builds
     * creators plus all six listing modules, paid for dozens of those probes to
     * answer three questions whose answers cannot change during a request.
     *
     * ⚠️ NOT MEMOISED UNDER `testing`, DELIBERATELY. A static outlives one test
     * and the suite mixes classes that migrate with classes that do not, so the
     * first class to ask would pin the answer for every class after it — one
     * test's database state silently deciding whether another test's clause runs
     * at all. Same rule, and the same reasoning, as
     * `BulkEmailAudience::suppressionTableExists()`.
     *
     * ⚠️ It is a PROCESS memo, so a long-running worker keeps its answer until
     * it restarts. That is safe here only because these columns have shipped and
     * a Vapor deploy gives a fresh container; restart queue workers after a
     * migration that adds one.
     */
    private static function hasColumn(string $column): bool
    {
        if (app()->environment('testing')) {
            return Schema::hasColumn('users', $column);
        }

        return self::$columnCache[$column] ??= Schema::hasColumn('users', $column);
    }
}
