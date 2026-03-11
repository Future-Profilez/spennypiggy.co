<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\TaskPurchase;
use App\Models\BillPayment;
use Illuminate\Support\Str;

class SyncFinancialTransactions extends Command
{
    protected $signature = 'finance:sync-transactions {--force : Force sync all transactions}';
    protected $description = 'Sync all payment records to the financial_transactions table';

    public function handle()
    {
        $this->info('Starting financial transaction sync...');

        if ($this->option('force')) {
            FinancialTransaction::truncate();
            $this->info('Truncated existing transactions.');
        }

        // 1. Sync Memberships
        $this->syncMemberships();

        // 2. Sync Tasks
        $this->syncTasks();

        // 3. Sync Bills
        $this->syncBills();

        // 4. Sync Wishes
        $this->syncWishes();

        // 5. Sync Shops
        $this->syncShops();

        // 6. Sync Tips
        $this->syncTips();

        $this->info('Sync completed successfully!');
    }

    private function syncMemberships()
    {
        $this->info('Syncing Memberships...');
        MembershipPayment::with('membership')->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->membership) continue;
                
                $creatorId = $payment->membership->user_id;
                $amount = $payment->amount;
                $vat = $payment->vat_tax_amount ?? 0;
                $stripeFee = $payment->stripe_fee_actual ?? 0;
                $net = $amount - $vat - $stripeFee;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => MembershipPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => 0, // Need logic
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Membership Payment',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncTasks()
    {
        $this->info('Syncing Tasks...');
        TaskPurchase::chunk(100, function ($purchases) {
            foreach ($purchases as $purchase) {
                // TaskPurchase has creator_id directly
                $amount = $purchase->amount;
                $vat = $purchase->vat_amount ?? 0;
                $platformFee = $purchase->platform_fee ?? 0;
                // Stripe fee usually deducted from payout or calculated
                $stripeFee = 0; // Placeholder
                $net = $amount - $vat - $platformFee - $stripeFee;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => TaskPurchase::class,
                        'source_id' => $purchase->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $purchase->creator_id,
                        'supporter_id' => $purchase->supporter_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => 'GBP', // Task usually GBP?
                        'status' => $purchase->status === 'paid' ? 'completed' : $purchase->status,
                        'description' => 'Task Purchase',
                        'transaction_date' => $purchase->created_at,
                    ]
                );
            }
        });
    }

    private function syncBills()
    {
        $this->info('Syncing Bills...');
        BillPayment::with('bill')->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->bill) continue;

                $creatorId = $payment->bill->user_id;
                $amount = $payment->amount;
                // Assuming similar structure
                $vat = 0; 
                $net = $amount;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => BillPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => 0,
                        'stripe_fee' => 0,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Bill Payment',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncWishes()
    {
        $this->info('Syncing Wishes...');
        // StripePaymentItems linked to StripePaymentDetail linked to Owner (Creator)
        \App\Models\StripePaymentItems::with(['payment', 'wish'])->chunk(100, function ($items) {
            foreach ($items as $item) {
                if (!$item->payment) continue;

                $creatorId = $item->payment->owner_id;
                // Fallback to wish item creator if payment owner missing?
                if (!$creatorId && $item->wish) {
                    $creatorId = $item->wish->user_id;
                }
                
                if (!$creatorId) continue;

                $amount = $item->amount;
                $vat = $item->tax ?? 0;
                // Platform fee logic would go here
                $platformFee = 0; 
                $stripeFee = 0;
                $net = $amount - $vat - $platformFee - $stripeFee;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => \App\Models\StripePaymentItems::class,
                        'source_id' => $item->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $creatorId,
                        'supporter_id' => $item->payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => strtoupper($item->payment->currency ?? 'GBP'),
                        'status' => $item->payment->payment_status === 'paid' ? 'completed' : 'pending',
                        'description' => 'Wish Gift: ' . ($item->wish->name ?? 'Item'),
                        'transaction_date' => $item->created_at,
                    ]
                );
            }
        });
    }

    private function syncShops()
    {
        $this->info('Syncing Shops...');
        \App\Models\ShopPayment::with('shop')->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->shop) continue;

                $creatorId = $payment->shop->user_id;
                $amount = $payment->amount;
                $vat = $payment->vat_tax_amount ?? 0;
                $net = $amount - $vat;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => \App\Models\ShopPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => 0,
                        'stripe_fee' => 0,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $payment->payment_status === 'paid' ? 'completed' : 'pending',
                        'description' => 'Shop Purchase: ' . ($payment->shop->name ?? 'Item'),
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncTips()
    {
        $this->info('Syncing Tips...');
        \App\Models\TipGoalsPayment::chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                $creatorId = $payment->creator_id;
                if (!$creatorId) continue;

                $amount = $payment->amount;
                $vat = $payment->tax ?? 0;
                $net = $amount - $vat;

                FinancialTransaction::firstOrCreate(
                    [
                        'source_type' => \App\Models\TipGoalsPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'uuid' => (string) Str::uuid(),
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $amount,
                        'platform_fee' => 0,
                        'stripe_fee' => 0,
                        'vat_amount' => $vat,
                        'net_amount' => $net,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $payment->status === 'succeeded' ? 'completed' : 'pending',
                        'description' => 'Tip / Support',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }
}
