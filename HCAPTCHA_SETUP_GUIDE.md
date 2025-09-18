# hCaptcha Setup Guide

## Issue
hCaptcha is failing to initialize on cart checkout page with error: "hCaptcha has failed to initialize. Please see the developer tools console for more information."

**Root Cause**: The current hCaptcha site key `10000000-ffff-ffff-ffff-000000000001` is a dummy/placeholder key and not valid for production use.

## Fix Options

### Option 1: Set up Real hCaptcha (Recommended for Production)

1. **Create hCaptcha Account**:
   - Go to [https://hcaptcha.com](https://hcaptcha.com)
   - Sign up for a free account
   - Verify your email address

2. **Add Your Site**:
   - Go to the hCaptcha dashboard
   - Click "New Site"
   - Add your domain(s):
     - `localhost` (for development)
     - `127.0.0.1` (for development) 
     - `spennypiggy.co` (for production)
     - Any other domains you use

3. **Get Your Keys**:
   - Copy the **Site Key** (public key)
   - Copy the **Secret Key** (private key, for backend verification)

4. **Update Environment Variables**:
   ```bash
   # Replace in .env file
   HCAPTCHA=your_actual_site_key_here
   
   # Add secret key for backend verification (optional)
   HCAPTCHA_SECRET_KEY=your_secret_key_here
   ```

5. **Clear Config Cache**:
   ```bash
   php artisan config:clear
   php artisan config:cache
   ```

### Option 2: Disable hCaptcha for Development (Quick Fix)

If you want to bypass hCaptcha for development/testing:

1. **Set hCaptcha to empty or null**:
   ```bash
   # In .env file
   HCAPTCHA=
   ```

2. **Update React Components** to handle empty hCaptcha key:
   - Modify cart components to skip captcha when key is empty
   - Show captcha only when valid key is present

### Option 3: Use hCaptcha Test Keys

For development testing, you can use the official test keys:

```bash
# Test site key (always passes)
HCAPTCHA=10000000-ffff-ffff-ffff-000000000001

# But you need to also set up proper test handling in your application
```

**Note**: Test keys require special handling in your backend verification code.

## Current Implementation Issues

### Files Using hCaptcha:
- `resources/js/Pages/rye/CartItems.jsx`
- `resources/js/Pages/cart/UserCarts.jsx` 
- `resources/js/Pages/bills/BillCheckout.jsx`
- `resources/js/Pages/membership/MemberCheckout.jsx`
- `resources/js/Pages/shop/BuyShopItem.jsx`

### How hCaptcha is Loaded:
- Site key passed from Laravel via `hcaptchakey` prop
- Set in `app/Http/Middleware/HandleInertiaRequests.php` line 82
- Uses `env('HCAPTCHA')` value

## Recommended Implementation (Choose Option 1)

1. **Get real hCaptcha credentials**
2. **Update .env file**:
   ```bash
   HCAPTCHA=your_real_site_key
   HCAPTCHA_SECRET_KEY=your_real_secret_key
   ```
3. **Test on localhost first**
4. **Deploy to production**

## Testing hCaptcha

After setup, test the captcha on:
- Cart checkout pages
- Bill payment pages
- Membership signup pages
- Shop item purchases

## Troubleshooting

### Common Issues:
1. **Domain not registered**: Add your domain to hCaptcha dashboard
2. **Mixed HTTP/HTTPS**: Ensure protocol matches your site setup
3. **Cache issues**: Clear browser cache and Laravel config cache
4. **Localhost issues**: Make sure `localhost` is added to allowed domains

### Browser Console Errors:
- Check browser developer console for specific hCaptcha errors
- Look for network errors when loading hCaptcha scripts
- Verify the site key is being passed correctly

## Security Note

- Never commit real secret keys to version control
- Use different keys for development and production
- Monitor hCaptcha dashboard for usage and security alerts