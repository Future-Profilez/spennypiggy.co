<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\CriticalCssService;
use App\Services\ResourcePreloadService;
use Illuminate\Support\Facades\File;

class OptimizeResources extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'optimize:resources 
                          {--generate-critical : Generate critical CSS files}
                          {--analyze-manifest : Analyze Vite manifest for optimization opportunities}
                          {--test-preloading : Test preloading configuration}
                          {--clear-cache : Clear resource optimization cache}';

    /**
     * The console command description.
     */
    protected $description = 'Optimize resources for better performance through critical CSS generation and preloading analysis';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🚀 Resource Optimization Tool');
        $this->newLine();

        if ($this->option('generate-critical')) {
            $this->generateCriticalCss();
        }

        if ($this->option('analyze-manifest')) {
            $this->analyzeViteManifest();
        }

        if ($this->option('test-preloading')) {
            $this->testPreloadingConfig();
        }

        if ($this->option('clear-cache')) {
            $this->clearOptimizationCache();
        }

        if (!$this->hasOptions()) {
            $this->showInteractiveMenu();
        }

        return 0;
    }

    /**
     * Generate critical CSS files for all templates
     */
    private function generateCriticalCss(): void
    {
        $this->info('📝 Generating Critical CSS Files...');
        
        $criticalCssService = app('critical-css');
        
        try {
            $criticalCssService->generateCriticalCssFiles();
            $this->info('✅ Critical CSS files generated successfully!');
            
            // List generated files
            $criticalPath = storage_path('app/critical-css');
            if (File::exists($criticalPath)) {
                $files = File::files($criticalPath);
                $this->table(['Template', 'File Size'], collect($files)->map(function ($file) {
                    return [
                        basename($file, '.css'),
                        $this->formatBytes(File::size($file))
                    ];
                }));
            }
        } catch (\Exception $e) {
            $this->error('❌ Failed to generate critical CSS: ' . $e->getMessage());
        }
    }

    /**
     * Analyze Vite manifest for optimization opportunities
     */
    private function analyzeViteManifest(): void
    {
        $this->info('🔍 Analyzing Vite Manifest...');
        
        $manifestPath = public_path('build/manifest.json');
        
        if (!File::exists($manifestPath)) {
            $this->warn('⚠️  No Vite manifest found. Run `npm run build` first.');
            return;
        }

        $manifest = json_decode(File::get($manifestPath), true);
        
        $cssFiles = [];
        $jsFiles = [];
        $vendorChunks = [];
        $criticalChunks = [];
        
        foreach ($manifest as $key => $file) {
            if (str_ends_with($key, '.css')) {
                $cssFiles[] = [
                    'key' => $key,
                    'file' => $file['file'],
                    'size' => File::exists(public_path('build/' . $file['file'])) 
                        ? $this->formatBytes(File::size(public_path('build/' . $file['file']))) 
                        : 'N/A'
                ];
            } elseif (str_ends_with($key, '.js') || str_ends_with($key, '.jsx')) {
                $jsFiles[] = [
                    'key' => $key,
                    'file' => $file['file'],
                    'size' => File::exists(public_path('build/' . $file['file'])) 
                        ? $this->formatBytes(File::size(public_path('build/' . $file['file']))) 
                        : 'N/A'
                ];
                
                // Categorize chunks
                if (str_contains($file['file'], 'vendor')) {
                    $vendorChunks[] = $file['file'];
                }
                
                if (str_contains($file['file'], 'react-vendor') || 
                    str_contains($file['file'], 'inertia-framework') ||
                    str_contains($file['file'], 'app-store')) {
                    $criticalChunks[] = $file['file'];
                }
            }
        }

        // Display analysis
        if (!empty($cssFiles)) {
            $this->info('📄 CSS Files:');
            $this->table(['Entry Point', 'Generated File', 'Size'], $cssFiles);
            $this->newLine();
        }

        if (!empty($jsFiles)) {
            $this->info('📦 JavaScript Files:');
            $this->table(['Entry Point', 'Generated File', 'Size'], $jsFiles);
            $this->newLine();
        }

        if (!empty($criticalChunks)) {
            $this->info('🎯 Critical Chunks (will be preloaded):');
            foreach ($criticalChunks as $chunk) {
                $this->line("  • {$chunk}");
            }
            $this->newLine();
        }

        if (!empty($vendorChunks)) {
            $this->info('📚 Vendor Chunks:');
            foreach ($vendorChunks as $chunk) {
                $this->line("  • {$chunk}");
            }
            $this->newLine();
        }

        // Recommendations
        $this->info('💡 Optimization Recommendations:');
        
        if (count($cssFiles) > 3) {
            $this->warn('  • Consider splitting CSS into critical and non-critical files');
        }
        
        if (count($vendorChunks) > 5) {
            $this->warn('  • High number of vendor chunks - consider bundle optimization');
        }
        
        $totalJsSize = 0;
        foreach ($jsFiles as $file) {
            if ($file['size'] !== 'N/A') {
                $totalJsSize += File::size(public_path('build/' . $file['file']));
            }
        }
        
        if ($totalJsSize > 1024 * 1024) { // 1MB
            $this->warn('  • Total JS bundle size is large (' . $this->formatBytes($totalJsSize) . ') - consider code splitting');
        }
        
        $this->info('  • Use @resourceOptimization directive for automatic preloading');
        $this->info('  • Critical chunks will be automatically preloaded');
    }

    /**
     * Test preloading configuration
     */
    private function testPreloadingConfig(): void
    {
        $this->info('🧪 Testing Preloading Configuration...');
        
        $preloader = app('resource-preload');
        
        // Test different page configurations
        $pages = ['home', 'dashboard', 'profile'];
        
        foreach ($pages as $page) {
            $this->line("Testing page: {$page}");
            
            $preloader->reset();
            $preloader->preloadCriticalResources($page);
            
            $resources = $preloader->getResources();
            
            $this->line("  Preload resources: " . count($resources['preload']));
            $this->line("  Module preload resources: " . count($resources['modulepreload']));
            
            // Show first few resources as example
            if (!empty($resources['preload'])) {
                $this->line("  Sample preload: " . $resources['preload'][0]['href']);
            }
            
            $this->newLine();
        }

        // Test route prediction
        $this->info('🔮 Testing Route Prediction:');
        $predictedRoutes = $preloader->getPredictedRoutes();
        
        if (!empty($predictedRoutes)) {
            foreach ($predictedRoutes as $route) {
                $this->line("  • {$route}");
            }
        } else {
            $this->warn('  No routes predicted (might be normal outside request context)');
        }
    }

    /**
     * Clear optimization cache
     */
    private function clearOptimizationCache(): void
    {
        $this->info('🧹 Clearing Resource Optimization Cache...');
        
        // Clear critical CSS cache
        cache()->flush();
        
        // Clear any generated files if needed
        $criticalPath = storage_path('app/critical-css');
        if (File::exists($criticalPath)) {
            File::deleteDirectory($criticalPath);
            File::makeDirectory($criticalPath, 0755, true);
        }
        
        $this->info('✅ Cache cleared successfully!');
    }

    /**
     * Show interactive menu when no options provided
     */
    private function showInteractiveMenu(): void
    {
        $choice = $this->choice(
            'What would you like to do?',
            [
                'generate' => 'Generate critical CSS files',
                'analyze' => 'Analyze Vite manifest',
                'test' => 'Test preloading configuration',
                'clear' => 'Clear optimization cache',
                'all' => 'Run all optimizations'
            ]
        );

        switch ($choice) {
            case 'generate':
                $this->generateCriticalCss();
                break;
            case 'analyze':
                $this->analyzeViteManifest();
                break;
            case 'test':
                $this->testPreloadingConfig();
                break;
            case 'clear':
                $this->clearOptimizationCache();
                break;
            case 'all':
                $this->generateCriticalCss();
                $this->newLine();
                $this->analyzeViteManifest();
                $this->newLine();
                $this->testPreloadingConfig();
                break;
        }
    }

    /**
     * Check if any options were provided
     */
    private function hasOptions(): bool
    {
        return $this->option('generate-critical') ||
               $this->option('analyze-manifest') ||
               $this->option('test-preloading') ||
               $this->option('clear-cache');
    }

    /**
     * Format bytes into human readable format
     */
    private function formatBytes(int $bytes, int $precision = 2): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
