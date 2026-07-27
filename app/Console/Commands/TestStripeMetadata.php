<?php

namespace App\Console\Commands;

use App\Helpers;
use Illuminate\Console\Command;

class TestStripeMetadata extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'test:stripe-metadata';

    /**
     * The console command description.
     */
    protected $description = 'Test refined Stripe metadata structures for compliance with Stripe limits';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Testing refined Stripe metadata structures...');
        $this->newLine();

        $results = $this->testAllPaymentTypes();
        $this->displayResults($results);

        // Summary
        $totalValid = array_sum(array_column($results, 'valid'));
        $totalTests = count($results);

        $this->newLine();
        $this->info('=== SUMMARY ===');
        $this->info("Passed: $totalValid/$totalTests payment types");

        if ($totalValid === $totalTests) {
            $this->info('🎉 All metadata structures are Stripe-compliant!');

            return Command::SUCCESS;
        } else {
            $this->error('❌ Some metadata structures need fixes');

            return Command::FAILURE;
        }
    }

    private function testAllPaymentTypes(): array
    {
        $results = [];

        // Test Support Payment
        $supportPayment = (object) [
            'uuid' => '12345-67890-abcdef',
            'user_id' => 1,
            'creator_id' => 2,
            'tip_goal_id' => 10,
            'message' => 'Thank you for your amazing content! Keep up the great work and continue creating awesome stuff.',
            'anonymous' => 0,
            'guest_name' => 'John Doe',
            'guest_email' => 'john@example.com',
            'user' => (object) ['name' => 'John Doe', 'email' => 'john@example.com'],
            'creator' => (object) ['name' => 'Amazing Creator Name', 'username' => 'creator123'],
        ];

        $supportMetadata = Helpers::buildStripeMetadata('support_payment', $supportPayment);
        $results['support'] = $this->validateMetadata($supportMetadata, 'support_payment');

        // Test Wishlist Payment
        $wishPayment = (object) [
            'uuid' => '12345-67890-wishlist',
            'user_id' => 1,
            'owner_id' => 2,
            'wish_item_id' => 5,
            'anonymous' => 0,
            'name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'user' => (object) ['name' => 'Jane Doe', 'email' => 'jane@example.com'],
            'owner' => (object) ['name' => 'Amazing Creator Name', 'username' => 'creator123'],
            'wish_item' => (object) [
                'name' => 'Custom Photo Set Request with Extended Description',
                'content_file' => 'some-content-file-uuid-12345.jpg',
                'reward' => null,
            ],
        ];

        $wishMetadata = Helpers::buildStripeMetadata('wishlist', $wishPayment);
        $results['wishlist'] = $this->validateMetadata($wishMetadata, 'wishlist');

        // Test Bill Payment
        $billPayment = (object) [
            'uuid' => '12345-67890-bill-payment',
            'user_id' => 1,
            'creator_id' => 2,
            'bills_id' => 15,
            'recurring_type' => 'monthly',
            'guest_name' => 'Bill Payer Name',
            'guest_email' => 'payer@example.com',
            'user' => (object) ['name' => 'Bill Payer Name', 'email' => 'payer@example.com'],
            'bill' => (object) [
                'name' => 'Monthly Content Subscription Service',
                'user_id' => 2,
                'content_file' => 'monthly-content-bundle.zip',
            ],
            'creator' => (object) ['name' => 'Amazing Creator Name', 'username' => 'creator123'],
        ];

        $billMetadata = Helpers::buildStripeMetadata('bill_payment', $billPayment);
        $results['bill'] = $this->validateMetadata($billMetadata, 'bill_payment');

        return $results;
    }

    private function validateMetadata(array $metadata, string $paymentType): array
    {
        $errors = [];
        $warnings = [];

        // Check total key count (Stripe limit: 50)
        if (count($metadata) > 50) {
            $errors[] = 'Too many metadata keys: '.count($metadata).' (limit: 50)';
        }

        // Check each key and value
        foreach ($metadata as $key => $value) {
            // Check key length (Stripe limit: 40 characters)
            if (strlen($key) > 40) {
                $errors[] = "Key '$key' too long: ".strlen($key).' chars (limit: 40)';
            }

            // Check value length (Stripe limit: 500 characters)
            if (strlen($value) > 500) {
                $errors[] = "Value for '$key' too long: ".strlen($value).' chars (limit: 500)';
            }

            // Warnings for values approaching limit
            if (strlen($value) > 400) {
                $warnings[] = "Value for '$key' approaching limit: ".strlen($value).' chars';
            }
        }

        return [
            'valid' => empty($errors),
            'key_count' => count($metadata),
            'errors' => $errors,
            'warnings' => $warnings,
            'payment_type' => $paymentType,
            'metadata' => $metadata,
        ];
    }

    private function displayResults(array $results): void
    {
        foreach ($results as $type => $result) {
            $this->info('=== '.strtoupper($type).' PAYMENT METADATA ===');
            $this->info('Keys: '.$result['key_count'].'/50');
            $this->info('Valid: '.($result['valid'] ? 'YES' : 'NO'));

            // Show metadata fields for review
            $this->comment('Metadata fields:');
            foreach ($result['metadata'] as $key => $value) {
                $valuePreview = strlen($value) > 50 ? substr($value, 0, 47).'...' : $value;
                $this->line("  $key: $valuePreview (".strlen($value).' chars)');
            }

            if (! empty($result['errors'])) {
                $this->error('ERRORS:');
                foreach ($result['errors'] as $error) {
                    $this->error("  - $error");
                }
            }

            if (! empty($result['warnings'])) {
                $this->warn('WARNINGS:');
                foreach ($result['warnings'] as $warning) {
                    $this->warn("  - $warning");
                }
            }

            if ($result['valid'] && empty($result['warnings'])) {
                $this->info('✅ All validation checks passed!');
            }

            $this->newLine();
        }
    }
}
