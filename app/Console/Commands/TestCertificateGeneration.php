<?php

namespace App\Console\Commands;

use App\Jobs\ProcessWishItemDeliverable;
use App\Models\Deliverable;
use App\Models\WishItem;
use App\Services\CertificateService;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class TestCertificateGeneration extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'test:certificate-generation {--wish-id= : The wish item ID to test}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test certificate generation and upload to Uploadcare for wish items';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $wishId = $this->option('wish-id');

        if (! $wishId) {
            // Get the first available wish item
            $wishItem = WishItem::with('user')->first();
            if (! $wishItem) {
                $this->error('No wish items found in the database.');

                return 1;
            }
        } else {
            $wishItem = WishItem::with('user')->find($wishId);
            if (! $wishItem) {
                $this->error("Wish item with ID {$wishId} not found.");

                return 1;
            }
        }

        $this->info("Testing certificate generation for wish item: {$wishItem->wishname}");
        $this->info("Creator: {$wishItem->user->name}");

        try {
            // Create a test deliverable
            $deliverable = Deliverable::create([
                'uuid' => Str::uuid(),
                'product_id' => (string) $wishItem->id, // String representation of wish item ID
                'item_id' => $wishItem->id,
                'creator_id' => $wishItem->user_id,
                'gifter_id' => 1, // Test user ID
                'deliverable_type' => 'media_bundle',
                'product_type' => 'wish',
                'transaction_amount' => $wishItem->price,
                'status' => 'pending',
                'customer_email' => 'test@example.com',
                'customer_name' => 'Test Customer',
                'payment_currency' => $wishItem->currency ?? 'GBP',
                'metadata' => json_encode([
                    'certificate' => 'true',
                    'product_type' => 'wish_item',
                    'wish_id' => $wishItem->id,
                    'creator_id' => $wishItem->user_id,
                ]),
            ]);

            $this->info("Created test deliverable: {$deliverable->uuid}");

            // Test certificate service directly
            $this->info('Testing CertificateService directly...');
            $certificateService = app(CertificateService::class);
            $certificateUrl = $certificateService->generateAndUploadCertificate($deliverable, $wishItem);

            if ($certificateUrl) {
                $this->info('✅ Certificate generated and uploaded successfully!');
                $this->info("Certificate URL: {$certificateUrl}");

                // Update deliverable with certificate URL
                $deliverable->update(['certificate_url' => $certificateUrl]);

            } else {
                $this->error('❌ Certificate generation failed!');
            }

            // Test the full job processing
            $this->info("\nTesting full ProcessWishItemDeliverable job...");

            // Reset deliverable status for job test
            $deliverable->update(['status' => 'pending', 'certificate_url' => null]);

            // Process the deliverable job
            ProcessWishItemDeliverable::dispatchSync($deliverable);

            // Check results
            $deliverable->refresh();

            if ($deliverable->status === 'delivered') {
                $this->info('✅ Deliverable job processed successfully!');
                $this->info("Status: {$deliverable->status}");
                $this->info('Certificate URL: '.($deliverable->certificate_url ?? 'Not generated'));
                $this->info('Content URL: '.($deliverable->content_url ?? 'Not generated'));

                if ($deliverable->certificate_url) {
                    $this->info('🎉 Certificate system is working correctly!');
                }

            } else {
                $this->error('❌ Deliverable job failed!');
                $this->error("Status: {$deliverable->status}");

                $metadata = $deliverable->metadata;
                if (isset($metadata['failure_reason'])) {
                    $this->error("Failure reason: {$metadata['failure_reason']}");
                }
            }

            // Clean up test deliverable
            $this->info("\nCleaning up test deliverable...");
            $deliverable->delete();
            $this->info('Test completed successfully!');

        } catch (\Exception $e) {
            $this->error('Test failed with exception: '.$e->getMessage());
            $this->error('Trace: '.$e->getTraceAsString());

            return 1;
        }

        return 0;
    }
}
