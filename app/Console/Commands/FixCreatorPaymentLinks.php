<?php

namespace App\Console\Commands;

use App\Models\Deliverable;
use App\Models\Payment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\User;
use Illuminate\Console\Command;

class FixCreatorPaymentLinks extends Command
{
    protected $signature = 'finance:fix-payment-links {creator} {--dry-run}';

    protected $description = 'Backfill missing stripe_session_id on risk-ledger payments using payment_intent lookups';

    public function handle(): int
    {
        $input = (string) $this->argument('creator');
        $dryRun = (bool) $this->option('dry-run');

        $creator = null;
        if (is_numeric($input)) {
            $creator = User::find((int) $input);
        }
        if (! $creator) {
            $creator = User::where('uuid', $input)
                ->orWhere('username', $input)
                ->first();
        }
        if (! $creator) {
            $creator = User::where('name', $input)->first();
        }

        if (! $creator) {
            $this->error("Creator not found: {$input}");

            return self::FAILURE;
        }

        $payments = Payment::whereIn('creator_id', [(string) $creator->id, (string) $creator->uuid])
            ->whereNull('payout_run_id')
            ->whereIn('status', ['succeeded', 'review_hold', 'disputed', 'refunded'])
            ->whereNotNull('stripe_payment_intent_id')
            ->where(function ($q) {
                $q->whereNull('stripe_session_id')->orWhere('stripe_session_id', '');
            })
            ->orderByDesc('created_at')
            ->get();

        $this->line("Creator: {$creator->name} (@{$creator->username})");
        $this->line("Missing session_id payments: {$payments->count()}");

        $updated = 0;
        $skipped = 0;
        $failed = 0;

        foreach ($payments as $p) {
            $pi = (string) $p->stripe_payment_intent_id;
            $session = null;
            $source = null;

            $detail = StripePaymentDetail::where('stripe_payment_intent_id', $pi)->first();
            if ($detail && $detail->session_id) {
                $session = (string) $detail->session_id;
                $source = 'stripe_payment_detail';
            }

            if (! $session) {
                $task = TaskPurchase::where('payment_intent_id', $pi)->first();
                if ($task && $task->stripe_session_id) {
                    $session = (string) $task->stripe_session_id;
                    $source = 'task_purchase';
                }
            }

            if (! $session) {
                $del = Deliverable::where('payment_intent_id', $pi)->first();
                if ($del && $del->session_id) {
                    $session = (string) $del->session_id;
                    $source = 'deliverable';
                }
            }

            if (! $session) {
                $skipped++;
                $this->line("Skip payment {$p->id}: cannot resolve session for pi={$pi}");

                continue;
            }

            if ($dryRun) {
                $updated++;
                $this->line("DRY RUN payment {$p->id}: set stripe_session_id={$session} (from {$source})");

                continue;
            }

            try {
                $p->stripe_session_id = $session;
                $p->save();
                $updated++;
                $this->line("Updated payment {$p->id}: set stripe_session_id={$session} (from {$source})");
            } catch (\Throwable $e) {
                $failed++;
                $this->line("Failed payment {$p->id}: {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->line("Updated: {$updated}");
        $this->line("Skipped: {$skipped}");
        $this->line("Failed: {$failed}");

        return self::SUCCESS;
    }
}
