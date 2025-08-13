# CDN Configuration Guide

This guide covers setting up CDN (Content Delivery Network) for optimal performance with AWS CloudFront and Cloudflare options.

## 🚀 AWS CloudFront Setup (Recommended for Vapor)

Since you're using Laravel Vapor (AWS Lambda), CloudFront integration is highly recommended.

### 1. Create CloudFront Distribution

```bash
# Install AWS CLI if not installed
aws configure

# Create CloudFront distribution (via AWS Console or CLI)
```

**CloudFront Distribution Settings:**

```json
{
  "CallerReference": "spennypiggy-cdn-2024",
  "Comment": "SpennyPiggy CDN Distribution",
  "DefaultRootObject": "index.html",
  "Origins": [
    {
      "Id": "vapor-origin",
      "DomainName": "your-vapor-domain.vapor-farm-e1.com",
      "CustomOriginConfig": {
        "HTTPPort": 443,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": ["TLSv1.2"]
      }
    },
    {
      "Id": "s3-static-origin",
      "DomainName": "your-s3-bucket.s3.amazonaws.com",
      "S3OriginConfig": {
        "OriginAccessIdentity": "origin-access-identity/cloudfront/YOUR-OAI-ID"
      }
    }
  ],
  "DefaultCacheBehavior": {
    "TargetOriginId": "vapor-origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
    "CachedMethods": ["GET", "HEAD", "OPTIONS"],
    "ForwardedValues": {
      "QueryString": true,
      "Headers": ["Host", "Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
    },
    "TrustedSigners": {
      "Enabled": false
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400,
    "Compress": true
  },
  "CacheBehaviors": [
    {
      "PathPattern": "/css/*",
      "TargetOriginId": "s3-static-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": ["GET", "HEAD"],
      "CachedMethods": ["GET", "HEAD"],
      "ForwardedValues": {
        "QueryString": false
      },
      "MinTTL": 31536000,
      "DefaultTTL": 31536000,
      "MaxTTL": 31536000,
      "Compress": true
    },
    {
      "PathPattern": "/js/*",
      "TargetOriginId": "s3-static-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": ["GET", "HEAD"],
      "CachedMethods": ["GET", "HEAD"],
      "ForwardedValues": {
        "QueryString": false
      },
      "MinTTL": 31536000,
      "DefaultTTL": 31536000,
      "MaxTTL": 31536000,
      "Compress": true
    },
    {
      "PathPattern": "/images/*",
      "TargetOriginId": "s3-static-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": ["GET", "HEAD"],
      "CachedMethods": ["GET", "HEAD"],
      "ForwardedValues": {
        "QueryString": false
      },
      "MinTTL": 2592000,
      "DefaultTTL": 2592000,
      "MaxTTL": 31536000,
      "Compress": true
    },
    {
      "PathPattern": "/fonts/*",
      "TargetOriginId": "s3-static-origin",
      "ViewerProtocolPolicy": "redirect-to-https",
      "AllowedMethods": ["GET", "HEAD"],
      "CachedMethods": ["GET", "HEAD"],
      "ForwardedValues": {
        "QueryString": false,
        "Headers": ["Origin", "Access-Control-Request-Method", "Access-Control-Request-Headers"]
      },
      "MinTTL": 31536000,
      "DefaultTTL": 31536000,
      "MaxTTL": 31536000,
      "Compress": true
    }
  ],
  "Enabled": true,
  "PriceClass": "PriceClass_All",
  "HttpVersion": "http2",
  "IsIPV6Enabled": true
}
```

### 2. S3 Bucket for Static Assets

Create an S3 bucket for static assets:

```bash
# Create S3 bucket
aws s3 mb s3://spennypiggy-static-assets

# Enable static website hosting
aws s3 website s3://spennypiggy-static-assets --index-document index.html

# Set bucket policy for CloudFront access
```

**Bucket Policy:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity YOUR-OAI-ID"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::spennypiggy-static-assets/*"
    }
  ]
}
```

### 3. Upload Script for Static Assets

Create a deployment script:

```bash
#!/bin/bash
# Deploy static assets to S3

echo "📦 Building assets..."
npm run build

echo "🚀 Uploading to S3..."

# CSS files with 1-year cache
aws s3 sync public/build/assets/ s3://spennypiggy-static-assets/css/ \
  --include "*.css" \
  --cache-control "public, max-age=31536000, immutable" \
  --content-encoding gzip

