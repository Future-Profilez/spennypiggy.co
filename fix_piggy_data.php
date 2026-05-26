<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Payment;
use App\Models\FinancialTransaction;
use App\Models\PiggyPotContribution;

$fts = FinancialTransaction::where('source_type', PiggyPotContribution::class)->get();

foreach ($fts as $ft) {
    $contribution = PiggyPotContribution::find($ft->source_id);
    if ($contribution && $contribution->session_id) {
        $payment = Payment::where('stripe_session_id', $contribution->session_id)->first();
        if ($payment && $payment->reserve_amount_minor > 0) {
            $reserveMajor = $payment->reserve_amount_minor / 100;
            echo "Updating FT {$ft->id}, setting reserve to {$reserveMajor}\n";
            $ft->reserve_amount = $reserveMajor;
            $ft->reserve_status = 'held';
            $ft->save();
        }
    }
}
echo "Done.\n";
