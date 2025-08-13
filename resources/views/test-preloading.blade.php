<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Resource Preloading Test</title>
    
    {{-- Test the main resource optimization directive --}}
    @resourceOptimization('home')
    
    {{-- Test individual optimization directives --}}
    @optimizeFonts
    
    @optimizeHeroImages([
        asset('images/test-hero-1.webp'),
        asset('images/test-hero-2.webp')
    ])
    
    {{-- Test individual preloading directives --}}
    @preloadCss(['href' => asset('css/test-critical.css'), 'critical' => true])
    @preloadImage(['href' => asset('images/test-image.webp'), 'hero' => true])
    @preloadFont(['href' => 'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'])
    
    {{-- Test prefetching --}}
    @prefetchNavigation(['/test-route-1', '/test-route-2'])
    
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            margin: 2rem;
            max-width: 800px;
        }
        
        .success { color: #059669; }
        .info { color: #0369a1; }
        .section {
            margin: 2rem 0;
            padding: 1rem;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
        }
        
        pre {
            background: #f3f4f6;
            padding: 1rem;
            border-radius: 4px;
            overflow-x: auto;
            font-size: 0.875rem;
        }
        
        .tag-count {
            font-weight: bold;
            color: #dc2626;
        }
    </style>
</head>
<body>
    <h1>🚀 Resource Preloading & Prefetching Test</h1>
    
    <div class="section">
        <h2 class="success">✅ System Status</h2>
        <p>This page demonstrates the comprehensive resource preloading and prefetching system.</p>
        <p class="info">Check the browser's Network tab and look for preload/prefetch resources.</p>
    </div>

    <div class="section">
        <h2>📊 Generated Tags Analysis</h2>
        <p>View the page source to see all generated preload and prefetch tags in the <code>&lt;head&gt;</code> section.</p>
        
        <h3>What to Look For:</h3>
        <ul>
            <li><strong>Preload tags</strong> with <code>rel="preload"</code> for critical resources</li>
            <li><strong>Module preload tags</strong> with <code>rel="modulepreload"</code> for JavaScript modules</li>
            <li><strong>Prefetch tags</strong> with <code>rel="prefetch"</code> for likely navigation routes</li>
            <li><strong>Proper attributes</strong> like <code>crossorigin</code>, <code>fetchpriority</code>, and <code>as</code></li>
        </ul>
    </div>

    <div class="section">
        <h2>🔍 Expected Preload Tags</h2>
        <pre><code>&lt;!-- Critical CSS --&gt;
&lt;link rel="preload" href="/css/test-critical.css" as="style" type="text/css" fetchpriority="high"&gt;

&lt;!-- Hero Images --&gt;
&lt;link rel="preload" href="/images/test-hero-1.webp" as="image" fetchpriority="high"&gt;
&lt;link rel="preload" href="/images/test-image.webp" as="image" fetchpriority="high"&gt;

&lt;!-- Fonts with Crossorigin --&gt;
&lt;link rel="preload" href="https://fonts.gstatic.com/s/poppins/v20/pxiEyp8kv8JHgFVrFJA.woff2" as="font" type="font/woff2" crossorigin="anonymous"&gt;

&lt;!-- Module Preload for JS Chunks --&gt;
&lt;link rel="modulepreload" href="/build/assets/app-[hash].js" crossorigin="anonymous"&gt;</code></pre>
    </div>

    <div class="section">
        <h2>🎯 Expected Prefetch Tags</h2>
        <pre><code>&lt;!-- Predicted Navigation Routes --&gt;
&lt;link rel="prefetch" href="/test-route-1"&gt;
&lt;link rel="prefetch" href="/test-route-2"&gt;
&lt;link rel="prefetch" href="/"&gt;
&lt;link rel="prefetch" href="/discover"&gt;</code></pre>
    </div>

    <div class="section">
        <h2>🛠️ Available Blade Directives</h2>
        <h3>Core Directives:</h3>
        <ul>
            <li><code>@resourceOptimization('page')</code> - One-stop optimization</li>
            <li><code>@preloadCritical('page')</code> - Preload critical resources</li>
        </ul>
        
        <h3>Individual Resource Types:</h3>
        <ul>
            <li><code>@preloadCss(['href' => '...', 'critical' => true])</code></li>
            <li><code>@preloadImage(['href' => '...', 'hero' => true])</code></li>
            <li><code>@preloadFont(['href' => '...'])</code></li>
            <li><code>@preloadScript(['href' => '...', 'critical' => true])</code></li>
            <li><code>@modulePreload(['href' => '...'])</code></li>
        </ul>
        
        <h3>Optimization Shortcuts:</h3>
        <ul>
            <li><code>@optimizeFonts</code> - Preload critical Google Fonts</li>
            <li><code>@optimizeHeroImages([...])</code> - Preload hero images</li>
            <li><code>@optimizeCriticalCss([...])</code> - Preload critical CSS</li>
            <li><code>@optimizeJsChunks([...])</code> - Module preload JS chunks</li>
        </ul>
        
        <h3>Prefetching:</h3>
        <ul>
            <li><code>@prefetchNavigation</code> - Auto-predict routes</li>
            <li><code>@prefetchNavigation([...])</code> - Custom routes</li>
            <li><code>@prefetchResource(['href' => '...'])</code> - Any resource</li>
        </ul>
    </div>

    <div class="section">
        <h2>⚡ Performance Benefits</h2>
        <ul>
            <li><strong>Faster LCP</strong> - Hero images load earlier</li>
            <li><strong>Reduced CLS</strong> - Fonts preloaded to prevent layout shift</li>
            <li><strong>Faster FCP</strong> - Critical CSS loads immediately</li>
            <li><strong>Smoother Navigation</strong> - Routes prefetched</li>
            <li><strong>Better TTI</strong> - Critical JS chunks preloaded</li>
        </ul>
    </div>

    <script>
        // Log performance metrics
        window.addEventListener('load', function() {
            setTimeout(() => {
                if (window.performance && window.performance.getEntriesByType) {
                    const preloadEntries = performance.getEntriesByType('navigation');
                    console.log('🚀 Resource Preloading Test Results:');
                    console.log('- Check Network tab for preload/prefetch resources');
                    console.log('- Look for resources with "High" priority');
                    console.log('- Verify crossorigin attributes on fonts');
                    console.log('- Confirm modulepreload for JavaScript chunks');
                }
            }, 1000);
        });
    </script>
</body>
</html>
