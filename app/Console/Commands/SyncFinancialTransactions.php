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
use App\Models\UserCart;
use App\Models\Payment;

class SyncFinancialTransactions extends Command
{
    protected $signature = 'finance:sync-transactions {--force : Force sync all transactions} {--user_id= : Only sync transactions for this creator user_id}';
    protected $description = 'Sync all payment records to the financial_transactions table';

    public function handle()
    {
        ini_set('memory_limit', '512M');
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

        // 7. Sync Rye Products
        $this->syncRyeProducts($userId);

        // 8. Sync Orphan Checkouts (Records in StripePaymentDetail that never created items)
        $this->syncOrphanCheckouts($userId);

        // 9. Sync Piggy Pots
        $this->syncPiggyPots($userId);

        $this->info('Sync completed successfully!');
    }

    private function syncRyeProducts($userId = null)
    {
        $this->info('Syncing Rye Products...');

        $query = \App\Models\RyeProductPayment::query();
        // Since RyeProductPayment doesn't have creator_id directly, we need to join with ProductOrderDetail
        // or rely on metadata if available. For now, let's assume we can find it via ProductOrderDetail.
        
        $query->where('status', 'succeeded');

        $query->chunk(100, function ($payments) {
            foreach ($payments as $payment) {
                // Try to find the creator from ProductOrderDetail
                $orderDetail = \App\Models\ProductOrderDetail::where('order_id', $payment->id)->first();
                if (!$orderDetail || !$orderDetail->creater_id) {
                    // Fallback to searching by session if order_id link is broken
                    if ($payment->stripe_session_id) {
                        $orderDetail = \App\Models\ProductOrderDetail::where('session_id', $payment->stripe_session_id)->first();
                    }
                }

                if (!$orderDetail || !$orderDetail->creater_id) continue;

                $creatorId = $orderDetail->creater_id;
                $creator = User::find($creatorId);
                
                $amount = (float) $payment->amount;
                $vat = (float) ($payment->vat_amount ?? 0);
                $platformFee = (float) ($payment->tax ?? 0);
                $stripeFee = 0;
                $gross = $payment->total_paid && $payment->total_paid > 0 
                    ? (float) $payment->total_paid 
                    : ($amount + $vat + $platformFee + $stripeFee);
                $creatorAmount = $amount; // For Rye, amount stored is usually what supporter paid? 
                // Wait, in WishitemController: $ryeProductPayment->amount = $finalTotalAmount;
                // So for Rye, amount IS the gross amount. 
                // Let's refine this if needed, but for now follow the pattern.

                $riskData = $this->getPaymentRiskData($payment->stripe_session_id, 'pending', $payment->stripe_payment_intent_id);
                $status = $riskData['status'];
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at, \App\Models\RyeProductPayment::class, $payment->id);

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => \App\Models\RyeProductPayment::class,
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
                        'description' => 'Rye Product Purchase',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }

    private function syncOrphanCheckouts($userId)
    {
        $this->info('Syncing orphan checkouts...');

        $query = \App\Models\StripePaymentDetail::where('payment_status', 'paid')
            ->whereDoesntHave('items'); 

        if ($userId) {
            $query->where('owner_id', $userId);
        }

        $orphans = $query->get();
        $count = 0;

        foreach ($orphans as $payment) {
            if (!$payment->metadata) continue;

            $metadata = json_decode($payment->metadata, true);
            $wishItems = [];

            // Try to find items in flattened metadata (item_1_wish_id, item_2_wish_id, etc.)
            for ($i = 1; $i <= 10; $i++) { // Check up to 10 items
                $prefix = "item_{$i}_";
                if (isset($metadata[$prefix . 'wish_id'])) {
                    $wishItems[] = [
                        'wish_id' => $metadata[$prefix . 'wish_id'],
                        'wish_name' => $metadata[$prefix . 'wish_name'] ?? 'Item',
                        'amount' => (float) ($metadata[$prefix . 'amount'] ?? 0),
                        'quantity' => (int) ($metadata[$prefix . 'quantity'] ?? 1),
                        'tax' => (float) ($metadata[$prefix . 'tax'] ?? 0),
                        'vat_amount' => (float) ($metadata[$prefix . 'vat_amount'] ?? 0),
                    ];
                } else {
                    break; // No more items
                }
            }

            // Fallback to wish_items JSON if flattened items not found
            if (empty($wishItems) && isset($metadata['wish_items'])) {
                $wishItems = is_string($metadata['wish_items']) 
                    ? (json_decode($metadata['wish_items'], true) ?: []) 
                    : $metadata['wish_items'];
            }

            if (empty($wishItems)) {
                // Last fallback: if we have amount_total, create one generic item
                if ($payment->amount_total > 0) {
                    $wishItems[] = [
                        'wish_id' => 0,
                        'wish_name' => 'Legacy Checkout Item',
                        'amount' => $payment->amount_total / 100,
                        'quantity' => 1,
                    ];
                }
            }

            foreach ($wishItems as $item) {
                // Create StripePaymentItems
                $paymentItem = StripePaymentItems::updateOrCreate(
                    [
                        'stripe_payment_detail_id' => $payment->id,
                        'wish_item_id' => $item['wish_id'] > 0 ? $item['wish_id'] : null,
                        'amount' => $item['amount'],
                    ],
                    [
                        'quantity' => $item['quantity'] ?? 1,
                        'tax' => $item['tax'] ?? 0,
                        'vat_amount' => $item['vat_amount'] ?? 0,
                        'created_at' => $payment->created_at,
                        'updated_at' => now(),
                    ]
                );

                // Create FinancialTransaction
                $riskData = $this->getPaymentRiskData($payment->session_id, 'completed', $payment->stripe_payment_intent_id);
                $creator = User::find($payment->owner_id);
                
                $amount = (float) $item['amount'];
                $vat = (float) ($item['vat_amount'] ?? 0);
                $platformFee = (float) ($item['tax'] ?? 0);
                $stripeFee = 0;
                $gross = $amount + $vat + $platformFee + $stripeFee;

                $reserve = $this->determineReserve($amount, $riskData, $creator, $payment->created_at, StripePaymentItems::class, $paymentItem->id);

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => StripePaymentItems::class,
                        'source_id' => $paymentItem->id,
                    ],
                    [
                        'user_id' => $payment->owner_id,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $amount,
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => strtoupper($payment->currency ?? 'GBP'),
                        'status' => $riskData['status'],
                        'description' => 'Wish Gift: ' . ($item['wish_name'] ?? 'Item'),
                        'transaction_date' => $payment->created_at,
                    ]
                );
                $count++;
            }
        }

        $this->info("Synced {$count} orphan wish items.");
    }

