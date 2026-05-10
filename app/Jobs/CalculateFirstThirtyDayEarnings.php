<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\FounderBonus;
use App\Models\Deliverable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

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

        // Get creators who are exactly 30 days old today and not already founders
        $thirtyDaysAgo = now()->subDays(30)->startOfDay();
        $thirtyDaysAgoEnd = $thirtyDaysAgo->copy()->endOfDay();

        $candidateCreators = User::where('is_founder', false)
            ->whereBetween('created_at', [$thirtyDaysAgo, $thirtyDaysAgoEnd])
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
        $createdAt = $creator->created_at;
        $thirtyDaysLater = $createdAt->copy()->addDays(30);

        // Sum all deliverable transaction amounts for the creator in their first 30 days
        $earnings = Deliverable::where('creator_id', $creator->id)
            ->where('created_at', '>=', $createdAt)
            ->where('created_at', '<=', $thirtyDaysLater)
            ->where('status', 'delivered')
            ->sum('transaction_amount');

        return (float) $earnings;
    }
}
