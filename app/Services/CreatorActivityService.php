<?php

namespace App\Services;

use App\Models\Bills;
use App\Models\BlockedPayment;
use App\Models\Membership;
use App\Models\Post;
use App\Models\Shop;
use App\Models\Task;
use App\Models\User;
use App\Models\WishItem;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class CreatorActivityService
{
    const REQUIRED_CONTENT_COUNT = 3;

    const ACTIVITY_PERIOD_DAYS = 28;

    const GRACE_PERIOD_DAYS = 0;

    /** Per-request memo of content breakdowns, keyed by creator id. */
    private array $breakdownCache = [];

    /**
     * Main method to validate creator's payment eligibility
     */
    public function validateCreatorActivity(User $creator): array
    {
        try {
            // Only applies to creators
            if ($creator->role !== 1) {
                return [
                    'eligible' => true,
                    'status' => 'not_creator',
                    'message' => 'Activity validation only applies to creators',
                ];
            }

            // Check if creator is fully verified
            if (! $this->isFullyVerified($creator)) {
                return [
                    'eligible' => true,
                    'status' => 'not_fully_verified',
                    'message' => 'Complete verification to enable activity requirements',
                ];
            }

            // Check if in grace period using virtual accessor
            if ($creator->is_in_grace_period) {
                $graceBreakdown = $this->getContentBreakdown($creator);
                $graceCount = array_sum($graceBreakdown);

                return [
                    'eligible' => true,
                    'status' => 'grace_period',
                    'message' => "🌟 Onboarding period active - {$creator->grace_period_days_remaining} days remaining",
                    'days_remaining' => $creator->grace_period_days_remaining,
                    'grace_period_ends' => $creator->grace_period_ends_at,
                    'content_count' => $graceCount,
                    'current_content' => $graceCount,
                    'required' => self::REQUIRED_CONTENT_COUNT,
                    'period_days' => self::ACTIVITY_PERIOD_DAYS,
                    'needed' => max(0, self::REQUIRED_CONTENT_COUNT - $graceCount),
                    'breakdown' => $graceBreakdown,
                ];
            }

            // After grace period - check content requirements
            $contentBreakdown = $this->getContentBreakdown($creator);
            $contentActivity = array_sum($contentBreakdown);

            if ($contentActivity >= self::REQUIRED_CONTENT_COUNT) {
                return [
                    'eligible' => true,
                    'status' => 'active',
                    'content_count' => $contentActivity,
                    // Alias kept because the activity page reads `current_content` in every branch.
                    'current_content' => $contentActivity,
                    'required' => self::REQUIRED_CONTENT_COUNT,
                    'period_days' => self::ACTIVITY_PERIOD_DAYS,
                    'needed' => 0,
                    'breakdown' => $contentBreakdown,
                    'message' => "✅ Active creator with {$contentActivity} recent items",
                ];
            }

            // Not enough content - block payment
            return [
                'eligible' => false,
                'status' => 'insufficient_content',
                'content_count' => $contentActivity,
                'current_content' => $contentActivity,
                'required' => self::REQUIRED_CONTENT_COUNT,
                'period_days' => self::ACTIVITY_PERIOD_DAYS,
                'breakdown' => $contentBreakdown,
                'needed' => self::REQUIRED_CONTENT_COUNT - $contentActivity,
                'message' => '📝 Add '.(self::REQUIRED_CONTENT_COUNT - $contentActivity).' more content items to continue receiving payments',
                'suggestions' => $this->getContentSuggestions($contentBreakdown, $creator),
            ];

        } catch (\Exception $e) {
            Log::error('CreatorActivityService validation error: '.$e->getMessage());

            // Fail safely - allow payment but log error
            return [
                'eligible' => true,
                'status' => 'error',
                'message' => 'Activity validation temporarily unavailable',
            ];
        }
    }

    /**
     * Post.type values that are system/auto-generated and must NOT count as creator content.
     * Mirrors PostingCadenceService::SYSTEM_TYPES.
     */
    private const SYSTEM_POST_TYPES = ['support_thanks'];

    /**
     * Get total count of recent content items (approved only).
     *
     * Derived from getContentBreakdown() so the headline number can never disagree with
     * the per-type breakdown shown next to it (they used to be two separate query sets).
     */
    public function getRecentContentCount(User $creator): int
    {
        return array_sum($this->getContentBreakdown($creator));
    }

    /**
     * Get detailed breakdown of content types.
     *
     * Memoised per request: validateCreatorActivity() needs both the count and the
     * breakdown, and this runs on payment paths — without this it fired 12 queries per call.
     */
    public function getContentBreakdown(User $creator): array
    {
        if (isset($this->breakdownCache[$creator->id])) {
            return $this->breakdownCache[$creator->id];
        }

        $since = Carbon::now()->subDays(self::ACTIVITY_PERIOD_DAYS);

        return $this->breakdownCache[$creator->id] = [
            // NOTE: `type != 'support_thanks'` alone silently drops rows where type IS NULL
            // (SQL NULL comparison is never true), so genuine untyped posts stopped counting
            // and creators were blocked from payments they had earned.
            'posts' => Post::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->where(function ($q) {
                    $q->whereNull('type')->orWhereNotIn('type', self::SYSTEM_POST_TYPES);
                })
                ->count(),

            'wishes' => WishItem::where('user_id', $creator->id)
                ->where('is_approved', 1)
                ->where('created_at', '>=', $since)
                ->count(),

            'memberships' => Membership::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count(),

            'shops' => Shop::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count(),

            'bills' => Bills::where('user_id', $creator->id)
                ->where('approved', 1)
                ->where('created_at', '>=', $since)
                ->count(),

            'tasks' => Task::where('creator_id', $creator->id)
                ->where('is_approved', 1)
                ->where('created_at', '>=', $since)
                ->count(),
        ];
    }

    /**
     * Get content suggestions based on what they're missing
     */
    public function getContentSuggestions(array $breakdown, ?User $creator = null): array
    {
        $creator = $creator ?: auth()->user();
        $profile = $creator && $creator->username ? '/'.$creator->username : '/dashboard';

        /*
         * URLs are real, reachable creator pages. The previous list pointed at
         * /posts/create, /wishes/create, /memberships/create and /shop/create — none of
         * which exist as routes, so every "fix this" link in the empty state 404'd.
         */
        $catalogue = [
            'posts' => ['📝', 'Add a Post', 'Share an update, photo or note with your members', $profile.'?page=about', '2 minutes'],
            'wishes' => ['🎁', 'Create a Wish Item', 'List a one-off piece of content fans can unlock', $profile.'?page=wishes', '5 minutes'],
            'memberships' => ['💎', 'Set Up a Membership', 'Recurring content bundles for your members', '/membership-dashboard', '10 minutes'],
            'shops' => ['🛍️', 'Add a Shop Item', 'Sell a product or digital download directly', '/shop', '7 minutes'],
            'bills' => ['🧾', 'Add a Subscription', 'A recurring content subscription your fans can join', '/billing-dashboard', '5 minutes'],
            'tasks' => ['📋', 'Create a Paid Task', 'Offer a personalised creator service', '/task/create', '5 minutes'],
        ];

        $suggestions = [];

        foreach ($catalogue as $type => [$icon, $title, $description, $url, $time]) {
            if (($breakdown[$type] ?? 0) === 0) {
                $suggestions[] = [
                    'type' => $type,
                    'icon' => $icon,
                    'title' => $title,
                    'description' => $description,
                    'action_url' => $url,
                    'estimated_time' => $time,
                ];
            }
        }

        return $suggestions;
    }

    /**
     * Check if creator is fully verified and ready to receive payments
     */
    private function isFullyVerified(User $creator): bool
    {
        // Skip verification check - always return true for creators
        return $creator->role == 1;

        // Original verification logic (commented out):
        // return $creator->role == 1 && // Is creator
        //        $creator->is_subscribed == 1 && // Has subscription
        //        $creator->profile_status_lock == 2 && // Profile approved
        //        $creator->identity_status == 1 && // Identity verified
        //        $creator->stripe_details_submitted == 1; // Stripe connected
    }

    /**
     * Clear activity cache for a creator (call when new content is approved)
     */
    public function clearActivityCache(User $creator): void
    {
        // No external cache — but drop the per-request breakdown memo so a caller that
        // creates content and then re-reads the breakdown in the same request (e.g. savePost)
        // sees the new count, not the pre-insert snapshot.
        unset($this->breakdownCache[$creator->id]);
    }

    /**
     * Get activity status for dashboard display
     */
    public function getActivityStatus(User $creator): array
    {
        $validation = $this->validateCreatorActivity($creator);

        return [
            'status' => $validation['status'],
            'message' => $validation['message'],
            'eligible' => $validation['eligible'],
            'content_count' => $validation['content_count'] ?? 0,
            'breakdown' => $validation['breakdown'] ?? [],
            'suggestions' => $validation['suggestions'] ?? [],
            'grace_period' => [
                'active' => $creator->is_in_grace_period,
                'days_remaining' => $creator->grace_period_days_remaining,
                'ends_at' => $creator->grace_period_ends_at,
            ],
        ];
    }

    /**
     * Get creators who need activity warnings
     */
    public function getCreatorsNeedingWarnings(): Collection
    {
        return User::where('role', 1)
            ->where('is_subscribed', 1)
            ->where('profile_status_lock', 2)
            ->where('identity_status', 1)
            ->where('stripe_details_submitted', 1)
            ->get()
            ->filter(function ($creator) {
                $validation = $this->validateCreatorActivity($creator);

                // Send warnings to creators who are:
                // 1. Out of grace period and have insufficient content
                // 2. In grace period but ending soon with insufficient content
                return ($validation['status'] === 'insufficient_content') ||
                       ($validation['status'] === 'grace_period' &&
                        $validation['days_remaining'] <= 7 &&
                        $validation['current_content'] < self::REQUIRED_CONTENT_COUNT);
            });
    }

    /**
     * Get inactive creators (for admin monitoring)
     */
    public function getInactiveCreators(): Collection
    {
        return User::where('role', 1)
            ->where('is_subscribed', 1)
            ->where('profile_status_lock', 2)
            ->where('identity_status', 1)
            ->where('stripe_details_submitted', 1)
            ->get()
            ->filter(function ($creator) {
                $validation = $this->validateCreatorActivity($creator);

                return $validation['status'] === 'insufficient_content';
            });
    }

    /**
     * Validate payment and log if blocked
     */
    public function validatePaymentAndLog(User $creator, array $paymentData): array
    {
        // Exempt bill payments from activity restriction
        if (($paymentData['payment_type'] ?? null) === 'bill') {
            return [
                'eligible' => true,
                'status' => 'bill_exempt',
                'message' => 'Bill payments bypass activity restriction',
            ];
        }

        $validation = $this->validateCreatorActivity($creator);

        // If payment is not eligible, log the blocked payment
        if (! $validation['eligible']) {
            $this->logBlockedPayment($creator, $paymentData, $validation);
        }

        return $validation;
    }

    /**
     * Log blocked payment attempt
     */
    public function logBlockedPayment(User $creator, array $paymentData, ?array $activityValidation = null): BlockedPayment
    {
        // Get payer information if available
        $payer = $paymentData['payer'] ?? auth()->user();
        $payerInfo = null;

        if ($payer) {
            $payerInfo = [
                'id' => $payer->id,
                'name' => $payer->name,
                'username' => $payer->username ?? null,
                'email' => $payer->email ?? null,
            ];
        }

        // Prepare blocked payment data
        $blockedData = [
            'creator_id' => $creator->id,
            'payer_id' => $payer->id ?? null,
            'amount' => $paymentData['amount'] ?? 0,
            'currency' => $paymentData['currency'] ?? 'USD',
            'payment_type' => $paymentData['payment_type'] ?? 'unknown',
            'payment_method' => $paymentData['payment_method'] ?? 'stripe',
            'blocked_reason' => $activityValidation['status'] ?? 'insufficient_content',
            'activity_data' => $activityValidation,
            'payer_info' => $payerInfo,
            'payment_metadata' => $paymentData['metadata'] ?? null,
        ];

        // Log the blocked payment
        $blockedPayment = BlockedPayment::logBlockedPayment($blockedData);

        // Log to Laravel log as well
        Log::warning('Payment blocked due to creator inactivity', [
            'blocked_payment_id' => $blockedPayment->id,
            'creator_id' => $creator->id,
            'creator_username' => $creator->username,
            'amount' => $paymentData['amount'] ?? 0,
            'payment_type' => $paymentData['payment_type'] ?? 'unknown',
            'blocked_reason' => $activityValidation['status'] ?? 'insufficient_content',
            'content_count' => $activityValidation['content_count'] ?? 0,
        ]);

        return $blockedPayment;
    }

    /**
     * Get recent blocked payments for a creator
     */
    public function getRecentBlockedPayments(User $creator, int $days = 30): array
    {
        $blockedPayments = BlockedPayment::forCreator($creator->id)
            ->recent($days)
            ->with(['payer'])
            ->orderBy('blocked_at', 'desc')
            ->get();

        $totalBlocked = $blockedPayments->sum('amount');
        $lastBlockedAt = $blockedPayments->first()?->blocked_at;

        return [
            'count' => $blockedPayments->count(),
            'last_blocked_at' => $lastBlockedAt ? $lastBlockedAt->toISOString() : null,
            'last_blocked_at_human' => $lastBlockedAt ? $lastBlockedAt->diffForHumans() : null,
            'total_amount_blocked' => number_format((float) $totalBlocked, 2, '.', ''),
            'currency' => $blockedPayments->first()?->currency ?? 'USD',
            'recent_attempts' => $blockedPayments->take(10)->map(function ($blocked) {
                return [
                    'id' => $blocked->uuid,
                    'amount' => $blocked->formatted_amount,
                    'payment_type' => $blocked->payment_type,
                    'blocked_reason' => $blocked->blocked_reason,
                    'blocked_at' => $blocked->time_ago,
                    'blocked_at_iso' => $blocked->blocked_at->toISOString(),
                    'payer_name' => $blocked->payer?->name ?? 'Unknown',
                ];
            })->toArray(),
        ];
    }

    /**
     * Get blocked payment statistics for a creator
     */
    public function getBlockedPaymentStats(User $creator, int $days = 30): array
    {
        $query = BlockedPayment::forCreator($creator->id)->recent($days);

        return [
            'total_blocked' => $query->count(),
            'total_amount' => $query->sum('amount'),
            'by_payment_type' => $query->selectRaw('payment_type, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupBy('payment_type')
                ->get()
                ->keyBy('payment_type')
                ->toArray(),
            'by_blocked_reason' => $query->selectRaw('blocked_reason, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupBy('blocked_reason')
                ->get()
                ->keyBy('blocked_reason')
                ->toArray(),
            'daily_stats' => $query->selectRaw('DATE(blocked_at) as date, COUNT(*) as count, SUM(amount) as total_amount')
                ->groupByRaw('DATE(blocked_at)')
                ->orderByRaw('DATE(blocked_at) DESC')
                ->get()
                ->toArray(),
        ];
    }
}
