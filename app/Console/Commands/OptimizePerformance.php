<?php

namespace App\Console\Commands;

use App\Services\CacheService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class OptimizePerformance extends Command
{
    protected $signature = 'performance:optimize 
                            {--warm-cache : Warm up application cache}
                            {--clear-cache : Clear all caches}
                            {--optimize-db : Optimize database queries}
                            {--compress-assets : Compress static assets}
                            {--all : Run all optimizations}';

    protected $description = 'Optimize application performance with various strategies';

    public function handle()
    {
        $this->info('🚀 Starting Laravel & Inertia Performance Optimization...');

        if ($this->option('all')) {
            $this->runAllOptimizations();
        } else {
            $this->runSelectedOptimizations();
        }

        $this->info('✅ Performance optimization completed!');
    }

    private function runAllOptimizations()
    {
        $this->optimizeLaravel();
        $this->warmCache();
        $this->optimizeDatabase();
        $this->compressAssets();
        $this->generatePreloadScript();
    }

    private function runSelectedOptimizations()
    {
        if ($this->option('clear-cache')) {
            $this->clearAllCaches();
        }

        if ($this->option('warm-cache')) {
            $this->warmCache();
        }

        if ($this->option('optimize-db')) {
            $this->optimizeDatabase();
        }

        if ($this->option('compress-assets')) {
            $this->compressAssets();
        }

        // Always run basic Laravel optimizations
        $this->optimizeLaravel();
    }

    private function optimizeLaravel()
    {
        $this->info('🔧 Optimizing Laravel...');

        // Clear and cache config
        $this->call('config:cache');
        $this->line('✓ Configuration cached');

        // Clear and cache routes
        $this->call('route:cache');
        $this->line('✓ Routes cached');

        // Clear and cache views
        $this->call('view:cache');
        $this->line('✓ Views cached');

        // Optimize autoloader
        $this->call('optimize');
        $this->line('✓ Application optimized');

        // Cache events and listeners
        $this->call('event:cache');
        $this->line('✓ Events cached');
    }

    private function clearAllCaches()
    {
        $this->info('🧹 Clearing all caches...');

        // Clear application caches
        $this->call('cache:clear');
        $this->call('config:clear');
        $this->call('route:clear');
        $this->call('view:clear');
        $this->call('event:clear');

        // Clear OPcache if available
        if (function_exists('opcache_reset')) {
            opcache_reset();
            $this->line('✓ OPcache cleared');
        }

        $this->line('✓ All caches cleared');
    }

    private function warmCache()
    {
        $this->info('🔥 Warming application cache...');

        // Warm up CacheService
        CacheService::warmUp();
        $this->line('✓ Application cache warmed');

        // Cache commonly accessed data
        $this->warmUserData();
        $this->warmStaticData();
        $this->warmApiEndpoints();

        $this->line('✓ Cache warming completed');
    }

    private function warmUserData()
    {
        $this->info('👥 Warming user data...');

        // Cache active user count
        CacheService::rememberStats('active_users_count', CacheService::LONG_CACHE, function () {
            return DB::table('users')->where('is_active', true)->count();
        });

        // Cache recent users
        CacheService::rememberStats('recent_users', CacheService::MEDIUM_CACHE, function () {
            return DB::table('users')
                ->select('id', 'username', 'created_at')
                ->where('created_at', '>=', now()->subDays(7))
                ->limit(100)
                ->get();
        });

        $this->line('✓ User data cached');
    }

    private function warmStaticData()
    {
        $this->info('📊 Warming static data...');

        // Cache categories if table exists
        if (Schema::hasTable('user_categories')) {
            CacheService::rememberStats('all_categories', CacheService::VERY_LONG_CACHE, function () {
                return DB::table('user_categories')
                    ->select('id', 'category_name', 'created_at')
                    ->orderBy('category_name')
                    ->get();
            });
        }

        // Cache system settings
        CacheService::rememberStats('app_settings', CacheService::VERY_LONG_CACHE, function () {
            return [
                'app_name' => config('app.name'),
                'app_version' => '1.0.0',
                'maintenance_mode' => app()->isDownForMaintenance(),
            ];
        });

        $this->line('✓ Static data cached');
    }

    private function warmApiEndpoints()
    {
        $this->info('🌐 Warming API endpoints...');

        $commonEndpoints = [
            'currencies' => fn () => ['USD', 'EUR', 'GBP', 'JPY'],
            'countries' => fn () => ['US', 'UK', 'CA', 'AU'],
            'timezones' => fn () => timezone_identifiers_list(),
        ];

        foreach ($commonEndpoints as $endpoint => $callback) {
            CacheService::rememberApi($endpoint, [], CacheService::LONG_CACHE, $callback);
        }

        $this->line('✓ API endpoints cached');
    }

    private function optimizeDatabase()
    {
        $this->info('🗄️ Optimizing database...');

        try {
            // Analyze tables for optimization
            $tables = DB::select('SHOW TABLES');
            $tableCount = 0;

            foreach ($tables as $table) {
                $tableName = array_values((array) $table)[0];

                // Optimize table
                DB::statement("OPTIMIZE TABLE `{$tableName}`");
                $tableCount++;
            }

            $this->line("✓ Optimized {$tableCount} database tables");

            // Update table statistics
            DB::statement('ANALYZE TABLE users, wish_items, user_categories');
            $this->line('✓ Updated table statistics');

        } catch (\Exception $e) {
            $this->warn('Database optimization failed: '.$e->getMessage());
        }
    }

    private function compressAssets()
    {
        $this->info('📦 Compressing static assets...');

        // Run Vite build with compression
        $exitCode = shell_exec('cd '.base_path().' && npm run build 2>&1');

        if ($exitCode !== null) {
            $this->line('✓ Assets compiled and compressed');
        } else {
            $this->warn('Asset compilation may have failed');
        }

        // Compress additional files if gzip is available
        $this->compressFiles();
    }

    private function compressFiles()
    {
        $publicPath = public_path();
        $filesToCompress = [
            'build/assets/*.js',
            'build/assets/*.css',
        ];

        foreach ($filesToCompress as $pattern) {
            $files = glob($publicPath.'/'.$pattern);

            foreach ($files as $file) {
                if (function_exists('gzencode') && ! file_exists($file.'.gz')) {
                    $content = file_get_contents($file);
                    $compressed = gzencode($content, 9);
                    file_put_contents($file.'.gz', $compressed);
                }
            }
        }

        $this->line('✓ Static files compressed');
    }

    private function generatePreloadScript()
    {
        $this->info('⚡ Generating PHP preload script...');

        $preloadPath = base_path('preload.php');
        $vendorPath = base_path('vendor');

        $preloadContent = <<<PHP
<?php
// Laravel Preload Script for PHP 7.4+
// This script preloads frequently used classes for better performance

if (php_sapi_name() === 'cli') {
    return;
}

// Preload Composer autoloader
require_once '{$vendorPath}/autoload.php';

// Preload Laravel core classes
\$laravelClasses = [
    'Illuminate\\Foundation\\Application',
    'Illuminate\\Http\\Request',
    'Illuminate\\Http\\Response',
    'Illuminate\\Routing\\Router',
    'Illuminate\\View\\Factory',
    'Illuminate\\Database\\Eloquent\\Model',
    'Illuminate\\Support\\Collection',
    'Illuminate\\Support\\Facades\\Cache',
    'Illuminate\\Support\\Facades\\DB',
    'Illuminate\\Support\\Facades\\Log',
];

// Preload application classes
\$appClasses = [
    'App\\Services\\CacheService',
    'App\\Http\\Controllers\\Controller',
    'App\\Models\\User',
    'App\\Models\\WishItem',
];

// Preload Inertia classes
\$inertiaClasses = [
    'Inertia\\Inertia',
    'Inertia\\Response',
    'Inertia\\ServiceProvider',
];

\$allClasses = array_merge(\$laravelClasses, \$appClasses, \$inertiaClasses);

foreach (\$allClasses as \$class) {
    if (class_exists(\$class, false)) {
        opcache_compile_file((new ReflectionClass(\$class))->getFileName());
    }
}

// Preload frequently used files
\$filesToPreload = [
    __DIR__ . '/config/app.php',
    __DIR__ . '/config/cache.php',
    __DIR__ . '/config/database.php',
];

foreach (\$filesToPreload as \$file) {
    if (file_exists(\$file)) {
        opcache_compile_file(\$file);
    }
}
PHP;

        file_put_contents($preloadPath, $preloadContent);
        $this->line('✓ PHP preload script generated');
        $this->info("📝 Add this to your PHP config: opcache.preload={$preloadPath}");
    }

    private function displayOptimizationTips()
    {
        $this->info('💡 Additional Performance Tips:');
        $this->line('');
        $this->line('1. Enable Redis for caching and sessions');
        $this->line('2. Use a CDN for static assets');
        $this->line('3. Enable gzip compression in your web server');
        $this->line('4. Optimize images with WebP format');
        $this->line('5. Use HTTP/2 for better resource loading');
        $this->line('6. Monitor performance with APM tools');
        $this->line('');
    }
}
