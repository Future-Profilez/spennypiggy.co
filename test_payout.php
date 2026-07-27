<?php

use App\Services\Risk\PayoutService;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

app(PayoutService::class)->calculatePayouts();
