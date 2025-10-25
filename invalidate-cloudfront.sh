#!/bin/bash

# Manual CloudFront Invalidation Script
# Run this after deployment to clear the robots.txt cache

echo "🚀 Invalidating CloudFront cache for robots.txt..."

# Method 1: Via AWS CLI (if available)
if command -v aws &> /dev/null; then
    echo "📡 Using AWS CLI..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id E3J6V2XLVQJ2FX \
        --paths "/robots.txt" \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ "$INVALIDATION_ID" != "None" ] && [ "$INVALIDATION_ID" != "" ]; then
        echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
        echo "🕐 Cache should be cleared within 5-15 minutes"
        echo "📊 Check status: aws cloudfront get-invalidation --distribution-id E3J6V2XLVQJ2FX --id $INVALIDATION_ID"
    else
        echo "❌ Failed to create invalidation via AWS CLI"
    fi
else
    echo "⚠️  AWS CLI not found. Please invalidate manually:"
    echo "   1. Go to AWS CloudFront Console"
    echo "   2. Select distribution: E3J6V2XLVQJ2FX"
    echo "   3. Go to Invalidations tab"
    echo "   4. Create invalidation for path: /robots.txt"
    echo "   5. Wait for completion (5-15 minutes)"
fi

echo ""
echo "🔍 Test after invalidation:"
echo "   curl -i https://spennypiggy.co/robots.txt"
echo ""
echo "💡 Expected result:"
echo "   - HTTP/2 200 (not 302)"
echo "   - Content-Type: text/plain; charset=UTF-8"
echo "   - No redirect to CloudFront"
echo ""