# 🚀 Stripe Service Agreement Migration Guide

## Overview

This guide covers the Stripe service agreement migration system implemented to resolve cross-border payment issues for creators in restricted countries (primarily EU countries like Italy).

## The Problem

Some creators in certain countries (especially Italy) were getting this error:
```
Stripe API Error: Funds can't be sent to accounts located in IT when the account is under the `full` service agreement.
```

## The Solution

We implemented an automatic system that:
1. **New creators** from restricted countries automatically get `recipient` service agreement
2. **Existing creators** can be migrated from `full` to `recipient` service agreement
3. **Non-restricted countries** (US, UK, etc.) continue using `full` service agreement

## Affected Countries

Countries that use `recipient` service agreement:
- **Italy (IT)** - Primary issue reported
- **Major EU countries**: France, Germany, Spain, Netherlands, Belgium, etc.
- **Nordic countries**: Sweden, Norway, Denmark, Finland
- **Eastern Europe**: Poland, Czech Republic, Hungary, etc.
- **Other EU**: All EU member states

Countries that continue using `full` service agreement:
- **United States (US)**
- **United Kingdom (GB)**
- **Canada (CA)**
- **Australia (AU)**
- **Japan (JP)**
- **UAE (AE)**
- And all other non-EU countries

## Migration Commands

### 1. Dry Run (Check Only)
```bash
# Check what would be migrated without making changes
php artisan stripe:migrate-service-agreements --dry-run

# Check specific country
php artisan stripe:migrate-service-agreements --dry-run --country=IT

# Limit results
php artisan stripe:migrate-service-agreements --dry-run --limit=10
```

### 2. Real Migration
```bash
# Migrate Italian creators only
php artisan stripe:migrate-service-agreements --country=IT

# Migrate specific user
php artisan stripe:migrate-service-agreements --user-id=123

# Migrate up to 50 accounts (default limit)
php artisan stripe:migrate-service-agreements
```

## Manual Migration (API Endpoints)

### Check if account needs migration:
```bash
GET /stripe/check-migration/{userId}
```

### Migrate specific account:
```bash
POST /stripe/migrate-account/{userId}
```

## Creator Re-onboarding Process

After migration, creators need to complete Stripe onboarding again:

### 1. What Creators See
- Email notification explaining the upgrade
- Dashboard notification about account setup needed
- Clear instructions on what to do

### 2. Re-onboarding Steps
1. Creator visits their Stripe connection page
2. Clicks "Complete Account Setup"
3. Goes through Stripe's standard onboarding flow
4. Account is activated with `recipient` service agreement

### 3. What Changes for Creators
- **Before**: `full` service agreement, cross-border payment issues
- **After**: `recipient` service agreement, cross-border payments work
- **Process**: Same Stripe interface, just re-verification needed

## Safety Measures

### 1. No Impact on Non-Restricted Countries
```php
// US, UK, CA, AU creators are unaffected
$serviceAgreement = getServiceAgreementType('US'); // Returns 'full'
$serviceAgreement = getServiceAgreementType('IT'); // Returns 'recipient'
```

### 2. Migration Only When Needed
- Only migrates `full` → `recipient` when country requires it
- Skips accounts already on `recipient`
- Validates country and current service agreement

### 3. Comprehensive Logging
```php
Log::info('Account migration completed', [
    'user_id' => $user->id,
    'old_account_id' => $oldAccountId,
    'new_account_id' => $newAccountId,
    'country' => $user->country,
    'from_agreement' => 'full',
    'to_agreement' => 'recipient'
]);
```

## Testing

Run the comprehensive test suite:
```bash
php test_migration_impact.php
```

This verifies:
- ✅ Non-restricted countries remain unaffected
- ✅ Restricted countries migrate only when needed
- ✅ Edge cases handled properly

## Monitoring Migration Success

### 1. Check Migration Stats
```bash
php artisan stripe:migrate-service-agreements --dry-run
```

### 2. Monitor Logs
```bash
tail -f storage/logs/laravel.log | grep "migration"
```

### 3. Verify Individual Accounts
```bash
curl -X GET "/stripe/check-migration/{userId}"
```

## Troubleshooting

### Common Issues

**Q: Creator says they can't receive payments after migration**
A: They need to complete Stripe re-onboarding. Check if `stripe_details_submitted = 0`.

**Q: Migration command shows 0 accounts need migration**
A: Either no accounts need it, or they're already migrated. Use `--dry-run` to see details.

**Q: Can I migrate accounts back?**
A: Service agreements can't be changed on existing accounts. You'd need to create a new account.

### Validation Checklist

Before running migration:
- [ ] Run dry-run first
- [ ] Check affected creator count
- [ ] Notify support team
- [ ] Plan creator communication
- [ ] Monitor error logs during migration

## Creator Communication

### Email Template Used
```
🚀 Your Spenny Piggy Payment Account Has Been Upgraded!

Great news! We've upgraded your payment processing account to improve 
compatibility and ensure you can receive payments from fans worldwide.

What you need to do: Complete a quick re-verification of your account 
to start receiving payments again.

[Complete Account Setup Button]
```

### Dashboard Notifications
- Red banner until re-onboarding complete
- Clear call-to-action button
- Link to help documentation

## Technical Details

### Service Agreement Differences

| Feature | Full Agreement | Recipient Agreement |
|---------|---------------|-------------------|
| Direct card payments | ✅ Yes | ❌ No |
| Cross-border transfers | ❌ Limited | ✅ Yes |
| Platform relationship | Direct with Stripe | Through platform |
| Payout timing | Standard | +24 hours |
| Customer support | Direct Stripe | Through platform |

### Migration Process
1. Check if migration needed
2. Create new Stripe account with `recipient` agreement
3. Update user record with new account ID
4. Set `stripe_details_submitted = 0`
5. Send notification to creator
6. Creator completes onboarding

## Best Practices

### For Developers
- Always run dry-run first
- Monitor logs during migration
- Test with small batches
- Have rollback plan ready

### For Support Team
- Explain upgrade benefits to creators
- Guide through re-onboarding process
- Monitor for payment issues post-migration
- Escalate technical problems quickly

### For Platform Admins
- Schedule migrations during low-traffic periods
- Communicate with creators beforehand
- Monitor payment success rates
- Track re-onboarding completion rates

## Success Metrics

Track these after migration:
- **Re-onboarding completion rate** (target: >90%)
- **Cross-border payment success rate** (should improve)
- **Creator satisfaction** (fewer payment issues)
- **Support ticket volume** (should decrease over time)

---

*This migration system ensures all creators can receive payments globally while maintaining the best user experience possible.*
