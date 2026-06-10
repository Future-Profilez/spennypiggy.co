<?php

namespace App\Jobs;

use App\Helpers;
use App\Mail\FounderBonusPayoutInitiated;
use App\Models\Currency;
use App\Models\FounderBonus;
use App\Models\PayoutRecord;
use App\StripeControl;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

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
        if (empty($bonus->creator?->account_id) || (int) ($bonus->creator?->stripe_details_submitted ?? 0) !== 1) {
            throw new \Exception('Creator Stripe account is not ready');
        }
        if (!empty($bonus->creator?->payout_paused_at)) {
            return;
        }
        if (!empty($bonus->payout_record_uuid) || !empty($bonus->stripe_payout_id)) {
            return;
        }

        $rates = Currency::rates();
        if ($rates instanceof \Illuminate\Support\Collection) {
            $rates = $rates->toArray();
        }

        $convert = function (float $amount, string $from, string $to) use ($rates): float {
            $from = strtoupper($from ?: 'GBP');
            $to = strtoupper($to ?: 'GBP');
            if ($from === $to) return $amount;
            if (!isset($rates[$from]) || !isset($rates[$to])) return $amount;
            return ($amount / $rates[$from]) * $rates[$to];
        };

        $currency = strtoupper((string) ($bonus->creator->default_currency ?? 'GBP'));
        $amount = (float) $convert((float) $bonus->bonus_amount, 'GBP', $currency);
        $amountMinor = (int) round($amount * 100);

        if ($amountMinor <= 0) {
            return;
        }

        $notify = null;

        $metadataBase = [
            'bonus_type' => 'founder_qualification',
            'reason' => 'founder_bonus',
            'source' => 'job:process-founder-payouts',
            'founder_bonus_id' => (string) $bonus->id,
            'creator_id' => (string) $bonus->creator->uuid,
            'creator_username' => (string) $bonus->creator->username,
            'creator_email' => (string) $bonus->creator->email,
            'qualification_date' => (string) $bonus->qualification_date?->toDateString(),
            'estimated_payout_date' => (string) $bonus->estimated_payout_date?->toDateString(),
            'amount_minor' => (string) $amountMinor,
            'currency' => strtolower($currency),
            'env' => (string) config('app.env'),
        ];

        $transferDescription = 'Founder Bonus' . (!empty($bonus->creator->username) ? (' - ' . $bonus->creator->username) : '');

        // Stripe calls happen OUTSIDE any DB transaction; idempotency keys keyed to the
        // bonus id make a concurrent or retried run return the same transfer/payout
        // instead of moving money twice.
        $transfer = StripeControl::transferToConnectedAccountMinor(
            $bonus->creator->account_id,
            $amountMinor,
            strtolower($currency),
            $metadataBase,
            $transferDescription,
            'founder_transfer_' . $bonus->id
        );

        StripeControl::ensureManualPayoutSchedule($bonus->creator->account_id, strtolower($currency));

        $payout = StripeControl::createPayout([
            'amount' => (int) $amountMinor,
            'currency' => strtolower($currency),
            'method' => 'standard',
            'metadata' => array_merge($metadataBase, [
                'transfer_id' => (string) ($transfer->id ?? ''),
            ]),
            'idempotency_key' => 'founder_payout_' . $bonus->id,
        ], $bonus->creator->account_id);

        // Money has moved — commit the marks immediately in their own small transaction.
        DB::transaction(function () use ($bonus, $currency, $amountMinor, $transfer, $payout, &$notify) {
            $locked = FounderBonus::whereKey($bonus->id)->lockForUpdate()->with('creator')->first();
            if (!$locked || !empty($locked->payout_record_uuid) || !empty($locked->stripe_payout_id)) {
                return; // another run already recorded this payout (same Stripe objects via idempotency)
            }

            $payoutRecord = PayoutRecord::create([
                'creator_id' => $locked->creator->uuid,
                'payout_run_id' => null,
                'stripe_payout_id' => $payout->id ?? null,
                'amount_minor' => (int) $amountMinor,
                'currency' => strtolower($currency),
                'status' => $payout->status ?? 'pending',
                'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date) : null,
                'metadata' => [
                    'stripe_payout' => method_exists($payout, 'toArray') ? $payout->toArray() : null,
                    'bonus_type' => 'founder_qualification',
                    'founder_bonus_id' => (int) $locked->id,
                    'founder_bonus_amount_minor' => (int) $amountMinor,
                    'founder_bonus_transfer_id' => $transfer->id ?? null,
                ],
            ]);

            $locked->stripe_transfer_id = $transfer->id ?? null;
            $locked->stripe_payout_id = $payout->id ?? null;
            $locked->payout_record_uuid = $payoutRecord->uuid;
            if (($payout->status ?? null) === 'paid') {
                $locked->payout_status = FounderBonus::STATUS_PAID;
                $locked->paid_date = now();
            }
            $locked->save();

            $notify = [
                'email' => (string) ($locked->creator->email ?? ''),
                'name' => (string) ($locked->creator->name ?? ''),
                'amount' => ((int) $amountMinor) / 100,
                'currency' => strtolower($currency),
                'arrival_date' => isset($payout->arrival_date) ? Carbon::createFromTimestamp($payout->arrival_date)->toDateString() : null,
            ];
        });

        if (!$notify || empty($notify['email'])) {
            return;
        }

        if (!$bonus->relationLoaded('creator') || !$bonus->creator) {
            $bonus->load('creator');
        }
        if (!$bonus->creator) {
            return;
        }

        try {
            Mail::to($notify['email'])->send(new FounderBonusPayoutInitiated($bonus->creator, 'Founder Bonus', (float) $notify['amount'], (string) $notify['currency'], $notify['arrival_date']));
        } catch (\Throwable $e) {
            Log::error('Failed to send founder payout email', [
                'creator_id' => $bonus->creator_id,
                'error' => $e->getMessage(),
            ]);
        }

        try {
            Helpers::sendNotification(
                'Founder Bonus payout initiated',
                'Your Founder Bonus payout has been initiated and will arrive via Stripe. Check Payouts for status.',
                $notify['email']
            );
        } catch (\Throwable $e) {
            Log::error('Failed to send founder payout push', [
                'creator_id' => $bonus->creator_id,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
