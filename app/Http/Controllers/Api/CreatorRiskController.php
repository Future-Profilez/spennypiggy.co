<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreatorMetric;
use App\Models\EarlyFraudWarning;
use App\Models\Payment;
use App\Models\PlatformRiskState;
use Illuminate\Http\Request;

class CreatorRiskController extends Controller
{
    /**
     * GET /api/creator/risk-status
     * Returns active banners/alerts for the creator dashboard.
     */
    public function getRiskStatus(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $banners = [];
        $metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $user->uuid);
        $creatorRules = \App\Models\RiskSetting::get('creator_rules', []);
        $newCreatorAgeDays = (int) ($creatorRules['new_creator_age_days'] ?? 30);
        $isNewCreator = $user->created_at?->diffInDays(now()) < $newCreatorAgeDays;
        $isStripeConnected = ((int) ($user->stripe_details_submitted ?? 0)) === 1;
        $hasAnyEarnings = Payment::where('creator_id', (string) $user->uuid)
            ->whereIn('status', ['succeeded', 'review_hold', 'disputed', 'refunded'])
            ->exists();

        // 1. RESERVE_APPLIED
        if ($metrics->reserve_percent > 0 && $isStripeConnected && $hasAnyEarnings) {
            $isHighRisk = ($metrics->risk_level ?? null) === 'high';
            $isMediumRisk = ($metrics->risk_level ?? null) === 'medium';

            if ($isNewCreator && !$isHighRisk && !$isMediumRisk) {
                $banners[] = [
                    'key' => 'RESERVE_APPLIED',
                    'type' => 'info',
                    'title' => 'New Creator Reserve',
                    'body' => "A small portion of your earnings ({$metrics->reserve_percent}%) is temporarily reserved for 30 days to ensure payment security. These funds are automatically released to your available balance.",
                    'action_url' => '/stripe/login',
                    'action_label' => 'View Payouts',
                    'action_method' => 'post',
                    'what_happened' => "New creators start with a small rolling reserve for the first {$newCreatorAgeDays} days while account history is built. Reserves are released automatically after the rolling period.",
                    'what_to_do' => "No action needed. Keep fulfilling orders and collecting genuine supporters. Your reserve is reviewed as your account history grows.",
                ];
            } else {
                $reason = $isHighRisk ? 'account risk signals' : ($isMediumRisk ? 'additional safety checks' : 'platform safety');
                $banners[] = [
                    'key' => 'RESERVE_APPLIED',
                    'type' => 'warning',
                    'title' => 'Reserve Applied',
                    'body' => "A small portion of your earnings ({$metrics->reserve_percent}%) is temporarily reserved for 30 days to ensure payment security. These funds are automatically released to your available balance.",
                    'action_url' => '/stripe/login',
                    'action_label' => 'View Payouts',
                    'action_method' => 'post',
                    'what_happened' => "To protect against potential disputes and keep payouts stable, a rolling reserve is held. This means {$metrics->reserve_percent}% of your earnings is held temporarily before being released.",
                    'what_to_do' => "Continue fulfilling orders and maintaining good standing. The reserve is reviewed automatically and may be lowered as your account history improves.",
                ];
            }
        }

        // 2. PAYOUT_DELAYED
        if (
            $metrics->payout_delay_days > 0
            && $isStripeConnected
            && $hasAnyEarnings
            && (
                ($metrics->risk_level && $metrics->risk_level !== 'low')
                || ($metrics->reserve_percent > 0)
                || ((bool) ($metrics->is_overridden ?? false))
            )
        ) {
            $banners[] = [
                'key' => 'PAYOUT_DELAYED',
                'type' => 'info',
                'title' => 'Payout Delayed',
                'body' => "Your payout is delayed by {$metrics->payout_delay_days} days for a short safety review.",
                'action_url' => '/stripe/login',
                'action_label' => 'Check Status',
                'action_method' => 'post',
                'what_happened' => "Your current payout has been paused for a standard security review. This is a common safety measure to verify recent activity and ensure secure transaction processing.",
                'what_to_do' => "No immediate action is required from you. Our team is already reviewing the account. Payouts typically resume automatically within the specified delay period.",
            ];
        }

        // 3. ONBOARDING_PAUSED (Platform State)
        $stateRecord = PlatformRiskState::latest('started_at')->first();
        $state = $stateRecord ? $stateRecord->state : 'NORMAL';
        
        if ($state === 'FREEZE') {
             $banners[] = [
                'key' => 'ONBOARDING_PAUSED',
                'type' => 'critical',
                'title' => 'Onboarding Paused',
                'body' => 'New creator onboarding is temporarily paused for payment safety.',
                'action_url' => null, // Global issue, no specific user action
                'action_label' => null,
                'what_happened' => "We have temporarily paused new creator onboarding to upgrade our payment safety systems. This ensures a secure environment for all users.",
                'what_to_do' => "Your existing account is fully operational. You can continue to create content and receive support. We will notify you once onboarding reopens for new referrals.",
            ];
        }

        // 4. REFUND_RECOMMENDED (Recent EFWs)
        // Check for EFWs linked to this creator's payments in last 48h
        // We need to join payments table.
        // Assuming we can find EFWs via Payment -> Creator ID
        $recentEFW = EarlyFraudWarning::whereHas('payment', function($q) use ($user) {
                $q->where('creator_id', $user->uuid);
            })
            ->where('created_at', '>=', now()->subHours(48))
            ->exists();

        if ($recentEFW && $isStripeConnected && $hasAnyEarnings) {
             $banners[] = [
                'key' => 'REFUND_RECOMMENDED',
                'type' => 'action_required',
                'title' => 'Refund Recommended',
                'body' => 'A recent payment has been flagged as potential fraud. Consider refunding to avoid a chargeback.',
                'action_url' => '/shop/orders-list', // Assuming this is where orders/refunds are managed
                'action_label' => 'Review Orders',
                'what_happened' => "Our payment processor has flagged a recent transaction as high-risk or potentially fraudulent. This often happens when a cardholder reports a transaction they didn't recognize.",
                'what_to_do' => "We strongly recommend reviewing your recent orders. If you suspect fraud, issuing a refund now can prevent a formal chargeback and dispute fee later.",
            ];
        }
        
        // 5. CONCENTRATION_RISK (Top Buyer)
        if ($metrics->top_buyer_percent >= 40.0 && $isStripeConnected && $hasAnyEarnings) {
             $banners[] = [
                'key' => 'GROWTH_PACING_ACTIVE',
                'type' => 'info',
                'title' => 'Growth Pacing Active',
                'body' => 'One supporter is contributing a large portion of your revenue. Extra safety checks are active.',
                'action_url' => '/earnings',
                'action_label' => 'View Earnings',
                'what_happened' => "We noticed a significant portion of your recent revenue comes from a single supporter. While support is great, high concentration can trigger safety flags.",
                'what_to_do' => "Diversify your supporter base by promoting your page to a wider audience. This helps stabilize your income and reduces dependency on individual sources.",
            ];
        }

        return response()->json([
            'banners' => $banners,
            'metrics' => [
                'dispute_rate_30d' => $metrics->dispute_rate_30d,
                'reserve_percent' => $metrics->reserve_percent,
            ]
        ]);
    }
}
