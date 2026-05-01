<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\FinancialTransaction;
use App\Models\User;
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

    private function getPaymentRiskData($sessionId, $defaultStatus = 'completed', $paymentIntentId = null)
    {
        $data = [
            'status' => $defaultStatus,
            'reserve_amount' => 0,
            'reserve_status' => 'none',
        ];

        if (!$sessionId && !$paymentIntentId) return $data;

        // Search by both session ID and payment intent ID
        $query = \App\Models\Payment::query();
        if ($sessionId && $paymentIntentId) {
            $query->where(function($q) use ($sessionId, $paymentIntentId) {
                $q->where('stripe_session_id', $sessionId)
                  ->orWhere('stripe_payment_intent_id', $paymentIntentId);
            });
        } elseif ($sessionId) {
            $query->where('stripe_session_id', $sessionId);
        } else {
            $query->where('stripe_payment_intent_id', $paymentIntentId);
        }

        $paymentLog = $query->first();

        if ($paymentLog) {
            $data['status'] = match($paymentLog->status) {
                'succeeded' => 'completed',
                'review_hold' => 'review_hold',
                'disputed' => 'disputed',
                'refunded' => 'refunded',
                'failed', 'blocked' => 'failed',
                'initiated' => 'pending',
                default => 'pending'
            };
            
            if ($paymentLog->reserve_amount_minor > 0) {
                $data['reserve_amount'] = $paymentLog->reserve_amount_minor / 100;
                $data['reserve_status'] = $paymentLog->payout_run_id ? 'released' : 'held';
            }
        }

        return $data;
    }

    /**
     * Determine the reserve amount from creator's net amount.
     * Rule:
     *   1. If risk engine has set reserve_percent on CreatorMetric → apply that % to netAmount.
     *   2. Else if payment was within creator's first 30 days → apply 10% to netAmount.
     *   3. Otherwise → no reserve.
     * Reserve is always calculated from creator net amount, never from gross/total.
     */
    private function determineReserve(float $netAmount, array $riskData, $creator, \Carbon\Carbon $paymentDate): array
    {
        if ($netAmount <= 0) {
            return ['amount' => 0, 'status' => 'none'];
        }

        $metric = $creator ? \App\Models\CreatorMetric::where('creator_id', $creator->uuid)->first() : null;
        $riskReservePercent = (float) ($metric?->reserve_percent ?? 0);

        if ($riskReservePercent > 0) {
            $reserveStatus = $riskData['reserve_status'] !== 'none' ? $riskData['reserve_status'] : 'held';
            return [
                'amount' => round($netAmount * $riskReservePercent / 100, 2),
                'status' => $reserveStatus,
            ];
        }

        // New creator: first 30 days → 10% reserve
        if ($creator && $creator->created_at) {
            $daysSinceJoined = (int) $creator->created_at->diffInDays($paymentDate);
            if ($daysSinceJoined <= 30) {
                return ['amount' => round($netAmount * 0.10, 2), 'status' => 'held'];
            }
        }

        return ['amount' => 0, 'status' => 'none'];
    }

    private function calculateVatIfMissing($amount, $currentVat, $creator)
    {
        if (($currentVat === null || $currentVat <= 0) && $creator && $creator->vat_amount_percentage > 0) {
            return round(((float) $amount * (float) $creator->vat_amount_percentage) / 100, 2, PHP_ROUND_HALF_UP);
        }
        return $currentVat ?? 0;
    }

    private function syncMemberships($userId = null)
    {
        $this->info('Syncing Memberships...');

        $query = MembershipPayment::with(['membership', 'membership.user']);
        if ($userId) {
            $query->whereHas('membership', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->membership) continue;
                
                $creator = $payment->membership->user;
                if (!$creator) continue;

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_tax_amount, $creator);
                $platformFee = $payment->tax ?? 0;
                $stripeFee = $payment->stripe_fee_actual ?? 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $status,
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

        $query = TaskPurchase::with(['task:id,currency', 'creator']);
        if ($userId) {
            $query->where('creator_id', $userId);
        }

        $query->chunk(100, function ($purchases) {
            foreach ($purchases as $purchase) {
                $amount = $purchase->amount;
                $vat = $this->calculateVatIfMissing($amount, $purchase->vat_amount, $purchase->creator);
                
                $currency = strtoupper($purchase->currency ?? ($purchase->task?->currency ?? 'GBP'));
                $adminFee = (float) \App\Helpers::administrationFeeInCurrency($currency);
                $platformFee = (float) ($purchase->platform_fee ?? 0) + $adminFee;
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($purchase->stripe_session_id, 'completed', $purchase->payment_intent_id);
                $status = $riskData['status'];
                if ($status === 'pending' && in_array($purchase->status, ['paid', 'completed'])) {
                    $status = 'completed';
                }
                $taskCreator = $purchase->creator;
                $reserve = $this->determineReserve($creatorAmount, $riskData, $taskCreator, $purchase->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => $currency,
                        'status' => $status,
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

        $query = BillPayment::with(['bill', 'bill.user']);
        if ($userId) {
            $query->whereHas('bill', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->bill) continue;

                $creator = $payment->bill->user;
                if (!$creator) continue;

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_tax_amount, $creator);
                $platformFee = $payment->tax ?? 0;
                $stripeFee = $payment->stripe_fee_actual ?? 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $status,
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

        $query = StripePaymentItems::with(['payment', 'wish', 'payment.owner']);
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

                $creator = $item->payment->owner;
                $creatorId = $creator?->id;
                if (!$creatorId && $item->wish) {
                    $creatorId = $item->wish->user_id;
                    $creator = User::find($creatorId);
                }
                
                if (!$creatorId) continue;

                $amount = $item->amount;
                $vat = $this->calculateVatIfMissing($amount, $item->vat_amount, $creator);
                $platformFee = $item->tax ?? 0;
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($item->payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $item->payment->payment_status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $item->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($item->payment->currency ?? 'GBP'),
                        'status' => $status,
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

        $query = ShopPayment::with(['shop', 'shop.user']);
        if ($userId) {
            $query->whereHas('shop', function ($q) use ($userId) {
                $q->where('user_id', $userId);
            });
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!$payment->shop) continue;

                $creator = $payment->shop->user;
                if (!$creator) continue;

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $shippingAmount = $payment->shipping_amount ?? 0;
                $vat = $this->calculateVatIfMissing($amount + $shippingAmount, $payment->vat_tax_amount, $creator);
                $platformFee = $payment->tax_amount ?? 0;
                $stripeFee = 0;
                $gross = $amount + $shippingAmount + $vat + $platformFee + $stripeFee;
                $creatorAmount = $amount + $shippingAmount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->payment_status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $status,
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

        $query = TipGoalsPayment::with('creator');
        if ($userId) {
            $query->where('creator_id', $userId);
        }

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                $creator = $payment->creator;
                $creatorId = $payment->creator_id;
                if (!$creatorId) continue;

                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_amount, $creator);
                $platformFee = $payment->tax ?? 0;
                $gross = $payment->total_paid && $payment->total_paid > 0
                    ? (float) $payment->total_paid
                    : ((float) $amount + (float) $vat + (float) $platformFee);
                $stripeFee = max(0, $gross - $platformFee - $amount - $vat);
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at);

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
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $status,
                        'description' => 'Tip / Support',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }
}
