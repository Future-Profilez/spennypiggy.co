# Step 15: Deployment & Environment Configuration

## .env Environment Variables Requirements

### Core Application Settings
```env
APP_NAME=SpennyPiggy
APP_ENV=production
APP_KEY=base64:your-app-key-here
APP_DEBUG=false
APP_URL=https://spennypiggy.co

# Timezone & Locale
APP_TIMEZONE=UTC
APP_LOCALE=en
```

### Database Configuration
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=spennypiggy
DB_USERNAME=your_db_user
DB_PASSWORD=your_db_password
```

### Cache & Session
```env
CACHE_DRIVER=redis
SESSION_DRIVER=redis
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null
```

### Queue Configuration
```env
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379
REDIS_QUEUE=default
```

### Mail Configuration
```env
MAIL_MAILER=smtp
MAIL_HOST=your-smtp-host
MAIL_PORT=587
MAIL_USERNAME=your-mail-username
MAIL_PASSWORD=your-mail-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@spennypiggy.co
MAIL_FROM_NAME="${APP_NAME}"
```

### AWS S3 Configuration
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=your-s3-bucket
AWS_USE_PATH_STYLE_ENDPOINT=false
```

### Payment Gateway (Stripe)
```env
STRIPE_KEY=pk_live_your_stripe_public_key
STRIPE_SECRET=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Third-Party Services
```env
# Twitter API v2
TWITTER_CLIENT_ID=your-twitter-client-id
TWITTER_CLIENT_SECRET=your-twitter-client-secret

# Other Services
UPLOADCARE_PUBLIC_KEY=your-uploadcare-public-key
UPLOADCARE_SECRET_KEY=your-uploadcare-secret-key
```

## Laravel Vapor Configuration

### Vapor CLI Setup
- **Package Installed**: `laravel/vapor-cli` and `laravel/vapor-core` are included in composer.json
- **Vapor Ready**: Application is configured for Laravel Vapor deployment

### Vapor Configuration (vapor.yml)
```yaml
id: 54327
name: SpennyPiggy
environments:
  development:
    memory: 2048
    queue-memory: 1024
    cli-memory: 512
    timeout: 30
    runtime: "php-8.2:al2"
    domain: dev.spennypiggy.co
    database: spennypiggy-db-dev
    
  production:
    memory: 3008
    queue-memory: 2048
    cli-memory: 2048
    warm: 10
    gateway-version: 2
    timeout: 30
    cache: spennypiggy-cache
    runtime: "php-8.2:al2"
    domain: spennypiggy.co
    database: spennypiggy-db
    database-proxy: true
```

### Vapor Build Commands
```bash
# Development Build
- "composer install --no-dev"
- "php artisan event:cache"
- "php artisan optimize:clear"
- "php artisan config:cache"
- "npm ci"
- "npm run build"
- "rm -rf node_modules"

# Production Build (Additional)
- "php artisan route:cache"

# Deploy Commands
- "php artisan migrate --force"
```

## Docker/Sail Options

### Laravel Sail Support
- **Package Available**: `laravel/sail` is included in dev dependencies
- **Current Status**: No docker-compose.yml or Dockerfile found in project root
- **Recommendation**: Sail can be published if Docker development is needed

### Setting up Sail (if needed)
```bash
# Publish Sail files
php artisan sail:install

# Start Sail environment
./vendor/bin/sail up -d

# Run commands through Sail
./vendor/bin/sail artisan migrate
./vendor/bin/sail npm run dev
```

## Asset Compilation

### Build Configuration
```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  }
}
```

### Vite Configuration (vite.config.js)
```javascript
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }), 
        react(), 
        sentryVitePlugin({
            org: "spenny-piggy",
            project: "javascript-react"
        })
    ],
    build: {
        sourcemap: true
    }
});
```

### Build Commands
```bash
# Development build
npm run dev

# Production build
npm run build

# Install dependencies
npm ci  # For production (faster, uses lock file)
npm install  # For development
```

### Assets Management
- **Frontend**: React with Vite bundler
- **CSS**: Tailwind CSS configured
- **Build Output**: Assets compiled to `public/build/`
- **Sourcemaps**: Enabled for production debugging

## Queue Workers

### Queue Configuration
- **Default Driver**: Redis (configurable via `QUEUE_CONNECTION`)
- **Available Drivers**: sync, database, redis, beanstalkd, sqs
- **Queue Tables**: `jobs`, `job_batches`, `failed_jobs`

### Queue Worker Commands
```bash
# Start queue worker
php artisan queue:work

# Start queue worker with specific connection
php artisan queue:work redis

# Process specific queue
php artisan queue:work --queue=high,default

