<?php

namespace App\Support;

use App\Models\SocialLinks;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * "Is this creator actually with the review team?" — answered in exactly one place.
 *
 * 🚨 `profile_status_lock = 1` ALONE IS NOT "IN REVIEW", AND READING IT AS SUCH PUT 22
 * CREATORS IN A WAIT THAT COULD NEVER END (6 Sep 2026).
 *
 * The admin queue does not list a creator on the lock alone — `CreatorReviewService::
 * whereProfileComplete()` also requires a photo, a bio, a social handle and a card on
 * file. So a creator carrying the lock but missing one of those is in NO queue: no admin
 * can see them, nobody will ever decide, and nothing in the system says so. Meanwhile
 * `CreatorVerification.jsx` read the bare lock and told them *"Our team is checking it
 * now… there is nothing else to do"* — the exact opposite of the truth.
 *
 * Measured on the live database that day: **every one of the 22 creators at lock 1 was
 * invisible to the queue**, all 22 for want of a card, some waiting 36 days.
 *
 * Two states now, and they are not the same fact:
 *   - `with_team` — the lock is set AND the queue can see them. It is genuinely ours.
 *   - `blocked`   — the lock is set AND the queue cannot. It is still theirs.
 *
 * 🚨 THERE ARE TWO GATES HERE AND THEY ARE DIFFERENT QUESTIONS. `missing()` is the
 * SUBMIT gate and refuses a REJECTED asset; `queueBlockers()` is the QUEUE gate and
 * checks presence only, because that is all `whereProfileComplete()` checks. Read the
 * docblock on `queueBlockers()` before using either — using the wrong one tells a
 * creator to fix something that is not what holds them up.
 *
 * ⚠️ THE LOCK IS DELIBERATELY LEFT AT 1 FOR A BLOCKED SUBMISSION. Resetting it to 0
 * would make the creator press Submit a second time; leaving it means the moment they
 * add what is missing they satisfy `whereProfileComplete()` and appear in the admin
 * queue on their own, with no further action from anybody.
 *
 * ⚠️ THIS IS NOT A ONE-OFF BACKLOG. `User::$subscription_status` reads a live subscription
 * period, and `past_due` is not one — so a creator whose card is declined mid-review
 * drops out of the admin queue silently, exactly as these 22 did. That is why
 * `review:nudge-blocked` is scheduled rather than run once by hand.
 */
final class ReviewSubmission
{
    /** Never submitted, or turned down and not resubmitted. */
    public const STATE_NOT_SUBMITTED = 'not_submitted';

    /** Submitted, complete, genuinely waiting on an admin. */
    public const STATE_WITH_TEAM = 'with_team';

    /** Submitted, but something is missing — invisible to the queue, still their move. */
    public const STATE_BLOCKED = 'blocked';

    /** Approved and live. */
    public const STATE_APPROVED = 'approved';

    /**
     * What a creator still has to add before anyone reviews them.
     *
     * 🚨 THE ONE DEFINITION. It is read by the submit gate
     * (`ProfileController::updateProfileLockStatus`), by the state below, by the nudge
     * command and by the wording of the mail it sends. A second copy of this list is a
     * second answer waiting to disagree — which is how the review console once listed a
     * creator its own status panel reported nothing pending on.
     *
     * ⚠️ Cover and intro are deliberately absent — neither is reviewed, so neither can
     * block a submission.
     *
     * ⚠️ The strings are creator-facing and are used mid-sentence ("Add a bio and a
     * payment card before…"), so they carry their own article.
     *
     * @return array<int, string>
     */
    public static function missing(User $user): array
    {
        $missing = [];

        if (blank($user->avatar) || (int) $user->avatar_approved === 2) {
            $missing[] = 'a profile photo';
        }

        if (blank($user->bio) || (int) $user->bio_approved === 2) {
            $missing[] = 'a bio';
        }

        /*
         * 🚨 `$user->socialLinks` IS NOT A RELATION — the method is `social_links()`.
         *
         * Laravel resolves an unknown property to NULL rather than erroring, so this
         * read `null`, the check was false for everyone, and EVERY creator was told
         * "Add a social handle before submitting for review" with their handle on
         * screen behind the message. Nothing appeared in any log.
         *
         * ⚠️ The list of columns is NOT written out here either. It was an eight-item
         * subset of the fourteen the table has, so a creator whose only handle was on
         * a retired platform read as empty even once the relation was right.
         * `hasAnyHandle()` is the one definition and already answers exactly this.
         */
        if (! ProfileAssetVisibility::hasAnyHandle($user->social_links)
            || (int) ($user->social_links?->status ?? 0) === SocialLinks::STATUS_REJECTED) {
            $missing[] = 'a social handle';
        }

        /*
         * 🚨 THE CARD IS NOT HERE ANY MORE (client decision, 7 Sep 2026).
         *
         * It used to be the third of four requirements, asked before a human had
         * looked at the profile. Measured live: 21 creators ever started the card
         * checkout, 11 abandoned it, and the creator's OWN card is checked against
         * nothing — no fingerprint, no duplicate detection — so it filtered
         * motivation, not fraud. Every real gate (human review, Stripe Connect KYC,
         * Stripe Identity) sits AFTER it and nothing can be listed or paid without
         * them. The card is now asked once the profile is APPROVED, before payouts:
         * `StripeController::subscriptionGate()` still refuses Connect without one.
         */
        return $missing;
    }

