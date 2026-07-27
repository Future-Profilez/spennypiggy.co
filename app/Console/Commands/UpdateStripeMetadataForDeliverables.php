<?php

namespace App\Console\Commands;

use App\Models\Deliverable;
use App\Services\StripeMetadataService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateStripeMetadataForDeliverables extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'stripe:update-deliverable-metadata 
                            {--limit=50 : Number of deliverables to process per run}
                            {--product-type= : Filter by specific product type}
                            {--dry-run : Show what would be updated without making changes}
                            {--force-all : Process all deliverables regardless of existing metadata}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update Stripe payment intent metadata for existing deliverables with certificate URLs and delivery status';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $limit = $this->option('limit');
        $productType = $this->option('product-type');
        $dryRun = $this->option('dry-run');
        $forceAll = $this->option('force-all');

        $this->info('🚀 Starting Stripe metadata update for deliverables');
        $this->info("Limit: {$limit}");
        $this->info('Product Type Filter: '.($productType ?: 'All'));
        $this->info('Dry Run: '.($dryRun ? 'Yes' : 'No'));
        $this->info('Force All: '.($forceAll ? 'Yes' : 'No'));
        $this->newLine();

        // Build query for deliverables that need metadata updates
        $query = Deliverable::whereNotNull('payment_intent_id');

        if ($productType) {
            $query->where('product_type', $productType);
        }

        if (! $forceAll) {
            // Only process deliverables that likely haven't been updated yet
            // (either no certificate_url or older records)
            $query->where(function ($q) {
                $q->whereNull('certificate_url')
                    ->orWhere('created_at', '<', now()->subDays(1));
            });
        }

        $deliverables = $query->orderBy('created_at', 'desc')->limit($limit)->get();

        if ($deliverables->isEmpty()) {
            $this->info('✅ No deliverables found that need metadata updates.');

            return 0;
        }

        $this->info("Found {$deliverables->count()} deliverables to process");
        $this->newLine();

        $stripeMetadataService = app(StripeMetadataService::class);
        $successful = 0;
        $failed = 0;
        $skipped = 0;

        $progressBar = $this->output->createProgressBar($deliverables->count());
        $progressBar->start();

        foreach ($deliverables as $deliverable) {
            try {
                // Show current deliverable info in verbose mode
                if ($this->output->isVerbose()) {
                    $this->newLine();
                    $this->line("Processing Deliverable ID: {$deliverable->id}");
                    $this->line("  - Product Type: {$deliverable->product_type}");
                    $this->line("  - Status: {$deliverable->status}");
                    $this->line("  - Payment Intent: {$deliverable->payment_intent_id}");
                    $this->line('  - Certificate URL: '.($deliverable->certificate_url ? 'Yes' : 'No'));
                }

                if ($dryRun) {
                    $this->showWhatWouldUpdate($deliverable);
                    $successful++;
                } else {
                    // Build metadata for this update run
                    $additionalMetadata = [
                        'bulk_update_command' => 'true',
                        'bulk_updated_at' => now()->toISOString(),
                    ];

                    $success = $stripeMetadataService->updateDeliverableMetadata($deliverable, $additionalMetadata);

                    if ($success) {
                        $successful++;
                    } else {
                        $failed++;
                    }
                }

            } catch (\Exception $e) {
                $failed++;
                Log::error('UpdateStripeMetadataForDeliverables: Failed to update deliverable', [
                    'deliverable_id' => $deliverable->id,
                    'error' => $e->getMessage(),
                ]);

                if ($this->output->isVerbose()) {
                    $this->error('  ❌ Error: '.$e->getMessage());
                }
            }

            $progressBar->advance();
        }

        $progressBar->finish();
        $this->newLine(2);

        // Show results
        $this->info('📊 Results Summary:');
        $this->info("✅ Successful: {$successful}");
        $this->info("❌ Failed: {$failed}");
        $this->info("⏭️ Skipped: {$skipped}");

        if ($dryRun) {
            $this->newLine();
            $this->warn('🔍 This was a dry run - no actual changes were made to Stripe.');
            $this->info('Run without --dry-run to apply the updates.');
        }

        return $failed > 0 ? 1 : 0;
    }

    /**
     * Show what would be updated for a deliverable in dry-run mode
     */
    private function showWhatWouldUpdate(Deliverable $deliverable)
    {
        if (! $this->output->isVerbose()) {
            return;
        }

        $this->line('  🔍 Would update with:');
        $this->line("    - Product Type: {$deliverable->product_type}");
        $this->line("    - Deliverable Type: {$deliverable->deliverable_type}");
        $this->line("    - Transaction Amount: {$deliverable->transaction_amount}");

        if ($deliverable->product_type === 'support_payment') {
            $this->line('    - Payment Type: tip_donation');
            $this->line('    - Support Payment: true');
            $this->line('    - Note: No delivery/certificate fields for support payments');
        } else {
            $this->line('    - Delivery Status: '.$this->mapStatusToDeliveryStatus($deliverable->status));
            $this->line('    - Certificate URL: '.($deliverable->certificate_url ?: 'none'));

            if ($deliverable->deliverable_url) {
                $this->line('    - Content Available: true');
            }
        }
    }

    /**
     * Map deliverable status to delivery status
     */
    private function mapStatusToDeliveryStatus(string $status): string
    {
        return match ($status) {
            'delivered' => 'completed',
            'pending' => 'pending',
            'failed' => 'failed',
            default => 'pending'
        };
    }
}
