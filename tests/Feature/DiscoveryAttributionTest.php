<?php

namespace Tests\Feature;

use App\Helpers;
use App\Models\DiscoveryEvent;
use App\Models\FinancialTransaction;
use App\Models\User;
use App\Services\Discovery\AttributionService;
use App\Services\Discovery\DiscoveryReportService;
use App\Services\VisitTracker;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * Discovery Phase 1 — attribution.
 *
 * 🚨 EVERYTHING LATER PHASES PUBLISH IS DERIVED FROM THIS. "Spenny Piggy
 * introduced 428 people to your profile" is a claim we make to creators about
 * their own business, and there is no backfill for a visit nobody recorded — so
 * the failure mode here is a number that is quietly wrong for ever, not an
 * error anyone sees.
 *
 * The two cases the brief asks to be demonstrated end to end are the first two
 * tests: a purchase that started on a Discovery surface is SP-generated, and one
 * from a direct link is creator-generated.
 */
class DiscoveryAttributionTest extends TestCase
{
    use RefreshDatabase;

    private function creator(): User
    {
        return User::factory()->create(['role' => 1]);
    }

    private function requestWithCookie(array $map, ?User $user = null): Request
    {
        $request = Request::create('/someone', 'GET');
        $request->cookies->set(DiscoverySources::COOKIE, json_encode($map));
        $request->cookies->set(VisitTracker::VISITOR_COOKIE, 'visitor-abc');

        if ($user) {
            $request->setUserResolver(fn () => $user);
        }

        return $request;
    }

    private function ledgerRow(User $creator, ?User $supporter, float $gbp = 20.0): FinancialTransaction
    {
        return FinancialTransaction::create([
            'user_id' => $creator->id,
            'supporter_id' => $supporter?->id,
            'type' => 'income',
            'gross_amount' => $gbp,
            'net_amount' => $gbp,
            'gbp_amount' => $gbp,
            'currency' => 'GBP',
            'status' => 'completed',
            'transaction_date' => Carbon::now(),
        ]);
    }

