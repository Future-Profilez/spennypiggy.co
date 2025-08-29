<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\Stripe;
use Stripe\PaymentIntent;

class CheckStripeTransactionTypes extends Command
{
    protected $signature = 'stripe:check-transaction-types {--days=28}';
    protected $description = 'Analyze Stripe transactions to identify direct vs destination charges';

    public function handle()
    {
        $this->info('🔍 Analyzing Stripe transactions...');
        
        // Set Stripe API key
        Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
        
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

            $this->info("Found " . count($paymentIntents->data) . " payment intents in last {$days} days");
            $this->line(str_repeat("=", 60));

            $directChargesCount = 0;
            $destinationChargesCount = 0;
            $standardChargesCount = 0;
            $totalAmount = 0;

            foreach ($paymentIntents->data as $pi) {
                $amount = $pi->amount / 100;
                $currency = strtoupper($pi->currency);
                $totalAmount += $amount;
                
                $this->line("");
                $this->info("Payment Intent: {$pi->id}");
                $this->line("Amount: {$currency} {$amount}");
                $this->line("Status: {$pi->status}");
                $this->line("Created: " . date('Y-m-d H:i:s', $pi->created));

                // Analyze payment type
                if (!empty($pi->transfer_data)) {
                    // DIRECT CHARGE
                    $directChargesCount++;
                    $this->error("🔴 TYPE: DIRECT CHARGE");
                    $this->line("   Transfer to: {$pi->transfer_data->destination}");
                    if (isset($pi->application_fee_amount)) {
                        $fee = $pi->application_fee_amount / 100;
                        $this->line("   Platform fee: {$currency} {$fee}");
                    }
                } elseif (isset($pi->on_behalf_of) || isset($pi->application_fee_amount)) {
                    // DESTINATION CHARGE
                    $destinationChargesCount++;
                    $this->info("🟢 TYPE: DESTINATION CHARGE");
                    if (isset($pi->on_behalf_of)) {
                        $this->line("   On behalf of: {$pi->on_behalf_of}");
                    }
                    if (isset($pi->application_fee_amount)) {
                        $fee = $pi->application_fee_amount / 100;
                        $this->line("   Platform fee: {$currency} {$fee}");
                    }
                } else {
                    // STANDARD CHARGE
                    $standardChargesCount++;
                    $this->comment("🔵 TYPE: STANDARD CHARGE (Platform only)");
                }

                $this->line("---");
            }

            // Summary
            $this->line("");
            $this->info("📊 SUMMARY");
            $this->line(str_repeat("=", 30));
            $this->line("Total Transactions: " . count($paymentIntents->data));
            $this->line("Direct Charges: {$directChargesCount}");
            $this->line("Destination Charges: {$destinationChargesCount}");
            $this->line("Standard Charges: {$standardChargesCount}");
            $this->line("Total Amount: " . number_format($totalAmount, 2));

            if ($directChargesCount > 0) {
                $this->error("⚠️  WARNING: Found {$directChargesCount} direct charges!");
                $this->error("   These payments went through your platform account first.");
                $this->error("   This indicates some payments are using direct charges flow.");
            } else {
                $this->info("✅ EXCELLENT: No direct charges found!");
                $this->info("   All payments are using destination charges as expected.");
            }

        } catch (\Exception $e) {
            $this->error("❌ Error: " . $e->getMessage());
        }

        $this->line("");
        $this->comment("💡 Manual Check Instructions:");
        $this->comment("1. Go to your Stripe Dashboard");
        $this->comment("2. Navigate to Payments → Overview");
        $this->comment("3. Look for any transactions with 'Transfer to connected account'");
        $this->comment("4. Those are direct charges, others are destination charges");
        
        return 0;
    }
}
