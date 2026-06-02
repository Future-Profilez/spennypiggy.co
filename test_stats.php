<?php
$payments = App\Models\Payment::all();
$creatorIds = $payments->pluck('receiver_id')->unique();

foreach($creatorIds as $id) {
    if (!$id) continue;
    $creator = App\Models\User::find($id);
    if (!$creator) continue;
    
    echo "\nCreator: " . $creator->username . "\n";
    
    $finService = new App\Services\FinancialService();
    $stats = $finService->getCreatorStats($creator);
    
    echo "Total Earnings (Gross for Creator): " . ($stats['total_earnings_minor'] / 100) . "\n";
    echo "Pending Reserves: " . ($stats['pending_reserves_minor'] / 100) . "\n";
    echo "Expected Next Payout: " . ($stats['expected_next_payout_minor'] / 100) . "\n";
    
    echo "Payments:\n";
    $userPayments = App\Models\Payment::where('receiver_id', $id)->get();
    foreach($userPayments as $p) {
        echo "- ID: {$p->id} | Gross: {$p->amount} | Net: {$p->net_amount} | Reserve: " . ($p->reserve_amount_minor/100) . " | Status: {$p->status}\n";
    }
}
