# Stripe Metadata Schema RFC - SpennyPiggy Payment Compliance

**Version**: 1.0  
**Date**: August 27, 2025  
**Status**: Implementation Required

## Overview

This document defines the standardized metadata schema for all Stripe payments processed through SpennyPiggy.co to ensure compliance with Stripe's payment processing policies and provide clear transaction context.

## Schema Standards

All metadata keys must follow these conventions:
- **Format**: lowercase_snake_case
- **Length**: Max 40 characters per key, 500 characters per value
- **Type**: String values only (numbers as strings)

## Core Metadata Fields

### Required for All Payments

| Key | Type | Description | Example |
|-----|------|-------------|---------|
| `purpose` | string | Primary payment intent | `"wishlist_contribution"` |
| `user_id` | string\|null | Payer's user ID (null for guests) | `"123"` |
| `creator_id` | string | Recipient creator's user ID | `"456"` |
| `creator_profile` | string | Full URL to creator's profile | `"https://spennypiggy.co/username"` |
| `product_type` | string | Type of item/service being purchased | `"wish_item"` |
| `payment_uuid` | string | Internal payment record UUID | `"uuid-string"` |

### Payment-Specific Fields

| Key | Required For | Description | Example |
|-----|--------------|-------------|---------|
| `wishlist_item_id` | Wishlist payments | Wish item database ID | `"789"` |
| `membership_id` | Membership subscriptions | Membership tier ID | `"101"` |
| `membership_level` | Membership subscriptions | Tier name | `"gold"` |
| `bill_id` | Bill payments | Bill database ID | `"202"` |
| `shop_item_id` | Shop purchases | Shop item database ID | `"303"` |
| `subscription_type` | Recurring payments | Subscription frequency | `"monthly"` |
| `quantity` | Item purchases | Number of items | `"2"` |
| `anonymous` | All payments | Anonymous payment flag | `"0"` or `"1"` |
| `challenge_id` | Challenge participation | Challenge ID | `"ch_123"` |
| `support_type` | Support/tip payments | Type of support | `"leaderboard_unlock"` |

## Purpose Values

| Purpose | Description | Use Case |
|---------|-------------|----------|
| `support_payment` | Fan support/tip to creator | Tip jar, general support |
| `wishlist_contribution` | Funding creator's wishlist items | Single or partial item funding |
| `membership_subscription` | Recurring creator support tiers | Monthly membership levels |
| `task_request` | Custom message/task requests | Paid messages, confessions |
| `bill_payment` | Creator bill/invoice payment | Recurring bills, specific charges |
| `shop_purchase` | Physical/digital item purchase | Shop items, digital content |
| `challenge_participation` | Timed challenge/goal participation | Drip goals, time-bound support |

## Product Types

| Product Type | Description |
|--------------|-------------|
| `tip_jar` | Support payments |
| `wish_item` | Wishlist items |
| `membership_level` | Membership tiers |
| `bill` | Creator bills |
| `shop_item` | Shop products |
| `challenge` | Challenges/goals |

## Implementation Examples

### 1. Support Payment (Already Implemented)
```php
[
    "purpose" => "support_payment",
    "support_type" => "leaderboard_unlock", 
    "user_id" => "123",
    "creator_id" => "456",
    "creator_profile" => "https://spennypiggy.co/creator123",
    "product_type" => "tip_jar",
    "payment_uuid" => "tip-uuid-123",
    "anonymous" => "0"
]
```

### 2. Wishlist Contribution
```php
[
    "purpose" => "wishlist_contribution",
    "user_id" => "123", 
    "creator_id" => "456",
    "creator_profile" => "https://spennypiggy.co/creator123",
    "product_type" => "wish_item",
    "wishlist_item_id" => "789",
    "payment_uuid" => "wish-payment-uuid",
    "quantity" => "1",
    "anonymous" => "0"
]
```

### 3. Membership Subscription
```php
[
    "purpose" => "membership_subscription",
    "user_id" => "123",
    "creator_id" => "456", 
    "creator_profile" => "https://spennypiggy.co/creator123",
    "product_type" => "membership_level",
    "membership_id" => "101",
    "membership_level" => "gold",
    "payment_uuid" => "membership-payment-uuid",
    "subscription_type" => "monthly"
]
```

### 4. Bill Payment
```php
[
    "purpose" => "bill_payment",
    "user_id" => "123",
    "creator_id" => "456",
    "creator_profile" => "https://spennypiggy.co/creator123", 
    "product_type" => "bill",
    "bill_id" => "202",
    "payment_uuid" => "bill-payment-uuid",
    "subscription_type" => "monthly"
]
```

### 5. Shop Purchase
```php
[
    "purpose" => "shop_purchase",
    "user_id" => "123",
    "creator_id" => "456",
    "creator_profile" => "https://spennypiggy.co/creator123",
    "product_type" => "shop_item", 
    "shop_item_id" => "303",
    "payment_uuid" => "shop-payment-uuid",
    "quantity" => "2"
]
```

## Controller Implementation Mapping

| Controller | Method | Payment Type | Metadata Location |
|------------|--------|--------------|------------------|
| StripeController | tipToJar | Support Payment | `payment_intent_data.metadata` |
| CheckoutController | createCheckout | Wishlist Contribution | `payment_intent_data.metadata` |
| MembershipController | buyLevel | Membership Subscription | `subscription_data.metadata` |
| StripeController | wishItemSubscribe | Wish Item Subscription | `subscription_data.metadata` |
| BillsController | buyBill | Bill Payment | `subscription_data.metadata` |
| ShopsController | buyShopItem | Shop Purchase | `payment_intent_data.metadata` |

## Helper Method Specification

```php
/**
 * Build standardized Stripe metadata for payments
 * 
 * @param string $type Payment type (support, wishlist, membership, etc.)
 * @param mixed $paymentModel Payment model instance
 * @param array $extra Additional metadata fields
 * @return array Formatted metadata array
 */
public static function buildStripeMetadata(string $type, $paymentModel, array $extra = []): array
```

## Validation Rules

1. All required core fields must be present
2. Values must not exceed character limits
3. URLs must be valid and use HTTPS
4. User IDs must be numeric strings
5. Boolean flags must be "0" or "1" strings
6. Purpose values must match defined enum

## Compliance Benefits

- **Stripe Policy Compliance**: Clear payment purposes for review processes
- **Dispute Resolution**: Detailed context for payment disputes  
- **Audit Trails**: Comprehensive transaction tracking
- **Business Intelligence**: Enhanced payment analytics
- **Customer Support**: Quick payment context lookup

## Migration Plan

1. ✅ Support payments already compliant
2. ⏳ Implement helper method
3. ⏳ Update all other payment flows
4. ⏳ Add validation tests
5. ⏳ Deploy with monitoring

---

**Status**: Ready for implementation  
**Next Steps**: Create `Helpers::buildStripeMetadata()` method and update controllers
