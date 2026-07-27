<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Spatie\Image\Enums\ImageDriver;
use Spatie\Image\Enums\ImageFormat;
use Spatie\Image\Exceptions\InvalidImage;
use Spatie\Image\Image;

class ModernImageService
{
    protected array $supportedFormats = ['jpeg', 'jpg', 'png', 'gif', 'webp', 'avif'];

    protected array $responsiveSizes = [320, 640, 768, 1024, 1280, 1920];

    protected int $compressionQuality = 85;

    public function __construct()
    {
        // Configure Image driver based on availability
        try {
            Image::useImageDriver(ImageDriver::Gd);
        } catch (Exception $e) {
            // Fallback to ImageMagick if available
            try {
                Image::useImageDriver(ImageDriver::Imagick);
            } catch (Exception $e) {
                Log::warning('No suitable image driver available. Please install GD or ImageMagick.');
            }
        }
    }

    /**
     * Generate modern image formats (WebP, AVIF) with fallbacks
     */
    public function generateModernFormats(string $imagePath, array $options = []): array
    {
        $quality = $options['quality'] ?? $this->compressionQuality;
        $generateResponsive = $options['responsive'] ?? true;
        $formats = $options['formats'] ?? ['webp', 'avif'];

        $results = [
            'original' => $imagePath,
            'formats' => [],
            'responsive' => [],
        ];

        try {
            $image = Image::load($imagePath);
            $pathInfo = pathinfo($imagePath);
            $baseName = $pathInfo['filename'];
            $directory = $pathInfo['dirname'];

            // Generate modern formats
            foreach ($formats as $format) {
                try {
                    $formatPath = $directory.'/'.$baseName.'.'.$format;

                    $formatImage = clone $image;
                    $formatImage->quality($quality);

                    if ($format === 'webp') {
                        $formatImage->format(ImageFormat::Webp);
                    } elseif ($format === 'avif') {
                        $formatImage->format(ImageFormat::Avif);
                    }

                    $formatImage->save($formatPath);
                    $results['formats'][$format] = $formatPath;

                    // Generate responsive sizes for each format
                    if ($generateResponsive) {
                        $results['responsive'][$format] = $this->generateResponsiveSizes($formatPath, $quality);
                    }

                } catch (Exception $e) {
                    \Log::warning("Failed to generate {$format} format: ".$e->getMessage());
                }
            }

            // Generate responsive sizes for original format
            if ($generateResponsive) {
                $results['responsive']['original'] = $this->generateResponsiveSizes($imagePath, $quality);
            }

        } catch (InvalidImage $e) {
            \Log::error('Invalid image provided: '.$e->getMessage());
            throw $e;
        }

        return $results;
    }

    /**
     * Generate responsive image sizes
     */
    public function generateResponsiveSizes(string $imagePath, ?int $quality = null): array
    {
        $quality = $quality ?? $this->compressionQuality;
        $responsiveImages = [];

        try {
            $image = Image::load($imagePath);
            $originalWidth = $image->getWidth();
            $pathInfo = pathinfo($imagePath);
            $baseName = $pathInfo['filename'];
            $extension = $pathInfo['extension'];
            $directory = $pathInfo['dirname'];

            foreach ($this->responsiveSizes as $size) {
                // Skip if requested size is larger than original
                if ($size >= $originalWidth) {
                    continue;
                }

                $responsivePath = $directory.'/'.$baseName.'-'.$size.'w.'.$extension;

                try {
                    $responsiveImage = clone $image;
                    $responsiveImage->width($size)
                        ->quality($quality)
                        ->save($responsivePath);

                    $responsiveImages[$size] = $responsivePath;
                } catch (Exception $e) {
                    \Log::warning("Failed to generate {$size}w size: ".$e->getMessage());
                }
            }

        } catch (InvalidImage $e) {
            \Log::error('Invalid image for responsive generation: '.$e->getMessage());
        }

        return $responsiveImages;
    }

    /**
     * Generate srcset string for responsive images
     */
    public function generateSrcSet(array $responsiveImages, string $baseUrl = ''): string
    {
        $srcsetParts = [];

        foreach ($responsiveImages as $width => $path) {
            $url = $baseUrl ? $baseUrl.'/'.basename($path) : $path;
            $srcsetParts[] = $url.' '.$width.'w';
        }

        return implode(', ', $srcsetParts);
    }

    /**
     * Generate sizes attribute for responsive images
     */
    public function generateSizesAttribute(?array $breakpoints = null): string
    {
        $defaultBreakpoints = [
            '(max-width: 320px)' => '300px',
            '(max-width: 640px)' => '600px',
            '(max-width: 768px)' => '720px',
            '(max-width: 1024px)' => '960px',
            '(max-width: 1280px)' => '1200px',
        ];

        $breakpoints = $breakpoints ?? $defaultBreakpoints;
        $sizesParts = [];

        foreach ($breakpoints as $mediaQuery => $size) {
            $sizesParts[] = $mediaQuery.' '.$size;
        }

        // Add default size
        $sizesParts[] = '100vw';

        return implode(', ', $sizesParts);
    }

