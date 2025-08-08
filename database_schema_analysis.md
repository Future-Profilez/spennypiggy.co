# Database Schema & Domain Model Analysis
## SpenpyPiggy Platform - Complete Database Architecture

### Overview
This analysis covers the complete database schema for SpenpyPiggy, a platform that enables content creators to receive payments for wish items, memberships, bills, and tips through various payment methods including Stripe integration.

## Core Domain Models

### 1. User Model
**Table:** `users`
**Primary Key:** `id` (auto-increment)
**UUID:** `uuid` (unique identifier for public APIs)
**Soft Deletes:** Yes (`deleted_at`)

#### Key Attributes:
- **Identity:** `name`, `email`, `username` (unique), `uuid`
- **Authentication:** `password`, `remember_token`, `email_verified_at`
- **Profile:** `bio`, `bio_approved`, `avatar`, `cover`, `gender`, `creator_category`
- **Business:** `stripe_id`, `account_id`, `charges_enabled`, `stripe_details_submitted`
- **Localization:** `country`, `default_currency`, `is_uk`
- **Status Flags:** 
  - `approved` - Account approval status
  - `suspended_account` - Account suspension
  - `identity_status` - KYC verification status
  - `profile_status_lock` - Profile editing restrictions
  - `is_500_limit_exceeded` - Transaction limits
- **Subscription:** `expired_at`, `is_subscribed`
- **Social:** `twitter_id`, `auto_tweet`

#### Business Logic Support:
- **Creator Economy:** Supports Stripe Connect accounts for payment processing
- **Compliance:** Identity verification and KYC through `identity_status`
- **Content Moderation:** Profile approval system with `bio_approved`
- **Multi-currency:** Supports international creators with currency settings
- **Social Integration:** Twitter integration for automated posting

### 2. WishItem Model
**Table:** `wish_items`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id` → users(id)

#### Key Attributes:
- **Core:** `wishname`, `price`, `currency`, `item_url`, `thumbnail`
- **Stripe Integration:** `stripe_product_id`, `price_id`
- **Payment Types:** `subscription` (0=single, 1=subscription, 2=crowdfund)
- **Subscription:** `subscription_period`, `repeat_purchase`
- **Fulfillment:** `fullfill_amount`, `tax_amount`
- **Content:** `category`, `reward`, `ai_generated`
- **Status:** `is_pin`, `is_approved`, `deleted_at`, `delete_reason`
- **Social:** `twitter_response` (JSON)

#### Business Logic Support:
- **Flexible Payment Models:** Single payment, subscriptions, and crowdfunding
- **Content Creator Tools:** Rewards, categories, pinned items
- **Tax Compliance:** Built-in tax calculations
- **Social Integration:** Automated Twitter posting capabilities
- **Content Moderation:** Approval workflow for wish items

### 3. StripePaymentDetail Model
**Table:** `stripe_payment_details`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id` → users(id), `owner_id` → users(id)

#### Key Attributes:
- **Stripe Session:** `session_id`, `session_created`, `session_expires_at`
- **Payment:** `amount_subtotal`, `amount_total`, `currency`, `tax`
- **Method:** `payment_method_type`, `payment_method_config_detail_id`
- **User Data:** `user_id` (payer), `owner_id` (recipient), `name`, `guest_email`
- **Features:** `message`, `anonymous`
- **Status:** `payment_status`

#### Business Logic Support:
- **Two-sided Marketplace:** Separate user (payer) and owner (recipient)
- **Guest Payments:** Non-registered users can make payments
- **Privacy:** Anonymous payment options
- **Session Management:** Secure Stripe session handling

### 4. StripePaymentItems Model
**Table:** `stripe_payment_items`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `stripe_payment_detail_id`, `wish_item_id`, `user_cart_id`

#### Key Attributes:
- **Payment Link:** `stripe_payment_detail_id` → stripe_payment_details(id)
- **Item Link:** `wish_item_id` → wish_items(id)
- **Cart Link:** `user_cart_id` → user_carts(id)
- **Amounts:** `amount`, `tax`, `quantity`
- **Media:** `message_media`, `media_type`, `thank_you_approved`
- **Social:** `twitter_response` (JSON)

