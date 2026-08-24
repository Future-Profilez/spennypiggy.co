<?php

namespace Tests\Feature;

use App\Models\BillPayment;
use App\Models\DiscoveryEvent;
use App\Models\FinancialTransaction;
use App\Models\MembershipPayment;
use App\Models\PiggyPotContribution;
use App\Models\RyeProductPayment;
use App\Models\ShopPayment;
use App\Models\StripePaymentDetail;
use App\Models\TaskPurchase;
use App\Models\TipGoalsPayment;
use App\Models\User;
use App\Models\WishItemSubscription;
use App\Services\Discovery\AttributionService;
use App\Services\VisitTracker;
use App\Support\DiscoverySources;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Discovery Phase 1 — the source persisted ON THE PAYMENT ROW.
 *
 * 🚨 THIS IS THE HALF OF PHASE 1 THE COOKIE AND THE STRIPE METADATA COULD NOT
 * REACH. Shop, task, bill, membership and wish ledger rows are not written by
 * the checkout or by the webhook — they are written by `finance:sync-transactions`,
 * in a queued worker with neither the visitor's cookie nor the event's metadata.
 * Carrying the ambient metadata across the queue was rejected deliberately: that
 * command rebuilds EVERY row belonging to a creator in one pass, so one payment's
 * source would leak onto all of them.
 *
 * So the source is persisted per payment, at the moment of purchase, and read
 * back per payment however long afterwards the sync runs.
 */
class DiscoveryPaymentSourceTest extends TestCase
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

    /**
     * @test
     *
     * 🚨 Every table `SyncFinancialTransactions` reads to build a ledger row has
     * to be able to carry the source, or that module is unattributable in
     * principle. The list is longer than the `fee_profile` one — bills,
     * memberships and Rye choose no payment method but do produce ledger rows.
     */
    public function every_payment_table_the_ledger_sync_reads_can_carry_a_source(): void
    {
        $tables = [
            'shop_payments',
            'task_purchases',
            'piggy_pot_contributions',
            'tip_goals_payments',
            'stripe_payment_details',
            'wish_item_subscriptions',
            'bill_payments',
            'membership_payments',
            'rye_product_payments',
        ];

        foreach ($tables as $table) {
            $this->assertTrue(
                Schema::hasColumn($table, 'discovery_source'),
                "{$table} cannot carry a Discovery source, so finance:sync-transactions can never attribute its ledger rows."
            );
        }
    }

    /**
     * @test
     *
     * ⚠️ A column nothing may write is the same as no column. Mass assignment is
     * how every one of these rows is created.
     */
    public function every_payment_model_may_write_the_source(): void
    {
        $models = [
            ShopPayment::class,
            TaskPurchase::class,
            PiggyPotContribution::class,
            TipGoalsPayment::class,
            StripePaymentDetail::class,
            WishItemSubscription::class,
            BillPayment::class,
            MembershipPayment::class,
            RyeProductPayment::class,
        ];

        foreach ($models as $model) {
            $this->assertTrue(
                (new $model)->isFillable('discovery_source'),
                $model.' silently drops discovery_source on create.'
            );
        }
    }

    /** @test */
    public function a_ledger_row_is_attributed_from_the_source_its_payment_row_carries(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $transaction = $this->ledgerRow($creator, $supporter);

        $source = app(AttributionService::class)
            ->attributeTransactionFromSource($transaction, 'trending');

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
     * 🚨 `finance:sync-transactions` re-runs every 30 minutes and calls this on
     * every row it touches. A second purchase event would double every figure
     * the table publishes, and re-stamping would let a replay decide last-touch.
     */
    public function re_running_the_sync_neither_overwrites_the_source_nor_duplicates_the_event(): void
    {
        $creator = $this->creator();
        $supporter = User::factory()->create();

        $transaction = $this->ledgerRow($creator, $supporter);
        $service = app(AttributionService::class);

        $service->attributeTransactionFromSource($transaction, 'trending');

        // A later run, with a different source on the payment row.
        $this->assertNull($service->attributeTransactionFromSource($transaction->fresh(), 'new-creators'));

        $this->assertSame('trending', $transaction->fresh()->discovery_source);

        $this->assertSame(1, DiscoveryEvent::query()
            ->where('financial_transaction_id', $transaction->id)
            ->where('event_type', DiscoveryEvent::TYPE_PURCHASE)
            ->count());
    }

    /**
     * @test
     *
     * ⚠️ The payment row is visitor-influenced data like any other: only a
     * reserved key may reach the ledger.
     */
    public function an_unreserved_source_on_a_payment_row_is_refused(): void
    {
        $creator = $this->creator();
        $transaction = $this->ledgerRow($creator, null);

        $service = app(AttributionService::class);

        $this->assertNull($service->attributeTransactionFromSource($transaction, 'facebook-ad'));
        $this->assertNull($service->attributeTransactionFromSource($transaction, null));
        $this->assertNull($transaction->fresh()->discovery_source);
        $this->assertSame(0, DiscoveryEvent::query()->count());
    }

    /**
     * @test
     *
     * 🚨 ONE RESOLUTION FOR THE COLUMN AND FOR THE STRIPE METADATA. A second
     * implementation is how a bank payment ends up attributed one way by the
     * webhook and another way by the sync.
     */
    public function the_source_persisted_on_a_payment_row_comes_from_that_creators_cookie_entry(): void
    {
        $creator = $this->creator();
        $other = $this->creator();
        $supporter = User::factory()->create();

        $this->app->instance('request', $this->requestWithCookie([$creator->id => 'trending'], $supporter));

        $this->assertSame('trending', AttributionService::sourceForCreator($creator->id));

        // ⚠️ A source key only ever meant the creator whose cookie entry produced
        // it — a second creator in the same browser must not inherit it.
        $this->assertNull(AttributionService::sourceForCreator($other->id));

        // Nothing resolvable: `platform`, blank, a type with no creator.
        $this->assertNull(AttributionService::sourceForCreator(null));
        $this->assertNull(AttributionService::sourceForCreator(0));
    }

    /**
     * @test
     *
     * A webhook-created row (a renewal, a settled bank payment) has no cookie —
     * the source has to come off the payment's own Stripe metadata instead.
     */
    public function with_no_cookie_the_source_falls_back_to_the_payments_stripe_metadata(): void
    {
        $creator = $this->creator();
        $other = $this->creator();

        $metadata = [
            'creator_id' => (string) $creator->id,
            AttributionService::METADATA_KEY => 'search-recs',
        ];

        $this->assertSame('search-recs', AttributionService::sourceForCreator($creator->id, $metadata));

        // ⚠️ One Stripe event can write rows for several creators.
        $this->assertNull(AttributionService::sourceForCreator($other->id, $metadata));

        // ⚠️ A Stripe metadata object arrives as a plain object, not an array.
        $this->assertSame('search-recs', AttributionService::sourceForCreator($creator->id, (object) $metadata));
    }
}
