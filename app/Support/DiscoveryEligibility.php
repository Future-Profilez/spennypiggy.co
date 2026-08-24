<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;
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
    ];

    /**
     * Apply the shared clauses to any `users` query.
     *
     * Takes and returns a Builder so a caller can add its own rules — a
     * collection that wants creators who joined this month adds that itself,
     * and cannot accidentally drop one of these.
     */
    public static function scope(Builder $query): Builder
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

        if (Schema::hasColumn('users', 'exclude_from_discovery')) {
            $query->where(function ($q) {
                $q->where('exclude_from_discovery', 0)
                    ->orWhereNull('exclude_from_discovery');
            });
        }

        return $query;
    }
}
