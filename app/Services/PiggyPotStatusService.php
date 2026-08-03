<?php

namespace App\Services;

use App\Models\PiggyPot;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;

/**
 * The ONE definition of whether a Piggy Pot is still open, whether it belongs on
 * the public profile, and — when it does not — what the creator has to do about it.
 *
 * Before this, three surfaces answered those questions separately and disagreed:
 * `PiggyPotPaymentController` refused a purchase once the deadline passed, while
 * `UserProfileService` filtered on `status` alone and happily rendered the same
 * pot in the profile's featured slot, and nothing anywhere flipped `status` to
 * `expired`. A creator's profile therefore advertised a pot that took the visitor
 * to a refusal — the worst of both — and the creator was never told.
 *
 * ⚠️ The deadline is inclusive of its own day (`endOfDay`). A creator picking
 * "31 August" means the pot runs to the end of that day, not to midnight at its
 * start. Every comparison here — object and query — must agree on that, or a pot
 * disappears from the profile a day before it stops taking money.
 */
class PiggyPotStatusService
{
    /** Statuses that mean the pot is closed for good, whatever its deadline says. */
    public const CLOSED_STATUSES = ['expired', 'completed', 'archived'];

    /**
     * Statuses a purchase is refused on. Kept here rather than inline in the
     * payment controller so the display layer and the money layer cannot drift.
     */
    public const UNPURCHASABLE_STATUSES = ['moderation_hold', 'archived', 'completed', 'expired'];

    /**
     * Has the pot's own deadline passed?
     *
     * Deliberately separate from `status` — this is the condition the sweep acts
     * ON, so it must still answer true for a pot whose status has not been
     * flipped yet (every pot in the database before this shipped).
     */
    // ⚠️ CarbonInterface, not Carbon. Two Carbon classes are in play across this
    // codebase — `Illuminate\Support\Carbon` (what a `datetime` cast returns) and
    // `Carbon\Carbon` (what most controllers import) — and they are unrelated
    // types to PHP. Typing this to either one makes the other a fatal TypeError
    // at the call site, which is how the reopen rule 500'd on its first real use.
    public static function deadlinePassed(?CarbonInterface $deadline): bool
    {
        return $deadline !== null && $deadline->copy()->endOfDay()->isPast();
    }

    /** Is this pot closed — by status or by its own deadline? */
    public static function isClosed(PiggyPot $pot): bool
    {
        return in_array($pot->status, self::CLOSED_STATUSES, true)
            || self::deadlinePassed($pot->deadline);
    }

    /** May money still be taken for this pot? */
    public static function isPurchasable(PiggyPot $pot): bool
    {
        return ! in_array($pot->status, self::UNPURCHASABLE_STATUSES, true)
            && ! self::deadlinePassed($pot->deadline);
    }

    /**
     * Constrain a query to pots that may appear on a PUBLIC profile.
     *
     * The status filter alone is not enough: a pot whose deadline passed an hour
     * ago is still `active` until the hourly sweep reaches it, and a visitor
     * clicking it gets a refusal. Both halves are required.
     *
     * @param  Builder<PiggyPot>  $query
     * @return Builder<PiggyPot>
     */
    public static function scopePubliclyVisible(Builder $query): Builder
    {
        return $query
            ->whereIn('status', ['active'])
            ->where(function ($q) {
                $q->whereNull('deadline')
                    // Inclusive of the deadline's own day — mirrors deadlinePassed().
                    ->orWhere('deadline', '>=', now()->startOfDay());
            });
    }

    /**
     * Pots the expiry sweep should close: live, dated, and past their date.
     *
     * @return Builder<PiggyPot>
     */
    public static function dueForExpiry(): Builder
    {
        return PiggyPot::query()
            ->where('status', 'active')
            ->whereNotNull('deadline')
            ->where('deadline', '<', now()->startOfDay());
    }

    /**
     * The pot the creator's PUBLIC profile is actually showing right now.
     *
     * Mirrors `UserProfileService::getOptimizedPiggyPots`' featured-slot rule —
     * the pinned pot when there is a visible one, otherwise the newest visible
     * pot — so the creator's dashboard cannot claim a pot is featured while the
     * profile shows a different one.
     *
     * ⚠️ Built from a closure, not a shared `$query` variable: Eloquent builders
     * are mutable, so reusing one would leave `is_pinned = true` attached to the
     * fallback lookup and the fallback would never find anything.
     */
    public static function featuredPotId(int $userId): ?int
    {
        $visible = fn () => self::scopePubliclyVisible(PiggyPot::where('user_id', $userId));

        $pinned = $visible()->where('is_pinned', true)->orderByDesc('created_at')->value('id');

        return $pinned ?: $visible()->orderByDesc('created_at')->value('id');
    }

    /**
     * Why this pot is (or is not) on the creator's public profile, in the
     * creator's own terms.
     *
     * A creator seeing their pinned pot vanish has one question — why, and what
     * fixes it. A status chip answers neither; four different states ("under
     * review", "deadline passed", "target reached", "another pot is featured")
     * each need a different action, and telling them apart is the whole point.
     *
     * @param  int|null  $featuredPotId  The pot currently occupying the profile's
     *                                   featured slot, when known. Without it this
     *                                   cannot distinguish "not featured" from
     *                                   "featured", so it stays quiet rather than
     *                                   guessing.
     * @return array{visible:bool,code:string,title:string,message:string,fix:?string}
     */
    public static function visibility(PiggyPot $pot, ?int $featuredPotId = null): array
    {
        if ($pot->status === 'moderation_hold') {
            return [
                'visible' => false,
                'code' => 'moderation_hold',
                'title' => 'Waiting for review',
                'message' => 'This pot is not on your profile yet. Our team is checking it.',
                'fix' => null,
            ];
        }

        if ($pot->status === 'archived') {
            return [
                'visible' => false,
                'code' => 'archived',
                'title' => 'Archived',
                'message' => 'You archived this pot, so it is not on your profile.',
                'fix' => 'Set its status back to Active to show it again.',
            ];
        }

        if ($pot->status === 'completed') {
            return [
                'visible' => false,
                'code' => 'completed',
                'title' => 'Finished — no longer on your profile',
                'message' => 'This pot reached its goal and is closed, so supporters no longer see it.',
                'fix' => 'Create a new pot to keep selling.',
            ];
        }

        // Checked before the `expired` status so a pot the sweep has not reached
        // yet gives the same answer as one it has.
        if (self::deadlinePassed($pot->deadline) || $pot->status === 'expired') {
            $on = $pot->deadline ? $pot->deadline->format('j M Y') : null;

            return [
                'visible' => false,
                'code' => 'deadline_passed',
                'title' => 'Deadline passed — hidden from your profile',
                'message' => $on
                    ? "This pot closed on {$on}. Supporters can no longer see or buy it, even though it is still pinned."
                    : 'This pot has closed. Supporters can no longer see or buy it.',
                'fix' => 'Edit the pot and set a new deadline to put it back on your profile.',
            ];
        }

        if ($featuredPotId !== null && $pot->id !== $featuredPotId) {
            return [
                'visible' => false,
                'code' => 'not_featured',
                'title' => 'Not the featured pot',
                'message' => 'Your profile shows one pot at a time and another one has the slot.',
                'fix' => 'Pin this pot to feature it instead.',
            ];
        }

        return [
            'visible' => true,
            'code' => 'live',
            'title' => 'Live on your profile',
            'message' => 'Supporters can see and buy this pot.',
            'fix' => null,
        ];
    }
}