    /**
     * Process uploaded image with modern optimization
     */
    public function processUploadedImage(string $imagePath, array $options = []): array
    {
        // Optimize original image
        $this->optimizeImage($imagePath, $options['quality'] ?? $this->compressionQuality);

        // Generate modern formats and responsive sizes
        return $this->generateModernFormats($imagePath, $options);
    }

    /**
     * Optimize single image
     */
    public function optimizeImage(string $imagePath, ?int $quality = null): void
    {
        $quality = $quality ?? $this->compressionQuality;

        try {
            $image = Image::load($imagePath);
            $image->quality($quality)
                ->optimize()
                ->save();
        } catch (InvalidImage $e) {
            \Log::error('Failed to optimize image: '.$e->getMessage());
            throw $e;
        }
    }

    /**
     * Check browser support for modern formats
     */
    public function getBrowserSupport(string $userAgent): array
    {
        $support = [
            'webp' => false,
            'avif' => false,
        ];

        // Check for WebP support
        if (strpos($userAgent, 'Chrome/') !== false ||
            strpos($userAgent, 'Opera/') !== false ||
            strpos($userAgent, 'Edge/') !== false ||
            (strpos($userAgent, 'Firefox/') !== false && $this->getFirefoxVersion($userAgent) >= 65)) {
            $support['webp'] = true;
        }

        // Check for AVIF support (Chrome 85+, Firefox 93+)
        if ((strpos($userAgent, 'Chrome/') !== false && $this->getChromeVersion($userAgent) >= 85) ||
            (strpos($userAgent, 'Firefox/') !== false && $this->getFirefoxVersion($userAgent) >= 93)) {
            $support['avif'] = true;
        }

        return $support;
    }

    /**
     * Get optimal image format based on browser support
     */
    public function getOptimalFormat(string $userAgent, array $availableFormats): string
    {
        $support = $this->getBrowserSupport($userAgent);

        // Prefer AVIF over WebP over original
        if (in_array('avif', $availableFormats) && $support['avif']) {
            return 'avif';
        }

        if (in_array('webp', $availableFormats) && $support['webp']) {
            return 'webp';
        }

        // Return original format as fallback
        return 'original';
    }

    /**
     * Generate picture element HTML
     */
    public function generatePictureElement(array $imageData, array $attributes = []): string
    {
        $alt = $attributes['alt'] ?? '';
        $loading = $attributes['loading'] ?? 'lazy';
        $decoding = $attributes['decoding'] ?? 'async';
        $class = $attributes['class'] ?? '';
        $sizes = $attributes['sizes'] ?? $this->generateSizesAttribute();

        $html = '<picture>';

        // Add AVIF source if available
        if (isset($imageData['responsive']['avif'])) {
            $avifSrcset = $this->generateSrcSet($imageData['responsive']['avif']);
            $html .= '<source srcset="'.htmlspecialchars($avifSrcset).'" sizes="'.htmlspecialchars($sizes).'" type="image/avif">';
        }

        // Add WebP source if available
        if (isset($imageData['responsive']['webp'])) {
            $webpSrcset = $this->generateSrcSet($imageData['responsive']['webp']);
            $html .= '<source srcset="'.htmlspecialchars($webpSrcset).'" sizes="'.htmlspecialchars($sizes).'" type="image/webp">';
        }

        // Add original format as fallback
        $originalSrcset = '';
        $originalSrc = $imageData['original'];

        if (isset($imageData['responsive']['original'])) {
            $originalSrcset = $this->generateSrcSet($imageData['responsive']['original']);
        }

        $imgAttributes = [
            'src="'.htmlspecialchars($originalSrc).'"',
            'alt="'.htmlspecialchars($alt).'"',
            'loading="'.htmlspecialchars($loading).'"',
            'decoding="'.htmlspecialchars($decoding).'"',
        ];

        if ($originalSrcset) {
            $imgAttributes[] = 'srcset="'.htmlspecialchars($originalSrcset).'"';
            $imgAttributes[] = 'sizes="'.htmlspecialchars($sizes).'"';
        }

        if ($class) {
            $imgAttributes[] = 'class="'.htmlspecialchars($class).'"';
        }

        $html .= '<img '.implode(' ', $imgAttributes).'>';
        $html .= '</picture>';

        return $html;
    }

    /**
     * Cache processed image data
     */
    public function cacheImageData(string $imageKey, array $imageData, int $ttl = 86400): void
    {
        // Caching disabled
        // Cache::put("modern_image_{$imageKey}", $imageData, $ttl);
    }

    /**
     * Get cached image data
     */
    public function getCachedImageData(string $imageKey): ?array
    {
        return null;
        // return Cache::get("modern_image_{$imageKey}");
    }

    private function getChromeVersion(string $userAgent): int
    {
        if (preg_match('/Chrome\/(\d+)/', $userAgent, $matches)) {
            return (int) $matches[1];
        }

        return 0;
    }

    private function getFirefoxVersion(string $userAgent): int
    {
        if (preg_match('/Firefox\/(\d+)/', $userAgent, $matches)) {
            return (int) $matches[1];
        }

        return 0;
    }
}
