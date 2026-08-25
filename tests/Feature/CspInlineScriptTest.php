<?php

namespace Tests\Feature;

use App\SeoMeta;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * 🚨 CSP breakage is INVISIBLE without a test like this one.
 *
 * The policy ships report-only, so a violation costs nothing today and everything
 * on the day `SECURITY_CSP_ENFORCE` is turned on — and the two faults it catches
 * both look completely normal in a browser:
 *
 *  - an inline `on*=` attribute cannot carry a nonce (an attribute has nowhere to
 *    put one), so it is refused by `script-src-attr`. The font-preload swap in
 *    `app.blade.php` was one, and it produced 405 violations across 144 users;
 *  - an inline <script> without `$cspNonce` is refused by `script-src-elem`. The
 *    policy deliberately carries no 'unsafe-inline', because a nonce makes a
 *    browser ignore it — so "just add unsafe-inline" is not the fix.
 *
 * Neither shows up in `npm run check` (its scanners read `resources/js`, not
 * Blade) and neither fails a build.
 */
class CspInlineScriptTest extends TestCase
{
    // ⚠️ Required even though these routes touch no model: they sit in the `web`
    // group, whose shared Inertia props read the `currencies` table, so without a
    // migrated database every one of them answers 500 (same note as
    // ServiceWorkerDeliveryTest).
    use RefreshDatabase;

    /**
     * Any `on…=` handler in served markup. Deliberately broad — the point is to
     * fail on a handler nobody thought of, not on a list somebody maintains.
     */
    private const INLINE_HANDLER = '/<[^>]*\son[a-z]+\s*=\s*["\']/i';

    private function assertNoInlineHandlers(string $html, string $where): void
    {
        preg_match_all(self::INLINE_HANDLER, $html, $matches);

        $this->assertSame(
            [],
            $matches[0],
            "{$where} carries an inline event handler, which `script-src-attr` refuses "
            .'and which cannot be nonced. Attach the listener from a nonced <script> instead.'
        );
    }

    private function assertEveryInlineScriptIsNonced(string $html, string $where): void
    {
        preg_match_all('/<script\b[^>]*>/i', $html, $matches);

        $unnonced = array_values(array_filter(
            $matches[0],
            fn ($tag) => ! str_contains($tag, 'nonce=') && ! str_contains($tag, 'src=')
        ));

        $this->assertSame(
            [],
            $unnonced,
            "{$where} has an inline <script> with no nonce. `script-src` carries no "
            ."'unsafe-inline', so the block is refused."
        );
    }

    public function test_the_offline_page_substitutes_the_nonce_and_has_no_inline_handler(): void
    {
        $response = $this->get('/offline.html');

        $response->assertOk();
        $html = $response->getContent();

        // The placeholder reaching a browser means the route stopped substituting,
        // and `nonce="__CSP_NONCE__"` matches no policy — the block is dead.
        $this->assertStringNotContainsString('__CSP_NONCE__', $html);

        $this->assertNoInlineHandlers($html, 'The offline page');
        $this->assertEveryInlineScriptIsNonced($html, 'The offline page');

        // A `javascript:` URL is script under the CSP and is refused with it.
        $this->assertStringNotContainsString('href="javascript:', $html);
    }

    public function test_the_offline_page_source_keeps_its_nonce_placeholder(): void
    {
        // The route can only substitute what the file still carries, and the file
        // is plain HTML that no Blade compiler would ever warn about.
        $source = file_get_contents(resource_path('proxy/offline.html'));

        $this->assertStringContainsString('nonce="__CSP_NONCE__"', $source);
    }

    public function test_the_app_shell_nonces_every_inline_script_and_uses_no_handlers(): void
    {
        $html = view('app', [
            'page' => ['component' => 'Welcome', 'props' => [], 'url' => '/', 'version' => null],
        ])->render();

        $this->assertNoInlineHandlers($html, 'app.blade.php');
        $this->assertEveryInlineScriptIsNonced($html, 'app.blade.php');
    }

    public function test_the_maintenance_wall_nonces_its_countdown(): void
    {
        $html = view('maintenance', [
            'headline' => 'Back shortly',
            'message' => 'We are making an improvement.',
            'endsAt' => now()->addHour()->toIso8601String(),
        ])->render();

        $this->assertNoInlineHandlers($html, 'maintenance.blade.php');
        $this->assertEveryInlineScriptIsNonced($html, 'maintenance.blade.php');
    }

    public function test_seo_json_ld_carries_the_nonce(): void
    {
        // `script-src` governs JSON-LD exactly as it governs executable script —
        // the browser does not treat `application/ld+json` as exempt.
        view()->share('cspNonce', 'test-nonce-value');

        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Home', 'url' => 'https://spennypiggy.co'],
        ]);

        $html = SeoMeta::render();

        $this->assertStringContainsString('application/ld+json', $html);
        $this->assertStringContainsString('nonce="test-nonce-value"', $html);
        $this->assertEveryInlineScriptIsNonced($html, 'SeoMeta::render()');
    }

    public function test_seo_render_still_works_with_no_nonce_shared(): void
    {
        // Console commands and the sitemap render tags with no request in flight.
        // An SEO helper must never be the thing that breaks them.
        view()->share('cspNonce', null);

        SeoMeta::addBreadcrumbJsonLd([
            ['name' => 'Home', 'url' => 'https://spennypiggy.co'],
        ]);

        $this->assertStringContainsString('application/ld+json', SeoMeta::render());
    }

    /**
     * Every Blade this app can serve. Rendering each one needs its own props, so this
     * scan reads the SOURCE — which is also where a new violation gets introduced.
     *
     * ⚠️ Blade comments are stripped first: `app.blade.php`'s own docblocks quote the
     * patterns being searched for, and a commented-out tag is not shipped markup.
     */
    private function bladeSources(): array
    {
        $sources = [];

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(resource_path('views'))
        );

        foreach ($iterator as $file) {
            if (! $file->isFile() || ! str_ends_with($file->getFilename(), '.blade.php')) {
                continue;
            }

            $name = str_replace(resource_path('views').'/', '', $file->getPathname());

            $sources[$name] = preg_replace(
                '/\{\{--.*?--\}\}/s',
                '',
                file_get_contents($file->getPathname())
            );
        }

        ksort($sources);

        return $sources;
    }

    public function test_every_inline_script_in_every_blade_carries_the_nonce(): void
    {
        $offenders = [];

        foreach ($this->bladeSources() as $name => $source) {
            preg_match_all('/<script\b[^>]*>/i', $source, $matches);

            foreach ($matches[0] as $tag) {
                if (! str_contains($tag, 'nonce') && ! str_contains($tag, 'src=')) {
                    $offenders[] = $name;
                }
            }
        }

        $this->assertSame(
            [],
            array_values(array_unique($offenders)),
            "An inline <script> with no nonce. `script-src` carries no 'unsafe-inline', "
            .'so the block is refused. Add nonce="{{ $cspNonce ?? \'\' }}".'
        );
    }

    public function test_no_blade_carries_an_inline_event_handler(): void
    {
        $offenders = [];

        foreach ($this->bladeSources() as $name => $source) {
            if (preg_match(self::INLINE_HANDLER, $source)) {
                $offenders[] = $name;
            }
        }

        $this->assertSame(
            [],
            $offenders,
            '`script-src-attr` refuses inline event handlers and they cannot be nonced. '
            .'Attach the listener from a nonced <script> instead.'
        );
    }
}