# JS files with 1-year cache
aws s3 sync public/build/assets/ s3://spennypiggy-static-assets/js/ \
  --include "*.js" \
  --cache-control "public, max-age=31536000, immutable" \
  --content-encoding gzip

# Images with 30-day cache
aws s3 sync public/images/ s3://spennypiggy-static-assets/images/ \
  --cache-control "public, max-age=2592000" \
  --content-encoding gzip

# Fonts with 1-year cache and CORS
aws s3 sync public/fonts/ s3://spennypiggy-static-assets/fonts/ \
  --cache-control "public, max-age=31536000" \
  --content-encoding gzip

echo "🔄 Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR-DISTRIBUTION-ID \
  --paths "/*"

echo "✅ Deploy complete!"
```

## 🌟 Cloudflare Alternative Setup

If you prefer Cloudflare:

### 1. Add Domain to Cloudflare

1. Sign up at [Cloudflare](https://www.cloudflare.com)
2. Add your domain `spennypiggy.co`
3. Update DNS records to point to your Vapor deployment

### 2. Cloudflare Configuration

**Page Rules:**
```
spennypiggy.co/css/*
- Browser Cache TTL: 1 year
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year

spennypiggy.co/js/*
- Browser Cache TTL: 1 year
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year

spennypiggy.co/images/*
- Browser Cache TTL: 1 month
- Cache Level: Cache Everything
- Edge Cache TTL: 1 year
- Polish: Lossless

spennypiggy.co/api/*
- Cache Level: Bypass

spennypiggy.co/*
- Browser Cache TTL: 4 hours
- Cache Level: Standard
```

**Speed Settings:**
- Auto Minify: CSS, JavaScript, HTML ✅
- Brotli: ✅
- HTTP/2: ✅
- HTTP/3 (with QUIC): ✅
- 0-RTT Connection Resumption: ✅

**Image Optimization:**
- Polish: Lossless
- Mirage: ✅
- WebP: ✅

## 🔧 Vapor Integration

Update your `vapor.yml` to work with CDN:

```yaml
id: 54327
name: SpennyPiggy
environments:
  production:
    # ... existing config
    variables:
      CDN_URL: "https://d1234567890.cloudfront.net"
      ASSET_URL: "${CDN_URL}"
      MIX_ASSET_URL: "${CDN_URL}"
    
    build:
      - "composer install --no-dev"
      - "php artisan event:cache"
      - "php artisan config:cache"
      - "php artisan route:cache"
      - "npm ci"
      - "npm run build"
      - "./scripts/deploy-to-s3.sh" # Upload assets to S3
      - "rm -rf node_modules"
    
    deploy:
      - "php artisan migrate --force"
```

## 📊 Performance Testing

After setup, test your CDN performance:

```bash
# Test asset loading speed
curl -w "@curl-format.txt" -o /dev/null -s "https://spennypiggy.co/css/app.css"

# Test image optimization
curl -H "Accept: image/webp" "https://spennypiggy.co/images/hero.jpg"

# Test Brotli compression
curl -H "Accept-Encoding: br" "https://spennypiggy.co/js/app.js"
```

## 🎯 Expected Performance Gains

With proper CDN setup, expect:

- **50-80% faster asset loading** globally
- **Reduced server load** on Vapor functions
- **Better Core Web Vitals** scores
- **Improved SEO** rankings
- **Lower bandwidth costs**

## 🚨 Important Notes

1. **Cache Invalidation**: Always invalidate CDN cache after deployments
2. **CORS Headers**: Ensure fonts and API responses include proper CORS headers
3. **SSL/TLS**: Use HTTPS everywhere for HTTP/2 benefits
4. **Monitoring**: Set up CloudWatch/Cloudflare Analytics for monitoring
5. **Cost Optimization**: Use appropriate cache TTLs to minimize origin requests

## 🔍 Troubleshooting

**Common Issues:**

1. **CORS Errors**: Add proper CORS headers in .htaccess
2. **Cache Not Working**: Check TTL settings and cache headers
3. **Images Not Loading**: Verify S3 bucket permissions
4. **Slow API Responses**: Ensure API routes bypass CDN cache

**Debug Commands:**
```bash
# Check cache headers
curl -I "https://spennypiggy.co/css/app.css"

# Test Brotli support
curl -H "Accept-Encoding: br" -v "https://spennypiggy.co/"

# Verify HTTP/2
curl -I --http2 "https://spennypiggy.co/"
```
