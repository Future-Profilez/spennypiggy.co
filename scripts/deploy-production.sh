#!/bin/bash

# Production Deployment Script for Spenny Piggy
# This script handles the deployment of fixes from development to production

set -e

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

log_info "🚀 Starting production deployment..."

# 1. Copy production environment
log_info "Setting up production environment..."
if [ -f ".env.production" ]; then
    cp .env.production .env
    log_success "Production environment configured"
else
    log_error ".env.production file not found!"
    exit 1
fi

# 2. Install dependencies (production optimized)
log_info "Installing dependencies..."
composer install --optimize-autoloader --no-dev --no-interaction
npm ci --only=production

# 3. Clear all Laravel caches
log_info "Clearing Laravel caches..."
php artisan config:clear
php artisan view:clear
php artisan cache:clear
php artisan route:clear

# 4. Build production assets
log_info "Building production assets..."
npm run build

# 5. Optimize Laravel for production
log_info "Optimizing Laravel..."
php artisan config:cache
php artisan view:cache
php artisan route:cache

# 6. Run database migrations (if needed)
if [ "$1" = "--migrate" ]; then
    log_warning "Running database migrations..."
    php artisan migrate --force
fi

# 7. Create storage link if missing
log_info "Ensuring storage link exists..."
php artisan storage:link

# 8. Fix file permissions
log_info "Setting correct file permissions..."
chmod -R 755 storage bootstrap/cache
chmod -R 775 storage/logs storage/framework

# 9. Deploy to Laravel Vapor (if configured)
if command -v vapor &> /dev/null; then
    log_info "Deploying to Laravel Vapor..."
    php vendor/bin/vapor deploy production
else
    log_warning "Laravel Vapor not found, skipping cloud deployment"
fi

# 10. Deploy static assets to S3/CloudFront (if configured)
if [ -f "scripts/deploy-to-s3.sh" ]; then
    log_info "Deploying static assets to CDN..."
    ./scripts/deploy-to-s3.sh production
else
    log_warning "S3 deployment script not found, skipping CDN deployment"
fi

log_success "🎉 Production deployment completed successfully!"

echo ""
echo "📋 Post-deployment checklist:"
echo "  ✅ Update .env.production with real database credentials"
echo "  ✅ Update .env.production with real API keys"
echo "  ✅ Test the application: https://spennypiggy.co"
echo "  ✅ Check error logs: php artisan logs"
echo "  ✅ Monitor Sentry for any runtime errors"
echo ""
echo "🔧 If you encounter MIME type errors:"
echo "  • Check server configuration (Nginx/Apache)"
echo "  • Verify Content-Type headers"
echo "  • Clear browser cache"
echo "  • Check CDN cache invalidation"
