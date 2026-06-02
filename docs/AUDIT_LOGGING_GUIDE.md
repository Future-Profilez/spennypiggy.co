# Audit Logging System - Complete Implementation Guide

## Overview

The Spenny Piggy audit logging system has been completely restructured to provide comprehensive tracking of all payment and activity data. Every step of the payment process now creates detailed audit log entries that users can view to understand what happened on their account.

## Database Schema

### Audit Logs Table Structure

The `audit_logs` table now includes the following fields:

```sql
- id (UUID, Primary Key)
- actor (string) - Who performed the action (user:ID, admin:ID, system)
- action_type (string) - Type of action (PAYMENT_CREATED, PAYMENT_UPDATED, etc.)
- reference_id (UUID) - Primary resource ID being acted upon
- entity_type (string) - Type of entity (Payment, User, Order, etc.)
- entity_id (UUID) - ID of the specific entity
- case_id (string) - Support case reference
- correlation_id (string) - Correlates related actions together
- reason_code (string) - Specific reason code (STATE_CHANGE, REFUND, etc.)
- metadata_json (JSON) - Flexible metadata object with context
- old_values (JSON) - Previous field values (for updates)
- new_values (JSON) - New field values (for updates)
- evidence_refs (JSON) - References to evidence/documents
- payment_refs (JSON) - Payment-related references
- created_at (timestamp) - When the log was created
```

## Usage Guide

### Basic Activity Logging

```php
use App\Services\ActivityLogger;

// Simple activity log
ActivityLogger::log('USER_CREATED', $user->id, [
    'username' => $user->username,
    'email' => $user->email,
]);

// System action
ActivityLogger::logSystem('CRON_JOB_EXECUTED', null, [
    'job_name' => 'daily_payout',
]);

// Admin action
ActivityLogger::logAdmin($adminId, 'USER_SUSPENDED', $user->id, [
    'reason' => 'Violates terms of service',
]);
```

### Payment-Specific Logging

#### Log Payment Creation

```php
use App\Services\ActivityLogger;

ActivityLogger::logPayment($payment, 'PAYMENT_CREATED', [
    'payment_type' => 'piggy_pot_contribution',
    'reason_code' => 'SUCCESS',
    'additional_metadata' => [
        'gateway' => 'stripe',
        'ip_address' => request()->ip(),
    ]
]);
```

#### Log Payment State Changes

```php
ActivityLogger::logPaymentStateChange(
    $payment,
    ['status' => 'pending'],
    ['status' => 'succeeded'],
    'Webhook: checkout.session.completed'
);
```

#### Log Payment Refunds

```php
ActivityLogger::logPaymentRefund(
    $payment,
    100.00,
    'Customer requested refund',
    ['refund_id' => 'ref_123456']
);
```

#### Log Payment Errors

```php
ActivityLogger::logPaymentError(
    $payment,
    'INSUFFICIENT_FUNDS',
    'Card declined due to insufficient funds',
    ['decline_code' => 'insufficient_funds']
);
```

### Advanced Logging with All Fields

```php
ActivityLogger::log(
    actionType: 'PAYMENT_PROCESSED',
    referenceId: $payment->id,
    additionalMetadata: [
        'amount' => $payment->amount,
        'currency' => $payment->currency,
        'gateway' => 'stripe',
    ],
    actorOverride: null, // Uses current authenticated user
    options: [
        'entity_type' => 'Payment',
        'entity_id' => $payment->id,
        'case_id' => 'CASE-2026-001234',
        'correlation_id' => 'corr_xyz789',
        'reason_code' => 'SUCCESS',
        'old_values' => ['status' => 'pending'],
        'new_values' => ['status' => 'succeeded'],
        'evidence_refs' => ['stripe_receipt_123'],
        'payment_refs' => [
            'payment_id' => $payment->id,
            'stripe_payment_intent_id' => 'pi_123',
            'creator_id' => $creator->id,
        ],
    ]
);
```

## Payment Logging Lifecycle

### 1. Payment Creation
When a payment is created, the observer automatically logs:
- Payment ID
- Amount and currency
- Gifter and creator information
- Payment type (deliverable, piggy pot, task, etc.)
- All purchase details

### 2. Payment Processing (Webhook)
When the webhook processes the payment:
- Old status → New status transition
- Webhook event type
- Timestamp of processing
- Any risk decisions applied

### 3. Payment Completion
Once payment is confirmed:
- Final status
- All metadata from purchase details
- Financials (reserve amounts, holds, etc.)

### 4. Payment Updates
Any updates to the payment log:
- Changed fields
- Before/after values
- Reason for change

### 5. Payment Refunds/Errors
Special logging for:
- Refund amounts and reasons
- Error codes and messages
- Related references

## Activity Observer Integration

The `ActivityObserver` automatically logs model events:

```php
// Automatically triggered on model creation
Model:create() → ActivityLogger::log('MODEL_CREATED', ...)

// Automatically triggered on model update
Model:update() → ActivityLogger::logPaymentStateChange() (for Payment)

// Automatically triggered on model deletion
Model:delete() → ActivityLogger::log('MODEL_DELETED', ...)
```

## Query Examples

### Get User's Payment Activity

