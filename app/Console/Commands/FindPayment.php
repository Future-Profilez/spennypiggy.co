<?php

namespace App\Console\Commands;

use App\Models\Deliverable;
use App\Models\FinancialTransaction;
use App\Models\Payment;
use App\Models\PiggyPotContribution;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use Illuminate\Console\Command;

/**
 * Locate a payment across every product table by buyer email, PaymentIntent, or session id,
 * and report what exists (payment row / ledger FT / deliverable) vs what is MISSING.
 *
 * Built to debug a settled Stripe payment (e.g. a Pay-by-Bank charge) that does not appear
 * anywhere for the creator: it prints the session_id you then feed to `payments:reconcile`.
 */
class FindPayment extends Command
{
    protected $signature = 'payments:find {--email= : Buyer email} {--pi= : Stripe PaymentIntent id (pi_...)} {--session= : Stripe Checkout Session id (cs_...)}';

    protected $description = 'Find a payment across all product tables and report missing fulfilment';

    public function handle(): int
    {
        $email = $this->option('email');
        $pi = $this->option('pi');
        $session = $this->option('session');

        if (! $email && ! $pi && ! $session) {
            $this->error('Provide at least one of --email, --pi or --session.');

            return self::FAILURE;
        }

        $found = 0;

        // Each entry: [label, model, session column, intent column, buyer-email column]
        $tables = [
            ['Wish (one-time)', WishItemSubscription::class, 'session_id', null, 'guest_email'],
            ['Wish/checkout (StripePaymentDetail)', StripePaymentDetail::class, 'session_id', 'stripe_payment_intent_id', 'guest_email'],
            ['Support / Piggy Bank (Tip)', TipGoalsPayment::class, 'session_id', null, 'guest_email'],
            ['Shop', ShopPayment::class, 'session_id', null, 'email'],
            ['Task', TaskPurchase::class, 'stripe_session_id', 'payment_intent_id', null],
            ['Piggy Pot', PiggyPotContribution::class, 'session_id', 'payment_intent_id', 'guest_email'],
            ['Risk ledger (Payment)', Payment::class, 'stripe_session_id', 'stripe_payment_intent_id', null],
        ];

        foreach ($tables as [$label, $model, $sessionCol, $intentCol, $emailCol]) {
            $q = $model::query();
            $any = false;

            $q->where(function ($sub) use ($email, $pi, $session, $sessionCol, $intentCol, $emailCol, &$any) {
                if ($session && $sessionCol) {
                    $sub->orWhere($sessionCol, $session);
                    $any = true;
                }
                if ($pi && $intentCol) {
                    $sub->orWhere($intentCol, $pi);
                    $any = true;
                }
                if ($email && $emailCol) {
                    $sub->orWhere($emailCol, $email);
                    $any = true;
                }
            });

            // Also match by the buyer's user_id when we can resolve the email to a user.
            if ($email) {
                $buyer = User::where('email', $email)->first();
                if ($buyer) {
                    foreach (['user_id', 'supporter_id'] as $col) {
                        if (in_array($col, $model::make()->getFillable(), true)) {
                            $q->orWhere($col, $buyer->id);
                            $any = true;
                        }
                    }
                }
            }

            if (! $any) {
                continue;
            }

            $rows = $q->latest('created_at')->limit(10)->get();

            foreach ($rows as $row) {
                $found++;
                $sid = $row->{$sessionCol} ?? null;
                $this->newLine();
                $this->line("<info>{$label}</info>  id={$row->id}");
                $this->line('  session_id : '.($sid ?: '<fg=red>none</>'));
                if ($intentCol) {
                    $this->line('  intent     : '.($row->{$intentCol} ?: '—'));
                }
                $this->line('  status     : '.($row->payment_status ?? $row->status ?? '?'));
                $this->line('  created    : '.($row->created_at ?? '?'));

                $ft = FinancialTransaction::where('source_type', $model)->where('source_id', $row->id)->first();
                $this->line('  ledger FT  : '.($ft ? "yes (status={$ft->status}, net={$ft->net_amount})" : '<fg=red>MISSING</>'));

                if ($sid) {
                    $deliverable = Deliverable::where('session_id', $sid)->first();
                    $this->line('  deliverable: '.($deliverable ? "yes (status={$deliverable->status})" : '<fg=red>MISSING</>'));
                    $this->line("  → recover  : php artisan payments:reconcile {$sid}");
                }
            }
        }

        $this->newLine();
        if ($found === 0) {
            $this->warn('No matching payment row found in ANY product table.');
            $this->line('That means the checkout redirect never wrote a row — only Stripe has it.');
            $this->line('The row is normally created when the buyer is sent to Stripe; if it is truly');
            $this->line('absent, the session must be replayed from Stripe directly (needs the cs_ id).');
        } else {
            $this->info("Found {$found} row(s). Use the payments:reconcile line above for any with MISSING ledger/deliverable.");
        }

        return self::SUCCESS;
    }
}
