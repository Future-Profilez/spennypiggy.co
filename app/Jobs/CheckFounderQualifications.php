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
use Illuminate\Support\Facades\Schema;
use App\Helpers;

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
        Log::info('Starting founder qualification check');

        // Check if we have available founder seats. Even with no seats left we keep
        // going — creators whose window just ended still need their "missed" outcome
        // recorded instead of everything silently disappearing.
        $currentFounderCount = FounderBonus::getTotalFounderCount();
        $maxSeats = FounderBonus::getMaxFounderSeats();
        $availableSeats = max(0, $maxSeats - $currentFounderCount);

        Log::info("Available founder seats: {$availableSeats}");

        $qualificationDays = FounderBonus::getQualificationDays();
        // Find creators who connected Stripe N+ days ago and haven't been qualified
        // yet, and whose missed outcome hasn't been recorded either
        $thirtyDaysAgo = now()->subDays($qualificationDays);

        $candidateCreators = User::where('role', 1)
            ->whereNotNull('stripe_connected_at')
            ->where('stripe_connected_at', '<=', $thirtyDaysAgo)
            ->where('stripe_details_submitted', 1)
            ->whereNotNull('account_id')
            ->whereDoesntHave('founderBonus')
            ->when(Schema::hasColumn('users', 'founder_missed_at'), function ($q) {
                $q->whereNull('founder_missed_at');
            })
            ->get();

        Log::info("Found {$candidateCreators->count()} creators eligible for qualification check");

        $newFounders = 0;
        $missed = 0;
        $minEarnings = FounderBonus::getMinFirst30dEarnings();

        foreach ($candidateCreators as $creator) {
            // Calculate first 30-day earnings
            $first30DayEarnings = $this->calculateFirst30DayEarnings($creator);

            Log::info("Creator {$creator->name} (ID: {$creator->id}) earned £{$first30DayEarnings} in first 30 days");

            $meetsEarnings = $first30DayEarnings >= $minEarnings;

            if ($meetsEarnings && $newFounders < $availableSeats && FounderBonus::checkFounderQualification($creator->id, $first30DayEarnings)) {
                // Qualify as founder
                $this->qualifyAsFounder($creator, $first30DayEarnings);
                $newFounders++;

                Log::info("New founder qualified: {$creator->name} (ID: {$creator->id}) with £{$first30DayEarnings} in first 30 days");
                continue;
            }

            // Window is over and they didn't make it — record the missed outcome once
            // and tell them, instead of leaving them with no information.
            $this->markAsMissed($creator, $meetsEarnings ? 'seats_full' : 'earnings_below_threshold');
            $missed++;
        }

        Log::info("Founder qualification check completed. New founders: {$newFounders}, missed: {$missed}");
    }

    /**
     * Record (once) that a creator's 30-day founder window ended without qualifying,
     * and send them a one-time notification.
     */
    private function markAsMissed(User $creator, string $reason): void
    {
        if (!Schema::hasColumn('users', 'founder_missed_at')) {
            return;
        }

        // Atomic claim: only the run that flips NULL → now() sends the notification,
        // so an overlapping run can never notify twice.
        $claimed = User::whereKey($creator->id)
            ->whereNull('founder_missed_at')
            ->update(['founder_missed_at' => now()]);

        if ($claimed === 0) {
            return;
        }

        $message = $reason === 'seats_full'
            ? 'You hit the earnings goal, but all Founder seats were taken this time. Stay updated — more bonus opportunities are coming.'
            : 'Your first 30 days have ended and the Founder earnings goal wasn\'t reached this time. Stay updated for more bonus opportunities.';

        try {
            Helpers::sendNotification('Founder Program update', $message, $creator->email);
        } catch (\Throwable $e) {
            Log::error("Failed to send founder missed notification to {$creator->email}: " . $e->getMessage());
        }

        Log::info("Founder window missed recorded for creator {$creator->id} ({$reason})");
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

        // Single source of truth — the same net-earnings formula the founder page
        // and monthly bonus use, so the number a creator sees is the number that
        // decides their qualification.
        return (float) FounderBonus::calculateCompletedNetEarnings($creator, $startAt, $thirtyDaysLater, 'GBP');
    }

    /**
     * Qualify a creator as a founder
     */
    private function qualifyAsFounder(User $creator, float $first30DayEarnings): void
    {
        DB::transaction(function () use ($creator, $first30DayEarnings) {
            if (Schema::hasColumn('users', 'is_founder')) {
                $creator->update(['is_founder' => true]);
            }

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
                    \App\EmailService::sendMarketingEmail($creator, new FounderCongratulations($creator, $first30DayEarnings));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send founder congratulations email to {$creator->email}: " . $e->getMessage());
            }

            try {
                Helpers::sendNotification(
                    "You're a SpennyPiggy Founder",
                    'Congrats! You qualified for the Founder Program. Open Founder dashboard to see your benefits and bonus tracking.',
                    $creator->email
                );
            } catch (\Throwable $e) {
                Log::error("Failed to send founder qualification push to {$creator->email}: " . $e->getMessage());
            }
        });
    }
}