#### Business Logic Support:
- **Line Items:** Detailed breakdown of payments per item
- **Media Messages:** Buyers can attach media to payments
- **Quantity Support:** Multiple units of the same item
- **Thank You Notes:** Approval workflow for creator responses

### 5. UserCart Model
**Table:** `user_carts`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id`, `owner_id`, `wish_item_id`

#### Key Attributes:
- **Users:** `user_id` (buyer), `owner_id` (creator)
- **Item:** `wish_item_id` → wish_items(id)
- **Purchase:** `amount`, `quantity`, `tax`, `priceid`
- **Session:** `device_id`, `country`
- **Content:** `message`
- **Status:** `status`, `is_subscribed`

#### Business Logic Support:
- **Shopping Cart:** Pre-payment item storage
- **Multi-device:** Device-specific cart management
- **Localization:** Country-specific processing
- **Subscription Tracking:** Subscription vs one-time purchases

### 6. WishItemSubscription Model
**Table:** `wish_item_subscriptions`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `wish_item_id`, `user_id`

#### Key Attributes:
- **Stripe:** `stripe_id`, `session_id`
- **Item:** `wish_item_id` → wish_items(id)
- **Customer:** `user_id` → users(id), `guest_name`, `guest_email`
- **Payment:** `currency`, `amount`, `tax`, `vat_tax_amount`
- **Subscription:** `recurring_for`, `recurring_type`, `end`, `upcoming_payment`
- **Features:** `surprise_message`, `anonymous`, `payment_method`
- **Status:** `status`

#### Business Logic Support:
- **Recurring Payments:** Automated subscription billing
- **Guest Subscriptions:** Non-registered user subscriptions
- **Tax Management:** VAT and general tax handling
- **Subscription Lifecycle:** End dates and renewal tracking

### 7. Membership Model
**Table:** `memberships`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id` → users(id)

#### Key Attributes:
- **Creator:** `user_id` → users(id)
- **Stripe:** `product_id`, `price_id`
- **Tier:** `level` (bronze, silver, gold, platinum, lifetime)
- **Pricing:** `price`
- **Content:** `thumbnail`, `rewards`
- **Status:** `status`

#### Business Logic Support:
- **Membership Tiers:** Hierarchical creator support levels
- **Rewards System:** Benefits for different membership levels
- **Stripe Products:** Integration with Stripe subscription products

