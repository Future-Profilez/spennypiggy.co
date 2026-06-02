<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Payment;
use App\Models\FinancialTransaction;
use App\Models\PiggyPotContribution;
use App\Models\User;

// Force the age of user #80 to be new for the sake of the script check if it's currently > 30 days
$creator = User::find(80);
$reservePolicy = app(\App\Services\Risk\ReservePolicy::class);
$metrics = app(\App\Services\Risk\RiskService::class)->recalculateMetrics((string) $creator->uuid);
$reservePercent = $reservePolicy->getEffectiveReservePercent($creator, $metrics);

echo "Creator ID: {$creator->id}, Age days: " . $creator->created_at->diffInDays(now()) . "\n";
echo "Current reserve percent applied by engine: {$reservePercent}%\n";
