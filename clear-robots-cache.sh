#!/bin/bash

# Clear robots.txt cache specifically
# Update this with your actual CloudFront distribution ID

CLOUDFRONT_DISTRIBUTION_ID="YOUR-DISTRIBUTION-ID"  # Update this with actual ID

if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "YOUR-DISTRIBUTION-ID" ]; then
    echo "🚀 Invalidating robots.txt cache on CloudFront..."
    
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/robots.txt" \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ "$INVALIDATION_ID" != "None" ]; then
        echo "✅ CloudFront invalidation created: $INVALIDATION_ID"
        echo "ℹ️  Check status with: aws cloudfront get-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --id $INVALIDATION_ID"
        echo "🕐 Cache should be cleared within 5-15 minutes"
    else
        echo "❌ Failed to create CloudFront invalidation"
        exit 1
    fi
else
    echo "❌ Please update CLOUDFRONT_DISTRIBUTION_ID in this script with your actual CloudFront distribution ID"
    echo "💡 You can find it in your AWS CloudFront console or from the URL: d352qugnflhnxw.cloudfront.net"
    echo "   The distribution ID would be similar to: ABCDEFGHIJKLMN"
    exit 1
fi

echo ""
echo "📝 Note: After cache invalidation, test with:"
echo "   curl -i https://spennypiggy.co/robots.txt"
echo ""