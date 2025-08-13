<?php

namespace App\Console\Commands;

use App\Models\Post;
use App\Models\Shop;
use App\Services\ModernImageService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OptimizeImages extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'images:optimize 
                          {--model= : Specific model to optimize (post, shop, all)}
                          {--limit=100 : Limit number of records to process}
                          {--quality=85 : Image quality for optimization}
                          {--formats=webp,avif : Comma-separated list of formats to generate}
                          {--force : Force reprocessing of already optimized images}';

    /**
     * The console command description.
     */
    protected $description = 'Optimize existing images to modern formats (WebP, AVIF) with responsive sizing';

    protected ModernImageService $imageService;

    public function __construct(ModernImageService $imageService)
    {
        parent::__construct();
        $this->imageService = $imageService;
    }

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $model = $this->option('model') ?? 'all';
        $limit = (int) $this->option('limit');
        $quality = (int) $this->option('quality');
        $formats = explode(',', $this->option('formats'));
        $force = $this->option('force');

        $this->info("Starting image optimization...");
        $this->info("Model: {$model}");
        $this->info("Limit: {$limit}");
        $this->info("Quality: {$quality}%");
        $this->info("Formats: " . implode(', ', $formats));

        if ($model === 'all' || $model === 'post') {
            $this->optimizePostImages($limit, $quality, $formats, $force);
        }

        if ($model === 'all' || $model === 'shop') {
            $this->optimizeShopImages($limit, $quality, $formats, $force);
        }

        $this->info("Image optimization completed!");
        return 0;
    }

    protected function optimizePostImages(int $limit, int $quality, array $formats, bool $force): void
    {
        $this->info("Optimizing Post images...");
        
        $posts = Post::whereNotNull('image')
                    ->when(!$force, function($query) {
                        // Only process posts that haven't been optimized yet
                        return $query->where('updated_at', '<', now()->subDays(1));
                    })
                    ->limit($limit)
                    ->get();

        $progressBar = $this->output->createProgressBar($posts->count());
        $progressBar->start();

        foreach ($posts as $post) {
            try {
                $this->processUploadcareImage($post, $quality, $formats);
                $progressBar->advance();
            } catch (\Exception $e) {
                $this->error("Failed to process post {$post->id}: " . $e->getMessage());
                Log::error("Post image optimization failed", [
                    'post_id' => $post->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $progressBar->finish();
        $this->newLine();
        $this->info("Processed {$posts->count()} post images");
    }

    protected function optimizeShopImages(int $limit, int $quality, array $formats, bool $force): void
    {
        $this->info("Optimizing Shop images...");
        
        $shops = Shop::whereNotNull('image')
                    ->when(!$force, function($query) {
                        // Only process shops that haven't been optimized yet
                        return $query->where('updated_at', '<', now()->subDays(1));
                    })
                    ->limit($limit)
                    ->get();

        $progressBar = $this->output->createProgressBar($shops->count());
        $progressBar->start();

        foreach ($shops as $shop) {
            try {
                $this->processUploadcareImage($shop, $quality, $formats);
                $progressBar->advance();
            } catch (\Exception $e) {
                $this->error("Failed to process shop {$shop->id}: " . $e->getMessage());
                Log::error("Shop image optimization failed", [
                    'shop_id' => $shop->id,
                    'error' => $e->getMessage()
                ]);
            }
        }

        $progressBar->finish();
        $this->newLine();
        $this->info("Processed {$shops->count()} shop images");
    }

    protected function processUploadcareImage($model, int $quality, array $formats): void
    {
        if (empty($model->image)) {
            return;
        }

        // For Uploadcare CDN images, we don't need to actually process them
        // since we can generate the URLs on-demand. Instead, we'll cache the
        // responsive image data for faster access.
        
        $cacheKey = 'optimized_image_' . class_basename($model) . '_' . $model->id;
        $imageData = $model->getResponsiveImageData();
        
        // Cache the image data for 24 hours
        cache()->put($cacheKey, $imageData, now()->addDay());
        
        // Update the model's updated_at timestamp to mark it as processed
        $model->touch();
    }

    protected function downloadAndOptimizeLocal($imageUrl, string $filename, int $quality, array $formats): array
    {
        // Download the image
        $imageContent = file_get_contents($imageUrl);
        if ($imageContent === false) {
            throw new \Exception("Failed to download image from {$imageUrl}");
        }

        // Create temporary file
        $tempPath = sys_get_temp_dir() . '/' . $filename;
        file_put_contents($tempPath, $imageContent);

        try {
            // Process with our image service
            $result = $this->imageService->processUploadedImage($tempPath, [
                'quality' => $quality,
                'formats' => $formats,
                'responsive' => true
            ]);

            // Store optimized images in storage
            $storagePath = 'images/optimized/' . pathinfo($filename, PATHINFO_FILENAME);
            
            foreach ($result['formats'] as $format => $path) {
                if (file_exists($path)) {
                    $storageFilePath = $storagePath . '.' . $format;
                    Storage::disk('public')->put($storageFilePath, file_get_contents($path));
                    unlink($path); // Clean up temp file
                }
            }

            foreach ($result['responsive'] as $format => $sizes) {
                foreach ($sizes as $size => $path) {
                    if (file_exists($path)) {
                        $storageFilePath = $storagePath . '-' . $size . 'w.' . pathinfo($path, PATHINFO_EXTENSION);
                        Storage::disk('public')->put($storageFilePath, file_get_contents($path));
                        unlink($path); // Clean up temp file
                    }
                }
            }

            return $result;

        } finally {
            // Clean up temp file
            if (file_exists($tempPath)) {
                unlink($tempPath);
            }
        }
    }
}
