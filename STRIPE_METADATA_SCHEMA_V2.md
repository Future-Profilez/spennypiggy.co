# Stripe Metadata Schema RFC v2.0 - Enhanced User & Transaction Information

**Version**: 2.0  
**Date**: August 27, 2025  
**Status**: Implemented ✅  
**Previous Version**: v1.0 (Basic schema)

## Overview

This document defines the comprehensive metadata schema for all Stripe payments processed through SpennyPiggy.co. Version 2.0 significantly enhances the metadata with detailed buyer/creator information, transaction descriptions, and comprehensive payment context for improved compliance, analytics, customer service, and debugging.

## Key Improvements in v2.0

- **Enhanced User Information**: Complete buyer and creator profiles with names, usernames, and profile URLs
- **Detailed Descriptions**: Human-readable transaction descriptions for customer service
- **Platform Context**: Environment tracking and platform identification
- **Better Compliance**: More descriptive purposes and transaction details
- **Anonymous User Handling**: Proper metadata for guest purchases and anonymous transactions

## Schema Standards

All metadata keys must follow these conventions:
- **Format**: lowercase_snake_case
- **Length**: Max 40 characters per key, 500 characters per value
- **Type**: String values only (numbers as strings)
- **Validation**: All values truncated at 497 chars if exceeding limits

## Universal Metadata Fields

### Platform & System Information

| Key | Description | Example | Required |
|-----|-------------|---------|----------|
| `platform` | Platform identifier | `"SpennyPiggy"` | ✅ |
| `environment` | Deployment environment | `"production"`, `"staging"` | ✅ |
| `payment_uuid` | Internal payment record UUID | `"a1b2c3d4-e5f6-7890-abcd-ef1234567890"` | ✅ |
| `created_at` | Payment creation timestamp (ISO) | `"2024-08-27T10:34:53Z"` | ✅ |

### Transaction Context

| Key | Description | Example | Required |
|-----|-------------|---------|----------|
| `purpose` | Human-readable payment purpose | `"Wishlist Item Contribution Payment"` | ✅ |
| `payment_category` | Machine-readable category | `"wishlist_contribution"` | ✅ |
| `product_type` | Product being purchased | `"wish_item"`, `"shop_item"` | ✅ |
| `transaction_description` | Complete transaction summary | `"Wishlist contribution for Gaming Setup from JohnDoe"` | ✅ |

### Buyer/Payer Information

| Key | Description | Example | Required |
|-----|-------------|---------|----------|
| `buyer_id` | Buyer's internal user ID | `"12345"`, `"guest"` | ✅ |
| `buyer_name` | Buyer's full name | `"Jane Smith"`, `"Anonymous"` | ✅ |
| `buyer_username` | Buyer's platform username | `"janesmith"`, `"guest"` | ✅ |
| `buyer_email` | Buyer's email address | `"jane@example.com"` | ✅ |
| `buyer_profile_url` | Full URL to buyer's profile | `"https://spennypiggy.co/janesmith"` | ✅ |

### Creator/Recipient Information

| Key | Description | Example | Required |
|-----|-------------|---------|----------|
| `creator_id` | Creator's internal user ID | `"67890"` | ✅ |
| `creator_name` | Creator's full name | `"John Doe"` | ✅ |
| `creator_username` | Creator's platform username | `"johndoe"` | ✅ |
| `creator_profile_url` | Full URL to creator's profile | `"https://spennypiggy.co/johndoe"` | ✅ |

## Payment Type Specific Fields

### 1. Support/Tip Payments (`support_payment`)

| Key | Description | Example |
|-----|-------------|---------|
| `support_type` | Type of support | `"leaderboard_unlock"` |

**Example Metadata:**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "uuid-123",
  "created_at": "2024-08-27T10:34:53Z",
  "purpose": "Support Payment",
  "payment_category": "support_payment",
  "product_type": "tip_jar",
  "transaction_description": "Support payment for creator JohnDoe",
  "buyer_id": "123",
  "buyer_name": "Jane Smith",
  "buyer_username": "janesmith",
  "buyer_email": "jane@example.com",
  "buyer_profile_url": "https://spennypiggy.co/janesmith",
  "creator_id": "456",
  "creator_name": "John Doe",
  "creator_username": "johndoe",
  "creator_profile_url": "https://spennypiggy.co/johndoe",
  "support_type": "leaderboard_unlock"
}
```

### 2. Wishlist Contributions (`wishlist_contribution`)

| Key | Description | Example |
|-----|-------------|---------|
| `wish_item_id` | Wishlist item database ID | `"789"` |
| `wish_item_name` | Name of the wishlist item | `"Gaming Setup"` |
| `wish_item_description` | Item description | `"High-end gaming computer setup"` |
| `is_anonymous_gift` | Anonymous gift flag | `"0"` or `"1"` |

**Example Metadata:**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "wish-payment-uuid",
  "created_at": "2024-08-27T10:34:53Z",
  "purpose": "Wishlist Item Contribution Payment",
  "payment_category": "wishlist_contribution",
  "product_type": "wish_item",
  "transaction_description": "Wishlist contribution for Gaming Setup",
  "buyer_id": "123",
  "buyer_name": "Jane Smith",
  "buyer_username": "janesmith",
  "buyer_email": "jane@example.com",
  "buyer_profile_url": "https://spennypiggy.co/janesmith",
  "creator_id": "456",
  "creator_name": "John Doe",
  "creator_username": "johndoe",
  "creator_profile_url": "https://spennypiggy.co/johndoe",
  "wish_item_id": "789",
  "wish_item_name": "Gaming Setup",
  "wish_item_description": "High-end gaming computer setup",
  "is_anonymous_gift": "0"
}
```

