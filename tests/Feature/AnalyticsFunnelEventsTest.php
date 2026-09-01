<?php

namespace Tests\Feature;

use App\Models\AllowedDomain;
use App\Models\Deliverable;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The funnel milestones, end to end: a controller pushes, the NEXT render
 * carries it, and the render after that does not.
 *
 * `AnalyticsEventTest` covers the class in isolation. This covers the part that
 * unit tests cannot: that the event actually survives the redirect every one of
 * these milestones ends in, and arrives in `props.analytics` where
 * `resources/js/lib/analytics.js` looks for it. A push with no delivery is the
 * whole failure mode.
 */
class AnalyticsFunnelEventsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();
        AllowedDomain::query()->delete();
        AllowedDomain::create(['name' => 'gmail.com']);
    }

    /** The names the page actually received, in order. */
    private function eventsOn(string $url): array
    {
        $names = [];

        $this->get($url)->assertInertia(function (Assert $page) use (&$names) {
            $events = $page->toArray()['props']['analytics'] ?? [];
            $names = array_column($events, 'name');
        });

        return $names;
    }

    public function test_a_signup_reaches_the_browser_as_a_ga4_event(): void
    {
        Queue::fake();

        $this->post('/register', [
            'name' => 'New Creator',
            'username' => 'newcreator',
            'email' => 'newcreator@gmail.com',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            // Required for creators since 31 Aug 2026.
            'country' => 'GB',
            'country_code' => 'GB',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ]);

        $this->assertNotNull(
            User::where('email', 'newcreator@gmail.com')->first(),
            'Registration itself did not go through, so this test proves nothing.'
        );

        $this->assertSame(['sign_up'], $this->eventsOn(route('verification.notice')));
    }

    /**
     * 🚨 The reason the event carries an id at all. A back-navigation or a
     * partial reload re-renders the same page; the signup must stay one signup.
     */
    public function test_the_event_is_delivered_once_and_never_again(): void
    {
        Queue::fake();

        $this->post('/register', [
            'name' => 'Once Only',
            'username' => 'onceonly',
            'email' => 'onceonly@gmail.com',
            'password' => 'Str0ng-Passw0rd!',
            'password_confirmation' => 'Str0ng-Passw0rd!',
            // Required for creators since 31 Aug 2026.
            'country' => 'GB',
            'country_code' => 'GB',
            'role' => 1,
            'creator_email_receipt_ack' => true,
            'gender' => 'they',
            // ⚠️ Required for a creator since 25 Aug 2026 — see SignupSocialHandleTest.
            'social_platform' => 'instagram',
            'social_handle' => 'creatorhandle',
        ]);

        $this->assertSame(['sign_up'], $this->eventsOn(route('verification.notice')));
        $this->assertSame([], $this->eventsOn(route('verification.notice')));
    }

    public function test_verifying_from_the_emailed_link_emits_the_stage(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'email' => 'tobeverified@gmail.com',
            'email_verified_at' => null,
            'role' => 1,
        ]);

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->addHour(), ['uuid' => $user->uuid]);

        $this->get($url)->assertRedirect();

        $this->assertNotNull($user->fresh()->email_verified_at, 'The link did not verify, so this proves nothing.');

        $this->assertSame(
            ['email_verified'],
            $this->eventsOn(route('user.show', ['username' => $user->username]))
        );
    }

    /**
     * The stage counts people, not clicks. A forwarded link opened twice must
     * not out-count signup.
     */
    public function test_reopening_an_already_used_link_emits_nothing(): void
    {
        Queue::fake();

        $user = User::factory()->create([
            'email' => 'already@gmail.com',
            'email_verified_at' => now(),
            'role' => 1,
        ]);

        $url = URL::temporarySignedRoute('email.verify.uuid', now()->addHour(), ['uuid' => $user->uuid]);

        $this->get($url)->assertRedirect();

        $this->assertSame([], $this->eventsOn(route('login')));
    }

    /**
     * `purchase` hangs off Deliverable::created because that is the one choke
     * point every paid module passes through.
     */
    public function test_a_deliverable_created_in_a_web_request_emits_a_purchase(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $gifter = User::factory()->create(['role' => 0]);

        // Establishes the request/session the observer will see — the same thing
        // a redirect handler has when it writes the row.
        $this->actingAs($gifter)->get(route('user.show', ['username' => $creator->username]));

        Deliverable::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => 'prod_test',
            'item_id' => 1,
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'product_type' => 'wish',
            'deliverable_type' => 'digital',
            'transaction_amount' => 25.00,
            'payment_currency' => 'gbp',
            'status' => 'pending',
        ]);

        $names = [];
        $params = [];

        $this->get(route('user.show', ['username' => $creator->username]))
            ->assertInertia(function (Assert $page) use (&$names, &$params) {
                $events = $page->toArray()['props']['analytics'] ?? [];
                $names = array_column($events, 'name');
                $params = $events[0]['params'] ?? [];
            });

        $this->assertSame(['purchase'], $names);
        // assertEquals, not assertSame: the prop is read back through JSON, where
        // 25.0 and 25 are the same token. GA4 only needs the number.
        $this->assertEquals(25.0, $params['value']);
        $this->assertSame('GBP', $params['currency']);
        $this->assertSame('wish', $params['product_type']);
        // 🚨 The string "false", not a boolean. GA4 has no boolean parameter
        // type — see AnalyticsParams::scrub.
        $this->assertSame('false', $params['guest']);

        // 🚨 Nothing identifying may reach Google.
        $this->assertSame([], array_intersect(
            ['creator_id', 'gifter_id', 'customer_email', 'uuid'],
            array_keys($params)
        ));
    }

    /**
     * ⚠️ `purchase` is a REVENUE event. A Deliverable can be written with no
     * money attached (complimentary, administrative), and a £0 purchase drags
     * the reported average order value down while teaching Google Ads that some
     * purchases are worth nothing. The platform minimum is £4.99 — a zero here
     * is never a sale.
     */
    public function test_a_zero_value_deliverable_is_not_a_purchase(): void
    {
        $creator = User::factory()->create(['role' => 1]);
        $gifter = User::factory()->create(['role' => 0]);

        $this->actingAs($gifter)->get(route('user.show', ['username' => $creator->username]));

        Deliverable::create([
            'uuid' => (string) Str::uuid(),
            'product_id' => 'prod_free',
            'item_id' => 2,
            'creator_id' => $creator->id,
            'gifter_id' => $gifter->id,
            'product_type' => 'wish',
            'deliverable_type' => 'digital',
            'transaction_amount' => 0,
            'payment_currency' => 'gbp',
            'status' => 'pending',
        ]);

        $this->assertSame([], $this->eventsOn(route('user.show', ['username' => $creator->username])));
    }
}
