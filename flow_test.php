<?php

use App\Models\User;
use App\Models\Payment;
use App\Models\CreatorMetric;
use App\Models\RiskIdentity;
use App\Services\Risk\RiskService;
use App\Mail\RiskLevelChanged;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

// 1. Create Dummy User
$user = User::create([
    'name' => 'Flow Test User',
    'email' => 'flowtest_' . Str::random(5) . '@example.com',
    'password' => bcrypt('password'),
    'username' => 'flowtest_' . Str::random(5),
]);

// 2. Create Dummy Risk Identity
$identity = RiskIdentity::create([
    'email_hash' => hash('sha256', $user->email),
    'is_guest' => false,
]);

echo "Created User: {$user->uuid}\n";

// 3. Create Metrics (Initial State)
$metric = CreatorMetric::firstOrCreate(['creator_id' => $user->uuid]);
echo "Initial Risk Level: {$metric->risk_level}\n";

// 4. Simulate High Risk Scenario (Disputes)
// 10 transactions, 2 disputes (20% rate)
for ($i = 0; $i < 8; $i++) {
    Payment::create([
        'creator_id' => $user->uuid,
        'risk_identity_id' => $identity->id,
        'amount' => 1000,
        'currency' => 'GBP',
        'status' => 'succeeded',
        'stripe_payment_intent_id' => 'pi_' . Str::random(10),
    ]);
}
for ($i = 0; $i < 2; $i++) {
    Payment::create([
        'creator_id' => $user->uuid,
        'risk_identity_id' => $identity->id,
        'amount' => 1000,
        'currency' => 'GBP',
        'status' => 'disputed',
        'stripe_payment_intent_id' => 'pi_' . Str::random(10),
    ]);
}

// 5. Trigger Risk Service manually (simulating webhook)
echo "Triggering Risk Service...\n";
$service = new RiskService();

// Mock Mail to check if it would send
// Note: In tinker script mode, Mail::fake() might not persist assertions easily if not in PHPUnit,
// but we can check if the metric updated.
// We'll skip Mail::fake() to let it try to send (it will likely fail on local SMTP or log it).

$metric = $service->recalculateMetrics($user);

echo "New Risk Level: {$metric->risk_level}\n";
echo "Reserve Percent: {$metric->reserve_percent}\n";

if ($metric->risk_level === 'high') {
    echo "SUCCESS: Risk Level updated to High.\n";
} else {
    echo "FAILURE: Risk Level did not update to High.\n";
}

// 6. Cleanup
// Payment::where('creator_id', $user->uuid)->delete();
// CreatorMetric::where('creator_id', $user->uuid)->delete();
// RiskIdentity::where('id', $identity->id)->delete();
// $user->delete();
