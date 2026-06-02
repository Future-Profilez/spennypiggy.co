<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\FounderBonus;
use App\Mail\FounderCongratulations;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckFounderQualifications implements ShouldQueue
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
     * Runs monthly on the 1st to check creators who completed their first 30 days for founder qualification
     */
    public function handle(): void
    {
        Log::info('Starting monthly founder qualification check (1st of month)');

        // Check if we have available founder seats
        $currentFounderCount = FounderBonus::getTotalFounderCount();
        $maxSeats = FounderBonus::getMaxFounderSeats();
        $availableSeats = $maxSeats - $currentFounderCount;

        if ($availableSeats <= 0) {
            Log::info('No available founder seats remaining');
            return;
        }

        Log::info("Available founder seats: {$availableSeats}");

        // Get creators who completed their first 30 days in the previous month and are not already qualified
        $lastMonth = now()->subMonth();
        $startOfLastMonth = $lastMonth->startOfMonth();
        $endOfLastMonth = $lastMonth->endOfMonth();

        // Find creators who joined 30+ days ago and haven't been qualified yet
        $thirtyDaysAgo = now()->subDays(30);
        
        $candidateCreators = User::where('role', 'creator')
            ->where('created_at', '<=', $thirtyDaysAgo)
            ->whereDoesntHave('founderBonus')
            ->get();

        Log::info("Found {$candidateCreators->count()} creators eligible for qualification check");

        $newFounders = 0;

        foreach ($candidateCreators as $creator) {
            if ($newFounders >= $availableSeats) {
                Log::info('All available founder seats have been filled');
                break;
            }

            // Calculate first 30-day earnings
            $first30DayEarnings = $this->calculateFirst30DayEarnings($creator);
            $minEarnings = FounderBonus::getMinFirst30dEarnings();

            Log::info("Creator {$creator->name} (ID: {$creator->id}) earned £{$first30DayEarnings} in first 30 days");

            if (FounderBonus::checkFounderQualification($creator->id, $first30DayEarnings)) {
                // Qualify as founder
                $this->qualifyAsFounder($creator, $first30DayEarnings);
                $newFounders++;
                
                Log::info("New founder qualified: {$creator->name} (ID: {$creator->id}) with £{$first30DayEarnings} in first 30 days");
            }
        }

        Log::info("Monthly founder qualification check completed. New founders: {$newFounders}");
    }

    /**
     * Calculate first 30-day earnings for a creator
     */
    private function calculateFirst30DayEarnings(User $creator): float
    {
        $createdAt = $creator->created_at;
        $thirtyDaysLater = $createdAt->copy()->addDays(30);

        // Sum all deliverable transaction_amount amounts for the creator in their first 30 days
        $transactions = \App\Models\FinancialTransaction::where('user_id', $creator->id)
            ->where('type', 'income')
            ->where('status', 'completed')
            ->whereBetween('transaction_date', [$createdAt, $thirtyDaysLater])
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

    /**
     * Qualify a creator as a founder
     */
    private function qualifyAsFounder(User $creator, float $first30DayEarnings): void
    {
        DB::transaction(function () use ($creator, $first30DayEarnings) {
            // Calculate bonus amount (10% of first 30 days earnings)
            $bonusAmount = FounderBonus::calculateBonusAmount($first30DayEarnings);
            
            // Estimated payout date (7th of next month)
            $estimatedPayoutDate = now()->addMonth()->startOfMonth()->addDays(6); // 7th of next month

            // Create founder bonus record
            FounderBonus::create([
                'creator_id' => $creator->id,
                'qualification_date' => now()->toDateString(),
                'first_30d_earnings' => $first30DayEarnings,
                'bonus_amount' => $bonusAmount,
                'estimated_payout_date' => $estimatedPayoutDate,
                'payout_status' => FounderBonus::STATUS_PENDING,
            ]);

            // Send congratulations email
            try {
                if (config('founder_bonus.features.email_notifications', true)) {
                    Mail::to($creator->email)->send(new FounderCongratulations($creator, $first30DayEarnings));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send founder congratulations email to {$creator->email}: " . $e->getMessage());
            }
        });
    }
}