### 3. Membership Subscriptions (`membership_subscription`)

| Key | Description | Example |
|-----|-------------|---------|
| `membership_id` | Membership tier ID | `"101"` |
| `membership_level` | Membership tier name | `"Gold Level"` |
| `membership_description` | Tier description | `"Premium access with exclusive content"` |
| `subscription_type` | Billing frequency | `"monthly"`, `"yearly"` |
| `membership_price` | Subscription price | `"29.99"` |

**Example Metadata:**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "membership-payment-uuid",
  "created_at": "2024-08-27T10:34:53Z",
  "purpose": "Creator Membership Subscription Payment",
  "payment_category": "membership_subscription",
  "product_type": "membership_level",
  "transaction_description": "Membership subscription: Gold Level for John Doe",
  "buyer_id": "123",
  "buyer_name": "Jane Smith",
  "buyer_username": "janesmith",
  "buyer_email": "jane@example.com",
  "buyer_profile_url": "https://spennypiggy.co/janesmith",
  "creator_id": "456",
  "creator_name": "John Doe",
  "creator_username": "johndoe",
  "creator_profile_url": "https://spennypiggy.co/johndoe",
  "membership_id": "101",
  "membership_level": "Gold Level",
  "membership_description": "Premium access with exclusive content",
  "subscription_type": "monthly",
  "membership_price": "29.99"
}
```

### 4. Wishlist Item Subscriptions (`wishlist_subscription`)

| Key | Description | Example |
|-----|-------------|---------|
| `wish_item_id` | Wishlist item ID | `"789"` |
| `wish_item_name` | Item name | `"Monthly Content"` |
| `subscription_type` | Billing frequency | `"monthly"` |
| `subscription_purpose` | Subscription intent | `"task_request"`, `"wishlist_contribution"` |

### 5. Bill Payments (`bill_payment`)

| Key | Description | Example |
|-----|-------------|---------|
| `bill_id` | Bill database ID | `"202"` |
| `bill_name` | Bill/invoice name | `"Monthly Hosting Fee"` |
| `bill_description` | Bill description | `"Website hosting and maintenance"` |
| `subscription_type` | Payment frequency | `"monthly"`, `"one_time"` |
| `recurring_for` | Recurrence details | `"monthly"`, `"one_time"` |

**Example Metadata:**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "bill-payment-uuid",
  "created_at": "2024-08-27T10:34:53Z",
  "purpose": "Creator Bill Payment",
  "payment_category": "bill_payment",
  "product_type": "bill",
  "transaction_description": "Bill payment: Monthly Hosting Fee for John Doe",
  "buyer_id": "123",
  "buyer_name": "Jane Smith",
  "buyer_username": "janesmith",
  "buyer_email": "jane@example.com",
  "buyer_profile_url": "https://spennypiggy.co/janesmith",
  "creator_id": "456",
  "creator_name": "John Doe",
  "creator_username": "johndoe",
  "creator_profile_url": "https://spennypiggy.co/johndoe",
  "bill_id": "202",
  "bill_name": "Monthly Hosting Fee",
  "bill_description": "Website hosting and maintenance",
  "subscription_type": "monthly",
  "recurring_for": "monthly"
}
```

### 6. Shop Purchases (`shop_purchase`)

| Key | Description | Example |
|-----|-------------|---------|
| `shop_item_id` | Shop item database ID | `"303"` |
| `shop_item_name` | Product name | `"Digital Art Pack"` |
| `shop_item_description` | Product description | `"Collection of digital artwork"` |
| `shop_item_type` | Item type | `"digital"`, `"physical"` |
| `quantity_purchased` | Number of items | `"2"` |
| `variant_id` | Product variant ID | `"var_123"` |
| `is_anonymous_purchase` | Anonymous purchase flag | `"0"` or `"1"` |

