<?php

namespace Tests\Feature;

use App\Jobs\SendMeasurementProtocolEvent;
use App\Services\AbandonedCheckoutService;
use App\Services\Analytics\MeasurementProtocol;
use Illuminate\Contracts\Bus\Dispatcher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Queue;
use Tests\TestCase;

/**
 * The half of the funnel the browser cannot report.
 *
 * A checkout and Connect onboarding both redirect OUT of the app, and the
 * visitor who abandons never comes back — which is precisely the visitor these
 * events exist to count. So they go straight from the server to GA4.
 */
class AnalyticsServerSideEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config()->set('analytics.ga4.api_secret', 'test-secret');
        config()->set('analytics.ga4.measurement_id', 'G-TEST');
    }

    /** Bind a request carrying the GA cookie Google's own JavaScript writes. */
    private function requestWithGaCookie(string $cookie = 'GA1.1.1234567890.1650000000'): void
    {
        $request = Request::create('/checkout', 'GET', [], ['_ga' => $cookie]);
        $this->app->instance('request', $request);
    }

    public function test_an_event_is_queued_with_the_visitors_client_id(): void
    {
        Queue::fake();
        $this->requestWithGaCookie();

        MeasurementProtocol::send('begin_checkout', ['value' => 25.0, 'currency' => 'GBP']);

        Queue::assertPushed(SendMeasurementProtocolEvent::class);
    }

    /**
     * ⚠️ The client id is what joins the event to the browsing session that
     * produced it. GA4 would accept an invented one and file the checkout as a
     * session with no page view — worse than the gap it was filling.
     */
    public function test_nothing_is_sent_without_a_usable_client_id(): void
    {
        Queue::fake();

        $this->requestWithGaCookie('not-a-ga-cookie');
        MeasurementProtocol::send('begin_checkout');

        $this->app->instance('request', Request::create('/checkout', 'GET'));
        MeasurementProtocol::send('begin_checkout');

        Queue::assertNothingPushed();
    }

    /** The GA4 client id is the last two segments of the `_ga` cookie. */
    public function test_the_client_id_is_read_out_of_the_ga_cookie(): void
    {
        $this->requestWithGaCookie();

        $this->assertSame('1234567890.1650000000', MeasurementProtocol::clientId());
    }

    /** An unconfigured secret disables the sender — it must never throw on a payment path. */
    public function test_it_is_silent_and_safe_when_unconfigured(): void
    {
        Queue::fake();
        config()->set('analytics.ga4.api_secret', null);
        $this->requestWithGaCookie();

        MeasurementProtocol::send('begin_checkout');

        Queue::assertNothingPushed();
    }

    /** 🚨 Same privacy filter as the browser path — one rule, both senders. */
    public function test_identifying_parameters_never_reach_the_queue(): void
    {
        Queue::fake();
        $this->requestWithGaCookie();

        MeasurementProtocol::send('begin_checkout', [
            'value' => 25.0,
            'guest_email' => 'someone@example.com',
            'user_id' => 7,
        ]);

        Queue::assertPushed(SendMeasurementProtocolEvent::class, function ($job) {
            $params = (fn () => $this->params)->call($job);

            return $params === ['value' => 25.0];
        });
    }

    /**
     * The choke point: all nine checkout paths call `record()` right after
     * creating their Stripe session, so this is where a checkout START is seen.
     */
    public function test_recording_a_checkout_reports_begin_checkout(): void
    {
        Queue::fake();
        $this->requestWithGaCookie();

        AbandonedCheckoutService::record(
            (object) [
                'id' => 'cs_test_123',
                'url' => 'https://checkout.stripe.com/c/pay/cs_test_123',
                'amount_total' => 2500,
                'currency' => 'gbp',
                'expires_at' => now()->addHour()->timestamp,
            ],
            'wish',
            null,
            1,
            null,
            'guest@example.com',
        );

        Queue::assertPushed(SendMeasurementProtocolEvent::class, function ($job) {
            $name = (fn () => $this->eventName)->call($job);
            $params = (fn () => $this->params)->call($job);

            return $name === 'begin_checkout'
                && $params['value'] === 25.0
                && $params['currency'] === 'GBP'
                && $params['product_type'] === 'wish'
                && $params['guest'] === 'true';
        });
    }

    /** A checkout we could not record is not a checkout that started. */
    public function test_a_session_with_no_url_reports_nothing(): void
    {
        Queue::fake();
        $this->requestWithGaCookie();

        AbandonedCheckoutService::record(
            (object) ['id' => 'cs_test_456', 'amount_total' => 2500, 'currency' => 'gbp'],
            'wish',
            null,
            1,
        );

        Queue::assertNothingPushed();
    }

    /**
     * 🚨 Nothing on this path may break a checkout. The dispatcher itself is
     * made to fail here, because "the queue is unavailable" is the realistic
     * way this goes wrong in production and it must cost the payment nothing.
     */
    public function test_a_broken_send_never_throws(): void
    {
        $this->requestWithGaCookie();

        $this->app->bind(Dispatcher::class, function () {
            throw new \RuntimeException('queue is down');
        });

        MeasurementProtocol::send('begin_checkout', ['value' => 1]);

        $this->assertTrue(true, 'send() swallowed the dispatcher failure.');
    }
}
