<?php

namespace App\Services\Risk;

use App\Models\IdentityRollup;
use App\Models\Payment;
use App\Models\RiskIdentity;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class IdentityRollupService
{
    /**
     * Recalculate and update rollups for a given identity.
     * This ensures the counters are fresh based on actual payment history.
     */
    public function refreshRollups(RiskIdentity $identity): IdentityRollup
    {
        $now = Carbon::now();

        // Define windows
        $windows = [
            '10m' => $now->copy()->subMinutes(10),
            '1h' => $now->copy()->subHour(),
            '2h' => $now->copy()->subHours(2),
            '24h' => $now->copy()->subDay(),
            '48h' => $now->copy()->subDays(2),
            '7d' => $now->copy()->subDays(7),
            '30d' => $now->copy()->subDays(30),
        ];

        // Query payments for this identity
        // We include 'succeeded', 'review_hold', 'initiated' (if we want to count attempted spend?)
        // Spec implies we check velocity of *attempts* for some rules (like 3 in 10m).
        // But spend limits usually apply to *succeeded* or *pending* spend.
        // Let's count 'succeeded', 'review_hold' for spend.
        // For 'payment_count_10m' (Rule 6: 3 payments in 10m), it likely implies *attempts* or successful ones?
        // "3 payments in 10 minutes -> STEP-UP". If I try 3 times and fail, does it count?
        // Usually velocity checks count *attempts* to block brute force or rapid fire.
        // Let's count 'initiated', 'step_up', 'review_hold', 'succeeded' for counts.
        // For spend, usually only 'succeeded' and 'review_hold'.

        $query = Payment::where('risk_identity_id', $identity->id);

        // We can do optimized aggregation here
        // But for clarity and maintainability, let's do separate counts or a comprehensive query.
        // Given we need distinct creators for some rules, a single query might be complex.
        
        // Let's fetch relevant payments once? Or use DB aggregates.
        // DB aggregates are better for performance.

        $stats = $query->selectRaw("
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_10m,
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_1h,
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_2h,
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_24h,
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_48h,
            SUM(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN amount ELSE 0 END) as spend_7d,
            COUNT(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold', 'initiated', 'step_up') THEN 1 END) as payment_count_10m,
            COUNT(DISTINCT CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN creator_id END) as creators_paid_24h,
            COUNT(DISTINCT CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN creator_id END) as creators_paid_48h
        ", [
            $windows['10m'], $windows['1h'], $windows['2h'], $windows['24h'], $windows['48h'], $windows['7d'],
            $windows['10m'],
            $windows['24h'],
            $windows['48h']
        ])->first();

        // For new_creators_24h, we need to know if the creators paid in last 24h were *ever* paid before by this identity.
        // This is harder to do in a single aggregation.
        // Logic: Count creators paid in last 24h WHO HAVE NOT been paid by this identity prior to 24h ago.
        // This might be expensive.
        // Alternative: Maintain a separate table of (risk_identity_id, creator_id, first_paid_at).
        // Or query:
        // creators_paid_24h_ids = SELECT distinct creator_id FROM payments WHERE risk_identity_id = ? AND created_at >= 24h
        // for each id, check if exists payment < 24h.
        // Optimization: "new_creators_24h" in identity_rollups can be updated incrementally or via this logic.
        // Let's implement the logic:
        
        $creatorsPaidRecently = Payment::where('risk_identity_id', $identity->id)
            ->where('created_at', '>=', $windows['24h'])
            ->whereIn('status', ['succeeded', 'review_hold'])
            ->distinct()
            ->pluck('creator_id');
            
        $newCreatorsCount = 0;
        foreach ($creatorsPaidRecently as $creatorId) {
            $existsPrior = Payment::where('risk_identity_id', $identity->id)
                ->where('creator_id', $creatorId)
                ->where('created_at', '<', $windows['24h'])
                ->whereIn('status', ['succeeded', 'review_hold'])
                ->exists();
            
            if (!$existsPrior) {
                $newCreatorsCount++;
            }
        }

        // Disputes 30d
        // Queries 'disputes' table? Or 'payments' with status 'disputed'?
        // Spec says "disputes_30d" in identity_rollups.
        // Let's assume linked disputes.
        // Actually, identity_rollups has disputes_30d.
        // We can count payments with status 'disputed' or query Disputes table linked to payments of this identity.
        // The payments table has 'disputed' status.
        $disputes30d = Payment::where('risk_identity_id', $identity->id)
            ->where('created_at', '>=', $windows['30d'])
            ->where('status', 'disputed')
            ->count();

        // Update Rollup
        $rollup = $identity->rollup ?: new IdentityRollup(['risk_identity_id' => $identity->id]);
        
        $rollup->fill([
            'spend_10m' => $stats->spend_10m ?? 0,
            'spend_1h' => $stats->spend_1h ?? 0,
            'spend_2h' => $stats->spend_2h ?? 0,
            'spend_24h' => $stats->spend_24h ?? 0,
            'spend_48h' => $stats->spend_48h ?? 0,
            'spend_7d' => $stats->spend_7d ?? 0,
            'payment_count_10m' => $stats->payment_count_10m ?? 0,
            'creators_paid_24h' => $stats->creators_paid_24h ?? 0,
            'creators_paid_48h' => $stats->creators_paid_48h ?? 0,
            'new_creators_24h' => $newCreatorsCount,
            'disputes_30d' => $disputes30d,
        ]);
        
        $rollup->save();
        
        return $rollup;
    }
}
