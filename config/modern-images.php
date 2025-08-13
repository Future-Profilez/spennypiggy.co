<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Default Image Quality
    |--------------------------------------------------------------------------
    |
    | This value determines the default quality for image compression.
    | Higher values provide better quality but larger file sizes.
    | Recommended range: 75-95
    |
    */
    'quality' => env('IMAGE_QUALITY', 85),

    /*
    |--------------------------------------------------------------------------
    | Supported Modern Formats
    |--------------------------------------------------------------------------
    |
    | These are the modern image formats that will be generated.
    | WebP has wider browser support, AVIF provides better compression.
    |
    */
    'formats' => [
        'webp' => env('WEBP_ENABLED', true),
        'avif' => env('AVIF_ENABLED', true),
    ],

    /*
    |--------------------------------------------------------------------------
    | Responsive Breakpoints
    |--------------------------------------------------------------------------
    |
    | These are the responsive image sizes that will be generated.
    | Sizes are in pixels (width).
    |
    */
    'responsive_sizes' => [
        'mobile' => 320,
        'mobile_large' => 640,
        'tablet' => 768,
        'desktop_small' => 1024,
        'desktop' => 1280,
        'desktop_large' => 1920,
    ],

    /*
    |--------------------------------------------------------------------------
    | Default Sizes Attribute
    |--------------------------------------------------------------------------
    |
    | Default responsive image sizes attribute for the picture element.
    | This tells the browser which image size to use at different viewport widths.
    |
    */
    'default_sizes' => '(max-width: 320px) 300px, (max-width: 640px) 600px, (max-width: 768px) 720px, (max-width: 1024px) 960px, (max-width: 1280px) 1200px, 100vw',

    /*
    |--------------------------------------------------------------------------
    | Cache TTL
    |--------------------------------------------------------------------------
    |
    | Time to live for cached image processing data in seconds.
    | Default is 24 hours (86400 seconds).
    |
    */
    'cache_ttl' => env('IMAGE_CACHE_TTL', 86400),

    /*
    |--------------------------------------------------------------------------
    | CDN Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for CDN-based image transformations.
    | Currently supports Uploadcare CDN.
    |
    */
    'cdn' => [
        'uploadcare' => [
            'enabled' => env('UPLOADCARE_ENABLED', true),
            'base_url' => 'https://ucarecdn.com/',
            'quality_suffix' => '/-/quality/',
            'format_suffix' => '/-/format/',
            'resize_suffix' => '/-/resize/',
            'progressive_suffix' => '/-/progressive/yes/',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Lazy Loading Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration for lazy loading behavior.
    |
    */
    'lazy_loading' => [
        'enabled' => env('LAZY_LOADING_ENABLED', true),
        'root_margin' => env('LAZY_LOADING_ROOT_MARGIN', '50px'),
        'threshold' => env('LAZY_LOADING_THRESHOLD', 0.01),
        'placeholder_type' => env('LAZY_LOADING_PLACEHOLDER', 'blur'), // 'blur', 'spinner', 'none'
    ],

    /*
    |--------------------------------------------------------------------------
    | Critical Images
    |--------------------------------------------------------------------------
    |
    | Images that should be loaded with high priority (above the fold).
    | These will use loading="eager" and fetchpriority="high".
    |
    */
    'critical_images' => [
        'hero_images' => true,
        'logo_images' => true,
        'first_post_image' => true,
        'profile_avatars_above_fold' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Image Driver
    |--------------------------------------------------------------------------
    |
    | The image processing driver to use. Options: 'gd', 'imagick'
    | GD is more widely available, ImageMagick provides better quality and features.
    |
    */
    'driver' => env('IMAGE_DRIVER', 'gd'),

    /*
    |--------------------------------------------------------------------------
    | Error Handling
    |--------------------------------------------------------------------------
    |
    | Configuration for handling image processing errors.
    |
    */
    'error_handling' => [
        'log_errors' => env('LOG_IMAGE_ERRORS', true),
        'fallback_to_original' => env('FALLBACK_TO_ORIGINAL', true),
        'show_processing_errors' => env('SHOW_IMAGE_PROCESSING_ERRORS', false),
    ],

    /*
    |--------------------------------------------------------------------------
    | Performance Optimization
    |--------------------------------------------------------------------------
    |
    | Performance-related configuration options.
    |
    */
    'performance' => [
        'enable_progressive_jpeg' => env('PROGRESSIVE_JPEG', true),
        'strip_metadata' => env('STRIP_IMAGE_METADATA', true),
        'optimize_for_web' => env('OPTIMIZE_FOR_WEB', true),
        'max_processing_size' => env('MAX_IMAGE_PROCESSING_SIZE', 4096), // pixels
    ],
];
