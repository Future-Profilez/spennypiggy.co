<?php

namespace App\Services;

use App\Models\BillPayment;
use App\Models\MembershipPayment;
use App\Models\Post;
use App\Models\User;
use App\StripeControl;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
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

    /**
     * Days a creator gets between being TOLD their posts are low and collection pausing.
     *
     * ⚠️ Enforcement exists for Stripe compliance — a membership must deliver content — and
     * three days costs that nothing. Income stopping with no notice costs the creator a lot,
     * and before this there was no gap at all: the run that noticed also paused.
     */
    public const WARNING_DAYS = 3;

    /** Post.for_module values that count as paid member content. */
    private const GATED_MODULES = ['membership', 'subscription'];

    /**
     * Post.type values that are system/auto-generated (shoutouts, support thank-you posts)
     * and must NOT count toward the creator's posting cadence — only genuine content does.
     */
    /**
     * Posts the PLATFORM writes on the creator's behalf (the thank-you post created on a
     * purchase), not posts the creator wrote.
     *
     * Public because `CreatorJourneyService` needs the same answer for its "have you posted
     * yet" step — a second copy of this list would let the journey credit a creator for a
     * post they never wrote, which is exactly the wrong-advice failure it exists to prevent.
     */
    public const SYSTEM_TYPES = ['support_thanks'];

    /**
     * Count a creator's genuine, approved member-content posts in the rolling window.
     * Excludes system/auto-generated posts (e.g. support thank-you / shoutout posts).
     */
    public function recentPostCount(User $creator): int
    {
        return $this->countingPostsQuery($creator)->count();
    }

    /**
     * ⚠️ The ONE definition of "a post that counts" — do not inline these
     * predicates a second time.
     *
     * This decides whether a creator's recurring income is paused for Stripe
     * compliance, and it is read by both the count and the window of publish
     * dates. Two copies drift, and the drift is silent: the number would say the
     * creator is safe while the window it is drawn from says otherwise.
     */
    private function countingPostsQuery(User $creator)
    {
        return Post::where('user_id', $creator->id)
            ->whereIn('for_module', self::GATED_MODULES)
            // Exclude system/auto posts, but keep genuine posts whose type is NULL
            // (whereNotIn alone would drop NULL-typed rows due to SQL NULL semantics).
            ->where(function ($q) {
                $q->whereNull('type')->orWhereNotIn('type', self::SYSTEM_TYPES);
            })
            ->where('approved', 1)
            ->where('created_at', '>=', now()->subDays(self::WINDOW_DAYS));
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
        // Read the window ONCE. The publish dates and the number are the same
        // rows, so a second COUNT(*) here would be both wasted and a chance for
        // the two to disagree.
        $windowStart = now()->subDays(self::WINDOW_DAYS);
        $publishedAt = $this->countingPostsQuery($creator)->orderBy('created_at')->pluck('created_at');
        $count = $publishedAt->count();
        $meets = $count >= self::MIN_POSTS;
        $paused = $creator->isContentPostingPaused();
        $oldestSub = $this->oldestActiveSubscriptionDate($creator);
        $pastGrace = $oldestSub !== null && $oldestSub <= now()->subDays(self::WINDOW_DAYS);
        $subscriberCount = $this->activeSubscriberCount($creator);

        // When the memberships would actually pause, in plain terms:
        //  - in grace  → the day the onboarding window closes (oldest sub + WINDOW_DAYS)
        //  - at risk    → the next daily enforcement run (11:00), i.e. within ~24h
        //  - otherwise  → no pending pause
        $graceEndsAt = $oldestSub ? $oldestSub->copy()->addDays(self::WINDOW_DAYS) : null;

        /*
        |--------------------------------------------------------------------------
        | Auto resume if creator has now met the posting requirement
        |--------------------------------------------------------------------------
        */
        if ($paused && $meets) {
            Log::info('Posting cadence: auto resuming creator', [
                'creator_id' => $creator->id,
                'member_posts' => $count,
            ]);

            $this->resumeCreator($creator);

            // refresh paused state
            $creator->refresh();

            $paused = $creator->isContentPostingPaused();
        }

        if ($paused) {
            $status = 'paused';
        } elseif ($meets) {
            $status = 'active';
        } elseif (! $pastGrace) {
            $status = 'grace';
        } else {
            $status = 'at_risk';
        }

        // A concrete deadline the creator can act on. Null once already paused.
        $pauseAt = null;
        if (! $paused && ! $meets) {
            if ($status === 'grace' && $graceEndsAt) {
                $pauseAt = $graceEndsAt;
            } elseif ($status === 'at_risk') {
                // Next 11:00 enforcement run.
                $next = now()->setTime(11, 0, 0);
                $pauseAt = $next->isPast() ? $next->addDay() : $next;
            }
        }

        // ⚠️ The dates the counting posts were published, oldest first.
        //
        // The count alone cannot express the thing that actually matters here:
        // this is a ROLLING window, so a post counting today drops out of it on a
        // specific date and the creator's total falls by one. A creator at 3 of 3
        // is not finished — they are 3 of 3 *until* their oldest post ages out.
        // A progress bar cannot say that; a window can.
        //
        // Drawn from countingPostsQuery() so the dates and the number can never
        // describe different sets of posts.
        $countingPosts = $publishedAt
            ->map(fn ($d) => [
                'at' => $d->toIso8601String(),
                // Where it sits in the window, 0 = about to drop out.
                'position' => round(
                    100 * $d->diffInSeconds($windowStart) / max(1, self::WINDOW_DAYS * 86400),
                    2
                ),
                'drops_out_at' => $d->copy()->addDays(self::WINDOW_DAYS)->toIso8601String(),
            ])
            ->values()
            ->all();

        return [
            'counting_posts' => $countingPosts,
            'member_posts' => $count,
            'required' => self::MIN_POSTS,
            'window_days' => self::WINDOW_DAYS,
            'meets' => $meets,
            'posts_needed' => max(0, self::MIN_POSTS - $count),
            'paused' => $paused,
            'paused_at' => $creator->content_posting_paused_at?->toIso8601String(),
            'past_grace' => $pastGrace,
            'status' => $status,
            // Countdown fields for the UI.
            'subscriber_count' => $subscriberCount,
            'grace_ends_at' => $graceEndsAt?->toIso8601String(),
            'pause_at' => $pauseAt?->toIso8601String(),
            // round() first: floatDiffInDays on an exact N-day gap returns N.0000000002,
            // and a bare ceil() would bump "3 days" to "4".
            'pause_in_days' => $pauseAt ? max(0, (int) ceil(round(now()->floatDiffInDays($pauseAt, false), 4))) : null,
            // What this state means for the creator's money, and what fixes it.
            'headline' => self::HEADLINES[$status] ?? $status,
            'consequence' => $this->consequenceFor($status, $subscriberCount, $pauseAt),
            'checklist' => $this->checklistFor($status, max(0, self::MIN_POSTS - $count), $countingPosts),
        ];
    }

    /**
     * The state in the creator's own words.
     *
     * ⚠️ The states were previously surfaced as the raw keys `grace` / `at_risk` /
     * `paused`, which say nothing about money to the person whose money it is.
     * `paused` in particular is the whole reason this system exists and read as a
     * neutral technical word: creators repeatedly did not understand that their
     * subscription income had stopped.
     */
    public const HEADLINES = [
        'grace' => 'You are getting set up',
        'active' => 'Your payments are running normally',
        'at_risk' => 'Your subscription payments are about to stop',
        'paused' => 'Your subscription payments have stopped',
    ];

    /**
     * One sentence naming the actual consequence — never the rule, always the money.
     *
     * A creator does not need to be told they are "below the posting threshold";
     * they need to be told they are not being paid and what restarts it.
     */
    private function consequenceFor(string $status, int $subscriberCount, ?Carbon $pauseAt): string
    {
        $people = $subscriberCount === 1 ? '1 subscriber' : "{$subscriberCount} subscribers";
        $on = $pauseAt ? $pauseAt->format('j M') : null;

        return match ($status) {
            'paused' => $subscriberCount > 0
                ? "Your {$people} are not being charged right now, so you are earning nothing from them. They keep their access and nobody has been cancelled — collection restarts automatically the moment you post again."
                : 'Your recurring subscriptions are not being charged right now. Collection restarts automatically the moment you post again.',
            'at_risk' => $on
                ? "If you do not post by {$on}, we stop charging your {$people} and that income stops until you do."
                : "If you do not post soon, we stop charging your {$people} and that income stops until you do.",
            'grace' => $on
                ? "Nothing has stopped. From {$on} you need to be posting regularly for your subscription payments to keep running."
                : 'Nothing has stopped. Keep posting regularly and your subscription payments keep running.',
            default => $subscriberCount > 0
                ? "Your {$people} are being charged as normal. Keep posting and nothing changes."
                : 'Everything is running normally.',
        };
    }

    /**
     * The steps that get a creator out of this state, in order.
     *
     * ⚠️ Every item must be something the creator can DO. "You are below the
     * threshold" is a diagnosis, not a step — the page it feeds was full of those,
     * which is why creators read it and still asked what was wrong.
     *
     * @param  array<int,array{at:string,drops_out_at:string,position:float}>  $countingPosts
     * @return array<int,array{key:string,label:string,detail:string,done:bool,cta_label:?string,cta_route:?string,cta_params:array}>
     */
    private function checklistFor(string $status, int $needed, array $countingPosts): array
    {
        $items = [];

        $items[] = [
            'key' => 'post',
            'label' => $needed > 0
                ? ($needed === 1
                    ? 'Publish 1 more post for members'
                    : "Publish {$needed} more posts for members")
                : 'Post for your members',
            'detail' => 'It must be posted to Members or Subscribers — a public post does not count, because your subscribers are paying for something only they get.',
            'done' => $needed === 0,
            'cta_label' => 'Write a post',
            'cta_route' => 'dashboard',
            // ?add=post opens the composer directly rather than the chooser.
            'cta_params' => ['add' => 'post'],
        ];

        // The next post to age out. A creator at 3 of 3 is only safe until then,
        // and the count alone cannot say so.
        $nextDropOut = collect($countingPosts)->sortBy('drops_out_at')->first();

        $items[] = [
            'key' => 'keep_posting',
            'label' => 'Keep at least '.self::MIN_POSTS.' posts inside the last '.self::WINDOW_DAYS.' days',
            'detail' => $nextDropOut
                ? 'This is a rolling window — your oldest post stops counting on '
                    .Carbon::parse($nextDropOut['drops_out_at'])->format('j M').'.'
                : 'This is a rolling window, so posts stop counting once they are '
                    .self::WINDOW_DAYS.' days old.',
            'done' => $needed === 0,
            'cta_label' => null,
            'cta_route' => null,
            'cta_params' => [],
        ];

        $items[] = [
            'key' => 'schedule',
            'label' => 'Schedule posts ahead so you never drop below',
            'detail' => 'Write several in one sitting and set each to publish on a different day. Scheduled posts count from the moment they go live.',
            'done' => false,
            'cta_label' => 'Schedule a post',
            'cta_route' => 'dashboard',
            'cta_params' => ['add' => 'post'],
        ];

        if ($status === 'paused') {
            array_unshift($items, [
                'key' => 'understand_pause',
                'label' => 'Nothing is cancelled — you do not need to contact anyone',
                'detail' => 'Your subscribers keep their access and their subscriptions stay in place. Charging restarts by itself once you meet the posting requirement.',
                'done' => true,
                'cta_label' => null,
                'cta_route' => null,
                'cta_params' => [],
            ]);
        }

        return $items;
    }

    /**
     * Earliest created_at across the creator's active recurring subscriptions (Bill + Membership),
     * or null when they have none. Shared by the grace-period check and the pause countdown so
     * both read the same date.
     */
    private function oldestActiveSubscriptionDate(User $creator): ?Carbon
    {
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

        return $oldest ? Carbon::parse($oldest) : null;
    }

    /**
     * Number of active recurring subscribers (Bill + Membership) whose charges pause when
     * the creator falls below the posting requirement.
     */
    public function activeSubscriberCount(User $creator): int
    {
        $bills = BillPayment::query()
            ->join('bills', 'bills.id', '=', 'bill_payments.bills_id')
            ->where('bills.user_id', $creator->id)
            ->where('bill_payments.status', 'paid')
            ->where('bill_payments.recurring_for', 'continue')
            ->whereNotNull('bill_payments.stripe_id')
            ->count();

        $memberships = MembershipPayment::query()
            ->join('memberships', 'memberships.id', '=', 'membership_payments.membership_id')
            ->where('memberships.user_id', $creator->id)
            ->where('membership_payments.status', 'paid')
            ->where('membership_payments.recurring_for', 'continue')
            ->whereNotNull('membership_payments.stripe_id')
            ->count();

        return $bills + $memberships;
    }

    /**
     * Grace period: a creator is only enforced once they've had an active subscription
     * for a full window. A brand-new creator (or a sub that just started) gets the first
     * WINDOW_DAYS to post before any pause — otherwise we'd pause a day-old subscription
     * for a creator who simply hasn't had time to post yet.
     */
    public function isPastGracePeriod(User $creator): bool
    {
        $oldest = $this->oldestActiveSubscriptionDate($creator);

        return $oldest !== null && $oldest <= now()->subDays(self::WINDOW_DAYS);
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
     * @return Collection<int,int> creator user ids
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
        $subIds = $this->activeSubscriptionIds($creator);
        $paused = 0;
        foreach ($subIds as $subId) {
            try {
                StripeControl::pauseSubscription($subId, $creator->account_id);
                $paused++;
            } catch (\Throwable $e) {
                Log::warning('PostingCadence: failed to pause subscription', [
                    'creator_id' => $creator->id,
                    'subscription' => $subId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Only claim "paused" if at least one subscription actually paused in Stripe.
        // Setting the flag after a total Stripe failure told subscribers "not being charged"
        // while every subscription was still live and billing — the exact opposite of true.
        if ($paused > 0 && ! $creator->content_posting_paused_at) {
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
        $subIds = $this->activeSubscriptionIds($creator);
        $resumed = 0;
        $failed = 0;
        foreach ($subIds as $subId) {
            try {
                StripeControl::resumeSubscription($subId, $creator->account_id);
                $resumed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::warning('PostingCadence: failed to resume subscription', [
                    'creator_id' => $creator->id,
                    'subscription' => $subId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        // Clear the paused flag only when nothing is still stuck paused: either something
        // resumed, or there are no active subscriptions left to resume. If every resume
        // call failed, keep the flag so the next run retries instead of falsely reporting
        // "active" while Stripe still has the subscriptions paused.
        if ($creator->content_posting_paused_at && $failed === 0) {
            $creator->content_posting_paused_at = null;
            $creator->save();
        }

        return $resumed;
    }
}
