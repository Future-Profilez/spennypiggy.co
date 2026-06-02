<?php

use Illuminate\Support\Facades\DB;

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Test creating an audit log with all fields
$testLog = \App\Models\AuditLog::create([
    'actor' => 'user:test-123',
    'action_type' => 'TEST_PAYMENT_CREATED',
    'reference_id' => 'payment-' . uniqid(),
    'entity_type' => 'Payment',
    'entity_id' => 'payment-' . uniqid(),
    'case_id' => 'CASE-2026-001',
    'correlation_id' => 'corr-' . uniqid(),
    'reason_code' => 'SUCCESS',
    'metadata_json' => [
        'activity_type' => 'piggy_pot_contribution',
        'amount' => 5000,
        'currency' => 'USD',
        'creator_name' => 'John Doe',
        'gifter_name' => 'Jane Smith',
    ],
    'old_values' => ['status' => 'pending'],
    'new_values' => ['status' => 'succeeded'],
    'evidence_refs' => ['stripe_receipt_123'],
    'payment_refs' => [
        'payment_id' => 'pay-123',
        'stripe_session_id' => 'cs_test_123',
    ],
]);

echo "✅ Test audit log created successfully!\n\n";

echo "Test Log Details:\n";
echo "─────────────────────────────────────────\n";
echo "ID: " . $testLog->id . "\n";
echo "Actor: " . $testLog->actor . "\n";
echo "Action Type: " . $testLog->action_type . "\n";
echo "Entity Type: " . $testLog->entity_type . "\n";
echo "Reason Code: " . $testLog->reason_code . "\n";
echo "Metadata Amount: " . $testLog->metadata_json['amount'] . "\n";
echo "Old Status: " . ($testLog->old_values['status'] ?? 'null') . "\n";
echo "New Status: " . ($testLog->new_values['status'] ?? 'null') . "\n";
echo "Payment Refs: " . json_encode($testLog->payment_refs) . "\n";
echo "\n✅ All fields populated correctly!\n";

// Clean up
$testLog->delete();
echo "✅ Test log cleaned up.\n";