# Supervisor configuration for production
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
```

### Queue Monitoring
```bash
# View failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all

# Clear failed jobs
php artisan queue:flush
```

## Cron Jobs & Scheduled Tasks

### Current Scheduled Commands (app/Console/Kernel.php)
```php
protected function schedule(Schedule $schedule)
{
    // Exchange rate sync - hourly
    $schedule->command("app:sync-exchange-rate")
            ->hourly()
            ->withoutOverlapping(4);

    // Auto suspend accounts - daily
    $schedule->command("app:auto-suspend-account")
            ->daily()
            ->withoutOverlapping(4);

    // Notification system - environment dependent
    if (in_array($appUrl, ['https://dev.spennypiggy.co', 'http://127.0.0.1:8000'])) {
        $schedule->command('app:notifications-pending-approval')
                ->daily()
                ->withoutOverlapping(4);
    } elseif ($appUrl == 'https://spennypiggy.co') {
        $schedule->command('app:notifications-pending-approval')
                ->everyThirtyMinutes()
                ->withoutOverlapping(4);
    }
}
```

### Production Cron Setup
```bash
# Add to crontab
* * * * * cd /path-to-your-project && php artisan schedule:run >> /dev/null 2>&1

# For Vapor deployment, use Vapor's scheduled tasks feature instead
```

## SSL & Webhook Endpoints

### SSL Configuration
- **Production Domain**: `spennypiggy.co` (configured in vapor.yml)
- **Development Domain**: `dev.spennypiggy.co`
- **SSL Handling**: Managed by AWS CloudFront (Vapor)

### Webhook Endpoints
```php
// Stripe Webhook Handler (StripeWebhookController.php)
Route::post('/stripe/webhook', [StripeWebhookController::class, 'handleWebhook']);

// Required environment variables
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### Webhook Security
- Webhook signature verification implemented
- CSRF protection bypassed for webhook routes
- IP whitelisting recommended for production

### SSL/TLS Requirements
- **HTTPS Only**: Force HTTPS in production
- **HSTS Headers**: Recommended for security
- **Mixed Content**: Ensure all assets use HTTPS

## Production PWA Considerations

### PWA Configuration
- **Package**: `silviolleite/laravelpwa` installed
- **Service Worker**: Multiple service workers configured
- **Manifest**: Web app manifest configured

### PWA Files Structure
```html
<!-- Manifest -->
<link rel="manifest" href="{{ url('/manifest.json')}}" />

<!-- Service Workers -->
<script type="text/javascript" src="{{ url('/service-worker.js') }}"></script>
<script>
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/new-service-worker.js')
}
</script>
```

### PWA Meta Tags (Implemented)
```html
<!-- iOS Support -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Spenny Piggy">

<!-- Android Support -->
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="theme-color" content="#05EFB8" />

<!-- Windows Support -->
<meta name="msapplication-TileColor" content="#05EFB8" />
<meta name="msapplication-TileImage" content="...">
```

### PWA Production Checklist
- [ ] **HTTPS Required**: PWA only works over HTTPS
- [ ] **Service Worker**: Properly configured and cached
- [ ] **Manifest**: Valid web app manifest
- [ ] **Icons**: Multiple sizes for different devices
- [ ] **Splash Screens**: Configured for iOS devices
- [ ] **Offline Support**: Service worker handles offline scenarios
- [ ] **Push Notifications**: MagicBell integration configured

### Performance Optimizations
- **Asset Caching**: Vite builds include cache headers
- **CDN**: AWS CloudFront distribution via Vapor
- **Compression**: Gzip/Brotli compression enabled
- **Image Optimization**: Uploadcare integration for image processing

## Environment-Specific Configurations

### Development
```env
APP_ENV=local
APP_DEBUG=true
VAPOR_ENVIRONMENT=development
```

### Staging
```env
APP_ENV=staging
APP_DEBUG=false
VAPOR_ENVIRONMENT=development
```

### Production
```env
APP_ENV=production
APP_DEBUG=false
VAPOR_ENVIRONMENT=production
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Assets compiled (`npm run build`)
- [ ] Vapor configuration updated
- [ ] SSL certificates configured
- [ ] Webhook endpoints tested

### Post-Deployment
- [ ] Queue workers running
- [ ] Cron jobs scheduled
- [ ] Cache warmed up
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Error tracking active (Sentry)

### Monitoring & Maintenance
- [ ] Database performance monitoring
- [ ] Queue worker monitoring
- [ ] Error rate monitoring
- [ ] SSL certificate expiry monitoring
- [ ] PWA functionality testing
- [ ] Regular security updates

This configuration supports both traditional server deployment and serverless deployment via Laravel Vapor, with comprehensive PWA support and production-ready optimizations.
