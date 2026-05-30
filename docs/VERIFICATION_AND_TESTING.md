# Audit Logging - Verification & Testing

## Pre-Deployment Checks

### ✅ Check 1: Migration Status
```bash
php artisan migrate:status
```

Look for: `2026_05_30_000000_extend_audit_logs_table` should show as **Run**

### ✅ Check 2: Database Schema
```sql
-- Verify all new columns exist
DESC audit_logs;
```

Should include: `entity_type`, `entity_id`, `case_id`, `correlation_id`, `reason_code`, `old_values`, `new_values`, `evidence_refs`, `payment_refs`

### ✅ Check 3: Indexes Created
```sql
-- Verify indexes exist
SHOW INDEXES FROM audit_logs;
```

Look for indexes on: `entity_type`, `entity_id`, `case_id`, `correlation_id`, and composite `actor_action_created`

---

## Post-Deployment Testing

### Test 1: Create a Payment and Verify Logging

**Setup:**
```bash
# Open database viewer or MySQL client
mysql -u root -p live_sp_db
```

**Create a test payment:**
```php
$payment = \App\Models\Payment::create([
    'creator_id' => 'creator-uuid',
    'amount' => 5000,
    'currency' => 'USD',
    'status' => 'pending',
    'stripe_session_id' => 'cs_test_' . uniqid(),
    'stripe_payment_intent_id' => 'pi_test_' . uniqid(),
]);
```

**Verify logging:**
```sql
SELECT * FROM audit_logs 
WHERE reference_id = 'YOUR-PAYMENT-ID'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Output:**
```
id: [UUID]
actor: user:123 (or system)
action_type: PAYMENT_CREATED
reference_id: [payment-id]
entity_type: Payment
entity_id: [payment-id]
metadata_json: {"activity_type":"payment","amount":5000,"currency":"USD"...}
payment_refs: {"payment_id":"...","stripe_session_id":"cs_test_..."}
created_at: 2026-05-30 12:34:56
```

✅ **All fields should be populated, NO NULL values**

---

### Test 2: Update Payment Status and Verify State Change Logging

**Update the payment:**
```php
$payment->update(['status' => 'succeeded']);
```

**Verify state change logging:**
```sql
SELECT * FROM audit_logs 
WHERE reference_id = 'YOUR-PAYMENT-ID'
AND action_type = 'PAYMENT_STATE_CHANGED'
ORDER BY created_at DESC
LIMIT 1;
```

**Expected Output:**
```
action_type: PAYMENT_STATE_CHANGED
old_values: {"status":"pending"}
new_values: {"status":"succeeded"}
metadata_json: {"transition_reason":"...","old_status":"pending","new_status":"succeeded"}
```

✅ **old_values and new_values should be populated**

---

### Test 3: Test Payment Refund Logging

**Log a refund:**
```php
\App\Services\ActivityLogger::logPaymentRefund(
    $payment,
    50.00,
    'Customer requested refund',
    ['refund_id' => 'ref_test_123']
);
```

**Verify:**
```sql
SELECT * FROM audit_logs 
WHERE reference_id = 'YOUR-PAYMENT-ID'
AND action_type = 'PAYMENT_REFUNDED'
LIMIT 1;
```

**Expected:**
```
action_type: PAYMENT_REFUNDED
metadata_json: {...,"refund_amount":50.00,"refund_reason":"Customer requested..."}
```

✅ **Refund details captured**

---

### Test 4: Test User Activity Timeline

**Code:**
```php
$userId = 'user-uuid';
$timeline = \App\Services\ActivityLogger::getUserTimeline($userId, 10);

foreach ($timeline as $log) {
    echo "Type: " . $log->action_type . "\n";
    echo "Entity: " . $log->entity_type . "\n";
    echo "Amount: " . $log->getMetadata('amount') . "\n";
    echo "Time: " . $log->created_at . "\n";
    echo "---\n";
}
```

**Expected Output:**
```
Type: PAYMENT_CREATED
Entity: Payment
Amount: 5000
Time: 2026-05-30 14:30:12
---
Type: PAYMENT_STATE_CHANGED
Entity: Payment
Amount: 5000
Time: 2026-05-30 14:31:05
---
```

✅ **Timeline shows all user activities in order**

---

### Test 5: Query Payment History by Entity

**Code:**
```php
$paymentLogs = \App\Models\AuditLog::where('entity_type', 'Payment')
    ->where('entity_id', 'payment-uuid')
    ->orderBy('created_at', 'desc')
    ->get();

echo count($paymentLogs) . " log entries found\n";
$paymentLogs->each(function($log) {
    echo $log->action_type . " - " . $log->created_at . "\n";
});
```

**Expected Output:**
```
3 log entries found
PAYMENT_REFUNDED - 2026-05-30 14:35:00
PAYMENT_STATE_CHANGED - 2026-05-30 14:31:05
PAYMENT_CREATED - 2026-05-30 14:30:12
```

✅ **All payment history captured**

---

### Test 6: Verify Payment Details Structure

**Code:**
```php
$payment = \App\Models\Payment::find('payment-uuid');
$details = $payment->getPurchaseDetails();

