# Payment / Dispute / Refund — Bugs & Fixes

**Date:** 2026-04-30\
**Reviewed by:** Claude Code audit

***

## Bug #1 — `financial_transactions` Real-Time Update Missing

### Problem

`syncRiskLedgerStatus()` updates the `payments` table immediately but triggers `financial_transactions` sync via `Artisan::queue()`. This means:

- If the queue worker is not running, `financial_transactions` never updates.
- Even if the queue is running, there is a delay — the table shows stale status.

### Root Cause

`StripeWebhookController::syncRiskLedgerStatus()` (line \~3264)

### Fix Applied

Added a new private method `syncFinancialTransactionsByPaymentIntent()` that directly updates `financial_transactions` rows in real-time by looking up source models (TaskPurchase, TipGoalsPayment, ShopPayment, StripePaymentDetail, MembershipPayment, BillPayment) via `payment_intent_id` and updating the `status` field immediately.

The async artisan queue is kept as a fallback for full reconciliation.

**File:** `app/Http/Controllers/StripeWebhookController.php`

***

## Bug #2 — `creator_id` UUID Passed as Integer `user_id` to Artisan Queue

### Problem

`syncRiskLedgerStatus()` was calling:

```php
Artisan::queue('finance:sync-transactions', ['--user_id' => $payment->creator_id]);
```

`$payment->creator_id` is a **UUID string**, but `finance:sync-transactions --user_id` expects an **integer** user ID. This meant the sync command silently did nothing for any creator.

### Fix Applied

Now resolves the integer `user_id` first:

```php
$creator = User::where('uuid', $payment->creator_id)->first();
$intUserId = $creator ? $creator->id : null;
Artisan::queue('finance:sync-transactions', ['--user_id' => $intUserId]);
```

**File:** `app/Http/Controllers/StripeWebhookController.php`

***

## Bug #3 — Duplicate / Dead Switch Cases for Dispute Events

### Problem

The `handle()` switch statement had **duplicate cases** that are dead code (PHP switch stops at the first match):

```php
// First occurrence (line ~220) — RUNS
case 'charge.dispute.created':
    $this->handleChargeDisputeCreated($data);
    break;

// Second occurrence (line ~285) — NEVER REACHED
case 'charge.dispute.created':
    $this->handleDisputeCreated($data);   // ← different method, never called
    break;

case 'charge.dispute.funds_reinstated':  // ← never reached
    $this->handleDisputeWon($data);
    break;

case 'charge.dispute.funds_withdrawn':   // ← never reached
    $this->handleDisputeLost($data);
    break;
```

`handleDisputeCreated`, `handleDisputeWon`, and `handleDisputeLost` were all silently skipped.

### Fix Applied

Removed the three duplicate dead cases from the switch statement. The `charge.dispute.funds_reinstated` and `charge.dispute.funds_withdrawn` events are already handled inside `handleChargeDisputeUpdated()` (via the `charge.dispute.updated` case).

**File:** `app/Http/Controllers/StripeWebhookController.php`

***

## Bug #4 — `handleDisputeLost` Kept Status as `disputed` Instead of `refunded`

### Problem

When Stripe fires `charge.dispute.funds_withdrawn` (i.e. dispute lost), `handleDisputeLost()` was calling:

```php
$this->syncRiskLedgerStatus($paymentIntentId, 'disputed');
```

But a lost dispute means funds are permanently withdrawn — equivalent to a refund. Keeping status as `disputed` means the payment stays in the payout queue indefinitely.

### Fix Applied

Changed to:

```php
$this->syncRiskLedgerStatus($paymentIntentId, 'refunded');
```

This is consistent with `handleChargeDisputeClosed()` which already marks lost disputes as `'refunded'` in the `payments` table.

**File:** `app/Http/Controllers/StripeWebhookController.php`

***

## Bug #5 — Referral Payout Has No `financial_transactions` Record

### Problem

When a creator requests a referral payout via `/refer-and-earn/redeem`, a `CreatorReferralPayout` record is created but **no corresponding** **`FinancialTransaction`** **entry** is written. This means:

- Admin cannot see referral payouts in the financial ledger.
- Creator's earnings history is incomplete.

### Fix Applied

After creating/updating the `CreatorReferralPayout` record, now also writes a `FinancialTransaction`:

```php
FinancialTransaction::updateOrCreate(
    ['source_type' => CreatorReferralPayout::class, 'source_id' => $payout->id],
    [
        'user_id'          => $creator->id,
        'type'             => 'referral_payout',
        'gross_amount'     => $amount,
        'net_amount'       => $amount,
        'status'           => 'pending',
        'description'      => "Referral payout request for {$n} referral(s)",
        'transaction_date' => now(),
        ...
    ]
);
```

**File:** `app/Http/Controllers/ReferAndEarnController.php`

***

## Summary Table

| # | Bug                                                                   | Severity | File                        | Status  |
| - | --------------------------------------------------------------------- | -------- | --------------------------- | ------- |
| 1 | `financial_transactions` not updated in real-time on dispute/refund   | High     | StripeWebhookController.php | ✅ Fixed |
| 2 | UUID passed as integer user\_id to artisan sync — sync silently fails | High     | StripeWebhookController.php | ✅ Fixed |
| 3 | Duplicate switch cases — `handleDisputeCreated/Won/Lost` never called | Medium   | StripeWebhookController.php | ✅ Fixed |
| 4 | Dispute lost → status stays `disputed` instead of `refunded`          | Medium   | StripeWebhookController.php | ✅ Fixed |
| 5 | Referral payout missing from `financial_transactions`                 | Medium   | ReferAndEarnController.php  | ✅ Fixed |

***

## Known Remaining Issues (Not Yet Fixed)

| Issue                                                   | Impact                                   | Recommendation                                                  |
| ------------------------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Reserve tracking stored as JSON in `payout_runs.totals` | Hard to query/report reserves            | Migrate to a separate `payout_reserves` table                   |
| Negative balance has no separate audit log              | No trail for debt recovery               | Add a `balance_adjustments` table                               |
| Admin referral payout approval flow missing             | `stripe_payout_id` / `paid_at` never set | Build admin approve/reject endpoint for `CreatorReferralPayout` |
| No minimum threshold notification to creator            | Creator doesn't know payout was skipped  | Send notification when below threshold                          |

