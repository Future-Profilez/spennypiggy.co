<?php

namespace Tests\Feature;

use Tests\TestCase;

/**
 * Sentry JAVASCRIPT-REACT-CF / -CE (16 Sep 2026).
 *
 * ⚠️ A SOURCE SCAN, deliberately. Reaching the failure needs Stripe to refuse a
 * real product create on a live connected account; what has to be pinned is that
 * the two chokepoints still sanitise, and that the shop url still names a route
 * that exists. Neither is visible to any route test.
 */
class StripeProductUrlWiringTest extends TestCase
{
    private function source(string $path): string
    {
        $code = file_get_contents(base_path($path));

        // Comments are blanked first — these files NAME the thing being guarded
        // in their own docblocks, which would pass the scan for the wrong reason.
        return (string) preg_replace(['#/\*.*?\*/#s', '#//[^\n]*#'], '', $code);
    }

    public function test_create_product_sanitises_its_payload(): void
    {
        $code = $this->source('app/StripeControl.php');

        $start = strpos($code, 'function createProduct(');
        $this->assertNotFalse($start, 'StripeControl::createProduct has moved or been renamed.');

        $body = substr($code, $start, 900);

        $this->assertStringContainsString(
            'StripeUrl::sanitiseProductPayload($payload)',
            $body,
            'createProduct must sanitise `url` and `images` before calling Stripe — a raw '
            .'non-ASCII byte fails the whole create and the creator cannot publish.'
        );

        $this->assertLessThan(
            strpos($body, 'products->create('),
            strpos($body, 'StripeUrl::sanitiseProductPayload($payload)'),
            'The sanitiser must run BEFORE the Stripe call, not after it.'
        );
    }

    public function test_the_product_update_path_sanitises_too(): void
    {
        $code = $this->source('app/StripeControl.php');

        $start = strpos($code, 'function updateSubscription(');
        $this->assertNotFalse($start, 'StripeControl::updateSubscription has moved or been renamed.');

        $this->assertStringContainsString(
            'StripeUrl::sanitiseProductPayload($payload)',
            substr($code, $start, 900),
            'updateSubscription updates a PRODUCT and carries the same creator-built url.'
        );
    }

    /**
     * 🚨 `/shop/{slug}/{uuid}` IS NOT A ROUTE — `shop/item/{slug}/{uuid}` is.
     * Both product payloads pointed at the first one, so every shop product link
     * in every creator's Stripe dashboard answered 404.
     */
    public function test_the_shop_product_url_names_a_route_that_exists(): void
    {
        $code = $this->source('app/Http/Controllers/Auth/ShopsController.php');

        $this->assertStringNotContainsString(
            '"/shop/$slug/',
            $code,
            'That path has no route. Use /shop/item/{slug}/{uuid} (single-shop-list).'
        );

        $this->assertSame(
            2,
            substr_count($code, '/shop/item/$slug/$shop->uuid'),
            'Both the create and the update payload must point at the real item route.'
        );

        $this->assertNotNull(
            app('router')->getRoutes()->getByName('single-shop-list'),
            'The route the product url points at must still be registered.'
        );
    }

    /**
     * 🚨 The create slugged spaces to `-` and the update to `_`, so editing an item
     * silently moved the url Stripe holds for it.
     */
    public function test_both_shop_payloads_build_the_slug_the_same_way(): void
    {
        $code = $this->source('app/Http/Controllers/Auth/ShopsController.php');

        $this->assertSame(
            2,
            substr_count($code, '$slug = self::itemSlug('),
            'Both payloads must share one slug rule.'
        );

        $this->assertStringNotContainsString("str_replace(' ', '_', \$shop->name)", $code);
        $this->assertStringNotContainsString("str_replace(' ', '-', \$shop->name)", $code);
    }
}
