<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\CheckoutToUser;
use App\Models\Deliverable;
use Illuminate\Support\Str;

// Create a mock payment object
$payment = new stdClass();
$payment->id = 'test-' . time();
$payment->user_id = 1;
$payment->stripe_product_id = 'test_product';
$payment->stripe_price_id = 'test_price';
$payment->stripe_payment_intent_id = 'test_intent';
$payment->stripe_session_id = 'test_session';
$payment->amount = 1000; // $10.00
$payment->amount_subtotal = 1000;
$payment->currency = 'gbp';

// Create a mock user object
$user = \App\Models\User::first();
if (!$user) {
    echo "Error: No users found in the database.\n";
    exit(1);
}

$payment->user = $user;

// Log the test
echo "Starting email test...\n";
echo "Using user: {$user->name} ({$user->email})\n";

// Create deliverable record
try {
    $deliverable = Deliverable::create([
        'uuid' => Str::uuid(),
        'product_id' => $payment->stripe_product_id,
        'price_id' => $payment->stripe_price_id,
        'creator_id' => null,
        'gifter_id' => $user->id,
        'payment_intent_id' => $payment->stripe_payment_intent_id,
        'session_id' => $payment->stripe_session_id,
        'deliverable_type' => 'email',
        'product_type' => 'test',
        'transaction_amount' => 10.00,
        'deliverable_url' => null,
        'metadata' => json_encode([
            'email_type' => 'test_email',
            'payment_id' => $payment->id
        ]),
        'status' => 'delivered',
        'delivered_at' => now()
    ]);
    
    echo "Deliverable record created successfully with ID: {$deliverable->id}\n";
} catch (\Exception $e) {
    echo "Error creating deliverable record: {$e->getMessage()}\n";
}

// Send test email
try {
    echo "Sending test email to {$user->email}...\n";
    Mail::to($user->email)->queue(new CheckoutToUser($payment, '£'));
    echo "Email queued successfully!\n";
} catch (\Exception $e) {
    echo "Error sending email: {$e->getMessage()}\n";
    echo "Stack trace: {$e->getTraceAsString()}\n";
}

echo "Test completed. Check the queue worker output and database for results.\n";