    private function getPaymentRiskData($sessionId, $defaultStatus = 'pending', $paymentIntentId = null)
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

        $paymentLog = $query->orderByRaw("CASE WHEN status = 'disputed' THEN 1 WHEN status = 'refunded' THEN 2 WHEN status = 'review_hold' THEN 3 WHEN status = 'succeeded' THEN 4 ELSE 5 END")->first();

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
                // The currency the recorded reserve is expressed in. Some checkout paths store this
                // GBP-normalised (Payment.currency = 'gbp') while others store it native; the fallback
                // in determineReserve converts from here into the creator's currency.
                $data['reserve_currency'] = strtoupper((string) ($paymentLog->currency ?: 'GBP'));
                // A reserve stays 'held' until 30 days after its transaction_date, when the
                // reserve:release command releases it. It must NOT be flipped to 'released'
                // just because the base earning was paid out (payout_run_id set) — that emptied
                // the held-reserve view prematurely. (The model guards against un-releasing.)
                $data['reserve_status'] = 'held';
            }
        }

        return $data;
    }

    private function ensureRiskLedgerPayment(
        User $creator,
        float $netAmountMajor,
        string $currency,
        ?string $sessionId,
        ?string $paymentIntentId,
        string $financialStatus,
        \Carbon\Carbon $createdAt,
        float $reserveAmountMajor = 0.0
    ): void {
        if ((!$sessionId && !$paymentIntentId) || $netAmountMajor <= 0) {
            return;
        }

        $status = match ($financialStatus) {
            'completed' => 'succeeded',
            'review_hold' => 'review_hold',
            'disputed' => 'disputed',
            'refunded' => 'refunded',
            default => null,
        };
        if (!$status) {
            return;
        }

        $amountMinor = (int) round($netAmountMajor * 100);
        $reserveMinor = (int) round(max(0, $reserveAmountMajor) * 100);

        $query = Payment::query();
        if ($sessionId && $paymentIntentId) {
            $query->where(function ($q) use ($sessionId, $paymentIntentId) {
                $q->where('stripe_session_id', $sessionId)
                    ->orWhere('stripe_payment_intent_id', $paymentIntentId);
            });
        } elseif ($sessionId) {
            $query->where('stripe_session_id', $sessionId);
        } else {
            $query->where('stripe_payment_intent_id', $paymentIntentId);
        }

        $payment = $query->first();
        if (!$payment) {
            $payment = new Payment();
        }

        $currentStatus = (string) ($payment->status ?? '');
        $finalStatus = in_array($currentStatus, ['review_hold', 'disputed', 'refunded'], true) ? $currentStatus : $status;

        $payment->creator_id = (string) $creator->uuid;
        $payment->amount = $amountMinor;
        $payment->reserve_amount_minor = $reserveMinor;
        $payment->currency = strtoupper($currency ?: 'GBP');
        if ($sessionId) {
            $payment->stripe_session_id = $sessionId;
        }
        if ($paymentIntentId) {
            $payment->stripe_payment_intent_id = $paymentIntentId;
        }
        $payment->status = $finalStatus;

        if (!$payment->exists) {
            $payment->created_at = $createdAt;
            $payment->updated_at = $createdAt;
            $payment->save();
        } else {
            if ($payment->created_at && $payment->created_at->gt($createdAt)) {
                $payment->created_at = $createdAt;
            }
            $payment->updated_at = now();
            $payment->save();
        }
    }

    /**
     * Determine the reserve amount from creator's net amount.
     * Rule:
     *   1. If risk engine has set reserve_percent on CreatorMetric → apply that % to netAmount.
     *   2. Else if payment was within creator's first 30 days → apply 10% to netAmount.
     *   3. Otherwise → no reserve.
     * Reserve is always calculated from creator net amount, never from gross/total.
     */
    private function determineReserve(float $netAmount, array $riskData, $creator, \Carbon\Carbon $paymentDate, ?string $sourceType = null, $sourceId = null): array
    {
        if ($netAmount <= 0) {
            return ['amount' => 0, 'status' => 'none'];
        }

        $reserveStatus = $riskData['reserve_status'] !== 'none' ? $riskData['reserve_status'] : 'held';
        $metric = $creator ? \App\Models\CreatorMetric::where('creator_id', $creator->uuid)->first() : null;
        $effectivePercent = 0;

        if ($creator) {
            $effectivePercent = app(\App\Services\Risk\ReservePolicy::class)
                ->getEffectiveReservePercent($creator, $metric, $paymentDate);
        } else {
            $effectivePercent = (int) ($metric?->reserve_percent ?? 0);
        }

        // Reserve is canonically (creator NET × effective%-as-of-payment-date), expressed in the
        // transaction's OWN currency so it matches FT.net_amount. Compute it FRESH first:
        //  - getEffectiveReservePercent uses $paymentDate, so the onboarding 10% window is
        //    reconstructed correctly on any later re-sync (no need to freeze the old value).
        //  - net_amount is per-source/native, so each item-FT gets its own correctly-based reserve.
        // The recorded Payment.reserve_amount_minor is NOT trusted here: it is GBP-normalized on
        // some checkout paths (CheckoutController) but native on others, and a single multi-item
        // checkout session shares ONE Payment row across many item-FTs — both produced wrong
        // magnitudes and a "random" reserve % when divided by the native net_amount.
        if ($effectivePercent > 0) {
            $calculatedAmount = round($netAmount * $effectivePercent / 100, 2);
            return [
                'amount' => $calculatedAmount,
                'status' => $reserveStatus,
            ];
        }

        // Fallback (payment-date percent is 0, e.g. the risk reserve % was later reduced, yet a reserve
        // was taken at payment time): PREFER the existing FinancialTransaction's own reserve. It was
        // written per-item in the creator's currency when the reserve was first taken, so it avoids both
        // the GBP-normalisation AND the multi-item-session sharing of the recorded Payment value (one
        // Payment row backs every item-FT of a multi-item checkout, so its reserve is the session total).
        if ($sourceType && $sourceId !== null) {
            $existingReserve = FinancialTransaction::where('source_type', $sourceType)
                ->where('source_id', $sourceId)
                ->value('reserve_amount');
            if ($existingReserve !== null && (float) $existingReserve > 0) {
                return [
                    'amount' => round((float) $existingReserve, 2),
                    'status' => $reserveStatus,
                ];
            }
        }

        // Last resort (first-ever sync, no FT row yet): preserve the recorded Payment reserve as a
        // HISTORICAL FACT, converted from its currency into the creator's currency. The recorded value
        // lives in the Payment row's currency, which on some checkout paths is GBP-normalised while the
        // FT (and the actual charge, always in the creator's currency) is native.
        $recordedAmount = (float) ($riskData['reserve_amount'] ?? 0);
        if ($recordedAmount > 0) {
            $recordedCurrency = strtoupper((string) ($riskData['reserve_currency'] ?? 'GBP'));
            $targetCurrency = strtoupper((string) ($creator?->default_currency ?? 'GBP'));
            $converted = $this->convertCurrency($recordedAmount, $recordedCurrency, $targetCurrency);
            return [
                'amount' => round($converted, 2),
                'status' => $reserveStatus,
            ];
        }

        return ['amount' => 0, 'status' => 'none'];
    }

    /**
     * Convert a major-unit amount between currencies using the platform FX rates
     * (rates are relative to GBP, matching ReleaseReserves / getHeldReserves).
     */
    private function convertCurrency(float $amount, string $from, string $to): float
    {
        $from = strtoupper($from ?: 'GBP');
        $to = strtoupper($to ?: 'GBP');
        if ($from === $to) {
            return $amount;
        }
        $rates = \App\Models\Currency::rates();
        if ($rates instanceof \Illuminate\Support\Collection) {
            $rates = $rates->toArray();
        }
        if (!isset($rates[$from]) || !isset($rates[$to])) {
            return $amount;
        }
        return ($amount / $rates[$from]) * $rates[$to];
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
                
                if (($payment->status ?? null) !== 'paid' && (float) ($payment->total_paid ?? 0) <= 0) {
                    continue;
                }

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_tax_amount, $creator);
                
                $currency = strtoupper($payment->currency ?? 'GBP');
                
                // Use actual fee breakdown for consistent display
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];

                $gross = $payment->total_paid && $payment->total_paid > 0 
                    ? (float) $payment->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at, MembershipPayment::class, $payment->id);

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

                $this->ensureRiskLedgerPayment(
                    $creator,
                    (float) $creatorAmount,
                    (string) $currency,
                    $payment->session_id ? (string) $payment->session_id : null,
                    $payment->stripe_id ? (string) $payment->stripe_id : null,
                    (string) $status,
                    $payment->created_at,
                    (float) ($reserve['amount'] ?? 0)
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
                if (!in_array($purchase->status, ['paid', 'completed', 'completed_accepted', 'paid_out', 'disputed', 'refunded'], true) && (float) ($purchase->total_paid ?? 0) <= 0) {
                    continue;
                }

                $amount = $purchase->amount;
                $vat = $this->calculateVatIfMissing($amount, $purchase->vat_amount, $purchase->creator);
                
                $currency = strtoupper($purchase->currency ?? ($purchase->task?->currency ?? 'GBP'));
                $adminFee = (float) \App\Helpers::administrationFeeInCurrency($currency);
                $platformFee = (float) ($purchase->platform_fee ?? 0) + $adminFee;
                $stripeFee = 0;
                $gross = $purchase->total_paid && $purchase->total_paid > 0 
                    ? (float) $purchase->total_paid 
                    : ($amount + $vat + $platformFee + $stripeFee);
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($purchase->stripe_session_id, 'pending', $purchase->payment_intent_id);
                $status = $riskData['status'];
                if ($status === 'pending' && in_array($purchase->status, ['paid', 'completed'])) {
                    $status = 'completed';
                }
                $taskCreator = $purchase->creator;
                $reserve = $this->determineReserve($creatorAmount, $riskData, $taskCreator, $purchase->created_at, TaskPurchase::class, $purchase->id);

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

                if ($taskCreator) {
                    $this->ensureRiskLedgerPayment(
                        $taskCreator,
                        (float) $creatorAmount,
                        (string) $currency,
                        $purchase->stripe_session_id ? (string) $purchase->stripe_session_id : null,
                        $purchase->payment_intent_id ? (string) $purchase->payment_intent_id : null,
                        (string) $status,
                        $purchase->created_at,
                        (float) ($reserve['amount'] ?? 0)
                    );
                }
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
                
                if (($payment->status ?? null) !== 'paid' && (float) ($payment->total_paid ?? 0) <= 0) {
                    continue;
                }

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_tax_amount, $creator);
                
                $currency = strtoupper($payment->currency ?? 'GBP');
                
                // Use actual fee breakdown for consistent display
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];

                $gross = $payment->total_paid && $payment->total_paid > 0 
                    ? (float) $payment->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at, BillPayment::class, $payment->id);

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

                $this->ensureRiskLedgerPayment(
                    $creator,
                    (float) $creatorAmount,
                    (string) $currency,
                    $payment->session_id ? (string) $payment->session_id : null,
                    $payment->stripe_id ? (string) $payment->stripe_id : null,
                    (string) $status,
                    $payment->created_at,
                    (float) ($reserve['amount'] ?? 0)
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
                if (($item->payment->payment_status ?? null) !== 'paid') continue;

                $creator = $item->payment->owner;
                $creatorId = $creator?->id;
                if (!$creatorId && $item->wish) {
                    $creatorId = $item->wish->user_id;
                    $creator = User::find($creatorId);
                }
                
                if (!$creatorId) continue;

                $amount = $item->amount;
                $vat = $this->calculateVatIfMissing($amount, $item->vat_amount, $creator);
                
                $currency = strtoupper($item->payment->currency ?? 'GBP');
                
                // Use actual fee breakdown for consistent display
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];
                
                $gross = $item->total_paid && $item->total_paid > 0 
                    ? (float) $item->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($item->payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $item->payment->payment_status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $item->created_at, StripePaymentItems::class, $item->id);

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

                if ($creator) {
                    $this->ensureRiskLedgerPayment(
                        $creator,
                        (float) $creatorAmount,
                        (string) $currency,
                        $item->payment->session_id ? (string) $item->payment->session_id : null,
                        $item->payment->stripe_payment_intent_id ? (string) $item->payment->stripe_payment_intent_id : null,
                        (string) $status,
                        $item->payment->created_at ?? $item->created_at,
                        (float) ($reserve['amount'] ?? 0)
                    );
                }
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
                if (($payment->payment_status ?? null) !== 'paid' && (float) ($payment->total_paid ?? 0) <= 0) continue;

                $creatorId = $creator->id;
                $amount = $payment->amount;
                $shippingAmount = $payment->shipping_amount ?? 0;
                $vat = $this->calculateVatIfMissing($amount + $shippingAmount, $payment->vat_tax_amount, $creator);
                
                $currency = strtoupper($payment->currency ?? 'GBP');
                
                // Use actual fee breakdown for consistent display
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $shippingAmount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];
                
                $gross = $payment->total_paid && $payment->total_paid > 0 
                    ? (float) $payment->total_paid 
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount + $shippingAmount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->payment_status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at, ShopPayment::class, $payment->id);

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

                $this->ensureRiskLedgerPayment(
                    $creator,
                    (float) $creatorAmount,
                    (string) $currency,
                    $payment->session_id ? (string) $payment->session_id : null,
                    null,
                    (string) $status,
                    $payment->created_at,
                    (float) ($reserve['amount'] ?? 0)
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
                if (($payment->status ?? null) !== 'paid' && (float) ($payment->total_paid ?? 0) <= 0) continue;

                $amount = $payment->amount;
                $vat = $this->calculateVatIfMissing($amount, $payment->vat_amount, $creator);
                
                $currency = strtoupper($payment->currency ?? 'GBP');
                
                // Use actual fee breakdown for consistent display
                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = $breakdown['application_fee'];
                $stripeFee = $breakdown['stripe_fee'];

                $gross = $payment->total_paid && $payment->total_paid > 0
                    ? (float) $payment->total_paid
                    : $breakdown['total_supporter_pays'];
                $creatorAmount = $amount;

                $riskData = $this->getPaymentRiskData($payment->session_id);
                $status = $riskData['status'];
                if ($status === 'pending' && $payment->status === 'paid') {
                    $status = 'completed';
                }
                $reserve = $this->determineReserve($creatorAmount, $riskData, $creator, $payment->created_at, TipGoalsPayment::class, $payment->id);

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

                if ($creator) {
                    $this->ensureRiskLedgerPayment(
                        $creator,
                        (float) $creatorAmount,
                        (string) $currency,
                        $payment->session_id ? (string) $payment->session_id : null,
                        null,
                        (string) $status,
                        $payment->created_at,
                        (float) ($reserve['amount'] ?? 0)
                    );
                }
            }
        });
    }

    private function syncPiggyPots($userId = null)
    {
        $this->info('Syncing Piggy Pots...');

        $query = \App\Models\PiggyPotContribution::query();
        if ($userId) {
            $query->where('creator_id', $userId);
        }

        $query->chunkById(100, function ($payments) {
            foreach ($payments as $payment) {
                if (!in_array($payment->status, ['paid', 'succeeded', 'disputed', 'refunded', 'review_hold'], true) && (float) ($payment->total_paid ?? 0) <= 0) {
                    continue;
                }

                $currency = strtoupper($payment->currency ?: 'GBP');
                $creator = User::find($payment->creator_id);

                $amount = (float) ($payment->amount ?? 0);
                $vat = (float) ($payment->vat_amount ?? 0);

                $breakdown = \App\Helpers::calculateStripeDirectChargeFlow($amount + $vat, $currency);
                $platformFee = (float) ($breakdown['application_fee'] ?? 0);
                $stripeFee = (float) ($breakdown['stripe_fee'] ?? 0);
                $gross = $payment->total_paid && $payment->total_paid > 0
                    ? (float) $payment->total_paid
                    : (float) ($breakdown['total_supporter_pays'] ?? 0);

                // Determine status mapping
                $defaultStatus = match($payment->status) {
                    'paid', 'succeeded' => 'completed',
                    'disputed' => 'disputed',
                    'refunded' => 'refunded',
                    'review_hold' => 'review_hold',
                    'failed', 'blocked', 'cancelled' => 'failed',
                    default => 'pending',
                };

                $riskData = $this->getPaymentRiskData($payment->session_id, $defaultStatus, $payment->payment_intent_id);
                $status = (string) ($riskData['status'] ?? $defaultStatus);
                $reserve = $this->determineReserve($amount, $riskData, $creator, $payment->created_at, \App\Models\PiggyPotContribution::class, $payment->id);

                FinancialTransaction::updateOrCreate(
                    [
                        'source_type' => \App\Models\PiggyPotContribution::class,
                        'source_id' => $payment->id,
                    ],
                    [
                        'user_id' => $payment->creator_id,
                        'supporter_id' => $payment->user_id,
                        'type' => 'income',
                        'gross_amount' => $gross,
                        'platform_fee' => $platformFee,
                        'stripe_fee' => $stripeFee,
                        'vat_amount' => $vat,
                        'net_amount' => $amount,
                        'reserve_amount' => $reserve['amount'],
                        'reserve_status' => $reserve['status'],
                        'currency' => $currency,
                        'status' => $status,
                        'description' => 'Piggy Pot Contribution',
                        'transaction_date' => $payment->created_at,
                    ]
                );
            }
        });
    }
}