### 8. Bills Model
**Table:** `bills`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id` → users(id)

#### Key Attributes:
- **Creator:** `user_id` → users(id)
- **Stripe:** `product_id`, `price_id`
- **Details:** `name`, `price`, `currency`, `thumbnail`
- **Tax:** `tax_amount`
- **Status:** `status`

#### Business Logic Support:
- **Bill Splitting:** Creators can request specific payments
- **Tax Compliance:** Tax calculations on bills
- **Flexible Naming:** Custom bill descriptions

### 9. Follow Model (Social Features)
**Table:** `follows`
**Primary Key:** `id`
**Foreign Keys:** `follower_id` → users(id), `followed_id` → users(id)

#### Key Attributes:
- **Relationship:** `follower_id`, `followed_id`

#### Business Logic Support:
- **Social Network:** User following relationships
- **Creator Discovery:** Follow system for content creators

### 10. MonthlyCharge Model (Creator Subscriptions)
**Table:** `monthly_charges`
**Primary Key:** `id`
**UUID:** `uuid`
**Soft Deletes:** Yes
**Foreign Keys:** `user_id` → users(id)

#### Key Attributes:
- **Stripe:** `stripe_id`, `session_id`
- **Creator:** `user_id` → users(id)
- **Customer:** `name`, `email`
- **Payment:** `currency`, `amount`, `tax`
- **Subscription Periods:** 
  - `current_start_trial_date`, `current_end_trial_date`
  - `current_start_subscription_date`, `current_end_subscription_date`
- **Billing:** `upcoming_payment`, `cancelled_at`

#### Business Logic Support:
- **Creator Monetization:** Monthly subscription plans for creators
- **Trial Periods:** Free trial management
- **Subscription Lifecycle:** Complete subscription state tracking

## Entity Relationship Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│      USERS      │    │   WISH_ITEMS    │    │  USER_CARTS     │
│─────────────────│    │─────────────────│    │─────────────────│
│ id (PK)         │◄───┤ user_id (FK)    │◄───┤ wish_item_id(FK)│
│ uuid (UQ)       │    │ uuid (UQ)       │    │ uuid (UQ)       │
│ username (UQ)   │    │ wishname        │    │ user_id (FK)    │◄┐
│ email (UQ)      │    │ price           │    │ owner_id (FK)   │─┘
│ stripe_id       │    │ stripe_product  │    │ amount          │
│ account_id      │    │ price_id        │    │ quantity        │
│ charges_enabled │    │ subscription    │    │ status          │
│ approved        │    │ is_approved     │    │ device_id       │
│ suspended       │    │ deleted_at      │    │ deleted_at      │
│ identity_status │    └─────────────────┘    └─────────────────┘
│ deleted_at      │           │                        │
└─────────────────┘           │                        │
         │                    ▼                        ▼
         │         ┌─────────────────┐    ┌─────────────────┐
         │         │WISH_ITEM_SUBS   │    │STRIPE_PAYMENT   │
         │         │─────────────────│    │    _ITEMS       │
         │         │ wish_item_id(FK)│    │─────────────────│
         │         │ user_id (FK)    │◄───┤ user_cart_id(FK)│
         │         │ stripe_id       │    │ wish_item_id(FK)│
         │         │ amount          │    │ stripe_payment  │
         │         │ recurring_type  │    │   _detail_id(FK)│
         │         │ end             │    │ amount          │
         │         │ deleted_at      │    │ quantity        │
         │         └─────────────────┘    │ deleted_at      │
         │                                └─────────────────┘
         │                                        │
         ▼                                        ▼
┌─────────────────┐                    ┌─────────────────┐
│  MEMBERSHIPS    │                    │STRIPE_PAYMENT   │
│─────────────────│                    │   _DETAILS      │
│ user_id (FK)    │◄┐                  │─────────────────│
│ uuid (UQ)       │ │                  │ uuid (UQ)       │
│ level           │ │                  │ session_id      │
│ price           │ │                  │ user_id (FK)    │◄┐
│ product_id      │ │                  │ owner_id (FK)   │─┘
│ price_id        │ │                  │ amount_total    │
│ deleted_at      │ │                  │ currency        │
└─────────────────┘ │                  │ payment_status  │
                    │                  │ anonymous       │
┌─────────────────┐ │                  │ deleted_at      │
│     BILLS       │ │                  └─────────────────┘
│─────────────────│ │
│ user_id (FK)    │◄┘
│ uuid (UQ)       │
│ name            │         ┌─────────────────┐
│ price           │         │    FOLLOWS      │
│ currency        │         │─────────────────│
│ product_id      │         │ follower_id(FK) │◄┐
│ tax_amount      │         │ followed_id(FK) │─┘
│ deleted_at      │         └─────────────────┘
└─────────────────┘
         │
         ▼                  ┌─────────────────┐
┌─────────────────┐         │ MONTHLY_CHARGES │
│  BILL_PAYMENTS  │         │─────────────────│
│─────────────────│         │ user_id (FK)    │◄┐
│ bills_id (FK)   │◄────────│ stripe_id       │ │
│ user_id (FK)    │◄────────│ amount          │ │
│ stripe_id       │         │ current_start   │ │
│ amount          │         │ current_end     │ │
│ recurring_type  │         │ upcoming_payment│ │
│ status          │         │ cancelled_at    │ │
│ deleted_at      │         │ deleted_at      │ │
└─────────────────┘         └─────────────────┘ │
                                               │
┌─────────────────┐                            │
│MEMBERSHIP_PYMNTS│                            │
│─────────────────│                            │
│membership_id(FK)│                            │
│ user_id (FK)    │◄───────────────────────────┘
│ stripe_id       │
│ amount          │
│ recurring_type  │
│ status          │
│ deleted_at      │
└─────────────────┘
```

