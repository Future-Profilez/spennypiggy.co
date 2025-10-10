<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class DebugStripeMetadata extends Command
{
    protected $signature = 'debug:stripe-metadata {payment_intent_id : The Stripe payment intent ID to check}';
    protected $description = 'Debug and display the actual metadata stored in Stripe for a payment intent';

    public function handle()
    {
        $paymentIntentId = $this->argument('payment_intent_id');
        
        $this->info("🔍 Fetching Stripe payment intent: {$paymentIntentId}");
        
        try {
            // Initialize Stripe
            Stripe::setApiKey(env('STRIPE_SECRET_KEY'));
            
            // Retrieve payment intent
            $paymentIntent = PaymentIntent::retrieve($paymentIntentId);
            
            $this->info("✅ Successfully retrieved payment intent from Stripe");
            $this->newLine();
            
            // Display basic payment intent info
            $this->info("📊 Payment Intent Details:");
            $this->line("  • ID: {$paymentIntent->id}");
            $this->line("  • Status: {$paymentIntent->status}");
            $this->line("  • Amount: {$paymentIntent->amount} {$paymentIntent->currency}");
            $this->line("  • Created: " . date('Y-m-d H:i:s T', $paymentIntent->created));
            
            if ($paymentIntent->customer) {
                $this->line("  • Customer: {$paymentIntent->customer}");
            }
            
            $this->newLine();
            
            // Display metadata
            $this->info("🏷️  Payment Intent Metadata:");
            $metadata = $paymentIntent->metadata;
            
            if ($metadata && count($metadata) > 0) {
                $this->info("  Found " . count($metadata) . " metadata fields:");
                $this->newLine();
                
                $certificateFields = [];
                $supportFields = [];
                $otherFields = [];
                
                // Show ALL metadata fields first
                $this->info("  📋 All Metadata Fields:");
                foreach ($metadata as $key => $value) {
                    $displayValue = strlen($value) > 100 ? substr($value, 0, 100) . '...' : $value;
                    $this->line("    • {$key}: {$displayValue}");
                }
                $this->newLine();
                
                // Categorize metadata fields
                foreach ($metadata as $key => $value) {
                    if (str_contains($key, 'certificate') || $key === 'deliverable_uuid' || $key === 'delivery_status') {
                        $certificateFields[$key] = $value;
                    } elseif (str_contains($key, 'support') || $key === 'payment_type' || $key === 'product_type') {
                        $supportFields[$key] = $value;
                    } else {
                        $otherFields[$key] = $value;
                    }
                }
                
                // Display certificate-related fields
                if (!empty($certificateFields)) {
                    $this->info("  🏆 Certificate Fields:");
                    foreach ($certificateFields as $key => $value) {
                        $displayValue = strlen($value) > 80 ? substr($value, 0, 80) . '...' : $value;
                        $this->line("    • {$key}: {$displayValue}");
                    }
                    $this->newLine();
                } else {
                    $this->error("  ❌ NO CERTIFICATE FIELDS FOUND");
                    $this->newLine();
                }
                
                // Display support payment fields
                if (!empty($supportFields)) {
                    $this->info("  💰 Support Payment Fields:");
                    foreach ($supportFields as $key => $value) {
                        $this->line("    • {$key}: {$value}");
                    }
                    $this->newLine();
                }
                
                // Display other fields
                if (!empty($otherFields)) {
                    $this->info("  📋 Other Fields:");
                    foreach ($otherFields as $key => $value) {
                        $displayValue = strlen($value) > 60 ? substr($value, 0, 60) . '...' : $value;
                        $this->line("    • {$key}: {$displayValue}");
                    }
                    $this->newLine();
                }
                
                // Check for specific expected fields
                $expectedFields = ['certificate_url', 'delivery_status', 'support_payment', 'product_type'];
                $missingFields = [];
                $presentFields = [];
                
                foreach ($expectedFields as $field) {
                    if (isset($metadata[$field])) {
                        $presentFields[] = $field;
                    } else {
                        $missingFields[] = $field;
                    }
                }
                
                if (!empty($presentFields)) {
                    $this->info("  ✅ Expected fields present: " . implode(', ', $presentFields));
                }
                
                if (!empty($missingFields)) {
                    $this->warn("  ⚠️  Expected fields missing: " . implode(', ', $missingFields));
                }
                
            } else {
                $this->error("  ❌ NO METADATA FOUND on this payment intent");
            }
            
            $this->newLine();
            
            // Check our local deliverable record
            $this->info("🗃️  Local Database Check:");
            $deliverable = \App\Models\Deliverable::where('payment_intent_id', $paymentIntentId)->first();
            
            if ($deliverable) {
                $this->info("  ✅ Found local deliverable record:");
                $this->line("    • ID: {$deliverable->id}");
                $this->line("    • Product Type: {$deliverable->product_type}");
                $this->line("    • Status: {$deliverable->status}");
                $this->line("    • Certificate URL: " . ($deliverable->certificate_url ?? 'NULL'));
                
                // Check if marked as updated
                $metadata = json_decode($deliverable->metadata, true) ?? [];
                $stripeUpdated = $metadata['stripe_metadata_updated'] ?? false;
                $updatedAt = $metadata['stripe_metadata_updated_at'] ?? 'Never';
                
                $this->line("    • Stripe Updated: " . ($stripeUpdated ? 'YES' : 'NO'));
                $this->line("    • Updated At: {$updatedAt}");
                
            } else {
                $this->error("  ❌ No local deliverable found for this payment intent");
            }
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("❌ Error retrieving payment intent: " . $e->getMessage());
            $this->error("Error class: " . get_class($e));
            return 1;
        }
    }
}