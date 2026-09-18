<?php

namespace Tests\Unit;

use App\Support\StripeUrl;
use PHPUnit\Framework\TestCase;

/**
 * Sentry JAVASCRIPT-REACT-CF / -CE, 16 Sep 2026: a shop listing whose NAME
 * carried a non-ASCII character built a product `url` Stripe refused outright,
 * so the create failed and the listing was rolled back.
 *
 * ⚠️ Unit, and it touches no database: the rule is pure string work, and a guard
 * that can only run where the feature suite runs is a guard nobody checks.
 */
class StripeUrlTest extends TestCase
{
    public function test_a_non_ascii_path_is_percent_encoded(): void
    {
        $this->assertSame(
            'https://spennypiggy.co/shop/item/caf%C3%A9-night/abc-123',
            StripeUrl::safe('https://spennypiggy.co/shop/item/café-night/abc-123')
        );
    }

    public function test_a_non_ascii_query_value_is_percent_encoded(): void
    {
        $this->assertSame(
            'https://spennypiggy.co/jane?item=%D0%BC%D0%BE%D0%B9',
            StripeUrl::safe('https://spennypiggy.co/jane?item=мой')
        );
    }

    /** ⚠️ The whole point of preserving `%XX`: encoding twice breaks the link. */
    public function test_an_already_encoded_url_is_not_encoded_a_second_time(): void
    {
        $this->assertSame(
            'https://spennypiggy.co/shop/item/caf%C3%A9/abc',
            StripeUrl::safe('https://spennypiggy.co/shop/item/caf%C3%A9/abc')
        );
    }

    /** A space is not legal unescaped either — Stripe refuses it the same way. */
    public function test_a_space_is_encoded(): void
    {
        $this->assertSame(
            'https://spennypiggy.co/shop/item/my%20thing/abc',
            StripeUrl::safe('https://spennypiggy.co/shop/item/my thing/abc')
        );
    }

    /** CONTROL: an ordinary url must come back byte-identical. */
    public function test_a_plain_ascii_url_is_untouched(): void
    {
        $url = 'https://spennypiggy.co/shop/item/my-thing/8f2c-41?a=1&b=2';

        $this->assertSame($url, StripeUrl::safe($url));
    }

    public function test_an_unusable_value_is_dropped_rather_than_sent(): void
    {
        $this->assertNull(StripeUrl::safe(null));
        $this->assertNull(StripeUrl::safe(''));
        $this->assertNull(StripeUrl::safe('/shop/item/thing/abc'));   // no scheme or host
        $this->assertNull(StripeUrl::safe('javascript:alert(1)'));    // not a web address
    }

    /**
     * 🚨 A bad image url fails the WHOLE product create, so it is dropped and the
     * product publishes without a picture. A listing with no thumbnail is a
     * cosmetic fault; a listing that cannot be created is a creator who cannot sell.
     */
    public function test_a_bad_image_is_dropped_and_the_good_ones_survive(): void
    {
        $images = StripeUrl::safeImages([
            'https://ucarecdn.com/abc/',
            'not a url',
            'https://ucarecdn.com/dé/',
        ]);

        $this->assertSame([
            'https://ucarecdn.com/abc/',
            'https://ucarecdn.com/d%C3%A9/',
        ], $images);
    }

    public function test_the_payload_sanitiser_removes_a_url_it_cannot_salvage(): void
    {
        $payload = StripeUrl::sanitiseProductPayload([
            'name' => 'Shop Item',
            'url' => 'not a url at all',
            'images' => ['https://ucarecdn.com/abc/'],
        ]);

        $this->assertArrayNotHasKey('url', $payload);
        $this->assertSame('Shop Item', $payload['name']);
        $this->assertSame(['https://ucarecdn.com/abc/'], $payload['images']);
    }

    /** CONTROL: a payload carrying neither key is handed back unchanged. */
    public function test_a_payload_with_no_url_or_images_is_unchanged(): void
    {
        $payload = ['name' => 'Shop Item', 'metadata' => ['creator_id' => 7]];

        $this->assertSame($payload, StripeUrl::sanitiseProductPayload($payload));
    }

    /** ⚠️ A host is punycoded, never percent-escaped — an escape there is not an address. */
    public function test_a_non_ascii_host_is_punycoded_or_the_url_is_dropped(): void
    {
        $safe = StripeUrl::safe('https://café.example/thing');

        if (function_exists('idn_to_ascii')) {
            $this->assertSame('https://xn--caf-dma.example/thing', $safe);
        } else {
            $this->assertNull($safe);
        }
    }
}
