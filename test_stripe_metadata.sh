#!/bin/bash

# Stripe Metadata Testing Script for SpennyPiggy.co
# This script helps you test and view the enhanced metadata in Stripe

echo "🔍 Stripe Metadata Testing Guide"
echo "================================"
echo ""

# Check if Stripe CLI is installed
if ! command -v stripe &> /dev/null; then
    echo "❌ Stripe CLI not found. Please install it first:"
    echo "   brew install stripe/stripe-cli/stripe"
    echo "   https://stripe.com/docs/stripe-cli"
    echo ""
    exit 1
fi

echo "✅ Stripe CLI found"
echo ""

# Login to Stripe (if not already logged in)
echo "🔐 Step 1: Login to Stripe"
echo "Run this command to login:"
echo "   stripe login"
echo ""

# Listen to webhook events to see metadata
echo "🎧 Step 2: Listen to Stripe Events"
echo "Run this command to see real-time payment events with metadata:"
echo "   stripe listen --events=payment_intent.succeeded,invoice.payment_succeeded"
echo ""

# View recent payments
echo "💳 Step 3: View Recent Payments"
echo "Run these commands to see payments with metadata:"
echo ""
echo "# View recent payment intents:"
echo "   stripe payment_intents list --limit=5"
echo ""
echo "# View specific payment intent with metadata:"
echo "   stripe payment_intents retrieve pi_XXXXXX"
echo ""
echo "# View recent invoices (for subscriptions):"
echo "   stripe invoices list --limit=5"
echo ""

# Create test data
echo "🧪 Step 4: Create Test Payments"
echo "To test the metadata, make payments through your app:"
echo ""
echo "1. Wishlist Contribution:"
echo "   - Go to any creator's wishlist"
echo "   - Make a contribution payment"
echo "   - Check metadata in Stripe Dashboard"
echo ""
echo "2. Shop Purchase:"
echo "   - Go to any creator's shop"  
echo "   - Purchase an item"
echo "   - Check metadata in Stripe Dashboard"
echo ""
echo "3. Membership Subscription:"
echo "   - Subscribe to a creator's membership"
echo "   - Check metadata in Stripe Dashboard"
echo ""

echo "📊 Step 5: View Metadata in Dashboard"
echo "1. Go to https://dashboard.stripe.com"
echo "2. Click 'Payments' or 'Customers' → 'Subscriptions'"
echo "3. Click on any payment/subscription"
echo "4. Scroll down to see 'Metadata' section"
echo ""

echo "📋 Expected Metadata Fields:"
echo "  - platform: 'SpennyPiggy'"
echo "  - environment: 'production' or 'staging'"
echo "  - purpose: 'Wishlist Item Contribution Payment'"
echo "  - buyer_name: 'John Smith'"  
echo "  - creator_name: 'Jane Doe'"
echo "  - transaction_description: 'Wishlist contribution for Gaming Setup'"
echo "  - And 15+ more fields..."
echo ""

echo "🎯 Ready to test! Follow the steps above to see your enhanced metadata."
