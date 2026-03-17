<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\TaskPurchase;
use App\Models\BillPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentItems;
use App\Models\TipGoalsPayment;

class SyncFinancialTransactions extends Command
{
    protected $signature = 'finance:sync-transactions {--force : Force sync all transactions} {--user_id= : Only sync transactions for this creator user_id}';
    protected $description = 'Sync all payment records to the financial_transactions table';

    public function handle()
    {
        $this->info('Starting financial transaction sync...');

        $userId = $this->option('user_id');

        if ($this->option('force')) {
            if ($userId) {
                FinancialTransaction::where('user_id', $userId)->delete();
                $this->info("Cleared existing transactions for user_id={$userId}.");
            } else {
                FinancialTransaction::truncate();
                $this->info('Truncated existing transactions.');
            }
        }

        // 1. Sync Memberships
        $this->syncMemberships($userId);

        // 2. Sync Tasks
        $this->syncTasks($userId);

        // 3. Sync Bills
        $this->syncBills($userId);

        // 4. Sync Wishes
        $this->syncWishes($userId);

        // 5. Sync Shops
        $this->syncShops($userId);

        // 6. Sync Tips
        $this->syncTips($userId);

        $this->info('Sync completed successfully!');
    }

    private function syncMemberships($userId = null)
    {
        $this->info('Syncing Memberships...');

        $query = MembershipPayment::with('membership');
        if ($userId) {
            $query->whereHas('membership', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->membership) continue;
                
                $creatorId = $payment->membership->user_id;
                $amount = $payment->amount;
                $vat = $payment->vat_tax_amount ?? 0;
                $platformFee = $payment->tax ?? 0;
                $stripeFee = $payment->stripe_fee_actual ?? 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => MembershipPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Membership Payment',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncTasks($userId = null)
    {
        $this->info('Syncing Tasks...');

        $query = TaskPurchase::query();
        if ($userId) {
            $query->where('creator_id', $userId);
        }

        $query->chunk(100, function ($purchases) {
            foreach ($purchases as $purchase) {
                // TaskPurchase has creator_id directly
                $amount = $purchase->amount;
                $vat = $purchase->vat_amount ?? 0;
                $platformFee = ($purchase->platform_fee ?? 0) + ($purchase->admin_fee ?? 0);
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => TaskPurchase::class,
                        'source_id' => $purchase->id,
                    ],
                    [
                        'user_id' => $purchase->creator_id,
                        'supporter_id' => $purchase->supporter_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => 'GBP', // Task usually GBP?
                        'status' => $purchase->status === 'paid' ? 'completed' : $purchase->status,
                        'description' => 'Task Purchase',
                        'transaction_date' => $purchase->created_at,
                    ]
                );
            }
        });
    }

    private function syncBills($userId = null)
    {
        $this->info('Syncing Bills...');

        $query = BillPayment::with('bill');
        if ($userId) {
            $query->whereHas('bill', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->bill) continue;

                $creatorId = $payment->bill->user_id;
                $amount = $payment->amount;
                $vat = $payment->vat_tax_amount ?? 0;
                $platformFee = $payment->tax ?? 0;
                $stripeFee = $payment->stripe_fee_actual ?? 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => BillPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => 'completed',
                        'description' => 'Bill Payment',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncWishes($userId = null)
    {
        $this->info('Syncing Wishes...');
        // StripePaymentItems linked to StripePaymentDetail linked to Owner (Creator)

        $query = StripePaymentItems::with(['payment', 'wish']);
        if ($userId) {
            $query->where(function ($q) use ($userId) {
                $q->whereHas('payment', function ($p) use ($userId) {
                    $p->where('owner_id', $userId);
                })->orWhereHas('wish', function ($w) use ($userId) {
                    $w->where('user_id', $userId);
                });
            });
        }

        $query->chunk(100, function ($items) {
            foreach ($items as $item) {
                if (!$item->payment) continue;

                $creatorId = $item->payment->owner_id;
                // Fallback to wish item creator if payment owner missing?
                if (!$creatorId && $item->wish) {
                    $creatorId = $item->wish->user_id;
                }
                
                if (!$creatorId) continue;

                $amount = $item->amount;
                $vat = $item->vat_amount ?? ($item->tax ?? 0);
                $platformFee = $item->tax ?? 0;
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => StripePaymentItems::class,
                        'source_id' => $item->id,
                    ],
                    [
                        'user_id' => $creatorId,
                        'supporter_id' => $item->payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($item->payment->currency ?? 'GBP'),
                        'status' => $item->payment->payment_status === 'paid' ? 'completed' : 'pending',
                        'description' => 'Wish Gift: ' . ($item->wish->name ?? 'Item'),
                        'transaction_date' => $item->created_at,
                    ]
                );
            }
        });
    }

    private function syncShops($userId = null)
    {
        $this->info('Syncing Shops...');

        $query = ShopPayment::with('shop');
        if ($userId) {
            $query->whereHas('shop', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->shop) continue;

                $creatorId = $payment->shop->user_id;
                $amount = $payment->amount;
                $vat = $payment->vat_tax_amount ?? 0;
                $platformFee = $payment->tax_amount ?? 0;
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => ShopPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $payment->payment_status === 'paid' ? 'completed' : 'pending',
                        'description' => 'Shop Purchase: ' . ($payment->shop->name ?? 'Item'),
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncTips($userId = null)
    {
        $this->info('Syncing Tips...');

        $query = TipGoalsPayment::query();
        if ($userId) {
            $query->where('creator_id', $userId);
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                $creatorId = $payment->creator_id;
                if (!$creatorId) continue;

                $amount = $payment->amount;
                $vat = $payment->vat_amount ?? 0;
                $platformFee = $payment->tax ?? 0;
                $gross = $payment->total_paid && $payment->total_paid > 0
                    ? (float) $payment->total_paid
                    : ((float) $amount + (float) $vat + (float) $platformFee);
                $stripeFee = max(0, $gross - $platformFee - $amount - $vat);
                $creatorAmount = $amount;

                $status = strtolower((string) ($payment->status ?? ''));
                $normalizedStatus = in_array($status, ['paid', 'succeeded', 'completed', 'paid_out'], true) ? 'completed' : ($status ?: 'pending');

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => TipGoalsPayment::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'user_id' => $creatorId,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $creatorAmount,
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $normalizedStatus,
                        'description' => 'Tip / Support',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }
}
