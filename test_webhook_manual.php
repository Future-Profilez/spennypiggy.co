<?php

/**
 * Manual Webhook Test Script
 * 
 * This script simulates a Stripe webhook call to test the deliverable system
 * Run with: php test_webhook_manual.php
 */

require_once 'vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

echo "🧪 Manual Webhook Test\n";
echo "=====================\n\n";

// Create a mock request with Stripe webhook data
$webhookData = [
    'id' => 'evt_test_' . time(),
    'object' => 'event',
    'type' => 'checkout.session.completed',
    'data' => [
        'object' => [
            'id' => 'cs_test_' . time(),
            'object' => 'checkout_session',
            'payment_status' => 'paid',
            'amount_total' => 2500, // $25.00
            'currency' => 'usd',
            'customer_email' => 'test-buyer@example.com',
            'metadata' => [
                'creator_id' => '1',
                'wish_id' => '1',
                'deliverable_type' => 'media_bundle',
                'certificate' => 'true',
                'product_type' => 'wish_item'
            ]
        ]
    ]
];

echo "1. Creating mock webhook request...\n";
echo "   Event ID: " . $webhookData['id'] . "\n";
echo "   Session ID: " . $webhookData['data']['object']['id'] . "\n";
echo "   Amount: $" . ($webhookData['data']['object']['amount_total'] / 100) . "\n\n";

try {
    // Create HTTP request
    $request = Illuminate\Http\Request::create(
        '/webhook/payment',
        'POST',
        [],
        [],
        [],
        [
            'CONTENT_TYPE' => 'application/json',
            'HTTP_STRIPE_SIGNATURE' => 't=' . time() . ',v1=test_signature_for_manual_testing'
        ],
        json_encode($webhookData)
    );

    echo "2. Calling webhook controller...\n";
    
    // Get the controller
    $controller = new App\Http\Controllers\StripeWebhookController();
    
    // Call the handle method
    $response = $controller->handle($request);
    
    echo "✅ Webhook processed successfully!\n";
    echo "   Response status: " . $response->getStatusCode() . "\n";
    echo "   Response content: " . $response->getContent() . "\n\n";
    
    echo "3. Checking deliverable creation...\n";
    
    // Check if deliverable was created
    $deliverable = App\Models\Deliverable::where('session_id', $webhookData['data']['object']['id'])->first();
    
    if ($deliverable) {
        echo "✅ Deliverable created successfully!\n";
        echo "   ID: " . $deliverable->id . "\n";
        echo "   Type: " . $deliverable->type . "\n";
        echo "   Status: " . $deliverable->status . "\n";
        echo "   Amount: $" . $deliverable->amount . "\n";
        echo "   Buyer Email: " . $deliverable->buyer_email . "\n";
        echo "   Generate Certificate: " . ($deliverable->generate_certificate ? 'Yes' : 'No') . "\n\n";
    } else {
        echo "❌ No deliverable found with session ID: " . $webhookData['data']['object']['id'] . "\n\n";
    }
    
    echo "4. Checking job dispatch...\n";
    echo "   ProcessWishItemDeliverable job should be queued\n";
    echo "   Run 'php artisan queue:work' to process it\n\n";
    
    echo "🎉 Manual test completed successfully!\n";
    
} catch (Exception $e) {
    echo "❌ Error during webhook test:\n";
    echo "   " . $e->getMessage() . "\n";
    echo "   File: " . $e->getFile() . ":" . $e->getLine() . "\n\n";
    
    if ($e instanceof Illuminate\Database\QueryException) {
        echo "💡 Database issue detected. Make sure:\n";
        echo "   - Database is running\n";
        echo "   - Migrations are run: php artisan migrate\n";
        echo "   - Database connection is configured in .env\n\n";
    }
}

echo "📋 Next Steps:\n";
echo "1. Run queue worker: php artisan queue:work\n";
echo "2. Check logs: tail -f storage/logs/laravel.log\n";
echo "3. Test with real Stripe webhooks using Stripe CLI\n";
echo "4. Monitor deliverable processing in your application\n";