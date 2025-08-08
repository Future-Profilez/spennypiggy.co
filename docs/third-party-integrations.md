# Third-Party Integrations

This document provides comprehensive setup and configuration instructions for all third-party services integrated into the Spenny Piggy platform.

## Table of Contents
- [Stripe Payment Processing](#stripe-payment-processing)
- [Twitter/X OAuth2 Integration](#twitterx-oauth2-integration)
- [Uploadcare CDN & File Management](#uploadcare-cdn--file-management)
- [MagicBell Notifications](#magicbell-notifications)
- [IPInfo Geolocation](#ipinfo-geolocation)
- [OpenAI DALL·E Image Generation](#openai-dalle-image-generation)
- [HCaptcha Security](#hcaptcha-security)

---

## Stripe Payment Processing

Stripe serves as the primary payment processor for handling creator payments, subscriptions, and marketplace functionality.

### Configuration

#### Environment Variables
```bash
# Core Stripe Configuration
STRIPE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: Stripe Connect for marketplace functionality
STRIPE_CLIENT_ID=ca_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'stripe' => [
    'key' => env('STRIPE_KEY'),
    'secret' => env('STRIPE_SECRET_KEY'),
    'webhook_secret' => env('STRIPE_WEBHOOK_SECRET'),
    'client_id' => env('STRIPE_CLIENT_ID'),
],
```

### Features Implemented
- **Payment Processing**: One-time payments and subscriptions
- **Stripe Connect**: Marketplace functionality for creator payouts
- **Webhook Handling**: Real-time payment status updates
- **Customer Management**: Automated customer creation and management
- **Account Verification**: KYC/compliance checking for creators

### Implementation Files
- `app/StripeControl.php` - Core Stripe functionality wrapper
- `app/Http/Controllers/StripeWebhookController.php` - Webhook handler
- `app/Http/Controllers/Auth/StripeController.php` - Frontend integration

### Setup Instructions
1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Obtain API keys from the Stripe dashboard
3. Configure webhook endpoints in Stripe dashboard:
   - Endpoint URL: `https://yourdomain.com/stripe/webhook`
   - Events to listen for: `payment_intent.succeeded`, `invoice.payment_succeeded`, `customer.subscription.updated`
4. Set up Stripe Connect for marketplace functionality (if required)

---

## Twitter/X OAuth2 Integration

Enables creators to connect their Twitter/X accounts for social media automation and profile synchronization.

### Configuration

#### Environment Variables
```bash
# Twitter API v2 OAuth2 Configuration
TWITTER_CONSUMER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_CONSUMER_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OAuth2 Redirect URLs
TWITTER_REDIRECT_URL=https://yourdomain.com/auth/twitter/callback
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'twitter' => [
    'consumer_key' => env('TWITTER_CONSUMER_KEY'),
    'consumer_secret' => env('TWITTER_CONSUMER_SECRET'),
    'bearer_token' => env('TWITTER_BEARER_TOKEN'),
    'redirect_url' => env('TWITTER_REDIRECT_URL'),
],
```

### Features Implemented
- **OAuth2 Authentication**: Secure Twitter account linking
- **Automatic Posting**: Share gift notifications and updates
- **Profile Synchronization**: Import Twitter profile data
- **Media Upload**: Share images with tweets
- **Token Management**: Automatic token refresh handling

### Implementation Files
- `app/TwitterAuthService.php` - Core Twitter OAuth2 service
- `app/Http/Controllers/Auth/TwitterController.php` - Authentication controller
- `app/Models/TwitterToken.php` - Token storage model

### Setup Instructions
1. Create a Twitter Developer account at [developer.twitter.com](https://developer.twitter.com)
2. Create a new App in the Twitter Developer Portal
3. Configure OAuth2 settings:
   - App permissions: Read and Write
   - Callback URLs: Add your redirect URL
   - Website URL: Your main domain
4. Generate API keys and bearer token
5. Set required scopes: `tweet.read`, `users.read`, `tweet.write`, `offline.access`

### OAuth2 Flow
1. Generate authorization URL with PKCE challenge
2. Redirect user to Twitter for authorization
3. Handle callback with authorization code
4. Exchange code for access/refresh tokens
5. Store tokens securely for future use

---

## Uploadcare CDN & File Management

Uploadcare handles file uploads, processing, and CDN delivery for images and videos.

### Configuration

#### Environment Variables
```bash
# Uploadcare Configuration
UPLOADCARE_PUBLIC_KEY=demopublickey
UPLOADCARE_SECRET_KEY=demosecretkey
UPLOADCARE_HOST=https://api.uploadcare.com/

# Optional: Additional settings
UPLOADCARE_SIGNED_UPLOADS=true
UPLOADCARE_AUTO_STORE=true
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'uploadcare' => [
    'public_key' => env('UPLOADCARE_PUBLIC_KEY'),
    'secret_key' => env('UPLOADCARE_SECRET_KEY'),
    'host' => env('UPLOADCARE_HOST', 'https://api.uploadcare.com/'),
    'signed_uploads' => env('UPLOADCARE_SIGNED_UPLOADS', false),
    'auto_store' => env('UPLOADCARE_AUTO_STORE', true),
],
```

### Features Implemented
- **File Upload**: Secure file upload with virus scanning
- **Image Processing**: Real-time image transformations
- **Video Processing**: Video conversion and thumbnail generation
- **CDN Delivery**: Global content delivery network
- **Secure URLs**: Time-limited secure file URLs
- **Watermarking**: Automatic watermark application

### CDN Modifiers
Uploadcare provides powerful URL-based transformations:

#### Image Transformations
```
https://ucarecdn.com/{uuid}/-/resize/800x600/
https://ucarecdn.com/{uuid}/-/crop/500x500/center/
https://ucarecdn.com/{uuid}/-/quality/smart_retina/
https://ucarecdn.com/{uuid}/-/format/webp/
```

#### Video Transformations
```
https://ucarecdn.com/{uuid}/video/-/quality/best/
https://ucarecdn.com/{uuid}/video/-/size/1280x720/
https://ucarecdn.com/{uuid}/video/-/cut/0:10/1:30/
```

#### Security Modifiers
```
https://ucarecdn.com/{uuid}/-/auth/{token}/{expire}/
```

### Implementation Files
- `app/Uploadcare.php` - Core Uploadcare service wrapper
- Frontend upload widgets integrated in React components

### Setup Instructions
1. Create an Uploadcare account at [uploadcare.com](https://uploadcare.com)
2. Create a new project in the Uploadcare dashboard
3. Obtain public and secret keys
4. Configure file processing rules in the dashboard
5. Set up webhooks for file processing notifications (optional)

---

## MagicBell Notifications

MagicBell provides real-time, multi-channel notification delivery system.

### Configuration

#### Environment Variables
```bash
# MagicBell Configuration
MAGICBELL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAGICBELL_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAGICBELL_API_URL=https://api.magicbell.com

# Optional: Project configuration
MAGICBELL_PROJECT_ID=your-project-id
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'magicbell' => [
    'api_key' => env('MAGICBELL_API_KEY'),
    'api_secret' => env('MAGICBELL_API_SECRET'),
    'api_url' => env('MAGICBELL_API_URL', 'https://api.magicbell.com'),
    'project_id' => env('MAGICBELL_PROJECT_ID'),
],
```

### Features Implemented
- **Multi-Channel Delivery**: In-app, email, and push notifications
- **User Preferences**: Configurable notification preferences
- **Real-time Updates**: WebSocket-based real-time delivery
- **Analytics**: Engagement and delivery tracking
- **Template Management**: Custom notification templates

### Notification Types
- **Gift Notifications**: New gift received alerts
- **Payment Updates**: Payment success/failure notifications
- **Social Activity**: Follower and engagement notifications
- **System Alerts**: Account and security notifications

### Implementation Files
- `app/Services/MagicBellService.php` - Core notification service
- `app/Http/Controllers/NotificationController.php` - Notification management

### Setup Instructions
1. Create a MagicBell account at [magicbell.com](https://magicbell.com)
2. Create a new project in the MagicBell dashboard
3. Obtain API keys from the project settings
4. Configure notification channels (email, push, in-app)
5. Set up webhook URLs for delivery status updates
6. Integrate MagicBell React components in your frontend

### API Usage Examples
```php
// Send notification
$magicbell = new MagicBellService();
$magicbell->sendNotification(
    'New Gift Received!',
    'You received a $25 gift from John Doe',
    'user@example.com'
);
```

---

## IPInfo Geolocation

IPInfo provides IP-based geolocation and threat intelligence services.

### Configuration

#### Environment Variables
```bash
# IPInfo Configuration
IPINFO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IPINFO_API_URL=https://ipinfo.io

# Optional: Configuration
IPINFO_CACHE_TTL=86400
IPINFO_TIMEOUT=10
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'ipinfo' => [
    'token' => env('IPINFO_TOKEN'),
    'api_url' => env('IPINFO_API_URL', 'https://ipinfo.io'),
    'cache_ttl' => env('IPINFO_CACHE_TTL', 86400),
    'timeout' => env('IPINFO_TIMEOUT', 10),
],
```

### Features Implemented
- **Geolocation**: Country, region, and city identification
- **Fraud Detection**: Suspicious IP detection
- **Analytics**: Geographic user analytics
- **Content Localization**: Location-based content delivery
- **Security**: VPN and proxy detection

### Use Cases
- **Fraud Prevention**: Block payments from high-risk locations
- **Content Localization**: Show relevant currency and language
- **Analytics**: Geographic distribution of users
- **Compliance**: Regional legal compliance (GDPR, etc.)

### Implementation Example
```php
// Create IPInfo service class
class IPInfoService
{
    public function getLocationData($ip)
    {
        $response = Http::withToken(config('services.ipinfo.token'))
            ->timeout(config('services.ipinfo.timeout'))
            ->get(config('services.ipinfo.api_url') . "/{$ip}/json");
            
        return $response->json();
    }
}
```

### Setup Instructions
1. Create an IPInfo account at [ipinfo.io](https://ipinfo.io)
2. Choose a subscription plan based on your usage needs
3. Obtain API token from the dashboard
4. Configure rate limits and usage alerts
5. Implement caching to reduce API calls

---

## OpenAI DALL·E Image Generation

OpenAI DALL·E integration for AI-powered image generation features.

### Configuration

#### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORGANIZATION=org-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_API_URL=https://api.openai.com/v1

# DALL·E Specific Settings
DALLE_MODEL=dall-e-3
DALLE_SIZE=1024x1024
DALLE_QUALITY=standard
DALLE_STYLE=vivid
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'openai' => [
    'api_key' => env('OPENAI_API_KEY'),
    'organization' => env('OPENAI_ORGANIZATION'),
    'api_url' => env('OPENAI_API_URL', 'https://api.openai.com/v1'),
    'dalle' => [
        'model' => env('DALLE_MODEL', 'dall-e-3'),
        'size' => env('DALLE_SIZE', '1024x1024'),
        'quality' => env('DALLE_QUALITY', 'standard'),
        'style' => env('DALLE_STYLE', 'vivid'),
    ],
],
```

### Features Implemented
- **AI Image Generation**: Create custom artwork and avatars
- **Profile Customization**: Generate personalized profile images
- **Gift Visualization**: Create visual representations of gifts
- **Social Media Content**: Generate shareable images
- **Brand Assets**: Create branded promotional materials

### DALL·E Models and Specifications
- **DALL·E 3**: Latest model with enhanced quality and safety
- **Image Sizes**: 1024×1024, 1024×1792, 1792×1024
- **Quality Levels**: `standard`, `hd`
- **Style Options**: `vivid`, `natural`

### Implementation Example
```php
class DalleService
{
    public function generateImage($prompt, $options = [])
    {
        $response = Http::withToken(config('services.openai.api_key'))
            ->post(config('services.openai.api_url') . '/images/generations', [
                'model' => $options['model'] ?? config('services.openai.dalle.model'),
                'prompt' => $prompt,
                'n' => $options['n'] ?? 1,
                'size' => $options['size'] ?? config('services.openai.dalle.size'),
                'quality' => $options['quality'] ?? config('services.openai.dalle.quality'),
                'style' => $options['style'] ?? config('services.openai.dalle.style'),
            ]);
            
        return $response->json();
    }
}
```

### Setup Instructions
1. Create an OpenAI account at [platform.openai.com](https://platform.openai.com)
2. Add payment method and set usage limits
3. Generate API key in the API keys section
4. Configure organization ID (if applicable)
5. Review and accept OpenAI usage policies
6. Implement content filtering and moderation

### Best Practices
- **Content Moderation**: Implement prompt filtering
- **Cost Management**: Monitor usage and set limits
- **Caching**: Store generated images to avoid regeneration
- **Error Handling**: Handle API failures gracefully
- **User Guidelines**: Provide clear usage guidelines

---

## HCaptcha Security

HCaptcha provides bot protection and security verification services.

### Configuration

#### Environment Variables
```bash
# HCaptcha Configuration
HCAPTCHA_SITE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HCAPTCHA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HCAPTCHA_API_URL=https://hcaptcha.com/siteverify

# Optional: Configuration
HCAPTCHA_THRESHOLD=0.5
HCAPTCHA_TIMEOUT=30
```

#### Laravel Services Configuration
Add to `config/services.php`:
```php
'hcaptcha' => [
    'site_key' => env('HCAPTCHA_SITE_KEY'),
    'secret_key' => env('HCAPTCHA_SECRET_KEY'),
    'api_url' => env('HCAPTCHA_API_URL', 'https://hcaptcha.com/siteverify'),
    'threshold' => env('HCAPTCHA_THRESHOLD', 0.5),
    'timeout' => env('HCAPTCHA_TIMEOUT', 30),
],
```

### Features Implemented
- **Bot Protection**: Prevent automated account creation
- **Form Security**: Secure contact and payment forms
- **Login Protection**: Additional security for authentication
- **Comment Moderation**: Prevent spam in user-generated content
- **Privacy-Focused**: GDPR-compliant captcha solution

### Implementation Areas
- **User Registration**: Verify new account creation
- **Password Reset**: Secure password reset requests
- **Contact Forms**: Prevent spam submissions
- **Payment Forms**: Additional fraud prevention
- **Content Submission**: Verify legitimate user content

### Frontend Integration
```javascript
// React component for HCaptcha
import HCaptcha from '@hcaptcha/react-hcaptcha';

function CaptchaForm() {
    const handleVerify = (token) => {
        // Send token to backend for verification
        fetch('/verify-captcha', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ captcha_token: token })
        });
    };

    return (
        <HCaptcha
            sitekey={process.env.REACT_APP_HCAPTCHA_SITE_KEY}
            onVerify={handleVerify}
        />
    );
}
```

### Backend Verification
```php
class HCaptchaService
{
    public function verify($token, $remoteIp = null)
    {
        $response = Http::asForm()->post(config('services.hcaptcha.api_url'), [
            'secret' => config('services.hcaptcha.secret_key'),
            'response' => $token,
            'remoteip' => $remoteIp,
        ]);

        $data = $response->json();
        return $data['success'] ?? false;
    }
}
```

### Setup Instructions
1. Create an HCaptcha account at [hcaptcha.com](https://hcaptcha.com)
2. Add your domain to the site settings
3. Obtain site key and secret key
4. Configure difficulty and appearance settings
5. Implement frontend widget in forms
6. Add backend verification for all captcha responses

### Integration Points
- **Registration Form**: `/register`
- **Login Form**: `/login` (for suspicious activity)
- **Contact Form**: `/contact`
- **Password Reset**: `/forgot-password`
- **Payment Forms**: All checkout processes

---

## Environment Variables Summary

Create a `.env` file with all required environment variables:

```bash
# Stripe Configuration
STRIPE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twitter Configuration
TWITTER_CONSUMER_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_CONSUMER_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWITTER_BEARER_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Uploadcare Configuration
UPLOADCARE_PUBLIC_KEY=demopublickey
UPLOADCARE_SECRET_KEY=demosecretkey
UPLOADCARE_HOST=https://api.uploadcare.com/

# MagicBell Configuration
MAGICBELL_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
MAGICBELL_API_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# IPInfo Configuration
IPINFO_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPENAI_ORGANIZATION=org-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# HCaptcha Configuration
HCAPTCHA_SITE_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
HCAPTCHA_SECRET_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Security Best Practices

### API Key Management
- Store all API keys in environment variables
- Never commit API keys to version control
- Use different keys for development and production
- Regularly rotate API keys
- Monitor API key usage and set alerts

### Rate Limiting
- Implement rate limiting for all external API calls
- Cache responses where appropriate
- Use circuit breaker patterns for resilience
- Monitor API usage and costs

### Error Handling
- Implement comprehensive error handling
- Log errors for monitoring and debugging
- Provide fallback mechanisms
- Never expose API keys in error messages

### Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all API communications
- Implement proper data retention policies
- Comply with GDPR and privacy regulations

---

## Testing and Development

### Development Environment
- Use test/sandbox credentials for all services
- Set up separate development API keys
- Use mock services for testing when possible
- Implement feature flags for gradual rollouts

### Testing Strategies
- Unit tests for service wrappers
- Integration tests for API interactions
- End-to-end tests for user workflows
- Load testing for performance validation

### Monitoring and Logging
- Monitor API response times and error rates
- Set up alerts for service failures
- Track usage metrics and costs
- Implement health checks for all services

---

This documentation provides a complete reference for integrating and managing all third-party services in the Spenny Piggy platform. Each service is configured to work seamlessly with the Laravel backend and React frontend architecture.
