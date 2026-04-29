<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\CreatorMetric;
use App\Models\Dispute;
use App\Models\Payment;
use App\Models\PlatformRiskState;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        // 1. Platform State
        $stateRecord = PlatformRiskState::latest('started_at')->first();
        $state = $stateRecord ? $stateRecord->state : 'NORMAL';

        // 2. GMV Metrics
        $gmv24h = Payment::whereIn('status', ['succeeded', 'review_hold', 'disputed', 'refunded'])
            ->where('created_at', '>=', Carbon::now()->subHours(24))
            ->sum('amount');
            
        $gmv7d = Payment::whereIn('status', ['succeeded', 'review_hold', 'disputed', 'refunded'])
            ->where('created_at', '>=', Carbon::now()->subDays(7))
            ->sum('amount');

        // 3. Dispute Rate (Platform 30d)
        // Reuse query from monitor command or simplified here.
        $totalTx30d = Payment::where('created_at', '>=', Carbon::now()->subDays(30))
            ->whereIn('status', ['succeeded', 'review_hold', 'refunded', 'disputed'])
            ->count();
            
        $totalDisputes30d = Dispute::where('created_at', '>=', Carbon::now()->subDays(30))->count();
        
        $disputeRate = $totalTx30d > 0 ? ($totalDisputes30d / $totalTx30d) * 100 : 0;

        // 4. Action Queue (Items needing attention)
        // - New disputes in last 24h
        // - EFWs in last 24h
        // - Platform state changes
        
        $recentDisputes = Dispute::where('created_at', '>=', Carbon::now()->subHours(24))->get();
        $recentEFWs = \App\Models\EarlyFraudWarning::where('created_at', '>=', Carbon::now()->subHours(24))->get();
        
        // 5. Exposure Estimate
        // (Payouts last 14d * expected dispute rate) - reserves - refunds
        // Let's approximate.
        $payoutsLast14d = \App\Models\PayoutRun::where('run_date', '>=', Carbon::now()->subDays(14))
            ->get()
            ->sum(function ($run) {
                return $run->totals['platform_total'] ?? 0;
            });
            
        $expectedDisputeRate = 0.007; // 0.7% worst case?
        $exposure = ($payoutsLast14d * $expectedDisputeRate);
        
        // Subtract held reserves? Reserves are deducted before payout, so they are safe.
        // Exposure is on money PAID OUT.
        // So exposure = Payouts * RiskRate.
        // We can subtract current Review Holds (money we still have) to show "Safety Net"?
        // No, review holds reduce payout, so they reduce exposure automatically.
        // But if we want "Net Exposure":
        // Exposure = (Money Gone * Risk) - (Money Held).
        
        $moneyHeld = Payment::where('status', 'review_hold')->sum('amount');
        $netExposure = $exposure - $moneyHeld;

        return response()->json([
            'platform_state' => [
                'current' => $state,
                'reason' => $stateRecord ? $stateRecord->reason_codes : [],
                'since' => $stateRecord ? $stateRecord->started_at : null,
            ],
            'metrics' => [
                'gmv_24h' => $gmv24h,
                'gmv_7d' => $gmv7d,
                'dispute_rate_30d' => round($disputeRate, 3),
            ],
            'risk_indicators' => [
                'exposure_estimate' => round($exposure, 2),
                'review_hold_total' => $moneyHeld,
                'recent_disputes_count' => $recentDisputes->count(),
                'recent_efw_count' => $recentEFWs->count(),
            ],
            'action_queue' => [
                'disputes' => $recentDisputes,
                'efws' => $recentEFWs,
            ]
        ]);
    }
}
