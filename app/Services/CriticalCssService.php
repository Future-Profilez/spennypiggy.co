<?php

namespace App\Services;

use Illuminate\Support\Facades\File;

class CriticalCssService
{
    private array $criticalStyles = [];

    private array $deferredStyles = [];

    /**
     * Extract and inline critical CSS for above-the-fold content
     */
    public function inline(string $template): string
    {
        $criticalCssPath = $this->getCriticalCssPath($template);

        if (File::exists($criticalCssPath)) {
            $criticalCss = File::get($criticalCssPath);

            return "<style data-critical=\"{$template}\">{$criticalCss}</style>";
        }

        // Fallback: extract from main app.css for critical selectors
        return $this->extractCriticalFromMainCss($template);
    }

    /**
     * Defer non-critical stylesheets with media swap technique
     */
    public function defer(string $stylesheetPath): string
    {
        $assetPath = asset($stylesheetPath);

        /*
         * 🚨 NO `onload=` ATTRIBUTE. An inline event handler is governed by
         * `script-src-attr`, which cannot carry a nonce, so the CSP this app ships
         * refuses it — the stylesheet loads and is then never applied. Same fault
         * that put 405 violations on the font preload in `app.blade.php`; fixed
         * here too because `@deferCss` is registered and would reintroduce it the
         * first time somebody used it.
         *
         * `media="print"` is the attribute-free equivalent, swapped by the site's
         * own script. ⚠️ The `.sheet` check is not optional — the stylesheet can
         * finish loading before the swap runs, and a bare `load` listener would
         * then wait for an event that has already fired.
         */
        $nonce = view()->shared('cspNonce', '');
        $id = 'sp-deferred-css-'.substr(md5($assetPath), 0, 8);

        return sprintf(
            '<link id="%1$s" rel="stylesheet" media="print" href="%2$s">
            <script%3$s>(function(){var l=document.getElementById(%4$s);if(!l)return;var s=function(){l.media="all";};if(l.sheet){s();}else{l.addEventListener("load",s,{once:true});}})();</script>
            <noscript><link rel="stylesheet" href="%2$s"></noscript>',
            $id,
            $assetPath,
            is_string($nonce) && $nonce !== '' ? ' nonce="'.htmlspecialchars($nonce, ENT_QUOTES, 'UTF-8').'"' : '',
            json_encode($id)
        );
    }

    /**
     * Extract critical CSS from main stylesheet based on template
     */
    private function extractCriticalFromMainCss(string $template): string
    {
        $mainCssPath = public_path('build/assets/app.css');

        if (! File::exists($mainCssPath)) {
            return '';
        }

        $css = File::get($mainCssPath);
        $criticalSelectors = $this->getCriticalSelectorsForTemplate($template);

        return $this->extractSelectorsFromCss($css, $criticalSelectors);
    }

    /**
     * Get critical CSS selectors for specific template
     */
    private function getCriticalSelectorsForTemplate(string $template): array
    {
        $baseSelectors = [
            'body',
            'html',
            '.font-poppins',
            '.font-anton',
            '.headingLg',
            '.headingMd',
            '.headingSm',
            '.btn-pink',
            '.btn-mint',
            '.shadow-mint',
            '.shadow-[4px_4px_0px_0px_#FF007F]lack',
        ];

        // Template-specific critical selectors
        $templateSelectors = match ($template) {
            'home' => [
                '.landing-bottom-bar',
                '.profile-image',
                '.wish-item-box',
                '.funpart',
                '.max-width-*',
                '[data-aos]',
            ],
            'dashboard' => [
                '.dashboard-memeber',
                '.data-memeber',
                '.static-chart',
                '.rank_lists',
                '.changePeriod',
            ],
            'profile' => [
                '.profile-content',
                '.rank-position',
                '.postions',
                '.profile-image',
            ],
            default => []
        };

        return array_merge($baseSelectors, $templateSelectors);
    }

    /**
     * Extract specific selectors from CSS content
     */
    private function extractSelectorsFromCss(string $css, array $selectors): string
    {
        $criticalCss = '';

        foreach ($selectors as $selector) {
            // Handle wildcard selectors
            if (str_contains($selector, '*')) {
                $pattern = '/'.preg_quote($selector, '/').'/';
                $pattern = str_replace('\*', '[^{]*', $pattern);
                preg_match_all($pattern.'{[^}]*}/', $css, $matches);
                $criticalCss .= implode('', $matches[0]);
            } else {
                // Exact selector match
                $escapedSelector = preg_quote($selector, '/');
                preg_match('/'.$escapedSelector.'\s*{[^}]*}/', $css, $matches);
                if (isset($matches[0])) {
                    $criticalCss .= $matches[0];
                }
            }
        }

        return $this->minifyCss($criticalCss);
    }

    /**
     * Get path to pre-generated critical CSS file
     */
    private function getCriticalCssPath(string $template): string
    {
        return storage_path("app/critical-css/{$template}.css");
    }

    /**
     * Minify CSS content
     */
    private function minifyCss(string $css): string
    {
        // Remove comments
        $css = preg_replace('!/\*[^*]*\*+([^/][^*]*\*+)*/!', '', $css);

        // Remove extra whitespace and line breaks
        $css = str_replace(["\r\n", "\r", "\n", "\t", '  ', '    ', '    '], '', $css);

        // Remove whitespace around certain characters
        $css = preg_replace('/\s*([{}|:;,>+~])\s*/', '$1', $css);

        return trim($css);
    }

    /**
     * Generate critical CSS files for all templates
     */
    public function generateCriticalCssFiles(): void
    {
        $templates = ['home', 'dashboard', 'profile', 'login', 'register'];

        foreach ($templates as $template) {
            $this->generateCriticalCssForTemplate($template);
        }
    }

    /**
     * Generate critical CSS for specific template
     */
    private function generateCriticalCssForTemplate(string $template): void
    {
        $criticalCss = $this->extractCriticalFromMainCss($template);
        $outputPath = $this->getCriticalCssPath($template);

        // Ensure directory exists
        File::ensureDirectoryExists(dirname($outputPath));

        File::put($outputPath, $criticalCss);
    }
}
