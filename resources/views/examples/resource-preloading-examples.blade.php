{{--
    RESOURCE PRELOADING & PREFETCHING EXAMPLES
    ==========================================
    
    This file demonstrates how to use the comprehensive resource preloading
    and prefetching system with various Blade directives.
--}}

{{-- BASIC USAGE --}}
{{-- Automatically preload critical resources and prefetch predicted routes --}}
@resourceOptimization('home')

{{-- INDIVIDUAL DIRECTIVES --}}

{{-- 1. PRELOAD CRITICAL RESOURCES AUTOMATICALLY --}}
@preloadCritical('dashboard')

{{-- 2. PRELOAD SPECIFIC RESOURCES --}}
@preloadResource(['href' => asset('images/hero-banner.webp'), 'as' => 'image', 'attributes' => ['fetchpriority' => 'high']])

{{-- 3. PRELOAD CSS FILES --}}
@preloadCss(['href' => asset('css/critical.css'), 'critical' => true])
@preloadCss(['href' => asset('css/non-critical.css'), 'critical' => false])

{{-- 4. PRELOAD HERO/CRITICAL IMAGES --}}
@preloadImage(['href' => asset('images/hero.webp'), 'hero' => true])
@preloadImage(['href' => asset('images/secondary.webp'), 'hero' => false])

{{-- 5. PRELOAD FONTS --}}
@preloadFont(['href' => 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2', 'type' => 'font/woff2'])

{{-- 6. PRELOAD SCRIPTS --}}
@preloadScript(['href' => asset('js/critical.js'), 'critical' => true])

{{-- 7. MODULE PRELOAD FOR ES6 MODULES --}}
@modulePreload(['href' => asset('js/app.module.js')])

{{-- 8. PREFETCH RESOURCES --}}
@prefetchResource(['href' => '/dashboard'])
@prefetchResource(['href' => '/profile'])

{{-- 9. PREFETCH NAVIGATION ROUTES --}}
@prefetchNavigation(['/login', '/register', '/dashboard'])
{{-- Or use auto-predicted routes --}}
@prefetchNavigation

{{-- 10. OPTIMIZED SHORTCUT DIRECTIVES --}}

{{-- Preload all critical Google Fonts --}}
@optimizeFonts

{{-- Preload specific hero images --}}
@optimizeHeroImages([
    asset('images/hero-1.webp'),
    asset('images/hero-2.webp')
])

{{-- Preload critical CSS files --}}
@optimizeCriticalCss([
    asset('css/above-fold.css'),
    asset('css/critical-components.css')
])

{{-- Preload JavaScript chunks --}}
@optimizeJsChunks([
    asset('build/assets/react-vendor.js'),
    asset('build/assets/app-core.js')
])

{{-- RENDERING DIRECTIVES --}}

{{-- Render only preload tags --}}
@renderPreload

{{-- Render only prefetch tags --}}
@renderPrefetch

{{-- PAGE-SPECIFIC EXAMPLES --}}

{{-- HOME PAGE --}}
@section('preload-home')
    @resourceOptimization('home')
    @optimizeHeroImages([
        asset('build/assets/logo-164abf9b.png'),
        asset('build/assets/wishlistbannerimg-b3c5f2d1.jpg')
    ])
@endsection

{{-- DASHBOARD PAGE --}}
@section('preload-dashboard')
    @preloadCritical('dashboard')
    @prefetchNavigation(['/profile', '/settings', '/analytics'])
    @preloadCss(['href' => asset('css/dashboard.css'), 'critical' => true])
@endsection

{{-- PROFILE PAGE --}}
@section('preload-profile')
    @resourceOptimization('profile')
    @preloadImage(['href' => auth()->user()->avatar ?? asset('images/default-avatar.png'), 'hero' => true])
@endsection

{{-- PROGRAMMATIC USAGE IN CONTROLLER --}}
{{--
In your controller, you can also programmatically add resources:

public function show()
{
    $preloader = app('resource-preload');
    
    $preloader->preloadImage(asset('images/product-hero.webp'), true)
             ->preloadCss(asset('css/product.css'), true)
             ->prefetchNavigationRoutes(['/cart', '/checkout']);
    
    return view('products.show');
}
--}}

{{-- CONDITIONAL PRELOADING --}}
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

{{-- PERFORMANCE MONITORING --}}
{{--
You can debug what resources are being preloaded:
{{ dd(app('resource-preload')->getResources()) }}
--}}

{{-- FULL IMPLEMENTATION EXAMPLE --}}
@section('head-optimization')
    {{-- 1. First, preload critical resources for this page --}}
    @resourceOptimization(request()->route()->getName() ?? 'home')
    
    {{-- 2. Add page-specific hero images --}}
    @if(isset($heroImages))
        @optimizeHeroImages($heroImages)
    @endif
    
    {{-- 3. Add page-specific critical CSS --}}
    @if(isset($criticalCss))
        @optimizeCriticalCss($criticalCss)
    @endif
    
    {{-- 4. Add custom prefetch routes if provided --}}
    @if(isset($prefetchRoutes))
        @prefetchNavigation($prefetchRoutes)
    @endif
@endsection
