<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\Post;
use App\Models\User;
use App\StripeControl;
use Illuminate\Support\Facades\Log;

/**
 * Stripe compliance: a content membership must deliver content. A creator who sells
 * Bills / Memberships must post at least MIN_POSTS pieces of member content within a
 * rolling WINDOW_DAYS window. If they don't, their active subscriptions are paused
 * (no new charges) until they post again.
 *
 * Pause/resume uses Stripe pause_collection (behavior: void) and is fully reversible.
 */
class PostingCadenceService
{
    public const WINDOW_DAYS = 30;
    public const MIN_POSTS = 3;

    /** Post.for_module values that count as paid member content. */
    private const GATED_MODULES = ['membership', 'subscription'];

    /**
     * Post.type values that are system/auto-generated (shoutouts, support thank-you posts)
     * and must NOT count toward the creator's posting cadence — only genuine content does.
     */
    private const SYSTEM_TYPES = ['support_thanks'];

    /**
     * Count a creator's genuine, approved member-content posts in the rolling window.
     * Excludes system/auto-generated posts (e.g. support thank-you / shoutout posts).
     */
    public function recentPostCount(User $creator): int
    {
        return Post::where('user_id', $creator->id)
            ->whereIn('for_module', self::GATED_MODULES)
            // Exclude system/auto posts, but keep genuine posts whose type is NULL
            // (whereNotIn alone would drop NULL-typed rows due to SQL NULL semantics).
            ->where(function ($q) {
                $q->whereNull('type')->orWhereNotIn('type', self::SYSTEM_TYPES);
            })
            ->where('approved', 1)
            ->where('created_at', '>=', now()->subDays(self::WINDOW_DAYS))
            ->count();
    }

    public function meetsThreshold(User $creator): bool
    {
        return $this->recentPostCount($creator) >= self::MIN_POSTS;
    }

    /**
     * Display payload for the creator's posting-cadence status (dashboard widget +
     * activity page). Pure read — does not pause/resume anything.
     *
     * @return array{member_posts:int,required:int,window_days:int,meets:bool,posts_needed:int,paused:bool,paused_at:?string,past_grace:bool,status:string}
     */
    public function statusFor(User $creator): array
    {
        $count = $this->recentPostCount($creator);
        $meets = $count >= self::MIN_POSTS;
        $paused = $creator->isContentPostingPaused();
        $pastGrace = $this->isPastGracePeriod($creator);

        if ($paused) {
            $status = 'paused';
        } elseif ($meets) {
            $status = 'active';
        } elseif (! $pastGrace) {
            $status = 'grace';
        } else {
            $status = 'at_risk';
        }

        return [
            'member_posts' => $count,
            'required' => self::MIN_POSTS,
            'window_days' => self::WINDOW_DAYS,
            'meets' => $meets,
            'posts_needed' => max(0, self::MIN_POSTS - $count),
            'paused' => $paused,
            'paused_at' => $creator->content_posting_paused_at?->toIso8601String(),
            'past_grace' => $pastGrace,
            'status' => $status,
        ];
    }

    /**
     * Grace period: a creator is only enforced once they've had an active subscription
     * for a full window. A brand-new creator (or a sub that just started) gets the first
     * WINDOW_DAYS to post before any pause — otherwise we'd pause a day-old subscription
     * for a creator who simply hasn't had time to post yet.
     */
    public function isPastGracePeriod(User $creator): bool
    {
        $cutoff = now()->subDays(self::WINDOW_DAYS);

        $oldestBill = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->where('bills.user_id', $creator->id)
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->min('bill_payments.created_at');

        $oldestMembership = MembershipPayment::query()
            ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
            ->where('memberships.user_id', $creator->id)
            ->where('membership_payments.status', 'paid')
            ->where('membership_payments.recurring_for', 'continue')
            ->whereNotNull('membership_payments.stripe_id')
            ->min('membership_payments.created_at');

        $oldest = collect([$oldestBill, $oldestMembership])->filter()->min();

        return $oldest !== null && $oldest <= $cutoff;
    }

    /**
     * Stripe subscription IDs for a creator's currently-active recurring subscribers
     * (both Bills and Memberships).
     *
     * @return string[]
     */
    public function activeSubscriptionIds(User $creator): array
    {
        $bill = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->where('bills.user_id', $creator->id)
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->pluck('bill_payments.stripe_id')
            ->all();

        $membership = MembershipPayment::query()
            ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
            ->where('memberships.user_id', $creator->id)
            ->where('membership_payments.status', 'paid')
            ->where('membership_payments.recurring_for', 'continue')
            ->whereNotNull('membership_payments.stripe_id')
            ->pluck('membership_payments.stripe_id')
            ->all();

        // Stripe subscription IDs start with "sub_"; ignore one-off payment-intent ids.
        return array_values(array_unique(array_filter(
            array_merge($bill, $membership),
            fn ($id) => is_string($id) && str_starts_with($id, 'sub_')
        )));
    }

    /**
     * Creators who currently have at least one active recurring subscriber
     * (only these need cadence enforcement).
     *
     * @return \Illuminate\Support\Collection<int,int> creator user ids
     */
    public function creatorsWithActiveSubscribers()
    {
        $billCreators = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->distinct()
            ->pluck('bills.user_id');

        $membershipCreators = MembershipPayment::query()
            ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
            ->where('membership_payments.status', 'paid')
            ->where('membership_payments.recurring_for', 'continue')
            ->whereNotNull('membership_payments.stripe_id')
            ->distinct()
            ->pluck('memberships.user_id');

        return $billCreators->merge($membershipCreators)->unique()->values();
    }

    /**
     * Pause a creator's active subscriptions (best-effort per subscription).
     *
     * @return int number of subscriptions paused
     */
    public function pauseCreator(User $creator): int
    {
        $paused = 0;
        foreach ($this->activeSubscriptionIds($creator) as $subId) {
            try {
                StripeControl::pauseSubscription($subId, $creator->account_id);
                $paused++;
            } catch (\Throwable $e) {
                Log::warning('PostingCadence: failed to pause subscription', [
                    'creator_id' => $creator->id, 'subscription' => $subId, 'error' => $e->getMessage(),
                ]);
            }
        }

        if (! $creator->content_posting_paused_at) {
            $creator->content_posting_paused_at = now();
            $creator->save();
        }

        return $paused;
    }

    /**
     * Resume a creator's paused subscriptions (best-effort per subscription).
     *
     * @return int number of subscriptions resumed
     */
    public function resumeCreator(User $creator): int
    {
        $resumed = 0;
        foreach ($this->activeSubscriptionIds($creator) as $subId) {
            try {
                StripeControl::resumeSubscription($subId, $creator->account_id);
                $resumed++;
            } catch (\Throwable $e) {
                Log::warning('PostingCadence: failed to resume subscription', [
                    'creator_id' => $creator->id, 'subscription' => $subId, 'error' => $e->getMessage(),
                ]);
            }
        }

        if ($creator->content_posting_paused_at) {
            $creator->content_posting_paused_at = null;
            $creator->save();
        }

        return $resumed;
    }
}
