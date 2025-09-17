# 🧪 Wish Item Deliverable System - Testing Guide

## Overview
This guide covers multiple ways to test the wish item deliverable system that handles automatic delivery processing when customers purchase wish items through Stripe.

## 🎯 What We're Testing
- Stripe webhook handling (`checkout.session.completed`)
- Deliverable record creation
- Background job processing
- Media bundle generation
- Certificate creation
- Email notifications

---

## 1. 🔧 Database & Model Testing

### Test Database Connection & Models
```bash
# Test basic model functionality
php artisan tinker
```

In Tinker:
```php
// Test Deliverable model
$deliverable = new App\Models\Deliverable();
echo "Available statuses: " . implode(', ', $deliverable::STATUSES) . "\n";
echo "Available types: " . implode(', ', $deliverable::TYPES) . "\n";

// Test relationships (if you have test data)
$user = App\Models\User::first();
$wishItem = App\Models\WishItem::first();
```

---

## 2. 🌐 Webhook Endpoint Testing

### Method A: Using cURL (Local Testing)
```bash
# Test webhook endpoint with sample payload
curl -X POST http://localhost:8000/webhook/payment \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=test_signature" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "type": "checkout.session.completed",
    "data": {
      "object": {
        "id": "cs_test_1234567890",
        "object": "checkout_session",
        "payment_status": "paid",
        "amount_total": 2500,
        "currency": "usd",
        "customer_email": "test@example.com",
        "metadata": {
          "creator_id": "1",
          "wish_id": "1",
          "deliverable_type": "media_bundle",
          "certificate": "true",
          "product_type": "wish_item"
        }
      }
    }
  }'
```

### Method B: Using Postman/Insomnia
1. Create POST request to `http://localhost:8000/webhook/payment`
2. Add headers:
   - `Content-Type: application/json`
   - `Stripe-Signature: t=1234567890,v1=test_signature`
3. Use the JSON payload from the cURL example above

---

## 3. 🎭 Stripe Test Mode

### Using Stripe CLI (Recommended)
```bash
# Install Stripe CLI if not already installed
# brew install stripe/stripe-cli/stripe

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:8000/webhook/payment

# In another terminal, trigger test events
stripe trigger checkout.session.completed
```

### Manual Stripe Dashboard Testing
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create webhook endpoint: `https://yourdomain.com/webhook/payment`
3. Select event: `checkout.session.completed`
4. Use Stripe's test mode to create actual checkout sessions

---

## 4. 🧪 Unit & Feature Testing

### Run Existing Tests
```bash
# Run the comprehensive test suite we created
php artisan test tests/Feature/WishItemDeliverableFlowTest.php

# Run all tests
php artisan test

# Run with coverage (if configured)
php artisan test --coverage
```

### Manual Feature Testing
```bash
# Test job processing manually
php artisan tinker
```

In Tinker:
```php
// Dispatch job manually for testing
$jobData = [
    'deliverable_id' => 1, // Use actual ID
    'wish_item_id' => 1,
    'creator_id' => 1,
    'buyer_email' => 'test@example.com',
    'generate_certificate' => true
];

App\Jobs\ProcessWishItemDeliverable::dispatch($jobData);
```

---

## 5. 🔄 Queue & Job Testing

### Test Queue Workers
```bash
# Start queue worker
php artisan queue:work

# In another terminal, dispatch test jobs
php artisan tinker
```

### Monitor Queue Status
```bash
# Check failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush
```

---

## 6. 📧 Email Testing

### Using Log Driver (Development)
```bash
# Check .env file
MAIL_MAILER=log

# Check logs for sent emails
tail -f storage/logs/laravel.log | grep -i mail
```

### Using Mailtrap/MailHog
```bash
# Update .env for testing service
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
```

---

## 7. 🎯 End-to-End Testing Scenarios

### Scenario 1: Complete Purchase Flow
1. Create a wish item in your application
2. Set up Stripe checkout with proper metadata
3. Complete payment in Stripe test mode
4. Verify webhook receives event
5. Check deliverable record creation
6. Monitor job processing
7. Verify email delivery

### Scenario 2: Error Handling
1. Send webhook with missing metadata
2. Send webhook with invalid wish_item_id
3. Test job failures and retries
4. Verify error logging

### Scenario 3: Different Deliverable Types
Test each type:
- `media_bundle` - ZIP file creation
- `digital_file` - Single file delivery
- `cert` - Certificate generation
- `access` - Subscription access

---

## 8. 🔍 Debugging & Monitoring

### Check Logs
```bash
# Application logs
tail -f storage/logs/laravel.log

# Webhook logs (if logging enabled)
grep "webhook" storage/logs/laravel.log

# Job processing logs
grep "ProcessWishItemDeliverable" storage/logs/laravel.log
```

### Database Verification
```bash
php artisan tinker
```

```php
// Check deliverable records
App\Models\Deliverable::latest()->get();

// Check specific deliverable
$deliverable = App\Models\Deliverable::find(1);
echo "Status: " . $deliverable->status;
echo "Type: " . $deliverable->type;
```

---

## 9. 🚀 Production Testing Checklist

Before going live:

- [ ] Webhook endpoint is accessible from internet
- [ ] SSL certificate is valid
- [ ] Stripe webhook signature validation works
- [ ] Queue workers are running
- [ ] Email delivery is configured
- [ ] File storage permissions are correct
- [ ] Error monitoring is set up
- [ ] Backup systems are in place

---

## 🆘 Troubleshooting Common Issues

### Webhook Not Receiving Events
- Check webhook URL accessibility
- Verify Stripe signature validation
- Check CSRF token exclusion for webhook route

### Jobs Not Processing
- Ensure queue workers are running
- Check queue configuration in `.env`
- Verify job class exists and is properly namespaced

### Email Not Sending
- Check mail configuration in `.env`
- Verify email templates exist
- Test with log driver first

### File Generation Issues
- Check storage permissions
- Verify file paths are correct
- Ensure required directories exist

---

## 📊 Success Metrics

A successful test should show:
1. ✅ Webhook receives and processes events
2. ✅ Deliverable records are created correctly
3. ✅ Jobs are dispatched and processed
4. ✅ Files are generated (ZIP, certificates)
5. ✅ Emails are sent to buyers
6. ✅ Status updates occur properly
7. ✅ Error handling works as expected

---

*This system is now ready for production use! 🎉*