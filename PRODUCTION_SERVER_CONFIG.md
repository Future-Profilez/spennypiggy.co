# Production Server Configuration Fix

## MIME Type Error Resolution

The error you're seeing:
```
Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css". Strict MIME type checking is enforced for module scripts per HTML spec.
```

This happens when your production server (Nginx/Apache) serves CSS files with incorrect MIME types or when asset URLs are malformed.

## Quick Fixes to Apply on Production Server

### 1. Nginx Configuration

Add this to your Nginx server block:

```nginx
server {
    # ... your existing config

    # Fix MIME types for assets
    location ~* \.css$ {
        add_header Content-Type text/css;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.js$ {
        add_header Content-Type application/javascript;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location ~* \.json$ {
        add_header Content-Type application/json;
    }

    # Handle Laravel asset routing
    location /build/ {
        alias /path/to/your/app/public/build/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        location ~* \.css$ {
            add_header Content-Type text/css;
        }
        
        location ~* \.js$ {
            add_header Content-Type application/javascript;
        }
    }
}
```

### 2. Apache Configuration (.htaccess)

Add this to your `.htaccess` file in the public directory:

```apache
# Fix MIME types
<FilesMatch "\\.css$">
    AddType text/css .css
</FilesMatch>

<FilesMatch "\\.js$">
    AddType application/javascript .js
</FilesMatch>

<FilesMatch "\\.json$">
    AddType application/json .json
</FilesMatch>

# Cache static assets
<FilesMatch "\\.(?:css|js|png|jpg|jpeg|gif|webp|avif|woff|woff2)$">
    ExpiresActive On
    ExpiresDefault "access plus 1 year"
    Header set Cache-Control "public, immutable"
</FilesMatch>
```

### 3. Laravel Vapor/Serverless Configuration

If using Laravel Vapor, add this to your `vapor.yml`:

```yaml
environments:
  production:
    # ... your existing config
    
    # Fix asset serving
    web:
      disk: s3
      ttl: 31536000
      
    # Ensure proper headers
    headers:
      'build/**':
        'cache-control': 'max-age=31536000, public, immutable'
      'build/*.css':
        'content-type': 'text/css'
      'build/*.js':
        'content-type': 'application/javascript'
```

## 4. Immediate Actions Required

### A. Clear All Caches
```bash
# On your production server
php artisan config:clear
php artisan view:clear
php artisan cache:clear
php artisan route:clear

# Then rebuild caches
php artisan config:cache
php artisan view:cache
php artisan route:cache
```

### B. Update Your Environment
Make sure your production `.env` has:
```env
APP_ENV=production
APP_DEBUG=false
ASSET_URL=https://your-domain.com
```

### C. Deploy New Build
```bash
# Upload the new build files to production
# Copy public/build/* to your production server
# Restart web server (Nginx/Apache)
sudo systemctl reload nginx  # or sudo service apache2 reload
```

## 5. CDN/CloudFront Configuration (If Using)

If you're using CloudFront, ensure these behaviors are set:

```
Path Pattern: /build/*.css
Origin: Your server
Compress Objects: Yes
Headers: 
  - Content-Type: text/css
  - Cache-Control: max-age=31536000, public, immutable

Path Pattern: /build/*.js  
Origin: Your server
Compress Objects: Yes
Headers:
  - Content-Type: application/javascript  
  - Cache-Control: max-age=31536000, public, immutable
```

Then invalidate CloudFront cache:
```bash
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/build/*"
```

## 6. Test Your Fix

After applying the server configuration:

1. **Hard refresh** your browser (Ctrl+F5 or Cmd+Shift+R)
2. **Clear browser cache** completely
3. **Check browser developer tools**:
   - Network tab should show CSS files with `Content-Type: text/css`
   - Network tab should show JS files with `Content-Type: application/javascript`
   - No more MIME type errors in Console

## 7. Debugging Tips

If issues persist:

1. **Check asset URLs** in browser dev tools - they should point to correct domain
2. **Verify file permissions** - ensure web server can read build files
3. **Check server error logs** for any 404s or permission errors
4. **Test individual asset URLs** directly in browser:
   - `https://your-domain.com/build/assets/app-[hash].js` should return JS
   - `https://your-domain.com/build/assets/app-[hash].css` should return CSS

## 8. Alternative: Use Laravel Asset Helper

If server configuration is not possible, you can also force correct serving in Laravel by updating `app/Http/Middleware/SetProperHeaders.php`:

```php
<?php

namespace App\Http\Middleware;

use Closure;

class SetProperHeaders
{
    public function handle($request, Closure $next)
    {
        $response = $next($request);
        
        if ($request->is('build/assets/*.css')) {
            $response->headers->set('Content-Type', 'text/css');
        }
        
        if ($request->is('build/assets/*.js')) {
            $response->headers->set('Content-Type', 'application/javascript');
        }
        
        return $response;
    }
}
```

Then register it in `app/Http/Kernel.php`.

---

**The key fix is ensuring your production server serves CSS files with `Content-Type: text/css` and JS files with `Content-Type: application/javascript`.**