## Key Database Features

### 1. UUID Strategy
- **Primary Keys:** Traditional auto-increment integers for performance
- **Public APIs:** UUID fields for external integrations and security
- **Consistency:** All major entities have UUID support

### 2. Soft Delete Implementation
**Tables with Soft Deletes:**
- `users`
- `wish_items`
- `stripe_payment_details`
- `stripe_payment_items`
- `user_carts`
- `wish_item_subscriptions`
- `memberships`
- `bills`
- `bill_payments`
- `membership_payments`
- `monthly_charges`

**Business Benefits:**
- **Data Recovery:** Ability to restore accidentally deleted data
- **Analytics:** Historical data preservation for reporting
- **Compliance:** Audit trail maintenance
- **Relationships:** Maintains referential integrity

### 3. Polymorphic Relations
The system uses several polymorphic-like patterns:
- **Payment Types:** Different payment models (WishItems, Bills, Memberships) all integrate with Stripe
- **User Relations:** Users can be both payers and recipients in transactions

### 4. Foreign Key Relationships

#### User-Centric Relations:
- **One-to-Many:**
  - User → WishItems
  - User → Memberships  
  - User → Bills
  - User → UserCarts (as buyer)
  - User → UserCarts (as creator/owner)
  - User → StripePaymentDetails (as payer)
  - User → StripePaymentDetails (as recipient)

#### Payment Flow Relations:
- **StripePaymentDetail** ← **StripePaymentItems** (One-to-Many)
- **WishItem** ← **StripePaymentItems** (One-to-Many)
- **UserCart** ← **StripePaymentItems** (One-to-One)

#### Subscription Relations:
- **WishItem** ← **WishItemSubscription** (One-to-Many)
- **User** ← **WishItemSubscription** (One-to-Many)

### 5. Business Logic Support Analysis

#### Creator Economy Features:
1. **Multi-Revenue Streams:** WishItems, Memberships, Bills, Tips
2. **Subscription Management:** Recurring payments with trial periods
3. **Social Features:** Following system, Twitter integration
4. **Content Moderation:** Approval workflows for profiles and items

#### Payment Processing:
1. **Stripe Integration:** Complete Stripe Connect implementation
2. **Tax Compliance:** VAT and general tax calculations
3. **Multi-Currency:** International payment support
4. **Guest Payments:** Non-registered user transactions

#### User Experience:
1. **Shopping Cart:** Pre-purchase item management
2. **Anonymous Options:** Privacy-focused payment options
3. **Media Attachments:** Rich media in payment messages
4. **Mobile Support:** Device-specific cart management

#### Compliance & Security:
1. **Identity Verification:** KYC integration
2. **Account Status Management:** Suspension and approval systems
3. **Audit Trails:** Comprehensive soft delete strategy
4. **Data Privacy:** Anonymous payment options

## Indexing Strategy

### Performance Indexes:
- **Users:** `username`, `email`, `uuid`, `stripe_id`
- **WishItems:** `user_id`, `uuid`, `subscription`
- **Payments:** `session_id`, `user_id`, `owner_id`
- **Subscriptions:** `stripe_id`, `user_id`, `wish_item_id`

### Business Logic Indexes:
- **Status Fields:** `approved`, `suspended_account`, `charges_enabled`
- **Dates:** `created_at`, `updated_at`, `deleted_at`
- **Foreign Keys:** All relationship fields

## Schema Evolution Insights

The migration history shows a mature, evolving platform:

1. **Phase 1:** Basic user and wish item functionality
2. **Phase 2:** Stripe integration and payment processing
3. **Phase 3:** Advanced features (subscriptions, memberships)
4. **Phase 4:** Social features and compliance
5. **Phase 5:** International expansion (multi-currency, tax)

This database schema effectively supports a comprehensive creator economy platform with robust payment processing, social features, and compliance capabilities.
