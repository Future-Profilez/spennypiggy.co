<?php

use Illuminate\Support\Facades\DB;

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$columns = DB::select('DESCRIBE audit_logs');

echo "Current audit_logs table structure:\n";
echo str_pad("Field", 25) . "| Type\n";
echo str_repeat("-", 60) . "\n";

foreach($columns as $col) {
    echo str_pad($col->Field, 25) . "| " . $col->Type . "\n";
}
