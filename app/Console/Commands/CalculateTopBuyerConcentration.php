<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\CreatorMetric;
use App\Models\Payment;
use App\Models\RiskSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CalculateTopBuyerConcentration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'risk:calculate-concentration';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Calculate top buyer concentration per creator (30d) and update metrics';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Calculating top buyer concentration...');

        // Fetch Settings
        $thresholds = RiskSetting::get('risk_thresholds', [
            'concentration_gmv_threshold' => 500000, // £5k
            'concentration_percent_trigger' => 40,
            'concentration_reserve_increase' => 10,
        ]);

        $gmvThreshold = $thresholds['concentration_gmv_threshold'] ?? 500000;
        $percentTrigger = $thresholds['concentration_percent_trigger'] ?? 40;
        $reserveIncrease = $thresholds['concentration_reserve_increase'] ?? 10;

        // 1. Get Creators with significant volume (e.g. > £1000 in 30d)
        // Optimization: Only scan creators active in last 30d

        $creators = Payment::where('created_at', '>=', now()->subDays(30))
            ->where('status', 'succeeded')
            ->distinct()
            ->pluck('creator_id');

        foreach ($creators as $creatorId) {
            // 2. Get Total GMV 30d
            $totalGmv = Payment::where('creator_id', $creatorId)
                ->where('created_at', '>=', now()->subDays(30))
                ->where('status', 'succeeded')
                ->sum('amount');

            if ($totalGmv < $gmvThreshold) { // Skip if < threshold (low risk)
                // Reset metric if previously set?
                // Or just keep it.
                // Spec says: "If top_buyer_percent >= 40% and creator GMV >= threshold -> apply safety".
                // So we should calculate it anyway if feasible, or just set to 0.
                // Let's calculate for everyone to be safe, but skip tiny ones.
                if ($totalGmv == 0) {
                    continue;
                }
            }

            // 3. Find Top Buyer Spend
            $topBuyer = Payment::where('creator_id', $creatorId)
                ->where('created_at', '>=', now()->subDays(30))
                ->where('status', 'succeeded')
                ->select('risk_identity_id', DB::raw('SUM(amount) as total'))
                ->groupBy('risk_identity_id')
                ->orderByDesc('total')
                ->first();

            $topSpend = $topBuyer ? $topBuyer->total : 0;
            $percent = ($topSpend / $totalGmv) * 100;

            // 4. Update Metric
            $metric = CreatorMetric::firstOrCreate(['creator_id' => $creatorId]);
            $metric->update(['top_buyer_percent' => $percent]);

            // 5. Apply Safety Actions if Rule Triggers
            // Rule: >= 40% and GMV >= £5k
            if ($percent >= $percentTrigger && $totalGmv >= $gmvThreshold) {
                // Log Action
                $this->warn("Creator {$creatorId} has {$percent}% concentration risk!");

                AuditLog::create([
                    'actor' => 'system',
                    'action_type' => 'CONCENTRATION_RISK_DETECTED',
                    'reference_id' => $creatorId,
                    'metadata_json' => [
                        'percent' => $percent,
                        'gmv_30d' => $totalGmv,
                        'top_buyer_id' => $topBuyer->risk_identity_id,
                    ],
                ]);

                // Increase Reserve? (e.g. set floor to 10%)
                if ($metric->reserve_percent < $reserveIncrease) {
                    $metric->update(['reserve_percent' => $reserveIncrease]);
                    $this->info("Increased reserve to {$reserveIncrease}% for creator {$creatorId}");
                }
            }
        }

        $this->info('Concentration calculation complete.');
    }
}
