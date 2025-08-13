# Critical CSS Implementation Guide

## Overview

This implementation provides comprehensive critical CSS extraction and inlining for the SpennyPiggy application to improve Core Web Vitals, particularly First Contentful Paint (FCP) and Largest Contentful Paint (LCP).

## Architecture

### Components

1. **Vite Plugin** (`vite-plugins/critical-css.js`)
   - Uses Critters for build-time critical CSS extraction
   - Automatically inlines critical styles in HTML
   - Defers non-critical stylesheets

2. **Laravel Service** (`app/Services/CriticalCssService.php`)
   - Runtime critical CSS extraction
   - Template-specific selector targeting
   - CSS minification and caching

3. **Blade Directives** (`app/Providers/CriticalCssServiceProvider.php`)
   - `@criticalCss()` - Inlines critical styles
   - `@deferCss()` - Defers non-critical stylesheets

4. **Artisan Command** (`app/Console/Commands/GenerateCriticalCss.php`)
   - CLI tool for generating critical CSS files
   - Uses Penthouse for advanced extraction
   - Supports batch processing

## Usage

### Development

```bash
# Start development server (critical CSS disabled)
npm run dev

# Generate critical CSS during development
npm run critical:generate
```

### Production Build

```bash
# Build with critical CSS optimization
npm run build:critical

# Or build normally (critical CSS plugin runs automatically)
npm run build
```

### Manual Critical CSS Generation

```bash
# Generate for all templates
php artisan css:critical

# Generate for specific template
php artisan css:critical --template=home

# Generate using Node.js/Penthouse
npm run critical:penthouse
```

## Template Configuration

### Adding New Templates

1. **Update CriticalCssService**:
```php
private function getCriticalSelectorsForTemplate(string $template): array
{
    $templateSelectors = match($template) {
        'your-template' => [
            '.your-critical-selector',
            '.another-critical-class'
        ],
        // ...
    };
}
```

2. **Update the Artisan Command**:
```php
$templates = ['home', 'dashboard', 'profile', 'login', 'register', 'your-template'];
```

### Critical Selector Guidelines

**Always Include:**
- Above-the-fold layout styles
- Typography for main headings
- Primary button styles
- Navigation styles
- Loading states

**Avoid Including:**
- Below-the-fold content
- Animation styles (unless critical)
- Complex responsive styles for large screens
- Non-essential decorative elements

## Performance Optimization

### Current Optimizations

1. **Critical CSS Inlining**
   - Above-the-fold styles inlined in `<head>`
   - Reduces render-blocking requests

2. **Non-critical CSS Deferring**
   - Uses `media="print"` + `onload` swap technique
   - Includes `<noscript>` fallback

3. **Font Loading Optimization**
   - Google Fonts loaded asynchronously
   - Critical font weights prioritized

4. **Caching**
   - Critical CSS cached for 1 hour
   - Build-time generation reduces runtime overhead

### Expected Improvements

- **FCP**: 15-30% improvement
- **LCP**: 10-25% improvement  
- **CLS**: Minimal impact (fonts handled properly)
- **Overall Performance Score**: 10-20 point increase

## File Structure

```
├── vite-plugins/
│   └── critical-css.js           # Vite plugin for build-time processing
├── app/
│   ├── Services/
│   │   └── CriticalCssService.php # Main service class
│   ├── Providers/
│   │   └── CriticalCssServiceProvider.php # Blade directives
│   └── Console/Commands/
│       └── GenerateCriticalCss.php # Artisan command
├── scripts/
│   ├── build-with-critical-css.sh # Build script
│   └── generate-critical-css.js   # Node.js generation script
├── storage/app/critical-css/      # Generated critical CSS files
│   ├── home.css
│   ├── dashboard.css
│   └── ...
└── resources/views/
    └── app.blade.php             # Updated template with directives
```

## Deployment

### CI/CD Integration

Update your deployment pipeline:

```yaml
# Example GitHub Actions
- name: Build with Critical CSS
  run: npm run build:critical

# Example Laravel Vapor
vapor:
  build:
    - npm run build:critical
```

### Environment Variables

No additional environment variables required. The system automatically detects:
- Production vs development environment
- Available CSS files from Vite manifest
- Laravel application context

## Monitoring

### Performance Metrics to Track

1. **Core Web Vitals**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

2. **Resource Metrics**
   - CSS bundle size
   - Critical CSS size
   - Number of render-blocking resources

3. **User Experience**
   - Time to Interactive (TTI)
   - Speed Index
   - Total Blocking Time (TBT)

### Lighthouse Audits

Run regular Lighthouse audits:

```bash
# Install Lighthouse CLI
npm install -g lighthouse

# Audit homepage
lighthouse https://yourapp.com --output=json --output-path=./lighthouse-home.json

# Audit dashboard
lighthouse https://yourapp.com/dashboard --output=json --output-path=./lighthouse-dashboard.json
```

## Troubleshooting

### Common Issues

1. **Critical CSS Not Loading**
   - Check if service provider is registered
   - Verify blade directives are working
   - Ensure critical CSS files exist in storage

2. **Styles Missing on Load**
   - Verify critical selectors include all above-the-fold styles
   - Check if non-critical CSS is being deferred properly
   - Test with JavaScript disabled

3. **Build Errors**
   - Ensure Node.js dependencies are installed
   - Check Vite plugin configuration
   - Verify file permissions on scripts

### Debug Mode

Enable debug logging in `CriticalCssService`:

```php
// Add to .env
LOG_LEVEL=debug

// Service will log critical CSS extraction details
```

## Best Practices

### CSS Architecture

1. **Organize Critical Styles**
   - Keep above-the-fold styles together
   - Use CSS custom properties for theming
   - Minimize specificity in critical styles

2. **Template Structure**
   - Consistent layout patterns across templates
   - Semantic HTML for better selector targeting
   - Progressive enhancement approach

3. **Performance Budget**
   - Critical CSS: < 14KB (recommended)
   - Total CSS bundle: Monitor and optimize
   - Regular performance audits

### Development Workflow

1. **Local Testing**
   - Test with and without critical CSS
   - Verify fallback behavior
   - Check different viewport sizes

2. **Staging Validation**
   - Full Lighthouse audit suite
   - Cross-browser testing
   - Performance regression testing

3. **Production Monitoring**
   - Real User Monitoring (RUM)
   - Core Web Vitals tracking
   - Error logging for CSS loading issues

## Advanced Configuration

### Custom Extraction Rules

Modify the Penthouse configuration in `generate-critical-css.js`:

```javascript
const criticalCSS = await penthouse({
  url: options.url,
  css: options.css,
  width: 1300,
  height: 900,
  forceInclude: [
    // Add your custom selectors
    '.always-critical',
    '[data-critical]'
  ],
  forceExclude: [
    // Exclude non-critical patterns
    '.animation-*',
    '.modal-*'
  ]
});
```

### Template-specific Configuration

Create template-specific extraction rules:

```php
// In CriticalCssService.php
private function getTemplateSpecificConfig(string $template): array
{
    return match($template) {
        'home' => [
            'viewport' => ['width' => 1200, 'height' => 800],
            'forceInclude' => ['.hero-*', '.cta-*'],
            'maxSize' => 12000 // 12KB limit for homepage
        ],
        'dashboard' => [
            'viewport' => ['width' => 1400, 'height' => 900],  
            'forceInclude' => ['.sidebar-*', '.chart-*'],
            'maxSize' => 15000 // 15KB limit for dashboard
        ]
    ];
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Lighthouse audit results
3. Test with browser dev tools
4. Contact the development team with specific error details
