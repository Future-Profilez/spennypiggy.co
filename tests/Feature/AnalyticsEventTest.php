<?php

namespace Tests\Feature;

use App\Support\AnalyticsEvent;
use Illuminate\Http\Request;
use Illuminate\Session\ArraySessionHandler;
use Illuminate\Session\Store;
use Tests\TestCase;

class AnalyticsEventTest extends TestCase
{
    /** Bind a request with a real session, the way a web request arrives. */
    private function fakeRequest(string $uri = '/dashboard'): Request
    {
        $request = Request::create($uri, 'GET');
        $request->setLaravelSession(new Store('test', new ArraySessionHandler(120)));

        $this->app->instance('request', $request);

        return $request;
    }

    public function test_a_pushed_event_comes_back_once_and_then_is_gone(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('sign_up', ['method' => 'email']);

        $events = AnalyticsEvent::pull();

        $this->assertCount(1, $events);
        $this->assertSame('sign_up', $events[0]['name']);
        $this->assertSame('email', $events[0]['params']['method']);
        $this->assertNotEmpty($events[0]['id']);

        // Pulled means delivered. A second render must not re-count the signup.
        $this->assertSame([], AnalyticsEvent::pull());
    }

    public function test_several_events_in_one_request_all_survive(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('sign_up');
        AnalyticsEvent::push('email_verified');

        $names = array_column(AnalyticsEvent::pull(), 'name');

        $this->assertSame(['sign_up', 'email_verified'], $names);
    }

    public function test_the_queue_is_capped(): void
    {
        $this->fakeRequest();

        foreach (range(1, 20) as $i) {
            AnalyticsEvent::push('purchase', ['n' => $i]);
        }

        $this->assertLessThanOrEqual(5, count(AnalyticsEvent::pull()));
    }

    /**
     * The webhook creates the same Deliverable rows the browser redirect does.
     * Flashing an event into its session would be invisible at best.
     */
    public function test_machine_to_machine_requests_queue_nothing(): void
    {
        $this->fakeRequest('/webhook/payment');

        AnalyticsEvent::push('purchase', ['value' => 10.0]);

        $this->assertSame([], AnalyticsEvent::pull());
    }

    /**
     * 🚨 Event parameters are sent to Google. A key whose NAME suggests it
     * identifies a person is dropped whole.
     */
    public function test_identifying_parameters_never_survive(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', [
            'value' => 25.0,
            'currency' => 'GBP',
            'email' => 'someone@example.com',
            'user_id' => 42,
            'customer_name' => 'Real Person',
            'payment_intent_id' => 'pi_123',
            'stripe_token' => 'tok_123',
        ]);

        $params = AnalyticsEvent::pull()[0]['params'];

        $this->assertSame(['value' => 25.0, 'currency' => 'GBP'], $params);
    }

    /** GA4 takes scalars only, and a nested payload is how a whole model leaks. */
    public function test_non_scalar_parameters_are_dropped(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', [
            'value' => 5.0,
            'items' => ['a', 'b'],
            'meta' => (object) ['x' => 1],
        ]);

        $this->assertSame(['value' => 5.0], AnalyticsEvent::pull()[0]['params']);
    }

    /** Every entry point sits inside a signup, a verification or a purchase. */
    public function test_pushing_without_a_session_never_throws(): void
    {
        $request = Request::create('/dashboard', 'GET');
        $this->app->instance('request', $request);

        AnalyticsEvent::push('sign_up');

        $this->assertSame([], AnalyticsEvent::pull());
    }

    /**
     * 🚨 The banned words are matched as whole SEGMENTS, not substrings.
     *
     * `ip` sits inside `descr`+`ip`+`tion` and `card` inside `discard`. A
     * substring match drops those parameters silently — no error, no log, just
     * a dimension that is permanently empty for a reason nobody can find.
     */
    public function test_an_innocent_key_that_merely_contains_a_banned_word_survives(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', [
            'description' => 'a wish',
            'discard_reason' => 'none',
            'value' => 5.0,
        ]);

        $this->assertSame(
            ['description' => 'a wish', 'discard_reason' => 'none', 'value' => 5.0],
            AnalyticsEvent::pull()[0]['params']
        );
    }

    /** …and the real thing is still caught, in every shape it actually arrives in. */
    public function test_identifying_keys_are_still_caught_as_segments(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', [
            'value' => 5.0,
            'guest_email' => 'a@b.c',
            'customer_name' => 'Real Person',
            'payment_intent_id' => 'pi_1',
            'client_ip' => '1.2.3.4',
            'ip' => '1.2.3.4',
            'stripe_token' => 'tok_1',
            'user_id' => 7,
        ]);

        $this->assertSame(['value' => 5.0], AnalyticsEvent::pull()[0]['params']);
    }

    /**
     * 🚨 GA4 has no boolean parameter type — its docs list string and number
     * only. The Measurement Protocol validator accepts `true` without
     * complaint and the value then registers ambiguously, which is how a
     * dimension ends up never appearing in the custom-definition list while
     * nothing anywhere reports an error.
     */
    public function test_booleans_are_sent_as_readable_strings(): void
    {
        $this->fakeRequest();

        AnalyticsEvent::push('purchase', [
            'guest' => true,
            'payouts_enabled' => false,
            'value' => 25.0,
        ]);

        $this->assertSame(
            ['guest' => 'true', 'payouts_enabled' => 'false', 'value' => 25.0],
            AnalyticsEvent::pull()[0]['params']
        );
    }
}
