<?php

namespace Tests\Feature;

use App\Jobs\SendXConversion;
use App\Services\Analytics\XConversionsApi;
use App\Services\VisitTracker;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * X (Twitter) Ads conversions.
 *
 * 🚨 ONE EVENT, ONE ROUTE. The pixel reports `sign_up` and `purchase`; the
 * Conversions API reports `begin_checkout` and `stripe_connect_started`, which
 * redirect away to Stripe and can never reach the pixel. X deduplicates the two
 * routes only when both carry the same `conversion_id`, so keeping them
 * disjoint is what stops a conversion being counted twice.
 */
class AnalyticsXAdsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('analytics.x.pixel_id', 'ozu4h');
        config()->set('analytics.x.api_token', 'test-token');
        config()->set('analytics.x.events', [
            'sign_up' => 'tw-ozu4h-signup',
            'purchase' => 'tw-ozu4h-purchase',
            'begin_checkout' => 'tw-ozu4h-checkout',
        ]);
    }

    private function requestWithClickId(?string $twclid = 'abc123XYZ'): void
    {
        $cookies = $twclid === null ? [] : [VisitTracker::TWCLID_COOKIE => $twclid];

        $this->app->instance('request', Request::create('/checkout', 'GET', [], $cookies));
    }

    public function test_a_conversion_is_queued_with_the_click_id(): void
    {
        Queue::fake();
        $this->requestWithClickId();

        XConversionsApi::send('begin_checkout', ['value' => 25.0, 'currency' => 'GBP'], 'checkout-cs_1');

        Queue::assertPushed(SendXConversion::class, function ($job) {
            return (fn () => $this->twclid)->call($job) === 'abc123XYZ'
                && (fn () => $this->eventId)->call($job) === 'tw-ozu4h-checkout'
                && (fn () => $this->conversionId)->call($job) === 'checkout-cs_1';
        });
    }

    /**
     * 🚨 X also accepts a hashed email or an IP + user-agent pair. Both are
     * personal data going to a third party, and that is a decision for the
     * client and their legal advice — not a default this code makes quietly.
     * A conversion with no identifier could not be attributed to an advert
     * anyway.
     */
    public function test_nothing_is_sent_without_a_click_id(): void
    {
        Queue::fake();
        $this->requestWithClickId(null);

        XConversionsApi::send('begin_checkout', ['value' => 25.0]);

        Queue::assertNothingPushed();
    }

    /** An event with no id in the map is a deliberate "do not report". */
    public function test_an_unmapped_event_is_not_reported(): void
    {
        Queue::fake();
        $this->requestWithClickId();

        XConversionsApi::send('stripe_connect_started');

        Queue::assertNothingPushed();
    }

    public function test_it_is_silent_when_unconfigured(): void
    {
        Queue::fake();
        config()->set('analytics.x.api_token', null);
        $this->requestWithClickId();

        XConversionsApi::send('begin_checkout', ['value' => 25.0]);

        Queue::assertNothingPushed();
    }

    /** Local and dev traffic is not traffic — see config/analytics.php. */
    public function test_nothing_is_sent_when_analytics_is_disabled(): void
    {
        Queue::fake();
        config()->set('analytics.enabled', false);
        $this->requestWithClickId();

        XConversionsApi::send('begin_checkout', ['value' => 25.0]);

        Queue::assertNothingPushed();
    }

    public function test_the_job_posts_the_documented_shape(): void
    {
        Http::fake(['ads-api.x.com/*' => Http::response(['errors' => []], 200)]);

        (new SendXConversion(
            'tw-ozu4h-checkout',
            'abc123XYZ',
            25.0,
            'GBP',
            'checkout-cs_1',
            '2026-08-23T12:34:56.000Z'
        ))->handle();

        Http::assertSent(function ($request) {
            $body = $request->data()['conversions'][0];

            return str_contains($request->url(), '/measurement/conversions/ozu4h')
                && $request->hasHeader('X-Pixel-Token', 'test-token')
                && $body['event_id'] === 'tw-ozu4h-checkout'
                && $body['conversion_id'] === 'checkout-cs_1'
                && $body['identifiers'][0]['twclid'] === 'abc123XYZ'
                // 🚨 The click id is the ONLY identifier. No hashed email, no
                // IP, no user agent.
                && array_keys($body['identifiers'][0]) === ['twclid'];
        });
    }

    /**
     * ⚠️ Checked again inside the job: a job can be queued in one environment
     * and run in another, and this is the last gate before a real HTTP call
     * carrying a live ad-account credential.
     */
    public function test_the_job_sends_nothing_when_analytics_is_disabled(): void
    {
        Http::fake();
        config()->set('analytics.enabled', false);

        (new SendXConversion('tw-ozu4h-checkout', 'abc', 1.0, 'GBP', 'c1', '2026-08-23T12:34:56.000Z'))->handle();

        Http::assertNothingSent();
    }

    /** The click id arrives in the URL and is remembered first-touch. */
    public function test_the_click_id_is_captured_from_the_url(): void
    {
        $response = $this->get('/?twclid=FromTheAdvert123');

        $response->assertCookie(VisitTracker::TWCLID_COOKIE, 'FromTheAdvert123');
    }

    /**
     * 🚨 First touch, never overwritten. The last click before a checkout is
     * almost never the advert that started the journey.
     */
    public function test_a_later_click_does_not_overwrite_the_first(): void
    {
        $this->withCookie(VisitTracker::TWCLID_COOKIE, 'TheFirstOne')
            ->get('/?twclid=ALaterOne')
            ->assertCookieMissing(VisitTracker::TWCLID_COOKIE);
    }

    /**
     * 🚨 Attacker-supplied text on its way into a cookie and then into a
     * request body sent to X.
     */
    public function test_a_malformed_click_id_is_refused(): void
    {
        $this->get('/?twclid='.urlencode('"><script>alert(1)</script>'))
            ->assertCookieMissing(VisitTracker::TWCLID_COOKIE);
    }
}
