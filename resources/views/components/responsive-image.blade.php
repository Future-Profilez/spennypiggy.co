@props([
    'src' => '',
    'alt' => '',
    'class' => '',
    'loading' => 'lazy',
    'decoding' => 'async',
    'sizes' => null,
    'priority' => false,
    'responsive' => true,
    'formats' => ['webp', 'avif'],
    'quality' => 85,
    'breakpoints' => null,
    'width' => null,
    'height' => null
])

@php
    use App\Services\ModernImageService;
    
    $imageService = app(ModernImageService::class);
    $imageKey = md5($src . serialize($formats) . $quality);
    
    // Check for cached processed image data
    $imageData = $imageService->getCachedImageData($imageKey);
    
    if (!$imageData && $src) {
        // Process image if not cached
        try {
            if (filter_var($src, FILTER_VALIDATE_URL)) {
                // Handle external URLs (like Uploadcare CDN)
                $imageData = [
                    'original' => $src,
                    'formats' => [],
                    'responsive' => []
                ];
                
                // For CDN URLs, construct format variations
                if (strpos($src, 'ucarecdn.com') !== false) {
                    // Uploadcare CDN format transformations
                    $baseUrl = rtrim($src, '/');
                    if (in_array('webp', $formats)) {
                        $imageData['formats']['webp'] = $baseUrl . '/-/format/webp/-/quality/' . $quality . '/';
                    }
                    if (in_array('avif', $formats)) {
                        $imageData['formats']['avif'] = $baseUrl . '/-/format/avif/-/quality/' . $quality . '/';
                    }
                    
                    // Generate responsive sizes for CDN
                    if ($responsive) {
                        $responsiveSizes = [320, 640, 768, 1024, 1280, 1920];
                        foreach (['original', 'webp', 'avif'] as $format) {
                            if ($format === 'original' || isset($imageData['formats'][$format])) {
                                $formatUrl = $format === 'original' ? $baseUrl : $imageData['formats'][$format];
                                $imageData['responsive'][$format] = [];
                                
                                foreach ($responsiveSizes as $size) {
                                    $responsiveUrl = rtrim($formatUrl, '/') . '/-/resize/' . $size . 'x/';
                                    $imageData['responsive'][$format][$size] = $responsiveUrl;
                                }
                            }
                        }
                    }
                }
            } else {
                // Handle local files
                $localPath = public_path($src);
                if (file_exists($localPath)) {
                    $imageData = $imageService->processUploadedImage($localPath, [
                        'quality' => $quality,
                        'responsive' => $responsive,
                        'formats' => $formats
                    ]);
                }
            }
            
            // Cache the processed data
            if ($imageData) {
                $imageService->cacheImageData($imageKey, $imageData);
            }
        } catch (Exception $e) {
            Log::warning('Image processing failed: ' . $e->getMessage());
            $imageData = ['original' => $src, 'formats' => [], 'responsive' => []];
        }
    }
    
    // Generate sizes attribute
    if (!$sizes) {
        $defaultBreakpoints = $breakpoints ?? [
            '(max-width: 320px)' => '300px',
            '(max-width: 640px)' => '600px', 
            '(max-width: 768px)' => '720px',
            '(max-width: 1024px)' => '960px',
            '(max-width: 1280px)' => '1200px'
        ];
        $sizes = $imageService->generateSizesAttribute($defaultBreakpoints);
    }
    
    // Determine if critical (above fold) image
    $loadingAttr = $priority ? 'eager' : $loading;
    $fetchPriority = $priority ? 'high' : 'auto';
@endphp

@if($imageData && (isset($imageData['responsive']['webp']) || isset($imageData['responsive']['avif']) || isset($imageData['responsive']['original'])))
    {{-- Modern picture element with multiple sources --}}
    <picture>
        {{-- AVIF source (most efficient) --}}
        @if(isset($imageData['responsive']['avif']) && !empty($imageData['responsive']['avif']))
            <source 
                srcset="{{ $imageService->generateSrcSet($imageData['responsive']['avif']) }}"
                sizes="{{ $sizes }}"
                type="image/avif"
            >
        @endif
        
        {{-- WebP source (good compatibility) --}}
        @if(isset($imageData['responsive']['webp']) && !empty($imageData['responsive']['webp']))
            <source 
                srcset="{{ $imageService->generateSrcSet($imageData['responsive']['webp']) }}"
                sizes="{{ $sizes }}"
                type="image/webp"
            >
        @endif
        
        {{-- Original format fallback --}}
        <img 
            src="{{ $imageData['original'] }}"
            @if(isset($imageData['responsive']['original']) && !empty($imageData['responsive']['original']))
                srcset="{{ $imageService->generateSrcSet($imageData['responsive']['original']) }}"
                sizes="{{ $sizes }}"
            @endif
            alt="{{ $alt }}"
            loading="{{ $loadingAttr }}"
            decoding="{{ $decoding }}"
            fetchpriority="{{ $fetchPriority }}"
            @if($class) class="{{ $class }}" @endif
            @if($width) width="{{ $width }}" @endif
            @if($height) height="{{ $height }}" @endif
        >
    </picture>
@else
    {{-- Fallback simple img tag --}}
    <img 
        src="{{ $src }}"
        alt="{{ $alt }}"
        loading="{{ $loadingAttr }}"
        decoding="{{ $decoding }}"
        fetchpriority="{{ $fetchPriority }}"
        @if($class) class="{{ $class }}" @endif
        @if($width) width="{{ $width }}" @endif
        @if($height) height="{{ $height }}" @endif
    >
@endif
