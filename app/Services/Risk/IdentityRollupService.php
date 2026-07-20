<?php

namespace App\Services\Risk;

use App\Models\IdentityRollup;
use App\Models\Payment;
use App\Models\RiskIdentity;
use Carbon\Carbon;

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

        $query = Payment::where('risk_identity_id', $identity->id);

        $stats = $query->selectRaw("
            COUNT(CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold', 'initiated', 'step_up') THEN 1 END) as payment_count_10m,
            COUNT(DISTINCT CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN creator_id END) as creators_paid_24h,
            COUNT(DISTINCT CASE WHEN created_at >= ? AND status IN ('succeeded', 'review_hold') THEN creator_id END) as creators_paid_48h
        ", [
            $windows['10m'],
            $windows['24h'],
            $windows['48h']
        ])->first();

        // Spend windows count money that actually moved (or is held for review).
        // 'initiated' is excluded: an abandoned Stripe checkout leaves that row
        // behind forever, and counting it burned the supporter's spend limit for
        // a payment they never made. Burst abuse of checkout creation is still
        // caught by payment_count_10m below, which does count 'initiated'.
        $spendPayments = Payment::where('risk_identity_id', $identity->id)
            ->where('created_at', '>=', $windows['7d'])
            ->whereIn('status', ['succeeded', 'review_hold', 'processing'])
            ->get(['amount', 'currency', 'created_at']);

        $spend = [
            '10m' => 0,
            '1h' => 0,
            '2h' => 0,
            '24h' => 0,
            '48h' => 0,
            '7d' => 0,
        ];

        $normalizer = app(MoneyNormalizer::class);
        foreach ($spendPayments as $p) {
            $amountGbp = $normalizer->toGbpMinor((int) $p->amount, (string) $p->currency);
            $createdAt = $p->created_at;

            if ($createdAt >= $windows['7d']) $spend['7d'] += $amountGbp;
            if ($createdAt >= $windows['48h']) $spend['48h'] += $amountGbp;
            if ($createdAt >= $windows['24h']) $spend['24h'] += $amountGbp;
            if ($createdAt >= $windows['2h']) $spend['2h'] += $amountGbp;
            if ($createdAt >= $windows['1h']) $spend['1h'] += $amountGbp;
            if ($createdAt >= $windows['10m']) $spend['10m'] += $amountGbp;
        }

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
            'spend_10m' => $spend['10m'] ?? 0,
            'spend_1h' => $spend['1h'] ?? 0,
            'spend_2h' => $spend['2h'] ?? 0,
            'spend_24h' => $spend['24h'] ?? 0,
            'spend_48h' => $spend['48h'] ?? 0,
            'spend_7d' => $spend['7d'] ?? 0,
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
