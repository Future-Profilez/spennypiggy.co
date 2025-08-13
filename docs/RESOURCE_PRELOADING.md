# Resource Preloading & Prefetching System

This comprehensive system provides automated and manual resource preloading and prefetching capabilities through Laravel Blade directives to optimize page performance.

## Features

- 🚀 **Automatic Critical Resource Detection**: Auto-detects and preloads critical CSS, JS chunks, fonts, and images from Vite manifest
- 🎯 **Smart Prefetching**: Predicts and prefetches likely navigation routes based on current page
- 🖼️ **Hero Image Optimization**: Preloads above-the-fold images with `fetchpriority="high"`
- 🔤 **Font Optimization**: Preloads critical font files with proper `crossorigin` attributes
- 📦 **JavaScript Chunk Management**: Module preloading for ES6 modules and critical vendor chunks
- 🎨 **CSS Optimization**: Separates critical and non-critical CSS with proper loading strategies
- 🛠️ **Flexible Blade Directives**: Easy-to-use directives for manual resource optimization

## Quick Start

### Basic Usage

Add this single directive to your layout to automatically optimize resources:

```blade
@resourceOptimization($page['component'] ?? 'home')
```

This will:
- Preload critical CSS files
- Preload hero images for the current page
- Module preload critical JavaScript chunks
- Preload essential font files
- Prefetch predicted navigation routes

### Manual Resource Preloading

```blade
{{-- Preload a critical CSS file --}}
@preloadCss(['href' => asset('css/critical.css'), 'critical' => true])

{{-- Preload hero image --}}
@preloadImage(['href' => asset('images/hero.webp'), 'hero' => true])

{{-- Preload font with proper attributes --}}
@preloadFont(['href' => 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'])

{{-- Module preload for ES6 modules --}}
@modulePreload(['href' => asset('js/app.module.js')])
```

### Navigation Prefetching

```blade
{{-- Auto-predict routes based on current page --}}
@prefetchNavigation

{{-- Or specify custom routes --}}
@prefetchNavigation(['/dashboard', '/profile', '/settings'])
```

## Available Blade Directives

### Core Directives

#### `@resourceOptimization($page)`
**One-stop optimization directive that handles everything automatically.**

```blade
@resourceOptimization('home')
@resourceOptimization($page['component'] ?? 'default')
```

#### `@preloadCritical($page)`
**Preloads critical resources for a specific page.**

```blade
@preloadCritical('dashboard')
```

### Individual Resource Directives

#### `@preloadResource($config)`
**Preload any resource with custom attributes.**

```blade
@preloadResource([
    'href' => asset('images/hero.webp'),
    'as' => 'image',
    'attributes' => ['fetchpriority' => 'high']
])
```

#### `@preloadCss($config)`
**Preload CSS files.**

```blade
@preloadCss(['href' => asset('css/critical.css'), 'critical' => true])
```

#### `@preloadImage($config)`
**Preload images with hero optimization.**

```blade
@preloadImage(['href' => asset('images/hero.webp'), 'hero' => true])
```

#### `@preloadFont($config)`
**Preload fonts with proper crossorigin.**

```blade
@preloadFont([
    'href' => 'https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.woff2',
    'type' => 'font/woff2'
])
```

#### `@preloadScript($config)`
**Preload JavaScript files.**

```blade
@preloadScript(['href' => asset('js/critical.js'), 'critical' => true])
```

#### `@modulePreload($config)`
**Module preload for ES6 modules.**

```blade
@modulePreload(['href' => asset('js/app.module.js')])
```

### Prefetching Directives

#### `@prefetchResource($config)`
**Prefetch any resource.**

```blade
@prefetchResource(['href' => '/api/data'])
```

#### `@prefetchNavigation($routes)`
**Prefetch navigation routes.**

```blade
{{-- Auto-predicted routes --}}
@prefetchNavigation

{{-- Custom routes --}}
@prefetchNavigation(['/login', '/register', '/dashboard'])
```

### Optimization Shortcuts

#### `@optimizeFonts`
**Preloads all critical Google Fonts used in your application.**

```blade
@optimizeFonts
```

#### `@optimizeHeroImages($images)`
**Preload multiple hero images.**

```blade
@optimizeHeroImages([
    asset('images/hero-1.webp'),
    asset('images/hero-2.webp')
])
```

#### `@optimizeCriticalCss($cssFiles)`
**Preload multiple critical CSS files.**

```blade
@optimizeCriticalCss([
    asset('css/above-fold.css'),
    asset('css/critical-components.css')
])
```

