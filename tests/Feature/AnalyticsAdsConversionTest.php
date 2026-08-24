<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Ads conversion map that `app.blade.php` publishes to the page.
 *
 * 🚨 Google Ads had never received a conversion from this site — every action in
 * the account reads 0.00 and the website-sourced `Sign-up` action had gone
 * Inactive for want of one. These pin the two halves of the fix: the map
 * reaches the page when labels are configured, and NOTHING reaches it when they
 * are not.
 */
class AnalyticsAdsConversionTest extends TestCase
{
    use RefreshDatabase;

    public function test_configured_labels_are_published_to_the_page(): void
    {
        config()->set('analytics.ads.conversion_id', 'AW-123');
        config()->set('analytics.ads.labels', [
            'sign_up' => 'SignUpLabel',
            'purchase' => 'PurchaseLabel',
        ]);

        $response = $this->get(route('login'));

        $response->assertOk();

        // 🚨 Position, not just presence. A Blade edit once put this block ABOVE
        // `<!DOCTYPE html>`, where it still rendered and still satisfied a bare
        // assertSee — while every page on the site shipped markup before its own
        // doctype. Assert the document still starts where a document starts.
        $this->assertStringStartsWith('<!DOCTYPE html>', ltrim($response->getContent()));

        $response->assertSee('__spAdsConversions', false);
        $response->assertSee('AW-123\/SignUpLabel', false);
        $response->assertSee('AW-123\/PurchaseLabel', false);
    }

    /**
     * ⚠️ A wrong or missing label files a conversion against the wrong action,
     * which is worse than filing none — so an unconfigured label publishes
     * nothing rather than a half-formed target.
     */
    public function test_nothing_is_published_when_no_label_is_configured(): void
    {
        config()->set('analytics.ads.labels', []);

        $response = $this->get(route('login'));

        $response->assertOk();
        $response->assertDontSee('__spAdsConversions', false);
    }

    /** One label configured must not publish the other as a broken target. */
    public function test_only_configured_labels_appear(): void
    {
        config()->set('analytics.ads.conversion_id', 'AW-123');
        config()->set('analytics.ads.labels', ['sign_up' => 'SignUpLabel']);

        $response = $this->get(route('login'));

        $response->assertSee('AW-123\/SignUpLabel', false);
        // The word "purchase" appears all over a real page; what must be absent
        // is a purchase CONVERSION TARGET.
        $response->assertDontSee('PurchaseLabel', false);
        $response->assertDontSee('"purchase"', false);
    }
}
