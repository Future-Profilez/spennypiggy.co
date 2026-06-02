# Audit Logging - Quick Start

## What Was Fixed

Your audit_logs table had NULL values in important fields. Now **every payment action is fully logged** with all details.

## Files Changed

| File | Change | Impact |
|------|--------|--------|
| `app/Models/AuditLog.php` | Added fillable fields | Now stores all 13 fields |
| `app/Services/ActivityLogger.php` | Enhanced with payment methods | Better payment tracking |
| `app/Models/Payment.php` | Improved `getPurchaseDetails()` | Richer payment data |
| `app/Observers/ActivityObserver.php` | Payment-specific logging | Captures every change |
| `app/Http/Controllers/StripeWebhookController.php` | Added webhook logging | Tracks payment processing |
| `database/migrations/2026_05_30_...` | New migration | Adds missing fields to DB |

## Run This

```bash
php artisan migrate
```

## What Gets Logged Now

### When Payment Created
```
✓ Amount, Currency, Status
✓ Gifter Name & ID
✓ Creator Name & ID
✓ Item Details
✓ Stripe IDs
✓ IP Address & User Agent
✓ Exact Timestamp
```

### When Payment Status Changes
```
✓ Old Status → New Status
✓ Reason (e.g., "Webhook: checkout.session.completed")
✓ All Payment References
```

### When Payment Fails/Refunded
```
✓ Error/Refund Code
✓ Error/Refund Message
✓ Amount & Currency
✓ Timestamp
```

## Check It Works

```sql
SELECT * FROM `audit_logs` 
WHERE action_type = 'PAYMENT_CREATED' 
LIMIT 5;
```

Should show **no NULL values** in these columns now:
- `entity_type` → "Payment"
- `entity_id` → Payment UUID
- `payment_refs` → JSON with stripe IDs
- `metadata_json` → Full payment details
- `created_at` → Exact timestamp

## Use It in Code

```php
// Log payment creation
ActivityLogger::logPayment($payment, 'PAYMENT_CREATED', [
    'payment_type' => 'piggy_pot_contribution',
]);

// Log payment status change
ActivityLogger::logPaymentStateChange(
    $payment,
    ['status' => 'pending'],
    ['status' => 'succeeded'],
    'Webhook processed'
);

// Log refund
ActivityLogger::logPaymentRefund($payment, 50.00, 'Customer requested');

// Log error
ActivityLogger::logPaymentError($payment, 'INSUFFICIENT_FUNDS', 'Card declined');

// Get user's activity
$timeline = ActivityLogger::getUserTimeline($userId);
```

## Database Fields Now Populated

```
✓ id          - UUID
✓ actor       - "user:123" or "system"
✓ action_type - "PAYMENT_CREATED"
✓ reference_id - Payment UUID
✓ entity_type - "Payment"
✓ entity_id   - Payment UUID
✓ case_id     - Support case ref (optional)
✓ correlation_id - Groups related logs (optional)
✓ reason_code - "SUCCESS" or "REFUND"
✓ metadata_json - Full context
✓ old_values  - Previous values (updates)
✓ new_values  - New values (updates)
✓ evidence_refs - References array
✓ payment_refs - Stripe/payment IDs
✓ created_at  - Timestamp
```

## Frontend Display Tip

Get all user activities:
```php
$logs = \App\Models\AuditLog::where('actor', "user:{$userId}")
    ->where('entity_type', 'Payment')
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($logs as $log) {
    echo $log->action_type; // PAYMENT_CREATED
    echo $log->getMetadata('amount'); // 5000
    echo $log->getMetadata('creator_name'); // John Doe
    echo $log->created_at; // 2026-05-30 12:34:56
}
```

## What Users See

Activity entry with **full details** showing:
- 💰 What they paid for
- 💵 Amount and currency
- ✓ Status (succeeded/failed/pending)
- 👤 Who they paid (creator)
- 📅 Exact date and time
- 🔐 Payment method and references

Instead of blank/NULL fields, users now see **complete information** about each transaction.

## Next: Activity Dashboard

Create a React component to display:
```jsx
<ActivityDashboard 
    activities={logs}
    showPaymentDetails={true}
/>
```

See `docs/AUDIT_LOGGING_GUIDE.md` for full examples.

---

✅ **Implementation Complete** - All payment data is now properly logged!