    /** @test */
    public function a_purchase_that_started_on_a_discovery_surface_is_sp_generated(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $request = $this->requestWithCookie([$creator->id => 'trending'], $supporter);
        $transaction = $this->ledgerRow($creator, $supporter);

        $source = app(AttributionService::class)->attributeTransaction($transaction, $request);

        $this->assertSame('trending', $source);

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => 'trending',
            'discovery_class' => DiscoverySources::CLASS_SP,
        ]);

        $this->assertDatabaseHas('discovery_events', [
            'creator_id' => $creator->id,
            'source' => 'trending',
            'traffic_class' => DiscoverySources::CLASS_SP,
            'event_type' => DiscoveryEvent::TYPE_PURCHASE,
            'financial_transaction_id' => $transaction->id,
        ]);
    }

    /** @test */
    public function a_purchase_from_a_direct_link_is_not_attributed_to_spenny_piggy(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        // No Discovery cookie at all — they arrived on the creator's own link.
        $request = Request::create('/someone', 'GET');
        $request->setUserResolver(fn () => $supporter);

        $transaction = $this->ledgerRow($creator, $supporter);

        $this->assertNull(
            app(AttributionService::class)->attributeTransaction($transaction, $request)
        );

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => null,
        ]);

        $this->assertSame(0, DiscoveryEvent::where('creator_id', $creator->id)->count());
    }

    /**
     * @test
     *
     * 🚨 A creator's own bio link is THEIR traffic. The brief is explicit —
     * "Sales from your link are yours and always recorded as your own traffic" —
     * and counting it as ours would inflate the one number this system exists to
     * make credible. It is still recorded, just never as SP.
     */
    public function the_creators_own_bio_link_is_recorded_but_never_counted_as_ours(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $request = $this->requestWithCookie([$creator->id => 'bio-link'], $supporter);
        $transaction = $this->ledgerRow($creator, $supporter, 50.0);

        app(AttributionService::class)->attributeTransaction($transaction, $request);

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => 'bio-link',
            'discovery_class' => DiscoverySources::CLASS_CREATOR,
        ]);

        // Recorded, but absent from every published figure.
        $report = app(DiscoveryReportService::class)->forCreator($creator->id);

        $this->assertSame(0, $report['transactions']);
        $this->assertSame(0.0, $report['attributed_earnings']);
    }

    /**
     * @test
     *
     * A cookie is visitor-controlled input. An unrecognised key must never reach
     * the database: the report enumerates a fixed set, so a stranger's string
     * would be stored and then never reported on — and an invented key that DID
     * resolve would let anyone write rows into a creator's numbers.
     */
    public function an_unreserved_source_key_is_refused(): void
    {
        $creator = $this->creator();

        $request = $this->requestWithCookie([$creator->id => 'not-a-real-source']);
        $transaction = $this->ledgerRow($creator, null);

        $this->assertNull(
            app(AttributionService::class)->attributeTransaction($transaction, $request)
        );

        $this->assertSame(0, DiscoveryEvent::count());
        $this->assertNull(DiscoverySources::normalise('not-a-real-source'));

        // And an unknown key never counts as ours.
        $this->assertSame(DiscoverySources::CLASS_CREATOR, DiscoverySources::classFor('not-a-real-source'));
    }

    /**
     * @test
     *
     * The published figure is "people discovered your profile", so someone who
     * opens the same profile six times is one person, not six.
     */
    public function a_repeat_visit_on_the_same_day_is_counted_once(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $service = app(AttributionService::class);
        $request = $this->requestWithCookie([$creator->id => 'trending'], $supporter);

        $this->assertTrue($service->recordVisit($request, $creator));
        $this->assertFalse($service->recordVisit($request, $creator));
        $this->assertFalse($service->recordVisit($request, $creator));

        $this->assertSame(1, DiscoveryEvent::where('event_type', DiscoveryEvent::TYPE_VISIT)->count());
    }

    /**
     * @test
     *
     * ⚠️ The cookie is a MAP keyed by creator. A supporter can arrive at creator
     * A from Trending and at creator B from that creator's own bio link in the
     * same browser; one global "last source" would credit Discovery with the
     * second sale.
     */
    public function each_creator_keeps_its_own_source(): void
    {
        $a = $this->creator();
        $b = $this->creator();
        $supporter = User::factory()->create();

        $request = $this->requestWithCookie([
            $a->id => 'trending',
            $b->id => 'bio-link',
        ], $supporter);

        $service = app(AttributionService::class);

        $this->assertSame('trending', $service->cookieSourceFor($request, $a->id));
        $this->assertSame('bio-link', $service->cookieSourceFor($request, $b->id));
    }

    /**
     * @test
     *
     * Without a cap, a crawler walking every profile grows the cookie past the
     * 4KB header limit, at which point the browser drops it silently and
     * attribution stops for that visitor entirely.
     */
    public function the_source_cookie_cannot_grow_without_limit(): void
    {
        $service = app(AttributionService::class);
        $request = Request::create('/', 'GET');
        $map = [];

        for ($i = 1; $i <= AttributionService::MAX_TRACKED_CREATORS + 15; $i++) {
            $request->cookies->set(DiscoverySources::COOKIE, json_encode($map));
            $map = $service->withSource($request, $i, 'trending');
        }

        $this->assertCount(AttributionService::MAX_TRACKED_CREATORS, $map);
        // The most recent creators survive; the oldest fall off.
        $this->assertArrayHasKey(AttributionService::MAX_TRACKED_CREATORS + 15, $map);
        $this->assertArrayNotHasKey(1, $map);
    }

    /**
     * @test
     *
     * The brief's definition of "new to this creator": no prior follow, support
     * or transaction. A returning buyer is a purchase, but not a NEW supporter,
     * and reporting them as new would overstate what Discovery produced.
     */
    public function a_returning_buyer_is_not_a_new_supporter(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        // They have bought from this creator before.
        $this->ledgerRow($creator, $supporter, 10.0);

        $request = $this->requestWithCookie([$creator->id => 'trending'], $supporter);
        $second = $this->ledgerRow($creator, $supporter, 30.0);

        app(AttributionService::class)->attributeTransaction($second, $request);

        $report = app(DiscoveryReportService::class)->forCreator($creator->id);

        $this->assertSame(1, $report['transactions']);
        $this->assertSame(0, $report['new_supporters'], 'A repeat buyer must not be reported as a new supporter.');
    }

    /** @test */
    public function the_monthly_report_returns_the_three_published_figures_and_a_source_breakdown(): void
    {
        $creator = $this->creator();
        $service = app(AttributionService::class);

        // Two different people find the creator through two different surfaces.
        foreach ([['visitor-1', 'trending'], ['visitor-2', 'new-creators']] as [$visitor, $source]) {
            $request = Request::create('/', 'GET');
            $request->cookies->set(DiscoverySources::COOKIE, json_encode([$creator->id => $source]));
            $request->cookies->set(VisitTracker::VISITOR_COOKIE, $visitor);

            $service->recordVisit($request, $creator);
        }

        // One of them buys.
        $buyer = User::factory()->create();
        $request = $this->requestWithCookie([$creator->id => 'trending'], $buyer);
        $service->attributeTransaction($this->ledgerRow($creator, $buyer, 625.0), $request);

        $report = app(DiscoveryReportService::class)->forCreator($creator->id);

        $this->assertSame(2, $report['introduced']);
        $this->assertSame(1, $report['new_supporters']);
        $this->assertSame(625.0, $report['attributed_earnings']);
        $this->assertSame(1, $report['transactions']);

        $this->assertArrayHasKey('trending', $report['by_source']);
        $this->assertArrayHasKey('new-creators', $report['by_source']);
        $this->assertSame(625.0, $report['by_source']['trending']['attributed_earnings']);
    }

    /**
     * @test
     *
     * ⚠️ The source is stored on the ledger row AND on the event, so the same
     * money can be read two ways. They must agree — when they do not, the ledger
     * is right, because it is what the creator is actually paid from.
     */
    public function the_event_total_reconciles_with_the_ledger(): void
    {
        $creator = $this->creator();
        $buyer = User::factory()->create();
        $request = $this->requestWithCookie([$creator->id => 'trending'], $buyer);

        app(AttributionService::class)->attributeTransaction($this->ledgerRow($creator, $buyer, 42.5), $request);

        $report = app(DiscoveryReportService::class)->forCreator($creator->id);
        $ledger = app(DiscoveryReportService::class)->ledgerEarnings($creator->id);

        $this->assertSame($ledger, $report['attributed_earnings']);
    }

    /**
     * @test
     *
     * A key the JS helper offers but PHP does not accept is silently dropped at
     * the server — the link looks tagged, and the attribution never happens.
     */
    public function the_javascript_source_keys_match_the_php_ones(): void
    {
        $js = file_get_contents(resource_path('js/lib/discoveryLink.js'));

        foreach (array_keys(DiscoverySources::KEYS) as $key) {
            $this->assertStringContainsString("'{$key}'", $js,
                "The JS helper is missing the reserved source key '{$key}', so any link using it "
                .'would be dropped by the server without an error.'
            );
        }

        // And nothing invented on the JS side.
        preg_match_all("/: '([a-z-]+)',/", $js, $matches);

        foreach ($matches[1] as $jsKey) {
            if ($jsKey === 'sp_d') {
                continue;
            }

            $this->assertArrayHasKey($jsKey, DiscoverySources::KEYS,
                "The JS helper offers '{$jsKey}', which the server does not accept."
            );
        }
    }

    /** @test */
    public function every_live_key_is_a_reserved_key(): void
    {
        foreach (DiscoverySources::LIVE_KEYS as $key) {
            $this->assertArrayHasKey($key, DiscoverySources::KEYS,
                "'{$key}' is marked as a live surface but is not a reserved key, so rows written "
                .'with it would be stored and never reported on.'
            );
        }
    }

    /**
     * @test
     *
     * 🚨 THE CASE THE COOKIE CAN NEVER COVER. A bank payment (SEPA/ACH) settles
     * days after the supporter closed the tab, so the ledger row is written by a
     * Stripe webhook with no browser attached. Without the source travelling in
     * the payment's own metadata, every one of those sales is invisible for ever.
     */
    public function a_purchase_settled_with_no_browser_is_attributed_from_its_stripe_metadata(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $transaction = $this->ledgerRow($creator, $supporter);

        $source = app(AttributionService::class)->attributeTransactionFromMetadata($transaction, [
            'creator_id' => (string) $creator->id,
            AttributionService::METADATA_KEY => 'trending',
        ]);

        $this->assertSame('trending', $source);

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => 'trending',
            'discovery_class' => DiscoverySources::CLASS_SP,
        ]);

        $this->assertDatabaseHas('discovery_events', [
            'financial_transaction_id' => $transaction->id,
            'event_type' => DiscoveryEvent::TYPE_PURCHASE,
            'source' => 'trending',
        ]);
    }

    /**
     * @test
     *
     * The webhook remembers the event's metadata once and every ledger row that
     * event writes is stamped from it — no processor has to know about Discovery.
     */
    public function a_ledger_row_written_while_a_payments_metadata_is_remembered_is_attributed_by_the_model_hook(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        AttributionService::rememberPaymentMetadata([
            'creator_id' => (string) $creator->id,
            AttributionService::METADATA_KEY => 'search-recs',
        ]);

        $transaction = $this->ledgerRow($creator, $supporter);

        AttributionService::forgetPaymentMetadata();

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => 'search-recs',
            'discovery_class' => DiscoverySources::CLASS_SP,
        ]);
    }

    /**
     * @test
     *
     * 🚨 `finance:sync-transactions` re-runs every 30 minutes and a webhook can
     * be redelivered. An attributed row must survive both untouched: last-touch
     * is decided at purchase time, never at replay time, and a second purchase
     * event would double every figure this table publishes.
     */
    public function replaying_a_payment_never_overwrites_the_source_or_duplicates_the_purchase_event(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $transaction = $this->ledgerRow($creator, $supporter);
        $service = app(AttributionService::class);

        $service->attributeTransactionFromMetadata($transaction, [
            'creator_id' => (string) $creator->id,
            AttributionService::METADATA_KEY => 'trending',
        ]);

        // A redelivery, and a resync reading a fresh copy of the same row.
        $service->attributeTransactionFromMetadata($transaction, [
            'creator_id' => (string) $creator->id,
            AttributionService::METADATA_KEY => 'new-creators',
        ]);

        $service->attributeTransactionFromMetadata(
            FinancialTransaction::find($transaction->id),
            [
                'creator_id' => (string) $creator->id,
                AttributionService::METADATA_KEY => 'new-creators',
            ]
        );

        $this->assertSame('trending', FinancialTransaction::find($transaction->id)->discovery_source);

        $this->assertSame(1, DiscoveryEvent::where('financial_transaction_id', $transaction->id)
            ->where('event_type', DiscoveryEvent::TYPE_PURCHASE)
            ->count());
    }

    /**
     * @test
     *
     * 🚨 One Stripe event can write several ledger rows — a basket spanning
     * creators, or a resync running while another payment's metadata is still
     * remembered. A source key only ever meant the creator whose cookie entry it
     * came from.
     */
    public function metadata_naming_a_different_creator_never_credits_this_ones_sale(): void
    {
        $creator = $this->creator();
        $otherCreator = $this->creator();
        $supporter = User::factory()->create();

        $transaction = $this->ledgerRow($creator, $supporter);

        $this->assertNull(
            app(AttributionService::class)->attributeTransactionFromMetadata($transaction, [
                'creator_id' => (string) $otherCreator->id,
                AttributionService::METADATA_KEY => 'trending',
            ])
        );

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => null,
        ]);

        $this->assertSame(0, DiscoveryEvent::where('event_type', DiscoveryEvent::TYPE_PURCHASE)->count());
    }

    /** @test */
    public function an_unreserved_source_in_metadata_is_refused(): void
    {
        $creator = $this->creator();
        $transaction = $this->ledgerRow($creator, null);

        $this->assertNull(
            app(AttributionService::class)->attributeTransactionFromMetadata($transaction, [
                'creator_id' => (string) $creator->id,
                AttributionService::METADATA_KEY => 'affiliate-payola',
            ])
        );

        $this->assertDatabaseHas('financial_transactions', [
            'id' => $transaction->id,
            'discovery_source' => null,
        ]);
    }

    /**
     * @test
     *
     * Checkout is the last moment a browser is present, so this is where the
     * source has to be handed to Stripe.
     */
    public function checkout_metadata_carries_the_source_for_the_creator_being_paid(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $this->app->instance('request', $this->requestWithCookie([$creator->id => 'trending'], $supporter));

        /*
         * ⚠️ EVERY PROPERTY THE 'support' BRANCH READS MUST BE PRESENT. This
         * fixture is a bare stdClass, and an Eloquent model returns null for an
         * attribute it does not have while a stdClass THROWS
         * ("Undefined property: stdClass::$message"). The first version of this
         * test set only uuid/creator_id/user_id and failed inside
         * `Helpers.php` rather than on its own assertion — a test-fixture
         * fault, not a production one: nothing in the app hands this function a
         * stdClass.
         */
        $payment = (object) [
            'uuid' => 'test-uuid',
            'creator_id' => $creator->id,
            'user_id' => $supporter->id,
            'user' => null,
            'creator' => null,
            'name' => null,
            'email' => null,
            'guest_name' => null,
            'guest_email' => null,
            'message' => null,
            'anonymous' => 0,
            'tip_goal_id' => null,
        ];

        $metadata = Helpers::buildStripeMetadata('support', $payment);

        $this->assertSame('trending', $metadata[AttributionService::METADATA_KEY] ?? null);
    }

    /**
     * @test
     *
     * ⚠️ A payment with no resolvable creator must OMIT the key, never guess.
     * An unattributed row is a gap; a wrongly attributed one is a false number
     * in front of a creator.
     */
    public function checkout_metadata_omits_the_source_when_no_creator_can_be_resolved(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $this->app->instance('request', $this->requestWithCookie([$creator->id => 'trending'], $supporter));

        // The platform subscription is nobody's creator sale.
        $metadata = Helpers::buildStripeMetadata('site_subscription', (object) [
            'uuid' => 'test-uuid',
            'user_id' => $supporter->id,
        ]);

        $this->assertArrayNotHasKey(AttributionService::METADATA_KEY, $metadata);
    }
}