echo "Activity Type: " . $details['activity_type'] . "\n";
echo "Amount: " . $details['amount'] . "\n";
echo "Creator: " . $details['creator_name'] . "\n";
echo "Status: " . $details['status'] . "\n";
echo "Timestamp: " . $details['paid_at'] . "\n";
echo "Stripe Session: " . ($details['stripe_session_id'] ?? 'N/A') . "\n";
```

**Expected Output:**
```
Activity Type: piggy_pot_contribution
Amount: 5000
Creator: John Doe
Status: succeeded
Timestamp: 2026-05-30T14:30:12Z
Stripe Session: cs_test_xxxxx
```

✅ **All details properly structured**

---

### Test 7: Verify Observer Auto-Logging

**Create a model (not payment):**
```php
$wish = \App\Models\WishItem::create([
    'user_id' => 'user-uuid',
    'wishname' => 'Test Wish',
    'price' => 2999,
    'currency' => 'USD',
]);
```

**Check log was created:**
```sql
SELECT * FROM audit_logs 
WHERE action_type = 'WISHITEM_CREATED'
AND reference_id = '[wish-id]'
LIMIT 1;
```

**Expected:**
```
action_type: WISHITEM_CREATED
entity_type: WishItem
metadata_json: {"activity_type":"wish_created","title":"Test Wish",...}
```

✅ **Observer logging works for all models**

---

### Test 8: Test Request Context Capture

**Make a request and check logged context:**
```php
// After a real HTTP request that logs activity
$log = \App\Models\AuditLog::latest()->first();
$metadata = $log->metadata_json;

echo "IP: " . ($metadata['ip_address'] ?? 'missing') . "\n";
echo "URL: " . ($metadata['url'] ?? 'missing') . "\n";
echo "Method: " . ($metadata['method'] ?? 'missing') . "\n";
echo "User Agent: " . ($metadata['user_agent'] ?? 'missing') . "\n";
echo "Timestamp: " . ($metadata['timestamp'] ?? 'missing') . "\n";
```

**Expected:**
```
IP: 127.0.0.1
URL: http://localhost/checkout
Method: POST
User Agent: Mozilla/5.0...
Timestamp: 2026-05-30T14:30:12Z
```

✅ **Context automatically captured**

---

## Checklist Before Going Live

- [ ] Migration applied: `php artisan migrate`
- [ ] Database schema verified: All new columns exist
- [ ] Indexes verified: Performance indexes created
- [ ] Test 1 passed: Payment creation logs all fields
- [ ] Test 2 passed: State changes tracked
- [ ] Test 3 passed: Refunds logged
- [ ] Test 4 passed: User timeline works
- [ ] Test 5 passed: Payment history queryable
- [ ] Test 6 passed: Payment details complete
- [ ] Test 7 passed: Observer auto-logging works
- [ ] Test 8 passed: Context captured
- [ ] No errors in `storage/logs/`
- [ ] Real payment test successful

---

## Debugging

### If Migration Fails
```bash
php artisan migrate:rollback
php artisan migrate --step=1
```

### If NULL Values Still Appear
1. Verify migration ran: `php artisan migrate:status`
2. Clear cache: `php artisan cache:clear`
3. Check table structure: `DESC audit_logs;`
4. If columns missing, run: `php artisan migrate --force`

### If Logging Not Working
1. Check Laravel logs: `tail -f storage/logs/laravel.log`
2. Verify observer registered in `AppServiceProvider`
3. Check if model has ID before logging
4. Verify ActivityLogger service can be instantiated

### If Performance Issues
1. Add indexes: Already done in migration
2. Use `logBatch()` for bulk operations
3. Archive old logs: `ActivityLogger::cleanOldLogs(90)`
4. Monitor query performance: `php artisan tinker` → Check explain plans

---

## Rollback Plan

If needed to revert all changes:

```bash
php artisan migrate:rollback
```

This will:
- Remove all new fields from audit_logs
- Drop new indexes
- Keep existing data intact

Previous audit logs will still work, just without the new fields.

---

## Production Deployment Steps

1. **Backup database**
   ```bash
   mysqldump -u root -p live_sp_db > backup_2026_05_30.sql
   ```

2. **Deploy code changes**
   ```bash
   git pull origin main
   composer install
   npm install
   npm run build
   ```

3. **Run migrations**
   ```bash
   php artisan migrate
   ```

4. **Verify deployment**
   ```bash
   php artisan logs:tail
   ```

5. **Test payment flow**
   - Create test payment
   - Verify audit log
   - Check all fields populated

6. **Monitor**
   - Watch error logs for 1 hour
   - Test real payments
   - Verify user timeline displays correctly

---

## Success Criteria

✅ All audit log fields populated (no NULL values)
✅ Payment creation logged with full details
✅ Payment updates tracked with old/new values
✅ Webhooks log state changes
✅ User can see complete activity history
✅ Performance acceptable (indexes working)
✅ No errors in application logs

🎉 **System ready for production use!**
