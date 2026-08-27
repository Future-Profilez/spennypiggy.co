<?php

namespace App\Console\Commands;

use App\Models\GrowthBonusProfile;
use App\Models\User;
use App\Services\GrowthBonusService;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Daily Growth Bonus pass: enrol newly-eligible creators, recompute qualifying
 * GMV from the ledger, activate/miss/expire, create or reverse milestone
 * rewards. Payout itself is MANUAL in Phase 1 (admin approves and pays; the
 * reward row carries the qualifying transaction the payout must ride with).
 *
 * Creator notifications/emails are Phase 2 — this command deliberately sends
 * nothing yet.
 *
 * Needs `schedule:work` (or the Vapor scheduler) running.
 */
class EvaluateGrowthBonus extends Command
{
    protected $signature = 'growth-bonus:evaluate
        {--user_id= : Evaluate a single creator}
        {--dry-run : Report what would happen without writing}';

    protected $description = 'Evaluate Creator Growth Bonus eligibility, activation and milestones';

    public function handle(GrowthBonusService $service): int
    {
        if (! $service->enabled()) {
            $this->info("Growth Bonus is disabled ('enabled' in config/growth_bonus.php). Nothing to do.");

            return self::SUCCESS;
        }

        // Same two-layer race defence as CheckFounderQualifications: one pass
        // at a time here, plus the lockForUpdate seat count inside claimSeat.
        $lock = Cache::lock('growth-bonus-evaluate', 600);

        if (! $lock->get()) {
            $this->warn('Growth Bonus evaluation already running — skipping.');

            return self::SUCCESS;
        }

        try {
            $this->runPass($service);
        } finally {
            $lock->release();
        }

        return self::SUCCESS;
    }

    private function runPass(GrowthBonusService $service): void
    {
        $cutoff = Carbon::parse(config('growth_bonus.launch_cutoff'))->startOfDay();

        $query = User::query()
            ->where('role', 1)
            ->whereNotNull('stripe_connected_at')
            ->where('stripe_connected_at', '>=', $cutoff)
            ->where('stripe_details_submitted', 1)
            ->whereNotNull('account_id')
            ->where(fn ($q) => $q->whereNull('bonus_scheme_eligible')->orWhere('bonus_scheme_eligible', 1))
            // New candidates plus everyone still in play. missed/expired rows
            // are terminal — evaluateCreator leaves them alone, so skip the
            // ledger recompute for them entirely.
            ->where(function ($q) {
                $q->whereDoesntHave('growthBonusProfile')
                    ->orWhereHas('growthBonusProfile', fn ($p) => $p->whereIn('status', [
                        GrowthBonusProfile::STATUS_PENDING,
                        GrowthBonusProfile::STATUS_ACTIVE,
                    ]));
            });

        if ($this->option('user_id')) {
            $query->where('id', (int) $this->option('user_id'));
        }

        $creators = $query->get();
        $this->info("Evaluating {$creators->count()} creator(s).");

        if ($this->option('dry-run')) {
            foreach ($creators as $creator) {
                $gmv = $service->computeGmv($creator);
                $this->line("Creator {$creator->id} ({$creator->username}): GMV £{$gmv['total']}, {$gmv['unconverted']} unconverted row(s).");
            }
            $this->info('Dry run — nothing written.');

            return;
        }

        $evaluated = 0;
        foreach ($creators as $creator) {
            try {
                $service->evaluateCreator($creator);
                $evaluated++;
            } catch (\Throwable $e) {
                // One creator's bad data must not stop the pass for the other 149.
                Log::error("Growth Bonus evaluation failed for creator {$creator->id}: {$e->getMessage()}");
            }
        }

        $seats = GrowthBonusProfile::seatsClaimed();
        $this->info("Done. {$evaluated} evaluated; {$seats}/{$service->maxSeats()} seats claimed.");
    }
}
