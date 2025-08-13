# Spennypiggy.co

## Installation
* Clone the repo
```shell
git clone https://github.com/Future-Profilez/spennypiggy.co
```

* Install Composer Packages

```shell
composer install
```

* Install NPM Packages

```shell
npm install
```

* Connect the database and run migration


```shell
php artisan migrate
```

* Run Project

    Start PHP Server

    ```shell
    php artisan serve
    ```
    Start NPM Server

    ```shell
    npm run dev
    ```


## Common local setup issues

### Issue 1: 500 Internal Server Error - Inertia SSR Type Error
**Error:** `Inertia\Ssr\HttpGateway::dispatch(): Argument #1 ($page) must be of type array, string given`

**Solution:**
This error occurs when custom Blade directives conflict with Inertia's SSR processing. To fix:
1. Comment out problematic custom directives in `resources/views/app.blade.php`:
   ```blade
   {{-- @resourceOptimization($pageComponent) --}}
   {{-- @criticalCss($pageComponent) --}}
   {{-- @optimizeFonts --}}
   {{-- @deferCss("build/{$cssFile}") --}}
   ```
2. Clear view cache: `php artisan view:clear`
3. Clear application cache: `php artisan cache:clear`
4. Clear config cache: `php artisan config:clear`

### Issue 2: Unable to locate file in Vite manifest
**Error:** `Unable to locate file in Vite manifest: resources/css/app.css`

**Solution:**
This happens when the Vite configuration doesn't match the Blade template's expectations.
1. Ensure CSS is imported in the JavaScript entry point (`resources/js/app.jsx`)
2. Configure Vite to only include the JS file as input:
   ```javascript
   laravel({
       input: 'resources/js/app.jsx',
       refresh: true,
   })
   ```
3. Update the Blade template to only load the JS file in development:
   ```blade
   @vite(['resources/js/app.jsx'])
   ```

### Issue 3: Blank white screen after server start
**Symptoms:** Servers start successfully but homepage shows blank white screen

**Solution:**
1. Check browser developer console for JavaScript errors
2. Ensure both development servers are running:
   ```bash
   # Terminal 1
   npm run dev
   
   # Terminal 2  
   php artisan serve
   ```
3. Access the Laravel app at http://127.0.0.1:8000 (not the Vite server at http://localhost:5173)
4. If using custom Blade directives, temporarily disable them to isolate the issue

### Issue 4: Permission errors in logs
**Error:** Permission denied errors in `storage/logs/laravel.log`

**Solution:**
1. Set proper permissions for Laravel storage directories:
   ```bash
   chmod -R 775 storage
   chmod -R 775 bootstrap/cache
   ```
2. Ensure the web server user has write permissions to these directories

### Development Server Startup Process
1. **Stop any running instances:**
   ```bash
   pkill -f "vite"
   pkill -f "php.*serve"
   ```

2. **Start Vite development server:**
   ```bash
   npm run dev
   ```
   - Should be available at http://localhost:5173
   - Wait for "ready" message before proceeding

3. **Start Laravel development server:**
   ```bash
   php artisan serve
   ```
   - Should be available at http://127.0.0.1:8000
   - This is the URL you should visit in your browser

4. **Verify both servers are working:**
   - Check `storage/logs/laravel.log` for any fresh errors
   - Ensure no permission errors in the logs

* APIS ROUTES

    ```User Cart
    END POINT - POST - update-cover-or-avatar
    {
        'type':'avatar/cover'
        'file':{
            uploadcare file
        }
    }
