<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * dev.spennypiggy.co was fully indexed by Google — the same pages as production,
 * competing with it in results and showing unreleased work to anyone who found
 * it. These assert the fix and, more importantly, the shape of it: the crawl
 * stays OPEN on a non-indexable host, because a page Google cannot crawl is a
 * page whose noindex Google never reads, and it keeps its existing listing
 * indefinitely. Blocking the crawler is the intuitive fix and it is the wrong one.
 */
class NonProductionNoIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_non_indexable_host_serves_a_noindex_header_on_every_page(): void
    {
        config(['seo.indexable' => false]);

        $this->get('/')
            ->assertOk()
            ->assertHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    }

    public function test_production_carries_no_such_header(): void
    {
        config(['seo.indexable' => true]);

        $response = $this->get('/')->assertOk();

        $this->assertNull(
            $response->headers->get('X-Robots-Tag'),
            'Production must not send a blanket noindex header.'
        );
    }

    public function test_a_non_indexable_host_still_allows_crawling(): void
    {
        config(['seo.indexable' => false]);

        $robots = $this->get('/robots.txt')->assertOk()->getContent();

        // The load-bearing assertion. `Disallow: /` here would freeze every
        // already-indexed dev URL in the results forever.
        $this->assertStringContainsString('Allow: /', $robots);
        $this->assertStringNotContainsString('Disallow: /', $robots);
    }

    public function test_a_non_indexable_host_advertises_no_sitemaps(): void
    {
        config(['seo.indexable' => false]);

        $robots = $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertStringNotContainsString('Sitemap:', $robots);
    }

    public function test_production_robots_still_lists_its_sitemaps_and_disallows(): void
    {
        config(['seo.indexable' => true]);

        $robots = $this->get('/robots.txt')->assertOk()->getContent();

        $this->assertStringContainsString('Sitemap:', $robots);
        $this->assertStringContainsString('Disallow: /admin/', $robots);
    }

    public function test_the_default_is_production_only(): void
    {
        // The whole feature rests on this default being right — an environment
        // that forgets to set anything must land on "not indexable", never on
        // "indexable because nobody said otherwise".
        $this->assertFalse(
            (bool) config('seo.indexable'),
            'The testing environment must not be indexable by default.'
        );
    }
}
