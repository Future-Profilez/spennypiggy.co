<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\FounderBonus;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CalculateFirstThirtyDayEarnings implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     * Runs daily to track first 30-day earnings for new creators
     */
    public function handle(): void
    {
        Log::info('Starting daily first 30-day earnings calculation');

        $qualificationDays = FounderBonus::getQualificationDays();
        // Get creators whose Stripe connection is exactly N days old today and not already founders
        $thirtyDaysAgo = now()->subDays($qualificationDays)->startOfDay();
        $thirtyDaysAgoEnd = $thirtyDaysAgo->copy()->endOfDay();

        $candidateCreators = User::where('is_founder', false)
            ->whereNotNull('stripe_connected_at')
            ->whereBetween('stripe_connected_at', [$thirtyDaysAgo, $thirtyDaysAgoEnd])
            ->where('stripe_details_submitted', 1)
            ->whereNotNull('account_id')
            ->whereDoesntHave('founderBonus')
            ->get();

        Log::info("Found {$candidateCreators->count()} creators who are exactly 30 days old");

        // Check if we have available founder seats
        $currentFounderCount = FounderBonus::getTotalFounderCount();
        $availableSeats = FounderBonus::getMaxFounderSeats() - $currentFounderCount;

        if ($availableSeats <= 0) {
            Log::info('No available founder seats remaining');
            return;
        }

        $newFounders = 0;

        foreach ($candidateCreators as $creator) {
            if ($newFounders >= $availableSeats) {
                Log::info('All available founder seats have been filled');
                break;
            }

            // Calculate first 30-day earnings
            $first30DayEarnings = $this->calculateFirst30DayEarnings($creator);

            Log::info("Creator {$creator->name} (ID: {$creator->id}) earned £{$first30DayEarnings} in first 30 days");

            if ($first30DayEarnings >= FounderBonus::getMinFirst30dEarnings()) {
                // This creator qualifies! But we'll let the CheckFounderQualifications job handle the actual qualification
                // This job is just for tracking and logging
                Log::info("Creator {$creator->name} (ID: {$creator->id}) qualifies for founder status with £{$first30DayEarnings}");
            }
        }

        Log::info('Daily first 30-day earnings calculation completed');
    }

    /**
     * Calculate first 30-day earnings for a creator
     */
    private function calculateFirst30DayEarnings(User $creator): float
    {
        if (!$creator->stripe_connected_at) {
            return 0.0;
        }

        $qualificationDays = FounderBonus::getQualificationDays();
        $startAt = $creator->stripe_connected_at;
        $thirtyDaysLater = $startAt->copy()->addDays($qualificationDays);

        // Sum all deliverable transaction amounts for the creator in their first 30 days
        $transactions = \App\Models\FinancialTransaction::where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$startAt, $thirtyDaysLater])
            ->get();

        $earnings = 0;
        foreach ($transactions as $tx) {
            $currency = strtoupper($tx->currency ?? 'GBP');
            $net = (float) ($tx->net_amount ?? 0);
            $vat = (float) ($tx->vat_amount ?? 0);
            $gross = $net + $vat;
            
            if ($currency === 'GBP') {
                $earnings += $gross;
            } else {
                $earnings += \App\Helpers::priceFormat($currency, $gross, 'GBP');
            }
        }

        return (float) $earnings;
    }
}