**Example Metadata:**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "shop-payment-uuid",
  "created_at": "2024-08-27T10:34:53Z",
  "purpose": "Shop Item Purchase Payment",
  "payment_category": "shop_purchase",
  "product_type": "shop_item",
  "transaction_description": "Shop purchase: Digital Art Pack from John Doe",
  "buyer_id": "123",
  "buyer_name": "Jane Smith",
  "buyer_username": "janesmith",
  "buyer_email": "jane@example.com",
  "buyer_profile_url": "https://spennypiggy.co/janesmith",
  "creator_id": "456",
  "creator_name": "John Doe",
  "creator_username": "johndoe",
  "creator_profile_url": "https://spennypiggy.co/johndoe",
  "shop_item_id": "303",
  "shop_item_name": "Digital Art Pack",
  "shop_item_description": "Collection of digital artwork",
  "shop_item_type": "digital",
  "quantity_purchased": "2",
  "variant_id": "var_123",
  "is_anonymous_purchase": "0"
}
```

## Anonymous/Guest Handling

For anonymous users or guests, the system provides appropriate fallback values:

| Field | Anonymous Value | Description |
|-------|----------------|-------------|
| `buyer_id` | `"guest"` | No user account |
| `buyer_name` | `"Anonymous"` | No provided name |
| `buyer_username` | `"guest"` | No username |
| `buyer_email` | `"anonymous@spennypiggy.co"` | Platform default |
| `buyer_profile_url` | `""` | Empty string |

## Implementation Status

### ✅ Completed Components

1. **Enhanced Metadata Builder**: `Helpers::buildStripeMetadata()` method with comprehensive user information
2. **CheckoutController**: Wishlist contributions with full buyer/creator details
3. **MembershipController**: Membership subscriptions with detailed subscriber information
4. **StripeController**: Wish item subscriptions with enhanced metadata
5. **BillsController**: Bill payments with comprehensive payer/creator information
6. **ShopsController**: Shop purchases with detailed buyer/seller information

### 🔄 Metadata Placement by Controller

| Controller | Method | Payment Type | Metadata Location |
|------------|--------|--------------|-------------------|
| StripeController | tipToJar | Support Payment | `payment_intent_data.metadata` |
| CheckoutController | createCheckout | Wishlist Contribution | `payment_intent_data.metadata` |
| MembershipController | buyLevel | Membership Subscription | `subscription_data.metadata` |
| StripeController | wishItemSubscribe | Wish Item Subscription | `subscription_data.metadata` |
| BillsController | buyBill | Bill Payment | `subscription_data.metadata` |
| ShopsController | buyShopItem | Shop Purchase | `payment_intent_data.metadata` |

## Helper Method Implementation

The centralized metadata builder is implemented as:

```php
/**
 * Build comprehensive Stripe metadata for payments with detailed user and transaction information
 * 
 * @param string $type Payment type (support, wishlist, membership, bill, shop, etc.)
 * @param mixed $paymentModel Payment model instance
 * @param array $extra Additional metadata fields
 * @return array Formatted metadata array
 */
public static function buildStripeMetadata(string $type, $paymentModel, array $extra = []): array
```

## Benefits of Enhanced Metadata v2.0

### 🔒 Compliance & Legal
- **Stripe Policy Compliance**: Clear, descriptive payment purposes
- **Dispute Resolution**: Comprehensive transaction context with user details
- **Audit Trails**: Complete transaction history with participant information

### 🎯 Business Intelligence
- **User Behavior Analytics**: Detailed buyer and creator interaction data
- **Transaction Analysis**: Complete context for business metrics
- **Customer Segmentation**: Rich user profile information

### 🛠 Customer Support
- **Quick Context Lookup**: All transaction details in one place
- **User Identification**: Complete buyer and creator information
- **Issue Resolution**: Detailed transaction descriptions for support cases

### 🔍 Development & Debugging
- **Enhanced Logging**: Comprehensive transaction information
- **Error Tracking**: Better context for payment issues
- **Platform Analytics**: Environment and system tracking

## Validation & Testing

1. **Metadata Validation**: All fields checked for length and format
2. **Value Truncation**: Automatic truncation with logging for oversized values  
3. **Null Handling**: Proper fallbacks for missing data
4. **String Conversion**: All values properly converted to strings
5. **Boolean Normalization**: Boolean values converted to "0"/"1" strings

## Migration Status

- ✅ **v1.0 → v2.0**: All payment flows updated with enhanced metadata
- ✅ **Helper Method**: Centralized `buildStripeMetadata()` implementation
- ✅ **Controller Updates**: All payment controllers using new schema
- 🔄 **Testing Phase**: Regression tests and Stripe dashboard verification
- 🔄 **Documentation**: Internal developer wiki updates
- 🔄 **Deployment**: Staging deployment and production rollout

---

**Implementation Status**: ✅ Complete  
**Next Steps**: Testing, verification, and documentation updates
