<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class CheckStripeTransactionTypes extends Command
{
    protected $signature = 'stripe:check-transaction-types {--days=28}';

    protected $description = 'Analyze Stripe transactions to identify direct vs destination charges';

    public function handle()
    {
        $this->info('🔍 Analyzing Stripe transactions...');

        // Set Stripe API key
        Stripe::setApiKey(config('services.stripe.secret'));

        $days = $this->option('days');
        $timestampStart = time() - ($days * 24 * 60 * 60);

        try {
            // Get payment intents from specified days
            $paymentIntents = PaymentIntent::all([
                'created' => [
                    'gte' => $timestampStart,
                ],
                'limit' => 100,
            ]);

            $this->info('Found '.count($paymentIntents->data)." payment intents in last {$days} days");
            $this->line(str_repeat('=', 60));

            $directChargesCount = 0;
            $destinationChargesCount = 0;
            $standardChargesCount = 0;
            $totalAmount = 0;

            foreach ($paymentIntents->data as $pi) {
                $amount = $pi->amount / 100;
                $currency = strtoupper($pi->currency);
                $totalAmount += $amount;

                $this->line('');
                $this->info("Payment Intent: {$pi->id}");
                $this->line("Amount: {$currency} {$amount}");
                $this->line("Status: {$pi->status}");
                $this->line('Created: '.date('Y-m-d H:i:s', $pi->created));

                // Analyze payment type
                if (! empty($pi->transfer_data)) {
                    // DESTINATION CHARGE (Legacy)
                    $destinationChargesCount++;
                    $this->error('🔴 TYPE: DESTINATION CHARGE (Legacy/Incorrect - Uses transfer_data)');
                    $this->line("   Transfer to: {$pi->transfer_data->destination}");
                    if (isset($pi->application_fee_amount)) {
                        $fee = $pi->application_fee_amount / 100;
                        $this->line("   Platform fee: {$currency} {$fee}");
                    }
                } elseif (isset($pi->on_behalf_of)) {
                    // DESTINATION CHARGE (Legacy)
                    $destinationChargesCount++;
                    $this->error('🔴 TYPE: DESTINATION CHARGE (Legacy/Incorrect - Uses on_behalf_of)');
                    $this->line("   On behalf of: {$pi->on_behalf_of}");
                } else {
                    // STANDARD CHARGE (Platform) or DIRECT CHARGE (on connected account, invisible here)
                    $standardChargesCount++;
                    $this->comment('🔵 TYPE: STANDARD CHARGE (Platform only) or DIRECT CHARGE (if header used)');
                    $this->line('   Note: Direct Charges on connected accounts do not appear in platform PaymentIntent list.');
                }

                $this->line('---');
            }

            // Summary
            $this->line('');
            $this->info('📊 SUMMARY');
            $this->line(str_repeat('=', 30));
            $this->line('Total Transactions: '.count($paymentIntents->data));
            $this->line("Direct Charges: {$directChargesCount}");
            $this->line("Destination Charges: {$destinationChargesCount}");
            $this->line("Standard Charges: {$standardChargesCount}");
            $this->line('Total Amount: '.number_format($totalAmount, 2));

            if ($destinationChargesCount > 0) {
                $this->error("⚠️  WARNING: Found {$destinationChargesCount} destination charges!");
                $this->error('   These payments are using the legacy flow.');
                $this->error('   Please investigate and migrate to Direct Charges.');
            } else {
                $this->info('✅ EXCELLENT: No destination charges found!');
                $this->info('   All connected account payments are using Direct Charges.');
            }

        } catch (\Exception $e) {
            $this->error('❌ Error: '.$e->getMessage());
        }

        $this->line('');
        $this->comment('💡 Manual Check Instructions:');
        $this->comment('1. Go to your Stripe Dashboard');
        $this->comment('2. Navigate to Payments → Overview');
        $this->comment("3. Look for any transactions with 'Transfer to connected account'");
        $this->comment('4. Those are direct charges, others are destination charges');

        return 0;
    }
}