```php
use App\Services\ActivityLogger;

$timeline = ActivityLogger::getUserTimeline($userId, limit: 100);

foreach ($timeline as $log) {
    echo $log->action_type; // PAYMENT_CREATED, PAYMENT_UPDATED, etc.
    echo $log->created_at; // When the action happened
    print_r($log->payment_refs); // Payment references
}
```

### Get Payment History

```php
$paymentLogs = \App\Models\AuditLog::where('entity_type', 'Payment')
    ->where('entity_id', $payment->id)
    ->orderBy('created_at', 'desc')
    ->get();
```

### Search by Action Type

```php
$refunds = ActivityLogger::getByActionType('PAYMENT_REFUNDED', limit: 50);
```

### Get Entity History

```php
$paymentHistory = ActivityLogger::getEntityHistory($payment->id, limit: 50);
```

## Payment Details Structure

The `getPurchaseDetails()` method returns a standardized structure:

```php
[
    'activity_type' => 'piggy_pot_contribution', // deliverable, task, etc.
    'item_id' => $item->id,
    'item_name' => 'Emergency Fund',
    'creator_id' => $creator->id,
    'creator_name' => 'John Creator',
    'gifter_id' => $gifter->id,
    'gifter_name' => 'Jane Gifter',
    'amount' => 5000, // in cents
    'currency' => 'USD',
    'status' => 'succeeded',
    'paid_at' => '2026-05-30T12:34:56Z',
    'payment_method' => 'stripe',
    'stripe_session_id' => 'cs_...',
    'stripe_payment_intent_id' => 'pi_...',
    'reserve_amount' => 500,
    'platform_holds_funds' => false,
    'contribution_id' => (for piggy pot),
]
```

## Frontend Display

Users can view their activity logs in the Activity Dashboard showing:

1. **Activity Type** - What they did (contributed to piggy pot, purchased deliverable, etc.)
2. **Amount** - How much was involved
3. **Creator/Item** - What or whom the activity involved
4. **Status** - Success, pending, failed, etc.
5. **Timestamp** - Exact date and time
6. **Details** - Expandable details showing full metadata

Example activity entry:
```
🐷 Contributed to "Emergency Fund" 
   Amount: $50.00 USD
   Status: ✓ Succeeded
   Created by: Sarah Creator
   Date: May 30, 2026 at 12:34 PM
   
   More details: [View]
   - Stripe Session: cs_test_123...
   - Payment Intent: pi_test_456...
   - Reserve: $5.00 (10%)
```

## Maintenance

### Archive Old Logs

```php
// Delete logs older than 90 days
ActivityLogger::cleanOldLogs(daysToKeep: 90);
```

### Batch Logging

For bulk operations:

```php
ActivityLogger::logBatch([
    [
        'action_type' => 'USER_IMPORTED',
        'reference_id' => $user1->id,
        'metadata' => ['source' => 'csv'],
    ],
    [
        'action_type' => 'USER_IMPORTED',
        'reference_id' => $user2->id,
        'metadata' => ['source' => 'csv'],
    ],
]);
```

## Security Considerations

1. **Sensitive Data**: Passwords, tokens, and API keys are NEVER logged
2. **Access Control**: Only log data the user should see
3. **Anonymization**: Use hashed IDs for sensitive references
4. **Retention**: Old logs are automatically archived based on policy
5. **Audit Trail**: All changes to important data are tracked

## Migration Notes

The migration `2026_05_30_000000_extend_audit_logs_table.php` adds all new fields to the audit_logs table. Run:

```bash
php artisan migrate
```

## Troubleshooting

### Logs Not Appearing

1. Check if the observer is registered in `AppServiceProvider`
2. Verify the model has an `id` field before logging
3. Check Laravel logs for exceptions
4. Ensure migrations have run successfully

### Missing Fields

If `old_values`, `new_values`, etc. appear as NULL:

1. Verify the migration has run
2. Use the new `options` parameter in `ActivityLogger::log()`
3. Explicitly pass data to specialized logging methods

### Performance Issues

1. Use `logBatch()` for bulk operations
2. Add database indexes (done automatically by migration)
3. Archive old logs periodically
4. Use correlation_id to group related logs

## API Reference

### ActivityLogger Methods

- `log()` - Main logging method with all options
- `logPayment()` - Log payment-specific activity
- `logPaymentStateChange()` - Log payment status changes
- `logPaymentRefund()` - Log payment refunds
- `logPaymentError()` - Log payment errors
- `logSystem()` - Log system-level actions
- `logAdmin()` - Log admin actions
- `logBatch()` - Batch multiple logs
- `logDiff()` - Log changes with diff
- `hasPerformedAction()` - Check if action was performed
- `getEntityHistory()` - Get all logs for an entity
- `getByActionType()` - Filter by action type
- `getUserTimeline()` - Get user's activity timeline
- `cleanOldLogs()` - Archive old logs

### AuditLog Model

Access raw audit log entries:

```php
$log = \App\Models\AuditLog::find($id);
$log->actor; // "user:123"
$log->action_type; // "PAYMENT_CREATED"
$log->getActorType(); // "user"
$log->getActorId(); // "123"
$log->isUserAction(); // true/false
$log->getMetadata('key'); // Get specific metadata
```
