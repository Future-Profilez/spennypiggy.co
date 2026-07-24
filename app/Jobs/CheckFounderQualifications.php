<?php

namespace App\Jobs;

use App\EmailService;
use App\Helpers;
use App\Mail\FounderCongratulations;
use App\Models\CreatorReferral;
use App\Models\FounderBonus;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

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
        // One run at a time. Seat availability is read once below and enforced
        // with a local counter, so two overlapping runs (a retry landing on top
        // of the scheduled tick) would each see the same free seats and could
        // jointly qualify past FOUNDER_MAX_SEATS. An atomic cache lock makes the
        // pass mutually exclusive; qualifyAsFounder also re-checks the live count
        // inside its transaction as a second line of defence.
        $lock = Cache::lock('founder-qualification-check', 600);

        if (! $lock->get()) {
            Log::info('Founder qualification check already running — skipping this dispatch.');

            return;
        }

        try {
            $this->runQualificationPass();
        } finally {
            $lock->release();
        }
    }

    private function runQualificationPass(): void
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
                // qualifyAsFounder re-checks the live seat count and returns false
                // if the cap was reached since this pass started. Only count and
                // continue when a bonus was actually created — otherwise fall
                // through and record the miss.
                if ($this->qualifyAsFounder($creator, $first30DayEarnings)) {
                    $newFounders++;
                    Log::info("New founder qualified: {$creator->name} (ID: {$creator->id}) with £{$first30DayEarnings} in first 30 days");

                    continue;
                }
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
        if (! Schema::hasColumn('users', 'founder_missed_at')) {
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
            Log::error("Failed to send founder missed notification to {$creator->email}: ".$e->getMessage());
        }

        Log::info("Founder window missed recorded for creator {$creator->id} ({$reason})");
    }

    /**
     * Calculate first 30-day earnings for a creator
     */
    private function calculateFirst30DayEarnings(User $creator): float
    {
        if (! $creator->stripe_connected_at) {
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
    private function qualifyAsFounder(User $creator, float $first30DayEarnings): bool
    {
        return (bool) DB::transaction(function () use ($creator, $first30DayEarnings) {
            // Serialize on the creator row + re-check so two concurrent qualification runs
            // can't both create a founder bonus for the same creator (no unique constraint
            // is relied upon, avoiding a risky migration over possibly-duplicated data).
            User::where('id', $creator->id)->lockForUpdate()->first();
            if (FounderBonus::where('creator_id', $creator->id)->exists()) {
                return false;
            }

            // Live seat re-check: the count read at the start of the pass can be
            // stale by the time we reach this creator. Never create a bonus that
            // would take the platform past its seat cap.
            if (FounderBonus::getTotalFounderCount() >= FounderBonus::getMaxFounderSeats()) {
                Log::warning("Founder seats full — not qualifying creator {$creator->id} despite meeting earnings.");

                return false;
            }

            if (Schema::hasColumn('users', 'is_founder')) {
                $creator->update(['is_founder' => true]);
            }

            // Referral multiplier: +1% if the creator was referred by another creator
            $referralMultiplier = 1.0;
            $referralBonus = (float) config('founder_bonus.bonus.referral_multiplier', 0.01);
            $wasReferred = CreatorReferral::where('referred_creator_id', $creator->id)->exists();
            if ($wasReferred) {
                $referralMultiplier = 1.0 + $referralBonus;
            }

            // Calculate bonus amount (10% of first 30 days earnings × referral multiplier)
            $bonusAmount = round(FounderBonus::calculateBonusAmount($first30DayEarnings) * $referralMultiplier, 2);

            // Estimated payout date (7th of next month)
            $estimatedPayoutDate = now()->addMonth()->startOfMonth()->addDays(6); // 7th of next month

            $founderFields = [
                'creator_id' => $creator->id,
                'qualification_date' => now()->toDateString(),
                'first_30d_earnings' => $first30DayEarnings,
                'bonus_amount' => $bonusAmount,
                'estimated_payout_date' => $estimatedPayoutDate,
                'payout_status' => FounderBonus::STATUS_PENDING,
            ];

            // Store referral multiplier if column exists (migration may not have run in all envs yet)
            if (Schema::hasColumn('founder_bonuses', 'referral_multiplier')) {
                $founderFields['referral_multiplier'] = $referralMultiplier;
            }

            // Create founder bonus record
            FounderBonus::create($founderFields);

            // Send congratulations email
            try {
                if (config('founder_bonus.features.email_notifications', true)) {
                    EmailService::sendMarketingEmail($creator, new FounderCongratulations($creator, $first30DayEarnings));
                }
            } catch (\Exception $e) {
                Log::error("Failed to send founder congratulations email to {$creator->email}: ".$e->getMessage());
            }

            try {
                Helpers::sendNotification(
                    "You're a SpennyPiggy Founder",
                    'Congrats! You qualified for the Founder Program. Open Founder dashboard to see your benefits and bonus tracking.',
                    $creator->email
                );
            } catch (\Throwable $e) {
                Log::error("Failed to send founder qualification push to {$creator->email}: ".$e->getMessage());
            }

            return true;
        });
    }
}
