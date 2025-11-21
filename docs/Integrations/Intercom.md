# Intercom Integration Documentation

## Overview

SpennypPiggy.co uses Intercom to provide live chat support with full conversation persistence linked to creator accounts. This implementation ensures that when creators log in, they see their previous conversations, and support agents have full context about the creator they're helping.

## Architecture

### Key Components

1. **IntercomService** (`app/Services/IntercomService.php`)
   - Centralized configuration and user data building
   - Handles identity verification (HMAC-SHA256)
   - Creator-specific custom attributes
   - Security gating (creators and admins only)

2. **IntercomProvider** (`resources/js/Components/IntercomProvider.jsx`)
   - React component managing Intercom lifecycle
   - Handles boot/update/shutdown based on user state
   - Prevents duplicate script loading

3. **HandleInertiaRequests Middleware**
   - Shares Intercom configuration with all pages
   - Uses IntercomService to build user-specific settings

## Environment Configuration

### Required Environment Variables

```bash
# Enable/disable Intercom integration
INTERCOM_ENABLED=true

# Your Intercom App ID (from Intercom settings)
INTERCOM_APP_ID=your_intercom_app_id

# Secret for identity verification (from Intercom security settings)
INTERCOM_IDENTITY_VERIFICATION_SECRET=your_intercom_secret_key
```

### Configuration Files

**config/services.php**
```php
'intercom' => [
    'enabled' => env('INTERCOM_ENABLED', false),
    'app_id' => env('INTERCOM_APP_ID'),
    'identity_secret' => env('INTERCOM_IDENTITY_VERIFICATION_SECRET'),
],
```

## How Conversation Linking Works

### Identity Verification
- Uses HMAC-SHA256 to sign user IDs
- Prevents user impersonation
- Ensures secure conversation linking across sessions

### User Identification Flow
1. Creator logs in
2. `IntercomService::buildSettings()` generates signed user hash
3. Frontend receives configuration via Inertia props
4. `IntercomProvider` boots Intercom with user identity
5. Intercom links conversation to the stable user ID
6. Creator sees previous conversations on subsequent logins

### Custom Attributes Sent to Intercom

For enhanced support context, the following creator attributes are included:

**Profile Information:**
- `is_creator`: Boolean indicating creator status
- `profile_url`: Direct link to creator's public page
- `account_status`: active/suspended
- `role`: User role (creator/admin/staff)

**Account Details:**
- `country`: Creator's country
- `currency`: Preferred currency
- `is_verified`: Account verification status
- `created_ts`: Account creation timestamp
- `last_login_ts`: Last login timestamp

**Creator Metrics:**
- `wishlist_items_count`: Number of wishlist items
- `membership_tiers_count`: Number of membership tiers
- `stripe_connect_status`: Stripe Connect account status

## Security Features

### Access Control
- Only creators and admin users can access Intercom
- Non-creators see `enabled: false` preventing widget load
- Environment toggle for instant disable

### Identity Verification
- HMAC-SHA256 signing prevents account spoofing  
- User hash validated by Intercom servers
- Secure conversation linking across devices/sessions

### Data Privacy
- Only non-sensitive creator attributes shared
- No financial data or sensitive PII transmitted
- Configurable attribute filtering

## Development

### Testing

**Run PHP Unit Tests:**
```bash
php artisan test tests/Unit/IntercomServiceTest.php
```

**Key Test Coverage:**
- Disabled state when `INTERCOM_ENABLED=false`
- Identity verification hash generation
- Creator vs non-creator access control  
- Custom attributes building
- Suspended account status handling

### Local Development

1. Set environment variables in `.env`:
```bash
INTERCOM_ENABLED=true
INTERCOM_APP_ID=your_test_app_id
INTERCOM_IDENTITY_VERIFICATION_SECRET=your_test_secret
```

2. Clear config cache:
```bash
php artisan config:clear
php artisan config:cache
```

3. Test with different user roles to verify access control

### Frontend Development

The `IntercomProvider` component automatically:
- Loads Intercom script only once
- Boots Intercom when user data is available
- Updates user data when props change
- Shuts down Intercom on user logout
- Handles Intercom initialization errors gracefully

## Deployment

### Laravel Vapor Deployment

1. **Add environment variables to Vapor environment:**
```bash
# In your vapor.yml or Vapor dashboard
INTERCOM_ENABLED=true
INTERCOM_APP_ID=xomg14o9
INTERCOM_IDENTITY_VERIFICATION_SECRET=production_secret_key
```

2. **Deploy using standard pipeline:**
```bash
npm run devbuild    # For staging
npm run livebuild   # For production
```

3. **Clear config cache post-deployment:**
```bash
php artisan config:clear
php artisan config:cache
```

### Kill Switch

To instantly disable Intercom without code changes:
1. Set `INTERCOM_ENABLED=false` in environment
2. Redeploy or update environment variables
3. Clear config cache

## Troubleshooting

### Common Issues

**Intercom widget not appearing:**
- Check `INTERCOM_ENABLED=true` in environment
- Verify `INTERCOM_APP_ID` is set correctly
- Confirm user is a creator or admin role
- Check browser console for JavaScript errors

**Conversations not persisting:**
- Verify `INTERCOM_IDENTITY_VERIFICATION_SECRET` is set
- Check that user hash is being generated correctly
- Confirm user_id remains consistent across sessions

**Identity verification errors:**
- Ensure secret key matches Intercom security settings
- Verify user hash format (HMAC-SHA256 of user ID)
- Check Intercom identity verification is enabled

### Debugging

**Backend debugging:**
```php
// In any controller or service
$settings = app(\App\Services\IntercomService::class)->buildSettings(auth()->user());
dd($settings); // Check configuration structure
```

**Frontend debugging:**
```javascript
// In browser console
console.log(page.props.intercom); // Check received configuration
console.log(window.Intercom); // Verify Intercom is loaded
console.log(window.intercomSettings); // Check current settings
```

### Monitoring

**Key metrics to monitor:**
- Intercom script load success rate
- User identity verification success
- Conversation persistence across sessions
- Support team satisfaction with creator context

## Best Practices

### Performance
- Intercom loads lazily after user interaction
- Script loading is idempotent (no duplicates)
- Minimal custom attributes to reduce payload size
- Database queries optimized for request frequency

### Security  
- Identity verification always enabled in production
- Regular secret key rotation
- Access limited to creators and authorized staff
- No sensitive financial data in custom attributes

### Maintenance
- Monitor Intercom service health
- Test conversation persistence regularly  
- Keep identity verification secrets secure
- Document any custom attribute additions

## Support

For issues with this integration:
1. Check environment configuration
2. Review server and browser console logs
3. Test with different user roles and scenarios
4. Contact development team with reproduction steps

## API Reference

### IntercomService Methods

```php
IntercomService::buildSettings(?User $user): array
```

Returns configuration array for Intercom initialization:
- `enabled`: Boolean indicating if Intercom should load
- `appId`: Intercom application ID
- `boot`: Configuration object for Intercom.boot() call

### Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `INTERCOM_ENABLED` | Yes | Enable/disable integration | `true` |
| `INTERCOM_APP_ID` | Yes | Intercom application ID | `xomg14o9` |
| `INTERCOM_IDENTITY_VERIFICATION_SECRET` | Recommended | Secret for user verification | `secret_key_123` |

This implementation provides secure, persistent chat conversations linked to creator accounts while maintaining performance and security best practices.