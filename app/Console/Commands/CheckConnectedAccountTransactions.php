<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class CheckConnectedAccountTransactions extends Command
{
    protected $signature = 'stripe:check-connected-transactions {--days=28} {--account-id=}';

    protected $description = 'Check transactions in connected accounts to see if they are destination charges';

    public function handle()
    {
        $this->info('🔍 Analyzing Connected Account transactions...');

        // Set Stripe API key
        Stripe::setApiKey(config('services.stripe.secret'));

        $days = $this->option('days');
        $timestampStart = time() - ($days * 24 * 60 * 60);

        // Get a few connected accounts from database
        $connectedAccounts = User::whereNotNull('account_id')
            ->where('stripe_details_submitted', 1)
            ->limit(3)
            ->get();

        if ($connectedAccounts->isEmpty()) {
            $this->error('No connected accounts found in database');

            return 1;
        }

        $this->info('Found '.$connectedAccounts->count().' connected accounts to check');

        foreach ($connectedAccounts as $user) {
            $this->line('');
            $this->info("Checking account: {$user->account_id} (User: {$user->name})");
            $this->line(str_repeat('-', 50));

            try {
                // Get payment intents from this connected account
                $paymentIntents = PaymentIntent::all([
                    'created' => [
                        'gte' => $timestampStart,
                    ],
                    'limit' => 10,
                ], [
                    'stripe_account' => $user->account_id,
                ]);

                if (empty($paymentIntents->data)) {
                    $this->comment("No transactions found in last {$days} days");

                    continue;
                }

                $this->info('Found '.count($paymentIntents->data).' transactions');

                foreach ($paymentIntents->data as $pi) {
                    $amount = $pi->amount / 100;
                    $currency = strtoupper($pi->currency);

                    $this->line("Payment Intent: {$pi->id}");
                    $this->line("Amount: {$currency} {$amount}");
                    $this->line('Created: '.date('Y-m-d H:i:s', $pi->created));

                    // Check the structure to determine if it's destination charge
                    if (isset($pi->application_fee_amount) && $pi->application_fee_amount > 0) {
                        $fee = $pi->application_fee_amount / 100;
                        $this->info('🟢 DESTINATION CHARGE CONFIRMED');
                        $this->line("   Platform fee collected: {$currency} {$fee}");
                        $this->line('   Money went directly to connected account');
                    } else {
                        $this->comment('🔵 Standard payment to connected account');
                    }

                    $this->line('---');
                }

            } catch (\Exception $e) {
                $this->error("Error checking account {$user->account_id}: ".$e->getMessage());
            }
        }

        return 0;
    }
}
