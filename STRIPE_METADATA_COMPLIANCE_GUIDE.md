# How to Show Enhanced Metadata to Stripe - SpennyPiggy.co

**Date**: August 27, 2025  
**Purpose**: Demonstrate comprehensive payment metadata compliance to Stripe

## 🎯 **Overview**

This guide shows you exactly how to view and document the enhanced metadata in Stripe to demonstrate compliance with Stripe's payment processing policies.

## 📊 **Method 1: Stripe Dashboard (Recommended)**

### **For Payment Intents (One-time Payments)**

1. **Login to Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Login with your Stripe account

2. **Navigate to Payments**
   - Click **"Payments"** in the left sidebar
   - You'll see a list of all payment transactions

3. **Select a Recent Payment**
   - Click on any payment from SpennyPiggy.co
   - Look for payments after August 27, 2025 (when metadata was enhanced)

4. **View Metadata Section**
   - Scroll down on the payment detail page
   - Find the **"Metadata"** section
   - You'll see all 15-25 metadata fields

### **For Subscriptions (Recurring Payments)**

1. **Navigate to Customers**
   - Click **"Customers"** in the left sidebar

2. **Select a Customer**
   - Click on any customer who has subscriptions

3. **View Subscription Details**
   - Click on the **"Subscriptions"** tab
   - Click on any active subscription

4. **View Subscription Metadata**
   - Scroll down to find **"Metadata"** section
   - You'll see comprehensive subscription metadata

## 🔧 **Method 2: Stripe CLI (For Technical Verification)**

### **Install Stripe CLI** (if not already installed)
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Login to your Stripe account
stripe login
```

### **View Recent Payments with Metadata**
```bash
# List recent payment intents with full details
stripe payment_intents list --limit=5 --expand=data.metadata

# View specific payment intent
stripe payment_intents retrieve pi_PAYMENT_ID

# List recent invoices (for subscriptions)
stripe invoices list --limit=5 --expand=data.subscription.metadata
```

### **Real-time Event Monitoring**
```bash
# Listen to payment events and see metadata in real-time
stripe listen --events=payment_intent.succeeded,invoice.payment_succeeded
```

## 📷 **Method 3: Screenshots for Stripe Support**

### **Create Documentation Screenshots:**

1. **Payment Intent Metadata Screenshot**
   - Go to Stripe Dashboard → Payments
   - Click on a recent SpennyPiggy payment
   - Take screenshot of the metadata section showing:
     - `platform: "SpennyPiggy"`
     - `purpose: "Shop Item Purchase Payment"`
     - `buyer_name: "John Smith"`
     - `creator_name: "Jane Doe"`
     - `transaction_description: "Shop purchase: Digital Art from Creator"`
     - And all other enhanced fields

2. **Subscription Metadata Screenshot**
   - Go to Customers → Select customer → Subscriptions
   - Take screenshot of subscription metadata showing:
     - `purpose: "Creator Membership Subscription Payment"`
     - `membership_level: "Gold Level"`
     - Complete buyer and creator information

## 📋 **Method 4: Create Test Transactions**

To generate fresh metadata for demonstration:

### **1. Test Shop Purchase**
```bash
# Run the testing script
./test_stripe_metadata.sh

# Or manually:
# 1. Go to your SpennyPiggy.co staging/production site
# 2. Navigate to any creator's shop
# 3. Purchase an item
# 4. Check Stripe Dashboard for the new payment with metadata
```

### **2. Test Wishlist Contribution**
```bash
# 1. Go to any creator's wishlist
# 2. Make a contribution
# 3. Check Stripe Dashboard for enhanced metadata
```

### **3. Test Membership Subscription**
```bash
# 1. Subscribe to a creator's membership
# 2. Check Stripe Dashboard → Customers → Subscriptions
```

## 📄 **Method 5: Export Payment Data**

### **Export Recent Transactions**
1. Go to Stripe Dashboard → Payments
2. Click **"Export"** button
3. Select date range (after August 27, 2025)
4. Include **"Metadata"** in export options
5. Download CSV/Excel file showing all metadata

### **API Export** (for technical users)
```bash
# Export payments with metadata via API
curl https://api.stripe.com/v1/payment_intents \
  -u sk_test_YOUR_KEY: \
  -d limit=10 \
  -d expand[]=data.metadata
```

## 🎯 **What Stripe Will See**

### **Before Enhancement:**
```json
{
  "purpose": "shop_purchase",
  "user_id": "123"
}
```

### **After Enhancement (What They'll See Now):**
```json
{
  "platform": "SpennyPiggy",
  "environment": "production",
  "payment_uuid": "uuid-123",
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
  "is_anonymous_purchase": "0"
}
```

## 📧 **Method 6: Communicate with Stripe**

### **Email Template for Stripe Support:**

```
Subject: Enhanced Payment Metadata Implementation - SpennyPiggy.co

Dear Stripe Support Team,

We have implemented comprehensive payment metadata across all transactions on SpennyPiggy.co to ensure full compliance with Stripe's payment processing policies.

Enhanced Metadata Implementation:
• Complete buyer and creator information (names, emails, profiles)
• Detailed transaction descriptions
• Clear payment purposes and categories
• Product/service details
• Platform identification and environment tracking

You can verify this by:
1. Checking recent payments in our Stripe Dashboard (Account: [Your Account ID])
2. Looking at transactions from August 27, 2025 onwards
3. Viewing the "Metadata" section of any payment or subscription

Sample Payment Intent ID for review: pi_[RECENT_PAYMENT_ID]
Sample Subscription ID for review: sub_[RECENT_SUBSCRIPTION_ID]

The metadata now includes 15-25 fields per transaction providing complete context for:
- Dispute resolution
- Transaction understanding
- Compliance verification
- Customer support

Thank you for your consideration.

Best regards,
[Your Name]
SpennyPiggy.co Team
```

## 🚀 **Quick Start Steps**

1. **Run the test script:**
   ```bash
   ./test_stripe_metadata.sh
   ```

2. **Make a test payment** on your platform

3. **Go to Stripe Dashboard** → Payments

4. **Click on the recent payment** 

5. **Screenshot the metadata section**

6. **Send to Stripe** with explanation of enhanced compliance

## 📊 **Verification Checklist**

- [ ] Metadata visible in Stripe Dashboard
- [ ] All 15+ fields populated correctly  
- [ ] Human-readable transaction descriptions
- [ ] Complete buyer and creator information
- [ ] Anonymous user handling working
- [ ] Screenshots taken for documentation
- [ ] Test payments created
- [ ] Ready to show Stripe support

---

**Next Steps**: Follow any of the methods above to view and document your enhanced metadata for Stripe review.
