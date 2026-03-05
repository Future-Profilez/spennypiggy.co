<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CreatorMetric;
use App\Models\EarlyFraudWarning;
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
        $metrics = CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);

        // 1. RESERVE_APPLIED
        if ($metrics->reserve_percent > 0) {
            $banners[] = [
                'key' => 'RESERVE_APPLIED',
                'type' => 'warning',
                'title' => 'Reserve Applied',
                'body' => "A temporary reserve of {$metrics->reserve_percent}% has been applied due to increased disputes. This protects payouts long-term.",
                'action_url' => '/stripe/login',
                'action_label' => 'View Payouts',
                'action_method' => 'post',
                'what_happened' => "To ensure platform stability and protect against potential disputes, a temporary reserve has been placed on your account. This means {$metrics->reserve_percent}% of your earnings is held for a rolling period before being released.",
                'what_to_do' => "Continue fulfilling orders and maintaining good standing. The reserve is automatically reviewed and may be lowered as your account history improves. You can check your payout schedule in the dashboard.",
            ];
        }

        // 2. PAYOUT_DELAYED
        if ($metrics->payout_delay_days > 0) {
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

        if ($recentEFW) {
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
        if ($metrics->top_buyer_percent >= 40.0) {
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
