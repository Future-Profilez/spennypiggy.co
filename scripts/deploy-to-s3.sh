#!/bin/bash

# Deploy static assets to S3 and invalidate CloudFront
# Usage: ./scripts/deploy-to-s3.sh [environment]

set -e

# Configuration
ENVIRONMENT=${1:-production}
S3_BUCKET="spennypiggy-static-assets"
CLOUDFRONT_DISTRIBUTION_ID="YOUR-DISTRIBUTION-ID" # Replace with actual ID

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    log_error "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    log_error "AWS credentials not configured. Run 'aws configure' first."
    exit 1
fi

log_info "Starting deployment to S3 for environment: $ENVIRONMENT"

# Build assets first
log_info "Building assets..."
npm run build

# Check if build directory exists
if [ ! -d "public/build" ]; then
    log_error "Build directory not found. Make sure 'npm run build' completed successfully."
    exit 1
fi

# Create gzipped versions of CSS and JS files
log_info "Creating compressed versions..."
find public/build -name "*.css" -o -name "*.js" | while read file; do
    if [ ! -f "$file.gz" ] || [ "$file" -nt "$file.gz" ]; then
        gzip -c "$file" > "$file.gz"
        log_info "Compressed: $(basename "$file")"
    fi
done

# Upload CSS files with 1-year cache and immutable
log_info "Uploading CSS files..."
aws s3 sync public/build/assets/ s3://$S3_BUCKET/css/ \
    --include "*.css" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "text/css" \
    --metadata-directive REPLACE \
    --delete \
    --size-only || {
    log_error "Failed to upload CSS files"
    exit 1
}

# Upload gzipped CSS files
aws s3 sync public/build/assets/ s3://$S3_BUCKET/css/ \
    --include "*.css.gz" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "text/css" \
    --content-encoding "gzip" \
    --metadata-directive REPLACE || {
    log_warning "Failed to upload gzipped CSS files"
}

# Upload JS files with 1-year cache and immutable
log_info "Uploading JavaScript files..."
aws s3 sync public/build/assets/ s3://$S3_BUCKET/js/ \
    --include "*.js" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "application/javascript" \
    --metadata-directive REPLACE \
    --delete \
    --size-only || {
    log_error "Failed to upload JS files"
    exit 1
}

# Upload gzipped JS files
aws s3 sync public/build/assets/ s3://$S3_BUCKET/js/ \
    --include "*.js.gz" \
    --cache-control "public, max-age=31536000, immutable" \
    --content-type "application/javascript" \
    --content-encoding "gzip" \
    --metadata-directive REPLACE || {
    log_warning "Failed to upload gzipped JS files"
}

# Upload images with 30-day cache
if [ -d "public/images" ]; then
    log_info "Uploading images..."
    aws s3 sync public/images/ s3://$S3_BUCKET/images/ \
        --cache-control "public, max-age=2592000" \
        --metadata-directive REPLACE \
        --size-only \
        --exclude "*.tmp" \
        --exclude "*.DS_Store" || {
        log_warning "Failed to upload some images"
    }
fi

# Upload fonts with 1-year cache and CORS headers
if [ -d "public/fonts" ]; then
    log_info "Uploading fonts..."
    aws s3 sync public/fonts/ s3://$S3_BUCKET/fonts/ \
        --cache-control "public, max-age=31536000" \
        --metadata-directive REPLACE \
        --size-only || {
        log_warning "Failed to upload fonts"
    }
fi

# 🚨 THE SERVICE WORKER IS NOT AN S3 ASSET AND MUST NOT BE UPLOADED HERE.
#
# A worker only controls the origin it is served from, so a copy on the CDN can
# never control spennypiggy.co — and `scripts/build-sw.js` no longer writes
# `public/service-worker.js` at all. The app serves it from the `service.worker`
# route (reading `resources/proxy/service-worker.js`), which is also the only way
# it gets a `Cache-Control` a browser will respect for a worker script.
#
# This block was a `[ -f ... ]` guard around a file that stopped existing, so it
# logged nothing and did nothing while reading like a working deploy step.

# Upload manifest.json and other PWA files
if [ -f "public/manifest.json" ]; then
    log_info "Uploading PWA files..."
    aws s3 cp public/manifest.json s3://$S3_BUCKET/manifest.json \
        --cache-control "public, max-age=86400" \
        --content-type "application/json" \
        --metadata-directive REPLACE || {
        log_warning "Failed to upload manifest.json"
    }
fi

# Set CORS configuration for the bucket
log_info "Setting CORS configuration..."
cat > /tmp/cors.json << EOF
{
    "CORSRules": [
        {
            "AllowedOrigins": ["https://spennypiggy.co", "https://*.spennypiggy.co"],
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "HEAD"],
            "MaxAgeSeconds": 3000
        }
    ]
}
EOF

aws s3api put-bucket-cors \
    --bucket $S3_BUCKET \
    --cors-configuration file:///tmp/cors.json || {
    log_warning "Failed to set CORS configuration"
}

rm -f /tmp/cors.json

# Invalidate CloudFront cache
if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "YOUR-DISTRIBUTION-ID" ]; then
    log_info "Invalidating CloudFront cache..."
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id $CLOUDFRONT_DISTRIBUTION_ID \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ "$INVALIDATION_ID" != "None" ]; then
        log_success "CloudFront invalidation created: $INVALIDATION_ID"
        log_info "You can check the status with: aws cloudfront get-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --id $INVALIDATION_ID"
    else
        log_warning "Failed to create CloudFront invalidation"
    fi
else
    log_warning "CloudFront distribution ID not configured. Please update CLOUDFRONT_DISTRIBUTION_ID in this script."
fi

# Generate deployment report
TOTAL_SIZE=$(aws s3 ls s3://$S3_BUCKET --recursive --human-readable --summarize | grep "Total Size" | awk '{print $3, $4}')
TOTAL_OBJECTS=$(aws s3 ls s3://$S3_BUCKET --recursive --summarize | grep "Total Objects" | awk '{print $3}')

log_success "Deployment completed successfully!"
echo ""
echo "📊 Deployment Summary:"
echo "  • Environment: $ENVIRONMENT"
echo "  • S3 Bucket: s3://$S3_BUCKET"
echo "  • Total Objects: $TOTAL_OBJECTS"
echo "  • Total Size: $TOTAL_SIZE"
echo "  • CloudFront: ${CLOUDFRONT_DISTRIBUTION_ID}"
echo ""
echo "🌐 Your assets are now available via CDN!"
echo "🔍 Test your deployment:"
echo "  curl -I https://d1234567890.cloudfront.net/css/app.css"
echo "  curl -I https://d1234567890.cloudfront.net/js/app.js"

# Cleanup
rm -f public/build/assets/*.gz

log_success "All done! 🎉"
