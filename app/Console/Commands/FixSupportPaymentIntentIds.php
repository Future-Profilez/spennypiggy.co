<?php

namespace App\Console\Commands;

use App\Jobs\UpdateSupportPaymentStripeMetadata;
use App\Models\Deliverable;
use App\StripeControl;
use Illuminate\Console\Command;

class FixSupportPaymentIntentIds extends Command
{
    protected $signature = 'fix:support-payment-intent-ids {--dry-run : Show what would be updated without making changes} {--limit=50 : Limit number of records to process}';

    protected $description = 'Fix missing payment_intent_id for existing support payment deliverables';

    public function handle()
    {
        $isDryRun = $this->option('dry-run');
        $limit = (int) $this->option('limit');

        $this->info('🔍 Looking for support payment deliverables missing payment_intent_id...');

        // Find deliverables with missing payment intent IDs
        $deliverables = Deliverable::where('product_type', 'support_payment')
            ->whereNull('payment_intent_id')
            ->whereNotNull('session_id')
            ->limit($limit)
            ->get();

        if ($deliverables->isEmpty()) {
            $this->info('✅ No support payment deliverables found with missing payment_intent_id');

            return 0;
        }

        $this->info("Found {$deliverables->count()} deliverables to process");

        $updated = 0;
        $failed = 0;
        $alreadyProcessed = 0;

        foreach ($deliverables as $deliverable) {
            try {
                $this->line("Processing deliverable {$deliverable->id} (session: {$deliverable->session_id})...");

                // Get payment intent from Stripe session
                $session = StripeControl::getCheckoutSession($deliverable->session_id);
                $paymentIntentId = $session->payment_intent ?? null;

                if (! $paymentIntentId) {
                    $this->warn("  ⚠️  No payment intent found in session {$deliverable->session_id}");
                    $failed++;

                    continue;
                }

                if ($isDryRun) {
                    $this->info("  🔄 DRY RUN: Would update deliverable {$deliverable->id} with payment_intent_id: {$paymentIntentId}");

                    // Show if certificate exists for potential Stripe metadata update
                    if ($deliverable->certificate_url) {
                        $this->info("  📜 Has certificate URL: {$deliverable->certificate_url}");
                        $this->info('  🎯 Would trigger UpdateSupportPaymentStripeMetadata job');
                    }
                } else {
                    // Update the deliverable with payment intent ID
                    $deliverable->update(['payment_intent_id' => $paymentIntentId]);

                    $this->info("  ✅ Updated deliverable {$deliverable->id} with payment_intent_id: {$paymentIntentId}");

                    // If deliverable has certificate, dispatch job to update Stripe metadata
                    if ($deliverable->certificate_url) {
                        UpdateSupportPaymentStripeMetadata::dispatch($deliverable->id)
                            ->delay(now()->addSeconds(2));

                        $this->info('  🚀 Dispatched UpdateSupportPaymentStripeMetadata job for certificate URL');
                    }
                }

                $updated++;

            } catch (\Exception $e) {
                $this->error("  ❌ Failed to process deliverable {$deliverable->id}: {$e->getMessage()}");
                $failed++;
            }
        }

        // Summary
        $this->newLine();
        $this->info('📊 Summary:');
        $this->info("  • Processed: {$deliverables->count()}");

        if ($isDryRun) {
            $this->info("  • Would update: {$updated}");
        } else {
            $this->info("  • Updated: {$updated}");
        }

        $this->info("  • Failed: {$failed}");

        if ($isDryRun) {
            $this->newLine();
            $this->warn('🔬 DRY RUN MODE - No changes were made');
            $this->info('Run without --dry-run to apply changes');
        } else {
            $this->newLine();
            $this->info('✅ Processing complete!');

            if ($updated > 0) {
                $this->info('🎯 UpdateSupportPaymentStripeMetadata jobs have been dispatched for deliverables with certificates');
                $this->info('📊 Monitor logs for "Support payment metadata + cert URL" to see Stripe updates');
            }
        }

        return 0;
    }
}
