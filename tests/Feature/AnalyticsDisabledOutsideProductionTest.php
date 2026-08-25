<?php

namespace Tests\Feature;

use App\Jobs\SendMeasurementProtocolEvent;
use App\Services\Analytics\MeasurementProtocol;
use App\Support\AnalyticsEvent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * 🚨 Local and dev traffic is not traffic.
 *
 * A developer clicking through a checkout twenty times is not twenty
 * checkouts, and once those events are in the property there is no way to tell
 * them from real ones — GA4 cannot delete an event it has recorded. That makes
 * this a ONE-WAY mistake, which is why the switch defaults closed and why every
 * layer checks it rather than trusting the one above.
 */
class AnalyticsDisabledOutsideProductionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The suite runs with analytics ON (see phpunit.xml) so the other tests
        // exercise real behaviour. These turn it back off.
        config()->set('analytics.enabled', false);
    }

    private function fakeRequest(): void
    {
        $request = Request::create('/checkout', 'GET', [], ['_ga' => 'GA1.1.1234567890.1650000000']);
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));

        $this->app->instance('request', $request);
    }

    /**
     * The tag is not loaded AT ALL rather than loaded and silenced — a loaded
     * gtag.js is one stray call away from writing a developer's checkout into
     * the live property.
     */
    public function test_the_google_tag_is_not_on_the_page(): void
    {
        $html = $this->get(route('login'))->assertOk()->getContent();

        $this->assertStringNotContainsString('googletagmanager.com/gtag/js', $html);
        $this->assertStringNotContainsString("gtag('config'", $html);
        $this->assertStringNotContainsString('__spAdsConversions', $html);
    }

    public function test_the_google_tag_is_on_the_page_when_enabled(): void
    {
        config()->set('analytics.enabled', true);

        $html = $this->get(route('login'))->assertOk()->getContent();

        $this->assertStringContainsString('googletagmanager.com/gtag/js', $html);
    }

    public function test_browser_events_are_not_queued(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', ['value' => 99.0]);

        $this->assertSame([], AnalyticsEvent::pull());
    }

    public function test_server_side_events_are_not_sent(): void
    {
        Queue::fake();
        config()->set('analytics.ga4.api_secret', 'a-real-looking-secret');
        $this->fakeRequest();

        MeasurementProtocol::send('begin_checkout', ['value' => 25.0]);

        Queue::assertNothingPushed();
    }

    /**
     * ⚠️ Checked again inside the job, not only at dispatch: a job can be
     * queued in one environment and run in another, and the job is the last
     * gate before a real HTTP call to Google.
     */
    public function test_a_job_that_somehow_got_queued_still_sends_nothing(): void
    {
        config()->set('analytics.ga4.api_secret', 'a-real-looking-secret');

        Http::fake();

        (new SendMeasurementProtocolEvent('1234567890.1650000000', 'purchase', ['value' => 99.0]))->handle();

        Http::assertNothingSent();
    }
}
