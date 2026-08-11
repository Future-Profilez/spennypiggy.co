<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\Membership;
use App\Models\PiggyPot;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use Illuminate\Database\Eloquent\Builder;

/**
 * "Is this creator set up but selling nothing?"
 *
 * 43 of 47 creators have never published a listing, and 16 of those finished Stripe
 * onboarding — the hardest step — and then stopped. Every other conversion feature on the
 * platform assumes a listing exists, so for most creators none of it can do anything.
 */
class CreatorSetupService
{
    /**
     * The six tables a listing can live in, and the column that owns it.
     *
     * ⚠️ There is no single listings table, and the owner column is NOT uniform — `Task`
     * uses `creator_id` while everything else uses `user_id`. Miss one entry and that
     * creator is nudged forever, which is the worst failure this feature can have. Keeping
     * it as one map means adding a seventh listing type is a single row rather than an edit
     * in three places.
     */
    public const LISTING_SOURCES = [
        WishItem::class => 'user_id',
        Shop::class => 'user_id',
        Task::class => 'creator_id',
        PiggyPot::class => 'user_id',
        Bills::class => 'user_id',
        Membership::class => 'user_id',
    ];

    /** Where a creator is sent to publish. One definition — the email and the UI must agree. */
    public const FIRST_LISTING_PARAM = 'wish';

    /** Days after Stripe connect that each nudge goes out. The count IS the cap. */
    public const STAGES = [3, 10];

    /**
     * Does this creator own any listing at all, approved or not?
     *
     * Approval is not in their hands, so an unapproved listing still means the work is done
     * and the nudge must stop.
     */
    public function hasAnyListing(User $creator): bool
    {
        foreach (self::LISTING_SOURCES as $model => $ownerColumn) {
            // ⚠️ withScheduled(): a listing the creator SCHEDULED is work they have done.
            // The `published` global scope hides it from the public, and without this
            // opt-out it would also hide it from every "have you listed anything yet?"
            // check — so a creator who prepared a launch would be told to publish their
            // first item, emailed the first-listing nudge, and left stuck on that step of
            // their own journey. Being asked for work you have already done is how a
            // creator learns to ignore the next message.
            if ($model::withScheduled()->where($ownerColumn, $creator->id)->exists()) {
                return true;
            }
        }

        return false;
    }

    /**
     * Is this creator finished with setup but still selling nothing?
     *
     * ⚠️ The `role` check belongs HERE, not only at the call sites. Both current callers
     * happen to filter creators themselves, so omitting it caused no live bug — but a third
     * caller would silently start nudging fans to publish a listing they cannot create.
     */
    public function needsFirstListing(User $creator): bool
    {
        if ((int) ($creator->role ?? 0) !== 1) {
            return false;
        }

        // Before Stripe is done the existing setup nudge owns the screen, and two nudges at
        // once is noise.
        if ((int) ($creator->stripe_details_submitted ?? 0) !== 1) {
            return false;
        }

        if ((int) ($creator->suspended_account ?? 0) === 1) {
            return false;
        }

        return ! $this->hasAnyListing($creator);
    }

    /**
     * "Does this creator own any listing?" in ONE query instead of up to six.
     *
     * ⚠️ Deliberately separate from `needsFirstListingFast()`, which bundles the role,
     * Stripe and suspension conditions into the same statement. Those extra conditions make
     * it useless as a plain listing test: a creator who has not connected Stripe also
     * answers `false` there, which would read as "has a listing" to anyone using it that
     * way. Keep the two apart.
     */
    public function hasAnyListingFast(User $creator): bool
    {
        $query = User::query()->whereKey($creator->id);

        foreach (self::LISTING_SOURCES as $model => $ownerColumn) {
            $table = (new $model)->getTable();

            $query->whereNotExists(
                // ⚠️ withScheduled() for the same reason as hasAnyListing(): this
                // subquery is closed with toBase(), so EVERY global scope applies —
                // which is deliberate for soft-deletes and wrong for scheduling. A
                // scheduled listing must still count as a listing.
                $model::withScheduled()
                    ->selectRaw('1')
                    ->whereColumn($table.'.'.$ownerColumn, 'users.id')
                    ->toBase()
            );
        }

        // The row survives only when NO listing exists anywhere.
        return ! $query->exists();
    }

    /**
     * The same answer as `needsFirstListing()`, in ONE query instead of up to six.
     *
     * ⚠️ Use this on any per-request path. `needsFirstListing()` walks the six tables with
     * `exists()` and short-circuits, so a creator who already sells costs one query — but a
     * creator with **zero** listings costs all six, and that is precisely the cohort this
     * feature exists for. It is read on every Inertia navigation via the shared
     * `auth.needs_first_listing` prop, so the people being helped were paying the most for
     * it. Reusing `candidateQuery()` also means the screen and the emailer cannot disagree
     * about who is eligible.
     */
    public function needsFirstListingFast(User $creator): bool
    {
        return $this->candidateQuery()->whereKey($creator->id)->exists();
    }

    /**
     * The eligibility predicate, in SQL, so it cannot drift from `needsFirstListing()`.
     */
    public function candidateQuery(): Builder
    {
        $query = User::query()
            ->where('role', 1)
            ->where('stripe_details_submitted', 1)
            ->where('suspended_account', 0);

        foreach (self::LISTING_SOURCES as $model => $ownerColumn) {
            $table = (new $model)->getTable();

            // ⚠️ Built from the model's own builder and closed with toBase(), which applies
            // global scopes. All six of these models soft-delete, and a hand-written
            // `from($table)` subquery bypasses that scope — a soft-deleted listing would
            // still count as published and the creator would never be nudged again, while
            // hasAnyListing() (which does respect the scope) said the opposite. The two
            // must not be able to disagree.
            $query->whereNotExists(
                // ⚠️ withScheduled() for the same reason as hasAnyListing(): this
                // subquery is closed with toBase(), so EVERY global scope applies —
                // which is deliberate for soft-deletes and wrong for scheduling. A
                // scheduled listing must still count as a listing.
                $model::withScheduled()
                    ->selectRaw('1')
                    ->whereColumn($table.'.'.$ownerColumn, 'users.id')
                    ->toBase()
            );
        }

        return $query;
    }
}
