<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Services\Risk\ReservePolicy;
use App\Services\Risk\RiskService;
use Illuminate\Contracts\Console\Kernel;

// Force the age of user #80 to be new for the sake of the script check if it's currently > 30 days
$creator = User::find(80);
$reservePolicy = app(ReservePolicy::class);
$metrics = app(RiskService::class)->recalculateMetrics((string) $creator->uuid);
$reservePercent = $reservePolicy->getEffectiveReservePercent($creator, $metrics);

echo "Creator ID: {$creator->id}, Age days: ".$creator->created_at->diffInDays(now())."\n";
echo "Current reserve percent applied by engine: {$reservePercent}%\n";