    /**
     * What is holding this creator OUT OF THE ADMIN QUEUE.
     *
     * 🚨 NOT THE SAME QUESTION AS `missing()`, AND CONFLATING THE TWO IS A LIE IN
     * BOTH DIRECTIONS (found in review, 6 Sep 2026).
     *
     *   - `missing()` is the SUBMIT gate. It refuses a submit while an asset is
     *     REJECTED (`avatar_approved = 2`, `bio_approved = 2`, a rejected handle
     *     row), which is right: the creator has to fix it before asking again.
     *   - This is the QUEUE gate. `CreatorReviewService::whereProfileComplete()`
     *     checks PRESENCE only — `whereNotNull('users.avatar')`, `whereNotNull('users.bio')`,
     *     any handle column non-null — and never looks at an approval status. (A card
     *     was a fourth clause until 7 Sep 2026; it is asked after approval now.) So a
     *     creator holding a rejected handle and a card **IS** in the admin queue.
     *
     * Reading `missing()` here told 17 live creators "we cannot start the review
     * until you add a social handle" — a handle that exists, was reviewed, and was
     * turned down — and would have gone on saying it the moment they added a card,
     * while an admin was looking straight at them. The rejection itself is surfaced
     * separately on their own screen (`CreatorVerification`'s step state and its
     * reason), which is where a rejection belongs.
     *
     * ⚠️ Clause for clause against `whereProfileComplete()`. If that method changes,
     * change this in the same commit — they are the same question asked in two
     * languages, in two repositories.
     *
     * @return array<int, string>
     */
    public static function queueBlockers(User $user): array
    {
        $blockers = [];

        if (blank($user->avatar)) {
            $blockers[] = 'a profile photo';
        }

        if (blank($user->bio)) {
            $blockers[] = 'a bio';
        }

        // Presence only, and across every column the table HAS — a creator verified
        // on a retired platform still has a handle, and the queue counts it.
        if (! ProfileAssetVisibility::hasAnyHandle($user->social_links)) {
            $blockers[] = 'a social handle';
        }

        // ⚠️ No card clause — `whereProfileComplete()` dropped it on 7 Sep 2026
        // (card moved after approval). Same commit, both apps, or the two disagree.
        return $blockers;
    }

    /**
     * "a bio and a payment card" — a list a person can read.
     *
     * @param  array<int, string>  $items
     */
    public static function readableList(array $items): string
    {
        $items = array_values(array_filter($items));

        if (! $items) {
            return '';
        }

        if (count($items) === 1) {
            return $items[0];
        }

        $last = array_pop($items);

        return implode(', ', $items).' and '.$last;
    }

    /** Which of the four states this creator's submission is in. */
    public static function state(User $user): string
    {
        if ((int) ($user->role ?? 0) !== 1) {
            return self::STATE_NOT_SUBMITTED;
        }

        $lock = (int) ($user->profile_status_lock ?? 0);

        if ($lock === 2) {
            return self::STATE_APPROVED;
        }

        if ($lock !== 1) {
            return self::STATE_NOT_SUBMITTED;
        }

        // 🚨 THE QUEUE GATE, NOT THE SUBMIT GATE. See queueBlockers().
        return self::queueBlockers($user) ? self::STATE_BLOCKED : self::STATE_WITH_TEAM;
    }

    /** Submitted, complete, and genuinely waiting on an admin. */
    public static function isWithReviewTeam(User $user): bool
    {
        return self::state($user) === self::STATE_WITH_TEAM;
    }

    /** Submitted, but held out of the admin queue by something the creator can fix. */
    public static function isBlocked(User $user): bool
    {
        return self::state($user) === self::STATE_BLOCKED;
    }

    /**
     * Everything the creator's own screens need, or null when there is nothing to say.
     *
     * 🚨 NULL WHEN NOT SUBMITTED, deliberately. The panel renders on the PRESENCE of
     * this prop, and an object that is always sent is one truthiness slip away from
     * telling every creator their submission is blocked — the fault `SuspendedAccount`
     * documents for the suspension banner.
     *
     * ⚠️ Creators only. `/{username}` is also the public profile, so the caller must
     * gate this on the viewer being the owner; the role check here is a second lock,
     * not the first one.
     *
     * @return array{state: string, missing: array<int, string>}|null
     */
    public static function payload(?User $user): ?array
    {
        if (! $user || (int) ($user->role ?? 0) !== 1) {
            return null;
        }

        $state = self::state($user);

        if ($state === self::STATE_NOT_SUBMITTED) {
            return null;
        }

        return [
            'state' => $state,
            // Empty for `with_team` and `approved` — the shape stays the same either
            // way, so the page never has to test for the key's existence.
            // What holds them out of the QUEUE — never the submit gate's list, which
            // names a rejected asset the reviewer can already see.
            'missing' => $state === self::STATE_BLOCKED ? self::queueBlockers($user) : [],
        ];
    }

    /**
     * Creators carrying the lock — the candidates for a blocked submission.
     *
     * 🚨 THE BLOCKED TEST ITSELF IS NOT IN SQL, AND MUST NOT BE. `subscription_status`
     * is a computed accessor reading a live subscription period, and `has_any_handle`
     * walks fourteen columns — spelling either in a query is a second copy of
     * `missing()` that can drift from the one the submit gate and the mail both use.
     * The lock narrows the set to a review queue's worth of rows (22 when this was
     * written); `missing()` then decides, in PHP, on that handful.
     */
    public static function submittedQuery(): Builder
    {
        return User::query()
            ->where('role', 1)
            ->where('profile_status_lock', 1)
            ->whereNull('deleted_at');
    }
}