#### `@optimizeJsChunks($chunks)`
**Module preload multiple JavaScript chunks.**

```blade
@optimizeJsChunks([
    asset('build/assets/react-vendor.js'),
    asset('build/assets/app-core.js')
])
```

### Rendering Directives

#### `@renderPreload`
**Renders all queued preload tags.**

```blade
@renderPreload
```

#### `@renderPrefetch`
**Renders all queued prefetch tags.**

```blade
@renderPrefetch
```

## Page-Specific Optimization

### Home Page
```blade
@resourceOptimization('home')
@optimizeHeroImages([
    asset('build/assets/logo-164abf9b.png'),
    asset('build/assets/wishlistbannerimg-b3c5f2d1.jpg')
])
```

### Dashboard
```blade
@preloadCritical('dashboard')
@prefetchNavigation(['/profile', '/settings', '/analytics'])
@preloadCss(['href' => asset('css/dashboard.css'), 'critical' => true])
```

### Profile Page
```blade
@resourceOptimization('profile')
@preloadImage([
    'href' => auth()->user()->avatar ?? asset('images/default-avatar.png'),
    'hero' => true
])
```

## Programmatic Usage

You can also use the service programmatically in your controllers:

```php
public function show()
{
    $preloader = app('resource-preload');
    
    $preloader->preloadImage(asset('images/product-hero.webp'), true)
             ->preloadCss(asset('css/product.css'), true)
             ->prefetchNavigationRoutes(['/cart', '/checkout']);
    
    return view('products.show');
}
```

## Conditional Optimization

```blade
@if(auth()->check())
    @prefetchNavigation(['/dashboard', '/profile', '/settings'])
@else
    @prefetchNavigation(['/login', '/register'])
@endif

@if(request()->route()->getName() === 'home')
    @optimizeHeroImages([
        asset('build/assets/hero-banner.webp'),
        asset('build/assets/feature-showcase.webp')
    ])
@endif
```

## Performance Monitoring

Debug what resources are being preloaded:

```blade
{{ dd(app('resource-preload')->getResources()) }}
```

## Generated HTML Examples

### Preload Tags
```html
<!-- Critical CSS -->
<link rel="preload" href="/build/assets/app-abc123.css" as="style" type="text/css" fetchpriority="high">

<!-- Hero Image -->
<link rel="preload" href="/images/hero.webp" as="image" fetchpriority="high">

<!-- Font with Crossorigin -->
<link rel="preload" href="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.woff2" as="font" type="font/woff2" crossorigin="anonymous">

<!-- Module Preload -->
<link rel="modulepreload" href="/build/assets/app-def456.js" crossorigin="anonymous">
```

### Prefetch Tags
```html
<!-- Navigation Routes -->
<link rel="prefetch" href="/dashboard">
<link rel="prefetch" href="/profile">
<link rel="prefetch" href="/settings">
```

## Configuration

The system automatically detects critical resources from your Vite manifest and provides sensible defaults for:

- **Critical CSS**: Files containing 'app' or 'critical' in the name
- **Critical JS**: React vendor chunks, Inertia framework, app store
- **Hero Images**: Page-specific image mappings
- **Critical Fonts**: Poppins, Anton, and Fredoka font families
- **Navigation Routes**: Intelligent route prediction based on current page

## Best Practices

1. **Use `@resourceOptimization()` as your primary directive** - it handles most use cases automatically
2. **Add page-specific optimizations** using the individual directives
3. **Preload hero images** that appear above the fold
4. **Use conditional preloading** for user-specific or route-specific resources
5. **Monitor performance impact** using browser dev tools
6. **Test in production mode** where the full optimization takes effect

## Browser Support

- **Preload**: All modern browsers
- **Module Preload**: Chrome 66+, Firefox 115+, Safari 17+
- **Prefetch**: All modern browsers
- **Fetchpriority**: Chrome 101+, Firefox 121+, Safari 17.2+

## Troubleshooting

### Resources Not Preloading
1. Check that the service provider is registered in `config/app.php`
2. Verify file paths are correct and accessible
3. Ensure you're in production mode for Vite manifest detection

### Performance Issues
1. Don't preload too many resources (limit to truly critical ones)
2. Use prefetch for likely-to-be-needed resources, not preload
3. Monitor network tab for preload effectiveness

### Development vs Production
- In development mode, automatic detection falls back to basic preloading
- Production mode uses the Vite manifest for optimal chunk detection
- Always test performance optimizations in production-like environment
