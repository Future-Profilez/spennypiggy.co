<?php

$content = file_get_contents('app/Console/Commands/SyncFinancialTransactions.php');

// syncTasks
$content = str_replace(
    '                if ($purchase->isDirty()) {
                    $purchase->save();
                }',
    "                if (\$purchase->isDirty()) {
                    \$purchase->save();
                }

                \$status = \$purchase->status === 'paid' ? 'completed' : \$purchase->status;
                \$paymentLog = \App\Models\Payment::where('stripe_session_id', \$purchase->stripe_session_id)->first();
                if (\$paymentLog) {
                    \$status = match(\$paymentLog->status) {
                        'succeeded' => 'completed',
                        'review_hold' => 'review_hold',
                        'disputed' => 'disputed',
                        'refunded' => 'refunded',
                        'failed', 'blocked' => 'failed',
                        default => 'pending'
                    };
                }",
    $content
);

$content = str_replace(
    "                        'status' => \$purchase->status === 'paid' ? 'completed' : \$purchase->status,",
    "                        'status' => \$status,",
    $content
);

// syncBills
$content = preg_replace(
    "/\\\$creatorAmount = \\\$amount;.*?FinancialTransaction::updateOrCreate\(/s",
    "\$creatorAmount = \$amount;

                \$status = 'completed';
                \$paymentLog = \App\Models\Payment::where('stripe_session_id', \$payment->session_id)->first();
                if (\$paymentLog) {
                    \$status = match(\$paymentLog->status) {
                        'succeeded' => 'completed',
                        'review_hold' => 'review_hold',
                        'disputed' => 'disputed',
                        'refunded' => 'refunded',
                        'failed', 'blocked' => 'failed',
                        default => 'pending'
                    };
                }

                FinancialTransaction::updateOrCreate(",
    $content,
    1
);

// syncWishes
$content = preg_replace(
    "/\\\$creatorAmount = \\\$amount;.*?FinancialTransaction::updateOrCreate\(/s",
    "\$creatorAmount = \$amount;

                \$status = \$item->payment->payment_status === 'paid' ? 'completed' : 'pending';
                \$paymentLog = \App\Models\Payment::where('stripe_session_id', \$item->payment->session_id)->first();
                if (\$paymentLog) {
                    \$status = match(\$paymentLog->status) {
                        'succeeded' => 'completed',
                        'review_hold' => 'review_hold',
                        'disputed' => 'disputed',
                        'refunded' => 'refunded',
                        'failed', 'blocked' => 'failed',
                        default => 'pending'
                    };
                }

                FinancialTransaction::updateOrCreate(",
    $content,
    1
);

// syncShops
$content = preg_replace(
    "/\\\$creatorAmount = \\\$amount;.*?FinancialTransaction::updateOrCreate\(/s",
    "\$creatorAmount = \$amount;

                \$status = \$payment->payment_status === 'paid' ? 'completed' : 'pending';
                \$paymentLog = \App\Models\Payment::where('stripe_session_id', \$payment->session_id)->first();
                if (\$paymentLog) {
                    \$status = match(\$paymentLog->status) {
                        'succeeded' => 'completed',
                        'review_hold' => 'review_hold',
                        'disputed' => 'disputed',
                        'refunded' => 'refunded',
                        'failed', 'blocked' => 'failed',
                        default => 'pending'
                    };
                }

                FinancialTransaction::updateOrCreate(",
    $content,
    1
);

// syncTips
$content = preg_replace(
    "/\\\$normalizedStatus = in_array\\\(\\\$status, \\['paid', 'succeeded', 'completed', 'paid_out'\\], true\\) \? 'completed' : \\\(\\\$status \?: 'pending'\\\);.*?FinancialTransaction::updateOrCreate\(/s",
    "\$normalizedStatus = in_array(\$status, ['paid', 'succeeded', 'completed', 'paid_out'], true) ? 'completed' : (\$status ?: 'pending');

                \$paymentLog = \App\Models\Payment::where('stripe_session_id', \$payment->session_id)->first();
                if (\$paymentLog) {
                    \$normalizedStatus = match(\$paymentLog->status) {
                        'succeeded' => 'completed',
                        'review_hold' => 'review_hold',
                        'disputed' => 'disputed',
                        'refunded' => 'refunded',
                        'failed', 'blocked' => 'failed',
                        default => 'pending'
                    };
                }

                FinancialTransaction::updateOrCreate(",
    $content,
    1
);

// fix statuses in updateOrCreate calls
$content = str_replace("'status' => 'completed',\n                        'description' => 'Bill Payment'", "'status' => \$status,\n                        'description' => 'Bill Payment'", $content);
$content = str_replace("'status' => \$item->payment->payment_status === 'paid' ? 'completed' : 'pending',\n                        'description' => 'Wish Gift:'", "'status' => \$status,\n                        'description' => 'Wish Gift:'", $content);
$content = str_replace("'status' => \$payment->payment_status === 'paid' ? 'completed' : 'pending',\n                        'description' => 'Shop Purchase:'", "'status' => \$status,\n                        'description' => 'Shop Purchase:'", $content);

file_put_contents('app/Console/Commands/SyncFinancialTransactions.php', $content);
echo 'Done';
