<?php

require_once 'vendor/autoload.php';

use Stripe\Stripe;
use Stripe\PaymentIntent;
use Stripe\Transfer;

// Set your Stripe secret key
Stripe::setApiKey(env('STRIPE_SECRET_KEY') ?? getenv('STRIPE_SECRET_KEY'));

echo "🔍 Analyzing Stripe transactions from last 28 days...\n\n";

// Calculate 28 days ago timestamp
$twentyEightDaysAgo = time() - (28 * 24 * 60 * 60);

try {
    // Get payment intents from last 28 days
    $paymentIntents = PaymentIntent::all([
        'created' => [
            'gte' => $twentyEightDaysAgo,
        ],
        'limit' => 100,
    ]);

    echo "Found " . count($paymentIntents->data) . " payment intents in last 28 days\n";
    echo "=" . str_repeat("=", 60) . "\n\n";

    $directChargesCount = 0;
    $destinationChargesCount = 0;
    $totalAmount = 0;

    foreach ($paymentIntents->data as $pi) {
        $amount = $pi->amount / 100; // Convert from cents
        $currency = strtoupper($pi->currency);
        $totalAmount += $amount;
        
        echo "Payment Intent: {$pi->id}\n";
        echo "Amount: {$currency} {$amount}\n";
        echo "Status: {$pi->status}\n";
        echo "Created: " . date('Y-m-d H:i:s', $pi->created) . "\n";

        // Check if it's a direct charge or destination charge
        if (!empty($pi->transfer_data)) {
            // This is a DIRECT CHARGE
            $directChargesCount++;
            echo "🔴 TYPE: DIRECT CHARGE\n";
            echo "   Transfer to: {$pi->transfer_data->destination}\n";
            if (isset($pi->application_fee_amount)) {
                $fee = $pi->application_fee_amount / 100;
                echo "   Platform fee: {$currency} {$fee}\n";
            }
        } elseif (isset($pi->on_behalf_of) || isset($pi->application_fee_amount)) {
            // This is a DESTINATION CHARGE
            $destinationChargesCount++;
            echo "🟢 TYPE: DESTINATION CHARGE\n";
            if (isset($pi->on_behalf_of)) {
                echo "   On behalf of: {$pi->on_behalf_of}\n";
            }
            if (isset($pi->application_fee_amount)) {
                $fee = $pi->application_fee_amount / 100;
                echo "   Platform fee: {$currency} {$fee}\n";
            }
        } else {
            echo "🔵 TYPE: STANDARD CHARGE (Platform only)\n";
        }

        echo "---\n\n";
    }

    // Summary
    echo "📊 SUMMARY\n";
    echo "=" . str_repeat("=", 30) . "\n";
    echo "Total Transactions: " . count($paymentIntents->data) . "\n";
    echo "Direct Charges: {$directChargesCount}\n";
    echo "Destination Charges: {$destinationChargesCount}\n";
    echo "Standard Charges: " . (count($paymentIntents->data) - $directChargesCount - $destinationChargesCount) . "\n";
    echo "Total Amount Processed: " . number_format($totalAmount, 2) . "\n\n";

    if ($directChargesCount > 0) {
        echo "⚠️  WARNING: Found {$directChargesCount} direct charges!\n";
        echo "   This means some payments went through your platform account first.\n";
    } else {
        echo "✅ GOOD: No direct charges found. All payments are destination charges.\n";
    }

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\nMake sure your STRIPE_SECRET_KEY is set in your .env file.\n";
}

echo "\n🔍 You can also check manually in Stripe Dashboard:\n";
echo "1. Go to Payments → Overview\n";
echo "2. Look for transactions with 'Transfer to connected account' = Direct charges\n";
echo "3. Look for transactions without transfers = Destination charges\n";

?>
