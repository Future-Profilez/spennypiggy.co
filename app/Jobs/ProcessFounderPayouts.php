<?php

namespace App\Jobs;

use App\Models\User;
use App\Models\FounderBonus;
use App\Models\Deliverable;
use App\Services\StripeControl;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Carbon\Carbon;

class ProcessFounderPayouts implements ShouldQueue
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
     * Runs on the 7th of each month to process founder bonus payouts
     */
    public function handle(): void
    {
        Log::info('Starting founder payout processing for month: ' . now()->format('Y-m'));

        // Process pending payouts for qualified founders
        $this->processPendingPayouts();

        Log::info('Founder payout processing completed');
    }

    /**
     * Process pending payouts via Stripe
     */
    private function processPendingPayouts(): void
    {
        // Get all pending payouts that are due for payout (estimated payout date has passed)
        $pendingPayouts = FounderBonus::where('payout_status', FounderBonus::STATUS_PENDING)
            ->where('estimated_payout_date', '<=', now()->toDateString())
            ->with('creator')
            ->get();

        Log::info("Processing {$pendingPayouts->count()} pending payouts");

        foreach ($pendingPayouts as $bonus) {
            try {
                $this->processStripeTransfer($bonus);
            } catch (\Exception $e) {
                Log::error("Failed to process payout for founder {$bonus->creator_id}: " . $e->getMessage());
                
                // Keep as pending for retry next time
                // In production, you might want to implement retry logic or manual review
            }
        }
    }

    /**
     * Process Stripe transfer for founder bonus
     */
    private function processStripeTransfer(FounderBonus $bonus): void
    {
        try {
            // Check if creator has a connected Stripe account
            if (empty($bonus->creator->account_id)) {
                throw new \Exception('Creator does not have a connected Stripe account');
            }

            // Convert to pence for Stripe
            $amountInPence = (int) ($bonus->bonus_amount * 100);

            // Mark bonus as paid without Stripe transfer (Direct Charge refactor)
            $bonus->update([
                'payout_status' => FounderBonus::STATUS_PAID,
                'paid_date' => now(),
            ]);

            Log::info("Successfully processed payout (marked as paid) for founder {$bonus->creator_id}: £{$bonus->bonus_amount}", [
                'bonus_id' => $bonus->id,
                'note' => 'Direct Charge Refactor: Manual payout tracking',
            ]);

        } catch (\Exception $e) {
            Log::error("Failed to process Stripe transfer for founder {$bonus->creator_id}: " . $e->getMessage(), [
                'bonus_id' => $bonus->id,
                'error' => $e->getMessage(),
            ]);
            
            throw $e; // Re-throw to be caught by the calling method
        }
    }
}
