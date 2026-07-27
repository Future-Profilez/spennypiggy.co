<?php

use App\Models\User;
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$request = Request::capture();
$app->instance('request', $request);
$kernel->bootstrap();

try {
    $user = User::first();
    echo 'Value: '.$user->upcoming_payment_date."\n";
} catch (Exception $e) {
    echo 'Exception: '.$e->getMessage()."\n";
}
